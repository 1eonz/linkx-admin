import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const detectUrl = 'http://localhost:8400/detect.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkx-transferpanel-assessment-b-'));
const activePortPath = path.join(profileDir, 'DevToolsActivePort');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-extensions',
  '--disable-sync',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: 'ignore' });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitUntil = async (fn, timeoutMs, intervalMs = 100) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await fn();
    if (value) return value;
    await wait(intervalMs);
  }
  throw new Error(`等待超时（${timeoutMs}ms）`);
};

class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    socket.addEventListener('message', (event) => this.handleMessage(String(event.data)));
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('CDP WebSocket 已关闭'));
      }
      this.pending.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error('CDP WebSocket 连接失败')), { once: true });
    });
    return new CdpConnection(socket);
  }

  handleMessage(raw) {
    const message = JSON.parse(raw);
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }
    for (const listener of this.listeners) {
      if (listener.method === message.method && (!listener.sessionId || listener.sessionId === message.sessionId)) {
        listener.callback(message.params, message.sessionId);
      }
    }
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 命令超时：${method}`));
      }, 20000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify(message));
    });
  }

  on(method, callback, sessionId) {
    this.listeners.add({ method, callback, sessionId });
  }
}

const evaluate = async (cdp, sessionId, expression, options = {}) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    ...options,
  }, sessionId);
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(description);
  }
  return result.result?.value;
};

const readConsoleText = (params) => (params.args || [])
  .map((argument) => argument.value ?? argument.description ?? '')
  .join(' ');

const evidence = {
  目标: baseUrl,
  浏览器: null,
  隔离方式: `独立 headless Chromium 进程，临时 profile：${path.basename(profileDir)}`,
  检查开始时间: new Date().toISOString(),
  注入地址: detectUrl,
  视图: [],
};

let browserCdp;
try {
  await waitUntil(() => fs.existsSync(activePortPath), 15000);
  const [debugPort] = fs.readFileSync(activePortPath, 'utf8').trim().split(/\r?\n/);
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((response) => response.json());
  evidence.浏览器 = {
    版本: version.Browser,
    可执行文件: chromePath,
    进程号: chrome.pid,
    remoteDebuggingPort: Number(debugPort),
  };
  browserCdp = await CdpConnection.connect(version.webSocketDebuggerUrl);

  const views = [
    { name: 'desktop-light', label: '浅色桌面', width: 1365, height: 900, mobile: false, state: 'plain' },
    { name: 'narrow-filtered', label: '375px 短筛选结果', width: 375, height: 812, mobile: false, state: 'filter' },
    { name: 'narrow-restored-scrollhint', label: '375px 清除筛选、恢复列表并显示滚动提示', width: 375, height: 812, mobile: false, state: 'restore-and-overflow' },
    { name: 'narrow-scrollhint-dismissed', label: '375px 滚至列表末尾后收起提示', width: 375, height: 812, mobile: false, state: 'scroll-to-end' },
    { name: 'narrow-hud-dark', label: '375px HUD 深色主题', width: 375, height: 812, mobile: false, state: 'hud-dark' },
  ];

  for (const view of views) {
    const target = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const attached = await browserCdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    const consoleEntries = [];
    browserCdp.on('Runtime.consoleAPICalled', (params, eventSession) => {
      if (eventSession !== sessionId) return;
      consoleEntries.push({ type: params.type, text: readConsoleText(params) });
    }, sessionId);
    browserCdp.on('Runtime.exceptionThrown', (params, eventSession) => {
      if (eventSession !== sessionId) return;
      consoleEntries.push({ type: 'exception', text: params.exceptionDetails.exception?.description || params.exceptionDetails.text });
    }, sessionId);
    browserCdp.on('Log.entryAdded', (params, eventSession) => {
      if (eventSession !== sessionId) return;
      consoleEntries.push({ type: `log:${params.entry.level}`, text: params.entry.text });
    }, sessionId);

    await browserCdp.send('Page.enable', {}, sessionId);
    await browserCdp.send('Runtime.enable', {}, sessionId);
    await browserCdp.send('Log.enable', {}, sessionId);
    await browserCdp.send('Emulation.setDeviceMetricsOverride', {
      width: view.width,
      height: view.height,
      deviceScaleFactor: 1,
      mobile: view.mobile,
      screenWidth: view.width,
      screenHeight: view.height,
    }, sessionId);
    const loaded = new Promise((resolve) => {
      browserCdp.on('Page.loadEventFired', resolve, sessionId);
    });
    await browserCdp.send('Page.navigate', { url: baseUrl }, sessionId);
    await Promise.race([loaded, wait(25000)]);
    await waitUntil(async () => evaluate(browserCdp, sessionId, "Boolean(document.querySelector('.transfer-panel-demo'))"), 20000, 250);
    await wait(700);
    await evaluate(browserCdp, sessionId, "document.querySelector('.transfer-panel-demo').scrollIntoView({ block: 'center', inline: 'nearest' }); true");
    await wait(250);

    const preflight = await evaluate(browserCdp, sessionId, "(() => { document.title = document.title; const script = document.createElement('script'); script.textContent = 'window.__assessmentBMutationPreflight = true'; document.head.appendChild(script); return { title: document.title, marker: window.__assessmentBMutationPreflight === true, scriptAppended: script.isConnected }; })()");
    if (!preflight?.marker || !preflight.scriptAppended) throw new Error(`${view.name}: 浏览器 DOM 注入预检失败`);

    let interaction = { completed: true };
    if (view.state === 'filter') {
      interaction = await evaluate(browserCdp, sessionId, `(() => { const input = document.querySelector('[aria-label="筛选待选节点"]'); if (!input) return { completed: false, reason: '筛选框不存在' }; input.focus(); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, '站前路'); input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '站前路' })); return { completed: true, query: input.value }; })()`);
      await wait(600);
    }
    if (view.state === 'restore-and-overflow' || view.state === 'scroll-to-end') {
      interaction = await evaluate(browserCdp, sessionId, `(async () => { const input = document.querySelector('[aria-label="筛选待选节点"]'); if (!input) return { completed: false, reason: '筛选框不存在' }; input.focus(); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, '站前路'); input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '站前路' })); await new Promise((resolve) => setTimeout(resolve, 250)); const clear = document.querySelector('[aria-label="清除待选节点筛选"]'); if (!clear) return { completed: false, reason: '清除筛选按钮不存在' }; clear.click(); await new Promise((resolve) => setTimeout(resolve, 250)); return { completed: true, queryAfterClear: input.value, restoredRowCount: document.querySelector('[aria-label="待选资源树"]')?.innerText?.trim().split('\\n').length ?? 0 }; })()`);
      if (!interaction?.completed) throw new Error(`${view.name}: ${interaction?.reason || '恢复筛选失败'}`);
      if (view.state === 'scroll-to-end') {
        await evaluate(browserCdp, sessionId, "(() => { const list = document.querySelector('[aria-label^=\"已选资源列表\"]'); if (!list) return false; list.scrollTop = list.scrollHeight; return true; })()");
        await wait(500);
      }
    }
    if (view.state === 'hud-dark') {
      interaction = await evaluate(browserCdp, sessionId, "(() => { const details = document.querySelector('.transfer-panel-demo__settings'); if (!details) return { completed: false, reason: '主题设置不存在' }; details.open = true; const label = Array.from(details.querySelectorAll('label')).find((item) => item.textContent.includes('HUD 深色主题')); const checkbox = label?.querySelector('input[type=checkbox]'); if (!checkbox) return { completed: false, reason: 'HUD 深色主题开关不存在' }; if (!checkbox.checked) checkbox.click(); return { completed: checkbox.checked, hudEnabled: checkbox.checked }; })()");
      await wait(500);
    }
    if (!interaction?.completed) throw new Error(`${view.name}: 视图交互失败`);

    const injection = await evaluate(browserCdp, sessionId, `new Promise((resolve) => { const script = document.createElement('script'); script.src = '${detectUrl}?assessment=b&view=${view.name}'; script.onload = () => resolve({ loaded: true, src: script.src }); script.onerror = () => resolve({ loaded: false, src: script.src, reason: 'script error' }); document.head.appendChild(script); setTimeout(() => resolve({ loaded: false, src: script.src, reason: '5 秒内未触发 load/error' }), 5000); })`);
    await wait(2600);
    const pageState = await evaluate(browserCdp, sessionId, `(() => { const demo = document.querySelector('.transfer-panel-demo'); const list = document.querySelector('[aria-label^="已选资源列表"]'); const hint = document.querySelector('[data-testid="selected-scroll-hint"]'); const filter = document.querySelector('[aria-label="筛选待选节点"]'); const tree = document.querySelector('[aria-label="待选资源树"]'); const rect = demo?.getBoundingClientRect(); return { title: document.title, url: location.href, htmlClasses: document.documentElement.className, viewport: { width: innerWidth, height: innerHeight, visualScale: visualViewport?.scale ?? null }, metaViewport: document.querySelector('meta[name="viewport"]')?.content || null, documentWidth: document.documentElement.scrollWidth, panelRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null, demoText: demo?.innerText?.slice(0, 700) || '', filterValue: filter?.value ?? null, treeText: tree?.innerText?.slice(0, 500) || '', selectedSummary: document.querySelector('[data-testid="selected-count"]')?.innerText || '', selectedList: list ? { scrollHeight: list.scrollHeight, clientHeight: list.clientHeight, scrollTop: list.scrollTop, label: list.getAttribute('aria-label') } : null, scrollHint: hint ? { visible: !!(hint.getClientRects().length && getComputedStyle(hint).visibility !== 'hidden'), text: hint.innerText, display: getComputedStyle(hint).display } : null, hudEnabled: document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud'), overlayElements: Array.from(document.querySelectorAll('[id*="impeccable" i], [class*="impeccable" i]')).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className).slice(0, 160) })).slice(0, 20) }; })()`);
    const screenshot = await browserCdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
    const screenshotName = `${view.name}.png`;
    fs.writeFileSync(path.join(outputDir, screenshotName), Buffer.from(screenshot.data, 'base64'));
    evidence.视图.push({ ...view, viewport: `${view.width}x${view.height}`, preflight, interaction, injection, pageState, screenshot: screenshotName, console: consoleEntries });
    await browserCdp.send('Target.closeTarget', { targetId: target.targetId });
  }

  evidence.检查结束时间 = new Date().toISOString();
  evidence.浏览器结论 = evidence.视图.every((view) => view.injection.loaded)
    ? '五个代表视图均完成脚本注入并生成截图。'
    : '至少一个代表视图的脚本注入失败。';
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({ browser: evidence.浏览器, views: evidence.视图.map((view) => ({ name: view.name, injected: view.injection.loaded, injectionReason: view.injection.reason || null, screenshot: view.screenshot, consoleCount: view.console.length, htmlClasses: view.pageState.htmlClasses, bodyWidth: view.pageState.documentWidth, selectedSummary: view.pageState.selectedSummary, filteredValue: view.pageState.filterValue, scrollHint: view.pageState.scrollHint, selectedList: view.pageState.selectedList, hudEnabled: view.pageState.hudEnabled })), conclusion: evidence.浏览器结论 }, null, 2));
} catch (error) {
  evidence.检查结束时间 = new Date().toISOString();
  evidence.浏览器失败 = error.stack || String(error);
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stderr.write(`${evidence.浏览器失败}\n`);
  process.exitCode = 1;
} finally {
  try {
    if (browserCdp) await browserCdp.send('Browser.close');
  } catch {}
  try {
    if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
  } catch {}
  await wait(500);
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (error) {
    process.stderr.write(`临时 Chromium profile 清理失败：${error.message}\n`);
  }
}
