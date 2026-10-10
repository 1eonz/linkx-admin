import { expect, test, type Page } from '@playwright/test';

async function selectPreviewState(page: Page, label: string) {
  const selectTrigger = page.getByRole('combobox', { name: '数据状态' });
  await selectTrigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await selectTrigger.focus();
  await selectTrigger.press('Enter');
  await page.getByRole('option', { name: label, exact: true }).click();
}

async function selectLoadingStateByKeyboard(page: Page) {
  const selectTrigger = page.getByRole('combobox', { name: '数据状态' });
  await selectTrigger.focus();
  await selectTrigger.press('Enter');
  await selectTrigger.press('ArrowDown');
  await selectTrigger.press('Enter');
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const channels = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!channels || channels.length !== 3) throw new Error(`无法解析颜色：${color}`);
    const [red, green, blue] = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test.describe('lx-ui LxDescriptions 文档示例', () => {
  test('遵循 32px 行高，并提供代码复制与可读状态展示', async ({ page }) => {
    await page.goto('/components/lxdescriptions');

    const firstRow = page.locator('.lx-descriptions__item').first();
    const firstLabel = firstRow.locator('.lx-descriptions__label');
    const rowBox = await firstRow.boundingBox();
    if (!rowBox) throw new Error('详情行未进入可视区域');

    expect(rowBox.height).toBe(32);
    expect(await firstLabel.evaluate((element) => getComputedStyle(element).fontSize)).toBe('13px');
    const firstValue = firstRow.locator('.lx-descriptions__value-text');
    expect(await firstValue.evaluate((element) => getComputedStyle(element).fontWeight)).toBe('500');
    const lightLabelColor = await firstLabel.evaluate((element) => getComputedStyle(element).color);
    expect(contrastRatio(lightLabelColor, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(4.5);
    await expect(page.getByRole('img', { name: '在线（在岗备勤）' }).first()).toBeVisible();
    const statusText = page.locator('.lx-descriptions__value .lx-status-dot__text').first();
    expect(await statusText.evaluate((element) => getComputedStyle(element).color)).toBe(
      await firstValue.evaluate((element) => getComputedStyle(element).color),
    );
    const statusDot = page.locator('.lx-descriptions__value .lx-status-dot__wrap').first();
    await expect(statusDot).toHaveCSS('width', '6px');
    await expect(statusDot).toHaveCSS('height', '6px');

    const copyButton = page
      .getByRole('region', { name: '详情描述示例' })
      .getByRole('button', {
        name: /005882/,
      })
      .first();
    await expect(copyButton).toHaveAccessibleName('复制警号：005882');
    await copyButton.focus();
    const focusWidth = await copyButton.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    );
    expect(focusWidth).toBeGreaterThanOrEqual(2);

    const remarks = page.locator('.lx-descriptions__value-text[title]');
    await expect(remarks).toHaveAttribute('title', /跨网段加密调度二级权限/);
  });

  test('桌面双列、375px 单列和 480px 抽屉都不产生页面横向溢出', async ({ page }) => {
    await page.goto('/components/lxdescriptions');

    await expect(page.getByRole('group', { name: '布局' })).toBeVisible();
    await expect(page.getByRole('region', { name: '详情描述示例' }).getByText('布局', { exact: true })).toBeVisible();
    await expect(page.getByLabel('数据状态')).toBeVisible();
    await page.getByRole('button', { name: '双列' }).click();

    const descriptions = page.locator('.lx-descriptions').first();
    const desktopColumns = await descriptions.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(desktopColumns).toBe(2);
    await expect(page.locator('.lx-descriptions--grid')).toBeVisible();

    const borderedToggle = page.getByLabel('网格边框');
    await borderedToggle.check();
    await expect(descriptions).toHaveClass(/is-bordered/);
    await borderedToggle.uncheck();
    await expect(descriptions).not.toHaveClass(/is-bordered/);

    await page.setViewportSize({ width: 375, height: 812 });
    const toolbar = page.locator('.lx-descriptions-demo__controls');
    const toolbarMetrics = await toolbar.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(toolbarMetrics.scrollWidth).toBeLessThanOrEqual(toolbarMetrics.clientWidth);

    await page.getByRole('button', { name: '双列' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const stateSelect = page.getByRole('combobox', { name: '数据状态' });
    await expect(stateSelect).toBeFocused();
    expect(
      await page
        .locator('.lx-descriptions-demo__state-select .el-select__wrapper')
        .evaluate((element) => getComputedStyle(element).boxShadow),
    ).not.toBe('none');

    const mobileColumns = await descriptions.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    const mobileRemarks = descriptions.locator('.lx-descriptions__value-text').filter({ hasText: '重点高架合流区' });
    await expect(mobileRemarks).toHaveText('重点高架合流区视频快反联动专员，具有跨网段加密调度二级权限。');
    await expect(mobileRemarks).toHaveCSS('white-space', 'normal');
    const mobileCode = descriptions
      .locator('.lx-descriptions__item')
      .filter({ hasText: '设备标识' })
      .locator('.lx-code-slot__content');
    await expect(mobileCode).toHaveText('GB28181-P2P-EDGE-NODE-20261007-00000001-REGION-OPS');
    await expect(mobileCode).toHaveCSS('white-space', 'normal');
    const codeMetrics = await mobileCode.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
    }));
    expect(codeMetrics.clientHeight).toBeGreaterThan(18);
    expect(codeMetrics.scrollWidth).toBeLessThanOrEqual(codeMetrics.clientWidth);

    const mobileStatus = descriptions
      .locator('.lx-descriptions__item')
      .filter({ hasText: '运行状态' })
      .locator('.lx-status-dot__text');
    await expect(mobileStatus).toHaveText('在线（在岗备勤），当前负责跨辖区视频联动与加密调度');
    await expect(mobileStatus).toHaveCSS('white-space', 'normal');
    const statusMetrics = await mobileStatus.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
    }));
    expect(statusMetrics.clientHeight).toBeGreaterThan(20);
    expect(statusMetrics.scrollWidth).toBeLessThanOrEqual(statusMetrics.clientWidth);
    const drawerBox = await page.getByRole('region', { name: '480 像素详情抽屉' }).boundingBox();
    expect(mobileColumns).toBe(1);
    expect(drawerBox?.width).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.setViewportSize({ width: 320, height: 720 });
    const narrowDrawer = await page.getByRole('region', { name: '480 像素详情抽屉' }).boundingBox();
    expect(narrowDrawer?.width).toBeLessThanOrEqual(320);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test('宿主加载、空、错误恢复、主题与减少动效状态可见', async ({ page }) => {
    await page.goto('/components/lxdescriptions');
    const demo = page.getByRole('region', { name: '详情描述示例' });
    const mainPreview = demo.locator('.lx-descriptions-demo__main');

    await expect(mainPreview).toBeVisible();
    await selectLoadingStateByKeyboard(page);
    await expect(demo.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    await expect(mainPreview).toHaveCount(0);
    await selectPreviewState(page, '空结果');
    await expect(demo.getByRole('status')).toHaveText('暂无可展示的详情。');
    await selectPreviewState(page, '错误');
    await expect(demo.getByRole('alert')).toContainText('详情读取失败。');
    await demo.getByRole('button', { name: '重试' }).click();
    await expect(mainPreview).toBeVisible();
    await selectPreviewState(page, '详情');
    await expect(mainPreview).toBeVisible();

    await page.getByLabel('HUD 深色主题（整页）').check();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    const hudLabelColor = await page
      .locator('.lx-descriptions__label')
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    expect(contrastRatio(hudLabelColor, 'rgb(16, 26, 44)')).toBeGreaterThanOrEqual(4.5);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionDuration = await page
      .locator('.lx-descriptions__item')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transitionDuration === '0s' || Number.parseFloat(transitionDuration) <= 0.00002).toBe(true);
    const pulseDuration = await page
      .locator('.lx-status-dot__ping')
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(pulseDuration)).toBeLessThanOrEqual(0.00002);
  });
});
