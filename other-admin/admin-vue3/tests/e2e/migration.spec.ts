import { expect, test } from '@playwright/test';

import { menuModules, mockBackend, seedSession } from './fixtures';
import { previewMenu } from '../../mock/preview-menu';

test('未登录访问业务页返回登录并保留目标地址', async ({ page }) => {
  const requests = await mockBackend(page);
  await page.goto('/authority/role');
  await expect(page).toHaveURL(/login\?redirect=/);
  expect(requests.some((r) => r.url().endsWith('/api/menu/list'))).toBe(false);
});

for (const [parent, children] of menuModules) {
  for (const child of children) {
    test(`现役入口渲染 ${parent}/${child}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await mockBackend(page);
      await seedSession(page);
      await page.goto(`${parent}/${child}`);
      await expect(page).toHaveURL(new RegExp(`${parent}/${child}$`));
      await expect(page.locator('.main-container')).toBeVisible();
      await expect(page.locator('.app-main')).toBeVisible();
      await expect(page.locator('.app-main')).not.toBeEmpty();
      expect(errors).toEqual([]);
    });
  }
}

test('管理员菜单展示完整的模块和所有已注册入口', async ({ page }) => {
  await mockBackend(page);
  await seedSession(page);
  await page.goto('/h5/GroupTags');

  const sidebar = page.locator('.sidebar-wrapper');
  const parentMenus = sidebar.locator('.el-sub-menu');
  await expect(parentMenus).toHaveCount(previewMenu.length);

  for (const [index, parent] of previewMenu.entries()) {
    const menuTitle = parentMenus.nth(index).locator('.el-sub-menu__title');
    await menuTitle.hover();
    for (const child of parent.children ?? []) {
      await expect(page.getByRole('menuitem', { name: child.name, exact: true })).toBeVisible();
    }
  }
});

test('受限账号不能通过直接地址打开未授权模块', async ({ page }) => {
  await mockBackend(page, { admin: false });
  await seedSession(page, false);
  await page.goto('/thirdParty/agentInterface');
  await expect(page).not.toHaveURL(/thirdParty\/agentInterface$/);
  await expect(page.locator('.sidebar-container')).not.toContainText('AI智能体对接');
});
