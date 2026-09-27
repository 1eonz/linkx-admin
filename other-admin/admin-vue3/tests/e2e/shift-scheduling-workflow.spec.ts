import { expect, test } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

const schedule = {
  id: 'schedule-1',
  userId: '1001',
  userName: '张三',
  departmentName: '一线中队',
  postName: '值班岗',
  dutyType: '0',
  dutyTypeName: '白班',
  dutyStartDate: '2026-01-01',
  dutyStartTime: '08:00:00',
  dutyEndDate: '2026-01-01',
  dutyEndTime: '20:00:00',
  dutyContent: '日常值守',
  gmtCreated: '2026-01-01 08:00:00',
};

test('排班类型 CRUD 保留内置类型并在删除失败后恢复重试', async ({ page }) => {
  let dutyTypes: Array<{ type: string | number; name: string; gmtCreated: string }> = [
    { type: 0, name: '白班', gmtCreated: '2026-01-01 08:00:00' },
    { type: 1, name: '夜班', gmtCreated: '2026-01-01 08:00:00' },
  ];
  let shouldFailDelete = true;
  const writes: Array<{ method: string; path: string; body?: unknown }> = [];

  await mockBackend(page, {
    handler: (path, request) => {
      const method = request.method();
      if (path === '/collaboration/v1/duty/type/page' && method === 'GET') {
        return ok({ records: dutyTypes, total: dutyTypes.length });
      }
      if (path === '/collaboration/v1/duty/type' && method === 'POST') {
        const body = request.postDataJSON() as { name: string };
        writes.push({ method, path, body });
        dutyTypes = [...dutyTypes, { type: '2', name: body.name, gmtCreated: '2026-09-26 10:00:00' }];
        return ok('2');
      }
      if (path === '/collaboration/v1/duty/type/2' && method === 'PUT') {
        const body = request.postDataJSON() as { name: string };
        writes.push({ method, path, body });
        dutyTypes = dutyTypes.map((item) => (String(item.type) === '2' ? { ...item, name: body.name } : item));
        return ok('2');
      }
      if (path === '/collaboration/v1/duty/type/2' && method === 'DELETE') {
        writes.push({ method, path });
        if (shouldFailDelete) return { code: 500, msg: 'Mock 删除失败', data: null };
        dutyTypes = dutyTypes.filter((item) => String(item.type) !== '2');
        return ok();
      }
      return undefined;
    },
  });

  await page.route('**/linkx/admin/collaboration/v1/duty/type/2', async (route) => {
    if (route.request().method() === 'DELETE' && shouldFailDelete) {
      writes.push({ method: 'DELETE', path: '/collaboration/v1/duty/type/2' });
      await route.fulfill({ status: 500, json: { code: 500, msg: 'Mock 删除失败', data: null } });
      return;
    }
    await route.fallback();
  });

  await seedSession(page);
  await page.goto('/scheduling/dutyType');

  const builtInRow = page.getByRole('row', { name: /白班/ });
  await expect(builtInRow.getByRole('button', { name: '删除' })).toHaveCount(0);
  await expect(builtInRow.getByRole('button', { name: '编辑' })).toBeVisible();

  await page.getByRole('button', { name: '新增', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入排班类型名称').fill('临时值班');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '创建成功' }).last()).toBeVisible();
  await expect(page.getByRole('row', { name: /临时值班/ })).toBeVisible();

  let createdRow = page.getByRole('row', { name: /临时值班/ });
  await createdRow.getByRole('button', { name: '编辑' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('请输入排班类型名称').fill('夜间支援');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '更新成功' }).last()).toBeVisible();
  createdRow = page.getByRole('row', { name: /夜间支援/ });
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确定删除', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Mock 删除失败' }).last()).toBeVisible();
  await expect(createdRow.getByRole('button', { name: '删除' })).toBeEnabled();

  shouldFailDelete = false;
  await createdRow.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确定删除', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '删除成功' }).last()).toBeVisible();
  await expect(page.getByRole('row', { name: /夜间支援/ })).toHaveCount(0);

  expect(writes).toEqual([
    { method: 'POST', path: '/collaboration/v1/duty/type', body: { name: '临时值班' } },
    { method: 'PUT', path: '/collaboration/v1/duty/type/2', body: { name: '夜间支援' } },
    { method: 'DELETE', path: '/collaboration/v1/duty/type/2' },
    { method: 'DELETE', path: '/collaboration/v1/duty/type/2' },
  ]);
});

test('值班信息按条件查询并支持日历月份切换', async ({ page }) => {
  const pageQueries: Array<Record<string, string>> = [];
  const calendarMonths: string[] = [];
  let failFirstCalendarRequest = true;
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/duty/type/page') {
        return ok({ records: [{ type: 0, name: '白班' }], total: 1 });
      }
      if (path === '/collaboration/v1/duty/schedule/page') {
        pageQueries.push(Object.fromEntries(new URL(request.url()).searchParams.entries()));
        return ok({ records: [schedule], total: 1 });
      }
      if (path === '/collaboration/v1/duty/schedule/calendar') {
        const month = new URL(request.url()).searchParams.get('month') ?? '';
        calendarMonths.push(month);
        if (failFirstCalendarRequest) {
          failFirstCalendarRequest = false;
          return { code: 500, msg: 'Mock 日历查询失败', data: null };
        }
        return ok({ [`${month}-01`]: [schedule] });
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/scheduling/dutyInformation');
  await expect.poll(() => pageQueries.length).toBeGreaterThan(0);
  const row = page.getByRole('row', { name: /张三/ });
  await expect(row).toBeVisible();

  await page.getByPlaceholder('人员ID').fill('1001');
  await page.getByPlaceholder('姓名').fill('张三');
  await page.locator('.filter-container .el-select').click();
  await page.getByRole('option', { name: '白班(0)' }).click();
  await expect.poll(() => pageQueries.at(-1)?.userId).toBe('1001');
  expect(pageQueries.at(-1)?.userName).toBe('张三');
  expect(pageQueries.at(-1)?.dutyType).toBe('0');
  expect(pageQueries.at(-1)?.pageNum).toBe('1');
  expect(pageQueries.at(-1)?.pageSize).toBe('10');

  await page.locator('.view-switcher .el-radio-button').filter({ hasText: '日历查看' }).click();
  await expect.poll(() => calendarMonths.at(-1)).toMatch(/^\d{4}-\d{2}$/);
  await expect(page.locator('.el-message--error')).toContainText('Mock 日历查询失败');
  const currentMonth = calendarMonths.at(-1);
  const nextMonthButton = page.getByRole('button', { name: '下一月' });
  await nextMonthButton.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => calendarMonths.at(-1)).not.toBe(currentMonth);
  await expect(page.locator('.month-text')).toContainText(calendarMonths.at(-1)!.slice(0, 4));
  await expect(page.locator('.duty-calendar')).toContainText('张三');
});

test('值班信息导入显示纯文本错误并可下载模板', async ({ page }) => {
  let importContentType = '';
  let templateRequested = false;
  let scheduleRows = [schedule];
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/duty/type/page') {
        return ok({ records: [{ type: 0, name: '白班' }], total: 1 });
      }
      if (path === '/collaboration/v1/duty/schedule/page') {
        return ok({ records: scheduleRows, total: scheduleRows.length });
      }
      if (path === '/collaboration/v1/duty/schedule/import') {
        importContentType = request.headers()['content-type'] ?? '';
        const imported = { ...schedule, id: 'schedule-imported', userName: '导入记录' };
        scheduleRows = [...scheduleRows, imported];
        return ok({
          errorMap: { '2': ['人员名称 <img src=x onerror=alert(1)>'] },
          successList: [imported],
        });
      }
      return undefined;
    },
  });
  await page.route('**/linkx/admin/collaboration/v1/duty/schedule/template', async (route) => {
    templateRequested = true;
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent('值班模板.xlsx')}`,
      },
      body: Buffer.from('mock-template'),
    });
  });

  await seedSession(page);
  await page.goto('/scheduling/dutyInformation');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'duty-import.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('mock-import'),
  });

  const importDialog = page.getByRole('dialog', { name: '导入失败' });
  await expect(importDialog).toContainText('第2行人员名称 <img src=x onerror=alert(1)>');
  await expect(importDialog.locator('img')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '导入记录' })).toBeVisible();
  expect(importContentType).toContain('multipart/form-data');
  await importDialog.getByRole('button').last().click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '模板下载' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('值班模板.xlsx');
  expect(templateRequested).toBe(true);
});

test('值班信息批量删除失败保留数据并允许重试', async ({ page }) => {
  let rows = [schedule];
  let shouldFailDelete = true;
  const deletePayloads: unknown[] = [];
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/duty/type/page') {
        return ok({ records: [{ type: 0, name: '白班' }], total: 1 });
      }
      if (path === '/collaboration/v1/duty/schedule/page') {
        return ok({ records: rows, total: rows.length });
      }
      if (path === '/collaboration/v1/duty/schedule/deleteBatch') {
        deletePayloads.push(request.postDataJSON());
        if (shouldFailDelete) return { code: 500, msg: 'Mock 批量删除失败', data: null };
        rows = [];
        return ok();
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/scheduling/dutyInformation');
  const row = page.getByRole('row', { name: /张三/ });
  await expect(row).toBeVisible();
  await row.locator('.el-checkbox__input').click();
  await page.getByRole('button', { name: /Batch Remove|批量删除/ }).click();
  await page.getByRole('button', { name: /Confirm|确定/ }).click();
  await expect(page.locator('.el-message--error')).toContainText('Mock 批量删除失败');
  await expect(row).toBeVisible();

  shouldFailDelete = false;
  await page.getByRole('button', { name: /Batch Remove|批量删除/ }).click();
  await page.getByRole('button', { name: /Confirm|确定/ }).click();
  await expect(page.locator('.el-message--success')).toContainText('批量删除成功');
  await expect(page.getByRole('row', { name: /张三/ })).toHaveCount(0);
  expect(deletePayloads).toEqual([['schedule-1'], ['schedule-1']]);
});
