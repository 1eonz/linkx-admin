import { expect, test, type Locator, type Page } from '@playwright/test';

import { mockBackend } from './fixtures';

async function mockDocsRequests(page: Page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    const isLocalHost = ['127.0.0.1', 'localhost'].includes(url.hostname);
    if (!isLocalHost || url.pathname.startsWith('/linkx/')) return route.abort();
    return route.continue();
  });
  await mockBackend(page);
}

test.beforeEach(async ({ page }) => {
  await mockDocsRequests(page);
});

async function openAdvancedExamples(page: Page) {
  const details = page.getByTestId('advanced-examples');
  const isOpen = await details.evaluate((element) => element instanceof HTMLDetailsElement && element.open);
  if (!isOpen) await details.locator(':scope > summary').click();
}

async function getNavigationBottom(page: Page) {
  return page.evaluate(() =>
    Math.max(
      ...['.VPNav', '.VPLocalNav'].map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return 0;

        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return 0;
        return element.getBoundingClientRect().bottom;
      }),
    ),
  );
}

async function resetPageAtTop(page: Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url);
    window.scrollTo(0, 0);
  });
}

async function getContrastRatio(locator: Locator) {
  return locator.evaluate((element) => {
    const channels = (color: string): number[] => {
      const values = color.match(/[\d.]+/g)?.map(Number);
      if (!values || values.length < 3) throw new Error(`无法解析颜色：${color}`);
      const scale = color.startsWith('color(srgb ') ? 255 : 1;
      if (!color.startsWith('rgb') && scale === 1) throw new Error(`不支持的颜色空间：${color}`);
      return [...values.slice(0, 3).map((channel) => channel * scale), values[3] ?? 1];
    };
    const blend = (front: number[], back: number[]) =>
      front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
    const surface = element.closest('.lx-button-demo__panel');
    if (!surface) throw new Error('按钮缺少展示表面');
    const style = getComputedStyle(element);
    const background = blend(channels(style.backgroundColor), channels(getComputedStyle(surface).backgroundColor));
    const luminance = (rgb: number[]) => {
      const linear = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const foreground = luminance(blend(channels(style.color), background));
    const backdrop = luminance(background);
    return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
  });
}

test.describe('lx-ui 基础按钮设计回归', () => {
  test('前后置与纯图标在明暗主题和窄屏下兑现图标尺寸档位', async ({ page }) => {
    await page.goto('/components/lxbutton');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const theme = page.getByLabel('组件示例深色预览（HUD）', { exact: true });
    const buttons = [
      { button: demo.getByRole('button', { name: '新增警务服务', exact: true }), iconOnly: false },
      { button: demo.getByRole('button', { name: '下一步', exact: true }), iconOnly: false },
      { button: demo.getByRole('button', { name: '刷新数据', exact: true }), iconOnly: true },
      { button: demo.getByRole('button', { name: '文字刷新', exact: true }), iconOnly: true },
    ];
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const hud of [false, true]) {
        await theme.setChecked(hud);
        for (const [size, pixels] of [
          ['sm', 13],
          ['md', 14],
          ['lg', 16],
        ] as const) {
          await page.getByLabel('按钮尺寸档').selectOption(size);
          await page.mouse.move(0, 0);
          for (const { button, iconOnly } of buttons) {
            const icon = button.locator('.lx-icon');
            await expect(icon).toHaveCount(1);
            await expect(icon).toHaveCSS('width', `${pixels}px`);
            await expect(icon).toHaveCSS('height', `${pixels}px`);
            if (iconOnly) {
              await expect(button).toHaveClass(/lx-btn--icon-only/);
              const buttonBounds = await button.boundingBox();
              const iconBounds = await icon.boundingBox();
              if (!buttonBounds || !iconBounds) throw new Error('纯图标按钮缺少可见边界');
              expect(
                Math.abs(iconBounds.x + iconBounds.width / 2 - buttonBounds.x - buttonBounds.width / 2),
              ).toBeLessThanOrEqual(0.5);
              expect(
                Math.abs(iconBounds.y + iconBounds.height / 2 - buttonBounds.y - buttonBounds.height / 2),
              ).toBeLessThanOrEqual(0.5);
            }
          }
        }
      }
    }
  });

  test('父表单禁用继承与动态文字切换保持点击和提示契约', async ({ page }) => {
    await page.goto('/components/lxbutton');
    const demo = page.getByRole('region', { name: '按钮表单禁用与动态文字示例' });
    const button = demo.getByRole('button', { name: '刷新表单' });
    const tooltip = page.getByRole('tooltip').filter({ hasText: '刷新表单' });
    await expect(button).toHaveClass(/lx-btn--icon-only/);
    await button.hover();
    await expect(tooltip).toBeVisible();
    await demo.getByLabel('显示按钮文字').check();
    await expect(tooltip).toHaveCount(0);
    await expect(button).toHaveText('刷新表单');
    await expect(button).not.toHaveClass(/lx-btn--icon-only/);
    await button.click();
    await expect(demo.getByRole('status')).toHaveText('已刷新 1 次');
    await demo.getByLabel('显示按钮文字').uncheck();
    await expect(button).toHaveClass(/lx-btn--icon-only/);
    await button.hover();
    await expect(tooltip).toBeVisible();
    await demo.getByLabel('禁用整个表单').check();
    await expect(button).toBeDisabled();
    await expect(tooltip).toHaveCount(0);
    await button.dispatchEvent('click');
    await expect(demo.getByRole('status')).toHaveText('已刷新 1 次');
    await button.hover({ force: true });
    await page.waitForTimeout(250);
    await expect(tooltip).toHaveCount(0);
    await demo.getByLabel('禁用整个表单').uncheck();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(demo.getByRole('status')).toHaveText('已刷新 2 次');
  });

  test('文档页初始化不产生 hydration mismatch', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Hydration completed')) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto('/components/lxbutton.html');
    await page.waitForLoadState('networkidle');
    expect(hydrationErrors).toEqual([]);
    const favicon = await page.request.get(new URL('/favicon.ico', page.url()).toString());
    expect(favicon.status()).toBe(200);

    const content = page.locator('.vp-doc');
    expect((await content.locator('h2').allTextContents()).map((text) => text.replace(/\u200b/g, '').trim())).toEqual([
      '快速使用',
      '完整交互演示',
      '状态与操作',
      'API',
      '宿主接入',
    ]);
    await expect(content).not.toContainText('拍板 #11');
  });

  test('首屏提供快速按钮与完整演示入口并说明选型边界', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/components/lxbutton.html');
    const content = page.locator('.vp-doc');

    await expect(content.getByRole('heading', { name: '使用摘要' })).toBeVisible();
    await expect(content).toContainText('同一屏最多保留一个主操作按钮');
    await expect(content).toContainText('成功绿色仅用于“启用”类状态切换动作');
    await expect(content).toContainText('推荐组合只保留一个可操作的 primary');
    const quickExample = content.getByTestId('lx-button-quick-example');
    await expect(quickExample.getByRole('button')).toHaveCount(3);
    await expect(quickExample.getByRole('button', { name: '主操作' })).toBeVisible();
    const demoJump = content.getByRole('link', { name: '跳转到完整交互演示' });
    await expect(demoJump).toHaveAttribute('href', '#lx-button-demo-anchor');
    const quickExampleBounds = await quickExample.boundingBox();
    if (!quickExampleBounds) throw new Error('首屏按钮示例没有可见边界');
    expect(quickExampleBounds.y + quickExampleBounds.height).toBeLessThanOrEqual(720);
    const demoJumpBounds = await demoJump.boundingBox();
    if (!demoJumpBounds) throw new Error('完整演示入口没有可见边界');
    expect(demoJumpBounds.y + demoJumpBounds.height).toBeLessThanOrEqual(720);

    const fullDemo = page.getByRole('region', { name: '完整交互演示' });
    const demoHeading = page.getByRole('heading', { name: '完整交互演示', exact: true });
    await demoJump.focus();
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (event) => {
          const source = event.target;
          if (event.ctrlKey && source instanceof Element && source.closest('a[href="#lx-button-demo-anchor"]')) {
            // 仅拦截浏览器新开标签的默认动作，保留真实 Ctrl+点击事件供页面逻辑处理。
            event.preventDefault();
          }
        },
        { capture: true, once: true },
      );
    });
    const originalPageState = await page.evaluate(() => ({
      hash: window.location.hash,
      scrollY: window.scrollY,
    }));
    await expect(demoJump).toBeFocused();

    await demoJump.click({ modifiers: ['Control'] });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    expect(await page.evaluate(() => window.location.hash)).toBe(originalPageState.hash);
    expect(await page.evaluate(() => window.scrollY)).toBe(originalPageState.scrollY);
    await expect(demoJump).toBeFocused();
    await expect(demoHeading).not.toBeFocused();

    const behaviorList = content.getByRole('heading', { name: '示例说明' }).locator('xpath=following-sibling::ul[1]');
    const behaviorItems = behaviorList.getByRole('listitem');
    await expect(behaviorItems).toHaveCount(3);
    await expect(behaviorItems.nth(0)).toContainText('本地交互：');
    await expect(behaviorItems.nth(1)).toContainText('外观展示：');
    await expect(behaviorItems.nth(2)).toContainText('示例只更新本地状态，不请求后端');
    await expect(behaviorItems.nth(0)).toBeVisible();
    await expect(behaviorItems.nth(1)).toBeVisible();
    await expect(behaviorItems.nth(2)).toBeVisible();
    await expect(content.getByRole('heading', { name: '宿主请求与失败反馈' })).toBeVisible();
    const integrationLink = content.getByRole('link', { name: '查看完整按钮宿主集成示例' });
    await expect(integrationLink).toHaveAttribute('href', '/components/lxbutton-integration.html');
    await expect(content).not.toContainText('saveRequest: () => Promise<void>');
    await integrationLink.evaluate((anchor) => anchor.setAttribute('target', '_blank'));
    const [integrationPage] = await Promise.all([page.waitForEvent('popup'), integrationLink.click()]);
    await expect(integrationPage.getByRole('heading', { name: '普通提交与错误恢复' })).toBeVisible();
    const hostExample = integrationPage.locator('pre').filter({ hasText: 'saveRequest: () => Promise<void>' });
    await expect(hostExample).toContainText('Promise.resolve()');
    await expect(hostExample).toContainText('.then(');
    await expect(hostExample).toContainText('.catch(');
    await expect(hostExample).toContainText('.finally(');
    await expect(integrationPage.getByRole('heading', { name: '高危操作确认与恢复' })).toBeVisible();
    const deleteExample = integrationPage.locator('pre').filter({ hasText: 'confirmDelete' });
    await expect(deleteExample).toContainText('deleteRequest');
    await expect(deleteExample).toContainText('Promise.resolve()');
    await expect(deleteExample).toContainText('() => props.confirmDelete()');
    await expect(deleteExample).toContainText('.catch(');
    await expect(integrationPage.locator('.vp-doc')).toContainText('只有请求成功后才从宿主数据中移除记录');
    await integrationPage.close();

    const advancedSummary = page.locator('.lx-button-demo__advanced > summary');
    await expect(advancedSummary).toHaveCSS('display', 'list-item');

    await page.setViewportSize({ width: 320, height: 812 });
    await expect(quickExample).toBeVisible();
    await expect(page.locator('.lx-button-demo__scope')).toHaveCount(0);
    const narrowToolbarHeight = await page
      .locator('.lx-button-demo__toolbar')
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(narrowToolbarHeight).toBeLessThanOrEqual(100);
    const narrowQuickExampleBounds = await quickExample.boundingBox();
    const narrowDemoJumpBounds = await demoJump.boundingBox();
    if (!narrowQuickExampleBounds || !narrowDemoJumpBounds) {
      throw new Error('窄屏快速示例或完整演示入口没有可见边界');
    }
    expect(narrowQuickExampleBounds.y + narrowQuickExampleBounds.height).toBeLessThanOrEqual(812);
    expect(narrowDemoJumpBounds.y + narrowDemoJumpBounds.height).toBeLessThanOrEqual(812);
    await expect(page.getByTestId('advanced-examples')).not.toHaveAttribute('open', '');
    await expect(page.getByTestId('icons')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await demoJump.focus();
    await page.keyboard.press('Enter');
    await expect(demoHeading).toBeFocused();
    await expect(demoHeading).toHaveCSS('outline-style', 'solid');
    await expect(demoHeading).toHaveCSS('outline-width', '2px');
    await expect(fullDemo.locator('.lx-button-demo')).toBeVisible();
    const demoBounds = await demoHeading.boundingBox();
    const regionBounds = await fullDemo.boundingBox();
    const mobileNavigationBottom = await getNavigationBottom(page);
    expect(demoBounds?.y).toBeGreaterThanOrEqual(mobileNavigationBottom + 8);
    expect(demoBounds?.y).toBeLessThanOrEqual(mobileNavigationBottom + 32);
    expect(demoBounds?.height).toBeLessThanOrEqual(40);
    expect(demoBounds?.width).toBeLessThan((regionBounds?.width ?? 0) / 2);

    await openAdvancedExamples(page);
    const sectionNav = fullDemo.getByRole('navigation', { name: '更多按钮示例目录' });
    await expect(sectionNav.getByRole('link')).toHaveCount(4);
    for (const [label, targetId] of [
      ['图标与块级', 'lx-button-demo-icons'],
      ['纯图标操作', 'lx-button-demo-icon-actions'],
      ['权限反馈', 'lx-button-demo-permission-actions'],
      ['行内操作', 'lx-button-demo-row-actions'],
    ]) {
      const link = sectionNav.getByRole('link', { name: label });
      const target = fullDemo.locator(`#${targetId}`);
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(target).toBeFocused();
      await expect(target).toHaveCSS('outline-style', 'solid');
      await expect(target).toHaveCSS('outline-width', '2px');
      await expect(target).toBeInViewport();
      const targetBounds = await target.boundingBox();
      const navigationBottom = await getNavigationBottom(page);
      expect(targetBounds?.y).toBeGreaterThanOrEqual(navigationBottom + 8);
      expect(targetBounds?.y).toBeLessThanOrEqual(navigationBottom + 32);
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await resetPageAtTop(page);
    const standardMobileJump = page.getByRole('link', { name: '跳转到完整交互演示' });
    await standardMobileJump.focus();
    await page.keyboard.press('Enter');
    const standardMobileTarget = page.locator('#lx-button-demo-anchor');
    await expect(standardMobileTarget).toBeFocused();
    const standardMobileBounds = await standardMobileTarget.boundingBox();
    const standardMobileNavigationBottom = await getNavigationBottom(page);
    expect(standardMobileBounds?.y).toBeGreaterThanOrEqual(standardMobileNavigationBottom + 8);
    expect(standardMobileBounds?.y).toBeLessThanOrEqual(standardMobileNavigationBottom + 32);

    await page.setViewportSize({ width: 1280, height: 900 });
    await resetPageAtTop(page);
    const desktopJump = page.getByRole('link', { name: '跳转到完整交互演示' });
    await desktopJump.focus();
    await page.keyboard.press('Enter');
    const desktopTarget = page.getByRole('region', { name: '完整交互演示' });
    const desktopHeading = page.locator('#lx-button-demo-anchor');
    await expect(desktopHeading).toBeFocused();
    const desktopBounds = await desktopHeading.boundingBox();
    const desktopNavBottom = await getNavigationBottom(page);
    expect(desktopBounds?.y).toBeGreaterThanOrEqual(desktopNavBottom + 8);
    expect(desktopBounds?.y).toBeLessThanOrEqual(desktopNavBottom + 32);

    await openAdvancedExamples(page);
    const desktopSectionNav = desktopTarget.getByRole('navigation', { name: '更多按钮示例目录' });
    for (const [label, targetId] of [
      ['图标与块级', 'lx-button-demo-icons'],
      ['纯图标操作', 'lx-button-demo-icon-actions'],
      ['权限反馈', 'lx-button-demo-permission-actions'],
      ['行内操作', 'lx-button-demo-row-actions'],
    ]) {
      const link = desktopSectionNav.getByRole('link', { name: label });
      const target = desktopTarget.locator(`#${targetId}`);
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(target).toBeFocused();
      await expect(target).toHaveCSS('outline-style', 'solid');
      await expect(target).toHaveCSS('outline-width', '2px');
      const targetBounds = await target.boundingBox();
      const navigationBottom = await getNavigationBottom(page);
      expect(targetBounds?.y).toBeGreaterThanOrEqual(navigationBottom + 8);
      expect(targetBounds?.y).toBeLessThanOrEqual(navigationBottom + 32);
    }

    await page.setViewportSize({ width: 1024, height: 900 });
    await resetPageAtTop(page);
    const mediumJump = page.getByRole('link', { name: '跳转到完整交互演示' });
    await mediumJump.focus();
    await page.keyboard.press('Enter');
    const mediumTarget = page.getByRole('region', { name: '完整交互演示' });
    const mediumHeading = page.locator('#lx-button-demo-anchor');
    await expect(mediumHeading).toBeFocused();
    const mediumBounds = await mediumHeading.boundingBox();
    const mediumNavigationBottom = await getNavigationBottom(page);
    expect(mediumBounds?.y).toBeGreaterThanOrEqual(mediumNavigationBottom + 8);
    expect(mediumBounds?.y).toBeLessThanOrEqual(mediumNavigationBottom + 32);

    await openAdvancedExamples(page);
    const mediumSectionNav = mediumTarget.getByRole('navigation', { name: '更多按钮示例目录' });
    const mediumSectionLink = mediumSectionNav.getByRole('link', { name: '图标与块级' });
    const mediumSection = mediumTarget.locator('#lx-button-demo-icons');
    await mediumSectionLink.focus();
    await page.keyboard.press('Enter');
    await expect(mediumSection).toBeFocused();
    await expect(mediumSection).toHaveCSS('outline-width', '2px');
    const mediumSectionBounds = await mediumSection.boundingBox();
    const mediumSectionNavigationBottom = await getNavigationBottom(page);
    expect(mediumSectionBounds?.y).toBeGreaterThanOrEqual(mediumSectionNavigationBottom + 8);
    expect(mediumSectionBounds?.y).toBeLessThanOrEqual(mediumSectionNavigationBottom + 32);
  });

  test('语义文字在亮色和 HUD 的默认、悬停、按下状态可读', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    await expect(demo).toBeVisible();
    await page.getByTestId('matrix').locator('.lx-button-demo__variants summary').click();

    for (const hud of [false, true]) {
      await page.getByLabel('组件示例深色预览（HUD）', { exact: true }).setChecked(hud);
      const semanticButtons = [
        [demo.getByTestId('matrix').getByRole('button', { name: '主操作按钮', exact: true }), '主操作按钮'],
        [demo.getByTestId('matrix').getByRole('button', { name: '启用区域监控', exact: true }), '启用区域监控实底'],
        [demo.getByTestId('text-icons').getByRole('button', { name: '启用区域监控', exact: true }), '启用区域监控文字'],
        [demo.getByTestId('text-icons').getByRole('button', { name: '催办预警', exact: true }), '催办预警'],
        [demo.getByTestId('matrix').getByRole('button', { name: '告警待决', exact: true }), '告警待决'],
      ] as const;

      for (const [button, name] of semanticButtons) {
        for (const state of ['default', 'hover', 'active']) {
          if (state === 'default') await page.mouse.move(0, 0);
          else await button.hover();
          if (state === 'active') await page.mouse.down();

          const contrast = await getContrastRatio(button);
          if (state === 'active') await page.mouse.up();
          expect(contrast, `${hud ? 'HUD' : '亮色'} ${name} ${state}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('亮色和 HUD 禁用按钮使用中性表面并保持文字可读', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/lxbutton.html');
    const demo = page.locator('.lx-button-demo');
    const disabledButtons = demo.locator('button.lx-btn.is-disabled');
    await expect(disabledButtons).toHaveCount(7);
    for (const [index, name] of [
      [0, '主按钮禁用'],
      [1, '次按钮禁用'],
      [2, '高危按钮禁用'],
      [3, '无权审批'],
      [4, '重试下发'],
    ] as const) {
      await expect(disabledButtons.nth(index)).toHaveText(name);
    }

    for (const hud of [false, true]) {
      await demo.getByLabel('组件示例深色预览（HUD）', { exact: true }).setChecked(hud);

      for (let index = 0; index < 6; index += 1) {
        const button = disabledButtons.nth(index);
        const styles = await button.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            background: style.backgroundColor,
            color: style.color,
            textVariant: element.classList.contains('is-text'),
            opacity: style.opacity,
          };
        });

        await expect(button).toBeDisabled();
        expect(styles.opacity).toBe('1');
        expect(styles.color).toBe(hud ? 'rgb(203, 213, 225)' : 'rgb(96, 98, 102)');
        if (styles.textVariant) {
          expect(styles.background).toBe('rgba(0, 0, 0, 0)');
        } else {
          expect(styles.background).toBe(hud ? 'rgb(22, 35, 58)' : 'rgb(245, 247, 250)');
        }
        expect(await getContrastRatio(button), `${hud ? 'HUD' : '亮色'} 禁用按钮 ${index + 1}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }

    await demo.getByLabel('组件示例深色预览（HUD）', { exact: true }).setChecked(false);
    await page.locator('html').evaluate((element) => element.classList.add('lx-theme-hud'));
    const globalTheme = await demo.evaluate((element) => {
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryButton = element.querySelector<HTMLButtonElement>('.lx-btn--primary');
      if (!primaryButton) throw new Error('HUD 全局主题缺少主按钮');
      const buttonStyle = getComputedStyle(primaryButton);
      return {
        primary: rootStyle.getPropertyValue('--lx-color-primary').trim(),
        onPrimary: rootStyle.getPropertyValue('--lx-color-on-primary').trim(),
        disabledBackground: rootStyle.getPropertyValue('--lx-btn-disabled-bg').trim(),
        buttonBackground: buttonStyle.backgroundColor,
        buttonText: buttonStyle.color,
      };
    });

    expect(globalTheme.primary).toBe('#38bdf8');
    expect(globalTheme.onPrimary).toBe('#0b1220');
    expect(globalTheme.disabledBackground).toBe('#16233a');
    expect(globalTheme.buttonBackground).toBe('rgb(56, 189, 248)');
    expect(globalTheme.buttonText).toBe('rgb(11, 18, 32)');
    await page.locator('html').evaluate((element) => element.classList.remove('lx-theme-hud'));
  });

  test('HUD 主题开关保留原生键盘语义并提供 44px 触达区域', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    const toggle = page.getByLabel('组件示例深色预览（HUD）', { exact: true });
    const label = toggle.locator('xpath=..');

    await expect(toggle).toHaveAttribute('type', 'checkbox');
    await toggle.focus();

    const bounds = await Promise.all([toggle.boundingBox(), label.boundingBox()]);
    if (!bounds[0] || !bounds[1]) throw new Error('HUD 主题开关没有可见边界');
    expect(bounds[0].width).toBeGreaterThanOrEqual(18);
    expect(bounds[0].height).toBeGreaterThanOrEqual(18);
    expect(bounds[1].height).toBeGreaterThanOrEqual(44);
    await expect(toggle).toBeFocused();
  });

  test('自定义文字色在亮色和 HUD 表面均达到正文对比度', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const customLink = demo.getByRole('button', { name: '自定义色链接', exact: true });

    for (const hud of [false, true]) {
      await page.getByLabel('组件示例深色预览（HUD）', { exact: true }).setChecked(hud);
      if (hud) {
        await expect(demo).toHaveClass(/lx-theme-hud/);
      } else {
        await expect(demo).not.toHaveClass(/lx-theme-hud/);
      }
      expect(await getContrastRatio(customLink), hud ? 'HUD 自定义色链接' : '亮色自定义色链接').toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  test('先展示推荐组合，完整语义变体可展开查看', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    const matrix = page.getByTestId('matrix');
    const variants = matrix.locator('.lx-button-demo__variants');

    await expect(matrix.getByRole('button', { name: '主操作按钮' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '次级线框按钮' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '查看详情' })).toBeVisible();
    await expect(matrix.getByRole('button', { name: '批量删除警情' })).toBeHidden();

    await variants.locator('summary').click();
    await expect(matrix).toContainText('删除等高危操作先由宿主确认，再调用请求；失败时保留数据并提示重试。');
    for (const name of ['批量删除警情', '启用区域监控', '告警待决']) {
      await expect(matrix.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await matrix.getByRole('button', { name: '批量删除警情', exact: true }).click();
    const feedback = matrix.getByRole('status');
    await expect(feedback).toContainText('仅更新本地状态，未执行删除');
  });

  test('图标操作反馈在所属面板内就近播报', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const icons = page.getByTestId('icons');
    const addService = icons.getByRole('button', { name: '新增警务服务', exact: true });

    await addService.click();

    const feedback = icons.getByRole('status');
    await expect(feedback).toHaveAttribute('aria-live', 'polite');
    await expect(feedback).toContainText('仅更新本地状态，未请求后端');
  });

  test('模拟请求失败后保留错误状态并支持重试恢复', async ({ page }) => {
    const backendRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/linkx/')) backendRequests.push(url.pathname);
    });

    await page.goto('/components/lxbutton.html');
    const recovery = page.getByTestId('failure-retry');
    const simulateFailure = recovery.getByRole('button', { name: '模拟请求失败' });
    const retry = recovery.getByRole('button', { name: '重试下发' });
    const status = recovery.getByRole('status');

    await expect(retry).toBeDisabled();
    await simulateFailure.click();
    await expect(status).toContainText('模拟失败：网络不可用，指令记录已保留，可重试。');
    await expect(retry).toBeEnabled();

    await retry.click();
    await expect(status).toContainText('正在重试指令……');
    await expect(retry).toBeDisabled();
    await expect(simulateFailure).toBeDisabled();
    await expect(status).toContainText('重试成功：模拟指令已恢复，未请求后端。');
    await expect(retry).toBeDisabled();
    expect(backendRequests).toEqual([]);
  });

  test('块级主操作作为互斥方案折叠展示', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const icons = page.getByTestId('icons');
    const example = icons.getByTestId('block-primary-example');

    await expect(example).not.toHaveAttribute('open', '');
    await expect(example.getByRole('button', { name: '块级主操作（撑满容器）' })).toBeHidden();
    await example.locator('summary').click();
    await expect(example).toHaveAttribute('open', '');
    await expect(example.getByText('块级主操作适用于独立的页面主操作区域，不与上方主操作同时展示。')).toBeVisible();
    const blockButton = example.getByRole('button', { name: '块级主操作（撑满容器）' });
    await expect(blockButton).toBeVisible();
    const dimensions = await blockButton.evaluate((button) => {
      // 使用非拉伸 flex 项，避免 Demo 的 grid/文档样式掩盖 width: 100% 契约。
      const container = document.createElement('div');
      container.style.cssText = 'align-items:flex-start;display:flex;flex-direction:column;width:420px';
      button.parentElement?.insertAdjacentElement('afterend', container);
      container.append(button);
      const style = getComputedStyle(container);
      const buttonStyle = getComputedStyle(button);
      return {
        expectedWidth:
          container.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
        buttonWidth: button.getBoundingClientRect().width,
        buttonComputedWidth: buttonStyle.width,
      };
    });
    expect(Math.abs(dimensions.buttonWidth - dimensions.expectedWidth), JSON.stringify(dimensions)).toBeLessThanOrEqual(
      1,
    );
  });

  test('警示说明保持可读且 Demo 标题层级连续', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    const demo = page.locator('.lx-button-demo');
    await expect(demo.getByRole('heading', { level: 3, name: '推荐用法' })).toBeVisible();

    const note = demo.locator('.lx-button-demo__note');
    for (const hud of [false, true]) {
      await page.getByLabel('组件示例深色预览（HUD）', { exact: true }).setChecked(hud);
      const contrast = await note.evaluate((element) => {
        const channelValues = (color: string) =>
          color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number) ?? [];
        const luminance = (color: string) => {
          const [red, green, blue] = channelValues(color).map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };
        const foreground = luminance(getComputedStyle(element).color);
        const surface = element.closest('.lx-button-demo');
        if (!surface) throw new Error('警示说明缺少主题表面');
        const background = luminance(getComputedStyle(surface).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast, hud ? 'HUD 警示说明' : '亮色警示说明').toBeGreaterThanOrEqual(4.5);
    }
    await expect(demo.locator('h4')).toHaveCount(0);
  });

  test('推荐与块级主操作保持互斥', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const actionablePrimary = demo.locator('button.lx-btn--primary:not(:disabled):visible');
    const recommendedPrimary = demo.getByRole('button', {
      name: '主操作按钮',
      exact: true,
    });
    const blockExample = demo.getByTestId('block-primary-example');
    const blockSummary = blockExample.locator('summary');

    await expect(actionablePrimary).toHaveCount(1);
    await expect(recommendedPrimary).toBeVisible();
    await blockSummary.click();
    await expect(blockExample).toHaveAttribute('open', '');
    await expect(recommendedPrimary).toHaveCount(0);
    await expect(blockExample.getByRole('button', { name: '块级主操作（撑满容器）' })).toBeVisible();
    await expect(actionablePrimary).toHaveCount(1);

    await blockSummary.click();
    await expect(blockExample).not.toHaveAttribute('open', '');
    await expect(recommendedPrimary).toBeVisible();
    await expect(actionablePrimary).toHaveCount(1);
  });

  test('尺寸、加载拦截、键盘焦点和窄屏触控符合契约', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const sizeSelect = page.getByLabel('按钮尺寸档', { exact: true });
    const themeToggle = page.getByLabel('组件示例深色预览（HUD）', { exact: true });
    for (const { width, hud, outlineColor } of [
      { width: 1280, hud: false, outlineColor: 'rgb(0, 96, 169)' },
      { width: 320, hud: false, outlineColor: 'rgb(0, 96, 169)' },
      { width: 1280, hud: true, outlineColor: 'rgb(56, 189, 248)' },
      { width: 320, hud: true, outlineColor: 'rgb(56, 189, 248)' },
    ]) {
      await page.setViewportSize({ width, height: 812 });
      if ((await themeToggle.isChecked()) !== hud) {
        if (hud) await themeToggle.check();
        else await themeToggle.uncheck();
      }

      await themeToggle.focus();
      await page.keyboard.press('Shift+Tab');
      await expect(sizeSelect).toBeFocused();
      expect(await sizeSelect.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      await expect(sizeSelect).toHaveCSS('outline-style', 'solid');
      await expect(sizeSelect).toHaveCSS('outline-color', outlineColor);
      await expect(sizeSelect).toHaveCSS('outline-width', '2px');
      await expect(sizeSelect).toHaveCSS('outline-offset', '2px');

      const focusBounds = await sizeSelect.boundingBox();
      const toolbarBounds = await demo.locator('.lx-button-demo__toolbar').boundingBox();
      if (!focusBounds || !toolbarBounds) throw new Error('尺寸选择框缺少可见边界');
      expect(focusBounds.x - 4).toBeGreaterThanOrEqual(toolbarBounds.x);
      expect(focusBounds.y - 4).toBeGreaterThanOrEqual(toolbarBounds.y);
      expect(focusBounds.x + focusBounds.width + 4).toBeLessThanOrEqual(toolbarBounds.x + toolbarBounds.width);
      expect(focusBounds.y + focusBounds.height + 4).toBeLessThanOrEqual(toolbarBounds.y + toolbarBounds.height);
      expect(focusBounds.x - 4).toBeGreaterThanOrEqual(0);
      expect(focusBounds.x + focusBounds.width + 4).toBeLessThanOrEqual(width);
    }

    if (await themeToggle.isChecked()) await themeToggle.uncheck();
    await page.setViewportSize({ width: 1280, height: 720 });

    const primary = demo.getByRole('button', { name: '主操作按钮', exact: true });
    const refresh = demo.getByRole('button', { name: '刷新数据', exact: true });
    const textIcon = demo.getByRole('button', { name: '文字刷新', exact: true });
    for (const [size, height, fontSize] of [
      ['sm', 28, 12],
      ['md', 32, 14],
      ['lg', 40, 14],
    ] as const) {
      await page.getByLabel('按钮尺寸档').selectOption(size);
      await expect(primary).toHaveCSS('height', `${height}px`);
      await expect(primary).toHaveCSS('font-size', `${fontSize}px`);
      const bounds = await primary.boundingBox();
      expect(bounds?.height, `${size} 档可见按钮高度`).toBe(height);
      const iconBounds = await refresh.boundingBox();
      expect(iconBounds?.height, `${size} 档纯图标高度`).toBe(height);
      expect(iconBounds?.width, `${size} 档纯图标宽度`).toBe(height);
      const textIconBounds = await textIcon.boundingBox();
      expect(textIconBounds?.height, `${size} 档文字形态纯图标高度`).toBe(height);
      expect(textIconBounds?.width, `${size} 档文字形态纯图标宽度`).toBe(height);

      for (const [button, label] of [
        [refresh, '纯图标按钮'],
        [textIcon, '文字形态纯图标按钮'],
      ] as const) {
        const buttonBounds = await button.boundingBox();
        const innerIconBounds = await button.locator('.lx-icon').boundingBox();
        if (!buttonBounds || !innerIconBounds) throw new Error(`${label}缺少可见边界`);
        expect(
          Math.abs(innerIconBounds.x + innerIconBounds.width / 2 - (buttonBounds.x + buttonBounds.width / 2)),
          `${size} 档${label}水平居中`,
        ).toBeLessThanOrEqual(0.5);
        expect(
          Math.abs(innerIconBounds.y + innerIconBounds.height / 2 - (buttonBounds.y + buttonBounds.height / 2)),
          `${size} 档${label}垂直居中`,
        ).toBeLessThanOrEqual(0.5);
      }
    }

    const submit = demo.getByRole('button', { name: '确认下发指令', exact: true });
    const disabledApproval = demo.getByRole('button', { name: '无权审批', exact: true });
    await expect(disabledApproval).toHaveAttribute('aria-describedby', 'lx-button-demo-disabled-reason');
    await expect(demo.locator('#lx-button-demo-disabled-reason')).toContainText('当前账号没有审批权限');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await submit.click();
    const pending = demo.getByRole('button', { name: '下发指令中...', exact: true });
    await expect(pending).toHaveAttribute('aria-busy', 'true');
    await expect(pending).toBeDisabled();
    await expect(pending.locator('.el-icon.is-loading')).toHaveCSS('animation-name', 'none');
    await expect(submit).toBeEnabled();
    const lifecycle = demo.getByTestId('states');
    const lifecycleStatus = lifecycle.locator('.lx-button-demo__status').first();
    await expect(lifecycleStatus).toContainText('指令已下发');

    const plainSubmit = demo.getByRole('button', { name: '指令下发', exact: true });
    await plainSubmit.click();
    await expect(plainSubmit).toHaveAttribute('aria-busy', 'true');
    await expect(plainSubmit).toBeDisabled();
    await expect(lifecycleStatus).toContainText('指令正在下发');
    await expect(lifecycleStatus).toContainText('无文案切换完成');

    const tooltip = page.getByRole('tooltip');
    const textIcons = demo.getByTestId('text-icons');
    const tooltipEnterTransition = page.evaluate(
      () =>
        new Promise<{ transitionProperty: string; transitionDuration: string } | null>((resolve) => {
          const selector = '.lx-btn-tooltip-static-enter-active';
          const observer = new MutationObserver(() => {
            const entering = document.querySelector<HTMLElement>(selector);
            if (!entering) return;

            observer.disconnect();
            window.clearTimeout(timeoutId);
            const style = window.getComputedStyle(entering);
            resolve({
              transitionProperty: style.transitionProperty,
              transitionDuration: style.transitionDuration,
            });
          });
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true,
          });
          const timeoutId = window.setTimeout(() => {
            observer.disconnect();
            resolve(null);
          }, 3000);
        }),
    );
    await refresh.hover();
    await expect(tooltip).toHaveText('刷新数据');
    const entering = await tooltipEnterTransition;
    expect(entering).not.toBeNull();
    expect(entering?.transitionProperty).toBe('none');
    expect(Number.parseFloat(entering?.transitionDuration ?? '1')).toBeLessThanOrEqual(0.00002);
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();

    await refresh.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(refresh).toBeFocused();
    await expect(tooltip).toHaveText('刷新数据');
    await expect(refresh).toHaveCSS('outline-style', 'solid');
    await expect(refresh).toHaveCSS('outline-width', '2px');
    await expect(refresh).toHaveCSS('outline-offset', '2px');
    await refresh.click();
    await expect(textIcons.getByRole('status')).toContainText('已刷新数据（第 1 次）');
    await refresh.press('Enter');
    await expect(textIcons.getByRole('status')).toContainText('已刷新数据（第 2 次）');
    await refresh.press('Space');
    await expect(textIcons.getByRole('status')).toContainText('已刷新数据（第 3 次）');
    // 收起短暂提示后再测页面横向边界，避免 Teleport 浮层参与文档壳层宽度测量。
    await page.mouse.move(0, 0);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transition = await refresh.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transition.split(',').every((duration) => Number.parseFloat(duration) <= 0.00002)).toBe(true);

    await page.getByLabel('按钮尺寸档').selectOption('sm');
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      for (const button of [refresh, textIcon]) {
        const box = await button.boundingBox();
        expect(box?.width, '触屏小号纯图标宽度').toBeGreaterThanOrEqual(44);
        expect(box?.height, '触屏小号纯图标高度').toBeGreaterThanOrEqual(44);
      }
      for (const summary of [
        demo.getByTestId('advanced-examples').locator(':scope > summary'),
        demo.getByTestId('block-primary-example').locator(':scope > summary'),
      ]) {
        expect((await summary.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test('宽视口触屏下小号纯图标按钮仍满足触控目标尺寸', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      await mockDocsRequests(page);
      await page.goto('/components/lxbutton.html');
      await openAdvancedExamples(page);
      await page.getByLabel('按钮尺寸档').selectOption('sm');

      const demo = page.locator('.lx-button-demo');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      for (const button of [
        demo.getByRole('button', { name: '刷新数据', exact: true }),
        demo.getByRole('button', { name: '文字刷新', exact: true }),
      ]) {
        const bounds = await button.boundingBox();
        expect(bounds?.width, '宽视口触屏下纯图标按钮宽度').toBeGreaterThanOrEqual(44);
        expect(bounds?.height, '宽视口触屏下纯图标按钮高度').toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    } finally {
      await context.close();
    }
  });

  test('禁用或加载的纯图标按钮不会显示提示浮层', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const tooltip = page.getByRole('tooltip');
    const disabledIcon = demo.getByRole('button', { name: '无权限刷新图标' });
    await expect(disabledIcon).toHaveAttribute('aria-describedby', 'lx-button-demo-permission-reason');
    await expect(demo.locator('#lx-button-demo-permission-reason')).toHaveText('权限不足，暂不可刷新');
    const bounds = await disabledIcon.boundingBox();
    if (!bounds) throw new Error('禁用图标按钮没有可见边界');

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect(tooltip).toBeHidden();

    const loadingIcon = demo.getByRole('button', { name: '刷新图标数据' });
    await loadingIcon.hover();
    await expect(tooltip).toHaveText('刷新图标数据');
    await loadingIcon.click();
    await expect(loadingIcon).toBeDisabled();
    await expect(tooltip).toBeHidden();
  });

  test('纯图标提示浮层跟随局部 HUD 主题令牌', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const refresh = demo.getByRole('button', { name: '刷新数据', exact: true });
    const tooltip = page.getByRole('tooltip');

    for (const activation of ['pointer', 'keyboard'] as const) {
      await demo.evaluate((element) => element.classList.remove('lx-theme-hud'));
      if (activation === 'pointer') await refresh.hover();
      else {
        await refresh.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        await expect(refresh).toBeFocused();
      }
      await expect(tooltip).toHaveText('刷新数据');

      for (const hud of [true, false]) {
        await demo.evaluate((element, enabled) => element.classList.toggle('lx-theme-hud', enabled), hud);
        await expect(tooltip).toHaveText('刷新数据');

        const themeTokens = await Promise.all([
          demo.evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-bg-inverse').trim()),
          tooltip.evaluate((element) => getComputedStyle(element).getPropertyValue('--lx-bg-inverse').trim()),
        ]);
        expect(themeTokens[1]).toBe(themeTokens[0]);

        if (hud) {
          await expect(tooltip).toHaveClass(/lx-theme-hud/);
          await expect(tooltip).toHaveCSS('background-color', 'rgb(30, 41, 59)');
        } else {
          await expect(tooltip).not.toHaveClass(/lx-theme-hud/);
          await expect(tooltip).toHaveCSS('background-color', 'rgb(45, 49, 54)');
        }
      }

      if (activation === 'pointer') {
        await page.mouse.move(0, 0);
        await expect(tooltip).toBeHidden();
      } else {
        await refresh.press('Escape');
        await expect(tooltip).toBeHidden();
        await expect(refresh).toBeFocused();
      }
    }
  });

  test('同时聚焦和悬停多个纯图标按钮时只显示一个提示', async ({ page }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/components/lxbutton.html');
      await openAdvancedExamples(page);
      const demo = page.locator('.lx-button-demo');
      const labels = demo.getByTestId('text-icons').locator('.lx-button-demo__icon-action-label');
      const focused = demo.getByRole('button', { name: '刷新数据', exact: true });
      const hovered = demo.getByRole('button', { name: '关闭筛选', exact: true });
      const tooltips = page.getByRole('tooltip');

      await expect(labels).toHaveText(['刷新数据', '文字刷新', '关闭筛选', '刷新图标数据']);
      await expect(labels).toHaveCount(4);
      for (let index = 0; index < 4; index += 1) {
        await expect(labels.nth(index)).toBeVisible();
      }

      await page.mouse.move(width - 1, 899);
      await page.keyboard.press('Tab');
      await focused.focus();
      expect(await focused.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      await expect(tooltips).toHaveCount(1);
      await expect(tooltips).toHaveText('刷新数据');

      await hovered.hover();
      await expect(focused).toBeFocused();
      await expect(tooltips).toHaveCount(1);
      await expect(tooltips).toHaveText('关闭筛选');

      if (width === 375) {
        const tooltipBounds = await tooltips.boundingBox();
        const copyBounds = await demo.getByTestId('text-icons').locator('.lx-button-demo__tip').first().boundingBox();
        if (!tooltipBounds || !copyBounds) throw new Error('窄屏提示或说明文案没有可见边界');
        const overlaps =
          tooltipBounds.x < copyBounds.x + copyBounds.width &&
          tooltipBounds.x + tooltipBounds.width > copyBounds.x &&
          tooltipBounds.y < copyBounds.y + copyBounds.height &&
          tooltipBounds.y + tooltipBounds.height > copyBounds.y;
        expect(overlaps, '窄屏 tooltip 不遮挡组件说明文案').toBe(false);
      }

      await page.mouse.move(0, 0);
      await expect(tooltips).toHaveCount(1);
      await expect(tooltips).toHaveText('刷新数据');
    }
  });

  test('按钮迁入新主题祖先后提示浮层会重新绑定主题', async ({ page }) => {
    await page.goto('/components/lxbutton.html');
    await openAdvancedExamples(page);
    const demo = page.locator('.lx-button-demo');
    const button = demo.getByRole('button', { name: '刷新数据', exact: true });
    const tooltip = page.locator('.lx-button-icon-tooltip').filter({ hasText: '刷新数据' });

    await page.mouse.move(0, 0);
    await button.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(button).toBeFocused();
    await expect(tooltip).toHaveText('刷新数据');
    await expect(tooltip).toBeVisible();

    await button.evaluate((element) => {
      const hud = document.createElement('div');
      hud.className = 'lx-theme-hud';
      hud.dataset.testid = 'moved-button-theme';
      document.body.append(hud);
      hud.append(element);
    });
    const hud = page.getByTestId('moved-button-theme');
    const movedButton = hud.getByRole('button', { name: '刷新数据', exact: true });
    await movedButton.focus();
    await expect(movedButton).toBeFocused();
    await expect(tooltip).toHaveText('刷新数据');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveClass(/lx-theme-hud/);
    const tooltipBounds = await tooltip.boundingBox();
    const buttonBounds = await movedButton.boundingBox();
    if (!tooltipBounds || !buttonBounds) throw new Error('主题迁移后的按钮或提示没有可见边界');
    expect(tooltipBounds.x).toBeLessThan(buttonBounds.x + buttonBounds.width);
    expect(tooltipBounds.x + tooltipBounds.width).toBeGreaterThan(buttonBounds.x);
    expect(tooltipBounds.y + tooltipBounds.height).toBeLessThanOrEqual(buttonBounds.y);

    await hud.evaluate((element) => element.classList.remove('lx-theme-hud'));
    await expect(tooltip).not.toHaveClass(/lx-theme-hud/);
  });

  test('触屏点按纯图标按钮不会显示提示浮层', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    try {
      await mockDocsRequests(page);
      await page.goto('/components/lxbutton.html');
      await openAdvancedExamples(page);
      const button = page.getByRole('button', { name: '刷新数据', exact: true });
      await button.scrollIntoViewIfNeeded();
      const bounds = await button.boundingBox();
      if (!bounds) throw new Error('触屏纯图标按钮没有可见边界');

      await page.mouse.move(0, 0);
      await expect(page.getByRole('tooltip')).toBeHidden();
      await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

      await expect(page.getByRole('tooltip')).toBeHidden();
      await expect(page.getByTestId('text-icons').getByRole('status')).toContainText('已刷新数据');

      await button.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(button).toBeFocused();
      await expect(page.getByRole('tooltip')).toHaveText('刷新数据');

      await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await expect(page.getByRole('tooltip')).toBeHidden();
    } finally {
      await context.close();
    }
  });
});
