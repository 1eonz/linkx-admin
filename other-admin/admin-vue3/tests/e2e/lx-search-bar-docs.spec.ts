import { expect, test } from '@playwright/test';

test.describe('lx-ui LxSearchBar 文档示例', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto('/components/lxsearchbar');
  });

  test('成功、空结果和失败状态都能恢复', async ({ page }) => {
    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const search = panel.getByRole('button', { name: '查询' });
    const status = panel.locator('.lx-search-demo__meta-status');

    await search.click();
    await expect(status).toContainText('查询到 2 条');
    await expect(demo.locator('.lx-search-demo__result')).toContainText('AL-2026-0001');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '空结果' }).click();
    await search.click();
    await expect(status).toContainText('暂无匹配结果');
    await expect(demo.locator('.lx-search-demo__result')).toContainText('无结果');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '失败' }).click();
    await search.click();
    await expect(status).toContainText('查询服务暂不可用');

    await demo.locator('.lx-search-demo__modes button').filter({ hasText: '成功' }).click();
    await search.click();
    await expect(status).toContainText('查询到 2 条');
  });

  test('重置恢复 schema 默认值，查询期间锁定按钮', async ({ page }) => {
    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const keyword = panel.locator('.lx-search-bar__field input[type="text"]').first();
    await keyword.fill('临时条件');

    const reset = panel.getByRole('button', { name: '重置' });
    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(keyword).toHaveValue('');
    await expect(panel.locator('.lx-search-demo__meta-status')).toContainText('查询中');

    const search = panel.getByRole('button', { name: '查询' });
    await expect(search).toBeDisabled();
    await expect(reset).toBeDisabled();
    await expect(panel.locator('.lx-search-demo__meta-status')).toContainText('查询到 2 条');
  });

  test('375px 展开全部条件、焦点和正文宽度保持可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();

    const demo = page.locator('.lx-search-demo');
    const panel = demo.getByTestId('advanced-search');
    const expand = panel.getByRole('button', { name: '展开' });
    await expect(expand).toBeVisible();
    await expand.focus();
    await expect(expand).toBeFocused();
    await expand.press('Enter');
    await expect(panel.getByRole('button', { name: '收起' })).toBeVisible();
    await expect(panel.locator('.lx-search-bar__field')).toHaveCount(10);

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await panel.locator('input').first().focus();
    await panel.locator('input').first().press('Escape');
    await expect(panel.locator('input').first()).toHaveValue('');
    await expect(panel.locator('.lx-search-bar__field')).toHaveCount(10);
  });

  test('Escape 关闭日期弹层时保留已输入的其他条件', async ({ page }) => {
    const panel = page.getByTestId('advanced-search');
    const keyword = panel.locator('input[type="text"]').first();
    await keyword.fill('保留条件');

    const dateInput = panel.locator('.el-date-editor input').first();
    await dateInput.click();
    await expect(page.locator('.el-picker__popper:visible')).toBeVisible();
    await dateInput.press('Escape');

    await expect(page.locator('.el-picker__popper:visible')).toHaveCount(0);
    await expect(keyword).toHaveValue('保留条件');
    await expect(panel.locator('.lx-search-bar__meta')).not.toContainText('已重置');
  });

  test('展示四字段标准态并在桌面同行放置操作组', async ({ page }) => {
    const standard = page.getByTestId('standard-search');
    await expect(standard.locator('.lx-search-bar__field')).toHaveCount(4);
    await expect(standard.locator('.lx-search-bar__grid--inline-actions')).toBeVisible();
    const lastField = standard.locator('.lx-search-bar__field--inline-actions');
    const alignment = await lastField.evaluate((field) => {
      const control = field.querySelector<HTMLElement>('.lx-select, .el-select, .lx-date-picker, .el-date-editor');
      const actions = field.querySelector<HTMLElement>('.lx-search-bar__actions--inline');
      const search = actions?.querySelector<HTMLElement>('button');
      const reset = actions?.querySelectorAll<HTMLElement>('button')[1];
      if (!control || !actions || !search || !reset) {
        throw new Error('四字段标准态缺少选择器或查询操作');
      }
      const center = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        return rect.top + rect.height / 2;
      };
      return {
        control: center(control),
        search: center(search),
        reset: center(reset),
        controlBottom: control.getBoundingClientRect().bottom,
        actionsBottom: actions.getBoundingClientRect().bottom,
        controlWidth: control.getBoundingClientRect().width,
        actionsLeft: actions.getBoundingClientRect().left,
        controlRight: control.getBoundingClientRect().right,
      };
    });
    expect(Math.abs(alignment.control - alignment.search), JSON.stringify(alignment)).toBeLessThanOrEqual(1);
    expect(Math.abs(alignment.control - alignment.reset), JSON.stringify(alignment)).toBeLessThanOrEqual(1);
    expect(Math.abs(alignment.controlBottom - alignment.actionsBottom), JSON.stringify(alignment)).toBeLessThanOrEqual(
      1,
    );
    expect(alignment.controlWidth).toBeGreaterThanOrEqual(80);
    expect(alignment.actionsLeft).toBeGreaterThanOrEqual(alignment.controlRight);

    await page.setViewportSize({ width: 375, height: 812 });
    const mobileLayout = await lastField.evaluate((field) => {
      const control = field.querySelector<HTMLElement>('.lx-select, .el-select, .lx-date-picker, .el-date-editor');
      const actions = field.querySelector<HTMLElement>('.lx-search-bar__actions--inline');
      if (!control || !actions) throw new Error('窄屏标准态缺少控件或操作组');
      return {
        controlBottom: control.getBoundingClientRect().bottom,
        actionsTop: actions.getBoundingClientRect().top,
        fieldRight: field.getBoundingClientRect().right,
        actionsRight: actions.getBoundingClientRect().right,
      };
    });
    expect(mobileLayout.actionsTop).toBeGreaterThanOrEqual(mobileLayout.controlBottom);
    expect(mobileLayout.actionsRight).toBeLessThanOrEqual(mobileLayout.fieldRight + 1);
  });
});
