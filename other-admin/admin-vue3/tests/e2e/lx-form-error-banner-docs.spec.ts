import { expect, test } from '@playwright/test';

test.describe('lx-ui LxFormErrorBanner 文档示例', () => {
  test('验证阻断播报、slot 操作、主题和窄屏布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxformerrorbanner');

    await expect(page.getByRole('heading', { name: 'LxFormErrorBanner 校验横幅' })).toBeVisible();
    const alert = page.getByRole('alert');
    await expect(alert).toHaveAttribute('aria-live', 'assertive');
    await expect(alert).toHaveAttribute('aria-atomic', 'true');
    await expect(alert).toContainText('校验阻断');

    const details = page.getByRole('button', { name: '查看受影响字段' });
    await details.click();
    await expect(alert).toContainText('受影响字段：派单区域、响应等级');
    await expect(page.getByRole('button', { name: '收起字段清单' })).toBeVisible();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('.form-error-demo')).toHaveClass(/lx-theme-hud/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
