const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

const outputDir = __dirname;
const browserDir = path.join(outputDir, 'browser');
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const serverScript = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\live-server.mjs';
const nodePath = process.execPath;
const appRequire = createRequire('F:\\work\\linkx-admin\\other-admin\\admin-vue3\\package.json');
const { chromium } = appRequire('@playwright/test');
const candidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

fs.mkdirSync(browserDir, { recursive: true });
process.env.TEMP = path.join(browserDir, 'tmp');
process.env.TMP = process.env.TEMP;
fs.mkdirSync(process.env.TEMP, { recursive: true });

const evidence = {
  startedAt: new Date().toISOString(),
  targetUrl,
  automation: '@playwright/test via installed admin-vue3 dependency',
  preflight: null,
  service: null,
  views: [],
  errors: [],
};
let browser = null;
let liveServerStarted = false;

function saveJson(name, value) {
  fs.writeFileSync(path.join(browserDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function attachPageEvidence(page, label, events) {
  page.on('console', (message) => {
    events.console.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on('pageerror', (error) => events.pageErrors.push(String(error)));
  page.on('requestfailed', (request) => events.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText || 'unknown',
  }));
}

async function launchBrowser() {
  const attempts = [];
  for (const executablePath of candidates) {
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
      evidence.browserLaunch = { executablePath, version: instance.version(), attempts };
      return instance;
    } catch (error) {
      attempts.push({ executablePath, error: String(error) });
    }
  }
  evidence.browserLaunch = { attempts };
  throw new Error('Could not launch a system browser through Playwright.');
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const style = (element) => {
      if (!element) return null;
      const computed = getComputedStyle(element);
      return { color: computed.color, backgroundColor: computed.backgroundColor };
    };
    const html = document.documentElement;
    const body = document.body;
    const buttons = [...document.querySelectorAll('button')].map((button) => ({
      text: (button.innerText || button.textContent || '').trim().slice(0, 100),
      ariaLabel: button.getAttribute('aria-label'),
      title: button.getAttribute('title'),
      className: typeof button.className === 'string' ? button.className : '',
    })).slice(0, 40);
    const headings = [...document.querySelectorAll('h1,h2,h3')].map((heading) => ({
      tag: heading.tagName.toLowerCase(),
      text: (heading.innerText || '').trim().slice(0, 160),
    })).slice(0, 40);
    return {
      title: document.title,
      htmlClass: html.className,
      htmlTheme: html.getAttribute('data-theme'),
      colorScheme: getComputedStyle(html).colorScheme,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      pageSize: { width: html.scrollWidth, height: html.scrollHeight },
      horizontalOverflow: html.scrollWidth > innerWidth,
      bodyStyle: style(body),
      firstHeading: headings[0] || null,
      headings,
      buttons,
      formCount: document.querySelectorAll('form').length,
      inputCount: document.querySelectorAll('input,textarea,select').length,
    };
  });
}

async function setThemeIfAvailable(page, desired) {
  const before = await page.evaluate(() => ({
    darkClass: document.documentElement.classList.contains('dark'),
    dataTheme: document.documentElement.getAttribute('data-theme'),
  }));
  const matches = desired === 'dark'
    ? before.darkClass || before.dataTheme === 'dark'
    : !before.darkClass && before.dataTheme !== 'dark';
  if (matches) return { method: 'initial preference', before, clicked: false };

  const toggles = page.locator('.VPSwitchAppearance, button[aria-label*="appearance" i], button[aria-label*="theme" i]').first();
  if (await toggles.count()) {
    await toggles.click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(250);
  }
  const after = await page.evaluate(() => ({
    darkClass: document.documentElement.classList.contains('dark'),
    dataTheme: document.documentElement.getAttribute('data-theme'),
  }));
  const afterMatches = desired === 'dark'
    ? after.darkClass || after.dataTheme === 'dark'
    : !after.darkClass && after.dataTheme !== 'dark';
  return {
    method: afterMatches ? 'visible theme toggle' : 'preference and toggle did not reach requested theme',
    before,
    after,
    clicked: Boolean(await toggles.count()),
    matched: afterMatches,
  };
}

async function captureView(spec, port) {
  const events = { console: [], pageErrors: [], failedRequests: [] };
  const context = await browser.newContext({
    viewport: spec.viewport,
    deviceScaleFactor: spec.deviceScaleFactor || 1,
    isMobile: spec.isMobile || false,
    hasTouch: spec.hasTouch || false,
    colorScheme: spec.colorScheme,
  });
  await context.addInitScript((theme) => {
    try { localStorage.setItem('vitepress-theme-appearance', theme); } catch {}
  }, spec.colorScheme);
  const page = await context.newPage();
  attachPageEvidence(page, spec.id, events);
  let responseStatus = null;
  let injectionError = null;
  let theme = null;
  let pageState = null;
  let overlayState = null;

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    responseStatus = response ? response.status() : null;
    await page.waitForTimeout(900);
    theme = await setThemeIfAvailable(page, spec.colorScheme);
    pageState = await inspectPage(page);
    await page.addScriptTag({ url: `http://localhost:${port}/detect.js` });
    await page.waitForTimeout(2500);
    overlayState = await page.evaluate(() => ({
      detectorApi: typeof window.impeccableScan,
      detectionApi: typeof window.impeccableDetect,
      scriptSources: [...document.scripts].map((script) => script.src).filter(Boolean),
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      labelCount: document.querySelectorAll('.impeccable-label').length,
      bannerText: [...document.querySelectorAll('.impeccable-banner')].map((node) => (node.innerText || '').trim()),
      findings: (() => {
        if (typeof window.impeccableDetect !== 'function') return null;
        const groups = window.impeccableDetect();
        return groups.map((group) => {
          let element = null;
          try { element = document.querySelector(group.selector); } catch {}
          const ancestors = [];
          for (let current = element, depth = 0; current && depth < 6; current = current.parentElement, depth++) {
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
              textSnippet: text.slice(0, 180),
              ancestors,
              insideCode: Boolean(element.closest('pre, code, [class*="language-"]')),
              insideDocsBody: Boolean(element.closest('.vp-doc')),
              insideNavigation: Boolean(element.closest('.VPNav, .VPSidebar, .VPNavBar, .VPMenu')),
              insideForm: Boolean(element.closest('form, .el-form, .lx-dynamic-form')),
              rendered: element.getClientRects().length > 0,
            } : null,
          };
        });
      })(),
    }));
    const screenshotPath = path.join(browserDir, `${spec.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
    return {
      id: spec.id,
      description: spec.description,
      context: {
        viewport: spec.viewport,
        deviceScaleFactor: spec.deviceScaleFactor || 1,
        isMobile: spec.isMobile || false,
        hasTouch: spec.hasTouch || false,
        colorScheme: spec.colorScheme,
      },
      responseStatus,
      theme,
      pageState,
      injection: {
        method: 'script element loaded from the Impeccable live-server /detect.js endpoint',
        succeeded: Boolean(overlayState && overlayState.detectorApi === 'function' && overlayState.detectionApi === 'function'),
        error: injectionError,
      },
      overlayState,
      console: events.console,
      impeccableConsole: events.console.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: path.basename(screenshotPath),
    };
  } catch (error) {
    injectionError = String(error);
    const result = {
      id: spec.id,
      description: spec.description,
      context: spec,
      responseStatus,
      theme,
      pageState,
      injection: { method: 'script element loaded from the Impeccable live-server /detect.js endpoint', succeeded: false, error: injectionError },
      overlayState,
      console: events.console,
      impeccableConsole: events.console.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: null,
    };
    return result;
  } finally {
    await context.close().catch(() => {});
  }
}

async function run() {
  let preflightContext = null;
  try {
    browser = await launchBrowser();
    preflightContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    const page = await preflightContext.newPage();
    const events = { console: [], pageErrors: [], failedRequests: [] };
    attachPageEvidence(page, 'preflight', events);
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(700);
    const mutation = await page.evaluate(() => {
      document.title = '[Assessment B preflight]';
      const script = document.createElement('script');
      script.id = '__impeccable-assessment-preflight';
      script.textContent = "window.__impeccableAssessmentPreflight = { executed: true, marker: 'mutable-script-ok' };";
      document.head.appendChild(script);
      return {
        title: document.title,
        scriptConnected: script.isConnected,
        scriptType: script.type || 'classic',
        marker: window.__impeccableAssessmentPreflight || null,
      };
    });
    const state = await inspectPage(page);
    const passed = response?.status() < 400
      && mutation.title === '[Assessment B preflight]'
      && mutation.scriptConnected
      && mutation.marker?.executed === true;
    evidence.preflight = {
      succeeded: passed,
      responseStatus: response?.status() || null,
      mutation,
      pageState: state,
      console: events.console,
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: 'preflight.png',
    };
    await page.screenshot({ path: path.join(browserDir, 'preflight.png'), fullPage: true, animations: 'disabled' });
    await preflightContext.close();
    preflightContext = null;
  } catch (error) {
    evidence.preflight = { succeeded: false, error: String(error) };
    evidence.errors.push({ phase: 'preflight', error: String(error) });
  } finally {
    if (preflightContext) await preflightContext.close().catch(() => {});
  }

  if (evidence.preflight?.succeeded) {
    const start = spawnSync(nodePath, [serverScript, '--background'], {
      cwd: outputDir,
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true,
    });
    let info = null;
    let parseError = null;
    try { info = JSON.parse(String(start.stdout || '').trim()); } catch (error) { parseError = String(error); }
    liveServerStarted = start.status === 0 && Number.isInteger(info?.port) && Number.isInteger(info?.pid);
    evidence.service = {
      startCommand: `node "${serverScript}" --background`,
      cwd: outputDir,
      startExitCode: start.status,
      startSignal: start.signal,
      startStdoutRedacted: info ? `{ pid: ${info.pid}, port: ${info.port}, token: [redacted] }` : String(start.stdout || ''),
      startStderr: String(start.stderr || ''),
      parseError,
      started: liveServerStarted,
      pid: info?.pid || null,
      port: info?.port || null,
      stopCommand: `node "${serverScript}" stop --keep-inject`,
      stopExitCode: null,
      stopStdout: null,
      stopStderr: null,
      stopped: null,
    };

    if (liveServerStarted) {
      const views = [
        {
          id: 'light-desktop',
          description: '亮色桌面视图',
          viewport: { width: 1440, height: 1000 },
          colorScheme: 'light',
        },
        {
          id: 'dark-desktop',
          description: '深色桌面视图',
          viewport: { width: 1440, height: 1000 },
          colorScheme: 'dark',
        },
        {
          id: 'light-touch-375',
          description: '375px 触屏视图',
          viewport: { width: 375, height: 812 },
          colorScheme: 'light',
          isMobile: true,
          hasTouch: true,
        },
      ];
      for (const spec of views) {
        try {
          const result = await captureView(spec, info.port);
          evidence.views.push(result);
          saveJson(`${spec.id}.json`, result);
        } catch (error) {
          evidence.errors.push({ phase: spec.id, error: String(error) });
        }
      }
    }
  } else {
    evidence.service = {
      started: false,
      skipped: 'preflight did not prove mutable browser injection',
      startCommand: `node "${serverScript}" --background`,
      stopCommand: `node "${serverScript}" stop --keep-inject`,
    };
  }

  if (liveServerStarted) {
    const stop = spawnSync(nodePath, [serverScript, 'stop', '--keep-inject'], {
      cwd: outputDir,
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true,
    });
    evidence.service.stopExitCode = stop.status;
    evidence.service.stopStdout = String(stop.stdout || '').trim();
    evidence.service.stopStderr = String(stop.stderr || '').trim();
    try {
      await fetch(`http://127.0.0.1:${evidence.service.port}/health`, { signal: AbortSignal.timeout(1500) });
      evidence.service.stopped = false;
    } catch {
      evidence.service.stopped = true;
    }
    liveServerStarted = false;
  }

  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
    evidence.targetAfterAssessment = { status: response.status, stillReachable: true };
  } catch (error) {
    evidence.targetAfterAssessment = { stillReachable: false, error: String(error) };
  }
  evidence.finishedAt = new Date().toISOString();
  saveJson('evidence.json', evidence);
  if (browser) await browser.close().catch(() => {});
}

run().catch(async (error) => {
  evidence.errors.push({ phase: 'uncaught', error: String(error) });
  evidence.finishedAt = new Date().toISOString();
  saveJson('evidence.json', evidence);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
