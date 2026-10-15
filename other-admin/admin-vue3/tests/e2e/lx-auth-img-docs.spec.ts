import { expect, test } from '@playwright/test';

test.describe('LxAuthImg 文档示例', () => {
  test('用宿主 Mock Blob 显示本地图片并发出载入事件', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/components/lxauthimg');

    await expect(page.getByRole('heading', { name: 'LxAuthImg 鉴权图片' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '深色主题' })).toBeVisible();
    const image = page.locator('.lx-auth-img-demo .lx-auth-img');
    const previewStatus = page.locator('.lx-auth-img-demo__preview-status');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('.lx-auth-img-demo__preview-copy > span:first-child')).toHaveText('受保护图片预览');
    await expect(previewStatus).toHaveText('主图载入完成');
    await expect(page.getByTestId('auth-img-request-count')).toHaveText('1');
    await expect(page.getByTestId('auth-img-load-count')).toHaveText('1');
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载完成');
    const localOrigins = new Set([new URL(page.url()).origin, 'http://127.0.0.1:4176', 'http://localhost:4176']);
    expect(
      requests
        .filter((url) => url.startsWith('http://') || url.startsWith('https://'))
        .every((url) => localOrigins.has(new URL(url).origin)),
    ).toBe(true);
    expect(requests.some((url) => new URL(url).pathname.startsWith('/api/'))).toBe(false);
  });

  test('可独立添加、替换和清除回退图，并展示空态与失败说明', async ({ page }) => {
    await page.goto('/components/lxauthimg');
    const mode = page.getByRole('combobox', { name: 'Mock 状态' });
    const fallbackChoice = page.getByRole('combobox', { name: '回退图片' });
    const previewStatus = page.locator('.lx-auth-img-demo__preview-status');
    await mode.selectOption({ label: '请求失败' });
    await expect(previewStatus).toHaveText('正在载入主图');
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('1');
    await expect(previewStatus).toHaveText('主图载入失败，显示错误占位');

    const fallback = page.locator('.lx-auth-img-demo .lx-auth-img');
    await fallbackChoice.selectOption({ label: '服务标识图片' });
    await expect(fallback).toHaveAttribute('src', '/auth-img-sample.png');
    await expect
      .poll(() => fallback.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(previewStatus).toHaveText('主图异常，已显示回退图片');
    await expect(page.locator('.lx-auth-img__status')).toHaveText('主图加载失败，已显示回退图片');

    await mode.selectOption({ label: '空地址' });
    await expect(fallback).toHaveAttribute('aria-busy', 'false');
    await expect(fallback).toHaveAttribute('src', '/auth-img-sample.png');
    await expect(previewStatus).toHaveText('主图地址为空，已显示回退图片');
    await expect(page.locator('.lx-auth-img__status')).toHaveText('主图地址为空，已显示回退图片');

    await mode.selectOption({ label: '请求失败' });
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('2');

    const requestCount = await page.getByTestId('auth-img-request-count').textContent();
    await fallbackChoice.selectOption({ label: '站点盾牌图标' });
    await expect(fallback).toHaveAttribute('src', '/favicon.svg');
    await expect
      .poll(() => fallback.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.getByTestId('auth-img-request-count')).toHaveText(requestCount ?? '');

    await fallbackChoice.selectOption({ label: '不使用回退图' });
    await expect(fallback).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识，图片加载失败' })).toHaveCount(0);
    await expect(page.locator('.lx-auth-img-demo [data-icon-name="circle-alert"]')).toBeVisible();
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载失败');
    await expect(previewStatus).toHaveText('主图载入失败，显示错误占位');

    const retry = page.getByTestId('auth-img-retry');
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.click();
    await expect(retry).toBeVisible();
    await expect(retry).toBeDisabled();
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载完成');
    await expect(page.locator('.lx-auth-img__status')).toBeFocused();
    await expect(previewStatus).toHaveText('主图载入完成');
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('2');

    await mode.selectOption({ label: '空地址' });
    await expect(page.locator('.lx-auth-img__status')).toHaveText('暂无图片');
    await expect(previewStatus).toHaveText('主图地址为空，显示空态');
  });

  test('支持取消旧请求、空地址、减少动效、键盘操作和 375px 布局', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxauthimg');

    const propsRegion = page.getByRole('region', { name: 'LxAuthImg 属性 API 表格' });
    await expect(propsRegion).toBeVisible();
    await expect(propsRegion).toHaveAttribute('tabindex', '0');
    const propsDimensions = await propsRegion.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(propsDimensions.scrollWidth).toBeGreaterThan(propsDimensions.clientWidth);
    const documentWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(documentWidths.scrollWidth).toBeLessThanOrEqual(documentWidths.clientWidth);

    const initialImage = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect
      .poll(() => initialImage.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await page.getByRole('checkbox', { name: '深色主题' }).check();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    await page.screenshot({ path: 'test-results/lx-auth-img-375-success.png' });

    const mode = page.getByRole('combobox', { name: 'Mock 状态' });
    await mode.selectOption({ label: '请求失败' });
    await expect(page.locator('.lx-auth-img-demo__preview-status')).toHaveText('主图载入失败，显示错误占位');
    const retry = page.getByTestId('auth-img-retry');
    const retryLayout = await retry.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        whiteSpace: style.whiteSpace,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });
    expect(retryLayout.height).toBeGreaterThanOrEqual(44);
    expect(retryLayout.whiteSpace).toBe('nowrap');
    expect(retryLayout.scrollWidth).toBeLessThanOrEqual(retryLayout.clientWidth);
    await retry.click();
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载完成');

    await mode.selectOption({ label: '延迟载入' });
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识' })).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识，图片加载中' })).toHaveCount(0);
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载中');
    const spinner = page.locator('.lx-auth-img-demo [data-icon-name="loading"]');
    await expect(spinner).toBeVisible();
    const animation = await spinner.evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(animation)).toBe(0);

    await page.getByRole('button', { name: '切换资源并取消旧请求' }).click();
    await expect(page.getByTestId('auth-img-cancel-count')).toHaveText('1');
    await mode.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(mode).toHaveValue('success');
    const image = page.locator('.lx-auth-img-demo .lx-auth-img');
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('.lx-auth-img__status')).toHaveText('图片加载完成');

    const requestCount = await page.getByTestId('auth-img-request-count').textContent();
    await mode.selectOption({ label: '空地址' });
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'LinkX 通信服务标识，暂无图片' })).toHaveCount(0);
    await expect(page.locator('.lx-auth-img__status')).toHaveText('暂无图片');
    await expect(page.getByTestId('auth-img-request-count')).toHaveText(requestCount ?? '');
    // 错误计数按 Demo 生命周期累计；前面“请求失败”产生的错误事件应保留。
    await expect(page.getByTestId('auth-img-error-count')).toHaveText('1');
    const debug = page.locator('.lx-auth-img-demo__debug');
    await expect(debug).not.toHaveAttribute('open', '');
    await debug.locator('summary').click();
    await expect(debug).toHaveAttribute('open', '');
    await expect(page.getByTestId('auth-img-request-count')).toBeVisible();
    const finalDocumentWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(finalDocumentWidths.scrollWidth).toBeLessThanOrEqual(finalDocumentWidths.clientWidth);
  });

  test('320px 下状态选择器收缩到容器内，页面没有横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/components/lxauthimg');

    const propsRegion = page.getByRole('region', { name: 'LxAuthImg 属性 API 表格' });
    const firstProperty = propsRegion.locator('tbody tr:first-child td:first-child');
    await propsRegion.evaluate((element) => {
      element.scrollLeft = 180;
    });
    const firstPropertyLeft = await firstProperty.evaluate((element) => element.getBoundingClientRect().left);
    const propsRegionLeft = await propsRegion.evaluate((element) => element.getBoundingClientRect().left);
    expect(Math.abs(firstPropertyLeft - propsRegionLeft)).toBeLessThanOrEqual(1);

    const mode = page.getByRole('combobox', { name: 'Mock 状态' });
    const layout = await mode.evaluate((element) => {
      const label = element.closest('label');
      if (!label) return null;
      const labelRect = label.getBoundingClientRect();
      const selectRect = element.getBoundingClientRect();
      return {
        labelLeft: labelRect.left,
        labelRight: labelRect.right,
        selectLeft: selectRect.left,
        selectRight: selectRect.right,
      };
    });
    expect(layout).not.toBeNull();
    if (!layout) throw new Error('Mock 状态选择器未渲染');
    expect(layout.selectLeft).toBeGreaterThanOrEqual(layout.labelLeft);
    expect(layout.selectRight).toBeLessThanOrEqual(layout.labelRight + 1);

    const fallbackChoice = page.getByRole('combobox', { name: '回退图片' });
    const fallbackLayout = await fallbackChoice.evaluate((element) => {
      const label = element.closest('label');
      if (!label) return null;
      const labelRect = label.getBoundingClientRect();
      const selectRect = element.getBoundingClientRect();
      return {
        labelLeft: labelRect.left,
        labelRight: labelRect.right,
        selectLeft: selectRect.left,
        selectRight: selectRect.right,
      };
    });
    expect(fallbackLayout).not.toBeNull();
    if (!fallbackLayout) throw new Error('回退图片选择器未渲染');
    expect(fallbackLayout.selectLeft).toBeGreaterThanOrEqual(fallbackLayout.labelLeft);
    expect(fallbackLayout.selectRight).toBeLessThanOrEqual(fallbackLayout.labelRight + 1);

    const documentWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(documentWidths.scrollWidth).toBeLessThanOrEqual(documentWidths.clientWidth);
  });

  test('1440px 下属性表适配文档栏宽度，避免桌面横向滚动', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/components/lxauthimg');

    const propsRegion = page.getByRole('region', { name: 'LxAuthImg 属性 API 表格' });
    const dimensions = await propsRegion.evaluate((element) => {
      const table = element.querySelector('table');
      if (!table) return null;
      const requestType = table.querySelector('tbody tr:nth-child(2) td:nth-child(2) code');
      const fallbackRow = Array.from(table.querySelectorAll('tbody tr')).find(
        (row) => row.cells[0]?.textContent?.trim() === 'fallback',
      );
      const fallbackCode = fallbackRow?.cells[0]?.querySelector('code');
      const fallbackCell = fallbackRow?.cells[0];
      if (!requestType || !fallbackCode || !fallbackCell) return null;
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        tableWidth: table.getBoundingClientRect().width,
        typeOverflowWrap: getComputedStyle(requestType).overflowWrap,
        typeWhiteSpace: getComputedStyle(requestType).whiteSpace,
        fallbackCodeRight: fallbackCode.getBoundingClientRect().right,
        fallbackCellRight: fallbackCell.getBoundingClientRect().right,
      };
    });
    expect(dimensions).not.toBeNull();
    if (!dimensions) throw new Error('LxAuthImg 属性表未渲染');
    expect(dimensions.tableWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.typeOverflowWrap).toBe('normal');
    expect(dimensions.typeWhiteSpace).toBe('normal');
    expect(dimensions.fallbackCodeRight).toBeLessThanOrEqual(dimensions.fallbackCellRight + 1);
  });
});
