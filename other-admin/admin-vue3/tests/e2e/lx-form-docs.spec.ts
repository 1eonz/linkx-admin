import { expect, test } from '@playwright/test';

test.describe('lx-ui LxForm 文档示例', () => {
  test('桌面保留双列间距和通栏字段', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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
    if (!codeBox || !nameBox) throw new Error('桌面双列表单字段未进入布局');

    expect(nameBox.x).toBeGreaterThan(codeBox.x + codeBox.width);
    expect(Math.abs(nameBox.y - codeBox.y)).toBeLessThanOrEqual(1);
    await expect(remarkItem).toHaveCSS('grid-column-start', '1');
    await expect(remarkItem).toHaveCSS('grid-column-end', '-1');
    await expect(form).toHaveCSS('column-gap', '16px');
  });

  test('390px 和 320px 下折为单列，校验、键盘顺序及页面宽度正常', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/lxform');
    await page.getByRole('button', { name: '编辑节点信息' }).click();

    const dialog = page.getByRole('dialog');
    const panel = dialog.locator('.el-dialog');
    const form = dialog.locator('.lx-form--grid');
    await expect(dialog).toBeVisible();

    const assertSingleColumn = async (viewportWidth: number) => {
      await expect
        .poll(() =>
          form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\\s+/).length),
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

    await assertSingleColumn(390);

    const codeInput = dialog.getByRole('textbox', { name: /节点编码/ });
    const nameInput = dialog.getByRole('textbox', { name: /节点名称/ });
    const codeBox = await codeInput.boundingBox();
    const nameBox = await nameInput.boundingBox();
    if (!codeBox || !nameBox) throw new Error('单列表单输入框未进入布局');
    expect(Math.abs(nameBox.x - codeBox.x)).toBeLessThanOrEqual(1);
    expect(nameBox.y).toBeGreaterThan(codeBox.y);

    await codeInput.focus();
    await page.keyboard.press('Tab');
    await expect(nameInput).toBeFocused();

    await page.setViewportSize({ width: 320, height: 800 });
    await assertSingleColumn(320);
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog.locator('.lx-form .el-form-item.is-error')).toHaveCount(3);
    await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible();
  });
});
