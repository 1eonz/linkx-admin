import { expect, test } from '@playwright/test';

test.describe('LxCheckbox 文档示例', () => {
  test('按设计呈现三态与纵向权限列表，并在 HUD 下保留可读状态', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxcheckbox');
    const summary = page.getByTestId('selection-summary');
    await expect(summary).toContainText('当前授权：视频巡查权限； 通知渠道：警情简报； 承诺未勾选');

    const permissions = page.getByRole('group', { name: '关联授权业务权限' });
    const selected = permissions.getByRole('checkbox', { name: /视频巡查权限/ });
    const selectedControl = selected.locator('xpath=ancestor::label[1]');
    const partial = permissions.getByRole('checkbox', { name: /警单流转/ });
    const partialControl = partial.locator('xpath=ancestor::label[1]');
    const disabled = permissions.getByRole('checkbox', { name: /跨区移送/ });
    const disabledControl = disabled.locator('xpath=ancestor::label[1]');
    const disabledStates = page.getByTestId('disabled-states');
    const checkedDisabled = disabledStates.getByRole('checkbox', { name: '已分配的受限权限' });
    const checkedDisabledControl = checkedDisabled.locator('xpath=ancestor::label[1]');
    const mixedDisabled = disabledStates.getByRole('checkbox', { name: '部分分配的受限权限' });
    const mixedDisabledControl = mixedDisabled.locator('xpath=ancestor::label[1]');

    await expect(selected).toBeChecked();
    await expect(partial).toHaveJSProperty('indeterminate', true);
    await expect(partialControl).toHaveAttribute('aria-checked', 'mixed');
    await expect(disabled).toBeDisabled();
    await expect(disabled).not.toBeChecked();
    await expect(checkedDisabled).toBeDisabled();
    await expect(checkedDisabled).toBeChecked();
    await expect(mixedDisabled).toBeDisabled();
    await expect(mixedDisabled).toHaveJSProperty('indeterminate', true);
    await expect(mixedDisabledControl).toHaveAttribute('aria-checked', 'mixed');
    await expect(disabledControl.locator('.el-checkbox__label')).toHaveCSS('color', 'rgb(144, 147, 153)');
    await expect(checkedDisabledControl.locator('.el-checkbox__label')).toHaveCSS('color', 'rgb(144, 147, 153)');
    await expect(mixedDisabledControl.locator('.el-checkbox__label')).toHaveCSS('color', 'rgb(144, 147, 153)');
    await expect
      .poll(() =>
        checkedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe('rgb(0, 96, 169)');
    await expect.poll(() => permissions.evaluate((element) => getComputedStyle(element).gap)).toBe('12px');
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(48, 49, 51)');

    await partialControl.click();
    await expect(partial).toBeChecked();
    await expect(partial).toHaveJSProperty('indeterminate', false);
    await expect(partialControl).not.toHaveAttribute('aria-checked', 'mixed');
    await expect(summary).toContainText('当前授权：视频巡查权限 / 警单流转');

    await selectedControl.hover();
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(0, 96, 169)');

    const root = page.locator('html');
    const initialTheme = await root.evaluate((element) => ({
      dark: element.classList.contains('dark'),
      hud: element.classList.contains('lx-theme-hud'),
    }));
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(root).toHaveClass(/dark/);
    await expect(root).toHaveClass(/lx-theme-hud/);
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe('rgb(56, 189, 248)');
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(226, 232, 240)');
    await expect
      .poll(() =>
        checkedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe('rgb(22, 35, 58)');
    await expect
      .poll(() =>
        mixedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe('rgb(22, 35, 58)');
    await expect(checkedDisabledControl.locator('.el-checkbox__label')).toHaveCSS('color', 'rgb(148, 163, 184)');
    await expect(mixedDisabledControl.locator('.el-checkbox__label')).toHaveCSS('color', 'rgb(148, 163, 184)');

    const appearanceSwitch = page.getByRole('switch');
    if ((await appearanceSwitch.getAttribute('aria-checked')) !== 'true') {
      await appearanceSwitch.click();
    }
    await expect(root).toHaveClass(/dark/);

    await page.getByRole('link', { name: 'LxRadio 单选组', exact: true }).click();
    await expect(page).toHaveURL(/\/components\/lxradio(?:\.html)?$/);
    await expect
      .poll(() =>
        root.evaluate((element) => ({
          dark: element.classList.contains('dark'),
          hud: element.classList.contains('lx-theme-hud'),
        })),
      )
      .toEqual({ dark: true, hud: initialTheme.hud });
  });

  test('375px 触屏视口下复选控件保留 44px 触控高度', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/components/lxcheckbox');
      const first = page
        .getByRole('group', { name: '关联授权业务权限' })
        .getByRole('checkbox', { name: /视频巡查权限/ });
      const firstControl = first.locator('xpath=ancestor::label[1]');
      const themeToggle = page.locator('.lx-checkbox-demo__theme-toggle');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      await expect.poll(async () => (await firstControl.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await expect.poll(async () => (await themeToggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
    } finally {
      await context.close();
    }
  });
});

test.describe('LxRadio 文档示例', () => {
  test('方向键跳过禁用项、保持焦点可见并应用 HUD 靶环', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxradio');

    const horizontal = page.getByRole('radiogroup', { name: '勤务响应等级' });
    const daily = horizontal.getByRole('radio', { name: '日常勤务' });
    const dailyControl = daily.locator('xpath=ancestor::label[1]');
    const emergency = horizontal.getByRole('radio', { name: '应急处突' });
    const emergencyControl = emergency.locator('xpath=ancestor::label[1]');
    const emergencyDot = emergencyControl.locator('.el-radio__inner');
    const dailyInput = dailyControl.locator('.el-radio__original');
    const dailyDot = dailyControl.locator('.el-radio__inner');
    const beforeFocus = await dailyDot.boundingBox();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).focus();
    await page.keyboard.press('Tab');
    await expect(dailyInput).toBeFocused();
    await expect.poll(() => dailyInput.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expect.poll(() => dailyDot.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('ArrowRight');
    await expect(emergency).toBeChecked();
    await expect(page.locator('.lx-radio-demo__status')).toHaveText('响应等级 选中：应急处突');
    await expect(page.locator('.lx-radio-demo__status')).not.toContainText('emergency');
    expect(await dailyDot.boundingBox()).toEqual(beforeFocus);

    const vertical = page.getByRole('radiogroup', { name: '处置通道优先级' });
    const encrypted = vertical.getByRole('radio', { name: /高密加密专线/ });
    const disabled = vertical.getByRole('radio', { name: /卫星链路直通/ });
    const disabledControl = disabled.locator('xpath=ancestor::label[1]');
    const fiber = vertical.getByRole('radio', { name: '光纤骨干网' });
    const checkedDisabled = page.getByTestId('checked-disabled').getByRole('radio');

    await expect(disabled).toBeDisabled();
    await expect(disabled).not.toBeChecked();
    await expect(checkedDisabled).toBeDisabled();
    await expect(checkedDisabled).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(encrypted).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(fiber).toBeChecked();
    await expect(disabled).not.toBeChecked();
    await page.keyboard.press('ArrowUp');
    await expect(encrypted).toBeChecked();

    const legacy = page.getByRole('radiogroup', { name: '旧版单选值用法' });
    await legacy.getByRole('radio', { name: /高密加密专线/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(legacy.getByRole('radio', { name: '光纤骨干网' })).toBeChecked();
    await expect(encrypted).toBeChecked();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect
      .poll(() => dailyDot.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(11, 18, 32)');
    await expect
      .poll(() => emergencyDot.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(22, 35, 58)');
    await expect
      .poll(() => emergencyDot.evaluate((element) => getComputedStyle(element, '::after').backgroundColor))
      .toBe('rgb(56, 189, 248)');

    await expect
      .poll(() =>
        disabledControl.locator('.el-radio__inner').evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe('rgb(22, 35, 58)');
    await expect
      .poll(() => disabledControl.locator('.el-radio__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(148, 163, 184)');

    const fullMotionDuration = await emergencyDot.evaluate(
      (element) => getComputedStyle(element, '::after').transitionDuration,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotionDuration = await emergencyDot.evaluate(
      (element) => getComputedStyle(element, '::after').transitionDuration,
    );
    const seconds = (duration: string) =>
      Math.max(
        ...duration.split(',').map((value) => {
          const trimmed = value.trim();
          const amount = Number.parseFloat(trimmed);
          return trimmed.endsWith('ms') ? amount / 1000 : amount;
        }),
      );
    expect(seconds(fullMotionDuration)).toBeGreaterThan(seconds(reducedMotionDuration));
    expect(seconds(reducedMotionDuration)).toBeLessThanOrEqual(0.001);
  });

  test('375px 触屏视口下单选控件保留 44px 触控高度', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/components/lxradio');
      const first = page.getByRole('radiogroup', { name: '勤务响应等级' }).getByRole('radio', { name: '日常勤务' });
      const firstControl = first.locator('xpath=ancestor::label[1]');
      const themeToggle = page.locator('.lx-radio-demo__theme-toggle');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      await expect.poll(async () => (await firstControl.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await expect.poll(async () => (await themeToggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
    } finally {
      await context.close();
    }
  });
});
