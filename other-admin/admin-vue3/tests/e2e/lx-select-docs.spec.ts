import { expect, test } from '@playwright/test';

function parseCssColor(color: string) {
  const channels = color.match(/[\d.]+/g)?.map(Number) ?? [];
  if (channels.length < 3) throw new Error(`无法解析颜色：${color}`);
  return { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] ?? 1 };
}

function compositeColor(foreground: ReturnType<typeof parseCssColor>, background: ReturnType<typeof parseCssColor>) {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
  return {
    red: (foreground.red * foreground.alpha + background.red * background.alpha * (1 - foreground.alpha)) / alpha,
    green: (foreground.green * foreground.alpha + background.green * background.alpha * (1 - foreground.alpha)) / alpha,
    blue: (foreground.blue * foreground.alpha + background.blue * background.alpha * (1 - foreground.alpha)) / alpha,
    alpha,
  };
}

function relativeLuminance(color: ReturnType<typeof parseCssColor>) {
  const linear = [color.red, color.green, color.blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, backgroundLayers: string[]) {
  let background = { red: 255, green: 255, blue: 255, alpha: 1 };
  for (const layer of [...backgroundLayers].reverse()) {
    background = compositeColor(parseCssColor(layer), background);
  }
  const visibleForeground = compositeColor(parseCssColor(foreground), background);
  const luminance = [relativeLuminance(visibleForeground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminance[0] + 0.05) / (luminance[1] + 0.05);
}

function getContrastColors(element: Element) {
  const backgrounds: string[] = [];
  let current: Element | null = element;
  while (current) {
    const background = getComputedStyle(current).backgroundColor;
    const alpha = background.match(/[\d.]+/g)?.map(Number)[3] ?? 1;
    if (alpha > 0) backgrounds.push(background);
    current = current.parentElement;
  }
  return { foreground: getComputedStyle(element).color, backgroundLayers: backgrounds };
}

function getCaretMetrics(caret: Element) {
  const style = getComputedStyle(caret);
  const arrow = getComputedStyle(caret, '::after');
  const nativeIcon = caret.querySelector(':scope > svg');
  const bounds = caret.getBoundingClientRect();
  const caretOpacity = Number(style.opacity);
  const arrowOpacity = Number(arrow.opacity);
  return {
    caretColor: style.color,
    caretBackgroundColor: arrow.backgroundColor,
    caretContent: arrow.content,
    caretClipPath: arrow.clipPath,
    caretOpacity: style.opacity,
    caretWidth: bounds.width,
    caretHeight: bounds.height,
    nativeIconDisplay: nativeIcon ? getComputedStyle(nativeIcon).display : '',
    caretVisible:
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      caretOpacity > 0 &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      arrow.display !== 'none' &&
      arrow.visibility !== 'hidden' &&
      arrowOpacity > 0 &&
      arrow.width !== '0px' &&
      arrow.height !== '0px' &&
      arrow.content !== 'none',
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('Select 配置式选项与自定义选项、面板插槽可用', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const level = demo.getByLabel('布控等级', { exact: true });

  await level.focus();
  await level.press('ArrowDown');
  const levelWrapper = level.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")][1]');
  expect(await levelWrapper.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
  await level.press('ArrowDown');
  const levelPopper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  const selectedOption = levelPopper.locator('.el-select-dropdown__item').filter({ hasText: '二级布控' });
  await expect(selectedOption).toContainText('持续关注');
  const descriptionContrast = await selectedOption
    .locator('.lx-select-demo__option-description')
    .evaluate(getContrastColors);
  expect(contrastRatio(descriptionContrast.foreground, descriptionContrast.backgroundLayers)).toBeGreaterThanOrEqual(
    4.5,
  );
  const disabledWrapper = demo.locator('[data-testid="disabled"] .el-select__wrapper').first();
  const disabledValue = disabledWrapper.locator('.el-select__selected-item:not(.el-select__input-wrapper)');
  await expect(disabledValue).toBeVisible();
  const disabledMetrics = await disabledWrapper.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    foreground: element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)')
      ? getComputedStyle(
          element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)')!,
        ).color
      : '',
    background: getComputedStyle(element).backgroundColor,
  }));
  const disabledCaretMetrics = await disabledWrapper.locator('.el-select__caret').evaluate(getCaretMetrics);
  await expect(disabledWrapper.locator('.el-select__caret')).toBeVisible();
  expect(disabledMetrics.opacity).toBe('1');
  expect(disabledMetrics.foreground).not.toBe('');
  expect(contrastRatio(disabledMetrics.foreground, [disabledMetrics.background])).toBeGreaterThanOrEqual(4.5);
  expect(disabledCaretMetrics.caretVisible).toBe(true);
  expect(disabledCaretMetrics.caretColor).not.toBe('');
  expect(disabledCaretMetrics.caretBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(disabledCaretMetrics.caretBackgroundColor).not.toBe('transparent');
  expect(disabledCaretMetrics.caretContent).not.toBe('none');
  expect(disabledCaretMetrics.caretClipPath).toContain('polygon');
  expect(disabledCaretMetrics.nativeIconDisplay).toBe('none');
  expect(contrastRatio(disabledCaretMetrics.caretBackgroundColor, [disabledMetrics.background])).toBeGreaterThanOrEqual(
    3,
  );
  const disabledPanel = demo.locator('[data-testid="disabled"]');
  const disabledSummary = disabledPanel.locator('.el-select__collapse-item');
  await expect(disabledSummary).toHaveAttribute('tabindex', '-1');
  await expect(disabledSummary).toHaveAttribute('aria-disabled', 'true');
  const disabledSummaryWrapper = disabledPanel.locator('.el-select__wrapper').nth(1);
  await expect(disabledSummaryWrapper).toHaveClass(/is-disabled/);
  const checkmark = await selectedOption.evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return {
      content: style.content,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
    };
  });
  expect(checkmark).toEqual({ content: '""', borderRightWidth: '2px', borderBottomWidth: '2px' });

  await level.press('Enter');
  await expect(levelPopper).toBeHidden();
  await expect(levelWrapper).toContainText(/三级布控\s*（常规监测）/);
  const basicStatus = demo.locator('[data-testid="basic"] .lx-select-demo__status');
  await expect(basicStatus).toHaveText('布控等级 已选：三级布控');
  const statusContrast = await basicStatus.evaluate(getContrastColors);
  expect(contrastRatio(statusContrast.foreground, statusContrast.backgroundLayers)).toBeGreaterThanOrEqual(4.5);
  await expect(demo.locator('[data-testid="multiple"] .el-select__wrapper')).toContainText(/\+\s*1/);
  await expect(demo.locator('[data-testid="multiple"] .el-tag__close').first()).toHaveAttribute('aria-label', /关闭/);
  const changedUnits = demo.getByLabel('协同单位', { exact: true });
  await changedUnits.focus();
  await changedUnits.press('ArrowDown');
  const changedUnitsPopper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  await changedUnitsPopper.getByRole('option', { name: '交警支队', exact: true }).click();
  await expect(demo.locator('[data-testid="multiple"] .lx-select-demo__status')).toHaveText(
    '协同单位 已选：市局指挥中心、分局合成作战中心、交警支队',
  );
  const center = demo.getByLabel('指挥中心（可过滤）', { exact: true });
  await center.focus();
  await center.press('ArrowDown');
  const centerPopper = page.locator('.el-select-dropdown.lx-select__popper:visible').filter({ hasText: '按区域筛选' });
  await expect(centerPopper).toContainText('按区域筛选');
  await expect(centerPopper).toContainText('共 4 个指挥中心');

  const units = demo.getByLabel('协同单位', { exact: true });
  await units.focus();
  await units.press('ArrowDown');
  const unitsPopper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  const unavailable = unitsPopper.getByRole('option', {
    name: '反恐怖与特巡警支队（离线）',
  });
  await expect(unitsPopper.getByRole('option')).toHaveCount(4);
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
});

test('清空图标保留自身形态且自定义后缀图标不被默认箭头样式替换', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const channel = demo.getByLabel('处置通道（可清空）', { exact: true });
  const channelWrapper = channel.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")][1]');

  await channelWrapper.hover();
  const clearIcon = channelWrapper.locator('.el-select__clear');
  await expect(clearIcon).toBeVisible();
  const clearIconMetrics = await clearIcon.evaluate((element) => ({
    iconDisplay: getComputedStyle(element.querySelector('svg')!).display,
    arrowContent: getComputedStyle(element, '::after').content,
  }));
  expect(clearIconMetrics.iconDisplay).not.toBe('none');
  expect(clearIconMetrics.arrowContent).toBe('none');
  await clearIcon.click();
  await expect(channel).toHaveValue('');

  const center = demo.getByLabel('指挥中心（可过滤）', { exact: true });
  const centerWrapper = center.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")][1]');
  const customSuffixCaretForFilter = centerWrapper.locator('.el-select__caret');
  await expect(customSuffixCaretForFilter.locator(':scope > svg')).toBeVisible();
  expect(await customSuffixCaretForFilter.evaluate((element) => getComputedStyle(element, '::after').content)).toBe(
    'none',
  );
});

test('减少动效偏好关闭触发器和箭头过渡并保留键盘焦点提示', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/components/lxselect');

  const demo = page.locator('.lx-select-demo');
  const level = demo.getByLabel('布控等级', { exact: true });
  const wrapper = level.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")][1]');
  const caret = wrapper.locator('.el-select__caret');

  await expect.poll(() => wrapper.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');
  await expect.poll(() => caret.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('none');

  await level.focus();
  await level.press('ArrowDown');
  await expect.poll(() => wrapper.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('2px');

  const popper = page.locator('.el-select-dropdown.lx-select__popper').first();
  const popperTransition = await popper.evaluate((element) => {
    element.classList.add('el-zoom-in-top-enter-active');
    const transition = getComputedStyle(element).transitionProperty;
    element.classList.remove('el-zoom-in-top-enter-active');
    return transition;
  });
  expect(popperTransition).toBe('none');
});

test('远程检索在请求期间展示加载状态', async ({ page }) => {
  await page.clock.install();
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const scenario = demo.getByLabel('远程检索模拟结果', { exact: true });
  const officer = demo.getByLabel('值班警员', { exact: true });
  const scenarioBounds = await scenario.boundingBox();
  expect(scenarioBounds?.width).toBeGreaterThanOrEqual(132);

  await scenario.selectOption('empty');
  await officer.focus();
  await officer.press('ArrowDown');

  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  const loadingStatus = popper.getByRole('status');
  await expect(loadingStatus).toHaveText('正在检索值班警员…');
  await page.clock.runFor(600);
  await expect(popper).toContainText('没有匹配的值班警员');
  await expect(popper).toContainText('请调整姓名或警号后重试');
  await expect(loadingStatus).toHaveCount(0);
});

test('远程检索展示空结果、失败说明并支持重试', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const scenario = demo.getByLabel('远程检索模拟结果', { exact: true });
  const officer = demo.getByLabel('值班警员', { exact: true });

  await scenario.selectOption('empty');
  await officer.fill('不存在的警员');
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  await expect(popper).toContainText('没有匹配的值班警员');
  await expect(popper).toContainText('请调整姓名或警号后重试');

  await scenario.selectOption('error');
  await officer.fill('赵');
  const error = demo.getByRole('alert');
  await expect(error).toContainText('远程检索暂时失败');
  await expect(error).toHaveClass(/visually-hidden/);
  const descriptionId = await officer.getAttribute('aria-describedby');
  expect(descriptionId?.split(/\s+/)).toContain(await error.getAttribute('id'));

  await expect(popper).toContainText('远程检索暂时失败，请重试。');
  const retryButton = page.getByRole('button', { name: '重试', exact: true });
  await expect(retryButton).toBeVisible();
  await expect(error).toHaveCount(1);
  await officer.press('Escape');
  await expect(officer).toHaveValue('');
  await expect(officer).toHaveAttribute('aria-expanded', 'true');
  await expect(popper).toBeVisible();
  await officer.press('Escape');
  await expect(officer).toHaveAttribute('aria-expanded', 'false');
  await expect(popper).toBeHidden();
  await expect(officer).toBeFocused();
  await demo.locator('[data-testid="remote"] h3').click();
  await expect(popper).toBeHidden();
  await expect(error).toBeVisible();
  await expect(error).not.toHaveClass(/visually-hidden/);
  await expect(retryButton).toBeVisible();
  await retryButton.click();
  await expect(demo.getByRole('alert')).toHaveCount(0);
  await expect(officer).not.toHaveAttribute('aria-describedby', /demo-select-officer-error/);
  await officer.focus();
  await officer.press('ArrowDown');
  await expect(popper.getByRole('option', { name: '赵国强 031204' })).toBeVisible();
  await popper.getByRole('option', { name: '赵国强 031204' }).click();
  await expect(demo.locator('[data-testid="remote"] .lx-select-demo__status')).toHaveText(
    '值班警员 已选：赵国强 031204',
  );
});

test('局部 HUD 主题覆盖传送菜单，窄视口保持在页面宽度内', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const lightTag = demo.locator('[data-testid="multiple"] .el-tag:visible').first();
  const lightTagContrast = await lightTag.evaluate(getContrastColors);
  expect(contrastRatio(lightTagContrast.foreground, lightTagContrast.backgroundLayers)).toBeGreaterThanOrEqual(4.5);
  const lightTagClose = lightTag.locator('.el-tag__close');
  await expect(lightTagClose).toHaveAttribute('aria-label', /关闭/);
  const lightTagCloseContrast = await lightTagClose.evaluate(getContrastColors);
  expect(
    contrastRatio(lightTagCloseContrast.foreground, lightTagCloseContrast.backgroundLayers),
  ).toBeGreaterThanOrEqual(3);

  await demo.getByLabel('HUD 深色主题', { exact: true }).check();
  const hudTags = demo.locator('[data-testid="multiple"] .lx-select .el-tag:visible');
  await expect(hudTags.first()).toBeVisible();
  const hudTagStyles = await hudTags.evaluateAll((tags) =>
    tags.map((tag) => {
      const style = getComputedStyle(tag);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
      };
    }),
  );
  expect(hudTagStyles.length).toBeGreaterThan(0);
  for (const style of hudTagStyles) {
    expect(style.color).toBe('rgb(226, 232, 240)');
    expect(style.backgroundColor).toBe('rgb(22, 35, 58)');
    expect(style.borderColor).toBe('rgb(30, 47, 71)');
  }
  const hudTagContrast = await hudTags.first().evaluate(getContrastColors);
  expect(contrastRatio(hudTagContrast.foreground, hudTagContrast.backgroundLayers)).toBeGreaterThanOrEqual(4.5);
  const collapsedTag = demo.locator('[data-testid="multiple"] .el-select__collapse-item');
  await collapsedTag.hover();
  const collapsedTagTooltip = page.locator('.el-popper.el-tooltip.lx-select__popper.lx-theme-hud[aria-hidden="false"]');
  await expect(collapsedTagTooltip).toContainText('分局合成作战中心');
  const tooltipTag = collapsedTagTooltip.locator('.el-select__selection .el-tag.in-tooltip');
  const tooltipTagStyles = await tooltipTag.evaluate((tag) => {
    const style = getComputedStyle(tag);
    const close = tag.querySelector<HTMLElement>('.el-tag__close');
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      closeColor: close ? getComputedStyle(close).color : '',
    };
  });
  expect(tooltipTagStyles.color).toBe('rgb(226, 232, 240)');
  expect(tooltipTagStyles.backgroundColor).toBe('rgb(22, 35, 58)');
  expect(tooltipTagStyles.borderColor).toBe('rgb(30, 47, 71)');
  expect(tooltipTagStyles.closeColor).toBe('rgb(148, 163, 184)');
  const tooltipTagContrast = await tooltipTag.evaluate(getContrastColors);
  expect(contrastRatio(tooltipTagContrast.foreground, tooltipTagContrast.backgroundLayers)).toBeGreaterThanOrEqual(4.5);
  const tooltipTagClose = tooltipTag.locator('.el-tag__close');
  const tooltipCloseContrast = await tooltipTagClose.evaluate(getContrastColors);
  expect(contrastRatio(tooltipCloseContrast.foreground, tooltipCloseContrast.backgroundLayers)).toBeGreaterThanOrEqual(
    3,
  );
  await tooltipTagClose.hover();
  await expect.poll(() => tooltipTagClose.evaluate((close) => getComputedStyle(close).color)).toBe('rgb(11, 18, 32)');
  await expect
    .poll(() => tooltipTagClose.evaluate((close) => getComputedStyle(close).backgroundColor))
    .toBe('rgb(56, 189, 248)');
  const tooltipCloseHoverContrast = await tooltipTagClose.evaluate(getContrastColors);
  expect(
    contrastRatio(tooltipCloseHoverContrast.foreground, tooltipCloseHoverContrast.backgroundLayers),
  ).toBeGreaterThanOrEqual(3);
  const level = demo.getByLabel('布控等级', { exact: true });
  const levelWrapper = level.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")][1]');
  await expect
    .poll(() => levelWrapper.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(16, 26, 44)');
  await level.focus();
  await level.press('ArrowDown');

  const popper = page.locator('.el-select-dropdown.lx-select__popper.lx-theme-hud:visible');
  await expect(popper).toBeVisible();
  const surfaceColor = await popper.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--el-bg-color-overlay').trim(),
  );
  expect(surfaceColor).toBe('#16233a');
  const hudDescriptionContrast = await popper
    .locator('.lx-select-demo__option-description')
    .first()
    .evaluate(getContrastColors);
  expect(
    contrastRatio(hudDescriptionContrast.foreground, hudDescriptionContrast.backgroundLayers),
  ).toBeGreaterThanOrEqual(4.5);
  const pagePrimary = await page
    .locator('html')
    .evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-color-primary').trim());
  expect(pagePrimary).toBe('#0060a9');
  const menuPrimary = await popper.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--lx-color-primary').trim(),
  );
  expect(menuPrimary).toBe('#38bdf8');
  const disabledWrapper = demo.locator('[data-testid="disabled"] .el-select__wrapper').first();
  const disabledValue = disabledWrapper.locator('.el-select__selected-item:not(.el-select__input-wrapper)');
  await expect(disabledValue).toBeVisible();
  const hudDisabledMetrics = await disabledWrapper.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    foreground: element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)')
      ? getComputedStyle(
          element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)')!,
        ).color
      : '',
    background: getComputedStyle(element).backgroundColor,
  }));
  const hudDisabledCaretMetrics = await disabledWrapper.locator('.el-select__caret').evaluate(getCaretMetrics);
  await expect(disabledWrapper.locator('.el-select__caret')).toBeVisible();
  expect(hudDisabledMetrics.opacity).toBe('1');
  expect(hudDisabledMetrics.background).toBe('rgb(22, 35, 58)');
  expect(hudDisabledMetrics.foreground).not.toBe('');
  expect(contrastRatio(hudDisabledMetrics.foreground, [hudDisabledMetrics.background])).toBeGreaterThanOrEqual(4.5);
  expect(hudDisabledCaretMetrics.caretVisible).toBe(true);
  expect(hudDisabledCaretMetrics.caretColor).not.toBe('');
  expect(hudDisabledCaretMetrics.caretContent).not.toBe('none');
  expect(hudDisabledCaretMetrics.caretClipPath).toContain('polygon');
  expect(hudDisabledCaretMetrics.nativeIconDisplay).toBe('none');
  expect(contrastRatio(hudDisabledCaretMetrics.caretColor, [hudDisabledMetrics.background])).toBeGreaterThanOrEqual(3);
  const selectedBackground = await popper
    .locator('.el-select-dropdown__item.is-selected')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(selectedBackground).toBe('rgb(22, 35, 58)');

  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const themeToggle = demo.locator('.lx-select-demo__toolbar label');
  await expect.poll(() => themeToggle.evaluate((element) => getComputedStyle(element).height)).toBe('44px');
  const scenario = demo.getByLabel('远程检索模拟结果', { exact: true });
  await expect.poll(() => scenario.evaluate((element) => getComputedStyle(element).height)).toBe('44px');
  const optionHeight = await popper
    .locator('.el-select-dropdown__item')
    .first()
    .evaluate((element) => getComputedStyle(element).height);
  expect(optionHeight).toBe('44px');
  await level.press('Enter');
  await expect(popper).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 812 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('多选折叠摘要可用键盘打开选项列表', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const multiple = demo.locator('[data-testid="multiple"]');
  const summary = multiple.locator('.el-select__collapse-item');
  const unitsInput = demo.getByLabel('协同单位', { exact: true });
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  const selectedTags = multiple.locator('.lx-select .el-tag:visible');
  const formItem = multiple.locator('.el-form-item');
  const form = multiple.locator('.lx-form');

  await expect(summary).toHaveAttribute('role', 'button');
  await expect(summary).toHaveAttribute('tabindex', '0');
  await expect(summary).toHaveAttribute('aria-haspopup', 'listbox');
  await expect(summary).toHaveAttribute('aria-label', '展开选择列表，另有 1 项已选');
  const submitButton = multiple.getByRole('button', { name: '提交校验' });
  await submitButton.focus();
  await submitButton.press('Enter');
  await expect(formItem.locator('.el-form-item__error')).toHaveText('至少选择 3 个协同单位');
  await expect(multiple.getByRole('alert')).toHaveCount(1);
  await expect(multiple.locator('.lx-select-demo__status[role="status"]')).toHaveText('当前已选 2 项，还需 1 项');
  const fieldErrorId = await formItem.locator('.el-form-item__error').getAttribute('id');
  expect(fieldErrorId).toBeTruthy();
  await expect
    .poll(async () => {
      const descriptionIds = (await unitsInput.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
      return (
        descriptionIds.includes('demo-select-units-help') &&
        Boolean(fieldErrorId && descriptionIds.includes(fieldErrorId))
      );
    })
    .toBe(true);
  await expect(unitsInput).toBeFocused();

  await summary.focus();
  const wrapper = multiple.locator('.el-select__wrapper');
  await expect.poll(() => wrapper.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
  await expect(formItem).toHaveClass(/is-error/);
  await expect.poll(() => wrapper.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('2px');
  await summary.press('Space');
  await expect(popper).toBeVisible();
  await expect(unitsInput).toBeFocused();
  await unitsInput.press('Escape');
  await expect(popper).toBeHidden();

  await expect(selectedTags).toHaveCount(2);
  await summary.focus();
  await summary.press('Enter');
  await expect(popper).toBeVisible();
  await expect(unitsInput).toBeFocused();
  await unitsInput.press('ArrowDown');
  await expect(popper.locator('.el-select-dropdown__item.is-hovering')).toHaveCount(1);
  await unitsInput.press('Enter');
  await unitsInput.press('Escape');
  await expect(popper).toBeHidden();
  await expect(selectedTags).toHaveCount(2);
  await expect(summary).toHaveAttribute('aria-label', '展开选择列表，另有 2 项已选');
  await expect(form).toHaveAttribute('data-selected-count', '3');
  await expect(multiple).toContainText('默认已选市局指挥中心和分局合成作战中心；至少选择 3 个协同单位。');
  await expect(unitsInput).toHaveAttribute('aria-describedby', /demo-select-units-help/);
  await expect(formItem.locator('.el-form-item__error')).toHaveCount(0);
  await expect(multiple.locator('.lx-select-demo__status[role="status"]')).toHaveCount(0);
  await multiple.getByRole('button', { name: '提交校验' }).click();
  await expect(multiple.locator('.lx-select-demo__status[role="status"]')).toHaveText('校验通过：已选择 3 个协同单位');
  await expect(formItem).not.toHaveClass(/is-error/);
  await expect(multiple.locator('.lx-select-demo__status').first()).toHaveText(
    '协同单位 已选：市局指挥中心、分局合成作战中心、交警支队',
  );

  await multiple.getByRole('button', { name: '恢复示例默认值' }).click();
  await expect(form).toHaveAttribute('data-selected-count', '2');
  await expect(formItem.locator('.el-form-item__error')).toHaveCount(0);
  await expect(multiple.locator('.lx-select-demo__status[role="status"]')).toHaveCount(0);
  await expect(multiple.locator('.lx-select-demo__status').first()).toHaveText(
    '已恢复示例默认选择：市局指挥中心、分局合成作战中心',
  );
});

test('点击多选折叠摘要后可继续用键盘选择', async ({ page }) => {
  await page.goto('/components/lxselect');
  const multiple = page.locator('[data-testid="multiple"]');
  const summary = multiple.locator('.el-select__collapse-item');
  const input = page.getByLabel('协同单位', { exact: true });
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');

  await summary.click();
  await expect(popper).toBeVisible();
  await expect(input).toBeFocused();
  await input.press('ArrowDown');
  await expect(popper.locator('.el-select-dropdown__item.is-hovering')).toHaveCount(1);
  await input.press('Enter');
  await expect(multiple.locator('.lx-form')).not.toHaveAttribute('data-selected-count', '2');
});
