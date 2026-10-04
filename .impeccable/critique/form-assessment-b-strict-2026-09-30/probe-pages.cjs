const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const outputDir = __dirname;
const cases = [
  ['lxform', 'http://localhost:4177/components/lxform'],
  ['lxdynamicform', 'http://localhost:4177/components/lxdynamicform'],
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const [name, url] of cases) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const routeEvents = [];
    await context.route('**/*', async (route) => {
      const request = route.request();
      const requestUrl = new URL(request.url());
      const allowed = ['GET', 'HEAD'].includes(request.method()) && requestUrl.origin === 'http://localhost:4177';
      if (allowed) return route.continue();
      routeEvents.push({ method: request.method(), url: request.url(), action: 'blocked' });
      return route.abort();
    });
    const page = await context.newPage();
    const consoleEvents = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => consoleEvents.push({ type: message.type(), text: message.text() }));
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('requestfailed', (request) => failedRequests.push({ method: request.method(), url: request.url(), failure: request.failure()?.errorText ?? null }));

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1200);
    const preflight = name === 'lxform'
      ? await (async () => {
          await page.evaluate(() => { document.title = 'Codex Injection Preflight'; });
          await page.addScriptTag({ content: 'window.__codexInjectionPreflight = "ok";' });
          return page.evaluate(() => ({ title: document.title, scriptValue: window.__codexInjectionPreflight ?? null }));
        })()
      : null;
    const pageSummary = await page.evaluate(() => {
      const visible = (element) => !!(element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      const controls = [...document.querySelectorAll('input, textarea, select, button, [role="button"], [role="combobox"], [role="switch"], [role="checkbox"], [role="radio"]')]
        .filter(visible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type'),
          text: (element.innerText || element.value || '').trim().slice(0, 120),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          ariaInvalid: element.getAttribute('aria-invalid'),
          className: typeof element.className === 'string' ? element.className : '',
          label: element.closest('.el-form-item')?.querySelector('.el-form-item__label')?.innerText?.trim() ?? element.closest('label')?.innerText?.trim() ?? null,
        }));
      return {
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map((element) => element.innerText.trim()),
        h2: [...document.querySelectorAll('h2')].map((element) => element.innerText.trim()).slice(0, 20),
        forms: [...document.querySelectorAll('.lx-form, .lx-dynamic-form, .el-form')].map((element) => ({ className: element.className, itemCount: element.querySelectorAll('.el-form-item').length })),
        controls,
        bodyText: document.body.innerText.slice(0, 7000),
      };
    });
    results.push({
      name,
      url,
      status: response?.status() ?? null,
      finalUrl: page.url(),
      preflight,
      pageSummary,
      consoleEvents,
      pageErrors,
      failedRequests,
      blockedRequests: routeEvents,
    });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(outputDir, 'probe-pages.json'), `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
