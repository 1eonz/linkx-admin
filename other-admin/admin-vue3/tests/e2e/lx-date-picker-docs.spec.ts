import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 文档示例只使用本地状态，阻止意外的外部请求。
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

function readMonthHeadings(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d{4}\s*年\s*\d{1,2}\s*月$/.test(line));
}

test('390px 首屏可操作日期控件并呈现区间标签接入约定', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components/lxdatepicker');

  const firstControl = page.getByLabel('布控生效日期', { exact: true });
  const bounds = await firstControl.boundingBox();
  if (!bounds) throw new Error('首个日期控件未进入浏览器视口');

  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await expect(page.locator('main')).toContainText("['start', 'end']");
  await expect(page.locator('main')).toContainText('label for="start"');
  await expect(page.locator('main')).toContainText('label for="end"');
});

test('周一起始表头与日期、月份示例状态保持独立', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  const date = demo.getByLabel('布控生效日期', { exact: true });
  const month = demo.getByLabel('月份选择（月度复盘）', { exact: true });

  await date.click();
  const popper = page.getByRole('dialog');
  await expect(popper.getByRole('columnheader')).toHaveText(['一', '二', '三', '四', '五', '六', '日']);

  await month.click();
  const monthPopper = page.getByRole('dialog');
  await monthPopper.getByRole('gridcell', { name: '10 月', exact: true }).click();

  await expect(month).toHaveValue('2026-10');
  await expect(date).toHaveValue('2026-09-15');
});

test('unlink-panels 示例允许左右月份独立翻页', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  await demo.getByLabel('专项布控日期区间开始日期', { exact: true }).click();

  const popper = page.getByRole('dialog');
  await expect(popper.getByRole('grid')).toHaveCount(2);
  await expect.poll(async () => readMonthHeadings(await popper.innerText())).toEqual(['2026 年9 月', '2026 年10 月']);

  await popper.getByRole('button', { name: '下个月', exact: true }).last().click();
  await expect.poll(async () => readMonthHeadings(await popper.innerText())).toEqual(['2026 年9 月', '2026 年11 月']);
});

test('320px、375px 与 390px 下区间快捷项横排且触控区域完整', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/components/lxdatepicker');

    const demo = page.locator('.lx-date-picker-demo');
    await demo.getByLabel('研判时间范围开始日期', { exact: true }).click();

    const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
    await expect(popper.getByRole('grid')).toHaveCount(1);
    await expect(popper.locator('.el-picker-panel__shortcut')).toHaveCount(3);
    await expect(popper).not.toHaveClass(/el-zoom-in-top-enter-active/);

    const geometry = await popper.evaluate((element) => {
      const shortcuts = Array.from(element.querySelectorAll<HTMLElement>('.el-picker-panel__shortcut')).map((button) =>
        button.getBoundingClientRect(),
      );
      const cell = element
        .querySelector<HTMLElement>('.el-date-table td.available:not(.disabled) .el-date-table-cell')
        ?.getBoundingClientRect();
      const navigation = Array.from(element.querySelectorAll<HTMLElement>('.el-picker-panel__icon-btn')).map((button) =>
        button.getBoundingClientRect(),
      );
      const panel = element.getBoundingClientRect();

      return {
        panelLeft: panel.left,
        panelRight: panel.right,
        clientWidth: document.documentElement.clientWidth,
        viewportWidth: window.innerWidth,
        shortcutRows: new Set(shortcuts.map((rect) => Math.round(rect.top))).size,
        shortcutHeights: shortcuts.map((rect) => rect.height),
        cellWidth: cell?.width ?? 0,
        cellHeight: cell?.height ?? 0,
        navigationSizes: navigation.map((rect) => [rect.width, rect.height]),
        pointerFine: matchMedia('(pointer: fine)').matches,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.panelLeft).toBeGreaterThanOrEqual(0);
    expect(geometry.panelRight).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.shortcutRows).toBe(1);
    expect(
      geometry.shortcutHeights.every((height) => Math.round(height) >= 44),
      JSON.stringify(geometry),
    ).toBe(true);
    expect(Math.round(geometry.cellWidth)).toBeGreaterThanOrEqual(width <= 330 && geometry.pointerFine ? 40 : 44);
    expect(Math.round(geometry.cellHeight)).toBeGreaterThanOrEqual(44);
    expect(geometry.navigationSizes.length).toBeGreaterThan(0);
    expect(geometry.navigationSizes.every(([w, h]) => Math.round(w) >= 44 && Math.round(h) >= 44)).toBe(true);
    expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewportWidth);
    await page.keyboard.press('Escape');
  }
});

test('320px 触屏区间日历保留 44px 触控区域且不横向溢出', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Playwright 配置缺少 baseURL');

  const context = await browser.newContext({
    viewport: { width: 320, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  try {
    const page = await context.newPage();
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto(new URL('/components/lxdatepicker', baseURL).href);

    const start = page.getByLabel('专项布控日期区间开始日期', { exact: true });
    await start.click();
    const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
    await expect(popper.getByRole('grid')).toHaveCount(1);
    await expect(popper).not.toHaveClass(/el-zoom-in-top-enter-active/);

    const geometry = await popper.evaluate((element) => {
      const panel = element.getBoundingClientRect();
      const cell = element
        .querySelector<HTMLElement>('td.available:not(.disabled) .el-date-table-cell')
        ?.getBoundingClientRect();
      return {
        panelRight: panel.right,
        clientWidth: document.documentElement.clientWidth,
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        cellWidth: cell?.width ?? 0,
        cellHeight: cell?.height ?? 0,
      };
    });

    expect(geometry.panelRight, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.cellWidth, JSON.stringify(geometry)).toBeGreaterThanOrEqual(44);
    expect(Math.round(geometry.cellHeight), JSON.stringify(geometry)).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    await expect(popper).toBeHidden();
  } finally {
    await context.close();
  }
});

test('HUD 主题在浅深模式切换后应用到日期弹层', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  const hudSwitch = demo.getByLabel('HUD 深色主题');
  await hudSwitch.check();
  const effectiveDate = demo.getByLabel('布控生效日期', { exact: true });
  await expect
    .poll(() =>
      effectiveDate.evaluate((element) => {
        const wrapper = element.closest('.el-input__wrapper');
        if (!wrapper) throw new Error('日期输入缺少触发器表面');
        return getComputedStyle(wrapper).backgroundColor;
      }),
    )
    .toBe('rgb(16, 26, 44)');
  await expect
    .poll(() => effectiveDate.evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(226, 232, 240)');
  await demo.getByLabel('布控生效日期', { exact: true }).click();

  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
  await expect(popper).toBeVisible();
  await expect(popper).toHaveClass(/lx-theme-hud/);
  await expect
    .poll(() =>
      popper.evaluate((element) => getComputedStyle(element).getPropertyValue('--el-bg-color-overlay').trim()),
    )
    .toBe('#16233a');
  await expect
    .poll(() => popper.locator('.el-picker-panel').evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(22, 35, 58)');
  await page.keyboard.press('Escape');
  await expect(popper).toBeHidden();

  await demo.getByLabel('专项布控日期区间开始日期', { exact: true }).click();
  const rangePopper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
  const contrast = await rangePopper.evaluate((element) => {
    const parse = (value: string) => {
      const parts = value.match(/[+-]?[\d.]+%?/g) ?? [];
      const channel = (index: number) => Number.parseFloat(parts[index] ?? '0');
      const alpha = parts[3];
      return {
        r: channel(0),
        g: channel(1),
        b: channel(2),
        a: alpha === undefined ? 1 : alpha.endsWith('%') ? channel(3) / 100 : channel(3),
      };
    };
    const composite = (
      front: { r: number; g: number; b: number; a: number },
      back: { r: number; g: number; b: number; a: number },
    ) => ({
      r: front.r * front.a + back.r * (1 - front.a),
      g: front.g * front.a + back.g * (1 - front.a),
      b: front.b * front.a + back.b * (1 - front.a),
      a: 1,
    });
    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratio = (foreground: string, background: string) => {
      const values = [luminance(parse(foreground)), luminance(parse(background))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const panel = element.querySelector<HTMLElement>('.el-picker-panel');
    const endpoint = element.querySelector<HTMLElement>('td.start-date .el-date-table-cell__text');
    const rangeCell = element.querySelector<HTMLElement>(
      'td.in-range:not(.start-date):not(.end-date) .el-date-table-cell',
    );
    const rangeText = rangeCell?.querySelector<HTMLElement>('.el-date-table-cell__text');
    if (!panel || !endpoint || !rangeCell || !rangeText) {
      throw new Error('区间弹层缺少端点或范围日期');
    }

    const resolveBackground = (target: HTMLElement) => {
      const layers: HTMLElement[] = [];
      let current: HTMLElement | null = target;
      while (current && current !== panel) {
        layers.push(current);
        current = current.parentElement;
      }

      let background = parse(getComputedStyle(panel).backgroundColor);
      for (const layer of layers.reverse()) {
        background = composite(parse(getComputedStyle(layer).backgroundColor), background);
      }

      return `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`;
    };

    return {
      endpoint: ratio(getComputedStyle(endpoint).color, resolveBackground(endpoint)),
      range: ratio(getComputedStyle(rangeText).color, resolveBackground(rangeText)),
    };
  });
  expect(contrast.endpoint).toBeGreaterThanOrEqual(4.5);
  expect(contrast.range).toBeGreaterThanOrEqual(4.5);
  await page.keyboard.press('Escape');
  await expect(rangePopper).toBeHidden();

  await hudSwitch.uncheck();
  await demo.getByLabel('布控生效日期', { exact: true }).click();
  const lightPopper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
  await expect(lightPopper).toBeVisible();
  await expect(lightPopper).not.toHaveClass(/lx-theme-hud/);
  await expect
    .poll(() =>
      lightPopper.locator('.el-picker-panel').evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe('rgb(255, 255, 255)');
});

test('单值日期键盘操作可进入网格、移动、选择并关闭', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  const date = demo.getByLabel('布控生效日期', { exact: true });
  await date.focus();
  await page.keyboard.press('ArrowDown');

  const popper = page.getByRole('dialog');
  await expect(popper).toBeVisible();
  await expect(popper.locator('.el-date-table')).toHaveAttribute(
    'aria-label',
    '按 ArrowDown 打开日历并进入日期网格，方向键移动日期焦点，按 Enter 选择日期，按 Escape 关闭日历',
  );
  const selectedDate = await date.inputValue();
  const focusedCell = popper.locator('.el-date-table td:focus');
  await expect(focusedCell).toHaveCount(1);
  const focusedDate = focusedCell.locator('.el-date-table-cell__text');
  await expect(focusedDate).toHaveCSS('outline-style', 'solid');
  await expect(focusedDate).toHaveCSS('outline-width', '2px');
  const initialCellText = await focusedCell.textContent();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => popper.locator('.el-date-table td:focus').textContent()).not.toBe(initialCellText);
  await expect(date).not.toHaveValue(selectedDate);
  await page.keyboard.press('Enter');
  await expect(date).toBeFocused();
  await expect(popper).toBeHidden();

  await page.keyboard.press('ArrowDown');
  await expect(popper).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popper).toBeHidden();
});

test('区间开始和结束输入均可将键盘焦点送入可见日历网格', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  const start = demo.getByLabel('专项布控日期区间开始日期', { exact: true });
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');

  await start.focus();
  await page.keyboard.press('ArrowDown');
  await expect(popper).toBeVisible();
  const leftFocus = popper.locator('.el-date-range-picker__content.is-left td:focus');
  await expect(leftFocus).toHaveCount(1);
  const initialDate = await leftFocus.textContent();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => leftFocus.textContent()).not.toBe(initialDate);
  await page.keyboard.press('Enter');
  await expect(popper.locator('.el-date-range-picker__content.is-left td.start-date')).toContainText('16');

  await page.keyboard.press('Escape');
  await expect(popper).toBeHidden();
  await page.goto('/components/lxdatepicker');

  const freshEnd = page.locator('.lx-date-picker-demo').getByLabel('专项布控日期区间结束日期', { exact: true });
  const rangeInputOrder = await freshEnd.evaluate((input) => {
    const range = input.closest('.el-date-editor');
    return Array.from(range?.querySelectorAll<HTMLInputElement>('.el-range-input') ?? []).map((rangeInput) => ({
      id: rangeInput.id,
      placeholder: rangeInput.placeholder,
      value: rangeInput.value,
    }));
  });

  await freshEnd.focus();
  await expect(freshEnd).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(popper).toBeVisible();
  const endIsFocusedBeforeKeydown = await freshEnd.evaluate((element) => document.activeElement === element);
  const endFocusState = await popper.evaluate((element) => {
    const activeElement = document.activeElement as HTMLElement | null;
    const panels = Array.from(element.querySelectorAll<HTMLElement>('.el-date-range-picker__content'));

    return {
      activeTag: activeElement?.tagName,
      activeClass: typeof activeElement?.className === 'string' ? activeElement.className : undefined,
      activeText: activeElement?.textContent?.trim(),
      panels: panels.map((panel) => ({
        className: panel.className,
        visible: Boolean(panel.getClientRects().length),
        endDateCount: panel.querySelectorAll('td.end-date').length,
        focusedCellCount: panel.querySelectorAll('td:focus').length,
        firstAvailableDate: panel.querySelector('td.available:not(.disabled)')?.textContent?.trim(),
      })),
    };
  });
  await expect(
    popper.locator('.el-date-range-picker__content.is-right td:focus'),
    `区间结束字段焦点状态：${JSON.stringify({ rangeInputOrder, endIsFocusedBeforeKeydown, ...endFocusState })}`,
  ).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(popper).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components/lxdatepicker');
  const mobileEnd = page.locator('.lx-date-picker-demo').getByLabel('专项布控日期区间结束日期', { exact: true });
  await mobileEnd.focus();
  await page.keyboard.press('ArrowDown');
  const mobilePopper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
  await expect(mobilePopper.getByRole('grid')).toHaveCount(1);
  await expect.poll(async () => readMonthHeadings(await mobilePopper.innerText())).toEqual(['2026 年10 月']);
  await expect(mobilePopper.locator('td.end-date:focus .el-date-table-cell__text')).toHaveText('8');
  await page.keyboard.press('Escape');
});

test('区间日期格获得焦点后按 Escape 关闭并返回触发端点', async ({ page }) => {
  for (const label of ['专项布控日期区间开始日期', '专项布控日期区间结束日期']) {
    await page.goto('/components/lxdatepicker');
    const input = page.locator('.lx-date-picker-demo').getByLabel(label, { exact: true });
    await input.focus();
    await page.keyboard.press('ArrowDown');

    const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
    await expect(popper.locator('.el-date-range-picker td:focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(popper).toBeHidden();
    await expect(input).toBeFocused();
  }
});

test('窄屏区间跨度超过 120 个月时仍聚焦已选结束日期', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  const start = demo.getByLabel('专项布控日期区间开始日期', { exact: true });
  const end = demo.getByLabel('专项布控日期区间结束日期', { exact: true });

  await start.fill('2010-01-01');
  await start.blur();
  await end.fill('2026-09-15');
  await end.blur();
  await expect(start).toHaveValue('2010-01-01');
  await expect(end).toHaveValue('2026-09-15');

  await end.focus();
  await page.keyboard.press('ArrowDown');
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
  await expect(popper).toBeVisible();
  await expect.poll(async () => readMonthHeadings(await popper.innerText())).toEqual(['2026 年9 月']);
  const focusedEndDate = popper.locator('td.end-date:focus .el-date-table-cell__text');
  await expect(focusedEndDate).toHaveText('15');
  await expect(focusedEndDate).toHaveCSS('outline-style', 'solid');
  await expect(focusedEndDate).toHaveCSS('outline-width', '2px');
  await page.keyboard.press('Escape');
});

test('减少动效偏好下控件过渡缩短', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/components/lxdatepicker');

  await expect
    .poll(() =>
      page.getByLabel('布控生效日期', { exact: true }).evaluate((element) => {
        const wrapper = element.closest('.el-input__wrapper');
        if (!wrapper) return Number.POSITIVE_INFINITY;
        const duration = getComputedStyle(wrapper).transitionDuration.split(',')[0].trim();
        const value = Number.parseFloat(duration);
        return duration.endsWith('ms') ? value : value * 1000;
      }),
    )
    .toBeLessThanOrEqual(0.1);
});
