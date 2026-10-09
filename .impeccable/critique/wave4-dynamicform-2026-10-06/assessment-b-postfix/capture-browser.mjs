import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const projectRequire = createRequire(path.join(repoRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = projectRequire('@playwright/test');
const targetUrl = process.argv[2] || 'http://127.0.0.1:4182/components/lxdynamicform';
const detectorUrl = process.argv[3];
const targetDir = path.join(repoRoot, 'linkx-fe/src/components/LxDynamicForm');
const docsPath = path.join(repoRoot, 'linkx-fe/docs/components/lxdynamicform.md');
const screenshotsDir = path.join(here, 'screenshots');
const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetOrigin = new URL(targetUrl).origin;
const detectorOrigin = detectorUrl ? new URL(detectorUrl).origin : null;
const docPath = new URL(targetUrl).pathname.replace(/\/$/, '');

const evidence = {
  startedAt: new Date().toISOString(),
  targetUrl,
  automation: 'Playwright 1.58.0 with system Chrome; fresh browser process and isolated contexts',
  browserPath,
  playwrightModule: projectRequire.resolve('@playwright/test'),
  detectorUrl,
  targetSources: [targetDir, docsPath],
  targetFingerprintBefore: null,
  targetFingerprintAfter: null,
  navigation: [],
  injections: [],
  views: [],
  interactions: [],
  checks: [],
  network: { allowedRequests: [], blockedRequests: [], writesAttempted: [], webSockets: [], blockedWebSockets: [] },
  detectorConsole: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  httpFailures: [],
  errors: [],
};

let browser;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function fingerprintTargets() {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const relative = path.relative(repoRoot, absolute).split(path.sep).join('/');
        files.push({ path: relative, sha256: sha256(fs.readFileSync(absolute)) });
      }
    }
  };
  visit(targetDir);
  files.push({
    path: path.relative(repoRoot, docsPath).split(path.sep).join('/'),
    sha256: sha256(fs.readFileSync(docsPath)),
  });
  files.sort((a, b) => a.path.localeCompare(b.path));
  const canonical = files.map((file) => `${file.path}\0${file.sha256}`).join('\n');
  return { fileCount: files.length, aggregateSha256: sha256(canonical), files };
}

function check(name, passed, details = {}) {
  evidence.checks.push({ name, passed: Boolean(passed), details });
  if (!passed) throw new Error(`Assessment B check failed: ${name}`);
}

function safeScreenshotDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function colorLuminance(color) {
  let channels;
  const hex = String(color).trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const value = hex[1].length === 3 ? [...hex[1]].map((part) => part + part).join('') : hex[1];
    channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  } else {
    const rgb = String(color).match(/rgba?\(([^)]+)\)/i);
    if (!rgb) return null;
    channels = rgb[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()));
  }
  if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function isAllowedAsset(url, method) {
  if (method !== 'GET') return false;
  if (detectorOrigin && url.origin === detectorOrigin && url.pathname === '/detect.js') return true;
  if (url.origin !== targetOrigin) return false;
  const pathname = url.pathname.replace(/\/$/, '');
  if ([docPath, `${docPath}.html`].includes(pathname)) return true;
  return [
    '/@vite/',
    '/@id/',
    '/@fs/',
    '/@vue/',
    '/node_modules/',
    '/src/',
    '/assets/',
    '/docs/',
    '/.vitepress/',
  ].some((prefix) => pathname.startsWith(prefix)) || pathname === '/favicon.ico' || pathname === '/logo.svg';
}

function attachPageDiagnostics(page) {
  page.on('console', (message) => {
    const entry = { type: message.type(), text: message.text() };
    if (entry.text.includes('[impeccable]')) evidence.detectorConsole.push(entry);
    else if (entry.type === 'error') evidence.consoleErrors.push(entry);
  });
  page.on('pageerror', (error) => evidence.pageErrors.push({ name: error.name, message: error.message }));
  page.on('requestfailed', (request) => {
    evidence.failedRequests.push({ method: request.method(), url: request.url(), error: request.failure()?.errorText || '' });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.httpFailures.push({ status: response.status(), url: response.url() });
  });
}

async function createContext({ width, height, mobile = false, reducedMotion = 'reduce' }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'light',
    reducedMotion,
  });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const allowed = isAllowedAsset(url, request.method());
    const entry = { method: request.method(), url: request.url(), resourceType: request.resourceType() };
    if (request.method() !== 'GET') evidence.network.writesAttempted.push(entry);
    if (allowed) {
      evidence.network.allowedRequests.push(entry);
      await route.continue();
      return;
    }
    evidence.network.blockedRequests.push(entry);
    await route.abort('blockedbyclient');
  });
  if (typeof context.routeWebSocket === 'function') {
    await context.routeWebSocket('**/*', (route) => {
      const url = new URL(route.url());
      if (url.origin === targetOrigin.replace(/^http/, 'ws') && url.pathname === '/') {
        evidence.network.webSockets.push({ url: route.url(), action: 'local-vite-hmr' });
        const server = route.connectToServer();
        route.onMessage((message) => server.send(message));
        server.onMessage((message) => route.send(message));
        return;
      }
      evidence.network.blockedWebSockets.push({ url: route.url(), action: 'blocked' });
      route.close();
    });
  }
  return context;
}

async function injectDetector(page, label) {
  const previousTitle = await page.title();
  const preflightTitle = `[Human] Assessment B: ${label}`;
  const preflight = await page.evaluate(({ title, scriptUrl }) => {
    document.title = title;
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.dataset.assessment = 'b-postfix';
    document.head.appendChild(script);
    return { titleSet: document.title === title, scriptInserted: document.head.contains(script), scriptUrl: script.src };
  }, { title: preflightTitle, scriptUrl: detectorUrl });
  await page.waitForFunction(() => typeof window.impeccableScan === 'function', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const detectorReady = await page.evaluate(() => typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function');
  const requestSeen = evidence.network.allowedRequests.some((request) => new URL(request.url).pathname === '/detect.js');
  await page.evaluate((title) => { document.title = title; }, previousTitle);
  const record = { label, preflight, detectorReady, requestSeen, previousTitle };
  evidence.injections.push(record);
  check(`detector-injection-${label}`, detectorReady && requestSeen && preflight.titleSet && preflight.scriptInserted, record);
  return record;
}

async function measurePage(page) {
  return page.evaluate(() => {
    const demo = document.querySelector('.dynamic-form-demo');
    const input = document.querySelector('.dynamic-form-demo .el-input__wrapper');
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      title: document.title,
      href: location.href,
      readyState: document.readyState,
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      visualViewportWidth: window.visualViewport?.width ?? null,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body?.scrollWidth ?? null,
      documentHeight: document.documentElement.scrollHeight,
      screenWidth: window.screen.width,
      devicePixelRatio: window.devicePixelRatio,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      htmlClass: document.documentElement.className,
      vpBackgroundToken: rootStyle.getPropertyValue('--vp-c-bg').trim(),
      lxCardToken: rootStyle.getPropertyValue('--lx-bg-card').trim(),
      demoBackground: demo ? getComputedStyle(demo).backgroundColor : null,
      demoTextColor: demo ? getComputedStyle(demo).color : null,
      inputBackground: input ? getComputedStyle(input).backgroundColor : null,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
    };
  });
}

async function attributionFor(page, records) {
  return page.evaluate((items) => items.map((record) => {
    let element = null;
    try { element = document.querySelector(record.selector); } catch {}
    const rect = element?.getBoundingClientRect();
    const field = element?.closest('.lx-dynamic-form__item');
    const fieldLabel = field?.querySelector('.el-form-item__label')?.innerText?.trim() || '';
    const demo = element?.closest('.dynamic-form-demo');
    const headings = Array.from(document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3'));
    const precedingHeading = rect ? headings.filter((heading) => heading.getBoundingClientRect().top <= rect.top).at(-1) : null;
    const shell = element?.closest('.VPNav, .VPSidebar, .VPDocAside, .VPFooter');
    const text = element?.innerText?.trim().replace(/\s+/g, ' ').slice(0, 140) || '';
    return {
      selector: record.selector,
      tagName: record.tagName,
      isPageLevel: record.isPageLevel,
      isHidden: record.isHidden,
      componentAttribution: demo ? (fieldLabel ? `LxDynamicForm demo / ${fieldLabel}` : 'LxDynamicForm demo') : shell ? `VitePress shell / ${shell.className}` : `Docs content / ${precedingHeading?.innerText?.trim() || 'unattributed'}`,
      textSnippet: text,
      findings: record.findings,
    };
  }), records);
}

async function scanAndCapture(page, name, requestedViewport = null) {
  const scan = await page.evaluate(() => {
    const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null;
    if (typeof window.impeccableScan === 'function') window.impeccableScan();
    return { detectorReady: typeof window.impeccableScan === 'function', findings: Array.isArray(findings) ? findings : [] };
  });
  await page.waitForTimeout(450);
  const overlay = await page.evaluate(() => ({
    elements: document.querySelectorAll('.impeccable-overlay, .impeccable-banner, .impeccable-label').length,
    visible: document.querySelectorAll('.impeccable-overlay.impeccable-visible, .impeccable-banner.impeccable-visible').length,
    banners: Array.from(document.querySelectorAll('.impeccable-banner')).map((element) => element.innerText.trim()).filter(Boolean),
    labels: Array.from(document.querySelectorAll('.impeccable-label')).map((element) => element.innerText.trim()).filter(Boolean),
  }));
  const metrics = await measurePage(page);
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });
  const screenshot = { file: `screenshots/${name}.png`, ...safeScreenshotDimensions(screenshotPath) };
  const attribution = await attributionFor(page, scan.findings);
  const findingCount = scan.findings.reduce((sum, record) => sum + record.findings.length, 0);
  const view = { name, requestedViewport, metrics, scan: { detectorReady: scan.detectorReady, elementCount: scan.findings.length, findingCount, findings: scan.findings }, overlay, attribution, screenshot };
  evidence.views.push(view);
  check(`browser-overlay-visible-${name}`, scan.detectorReady && overlay.visible > 0, { findingCount, overlayVisible: overlay.visible });
  return view;
}

async function openPage(context, label, viewportWidth, mobile) {
  const page = await context.newPage();
  attachPageDiagnostics(page);
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  evidence.navigation.push({ label, status: response?.status() ?? null, title: await page.title(), url: page.url(), viewportWidth, mobile });
  check(`navigation-${label}`, response?.ok() === true, { status: response?.status() ?? null, url: page.url() });
  await page.getByRole('heading', { name: /LxDynamicForm/ }).waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.dynamic-form-demo').waitFor({ state: 'visible', timeout: 15000 });
  const metrics = await measurePage(page);
  check(`css-viewport-width-${label}`, metrics.innerWidth === viewportWidth && metrics.visualViewportWidth === viewportWidth, {
    requested: viewportWidth,
    innerWidth: metrics.innerWidth,
    visualViewportWidth: metrics.visualViewportWidth,
    clientWidth: metrics.clientWidth,
    documentWidth: metrics.documentWidth,
  });
  evidence.checks.push({ name: `touch-emulation-${label}`, passed: mobile ? metrics.maxTouchPoints > 0 && metrics.pointerCoarse && metrics.hoverNone : true, details: { maxTouchPoints: metrics.maxTouchPoints, pointerCoarse: metrics.pointerCoarse, hoverNone: metrics.hoverNone } });
  if (mobile) check(`touch-emulation-${label}`, metrics.maxTouchPoints > 0 && metrics.pointerCoarse && metrics.hoverNone, { maxTouchPoints: metrics.maxTouchPoints, pointerCoarse: metrics.pointerCoarse, hoverNone: metrics.hoverNone });
  const injection = await injectDetector(page, label);
  await page.locator('.dynamic-form-demo').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  return { page, metrics, injection };
}

async function run() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  if (!fs.existsSync(browserPath)) throw new Error(`System Chrome was not found at ${browserPath}`);
  if (!detectorUrl) throw new Error('Missing detector injection URL argument');
  evidence.targetFingerprintBefore = fingerprintTargets();
  browser = await chromium.launch({ headless: true, executablePath: browserPath, args: ['--no-first-run', '--disable-extensions'] });
  evidence.browser = { version: browser.version(), contextIsolation: 'newContext per viewport/scenario; no persistent user data directory' };

  const desktopContext = await createContext({ width: 1440, height: 1000, mobile: false });
  const desktop = await openPage(desktopContext, 'desktop', 1440, false);
  const lightTheme = await measurePage(desktop.page);
  await scanAndCapture(desktop.page, 'desktop-light-initial', { width: 1440, height: 1000, mobile: false });

  const appearance = desktop.page.locator('button.VPSwitchAppearance:visible').first();
  await appearance.waitFor({ state: 'visible', timeout: 10000 });
  await appearance.click();
  await desktop.page.waitForFunction(() => document.documentElement.classList.contains('dark'), { timeout: 10000 });
  const settingsSummary = desktop.page.locator('.dynamic-form-demo__settings > summary');
  await settingsSummary.click();
  const hudToggle = desktop.page.locator('.dynamic-form-demo__toolbar').getByText('HUD 深色主题', { exact: true });
  await hudToggle.click();
  await desktop.page.waitForFunction(() => document.documentElement.classList.contains('lx-theme-hud'), { timeout: 10000 });
  const darkHudTheme = await measurePage(desktop.page);
  const demoLuminance = colorLuminance(darkHudTheme.demoBackground);
  check('dark-hud-rendered', darkHudTheme.htmlClass.split(/\s+/).includes('dark') && darkHudTheme.htmlClass.split(/\s+/).includes('lx-theme-hud') && darkHudTheme.demoBackground !== lightTheme.demoBackground && demoLuminance !== null && demoLuminance < 0.2, {
    light: { htmlClass: lightTheme.htmlClass, vpBackgroundToken: lightTheme.vpBackgroundToken, lxCardToken: lightTheme.lxCardToken, demoBackground: lightTheme.demoBackground },
    darkHud: { htmlClass: darkHudTheme.htmlClass, vpBackgroundToken: darkHudTheme.vpBackgroundToken, lxCardToken: darkHudTheme.lxCardToken, demoBackground: darkHudTheme.demoBackground, demoTextColor: darkHudTheme.demoTextColor, inputBackground: darkHudTheme.inputBackground, demoLuminance },
  });
  evidence.themes = { light: lightTheme, darkHud: darkHudTheme, detectorOverlayPresent: true };
  await scanAndCapture(desktop.page, 'desktop-dark-hud', { width: 1440, height: 1000, mobile: false });

  const mainForm = desktop.page.locator('.lx-dynamic-form').first();
  const officerField = mainForm.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' });
  await desktop.page.getByRole('button', { name: '加载中', exact: true }).click();
  await officerField.getByText('候选人员加载中', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
  evidence.interactions.push({ name: 'main-remote-loading', feedbackVisible: true });
  await scanAndCapture(desktop.page, 'desktop-remote-loading', { width: 1440, height: 1000, mobile: false });

  await desktop.page.getByRole('button', { name: '成功', exact: true }).click();
  await desktop.page.getByText('3 名候选人员', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'main-remote-results', visibleCandidateCount: 3 });
  await scanAndCapture(desktop.page, 'desktop-remote-results', { width: 1440, height: 1000, mobile: false });
  const officerSearch = officerField.getByRole('combobox');
  await officerSearch.fill('李警官');
  const mainOption = desktop.page.getByRole('option', { name: '李警官 · 指挥中心', exact: true });
  await mainOption.waitFor({ state: 'visible', timeout: 5000 });
  const visibleMainOption = await mainOption.innerText();
  await mainOption.click();
  evidence.interactions.push({ name: 'main-remote-select-result', option: visibleMainOption, selected: true });
  await scanAndCapture(desktop.page, 'desktop-remote-selected-result', { width: 1440, height: 1000, mobile: false });

  await desktop.page.getByRole('button', { name: '失败', exact: true }).click();
  await officerField.getByText('候选人员读取失败', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'main-remote-failure', feedbackVisible: true });
  await scanAndCapture(desktop.page, 'desktop-remote-failure', { width: 1440, height: 1000, mobile: false });
  await officerField.getByRole('button', { name: '重试', exact: true }).click();
  await desktop.page.getByText('3 名候选人员', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await officerField.getByText('候选人员读取失败', { exact: true }).waitFor({ state: 'hidden', timeout: 5000 });
  evidence.interactions.push({ name: 'main-remote-successful-retry', feedbackCleared: true, visibleCandidateCount: 3 });
  await scanAndCapture(desktop.page, 'desktop-remote-successful-retry', { width: 1440, height: 1000, mobile: false });

  const nameInput = desktop.page.getByPlaceholder('输入任务名称');
  const passwordInput = desktop.page.getByPlaceholder('输入访问密码');
  await nameInput.fill('夜间巡防任务');
  await passwordInput.fill('StrongPass123!');
  await passwordInput.blur();
  await desktop.page.getByRole('button', { name: '提交校验', exact: true }).click();
  const successMessage = desktop.page.getByText('表单已校验：夜间巡防任务', { exact: true });
  await successMessage.waitFor({ state: 'visible', timeout: 7000 });
  const formErrors = await mainForm.locator('.el-form-item__error').allInnerTexts();
  evidence.interactions.push({ name: 'valid-form-submit', successMessage: await successMessage.innerText(), validationErrors: formErrors, passwordType: await passwordInput.getAttribute('type') });
  check('valid-form-submit', formErrors.length === 0 && await passwordInput.getAttribute('type') === 'password', { successMessage: await successMessage.innerText(), validationErrors: formErrors, passwordType: await passwordInput.getAttribute('type') });
  await scanAndCapture(desktop.page, 'desktop-valid-form-submit', { width: 1440, height: 1000, mobile: false });

  const preview = desktop.page.locator('.dynamic-form-demo__schema-preview');
  await preview.locator('summary').click();
  await preview.locator('.lx-select .el-select__wrapper').first().click();
  await desktop.page.getByRole('option', { name: '远程选择', exact: true }).click();
  const previewField = preview.locator('.lx-dynamic-form__item');
  const previewSearch = previewField.getByRole('combobox');
  await desktop.page.getByRole('button', { name: '失败', exact: true }).click();
  await previewSearch.fill('警官');
  await previewField.getByText('候选人员加载中', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
  evidence.interactions.push({ name: 'preview-remote-loading', feedbackVisible: true });
  await scanAndCapture(desktop.page, 'desktop-preview-remote-loading', { width: 1440, height: 1000, mobile: false });
  await previewField.getByText('候选人员读取失败', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'preview-remote-failure', feedbackVisible: true });
  await scanAndCapture(desktop.page, 'desktop-preview-remote-failure', { width: 1440, height: 1000, mobile: false });
  await previewField.getByRole('button', { name: '重试', exact: true }).click();
  await desktop.page.getByRole('option', { name: '李警官 · 指挥中心', exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await previewField.getByText('候选人员读取失败', { exact: true }).waitFor({ state: 'hidden', timeout: 5000 });
  evidence.interactions.push({ name: 'preview-remote-successful-retry', visibleOption: '李警官 · 指挥中心', feedbackCleared: true });
  await scanAndCapture(desktop.page, 'desktop-preview-remote-successful-retry', { width: 1440, height: 1000, mobile: false });

  for (const viewport of [{ width: 375, height: 850 }, { width: 320, height: 800 }]) {
    const context = await createContext({ ...viewport, mobile: true });
    const mobile = await openPage(context, `mobile-${viewport.width}`, viewport.width, true);
    const overflow = mobile.metrics.documentWidth > mobile.metrics.clientWidth;
    const view = await scanAndCapture(mobile.page, `mobile-${viewport.width}-light`, { ...viewport, mobile: true });
    const measured = view.metrics;
    const png = view.screenshot;
    check(`mobile-capture-${viewport.width}`, measured.innerWidth === viewport.width && measured.visualViewportWidth === viewport.width && png.width === viewport.width && !overflow, {
      requestedWidth: viewport.width,
      innerWidth: measured.innerWidth,
      visualViewportWidth: measured.visualViewportWidth,
      documentWidth: measured.documentWidth,
      clientWidth: measured.clientWidth,
      pngWidth: png.width,
      horizontalOverflow: overflow,
    });
    await context.close();
  }

  const detectorScriptPath = 'C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detector\\detect-antipatterns-browser.js';
  evidence.detectorScriptSha256 = sha256(fs.readFileSync(detectorScriptPath));
  evidence.targetFingerprintAfter = fingerprintTargets();
  check('target-unchanged-during-capture', evidence.targetFingerprintBefore.aggregateSha256 === evidence.targetFingerprintAfter.aggregateSha256, {
    before: evidence.targetFingerprintBefore.aggregateSha256,
    after: evidence.targetFingerprintAfter.aggregateSha256,
  });
  evidence.finishedAt = new Date().toISOString();
  evidence.networkGuard = {
    attemptedWrites: evidence.network.writesAttempted.length,
    blockedRequests: evidence.network.blockedRequests.length,
    blockedWebSockets: evidence.network.blockedWebSockets.length,
    backendWriteRequestsReached: 0,
    note: 'Only allowlisted same-origin VitePress document/module assets and the local detector script were continued; all other HTTP requests were aborted.',
  };
}

try {
  await run();
} catch (error) {
  evidence.finishedAt = new Date().toISOString();
  evidence.errors.push({ name: error.name, message: error.message, stack: error.stack });
  process.exitCode = 1;
} finally {
  try { await browser?.close(); } catch {}
  fs.writeFileSync(path.join(here, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  const overlayAttribution = evidence.views.map((view) => ({
    view: view.name,
    requestedViewport: view.requestedViewport,
    detectorReady: view.scan.detectorReady,
    findingCount: view.scan.findingCount,
    overlay: view.overlay,
    attributions: view.attribution,
  }));
  fs.writeFileSync(path.join(here, 'overlay-attribution.json'), `${JSON.stringify(overlayAttribution, null, 2)}\n`);
  const summary = {
    targetUrl,
    browser: evidence.browser || null,
    injectionCount: evidence.injections.length,
    viewCount: evidence.views.length,
    checks: evidence.checks,
    errors: evidence.errors,
    consoleErrors: evidence.consoleErrors.length,
    pageErrors: evidence.pageErrors.length,
    failedRequests: evidence.failedRequests.length,
    httpFailures: evidence.httpFailures.length,
    networkGuard: evidence.networkGuard || null,
    screenshots: evidence.views.map((view) => view.screenshot),
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
