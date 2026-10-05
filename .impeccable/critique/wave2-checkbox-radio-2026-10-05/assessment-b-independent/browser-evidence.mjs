import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const outputDir = path.resolve('.impeccable/critique/wave2-checkbox-radio-2026-10-05/assessment-b-independent');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const routeBase = 'http://127.0.0.1:4174';
const detectorSource = fs.readFileSync(detectorPath, 'utf8');
const requests = [];
const consoleMessages = [];
const pages = [];
let browser;
let browserSocket;
let detectorServer;
let profileDir;
let browserPort;
let requestId = 0;
const pending = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(test, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await test()) return;
    await delay(150);
  }
  throw new Error(`等待超时（${timeoutMs}ms）`);
}

function connect(url) {
  const socket = new WebSocket(url);
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    if (message.method === 'Network.requestWillBeSent') {
      const { request, type } = message.params;
      requests.push({ url: request.url, method: request.method, type });
    }
    if (message.method === 'Network.responseReceived') {
      const { response, type } = message.params;
      requests.push({ url: response.url, status: response.status, type });
    }
    if (message.method === 'Network.loadingFailed') {
      requests.push({ error: message.params.errorText, blockedReason: message.params.blockedReason || null });
    }
    if (message.method === 'Runtime.consoleAPICalled') {
      const args = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
      consoleMessages.push({ type: message.params.type, text: args });
    }
    if (message.method === 'Log.entryAdded') {
      consoleMessages.push({ type: message.params.entry.level, text: message.params.entry.text });
    }
  });
  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve(socket), { once: true });
    socket.addEventListener('error', () => reject(new Error('无法连接 Chrome DevTools WebSocket')), { once: true });
  });
}

function send(socket, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP 命令超时：${method}`));
    }, 10000);
    pending.set(id, {
      resolve: (result) => { clearTimeout(timer); resolve(result); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(socket, expression) {
  const result = await send(socket, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function newPage(width, height, mobile = false) {
  const response = await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Chrome 新建标签失败：HTTP ${response.status}`);
  const target = await response.json();
  const socket = await connect(target.webSocketDebuggerUrl);
  pages.push({ targetId: target.id, socket });
  await send(socket, 'Page.enable');
  await send(socket, 'Runtime.enable');
  await send(socket, 'Network.enable');
  await send(socket, 'Log.enable');
  await send(socket, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  return { target, socket, width, height, mobile };
}

async function snapshot(socket, label) {
  return evaluate(socket, `(() => {
    const root = document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
    const isCheckbox = Boolean(document.querySelector('.lx-checkbox-demo'));
    const controls = [...document.querySelectorAll(isCheckbox ? '.lx-checkbox-demo .el-checkbox' : '.lx-radio-demo .el-radio')]
      .map((element) => {
        const input = element.querySelector('input');
        const rect = element.getBoundingClientRect();
        return {
          label: (element.innerText || '').trim(),
          checked: Boolean(input?.checked),
          indeterminate: Boolean(input?.indeterminate),
          disabled: Boolean(input?.disabled),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          focusVisible: element.matches(':focus-within') && input?.matches(':focus-visible'),
        };
      });
    const rootRect = root?.getBoundingClientRect();
    const style = root ? getComputedStyle(root) : null;
    return {
      label: ${JSON.stringify(label)},
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      component: root ? {
        width: Math.round(rootRect.width),
        background: style.backgroundColor,
        color: style.color,
        hud: root.classList.contains('lx-theme-hud'),
      } : null,
      controls,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      overlayLabelCount: document.querySelectorAll('.impeccable-label').length,
      preflightAttribute: document.body.dataset.assessmentB || null,
    };
  })()`);
}

async function capture(name, view) {
  const image = await send(view.socket, 'Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outputDir, `${name}.png`), Buffer.from(image.data, 'base64'));
}

async function injectAndScan(socket, scriptUrl) {
  const result = await evaluate(socket, `(() => new Promise((resolve) => {
    document.title += ' [Assessment B]';
    document.body.dataset.assessmentB = 'preflight-ok';
    const script = document.createElement('script');
    script.src = ${JSON.stringify(scriptUrl)};
    const finish = (loaded, error = null) => setTimeout(() => resolve({
      loaded,
      error,
      scriptPresent: script.isConnected,
      scannerAvailable: typeof window.impeccableScan === 'function',
      scriptUrl: script.src,
    }), 2500);
    script.onload = () => {
      if (typeof window.impeccableScan === 'function') {
        try { window.impeccableScan(); } catch (error) { return finish(true, String(error)); }
      }
      finish(true);
    };
    script.onerror = () => finish(false, 'script error event');
    document.head.appendChild(script);
  }))()`);
  return result;
}

const scenarios = [
  { id: 'checkbox-light-desktop', route: '/components/lxcheckbox', width: 1280, height: 900 },
  { id: 'checkbox-hud-dark-desktop', route: '/components/lxcheckbox', width: 1280, height: 900, hud: true },
  { id: 'checkbox-mobile-disabled', route: '/components/lxcheckbox', width: 390, height: 844, mobile: true },
  { id: 'radio-light-desktop', route: '/components/lxradio', width: 1280, height: 900 },
  { id: 'radio-hud-dark-desktop', route: '/components/lxradio', width: 1280, height: 900, hud: true },
  { id: 'radio-mobile-keyboard', route: '/components/lxradio', width: 390, height: 844, mobile: true, keyboard: true },
];

const evidence = {
  generatedAt: new Date().toISOString(),
  routeBase,
  browser: 'Chrome headless, isolated temporary user-data-dir; Chrome DevTools Protocol',
  nativeBrowserSurface: 'unavailable via cua.getState(); browser controlled through a local isolated CDP process',
  detectorSource: detectorPath,
  detectorHost: null,
  scenarios: [],
  requests: null,
  console: consoleMessages,
};

try {
  if (!fs.existsSync(chromePath)) throw new Error(`Chrome 不存在：${chromePath}`);
  detectorServer = http.createServer((request, response) => {
    if (request.url !== '/detect.js') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(detectorSource),
    });
    response.end(detectorSource);
  });
  await new Promise((resolve, reject) => {
    detectorServer.once('error', reject);
    detectorServer.listen(0, '127.0.0.1', resolve);
  });
  const detectorPort = detectorServer.address().port;
  evidence.detectorHost = `http://127.0.0.1:${detectorPort}/detect.js`;

  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lx-checkbox-radio-assessment-b-'));
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  browser = spawn(chromePath, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-features=MediaRouter',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitFor(() => fs.existsSync(portFile), 20000);
  browserPort = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
  const version = await (await fetch(`http://127.0.0.1:${browserPort}/json/version`)).json();
  browserSocket = await connect(version.webSocketDebuggerUrl);

  for (const scenario of scenarios) {
    const result = { ...scenario, status: 'started', overlay: null, measurements: null, error: null };
    evidence.scenarios.push(result);
    let view;
    try {
      view = await newPage(scenario.width, scenario.height, Boolean(scenario.mobile));
      await send(view.socket, 'Page.navigate', { url: `${routeBase}${scenario.route}` });
      await waitFor(async () => evaluate(view.socket, `document.readyState === 'complete' && Boolean(document.querySelector('.vp-doc'))`));
      await delay(900);
      await evaluate(view.socket, `(() => {
        const root = document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
        if (root) root.scrollIntoView({ block: 'center' });
      })()`);
      if (scenario.hud) {
        await evaluate(view.socket, `(() => { const input = document.querySelector('.lx-checkbox-demo__toolbar input, .lx-radio-demo__toolbar input'); if (input && !input.checked) input.click(); })()`);
      }
      if (scenario.keyboard) {
        await evaluate(view.socket, `(() => document.querySelector('.lx-radio-demo input[type=radio]:not(:disabled)')?.focus())()`);
        await send(view.socket, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
        await send(view.socket, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      }
      await delay(150);
      result.measurements = await snapshot(view.socket, scenario.id);
      result.preflight = {
        mutationApi: 'CDP Runtime.evaluate',
        scriptInsertion: 'HTMLScriptElement appended to document.head',
      };
      result.overlay = await injectAndScan(view.socket, evidence.detectorHost);
      result.overlay.overlayCount = await evaluate(view.socket, `document.querySelectorAll('.impeccable-overlay').length`);
      result.overlay.overlayLabelCount = await evaluate(view.socket, `document.querySelectorAll('.impeccable-label').length`);
      result.measurementsAfterOverlay = await snapshot(view.socket, `${scenario.id}-after-overlay`);
      await capture(`${scenario.id}-overlay`, view);
      result.status = 'complete';
    } catch (error) {
      result.status = 'failed';
      result.error = error?.stack || String(error);
    }
  }

  const responses = requests.filter((item) => Number.isFinite(item.status));
  const failedRequests = requests.filter((item) => item.error || (item.status && item.status >= 400));
  const detectorResponses = responses.filter((item) => item.url?.includes('/detect.js'));
  const byType = {};
  for (const response of responses) byType[response.type || 'other'] = (byType[response.type || 'other'] || 0) + 1;
  const uniqueRouteResponses = new Map();
  for (const response of responses.filter((item) => item.url?.startsWith(routeBase))) {
    const parsed = new URL(response.url);
    const key = `${parsed.pathname}${parsed.search}|${response.status}|${response.type}`;
    if (!uniqueRouteResponses.has(key)) {
      uniqueRouteResponses.set(key, { path: `${parsed.pathname}${parsed.search}`.slice(0, 240), status: response.status, type: response.type });
    }
  }
  evidence.requests = {
    eventCount: requests.length,
    responseCount: responses.length,
    responsesByType: byType,
    sameOriginResponseSample: [...uniqueRouteResponses.values()].slice(0, 40),
    detectorResponses: detectorResponses.map(({ url, status, type }) => ({ url, status, type })),
    failures: failedRequests.slice(0, 20),
  };
  evidence.requestsSummary = {
    totalEvents: requests.length,
    responseCount: responses.length,
    detectorResponses: detectorResponses.length,
    failedRequests: failedRequests.length,
  };
  evidence.consoleSummary = {
    total: consoleMessages.length,
    impeccable: consoleMessages.filter((item) => /impeccable/i.test(item.text)),
    errors: consoleMessages.filter((item) => item.type === 'error'),
  };
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  process.stdout.write(JSON.stringify({
    scenarios: evidence.scenarios.map(({ id, status, overlay, error, measurements }) => ({
      id,
      status,
      loaded: overlay?.loaded ?? false,
      overlayNodes: overlay?.overlayCount ?? null,
      labels: overlay?.overlayLabelCount ?? null,
      scroll: measurements ? `${measurements.document.scrollWidth}/${measurements.document.clientWidth}` : null,
      error,
    })),
    detectorResponses: evidence.requestsSummary.detectorResponses,
    failedRequests: evidence.requestsSummary.failedRequests.length,
    consoleErrors: evidence.consoleSummary.errors.length,
  }, null, 2));
  if (evidence.scenarios.some((scenario) => scenario.status !== 'complete')) process.exitCode = 2;
} catch (error) {
  evidence.fatalError = error?.stack || String(error);
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  process.stderr.write(`${evidence.fatalError}\n`);
  process.exitCode = 1;
} finally {
  for (const page of pages) {
    try { await send(page.socket, 'Page.close'); } catch { /* 页面可能已结束 */ }
    try { page.socket.close(); } catch { /* 页面可能已结束 */ }
  }
  if (browserSocket) {
    try { await send(browserSocket, 'Browser.close'); } catch { /* 浏览器可能已结束 */ }
    try { browserSocket.close(); } catch { /* 浏览器可能已结束 */ }
  }
  if (browser && browser.exitCode === null) {
    await Promise.race([
      new Promise((resolve) => browser.once('exit', resolve)),
      delay(3000).then(() => { browser.kill(); }),
    ]);
  }
  if (detectorServer) await new Promise((resolve) => detectorServer.close(resolve));
  if (profileDir) {
    const tempRoot = path.resolve(os.tmpdir()) + path.sep;
    const resolvedProfile = path.resolve(profileDir);
    if (resolvedProfile.startsWith(tempRoot)) fs.rmSync(resolvedProfile, { recursive: true, force: true });
  }
}
