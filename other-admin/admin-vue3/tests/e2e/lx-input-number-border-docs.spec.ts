import { expect, test } from '@playwright/test';

for (const width of [1280, 320]) {
  for (const theme of ['light', 'local-hud', 'root-hud']) {
    test(`InputNumber 强边界及状态优先级 ${width}/${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/components/lxinputnumber');
      const demo = page.locator('.lx-input-number-demo');
      await expect(demo.locator('#demo-number-quota')).toBeVisible();
      if (theme === 'root-hud') {
        await page.evaluate(() => document.documentElement.classList.add('dark', 'lx-theme-hud'));
      } else if (theme === 'local-hud') {
        await demo.getByLabel('HUD 深色主题', { exact: true }).check();
      }
      await page.mouse.move(0, 0);
      const measurements = await demo.locator('.lx-input-number:not(.is-disabled)').evaluateAll((controls) => {
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3) throw new Error(`无法解析边界颜色：${color}`);
          const linear = channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const contrast = (first: string, second: string) => {
          const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };
        return controls.map((control) => {
          const wrapper = control.querySelector('.el-input__wrapper');
          const panel = control.closest('.lx-input-number-demo__panel');
          if (!wrapper || !panel) throw new Error('缺少数值输入边框或相邻面板');
          const style = getComputedStyle(wrapper);
          const edgeColor = style.boxShadow.match(/rgba?\([^)]+\)/)?.[0];
          if (!edgeColor) throw new Error('默认边框阴影缺少可识别颜色');
          const separators = Array.from(
            control.querySelectorAll(
              '.lx-input-number__stepper, .lx-input-number__stepper-button + button, .el-input-number__decrease, .el-input-number__increase',
            ),
          ).flatMap((element) => {
            const separator = getComputedStyle(element);
            return ['Left', 'Right', 'Top', 'Bottom'].flatMap((side) => {
              const property = side.toLowerCase();
              return parseFloat(separator.getPropertyValue(`border-${property}-width`)) > 0
                ? [contrast(separator.getPropertyValue(`border-${property}-color`), style.backgroundColor)]
                : [];
            });
          });
          return {
            edgeColor,
            inside: contrast(edgeColor, style.backgroundColor),
            outside: contrast(edgeColor, getComputedStyle(panel).backgroundColor),
            separators,
          };
        });
      });
      expect(measurements.length).toBeGreaterThanOrEqual(8);
      for (const measurement of measurements) {
        expect(measurement.inside, '外框与控件表面对比').toBeGreaterThanOrEqual(3);
        expect(measurement.outside, '外框与面板对比').toBeGreaterThanOrEqual(3);
        for (const contrast of measurement.separators) expect(contrast, '步进分隔线对比').toBeGreaterThanOrEqual(3);
      }
      const quota = demo.locator('#demo-number-quota');
      const wrapper = demo.locator('[data-testid="basic"] .el-input__wrapper').first();
      const defaultShadow = await wrapper.evaluate((element) => getComputedStyle(element).boxShadow);
      await wrapper.hover();
      await expect
        .poll(() => wrapper.evaluate((element) => getComputedStyle(element).boxShadow))
        .not.toBe(defaultShadow);
      await quota.focus();
      await expect(wrapper).toHaveClass(/is-focus/);
      expect(await wrapper.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(defaultShadow);
      const compatible = demo.locator('#demo-number-compatible');
      await compatible.focus();
      await page.keyboard.press('ArrowUp');
      await expect(compatible).toHaveValue('31');
      await expect(demo.locator('#demo-number-locked')).toBeDisabled();
      await expect(demo.locator('[data-testid="disabled"] .el-input__wrapper')).toHaveCSS('opacity', '0.6');

      const form = page.getByTestId('number-form-demo');
      if (theme === 'local-hud') await form.getByRole('checkbox').check();
      await form.getByRole('button', { name: '校验配额', exact: true }).click();
      await expect(form.locator('.el-form-item__error')).toHaveText('请输入本次调度配额');
      const error = await form.locator('.el-input__wrapper').evaluate((element) => {
        const input = element.querySelector('input');
        return { shadow: getComputedStyle(element).boxShadow, color: input ? getComputedStyle(input).color : '' };
      });
      expect(error.shadow).toContain(error.color);
      await form.getByRole('button', { name: '重置配额', exact: true }).click();
      await expect(form.locator('.el-form-item__error')).toHaveCount(0);
      await expect
        .poll(() => form.locator('.el-input__wrapper').evaluate((element) => getComputedStyle(element).boxShadow))
        .toContain(measurements[0].edgeColor);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await demo.screenshot({ path: testInfo.outputPath('strong-border.png') });
    });
  }
}
