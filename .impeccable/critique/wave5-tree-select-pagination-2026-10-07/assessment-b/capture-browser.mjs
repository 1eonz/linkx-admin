import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';

const evidenceRoot = path.resolve('.impeccable/critique/wave5-tree-select-pagination-2026-10-07/assessment-b');
const screenshotsDir = path.join(evidenceRoot, 'screenshots');
const browserDir = path.join(evidenceRoot, 'browser');
const runtimeDir = path.join(os.tmpdir(), `linkx-wave5-assessment-b-${randomUUID()}`);
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9317;
const overlayUrl = 'http://127.0.0.1:8400/detect.js';
const docsBase = 'http://127.0.0.1:4177/components';

fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(browserDir, { recursive: true });
fs.mkdirSync(runtimeDir, { recursive: true });

const scenarios = [
  {
    id: 'lxtreeselect-desktop-light',
    route: 'lxtreeselect',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'light',
    state: '默认单选，亮色桌面',
  },
  {
    id: 'lxtreeselect-desktop-hud-error',
    route: 'lxtreeselect',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'HUD 深色',
    state: '展开演示状态，模拟加载失败',
    actions: ['tree-hud', 'tree-error'],
  },
  {
    id: 'lxtreeselect-mobile-375-hud-error',
    route: 'lxtreeselect',
    viewport: { width: 375, height: 812, isMobile: true },
    theme: 'HUD 深色',
    state: '窄屏，模拟加载失败',
    actions: ['tree-hud', 'tree-error'],
  },
  {
    id: 'lxcascader-desktop-light',
    route: 'lxcascader',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'light',
    state: '默认单选，亮色桌面',
  },
  {
    id: 'lxcascader-desktop-hud-error',
    route: 'lxcascader',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'HUD 深色（由 DOM 注入，Demo 未提供切换控件）',
    state: '展开演示状态，失败',
    actions: ['hud', 'cascader-error'],
  },
  {
    id: 'lxcascader-mobile-375-hud-loading-error',
    route: 'lxcascader',
    viewport: { width: 375, height: 812, isMobile: true },
    theme: 'HUD 深色（由 DOM 注入，Demo 未提供切换控件）',
    state: '窄屏，加载中且失败（加载态优先）',
    actions: ['hud', 'cascader-loading-error'],
  },
  {
    id: 'lxselectpagination-desktop-light',
    route: 'lxselectpagination',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'light',
    state: '默认多选，亮色桌面',
  },
  {
    id: 'lxselectpagination-desktop-hud-error',
    route: 'lxselectpagination',
    viewport: { width: 1440, height: 1000, isMobile: false },
    theme: 'dark（Demo 控件标签为 HUD 深色主题；控件仅切换 html.dark）',
    state: '展开选择器并触发远程请求失败',
    actions: ['pagination-hud', 'pagination-error'],
  },
  {
    id: 'lxselectpagination-mobile-375-hud-error',
    route: 'lxselectpagination',
    viewport: { width: 375, height: 812, isMobile: true },
    theme: 'dark（Demo 控件标签为 HUD 深色主题；控件仅切换 html.dark）',
    state: '窄屏，展开选择器并触发远程请求失败',
    actions: ['pagination-hud', 'pagination-error'],
  },
];

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', async (event) => {
      const raw = typeof event.data === 'string' ? event.data : await event.data.text();
      const message = JSON.parse(raw);
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new Cdp(socket);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timeout); resolve(value); },
        reject: (error) => { clearTimeout(timeout); reject(error); },
      });
      this.socket.send(JSON.stringify(message));
    });
  }

  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.socket.close();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function waitForBrowser() {
  const deadline = Date.now() + 20000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      lastError = String(error);
      await delay(250);
    }
  }
  throw new Error(`Edge DevTools endpoint unavailable: ${lastError}`);
}

async function evaluate(cdp, expression, sessionId, options = {}) {
  const response = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
    ...options,
  }, sessionId);
  if (response.exceptionDetails) {
    const description = response.exceptionDetails.exception?.description ?? response.exceptionDetails.text;
    throw new Error(description);
  }
  return response.result?.value;
}

function textValue(value) {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return JSON.stringify(value);
}

async function runAction(cdp, sessionId, action) {
  const expressions = {
    'tree-hud': `(() => { const settings = [...document.querySelectorAll('.lx-tree-select-demo details')].find((el) => el.querySelector('summary')?.textContent.includes('演示状态')); if (settings) settings.open = true; const box = [...document.querySelectorAll('.lx-tree-select-demo input[type="checkbox"]')].find((el) => el.closest('label')?.textContent.includes('HUD 深色')); if (!box) return 'control not found'; if (!box.checked) box.click(); return 'clicked HUD 深色'; })()`,
    'tree-error': `(() => { const settings = [...document.querySelectorAll('.lx-tree-select-demo details')].find((el) => el.innerText.includes('演示状态')); if (settings) settings.open = true; const button = [...document.querySelectorAll('.lx-tree-select-demo button')].find((el) => el.innerText.trim() === '模拟加载失败'); if (!button) return 'error button not found'; button.click(); return 'clicked 模拟加载失败'; })()`,
    'hud': `(() => { const root = document.documentElement; root.classList.add('dark', 'lx-theme-hud'); return 'added dark and lx-theme-hud classes'; })()`,
    'cascader-error': `(() => { const settings = [...document.querySelectorAll('.cascader-demo details')].find((el) => el.innerText.includes('演示状态')); if (settings) settings.open = true; const button = [...document.querySelectorAll('.cascader-demo button')].find((el) => el.innerText.trim() === '失败'); if (!button) return 'error button not found'; button.click(); return 'clicked 失败'; })()`,
    'cascader-loading-error': `(() => { const settings = [...document.querySelectorAll('.cascader-demo details')].find((el) => el.innerText.includes('演示状态')); if (settings) settings.open = true; const button = [...document.querySelectorAll('.cascader-demo button')].find((el) => el.innerText.trim() === '加载中且失败'); if (!button) return 'loading-error button not found'; button.click(); return 'clicked 加载中且失败'; })()`,
    'pagination-hud': `(() => { const box = [...document.querySelectorAll('.lx-select-pagination-demo input[type="checkbox"]')].find((el) => el.closest('label')?.innerText.includes('HUD 深色主题')); if (!box) return 'HUD checkbox not found'; if (!box.checked) box.click(); return 'clicked HUD 深色主题'; })()`,
  };
  if (action === 'pagination-error') {
    const target = await evaluate(cdp, `(() => {
      const button = [...document.querySelectorAll('.lx-select-pagination-demo button')].find((el) => el.innerText.trim() === '下次请求失败');
      const input = document.querySelector('.lx-select-pagination-demo input[role="combobox"]');
      if (!button) return { error: 'failure button not found' };
      if (!input) return { error: 'combobox input not found' };
      button.click();
      const trigger = input.closest('.el-select')?.querySelector('.el-select__wrapper') ?? input;
      trigger.scrollIntoView({ block: 'center' });
      const rect = trigger.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, ariaExpanded: input.getAttribute('aria-expanded'), trigger: trigger.className };
    })()`, sessionId);
    if (target?.error) return target.error;
    await delay(180);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y }, sessionId);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 }, sessionId);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 }, sessionId);
    return `armed failure and dispatched pointer to ${target.trigger}`;
  }
  return evaluate(cdp, expressions[action], sessionId);
}

async function waitForPage(cdp, sessionId) {
  const deadline = Date.now() + 12000;
  let snapshot;
  while (Date.now() < deadline) {
    snapshot = await evaluate(cdp, `({ ready: document.readyState, app: !!document.querySelector('.VPApp'), title: document.title })`, sessionId);
    if (snapshot?.ready === 'complete' && snapshot?.app) break;
    await delay(250);
  }
  await delay(900);
  return snapshot;
}

async function injectOverlay(cdp, sessionId) {
  return evaluate(cdp, `new Promise((resolve) => {
    const script = document.createElement('script');
    script.dataset.impeccableAssessmentB = 'true';
    script.src = ${JSON.stringify(overlayUrl)};
    script.onload = () => { script.dataset.loaded = 'true'; resolve({ loaded: true, src: script.src }); };
    script.onerror = () => { script.dataset.loaded = 'false'; resolve({ loaded: false, src: script.src, error: 'script load failed' }); };
    document.head.appendChild(script);
    setTimeout(() => resolve({ loaded: false, src: script.src, error: 'script load timeout' }), 10000);
  })`, sessionId, { timeout: 12000 });
}

function summarizeDetectorConsole(consoleEntries) {
  const runs = consoleEntries
    .filter((entry) => entry.type === 'startGroup')
    .map((entry) => entry.text);
  const findings = consoleEntries
    .filter((entry) => entry.type === 'log' && typeof entry.args?.[0] === 'string' && entry.args[0].startsWith('%c'))
    .map((entry) => {
      const match = entry.args[0].match(/^%c([^%]+)%c\s*(.*)$/);
      return {
        rule: match?.[1] ?? 'unparsed',
        message: match?.[2] ?? entry.args[0],
        selector: entry.args.at(-1) ?? '',
        args: entry.args,
      };
    });
  const ruleCounts = Object.fromEntries(
    [...new Set(findings.map((finding) => finding.rule))]
      .sort()
      .map((rule) => [rule, findings.filter((finding) => finding.rule === rule).length]),
  );
  return { runs, findingCount: findings.length, ruleCounts, findings };
}

async function collectView(cdp, sessionId, scenario, consoleEntries, exceptions, networkFailures) {
  await delay(2500);
  const metadata = await evaluate(cdp, `(() => {
    const root = document.documentElement;
    const body = document.body;
    const demo = document.querySelector('.lx-tree-select-demo, .cascader-demo, .lx-select-pagination-demo');
    const text = (demo?.innerText ?? '').replace(/\\s+/g, ' ').trim();
    const overlayNodes = [...document.querySelectorAll('[data-impeccable], [data-impeccable-overlay], [class*="impeccable"]')];
    const alerts = [...document.querySelectorAll('[role="alert"], [role="status"], [aria-live]')].map((el) => ({ role: el.getAttribute('role'), text: (el.innerText ?? '').trim().slice(0, 300), visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) }));
    const controls = [...document.querySelectorAll('button, input, select, [role="combobox"], .el-select__wrapper')].filter((el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length).map((el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 120), role: el.getAttribute('role'), type: el.getAttribute('type'), disabled: !!el.disabled, ariaInvalid: el.getAttribute('aria-invalid') }));
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, isNarrow: matchMedia('(max-width: 640px)').matches, visualWidth: visualViewport?.width ?? null, screenWidth: screen.width, devicePixelRatio },
      document: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, scrollHeight: root.scrollHeight, bodyScrollWidth: body.scrollWidth },
      theme: { dark: root.classList.contains('dark'), hud: root.classList.contains('lx-theme-hud'), classes: [...root.classList] },
      demoFound: !!demo,
      demoText: text.slice(0, 1400),
      states: { loading: !!document.querySelector('[aria-busy="true"], .is-loading, .el-loading-mask'), errorText: [...document.querySelectorAll('[role="alert"]')].map((el) => (el.innerText ?? '').trim()).filter(Boolean), overlayNodeCount: overlayNodes.length, alerts },
      controls: controls.slice(0, 80),
      selectPagination: (() => { const demo = document.querySelector('.lx-select-pagination-demo'); if (!demo) return null; const input = demo.querySelector('input[role="combobox"]'); const error = [...document.querySelectorAll('[role="alert"]')].some((el) => (el.innerText ?? '').includes('选项暂时无法加载') && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); return { requestCount: demo.querySelector('[data-testid="request-count"]')?.innerText ?? null, requestPages: demo.querySelector('[data-testid="request-pages"]')?.innerText ?? null, errorVisible: error, popperVisible: [...document.querySelectorAll('.lx-select-pagination-popper')].some((el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length), ariaExpanded: input?.getAttribute('aria-expanded') ?? null }; })(),
      overlayScripts: [...document.scripts].filter((script) => script.dataset.impeccableAssessmentB === 'true').map((script) => ({ src: script.src, loaded: !!script.dataset.loaded })),
    };
  })()`, sessionId);
  const metrics = await cdp.send('Page.getLayoutMetrics', {}, sessionId);
  const width = scenario.viewport.width;
  const height = Math.max(1, Math.min(Math.ceil(metrics.cssContentSize.height), 12000));
  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  }, sessionId);
  fs.writeFileSync(path.join(screenshotsDir, `${scenario.id}.png`), Buffer.from(screenshot.data, 'base64'));

  const record = {
    scenario: scenario.id,
    route: scenario.route,
    theme: scenario.theme,
    requestedState: scenario.state,
    viewport: scenario.viewport,
    overlayInjection: scenario.overlayInjection,
    preflight: scenario.preflight,
    actionResults: scenario.actionResults ?? [],
    browser: metadata,
    detectorConsole: summarizeDetectorConsole(consoleEntries),
    screenshot: `screenshots/${scenario.id}.png`,
    console: consoleEntries,
    runtimeExceptions: exceptions,
    networkFailures,
  };
  record.stateChecks = {
    viewportWidthMatches: metadata.viewport.width === scenario.viewport.width,
    narrowMediaQueryMatches: scenario.viewport.width !== 375 || metadata.viewport.isNarrow,
    errorStateVisible: !scenario.id.includes('error') || scenario.id.includes('loading-error') || (scenario.route === 'lxselectpagination' ? metadata.selectPagination?.errorVisible === true : metadata.states.errorText.length > 0),
    loadingStateVisible: !scenario.id.includes('loading-error') || metadata.states.loading,
    darkThemeApplied: scenario.theme === 'light' ? !metadata.theme.dark : scenario.theme.startsWith('dark') || scenario.theme.includes('HUD') ? metadata.theme.dark : true,
    hudThemeClassApplied: scenario.actions?.some((action) => action === 'hud' || action === 'tree-hud') ? metadata.theme.hud : null,
  };
  fs.writeFileSync(path.join(browserDir, `${scenario.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

const commandLine = [
  '"' + edgePath + '"',
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir="${runtimeDir}"`,
  'about:blank',
].join(' ');
fs.writeFileSync(path.join(browserDir, 'edge-start.command.txt'), `${commandLine}\n`);
const edge = spawn(edgePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${runtimeDir}`, 'about:blank',
], { detached: true, stdio: 'ignore', windowsHide: true });
edge.unref();
fs.writeFileSync(path.join(browserDir, 'edge-process.json'), `${JSON.stringify({ pid: edge.pid, port, runtimeDir, isolatedUserDataDirectory: true, stopMethod: `taskkill /PID ${edge.pid} /T /F` }, null, 2)}\n`);

const allRecords = [];
let browserCdp;
try {
  const version = await waitForBrowser();
  fs.writeFileSync(path.join(browserDir, 'edge-version.json'), `${JSON.stringify(version, null, 2)}\n`);
  browserCdp = await Cdp.connect(version.webSocketDebuggerUrl);
  const errors = [];
  const removeBrowserListener = browserCdp.on((message) => {
    if (message.method === 'Target.targetCrashed') errors.push(message.params);
  });
  fs.writeFileSync(path.join(browserDir, 'context-isolation.json'), `${JSON.stringify({ browserProcessPid: edge.pid, browserProduct: version.Browser, createdIsolatedContexts: true, note: 'Each page uses Target.createBrowserContext and Target.createTarget; user profile and existing tabs are not attached.' }, null, 2)}\n`);

  for (const scenario of scenarios) {
    const context = await browserCdp.send('Target.createBrowserContext', { disposeOnDetach: true });
    const target = await browserCdp.send('Target.createTarget', { url: 'about:blank', browserContextId: context.browserContextId });
    const attached = await browserCdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    const consoleEntries = [];
    const exceptions = [];
    const networkFailures = [];
    const removePageListener = browserCdp.on((message) => {
      if (message.sessionId !== sessionId) return;
      if (message.method === 'Runtime.consoleAPICalled') {
        const args = message.params.args.map((arg) => textValue(arg.value ?? arg.description ?? arg.unserializableValue));
        consoleEntries.push({ type: message.params.type, args, text: args.join(' ').slice(0, 1000), timestamp: message.params.timestamp });
      }
      if (message.method === 'Runtime.exceptionThrown') {
        exceptions.push({ text: message.params.exceptionDetails.text, description: message.params.exceptionDetails.exception?.description ?? '', url: message.params.exceptionDetails.url, lineNumber: message.params.exceptionDetails.lineNumber });
      }
      if (message.method === 'Network.loadingFailed') {
        networkFailures.push({ url: message.params.requestId, errorText: message.params.errorText, blockedReason: message.params.blockedReason ?? '' });
      }
    });

    await browserCdp.send('Page.enable', {}, sessionId);
    await browserCdp.send('Runtime.enable', {}, sessionId);
    await browserCdp.send('Log.enable', {}, sessionId);
    await browserCdp.send('Network.enable', {}, sessionId);
    await browserCdp.send('Page.setDeviceMetricsOverride', {
      width: scenario.viewport.width,
      height: scenario.viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: scenario.viewport.width,
      screenHeight: scenario.viewport.height,
    }, sessionId);
    const url = `${docsBase}/${scenario.route}`;
    await browserCdp.send('Page.navigate', { url }, sessionId);
    await waitForPage(browserCdp, sessionId);
    scenario.preflight = await evaluate(browserCdp, `(() => { document.title = ${JSON.stringify(`[Human] ${scenario.route} ${scenario.id}`)}; document.documentElement.classList.remove('dark', 'lx-theme-hud'); const preflight = document.createElement('script'); preflight.dataset.impeccablePreflight = 'true'; preflight.textContent = 'window.__impeccablePreflight = true'; document.head.appendChild(preflight); return { title: document.title, mutableInjection: window.__impeccablePreflight === true, preflightScript: !!document.querySelector('script[data-impeccable-preflight="true"]') }; })()`, sessionId);
    if (scenario.actions?.length) {
      for (const action of scenario.actions) {
        scenario.actionResults ??= [];
        scenario.actionResults.push({ action, result: await runAction(browserCdp, sessionId, action) });
        await delay(action === 'pagination-error' ? 1000 : 300);
      }
    }
    scenario.overlayInjection = await injectOverlay(browserCdp, sessionId);
    await delay(2500);
    const record = await collectView(browserCdp, sessionId, scenario, consoleEntries, exceptions, networkFailures);
    allRecords.push(record);
    fs.writeFileSync(path.join(browserDir, 'target-crashes.json'), `${JSON.stringify(errors, null, 2)}\n`);
    await browserCdp.send('Target.disposeBrowserContext', { browserContextId: context.browserContextId });
    removePageListener();
  }

  browserCdp.close();
  fs.writeFileSync(path.join(browserDir, 'browser-evidence.json'), `${JSON.stringify({ browser: version.Browser, userDataDirectory: runtimeDir, scenarios: allRecords.map((record) => ({ id: record.scenario, url: record.browser.url, viewport: record.browser.viewport, theme: record.browser.theme, demoFound: record.browser.demoFound, preflight: record.preflight, injection: record.overlayInjection, stateChecks: record.stateChecks, detectorRuns: record.detectorConsole.runs, findingCount: record.detectorConsole.findingCount, ruleCounts: record.detectorConsole.ruleCounts, screenshot: record.screenshot })), targetCrashes: errors }, null, 2)}\n`);
  removeBrowserListener();
} catch (error) {
  fs.writeFileSync(path.join(browserDir, 'capture-error.txt'), `${error.stack ?? error}\n`);
  if (browserCdp) browserCdp.close();
  throw error;
} finally {
  try {
    execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {}
  await delay(500);
  const tempRoot = path.resolve(os.tmpdir()).toLowerCase();
  const resolvedRuntime = path.resolve(runtimeDir).toLowerCase();
  if (resolvedRuntime.startsWith(`${tempRoot}${path.sep}`.toLowerCase())) {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(browserDir, 'edge-stop.json'), `${JSON.stringify({ pid: edge.pid, method: `taskkill /PID ${edge.pid} /T /F`, stopped: true, isolatedProfileRemoved: true }, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({ scenarios: allRecords.length, screenshots: allRecords.map((record) => record.screenshot), failures: allRecords.filter((record) => record.overlayInjection?.loaded !== true || !record.preflight?.mutableInjection || !record.browser.demoFound || Object.values(record.stateChecks).some((value) => value === false)).map((record) => record.scenario) }, null, 2)}\n`);
