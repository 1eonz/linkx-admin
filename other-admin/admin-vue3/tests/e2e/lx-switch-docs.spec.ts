import { expect, test } from '@playwright/test';

test.describe('LxSwitch 文档示例', () => {
  test('开关名称、禁用状态和键盘焦点可访问', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxswitch');

    const labelledInput = page.locator('.lx-switch.el-switch input.el-switch__input').first();
    await expect(labelledInput).toHaveAttribute('aria-labelledby', 'ai-intercept-label');

    const namedSwitches = [
      '卡口车辆实时 AI 研判拦截',
      '夜间低敏静默布防模式',
      '省厅直辖联防调度镜像（锁定）',
      '勤务值守模式',
      'HUD 战术图层',
      '省厅镜像同步',
      '自定义值开关',
      '外置状态文案开关',
    ];

    for (const name of namedSwitches) {
      await expect(page.getByRole('switch', { name, exact: true })).toHaveCount(1);
    }

    const locked = page.getByRole('switch', { name: '省厅直辖联防调度镜像（锁定）' });
    await expect(locked).toBeDisabled();
    await expect(locked).toHaveAttribute('aria-describedby', 'upper-lock-reason');
    await expect(locked).toHaveAccessibleDescription('受上级指令系统锁定，本级不可改动');

    const first = page.getByRole('switch', { name: '卡口车辆实时 AI 研判拦截' });
    const firstRoot = page.locator('.lx-switch.el-switch').filter({ has: first });
    const firstCore = firstRoot.locator('.el-switch__core');
    await first.focus();
    await expect.poll(() => first.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expect.poll(() => firstCore.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');

    await page.keyboard.press('Space');
    await expect(first).toHaveAttribute('aria-checked', 'false');
    await expect(firstRoot).not.toHaveClass(/is-checked/);
    await expect(firstRoot.locator('input.el-switch__input')).not.toBeChecked();
    await expect(page.locator('.lx-switch-demo__status')).toContainText('AI 研判拦截 已关闭');
  });

  test('桌面 Props 类型与默认值列对齐，便于横向比较', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/components/lxswitch');

    const propsList = page.locator('.vp-doc .lx-switch-props');
    const columns = await propsList.locator('.lx-switch-props__meta').evaluateAll((items) => {
      const rows = items.map((item) => {
        const spans = Array.from(item.querySelectorAll('span'));
        return {
          display: getComputedStyle(item).display,
          columns: getComputedStyle(item).gridTemplateColumns,
          positions: spans.map((span) => Math.round(span.getBoundingClientRect().left)),
        };
      });

      return {
        rows,
        firstColumnPositions: [...new Set(rows.map((row) => row.positions[0]))],
        secondColumnPositions: [...new Set(rows.map((row) => row.positions[1]))],
      };
    });

    expect(columns.rows).toHaveLength(7);
    expect(columns.rows.every((row) => row.display === 'grid')).toBe(true);
    expect(columns.firstColumnPositions).toHaveLength(1);
    expect(columns.secondColumnPositions).toHaveLength(1);
  });

  test('下发失败保留原值，再次操作成功后同步值和播报', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxswitch');

    const syncSwitch = page.getByRole('switch', { name: '省厅镜像同步' });
    const status = page.locator('.lx-switch-demo__status');
    const error = page.getByRole('alert');
    const syncControl = page.locator('.lx-switch.el-switch').filter({ has: syncSwitch });

    await syncControl.click();
    await expect(syncSwitch).toBeDisabled();
    await expect(status).toContainText('镜像同步下发中');
    await expect(error).toContainText('开关保持关闭');
    await expect(syncSwitch).not.toBeChecked();
    await expect(syncSwitch).toBeEnabled();

    await syncControl.click();
    await expect(syncSwitch).toBeDisabled();
    await expect(syncSwitch).toBeChecked({ timeout: 3000 });
    await expect(syncSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(syncControl.locator('input.el-switch__input')).toBeChecked();
    await expect(status).toContainText('省厅镜像同步 已开启');
    await expect(error).toHaveCount(0);
  });

  test('自定义值 off 播报为关闭，切换到 on 后播报开启', async ({ page }) => {
    await page.goto('/components/lxswitch');

    const customSwitch = page.getByRole('switch', { name: '自定义值开关' });
    const customControl = page.locator('.lx-switch.el-switch').filter({ has: customSwitch });
    const status = page.locator('.lx-switch-demo__status');

    await expect(customSwitch).toHaveAttribute('aria-checked', 'false');
    await customControl.click();
    await expect(customSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(status).toContainText('自定义值开关 已开启');

    await customControl.click();
    await expect(customSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(status).toContainText('自定义值开关 已关闭');
  });

  test('375px 触屏、HUD 深色和减少动效保持可用', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:4176',
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      const externalRequests: string[] = [];
      const localOrigin = new URL('http://127.0.0.1:4176').origin;
      await context.route('**/*', async (route) => {
        const requestUrl = new URL(route.request().url());
        if (
          (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') &&
          requestUrl.origin !== localOrigin
        ) {
          externalRequests.push(requestUrl.href);
          await route.abort();
          return;
        }
        await route.continue();
      });

      await page.goto('/components/lxswitch');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);

      const controls = page.locator('.lx-switch.el-switch');
      await expect(controls).toHaveCount(8);
      for (const control of await controls.all()) {
        await expect
          .poll(async () => {
            const bounds = await control.boundingBox();
            return bounds ? Math.min(bounds.width, bounds.height) : 0;
          })
          .toBeGreaterThanOrEqual(44);
      }
      await expect
        .poll(() =>
          page.locator('.lx-switch-demo__toolbar label').evaluate((label) => label.getBoundingClientRect().height),
        )
        .toBeGreaterThanOrEqual(44);

      const textMode = page.getByTestId('text-mode').locator('.lx-switch-demo__pair--text-mode');
      await expect(textMode.locator('.el-switch__label').first()).toHaveCSS('white-space', 'nowrap');
      await expect(textMode.locator('.el-switch__label').first()).toHaveCSS('flex-shrink', '0');
      await expect(textMode.locator('.lx-switch-demo__desc')).toHaveCSS('grid-column-start', '1');
      const textModeBounds = await textMode.evaluate((row) => {
        const panel = row.closest<HTMLElement>('.lx-switch-demo__panel');
        if (!panel) return null;

        const panelBounds = panel.getBoundingClientRect();
        const panelStyle = getComputedStyle(panel);
        const contentLeft = panelBounds.left + Number.parseFloat(panelStyle.paddingLeft);
        const contentRight = panelBounds.right - Number.parseFloat(panelStyle.paddingRight);
        const withinPanel = (element: Element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= contentLeft - 1 && bounds.right <= contentRight + 1;
        };
        const labels = Array.from(row.querySelectorAll('.el-switch__label')).filter(
          (label) => label.getClientRects().length > 0,
        );
        const description = row.querySelector('.lx-switch-demo__desc');

        return {
          rowFits: row.scrollWidth <= row.clientWidth,
          labelsFit: labels.length > 0 && labels.every(withinPanel),
          descriptionFits: description !== null && withinPanel(description),
        };
      });
      expect(textModeBounds).toEqual({ rowFits: true, labelsFit: true, descriptionFits: true });
      const closedState = page.getByTestId('states').locator('.lx-switch-demo__state');
      await expect(closedState).toHaveText('关闭');
      await expect(closedState).toHaveCSS('white-space', 'nowrap');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
      const interactionHeading = await page.getByRole('heading', { name: '交互示例' }).boundingBox();
      expect(interactionHeading?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(812);

      const firstExample = page.getByTestId('standard-state').locator('.lx-switch-demo__item').first();
      await expect
        .poll(() => firstExample.evaluate((element) => Math.round(element.getBoundingClientRect().top)))
        .toBeLessThan(640);

      const propsList = page.locator('.vp-doc .lx-switch-props');
      await expect(propsList.locator('.lx-switch-props__item')).toHaveCount(7);
      await expect(propsList.getByText('modelValue', { exact: true })).toBeVisible();
      await expect(propsList.getByText('禁用态：胶囊半透明并禁用手势', { exact: false })).toBeVisible();
      const metadataColumns = await propsList.locator('.lx-switch-props__meta').evaluateAll((items) => {
        const rows = items.map((item) => {
          const spans = Array.from(item.querySelectorAll('span'));
          return {
            display: getComputedStyle(item).display,
            positions: spans.map((span) => Math.round(span.getBoundingClientRect().left)),
          };
        });

        return {
          rows,
          firstColumnPositions: [...new Set(rows.map((row) => row.positions[0]))],
          secondColumnPositions: [...new Set(rows.map((row) => row.positions[1]))],
        };
      });
      expect(metadataColumns.rows).toHaveLength(7);
      expect(metadataColumns.rows.every((row) => row.display === 'grid')).toBe(true);
      expect(metadataColumns.rows.every((row) => row.positions.length === 2)).toBe(true);
      expect(metadataColumns.firstColumnPositions).toHaveLength(1);
      expect(metadataColumns.secondColumnPositions).toHaveLength(1);
      const propsLayout = await propsList.evaluate((list) => {
        const bounds = list.getBoundingClientRect();
        const rows = Array.from(list.querySelectorAll<HTMLElement>('.lx-switch-props__item'));
        return {
          hasHorizontalOverflow: list.scrollWidth > list.clientWidth,
          rowsFit: rows.every((row) => row.scrollWidth <= row.clientWidth),
          insideViewport: bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth,
        };
      });
      expect(propsLayout).toEqual({ hasHorizontalOverflow: false, rowsFit: true, insideViewport: true });

      await page.getByRole('checkbox', { name: 'HUD 深色主题（全页预览）' }).check();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);

      const lockedDescription = page
        .getByTestId('standard-state')
        .getByText('受上级指令系统锁定，本级不可改动', { exact: true });
      const lockedRow = page
        .getByTestId('standard-state')
        .locator('.lx-switch-demo__item')
        .filter({ hasText: '省厅直辖联防调度镜像' });
      await expect(lockedRow).toHaveCSS('opacity', '1');
      await expect(lockedDescription).toHaveCSS('font-size', '12px');
      await expect(lockedDescription).toHaveCSS('color', 'rgb(148, 163, 184)');
      const hintColors = await page
        .locator('.lx-switch-demo__hint')
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color));
      expect(hintColors).toEqual(['rgb(148, 163, 184)', 'rgb(148, 163, 184)']);
      await expect(page.locator('.lx-switch-demo__note')).toHaveCSS('color', 'rgb(148, 163, 184)');
      await expect(
        page.getByRole('heading', {
          name: '开关外状态文字（标本 07 主形态）',
          level: 3,
        }),
      ).toHaveCount(1);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const duration = await page
        .locator('.lx-switch .el-switch__core')
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration);
      const longestTransition = Math.max(
        ...duration.split(',').map((part) => {
          const value = Number.parseFloat(part.trim());
          return part.trim().endsWith('ms') ? value / 1000 : value;
        }),
      );
      expect(longestTransition).toBeLessThanOrEqual(0.001);
      expect(externalRequests).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test('HUD 预览保留基础主题并在关闭后恢复', async ({ page }) => {
    await page.goto('/components/lxswitch');

    const html = page.locator('html');
    const initialDark = await html.evaluate((element) => element.classList.contains('dark'));
    const initialHud = await html.evaluate((element) => element.classList.contains('lx-theme-hud'));
    const hudPreview = page.getByRole('checkbox', { name: 'HUD 深色主题（全页预览）' });
    const siteAppearance = page.getByRole('switch', { name: /Switch to (dark|light) theme/ });

    await hudPreview.check();
    await siteAppearance.click();
    await siteAppearance.click();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveClass(/lx-theme-hud/);

    await hudPreview.uncheck();
    await expect.poll(() => html.evaluate((element) => element.classList.contains('dark'))).toBe(initialDark);
    await expect.poll(() => html.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(initialHud);

    await hudPreview.check();
    await page.getByRole('link', { name: /Next page LxSelect 下拉选择/ }).click();
    await expect(page).toHaveURL(/\/components\/lxselect(?:\.html)?$/);
    await expect.poll(() => html.evaluate((element) => element.classList.contains('dark'))).toBe(initialDark);
    await expect.poll(() => html.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(initialHud);
  });
});
