import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDir, '../../../../');
const appRoot = path.join(repoRoot, 'linkx-fe');
const liveScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const edgeExecutable = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const playwrightEntry = path.join(repoRoot, 'other-admin', 'admin-vue3', 'node_modules', '.pnpm', 'playwright@1.58.0', 'node_modules', 'playwright', 'index.mjs');
const { chromium } = await import(pathToFileURL(playwrightEntry));
const siteRoot = 'http://127.0.0.1:4174';
const targets = [
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/src/components/LxUpload',
];
const screenshotDir = path.join(outputDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

function writeJson(name, value) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function walkFiles(target) {
  const absolute = path.join(repoRoot, target);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(absolute, entry.name);
    if (entry.isDirectory()) return walkFiles(path.relative(repoRoot, candidate));
    return entry.isFile() ? [candidate] : [];
  }).sort();
}

function hashSources() {
  return Object.fromEntries(targets.map((target) => [target, walkFiles(target).map((absolute) => ({
    path: path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
  }))]));
}

function noQuery(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

function runCommand(name, args, cwd) {
  const command = `node "${args.join('" "')}"`;
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  fs.writeFileSync(path.join(outputDir, `${name}.command.txt`), `${command}\n`);
  let stdout = result.stdout ?? '';
  if (name === 'overlay-server-start') {
    try {
      const parsed = JSON.parse(stdout);
      stdout = JSON.stringify({ pid: parsed.pid, port: parsed.port, token: '[redacted]' }) + '\n';
    } catch {}
  }
  fs.writeFileSync(path.join(outputDir, `${name}.stdout.txt`), stdout);
  fs.writeFileSync(path.join(outputDir, `${name}.stderr.txt`), result.stderr ?? '');
  fs.writeFileSync(path.join(outputDir, `${name}.exit-code.txt`), `${Number.isInteger(result.status) ? result.status : `null (${result.signal ?? 'unknown signal'})`}\n`);
  return { command, result };
}

const scenarios = [
  { id: 'datepicker-desktop-light-open', target: 'datepicker', theme: 'light', width: 1440, height: 1000, state: 'open-calendar' },
  { id: 'datepicker-desktop-hud-open', target: 'datepicker', theme: 'hud', width: 1440, height: 1000, state: 'open-calendar' },
  { id: 'datepicker-mobile-375-light-open', target: 'datepicker', theme: 'light', width: 375, height: 812, mobile: true, state: 'open-calendar' },
  { id: 'datepicker-desktop-light-keyboard-open', target: 'datepicker', theme: 'light', width: 1440, height: 1000, state: 'keyboard-open' },
  { id: 'dynamicform-desktop-light-validation-error', target: 'dynamicform', theme: 'light', width: 1440, height: 1000, state: 'validation-error' },
  { id: 'dynamicform-desktop-hud-field-preview', target: 'dynamicform', theme: 'hud', width: 1440, height: 1000, state: 'field-preview' },
  { id: 'dynamicform-mobile-375-hud-error-reduced-motion', target: 'dynamicform', theme: 'hud', width: 375, height: 812, mobile: true, reducedMotion: 'reduce', state: 'validation-error' },
  { id: 'upload-desktop-light-failure', target: 'upload', theme: 'light', width: 1440, height: 1000, state: 'upload-failure' },
  { id: 'upload-desktop-hud-progress', target: 'upload', theme: 'hud', width: 1440, height: 1000, state: 'upload-progress-after-injection' },
  { id: 'upload-mobile-375-light-failure', target: 'upload', theme: 'light', width: 375, height: 812, mobile: true, state: 'upload-failure' },
];

const start = runCommand('overlay-server-start', [liveScript, '--background', '--port=8493'], appRoot);
let liveStarted = start.result.status === 0;
let liveInfo = null;
try { liveInfo = JSON.parse(start.result.stdout || 'null'); } catch { liveInfo = null; }
const detectorUrl = liveStarted && Number.isInteger(liveInfo?.port)
  ? `http://127.0.0.1:${liveInfo.port}/detect.js`
  : null;
writeJson('overlay-server-start.json', {
  command: start.command,
  exitCode: start.result.status,
  stdoutRedacted: liveInfo ? JSON.stringify({ pid: liveInfo.pid, port: liveInfo.port, token: '[redacted]' }) : (start.result.stdout ?? ''),
  stderr: start.result.stderr ?? '',
  pid: liveInfo?.pid ?? null,
  port: liveInfo?.port ?? null,
  detectorUrl,
});

const hashesBefore = hashSources();
writeJson('source-hashes-before-browser.json', { capturedAt: new Date().toISOString(), targets: hashesBefore });
const summaries = [];
let browser = null;

async function setHud(page, target) {
  const selectors = {
    datepicker: ['.lx-date-picker-demo__toolbar input[type="checkbox"]', 0],
    dynamicform: ['.dynamic-form-demo__toolbar input[type="checkbox"]', 1],
    upload: ['.lx-upload-demo__header input[type="checkbox"]', 0],
  };
  const [selector, index] = selectors[target];
  const control = page.locator(selector).nth(index);
  if (!(await control.count())) throw new Error(`HUD 开关未找到：${target}`);
  const before = await control.isChecked().catch(() => false);
  await control.evaluate((element) => element.click());
  await page.waitForFunction(() => document.documentElement.classList.contains('lx-theme-hud'), null, { timeout: 5000 });
  const after = await control.isChecked().catch(() => null);
  page.themeToggleEvidence = { target, selector, index, before, after, htmlClasses: await page.evaluate(() => [...document.documentElement.classList]) };
}

async function setScenarioState(page, scenario, beforeOverlay = true) {
  const selector = {
    datepicker: '.lx-date-picker-demo',
    dynamicform: '.dynamic-form-demo',
    upload: '.lx-upload-demo',
  }[scenario.target];
  const root = page.locator(selector);
  await root.waitFor({ state: 'visible', timeout: 30000 });
  await root.scrollIntoViewIfNeeded();
  if (scenario.theme === 'hud') await setHud(page, scenario.target);

  if (scenario.state === 'open-calendar') {
    await page.locator('[data-testid="range"] input').first().click({ force: true });
    await page.waitForFunction(() => [...document.querySelectorAll('.el-picker-panel')].some((el) => el.getBoundingClientRect().width > 0));
  }
  if (scenario.state === 'keyboard-open') {
    const startInput = page.locator('[data-testid="range"] input').first();
    await startInput.focus();
    await startInput.press('ArrowDown');
    await page.waitForFunction(() => [...document.querySelectorAll('.el-picker-panel')].some((el) => el.getBoundingClientRect().width > 0));
  }
  if (scenario.state === 'validation-error') {
    await page.getByRole('button', { name: '提交校验' }).click();
    await page.waitForTimeout(400);
  }
  if (scenario.state === 'field-preview') {
    await page.locator('.dynamic-form-demo__schema-preview summary').click();
    await page.locator('.dynamic-form-demo__schema-preview').scrollIntoViewIfNeeded();
  }
  if (scenario.state === 'upload-failure' || (scenario.state === 'upload-progress-after-injection' && beforeOverlay)) {
    if (scenario.state === 'upload-failure') await page.getByRole('button', { name: '下一次上传失败' }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'assessment-sample.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('id,name\n1,Assessment\n', 'utf8'),
    });
    if (scenario.state === 'upload-failure') {
      await page.getByRole('button', { name: '上传全部待传文件' }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.includes('上传失败'), null, { timeout: 8000 });
    }
  }
  await root.scrollIntoViewIfNeeded();
  return await readVisibleState(page, scenario.target);
}

async function readVisibleState(page, target) {
  return page.evaluate((target) => {
    const signalLines = document.body.innerText.split('\n').map((line) => line.trim())
      .filter((line) => /必填|请输入|校验|失败|上传中|排队|已取消|进度|暂无/.test(line)).slice(0, 40);
    return {
      title: document.title,
      heading: document.querySelector('h1')?.innerText.trim() ?? '',
      themeClasses: [...document.documentElement.classList],
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      activeElement: document.activeElement?.outerHTML.slice(0, 260) ?? null,
      visibleSignalLines: signalLines,
      calendarPanels: [...document.querySelectorAll('.el-picker-panel')].filter((el) => el.getBoundingClientRect().width > 0).length,
      formErrorCount: document.querySelectorAll('.lx-form-item.is-error, .el-form-item.is-error, .is-error').length,
      schemaPreviewOpen: document.querySelector('.dynamic-form-demo__schema-preview')?.hasAttribute('open') ?? false,
      uploadStateText: document.querySelector('[data-testid="upload-last-action"]')?.textContent.trim() ?? null,
      uploadProgressBars: document.querySelectorAll('[role="progressbar"], .el-progress').length,
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      target,
    };
  }, target);
}

async function injectAndScan(page, preflightOnly = false) {
  const preflight = await page.evaluate(() => {
    const originalTitle = document.title;
    document.title = 'Assessment B mutable injection preflight';
    const script = document.createElement('script');
    script.type = 'application/json';
    script.dataset.assessmentPreflight = 'true';
    document.head.append(script);
    const mutable = script.isConnected && document.title === 'Assessment B mutable injection preflight';
    script.remove();
    document.title = originalTitle;
    return { mutable, titleRestored: document.title === originalTitle, scriptAppended: true };
  });
  if (preflightOnly) return { preflight, scriptLoaded: false, scanSucceeded: false };

  let injectionError = null;
  try { await page.addScriptTag({ url: detectorUrl }); }
  catch (error) { injectionError = error.message; }
  let firstScan = null;
  let scanError = null;
  if (!injectionError) {
    try {
      firstScan = await page.evaluate(() => {
        if (typeof window.impeccableScan !== 'function') return { available: false };
        const rawFindings = window.impeccableScan();
        const findings = typeof window.impeccableDetect === 'function'
          ? window.impeccableDetect()
          : null;
        const nodes = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const target = element._targetEl;
            return {
              tag: element.tagName.toLowerCase(),
              classes: [...element.classList],
              text: (element.innerText || element.textContent || '').trim().slice(0, 180),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              target: target ? {
                tag: target.tagName?.toLowerCase() ?? null,
                id: target.id || null,
                className: typeof target.className === 'string' ? target.className.slice(0, 240) : null,
                text: (target.innerText || target.textContent || '').trim().slice(0, 180),
              } : null,
            };
          });
        return {
          available: true,
          scanGroupCount: Array.isArray(rawFindings) ? rawFindings.length : null,
          findings,
          findingGroupCount: Array.isArray(findings) ? findings.length : null,
          overlayNodes: nodes,
          overlayNodeCount: nodes.length,
        };
      });
      if (firstScan?.available !== true) scanError = 'window.impeccableScan was not defined after loading detect.js.';
    } catch (error) { scanError = error.message; }
  }
  await page.waitForTimeout(2200);
  return {
    preflight,
    scriptUrl: detectorUrl,
    scriptLoaded: !injectionError,
    injectionError,
    scanSucceeded: firstScan?.available === true && !scanError,
    scanError,
    firstScan,
  };
}

async function capture(scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(scenario.mobile),
    hasTouch: Boolean(scenario.mobile),
    reducedMotion: scenario.reducedMotion ?? 'no-preference',
  });
  const page = await context.newPage();
  page.consoleMessages = [];
  page.pageErrors = [];
  page.requests = [];
  page.responses = [];
  page.failedRequests = [];
  page.on('console', (message) => page.consoleMessages.push({ type: message.type(), text: message.text().slice(0, 1000) }));
  page.on('pageerror', (error) => page.pageErrors.push(error.message));
  page.on('request', (request) => page.requests.push({ method: request.method(), url: noQuery(request.url()), resourceType: request.resourceType() }));
  page.on('response', (response) => page.responses.push({ status: response.status(), url: noQuery(response.url()), resourceType: response.request().resourceType() }));
  page.on('requestfailed', (request) => page.failedRequests.push({ method: request.method(), url: noQuery(request.url()), resourceType: request.resourceType(), error: request.failure()?.errorText ?? 'unknown' }));

  const pageName = { datepicker: 'lxdatepicker', dynamicform: 'lxdynamicform', upload: 'lxupload' }[scenario.target];
  const url = `${siteRoot}/components/${pageName}`;
  let response = null;
  let stateBeforeOverlay = null;
  let stateForScreenshot = null;
  let overlay = null;
  let error = null;
  const screenshotName = `${scenario.id}.png`;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 30000 });
    const component = { datepicker: '.lx-date-picker-demo', dynamicform: '.dynamic-form-demo', upload: '.lx-upload-demo' }[scenario.target];
    await page.locator(component).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(450);

    if (scenario.state === 'upload-progress-after-injection') {
      const root = page.locator(component);
      await root.scrollIntoViewIfNeeded();
      await setHud(page, scenario.target);
      stateBeforeOverlay = await readVisibleState(page, scenario.target);
      overlay = await injectAndScan(page);
      await page.locator('input[type="file"]').first().setInputFiles({
        name: 'assessment-progress.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,name\n1,Progress\n', 'utf8'),
      });
      await page.getByRole('button', { name: '上传全部待传文件' }).click();
      await page.waitForTimeout(280);
      const progressScan = await page.evaluate(() => {
        if (typeof window.impeccableScan !== 'function') return { available: false };
        const rawFindings = window.impeccableScan();
        const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null;
        const overlays = document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip').length;
        return { available: true, scanGroupCount: Array.isArray(rawFindings) ? rawFindings.length : null, findings, overlayElements: overlays };
      });
      overlay.progressStateScan = progressScan;
      stateForScreenshot = await readVisibleState(page, scenario.target);
    } else {
      stateBeforeOverlay = await setScenarioState(page, scenario, true);
      overlay = await injectAndScan(page);
      stateForScreenshot = await readVisibleState(page, scenario.target);
    }

    await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: false, animations: 'disabled' });
  } catch (captureError) {
    error = captureError.message;
    try { await page.screenshot({ path: path.join(screenshotDir, `${scenario.id}-incomplete.png`), fullPage: false, animations: 'disabled' }); } catch {}
  }

  const evidence = {
    id: scenario.id,
    target: scenario.target,
    theme: scenario.theme,
    state: scenario.state,
    url,
    navigationStatus: response?.status() ?? null,
    viewport: { width: scenario.width, height: scenario.height, mobile: Boolean(scenario.mobile), reducedMotion: scenario.reducedMotion ?? 'no-preference' },
    themeToggle: page.themeToggleEvidence ?? null,
    stateBeforeOverlay,
    stateForScreenshot,
    injection: overlay,
    screenshot: fs.existsSync(path.join(screenshotDir, screenshotName)) ? `screenshots/${screenshotName}` : null,
    captureError: error,
    console: page.consoleMessages,
    pageErrors: page.pageErrors,
    requests: page.requests,
    responses: page.responses,
    failedRequests: page.failedRequests,
    impeccableConsole: page.consoleMessages.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
  };
  writeJson(`${scenario.id}.evidence.json`, evidence);
  writeJson(`${scenario.id}.overlay-scan.json`, {
    preflight: overlay?.preflight ?? null,
    scriptUrl: overlay?.scriptUrl ?? null,
    scriptLoaded: overlay?.scriptLoaded ?? false,
    injectionError: overlay?.injectionError ?? null,
    scanSucceeded: overlay?.scanSucceeded ?? false,
    scanError: overlay?.scanError ?? null,
    firstScan: overlay?.firstScan ?? null,
    progressStateScan: overlay?.progressStateScan ?? null,
    screenshot: evidence.screenshot,
  });
  writeJson(`${scenario.id}.console-network.json`, {
    consoleSummary: {
      count: page.consoleMessages.length,
      errors: page.consoleMessages.filter((entry) => entry.type === 'error'),
      warnings: page.consoleMessages.filter((entry) => entry.type === 'warning'),
      impeccable: evidence.impeccableConsole,
      pageErrors: page.pageErrors,
    },
    requests: page.requests,
    responses: page.responses,
    failedRequests: page.failedRequests,
  });
  summaries.push({
    id: scenario.id,
    status: error ? 'incomplete' : overlay?.scanSucceeded ? 'overlay-captured' : 'injection-or-scan-failed',
    navigationStatus: response?.status() ?? null,
    viewport: `${scenario.width}x${scenario.height}`,
    state: scenario.state,
    theme: scenario.theme,
    reducedMotion: scenario.reducedMotion === 'reduce',
    scriptLoaded: overlay?.scriptLoaded ?? false,
    scanSucceeded: overlay?.scanSucceeded ?? false,
    overlayNodeCount: overlay?.firstScan?.overlayNodeCount ?? null,
    screenshot: evidence.screenshot,
    failureCount: page.failedRequests.length,
    pageErrorCount: page.pageErrors.length,
    captureError: error,
  });
  await context.close();
}

try {
  if (!liveStarted || !detectorUrl) throw new Error('Impeccable live-server failed to start; detector script URL unavailable.');
  browser = await chromium.launch({ headless: true, executablePath: edgeExecutable });
  writeJson('playwright-runtime.json', {
    package: playwrightEntry,
    browser: 'Microsoft Edge launched through Playwright',
    version: browser.version(),
    executable: edgeExecutable,
    isolation: 'One fresh Playwright browser context per scenario; no storage state reused.',
  });
  for (const scenario of scenarios) await capture(scenario);
} catch (error) {
  writeJson('browser-run-error.json', { error: error.message, liveStarted, detectorUrl, serverStartExitCode: start.result.status });
} finally {
  if (browser) await browser.close().catch(() => {});
  if (liveStarted) {
    const stop = runCommand('overlay-server-stop', [liveScript, 'stop', '--keep-inject'], appRoot);
    writeJson('overlay-server-stop.json', {
      command: stop.command,
      exitCode: stop.result.status,
      stdout: stop.result.stdout ?? '',
      stderr: stop.result.stderr ?? '',
    });
  }
  const hashesAfter = hashSources();
  writeJson('source-hashes-after-browser.json', { capturedAt: new Date().toISOString(), targets: hashesAfter });
  writeJson('browser-capture-summary.json', {
    completedAt: new Date().toISOString(),
    siteRoot,
    liveServer: { started: liveStarted, pid: liveInfo?.pid ?? null, port: liveInfo?.port ?? null, stoppedByThisRun: liveStarted },
    playwright: 'Microsoft Edge via Playwright; isolated context per scenario.',
    sourceIntegrity: targets.map((target) => ({
      target,
      unchangedFromBrowserStart: JSON.stringify(hashesBefore[target]) === JSON.stringify(hashesAfter[target]),
    })),
    scenarios: summaries,
  });
}

console.log(JSON.stringify({ liveStarted, port: liveInfo?.port ?? null, scenarios: summaries }, null, 2));
