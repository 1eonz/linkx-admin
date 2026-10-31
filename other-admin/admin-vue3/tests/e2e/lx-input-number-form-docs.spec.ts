import { expect, test } from '@playwright/test';

for (const view of [
  { width: 1280, hud: false },
  { width: 320, hud: true },
]) {
  test(`InputNumber 表单校验、错误关联、恢复和实例方法 ${view.width}/${view.hud ? 'HUD' : 'Light'}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: view.width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxinputnumber');
    const demo = page.getByTestId('number-form-demo');
    const input = demo.getByLabel('本次调度配额', { exact: true });
    const submit = demo.getByRole('button', { name: '校验配额', exact: true });
    const feedback = demo.getByTestId('number-validation-feedback');
    await demo.getByRole('checkbox', { name: '表单示例 HUD 深色主题' }).setChecked(view.hud);
    await expect(input).toHaveValue('');
    await submit.click();
    await expect(demo.getByText('请输入本次调度配额', { exact: true })).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-required', 'true');
    await expect(input).toBeFocused();
    const describedBy = await input.getAttribute('aria-describedby');
    expect(describedBy?.split(/\s+/)).toContain('demo-number-quota-hint');
    const errorId = await demo.locator('.el-form-item__error').getAttribute('id');
    expect(errorId).toBeTruthy();
    expect(describedBy?.split(/\s+/)).toContain(errorId);
    await expect(feedback).toHaveText('配额校验未通过');

    await input.fill('12');
    await submit.click();
    await expect(demo.getByText('本次调度配额应为 1 至 10', { exact: true })).toBeVisible();
    await expect(input).toHaveValue('12');
    await demo.screenshot({ path: `test-results/input-number-form-error-${view.width}.png` });

    await input.fill('5');
    await submit.click();
    await expect(feedback).toHaveText('配额校验通过');
    await expect(demo.locator('.el-form-item__error')).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', 'demo-number-quota-hint');

    const focus = demo.getByRole('button', { name: '聚焦数值字段', exact: true });
    await focus.focus();
    await page.keyboard.press('Enter');
    await expect(input).toBeFocused();
    await expect(demo.getByTestId('number-focus-feedback')).toHaveText('数值字段已聚焦');
    await demo.getByRole('button', { name: '失焦数值字段', exact: true }).click();
    await expect(input).not.toBeFocused();
    await expect(demo.getByTestId('number-focus-feedback')).toHaveText('数值字段已失焦');

    await input.fill('12');
    await submit.click();
    await expect(demo.getByText('本次调度配额应为 1 至 10', { exact: true })).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await demo.getByRole('button', { name: '重置配额', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(feedback).toHaveText('');
    await expect(demo.locator('.el-form-item__error')).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', 'demo-number-quota-hint');
    const bounds = await demo.evaluate((element) => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(view.width);
    for (const button of await demo.locator('.lx-input-number-form-demo__actions').getByRole('button').all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    await demo.screenshot({ path: `test-results/input-number-form-reset-${view.width}.png` });
  });
}
