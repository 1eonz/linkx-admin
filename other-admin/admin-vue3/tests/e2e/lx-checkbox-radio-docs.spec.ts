import { expect, test, type Locator } from '@playwright/test';

async function expectClearedErrorRowsHidden(form: Locator) {
  const probe = await form.evaluate((formElement) => {
    const emptyError = document.createElement('div');
    emptyError.className = 'el-form-item__error';
    formElement.append(emptyError);

    const result = {
      display: getComputedStyle(emptyError).display,
      height: emptyError.getBoundingClientRect().height,
      pseudoContent: getComputedStyle(emptyError, '::before').content,
    };

    emptyError.remove();
    return result;
  });

  expect(probe.display).toBe('none');
  expect(probe.height).toBe(0);
  expect(['none', 'normal']).toContain(probe.pseudoContent);

  const visibleEmptyErrors = await form.locator('.el-form-item__error').evaluateAll(
    (errors) =>
      errors.filter((error) => {
        if (error.textContent?.trim()) return false;
        const style = getComputedStyle(error);
        return style.display !== 'none' && error.getBoundingClientRect().height > 0;
      }).length,
  );
  expect(visibleEmptyErrors).toBe(0);
}

test.beforeEach(async ({ page }) => {
  // 文档页不访问外部服务，避免浏览器验收触达真实后端。
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test.describe('LxCheckbox 文档示例', () => {
  test('按设计呈现三态与纵向权限列表，并在 HUD 下保留可读状态', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxcheckbox');
    await page.getByTestId('checkbox-advanced-examples').locator('summary').click();
    const summary = page.getByTestId('selection-summary');
    await expect(page.getByTestId('permission-change-message')).toHaveText('勾选后在此显示更新的组选中值');
    await expect(summary).toContainText('完全授权：视频巡查权限');
    await expect(summary).toContainText('部分授权：警单流转');
    await expect(summary).toContainText('通知渠道：警情简报； 承诺未勾选');

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
    const horizontalPermissions = page.getByRole('group', { name: '水平排布的通知渠道' });
    const unchecked = permissions.getByRole('checkbox', { name: /全网广播调度/ });
    const uncheckedControl = unchecked.locator('xpath=ancestor::label[1]');
    const themeToggle = page.getByRole('checkbox', { name: 'HUD 深色主题' });

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
    await expect
      .poll(() =>
        checkedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element, '::after').borderColor),
      )
      .toBe('rgb(78, 89, 105)');
    await expect
      .poll(() =>
        mixedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element, '::before').backgroundColor),
      )
      .toBe('rgb(78, 89, 105)');
    await expect
      .poll(() => selectedControl.evaluate((element) => Math.round(element.getBoundingClientRect().height)))
      .toBe(32);
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).width))
      .toBe('14px');
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).height),
      )
      .toBe('14px');
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).paddingLeft),
      )
      .toBe('10px');
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(48, 49, 51)');
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe('12px');
    await expect.poll(() => horizontalPermissions.evaluate((element) => getComputedStyle(element).gap)).toBe('16px');
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

    const selectedInput = selectedControl.locator('.el-checkbox__original');
    await themeToggle.focus();
    await page.keyboard.press('Tab');
    await expect(selectedInput).toBeFocused();
    await expect.poll(() => selectedInput.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).boxShadow),
      )
      .not.toBe('none');

    await page.keyboard.press('Space');
    await expect(selected).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(selected).toBeChecked();

    await partialControl.click();
    await expect(partial).toBeChecked();
    await expect(partial).toHaveJSProperty('indeterminate', false);
    await expect(partialControl).not.toHaveAttribute('aria-checked', 'mixed');
    await expect(summary).toContainText('完全授权：视频巡查权限 / 警单流转');
    await expect(summary).toContainText('部分授权：无');
    await expect(page.getByTestId('permission-change-message')).toHaveText('组选中值已更新：视频巡查权限 / 警单流转');

    await selectedControl.hover();
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(0, 96, 169)');
    await uncheckedControl.hover();
    await expect
      .poll(() =>
        uncheckedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).borderColor),
      )
      .toBe('rgb(0, 96, 169)');
    await expect
      .poll(() =>
        uncheckedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color),
      )
      .toBe('rgb(0, 96, 169)');
    const disabledLightAppearance = await disabledControl.evaluate((element) => {
      const inner = element.querySelector('.el-checkbox__inner');
      const label = element.querySelector('.el-checkbox__label');
      return {
        borderColor: inner ? getComputedStyle(inner).borderColor : '',
        labelColor: label ? getComputedStyle(label).color : '',
      };
    });
    await disabledControl.hover();
    await expect
      .poll(() =>
        disabledControl.evaluate((element) => {
          const inner = element.querySelector('.el-checkbox__inner');
          const label = element.querySelector('.el-checkbox__label');
          return {
            borderColor: inner ? getComputedStyle(inner).borderColor : '',
            labelColor: label ? getComputedStyle(label).color : '',
          };
        }),
      )
      .toEqual(disabledLightAppearance);

    const root = page.locator('html');
    const initialTheme = await root.evaluate((element) => ({
      dark: element.classList.contains('dark'),
      hud: element.classList.contains('lx-theme-hud'),
    }));
    await themeToggle.check();
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
    await selectedControl.hover();
    await expect
      .poll(() =>
        selectedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).borderColor),
      )
      .toBe('rgb(56, 189, 248)');
    await expect
      .poll(() => selectedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(56, 189, 248)');
    await uncheckedControl.hover();
    await expect
      .poll(() =>
        uncheckedControl.locator('.el-checkbox__inner').evaluate((element) => getComputedStyle(element).borderColor),
      )
      .toBe('rgb(56, 189, 248)');
    await expect
      .poll(() =>
        uncheckedControl.locator('.el-checkbox__label').evaluate((element) => getComputedStyle(element).color),
      )
      .toBe('rgb(56, 189, 248)');
    await uncheckedControl.click();
    await expect(unchecked).toBeChecked();
    await expect(page.getByTestId('permission-change-message')).toHaveText(
      '组选中值已更新：视频巡查权限 / 警单流转 / 全网广播调度',
    );
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
    await expect
      .poll(() =>
        checkedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element, '::after').borderColor),
      )
      .toBe('rgb(148, 163, 184)');
    await expect
      .poll(() =>
        mixedDisabledControl
          .locator('.el-checkbox__inner')
          .evaluate((element) => getComputedStyle(element, '::before').backgroundColor),
      )
      .toBe('rgb(148, 163, 184)');
    const disabledHudAppearance = await checkedDisabledControl.evaluate((element) => {
      const inner = element.querySelector('.el-checkbox__inner');
      const label = element.querySelector('.el-checkbox__label');
      return {
        borderColor: inner ? getComputedStyle(inner).borderColor : '',
        backgroundColor: inner ? getComputedStyle(inner).backgroundColor : '',
        labelColor: label ? getComputedStyle(label).color : '',
      };
    });
    await checkedDisabledControl.hover();
    await expect
      .poll(() =>
        checkedDisabledControl.evaluate((element) => {
          const inner = element.querySelector('.el-checkbox__inner');
          const label = element.querySelector('.el-checkbox__label');
          return {
            borderColor: inner ? getComputedStyle(inner).borderColor : '',
            backgroundColor: inner ? getComputedStyle(inner).backgroundColor : '',
            labelColor: label ? getComputedStyle(label).color : '',
          };
        }),
      )
      .toEqual(disabledHudAppearance);

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
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
      });
      await page.goto('/components/lxcheckbox');
      const first = page
        .getByRole('group', { name: '关联授权业务权限' })
        .getByRole('checkbox', { name: /视频巡查权限/ });
      const firstControl = first.locator('xpath=ancestor::label[1]');
      const themeToggle = page.locator('.lx-checkbox-demo__theme-toggle');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      await expect.poll(async () => (await firstControl.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await expect.poll(async () => (await themeToggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      const firstBounds = await firstControl.boundingBox();
      if (!firstBounds) throw new Error('无法读取复选项的触控区域');
      await page.touchscreen.tap(firstBounds.x + firstBounds.width / 2, firstBounds.y + firstBounds.height / 2);
      await expect(first).not.toBeChecked();
      await expect(page.getByTestId('permission-change-message')).toHaveText('组选中值已更新：无');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
    } finally {
      await context.close();
    }
  });

  test('旧 label 组选中值兼容并向外报告 change', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxcheckbox');
    await page.getByTestId('checkbox-advanced-examples').locator('summary').click();
    const group = page.getByRole('group', { name: '旧版 label 权限范围' });
    const video = group.getByRole('checkbox', { name: '视频巡查权限' });
    const broadcast = group.getByRole('checkbox', { name: '全网广播调度' });

    await expect(video).toBeChecked();
    await expect(broadcast).not.toBeChecked();
    await broadcast.locator('xpath=ancestor::label[1]').click();
    await expect(video).toBeChecked();
    await expect(broadcast).toBeChecked();
    await expect(page.getByTestId('legacy-change-message')).toHaveText(
      '旧 label 组选中值已更新：视频巡查权限 / 全网广播调度',
    );
  });

  test('复选组级禁用及 LxForm 禁用继承对单项和组选项生效', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxcheckbox');
    await page.getByTestId('checkbox-advanced-examples').locator('summary').click();

    const disabledGroup = page.getByRole('group', { name: '整组禁用的授权范围' });
    await expect(disabledGroup.getByRole('checkbox', { name: '视频巡查权限' })).toBeDisabled();
    await expect(disabledGroup.getByRole('checkbox', { name: '视频巡查权限' })).toBeChecked();
    await expect(disabledGroup.getByRole('checkbox', { name: '全网广播调度' })).toBeDisabled();

    const inherited = page.getByTestId('checkbox-form-disabled');
    await expect(inherited.getByRole('checkbox', { name: '继承表单禁用的独立确认' })).toBeDisabled();
    const inheritedGroup = inherited.getByRole('group', { name: '继承表单禁用的通知渠道' });
    await expect(inheritedGroup.getByRole('checkbox', { name: '警情简报' })).toBeDisabled();
    await expect(inheritedGroup.getByRole('checkbox', { name: '警情简报' })).toBeChecked();
    await expect(inheritedGroup.getByRole('checkbox', { name: '勤务调度' })).toBeDisabled();
  });

  test('必填权限组校验失败后可通过选择恢复', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxcheckbox');
    const form = page.getByTestId('checkbox-validation-form');

    await form.getByRole('button', { name: '提交校验' }).click();
    await expect(form).toContainText('至少选择一项权限');

    await form.getByRole('checkbox', { name: '视频巡查权限' }).locator('xpath=ancestor::label[1]').click();
    await form.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByTestId('checkbox-validation-feedback')).toHaveText('权限校验通过');
    await expectClearedErrorRowsHidden(form);
    await expect(form.locator('.el-form-item__error')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });
});

test.describe('LxRadio 文档示例', () => {
  test('方向键跳过禁用项、保持焦点可见并应用 HUD 靶环', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxradio');
    await page.getByTestId('radio-advanced-examples').locator('summary').click();

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
    await expect
      .poll(() => dailyDot.evaluate((element) => getComputedStyle(element).outlineColor))
      .toBe('rgb(0, 96, 169)');

    const vertical = page.getByRole('radiogroup', { name: '处置通道优先级' });
    const encrypted = vertical.getByRole('radio', { name: /高密加密专线/ });
    const encryptedControl = encrypted.locator('xpath=ancestor::label[1]');
    const encryptedLabel = encryptedControl.locator('.el-radio__label');
    const disabled = vertical.getByRole('radio', { name: /卫星链路直通/ });
    const disabledControl = disabled.locator('xpath=ancestor::label[1]');
    const fiber = vertical.getByRole('radio', { name: '光纤骨干网' });
    const fiberControl = fiber.locator('xpath=ancestor::label[1]');
    const fiberDot = fiberControl.locator('.el-radio__inner');
    const fiberLabel = fiberControl.locator('.el-radio__label');
    const checkedDisabled = page.getByTestId('checked-disabled').getByRole('radio');
    const checkedDisabledLabel = checkedDisabled.locator('xpath=ancestor::label[1]').locator('.el-radio__label');
    const dailyLabel = dailyControl.locator('.el-radio__label');
    const emergencyLabel = emergencyControl.locator('.el-radio__label');

    await expect.poll(() => horizontal.evaluate((element) => getComputedStyle(element).gap)).toBe('16px');
    await expect.poll(() => vertical.evaluate((element) => getComputedStyle(element).gap)).toBe('8px');
    await expect
      .poll(() => dailyControl.evaluate((element) => Math.round(element.getBoundingClientRect().height)))
      .toBe(32);
    await expect.poll(() => dailyDot.evaluate((element) => getComputedStyle(element).width)).toBe('14px');
    await expect.poll(() => dailyDot.evaluate((element) => getComputedStyle(element).height)).toBe('14px');
    await expect.poll(() => dailyLabel.evaluate((element) => getComputedStyle(element).fontSize)).toBe('12px');
    await expect.poll(() => dailyLabel.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(0, 96, 169)');
    await expect.poll(() => dailyLabel.evaluate((element) => getComputedStyle(element).fontWeight)).toBe('500');
    await expect
      .poll(() => encryptedLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(48, 49, 51)');
    await expect.poll(() => encryptedLabel.evaluate((element) => getComputedStyle(element).fontWeight)).toBe('400');
    await expect
      .poll(() => emergencyLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(48, 49, 51)');

    await emergencyControl.hover();
    await expect
      .poll(() => emergencyDot.evaluate((element) => getComputedStyle(element).borderColor))
      .toBe('rgb(0, 96, 169)');
    await expect
      .poll(() => emergencyLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(48, 49, 51)');

    await page.keyboard.press('ArrowRight');
    await expect(emergency).toBeChecked();
    await expect(page.locator('.lx-radio-demo__status')).toHaveText('响应等级 选中：应急处突');
    await expect(page.locator('.lx-radio-demo__status')).not.toContainText('emergency');
    await expect
      .poll(() => emergencyLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(0, 96, 169)');
    await expect.poll(() => emergencyLabel.evaluate((element) => getComputedStyle(element).fontWeight)).toBe('500');
    await expect.poll(() => emergencyDot.evaluate((element) => getComputedStyle(element).borderWidth)).toBe('2px');
    await expect.poll(() => dailyLabel.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(48, 49, 51)');
    const afterFocus = await dailyDot.boundingBox();
    expect(afterFocus?.width).toBe(beforeFocus?.width);
    expect(afterFocus?.height).toBe(beforeFocus?.height);

    await expect(disabled).toBeDisabled();
    await expect(disabled).not.toBeChecked();
    const disabledAppearance = await disabledControl.evaluate((element) => {
      const inner = element.querySelector('.el-radio__inner');
      const label = element.querySelector('.el-radio__label');
      return {
        borderColor: inner ? getComputedStyle(inner).borderColor : '',
        labelColor: label ? getComputedStyle(label).color : '',
      };
    });
    await disabledControl.hover();
    await expect
      .poll(() =>
        disabledControl.evaluate((element) => {
          const inner = element.querySelector('.el-radio__inner');
          const label = element.querySelector('.el-radio__label');
          return {
            borderColor: inner ? getComputedStyle(inner).borderColor : '',
            labelColor: label ? getComputedStyle(label).color : '',
          };
        }),
      )
      .toEqual(disabledAppearance);
    await expect(disabledControl.locator('.el-radio__label')).toHaveCSS('color', 'rgb(144, 147, 153)');
    await expect(checkedDisabled).toBeDisabled();
    await expect(checkedDisabled).toBeChecked();
    await expect(checkedDisabledLabel).toHaveCSS('color', 'rgb(144, 147, 153)');
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
      .poll(() => emergencyLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(56, 189, 248)');
    await expect
      .poll(() => encryptedLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(226, 232, 240)');
    await expect.poll(() => encryptedLabel.evaluate((element) => getComputedStyle(element).fontWeight)).toBe('400');
    await fiberControl.hover();
    await expect
      .poll(() => fiberDot.evaluate((element) => getComputedStyle(element).borderColor))
      .toBe('rgb(56, 189, 248)');
    await expect
      .poll(() => fiberLabel.evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(226, 232, 240)');

    await expect
      .poll(() =>
        disabledControl.locator('.el-radio__inner').evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe('rgb(22, 35, 58)');
    await expect
      .poll(() => disabledControl.locator('.el-radio__label').evaluate((element) => getComputedStyle(element).color))
      .toBe('rgb(148, 163, 184)');
    await expect(checkedDisabledLabel).toHaveCSS('color', 'rgb(148, 163, 184)');
    const disabledHudAppearance = await disabledControl.evaluate((element) => {
      const inner = element.querySelector('.el-radio__inner');
      const label = element.querySelector('.el-radio__label');
      return {
        borderColor: inner ? getComputedStyle(inner).borderColor : '',
        backgroundColor: inner ? getComputedStyle(inner).backgroundColor : '',
        labelColor: label ? getComputedStyle(label).color : '',
      };
    });
    await disabledControl.hover();
    await expect
      .poll(() =>
        disabledControl.evaluate((element) => {
          const inner = element.querySelector('.el-radio__inner');
          const label = element.querySelector('.el-radio__label');
          return {
            borderColor: inner ? getComputedStyle(inner).borderColor : '',
            backgroundColor: inner ? getComputedStyle(inner).backgroundColor : '',
            labelColor: label ? getComputedStyle(label).color : '',
          };
        }),
      )
      .toEqual(disabledHudAppearance);

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

  test('必填响应通道校验失败后可通过选择恢复', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxradio');
    const form = page.getByTestId('radio-validation-form');

    await form.getByRole('button', { name: '提交校验' }).click();
    await expect(form).toContainText('请选择一个响应通道');

    await form.getByRole('radio', { name: '应急处突' }).locator('xpath=ancestor::label[1]').click();
    await form.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByTestId('radio-validation-feedback')).toHaveText('响应通道校验通过');
    await expectClearedErrorRowsHidden(form);
    await expect(form.locator('.el-form-item__error')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });

  test('独立 LxRadio 通过共享模型同步选项并反馈 change', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxradio');

    const group = page.getByRole('group', { name: '响应网络（不使用 LxRadioGroup）' });
    const encrypted = group.getByRole('radio', { name: '高密加密专线' });
    const fiber = group.getByRole('radio', { name: '光纤骨干网' });

    await expect(encrypted).toBeChecked();
    await expect(fiber).not.toBeChecked();
    await encrypted.focus();
    await page.keyboard.press('ArrowRight');
    await expect(fiber).toBeChecked();
    await expect(encrypted).not.toBeChecked();
    await expect(page.locator('.lx-radio-demo__status')).toHaveText('独立响应网络 选中：光纤骨干网');
  });

  test('单选组级禁用与 LxForm 禁用继承保持生效', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxradio');
    await page.getByTestId('radio-advanced-examples').locator('summary').click();

    const disabledGroup = page.getByRole('radiogroup', { name: '整组禁用的响应等级' });
    await expect(disabledGroup.getByRole('radio', { name: '日常勤务' })).toBeDisabled();
    await expect(disabledGroup.getByRole('radio', { name: '日常勤务' })).toBeChecked();
    await expect(disabledGroup.getByRole('radio', { name: '应急处突' })).toBeDisabled();

    const inheritedGroup = page
      .getByTestId('radio-form-disabled')
      .getByRole('radiogroup', { name: '继承表单禁用的响应等级' });
    await expect(inheritedGroup.getByRole('radio', { name: '光纤骨干网' })).toBeDisabled();
    await expect(inheritedGroup.getByRole('radio', { name: '光纤骨干网' })).toBeChecked();
    await expect(inheritedGroup.getByRole('radio', { name: '卫星链路直通' })).toBeDisabled();
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
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
      });
      await page.goto('/components/lxradio');
      const first = page.getByRole('radiogroup', { name: '勤务响应等级' }).getByRole('radio', { name: '日常勤务' });
      const firstControl = first.locator('xpath=ancestor::label[1]');
      const second = page.getByRole('radiogroup', { name: '勤务响应等级' }).getByRole('radio', { name: '应急处突' });
      const secondControl = second.locator('xpath=ancestor::label[1]');
      const themeToggle = page.locator('.lx-radio-demo__theme-toggle');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      await expect.poll(async () => (await firstControl.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      await expect.poll(async () => (await themeToggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      const secondBounds = await secondControl.boundingBox();
      if (!secondBounds) throw new Error('无法读取单选项的触控区域');
      await page.touchscreen.tap(secondBounds.x + secondBounds.width / 2, secondBounds.y + secondBounds.height / 2);
      await expect(second).toBeChecked();
      await expect(page.locator('.lx-radio-demo__status')).toHaveText('响应等级 选中：应急处突');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
    } finally {
      await context.close();
    }
  });
});

for (const item of [
  {
    title: '复选框',
    path: '/components/lxcheckbox',
    propsHintId: 'lx-checkbox-props-hint',
    groupPropsHintId: 'lx-checkbox-group-props-hint',
    scrollableHintIds: [
      'lx-checkbox-props-hint',
      'lx-checkbox-group-props-hint',
      'lx-checkbox-events-hint',
      'lx-checkbox-slots-hint',
      'lx-checkbox-design-hint',
    ],
    shortOverflowHintIds: [],
  },
  {
    title: '单选框',
    path: '/components/lxradio',
    propsHintId: 'lx-radio-props-hint',
    groupPropsHintId: 'lx-radio-group-props-hint',
    scrollableHintIds: [
      'lx-radio-props-hint',
      'lx-radio-group-props-hint',
      'lx-radio-events-hint',
      'lx-radio-slots-hint',
      'lx-radio-design-hint',
    ],
    shortOverflowHintIds: [],
  },
]) {
  test(`${item.title}文档在375px下可浏览溢出表格并压缩禁用行`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(item.path);

    for (const hintId of item.scrollableHintIds) {
      const hint = page.locator(`#${hintId}`);
      const table = page.locator(`#${hintId} + table`);
      const minOverflowPx = hintId === 'lx-radio-slots-hint' ? 1 : 24;
      await expect(hint).toBeVisible();
      await expect(table).toHaveAttribute('aria-describedby', hintId);
      await expect(table).toHaveAttribute('tabindex', '0');

      const initialState = await table.evaluate((element) => {
        const firstColumn = element.querySelector('td:first-child');
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          firstColumnPosition: firstColumn ? getComputedStyle(firstColumn).position : 'missing',
        };
      });
      expect(initialState.scrollWidth - initialState.clientWidth).toBeGreaterThanOrEqual(minOverflowPx);
      if (hintId === 'lx-radio-slots-hint') {
        expect(initialState.scrollWidth - initialState.clientWidth).toBeLessThan(24);
      }
      expect(initialState.firstColumnPosition).toBe('sticky');

      await table.focus();
      await table.press('ArrowRight');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      const firstStep = await table.evaluate((element) => element.scrollLeft);
      const maxScrollLeft = initialState.scrollWidth - initialState.clientWidth;
      expect(firstStep).toBeGreaterThanOrEqual(Math.min(80, maxScrollLeft));
      expect(firstStep).toBeLessThanOrEqual(maxScrollLeft);

      const middleScroll = await table.evaluate((element) =>
        Math.min(120, (element.scrollWidth - element.clientWidth) / 2),
      );
      await table.evaluate((element, scrollLeft) => {
        element.scrollLeft = scrollLeft;
      }, middleScroll);
      await table.press('ArrowRight');
      await expect
        .poll(() => table.evaluate((element) => element.scrollLeft))
        .toBeGreaterThanOrEqual(middleScroll + Math.min(80, maxScrollLeft - middleScroll));
      const scrollAfterRight = await table.evaluate((element) => element.scrollLeft);
      await table.press('ArrowLeft');
      await expect
        .poll(() => table.evaluate((element) => element.scrollLeft))
        .toBeLessThanOrEqual(scrollAfterRight - Math.min(80, scrollAfterRight));

      await table.evaluate((element, scrollLeft) => {
        element.scrollLeft = scrollLeft;
      }, maxScrollLeft);
      await table.press('ArrowRight');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBe(maxScrollLeft);
      await table.evaluate((element) => {
        element.scrollLeft = 0;
      });
      await table.press('ArrowLeft');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBe(0);
    }

    for (const hintId of item.shortOverflowHintIds) {
      const hint = page.locator(`#${hintId}`);
      const table = page.locator(`#${hintId} + table`);
      await expect(hint).toBeHidden();
      await expect(table).not.toHaveAttribute('tabindex');
      await expect(table).not.toHaveAttribute('aria-describedby');

      const shortOverflowState = await table.evaluate((element) => {
        const firstCell = element.querySelector('td:first-child');
        return {
          overflowWidth: element.scrollWidth - element.clientWidth,
          firstColumnPosition: firstCell ? getComputedStyle(firstCell).position : 'missing',
        };
      });
      expect(shortOverflowState.overflowWidth).toBeGreaterThan(0);
      expect(shortOverflowState.overflowWidth).toBeLessThan(24);
      expect(shortOverflowState.firstColumnPosition).toBe('static');
    }

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth).toBe(375);

    const disabledRowHeights = await Promise.all(
      [item.propsHintId, item.groupPropsHintId].map(async (hintId) => {
        const table = page.locator(`#${hintId} + table`);
        return table
          .locator('tbody tr')
          .evaluateAll((rows) =>
            rows
              .filter((row) => row.querySelector('td:first-child')?.textContent?.trim() === 'disabled')
              .map((row) => row.getBoundingClientRect().height),
          );
      }),
    );
    expect(disabledRowHeights.flat()).toHaveLength(2);
    for (const height of disabledRowHeights.flat()) {
      expect(height).toBeLessThanOrEqual(96);
    }
  });
}

for (const item of [
  {
    title: '复选框',
    path: '/components/lxcheckbox',
    expandedTexts: [/--lx-color-info/, /标本 04“需支队审批”行/],
    groupExpandedText: /LxCheckboxGroup 继承 ElForm 的禁用状态/,
  },
  {
    title: '单选框',
    path: '/components/lxradio',
    expandedTexts: [/HUD 深色主题使用中性灰阶/],
    groupExpandedText: /LxRadioGroup 继承 ElForm 的禁用状态/,
  },
]) {
  test(`${item.title}禁用规则可由键盘展开且摘要高度与焦点样式正确`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(item.path);

    const details = page.locator('details.lx-selection-control-doc-details');
    const singleDetails = details.nth(0);
    const groupDetails = details.nth(1);
    const summary = singleDetails.locator('summary');
    await expect(details).toHaveCount(2);
    await expect(singleDetails).not.toHaveAttribute('open');
    await expect(groupDetails).not.toHaveAttribute('open');

    const summaryBox = await summary.boundingBox();
    expect(summaryBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await summary.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(summary).toBeFocused();

    const focusStyle = await summary.evaluate((element) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--lx-color-primary)';
      document.body.append(probe);
      const brandColor = getComputedStyle(probe).color;
      probe.remove();

      const style = getComputedStyle(element);
      return {
        visible: element.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        brandColor,
      };
    });
    expect(focusStyle.visible).toBe(true);
    expect(focusStyle.outlineStyle).toBe('solid');
    expect(focusStyle.outlineWidth).toBe('2px');
    expect(focusStyle.outlineColor).toBe(focusStyle.brandColor);

    await page.keyboard.press('Space');
    await expect(singleDetails).toHaveAttribute('open', '');
    for (const expandedText of item.expandedTexts) {
      await expect(singleDetails).toContainText(expandedText);
    }
    await expect(singleDetails).toContainText(/不阻断 Lx(?:Checkbox|Radio)Group \/ ElForm 的禁用继承/);
    await page.keyboard.press('Space');
    await expect(singleDetails).not.toHaveAttribute('open');
    await page.keyboard.press('Enter');
    await expect(singleDetails).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(singleDetails).not.toHaveAttribute('open');

    const groupSummary = groupDetails.locator('summary');
    await groupSummary.focus();
    await page.keyboard.press('Space');
    await expect(groupDetails).toHaveAttribute('open', '');
    await expect(groupDetails).toContainText(item.groupExpandedText);
    await page.keyboard.press('Space');
    await expect(groupDetails).not.toHaveAttribute('open');
  });
}

for (const item of [
  {
    title: '复选框',
    path: '/components/lxcheckbox',
    detailsTestId: 'checkbox-advanced-examples',
    hiddenTestIds: ['legacy', 'disabled-states', 'checkbox-group-disabled', 'checkbox-form-disabled'],
    controlLabelSelector: '.lx-checkbox .el-checkbox__label',
  },
  {
    title: '单选框',
    path: '/components/lxradio',
    detailsTestId: 'radio-advanced-examples',
    hiddenTestIds: ['readonly-history', 'legacy', 'radio-group-disabled', 'radio-form-disabled'],
    controlLabelSelector: '.lx-radio .el-radio__label',
  },
]) {
  test(`${item.title} Demo 辅助示例默认收起且可由键盘展开`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(item.path);

    const details = page.getByTestId(item.detailsTestId);
    const summary = details.locator('summary');
    await expect(details).not.toHaveAttribute('open');
    for (const testId of item.hiddenTestIds) {
      await expect(page.getByTestId(testId)).toBeHidden();
    }

    const summaryBox = await summary.boundingBox();
    expect(summaryBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expect(summary).toHaveCSS('font-size', '15px');

    await summary.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(summary).toBeFocused();
    await expect.poll(() => summary.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await page.keyboard.press('Space');
    await expect(details).toHaveAttribute('open', '');
    for (const testId of item.hiddenTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }

    await expect(details.locator('.lx-checkbox-demo__panel h3, .lx-radio-demo__panel h3').first()).toHaveCSS(
      'font-size',
      '15px',
    );
    await expect(details.locator('.lx-checkbox-demo__example h4, .lx-radio-demo__example h4').first()).toHaveCSS(
      'font-size',
      '14px',
    );
    await expect(details.locator(item.controlLabelSelector).first()).toHaveCSS('font-size', '12px');

    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open');
    for (const testId of item.hiddenTestIds) {
      await expect(page.getByTestId(testId)).toBeHidden();
    }
  });
}
