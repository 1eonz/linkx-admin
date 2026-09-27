import { expect, test } from '@playwright/test';

const paginationLabel = '分页控件，可横向滚动查看全部选项';

test.describe('lx-ui LxPagination 文档示例', () => {
  test('受控翻页和切换条数会按 autoReset 设置更新并报告 change', async ({ page }) => {
    await page.goto('/components/lxpagination');

    const demo = page.locator('.lx-pagination-demo');
    const region = demo.getByRole('region', { name: paginationLabel });
    const status = demo.getByRole('status');
    const pager = region.locator('.el-pager li');

    await expect(status).toContainText('第 4 页，每页 10 条');
    await pager.filter({ hasText: '5' }).click();
    await expect(status).toContainText('第 5 页，每页 10 条');

    await demo.getByLabel('切换条数时回到第一页').uncheck();
    await region.locator('.el-pagination__sizes .el-select').click();
    await page.getByRole('option', { name: /20.*条\/页/ }).click();
    await expect(status).toContainText('第 5 页，每页 20 条');

    await demo.getByLabel('切换条数时回到第一页').check();
    await region.locator('.el-pagination__sizes .el-select').click();
    await page.getByRole('option', { name: /50.*条\/页/ }).click();
    await expect(status).toContainText('第 1 页，每页 50 条');
  });

  test('自定义 layout、背景状态和文档主题切换可用', async ({ page }) => {
    await page.goto('/components/lxpagination');

    const demo = page.locator('.lx-pagination-demo');
    const region = demo.getByRole('region', { name: paginationLabel });
    const pagination = region.locator('.el-pagination');

    await demo.getByLabel('分页布局').selectOption('compact');
    await expect(region.locator('.el-pagination__jump')).toBeVisible();
    await expect(region.locator('.el-pagination__sizes')).toHaveCount(0);

    await demo.getByLabel('背景样式').check();
    await expect(pagination).toHaveClass(/is-background/);

    await page.getByRole('switch', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('switch', { name: 'Switch to light theme' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('375px 下分页局部滚动可键盘聚焦，页面本身不溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxpagination');

    const region = page.getByRole('region', { name: paginationLabel });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect.poll(() => region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

    const viewport = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);

    await region.focus();
    await expect(region).toBeFocused();
    await expect(region).toHaveCSS('outline-width', '2px');
    const before = await region.evaluate((element) => element.scrollLeft);
    await region.press('ArrowRight');
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
  });
});
