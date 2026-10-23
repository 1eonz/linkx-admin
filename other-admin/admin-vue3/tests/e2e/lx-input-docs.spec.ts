import { expect, test } from '@playwright/test';

test('LxInput 前后缀、密码及透传示例保留可见边框', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/components/lxinput');

  const addons = page.locator('[data-testid="addons"]');
  const compound = addons
    .locator('#demo-case-code')
    .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]');
  const password = addons
    .locator('#demo-secret')
    .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]');

  await expect(compound).toBeVisible();
  await expect(password).toBeVisible();

  const compoundBorder = await compound.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.borderTopWidth,
      style: style.borderTopStyle,
      color: style.borderTopColor,
    };
  });
  const passwordBorder = await password.locator('.el-input__wrapper').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.borderTopWidth,
      style: style.borderTopStyle,
      color: style.borderTopColor,
    };
  });

  expect(compoundBorder).toMatchObject({ width: '1px', style: 'solid' });
  expect(compoundBorder.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(passwordBorder).toMatchObject({ width: '1px', style: 'solid' });
  expect(passwordBorder.color).not.toBe('rgba(0, 0, 0, 0)');

  await page.locator('#demo-secret').focus();
  const focusedPassword = await password.locator('.el-input__wrapper').evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.borderTopWidth, style: style.borderTopStyle, shadow: style.boxShadow };
  });
  expect(focusedPassword.width).toBe('1px');
  expect(focusedPassword.style).toBe('solid');
  expect(focusedPassword.shadow).not.toBe('none');

  await page.getByLabel('HUD 深色主题').check();
  await expect(compound).toBeVisible();
  await expect(password.locator('.el-input__wrapper')).toBeVisible();
  const hudBorders = await Promise.all([
    compound.evaluate((element) => getComputedStyle(element).borderTopColor),
    password.locator('.el-input__wrapper').evaluate((element) => getComputedStyle(element).borderTopColor),
  ]);
  expect(hudBorders.every((color) => color !== 'rgba(0, 0, 0, 0)')).toBe(true);
});
