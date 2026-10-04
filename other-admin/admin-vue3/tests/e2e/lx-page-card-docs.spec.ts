import { expect, test } from '@playwright/test';

test.describe('lx-ui LxPageCard 文档示例', () => {
  test('验证标题插槽、loading/error、HUD 和窄屏无横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxpagecard');

    // 等待 VitePress hydration 完成后再读取 Markdown API 表，避免首屏异步渲染时误判为无表格。
    await expect(page.getByRole('heading', { name: 'Props' })).toBeVisible();

    const tableLayout = await page.locator('table').evaluateAll((tables) =>
      tables.map((table) => {
        const style = getComputedStyle(table);
        const rect = table.getBoundingClientRect();
        return {
          width: rect.width,
          viewportWidth: table.parentElement?.getBoundingClientRect().width ?? rect.width,
          overflowX: style.overflowX,
        };
      }),
    );
    expect(tableLayout.length).toBeGreaterThan(0);
    for (const table of tableLayout) {
      expect(table.width).toBeLessThanOrEqual(table.viewportWidth + 0.5);
      expect(['auto', 'scroll']).toContain(table.overflowX);
    }

    await expect(page.getByRole('heading', { name: 'LxPageCard 页面容器' })).toBeVisible();
    const region = page.getByRole('region', { name: '接口运行概况' });
    await expect(region).toBeVisible();
    await expect(region.getByRole('heading', { name: '接口运行概况' })).toBeVisible();
    await expect(region.getByRole('button', { name: '刷新概况' })).toBeVisible();

    await page.getByRole('checkbox', { name: '展示错误态' }).check();
    await expect(region.getByRole('alert')).toContainText('数据同步失败');
    await expect(region).toContainText('当前内容仍保留');

    await region.getByRole('button', { name: '刷新概况' }).click();
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(region.getByRole('alert')).toHaveCount(0);
    await expect(region).toContainText('18 / 20');
    await expect(region).not.toHaveAttribute('aria-busy', { timeout: 2_000 });

    await page.getByRole('checkbox', { name: '加载遮罩' }).check();
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(region.getByRole('status', { name: '加载中' })).toBeVisible();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('.page-card-demo')).toHaveClass(/lx-theme-hud/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    const animationDuration = await region
      .getByRole('status', { name: '加载中' })
      .locator('.lx-icon')
      .evaluate((element) => {
        const animation = getComputedStyle(element).animationDuration;
        return animation.split(',').map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith('ms') ? value : value * 1000;
        });
      });
    expect(Math.max(...animationDuration)).toBeLessThanOrEqual(0.02);
  });
});
