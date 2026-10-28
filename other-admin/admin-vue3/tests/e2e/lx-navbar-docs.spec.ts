import { expect, test } from '@playwright/test';

for (const width of [1280, 375, 320]) {
  for (const hud of [false, true]) {
    test(`${width}px ${hud ? 'HUD' : '浅色'} 导航全部操作可见并能使用键盘`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxnavbar');
      const demo = page.locator('.navbar-demo');
      if (hud) await demo.getByRole('button', { name: 'HUD 深色', exact: true }).click();
      const header = demo.locator('header');
      await expect(header.getByText('LinkX', { exact: true })).toBeVisible();
      await expect(header.getByText('运行总览', { exact: true })).toBeVisible();
      await expect(header.getByRole('button', { name: hud ? '浅色' : 'HUD 深色', exact: true })).toBeVisible();
      const metrics = await header.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
          pageWidth: document.documentElement.scrollWidth,
          controls: [...element.querySelectorAll<HTMLElement>('button,input')].map((control) => {
            const rect = control.getBoundingClientRect();
            const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            return {
              left: rect.left,
              right: rect.right,
              width: rect.width,
              height: rect.height,
              inside:
                rect.left >= bounds.left &&
                rect.right <= bounds.right + 1 &&
                rect.top >= bounds.top &&
                rect.bottom <= bounds.bottom + 1,
              hit: hit === control || Boolean(hit && control.contains(hit)),
            };
          }),
        };
      });
      expect(metrics.pageWidth).toBeLessThanOrEqual(width + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
      for (const control of metrics.controls) {
        expect(control.inside).toBe(true);
        expect(control.hit).toBe(true);
        expect(control.width).toBeGreaterThanOrEqual(24);
      }
      const input = demo.getByRole('searchbox', { name: '全局搜索' });
      await input.fill('  值班任务  ');
      await input.press('Enter');
      await expect(demo.getByTestId('last-action')).toHaveText('搜索：值班任务');
      await demo.getByRole('button', { name: '通知', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(demo.getByTestId('last-action')).toHaveText('已打开通知');
      const user = demo.getByRole('button', { name: '张晨 的用户菜单' });
      await user.focus();
      await page.keyboard.press('Enter');
      const profile = page.getByRole('menuitem', { name: '个人资料', exact: true });
      await expect(profile).toBeVisible();
      const popup = page.locator('.lx-navbar__menu:visible');
      const menuStyle = await popup.evaluate((element) => {
        const item = element.querySelector<HTMLElement>('[role="menuitem"]');
        if (!item) throw new Error('缺少用户菜单项');
        return {
          background: getComputedStyle(element).backgroundColor,
          itemHeight: item.getBoundingClientRect().height,
        };
      });
      const expectedBackground = await header.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(menuStyle.background).toBe(expectedBackground);
      if (width <= 640) expect(menuStyle.itemHeight).toBeGreaterThanOrEqual(44);
      await profile.focus();
      await page.keyboard.press('Enter');
      await expect(demo.getByTestId('last-action')).toHaveText('用户操作：profile');
      await expect(profile).toBeHidden();
      await user.focus();
      await page.keyboard.press('Enter');
      await expect(profile).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(profile).toBeHidden();
      await expect(user).toBeFocused();
      await header.screenshot({ path: testInfo.outputPath('导航布局.png') });
    });
  }
}

test('全屏拒绝显示反馈，重试成功并释放操作锁', async ({ page }) => {
  await page.goto('/components/lxnavbar');
  await page.evaluate(() => {
    let attempt = 0;
    let full = false;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => (full ? document.documentElement : null),
    });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: () => {
        attempt += 1;
        if (attempt === 1) return Promise.reject(new Error('本地模拟浏览器拒绝'));
        full = true;
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      },
    });
  });
  const demo = page.locator('.navbar-demo');
  await demo.getByRole('button', { name: '切换全屏', exact: true }).click();
  await expect(demo.locator('.lx-navbar__error')).toHaveText('无法切换全屏，请检查浏览器或嵌入页面权限后重试。');
  await expect(demo.getByTestId('last-action')).toHaveText('全屏切换失败，可以调整浏览器权限后重试');
  const retry = demo.getByRole('button', { name: '切换全屏', exact: true });
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect(demo.locator('.lx-navbar__error')).toBeHidden();
  await expect(demo.getByRole('button', { name: '退出全屏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(demo.getByTestId('last-action')).toHaveText('已进入全屏');
});
