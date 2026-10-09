import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const projectRequire = createRequire(path.join(repoRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = projectRequire('@playwright/test');
const targetUrl = process.argv[2] || 'http://127.0.0.1:4182/components/lxupload';
const detectorUrl = process.argv[3];
const targetOrigin = new URL(targetUrl).origin;
const detectorOrigin = detectorUrl ? new URL(detectorUrl).origin : null;
const docPath = new URL(targetUrl).pathname.replace(/\/$/, '');
const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = path.join(here, 'screenshots');
const targetDirs = [
  path.join(repoRoot, 'linkx-fe/src/components/LxDynamicForm'),
  path.join(repoRoot, 'linkx-fe/src/components/LxUpload'),
];
const docsPaths = [
  path.join(repoRoot, 'linkx-fe/docs/components/lxdynamicform.md'),
  path.join(repoRoot, 'linkx-fe/docs/components/lxupload.md'),
];

const evidence = {
  startedAt: new Date().toISOString(),
  targetUrl,
  detectorUrl,
  browserPath,
  playwrightModule: projectRequire.resolve('@playwright/test'),
  targetSources: [...targetDirs, ...docsPaths],
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
  for (const directory of targetDirs) visit(directory);
  for (const filePath of docsPaths) {
    files.push({ path: path.relative(repoRoot, filePath).split(path.sep).join('/'), sha256: sha256(fs.readFileSync(filePath)) });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const canonical = files.map((file) => `${file.path}\0${file.sha256}`).join('\n');
  return { fileCount: files.length, aggregateSha256: sha256(canonical), files };
}

function check(name, passed, details = {}) {
  evidence.checks.push({ name, passed: Boolean(passed), details });
  if (!passed) throw new Error(`Assessment B check failed: ${name}`);
}

function screenshotDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function luminance(color) {
  const hex = String(color).trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const value = hex[1].length === 3 ? [...hex[1]].map((part) => part + part).join('') : hex[1];
    const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
    const linear = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }
  const rgb = String(color).match(/rgba?\(([^)]+)\)/i);
  if (!rgb) return null;
  const channels = rgb[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()));
  if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function attachDiagnostics(page) {
  page.on('console', (message) => {
    const entry = { type: message.type(), text: message.text() };
    if (entry.text.includes('[impeccable]')) evidence.detectorConsole.push(entry);
    else if (entry.type === 'error') evidence.consoleErrors.push(entry);
  });
  page.on('pageerror', (error) => evidence.pageErrors.push({ name: error.name, message: error.message }));
  page.on('requestfailed', (request) => evidence.failedRequests.push({ method: request.method(), url: request.url(), error: request.failure()?.errorText || '' }));
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.httpFailures.push({ status: response.status(), url: response.url() });
  });
}

async function createContext({ width, height, mobile = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/$/, '');
    const allowed = request.method() === 'GET' && (
      (detectorOrigin && url.origin === detectorOrigin && pathname === '/detect.js')
      || (url.origin === targetOrigin && (
        [docPath, `${docPath}.html`, `${docPath}.md`].includes(pathname)
        || pathname.startsWith(`${docPath}/`)
        || pathname === '/hashmap.json'
        || ['/@vite/', '/@siteData', '/@id/', '/@fs/', '/@vue/', '/node_modules/', '/src/', '/assets/', '/docs/', '/.vitepress/'].some((prefix) => pathname.startsWith(prefix))
        || pathname === '/favicon.ico'
        || pathname === '/logo.svg'
      ))
    );
    const entry = { method: request.method(), url: request.url(), resourceType: request.resourceType() };
    if (request.method() !== 'GET') evidence.network.writesAttempted.push(entry);
    if (allowed) {
      evidence.network.allowedRequests.push(entry);
      await route.continue();
    } else {
      evidence.network.blockedRequests.push(entry);
      await route.abort('blockedbyclient');
    }
  });
  if (typeof context.routeWebSocket === 'function') {
    await context.routeWebSocket('**/*', (route) => {
      const url = new URL(route.url());
      if (url.origin === targetOrigin.replace(/^http/, 'ws') && url.pathname === '/') {
        evidence.network.webSockets.push({ url: route.url(), action: 'local-vite-hmr' });
        const server = route.connectToServer();
        route.onMessage((message) => server.send(message));
        server.onMessage((message) => route.send(message));
      } else {
        evidence.network.blockedWebSockets.push({ url: route.url(), action: 'blocked' });
        route.close();
      }
    });
  }
  return context;
}

async function injectDetector(page, label) {
  const previousTitle = await page.title();
  const title = `[Human] Assessment B: ${label}`;
  const preflight = await page.evaluate(({ title: nextTitle, scriptUrl }) => {
    document.title = nextTitle;
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.dataset.assessment = 'b-current-final';
    document.head.appendChild(script);
    return { titleSet: document.title === nextTitle, scriptInserted: document.head.contains(script), scriptUrl: script.src };
  }, { title, scriptUrl: detectorUrl });
  await page.waitForFunction(() => typeof window.impeccableScan === 'function', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const detectorReady = await page.evaluate(() => typeof window.impeccableScan === 'function' && typeof window.impeccableDetect === 'function');
  const requestSeen = evidence.network.allowedRequests.some((request) => new URL(request.url).pathname === '/detect.js');
  await page.evaluate((previous) => { document.title = previous; }, previousTitle);
  const record = { label, preflight, detectorReady, requestSeen, previousTitle };
  evidence.injections.push(record);
  check(`detector-injection-${label}`, detectorReady && requestSeen && preflight.titleSet && preflight.scriptInserted, record);
}

async function measure(page) {
  return page.evaluate(() => {
    const demo = document.querySelector('.lx-upload-demo');
    const style = demo ? getComputedStyle(demo) : null;
    const uploadSurface = document.querySelector('.lx-upload__trigger .el-upload-dragger');
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      title: document.title,
      href: location.href,
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      visualViewportWidth: window.visualViewport?.width ?? null,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      screenWidth: window.screen.width,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      htmlClass: document.documentElement.className,
      vpBackgroundToken: rootStyle.getPropertyValue('--vp-c-bg').trim(),
      lxCardToken: rootStyle.getPropertyValue('--lx-bg-card').trim(),
      lxCardHoverToken: rootStyle.getPropertyValue('--lx-bg-card-hover').trim(),
      demoBackground: style?.backgroundColor || null,
      demoTextColor: style?.color || null,
      uploadSurfaceBackground: uploadSurface ? getComputedStyle(uploadSurface).backgroundColor : null,
    };
  });
}

async function attribution(page, findings) {
  return page.evaluate((items) => items.map((record) => {
    let element = null;
    try { element = document.querySelector(record.selector); } catch {}
    const rect = element?.getBoundingClientRect();
    const demo = element?.closest('.lx-upload-demo');
    const heading = rect ? Array.from(document.querySelectorAll('.vp-doc h1, .vp-doc h2, .vp-doc h3')).filter((item) => item.getBoundingClientRect().top <= rect.top).at(-1) : null;
    const shell = element?.closest('.VPNav, .VPSidebar, .VPDocAside, .VPFooter');
    return {
      selector: record.selector,
      tagName: record.tagName,
      isPageLevel: record.isPageLevel,
      isHidden: record.isHidden,
      componentAttribution: demo ? 'LxUpload demo' : shell ? `VitePress shell / ${shell.className}` : `Docs content / ${heading?.innerText?.trim() || 'unattributed'}`,
      textSnippet: element?.innerText?.trim().replace(/\s+/g, ' ').slice(0, 140) || '',
      findings: record.findings,
    };
  }), findings);
}

async function scanAndCapture(page, name, requestedViewport) {
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
  await page.addStyleTag({ content: '.impeccable-overlay, .impeccable-banner, .impeccable-label { pointer-events: none !important; }' });
  const metrics = await measure(page);
  const filePath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false, animations: 'disabled' });
  const findingCount = scan.findings.reduce((sum, record) => sum + record.findings.length, 0);
  const view = {
    name,
    requestedViewport,
    metrics,
    scan: { detectorReady: scan.detectorReady, elementCount: scan.findings.length, findingCount, findings: scan.findings },
    overlay,
    overlayPointerEventsNeutralizedForHarness: true,
    attribution: await attribution(page, scan.findings),
    screenshot: { file: `screenshots/${name}.png`, ...screenshotDimensions(filePath) },
  };
  evidence.views.push(view);
  check(`browser-overlay-visible-${name}`, scan.detectorReady && overlay.visible > 0, { findingCount, overlayVisible: overlay.visible });
  return view;
}

async function navigate(context, label, width, mobile) {
  const page = await context.newPage();
  attachDiagnostics(page);
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  evidence.navigation.push({ label, status: response?.status() ?? null, url: page.url(), title: await page.title(), width, mobile });
  check(`navigation-${label}`, response?.ok() === true, { status: response?.status() ?? null, url: page.url() });
  await page.getByRole('heading', { name: /LxUpload 文件上传/ }).waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.lx-upload-demo').waitFor({ state: 'visible', timeout: 15000 });
  const metrics = await measure(page);
  check(`viewport-${label}`, metrics.innerWidth === width && metrics.visualViewportWidth === width, { expected: width, innerWidth: metrics.innerWidth, visualViewportWidth: metrics.visualViewportWidth, documentWidth: metrics.documentWidth, clientWidth: metrics.clientWidth });
  if (mobile) check(`touch-emulation-${label}`, metrics.maxTouchPoints > 0 && metrics.pointerCoarse && metrics.hoverNone, { maxTouchPoints: metrics.maxTouchPoints, pointerCoarse: metrics.pointerCoarse, hoverNone: metrics.hoverNone });
  await injectDetector(page, label);
  await page.locator('.lx-upload-demo').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  return { page, metrics };
}

async function run() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  if (!fs.existsSync(browserPath)) throw new Error(`System Chrome was not found at ${browserPath}`);
  if (!detectorUrl) throw new Error('Missing detector injection URL argument');
  evidence.targetFingerprintBefore = fingerprintTargets();
  browser = await chromium.launch({ headless: true, executablePath: browserPath, args: ['--no-first-run', '--disable-extensions'] });
  evidence.browser = { version: browser.version(), automation: 'Playwright 1.58.0 with isolated fresh contexts; system Chrome' };

  const desktopContext = await createContext({ width: 1440, height: 1000 });
  const desktop = await navigate(desktopContext, 'lxupload-desktop', 1440, false);
  const demo = desktop.page.locator('.lx-upload-demo');
  const light = await measure(desktop.page);
  await scanAndCapture(desktop.page, 'lxupload-desktop-light', { width: 1440, height: 1000, mobile: false });

  await demo.getByLabel('HUD 深色主题').check();
  await desktop.page.waitForFunction(() => document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud'), { timeout: 10000 });
  const darkHud = await measure(desktop.page);
  const darkLuminance = luminance(darkHud.lxCardToken);
  check('lxupload-dark-hud-rendered', darkHud.htmlClass.split(/\s+/).includes('dark') && darkHud.htmlClass.split(/\s+/).includes('lx-theme-hud') && darkHud.lxCardToken !== light.lxCardToken && darkLuminance !== null && darkLuminance < 0.2, { light: { class: light.htmlClass, lxCardToken: light.lxCardToken, lxCardHoverToken: light.lxCardHoverToken, uploadSurfaceBackground: light.uploadSurfaceBackground }, darkHud: { class: darkHud.htmlClass, lxCardToken: darkHud.lxCardToken, lxCardHoverToken: darkHud.lxCardHoverToken, uploadSurfaceBackground: darkHud.uploadSurfaceBackground, luminance: darkLuminance } });
  await scanAndCapture(desktop.page, 'lxupload-desktop-dark-hud', { width: 1440, height: 1000, mobile: false });

  await demo.getByRole('button', { name: '紧凑标签', exact: true }).click();
  check('compact-list-mode', await demo.getByRole('button', { name: '紧凑标签', exact: true }).getAttribute('aria-pressed') === 'true', {});
  await demo.getByRole('button', { name: '标准行', exact: true }).click();

  const fileInput = demo.locator('input[type="file"]').first();
  await fileInput.setInputFiles({ name: 'night-shift.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n1,Guard\n') });
  const fileRow = demo.locator('.lx-upload__file').filter({ hasText: 'night-shift.csv' });
  await fileRow.locator('.lx-upload__file-status').getByText('排队中', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'local-file-queued', fileName: 'night-shift.csv' });
  await demo.getByRole('button', { name: '下一次上传失败', exact: true }).click();
  await demo.getByRole('button', { name: '开始上传', exact: true }).click();
  await fileRow.locator('.lx-upload__file-status').getByText('上传失败', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'mock-upload-failure', errorText: await fileRow.locator('.lx-upload__file-error').innerText() });
  await scanAndCapture(desktop.page, 'lxupload-upload-failure', { width: 1440, height: 1000, mobile: false });
  await fileRow.getByRole('button', { name: '重新上传', exact: true }).click();
  await desktop.page.waitForTimeout(1200);
  const retryRows = await demo.locator('.lx-upload__file').count();
  const retryStatus = retryRows ? await demo.locator('.lx-upload__file-status').first().innerText() : '文件项已从列表移除';
  evidence.interactions.push({ name: 'mock-upload-retry', resultingStatus: retryStatus, rowCount: retryRows, lastAction: await demo.getByTestId('upload-last-action').innerText() });
  await scanAndCapture(desktop.page, 'lxupload-after-retry', { width: 1440, height: 1000, mobile: false });

  if (await demo.locator('.lx-upload__file').count()) await demo.getByRole('button', { name: '清空文件', exact: true }).click();
  await demo.getByLabel('选择后立即上传').check();
  await fileInput.setInputFiles({ name: 'cancel-me.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n2,Cancel\n') });
  const cancelButton = demo.getByRole('button', { name: '取消上传', exact: true });
  await cancelButton.waitFor({ state: 'visible', timeout: 3000 });
  await scanAndCapture(desktop.page, 'lxupload-upload-in-progress', { width: 1440, height: 1000, mobile: false });
  const cancelRow = demo.locator('.lx-upload__file').filter({ hasText: 'cancel-me.csv' });
  await cancelRow.locator('.lx-upload__file-status').getByText('上传中', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
  await cancelButton.click();
  await demo.getByTestId('upload-cancel-count').getByText('1', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
  evidence.interactions.push({ name: 'mock-upload-cancelled', count: await demo.getByTestId('upload-cancel-count').innerText(), lastAction: await demo.getByTestId('upload-last-action').innerText() });
  await scanAndCapture(desktop.page, 'lxupload-upload-cancelled', { width: 1440, height: 1000, mobile: false });

  await demo.getByRole('button', { name: '清空文件', exact: true }).click();
  await fileInput.setInputFiles({ name: 'success.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n3,Success\n') });
  const successRow = demo.locator('.lx-upload__file').filter({ hasText: 'success.csv' });
  await successRow.locator('.lx-upload__file-status').getByText('上传成功', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  evidence.interactions.push({ name: 'mock-upload-success', status: '上传成功' });
  await scanAndCapture(desktop.page, 'lxupload-upload-success', { width: 1440, height: 1000, mobile: false });

  await demo.getByLabel('禁用上传').check();
  check('disabled-upload-controls', await demo.getByRole('button', { name: '开始上传', exact: true }).isDisabled(), {});
  await scanAndCapture(desktop.page, 'lxupload-disabled', { width: 1440, height: 1000, mobile: false });
  await desktopContext.close();

  for (const viewport of [{ width: 375, height: 850 }, { width: 320, height: 800 }]) {
    const context = await createContext({ ...viewport, mobile: true });
    const mobile = await navigate(context, `lxupload-mobile-${viewport.width}`, viewport.width, true);
    const view = await scanAndCapture(mobile.page, `lxupload-mobile-${viewport.width}`, { ...viewport, mobile: true });
    const overflow = view.metrics.documentWidth > view.metrics.clientWidth;
    check(`mobile-no-horizontal-overflow-${viewport.width}`, !overflow, { documentWidth: view.metrics.documentWidth, clientWidth: view.metrics.clientWidth, screenshotWidth: view.screenshot.width });
    await context.close();
  }

  evidence.detectorScriptSha256 = sha256(fs.readFileSync('C:\\Users\\Administrator\\.codex\\skills\\impeccable\\scripts\\detector\\detect-antipatterns-browser.js'));
  evidence.targetFingerprintAfter = fingerprintTargets();
  check('target-unchanged-during-capture', evidence.targetFingerprintBefore.aggregateSha256 === evidence.targetFingerprintAfter.aggregateSha256, { before: evidence.targetFingerprintBefore.aggregateSha256, after: evidence.targetFingerprintAfter.aggregateSha256 });
  evidence.finishedAt = new Date().toISOString();
  evidence.networkGuard = {
    attemptedWrites: evidence.network.writesAttempted.length,
    blockedRequests: evidence.network.blockedRequests.length,
    blockedWebSockets: evidence.network.blockedWebSockets.length,
    backendWriteRequestsReached: 0,
    note: 'Only allowlisted same-origin VitePress assets and the local detector script were continued; other HTTP requests were aborted.',
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
  fs.writeFileSync(path.join(here, 'lxupload-browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  const overlayAttribution = evidence.views.map((view) => ({
    view: view.name,
    requestedViewport: view.requestedViewport,
    detectorReady: view.scan.detectorReady,
    findingCount: view.scan.findingCount,
    overlay: view.overlay,
    attributions: view.attribution,
  }));
  fs.writeFileSync(path.join(here, 'lxupload-overlay-attribution.json'), `${JSON.stringify(overlayAttribution, null, 2)}\n`);
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
