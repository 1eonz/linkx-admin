import { expect, test } from '@playwright/test';

for (const width of [1280, 375, 320]) {
  for (const hud of [false, true]) {
    test(`${width}px ${hud ? 'HUD' : '浅色'} 面包屑长路径、焦点及受控回退`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxbreadcrumb');
      const demo = page.locator('.breadcrumb-demo');
      if (hud) await demo.getByRole('button', { name: 'HUD 深色', exact: true }).click();
      await demo.getByRole('button', { name: '长路径', exact: true }).click();
      const nav = demo.getByRole('navigation', { name: '面包屑导航' });
      await expect(nav.getByRole('link')).toHaveCount(3);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('当前地图配置与跨区域协同值班的完整页面名称');
      const home = nav.getByRole('link', { name: '首页', exact: true });
      await demo.getByRole('button', { name: '恢复默认路径', exact: true }).focus();
      await page.keyboard.press('Tab');
      await expect(home).toBeFocused();
      const focus = await home.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(focus.style).toBe('solid');
      expect(focus.width).toBeGreaterThanOrEqual(2);
      const metrics = await nav.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          pageWidth: document.documentElement.scrollWidth,
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
          items: [...element.querySelectorAll<HTMLElement>('.lx-breadcrumb__segment,.lx-breadcrumb__extra')].map(
            (item) => {
              const rect = item.getBoundingClientRect();
              return { inside: rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1, height: rect.height };
            },
          ),
        };
      });
      expect(metrics.pageWidth).toBeLessThanOrEqual(width + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
      expect(metrics.items.every((item) => item.inside && item.height > 0)).toBe(true);
      await demo.screenshot({ path: testInfo.outputPath('长路径与键盘焦点.png') });
      const base = nav.getByRole('link', { name: '基础数据', exact: true });
      await base.focus();
      await page.keyboard.press('Enter');
      await expect(nav.locator('[aria-current="page"]')).toHaveText('基础数据');
      await expect(nav.getByRole('link')).toHaveCount(1);
      await expect(demo.getByRole('status')).toContainText('示例宿主已更新路径');
      await expect(demo.getByRole('status')).toBeFocused();
      await demo.getByRole('button', { name: '清空路径', exact: true }).click();
      await expect(nav.locator('ol')).toHaveCount(0);
      await expect(nav).toContainText('尚未定位页面');
      await expect(demo.getByRole('button', { name: '清空路径', exact: true })).toBeDisabled();
      await demo.getByRole('button', { name: '恢复默认路径', exact: true }).click();
      await expect(nav.locator('[aria-current="page"]')).toHaveText('地图配置');
    });
  }
}

test('触屏链接达到44px，Ctrl点击保留原生新标签且不改示例路径', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/components/lxbreadcrumb', baseURL).href);
    const demo = page.locator('.breadcrumb-demo');
    const nav = demo.getByRole('navigation', { name: '面包屑导航' });
    const home = nav.getByRole('link', { name: '首页', exact: true });
    const bounds = await home.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await demo.getByRole('button', { name: '长路径', exact: true }).tap();
    await expect(nav.getByRole('link')).toHaveCount(3);
    const touchHeights = await nav
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
    expect(touchHeights.every((height) => height >= 44)).toBe(true);
    await nav.getByRole('link', { name: '基础数据', exact: true }).tap();
    await expect(nav.locator('[aria-current="page"]')).toHaveText('基础数据');
    await expect(demo.getByRole('status')).toBeFocused();
    await demo.getByRole('button', { name: '恢复默认路径', exact: true }).tap();
    const [newTab] = await Promise.all([context.waitForEvent('page'), home.click({ modifiers: ['Control'] })]);
    await newTab.waitForLoadState();
    expect(newTab.url()).toContain('#breadcrumb-home');
    await expect(nav.locator('[aria-current="page"]')).toHaveText('地图配置');
    await newTab.close();
  } finally {
    await context.close();
  }
});
