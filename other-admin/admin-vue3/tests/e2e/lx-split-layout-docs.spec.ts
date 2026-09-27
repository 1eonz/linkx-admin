import { expect, test } from '@playwright/test';

test.describe('lx-ui LxSplitLayout 文档示例', () => {
  test('使用键盘和拖动调宽并限制在可用范围', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/components/lxsplitlayout');

    const demo = page.locator('.lx-split-layout-demo');
    const layout = demo.locator('.lx-split-layout');
    const separator = layout.getByRole('separator');
    const width = demo.getByTestId('split-layout-width');
    const maximum = Number(await separator.getAttribute('aria-valuemax'));

    expect(maximum).toBeGreaterThan(200);
    expect(maximum).toBeLessThanOrEqual(480);
    await separator.focus();
    await page.keyboard.press('Home');
    await expect(separator).toHaveAttribute('aria-valuenow', '200');
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', String(maximum));
    await page.keyboard.press('Home');

    const box = await separator.boundingBox();
    if (!box) throw new Error('分隔栏没有进入可视区域');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2);
    await page.mouse.up();
    const draggedWidth = Math.min(280, maximum);
    await expect(width).toHaveText(`${draggedWidth} px`);
    await expect(separator).toHaveAttribute('aria-valuenow', String(draggedWidth));

    await layout.evaluate((element) => {
      (element as HTMLElement).style.width = '640px';
    });
    await expect.poll(async () => Number(await separator.getAttribute('aria-valuemax'))).toBeLessThan(maximum);
    const constrainedMaximum = Number(await separator.getAttribute('aria-valuemax'));
    await expect(separator).toHaveAttribute('aria-valuenow', String(constrainedMaximum));
    await expect(width).toHaveText(`${constrainedMaximum} px`);
  });

  test('折叠后主工作区与展开按钮保持同一行', async ({ page }) => {
    await page.goto('/components/lxsplitlayout');

    const demo = page.locator('.lx-split-layout-demo');
    const layout = demo.locator('.lx-split-layout');
    const aside = layout.locator('.lx-split-layout__aside');
    const toggle = layout.locator('.lx-split-layout__toggle');
    const main = layout.locator('.lx-split-layout-demo__main');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', '展开侧栏');
    await expect(aside).toBeHidden();
    const toggleBox = await toggle.boundingBox();
    const mainBox = await main.boundingBox();
    if (!toggleBox || !mainBox) throw new Error('折叠布局内容没有进入可视区域');
    expect(Math.abs(mainBox.y - toggleBox.y)).toBeLessThanOrEqual(1);
    expect(mainBox.x).toBeGreaterThan(toggleBox.x + toggleBox.width);
  });

  test('375px 下纵向排列、表格独立滚动且折叠按钮可触控', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxsplitlayout');

    const demo = page.locator('.lx-split-layout-demo');
    const layout = demo.locator('.lx-split-layout');
    const toggle = layout.locator('.lx-split-layout__toggle');
    const tableRegion = demo.getByRole('region', { name: '人员名册数据，可横向滚动' });
    const toggleBox = await toggle.boundingBox();
    if (!toggleBox) throw new Error('窄屏侧栏按钮没有进入可视区域');
    expect(toggleBox.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox.height).toBeGreaterThanOrEqual(44);
    expect(await tableRegion.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.getByLabel('HUD 深色主题').check();
    await expect(demo).toHaveClass(/lx-theme-hud/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionMs = await toggle.evaluate((element) =>
      getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith('ms') ? value : value * 1000;
        }),
    );
    expect(Math.max(...transitionMs)).toBeLessThanOrEqual(0.02);

    await toggle.click();
    await expect(layout.locator('.lx-split-layout__aside')).toBeHidden();
    await expect(demo.locator('.lx-split-layout-demo__main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
