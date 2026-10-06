import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('@playwright/test');

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html';
const detectorUrl = 'http://127.0.0.1:8400/detect.js';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cases = [
  {
    id: 'desktop-light-default',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  },
  {
    id: 'desktop-dark-keyboard',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    keyboard: true,
  },
  {
    id: 'narrow-empty-result',
    viewport: { width: 375, height: 812 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    emptySearch: true,
  },
  {
    id: 'copy-failure',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    failClipboard: true,
  },
  {
    id: 'prefers-reduced-motion',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: edgePath,
  args: ['--disable-extensions', '--disable-background-networking'],
});
const results = [];

try {
  for (const [index, testCase] of cases.entries()) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      colorScheme: testCase.colorScheme,
      reducedMotion: testCase.reducedMotion,
      isMobile: testCase.viewport.width < 600,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const httpErrors = [];
    const failedRequests = [];
    const result = {
      id: testCase.id,
      contextIndex: index + 1,
      freshContext: true,
      viewport: testCase.viewport,
      colorScheme: testCase.colorScheme,
      reducedMotion: testCase.reducedMotion,
      interactions: {},
      console: consoleMessages,
      pageErrors,
      httpErrors,
      failedRequests,
      detector: {
        url: detectorUrl,
        injected: false,
        readyMessage: false,
        completed: false,
        findings: null,
      },
    };

    page.on('console', (message) => {
      consoleMessages.push({ type: message.type(), text: message.text() });
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        httpErrors.push({ status: response.status(), url: response.url() });
      }
    });
    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? 'unknown',
      });
    });

    if (testCase.failClipboard) {
      await context.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'clipboard', {
          configurable: true,
          get: () => ({
            writeText: () => Promise.reject(new DOMException('Denied for assessment', 'NotAllowedError')),
          }),
        });
      });
    }

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('.icon-search').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('.icon-tile').length > 0, null, { timeout: 30000 });
    await page.waitForTimeout(400);

    result.navigation = {
      status: response?.status() ?? null,
      finalUrl: page.url(),
      initialTitle: await page.title(),
      pageHeading: await page.locator('h1').first().innerText().catch(() => ''),
      iconTileCount: await page.locator('.icon-tile').count(),
    };

    if (testCase.keyboard) {
      await page.locator('.icon-search').focus();
      await page.keyboard.press('Tab');
      result.interactions.keyboard = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName ?? null,
          className: typeof el?.className === 'string' ? el.className : '',
          ariaLabel: el?.getAttribute('aria-label'),
          focusVisible: el?.matches(':focus-visible') ?? false,
          documentDarkClass: document.documentElement.classList.contains('dark'),
          backgroundColor: getComputedStyle(document.body).backgroundColor,
        };
      });
      if (!result.interactions.keyboard.documentDarkClass) {
        const themeToggle = page.getByRole('button', { name: /dark|theme|深色|主题/i }).first();
        if (await themeToggle.count()) {
          await themeToggle.click().catch(() => {});
          await page.waitForTimeout(150);
          result.interactions.keyboard.documentDarkClass = await page.evaluate(() =>
            document.documentElement.classList.contains('dark'),
          );
          result.interactions.keyboard.themeToggleUsed = true;
        }
      }
    }

    if (testCase.emptySearch) {
      const query = 'zz-isolated-assessment-b-no-match';
      await page.locator('.icon-search').fill(query);
      result.interactions.emptySearch = {
        query,
        emptyStateVisible: await page.locator('.icon-empty').isVisible(),
        visibleGroupCount: await page.locator('.icon-group').count(),
        liveStatus: await page.locator('.icon-search-status').innerText(),
        horizontalOverflow: await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      };
    }

    if (testCase.failClipboard) {
      await page.locator('.icon-tile').first().click();
      result.interactions.copyFailure = {
        feedback: await page.locator('.icon-copy-feedback').innerText(),
        fallbackVisible: await page.locator('.icon-copy-fallback').isVisible(),
        fallbackValue: await page.locator('.icon-copy-fallback textarea').inputValue(),
        focusedFallback: await page.evaluate(() =>
          document.activeElement?.classList.contains('icon-copy-fallback__input')
          || document.activeElement?.tagName === 'TEXTAREA',
        ),
      };
    }

    if (testCase.reducedMotion === 'reduce') {
      result.interactions.reducedMotion = await page.evaluate(() => {
        const tile = document.querySelector('.icon-tile');
        const motionIcon = document.querySelector('svg[data-lx-motion]');
        return {
          mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          tileTransitionDuration: tile ? getComputedStyle(tile).transitionDuration : null,
          motionIconTransitionDuration: motionIcon ? getComputedStyle(motionIcon).transitionDuration : null,
        };
      });
    }

    const originalTitle = result.navigation.initialTitle;
    await page.evaluate(() => {
      window.__assessmentBMessages = [];
      window.addEventListener('message', (event) => {
        if (event.source === window && event.data?.source?.startsWith('impeccable-')) {
          window.__assessmentBMessages.push(event.data);
        }
      });
    });
    await page.evaluate((title) => {
      document.title = `${title} | Assessment B`;
    }, originalTitle);
    await page.addScriptTag({ url: detectorUrl, timeout: 20000 });
    result.detector.injected = await page.locator(`script[src="${detectorUrl}"]`).count().then((count) => count > 0);
    result.detector.readyMessage = await page.waitForFunction(
      () => window.__assessmentBMessages?.some((message) => message.source === 'impeccable-ready'),
      null,
      { timeout: 10000 },
    ).then(() => true).catch(() => false);
    result.detector.titleMutation = await page.title();

    result.detector.findings = await page.evaluate(() => {
      const cssPath = (element) => {
        const segments = [];
        let node = element;
        while (node?.nodeType === Node.ELEMENT_NODE && node !== document.documentElement) {
          let segment = node.localName;
          if (node.id) {
            segment += `#${CSS.escape(node.id)}`;
            segments.unshift(segment);
            break;
          }
          const siblings = [...(node.parentElement?.children ?? [])]
            .filter((sibling) => sibling.localName === node.localName);
          if (siblings.length > 1) segment += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          segments.unshift(segment);
          node = node.parentElement;
        }
        return segments.join(' > ');
      };
      return window.impeccableScan().map(({ el, findings }) => ({
        target: {
          selector: cssPath(el),
          tagName: el.tagName?.toLowerCase() ?? 'unknown',
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className : el.getAttribute('class') ?? '',
          ariaLabel: el.getAttribute('aria-label'),
          text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
          outerHTML: el.outerHTML.slice(0, 420),
        },
        findings: findings.map((finding) => ({
          type: finding.type || finding.id,
          detail: finding.detail || finding.snippet || '',
        })),
      }));
    });
    await page.waitForTimeout(2500);
    result.detector.completed = true;
    result.detector.messages = await page.evaluate(() => window.__assessmentBMessages);
    result.detector.findingCount = result.detector.findings
      .reduce((count, target) => count + target.findings.length, 0);
    result.detector.consoleSummary = consoleMessages
      .filter((message) => message.text.includes('[impeccable]'));
    result.detector.overlayElements = await page.locator(
      '.impeccable-overlay, .impeccable-label, .impeccable-banner, .impeccable-tooltip',
    ).count();
    result.consoleDetectorMessages = consoleMessages.filter((message) =>
      message.text.includes('[impeccable]'),
    );

    const screenshotName = `${testCase.id}.png`;
    await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false });
    result.screenshot = screenshotName;
    results.push(result);
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDir, 'browser-evidence.json'),
  `${JSON.stringify({ targetUrl, detectorUrl, browser: 'Microsoft Edge (Playwright Chromium driver)', contexts: results }, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify({
  contexts: results.map((result) => ({
    id: result.id,
    detectorCompleted: result.detector.completed,
    findings: result.detector.findings?.map((entry) => entry.count),
    screenshot: result.screenshot,
  })),
}, null, 2));
