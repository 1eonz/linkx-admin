import { expect, test } from '@playwright/test';

for (const width of [1280, 768, 375, 320]) {
  test(`${width}px Mock 宿主顶栏完整并保留主区滚动和账户键盘入口`, async ({ page }) => {
    const unexpectedWrites: string[] = [];
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      // 预览仅允许本地服务；防止测试误连真实后端。
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
        unexpectedWrites.push(`${request.method()} ${url.hostname}`);
        await route.abort();
        return;
      }
      await route.continue();
    });
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/h5/GroupTags');
    const header = page.locator('.lx-navbar');
    const account = header.getByRole('button', { name: '账户菜单', exact: true });
    await expect(account).toBeVisible();
    await account.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: '修改密码', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem', { name: '修改密码', exact: true })).toBeHidden();
    const geometry = await page.locator('.main-container').evaluate((element) => {
      const header = element.querySelector('.lx-navbar');
      const main = element.querySelector('.app-main');
      const account = element.querySelector('[aria-label="账户菜单"]');
      if (!header || !main || !account) throw new Error('缺少宿主布局节点');
      const headerRect = header.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const accountRect = account.getBoundingClientRect();
      return {
        pageWidth: document.documentElement.scrollWidth,
        headerBottom: headerRect.bottom,
        mainTop: mainRect.top,
        mainBottom: mainRect.bottom,
        mainHeight: mainRect.height,
        accountVisible: accountRect.top >= headerRect.top && accountRect.bottom <= headerRect.bottom + 1,
      };
    });
    expect(geometry.pageWidth).toBeLessThanOrEqual(width + 1);
    expect(geometry.mainTop).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
    expect(geometry.mainBottom).toBeLessThanOrEqual(801);
    expect(geometry.mainHeight).toBeGreaterThan(400);
    expect(geometry.accountVisible).toBe(true);
    const breadcrumb = header.getByRole('navigation', { name: '面包屑导航' });
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('群组标签管理');
    const home = breadcrumb.getByRole('link', { name: '首页', exact: true });
    await expect(home).toHaveAttribute('href', '/dashboard');
    await home.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(header.getByRole('navigation', { name: '面包屑导航' }).locator('[aria-current="page"]')).toHaveText(
      '首页',
    );
    expect(unexpectedWrites).toEqual([]);
  });
}
