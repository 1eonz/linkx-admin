const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

const root = 'F:\\work\\linkx-admin';
const outDir = __dirname;
const browserDir = path.join(outDir, 'browser');
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const liveServerScript = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs';
const appRequire = createRequire(path.join(root, 'other-admin', 'admin-vue3', 'package.json'));
const { chromium } = appRequire('@playwright/test');
const browserCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

fs.mkdirSync(browserDir, { recursive: true });
const taskTemp = path.join(browserDir, 'tmp');
fs.mkdirSync(taskTemp, { recursive: true });

const evidence = {
  startedAt: new Date().toISOString(),
  targetUrl,
  browserAutomation: '@playwright/test via installed admin-vue3 dependency',
  browser: null,
  preflight: null,
  liveServer: null,
  views: [],
  errors: [],
};
let browser = null;
let serverStarted = false;

function writeJson(name, value) {
  fs.writeFileSync(path.join(browserDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function launchBrowser() {
  const attempts = [];
  for (const executablePath of browserCandidates) {
    if (!fs.existsSync(executablePath)) {
      attempts.push({ executablePath, error: 'executable not found' });
      continue;
    }
    try {
      const instance = await chromium.launch({
        headless: true,
        executablePath,
        args: ['--no-first-run', '--no-default-browser-check'],
      });
      evidence.browser = { executablePath, version: instance.version(), attempts };
      return instance;
    } catch (error) {
      attempts.push({ executablePath, error: String(error) });
    }
  }
  evidence.browser = { attempts };
  throw new Error(`无法通过 Playwright 启动系统浏览器：${JSON.stringify(attempts)}`);
}

function addPageListeners(page, events) {
  page.on('console', (message) => {
    events.console.push({ type: message.type(), text: message.text(), location: message.location() });
  });
  page.on('pageerror', (error) => events.pageErrors.push(String(error)));
  page.on('requestfailed', (request) => {
    events.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
  });
}

async function collectPageState(page) {
  return page.evaluate(() => ({
    title: document.title,
    htmlClass: document.documentElement.className,
    htmlTheme: document.documentElement.getAttribute('data-theme'),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    pageSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    bodyStyle: {
      color: getComputedStyle(document.body).color,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
    },
    headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 30).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').trim().slice(0, 160),
    })),
    formCount: document.querySelectorAll('form').length,
    inputCount: document.querySelectorAll('input,textarea,select').length,
    themeButton: [...document.querySelectorAll('.VPSwitchAppearance')].map((el) => ({
      title: el.getAttribute('title'),
      ariaLabel: el.getAttribute('aria-label'),
    })),
  }));
}

async function ensureTheme(page, desired) {
  const readTheme = () => page.evaluate(() => ({
    isDark: document.documentElement.classList.contains('dark'),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
  }));
  let actual = await readTheme();
  if ((desired === 'dark' && actual.isDark) || (desired === 'light' && !actual.isDark)) {
    return { desired, method: 'initial appearance state', actual };
  }

  const toggle = page.locator('.VPSwitchAppearance').first();
  let clicked = false;
  if (await toggle.count()) {
    await toggle.click({ timeout: 3000 });
    clicked = true;
    await page.waitForTimeout(350);
    actual = await readTheme();
  }
  return {
    desired,
    method: clicked ? 'visible VitePress appearance toggle' : 'no appearance toggle found',
    actual,
    matched: desired === 'dark' ? actual.isDark : !actual.isDark,
  };
}

async function collectSerializedFindings(page) {
  return page.evaluate(() => {
    if (typeof window.impeccableDetect !== 'function') return null;
    return window.impeccableDetect().map((group) => {
      let element = null;
      try { element = document.querySelector(group.selector); } catch {}
      const ancestors = [];
      for (let current = element, depth = 0; current && depth < 7; current = current.parentElement, depth++) {
        ancestors.push({
          tag: current.tagName.toLowerCase(),
          id: current.id || null,
          className: typeof current.className === 'string' ? current.className : '',
        });
      }
      const text = (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        ...group,
        elementEvidence: element ? {
          className: typeof element.className === 'string' ? element.className : '',
          textSnippet: text.slice(0, 220),
          ancestors,
          insideCode: Boolean(element.closest('pre, code, [class*="language-"]')),
          insideDocsBody: Boolean(element.closest('.vp-doc')),
          insideNavigation: Boolean(element.closest('.VPNav, .VPSidebar, .VPNavBar, .VPMenu')),
          insideForm: Boolean(element.closest('form, .el-form, .lx-dynamic-form')),
          insideOverlay: Boolean(element.closest('.impeccable-overlay, .impeccable-label, .impeccable-banner')),
          rendered: element.getClientRects().length > 0,
        } : null,
      };
    });
  });
}

async function captureView(spec, livePort) {
  const events = { console: [], pageErrors: [], failedRequests: [] };
  const context = await browser.newContext({
    viewport: spec.viewport,
    deviceScaleFactor: 1,
    colorScheme: spec.colorScheme,
    isMobile: spec.isMobile || false,
    hasTouch: spec.hasTouch || false,
  });
  await context.addInitScript(({ key, appearance }) => {
    try { localStorage.setItem(key, appearance); } catch {}
  }, { key: 'vitepress-theme-appearance', appearance: spec.colorScheme });
  const page = await context.newPage();
  addPageListeners(page, events);
  let responseStatus = null;
  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    responseStatus = response?.status() ?? null;
    await page.waitForTimeout(900);
    const theme = await ensureTheme(page, spec.colorScheme);
    await page.evaluate(() => window.scrollTo(0, 0));
    const pageState = await collectPageState(page);
    await page.addScriptTag({ url: `http://localhost:${livePort}/detect.js` });
    await page.waitForTimeout(2800);
    const overlayState = await page.evaluate(() => ({
      detectorApi: typeof window.impeccableScan,
      detectionApi: typeof window.impeccableDetect,
      scriptSources: [...document.scripts].map((script) => script.src).filter(Boolean),
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      labelCount: document.querySelectorAll('.impeccable-label').length,
      bannerText: [...document.querySelectorAll('.impeccable-banner')].map((node) => (node.innerText || '').trim()),
    }));
    const serializedFindings = await collectSerializedFindings(page);
    const screenshotName = `${spec.id}.png`;
    await page.screenshot({ path: path.join(browserDir, screenshotName), fullPage: true, animations: 'disabled' });
    const result = {
      id: spec.id,
      description: spec.description,
      context: {
        freshContext: true,
        freshPage: true,
        viewport: spec.viewport,
        colorScheme: spec.colorScheme,
        isMobile: spec.isMobile || false,
        hasTouch: spec.hasTouch || false,
      },
      responseStatus,
      theme,
      pageState,
      injection: {
        endpoint: `http://localhost:${livePort}/detect.js`,
        succeeded: overlayState.detectorApi === 'function' && overlayState.detectionApi === 'function',
      },
      overlayState,
      serializedFindings,
      console: events.console,
      impeccableConsole: events.console.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: screenshotName,
    };
    writeJson(`${spec.id}.json`, result);
    return result;
  } catch (error) {
    const result = {
      id: spec.id,
      description: spec.description,
      context: spec,
      responseStatus,
      injection: { endpoint: livePort ? `http://localhost:${livePort}/detect.js` : null, succeeded: false, error: String(error) },
      console: events.console,
      impeccableConsole: events.console.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: null,
    };
    writeJson(`${spec.id}.json`, result);
    evidence.errors.push({ phase: spec.id, error: String(error) });
    return result;
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  browser = await launchBrowser();
  const preflightContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const preflightPage = await preflightContext.newPage();
  const preflightEvents = { console: [], pageErrors: [], failedRequests: [] };
  addPageListeners(preflightPage, preflightEvents);
  let preflightStatus = null;
  let preflightResult;
  try {
    const response = await preflightPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    preflightStatus = response?.status() ?? null;
    await preflightPage.waitForTimeout(900);
    const mutation = await preflightPage.evaluate(() => {
      document.title = '[Assessment B preflight]';
      const script = document.createElement('script');
      script.id = '__assessment_b_mutation_preflight';
      script.textContent = "window.__assessmentBPreflight = { executed: true, marker: 'injection-ok' };";
      document.head.appendChild(script);
      return {
        title: document.title,
        scriptConnected: script.isConnected,
        scriptType: script.type || 'classic',
        marker: window.__assessmentBPreflight || null,
      };
    });
    const pageState = await collectPageState(preflightPage);
    const screenshot = 'preflight.png';
    await preflightPage.screenshot({ path: path.join(browserDir, screenshot), fullPage: true, animations: 'disabled' });
    const succeeded = preflightStatus < 400
      && mutation.title === '[Assessment B preflight]'
      && mutation.scriptConnected
      && mutation.marker?.executed === true;
    preflightResult = {
      freshContext: true,
      freshPage: true,
      responseStatus: preflightStatus,
      mutableInjectionSucceeded: succeeded,
      mutation,
      pageState,
      console: preflightEvents.console,
      pageErrors: preflightEvents.pageErrors,
      failedRequests: preflightEvents.failedRequests,
      screenshot,
    };
    evidence.preflight = preflightResult;
    writeJson('preflight.json', preflightResult);
  } catch (error) {
    preflightResult = { freshContext: true, freshPage: true, responseStatus: preflightStatus, mutableInjectionSucceeded: false, error: String(error) };
    evidence.preflight = preflightResult;
    evidence.errors.push({ phase: 'preflight', error: String(error) });
    writeJson('preflight.json', preflightResult);
  } finally {
    await preflightContext.close();
  }

  if (!preflightResult.mutableInjectionSucceeded) {
    evidence.liveServer = {
      started: false,
      skipped: '页面标题与内联脚本变更预检失败，按流程停止 live-server 与 overlay 步骤。',
      startCommand: `node "${liveServerScript}" --background`,
      stopCommand: `node "${liveServerScript}" stop --keep-inject`,
    };
    throw new Error('浏览器可变注入预检失败。');
  }

  const server = spawnSync(process.execPath, [liveServerScript, '--background'], {
    cwd: outDir,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 20000,
    env: { ...process.env, TEMP: taskTemp, TMP: taskTemp },
  });
  let serverInfo = null;
  let serverParseError = null;
  try { serverInfo = JSON.parse(String(server.stdout || '').trim()); } catch (error) { serverParseError = String(error); }
  serverStarted = server.status === 0 && Number.isInteger(serverInfo?.port) && Number.isInteger(serverInfo?.pid);
  evidence.liveServer = {
    startCommand: `node "${liveServerScript}" --background`,
    cwd: outDir,
    exitCode: server.status,
    signal: server.signal,
    stdoutToken: serverInfo ? '已脱敏；PID 和端口单独记录。' : String(server.stdout || ''),
    stderr: String(server.stderr || ''),
    parseError: serverParseError,
    started: serverStarted,
    pid: serverInfo?.pid ?? null,
    port: serverInfo?.port ?? null,
    stopCommand: `node "${liveServerScript}" stop --keep-inject`,
    stopExitCode: null,
    stopStdout: null,
    stopStderr: null,
    stopped: null,
  };
  writeJson('evidence-progress.json', evidence);
  if (!serverStarted) throw new Error('Impeccable live-server 未能启动；见 browser/evidence-progress.json。');

  const views = [
    {
      id: 'light-desktop',
      description: '亮色桌面',
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
    },
    {
      id: 'dark-desktop-hud',
      description: 'HUD 深色桌面：深色主题下显示 Impeccable overlay HUD',
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'dark',
    },
    {
      id: 'touch-375',
      description: '375px 触屏',
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
      isMobile: true,
      hasTouch: true,
    },
  ];
  for (const spec of views) {
    const result = await captureView(spec, serverInfo.port);
    evidence.views.push({
      id: result.id,
      description: result.description,
      status: result.responseStatus,
      theme: result.theme,
      injectionSucceeded: result.injection?.succeeded ?? false,
      overlayCount: result.overlayState?.overlayCount ?? null,
      serializedFindingGroups: result.serializedFindings?.length ?? null,
      pageErrors: result.pageErrors?.length ?? null,
      failedRequests: result.failedRequests?.length ?? null,
      screenshot: result.screenshot,
      json: `${result.id}.json`,
    });
  }

  if (serverStarted) {
    const stopped = spawnSync(process.execPath, [liveServerScript, 'stop', '--keep-inject'], {
      cwd: outDir,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 20000,
      env: { ...process.env, TEMP: taskTemp, TMP: taskTemp },
    });
    evidence.liveServer.stopExitCode = stopped.status;
    evidence.liveServer.stopStdout = String(stopped.stdout || '').trim();
    evidence.liveServer.stopStderr = String(stopped.stderr || '').trim();
    try {
      await fetch(`http://127.0.0.1:${serverInfo.port}/health`, { signal: AbortSignal.timeout(1200) });
      evidence.liveServer.stopped = false;
    } catch {
      evidence.liveServer.stopped = true;
    }
    serverStarted = false;
  }
  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
    evidence.targetAfterAssessment = { status: response.status, stillReachable: true };
  } catch (error) {
    evidence.targetAfterAssessment = { stillReachable: false, error: String(error) };
  }
  evidence.finishedAt = new Date().toISOString();
  writeJson('evidence.json', evidence);
}

main().catch(async (error) => {
  evidence.errors.push({ phase: 'uncaught', error: String(error) });
  if (serverStarted && evidence.liveServer?.port) {
    const stopped = spawnSync(process.execPath, [liveServerScript, 'stop', '--keep-inject'], {
      cwd: outDir,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 20000,
      env: { ...process.env, TEMP: taskTemp, TMP: taskTemp },
    });
    evidence.liveServer.stopExitCode = stopped.status;
    evidence.liveServer.stopStdout = String(stopped.stdout || '').trim();
    evidence.liveServer.stopStderr = String(stopped.stderr || '').trim();
    evidence.liveServer.stopped = stopped.status === 0;
    serverStarted = false;
  }
  evidence.finishedAt = new Date().toISOString();
  writeJson('evidence.json', evidence);
  if (browser) await browser.close().catch(() => {});
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
