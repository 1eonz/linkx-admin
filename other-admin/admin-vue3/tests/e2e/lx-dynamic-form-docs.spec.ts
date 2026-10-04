import { expect, test } from '@playwright/test';

test.describe('lx-ui LxDynamicForm 文档示例', () => {
  test('受控表单、联动状态和自适应栅格可观察', async ({ page }) => {
    await page.goto('/components/lxdynamicform');
    await expect(page.getByRole('heading', { name: 'LxDynamicForm 动态表单' })).toBeVisible();
    await expect(page.getByText('3 名候选人员')).toBeHidden();
    await page.getByText('演示设置', { exact: true }).click();
    await expect(page.getByText('3 名候选人员')).toBeVisible();

    const form = page.locator('.lx-dynamic-form');
    await page.getByRole('button', { name: '3 列' }).click();
    await expect
      .poll(() => form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length))
      .toBe(3);
    await page.getByRole('button', { name: '自适应' }).click();

    await page.getByRole('button', { name: '加载中', exact: true }).click();
    const officerField = form.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' });
    await expect(officerField.getByText('候选人员加载中')).toBeVisible();
    await page.getByRole('button', { name: '成功', exact: true }).click();
    await expect(page.getByText('3 名候选人员')).toBeVisible();

    const adaptive = await form.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      width: element.getBoundingClientRect().width,
    }));
    expect(adaptive.columns).toBe(2);

    const cover = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' });
    const photos = form.locator('.lx-dynamic-form__item').filter({ hasText: '现场图片' });
    await expect(cover.locator('.lx-upload')).toBeVisible();
    await expect(photos.locator('.lx-upload__file')).toHaveCount(2);

    const externalRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4176') {
        externalRequests.push(request.url());
      }
    });
    await cover.locator('input[type="file"]').setInputFiles({
      name: 'mock-cover.png',
      mimeType: 'image/png',
      buffer: Buffer.from('mock image'),
    });
    await expect(cover.getByText('mock-cover.png')).toBeVisible();
    await expect(cover.getByText('上传成功', { exact: true })).toBeVisible();

    await photos.locator('input[type="file"]').setInputFiles([
      { name: '现场补充一.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('mock image one') },
      { name: '现场补充二.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('mock image two') },
    ]);
    await expect(photos.getByText('现场补充一.jpg')).toBeVisible();
    await expect(photos.getByText('现场补充二.jpg')).toBeVisible();
    await expect(photos.locator('.lx-upload__file')).toHaveCount(4);
    expect(externalRequests).toEqual([]);

    await page.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByText('请输入任务名称')).toBeVisible();
    await expect(page.getByPlaceholder('输入任务名称')).toBeFocused();
    await page.getByPlaceholder('输入任务名称').fill('夜间巡防任务');
    await page.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByText('表单已校验：夜间巡防任务')).toBeVisible();

    await page.getByRole('button', { name: '空结果' }).click();
    await expect(page.getByText('暂无候选人员', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '失败', exact: true }).click();
    await expect(page.getByText('候选人员读取失败', { exact: true }).first()).toBeVisible();

    const officerFeedbackId = await officerField.locator('[data-lx-field-feedback]').getAttribute('id');
    if (!officerFeedbackId) throw new Error('负责人反馈缺少稳定 ID');
    await expect(officerField.getByRole('combobox')).toHaveAttribute('aria-describedby', officerFeedbackId);

    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      columns: getComputedStyle(document.querySelector('.lx-dynamic-form')).gridTemplateColumns,
    }));
    expect(mobile.document).toBe(mobile.viewport);
    expect(mobile.columns.split(/\s+/).length).toBe(1);
  });
});
