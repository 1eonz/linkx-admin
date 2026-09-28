import { expect, test } from '@playwright/test';

test.describe('lx-ui 图标总览', () => {
  test('覆盖全部名称并提供鼠标、键盘、触屏及减少动效反馈', async ({ page }, testInfo) => {
    await page.goto('/components/lxicons');

    const tiles = page.locator('.icon-tile');
    await expect(tiles).toHaveCount(96);
    const checklist = page.locator('table').filter({ hasText: '去重合计' });
    await expect(checklist.locator('tbody tr')).toHaveCount(4);
    await expect(checklist).toContainText('P0 高频核心');
    await expect(checklist).toContainText('P1 业务语义');
    await expect(checklist).toContainText('29 枚扩展');
    await expect(checklist).toContainText('69');

    if (testInfo.project.name === 'mobile-chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      const emailTile = page.getByRole('button', { name: '复制 email 图标用法' });
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

      await page.setViewportSize({ width: 320, height: 800 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
        .toBeLessThanOrEqual(0);
      return;
    }

    const deleteTile = page.getByRole('button', { name: '复制 delete 图标用法' });
    const deleteIcon = deleteTile.locator('.lx-icon');
    await deleteTile.hover();
    await expect
      .poll(() => deleteIcon.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-delete-shake');

    const warningTile = page.getByRole('button', { name: '复制 warning 图标用法' });
    await warningTile.hover();
    await expect
      .poll(() => warningTile.locator('.lx-icon').evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-warning-nudge');

    await page.getByRole('textbox', { name: '筛选图标名称' }).fill('email');
    const emailTile = page.getByRole('button', { name: '复制 email 图标用法' });
    const boundsBeforeFocus = await emailTile.boundingBox();
    if (!boundsBeforeFocus) throw new Error('键盘焦点目标未进入页面布局');

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
        width: bounds.width,
        height: bounds.height,
      };
    });
    const boundsWithFocus = await emailTile.boundingBox();
    expect(focusState).toMatchObject({
      backgroundColor: 'rgb(236, 245, 255)',
      borderWidth: '1px',
      boxShadow: 'none',
      outlineStyle: 'none',
    });
    expect(boundsWithFocus?.width).toBe(boundsBeforeFocus.width);
    expect(boundsWithFocus?.height).toBe(boundsBeforeFocus.height);
    await expect
      .poll(() => emailIcon.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('lx-icon-email-lift');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await emailTile.hover();
    await expect.poll(() => emailIcon.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');

    await page.setViewportSize({ width: 320, height: 800 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0);
  });
});
