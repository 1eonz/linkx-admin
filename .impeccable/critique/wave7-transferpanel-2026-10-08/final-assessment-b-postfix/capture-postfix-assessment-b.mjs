import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = process.cwd();
const evidenceDir = path.join(
  root,
  '.impeccable',
  'critique',
  'wave7-transferpanel-2026-10-08',
  'final-assessment-b-postfix',
);
const skillDir = 'C:/Users/Administrator/.codex/skills/impeccable';
const detectorFile = path.join(skillDir, 'scripts', 'detect.mjs');
const liveServerFile = path.join(skillDir, 'scripts', 'live-server.mjs');
const previewUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const targets = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/docs/components/lxtransferpanel.md',
];
const requireFromVue3 = createRequire(
  path.join(root, 'other-admin', 'admin-vue3', 'package.json'),
);
const { chromium } = requireFromVue3('@playwright/test');
fs.mkdirSync(evidenceDir, { recursive: true });

const timestamp = () => new Date().toISOString();
const writeJson = (name, value) =>
  fs.writeFileSync(
    path.join(evidenceDir, name),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
const quote = (value) => `"${String(value).replaceAll('"', '\\"')}"`;
const formatCommand = (args) => ['node', ...args].map(quote).join(' ');

function sourceHashes() {
  return Object.fromEntries(
    targets.map((relativePath) => [
      relativePath,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, relativePath)))
        .digest('hex'),
    ]),
  );
}

function runDetector(target, stem) {
  const args = [detectorFile, '--json', target];
  const startedAt = timestamp();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  const finishedAt = timestamp();
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const stdoutFile = `${stem}.stdout.json`;
  const stderrFile = `${stem}.stderr.txt`;
  fs.writeFileSync(path.join(evidenceDir, stdoutFile), stdout, 'utf8');
  fs.writeFileSync(path.join(evidenceDir, stderrFile), stderr, 'utf8');

  let parsedJson;
  let jsonParseError = null;
  try {
    parsedJson = JSON.parse(stdout);
  } catch (error) {
    jsonParseError = error instanceof Error ? error.message : String(error);
  }
  const rootIsArray = Array.isArray(parsedJson);
  const findingsCount = rootIsArray
    ? parsedJson.length
    : Array.isArray(parsedJson?.findings)
      ? parsedJson.findings.length
      : Number.isInteger(parsedJson?.count)
        ? parsedJson.count
        : null;
  const metadata = {
    target,
    cwd: root,
    command: formatCommand(args),
    startedAt,
    finishedAt,
    durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stdoutFile,
    stderrFile,
    stderrByteLength: Buffer.byteLength(stderr),
    jsonParseable: jsonParseError === null,
    jsonParseError,
    jsonRootType: rootIsArray ? 'array' : parsedJson === null ? 'null' : typeof parsedJson,
    jsonRootIsEmptyArray: rootIsArray && parsedJson.length === 0,
    findingsCount,
    clean: result.status === 0 && stderr.length === 0 && rootIsArray && parsedJson.length === 0,
  };
  writeJson(`${stem}.metadata.json`, metadata);
  return metadata;
}

function startLiveServer() {
  const args = [liveServerFile, '--background'];
  const startedAt = timestamp();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
  });
  const finishedAt = timestamp();
  let info = null;
  let jsonParseError = null;
  try {
    info = JSON.parse((result.stdout ?? '').trim());
  } catch (error) {
    jsonParseError = error instanceof Error ? error.message : String(error);
  }
  return {
    info,
    metadata: {
      command: formatCommand(args),
      cwd: root,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      exitCode: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      stderr: result.stderr ?? '',
      outputJsonParseError: jsonParseError,
      started: result.status === 0 && Number.isInteger(info?.pid) && Number.isInteger(info?.port),
      pid: Number.isInteger(info?.pid) ? info.pid : null,
      port: Number.isInteger(info?.port) ? info.port : null,
      tokenOmitted: Boolean(info?.token),
      stopCommand: formatCommand([liveServerFile, 'stop', '--keep-inject']),
    },
  };
}

function stopLiveServer() {
  const args = [liveServerFile, 'stop', '--keep-inject'];
  const startedAt = timestamp();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
  });
  const finishedAt = timestamp();
  return {
    command: formatCommand(args),
    cwd: root,
    startedAt,
    finishedAt,
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function isExternalHttp(urlValue) {
  try {
    const parsed = new URL(urlValue);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return !(
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

async function preparePage(page, state) {
  const response = await page.goto(previewUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.locator('.transfer-panel-demo').waitFor({
    state: 'visible',
    timeout: 20000,
  });
  await page.waitForTimeout(500);
  state.navigation = {
    status: response?.status() ?? null,
    finalUrl: page.url(),
    title: await page.title(),
  };
  state.preflight = await page.evaluate(() => {
    const oldTitle = document.title;
    const testTitle = `${oldTitle} [postfix-assessment-b-preflight]`;
    document.title = testTitle;
    const probe = document.createElement('script');
    probe.type = 'application/json';
    probe.dataset.assessmentPreflight = 'true';
    probe.textContent = '{}';
    document.head.appendChild(probe);
    const result = {
      titleWritable: document.title === testTitle,
      scriptAppendWritable: probe.isConnected,
      previousTitle: oldTitle,
      temporarilyWrittenTitle: document.title,
    };
    probe.remove();
    document.title = oldTitle;
    return result;
  });
}

async function configureState(page, scenario, state) {
  if (scenario.kind === 'hud-confirmation') {
    const settings = page.locator('.transfer-panel-demo__settings');
    if (!(await settings.evaluate((element) => element.open))) {
      await settings.locator('summary').click();
    }
    const hud = page.getByLabel('HUD 深色主题');
    await hud.check();
    state.interactions.push({ action: 'enable-HUD', success: await hud.isChecked() });

    await page.getByRole('button', { name: '全部移除', exact: true }).click();
    const confirm = page.getByRole('button', { name: '确认清空', exact: true });
    await confirm.waitFor({ state: 'visible', timeout: 10000 });
    state.interactions.push({
      action: 'open-clear-confirmation',
      success: true,
      dialogText: (await page.locator('[role="dialog"]').allInnerTexts())
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 500),
      cancelPresent: await page.getByRole('button', { name: '取消', exact: true }).isVisible(),
      confirmPresent: await confirm.isVisible(),
    });
    return;
  }

  const sourceButton = page.getByTestId('mobile-source-panel');
  const selectedButton = page.getByTestId('mobile-selected-panel');
  const sourcePanelId = await sourceButton.getAttribute('aria-controls');
  const selectedPanelId = await selectedButton.getAttribute('aria-controls');
  const sourcePanel = page.locator(`#${sourcePanelId}`);
  const selectedPanel = page.locator(`#${selectedPanelId}`);
  const snapshot = async () => ({
    sourceButton: {
      ariaLabel: await sourceButton.getAttribute('aria-label'),
      visibleText: (await sourceButton.innerText()).replace(/\s+/g, ' ').trim(),
      ariaPressed: await sourceButton.getAttribute('aria-pressed'),
      box: await sourceButton.boundingBox(),
    },
    selectedButton: {
      ariaLabel: await selectedButton.getAttribute('aria-label'),
      visibleText: (await selectedButton.innerText()).replace(/\s+/g, ' ').trim(),
      ariaPressed: await selectedButton.getAttribute('aria-pressed'),
      box: await selectedButton.boundingBox(),
    },
    sourcePanelMobileHidden: await sourcePanel.evaluate((element) =>
      element.classList.contains('is-mobile-hidden'),
    ),
    selectedPanelMobileHidden: await selectedPanel.evaluate((element) =>
      element.classList.contains('is-mobile-hidden'),
    ),
    selectedListAriaLabel: await page
      .locator('.lx-transfer-panel__selected')
      .getAttribute('aria-label'),
    keyboardHint: {
      visible: await page.locator('.lx-transfer-panel__keyboard-hint').isVisible(),
      text: (await page.locator('.lx-transfer-panel__keyboard-hint').innerText())
        .replace(/\s+/g, ' ')
        .trim(),
    },
    selectedCountText: (await page.locator('.lx-transfer-panel__selected-count').innerText())
      .replace(/\s+/g, ' ')
      .trim(),
    documentWidth: await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    })),
    docsTableScrollHint: {
      exists: (await page.locator('#lx-doc-table-scroll-hint').count()) > 0,
      visible: await page.locator('#lx-doc-table-scroll-hint').isVisible().catch(() => false),
      text: await page.locator('#lx-doc-table-scroll-hint').innerText().catch(() => null),
    },
  });

  state.mobileControlsVisible = {
    source: await sourceButton.isVisible(),
    selected: await selectedButton.isVisible(),
  };
  state.mobileInitial = await snapshot();
  await selectedButton.click();
  state.mobileAfterSelectedSwitch = await snapshot();
  await sourceButton.click();
  state.mobileAfterSourceRestore = await snapshot();

  if (scenario.testKeyboard) {
    const firstRow = page.locator('.lx-virtual-tree__row[tabindex="0"]').first();
    await firstRow.focus();
    const keyBefore = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-lx-tree-key'),
    );
    await page.keyboard.press('ArrowDown');
    const keyAfterArrow = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-lx-tree-key'),
    );
    const candidate = page.locator(
      '.lx-virtual-tree__row[aria-checked="false"]:not([aria-disabled="true"])',
    ).first();
    await candidate.focus();
    const checkedBeforeSpace = await candidate.getAttribute('aria-checked');
    const countBeforeSpace = await selectedButton.getAttribute('aria-label');
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    const checkedAfterSpace = await page
      .locator('.lx-virtual-tree__row[aria-checked="true"]')
      .filter({ has: candidate.locator(':scope > :first-child') })
      .count()
      .catch(() => 0);
    const countAfterSpace = await selectedButton.getAttribute('aria-label');
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    state.keyboardBehavior = {
      focusableTreeRow: true,
      keyBeforeArrow: keyBefore,
      keyAfterArrow,
      arrowMovedFocus: keyBefore !== keyAfterArrow,
      checkedBeforeSpace,
      checkedAfterSpace,
      spaceChangedSelectionCount: countBeforeSpace !== countAfterSpace,
      countBeforeSpace,
      countAfterSpace,
      restoredCount: await selectedButton.getAttribute('aria-label'),
    };
  }
}

async function captureScenario(browser, liveInfo, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'zh-CN',
  });
  const page = await context.newPage();
  let stage = 'navigation';
  let externalRequestCount = 0;
  const requestRecords = [];
  const consoleRecords = [];
  const pageErrors = [];
  const failedRequests = [];
  const state = {
    name: scenario.name,
    kind: scenario.kind,
    previewUrl,
    viewport: scenario.viewport,
    startedAt: timestamp(),
    navigation: null,
    preflight: null,
    interactions: [],
    requests: requestRecords,
    externalHttpRequestCount: 0,
    externalOrigins: [],
    console: consoleRecords,
    pageErrors,
    failedRequests,
    injection: null,
    detectorRan: false,
    overlays: [],
    overlayAttributionCounts: {},
    screenshot: `${scenario.name}.png`,
    screenshotSaved: false,
  };

  context.on('request', (request) => {
    const url = new URL(request.url());
    if (isExternalHttp(request.url())) externalRequestCount += 1;
    requestRecords.push({
      method: request.method(),
      origin: url.origin,
      path: url.pathname,
      resourceType: request.resourceType(),
    });
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    const found = requestRecords.findLast(
      (request) => request.origin === url.origin && request.path === url.pathname && request.status === undefined,
    );
    if (found) found.status = response.status();
  });
  page.on('console', (message) => {
    consoleRecords.push({
      stage,
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on('pageerror', (error) => pageErrors.push({ stage, message: error.message }));
  page.on('requestfailed', (request) =>
    failedRequests.push({
      stage,
      url: request.url(),
      error: request.failure()?.errorText ?? null,
    }),
  );

  try {
    await preparePage(page, state);
    stage = 'interaction';
    await configureState(page, scenario, state);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    stage = 'injection';
    const scriptUrl = `http://127.0.0.1:${liveInfo.port}/detect.js`;
    await page.addScriptTag({ url: scriptUrl });
    await page.waitForTimeout(2600);
    const runtime = await page.evaluate(() => ({
      scriptLoaded: typeof window.impeccableScan === 'function',
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
    }));
    const summaryMessages = consoleRecords.filter((record) =>
      record.text.includes('[impeccable]'),
    );
    state.injection = {
      success: runtime.scriptLoaded,
      scriptUrl,
      runtime,
      consoleSummary: summaryMessages.map((record) => record.text),
    };
    state.detectorRan = runtime.scriptLoaded && summaryMessages.length > 0;

    stage = 'post-injection';
    await page.waitForTimeout(300);
    const overlayData = await page.evaluate(() => {
      const pathFor = (element) => {
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 7) {
          const id = current.id ? `#${current.id}` : '';
          const classes =
            typeof current.className === 'string' && current.className.trim()
              ? `.${current.className.trim().split(/\s+/).slice(0, 3).join('.')}`
              : '';
          parts.unshift(`${current.tagName.toLowerCase()}${id}${classes}`);
          current = current.parentElement;
        }
        return parts.join(' > ');
      };
      const elements = Array.from(document.querySelectorAll('.impeccable-overlay')).map(
        (overlay) => {
          const target = overlay._targetEl ?? null;
          const label = overlay.querySelector('.impeccable-label');
          const computed = target ? getComputedStyle(target) : null;
          return {
            label: (label?.innerText ?? '').trim().replace(/\s+/g, ' ') || null,
            isPageBanner: overlay.classList.contains('impeccable-banner'),
            targetExists: Boolean(target),
            targetTag: target?.tagName.toLowerCase() ?? null,
            targetId: target?.id || null,
            targetClassName:
              typeof target?.className === 'string' ? target.className : null,
            targetPath: target ? pathFor(target) : null,
            targetText: (target?.innerText || target?.textContent || '')
              .trim()
              .replace(/\s+/g, ' ')
              .slice(0, 180),
            componentHit: Boolean(target?.closest('.lx-transfer-panel')),
            demoOnlyHit: Boolean(
              target?.closest('.transfer-panel-demo') &&
                !target?.closest('.lx-transfer-panel'),
            ),
            docsHit: Boolean(target?.closest('.vp-doc, .VPDoc, .VPNav, .VPSidebar, .VPFooter')),
            computedColor: computed?.color ?? null,
            computedBackgroundColor: computed?.backgroundColor ?? null,
            lxPrimaryToken: computed?.getPropertyValue('--lx-color-primary').trim() || null,
          };
        },
      );
      const component = document.querySelector('.lx-transfer-panel');
      const root = document.documentElement;
      const componentRect = component?.getBoundingClientRect();
      const table = document.querySelector('.vp-doc table');
      const tableRect = table?.getBoundingClientRect();
      return {
        elements,
        documentSize: {
          viewportWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          horizontalOverflow: root.scrollWidth > root.clientWidth,
        },
        component: component
          ? {
              left: Math.round(componentRect.left),
              right: Math.round(componentRect.right),
              width: Math.round(componentRect.width),
              scrollWidth: component.scrollWidth,
              clientWidth: component.clientWidth,
            }
          : null,
        docsTable: table
          ? {
              left: Math.round(tableRect.left),
              right: Math.round(tableRect.right),
              width: Math.round(tableRect.width),
              scrollWidth: table.scrollWidth,
              clientWidth: table.clientWidth,
              parentClassName: table.parentElement?.className ?? null,
            }
          : null,
        docTableHint: {
          text: document.querySelector('#lx-doc-table-scroll-hint')?.textContent?.trim() ?? null,
          display: document.querySelector('#lx-doc-table-scroll-hint')
            ? getComputedStyle(document.querySelector('#lx-doc-table-scroll-hint')).display
            : null,
        },
      };
    });
    state.overlays = overlayData.elements;
    state.overlayAttributionCounts = overlayData.elements.reduce((counts, item) => {
      const zone = item.componentHit
        ? 'component'
        : item.demoOnlyHit
          ? 'demo-only'
          : item.docsHit
            ? 'docs'
            : item.isPageBanner
              ? 'page-banner'
              : !item.targetExists
                ? 'no-target'
                : 'other';
      const key = `${item.label ?? '(no label)'} | ${zone}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    state.layout = {
      document: overlayData.documentSize,
      component: overlayData.component,
      docsTable: overlayData.docsTable,
      docsTableHint: overlayData.docTableHint,
    };
    state.impeccableConsole = consoleRecords.filter((record) =>
      record.text.includes('[impeccable]'),
    );
    state.browserWarningsAndErrors = consoleRecords.filter(
      (record) => record.type === 'warning' || record.type === 'error',
    );
    state.externalHttpRequestCount = externalRequestCount;
    state.externalOrigins = [
      ...new Set(
        requestRecords
          .filter((request) => {
            const host = new URL(request.origin).hostname;
            return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
          })
          .map((request) => request.origin),
      ),
    ];

    const screenshotPath = path.join(evidenceDir, state.screenshot);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      animations: 'disabled',
    });
    state.screenshotSaved = fs.existsSync(screenshotPath);
    state.finishedAt = timestamp();
  } catch (error) {
    state.failedAtStage = stage;
    state.error = error instanceof Error ? error.stack ?? error.message : String(error);
    state.externalHttpRequestCount = externalRequestCount;
    state.finishedAt = timestamp();
  } finally {
    await context.close().catch(() => {});
  }
  return state;
}

const summary = {
  assessment: 'B post-fix',
  startedAt: timestamp(),
  previewUrl,
  ignoreFile: {
    path: '.impeccable/critique/ignore.md',
    exists: fs.existsSync(path.join(root, '.impeccable', 'critique', 'ignore.md')),
  },
  sourceHashesAtStart: sourceHashes(),
  detectorScans: [],
  browser: null,
  liveServerStart: null,
  scenarios: [],
  liveServerStop: null,
  sourceHashesAtEnd: null,
  fatalError: null,
};

let browser;
let liveServerInfo = null;
let liveServerMetadata = null;

try {
  summary.detectorScans.push(
    runDetector(targets[0], 'detector-component'),
    runDetector(targets[1], 'detector-basic-demo'),
  );

  const started = startLiveServer();
  liveServerInfo = started.info;
  liveServerMetadata = started.metadata;
  summary.liveServerStart = liveServerMetadata;
  writeJson('live-server-start.json', liveServerMetadata);
  if (!liveServerMetadata.started) {
    throw new Error('本次 Impeccable live-server 启动失败，无法运行浏览器 overlay');
  }

  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  summary.browser = {
    automation: 'Playwright Chromium API',
    channel: 'msedge',
    isolatedBrowserProcess: true,
    newContextAndPagePerScenario: true,
    screenshotImagesAreFromCurrentBuiltDocs: true,
  };
  const scenarios = [
    {
      name: 'mobile-320-label-count-keyboard',
      viewport: { width: 320, height: 860 },
      kind: 'mobile',
      testKeyboard: true,
    },
    {
      name: 'mobile-390-label-count-keyboard',
      viewport: { width: 390, height: 844 },
      kind: 'mobile',
      testKeyboard: false,
    },
    {
      name: 'desktop-hud-confirmation',
      viewport: { width: 1440, height: 1000 },
      kind: 'hud-confirmation',
      testKeyboard: false,
    },
  ];

  for (const scenario of scenarios) {
    summary.scenarios.push(await captureScenario(browser, liveServerInfo, scenario));
    writeJson('assessment-b-postfix-evidence.json', summary);
  }
} catch (error) {
  summary.fatalError = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (liveServerMetadata?.started) {
    summary.liveServerStop = stopLiveServer();
    writeJson('live-server-stop.json', summary.liveServerStop);
  }
  summary.sourceHashesAtEnd = sourceHashes();
  summary.finishedAt = timestamp();
  writeJson('assessment-b-postfix-evidence.json', summary);
  writeJson('browser-evidence.json', summary);
}

console.log(
  JSON.stringify(
    {
      detectorScans: summary.detectorScans.map((scan) => ({
        target: scan.target,
        exitCode: scan.exitCode,
        stderrByteLength: scan.stderrByteLength,
        jsonParseable: scan.jsonParseable,
        jsonRootType: scan.jsonRootType,
        jsonRootIsEmptyArray: scan.jsonRootIsEmptyArray,
        findingsCount: scan.findingsCount,
        clean: scan.clean,
      })),
      scenarios: summary.scenarios.map((scenario) => ({
        name: scenario.name,
        viewport: scenario.viewport,
        injection: scenario.injection?.success ?? false,
        detectorRan: scenario.detectorRan,
        overlayCount: scenario.overlays?.length ?? 0,
        attribution: scenario.overlayAttributionCounts,
        externalHttpRequestCount: scenario.externalHttpRequestCount,
        screenshotSaved: scenario.screenshotSaved,
        error: scenario.error ?? null,
      })),
      liveServerStart: summary.liveServerStart,
      liveServerStop: summary.liveServerStop,
      sourceHashesAtStart: summary.sourceHashesAtStart,
      sourceHashesAtEnd: summary.sourceHashesAtEnd,
      fatalError: summary.fatalError,
    },
    null,
    2,
  ),
);

if (summary.fatalError) process.exitCode = 1;
