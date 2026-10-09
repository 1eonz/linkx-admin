import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(evidenceDir, 'screenshots', 'final-recheck');
fs.mkdirSync(screenshotsDir, { recursive: true });
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const detectorUrl = 'http://127.0.0.1:8491/detect.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const scenarios = [
  { id: 'desktop-light-default', width: 1440, height: 1000, state: 'ready', theme: 'light' },
  { id: 'desktop-hud', width: 1440, height: 1000, state: 'ready', theme: 'hud' },
  { id: 'desktop-empty', width: 1440, height: 1000, state: 'empty', theme: 'light' },
  { id: 'desktop-loading', width: 1440, height: 1000, state: 'loading', theme: 'light' },
  { id: 'desktop-error', width: 1440, height: 1000, state: 'error', theme: 'light' },
  { id: 'mobile-375-keyboard-focus', width: 375, height: 900, state: 'ready', theme: 'light', mobile: true, keyboardFocus: true },
  { id: 'desktop-reduced-motion', width: 1440, height: 1000, state: 'ready', theme: 'light', reducedMotion: 'reduce' },
];

const stateButton = { ready: '正常数据', empty: '空结果', loading: '加载中', error: '加载失败' };
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--no-sandbox'],
});

const evidence = {
  targetUrl,
  detectorUrl,
  browser: { name: 'Playwright Chromium', version: browser.version(), executablePath: chromePath },
  independentContextCount: 0,
  pageCount: 0,
  scenarios: [],
};

for (const scenario of scenarios) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    isMobile: Boolean(scenario.mobile),
    hasTouch: Boolean(scenario.mobile),
  });
  evidence.independentContextCount += 1;
  const page = await context.newPage();
  evidence.pageCount += 1;

  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url() });
  });

  const record = {
    id: scenario.id,
    requested: {
      viewport: { width: scenario.width, height: scenario.height },
      state: scenario.state,
      theme: scenario.theme,
      reducedMotion: scenario.reducedMotion ?? 'no-preference',
      keyboardFocus: Boolean(scenario.keyboardFocus),
    },
    navigation: null,
    injectionPreflight: null,
    observed: null,
    detector: null,
    screenshots: {},
    consoleMessages,
    pageErrors,
    failedRequests,
    badResponses,
  };

  try {
    if (scenario.reducedMotion) await page.emulateMedia({ reducedMotion: scenario.reducedMotion });
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    record.navigation = { status: response?.status() ?? null, url: page.url(), title: await page.title() };
    await page.locator('.transfer-panel-demo').waitFor({ state: 'visible', timeout: 45000 });
    await page.locator('.lx-transfer-panel').waitFor({ state: 'visible', timeout: 45000 });

    record.injectionPreflight = await page.evaluate(() => {
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

    const settings = page.locator('.transfer-panel-demo__settings');
    if (!(await settings.evaluate((element) => element.open))) await settings.locator('summary').click();
    await page.getByRole('button', { name: '正常数据', exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: stateButton[scenario.state], exact: true }).click();
    if (scenario.theme === 'hud') await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();

    if (scenario.keyboardFocus) {
      const search = page.locator('input[aria-label="筛选待选节点"]');
      await search.fill('情指行');
      await search.focus();
      await page.keyboard.press('Tab');
    }

    await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    record.observed = await page.evaluate(() => {
      const demo = document.querySelector('.transfer-panel-demo');
      const surface = demo?.querySelector('.transfer-panel-demo__surface');
      const panel = demo?.querySelector('.lx-transfer-panel');
      const tree = panel?.querySelector('[aria-label="待选资源树"]');
      const selected = panel?.querySelector('.lx-transfer-panel__selected');
      const active = document.activeElement;
      const selectedRows = [...(panel?.querySelectorAll('.lx-transfer-panel__selected-item') ?? [])].map((row) => {
        const rect = row.getBoundingClientRect();
        return { text: row.innerText.trim().slice(0, 160), height: Math.round(rect.height * 100) / 100, scrollHeight: row.scrollHeight };
      });
      return {
        title: document.title,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        statusText: demo?.querySelector('.transfer-panel-demo__status')?.innerText ?? '',
        selectedCountText: demo?.querySelector('[data-testid="selected-count"]')?.innerText ?? '',
        treeCountText: demo?.querySelector('[data-testid="tree-node-count"]')?.innerText ?? '',
        alertText: demo?.querySelector('[role="alert"]')?.innerText ?? '',
        loadingText: demo?.querySelector('[role="status"]')?.innerText ?? '',
        ariaBusy: surface?.getAttribute('aria-busy'),
        inert: panel?.hasAttribute('inert') ?? false,
        hudTheme: demo?.classList.contains('lx-theme-hud') ?? false,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        filterValue: panel?.querySelector('[aria-label="筛选待选节点"]')?.value ?? '',
        visibleTreeText: tree?.innerText?.slice(0, 450) ?? '',
        selectedListText: selected?.innerText?.slice(0, 900) ?? '',
        selectedRows,
        legacyAuthorizationSelected: selected?.innerText?.includes('历史授权单位（记录中）') ?? false,
        legacyAuthorizationInTree: tree?.innerText?.includes('历史授权单位（记录中）') ?? false,
        missingNodeMarker: selected?.innerText?.includes('节点未加载') ?? false,
        activeElement: active ? {
          tag: active.tagName,
          ariaLabel: active.getAttribute?.('aria-label') ?? null,
          text: active.innerText?.trim().slice(0, 120) ?? active.value ?? '',
          focusVisible: active.matches?.(':focus-visible') ?? false,
          outlineStyle: getComputedStyle(active).outlineStyle,
          outlineWidth: getComputedStyle(active).outlineWidth,
        } : null,
      };
    });

    const cleanScreenshot = path.join(screenshotsDir, `${scenario.id}.png`);
    await page.screenshot({ path: cleanScreenshot, animations: 'disabled' });
    record.screenshots.clean = path.relative(evidenceDir, cleanScreenshot).replaceAll(path.sep, '/');

    const detectorSignal = page.waitForEvent('console', {
      predicate: (message) => /\[impeccable\]/i.test(message.text()),
      timeout: 18000,
    }).catch(() => null);
    const scriptHandle = await page.addScriptTag({ url: detectorUrl });
    const consoleSignal = await detectorSignal;
    if (!consoleSignal) await page.waitForTimeout(1500);
    else await page.waitForTimeout(500);

    const overlay = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.impeccable-overlay')];
      const classify = (target) => {
        if (!target) return 'page-level banner';
        if (target.closest('.lx-transfer-panel')) return 'LxTransferPanel component';
        if (target.closest('.transfer-panel-demo')) return 'LxTransferPanel demo host';
        if (target.closest('.vp-doc')) return 'VitePress article';
        if (target.closest('.VPNav, .VPSidebar, .VPContent, .VPFooter, .VPDoc')) return 'VitePress shell';
        return 'other page content';
      };
      return {
        scriptPresent: [...document.scripts].some((script) => script.src.includes('/detect.js')),
        impeccableGlobals: Object.getOwnPropertyNames(window).filter((name) => /impeccable/i.test(name)),
        totalOverlayNodes: all.length,
        issueOverlayCount: all.filter((item) => !item.classList.contains('impeccable-banner')).length,
        labelCount: document.querySelectorAll('.impeccable-label').length,
        bannerText: document.querySelector('.impeccable-banner')?.innerText?.trim() ?? '',
        issueOverlays: all
          .filter((item) => !item.classList.contains('impeccable-banner'))
          .map((item) => {
            const target = item._targetEl ?? null;
            return {
              label: item.querySelector('.impeccable-label')?.innerText?.trim().slice(0, 240) ?? item.innerText?.trim().slice(0, 240) ?? '',
              target: target ? {
                tag: target.tagName,
                id: target.id,
                className: typeof target.className === 'string' ? target.className : '',
                text: target.innerText?.trim().slice(0, 180) ?? '',
                category: classify(target),
              } : null,
            };
          }),
      };
    });
    const impeccableConsole = consoleMessages.filter((message) => /\[impeccable\]/i.test(message.text));
    record.detector = {
      scriptTagAdded: Boolean(scriptHandle),
      scriptPresent: overlay.scriptPresent,
      ranConfirmed: impeccableConsole.length > 0 || overlay.totalOverlayNodes > 0 || overlay.impeccableGlobals.length > 0,
      consoleMessages: impeccableConsole,
      overlay,
    };

    const overlayScreenshot = path.join(screenshotsDir, `${scenario.id}-overlay.png`);
    await page.screenshot({ path: overlayScreenshot, animations: 'disabled' });
    record.screenshots.overlay = path.relative(evidenceDir, overlayScreenshot).replaceAll(path.sep, '/');
  } catch (error) {
    record.error = error.stack ?? error.message;
  } finally {
    evidence.scenarios.push(record);
    process.stdout.write(`${JSON.stringify({ id: scenario.id, navigationStatus: record.navigation?.status, error: record.error ?? null, detectorRan: record.detector?.ranConfirmed ?? false, issueOverlayCount: record.detector?.overlay?.issueOverlayCount ?? null })}\n`);
    await context.close();
  }
}

await browser.close();
evidence.completedAt = new Date().toISOString();
const outputPath = path.join(evidenceDir, 'browser-evidence', 'browser-evidence-final-recheck.json');
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
const failed = evidence.scenarios.some((scenario) => scenario.error || scenario.detector?.ranConfirmed !== true);
if (failed) process.exitCode = 2;
