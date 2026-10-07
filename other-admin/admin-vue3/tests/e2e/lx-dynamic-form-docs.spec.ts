import { expect, test, type Locator, type Page } from '@playwright/test';

const docsOrigin = 'http://127.0.0.1:4177';
const blockedRequests = new WeakMap<Page, string[]>();

async function selectCandidateMode(page: Page, label: string): Promise<void> {
  await page.locator('.dynamic-form-demo__candidate-modes').getByText(label, { exact: true }).click();
}

async function getContrastRatio(locator: Locator, pseudoElement?: string): Promise<number> {
  return locator.evaluate((element, pseudo) => {
    type Rgba = { r: number; g: number; b: number; a: number };
    const parseColor = (value: string): Rgba => {
      const [r = 0, g = 0, b = 0, a = 1] = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return { r, g, b, a };
    };
    const composite = (front: Rgba, back: Rgba): Rgba => {
      const a = front.a + back.a * (1 - front.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / a,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / a,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / a,
        a,
      };
    };
    const ancestors: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      ancestors.unshift(current);
    }
    let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    for (const ancestor of ancestors) {
      background = composite(parseColor(getComputedStyle(ancestor).backgroundColor), background);
    }
    const foreground = composite(parseColor(getComputedStyle(element, pseudo).color), background);
    const luminance = ({ r, g, b }: Rgba) => {
      const linear = (value: number) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    };
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  }, pseudoElement);
}

test.beforeEach(async ({ page }) => {
  const requests: string[] = [];
  blockedRequests.set(page, requests);
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isDocumentRoute =
      url.pathname === '/' ||
      url.pathname === '/components/lxdynamicform' ||
      url.pathname === '/components/lxdynamicform.html';
    const isViteDevPath = ['/@', '/.vitepress/', '/src/', '/node_modules/', '/assets/', '/_assets/'].some((prefix) =>
      url.pathname.startsWith(prefix),
    );
    const isBackendPath = /^\/(api|gateway|upload|auth|login|system|admin)(\/|$)/.test(url.pathname);
    const isSearchIndex = url.pathname === '/search-index.json';
    const isVitePressIndex = url.pathname === '/hashmap.json';
    const isDynamicFormSource = ['/components/lxdynamicform.md', '/components/lxdynamicform/index.md'].includes(
      url.pathname,
    );
    const isFavicon = url.pathname === '/favicon.ico';
    const isDocsGet =
      request.method() === 'GET' &&
      !isBackendPath &&
      (isDocumentRoute || isViteDevPath || isSearchIndex || isVitePressIndex || isDynamicFormSource || isFavicon);

    if ((url.protocol === 'http:' || url.protocol === 'https:') && (url.origin !== docsOrigin || !isDocsGet)) {
      requests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  await page.routeWebSocket('**/*', async (webSocket) => {
    const url = new URL(webSocket.url());
    const isViteHmr =
      url.protocol === 'ws:' && url.hostname === '127.0.0.1' && url.port === '4177' && url.pathname === '/';

    if (isViteHmr) {
      webSocket.connectToServer();
      return;
    }

    const safeUrl = new URL(webSocket.url());
    requests.push(`WS ${safeUrl.origin}${safeUrl.pathname}`);
    await webSocket.close({ code: 1008, reason: '测试已阻止外部 WebSocket' });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const requests = blockedRequests.get(page) ?? [];
  if (requests.length) {
    await testInfo.attach('blocked-network-requests.json', {
      body: Buffer.from(JSON.stringify(requests, null, 2)),
      contentType: 'application/json',
    });
  }
  expect(requests).toEqual([]);
});

test.describe('lx-ui LxDynamicForm 文档示例', () => {
  test('移动端先呈现交互表单且辅助操作具备完整触控区域', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxdynamicform');

    await expect(page.getByRole('heading', { name: /交互示例/ })).toBeVisible();
    await expect(page.locator('.lx-dynamic-form').first()).toBeVisible();

    const headingOrder = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      return {
        interactive: headings.findIndex((heading) => heading.textContent?.includes('交互示例')),
        minimum: headings.findIndex((heading) => heading.textContent?.includes('最小配置')),
      };
    });
    expect(headingOrder.interactive).toBeGreaterThanOrEqual(0);
    expect(headingOrder.minimum).toBeGreaterThan(headingOrder.interactive);

    const schemaLink = page.getByRole('link', { name: '浏览全部字段类型' });
    await expect
      .poll(() => schemaLink.evaluate((element) => Math.round(element.getBoundingClientRect().height)))
      .toBeGreaterThanOrEqual(44);

    const copyButton = page.locator('.vp-doc button.copy:visible').first();
    await copyButton.focus();
    const copyTarget = await copyButton.boundingBox();
    expect(copyTarget?.width).toBeGreaterThanOrEqual(44);
    expect(copyTarget?.height).toBeGreaterThanOrEqual(44);
  });

  test('移动触屏下多项校验错误与后续字段保持可读间距', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'hover', value: 'none' },
        { name: 'pointer', value: 'coarse' },
      ],
    });
    await page.goto('/components/lxdynamicform');

    const form = page.locator('.lx-dynamic-form').first();
    await page.getByRole('button', { name: '提交校验' }).click();
    await expect(form.locator('.el-form-item__error')).toHaveCount(3);

    const measurements = await form.locator('.lx-dynamic-form__item.is-error').evaluateAll((items) =>
      items
        .map((item) => {
          const error = item.querySelector('.el-form-item__error');
          const nextLabel = item.nextElementSibling?.querySelector('.el-form-item__label');
          if (!error || !nextLabel) return undefined;
          return {
            gap: nextLabel.getBoundingClientRect().top - error.getBoundingClientRect().bottom,
            itemClass: item.className,
            itemMargin: getComputedStyle(item).marginBlockEnd,
            gridRowGap: getComputedStyle(item.parentElement!).rowGap,
          };
        })
        .filter((measurement): measurement is NonNullable<typeof measurement> => Boolean(measurement)),
    );
    expect(measurements.length).toBeGreaterThan(0);
    expect(Math.min(...measurements.map(({ gap }) => gap)), JSON.stringify(measurements)).toBeGreaterThanOrEqual(8);

    const summary = page.locator('.dynamic-form-demo__footer [role="status"]');
    await expect(summary).toHaveAttribute('aria-live', 'polite');
    await expect(summary).toHaveText('请检查各字段旁的错误提示。');
  });

  test('受控表单、联动状态和自适应栅格可观察', async ({ page }, testInfo) => {
    await page.goto('/components/lxdynamicform');
    await expect(page.getByRole('heading', { name: 'LxDynamicForm 动态表单' })).toBeVisible();
    await expect(page.getByText('3 名候选人员')).toBeHidden();
    await page.getByText('演示设置', { exact: true }).click();
    await expect(page.getByText('3 名候选人员')).toBeVisible();

    const form = page.locator('.lx-dynamic-form').first();
    await page.getByRole('button', { name: '3 列' }).click();
    await expect
      .poll(() => form.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length))
      .toBe(3);
    await page.getByRole('button', { name: '自适应' }).click();

    await selectCandidateMode(page, '加载中');
    const officerField = form.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' });
    await expect(officerField.getByText('候选人员加载中')).toBeVisible();
    await selectCandidateMode(page, '成功');
    await expect(page.getByText('3 名候选人员')).toBeVisible();

    const adaptive = await form.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      width: element.getBoundingClientRect().width,
    }));
    expect(adaptive.columns).toBe(2);

    const cover = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' });
    const photos = form.locator('.lx-dynamic-form__item').filter({ hasText: '现场图片' });
    await expect(form.getByRole('heading', { name: '任务信息' })).toBeVisible();
    await expect(form.getByRole('heading', { name: '任务状态' })).toBeVisible();
    await expect(form.getByRole('heading', { name: '附件' })).toBeVisible();
    await expect(cover.locator('.lx-upload')).toBeVisible();
    await expect(photos.locator('.lx-upload__file')).toHaveCount(1);

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
    await expect(photos.locator('.lx-upload__file')).toHaveCount(3);
    await expect(cover.locator('.lx-upload__file').filter({ hasText: '上传成功' })).toHaveCount(1);
    await expect(photos.locator('.lx-upload__file').filter({ hasText: '上传成功' })).toHaveCount(3);
    await page.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByText('请输入任务名称', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('输入任务名称')).toBeFocused();
    await page.getByPlaceholder('输入任务名称').fill('夜间巡防任务');
    await page.getByPlaceholder('输入访问密码').fill('StrongPass123!');
    await page.getByPlaceholder('输入访问密码').blur();
    const taskTypeField = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务类型' });
    const taskType = taskTypeField.getByRole('combobox');
    await taskType.focus();
    await taskType.press('ArrowDown');
    const taskTypeOption = page.getByRole('option', { name: '日常巡防', exact: true });
    await expect(taskTypeOption).toBeVisible();
    await taskTypeOption.click();
    await page.getByRole('button', { name: '提交校验' }).click();
    await expect(page.getByText('表单已校验：夜间巡防任务')).toBeVisible();

    await selectCandidateMode(page, '空结果');
    await expect(page.getByText('暂无候选人员', { exact: true })).toBeVisible();
    await selectCandidateMode(page, '失败');
    await expect(page.getByText('候选人员读取失败', { exact: true }).first()).toBeVisible();

    const officerFeedbackId = await officerField.locator('[data-lx-field-feedback]').getAttribute('id');
    if (!officerFeedbackId) throw new Error('负责人反馈缺少稳定 ID');
    await expect(officerField.getByRole('combobox')).toHaveAttribute('aria-describedby', officerFeedbackId);

    const formContainer = page.locator('.lx-dynamic-form-container').first();
    const responsiveEvidence: Array<{
      scenario: string;
      viewportWidth: number;
      containerWidth: number;
      columns: number;
      pageWidth: number;
      horizontalOverflow: boolean;
    }> = [];
    const collectResponsiveMetrics = () =>
      page.evaluate(() => {
        const formElement = document.querySelector<HTMLElement>('.lx-dynamic-form');
        const containerElement = formElement?.closest<HTMLElement>('.lx-dynamic-form-container');
        if (!formElement || !containerElement) {
          throw new Error('找不到动态表单或其容器');
        }

        const viewportWidth = document.documentElement.clientWidth;
        const pageWidth = document.documentElement.scrollWidth;
        return {
          viewportWidth,
          containerWidth: Math.round(containerElement.getBoundingClientRect().width),
          columns: getComputedStyle(formElement).gridTemplateColumns.split(/\s+/).length,
          pageWidth,
          horizontalOverflow: pageWidth > viewportWidth,
        };
      });

    await page.setViewportSize({ width: 1600, height: 900 });
    for (const [containerWidth, expectedColumns] of [
      [320, 1],
      [521, 2],
      [768, 3],
    ] as const) {
      await formContainer.evaluate((element, width) => {
        element.style.width = `${width}px`;
      }, containerWidth);
      await expect.poll(async () => (await collectResponsiveMetrics()).columns).toBe(expectedColumns);

      const metrics = await collectResponsiveMetrics();
      expect(metrics.containerWidth).toBe(containerWidth);
      expect(metrics.horizontalOverflow).toBe(false);
      responsiveEvidence.push({
        scenario: `container-${containerWidth}`,
        ...metrics,
      });
    }
    await formContainer.evaluate((element) => element.style.removeProperty('width'));

    for (const viewportWidth of [320, 375, 768]) {
      await page.setViewportSize({ width: viewportWidth, height: 812 });
      const metrics = await collectResponsiveMetrics();
      const expectedColumns = metrics.containerWidth <= 520 ? 1 : metrics.containerWidth <= 760 ? 2 : 3;

      expect(metrics.viewportWidth).toBe(viewportWidth);
      expect(metrics.columns).toBe(expectedColumns);
      expect(metrics.horizontalOverflow).toBe(false);
      responsiveEvidence.push({
        scenario: `viewport-${viewportWidth}`,
        ...metrics,
      });
    }

    await testInfo.attach('dynamic-form-responsive-evidence.json', {
      body: Buffer.from(JSON.stringify(responsiveEvidence, null, 2)),
      contentType: 'application/json',
    });
  });

  test('字段类型可搜索并用键盘选择，日期范围按 valueFormat 回显和回写', async ({ page }) => {
    await page.goto('/components/lxdynamicform');

    const preview = page.locator('.dynamic-form-demo__schema-preview');
    const previewLink = page.getByRole('link', { name: '浏览全部字段类型' });
    await expect(previewLink).toBeVisible();
    await previewLink.click();
    await expect(page).toHaveURL(/#dynamic-form-schema-preview$/);
    await expect(preview).toHaveAttribute('open', '');
    await expect(preview.locator('summary')).toBeInViewport();

    const initialField = preview.locator('.lx-dynamic-form__item');
    await expect(initialField.locator('.el-form-item__label')).toHaveText('文本输入示例');
    await expect(initialField.locator('.lx-input input')).toHaveValue('');
    await expect(preview.locator('summary').getByText('4 类 · 14 种')).toBeVisible();
    await expect(preview.getByText('先选字段类别，再搜索该类别中的类型；全部支持 14 种。')).toBeVisible();
    await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
    await expect(page.getByRole('option')).toHaveCount(4);
    for (const category of ['文本类字段', '单值选择', '日期与数值', '多值、状态与扩展']) {
      await expect(page.getByRole('option', { name: category, exact: true })).toBeVisible();
    }
    await page.getByRole('option', { name: '日期与数值', exact: true }).click();

    const typeSearch = preview.getByRole('combobox', { name: '字段类型' });
    await preview.locator('.lx-select').nth(1).locator('.el-select__wrapper').click();
    for (const optionName of ['数字输入', '日期选择', '日期范围']) {
      await expect(page.getByRole('option', { name: optionName, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('option', { name: '文本输入', exact: true })).toHaveCount(0);
    await typeSearch.fill('日期范围');
    const dateRangeOption = page.getByRole('option', { name: '日期范围', exact: true });
    await expect(dateRangeOption).toBeVisible();
    await typeSearch.press('ArrowDown');
    await typeSearch.press('Enter');

    const editor = preview.locator('.lx-dynamic-form__item .lx-date-picker.el-range-editor');
    await expect(editor).toBeVisible();
    const inputs = editor.locator('.el-range-input');
    await expect(inputs.nth(0)).toHaveValue('2026-10-01');
    await expect(inputs.nth(1)).toHaveValue('2026-10-06');

    await inputs.nth(0).click();
    const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]');
    const calendar = popper.locator('.el-date-table').first();
    const dayCell = (day: number) =>
      calendar
        .locator('td.available:not(.prev-month):not(.next-month):not(.disabled)')
        .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) })
        .first();

    await dayCell(8).click();
    await dayCell(12).click();
    await expect(inputs.nth(0)).toHaveValue('2026-10-08');
    await expect(inputs.nth(1)).toHaveValue('2026-10-12');
    await expect(popper).toBeHidden();

    await inputs.nth(0).hover();
    const clearButton = editor.locator('.el-range__close-icon');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(inputs.nth(0)).toHaveValue('');
    await expect(inputs.nth(1)).toHaveValue('');
    await expect(preview.getByTestId('date-range-model-value')).toHaveText('字段值：null');
  });

  test('字段预览辅助文字在浅色与 HUD 主题下达到文本对比度要求', async ({ page }) => {
    await page.goto('/components/lxdynamicform');
    const taskName = page.getByPlaceholder('输入任务名称');
    await expect(taskName).toBeVisible();
    expect(await getContrastRatio(taskName, '::placeholder')).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('link', { name: '浏览全部字段类型' }).click();

    const preview = page.locator('.dynamic-form-demo__schema-preview');
    await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
    await page.getByRole('option', { name: '单值选择', exact: true }).click();
    const typeSearch = preview.getByRole('combobox', { name: '字段类型' });
    await typeSearch.fill('远程选择');
    await page.getByRole('option', { name: '远程选择', exact: true }).click();
    const candidateLabel = preview.locator('.dynamic-form-demo__preview-candidates');
    await expect(candidateLabel).toBeVisible();
    expect(await getContrastRatio(candidateLabel)).toBeGreaterThanOrEqual(4.5);

    await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
    await page.getByRole('option', { name: '日期与数值', exact: true }).click();
    await typeSearch.fill('日期范围');
    await page.getByRole('option', { name: '日期范围', exact: true }).click();
    const dateRangeOutput = preview.locator('.dynamic-form-demo__date-range-value');
    await expect(dateRangeOutput).toBeVisible();
    expect(await getContrastRatio(dateRangeOutput)).toBeGreaterThanOrEqual(4.5);

    await page.getByText('演示设置', { exact: true }).click();
    await page.getByText('文档站整体深色（HUD）', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    expect(await getContrastRatio(dateRangeOutput)).toBeGreaterThanOrEqual(4.5);
  });

  test('动态表单单图和多图字段支持失败重试、取消与移除', async ({ page }) => {
    await page.goto('/components/lxdynamicform');

    const form = page.locator('.lx-dynamic-form').first();
    const cover = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' });
    const photos = form.locator('.lx-dynamic-form__item').filter({ hasText: '现场图片' });

    await cover.locator('input[type="file"]').setInputFiles({
      name: '重试-任务封面.png',
      mimeType: 'image/png',
      buffer: Buffer.from('retry cover'),
    });
    await expect(cover.locator('.lx-upload__file-error')).toContainText('上传失败，请重试');
    await cover.locator('.lx-upload__retry').click();
    await expect(cover.locator('.lx-upload__file-status')).toHaveText('上传成功');
    await cover.getByRole('button', { name: '移除 重试-任务封面.png' }).click();
    await expect(cover.locator('.lx-upload__file')).toHaveCount(0);

    await photos.locator('input[type="file"]').setInputFiles({
      name: '重试-现场图.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('retry photo'),
    });
    await expect(photos.locator('.lx-upload__file-error')).toContainText('上传失败，请重试');
    await photos.locator('.lx-upload__retry').click();
    await expect(
      photos.locator('.lx-upload__file').filter({ hasText: '重试-现场图.jpg' }).getByText('上传成功'),
    ).toBeVisible();
    await photos.getByRole('button', { name: '移除 重试-现场图.jpg' }).click();
    await expect(photos.locator('.lx-upload__file').filter({ hasText: '重试-现场图.jpg' })).toHaveCount(0);

    await photos.locator('input[type="file"]').setInputFiles({
      name: '取消-现场图.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('cancel photo'),
    });
    await expect(page.getByRole('progressbar', { name: '取消-现场图.jpg 上传进度' })).toBeVisible();
    await photos.getByRole('button', { name: '取消并移除 取消-现场图.jpg' }).click();
    await expect(photos.locator('.lx-upload__file').filter({ hasText: '取消-现场图.jpg' })).toHaveCount(0);
    await expect(photos.locator('.lx-upload__file')).toHaveCount(1);
    await expect(photos.locator('.lx-upload__announcement')).toHaveText('取消-现场图.jpg 已移除');
  });

  test('窄屏触控下常用表单触发器至少为 44 像素高', async ({ page }) => {
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
    await page.goto('/components/lxdynamicform');

    const localNavigation = page.locator('.VPLocalNav');
    await expect(localNavigation.locator('.menu')).toHaveText('菜单');
    const outline = page.locator('.VPLocalNavOutlineDropdown');
    const outlineButton = outline.locator(':scope > button');
    await expect(outlineButton).toHaveText('本页导航');
    await outlineButton.click();
    await expect(outline.locator('.top-link')).toHaveText('返回顶部');
    const outlineLinkHeights = await outline
      .locator('.outline-link:visible')
      .evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().height)));
    expect(outlineLinkHeights.length).toBeGreaterThan(0);
    expect(Math.min(...outlineLinkHeights)).toBeGreaterThanOrEqual(44);
    await outlineButton.click();

    const actionPlacement = await page.evaluate(() => {
      const form = document.querySelector('.lx-dynamic-form-container');
      const actions = document.querySelector('.dynamic-form-demo__footer');
      const preview = document.querySelector('.dynamic-form-demo__schema-preview');
      if (!form || !actions || !preview) throw new Error('找不到动态表单操作区或字段预览');
      const formBounds = form.getBoundingClientRect();
      const actionBounds = actions.getBoundingClientRect();
      return {
        followsForm: actionBounds.top >= formBounds.bottom,
        gap: actionBounds.top - formBounds.bottom,
        appearsBeforePreview: Boolean(actions.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    expect(actionPlacement.followsForm).toBe(true);
    expect(actionPlacement.gap).toBeLessThanOrEqual(24);
    expect(actionPlacement.appearsBeforePreview).toBe(true);

    await expect.poll(() => page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

    const form = page.locator('.lx-dynamic-form').first();
    const measure = async (selector: string, container = form) => {
      const target = container.locator(selector).first();
      await expect(target).toBeVisible();
      return target.evaluate((element) => element.getBoundingClientRect().height);
    };
    for (const selector of [
      '.lx-input .el-input__wrapper',
      '.lx-password-input .el-input__wrapper',
      '.lx-select .el-select__wrapper',
    ]) {
      const height = await measure(selector);
      expect(height, `${selector}触发器高度`).toBeGreaterThanOrEqual(44);
    }

    const cover = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务封面' });
    const photos = form.locator('.lx-dynamic-form__item').filter({ hasText: '现场图片' });
    for (const [label, selector, container] of [
      ['上传触发器', '.lx-upload__trigger .el-upload[role="button"]', cover],
      ['上传清空', '.lx-upload__clear', photos],
      ['上传移除', '.lx-upload__remove', photos],
    ] as const) {
      const height = await measure(selector, container);
      expect(height, `${label}触控高度`).toBeGreaterThanOrEqual(44);
    }

    const preview = page.locator('.dynamic-form-demo__schema-preview');
    const previewForm = preview.locator('.lx-dynamic-form');
    await preview.getByText('字段类型预览', { exact: true }).click();
    let activeCategory = '文本类字段';
    const selectType = async (category: string, label: string) => {
      if (category !== activeCategory) {
        await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
        await page.getByRole('option', { name: category, exact: true }).click();
        activeCategory = category;
      }
      await preview.locator('.lx-select').nth(1).locator('.el-select__wrapper').click();
      await page.getByRole('option', { name: label, exact: true }).click();
    };

    for (const [category, label, selector] of [
      ['日期与数值', '数字输入', '.lx-input-number .el-input__wrapper'],
      ['日期与数值', '日期选择', '.lx-date-picker .el-input__wrapper'],
      ['日期与数值', '日期范围', '.lx-date-picker.el-range-editor'],
      ['单值选择', '树形选择', '.lx-tree-select .el-select__wrapper'],
    ] as const) {
      await selectType(category, label);
      const height = await measure(selector, previewForm);
      expect(height, `${label}触发器高度`).toBeGreaterThanOrEqual(44);
    }

    await cdp.detach();
  });

  test('字段类型预览逐项渲染全部内置 schema 类型', async ({ page }) => {
    await page.goto('/components/lxdynamicform');

    const preview = page.locator('.dynamic-form-demo__schema-preview');
    await preview.getByText('字段类型预览', { exact: true }).click();

    const categorySelect = preview.getByRole('combobox', { name: '字段类别' });
    const typeSelect = preview.getByRole('combobox', { name: '字段类型' });
    const previewField = preview.locator('.lx-dynamic-form__item');
    let activeCategory = '文本类字段';
    const cases = [
      { category: '文本类字段', label: '文本输入', selector: '.lx-input' },
      { category: '文本类字段', label: '密码输入', selector: '.lx-password-input' },
      { category: '文本类字段', label: '多行文本', selector: '.lx-textarea' },
      { category: '日期与数值', label: '数字输入', selector: '.lx-input-number' },
      { category: '单值选择', label: '下拉选择', selector: '.lx-select' },
      { category: '单值选择', label: '远程选择', selector: '.lx-select' },
      { category: '单值选择', label: '树形选择', selector: '.lx-tree-select' },
      { category: '日期与数值', label: '日期选择', selector: '.lx-date-picker' },
      { category: '日期与数值', label: '日期范围', selector: '.lx-date-picker' },
      { category: '多值、状态与扩展', label: '开关', selector: '.lx-switch' },
      { category: '单值选择', label: '单选组', selector: '.lx-radio-group' },
      { category: '多值、状态与扩展', label: '多选组', selector: '.lx-checkbox-group' },
      { category: '多值、状态与扩展', label: '文件上传', selector: '.lx-upload' },
      { category: '多值、状态与扩展', label: '自定义插槽', selector: '.lx-input' },
    ];
    const categoryTypes: Record<string, string[]> = {
      文本类字段: ['文本输入', '密码输入', '多行文本'],
      单值选择: ['下拉选择', '远程选择', '树形选择', '单选组'],
      日期与数值: ['数字输入', '日期选择', '日期范围'],
      '多值、状态与扩展': ['开关', '多选组', '文件上传', '自定义插槽'],
    };
    const verifiedCategories = new Set<string>();

    for (const item of cases) {
      if (item.category !== activeCategory) {
        await categorySelect.scrollIntoViewIfNeeded();
        await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
        await page.getByRole('option', { name: item.category, exact: true }).click();
        activeCategory = item.category;
      }
      if (!verifiedCategories.has(item.category)) {
        const expectedTypes = categoryTypes[item.category];
        await preview.locator('.lx-select').nth(1).locator('.el-select__wrapper').click();
        const categoryOptions = page.getByRole('option');
        await expect(categoryOptions).toHaveCount(expectedTypes.length);
        for (const optionName of expectedTypes) {
          await expect(page.getByRole('option', { name: optionName, exact: true })).toBeVisible();
        }
        await typeSelect.press('Escape');
        verifiedCategories.add(item.category);
      }
      await typeSelect.scrollIntoViewIfNeeded();
      await preview.locator('.lx-select').nth(1).locator('.el-select__wrapper').click();
      const typeListId = await typeSelect.getAttribute('aria-controls');
      expect(typeListId).toBeTruthy();
      expect(await page.locator(`[id="${typeListId}"]`).getByRole('option').count()).toBeLessThanOrEqual(4);
      await page.getByRole('option', { name: item.label, exact: true }).click();
      await expect(previewField.locator('.el-form-item__label')).toHaveText(`${item.label}示例`);
      await expect(previewField.locator(item.selector)).toBeVisible();

      if (item.label === '远程选择') {
        const remoteSelect = previewField.locator('.lx-select');
        const remoteSearch = remoteSelect.getByRole('combobox');
        const settings = page.locator('.dynamic-form-demo__settings');
        await page.getByText('演示设置', { exact: true }).click();
        await selectCandidateMode(page, '失败');
        await preview.getByRole('button', { name: '失败', exact: true }).click();
        await remoteSearch.fill('警官');
        await expect(previewField.getByText('候选人员读取失败')).toBeVisible();
        await previewField.getByRole('button', { name: '重试' }).click();
        await expect(previewField.getByText('候选人员加载中')).toBeVisible();
        await expect(settings.getByRole('radio', { name: '失败' })).toBeChecked();
        await expect(preview.getByRole('button', { name: '成功', exact: true })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        await remoteSearch.click();
        await expect(page.getByRole('option', { name: '李警官 · 指挥中心' })).toBeVisible();
        await expect(previewField.getByText('候选人员加载中')).toBeHidden();
      }
    }
  });

  test('切换字段类型后远程预览恢复成功模式', async ({ page }) => {
    await page.goto('/components/lxdynamicform');

    const preview = page.locator('.dynamic-form-demo__schema-preview');
    await preview.getByText('字段类型预览', { exact: true }).click();

    const categorySelect = preview.getByRole('combobox', { name: '字段类别' });
    const typeSelect = preview.getByRole('combobox', { name: '字段类型' });
    const selectType = async (category: string, label: string) => {
      await categorySelect.scrollIntoViewIfNeeded();
      await preview.locator('.lx-select').nth(0).locator('.el-select__wrapper').click();
      await page.getByRole('option', { name: category, exact: true }).click();
      await typeSelect.scrollIntoViewIfNeeded();
      await preview.locator('.lx-select').nth(1).locator('.el-select__wrapper').click();
      await page.getByRole('option', { name: label, exact: true }).click();
    };

    await selectType('单值选择', '远程选择');
    await preview.getByRole('button', { name: '失败', exact: true }).click();
    await expect(preview.getByRole('button', { name: '失败', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await selectType('日期与数值', '数字输入');
    await selectType('单值选择', '远程选择');

    await expect(preview.getByRole('button', { name: '成功', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(preview.getByRole('button', { name: '失败', exact: true })).toHaveAttribute('aria-pressed', 'false');

    const previewField = preview.locator('.lx-dynamic-form__item');
    const remoteSearch = previewField.locator('.lx-select').getByRole('combobox');
    await remoteSearch.fill('警官');
    await remoteSearch.click();
    await expect(page.getByRole('option', { name: '李警官 · 指挥中心' })).toBeVisible();
    await expect(previewField.getByText('候选人员读取失败')).toBeHidden();
  });

  test('密码字段校验错误与 ARIA 关联在输入有效值后清理', async ({ page }) => {
    await page.goto('/components/lxdynamicform');

    const form = page.locator('.lx-dynamic-form');
    const passwordField = form.locator('.lx-dynamic-form__item').filter({ hasText: '访问密码' });
    const password = page.getByPlaceholder('输入访问密码');
    const taskTypeField = form.locator('.lx-dynamic-form__item').filter({ hasText: '任务类型' });

    await page.getByPlaceholder('输入任务名称').fill('夜间巡防任务');
    await page.getByRole('button', { name: '提交校验' }).click();

    const errorMessage = passwordField.locator('.el-form-item__error');
    await expect(errorMessage).toHaveText('请输入访问密码');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toBeFocused();
    await expect(password).toHaveAttribute('aria-required', 'true');
    await expect(password).toHaveAttribute('aria-invalid', 'true');

    const errorId = await errorMessage.getAttribute('id');
    const describedBy = await password.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(describedBy?.split(/\s+/)).toContain(errorId);
    await expect(passwordField.locator(`[id="${errorId}"]`)).toHaveText('请输入访问密码');

    await password.fill('StrongPass123!');
    await password.blur();
    await expect(errorMessage).toBeHidden();
    await expect(passwordField).not.toHaveClass(/is-error/);
    await expect(password).not.toHaveAttribute('aria-invalid', 'true');
    await expect
      .poll(async () => {
        const ids = (await password.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
        return ids.includes(errorId ?? '');
      })
      .toBe(false);

    await page.getByRole('button', { name: '提交校验' }).click();
    const taskType = taskTypeField.getByRole('combobox');
    await expect(taskTypeField.locator('.el-form-item__error')).toBeVisible();
    await expect(taskType).toBeFocused();
    await expect
      .poll(() =>
        taskTypeField.locator('.el-select__wrapper').evaluate((element) => getComputedStyle(element).boxShadow),
      )
      .toContain('2px');
  });

  test('远程候选查询可取消、忽略迟到响应并从失败恢复', async ({ page }) => {
    await page.goto('/components/lxdynamicform');
    await page.getByText('演示设置', { exact: true }).click();

    const form = page.locator('.lx-dynamic-form');
    const officerField = form.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' });
    const search = officerField.getByRole('combobox');
    const requestStatus = page.getByTestId('candidate-request-status');

    await search.fill('慢查询');
    await expect(officerField.getByText('候选人员加载中')).toBeVisible();
    await page.getByRole('button', { name: '取消查询' }).click();
    await expect(officerField.getByText('查询已取消')).toBeVisible();
    await expect(officerField.getByText('候选人员加载中')).toBeHidden();
    await expect(officerField.getByText('候选人员读取失败')).toBeHidden();
    await expect(page.getByRole('radio', { name: '加载中' })).not.toBeChecked();
    await expect(page.getByRole('button', { name: '取消查询' })).toBeDisabled();
    await expect(requestStatus).toContainText('已取消旧查询：1 次');
    await expect(requestStatus).toContainText('已忽略迟到响应：1 次');
    await expect(officerField.getByText('查询已取消')).toBeVisible();

    await search.fill('慢查询');
    await expect(officerField.getByText('候选人员加载中')).toBeVisible();
    await page.getByRole('button', { name: '重置', exact: true }).click();
    await expect(officerField.getByText('查询已取消')).toBeVisible();
    await expect(requestStatus).toContainText('已取消旧查询：2 次');

    await selectCandidateMode(page, '失败');
    await expect(officerField.getByText('候选人员读取失败')).toBeVisible();
    await officerField.getByRole('button', { name: '重试' }).click();
    await expect(officerField.getByText('候选人员读取失败')).toBeHidden();
    await expect(page.getByText('3 名候选人员')).toBeVisible();
  });

  test('较早的远程查询即使迟到也不会覆盖较新的结果', async ({ page }) => {
    await page.goto('/components/lxdynamicform');
    await page.getByText('演示设置', { exact: true }).click();

    const form = page.locator('.lx-dynamic-form');
    const officerField = form.locator('.lx-dynamic-form__item').filter({ hasText: '负责人' });
    const search = officerField.getByRole('combobox');
    const requestStatus = page.getByTestId('candidate-request-status');

    await search.fill('慢查询');
    await expect(officerField.getByText('候选人员加载中')).toBeVisible();
    await search.fill('快查询');
    await expect(page.getByText('1 名候选人员')).toBeVisible();
    await expect(requestStatus).toContainText('已取消旧查询：1 次');
    await expect(requestStatus).toContainText('已忽略迟到响应：1 次');
    await expect(officerField.getByText('候选人员加载中')).toBeHidden();
    await expect(officerField.getByText('候选人员读取失败')).toBeHidden();

    await search.click();
    await expect(page.getByRole('option', { name: '快查询结果' })).toBeVisible();
    await expect(page.getByRole('option', { name: '慢查询结果' })).toHaveCount(0);
  });
});
