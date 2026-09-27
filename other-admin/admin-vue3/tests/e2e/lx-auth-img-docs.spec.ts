import { expect, test } from '@playwright/test';

test.describe('LxAuthImg 文档示例', () => {
  test('用宿主 Mock Blob 显示本地图片并发出载入事件', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/components/lxauthimg');

    await expect(page.getByRole('heading', { name: 'LxAuthImg 鉴权图片' })).toBeVisible();
    const image = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByTestId('auth-img-request-count')).toHaveText('1');
    await expect(page.getByTestId('auth-img-load-count')).toHaveText('1');
    const localOrigins = new Set([new URL(page.url()).origin, 'http://127.0.0.1:4176', 'http://localhost:4176']);
    expect(
      requests
        .filter((url) => url.startsWith('http://') || url.startsWith('https://'))
        .every((url) => localOrigins.has(new URL(url).origin)),
    ).toBe(true);
    expect(requests.some((url) => new URL(url).pathname.startsWith('/api/'))).toBe(false);
  });

  test('请求失败可显示回退图，缺少回退时展示可访问错误状态', async ({ page }) => {
    await page.goto('/components/lxauthimg');
    await page.getByRole('button', { name: '失败后显示回退图' }).click();
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('1');

    const fallback = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect(fallback).toHaveAttribute('src', '/auth-img-sample.png');
    await expect
      .poll(() => fallback.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    await page.getByRole('button', { name: '请求失败' }).click();
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('2');
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识，图片加载失败' })).toBeVisible();
    await expect(page.locator('.lx-auth-img-demo [data-icon-name="image"]')).toBeVisible();
  });

  test('支持取消旧请求、空地址、减少动效、键盘操作和 375px 布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxauthimg');

    const initialImage = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect
      .poll(() => initialImage.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await page.getByRole('checkbox', { name: 'HUD 深色' }).check();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    await page.screenshot({ path: 'test-results/lx-auth-img-375-success.png' });

    await page.getByRole('button', { name: '延迟载入' }).click();
    const loading = page.getByRole('img', { name: 'LinkX 通信服务标识，图片加载中' });
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    const spinner = page.locator('.lx-auth-img-demo [data-icon-name="loading"]');
    await expect(spinner).toBeVisible();
    const animation = await spinner.evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(animation)).toBe(0);

    await page.getByRole('button', { name: '切换资源并取消旧请求' }).click();
    await expect(page.getByTestId('auth-img-cancel-count')).toHaveText('1');
    await page.getByRole('button', { name: '正常载入' }).press('Enter');
    const image = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    const requestCount = await page.getByTestId('auth-img-request-count').textContent();
    await page.getByRole('button', { name: '空地址' }).click();
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识，图片加载失败' })).toBeVisible();
    await expect(page.getByTestId('auth-img-request-count')).toHaveText(requestCount ?? '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
