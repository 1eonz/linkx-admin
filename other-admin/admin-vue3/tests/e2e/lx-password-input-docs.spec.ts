import { expect, test } from '@playwright/test';

test.describe('lx-ui LxPasswordInput 文档示例', () => {
  test('明文切换、清空和输入事件可见', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');

    const input = page.getByLabel('访问密码');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue('LinkX-Demo-2026');

    const toggle = page.locator('.lx-password-input__toggle').first();
    await expect(toggle).toHaveAttribute('aria-label', '显示密码');
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'password');

    await input.fill('Updated-2026');
    await expect(page.getByTestId('last-action')).toHaveText('密码内容已更新');
    await page.locator('#password-input-demo').locator('..').locator('.el-input__clear').click({ force: true });
    await expect(input).toHaveValue('');
  });

  test('实例方法支持键盘焦点和选中，剪贴板默认可用且可显式阻止', async ({ page }) => {
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
    expect(clipboardEvents).toEqual([false, false, false]);

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => navigator.clipboard.writeText('Demo-Paste-Value'));
    await input.fill('');
    await input.press('ControlOrMeta+V');
    await expect(input).toHaveValue('Demo-Paste-Value');

    await page.getByLabel('阻止剪贴板操作', { exact: true }).check();
    await input.fill('');
    await input.focus();
    await input.press('ControlOrMeta+V');
    await expect(input).toHaveValue('');
    const blockedClipboardEvents = await input.evaluate((element) =>
      ['copy', 'cut', 'paste'].map((type) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    );
    expect(blockedClipboardEvents).toEqual([true, true, true]);

    await page.getByRole('button', { name: '移除焦点' }).click();
    await expect(input).not.toBeFocused();
    await expect(page.getByTestId('last-action')).toHaveText('密码框已失焦');
  });

  test('密码显隐按钮可通过 Tab、Enter 和 Space 操作', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');
    const field = page.locator('.password-input-demo__field').first();
    const input = field.getByLabel('访问密码');
    const toggle = field.locator('.lx-password-input__toggle');

    await input.focus();
    await input.press('Tab');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-label', '显示密码');
    await toggle.press('Enter');
    await expect(input).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.press('Space');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    const disabledToggle = page
      .locator('#password-input-disabled')
      .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-password-input ")]')
      .locator('.lx-password-input__toggle');
    await expect(disabledToggle).toBeDisabled();
  });

  test('只读和禁用语义保留，375px 深色视图不横向溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxpasswordinput');

    await expect(page.getByLabel('只读密码')).toHaveAttribute('readonly', '');
    await expect(page.getByLabel('禁用密码')).toBeDisabled();
    const input = page.getByLabel('访问密码');
    const sizeControl = page.getByLabel('密码框尺寸档', { exact: true });
    for (const [size, expectedHeight] of [
      ['sm', 28],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      await sizeControl.selectOption(size);
      const geometry = await input.evaluate((element) => {
        const root = element.closest('.el-input');
        const wrapper = root?.querySelector('.el-input__wrapper');
        const toggle = root?.querySelector('.lx-password-input__toggle');
        if (!wrapper || !toggle) throw new Error('密码框缺少输入外框或显隐按钮');
        return {
          wrapperHeight: wrapper.getBoundingClientRect().height,
          toggleHeight: toggle.getBoundingClientRect().height,
          toggleWidth: toggle.getBoundingClientRect().width,
        };
      });
      expect(geometry.wrapperHeight, `${size} 档密码框外框高度不匹配：${JSON.stringify(geometry)}`).toBe(
        expectedHeight,
      );
      expect(geometry.toggleHeight, `${size} 档窄屏触控高度不足`).toBe(44);
      expect(geometry.toggleWidth, `${size} 档窄屏触控宽度不足`).toBe(44);
    }
    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.password-input-demo')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('.password-input-demo__actions').getByRole('button')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByLabel('访问密码')).toBeVisible();
  });

  test('关闭显隐能力会恢复遮罩，窄屏焦点框不压住字段标签', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxpasswordinput');

    const field = page.locator('.password-input-demo__field').first();
    const input = field.getByLabel('访问密码');
    const toggle = field.locator('.lx-password-input__toggle');
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
    await page.getByLabel('允许切换明文').uncheck();
    await expect(toggle).toBeHidden();
    await expect(input).toHaveAttribute('type', 'password');
    await page.getByLabel('允许切换明文').check();
    await expect(input).toHaveAttribute('type', 'password');

    const sizeControl = page.getByLabel('密码框尺寸档', { exact: true });
    const label = page.locator('label[for="password-input-demo"]');
    for (const size of ['sm', 'md'] as const) {
      await sizeControl.selectOption(size);
      await input.focus();
      await input.press('Tab');
      await expect(toggle).toBeFocused();

      const geometry = await page.evaluate(() => {
        const labelElement = document.querySelector<HTMLLabelElement>('label[for="password-input-demo"]');
        const toggleElement = document.querySelector<HTMLButtonElement>('.lx-password-input__toggle');
        if (!labelElement || !toggleElement) throw new Error('密码字段缺少标签或显隐按钮');
        return {
          gap: toggleElement.getBoundingClientRect().top - labelElement.getBoundingClientRect().bottom,
          outlineOffset: getComputedStyle(toggleElement).outlineOffset,
        };
      });
      expect(geometry.gap, `${size} 窄屏标签与触控按钮发生几何重叠`).toBeGreaterThanOrEqual(0);
      expect(geometry.outlineOffset).toBe('-2px');
    }
    await expect(label).toBeVisible();
  });
});
