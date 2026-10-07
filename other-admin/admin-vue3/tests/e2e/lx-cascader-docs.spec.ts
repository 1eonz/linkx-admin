import { expect, test } from '@playwright/test';

test.describe('lx-ui LxCascader 文档示例', () => {
  test('组件侧栏按功能分组且保留所有展示与录入入口', async ({ page }) => {
    await page.goto('/components/lxcascader');

    const sidebar = page.locator('.VPSidebar');
    for (const group of [
      '表格、分页与详情',
      '页面与指标',
      '日历与组织',
      '状态与辅助',
      '图形与操作',
      '表单与基础字段',
      '选项控件',
      '树形与日期选择',
      '检索与复杂字段',
    ]) {
      await expect(sidebar.getByText(group, { exact: true })).toBeVisible();
    }

    const visibleLinks = (await sidebar.getByRole('link').allTextContents()).map((text) => text.trim());
    const expectedLinks = [
      'LxProTable 数据表格',
      'LxPagination 分页',
      'LxDescriptions 详情描述',
      'LxPageCard 页面容器',
      'LxMetricCard 指标卡',
      'LxSectionTitle 区块标题',
      'LxDutyCalendar 排班日历',
      'LxAuthImg 鉴权图片',
      'LxVirtualTree 虚拟树',
      'LxTransferPanel 双栏穿梭',
      'LxStatusDot 状态点',
      'LxTag 浅底标签',
      'LxNodeBadge 节点徽章',
      'LxEmpty 空态',
      'LxCodeSlot 代码槽',
      'LxActionButtons 行内操作',
      'LxGauge 圆环仪表',
      '权限消费',
      'LxForm 表单',
      'LxInput 输入框',
      'LxTextarea 文本域',
      'LxInputNumber 数字输入',
      'LxPasswordInput 密码输入框',
      'LxRadio 单选组',
      'LxCheckbox 复选组',
      'LxSwitch 开关',
      'LxSelect 下拉选择',
      'LxTreeSelect 树形下拉',
      'LxCascader 级联选择',
      'LxDatePicker 日期选择',
      'LxSearchBar 检索面板',
      'LxDynamicForm 动态表单',
      'LxStatusSwitch 状态开关',
      'LxUpload 文件上传',
      'LxSelectPagination 远程分页选择',
    ];

    for (const link of expectedLinks) expect(visibleLinks).toContain(link);
  });

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
    await expect(demo.locator('.cascader-demo__status')).toHaveText('正在加载组织数据，加载完成前保留当前路径。');
    await expect(demo.locator('.lx-cascader-field')).toHaveAttribute('aria-busy', 'true');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    const loadingValue = await demo.locator('.cascader-demo__value').textContent();
    await searchInput.focus();
    await searchInput.press('Backspace');
    await expect(demo.locator('.cascader-demo__value')).toHaveText(loadingValue ?? '');
    await expect(cascader).toHaveClass(/lx-cascader--selection-paused/);

    await demo.getByRole('button', { name: '失败', exact: true }).click();
    await expect(demo.locator('.lx-cascader__feedback')).toContainText('组织数据加载失败');
    await expect(demo.locator('.cascader-demo__status')).toHaveText('组织数据加载失败，请重试。');
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
    await expect(demo.locator('.cascader-demo__status')).toHaveText('数据已恢复，可以继续选择');
    await expect(input).not.toHaveAttribute('aria-describedby', /cascader-demo-path-error/);

    await demo.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(demo).toHaveClass(/lx-theme-hud/);
    await input.focus();
    await input.press('ArrowDown');
    await expect(popper).toHaveClass(/lx-theme-hud/);
    await expect(popper).toHaveClass(/dark/);
    const themeTokenValues = await Promise.all([
      demo.evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-bg-card').trim()),
      popper.evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-bg-card').trim()),
    ]);
    expect(themeTokenValues[0]).not.toBe('');
    expect(themeTokenValues[1]).toBe(themeTokenValues[0]);
    const popperBackground = await popper.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(popperBackground).not.toBe('rgb(255, 255, 255)');
    await input.press('Escape');

    await demo.getByRole('button', { name: '禁用', exact: true }).click();
    await expect(input).toBeDisabled();
    await expect(demo.locator('.cascader-demo__status')).toHaveText('组织路径控件当前已禁用。');
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
    const wrappedLabel = popper.locator('.el-cascader-node__label').filter({ hasText: '杭州市公安局' }).first();
    const wrappedLabelMetrics = await wrappedLabel.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(style.lineHeight),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    });
    expect(wrappedLabelMetrics.height).toBeGreaterThan(wrappedLabelMetrics.lineHeight);
    expect(wrappedLabelMetrics.scrollWidth).toBeLessThanOrEqual(wrappedLabelMetrics.clientWidth);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => popper.locator('.el-cascader-node__label').count()).toBeGreaterThan(0);
    const childLabel = popper.locator('.el-cascader-node__label').filter({ hasText: '西湖区分局' }).first();
    await expect(childLabel).toBeVisible();
    expect(await childLabel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

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
