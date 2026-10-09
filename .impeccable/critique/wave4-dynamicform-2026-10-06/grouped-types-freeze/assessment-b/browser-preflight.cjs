const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const outputDir = __dirname;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  const events = { console: [], pageErrors: [], failedRequests: [], httpErrors: [] };
  page.on('console', message => events.console.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => events.pageErrors.push(String(error)));
  page.on('requestfailed', request => events.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || null }));
  page.on('response', response => {
    if (response.status() >= 400) events.httpErrors.push({ url: response.url(), status: response.status() });
  });

  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.innerText || null,
    theme: {
      className: document.documentElement.className,
      dataTheme: document.documentElement.getAttribute('data-theme'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      background: getComputedStyle(document.body).backgroundColor,
    },
    controls: Array.from(document.querySelectorAll('button, [role="button"]')).map((el, index) => ({
      index,
      text: (el.innerText || '').trim().slice(0, 100),
      ariaLabel: el.getAttribute('aria-label'),
      title: el.getAttribute('title'),
      pressed: el.getAttribute('aria-pressed'),
      className: typeof el.className === 'string' ? el.className.slice(0, 160) : '',
      dataTheme: el.getAttribute('data-theme'),
    })),
    bodyTextStart: (document.body.innerText || '').slice(0, 900),
  }));

  const probe = await page.evaluate(() => {
    document.title = '[Assessment B preflight] ' + document.title;
    const script = document.createElement('script');
    script.textContent = 'window.__assessmentBInjectionProbe = "mutable-injection-ok";';
    document.head.appendChild(script);
    return {
      titleChanged: document.title.startsWith('[Assessment B preflight]'),
      scriptAppended: script.isConnected,
      scriptExecuted: window.__assessmentBInjectionProbe === 'mutable-injection-ok',
      scriptTagCount: document.head.querySelectorAll('script').length,
    };
  });

  const after = await page.evaluate(() => ({
    title: document.title,
    theme: {
      className: document.documentElement.className,
      dataTheme: document.documentElement.getAttribute('data-theme'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      background: getComputedStyle(document.body).backgroundColor,
    },
  }));
  await page.screenshot({ path: path.join(outputDir, 'preflight.png'), fullPage: true });

  const evidence = {
    targetUrl,
    capturedAt: new Date().toISOString(),
    responseStatus: response?.status() ?? null,
    responseUrl: response?.url() ?? null,
    viewport: page.viewportSize(),
    mutableInjectionPreflight: probe,
    before,
    after,
    events,
    screenshot: 'preflight.png',
  };
  fs.writeFileSync(path.join(outputDir, 'preflight.json'), JSON.stringify(evidence, null, 2) + '\n');
  await browser.close();
}

main().catch(error => {
  process.stderr.write(String(error?.stack || error) + '\n');
  process.exitCode = 1;
});
