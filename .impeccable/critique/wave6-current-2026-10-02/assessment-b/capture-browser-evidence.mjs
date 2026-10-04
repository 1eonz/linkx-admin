import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../../../other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs';

const outputDir = fileURLToPath(new URL('./', import.meta.url));
const baseUrl = 'http://127.0.0.1:4174';
const liveUrl = process.argv[2];
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

await mkdir(outputDir, { recursive: true });
const evidence = { preflight: {}, views: [], networkRequests: [], console: [] };

const preflight = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await preflight.goto(`${baseUrl}/components/lxtreeselect`, { waitUntil: 'networkidle' });
const originalTitle = await preflight.title();
evidence.preflight = await preflight.evaluate((title) => {
  document.title = `${title} [mutable-preflight]`;
  const script = document.createElement('script');
  script.dataset.mutablePreflight = 'true';
  script.textContent = 'window.__impeccablePreflight = true';
  document.head.append(script);
  const result = {
    titleChanged: document.title === `${title} [mutable-preflight]`,
    scriptAppended: Boolean(document.querySelector('script[data-mutable-preflight="true"]')),
    scriptExecuted: window.__impeccablePreflight === true,
  };
  document.title = title;
  script.remove();
  delete window.__impeccablePreflight;
  return result;
}, originalTitle);
await preflight.close();

async function capture(name, path, viewport, setup, inject = false) {
  const page = await browser.newPage({ viewport });
  page.on('request', (request) => evidence.networkRequests.push({
    view: name,
    method: request.method(),
    url: request.url(),
    resourceType: request.resourceType(),
  }));
  page.on('console', (message) => evidence.console.push({
    view: name,
    type: message.type(),
    text: message.text(),
  }));
  page.on('pageerror', (error) => evidence.console.push({ view: name, type: 'pageerror', text: error.message }));
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
  await setup(page);
  if (inject && liveUrl) {
    try {
      await page.addScriptTag({ url: `${liveUrl}/detect.js` });
      await page.waitForTimeout(2500);
    } catch (error) {
      evidence.console.push({ view: name, type: 'injection-error', text: String(error) });
    }
  }
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: false });
  evidence.views.push(await page.evaluate((view) => ({
    name: view,
    title: document.title,
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    visibleText: document.body.innerText.slice(0, 12000),
    overlayElements: document.querySelectorAll('[data-impeccable], .impeccable-overlay, [id*="impeccable"]').length,
  }), name));
  await page.close();
}

const desktop = { width: 1280, height: 900 };
const mobile = { width: 375, height: 812 };

await capture('treeselect-docs-desktop', '/components/lxtreeselect', desktop, async (page) => {
  await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded();
}, true);
await capture('treeselect-open-desktop', '/components/lxtreeselect', desktop, async (page) => {
  await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded();
  await page.locator('.lx-tree-select-demo__settings summary').click();
  await page.locator('.lx-tree-select').first().click();
  await page.locator('.lx-tree-select__popper').last().waitFor({ state: 'visible' });
}, true);
await capture('treeselect-error-mobile', '/components/lxtreeselect', mobile, async (page) => {
  await page.locator('.lx-tree-select-demo').scrollIntoViewIfNeeded();
  await page.locator('.lx-tree-select-demo__settings summary').click();
  await page.getByRole('button', { name: '模拟加载失败' }).click();
}, true);

await capture('cascader-docs-desktop', '/components/lxcascader', desktop, async (page) => {
  await page.locator('.cascader-demo').scrollIntoViewIfNeeded();
}, true);
await capture('cascader-open-desktop', '/components/lxcascader', desktop, async (page) => {
  await page.locator('.cascader-demo').scrollIntoViewIfNeeded();
  await page.locator('.cascader-demo__settings summary').click();
  await page.locator('.cascader-demo input').first().click();
  await page.locator('.lx-cascader__popper').last().waitFor({ state: 'visible' });
}, true);
await capture('cascader-error-mobile', '/components/lxcascader', mobile, async (page) => {
  await page.locator('.cascader-demo').scrollIntoViewIfNeeded();
  await page.locator('.cascader-demo__settings summary').click();
  await page.locator('.cascader-demo').getByRole('button', { name: '失败', exact: true }).click();
}, true);

await writeFile(`${outputDir}/browser-evidence.json`, JSON.stringify(evidence, null, 2), 'utf8');
await browser.close();
console.log(JSON.stringify({ preflight: evidence.preflight, views: evidence.views.map(({ name, title, viewport, overlayElements }) => ({ name, title, viewport, overlayElements })), requests: evidence.networkRequests.length, consoleEntries: evidence.console.length }, null, 2));
