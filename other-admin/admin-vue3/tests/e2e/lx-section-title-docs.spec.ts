import { expect, test } from '@playwright/test';

test.describe('LxSectionTitle 文档示例', () => {
  test('桌面局部窄容器完整分行，长标题保留操作宽度且空标题不产生无名标题', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/lxsectiontitle');
    const longCase = page.getByTestId('long-title-case');
    const root = longCase.locator('.lx-section-title');
    for (const hud of [false, true]) {
      await page.getByRole('checkbox', { name: 'HUD 深色主题' }).setChecked(hud);
      const layout = await root.evaluate((element) => {
        const heading = element.querySelector('.lx-section-title__heading');
        const extra = element.querySelector('.lx-section-title__extra');
        if (!heading || !extra) throw new Error('标题布局结构缺失');
        return {
          width: element.getBoundingClientRect().width,
          below: extra.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom,
          headingWidth: heading.getBoundingClientRect().width,
        };
      });
      expect(layout.width).toBeLessThanOrEqual(400);
      expect(layout.below).toBe(true);
      expect(layout.headingWidth).toBeCloseTo(layout.width, 0);
      await root.screenshot({ path: `test-results/lx-section-title-container-${hud ? 'hud' : 'light'}.png` });
    }

    const buttonLayout = await page.getByTestId('variant-border').evaluate((element) => {
      const label = element.querySelector<HTMLElement>('.lx-section-title__label');
      const button = element.querySelector('button');
      if (!label || !button) throw new Error('长标题测试结构缺失');
      label.textContent = '辖区协同指挥中心公共安全设备与网络凭证综合配置以及跨区资源协作联动处置记录'.repeat(3);
      const lineHeight = Number.parseFloat(getComputedStyle(button).lineHeight);
      const range = document.createRange();
      range.selectNodeContents(button);
      return {
        textHeight: range.getBoundingClientRect().height,
        lineHeight,
        buttonWidth: button.getBoundingClientRect().width,
        truncated: label.scrollWidth > label.clientWidth,
      };
    });
    expect(buttonLayout.truncated).toBe(true);
    expect(buttonLayout.textHeight).toBeLessThanOrEqual(buttonLayout.lineHeight);
    expect(buttonLayout.buttonWidth).toBeGreaterThanOrEqual(44);

    const manyActions = await page.getByTestId('variant-dashed').evaluate((element) => {
      const source = element.querySelector<HTMLElement>('.lx-section-title');
      if (!source) throw new Error('找不到多操作测试源');
      const target = source.cloneNode(true) as HTMLElement;
      target.style.width = '420px';
      const extra = target.querySelector<HTMLElement>('.lx-section-title__extra');
      if (!extra) throw new Error('操作区缺失');
      for (let index = 0; index < 8; index += 1) {
        const button = document.createElement('button');
        button.textContent = '查看完整操作记录';
        button.style.whiteSpace = 'nowrap';
        extra.append(button);
      }
      document.body.append(target);
      const heading = target.querySelector('.lx-section-title__heading');
      if (!heading) throw new Error('标题区缺失');
      const bounds = target.getBoundingClientRect();
      const result = {
        below: extra.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom,
        right: extra.getBoundingClientRect().right <= bounds.right + 0.5,
        overflow: target.scrollWidth > target.clientWidth,
      };
      target.remove();
      return result;
    });
    expect(manyActions).toEqual({ below: true, right: true, overflow: false });

    await page.getByRole('checkbox', { name: '显示长标题' }).uncheck();
    await expect(longCase.getByRole('heading')).toHaveCount(0);
    await expect(longCase.getByRole('button', { name: '查看', exact: true })).toBeVisible();
    await expect(longCase.locator('.lx-tag')).toHaveText('配置中');
    await page.getByRole('checkbox', { name: '显示长标题' }).check();
    await expect(longCase.getByRole('heading', { level: 4 })).toBeVisible();
  });

  test('呈现设计变体、字号、标签语义和 extra 键盘操作', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxsectiontitle');

    await expect(page.getByRole('heading', { name: 'LxSectionTitle 区块标题' })).toBeVisible();
    for (const variant of ['border', 'dashed', 'plain']) {
      await expect(page.getByTestId(`variant-${variant}`).locator('.lx-section-title')).toHaveClass(
        new RegExp(`lx-section-title--${variant}`),
      );
    }

    const sizeSelector = page.getByLabel('标题尺寸');
    await expect(page.getByTestId('long-title-case').locator('.lx-section-title__label')).toHaveAttribute(
      'title',
      '辖区协同指挥中心公共安全设备与网络凭证综合配置',
    );
    await expect(page.getByTestId('variant-dashed').getByRole('img', { name: '接口设置' })).toBeVisible();
    await expect(page.getByTestId('variant-dashed').getByRole('img', { name: '接口设置' })).not.toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(page.getByTestId('variant-border').locator('[data-icon-name="folder"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await sizeSelector.selectOption('small');
    await expect(page.getByTestId('variant-border').locator('.lx-section-title')).toHaveClass(
      /lx-section-title--small/,
    );
    await expect
      .poll(() =>
        page
          .getByTestId('variant-border')
          .locator('.lx-section-title__text')
          .evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe('12px');

    await sizeSelector.selectOption('large');
    await expect
      .poll(() =>
        page
          .getByTestId('variant-border')
          .locator('.lx-section-title__text')
          .evaluate((element) => getComputedStyle(element).fontSize),
      )
      .toBe('18px');
    await expect(page.locator('.lx-section-title-demo .lx-tag')).toHaveCount(4);

    const primaryTag = page.getByTestId('variant-border').locator('.lx-tag--primary');
    await expect(primaryTag).toHaveText('8 项字段');
    await expect(primaryTag).toHaveAttribute('aria-label', '标题标记：8 项字段');
    const tagPadding = await primaryTag.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        blockStart: style.paddingBlockStart,
        blockEnd: style.paddingBlockEnd,
        inlineStart: style.paddingInlineStart,
        inlineEnd: style.paddingInlineEnd,
      };
    });
    expect(tagPadding).toEqual({
      blockStart: '2px',
      blockEnd: '2px',
      inlineStart: '6px',
      inlineEnd: '6px',
    });
    await expect(page.getByTestId('variant-dashed').locator('.lx-tag--success')).toBeVisible();
    await expect(
      page.getByTestId('variant-border').locator('.lx-section-title__leading [data-icon-name="folder"]'),
    ).toBeVisible();
    await expect(
      page.getByTestId('variant-dashed').locator('.lx-section-title__leading [data-icon-name="setting"]'),
    ).toBeVisible();
    await expect(
      page.getByTestId('variant-dashed').locator('.lx-section-title__leading [data-icon-name="link"]'),
    ).toHaveCount(0);
    await expect(page.getByTestId('variant-plain').locator('.lx-tag--warning')).toBeVisible();
    await expect(page.getByTestId('variant-plain').locator('.lx-section-title__subtitle')).toHaveText(
      '用于配置警情处置流程与责任人分派机制。',
    );
    await expect(page.getByTestId('long-title-case').locator('h4.lx-section-title__text')).toBeVisible();

    const refresh = page.getByRole('button', { name: '刷新' });
    await refresh.focus();
    await expect(refresh).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('刷新接口配置', { exact: true })).toBeVisible();

    const logs = page.getByRole('button', { name: '查看日志' });
    await logs.focus();
    await expect(logs).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('查看接口调用日志', { exact: true })).toBeVisible();

    await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check();
    await expect(page.locator('.lx-section-title-demo')).toHaveClass(/lx-theme-hud/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/lx-theme-hud/);
    const hudSurface = await page.getByTestId('variant-border').evaluate((element) => {
      const title = element.querySelector<HTMLElement>('.lx-section-title__text');
      const root = element.querySelector<HTMLElement>('.lx-section-title');
      if (!title || !root) throw new Error('标题 HUD 结构缺失');
      return {
        title: getComputedStyle(title).color,
        surface: getComputedStyle(root).color,
      };
    });
    expect(hudSurface.title).not.toBe('');
    expect(hudSurface.surface).not.toBe('');

    const viewButton = page.getByTestId('long-title-case').getByRole('button', { name: '查看', exact: true });
    await viewButton.focus();
    await expect(viewButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('查看辖区协同指挥中心配置详情', { exact: true })).toBeVisible();

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 780 });
      const longTitle = page.getByTestId('long-title-case').locator('.lx-section-title');
      const titleLabel = longTitle.locator('.lx-section-title__label');
      await expect(longTitle).toBeVisible();
      await expect
        .poll(() =>
          titleLabel.evaluate((element) => ({
            whiteSpace: getComputedStyle(element).whiteSpace,
            textOverflow: getComputedStyle(element).textOverflow,
            overflowWrap: getComputedStyle(element).overflowWrap,
          })),
        )
        .toEqual({ whiteSpace: 'normal', textOverflow: 'clip', overflowWrap: 'anywhere' });
      const titleGeometry = await titleLabel.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        height: element.getBoundingClientRect().height,
      }));
      expect(titleGeometry.scrollWidth).toBeLessThanOrEqual(titleGeometry.clientWidth);
      expect(titleGeometry.height).toBeGreaterThan(24);
      const layout = await longTitle.evaluate((element) => {
        const heading = element.querySelector<HTMLElement>('.lx-section-title__heading');
        const extra = element.querySelector<HTMLElement>('.lx-section-title__extra');
        if (!heading || !extra) throw new Error('标题或操作区缺失');
        const root = element.getBoundingClientRect();
        const headingBox = heading.getBoundingClientRect();
        const extraBox = extra.getBoundingClientRect();
        return {
          extraBelowHeading: extraBox.top >= headingBox.bottom,
          extraRight: extraBox.right <= root.right,
          extraHeight: extraBox.height,
        };
      });
      expect(layout.extraBelowHeading).toBe(true);
      expect(layout.extraRight).toBe(true);
      expect(layout.extraHeight).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `test-results/lx-section-title-${width}.png` });
    }

    await page.setViewportSize({ width: 1280, height: 780 });
    const nestedLayout = await page.evaluate(() => {
      const target = document.querySelector<HTMLElement>('[data-testid="long-title-case"]');
      if (!target) throw new Error('找不到区块标题窄容器');
      const host = document.createElement('div');
      host.style.width = '360px';
      host.style.containerType = 'inline-size';
      host.style.padding = '0';
      host.append(target.cloneNode(true));
      document.body.append(host);
      const title = host.querySelector<HTMLElement>('.lx-section-title');
      const heading = host.querySelector<HTMLElement>('.lx-section-title__heading');
      const extra = host.querySelector<HTMLElement>('.lx-section-title__extra');
      if (!title || !heading || !extra) throw new Error('窄容器标题结构缺失');
      const result = {
        extraBelowHeading: extra.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom,
        extraRight: extra.getBoundingClientRect().right <= title.getBoundingClientRect().right,
      };
      host.remove();
      return result;
    });
    expect(nestedLayout).toEqual({ extraBelowHeading: true, extraRight: true });

    const mediumHostLayout = await page.evaluate(() => {
      const source = document.querySelector<HTMLElement>('[data-testid="variant-dashed"] .lx-section-title');
      if (!source) throw new Error('找不到中等宽度区块标题');
      const host = document.createElement('div');
      host.style.width = '420px';
      host.style.containerType = 'inline-size';
      host.append(source.cloneNode(true));
      document.body.append(host);
      const title = host.querySelector<HTMLElement>('.lx-section-title');
      const heading = host.querySelector<HTMLElement>('.lx-section-title__heading');
      const extra = host.querySelector<HTMLElement>('.lx-section-title__extra');
      if (!title || !heading || !extra) throw new Error('中等宽度标题结构缺失');
      const result = {
        extraRight: extra.getBoundingClientRect().right <= title.getBoundingClientRect().right,
        documentWidth: document.documentElement.scrollWidth,
      };
      host.remove();
      return result;
    });
    expect(mediumHostLayout.extraRight).toBe(true);
    expect(mediumHostLayout.documentWidth).toBeLessThanOrEqual(1280);
  });
});
