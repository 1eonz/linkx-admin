#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, evidenceDir, livePortText, edgePath, playwrightRoot] = process.argv.slice(2);
if (!repoRoot || !evidenceDir || !livePortText || !edgePath || !playwrightRoot) {
  throw new Error('Usage: capture-browser.mjs <repo-root> <evidence-dir> <live-port> <edge-exe> <playwright-root>');
}

const { chromium } = await import(
  pathToFileURL(path.join(playwrightRoot, 'node_modules', 'playwright', 'index.mjs')).href,
);
const livePort = Number(livePortText);
const screenshotsDir = path.join(evidenceDir, 'screenshots');
await fs.mkdir(screenshotsDir, { recursive: true });

const cases = [
  { id: 'transfer-light-desktop-ready', component: 'transfer', width: 1440, height: 1000, theme: 'light', state: 'ready' },
  { id: 'transfer-hud-desktop-ready', component: 'transfer', width: 1440, height: 1000, theme: 'hud', state: 'ready' },
  { id: 'transfer-hud-mobile-375-ready', component: 'transfer', width: 375, height: 844, theme: 'hud', state: 'ready' },
  { id: 'transfer-hud-desktop-loading', component: 'transfer', width: 1440, height: 1000, theme: 'hud', state: 'loading' },
  { id: 'transfer-hud-desktop-error', component: 'transfer', width: 1440, height: 1000, theme: 'hud', state: 'error' },
  { id: 'tree-light-desktop-ready', component: 'tree', width: 1440, height: 1000, theme: 'light', state: 'ready' },
  { id: 'tree-hud-desktop-ready', component: 'tree', width: 1440, height: 1000, theme: 'hud', state: 'ready' },
  { id: 'tree-hud-mobile-375-ready', component: 'tree', width: 375, height: 844, theme: 'hud', state: 'ready' },
  { id: 'tree-hud-desktop-empty', component: 'tree', width: 1440, height: 1000, theme: 'hud', state: 'empty' },
  { id: 'tree-hud-desktop-error', component: 'tree', width: 1440, height: 1000, theme: 'hud', state: 'error' },
];

const selectors = {
  transfer: [
    'body',
    '.transfer-panel-demo',
    '.transfer-panel-demo__surface',
    '.transfer-panel-demo__status',
    '.lx-transfer-panel',
    '.lx-transfer-panel__source',
    '.lx-transfer-panel__target',
    '.lx-transfer-panel__title',
  ],
  tree: [
    'body',
    '.virtual-tree-demo',
    '.virtual-tree-demo__controls',
    '.virtual-tree-demo__toolbar',
    '.virtual-tree-demo__message',
    '.lx-virtual-tree',
    '.lx-virtual-tree__row',
    '.lx-virtual-tree__empty',
  ],
};

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const results = [];

try {
  for (const view of cases) {
    const url = view.component === 'transfer'
      ? 'http://127.0.0.1:4174/components/lxtransferpanel'
      : 'http://127.0.0.1:4174/components/lxvirtualtree';
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
      colorScheme: view.theme === 'hud' ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const requestFailures = [];
    page.on('console', (message) => {
      consoleMessages.push({ type: message.type(), text: message.text() });
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push({
      url: request.url(),
      error: request.failure()?.errorText ?? null,
    }));

    const viewResult = {
      id: view.id,
      url,
      viewport: { width: view.width, height: view.height },
      theme: view.theme,
      state: view.state,
      freshContextAndPage: true,
    };

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const rootSelector = view.component === 'transfer' ? '.transfer-panel-demo' : '.virtual-tree-demo';
      await page.locator(rootSelector).waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(500);

      const summaryText = view.component === 'transfer' ? '示例状态与主题' : '演示状态和更多操作';
      const summary = page.locator('summary').filter({ hasText: summaryText }).first();
      if (await summary.count()) {
        const open = await summary.locator('xpath=..').evaluate((element) => element.hasAttribute('open'));
        if (!open) await summary.click();
      }

      const themeLabel = page.locator('label').filter({ hasText: 'HUD 深色主题' }).first();
      const themeInput = themeLabel.locator('input[type="checkbox"]');
      if (await themeInput.count()) {
        const checked = await themeInput.isChecked();
        if ((view.theme === 'hud') !== checked) {
          view.theme === 'hud' ? await themeInput.check() : await themeInput.uncheck();
        }
      }

      const stateNames = {
        ready: '正常数据',
        loading: '加载中',
        error: '加载失败',
        empty: '空结果',
      };
      const stateButton = page.getByRole('button', { name: stateNames[view.state], exact: true }).first();
      if (view.state !== 'ready' || (await stateButton.count()) > 0) {
        await stateButton.click();
      }
      await page.waitForTimeout(350);

      const preflight = await page.evaluate(() => {
        const originalTitle = document.title;
        document.title = `${originalTitle} [Assessment B preflight]`;
        const probe = document.createElement('script');
        probe.textContent = 'window.__wave7AssessmentBPreflight = "executed";';
        document.head.appendChild(probe);
        const result = {
          titleMutation: document.title.endsWith('[Assessment B preflight]'),
          scriptElementAppended: probe.isConnected,
          inlineScriptExecuted: window.__wave7AssessmentBPreflight === 'executed',
          pageTitle: originalTitle,
        };
        probe.remove();
        delete window.__wave7AssessmentBPreflight;
        document.title = originalTitle;
        return result;
      });
      viewResult.preflight = preflight;
      viewResult.stateVisible = await page.locator(rootSelector).innerText();
      viewResult.beforeOverlay = await page.evaluate((sampleSelectors) => {
        const root = document.documentElement;
        const body = document.body;
        const samples = sampleSelectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return { selector, present: false };
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            selector,
            present: true,
            text: (element.innerText || '').trim().slice(0, 100),
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            display: style.display,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          };
        });
        return {
          viewportWidth: window.innerWidth,
          documentWidth: root.scrollWidth,
          bodyWidth: body.scrollWidth,
          horizontalOverflow: root.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth,
          samples,
        };
      }, selectors[view.component]);

      await page.evaluate(() => window.scrollTo(0, 0));
      const scriptUrl = `http://localhost:${livePort}/detect.js`;
      viewResult.injectedScriptUrl = scriptUrl;
      await page.addScriptTag({ url: scriptUrl, timeout: 30000 });
      viewResult.scriptLoadSucceeded = true;
      await page.waitForTimeout(2500);
      viewResult.afterOverlay = await page.evaluate((sampleSelectors) => {
        const candidates = Array.from(document.querySelectorAll('body *')).filter((element) => {
          const marker = `${element.id || ''} ${typeof element.className === 'string' ? element.className : ''}`;
          return /impeccable|detector|overlay/i.test(marker);
        }).slice(0, 100).map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : null,
          text: (element.innerText || '').trim().slice(0, 140),
          shadowRoot: Boolean(element.shadowRoot),
        }));
        return {
          bodyChildCount: document.body.children.length,
          candidateNodes: candidates,
          scriptTags: Array.from(document.scripts)
            .filter((script) => script.src.includes('detect.js'))
            .map((script) => ({ src: script.src, loaded: script.isConnected })),
          remainingPreflightProbe: Boolean(window.__wave7AssessmentBPreflight),
          samples: sampleSelectors.map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return { selector, present: false };
            const style = getComputedStyle(element);
            return { selector, present: true, color: style.color, backgroundColor: style.backgroundColor };
          }),
        };
      }, selectors[view.component]);
      viewResult.impeccableConsoleHits = consoleMessages.filter((message) => /impeccable/i.test(message.text));
      viewResult.consoleMessages = consoleMessages;
      viewResult.pageErrors = pageErrors;
      viewResult.requestFailures = requestFailures;
      viewResult.screenshot = `screenshots/${view.id}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, `${view.id}.png`), fullPage: true, animations: 'disabled' });
    } catch (error) {
      viewResult.error = error.stack || error.message;
      viewResult.consoleMessages = consoleMessages;
      viewResult.pageErrors = pageErrors;
      viewResult.requestFailures = requestFailures;
    } finally {
      await context.close();
    }

    results.push(viewResult);
  }
} finally {
  await browser.close();
}

const report = {
  createdAt: new Date().toISOString(),
  browser: 'Microsoft Edge via Playwright Chromium driver',
  freshContexts: true,
  reusedUserTab: false,
  livePort,
  views: results,
};
await fs.writeFile(path.join(evidenceDir, 'browser-evidence.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  viewCount: results.length,
  successfulViews: results.filter((view) => view.scriptLoadSucceeded && view.preflight?.inlineScriptExecuted).length,
  failedViews: results.filter((view) => view.error).map((view) => ({ id: view.id, error: view.error.split('\n')[0] })),
  horizontalOverflow: results.filter((view) => view.beforeOverlay?.horizontalOverflow).map((view) => view.id),
  consoleErrorViews: results.filter((view) => view.consoleMessages?.some((message) => message.type === 'error')).map((view) => view.id),
  output: path.join(evidenceDir, 'browser-evidence.json'),
}, null, 2));
