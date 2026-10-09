import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const browserDir = path.join(evidenceDir, 'browser');
const stage = process.argv[2];
const port = Number(process.argv[3] || 9355);
const routes = [
  {
    key: 'lxtransferpanel',
    url: 'http://127.0.0.1:4174/components/lxtransferpanel.html',
  },
  {
    key: 'lxvirtualtree',
    url: 'http://127.0.0.1:4174/components/lxvirtualtree.html',
  },
];

await fs.promises.mkdir(browserDir, { recursive: true });

class CdpConnection {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Set();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data.toString());
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        clearTimeout(pending.timeout);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  static async connect(browserPort) {
    const version = await fetch(`http://127.0.0.1:${browserPort}/json/version`).then((response) => response.json());
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    return new CdpConnection(ws);
  }

  call(method, params = {}, sessionId) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 30000);
      this.pending.set(id, { resolve, reject, timeout });
      const message = { id, method, params };
      if (sessionId) message.sessionId = sessionId;
      this.ws.send(JSON.stringify(message));
    });
  }

  onMessage(listener) {
    this.listeners.add(listener);
  }

  close() {
    this.ws.close();
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function evaluate(connection, sessionId, expression) {
  const response = await connection.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || 'Page evaluation failed');
  }
  return response.result?.value;
}

async function waitForDocument(connection, sessionId) {
  const deadline = Date.now() + 20000;
  let readyState = 'unknown';
  while (Date.now() < deadline) {
    readyState = await evaluate(connection, sessionId, 'document.readyState').catch(() => 'unavailable');
    if (readyState === 'complete') return { readyState, timedOut: false };
    await delay(150);
  }
  return { readyState, timedOut: true };
}

async function attachPage(connection, targetId) {
  const { sessionId } = await connection.call('Target.attachToTarget', { targetId, flatten: true });
  const events = [];
  connection.onMessage((message) => {
    if (message.sessionId !== sessionId || !message.method) return;
    if (
      message.method.startsWith('Runtime.console')
      || message.method === 'Runtime.exceptionThrown'
      || message.method === 'Log.entryAdded'
      || message.method === 'Network.responseReceived'
      || message.method === 'Page.loadEventFired'
    ) {
      events.push({ at: new Date().toISOString(), method: message.method, params: message.params });
    }
  });
  await connection.call('Page.enable', {}, sessionId);
  await connection.call('Runtime.enable', {}, sessionId);
  await connection.call('Network.enable', {}, sessionId);
  await connection.call('Log.enable', {}, sessionId);
  return { sessionId, events };
}

async function setViewport(connection, sessionId, width, height, mobile) {
  await connection.call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  }, sessionId);
}

const metricsExpression = `(() => {
  const viewportWidth = window.innerWidth;
  const candidates = [...document.querySelectorAll('body *')]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 90),
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        position: style.position,
        display: style.display,
      };
    })
    .filter((item) => item.width > 0 && item.right > viewportWidth + 1 && item.display !== 'none')
    .sort((a, b) => b.right - a.right)
    .slice(0, 16);
  return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
    document: {
      htmlClientWidth: document.documentElement.clientWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.body?.clientWidth ?? null,
      bodyScrollWidth: document.body?.scrollWidth ?? null,
    },
    overflowCandidates: candidates,
  };
})()`;

const themeInfoExpression = `(() => {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark') || document.body.classList.contains('dark');
  const controls = [...document.querySelectorAll('button,[role="button"]')].map((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const label = [
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.innerText,
      typeof element.className === 'string' ? element.className : '',
    ].filter(Boolean).join(' ').trim().replace(/\\s+/g, ' ').slice(0, 140);
    return {
      label,
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
      disabled: Boolean(element.disabled),
    };
  });
  return {
    theme: isDark ? 'dark' : 'light',
    htmlClass: root.className,
    bodyClass: document.body?.className || '',
    themeColor: getComputedStyle(root).colorScheme,
    controls,
    likelyThemeControls: controls.filter((item) => /appearance|theme|dark mode|color scheme|color theme/i.test(item.label)),
  };
})()`;

const setThemeExpression = (theme) => `(() => {
  const wanted = ${JSON.stringify(theme)};
  const isDark = () => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  const before = isDark() ? 'dark' : 'light';
  if (before === wanted) return { before, after: before, changed: false, control: null };
  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  };
  const controls = [...document.querySelectorAll('button,[role="button"]')];
  const control = controls.find((element) => {
    const label = [
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.innerText,
      typeof element.className === 'string' ? element.className : '',
    ].filter(Boolean).join(' ');
    return isVisible(element) && /appearance|theme|dark mode|color scheme|color theme/i.test(label);
  });
  if (!control) return { before, after: before, changed: false, control: null };
  const label = [control.getAttribute('aria-label'), control.getAttribute('title'), control.innerText]
    .filter(Boolean).join(' ').trim().slice(0, 140);
  control.click();
  return { before, after: isDark() ? 'dark' : 'light', changed: true, control: label };
})()`;

async function preflight() {
  const connection = await CdpConnection.connect(port);
  const evidence = { createdAt: new Date().toISOString(), browserPort: port, targets: [] };
  for (const route of routes) {
    const { browserContextId } = await connection.call('Target.createBrowserContext', { disposeOnDetach: false });
    const { targetId } = await connection.call('Target.createTarget', { url: 'about:blank', browserContextId });
    const page = await attachPage(connection, targetId);
    await setViewport(connection, page.sessionId, 1440, 900, false);
    const navigation = await connection.call('Page.navigate', { url: route.url }, page.sessionId);
    const load = await waitForDocument(connection, page.sessionId);
    const unInjectedDesktopWidth = await evaluate(connection, page.sessionId, metricsExpression);
    await setViewport(connection, page.sessionId, 375, 812, true);
    await delay(200);
    const unInjectedMobileWidth = await evaluate(connection, page.sessionId, metricsExpression);
    await setViewport(connection, page.sessionId, 1440, 900, false);
    const mutation = await evaluate(connection, page.sessionId, `(() => {
      const titleBefore = document.title;
      document.title = '[Assessment B DOM mutation] ' + titleBefore;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.dataset.assessmentBPreflight = 'true';
      script.textContent = 'window.__assessmentBPreflightScriptRan = true;';
      document.head.appendChild(script);
      return {
        titleBefore,
        titleAfter: document.title,
        titleMutationSucceeded: document.title === ('[Assessment B DOM mutation] ' + titleBefore).trim(),
        scriptTagInserted: script.isConnected && script.tagName === 'SCRIPT',
        scriptExecuted: window.__assessmentBPreflightScriptRan === true,
      };
    })()`);
    const routeResponses = page.events
      .filter((event) => event.method === 'Network.responseReceived' && event.params.response.url === route.url)
      .map((event) => ({ status: event.params.response.status, url: event.params.response.url, type: event.params.type }));
    evidence.targets.push({
      key: route.key,
      url: route.url,
      browserContextId,
      targetId,
      sessionId: page.sessionId,
      navigation,
      load,
      routeResponses,
      unInjectedWidths: {
        desktop: unInjectedDesktopWidth,
        mobile: unInjectedMobileWidth,
      },
      mutableDomPreflight: mutation,
    });
  }
  writeJson(path.join(evidenceDir, 'browser-state.json'), { browserPort: port, targets: evidence.targets.map(({ key, url, browserContextId, targetId }) => ({ key, url, browserContextId, targetId })) });
  writeJson(path.join(browserDir, 'preflight.json'), evidence);
  connection.close();
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

function simplifyConsoleEvent(event) {
  if (event.method === 'Runtime.consoleAPICalled') {
    const args = event.params.args || [];
    return {
      source: 'console',
      level: event.params.type,
      text: args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
      at: event.at,
    };
  }
  if (event.method === 'Runtime.exceptionThrown') {
    return {
      source: 'exception',
      level: 'error',
      text: event.params.exceptionDetails?.text || event.params.exceptionDetails?.exception?.description || 'Unhandled exception',
      url: event.params.exceptionDetails?.url,
      lineNumber: event.params.exceptionDetails?.lineNumber,
      at: event.at,
    };
  }
  if (event.method === 'Log.entryAdded') {
    return {
      source: 'log',
      level: event.params.entry.level,
      text: event.params.entry.text,
      url: event.params.entry.url,
      at: event.at,
    };
  }
  return null;
}

async function captureView(connection, target, route, theme, viewport) {
  const page = await attachPage(connection, target.targetId);
  await setViewport(connection, page.sessionId, 1440, 900, false);
  const navigation = await connection.call('Page.navigate', { url: route.url }, page.sessionId);
  const load = await waitForDocument(connection, page.sessionId);
  const themeBefore = await evaluate(connection, page.sessionId, themeInfoExpression);
  let themeAction = { requested: theme, before: themeBefore.theme, changed: false, control: null };
  if (themeBefore.theme !== theme) {
    const result = await evaluate(connection, page.sessionId, setThemeExpression(theme));
    themeAction = { requested: theme, ...result };
    await delay(350);
  }
  const themeAfter = await evaluate(connection, page.sessionId, themeInfoExpression);
  if (viewport.width !== 1440) {
    await setViewport(connection, page.sessionId, viewport.width, viewport.height, true);
    await delay(250);
  }
  const beforeInjection = await evaluate(connection, page.sessionId, metricsExpression);
  const eventOffset = page.events.length;
  const scriptUrl = `http://127.0.0.1:${process.env.IMPECCABLE_LIVE_PORT || '8400'}/detect.js`;
  await evaluate(connection, page.sessionId, `(() => {
    window.__assessmentBOverlayInjection = { state: 'pending', at: new Date().toISOString() };
    const script = document.createElement('script');
    script.dataset.assessmentBOverlay = 'true';
    script.src = ${JSON.stringify(scriptUrl)};
    script.onload = () => { window.__assessmentBOverlayInjection = { state: 'loaded', src: script.src, at: new Date().toISOString() }; };
    script.onerror = () => { window.__assessmentBOverlayInjection = { state: 'error', src: script.src, at: new Date().toISOString() }; };
    document.head.appendChild(script);
    return { inserted: script.isConnected, src: script.src };
  })()`);
  await delay(3000);
  const afterInjection = await evaluate(connection, page.sessionId, `(() => {
    const marker = window.__assessmentBOverlayInjection || null;
    const scripts = [...document.querySelectorAll('script[data-assessment-b-overlay],script[src*="/detect.js"]')].map((script) => ({ src: script.src, connected: script.isConnected }));
    const nodes = [...document.querySelectorAll('body *')].map((element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      className: typeof element.className === 'string' ? element.className : '',
      text: (element.innerText || '').trim().slice(0, 80),
      position: getComputedStyle(element).position,
      zIndex: getComputedStyle(element).zIndex,
    })).filter((item) => /impeccable|detector/i.test(item.id + ' ' + item.className)).slice(0, 40);
    const fixedHighZ = [...document.querySelectorAll('body *')].map((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        position: style.position,
        zIndex: style.zIndex,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        text: (element.innerText || '').trim().slice(0, 80),
      };
    }).filter((item) => item.position === 'fixed' && Number(item.zIndex) >= 1000).slice(0, 30);
    return {
      injection: marker,
      scripts,
      bodyChildCount: document.body?.children.length ?? null,
      detectorNamedNodes: nodes,
      fixedHighZ,
      impeccableWindowKeys: Object.keys(window).filter((key) => /impeccable|detector/i.test(key)).slice(0, 30),
    };
  })()`);
  const afterMetrics = await evaluate(connection, page.sessionId, metricsExpression);
  const events = page.events.slice(eventOffset).map(simplifyConsoleEvent).filter(Boolean);
  const networkResponses = page.events.slice(eventOffset)
    .filter((event) => event.method === 'Network.responseReceived')
    .map((event) => ({ url: event.params.response.url, status: event.params.response.status, type: event.params.type }));
  const screenshot = await connection.call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, page.sessionId);
  const screenshotName = `${route.key}-${viewport.width === 1440 ? 'desktop' : 'mobile'}-${theme}.png`;
  fs.writeFileSync(path.join(browserDir, screenshotName), Buffer.from(screenshot.data, 'base64'));
  return {
    key: route.key,
    url: route.url,
    theme: { requested: theme, before: themeBefore, action: themeAction, after: themeAfter },
    viewport,
    navigation,
    load,
    beforeInjection,
    afterInjection: afterMetrics,
    injectionAndOverlayDom: afterInjection,
    networkResponses,
    console: events,
    impeccableConsole: events.filter((event) => /impeccable|detector|anti.?pattern/i.test(event.text || '')),
    screenshot: `browser/${screenshotName}`,
  };
}

async function capture() {
  const state = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-state.json'), 'utf8'));
  const connection = await CdpConnection.connect(state.browserPort || port);
  const evidence = { createdAt: new Date().toISOString(), browserPort: state.browserPort || port, views: [] };
  for (const target of state.targets) {
    const route = routes.find((item) => item.key === target.key);
    for (const viewport of [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'mobile', width: 375, height: 812 },
    ]) {
      for (const theme of ['light', 'dark']) {
        evidence.views.push(await captureView(connection, target, route, theme, viewport));
      }
    }
  }
  writeJson(path.join(browserDir, 'overlay-views.json'), evidence);
  connection.close();
  const summary = evidence.views.map((view) => ({
    key: view.key,
    viewport: view.viewport.name,
    requestedTheme: view.theme.requested,
    actualTheme: view.theme.after.theme,
    themeAction: view.theme.action,
    httpStatus: view.navigation.errorText ? null : 200,
    beforeInjectionWidth: view.beforeInjection.document,
    afterInjectionWidth: view.afterInjection.document,
    injection: view.injectionAndOverlayDom.injection,
    overlayNodeCount: view.injectionAndOverlayDom.detectorNamedNodes.length,
    fixedHighZCount: view.injectionAndOverlayDom.fixedHighZ.length,
    consoleCount: view.console.length,
    impeccableConsole: view.impeccableConsole,
    screenshot: view.screenshot,
  }));
  process.stdout.write(`${JSON.stringify({ createdAt: evidence.createdAt, views: summary }, null, 2)}\n`);
}

async function diagnoseOverflow() {
  const state = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'browser-state.json'), 'utf8'));
  const connection = await CdpConnection.connect(state.browserPort || port);
  const diagnostics = [];
  for (const target of state.targets) {
    const page = await attachPage(connection, target.targetId);
    await setViewport(connection, page.sessionId, 375, 812, true);
    await delay(350);
    const detail = await evaluate(connection, page.sessionId, `(() => {
      const describe = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className : '',
          text: (element.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 100),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          position: style.position,
          zIndex: style.zIndex,
          overflowX: style.overflowX,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        };
      };
      const all = [...document.querySelectorAll('html,body,body *')];
      const viewportWidth = document.documentElement.clientWidth;
      const extendsViewport = all
        .map((element) => ({ element, info: describe(element) }))
        .filter(({ info }) => info.right > viewportWidth + 1 && info.left < viewportWidth)
        .sort((a, b) => b.info.right - a.info.right);
      const maxRight = extendsViewport.slice(0, 50).map(({ info }) => info);
      const local615 = extendsViewport
        .filter(({ info }) => info.right <= viewportWidth + 260 && info.right >= viewportWidth + 200)
        .slice(0, 50)
        .map(({ info }) => info);
      const scrollContainers = all
        .map((element) => describe(element))
        .filter((info) => info.scrollWidth > info.clientWidth + 2)
        .slice(0, 80);
      const bodyChildren = [...document.body.children].map(describe);
      const injectedScripts = [...document.querySelectorAll('script[src*="detect.js"]')].map((script) => ({ src: script.src, connected: script.isConnected }));
      const themeToggle = [...document.querySelectorAll('button')].map((button) => ({
        label: button.getAttribute('aria-label') || button.getAttribute('title') || button.innerText,
        visible: (() => { const rect = button.getBoundingClientRect(); const style = getComputedStyle(button); return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'; })(),
      })).filter((button) => /theme/i.test(button.label || ''));
      return {
        url: location.href,
        title: document.title,
        viewportWidth: window.innerWidth,
        root: describe(document.documentElement),
        body: describe(document.body),
        bodyChildren,
        injectedScripts,
        themeToggle,
        elementsExtendingViewport: maxRight,
        elementsNear615: local615,
        scrollContainers,
      };
    })()`);
    diagnostics.push({ key: target.key, targetId: target.targetId, ...detail });
  }
  writeJson(path.join(browserDir, 'overflow-attribution.json'), { createdAt: new Date().toISOString(), diagnostics });
  connection.close();
  process.stdout.write(`${JSON.stringify(diagnostics.map((item) => ({
    key: item.key,
    url: item.url,
    viewportWidth: item.viewportWidth,
    root: item.root,
    body: item.body,
    injectedScripts: item.injectedScripts,
    elementsNear615: item.elementsNear615,
    detectorElements: item.elementsExtendingViewport.filter((element) => /impeccable|detector/i.test(`${element.id} ${element.className}`)),
    scrollContainers: item.scrollContainers.filter((element) => /impeccable|detector/i.test(`${element.id} ${element.className}`) || element.tag === 'table' || element.tag === 'html'),
  })), null, 2)}\n`);
}

async function closeBrowser() {
  const connection = await CdpConnection.connect(port);
  await connection.call('Browser.close').catch(() => {});
  await delay(750);
  connection.close();
  process.stdout.write('Browser.close sent.\n');
}

if (stage === 'preflight') await preflight();
else if (stage === 'capture') await capture();
else if (stage === 'diagnose') await diagnoseOverflow();
else if (stage === 'close') await closeBrowser();
else throw new Error('Usage: node browser-evidence.mjs <preflight|capture|close> [browser-port]');
