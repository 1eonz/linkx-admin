import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(outDir, 'screenshots');
const playwrightEntry = path.join(root, 'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const liveServerPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs';
const liveServerInfoPath = path.join(root, '.impeccable/live/server.json');
const targets = [
  { key: 'dynamicform', label: 'LxDynamicForm', url: 'http://127.0.0.1:4174/components/lxdynamicform.html' },
  { key: 'upload', label: 'LxUpload', url: 'http://127.0.0.1:4174/components/lxupload.html' },
  { key: 'datepicker', label: 'LxDatePicker', url: 'http://127.0.0.1:4174/components/lxdatepicker.html' },
];

const evidence = {
  capturedAt: new Date().toISOString(),
  browserMethod: 'Playwright 1.58.0 attached over CDP to a separately launched headed Chrome profile',
  browserAutomationFallback: 'No native browser automation/evaluate tool is exposed in this session.',
  browserContext: null,
  targetResults: [],
  liveServer: { startedByAssessment: false, start: null, stop: null },
  console: [],
  pageErrors: [],
  errors: [],
  screenshots: [],
};

const { chromium } = await import(pathToFileURL(playwrightEntry).href);
let browser;
let serverInfo;
let chromePid;
let preflightSucceeded = false;

function persist() {
  fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
}

function saveText(name, value) {
  fs.writeFileSync(path.join(outDir, name), value);
}

function commandText(args) {
  return `node ${args.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(' ')}\n`;
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
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Chrome DevTools endpoint did not open on port ${port}.`);
}

function recordConsole(page, targetKey) {
  page.on('console', (message) => {
    evidence.console.push({ target: targetKey, type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => {
    evidence.pageErrors.push({ target: targetKey, message: error.message });
  });
}

async function preflightMutation(page, target) {
  const preflight = await page.evaluate((label) => {
    document.title = `[Human] ${label} Assessment B`;
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
  evidence.targetResults.find((entry) => entry.key === target.key).preflight = preflight;
  preflightSucceeded ||= preflight.scriptConnected && preflight.marker;
  persist();
  return preflight;
}

function startLiveServer() {
  const args = [liveServerPath, '--background'];
  const result = runNode(args);
  const raw = (result.stdout ?? '').trim();
  let info = null;
  try {
    info = JSON.parse(raw.split(/\r?\n/).filter(Boolean).at(-1) ?? 'null');
  } catch {}
  const safeInfo = info ? { pid: info.pid, port: info.port, token: '[REDACTED]' } : null;
  const stderr = `${result.stderr ?? ''}${result.error ? `${result.error.message}\n` : ''}`;
  saveText('live-server.start.command.txt', commandText(args));
  saveText('live-server.start.stdout.json', `${JSON.stringify(safeInfo ?? { rawOutput: raw }, null, 2)}\n`);
  saveText('live-server.start.stderr.txt', stderr);
  saveText('live-server.start.exit-code.txt', `${result.status ?? (result.error ? 1 : 0)}\n`);
  evidence.liveServer.start = {
    command: commandText(args),
    exitCode: result.status ?? (result.error ? 1 : 0),
    stdout: safeInfo,
    stderr,
  };
  if (!info || !Number.isInteger(info.pid) || !Number.isInteger(info.port) || result.status !== 0) {
    throw new Error(`Impeccable live server startup failed (exit ${evidence.liveServer.start.exitCode}).`);
  }
  serverInfo = info;
  evidence.liveServer.startedByAssessment = true;
  persist();
  return info;
}

async function stopLiveServer() {
  if (!serverInfo) return;
  let currentInfo = null;
  try {
    currentInfo = JSON.parse(fs.readFileSync(liveServerInfoPath, 'utf8'));
  } catch {}
  if (currentInfo?.pid !== serverInfo.pid || currentInfo?.port !== serverInfo.port) {
    const note = 'Stop skipped: the project server record no longer matches this assessment process.';
    saveText('live-server.stop.command.txt', 'not-run\n');
    saveText('live-server.stop.stdout.txt', '');
    saveText('live-server.stop.stderr.txt', `${note}\n`);
    saveText('live-server.stop.exit-code.txt', 'not-run\n');
    evidence.liveServer.stop = { skipped: true, reason: note };
    persist();
    return;
  }
  const args = [liveServerPath, 'stop', '--keep-inject'];
  const result = runNode(args);
  const stderr = `${result.stderr ?? ''}${result.error ? `${result.error.message}\n` : ''}`;
  saveText('live-server.stop.command.txt', commandText(args));
  saveText('live-server.stop.stdout.txt', result.stdout ?? '');
  saveText('live-server.stop.stderr.txt', stderr);
  saveText('live-server.stop.exit-code.txt', `${result.status ?? (result.error ? 1 : 0)}\n`);
  evidence.liveServer.stop = {
    command: commandText(args),
    exitCode: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout ?? '',
    stderr,
    serverPidMatched: currentInfo.pid === serverInfo.pid,
  };
  persist();
}

async function injectDetector(page, target) {
  if (!serverInfo) throw new Error('Overlay injection skipped because the assessment did not start its live server.');
  const url = `http://127.0.0.1:${serverInfo.port}/detect.js`;
  await page.addScriptTag({ url });
  await page.waitForTimeout(2700);
  const injection = await page.evaluate((src) => ({
    title: document.title,
    source: src,
    scriptConnected: [...document.scripts].some((node) => node.src === src),
    scanAvailable: typeof window.impeccableScanAsync === 'function',
    detectAvailable: typeof window.impeccableDetectAsync === 'function',
    preflightMarker: window.__assessmentBPreflight === true,
  }), url);
  const result = evidence.targetResults.find((entry) => entry.key === target.key);
  result.injection = { succeeded: injection.scriptConnected && injection.scanAvailable && injection.detectAvailable, ...injection };
  persist();
  return result.injection;
}

async function scanPage(page) {
  return page.evaluate(async () => {
    if (typeof window.impeccableScanAsync !== 'function') {
      return { available: false, groups: [], overlays: [] };
    }
    const groups = await window.impeccableScanAsync();
    const ownerSelector = '.dynamic-form-demo, .lx-upload-demo, .lx-date-picker-demo';
    const shellSelector = 'header, nav, aside, footer, [class*="VPNav"], [class*="VPSidebar"], [class*="vp-nav"], [class*="vp-sidebar"], .VPDocAside, .VPDocAsideOutline, .VPLocalNav, [class*="LocalNav"], [class*="DocAside"], [class*="OutlineDropdown"]';
    const mapped = groups.map(({ el, findings }) => {
      const owner = el.closest(ownerSelector);
      const shell = el.closest(shellSelector);
      const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
      const selector = el.id
        ? `#${el.id}`
        : `${el.tagName?.toLowerCase() ?? 'unknown'}${classes.slice(0, 3).map((name) => `.${name}`).join('')}`;
      return {
        selector,
        tagName: el.tagName?.toLowerCase() ?? 'unknown',
        id: el.id || null,
        classes,
        text: (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().slice(0, 180),
        componentOwner: owner ? owner.className : null,
        docsShellAncestor: shell ? `${shell.tagName.toLowerCase()}${shell.className ? `.${String(shell.className).trim().split(/\s+/).join('.')}` : ''}` : null,
        rect: el.getBoundingClientRect?.().toJSON?.() ?? null,
        findings: findings.map((finding) => ({
          type: finding.type ?? finding.id ?? 'unknown',
          name: finding.name ?? finding.type ?? finding.id ?? 'unknown',
          category: finding.category ?? null,
          severity: finding.severity ?? null,
          detail: finding.detail ?? finding.snippet ?? '',
          ignoreValue: finding.ignoreValue ?? finding.value ?? '',
        })),
      };
    });
    const overlays = [...document.querySelectorAll('.impeccable-overlay')].map((node) => {
      const style = getComputedStyle(node);
      return {
        className: node.className,
        text: (node.innerText || node.textContent || '').trim().slice(0, 120),
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
      visibleOverlayCount: overlays.filter((overlay) => overlay.visible).length,
      overlays,
    };
  });
}

async function pageSnapshot(page) {
  return page.evaluate(() => {
    const roots = {
      dynamicform: document.querySelector('.dynamic-form-demo'),
      upload: document.querySelector('.lx-upload-demo'),
      datepicker: document.querySelector('.lx-date-picker-demo'),
    };
    const tokenNames = [
      '--lx-color-primary',
      '--lx-color-primary-light',
      '--lx-text-primary',
      '--lx-text-secondary',
      '--lx-border-light',
      '--lx-bg-card',
      '--lx-font-mono',
      '--lx-space-sm',
    ];
    const tokenValues = (root) => {
      if (!root) return null;
      const styles = getComputedStyle(root);
      return Object.fromEntries(tokenNames.map((name) => [name, styles.getPropertyValue(name).trim()]));
    };
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY },
      themeClasses: [...document.documentElement.classList],
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 15).map((node) => node.innerText.trim()),
      visibleDemoRoots: Object.fromEntries(Object.entries(roots).map(([key, node]) => [key, Boolean(node)])),
      tokens: Object.fromEntries(Object.entries(roots).map(([key, node]) => [key, tokenValues(node)])),
      mediaQueries: {
        hoverNone: matchMedia('(hover: none)').matches,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        pointerFine: matchMedia('(pointer: fine)').matches,
        anyHover: matchMedia('(any-hover: hover)').matches,
        anyPointerCoarse: matchMedia('(any-pointer: coarse)').matches,
      },
      uploadClearButtons: [...document.querySelectorAll('.lx-upload__clear')].map((node) => {
        const style = getComputedStyle(node);
        return {
          text: (node.innerText || node.textContent || '').trim(),
          rect: node.getBoundingClientRect().toJSON(),
          minHeight: style.minHeight,
          height: style.height,
          boxSizing: style.boxSizing,
          display: style.display,
          visibility: style.visibility,
        };
      }),
      rangeInputs: [...document.querySelectorAll('.el-date-editor--daterange input')].map((node) => ({
        placeholder: node.placeholder,
        value: node.value,
        ariaLabel: node.getAttribute('aria-label'),
      })),
      weekHeaders: [...document.querySelectorAll('.el-date-table th')].slice(0, 14).map((node) => node.innerText.trim()),
      bodyTextExcerpt: document.body.innerText.trim().slice(0, 420),
    };
  });
}

async function capture(page, target, label, screenshotName, { fullPage = true, scrollTop = true } = {}) {
  const result = { target: target.key, label, screenshot: `screenshots/${screenshotName}`, scan: null, page: null, screenshotSaved: false };
  try {
    await page.evaluate(({ label: title, scrollTop: reset }) => {
      document.title = `[Human] ${title}`;
      if (reset) window.scrollTo(0, 0);
    }, { label: `${target.label} · ${label}`, scrollTop });
    result.scan = await scanPage(page);
  } catch (error) {
    result.scanError = error instanceof Error ? error.message : String(error);
  }
  try {
    result.page = await pageSnapshot(page);
    await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage, animations: 'disabled' });
    result.screenshotSaved = true;
  } catch (error) {
    result.screenshotError = error instanceof Error ? error.message : String(error);
  }
  evidence.screenshots.push(result);
  persist();
  return result;
}

async function setHudTheme(page, target, enabled = true) {
  if (target.key === 'dynamicform') {
    const details = page.locator('.dynamic-form-demo__settings');
    if (!(await details.evaluate((node) => node.open).catch(() => false))) await details.locator('summary').click();
  }
  const checkbox = page.getByRole('checkbox', { name: 'HUD 深色主题' }).first();
  const checkboxCount = await checkbox.count();
  if (!checkboxCount) throw new Error(`HUD theme checkbox not found for ${target.key}.`);
  const label = page.locator('label.el-checkbox').filter({ hasText: 'HUD 深色主题' }).first();
  const checked = await checkbox.isChecked();
  if (checked !== enabled) {
    if (await label.count()) await label.click();
    else await page.getByText('HUD 深色主题', { exact: true }).first().click();
  }
  await page.waitForFunction((expected) => (
    document.documentElement.classList.contains('dark') === expected
    && document.documentElement.classList.contains('lx-theme-hud') === expected
  ), enabled, { timeout: 5000 });
}

async function chooseRadioOption(page, name) {
  const radio = page.getByRole('radio', { name }).first();
  if (!(await radio.count())) {
    await page.getByText(name, { exact: true }).first().click();
    return;
  }
  if (await radio.isChecked()) return;
  const label = page.locator('label.el-radio').filter({ hasText: name }).first();
  if (await label.count()) await label.click();
  else await page.getByText(name, { exact: true }).first().click();
}

async function mobileNavigationSnapshot(page) {
  return page.evaluate(() => {
    const rectData = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tagName: node.tagName.toLowerCase(),
        className: typeof node.className === 'string' ? node.className : '',
        text: (node.getAttribute('aria-label') || node.innerText || node.textContent || '').trim().slice(0, 100),
        rect: rect.toJSON(),
        position: style.position,
        zIndex: style.zIndex,
        display: style.display,
        visibility: style.visibility,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0,
      };
    };
    const intersection = (left, right) => {
      if (!left || !right) return null;
      const x1 = Math.max(left.left, right.left);
      const y1 = Math.max(left.top, right.top);
      const x2 = Math.min(left.right, right.right);
      const y2 = Math.min(left.bottom, right.bottom);
      if (x2 <= x1 || y2 <= y1) return null;
      return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    };
    const localNav = document.querySelector('.VPLocalNav');
    const toc = document.querySelector('.VPLocalNavOutlineDropdown');
    const toggle = toc?.querySelector('button') ?? null;
    const root = document.querySelector('.dynamic-form-demo');
    const field = root
      ? [...root.querySelectorAll('input:not([type="hidden"]), textarea, select, [role="combobox"]')].find((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      }) ?? null
      : null;
    const fieldRect = field?.getBoundingClientRect() ?? null;
    const navNodes = toc ? [toc, ...toc.querySelectorAll('*')] : [];
    const overlaps = navNodes.map((node) => {
      const info = rectData(node);
      const overlap = intersection(info?.rect, fieldRect);
      return overlap ? { ...info, overlap } : null;
    }).filter(Boolean);
    const topmost = overlaps[0]?.overlap
      ? document.elementFromPoint(
        overlaps[0].overlap.x + overlaps[0].overlap.width / 2,
        overlaps[0].overlap.y + overlaps[0].overlap.height / 2,
      )
      : null;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollY,
      localNav: rectData(localNav),
      tocToggle: toggle ? {
        text: (toggle.innerText || toggle.textContent || '').trim(),
        expanded: toggle.getAttribute('aria-expanded'),
        rect: toggle.getBoundingClientRect().toJSON(),
      } : null,
      toc: rectData(toc),
      field: field ? { ...rectData(field), placeholder: field.getAttribute('placeholder'), ariaLabel: field.getAttribute('aria-label') } : null,
      tocFieldOverlaps: overlaps,
      topmostOverlapTarget: topmost ? {
        tagName: topmost.tagName.toLowerCase(),
        className: typeof topmost.className === 'string' ? topmost.className : '',
        inDocsShell: Boolean(topmost.closest('.VPLocalNav, .VPLocalNavOutlineDropdown, .VPDocAside, .VPDocAsideOutline')),
        inDynamicForm: Boolean(topmost.closest('.dynamic-form-demo')),
      } : null,
    };
  });
}

async function captureMobileDocNavigation(page, target) {
  await page.setViewportSize({ width: 375, height: 812 });
  const field = page.locator('.dynamic-form-demo input:not([type="hidden"]), .dynamic-form-demo textarea, .dynamic-form-demo select, .dynamic-form-demo [role="combobox"]').first();
  if (await field.count()) await field.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const closed = await mobileNavigationSnapshot(page);
  const closedScreenshot = await capture(page, target, 'mobile-375-form-scroll', 'dynamicform-mobile-form-scroll.png', { fullPage: false, scrollTop: false });

  const toggle = page.locator('.VPLocalNavOutlineDropdown button').first();
  const toggleAvailable = await toggle.count() > 0 && await toggle.isVisible().catch(() => false);
  let opened = null;
  let openedScreenshot = null;
  if (toggleAvailable) {
    await toggle.click();
    await page.waitForTimeout(180);
    opened = await mobileNavigationSnapshot(page);
    openedScreenshot = await capture(page, target, 'mobile-375-toc-open-at-form', 'dynamicform-mobile-toc-open-at-form.png', { fullPage: false, scrollTop: false });
  }
  return { toggleAvailable, closed, closedScreenshot, opened, openedScreenshot };
}

async function uploadPointerSnapshot(page) {
  return page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    mediaQueries: {
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      pointerFine: matchMedia('(pointer: fine)').matches,
      anyHover: matchMedia('(any-hover: hover)').matches,
      anyPointerCoarse: matchMedia('(any-pointer: coarse)').matches,
    },
    clearButtons: [...document.querySelectorAll('.lx-upload__clear')].map((node) => {
      const style = getComputedStyle(node);
      return {
        text: (node.innerText || node.textContent || '').trim(),
        rect: node.getBoundingClientRect().toJSON(),
        minHeight: style.minHeight,
        height: style.height,
        boxSizing: style.boxSizing,
        display: style.display,
        visibility: style.visibility,
      };
    }),
  }));
}

async function captureUploadTouchEvidence(page, target) {
  await page.setViewportSize({ width: 375, height: 812 });
  const button = page.locator('.lx-upload__clear').first();
  if (await button.count() && await button.isVisible().catch(() => false)) await button.scrollIntoViewIfNeeded();
  const viewportOnly = await uploadPointerSnapshot(page);
  const session = await page.context().newCDPSession(page);
  let touchEmulated = null;
  let emulationError = null;
  let screenshot = null;
  try {
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await page.waitForTimeout(120);
    if (await button.count() && await button.isVisible().catch(() => false)) await button.scrollIntoViewIfNeeded();
    touchEmulated = await uploadPointerSnapshot(page);
    if (touchEmulated.clearButtons.length) {
      screenshot = await capture(page, target, 'mobile-375-touch-emulated-clear', 'upload-mobile-375-touch-emulated-clear.png', { fullPage: false, scrollTop: false });
    }
  } catch (error) {
    emulationError = error instanceof Error ? error.message : String(error);
  } finally {
    try { await session.send('Emulation.setTouchEmulationEnabled', { enabled: false }); } catch {}
    try { await session.detach(); } catch {}
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  return { viewportOnly, touchEmulated, emulationError, screenshot };
}

async function chooseDynamicFieldType(page, value, label) {
  const control = page.locator('#dynamic-form-schema-type');
  const tag = await control.evaluate((node) => node.tagName.toLowerCase());
  if (tag === 'select') {
    await control.selectOption(value);
  } else {
    const combo = page.getByRole('combobox', { name: '选择字段类型' }).first();
    await combo.click();
    const option = page.getByRole('option', { name: label, exact: true }).first();
    if (await option.count()) await option.click();
    else await page.getByText(label, { exact: true }).last().click();
  }
  await page.getByTestId('date-range-model-value').waitFor({ state: 'visible', timeout: 5000 });
}

async function clearRange(page, editor) {
  await editor.scrollIntoViewIfNeeded();
  await editor.hover();
  await page.waitForTimeout(120);
  const before = await editor.locator('input').evaluateAll((nodes) => nodes.map((node) => node.value));
  let method = 'clear-icon';
  const clearIcon = editor.locator('.el-input__clear, [aria-label*="清空"], [title*="清空"]');
  if (await clearIcon.count()) {
    await clearIcon.first().click();
  } else {
    method = 'keyboard-clear-fallback';
    const firstInput = editor.locator('input').first();
    await firstInput.click();
    await firstInput.press('Control+A');
    await firstInput.press('Backspace');
    const secondInput = editor.locator('input').nth(1);
    if (await secondInput.count()) {
      await secondInput.click();
      await secondInput.press('Control+A');
      await secondInput.press('Backspace');
    }
  }
  await page.waitForTimeout(250);
  const after = await editor.locator('input').evaluateAll((nodes) => nodes.map((node) => node.value));
  return { before, after, method };
}

async function captureDynamicForm(page, target) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, target, 'desktop-light', 'dynamicform-desktop-light.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await capture(page, target, 'mobile-375-light', 'dynamicform-mobile-375-light.png');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setHudTheme(page, target);
  await capture(page, target, 'desktop-hud-dark', 'dynamicform-desktop-hud-dark.png');
  await setHudTheme(page, target, false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await capture(page, target, 'desktop-reduced-motion', 'dynamicform-desktop-reduced-motion.png');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  const settings = page.locator('.dynamic-form-demo__settings');
  if (!(await settings.evaluate((node) => node.open).catch(() => false))) await settings.locator('summary').click();
  await chooseRadioOption(page, '空结果');
  await page.waitForTimeout(450);
  const empty = await capture(page, target, 'remote-options-empty', 'dynamicform-remote-options-empty.png');

  await chooseRadioOption(page, '失败');
  await page.waitForTimeout(450);
  const error = await capture(page, target, 'remote-options-error', 'dynamicform-remote-options-error.png');

  const preview = page.locator('.dynamic-form-demo__schema-preview');
  if (!(await preview.evaluate((node) => node.open).catch(() => false))) await preview.locator('summary').click();
  await chooseDynamicFieldType(page, 'daterange', '日期范围');
  const editor = preview.locator('.el-date-editor--daterange').first();
  const clear = await clearRange(page, editor);
  const rangeText = await page.getByTestId('date-range-model-value').innerText();
  const nullState = {
    clear,
    statusText: rangeText,
    confirmsNull: rangeText.includes('null'),
  };
  const nullCapture = await capture(page, target, 'daterange-cleared-null', 'dynamicform-daterange-cleared-null.png');
  nullCapture.dateRangeClear = nullState;
  evidence.dynamicFormStates = { empty, error, dateRangeClear: nullState };
  evidence.mobileDocNavigation = await captureMobileDocNavigation(page, target);
  persist();
}

async function captureUpload(page, target, fixturePath) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, target, 'desktop-light', 'upload-desktop-light.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await capture(page, target, 'mobile-375-light', 'upload-mobile-375-light.png');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setHudTheme(page, target);
  await capture(page, target, 'desktop-hud-dark', 'upload-desktop-hud-dark.png');
  await setHudTheme(page, target, false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await capture(page, target, 'desktop-reduced-motion', 'upload-desktop-reduced-motion.png');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  const failNext = page.getByRole('button', { name: '下一次上传失败' }).first();
  await failNext.click();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(fixturePath);
  await page.getByRole('button', { name: '开始上传' }).first().click();
  let errorObserved = false;
  try {
    await page.waitForFunction(() => document.querySelector('[data-testid="upload-last-action"]')?.textContent?.includes('上传失败'), null, { timeout: 7000 });
    errorObserved = true;
  } catch {}
  const captureResult = await capture(page, target, 'mock-upload-error', 'upload-mock-error.png');
  captureResult.mockUploadErrorObserved = errorObserved;
  captureResult.lastAction = await page.locator('[data-testid="upload-last-action"]').innerText().catch(() => '');
  captureResult.requestCount = await page.locator('[data-testid="upload-request-count"]').innerText().catch(() => '');
  evidence.uploadTouchEvidence = await captureUploadTouchEvidence(page, target);
  persist();
}

async function openDateRange(page, target, width, screenshotName, label) {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
  const editor = page.locator('.lx-date-picker-demo [data-testid="range"] .el-date-editor--daterange').first();
  await editor.scrollIntoViewIfNeeded();
  await editor.locator('input').first().click();
  await page.waitForTimeout(300);
  const calendar = await page.evaluate(() => ({
    visible: Boolean(document.querySelector('.el-picker-panel:not([style*="display: none"])')),
    panelCount: document.querySelectorAll('.el-date-range-picker__content').length,
    headers: [...document.querySelectorAll('.el-date-range-picker__header-label')].map((node) => node.innerText.trim()),
    shortcuts: [...document.querySelectorAll('.el-picker-panel [class*="shortcut"]')].map((node) => node.innerText.trim()).filter(Boolean),
    viewport: { width: innerWidth, height: innerHeight },
  }));
  const captureResult = await capture(page, target, label, screenshotName, { fullPage: false, scrollTop: false });
  captureResult.calendar = calendar;
  persist();
  return captureResult;
}

async function captureDatePicker(page, target) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, target, 'desktop-light', 'datepicker-desktop-light.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await capture(page, target, 'mobile-375-light', 'datepicker-mobile-375-light.png');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setHudTheme(page, target);
  await capture(page, target, 'desktop-hud-dark', 'datepicker-desktop-hud-dark.png');
  await setHudTheme(page, target, false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await capture(page, target, 'desktop-reduced-motion', 'datepicker-desktop-reduced-motion.png');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await openDateRange(page, target, 1440, 'datepicker-desktop-calendar-open.png', 'desktop-calendar-open');
  await page.keyboard.press('Escape').catch(() => {});
  await openDateRange(page, target, 375, 'datepicker-mobile-calendar-open.png', 'mobile-375-calendar-open');
  await page.keyboard.press('Escape').catch(() => {});

  await page.setViewportSize({ width: 1440, height: 1000 });
  const editor = page.locator('.lx-date-picker-demo [data-testid="range"] .el-date-editor--daterange').first();
  const clear = await clearRange(page, editor);
  const statusText = await page.locator('.lx-date-picker-demo__status').innerText();
  const nullState = { clear, statusText, confirmsNull: statusText.includes('null') };
  const result = await capture(page, target, 'daterange-cleared-null', 'datepicker-daterange-cleared-null.png');
  result.dateRangeClear = nullState;
  evidence.datePickerStates = { desktopCalendar: evidence.screenshots.find((item) => item.screenshot === 'screenshots/datepicker-desktop-calendar-open.png')?.calendar ?? null, mobileCalendar: evidence.screenshots.find((item) => item.screenshot === 'screenshots/datepicker-mobile-calendar-open.png')?.calendar ?? null, dateRangeClear: nullState };
  await page.evaluate(() => { document.title = '[Human] LxDatePicker · daterange 清空 null'; window.scrollTo(0, 0); });
  await page.bringToFront();
  persist();
}

async function navigateTarget(context, target, isFirst) {
  const page = await context.newPage();
  recordConsole(page, target.key);
  const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const targetResult = { key: target.key, label: target.label, url: target.url, httpStatus: response?.status() ?? null, title: await page.title(), screenshots: [] };
  evidence.targetResults.push(targetResult);
  const preflight = await preflightMutation(page, target);
  if (isFirst && preflight.scriptConnected && preflight.marker) {
    startLiveServer();
  }
  const injection = await injectDetector(page, target);
  targetResult.injection = injection;
  await scanPage(page).then((scan) => { targetResult.initialOverlayScan = scan; });
  persist();
  return page;
}

async function main() {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-wave4-dynamicform-assessment-b-'));
  const port = await findFreePort();
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-extensions',
    'about:blank',
  ];
  const chromeProcess = spawn(chromePath, args, { detached: true, stdio: 'ignore', windowsHide: false });
  chromePid = chromeProcess.pid;
  chromeProcess.unref();
  const cdpVersion = await waitForCdp(port);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  const blankPage = context.pages()[0];
  if (blankPage?.url() === 'about:blank') await blankPage.close();
  evidence.browserContext = {
    chromePid,
    chromeVersion: cdpVersion.Browser,
    remoteDebuggingPort: port,
    profileDir,
    isolatedProfile: true,
    headed: true,
    createdFreshPageContext: true,
    nativeBrowserAutomationAvailable: false,
  };
  persist();

  const dynamicPage = await navigateTarget(context, targets[0], true);
  await captureDynamicForm(dynamicPage, targets[0]);

  const uploadPage = await navigateTarget(context, targets[1], false);
  await captureUpload(uploadPage, targets[1], path.join(outDir, 'fixtures/upload-sample.csv'));

  const datePickerPage = await navigateTarget(context, targets[2], false);
  await captureDatePicker(datePickerPage, targets[2]);
}

try {
  await main();
} catch (error) {
  evidence.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  try {
    await stopLiveServer();
  } catch (error) {
    evidence.liveServer.stop = { failed: error instanceof Error ? error.message : String(error) };
    evidence.errors.push(`Live server stop failed: ${evidence.liveServer.stop.failed}`);
    process.exitCode = 1;
  }
  if (browser) {
    try {
      await browser.close();
      evidence.browserContext.browserDisconnected = true;
      evidence.browserContext.chromeLeftOpenForHumanReview = true;
    } catch (error) {
      evidence.errors.push(`Playwright CDP disconnect failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
  evidence.completedAt = new Date().toISOString();
  evidence.preflightSucceeded = preflightSucceeded;
  persist();
  process.stdout.write(`${JSON.stringify({ targets: evidence.targetResults.map(({ key, httpStatus, injection }) => ({ key, httpStatus, injected: injection?.succeeded ?? false })), screenshots: evidence.screenshots.filter((item) => item.screenshotSaved).length, errors: evidence.errors.length, liveServerStopped: evidence.liveServer.stop?.exitCode === 0 })}\n`);
}
