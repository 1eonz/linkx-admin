import { expect, test, type Locator } from '@playwright/test';

async function getContrastRatio(element: Locator) {
  return element.evaluate((target) => {
    const luminance = (color: string) => {
      const [red, green, blue] = color.match(/[\d.]+/g)?.map(Number) ?? [];
      const linear = [red, green, blue].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const hasBackground = (color: string) => {
      const channels = color.match(/[\d.]+/g)?.map(Number) ?? [];
      return channels.length < 4 || channels[3] > 0;
    };

    const foreground = getComputedStyle(target).color;
    let ancestor: Element | null = target;
    let background = 'rgb(255, 255, 255)';
    while (ancestor) {
      const candidate = getComputedStyle(ancestor).backgroundColor;
      if (hasBackground(candidate)) {
        background = candidate;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  });
}

test.describe('lx-ui 图标总览', () => {
  test('覆盖全部名称并提供鼠标、键盘、触屏及减少动效反馈', async ({ page }, testInfo) => {
    await page.goto('/components/lxicons');

    const tiles = page.locator('.icon-tile');
    await expect(tiles).toHaveCount(96);
    await expect(page.locator('details.icon-group')).toHaveCount(8);
    await expect(page.locator('details.icon-group[open]')).toHaveCount(1);
    const coreGroup = page.locator('details.icon-group').filter({ hasText: 'P0 高频核心·常用操作' });
    await expect(coreGroup.locator('.icon-tile')).toHaveCount(4);
    const remainingCoreGroup = page.locator('details.icon-group').filter({ hasText: 'P0 高频核心·内容与状态' });
    await expect(remainingCoreGroup.locator('.icon-tile')).toHaveCount(9);
    await expect(remainingCoreGroup).not.toHaveAttribute('open', '');
    const checklist = page.locator('.icon-checklist');
    await expect(checklist.locator('.icon-checklist__row')).toHaveCount(4);
    await expect(checklist).toContainText('P0 高频核心');
    await expect(checklist).toContainText('P1 业务语义');
    await expect(checklist).toContainText('29 枚扩展');
    await expect(checklist).toContainText('69');
    const businessExample = page.locator('.icon-business-example');
    await expect(businessExample).toContainText('运维组');
    await expect(businessExample).toContainText('设备管理');
    await expect(businessExample).toContainText('已授权');
    await expect(businessExample.locator('[data-icon-name="people"]')).toBeVisible();
    await expect(businessExample.locator('[data-icon-name="file-check"]')).toBeVisible();
    await expect(businessExample.locator('[data-icon-name="shield"]')).toBeVisible();
    await expect(page.locator('.icon-count-note')).toContainText('26 个标准图形键');
    const checklistLabel = page.locator('.icon-checklist__row dt').first();
    expect(await getContrastRatio(checklistLabel)).toBeGreaterThanOrEqual(4.5);

    const search = page.getByRole('textbox', { name: '按名称或中文用途筛选图标' });
    const searchbar = page.getByRole('search', { name: '图标目录筛选' });
    const emptyStatus = page.locator('.icon-search-status');
    await expect(emptyStatus).toBeAttached();
    await expect(emptyStatus).toHaveText('');
    await search.fill('工作台');
    await expect(page.getByRole('button', { name: '复制 dashboard（仪表盘）图标用法' })).toBeVisible();
    await expect(tiles).toHaveCount(1);
    await expect(emptyStatus).toHaveText('找到 1 个匹配图标，分布在 1 个分类中');
    await search.fill('e');
    const matchCount = await tiles.count();
    const matchGroupCount = await page.locator('details.icon-group').count();
    expect(matchCount).toBeGreaterThan(1);
    expect(matchGroupCount).toBeGreaterThan(1);
    await expect(emptyStatus).toHaveText(`找到 ${matchCount} 个匹配图标，分布在 ${matchGroupCount} 个分类中`);
    await search.fill('delete');
    const filteredDeleteTile = page.getByRole('button', { name: '复制 delete（删除）图标用法' });
    await expect(filteredDeleteTile).toBeVisible();
    await coreGroup.locator('summary').click();
    await expect(filteredDeleteTile).toBeHidden();
    await search.fill('undo');
    await expect(page.getByRole('button', { name: '复制 undo（重置）图标用法' })).toBeVisible();
    await search.fill('登出');
    await expect(page.getByRole('button', { name: '复制 logout（退出登录）图标用法' })).toBeVisible();
    await expect(tiles).toHaveCount(1);
    await search.fill('');

    await page.setViewportSize({
      width: testInfo.project.name === 'mobile-chromium' ? 375 : 1440,
      height: testInfo.project.name === 'mobile-chromium' ? 812 : 1000,
    });
    const firstCoreTile = coreGroup.locator('.icon-tile').first();
    const scrollTarget = await firstCoreTile.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY - 80,
    );
    await page.evaluate((top) => window.scrollTo(0, top), scrollTarget);
    const visibleOverlapCount = await page.evaluate(() => {
      const searchRect = document.querySelector('.icon-searchbar')?.getBoundingClientRect();
      if (!searchRect) throw new Error('图标搜索栏未渲染');
      return [...document.querySelectorAll('.icon-tile')].filter((tile) => {
        const rect = tile.getBoundingClientRect();
        return (
          rect.bottom > searchRect.top &&
          rect.top < searchRect.bottom &&
          rect.right > searchRect.left &&
          rect.left < searchRect.right
        );
      }).length;
    });
    expect(visibleOverlapCount).toBe(0);
    expect(await searchbar.evaluate((element) => getComputedStyle(element).position)).toBe('static');

    await search.fill('no-such-icon');
    const emptyState = page.locator('.icon-empty');
    await expect(emptyStatus).toHaveText('无匹配图标');
    await expect(emptyState).toHaveText('无匹配图标');
    await expect(emptyState).toHaveAttribute('aria-hidden', 'true');
    await expect(emptyStatus).toHaveAttribute('role', 'status');
    await expect(emptyStatus).toHaveAttribute('aria-live', 'polite');
    await expect(emptyState).toHaveCSS('color', 'rgb(96, 98, 102)');
    const clearButton = page.getByRole('button', { name: '清除筛选' });
    const clearButtonBox = await clearButton.boundingBox();
    if (!clearButtonBox) throw new Error('清除筛选按钮未进入页面布局');
    const expectedClearButtonSize = testInfo.project.name === 'mobile-chromium' ? 44 : 32;
    expect(clearButtonBox.width).toBe(expectedClearButtonSize);
    expect(clearButtonBox.height).toBe(expectedClearButtonSize);
    const lightContrast = await getContrastRatio(emptyState);
    expect(lightContrast).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('button', { name: '清除筛选' }).click();
    await expect(search).toBeFocused();
    await expect(tiles).toHaveCount(96);

    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await search.fill('no-such-icon');
    const darkContrast = await getContrastRatio(emptyState);
    expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(checklistLabel)).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('button', { name: '清除筛选' }).click();
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    await page.evaluate(() => document.documentElement.classList.add('lx-theme-hud'));
    await expect(page.locator('.icon-catalog')).toHaveCSS('background-color', 'rgb(11, 18, 32)');
    await expect(page.locator('.icon-group-title').first()).toHaveCSS('color', 'rgb(226, 232, 240)');
    await search.fill('no-such-icon');
    const hudContrast = await getContrastRatio(emptyState);
    expect(hudContrast).toBeGreaterThanOrEqual(4.5);
    expect(await getContrastRatio(checklistLabel)).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('button', { name: '清除筛选' }).click();
    await page.evaluate(() => document.documentElement.classList.remove('lx-theme-hud'));

    if (testInfo.project.name === 'mobile-chromium') {
      await page.locator('.icon-group-title').filter({ hasText: 'P1 业务语义（26）' }).click();
      await page.setViewportSize({ width: 320, height: 800 });
      const placeholderFits = await search.evaluate((input) => {
        const styles = getComputedStyle(input);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return false;
        context.font = styles.font;
        const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
        return context.measureText(input.placeholder).width <= input.clientWidth - horizontalPadding;
      });
      expect(placeholderFits).toBe(true);
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      const emailTile = page.getByRole('button', { name: '复制 email（邮箱）图标用法' });
      const icon = emailTile.locator('.lx-icon');
      await emailTile.scrollIntoViewIfNeeded();
      const box = await emailTile.boundingBox();
      if (!box) throw new Error('触屏目标图标未进入可视区域');

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect
        .poll(() => icon.evaluate((element) => getComputedStyle(element).animationName))
        .toBe('lx-icon-email-lift');
      await expect.poll(() => icon.evaluate((element) => getComputedStyle(element).filter)).toContain('drop-shadow');
      await page.mouse.up();
      await emailTile.tap();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe('<LxIcon name="email" :size="20" />');
      await expect(page.locator('.icon-copy-feedback')).toHaveText('已复制：<LxIcon name="email" :size="20" />');

      await page.setViewportSize({ width: 320, height: 800 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
        .toBeLessThanOrEqual(0);
      return;
    }

    const deleteTile = page.getByRole('button', { name: '复制 delete（删除）图标用法' });
    await expect(deleteTile).toBeVisible();
    const deleteIcon = deleteTile.locator('.lx-icon');
    await deleteTile.hover();
    await expect
      .poll(() => deleteIcon.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-delete-shake');

    const warningTile = page.getByRole('button', { name: '复制 warning（警告）图标用法' });
    await remainingCoreGroup.locator('summary').click();
    await expect(warningTile).toBeVisible();
    await warningTile.hover();
    await expect
      .poll(() => warningTile.locator('.lx-icon').evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-warning-nudge');

    const spinningIcon = page.locator('.icon-tile .lx-icon[data-icon-name="plus"]');
    await expect(spinningIcon).toBeVisible();
    await spinningIcon.evaluate((element) => element.classList.add('is-spinning'));
    await spinningIcon.hover();
    await expect
      .poll(() => spinningIcon.evaluate((element) => getComputedStyle(element).animationName))
      .toContain('lx-icon-spin');

    await page.getByRole('textbox', { name: '按名称或中文用途筛选图标' }).fill('email');
    const emailTile = page.getByRole('button', { name: '复制 email（邮箱）图标用法' });
    const boundsBeforeFocus = await emailTile.boundingBox();
    if (!boundsBeforeFocus) throw new Error('键盘焦点目标未进入页面布局');

    await page.locator('.icon-search').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '清除筛选' })).toBeFocused();
    await page.keyboard.press('Tab');
    const emailGroupSummary = page.locator('.icon-group-title').filter({ hasText: 'P1 业务语义（1）' });
    await expect(emailGroupSummary).toBeFocused();
    await page.keyboard.press('Tab');
    const emailIcon = emailTile.locator('.lx-icon');
    await expect(emailTile).toBeFocused();
    await expect(emailTile).toHaveCSS('border-top-color', 'rgb(0, 96, 169)');
    const focusState = await emailTile.evaluate((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return {
        backgroundColor: style.backgroundColor,
        borderWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        width: bounds.width,
        height: bounds.height,
      };
    });
    const boundsWithFocus = await emailTile.boundingBox();
    expect(focusState).toMatchObject({
      backgroundColor: 'rgb(236, 245, 255)',
      borderWidth: '1px',
      boxShadow: 'none',
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '0px',
    });
    expect(boundsWithFocus?.width).toBe(boundsBeforeFocus.width);
    expect(boundsWithFocus?.height).toBe(boundsBeforeFocus.height);
    await expect
      .poll(() => emailIcon.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-email-lift');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await emailTile.hover();
    await expect.poll(() => emailIcon.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
    await emailIcon.evaluate((element) => element.classList.add('is-spinning'));
    await emailIcon.hover();
    await expect.poll(() => emailIcon.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
    await emailIcon.evaluate((element) => element.classList.remove('is-spinning'));
    const emailGroup = page.locator('details.icon-group').filter({ hasText: 'P1 业务语义' });
    const emailChevron = emailGroup.locator('.icon-group-title .lx-icon');
    await expect(emailGroup).toHaveAttribute('open', '');
    await expect(emailChevron).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
    await emailGroup.locator('summary').click();
    await expect(emailGroup).not.toHaveAttribute('open', '');
    await expect(emailChevron).toHaveCSS('transform', 'none');
    await emailGroup.locator('summary').click();
    await expect(emailChevron).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');

    await page.setViewportSize({ width: 320, height: 800 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0);
    const aliasRegion = page.getByRole('region', { name: '兼容别名对应关系' });
    await aliasRegion.scrollIntoViewIfNeeded();
    const aliasTableLayout = await aliasRegion.evaluate((region) => {
      const table = region.querySelector('table');
      if (!table) throw new Error('兼容别名表未渲染');
      return {
        regionWidth: region.clientWidth,
        tableWidth: table.scrollWidth,
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    expect(aliasTableLayout.tableWidth).toBeGreaterThan(aliasTableLayout.regionWidth);
    expect(aliasTableLayout.pageWidth).toBeLessThanOrEqual(320);
    await expect(aliasRegion).toHaveAttribute('tabindex', '0');
    await expect(aliasRegion).toHaveAttribute('aria-describedby', 'icon-alias-table-hint');
    await expect(page.locator('#icon-alias-table-hint')).toBeVisible();
  });

  test('剪贴板写入失败时展示并选中对应的手动复制代码', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new DOMException('clipboard denied', 'NotAllowedError')),
        },
      });
    });
    await page.goto('/components/lxicons');

    await page.getByRole('textbox', { name: '按名称或中文用途筛选图标' }).fill('重置');
    await page.getByRole('button', { name: '复制 undo（重置）图标用法' }).click();

    const fallback = page.locator('.icon-copy-fallback');
    await expect(fallback).toContainText('请使用下方已选中的代码进行手动复制');
    await expect(fallback).not.toHaveAttribute('role', 'alert');
    await expect(fallback).not.toHaveAttribute('aria-live');
    const feedback = page.locator('.icon-copy-feedback');
    await expect(feedback).toHaveText('复制失败，手动复制代码已就绪。');
    await expect(feedback).toHaveAttribute('role', 'status');
    await expect(page.getByRole('alert')).toHaveCount(0);
    const code = page.getByRole('textbox', { name: 'LxIcon undo 用法代码' });
    await expect(code).toHaveAttribute('aria-describedby', 'icon-copy-fallback-help');
    await expect(code).toHaveValue('<LxIcon name="undo" :size="20" />');
    await expect(code).toBeFocused();
    await expect.poll(() => code.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(0);
    await expect
      .poll(() => code.evaluate((element: HTMLTextAreaElement) => element.selectionEnd))
      .toBe('<LxIcon name="undo" :size="20" />'.length);
  });
});
