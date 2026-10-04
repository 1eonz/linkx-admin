import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const target = 'http://127.0.0.1:5180/components/lxdatepicker';
const artifactDir = path.resolve(
  process.cwd(),
  '../../.impeccable/critique/wave2-date-range-2026-10-05/final-review/assessment-a/stable-recheck',
);
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const { chromium } = createRequire(path.join(process.cwd(), 'package.json'))(
  '@playwright/test',
);
const states = [
  { name: '390x375-ordinary', width: 390, height: 375, editorIndex: 0 },
  { name: '390x375-shortcut', width: 390, height: 375, editorIndex: 1 },
  { name: '320x375-ordinary', width: 320, height: 375, editorIndex: 0 },
  { name: '320x375-shortcut', width: 320, height: 375, editorIndex: 1 },
  { name: '320x812-shortcut', width: 320, height: 812, editorIndex: 1 },
  { name: '390x844-shortcut', width: 390, height: 844, editorIndex: 1 },
  { name: '1280x720-range', width: 1280, height: 720, editorIndex: 0 },
  { name: '1280x720-shortcut', width: 1280, height: 720, editorIndex: 1 },
];

await fs.mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const observations = [];

try {
  for (const state of states) {
    const mobile = state.width <= 640;
    const context = await browser.newContext({
      viewport: { width: state.width, height: state.height },
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);

    const editor = page.locator('.el-range-editor').nth(state.editorIndex);
    await editor.scrollIntoViewIfNeeded();
    await editor.click();
    const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]').last();
    await popper.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForFunction(() => {
      const active = [...document.querySelectorAll('.lx-date-picker__popper')]
        .filter((node) => node.getBoundingClientRect().width > 0)
        .at(-1);
      if (!active) return false;
      return [...active.getAnimations({ subtree: true })].every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.effect?.getTiming().iterations === Infinity,
      );
    }, undefined, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );

    const screenshot = `${state.name}.png`;
    await page.screenshot({ path: path.join(artifactDir, screenshot), fullPage: false });
    const measurement = await page.evaluate(({ state, screenshot }) => {
      const rect = (value) => ({
        x: Number(value.x.toFixed(2)),
        y: Number(value.y.toFixed(2)),
        width: Number(value.width.toFixed(2)),
        height: Number(value.height.toFixed(2)),
        top: Number(value.top.toFixed(2)),
        right: Number(value.right.toFixed(2)),
        bottom: Number(value.bottom.toFixed(2)),
        left: Number(value.left.toFixed(2)),
      });
      const visible = (node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && getComputedStyle(node).visibility === 'visible';
      };
      const activePopper = [...document.querySelectorAll('.lx-date-picker__popper')]
        .filter(visible)
        .at(-1);
      const picker = activePopper?.querySelector('.el-picker-panel');
      const table = activePopper?.querySelector('.el-date-table');
      const rows = table ? [...table.querySelectorAll('tbody tr')] : [];
      const visibleRows = rows.filter((row) => {
        const bounds = row.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < innerHeight;
      });
      const popperBounds = activePopper?.getBoundingClientRect();
      const pickerBounds = picker?.getBoundingClientRect();
      const tableBounds = table?.getBoundingClientRect();
      const trigger = document.querySelectorAll('.el-range-editor').item(state.editorIndex);
      const triggerBounds = trigger?.getBoundingClientRect();
      const label = trigger?.closest('.lx-date-picker-demo__field')
        ?.querySelector('.lx-date-picker-demo__label:not(.lx-date-picker-demo__sr-only)');
      const labelBounds = label?.getBoundingClientRect();
      const intersect = (a, b) => Boolean(
        a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
      );
      const intersectionWidth = popperBounds
        ? Math.max(0, Math.min(innerWidth, popperBounds.right) - Math.max(0, popperBounds.left))
        : 0;
      const intersectionHeight = popperBounds
        ? Math.max(0, Math.min(innerHeight, popperBounds.bottom) - Math.max(0, popperBounds.top))
        : 0;
      return {
        state: state.name,
        viewport: { width: innerWidth, height: innerHeight },
        scrollY,
        screenshot,
        trigger: triggerBounds ? rect(triggerBounds) : null,
        label: labelBounds ? rect(labelBounds) : null,
        labelIntersectsPopper: intersect(labelBounds, popperBounds),
        popper: popperBounds ? {
          rect: rect(popperBounds),
          fullyInsideViewport: popperBounds.left >= 0 && popperBounds.top >= 0 &&
            popperBounds.right <= innerWidth && popperBounds.bottom <= innerHeight,
          visibleFraction: Number(((intersectionWidth * intersectionHeight) /
            (popperBounds.width * popperBounds.height)).toFixed(3)),
          viewportFit: activePopper.classList.contains('lx-date-picker__popper--viewport-fit'),
        } : null,
        picker: pickerBounds ? {
          rect: rect(pickerBounds),
          overflowY: getComputedStyle(picker).overflowY,
          scrollTop: picker.scrollTop,
          scrollHeight: picker.scrollHeight,
          clientHeight: picker.clientHeight,
        } : null,
        calendar: tableBounds ? {
          rect: rect(tableBounds),
          rowCount: rows.length,
          rowsIntersectingViewport: visibleRows.length,
          lastRow: rows.length ? rect(rows.at(-1).getBoundingClientRect()) : null,
        } : null,
      };
    }, { state, screenshot });
    observations.push(measurement);
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(artifactDir, 'measurements.json'),
  JSON.stringify({
    target,
    method: 'Fresh Edge contexts; open picker, wait for animations to finish, then 250ms and two animation frames.',
    capturedAt: new Date().toISOString(),
    observations,
  }, null, 2),
);
