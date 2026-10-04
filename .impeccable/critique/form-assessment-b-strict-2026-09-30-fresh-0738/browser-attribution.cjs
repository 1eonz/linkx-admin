const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const blocked = [];
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (['GET', 'HEAD'].includes(request.method()) && request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr' && url.origin === 'http://localhost:4177') return route.continue();
    blocked.push({ method: request.method(), type: request.resourceType(), url: request.url() });
    return route.abort('blockedbyclient');
  });
  const pages = [];

  const lxPage = await context.newPage();
  await lxPage.goto('http://localhost:4177/components/lxform', { waitUntil: 'domcontentloaded' });
  await lxPage.getByRole('button', { name: '提交校验', exact: true }).first().click();
  await lxPage.waitForTimeout(250);
  pages.push(await lxPage.evaluate(() => {
    const clip = document.querySelector('span.container');
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const ancestors = [];
    for (let node = clip, index = 0; node && index < 5; node = node.parentElement, index += 1) {
      const style = getComputedStyle(node);
      ancestors.push({ tag: node.tagName.toLowerCase(), className: typeof node.className === 'string' ? node.className : '', rect: rect(node), overflow: style.overflow, position: style.position, text: (node.innerText || '').trim().slice(0, 140) });
    }
    return {
      view: 'lxform-mobile',
      clippedSpan: clip ? { outerHTML: clip.outerHTML.slice(0, 600), rect: rect(clip), childNodes: [...clip.children].map((child) => ({ tag: child.tagName.toLowerCase(), className: child.className, rect: rect(child), position: getComputedStyle(child).position })) } : null,
      clipAncestors: ancestors,
      activeElement: { tag: document.activeElement?.tagName?.toLowerCase() ?? null, className: typeof document.activeElement?.className === 'string' ? document.activeElement.className : '', text: document.activeElement?.innerText?.trim() ?? '' },
      ids: ['#el-id-1024-3'].map((selector) => { const element = document.querySelector(selector); return { selector, exists: !!element, tag: element?.tagName.toLowerCase() ?? null, className: typeof element?.className === 'string' ? element.className : '', hidden: element ? !element.getClientRects().length : null, outerHTML: element?.outerHTML.slice(0, 500) ?? null }; }),
    };
  }));
  await lxPage.close();

  const dynamicPage = await context.newPage();
  await dynamicPage.goto('http://localhost:4177/components/lxdynamicform', { waitUntil: 'domcontentloaded' });
  await dynamicPage.getByRole('button', { name: '提交校验', exact: true }).first().click();
  await dynamicPage.waitForTimeout(250);
  const settings = dynamicPage.locator('details.dynamic-form-demo__settings');
  await settings.locator('summary').click();
  await settings.locator('label.el-checkbox').nth(1).click();
  await dynamicPage.waitForTimeout(100);
  pages.push(await dynamicPage.evaluate(() => {
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const elementSnapshot = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, exists: false };
      return {
        selector,
        exists: true,
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        rect: rect(element),
        hidden: !element.getClientRects().length,
        text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 180),
        parentText: (element.parentElement?.innerText || '').trim().slice(0, 200),
        closestFormItemLabel: element.closest('.el-form-item')?.querySelector('.el-form-item__label')?.innerText?.trim() ?? null,
        outerHTML: element.outerHTML.slice(0, 500),
      };
    };
    const clip = document.querySelector('span.container');
    const bodyStyle = getComputedStyle(document.body);
    return {
      view: 'lxdynamicform-hud-dark-reduced-mobile',
      demoClass: document.querySelector('.dynamic-form-demo')?.className ?? null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      clippedSpan: clip ? { outerHTML: clip.outerHTML.slice(0, 600), rect: rect(clip), parentClass: clip.parentElement?.className ?? null } : null,
      ids: ['#el-id-1024-3', '#el-id-1024-8', '#el-id-1024-10', '#el-id-1024-11'].map(elementSnapshot),
      bodyMotion: { transitionProperty: bodyStyle.transitionProperty, transitionDuration: bodyStyle.transitionDuration, transitionTimingFunction: bodyStyle.transitionTimingFunction, animationName: bodyStyle.animationName, animationDuration: bodyStyle.animationDuration, animationTimingFunction: bodyStyle.animationTimingFunction },
      uploadLabels: [...document.querySelectorAll('.lx-upload__hint, .lx-upload__browse, .lx-upload__file-status')].map((element) => ({ tag: element.tagName.toLowerCase(), className: element.className, text: (element.innerText || '').trim(), color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor, rect: rect(element) })),
      hiddenDemoControls: [...document.querySelectorAll('.dynamic-form-demo__candidate-controls, .dynamic-form-demo__candidate-controls *')].map((element) => ({ tag: element.tagName.toLowerCase(), className: typeof element.className === 'string' ? element.className : '', hidden: !element.getClientRects().length, rect: element.getClientRects().length ? rect(element) : null, text: (element.innerText || '').trim().slice(0, 80) })).slice(0, 12),
    };
  }));
  await dynamicPage.close();
  await browser.close();
  const evidence = { pages, blockedRequests: blocked };
  fs.writeFileSync(path.join(__dirname, 'browser', 'detector-attribution.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => { console.error(error.stack || String(error)); process.exitCode = 1; });
