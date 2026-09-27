import { expect, test } from '@playwright/test';

test.describe('LxSectionTitle 文档示例', () => {
  test('呈现设计变体、字号、标签语义和 extra 键盘操作', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxsectiontitle');

    await expect(page.getByRole('heading', { name: 'LxSectionTitle 区块标题' })).toBeVisible();
    for (const variant of ['border', 'dashed', 'plain']) {
      await expect(page.getByTestId(`variant-${variant}`).locator('.lx-section-title')).toHaveClass(
        new RegExp(`lx-section-title--${variant}`),
      );
    }

    const sizeSelector = page.getByLabel('标题尺寸');
    await sizeSelector.selectOption('small');
    await expect(page.getByTestId('variant-border').locator('.lx-section-title')).toHaveClass(
      /lx-section-title--small/,
    );
    await expect
      .poll(() =>
        page
          .getByTestId('variant-border')
          .locator('.lx-section-title__text')
          .evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe('12px');

    await sizeSelector.selectOption('large');
    await expect
      .poll(() =>
        page
          .getByTestId('variant-border')
          .locator('.lx-section-title__text')
          .evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe('18px');
    await expect(page.locator('.lx-section-title-demo .lx-tag')).toHaveCount(4);

    const primaryTag = page.getByTestId('variant-border').locator('.lx-tag--primary');
    await expect(primaryTag).toHaveText('8 项字段');
    await expect(page.getByTestId('variant-dashed').locator('.lx-tag--success')).toBeVisible();
    await expect(page.getByTestId('variant-plain').locator('.lx-tag--warning')).toBeVisible();

    const refresh = page.getByRole('button', { name: '刷新' });
    await refresh.focus();
    await expect(refresh).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('刷新接口配置', { exact: true })).toBeVisible();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('.lx-section-title-demo')).toHaveClass(/lx-theme-hud/);

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 780 });
      const longTitle = page.getByTestId('long-title-case').locator('.lx-section-title');
      const titleLabel = longTitle.locator('.lx-section-title__label');
      await expect(longTitle).toBeVisible();
      await expect
        .poll(() =>
          titleLabel.evaluate((element) => ({
            fits: element.scrollWidth > element.clientWidth,
            overflow: getComputedStyle(element).textOverflow,
          })),
        )
        .toEqual({ fits: true, overflow: 'ellipsis' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `test-results/lx-section-title-${width}.png` });
    }
  });
});
