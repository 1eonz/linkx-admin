import { expect, test } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

const collaborationPost = {
  id: 'post-search-race',
  postName: '人员搜索竞态测试岗',
  iconUrl: '',
  type: 0,
  policeTicketTypes: [],
  orgId: 'org-1',
  orgName: '一线中队',
  orgCode: '330100',
  relatedUserNames: '',
  relatedUserIds: '',
  operatorName: '管理员',
  operationType: 0,
  source: 0,
  updateTime: '2026-09-29 08:00:00',
};

test('关联人员远程搜索忽略迟到关键词并沿用关键词加载下一页', async ({ page }) => {
  let releaseTicketTypeRequest!: () => void;
  const ticketTypeRequestGate = new Promise<void>((resolve) => {
    releaseTicketTypeRequest = resolve;
  });
  let releaseStaleRequest!: () => void;
  const staleRequestGate = new Promise<void>((resolve) => {
    releaseStaleRequest = resolve;
  });
  let releaseCurrentRequest!: () => void;
  const currentRequestGate = new Promise<void>((resolve) => {
    releaseCurrentRequest = resolve;
  });
  let staleRequestCount = 0;
  let currentPageOneRequestCount = 0;
  const requests: Array<{ keyword: string; pageNum: number }> = [];

  await mockBackend(page, {
    handler: (path) => {
      if (path === '/collaboration/v1/post/page') return ok({ records: [collaborationPost], total: 1 });
      return undefined;
    },
  });
  await page.route('**/linkx/admin/collaboration/v1/policetickettype/list*', async (route) => {
    await ticketTypeRequestGate;
    await route.fulfill({ json: ok([]) });
  });
  await page.route('**/linkx/admin/collaboration/v1/post/queryUserByPage*', async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get('name') ?? '';
    const pageNum = Number(url.searchParams.get('pageNum') ?? 1);
    requests.push({ keyword, pageNum });

    if (!keyword) {
      await route.fulfill({
        json: ok({
          records: [{ id: 'person-initial', name: '已有候选人员', isBinding: 1 }],
          total: 1,
          current: 1,
          size: 100,
        }),
      });
      return;
    }

    if (keyword === '过期关键词') {
      staleRequestCount += 1;
      await staleRequestGate;
      try {
        await route.fulfill({
          json: ok({ records: [{ id: 'person-stale', name: '过期关键词人员' }], total: 1, current: 1, size: 100 }),
        });
      } catch {
        // 请求已因新搜索取消时，浏览器会拒绝这次迟到的 Mock 响应。
      }
      return;
    }

    if (keyword === '最新关键词' && pageNum === 1) {
      currentPageOneRequestCount += 1;
      await currentRequestGate;
      await route.fulfill({
        json: ok({ records: [{ id: 'person-current-1', name: '最新关键词人员一' }], total: 2, current: 1, size: 100 }),
      });
      return;
    }

    if (keyword === '最新关键词' && pageNum === 2) {
      await route.fulfill({
        json: ok({ records: [{ id: 'person-current-2', name: '最新关键词人员二' }], total: 2, current: 2, size: 100 }),
      });
      return;
    }

    await route.fallback();
  });

  await seedSession(page);
  await page.goto('/collaboration/index');
  const row = page.getByRole('row', { name: /人员搜索竞态测试岗/ });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /Edit|修改/ }).click();

  const dialog = page.getByRole('dialog', { name: '修改' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.el-loading-mask')).toBeVisible();
  releaseTicketTypeRequest();
  await expect(dialog.locator('.el-loading-mask')).toBeHidden();
  await expect(page.getByPlaceholder('请选择归属组织')).toHaveValue('一线中队');

  const searchInput = dialog.getByRole('combobox', { name: '* 关联人员' });
  const select = dialog.locator('.el-form-item').filter({ hasText: '关联人员' }).locator('.el-select');
  await select.click();
  await expect(page.getByRole('option', { name: /已有候选人员.*已关联至其他协同岗/ })).toBeVisible();
  await searchInput.fill('过期关键词');
  await expect.poll(() => staleRequestCount).toBe(1);

  await searchInput.fill('最新关键词');
  await expect.poll(() => currentPageOneRequestCount).toBe(1);
  await expect(select).toHaveAttribute('aria-busy', 'true');
  releaseCurrentRequest();
  await expect(page.getByRole('option', { name: '最新关键词人员一' })).toBeVisible();
  await expect(select).toHaveAttribute('aria-busy', 'false');

  const scrollContainer = page.locator('.el-select-dropdown .el-scrollbar__wrap:visible').last();
  await expect(scrollContainer).toBeVisible();
  await scrollContainer.evaluate((element) => element.dispatchEvent(new Event('scroll')));
  await expect(page.getByRole('option', { name: '最新关键词人员二' })).toBeVisible();
  expect(requests.filter(({ keyword }) => keyword === '最新关键词')).toEqual([
    { keyword: '最新关键词', pageNum: 1 },
    { keyword: '最新关键词', pageNum: 2 },
  ]);

  releaseStaleRequest();
  await expect(page.getByRole('option', { name: '过期关键词人员' })).toHaveCount(0);
  await expect(page.getByRole('option', { name: '最新关键词人员一' })).toBeVisible();
  await expect(select).toHaveAttribute('aria-busy', 'false');
});

test('关闭并重开 ColForm 后忽略旧表单加载结果', async ({ page }) => {
  let releaseOldTypeRequest!: () => void;
  const oldTypeRequestGate = new Promise<void>((resolve) => {
    releaseOldTypeRequest = resolve;
  });
  let ticketTypeRequestCount = 0;

  await mockBackend(page, {
    handler: (path) => {
      if (path === '/collaboration/v1/post/page') {
        return ok({
          records: [
            collaborationPost,
            {
              ...collaborationPost,
              id: 'post-search-race-second',
              postName: '第二条测试岗',
              orgId: 'org-2',
              orgName: '二线中队',
              orgCode: '330200',
            },
          ],
          total: 2,
        });
      }
      if (path === '/collaboration/v1/post/queryUserByPage') {
        return ok({ records: [], total: 0, current: 1, size: 100 });
      }
      return undefined;
    },
  });
  await page.route('**/linkx/admin/collaboration/v1/policetickettype/list*', async (route) => {
    ticketTypeRequestCount += 1;
    if (ticketTypeRequestCount === 1) await oldTypeRequestGate;
    await route.fulfill({ json: ok([]) });
  });

  await seedSession(page);
  await page.goto('/collaboration/index');
  const firstRow = page.getByRole('row', { name: /人员搜索竞态测试岗/ });
  await expect(firstRow).toBeVisible();
  await firstRow.getByRole('button', { name: /Edit|修改/ }).click();

  const firstDialog = page.getByRole('dialog', { name: '修改' });
  await expect(firstDialog).toBeVisible();
  await expect(firstDialog.locator('.el-loading-mask')).toBeVisible();
  await firstDialog.getByRole('button', { name: '关闭此对话框' }).click();
  await expect(firstDialog).toBeHidden();

  const secondRow = page.getByRole('row', { name: /第二条测试岗/ });
  await expect(secondRow).toBeVisible();
  await secondRow.getByRole('button', { name: /Edit|修改/ }).click();
  const secondDialog = page.getByRole('dialog', { name: '修改' });
  await expect(secondDialog).toBeVisible();
  await expect(secondDialog.getByRole('textbox', { name: '* 协同岗名称' })).toHaveValue('第二条测试岗');
  await expect(page.getByPlaceholder('请选择归属组织')).toHaveValue('二线中队');

  releaseOldTypeRequest();
  await expect(secondDialog.getByRole('textbox', { name: '* 协同岗名称' })).toHaveValue('第二条测试岗');
  await expect(page.getByPlaceholder('请选择归属组织')).toHaveValue('二线中队');
});
