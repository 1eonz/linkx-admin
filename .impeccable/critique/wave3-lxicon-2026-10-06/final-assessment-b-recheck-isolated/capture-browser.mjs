import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const outDir = path.resolve(root, '.impeccable/critique/wave3-lxicon-2026-10-06/final-assessment-b-recheck-isolated');
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const overlayUrl = process.argv[2];
if (!overlayUrl) throw new Error('Usage: node capture-browser.mjs <detect.js URL>');

const requireFromApp = createRequire(path.resolve(root, 'other-admin/admin-vue3/package.json'));
const { chromium } = requireFromApp('@playwright/test');
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const views = [];
const launchErrors = [];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeName(device, theme, state) {
  return `${device}-${theme}-${state}`;
}

async function establishTheme(page, desiredTheme) {
  const initial = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    themeButtons: [...document.querySelectorAll('button')]
      .map((button) => ({
        ariaLabel: button.getAttribute('aria-label'),
        title: button.getAttribute('title'),
        className: typeof button.className === 'string' ? button.className : '',
        text: (button.innerText || '').trim(),
      }))
      .filter((button) => /theme|appearance|dark|light/i.test(`${button.ariaLabel} ${button.title} ${button.className} ${button.text}`)),
  }));
  const expectedDark = desiredTheme === 'dark';
  if (initial.dark !== expectedDark) {
    const candidates = page.locator('button.VPNavBarAppearance, button[aria-label*="theme" i], button[title*="theme" i], button[aria-label*="appearance" i]');
    if (await candidates.count()) {
      await candidates.first().click();
      await page.waitForFunction((target) => document.documentElement.classList.contains('dark') === target, expectedDark, { timeout: 3000 });
    } else {
      await page.evaluate((target) => document.documentElement.classList.toggle('dark', target), expectedDark);
    }
  }
  return {
    initialDark: initial.dark,
    themeButtons: initial.themeButtons,
    finalDark: await page.evaluate(() => document.documentElement.classList.contains('dark')),
    usedDocumentClassFallback: initial.dark !== expectedDark && !(await page.locator('button.VPNavBarAppearance, button[aria-label*="theme" i], button[title*="theme" i], button[aria-label*="appearance" i]').count()),
  };
}

for (const device of ['desktop', 'mobile']) {
  for (const theme of ['light', 'dark']) {
    for (const state of ['directory', 'empty']) {
      const isMobile = device === 'mobile';
      const context = await browser.newContext({
        viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 960 },
        deviceScaleFactor: 1,
        isMobile,
        hasTouch: isMobile,
        colorScheme: theme,
      });
      const page = await context.newPage();
      const consoleMessages = [];
      const pageErrors = [];
      const failedResponses = [];
      page.on('console', (message) => {
        const item = { type: message.type(), text: message.text() };
        consoleMessages.push(item);
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400) {
          failedResponses.push({
            status: response.status(),
            url: response.url(),
            resourceType: response.request().resourceType(),
          });
        }
      });

      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.locator('.icon-catalog').waitFor({ state: 'visible', timeout: 20000 });
      await page.locator('.icon-search').waitFor({ state: 'visible', timeout: 10000 });
      await delay(400);

      const preflight = await page.evaluate(() => {
        const originalTitle = document.title;
        document.title = `Assessment B preflight - ${originalTitle}`;
        const script = document.createElement('script');
        script.textContent = 'window.__assessmentBMutableInjectionPreflight = true;';
        document.head.appendChild(script);
        const succeeded = window.__assessmentBMutableInjectionPreflight === true;
        document.title = originalTitle;
        return { succeeded, scriptAppended: script.isConnected };
      });

      const themeEvidence = await establishTheme(page, theme);
      const search = page.locator('.icon-search');
      await search.fill(state === 'directory' ? '' : 'zzzz-no-match-assessment-b');
      if (state === 'directory') {
        await page.evaluate(() => {
          document.querySelectorAll('details.icon-group').forEach((group) => { group.open = true; });
        });
      }
      await delay(150);

      const pageEvidence = await page.evaluate(() => ({
        title: document.title,
        htmlClass: document.documentElement.className,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        catalogVisible: Boolean(document.querySelector('.icon-catalog')),
        searchAccessibleName: document.querySelector('.icon-search')?.getAttribute('aria-label') ?? null,
        groupCount: document.querySelectorAll('details.icon-group').length,
        openGroupCount: document.querySelectorAll('details.icon-group[open]').length,
        tileCount: document.querySelectorAll('.icon-tile').length,
        emptyText: document.querySelector('.icon-empty')?.textContent?.trim() ?? null,
        navVisible: Boolean(document.querySelector('.VPNav')),
      }));
      const baseName = safeName(device, theme, state);
      const baselinePath = path.join(outDir, `${baseName}.png`);
      await page.screenshot({ path: baselinePath, fullPage: false, animations: 'disabled' });

      const beforeOverlayElementCount = await page.locator('body *').count();
      let scriptInjection = { succeeded: false, error: null };
      try {
        await page.addScriptTag({ url: overlayUrl, timeout: 10000 });
        scriptInjection.succeeded = true;
      } catch (error) {
        scriptInjection.error = error instanceof Error ? error.message : String(error);
      }
      await delay(2800);
      const afterOverlay = await page.evaluate(() => {
        const scripts = [...document.scripts]
          .filter((script) => script.src.includes('/detect.js'))
          .map((script) => ({ src: script.src, readyState: script.readyState || null }));
        const namedElements = [...document.querySelectorAll('[id*="impeccable" i], [class*="impeccable" i], [data-impeccable]')]
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: typeof element.className === 'string' ? element.className : null,
            text: (element.textContent || '').trim().slice(0, 240),
            shadowRoot: Boolean(element.shadowRoot),
          }));
        const highlights = [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')]
          .map((overlay, index) => {
            const target = overlay._targetEl;
            if (!(target instanceof Element)) return { index, target: null };
            const rect = target.getBoundingClientRect();
            const style = getComputedStyle(target);
            const ancestry = [];
            let current = target;
            while (current && ancestry.length < 5) {
              ancestry.push({
                tag: current.tagName.toLowerCase(),
                id: current.id || null,
                className: typeof current.className === 'string' ? current.className : null,
              });
              current = current.parentElement;
            }
            return {
              index,
              labels: [...overlay.querySelectorAll('.impeccable-label')].map((label) => label.textContent.trim()),
              target: {
                tag: target.tagName.toLowerCase(),
                id: target.id || null,
                className: typeof target.className === 'string' ? target.className : null,
                role: target.getAttribute('role'),
                ariaLabel: target.getAttribute('aria-label'),
                text: (target.innerText || target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240),
                outerHTML: target.outerHTML.slice(0, 600),
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                computed: { overflowX: style.overflowX, overflowY: style.overflowY, opacity: style.opacity, color: style.color, backgroundColor: style.backgroundColor, fontFamily: style.fontFamily, transitionProperty: style.transitionProperty },
                ancestry,
              },
            };
          });
        return {
          injectedScripts: scripts,
          namedElements,
          highlights,
          shadowRoots: [...document.querySelectorAll('*')].filter((element) => element.shadowRoot).length,
          title: document.title,
        };
      });
      const afterOverlayElementCount = await page.locator('body *').count();
      const overlayConsoleMessages = consoleMessages.filter((item) => /impeccable|detect(?:or)?/i.test(item.text));
      const overlayPath = path.join(outDir, `${baseName}-overlay.png`);
      await page.screenshot({ path: overlayPath, fullPage: false, animations: 'disabled' });

      views.push({
        device,
        theme,
        state,
        viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 960 },
        status: response?.status() ?? null,
        preflight,
        themeEvidence,
        pageEvidence,
        screenshots: {
          baseline: path.relative(root, baselinePath),
          overlay: path.relative(root, overlayPath),
        },
        overlay: {
          url: overlayUrl,
          scriptInjection,
          beforeOverlayElementCount,
          afterOverlayElementCount,
          addedBodyElements: afterOverlayElementCount - beforeOverlayElementCount,
          pageEvidence: afterOverlay,
          consoleMessages: overlayConsoleMessages,
          pageErrors,
          failedResponses,
          allConsoleMessages: consoleMessages,
        },
      });
      await context.close();
    }
  }
}

await browser.close();
fs.writeFileSync(
  path.join(outDir, 'browser-evidence.json'),
  `${JSON.stringify({
    targetUrl,
    browser: 'Microsoft Edge launched by Playwright',
    browserExecutable: edgePath,
    assessmentContext: '独立浏览器进程；每个主题、设备和页面状态使用新的浏览器上下文与新标签。',
    preflightRequirement: '设置 document.title 并追加内联脚本，验证可变注入权限。',
    overlayUrl,
    views,
    launchErrors,
  }, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify({
  targetUrl,
  viewCount: views.length,
  successfulNavigations: views.filter((view) => view.status === 200).length,
  successfulPreflights: views.filter((view) => view.preflight.succeeded && view.preflight.scriptAppended).length,
  successfulOverlayInjections: views.filter((view) => view.overlay.scriptInjection.succeeded).length,
  overlaysWithConsoleMessages: views.filter((view) => view.overlay.consoleMessages.length).length,
  pageErrors: views.flatMap((view) => view.overlay.pageErrors.map((message) => ({ view: safeName(view.device, view.theme, view.state), message }))),
  artifactDirectory: outDir,
}, null, 2));
