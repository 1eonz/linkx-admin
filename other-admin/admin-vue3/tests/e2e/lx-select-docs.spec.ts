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
  const statusContrast = await demo.locator('.lx-select-demo__status').evaluate(getContrastColors);
  expect(contrastRatio(statusContrast.foreground, statusContrast.backgroundLayers)).toBeGreaterThanOrEqual(4.5);
  const disabledWrapper = demo.locator('[data-testid="disabled"] .el-select__wrapper');
  const disabledValue = disabledWrapper.locator('.el-select__selected-item:not(.el-select__input-wrapper)');
  await expect(disabledValue).toBeVisible();
  const disabledMetrics = await disabledWrapper.evaluate((element) => {
    const selectedText = element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)');
    const caret = element.querySelector<HTMLElement>('.el-select__caret');
    const caretIcon = caret?.querySelector<SVGElement>('svg') ?? caret;
    return {
      opacity: getComputedStyle(element).opacity,
      foreground: selectedText ? getComputedStyle(selectedText).color : '',
      caretColor: caretIcon ? getComputedStyle(caretIcon).color : '',
      background: getComputedStyle(element).backgroundColor,
      caretVisible: Boolean(
        caretIcon &&
        getComputedStyle(caretIcon).display !== 'none' &&
        getComputedStyle(caretIcon).visibility !== 'hidden' &&
        Number(getComputedStyle(caretIcon).opacity) > 0 &&
        caretIcon.getBoundingClientRect().width > 0 &&
        caretIcon.getBoundingClientRect().height > 0,
      ),
    };
  });
  expect(disabledMetrics.opacity).toBe('1');
  expect(disabledMetrics.foreground).not.toBe('');
  expect(contrastRatio(disabledMetrics.foreground, [disabledMetrics.background])).toBeGreaterThanOrEqual(4.5);
  expect(disabledMetrics.caretVisible).toBe(true);
  expect(disabledMetrics.caretColor).not.toBe('');
  expect(contrastRatio(disabledMetrics.caretColor, [disabledMetrics.background])).toBeGreaterThanOrEqual(3);
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
  await expect(demo.locator('[data-testid="multiple"] .el-select__wrapper')).toContainText(/\+\s*1/);
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

test('远程检索展示空结果、失败说明并支持重试', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  const scenario = demo.getByLabel('远程检索模拟结果', { exact: true });
  const officer = demo.getByLabel('值班警员', { exact: true });

  await scenario.selectOption('empty');
  await officer.fill('不存在的警员');
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  await expect(popper).toContainText('没有匹配的值班警员');

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
});

test('局部 HUD 主题覆盖传送菜单，窄视口保持在页面宽度内', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  await demo.getByLabel('HUD 深色主题', { exact: true }).check();
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
  const disabledWrapper = demo.locator('[data-testid="disabled"] .el-select__wrapper');
  const disabledValue = disabledWrapper.locator('.el-select__selected-item:not(.el-select__input-wrapper)');
  await expect(disabledValue).toBeVisible();
  const hudDisabledMetrics = await disabledWrapper.evaluate((element) => {
    const selectedText = element.querySelector<HTMLElement>('.el-select__selected-item:not(.el-select__input-wrapper)');
    const caret = element.querySelector<HTMLElement>('.el-select__caret');
    const caretIcon = caret?.querySelector<SVGElement>('svg') ?? caret;
    return {
      opacity: getComputedStyle(element).opacity,
      foreground: selectedText ? getComputedStyle(selectedText).color : '',
      caretColor: caretIcon ? getComputedStyle(caretIcon).color : '',
      background: getComputedStyle(element).backgroundColor,
      caretVisible: Boolean(
        caretIcon &&
        getComputedStyle(caretIcon).display !== 'none' &&
        getComputedStyle(caretIcon).visibility !== 'hidden' &&
        Number(getComputedStyle(caretIcon).opacity) > 0 &&
        caretIcon.getBoundingClientRect().width > 0 &&
        caretIcon.getBoundingClientRect().height > 0,
      ),
    };
  });
  expect(hudDisabledMetrics.opacity).toBe('1');
  expect(hudDisabledMetrics.background).toBe('rgb(22, 35, 58)');
  expect(hudDisabledMetrics.foreground).not.toBe('');
  expect(contrastRatio(hudDisabledMetrics.foreground, [hudDisabledMetrics.background])).toBeGreaterThanOrEqual(4.5);
  expect(hudDisabledMetrics.caretVisible).toBe(true);
  expect(hudDisabledMetrics.caretColor).not.toBe('');
  expect(contrastRatio(hudDisabledMetrics.caretColor, [hudDisabledMetrics.background])).toBeGreaterThanOrEqual(3);
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
