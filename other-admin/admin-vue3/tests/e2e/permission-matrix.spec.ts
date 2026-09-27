import { expect, test } from '@playwright/test';

import { menus, mockBackend, ok, seedSession } from './fixtures';

const allMenuIds = menus.flatMap((parent) => [parent.id, ...parent.children.map((child) => child.id)]);

function permissions(actions: string[]) {
  return ok({ type: 0, menus: allMenuIds, actions });
}

test('无角色操作权限时隐藏新增和行内操作', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions([]);
      if (path === '/api/role') {
        return ok({ records: [{ id: '10', name: '测试角色', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  await expect(page).toHaveURL(/authority\/role$/);
  await expect(page.locator('.search-bar__right')).not.toContainText('新增');
  const tableBody = page.locator('.el-table__body-wrapper');
  await expect(tableBody).toContainText('测试角色');
  await expect(tableBody).not.toContainText('编辑');
  await expect(tableBody).not.toContainText('删除');
});

test('角色操作权限恢复后显示新增和行内操作', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) {
        return permissions(['/admin/role/create', '/admin/role/update', '/admin/role/delete']);
      }
      if (path === '/api/role') {
        return ok({ records: [{ id: '10', name: '测试角色', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  await expect(page.locator('.search-bar__right')).toContainText('新增');
  const tableBody = page.locator('.el-table__body-wrapper');
  await expect(tableBody).toContainText('编辑');
  await expect(tableBody).toContainText('删除');
  await expect(tableBody).toContainText('禁用');
});

test('角色 ID 2 和 6 保留编辑但禁止删除和状态操作', async ({ page }) => {
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) {
        return permissions(['/admin/role/update', '/admin/role/delete']);
      }
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({
          records: [
            { id: '2', name: '系统内置角色二', status: 0 },
            { id: '6', name: '系统内置角色六', status: 0 },
            { id: '10', name: '业务角色', status: 0 },
          ],
          total: 3,
        });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  const tableBody = page.locator('.el-table__body-wrapper');
  for (const roleName of ['系统内置角色二', '系统内置角色六']) {
    const row = tableBody.locator('.el-table__row').filter({ hasText: roleName });
    await expect(row.getByRole('button', { name: '编辑' })).toBeVisible();
    await expect(row.getByRole('button', { name: '删除' })).toHaveCount(0);
    await expect(row.getByRole('button', { name: '禁用' })).toHaveCount(0);
  }
  const ordinaryRow = tableBody.locator('.el-table__row').filter({ hasText: '业务角色' });
  await expect(ordinaryRow.getByRole('button', { name: '删除' })).toBeVisible();
  await expect(ordinaryRow.getByRole('button', { name: '禁用' })).toBeVisible();
});

test('人员角色绑定和通用管理员操作按 Vue2 权限码与角色例外显示', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) {
        return permissions([
          '/admin/executor/create',
          '/admin/executor/delete',
          '/admin/executor/update',
          '/admin/trUserRole/createMany',
          '/admin/user/updatePwd',
          '/admin/user/delete',
        ]);
      }
      if (path === '/auth/v1/user/page') {
        return ok({
          records: [
            {
              id: 'person-admin',
              name: '通用管理员',
              idCard: 'admin-001',
              status: 0,
              role: { id: '2', name: '管理员' },
            },
            { id: 'person-user', name: '普通成员', idCard: 'user-001', status: 0, role: { id: '7', name: '业务人员' } },
            {
              id: 'person-disabled',
              name: '停用管理员',
              idCard: 'admin-002',
              status: 1,
              role: { id: 2, name: '管理员' },
            },
          ],
          total: 3,
        });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/person');
  const table = page.locator('.el-table__body-wrapper');
  await expect(table).toContainText('通用管理员');
  await expect(page.locator('.search-bar__right')).toContainText(/新增|Add/);
  await expect(page.locator('.search-bar__right')).toContainText(/批量编辑|Batch Edit/);
  await expect(page.locator('.search-bar__right')).toContainText(/批量删除|Batch Remove/);

  const adminRow = table.locator('.el-table__row').filter({ hasText: '通用管理员' });
  await expect(adminRow.getByRole('button', { name: /设置角色|Set Role/ })).toBeVisible();
  await expect(adminRow.getByRole('button', { name: /重置.*密码|ResetPassword/i })).toBeVisible();
  await expect(adminRow.getByRole('button', { name: /禁用|Disabled/ })).toBeVisible();
  await expect(adminRow.getByRole('button', { name: /删除|Delete/ })).toBeVisible();

  const userRow = table.locator('.el-table__row').filter({ hasText: '普通成员' });
  await expect(userRow.getByRole('button', { name: /设置角色|Set Role/ })).toBeVisible();
  await expect(userRow.getByRole('button', { name: /重置.*密码|ResetPassword/i })).toHaveCount(0);
  await expect(userRow.getByRole('button', { name: /禁用|Disabled/ })).toHaveCount(0);
  await expect(userRow.getByRole('button', { name: /删除|Delete/ })).toBeVisible();

  const disabledAdminRow = table.locator('.el-table__row').filter({ hasText: '停用管理员' });
  await expect(disabledAdminRow.getByRole('button', { name: /启用|Enable/ })).toBeVisible();
  await expect(disabledAdminRow.getByRole('button', { name: /删除|Delete/ })).toHaveCount(0);
});

test('角色权限树部分加载失败时阻止保存并支持完整重试', async ({ page }) => {
  let menuTreeRequests = 0;
  let roleUpdates = 0;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) {
        return permissions(['/admin/role/create', '/admin/role/update', '/admin/role/delete']);
      }
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: '10', name: '测试角色', status: 0 }], total: 1 });
      }
      if (path === '/api/menu/list') {
        menuTreeRequests += 1;
        if (menuTreeRequests === 1) return ok(menus);
        if (menuTreeRequests === 3) return { code: 503, msg: '菜单 Mock 暂时失败', data: null };
        return ok([{ id: 'permission-node', name: '可选权限节点', status: 0 }]);
      }
      if (path === '/api/role' && request.method() === 'PUT') {
        roleUpdates += 1;
        return ok(null);
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '测试角色' });
  await expect(roleRow).toContainText('测试角色');
  await expect(roleRow).toContainText('编辑');
  await roleRow.getByRole('button', { name: '编辑' }).click();

  const dialog = page.getByRole('dialog');
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await expect(dialog.getByRole('alert')).toContainText('角色权限树加载失败');
  await expect(saveButton).toBeDisabled();
  await saveButton.click({ force: true });
  expect(roleUpdates).toBe(0);
  expect(menuTreeRequests).toBe(4);

  await dialog.getByRole('button', { name: '重试' }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.locator('.client-tree')).toContainText('可选权限节点');
  await expect(saveButton).toBeEnabled();
  expect(menuTreeRequests).toBe(7);

  await saveButton.click();
  await expect(dialog).toHaveCount(0);
  expect(roleUpdates).toBe(1);
});

test('数据权限部门树初始加载失败时阻止保存并支持重试', async ({ page }) => {
  let departmentRequests = 0;
  let roleUpdates = 0;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions(['/admin/role/create', '/admin/role/update']);
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: '10', name: '测试角色', status: 0 }], total: 1 });
      }
      if (path === '/collaboration/v1/post/queryDepartment') {
        departmentRequests += 1;
        if (departmentRequests === 1) return { code: 503, msg: '部门 Mock 暂时失败', data: null };
        return ok([{ id: 'dept-001', code: '330100', name: '市局指挥中心', hasChildren: false }]);
      }
      if (path === '/api/role' && request.method() === 'PUT') {
        roleUpdates += 1;
        return ok(null);
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '测试角色' });
  await roleRow.getByRole('button', { name: '编辑' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: '数据权限' }).click();
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await expect(dialog.getByRole('alert')).toContainText('部门树加载失败');
  await expect(saveButton).toBeDisabled();
  await saveButton.click({ force: true });
  expect(roleUpdates).toBe(0);

  await dialog.getByRole('button', { name: '重试' }).click();
  await expect(dialog.locator('.data-permission-tree .el-tree')).toContainText('市局指挥中心');
  await expect(saveButton).toBeEnabled();
  expect(departmentRequests).toBe(2);

  await saveButton.click();
  await expect(dialog).toHaveCount(0);
  expect(roleUpdates).toBe(1);
});

test('数据权限懒加载部门失败时显示节点重试并阻止保存', async ({ page }) => {
  let childRequests = 0;
  let roleUpdates = 0;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions(['/admin/role/create', '/admin/role/update']);
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: '10', name: '测试角色', status: 0 }], total: 1 });
      }
      if (path === '/collaboration/v1/post/queryDepartment') {
        const parentCode = new URL(request.url()).searchParams.get('parentCode');
        if (!parentCode) return ok([{ id: 'dept-001', code: '330100', name: '市局指挥中心' }]);
        childRequests += 1;
        if (childRequests === 1) return { code: 503, msg: '部门子级 Mock 暂时失败', data: null };
        return ok([{ id: 'dept-002', code: '330101', name: '一线指挥部', hasChildren: false }]);
      }
      if (path === '/api/role' && request.method() === 'PUT') {
        roleUpdates += 1;
        return ok(null);
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  const roleRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '测试角色' });
  await roleRow.getByRole('button', { name: '编辑' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: '数据权限' }).click();
  const tree = dialog.locator('.data-permission-tree .el-tree');
  await expect(tree).toContainText('市局指挥中心');
  const department = tree.locator('.el-tree-node').filter({ hasText: '市局指挥中心' }).first();
  await department.locator('.el-tree-node__expand-icon').click();
  await expect(department.getByRole('alert')).toContainText('部门加载失败');

  const saveButton = dialog.getByRole('button', { name: '保存' });
  await expect(saveButton).toBeDisabled();
  await saveButton.click({ force: true });
  expect(roleUpdates).toBe(0);

  await department.getByRole('button', { name: '重试' }).click();
  await expect(tree).toContainText('一线指挥部');
  await expect(saveButton).toBeEnabled();
  expect(childRequests).toBe(2);

  await saveButton.click();
  await expect(dialog).toHaveCount(0);
  expect(roleUpdates).toBe(1);
});

test('管理员用户编辑复用部门树失败门禁并在重试后提交', async ({ page }) => {
  let departmentRequests = 0;
  let userUpdates = 0;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions(['/admin/user/update']);
      if (path === '/auth/v1/user/adminuser/page') {
        return ok({ records: [{ id: 'admin-user-1', idCard: 'operator-1', status: 0 }], total: 1 });
      }
      if (path === '/auth/v1/user/adminuser/admin-user-1' && request.method() === 'GET') {
        return ok({ id: 'admin-user-1', idCard: 'operator-1', orgIds: ['dept-001'] });
      }
      if (path === '/collaboration/v1/post/queryDepartment') {
        departmentRequests += 1;
        if (departmentRequests === 1) return { code: 503, msg: '部门 Mock 暂时失败', data: null };
        return ok([{ id: 'dept-001', code: '330100', name: '市局指挥中心', hasChildren: false }]);
      }
      if (path === '/auth/v1/user/adminuser' && request.method() === 'PUT') {
        userUpdates += 1;
        return ok(null);
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/userManage');
  const userRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'operator-1' });
  await userRow.getByRole('button', { name: '编辑' }).click();

  const dialog = page.getByRole('dialog');
  const confirmButton = dialog.getByRole('button', { name: '确定' });
  await expect(dialog.getByRole('alert')).toContainText('部门树加载失败');
  await expect(confirmButton).toBeDisabled();
  await confirmButton.click({ force: true });
  expect(userUpdates).toBe(0);

  await dialog.getByRole('button', { name: '重试' }).click();
  await expect(dialog.locator('.data-permission-tree .el-tree')).toContainText('市局指挥中心');
  await expect(confirmButton).toBeEnabled();
  expect(departmentRequests).toBe(2);

  await confirmButton.click();
  await expect(dialog).toHaveCount(0);
  expect(userUpdates).toBe(1);
});

test('非首个管理员用户即使拥有全量菜单也不能直达管理员账号管理', async ({ page }) => {
  let userListRequests = 0;
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions([]);
      if (path === '/auth/v1/user/adminuser/page') {
        userListRequests += 1;
        return ok({ records: [{ id: 'admin-user-1', idCard: '不应加载的账号', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);
  await page.addInitScript(() => localStorage.setItem('back_user_id', '2'));

  await page.goto('/authority/userManage');
  await expect(page).not.toHaveURL(/authority\/userManage$/);
  await expect(page.locator('.app-main')).not.toContainText('不应加载的账号');
  expect(userListRequests).toBe(0);
});

test('后台用户没有更新权限时状态开关不可操作', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) return permissions([]);
      if (path === '/auth/v1/user/page') {
        return ok({ records: [{ id: 'user-1', name: '后台账号', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/adminPerson');
  await expect(page).toHaveURL(/authority\/adminPerson$/);
  await expect(page.locator('.el-table__body-wrapper')).toContainText('后台账号');
  await expect(page.locator('.status-switch')).toHaveCount(0);
  await expect(page.locator('.el-table__body-wrapper .status-tag')).toContainText('正常');
});

test('停用菜单即使权限 ID 仍存在也不能注册页面路由', async ({ page }) => {
  const disabledMenus = JSON.parse(JSON.stringify(menus)) as typeof menus;
  const authority = disabledMenus.find((item) => item.url === '/authority');
  authority?.children.forEach((child) => {
    if (child.url === '/authority/role') child.status = 0;
  });

  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/menu/list') return ok(disabledMenus);
      if (path.endsWith('/oauth/v2/permissions')) return permissions(allMenuIds);
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/authority/role');
  await expect(page).not.toHaveURL(/authority\/role$/);
  await expect(page.locator('.sidebar-container')).not.toContainText('角色管理');
});

test('空菜单账号不能显示受保护入口或通过直接地址进入', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/oauth/v2/permissions')) return ok({ type: 1, menus: [], actions: [] });
      return undefined;
    },
  });
  await seedSession(page, false);

  await page.goto('/authority/role');
  await expect(page).not.toHaveURL(/authority\/role$/);
  await expect(page.locator('.sidebar-wrapper .el-sub-menu')).toHaveCount(0);
  await expect(page.locator('.app-main')).not.toContainText('角色管理');
});

test('群组协同 License 受限时隐藏归档和位置菜单并拦截直接地址', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path.endsWith('/api/msip/license/info')) {
        return ok({ status: 1, LINKXBS: '1', LINKXGCF: '0' });
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/h5/GroupTags');
  await expect(page.locator('.sidebar-container')).not.toContainText('已归档群组管理');
  await expect(page.locator('.sidebar-container')).not.toContainText('位置信息');

  await page.goto('/policeExtend/ArchivedTable');
  await expect(page).not.toHaveURL(/policeExtend\/ArchivedTable$/);
  await expect(page.locator('.app-main')).not.toContainText('市局应急联动群');

  await page.goto('/location/location');
  await expect(page).not.toHaveURL(/location\/location$/);
  await expect(page.locator('.app-main')).not.toContainText('市局指挥中心');
});

test('排班全局开关关闭时隐藏排班信息并拦截直接地址', async ({ page }) => {
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/api/globals/list') {
        return ok([{ id: 'preview-duty-switch', name: 'DUTY_SCHEDULE_ENABLE', value: '0' }]);
      }
      return undefined;
    },
  });
  await seedSession(page);

  await page.goto('/scheduling/dutyType');
  const schedulingMenu = page.locator('.sidebar-container .el-sub-menu').filter({ hasText: '排班管理' });
  await schedulingMenu.locator('.el-sub-menu__title').hover();
  await expect(page.getByRole('menuitem', { name: '排班类型管理', exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '排班信息', exact: true })).toHaveCount(0);

  await page.goto('/scheduling/dutyInformation');
  await expect(page).not.toHaveURL(/scheduling\/dutyInformation$/);
  await expect(page.locator('.app-main')).not.toContainText('夜间联动值守');
});
