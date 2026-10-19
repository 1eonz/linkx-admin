import { expect, test } from '@playwright/test';

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!channels || channels.length !== 3) throw new Error(`无法解析颜色：${color}`);
    const linear = channels.map((channel) => {
      const value = channel > 1 ? channel / 255 : channel;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('LxMetricCard 文档示例', () => {
  test('展示设计语义和旧宿主 API，进度条可读', async ({ page }) => {
    await page.goto('/components/lxmetriccard');

    await expect(page.getByRole('heading', { name: 'LxMetricCard 指标卡' })).toBeVisible();
    await expect(page.getByText('设备在线率', { exact: true })).toBeVisible();
    await expect(page.getByText('高危未处理警情', { exact: true })).toBeVisible();
    await expect(page.getByText('今日警情总数', { exact: true })).toBeVisible();
    await expect(page.getByText('较昨日增加 12%', { exact: true })).toBeVisible();
    const decision = page.getByLabel('状态组合决策示例');
    await expect(decision).toBeVisible();
    await expect(decision.locator('.lx-metric-card')).toHaveClass(/is-success/);
    await expect(decision.locator('[data-icon-name="arrow-up"]')).toBeVisible();
    await expect(page.getByTestId('host-loading')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByTestId('host-empty')).toContainText('暂无指标数据');
    await expect(page.getByTestId('host-error')).toHaveAttribute('role', 'alert');
    const retry = page.getByTestId('host-error').getByRole('button', { name: '重试' });
    await expect(retry).toBeVisible();
    await retry.click();
    await expect(page.getByTestId('host-error')).toContainText('重试请求已提交');
    await expect(page.locator('.metric-card-demo__grid .lx-metric-card__title .lx-status-dot')).toHaveCount(3);
    await expect
      .poll(() =>
        page
          .locator('.metric-card-demo__grid .lx-metric-card__visually-hidden')
          .evaluateAll((elements) => elements.map((element) => element.textContent?.trim() ?? '')),
      )
      .toEqual(['状态：成功', '状态：警告', '状态：危险', '状态：正常']);
    await expect(page.locator('.metric-card-demo__grid [data-icon-name="arrow-up"]')).toHaveCount(1);
    await expect(page.locator('.metric-card-demo__grid [data-icon-name="arrow-down"]')).toHaveCount(2);
    await expect(page.locator('.metric-card-demo__grid [data-icon-name="minus"]')).toHaveCount(1);
    await expect(page.getByText('策略同步任务', { exact: true })).toBeVisible();

    const progress = page.getByRole('progressbar', { name: '在线健康指标' });
    await expect(progress).toHaveAttribute('aria-valuenow', '99.9');
    await expect(progress).toHaveAttribute('aria-valuetext', '12,842 / 12,850 台');
    await expect(progress.locator('xpath=..')).toHaveCSS('border-top-width', '1px');
  });

  test('兼容宿主 valueType 时仍向屏幕阅读器提供状态含义', async ({ page }) => {
    await page.goto('/components/lxmetriccard');

    const legacyCard = page.locator('.metric-card-demo__legacy .lx-metric-card');
    await expect(legacyCard.locator('.lx-metric-card__visually-hidden')).toHaveText('状态：警告');
  });

  test('在 320px 和 375px 下保持卡片边界，主题和减少动效令牌生效', async ({ page }) => {
    for (const viewportWidth of [320, 375]) {
      await page.setViewportSize({ width: viewportWidth, height: 760 });
      await page.goto('/components/lxmetriccard');

      const card = page.locator('.metric-card-demo__grid .lx-metric-card').first();
      const cardBox = await card.boundingBox();
      expect(cardBox?.x).toBeGreaterThanOrEqual(0);
      expect((cardBox?.x ?? 0) + (cardBox?.width ?? 0)).toBeLessThanOrEqual(viewportWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewportWidth);

      const narrowCardGeometry = await page.locator('.metric-card-demo__grid .lx-metric-card').evaluateAll((cards) =>
        cards.map((element) => {
          const card = element.getBoundingClientRect();
          const title = element.querySelector<HTMLElement>('.lx-metric-card__title');
          const badge = element.querySelector<HTMLElement>('.lx-metric-card__badge');
          const valueRow = element.querySelector<HTMLElement>('.lx-metric-card__value-row');
          const value = element.querySelector<HTMLElement>('.lx-metric-card__value-wrap');
          if (!title || !valueRow || !value) throw new Error('窄卡结构缺失');
          const badgeBounds = badge?.getBoundingClientRect();
          const titleBounds = title.getBoundingClientRect();
          return {
            cardFits: card.width >= 0 && element.scrollWidth <= element.clientWidth,
            badgeFits: !badge || badge.scrollWidth <= badge.clientWidth,
            badgeAfterTitle: !badgeBounds || badgeBounds.top >= titleBounds.bottom - 1,
            valueFits: value.scrollWidth <= value.clientWidth,
            valueRowFits: valueRow.scrollWidth <= valueRow.clientWidth,
          };
        }),
      );
      expect(narrowCardGeometry.every((geometry) => Object.values(geometry).every(Boolean))).toBe(true);

      const lightColors = await card.evaluate((element) => {
        const title = element.querySelector('.lx-metric-card__label');
        const trend = element.querySelector('.lx-metric-card__trend');
        const value = element.querySelector('.lx-metric-card__value');
        if (!title || !trend || !value) throw new Error('指标卡缺少标题、说明或数值');
        return {
          background: getComputedStyle(element).backgroundColor,
          title: getComputedStyle(title).color,
          trend: getComputedStyle(trend).color,
          value: getComputedStyle(value).color,
        };
      });
      expect(contrastRatio(lightColors.title, lightColors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightColors.trend, lightColors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(lightColors.value, lightColors.background)).toBeGreaterThanOrEqual(3);

      const semanticTrendColors = await page.locator('.metric-card-demo__grid .lx-metric-card').evaluateAll((cards) =>
        cards.slice(0, 3).map((element) => {
          const trend = element.querySelector('.lx-metric-card__trend');
          if (!trend) throw new Error('指标卡缺少趋势说明');
          return {
            background: getComputedStyle(element).backgroundColor,
            color: getComputedStyle(trend).color,
          };
        }),
      );
      expect(new Set(semanticTrendColors.map(({ color }) => color)).size).toBe(3);
      expect(semanticTrendColors.every(({ color, background }) => contrastRatio(color, background) >= 4.5)).toBe(true);

      const warningCard = page.locator('.metric-card-demo__grid .lx-metric-card').nth(1);
      const warningColors = await warningCard.evaluate((element) => {
        const value = element.querySelector('.lx-metric-card__value');
        if (!value) throw new Error('指标卡缺少数值');
        return {
          background: getComputedStyle(element).backgroundColor,
          value: getComputedStyle(value).color,
        };
      });
      expect(contrastRatio(warningColors.value, warningColors.background)).toBeGreaterThanOrEqual(3);

      const longTitleFits = await card.evaluate((element) => {
        const title = element.querySelector('.lx-metric-card__label');
        if (!title) return false;
        const previousText = title.textContent;
        title.textContent = '连续监测接入感知终端运行状态的超长指标标题'.repeat(4);
        const fits = title.scrollWidth <= title.clientWidth;
        title.textContent = previousText;
        return fits;
      });
      expect(longTitleFits).toBe(true);

      const lightCardSurface = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
      await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
      const hudCardSurface = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(hudCardSurface).not.toBe(lightCardSurface);
      const hudTextContrast = await card.evaluate((element) => {
        const title = element.querySelector('.lx-metric-card__label');
        const trend = element.querySelector('.lx-metric-card__trend');
        if (!title || !trend) throw new Error('指标卡缺少标题或说明');
        return {
          background: getComputedStyle(element).backgroundColor,
          title: getComputedStyle(title).color,
          trend: getComputedStyle(trend).color,
        };
      });
      expect(contrastRatio(hudTextContrast.title, hudTextContrast.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hudTextContrast.trend, hudTextContrast.background)).toBeGreaterThanOrEqual(4.5);
      const hudTrendColors = await page.locator('.metric-card-demo__grid .lx-metric-card').evaluateAll((cards) =>
        cards.slice(0, 3).map((element) => {
          const trend = element.querySelector('.lx-metric-card__trend');
          if (!trend) throw new Error('指标卡缺少趋势说明');
          return {
            background: getComputedStyle(element).backgroundColor,
            color: getComputedStyle(trend).color,
          };
        }),
      );
      expect(hudTrendColors.every(({ color, background }) => contrastRatio(color, background) >= 4.5)).toBe(true);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const transition = await card
        .locator('.lx-metric-card__progress-value')
        .evaluate((element) => getComputedStyle(element).transitionDuration);
      const transitionProperty = await card
        .locator('.lx-metric-card__progress-value')
        .evaluate((element) => getComputedStyle(element).transitionProperty);
      const iconTransition = await card
        .locator('.lx-metric-card__trend [data-icon-name]')
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration);
      expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.001);
      expect(transitionProperty).toBe('transform');
      expect(Number.parseFloat(iconTransition)).toBe(0);

      await page.locator('html').evaluate((element) => {
        element.setAttribute('dir', 'rtl');
      });
      await expect
        .poll(() =>
          card.locator('.lx-metric-card__progress-value').evaluate((element) => {
            const styles = getComputedStyle(element);
            const [originX] = styles.transformOrigin.split(' ');
            return Math.abs(Number.parseFloat(originX) - element.getBoundingClientRect().width) <= 1;
          }),
        )
        .toBe(true);
      await page.locator('html').evaluate((element) => {
        element.removeAttribute('dir');
      });
      await page.screenshot({ path: `test-results/lx-metric-card-${viewportWidth}.png` });
    }
  });
});
