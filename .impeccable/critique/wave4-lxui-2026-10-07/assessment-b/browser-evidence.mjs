import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/AppData/Local/Temp/codex-wave4-lxui-assessment-b-2026-10-07/node_modules/playwright-core');
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://127.0.0.1:4174';
const liveUrl = process.argv[2];
const targets = [
  { slug: 'lxdatepicker', route: '/components/lxdatepicker' },
  { slug: 'lxdynamicform', route: '/components/lxdynamicform' },
  { slug: 'lxupload', route: '/components/lxupload' },
];
const views = targets.flatMap((target) => [
  { ...target, theme: 'light', state: 'default' },
  { ...target, theme: 'dark', state: 'default' },
  ...(target.slug === 'lxdatepicker' ? [{ ...target, theme: 'light', state: 'calendar-open' }] : []),
]);

if (!liveUrl) throw new Error('Usage: node browser-evidence.mjs <live-server-url>');

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
  });
} catch (error) {
  fs.writeFileSync(path.join(outputDir, 'browser-launch-failure.json'), `${JSON.stringify({
    command: `node ${fileURLToPath(import.meta.url)} ${liveUrl}`,
    exitCode: 1,
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
    message: error.message,
    stack: error.stack,
  }, null, 2)}\n`, 'utf8');
  throw error;
}
const results = [];

try {
  for (const view of views) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: view.theme });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText || null }));

    const url = `${baseUrl}${view.route}`;
    const navigation = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).then(
      (response) => ({ status: response?.status() ?? null, error: null }),
      (error) => ({ status: null, error: error.message }),
    );
    await page.waitForTimeout(2500);
    const themeSwitch = await page.evaluate((theme) => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      if ((theme === 'dark') === isDark) return { changed: false, isDark };
      const button = [...document.querySelectorAll('button')].find((item) => /VPSwitchAppearance/.test(String(item.className)));
      if (!button) return { changed: false, isDark, error: 'No VitePress appearance button is present.' };
      button.click();
      return { changed: true, isDark: root.classList.contains('dark') };
    }, view.theme);
    await page.waitForTimeout(250);
    const stateAction = view.state === 'calendar-open'
      ? await page.locator('.VPDoc input').first().click({ timeout: 2000 }).then(() => ({ completed: true }), (error) => ({ completed: false, error: error.message }))
      : { completed: true, skipped: true };
    await page.evaluate(() => window.scrollTo(0, 0));
    const preflight = await page.evaluate(() => {
      const originalTitle = document.title;
      document.title = 'Assessment B injection preflight';
      const script = document.createElement('script');
      script.textContent = 'window.__assessmentBMutableInjection = true;';
      document.head.append(script);
      return {
        originalTitle,
        title: document.title,
        marker: window.__assessmentBMutableInjection === true,
        documentClass: document.documentElement.className,
        headings: [...document.querySelectorAll('h1,h2,h3')].map((item) => item.innerText.trim()).filter(Boolean),
        bodyText: document.body.innerText.slice(0, 1800),
      };
    });
    let scriptInjection = { success: false, error: null };
    try {
      await page.addScriptTag({ url: `${liveUrl}/detect.js` });
      scriptInjection.success = true;
    } catch (error) {
      scriptInjection.error = error.message;
    }
    await page.waitForTimeout(2500);
    const detector = await page.evaluate(() => {
      const detectAvailable = typeof window.impeccableDetect === 'function';
      const scanAvailable = typeof window.impeccableScan === 'function';
      let findings = [];
      let detectError = null;
      if (detectAvailable) {
        try {
          findings = window.impeccableDetect();
        } catch (error) {
          detectError = error.message;
        }
      }
      const serializable = JSON.parse(JSON.stringify(findings));
      const locatedFindings = (Array.isArray(findings) ? findings : []).map((finding) => {
        const selector = typeof finding.selector === 'string'
          ? finding.selector
          : typeof finding.path === 'string' ? finding.path : null;
        let element = null;
        try {
          const node = selector ? document.querySelector(selector) : null;
          if (node) {
            const rect = node.getBoundingClientRect();
            element = {
              tagName: node.tagName,
              className: typeof node.className === 'string' ? node.className : '',
              id: node.id,
              text: node.innerText?.trim().slice(0, 180) || '',
              inDocsContent: Boolean(node.closest('.VPDoc')),
              inDocsChrome: Boolean(node.closest('.VPNav,.VPSidebar,.VPFooter,.VPDocAside')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          }
        } catch { /* retain the original finding even if its selector is invalid */ }
        return { selector, element };
      });
      const overlayElements = [...document.querySelectorAll('.impeccable-overlay,.impeccable-label,.impeccable-banner,.impeccable-tooltip')].map((node) => ({
        className: node.className,
        text: node.innerText?.trim().slice(0, 180) || '',
        targetTag: node._targetEl?.tagName || null,
        targetClass: typeof node._targetEl?.className === 'string' ? node._targetEl.className : '',
        targetText: node._targetEl?.innerText?.trim().slice(0, 180) || '',
      }));
      return {
        detectAvailable,
        scanAvailable,
        detectError,
        findings: serializable,
        locatedFindings,
        overlayElements,
        documentClass: document.documentElement.className,
        bodyTextLength: document.body.innerText.trim().length,
        mainHeading: document.querySelector('.VPDoc h1')?.innerText.trim() || null,
      };
    });
    const screenshotName = `${view.slug}-${view.theme}-${view.state}.png`;
    await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false });
    results.push({
      target: view.slug,
      theme: view.theme,
      state: view.state,
      url,
      navigation,
      themeSwitch,
      stateAction,
      preflight,
      scriptInjection,
      detector,
      consoleMessages,
      impeccableConsoleMessages: consoleMessages.filter((message) => /impeccable/i.test(message.text)),
      pageErrors,
      failedRequests,
      screenshot: screenshotName,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(results.map(({ target, navigation, preflight }) => ({
  target,
  status: navigation.status,
  navigationError: navigation.error,
  mutableInjection: preflight.marker,
  headings: preflight.headings.length,
  bodyTextLength: preflight.bodyText.length,
})), null, 2)}\n`);
