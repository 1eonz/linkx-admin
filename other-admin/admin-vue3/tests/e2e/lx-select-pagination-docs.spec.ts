import { expect, test } from '@playwright/test';

const popper = (page: import('@playwright/test').Page) =>
  page.locator('.el-select__popper[class*="lx-select-pagination-popper-"]');

test.describe('lx-ui LxSelectPagination 文档示例', () => {
  test('跨页选择后保留完整标签，并在搜索结果变化时维持回显', async ({ page }) => {
    await page.goto('/components/lxselectpagination');

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    const selectedSummary = page.getByTestId('selected-summary');
    await trigger.click();
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();
    await expect(trigger).toContainText('孙志国 (POL-00001)');
    await expect(selectedSummary).toContainText('POL-00003');

    await dropdown.getByRole('button', { name: /继续加载/ }).click();
    const nextPageOption = dropdown.getByRole('option', { name: /赵立东 \(POL-00005\)/ });
    await expect(nextPageOption).toBeVisible();
    await nextPageOption.click();
    await expect(page.getByTestId('last-change')).toContainText('赵立东');
    await expect(selectedSummary).toContainText('POL-00005');

    await dropdown.getByRole('textbox', { name: '输入姓名、警号或部门检索' }).fill('POL-00010');
    await expect(dropdown.getByRole('option', { name: /POL-00010/ })).toBeVisible({ timeout: 2_000 });
    await expect(trigger).toContainText('孙志国 (POL-00001)');
    await expect(selectedSummary).toContainText('POL-00001');
    await expect(selectedSummary).toContainText('POL-00005');
  });

  test('请求失败可重试，空结果有明确状态', async ({ page }) => {
    await page.goto('/components/lxselectpagination');
    await page.getByRole('button', { name: '下次请求失败' }).click();

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    await trigger.click();
    await expect(dropdown.getByRole('alert')).toContainText('选项暂时无法加载');
    await dropdown.getByRole('button', { name: '重新加载' }).click();
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();

    await page.getByRole('button', { name: '显示空结果' }).click();
    await trigger.click();
    await expect(dropdown.getByRole('status')).toContainText('暂无匹配项');
  });

  test('HUD 主题会同步作用于 Demo 和远程分页弹层', async ({ page }) => {
    await page.goto('/components/lxselectpagination');
    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    await trigger.click();
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();
    await expect(dropdown).toHaveCSS('background-color', 'rgb(22, 35, 58)');
    await expect(dropdown).toHaveCSS('color', 'rgb(223, 223, 214)');
  });

  test('375px 下搜索可访问、旧请求取消且分页操作适合触屏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxselectpagination');

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    await trigger.click();
    const search = dropdown.getByRole('textbox', { name: '输入姓名、警号或部门检索' });
    await expect(search).toBeVisible();

    const width = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(width.document).toBeLessThanOrEqual(width.viewport);
    const dropdownBox = await dropdown.boundingBox();
    expect(dropdownBox).not.toBeNull();
    expect(dropdownBox!.x).toBeGreaterThanOrEqual(0);
    expect(dropdownBox!.x + dropdownBox!.width).toBeLessThanOrEqual(width.viewport);

    await expect(page.getByTestId('request-count')).toHaveText('1');
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();
    const continueLoading = dropdown.getByRole('button', { name: /继续加载/ });
    const touchTarget = await continueLoading.boundingBox();
    expect(touchTarget?.height).toBeGreaterThanOrEqual(44);

    await page.getByRole('button', { name: '下次请求延迟' }).dispatchEvent('click');
    await search.fill('孙');
    await expect(page.getByTestId('request-count')).toHaveText('2');
    await expect(page.locator('.lx-select-pagination')).toHaveAttribute('aria-busy', 'true');
    await search.fill('李');
    await expect(page.getByTestId('cancelled-count')).toHaveText('1');
    await expect(page.getByTestId('request-count')).toHaveText('3');
    await expect(dropdown.getByRole('option', { name: /李建华 \(POL-00008\)/ })).toBeVisible({ timeout: 2_000 });

    await search.focus();
    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });

  test('续页失败后按原页码重试并保留已加载队列', async ({ page }) => {
    await page.goto('/components/lxselectpagination');

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    await trigger.click();
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();

    // 该按钮只设置 Demo 的下一次请求结果，派发 click 可避免触发弹层外部点击关闭行为。
    await page.getByRole('button', { name: '下次请求失败' }).dispatchEvent('click');
    const continueLoading = dropdown.getByRole('button', { name: /继续加载/ });
    await continueLoading.scrollIntoViewIfNeeded();
    await continueLoading.click();
    await expect(dropdown.getByRole('alert')).toContainText('选项暂时无法加载');
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();
    await expect(page.getByTestId('request-pages')).toHaveText('1、2');

    await dropdown.getByRole('button', { name: '重新加载' }).click();
    await expect(dropdown.getByRole('option', { name: /赵立东 \(POL-00005\)/ })).toBeVisible();
    await expect(page.getByTestId('request-pages')).toHaveText('1、2、2');
    await expect(dropdown.getByRole('button', { name: /继续加载/ })).toContainText('8 / 12');
  });

  test('LxForm 禁用会锁定选择器并阻止重载请求', async ({ page }) => {
    await page.goto('/components/lxselectpagination');

    const trigger = page.locator('.lx-select-pagination .el-select__wrapper');
    const dropdown = popper(page);
    await trigger.click();
    await expect(dropdown.getByRole('option', { name: /孙志国 \(POL-00001\)/ })).toBeVisible();
    await expect(page.getByTestId('request-count')).toHaveText('1');

    await page.getByRole('button', { name: '禁用选择器' }).click();
    await expect(trigger).toHaveClass(/is-disabled/);
    await expect(dropdown).toBeHidden();
    await page.getByRole('button', { name: '显示空结果' }).click();
    await expect(page.getByTestId('request-count')).toHaveText('1');

    await page.getByRole('button', { name: '启用选择器' }).click();
    await page.getByRole('button', { name: '恢复成功结果' }).click();
    await expect(page.getByTestId('request-count')).toHaveText('2');
  });
});
