import { expect, test } from '@playwright/test';

test.describe('LxTag 文档', () => {
  test('覆盖语义色、尺寸、禁用和关闭按钮的键盘焦点', async ({ page }) => {
    await page.goto('/components/lxtag', { waitUntil: 'networkidle' });

    const tags = page.locator('.lx-tag');
    await expect(tags).toHaveCount(7);
    await expect(page.locator('.lx-tag--small')).toHaveCount(1);
    await expect(page.locator('.lx-tag--large')).toHaveCount(1);
    await expect(page.locator('.lx-tag.is-disabled')).toHaveCount(1);

    const close = page.locator('.lx-tag__close').first();
    await expect(close).toHaveAttribute('aria-label', '关闭标签');
    await close.focus();
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-width', '2px');

    const geometry = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      closeHeight: document.querySelector<HTMLElement>('.lx-tag__close')?.getBoundingClientRect().height,
      disabledText: getComputedStyle(document.querySelector<HTMLElement>('.lx-tag.is-disabled')!).color,
    }));
    expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.closeHeight).toBe(24);
    expect(geometry.disabledText).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('窄屏长标签不撑出页面宽度', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtag', { waitUntil: 'networkidle' });

    const geometry = await page.evaluate(() => ({
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  });
});
