import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const outputDir = path.resolve('.impeccable/critique/wave2-checkbox-radio-2026-10-05/assessment-b-postfix');
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const requestedRouteBase = 'http://127.0.0.1:4174';
const routeBase = requestedRouteBase;
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

async function waitFor(test, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await test()) return;
    await delay(150);
  }
  throw new Error(`等待超时（${timeoutMs}ms）`);
}

function connect(url, context = {}) {
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
      requests.push({ scenarioId: context.scenarioId, event: 'request', url: request.url, method: request.method, type });
    }
    if (message.method === 'Network.responseReceived') {
      const { response, type } = message.params;
      requests.push({ scenarioId: context.scenarioId, event: 'response', url: response.url, status: response.status, type });
    }
    if (message.method === 'Network.loadingFailed') {
      requests.push({ scenarioId: context.scenarioId, event: 'failure', error: message.params.errorText, blockedReason: message.params.blockedReason || null });
    }
    if (message.method === 'Runtime.consoleAPICalled') {
      const args = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
      consoleMessages.push({ scenarioId: context.scenarioId, type: message.params.type, text: args });
    }
    if (message.method === 'Log.entryAdded') {
      consoleMessages.push({ scenarioId: context.scenarioId, type: message.params.entry.level, text: message.params.entry.text });
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

async function pressKey(socket, key, code, windowsVirtualKeyCode) {
  await send(socket, 'Input.dispatchKeyEvent', {
    type: 'keyDown', key, code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
  await send(socket, 'Input.dispatchKeyEvent', {
    type: 'keyUp', key, code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
}

async function newPage(scenario) {
  const response = await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Chrome 新建标签失败：HTTP ${response.status}`);
  const target = await response.json();
  const socket = await connect(target.webSocketDebuggerUrl, { scenarioId: scenario.id });
  pages.push({ targetId: target.id, socket });
  await send(socket, 'Page.enable');
  await send(socket, 'Runtime.enable');
  await send(socket, 'Network.enable');
  await send(socket, 'Log.enable');
  await send(socket, 'Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__IMPECCABLE_CONFIG__ = { ...(window.__IMPECCABLE_CONFIG__ || {}), autoScan: false };',
  });
  await send(socket, 'Emulation.setDeviceMetricsOverride', {
    width: scenario.width,
    height: scenario.height,
    deviceScaleFactor: 1,
    mobile: Boolean(scenario.mobile),
  });
  await send(socket, 'Emulation.setTouchEmulationEnabled', scenario.mobile
    ? { enabled: true, maxTouchPoints: 1 }
    : { enabled: false });
  if (scenario.reducedMotion) {
    await send(socket, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  }
  return { target, socket, scenario };
}

async function snapshot(socket, label) {
  return evaluate(socket, `(() => {
    const root = document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
    const isCheckbox = Boolean(document.querySelector('.lx-checkbox-demo'));
    const selector = isCheckbox ? '.lx-checkbox-demo .el-checkbox' : '.lx-radio-demo .el-radio';
    const controls = [...document.querySelectorAll(selector)].map((element) => {
      const input = element.querySelector('input');
      const rect = element.getBoundingClientRect();
      const inner = element.querySelector(isCheckbox ? '.el-checkbox__inner' : '.el-radio__inner');
      return {
        label: (element.innerText || '').trim().replace(/\\s+/g, ' '),
        checked: Boolean(input?.checked),
        indeterminate: Boolean(input?.indeterminate),
        ariaChecked: input?.getAttribute('aria-checked') || null,
        disabled: Boolean(input?.disabled),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        focusVisible: element.matches(':focus-within') && Boolean(input?.matches(':focus-visible')),
        transitionDuration: inner ? getComputedStyle(inner).transitionDuration : null,
      };
    });
    const rootRect = root?.getBoundingClientRect();
    const style = root ? getComputedStyle(root) : null;
    const active = document.activeElement;
    return {
      label: ${JSON.stringify(label)},
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      viewport: { width: innerWidth, height: innerHeight, touch: matchMedia('(pointer: coarse)').matches },
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      component: root ? {
        width: Math.round(rootRect.width),
        height: Math.round(rootRect.height),
        background: style.backgroundColor,
        color: style.color,
        hud: root.classList.contains('lx-theme-hud') || document.documentElement.classList.contains('lx-theme-hud'),
      } : null,
      controls,
      touchTargetsBelow44px: controls.filter((item) => item.height > 0 && item.height < 44).map(({ label, height }) => ({ label, height })),
      activeElement: active ? {
        tag: active.tagName,
        type: active.getAttribute('type'),
        label: active.closest('.el-checkbox, .el-radio')?.innerText?.trim().replace(/\\s+/g, ' ') || null,
        focusVisible: active.matches(':focus-visible'),
        disabled: Boolean(active.disabled),
      } : null,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      overlayLabelCount: document.querySelectorAll('.impeccable-label').length,
      overlayDetails: [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')].map((overlay) => {
        const target = overlay._targetEl;
        const component = target?.closest('.lx-checkbox, .lx-radio, .lx-checkbox-group, .lx-radio-group');
        const ancestors = [];
        for (let node = target?.parentElement; node && ancestors.length < 5; node = node.parentElement) {
          ancestors.push({
            tag: node.tagName,
            id: node.id || null,
            className: typeof node.className === 'string' ? node.className : null,
          });
        }
        return {
          label: overlay.querySelector('.impeccable-label')?.innerText?.trim() || null,
          targetTag: target?.tagName || null,
          targetClass: typeof target?.className === 'string' ? target.className : null,
          targetText: target?.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 160) || null,
          component: component ? {
            tag: component.tagName,
            className: typeof component.className === 'string' ? component.className : null,
            label: component.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 160) || null,
          } : null,
          targetColor: target ? getComputedStyle(target).color : null,
          lxPrimary: getComputedStyle(document.documentElement).getPropertyValue('--lx-color-primary').trim() || null,
          elementPrimary: getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim() || null,
          ancestors,
        };
      }),
      preflightAttribute: document.body.dataset.assessmentB || null,
    };
  })()`);
}

async function capture(name, socket) {
  const image = await send(socket, 'Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outputDir, `${name}.png`), Buffer.from(image.data, 'base64'));
}

async function injectAndScan(socket, scriptUrl) {
  return evaluate(socket, `(() => new Promise((resolve) => {
    document.title += ' [Assessment B]';
    document.body.dataset.assessmentB = 'preflight-ok';
    window.__IMPECCABLE_CONFIG__ = { ...(window.__IMPECCABLE_CONFIG__ || {}), autoScan: false };
    const script = document.createElement('script');
    script.src = ${JSON.stringify(scriptUrl)};
    const finish = (loaded, error = null, scanInvoked = false) => setTimeout(() => resolve({
      loaded,
      error,
      scanInvoked,
      scriptPresent: script.isConnected,
      scannerAvailable: typeof window.impeccableScan === 'function',
      scriptUrl: script.src,
    }), 1200);
    script.onload = () => {
      if (typeof window.impeccableScan !== 'function') return finish(true, 'window.impeccableScan is unavailable');
      try {
        window.impeccableScan();
        finish(true, null, true);
      } catch (error) {
        finish(true, String(error));
      }
    };
    script.onerror = () => finish(false, 'script error event');
    document.head.appendChild(script);
  }))()`);
}

async function touchText(socket, selector, text) {
  const point = await evaluate(socket, `(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((item) => item.innerText.includes(${JSON.stringify(text)}));
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2), label: element.innerText.trim() };
  })()`);
  if (!point) throw new Error(`找不到触屏目标：${text}`);
  await send(socket, 'Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: point.x, y: point.y, radiusX: 2, radiusY: 2, force: 1 }],
  });
  await send(socket, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await delay(250);
  return point;
}

async function focusVerticalRadioByTab(socket) {
  await evaluate(socket, `document.querySelector('.lx-radio-demo__toolbar input')?.focus()`);
  let active = null;
  for (let index = 0; index < 8; index += 1) {
    await pressKey(socket, 'Tab', 'Tab', 9);
    active = await evaluate(socket, `(() => {
      const item = document.activeElement;
      const vertical = item?.closest('[data-testid="vertical"]');
      return {
        isTarget: Boolean(vertical && item.matches('input[type=radio]')),
        label: item?.closest('.el-radio')?.innerText?.trim().replace(/\\s+/g, ' ') || null,
        focusVisible: item?.matches(':focus-visible') || false,
      };
    })()`);
    if (active.isTarget) break;
  }
  return active;
}

const scenarios = [
  { id: 'checkbox-light-desktop', route: '/components/lxcheckbox', width: 1280, height: 900, targetState: '默认浅色；组选项包含已选、半选、未选和禁用项' },
  { id: 'checkbox-hud-dark-desktop', route: '/components/lxcheckbox', width: 1280, height: 900, hud: true, targetState: 'HUD 深色主题' },
  { id: 'checkbox-touch-375', route: '/components/lxcheckbox', width: 375, height: 812, mobile: true, touch: { selector: '.lx-checkbox-demo .el-checkbox', text: '已知晓涉密核验义务并承诺遵守' }, targetState: '375px 触屏；独立复选触控' },
  { id: 'checkbox-disabled-selected-half-375', route: '/components/lxcheckbox', width: 375, height: 812, mobile: true, scrollToDisabledStates: true, targetState: '禁用已选与禁用半选回显' },
  { id: 'radio-light-desktop', route: '/components/lxradio', width: 1280, height: 900, targetState: '默认浅色；水平、垂直与旧值契约组' },
  { id: 'radio-hud-dark-desktop', route: '/components/lxradio', width: 1280, height: 900, hud: true, targetState: 'HUD 深色主题' },
  { id: 'radio-touch-375', route: '/components/lxradio', width: 375, height: 812, mobile: true, touch: { selector: '.lx-radio-demo .el-radio', text: '应急处突' }, targetState: '375px 触屏；单选触控' },
  { id: 'radio-tab-arrow-reduced-motion', route: '/components/lxradio', width: 1280, height: 900, reducedMotion: true, keyboard: true, targetState: 'Tab focus-visible、方向键跳过禁用项、减少动效' },
];

const evidence = {
  generatedAt: new Date().toISOString(),
  requestedRouteBase,
  routeBase,
  requestedRouteProbe: {
    initial: { status: 'failed', reason: '首次探测返回 ERR_CONNECTION_REFUSED' },
    beforeCapture: { status: 'http-200', statusCode: 200, note: 'parent 随后启动并保持 4174；下方场景均直接访问该路由' },
  },
  temporaryPreview: { command: 'vitepress dev docs --host 127.0.0.1 --port 4175 --strictPort', pid: 33240, status: '已在切回 4174 后停止', stopMethod: 'Stop-Process -Id 33240' },
  browser: 'Chrome headless，独立临时 user-data-dir，通过 Chrome DevTools Protocol 控制',
  browserAutomationFallback: 'CUA 子 Agent 无法创建可用 IAB 标签；改用独立 CDP Chrome 并保留原端口和 Chrome 进程',
  detectorSource: detectorPath,
  detectorHost: null,
  scenarios: [],
  console: consoleMessages,
  requests,
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

  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkx-checkbox-radio-assessment-b-'));
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  browser = spawn(chromePath, [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-features=MediaRouter',
    '--no-proxy-server',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitFor(() => fs.existsSync(portFile), 20000);
  browserPort = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
  const version = await (await fetch(`http://127.0.0.1:${browserPort}/json/version`)).json();
  browserSocket = await connect(version.webSocketDebuggerUrl, { scenarioId: 'browser' });

  for (const scenario of scenarios) {
    const result = {
      ...scenario,
      status: 'started',
      overlay: null,
      measurements: null,
      measurementsAfterOverlay: null,
      consoleMessages: null,
      networkEvents: null,
      action: null,
      error: null,
    };
    evidence.scenarios.push(result);
    let view;
    const consoleStart = consoleMessages.length;
    const requestsStart = requests.length;
    try {
      view = await newPage(scenario);
      await send(view.socket, 'Page.navigate', { url: `${routeBase}${scenario.route}` });
      await waitFor(async () => evaluate(view.socket, `document.readyState === 'complete' && Boolean(document.querySelector('.vp-doc'))`));
      await delay(850);
      await evaluate(view.socket, `(() => {
        const target = ${scenario.scrollToDisabledStates ? "document.querySelector('[data-testid=\"disabled-states\"]')" : "document.querySelector('.lx-checkbox-demo, .lx-radio-demo')"};
        if (target) target.scrollIntoView({ block: 'center' });
      })()`);
      if (scenario.hud) {
        await evaluate(view.socket, `(() => {
          const input = document.querySelector('.lx-checkbox-demo__toolbar input, .lx-radio-demo__toolbar input');
          if (input && !input.checked) input.click();
        })()`);
        await delay(200);
      }
      if (scenario.touch) {
        result.action = { type: 'touch', ...await touchText(view.socket, scenario.touch.selector, scenario.touch.text) };
      }
      if (scenario.keyboard) {
        const tab = await focusVerticalRadioByTab(view.socket);
        await pressKey(view.socket, 'ArrowRight', 'ArrowRight', 39);
        await delay(200);
        const arrow = await evaluate(view.socket, `(() => {
          const active = document.activeElement;
          const vertical = document.querySelector('[data-testid="vertical"]');
          const selected = vertical?.querySelector('input[type=radio]:checked');
          return {
            activeLabel: active?.closest('.el-radio')?.innerText?.trim().replace(/\\s+/g, ' ') || null,
            activeFocusVisible: active?.matches(':focus-visible') || false,
            selectedLabel: selected?.closest('.el-radio')?.innerText?.trim().replace(/\\s+/g, ' ') || null,
            disabledBetweenInitialAndSelected: Boolean(vertical?.querySelector('input[type=radio]:disabled')),
          };
        })()`);
        result.action = {
          type: 'keyboard',
          tabReachedVerticalGroup: tab.isTarget,
          tabFocusedLabel: tab.label,
          tabFocusVisible: tab.focusVisible,
          arrowRight: arrow,
        };
      }
      await delay(150);
      result.measurements = await snapshot(view.socket, scenario.id);
      result.preflight = {
        mutationApi: 'Chrome DevTools Protocol Runtime.evaluate',
        titleChanged: true,
        bodyAttribute: 'data-assessment-b=preflight-ok',
        scriptInsertion: 'HTMLScriptElement appended to document.head',
      };
      result.overlay = await injectAndScan(view.socket, evidence.detectorHost);
      result.overlay.overlayCount = await evaluate(view.socket, `document.querySelectorAll('.impeccable-overlay').length`);
      result.overlay.overlayLabelCount = await evaluate(view.socket, `document.querySelectorAll('.impeccable-label').length`);
      result.measurementsAfterOverlay = await snapshot(view.socket, `${scenario.id}-after-overlay`);
      result.consoleMessages = consoleMessages.slice(consoleStart);
      result.networkEvents = requests.slice(requestsStart);
      await capture(`${scenario.id}-overlay`, view.socket);
      result.status = result.overlay.loaded && result.overlay.scanInvoked ? 'complete' : 'injection-failed';
    } catch (error) {
      result.status = 'failed';
      result.error = error?.stack || String(error);
      result.consoleMessages = consoleMessages.slice(consoleStart);
      result.networkEvents = requests.slice(requestsStart);
    }
  }

  evidence.requestsSummary = {
    eventCount: requests.length,
    responseCount: requests.filter((item) => item.event === 'response').length,
    detectorRequests: requests.filter((item) => item.url?.includes('/detect.js')),
    failures: requests.filter((item) => item.event === 'failure'),
    httpErrors: requests.filter((item) => item.event === 'response' && item.status >= 400),
  };
  evidence.consoleSummary = {
    total: consoleMessages.length,
    impeccable: consoleMessages.filter((item) => /impeccable/i.test(item.text)),
    errors: consoleMessages.filter((item) => item.type === 'error'),
  };
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  process.stdout.write(JSON.stringify({
    requestedRoute: evidence.requestedRouteProbe,
    routeBase,
    scenarios: evidence.scenarios.map(({ id, status, overlay, error, measurements, action }) => ({
      id,
      status,
      loaded: overlay?.loaded ?? false,
      scannerAvailable: overlay?.scannerAvailable ?? false,
      scanInvoked: overlay?.scanInvoked ?? false,
      overlayNodes: overlay?.overlayCount ?? null,
      labels: overlay?.overlayLabelCount ?? null,
      scroll: measurements ? `${measurements.document.scrollWidth}/${measurements.document.clientWidth}` : null,
      action,
      error,
    })),
    detectorResponses: evidence.requestsSummary.detectorRequests.filter((item) => item.event === 'response'),
    failedRequests: evidence.requestsSummary.failures.length,
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
