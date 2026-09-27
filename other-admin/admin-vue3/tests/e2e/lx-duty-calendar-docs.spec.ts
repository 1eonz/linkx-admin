import { expect, test } from '@playwright/test';

function monthAfter(month: string) {
  const [year, currentMonth] = month.split('-').map(Number);
  return currentMonth === 12 ? `${year + 1}-01` : `${year}-${String(currentMonth + 1).padStart(2, '0')}`;
}

test.describe('lx-ui LxDutyCalendar 文档示例', () => {
  test('呈现 42 格、月份与日期事件、自定义插槽和键盘导航', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxdutycalendar');

    const demo = page.locator('.lx-duty-calendar-demo');
    const calendar = demo.locator('.lx-duty-calendar');
    const grid = calendar.getByRole('grid');
    const month = await calendar.locator('h2').textContent();
    if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new Error('日历月份格式无效');

    await expect(grid).toHaveAttribute('aria-label', `${month} 排班日历`);
    await expect(grid.getByRole('row')).toHaveCount(7);
    await expect(grid.getByRole('columnheader')).toHaveCount(7);
    await expect(grid.getByRole('gridcell')).toHaveCount(42);
    await expect(calendar.locator('[aria-current="date"]')).toHaveCount(1);

    const date = `${month}-03`;
    await calendar.locator(`[data-lx-duty-date="${date}"]`).click();
    await expect(demo.getByTestId('duty-calendar-last-action')).toHaveText(`选择日期：${date}`);

    const shiftDate = `${month}-05`;
    await calendar.getByRole('button', { name: `${shiftDate}，早班，8 人` }).click();
    await expect(demo.getByTestId('duty-calendar-last-action')).toHaveText(`选择班次：${shiftDate}，早班`);

    const focusDate = `${month}-14`;
    const [year, monthNumber] = month.split('-').map(Number);
    const weekday = new Date(year, monthNumber - 1, 14).getDay();
    const mondayOffset = (weekday - 1 + 7) % 7;
    const homeDay = String(14 - mondayOffset).padStart(2, '0');
    await calendar.locator(`[data-lx-duty-date="${focusDate}"]`).focus();
    await page.keyboard.press('Home');
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-lx-duty-date')))
      .toBe(`${month}-${homeDay}`);
    await page.keyboard.press('End');
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-lx-duty-date')))
      .toBe(`${month}-${String(Number(homeDay) + 6).padStart(2, '0')}`);

    const nextMonth = monthAfter(month);
    await calendar.getByRole('button', { name: '下个月' }).click();
    await expect(calendar.locator('h2')).toHaveText(nextMonth);
    await expect(demo.getByTestId('duty-calendar-last-action')).toHaveText(`显示月份：${nextMonth}`);

    await demo.getByLabel('自定义单元格内容').check();
    await expect(
      demo.locator(`[data-lx-duty-date="${nextMonth}-12"] .lx-duty-calendar-demo__custom-shift`).first(),
    ).toHaveText('早班');
  });

  test('宿主空、加载、失败与只读状态均有可理解反馈', async ({ page }) => {
    await page.goto('/components/lxdutycalendar');
    const demo = page.locator('.lx-duty-calendar-demo');
    const state = demo.getByLabel('宿主数据状态');
    const stage = demo.locator('.lx-duty-calendar-demo__stage');
    const statusMessage = demo.locator('.lx-duty-calendar-demo__message');

    await state.selectOption('empty');
    await expect(statusMessage).toHaveText('本月暂无排班数据，日期导航仍可使用。');
    await expect(stage.locator('.lx-duty-calendar__shift')).toHaveCount(0);

    await state.selectOption('loading');
    await expect(statusMessage).toHaveText('正在读取排班数据……');
    await expect(stage).toHaveAttribute('aria-busy', 'true');
    expect(await stage.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

    await state.selectOption('disabled');
    await expect(statusMessage).toContainText('组件本身不提供 disabled 属性');
    await expect(stage).toHaveAttribute('aria-disabled', 'true');
    expect(await stage.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

    await state.selectOption('error');
    await expect(demo.getByRole('alert')).toContainText('日历数据读取失败');
    await demo.getByRole('button', { name: '重试本地示例' }).click();
    await expect(demo.getByRole('grid')).toBeVisible();
    await expect(demo.getByTestId('duty-calendar-last-action')).toHaveText('本地样例已恢复');
  });

  test('375px 与 320px 视口下内部滚动、触控尺寸、主题对比度及减少动效正常', async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/components/lxdutycalendar');

      const demo = page.locator('.lx-duty-calendar-demo');
      const calendar = demo.locator('.lx-duty-calendar');
      const previousMonth = calendar.getByRole('button', { name: '上个月' });
      const buttonBox = await previousMonth.boundingBox();
      if (!buttonBox) throw new Error(`${width}px 下月份导航没有进入可视区域`);
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      expect(await calendar.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

      const outsideDay = calendar.locator('.lx-duty-calendar__cell.is-outside .lx-duty-calendar__day').first();
      const contrast = await outsideDay.evaluate((element) => {
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3) throw new Error(`无法读取颜色：${color}`);
          const linear = channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
        };
        const cell = element.closest('.lx-duty-calendar__cell');
        if (!cell) throw new Error('非本月日期没有日期单元格');
        const foreground = luminance(getComputedStyle(element).color);
        const background = luminance(getComputedStyle(cell).backgroundColor);
        const [lighter, darker] = [foreground, background].sort((a, b) => b - a);
        return (lighter + 0.05) / (darker + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);

      await demo.getByLabel('HUD 深色主题').check();
      await expect(demo).toHaveClass(/lx-theme-hud/);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const transitionMs = await previousMonth.evaluate((element) =>
        getComputedStyle(element)
          .transitionDuration.split(',')
          .map((duration) => {
            const value = Number.parseFloat(duration);
            return duration.trim().endsWith('ms') ? value : value * 1000;
          }),
      );
      expect(Math.max(...transitionMs)).toBeLessThanOrEqual(0.02);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
