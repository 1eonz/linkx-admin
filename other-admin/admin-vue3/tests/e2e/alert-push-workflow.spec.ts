import { expect, test } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

interface WarningRecord {
  id: string;
  businessId: string;
  businessName: string;
  orgName: string;
  targetType: 1 | 2;
  targetId: string;
  targetName: string;
}

test('预警推送按标签查询、搜索重置，并在批量删除失败后恢复重试', async ({ page }) => {
  let taskOverdue: WarningRecord[] = [
    {
      id: 'warning-task-1',
      businessId: 'org-1',
      businessName: '第一支队',
      orgName: '市局',
      targetType: 1,
      targetId: 'user-1',
      targetName: '张三',
    },
    {
      id: 'warning-task-2',
      businessId: 'org-2',
      businessName: '第二支队',
      orgName: '市局',
      targetType: 2,
      targetId: 'group-1',
      targetName: '值班群',
    },
  ];
  const unattended: WarningRecord[] = [
    {
      id: 'warning-post-1',
      businessId: 'post-1',
      businessName: '夜间值守岗',
      orgName: '第一支队',
      targetType: 1,
      targetId: 'user-2',
      targetName: '李四',
    },
  ];
  let failNextDelete = true;
  const queries: URLSearchParams[] = [];
  const deletedIds: string[][] = [];

  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/warning/ralation/page' && request.method() === 'GET') {
        const params = new URL(request.url()).searchParams;
        queries.push(params);
        const classify = params.get('classify');
        const records = classify === '2' ? unattended : taskOverdue;
        const businessName = params.get('businessName')?.trim() ?? '';
        const targetName = params.get('targetName')?.trim() ?? '';
        const targetType = params.get('targetType');
        const filtered = records.filter((record) => {
          return (
            (!businessName || record.businessName.includes(businessName)) &&
            (!targetName || record.targetName.includes(targetName)) &&
            (!targetType || String(record.targetType) === targetType)
          );
        });
        return ok({ records: filtered, total: filtered.length });
      }

      if (path === '/api/warning/ralation/delete/list' && request.method() === 'DELETE') {
        const ids = request.postDataJSON() as string[];
        deletedIds.push(ids);
        if (failNextDelete) {
          failNextDelete = false;
          return { code: 500, msg: 'Mock 删除失败', data: null };
        }
        taskOverdue = taskOverdue.filter((record) => !ids.includes(record.id));
        return ok();
      }

      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/notification/alertPush');

  const taskTab = page.getByRole('tab', { name: '任务逾期' });
  const unattendedTab = page.getByRole('tab', { name: '无人值守' });
  await expect(taskTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('row', { name: /第一支队.*张三/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /第二支队.*值班群/ })).toBeVisible();

  const activePanel = page.getByRole('tabpanel', { name: '任务逾期' });
  await activePanel.getByPlaceholder('组织名称', { exact: true }).fill('第一');
  await activePanel.getByPlaceholder('预警通知对象', { exact: true }).fill('张三');
  await activePanel.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByRole('row', { name: /第一支队.*张三/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /第二支队/ })).toHaveCount(0);
  expect(queries.at(-1)?.get('classify')).toBe('1');
  expect(queries.at(-1)?.get('businessName')).toBe('第一');
  expect(queries.at(-1)?.get('targetName')).toBe('张三');

  await activePanel.getByRole('button', { name: '重置', exact: true }).click();
  await expect(page.getByRole('row', { name: /第二支队.*值班群/ })).toBeVisible();
  expect(queries.at(-1)?.get('businessName')).toBe('');
  expect(queries.at(-1)?.get('targetName')).toBe('');

  await unattendedTab.click();
  await expect(unattendedTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('row', { name: /夜间值守岗.*李四/ })).toBeVisible();
  expect(queries.at(-1)?.get('classify')).toBe('2');
  expect(queries.at(-1)?.get('pageNum')).toBe('1');

  await taskTab.click();
  const firstRow = page.getByRole('row', { name: /第一支队.*张三/ });
  await firstRow.locator('.el-checkbox__inner').click();
  await page.getByRole('button', { name: '批量删除', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Mock 删除失败' })).toBeVisible();
  await expect(page.getByRole('row', { name: /第一支队.*张三/ })).toBeVisible();
  expect(deletedIds).toEqual([['warning-task-1']]);

  await page.getByRole('button', { name: '批量删除', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '删除成功' })).toBeVisible();
  await expect(page.getByRole('row', { name: /第一支队.*张三/ })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /第二支队.*值班群/ })).toBeVisible();
  expect(deletedIds).toEqual([['warning-task-1'], ['warning-task-1']]);
});

test('无人值守新增在切换群组后查询并提交群组名称', async ({ page }) => {
  const groupQueries: URLSearchParams[] = [];
  const createPayloads: Record<string, unknown>[] = [];
  let unattended: WarningRecord[] = [];

  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/warning/ralation/page' && request.method() === 'GET') {
        return ok({ records: unattended, total: unattended.length });
      }
      if (path === '/collaboration/v1/post/page' && request.method() === 'GET') {
        return ok({
          records: [{ id: 'post-night', postName: '夜间值守岗', orgId: 'org-1', orgName: '第一支队' }],
          total: 1,
        });
      }
      if (path === '/collaboration/v1/im/query/group/type' && request.method() === 'GET') {
        groupQueries.push(new URL(request.url()).searchParams);
        return ok({ records: [{ groupId: 'group-emergency', groupName: '应急联动群' }], total: 1 });
      }
      if (path === '/collaboration/v1/im/queryUser' && request.method() === 'GET') {
        return ok({ records: [{ id: 'user-1', name: '张三' }], total: 1 });
      }
      if (path === '/api/warning/ralation/create' && request.method() === 'POST') {
        const payload = request.postDataJSON() as Record<string, unknown>;
        createPayloads.push(payload);
        const names = payload.targetNames as string[];
        unattended = [
          {
            id: 'warning-created',
            businessId: String(payload.businessId),
            businessName: String(payload.businessName),
            orgName: String(payload.orgName),
            targetType: 2,
            targetId: String(payload.targetIds),
            targetName: names.join(', '),
          },
        ];
        return ok('warning-created');
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/notification/alertPush');
  await page.getByRole('tab', { name: '无人值守' }).click();
  await page.getByRole('button', { name: '新增', exact: true }).click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('.el-form-item').filter({ hasText: '协同岗名称' }).locator('.el-select').click();
  await page.getByRole('option', { name: '夜间值守岗' }).click();
  await dialog.locator('.el-radio').filter({ hasText: '群组' }).click();
  const targetSelect = dialog.locator('.el-form-item').filter({ hasText: '预警通知对象' }).locator('.el-select');
  await targetSelect.click();
  await page.getByRole('option', { name: '应急联动群' }).click();
  await targetSelect.locator('input').press('Escape');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();

  await expect(page.getByRole('alert').filter({ hasText: '新增成功' })).toBeVisible();
  await expect(page.getByRole('row', { name: /夜间值守岗.*应急联动群/ })).toBeVisible();
  expect(groupQueries).toHaveLength(1);
  expect(groupQueries[0].get('type')).toBe('2');
  expect(groupQueries[0].get('key')).toBe('3');
  expect(createPayloads).toEqual([
    {
      classify: 2,
      businessId: 'post-night',
      businessName: '夜间值守岗',
      orgName: '第一支队',
      targetType: 2,
      targetIds: 'group-emergency',
      targetNames: ['应急联动群'],
      idCard: '',
    },
  ]);
});
