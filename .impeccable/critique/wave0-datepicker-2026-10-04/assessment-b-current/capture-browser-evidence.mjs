import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const appRequire = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json');
const { chromium } = appRequire('@playwright/test');
const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxdatepicker.html';
const detectorUrl = 'http://127.0.0.1:8401/detect.js';
const browser = await chromium.launch({ headless: true });
const results = [];

for (const scenario of [
  { name: 'desktop-single-light', viewport: { width: 1440, height: 900 }, selector: '#demo-date-effective' },
  { name: 'desktop-range-light', viewport: { width: 1440, height: 900 }, selector: '#demo-date-control-start' },
  { name: 'mobile-range-375', viewport: { width: 375, height: 812 }, selector: '#demo-date-control-start', isMobile: true },
  { name: 'desktop-range-hud-dark', viewport: { width: 1440, height: 900 }, selector: '#demo-date-control-start', hud: true },
]) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    deviceScaleFactor: 1,
    isMobile: scenario.isMobile ?? false,
    hasTouch: scenario.isMobile ?? false,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    locale: 'zh-CN',
  });
  const blockedRequests = [];
  const requests = [];
  const failedRequests = [];
  const badResponses = [];
  const consoleMessages = [];
  const pageErrors = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && ['4174', '8401'].includes(url.port)) {
      await route.continue();
    } else {
      blockedRequests.push({ url: url.href, reason: 'non-local request blocked' });
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? '' }));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() });
  });
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const item = { name: scenario.name, viewport: scenario.viewport, screenshots: {}, errors: [] };

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 15000 });
    if (scenario.name === 'desktop-single-light') {
      const initialPath = path.join(evidenceDir, 'initial-page.png');
      await page.screenshot({ path: initialPath });
      item.screenshots.initial = path.basename(initialPath);
    }
    if (scenario.hud) {
      await page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]').check();
    }
    await page.locator(scenario.selector).click();
    await page.locator('.el-picker__popper').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(250);
    const beforePath = path.join(evidenceDir, `${scenario.name}-before-overlay.png`);
    await page.screenshot({ path: beforePath });
    item.screenshots.beforeOverlay = path.basename(beforePath);
    item.beforeOverlay = await page.evaluate(() => {
      const popup = document.querySelector('.el-picker__popper');
      const tables = popup ? [...popup.querySelectorAll('.el-date-table')] : [];
      const rect = popup?.getBoundingClientRect();
      const inputs = [...document.querySelectorAll('.lx-date-picker-demo input:not([type="checkbox"])')];
      return {
        title: document.title,
        url: location.href,
        viewport: { innerWidth, innerHeight, clientWidth: document.documentElement.clientWidth },
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        popup: popup ? {
          visible: getComputedStyle(popup).display !== 'none' && getComputedStyle(popup).visibility !== 'hidden',
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
          scrollWidth: popup.scrollWidth,
          clientWidth: popup.clientWidth,
        } : null,
        calendarPanelCount: tables.length,
        weekdayHeaders: tables.map((table) => [...table.querySelectorAll('thead th')].map((cell) => cell.textContent.trim())),
        inputs: inputs.map((input) => ({
          id: input.id,
          placeholder: input.getAttribute('placeholder'),
          ariaLabel: input.getAttribute('aria-label'),
          label: [...document.querySelectorAll('label')].find((label) => label.htmlFor === input.id)?.textContent.trim() ?? null,
        })),
        activeElement: { tag: document.activeElement?.tagName, id: document.activeElement?.id, role: document.activeElement?.getAttribute('role') },
        hudTheme: document.querySelector('.lx-date-picker-demo')?.classList.contains('lx-theme-hud') ?? false,
      };
    });

    await page.addScriptTag({ url: detectorUrl });
    item.overlayScriptLoaded = true;
    await page.waitForTimeout(2500);
    item.overlay = await page.evaluate(() => ({
      overlays: document.querySelectorAll('.impeccable-overlay').length,
      visibleOverlays: document.querySelectorAll('.impeccable-overlay.impeccable-visible').length,
      labels: [...document.querySelectorAll('.impeccable-label')].map((node) => node.textContent.trim()).filter(Boolean),
      detectorScripts: [...document.scripts].filter((script) => script.src.includes('/detect.js')).map((script) => ({ src: script.src, loaded: script.isConnected })),
    }));
    const overlayPath = path.join(evidenceDir, `${scenario.name}-overlay.png`);
    await page.screenshot({ path: overlayPath });
    item.screenshots.overlay = path.basename(overlayPath);
  } catch (error) {
    item.errors.push(error.message);
  }

  item.network = {
    requests,
    failedRequests,
    badResponses,
    blockedRequests,
  };
  item.console = consoleMessages;
  item.pageErrors = pageErrors;
  results.push(item);
  await context.close();
}

const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', reducedMotion: 'reduce' });
const keyboardPage = await keyboardContext.newPage();
await keyboardContext.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.hostname === '127.0.0.1' && url.port === '4174') await route.continue();
  else await route.abort();
});
await keyboardPage.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
await keyboardPage.locator('#demo-date-effective').focus();
await keyboardPage.keyboard.press('ArrowDown');
const keyboardEvidence = await keyboardPage.evaluate(() => {
  const wrapper = document.querySelector('#demo-date-effective')?.closest('.el-input');
  return {
    popupVisible: [...document.querySelectorAll('.el-picker__popper')].some((node) => getComputedStyle(node).display !== 'none'),
    activeElement: { tag: document.activeElement?.tagName, id: document.activeElement?.id, role: document.activeElement?.getAttribute('role') },
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    transitionDuration: wrapper ? getComputedStyle(wrapper.querySelector('.el-input__wrapper') ?? wrapper).transitionDuration : null,
    viewport: { innerWidth, documentScrollWidth: document.documentElement.scrollWidth },
  };
});
await keyboardPage.keyboard.press('Escape');
keyboardEvidence.closedByEscape = await keyboardPage.locator('.el-picker__popper').count().then(async (count) => count === 0 || !(await keyboardPage.locator('.el-picker__popper').isVisible().catch(() => false)));
await fs.writeFile(path.join(evidenceDir, 'keyboard-reduced-motion.json'), JSON.stringify(keyboardEvidence, null, 2), 'utf8');
await keyboardContext.close();
await browser.close();
await fs.writeFile(path.join(evidenceDir, 'browser-state-evidence.json'), JSON.stringify({ targetUrl, detectorUrl, results }, null, 2), 'utf8');
console.log(JSON.stringify({ targetUrl, detectorUrl, scenarios: results.map(({ name, screenshots, beforeOverlay, overlay, errors, console, pageErrors, network }) => ({ name, screenshots, beforeOverlay, overlay, errors, detectorConsole: console.filter((entry) => entry.text.includes('[impeccable]')), pageErrors, blockedRequests: network.blockedRequests, failedRequests: network.failedRequests, badResponses: network.badResponses })), keyboardEvidence }, null, 2));
