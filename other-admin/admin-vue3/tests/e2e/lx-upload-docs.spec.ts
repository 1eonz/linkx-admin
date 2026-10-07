import { expect, test, type Locator } from '@playwright/test';

async function getContrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const parseColor = (value: string) => {
      const [r = 0, g = 0, b = 0, a = 1] = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return { r, g, b, a };
    };
    const composite = (foreground: ReturnType<typeof parseColor>, background: ReturnType<typeof parseColor>) => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (!alpha) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha,
      };
    };
    const ancestors: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      ancestors.unshift(current);
    }
    let background = { r: 255, g: 255, b: 255, a: 1 };
    for (const ancestor of ancestors) {
      background = composite(parseColor(getComputedStyle(ancestor).backgroundColor), background);
    }
    const foreground = composite(parseColor(getComputedStyle(element).color), background);
    const luminance = ({ r, g, b }: typeof foreground) => {
      const linear = (value: number) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  });
}

test.describe('lx-ui LxUpload 文档示例', () => {
  test('手动提交显示传输进度并完成内存 Mock 上传', async ({ page }, testInfo) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/components/lxupload');

    const input = page.locator('.lx-upload input[type="file"]');
    const browseButton = page.getByRole('button', { name: /浏览本地文件/ });
    await page.getByLabel('禁用上传').check();
    await expect(input).toBeDisabled();
    await expect(browseButton).toBeDisabled();
    await browseButton.evaluate((element) => (element as HTMLButtonElement).focus());
    await expect(browseButton).not.toBeFocused();
    await page.getByLabel('禁用上传').uncheck();
    await expect(input).not.toBeDisabled();

    await input.setInputFiles({
      name: '排班数据.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('姓名,班次\n李警官,早班'),
    });

    await expect(page.locator('.lx-upload__file-status')).toHaveText('排队中');
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
    await expect(page.getByRole('progressbar', { name: '排班数据.csv 上传进度' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: '排班数据.csv 上传进度' })).toHaveAttribute(
      'aria-valuenow',
      /^(20|40|60|80)$/,
    );
    const progressValue = page.locator('.lx-upload__progress-value');
    await expect(progressValue).toHaveAttribute('style', /--lx-upload-progress:/);
    expect(await progressValue.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe('transform');
    expect(await progressValue.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      Number.parseFloat(await progressValue.evaluate((element) => getComputedStyle(element).transitionDuration)),
    ).toBeLessThanOrEqual(0.00002);
    await page.screenshot({ path: testInfo.outputPath('upload-progress.png') });
    await expect(page.locator('.lx-upload__file-status.is-success')).toHaveText('上传成功', { timeout: 3_000 });
    await expect(page.getByTestId('upload-request-count')).toHaveText('1');
    expect(requests.some((url) => url.startsWith('mock://'))).toBe(false);
  });

  test('失败后可以重试成功，上传中可以取消并移除', async ({ page }) => {
    await page.goto('/components/lxupload');
    const input = page.locator('.lx-upload input[type="file"]');

    await page.getByRole('button', { name: '下一次上传失败' }).click();
    await input.setInputFiles({ name: '失败后重试.csv', mimeType: 'text/csv', buffer: Buffer.from('retry') });
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
    await expect(page.locator('.lx-upload__file-error')).toContainText('上传服务暂不可用，请重试', { timeout: 3_000 });
    await page.locator('.lx-upload__retry').click();
    await expect(page.getByTestId('upload-last-action')).toContainText('上传成功', { timeout: 3_000 });
    await expect(page.getByTestId('upload-request-count')).toHaveText('2');

    await input.setInputFiles({ name: '取消上传.csv', mimeType: 'text/csv', buffer: Buffer.from('cancel') });
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
    await expect(page.getByRole('progressbar', { name: '取消上传.csv 上传进度' })).toBeVisible();
    await page.getByRole('button', { name: '取消并移除 取消上传.csv' }).click();
    await expect(page.locator('.lx-upload__file-name', { hasText: '取消上传.csv' })).toHaveCount(0);
    await expect(page.getByTestId('upload-cancel-count')).toHaveText('1');
  });

  test('文件格式校验、禁用态、窄屏触控和 HUD 主题正常', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxupload');

    const dropzone = page.locator('.lx-upload__trigger .el-upload-dragger').first();
    const dropzoneContent = dropzone.locator('.lx-upload__dropzone');
    await expect(dropzoneContent).toBeVisible();

    const contentBounds = await Promise.all(
      ['.lx-upload__drop-icon', '.lx-upload__title', '.lx-upload__hint', '.lx-upload__browse'].map((selector) =>
        dropzone.locator(selector).boundingBox(),
      ),
    );
    const dropzoneBounds = await dropzone.boundingBox();
    const contentContainerBounds = await dropzoneContent.boundingBox();
    if (!dropzoneBounds || !contentContainerBounds || contentBounds.some((bounds) => !bounds)) {
      throw new Error('上传拖拽区内容未进入浏览器视口');
    }
    expect(dropzoneBounds.height).toBeGreaterThanOrEqual(120);

    for (const bounds of contentBounds) {
      if (!bounds) continue;
      expect(bounds.x).toBeGreaterThanOrEqual(dropzoneBounds.x + 18);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(dropzoneBounds.x + dropzoneBounds.width - 18);
      expect(bounds.y).toBeGreaterThanOrEqual(contentContainerBounds.y + 11);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(
        contentContainerBounds.y + contentContainerBounds.height - 11,
      );
    }
    const dropzoneMetrics = await dropzone.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      idleBounds: element.querySelector('.lx-upload__dropzone-idle')?.getBoundingClientRect().toJSON(),
      contentBounds: element.querySelector('.lx-upload__dropzone')?.getBoundingClientRect().toJSON(),
      childBounds: Array.from(
        element.querySelectorAll<HTMLElement>(
          '.lx-upload__drop-icon, .lx-upload__title, .lx-upload__hint, .lx-upload__browse',
        ),
      ).map((child) => ({
        className: child.className,
        bounds: child.getBoundingClientRect().toJSON(),
      })),
    }));
    expect(dropzoneMetrics.scrollHeight <= dropzoneMetrics.clientHeight, JSON.stringify(dropzoneMetrics)).toBe(true);

    const input = page.locator('.lx-upload input[type="file"]');
    await input.setInputFiles({
      name: '不支持的格式.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('invalid'),
    });
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
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

    await page.getByLabel('文档站整体深色（HUD）').check();
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

  test('375px 触屏下上传、取消、重试、移除和清空操作有 44px 触控区并可点按', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    });
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'hover', value: 'none' },
        { name: 'pointer', value: 'coarse' },
      ],
    });
    await page.goto('/components/lxupload');
    await expect.poll(() => page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

    const expectTouchTarget = async (selector: string) => {
      const target = page.locator(selector).first();
      await expect(target).toBeVisible();
      const box = await target.boundingBox();
      if (!box) throw new Error(`${selector} 未进入可视区域`);
      expect(box.width, `${selector} 宽度`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${selector} 高度`).toBeGreaterThanOrEqual(44);
    };
    const tap = async (target: Locator, label: string) => {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      if (!box) throw new Error(label + ' 未进入可视区域');
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
      });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    };
    const input = page.locator('.lx-upload input[type="file"]');

    const uploadTrigger = page.locator('.lx-upload__trigger .el-upload[role="button"]');
    await expectTouchTarget('.lx-upload__trigger .el-upload[role="button"]');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await tap(uploadTrigger, '上传触发区');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: '触屏队列.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('queue'),
    });
    await expectTouchTarget('.lx-upload__clear');
    await tap(page.locator('.lx-upload__clear'), '全部清空');
    await expect(page.locator('.lx-upload__file')).toHaveCount(0);

    await page.getByRole('button', { name: '下一次上传失败' }).click();
    await input.setInputFiles({ name: '触屏重试.csv', mimeType: 'text/csv', buffer: Buffer.from('retry') });
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
    await expect(page.locator('.lx-upload__file-error')).toContainText('上传服务暂不可用，请重试', { timeout: 3_000 });
    await expectTouchTarget('.lx-upload__retry');
    await tap(page.locator('.lx-upload__retry'), '重新上传');
    await expect(page.getByTestId('upload-last-action')).toContainText('上传成功', { timeout: 3_000 });

    await input.setInputFiles({ name: '触屏取消.csv', mimeType: 'text/csv', buffer: Buffer.from('cancel') });
    await page.getByRole('button', { name: '上传全部待传文件' }).click();
    await expect(page.getByRole('progressbar', { name: '触屏取消.csv 上传进度' })).toBeVisible();
    await expectTouchTarget('.lx-upload__cancel');
    const draggerBounds = await page.locator('.el-upload-dragger').boundingBox();
    const cancelBounds = await page.locator('.lx-upload__cancel').boundingBox();
    if (!draggerBounds || !cancelBounds) throw new Error('上传进度面板未进入视口');
    expect(cancelBounds.x).toBeGreaterThanOrEqual(draggerBounds.x);
    expect(cancelBounds.y).toBeGreaterThanOrEqual(draggerBounds.y);
    expect(cancelBounds.x + cancelBounds.width).toBeLessThanOrEqual(draggerBounds.x + draggerBounds.width);
    expect(cancelBounds.y + cancelBounds.height).toBeLessThanOrEqual(draggerBounds.y + draggerBounds.height);
    await expect
      .poll(() =>
        page.locator('.el-upload-dragger').evaluate((element) => element.scrollHeight <= element.clientHeight),
      )
      .toBe(true);
    await tap(page.locator('.lx-upload__cancel'), '取消上传');
    await expect(page.locator('.lx-upload__cancel')).toHaveCount(0);
    await expectTouchTarget('button[aria-label="移除 触屏取消.csv"]');
    await tap(page.getByRole('button', { name: '移除 触屏取消.csv' }), '移除文件');
    await expect(page.locator('.lx-upload__file-name', { hasText: '触屏取消.csv' })).toHaveCount(0);
    await expectTouchTarget('.lx-upload__clear');
    await tap(page.locator('.lx-upload__clear'), '全部清空');
    await expect(page.locator('.lx-upload__file')).toHaveCount(0);

    await cdp.detach();
  });

  test('320px 下上传区和超长文件名保持在视口内', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/components/lxupload');

    const dropzone = page.locator('.lx-upload__trigger .el-upload-dragger').first();
    const dropzoneContent = dropzone.locator('.lx-upload__dropzone');
    const hint = page.locator('.lx-upload__hint').first();
    await expect(dropzoneContent).toBeVisible();
    const bounds = await Promise.all([
      dropzone.boundingBox(),
      page.locator('.lx-upload__title').first().boundingBox(),
      page.locator('.lx-upload__hint').first().boundingBox(),
      page.locator('.lx-upload__browse').first().boundingBox(),
    ]);
    if (bounds.some((box) => !box)) throw new Error('320px 上传区内容未进入视口');

    const [dropzoneBounds, ...contentBounds] = bounds;
    if (!dropzoneBounds) throw new Error('320px 上传区未进入视口');
    for (const box of contentBounds) {
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(dropzoneBounds.x + 12);
      expect(box.x + box.width).toBeLessThanOrEqual(dropzoneBounds.x + dropzoneBounds.width - 12);
    }
    const initialHeight = await dropzone.evaluate((element) => element.clientHeight);
    await hint.evaluate((element) => {
      element.textContent = '支持 Excel 工作簿、CSV 表格和业务导入模板；选择前请确认格式与内容符合要求。'.repeat(2);
    });
    await expect.poll(() => dropzone.evaluate((element) => element.clientHeight)).toBeGreaterThan(initialHeight);
    const expandedHintBounds = await hint.boundingBox();
    const expandedContentBounds = await dropzoneContent.boundingBox();
    if (!expandedHintBounds || !expandedContentBounds) throw new Error('长提示文案未进入上传区');
    expect(expandedHintBounds.height).toBeGreaterThan(18);
    expect(expandedHintBounds.y + expandedHintBounds.height).toBeLessThanOrEqual(
      expandedContentBounds.y + expandedContentBounds.height - 12,
    );
    expect(await dropzone.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);

    const longFileName = '非常长的文件名'.repeat(12) + '.csv';
    await page.locator('.lx-upload input[type="file"]').setInputFiles({
      name: longFileName,
      mimeType: 'text/csv',
      buffer: Buffer.from('mobile'),
    });
    const fileName = page.locator('.lx-upload__file-name');
    await expect(fileName).toContainText(longFileName);
    await expect(fileName).toHaveAttribute('title', longFileName);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const row = page.locator('.lx-upload__file').first();
    const rowBounds = await row.boundingBox();
    const fileNameBounds = await fileName.boundingBox();
    if (!rowBounds || !fileNameBounds) throw new Error('320px 文件行未进入视口');
    expect(fileNameBounds.x).toBeGreaterThanOrEqual(rowBounds.x);
    expect(fileNameBounds.x + fileNameBounds.width).toBeLessThanOrEqual(rowBounds.x + rowBounds.width);
    expect(await fileName.evaluate((element) => getComputedStyle(element).textOverflow)).toBe('ellipsis');
  });

  test('375px 触屏下上传 Demo 的三个开关均有 44px 触控区', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxupload');

    const toggles = page.locator('.lx-upload-demo__toggle');
    await expect(toggles).toHaveCount(3);
    for (const toggle of await toggles.all()) {
      const box = await toggle.boundingBox();
      if (!box) throw new Error('上传 Demo 开关未进入可视区域');
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await toggle.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe('nowrap');
    }
  });

  test('桌面端上传 Demo 的主题开关保持单行', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto('/components/lxupload');

    const themeToggle = page.locator('.lx-upload-demo__header > .lx-upload-demo__toggle');
    const box = await themeToggle.boundingBox();
    if (!box) throw new Error('主题开关未进入可视区域');
    expect(box.height).toBeLessThanOrEqual(44);
  });

  test('普通辅助文字在浅色与 HUD 主题下达到文本对比度要求', async ({ page }) => {
    await page.goto('/components/lxupload');
    const title = page.locator('.lx-upload__title').first();
    const hint = page.locator('.lx-upload__hint').first();
    const description = page.locator('.lx-upload-demo__header > div > p');
    const legend = page.locator('.lx-upload-demo__mode-group legend');

    await expect(title).toBeVisible();
    await expect(hint).toBeVisible();
    await expect(description).toBeVisible();
    await expect(legend).toBeVisible();
    expect(await getContrastRatio(title)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(hint)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(description)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(legend)).toBeGreaterThanOrEqual(4.5);

    await page.getByLabel('文档站整体深色（HUD）').check();
    const hudDropzoneColor = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--lx-bg-card-hover)';
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await expect
      .poll(() =>
        page
          .locator('.lx-upload__trigger .el-upload-dragger')
          .first()
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe(hudDropzoneColor);
    expect(await getContrastRatio(title)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(hint)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(description)).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(legend)).toBeGreaterThanOrEqual(4.5);
  });

  test('拖拽悬停时提示切换，离开后恢复就绪文案', async ({ page }) => {
    await page.goto('/components/lxupload');
    const dragger = page.locator('.lx-upload__trigger .el-upload-dragger').first();
    const idle = dragger.locator('.lx-upload__dropzone-idle');
    const over = dragger.locator('.lx-upload__dropzone-over');

    await expect(idle).toBeVisible();
    await expect(over).not.toBeVisible();
    await dragger.evaluate((element) => {
      const dataTransfer = new DataTransfer();
      element.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    });
    await expect(dragger).toHaveClass(/is-dragover/);
    await expect(over).toBeVisible();
    await expect(idle).not.toBeVisible();

    await dragger.evaluate((element) => {
      const dataTransfer = new DataTransfer();
      element.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true, dataTransfer }));
    });
    await expect(dragger).not.toHaveClass(/is-dragover/);
    await expect(idle).toBeVisible();
    await expect(over).not.toBeVisible();
  });
});
