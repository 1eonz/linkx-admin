import { expect, test } from '@playwright/test';

test.describe('lx-ui 壳层组件文档', () => {
  test('面包屑保留原生链接与宿主路由接管语义', async ({ page }) => {
    let externalNavigationRequested = false;
    await page.route('https://example.test/**', async (route) => {
      externalNavigationRequested = true;
      await route.abort();
    });
    await page.goto('/components/lxbreadcrumb.html');
    const breadcrumb = page.getByRole('navigation', { name: '面包屑导航' });
    const link = breadcrumb.getByRole('link', { name: '基础数据' });

    await expect(breadcrumb.getByText('地图配置')).toHaveAttribute('aria-current', 'page');
    const currentUrl = page.url();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(currentUrl);
    await expect(page.getByTestId('last-selection')).toContainText('已选择：基础数据');
    expect(externalNavigationRequested).toBe(false);
  });

  test('顶栏搜索、通知、用户菜单和窄屏布局可用', async ({ page }) => {
    await page.goto('/components/lxnavbar');

    const search = page.getByRole('searchbox', { name: '全局搜索' });
    await search.fill('  群组标签  ');
    await search.press('Enter');
    await expect(page.getByTestId('last-action')).toHaveText('搜索：群组标签');
    await expect(page.locator('.lx-navbar__badge')).toContainText('99+');

    await page.getByRole('button', { name: '通知' }).click();
    await expect(page.getByTestId('last-action')).toHaveText('已打开通知');
    await page.getByRole('button', { name: '张晨 的用户菜单' }).click();
    await page.getByRole('menuitem', { name: '修改密码' }).click();
    await expect(page.getByTestId('last-action')).toHaveText('用户操作：password');

    await page.setViewportSize({ width: 375, height: 812 });
    const navbar = page.locator('.navbar-demo');
    const navbarMetrics = await navbar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, right: rect.right };
    });
    expect(navbarMetrics.scrollWidth).toBeLessThanOrEqual(navbarMetrics.clientWidth);
    expect(navbarMetrics.right).toBeLessThanOrEqual(375);
  });

  test('页签切换、关闭、右键事件与窄屏局部滚动可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtabsbar');
    const tabs = page.getByRole('navigation', { name: '已打开页面' });

    await tabs.getByRole('button', { name: '群组标签', exact: true }).click();
    await expect(tabs.getByRole('button', { name: '群组标签', exact: true })).toHaveAttribute('aria-current', 'page');
    await tabs.getByRole('button', { name: '活动归档', exact: true }).click({ button: 'right' });
    await expect(page.getByTestId('last-action')).toContainText('右键：archive');
    await tabs.getByRole('button', { name: '关闭 群组标签' }).click();
    await expect(tabs.getByRole('button', { name: '群组标签' })).toHaveCount(0);
    await tabs.getByRole('button', { name: '新建页签' }).click();
    await expect(tabs.getByRole('button', { name: '预览页面 1', exact: true })).toBeVisible();
    const tabsDemo = page.locator('.tabs-demo');
    const tabsMetrics = await tabsDemo.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, right: rect.right };
    });
    expect(tabsMetrics.scrollWidth).toBeLessThanOrEqual(tabsMetrics.clientWidth);
    expect(tabsMetrics.right).toBeLessThanOrEqual(375);
  });

  test('页面容器插槽、加载语义和内边距开关可见', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxpagecard');
    const card = page.getByRole('region', { name: '接口运行概况' });

    await expect(card).toContainText('在线节点');
    await expect(card).toContainText('数据来源：本地示例');
    await page.getByLabel('加载遮罩').check();
    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(card.getByRole('status', { name: '加载中' })).toBeVisible();
    await page.getByLabel('加载遮罩').uncheck();
    await page.getByLabel('内容内边距').uncheck();
    await expect(card.locator('.lx-page-card__body')).not.toHaveClass(/has-padding/);
    await page.getByLabel('显示边框').uncheck();
    await expect(card).not.toHaveClass(/is-bordered/);
    await card.getByRole('button', { name: '查看节点' }).click();
    await expect(page.getByTestId('last-action')).toHaveText('已打开节点列表（本地示例）');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
