import { expect, test } from '@playwright/test';

test.describe('lx-ui LxSearchBar 文档示例', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto('/components/lxsearchbar');
  });

  test('成功、空结果和失败状态都能恢复', async ({ page }) => {
    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const search = panel.getByRole('button', { name: '查询' });
    const status = panel.locator('.lx-search-demo__meta-status');

    await search.click();
    await expect(status).toContainText('查询到 2 条');
    await expect(demo.locator('.lx-search-demo__result')).toContainText('AL-2026-0001');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '空结果' }).click();
    await search.click();
    await expect(status).toContainText('暂无匹配结果');
    await expect(demo.locator('.lx-search-demo__result')).toContainText('无结果');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '失败' }).click();
    await search.click();
    await expect(status).toContainText('查询服务暂不可用');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '成功' }).click();
    await search.click();
    await expect(status).toContainText('查询到 2 条');
  });

  test('重置恢复 schema 默认值，查询期间锁定按钮', async ({ page }) => {
    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const keyword = panel.locator('.lx-search-bar__field input[type="text"]').first();
    await keyword.fill('临时条件');

    const reset = panel.getByRole('button', { name: '重置' });
    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(keyword).toHaveValue('');
    await expect(panel.locator('.lx-search-demo__meta-status')).toContainText('查询中');

    const search = panel.getByRole('button', { name: '查询' });
    await expect(search).toBeDisabled();
    await expect(reset).toBeDisabled();
    await expect(panel.locator('.lx-search-demo__meta-status')).toContainText('查询到 2 条');
  });

  test('375px 展开全部条件、焦点和正文宽度保持可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();

    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const expand = panel.getByRole('button', { name: '展开' });
    await expect(expand).toBeVisible();
    await expand.focus();
    await expect(expand).toBeFocused();
    await expand.press('Enter');
    await expect(panel.getByRole('button', { name: '收起' })).toBeVisible();
    await expect(panel.locator('.lx-search-bar__field')).toHaveCount(10);

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await panel.locator('input').first().focus();
    await panel.locator('input').first().press('Escape');
    await expect(panel.locator('input').first()).toHaveValue('');
    await expect(panel.locator('.lx-search-bar__field')).toHaveCount(10);
  });

  test('展示四字段标准态并在桌面同行放置操作组', async ({ page }) => {
    const standard = page.getByTestId('standard-search');
    await expect(standard.locator('.lx-search-bar__field')).toHaveCount(4);
    await expect(standard.locator('.lx-search-bar__grid--inline-actions')).toBeVisible();
    await expect(standard.locator('.lx-search-bar__actions--inline')).toBeVisible();
  });
});
