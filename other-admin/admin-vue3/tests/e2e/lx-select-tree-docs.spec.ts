import { expect, test } from '@playwright/test';

test.describe('lx-ui LxSelectTree 文档示例', () => {
  test('搜索保留祖先并在清空时恢复折叠状态', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxselecttree');

    await expect(page.getByText('滨江分局', { exact: true })).toBeVisible();
    await expect(page.getByText('长河派出所', { exact: true })).toBeVisible();

    const search = page.getByRole('searchbox', { name: '搜索部门名称' });
    await search.fill('西兴派出所');

    await expect(page.getByText('杭州市公安局', { exact: true })).toBeVisible();
    await expect(page.getByText('滨江分局', { exact: true })).toBeVisible();
    await expect(page.getByText('西兴派出所', { exact: true })).toBeVisible();
    await expect(page.getByText('长河派出所', { exact: true })).toBeHidden();

    await search.fill('');

    await expect(page.getByText('杭州市公安局', { exact: true })).toBeVisible();
    await expect(page.getByText('滨江分局', { exact: true })).toBeVisible();
    await expect(page.getByText('长河派出所', { exact: true })).toBeVisible();
  });

  test('禁用节点不可选，懒加载失败后可以重试并显示结果', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxselecttree');

    const disabledRow = page.locator('.el-tree-node__content').filter({ hasText: '离线专网（禁用）' });
    await expect(disabledRow.locator('.el-checkbox__input')).toHaveClass(/is-disabled/);

    await page
      .locator('.el-tree-node__content')
      .filter({ hasText: '高新园区分局（懒加载）' })
      .locator('.el-tree-node__expand-icon')
      .click();
    await expect(page.locator('.lx-tree__error')).toContainText('加载失败');

    await page.getByRole('button', { name: '重试', exact: true }).click();
    await expect(page.getByText('科技城派出所', { exact: true })).toBeVisible();
    await expect(page.getByText('白杨派出所', { exact: true })).toBeVisible();
  });

  test('空目录、HUD 主题和 375px 布局可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto('/components/lxselecttree');

    await page.getByRole('button', { name: '查看空目录' }).click();
    await expect(page.locator('.lx-tree__empty')).toContainText('暂无数据');
    await page.getByRole('button', { name: '返回组织目录' }).click();
    await expect(page.getByText('杭州市公安局', { exact: true })).toBeVisible();

    await page.getByRole('checkbox', { name: 'HUD 深色' }).check();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);

    const bounds = await page.locator('.lx-select-tree-demo').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
