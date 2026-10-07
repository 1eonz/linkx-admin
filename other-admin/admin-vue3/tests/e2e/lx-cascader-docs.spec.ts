import { expect, test } from '@playwright/test';

test.describe('lx-ui LxCascader 文档示例', () => {
  test('新增组件总览包含可见的级联选择 Demo', async ({ page }) => {
    await page.goto('/components/new-components');

    const demo = page.locator('.cascader-demo');
    await expect(demo).toBeVisible();
    await expect(page.getByRole('textbox', { name: '组织路径' })).toBeVisible();
  });

  test('方向键逐级浏览并用 Enter 选择组织路径', async ({ page }) => {
    await page.goto('/components/lxcascader');

    const demo = page.locator('.cascader-demo');
    const input = demo.locator('.lx-cascader input').first();
    await input.focus();
    await input.press('ArrowDown');

    const popper = page.locator('.lx-cascader__popper').last();
    await expect(popper).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(demo.locator('.cascader-demo__value')).toContainText('hangzhou / xihu / patrol');
  });

  test('支持多选、加载、失败重试和禁用状态，并用 Escape 收起菜单', async ({ page }) => {
    await page.goto('/components/lxcascader');
    await expect(page.getByRole('heading', { name: 'LxCascader 级联选择' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'LxCascader 级联选择', exact: true })).toBeVisible();

    const demo = page.locator('.cascader-demo');
    const cascader = demo.locator('.lx-cascader').first();
    const input = cascader.locator('input').first();
    const searchInput = cascader.locator('.el-cascader__search-input');
    const popper = page.locator('.lx-cascader__popper').last();

    await expect(input).toHaveAttribute('aria-labelledby', 'cascader-demo-label');
    await expect(page.getByRole('textbox', { name: '组织路径' })).toBeVisible();
    await expect(demo.locator('.cascader-demo__value')).not.toHaveAttribute('aria-live');
    await expect(demo.locator('.cascader-demo__status')).toHaveAttribute('role', 'status');
    await demo.locator('.cascader-demo__settings summary').click();
    await expect(demo.getByRole('group', { name: '选择模式' })).toBeVisible();
    await expect(demo.getByRole('group', { name: '数据状态' })).toBeVisible();
    await input.focus();
    await input.press('ArrowDown');
    await expect(popper).toBeVisible();
    await input.press('Escape');
    await expect(popper).toBeHidden();

    await demo.getByRole('button', { name: '多选模式', exact: true }).click();
    await expect(demo.locator('.cascader-demo__value')).toContainText('hangzhou / xihu / command');
    await expect(demo.locator('.cascader-demo__status')).toHaveText('多选值已回显 2 条组织路径');

    await demo.getByRole('button', { name: '加载中且失败', exact: true }).click();
    await expect(demo.locator('.lx-cascader__feedback')).toContainText('加载中');
    await expect(demo.locator('.lx-cascader__feedback')).not.toContainText('加载失败');
    await expect(demo.locator('.lx-cascader-field')).toHaveAttribute('aria-busy', 'true');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    const loadingValue = await demo.locator('.cascader-demo__value').textContent();
    await searchInput.focus();
    await searchInput.press('Backspace');
    await expect(demo.locator('.cascader-demo__value')).toHaveText(loadingValue ?? '');
    await expect(cascader).toHaveClass(/lx-cascader--selection-paused/);

    await demo.getByRole('button', { name: '失败', exact: true }).click();
    await expect(demo.locator('.lx-cascader__feedback')).toContainText('组织数据加载失败');
    await expect(input).toHaveAttribute('aria-describedby', 'cascader-demo-path-error');
    await expect(page.locator('[id="cascader-demo-path-error"]')).toHaveCount(1);
    const errorValue = await demo.locator('.cascader-demo__value').textContent();
    await searchInput.focus();
    await searchInput.press('Backspace');
    await expect(demo.locator('.cascader-demo__value')).toHaveText(errorValue ?? '');
    await expect(cascader).toHaveClass(/lx-cascader--selection-paused/);

    const inputWrapper = cascader.locator('.el-input__wrapper');
    await input.focus();
    await expect(inputWrapper).toHaveClass(/is-focus/);
    await expect(inputWrapper).toHaveCSS('box-shadow', 'rgb(186, 26, 26) 0px 0px 0px 1px inset');

    await demo.getByRole('checkbox', { name: '控件英文' }).check();
    await expect(demo.locator('.lx-cascader__feedback')).toContainText('Failed to load organization data');
    await demo.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(demo.locator('.lx-cascader__feedback')).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-describedby', /cascader-demo-path-error/);

    await demo.getByRole('button', { name: '禁用', exact: true }).click();
    await expect(input).toBeDisabled();
  });

  test('reduced motion disables transitions in the teleported cascader popper', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxcascader');

    const input = page.locator('.lx-cascader input').first();
    await input.click();
    const node = page.locator('.lx-cascader__popper .el-cascader-node').first();
    const duration = await node.evaluate((element) => getComputedStyle(element).transitionDuration);

    expect(duration.split(',').every((value) => Number.parseFloat(value) === 0)).toBe(true);
  });

  test('375px 下弹层和重试按钮满足触控尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxcascader');

    const demo = page.locator('.cascader-demo');
    const cascader = demo.locator('.lx-cascader').first();
    const input = cascader.locator('input').first();
    const triggerBounds = await cascader.locator('.el-input__wrapper').boundingBox();
    expect(triggerBounds?.height).toBeGreaterThanOrEqual(44);
    await input.focus();
    await input.press('ArrowDown');

    const popper = page.locator('.lx-cascader__popper').last();
    await expect(popper).toBeVisible();
    await page.waitForTimeout(350);
    const geometry = await popper.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const nodes = Array.from(element.querySelectorAll<HTMLElement>('.el-cascader-node'));
      return {
        viewport: document.documentElement.clientWidth,
        right: bounds.right,
        width: bounds.width,
        rowHeights: nodes.map((node) => node.getBoundingClientRect().height),
      };
    });

    expect(geometry.right).toBeLessThanOrEqual(375);
    expect(geometry.width).toBeLessThanOrEqual(375);
    expect(geometry.rowHeights.length).toBeGreaterThan(0);
    expect(Math.min(...geometry.rowHeights)).toBeGreaterThanOrEqual(44);
    const nodeLabelStyle = await popper
      .locator('.el-cascader-node__label')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          overflow: style.overflow,
          whiteSpace: style.whiteSpace,
          text: element.textContent?.trim(),
        };
      });
    expect(nodeLabelStyle.overflow).toBe('visible');
    expect(nodeLabelStyle.whiteSpace).toBe('normal');
    expect(nodeLabelStyle.text).toBe('杭州市公安局');

    await input.press('Escape');
    await expect(popper).toBeHidden();
    await demo.locator('.cascader-demo__settings summary').click();
    await demo.getByRole('button', { name: '失败', exact: true }).click();
    const retry = demo.locator('.lx-cascader__feedback .lx-cascader__retry');
    await expect(retry).toBeVisible();
    await expect
      .poll(async () => retry.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(44);
  });
});
