import { expect, test } from '@playwright/test';

test.describe('lx-ui 基础按钮设计回归', () => {
  test('语义文字在亮色和 HUD 的默认、悬停、按下状态可读', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxbutton.html');
    const demo = page.locator('.lx-button-demo');
    await expect(demo).toBeVisible();
    await demo.locator('.lx-button-demo__variants summary').click();

    for (const hud of [false, true]) {
      await page.getByLabel('HUD 深色主题', { exact: true }).setChecked(hud);
      for (const name of ['核准归档', '催办预警']) {
        const button = demo.getByRole('button', { name, exact: true });
        for (const state of ['default', 'hover', 'active']) {
          if (state === 'default') await page.mouse.move(0, 0);
          else await button.hover();
          if (state === 'active') await page.mouse.down();

          const contrast = await button.evaluate((element) => {
            const channels = (color: string): number[] => {
              const values = color.match(/[\d.]+/g)?.map(Number);
              if (!values || values.length < 3) throw new Error(`无法解析颜色：${color}`);
              const scale = color.startsWith('color(srgb ') ? 255 : 1;
              if (!color.startsWith('rgb') && scale === 1) throw new Error(`不支持的颜色空间：${color}`);
              return [...values.slice(0, 3).map((channel) => channel * scale), values[3] ?? 1];
            };
            const blend = (front: number[], back: number[]) =>
              front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
            const surface = element.closest('.lx-button-demo__panel');
            if (!surface) throw new Error('按钮缺少展示表面');
            const style = getComputedStyle(element);
            const background = blend(
              channels(style.backgroundColor),
              channels(getComputedStyle(surface).backgroundColor),
            );
            const luminance = (rgb: number[]) => {
              const linear = rgb.map((channel) => {
                const value = channel / 255;
                return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
              });
              return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
            };
            const foreground = luminance(channels(style.color).slice(0, 3));
            const backdrop = luminance(background);
            return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
          });
          if (state === 'active') await page.mouse.up();
          expect(contrast, `${hud ? 'HUD' : '亮色'} ${name} ${state}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('先展示推荐组合，完整语义变体可展开查看', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    const matrix = page.getByTestId('matrix');
    const variants = matrix.locator('.lx-button-demo__variants');

    await expect(matrix.getByRole('button', { name: '主操作按钮' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '次级线框按钮' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '查看详情' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '批量删除警情' })).toBeHidden();

    await variants.locator('summary').click();
    for (const name of ['批量删除警情', '审批核准', '告警待决']) {
      await expect(matrix.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });

  test('尺寸、加载拦截、键盘焦点和窄屏触控符合契约', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    const demo = page.locator('.lx-button-demo');
    const primary = demo.getByRole('button', { name: '主操作按钮', exact: true });
    for (const [size, height] of [
      ['sm', 28],
      ['md', 32],
      ['lg', 40],
    ] as const) {
      await page.getByLabel('按钮尺寸档').selectOption(size);
      await expect(primary).toHaveCSS('height', `${height}px`);
      const bounds = await primary.boundingBox();
      expect(bounds?.height, `${size} 档可见按钮高度`).toBe(height);
    }

    const submit = demo.getByRole('button', { name: '确认下发指令', exact: true });
    await submit.click();
    const pending = demo.getByRole('button', { name: '下发指令中...', exact: true });
    await expect(pending).toHaveAttribute('aria-busy', 'true');
    await expect(pending).toBeDisabled();
    await expect(submit).toBeEnabled();
    await expect(demo.locator('.lx-button-demo__status')).toContainText('指令已下发');

    const refresh = demo.getByRole('button', { name: '刷新数据', exact: true });
    await refresh.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(refresh).toBeFocused();
    await expect(refresh).toHaveCSS('outline-style', 'solid');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transition = await refresh.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transition.split(',').every((duration) => Number.parseFloat(duration) <= 0.00002)).toBe(true);

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      const box = await refresh.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});
