import { expect, test } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

const collaborationPost = {
  id: 'post-1',
  postName: '夜间保障岗',
  iconUrl: '',
  type: 0,
  policeTicketTypes: [{ id: 'ticket-1', tag: '设备故障' }],
  orgName: '一线中队',
  relatedUserNames: '李四',
  relatedUserIds: 'person-id',
  operatorName: '管理员',
  operationType: 0,
  source: 0,
  updateTime: '2026-09-26 08:00:00',
};

const onDutyUser = {
  id: 'person-id',
  userId: 'user-1001',
  name: '李四',
  idCard: '330100198801010011',
  departmentName: '一线中队',
  departmentCode: '330100',
};

test('协同岗最后一人在岗确认、下岗失败重试并提交旧版请求体', async ({ page }) => {
  let isOnDuty = true;
  let failFirstOffDuty = true;
  let listRequests = 0;
  let onDutyReads = 0;
  const lastNumberUserIds: string[] = [];
  const offDutyPayloads: unknown[] = [];

  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/globals/list') {
        return ok([{ id: 'show-331', name: 'SHOW_331_FEATURE', value: 'false' }]);
      }
      if (path === '/collaboration/v1/post/page') {
        listRequests += 1;
        return ok({ records: [collaborationPost], total: 1 });
      }
      if (path === '/collaboration/v1/attendance/getOnline') {
        onDutyReads += 1;
        return ok(isOnDuty ? [onDutyUser] : []);
      }
      if (path === '/collaboration/v1/attendance/getLastNum') {
        lastNumberUserIds.push(new URL(request.url()).searchParams.get('userId') ?? '');
        return ok({ lastPeopleNum: 1 });
      }
      if (path === '/collaboration/v1/attendance/admin/offline') {
        offDutyPayloads.push(request.postDataJSON());
        if (failFirstOffDuty) {
          failFirstOffDuty = false;
          return { code: 500, msg: 'Mock 下岗失败', data: null };
        }
        isOnDuty = false;
        return ok();
      }
      return undefined;
    },
  });

  await seedSession(page);
  await page.goto('/collaboration/index');

  const postRow = page.getByRole('row', { name: /夜间保障岗/ });
  await expect(postRow).toBeVisible();
  await postRow.getByRole('button', { name: /Off Duty|下岗/i }).click();

  const dialog = page.getByRole('dialog', { name: /On-duty Users|在岗人员列表/ });
  await expect(dialog).toContainText('李四');
  const offDutyButton = dialog.getByRole('button', { name: /Off Duty|下岗/i });

  await offDutyButton.click();
  await expect(page.getByText(/last on-duty user|最后一个支撑人员/i)).toBeVisible();
  await page.getByRole('button', { name: /Confirm|确定/ }).click();
  await expect(page.locator('.el-message--error')).toContainText('Mock 下岗失败');
  await expect(dialog).toContainText('李四');

  await offDutyButton.click();
  await expect(page.getByText(/last on-duty user|最后一个支撑人员/i)).toBeVisible();
  await page.getByRole('button', { name: /Confirm|确定/ }).click();
  await expect(page.locator('.el-message--success')).toContainText(/Off-duty succeeded|下岗成功/i);
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => listRequests).toBeGreaterThanOrEqual(2);

  expect(lastNumberUserIds).toEqual(['person-id', 'person-id']);
  expect(offDutyPayloads).toEqual([
    {
      userId: 'person-id',
      userName: '李四',
      postId: 'post-1',
      postName: '夜间保障岗',
      switchType: 3,
    },
    {
      userId: 'person-id',
      userName: '李四',
      postId: 'post-1',
      postName: '夜间保障岗',
      switchType: 3,
    },
  ]);
  expect(onDutyReads).toBe(3);
});
