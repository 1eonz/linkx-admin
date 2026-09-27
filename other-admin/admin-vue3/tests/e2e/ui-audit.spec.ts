import { expect, test, type Page } from '@playwright/test';

import { mockBackend, ok, seedSession } from './fixtures';

/** 收集运行时错误；页面错误属于验收失败，不能用断言放宽。 */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectNoPageErrors(errors: string[]): Promise<void> {
  expect(errors, `页面运行时错误：${errors.join('; ')}`).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(overflow.body, 'body 不应产生页面级横向滚动').toBeLessThanOrEqual(overflow.viewport);
  expect(overflow.document, 'document 不应产生页面级横向滚动').toBeLessThanOrEqual(overflow.viewport);
}

test.describe('Vue3 + lx-ui 页面 UI 验收', () => {
  test('SectionTitle 在布局配置页保留标题层级且窄屏不产生横向溢出', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await mockBackend(page);
    await seedSession(page);
    await page.goto('/baseData/layoutConfig');
    await expect(page).toHaveURL(/\/baseData\/layoutConfig$/, { timeout: 15_000 });
    await expect(page.locator('.app-container')).toBeVisible();

    const title = page.getByRole('heading', { level: 3, name: '基础配置' });
    const sectionTitle = page.locator('.common-config .lx-section-title').filter({ has: title });
    await expect(title).toBeVisible();
    await expect(sectionTitle).toHaveClass(/lx-section-title--border/);
    await expect(sectionTitle).toHaveClass(/lx-section-title--default/);
    await expectNoHorizontalOverflow(page);
    await expectNoPageErrors(errors);
  });

  test('登录页桌面布局、密码输入和键盘焦点可用', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockBackend(page);
    await page.goto('/login');

    const username = page.locator('input[autocomplete="username"]');
    const password = page.locator('input[autocomplete="current-password"]').first();
    await expect(username).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page.locator('.btn-submit')).toBeVisible();

    await username.focus();
    await expect(username).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await page.keyboard.type('secret');
    await expect(password).toHaveValue('secret');
    const submitTransition = await page
      .locator('.btn-submit')
      .evaluate((button) => getComputedStyle(button).transitionDuration);
    expect(Number.parseFloat(submitTransition)).toBeLessThanOrEqual(0.001);
    await expectNoHorizontalOverflow(page);
    await expectNoPageErrors(errors);
  });

  test('密码过期登录可以修改密码并在提交期间锁定重复操作', async ({ page }) => {
    const requests = await mockBackend(page, {
      loginCode: 114,
      delayMs: 300,
      handler: (path) => (path.endsWith('/oauth/v2/changePwd') ? ok(null) : undefined),
    });
    await page.goto('/login');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('simplePassWord'))).toBe('true');

    await page.locator('input[autocomplete="username"]').fill('preview_user');
    await page.locator('input[autocomplete="current-password"]').first().fill('OldPass123!');
    await page.getByRole('button', { name: '安全登录' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const passwordInputs = dialog.locator('input[type="password"]');
    await passwordInputs.nth(1).fill('NewPass123!');
    await passwordInputs.nth(2).fill('NewPass123!');

    const submitButton = dialog.getByRole('button', { name: '确认修改' });
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await expect
      .poll(() => requests.filter((request) => new URL(request.url()).pathname.endsWith('/oauth/v2/changePwd')).length)
      .toBe(1);
    await expect(dialog).toBeHidden();
  });

  test('OAuth2 登录展示 License 提示后进入系统', async ({ page }) => {
    const requests = await mockBackend(page, { loginWarning: 'Mock License 即将到期' });
    await page.goto('/login');
    await page.locator('input[autocomplete="username"]').fill('preview_user');
    await page.locator('input[autocomplete="current-password"]').first().fill('PreviewPass123!');
    await page.getByRole('button', { name: '安全登录' }).click();

    const licenseDialog = page.locator('.el-message-box');
    await expect(licenseDialog).toContainText('Mock License 即将到期');
    await licenseDialog.locator('.el-message-box__btns button').click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    const loginRequest = requests.find((request) => new URL(request.url()).pathname.endsWith('/oauth/v2/login'));
    expect(loginRequest?.method()).toBe('POST');
    expect(loginRequest?.postDataJSON()).toMatchObject({
      grantType: 'password',
      scope: 'all',
      username: 'preview_user',
    });
  });

  test('记住账号只保存账号名，重新打开时回填且取消后清除', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');

    const username = page.locator('input[autocomplete="username"]');
    await username.fill('preview_user');
    const rememberCheckbox = page.locator('.form-options .el-checkbox');
    await rememberCheckbox.click();
    await expect(rememberCheckbox).toHaveClass(/is-checked/);
    await page.locator('input[autocomplete="current-password"]').first().fill('PreviewPass123!');
    await page.getByRole('button', { name: '安全登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('linkx_admin_remembered_username')))
      .toBe('preview_user');

    const passwordWasPersisted = await page.evaluate(() =>
      Object.values(localStorage).some((value) => value === 'PreviewPass123!'),
    );
    expect(passwordWasPersisted).toBe(false);

    await page.evaluate(() => localStorage.removeItem('vue_admin_template_token'));
    await page.goto('/login');
    await expect(page.locator('input[autocomplete="username"]')).toHaveValue('preview_user');
    await expect(rememberCheckbox).toHaveClass(/is-checked/);
    await rememberCheckbox.click();
    await expect(rememberCheckbox).not.toHaveClass(/is-checked/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('linkx_admin_remembered_username'))).toBeNull();
  });

  test('Navbar、PasswordInput 和 ProTable 在桌面页可见且可聚焦', async ({ page }) => {
    const errors = collectPageErrors(page);
    await mockBackend(page);
    await seedSession(page);
    await page.goto('/authority/role');
    // 动态路由在首屏加载菜单和权限后才注册，必须等待地址重新匹配完成。
    await expect(page).toHaveURL(/\/authority\/role$/, { timeout: 15_000 });
    // 首次动态路由注册完成后重新加载，确保页面视图与地址同步。
    await page.reload();
    await expect(page).toHaveURL(/\/authority\/role$/, { timeout: 15_000 });
    await expect(page.locator('.lx-navbar')).toBeVisible();
    await expect(page.locator('.breadcrumb-container')).toBeVisible();
    await expect(page.locator('.lx-table')).toBeVisible();
    await expect(page.locator('.lx-table .el-table')).toBeVisible();
    await expect(page.locator('.lx-table .el-table__empty-text')).toContainText('暂无数据');

    const avatar = page.locator('.avatar-wrapper');
    await expect(avatar).toBeVisible();
    await avatar.click();
    await page.getByRole('menuitem', { name: '修改密码', exact: true }).click();

    const passwordDialog = page.getByRole('dialog');
    await expect(passwordDialog).toBeVisible();
    const dialogPassword = passwordDialog.locator('input[type="password"]').first();
    await expect(dialogPassword).toBeVisible();
    await dialogPassword.focus();
    await expect(dialogPassword).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await expectNoPageErrors(errors);
  });

  test('连接状态点和服务器表格在窄屏保持可见且无页面横溢', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await mockBackend(page, {
      handler: (path) => {
        if (path === '/node/v1/p2p/servers') {
          return ok({
            records: [
              {
                id: 'server-1',
                ip: '10.0.0.1',
                port: 30017,
                name: '核心节点',
                status: 4,
                statusDesc: '在线',
              },
            ],
            total: 1,
          });
        }
        return undefined;
      },
    });
    await seedSession(page);
    await page.goto('/nodeManage/nodeManagement');
    await expect(page).toHaveURL(/\/nodeManage\/nodeManagement$/, { timeout: 15_000 });
    await page.reload();
    await expect(page).toHaveURL(/\/nodeManage\/nodeManagement$/, { timeout: 15_000 });

    await expect(page.locator('.lx-navbar')).toBeVisible();
    await expect(page.locator('.lx-table')).toBeVisible();
    await expect(page.locator('.lx-table .el-table')).toBeVisible();
    const onlineStatus = page.locator('.lx-status-dot--online');
    await expect(onlineStatus).toBeVisible();
    await expect(onlineStatus).toHaveAttribute('aria-label', /在线/);
    await expectNoHorizontalOverflow(page);
    await expectNoPageErrors(errors);
  });

  test('登录页在 390px 和 320px 窄屏保留输入、提交按钮和键盘焦点', async ({ page }) => {
    const errors = collectPageErrors(page);
    await mockBackend(page);

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/login');

      const username = page.locator('input[autocomplete="username"]');
      const password = page.locator('input[autocomplete="current-password"]').first();
      await expect(username).toBeVisible();
      await expect(password).toBeVisible();
      await expect(page.locator('.btn-submit')).toBeVisible();
      await username.focus();
      await expect(username).toBeFocused();
      await expectNoHorizontalOverflow(page);
    }
    await expectNoPageErrors(errors);
  });
});
