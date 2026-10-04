import { expect, test } from '@playwright/test';

test.describe('lx-ui LxForm 文档示例', () => {
  test('桌面保留双列间距和通栏字段', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxform');
    await page.getByRole('button', { name: '编辑节点信息' }).click();

    const dialog = page.getByRole('dialog');
    const form = dialog.locator('.lx-form--grid');
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length))
      .toBe(2);

    const codeItem = dialog.locator('.el-form-item').filter({ hasText: '节点编码' });
    const nameItem = dialog.locator('.el-form-item').filter({ hasText: '节点名称' });
    const remarkItem = dialog.locator('.el-form-item').filter({ hasText: '备注' });
    const codeBox = await codeItem.boundingBox();
    const nameBox = await nameItem.boundingBox();
    const codeLabelBox = await codeItem.locator('.el-form-item__label').boundingBox();
    const nameLabelBox = await nameItem.locator('.el-form-item__label').boundingBox();
    const codeControlBox = await codeItem.locator('.el-input__wrapper').boundingBox();
    const nameControlBox = await nameItem.locator('.el-input__wrapper').boundingBox();
    if (!codeBox || !nameBox || !codeLabelBox || !nameLabelBox || !codeControlBox || !nameControlBox) {
      throw new Error('桌面双列表单字段未进入布局');
    }

    expect(nameBox.x).toBeGreaterThan(codeBox.x + codeBox.width);
    expect(Math.abs(nameLabelBox.y - codeLabelBox.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(nameControlBox.y - codeControlBox.y)).toBeLessThanOrEqual(2);
    await expect(codeItem.locator('.el-form-item__label')).toHaveCSS('font-size', '12px');
    await expect(codeItem.locator('.el-form-item__label')).toHaveCSS('font-weight', '500');
    await expect(codeItem.locator('.el-input__wrapper')).toHaveCSS('height', '32px');
    await expect(codeItem.locator('.el-input__wrapper')).toHaveCSS('border-radius', '4px');
    await expect(remarkItem).toHaveCSS('grid-column-start', '1');
    await expect(remarkItem).toHaveCSS('grid-column-end', '-1');
    await expect(form).toHaveCSS('column-gap', '16px');
  });

  test('375px 和 320px 下折为单列，校验、键盘顺序及页面宽度正常', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxform');
    await page.getByRole('button', { name: '编辑节点信息' }).click();

    const dialog = page.getByRole('dialog');
    const panel = dialog.locator('.el-dialog');
    const form = dialog.locator('.lx-form--grid');
    await expect(dialog).toBeVisible();

    const assertSingleColumn = async (viewportWidth: number) => {
      await expect
        .poll(() =>
          form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
        )
        .toBe(1);

      const panelBox = await panel.boundingBox();
      if (!panelBox) throw new Error(`${viewportWidth}px 弹窗未进入布局`);
      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewportWidth);

      const items = dialog.locator('.lx-form > .el-form-item');
      const itemCount = await items.count();
      expect(itemCount).toBe(5);
      for (const item of await items.all()) {
        await expect(item).toHaveCSS('grid-column-start', '1');
        await expect(item).toHaveCSS('grid-column-end', '-1');
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(
        0,
      );
    };

    await assertSingleColumn(375);

    const codeInput = dialog.getByRole('textbox', { name: /节点编码/ });
    const nameInput = dialog.getByRole('textbox', { name: /节点名称/ });
    const codeBox = await codeInput.boundingBox();
    const nameBox = await nameInput.boundingBox();
    if (!codeBox || !nameBox) throw new Error('单列表单输入框未进入布局');
    expect(Math.abs(nameBox.x - codeBox.x)).toBeLessThanOrEqual(1);
    expect(nameBox.y).toBeGreaterThan(codeBox.y);

    const gridItem = dialog.locator('.el-form-item').filter({ hasText: '所属网格' });
    const gridLabel = gridItem.locator('.el-form-item__label');
    await gridItem.getByRole('combobox').focus();
    await page.keyboard.press('Enter');
    const selectPopper = page.locator('.el-select__popper:visible').last();
    await expect(selectPopper).toBeVisible();
    const labelBox = await gridLabel.boundingBox();
    const popperBox = await selectPopper.boundingBox();
    if (!labelBox || !popperBox) throw new Error('窄屏网格下拉或字段标签未进入布局');
    expect(popperBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height - 1);
    await page.keyboard.press('Escape');

    await codeInput.focus();
    await page.keyboard.press('Tab');
    await expect(nameInput).toBeFocused();

    await page.setViewportSize({ width: 320, height: 800 });
    await assertSingleColumn(320);
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog.locator('.lx-form .el-form-item.is-error')).toHaveCount(3);
    const firstError = dialog.locator('.el-form-item.is-error').first();
    const firstErrorInput = firstError.locator('input').first();
    const firstErrorMessage = firstError.locator('.el-form-item__error');
    await expect(firstErrorInput).toBeFocused();
    await expect(firstErrorInput).toHaveAttribute('aria-required', 'true');
    await expect(firstErrorInput).toHaveAttribute('aria-invalid', 'true');
    const errorId = await firstErrorMessage.getAttribute('id');
    const describedBy = await firstErrorInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(describedBy?.split(/\s+/)).toContain(errorId);
    await expect(dialog.locator('.el-form-item__error').first()).toHaveCSS('color', 'rgb(186, 26, 26)');
    await expect(dialog.locator('.el-form-item__error').first()).toHaveCSS('font-size', '11px');
    await expect(dialog.locator('.el-form-item.is-error .el-input__wrapper').first()).toHaveCSS(
      'background-color',
      'rgb(255, 245, 245)',
    );
    await expect(dialog.locator('.el-form-item.is-error .el-input__inner').first()).toHaveCSS(
      'color',
      'rgb(186, 26, 26)',
    );
    const errorControl = dialog.locator('.el-form-item.is-error .el-input__wrapper').first();
    await errorControl.locator('input').focus();
    await expect
      .poll(() => errorControl.evaluate((element) => getComputedStyle(element).boxShadow))
      .toMatch(/rgb\(186, 26, 26\).*2px/);
    const errorSelect = dialog.locator('.el-form-item.is-error .lx-select .el-select__wrapper').first();
    await errorSelect.locator('input').focus();
    await expect(errorSelect).toHaveCSS('background-color', 'rgb(255, 245, 245)');
    await expect(errorSelect).toHaveCSS('border-color', 'rgb(186, 26, 26)');
    await expect(errorSelect).toHaveCSS('box-shadow', 'none');
    await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible();
  });

  test('HUD主题的表单校验色保持可见且令牌一致', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxform');
    await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
    await page.getByRole('button', { name: '编辑节点信息' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '保存' }).click();
    const errorText = dialog.locator('.el-form-item__error').first();
    const errorControl = dialog.locator('.el-form-item.is-error .el-input__wrapper').first();
    await expect(errorText).toHaveCSS('color', 'rgb(247, 137, 137)');
    await expect(errorControl).toHaveCSS('background-color', 'rgba(245, 108, 108, 0.15)');
    await expect
      .poll(() => errorControl.evaluate((element) => getComputedStyle(element).boxShadow))
      .toContain('rgb(247, 137, 137)');
  });
});
