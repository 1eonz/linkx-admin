import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const repoRoot = process.cwd();
const outputDir = path.join(
  repoRoot,
  '.impeccable',
  'critique',
  'wave7-transferpanel-2026-10-08',
  'final-assessment-b',
);
const impeccableRoot = 'C:/Users/Administrator/.codex/skills/impeccable';
const detectorPath = path.join(impeccableRoot, 'scripts', 'detect.mjs');
const liveServerPath = path.join(impeccableRoot, 'scripts', 'live-server.mjs');
const previewUrl = 'http://127.0.0.1:4175/components/lxtransferpanel';
const requestedPreviewUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const requireFromVue3 = createRequire(
  path.join(repoRoot, 'other-admin', 'admin-vue3', 'package.json'),
);
const { chromium } = requireFromVue3('@playwright/test');

fs.mkdirSync(outputDir, { recursive: true });

function writeJson(name, value) {
  fs.writeFileSync(
    path.join(outputDir, name),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

function now() {
  return new Date().toISOString();
}

function commandText(executable, args) {
  return [executable, ...args]
    .map((part) => `"${String(part).replaceAll('"', '\\"')}"`)
    .join(' ');
}

function captureDetector(target, fileStem) {
  const args = [detectorPath, '--json', target];
  const startedAt = now();
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  const finishedAt = now();
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const stdoutPath = `${fileStem}.stdout.json`;
  const stderrPath = `${fileStem}.stderr.txt`;
  fs.writeFileSync(path.join(outputDir, stdoutPath), stdout, 'utf8');
  fs.writeFileSync(path.join(outputDir, stderrPath), stderr, 'utf8');

  let parsedJson;
  let jsonError = null;
  try {
    parsedJson = JSON.parse(stdout);
  } catch (error) {
    jsonError = error instanceof Error ? error.message : String(error);
  }

  const rootIsArray = Array.isArray(parsedJson);
  const rootIsEmptyArray = rootIsArray && parsedJson.length === 0;
  const findingsCount = rootIsArray
    ? parsedJson.length
    : Array.isArray(parsedJson?.findings)
      ? parsedJson.findings.length
      : Number.isInteger(parsedJson?.count)
        ? parsedJson.count
        : null;
  const metadata = {
    target,
    cwd: repoRoot,
    command: commandText('node', args),
    startedAt,
    finishedAt,
    durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stdoutFile: stdoutPath,
    stderrFile: stderrPath,
    jsonParseable: jsonError === null,
    jsonError,
    jsonRootType: Array.isArray(parsedJson)
      ? 'array'
      : parsedJson === null
        ? 'null'
        : typeof parsedJson,
    jsonRootIsEmptyArray: rootIsEmptyArray,
    findingsCount,
    clean: result.status === 0 && rootIsEmptyArray,
  };
  writeJson(`${fileStem}.metadata.json`, metadata);
  return metadata;
}

function startLiveServer() {
  const args = [liveServerPath, '--background'];
  const startedAt = now();
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
  });
  const finishedAt = now();
  let info = null;
  let parseError = null;
  try {
    info = JSON.parse((result.stdout ?? '').trim());
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  const record = {
    command: commandText('node', args),
    cwd: repoRoot,
    startedAt,
    finishedAt,
    durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stderr: result.stderr ?? '',
    startSucceeded: result.status === 0 && Number.isInteger(info?.pid),
    pid: Number.isInteger(info?.pid) ? info.pid : null,
    port: Number.isInteger(info?.port) ? info.port : null,
    ephemeralTokenOmitted: Boolean(info?.token),
    stdoutJsonParseError: parseError,
    stopMethod: `node "${liveServerPath}" stop --keep-inject`,
  };
  return { info, record };
}

function stopLiveServer() {
  const args = [liveServerPath, 'stop', '--keep-inject'];
  const startedAt = now();
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
  });
  const finishedAt = now();
  return {
    command: commandText('node', args),
    cwd: repoRoot,
    startedAt,
    finishedAt,
    exitCode: result.status,
    signal: result.signal,
    spawnError: result.error?.message ?? null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function isExternalHttpRequest(urlValue) {
  try {
    const url = new URL(urlValue);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
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

async function captureScenario(browser, scenario, shared) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'zh-CN',
  });
  const page = await context.newPage();
  const consoleEvents = [];
  const pageErrors = [];
  const failedRequests = [];
  const externalOrigins = new Set();
  const consoleElementJobs = [];
  let externalRequestCount = 0;
  let stage = 'navigation';

  context.on('request', (request) => {
    const requestUrl = request.url();
    if (isExternalHttpRequest(requestUrl)) {
      externalRequestCount += 1;
      try {
        externalOrigins.add(new URL(requestUrl).origin);
      } catch {
        externalOrigins.add('unparseable-origin');
      }
    }
  });
  page.on('console', (message) => {
    const args = message.args();
    consoleEvents.push({
      stage,
      type: message.type(),
      text: message.text(),
      location: message.location(),
      argCount: args.length,
    });
    for (const handle of args) {
      consoleElementJobs.push(
        handle
          .evaluate((value) => {
            if (!(value instanceof Element)) return null;
            const classNames =
              typeof value.className === 'string' ? value.className : '';
            return {
              tag: value.tagName.toLowerCase(),
              id: value.id || null,
              classes: classNames,
              componentTarget: Boolean(value.closest('.lx-transfer-panel')),
              demoTarget: Boolean(value.closest('.transfer-panel-demo')),
              docShellTarget: Boolean(
                value.closest(
                  '.VPContent, .VPDoc, .VPDocFooter, .VPNav, .VPSidebar, .VPFooter',
                ),
              ),
              text: (value.innerText || value.textContent || '')
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, 180),
            };
          })
          .catch(() => null),
      );
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push({ stage, message: error.message, stack: error.stack ?? null });
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({
      stage,
      url: request.url(),
      failure: request.failure()?.errorText ?? null,
    });
  });

  const record = {
    name: scenario.name,
    requestedPreviewUrl,
    usedPreviewUrl: previewUrl,
    viewport: scenario.viewport,
    requestedTheme: scenario.theme,
    requestedConfirmation: scenario.confirmation,
    startedAt: now(),
    navigation: null,
    preflight: null,
    interactions: [],
    injection: null,
    detectorRan: false,
    overlays: [],
    tokenLikeOverlays: [],
    consoleEvents,
    consoleElementEvidence: null,
    pageErrors,
    failedRequests,
    externalRequestCount: 0,
    externalRequestOrigins: [],
    screenshot: `${scenario.name}.png`,
    screenshotSaved: false,
  };

  try {
    const response = await page.goto(previewUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.locator('.transfer-panel-demo').waitFor({
      state: 'visible',
      timeout: 20000,
    });
    await page.waitForTimeout(1200);
    record.navigation = {
      status: response?.status() ?? null,
      finalUrl: page.url(),
      title: await page.title(),
      componentDemoVisible: true,
    };

    record.preflight = await page.evaluate(() => {
      const previousTitle = document.title;
      const nextTitle = `${previousTitle} [assessment-b-preflight]`;
      document.title = nextTitle;
      const probe = document.createElement('script');
      probe.type = 'application/json';
      probe.dataset.assessmentBPreflight = 'true';
      probe.textContent = '{}';
      document.head.appendChild(probe);
      const result = {
        titleWritable: document.title === nextTitle,
        titleBefore: previousTitle,
        titleAfterWrite: document.title,
        scriptAppendWritable: probe.isConnected,
        scriptTagName: probe.tagName.toLowerCase(),
        scriptType: probe.type,
      };
      probe.remove();
      document.title = previousTitle;
      return result;
    });

    if (!shared.liveServerAttempted) {
      shared.liveServerAttempted = true;
      const started = startLiveServer();
      shared.liveServerInfo = started.info;
      shared.liveServerRecord = started.record;
      writeJson('live-server-start.json', started.record);
    }

    stage = 'state-setup';
    if (scenario.theme === 'hud' || scenario.confirmation) {
      const settings = page.locator('.transfer-panel-demo__settings');
      if (!(await settings.evaluate((element) => element.open))) {
        await settings.locator('summary').click();
      }
      record.interactions.push({ action: 'open-demo-settings', success: true });
      const hudToggle = page.getByLabel('HUD 深色主题');
      if (scenario.theme === 'hud' && !(await hudToggle.isChecked())) {
        await hudToggle.check();
      } else if (scenario.theme === 'light' && (await hudToggle.isChecked())) {
        await hudToggle.uncheck();
      }
      record.interactions.push({
        action: `set-theme-${scenario.theme}`,
        success: (await hudToggle.isChecked()) === (scenario.theme === 'hud'),
      });
    }

    if (scenario.confirmation) {
      const clearButton = page.getByRole('button', {
        name: '全部移除',
        exact: true,
      });
      await clearButton.click({ timeout: 10000 });
      const confirmButton = page.getByRole('button', {
        name: '确认清空',
        exact: true,
      });
      await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
      record.interactions.push({
        action: 'open-clear-confirmation',
        success: true,
        dialogText: (await page.locator('[role="dialog"]').allInnerTexts())
          .join(' ')
          .replace(/\s+/g, ' ')
          .slice(0, 500),
      });
    } else if (scenario.mobileConfirmationAttempt) {
      const clearButton = page.getByRole('button', {
        name: '全部移除',
        exact: true,
      });
      const visible = await clearButton.isVisible().catch(() => false);
      if (visible) {
        await clearButton.click({ timeout: 5000 });
        const confirmButton = page.getByRole('button', {
          name: '确认清空',
          exact: true,
        });
        await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
        record.interactions.push({
          action: 'open-clear-confirmation-mobile',
          success: true,
        });
      } else {
        record.interactions.push({
          action: 'open-clear-confirmation-mobile',
          success: false,
          reason: '全部移除控件在当前 375px 状态不可见',
        });
      }
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    if (shared.liveServerInfo?.port) {
      stage = 'injection';
      const detectorUrl = `http://127.0.0.1:${shared.liveServerInfo.port}/detect.js`;
      try {
        await page.addScriptTag({ url: detectorUrl });
        await page.waitForTimeout(2600);
        const runtime = await page.evaluate(() => ({
          scriptLoaded: typeof window.impeccableScan === 'function',
          overlays: document.querySelectorAll('.impeccable-overlay').length,
        }));
        const detectorConsole = consoleEvents.filter((entry) =>
          entry.text.toLowerCase().includes('[impeccable]'),
        );
        record.injection = {
          success: runtime.scriptLoaded,
          scriptUrl: detectorUrl,
          runtime,
          consoleFindingSignal: detectorConsole.length > 0,
        };
        record.detectorRan = detectorConsole.length > 0;
      } catch (error) {
        record.injection = {
          success: false,
          scriptUrl: detectorUrl,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      record.injection = {
        success: false,
        error: 'Impeccable live-server did not start; detect.js unavailable',
      };
    }

    stage = 'post-injection-inspection';
    const component = page.locator('.lx-transfer-panel').first();
    if (await component.count()) await component.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const overlayData = await page.evaluate(() => {
      const shellSelector =
        '.VPContent, .VPDoc, .VPDocFooter, .VPNav, .VPSidebar, .VPFooter';
      const selectorPath = (element) => {
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
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
      const items = Array.from(
        document.querySelectorAll('.impeccable-overlay'),
      ).map((overlay) => {
        const target = overlay._targetEl || null;
        const label = overlay.querySelector('.impeccable-label');
        const labelText = (label?.innerText || '').trim().replace(/\s+/g, ' ');
        const isBanner = overlay.classList.contains('impeccable-banner');
        const inComponent = Boolean(target?.closest('.lx-transfer-panel'));
        const inDemo = Boolean(target?.closest('.transfer-panel-demo'));
        const inDocsShell = Boolean(target?.closest(shellSelector));
        const text = (target?.innerText || target?.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 180);
        return {
          label: labelText || null,
          isBanner,
          targetExists: Boolean(target),
          targetTag: target?.tagName?.toLowerCase() || null,
          targetId: target?.id || null,
          targetClasses:
            typeof target?.className === 'string' ? target.className : null,
          targetPath: target ? selectorPath(target) : null,
          targetText: text || null,
          componentHit: inComponent,
          demoHitOutsideComponent: inDemo && !inComponent,
          documentationShellHitOutsideDemo: inDocsShell && !inDemo,
        };
      });
      const component = document.querySelector('.lx-transfer-panel');
      const pathFor = (element) => {
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
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
      const wideElements = Array.from(document.querySelectorAll('body *'))
        .map((element) => ({
          element,
          rect: element.getBoundingClientRect(),
        }))
        .filter(
          ({ element, rect }) =>
            rect.width > 0 &&
            (rect.left < -1 || rect.right > innerWidth + 1) &&
            !element.closest('.impeccable-overlay'),
        )
        .sort((a, b) => {
          const overhang = ({ rect }) =>
            Math.max(0, rect.right - innerWidth, -rect.left);
          return overhang(b) - overhang(a);
        })
        .slice(0, 12)
        .map(({ element, rect }) => ({
          path: pathFor(element),
          text: (element.innerText || element.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 100),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        }));
      const dialog = document.querySelector('[role="dialog"]');
      const componentRect = component?.getBoundingClientRect();
      return {
        overlayCount: items.length,
        items,
        docTitle: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        componentBox: component
          ? {
              x: Math.round(componentRect.left),
              right: Math.round(componentRect.right),
              width: Math.round(componentRect.width),
              scrollWidth: component.scrollWidth,
              clientWidth: component.clientWidth,
            }
          : null,
        dialogBox: dialog
          ? {
              x: Math.round(dialog.getBoundingClientRect().left),
              right: Math.round(dialog.getBoundingClientRect().right),
              width: Math.round(dialog.getBoundingClientRect().width),
              scrollWidth: dialog.scrollWidth,
              clientWidth: dialog.clientWidth,
              text: (dialog.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 180),
            }
          : null,
        wideElements,
      };
    });
    record.overlays = overlayData.items;
    record.overlayClassification = overlayData.items.reduce((counts, item) => {
      const zone = item.componentHit
        ? 'component'
        : item.demoHitOutsideComponent
          ? 'demo-only'
          : item.documentationShellHitOutsideDemo
            ? 'documentation'
            : item.isBanner
              ? 'page-banner'
              : !item.targetExists
                ? 'no-target'
                : 'other';
      const key = `${item.label ?? '(no label)'} | ${zone}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    record.tokenLikeOverlays = overlayData.items.filter((item) =>
      /color|contrast|gradient|font|typography|spacing|radius|border|shadow|palette/i.test(
        item.label ?? '',
      ),
    );
    record.layout = {
      overlayCount: overlayData.overlayCount,
      horizontalOverflow: overlayData.horizontalOverflow,
      bodyScrollWidth: overlayData.bodyScrollWidth,
      bodyClientWidth: overlayData.bodyClientWidth,
      viewport: overlayData.viewport,
      componentBox: overlayData.componentBox,
      dialogBox: overlayData.dialogBox,
      wideElements: overlayData.wideElements,
    };

    const consoleElements = await Promise.allSettled(consoleElementJobs);
    record.consoleElementEvidence = consoleElements
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value);
    record.detectorConsole = consoleEvents.filter((entry) =>
      entry.text.toLowerCase().includes('[impeccable]'),
    );
    record.browserWarningsAndErrors = consoleEvents.filter(
      (entry) => entry.type === 'warning' || entry.type === 'error',
    );
    record.externalRequestCount = externalRequestCount;
    record.externalRequestOrigins = [...externalOrigins].sort();
    record.screenshotSaved = true;
    await page.screenshot({
      path: path.join(outputDir, record.screenshot),
      fullPage: false,
      animations: 'disabled',
    });
    record.finishedAt = now();
  } catch (error) {
    record.failedAtStage = stage;
    record.error = error instanceof Error ? error.message : String(error);
    record.finishedAt = now();
  } finally {
    record.externalRequestCount = externalRequestCount;
    record.externalRequestOrigins = [...externalOrigins].sort();
    await context.close().catch(() => {});
  }

  return record;
}

const summary = {
  assessment: 'B',
  target: 'linkx-fe/src/components/LxTransferPanel/index.vue',
  requestedPreviewUrl,
  usedPreviewUrl: previewUrl,
  startedAt: now(),
  ignoreFile: {
    path: '.impeccable/critique/ignore.md',
    exists: fs.existsSync(path.join(repoRoot, '.impeccable', 'critique', 'ignore.md')),
  },
  detectorScans: [],
  liveServerStart: null,
  scenarios: [],
  liveServerStop: null,
  browserLaunched: false,
  fatalError: null,
};

let browser;
const shared = {
  liveServerAttempted: false,
  liveServerInfo: null,
  liveServerRecord: null,
};

try {
  summary.detectorScans.push(
    captureDetector(
      'linkx-fe/src/components/LxTransferPanel/index.vue',
      'detector-component',
    ),
  );
  summary.detectorScans.push(
    captureDetector(
      'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
      'detector-basic-demo',
    ),
  );

  const browserChannel = 'msedge';
  browser = await chromium.launch({ headless: true, channel: browserChannel });
  summary.browserLaunched = true;
  summary.browser = {
    name: 'Playwright Chromium API with system Edge channel',
    channel: browserChannel,
    isolatedBrowserProcess: true,
    perScenarioNewContextAndPage: true,
  };

  const scenarios = [
    {
      name: 'desktop-light',
      viewport: { width: 1440, height: 1100 },
      theme: 'light',
      confirmation: false,
    },
    {
      name: 'hud-confirmation-desktop',
      viewport: { width: 1440, height: 1100 },
      theme: 'hud',
      confirmation: true,
    },
    {
      name: 'hud-375-mobile',
      viewport: { width: 375, height: 900 },
      theme: 'hud',
      confirmation: false,
      mobileConfirmationAttempt: true,
    },
  ];

  for (const scenario of scenarios) {
    const record = await captureScenario(browser, scenario, shared);
    summary.scenarios.push(record);
    writeJson('browser-evidence.json', summary);
  }
} catch (error) {
  summary.fatalError = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  if (browser) await browser.close().catch(() => {});

  if (shared.liveServerRecord) {
    summary.liveServerStart = shared.liveServerRecord;
  }
  if (shared.liveServerRecord?.startSucceeded) {
    summary.liveServerStop = stopLiveServer();
    writeJson('live-server-stop.json', summary.liveServerStop);
  } else if (shared.liveServerAttempted) {
    summary.liveServerStop = {
      skipped: true,
      reason: '本次启动命令未确认启动了服务，因此不触碰可能属于他人的进程',
    };
  }

  summary.finishedAt = now();
  writeJson('browser-evidence.json', summary);
  writeJson('assessment-b-evidence.json', summary);
}

console.log(
  JSON.stringify(
    {
      detectorScans: summary.detectorScans.map((scan) => ({
        target: scan.target,
        exitCode: scan.exitCode,
        jsonParseable: scan.jsonParseable,
        jsonRootType: scan.jsonRootType,
        jsonRootIsEmptyArray: scan.jsonRootIsEmptyArray,
        findingsCount: scan.findingsCount,
        clean: scan.clean,
      })),
      browserLaunched: summary.browserLaunched,
      scenarios: summary.scenarios.map((scenario) => ({
        name: scenario.name,
        injectionSuccess: scenario.injection?.success ?? false,
        detectorRan: scenario.detectorRan,
        overlayCount: scenario.overlays?.length ?? 0,
        externalRequestCount: scenario.externalRequestCount,
        screenshotSaved: scenario.screenshotSaved,
        error: scenario.error ?? null,
      })),
      liveServerStart: summary.liveServerStart,
      liveServerStop: summary.liveServerStop,
      fatalError: summary.fatalError,
    },
    null,
    2,
  ),
);

if (summary.fatalError) process.exitCode = 1;
