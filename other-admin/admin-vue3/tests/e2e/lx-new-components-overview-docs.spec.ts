import { expect, test } from '@playwright/test';

test.describe('lx-ui 新增组件总览', () => {
  test('桌面总览加载全部组件分区且没有运行错误', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/components/new-components');
    await expect(page.locator('.new-components-demo')).toBeVisible();
    expect(pageErrors).toEqual([]);
    await expect(page.locator('.new-components-demo__section')).toHaveCount(5);
    await expect(page.locator('.lx-transfer-panel')).toBeVisible();
    await expect(page.locator('.lx-virtual-tree').first()).toBeVisible();
    await expect(page.getByText('远程分页选择', { exact: true })).toBeVisible();
  });

  test('375px 总览页面保持可读且没有横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/new-components');
    await expect(page.locator('.new-components-demo')).toBeVisible();
    await expect(page.getByRole('heading', { name: '鉴权图片' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
