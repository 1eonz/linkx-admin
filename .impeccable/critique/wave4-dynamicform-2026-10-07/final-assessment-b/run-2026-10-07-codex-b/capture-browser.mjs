import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(outDir, 'screenshots');
const playwrightEntry = path.join(root, 'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const liveServerInfoPath = path.join(root, '.impeccable/live/server.json');
const targets = [
  { key: 'dynamicform', label: 'LxDynamicForm', url: 'http://127.0.0.1:4174/components/lxdynamicform.html', selector: '.dynamic-form-demo' },
  { key: 'datepicker', label: 'LxDatePicker', url: 'http://127.0.0.1:4174/components/lxdatepicker.html', selector: '.lx-date-picker-demo' },
  { key: 'upload', label: 'LxUpload', url: 'http://127.0.0.1:4174/components/lxupload.html', selector: '.lx-upload-demo' },
];
const sharedDependencies = ['linkx-fe/src/components/LxForm/LxFormItem.vue'];
const evidence = {
  startedAt: new Date().toISOString(),
  scope: 'LxDynamicForm source entry and DynamicForm, DatePicker, Upload docs demos',
  browserMethod: 'Playwright 1.58.0 with isolated Chromium browser contexts; native browser automation unavailable',
  browserContext: null,
  liveOverlayServer: { startedByAssessment: false, start: null, stop: null },
  targets: [],
  additionalBrowserSessions: [],
  console: [],
  pageErrors: [],
  failedRequests: [],
  httpErrors: [],
  requests: [],
  states: [],
  networkBoundary: { observedExternalRequests: [] },
  errors: [],
};
let serverInfo;
let browser;
let sourceHashesBefore;

function walkFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(dir.replaceAll(path.sep, '/'), entry.name);
    return entry.isDirectory() ? walkFiles(relative) : [relative];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
}

function sourceSnapshot() {
  const files = [...new Set([
    ...walkFiles('linkx-fe/src/components/LxDynamicForm'),
    ...walkFiles('linkx-fe/src/components/LxDatePicker'),
    ...walkFiles('linkx-fe/src/components/LxUpload'),
    ...sharedDependencies,
    'linkx-fe/docs/components/lxdynamicform.md',
    'linkx-fe/docs/components/lxdatepicker.md',
    'linkx-fe/docs/components/lxupload.md',
  ])].sort();
  return Object.fromEntries(files.map((file) => [file, sha256(file)]));
}

function writeHashes(name, files, changedDuringCapture = undefined) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify({
    capturedAt: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    files,
    ...(changedDuringCapture ? { changedDuringCapture } : {}),
  }, null, 2) + '\n');
}

function startOverlayServer() {
  if (fs.existsSync(liveServerInfoPath)) {
    throw new Error('现有 Impeccable server 记录已存在；为保护它，本次跳过 overlay 启动。');
  }
  const result = spawnSync(process.execPath, [liveServerPath, '--background'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? 1;
  let info = null;
  try {
    info = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).at(-1) ?? 'null');
  } catch {}
  const safe = info ? { pid: info.pid, port: info.port, token: '[REDACTED]' } : null;
  evidence.liveOverlayServer.start = { command: `node "${liveServerPath}" --background`, exitCode, stdout: safe, stderr };
  fs.writeFileSync(path.join(outDir, 'overlay-server-start.command.txt'), `node "${liveServerPath}" --background\n`);
  fs.writeFileSync(path.join(outDir, 'overlay-server-start.stdout.json'), JSON.stringify(safe ?? { raw: stdout }, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'overlay-server-start.stderr.txt'), stderr);
  fs.writeFileSync(path.join(outDir, 'overlay-server-start.exit-code.txt'), String(exitCode) + '\n');
  if (exitCode !== 0 || !info || !Number.isInteger(info.pid) || !Number.isInteger(info.port)) {
    throw new Error(`Impeccable live server 启动失败，退出码 ${exitCode}。`);
  }
  serverInfo = info;
  evidence.liveOverlayServer.startedByAssessment = true;
}

function stopOverlayServer() {
  if (!serverInfo) return;
  let current;
  try {
    current = JSON.parse(fs.readFileSync(liveServerInfoPath, 'utf8'));
  } catch {}
  if (current?.pid !== serverInfo.pid || current?.port !== serverInfo.port) {
    const reason = 'server 记录不再匹配本轮启动的 pid/port；为避免停止其他会话，未执行 stop。';
    evidence.liveOverlayServer.stop = { skipped: true, reason };
    fs.writeFileSync(path.join(outDir, 'overlay-server-stop.command.txt'), 'not-run\n');
    fs.writeFileSync(path.join(outDir, 'overlay-server-stop.stdout.txt'), '');
    fs.writeFileSync(path.join(outDir, 'overlay-server-stop.stderr.txt'), reason + '\n');
    fs.writeFileSync(path.join(outDir, 'overlay-server-stop.exit-code.txt'), 'not-run\n');
    return;
  }
  const result = spawnSync(process.execPath, [liveServerPath, 'stop', '--keep-inject'], { cwd: root, encoding: 'utf8', timeout: 30000 });
  const exitCode = result.status ?? 1;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  evidence.liveOverlayServer.stop = { command: `node "${liveServerPath}" stop --keep-inject`, exitCode, stdout, stderr };
  fs.writeFileSync(path.join(outDir, 'overlay-server-stop.command.txt'), `node "${liveServerPath}" stop --keep-inject\n`);
  fs.writeFileSync(path.join(outDir, 'overlay-server-stop.stdout.txt'), stdout);
  fs.writeFileSync(path.join(outDir, 'overlay-server-stop.stderr.txt'), stderr);
  fs.writeFileSync(path.join(outDir, 'overlay-server-stop.exit-code.txt'), String(exitCode) + '\n');
  if (exitCode !== 0) evidence.errors.push(`停止本轮 Impeccable live server 失败，退出码 ${exitCode}。`);
}

function attachListeners(page, targetKey) {
  page.on('console', (message) => evidence.console.push({ target: targetKey, type: message.type(), text: message.text(), location: message.location() }));
  page.on('pageerror', (error) => evidence.pageErrors.push({ target: targetKey, text: error.message, stack: error.stack ?? '' }));
  page.on('request', (request) => evidence.requests.push({ target: targetKey, url: request.url(), method: request.method(), resourceType: request.resourceType() }));
  page.on('requestfailed', (request) => evidence.failedRequests.push({ target: targetKey, url: request.url(), method: request.method(), failure: request.failure()?.errorText ?? '' }));
  page.on('response', (response) => {
    if (response.status() >= 400) evidence.httpErrors.push({ target: targetKey, status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
  });
}

async function preflight(page, target) {
  return page.evaluate((label) => {
    document.title = `[Human] ${label} Assessment B`;
    const script = document.createElement('script');
    script.textContent = 'window.__assessmentBPreflight = true';
    document.head.appendChild(script);
    return {
      title: document.title,
      mutable: window.__assessmentBPreflight === true,
      scriptConnected: script.isConnected,
      scriptTag: script.tagName,
    };
  }, target.label);
}

async function injectOverlay(page) {
  if (!serverInfo) throw new Error('没有本轮 live server，跳过 overlay 注入。');
  const url = `http://127.0.0.1:${serverInfo.port}/detect.js`;
  await page.addScriptTag({ url });
  await page.waitForTimeout(2700);
  return page.evaluate((source) => ({
    title: document.title,
    source,
    scriptConnected: [...document.scripts].some((script) => script.src === source),
    scanAvailable: typeof window.impeccableScanAsync === 'function',
    detectAvailable: typeof window.impeccableDetectAsync === 'function',
    preflightMarker: window.__assessmentBPreflight === true,
  }), url);
}

async function scanAndCapture(page, target, stateName, filename, options = {}) {
  const scan = await page.evaluate(async () => {
    if (typeof window.impeccableScanAsync !== 'function') return { available: false, groups: [], findingCount: 0, overlays: [] };
    const groups = await window.impeccableScanAsync();
    const serialized = groups.map(({ el, findings }) => {
      const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
      const selector = el.id ? `#${el.id}` : `${el.tagName?.toLowerCase() ?? 'unknown'}${classes.slice(0, 3).map((name) => `.${name}`).join('')}`;
      return {
        selector,
        tagName: el.tagName?.toLowerCase() ?? 'unknown',
        classes,
        text: (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().slice(0, 180),
        componentOwner: el.closest('.dynamic-form-demo, .lx-date-picker-demo, .lx-upload-demo')?.className ?? null,
        rect: el.getBoundingClientRect?.().toJSON?.() ?? null,
        findings: findings.map((item) => ({ type: item.type ?? item.id ?? 'unknown', name: item.name ?? item.type ?? 'unknown', detail: item.detail ?? item.snippet ?? '' })),
      };
    });
    const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((el) => ({
      className: el.className,
      text: (el.innerText || el.textContent || '').trim().slice(0, 120),
      visible: getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity || 1) > 0,
      rect: el.getBoundingClientRect().toJSON(),
    }));
    return {
      available: true,
      groupCount: serialized.length,
      findingCount: serialized.reduce((sum, group) => sum + group.findings.length, 0),
      groups: serialized,
      overlayCount: overlays.length,
      visibleOverlayCount: overlays.filter((item) => item.visible).length,
      overlays,
    };
  });
  const pageState = await page.evaluate((selector) => {
    const root = document.querySelector(selector);
    const rect = root?.getBoundingClientRect();
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY, devicePixelRatio },
      visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null,
      media: { coarsePointer: matchMedia('(pointer: coarse)').matches, noHover: matchMedia('(hover: none)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyClientWidth: document.body.clientWidth, bodyScrollWidth: document.body.scrollWidth },
      themeClasses: [...document.documentElement.classList],
      componentRoot: root ? { className: root.className, rect: rect.toJSON() } : null,
      pickerPopperCount: document.querySelectorAll('.el-picker-panel').length,
      pageText: document.body.innerText.trim().slice(0, 650),
    };
  }, target.selector);
  const browserViewport = page.viewportSize();
  const record = { target: target.key, state: stateName, screenshot: `screenshots/${filename}`, scan, page: { ...pageState, browserViewport }, screenshotSaved: false };
  try {
    await page.screenshot({ path: path.join(screenshotDir, filename), animations: 'disabled', fullPage: options.fullPage ?? false });
    const bytes = fs.readFileSync(path.join(screenshotDir, filename));
    record.screenshotPixels = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    record.viewportMatchesPixels = record.screenshotPixels.width === browserViewport?.width && record.screenshotPixels.height === browserViewport?.height;
    record.screenshotSaved = true;
  } catch (error) {
    record.screenshotError = error instanceof Error ? error.message : String(error);
  }
  evidence.states.push(record);
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  return record;
}

async function setupTarget(target, index, options = {}) {
  const { recordTarget = true, contextOptions = {} } = options;
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1, locale: 'zh-CN', colorScheme: 'light', ...contextOptions });
  const page = await context.newPage();
  attachListeners(page, target.key);
  const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(700);
  const mutablePreflight = await preflight(page, target);
  if (index === 0) startOverlayServer();
  const injection = await injectOverlay(page);
  const result = { key: target.key, label: target.label, url: target.url, httpStatus: response?.status() ?? null, preflight: mutablePreflight, injection };
  if (recordTarget) evidence.targets.push(result);
  else evidence.additionalBrowserSessions.push(result);
  if (response?.status() !== 200) evidence.errors.push(`${target.key} 页面返回 HTTP ${response?.status() ?? 'unknown'}。`);
  if (!injection.scriptConnected || !injection.scanAvailable || !injection.detectAvailable) evidence.errors.push(`${target.key} overlay 注入或页面扫描 API 不可用。`);
  await page.locator(target.selector).scrollIntoViewIfNeeded();
  return { context, page, target };
}

async function captureDynamicForm() {
  const state = await setupTarget(targets[0], 0);
  const { page, target } = state;
  await scanAndCapture(page, target, 'desktop-light-default', 'dynamicform-desktop-light-default.png');
  const settings = page.locator('.dynamic-form-demo__settings');
  if (!(await settings.evaluate((node) => node.open))) await settings.locator('summary').click();
  const darkLabel = settings.locator('label').filter({ hasText: '文档站整体深色' }).first();
  await darkLabel.click();
  await page.waitForTimeout(200);
  await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded();
  const dark = await scanAndCapture(page, target, 'desktop-hud-dark', 'dynamicform-desktop-hud-dark.png');
  dark.page.themeClasses = await page.locator('.dynamic-form-demo').getAttribute('class');
  const candidateError = page.locator('.dynamic-form-demo__candidate-controls').getByText('失败', { exact: true }).first();
  await candidateError.click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid="candidate-request-status"]').scrollIntoViewIfNeeded();
  const failed = await scanAndCapture(page, target, 'candidate-request-error', 'dynamicform-candidate-request-error.png', { resetScroll: false });
  failed.page.candidateStatus = await page.locator('[data-testid="candidate-request-status"]').innerText().catch(() => '');
  await page.getByRole('button', { name: '提交校验', exact: true }).click();
  await page.waitForTimeout(120);
  await page.locator('.dynamic-form-demo__footer').scrollIntoViewIfNeeded();
  const validation = await scanAndCapture(page, target, 'validation-error', 'dynamicform-validation-error.png', { resetScroll: false });
  validation.page.validationText = await page.locator('.dynamic-form-demo__footer').innerText().catch(() => '');
  await state.context.close();
}

async function captureDatePicker() {
  const state = await setupTarget(targets[1], 1);
  const { page, target } = state;
  await scanAndCapture(page, target, 'desktop-light-default', 'datepicker-desktop-light-default.png');
  const input = page.locator('[data-testid="range"] input').first();
  await input.click();
  await page.waitForTimeout(250);
  const open = await scanAndCapture(page, target, 'desktop-light-range-open', 'datepicker-desktop-light-range-open.png');
  open.page.pickerVisible = await page.locator('.el-picker-panel').first().isVisible().catch(() => false);
  await page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]').check();
  await page.waitForTimeout(200);
  const hud = await scanAndCapture(page, target, 'desktop-hud-range-open', 'datepicker-desktop-hud-range-open.png');
  hud.page.demoThemeClass = await page.locator('.lx-date-picker-demo').getAttribute('class');
  await input.press('Escape').catch(async () => page.keyboard.press('Escape'));
  await state.context.close();
  // 单独创建移动端上下文，避免仅调整视口却仍处于桌面指针媒体环境。
  const mobileState = await setupTarget(target, 1, {
    recordTarget: false,
    contextOptions: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  });
  const mobilePage = mobileState.page;
  const touch = await mobilePage.evaluate(() => ({
    coarsePointer: matchMedia('(pointer: coarse)').matches,
    noHover: matchMedia('(hover: none)').matches,
    maxTouchPoints: navigator.maxTouchPoints,
    isMobile: matchMedia('(max-width: 600px)').matches,
  }));
  evidence.additionalBrowserSessions.at(-1).touch = touch;
  if (!touch.coarsePointer || !touch.noHover || touch.maxTouchPoints < 1) evidence.errors.push('DatePicker 手机上下文未启用 coarse pointer 与触屏输入。');
  const mobileInput = mobilePage.locator('[data-testid="range"] input').first();
  await mobileInput.scrollIntoViewIfNeeded();
  const inputBox = await mobileInput.boundingBox();
  if (!inputBox) throw new Error('DatePicker 手机范围输入框不可见，无法执行触屏 tap。');
  await mobilePage.touchscreen.tap(inputBox.x + inputBox.width / 2, inputBox.y + inputBox.height / 2);
  await mobilePage.waitForTimeout(250);
  const mobile = await scanAndCapture(mobilePage, target, 'mobile-375-touch-range-open', 'datepicker-mobile-375-touch-range-open.png');
  mobile.page.pickerVisible = await mobilePage.locator('.el-picker-panel').first().isVisible().catch(() => false);
  mobile.page.touch = touch;
  await mobileState.context.close();
}

async function captureUpload() {
  const state = await setupTarget(targets[2], 2);
  const { page, target } = state;
  await scanAndCapture(page, target, 'desktop-light-default', 'upload-desktop-light-default.png');
  await page.locator('.lx-upload-demo__header input[type="checkbox"]').check();
  await page.waitForTimeout(200);
  await scanAndCapture(page, target, 'desktop-hud-dark', 'upload-desktop-hud-dark.png');
  await page.locator('.lx-upload-demo__header input[type="checkbox"]').uncheck();
  await page.locator('.lx-upload-demo__toolbar label').filter({ hasText: '禁用上传' }).locator('input').check();
  await page.waitForTimeout(150);
  await scanAndCapture(page, target, 'disabled-upload', 'upload-disabled.png');
  await page.locator('.lx-upload-demo__toolbar label').filter({ hasText: '禁用上传' }).locator('input').uncheck();
  await page.getByRole('button', { name: '下一次上传失败', exact: true }).click();
  const sampleName = 'assessment-b-sample.csv';
  await page.locator('.lx-upload-demo input[type="file"]').first().setInputFiles({ name: sampleName, mimeType: 'text/csv', buffer: Buffer.from('id,name\n1,Example\n', 'utf8') });
  await page.getByRole('button', { name: '开始上传', exact: true }).click();
  let mockFailure = false;
  try {
    await page.waitForFunction((message) => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.trim() === message, `${sampleName} 上传失败`, { timeout: 8000 });
    mockFailure = true;
  } catch {
    evidence.errors.push('上传场景未能观察到样例文件对应的本地 Mock 失败结果。');
  }
  await page.locator('[data-testid="upload-last-action"]').scrollIntoViewIfNeeded();
  const failure = await scanAndCapture(page, target, 'local-mock-upload-failure', 'upload-local-mock-failure.png', { resetScroll: false });
  failure.page.mockFailureObserved = mockFailure;
  failure.page.lastAction = await page.locator('[data-testid="upload-last-action"]').innerText().catch(() => '');
  failure.page.requestCount = await page.locator('[data-testid="upload-request-count"]').innerText().catch(() => '');
  await state.context.close();
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  if (!fs.existsSync(playwrightEntry)) throw new Error(`Playwright entrypoint missing: ${playwrightEntry}`);
  if (!fs.existsSync(chromePath)) throw new Error(`Chrome executable missing: ${chromePath}`);
  if (fs.existsSync(liveServerInfoPath)) throw new Error('已有 Impeccable live server 记录；拒绝覆盖。');
  sourceHashesBefore = sourceSnapshot();
  writeHashes('source-hashes-before-browser.json', sourceHashesBefore);
  const { chromium } = await import(pathToFileURL(playwrightEntry).href);
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
  evidence.browserContext = { isolated: true, headed: false, browserVersion: browser.version(), contexts: 4, mobileTouchContexts: 1, viewportDefault: { width: 1440, height: 950 }, nativeBrowserAutomationAvailable: false };
  await captureDynamicForm();
  await captureDatePicker();
  await captureUpload();
  evidence.networkBoundary.observedExternalRequests = [...new Set(evidence.requests
    .map((item) => item.url)
    .filter((url) => !url.startsWith('http://127.0.0.1:4174/')
      && !url.startsWith('http://localhost:4174/')
      && (!serverInfo || !url.startsWith(`http://127.0.0.1:${serverInfo.port}/`))
      && !url.startsWith('data:') && !url.startsWith('blob:')))];
}

try {
  await main();
} catch (error) {
  evidence.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  stopOverlayServer();
  if (browser) {
    try { await browser.close(); } catch (error) { evidence.errors.push(`关闭 Playwright 浏览器失败：${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
  }
  if (sourceHashesBefore) {
    try {
      const after = sourceSnapshot();
      const changed = Object.keys(sourceHashesBefore).filter((file) => sourceHashesBefore[file] !== after[file]);
      writeHashes('source-hashes-after-browser.json', after, changed);
      evidence.sourceFileCount = Object.keys(after).length;
      evidence.changedDuringCapture = changed;
    } catch (error) {
      evidence.errors.push(`源文件哈希复核失败：${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
  evidence.completedAt = new Date().toISOString();
  evidence.screenshotCount = evidence.states.filter((state) => state.screenshotSaved).length;
  evidence.injectedTargetCount = evidence.targets.filter((target) => target.injection?.scriptConnected && target.injection?.scanAvailable).length;
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  process.stdout.write(JSON.stringify({
    pages: evidence.targets.map((target) => ({ key: target.key, status: target.httpStatus, injected: target.injection?.scriptConnected && target.injection?.scanAvailable })),
    states: evidence.states.length,
    screenshots: evidence.screenshotCount,
    pageErrors: evidence.pageErrors.length,
    failedRequests: evidence.failedRequests.length,
    httpErrors: evidence.httpErrors.length,
    externalRequests: evidence.networkBoundary.observedExternalRequests?.length ?? 0,
    errors: evidence.errors.length,
    liveServerStopped: evidence.liveOverlayServer.stop?.exitCode === 0,
  }) + '\n');
  if (evidence.errors.length || evidence.targets.length !== targets.length || evidence.screenshotCount !== evidence.states.length) process.exitCode = 1;
}
