import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const evidenceDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-08/final-assessment-b-postfix-2026-10-09/postfix-2026-10-09-run-2',
);
const screenshotsDir = path.join(evidenceDir, 'screenshots');
const skillScriptsDir = 'C:/Users/Administrator/.codex/skills/impeccable/scripts';
const detectorCli = path.join(skillScriptsDir, 'detect.mjs');
const detectorBrowser = path.join(skillScriptsDir, 'detector/detect-antipatterns-browser.js');
const liveServer = path.join(skillScriptsDir, 'live-server.mjs');
const targetFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/docs/components/lxtransferpanel.md',
];
const runId = new Date().toISOString();

fs.mkdirSync(screenshotsDir, { recursive: true });

function saveJson(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runStaticScans() {
  const results = [];

  for (const [index, target] of targetFiles.entries()) {
    const label = ['component', 'demo', 'docs'][index];
    const base = `detector-${label}`;
    const args = [detectorCli, '--json', target];
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    const stdout = result.stdout ?? '';
    const stderr = result.stderr ?? '';
    const findings = (() => {
      try {
        const value = JSON.parse(stdout);
        return Array.isArray(value) ? value : null;
      } catch {
        return null;
      }
    })();

    fs.writeFileSync(path.join(evidenceDir, `${base}.command.txt`), `node "${detectorCli}" --json "${target}"\n`, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, `${base}.stdout.json`), stdout, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, `${base}.stderr.txt`), stderr, 'utf8');
    fs.writeFileSync(path.join(evidenceDir, `${base}.exit-code.txt`), `${result.status ?? 'null'}\n`, 'utf8');
    if (result.error) fs.writeFileSync(path.join(evidenceDir, `${base}.spawn-error.txt`), `${result.error.stack ?? result.error}\n`, 'utf8');

    results.push({
      label,
      target,
      commandFile: `${base}.command.txt`,
      stdoutFile: `${base}.stdout.json`,
      stderrFile: `${base}.stderr.txt`,
      exitCodeFile: `${base}.exit-code.txt`,
      exitCode: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      stdoutJsonValid: findings !== null,
      findingCount: findings?.length ?? null,
      findings: findings?.map(({ antipattern, id, line, file, severity, advisory }) => ({
        antipattern: antipattern ?? id ?? null,
        line: line ?? null,
        file: file ?? null,
        severity: severity ?? null,
        advisory: advisory ?? false,
      })) ?? null,
    });
  }

  saveJson('detector-summary.json', { runId, targetFiles, results });
  return results;
}

function runNode(args, cwd) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function startOverlayHelper() {
  const helperRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-lx-transferpanel-assessment-b-'));
  const startedAt = new Date().toISOString();
  const result = runNode([liveServer, '--background'], helperRoot);
  if (result.status !== 0) {
    throw new Error(`live-server --background failed (${result.status}): ${result.stderr || result.stdout}`);
  }

  const responseLine = result.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  const parsed = JSON.parse(responseLine);
  return {
    helperRoot,
    startedAt,
    pid: parsed.pid,
    port: parsed.port,
    scriptUrl: `http://127.0.0.1:${parsed.port}/detect.js`,
    startupExitCode: result.status,
    startupStderr: result.stderr,
  };
}

async function stopOverlayHelper(helper) {
  if (!helper) return { attempted: false, stopped: null };

  const stoppedAt = new Date().toISOString();
  const stopResult = runNode([liveServer, 'stop', '--keep-inject'], helper.helperRoot);
  let fallbackKill = false;
  if (stopResult.status !== 0) {
    try {
      process.kill(helper.pid);
      fallbackKill = true;
    } catch {
      fallbackKill = false;
    }
  }

  let portClosed = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${helper.port}/health`, {
        signal: AbortSignal.timeout(750),
      });
      await response.arrayBuffer();
    } catch {
      portClosed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const tempRoot = path.resolve(os.tmpdir());
  const helperRoot = path.resolve(helper.helperRoot);
  const ownsTempPath = path.dirname(helperRoot) === tempRoot
    && path.basename(helperRoot).startsWith('codex-lx-transferpanel-assessment-b-');
  let tempCleanup = 'retained because helper stop was not verified';
  if (portClosed && ownsTempPath) {
    fs.rmSync(helperRoot, { recursive: true, force: true });
    tempCleanup = 'removed';
  }

  return {
    attempted: true,
    pid: helper.pid,
    port: helper.port,
    helperRoot: helper.helperRoot,
    startedAt: helper.startedAt,
    stoppedAt,
    stopCommand: `node "${liveServer}" stop --keep-inject`,
    stopExitCode: stopResult.status,
    stopStdout: stopResult.stdout,
    stopStderr: stopResult.stderr,
    fallbackKill,
    portClosed,
    tempCleanup,
  };
}

const scenarios = [
  { name: 'desktop-standard-default', viewport: { width: 1440, height: 1100 }, panelHeight: 380, shellTheme: 'light', hudTheme: 'light' },
  { name: 'desktop-compact-240', viewport: { width: 1440, height: 1100 }, panelHeight: 240, shellTheme: 'light', hudTheme: 'light' },
  { name: 'desktop-filtered', viewport: { width: 1440, height: 1100 }, panelHeight: 380, filter: '特勤', shellTheme: 'light', hudTheme: 'light' },
  { name: 'mobile-standard-default', viewport: { width: 390, height: 844 }, mobile: true, panelHeight: 380, shellTheme: 'light', hudTheme: 'light' },
  { name: 'mobile-compact-240', viewport: { width: 390, height: 844 }, mobile: true, panelHeight: 240, shellTheme: 'light', hudTheme: 'light' },
  { name: 'mobile-filtered', viewport: { width: 390, height: 844 }, mobile: true, panelHeight: 380, filter: '特勤', shellTheme: 'light', hudTheme: 'light' },
  { name: 'desktop-dark-shell', viewport: { width: 1440, height: 1100 }, panelHeight: 380, shellTheme: 'dark', hudTheme: 'light' },
  { name: 'desktop-dark-hud', viewport: { width: 1440, height: 1100 }, panelHeight: 380, shellTheme: 'light', hudTheme: 'dark' },
];

async function captureScenario(browser, helper, scenario) {
  const contextOptions = {
    viewport: scenario.viewport,
    colorScheme: 'light',
    deviceScaleFactor: 1,
  };
  if (scenario.mobile) {
    contextOptions.isMobile = true;
    contextOptions.hasTouch = true;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? error.message));
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? null }));

  const result = {
    name: scenario.name,
    url: 'http://127.0.0.1:4174/components/lxtransferpanel',
    viewport: scenario.viewport,
    mobileContext: scenario.mobile === true,
    requestedShellTheme: scenario.shellTheme,
    requestedHudTheme: scenario.hudTheme,
    requestedPanelHeight: scenario.panelHeight,
    requestedFilter: scenario.filter ?? null,
    injectionStatus: 'pending',
    consoleMessages,
    pageErrors,
    requestFailures,
    screenshot: path.relative(evidenceDir, path.join(screenshotsDir, `${scenario.name}.png`)).replaceAll('\\', '/'),
  };

  try {
    await page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.transfer-panel-demo', { timeout: 30000 });
    await page.locator('.transfer-panel-demo__settings').evaluate((element) => { element.open = true; });

    const settings = page.locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"]');
    await settings.locator('select[aria-label="面板高度"]').selectOption(String(scenario.panelHeight));
    if (scenario.hudTheme === 'dark') await settings.locator('input[type="checkbox"]').nth(1).check();
    if (scenario.filter) {
      await page.locator('.lx-transfer-panel__filter input').first().fill(scenario.filter);
      await page.waitForTimeout(350);
    }
    if (scenario.shellTheme === 'dark') {
      await page.locator('.VPSwitchAppearance:visible').first().click();
      await page.waitForTimeout(250);
    }

    await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded();
    const titleBefore = await page.evaluate(() => {
      document.title = `${document.title} [Assessment B]`;
      return document.title;
    });
    const mutablePreflight = titleBefore.includes('[Assessment B]');
    const scriptLoad = await page.evaluate((src) => new Promise((resolve) => {
      window.__IMPECCABLE_CONFIG__ = { ...(window.__IMPECCABLE_CONFIG__ || {}), autoScan: false };
      const script = document.createElement('script');
      script.dataset.assessment = 'B';
      script.src = src;
      const timeout = setTimeout(() => resolve('timeout'), 12000);
      script.onload = () => { clearTimeout(timeout); resolve('loaded'); };
      script.onerror = () => { clearTimeout(timeout); resolve('error'); };
      document.head.appendChild(script);
    }), helper.scriptUrl);
    if (scriptLoad !== 'loaded') throw new Error(`overlay script load returned ${scriptLoad}`);

    await page.waitForFunction(() => typeof window.impeccableScan === 'function', null, { timeout: 15000 });
    const scanResult = await page.evaluate(async () => {
      const resultValue = await window.impeccableScan();
      return Array.isArray(resultValue)
        ? { resultType: 'array', count: resultValue.length }
        : { resultType: typeof resultValue };
    });
    await page.waitForTimeout(2500);

    result.injectionStatus = 'loaded and scan invoked';
    result.mutablePreflight = mutablePreflight;
    result.scriptLoad = scriptLoad;
    result.scanResult = scanResult;
    result.overlayCount = await page.locator('.impeccable-overlay').count();
    result.overlayTexts = await page.locator('.impeccable-overlay').evaluateAll((elements) => elements.map((element) => element.innerText.trim()).filter(Boolean));
    result.document = await page.evaluate(() => {
      const panel = document.querySelector('.lx-transfer-panel');
      const root = document.documentElement;
      const rect = panel?.getBoundingClientRect();
      const style = panel ? getComputedStyle(panel) : null;
      const leftFilter = document.querySelector('.lx-transfer-panel__filter input');
      return {
        title: document.title,
        htmlClass: root.className,
        shellDark: root.classList.contains('dark'),
        hudDark: document.querySelector('.transfer-panel-demo__preview')?.classList.contains('lx-theme-hud') ?? false,
        panelHeightValue: document.querySelector('select[aria-label="面板高度"]')?.value ?? null,
        panelHeightPx: rect ? Math.round(rect.height) : null,
        panelWidthPx: rect ? Math.round(rect.width) : null,
        filterValue: leftFilter?.value ?? null,
        horizontalOverflow: root.scrollWidth > window.innerWidth,
        overlayScriptPresent: [...document.scripts].some((script) => script.dataset.assessment === 'B'),
      };
    });
    await page.screenshot({ path: path.join(screenshotsDir, `${scenario.name}.png`), animations: 'disabled' });
    result.completed = true;
  } catch (error) {
    result.completed = false;
    result.error = error.stack ?? error.message;
  } finally {
    result.consoleMessages = consoleMessages;
    result.pageErrors = pageErrors;
    result.requestFailures = requestFailures;
    await context.close();
  }

  return result;
}

async function main() {
  const detectorResults = runStaticScans();
  let helper = null;
  let browser = null;
  const browserResults = [];
  let helperStop = null;

  try {
    helper = await startOverlayHelper();
    const playwrightEntry = path.join(root, 'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs');
    const { chromium } = await import(pathToFileURL(playwrightEntry).href);
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });

    for (const scenario of scenarios) {
      const result = await captureScenario(browser, helper, scenario);
      browserResults.push(result);
      saveJson('browser-evidence.json', {
        runId,
        url: 'http://127.0.0.1:4174/components/lxtransferpanel',
        helper: { pid: helper.pid, port: helper.port, scriptPath: detectorBrowser },
        detectorResults,
        scenarios: browserResults,
      });
    }
  } catch (error) {
    browserResults.push({ name: 'runner', completed: false, error: error.stack ?? error.message });
  } finally {
    if (browser) await browser.close();
    helperStop = await stopOverlayHelper(helper);
    saveJson('helper-lifecycle.json', {
      runId,
      helperStarted: helper !== null,
      helper: helper ? { pid: helper.pid, port: helper.port, helperRoot: helper.helperRoot, startedAt: helper.startedAt, startupExitCode: helper.startupExitCode, startupStderr: helper.startupStderr } : null,
      stop: helperStop,
      userService: { url: 'http://127.0.0.1:4174/components/lxtransferpanel', requestedStop: false },
    });
    saveJson('browser-evidence.json', {
      runId,
      url: 'http://127.0.0.1:4174/components/lxtransferpanel',
      helper: helper ? { pid: helper.pid, port: helper.port, scriptPath: detectorBrowser } : null,
      detectorResults,
      scenarios: browserResults,
    });
  }

  const failedScenarios = browserResults.filter((result) => result.completed === false).length;
  const helperFailed = helper !== null && helperStop?.portClosed !== true;
  process.stdout.write(`${JSON.stringify({
    evidenceDir: path.relative(root, evidenceDir).replaceAll('\\', '/'),
    detectorResults: detectorResults.map(({ label, exitCode, stdoutJsonValid, findingCount }) => ({ label, exitCode, stdoutJsonValid, findingCount })),
    browserScenarioCount: browserResults.length,
    failedScenarios,
    helperStopVerified: helper !== null && helperStop?.portClosed === true,
  }, null, 2)}\n`);
  if (failedScenarios || helperFailed) process.exitCode = 1;
}

await main();
