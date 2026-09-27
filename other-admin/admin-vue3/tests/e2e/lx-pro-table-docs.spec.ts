import { expect, test } from '@playwright/test';

test.describe('lx-ui LxProTable 文档示例', () => {
  test('跨页选择与清空保持受控状态一致', async ({ page }) => {
    await page.goto('/components/lxprotable');

    const firstRow = page.locator('.el-table__body-wrapper tr').filter({ hasText: 'GW-33010001' });
    await firstRow.locator('label.el-checkbox').click();
    await expect(firstRow.getByRole('checkbox')).toBeChecked();
    await expect(page.getByText('已选 1 项', { exact: true })).toBeVisible();

    await page.locator('.el-pager li').nth(1).click();
    const eleventhRow = page.locator('.el-table__body-wrapper tr').filter({ hasText: 'GW-33010011' });
    await eleventhRow.locator('label.el-checkbox').click();
    await expect(eleventhRow.getByRole('checkbox')).toBeChecked();
    await expect(page.getByText('已选 2 项', { exact: true })).toBeVisible();

    await page.locator('.el-pager li').first().click();
    await expect(firstRow.getByRole('checkbox')).toBeChecked();
    await page.locator('.el-pager li').nth(1).click();
    await expect(eleventhRow.getByRole('checkbox')).toBeChecked();

    await page.getByRole('button', { name: '清空选择' }).click();
    await expect(page.getByText('已选 0 项', { exact: true })).toBeVisible();
    await expect(eleventhRow.getByRole('checkbox')).not.toBeChecked();
  });

  test('状态 Demo 覆盖加载、空结果、错误恢复和排序反馈', async ({ page }) => {
    await page.goto('/components/lxprotable');

    await page.getByRole('button', { name: '加载中', exact: true }).click();
    const table = page.locator('.lx-table').first();
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('status').filter({ hasText: '正在加载' })).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.lx-table__spinner')).toHaveCSS('animation-name', 'none');

    await page.getByRole('button', { name: '空结果', exact: true }).click();
    await expect(page.getByText('当前没有匹配的数据', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '请求失败', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('设备列表暂时无法加载');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.getByText('滨江网关-01')).toBeVisible();

    await page.getByRole('button', { name: 'Sort by 节点名称' }).click();
    await expect(page.getByText(/排序：name/)).toBeVisible();
  });

  test('375px 下表格局部滚动、方向键和点按范围正常', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxprotable');

    const tableRegion = page.getByRole('region', {
      name: '数据表格，可使用左右方向键水平滚动',
    });
    await expect(tableRegion).toHaveAttribute('tabindex', '0');
    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      tableWidth: document.querySelector('.el-table__body-wrapper .el-scrollbar__wrap')?.clientWidth,
      tableScrollWidth: document.querySelector('.el-table__body-wrapper .el-scrollbar__wrap')?.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(dimensions.tableScrollWidth).toBeGreaterThan(dimensions.tableWidth ?? 0);

    await tableRegion.focus();
    await expect(tableRegion).toHaveCSS('outline-width', '2px');
    await expect(tableRegion).toHaveCSS('outline-style', 'solid');
    const before = await page
      .locator('.el-table__body-wrapper .el-scrollbar__wrap')
      .evaluate((element) => element.scrollLeft);
    await tableRegion.press('ArrowRight');
    const after = await page
      .locator('.el-table__body-wrapper .el-scrollbar__wrap')
      .evaluate((element) => element.scrollLeft);
    expect(after).toBeGreaterThan(before);

    const checkbox = page.locator('.el-table-column--selection .el-checkbox').nth(1);
    const target = await checkbox.boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);
  });

  test('HUD 深色主题切换更新表头令牌', async ({ page }) => {
    await page.goto('/components/lxprotable');
    const lightHeader = await page
      .locator('.el-table__header-wrapper th')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkHeader = await page
      .locator('.el-table__header-wrapper th')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkHeader).not.toBe(lightHeader);
  });
});
