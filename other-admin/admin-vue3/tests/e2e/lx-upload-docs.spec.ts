import { expect, test } from '@playwright/test';

test.describe('lx-ui LxUpload 文档示例', () => {
  test('手动提交显示传输进度并完成内存 Mock 上传', async ({ page }, testInfo) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/components/lxupload');

    const input = page.locator('.lx-upload input[type="file"]');
    await input.setInputFiles({
      name: '排班数据.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('姓名,班次\n李警官,早班'),
    });

    await expect(page.locator('.lx-upload__file-status')).toHaveText('等待上传');
    await page.getByRole('button', { name: '开始上传' }).click();
    await expect(page.getByRole('progressbar', { name: '排班数据.csv 上传进度' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: '排班数据.csv 上传进度' })).toHaveAttribute(
      'aria-valuenow',
      /^(20|40|60|80)$/,
    );
    const progressValue = page.locator('.lx-upload__progress-value');
    await expect(progressValue).toHaveAttribute('style', /--lx-upload-progress:/);
    expect(await progressValue.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('transform');
    expect(await progressValue.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
    await page.screenshot({ path: testInfo.outputPath('upload-progress.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      Number.parseFloat(await progressValue.evaluate((element) => getComputedStyle(element).transitionDuration)),
    ).toBeLessThanOrEqual(0.00002);
    await expect(page.locator('.lx-upload__file-status.is-success')).toHaveText('上传成功', { timeout: 3_000 });
    await expect(page.getByTestId('upload-request-count')).toHaveText('1');
    expect(requests.some((url) => url.startsWith('mock://'))).toBe(false);
  });

  test('失败后可以重试成功，上传中可以取消并移除', async ({ page }) => {
    await page.goto('/components/lxupload');
    const input = page.locator('.lx-upload input[type="file"]');

    await page.getByRole('button', { name: '下一次上传失败' }).click();
    await input.setInputFiles({ name: '失败后重试.csv', mimeType: 'text/csv', buffer: Buffer.from('retry') });
    await page.getByRole('button', { name: '开始上传' }).click();
    await expect(page.locator('.lx-upload__file-error')).toContainText('本地 Mock 上传失败', { timeout: 3_000 });
    await page.locator('.lx-upload__retry').click();
    await expect(page.getByTestId('upload-last-action')).toContainText('上传成功', { timeout: 3_000 });
    await expect(page.getByTestId('upload-request-count')).toHaveText('2');

    await input.setInputFiles({ name: '取消上传.csv', mimeType: 'text/csv', buffer: Buffer.from('cancel') });
    await page.getByRole('button', { name: '开始上传' }).click();
    await expect(page.getByRole('progressbar', { name: '取消上传.csv 上传进度' })).toBeVisible();
    await page.getByRole('button', { name: '取消并移除 取消上传.csv' }).click();
    await expect(page.locator('.lx-upload__file-name', { hasText: '取消上传.csv' })).toHaveCount(0);
    await expect(page.getByTestId('upload-cancel-count')).toHaveText('1');
  });

  test('文件格式校验、禁用态、窄屏触控和 HUD 主题正常', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxupload');

    const input = page.locator('.lx-upload input[type="file"]');
    await input.setInputFiles({
      name: '不支持的格式.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('invalid'),
    });
    await page.getByRole('button', { name: '开始上传' }).click();
    await expect(page.locator('.el-message--error')).toContainText('文件格式不符合要求');

    await input.setInputFiles({ name: 'mobile.csv', mimeType: 'text/csv', buffer: Buffer.from('mobile') });
    await page.getByRole('button', { name: '紧凑标签' }).click();
    await expect(page.locator('.lx-upload__list--compact-chips')).toBeVisible();
    const remove = page.getByRole('button', { name: '移除 mobile.csv' });
    const removeBox = await remove.boundingBox();
    if (!removeBox) throw new Error('文件移除按钮未进入可视区域');
    expect(removeBox.width).toBeGreaterThanOrEqual(44);
    expect(removeBox.height).toBeGreaterThanOrEqual(44);
    await remove.focus();
    const outlineWidth = await remove.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
    expect(outlineWidth).toBeGreaterThanOrEqual(2);

    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await page.getByLabel('禁用上传').check();
    await expect(input).toBeDisabled();
    await expect(remove).toBeDisabled();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await page
      .locator('.el-upload-dragger')
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00002);
  });
});
