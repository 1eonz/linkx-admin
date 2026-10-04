import { expect, test } from '@playwright/test';

test.describe('LxSidebar 文档示例', () => {
  test('键盘控制分组、单次选中、rail 浮层焦点与减少动效', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxsidebar');

    await expect(page.getByRole('heading', { name: 'LxSidebar 侧边栏' })).toBeVisible();
    const basic = page.locator('.demo-box').nth(0);
    const group = basic.getByRole('button', { name: '协同岗管理' });

    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.focus();
    await expect(group).toBeFocused();
    await expect.poll(() => group.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');

    const child = basic.getByRole('button', { name: '协同岗设置' });
    await child.click();
    await expect(basic.getByTestId('sidebar-selection-count')).toHaveText('最近选中：协同岗设置（已触发 1 次）');
    await expect(child).toHaveClass(/is-active/);
    await expect(basic.locator('[href="javascript:;"]')).toHaveCount(0);

    const brandRing = basic.locator('.lx-sidebar-brand__ring');
    await expect.poll(() => brandRing.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');

    const controlled = page.locator('.demo-box').nth(1);
    await controlled.getByRole('button', { name: '收起导航' }).click();
    const gaugeArc = controlled.locator('.lx-gauge__arc');
    await expect(gaugeArc).toHaveCount(1);
    await expect
      .poll(() =>
        gaugeArc.evaluate((element) => {
          const duration = getComputedStyle(element).transitionDuration;
          const value = Number.parseFloat(duration);
          return duration.endsWith('ms') ? value / 1000 : value;
        }),
      )
      .toBeLessThan(0.001);
    const railGroup = controlled.getByRole('button', { name: '协同岗管理' });
    await railGroup.focus();
    await page.keyboard.press('Enter');

    const popper = page.locator('.lx-sidebar-popper');
    const railChild = popper.getByRole('button', { name: '协同岗设置' });
    await expect(railGroup).toHaveAttribute('aria-expanded', 'true');
    await expect(railChild).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popper).toHaveCount(0);
    await expect(railGroup).toHaveAttribute('aria-expanded', 'false');
    await expect(railGroup).toBeFocused();

    await controlled.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(controlled.locator('.sidebar-demo')).toHaveClass(/lx-theme-hud/);
    await expect(railGroup).toBeVisible();
    await railGroup.press('Enter');
    await expect(railGroup).toHaveAttribute('aria-expanded', 'true');
    const hudRailChild = page.locator('.lx-sidebar-popper').getByRole('button', { name: '协同岗设置' });
    await expect(hudRailChild).toBeFocused();
    await expect.poll(() => hudRailChild.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Escape');
  });

  test('移动抽屉限制焦点、可关闭并返回触发按钮', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto('/components/lxsidebar');

    const controlled = page.locator('.demo-box').nth(1);
    const openButton = controlled.getByRole('button', { name: '打开移动端导航' });
    await openButton.focus();
    await page.keyboard.press('Enter');

    const drawer = page.getByRole('dialog', { name: '移动端主导航' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    const closeButton = drawer.getByRole('button', { name: '关闭导航' });
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(drawer.getByRole('button', { name: '系统与License配置' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(openButton).toBeFocused();

    await openButton.click();
    const reopenedDrawer = page.getByRole('dialog', { name: '移动端主导航' });
    await reopenedDrawer.getByRole('button', { name: '协同岗设置' }).click();
    await expect(reopenedDrawer).toHaveCount(0);
    await expect(openButton).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
