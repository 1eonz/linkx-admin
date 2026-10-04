const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (['GET', 'HEAD'].includes(request.method()) && url.origin === 'http://localhost:4177') return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4177/components/lxdynamicform', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => {
    const exactText = [...document.querySelectorAll('body *')].find((element) => element.children.length === 0 && element.textContent?.trim() === '演示设置');
    const ancestors = [];
    let current = exactText;
    for (let i = 0; current && i < 5; i += 1, current = current.parentElement) {
      ancestors.push({ tag: current.tagName, className: typeof current.className === 'string' ? current.className : '', text: (current.innerText || '').trim().slice(0, 1800), outerHTML: current.outerHTML.slice(0, 5000) });
    }
    const controls = [...document.querySelectorAll('main button, main input, main select, main [role="switch"], main [role="radio"], main [role="checkbox"]')].map((element) => ({
      tag: element.tagName,
      type: element.getAttribute('type'),
      text: (element.innerText || element.value || '').trim(),
      ariaLabel: element.getAttribute('aria-label'),
      title: element.getAttribute('title'),
      checked: 'checked' in element ? element.checked : null,
      className: typeof element.className === 'string' ? element.className : '',
      parentText: (element.parentElement?.innerText || '').trim().slice(0, 200),
      outerHTML: element.outerHTML.slice(0, 700),
    }));
    return { ancestors, controls };
  });
  fs.writeFileSync(path.join(__dirname, 'probe-dynamic-controls.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => { console.error(error.stack || String(error)); process.exitCode = 1; });
