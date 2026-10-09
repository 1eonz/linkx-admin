import fs from 'node:fs/promises';
import path from 'node:path';

const [debugPort, targetUrl, overlayPort, evidenceDir] = process.argv.slice(2);
if (!debugPort || !targetUrl || !overlayPort || !evidenceDir) {
  throw new Error('Usage: node browser-evidence.mjs <cdp-port> <target-url> <overlay-port> <evidence-dir>');
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const eventRecords = [];
const pending = new Map();
let nextId = 1;
let ws;
let sessionId;
let browserContextId;
let targetId;

async function saveJson(name, value) {
  await fs.writeFile(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function openSocket(url) {
  ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', async (event) => {
    const raw = typeof event.data === 'string' ? event.data : await event.data.text();
    const message = JSON.parse(raw);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(`${entry.method}: ${message.error.message}`));
      else entry.resolve(message.result ?? {});
      return;
    }
    if (message.method) eventRecords.push({ method: message.method, params: message.params ?? {}, sessionId: message.sessionId ?? null });
  });
}

function command(method, params = {}, scopedSession = undefined) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params, ...(scopedSession ? { sessionId: scopedSession } : {}) }));
  });
}

function pageCommand(method, params = {}) {
  return command(method, params, sessionId);
}

async function evaluate(expression) {
  const result = await pageCommand('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Page evaluation failed');
  }
  return result.result?.value;
}

async function screenshot(name) {
  const result = await pageCommand('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
  });
  await fs.writeFile(path.join(evidenceDir, name), Buffer.from(result.data, 'base64'));
}

function consoleRecords() {
  return eventRecords.flatMap((record) => {
    if (record.method === 'Runtime.consoleAPICalled') {
      const args = (record.params.args ?? []).map((arg) => arg.value ?? arg.description ?? arg.type);
      return [{ type: 'console', level: record.params.type, text: args.map(String).join(' '), timestamp: record.params.timestamp }];
    }
    if (record.method === 'Log.entryAdded') {
      const entry = record.params.entry ?? {};
      return [{ type: 'log', level: entry.level, text: entry.text, url: entry.url, lineNumber: entry.lineNumber }];
    }
    if (record.method === 'Runtime.exceptionThrown') {
      const detail = record.params.exceptionDetails ?? {};
      return [{ type: 'exception', text: detail.exception?.description ?? detail.text, url: detail.url, lineNumber: detail.lineNumber }];
    }
    return [];
  });
}

const result = {
  targetUrl,
  cdpPort: Number(debugPort),
  browserAutomation: 'Chrome DevTools Protocol over Node built-in WebSocket',
  puppeteerInstalled: false,
  puppeteerAvailability: 'Puppeteer and Puppeteer Core are not installed; direct CDP fallback used.',
  browserContextCreated: false,
  newTabCreated: false,
  navigation: null,
  pageAccessible: false,
  domInjectionProbe: null,
  detectorScript: null,
  detectorMessages: [],
  themeCapture: null,
  representativeStateCapture: null,
  errors: [],
};

try {
  const versionResponse = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
  const browserInfo = await versionResponse.json();
  result.browser = { product: browserInfo.Browser, protocolVersion: browserInfo['Protocol-Version'] };
  await openSocket(browserInfo.webSocketDebuggerUrl);

  const context = await command('Target.createBrowserContext', { disposeOnDetach: true });
  browserContextId = context.browserContextId;
  result.browserContextCreated = Boolean(browserContextId);

  const target = await command('Target.createTarget', { url: 'about:blank', browserContextId });
  targetId = target.targetId;
  result.newTabCreated = Boolean(targetId);

  const attached = await command('Target.attachToTarget', { targetId, flatten: true });
  sessionId = attached.sessionId;
  await Promise.all([
    pageCommand('Page.enable'),
    pageCommand('Runtime.enable'),
    pageCommand('Log.enable'),
    pageCommand('Network.enable'),
    pageCommand('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    }),
  ]);

  const navigation = await pageCommand('Page.navigate', { url: targetUrl });
  result.navigation = { frameId: navigation.frameId, errorText: navigation.errorText ?? null };
  await wait(4500);
  const initial = await evaluate(`(() => ({
    readyState: document.readyState,
    title: document.title,
    url: location.href,
    textLength: document.body?.innerText?.length ?? 0,
    bodyText: document.body?.innerText?.slice(0, 7000) ?? '',
    viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
    rootBackground: getComputedStyle(document.documentElement).backgroundColor,
    bodyBackground: document.body ? getComputedStyle(document.body).backgroundColor : null,
    headings: [...document.querySelectorAll('h1,h2,h3')].map(e => ({ tag: e.tagName, text: e.innerText.trim() })).slice(0, 40),
    controls: [...document.querySelectorAll('button,[role="button"],input,select,[role="checkbox"]')].map(e => ({
      tag: e.tagName,
      role: e.getAttribute('role'),
      text: (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || e.placeholder || '').trim().slice(0, 140),
      type: e.getAttribute('type'),
      disabled: Boolean(e.disabled || e.getAttribute('aria-disabled') === 'true'),
      checked: 'checked' in e ? e.checked : e.getAttribute('aria-checked'),
      className: typeof e.className === 'string' ? e.className : '',
      rect: (() => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })(),
    })).filter(e => e.rect.width > 0 && e.rect.height > 0).slice(0, 180),
    themeControls: [...document.querySelectorAll('button,[role="button"],[aria-label],[title]')].filter(e => /theme|dark|light|主题|深色|浅色|暗色/i.test([e.innerText,e.getAttribute('aria-label'),e.title].join(' '))).map(e => ({ tag: e.tagName, text: (e.innerText || '').trim(), ariaLabel: e.getAttribute('aria-label'), title: e.title })).slice(0, 20),
    componentRoots: [...document.querySelectorAll('[class*="transfer-panel" i]')].map(e => ({ className: e.className, text: e.innerText.slice(0, 2500), rect: (() => { const r=e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}; })() })).slice(0, 10),
  }))()`);
  result.pageAccessible = initial.readyState !== 'loading' && initial.textLength > 0 && initial.url === targetUrl;
  result.initialPage = initial;
  await saveJson('browser-dom.json', initial);
  await screenshot('page-initial.png');

  const injectionExpression = `new Promise(resolve => {
    document.title = document.title + ' [Assessment B]';
    window.__assessmentBMutationProbe = 'dom-mutation-ok';
    const script = document.createElement('script');
    script.src = ${JSON.stringify(`http://localhost:${overlayPort}/detect.js`)};
    script.onload = () => resolve({ appended: script.isConnected, loaded: true, src: script.src, probe: window.__assessmentBMutationProbe });
    script.onerror = () => resolve({ appended: script.isConnected, loaded: false, src: script.src, probe: window.__assessmentBMutationProbe, error: 'script element emitted error' });
    document.head.appendChild(script);
    setTimeout(() => resolve({ appended: script.isConnected, loaded: false, src: script.src, probe: window.__assessmentBMutationProbe, error: 'script load timeout' }), 8000);
  })`;
  result.domInjectionProbe = await evaluate(injectionExpression);
  await wait(3000);
  result.detectorScript = await evaluate(`(() => ({
    loadedScript: [...document.scripts].some(s => s.src === ${JSON.stringify(`http://localhost:${overlayPort}/detect.js`)}),
    title: document.title,
    mutationProbe: window.__assessmentBMutationProbe,
    detectorGlobals: Object.keys(window).filter(k => /impeccable|detect/i.test(k)).slice(0, 30),
  }))()`);
  const allConsoleRecords = consoleRecords();
  const overlayStart = allConsoleRecords.findIndex((entry) => (
    entry.level === 'startGroup' && /\[impeccable\]/i.test(entry.text ?? '')
  ));
  const overlayEnd = overlayStart < 0
    ? -1
    : allConsoleRecords.findIndex((entry, index) => index > overlayStart && entry.level === 'endGroup');
  const overlayMessages = overlayStart < 0
    ? []
    : allConsoleRecords.slice(overlayStart, overlayEnd < 0 ? undefined : overlayEnd + 1);
  result.detectorMessages = overlayMessages;
  await saveJson('browser-console.json', consoleRecords());
  await saveJson('overlay-console.json', overlayMessages);
  await screenshot('detector-overlay.png');

  const themeAction = await evaluate(`(() => {
    const candidates = [...document.querySelectorAll('button,[role="button"],[aria-label],[title]')].filter(e => /theme|dark|light|主题|深色|浅色|暗色/i.test([e.innerText,e.getAttribute('aria-label'),e.title].join(' ')));
    if (!candidates.length) return { available: false, reason: 'No visible theme control found' };
    const control = candidates.find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0);
    if (!control) return { available: false, reason: 'Theme control is not visible' };
    control.click();
    return { available: true, label: (control.innerText || control.getAttribute('aria-label') || control.title || '').trim(), className: typeof control.className === 'string' ? control.className : '' };
  })()`);
  if (themeAction.available) {
    await wait(700);
    const themeState = await evaluate(`(() => ({
      rootClass: document.documentElement.className,
      rootTheme: document.documentElement.getAttribute('data-theme'),
      bodyClass: document.body.className,
      rootBackground: getComputedStyle(document.documentElement).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      title: document.title,
    }))()`);
    result.themeCapture = { action: themeAction, state: themeState, screenshot: 'theme-alternate.png' };
    await saveJson('theme-state.json', result.themeCapture);
    await screenshot('theme-alternate.png');
  } else {
    result.themeCapture = { action: themeAction, state: { rootBackground: initial.rootBackground, bodyBackground: initial.bodyBackground }, screenshot: 'page-initial.png' };
    await saveJson('theme-state.json', result.themeCapture);
  }

  const stateAction = await evaluate(`(() => {
    const root = [...document.querySelectorAll('.lx-transfer-panel')].find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0);
    if (!root) return { available: false, reason: 'No visible transfer panel root found' };
    root.scrollIntoView({ block: 'center', inline: 'nearest' });
    const input = [...root.querySelectorAll('input[type="checkbox"]')].find(e => !e.disabled && !e.checked);
    const roleCheckbox = [...root.querySelectorAll('[role="checkbox"]')].find(e => e.getAttribute('aria-disabled') !== 'true' && e.getAttribute('aria-checked') !== 'true');
    const target = input || roleCheckbox;
    if (!target) return { available: false, reason: 'No unchecked enabled checkbox found in the transfer panel', rootText: root.innerText.slice(0, 1200) };
    const before = { checked: 'checked' in target ? target.checked : target.getAttribute('aria-checked'), label: target.getAttribute('aria-label') || target.closest('label')?.innerText || target.parentElement?.innerText?.slice(0, 100) || '' };
    target.click();
    return { available: true, before, rootText: root.innerText.slice(0, 1800), rootClass: root.className };
  })()`);
  if (stateAction.available) {
    await wait(450);
    const stateAfter = await evaluate(`(() => {
      const root = [...document.querySelectorAll('.lx-transfer-panel')].find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0);
      return { rootText: root?.innerText?.slice(0, 1800) ?? '', selectedCheckboxes: root ? [...root.querySelectorAll('input[type="checkbox"]')].filter(e => e.checked).length + [...root.querySelectorAll('[role="checkbox"][aria-checked="true"]')].length : null, bodyBackground: getComputedStyle(document.body).backgroundColor };
    })()`);
    result.representativeStateCapture = { action: stateAction, after: stateAfter, screenshot: 'state-selected.png' };
    await saveJson('representative-state.json', result.representativeStateCapture);
    await screenshot('state-selected.png');
  } else {
    result.representativeStateCapture = { action: stateAction, screenshot: 'page-initial.png' };
    await saveJson('representative-state.json', result.representativeStateCapture);
  }

  const responses = eventRecords.filter((record) => record.method === 'Network.responseReceived').map((record) => ({
    url: record.params.response?.url,
    status: record.params.response?.status,
    type: record.params.type,
    mimeType: record.params.response?.mimeType,
  }));
  result.networkResponses = responses;
  result.errors = consoleRecords().filter((entry) => entry.level === 'error' || entry.type === 'exception');
  await saveJson('browser-result.json', result);
  await saveJson('browser-network.json', responses);
} catch (error) {
  result.errors.push({ stage: 'fatal', message: error instanceof Error ? error.message : String(error) });
  result.detectorMessages = consoleRecords().filter((entry) => /impeccable|detect/i.test(entry.text ?? ''));
  await saveJson('browser-console.json', consoleRecords()).catch(() => {});
  await saveJson('overlay-console.json', result.detectorMessages).catch(() => {});
  await saveJson('browser-result.json', result).catch(() => {});
  process.exitCode = 1;
} finally {
  if (browserContextId && ws?.readyState === WebSocket.OPEN) {
    await command('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  }
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
}

process.stdout.write(`${JSON.stringify({
  browserContextCreated: result.browserContextCreated,
  newTabCreated: result.newTabCreated,
  pageAccessible: result.pageAccessible,
  domInjectionProbe: result.domInjectionProbe,
  detectorScriptLoaded: result.detectorScript?.loadedScript ?? false,
  detectorMessages: result.detectorMessages.length,
  themeCapture: result.themeCapture?.screenshot,
  representativeStateCapture: result.representativeStateCapture?.screenshot,
  errors: result.errors,
}, null, 2)}\n`);
