import { expect, test, type Page } from '@playwright/test';

import { menus, mockBackend, ok, seedSession } from './fixtures';

const menuIds = menus.flatMap((parent) => [parent.id, ...parent.children.map((child) => child.id)]);
const actions = [
  '/admin/role/create',
  '/admin/role/update',
  '/admin/role/delete',
  '/admin/trUserRole/createMany',
  '/admin/executor/create',
  '/admin/executor/delete',
  '/admin/user/updatePwd',
  '/admin/user/update',
];

function permissions() {
  return ok({ type: 0, menus: menuIds, actions });
}

async function holdRequest(page: Page, url: string, method: string) {
  let release!: () => void;
  let requestCount = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback();
    requestCount += 1;
    await pending;
    await route.fulfill({ json: ok() });
  });

  return { release: () => release(), requestCount: () => requestCount };
}

test('后台角色删除、启停和设置用户在写入期间锁定重复操作', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: 'role-10', name: '后台业务角色', status: 0 }], total: 1 });
      }
      if (path === '/auth/v1/user/adminuser/page') {
        return ok({ records: [{ id: 'admin-10', idCard: 'mock.admin', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);

  const deletion = await holdRequest(page, '**/linkx/admin/api/role/deleteBatch', 'POST');
  const status = await holdRequest(page, '**/linkx/admin/api/role', 'PUT');
  const binding = await holdRequest(page, '**/linkx/admin/auth/v1/role/role-10/user', 'PUT');
  await page.goto('/authority/adminRole');

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台业务角色' });
  const deleteButton = row.getByRole('button', { name: '删除' });
  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
  await page.locator('.el-message-box').getByRole('button', { name: '取消' }).click();
  await expect(deleteButton).toBeEnabled();
  expect(deletion.requestCount()).toBe(0);

  await deleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(deletion.requestCount).toBe(1);
  await expect(deleteButton).toHaveAttribute('aria-busy', 'true');
  await deleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  deletion.release();
  await expect(deleteButton).toBeEnabled();

  const statusControl = row.locator('.el-switch');
  const statusCore = statusControl.locator('.el-switch__core');
  await statusCore.click();
  await expect.poll(status.requestCount).toBe(1);
  await expect(statusControl).toHaveClass(/is-disabled/);
  await expect(statusControl).toHaveAttribute('aria-busy', 'true');
  await statusCore.click({ force: true });
  expect(status.requestCount()).toBe(1);
  status.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);

  await row.getByRole('button', { name: '设置用户' }).click();
  const dialog = page.getByRole('dialog', { name: /设置用户/ });
  const selectedRow = dialog.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'mock.admin' });
  await selectedRow.locator('.el-checkbox__input').click();
  const confirmButton = dialog.getByRole('button', { name: '确定', exact: true });
  await confirmButton.click();
  await expect.poll(binding.requestCount).toBe(1);
  await expect(confirmButton).toBeDisabled();
  await expect(confirmButton).toHaveAttribute('aria-busy', 'true');
  await confirmButton.click({ force: true });
  expect(binding.requestCount()).toBe(1);
  await expect(dialog).toBeVisible();
  binding.release();
  await expect(dialog).toBeHidden();
});

test('后台角色表单保存期间禁用二次提交并在请求结束后关闭', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/api/role' && request.method() === 'GET') return ok({ records: [], total: 0 });
      return undefined;
    },
  });
  await seedSession(page);
  const create = await holdRequest(page, '**/linkx/admin/api/role', 'POST');

  await page.goto('/authority/adminRole');
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog', { name: '新增角色' });
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await expect(saveButton).toBeEnabled();
  await dialog.getByPlaceholder('请输入角色名称').fill('并发锁角色');
  await saveButton.click();
  await expect.poll(create.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(create.requestCount()).toBe(1);
  create.release();
  await expect(dialog).toBeHidden();
});

test('管理员人员状态、单人设角、密码和批量设角请求具备 pending 锁', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('localLanguage', 'cn');
    localStorage.setItem('simplePassWord', 'true');
  });
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/auth/v1/user/page') {
        return ok({
          records: [
            {
              id: 'person-10',
              name: '后台人员',
              idCard: 'operator-10',
              departmentName: '一中队',
              departmentCode: 'D-01',
              status: 0,
            },
          ],
          total: 1,
        });
      }
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: 'role-20', name: '值班角色', status: 0 }], total: 1 });
      }
      if (path === '/auth/v1/user/person-10/role' && request.method() === 'PUT') {
        return ok({ id: 'role-20', name: '值班角色' });
      }
      if (path === '/api/globals/list') return ok([]);
      return undefined;
    },
  });
  await seedSession(page);

  const status = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/status/1', 'PUT');
  const singleRole = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/role/role-20', 'PUT');
  const password = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/pwd', 'PUT');
  const batchRole = await holdRequest(page, '**/linkx/admin/auth/v1/role/role-20/user', 'PUT');
  await page.goto('/authority/adminPerson');

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  const statusControl = row.locator('.el-switch');
  const statusCore = statusControl.locator('.el-switch__core');
  const setRoleButton = row.getByRole('button', { name: '设置角色' });
  const resetPasswordButton = row.getByRole('button', { name: '重置密码' });
  const deletePersonButton = row.getByRole('button', { name: '删除' });
  await row.locator('.el-checkbox__input').click();
  await statusCore.click();
  await expect.poll(status.requestCount).toBe(1);
  await expect(statusControl).toHaveClass(/is-disabled/);
  await expect(statusControl).toHaveAttribute('aria-busy', 'true');
  await expect(setRoleButton).toBeDisabled();
  await expect(resetPasswordButton).toBeDisabled();
  await expect(deletePersonButton).toBeDisabled();
  const batchEditButton = page.getByRole('button', { name: '批量编辑' });
  await expect(batchEditButton).toBeDisabled();
  await statusCore.click({ force: true });
  expect(status.requestCount()).toBe(1);
  status.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);
  await expect(setRoleButton).toBeEnabled();
  await expect(resetPasswordButton).toBeEnabled();
  await expect(deletePersonButton).toBeEnabled();
  await expect(batchEditButton).toBeEnabled();

  await row.getByRole('button', { name: '设置角色' }).click();
  let dialog = page.getByRole('dialog');
  let saveButton = dialog.getByRole('button', { name: '保存' });
  await saveButton.click();
  await expect.poll(singleRole.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(singleRole.requestCount()).toBe(1);
  singleRole.release();
  await expect(dialog).toBeHidden();

  await row.getByRole('button', { name: '重置密码' }).click();
  dialog = page.getByRole('dialog');
  const passwordInputs = dialog.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('MockPass123');
  await passwordInputs.nth(1).fill('MockPass123');
  saveButton = dialog.locator('.el-dialog__footer button').last();
  await saveButton.click();
  await expect.poll(password.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(password.requestCount()).toBe(1);
  password.release();
  await expect(dialog).toBeHidden();

  await row.locator('.el-checkbox__input').click();
  await page.getByRole('button', { name: '批量编辑' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').filter({ hasText: '角色' }).locator('.el-select__wrapper').click();
  await page.getByRole('option', { name: '值班角色' }).click();
  saveButton = dialog.getByRole('button', { name: '保存' });
  await saveButton.click();
  await expect.poll(batchRole.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(batchRole.requestCount()).toBe(1);
  batchRole.release();
  await expect(dialog).toBeHidden();
});

test('管理员人员单选后工具栏批量删除在请求期间锁定', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/auth/v1/user/page') {
        return ok({
          records: [
            {
              id: 'person-10',
              name: '后台人员',
              idCard: 'operator-10',
              departmentName: '一中队',
              departmentCode: 'D-01',
              status: 0,
            },
          ],
          total: 1,
        });
      }
      return undefined;
    },
  });
  await seedSession(page);
  const deletion = await holdRequest(page, '**/linkx/admin/auth/v1/user*', 'DELETE');
  const status = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/status/1', 'PUT');
  await page.goto('/authority/adminPerson');

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  await row.locator('.el-checkbox__input').click();
  const batchDeleteButton = page.getByRole('button', { name: '批量删除' });
  await batchDeleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(deletion.requestCount).toBe(1);
  await expect(batchDeleteButton).toBeDisabled();
  await expect(batchDeleteButton).toHaveAttribute('aria-busy', 'true');
  await expect(row.getByRole('button', { name: '设置角色' })).toBeDisabled();
  await expect(row.getByRole('button', { name: '重置密码' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '批量编辑' })).toBeDisabled();
  await expect(row.locator('.el-switch')).toHaveClass(/is-disabled/);
  await row.locator('.el-switch__core').click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  expect(status.requestCount()).toBe(0);
  deletion.release();
});
