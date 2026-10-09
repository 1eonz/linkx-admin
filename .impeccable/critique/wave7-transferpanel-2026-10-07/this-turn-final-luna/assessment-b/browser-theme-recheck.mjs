import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'F:/work/linkx-admin';
const outputRoot = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-final-luna/assessment-b/browser/scenes-recheck');
const detectorUrl = 'http://127.0.0.1:8400/detect.js';
const routes = [
  { name: 'virtualtree', url: 'http://127.0.0.1:4174/components/lxvirtualtree' },
  { name: 'transferpanel', url: 'http://127.0.0.1:4174/components/lxtransferpanel' },
];
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const results = [];
  for (const route of routes) {
    for (const [device, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile-375', { width: 375, height: 812 }]]) {
      const scene = `${device}-hud`;
      const context = await browser.newContext({ viewport, colorScheme: 'light', locale: 'zh-CN' });
      const page = await context.newPage();
      const consoleEvents = [];
      const pendingArgs = [];
      const errors = [];
      page.on('console', (message) => {
        const event = { type: message.type(), text: message.text(), location: message.location(), args: [] };
        consoleEvents.push(event);
        pendingArgs.push(Promise.all(message.args().map(async (handle) => {
          try { return await handle.jsonValue(); } catch { return { unserializable: handle.toString() }; }
        })).then((args) => { event.args = args; }));
      });
      page.on('pageerror', (error) => errors.push({ name: error.name, message: error.message, stack: error.stack }));
      page.on('response', (response) => { if (response.status() >= 400) errors.push({ kind: 'http', url: response.url(), status: response.status() }); });

      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.querySelector('.VPSwitchAppearance'), null, { timeout: 10000 }).catch(() => {});
      const control = page.locator('.VPSwitchAppearance').first();
      const controlCount = await control.count();
      const themeBefore = controlCount ? await control.getAttribute('title').catch(() => null) : null;
      const visibleBefore = controlCount ? await control.isVisible().catch(() => false) : false;
      let clicked = false;
      if (controlCount && themeBefore === 'Switch to dark theme') {
        if (visibleBefore) {
          await control.click();
          clicked = true;
        } else {
          await page.evaluate(() => document.querySelector('.VPSwitchAppearance')?.click());
          clicked = true;
        }
        await page.waitForTimeout(350);
      }
      const themeAfter = controlCount ? await control.getAttribute('title').catch(() => null) : null;
      const titleMutation = await page.evaluate((title) => {
        document.title = title;
        const script = document.createElement('script');
        script.dataset.assessmentBPreflight = 'true';
        document.head.appendChild(script);
        const result = { titleChanged: document.title === title, scriptAppended: script.parentElement === document.head };
        script.remove();
        return result;
      }, `[Human] Assessment B ${route.name}/${scene}`);
      const injection = await page.addScriptTag({ url: detectorUrl }).then(() => ({ loaded: true, error: null }), (error) => ({ loaded: false, error: error.message }));
      await page.waitForTimeout(2800);
      const state = await page.evaluate(() => {
        const overlays = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-tooltip')].map((element) => ({
          className: element.className,
          text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500),
          outerHTML: element.outerHTML.slice(0, 8000),
          rect: (() => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; })(),
        }));
        return {
          title: document.title,
          htmlClass: document.documentElement.className,
          htmlDataTheme: document.documentElement.getAttribute('data-theme'),
          themeMediaDark: matchMedia('(prefers-color-scheme: dark)').matches,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          bodyColor: getComputedStyle(document.body).color,
          viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight, scrollWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth },
          hasHudNamedText: /\bHUD\b/i.test(document.body?.innerText || ''),
          inheritText: (document.body?.innerText || '').split('\n').map((line) => line.trim()).filter((line) => /保留下级继承授权|本地演示假设/.test(line)),
          detector: { detect: typeof window.impeccableDetect, scan: typeof window.impeccableScan },
          overlays,
        };
      });
      await Promise.all(pendingArgs);
      const evidence = {
        route: route.name,
        url: route.url,
        scene,
        status: response?.status() ?? null,
        browserVersion: browser.version(),
        requestedTheme: 'HUD',
        themeControl: { count: controlCount, titleBefore: themeBefore, visibleBefore, clicked, titleAfter: themeAfter },
        mutation: titleMutation,
        injection,
        state,
        consoleEvents,
        errors,
      };
      const dir = path.join(outputRoot, route.name, scene);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
      fs.writeFileSync(path.join(dir, 'console.json'), `${JSON.stringify(consoleEvents, null, 2)}\n`, 'utf8');
      fs.writeFileSync(path.join(dir, 'overlay-dom.json'), `${JSON.stringify(state.overlays, null, 2)}\n`, 'utf8');
      await page.screenshot({ path: path.join(dir, 'screenshot.png'), fullPage: true });
      results.push({
        route: route.name,
        scene,
        status: evidence.status,
        requestedTheme: evidence.requestedTheme,
        themeControl: evidence.themeControl,
        actualDark: state.htmlClass.includes('dark') || state.themeMediaDark || themeAfter === 'Switch to light theme',
        htmlClass: state.htmlClass,
        bodyBackground: state.bodyBackground,
        viewport: state.viewport,
        hasHudNamedText: state.hasHudNamedText,
        detectorConsole: consoleEvents.filter((event) => event.text.includes('[impeccable]')).map((event) => ({ type: event.type, text: event.text, args: event.args })),
        overlayCount: state.overlays.length,
        errors,
      });
      await context.close();
    }
  }
  fs.writeFileSync(path.join(outputRoot, 'summary.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}
