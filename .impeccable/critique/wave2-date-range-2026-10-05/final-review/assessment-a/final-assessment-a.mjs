import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const target = 'http://127.0.0.1:5180/components/lxdatepicker';
const artifactDir = path.resolve(
  process.cwd(),
  '../../.impeccable/critique/wave2-date-range-2026-10-05/final-review/assessment-a',
);
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const { chromium } = createRequire(path.join(process.cwd(), 'package.json'))(
  '@playwright/test',
);

await fs.mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: edgePath });
const observations = [];
const transitions = [];

async function createPage(width, height, mobile = width <= 640) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  return { context, page };
}

async function settle(page, frameCount = 5) {
  for (let frame = 0; frame < frameCount; frame += 1) {
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  await page.waitForTimeout(160);
}

async function openRange(page, index = 0, useKeyboard = false) {
  const editor = page.locator('.el-range-editor').nth(index);
  await editor.scrollIntoViewIfNeeded();
  const input = editor.locator('input.el-range-input').first();
  if (useKeyboard) {
    await input.focus();
    await input.press('ArrowDown');
  } else {
    await editor.click();
  }
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]').last();
  await popper.waitFor({ state: 'visible', timeout: 5000 });
  await settle(page);
  return { editor, input, popper };
}

async function readMetrics(page, state, editorIndex = 0) {
  return page.evaluate(({ state, editorIndex }) => {
    const rectData = (rect) => ({
      x: Number(rect.x.toFixed(2)),
      y: Number(rect.y.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      top: Number(rect.top.toFixed(2)),
      right: Number(rect.right.toFixed(2)),
      bottom: Number(rect.bottom.toFixed(2)),
      left: Number(rect.left.toFixed(2)),
    });
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(node).visibility === 'visible' &&
        node.getAttribute('aria-hidden') !== 'true'
      );
    };
    const editor = document.querySelectorAll('.el-range-editor').item(editorIndex);
    const field = editor?.closest('.lx-date-picker-demo__field');
    const label = field?.querySelector(
      '.lx-date-picker-demo__label:not(.lx-date-picker-demo__sr-only)',
    );
    const popper = [...document.querySelectorAll('.lx-date-picker__popper')]
      .filter(visible)
      .at(-1);
    const triggerRect = editor?.getBoundingClientRect();
    const labelRect = label?.getBoundingClientRect();
    const popperRect = popper?.getBoundingClientRect();
    const intersects = (a, b) => {
      if (!a || !b) return false;
      return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
      );
    };
    const picker = popper?.querySelector('.el-picker-panel');
    const tables = popper
      ? [...popper.querySelectorAll('.el-date-table')].filter(visible)
      : [];
    const tableInfo = tables.map((table) => {
      const tableRect = table.getBoundingClientRect();
      const lastRow = table.querySelector('tbody tr:last-child');
      const lastRowRect = lastRow?.getBoundingClientRect();
      const rows = [...table.querySelectorAll('tbody tr')];
      const visibleRows = rows.filter((row) => {
        const rowRect = row.getBoundingClientRect();
        return (
          picker &&
          rowRect.bottom > picker.getBoundingClientRect().top &&
          rowRect.top < picker.getBoundingClientRect().bottom
        );
      });
      return {
        rect: rectData(tableRect),
        rowCount: rows.length,
        visibleRowCount: visibleRows.length,
        lastRowRect: lastRowRect ? rectData(lastRowRect) : null,
        fullyVisibleInsidePanel: Boolean(
          picker &&
            tableRect.top >= picker.getBoundingClientRect().top - 1 &&
            tableRect.bottom <= picker.getBoundingClientRect().bottom + 1,
        ),
      };
    });
    const scrollStyle = picker ? getComputedStyle(picker) : null;
    const arrow = popper?.querySelector('.el-popper__arrow');
    const arrowStyle = arrow ? getComputedStyle(arrow) : null;
    const fieldInputs = editor ? [...editor.querySelectorAll('input')] : [];
    const labelCenter = labelRect
      ? {
          x: labelRect.left + labelRect.width / 2,
          y: labelRect.top + labelRect.height / 2,
        }
      : null;
    const labelHit = labelCenter
      ? document.elementFromPoint(labelCenter.x, labelCenter.y)
      : null;
    const editorIntersectsPopper = intersects(triggerRect, popperRect);
    const labelIntersectsPopper = intersects(labelRect, popperRect);
    const arrows = popper
      ? [...popper.querySelectorAll('.el-picker-panel__icon-btn')].map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            label: button.getAttribute('aria-label'),
            rect: rectData(rect),
            minTargetWidth: getComputedStyle(button).minWidth,
            minTargetHeight: getComputedStyle(button).height,
          };
        })
      : [];
    return {
      state,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { x: scrollX, y: scrollY },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      editor: triggerRect
        ? {
            rect: rectData(triggerRect),
            values: fieldInputs.map((input) => input.value),
            isFocused: fieldInputs.some((input) => input === document.activeElement),
          }
        : null,
      activeFieldLabel: label
        ? {
            text: label.innerText.trim(),
            rect: rectData(labelRect),
            intersectsPopper: labelIntersectsPopper,
            topHit: labelHit
              ? {
                  tag: labelHit.tagName,
                  className:
                    typeof labelHit.className === 'string' ? labelHit.className : '',
                  text: labelHit.innerText?.trim().slice(0, 60),
                }
              : null,
          }
        : null,
      popper: popperRect
        ? {
            rect: rectData(popperRect),
            insideViewport:
              popperRect.left >= 0 &&
              popperRect.top >= 0 &&
              popperRect.right <= innerWidth &&
              popperRect.bottom <= innerHeight,
            visibleFraction: Number(
              (Math.max(0, Math.min(innerWidth, popperRect.right) - Math.max(0, popperRect.left)) *
                Math.max(
                  0,
                  Math.min(innerHeight, popperRect.bottom) - Math.max(0, popperRect.top),
                )) /
                (popperRect.width * popperRect.height),
            ).toFixed(3),
            className: popper.className,
            viewportFit: popper.classList.contains(
              'lx-date-picker__popper--viewport-fit',
            ),
            position: getComputedStyle(popper).position,
            zIndex: getComputedStyle(popper).zIndex,
            background: getComputedStyle(popper).backgroundColor,
            textColor: getComputedStyle(popper).color,
            intersectsEditor: editorIntersectsPopper,
            arrowDisplay: arrowStyle?.display ?? null,
            arrowVisibility: arrowStyle?.visibility ?? null,
            shortcutCount:
              popper.querySelectorAll('.el-picker-panel__shortcut').length,
            monthCount: popper.querySelectorAll('.el-date-range-picker__content').length,
            picker: picker
              ? {
                  rect: rectData(picker.getBoundingClientRect()),
                  overflowY: scrollStyle?.overflowY,
                  scrollTop: picker.scrollTop,
                  scrollHeight: picker.scrollHeight,
                  clientHeight: picker.clientHeight,
                  background: scrollStyle?.backgroundColor,
                  textColor: scrollStyle?.color,
                }
              : null,
            calendars: tableInfo,
            navigationTargets: arrows,
          }
        : null,
      activeElement: {
        tag: document.activeElement?.tagName ?? null,
        className:
          typeof document.activeElement?.className === 'string'
            ? document.activeElement.className
            : '',
        text: document.activeElement?.textContent?.trim().slice(0, 60) ?? '',
        ariaLabel: document.activeElement?.getAttribute('aria-label') ?? null,
      },
    };
  }, { state, editorIndex });
}

async function saveObservation(page, state, screenshotName, editorIndex = 0) {
  await page.screenshot({ path: path.join(artifactDir, screenshotName), fullPage: false });
  const observation = await readMetrics(page, state, editorIndex);
  observation.screenshot = screenshotName;
  observations.push(observation);
  return observation;
}

async function captureResizeSequence(kind, editorIndex, stem) {
  const { context, page } = await createPage(390, 844, true);
  try {
    const { popper } = await openRange(page, editorIndex);
    await saveObservation(page, `${kind}-390x844-open`, `${stem}-390x844-open.png`, editorIndex);

    await page.setViewportSize({ width: 390, height: 375 });
    for (let frame = 1; frame <= 8; frame += 1) {
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
      );
      transitions.push(
        await readMetrics(page, `${kind}-shrink-frame-${frame}`, editorIndex),
      );
    }
    await settle(page, 0);
    await saveObservation(page, `${kind}-390x375-stable`, `${stem}-390x375-stable.png`, editorIndex);

    const scrollPoint = await popper.evaluate((node) => {
      const panel = node.querySelector('.el-picker-panel');
      if (!panel || panel.scrollHeight <= panel.clientHeight + 1) return null;
      const rect = panel.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2)),
        y: Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2)),
      };
    });
    if (scrollPoint) {
      const before = await readMetrics(page, `${kind}-scroll-before`, editorIndex);
      await page.mouse.move(scrollPoint.x, scrollPoint.y);
      await page.mouse.wheel(0, 220);
      await page.waitForTimeout(150);
      const after = await readMetrics(page, `${kind}-scroll-after`, editorIndex);
      transitions.push({
        state: `${kind}-internal-scroll`,
        point: scrollPoint,
        before: {
          pageScrollY: before.scroll.y,
          panelScrollTop: before.popper?.picker?.scrollTop,
        },
        after: {
          pageScrollY: after.scroll.y,
          panelScrollTop: after.popper?.picker?.scrollTop,
        },
      });
      await saveObservation(page, `${kind}-390x375-scrolled`, `${stem}-390x375-scrolled.png`, editorIndex);
      await page.mouse.wheel(0, -600);
      await page.waitForTimeout(120);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (let frame = 1; frame <= 8; frame += 1) {
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
      );
      transitions.push(
        await readMetrics(page, `${kind}-restore-frame-${frame}`, editorIndex),
      );
    }
    await settle(page, 0);
    await saveObservation(page, `${kind}-390x844-restored`, `${stem}-390x844-restored.png`, editorIndex);
  } finally {
    await context.close();
  }
}

try {
  await captureResizeSequence('ordinary-range', 0, 'sequence-ordinary');
  await captureResizeSequence('shortcut-range', 1, 'sequence-shortcut');

  const desktop = await createPage(1280, 720, false);
  try {
    await saveObservation(desktop.page, 'desktop-default', 'desktop-default.png', 0);
    await openRange(desktop.page, 0);
    await saveObservation(desktop.page, 'desktop-range-open', 'desktop-range-open.png', 0);
  } finally {
    await desktop.context.close();
  }

  const desktopShortcuts = await createPage(1280, 720, false);
  try {
    await openRange(desktopShortcuts.page, 1);
    await saveObservation(
      desktopShortcuts.page,
      'desktop-shortcut-open',
      'desktop-shortcut-open.png',
      1,
    );
  } finally {
    await desktopShortcuts.context.close();
  }

  for (const [width, height, label] of [
    [320, 812, '320x812'],
    [320, 375, '320x375'],
  ]) {
    for (const [index, suffix] of [
      [0, 'range'],
      [1, 'shortcut'],
    ]) {
      const sample = await createPage(width, height, true);
      try {
        await openRange(sample.page, index);
        await saveObservation(
          sample.page,
          `${label}-${suffix}-open`,
          `${label}-${suffix}-open.png`,
          index,
        );
      } finally {
        await sample.context.close();
      }
    }
  }

  const hud = await createPage(390, 844, true);
  try {
    await hud.page.locator('.lx-date-picker-demo__toolbar input').check();
    await settle(hud.page);
    await saveObservation(hud.page, 'hud-default', 'hud-default.png', 0);
    await openRange(hud.page, 0);
    await saveObservation(hud.page, 'hud-range-open', 'hud-range-open.png', 0);
  } finally {
    await hud.context.close();
  }

  const keyboard = await createPage(1280, 720, false);
  try {
    const { input } = await openRange(keyboard.page, 0, true);
    await saveObservation(keyboard.page, 'keyboard-arrowdown-open', 'keyboard-arrowdown-open.png', 0);
    await keyboard.page.keyboard.press('ArrowRight');
    await settle(keyboard.page, 2);
    await saveObservation(keyboard.page, 'keyboard-arrowright-moved', 'keyboard-arrowright-moved.png', 0);
    await keyboard.page.keyboard.press('Enter');
    await settle(keyboard.page, 2);
    await saveObservation(keyboard.page, 'keyboard-enter-selected', 'keyboard-enter-selected.png', 0);
    await keyboard.page.keyboard.press('Escape');
    await settle(keyboard.page, 2);
    const escapeObservation = await readMetrics(keyboard.page, 'keyboard-escape-closed', 0);
    escapeObservation.inputRestored = await input.evaluate((node) => node === document.activeElement);
    observations.push(escapeObservation);
    await keyboard.page.screenshot({
      path: path.join(artifactDir, 'keyboard-escape-closed.png'),
      fullPage: false,
    });
    escapeObservation.screenshot = 'keyboard-escape-closed.png';
  } finally {
    await keyboard.context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(artifactDir, 'measurements.json'),
  `${JSON.stringify(
    {
      target,
      captureDate: new Date().toISOString(),
      method:
        'Assessment A only; independent source reading plus fresh Playwright BrowserContexts/Pages in Microsoft Edge; no Assessment B, detector, or code review evidence',
      screenshots: observations.map((observation) => observation.screenshot),
      observations,
      transitions,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
console.log(
  JSON.stringify(
    {
      artifactDir,
      screenshotCount: observations.length,
      observationCount: observations.length,
      transitionCount: transitions.length,
      resizeSequence: observations
        .filter((observation) => observation.state.includes('ordinary-range-390x'))
        .map((observation) => ({
          state: observation.state,
          viewport: observation.viewport,
          editor: observation.editor?.rect,
          popper: observation.popper?.rect,
          inside: observation.popper?.insideViewport,
          viewportFit: observation.popper?.viewportFit,
          calendarFullyVisible: observation.popper?.calendars?.every(
            (calendar) => calendar.fullyVisibleInsidePanel,
          ),
          activeLabelIntersectsPopper: observation.activeFieldLabel?.intersectsPopper,
        })),
    },
    null,
    2,
  ),
);
