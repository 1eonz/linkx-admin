import { expect, test } from '@playwright/test';

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
    const lightLabelColor = await firstLabel.evaluate((element) => getComputedStyle(element).color);
    expect(contrastRatio(lightLabelColor, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(4.5);
    await expect(page.getByRole('img', { name: '在线（在岗备勤）' }).first()).toBeVisible();

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
    await page.getByRole('button', { name: '双列' }).click();

    const descriptions = page.locator('.lx-descriptions').first();
    const desktopColumns = await descriptions.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(desktopColumns).toBe(2);
    await expect(page.locator('.lx-descriptions--grid')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    const mobileColumns = await descriptions.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
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

    await page.getByRole('button', { name: '读取中' }).click();
    await expect(page.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    await page.getByRole('button', { name: '空结果' }).click();
    await expect(page.getByRole('status')).toHaveText('暂无可展示的详情。');
    await page.getByRole('button', { name: '错误' }).click();
    await expect(page.getByRole('alert')).toContainText('详情读取失败。');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.locator('.lx-descriptions__item').first()).toBeVisible();

    await page.getByLabel('HUD 深色主题').check();
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
