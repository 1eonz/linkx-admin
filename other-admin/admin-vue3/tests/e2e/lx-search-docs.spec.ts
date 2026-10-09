import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('文档站中文搜索可以按词片段定位组件页面', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const searchButton = page.getByRole('button', { name: '搜索文档' });
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  const searchInput = page.locator('.VPLocalSearchBox input[type="search"]');
  await expect(searchInput).toBeFocused();
  await expect(searchInput).toHaveAttribute('placeholder', '搜索文档');
  await searchInput.fill('级联选择');

  const cascaderResult = page
    .locator('.VPLocalSearchBox')
    .getByRole('link', { name: 'LxCascader 级联选择', exact: true });
  await expect(cascaderResult).toBeVisible();
  await expect(cascaderResult).toHaveAttribute('href', /^\/components\/lxcascader\.html(?:#.*)?$/);
  await expect(page.locator('.search-keyboard-shortcuts')).toContainText('切换结果');

  await cascaderResult.click();
  await expect(page).toHaveURL(/\/components\/lxcascader(?:\.html)?(?:#.*)?$/);
  await expect(page.locator('.vp-doc h1')).toContainText('LxCascader');
});

test('中文短语优先召回目标组件，缺少完整连续片段时无结果', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: '搜索文档' }).click();
  const searchInput = page.locator('.VPLocalSearchBox input[type="search"]');
  await searchInput.fill('级联选择');

  const results = page.locator('.VPLocalSearchBox .result');
  const firstResultPath = async () => {
    const href = await results.first().getAttribute('href');
    return href ? new URL(href, page.url()).pathname : undefined;
  };

  await expect.poll(firstResultPath).toBe('/components/lxcascader.html');
  await searchInput.fill('级联选择不存在');
  await expect(page.locator('.VPLocalSearchBox .no-results')).toBeVisible();
});

test('启用搜索后仍保留完整组件导航入口', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/components/lxdatepicker');

  await expect(page.locator('.vp-doc h1')).toContainText('LxDatePicker');
  const sidebar = page.locator('.VPSidebar');
  await expect(sidebar).toBeVisible();
  const componentLinks = sidebar.locator('a[href^="/components/"]');
  await expect(componentLinks.first()).toBeVisible();
  const hrefs = await componentLinks.evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).getAttribute('href')),
  );
  expect(new Set(hrefs).size).toBeGreaterThanOrEqual(50);
  await expect(sidebar.getByRole('link', { name: 'LxCascader 级联选择', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'LxDynamicForm 动态表单', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'LxSelectPagination 远程分页选择', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'LxAuthImg 鉴权图片', exact: true })).toBeVisible();
});
