import { expect, test } from '@playwright/test';

test('路由页签支持方向键定位、原生激活、中键关闭和关闭后焦点回收', async ({ page }) => {
  await page.goto('/components/lxtabsbar');
  const navigation = page.getByRole('navigation', { name: '已打开页面' });
  const overview = navigation.getByRole('button', { name: '系统总览', exact: true });
  const tags = navigation.getByRole('button', { name: '群组标签', exact: true });
  const archive = navigation.getByRole('button', { name: '活动归档', exact: true });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tags).toBeFocused();
  await expect(overview).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Enter');
  await expect(tags).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('End');
  await expect(navigation.locator('.lx-tabs-bar__trigger').last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
  await overview.click({ button: 'middle' });
  await expect(overview).toHaveCount(1);
  await archive.click({ button: 'middle' });
  await expect(archive).toHaveCount(0);
  const close = navigation.getByRole('button', { name: '关闭 群组标签', exact: true });
  await close.focus();
  await expect(close).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(tags).toHaveCount(0);
  await expect(navigation.locator('.lx-tabs-bar__trigger').last()).toBeFocused();
});

for (const width of [1280, 375, 320]) {
  for (const hud of [false, true]) {
    test(`${width}px ${hud ? 'HUD' : '浅色'} 下页签局部滚动、焦点和触控尺寸稳定`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxtabsbar');
      if (hud) {
        await page.locator('.tabs-demo').evaluate((element) => element.classList.add('lx-theme-hud'));
      }
      const navigation = page.getByRole('navigation', { name: '已打开页面' });
      const add = navigation.getByRole('button', { name: '新建页签' });
      for (let index = 0; index < 6; index += 1) await add.click();
      const active = navigation.locator('[aria-current="page"]');
      await expect(active).toBeInViewport();
      await expect(add).toBeFocused();
      const visibleActive = await active.evaluate((element) => {
        const region = element.closest('.lx-tabs-bar__scroll');
        if (!region) throw new Error('缺少页签滚动区域');
        const bounds = region.getBoundingClientRect();
        const target = element.getBoundingClientRect();
        return target.left >= bounds.left - 1 && target.right <= bounds.right + 1;
      });
      expect(visibleActive).toBe(true);
      const first = navigation.locator('.lx-tabs-bar__trigger').first();
      await first.focus();
      await page.keyboard.press('End');
      const last = navigation.locator('.lx-tabs-bar__trigger').last();
      await expect(last).toBeFocused();
      await expect(last).toBeInViewport();
      const geometry = await navigation.evaluate((element) => {
        const scroll = element.querySelector<HTMLElement>('.lx-tabs-bar__scroll');
        const close = element.querySelector<HTMLElement>('.lx-tabs-bar__close');
        const trigger = element.querySelector<HTMLElement>('.lx-tabs-bar__trigger');
        if (!scroll || !close || !trigger) throw new Error('缺少页签布局节点');
        const rect = element.getBoundingClientRect();
        return {
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
          right: rect.right,
          left: rect.left,
          localOverflow: scroll.scrollWidth > scroll.clientWidth,
          closeWidth: close.getBoundingClientRect().width,
          closeHeight: close.getBoundingClientRect().height,
          triggerHeight: trigger.getBoundingClientRect().height,
        };
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.right).toBeLessThanOrEqual(width + 1);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.localOverflow).toBe(true);
      expect(geometry.closeWidth).toBeGreaterThanOrEqual(width <= 640 ? 44 : 24);
      expect(geometry.closeHeight).toBeGreaterThanOrEqual(width <= 640 ? 44 : 24);
      if (width <= 640) expect(geometry.triggerHeight).toBeGreaterThanOrEqual(44);
      expect(errors).toEqual([]);
      await navigation.screenshot({ path: testInfo.outputPath('页签状态.png') });
    });
  }
}
