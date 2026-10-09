import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(outDir, 'screenshots');
const playwrightEntry = path.join(root, 'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const liveServerInfoPath = path.join(root, '.impeccable/live/server.json');
const sourceFiles = [
  ...walkFiles('linkx-fe/src/components/LxDynamicForm', /\.(?:vue|md|html|tsx|jsx)$/i),
  ...walkFiles('linkx-fe/src/components/LxUpload', /\.(?:vue|md|html|tsx|jsx)$/i),
  'linkx-fe/src/components/LxUpload/uid.ts',
  'linkx-fe/docs/components/lxdynamicform.md',
  'linkx-fe/docs/components/lxupload.md',
].sort();
const targets = [
  { key: 'dynamicform', label: 'LxDynamicForm', url: 'http://127.0.0.1:4174/components/lxdynamicform.html', selector: '.dynamic-form-demo' },
  { key: 'upload', label: 'LxUpload', url: 'http://127.0.0.1:4174/components/lxupload.html', selector: '.lx-upload-demo' },
];
const evidence = {
  capturedAt: new Date().toISOString(),
  scope: 'linkx-fe LxDynamicForm and LxUpload docs demos and component markup',
  browserMethod: 'Playwright 1.58.0 over CDP to an isolated headed Chrome process',
  browserAutomationFallback: 'No native browser automation/evaluate tool is exposed in this session.',
  browserContext: null,
  targetResults: [],
  liveServer: { startedByAssessment: false, start: null, stop: null },
  console: [],
  pageErrors: [],
  failedRequests: [],
  requests: [],
  stateErrors: [],
  errors: [],
  screenshots: [],
  networkBoundary: {
    uploadMock: 'The upload demo uses its in-memory httpRequest adapter. The local failure state is exercised without sending upload data to a backend.',
    observedRemoteRequests: [],
  },
};

const { chromium } = await import(pathToFileURL(playwrightEntry).href);
let browser;
let context;
let serverInfo;
let chromePid;
let sourceHashesBefore;

function walkFiles(entry, pattern) {
  const absolute = path.join(root, entry);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return pattern.test(entry) ? [entry] : [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((item) => {
    const child = path.join(entry, item.name);
    return item.isDirectory() ? walkFiles(child, pattern) : pattern.test(item.name) ? [child] : [];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
}

function persist() {
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
}

function saveText(name, value) {
  fs.writeFileSync(path.join(outDir, name), value);
}

function quote(value) {
  return '"' + String(value).replaceAll('"', '\\"') + '"';
}

function commandText(args) {
  return 'node ' + args.map(quote).join(' ') + '\n';
}

function runNode(args) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForCdp(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/json/version');
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Chrome DevTools endpoint did not open on port ' + port + '.');
}

function recordPageEvents(page) {
  page.assessmentTargetKey = 'unassigned';
  page.on('console', (message) => evidence.console.push({ target: page.assessmentTargetKey, type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => evidence.pageErrors.push({ target: page.assessmentTargetKey, message: error.message }));
  page.on('request', (request) => {
    const url = new URL(request.url());
    evidence.requests.push({
      target: page.assessmentTargetKey,
      url: url.origin + url.pathname + (url.search ? '?[REDACTED]' : ''),
      method: request.method(),
    });
  });
  page.on('requestfailed', (request) => evidence.failedRequests.push({
    target: page.assessmentTargetKey,
    url: request.url(),
    method: request.method(),
    error: request.failure()?.errorText ?? null,
  }));
}

async function findPreflight(page, target) {
  const result = await page.evaluate((label) => {
    document.title = '[Human] ' + label + ' Assessment B';
    const script = document.createElement('script');
    script.dataset.assessmentBPreflight = 'true';
    script.textContent = 'window.__assessmentBPreflight = true;';
    document.head.appendChild(script);
    return {
      title: document.title,
      scriptConnected: script.isConnected,
      marker: window.__assessmentBPreflight === true,
      scriptTag: script.tagName,
    };
  }, target.label);
  evidence.targetResults.find((item) => item.key === target.key).preflight = result;
  persist();
  return result;
}

function startLiveServer() {
  if (fs.existsSync(liveServerInfoPath)) {
    throw new Error('An Impeccable server record exists before Assessment B startup; refusing to replace it.');
  }
  const args = [liveServerPath, '--background'];
  const result = runNode(args);
  const raw = (result.stdout ?? '').trim();
  let info = null;
  try {
    info = JSON.parse(raw.split(/\r?\n/).filter(Boolean).at(-1) ?? 'null');
  } catch {}
  const exitCode = result.status ?? (result.error ? 1 : 0);
  const stderr = (result.stderr ?? '') + (result.error ? result.error.message + '\n' : '');
  const safeInfo = info ? { pid: info.pid, port: info.port, token: '[REDACTED]' } : null;
  saveText('server/start.command.txt', commandText(args));
  saveText('server/start.stdout.json', JSON.stringify(safeInfo ?? { rawOutput: raw }, null, 2) + '\n');
  saveText('server/start.stderr.txt', stderr);
  saveText('server/start.exit-code.txt', String(exitCode) + '\n');
  evidence.liveServer.start = { command: commandText(args), exitCode, stdout: safeInfo, stderr };
  if (!info || !Number.isInteger(info.pid) || !Number.isInteger(info.port) || exitCode !== 0) {
    throw new Error('Impeccable live server startup failed with exit code ' + exitCode + '.');
  }
  serverInfo = info;
  evidence.liveServer.startedByAssessment = true;
  persist();
}

function stopLiveServer() {
  if (!serverInfo) return;
  let currentInfo = null;
  try {
    currentInfo = JSON.parse(fs.readFileSync(liveServerInfoPath, 'utf8'));
  } catch {}
  if (currentInfo?.pid !== serverInfo.pid || currentInfo?.port !== serverInfo.port) {
    const reason = 'Stop skipped because the live server record no longer matches this assessment process.';
    saveText('server/stop.command.txt', 'not-run\n');
    saveText('server/stop.stdout.txt', '');
    saveText('server/stop.stderr.txt', reason + '\n');
    saveText('server/stop.exit-code.txt', 'not-run\n');
    evidence.liveServer.stop = { skipped: true, reason };
    persist();
    return;
  }
  const args = [liveServerPath, 'stop', '--keep-inject'];
  const result = runNode(args);
  const exitCode = result.status ?? (result.error ? 1 : 0);
  const stderr = (result.stderr ?? '') + (result.error ? result.error.message + '\n' : '');
  saveText('server/stop.command.txt', commandText(args));
  saveText('server/stop.stdout.txt', result.stdout ?? '');
  saveText('server/stop.stderr.txt', stderr);
  saveText('server/stop.exit-code.txt', String(exitCode) + '\n');
  evidence.liveServer.stop = {
    command: commandText(args),
    exitCode,
    stdout: result.stdout ?? '',
    stderr,
    serverPidMatched: currentInfo.pid === serverInfo.pid,
  };
  persist();
}

async function injectDetector(page, target) {
  if (!serverInfo) throw new Error('Overlay injection skipped because the assessment did not start its live server.');
  const source = 'http://127.0.0.1:' + serverInfo.port + '/detect.js';
  await page.addScriptTag({ url: source });
  await page.waitForTimeout(2700);
  const result = await page.evaluate((url) => ({
    title: document.title,
    source: url,
    scriptConnected: [...document.scripts].some((node) => node.src === url),
    scanAvailable: typeof window.impeccableScanAsync === 'function',
    detectAvailable: typeof window.impeccableDetectAsync === 'function',
    preflightMarker: window.__assessmentBPreflight === true,
  }), source);
  const targetResult = evidence.targetResults.find((item) => item.key === target.key);
  targetResult.injection = {
    succeeded: result.scriptConnected && result.scanAvailable && result.detectAvailable,
    ...result,
  };
  persist();
}

async function scanPage(page) {
  return page.evaluate(async () => {
    if (typeof window.impeccableScanAsync !== 'function') return { available: false, groups: [], overlays: [] };
    const groups = await window.impeccableScanAsync();
    const ownerSelector = '.dynamic-form-demo, .lx-upload-demo';
    const shellSelector = 'header, nav, aside, footer, .VPNav, .VPSidebar, .VPLocalNav, .VPDocAside, .VPDocAsideOutline, [class*="VPNav"], [class*="VPSidebar"], [class*="LocalNav"], [class*="DocAside"]';
    const mapped = groups.map(({ el, findings }) => {
      const owner = el.closest(ownerSelector);
      const shell = el.closest(shellSelector);
      const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
      const selector = el.id ? '#' + el.id : (el.tagName?.toLowerCase() ?? 'unknown') + classes.slice(0, 3).map((name) => '.' + name).join('');
      return {
        selector,
        tagName: el.tagName?.toLowerCase() ?? 'unknown',
        id: el.id || null,
        classes,
        text: (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().slice(0, 180),
        componentOwner: owner ? owner.className : null,
        docsShellAncestor: shell ? shell.tagName.toLowerCase() + (shell.className ? '.' + String(shell.className).trim().split(/\s+/).join('.') : '') : null,
        rect: el.getBoundingClientRect?.().toJSON?.() ?? null,
        findings: findings.map((finding) => ({
          type: finding.type ?? finding.id ?? 'unknown',
          name: finding.name ?? finding.type ?? finding.id ?? 'unknown',
          severity: finding.severity ?? null,
          detail: finding.detail ?? finding.snippet ?? '',
        })),
      };
    });
    const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((node) => {
      const style = getComputedStyle(node);
      return {
        className: node.className,
        text: (node.innerText || node.textContent || '').trim().slice(0, 160),
        visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0,
        rect: node.getBoundingClientRect().toJSON(),
      };
    });
    return {
      available: true,
      groupCount: mapped.length,
      findingCount: mapped.reduce((sum, group) => sum + group.findings.length, 0),
      groups: mapped,
      overlayCount: overlays.length,
      visibleOverlayCount: overlays.filter((item) => item.visible).length,
      overlays,
    };
  });
}

async function pageSnapshot(page, target) {
  return page.evaluate((rootSelector) => {
    const root = document.querySelector(rootSelector);
    const style = root ? getComputedStyle(root) : null;
    const tokenNames = ['--lx-color-primary', '--lx-text-primary', '--lx-text-secondary', '--lx-border-light', '--lx-bg-card', '--lx-space-sm'];
    const checkboxes = [...document.querySelectorAll(rootSelector + ' input[type="checkbox"]')].map((input) => ({
      label: input.closest('label')?.innerText.trim() ?? '',
      checked: input.checked,
      disabled: input.disabled,
    }));
    const buttons = [...document.querySelectorAll(rootSelector + ' button')].map((button) => ({
      text: (button.innerText || button.textContent || '').trim().slice(0, 80),
      disabled: button.disabled,
      rect: button.getBoundingClientRect().toJSON(),
    })).filter((item) => item.text);
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
      documentThemeClasses: [...document.documentElement.classList],
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      mediaQueries: {
        hoverNone: matchMedia('(hover: none)').matches,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        pointerFine: matchMedia('(pointer: fine)').matches,
      },
      rootPresent: Boolean(root),
      rootTextExcerpt: root ? root.innerText.trim().slice(0, 520) : '',
      rootTokens: style ? Object.fromEntries(tokenNames.map((name) => [name, style.getPropertyValue(name).trim()])) : null,
      checkboxes,
      buttons,
      pageTextExcerpt: document.body.innerText.trim().slice(0, 700),
    };
  }, target.selector);
}

async function capture(page, target, label, file, options = {}) {
  const record = {
    target: target.key,
    label,
    screenshot: 'screenshots/' + file,
    screenshotSaved: false,
    scan: null,
    page: null,
  };
  try {
    await page.evaluate(({ label: title, resetScroll }) => {
      document.title = '[Human] ' + title;
      if (resetScroll) window.scrollTo(0, 0);
    }, { label: target.label + ' | ' + label, resetScroll: options.resetScroll !== false });
    record.scan = await scanPage(page);
  } catch (error) {
    record.scanError = error instanceof Error ? error.message : String(error);
  }
  try {
    record.page = await pageSnapshot(page, target);
    await page.screenshot({
      path: path.join(screenshotDir, file),
      fullPage: options.fullPage ?? false,
      animations: 'disabled',
    });
    record.screenshotSaved = true;
  } catch (error) {
    record.screenshotError = error instanceof Error ? error.message : String(error);
  }
  evidence.screenshots.push(record);
  persist();
  return record;
}

async function openDemo(page, target) {
  const root = page.locator(target.selector).first();
  if (!(await root.count())) throw new Error('Demo root missing: ' + target.selector);
  await root.scrollIntoViewIfNeeded();
}

async function findVisibleText(page, container, text) {
  const item = page.locator(container).getByText(text, { exact: true }).first();
  if (!(await item.count())) throw new Error('Visible label not found: ' + text);
  await item.click();
}

async function clickLabeledToggle(page, container, text) {
  const labels = page.locator(container + ' label');
  const count = await labels.count();
  for (let index = 0; index < count; index += 1) {
    const label = labels.nth(index);
    if ((await label.innerText().catch(() => '')).includes(text)) {
      await label.click();
      return;
    }
  }
  await findVisibleText(page, container, text);
}

async function setTouchViewport(page, width, height) {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await page.waitForTimeout(120);
  return session;
}

async function clearTouchViewport(page, session) {
  try { await session.send('Emulation.setTouchEmulationEnabled', { enabled: false }); } catch {}
  try { await session.send('Emulation.clearDeviceMetricsOverride'); } catch {}
  try { await session.detach(); } catch {}
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.waitForTimeout(100);
}

async function prepareTarget(page, target, first) {
  page.assessmentTargetKey = target.key;
  const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(900);
  const result = {
    key: target.key,
    label: target.label,
    url: target.url,
    httpStatus: response?.status() ?? null,
    title: await page.title(),
    screenshots: [],
  };
  evidence.targetResults.push(result);
  const preflight = await findPreflight(page, target);
  if (first && preflight.scriptConnected && preflight.marker) startLiveServer();
  if (!first) {
    const secondPreflight = await findPreflight(page, target);
    if (!secondPreflight.scriptConnected || !secondPreflight.marker) {
      throw new Error('Mutable script injection preflight failed on ' + target.key + '.');
    }
  }
  await injectDetector(page, target);
  result.initialOverlayScan = await scanPage(page);
  persist();
  return page;
}

async function captureDynamicForm(page, target) {
  await page.setViewportSize({ width: 1440, height: 950 });
  await openDemo(page, target);
  await capture(page, target, 'desktop-light', 'dynamicform-desktop-light.png');

  const touch = await setTouchViewport(page, 375, 812);
  await openDemo(page, target);
  await capture(page, target, 'mobile-375-touch-light', 'dynamicform-mobile-375-touch-light.png');
  await clearTouchViewport(page, touch);

  const settings = page.locator('.dynamic-form-demo__settings').first();
  if (!(await settings.evaluate((node) => node.open))) await settings.locator('summary').click();
  await clickLabeledToggle(page, '.dynamic-form-demo__settings', '文档站整体深色');
  await page.waitForFunction(() => document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud'), null, { timeout: 6000 });
  await openDemo(page, target);
  await capture(page, target, 'desktop-hud-dark', 'dynamicform-desktop-hud-dark.png');
  await clickLabeledToggle(page, '.dynamic-form-demo__settings', '文档站整体深色');
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('lx-theme-hud'), null, { timeout: 6000 });

  await clickLabeledToggle(page, '.dynamic-form-demo__settings', '禁用表单');
  await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded();
  await capture(page, target, 'disabled-form', 'dynamicform-disabled.png');
  await clickLabeledToggle(page, '.dynamic-form-demo__settings', '禁用表单');

  const submit = page.getByRole('button', { name: '提交校验', exact: true }).first();
  await submit.click();
  await page.waitForTimeout(150);
  const validationText = await page.locator('.dynamic-form-demo__footer').innerText().catch(() => '');
  const validationCapture = await capture(page, target, 'validation-error', 'dynamicform-validation-error.png');
  validationCapture.validationText = validationText;

  await findVisibleText(page, '.dynamic-form-demo__candidate-controls', '空结果');
  await page.waitForTimeout(360);
  const emptyStatus = await page.locator('[data-testid="candidate-request-status"]').innerText().catch(() => '');
  const emptyCapture = await capture(page, target, 'candidate-empty-result', 'dynamicform-candidate-empty.png');
  emptyCapture.candidateStatus = emptyStatus;
  await findVisibleText(page, '.dynamic-form-demo__candidate-controls', '失败');
  await page.waitForTimeout(500);
  const candidateStatus = await page.locator('[data-testid="candidate-request-status"]').innerText().catch(() => '');
  const candidateCapture = await capture(page, target, 'candidate-request-error', 'dynamicform-candidate-error.png');
  candidateCapture.candidateStatus = candidateStatus;

  const schemaLink = page.locator('.dynamic-form-demo__schema-link').first();
  if (await schemaLink.count()) await schemaLink.click();
  const preview = page.locator('.dynamic-form-demo__schema-preview').first();
  if (!(await preview.evaluate((node) => node.open).catch(() => false))) await preview.locator('summary').click();
  const selector = page.locator('#dynamic-form-schema-type');
  if (await selector.evaluate((node) => node.tagName.toLowerCase()).catch(() => '') === 'select') {
    await selector.selectOption('remote-select');
  } else {
    const select = preview.locator('.el-select, .lx-select').first();
    await select.click();
    await page.getByRole('option', { name: '远程选择', exact: true }).click();
  }
  await page.waitForTimeout(350);
  const previewError = preview.locator('.dynamic-form-demo__preview-candidates').getByRole('button', { name: '失败', exact: true }).first();
  if (await previewError.count()) {
    await previewError.click();
    await page.waitForTimeout(420);
    const previewMessage = await preview.locator('.dynamic-form-demo__field-message, [role="alert"]').allInnerTexts().catch(() => []);
    const previewCapture = await capture(page, target, 'remote-preview-error', 'dynamicform-remote-preview-error.png', { resetScroll: false });
    previewCapture.errorMessages = previewMessage;
  } else {
    evidence.stateErrors.push({ target: target.key, state: 'remote-preview-error', reason: 'Preview failure control was not found after selecting remote-select.' });
  }
}

async function captureUpload(page, target) {
  await page.setViewportSize({ width: 1440, height: 950 });
  await openDemo(page, target);
  await capture(page, target, 'desktop-light', 'upload-desktop-light.png');

  const touch = await setTouchViewport(page, 375, 812);
  await openDemo(page, target);
  await capture(page, target, 'mobile-375-touch-light', 'upload-mobile-375-touch-light.png');
  await clearTouchViewport(page, touch);

  await clickLabeledToggle(page, '.lx-upload-demo__header', 'HUD 深色主题');
  await page.waitForFunction(() => document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('lx-theme-hud'), null, { timeout: 6000 });
  await openDemo(page, target);
  await capture(page, target, 'desktop-hud-dark', 'upload-desktop-hud-dark.png');
  await clickLabeledToggle(page, '.lx-upload-demo__header', 'HUD 深色主题');
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('lx-theme-hud'), null, { timeout: 6000 });

  await clickLabeledToggle(page, '.lx-upload-demo__toolbar', '禁用上传');
  await capture(page, target, 'disabled-upload', 'upload-disabled.png');
  const disabledState = await pageSnapshot(page, target);
  await clickLabeledToggle(page, '.lx-upload-demo__toolbar', '禁用上传');

  await page.getByRole('button', { name: '下一次上传失败', exact: true }).click();
  const fileInput = page.locator('.lx-upload-demo input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'assessment-b-sample.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('id,name\n1,Example\n', 'utf8'),
  });
  await page.getByRole('button', { name: '开始上传', exact: true }).click();
  let mockErrorObserved = false;
  try {
    await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.includes('上传失败'), null, { timeout: 10000 });
    mockErrorObserved = true;
  } catch {}
  const lastAction = await page.locator('[data-testid="upload-last-action"]').innerText().catch(() => '');
  const errorCapture = await capture(page, target, 'mock-upload-failure', 'upload-mock-failure.png');
  errorCapture.mockErrorObserved = mockErrorObserved;
  errorCapture.lastAction = lastAction;
  errorCapture.disabledState = {
    disabledButtons: disabledState.buttons.filter((button) => button.disabled).map((button) => button.text),
    checkboxes: disabledState.checkboxes,
  };
}

async function main() {
  if (!fs.existsSync(playwrightEntry)) throw new Error('Playwright entrypoint missing: ' + playwrightEntry);
  if (!fs.existsSync(chromePath)) throw new Error('Chrome executable missing: ' + chromePath);
  sourceHashesBefore = Object.fromEntries(sourceFiles.map((file) => [file.replaceAll(path.sep, '/'), sha256(file)]));
  fs.writeFileSync(path.join(outDir, 'source-hashes-before-browser.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    fileCount: sourceFiles.length,
    files: sourceHashesBefore,
  }, null, 2) + '\n');

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-wave4-dynamicform-b-'));
  const debugPort = await findFreePort();
  const chromeArgs = [
    '--remote-debugging-port=' + debugPort,
    '--remote-allow-origins=*',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-extensions',
    'about:blank',
  ];
  const chromeProcess = spawn(chromePath, chromeArgs, { detached: true, stdio: 'ignore', windowsHide: false });
  chromePid = chromeProcess.pid;
  chromeProcess.unref();
  const cdpVersion = await waitForCdp(debugPort);
  browser = await chromium.connectOverCDP('http://127.0.0.1:' + debugPort);
  context = browser.contexts()[0];
  const page = context.pages().find((item) => item.url() === 'about:blank');
  if (!page) throw new Error('Chrome did not provide an initial blank assessment tab.');
  recordPageEvents(page);
  evidence.browserContext = {
    chromePid,
    chromeVersion: cdpVersion.Browser,
    remoteDebuggingPort: debugPort,
    profileDir,
    isolatedProfile: true,
    headed: true,
    freshPages: true,
    nativeBrowserAutomationAvailable: false,
  };
  persist();

  const dynamicForm = await prepareTarget(page, targets[0], true);
  await captureDynamicForm(dynamicForm, targets[0]);
  const upload = await prepareTarget(dynamicForm, targets[1], false);
  await captureUpload(upload, targets[1]);

  evidence.networkBoundary.observedRemoteRequests = [...new Set(evidence.requests
    .map((item) => item.url)
    .filter((url) => !url.startsWith('http://127.0.0.1:4174/') && !url.startsWith('http://127.0.0.1:4176/') && !url.startsWith('http://127.0.0.1:' + serverInfo?.port + '/')))];
}

try {
  await main();
} catch (error) {
  evidence.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (sourceHashesBefore) {
    try {
      const afterHashes = Object.fromEntries(sourceFiles.map((file) => [file.replaceAll(path.sep, '/'), sha256(file)]));
      const changedDuringCapture = Object.entries(afterHashes)
        .filter(([file, hash]) => sourceHashesBefore[file] !== hash)
        .map(([file]) => file);
      fs.writeFileSync(path.join(outDir, 'source-hashes-after-browser.json'), JSON.stringify({
        capturedAt: new Date().toISOString(),
        fileCount: sourceFiles.length,
        files: afterHashes,
        changedDuringCapture,
      }, null, 2) + '\n');
      evidence.changedDuringCapture = changedDuringCapture;
      evidence.networkBoundary.observedRemoteRequests = [...new Set(evidence.requests
        .map((item) => item.url)
        .filter((url) => !url.startsWith('http://127.0.0.1:4174/') && !url.startsWith('http://127.0.0.1:4176/') && !url.startsWith('http://127.0.0.1:' + serverInfo?.port + '/')))];
    } catch (error) {
      evidence.errors.push('Source fingerprint verification failed: ' + (error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    }
  }
  try {
    stopLiveServer();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    evidence.liveServer.stop = { failed: message };
    evidence.errors = evidence.errors ?? [];
    evidence.errors.push('Live server stop failed: ' + message);
    process.exitCode = 1;
  }
  if (browser) {
    try {
      await browser.close();
      evidence.browserContext.browserDisconnected = true;
      evidence.browserContext.chromeLeftOpenForHumanReview = true;
    } catch (error) {
      evidence.errors = evidence.errors ?? [];
      evidence.errors.push('Playwright CDP disconnect failed: ' + (error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    }
  }
  evidence.completedAt = new Date().toISOString();
  evidence.screenshotCount = evidence.screenshots.filter((item) => item.screenshotSaved).length;
  persist();
  process.stdout.write(JSON.stringify({
    targets: evidence.targetResults.map((item) => ({ key: item.key, httpStatus: item.httpStatus, injected: item.injection?.succeeded ?? false })),
    screenshots: evidence.screenshotCount,
    stateErrors: evidence.stateErrors.length,
    errors: (evidence.errors ?? []).length,
    liveServerStopped: evidence.liveServer.stop?.exitCode === 0,
  }) + '\n');
}
