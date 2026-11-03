import { expect, test } from '@playwright/test';

for (const width of [1280, 320]) {
  for (const theme of ['light', 'dark', 'local-hud', 'root-hud']) {
    test(`Textarea 默认边界对比与状态优先级 ${width}/${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await page.goto('/components/lxtextarea');
      const demo = page.locator('.lx-textarea-demo');
      const field = demo.locator('#demo-instruction');
      await expect(field).toBeVisible();
      await demo.locator('[data-testid="advanced-states"] > summary').click();
      const themeSwitch = demo.getByLabel('HUD 深色主题', { exact: true });
      if (theme === 'local-hud') await themeSwitch.check();
      await page.evaluate((selectedTheme) => {
        document.documentElement.classList.toggle('dark', selectedTheme === 'dark' || selectedTheme === 'root-hud');
        document.documentElement.classList.toggle('lx-theme-hud', selectedTheme === 'root-hud');
      }, theme);
      await field.fill('');
      await field.blur();
      await page.mouse.move(0, 0);

      const measurements = await demo.locator('textarea:not(:disabled)').evaluateAll((fields) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('无法创建实际颜色采样画布');
        // 由浏览器解析透明色及color-mix，不能把alpha忽略后直接计算对比度。
        const parse = (color: string) => {
          if (!CSS.supports('color', color)) throw new Error(`无法解析边界颜色：${color}`);
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data);
        };
        const composite = (foreground: number[], background: number[]) =>
          foreground
            .slice(0, 3)
            .map((channel, index) => channel * (foreground[3] / 255) + background[index] * (1 - foreground[3] / 255));
        const background = (element: Element | null) => {
          const layers: number[][] = [];
          for (let current = element; current; current = current.parentElement) {
            const style = getComputedStyle(current);
            if (style.backgroundImage !== 'none') throw new Error('边界采样遇到背景图片，不能按纯色宣称通过');
            layers.push(parse(style.backgroundColor));
          }
          return layers.reverse().reduce((visible, layer) => composite(layer, visible), [255, 255, 255]);
        };
        const luminance = (color: number[]) => {
          const channels = color.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const contrast = (first: number[], second: number[]) => {
          const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };
        return fields
          .filter((element) => !element.closest('.lx-textarea.is-overflow'))
          .map((element) => {
            const style = getComputedStyle(element);
            const edge = style.boxShadow.match(/rgba?\([^)]+\)|color\([^)]+\)/)?.[0];
            if (!edge || !style.boxShadow.includes('inset')) throw new Error('默认文本域缺少可识别的内描边');
            const inside = background(element);
            const outside = background(element.parentElement);
            const border = composite(parse(edge), inside);
            const expectedHudSurface = parse(
              getComputedStyle(document.documentElement).getPropertyValue('--lx-bg-card').trim(),
            ).slice(0, 3);
            return {
              id: element.id,
              shadow: style.boxShadow,
              inside,
              outside,
              insideContrast: contrast(border, inside),
              outsideContrast: contrast(border, outside),
              rootHudSurfaceMatches: outside.every(
                (channel, index) => Math.abs(channel - expectedHudSurface[index]) < 1,
              ),
            };
          });
      });
      await testInfo.attach('默认边界实际采样', {
        body: JSON.stringify(measurements, null, 2),
        contentType: 'application/json',
      });
      expect(measurements.length).toBeGreaterThanOrEqual(6);
      for (const measurement of measurements) {
        expect.soft(measurement.insideContrast, `${measurement.id} 边框与内侧表面对比`).toBeGreaterThanOrEqual(3);
        expect.soft(measurement.outsideContrast, `${measurement.id} 边框与外侧表面对比`).toBeGreaterThanOrEqual(3);
        if (theme === 'root-hud')
          expect.soft(measurement.rootHudSurfaceMatches, `${measurement.id} 根HUD表面不得被文档dark桥覆盖`).toBe(true);
      }

      const defaultShadow = await field.evaluate((element) => getComputedStyle(element).boxShadow);
      const defaultBounds = await field.boundingBox();
      await field.hover();
      await expect.poll(() => field.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(defaultShadow);
      await page.mouse.move(0, 0);
      await themeSwitch.focus();
      await page.keyboard.press('Tab');
      await expect(field).toBeFocused();
      expect(await field.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('2px');
      await field.hover();
      expect(await field.evaluate((element) => getComputedStyle(element).boxShadow)).toContain('2px');
      const focusedBounds = await field.boundingBox();
      expect(defaultBounds).not.toBeNull();
      expect(focusedBounds).not.toBeNull();
      expect(focusedBounds?.width).toBe(defaultBounds?.width);
      expect(focusedBounds?.height).toBe(defaultBounds?.height);
      await page.mouse.move(0, 0);
      await field.blur();
      await expect.poll(() => field.evaluate((element) => getComputedStyle(element).boxShadow)).toBe(defaultShadow);

      const locked = demo.locator('#demo-locked');
      await expect(locked).toBeDisabled();
      const disabledShadow = await locked.evaluate((element) => getComputedStyle(element).boxShadow);
      const disabledToken = await locked.evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--lx-border-light)';
        element.parentElement?.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      expect(disabledShadow).toBe(`${disabledToken} 0px 0px 0px 1px inset`);
      await locked.hover();
      await expect(locked).toHaveCSS('box-shadow', disabledShadow);
      const readonly = demo.locator('#demo-readonly');
      await expect(readonly).toHaveAttribute('readonly', '');
      await readonly.focus();
      await expect(readonly).toBeFocused();

      for (const id of ['demo-overflow-readonly', 'demo-overflow-disabled']) {
        const combinedState = demo.locator(`#${id}`);
        await expect(combinedState).toHaveAttribute('aria-invalid', 'true');
        const combinedStyle = await combinedState.evaluate((element) => ({
          color: getComputedStyle(element).color,
          shadow: getComputedStyle(element).boxShadow,
        }));
        expect(combinedStyle.shadow, '只读/禁用叠加超限仍由错误边线接管').toContain(combinedStyle.color);
      }

      const overflow = demo.locator('#demo-overflow');
      await expect(overflow).toHaveAttribute('aria-invalid', 'true');
      await overflow.focus();
      const error = await overflow.evaluate((element) => ({
        color: getComputedStyle(element).color,
        shadow: getComputedStyle(element).boxShadow,
      }));
      expect(error.shadow).toContain(error.color);
      expect(error.shadow).toContain('2px');
      await overflow.fill('恢复后的备注');
      await overflow.blur();
      await page.mouse.move(0, 0);
      await expect(overflow).not.toHaveAttribute('aria-invalid', 'true');
      await expect(overflow).toHaveCSS('box-shadow', defaultShadow);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await demo.screenshot({ path: testInfo.outputPath('textarea-strong-border.png') });
    });
  }
}
