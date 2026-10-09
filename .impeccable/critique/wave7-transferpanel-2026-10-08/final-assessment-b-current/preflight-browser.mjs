import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(outDir, '..', '..', '..', '..');
const playwrightPath = path.join(repoRoot, 'other-admin', 'admin-vue3', 'node_modules', '@playwright', 'test', 'index.mjs');
const browserPath = process.argv[2] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const targetUrl = process.argv[3] ?? 'http://127.0.0.1:4177/components/lxtransferpanel';
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const browser = await chromium.launch({ headless: true, executablePath: browserPath });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, colorScheme: 'light' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
const mutation = await page.evaluate(() => {
  document.title = `${document.title} [Assessment B preflight]`;
  const script = document.createElement('script');
  script.dataset.assessmentBPreflight = 'true';
  script.textContent = 'window.__assessmentBPreflight = true;';
  document.head.appendChild(script);
  return {
    titleSet: document.title.endsWith('[Assessment B preflight]'),
    scriptAppended: script.isConnected,
    inlineScriptRan: window.__assessmentBPreflight === true,
  };
});
const report = {
  checkedAt: new Date().toISOString(),
  targetUrl,
  browser: { executablePath: browserPath, version: browser.version() },
  httpStatus: response?.status() ?? null,
  mutation,
  pageErrors,
};
await context.close();
await browser.close();
fs.writeFileSync(path.join(outDir, 'browser-mutation-preflight.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
