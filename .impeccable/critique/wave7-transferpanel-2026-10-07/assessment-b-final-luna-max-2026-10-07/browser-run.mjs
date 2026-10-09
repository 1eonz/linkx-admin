import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-final-luna-max-2026-10-07');
const screenshotsDir = path.join(reportDir, 'screenshots');
const serverRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\codex-wave7-transferpanel-assessment-b-final-8db957db-3b76-4cfc-bcf2-c383da37cf30';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9515;
const pageUrl = 'http://127.0.0.1:4174/components/lxtransferpanel.html';
const detectUrl = 'http://127.0.0.1:8512/detect.js';
const profileDir = path.join(serverRoot, 'browser-profile');
mkdirSync(screenshotsDir, { recursive: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--new-window',
  '--window-size=1500,1100',
  pageUrl,
], { detached: true, stdio: 'ignore', windowsHide: false });
browser.unref();

async function waitForJson(url, timeoutMs = 15000) {
  const until = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status} for ${url}`);
    } catch (error) {
      lastError = error;
    }
    if (browser.exitCode !== null) throw new Error(`Chrome exited with code ${browser.exitCode}`);
    await delay(200);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

const version = await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
let targets = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
let target = targets.find((item) => item.type === 'page' && item.url.includes('4174'));
if (!target) {
  target = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' }).then((r) => r.json());
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleMessages = [];
const logMessages = [];
const requests = [];
const documentResponses = [];
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const args = (message.params.args || []).map((arg) => arg.value ?? arg.description ?? '').filter(Boolean);
    consoleMessages.push({
      type: message.params.type,
      text: args.map((arg) => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '),
      timestamp: message.params.timestamp,
    });
  }
  if (message.method === 'Log.entryAdded') {
    const { entry } = message.params;
    logMessages.push({ level: entry.level, source: entry.source, text: entry.text, url: entry.url || '' });
  }
  if (message.method === 'Network.requestWillBeSent') {
    const url = message.params.request.url;
    let origin = url;
    try { origin = new URL(url).origin; } catch { /* retain the original URL */ }
    requests.push({ url, origin, type: message.params.type || 'Other' });
  }
  if (message.method === 'Network.responseReceived' && message.params.type === 'Document') {
    documentResponses.push({ url: message.params.response.url, status: message.params.response.status, mimeType: message.params.response.mimeType });
  }
});

function send(method, params = {}, timeoutMs = 30000) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
    timeout: 30000,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  }
  return response.result?.value;
}

async function waitFor(expression, timeoutMs = 20000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await evaluate(expression)) return true;
    await delay(250);
  }
  throw new Error(`Timed out waiting for page condition: ${expression}`);
}

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pageUrl });
await waitFor("document.readyState === 'complete'");
await waitFor("Boolean(document.querySelector('.transfer-panel-demo .lx-transfer-panel'))");
await delay(500);

const reachability = await evaluate(`(() => ({
  href: location.href,
  title: document.title,
  readyState: document.readyState,
  demoPresent: Boolean(document.querySelector('.transfer-panel-demo')),
  panelPresent: Boolean(document.querySelector('.transfer-panel-demo .lx-transfer-panel')),
  documentWidth: document.documentElement.scrollWidth,
  viewportWidth: innerWidth,
}))()`);

const preflight = await evaluate(`(() => {
  const originalTitle = document.title;
  document.title = '[Human] LxTransferPanel Assessment B';
  const probe = document.createElement('script');
  probe.dataset.assessmentBPreflight = 'true';
  probe.textContent = 'window.__assessmentBPreflightExecuted = true';
  document.head.appendChild(probe);
  return {
    originalTitle,
    updatedTitle: document.title,
    scriptAppended: probe.isConnected,
    scriptExecuted: window.__assessmentBPreflightExecuted === true,
  };
})()`);

await evaluate(`(() => {
  const details = document.querySelector('.transfer-panel-demo__settings');
  if (details) details.open = true;
  const demo = document.querySelector('.transfer-panel-demo');
  if (demo) window.scrollTo(0, demo.getBoundingClientRect().top + window.scrollY - 72);
})()`);

const viewEvidence = [];

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  writeFileSync(path.join(screenshotsDir, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function setState(label) {
  return evaluate(`(() => {
    const button = [...document.querySelectorAll('.transfer-panel-demo button')]
      .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
}

async function setHud(enabled) {
  return evaluate(`(() => {
    const label = [...document.querySelectorAll('.transfer-panel-demo label')]
      .find((item) => item.textContent.includes('HUD 深色主题'));
    const input = label?.querySelector('input[type="checkbox"]');
    if (!input || input.checked === ${enabled}) return Boolean(input);
    input.click();
    return input.checked === ${enabled};
  })()`);
}

async function viewState(name, { state, hud, viewport, mobile = false } = {}) {
  if (viewport) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      mobile,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 1 : 0 });
  }
  if (state) await setState(state);
  if (typeof hud === 'boolean') await setHud(hud);
  await delay(350);
  await evaluate(`(() => {
    const demo = document.querySelector('.transfer-panel-demo');
    if (demo) window.scrollTo(0, demo.getBoundingClientRect().top + window.scrollY - 72);
  })()`);
  await delay(250);
  const beforeScan = consoleMessages.length;
  const summary = await evaluate(`(() => {
    if (typeof window.impeccableScan !== 'function') return { available: false, findings: [] };
    const result = window.impeccableScan();
    const findings = (Array.isArray(result) ? result : []).map(({ el, findings: entries }) => ({
      tag: el?.tagName?.toLowerCase() || '',
      id: el?.id || '',
      classes: el?.className?.toString?.() || '',
      text: (el?.innerText || el?.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 180),
      outerHTML: (el?.outerHTML || '').slice(0, 420),
      insideTransferPanelDemo: Boolean(el?.closest?.('.transfer-panel-demo')),
      findings: (entries || []).map((finding) => Object.fromEntries(
        Object.entries(finding).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
      )),
    }));
    return {
      available: true,
      findingCount: findings.reduce((count, item) => count + item.findings.length, 0),
      findings,
      overlayNodeCount: document.querySelectorAll('[class*="impeccable"]').length,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      viewport: { width: innerWidth, height: innerHeight, mobile: ${mobile} },
      statusText: document.querySelector('.transfer-panel-demo__status')?.innerText?.trim() || '',
      alertText: document.querySelector('.transfer-panel-demo [role="alert"]')?.innerText?.trim() || '',
      busy: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy') || null,
      hudTheme: Boolean(document.querySelector('.transfer-panel-demo.lx-theme-hud')),
      selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText?.trim() || '',
      treeCount: document.querySelector('[data-testid="tree-node-count"]')?.innerText?.trim() || '',
      scrollY: window.scrollY,
    };
  })()`);
  await delay(500);
  await screenshot(name);
  const after = consoleMessages.length;
  const stateEvidence = {
    name,
    ...summary,
    console: consoleMessages.slice(beforeScan, after),
    logErrors: logMessages.filter((item) => item.level === 'error'),
  };
  viewEvidence.push(stateEvidence);
  return stateEvidence;
}

await screenshot('page-top');
await screenshot('default');

const injectionStart = consoleMessages.length;
const injection = await evaluate(`new Promise((resolve) => {
  const script = document.createElement('script');
  script.id = 'assessment-b-impeccable-detector';
  script.src = ${JSON.stringify(detectUrl)};
  script.onload = () => resolve({ loaded: true, src: script.src, readyState: document.readyState });
  script.onerror = () => resolve({ loaded: false, src: script.src, readyState: document.readyState });
  document.head.appendChild(script);
})`);
await delay(2500);
const overlayReady = await evaluate(`({
  scanFunction: typeof window.impeccableScan,
  detectFunction: typeof window.impeccableDetect,
  scriptPresent: Boolean(document.querySelector('#assessment-b-impeccable-detector')),
  scriptLoaded: document.querySelector('#assessment-b-impeccable-detector')?.readyState || 'load-event-recorded',
})`);
await screenshot('default-overlay');
await viewState('default-overlay-scan', { state: '正常数据', hud: false });
await viewState('hud-overlay', { state: '正常数据', hud: true });
await viewState('empty-overlay', { state: '空结果' });
await viewState('loading-overlay', { state: '加载中' });
await viewState('error-overlay', { state: '加载失败' });
await viewState('mobile-overlay', { state: '正常数据', hud: false, viewport: { width: 390, height: 844 }, mobile: true });

const filteredConsole = consoleMessages.filter((item) => /impeccable/i.test(item.text));
const externalRequests = requests.filter((item) => {
  try {
    const hostname = new URL(item.url).hostname;
    return hostname !== '127.0.0.1' && hostname !== 'localhost';
  } catch {
    return false;
  }
});

const evidence = {
  browser: {
    product: version.Browser,
    userAgent: version['User-Agent'],
    processId: browser.pid,
    debugPort,
    profileDir,
    context: '独立 Chrome 进程与新 user-data-dir；本次新窗口/新页面 target',
    pageTargetId: target.id,
    pageTitle: preflight.updatedTitle,
  },
  target: {
    url: pageUrl,
    reachable: true,
    initial: reachability,
    documentResponses,
  },
  injectionPreflight: preflight,
  overlayInjection: {
    scriptUrl: detectUrl,
    result: injection,
    runtime: overlayReady,
    consoleAfterInjection: consoleMessages.slice(injectionStart),
    detectorFunctionAvailable: overlayReady.scanFunction === 'function',
    invokedByState: viewEvidence.map(({ name, available, findingCount }) => ({ name, available, findingCount })),
  },
  views: viewEvidence,
  network: {
    totalRequests: requests.length,
    externalRequestCount: externalRequests.length,
    externalOrigins: [...new Set(externalRequests.map(({ origin }) => origin))],
    externalRequests,
  },
  console: {
    impeccable: filteredConsole,
    allMessages: consoleMessages,
    logEntries: logMessages,
  },
  screenshots: viewEvidence.map(({ name }) => `screenshots/${name}.png`).concat(['screenshots/page-top.png', 'screenshots/default.png', 'screenshots/default-overlay.png']),
};

writeFileSync(path.join(reportDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'browser-console.json'), `${JSON.stringify({ impeccable: filteredConsole, all: consoleMessages, log: logMessages }, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'browser-network.json'), `${JSON.stringify(evidence.network, null, 2)}\n`);
writeFileSync(path.join(reportDir, 'browser-injection.json'), `${JSON.stringify({ target: evidence.target, injectionPreflight: preflight, overlayInjection: evidence.overlayInjection }, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  browserPid: browser.pid,
  debugPort,
  target: reachability,
  injectionPreflight: preflight,
  overlay: { injection, runtime: overlayReady, findingsByView: evidence.overlayInjection.invokedByState },
  externalRequestCount: externalRequests.length,
  screenshots: evidence.screenshots,
}, null, 2)}\n`);
