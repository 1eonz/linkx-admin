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

function roleListResponse() {
  return ok({ records: [{ id: 'role-10', name: '后台业务角色', status: 0 }], total: 1 });
}

function personListResponse() {
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

async function holdRequest(
  page: Page,
  url: string,
  method: string,
  pathnameSuffix?: string,
  responseBody: unknown = ok(),
  options: { allowAbort?: boolean; matches?: (url: URL) => boolean; status?: number } = {},
) {
  let release!: () => void;
  let requestCount = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback();
    if (pathnameSuffix && !new URL(route.request().url()).pathname.endsWith(pathnameSuffix)) return route.fallback();
    if (options.matches && !options.matches(new URL(route.request().url()))) return route.fallback();
    requestCount += 1;
    if (requestCount > 1) return route.fallback();
    await pending;
    if (route.request().failure()) {
      if (options.allowAbort) return;
      throw new Error(`Mock ${method} ${pathnameSuffix || url} unexpectedly aborted`);
    }
    await route.fulfill({ status: options.status ?? 200, json: responseBody });
  });

  return { release: () => release(), requestCount: () => requestCount };
}

async function failFirstRequest(page: Page, url: string, method: string) {
  let release!: () => void;
  let requestCount = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback();
    requestCount += 1;
    if (requestCount === 1) {
      await pending;
      await route.fulfill({ status: 500, json: { code: 500, msg: 'Mock 请求失败' } });
      return;
    }
    await route.fulfill({ json: ok() });
  });

  return { release: () => release(), requestCount: () => requestCount };
}

async function waitForListResponse(page: Page, pathnameSuffix: string) {
  const response = await page.waitForResponse(
    (item) => item.request().method() === 'GET' && new URL(item.url()).pathname.endsWith(pathnameSuffix),
  );
  expect(response.ok()).toBe(true);
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
  const initialListResponse = waitForListResponse(page, '/linkx/admin/api/role');
  await page.goto('/authority/adminRole');
  await initialListResponse;

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台业务角色' });
  await expect(row).toBeVisible();
  const deleteButton = row.getByRole('button', { name: '删除' });
  const deleteRefresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
  );
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
  await expect.poll(deleteRefresh.requestCount).toBe(1);
  await expect(deleteButton).toBeDisabled();
  await deleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  deleteRefresh.release();
  await expect(deleteButton).toBeEnabled();

  const statusControl = row.locator('.el-switch');
  const statusCore = statusControl.locator('.el-switch__core');
  const statusRefresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
  );
  await statusCore.click();
  await expect.poll(status.requestCount).toBe(1);
  await expect(statusControl).toHaveClass(/is-disabled/);
  await expect(statusControl).toHaveAttribute('aria-busy', 'true');
  await statusCore.click({ force: true });
  expect(status.requestCount()).toBe(1);
  status.release();
  await expect.poll(statusRefresh.requestCount).toBe(1);
  await expect(row.locator('.status-tag')).toBeVisible();
  await row.locator('.status-tag').click({ force: true });
  expect(status.requestCount()).toBe(1);
  statusRefresh.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);

  const bindingRefresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
  );
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
  await expect.poll(bindingRefresh.requestCount).toBe(1);
  const setUsersButton = row.getByRole('button', { name: '设置用户' });
  await expect(setUsersButton).toBeDisabled();
  await setUsersButton.click({ force: true });
  expect(binding.requestCount()).toBe(1);
  bindingRefresh.release();
  await expect(setUsersButton).toBeEnabled();
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

  const initialListResponse = waitForListResponse(page, '/linkx/admin/api/role');
  await page.goto('/authority/adminRole');
  await initialListResponse;
  const createRefresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
  );
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
  await expect.poll(createRefresh.requestCount).toBe(1);
  const addButton = page.getByRole('button', { name: '新增' });
  await expect(addButton).toBeDisabled();
  createRefresh.release();
  await expect(addButton).toBeEnabled();
});

test('后台角色编辑期间锁定同一行其他写操作直到刷新完成', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/api/role' && request.method() === 'GET') return roleListResponse();
      return undefined;
    },
  });
  await seedSession(page);

  const update = await holdRequest(page, '**/linkx/admin/api/role', 'PUT');
  const binding = await holdRequest(page, '**/linkx/admin/auth/v1/role/role-10/user', 'PUT');
  const deletion = await holdRequest(page, '**/linkx/admin/api/role/deleteBatch', 'POST');
  const initialListResponse = waitForListResponse(page, '/linkx/admin/api/role');
  await page.goto('/authority/adminRole');
  await initialListResponse;

  const refresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
  );
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台业务角色' });
  const editButton = row.getByRole('button', { name: '编辑' });
  const setUsersButton = row.getByRole('button', { name: '设置用户' });
  const deleteButton = row.getByRole('button', { name: '删除' });

  await editButton.click();
  const dialog = page.getByRole('dialog', { name: '编辑角色' });
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(update.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(setUsersButton).toBeDisabled();
  await expect(deleteButton).toBeDisabled();
  await expect(row.locator('.status-tag')).toBeVisible();

  update.release();
  await expect(dialog).toBeHidden();
  await expect.poll(refresh.requestCount).toBe(1);
  await expect(setUsersButton).toBeDisabled();
  await expect(deleteButton).toBeDisabled();
  await expect(row.locator('.status-tag')).toBeVisible();
  await setUsersButton.click({ force: true });
  await deleteButton.click({ force: true });
  expect(update.requestCount()).toBe(1);
  expect(binding.requestCount()).toBe(0);
  expect(deletion.requestCount()).toBe(0);
  await expect(page.locator('.el-message-box')).toHaveCount(0);

  refresh.release();
  await expect(setUsersButton).toBeEnabled();
  await expect(deleteButton).toBeEnabled();
  await expect(row.locator('.el-switch')).toBeVisible();
});

test('后台角色保存失败后释放提交锁并允许重试', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/api/role' && request.method() === 'GET') return ok({ records: [], total: 0 });
      return undefined;
    },
  });
  await seedSession(page);

  const create = await failFirstRequest(page, '**/linkx/admin/api/role', 'POST');
  await page.goto('/authority/adminRole');
  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog', { name: '新增角色' });
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await dialog.getByPlaceholder('请输入角色名称').fill('失败后可重试角色');
  await saveButton.click();
  await expect.poll(create.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  create.release();
  await expect(dialog).toBeVisible();
  await expect(saveButton).toBeEnabled();

  await saveButton.click();
  await expect.poll(create.requestCount).toBe(2);
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
  const initialListResponse = waitForListResponse(page, '/linkx/admin/auth/v1/user/page');
  await page.goto('/authority/adminPerson');
  await initialListResponse;
  const statusRefresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
  );
  const singleRole = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/role/role-20', 'PUT');
  const password = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/pwd', 'PUT');
  const batchRole = await holdRequest(page, '**/linkx/admin/auth/v1/role/role-20/user', 'PUT');

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  await expect(row).toBeVisible();
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
  await expect.poll(statusRefresh.requestCount).toBe(1);
  await expect(statusControl).toHaveClass(/is-disabled/);
  await statusCore.click({ force: true });
  expect(status.requestCount()).toBe(1);
  statusRefresh.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);
  await expect(setRoleButton).toBeEnabled();
  await expect(resetPasswordButton).toBeEnabled();
  await expect(deletePersonButton).toBeEnabled();
  await expect(batchEditButton).toBeEnabled();

  await row.getByRole('button', { name: '设置角色' }).click();
  let dialog = page.getByRole('dialog');
  let saveButton = dialog.getByRole('button', { name: '保存' });
  const singleRoleRefresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
  );
  await saveButton.click();
  await expect.poll(singleRole.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(singleRole.requestCount()).toBe(1);
  singleRole.release();
  await expect(dialog).toBeHidden();
  await expect.poll(singleRoleRefresh.requestCount).toBe(1);
  await expect(setRoleButton).toBeDisabled();
  await setRoleButton.click({ force: true });
  expect(singleRole.requestCount()).toBe(1);
  singleRoleRefresh.release();
  await expect(setRoleButton).toBeEnabled();

  await row.getByRole('button', { name: '重置密码' }).click();
  dialog = page.getByRole('dialog');
  const passwordRefresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
  );
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
  await expect.poll(passwordRefresh.requestCount).toBe(1);
  await expect(resetPasswordButton).toBeDisabled();
  await resetPasswordButton.click({ force: true });
  expect(password.requestCount()).toBe(1);
  passwordRefresh.release();
  await expect(resetPasswordButton).toBeEnabled();

  await row.locator('.el-checkbox__input').click();
  await page.getByRole('button', { name: '批量编辑' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').filter({ hasText: '角色' }).locator('.el-select__wrapper').click();
  await page.getByRole('option', { name: '值班角色' }).click();
  saveButton = dialog.getByRole('button', { name: '保存' });
  const batchRoleRefresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
  );
  await saveButton.click();
  await expect.poll(batchRole.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(batchRole.requestCount()).toBe(1);
  batchRole.release();
  await expect(dialog).toBeHidden();
  await expect.poll(batchRoleRefresh.requestCount).toBe(1);
  await expect(batchEditButton).toBeDisabled();
  await page.getByRole('button', { name: '批量编辑' }).click({ force: true });
  expect(batchRole.requestCount()).toBe(1);
  batchRoleRefresh.release();
  await expect(batchEditButton).toBeEnabled();
});

test('管理员人员单选后工具栏批量删除在请求期间锁定', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, _request) => {
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
  const initialListResponse = waitForListResponse(page, '/linkx/admin/auth/v1/user/page');
  await page.goto('/authority/adminPerson');
  await initialListResponse;

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  const deletionRefresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
  );
  await row.locator('.el-checkbox__input').click();
  const batchDeleteButton = page.getByRole('button', { name: '批量删除' });
  await batchDeleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '取消' }).click();
  await expect(batchDeleteButton).toBeEnabled();
  expect(deletion.requestCount()).toBe(0);

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
  await expect.poll(deletionRefresh.requestCount).toBe(1);
  await expect(batchDeleteButton).toBeDisabled();
  await batchDeleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  deletionRefresh.release();
  await expect(batchDeleteButton).toBeEnabled();
  await expect(page.getByRole('button', { name: '批量编辑' })).toBeEnabled();
});

test('管理员人员状态更新失败后释放行锁并允许重试', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path) => {
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

  const status = await failFirstRequest(page, '**/linkx/admin/auth/v1/user/person-10/status/1', 'PUT');
  await page.goto('/authority/adminPerson');

  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  const statusControl = row.locator('.el-switch');
  const statusCore = statusControl.locator('.el-switch__core');
  await statusCore.click();
  await expect.poll(status.requestCount).toBe(1);
  await expect(statusControl).toHaveClass(/is-disabled/);
  status.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);

  await statusCore.click();
  await expect.poll(status.requestCount).toBe(2);
  await expect(statusControl).not.toHaveClass(/is-disabled/);
});

test('后台角色刷新被新搜索取消后保持写锁，刷新失败可重试', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/api/role' && request.method() === 'GET') return roleListResponse();
      return undefined;
    },
  });
  await seedSession(page);

  const update = await holdRequest(page, '**/linkx/admin/api/role', 'PUT');
  const initialListResponse = waitForListResponse(page, '/linkx/admin/api/role');
  await page.goto('/authority/adminRole');
  await initialListResponse;

  const refresh = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    roleListResponse(),
    { allowAbort: true },
  );
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台业务角色' });
  await row.getByRole('button', { name: '编辑' }).click();
  const dialog = page.getByRole('dialog', { name: '编辑角色' });
  await dialog.getByRole('button', { name: '保存' }).click();
  await expect.poll(update.requestCount).toBe(1);
  update.release();
  await expect(dialog).toBeHidden();
  await expect.poll(refresh.requestCount).toBe(1);

  const search = await holdRequest(
    page,
    '**/linkx/admin/api/role**',
    'GET',
    '/linkx/admin/api/role',
    { code: 500, msg: 'Mock 刷新失败' },
    {
      matches: (url) => url.searchParams.get('name') === 'refresh-lock-probe',
      status: 503,
    },
  );
  await page
    .getByRole('region', { name: '检索条件' })
    .getByRole('textbox', { name: '角色名称' })
    .fill('refresh-lock-probe');
  await page.getByRole('button', { name: '搜索' }).click();
  await expect.poll(search.requestCount).toBe(1);
  await refresh.release();
  await expect(row.getByRole('button', { name: '设置用户' })).toBeDisabled();
  search.release();

  const refreshAlert = page.getByRole('alert').filter({ hasText: '写入已完成，但列表刷新失败' });
  await expect(refreshAlert).toBeVisible();
  await expect(row.getByRole('button', { name: '设置用户' })).toBeDisabled();
  await refreshAlert.getByRole('button', { name: '重新加载' }).click();
  await expect(refreshAlert).toHaveCount(0);
  await expect(row.getByRole('button', { name: '设置用户' })).toBeEnabled();
});

test('后台人员刷新被新搜索取消后行锁保持到当前列表返回', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions();
      if (path === '/auth/v1/user/page') return personListResponse();
      return undefined;
    },
  });
  await seedSession(page);

  const status = await holdRequest(page, '**/linkx/admin/auth/v1/user/person-10/status/1', 'PUT');
  const initialListResponse = waitForListResponse(page, '/linkx/admin/auth/v1/user/page');
  await page.goto('/authority/adminPerson');
  await initialListResponse;

  const refresh = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
    { allowAbort: true },
  );
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '后台人员' });
  const statusControl = row.locator('.el-switch');
  await statusControl.locator('.el-switch__core').click();
  await expect.poll(status.requestCount).toBe(1);
  status.release();
  await expect.poll(refresh.requestCount).toBe(1);

  const search = await holdRequest(
    page,
    '**/linkx/admin/auth/v1/user/page**',
    'GET',
    '/linkx/admin/auth/v1/user/page',
    personListResponse(),
    {
      allowAbort: true,
      matches: (url) => url.searchParams.get('name') === 'refresh-lock-probe',
    },
  );
  await page.getByPlaceholder('姓名').fill('refresh-lock-probe');
  await page.getByRole('button', { name: '搜索' }).click();
  await expect.poll(search.requestCount).toBe(1);
  await refresh.release();
  await expect(statusControl).toHaveClass(/is-disabled/);
  await expect(row.getByRole('button', { name: '设置角色' })).toBeDisabled();
  search.release();
  await expect(statusControl).not.toHaveClass(/is-disabled/);
  await expect(row.getByRole('button', { name: '设置角色' })).toBeEnabled();
});
