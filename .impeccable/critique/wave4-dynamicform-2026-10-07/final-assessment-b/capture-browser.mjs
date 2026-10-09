import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evidenceDir, '../../../../');
const screenshotsDir = path.join(evidenceDir, 'screenshots');
const skillDir = 'C:/Users/Administrator/.codex/skills/impeccable/scripts';
const liveServer = path.join(skillDir, 'live-server.mjs');
const detectorScript = `http://localhost:${process.env.IMPECCABLE_OVERLAY_PORT || '0'}/detect.js`;
const routeBase = 'http://127.0.0.1:4174';
const require = createRequire(path.join(repoRoot, 'other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const targetPaths = [
  'linkx-fe/src/components/LxDynamicForm',
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/src/components/LxUpload',
  'linkx-fe/docs/components/lxupload.md',
  'linkx-fe/src/components/LxDatePicker',
  'linkx-fe/docs/components/lxdatepicker.md',
];

fs.mkdirSync(screenshotsDir, { recursive: true });

function writeText(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), value);
}

function writeJson(name, value) {
  writeText(name, `${JSON.stringify(value, null, 2)}\n`);
}

function redactServerSecret(value) {
  return String(value)
    .replace(/("token"\s*:\s*")[^"]*(")/gi, '$1[redacted]$2')
    .replace(/([?&]token=)[^\s&]+/gi, '$1[redacted]');
}

function runNode(args) {
  return spawnSync('node', args, { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
}

function parseServerPort(output) {
  const lines = String(output || '').trim().split(/\r?\n/).filter(Boolean);
  for (const line of [...lines].reverse()) {
    try {
      const parsed = JSON.parse(line);
      if (Number.isInteger(Number(parsed.port)) && Number(parsed.port) > 0) return Number(parsed.port);
    } catch {
      const match = line.match(/"port"\s*:\s*(\d+)/);
      if (match) return Number(match[1]);
    }
  }
  return null;
}

function isLoopbackUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return true;
  }
}

function sourceSnapshot() {
  function listFiles(absolute) {
    const stat = fs.statSync(absolute);
    if (stat.isFile()) return [absolute];
    return fs.readdirSync(absolute, { withFileTypes: true })
      .flatMap((entry) => {
        const child = path.join(absolute, entry.name);
        if (entry.isDirectory()) return listFiles(child);
        return entry.isFile() ? [child] : [];
      })
      .sort();
  }

  return targetPaths.map((relative) => {
    const absolute = path.join(repoRoot, relative);
    const files = listFiles(absolute).map((file) => ({
      path: path.relative(repoRoot, file).split(path.sep).join('/'),
      sha256: require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    }));
    const aggregate = require('node:crypto').createHash('sha256');
    for (const file of files) aggregate.update(`${file.path}\0${file.sha256}\n`);
    return { target: relative, fileCount: files.length, sha256: aggregate.digest('hex'), files };
  });
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function checkHealth(port) {
  try {
    const response = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(1000) });
    return { reachable: true, status: response.status };
  } catch (error) {
    return { reachable: false, error: String(error) };
  }
}

async function waitForText(locator, timeout = 8000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function setCheckbox(locator) {
  if (!(await locator.count())) return false;
  const label = locator.locator('xpath=ancestor::label[1]');
  if (await label.count()) await label.click();
  else await locator.click();
  return true;
}

async function clickChoice(locator) {
  if (!(await locator.count())) return false;
  const label = locator.locator('xpath=ancestor::label[1]');
  if (await label.count()) await label.click();
  else await locator.click();
  return true;
}

const scenarios = [
  {
    name: 'dform-desktop-light-default',
    route: '/components/lxdynamicform',
    heading: 'LxDynamicForm',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      await page.locator('.dynamic-form-demo').waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded();
      return { demoVisible: true, theme: 'light-default' };
    },
  },
  {
    name: 'dform-desktop-hud-field-failure',
    route: '/components/lxdynamicform',
    heading: 'LxDynamicForm',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      const settings = page.locator('.dynamic-form-demo__settings');
      await settings.locator('summary').click();
      const themeChanged = await setCheckbox(settings.getByRole('checkbox', { name: /文档站整体深色/ }));
      const failureRadio = settings.getByRole('radio', { name: '失败', exact: true }).first();
      let failureModeSelected = false;
      if (await failureRadio.count()) {
        failureModeSelected = await clickChoice(failureRadio);
      } else {
        const failureText = settings.getByText('失败', { exact: true }).first();
        if (await failureText.count()) {
          failureModeSelected = await clickChoice(failureText);
        }
      }
      await page.waitForTimeout(800);
      const failureFeedback = page.getByText('候选人员读取失败', { exact: false }).first();
      const failureVisible = await waitForText(failureFeedback, 4000);
      if (failureVisible) await failureFeedback.scrollIntoViewIfNeeded();
      else await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded();
      return {
        themeChanged,
        failureModeSelected,
        fieldFailureVisible: failureVisible,
        fieldFailureText: failureVisible ? await failureFeedback.innerText() : null,
      };
    },
  },
  {
    name: 'upload-desktop-light',
    route: '/components/lxupload',
    heading: 'LxUpload',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      await page.locator('.lx-upload-demo').waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('.lx-upload-demo').scrollIntoViewIfNeeded();
      return { demoVisible: true, theme: 'light-default', uploadIdle: true };
    },
  },
  {
    name: 'upload-desktop-hud',
    route: '/components/lxupload',
    heading: 'LxUpload',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      const demo = page.locator('.lx-upload-demo');
      await demo.waitFor({ state: 'visible', timeout: 15000 });
      await demo.scrollIntoViewIfNeeded();
      const themeChanged = await setCheckbox(demo.getByRole('checkbox', { name: 'HUD 深色主题' }));
      await page.waitForTimeout(250);
      return { demoVisible: true, themeChanged, theme: 'hud' };
    },
  },
  {
    name: 'upload-mobile-375x812-progress-cancel',
    route: '/components/lxupload',
    heading: 'LxUpload',
    viewport: { width: 375, height: 812 },
    mobile: true,
    async ready(page) {
      const demo = page.locator('.lx-upload-demo');
      await demo.waitFor({ state: 'visible', timeout: 15000 });
      await demo.scrollIntoViewIfNeeded();
      await setCheckbox(demo.getByRole('checkbox', { name: '选择后立即上传' }));
      const fileInput = demo.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: 'schedule.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('date,value\n2026-10-07,1\n', 'utf8'),
      });
      const cancelVisible = await waitForText(page.locator('.lx-upload__cancel'), 8000);
      const progressBar = page.locator('.lx-upload__trigger [role="progressbar"]').first();
      const progressValue = await progressBar.getAttribute('aria-valuenow').catch(() => null);
      return { autoUpload: true, cancelVisible, progressValue, fileName: 'schedule.csv' };
    },
    async afterScreenshot(page) {
      let cancelClicked = false;
      if (await page.locator('.lx-upload__cancel').isVisible().catch(() => false)) {
        await page.locator('.lx-upload__cancel').click();
        cancelClicked = true;
      }
      const cancelCount = page.getByTestId('upload-cancel-count');
      await waitForText(cancelCount, 2000);
      const countText = await cancelCount.innerText().catch(() => null);
      const lastAction = await page.getByTestId('upload-last-action').innerText().catch(() => null);
      await page.screenshot({ path: path.join(screenshotsDir, 'upload-mobile-375x812-after-cancel.png'), animations: 'disabled' });
      return { cancelClicked, cancelCount: countText, lastAction };
    },
  },
  {
    name: 'datepicker-desktop-light-open-range',
    route: '/components/lxdatepicker',
    heading: 'LxDatePicker',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      const demo = page.locator('.lx-date-picker-demo');
      await demo.waitFor({ state: 'visible', timeout: 15000 });
      await demo.scrollIntoViewIfNeeded();
      const input = demo.locator('[data-testid="range"] input.el-range-input').first();
      await input.click();
      const panelVisible = await waitForText(page.locator('.el-picker-panel').last(), 5000);
      return { panelVisible, theme: 'light', openRange: true };
    },
  },
  {
    name: 'datepicker-desktop-hud-open-range',
    route: '/components/lxdatepicker',
    heading: 'LxDatePicker',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    async ready(page) {
      const demo = page.locator('.lx-date-picker-demo');
      await demo.waitFor({ state: 'visible', timeout: 15000 });
      await demo.scrollIntoViewIfNeeded();
      const themeChanged = await setCheckbox(demo.getByRole('checkbox', { name: 'HUD 深色主题' }));
      const input = demo.locator('[data-testid="range"] input.el-range-input').first();
      await input.click();
      const panelVisible = await waitForText(page.locator('.el-picker-panel').last(), 5000);
      return { themeChanged, panelVisible, theme: 'hud', openRange: true };
    },
  },
  {
    name: 'datepicker-mobile-375x812-touch-popup',
    route: '/components/lxdatepicker',
    heading: 'LxDatePicker',
    viewport: { width: 375, height: 812 },
    mobile: true,
    async ready(page) {
      const demo = page.locator('.lx-date-picker-demo');
      await demo.waitFor({ state: 'visible', timeout: 15000 });
      await demo.scrollIntoViewIfNeeded();
      const input = demo.locator('[data-testid="range"] input.el-range-input').first();
      await input.tap();
      const panel = page.locator('.el-picker-panel').last();
      const panelVisible = await waitForText(panel, 5000);
      const geometry = await page.evaluate(() => {
        const panel = document.querySelector('.el-picker-panel');
        const trigger = document.querySelector('.lx-date-picker-demo [data-testid="range"] .el-date-editor');
        const box = (element) => element ? (() => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
        })() : null;
        const p = box(panel);
        return {
          panel: p,
          trigger: box(trigger),
          viewport: { width: innerWidth, height: innerHeight },
          panelWithinViewport: Boolean(p && p.x >= 0 && p.y >= 0 && p.right <= innerWidth && p.bottom <= innerHeight),
          panelClass: panel?.className ?? null,
          monthHeaderCount: panel?.querySelectorAll('.el-date-picker__header-label').length ?? 0,
        };
      });
      return { panelVisible, interaction: 'touch-tap', geometry };
    },
  },
];

const selectedScenarioNames = process.argv.slice(2).filter(Boolean);
const scenariosToRun = selectedScenarioNames?.length
  ? scenarios.filter((scenario) => selectedScenarioNames.includes(scenario.name))
  : scenarios;

async function preflightMutation(page) {
  return page.evaluate(() => {
    const previousTitle = document.title;
    document.title = `[Assessment B] ${previousTitle}`;
    const script = document.createElement('script');
    script.textContent = 'window.__assessmentBInlineInjection = true;';
    document.head.append(script);
    return {
      titleChanged: document.title !== previousTitle,
      scriptAppended: script.isConnected,
      inlineScriptRan: window.__assessmentBInlineInjection === true,
    };
  });
}

async function captureScenario(browser, scenario, port) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    isMobile: scenario.mobile,
    hasTouch: scenario.mobile,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const record = {
    scenario: scenario.name,
    route: `${routeBase}${scenario.route}`,
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    mobile: scenario.mobile,
    hasTouch: scenario.mobile,
    freshContextAndPage: true,
    browserName: 'Chromium (Playwright)',
    navigation: null,
    heading: null,
    preflight: null,
    interaction: null,
    overlay: null,
    screenshot: null,
    postCaptureInteraction: null,
    errors: [],
  };
  const network = { requests: [], failed: [], externalAttemptsBlocked: [], httpErrors: [] };
  const consoleMessages = [];
  const pageErrors = [];
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (!isLoopbackUrl(url)) {
      network.externalAttemptsBlocked.push({ url, resourceType: route.request().resourceType() });
      await route.abort();
      return;
    }
    await route.continue();
  });
  page.on('request', (request) => network.requests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() }));
  page.on('requestfailed', (request) => network.failed.push({ url: request.url(), failure: request.failure()?.errorText ?? null }));
  page.on('response', (response) => {
    if (response.status() >= 400) network.httpErrors.push({ url: response.url(), status: response.status() });
  });
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  const screenshotPath = path.join(screenshotsDir, `${scenario.name}.png`);
  const overlayUrl = `http://localhost:${port}/detect.js`;
  try {
    const response = await page.goto(record.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    record.navigation = { status: response?.status() ?? null, finalUrl: page.url(), title: await page.title() };
    const headingLocator = page.locator('.vp-doc h1, main h1').first();
    record.heading = await headingLocator.innerText().catch(() => null);
    if (!response || response.status() !== 200) record.errors.push(`navigation status ${response?.status() ?? 'null'}`);
    if (!record.heading?.includes(scenario.heading)) record.errors.push(`expected heading containing ${scenario.heading}`);

    record.preflight = await preflightMutation(page);
    if (!record.preflight.titleChanged || !record.preflight.scriptAppended || !record.preflight.inlineScriptRan) {
      record.errors.push('mutable script injection preflight failed');
    }
    record.interaction = await scenario.ready(page);
    record.pageTheme = await page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      scrollY: window.scrollY,
    }));

    const injectionAttempts = [];
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await page.addScriptTag({ url: overlayUrl, timeout: 15000 });
        injectionAttempts.push({ attempt, loaded: true, error: null });
        break;
      } catch (error) {
        injectionAttempts.push({ attempt, loaded: false, error: String(error) });
        if (attempt === 1) await page.waitForTimeout(1000);
      }
    }
    await page.waitForTimeout(2600);
    const scan = await page.evaluate(async () => {
      if (typeof window.impeccableScanAsync !== 'function') return null;
      const groups = await window.impeccableScanAsync();
      return groups.map(({ el, findings }) => {
        const rect = el?.getBoundingClientRect?.();
        return {
          element: el ? {
            tagName: el.tagName?.toLowerCase() ?? null,
            id: el.id || null,
            className: typeof el.className === 'string' ? el.className : null,
            text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
            rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
          } : null,
          findings: (findings || []).map((finding) => ({
            type: finding.type || finding.id,
            detail: finding.detail || finding.snippet || '',
          })),
        };
      });
    }).catch((error) => ({ evaluationError: String(error) }));
    const overlayDom = await page.evaluate(() => Array.from(document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip'))
      .map((element) => ({
        className: typeof element.className === 'string' ? element.className : element.tagName.toLowerCase(),
        text: (element.innerText || element.textContent || '').trim().slice(0, 500),
      })));
    const globalKeys = await page.evaluate(() => Object.keys(window).filter((key) => /impeccable/i.test(key)).sort());
    const scanIsStructured = Array.isArray(scan);
    const overlayScriptLoaded = injectionAttempts.some((attempt) => attempt.loaded)
      && await page.locator(`script[src="${overlayUrl}"]`).count() > 0;
    record.overlay = {
      url: overlayUrl,
      injectionAttempts,
      scriptLoaded: overlayScriptLoaded,
      scanFunctionAvailable: globalKeys.includes('impeccableScanAsync'),
      scanReturnedArray: scanIsStructured,
      findingGroupCount: scanIsStructured ? scan.length : null,
      findingCount: scanIsStructured ? scan.reduce((total, group) => total + (group.findings?.length ?? 0), 0) : null,
      scan,
      globalKeys,
      overlayDom,
      consoleMessages: consoleMessages.filter((message) => /impeccable/i.test(message.text)),
      ran: overlayScriptLoaded && scanIsStructured,
    };
    if (!record.overlay.ran) record.errors.push('official overlay did not produce a structured in-page scan');
    writeJson(`${scenario.name}.overlay-scan.json`, {
      scriptUrl: overlayUrl,
      injectionAttempts,
      scanFunctionAvailable: record.overlay.scanFunctionAvailable,
      scanReturnedArray: scanIsStructured,
      findingGroupCount: record.overlay.findingGroupCount,
      findingCount: record.overlay.findingCount,
      findings: scan,
      overlayDom,
      impeccableConsoleMessages: record.overlay.consoleMessages,
    });

    const screenshotBuffer = await page.screenshot({ path: screenshotPath, animations: 'disabled', fullPage: false });
    const dimensions = pngDimensions(screenshotBuffer);
    record.screenshot = {
      path: path.relative(evidenceDir, screenshotPath).split(path.sep).join('/'),
      dimensions,
      matchesViewport: dimensions?.width === scenario.viewport.width && dimensions?.height === scenario.viewport.height,
      overlayIncluded: record.overlay.ran,
      unmodifiedPng: true,
    };
    if (!record.screenshot.matchesViewport) record.errors.push('screenshot pixel size does not match viewport');

    if (scenario.afterScreenshot) record.postCaptureInteraction = await scenario.afterScreenshot(page);
  } catch (error) {
    record.errors.push(String(error));
    if (!fs.existsSync(screenshotPath)) {
      try {
        const screenshotBuffer = await page.screenshot({ path: screenshotPath, animations: 'disabled', fullPage: false });
        const dimensions = pngDimensions(screenshotBuffer);
        record.screenshot = {
          path: path.relative(evidenceDir, screenshotPath).split(path.sep).join('/'),
          dimensions,
          matchesViewport: dimensions?.width === scenario.viewport.width && dimensions?.height === scenario.viewport.height,
          overlayIncluded: false,
          unmodifiedPng: true,
        };
      } catch (screenshotError) {
        record.screenshot = { error: String(screenshotError) };
      }
    }
  } finally {
    network.consoleErrors = consoleMessages.filter((message) => message.type === 'error');
    network.impeccableMessages = consoleMessages.filter((message) => /impeccable/i.test(message.text));
    network.pageErrors = pageErrors;
    network.noExternalRequests = network.externalAttemptsBlocked.length === 0;
    network.noHttpErrors = network.httpErrors.length === 0;
    network.noPageErrors = pageErrors.length === 0;
    record.browserNetwork = {
      localRequestCount: network.requests.length,
      failedCount: network.failed.length,
      externalAttemptCount: network.externalAttemptsBlocked.length,
      httpErrorCount: network.httpErrors.length,
      pageErrorCount: pageErrors.length,
      noExternalRequests: network.noExternalRequests,
      noHttpErrors: network.noHttpErrors,
      noPageErrors: network.noPageErrors,
    };
    writeJson(`${scenario.name}.console-network.json`, { network, consoleMessages, pageErrors });
    writeJson(`${scenario.name}.browser.json`, record);
    await context.close().catch(() => {});
  }
  return record;
}

const lifecycle = {
  startMethod: `node "${liveServer}" --background`,
  stopMethod: `node "${liveServer}" stop --keep-inject`,
  startAttempts: [],
  port: null,
  portHealthBeforeStop: null,
  stopExitCode: null,
  portHealthAfterStop: null,
  stopped: false,
};

const baselineSources = sourceSnapshot();
writeJson('browser-source-hashes-before.json', baselineSources);

let port = null;
for (let attempt = 1; attempt <= 2; attempt += 1) {
  const command = [liveServer, '--background'];
  const result = runNode(command);
  const attemptRecord = {
    attempt,
    command: `node "${liveServer}" --background`,
    exitCode: result.status,
    spawnError: result.error?.message ?? null,
    port: parseServerPort(result.stdout),
    stdout: redactServerSecret(result.stdout),
    stderr: redactServerSecret(result.stderr),
  };
  lifecycle.startAttempts.push(attemptRecord);
  writeText(`overlay-server-start-attempt-${attempt}.command.txt`, `${attemptRecord.command}\n`);
  writeText(`overlay-server-start-attempt-${attempt}.stdout.txt`, attemptRecord.stdout);
  writeText(`overlay-server-start-attempt-${attempt}.stderr.txt`, attemptRecord.stderr);
  writeText(`overlay-server-start-attempt-${attempt}.exit-code.txt`, `${result.status ?? 'null'}\n`);
  if (result.status === 0 && attemptRecord.port) {
    port = attemptRecord.port;
    lifecycle.port = port;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

let browser = null;
const scenarioResults = [];
try {
  if (!port) {
    writeJson('browser-runner-failure.json', {
      failure: 'overlay server did not start after two attempts',
      startAttempts: lifecycle.startAttempts,
      browserAutomation: 'not run because official overlay server was unavailable',
    });
  } else {
    lifecycle.portHealthBeforeStop = await checkHealth(port);
    const healthResponse = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(3000) });
    writeJson('overlay-server-health-before.json', { status: healthResponse.status, body: await healthResponse.text() });
    const scriptResponse = await fetch(`http://localhost:${port}/detect.js`, { signal: AbortSignal.timeout(5000) });
    const overlaySource = await scriptResponse.text();
    writeJson('overlay-script-preflight.json', {
      url: `http://localhost:${port}/detect.js`,
      status: scriptResponse.status,
      contentType: scriptResponse.headers.get('content-type'),
      byteLength: Buffer.byteLength(overlaySource),
      sha256: require('node:crypto').createHash('sha256').update(overlaySource).digest('hex'),
      exposesStructuredScan: overlaySource.includes('window.impeccableScanAsync = scanAsync'),
    });
    if (scriptResponse.status !== 200 || !overlaySource.includes('window.impeccableScanAsync = scanAsync')) {
      throw new Error('official detect.js preflight failed');
    }
    const executablePath = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe';
    browser = await chromium.launch({ headless: true, executablePath });
    writeJson('playwright-runtime.json', {
      package: require.resolve('@playwright/test'),
      browserVersion: browser.version(),
      executablePath,
      launchMethod: 'Playwright Chromium API with the installed Playwright headless-shell executablePath; default Chromium 1208 was unavailable during installation.',
      headless: true,
    });
    for (const scenario of scenariosToRun) scenarioResults.push(await captureScenario(browser, scenario, port));
  }
} catch (error) {
  writeJson('browser-runner-failure.json', {
    failure: String(error),
    startAttempts: lifecycle.startAttempts,
    completedScenarios: scenarioResults.map((result) => result.scenario),
  });
} finally {
  if (browser) await browser.close().catch(() => {});
  if (port) {
    lifecycle.portHealthBeforeStop = lifecycle.portHealthBeforeStop ?? await checkHealth(port);
    const stop = runNode([liveServer, 'stop', '--keep-inject']);
    lifecycle.stopExitCode = stop.status;
    lifecycle.stopStdout = redactServerSecret(stop.stdout);
    lifecycle.stopStderr = redactServerSecret(stop.stderr);
    writeText('overlay-server-stop.command.txt', `${lifecycle.stopMethod}\n`);
    writeText('overlay-server-stop.stdout.txt', lifecycle.stopStdout);
    writeText('overlay-server-stop.stderr.txt', lifecycle.stopStderr);
    writeText('overlay-server-stop.exit-code.txt', `${stop.status ?? 'null'}\n`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    lifecycle.portHealthAfterStop = await checkHealth(port);
    lifecycle.stopped = stop.status === 0 && !lifecycle.portHealthAfterStop.reachable;
  }
  const finalSources = sourceSnapshot();
  writeJson('browser-source-hashes-after.json', finalSources);
  const changedTargets = baselineSources.filter((before, index) => before.sha256 !== finalSources[index].sha256)
    .map((before) => ({ target: before.target, before: before.sha256, after: finalSources.find((item) => item.target === before.target)?.sha256 ?? null }));
  writeJson('browser-source-integrity.json', {
    unchanged: changedTargets.length === 0,
    changedTargets,
    targetCount: targetPaths.length,
  });
  writeJson('browser-scenario-summary.json', scenarioResults.map((result) => ({
    scenario: result.scenario,
    navigationStatus: result.navigation?.status ?? null,
    heading: result.heading,
    overlayRan: result.overlay?.ran ?? false,
    findingCount: result.overlay?.findingCount ?? null,
    screenshot: result.screenshot ?? null,
    externalAttemptCount: result.browserNetwork?.externalAttemptCount ?? null,
    consoleErrorCount: result.browserNetwork?.consoleErrors?.length ?? null,
    pageErrorCount: result.browserNetwork?.pageErrorCount ?? null,
    interaction: result.interaction ?? null,
    postCaptureInteraction: result.postCaptureInteraction ?? null,
    errors: result.errors,
  })));
  writeJson('overlay-server-lifecycle.json', lifecycle);
}

process.stdout.write(`${JSON.stringify({ lifecycle, scenarios: scenarioResults.map((result) => ({ scenario: result.scenario, overlayRan: result.overlay?.ran ?? false, errors: result.errors })) }, null, 2)}\n`);
