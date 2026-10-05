import { expect, test } from '@playwright/test';

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
  const levelPopper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  const selectedOption = levelPopper.locator('.el-select-dropdown__item').filter({ hasText: '二级布控' });
  await expect(selectedOption).toContainText('持续关注');

  await level.press('Enter');
  await expect(levelPopper).toBeHidden();
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
  await demo.locator('[data-testid="remote"] h4').click();
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
  await level.focus();
  await level.press('ArrowDown');

  const popper = page.locator('.el-select-dropdown.lx-select__popper.lx-theme-hud:visible');
  await expect(popper).toBeVisible();
  const surfaceColor = await popper.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--el-bg-color-overlay').trim(),
  );
  expect(surfaceColor).toBe('#16233a');
  const pagePrimary = await page
    .locator('html')
    .evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-color-primary').trim());
  expect(pagePrimary).toBe('#0060a9');
  const menuPrimary = await popper.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--lx-color-primary').trim(),
  );
  expect(menuPrimary).toBe('#38bdf8');
  const selectedBackground = await popper
    .locator('.el-select-dropdown__item.is-selected')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(selectedBackground).toBe('rgb(22, 35, 58)');

  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const optionHeight = await popper
    .locator('.el-select-dropdown__item')
    .first()
    .evaluate((element) => getComputedStyle(element).height);
  expect(optionHeight).toBe('44px');
});
