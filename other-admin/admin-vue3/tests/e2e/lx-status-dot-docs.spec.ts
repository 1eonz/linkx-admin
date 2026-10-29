import { expect, test } from '@playwright/test';

for (const width of [1280, 375, 320]) {
  test.describe(`${width}px状态点示例`, () => {
    test.use({ viewport: { width, height: 900 }, hasTouch: width < 800, isMobile: width < 800 });
    for (const hud of [false, true]) {
      test(`${hud ? 'HUD' : '浅色'}主题、尺寸、长文本与局部滚动`, async ({ page }, testInfo) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/components/lxstatusdot');
        const demo = page.locator('.lx-status-demo');
        if (hud) await demo.getByText('HUD 深色主题', { exact: true }).click();
        const states = demo.getByTestId('status-semantics');
        for (const name of ['在线', '处理中', '忙碌', '错误', '离线']) {
          await expect(states.getByRole('img', { name, exact: true })).toBeVisible();
        }
        await expect(demo.getByTestId('status-dense').getByRole('img')).toHaveCount(24);
        await expect(demo.getByTestId('status-dense').locator('.lx-status-dot__ping')).toHaveCount(0);
        const geometry = await demo
          .getByTestId('status-sizes')
          .locator('.lx-status-dot__wrap')
          .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
        expect(geometry).toEqual([6, 8, 10]);
        const long = demo.getByTestId('status-long');
        expect(await long.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        await expect(long.getByRole('img').first()).toHaveAccessibleName(/请先查看链路详情/);
        const table = demo.getByRole('region', { name: '节点状态表，可横向滚动' });
        await table.focus();
        if (width < 800) {
          expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        expect(
          await states.locator('.lx-status-dot__ping').evaluate((element) => getComputedStyle(element).animationName),
        ).toBe('none');
        await demo.screenshot({ path: testInfo.outputPath('状态点主题与响应式.png') });
      });
    }
  });
}

for (const hud of [false, true]) {
  test(`${hud ? 'HUD' : '浅色'}复用呼吸令牌并支持关闭`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/components/lxstatusdot');
    const demo = page.locator('.lx-status-demo');
    if (hud) await demo.getByText('HUD 深色主题', { exact: true }).click();
    const online = demo.getByTestId('status-semantics').getByRole('img', { name: '在线', exact: true });
    const motion = await online.locator('.lx-status-dot__dot').evaluate((element) => {
      const style = getComputedStyle(element);
      return { name: style.animationName, duration: style.animationDuration, count: style.animationIterationCount };
    });
    expect(motion).toEqual({ name: 'lx-hud-pulse', duration: '3.5s', count: 'infinite' });
    await demo.getByText('开启在线呼吸', { exact: true }).click();
    await expect(online.locator('.lx-status-dot__ping')).toHaveCount(0);
    await expect(online).toHaveAccessibleName('在线');
  });

  test(`${hud ? 'HUD' : '浅色'}宿主Mock失败、空结果、取消及恢复`, async ({ page }) => {
    await page.route('**/*', (route) => {
      const hostname = new URL(route.request().url()).hostname;
      return /^(127\.0\.0\.1|localhost)$/.test(hostname) ? route.continue() : route.abort();
    });
    await page.goto('/components/lxstatusdot');
    const demo = page.locator('.lx-status-demo');
    if (hud) await demo.getByText('HUD 深色主题', { exact: true }).click();
    const recovery = demo.locator('.lx-status-recovery');
    const result = recovery.getByTestId('status-recovery-result');
    const refresh = recovery.getByRole('button', { name: '刷新状态' });
    const scenario = recovery.getByLabel('模拟结果');
    await expect(result.getByRole('img', { name: '错误', exact: true })).toBeVisible();
    await scenario.selectOption('failure');
    await refresh.focus();
    await page.keyboard.press('Enter');
    await expect(recovery).toHaveAttribute('aria-busy', 'true');
    await expect(scenario).toBeDisabled();
    await expect(recovery.getByRole('status')).toContainText('模拟链路超时');
    await expect(result.getByRole('img', { name: '错误', exact: true })).toBeVisible();
    await scenario.selectOption('forbidden');
    await refresh.click();
    await expect(recovery.getByRole('status')).toContainText('模拟权限不足');
    await scenario.selectOption('empty');
    await refresh.click();
    await expect(result).toHaveText('暂无节点状态');
    await scenario.selectOption('success');
    await refresh.click();
    await recovery.getByRole('button', { name: '取消刷新', exact: true }).click();
    await expect(recovery).toHaveAttribute('aria-busy', 'false');
    await expect(recovery.getByRole('status')).toContainText('已取消刷新');
    await expect(result).toHaveText('暂无节点状态');
    await refresh.click();
    await expect(result.getByRole('img', { name: '在线', exact: true })).toBeVisible();
    await expect(recovery.getByRole('status')).toContainText('链路恢复在线');
    await expect(recovery).toHaveAttribute('aria-busy', 'false');
  });
}
