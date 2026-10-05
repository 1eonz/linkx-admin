import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const outputDir = path.resolve('.impeccable/critique/wave2-checkbox-radio-2026-10-05/assessment-b-rerun');
const routeBase = 'http://127.0.0.1:4174';
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const packageRequire = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json');
const { chromium } = packageRequire('@playwright/test');
const detectorSource = fs.readFileSync(detectorPath, 'utf8');
const scenarios = [
  { id: 'checkbox-light-desktop', route: '/components/lxcheckbox', width: 1280, height: 900, state: '浅色桌面默认态，显示已选、半选、未选与禁用项' },
  { id: 'checkbox-hud-dark-desktop', route: '/components/lxcheckbox', width: 1280, height: 900, hud: true, state: 'HUD 深色桌面' },
  { id: 'checkbox-touch-375', route: '/components/lxcheckbox', width: 375, height: 812, mobile: true, touch: { selector: '.lx-checkbox', text: '已知晓涉密核验义务并承诺遵守' }, state: '375px 触屏；实际点按 checkbox' },
  { id: 'checkbox-disabled-selected-half-375', route: '/components/lxcheckbox', width: 375, height: 812, mobile: true, disabledStates: true, state: '禁用已选与禁用半选回显' },
  { id: 'radio-light-desktop', route: '/components/lxradio', width: 1280, height: 900, state: '浅色桌面默认态' },
  { id: 'radio-hud-dark-desktop', route: '/components/lxradio', width: 1280, height: 900, hud: true, state: 'HUD 深色桌面' },
  { id: 'radio-touch-375', route: '/components/lxradio', width: 375, height: 812, mobile: true, touch: { selector: '.lx-radio', text: '应急处突' }, state: '375px 触屏；实际点按 radio' },
  { id: 'radio-keyboard-focus-reduced-motion', route: '/components/lxradio', width: 1280, height: 900, reducedMotion: true, keyboard: true, state: 'Tab 焦点、水平组方向键、垂直组方向键跳过禁用项、减少动效' },
];

const evidence = {
  generatedAt: new Date().toISOString(),
  routeBase,
  browser: null,
  browserSession: '本轮单独启动的 Chrome 进程；每个视图使用新的 BrowserContext 和页面标签',
  detectorSource: detectorPath,
  detectorHost: null,
  cuaFallback: {
    getState: { apps: [], browsers: [] },
    error: 'Browser is not available: iab',
    processExitCode: null,
    note: 'CUA 是工具调用而非本地进程；其失败没有进程退出码。Playwright 提供后续独立浏览器采集。',
  },
  scenarios: [],
  console: [],
  network: [],
};

let detectorServer;
let browser;

function cleanText(value) {
  return value?.trim().replace(/\s+/g, ' ') || null;
}

async function scanSnapshot(page, label) {
  return page.evaluate((snapshotLabel) => {
    const clean = (value) => value?.trim().replace(/\s+/g, ' ') || null;
    const root = document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
    const isCheckbox = Boolean(document.querySelector('.lx-checkbox-demo'));
    const controls = [...document.querySelectorAll(
      isCheckbox ? '.lx-checkbox-demo .el-checkbox' : '.lx-radio-demo .el-radio',
    )].map((element) => {
      const input = element.querySelector('input');
      const rect = element.getBoundingClientRect();
      const inner = element.querySelector(isCheckbox ? '.el-checkbox__inner' : '.el-radio__inner');
      return {
        label: clean(element.innerText),
        checked: Boolean(input?.checked),
        indeterminate: Boolean(input?.indeterminate),
        disabled: Boolean(input?.disabled),
        ariaChecked: element.getAttribute('aria-checked') || input?.getAttribute('aria-checked') || null,
        role: element.getAttribute('role') || null,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        focusVisible: Boolean(input?.matches(':focus-visible')),
        transitionDuration: inner ? getComputedStyle(inner).transitionDuration : null,
      };
    });
    const rootRect = root?.getBoundingClientRect();
    const rootStyle = root ? getComputedStyle(root) : null;
    const active = document.activeElement;
    return {
      label: snapshotLabel,
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        touch: matchMedia('(pointer: coarse)').matches,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      component: root ? {
        width: Math.round(rootRect.width),
        height: Math.round(rootRect.height),
        background: rootStyle.backgroundColor,
        color: rootStyle.color,
        hud: root.classList.contains('lx-theme-hud') || document.documentElement.classList.contains('lx-theme-hud'),
      } : null,
      controls,
      activeElement: active ? {
        tag: active.tagName,
        type: active.getAttribute('type'),
        label: clean(active.closest('.el-checkbox, .el-radio')?.innerText),
        focusVisible: active.matches(':focus-visible'),
        disabled: Boolean(active.disabled),
      } : null,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      overlayLabelCount: document.querySelectorAll('.impeccable-label').length,
      overlayDetails: [...document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)')].map((overlay) => {
        const target = overlay._targetEl;
        const component = target?.closest('.lx-checkbox, .lx-radio, .lx-checkbox-group, .lx-radio-group');
        const ancestors = [];
        for (let node = target?.parentElement; node && ancestors.length < 5; node = node.parentElement) {
          ancestors.push({
            tag: node.tagName,
            id: node.id || null,
            className: typeof node.className === 'string' ? node.className : null,
          });
        }
        return {
          label: clean(overlay.querySelector('.impeccable-label')?.innerText),
          targetTag: target?.tagName || null,
          targetClass: typeof target?.className === 'string' ? target.className : null,
          targetText: clean(target?.innerText)?.slice(0, 160) || null,
          component: component ? {
            className: typeof component.className === 'string' ? component.className : null,
            label: clean(component.innerText)?.slice(0, 160) || null,
          } : null,
          targetColor: target ? getComputedStyle(target).color : null,
          lxPrimary: getComputedStyle(document.documentElement).getPropertyValue('--lx-color-primary').trim() || null,
          elementPrimary: getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim() || null,
          ancestors,
        };
      }),
      preflightAttribute: document.body.dataset.assessmentB || null,
    };
  }, label);
}

async function injectDetector(page, scriptUrl) {
  return page.evaluate(async (url) => {
    document.title += ' [Assessment B]';
    document.body.dataset.assessmentB = 'preflight-ok';
    const script = document.createElement('script');
    script.src = url;
    const loaded = await new Promise((resolve) => {
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    let scanInvoked = false;
    let scanError = null;
    if (loaded && typeof window.impeccableScan === 'function') {
      try {
        window.impeccableScan();
        scanInvoked = true;
      } catch (error) {
        scanError = String(error);
      }
    }
    return {
      loaded,
      scanInvoked,
      scanError,
      scannerAvailable: typeof window.impeccableScan === 'function',
      scriptPresent: script.isConnected,
      scriptUrl: script.src,
    };
  }, scriptUrl);
}

try {
  if (!fs.existsSync(chromePath)) throw new Error(`Chrome 不存在：${chromePath}`);
  detectorServer = http.createServer((request, response) => {
    if (request.url !== '/detect.js') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(detectorSource),
    });
    response.end(detectorSource);
  });
  await new Promise((resolve, reject) => {
    detectorServer.once('error', reject);
    detectorServer.listen(0, '127.0.0.1', resolve);
  });
  evidence.detectorHost = `http://127.0.0.1:${detectorServer.address().port}/detect.js`;

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--no-proxy-server'],
  });
  evidence.browser = {
    name: 'Google Chrome',
    version: browser.version(),
    executablePath: chromePath,
    headless: true,
    playwright: packageRequire.resolve('@playwright/test'),
  };

  for (const scenario of scenarios) {
    const item = {
      ...scenario,
      status: 'started',
      preflight: null,
      injection: null,
      measurements: null,
      measurementsAfterOverlay: null,
      action: null,
      console: [],
      network: [],
      screenshot: `${scenario.id}-overlay.png`,
      error: null,
    };
    evidence.scenarios.push(item);
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      deviceScaleFactor: 1,
      isMobile: Boolean(scenario.mobile),
      hasTouch: Boolean(scenario.mobile),
      reducedMotion: scenario.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    const beforeConsole = evidence.console.length;
    const beforeNetwork = evidence.network.length;
    page.on('console', (message) => {
      const entry = { scenarioId: scenario.id, type: message.type(), text: message.text() };
      evidence.console.push(entry);
    });
    page.on('pageerror', (error) => {
      evidence.console.push({ scenarioId: scenario.id, type: 'pageerror', text: error.stack || String(error) });
    });
    page.on('request', (request) => {
      evidence.network.push({ scenarioId: scenario.id, event: 'request', url: request.url(), method: request.method(), resourceType: request.resourceType() });
    });
    page.on('response', (response) => {
      evidence.network.push({ scenarioId: scenario.id, event: 'response', url: response.url(), status: response.status(), resourceType: response.request().resourceType() });
    });
    page.on('requestfailed', (request) => {
      evidence.network.push({ scenarioId: scenario.id, event: 'failure', url: request.url(), error: request.failure()?.errorText || null, method: request.method() });
    });

    try {
      await page.addInitScript(() => {
        window.__IMPECCABLE_CONFIG__ = { ...(window.__IMPECCABLE_CONFIG__ || {}), autoScan: false };
      });
      await page.goto(`${routeBase}${scenario.route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('.lx-checkbox-demo, .lx-radio-demo').waitFor({ state: 'visible', timeout: 15000 });
      await page.evaluate((disabledStates) => {
        const target = disabledStates
          ? document.querySelector('[data-testid="disabled-states"]')
          : document.querySelector('.lx-checkbox-demo, .lx-radio-demo');
        target?.scrollIntoView({ block: 'center' });
      }, Boolean(scenario.disabledStates));

      if (scenario.hud) {
        const themeToggle = page.locator('.lx-checkbox-demo__toolbar input, .lx-radio-demo__toolbar input').first();
        await themeToggle.check();
        await page.waitForTimeout(150);
      }
      if (scenario.touch) {
        const target = page.locator(scenario.touch.selector).filter({ hasText: scenario.touch.text }).first();
        await target.scrollIntoViewIfNeeded();
        const bounds = await target.boundingBox();
        await target.tap();
        item.action = { type: 'touch', text: scenario.touch.text, bounds };
      }
      if (scenario.keyboard) {
        await page.locator('.lx-radio-demo__toolbar input').focus();
        await page.keyboard.press('Tab');
        const focusedAfterTab = await page.evaluate(() => ({
          label: document.activeElement?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
          focusVisible: Boolean(document.activeElement?.matches(':focus-visible')),
          disabled: Boolean(document.activeElement?.disabled),
        }));
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);
        const afterHorizontalArrow = await page.evaluate(() => {
          const horizontal = document.querySelector('[data-testid="horizontal"]');
          const active = document.activeElement;
          const selected = horizontal?.querySelector('input[type=radio]:checked');
          return {
            activeLabel: active?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
            activeFocusVisible: Boolean(active?.matches(':focus-visible')),
            selectedLabel: selected?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
          };
        });
        const verticalSelected = page.locator('[data-testid="vertical"] input[type=radio]:checked');
        await verticalSelected.focus();
        const verticalBeforeArrow = await page.evaluate(() => {
          const vertical = document.querySelector('[data-testid="vertical"]');
          const active = document.activeElement;
          const selected = vertical?.querySelector('input[type=radio]:checked');
          return {
            activeLabel: active?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
            activeFocusVisible: Boolean(active?.matches(':focus-visible')),
            selectedLabel: selected?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
          };
        });
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        const afterVerticalArrow = await page.evaluate(() => {
          const vertical = document.querySelector('[data-testid="vertical"]');
          const active = document.activeElement;
          const selected = vertical?.querySelector('input[type=radio]:checked');
          return {
            activeLabel: active?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
            activeFocusVisible: Boolean(active?.matches(':focus-visible')),
            selectedLabel: selected?.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null,
            disabledLabels: [...(vertical?.querySelectorAll('input[type=radio]:disabled') || [])]
              .map((input) => input.closest('.el-radio')?.innerText?.trim().replace(/\s+/g, ' ') || null),
          };
        });
        item.action = {
          type: 'keyboard',
          tabFocus: focusedAfterTab,
          arrowRight: afterHorizontalArrow,
          verticalBeforeArrow,
          arrowDown: afterVerticalArrow,
        };
      }

      item.measurements = await scanSnapshot(page, scenario.id);
      item.preflight = await page.evaluate(() => ({
        titleMutated: document.title.endsWith('[Assessment B]'),
        bodyAttribute: document.body.dataset.assessmentB || null,
        mutationApi: 'Playwright page.evaluate',
        insertionApi: 'HTMLScriptElement appended to document.head',
      }));
      item.injection = await injectDetector(page, evidence.detectorHost);
      await page.waitForTimeout(2500);
      item.measurementsAfterOverlay = await scanSnapshot(page, `${scenario.id}-after-overlay`);
      await page.screenshot({ path: path.join(outputDir, item.screenshot), fullPage: false, animations: 'disabled' });
      item.console = evidence.console.slice(beforeConsole);
      item.network = evidence.network.slice(beforeNetwork);
      item.status = item.injection.loaded && item.injection.scannerAvailable && item.injection.scanInvoked
        ? 'complete'
        : 'injection-failed';
    } catch (error) {
      item.status = 'failed';
      item.error = error?.stack || String(error);
      item.console = evidence.console.slice(beforeConsole);
      item.network = evidence.network.slice(beforeNetwork);
      try {
        await page.screenshot({ path: path.join(outputDir, `${scenario.id}-failure.png`), fullPage: false });
        item.failureScreenshot = `${scenario.id}-failure.png`;
      } catch (screenshotError) {
        item.failureScreenshotError = screenshotError?.stack || String(screenshotError);
      }
    } finally {
      await context.close();
    }
  }

  evidence.networkSummary = {
    eventCount: evidence.network.length,
    failures: evidence.network.filter((item) => item.event === 'failure'),
    httpErrors: evidence.network.filter((item) => item.event === 'response' && item.status >= 400),
    detectorResponses: evidence.network.filter((item) => item.event === 'response' && item.url.includes('/detect.js')),
  };
  evidence.consoleSummary = {
    total: evidence.console.length,
    errors: evidence.console.filter((item) => item.type === 'error' || item.type === 'pageerror'),
    impeccable: evidence.console.filter((item) => /impeccable/i.test(item.text)),
  };
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  process.stdout.write(JSON.stringify({
    browser: evidence.browser,
    scenarios: evidence.scenarios.map((item) => ({
      id: item.id,
      status: item.status,
      loaded: item.injection?.loaded ?? false,
      scannerAvailable: item.injection?.scannerAvailable ?? false,
      scanInvoked: item.injection?.scanInvoked ?? false,
      overlayNodes: item.measurementsAfterOverlay?.overlayCount ?? null,
      screenshot: item.screenshot,
      action: item.action,
      error: item.error,
    })),
    detectorResponses: evidence.networkSummary.detectorResponses.length,
    requestFailures: evidence.networkSummary.failures.length,
    httpErrors: evidence.networkSummary.httpErrors.length,
    consoleErrors: evidence.consoleSummary.errors.length,
  }, null, 2));
  if (evidence.scenarios.some((item) => item.status !== 'complete')) process.exitCode = 2;
} catch (error) {
  evidence.fatalError = error?.stack || String(error);
  fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
  process.stderr.write(`${evidence.fatalError}\n`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (detectorServer) await new Promise((resolve) => detectorServer.close(resolve));
}
