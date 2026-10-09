import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outDir, '..', '..', '..', '..');
const playwrightPath = path.join(repoRoot, 'other-admin', 'admin-vue3', 'node_modules', '@playwright', 'test', 'index.mjs');
const browserPath = process.argv[2] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const targetUrl = process.argv[3] ?? 'http://127.0.0.1:4177/components/lxtransferpanel';
const detectorUrl = process.argv[4] ?? null;
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const views = [
  { id: 'desktop-light', viewport: { width: 1440, height: 960 }, hud: false, keyboard: false },
  { id: 'desktop-hud', viewport: { width: 1440, height: 960 }, hud: true, keyboard: false },
  { id: 'mobile-320', viewport: { width: 320, height: 740 }, hud: false, keyboard: false },
  { id: 'mobile-390', viewport: { width: 390, height: 844 }, hud: false, keyboard: false },
  { id: 'desktop-keyboard', viewport: { width: 1440, height: 960 }, hud: false, keyboard: true },
];

const browser = await chromium.launch({ headless: true, executablePath: browserPath });
const evidence = {
  capturedAt: new Date().toISOString(),
  targetUrl,
  browser: { name: 'Microsoft Edge via Playwright Chromium', executablePath: browserPath, version: browser.version() },
  detectorUrl,
  views: [],
};

for (const view of views) {
  const context = await browser.newContext({
    viewport: view.viewport,
    colorScheme: 'light',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleEntries = [];
  const consoleArgumentReads = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => {
    const entry = { type: message.type(), text: message.text(), args: [] };
    consoleEntries.push(entry);
    consoleArgumentReads.push(Promise.all(message.args().map(async (handle) => {
      try {
        return await handle.jsonValue();
      } catch (error) {
        return { serializationError: error.message };
      }
    })).then((args) => { entry.args = args; }));
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null });
  });

  const viewEvidence = {
    id: view.id,
    viewport: view.viewport,
    navigation: null,
    preflight: null,
    hudToggle: null,
    keyboard: null,
    dimensions: null,
    longText: [],
    detectorInjection: { attempted: Boolean(detectorUrl), loaded: false, ran: false, error: null, consoleFindings: [], browserFindings: null, overlayObserved: false },
    screenshots: [],
    consoleErrors: [],
    pageErrors,
    failedRequests,
  };

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    viewEvidence.navigation = { status: response?.status() ?? null, url: page.url(), title: await page.title() };

    viewEvidence.preflight = await page.evaluate(() => {
      document.title = `${document.title} [Assessment B]`;
      const script = document.createElement('script');
      script.dataset.assessmentBPreflight = 'true';
      script.textContent = 'window.__assessmentBPreflight = true;';
      document.head.appendChild(script);
      return {
        titleSet: document.title.endsWith('[Assessment B]'),
        scriptAppended: script.isConnected,
        inlineScriptRan: window.__assessmentBPreflight === true,
      };
    });

    const demo = page.locator('.transfer-panel-demo');
    await demo.waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded();

    if (view.hud) {
      await page.locator('summary').filter({ hasText: '示例状态与主题' }).evaluate((element) => { element.parentElement.open = true; });
      const toggle = page.getByLabel('HUD 深色主题');
      await toggle.check();
      viewEvidence.hudToggle = { found: true, checked: await toggle.isChecked() };
    } else {
      viewEvidence.hudToggle = { found: await page.getByLabel('HUD 深色主题').count() > 0, checked: false };
    }

    if (view.keyboard) {
      const instruction = await page.locator('.lx-transfer-panel__keyboard-hint').first().textContent().catch(() => null);
      const treeItems = page.getByRole('treeitem');
      const count = await treeItems.count();
      const selectedCount = page.getByTestId('selected-count');
      const beforeCount = await selectedCount.textContent().catch(() => null);
      let beforeKey = null;
      let afterArrow = null;
      let afterSpace = null;
      let afterEnter = null;
      if (count > 0) {
        await treeItems.first().focus();
        beforeKey = await page.evaluate(() => document.activeElement?.getAttribute('data-lx-tree-key'));
        await page.keyboard.press('ArrowDown');
        afterArrow = await page.evaluate(() => document.activeElement?.getAttribute('data-lx-tree-key'));
        await page.keyboard.press('Space');
        await page.waitForTimeout(150);
        afterSpace = await selectedCount.textContent().catch(() => null);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(150);
        afterEnter = await selectedCount.textContent().catch(() => null);
      }
      viewEvidence.keyboard = {
        instruction,
        treeItemCount: count,
        selectedCountBefore: beforeCount,
        focusedKeyBefore: beforeKey,
        focusedKeyAfterArrowDown: afterArrow,
        selectedCountAfterSpace: afterSpace,
        selectedCountAfterEnter: afterEnter,
        arrowMovedFocus: beforeKey !== null && afterArrow !== null && beforeKey !== afterArrow,
        selectionChangedBySpaceOrEnter: beforeCount !== null && (beforeCount !== afterSpace || beforeCount !== afterEnter),
      };
    }

    await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded();
    viewEvidence.dimensions = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const root = document.documentElement;
      const body = document.body;
      const component = document.querySelector('.lx-transfer-panel');
      const overflowing = [...document.querySelectorAll('body *')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className : '',
            text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            overflowX: style.overflowX,
          };
        })
        .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1 || item.scrollWidth > item.clientWidth + 2))
        .slice(0, 25);
      return {
        viewportWidth,
        documentClientWidth: root.clientWidth,
        documentScrollWidth: root.scrollWidth,
        bodyClientWidth: body.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        pageHorizontalOverflow: root.scrollWidth > root.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1,
        componentRect: component ? (() => { const r = component.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; })() : null,
        overflowCandidates: overflowing,
      };
    });
    viewEvidence.longText = await page.evaluate(() => {
      const root = document.querySelector('.lx-transfer-panel');
      if (!root) return [];
      return [...root.querySelectorAll('[title], [aria-label], .lx-virtual-tree__label, .lx-transfer-panel__selected-name')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = (element.getAttribute('title') || element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ');
          return {
            selector: element.className?.toString?.() || element.tagName.toLowerCase(),
            text: text.slice(0, 100),
            textLength: text.length,
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            rectWidth: Math.round(rect.width),
            visiblyClipped: element.scrollWidth > element.clientWidth + 1,
          };
        })
        .filter((item) => item.textLength > 18)
        .slice(0, 30);
    });

    const screenshotName = `${view.id}.png`;
    const screenshotPath = path.join(outDir, 'screenshots', screenshotName);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: false });
    viewEvidence.screenshots.push(screenshotName);

    if (detectorUrl) {
      try {
        const markerCountBefore = await page.evaluate(() => document.querySelectorAll('[class*="impeccable"], [id*="impeccable"], canvas').length);
        const pageErrorCountBefore = pageErrors.length;
        await page.addScriptTag({ url: detectorUrl, timeout: 12000 });
        viewEvidence.detectorInjection.loaded = true;
        await page.waitForTimeout(2800);
        viewEvidence.detectorInjection.consoleFindings = consoleEntries
          .filter((entry) => /impeccable/i.test(entry.text))
          .map((entry) => ({ type: entry.type, text: entry.text, args: entry.args }));
        viewEvidence.detectorInjection.browserFindings = await page.evaluate(() => {
          return typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null;
        });
        const detectorRuntime = await page.evaluate(() => {
          const script = [...document.scripts].some((item) => item.src.includes('/detect.js'));
          const markers = document.querySelectorAll('[class*="impeccable"], [id*="impeccable"], canvas').length;
          return { script, markers };
        });
        viewEvidence.detectorInjection.ran = detectorRuntime.script && pageErrors.length === pageErrorCountBefore;
        viewEvidence.detectorInjection.overlayObserved = detectorRuntime.script && detectorRuntime.markers > markerCountBefore;
        if (viewEvidence.detectorInjection.overlayObserved) {
          const overlayName = `${view.id}-detector-overlay.png`;
          await page.screenshot({ path: path.join(outDir, 'screenshots', overlayName), fullPage: false });
          viewEvidence.screenshots.push(overlayName);
        }
      } catch (error) {
        viewEvidence.detectorInjection.error = error.message;
      }
    }
  } catch (error) {
    viewEvidence.error = error.message;
  }

  await Promise.all(consoleArgumentReads);
  viewEvidence.detectorInjection.consoleFindings = consoleEntries
    .filter((entry) => /impeccable/i.test(entry.text))
    .map((entry) => ({ type: entry.type, text: entry.text, args: entry.args }));
  viewEvidence.consoleErrors = consoleEntries.filter((entry) => entry.type === 'error');
  viewEvidence.consoleMessages = consoleEntries;
  evidence.views.push(viewEvidence);
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  browser: evidence.browser,
  views: evidence.views.map((view) => ({
    id: view.id,
    status: view.navigation?.status ?? null,
    screenshotCount: view.screenshots.length,
    pageHorizontalOverflow: view.dimensions?.pageHorizontalOverflow ?? null,
    injected: view.detectorInjection.loaded,
    overlayObserved: view.detectorInjection.overlayObserved,
    injectionError: view.detectorInjection.error,
    error: view.error ?? null,
  })),
}, null, 2)}\n`);
