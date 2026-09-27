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
  await expect(page.locator('.sidebar-wrapper .el-menu > .el-sub-menu')).toHaveCount(10);
  await expect(page.getByRole('menuitem', { name: '首页', exact: true })).toBeVisible();
  const menuItems = page.locator('.sidebar-wrapper .el-menu--inline > .el-menu-item');
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
      await expect(page.locator('.app-main')).toContainText(sampleText, { timeout: 5_000 });
    }
    await expect(page.locator('.app-main')).not.toContainText('该页面待后续迭代迁移');
    if (routeUrl === '/thirdParty/thirdParty') {
      await expect(page.locator('.app-main .northbound-table tbody tr')).toHaveCount(3);
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
  const tableRows = appMain.locator('.northbound-table tbody tr');
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

  let targetRow = appMain.locator('.northbound-table tbody tr').filter({ hasText: '预览联调平台' });
  await expect(targetRow).toHaveCount(1);
  await targetRow.getByRole('button', { name: '修改' }).click();
  const editDialog = page.getByRole('dialog', { name: '修改北向接入' });
  await editDialog.locator('input').nth(0).fill('预览联调平台二期');
  await editDialog.getByRole('button', { name: '确定' }).click();

  targetRow = appMain.locator('.northbound-table tbody tr').filter({ hasText: '预览联调平台二期' });
  await expect(targetRow).toHaveCount(1);
  await targetRow.getByRole('button', { name: '删除' }).click();
  const confirmDialog = page.locator('.el-message-box');
  await expect(confirmDialog).toContainText('确认删除');
  await confirmDialog.getByRole('button', { name: '确定' }).click();
  await expect(appMain.locator('.northbound-table tbody tr').filter({ hasText: '预览联调平台二期' })).toHaveCount(0);
  expect(unconfiguredApis).toEqual([]);
});
