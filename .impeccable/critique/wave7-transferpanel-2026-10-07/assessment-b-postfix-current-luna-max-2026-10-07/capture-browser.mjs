import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(evidenceDir, 'screenshots');
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const detectorUrl = 'http://127.0.0.1:8489/detect.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const scenarios = [
  { id: 'desktop-light-ready-unloaded', width: 1440, height: 1000, state: 'ready', theme: 'light' },
  { id: 'desktop-hud-ready-unloaded', width: 1440, height: 1000, state: 'ready', theme: 'hud' },
  { id: 'desktop-loading-light', width: 1440, height: 1000, state: 'loading', theme: 'light' },
  { id: 'desktop-error-light', width: 1440, height: 1000, state: 'error', theme: 'light' },
  { id: 'desktop-empty-light', width: 1440, height: 1000, state: 'empty', theme: 'light' },
  { id: 'desktop-filter-light', width: 1440, height: 1000, state: 'ready', theme: 'light', filter: '情指行' },
  { id: 'desktop-keyboard-focus-light', width: 1440, height: 1000, state: 'ready', theme: 'light', keyboardFocus: true },
  { id: 'mobile-375-light-ready-unloaded', width: 375, height: 900, state: 'ready', theme: 'light' },
];

const stateButton = {
  ready: '正常数据',
  loading: '加载中',
  error: '加载失败',
  empty: '空结果',
};

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--no-sandbox'],
});

const evidence = {
  targetUrl,
  detectorUrl,
  browser: { name: 'Playwright Chromium', version: browser.version(), executablePath: chromePath },
  contextCount: 0,
  pageCount: 0,
  preflight: null,
  scenarios: [],
  collectedAt: new Date().toISOString(),
};

for (const scenario of scenarios) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  });
  evidence.contextCount += 1;
  const page = await context.newPage();
  evidence.pageCount += 1;

  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() });
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url() });
  });

  const scenarioEvidence = {
    id: scenario.id,
    viewport: { width: scenario.width, height: scenario.height },
    requestedState: scenario.state,
    requestedTheme: scenario.theme,
    filter: scenario.filter ?? null,
    keyboardFocusRequested: Boolean(scenario.keyboardFocus),
    navigation: null,
    preflight: null,
    observed: null,
    detector: null,
    screenshots: {},
    consoleMessages,
    pageErrors,
    failedRequests,
    badResponses,
  };

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    scenarioEvidence.navigation = { status: response?.status() ?? null, url: page.url(), title: await page.title() };
    await page.getByRole('button', { name: '正常数据', exact: true }).waitFor({ timeout: 45000 });
    await page.locator('.lx-transfer-panel').waitFor({ state: 'visible', timeout: 45000 });

    const preflight = await page.evaluate(() => {
      const originalTitle = document.title;
      window.__impeccableInjectionPreflightRan = false;
      document.title = `${originalTitle} [injection-preflight]`;
      const script = document.createElement('script');
      script.textContent = 'window.__impeccableInjectionPreflightRan = true;';
      document.head.appendChild(script);
      const result = {
        titleChanged: document.title === `${originalTitle} [injection-preflight]`,
        inlineScriptExecuted: window.__impeccableInjectionPreflightRan === true,
      };
      script.remove();
      document.title = originalTitle;
      return result;
    });
    scenarioEvidence.preflight = preflight;
    if (scenario.id === scenarios[0].id) evidence.preflight = preflight;

    const settings = page.locator('.transfer-panel-demo__settings');
    if (!(await settings.evaluate((element) => element.open))) {
      await settings.locator('summary').click();
    }
    await page.getByRole('button', { name: stateButton[scenario.state], exact: true }).click();
    if (scenario.theme === 'hud') {
      await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    }
    if (scenario.filter) {
      await page.getByRole('textbox', { name: '筛选待选节点' }).fill(scenario.filter);
      await page.waitForTimeout(400);
    }
    if (scenario.keyboardFocus) {
      const input = page.getByRole('textbox', { name: '筛选待选节点' });
      await input.focus();
      await page.keyboard.press('ArrowLeft');
    }

    await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const observed = await page.evaluate(() => {
      const demo = document.querySelector('.transfer-panel-demo');
      const panel = document.querySelector('.lx-transfer-panel');
      const tree = panel?.querySelector('[aria-label="待选资源树"]');
      const selected = panel?.querySelector('.lx-transfer-panel__selected');
      const active = document.activeElement;
      return {
        documentTitle: document.title,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        hostStatus: demo?.querySelector('.transfer-panel-demo__status')?.innerText ?? '',
        selectedCountText: demo?.querySelector('[data-testid="selected-count"]')?.innerText ?? '',
        treeCountText: demo?.querySelector('[data-testid="tree-node-count"]')?.innerText ?? '',
        alertText: demo?.querySelector('[role="alert"]')?.innerText ?? '',
        loadingText: demo?.querySelector('[role="status"]')?.innerText ?? '',
        ariaBusy: demo?.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy'),
        inert: panel?.hasAttribute('inert') ?? false,
        hudTheme: demo?.classList.contains('lx-theme-hud') ?? false,
        filterValue: panel?.querySelector('[aria-label="筛选待选节点"]')?.value ?? '',
        visibleTreeText: tree?.innerText?.slice(0, 500) ?? '',
        selectedListText: selected?.innerText?.slice(0, 1000) ?? '',
        legacySelected: selected?.innerText?.includes('历史授权单位（记录中）') ?? false,
        legacyInTree: tree?.innerText?.includes('历史授权单位（记录中）') ?? false,
        missingNodeMarker: selected?.innerText?.includes('节点未加载') ?? false,
        focusedElement: active ? {
          tag: active.tagName,
          ariaLabel: active.getAttribute?.('aria-label') ?? null,
          text: active.innerText?.slice(0, 120) ?? active.value ?? '',
          focusVisible: active.matches?.(':focus-visible') ?? false,
        } : null,
        demoTextSample: demo?.innerText?.slice(0, 250) ?? '',
      };
    });
    scenarioEvidence.observed = observed;

    const cleanPath = path.join(screenshotsDir, `${scenario.id}.png`);
    await page.screenshot({ path: cleanPath, animations: 'disabled' });
    scenarioEvidence.screenshots.clean = path.relative(evidenceDir, cleanPath).replaceAll(path.sep, '/');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const injected = await page.addScriptTag({ url: detectorUrl });
    await page.waitForTimeout(2800);
    const overlayEvidence = await page.evaluate(() => {
      const overlays = [...document.querySelectorAll('.impeccable-overlay')];
      const classify = (target) => {
        if (!target) return 'banner/page-level';
        if (target.closest('.lx-transfer-panel')) return 'LxTransferPanel component';
        if (target.closest('.transfer-panel-demo')) return 'LxTransferPanel demo host';
        if (target.closest('.vp-doc')) return 'VitePress article';
        if (target.closest('.VPSidebar, .VPNav, .VPContent, .VPFooter, .VPDoc')) return 'VitePress shell';
        return 'other page content';
      };
      return {
        detectScriptPresent: [...document.scripts].some((script) => script.src.includes('/detect.js')),
        impeccableGlobals: Object.getOwnPropertyNames(window).filter((key) => /impeccable/i.test(key)),
        overlayCount: overlays.length,
        issueOverlays: overlays
          .filter((overlay) => !overlay.classList.contains('impeccable-banner'))
          .map((overlay) => {
            const target = overlay._targetEl ?? null;
            return {
              className: overlay.className,
              label: overlay.innerText?.trim().slice(0, 240) ?? '',
              target: target ? {
                tag: target.tagName,
                id: target.id,
                className: typeof target.className === 'string' ? target.className : '',
                text: target.innerText?.trim().slice(0, 180) ?? '',
                category: classify(target),
              } : null,
            };
          }),
        bannerText: document.querySelector('.impeccable-banner')?.innerText?.trim() ?? '',
      };
    });
    const impeccableConsole = consoleMessages.filter((message) => /\[impeccable\]/i.test(message.text));
    scenarioEvidence.detector = {
      scriptTagAdded: Boolean(injected),
      scriptPresent: overlayEvidence.detectScriptPresent,
      ranConfirmed: impeccableConsole.length > 0 || overlayEvidence.overlayCount > 0 || overlayEvidence.impeccableGlobals.length > 0,
      consoleMessages: impeccableConsole,
      overlay: overlayEvidence,
    };
    const overlayPath = path.join(screenshotsDir, `${scenario.id}-overlay.png`);
    await page.screenshot({ path: overlayPath, animations: 'disabled' });
    scenarioEvidence.screenshots.overlay = path.relative(evidenceDir, overlayPath).replaceAll(path.sep, '/');
  } catch (error) {
    scenarioEvidence.error = error.stack ?? error.message;
  } finally {
    evidence.scenarios.push(scenarioEvidence);
    await context.close();
  }
}

await browser.close();
evidence.completedAt = new Date().toISOString();
const outputPath = path.join(evidenceDir, 'browser-evidence', 'browser-evidence.json');
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  browser: evidence.browser,
  contextCount: evidence.contextCount,
  pageCount: evidence.pageCount,
  preflight: evidence.preflight,
  scenarios: evidence.scenarios.map((scenario) => ({
    id: scenario.id,
    navigationStatus: scenario.navigation?.status,
    error: scenario.error ?? null,
    detectorRan: scenario.detector?.ranConfirmed ?? false,
    overlayCount: scenario.detector?.overlay?.overlayCount ?? null,
    impeccableConsole: scenario.detector?.consoleMessages?.map((message) => message.text) ?? [],
  })),
  outputPath,
}, null, 2)}\n`);
