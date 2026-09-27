import { expect, test } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

test('GroupTags 列表和新增弹窗沿真实接口契约工作', async ({ page }) => {
  const requests = await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/tags/page') {
        return ok({
          records: [{ id: 'tag-1', name: '值班', icon: 'fas fa-user', color: '#409eff' }],
          total: 1,
        });
      }
      if (path === '/collaboration/v1/tags' && request.method() === 'POST') return ok(null);
      return undefined;
    },
  });
  await seedSession(page);
  await page.goto('/h5/GroupTags');
  await expect(page).toHaveURL(/\/h5\/GroupTags$/);
  await expect(page.getByText('值班', { exact: true })).toBeVisible();
  const tagRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '值班' });
  await expect(tagRow.locator('.el-table__cell').nth(2).locator('svg')).toBeVisible();

  await page.getByRole('button', { name: '新增', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input').first().fill('新标签');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();

  await expect
    .poll(() => requests.filter((request) => request.url().endsWith('/collaboration/v1/tags')).length)
    .toBe(1);
  expect(requests.find((request) => request.url().endsWith('/collaboration/v1/tags'))?.method()).toBe('POST');
});

test('GroupTags 查询失败可重试，批量删除沿用数组请求体', async ({ page }) => {
  let pageCalls = 0;
  const requests = await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/tags/page') {
        pageCalls += 1;
        if (pageCalls === 1) return { code: 500, msg: '标签服务暂不可用', data: null };
        return ok({
          records: [
            { id: 'tag-1', name: '值班', icon: 'fas fa-user', color: '#409eff' },
            { id: 'tag-2', name: '巡逻', icon: 'fas fa-car', color: '#67c23a' },
          ],
          total: 2,
        });
      }
      if (path === '/collaboration/v1/tags/delete/list' && request.method() === 'DELETE') return ok(null);
      return undefined;
    },
  });
  await seedSession(page);
  await page.goto('/h5/GroupTags');
  await expect(page.getByText('标签服务暂不可用', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByText('值班', { exact: true })).toBeVisible();

  const checkboxes = page.locator('.el-table__body-wrapper .el-checkbox__input');
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.getByRole('button', { name: '批量删除', exact: true }).click();
  await page.getByRole('button', { name: '确定', exact: true }).last().click();

  const batchDelete = requests.find((request) => request.url().endsWith('/collaboration/v1/tags/delete/list'));
  expect(batchDelete?.method()).toBe('DELETE');
  expect(batchDelete?.postDataJSON()).toEqual(['tag-1', 'tag-2']);
});

test('GroupTags 编辑和单条删除沿用详情与标签 ID 接口', async ({ page }) => {
  let tag = { id: 'tag-1', name: '值班', icon: 'fas fa-user', color: '#409eff' };
  let deleted = false;
  const requests = await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/tags/page') {
        return ok({ records: deleted ? [] : [tag], total: deleted ? 0 : 1 });
      }
      if (path === '/collaboration/v1/tags/tag-1') {
        if (request.method() === 'GET') return ok(tag);
        if (request.method() === 'PUT') {
          tag = request.postDataJSON() as typeof tag;
          return ok();
        }
        if (request.method() === 'DELETE') {
          deleted = true;
          return ok();
        }
      }
      return undefined;
    },
  });
  await seedSession(page);
  await page.goto('/h5/GroupTags');
  await expect(page.getByText('值班', { exact: true })).toBeVisible();

  let row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '值班' });
  await row.getByRole('button', { name: '编辑' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('input').first()).toHaveValue('值班');
  await dialog.locator('input').first().fill('标签编辑后');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByText('标签编辑后', { exact: true })).toBeVisible();

  row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '标签编辑后' });
  await row.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确定删除', exact: true }).click();
  await expect(page.getByText('标签编辑后', { exact: true })).toHaveCount(0);

  expect(
    requests.find((request) => request.url().endsWith('/collaboration/v1/tags/tag-1') && request.method() === 'GET'),
  ).toBeTruthy();
  expect(
    requests
      .find((request) => request.url().endsWith('/collaboration/v1/tags/tag-1') && request.method() === 'PUT')
      ?.postDataJSON(),
  ).toMatchObject({
    id: 'tag-1',
    name: '标签编辑后',
  });
  expect(
    requests.find((request) => request.url().endsWith('/collaboration/v1/tags/tag-1') && request.method() === 'DELETE'),
  ).toBeTruthy();
});

test('窄屏下标签表格和分页可在各自容器内横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockBackend(page, {
    handler: (path) => {
      if (path === '/collaboration/v1/tags/page') {
        return ok({
          records: [{ id: 'tag-1', name: '值班通知', icon: 'fas fa-bell', color: '#1570a6' }],
          total: 1,
        });
      }
      return undefined;
    },
  });
  await seedSession(page);
  await page.goto('/h5/GroupTags');

  const tableRegion = page.getByRole('region', { name: '标签列表，可横向滚动查看全部列' });
  await expect(tableRegion).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  await expect.poll(() => tableRegion.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await tableRegion.focus();
  await expect(tableRegion).toBeFocused();
  await tableRegion.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect(page.getByRole('button', { name: '编辑' })).toBeInViewport();

  const paginationRegion = page.getByRole('region', { name: '列表分页，可横向滚动查看全部控件' });
  await expect(paginationRegion).toBeVisible();
  await expect.poll(() => paginationRegion.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await paginationRegion.focus();
  await expect(paginationRegion).toBeFocused();
  await paginationRegion.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect(page.getByText('页', { exact: true }).last()).toBeInViewport();
});
