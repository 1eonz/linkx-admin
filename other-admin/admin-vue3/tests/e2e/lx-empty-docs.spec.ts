import { expect, test, type Locator } from '@playwright/test';

async function getContrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const surface = element.closest('.empty-demo');
    if (!surface) {
      throw new Error('LxEmpty 对比度测试缺少示例背景');
    }

    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      if (!channels || channels.length !== 3) {
        throw new Error(`无法解析颜色值：${color}`);
      }

      const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    const foreground = luminance(getComputedStyle(element).color);
    const backgroundElement = element.matches('button') ? element : surface;
    const background = luminance(getComputedStyle(backgroundElement).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}

test.describe('LxEmpty 文档示例', () => {
  test('验证尺寸、插槽、操作焦点、主题与窄屏布局', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxempty');

    await expect(page.getByRole('heading', { name: 'LxEmpty 空态' })).toBeVisible();

    const defaultExample = page.getByTestId('default-example').locator('.lx-empty');
    const defaultImage = defaultExample.locator('.lx-empty__image');
    await expect(defaultExample).toHaveAttribute('role', 'status');
    await expect(defaultExample.locator('.lx-empty__desc')).toHaveCSS('font-size', '13px');
    await expect.poll(() => getContrastRatio(defaultExample.locator('.lx-empty__desc'))).toBeGreaterThanOrEqual(4.5);
    await expect.poll(() => getContrastRatio(defaultExample.locator('.lx-empty__image'))).toBeGreaterThanOrEqual(3);
    await expect
      .poll(() =>
        defaultImage.evaluate((element) => ({
          width: getComputedStyle(element).width,
          height: getComputedStyle(element).height,
        })),
      )
      .toEqual({ width: '64px', height: '64px' });

    const footerAction = page.getByRole('button', { name: '新建映射' });
    const actionHeight = await footerAction.evaluate((element) => element.getBoundingClientRect().height);
    expect(actionHeight).toBeGreaterThanOrEqual(44);
    await expect.poll(() => getContrastRatio(footerAction)).toBeGreaterThanOrEqual(4.5);
    await footerAction.focus();
    await expect(footerAction).toBeFocused();
    await page.keyboard.press('Enter');
    const createdMappings = page.getByTestId('created-mappings');
    await expect(createdMappings.getByRole('listitem')).toHaveText('新建映射 1');
    await expect(createdMappings).toBeFocused();
    await expect(page.getByTestId('create-feedback')).toHaveText('已创建映射：新建映射 1');
    await page.getByRole('button', { name: '恢复空态' }).click();
    await expect(page.getByTestId('default-example').locator('.lx-empty')).toBeVisible();
    await expect(footerAction).toBeFocused();

    const customImage = page.getByTestId('image-size-example').locator('.lx-empty__image');
    await expect.poll(() => customImage.evaluate((element) => getComputedStyle(element).width)).toBe('80px');
    await expect(page.getByTestId('compact-example').locator('.lx-empty--compact')).toBeVisible();
    await expect(page.getByTestId('compact-example').locator('.lx-icon')).toBeVisible();

    await page.screenshot({ path: 'test-results/lx-empty-light.png' });
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('.empty-demo')).toHaveClass(/lx-theme-hud/);
    await expect.poll(() => getContrastRatio(footerAction)).toBeGreaterThanOrEqual(4.5);
    await expect.poll(() => getContrastRatio(defaultExample.locator('.lx-empty__desc'))).toBeGreaterThanOrEqual(4.5);
    await expect.poll(() => getContrastRatio(defaultExample.locator('.lx-empty__image'))).toBeGreaterThanOrEqual(3);

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 780 });
      await expect(page.getByTestId('long-description-example').locator('.lx-empty__desc')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `test-results/lx-empty-${width}.png` });
    }

    const filteredEmpty = page.getByTestId('filtered-empty');
    await expect(filteredEmpty.locator('.lx-empty__desc')).toContainText('最近 30 天');
    const clearFilter = page.getByRole('button', { name: '清除筛选' });
    expect(await clearFilter.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await clearFilter.click();
    const filteredResults = page.getByTestId('filtered-results');
    await expect(filteredResults.getByRole('listitem')).toHaveCount(2);
    await expect(filteredResults).toBeFocused();
    await page.getByRole('button', { name: '重新应用筛选' }).click();
    await expect(filteredEmpty).toBeVisible();
    await expect(clearFilter).toBeFocused();
  });
});
