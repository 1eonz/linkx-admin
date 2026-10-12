import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 文档 Demo 仅运行本地交互，阻止意外的外部请求。
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('Select 可见标签关联真实输入，并支持键盘选择', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  for (const name of [
    '布控等级',
    '处置通道（可清空）',
    '协同单位',
    '指挥中心（可过滤）',
    '值班警员',
    '应急链路（锁定）',
  ]) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }

  const center = demo.getByLabel('指挥中心（可过滤）', { exact: true });
  await center.focus();
  await center.press('ArrowDown');
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  await expect(popper).toBeVisible();
  await center.press('ArrowDown');
  await center.press('Enter');
  await expect(demo.locator('.lx-select-demo__status')).toContainText('指挥中心 已选：');
  await expect(popper).toBeHidden();
  await expect(demo.getByLabel('应急链路（锁定）', { exact: true })).toBeDisabled();
});

test('Input 标签、尺寸、清空、键盘焦点与窄屏主题状态可用', async ({ page }) => {
  await page.goto('/components/lxinput');
  const demo = page.locator('.lx-input-demo');
  const name = demo.getByLabel('警员姓名 / 警号', { exact: true });
  const size = demo.getByLabel('输入框尺寸档', { exact: true });
  const inputRoot = name.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]',
  );
  const counterRoot = demo.locator('.lx-input-demo__validation-form .lx-input');
  const addons = demo.locator('.lx-input .el-input-group__prepend, .lx-input .el-input-group__append');
  const validationInput = demo.locator('#demo-phone');
  const validationItem = validationInput.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " el-form-item ")]',
  );
  const validationError = validationItem.locator('.el-form-item__error');

  await expect(name).toHaveCount(1);
  await expect(name).toHaveValue('张文远');
  await expect(name).toHaveAttribute('name', 'officerName');
  await expect(demo.locator('[data-testid="states"] .lx-input-demo__field')).toHaveCount(4);
  await expect(demo.locator('[data-testid="validation"] .lx-input-demo__field')).toHaveCount(2);
  for (const [option, expectedHeight] of [
    ['sm', 28],
    ['md', 32],
    ['lg', 40],
  ] as const) {
    await size.selectOption(option);
    await expect(inputRoot).toHaveClass(new RegExp(`lx-input--${option}`));
    const geometry = await inputRoot.locator('.el-input__wrapper').evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      token: getComputedStyle(element).getPropertyValue('--el-input-height').trim(),
    }));
    expect(geometry.height, `${option} 档外框高度不匹配：${JSON.stringify(geometry)}`).toBe(expectedHeight);
  }

  const counter = counterRoot.locator('.el-input__count-inner');
  await expect(counter).toBeVisible();
  const getInputCounterContrast = () =>
    counter.evaluate((element) => {
      const luminance = (color: string) => {
        const rgb = color
          .match(/[\d.]+/g)
          ?.map(Number)
          .slice(0, 3);
        if (!rgb || rgb.length !== 3) throw new Error(`无法解析颜色值：${color}`);
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const parseColor = (color: string) => {
        const channels = color.match(/[\d.]+/g)?.map(Number);
        if (!channels || channels.length < 3) throw new Error(`无法解析颜色值：${color}`);
        return { rgb: channels.slice(0, 3), alpha: channels[3] ?? 1 };
      };
      const backgrounds: Array<{ rgb: number[]; alpha: number; source: string }> = [];
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const background = parseColor(getComputedStyle(ancestor).backgroundColor);
        if (background.alpha > 0) {
          const className = typeof ancestor.className === 'string' ? ancestor.className : '';
          backgrounds.push({ ...background, source: `${ancestor.tagName}.${className}` });
        }
        if (background.alpha >= 1) break;
      }
      let visibleBackground: number[] = [255, 255, 255];
      for (let index = backgrounds.length - 1; index >= 0; index -= 1) {
        const layer = backgrounds[index];
        visibleBackground = layer.rgb.map(
          (channel, channelIndex) => channel * layer.alpha + visibleBackground[channelIndex] * (1 - layer.alpha),
        );
      }
      const foregroundColor = getComputedStyle(element).color;
      const backgroundColor = `rgb(${visibleBackground.join(', ')})`;
      const foreground = luminance(foregroundColor);
      const background = luminance(backgroundColor);
      return {
        ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        foregroundColor,
        backgroundColor,
        backgroundLayers: backgrounds.map(({ source, rgb, alpha }) => ({ source, rgb, alpha })),
      };
    });
  const lightCounterContrast = await getInputCounterContrast();
  expect(lightCounterContrast.ratio, JSON.stringify(lightCounterContrast)).toBeGreaterThanOrEqual(4.5);
  const getContrastRatios = (elements: typeof addons) =>
    elements.evaluateAll((nodes) => {
      const luminance = (rgb: number[]) => {
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const parseColor = (color: string) => {
        const channels = color.match(/[\d.]+/g)?.map(Number);
        if (!channels || channels.length < 3) throw new Error(`无法解析颜色值：${color}`);
        return { rgb: channels.slice(0, 3), alpha: channels[3] ?? 1 };
      };

      return nodes.map((element) => {
        const foreground = luminance(parseColor(getComputedStyle(element).color).rgb);
        const backgrounds: Array<{ rgb: number[]; alpha: number }> = [];
        for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
          const background = parseColor(getComputedStyle(ancestor).backgroundColor);
          if (background.alpha > 0) backgrounds.push(background);
          if (background.alpha >= 1) break;
        }
        let visibleBackground = [255, 255, 255];
        for (let index = backgrounds.length - 1; index >= 0; index -= 1) {
          const layer = backgrounds[index];
          visibleBackground = layer.rgb.map(
            (channel, channelIndex) => channel * layer.alpha + visibleBackground[channelIndex] * (1 - layer.alpha),
          );
        }
        const background = luminance(visibleBackground);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
    });
  const note = demo.locator('.lx-input-demo__note');
  const lightAddonContrast = await getContrastRatios(addons);
  expect(lightAddonContrast).toHaveLength(2);
  expect(lightAddonContrast.every((ratio) => ratio >= 4.5)).toBe(true);
  const lightNoteContrast = await getContrastRatios(note);
  expect(lightNoteContrast).toHaveLength(1);
  expect(lightNoteContrast[0]).toBeGreaterThanOrEqual(4.5);
  const disabledInput = demo.locator('#demo-node');
  const disabledLabel = demo.locator('label[for="demo-node"]');
  const readableInputs = demo.locator('#demo-officer-name, #demo-officer-id, #demo-readonly-note');
  await expect(validationItem).toHaveClass(/is-error/);
  await expect(validationError).toBeVisible();
  const lightValidationInputContrast = await getContrastRatios(validationInput);
  const lightValidationErrorContrast = await getContrastRatios(validationError);
  expect(lightValidationInputContrast).toHaveLength(1);
  expect(lightValidationInputContrast[0]).toBeGreaterThanOrEqual(4.5);
  expect(lightValidationErrorContrast).toHaveLength(1);
  expect(lightValidationErrorContrast[0]).toBeGreaterThanOrEqual(4.5);
  const disabledContrast = await getContrastRatios(disabledInput);
  expect(disabledContrast).toHaveLength(1);
  expect(disabledContrast[0]).toBeGreaterThanOrEqual(4.5);
  const lightDisabledLabelContrast = await getContrastRatios(disabledLabel);
  expect(lightDisabledLabelContrast).toHaveLength(1);
  expect(lightDisabledLabelContrast[0], JSON.stringify(lightDisabledLabelContrast)).toBeGreaterThanOrEqual(4.5);
  await expect(
    disabledInput.locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " el-input__wrapper ")]',
    ),
  ).toHaveCSS('opacity', '1');
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  const hudCounterContrast = await getInputCounterContrast();
  expect(hudCounterContrast.ratio, JSON.stringify(hudCounterContrast)).toBeGreaterThanOrEqual(4.5);
  const hudAddonContrast = await getContrastRatios(addons);
  expect(hudAddonContrast).toHaveLength(2);
  expect(hudAddonContrast.every((ratio) => ratio >= 4.5)).toBe(true);
  const hudNoteContrast = await getContrastRatios(note);
  expect(hudNoteContrast).toHaveLength(1);
  expect(hudNoteContrast[0]).toBeGreaterThanOrEqual(4.5);
  const hudDisabledContrast = await getContrastRatios(disabledInput);
  expect(hudDisabledContrast).toHaveLength(1);
  expect(hudDisabledContrast[0]).toBeGreaterThanOrEqual(4.5);
  const hudDisabledLabelContrast = await getContrastRatios(disabledLabel);
  expect(hudDisabledLabelContrast).toHaveLength(1);
  expect(hudDisabledLabelContrast[0], JSON.stringify(hudDisabledLabelContrast)).toBeGreaterThanOrEqual(4.5);
  const hudReadableContrast = await getContrastRatios(readableInputs);
  expect(hudReadableContrast).toHaveLength(3);
  expect(
    hudReadableContrast.every((ratio) => ratio >= 4.5),
    JSON.stringify(hudReadableContrast),
  ).toBe(true);
  await expect(validationItem).toHaveClass(/is-error/);
  const hudValidationInputContrast = await getContrastRatios(validationInput);
  const hudValidationErrorContrast = await getContrastRatios(validationError);
  expect(hudValidationInputContrast).toHaveLength(1);
  expect(hudValidationInputContrast[0], JSON.stringify(hudValidationInputContrast)).toBeGreaterThanOrEqual(4.5);
  expect(hudValidationErrorContrast).toHaveLength(1);
  expect(hudValidationErrorContrast[0], JSON.stringify(hudValidationErrorContrast)).toBeGreaterThanOrEqual(4.5);

  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(false);
  const lightReadableContrast = await getContrastRatios(readableInputs);
  expect(lightReadableContrast).toHaveLength(3);
  expect(
    lightReadableContrast.every((ratio) => ratio >= 4.5),
    JSON.stringify(lightReadableContrast),
  ).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  const toolbarLabels = demo.locator('.lx-input-demo__toolbar label');
  const toolbarSelect = demo.locator('.lx-input-demo__toolbar select');
  const toolbarLabelHeights = await toolbarLabels.evaluateAll((labels) =>
    labels.map((label) => label.getBoundingClientRect().height),
  );
  expect(toolbarLabelHeights).toHaveLength(2);
  expect(toolbarLabelHeights.every((height) => height >= 44)).toBe(true);
  expect(await toolbarSelect.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await size.selectOption('md');
  await name.focus();
  await expect(name).toBeFocused();
  const focusWrapper = inputRoot.locator('.el-input__wrapper');
  await expect
    .poll(() => focusWrapper.evaluate((element) => getComputedStyle(element).boxShadow))
    .toContain('0px 0px 0px 2px');
  await name.fill('张文远');
  await name.locator('xpath=..').hover();
  const clearButton = inputRoot.getByRole('button', { name: '清空输入框', exact: true });
  await expect(clearButton).toBeVisible();
  await clearButton.click();
  await expect(name).toHaveValue('');
  await expect(demo.locator('.lx-input-demo__status')).toContainText('已清空');
  await expect(demo.getByLabel('所属分局系统节点（禁用）', { exact: true })).toBeDisabled();
  const inheritedDisabled = demo.locator('#demo-form-disabled');
  await expect(inheritedDisabled).toBeDisabled();
  await expect(demo.locator('[data-testid="inherited-disabled"] button[aria-label="清空输入框"]')).toBeDisabled();
  await expect(demo.locator('[data-testid="inherited-disabled"] button[aria-label="清空输入框"]')).toHaveAttribute(
    'tabindex',
    '-1',
  );

  await page.setViewportSize({ width: 320, height: 812 });
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  await expect(name).toBeVisible();
  expect(await demo.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('Input 必填语义、只读/禁用差异、公开方法与示例值隔离正确', async ({ page }) => {
  await page.goto('/components/lxinput');
  const demo = page.locator('.lx-input-demo');
  const name = demo.getByLabel('警员姓名 / 警号', { exact: true });
  const officerId = demo.getByLabel('身份标识编码', { exact: false });
  const caseCode = demo.getByLabel('案件编码', { exact: true });
  const password = demo.getByLabel('涉密核验口令', { exact: true });
  const phone = demo.getByLabel('联系电话', { exact: true });
  const disabledNode = demo.getByLabel('所属分局系统节点（禁用）', { exact: true });
  const readonlyNote = demo.getByLabel('归档说明（只读，可选择复制）', { exact: true });

  await expect(officerId).toHaveAttribute('required', '');
  await expect(demo.locator('.lx-input-demo__required')).toHaveAttribute('aria-hidden', 'true');
  await expect(disabledNode).toBeDisabled();
  await expect(disabledNode).not.toHaveAttribute('readonly');
  await expect(readonlyNote).toHaveAttribute('readonly', '');
  await expect(readonlyNote).toBeEnabled();
  await readonlyNote.selectText();
  expect(await readonlyNote.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(0);

  await name.fill('王明');
  await expect(caseCode).toHaveValue('2026-0001');
  await expect(password).toHaveValue('');
  await expect(phone).toHaveAttribute('inputmode', 'tel');

  const caseCodeRoot = caseCode.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]',
  );
  await expect(caseCodeRoot.locator('.el-input__prefix .lx-icon')).toBeVisible();
  await expect(caseCodeRoot.locator('.el-input__suffix .lx-icon')).toBeVisible();
  await expect(caseCodeRoot.locator('.el-input-group__prepend')).toContainText('AJ');
  await expect(caseCodeRoot.locator('.el-input-group__append')).toContainText('号');

  await demo.getByRole('button', { name: '聚焦（focus）' }).click();
  await expect(name).toBeFocused();
  await name.fill('330106');
  await demo.getByRole('button', { name: '全选（select）' }).click();
  expect(await name.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([
    0, 6,
  ]);
  await demo.getByRole('button', { name: '失焦（blur）' }).click();
  await expect(name).not.toBeFocused();
});

test('Input 清除按钮支持键盘操作，校验提示在桌面和窄屏不重叠', async ({ page }) => {
  await page.goto('/components/lxinput');
  const demo = page.locator('.lx-input-demo');
  const name = demo.getByLabel('警员姓名 / 警号', { exact: true });
  const clear = demo.getByRole('button', { name: '清空输入框', exact: true });

  await name.fill('待清除的警员姓名');
  await expect(clear).toBeVisible();
  await name.press('Tab');
  await expect(clear).toBeFocused();
  await page.keyboard.press('Space');
  await expect(name).toHaveValue('');
  await expect(name).toBeFocused();
  await expect(demo.locator('.lx-input-demo__status')).toContainText('已清空');

  const error = demo.locator('.lx-input-demo__validation-form .el-form-item__error');
  const helper = demo.getByText('改为 11 位手机号后，错误提示会清除。', { exact: true });
  const validationInput = demo.locator('#demo-phone');
  const validationInputRoot = validationInput.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]',
  );
  await validationInput.focus();
  const errorFocusWrapper = validationInputRoot.locator('.el-input__wrapper');
  await expect
    .poll(() => errorFocusWrapper.evaluate((element) => getComputedStyle(element).boxShadow))
    .toContain('0px 0px 0px 2px');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const [errorBox, helperBox] = await Promise.all([error.boundingBox(), helper.boundingBox()]);
    expect(errorBox, '宽度 ' + width + 'px 时应显示表单错误').not.toBeNull();
    expect(helperBox, '宽度 ' + width + 'px 时应显示校验说明').not.toBeNull();
    expect(errorBox!.y + errorBox!.height).toBeLessThanOrEqual(helperBox!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }

  await page.setViewportSize({ width: 320, height: 900 });
  await name.fill('窄屏触控目标');
  await name.focus();
  const clearBox = await clear.boundingBox();
  expect(clearBox?.width).toBeGreaterThanOrEqual(44);
  expect(clearBox?.height).toBeGreaterThanOrEqual(44);

  const statesPanel = demo.locator('[data-testid="states"]');
  const layout = await statesPanel.evaluate((panel) => {
    const input = panel.querySelector<HTMLElement>('.lx-input');
    if (!input) throw new Error('找不到状态示例中的输入框');
    const style = getComputedStyle(panel);
    const panelContentRight =
      panel.getBoundingClientRect().right -
      Number.parseFloat(style.borderRightWidth) -
      Number.parseFloat(style.paddingRight);

    return { inputRight: input.getBoundingClientRect().right, panelContentRight };
  });
  expect(layout.inputRight).toBeLessThanOrEqual(layout.panelContentRight + 0.5);
});

test('DatePicker 双输入各有标签，自定义日期与导航插槽保留内核选择', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  for (const name of ['布控生效日期', '月份选择（月度复盘）', '专项复盘日期', '告警汇聚窗口']) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }
  for (const name of ['专项布控日期区间', '研判时间范围', '省厅锁定区间', '归档区间']) {
    const start = demo.getByLabel(`${name}开始日期`, { exact: true });
    const end = demo.getByLabel(`${name}结束日期`, { exact: true });
    await expect(start).toHaveCount(1);
    await expect(end).toHaveCount(1);
    expect(await start.getAttribute('id')).not.toBe(await end.getAttribute('id'));
  }
  await expect(demo.locator('[data-testid="shortcuts"] .el-range-separator')).toHaveCount(0);
  await expect(demo.locator('[data-testid="shortcuts"] .el-range-input').first()).toHaveValue('2026-09-15');

  const annotated = demo.getByLabel('专项复盘日期', { exact: true });
  await annotated.click();
  const popper = page.locator('.lx-date-picker__popper:visible');
  await expect(popper.locator('.lx-icon[data-icon-name="chevron-left"]')).toBeVisible();
  await expect(popper.locator('.lx-icon[data-icon-name="chevron-right"]')).toBeVisible();
  await expect(popper.getByRole('img', { name: '专项复盘' })).toBeVisible();
  await popper
    .locator('td.available')
    .filter({ has: page.locator('.el-date-table-cell__text', { hasText: /^16$/ }) })
    .click();
  await expect(annotated).toHaveValue('2026-09-16');
  await expect(popper).toBeHidden();

  const effective = demo.getByLabel('布控生效日期', { exact: true });
  await effective.focus();
  await effective.press('ArrowDown');
  await expect(page.locator('.lx-date-picker__popper:visible')).toBeVisible();
  await effective.press('Escape');
  await expect(page.locator('.lx-date-picker__popper:visible')).toHaveCount(0);
});

test('InputNumber 全部可见标签关联原生数值输入，键盘步进保留边界', async ({ page }) => {
  await page.goto('/components/lxinputnumber');
  const demo = page.locator('.lx-input-number-demo');
  const names = [
    '巡逻车组配置配额（步长 1）',
    '告警确认时限（分钟，步长 5）',
    '最高并发处警上限',
    '灵敏度系数（0.1 步长）',
    '无步进钮形态（controls=false）',
    '紧凑档 sm',
    '基准档 md（默认）',
    '宽松档 lg',
    '省厅锁定配额（禁用）',
  ];
  for (const name of names) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }
  const quota = demo.getByLabel('巡逻车组配置配额（步长 1）', { exact: true });
  const timeout = demo.getByLabel('告警确认时限（分钟，步长 5）', { exact: true });
  const quotaRoot = quota.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " el-input-number ")][1]',
  );
  const quotaIncrease = quotaRoot.locator('.lx-input-number__stepper-button--increase');
  const quotaDecrease = quotaRoot.locator('.lx-input-number__stepper-button--decrease');
  await expect(quota).toHaveValue('30');
  await expect(quota).toHaveAttribute('name', 'patrolQuota');
  await expect(quotaIncrease).toHaveAttribute('aria-label', '增加数值');
  await expect(quotaIncrease).toHaveAttribute('aria-disabled', 'false');
  await expect(quotaIncrease).toHaveAttribute('tabindex', '0');
  await expect(timeout).toHaveValue('30');
  await quota.fill('31');
  await expect(timeout).toHaveValue('30');
  await expect(demo.getByLabel('紧凑档 sm', { exact: true })).toHaveValue('30');
  await timeout.fill('35');
  await expect(quota).toHaveValue('31');
  const limit = demo.getByLabel('最高并发处警上限', { exact: true });
  await expect(limit).toHaveValue('100');
  const limitRoot = limit.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " el-input-number ")][1]',
  );
  await expect(limit).toHaveAttribute('readonly', '');
  await expect(limit).not.toBeEditable();
  await expect(limitRoot.locator('.lx-input-number__stepper-button--increase')).toBeDisabled();
  await expect(limitRoot.locator('.lx-input-number__stepper-button--increase')).toHaveAttribute('tabindex', '-1');
  const limitDecrease = limitRoot.locator('.lx-input-number__stepper-button--decrease');
  await expect(limitDecrease).toBeEnabled();
  await limitDecrease.click();
  await expect(limit).toHaveValue('99');
  await expect(limitRoot.locator('.lx-input-number__stepper-button--increase')).toBeEnabled();
  await expect(demo.getByLabel('省厅锁定配额（禁用）', { exact: true })).toBeDisabled();

  await quota.focus();
  await page.keyboard.press('Tab');
  await expect(quotaIncrease).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(quotaDecrease).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(timeout).toBeFocused();

  await quotaIncrease.focus();
  await page.keyboard.press('Enter');
  await expect(quota).toHaveValue('32');
  await page.keyboard.press('Space');
  await expect(quota).toHaveValue('33');

  const beforeRepeat = Number(await quota.inputValue());
  const increaseBox = await quotaIncrease.boundingBox();
  if (!increaseBox) throw new Error('增加按钮未呈现可测量区域');
  await page.mouse.move(increaseBox.x + increaseBox.width / 2, increaseBox.y + increaseBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(750);
  await page.mouse.up();
  await expect.poll(async () => Number(await quota.inputValue())).toBeGreaterThan(beforeRepeat + 1);

  const sizeControls = demo.locator('[data-testid="sizes"] .el-input-number');
  for (const index of [0, 1, 2]) {
    const geometry = await sizeControls.nth(index).evaluate((element) => {
      const increase = element.querySelector<HTMLElement>('.lx-input-number__stepper-button--increase');
      const decrease = element.querySelector<HTMLElement>('.lx-input-number__stepper-button--decrease');
      const wrapper = element.querySelector<HTMLElement>('.el-input__wrapper');
      if (!increase || !decrease || !wrapper) throw new Error('尺寸示例缺少步进按钮或输入框');
      return {
        increaseBottom: increase.getBoundingClientRect().bottom,
        decreaseTop: decrease.getBoundingClientRect().top,
        controlHeight: element.getBoundingClientRect().height,
        wrapperHeight: wrapper.getBoundingClientRect().height,
      };
    });
    expect(Math.abs(geometry.increaseBottom - geometry.decreaseTop)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.controlHeight - [28, 32, 40][index])).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.wrapperHeight - [28, 32, 40][index])).toBeLessThanOrEqual(0.5);
  }
  await page.getByLabel('尺寸示例显示步进按钮', { exact: true }).uncheck();
  await expect(sizeControls.locator('.lx-input-number__stepper')).toHaveCount(0);
  await expect(demo.locator('[data-testid="basic"] .lx-input-number__stepper')).toHaveCount(2);
  await page.getByLabel('尺寸示例显示步进按钮', { exact: true }).check();
  await expect(sizeControls.locator('.lx-input-number__stepper')).toHaveCount(3);
});

test('InputNumber 窄屏步进按钮保持触控尺寸与 HUD 输入底色', async ({ page }, testInfo) => {
  const widths = [375, 320];

  await page.goto('/components/lxinputnumber');
  const demo = page.locator('.lx-input-number-demo');
  const quota = demo.locator('#demo-number-quota');
  const root = quota.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " el-input-number ")][1]',
  );

  for (const width of widths) {
    await page.setViewportSize({ width, height: 812 });

    for (const hud of [false, true]) {
      await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(hud);
      await expect(quota).toBeVisible();
      expect(await demo.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(hud);
      await expect
        .poll(() => root.locator('.el-input__wrapper').evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(hud ? 'rgb(16, 26, 44)' : 'rgb(255, 255, 255)');

      const measurements = await root.evaluate((element) => {
        const wrapper = element.querySelector<HTMLElement>('.el-input__wrapper');
        const input = element.querySelector<HTMLInputElement>('.el-input__inner');
        const increase = element.querySelector<HTMLElement>('.lx-input-number__stepper-button--increase');
        const decrease = element.querySelector<HTMLElement>('.lx-input-number__stepper-button--decrease');
        if (!wrapper || !input || !increase || !decrease) return null;

        const increaseRect = increase.getBoundingClientRect();
        const decreaseRect = decrease.getBoundingClientRect();
        const colors = [getComputedStyle(input).color, getComputedStyle(wrapper).backgroundColor].map((color) =>
          color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number),
        );
        if (!colors[0] || !colors[1]) throw new Error('无法读取 InputNumber 前景与背景颜色');
        const luminance = (rgb: number[]) => {
          const channels = rgb.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const foreground = luminance(colors[0]);
        const background = luminance(colors[1]);
        return {
          increase: { width: increaseRect.width, height: increaseRect.height },
          decrease: { width: decreaseRect.width, height: decreaseRect.height },
          horizontalGap: Math.abs(decreaseRect.left - increaseRect.right),
          inputBackground: getComputedStyle(wrapper).backgroundColor,
          controlHeight: element.getBoundingClientRect().height,
          textContrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        };
      });

      expect(measurements).not.toBeNull();
      expect(measurements?.increase).toEqual({ width: 44, height: 44 });
      expect(measurements?.decrease).toEqual({ width: 44, height: 44 });
      expect(measurements?.horizontalGap).toBeLessThanOrEqual(0.5);
      expect(measurements?.controlHeight).toBe(44);
      if (hud) {
        expect(measurements?.inputBackground).toBe('rgb(16, 26, 44)');
        expect(measurements?.textContrast).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(measurements?.inputBackground).toBe('rgb(255, 255, 255)');
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: testInfo.outputPath(`inputnumber-${width}-${hud ? 'hud' : 'light'}.png`),
        fullPage: true,
      });
    }
  }

  await demo.getByLabel('尺寸示例显示步进按钮', { exact: true }).uncheck();
  const withoutControls = demo.locator('[data-testid="sizes"] .el-input-number').first();
  const inputWrapper = withoutControls.locator('.el-input__wrapper');
  await expect(withoutControls).toHaveClass(/is-without-controls/);
  await expect(withoutControls.locator('.lx-input-number__stepper')).toHaveCount(0);
  await expect
    .poll(() => inputWrapper.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingRight)))
    .toBeLessThanOrEqual(20);
});

test('Textarea 默认硬截断；校验模式保留超限内容并呈现可访问错误', async ({ page }) => {
  await page.goto('/components/lxtextarea');
  const demo = page.locator('.lx-textarea-demo');
  const hardLimit = demo.getByLabel('处置要求及布控指令说明', { exact: true });
  const overflow = demo.getByLabel('涉密核验备忘（溢出校验态）', { exact: true });

  await hardLimit.fill('');
  await hardLimit.pressSequentially('a'.repeat(210));
  await expect(hardLimit).toHaveValue('a'.repeat(200));
  await expect(demo.locator('.lx-textarea-demo__tip').first()).toContainText('最多 200 字；达到上限后继续输入不会写入');

  const initialOverflowValue = await overflow.inputValue();
  expect(initialOverflowValue.length).toBeGreaterThan(200);
  await expect(overflow).toHaveAttribute('aria-invalid', 'true');
  const descriptionId = (await overflow.getAttribute('aria-describedby'))?.split(' ').at(-1);
  expect(descriptionId).toBeTruthy();
  await expect(demo.locator(`#${descriptionId}`)).toContainText('字数超出上限 200 字');
  await expect(demo.locator('.lx-textarea__validation-count')).toHaveText(`${initialOverflowValue.length} / 200`);

  const counter = demo.locator('.lx-textarea__validation-count');
  await expect(counter).toHaveCSS('font-size', '11px');
  const getCounterContrast = () =>
    counter.evaluate((element) => {
      const panel = element.closest('.lx-textarea-demo__panel');
      if (!panel) throw new Error('找不到文本域 Demo 面板背景');

      const getChannels = (color: string): [number, number, number] => {
        const channels = color.match(/[\d.]+/g) ?? [];
        if (channels.length < 3) throw new Error(`无法解析颜色值：${color}`);
        return [Number(channels[0]), Number(channels[1]), Number(channels[2])];
      };
      const [red, green, blue] = getChannels(getComputedStyle(element).color);
      const [backgroundRed, backgroundGreen, backgroundBlue] = getChannels(getComputedStyle(panel).backgroundColor);
      const luminance = (r: number, g: number, b: number) => {
        const linearize = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
      };

      const foregroundLuminance = luminance(red, green, blue);
      const backgroundLuminance = luminance(backgroundRed, backgroundGreen, backgroundBlue);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    });

  const overflowBackground = await overflow.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(overflowBackground).not.toBe('rgb(255, 255, 255)');
  expect(await getCounterContrast()).toBeGreaterThanOrEqual(4.5);
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  expect(await getCounterContrast()).toBeGreaterThanOrEqual(4.5);

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(demo.locator('.lx-textarea__overflow-message')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('三个 Demo 在 375/320px 和局部 HUD 下标签、禁用状态与页面宽度稳定', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const surfaces = [
    ['lxselect', '.lx-select-demo', '布控等级', 'HUD 深色主题'],
    ['lxdatepicker', '.lx-date-picker-demo', '布控生效日期', '文档站整体深色（HUD）'],
    ['lxtextarea', '.lx-textarea-demo', '处置要求及布控指令说明', 'HUD 深色主题'],
  ];
  for (const [route, selector, name, themeLabel] of surfaces) {
    await page.goto(`/components/${route}`);
    const demo = page.locator(selector);
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      for (const hud of [false, true]) {
        await demo.getByLabel(themeLabel, { exact: true }).setChecked(hud);
        await expect(demo.getByLabel(name, { exact: true })).toBeVisible();
        expect(await demo.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(hud);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        await page.screenshot({
          path: testInfo.outputPath(`${route}-${width}-${hud ? 'hud' : 'light'}.png`),
          fullPage: true,
        });
      }
    }
  }
});
