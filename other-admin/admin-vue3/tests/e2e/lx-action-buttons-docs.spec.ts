import { expect, test, type Locator } from '@playwright/test';

async function contrastRatio(element: Locator) {
  return element.evaluate((node) => {
    const menu = node.closest<HTMLElement>('.lx-actions__menu');
    if (!menu) return { ratio: 0, foreground: '', background: '', token: '', itemToken: '' };

    const luminance = (color: string) => {
      const channels = color
        .match(/\d+(?:\.\d+)?/g)
        ?.slice(0, 3)
        .map(Number);
      if (!channels || channels.length !== 3) return 0;
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };

    const foregroundColor = getComputedStyle(node).color;
    const backgroundColor = getComputedStyle(menu).backgroundColor;
    const foreground = luminance(foregroundColor);
    const background = luminance(backgroundColor);
    return {
      ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      foreground: foregroundColor,
      background: backgroundColor,
      token: getComputedStyle(document.documentElement).getPropertyValue('--lx-color-warning-text').trim(),
      itemToken: getComputedStyle(node).getPropertyValue('--lx-actions-item-color').trim(),
    };
  });
}

test.describe('LxActionButtons 文档示例', () => {
  test('键盘可展开并操作溢出项，Escape 关闭且恢复焦点', async ({ page }) => {
    await page.goto('/components/lxactionbuttons');

    const semanticPanel = page.getByTestId('semantic');
    const moreButton = semanticPanel.getByRole('button', { name: '更多', exact: true });
    const actionGroup = semanticPanel.getByRole('group', { name: '更多操作' });
    await moreButton.focus();
    await page.keyboard.press('Enter');
    await expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    await expect(actionGroup.getByRole('button')).toHaveCount(1);
    await page.keyboard.press('Tab');

    const firstOverflowAction = actionGroup.getByRole('button', { name: '授权' });
    await expect(firstOverflowAction).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(actionGroup).toBeHidden();
    await expect(moreButton).toBeFocused();

    await moreButton.click();
    await actionGroup.getByRole('button', { name: '授权' }).click();
    await expect(page.getByTestId('last-action')).toHaveText('授权');
    await expect(actionGroup).toBeHidden();
    await expect(moreButton).toBeFocused();
  });

  test.describe('375px 触屏', () => {
    test.use({
      viewport: { width: 375, height: 812 },
      screen: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });

    test('触控目标达到 44px，禁用菜单保持在视口内并适配 HUD 主题', async ({ page }) => {
      await page.goto('/components/lxactionbuttons');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

      const disabledActions = page.getByTestId('disabled-actions');
      const moreButton = disabledActions.getByRole('button', { name: '更多', exact: true });
      const actionGroup = disabledActions.getByRole('group', { name: '更多操作' });
      await moreButton.click();

      const buttonBox = await moreButton.boundingBox();
      const menuBox = await actionGroup.boundingBox();
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      expect(menuBox?.x).toBeGreaterThanOrEqual(0);
      expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(375);
      await expect(actionGroup.getByRole('button', { name: '暂不可执行' })).toBeDisabled();

      const lightBackground = await actionGroup.evaluate((element) => getComputedStyle(element).backgroundColor);
      await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
      const hudBackground = await actionGroup.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(hudBackground).not.toBe(lightBackground);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const disabledAction = actionGroup.getByRole('button', { name: '暂不可执行' });
      const transition = await disabledAction.evaluate((element) => getComputedStyle(element).transitionDuration);
      expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.00002);
    });
  });

  test('表格行示例将操作与用户记录及表头关联', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const table = page.getByRole('table', { name: '用户列表' });
    const row = table.getByRole('row', { name: /测试账号-037/ });
    const tableScrollRegion = page.getByTestId('table-row').locator('.lx-actions-demo__table-scroll');

    await expect(table.getByRole('columnheader', { name: '操作' })).toBeVisible();
    await expect(row.getByRole('rowheader', { name: '测试账号-037' })).toBeVisible();
    await expect(row.getByRole('button', { name: '查看' })).toBeVisible();
    const regionScrollWidth = await tableScrollRegion.evaluate((element) => element.scrollWidth);
    const regionClientWidth = await tableScrollRegion.evaluate((element) => element.clientWidth);
    expect(regionScrollWidth).toBeGreaterThan(regionClientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('权限 Demo 区分省略 auth 和显式空权限码', async ({ page }) => {
    await page.goto('/components/lxactionbuttons');

    const boundary = page.getByTestId('auth-boundary');
    await expect(boundary.getByRole('button', { name: '公开查看' })).toBeVisible();
    await expect(boundary.getByTestId('auth-omitted')).toContainText('省略 auth');

    const emptyAuth = boundary.getByTestId('auth-empty');
    await expect(emptyAuth).toContainText('空字符串和空数组均不会渲染');
    await expect(emptyAuth.locator('.lx-actions')).toHaveCount(0);
    await expect(emptyAuth.getByRole('status')).toHaveText('当前没有可显示的操作');
  });

  test('warning 菜单文字保持对比度，窄列长标签换行且不撑宽页面', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const narrowPanel = page.getByTestId('narrow-actions');
    const longAction = narrowPanel.getByRole('button', {
      name: '查看完整告警关联设备记录',
    });
    const longLabelLayout = await longAction.evaluate((button) => {
      const label = button.querySelector<HTMLElement>('.lx-btn__label');
      if (!label) return null;

      const labelStyle = getComputedStyle(label);
      return {
        buttonClientWidth: button.clientWidth,
        buttonScrollWidth: button.scrollWidth,
        buttonHeight: button.getBoundingClientRect().height,
        labelLineHeight: Number.parseFloat(labelStyle.lineHeight),
        labelScrollHeight: label.scrollHeight,
        labelWhiteSpace: labelStyle.whiteSpace,
      };
    });

    expect(longLabelLayout).not.toBeNull();
    expect(longLabelLayout?.labelWhiteSpace).toBe('normal');
    expect(longLabelLayout?.labelScrollHeight).toBeGreaterThan(longLabelLayout?.labelLineHeight ?? 0);
    expect(longLabelLayout?.buttonScrollWidth).toBeLessThanOrEqual((longLabelLayout?.buttonClientWidth ?? 0) + 1);
    expect(longLabelLayout?.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(await narrowPanel.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
      (await narrowPanel.evaluate((element) => element.clientWidth)) + 1,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    const overflowPanel = page.getByTestId('overflow');
    const inlineGroup = overflowPanel.getByRole('group', { name: '行内操作' });
    const rowItems = inlineGroup.locator(':scope > .lx-actions__item, :scope > .lx-actions__more-wrap');
    const rowTops = await rowItems.evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().top)),
    );
    expect(rowItems).toHaveCount(3);
    expect(new Set(rowTops).size).toBe(1);

    const moreButton = overflowPanel.getByRole('button', { name: '更多' });
    await moreButton.click();
    const warningAction = overflowPanel.getByRole('button', { name: '重置密码' });
    await expect(overflowPanel.getByRole('group', { name: '更多操作' }).getByRole('button')).toHaveCount(2);

    const lightContrast = await contrastRatio(warningAction);
    expect(
      lightContrast.ratio,
      `${lightContrast.foreground} / ${lightContrast.background}; token=${lightContrast.token}; item=${lightContrast.itemToken}`,
    ).toBeGreaterThanOrEqual(4.5);

    await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
    await expect
      .poll(async () => (await contrastRatio(warningAction)).ratio, { timeout: 5_000 })
      .toBeGreaterThanOrEqual(4.5);
  });

  test('窄列长标签溢出菜单完整显示在 375px 视口内', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const narrowPanel = page.getByTestId('narrow-actions');
    const moreButton = narrowPanel.getByRole('button', { name: '更多', exact: true });
    await moreButton.click();

    const menu = narrowPanel.getByRole('group', { name: '更多操作' });
    const longMenuItem = menu.getByRole('button', { name: '撤销当前跨区域布控任务' });
    const menuBox = await menu.boundingBox();
    expect(await longMenuItem.isVisible()).toBe(true);
    expect(menuBox?.x).toBeGreaterThanOrEqual(8);
    expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(367);
    expect(await menu.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
      (await menu.evaluate((element) => element.clientWidth)) + 1,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test('菜单在视口底部上翻并在左侧留出安全边距', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const overflowPanel = page.getByTestId('overflow');
    const moreButton = overflowPanel.getByRole('button', { name: '更多' });
    await moreButton.evaluate((button) => {
      const wrapper = button.parentElement;
      if (!wrapper) throw new Error('未找到更多按钮定位容器');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '0px';
      wrapper.style.top = '760px';
      wrapper.style.zIndex = '3000';
    });
    await moreButton.click();

    const menu = overflowPanel.getByRole('group', { name: '更多操作' });
    const buttonBox = await moreButton.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(menuBox?.x).toBeGreaterThanOrEqual(8);
    expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(367);
    expect((menuBox?.y ?? 0) + (menuBox?.height ?? 0)).toBeLessThanOrEqual(804);
    expect(menuBox?.y).toBeLessThan(buttonBox?.y ?? 0);
  });

  test('菜单打开后页面滚动，位置仍保持在视口内', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxactionbuttons');

    const overflowPanel = page.getByTestId('overflow');
    const moreButton = overflowPanel.getByRole('button', { name: '更多' });
    await moreButton.evaluate((button) => button.scrollIntoView({ block: 'center', inline: 'nearest' }));
    const scrollBeforeMenu = await page.evaluate(() => window.scrollY);
    await moreButton.click();
    await page.evaluate(() => window.scrollBy(0, 48));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBeforeMenu);

    const menu = overflowPanel.getByRole('group', { name: '更多操作' });
    const buttonBox = await moreButton.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(buttonBox?.y).toBeGreaterThan(8);
    expect((buttonBox?.y ?? 0) + (buttonBox?.height ?? 0)).toBeLessThan(804);
    expect(menuBox?.x).toBeGreaterThanOrEqual(8);
    expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(367);
    expect(menuBox?.y).toBeGreaterThanOrEqual(8);
    expect((menuBox?.y ?? 0) + (menuBox?.height ?? 0)).toBeLessThanOrEqual(804);
    const gapBelowButton = (menuBox?.y ?? 0) - ((buttonBox?.y ?? 0) + (buttonBox?.height ?? 0));
    const gapAboveButton = (buttonBox?.y ?? 0) - ((menuBox?.y ?? 0) + (menuBox?.height ?? 0));
    expect(Math.min(Math.abs(gapBelowButton - 4), Math.abs(gapAboveButton - 4))).toBeLessThanOrEqual(1);
  });

  test('点击外部或按 Tab 离开操作列表时收起', async ({ page }) => {
    await page.goto('/components/lxactionbuttons');

    const moreButton = page.getByRole('button', { name: '更多', exact: true }).first();
    const actionGroup = page.getByRole('group', { name: '更多操作' }).first();
    await moreButton.click();
    await page.getByRole('heading', { name: '溢出菜单与事件反馈' }).click();
    await expect(actionGroup).toBeHidden();

    await moreButton.focus();
    await page.keyboard.press('Enter');
    await expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(actionGroup).toBeHidden();
    await expect(moreButton).toHaveAttribute('aria-expanded', 'false');
  });
});
