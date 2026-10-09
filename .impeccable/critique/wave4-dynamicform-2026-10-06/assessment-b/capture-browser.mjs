import fs from 'node:fs';
import { createHash } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const detectorPath = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detector\\detect-antipatterns-browser.js';
const targetPath = 'F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxDynamicForm';
const profilePath = path.join(here, `chrome-profile-${process.pid}`);
const detectorSource = fs.readFileSync(detectorPath, 'utf8');
const evidence = {
  targetUrl,
  startedAt: new Date().toISOString(),
  automation: 'Chrome DevTools Protocol over Node native WebSocket',
  puppeteerModule: 'missing',
  playwrightModule: 'missing',
  detectorSource: path.resolve(detectorPath),
  targetFingerprint: null,
  injectionServer: null,
  preflight: null,
  page: null,
  viewports: [],
  interactionChecks: [],
  console: [],
  failedRequests: [],
  errors: [],
};
const serverRequests = [];
let browserProcess;
let cdp;
let overlayServer;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fingerprintTarget() {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const relative = path.relative(targetPath, absolute).split(path.sep).join('/');
        const sha256 = createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
        files.push({ path: relative, sha256 });
      }
    }
  };
  visit(targetPath);
  const canonical = files.map((file) => `${file.path}\0${file.sha256}`).join('\n');
  return {
    root: targetPath,
    fileCount: files.length,
    aggregateSha256: createHash('sha256').update(canonical).digest('hex'),
    files,
  };
}

async function waitFor(predicate, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function stringifyRemote(value) {
  if (value?.value !== undefined) return value.value;
  if (value?.description) return value.description;
  return value?.type || 'unknown';
}

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result || {});
        return;
      }
      const listeners = this.listeners.get(message.method) || [];
      for (const listener of listeners) listener(message.params || {});
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error('CDP WebSocket connection failed')), { once: true });
    });
    return new CDP(socket);
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 20000).unref?.();
    });
  }

  async evaluate(expression, awaitPromise = true) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text || 'Runtime evaluation failed');
    }
    return stringifyRemote(response.result);
  }

  close() {
    this.socket.close();
  }
}

function collectConsole(params) {
  const message = params.message || {};
  if (message.level !== 'warning' && message.level !== 'error' && !String(message.text || '').includes('[impeccable]')) return;
  evidence.console.push({
    source: message.source,
    level: message.level,
    text: message.text,
    url: message.url,
    line: message.lineNumber,
  });
}

async function saveScreenshot(name) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const file = path.join(here, `${name}.png`);
  const image = Buffer.from(result.data, 'base64');
  fs.writeFileSync(file, image);
  return { file: path.basename(file), width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

async function readPageState() {
  return cdp.evaluate(`(() => {
    const controls = Array.from(document.querySelectorAll('button, input, select, textarea, [role="button"], [tabindex]'));
    const labelFor = (el) => el.getAttribute('aria-label') || el.getAttribute('title') || el.labels?.[0]?.innerText?.trim() || el.innerText?.trim() || el.value || el.placeholder || el.name || el.id || el.tagName.toLowerCase();
    return {
      title: document.title,
      href: location.href,
      readyState: document.readyState,
      innerWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body?.scrollWidth ?? null,
      documentHeight: document.documentElement.scrollHeight,
      visualViewportWidth: window.visualViewport?.width ?? null,
      screenWidth: window.screen.width,
      devicePixelRatio: window.devicePixelRatio,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      anyHoverNone: matchMedia('(any-hover: none)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      themeClass: document.documentElement.className,
      themeData: document.documentElement.getAttribute('data-theme'),
      bodyText: document.body?.innerText?.slice(0, 1800) ?? '',
      controls: controls.slice(0, 100).map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        label: labelFor(el).slice(0, 120),
        disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true',
        required: Boolean(el.required) || el.getAttribute('aria-required') === 'true',
        invalid: el.getAttribute('aria-invalid') === 'true',
        value: el.value ?? null,
        placeholder: el.placeholder ?? null,
        rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })(),
      })),
      visibleMessages: Array.from(document.querySelectorAll('[role="alert"], .el-form-item__error, [aria-invalid="true"], .empty, .error, .is-disabled'))
        .slice(0, 60).map((el) => ({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          text: el.innerText?.trim().slice(0, 160) || '',
          className: typeof el.className === 'string' ? el.className : '',
        })),
      inputSelectHeights: Array.from(document.querySelectorAll('input:not([type="file"]), select, textarea, [role="combobox"], .el-input__wrapper, .el-select__wrapper'))
        .filter((el) => { const style = getComputedStyle(el); const r = el.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0; })
        .slice(0, 60).map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), type: el.type || null, label: labelFor(el).slice(0, 100), height: Math.round(r.height), width: Math.round(r.width), className: typeof el.className === 'string' ? el.className : '' }; }),
    };
  })()`);
}

async function setViewport(name, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
  await delay(500);
  return { name, width, height, mobile };
}

async function setTheme(theme) {
  const before = await cdp.evaluate(`document.documentElement.classList.contains('dark')`);
  if ((theme === 'dark') !== before) {
    const toggle = await cdp.evaluate(`(() => {
      const button = document.querySelector('button.VPSwitchAppearance, button[aria-label*="theme" i], button[aria-label*="appearance" i]');
      if (button) { button.click(); return 'clicked-theme-control'; }
      document.documentElement.classList.toggle('dark', ${theme === 'dark'});
      return 'set-html-dark-class';
    })()`);
    await delay(600);
    const after = await cdp.evaluate(`document.documentElement.classList.contains('dark')`);
    return { requested: theme, before, after, method: toggle };
  }
  return { requested: theme, before, after: before, method: 'already-set' };
}

async function scanAndCapture(name, requestedViewport = null) {
  const scan = await cdp.evaluate(`(() => {
    const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null;
    if (typeof window.impeccableScan === 'function') window.impeccableScan();
    return {
      detectorReady: typeof window.impeccableScan === 'function',
      findingCount: Array.isArray(findings) ? findings.length : null,
      findings: Array.isArray(findings) ? findings : [],
    };
  })()`);
  await delay(1300);
  const overlay = await cdp.evaluate(`({
    elements: document.querySelectorAll('.impeccable-overlay, .impeccable-banner, .impeccable-label').length,
    visible: document.querySelectorAll('.impeccable-overlay.impeccable-visible, .impeccable-banner.impeccable-visible').length,
    banners: Array.from(document.querySelectorAll('.impeccable-banner')).map(el => el.innerText.trim()).filter(Boolean),
    labels: Array.from(document.querySelectorAll('.impeccable-label')).map(el => el.innerText.trim()).filter(Boolean),
  })`);
  const state = await readPageState();
  const screenshot = await saveScreenshot(name);
  const result = {
    name,
    requestedViewport,
    viewportWidth: state.innerWidth,
    visualViewportWidth: state.visualViewportWidth,
    documentWidth: state.documentWidth,
    themeClass: state.themeClass,
    touch: { hoverNone: state.hoverNone, pointerCoarse: state.pointerCoarse, anyHoverNone: state.anyHoverNone, maxTouchPoints: state.maxTouchPoints },
    inputSelectHeights: state.inputSelectHeights,
    scan,
    overlay,
    screenshot,
  };
  evidence.viewports.push(result);
  return result;
}

async function clickCandidate(regex, purpose) {
  const clicked = await cdp.evaluate(`(() => {
    const pattern = ${JSON.stringify(regex.source)};
    const flags = ${JSON.stringify(regex.flags.replace('g', ''))};
    const re = new RegExp(pattern, flags);
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
    const el = candidates.find((candidate) => re.test((candidate.getAttribute('aria-label') || candidate.innerText || candidate.value || '').trim()));
    if (!el) return null;
    el.click();
    return { tag: el.tagName.toLowerCase(), label: el.getAttribute('aria-label') || el.innerText?.trim() || el.value || '', disabled: Boolean(el.disabled) };
  })()`);
  const check = {
    purpose,
    match: regex.toString(),
    clicked,
    page: await readPageState(),
  };
  evidence.interactionChecks.push(check);
  return check;
}

async function run() {
  fs.mkdirSync(profilePath, { recursive: true });
  overlayServer = http.createServer((req, res) => {
    serverRequests.push({ url: req.url, method: req.method });
    if (req.url === '/preflight.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end('window.__impeccableBPreflightLoaded = true;');
      return;
    }
    if (req.url === '/detect.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
      res.end(detectorSource);
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  await new Promise((resolve) => overlayServer.listen(0, '127.0.0.1', resolve));
  const overlayPort = overlayServer.address().port;
  evidence.injectionServer = { host: '127.0.0.1', port: overlayPort, scriptPath: detectorPath };
  evidence.targetFingerprint = fingerprintTarget();

  browserProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--remote-allow-origins=*',
    '--remote-debugging-port=0',
    `--user-data-dir=${profilePath}`,
    '--window-size=1440,1000',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });

  const activePortFile = path.join(profilePath, 'DevToolsActivePort');
  const debugPort = await waitFor(() => {
    if (!fs.existsSync(activePortFile)) return null;
    const value = fs.readFileSync(activePortFile, 'utf8').split(/\r?\n/)[0].trim();
    return value ? Number(value) : null;
  }, 'Chrome remote debugging port', 20000);
  const version = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
    return response.ok ? response.json() : null;
  }, 'Chrome DevTools endpoint');
  const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  if (!targetResponse.ok) throw new Error(`Could not create a fresh Chrome tab: HTTP ${targetResponse.status}`);
  const target = await targetResponse.json();
  cdp = await CDP.connect(target.webSocketDebuggerUrl);
  cdp.on('Runtime.consoleAPICalled', (params) => {
    const args = (params.args || []).map(stringifyRemote);
    if (!['error', 'warning'].includes(params.type) && !args.some((arg) => String(arg).includes('[impeccable]'))) return;
    evidence.console.push({
      type: params.type,
      args,
      timestamp: params.timestamp,
    });
  });
  cdp.on('Log.entryAdded', (params) => collectConsole(params));
  cdp.on('Network.loadingFailed', (params) => evidence.failedRequests.push({
    requestId: params.requestId,
    errorText: params.errorText,
    canceled: params.canceled,
    blockedReason: params.blockedReason,
  }));
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');
  await cdp.send('Page.navigate', { url: targetUrl });
  await waitFor(async () => cdp.evaluate(`document.readyState === 'complete'`), 'target page load', 30000);
  await delay(1800);
  evidence.page = await readPageState();
  evidence.chrome = { version: version.Browser, protocolVersion: version['Protocol-Version'], targetId: target.id };

  await cdp.evaluate(`(() => {
    document.title = 'Assessment B injection preflight';
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:${overlayPort}/preflight.js';
    document.head.appendChild(script);
  })()`);
  const preflightLoaded = await waitFor(() => cdp.evaluate(`window.__impeccableBPreflightLoaded === true`), 'mutable script injection preflight');
  evidence.preflight = { documentTitleSet: await cdp.evaluate(`document.title === 'Assessment B injection preflight'`), scriptLoaded: preflightLoaded, requests: [...serverRequests] };
  await cdp.evaluate(`(() => { document.title = ${JSON.stringify(evidence.page.title)}; document.querySelector('script[src*="/preflight.js"]')?.remove(); })()`);

  await cdp.evaluate(`(() => {
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:${overlayPort}/detect.js';
    script.dataset.assessment = 'b';
    document.head.appendChild(script);
  })()`);
  await waitFor(() => cdp.evaluate(`typeof window.impeccableScan === 'function'`), 'Impeccable browser detector injection');
  await delay(2500);
  evidence.detectorInjection = {
    loaded: true,
    actualScriptRequestSeen: serverRequests.some((request) => request.url === '/detect.js'),
    scriptUrl: `http://127.0.0.1:${overlayPort}/detect.js`,
    initialOverlay: await cdp.evaluate(`({ elements: document.querySelectorAll('.impeccable-overlay, .impeccable-banner').length, visible: document.querySelectorAll('.impeccable-overlay.impeccable-visible, .impeccable-banner.impeccable-visible').length })`),
  };

  for (const theme of ['light', 'dark']) {
    evidence.interactionChecks.push({ purpose: 'theme-toggle', ...await setTheme(theme) });
    for (const [name, width, height, mobile] of [
      ['desktop', 1440, 1000, false],
      ['mobile-375', 375, 850, true],
      ['mobile-320', 320, 800, true],
    ]) {
      const viewport = await setViewport(name, width, height, mobile);
      evidence.interactionChecks.push({ purpose: 'viewport', ...viewport });
      const screenshotName = `${String(evidence.viewports.length + 1).padStart(2, '0')}-${viewport.name}-${theme}-hud`;
      await scanAndCapture(screenshotName, viewport);
    }
  }

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  evidence.interactionChecks.push({ purpose: 'reduced-motion', mediaMatches: await cdp.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`) });
  await scanAndCapture('07-desktop-reduced-motion-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });

  const settings = await cdp.evaluate(`(() => {
    const details = Array.from(document.querySelectorAll('details')).find((item) => /演示设置/.test(item.querySelector('summary')?.innerText || ''));
    if (details && !details.open) details.querySelector('summary')?.click();
    return details ? {
      found: true,
      open: details.open,
      text: details.innerText,
      controls: Array.from(details.querySelectorAll('input, button, select, textarea, [role="switch"]')).map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        label: el.getAttribute('aria-label') || el.labels?.[0]?.innerText?.trim() || el.innerText?.trim() || el.placeholder || el.name || '',
        value: el.value ?? null,
        checked: el.checked ?? null,
        disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true',
        role: el.getAttribute('role'),
      })),
    } : { found: false, summaries: Array.from(document.querySelectorAll('summary')).map((el) => el.innerText.trim()) };
  })()`);
  evidence.interactionChecks.push({ purpose: 'demo-settings-open', settings, page: await readPageState() });
  await scanAndCapture('08-desktop-demo-settings-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const remoteSuccess = await clickCandidate(/成功/i, 'remote-select-success-state');
  evidence.interactionChecks.push({ purpose: 'remote-select-success-state', page: remoteSuccess.page });
  await scanAndCapture('09-desktop-remote-success-state-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const stateBeforeSubmit = await readPageState();
  evidence.interactionChecks.push({ purpose: 'state-inventory', page: stateBeforeSubmit });
  await clickCandidate(/submit|validate|校验|验证|提交/i, 'validation-submit');
  await scanAndCapture('10-desktop-validation-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const filled = [];
  for (const [placeholder, value] of [['输入任务名称', 'Assessment B 验证通过样例'], ['输入访问密码', 'Evidence-Password-42']]) {
    const focused = await cdp.evaluate(`(() => {
      const el = Array.from(document.querySelectorAll('input')).find((item) => item.placeholder === ${JSON.stringify(placeholder)});
      if (!el) return false;
      el.focus();
      el.select();
      return true;
    })()`);
    if (focused) await cdp.send('Input.insertText', { text: value });
    filled.push({ placeholder, found: focused, valueLength: focused ? value.length : 0 });
  }
  evidence.interactionChecks.push({ purpose: 'success-form-fill', fields: filled });
  await delay(500);
  const filledState = await readPageState();
  evidence.interactionChecks.push({ purpose: 'success-form-values', values: filledState.controls.filter((control) => ['任务名称', '访问密码'].includes(control.label)).map((control) => ({ label: control.label, valueLength: control.value?.length || 0, invalid: control.invalid })) });
  const successClick = await clickCandidate(/提交校验/i, 'success-submit');
  evidence.interactionChecks.push({ purpose: 'success-submit-result', visibleErrors: successClick.page.visibleMessages, invalidControlCount: successClick.page.controls.filter((control) => control.invalid).length });
  await scanAndCapture('11-desktop-success-submit-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const emptyResult = await clickCandidate(/空结果/i, 'remote-select-empty-result-state');
  evidence.interactionChecks.push({ purpose: 'remote-select-empty-result-state', page: emptyResult.page });
  await scanAndCapture('12-desktop-remote-empty-result-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });
  await clickCandidate(/empty|clear|清空|空态|无数据/i, 'empty-state-control');
  await scanAndCapture('13-desktop-empty-upload-state-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });
  const failureState = await clickCandidate(/失败/i, 'remote-select-failure-state');
  evidence.interactionChecks.push({ purpose: 'remote-select-failure-state', page: failureState.page });
  await scanAndCapture('14-desktop-remote-failure-state-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const disabledSetting = await cdp.evaluate(`(() => {
    const details = Array.from(document.querySelectorAll('details')).find((item) => /演示设置/.test(item.querySelector('summary')?.innerText || ''));
    const checkbox = Array.from(details?.querySelectorAll('input[type="checkbox"]') || []).find((el) => /禁用表单/.test(el.labels?.[0]?.innerText || ''));
    if (!checkbox) return { found: false };
    const before = checkbox.checked;
    if (!before) checkbox.click();
    return { found: true, before, checked: checkbox.checked };
  })()`);
  const disabled = await cdp.evaluate(`Array.from(document.querySelectorAll('button:disabled, input:disabled, select:disabled, textarea:disabled, [aria-disabled="true"]')).map(el => ({ tag: el.tagName.toLowerCase(), label: el.getAttribute('aria-label') || el.labels?.[0]?.innerText?.trim() || el.innerText?.trim() || el.value || '', rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })() }))`);
  evidence.interactionChecks.push({ purpose: 'disabled-form-state', setting: disabledSetting, observedCount: disabled.length, elements: disabled, page: await readPageState() });
  await scanAndCapture('15-desktop-disabled-form-state-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  const reenabledSetting = await cdp.evaluate(`(() => {
    const details = Array.from(document.querySelectorAll('details')).find((item) => /演示设置/.test(item.querySelector('summary')?.innerText || ''));
    const checkbox = Array.from(details?.querySelectorAll('input[type="checkbox"]') || []).find((el) => /禁用表单/.test(el.labels?.[0]?.innerText || ''));
    if (!checkbox) return { found: false };
    if (checkbox.checked) checkbox.click();
    return { found: true, checked: checkbox.checked };
  })()`);
  evidence.interactionChecks.push({ purpose: 'disabled-form-reset', setting: reenabledSetting });

  await cdp.evaluate(`(() => { window.scrollTo(0, 0); document.activeElement?.blur?.(); })()`);
  const keyboardFocus = [];
  for (let index = 0; index < 10; index += 1) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    keyboardFocus.push(await cdp.evaluate(`(() => { const el = document.activeElement; return { tag: el?.tagName?.toLowerCase() || null, label: el?.getAttribute?.('aria-label') || el?.getAttribute?.('title') || el?.innerText?.trim?.() || el?.placeholder || el?.name || el?.id || '', role: el?.getAttribute?.('role') || null, disabled: Boolean(el?.disabled) }; })()`));
  }
  evidence.interactionChecks.push({ purpose: 'keyboard-tab-order', focusSequence: keyboardFocus });
  await scanAndCapture('16-desktop-keyboard-hud', { name: 'desktop', width: 1440, height: 1000, mobile: false });

  evidence.localServerRequests = serverRequests;
  evidence.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(here, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    pageTitle: evidence.page?.title,
    viewportCaptures: evidence.viewports.length,
    consoleEntries: evidence.console.length,
    failedRequests: evidence.failedRequests.length,
    injectionLoaded: evidence.detectorInjection?.loaded,
    screenshots: evidence.viewports.map((view) => view.screenshot.file),
  }, null, 2));
}

try {
  await run();
} catch (error) {
  evidence.finishedAt = new Date().toISOString();
  evidence.errors.push({ name: error.name, message: error.message, stack: error.stack });
  fs.writeFileSync(path.join(here, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  try { cdp?.close(); } catch {}
  try { overlayServer?.close(); } catch {}
  if (browserProcess?.pid) {
    try {
      execFileSync('taskkill.exe', ['/PID', String(browserProcess.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      try { browserProcess.kill(); } catch {}
    }
  }
  try { fs.rmSync(profilePath, { recursive: true, force: true }); } catch {}
}
