import { expect, test } from '@playwright/test';

import { previewMenu } from '../../mock/preview-menu';

const sampleTextByRoute: Record<string, string> = {
  '/dashboard': '警务协同',
  '/baseData/thirdParty': '省级情报共享平台',
  '/baseData/globals': 'DUTY_SCHEDULE_ENABLE',
  '/baseData/mapConfig': '市区基础地图',
  '/baseData/layoutConfig': '常用应用',
  '/authority/role': '系统管理员',
  '/authority/person': '张晨',
  '/authority/userManage': 'admin.preview',
  '/authority/IMPermission': '系统配置',
  '/authority/IMrole': '值班调度员',
  '/authority/IMperson': '张晨',
  '/authority/adminPermission': '系统配置',
  '/authority/adminRole': '系统管理员',
  '/authority/adminPerson': '张晨',
  '/authority/customDepartment': '市局指挥中心',
  '/collaboration/index': '应急指挥岗',
  '/collaboration/quick': '勤务标签',
  '/h5/carousel': '应急值守安排',
  '/policeExtend/ArchivedTable': '市局应急联动群',
  '/h5/GroupTags': '值班通知',
  '/location/location': '市局指挥中心',
  '/scheduling/dutyType': '白班',
  '/scheduling/dutyInformation': '张晨',
  '/notification/alertPush': '市局指挥中心',
  '/policeExtend/virtualUser': '应急值守账号',
  '/thirdParty/app': '指挥调度',
  '/thirdParty/southInterface': '警情查询服务',
  '/thirdParty/policeReport': '警情接入服务',
  '/thirdParty/unifiedComm': '服务配置',
  '/thirdParty/agentInterface': '系统设置',
  '/thirdParty/thirdParty': '省级情报共享平台',
  '/nodeManage/nodeManagement': '市局主节点',
  '/nodeManage/dataManage': '市局主节点',
};

test('本地预览全部菜单入口可打开且读取样例数据', async ({ page }) => {
  const unconfiguredApis: string[] = [];
  page.on('response', (response) => {
    const requestUrl = new URL(response.url());
    if (requestUrl.pathname.startsWith('/linkx/admin/') && response.status() === 501) {
      unconfiguredApis.push(`${response.request().method()} ${requestUrl.pathname}`);
    }
  });

  const routeUrls = previewMenu.flatMap((parent) => parent.children?.map((child) => child.url) ?? []);
  expect(routeUrls).toHaveLength(32);
  const previewRoutes = ['/dashboard', ...routeUrls];
  expect(Object.keys(sampleTextByRoute).sort()).toEqual([...previewRoutes].sort());

  await page.goto('/h5/GroupTags', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  const submenuTitles = page
    .getByRole('menubar')
    .locator('[role="menuitem"]')
    .filter({ has: page.locator('[role="menu"]') });
  await expect(submenuTitles).toHaveCount(previewMenu.length);
  const submenuNames = await submenuTitles.evaluateAll((items) =>
    items
      .map((item) => {
        const title = item.querySelector<HTMLElement>(':scope > .el-sub-menu__title');
        return title?.textContent?.trim() ?? '';
      })
      .filter(Boolean),
  );
  expect(submenuNames.sort()).toEqual(previewMenu.map((parent) => parent.name).sort());
  await expect(page.getByRole('menuitem', { name: '首页', exact: true })).toBeVisible();
  const menuItems = page.locator('[role="menubar"] [role="menu"] > [role="menuitem"]');
  await expect(menuItems).toHaveCount(32);
  expect((await menuItems.allTextContents()).map((title) => title.trim()).sort()).toEqual(
    previewMenu.flatMap((parent) => parent.children?.map((child) => child.name) ?? []).sort(),
  );

  const sidebarScroll = page.locator('.sidebar-scroll');
  const scrollMetrics = await sidebarScroll.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);

  await page.getByRole('button', { name: /查看全部菜单，共 33 项/ }).click();
  const menuDirectory = page.getByRole('dialog', { name: '全部菜单（33）' });
  await expect(menuDirectory.getByRole('navigation', { name: '全部菜单目录' }).getByRole('link')).toHaveCount(33);
  await expect(menuDirectory.getByRole('link', { name: '首页', exact: true })).toBeVisible();
  const directorySearch = menuDirectory.getByRole('textbox', { name: '筛选全部菜单' });
  await directorySearch.fill('北向接入管理');
  await expect(menuDirectory.getByRole('navigation', { name: '全部菜单目录' }).getByRole('link')).toHaveCount(1);
  await menuDirectory.getByRole('link', { name: '北向接入管理' }).click();
  await expect(page).toHaveURL(/\/thirdParty\/thirdParty$/);
  await expect(menuDirectory).toBeHidden();

  const menuSearch = page.getByRole('textbox', { name: '搜索菜单' });
  await expect(menuSearch).toBeVisible();
  await menuSearch.fill('北向接入管理');
  const northboundMenuResult = page.getByRole('navigation', { name: '菜单搜索结果' }).getByRole('link', {
    name: '三方对接 北向接入管理',
  });
  await expect(northboundMenuResult).toBeVisible();
  await northboundMenuResult.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/thirdParty\/thirdParty$/);
  await page.goto('/h5/GroupTags', { waitUntil: 'domcontentloaded', timeout: 15_000 });

  const pagesWithoutShell: string[] = [];
  for (const routeUrl of previewRoutes) {
    await page.goto(routeUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    try {
      await expect(page.locator('.main-container')).toBeVisible({ timeout: 10_000 });
    } catch {
      pagesWithoutShell.push(routeUrl);
      continue;
    }

    const sampleText = sampleTextByRoute[routeUrl];
    if (routeUrl === '/dashboard') {
      await expect(page.locator('.dashboard-container h1')).toContainText(sampleText, { timeout: 5_000 });
      await page.locator('.version-trigger').hover();
      await expect(page.locator('.version-popover')).toContainText('警务协同版本：本地 Mock');
      await expect(page.locator('.version-popover')).toContainText('MSIP版本：本地 Mock');
      await expect(page.locator('.version-popover')).toContainText('警信版本：本地 Mock');
    } else if (sampleText) {
      await expect(page.locator('.app-main')).toContainText(sampleText, { timeout: 15_000 });
    }
    await expect(page.locator('.app-main')).not.toContainText('该页面待后续迭代迁移');
    if (routeUrl === '/thirdParty/thirdParty') {
      await expect(page.locator('.app-main tbody tr')).toHaveCount(3);
    }
    if (routeUrl === '/thirdParty/southInterface') {
      const personRow = page.locator('.app-main tbody tr').filter({ hasText: '重点人员库' });
      await expect(personRow).toContainText('5分钟');
      await expect(page.locator('.app-main')).not.toContainText('NaN分钟');
    }
    if (routeUrl === '/h5/carousel') {
      const bannerImages = page.locator('.app-main img');
      await expect(bannerImages).toHaveCount(2);
      await expect
        .poll(
          async () =>
            bannerImages.evaluateAll((images) =>
              images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
            ),
          { timeout: 5_000 },
        )
        .toBe(true);
    }
    if (routeUrl === '/thirdParty/unifiedComm') {
      await expect(page.locator('.app-main input[placeholder="如 192.168.1.100"]')).toHaveValue('127.0.0.1');
    }
    if (routeUrl === '/thirdParty/app') {
      await page.locator('.app-main').getByText('应用管理', { exact: true }).click();
      await expect(page.locator('.app-main')).toContainText('警务协同 H5', { timeout: 5_000 });
    }
    if (routeUrl === '/thirdParty/agentInterface') {
      await page.locator('.app-main').getByText('智能体管理', { exact: true }).click();
      await expect(page.locator('.app-main')).toContainText('勤务问答助手', { timeout: 5_000 });
    }
  }

  expect(pagesWithoutShell, `页面未挂载：${pagesWithoutShell.join(', ')}`).toEqual([]);
  expect(unconfiguredApis, `未配置 Mock：${unconfiguredApis.join(', ')}`).toEqual([]);

  await page.goto('/h5/ArchivedTable', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/policeExtend\/ArchivedTable$/);
  await expect(page.locator('.app-main')).toContainText('市局应急联动群');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/h5/GroupTags', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await expect(page.locator('.app-main')).toContainText('值班通知');
    await expect(page.locator('.right-tip')).toBeHidden();
    await expect(page.locator('.user-role')).toBeHidden();
    const viewportLayoutIsValid = await page.locator('.navbar').evaluate((navbar) => {
      const left = navbar.querySelector('.lx-navbar__left')?.getBoundingClientRect();
      const right = navbar.querySelector('.lx-navbar__right')?.getBoundingClientRect();
      return Boolean(
        left && right && left.right <= right.left && document.documentElement.scrollWidth <= window.innerWidth,
      );
    });
    expect(viewportLayoutIsValid, `窄屏顶栏或页面溢出：${width}px`).toBe(true);
  }
});

test('北向接入管理使用本地 Mock 完成筛选和增改删', async ({ page }) => {
  const unconfiguredApis: string[] = [];
  page.on('response', (response) => {
    const requestUrl = new URL(response.url());
    if (requestUrl.pathname.startsWith('/linkx/admin/') && response.status() === 501) {
      unconfiguredApis.push(`${response.request().method()} ${requestUrl.pathname}`);
    }
  });

  await page.goto('/thirdParty/thirdParty', { waitUntil: 'domcontentloaded' });
  const appMain = page.locator('.app-main');
  const tableRows = appMain.getByRole('table').nth(1).getByRole('row');
  await expect(tableRows).toHaveCount(3);

  const searchInput = appMain.locator('.name-filter input');
  await searchInput.fill('省级情报');
  await appMain.getByRole('button', { name: '搜索' }).click();
  await expect(tableRows).toHaveCount(1);
  await expect(tableRows.first()).toContainText('省级情报共享平台');
  await appMain.getByRole('button', { name: '重置' }).click();
  await expect(tableRows).toHaveCount(3);

  await appMain.getByRole('button', { name: '新增' }).click();
  const createDialog = page.getByRole('dialog', { name: '新增北向接入' });
  await createDialog.locator('input').nth(0).fill('预览联调平台');
  await createDialog.locator('input').nth(1).fill('previewNorthbound04');
  await createDialog.locator('input').nth(2).fill('prev-secret-004');
  await createDialog.locator('input').nth(3).fill('24');
  await createDialog.locator('input').nth(4).fill('7');
  await createDialog.getByRole('button', { name: '确定' }).click();

  let targetRow = tableRows.filter({ hasText: '预览联调平台' });
  await expect(targetRow).toHaveCount(1);
  await targetRow.getByRole('button', { name: '修改' }).click();
  const editDialog = page.getByRole('dialog', { name: '修改北向接入' });
  await editDialog.locator('input').nth(0).fill('预览联调平台二期');
  await editDialog.getByRole('button', { name: '确定' }).click();

  targetRow = tableRows.filter({ hasText: '预览联调平台二期' });
  await expect(targetRow).toHaveCount(1);
  await targetRow.getByRole('button', { name: '删除' }).click();
  const confirmDialog = page.locator('.el-message-box');
  await expect(confirmDialog).toContainText('确认删除');
  await confirmDialog.getByRole('button', { name: '确定' }).click();
  await expect(tableRows.filter({ hasText: '预览联调平台二期' })).toHaveCount(0);
  expect(unconfiguredApis).toEqual([]);
});

test('三方应用文本输入保留校验、失败重试、提交锁和编辑回显', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  let createCount = 0;
  let releaseCreate = () => {};
  const createGate = new Promise<void>((resolve) => {
    releaseCreate = resolve;
  });
  await page.route('**/linkx/admin/collaboration/v1/client/create**', async (route) => {
    createCount += 1;
    if (createCount === 1) {
      await route.fulfill({ json: { code: 409, msg: '预览：应用暂不可创建', data: null } });
      return;
    }
    await createGate;
    await route.fallback();
  });

  try {
    await page.goto('/baseData/thirdParty', { waitUntil: 'domcontentloaded' });
    const appMain = page.locator('.app-main');
    await expect(appMain).toContainText('省级情报共享平台');
    await appMain.getByRole('button', { name: '新增', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '新增应用', exact: true });
    const name = dialog.getByPlaceholder('请输入应用名称');
    const appId = dialog.getByPlaceholder('请输入应用ID', { exact: true });
    const secret = dialog.getByPlaceholder('请输入应用密钥');
    const confirm = dialog.getByRole('button', { name: '确定', exact: true });
    await expect(dialog.locator('.lx-input')).toHaveCount(2);

    await name.fill('预览表单专项');
    await appId.fill('bad-id');
    await secret.focus();
    await expect(dialog).toContainText('应用ID不能包含特殊字符');
    await confirm.click();
    expect(createCount, '校验不通过时不得提交').toBe(0);

    await appId.fill('previewFormContract21');
    await secret.fill('preview-secret');
    await confirm.click();
    await expect(page.locator('.el-message')).toContainText('预览：应用暂不可创建');
    await expect(dialog).toBeVisible();
    await expect(name).toHaveValue('预览表单专项');
    await expect(confirm).toBeEnabled();

    await confirm.click();
    await expect.poll(() => createCount).toBe(2);
    await expect(confirm).toBeDisabled();
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    releaseCreate();
    await expect(dialog).toBeHidden();

    const row = appMain.locator('tbody tr').filter({ hasText: '预览表单专项' });
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: '修改', exact: true }).click();
    const editDialog = page.getByRole('dialog', { name: '编辑应用', exact: true });
    await expect(editDialog.getByPlaceholder('请输入应用名称')).toHaveValue('预览表单专项');
    await expect(editDialog.getByPlaceholder('请输入应用ID', { exact: true })).toHaveValue('previewFormContract21');
    await editDialog.getByPlaceholder('请输入应用名称').fill('预览表单专项修改');
    await editDialog.getByRole('button', { name: '确定', exact: true }).click();
    await expect(editDialog).toBeHidden();
    await expect(row).toContainText('预览表单专项修改');
    expect(createCount, '修改必须使用更新接口，不重复新增').toBe(2);

    await row.getByRole('button', { name: '删除', exact: true }).click();
    await page.locator('.el-message-box').getByRole('button', { name: '确定', exact: true }).click();
    await expect(row).toHaveCount(0);
  } finally {
    releaseCreate();
  }
});

test('轮播文章下拉滚到底部后使用本地 Mock 加载下一页', async ({ page }) => {
  const articlePages: number[] = [];
  await page.route('**/linkx/admin/collaboration/v1/post/articles/page**', async (route) => {
    const pageNum = Number(new URL(route.request().url()).searchParams.get('pageNum'));
    articlePages.push(pageNum);
    const records =
      pageNum === 1
        ? Array.from({ length: 20 }, (_, index) => ({
            id: `mock-article-${String(index + 1).padStart(3, '0')}`,
            title: `本地 Mock 文章 ${index + 1}`,
            contentUrl: `/mock/articles/${index + 1}`,
          }))
        : [{ id: 'mock-article-021', title: '本地 Mock 文章 21', contentUrl: '/mock/articles/21' }];

    await route.fulfill({
      json: { code: 0, msg: 'Mock 成功', data: { records, totalCount: 21 } },
    });
  });

  await page.goto('/h5/carousel', { waitUntil: 'domcontentloaded' });
  const appMain = page.locator('.app-main');
  await appMain.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog', { name: '新增' });
  const accountField = dialog.locator('.el-form-item').filter({ hasText: '公众号' });
  await accountField.locator('.el-select').click();
  await page.getByRole('option', { name: '杭州警务' }).click();
  await expect.poll(() => articlePages).toEqual([1]);

  const titleField = dialog.locator('.el-form-item').filter({ hasText: '标题' });
  const articleSelect = titleField.locator('.el-select');
  await articleSelect.click();
  const articleCombobox = articleSelect.getByRole('combobox');
  const listboxId = await articleCombobox.getAttribute('aria-controls');
  expect(listboxId).toBeTruthy();
  const articleListbox = page.locator(`[id="${listboxId}"]`);
  const articleDropdown = page.locator('.el-select-dropdown__wrap:visible').filter({ has: articleListbox });
  await expect(articleDropdown).toHaveCount(1);
  const scrollMetrics = await articleDropdown.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
  await articleDropdown.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll', { bubbles: true }));
  });

  await expect.poll(() => articlePages).toEqual([1, 2]);
  const loadedArticleOption = articleListbox.getByRole('option', { name: '本地 Mock 文章 21' });
  await expect(loadedArticleOption).toBeVisible();
  await expect(loadedArticleOption).toHaveCount(1);
});

test('AuthImg 请求失败时保留轮播图尺寸并在窄屏不溢出', async ({ page }) => {
  await page.route('**/linkx/admin/mock/images/duty-banner.svg', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: '本地 Mock 图片不存在' }),
  );

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/h5/carousel', { waitUntil: 'domcontentloaded' });

    const placeholder = page.locator('.head-shot.auth-img-placeholder').first();
    await expect(placeholder).toBeVisible();
    const geometry = await placeholder.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius,
        display: style.display,
      };
    });
    expect(geometry).toEqual({ width: 170, height: 80, borderRadius: '4px', display: 'inline-flex' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});

test('AuthImg 可通过键盘重试失败的图片请求', async ({ page }) => {
  let attempts = 0;
  await page.route('**/linkx/admin/mock/images/duty-banner.svg', (route) => {
    attempts += 1;
    if (attempts === 1) {
      return route.fulfill({ status: 404, contentType: 'text/plain', body: '本地 Mock 图片不存在' });
    }

    return route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="170" height="80"><rect width="170" height="80" fill="#e5e6eb"/></svg>',
    });
  });
  await page.goto('/h5/carousel', { waitUntil: 'domcontentloaded' });

  const retry = page.getByRole('button', { name: '图片加载失败，重新加载 应急值守安排缩略图' }).first();
  await expect(retry).toBeVisible();
  await expect(retry.getByText('重试')).toBeVisible();
  await retry.press('Enter');
  const loadedImage = page.locator('img.head-shot').first();
  await expect(loadedImage).toHaveAttribute('src', /^blob:/);
  await expect(loadedImage).toHaveAttribute('alt', '应急值守安排缩略图');
  await expect(loadedImage).toHaveAttribute('aria-busy', 'false');
  expect(attempts).toBe(2);
});

test('AuthImg 加载图标遵守减少动效偏好', async ({ page }) => {
  let releaseImage!: () => void;
  const imageResponse = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  await page.route('**/linkx/admin/mock/images/duty-banner.svg', async (route) => {
    await imageResponse;
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="170" height="80" viewBox="0 0 170 80"><rect width="170" height="80" fill="#e5e6eb"/></svg>',
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/h5/carousel', { waitUntil: 'domcontentloaded' });

  const loading = page.locator('.head-shot.auth-img-placeholder.is-loading').first();
  await expect(loading).toBeVisible();
  expect(await loading.locator('svg').evaluate((icon) => getComputedStyle(icon).animationName)).toBe('none');

  releaseImage();
  await expect(page.locator('.head-shot').first()).toHaveAttribute('src', /^blob:/);
});
