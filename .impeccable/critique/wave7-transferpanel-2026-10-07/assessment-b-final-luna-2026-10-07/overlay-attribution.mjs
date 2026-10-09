#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://127.0.0.1:4174/components/lxtransferpanel';
const executablePath = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'));
const { chromium } = require('@playwright/test');
const handle = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'live-server.handle.json'), 'utf8'));
const overlayUrl = `http://127.0.0.1:${handle.port}/detect.js`;
const consoleEntries = [];
const consoleJobs = [];
const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on('console', (message) => {
  consoleJobs.push((async () => {
    const args = message.args();
    let target = null;
    if (args.length > 0) {
      try {
        target = await args.at(-1).evaluate((value) => {
          if (!value || typeof value !== 'object' || value.nodeType !== 1) {
            return { kind: typeof value, preview: String(value).slice(0, 200) };
          }
          const element = value;
          const parts = [];
          for (let current = element; current && current.nodeType === 1 && parts.length < 6; current = current.parentElement) {
            let part = current.tagName.toLowerCase();
            if (current.id) {
              part += `#${current.id}`;
              parts.unshift(part);
              break;
            }
            const classes = String(current.className || '').split(/\s+/).filter(Boolean).slice(0, 2);
            if (classes.length) part += `.${classes.join('.')}`;
            parts.unshift(part);
          }
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            kind: 'element',
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: String(element.className || '').slice(0, 240),
            selector: parts.join(' > '),
            text: (element.innerText || element.textContent || '').trim().slice(0, 280),
            outerHTML: element.outerHTML.slice(0, 600),
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            style: {
              opacity: style.opacity,
              backgroundImage: style.backgroundImage.slice(0, 160),
              transitionProperty: style.transitionProperty,
              transitionTimingFunction: style.transitionTimingFunction,
            },
          };
        });
      } catch (error) {
        target = { error: error instanceof Error ? error.message : String(error) };
      }
    }
    consoleEntries.push({ type: message.type(), text: message.text(), target });
  })());
});

try {
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator('.lx-transfer-panel').first().waitFor({ state: 'visible', timeout: 20000 });
  const settings = page.locator('.transfer-panel-demo__settings');
  if (!(await settings.evaluate((element) => element.open))) await settings.locator('summary').click();
  await page.addScriptTag({ url: overlayUrl, timeout: 15000 });
  await page.waitForTimeout(2500);
  await Promise.all(consoleJobs);
  const overlays = await page.evaluate((url) => ({
    elements: [...document.querySelectorAll('.impeccable-overlay')].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        className: String(element.className),
        text: (element.innerText || element.textContent || '').trim().slice(0, 300),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    }),
    labels: [...document.querySelectorAll('.impeccable-label')].map((element) => (element.innerText || element.textContent || '').trim()),
    scriptPresent: [...document.scripts].some((script) => script.src === url),
  }), overlayUrl);
  const record = {
    command: `node "${path.relative(process.cwd(), fileURLToPath(import.meta.url)).replaceAll(path.sep, '/')}"`,
    targetUrl: baseUrl,
    responseStatus: response?.status() ?? null,
    browserExecutable: executablePath,
    newIsolatedContext: true,
    overlayUrl,
    overlayScriptPresent: overlays.scriptPresent,
    overlayElements: overlays.elements,
    overlayLabels: overlays.labels,
    consoleFindings: consoleEntries.filter((entry) => /anti-patterns found|line-length|buried-raster|edge-flush-cards|bounce-easing|layout-transition/i.test(entry.text)),
    consoleEntryCount: consoleEntries.length,
  };
  fs.writeFileSync(path.join(evidenceDir, 'overlay-attribution.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    responseStatus: record.responseStatus,
    overlayScriptPresent: record.overlayScriptPresent,
    overlayCount: record.overlayElements.length,
    ruleDetailCount: record.consoleFindings.filter((entry) => entry.type === 'log').length,
  }));
} finally {
  await context.close();
  await browser.close();
}
