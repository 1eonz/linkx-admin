import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'F:/work/linkx-admin';
const outputDir = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-final-luna/assessment-b/browser');
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  const consoleEvents = [];
  page.on('console', (message) => consoleEvents.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => consoleEvents.push({ type: 'pageerror', text: error.message }));
  const url = 'http://127.0.0.1:4174/components/lxvirtualtree';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2500);
  const mutation = await page.evaluate(() => {
    const oldTitle = document.title;
    document.title = '[Human] Assessment B mutation preflight';
    const script = document.createElement('script');
    script.dataset.assessmentBPreflight = 'true';
    document.head.appendChild(script);
    const result = {
      titleChanged: document.title === '[Human] Assessment B mutation preflight',
      scriptAppended: script.parentElement === document.head,
      bodyPresent: !!document.body,
      titleBefore: oldTitle,
      titleAfter: document.title,
    };
    script.remove();
    return result;
  });
  await page.screenshot({ path: path.join(outputDir, 'mutation-preflight.png'), fullPage: true });
  fs.writeFileSync(path.join(outputDir, 'preflight-console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'preflight.json'), `${JSON.stringify({
    url,
    status: response?.status() ?? null,
    title: await page.title(),
    userAgent: await page.evaluate(() => navigator.userAgent),
    viewport: page.viewportSize(),
    browserVersion: browser.version(),
    mutation,
    consoleEventCount: consoleEvents.length,
  }, null, 2)}\n`, 'utf8');
  await context.close();
} finally {
  await browser.close();
}
