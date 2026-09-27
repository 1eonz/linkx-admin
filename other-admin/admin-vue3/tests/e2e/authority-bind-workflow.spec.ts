import { expect, test } from '@playwright/test';

import { menus, mockBackend, ok, seedSession } from './fixtures';

const menuIds = menus.flatMap((parent) => [parent.id, ...parent.children.map((child) => child.id)]);
const roleId = '20';

function permissions(actions: string[]) {
  return ok({ type: 0, menus: menuIds, actions });
}

function peopleResponse(name: string) {
  const people = [
    { id: 'user-1', name: '张三', idCard: 'ID-001', departmentName: '一中队', departmentCode: 'D-01' },
    { id: 'user-2', name: '李四', idCard: 'ID-002', departmentName: '二中队', departmentCode: 'D-02' },
  ];
  const records = name ? people.filter((person) => person.name.includes(name)) : people;
  return ok({ records, total: records.length });
}

async function openRoleBinding(page: import('@playwright/test').Page, actions: string[]) {
  const requests = await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions(actions);
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: roleId, name: 'IM业务角色', status: 0 }], total: 1 });
      }
      if (path === '/auth/v1/user/page') {
        const name = new URL(request.url()).searchParams.get('name') ?? '';
        return peopleResponse(name);
      }
      return undefined;
    },
  });
  await seedSession(page);
  await page.goto('/authority/IMrole');
  return requests;
}

test('IM 角色没有绑定权限时隐藏绑定用户入口', async ({ page }) => {
  await openRoleBinding(page, []);

  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'IM业务角色' });
  await expect(roleRow).toBeVisible();
  await expect(roleRow.getByRole('button', { name: '绑定用户' })).toHaveCount(0);
});

test('IM 角色按人员筛选结果批量绑定并提交 Vue2 契约载荷', async ({ page }) => {
  const requests = await openRoleBinding(page, ['/admin/trUserRole/createMany']);

  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'IM业务角色' });
  await roleRow.getByRole('button', { name: '绑定用户' }).click();
  const dialog = page.getByRole('dialog', { name: '绑定用户' });
  await expect(dialog).toBeVisible();
  const peopleTable = dialog.locator('.el-table__body-wrapper');
  await expect(peopleTable).toContainText('张三');
  await expect(peopleTable).toContainText('李四');

  await dialog.getByPlaceholder('姓名').fill('李');
  await dialog.getByRole('button', { name: '搜索' }).click();
  await expect(peopleTable).toContainText('李四');
  await expect(peopleTable).not.toContainText('张三');
  const filteredRequest = requests
    .filter((request) => new URL(request.url()).pathname.endsWith('/auth/v1/user/page'))
    .at(-1);
  expect(filteredRequest && new URL(filteredRequest.url()).searchParams.get('name')).toBe('李');

  const selectedRow = dialog.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '李四' });
  await selectedRow.locator('.el-checkbox__input').click();
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await page.getByRole('dialog', { name: '绑定确认' }).getByRole('button', { name: '确定', exact: true }).click();

  await expect(dialog).toBeHidden();
  const bindRequest = requests.find(
    (request) => request.method() === 'PUT' && new URL(request.url()).pathname.endsWith(`/auth/v1/role/${roleId}/user`),
  );
  expect(bindRequest?.postDataJSON()).toEqual(['user-2']);
});

test('IM 用户绑定失败后保留弹窗和选择并允许重试', async ({ page }) => {
  const requests = await openRoleBinding(page, ['/admin/trUserRole/createMany']);
  let attempts = 0;
  await page.route(`**/linkx/admin/auth/v1/role/${roleId}/user`, async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 500, json: { code: 500, msg: 'Mock 绑定失败' } });
      return;
    }
    await route.fallback();
  });

  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'IM业务角色' });
  await roleRow.getByRole('button', { name: '绑定用户' }).click();
  const dialog = page.getByRole('dialog', { name: '绑定用户' });
  const selectedRow = dialog.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '张三' });
  await selectedRow.locator('.el-checkbox__input').click();
  const submitButton = dialog.getByRole('button', { name: '确定', exact: true });

  await submitButton.click();
  await page.getByRole('dialog', { name: '绑定确认' }).getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByText('绑定用户失败')).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await expect(selectedRow.locator('.el-checkbox__input.is-checked')).toBeVisible();

  await submitButton.click();
  await page.getByRole('dialog', { name: '绑定确认' }).getByRole('button', { name: '确定', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(attempts).toBe(2);
  const bindRequests = requests.filter(
    (request) => request.method() === 'PUT' && new URL(request.url()).pathname.endsWith(`/auth/v1/role/${roleId}/user`),
  );
  expect(bindRequests).toHaveLength(1);
  expect(bindRequests[0].postDataJSON()).toEqual(['user-1']);
});
