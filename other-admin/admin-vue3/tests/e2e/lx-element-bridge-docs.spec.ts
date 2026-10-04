import { expect, test, type Locator } from '@playwright/test';

async function readControlFocusStyle(wrapper: Locator) {
  return wrapper.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      className: element.className,
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      borderStyle: style.borderStyle,
      outlineWidth: style.outlineWidth,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      outlineStyle: style.outlineStyle,
      outlineOffset: style.outlineOffset,
      transitionProperty: style.transitionProperty,
      focusHaloColor: style.getPropertyValue('--lx-control-focus-halo-color'),
      checkmarkColor: getComputedStyle(element, '::after').borderBottomColor,
      indeterminateColor: getComputedStyle(element, '::before').backgroundColor,
      width: rect.width,
      height: rect.height,
      boxSizing: style.boxSizing,
    };
  });
}

test.describe('lx-ui Element Plus 基础控件焦点样式', () => {
  test('输入、单选/多选下拉、数字、日期范围、文本域和复选框焦点贴合控件边界', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/element-bridge');

    const nameInput = page.getByRole('textbox', { name: /任务名称/ });
    const nameItem = page.locator('.el-form-item').filter({ hasText: '任务名称' });
    const nameWrapper = nameItem.locator('.el-input__wrapper');
    const departmentSelect = page.getByRole('combobox', { name: /责任部门/ });
    const departmentItem = page.locator('.el-form-item').filter({ hasText: '责任部门' });
    const departmentWrapper = departmentItem.locator('.el-select__wrapper');
    const departmentsSelect = page.getByRole('combobox', { name: /协同部门/ });
    const departmentsItem = page.locator('.el-form-item').filter({ hasText: '协同部门' });
    const departmentsWrapper = departmentsItem.locator('.el-select__wrapper');

    await page.getByRole('checkbox', { name: 'HUD 深色' }).focus();
    await page.keyboard.press('Tab');
    await expect(nameInput).toBeFocused();

    const nameBeforeFocus = await nameWrapper.boundingBox();
    await expect.poll(async () => (await readControlFocusStyle(nameWrapper)).boxShadow).toContain('0px 0px 0px 2px');
    const nameFocus = await readControlFocusStyle(nameWrapper);
    expect(nameFocus.className).toContain('is-focus');
    expect(nameFocus.outlineStyle).toBe('none');
    expect(nameFocus.outlineOffset).toBe('0px');
    expect(nameFocus.boxShadow).toContain('inset');
    expect(nameFocus.boxShadow, JSON.stringify(nameFocus)).toContain('0px 0px 0px 2px');
    expect(nameFocus.focusHaloColor).toContain('color-mix');
    expect(nameFocus.focusHaloColor).toContain('15%');
    expect(await nameWrapper.boundingBox()).toEqual(nameBeforeFocus);

    const selectBeforeFocus = await departmentWrapper.boundingBox();
    const selectIdle = await readControlFocusStyle(departmentWrapper);
    expect(selectIdle.borderWidth).toBe('1px');
    expect(selectIdle.borderStyle).toBe('solid');
    expect(selectIdle.boxShadow).toBe('none');
    await departmentSelect.focus();
    await expect(departmentWrapper).toHaveClass(/is-focused/);
    await expect.poll(async () => (await readControlFocusStyle(departmentWrapper)).borderColor).toBe('rgb(0, 96, 169)');
    const selectFocus = await readControlFocusStyle(departmentWrapper);
    expect(selectFocus.outlineStyle).toBe('none');
    expect(selectFocus.outlineOffset).toBe('0px');
    expect(selectFocus.borderWidth).toBe('1px');
    expect(selectFocus.borderStyle).toBe('solid');
    expect(selectFocus.boxShadow).toBe('none');
    expect(selectFocus.boxSizing).toBe('border-box');
    expect(selectFocus.transitionProperty).toBe('border-color, background-color, box-shadow');
    expect(await departmentWrapper.boundingBox()).toEqual(selectBeforeFocus);
    await page.keyboard.press('Escape');

    const departmentsBeforeFocus = await departmentsWrapper.boundingBox();
    const departmentsIdle = await readControlFocusStyle(departmentsWrapper);
    expect(departmentsIdle.borderWidth).toBe('1px');
    expect(departmentsIdle.borderStyle).toBe('solid');
    expect(departmentsIdle.boxShadow).toBe('none');
    await departmentsSelect.focus();
    await expect(departmentsWrapper).toHaveClass(/is-focused/);
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(0, 96, 169)');
    const departmentsFocus = await readControlFocusStyle(departmentsWrapper);
    expect(departmentsFocus.outlineStyle).toBe('none');
    expect(departmentsFocus.outlineOffset).toBe('0px');
    expect(departmentsFocus.borderWidth).toBe('1px');
    expect(departmentsFocus.borderStyle).toBe('solid');
    expect(departmentsFocus.boxShadow).toBe('none');
    expect(departmentsFocus.boxSizing).toBe('border-box');
    expect(departmentsFocus.transitionProperty).toBe('border-color, background-color, box-shadow');
    await departmentsSelect.press('Enter');
    await expect(departmentsSelect).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    expect(await departmentsWrapper.boundingBox()).toEqual(departmentsBeforeFocus);

    const notificationItem = page.locator('.el-form-item').filter({ hasText: '通知渠道' });
    const messageCheckbox = notificationItem.locator('.el-checkbox').filter({ hasText: '短信' });
    const checkboxOriginal = messageCheckbox.locator('.el-checkbox__original');
    const checkboxInner = messageCheckbox.locator('.el-checkbox__inner');
    const checkboxBeforeFocus = await checkboxInner.boundingBox();
    await checkboxOriginal.focus();
    await expect(messageCheckbox.locator('.el-checkbox__input')).toHaveClass(/is-focus/);
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).borderWidth).toBe('1px');
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).borderColor).toBe('rgb(0, 96, 169)');
    const checkboxFocus = await readControlFocusStyle(checkboxInner);
    expect(checkboxFocus.outlineStyle).toBe('none');
    expect(checkboxFocus.outlineOffset).toBe('0px');
    expect(checkboxFocus.boxShadow).toContain('0px 0px 0px 2px');
    expect(checkboxFocus.boxShadow).toContain('/ 0.15)');
    expect(checkboxFocus.borderWidth).toBe('1px');
    expect(checkboxFocus.borderRadius).toBe('2px');
    expect(await checkboxInner.boundingBox()).toEqual(checkboxBeforeFocus);

    const allChannels = notificationItem.locator('.el-checkbox').filter({ hasText: '全选通知渠道' });
    const allChannelsInput = allChannels.locator('.el-checkbox__original');
    const allChannelsInner = allChannels.locator('.el-checkbox__inner');
    const channelsGroup = notificationItem.locator('.el-checkbox-group');
    const allChannelsBox = await allChannels.boundingBox();
    const channelsGroupBox = await channelsGroup.boundingBox();
    if (!allChannelsBox || !channelsGroupBox) {
      throw new Error('通知渠道全选项或选项组没有可见布局');
    }
    expect(channelsGroupBox.y).toBeGreaterThan(allChannelsBox.y + allChannelsBox.height);
    expect(channelsGroupBox.x).toBeGreaterThan(allChannelsBox.x);
    await allChannelsInput.focus();
    await expect(allChannels.locator('.el-checkbox__input')).toHaveClass(/is-indeterminate/);
    await expect
      .poll(async () => (await readControlFocusStyle(allChannelsInner)).boxShadow)
      .toContain('0px 0px 0px 2px');
    expect((await readControlFocusStyle(allChannelsInner)).indeterminateColor).toBe('rgb(255, 255, 255)');

    const checkedCheckbox = notificationItem.locator('.el-checkbox').filter({ hasText: '电台' });
    const checkedInput = checkedCheckbox.locator('.el-checkbox__original');
    const checkedInner = checkedCheckbox.locator('.el-checkbox__inner');
    await checkedInput.focus();
    await expect(checkedCheckbox.locator('.el-checkbox__input')).toHaveClass(/is-checked/);
    await expect.poll(async () => (await readControlFocusStyle(checkedInner)).boxShadow).toContain('0px 0px 0px 2px');
    const checkedFocus = await readControlFocusStyle(checkedInner);
    expect(checkedFocus.borderWidth).toBe('1px');
    expect(checkedFocus.checkmarkColor).toBe('rgb(255, 255, 255)');

    const durationItem = page.locator('.el-form-item').filter({ hasText: '持续时间（分钟）' });
    const durationInput = durationItem.locator('.el-input__inner');
    const durationWrapper = durationItem.locator('.el-input__wrapper');
    const durationBeforeFocus = await durationWrapper.boundingBox();
    await durationInput.focus();
    await expect(durationWrapper).toHaveClass(/is-focus/);
    await expect
      .poll(async () => (await readControlFocusStyle(durationWrapper)).boxShadow)
      .toContain('0px 0px 0px 2px');
    const durationFocus = await readControlFocusStyle(durationWrapper);
    expect(durationFocus.outlineStyle).toBe('none');
    expect(durationFocus.boxShadow).toContain('inset');
    expect(durationFocus.focusHaloColor).toBe(nameFocus.focusHaloColor);
    expect(await durationWrapper.boundingBox()).toEqual(durationBeforeFocus);

    const dateItem = page.locator('.el-form-item').filter({ hasText: '执行日期' });
    const dateRange = dateItem.locator('.el-range-editor');
    const dateInput = dateItem.locator('.el-range-input').first();
    const dateBeforeFocus = await dateRange.boundingBox();
    await dateInput.focus();
    await expect(dateRange).toHaveClass(/is-active/);
    await expect.poll(async () => (await readControlFocusStyle(dateRange)).boxShadow).toContain('0px 0px 0px 2px');
    const dateFocus = await readControlFocusStyle(dateRange);
    expect(dateFocus.outlineStyle).toBe('none');
    expect(dateFocus.boxShadow).toContain('inset');
    expect(dateFocus.boxShadow).toContain('0px 0px 0px 2px');
    expect(dateFocus.focusHaloColor).toBe(nameFocus.focusHaloColor);
    expect(await dateRange.boundingBox()).toEqual(dateBeforeFocus);
    await page.keyboard.press('Escape');

    // LxCheckbox 保留 EP 的隐藏原生 input，使用语义 label 触发而不是直接 check 隐藏 input。
    await page.getByText('HUD 深色', { exact: true }).click();
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).backgroundColor).toBe('rgb(11, 18, 32)');
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).borderColor).toBe('rgb(148, 163, 184)');
    const darkMessageIdle = await readControlFocusStyle(checkboxInner);
    expect(darkMessageIdle.backgroundColor).toBe('rgb(11, 18, 32)');
    expect(darkMessageIdle.borderColor).toBe('rgb(148, 163, 184)');
    await checkboxOriginal.focus();
    await expect(messageCheckbox.locator('.el-checkbox__input')).toHaveClass(/is-focus/);
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).borderColor).toBe('rgb(56, 189, 248)');
    await expect.poll(async () => (await readControlFocusStyle(checkboxInner)).boxShadow).toContain('/ 0.15)');
    const darkMessageFocus = await readControlFocusStyle(checkboxInner);
    expect(darkMessageFocus.borderColor).toBe('rgb(56, 189, 248)');
    expect(darkMessageFocus.boxShadow).toContain('color(srgb 0.219608 0.741176 0.972549 / 0.15)');
    await checkedInput.focus();
    await expect.poll(async () => (await readControlFocusStyle(checkedInner)).boxShadow).toContain('0px 0px 0px 2px');
    await expect.poll(async () => (await readControlFocusStyle(checkedInner)).borderColor).toBe('rgb(56, 189, 248)');
    const darkCheckboxFocus = await readControlFocusStyle(checkedInner);
    expect(darkCheckboxFocus.borderColor).toBe('rgb(56, 189, 248)');
    expect(darkCheckboxFocus.checkmarkColor).toBe('rgb(255, 255, 255)');
    expect(darkCheckboxFocus.boxShadow).toContain('color(srgb 0.219608 0.741176 0.972549 / 0.15)');
    await departmentsSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(56, 189, 248)');
    const darkDepartmentsFocus = await readControlFocusStyle(departmentsWrapper);
    expect(darkDepartmentsFocus.outlineStyle).toBe('none');
    expect(darkDepartmentsFocus.outlineOffset).toBe('0px');
    expect(darkDepartmentsFocus.borderWidth).toBe('1px');
    expect(darkDepartmentsFocus.borderStyle).toBe('solid');
    expect(darkDepartmentsFocus.boxShadow).toBe('none');
    expect(darkDepartmentsFocus.width).toBe(departmentsFocus.width);
    expect(darkDepartmentsFocus.height).toBe(departmentsFocus.height);
    await dateInput.focus();
    await expect.poll(async () => (await readControlFocusStyle(dateRange)).boxShadow).toContain('0px 0px 0px 2px');
    const darkDateFocus = await readControlFocusStyle(dateRange);
    expect(darkDateFocus.outlineStyle).toBe('none');
    expect(darkDateFocus.boxShadow).toContain('0px 0px 0px 2px');
    expect(darkDateFocus.width).toBe(dateFocus.width);
    expect(darkDateFocus.height).toBe(dateFocus.height);
    await page.keyboard.press('Escape');
    await page.getByText('HUD 深色', { exact: true }).click();

    const remarkItem = page.locator('.el-form-item').filter({ hasText: '备注' });
    const remarkTextarea = remarkItem.locator('.el-textarea__inner');
    const textareaBeforeFocus = await remarkTextarea.boundingBox();
    await remarkTextarea.focus();
    await expect.poll(async () => (await readControlFocusStyle(remarkTextarea)).boxShadow).toContain('0px 0px 0px 2px');
    const textareaFocus = await readControlFocusStyle(remarkTextarea);
    expect(textareaFocus.outlineStyle).toBe('none');
    expect(textareaFocus.boxShadow).toContain('inset');
    expect(textareaFocus.focusHaloColor).toBe(nameFocus.focusHaloColor);
    expect(await remarkTextarea.boundingBox()).toEqual(textareaBeforeFocus);

    await page.getByRole('button', { name: '校验表单' }).click();
    await expect(nameItem).toHaveClass(/is-error/);
    await expect(departmentItem).toHaveClass(/is-error/);

    await nameInput.focus();
    await expect.poll(async () => (await readControlFocusStyle(nameWrapper)).boxShadow).toContain('0px 0px 0px 2px');
    const errorInputFocus = await readControlFocusStyle(nameWrapper);
    expect(errorInputFocus.outlineStyle).toBe('none');
    expect(errorInputFocus.boxShadow).toContain('inset');
    expect(errorInputFocus.boxShadow).toContain('0px 0px 0px 2px');
    expect(errorInputFocus.focusHaloColor).toBe(nameFocus.focusHaloColor);

    await departmentSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentWrapper)).borderColor)
      .toBe('rgb(186, 26, 26)');
    const errorSelectFocus = await readControlFocusStyle(departmentWrapper);
    expect(errorSelectFocus.outlineStyle).toBe('none');
    expect(errorSelectFocus.outlineOffset).toBe('0px');
    expect(errorSelectFocus.borderWidth).toBe('1px');
    expect(errorSelectFocus.boxShadow).toBe('none');

    await page
      .locator('.el-form')
      .first()
      .evaluate((element) => element.classList.add('lx-form'));
    await departmentsItem.evaluate((element) => element.classList.add('is-error'));
    await departmentsSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(186, 26, 26)');
    const errorDepartmentsFocus = await readControlFocusStyle(departmentsWrapper);
    expect(errorDepartmentsFocus.outlineStyle).toBe('none');
    expect(errorDepartmentsFocus.outlineOffset).toBe('0px');
    expect(errorDepartmentsFocus.borderWidth).toBe('1px');
    expect(errorDepartmentsFocus.boxShadow).toBe('none');
    await page.getByText('HUD 深色', { exact: true }).click();
    await departmentsSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(247, 137, 137)');
    expect((await readControlFocusStyle(departmentsWrapper)).boxShadow).toBe('none');
    expect((await readControlFocusStyle(departmentsWrapper)).outlineStyle).toBe('none');
    expect((await readControlFocusStyle(departmentsWrapper)).transitionProperty).toBe(
      'border-color, background-color, box-shadow',
    );
    await page.getByText('HUD 深色', { exact: true }).click();
    await departmentsItem.evaluate((element) => element.classList.remove('is-error'));

    await page.setViewportSize({ width: 375, height: 844 });
    await departmentSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentWrapper)).borderColor)
      .toBe('rgb(186, 26, 26)');
    const mobileSelectFocus = await readControlFocusStyle(departmentWrapper);
    expect(mobileSelectFocus.outlineStyle).toBe('none');
    expect(mobileSelectFocus.outlineOffset).toBe('0px');
    expect(mobileSelectFocus.borderWidth).toBe('1px');
    expect(mobileSelectFocus.boxShadow).toBe('none');
    await page.keyboard.press('Escape');

    const mobileDepartmentsBefore = await departmentsWrapper.boundingBox();
    await departmentsSelect.focus();
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(0, 96, 169)');
    const mobileDepartmentsFocus = await readControlFocusStyle(departmentsWrapper);
    expect(mobileDepartmentsFocus.outlineStyle).toBe('none');
    expect(mobileDepartmentsFocus.outlineOffset).toBe('0px');
    expect(mobileDepartmentsFocus.borderWidth).toBe('1px');
    expect(mobileDepartmentsFocus.boxShadow).toBe('none');
    const mobileDepartmentsAfter = await departmentsWrapper.boundingBox();
    expect(mobileDepartmentsAfter?.x).toBe(mobileDepartmentsBefore?.x);
    expect(mobileDepartmentsAfter?.width).toBe(mobileDepartmentsBefore?.width);
    expect(mobileDepartmentsAfter?.height).toBe(mobileDepartmentsBefore?.height);
    await departmentsItem.evaluate((element) => element.classList.add('is-error'));
    await expect
      .poll(async () => (await readControlFocusStyle(departmentsWrapper)).borderColor)
      .toBe('rgb(186, 26, 26)');
    expect((await readControlFocusStyle(departmentsWrapper)).outlineStyle).toBe('none');
    expect((await readControlFocusStyle(departmentsWrapper)).boxShadow).toBe('none');
    const mobileDepartmentsError = await departmentsWrapper.boundingBox();
    expect(mobileDepartmentsError?.x).toBe(mobileDepartmentsBefore?.x);
    expect(mobileDepartmentsError?.width).toBe(mobileDepartmentsBefore?.width);
    expect(mobileDepartmentsError?.height).toBe(mobileDepartmentsBefore?.height);
    await departmentsItem.evaluate((element) => element.classList.remove('is-error'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
