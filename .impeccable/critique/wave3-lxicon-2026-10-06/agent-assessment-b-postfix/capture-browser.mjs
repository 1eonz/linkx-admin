import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const runtimeRoot = process.env.PLAYWRIGHT_CORE_ROOT;
if (!runtimeRoot) throw new Error('PLAYWRIGHT_CORE_ROOT is required');
const require = createRequire(path.join(runtimeRoot, 'package.json'));
const { chromium } = require('playwright-core');

const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const overlayUrl = process.env.LIVE_DETECT_URL;
if (!overlayUrl) throw new Error('LIVE_DETECT_URL is required');
const outputDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const screenshotsDir = path.join(outputDir, 'screenshots');
const browserPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

await fs.mkdir(screenshotsDir, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath, headless: true });
const scenarios = [
  { name: 'desktop-light-default', width: 1440, height: 1000, colorScheme: 'light', reducedMotion: 'no-preference', state: 'default' },
  { name: 'desktop-dark-keyboard-focus', width: 1440, height: 1000, colorScheme: 'dark', reducedMotion: 'no-preference', state: 'focus' },
  { name: 'mobile-light-empty-search', width: 390, height: 844, colorScheme: 'light', reducedMotion: 'no-preference', state: 'empty' },
  { name: 'desktop-light-copy-failure', width: 1440, height: 1000, colorScheme: 'light', reducedMotion: 'no-preference', state: 'copy-failure' },
  { name: 'desktop-reduced-motion-hover', width: 1440, height: 1000, colorScheme: 'light', reducedMotion: 'reduce', state: 'reduced-motion' },
];
const results = [];

async function metrics(page) {
  return page.evaluate(() => ({
    viewportInnerWidth: window.innerWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    htmlDark: document.documentElement.classList.contains('dark'),
  }));
}

for (const scenario of scenarios) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    colorScheme: scenario.colorScheme,
    reducedMotion: scenario.reducedMotion,
    deviceScaleFactor: 1,
  });
  if (scenario.state === 'copy-failure') {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('Assessment B clipboard rejection')) },
      });
    });
  }

  const page = await context.newPage();
  const consoleMessages = [];
  const pendingConsoleDetails = [];
  const pageErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  const detectorResponses = [];
  page.on('console', message => {
    const capture = (async () => {
      const args = await Promise.all(message.args().map(async handle => {
        try {
          return await handle.evaluate(value => {
            if (value instanceof Element) {
              const rect = value.getBoundingClientRect();
              const ancestors = [];
              for (let parent = value.parentElement; parent && ancestors.length < 4; parent = parent.parentElement) {
                ancestors.push({ tagName: parent.tagName.toLowerCase(), className: String(parent.className || '').slice(0, 160) });
              }
              return {
                kind: 'element',
                tagName: value.tagName.toLowerCase(),
                id: value.id,
                className: String(value.className || '').slice(0, 160),
                textContent: (value.textContent || '').trim().slice(0, 120),
                selectorHint: value.id ? `#${value.id}` : `${value.tagName.toLowerCase()}${String(value.className || '').trim().split(/\s+/).filter(Boolean).map(name => `.${name}`).join('')}`,
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                ancestors,
                outerHTML: value.outerHTML.slice(0, 600),
              };
            }
            if (value && typeof value === 'object') {
              try { return JSON.parse(JSON.stringify(value)); } catch { return { kind: 'object', constructor: value.constructor?.name || '' }; }
            }
            return value;
          });
        } catch (error) {
          return { captureError: String(error) };
        }
      }));
      consoleMessages.push({ type: message.type(), text: message.text(), args });
    })();
    pendingConsoleDetails.push(capture);
  });
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText || '' }));
  page.on('response', response => {
    if (response.url().includes('/detect.js')) detectorResponses.push({ url: response.url(), status: response.status() });
    if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status(), statusText: response.statusText() });
  });

  const navigation = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('.icon-search').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(800);
  const beforePreflight = await metrics(page);
  const preflight = await page.evaluate(() => {
    const originalTitle = document.title;
    document.title = `${originalTitle} [B injection preflight]`;
    const probe = document.createElement('script');
    probe.dataset.assessmentPreflight = 'true';
    document.head.appendChild(probe);
    const result = {
      titleMutable: document.title.endsWith('[B injection preflight]'),
      scriptAppendable: probe.isConnected && probe.parentElement === document.head,
    };
    probe.remove();
    document.title = originalTitle;
    return result;
  });

  let overlayInjection;
  try {
    await page.addScriptTag({ url: overlayUrl, timeout: 15000 });
    await page.waitForTimeout(2500);
    overlayInjection = {
      attempted: true,
      addScriptTagResolved: true,
      matchingResponses: detectorResponses,
      consoleMessages: consoleMessages.filter(entry => /impeccable/i.test(entry.text)),
    };
  } catch (error) {
    overlayInjection = {
      attempted: true,
      addScriptTagResolved: false,
      error: String(error),
      matchingResponses: detectorResponses,
      consoleMessages: consoleMessages.filter(entry => /impeccable/i.test(entry.text)),
    };
  }
  const afterOverlay = await metrics(page);
  const observed = { htmlDark: afterOverlay.htmlDark };

  if (scenario.state === 'focus') {
    const tile = page.locator('.icon-tile[aria-label^="复制 delete"]').first();
    await tile.focus();
    observed.focusedTile = await tile.getAttribute('aria-label');
    observed.focusVisible = await tile.evaluate(element => element.matches(':focus-visible'));
  } else if (scenario.state === 'empty') {
    await page.locator('.icon-search').fill('__assessment_b_no_matching_icon_7d43__');
    await page.locator('.icon-empty').waitFor({ state: 'visible' });
    observed.emptyMessage = await page.locator('.icon-empty').innerText();
    observed.searchStatus = await page.locator('.icon-search-status').innerText();
    observed.visibleGroups = await page.locator('.icon-group').count();
  } else if (scenario.state === 'copy-failure') {
    const tile = page.locator('.icon-group[open] .icon-tile').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
    await page.locator('.icon-copy-fallback textarea').waitFor({ state: 'visible' });
    observed.feedback = await page.locator('.icon-copy-feedback').innerText();
    observed.fallbackSnippet = await page.locator('.icon-copy-fallback textarea').inputValue();
    observed.fallbackFocused = await page.locator('.icon-copy-fallback textarea').evaluate(element => element.matches(':focus'));
  } else if (scenario.state === 'reduced-motion') {
    const tile = page.locator('.icon-tile[aria-label^="复制 delete"]').first();
    await tile.hover();
    const icon = tile.locator('svg.lx-icon');
    observed.hoveredTile = await tile.getAttribute('aria-label');
    observed.reducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    observed.iconAnimationName = await icon.evaluate(element => getComputedStyle(element).animationName);
    observed.iconTransitionDuration = await icon.evaluate(element => getComputedStyle(element).transitionDuration);
  }

  const screenshot = `${scenario.name}.png`;
  await page.screenshot({ path: path.join(screenshotsDir, screenshot), fullPage: false });
  await Promise.all(pendingConsoleDetails);
  results.push({
    name: scenario.name,
    viewport: { width: scenario.width, height: scenario.height },
    colorScheme: scenario.colorScheme,
    reducedMotion: scenario.reducedMotion,
    navigationStatus: navigation?.status() ?? null,
    preflight,
    widthBeforePreflight: beforePreflight,
    widthAfterOverlayInjection: afterOverlay,
    documentWidthDelta: afterOverlay.documentScrollWidth - beforePreflight.documentScrollWidth,
    overlayInjection,
    observed,
    screenshot,
    detectorResponses,
    consoleMessages,
    pageErrors,
    failedRequests,
    httpErrors,
  });
  await context.close();
}

const browserVersion = browser.version();
await browser.close();
const output = {
  capturedAt: new Date().toISOString(),
  targetUrl,
  overlayUrl,
  browserPath,
  browserVersion,
  scenarioCount: results.length,
  scenarios: results,
};
await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  scenarioCount: output.scenarioCount,
  scenarios: results.map(({ name, navigationStatus, preflight, widthBeforePreflight, widthAfterOverlayInjection, documentWidthDelta, overlayInjection, observed, screenshot, pageErrors, failedRequests }) => ({
    name, navigationStatus, preflight, widthBeforePreflight, widthAfterOverlayInjection, documentWidthDelta, overlayInjection, observed, screenshot, pageErrors, failedRequests,
  })),
}));
