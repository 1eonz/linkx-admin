import { expect, test, type Page } from '@playwright/test';

async function openDemoSettings(page: Page) {
  const settings = page.locator('.transfer-panel-demo__settings');
  if (!(await settings.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await settings.locator('summary').click();
  }
}

async function expectSingleLineSelectedCount(page: Page) {
  const selectedCount = page.locator('.lx-transfer-panel__selected-count');
  await expect(selectedCount).toBeVisible();

  const layout = await selectedCount.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element);
    const textRects = [...range.getClientRects()];
    const clippingAncestors: string[] = [];

    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const overflowX = getComputedStyle(ancestor).overflowX;
      if (!['hidden', 'clip', 'auto', 'scroll'].includes(overflowX)) continue;

      const ancestorBounds = ancestor.getBoundingClientRect();
      const clipLeft = ancestorBounds.left + ancestor.clientLeft;
      const clipRight = clipLeft + ancestor.clientWidth;
      if (textRects.some((rect) => rect.left < clipLeft - 1 || rect.right > clipRight + 1)) {
        clippingAncestors.push(ancestor.className.toString());
      }
    }

    return {
      whiteSpace: style.whiteSpace,
      height: bounds.height,
      lineHeight: Number.parseFloat(style.lineHeight),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      clippingAncestors,
    };
  });

  expect(layout.whiteSpace).toBe('nowrap');
  expect(layout.height).toBeLessThanOrEqual(layout.lineHeight + 1);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.clippingAncestors).toEqual([]);
}

async function setDocsTheme(page: Page, dark: boolean) {
  const switchName = dark ? 'Switch to dark theme' : 'Switch to light theme';
  const themeSwitch = page.getByRole('switch', { name: switchName });
  if (await themeSwitch.count()) await themeSwitch.click();

  if (dark) {
    await expect(page.locator('html')).toHaveClass(/dark/);
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  }
}

async function selectedStatusContrast(page: Page) {
  return page.locator('.lx-transfer-panel__selected-item .lx-transfer-panel__node-status').evaluateAll((elements) => {
    const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (value: string) => {
      const rgb = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
    };

    return elements.map((element) => {
      const style = getComputedStyle(element);
      const background = getComputedStyle(
        element.closest('.lx-transfer-panel__selected-item') ?? element.parentElement!,
      ).backgroundColor;
      const values = [luminance(style.color), luminance(background)].sort((left, right) => right - left);
      return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
    });
  });
}

async function surfaceTextContrast(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (value: string) => {
      const rgb = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
    };
    const style = getComputedStyle(element);
    const values = [luminance(style.color), luminance(style.backgroundColor)].sort((left, right) => right - left);
    return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
  });
}

async function effectiveTextContrast(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const parseColor = (value: string) => {
      const channels = (value.match(/[\d.]+/g) ?? []).map(Number);
      return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0, channels[3] ?? 1] as const;
    };
    const composite = (foreground: readonly number[], background: readonly number[]) => {
      const alpha = foreground[3] ?? 1;
      return [0, 1, 2].map((channel) => (foreground[channel] ?? 0) * alpha + (background[channel] ?? 0) * (1 - alpha));
    };
    const luminance = (channels: readonly number[]) => {
      const rgb = channels.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
    };

    const layers: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) layers.push(current);
    let background: readonly number[] = [255, 255, 255, 1];
    for (const layer of layers.reverse()) {
      background = composite(parseColor(getComputedStyle(layer).backgroundColor), background);
    }
    const foreground = luminance(parseColor(getComputedStyle(element).color));
    const surface = luminance(background);
    const values = [foreground, surface].sort((left, right) => right - left);
    return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
  });
}

test.describe('lx-ui LxTransferPanel 文档示例', () => {
  test('文档暗色模式下示例和穿梭面板继承暗色令牌', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await page.getByRole('switch', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const backgrounds = await page.evaluate(() => {
      const readBackground = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        return element ? getComputedStyle(element).backgroundColor : '';
      };

      return {
        settings: readBackground('.transfer-panel-demo__settings'),
        panel: readBackground('.lx-transfer-panel__panel'),
      };
    });

    expect(backgrounds.settings).toBe(backgrounds.panel);
    expect(backgrounds.settings).not.toBe('rgb(255, 255, 255)');
    expect(await effectiveTextContrast(page, '.transfer-panel-demo__settings summary')).toBeGreaterThanOrEqual(4.5);
    expect(await surfaceTextContrast(page, '.transfer-panel-demo__note')).toBeGreaterThanOrEqual(4.5);
  });

  test('折叠的示例设置摘要显示当前数据状态与主题', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');

    const summary = page.locator('.transfer-panel-demo__settings summary');
    await expect(summary).toHaveText('示例状态与主题（正常数据，亮色主题）');
    await openDemoSettings(page);
    await page.getByRole('button', { name: '空结果' }).click();
    await expect(summary).toHaveText('示例状态与主题（空结果，亮色主题）');
    await page.getByLabel('HUD 深色主题').check();
    await expect(summary).toHaveText('示例状态与主题（空结果，HUD 深色主题）');
  });

  test('HUD 主题只作用于组件预览并保留文档站主题', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await setDocsTheme(page, false);

    await openDemoSettings(page);
    const preview = page.locator('.transfer-panel-demo__preview');
    const htmlClassBeforeHud = await page.locator('html').getAttribute('class');
    await page.getByLabel('HUD 深色主题').check();
    await expect(preview).toHaveClass(/lx-theme-hud/);
    expect(await preview.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    expect(await page.locator('html').getAttribute('class')).toBe(htmlClassBeforeHud);

    await setDocsTheme(page, true);
    await expect(preview).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/lx-theme-hud/);
    await setDocsTheme(page, false);
    await expect(preview).toHaveClass(/lx-theme-hud/);
    await setDocsTheme(page, true);

    await page.locator('a[href="/components/lxinputnumber.html"]').first().click();
    await expect(page).toHaveURL(/\/components\/lxinputnumber/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).not.toHaveClass(/lx-theme-hud/);
    await expect(page.locator('h1')).toContainText('LxInputNumber');
  });

  test('继承说明关联原生复选框，危险确认按钮在浅色和 HUD 下使用危险令牌', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const checkbox = page.getByRole('checkbox', { name: '保留下级继承授权' });
    const description = page.getByText('示例：直属下级继承，关闭后仅保留本级。', {
      exact: true,
    });
    const descriptionId = await description.getAttribute('id');
    expect(descriptionId).toBeTruthy();
    await expect(checkbox).toHaveAttribute('aria-describedby', new RegExp(descriptionId!));
    const inheritVisualCheckbox = page.locator('.lx-transfer-panel__footer .el-checkbox__inner');
    await expect(inheritVisualCheckbox).toHaveCSS('box-sizing', 'border-box');
    await expect(inheritVisualCheckbox).toHaveCSS('width', '14px');
    await expect(inheritVisualCheckbox).toHaveCSS('height', '14px');

    const checkDangerColors = async (hud: boolean) => {
      await page.getByRole('button', { name: '全部移除' }).click();
      const confirm = page.getByRole('button', { name: '确认清空' });
      const dialog = page.locator('.lx-confirm.el-message-box');
      await page.mouse.move(0, 0);
      await expect(dialog).toBeVisible();
      const colors = await confirm.evaluate((element) => {
        const dialog = element.closest<HTMLElement>('.lx-confirm');
        if (!dialog) throw new Error('确认框未进入 LxConfirm portal');
        const tokenColor = (token: string) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${token})`;
          dialog.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          border: style.borderTopColor,
          text: style.color,
          rootIsHud: document.documentElement.classList.contains('lx-theme-hud'),
          dialogIsHud: dialog.classList.contains('lx-theme-hud'),
          dialogBackground: getComputedStyle(dialog).backgroundColor,
          dialogBackgroundToken: tokenColor('--el-bg-color'),
          title: getComputedStyle(dialog.querySelector('.el-message-box__title')!).color,
          titleToken: tokenColor('--lx-color-error-strong'),
          message: getComputedStyle(dialog.querySelector('.el-message-box__message')!).color,
          messageToken: tokenColor('--lx-text-regular'),
          error: tokenColor('--lx-color-error'),
          hover: tokenColor('--lx-color-danger-hover'),
          textToken: tokenColor('--lx-color-on-danger'),
        };
      });
      expect(colors.rootIsHud).toBe(false);
      expect(colors.dialogIsHud).toBe(hud);
      expect(colors.dialogBackground).toBe(colors.dialogBackgroundToken);
      if (hud) expect(colors.dialogBackground).not.toBe('rgb(255, 255, 255)');
      expect(colors.title).toBe(colors.titleToken);
      expect(colors.message).toBe(colors.messageToken);
      await expect
        .poll(() => confirm.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(colors.error);
      expect(colors.border).toBe(colors.error);
      expect(colors.text).toBe(colors.textToken);

      await confirm.hover();
      await expect
        .poll(() => confirm.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(colors.hover);
      await page.getByRole('button', { name: '取消' }).click();
      await expect(dialog).toBeHidden();
    };

    await checkDangerColors(false);
    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.transfer-panel-demo__preview')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('html')).not.toHaveClass(/lx-theme-hud/);
    await checkDangerColors(true);

    await page.getByRole('button', { name: /移除 历史授权单位/ }).click();
    const unloadedDialog = page.locator('.lx-confirm.el-message-box');
    await expect(unloadedDialog).toBeVisible();
    await expect(unloadedDialog).toHaveClass(/lx-theme-hud/);
    await expect(unloadedDialog).toContainText('未加载');
    await page.getByRole('button', { name: '取消' }).click();
  });

  test('缺少继承说明时显示配置原因并禁用开关', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    await page.getByLabel('提供继承说明').uncheck();

    const checkbox = page.getByRole('checkbox', { name: '保留下级继承授权' });
    const description = page.locator('.lx-transfer-panel__inherit-description');
    const descriptionId = await description.getAttribute('id');

    await expect(checkbox).toBeDisabled();
    await expect(description).toHaveText('尚未配置经确认的具体继承范围说明，当前不可更改此选项。');
    expect(descriptionId).toBeTruthy();
    await expect(checkbox).toHaveAttribute('aria-describedby', new RegExp(descriptionId!));
  });

  test('桌面预览默认 240px，可切换 300px 和标准 380px 并保持 5:2:5', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    const summaryLayout = await page
      .locator('.transfer-panel-demo__settings summary, .lx-transfer-panel__scope-actions summary')
      .evaluateAll((summaries) =>
        summaries.map((summary) => {
          const style = getComputedStyle(summary);
          const details = summary.parentElement;
          return {
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
            summaryHeight: summary.getBoundingClientRect().height,
            detailsHeight: details?.getBoundingClientRect().height ?? 0,
          };
        }),
      );
    expect(summaryLayout.every(({ marginTop, marginBottom }) => marginTop === '0px' && marginBottom === '0px')).toBe(
      true,
    );
    expect(summaryLayout.every(({ detailsHeight, summaryHeight }) => detailsHeight <= summaryHeight + 2)).toBe(true);

    await openDemoSettings(page);

    const defaultPanelHeights = await page
      .locator('.lx-transfer-panel__panel')
      .evaluateAll((panels) => panels.map((panel) => Math.round(panel.getBoundingClientRect().height)));
    expect(defaultPanelHeights).toEqual([240, 240]);
    const compactTreeViewportHeight = await page
      .locator('.lx-virtual-tree__viewport')
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(compactTreeViewportHeight).toBeGreaterThanOrEqual(120);
    await page.getByLabel('面板高度').selectOption('300');
    await expect
      .poll(() =>
        page
          .locator('.lx-transfer-panel__panel')
          .evaluateAll((panels) => panels.map((panel) => Math.round(panel.getBoundingClientRect().height))),
      )
      .toEqual([300, 300]);
    await page.getByLabel('面板高度').selectOption('380');

    const transfer = page.locator('.lx-transfer-panel');
    await expect(transfer).toHaveAttribute('data-lx-transfer-layout', '5:2:5');
    await expect(page.locator('.lx-transfer-panel__panel')).toHaveCount(2);
    const desktopPanelWidths = await page
      .locator('.lx-transfer-panel__panel')
      .evaluateAll((panels) => panels.map((panel) => panel.getBoundingClientRect().width));
    expect(Math.min(...desktopPanelWidths)).toBeGreaterThanOrEqual(280);
    const treeViewportLayout = await page.locator('.lx-virtual-tree__viewport').evaluate((viewport) => {
      const row = viewport.querySelector<HTMLElement>('.lx-virtual-tree__row:has([data-lx-transfer-code="DEPT-03"])');
      if (!row) throw new Error('桌面布局检查未找到 DEPT-03 树节点');
      const metadata = row.querySelector<HTMLElement>('.lx-transfer-panel__node-meta');
      if (!metadata) throw new Error('DEPT-03 树节点缺少元信息区域');
      const nodeCode = metadata.querySelector<HTMLElement>('.lx-transfer-panel__node-code');
      const nodeStatus = metadata.querySelector<HTMLElement>('.lx-transfer-panel__node-status');
      if (!nodeCode || !nodeStatus) throw new Error('DEPT-03 树节点缺少编码或状态信息');
      const rowBounds = row.getBoundingClientRect();
      const metadataBounds = metadata.getBoundingClientRect();
      const nodeCodeBounds = nodeCode.getBoundingClientRect();
      const nodeStatusBounds = nodeStatus.getBoundingClientRect();
      return {
        viewportClientWidth: viewport.clientWidth,
        viewportScrollWidth: viewport.scrollWidth,
        rowClientWidth: row.clientWidth,
        rowScrollWidth: row.scrollWidth,
        metadataRight: metadataBounds.right,
        rowRight: rowBounds.right,
        metadataWidth: metadataBounds.width,
        nodeCodeWidth: nodeCodeBounds.width,
        nodeCodeClientWidth: nodeCode.clientWidth,
        nodeCodeScrollWidth: nodeCode.scrollWidth,
        nodeCodeText: nodeCode.textContent?.trim() ?? '',
        nodeCodeTitle: nodeCode.getAttribute('title') ?? '',
        nodeCodeValue: nodeCode.getAttribute('data-lx-transfer-code') ?? '',
        nodeStatusWidth: nodeStatusBounds.width,
      };
    });
    expect(treeViewportLayout.viewportScrollWidth).toBeLessThanOrEqual(treeViewportLayout.viewportClientWidth);
    expect(treeViewportLayout.rowScrollWidth).toBeLessThanOrEqual(treeViewportLayout.rowClientWidth);
    expect(treeViewportLayout.metadataRight).toBeLessThanOrEqual(treeViewportLayout.rowRight + 1);
    expect(treeViewportLayout.metadataWidth).toBeGreaterThan(0);
    expect(treeViewportLayout.nodeCodeWidth).toBeGreaterThan(0);
    expect(treeViewportLayout.nodeCodeScrollWidth).toBeLessThanOrEqual(treeViewportLayout.nodeCodeClientWidth);
    expect(treeViewportLayout.nodeCodeText).toBe('DEPT-03');
    expect(treeViewportLayout.nodeCodeTitle).toBe('DEPT-03');
    expect(treeViewportLayout.nodeCodeValue).toBe('DEPT-03');
    expect(treeViewportLayout.nodeStatusWidth).toBeGreaterThan(0);

    const longCode = 'ARCHIVE-UNIT-2026-REGION-070';
    const longCodeNode = page.locator(
      `.lx-virtual-tree__row:has([data-lx-transfer-code="${longCode}"]) .lx-transfer-panel__node-code`,
    );
    await expect(longCodeNode).toBeVisible();
    const longCodeLayout = await longCodeNode.evaluate((element) => ({
      text: element.textContent?.trim() ?? '',
      title: element.getAttribute('title') ?? '',
      value: element.getAttribute('data-lx-transfer-code') ?? '',
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      textOverflow: getComputedStyle(element).textOverflow,
      whiteSpace: getComputedStyle(element).whiteSpace,
    }));
    expect(longCodeLayout.text).toBe(longCode);
    expect(longCodeLayout.title).toBe(longCode);
    expect(longCodeLayout.value).toBe(longCode);
    expect(longCodeLayout.clientWidth).toBeLessThanOrEqual(96);
    expect(longCodeLayout.scrollWidth).toBeGreaterThan(longCodeLayout.clientWidth);
    expect(longCodeLayout.textOverflow).toBe('ellipsis');
    expect(longCodeLayout.whiteSpace).toBe('nowrap');

    const demoBounds = await page.locator('.transfer-panel-demo').boundingBox();
    const documentBounds = await page.locator('.VPDoc .container').boundingBox();
    if (!demoBounds || !documentBounds) throw new Error('桌面文档示例边界不可用');
    expect(demoBounds.x).toBeGreaterThanOrEqual(documentBounds.x);
    expect(demoBounds.x + demoBounds.width).toBeLessThanOrEqual(documentBounds.x + documentBounds.width);
    expect(await surfaceTextContrast(page, '.transfer-panel-demo__note')).toBeGreaterThanOrEqual(4.5);
    await expect(page.getByTestId('tree-node-count')).toHaveText('树节点总数：1,420 个');
    const headerLayout = await transfer.evaluate((element) => {
      const title = element.querySelector<HTMLElement>('.lx-transfer-panel__title');
      const header = title?.parentElement;
      const actions = header?.querySelector<HTMLElement>('.lx-transfer-panel__header-actions');
      const buttons = [...(actions?.querySelectorAll<HTMLElement>('button') ?? [])];
      return {
        titleRight: title?.getBoundingClientRect().right ?? 0,
        headerRight: header?.getBoundingClientRect().right ?? 0,
        titleClientWidth: title?.clientWidth ?? 0,
        titleScrollWidth: title?.scrollWidth ?? 0,
        titleTextOverflow: title ? getComputedStyle(title).textOverflow : '',
        titleWhiteSpace: title ? getComputedStyle(title).whiteSpace : '',
        titleAttribute: title?.getAttribute('title') ?? '',
        titleText: title?.textContent?.trim() ?? '',
        actionCount: actions ? 1 : 0,
        buttonHeights: buttons.map((button) => button.getBoundingClientRect().height),
      };
    });
    expect(headerLayout.actionCount).toBe(1);
    const scopeActions = page.locator('.lx-transfer-panel__scope-actions');
    await expect(scopeActions.locator('summary')).toHaveText('更多反选选项');
    await expect(scopeActions.locator('summary')).toHaveAttribute('aria-label', '更多反选选项，包含筛选隐藏项');
    await expect(scopeActions.getByRole('button', { name: '反选本树可选项' })).toBeHidden();
    expect(headerLayout.titleTextOverflow).toBe('ellipsis');
    expect(headerLayout.titleWhiteSpace).toBe('nowrap');
    expect(headerLayout.titleAttribute).toBe(headerLayout.titleText);
    expect(headerLayout.titleRight).toBeLessThanOrEqual(headerLayout.headerRight + 1);
    expect(headerLayout.buttonHeights.every((height) => height <= 32)).toBe(true);
    const tracks = await transfer.evaluate((element) => {
      const panels = [...element.querySelectorAll<HTMLElement>('.lx-transfer-panel__panel')];
      const controls = element.querySelector<HTMLElement>('.lx-transfer-panel__controls');
      const gap = Number.parseFloat(getComputedStyle(element).columnGap);
      const unit = (element.clientWidth - gap * 2) / 12;
      return {
        left: panels[0]?.getBoundingClientRect().width ?? 0,
        controls: controls?.getBoundingClientRect().width ?? 0,
        right: panels[1]?.getBoundingClientRect().width ?? 0,
        unit,
      };
    });
    expect(tracks.left / tracks.unit).toBeCloseTo(5, 1);
    expect(tracks.controls / tracks.unit).toBeCloseTo(2, 1);
    expect(tracks.right / tracks.unit).toBeCloseTo(5, 1);
    const panelHeights = await page
      .locator('.lx-transfer-panel__panel')
      .evaluateAll((panels) => panels.map((panel) => Math.round(panel.getBoundingClientRect().height)));
    expect(panelHeights).toEqual([380, 380]);
    const selectedItemLayout = await page.locator('.lx-transfer-panel__selected-item').evaluateAll((items) =>
      items.map((item) => {
        const name = item.querySelector<HTMLElement>('.lx-transfer-panel__selected-name');
        const code = item.querySelector<HTMLElement>('.lx-transfer-panel__node-code');
        const status = item.querySelector<HTMLElement>('.lx-transfer-panel__node-status');
        const hasDisclosure = item.querySelector('.lx-transfer-panel__selected-name-disclosure') !== null;
        return {
          height: Math.round(item.getBoundingClientRect().height),
          isUnloaded: item.querySelector('.lx-transfer-panel__node-unloaded') !== null,
          hasDisclosure,
          nameWhiteSpace: name ? getComputedStyle(name).whiteSpace : '',
          nameBounds: name
            ? {
                top: name.getBoundingClientRect().top,
                bottom: name.getBoundingClientRect().bottom,
              }
            : null,
          metadataBounds: [code, status]
            .filter((element): element is HTMLElement => Boolean(element))
            .map((element) => ({
              top: element.getBoundingClientRect().top,
              bottom: element.getBoundingClientRect().bottom,
            })),
        };
      }),
    );
    expect(
      selectedItemLayout.every(({ height, hasDisclosure, isUnloaded, nameWhiteSpace, nameBounds, metadataBounds }) => {
        if (nameWhiteSpace !== 'nowrap' || !nameBounds) return false;
        if (isUnloaded) {
          return height > 32 && metadataBounds.every(({ top }) => top >= nameBounds.bottom - 1);
        }
        return (
          (hasDisclosure ? height <= 52 : height === 32) &&
          metadataBounds.every(({ top, bottom }) => top < nameBounds.bottom && bottom > nameBounds.top)
        );
      }),
    ).toBe(true);
    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 4 项');
    expect(await selectedStatusContrast(page)).toHaveLength(4);
    expect(Math.min(...(await selectedStatusContrast(page)))).toBeGreaterThanOrEqual(4.5);

    await expect(page.getByPlaceholder('输入机构名称/部门编码检索...')).toBeVisible();
    await expect(page.getByPlaceholder('在已选名单中检索...')).toBeVisible();
    await expect(page.locator('.lx-virtual-tree__filter')).toHaveCount(0);
    await expect(
      page.locator('.lx-transfer-panel__selected').locator('[data-lx-transfer-code="DEPT-03"]'),
    ).toBeVisible();
    await expect(page.locator('[data-status-tone="success"]').first()).toContainText('正常');

    const treeViewport = page.locator('.lx-virtual-tree__viewport');
    expect(await page.locator('.lx-virtual-tree__row').count()).toBeLessThan(50);
    await treeViewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(page.locator('[data-lx-tree-key="division-20-unit-070"]')).toBeVisible();

    const sourceFilter = page.getByPlaceholder('输入机构名称/部门编码检索...');
    const sourceActionStatus = page.locator('.lx-transfer-panel__header-status');
    await sourceFilter.fill('交警直属特勤');
    await expect(sourceActionStatus).toContainText('筛选结果已全部选择');
    await expect(page.getByRole('button', { name: '全选筛选结果' })).toBeDisabled();

    await sourceFilter.fill('不存在的组织');
    await expect(sourceActionStatus).toContainText('没有可批量操作的匹配节点');

    await sourceFilter.fill('站前路派出所综合作战室');
    await page.getByRole('treeitem', { name: /站前路派出所综合作战室/ }).press('Space');
    await sourceFilter.fill('待授权特勤支队');
    await expect(sourceActionStatus).toContainText('达到选择上限');
    await expect(page.getByRole('button', { name: '全选筛选结果' })).toBeDisabled();
    await sourceFilter.fill('');

    await sourceFilter.fill('历史归档机构 20 单位 070');
    await expect(page.getByRole('treeitem', { name: /历史归档机构 20 单位 070/ })).toBeVisible();
    await page.getByRole('button', { name: '清除待选节点筛选' }).click();
    await expect(sourceFilter).toBeFocused();

    await page.getByPlaceholder('在已选名单中检索...').fill('DEPT-03');
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(1);
    await page.getByPlaceholder('在已选名单中检索...').fill('正常');
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(2);
    const clearSelectedFilter = page.getByRole('button', { name: '清除已选项筛选' });
    const clearSelectedFilterBox = await clearSelectedFilter.boundingBox();
    if (!clearSelectedFilterBox) throw new Error('清除已选筛选按钮没有进入可视区域');
    expect(Math.round(clearSelectedFilterBox.width)).toBe(32);
    expect(Math.round(clearSelectedFilterBox.height)).toBe(32);
    await page.getByRole('button', { name: '清除已选项筛选' }).click();
    await expect(page.getByPlaceholder('在已选名单中检索...')).toBeFocused();
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(5);
  });

  test('文档预览桌面限宽居中，窄屏仍占满可用宽度', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');

    const desktop = await page.locator('.lx-transfer-panel').boundingBox();
    const demo = await page.locator('.transfer-panel-demo').boundingBox();
    if (!desktop || !demo) throw new Error('桌面示例边界不可用');
    expect(desktop.width).toBe(820);
    expect(Math.abs(desktop.x + desktop.width / 2 - (demo.x + demo.width / 2))).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.locator('.lx-transfer-panel').evaluate((element) => element.getBoundingClientRect().width))
      .toBeLessThan(760);
    const mobileWidths = await page
      .locator('.lx-transfer-panel, .transfer-panel-demo__surface, .transfer-panel-demo')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
    const availableDocumentWidth = await page.locator('.VPDoc .container').evaluate((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return bounds.width - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
    });
    expect(Math.abs(mobileWidths[0] - mobileWidths[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(mobileWidths[1] - mobileWidths[2])).toBeLessThanOrEqual(1);
    expect(Math.abs(mobileWidths[2] - availableDocumentWidth)).toBeLessThanOrEqual(1);
    const documentWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentWidths.scrollWidth).toBe(documentWidths.clientWidth);
  });

  test('筛选批量操作只影响匹配名称，中间加入仍覆盖当前可选树', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    await page.getByRole('button', { name: '全部移除' }).click();
    await page.getByRole('button', { name: '确认清空' }).click();
    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 0 项');

    await page.getByPlaceholder('输入机构名称/部门编码检索...').fill('交警直属特勤');
    await page.getByRole('button', { name: '全选筛选结果' }).click();
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(1);
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('交警直属特勤一中队');

    await page.getByRole('button', { name: '反选筛选结果' }).click();
    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 0 项');
    await page.getByRole('button', { name: '全部加入' }).click();
    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 5 项');
  });

  test('筛选反选保留筛选外、不可选项和未加载到当前组织树的已选项', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    await page.locator('.lx-transfer-panel').evaluate((element) => {
      const instance = (
        element as HTMLElement & {
          __vueParentComponent?: {
            emit?: (event: string, ...args: unknown[]) => void;
          };
        }
      ).__vueParentComponent;
      if (!instance?.emit) throw new Error('无法初始化宿主的既有选择');
      instance.emit('update:modelValue', ['org-01', 'unit-01', 'unit-02', 'unit-locked', 'legacy-unit-08']);
    });

    const selected = page.locator('.lx-transfer-panel__selected');
    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 5 项');
    await page.getByPlaceholder('输入机构名称/部门编码检索...').fill('交警直属特勤');
    await page.getByRole('button', { name: '反选筛选结果' }).click();

    await expect(page.getByTestId('selected-count')).toHaveText('当前已选 4 项');
    await expect(selected).toContainText('市公安局指挥中心');
    await expect(selected).toContainText('情指行一体化研判调度专班');
    await expect(selected).toContainText('受限巡检单位');
    await expect(selected).toContainText('历史授权单位');
    await expect(selected).not.toContainText('交警直属特勤一中队');
  });

  test('无筛选时反选本树可选项并保留筛选外已选项', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    const selectedCount = page.getByTestId('selected-count');
    const sourceFilter = page.getByPlaceholder('输入机构名称/部门编码检索...');
    const scopeActions = page.locator('.lx-transfer-panel__scope-actions');
    const scopeHint = scopeActions.locator('.lx-transfer-panel__scope-action-description');

    const invertButton = page.getByRole('button', { name: '反选本树可选项' });
    const summary = scopeActions.locator('summary');
    const treeViewport = page.locator('.lx-virtual-tree__viewport');
    const initialTreeViewportHeight = await treeViewport.evaluate((element) => element.getBoundingClientRect().height);
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText('更多反选选项');
    await expect(summary).toHaveAttribute('aria-label', '更多反选选项，包含筛选隐藏项');
    await expect(invertButton).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(scopeHint).toBeVisible();
    await expect(scopeHint).toContainText('包括筛选隐藏项');
    await expect(scopeActions.locator('.lx-transfer-panel__scope-action-content')).toBeVisible();
    const menu = scopeActions.locator('.lx-transfer-panel__scope-action-content');
    const menuBounds = await menu.evaluate((menu) => {
      const menuRect = menu.getBoundingClientRect();
      const buttonRect = menu.querySelector('button')?.getBoundingClientRect();
      const header = menu.closest('.lx-transfer-panel__header');
      const sourcePanel = menu.closest('.lx-transfer-panel__panel');
      const filterRect = sourcePanel?.querySelector('.lx-transfer-panel__filter--source')?.getBoundingClientRect();
      const tree = sourcePanel?.querySelector('.lx-transfer-panel__tree');
      const treeRect = tree?.getBoundingClientRect();
      const treeViewportRect = tree?.querySelector('.lx-virtual-tree__viewport')?.getBoundingClientRect();
      if (!buttonRect) throw new Error('反选菜单中的操作按钮不存在');
      if (!header || !filterRect || !tree || !treeRect || !treeViewportRect) {
        throw new Error('反选面板布局测量目标不存在');
      }
      return {
        menuWidth: menuRect.width,
        menuHeight: menuRect.height,
        menuMaxHeight: getComputedStyle(menu).maxHeight,
        menuClientHeight: menu.clientHeight,
        menuScrollHeight: menu.scrollHeight,
        menuScrollWidth: menu.scrollWidth,
        buttonLeft: buttonRect.left,
        buttonRight: buttonRect.right,
        buttonTop: buttonRect.top,
        buttonBottom: buttonRect.bottom,
        menuLeft: menuRect.left,
        menuRight: menuRect.right,
        menuTop: menuRect.top,
        menuBottom: menuRect.bottom,
        filterBottom: filterRect.bottom,
        treeTop: treeRect.top,
        treeHeight: treeRect.height,
        treeViewportHeight: treeViewportRect.height,
        componentStylesheets: [...document.styleSheets]
          .map(
            (stylesheet) =>
              stylesheet.href ??
              (stylesheet.ownerNode instanceof HTMLStyleElement ? (stylesheet.ownerNode.dataset.viteDevId ?? '') : ''),
          )
          .filter((source) => source.toLowerCase().includes('lxtransferpanel')),
      };
    });
    expect(menuBounds.menuWidth).toBeGreaterThan(200);
    expect(menuBounds.menuHeight).toBeGreaterThan(60);
    expect(menuBounds.menuHeight).toBeLessThanOrEqual(76);
    expect(menuBounds.menuScrollWidth).toBeLessThanOrEqual(menuBounds.menuWidth + 1);
    expect(menuBounds.menuScrollHeight).toBeGreaterThan(menuBounds.menuClientHeight);
    expect(menuBounds.buttonLeft).toBeGreaterThanOrEqual(menuBounds.menuLeft);
    expect(menuBounds.buttonRight).toBeLessThanOrEqual(menuBounds.menuRight);
    expect(menuBounds.buttonTop).toBeGreaterThanOrEqual(menuBounds.menuTop);
    expect(menuBounds.buttonBottom).toBeLessThanOrEqual(menuBounds.menuBottom);
    expect(menuBounds.menuTop).toBeGreaterThanOrEqual(menuBounds.filterBottom - 1);
    expect(menuBounds.menuTop).toBeLessThanOrEqual(menuBounds.treeTop + 1);
    expect(menuBounds.treeViewportHeight).toBeGreaterThan(0);
    expect(menuBounds.treeViewportHeight).toBeLessThanOrEqual(menuBounds.treeHeight + 1);
    expect(menuBounds.treeViewportHeight).toBeGreaterThanOrEqual(initialTreeViewportHeight - 1);
    expect(menuBounds.treeViewportHeight).toBeGreaterThanOrEqual(120);
    await invertButton.scrollIntoViewIfNeeded();
    await expect(invertButton).toBeInViewport({ ratio: 1 });
    await menu.hover();
    await page.mouse.wheel(0, 240);
    await expect.poll(() => menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const scrollBounds = await menu.evaluate((element) => {
      const button = element.querySelector<HTMLElement>('button');
      const description = element.querySelector<HTMLElement>('.lx-transfer-panel__scope-action-description');
      if (!button || !description) throw new Error('反选菜单内容不存在');
      const menuRect = element.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const visibleTop = menuRect.top + element.clientTop;
      const visibleBottom = visibleTop + element.clientHeight;
      const range = document.createRange();
      range.selectNodeContents(description);
      const descriptionLines = range.getClientRects();
      const lastLine = descriptionLines.item(descriptionLines.length - 1);
      if (!lastLine) throw new Error('反选菜单说明没有可见文本');
      return {
        scrollTop: element.scrollTop,
        buttonVisible: buttonRect.top >= visibleTop - 1 && buttonRect.bottom <= visibleBottom + 1,
        lastDescriptionLineVisible: lastLine.top >= visibleTop - 1 && lastLine.bottom <= visibleBottom + 1,
      };
    });
    expect(scrollBounds.scrollTop).toBeGreaterThan(0);
    expect(scrollBounds.buttonVisible).toBe(true);
    expect(scrollBounds.lastDescriptionLineVisible).toBe(true);
    await expect(invertButton).toHaveAccessibleDescription(
      '包括筛选隐藏项；不可选项和未加载到当前组织树的已选项保持不变。',
    );
    await page.keyboard.press('Space');
    await expect(invertButton).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(invertButton).toBeVisible();
    await sourceFilter.fill('待授权特勤支队');
    await expect(scopeHint).toBeVisible();
    await page.getByRole('button', { name: '全选筛选结果' }).click();
    await sourceFilter.fill('');
    await expect(scopeHint).toBeVisible();
    await invertButton.click();

    await expect(selectedCount).toHaveText('当前已选 2 项');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('历史授权单位');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('站前路派出所综合作战室');
    await expect(page.locator('.lx-transfer-panel__selected')).not.toContainText('待授权特勤支队');

    const selectedItems = page.locator('.lx-transfer-panel__selected-item');
    const selectedBeforeScrollAction = await selectedItems.allTextContents();
    await menu.hover();
    await page.mouse.wheel(0, 240);
    await expect.poll(() => menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await invertButton.click();
    await expect.poll(() => selectedItems.allTextContents()).not.toEqual(selectedBeforeScrollAction);
    await expect(invertButton).toBeVisible();
    await invertButton.click();
    await expect.poll(() => selectedItems.allTextContents()).toEqual(selectedBeforeScrollAction);
  });

  test('筛选时整树反选按需展开并保留筛选范围说明', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const sourceFilter = page.getByPlaceholder('输入机构名称/部门编码检索...');
    const scopeActions = page.locator('.lx-transfer-panel__scope-actions');
    const scopeDescription = scopeActions.locator('.lx-transfer-panel__scope-action-description');
    const invertAll = page.getByRole('button', { name: '反选本树可选项' });

    await sourceFilter.fill('交警直属特勤');
    await expect(page.getByRole('button', { name: '全选筛选结果' })).toBeVisible();
    await expect(page.getByRole('button', { name: '反选筛选结果' })).toBeVisible();
    await expect(invertAll).toBeHidden();
    await expect(scopeActions.locator('summary')).toBeVisible();
    expect(
      (await page.locator('.lx-transfer-panel__header-actions button:visible').allTextContents()).map((text) =>
        text.trim(),
      ),
    ).toEqual(['全选筛选结果', '反选筛选结果']);

    await scopeActions.locator('summary').press('Enter');
    await expect(invertAll).toBeVisible();
    await expect(scopeDescription).toContainText('包括筛选隐藏项');
    await expect(scopeDescription).toContainText('未加载到当前组织树的已选项');
    await expect(invertAll).toHaveAccessibleDescription(
      '包括筛选隐藏项；不可选项和未加载到当前组织树的已选项保持不变。',
    );
  });

  test('全树批量操作、未加载授权确认和清空撤销按受控键同步', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    const selectedCount = page.getByTestId('selected-count');

    await page.getByRole('button', { name: '全部移除' }).click();
    await expect(page.getByRole('dialog')).toContainText('未加载的项目');
    await page.getByRole('button', { name: '确认清空' }).click();
    await expect(page.locator('.lx-transfer-panel__selected')).toBeFocused();
    await expect(selectedCount).toHaveText('当前已选 0 项');
    await expect(page.getByTestId('transfer-status')).toContainText('已清空全部选中项，可撤销');
    await page.getByRole('button', { name: '撤销清空' }).click();
    await expect(selectedCount).toHaveText('当前已选 4 项');

    await expect(page.getByRole('button', { name: '全部加入' })).toBeDisabled();

    await page.getByRole('button', { name: '全部移除' }).click();
    await page.getByRole('button', { name: '确认清空' }).click();
    await page
      .getByLabel('待选资源树')
      .getByRole('treeitem', { name: /交警直属特勤一中队/ })
      .press('Space');
    await expect(page.getByRole('button', { name: '撤销清空' })).toHaveCount(0);
    await expect(selectedCount).toHaveText('当前已选 1 项');
  });

  test('逐项移除后焦点留在相邻项，列表清空时回到列表', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const selectedList = page.locator('.lx-transfer-panel__selected');
    const firstRemove = page.getByRole('button', { name: /移除 情指行一体化研判调度专班/ });
    await firstRemove.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /移除 交警直属特勤一中队/ })).toBeFocused();

    const unloadedRemove = page.getByRole('button', {
      name: /移除 历史授权单位/,
    });
    await unloadedRemove.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toContainText('未加载');
    await page.getByRole('button', { name: '移除授权' }).press('Enter');
    await expect(page.getByRole('button', { name: /移除 交警直属特勤一中队/ })).toBeFocused();

    const organizationRemove = page.getByRole('button', {
      name: '移除 市公安局指挥中心',
    });
    await organizationRemove.focus();
    await page.keyboard.press('Enter');
    const finalRemove = page.getByRole('button', {
      name: '移除 交警直属特勤一中队',
    });
    await expect(finalRemove).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(selectedList).toBeFocused();
    await expect(selectedList).toHaveAttribute('aria-label', '已选资源列表，当前显示 0 项，共 0 项');
  });

  test('375px 下确认清空后切换到已选面板并聚焦空列表', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const clearButton = page.getByRole('button', { name: '全部移除' });
    await clearButton.click();
    await expect(page.getByRole('button', { name: '确认清空' })).toBeVisible();
    await page.getByRole('button', { name: '确认清空' }).click();

    const selectedPanel = page.locator('.lx-transfer-panel__panel').nth(1);
    const selectedList = page.locator('.lx-transfer-panel__selected');
    await expect(page.getByTestId('mobile-selected-panel')).toHaveAttribute('aria-pressed', 'true');
    await expect(selectedPanel).toBeVisible();
    await expect(selectedList).toBeFocused();
    await expect(selectedList).toHaveAttribute('aria-label', '已选资源列表，当前显示 0 项，共 0 项');
  });

  test('320px 短面板标签保持完整，键盘提示可见且已选计数不拆行', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const sourceTab = page.getByTestId('mobile-source-panel');
    const selectedTab = page.getByTestId('mobile-selected-panel');
    await expect(sourceTab.locator('.lx-transfer-panel__mobile-short-title')).toHaveText('待选');
    await expect(sourceTab).toHaveAttribute('aria-label', /^显示组织与数据权限树（待选），当前树中 \d+ 个待选节点$/);
    await expect(selectedTab.locator('.lx-transfer-panel__mobile-short-title')).toHaveText('已选');
    await expect(selectedTab).toHaveAttribute('aria-label', /^显示已选数据权限清单，4 项已选$/);
    await expect(page.locator('.lx-transfer-panel__keyboard-hint')).toContainText(
      '方向键移动或展开，Space / Enter 选择',
    );

    await selectedTab.click();
    await expectSingleLineSelectedCount(page);
  });

  test('390px 下已选数量保持单行，超长名称收起为两行', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    await page.getByTestId('mobile-selected-panel').click();

    await expectSingleLineSelectedCount(page);
    const disclosure = page
      .locator('.lx-transfer-panel__selected-name-disclosure')
      .filter({ hasText: '历史授权单位（记录中）' });
    await expect(disclosure).toHaveCount(1);
    const longName = page.locator('.lx-transfer-panel__selected-name').filter({
      hasText: '历史授权单位（记录中）',
    });
    const wrapping = await longName.evaluate((element) => {
      const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      const range = document.createRange();
      if (textNode) range.selectNodeContents(textNode);
      return {
        whiteSpace: getComputedStyle(element).whiteSpace,
        lineClamp: getComputedStyle(element).webkitLineClamp,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        height: element.getBoundingClientRect().height,
        lines: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size,
        title: element.getAttribute('title'),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    });
    expect(wrapping.whiteSpace).toBe('normal');
    expect(wrapping.lineClamp).toBe('2');
    expect(wrapping.lines).toBeGreaterThan(1);
    expect(wrapping.height).toBeLessThanOrEqual(wrapping.lineHeight * 2 + 1);
    expect(wrapping.title).toBe(
      '历史授权单位（记录中）：跨区域应急联动研判与协同处置权限，含历史组织关系核对、跨年度授权变更追踪、部门编码映射、责任单位复核及档案留痕审计记录与例外规则审批流程',
    );
    expect(wrapping.scrollWidth).toBeLessThanOrEqual(wrapping.clientWidth);
    await disclosure.locator('summary').press('Enter');
    await expect(disclosure.locator('.lx-transfer-panel__selected-name-full')).toContainText(
      '跨区域应急联动研判与协同处置权限',
    );
  });

  test('桌面已选超长名称可用键盘展开并收起，未加载元数据独立换行', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const shortSelectedItem = page.locator('.lx-transfer-panel__selected-item').filter({ hasText: '市公安局指挥中心' });
    await expect(shortSelectedItem.locator('.lx-transfer-panel__selected-name-disclosure')).toHaveCount(0);
    await expect(shortSelectedItem.locator('.lx-transfer-panel__selected-name')).toHaveText('市公安局指挥中心');

    const disclosure = page
      .locator('.lx-transfer-panel__selected-name-disclosure')
      .filter({ hasText: '历史授权单位（记录中）' });
    await expect(disclosure).toHaveCount(1);
    const longName = disclosure.locator('.lx-transfer-panel__selected-name');
    const layout = await longName.evaluate((element) => {
      const style = getComputedStyle(element);
      const range = document.createRange();
      const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode) range.selectNodeContents(textNode);
      const nameBounds = element.getBoundingClientRect();
      const metadata = element
        .closest('.lx-transfer-panel__selected-main')
        ?.querySelector('.lx-transfer-panel__node-code');
      const metadataBounds = metadata?.getBoundingClientRect();

      return {
        lineClamp: style.webkitLineClamp,
        whiteSpace: style.whiteSpace,
        visibleHeight: nameBounds.height,
        lineHeight: Number.parseFloat(style.lineHeight),
        nameBottom: nameBounds.bottom,
        nameTop: nameBounds.top,
        metadataTop: metadataBounds?.top,
        title: element.getAttribute('title'),
      };
    });

    expect(layout.lineClamp).toBe('none');
    expect(layout.whiteSpace).toBe('nowrap');
    expect(layout.visibleHeight).toBeLessThanOrEqual(layout.lineHeight + 1);
    expect(layout.metadataTop).toBeGreaterThanOrEqual(layout.nameBottom - 1);
    const fullName = await longName.getAttribute('title');
    if (!fullName) throw new Error('超长名称缺少完整文本提示');
    expect(layout.title).toBe(fullName);
    expect(fullName).toBe(
      '历史授权单位（记录中）：跨区域应急联动研判与协同处置权限，含历史组织关系核对、跨年度授权变更追踪、部门编码映射、责任单位复核及档案留痕审计记录与例外规则审批流程',
    );

    const summary = disclosure.locator('summary');
    const summaryLayout = await summary.evaluate((element) => {
      const style = getComputedStyle(element);
      const item = element.closest('.lx-transfer-panel__selected-item');
      if (!item) throw new Error('已选行不存在');
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        itemHeight: item.getBoundingClientRect().height,
      };
    });
    expect(summaryLayout.marginTop).toBe('0px');
    expect(summaryLayout.marginBottom).toBe('0px');
    expect(summaryLayout.itemHeight).toBeLessThan(60);
    await summary.focus();
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
    await summary.press('Enter');
    await expect(summary).toHaveAttribute('aria-expanded', 'true');
    await expect(summary).toHaveAccessibleName(`收起完整名称：${fullName}`);

    const expandedName = disclosure.locator('.lx-transfer-panel__selected-name-full');
    await expect(expandedName).toBeVisible();
    await expect(expandedName).toHaveText(fullName);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const expandedBounds = await expandedName.evaluate((element) => {
      const text = element.getBoundingClientRect();
      const list = element.closest('.lx-transfer-panel__selected')?.getBoundingClientRect();
      const scrollContainer = element.closest<HTMLElement>('.lx-transfer-panel__selected');
      const item = element.closest<HTMLElement>('.lx-transfer-panel__selected-item');
      const details = element.closest<HTMLElement>('.lx-transfer-panel__selected-name-disclosure');
      if (!list || !scrollContainer || !item || !details) throw new Error('已选列表不存在');
      return {
        textTop: text.top,
        textBottom: text.bottom,
        listTop: list.top,
        listBottom: list.bottom,
        listScrollTop: scrollContainer.scrollTop,
        listClientHeight: scrollContainer.clientHeight,
        listScrollHeight: scrollContainer.scrollHeight,
        itemTop: item.getBoundingClientRect().top,
        detailsTop: details.getBoundingClientRect().top,
      };
    });
    expect(expandedBounds.textTop, JSON.stringify(expandedBounds)).toBeGreaterThanOrEqual(expandedBounds.listTop);
    expect(expandedBounds.textBottom).toBeLessThanOrEqual(expandedBounds.listBottom);
    const expandedLineCount = await expandedName.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
    });
    expect(expandedLineCount).toBeGreaterThan(2);

    await summary.press('Space');
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
    await expect(expandedName).toBeHidden();
  });

  test('320px 窄屏超长已选名称折叠为两行，列表底部条目与移除按钮完整可见', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/components/lxtransferpanel');
    await page.getByTestId('mobile-selected-panel').click();

    const list = page.locator('.lx-transfer-panel__selected');
    const item = page.locator('.lx-transfer-panel__selected-item').filter({ hasText: '历史授权单位（记录中）' });
    const disclosure = item.locator('.lx-transfer-panel__selected-name-disclosure');
    await expect(disclosure).toHaveCount(1);

    const collapsedLayout = await disclosure.locator('.lx-transfer-panel__selected-name').evaluate((element) => {
      const style = getComputedStyle(element);
      const nameBounds = element.getBoundingClientRect();
      const itemBounds = element.closest('.lx-transfer-panel__selected-item')!.getBoundingClientRect();
      return {
        lineClamp: style.webkitLineClamp,
        lineHeight: Number.parseFloat(style.lineHeight),
        nameHeight: nameBounds.height,
        itemHeight: itemBounds.height,
      };
    });
    expect(collapsedLayout.lineClamp).toBe('2');
    expect(collapsedLayout.nameHeight).toBeLessThanOrEqual(collapsedLayout.lineHeight * 2 + 1);
    expect(collapsedLayout.itemHeight).toBeLessThan(120);

    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

    const visibleBounds = await Promise.all([
      list.boundingBox(),
      item.boundingBox(),
      item.getByRole('button').boundingBox(),
    ]);
    const [listBounds, itemBounds, removeBounds] = visibleBounds;
    if (!listBounds || !itemBounds || !removeBounds) throw new Error('窄屏列表边界不可用');
    expect(itemBounds.y).toBeGreaterThanOrEqual(listBounds.y - 1);
    expect(itemBounds.y + itemBounds.height).toBeLessThanOrEqual(listBounds.y + listBounds.height + 1);
    expect(removeBounds.y).toBeGreaterThanOrEqual(listBounds.y - 1);
    expect(removeBounds.y + removeBounds.height).toBeLessThanOrEqual(listBounds.y + listBounds.height + 1);

    const summary = disclosure.locator('summary');
    await summary.focus();
    await summary.press('Enter');
    await expect(summary).toHaveAttribute('aria-expanded', 'true');
    await expect(disclosure.locator('.lx-transfer-panel__selected-name-full')).toHaveText(
      '历史授权单位（记录中）：跨区域应急联动研判与协同处置权限，含历史组织关系核对、跨年度授权变更追踪、部门编码映射、责任单位复核及档案留痕审计记录与例外规则审批流程',
    );
    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const expandedLayout = await item.evaluate((element) => {
      const list = element.closest('.lx-transfer-panel__selected')!;
      const listBounds = list.getBoundingClientRect();
      const fullName = element.querySelector('.lx-transfer-panel__selected-name-full')!.getBoundingClientRect();
      const summary = element.querySelector('summary')!.getBoundingClientRect();
      const button = element.querySelector('button')!;
      const remove = button.getBoundingClientRect();
      return {
        listTop: listBounds.top,
        listBottom: listBounds.bottom,
        fullNameTop: fullName.top,
        fullNameBottom: fullName.bottom,
        summaryTop: summary.top,
        removeTop: remove.top,
        removeBottom: remove.bottom,
        removeHit: button.contains(
          document.elementFromPoint(remove.x + remove.width / 2, remove.y + remove.height / 2),
        ),
      };
    });
    expect(expandedLayout.summaryTop).toBeGreaterThanOrEqual(expandedLayout.listTop + 2);
    expect(expandedLayout.fullNameTop).toBeGreaterThanOrEqual(expandedLayout.listTop);
    expect(expandedLayout.fullNameBottom).toBeLessThanOrEqual(expandedLayout.listBottom);
    expect(expandedLayout.removeTop).toBeGreaterThanOrEqual(expandedLayout.listTop);
    expect(expandedLayout.removeBottom).toBeLessThanOrEqual(expandedLayout.listBottom);
    expect(expandedLayout.removeHit).toBe(true);
    await summary.press('Space');
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
  });

  test('已展开名称经筛选隐藏再恢复后，原生展开状态与无障碍状态一致', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    const disclosure = page
      .locator('.lx-transfer-panel__selected-name-disclosure')
      .filter({ hasText: '历史授权单位（记录中）' });
    await disclosure.locator('summary').press('Enter');
    await expect(disclosure).toHaveAttribute('open', '');
    const filter = page.getByRole('textbox', { name: '在已选项中检索' });
    await filter.fill('市公安局指挥中心');
    await expect(disclosure).toHaveCount(0);
    await filter.fill('');
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(disclosure.locator('summary')).toHaveAttribute('aria-expanded', 'true');
    await expect(disclosure.locator('.lx-transfer-panel__selected-name-full')).toBeVisible();
    await disclosure.locator('summary').press('Space');
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(disclosure.locator('summary')).toHaveAttribute('aria-expanded', 'false');
  });

  test('820px 文档预览中的桌面单侧面板也保持已选计数单行', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    await expectSingleLineSelectedCount(page);
    expect(
      await page.locator('.lx-transfer-panel').evaluate((element) => Math.round(element.getBoundingClientRect().width)),
    ).toBe(820);
  });

  test('宿主加载、失败重试和空结果状态可见', async ({ page }) => {
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    await page.getByRole('button', { name: '加载中' }).click();
    await expect(page.locator('.transfer-panel-demo__message[role="status"]')).toContainText('组织权限数据加载中');
    expect(await surfaceTextContrast(page, '.transfer-panel-demo__message')).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('.lx-transfer-panel')).toHaveCSS('opacity', '1');
    expect(await effectiveTextContrast(page, '.lx-transfer-panel__selected-name.is-unloaded')).toBeGreaterThanOrEqual(
      4.5,
    );
    await expect(page.locator('.lx-transfer-panel__controls button').first()).toHaveCSS('opacity', '0.55');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('legacy-unit-08');

    await page.getByRole('button', { name: '加载失败' }).click();
    await expect(page.getByRole('alert')).toContainText('组织权限数据加载失败');
    await expect(page.locator('.lx-transfer-panel')).toHaveCSS('opacity', '1');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.locator('.lx-transfer-panel')).toBeVisible();

    await page.getByPlaceholder('输入机构名称/部门编码检索...').fill('当前不存在的筛选词');
    await page.getByRole('button', { name: '空结果' }).click();
    await expect(page.locator('.lx-virtual-tree')).toContainText('暂无数据');
    await expect(page.locator('.lx-virtual-tree')).not.toContainText('未找到匹配节点');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('历史授权单位（记录中）');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('节点未加载');
    await expect(page.locator('.lx-transfer-panel__selected')).toContainText('legacy-unit-08');
    await expect(page.getByTestId('tree-node-count')).toHaveText('树节点总数：0 个');
    const unloadedRows = await page.locator('.lx-transfer-panel__selected-item').evaluateAll((rows) =>
      rows.map((row) => {
        const rowBounds = row.getBoundingClientRect();
        const contentBounds = row.querySelector('.lx-transfer-panel__selected-main')!.getBoundingClientRect();
        return {
          rowHeight: rowBounds.height,
          contentHeight: contentBounds.height,
          contentFitsRow: contentBounds.top >= rowBounds.top && contentBounds.bottom <= rowBounds.bottom,
        };
      }),
    );
    expect(unloadedRows.every((row) => row.contentFitsRow)).toBe(true);
    expect(unloadedRows.every((row) => row.rowHeight >= row.contentHeight)).toBe(true);
  });

  test('375px 下控件不溢出，批量与删除目标可触摸且主题可切换', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    await page.getByLabel('面板高度').selectOption('380');

    const rightArrow = page.getByRole('button', { name: '全部加入' });
    const arrowBox = await rightArrow.boundingBox();
    if (!arrowBox) throw new Error('批量加入按钮没有进入可视区域');
    expect(arrowBox.width).toBeGreaterThanOrEqual(44);
    expect(arrowBox.height).toBeGreaterThanOrEqual(44);
    const compactHint = page.getByTestId('select-all-compact-hint');
    await expect(compactHint).toBeVisible();
    await expect(compactHint).toHaveText('需加入 2 项；仅剩 1 个名额');
    const compactHintBox = await compactHint.boundingBox();
    if (!compactHintBox) throw new Error('选择上限短提示没有进入可视区域');
    expect(compactHintBox.y).toBeGreaterThanOrEqual(arrowBox.y + arrowBox.height - 1);
    expect(compactHintBox.y - (arrowBox.y + arrowBox.height)).toBeLessThanOrEqual(16);
    expect(compactHintBox.x).toBeGreaterThanOrEqual(0);
    expect(compactHintBox.x + compactHintBox.width).toBeLessThanOrEqual(375);
    const leftArrowBox = await page.getByRole('button', { name: '全部移除' }).boundingBox();
    if (!leftArrowBox) throw new Error('批量移除按钮没有进入可视区域');
    expect(leftArrowBox.width).toBeGreaterThanOrEqual(44);
    expect(leftArrowBox.height).toBeGreaterThanOrEqual(44);

    const mobileSelectedPanel = page.getByTestId('mobile-selected-panel');
    await expect(mobileSelectedPanel).toBeVisible();
    const mobileSourcePanel = page.getByTestId('mobile-source-panel');
    for (const button of [mobileSourcePanel, mobileSelectedPanel]) {
      const box = await button.boundingBox();
      if (!box) throw new Error('移动端面板切换按钮没有进入可视区域');
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await mobileSelectedPanel.click();
    await expect(mobileSelectedPanel).toHaveAttribute('aria-pressed', 'true');

    const removeButton = page.getByRole('button', { name: '移除 情指行一体化研判调度专班' });
    const removeBox = await removeButton.boundingBox();
    if (!removeBox) throw new Error('已选项删除按钮没有进入可视区域');
    expect(removeBox.width).toBeGreaterThanOrEqual(44);
    expect(removeBox.height).toBeGreaterThanOrEqual(44);

    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.transfer-panel-demo__preview')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('html')).not.toHaveClass(/lx-theme-hud/);
    expect(Math.min(...(await selectedStatusContrast(page)))).toBeGreaterThanOrEqual(4.5);
    expect(await surfaceTextContrast(page, '.transfer-panel-demo__note')).toBeGreaterThanOrEqual(4.5);
    expect(await effectiveTextContrast(page, '.lx-transfer-panel__node-unloaded')).toBeGreaterThanOrEqual(4.5);
    const pageWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(pageWidths.scrollWidth).toBeLessThanOrEqual(pageWidths.clientWidth);

    const demo = page.locator('.transfer-panel-demo');
    await demo.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    const demoTop = (await demo.boundingBox())?.y;
    const localNavBottom = await page
      .locator('.VPLocalNav')
      .evaluate((element) => element.getBoundingClientRect().bottom);
    if (demoTop == null) throw new Error('穿梭组件示例没有进入视口');
    expect(demoTop).toBeGreaterThanOrEqual(localNavBottom + 8);

    await page.getByTestId('mobile-source-panel').click();
    await expect(page.getByTestId('mobile-source-panel')).toHaveAttribute('aria-pressed', 'true');
    await page.getByPlaceholder('输入机构名称/部门编码检索...').fill('交警直属特勤');
    const sourcePanel = page.locator('.lx-transfer-panel__panel').first();
    const mobileHeaderLayout = await sourcePanel.locator('.lx-transfer-panel__header').evaluate((header) => {
      const title = header.querySelector<HTMLElement>('.lx-transfer-panel__title')!.getBoundingClientRect();
      const actions = header.querySelector<HTMLElement>('.lx-transfer-panel__header-actions')!.getBoundingClientRect();
      const bounds = header.getBoundingClientRect();
      return {
        titleBottom: title.bottom,
        titleRight: title.right,
        actionsTop: actions.top,
        headerRight: bounds.right,
        headerBottom: bounds.bottom,
      };
    });
    expect(mobileHeaderLayout.actionsTop).toBeGreaterThanOrEqual(mobileHeaderLayout.titleBottom - 1);
    expect(mobileHeaderLayout.titleRight).toBeLessThanOrEqual(mobileHeaderLayout.headerRight + 1);
    expect(mobileHeaderLayout.actionsTop).toBeLessThan(mobileHeaderLayout.headerBottom);
    await expect(page.locator('.lx-transfer-panel__header-status')).toBeVisible();
    for (const name of ['全选筛选结果', '反选筛选结果']) {
      const control = page.getByRole('button', { name, exact: true });
      const box = await control.boundingBox();
      if (!box) throw new Error(`${name} 按钮没有进入可视区域`);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    const filteredInvert = page.getByRole('button', { name: '反选筛选结果' });
    await filteredInvert.focus();
    const outlineWidth = await page
      .getByRole('button', { name: '反选筛选结果' })
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
    expect(outlineWidth).toBeGreaterThanOrEqual(2);
    const clearSourceFilter = page.getByRole('button', { name: '清除待选节点筛选' });
    const clearSourceFilterBox = await clearSourceFilter.boundingBox();
    if (!clearSourceFilterBox) throw new Error('清除待选筛选按钮没有进入可视区域');
    expect(clearSourceFilterBox.width).toBeGreaterThanOrEqual(44);
    expect(clearSourceFilterBox.height).toBeGreaterThanOrEqual(44);
    await clearSourceFilter.click();

    await page.getByLabel('最多 5 项').uncheck();
    await page.getByRole('treeitem', { name: /站前路派出所综合作战室/ }).press('Space');
    await page.getByRole('treeitem', { name: /待授权特勤支队/ }).press('Space');
    await page.getByTestId('mobile-selected-panel').click();
    const selectedList = page.locator('.lx-transfer-panel__selected');
    const selectedScrollHint = page.getByTestId('selected-scroll-hint');
    await expect(selectedList).toHaveAttribute('aria-label', '已选资源列表，当前显示 6 项，共 6 项');
    await expect(selectedScrollHint).toBeVisible();
    const selectedScrollHintId = await selectedScrollHint.getAttribute('id');
    if (!selectedScrollHintId) throw new Error('滚动提示未生成可访问引用 ID');
    await expect(selectedList).toHaveAttribute('aria-describedby', selectedScrollHintId);
    await expect(selectedScrollHint).toHaveAttribute('role', 'status');
    await expect(selectedScrollHint).toHaveAttribute('aria-live', 'polite');
    await expect(selectedScrollHint).not.toHaveAttribute('aria-hidden');
    expect(await selectedList.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await page.getByPlaceholder('在已选名单中检索...').fill('DEPT-03');
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(1);
    await expect(selectedScrollHint).toBeHidden();
    expect(await selectedList.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(false);
    await page.getByRole('button', { name: '清除已选项筛选' }).click();
    await expect(page.locator('.lx-transfer-panel__selected-item')).toHaveCount(6);
    await expect(selectedScrollHint).toBeVisible();
    await selectedList.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(selectedScrollHint).toBeHidden();
    await expect(selectedList).not.toHaveAttribute('aria-describedby');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await rightArrow.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00002);

    await page.getByTestId('mobile-source-panel').click();
    const metadataWidths = await Promise.all([
      page
        .locator('.lx-virtual-tree__row:has([data-lx-transfer-code="DEPT-03"]) .lx-transfer-panel__node-code')
        .evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth })),
      page
        .locator('.lx-virtual-tree__row:has([data-lx-transfer-code="DEPT-03"]) .lx-transfer-panel__node-status')
        .evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth })),
      page
        .locator(
          '.lx-transfer-panel__selected-item:has([data-lx-transfer-code="DEPT-03"]) .lx-transfer-panel__node-code',
        )
        .evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth })),
      page
        .locator(
          '.lx-transfer-panel__selected-item:has([data-lx-transfer-code="DEPT-03"]) .lx-transfer-panel__node-status',
        )
        .evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth })),
    ]);
    expect(metadataWidths.every(({ client, scroll }) => client >= scroll)).toBe(true);

    const mobilePanels = page.locator('.lx-transfer-panel__panel');
    await expect(mobilePanels.nth(0)).toBeVisible();
    await expect(mobilePanels.nth(1)).toBeHidden();
    expect(await mobilePanels.nth(0).evaluate((panel) => Math.round(panel.getBoundingClientRect().height))).toBe(380);
    await page.getByTestId('mobile-selected-panel').click();
    await expect(mobilePanels.nth(0)).toBeHidden();
    await expect(mobilePanels.nth(1)).toBeVisible();
    expect(await mobilePanels.nth(1).evaluate((panel) => Math.round(panel.getBoundingClientRect().height))).toBe(380);
  });

  test('240px 紧凑高度保留可操作树行，筛选批量操作不裁切标题', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);
    await page.getByLabel('面板高度').selectOption('240');

    const sourcePanel = page.locator('.lx-transfer-panel__panel').first();
    const viewport = sourcePanel.locator('.lx-virtual-tree__viewport');
    const firstRow = sourcePanel.locator('.lx-virtual-tree__row').first();
    const initialLayout = await Promise.all([viewport.boundingBox(), firstRow.boundingBox()]);
    if (!initialLayout[0] || !initialLayout[1]) throw new Error('紧凑高度下树视口或首行不可见');
    expect(initialLayout[0].height).toBeGreaterThanOrEqual(32);
    expect(initialLayout[1].y).toBeGreaterThanOrEqual(initialLayout[0].y - 1);
    expect(initialLayout[1].y + initialLayout[1].height).toBeLessThanOrEqual(
      initialLayout[0].y + initialLayout[0].height + 1,
    );
    await expect(sourcePanel.locator('.lx-virtual-tree__selection-status')).toHaveAttribute('aria-live', 'polite');
    const desktopCheckbox = sourcePanel.locator(
      '.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__checkbox-control',
    );
    const desktopCheckboxInput = sourcePanel.locator(
      '.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__checkbox',
    );
    await expect(desktopCheckboxInput).toHaveCSS('box-sizing', 'border-box');
    await expect(desktopCheckboxInput).toHaveCSS('width', '14px');
    await expect(desktopCheckboxInput).toHaveCSS('height', '14px');
    const wasChecked = await desktopCheckboxInput.isChecked();
    await desktopCheckbox.click({ position: { x: 1, y: 1 } });
    await expect(desktopCheckboxInput).toBeChecked({ checked: !wasChecked });
    await desktopCheckbox.click({ position: { x: 1, y: 1 } });
    await expect(desktopCheckboxInput).toBeChecked({ checked: wasChecked });

    await page.getByPlaceholder('输入机构名称/部门编码检索...').fill('交警直属特勤');
    const titleLayout = await sourcePanel.locator('.lx-transfer-panel__title').evaluate((element) => {
      const title = element.getBoundingClientRect();
      const header = element.closest<HTMLElement>('.lx-transfer-panel__header')?.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      const textBounds = range.getBoundingClientRect();
      return {
        titleWidth: title.width,
        titleRight: title.right,
        headerRight: header?.right ?? 0,
        textRight: textBounds.right,
        textBottom: textBounds.bottom,
        titleBottom: title.bottom,
      };
    });
    expect(titleLayout.titleWidth).toBeGreaterThan(0);
    expect(titleLayout.titleRight).toBeLessThanOrEqual(titleLayout.headerRight + 1);
    expect(titleLayout.textRight).toBeLessThanOrEqual(titleLayout.titleRight + 1);
    expect(titleLayout.textBottom).toBeLessThanOrEqual(titleLayout.titleBottom + 1);

    const header = sourcePanel.locator('.lx-transfer-panel__header');
    const headerBox = await header.boundingBox();
    if (!headerBox) throw new Error('紧凑高度下标题区不可见');
    const actions = sourcePanel.locator('.lx-transfer-panel__header-actions');
    await expect(actions).toBeVisible();
    for (const name of ['全选筛选结果', '反选筛选结果']) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      if (!box) throw new Error(`${name} 按钮没有进入可视区域`);
      expect(box.y).toBeGreaterThanOrEqual(titleLayout.titleBottom - 1);
      expect(box.y + box.height).toBeLessThanOrEqual(headerBox.y + headerBox.height + 1);
    }

    await page.getByRole('button', { name: '清除待选节点筛选' }).click();
    await page.setViewportSize({ width: 320, height: 900 });
    const mobileViewport = page.locator('.lx-transfer-panel__panel').first().locator('.lx-virtual-tree__viewport');
    const mobileFirstRow = page.locator('.lx-transfer-panel__panel').first().locator('.lx-virtual-tree__row').first();
    const mobileLayout = await Promise.all([mobileViewport.boundingBox(), mobileFirstRow.boundingBox()]);
    if (!mobileLayout[0] || !mobileLayout[1]) throw new Error('窄屏紧凑高度下树视口或首行不可见');
    expect(mobileLayout[0].height).toBeGreaterThanOrEqual(64);
    expect(mobileLayout[1].y).toBeGreaterThanOrEqual(mobileLayout[0].y - 1);
    expect(mobileLayout[1].y + mobileLayout[1].height).toBeLessThanOrEqual(
      mobileLayout[0].y + mobileLayout[0].height + 1,
    );
  });

  test('320px 下已选名称完整换行，列表可聚焦且全量操作范围可见', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/components/lxtransferpanel');
    const heightSelect = page.getByLabel('面板高度');
    await expect(heightSelect).toBeVisible();
    await expect(heightSelect).toHaveValue('240');
    await openDemoSettings(page);
    await heightSelect.selectOption('240');

    const compactPanel = page.locator('.lx-transfer-panel__panel').first();
    expect(await compactPanel.evaluate((panel) => Math.round(panel.getBoundingClientRect().height))).toBe(352);

    const mobileSourcePanel = page.getByTestId('mobile-source-panel');
    const mobileSelectedPanel = page.getByTestId('mobile-selected-panel');
    await mobileSourcePanel.focus();
    await mobileSourcePanel.press('Tab');
    await expect(mobileSelectedPanel).toBeFocused();
    await mobileSelectedPanel.press('Enter');
    await expect(page.locator('.lx-transfer-panel__panel').nth(1)).toBeVisible();
    await expect(mobileSelectedPanel).toHaveAttribute('aria-pressed', 'true');
    await mobileSourcePanel.press('Enter');
    await expect(page.locator('.lx-transfer-panel__panel').nth(0)).toBeVisible();

    const filterInputs = page.locator('.lx-transfer-panel__filter input');
    await expect(filterInputs).toHaveCount(2);
    for (const input of await filterInputs.all()) {
      await expect(input).toHaveAttribute('type', 'text');
      await expect(input).toHaveAttribute('inputmode', 'search');
    }
    await filterInputs.first().fill('市公安局');
    await expect(page.getByRole('button', { name: '清除待选节点筛选' })).toBeVisible();
    await expect(page.locator('input[type="search"]')).toHaveCount(0);
    await page.getByRole('button', { name: '清除待选节点筛选' }).click();

    await filterInputs.first().fill('DEPT-03');
    await expect(page.locator('.lx-virtual-tree__row:has([data-lx-transfer-code="DEPT-03"])')).toBeVisible();
    await page.getByRole('button', { name: '清除待选节点筛选' }).click();

    const selectedTreeRow = page.locator('.lx-virtual-tree__row:has([data-lx-transfer-code="DEPT-03"])');
    await expect(selectedTreeRow).toHaveCount(1);
    const treeRowLayout = await selectedTreeRow.evaluate((row) => {
      const label = row.querySelector<HTMLElement>('.lx-virtual-tree__label')!;
      const metadata = row.querySelector<HTMLElement>('.lx-transfer-panel__node-meta')!;
      const rowBounds = row.getBoundingClientRect();
      const labelBounds = label.getBoundingClientRect();
      const metadataBounds = metadata.getBoundingClientRect();
      return {
        rowHeight: rowBounds.height,
        label: label.textContent?.trim(),
        labelWhiteSpace: getComputedStyle(label).whiteSpace,
        labelBottom: labelBounds.bottom,
        metadataTop: metadataBounds.top,
        metadataBottom: metadataBounds.bottom,
        rowBottom: rowBounds.bottom,
      };
    });
    expect(treeRowLayout.rowHeight).toBe(64);
    expect(treeRowLayout.label).toBe('情指行一体化研判调度专班');
    expect(treeRowLayout.labelWhiteSpace).toBe('normal');
    expect(treeRowLayout.labelBottom).toBeLessThanOrEqual(treeRowLayout.metadataTop + 1);
    expect(treeRowLayout.metadataBottom).toBeLessThanOrEqual(treeRowLayout.rowBottom + 1);

    const touchTargets = await page.locator('.lx-virtual-tree__row[data-lx-tree-key="org-01"]').evaluate((row) => {
      const toggle = row.querySelector<HTMLButtonElement>('.lx-virtual-tree__toggle');
      const checkboxControl = row.querySelector<HTMLElement>('.lx-virtual-tree__checkbox-control');
      const checkbox = row.querySelector<HTMLInputElement>('.lx-virtual-tree__checkbox');
      if (!toggle || !checkboxControl || !checkbox) {
        throw new Error('组织节点的展开或复选控件未渲染');
      }

      const toggleBounds = toggle.getBoundingClientRect();
      const controlBounds = checkboxControl.getBoundingClientRect();
      const checkboxBounds = checkbox.getBoundingClientRect();
      return {
        toggle: { x: toggleBounds.x, y: toggleBounds.y, width: toggleBounds.width, height: toggleBounds.height },
        control: { x: controlBounds.x, y: controlBounds.y, width: controlBounds.width, height: controlBounds.height },
        checkbox: { width: checkboxBounds.width, height: checkboxBounds.height },
        overlap: toggleBounds.right > controlBounds.left && toggleBounds.left < controlBounds.right,
      };
    });
    expect(touchTargets.toggle.width).toBe(44);
    expect(touchTargets.toggle.height).toBe(44);
    expect(touchTargets.control.width).toBe(44);
    expect(touchTargets.control.height).toBe(44);
    expect(touchTargets.checkbox.width).toBe(14);
    expect(touchTargets.checkbox.height).toBe(14);
    expect(touchTargets.overlap).toBe(false);

    const orgCheckboxControl = page.locator(
      '.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__checkbox-control',
    );
    const orgCheckbox = page.locator('.lx-virtual-tree__row[data-lx-tree-key="org-01"] .lx-virtual-tree__checkbox');
    const wasChecked = await orgCheckbox.isChecked();
    await orgCheckboxControl.click({ position: { x: 1, y: 1 } });
    await expect(orgCheckbox).toBeChecked({ checked: !wasChecked });
    await orgCheckboxControl.click({ position: { x: 1, y: 1 } });
    await expect(orgCheckbox).toBeChecked({ checked: wasChecked });

    await expect(page.locator('.lx-transfer-panel__controls-label--add')).toHaveText('全部加入');
    await expect(page.locator('.lx-transfer-panel__controls-label--remove')).toHaveText('全部移除');

    await page.getByLabel('最多 5 项').uncheck();
    await page.getByRole('treeitem', { name: /站前路派出所综合作战室/ }).press('Space');
    await page.getByRole('treeitem', { name: /待授权特勤支队/ }).press('Space');

    await mobileSelectedPanel.click();
    const selectedList = page.locator('.lx-transfer-panel__selected');
    const firstSelectedItem = page.locator('.lx-transfer-panel__selected-item').first();
    const selectedItemSpacing = await firstSelectedItem.evaluate((item) => {
      const removeButton = item.querySelector('button');
      const buttonBounds = removeButton?.getBoundingClientRect();
      const itemStyle = getComputedStyle(item);
      return {
        paddingTop: itemStyle.paddingTop,
        paddingBottom: itemStyle.paddingBottom,
        removeButtonWidth: buttonBounds?.width,
        removeButtonHeight: buttonBounds?.height,
      };
    });
    expect(selectedItemSpacing.paddingTop).toBe('2px');
    expect(selectedItemSpacing.paddingBottom).toBe('2px');
    expect(selectedItemSpacing.removeButtonWidth).toBe(44);
    expect(selectedItemSpacing.removeButtonHeight).toBe(44);
    const selectedScrollHint = page.getByTestId('selected-scroll-hint');
    await expect(selectedList).toHaveAttribute('aria-label', '已选资源列表，当前显示 6 项，共 6 项');
    await expect(selectedScrollHint).toHaveText(/下方还有 \d+ 项，向下滚动查看更多/);
    const [selectedListBox, selectedScrollHintBox] = await Promise.all([
      selectedList.boundingBox(),
      selectedScrollHint.boundingBox(),
    ]);
    if (!selectedListBox || !selectedScrollHintBox) {
      throw new Error('已选列表或滚动提示没有进入可视区域');
    }
    expect(selectedScrollHintBox.y).toBeGreaterThanOrEqual(selectedListBox.y + selectedListBox.height - 1);
    await selectedList.focus();
    await expect(selectedList).toBeFocused();

    const names = await page.locator('.lx-transfer-panel__selected-name').evaluateAll((elements) =>
      elements.map((element) => {
        const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
        const range = document.createRange();
        if (textNode) range.selectNodeContents(textNode);
        return {
          whiteSpace: getComputedStyle(element).whiteSpace,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          lineCount: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size,
        };
      }),
    );
    expect(names).toHaveLength(6);
    expect(names.every(({ whiteSpace }) => whiteSpace === 'normal')).toBe(true);
    expect(names.every(({ clientWidth, scrollWidth }) => clientWidth >= scrollWidth)).toBe(true);
    expect(names.some(({ lineCount }) => lineCount > 1)).toBe(true);

    const overflow = await selectedList.evaluate((element) => {
      const hasOverflow = element.scrollHeight > element.clientHeight;
      element.scrollTop = element.scrollHeight;
      return {
        hasOverflow,
        scrollTop: element.scrollTop,
        lastItemVisible: (() => {
          const listBounds = element.getBoundingClientRect();
          const itemBounds = element.lastElementChild!.getBoundingClientRect();
          return itemBounds.top >= listBounds.top && itemBounds.bottom <= listBounds.bottom;
        })(),
      };
    });
    expect(overflow.hasOverflow).toBe(true);
    expect(overflow.scrollTop).toBeGreaterThan(0);
    expect(overflow.lastItemVisible).toBe(true);
    const pageWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(pageWidths.scrollWidth).toBeLessThanOrEqual(pageWidths.clientWidth);
  });

  test('320px 下 Props 表格仅在自身横向滚动且正文列不溢出', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/components/lxtransferpanel');
    await expect(page.locator('.lx-doc-table-scroll-hint')).toBeVisible();

    const docs = page.locator('.vp-doc');
    const propsTable = page.locator('.vp-doc h2#props + .lx-doc-table-scroll-hint + table');
    const bounds = await Promise.all([docs.boundingBox(), propsTable.boundingBox()]);
    if (!bounds[0] || !bounds[1]) throw new Error('Props 表格边界不可用');
    expect(bounds[1].x).toBeGreaterThanOrEqual(bounds[0].x - 1);
    expect(bounds[1].x + bounds[1].width).toBeLessThanOrEqual(bounds[0].x + bounds[0].width + 1);

    const scrollMetrics = await Promise.all([
      propsTable.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })),
      docs.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })),
    ]);
    expect(scrollMetrics[0].scrollWidth).toBeGreaterThan(scrollMetrics[0].clientWidth);
    expect(scrollMetrics[1].scrollWidth).toBeLessThanOrEqual(scrollMetrics[1].clientWidth);
    await expect(propsTable).toHaveAttribute('tabindex', '0');
    await expect(propsTable).toHaveAttribute('aria-describedby', 'lx-doc-table-scroll-hint');
    await propsTable.evaluate((element) => element.scrollTo({ left: 0 }));
    await propsTable.focus();
    await expect(propsTable).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => propsTable.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const pageWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(pageWidths.scrollWidth).toBeLessThanOrEqual(pageWidths.clientWidth);
  });

  test('视口跨树行高断点时保留键盘焦点和滚动锚点', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const tree = page.getByLabel('待选资源树');
    const viewport = page.locator('.lx-virtual-tree__viewport');
    await tree.getByRole('treeitem', { name: /市公安局指挥中心/ }).focus();
    for (let index = 0; index < 16; index += 1) {
      await page.keyboard.press('ArrowDown');
    }

    const focusedKey = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.lxTreeKey);
    expect(focusedKey).toBeTruthy();

    const expectFocusedRow = async (itemSize: number) => {
      const metrics = await viewport.evaluate((element) => {
        const active = document.activeElement as HTMLElement;
        const row = active.matches('[role="treeitem"]')
          ? active
          : element.querySelector<HTMLElement>(`[data-lx-tree-key="${active.dataset.lxTreeKey}"]`);
        if (!row) throw new Error('焦点树项未渲染');
        const rowBounds = row.getBoundingClientRect();
        const viewportBounds = element.getBoundingClientRect();
        return {
          key: row.dataset.lxTreeKey,
          height: rowBounds.height,
          rowTop: rowBounds.top,
          rowBottom: rowBounds.bottom,
          viewportTop: viewportBounds.top,
          viewportBottom: viewportBounds.bottom,
          scrollTop: element.scrollTop,
          focused: document.activeElement === row,
        };
      });

      expect(metrics.key).toBe(focusedKey);
      expect(metrics.height).toBe(itemSize);
      expect(metrics.rowTop).toBeGreaterThanOrEqual(metrics.viewportTop - 1);
      expect(metrics.rowBottom).toBeLessThanOrEqual(metrics.viewportBottom + 1);
      expect(metrics.scrollTop).toBeGreaterThan(0);
      expect(metrics.focused).toBe(true);
      return metrics.rowTop - metrics.viewportTop;
    };

    let previousRowOffset = await expectFocusedRow(64);
    for (const [width, itemSize] of [
      [375, 64],
      [421, 44],
      [420, 64],
      [320, 64],
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const nextRowOffset = await expectFocusedRow(itemSize);
      expect(Math.abs(nextRowOffset - previousRowOffset)).toBeLessThanOrEqual(1);
      previousRowOffset = nextRowOffset;
    }
  });

  test('跨树行高断点后展开按钮焦点回到树项并继续方向键导航', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/components/lxtransferpanel');
    await openDemoSettings(page);

    const tree = page.getByLabel('待选资源树');
    const row = tree.locator('.lx-virtual-tree__row[data-lx-tree-key="org-01"]');
    const toggle = row.locator('.lx-virtual-tree__toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();

    const nextKey = await tree.getByRole('treeitem').evaluateAll((rows) => {
      const currentIndex = rows.findIndex((item) => (item as HTMLElement).dataset.lxTreeKey === 'org-01');
      return (rows[currentIndex + 1] as HTMLElement | undefined)?.dataset.lxTreeKey;
    });
    expect(nextKey).toBeTruthy();

    await page.setViewportSize({ width: 421, height: 900 });
    await expect(row).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(tree.locator(`.lx-virtual-tree__row[data-lx-tree-key="${nextKey}"]`)).toBeFocused();
  });

  test('桌面树获得焦点时显示键盘操作提示', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');

    const hint = page.locator('.lx-transfer-panel__keyboard-hint');
    const tree = page.getByRole('tree', { name: '待选资源树' });
    await expect(hint).toBeHidden();
    await expect(tree).toHaveAccessibleDescription('键盘：方向键移动或展开，Space / Enter 选择');
    await tree.getByRole('treeitem').first().focus();
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('方向键移动或展开，Space / Enter 选择');
    const footerBounds = await hint.evaluate((element) => {
      const caption = element.parentElement;
      const panel = caption?.closest<HTMLElement>('.lx-transfer-panel__panel');
      if (!caption || !panel) throw new Error('键盘提示所在面板不存在');
      return {
        captionHeight: caption.getBoundingClientRect().height,
        captionBottom: caption.getBoundingClientRect().bottom,
        panelBottom: panel.getBoundingClientRect().bottom,
        panelOverflow: getComputedStyle(panel).overflow,
      };
    });
    expect(footerBounds.captionHeight).toBeGreaterThan(32);
    expect(footerBounds.captionBottom).toBeLessThanOrEqual(footerBounds.panelBottom + 1);
    expect(footerBounds.panelOverflow).toBe('visible');
  });

  test('虚拟滚动卸载当前焦点项后仍保留唯一可 Tab 进入的树项', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/components/lxtransferpanel');

    const tree = page.getByLabel('待选资源树');
    const viewport = page.locator('.lx-virtual-tree__viewport');
    const initialTabStop = tree.locator('[role="treeitem"][tabindex="0"]');
    await initialTabStop.focus();
    const initialKey = await initialTabStop.getAttribute('data-lx-tree-key');
    if (!initialKey) throw new Error('初始树停靠项缺少键值');

    await viewport.evaluate((element) => {
      element.scrollTop = 160;
    });
    await expect(tree.locator(`[data-lx-tree-key="${initialKey}"]`)).toHaveAttribute('tabindex', '-1');
    const intermediateTabStop = tree.locator('[role="treeitem"][tabindex="0"]');
    await expect(intermediateTabStop).toBeFocused();
    const intermediateRowBounds = await intermediateTabStop.boundingBox();
    const viewportBounds = await viewport.boundingBox();
    if (!intermediateRowBounds || !viewportBounds) throw new Error('中间滚动后的树项没有可用边界');
    expect(intermediateRowBounds.y).toBeGreaterThanOrEqual(viewportBounds.y - 1);
    expect(intermediateRowBounds.y + intermediateRowBounds.height).toBeLessThanOrEqual(
      viewportBounds.y + viewportBounds.height + 1,
    );

    await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const tabStop = tree.locator('[role="treeitem"][tabindex="0"]');
    await expect(tabStop).toHaveCount(1);
    await expect(tabStop).toBeFocused();
    const rowBounds = await tabStop.boundingBox();
    if (!rowBounds || !viewportBounds) throw new Error('滚动后的树项没有可用边界');
    expect(rowBounds.y).toBeGreaterThanOrEqual(viewportBounds.y - 1);
    expect(rowBounds.y + rowBounds.height).toBeLessThanOrEqual(viewportBounds.y + viewportBounds.height + 1);
  });

  test('从桌面缩窄视口时保留键盘焦点所在的已选面板', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/components/lxtransferpanel');

    const selectedPanel = page.locator('.lx-transfer-panel__panel').nth(1);
    const focusedAction = selectedPanel.locator('.lx-transfer-panel__selected-item button').first();
    await focusedAction.focus();
    await expect(focusedAction).toBeFocused();

    await page.setViewportSize({ width: 375, height: 812 });

    await expect(selectedPanel).toBeVisible();
    await expect(focusedAction).toBeFocused();
    await expect(page.getByTestId('mobile-selected-panel')).toHaveAttribute('aria-pressed', 'true');
    const pageWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(pageWidths.scrollWidth).toBeLessThanOrEqual(pageWidths.clientWidth);
  });

  test('从窄屏切回桌面时将待选面板切换焦点交给待选筛选框', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');

    const sourceSwitcher = page.getByTestId('mobile-source-panel');
    const sourceFilter = page.getByRole('textbox', {
      name: '按机构名称或部门编码筛选待选节点',
    });
    await sourceSwitcher.click();
    await expect(sourceSwitcher).toHaveAttribute('aria-pressed', 'true');
    await expect(sourceSwitcher).toBeFocused();

    await page.setViewportSize({ width: 1024, height: 900 });

    await expect(sourceSwitcher).toBeHidden();
    await expect(sourceFilter).toBeFocused();
  });

  test('从窄屏切回桌面时将已选面板切换焦点交给已选筛选框', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');

    const selectedSwitcher = page.getByTestId('mobile-selected-panel');
    const selectedFilter = page.getByRole('textbox', { name: '在已选项中检索' });
    await selectedSwitcher.click();
    await expect(selectedSwitcher).toHaveAttribute('aria-pressed', 'true');
    await expect(selectedSwitcher).toBeFocused();

    await page.setViewportSize({ width: 1024, height: 900 });

    await expect(selectedSwitcher).toBeHidden();
    await expect(selectedFilter).toBeFocused();
  });

  test('移动面板切换焦点离开按钮后切到桌面不会抢占焦点', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxtransferpanel');

    await page.evaluate(() => {
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside-transfer-panel';
      outsideButton.textContent = '外部操作';
      document.body.append(outsideButton);
    });
    const sourceSwitcher = page.getByTestId('mobile-source-panel');
    const outsideButton = page.locator('#outside-transfer-panel');
    await sourceSwitcher.focus();
    await outsideButton.focus();
    await expect(outsideButton).toBeFocused();

    await page.setViewportSize({ width: 1024, height: 900 });

    await expect(outsideButton).toBeFocused();
  });
});
