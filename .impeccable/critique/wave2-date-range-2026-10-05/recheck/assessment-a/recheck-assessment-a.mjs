import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const target = 'http://127.0.0.1:5180/components/lxdatepicker';
const artifactDir = path.resolve(process.cwd(), '../../.impeccable/critique/wave2-date-range-2026-10-05/recheck/assessment-a');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const { chromium } = createRequire(path.join(process.cwd(), 'package.json'))('@playwright/test');
const states = [
  { name: 'desktop-default', width: 1280, height: 720, mode: 'default' },
  { name: 'desktop-range-open', width: 1280, height: 720, mode: 'range', index: 0 },
  { name: 'desktop-shortcut-open', width: 1280, height: 720, mode: 'range', index: 1 },
  { name: 'mobile-375x812-range-open', width: 375, height: 812, mode: 'range', index: 0 },
  { name: 'mobile-375x812-shortcut-open', width: 375, height: 812, mode: 'range', index: 1 },
  { name: 'mobile-320x812-range-open', width: 320, height: 812, mode: 'range', index: 0 },
  { name: 'mobile-320x812-shortcut-open', width: 320, height: 812, mode: 'range', index: 1 },
  { name: 'mobile-320x375-range-open', width: 320, height: 375, mode: 'range', index: 0 },
  { name: 'mobile-320x375-shortcut-open', width: 320, height: 375, mode: 'range', index: 1 },
  { name: 'mobile-390x375-range-open', width: 390, height: 375, mode: 'range', index: 0 },
  { name: 'mobile-390x375-shortcut-open', width: 390, height: 375, mode: 'range', index: 1 },
];

await fs.mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const observations = [];

try {
  for (const state of states) {
    const mobile = state.width < 600;
    const context = await browser.newContext({
      viewport: { width: state.width, height: state.height },
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();

    try {
      await page.goto(target, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts?.ready);

      let editorMetrics = null;
      let popper = null;
      if (state.mode === 'range') {
        const editor = page.locator('.el-range-editor').nth(state.index);
        await editor.scrollIntoViewIfNeeded();
        editorMetrics = await editor.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        await editor.click();
        popper = page.locator('.lx-date-picker__popper:visible').last();
        await popper.waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForFunction(() => {
          const active = [...document.querySelectorAll('.lx-date-picker__popper')]
            .filter((node) => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0)
            .at(-1);
          if (!active) return false;
          return [...active.getAnimations({ subtree: true })].every((animation) =>
            animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity,
          );
        }, undefined, { timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(250);
      }

      const screenshot = `${state.name}.png`;
      await page.screenshot({ path: path.join(artifactDir, screenshot), fullPage: false });
      const observation = await page.evaluate(({ state, editorMetrics, screenshot }) => {
        const rectObject = (rect) => ({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        });
        const popper = [...document.querySelectorAll('.lx-date-picker__popper')]
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility === 'visible';
          })
          .at(-1);
        const popperRect = popper?.getBoundingClientRect();
        const viewport = { width: innerWidth, height: innerHeight };
        const arrows = popper ? [...popper.querySelectorAll('.el-popper__arrow')].map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            rect: rectObject(rect),
          };
        }) : [];
        const navigationButtons = popper ? [...popper.querySelectorAll('.el-picker-panel__icon-btn')].map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            label: node.getAttribute('aria-label'),
            title: node.getAttribute('title'),
            text: node.innerText.trim(),
            display: style.display,
            visibility: style.visibility,
            rect: rectObject(rect),
          };
        }) : [];
        const scrollables = popper ? [...popper.querySelectorAll('*')]
          .filter((node) => {
            const style = getComputedStyle(node);
            return ['auto', 'scroll'].includes(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
          })
          .map((node) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              className: typeof node.className === 'string' ? node.className : node.tagName,
              overflowY: style.overflowY,
              scrollTop: node.scrollTop,
              scrollHeight: node.scrollHeight,
              clientHeight: node.clientHeight,
              rect: rectObject(rect),
            };
          }) : [];
        const panels = popper ? [...popper.querySelectorAll('.el-picker-panel, .el-date-range-picker__content, .el-picker-panel__content')].map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            className: node.className,
            overflowY: style.overflowY,
            scrollTop: node.scrollTop,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight,
            rect: rectObject(rect),
          };
        }) : [];
        const visibleRect = popperRect ? {
          left: Math.max(0, popperRect.left),
          top: Math.max(0, popperRect.top),
          right: Math.min(viewport.width, popperRect.right),
          bottom: Math.min(viewport.height, popperRect.bottom),
        } : null;
        const visibleWidth = visibleRect ? Math.max(0, visibleRect.right - visibleRect.left) : 0;
        const visibleHeight = visibleRect ? Math.max(0, visibleRect.bottom - visibleRect.top) : 0;
        return {
          state: state.name,
          viewport,
          devicePixelRatio,
          scrollX,
          scrollY,
          pageWidth: document.documentElement.scrollWidth,
          pageHeight: document.documentElement.scrollHeight,
          screenshot,
          trigger: editorMetrics,
          popper: popperRect ? {
            ...rectObject(popperRect),
            fullyInsideViewport: popperRect.left >= 0 && popperRect.top >= 0 && popperRect.right <= viewport.width && popperRect.bottom <= viewport.height,
            visibleFraction: Number(((visibleWidth * visibleHeight) / (popperRect.width * popperRect.height)).toFixed(3)),
            overflowY: getComputedStyle(popper).overflowY,
            scrollTop: popper.scrollTop,
            scrollHeight: popper.scrollHeight,
            clientHeight: popper.clientHeight,
            className: popper.className,
          } : null,
          visibleMonthPanels: popper?.querySelectorAll('.el-date-range-picker__content').length ?? 0,
          visibleShortcutCount: popper?.querySelectorAll('.el-picker-panel__sidebar > *').length ?? 0,
          arrows,
          navigationButtons,
          panels,
          scrollables,
        };
      }, { state, editorMetrics, screenshot });

      if (popper) {
        const scrollTarget = await popper.evaluate((node) => {
          const candidates = [...node.querySelectorAll('*')]
            .filter((element) => {
              const style = getComputedStyle(element);
              return ['auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
            })
            .sort((a, b) => a.clientHeight - b.clientHeight);
          const element = candidates[0] ?? (node.scrollHeight > node.clientHeight + 1 ? node : null);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            x: Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2)),
            y: Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2)),
          };
        });
        if (scrollTarget) {
          const before = await page.evaluate(() => {
            const popper = [...document.querySelectorAll('.lx-date-picker__popper')]
              .find((node) => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0);
            return {
            scrollY,
            popperScrollTop: popper?.scrollTop ?? 0,
            scrollables: [...(popper?.querySelectorAll('*') ?? [])]
              .filter((element) => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1)
              .map((element) => ({ className: element.className, scrollTop: element.scrollTop })),
          };
          });
          await page.mouse.move(scrollTarget.x, scrollTarget.y);
          await page.mouse.wheel(0, 180);
          await page.waitForTimeout(150);
          const after = await page.evaluate(() => {
            const popper = [...document.querySelectorAll('.lx-date-picker__popper')]
              .find((node) => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0);
            return {
            scrollY,
            popperScrollTop: popper?.scrollTop ?? 0,
            scrollables: [...(popper?.querySelectorAll('*') ?? [])]
              .filter((element) => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1)
              .map((element) => ({ className: element.className, scrollTop: element.scrollTop })),
          };
          });
          observation.wheel = { point: scrollTarget, before, after };
        } else {
          observation.wheel = null;
        }
      }
      observations.push(observation);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(artifactDir, 'measurements.json'), `${JSON.stringify({
  target,
  captureDate: new Date().toISOString(),
  method: 'Assessment A only; eleven fresh Playwright BrowserContexts/Pages using installed Microsoft Edge through the Chromium protocol',
  screenshots: observations.map((observation) => observation.screenshot),
  observations,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ artifactDir, screenshots: observations.length, observations }, null, 2));
