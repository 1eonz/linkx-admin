import { expect, test } from '@playwright/test';

test.describe('lx-ui LxPasswordInput 文档示例', () => {
  test('明文切换、清空和输入事件可见', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');

    const input = page.getByLabel('访问密码');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue('LinkX-Demo-2026');

    await page.locator('#password-input-demo').locator('..').locator('.el-input__password').click();
    await expect(input).toHaveAttribute('type', 'text');
    await page.locator('#password-input-demo').locator('..').locator('.el-input__password').click();
    await expect(input).toHaveAttribute('type', 'password');

    await input.fill('Updated-2026');
    await expect(page.getByTestId('last-action')).toHaveText('密码内容已更新');
    await page.locator('#password-input-demo').locator('..').locator('.el-input__clear').click({ force: true });
    await expect(input).toHaveValue('');
  });

  test('实例方法支持键盘焦点和选中，剪贴板事件被阻止', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');

    const input = page.getByLabel('访问密码');
    await page.getByRole('button', { name: '聚焦输入框' }).click();
    await expect(input).toBeFocused();

    await page.getByRole('button', { name: '选中密码' }).click();
    const selection = await input.evaluate((element) => {
      const field = element as HTMLInputElement;
      return [field.selectionStart, field.selectionEnd];
    });
    expect(selection).toEqual([0, 'LinkX-Demo-2026'.length]);

    const clipboardEvents = await input.evaluate((element) =>
      ['copy', 'cut', 'paste'].map((type) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    );
    expect(clipboardEvents).toEqual([true, true, true]);

    await page.getByRole('button', { name: '移除焦点' }).click();
    await expect(input).not.toBeFocused();
    await expect(page.getByTestId('last-action')).toHaveText('密码框已失焦');
  });

  test('只读和禁用语义保留，375px 深色视图不横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxpasswordinput');

    await expect(page.getByLabel('只读密码')).toHaveAttribute('readonly', '');
    await expect(page.getByLabel('禁用密码')).toBeDisabled();
    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.password-input-demo')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('.password-input-demo__actions').getByRole('button')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByLabel('访问密码')).toBeVisible();
  });
});
