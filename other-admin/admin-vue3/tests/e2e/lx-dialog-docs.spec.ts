import { expect, test } from '@playwright/test';

test.describe('lx-ui LxDialog 文档示例', () => {
  test('窄屏下保持视口内并保留可访问名称和触屏目标', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxdialog');

    const open = page.getByRole('button', { name: '新建涉警联动工单' });
    await open.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const titleId = await dialog.getAttribute('aria-labelledby');
    if (!titleId) throw new Error('对话框标题未关联到可访问名称');
    await expect(page.locator(`[id="${titleId}"]`)).toHaveText('新建涉警联动工单');

    const panel = page.locator('.el-dialog');
    const panelBox = await panel.boundingBox();
    if (!panelBox) throw new Error('弹窗面板未进入可视区域');
    expect(panelBox.x).toBeGreaterThanOrEqual(0);
    expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(375);

    const close = page.getByRole('button', { name: '关闭' });
    const closeBox = await close.boundingBox();
    if (!closeBox) throw new Error('弹窗关闭按钮未进入可视区域');
    expect(closeBox.width).toBeGreaterThanOrEqual(44);
    expect(closeBox.height).toBeGreaterThanOrEqual(44);

    await close.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-width', '2px');

    const gridColumns = await page
      .locator('.lx-dialog-form-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(gridColumns).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionDurations = await close.evaluate((element) =>
      getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith('ms') ? value : value * 1000;
        }),
    );
    expect(Math.max(...transitionDurations)).toBeLessThanOrEqual(0.02);
  });

  test('校验失败保留内容，loading 阻止重复确认，提交成功后关闭', async ({ page }) => {
    await page.goto('/components/lxdialog');
    await page.getByRole('button', { name: '新建涉警联动工单' }).click();

    const dialog = page.getByRole('dialog');
    const confirm = page.getByRole('button', { name: '确认派单' });
    await confirm.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('.el-message__content')).toContainText('请填写案发精确地点');

    await page.getByRole('textbox', { name: '案发精确地点' }).fill('东区人民路 12 号');
    await confirm.click();
    await expect(confirm).toBeDisabled();
    await expect(dialog).toBeHidden({ timeout: 2_000 });
    await expect(page.locator('.el-message__content')).toContainText('工单已派发至 3 号网格');
  });

  test('危险模式支持 Escape 关闭，自定义 footer 正常显示', async ({ page }) => {
    await page.goto('/components/lxdialog');
    await page.getByRole('button', { name: '危险操作' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('删除后无法恢复');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: '自定义底部' }).click();
    await expect(page.getByRole('button', { name: '完成' })).toBeVisible();
    await expect(page.getByRole('button', { name: '确认删除' })).toHaveCount(0);
  });
});
