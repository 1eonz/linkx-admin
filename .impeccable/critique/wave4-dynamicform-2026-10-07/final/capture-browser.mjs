import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const outputDir = resolve('.impeccable/critique/wave4-dynamicform-2026-10-07/final');
const screenshotDir = join(outputDir, 'screenshots');
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const detectorScript = readFileSync(detectorPath, 'utf8');
const allowedHosts = new Set(['127.0.0.1', 'localhost', '::1']);
const browserErrors = [];
const blockedExternalRequests = [];
const allRequests = [];
const captures = [];
const consoleOutput = [];
let activeView = 'setup';

mkdirSync(screenshotDir, { recursive: true });

const detectorServer = createServer((request, response) => {
  if (request.url !== '/detect.js') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': 'application/javascript; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(detectorScript);
});

let browser;

function recordConsole(page, viewName) {
  activeView = viewName;
  const start = consoleOutput.length;
  return start;
}

async function injectDetector(page, pageLabel, port) {
  await page.evaluate((label) => {
    document.title = `Assessment B | ${label}`;
    const probe = document.createElement('script');
    probe.textContent = 'window.__assessmentBInjectionPreflight = true;';
    (document.head || document.documentElement).appendChild(probe);
  }, pageLabel);

  const preflight = await page.evaluate(() => ({
    title: document.title,
    scriptRan: window.__assessmentBInjectionPreflight === true,
    documentWritable: Boolean(document.head),
  }));
  if (!preflight.scriptRan || !preflight.documentWritable) {
    throw new Error(`Mutable injection preflight failed: ${JSON.stringify(preflight)}`);
  }

  const detectorUrl = `http://127.0.0.1:${port}/detect.js`;
  await page.evaluate((src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.assessmentBDetector = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Detector script failed to load: ${src}`));
    document.head.appendChild(script);
  }), detectorUrl);

  await page.waitForFunction(() => typeof window.impeccableScan === 'function', null, { timeout: 8000 });
  return { ...preflight, detectorUrl, detectorLoaded: true };
}

async function ensureSettingsOpen(page) {
  const details = page.locator('.dynamic-form-demo__settings');
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator('summary').click();
  }
}

async function clickText(scope, text) {
  const locator = scope.getByText(text, { exact: true });
  const count = await locator.count();
  if (count !== 1) throw new Error(`Expected one exact text match for ${JSON.stringify(text)}, found ${count}`);
  await locator.click();
}

async function toggleByText(page, text) {
  const locator = page.locator('.dynamic-form-demo').getByText(text, { exact: true });
  const count = await locator.count();
  if (count !== 1) throw new Error(`Expected one toggle label ${JSON.stringify(text)}, found ${count}`);
  await locator.click();
  await page.waitForTimeout(250);
}

async function positionDemo(page) {
  await page.evaluate(() => {
    const element = document.querySelector('.dynamic-form-demo');
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - 96));
  });
  await page.waitForTimeout(250);
}

async function runScanAndCapture(page, name, viewport, state) {
  activeView = name;
  await page.waitForTimeout(150);
  const consoleStart = recordConsole(page, name);
  const scan = await page.evaluate(() => {
    const groups = window.impeccableScan();
    const pathFor = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 3).join('.');
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
    };
    return groups.map(({ el, findings }) => ({
      selector: pathFor(el),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140),
      rules: findings.map((finding) => ({
        rule: finding.type || finding.id || 'unknown',
        detail: finding.detail || finding.snippet || '',
      })),
    }));
  });
  await page.waitForTimeout(2200);

  const overlay = await page.evaluate(() => ({
    count: document.querySelectorAll('.impeccable-overlay').length,
    labels: [...document.querySelectorAll('.impeccable-label')].map((element) => (element.textContent || '').trim()).filter(Boolean),
    bannerText: [...document.querySelectorAll('.impeccable-banner')].map((element) => (element.textContent || '').trim()).filter(Boolean),
    appTheme: [...document.documentElement.classList].filter((name) => name === 'dark' || name === 'lx-theme-hud'),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    demoRect: (() => {
      const element = document.querySelector('.dynamic-form-demo');
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
    })(),
  }));

  const screenshot = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  const viewConsole = consoleOutput.slice(consoleStart).filter((entry) => entry.view === name && entry.text.includes('[impeccable]'));
  const item = {
    name,
    viewport,
    state,
    screenshot,
    detection: {
      elementCount: scan.length,
      ruleHitCount: scan.reduce((count, entry) => count + entry.rules.length, 0),
      findings: scan,
      overlay,
      console: viewConsole,
    },
  };
  captures.push(item);
  return item;
}

async function setupPage(context, pageLabel, port, viewportName) {
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('console', (message) => consoleOutput.push({
    view: activeView,
    type: message.type(),
    text: message.text(),
  }));
  page.on('pageerror', (error) => browserErrors.push({ view: activeView, message: error.message }));
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('.dynamic-form-demo').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(600);
  await positionDemo(page);
  const injection = await injectDetector(page, `${pageLabel} ${viewportName}`, port);
  await page.waitForTimeout(300);
  return { page, injection };
}

async function main() {
  await new Promise((resolve, reject) => {
    detectorServer.once('error', reject);
    detectorServer.listen(0, '127.0.0.1', resolve);
  });
  const port = detectorServer.address().port;
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });

  const browserVersion = browser.version();
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });

  for (const context of [desktopContext, mobileContext]) {
    await context.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      let local = false;
      try {
        local = allowedHosts.has(new URL(requestUrl).hostname);
      } catch { /* non-HTTP browser request */ }
      if (local) {
        await route.continue();
      } else {
        blockedExternalRequests.push({ url: requestUrl, resourceType: route.request().resourceType() });
        await route.abort();
      }
    });
    context.on('request', (request) => {
      const url = request.url();
      let hostname = '';
      try { hostname = new URL(url).hostname; } catch { /* non-HTTP request */ }
      allRequests.push({ url, method: request.method(), resourceType: request.resourceType(), local: allowedHosts.has(hostname) });
    });
  }

  const desktop = await setupPage(desktopContext, 'desktop', port, '1440x1000');
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-light-initial', '1440x1000', {
    theme: 'light', settingsExpanded: false, state: 'initial form',
  });

  await ensureSettingsOpen(desktop.page);
  await toggleByText(desktop.page, '深色主题（HUD）');
  const desktopHud = await desktop.page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    hud: document.documentElement.classList.contains('lx-theme-hud'),
  }));
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-hud-settings-expanded', '1440x1000', {
    theme: 'HUD', settingsExpanded: true, themeState: desktopHud,
  });

  await toggleByText(desktop.page, '深色主题（HUD）');
  const candidateControls = desktop.page.locator('.dynamic-form-demo__candidate-controls');
  await clickText(candidateControls, '空结果');
  await desktop.page.waitForTimeout(900);
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-empty', '1440x1000', {
    theme: 'light', settingsExpanded: true, state: 'remote candidate empty result',
  });

  await clickText(candidateControls, '失败');
  await desktop.page.waitForTimeout(900);
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-error', '1440x1000', {
    theme: 'light', settingsExpanded: true, state: 'remote candidate error with retry',
  });

  await clickText(candidateControls, '成功');
  await desktop.page.waitForTimeout(800);
  await toggleByText(desktop.page, '禁用表单');
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-disabled', '1440x1000', {
    theme: 'light', settingsExpanded: true, state: 'form disabled',
  });

  await toggleByText(desktop.page, '禁用表单');
  const taskInput = desktop.page.locator('.dynamic-form-demo input[placeholder="输入任务名称"]');
  await taskInput.focus();
  await desktop.page.keyboard.press('Tab');
  const focusState = await desktop.page.evaluate(() => ({
    tag: document.activeElement?.tagName || null,
    type: document.activeElement?.getAttribute('type') || null,
    ariaLabel: document.activeElement?.getAttribute('aria-label') || null,
    placeholder: document.activeElement?.getAttribute('placeholder') || null,
    visible: Boolean(document.activeElement && document.activeElement.getBoundingClientRect().width),
  }));
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-keyboard-focus', '1440x1000', {
    theme: 'light', settingsExpanded: true, state: 'Tab moved focus from task name to next field', focusState,
  });

  await desktop.page.getByRole('button', { name: '提交校验' }).click();
  await desktop.page.waitForTimeout(500);
  await positionDemo(desktop.page);
  await runScanAndCapture(desktop.page, 'desktop-validation-error', '1440x1000', {
    theme: 'light', settingsExpanded: true, state: 'required fields submitted empty',
  });

  const mobile = await setupPage(mobileContext, 'mobile', port, '375x812');
  await positionDemo(mobile.page);
  await runScanAndCapture(mobile.page, 'mobile-375-light-initial', '375x812', {
    theme: 'light', settingsExpanded: false, state: 'initial form',
  });

  await ensureSettingsOpen(mobile.page);
  await toggleByText(mobile.page, '深色主题（HUD）');
  const mobileHud = await mobile.page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    hud: document.documentElement.classList.contains('lx-theme-hud'),
  }));
  await positionDemo(mobile.page);
  await runScanAndCapture(mobile.page, 'mobile-375-hud-settings-expanded', '375x812', {
    theme: 'HUD', settingsExpanded: true, themeState: mobileHud,
  });

  const mobileCandidates = mobile.page.locator('.dynamic-form-demo__candidate-controls');
  await clickText(mobileCandidates, '空结果');
  await mobile.page.waitForTimeout(900);
  const mobileFeedback = mobile.page.locator('.dynamic-form-demo__feedback').first();
  if (await mobileFeedback.count()) await mobileFeedback.scrollIntoViewIfNeeded();
  await runScanAndCapture(mobile.page, 'mobile-375-empty', '375x812', {
    theme: 'HUD', settingsExpanded: true, state: 'remote candidate empty result',
  });

  await clickText(mobileCandidates, '失败');
  await mobile.page.waitForTimeout(900);
  if (await mobileFeedback.count()) await mobileFeedback.scrollIntoViewIfNeeded();
  await runScanAndCapture(mobile.page, 'mobile-375-error', '375x812', {
    theme: 'HUD', settingsExpanded: true, state: 'remote candidate error with retry',
  });

  await positionDemo(mobile.page);
  await toggleByText(mobile.page, '禁用表单');
  await runScanAndCapture(mobile.page, 'mobile-375-disabled', '375x812', {
    theme: 'HUD', settingsExpanded: true, state: 'form disabled',
  });

  await toggleByText(mobile.page, '禁用表单');
  const mobileInput = mobile.page.locator('.dynamic-form-demo input[placeholder="输入任务名称"]');
  await mobileInput.focus();
  await mobile.page.keyboard.press('Tab');
  const mobileFocusState = await mobile.page.evaluate(() => ({
    tag: document.activeElement?.tagName || null,
    type: document.activeElement?.getAttribute('type') || null,
    ariaLabel: document.activeElement?.getAttribute('aria-label') || null,
    placeholder: document.activeElement?.getAttribute('placeholder') || null,
  }));
  await positionDemo(mobile.page);
  await runScanAndCapture(mobile.page, 'mobile-375-keyboard-focus', '375x812', {
    theme: 'HUD', settingsExpanded: true, state: 'Tab moved focus from task name to next field', focusState: mobileFocusState,
  });

  const result = {
    targetUrl,
    browser: { name: 'Microsoft Edge via isolated Playwright Chromium process', version: browserVersion },
    browserInstanceCount: 1,
    pageCount: 2,
    pages: [
      { name: 'desktop', url: targetUrl, viewport: '1440x1000', detectorInjected: desktop.injection },
      { name: 'mobile', url: targetUrl, viewport: '375x812', detectorInjected: mobile.injection },
    ],
    detector: {
      source: detectorPath,
      injectedPath: `http://127.0.0.1:${port}/detect.js`,
      preflightPassed: true,
      injectedScriptLoaded: true,
    },
    captures,
    externalRequestCount: blockedExternalRequests.length,
    externalRequestsBlocked: blockedExternalRequests,
    requests: allRequests,
    pageErrors: browserErrors,
    consoleOutput,
    serverLifecycle: 'In-memory detector route closed in finally; no project background server started.',
  };
  writeFileSync(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  const failure = {
    error: error instanceof Error ? error.message : String(error),
    capturesCompleted: captures.length,
    blockedExternalRequests,
    pageErrors: browserErrors,
  };
  writeFileSync(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
  process.stderr.write(`${JSON.stringify(failure, null, 2)}\n`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (detectorServer.listening) {
    await new Promise((resolve) => detectorServer.close(resolve));
  }
}
