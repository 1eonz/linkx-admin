import { expect, test } from '@playwright/test';

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
    ],
    shortOverflowHintIds: ['lx-checkbox-design-hint'],
  },
  {
    title: '单选框',
    path: '/components/lxradio',
    propsHintId: 'lx-radio-props-hint',
    groupPropsHintId: 'lx-radio-group-props-hint',
    scrollableHintIds: ['lx-radio-props-hint', 'lx-radio-group-props-hint', 'lx-radio-events-hint'],
    shortOverflowHintIds: ['lx-radio-slots-hint', 'lx-radio-design-hint'],
  },
]) {
  test(`${item.title}文档在375px下可浏览溢出表格并压缩禁用行`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(item.path);

    for (const hintId of item.scrollableHintIds) {
      const hint = page.locator(`#${hintId}`);
      const table = page.locator(`#${hintId} + table`);
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
      expect(initialState.scrollWidth - initialState.clientWidth).toBeGreaterThanOrEqual(24);
      expect(initialState.firstColumnPosition).toBe('sticky');

      await table.focus();
      await table.press('ArrowRight');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

      const middleScroll = await table.evaluate((element) =>
        Math.min(120, (element.scrollWidth - element.clientWidth) / 2),
      );
      await table.evaluate((element, scrollLeft) => {
        element.scrollLeft = scrollLeft;
      }, middleScroll);
      await table.press('ArrowRight');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(middleScroll);
      const scrollAfterRight = await table.evaluate((element) => element.scrollLeft);
      await table.press('ArrowLeft');
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeLessThan(scrollAfterRight);
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
