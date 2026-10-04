import { expect, test } from '@playwright/test';

test.describe('lx-ui LxDrawer 文档示例', () => {
  test('验证受控打开、标题可访问名称、主题、ESC 规则和窄屏尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxdrawer');

    await expect(page.getByRole('heading', { name: 'LxDrawer 详情抽屉' })).toBeVisible();
    const theme = page.getByRole('checkbox', { name: 'HUD 深色主题' });
    await theme.check();
    await expect(page.locator('.drawer-demo')).toHaveClass(/lx-theme-hud/);

    await page.getByRole('button', { name: '打开审计抽屉' }).click();
    const drawer = page.getByRole('dialog', { name: '出警抽检审计抽屉' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    const drawerBackground = await page
      .locator('.el-drawer')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(drawerBackground).toBe('rgb(16, 26, 44)');

    const panel = page.locator('.el-drawer');
    const panelBox = await panel.boundingBox();
    if (!panelBox) throw new Error('抽屉面板未进入可视区域');
    expect(panelBox.width).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    await page.getByRole('button', { name: '打开审计抽屉' }).click();
    await expect(page.getByRole('dialog', { name: '出警抽检审计抽屉' })).toBeVisible();

    const close = drawer.locator('.lx-drawer__close');
    await close.focus();
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-width', '2px');
    const transitionDurations = await close.evaluate((element) =>
      getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith('ms') ? value : value * 1000;
        }),
    );
    expect(Math.max(...transitionDurations)).toBeLessThanOrEqual(0.02);

    await close.click();
    await expect(drawer).toBeHidden();
  });
});
