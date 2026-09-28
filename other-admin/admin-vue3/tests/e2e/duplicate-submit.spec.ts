import { expect, test, type Page } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

async function holdRequest(
  page: Page,
  url: string,
  method: string,
  response: { status?: number; data?: unknown } = {},
) {
  let release!: () => void;
  let requestCount = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback();
    requestCount += 1;
    await pending;
    await route.fulfill({ status: response.status, json: response.data ?? ok() });
  });

  return { release: () => release(), requestCount: () => requestCount };
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string): number => {
    const channels = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!channels || channels.length !== 3) throw new Error(`无法解析颜色：${color}`);
    return channels
      .map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('角色删除在确认框和请求期间锁定当前行并在请求结束后恢复', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) =>
      path === '/api/role' && request.method() === 'GET'
        ? ok({ records: [{ id: 'role-10', name: '业务角色', status: 0 }], total: 1 })
        : undefined,
  });
  await seedSession(page);
  const deletion = await holdRequest(page, '**/linkx/admin/api/role/deleteBatch', 'POST');

  await page.goto('/authority/role');
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '业务角色' });
  const deleteButton = row.getByRole('button', { name: '删除' });
  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
  await expect(deleteButton).not.toHaveClass(/is-loading/);
  await page.locator('.el-message-box').getByRole('button', { name: '取消' }).click();
  await expect(deleteButton).toBeEnabled();
  expect(deletion.requestCount()).toBe(0);

  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
  await expect(deleteButton).not.toHaveClass(/is-loading/);
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(deletion.requestCount).toBe(1);
  await expect(deleteButton).toHaveClass(/is-loading/);
  await expect(deleteButton).toHaveClass(/is-loading/);
  await expect(deleteButton).toHaveAttribute('aria-busy', 'true');
  await deleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);

  deletion.release();
  await expect(deleteButton).toBeEnabled();
});

test('角色状态和保存请求期间均阻止重复提交', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/api/role' && request.method() === 'GET') {
        return ok({ records: [{ id: 'role-10', name: '业务角色', status: 0 }], total: 1 });
      }
      return undefined;
    },
  });
  await seedSession(page);
  const update = await holdRequest(page, '**/linkx/admin/api/role', 'PUT');
  const create = await holdRequest(page, '**/linkx/admin/api/role', 'POST');

  await page.goto('/authority/role');
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: '业务角色' });
  const statusButton = row.getByRole('button', { name: '禁用' });
  await statusButton.click();
  await expect.poll(update.requestCount).toBe(1);
  await expect(statusButton).toBeDisabled();
  await expect(statusButton).toHaveClass(/is-loading/);
  await expect(statusButton).toHaveAttribute('aria-busy', 'true');
  await statusButton.click({ force: true });
  expect(update.requestCount()).toBe(1);
  update.release();
  await expect(statusButton).toBeEnabled();

  await page.getByRole('button', { name: '新增' }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: '新增角色' });
  await dialog.getByPlaceholder('请输入角色名称').fill('重复提交校验角色');
  const saveButton = dialog.getByRole('button', { name: '保存' });
  await saveButton.click();
  await expect.poll(create.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(create.requestCount()).toBe(1);
  create.release();
  await expect(dialog).toBeHidden();
});

test('第三方应用删除和编辑保存期间锁定对应操作', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) => {
      if (path === '/collaboration/v1/client/list' && request.method() === 'POST') {
        return ok({
          records: [
            {
              id: 'client-10',
              clientName: 'Mock 接入应用',
              clientId: 'mockClient10',
              clientSecret: 'mockSecret10',
              tokenTime: 24,
              refreshTokenTime: 7,
              status: 1,
              remark: '',
            },
            {
              id: 'client-20',
              clientName: 'Mock 停用应用',
              clientId: 'mockClient20',
              clientSecret: 'mockSecret20',
              tokenTime: 24,
              refreshTokenTime: 7,
              status: 0,
              remark: '',
            },
          ],
          totalCount: 2,
        });
      }
      return undefined;
    },
  });
  await seedSession(page);
  const deletion = await holdRequest(page, '**/linkx/admin/collaboration/v1/client/delete?id=*', 'DELETE');
  const update = await holdRequest(page, '**/linkx/admin/collaboration/v1/client/update', 'PUT');

  await page.goto('/baseData/thirdParty');
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'Mock 接入应用' });
  const deleteButton = row.getByRole('button', { name: '删除' });
  const editButton = row.getByRole('button', { name: '修改' });
  await expect(row).toContainText('Mock 接入应用');
  await expect(page.locator('.el-loading-mask')).toBeHidden();
  const actionStyles = await row.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const cell = button.closest('td');
      return {
        label: button.innerText.trim(),
        color: getComputedStyle(button).color,
        background: cell ? getComputedStyle(cell).backgroundColor : 'rgb(255, 255, 255)',
      };
    }),
  );
  expect(actionStyles.map(({ label }) => label)).toEqual(['详情', '修改', '删除']);
  actionStyles.forEach(({ color, background }) => {
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
  });
  const statusTags = page.locator('.el-table__body-wrapper .el-table__row .el-tag');
  await expect(statusTags).toHaveCount(2);
  const statusStyles = await statusTags.evaluateAll((tags) =>
    tags.map((tag) => ({
      label: tag.textContent?.trim(),
      color: getComputedStyle(tag).color,
      background: getComputedStyle(tag).backgroundColor,
    })),
  );
  expect(statusStyles.map(({ label }) => label)).toEqual(['启用', '停用']);
  statusStyles.forEach(({ color, background }) => {
    expect(contrastRatio(color, background), `状态标签 ${color} / ${background}`).toBeGreaterThanOrEqual(4.5);
  });
  await page.screenshot({
    path: '../../.impeccable/critique/duplicate-submit-third-party-light.png',
    fullPage: true,
    animations: 'disabled',
  });

  await page.evaluate(() => document.documentElement.classList.add('dark', 'lx-theme-hud'));
  const hudActionStyles = await row.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const cell = button.closest('td');
      return {
        label: button.innerText.trim(),
        color: getComputedStyle(button).color,
        background: cell ? getComputedStyle(cell).backgroundColor : 'rgb(16, 26, 44)',
      };
    }),
  );
  expect(hudActionStyles.map(({ label }) => label)).toEqual(['详情', '修改', '删除']);
  hudActionStyles.forEach(({ label, color, background }) => {
    expect(contrastRatio(color, background), `${label} 操作按钮 ${color} / ${background}`).toBeGreaterThanOrEqual(4.5);
  });
  const hudBodyTextStyles = await row.locator('td').evaluateAll((cells) =>
    cells.slice(0, 3).map((cell) => {
      const content = cell.querySelector('.cell');
      return {
        label: content?.textContent?.trim() ?? '',
        color: content ? getComputedStyle(content).color : 'rgb(0, 0, 0)',
        background: getComputedStyle(cell).backgroundColor,
      };
    }),
  );
  hudBodyTextStyles.forEach(({ label, color, background }) => {
    expect(contrastRatio(color, background), `HUD 表格正文 ${label}: ${color} / ${background}`).toBeGreaterThanOrEqual(
      4.5,
    );
  });
  const hudStatusStyles = await statusTags.evaluateAll((tags) =>
    tags.map((tag) => ({
      label: tag.textContent?.trim(),
      color: getComputedStyle(tag).color,
      background: getComputedStyle(tag).backgroundColor,
    })),
  );
  expect(hudStatusStyles.map(({ label }) => label)).toEqual(['启用', '停用']);
  hudStatusStyles.forEach(({ color, background }) => {
    expect(color, 'HUD 状态标签使用高对比前景色').toBe('rgb(255, 255, 255)');
    expect(background, 'HUD 状态标签使用深色语义底色').not.toMatch(/rgb\((240, 249, 235|254, 240, 240)\)/);
    expect(contrastRatio(color, background), `HUD 状态标签 ${color} / ${background}`).toBeGreaterThanOrEqual(4.5);
  });
  await page.screenshot({
    path: '../../.impeccable/critique/duplicate-submit-third-party-hud.png',
    fullPage: true,
    animations: 'disabled',
  });

  await page.setViewportSize({ width: 375, height: 812 });
  const compactRow = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'Mock 接入应用' });
  await expect(compactRow).toContainText('启用');
  for (const label of ['详情', '修改', '删除']) {
    const actionButton = compactRow.getByRole('button', { name: label });
    await expect(actionButton).toBeVisible();
    const box = await actionButton.boundingBox();
    expect(box?.width, `${label} 操作的触控宽度`).toBeGreaterThanOrEqual(44);
    expect(box?.height, `${label} 操作的触控高度`).toBeGreaterThanOrEqual(44);
  }
  const compactHudActionStyles = await compactRow.locator('.third-party-compact-action').evaluateAll((buttons) =>
    buttons.map((button) => {
      const cell = button.closest('td');
      return {
        label: button.getAttribute('aria-label') ?? '',
        color: getComputedStyle(button).color,
        background: cell ? getComputedStyle(cell).backgroundColor : 'rgb(0, 0, 0)',
      };
    }),
  );
  expect(compactHudActionStyles.map(({ label }) => label)).toEqual(['详情', '修改', '删除']);
  compactHudActionStyles.forEach(({ label, color, background }) => {
    expect(contrastRatio(color, background), `375px HUD ${label} 操作 ${color} / ${background}`).toBeGreaterThanOrEqual(
      4.5,
    );
  });
  const compactHudTextStyle = await compactRow.locator('.third-party-client-name__text').evaluate((content) => {
    const cell = content.closest('td');
    return {
      color: getComputedStyle(content).color,
      background: cell ? getComputedStyle(cell).backgroundColor : 'rgb(0, 0, 0)',
    };
  });
  expect(
    contrastRatio(compactHudTextStyle.color, compactHudTextStyle.background),
    `375px HUD 应用名称 ${compactHudTextStyle.color} / ${compactHudTextStyle.background}`,
  ).toBeGreaterThanOrEqual(4.5);
  const compactPageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(compactPageWidth).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: '../../.impeccable/critique/duplicate-submit-third-party-hud-375.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.evaluate(() => document.documentElement.classList.remove('dark', 'lx-theme-hud'));
  await page.screenshot({
    path: '../../.impeccable/critique/duplicate-submit-third-party-light-375.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1280, height: 720 });

  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(deletion.requestCount).toBe(1);
  await expect(deleteButton).toHaveAttribute('aria-busy', 'true');
  await expect(editButton).toBeDisabled();
  await deleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  deletion.release();
  await expect(deleteButton).toBeEnabled();
  await expect(editButton).toBeEnabled();

  await deleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '取消' }).click();
  await expect(deleteButton).toBeEnabled();
  expect(deletion.requestCount()).toBe(1);

  await editButton.click();
  const dialog = page.getByRole('dialog', { name: '编辑应用' });
  await dialog.getByPlaceholder('请输入应用名称').fill('Mock 接入应用修改');
  await dialog.getByPlaceholder('请输入应用ID').fill('mockClient10');
  await dialog.getByPlaceholder('请输入应用密钥').fill('mockSecret10');
  await dialog.locator('input[type="number"]').nth(0).fill('24');
  await dialog.locator('input[type="number"]').nth(1).fill('7');
  const saveButton = dialog.getByRole('button', { name: '确定' });
  await saveButton.click();
  await expect.poll(update.requestCount).toBe(1);
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveAttribute('aria-busy', 'true');
  await saveButton.click({ force: true });
  expect(update.requestCount()).toBe(1);
  update.release();
  await expect(dialog).toBeHidden();
});

test('管理员用户删除和启停请求期间锁定对应行', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) =>
      path === '/auth/v1/user/adminuser/page' && request.method() === 'GET'
        ? ok({
            records: [{ id: 'admin-10', idCard: 'mock.admin', status: 0, gmtCreated: '2026-09-29' }],
            totalCount: 1,
          })
        : undefined,
  });
  await seedSession(page);
  const deletion = await holdRequest(page, '**/linkx/admin/auth/v1/user/adminuser/admin-10', 'DELETE');
  const update = await holdRequest(page, '**/linkx/admin/auth/v1/user/adminuser', 'PUT');

  await page.goto('/authority/userManage');
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'mock.admin' });
  const deleteButton = row.getByRole('button', { name: '删除' });
  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
  await expect(deleteButton).not.toHaveClass(/is-loading/);
  await page.locator('.el-message-box').getByRole('button', { name: '确定删除' }).click();
  await expect.poll(deletion.requestCount).toBe(1);
  await expect(deleteButton).toHaveClass(/is-loading/);
  await expect(deleteButton).toHaveAttribute('aria-busy', 'true');
  await deleteButton.click({ force: true });
  expect(deletion.requestCount()).toBe(1);
  deletion.release();
  await expect(deleteButton).toBeEnabled();

  const disableButton = row.getByRole('button', { name: '禁用' });
  await disableButton.click();
  await expect.poll(update.requestCount).toBe(1);
  await expect(disableButton).toBeDisabled();
  await expect(disableButton).toHaveClass(/is-loading/);
  await expect(disableButton).toHaveAttribute('aria-busy', 'true');
  await disableButton.click({ force: true });
  expect(update.requestCount()).toBe(1);
  update.release();
  await expect(disableButton).toBeEnabled();
});

test('删除请求失败后释放行锁并允许重试', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('localLanguage', 'cn'));
  await mockBackend(page, {
    handler: (path, request) =>
      path === '/collaboration/v1/client/list' && request.method() === 'POST'
        ? ok({
            records: [
              {
                id: 'client-10',
                clientName: 'Mock 接入应用',
                clientId: 'mockClient10',
                clientSecret: 'mockSecret10',
                tokenTime: 24,
                refreshTokenTime: 7,
                status: 1,
                remark: '',
              },
            ],
            totalCount: 1,
          })
        : undefined,
  });
  await seedSession(page);
  let deleteRequests = 0;
  await page.route('**/linkx/admin/collaboration/v1/client/delete?id=*', async (route) => {
    deleteRequests += 1;
    if (deleteRequests === 1) {
      await route.fulfill({ status: 500, json: { code: 500, msg: 'Mock 删除失败', data: null } });
      return;
    }
    await route.fulfill({ status: 200, json: ok() });
  });

  await page.goto('/baseData/thirdParty');
  const row = page.locator('.el-table__body-wrapper .el-table__row').filter({ hasText: 'Mock 接入应用' });
  const deleteButton = row.getByRole('button', { name: '删除' });
  await deleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(() => deleteRequests).toBe(1);
  await expect(deleteButton).toBeEnabled();
  await expect(page.getByRole('alert')).toContainText('Mock 删除失败');

  await deleteButton.click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click();
  await expect.poll(() => deleteRequests).toBe(2);
  await expect(deleteButton).toBeEnabled();
  await expect(row).toContainText('Mock 接入应用');
});
