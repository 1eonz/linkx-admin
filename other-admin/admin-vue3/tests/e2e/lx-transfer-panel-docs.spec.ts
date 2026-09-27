import { expect, test } from '@playwright/test';

test.describe('lx-ui LxTransferPanel 文档示例', () => {
  test('全选、反选、上限禁用和清空按受控键同步', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    const selectedCount = page.getByTestId('selected-count');

    await page.getByRole('button', { name: '反选' }).click();
    await expect(selectedCount).toHaveText('当前已选 4 项');

    await page.getByRole('button', { name: '全选' }).click();
    await expect(selectedCount).toHaveText('当前已选 5 项');
    await expect(page.getByRole('button', { name: '全选' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '全部加入' })).toBeDisabled();

    await page.getByRole('button', { name: '清空' }).click();
    await expect(selectedCount).toHaveText('当前已选 0 项');
    await expect(page.getByTestId('transfer-status')).toHaveText('已清空全部选中项');
  });

  test('宿主加载、失败重试和空结果状态可见', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await page.getByRole('button', { name: '加载中' }).click();
    await expect(page.getByRole('status')).toContainText('组织权限数据加载中');

    await page.getByRole('button', { name: '加载失败' }).click();
    await expect(page.getByRole('alert')).toContainText('组织权限数据加载失败');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.locator('.lx-transfer-panel')).toBeVisible();

    await page.getByRole('button', { name: '空结果' }).click();
    await expect(page.locator('.lx-virtual-tree')).toContainText('暂无数据');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('legacy-unit-08');
  });

  test('375px 下控件不溢出，批量与删除目标可触摸且主题可切换', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');

    const rightArrow = page.getByRole('button', { name: '全部加入' });
    const arrowBox = await rightArrow.boundingBox();
    if (!arrowBox) throw new Error('批量加入按钮没有进入可视区域');
    expect(arrowBox.width).toBeGreaterThanOrEqual(44);
    expect(arrowBox.height).toBeGreaterThanOrEqual(44);

    const removeButton = page.getByRole('button', { name: '移除 情指行一体化研判调度专班' });
    const removeBox = await removeButton.boundingBox();
    if (!removeBox) throw new Error('已选项删除按钮没有进入可视区域');
    expect(removeBox.width).toBeGreaterThanOrEqual(44);
    expect(removeBox.height).toBeGreaterThanOrEqual(44);

    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.transfer-panel-demo')).toHaveClass(/lx-theme-hud/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.getByRole('button', { name: '反选' }).focus();
    const outlineWidth = await page
      .getByRole('button', { name: '反选' })
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
    expect(outlineWidth).toBeGreaterThanOrEqual(2);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await rightArrow.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00002);
  });
});
