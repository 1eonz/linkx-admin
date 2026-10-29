import { expect, test } from '@playwright/test';

for (const viewport of [1280, 1920]) {
  for (const hud of [false, true]) {
    test(`${viewport}px视口宽容器${hud ? 'HUD' : '浅色'}下父级回传后键盘和拖动宽度保持一致`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 1080 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxsplitlayout');
      const demo = page.locator('.lx-split-layout-demo');
      if (hud) await demo.getByLabel('HUD 深色主题').check();
      await demo.evaluate((element) => {
        (element as HTMLElement).style.width = '1000px';
      });
      const layout = demo.locator('.lx-split-layout');
      const separator = layout.getByRole('separator');
      await expect(separator).toBeVisible();
      await expect(separator).toHaveAttribute('aria-valuemax', '480');
      const expectWidth = async (expected: number) => {
        // 等待布局观察器与父级回传稳定，不能只捕获短暂正确的一帧。
        await page.waitForTimeout(450);
        await expect(demo.getByTestId('split-layout-width')).toHaveText(`${expected} px`);
        await expect(separator).toHaveAttribute('aria-valuenow', String(expected));
        await expect
          .poll(() => layout.locator('aside').evaluate((element) => element.getBoundingClientRect().width))
          .toBeCloseTo(expected, 0);
      };
      await separator.focus();
      for (const [key, expected] of [
        ['Home', 200],
        ['ArrowRight', 208],
        ['ArrowLeft', 200],
        ['End', 480],
      ] as const) {
        await page.keyboard.press(key);
        await expectWidth(expected);
      }
      const box = await separator.boundingBox();
      if (!box) throw new Error('宽容器分隔栏没有进入可视区域');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2);
      await page.mouse.up();
      await expectWidth(440);
      // 再次调节验证上一轮回传没有留下滞后的内部宽度。
      await separator.focus();
      await page.keyboard.press('ArrowLeft');
      await expectWidth(432);
    });
  }
}

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
    await page.setViewportSize({ width: 1920, height: 1080 });
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

  test('非调整模式主工作区占满剩余轨道，局部窄容器切为堆叠并回收分隔栏焦点', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/components/lxsplitlayout');
    const demo = page.locator('.lx-split-layout-demo');
    const layout = demo.locator('.lx-split-layout');
    await demo.getByLabel('允许调整侧栏').uncheck();
    await expect(layout.getByRole('separator')).toHaveCount(0);
    const geometry = await layout.evaluate((element) => {
      const grid = getComputedStyle(element);
      const main = element.querySelector('.lx-split-layout__main');
      if (!main) throw new Error('缺少主工作区');
      return {
        columns: grid.gridTemplateColumns.split(' ').length,
        right: main.getBoundingClientRect().right,
        expectedRight: element.getBoundingClientRect().right - parseFloat(grid.paddingRight),
      };
    });
    expect(geometry.columns).toBe(3);
    expect(Math.abs(geometry.right - geometry.expectedRight)).toBeLessThanOrEqual(1);
    await demo.getByLabel('允许调整侧栏').check();
    const separator = layout.getByRole('separator');
    await separator.focus();
    await layout.evaluate((element) => {
      (element as HTMLElement).style.width = '420px';
    });
    await expect(layout).toHaveClass(/is-stacked/);
    await expect(separator).toBeHidden();
    await expect(layout.getByRole('button', { name: '收起侧栏', exact: true })).toBeFocused();
    const positions = await layout.evaluate((element) => {
      const aside = element.querySelector('aside');
      const main = element.querySelector('.lx-split-layout__main');
      if (!aside || !main) throw new Error('分栏内容缺失');
      return { asideBottom: aside.getBoundingClientRect().bottom, mainTop: main.getBoundingClientRect().top };
    });
    expect(positions.mainTop).toBeGreaterThan(positions.asideBottom);
  });
});

for (const width of [1280, 375, 320]) {
  for (const hud of [false, true]) {
    test(`${width}px ${hud ? 'HUD' : '浅色'} 主题表格、局部滚动和受控折叠`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxsplitlayout');
      const demo = page.locator('.lx-split-layout-demo');
      if (hud) await demo.getByLabel('HUD 深色主题').check();
      const layout = demo.locator('.lx-split-layout');
      const toggle = layout.locator('.lx-split-layout__toggle');
      await expect(toggle).toHaveAttribute('aria-label', '收起侧栏');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(await toggle.getAttribute('aria-controls')).toBe(await layout.locator('aside').getAttribute('id'));
      const colours = await demo
        .locator('tbody tr')
        .evaluateAll((rows) => rows.map((row) => getComputedStyle(row).backgroundColor));
      const background = await demo.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(colours.every((colour) => colour === background)).toBe(true);
      const table = demo.getByRole('region', { name: '人员名册数据，可横向滚动' });
      await table.focus();
      const canScroll = await table.evaluate((element) => element.scrollWidth > element.clientWidth);
      if (canScroll) {
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      }
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(layout.locator('aside')).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toHaveAttribute('aria-label', '展开侧栏');
      await expect(toggle).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(layout.locator('aside')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await demo.screenshot({ path: testInfo.outputPath('分栏主题与响应式.png') });
    });
  }
}
