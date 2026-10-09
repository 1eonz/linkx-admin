import { expect, test } from '@playwright/test';

test.describe('lx-ui LxStatusSwitch 文档示例', () => {
  test('保留 0/1 映射并展示只读状态', async ({ page }) => {
    await page.goto('/components/lxstatusswitch');

    const numericRow = page.getByTestId('numeric-row');
    const numericTrack = numericRow.locator('.el-switch__core');
    const trackBox = await numericTrack.boundingBox();
    if (!trackBox) throw new Error('状态开关没有进入可视区域');
    expect(trackBox.width).toBe(42);
    expect(trackBox.height).toBe(20);
    await numericRow.locator('.el-switch__input').focus();
    const outlineWidth = await numericTrack.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    );
    expect(outlineWidth).toBeGreaterThanOrEqual(2);
    const promptContrast = await numericRow
      .locator('.el-switch__inner-wrapper')
      .first()
      .evaluate((element) => {
        const core = element.closest('.el-switch__core');
        if (!core) throw new Error('状态文字没有关联开关轨道');
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3) throw new Error(`无法读取颜色：${color}`);
          const [red, green, blue] = channels.map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        const foreground = luminance(getComputedStyle(element).color);
        const background = luminance(getComputedStyle(core).backgroundColor);
        const [lighter, darker] = [foreground, background].sort((a, b) => b - a);
        return (lighter + 0.05) / (darker + 0.05);
      });
    expect(promptContrast).toBeGreaterThanOrEqual(4.5);
    await numericTrack.click();
    await expect(page.getByTestId('numeric-state')).toHaveText('1');
    await numericRow.locator('.el-switch__input').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('numeric-state')).toHaveText('0');

    await expect(page.getByTestId('readonly-row')).toContainText('开启（只读）');
    await expect(page.getByTestId('readonly-row').locator('.el-switch')).toHaveCount(0);
  });

  test('关闭前显示后果说明，取消不改值，确认后才关闭', async ({ page }) => {
    await page.goto('/components/lxstatusswitch');
    const confirmTrack = page.getByTestId('confirm-row').locator('.el-switch__core');

    await confirmTrack.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('关闭后将中断节点通信。');
    await expect(dialog).toContainText('目标实体：市局指挥中心主节点 NODE-MAIN-01');
    await expect(dialog).toContainText('影响范围：核心节点、跨域调度中继及关联警力将暂时不可用。');
    await expect(dialog).toContainText('审计记录：操作人、目标节点和变更原因将写入不可篡改审计日志。');
    await dialog.getByRole('button', { name: '取消' }).click();
    await expect(page.getByTestId('confirm-state')).toHaveText('开启');

    await confirmTrack.click();
    await dialog.getByRole('button', { name: '确认关闭' }).click();
    await expect(page.getByTestId('confirm-state')).toHaveText('关闭');
  });

  test('为只读与无权限状态保留行名关联', async ({ page }) => {
    await page.goto('/components/lxstatusswitch');
    for (const testId of ['loading-row', 'readonly-row', 'permission-row']) {
      const row = page.getByTestId(testId);
      const control = row.locator('[role="switch"], .lx-status-switch__fallback').first();
      await expect(control).toHaveAttribute('aria-labelledby', `status-switch-${testId.replace('-row', '')}-label`);
    }
  });

  test('模拟保存失败可恢复，窄屏触控、主题与减少动效可用', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/components/lxstatusswitch');
    await page.getByLabel('下一次保存失败').check();

    const initialAction = await page.getByTestId('last-action').textContent();
    const loadingRow = page.getByTestId('loading-row');
    await loadingRow.locator('.el-switch__core').click();
    await expect(page.getByTestId('last-action')).toHaveText(initialAction ?? '');

    const booleanRow = page.getByTestId('boolean-row');
    const track = booleanRow.locator('.el-switch__core');
    await track.click();
    await expect(page.getByRole('alert')).toHaveText('保存失败，状态未修改；可以重新切换重试。');
    await expect(page.getByTestId('boolean-state')).toHaveText('开启');

    await track.click();
    await expect(page.getByTestId('boolean-state')).toHaveText('关闭');
    await expect(page.getByTestId('last-action')).toHaveText('已保存为关闭');

    const switchBox = await booleanRow.locator('.el-switch').boundingBox();
    if (!switchBox) throw new Error('窄屏状态开关没有进入可视区域');
    expect(switchBox.width).toBeGreaterThanOrEqual(44);
    expect(switchBox.height).toBeGreaterThanOrEqual(44);
    await page.getByLabel('HUD 深色主题').check();
    await expect(page.locator('.status-switch-demo')).toHaveClass(/lx-theme-hud/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const duration = await track.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00002);
  });
});
