import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'F:/work/linkx-admin';
const outputRoot = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-final-luna/assessment-b/browser/scenes');
const pages = [
  ['virtualtree', 'http://127.0.0.1:4174/components/lxvirtualtree'],
  ['transferpanel', 'http://127.0.0.1:4174/components/lxtransferpanel'],
];
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const results = [];
  for (const [name, url] of pages) {
    const sceneDir = path.join(outputRoot, name, 'desktop-light');
    fs.mkdirSync(sceneDir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      locale: 'zh-CN',
    });
    const page = await context.newPage();
    const consoleEvents = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => consoleEvents.push({ type: message.type(), text: message.text(), location: message.location() }));
    page.on('pageerror', (error) => pageErrors.push({ name: error.name, message: error.message, stack: error.stack }));
    page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), errorText: request.failure()?.errorText ?? null }));

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const injection = await page.addScriptTag({ url: 'http://127.0.0.1:8400/detect.js' }).then(() => ({ loaded: true, error: null }), (error) => ({ loaded: false, error: error.message }));
    await page.waitForTimeout(3000);

    const pageData = await page.evaluate(() => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const info = (el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        placeholder: el.getAttribute('placeholder'),
        type: el.getAttribute('type'),
        value: 'value' in el ? el.value : null,
        checked: 'checked' in el ? el.checked : null,
        disabled: 'disabled' in el ? el.disabled : null,
        className: typeof el.className === 'string' ? el.className : '',
      });
      const text = document.body?.innerText || '';
      const controls = [...document.querySelectorAll('button, [role="button"], input, select, textarea, [role="tree"], [role="treeitem"], [role="checkbox"], [role="tab"]')]
        .filter(visible)
        .map(info);
      const overlays = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-tooltip')].map((el) => ({
        tag: el.tagName.toLowerCase(),
        className: el.className,
        text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500),
        outerHTML: el.outerHTML.slice(0, 6000),
        rect: (() => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
      }));
      const headings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(visible).map((el) => el.innerText.trim());
      const relevantLines = text.split('\n').map((line) => line.trim()).filter((line) => /默认|继承|筛选|已选|可选|结果|节点|项目数|条/.test(line));
      return {
        title: document.title,
        url: location.href,
        htmlClass: document.documentElement.className,
        htmlDataTheme: document.documentElement.getAttribute('data-theme'),
        bodyClass: document.body?.className ?? null,
        headings,
        relevantLines,
        visibleControls: controls,
        visibleTreeItems: controls.filter((control) => control.role === 'treeitem').length,
        detectorGlobals: {
          impeccableDetect: typeof window.impeccableDetect,
          impeccableScan: typeof window.impeccableScan,
          impeccableScanAsync: typeof window.impeccableScanAsync,
        },
        overlays,
        bodyText: text.slice(0, 30000),
      };
    });

    const evidence = {
      route: name,
      url,
      status: response?.status() ?? null,
      browserVersion: browser.version(),
      viewport: page.viewportSize(),
      theme: 'Light (fresh context default)',
      injection,
      pageErrors,
      failedRequests,
      consoleEvents,
      pageData,
    };
    fs.writeFileSync(path.join(sceneDir, 'page.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(sceneDir, 'console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(sceneDir, 'overlay-dom.json'), `${JSON.stringify(pageData.overlays, null, 2)}\n`, 'utf8');
    await page.screenshot({ path: path.join(sceneDir, 'overlay.png'), fullPage: true });
    results.push({
      route: name,
      status: evidence.status,
      injectionLoaded: injection.loaded,
      detectorScanType: pageData.detectorGlobals.impeccableScan,
      overlayCount: pageData.overlays.length,
      consoleMessages: consoleEvents.map(({ type, text }) => ({ type, text })),
      controls: pageData.visibleControls,
      relevantLines: pageData.relevantLines,
      pageErrors,
      failedRequests,
    });
    await context.close();
  }

  fs.writeFileSync(path.join(outputRoot, 'discovery-summary.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}
