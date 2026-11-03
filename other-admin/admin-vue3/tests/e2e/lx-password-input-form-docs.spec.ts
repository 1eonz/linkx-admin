import { expect, test } from '@playwright/test';

for (const view of [
  { width: 1280, hud: false },
  { width: 320, hud: true },
]) {
  test(`PasswordInput 表单错误关联、遮罩与恢复 ${view.width}/${view.hud ? 'HUD' : 'Light'}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: view.width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxpasswordinput');
    const form = page.getByTestId('password-form-demo');
    const input = form.getByLabel('表单访问口令', { exact: true });
    const submit = form.getByRole('button', { name: '校验口令', exact: true });
    const feedback = form.getByTestId('password-validation-feedback');
    await form.getByRole('checkbox').setChecked(view.hud);
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue('');
    await submit.click();
    await expect(form.locator('.el-form-item__error')).toHaveText('请输入表单访问口令');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-required', 'true');
    const errorId = await form.locator('.el-form-item__error').getAttribute('id');
    expect(errorId).toBeTruthy();
    const descriptions = (await input.getAttribute('aria-describedby'))?.split(/\s+/);
    expect(descriptions).toContain('demo-password-hint');
    expect(descriptions).toContain(errorId);

    await input.fill('short');
    const clear = form.getByRole('button', { name: '清空输入框', exact: true });
    const clearBounds = await clear.boundingBox();
    const toggleBounds = await form.locator('.lx-password-input__toggle').boundingBox();
    expect(clearBounds).not.toBeNull();
    expect(toggleBounds).not.toBeNull();
    if (!clearBounds || !toggleBounds) throw new Error('清空或显隐按钮缺少可见区域');
    expect(
      Math.min(clearBounds.x + clearBounds.width, toggleBounds.x + toggleBounds.width) -
        Math.max(clearBounds.x, toggleBounds.x),
      '清空与显隐按钮的水平点击区域不能重叠',
    ).toBeLessThanOrEqual(0);
    await clear.click();
    await expect(input).toHaveValue('');
    await input.fill('short');
    await submit.click();
    await expect(form.locator('.el-form-item__error')).toHaveText('访问口令需为 8 至 32 个字符');
    const reveal = form.getByRole('button', { name: '显示密码', exact: true });
    await reveal.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('short');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await form.screenshot({ path: testInfo.outputPath('password-form-error.png') });
    await submit.focus();
    await expect(input).toHaveAttribute('type', 'password');

    await input.fill('Demo-Access-2026');
    await submit.click();
    await expect(feedback).toHaveText('口令校验通过');
    await expect(form.locator('.el-form-item__error')).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', 'demo-password-hint');
    expect(await feedback.textContent()).not.toContain('Demo-Access-2026');

    await input.fill('short');
    await submit.click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await form.getByRole('button', { name: '显示密码', exact: true }).click();
    await expect(input).toHaveAttribute('type', 'text');
    await form.getByRole('button', { name: '重置口令', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(feedback).toHaveText('');
    await expect(form.locator('.el-form-item__error')).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', 'demo-password-hint');
    for (const button of await form.locator('.password-form-demo__actions').getByRole('button').all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    expect(await form.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
      await form.evaluate((element) => element.clientWidth),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(view.width);
    await form.screenshot({ path: testInfo.outputPath('password-form-reset.png') });
  });
}
