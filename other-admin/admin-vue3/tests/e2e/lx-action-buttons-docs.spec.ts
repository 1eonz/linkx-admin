import { expect, test } from '@playwright/test';

test.describe('LxActionButtons 文档示例', () => {
  test('键盘可展开并操作溢出项，Escape 关闭且恢复焦点', async ({ page }) => {
    await page.goto('/components/lxactionbuttons');

    const moreButton = page.getByRole('button', { name: '更多', exact: true }).first();
    const actionGroup = page.getByRole('group', { name: '更多操作' }).first();
    await moreButton.focus();
    await page.keyboard.press('Enter');
    await expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');

    const firstOverflowAction = actionGroup.getByRole('button', { name: '停用' });
    await expect(firstOverflowAction).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(actionGroup).toBeHidden();
    await expect(moreButton).toBeFocused();

    await moreButton.click();
    await actionGroup.getByRole('button', { name: '停用' }).click();
    await expect(page.getByTestId('last-action')).toHaveText('停用');
    await expect(actionGroup).toBeHidden();
    await expect(moreButton).toBeFocused();
  });

  test('375px 下触控目标达到 44px，长菜单不撑宽页面并适配 HUD 主题', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const moreButton = page.getByRole('button', { name: '更多', exact: true }).first();
    const actionGroup = page.getByRole('group', { name: '更多操作' }).first();
    await moreButton.click();

    const buttonBox = await moreButton.boundingBox();
    const menuBox = await actionGroup.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    expect(menuBox?.x).toBeGreaterThanOrEqual(0);
    expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(375);
    await expect(actionGroup.getByRole('button', { name: '暂不可执行' })).toBeDisabled();

    const lightBackground = await actionGroup.evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
    const hudBackground = await actionGroup.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(hudBackground).not.toBe(lightBackground);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transition = await moreButton.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.00002);
  });

  test('点击外部或按 Tab 离开操作列表时收起', async ({ page }) => {
    await page.goto('/components/lxactionbuttons');

    const moreButton = page.getByRole('button', { name: '更多', exact: true }).first();
    const actionGroup = page.getByRole('group', { name: '更多操作' }).first();
    await moreButton.click();
    await page.getByRole('heading', { name: '禁用项与事件反馈' }).click();
    await expect(actionGroup).toBeHidden();

    await moreButton.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(actionGroup).toBeHidden();
  });
});
