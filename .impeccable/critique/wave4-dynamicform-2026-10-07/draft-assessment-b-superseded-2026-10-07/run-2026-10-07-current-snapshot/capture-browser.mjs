import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outputDir, '../../../../../');
const appRoot = path.join(repoRoot, 'linkx-fe');
const liveServerScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const edgeExecutable = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const playwrightEntry = path.join(repoRoot, 'other-admin', 'admin-vue3', 'node_modules', '.pnpm', 'playwright@1.58.0', 'node_modules', 'playwright', 'index.mjs');
const { chromium } = await import(pathToFileURL(playwrightEntry));
const targets = [
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/src/components/LxUpload',
];
const siteRoot = 'http://127.0.0.1:4174';
const screenshotsDir = path.join(outputDir, 'screenshots-current');
fs.mkdirSync(screenshotsDir, { recursive: true });

function writeJson(file, value) {
  fs.writeFileSync(path.join(outputDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

function listFiles(target) {
  const absolute = path.join(repoRoot, target);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return listFiles(path.relative(repoRoot, entryPath));
    return entry.isFile() ? [entryPath] : [];
  }).sort();
}

function hashTargets() {
  return Object.fromEntries(targets.map((target) => [target, listFiles(target).map((absolute) => ({
    path: path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
  }))]));
}

function pathWithoutQuery(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

function runRecordedCommand(name, args, cwd) {
  const command = `node "${args.join('" "')}"`;
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  fs.writeFileSync(path.join(outputDir, `${name}.command.txt`), `${command}\n`);
  fs.writeFileSync(path.join(outputDir, `${name}.stdout.txt`), result.stdout ?? '');
  fs.writeFileSync(path.join(outputDir, `${name}.stderr.txt`), result.stderr ?? '');
  fs.writeFileSync(path.join(outputDir, `${name}.exit-code.txt`), `${Number.isInteger(result.status) ? result.status : `null (${result.signal ?? 'unknown signal'})`}\n`);
  return { command, result };
}

const serverPort = 8493;
const serverStart = runRecordedCommand('overlay-server-start', [liveServerScript, '--background', `--port=${serverPort}`], appRoot);
let liveServerStarted = Number.isInteger(serverStart.result.status) && serverStart.result.status === 0;
let liveServerInfo = null;
let liveUrl = null;
try {
  liveServerInfo = JSON.parse(serverStart.result.stdout || 'null');
  if (liveServerStarted && Number.isInteger(liveServerInfo?.port)) {
    liveUrl = `http://127.0.0.1:${liveServerInfo.port}`;
  }
} catch {
  liveUrl = null;
}
writeJson('overlay-server-start.json', {
  command: serverStart.command,
  exitCode: serverStart.result.status,
  stdout: serverStart.result.stdout ?? '',
  stderr: serverStart.result.stderr ?? '',
  serverInfo: liveServerInfo,
  detectorUrl: liveUrl ? `${liveUrl}/detect.js` : null,
});

const hashesBefore = hashTargets();
writeJson('source-hashes-before-browser.json', { capturedAt: new Date().toISOString(), targets: hashesBefore });

const scenarios = [
  { id: 'datepicker-desktop-light-open-calendar', target: 'datepicker', theme: 'light', width: 1440, height: 900, mobile: false, state: 'open-calendar' },
  { id: 'datepicker-desktop-hud-open-calendar', target: 'datepicker', theme: 'hud', width: 1440, height: 900, mobile: false, state: 'open-calendar' },
  { id: 'datepicker-mobile-375-light-open-calendar', target: 'datepicker', theme: 'light', width: 375, height: 812, mobile: true, state: 'open-calendar' },
  { id: 'dynamicform-desktop-light-validation-error', target: 'dynamicform', theme: 'light', width: 1440, height: 900, mobile: false, state: 'validation-error' },
  { id: 'dynamicform-desktop-hud-validation-error', target: 'dynamicform', theme: 'hud', width: 1440, height: 900, mobile: false, state: 'validation-error' },
  { id: 'dynamicform-mobile-375-light-validation-error', target: 'dynamicform', theme: 'light', width: 375, height: 812, mobile: true, state: 'validation-error' },
  { id: 'upload-desktop-light-failure', target: 'upload', theme: 'light', width: 1440, height: 900, mobile: false, state: 'upload-failure' },
  { id: 'upload-desktop-hud-failure', target: 'upload', theme: 'hud', width: 1440, height: 900, mobile: false, state: 'upload-failure' },
  { id: 'upload-mobile-375-light-queued', target: 'upload', theme: 'light', width: 375, height: 812, mobile: true, state: 'queued-file' },
];

const summaries = [];
let browser = null;

async function enableHud(page, target) {
  const selectors = {
    datepicker: '.lx-date-picker-demo__toolbar label',
    dynamicform: '.dynamic-form-demo__toolbar label',
    upload: '.lx-upload-demo__header label',
  };
  const label = page.locator(selectors[target]).filter({ hasText: '文档站整体深色（HUD）' }).first();
  const checkbox = label.locator('input[type="checkbox"]').first();
  if (await checkbox.count()) await checkbox.check({ force: true });
  else await label.click();
  await page.waitForFunction(() => document.documentElement.classList.contains('lx-theme-hud'));
}

async function prepareState(page, scenario) {
  const roots = {
    datepicker: '.lx-date-picker-demo',
    dynamicform: '.dynamic-form-demo',
    upload: '.lx-upload-demo',
  };
  const root = page.locator(roots[scenario.target]);
  await root.waitFor({ state: 'visible', timeout: 30000 });
  await root.scrollIntoViewIfNeeded();

  if (scenario.theme === 'hud') await enableHud(page, scenario.target);

  if (scenario.state === 'open-calendar') {
    const firstRangeInput = page.locator('[data-testid="range"] input').first();
    await firstRangeInput.click({ force: true });
    await page.waitForFunction(() => Boolean(document.querySelector('.el-picker-panel')));
    await page.waitForTimeout(250);
  }

  if (scenario.state === 'validation-error') {
    await page.getByRole('button', { name: '提交校验' }).click();
    await page.waitForTimeout(450);
  }

  if (scenario.state === 'upload-failure' || scenario.state === 'queued-file') {
    if (scenario.state === 'upload-failure') {
      await page.getByRole('button', { name: '下一次上传失败' }).click();
    }
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'patrol-sample.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('id,name\n1,Patrol\n', 'utf8'),
    });
    if (scenario.state === 'upload-failure') {
      await page.getByRole('button', { name: '上传全部待传文件' }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.includes('上传失败'), { timeout: 8000 });
    } else {
      await page.waitForTimeout(350);
    }
  }

  await root.scrollIntoViewIfNeeded();
  return {
    heading: (await page.locator('h1').first().textContent().catch(() => ''))?.trim() ?? '',
    bodyTextSignals: await page.evaluate(() => document.body.innerText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /必填|请输入|校验|失败|上传中|队列|排队|已取消|暂无/.test(line))
      .slice(0, 30)),
    stateMarkers: await page.evaluate(() => ({
      themeClasses: [...document.documentElement.classList],
      datePickersOpen: document.querySelectorAll('.el-picker-panel').length,
      formErrors: document.querySelectorAll('.lx-form-item.is-error, .is-error').length,
      uploadFileRows: document.querySelectorAll('.lx-upload .el-upload-list__item, .lx-upload__file, .el-upload-list__item').length,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    })),
  };
}

async function injectOverlay(page) {
  const preflight = await page.evaluate(() => {
    const previousTitle = document.title;
    document.title = 'Impeccable Assessment B preflight';
    const testScript = document.createElement('script');
    testScript.type = 'application/json';
    testScript.dataset.assessmentPreflight = 'mutable-dom';
    document.head.appendChild(testScript);
    const mutable = document.title === 'Impeccable Assessment B preflight'
      && testScript.isConnected
      && document.head.contains(testScript);
    testScript.remove();
    document.title = previousTitle;
    return { mutable, titleRestored: document.title === previousTitle, scriptAppended: true };
  });

  let injectionError = null;
  if (liveUrl) {
    try {
      await page.addScriptTag({ url: `${liveUrl}/detect.js` });
    } catch (error) {
      injectionError = error.message;
    }
  } else {
    injectionError = 'Assessment B live-server did not start; /detect.js URL unavailable.';
  }

  let scanResult = null;
  let scanError = null;
  if (!injectionError) {
    try {
      scanResult = await page.evaluate(() => {
        const scan = window.impeccableScan;
        if (typeof scan !== 'function') return { scanFunctionAvailable: false };
        const findings = scan();
        let serializedFindings;
        try { serializedFindings = JSON.parse(JSON.stringify(findings)); }
        catch { serializedFindings = String(findings); }
        const overlayNodes = [...document.querySelectorAll('body *')]
          .filter((element) => [...element.classList].some((name) => name.startsWith('impeccable-')))
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            classes: [...element.classList],
            text: (element.innerText || element.textContent || '').trim().slice(0, 180),
            rect: (() => {
              const box = element.getBoundingClientRect();
              return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
            })(),
          }));
        return {
          scanFunctionAvailable: true,
          scanReturn: serializedFindings,
          overlayNodes,
          overlayNodeCount: overlayNodes.length,
          overlayClasses: [...new Set(overlayNodes.flatMap((node) => node.classes))],
        };
      });
      if (scanResult?.scanFunctionAvailable !== true) scanError = 'Detector script loaded but window.impeccableScan was unavailable.';
    } catch (error) {
      scanError = error.message;
    }
  }
  await page.waitForTimeout(2200);
  const injectionRequest = page.requestEvidence.find((entry) => entry.path.endsWith('/detect.js')) ?? null;
  return {
    preflight,
    scriptUrl: liveUrl ? `${liveUrl}/detect.js` : null,
    scriptLoaded: !injectionError,
    injectionError,
    scanSucceeded: scanResult?.scanFunctionAvailable === true && !scanError,
    scanError,
    scanResult,
    injectionRequest,
    consoleMessages: page.consoleEvidence.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
  };
}

async function captureScenario(scenario) {
  const contextOptions = {
    viewport: { width: scenario.width, height: scenario.height },
    deviceScaleFactor: 1,
    isMobile: scenario.mobile,
    hasTouch: scenario.mobile,
  };
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.consoleEvidence = [];
  page.pageErrors = [];
  page.requestEvidence = [];
  page.responseEvidence = [];
  page.failedRequests = [];
  page.on('console', (message) => page.consoleEvidence.push({
    type: message.type(),
    text: message.text().slice(0, 1000),
  }));
  page.on('pageerror', (error) => page.pageErrors.push(error.message));
  page.on('request', (request) => page.requestEvidence.push({
    method: request.method(),
    path: pathWithoutQuery(request.url()),
    resourceType: request.resourceType(),
  }));
  page.on('response', (response) => page.responseEvidence.push({
    status: response.status(),
    path: pathWithoutQuery(response.url()),
    resourceType: response.request().resourceType(),
  }));
  page.on('requestfailed', (request) => page.failedRequests.push({
    method: request.method(),
    path: pathWithoutQuery(request.url()),
    resourceType: request.resourceType(),
    error: request.failure()?.errorText ?? 'unknown',
  }));

  const url = `${siteRoot}/components/${scenario.target === 'datepicker' ? 'lxdatepicker' : scenario.target === 'dynamicform' ? 'lxdynamicform' : 'lxupload'}`;
  let actionError = null;
  let state = null;
  let overlay = null;
  let screenshot = null;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 30000 });
    const rootSelectors = { datepicker: '.lx-date-picker-demo', dynamicform: '.dynamic-form-demo', upload: '.lx-upload-demo' };
    await page.locator(rootSelectors[scenario.target]).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(450);
    state = await prepareState(page, scenario);
    overlay = await injectOverlay(page);
    screenshot = `screenshots-current/${scenario.id}.png`;
    await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false, animations: 'disabled' });
    const summary = {
      id: scenario.id,
      target: scenario.target,
      url,
      navigationStatus: response?.status() ?? null,
      viewport: contextOptions,
      state: scenario.state,
      theme: scenario.theme,
      stateEvidence: state,
      injection: overlay,
      screenshot,
      browserConsole: page.consoleEvidence,
      pageErrors: page.pageErrors,
      requestEvidence: page.requestEvidence,
      responseEvidence: page.responseEvidence,
      failedRequests: page.failedRequests,
      assessmentStatus: overlay?.scanSucceeded ? 'browser-overlay-captured' : 'incomplete-overlay-capture',
    };
    writeJson(`${scenario.id}.evidence.json`, summary);
    writeJson(`${scenario.id}.console-network.json`, {
      consoleSummary: {
        totalMessages: page.consoleEvidence.length,
        errors: page.consoleEvidence.filter((entry) => entry.type === 'error'),
        warnings: page.consoleEvidence.filter((entry) => entry.type === 'warning'),
        impeccableMessages: page.consoleEvidence.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
        pageErrors: page.pageErrors,
      },
      requests: page.requestEvidence,
      responses: page.responseEvidence,
      failedRequests: page.failedRequests,
    });
    writeJson(`${scenario.id}.overlay-scan.json`, {
      preflight: overlay?.preflight ?? null,
      scriptUrl: overlay?.scriptUrl ?? null,
      scriptLoaded: overlay?.scriptLoaded ?? false,
      injectionError: overlay?.injectionError ?? actionError,
      scanSucceeded: overlay?.scanSucceeded ?? false,
      scanError: overlay?.scanError ?? null,
      scanResult: overlay?.scanResult ?? null,
      injectionRequest: overlay?.injectionRequest ?? null,
      screenshot,
    });
    summaries.push({
      id: scenario.id,
      navigationStatus: response?.status() ?? null,
      theme: scenario.theme,
      viewport: `${scenario.width}x${scenario.height}`,
      state: scenario.state,
      mutableInjectionPreflight: overlay?.preflight?.mutable ?? false,
      scriptLoaded: overlay?.scriptLoaded ?? false,
      scanSucceeded: overlay?.scanSucceeded ?? false,
      overlayNodeCount: overlay?.scanResult?.overlayNodeCount ?? null,
      screenshot,
      actionError,
    });
  } catch (error) {
    actionError = error.message;
    try {
      screenshot = `screenshots-current/${scenario.id}-incomplete.png`;
      await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: false, animations: 'disabled' });
    } catch { screenshot = null; }
    const failure = {
      id: scenario.id,
      target: scenario.target,
      url,
      viewport: contextOptions,
      theme: scenario.theme,
      state: scenario.state,
      actionError,
      stateEvidence: state,
      injection: overlay,
      screenshot,
      browserConsole: page.consoleEvidence,
      pageErrors: page.pageErrors,
      requestEvidence: page.requestEvidence,
      responseEvidence: page.responseEvidence,
      failedRequests: page.failedRequests,
      assessmentStatus: 'incomplete-scenario',
    };
    writeJson(`${scenario.id}.evidence.json`, failure);
    writeJson(`${scenario.id}.console-network.json`, {
      consoleSummary: {
        totalMessages: page.consoleEvidence.length,
        errors: page.consoleEvidence.filter((entry) => entry.type === 'error'),
        warnings: page.consoleEvidence.filter((entry) => entry.type === 'warning'),
        impeccableMessages: page.consoleEvidence.filter((entry) => entry.text.toLowerCase().includes('impeccable')),
        pageErrors: page.pageErrors,
      },
      requests: page.requestEvidence,
      responses: page.responseEvidence,
      failedRequests: page.failedRequests,
    });
    writeJson(`${scenario.id}.overlay-scan.json`, {
      preflight: overlay?.preflight ?? null,
      scriptUrl: overlay?.scriptUrl ?? null,
      scriptLoaded: overlay?.scriptLoaded ?? false,
      injectionError: overlay?.injectionError ?? actionError,
      scanSucceeded: overlay?.scanSucceeded ?? false,
      scanError: overlay?.scanError ?? null,
      scanResult: overlay?.scanResult ?? null,
      injectionRequest: overlay?.injectionRequest ?? null,
      screenshot,
    });
    summaries.push({ id: scenario.id, assessmentStatus: 'incomplete-scenario', actionError, screenshot });
  } finally {
    await context.close().catch(() => {});
  }
}

try {
  if (!liveUrl) throw new Error('Assessment B live-server failed to start; no browser detector injection can be performed.');
  browser = await chromium.launch({ headless: true, executablePath: edgeExecutable });
  writeJson('playwright-runtime.json', {
    package: playwrightEntry,
    browser: 'Microsoft Edge via Playwright Chromium CDP launcher',
    version: browser.version(),
    executable: edgeExecutable,
    contextIsolation: 'A fresh browser context was created and closed for every scenario.',
  });
  for (const scenario of scenarios) await captureScenario(scenario);
} catch (error) {
  writeJson('browser-run-error.json', {
    error: error.message,
    liveServerStarted,
    liveUrl,
    serverStartExitCode: serverStart.result.status,
  });
} finally {
  if (browser) await browser.close().catch(() => {});
  if (liveServerStarted) {
    const serverStop = runRecordedCommand('overlay-server-stop', [liveServerScript, 'stop', '--keep-inject'], appRoot);
    writeJson('overlay-server-stop.json', {
      command: serverStop.command,
      exitCode: serverStop.result.status,
      stdout: serverStop.result.stdout ?? '',
      stderr: serverStop.result.stderr ?? '',
    });
  }
  const hashesAfter = hashTargets();
  writeJson('source-hashes-after-browser.json', { capturedAt: new Date().toISOString(), targets: hashesAfter });
  writeJson('browser-capture-summary.json', {
    completedAt: new Date().toISOString(),
    siteRoot,
    liveServerUrl: liveUrl,
    liveServerStarted,
    liveServerStopped: liveServerStarted && fs.existsSync(path.join(appRoot, '.impeccable', 'live', 'server.json')) === false,
    playwright: 'Microsoft Edge launched through Playwright; each scenario used a new isolated context.',
    scenarios: summaries,
    sourceIntegrity: targets.map((target) => ({
      target,
      unchangedFromBrowserStart: JSON.stringify(hashesBefore[target]) === JSON.stringify(hashesAfter[target]),
    })),
  });
}

console.log(JSON.stringify({ liveUrl, liveServerStarted, scenarios: summaries }, null, 2));
