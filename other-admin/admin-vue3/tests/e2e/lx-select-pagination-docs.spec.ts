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
    await expect(page.locator('.lx-select-pagination-demo__stats dd').nth(2)).toContainText('赵立东');
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

    await expect(page.locator('.lx-select-pagination-demo__stats dd').first()).toHaveText('1');
    const continueLoading = dropdown.getByRole('button', { name: /继续加载/ });
    const touchTarget = await continueLoading.boundingBox();
    expect(touchTarget?.height).toBeGreaterThanOrEqual(44);

    await search.fill('孙');
    await page.waitForTimeout(320);
    await expect(dropdown.getByText('正在加载第 1 页...')).toBeVisible();
    await search.fill('李');
    await expect(page.locator('.lx-select-pagination-demo__stats dd').nth(1)).toHaveText('1');
    await expect(dropdown.getByRole('option', { name: /李建华/ })).toBeVisible({ timeout: 2_000 });
    await expect(page.locator('.lx-select-pagination-demo__stats dd').first()).toHaveText('3');

    await search.focus();
    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });
});
