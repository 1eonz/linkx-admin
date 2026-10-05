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

    await page.getByText('剪贴板与主题设置', { exact: true }).click();
    await page.getByLabel('阻止剪贴板操作', { exact: true }).check();
    await page.evaluate(() => navigator.clipboard.writeText('Blocked-Paste-Value'));
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

  test('剪贴板与主题设置支持键盘展开且窄屏触控区域为 44px', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');
    const advanced = page.locator('.password-input-demo__advanced');
    const summary = advanced.locator('summary');

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      const height = await summary.evaluate((element) => element.getBoundingClientRect().height);
      expect(height, `${width}px 下设置入口高度不足`).toBeGreaterThanOrEqual(44);
    }

    await summary.click();
    const controlLabelHeights = await advanced
      .locator('.password-input-demo__advanced-controls label')
      .evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().height));
    expect(controlLabelHeights).toHaveLength(2);
    expect(Math.min(...controlLabelHeights)).toBeGreaterThanOrEqual(44);

    await summary.click();
    await summary.focus();
    await summary.press('Enter');
    await expect(advanced).toHaveAttribute('open', '');
    await summary.press('Space');
    await expect(advanced).not.toHaveAttribute('open', '');
  });

  test('开启失焦遮罩后，焦点离开整个控件才隐藏明文', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');

    const input = page.getByLabel('访问密码');
    const toggle = page.locator('.lx-password-input__toggle').first();
    const maskOnBlur = page.getByLabel('离开组件后重新遮罩');
    await expect(maskOnBlur).toBeChecked();

    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
    await input.focus();
    await input.press('Tab');
    await expect(toggle).toBeFocused();
    await expect(input).toHaveAttribute('type', 'text');

    await toggle.press('Tab');
    await expect(page.getByLabel('只读密码')).toBeFocused();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('320px 下参数表可横滑，目录锚点标题和触控项避开固定导航', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/components/lxpasswordinput');

    await expect(page.getByText('窄屏下可左右滑动参数表，查看完整内容。')).toBeVisible();
    const table = page.locator('.vp-doc table').first();
    const tableWidth = await table.evaluate((element) => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
    }));
    expect(tableWidth.scroll).toBeGreaterThan(tableWidth.client);

    await page.locator('.VPLocalNavOutlineDropdown > button').click();
    await page.locator('.VPLocalNavOutlineDropdown a[href="#lx-passwordinput-demo"]').click();
    await expect(page).toHaveURL(/#lx-passwordinput-demo$/);
    const geometry = await page.evaluate(() => {
      const headingElement = document.querySelector<HTMLElement>('#lx-passwordinput-demo');
      const navElement = document.querySelector<HTMLElement>('.VPLocalNav');
      if (!headingElement || !navElement) throw new Error('找不到示例标题或移动目录');
      return {
        headingTop: headingElement.getBoundingClientRect().top,
        navBottom: navElement.getBoundingClientRect().bottom,
        documentWidth: document.documentElement.scrollWidth,
        toolbarLabelHeights: Array.from(
          document.querySelectorAll<HTMLElement>('.password-input-demo__toolbar label'),
        ).map((label) => label.getBoundingClientRect().height),
      };
    });
    expect(geometry.headingTop).toBeGreaterThanOrEqual(geometry.navBottom + 8);
    expect(geometry.toolbarLabelHeights.length).toBeGreaterThan(0);
    expect(Math.min(...geometry.toolbarLabelHeights)).toBeGreaterThanOrEqual(44);
    expect(geometry.documentWidth).toBeLessThanOrEqual(320);
  });

  test('VitePress 暗色主题映射到密码框预览，HUD 主题仍可独立切换', async ({ page }) => {
    await page.goto('/components/lxpasswordinput');
    await page.locator('html').evaluate((element) => element.classList.add('dark'));

    const demo = page.locator('.password-input-demo');
    const darkTheme = await demo.evaluate((element) => {
      const reference = document.createElement('span');
      reference.style.backgroundColor = 'var(--vp-c-bg-alt)';
      reference.style.color = 'var(--vp-c-text-1)';
      document.body.append(reference);
      const expectedBackground = getComputedStyle(reference).backgroundColor;
      const expectedText = getComputedStyle(reference).color;
      reference.remove();

      const inputSurface = element.querySelector('.el-input__wrapper');
      return {
        background: getComputedStyle(element).backgroundColor,
        inputBackground: inputSurface ? getComputedStyle(inputSurface).backgroundColor : '',
        text: getComputedStyle(element).color,
        expectedBackground,
        expectedText,
      };
    });
    expect(darkTheme.background).toBe(darkTheme.expectedBackground);
    expect(darkTheme.inputBackground).toBe(darkTheme.expectedBackground);
    expect(darkTheme.text).toBe(darkTheme.expectedText);

    await page.getByText('剪贴板与主题设置', { exact: true }).click();
    await page.getByLabel('HUD 深色主题').check();
    await expect(demo).toHaveClass(/lx-theme-hud/);
    const hudBackground = await demo.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(hudBackground).not.toBe(darkTheme.background);
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
    await page.getByText('剪贴板与主题设置', { exact: true }).click();
    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.password-input-demo')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('.password-input-demo__actions').getByRole('button')).toHaveCount(3);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const advancedIcon = page.locator('.password-input-demo__advanced-icon');
    const normalTransition = await advancedIcon.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(normalTransition).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByLabel('访问密码')).toBeVisible();
    const reducedTransition = await advancedIcon.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(reducedTransition).toBeLessThanOrEqual(0.00001);
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
