const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const root = 'F:\\work\\linkx-admin';
const outDir = path.join(__dirname, 'browser');
const targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html';
const appRequire = createRequire(path.join(root, 'other-admin', 'admin-vue3', 'package.json'));
const { chromium } = appRequire('@playwright/test');
const candidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const browserRecord = { attempts: [] };
  let browser;
  for (const executablePath of candidates) {
    if (!fs.existsSync(executablePath)) {
      browserRecord.attempts.push({ executablePath, error: 'executable not found' });
      continue;
    }
    try {
      browser = await chromium.launch({ headless: true, executablePath, args: ['--no-first-run', '--no-default-browser-check'] });
      browserRecord.executablePath = executablePath;
      browserRecord.version = browser.version();
      break;
    } catch (error) {
      browserRecord.attempts.push({ executablePath, error: String(error) });
    }
  }
  if (!browser) throw new Error(`No Playwright browser could be started: ${JSON.stringify(browserRecord.attempts)}`);

  const events = { console: [], pageErrors: [], failedRequests: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.on('console', (message) => events.console.push({ type: message.type(), text: message.text(), location: message.location() }));
  page.on('pageerror', (error) => events.pageErrors.push(String(error)));
  page.on('requestfailed', (request) => events.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' }));

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    const mutation = await page.evaluate(() => {
      document.title = '[Assessment B preflight]';
      const script = document.createElement('script');
      script.id = '__assessment_b_mutation_preflight';
      script.textContent = "window.__assessmentBPreflight = { executed: true, marker: 'injection-ok' };";
      document.head.appendChild(script);
      return {
        title: document.title,
        scriptConnected: script.isConnected,
        scriptType: script.type || 'classic',
        marker: window.__assessmentBPreflight || null,
      };
    });
    const pageState = await page.evaluate(() => ({
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      htmlClass: document.documentElement.className,
      htmlTheme: document.documentElement.getAttribute('data-theme'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 20).map((el) => ({ tag: el.tagName, text: (el.innerText || '').trim().slice(0, 120) })),
      themeButtons: [...document.querySelectorAll('.VPSwitchAppearance, [aria-label*="theme" i], [title*="theme" i]')].map((el) => ({ tag: el.tagName, title: el.getAttribute('title'), ariaLabel: el.getAttribute('aria-label'), className: typeof el.className === 'string' ? el.className : '' })),
      hudCandidates: [...document.querySelectorAll('[data-hud], [class*="hud" i], [id*="hud" i]')].map((el) => ({ tag: el.tagName, id: el.id || null, className: typeof el.className === 'string' ? el.className : '' })).slice(0, 20),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const screenshotPath = path.join(outDir, 'preflight.png');
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
    const succeeded = response?.status() < 400
      && mutation.title === '[Assessment B preflight]'
      && mutation.scriptConnected
      && mutation.marker?.executed === true;
    const evidence = {
      createdAt: new Date().toISOString(),
      targetUrl,
      browser: browserRecord,
      freshContext: true,
      freshPage: true,
      responseStatus: response?.status() || null,
      mutableInjectionSucceeded: succeeded,
      mutation,
      pageState,
      console: events.console,
      pageErrors: events.pageErrors,
      failedRequests: events.failedRequests,
      screenshot: 'preflight.png',
    };
    fs.writeFileSync(path.join(outDir, 'preflight.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    process.stdout.write(JSON.stringify({ succeeded, responseStatus: evidence.responseStatus, browser: browserRecord, pageState }));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  fs.writeFileSync(path.join(outDir, 'preflight-error.json'), `${JSON.stringify({ error: String(error), createdAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  process.stderr.write(String(error));
  process.exitCode = 1;
});
