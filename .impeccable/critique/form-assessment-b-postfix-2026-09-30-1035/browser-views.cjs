const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const outputRoot = path.join(__dirname, 'browser');
const detectorUrl = 'http://localhost:8400/detect.js';
const views = [
  { id: 'lxform-desktop', page: 'lxform', url: 'http://localhost:4177/components/lxform', width: 1280, height: 800 },
  { id: 'lxform-mobile', page: 'lxform', url: 'http://localhost:4177/components/lxform', width: 375, height: 812, mobile: true },
  { id: 'lxdynamicform-desktop', page: 'lxdynamicform', url: 'http://localhost:4177/components/lxdynamicform', width: 1280, height: 800 },
  { id: 'lxdynamicform-mobile', page: 'lxdynamicform', url: 'http://localhost:4177/components/lxdynamicform', width: 375, height: 812, mobile: true },
  { id: 'lxdynamicform-hud-dark-reduced-motion', page: 'lxdynamicform', url: 'http://localhost:4177/components/lxdynamicform', width: 1280, height: 800, hudDark: true, reducedMotion: true },
];
const staticResourceTypes = new Set(['document', 'stylesheet', 'script', 'image', 'font', 'media', 'manifest', 'texttrack']);
const requestedViewIds = new Set(process.argv.slice(2));
const selectedViews = requestedViewIds.size ? views.filter((view) => requestedViewIds.has(view.id)) : views;
if (requestedViewIds.size && selectedViews.length !== requestedViewIds.size) throw new Error('Unknown view id requested.');

async function inspectView(browser, view) {
  const outputDir = path.join(outputRoot, view.id);
  fs.mkdirSync(outputDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(view.mobile),
    hasTouch: Boolean(view.mobile),
    reducedMotion: view.reducedMotion ? 'reduce' : 'no-preference',
  });
  const blockedRequests = [];
  const consoleEvents = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  const detectorResponses = [];
  await context.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const isReadOnlyStatic = ['GET', 'HEAD'].includes(request.method())
      && staticResourceTypes.has(request.resourceType())
      && requestUrl.origin === 'http://localhost:4177';
    const isDetectorScript = request.method() === 'GET' && request.url() === detectorUrl;
    if (isReadOnlyStatic || isDetectorScript) return route.continue();
    blockedRequests.push({ method: request.method(), resourceType: request.resourceType(), url: request.url(), reason: 'blocked by evidence harness' });
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('console', (message) => consoleEvents.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on('pageerror', (error) => pageErrors.push({ message: error.message, stack: error.stack ?? null }));
  page.on('requestfailed', (request) => failedRequests.push({ method: request.method(), resourceType: request.resourceType(), url: request.url(), failure: request.failure()?.errorText ?? null }));
  page.on('response', (response) => {
    if (response.url() === detectorUrl) detectorResponses.push({ status: response.status(), url: response.url() });
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url(), method: response.request().method() });
  });

  let navigationStatus = null;
  let injectionError = null;
  let overlayInjected = false;
  let detectorFindings = null;
  let interactionState = null;
  let uploadState = null;
  try {
    const response = await page.goto(view.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    navigationStatus = response?.status() ?? null;
    await page.waitForTimeout(900);

    const targetHeading = view.page === 'lxform'
      ? page.locator('h2').filter({ hasText: '基础校验表单' }).first()
      : page.locator('h2').filter({ hasText: '交互示例' }).first();
    await targetHeading.scrollIntoViewIfNeeded();

    if (view.hudDark) {
      const settings = page.locator('details.dynamic-form-demo__settings');
      const isOpen = await settings.evaluate((element) => element.open);
      if (!isOpen) await settings.locator('summary').click();
      const themeCheckbox = settings.locator('input[type="checkbox"]').nth(1);
      if (!(await themeCheckbox.isChecked())) await settings.locator('label.el-checkbox').nth(1).click();
      await page.waitForTimeout(250);
    }

    await page.getByRole('button', { name: '提交校验', exact: true }).first().click({ timeout: 7000 });
    await page.waitForFunction(() => document.querySelector('.el-form-item.is-error .el-form-item__error'), null, { timeout: 6000 });
    await page.waitForTimeout(300);
    interactionState = await page.evaluate(() => {
      const active = document.activeElement;
      const activeItem = active?.closest?.('.el-form-item');
      const style = active ? getComputedStyle(active) : null;
      const invalidItems = [...document.querySelectorAll('.el-form-item.is-error')].map((item) => ({
        label: item.querySelector('.el-form-item__label')?.innerText?.trim() ?? null,
        error: item.querySelector('.el-form-item__error')?.innerText?.trim() ?? null,
        ariaInvalid: item.querySelector('[aria-invalid="true"]') !== null,
        ariaDescribedBy: item.querySelector('[aria-describedby]')?.getAttribute('aria-describedby') ?? null,
      }));
      const uploadZones = [...document.querySelectorAll('.el-upload')].map((element) => ({
        fieldLabel: element.closest('.el-form-item')?.querySelector('.el-form-item__label')?.innerText?.trim() ?? null,
        text: (element.closest('.el-form-item')?.innerText ?? element.innerText).trim().slice(0, 600),
      }));
      return {
        activeTag: active?.tagName?.toLowerCase() ?? null,
        activeType: active?.getAttribute?.('type') ?? null,
        activeLabel: activeItem?.querySelector('.el-form-item__label')?.innerText?.trim() ?? null,
        activeClass: typeof active?.className === 'string' ? active.className : '',
        focusStyle: style ? { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, borderColor: style.borderColor, boxShadow: style.boxShadow } : null,
        invalidItems,
        uploadZones,
        hudDemoClass: document.querySelector('.dynamic-form-demo')?.className ?? null,
        hudThemeChecked: document.querySelectorAll('details.dynamic-form-demo__settings input[type="checkbox"]')[1]?.checked ?? null,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        viewport: { width: window.innerWidth, height: window.innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      };
    });

    try {
      await page.evaluate(() => { window.__IMPECCABLE_CONFIG__ = { autoScan: false }; });
      await page.addScriptTag({ url: detectorUrl });
      overlayInjected = await page.evaluate(() => typeof window.impeccableDetect === 'function' && typeof window.impeccableScan === 'function');
      if (overlayInjected) {
        detectorFindings = await page.evaluate(() => window.impeccableDetect());
        await page.evaluate(() => window.impeccableScan());
      }
      await page.waitForTimeout(2500);
    } catch (error) {
      injectionError = error.message;
    }

    const overlayMeta = await page.evaluate(() => ({
      detectorAvailable: typeof window.impeccableDetect === 'function',
      overlayElementCount: document.querySelectorAll('[class*="impeccable"]').length,
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className,
    }));
    await page.screenshot({ path: path.join(outputDir, 'viewport-overlay.png'), animations: 'disabled' });

    if (view.page === 'lxdynamicform') {
      const uploadFocus = page.locator('.lx-upload__clear').first();
      await uploadFocus.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      uploadState = await page.evaluate(() => [...document.querySelectorAll('.el-upload')].map((element) => ({
        fieldLabel: element.closest('.el-form-item')?.querySelector('.el-form-item__label')?.innerText?.trim() ?? null,
        itemText: (element.closest('.el-form-item')?.innerText ?? element.innerText).trim().slice(0, 800),
        fileStatuses: [...(element.closest('.el-form-item') ?? element).querySelectorAll('[class*="upload__file"], [class*="upload__item"], [class*="upload__status"]')].map((node) => ({ className: node.className, text: node.innerText?.trim() ?? '' })),
      })));
      await page.screenshot({ path: path.join(outputDir, 'upload-state-overlay.png'), animations: 'disabled' });
    }

    const detectorConsole = consoleEvents.filter((event) => event.text.includes('[impeccable]'));
    const evidence = {
      view,
      url: page.url(),
      navigationStatus,
      overlayInjected,
      injectionError,
      detectorResponses,
      detectorRawPhase: 'impeccableDetect() before impeccableScan() overlay rendering',
      detectorFindings,
      overlayMeta,
      interactionState,
      uploadState,
      detectorConsole,
      consoleEvents,
      pageErrors,
      failedRequests,
      badResponses,
      blockedRequests,
      screenshot: 'viewport-overlay.png',
      uploadScreenshot: uploadState ? 'upload-state-overlay.png' : null,
    };
    fs.writeFileSync(path.join(outputDir, 'detector-raw.json'), `${JSON.stringify(detectorFindings, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'detector-console.json'), `${JSON.stringify(detectorConsole, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'page-errors.json'), `${JSON.stringify(pageErrors, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'failed-requests.json'), `${JSON.stringify(failedRequests, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    return {
      id: view.id,
      navigationStatus,
      overlayInjected,
      injectionError,
      findingCount: Array.isArray(detectorFindings) ? detectorFindings.length : null,
      detectorConsole,
      activeLabel: interactionState?.activeLabel ?? null,
      invalidItems: interactionState?.invalidItems ?? [],
      uploadLabels: uploadState?.map((entry) => entry.fieldLabel) ?? [],
      uploadSuccessCount: uploadState?.reduce((count, entry) => count + ((entry.itemText.match(/上传成功/g) ?? []).length), 0) ?? 0,
      hudDemoClass: interactionState?.hudDemoClass ?? null,
      reducedMotion: interactionState?.reducedMotion ?? false,
      pageErrorCount: pageErrors.length,
      failedRequestCount: failedRequests.length,
      badResponseCount: badResponses.length,
      blockedRequestCount: blockedRequests.length,
      screenshot: path.join(outputDir, 'viewport-overlay.png'),
    };
  } catch (error) {
    const failure = {
      view,
      navigationStatus,
      error: error.stack || String(error),
      overlayInjected,
      injectionError,
      consoleEvents,
      pageErrors,
      failedRequests,
      badResponses,
      blockedRequests,
    };
    fs.writeFileSync(path.join(outputDir, 'failure.json'), `${JSON.stringify(failure, null, 2)}\n`);
    return { id: view.id, error: error.message, navigationStatus, pageErrorCount: pageErrors.length, failedRequestCount: failedRequests.length };
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(outputRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const view of selectedViews) results.push(await inspectView(browser, view));
  } finally {
    await browser.close();
  }
  const summaryPath = path.join(outputRoot, 'summary.json');
  const previous = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath, 'utf8')) : [];
  const replacedIds = new Set(results.map((result) => result.id));
  const merged = [...previous.filter((result) => !replacedIds.has(result.id)), ...results];
  merged.sort((a, b) => views.findIndex((view) => view.id === a.id) - views.findIndex((view) => view.id === b.id));
  fs.writeFileSync(summaryPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) => result.error || result.navigationStatus !== 200 || !result.overlayInjected)) process.exitCode = 1;
}

main().catch((error) => { console.error(error.stack || String(error)); process.exitCode = 1; });
