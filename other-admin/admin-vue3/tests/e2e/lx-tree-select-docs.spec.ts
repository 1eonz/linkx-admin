import { expect, test } from '@playwright/test';

test.describe('lx-ui LxTreeSelect 文档示例', () => {
  test('交互输入框位于首屏可见区域', async ({ page }) => {
    await page.goto('/components/lxtreeselect.html');

    const input = page.getByRole('combobox', { name: '组织机构' });
    await expect(input).toBeVisible();
    const bounds = await input.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 720;

    if (!bounds) throw new Error('TreeSelect 输入框没有可用的首屏边界');
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('支持方向键与 Enter 选择树节点', async ({ page }) => {
    await page.goto('/components/lxtreeselect.html');

    const select = page.locator('.lx-tree-select').first();
    const input = select.getByRole('combobox', { name: '组织机构' });
    const popper = page.locator('.lx-tree-select__popper').last();
    const currentValue = page.locator('.lx-tree-select-demo__value');

    await page.locator('.lx-tree-select-demo__settings summary').click();
    await page.getByRole('button', { name: '清空选择' }).click();
    await expect(currentValue).toHaveText('当前值：');
    await input.focus();
    await input.press('ArrowDown');
    await expect(popper).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(popper).toBeHidden();
    await expect(currentValue).not.toHaveText('当前值：');
  });

  test('覆盖单选、多选、空态、加载态、HUD 和窄屏布局', async ({ page }) => {
    await page.goto('/components/lxtreeselect.html');
    await expect(page.getByRole('heading', { name: 'LxTreeSelect 树形下拉' })).toBeVisible();

    const select = page.locator('.lx-tree-select').first();
    const field = page.locator('.lx-tree-select-field').first();
    const popper = page.locator('.lx-tree-select__popper').last();
    await expect(page.getByText('组织机构', { exact: true })).toBeVisible();
    await page.locator('.lx-tree-select-demo__settings summary').click();
    await select.click();
    await expect(page.locator('.el-tree-node__content').first()).toBeVisible();
    await page.locator('.el-tree-node__content').filter({ hasText: '滨江分局' }).click();
    await expect(page.getByText('当前值："bj"')).toBeVisible();
    await expect(popper).toBeVisible();
    await expect(page.locator('.el-tree-node__content').filter({ hasText: '长河派出所' })).toBeVisible();
    await page.locator('.el-tree-node__content').filter({ hasText: '长河派出所' }).click();
    await expect(page.getByText('当前值："bj-1"')).toBeVisible();
    await expect(popper).toBeHidden();

    await page.getByRole('button', { name: '多选模式' }).click();
    await expect(page.getByRole('button', { name: '单选模式' })).toHaveAttribute('aria-pressed', 'true');
    await expect(popper).toBeHidden();
    await select.click();
    await page
      .locator('.el-tree-node__content')
      .filter({ hasText: /^高新园区分局$/ })
      .click();
    await expect(page.locator('.el-tree-node__content').filter({ hasText: /^科技城派出所$/ })).toBeVisible();
    await page.locator('.el-tree-node__content').filter({ hasText: '科技城派出所' }).click();
    await expect(page.getByText('当前值：["bj-1"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '确认' })).toBeVisible();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(popper).toBeHidden();
    await expect(page.getByText('当前值：["bj-1","gx-1"]')).toBeVisible();

    await select.click();
    await page.locator('.el-tree-node__content').filter({ hasText: '滨江分局' }).click();
    await page.getByRole('button', { name: '取消' }).click();
    await expect(popper).toBeHidden();
    await expect(page.getByText('当前值：["bj-1","gx-1"]')).toBeVisible();

    await page.getByRole('button', { name: '查看空目录' }).click();
    await select.click();
    await expect(page.getByText('暂无数据')).toBeVisible();
    await select.locator('input').press('Escape');
    await page.getByRole('button', { name: '返回组织目录' }).click();

    await page.getByRole('button', { name: '模拟加载', exact: true }).click();
    await expect(field).toHaveAttribute('aria-busy', 'true');
    await select.click();
    await expect(popper).toBeVisible();
    await expect(popper.locator('.el-select-dropdown__empty')).toContainText('加载中');
    await expect(field).toHaveAttribute('aria-busy', 'false');
    await select.locator('input').press('Escape');
    await expect(popper).toBeHidden();

    await page.getByRole('button', { name: '模拟加载失败' }).click();
    await expect(page.getByRole('button', { name: '清除加载失败' })).toBeVisible();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('alert')).toContainText('组织目录加载失败');
    await expect(select.locator('input')).toHaveAttribute('aria-invalid', 'true');
    await expect(select.locator('input')).toHaveAttribute('aria-describedby', 'tree-select-demo-organization-error');
    await select.locator('input').focus();
    const errorFocusShadow = await select
      .locator('.el-select__wrapper')
      .evaluate((element) => getComputedStyle(element).boxShadow);
    expect(errorFocusShadow).toContain('inset');
    expect(errorFocusShadow.split('inset')).toHaveLength(2);
    expect(errorFocusShadow).not.toContain('2px');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.getByText('重试次数：1')).toBeVisible();
    await expect(field).toHaveAttribute('aria-busy', 'false');
    await expect(select.locator('input')).not.toHaveAttribute(
      'aria-describedby',
      /tree-select-demo-organization-error/,
    );

    await page.getByRole('checkbox', { name: 'English locale' }).check();
    await select.click();
    await expect(page.getByText('2 selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    await select.locator('input').press('Escape');

    await page.getByRole('checkbox', { name: 'HUD 深色' }).check();
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);

    await page.setViewportSize({ width: 375, height: 812 });
    await select.click();
    const mobilePopper = page.locator('.lx-tree-select__popper').last();
    await expect(mobilePopper).toBeVisible();
    const triggerBounds = await select.locator('.el-select__wrapper').boundingBox();
    expect(triggerBounds?.height).toBeGreaterThanOrEqual(44);
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBe(widths.viewport);
    await expect
      .poll(async () =>
        mobilePopper.evaluate((element) => {
          const rows = Array.from(element.querySelectorAll<HTMLElement>('.el-tree-node__content'));
          return Math.min(...rows.map((row) => row.getBoundingClientRect().height));
        }),
      )
      .toBeGreaterThanOrEqual(44);
    const geometry = await mobilePopper.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const rows = Array.from(element.querySelectorAll<HTMLElement>('.el-tree-node__content'));
      return {
        left: bounds.left,
        right: bounds.right,
        rowHeights: rows.map((row) => row.getBoundingClientRect().height),
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(375);
    expect(geometry.rowHeights.length).toBeGreaterThan(0);
    expect(Math.min(...geometry.rowHeights)).toBeGreaterThanOrEqual(44);
  });

  test('reduced motion disables transitions in the teleported tree popper', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxtreeselect.html');
    await page.locator('.lx-tree-select').first().click();

    const duration = await page
      .locator('.lx-tree-select__popper .el-tree-node__content')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);

    expect(duration.split(',').every((value) => Number.parseFloat(value) === 0)).toBe(true);
  });
});
