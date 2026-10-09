import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const chromePath = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const routes = [
  { name: 'lxdynamicform', url: 'http://127.0.0.1:4174/components/lxdynamicform.html', root: '.dynamic-form-demo' },
  { name: 'lxupload', url: 'http://127.0.0.1:4174/components/lxupload.html', root: '.lx-upload-demo' },
  { name: 'lxdatepicker', url: 'http://127.0.0.1:4174/components/lxdatepicker.html', root: '.lx-date-picker-demo' },
];

class CdpClient {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.socket.addEventListener('message', (event) => {
      const packet = JSON.parse(String(event.data));
      if (packet.id) {
        const pending = this.pending.get(packet.id);
        if (!pending) return;
        this.pending.delete(packet.id);
        if (packet.error) pending.reject(new Error(`${packet.error.code}: ${packet.error.message}`));
        else pending.resolve(packet.result ?? {});
      } else if (packet.method) {
        this.events.push(packet);
      }
    });
  }

  async connect() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(message));
    });
  }

  async evaluate(sessionId, expression, timeoutMs = 30000) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
      timeout: timeoutMs,
    }, sessionId);
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result?.value;
  }

  consoleFor(sessionId) {
    return this.events
      .filter((event) => event.sessionId === sessionId && [
        'Runtime.consoleAPICalled', 'Runtime.exceptionThrown', 'Log.entryAdded',
      ].includes(event.method))
      .map((event) => {
        if (event.method === 'Runtime.consoleAPICalled') {
          return {
            kind: 'console',
            type: event.params.type,
            text: (event.params.args ?? []).map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '').join(' '),
          };
        }
        if (event.method === 'Runtime.exceptionThrown') {
          return { kind: 'exception', text: event.params.exceptionDetails?.exception?.description ?? event.params.exceptionDetails?.text ?? '' };
        }
        return { kind: 'log', level: event.params.entry?.level, text: event.params.entry?.text ?? '' };
      });
  }

  close() {
    try { this.socket.close(); } catch { /* already closed */ }
  }
}

const sleep = (ms) => delay(ms);
const evalExpression = (value) => `(${JSON.stringify(value)})`;

async function waitForFile(filePath, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const content = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
      if (content[0] && content[1]) return { port: Number(content[0]), webSocketPath: content[1] };
    } catch { /* Chrome has not published its debugging endpoint yet. */ }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

async function waitForRoot(cdp, sessionId, selector, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await cdp.evaluate(sessionId, `(() => ({
      readyState: document.readyState,
      title: document.title,
      rootFound: !!document.querySelector(${JSON.stringify(selector)}),
      heading: document.querySelector('h1')?.innerText ?? ''
    }))()`);
    if (state?.rootFound || (state?.readyState === 'complete' && Date.now() + 2500 >= deadline)) return state;
    await sleep(250);
  }
  return cdp.evaluate(sessionId, `(() => ({readyState:document.readyState,title:document.title,rootFound:!!document.querySelector(${JSON.stringify(selector)}),heading:document.querySelector('h1')?.innerText??''}))()`);
}

async function main() {
  if (!fs.existsSync(chromePath)) throw new Error(`Chromium executable missing: ${chromePath}`);
  if (!fs.existsSync(detectorPath)) throw new Error(`Browser detector missing: ${detectorPath}`);

  const detectorScript = fs.readFileSync(detectorPath);
  const detectorSha256 = await import('node:crypto').then(({ createHash }) => createHash('sha256').update(detectorScript).digest('hex'));
  const serverRequests = [];
  const detectorServer = http.createServer((request, response) => {
    serverRequests.push({ method: request.method, url: request.url, at: new Date().toISOString() });
    if (request.url?.startsWith('/detect.js')) {
      response.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      response.end(detectorScript);
      return;
    }
    response.writeHead(404);
    response.end('Not found');
  });
  await new Promise((resolve, reject) => {
    detectorServer.once('error', reject);
    detectorServer.listen(0, '127.0.0.1', resolve);
  });
  const detectorPort = detectorServer.address().port;
  const profileDir = fs.mkdtempSync(path.join(outputDir, '.browser-profile-'));
  const chromeArgs = [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--disable-background-networking', '--disable-features=Translate,BackForwardCache',
    '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profileDir}`,
    'about:blank',
  ];
  const chrome = spawn(chromePath, chromeArgs, { cwd: repoRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let chromeStdout = '';
  let chromeStderr = '';
  chrome.stdout.setEncoding('utf8').on('data', (chunk) => { chromeStdout += chunk; });
  chrome.stderr.setEncoding('utf8').on('data', (chunk) => { chromeStderr += chunk; });

  let cdp;
  const pages = [];
  const screenshots = [];
  const result = {
    attemptedAt: new Date().toISOString(),
    browser: { executable: chromePath, args: chromeArgs, headless: true },
    detector: { source: detectorPath, sha256: detectorSha256, servedAt: `http://127.0.0.1:${detectorPort}/detect.js` },
    preflight: [],
    pages,
    screenshots,
    serverRequests,
  };

  try {
    const activePort = await waitForFile(path.join(profileDir, 'DevToolsActivePort'), 15000);
    const version = await (await fetch(`http://127.0.0.1:${activePort.port}/json/version`)).json();
    cdp = new CdpClient(version.webSocketDebuggerUrl);
    await cdp.connect();

    async function openRoute(route) {
      const { browserContextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId, background: false });
      const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.enable', {}, sessionId);
      await cdp.send('Runtime.enable', {}, sessionId);
      await cdp.send('Log.enable', {}, sessionId);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
      }, sessionId);
      await cdp.send('Page.navigate', { url: route.url }, sessionId);
      const page = { route: route.name, url: route.url, contextId: browserContextId, targetId, sessionId, rootSelector: route.root, views: [], interactions: [] };
      pages.push(page);
      page.loaded = await waitForRoot(cdp, sessionId, route.root);

      const preflight = await cdp.evaluate(sessionId, `(() => {
        const oldTitle = document.title;
        document.title = oldTitle + ' [Assessment B injection preflight]';
        const script = document.createElement('script');
        script.id = 'assessment-b-preflight-script';
        script.textContent = 'window.__assessmentBPreflightExecuted = true;';
        document.head.appendChild(script);
        const result = {
          titleMutationSucceeded: document.title.endsWith('[Assessment B injection preflight]'),
          scriptTagAppended: script.parentElement === document.head,
          scriptExecuted: window.__assessmentBPreflightExecuted === true,
          originalTitle: oldTitle,
          rootFound: !!document.querySelector(${JSON.stringify(route.root)}),
        };
        script.remove();
        document.title = oldTitle;
        return result;
      })()`);
      result.preflight.push({ route: route.name, ...preflight });

      const detectorUrl = `http://127.0.0.1:${detectorPort}/detect.js?route=${route.name}`;
      page.overlayInjection = await cdp.evaluate(sessionId, `new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'assessment-b-detector-script';
        script.src = ${JSON.stringify(detectorUrl)};
        script.onload = () => resolve({ loaded: true, src: script.src, apiReady: typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function' });
        script.onerror = () => resolve({ loaded: false, src: script.src, error: 'script element onerror' });
        document.head.appendChild(script);
        setTimeout(() => resolve({ loaded: false, src: script.src, error: 'script load timeout' }), 10000);
      })()`, 15000);
      await sleep(2800);
      page.detectorRequestSeen = serverRequests.some((request) => request.url?.startsWith(`/detect.js?route=${route.name}`));
      return page;
    }

    async function setViewport(page, width, height, mobile) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }, page.sessionId);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 1 : 0 }, page.sessionId);
      await sleep(250);
    }

    async function captureView(page, label) {
      const sessionId = page.sessionId;
      const root = page.rootSelector;
      const setup = await cdp.evaluate(sessionId, `(() => {
        const node = document.querySelector(${JSON.stringify(root)});
        if (node) { node.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -72); }
        return true;
      })()`);
      const layout = await cdp.evaluate(sessionId, `(() => {
        const root = document.querySelector(${JSON.stringify(root)});
        const box = root?.getBoundingClientRect();
        const main = document.querySelector('.VPContent') || document.querySelector('main');
        return {
          title: document.title,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          mainWidth: main?.getBoundingClientRect().width ?? null,
          root: box ? { x: box.x, y: box.y, width: box.width, height: box.height, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth } : null,
          hudActive: !!root?.closest('.lx-theme-hud') || !!root?.querySelector('.lx-theme-hud'),
          visibleDatePanels: [...document.querySelectorAll('.el-picker-panel')].filter((el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0).length,
          rootText: root?.innerText?.slice(0, 1400) ?? '',
        };
      })()`);
      const detection = await cdp.evaluate(sessionId, `(() => {
        if (typeof window.impeccableScan !== 'function' || typeof window.impeccableDetect !== 'function') return { apiReady: false, findings: [] };
        window.impeccableScan();
        const raw = window.impeccableDetect();
        const root = document.querySelector(${JSON.stringify(root)});
        const shell = '.VPNav, .VPSidebar, .VPDocAside, .VPDocFooter, .VPFooter, .VPNavScreen';
        const findings = raw.map((entry) => {
          let el = null;
          try { el = document.querySelector(entry.selector); } catch { /* detector selector is not queryable */ }
          let owner = 'outside-demo';
          if (el && root?.contains(el)) owner = 'component-demo';
          else if (el?.closest(shell)) owner = 'vitepress-shell';
          else if (el?.closest('.VPDoc, .VPContent, main')) owner = 'documentation-content';
          return { ...entry, owner, targetTag: el?.tagName?.toLowerCase() ?? null, targetText: el?.innerText?.trim()?.slice(0, 220) ?? '', targetClasses: el?.className?.toString?.() ?? '' };
        });
        const ruleCount = findings.reduce((sum, entry) => sum + (entry.findings?.length ?? 0), 0);
        const banner = document.querySelector('.impeccable-banner');
        return {
          apiReady: true,
          findings,
          findingElementCount: findings.length,
          ruleCount,
          overlayElements: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
          overlayLabels: document.querySelectorAll('.impeccable-label').length,
          bannerCount: document.querySelectorAll('.impeccable-banner').length,
          bannerText: banner?.innerText?.slice(0, 1200) ?? '',
        };
      })()`);
      await sleep(450);
      const screenshotName = `${page.route}-${label}-overlay.png`;
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true }, sessionId);
      const screenshotPath = path.join(outputDir, screenshotName);
      fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
      screenshots.push({ route: page.route, view: label, file: screenshotName, bytes: fs.statSync(screenshotPath).size });
      const view = { label, layout, detector: detection, screenshot: screenshotName, console: cdp.consoleFor(sessionId) };
      page.views.push(view);
      return view;
    }

    async function toggleHud(page, enabled) {
      const result = await cdp.evaluate(page.sessionId, `(() => {
        const label = [...document.querySelectorAll('label')].find((item) => item.innerText.includes('HUD 深色主题'));
        const input = label?.querySelector('input[type="checkbox"]');
        if (!input) return { found: false, checked: null };
        if (input.checked !== ${enabled}) input.click();
        return { found: true, checked: input.checked, classActive: !!document.querySelector(${JSON.stringify(page.rootSelector)})?.closest('.lx-theme-hud') || !!document.querySelector(${JSON.stringify(page.rootSelector)})?.querySelector('.lx-theme-hud') };
      })()`);
      await sleep(350);
      return result;
    }

    async function performInteraction(page) {
      if (page.route === 'lxdynamicform') {
        const result = await cdp.evaluate(page.sessionId, `(() => {
          const button = [...document.querySelectorAll('button')].find((item) => item.innerText.includes('提交校验'));
          if (!button) return { attempted: false, reason: '提交校验按钮不存在' };
          button.click();
          return { attempted: true, buttonDisabled: button.disabled };
        })()`);
        await sleep(400);
        page.interactions.push({ name: 'empty-form-validation', result: await cdp.evaluate(page.sessionId, `(() => ({
          action: ${evalExpression(result)},
          alerts: [...document.querySelectorAll('[role="alert"]')].map((el) => el.innerText.trim()).filter(Boolean),
          errors: [...document.querySelectorAll('.is-error, .el-form-item__error')].map((el) => el.innerText.trim()).filter(Boolean),
        }))()`) });
        await captureView(page, 'desktop-validation-error');
      } else if (page.route === 'lxupload') {
        const result = await cdp.evaluate(page.sessionId, `(() => {
          const root = document.querySelector(${JSON.stringify(page.rootSelector)});
          const compact = [...(root?.querySelectorAll('button') ?? [])].find((item) => item.innerText.trim() === '紧凑标签');
          compact?.click();
          const fail = [...(root?.querySelectorAll('button') ?? [])].find((item) => item.innerText.includes('下一次上传失败'));
          fail?.click();
          const input = root?.querySelector('input[type="file"]');
          if (!input) return { attempted: !!compact, fileInputFound: false, compactSelected: compact?.getAttribute('aria-pressed') };
          const transfer = new DataTransfer();
          transfer.items.add(new File(['assessment-b'], 'assessment-b-sample.png', { type: 'image/png' }));
          input.files = transfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          const start = [...(root?.querySelectorAll('button') ?? [])].find((item) => item.innerText.includes('开始上传'));
          const startEnabled = !!start && !start.disabled;
          if (startEnabled) start.click();
          return { attempted: true, fileInputFound: true, fileCount: input.files.length, startEnabled, compactSelected: compact?.getAttribute('aria-pressed') };
        })()`);
        await sleep(1400);
        page.interactions.push({ name: 'mock-upload-failure', result, statusText: await cdp.evaluate(page.sessionId, `document.querySelector(${JSON.stringify(page.rootSelector)})?.innerText?.slice(-500) ?? ''`), newNetworkEntries: await cdp.evaluate(page.sessionId, `performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'xmlhttprequest').map((entry) => entry.name)`) });
        await captureView(page, 'desktop-upload-interaction');
      } else if (page.route === 'lxdatepicker') {
        const result = await cdp.evaluate(page.sessionId, `(() => {
          const root = document.querySelector(${JSON.stringify(page.rootSelector)});
          const input = root?.querySelector('input[placeholder="开始日期"]') || root?.querySelector('input.el-input__inner');
          if (!input) return { attempted: false, reason: '日期输入框不存在' };
          input.focus();
          input.click();
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
          return { attempted: true, placeholder: input.placeholder };
        })()`);
        await sleep(600);
        page.interactions.push({ name: 'open-date-panel', result, visiblePanels: await cdp.evaluate(page.sessionId, `([...document.querySelectorAll('.el-picker-panel')].filter((el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0).length)`) });
        await captureView(page, 'desktop-calendar-open');
        const shortcut = await cdp.evaluate(page.sessionId, `(() => {
          const button = [...document.querySelectorAll('.el-picker-panel button, .el-picker-panel__sidebar button')].find((item) => item.innerText.trim() === '本周');
          if (!button) return { selected: false, reason: '本周快捷项未找到' };
          button.click();
          return { selected: true, label: button.innerText.trim() };
        })()`);
        await sleep(500);
        page.interactions.push({ name: 'select-this-week-shortcut', result: shortcut, status: await cdp.evaluate(page.sessionId, `document.querySelector(${JSON.stringify(page.rootSelector)})?.innerText?.slice(0, 500) ?? ''`) });
        await captureView(page, 'desktop-calendar-shortcut');
        await cdp.evaluate(page.sessionId, `document.activeElement?.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
        await sleep(250);
      }
    }

    for (const route of routes) {
      const page = await openRoute(route);
      if (!page.overlayInjection?.loaded || !page.overlayInjection?.apiReady) {
        page.injectionFailed = true;
        continue;
      }
      page.detectorRequestSeen = page.detectorRequestSeen && serverRequests.length > 0;
      page.views.push(await captureView(page, 'desktop-light'));
      page.hudToggleDesktop = await toggleHud(page, true);
      page.views.push(await captureView(page, 'desktop-hud'));
      await performInteraction(page);
      await setViewport(page, 375, 812, true);
      page.views.push(await captureView(page, 'mobile-375-hud'));
      page.hudToggleMobile = await toggleHud(page, false);
      page.views.push(await captureView(page, 'mobile-375-light'));
      await cdp.send('Target.disposeBrowserContext', { browserContextId: page.contextId });
    }

    result.browserVersion = version.Browser;
    result.detectorServerRequests = serverRequests;
    result.pages = pages.map((page) => ({
      ...page,
      consoleSummary: [...new Set(page.views.flatMap((view) => view.console.map((entry) => `${entry.kind}:${entry.type ?? entry.level ?? ''}:${entry.text}`)))],
    }));
  } catch (error) {
    result.failure = { message: error.message, stack: error.stack };
    throw error;
  } finally {
    result.detectorServerRequests = serverRequests;
    result.chromeStdout = chromeStdout;
    result.chromeStderr = chromeStderr;
    fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`);
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch { /* Browser may already be closed. */ }
      cdp.close();
    }
    if (chrome.exitCode === null) {
      try { chrome.kill(); } catch { /* Chrome may already be closed. */ }
      await Promise.race([new Promise((resolve) => chrome.once('exit', resolve)), sleep(4000)]);
    }
    await new Promise((resolve) => detectorServer.close(resolve));
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* Keep evidence run even if Chromium left a locked profile file. */ }
    fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
}

main().then(() => {
  const evidence = JSON.parse(fs.readFileSync(path.join(outputDir, 'browser-evidence.json'), 'utf8'));
  process.stdout.write(`${JSON.stringify({
    browserVersion: evidence.browserVersion ?? null,
    preflight: evidence.preflight,
    pages: evidence.pages?.map((page) => ({
      route: page.route,
      loaded: page.loaded,
      overlayInjection: page.overlayInjection,
      detectorRequestSeen: page.detectorRequestSeen,
      views: page.views?.map((view) => ({
        label: view.label,
        screenshot: view.screenshot,
        findings: view.detector?.findingElementCount ?? null,
        ruleCount: view.detector?.ruleCount ?? null,
        horizontalOverflow: view.layout?.horizontalOverflow ?? null,
      })),
      interactions: page.interactions,
      consoleSummary: page.consoleSummary,
    })),
    detectorServerRequests: evidence.detectorServerRequests,
    failure: evidence.failure ?? null,
  }, null, 2)}\n`);
}).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 2;
});
