import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeRequire = createRequire(
  'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json',
);
const { chromium } = runtimeRequire('playwright');
const scriptPath = fileURLToPath(import.meta.url);
const evidenceDir = path.dirname(scriptPath);
const baseUrl = 'http://127.0.0.1:4177/components/lxtransferpanel';
const detectorPort = process.env.ASSESSMENT_B_DETECTOR_PORT;

if (!detectorPort) throw new Error('ASSESSMENT_B_DETECTOR_PORT is required');

const views = [
  {
    id: 'desktop-light',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    dark: false,
  },
  {
    id: 'desktop-dark-hud',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    dark: true,
  },
  {
    id: 'mobile-375-focus-reduced-motion',
    viewport: { width: 375, height: 812 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    dark: false,
    focus: true,
  },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: views[0].viewport,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  deviceScaleFactor: 1,
});
const results = [];

try {
  for (const view of views) {
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];
    const detectorResponses = [];

    page.on('console', (message) => {
      consoleMessages.push({ type: message.type(), text: message.text() });
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null });
    });
    page.on('response', (response) => {
      if (response.url().includes('/detect.js')) {
        detectorResponses.push({ url: response.url(), status: response.status() });
      }
    });

    await page.setViewportSize(view.viewport);
    await page.emulateMedia({ colorScheme: view.colorScheme, reducedMotion: view.reducedMotion });
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45000 });
    if (!response) throw new Error(`${view.id}: navigation returned no response`);

    const preflight = await page.evaluate(() => {
      document.title = 'Assessment B - LxTransferPanel';
      const script = document.createElement('script');
      script.dataset.assessmentBPreflight = 'true';
      script.textContent = 'window.__assessmentBMutableInjection = "ok";';
      document.head.appendChild(script);
      return {
        title: document.title,
        mutableInjection: window.__assessmentBMutableInjection === 'ok',
      };
    });

    let themeToggle = 'not-needed';
    if (view.dark) {
      const isDark = await page.evaluate(() => (
        document.documentElement.classList.contains('dark')
        || document.documentElement.dataset.theme === 'dark'
        || document.body.classList.contains('dark')
      ));
      if (!isDark) {
        const candidates = page.locator('button, [role="button"]');
        const count = await candidates.count();
        for (let index = 0; index < count; index++) {
          const candidate = candidates.nth(index);
          const label = [
            await candidate.getAttribute('aria-label'),
            await candidate.getAttribute('title'),
            await candidate.innerText().catch(() => ''),
          ].filter(Boolean).join(' ');
          if (/switch to dark|dark theme|dark mode/i.test(label)) {
            await candidate.click();
            themeToggle = `clicked:${label}`;
            break;
          }
        }
      }
    }

    if (view.focus) {
      await page.keyboard.press('Tab');
    }

    const detectorUrl = `http://127.0.0.1:${detectorPort}/detect.js`;
    await page.addScriptTag({ url: detectorUrl });
    await page.waitForTimeout(2500);

    const pageState = await page.evaluate(() => {
      const bodyStyle = getComputedStyle(document.body);
      const rootStyle = getComputedStyle(document.documentElement);
      const script = [...document.scripts].find((item) => item.src.includes('/detect.js'));
      const active = document.activeElement;
      return {
        title: document.title,
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        rootClass: document.documentElement.className,
        rootTheme: document.documentElement.dataset.theme || null,
        bodyBackground: bodyStyle.backgroundColor,
        rootBackground: rootStyle.backgroundColor,
        prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        activeElement: active ? {
          tag: active.tagName,
          label: active.getAttribute('aria-label'),
          text: (active.innerText || active.textContent || '').trim().slice(0, 100),
          className: typeof active.className === 'string' ? active.className : '',
        } : null,
        detectorScriptPresent: Boolean(script),
        detectorScriptSrc: script?.src ?? null,
        detectorOverlayElements: document.querySelectorAll('[data-impeccable], .impeccable-overlay, [id*="impeccable"]').length,
      };
    });

    const screenshot = path.join(evidenceDir, `${view.id}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    results.push({
      view: view.id,
      navigation: { status: response.status(), ok: response.ok(), url: response.url() },
      preflight,
      requestedColorScheme: view.colorScheme,
      requestedReducedMotion: view.reducedMotion,
      themeToggle,
      pageState,
      detectorResponses,
      impeccableConsoleHits: consoleMessages.filter((item) => /impeccable/i.test(item.text)),
      allConsoleMessages: consoleMessages,
      pageErrors,
      failedRequests,
      screenshot,
    });

    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
}

const output = {
  target: baseUrl,
  detectorUrl: `http://127.0.0.1:${detectorPort}/detect.js`,
  browser: 'Playwright Chromium',
  context: 'new isolated browser context',
  views: results,
};
await fs.writeFile(path.join(evidenceDir, 'browser-evidence.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
