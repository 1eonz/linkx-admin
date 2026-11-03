import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

type EdgeKind = 'border' | 'inset';
type Theme = 'light' | 'dark' | 'local-hud' | 'demo-root-hud' | 'root-hud';
type SelectorAdapter = {
  name: 'Select' | 'TreeSelect' | 'Cascader';
  route: string;
  demo: string;
  wrappers: string;
  ids: string[];
  edge: EdgeKind;
  settings?: string;
  hudLabel: string;
  themes: Theme[];
};

const adapters: SelectorAdapter[] = [
  {
    name: 'Select',
    route: '/components/lxselect',
    demo: '.lx-select-demo',
    wrappers: '.lx-select.el-select .el-select__wrapper:not(.is-disabled)',
    ids: ['demo-select-level', 'demo-select-channel', 'demo-select-center', 'demo-select-units', 'demo-select-officer'],
    edge: 'border',
    hudLabel: 'HUD 深色主题',
    themes: ['light', 'dark', 'local-hud', 'root-hud'],
  },
  {
    name: 'TreeSelect',
    route: '/components/lxtreeselect',
    demo: '.lx-tree-select-demo',
    wrappers: '.lx-tree-select.el-select .el-select__wrapper',
    ids: ['tree-select-demo-organization'],
    edge: 'inset',
    settings: '.lx-tree-select-demo__settings > summary',
    hudLabel: 'HUD 深色',
    // TreeSelect 的既有开关修改 html，不能把此路径称作局部 HUD。
    themes: ['light', 'dark', 'demo-root-hud', 'root-hud'],
  },
  {
    name: 'Cascader',
    route: '/components/lxcascader',
    demo: '.cascader-demo',
    wrappers: '.lx-cascader .el-input__wrapper',
    ids: ['cascader-demo-label'],
    edge: 'inset',
    settings: '.cascader-demo__settings > summary',
    hudLabel: 'HUD 深色主题',
    themes: ['light', 'dark', 'local-hud', 'root-hud'],
  },
];

/** 读取真实边线；逐级合成背景及 opacity 组，不把透明色当作不透明 RGB。 */
function measureEdges(elements: Element[], kind: EdgeKind) {
  type Color = [number, number, number, number];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('无法创建边界颜色采样画布');
  const parse = (color: string): Color => {
    if (!CSS.supports('color', color)) throw new Error(`浏览器不支持采样颜色：${color}`);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
    return [red, green, blue, alpha / 255];
  };
  const over = (foreground: Color, background: Color): Color => {
    const alpha = foreground[3] + background[3] * (1 - foreground[3]);
    if (alpha === 0) return [0, 0, 0, 0];
    const channel = (index: number) =>
      (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha;
    return [channel(0), channel(1), channel(2), alpha];
  };
  const luminance = (color: Color) => {
    const linear = color.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const contrast = (first: Color, second: Color) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  // 先检查解析器，避免 color(srgb … / alpha) 或透明度回归造成假阳性。
  const srgb = parse('color(srgb 0.5 0.25 0.75 / 0.5)');
  if (Math.abs(srgb[0] - 128) > 1 || Math.abs(srgb[2] - 191) > 1 || Math.abs(srgb[3] - 0.5) > 0.01)
    throw new Error('color(srgb) 解析器未保留真实颜色与 alpha');
  const alphaProbe = over([0, 0, 0, 0.5], [255, 255, 255, 1]);
  if (alphaProbe[0] !== 127.5) throw new Error('透明色合成检查失败');

  return elements.map((element) => {
    const style = getComputedStyle(element);
    const input = element.querySelector('input');
    // Cascader 内核没有稳定 input id，使用其真实 aria-labelledby 锚定唯一示例。
    const id =
      kind === 'inset' && element.closest('.lx-cascader')
        ? (input?.getAttribute('aria-labelledby') ?? '')
        : (input?.id ?? '');
    const layers: { background: string; image: string; opacity: number; classes: string; filter: string }[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      const computed = getComputedStyle(current);
      layers.push({
        background: computed.backgroundColor,
        image: computed.backgroundImage,
        opacity: Number(computed.opacity),
        classes: current.className,
        filter: computed.filter,
      });
    }
    const sides = ['top', 'right', 'bottom', 'left'].map((side) => ({
      side,
      width: Number.parseFloat(style.getPropertyValue(`border-${side}-width`)),
      style: style.getPropertyValue(`border-${side}-style`),
      color: style.getPropertyValue(`border-${side}-color`),
    }));
    const raw = { kind, sides, shadow: style.boxShadow, backgroundClip: style.backgroundClip, layers };
    try {
      if (layers.some((layer) => layer.image !== 'none' || layer.filter !== 'none'))
        throw new Error('采样祖先存在背景图片或滤镜，不能以纯色计算宣称通过');
      if (layers.some((layer) => !Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1))
        throw new Error('采样祖先存在无法解析的 opacity');
      const transparent: Color = [0, 0, 0, 0];
      const white: Color = [255, 255, 255, 1];
      // 先画完整子组，再施加该层 opacity；不能仅给边色乘祖先 opacity。
      const render = (paint: Color, from: number): Color => {
        let group = paint;
        for (const layer of layers.slice(from)) {
          group = over(group, parse(layer.background));
          group = [group[0], group[1], group[2], group[3] * layer.opacity];
        }
        return over(group, white);
      };
      const inside = render(transparent, 0);
      const outside = render(transparent, 1);
      const borderBase =
        kind === 'inset' || style.backgroundClip === 'border-box' ? parse(layers[0].background) : transparent;
      const visibleEdge = (color: string): Color => {
        const group = over(parse(color), borderBase);
        return render([group[0], group[1], group[2], group[3] * layers[0].opacity], 1);
      };
      const shadowColor = style.boxShadow.match(/rgba?\([^)]+\)|color\([^)]+\)/)?.[0];
      const shadowGeometry = shadowColor ? style.boxShadow.replace(shadowColor, '').trim().replace(/\s+/g, ' ') : '';
      const geometryMatches =
        kind === 'border'
          ? style.boxShadow === 'none' && sides.every((side) => side.width === 1 && side.style === 'solid')
          : sides.every((side) => side.width === 0) && shadowGeometry === '0px 0px 0px 1px inset';
      if (!geometryMatches) throw new Error('默认触发器不符合独立真实 border 或单一 1px inset 边界契约');
      const edges = (kind === 'border' ? sides : [{ side: 'inset', color: shadowColor ?? '' }]).map((edge) => {
        const visible = visibleEdge(edge.color);
        return {
          side: edge.side,
          color: edge.color,
          visible,
          insideContrast: contrast(visible, inside),
          outsideContrast: contrast(visible, outside),
        };
      });
      const token = getComputedStyle(element).getPropertyValue('--lx-bg-card').trim();
      const expectedHudSurface = over(parse(token), white);
      const surfaceMatches = (color: Color) =>
        color.slice(0, 3).every((channel, index) => Math.abs(channel - expectedHudSurface[index]) < 1);
      const texts = Array.from(element.querySelectorAll('.el-select__placeholder'))
        .filter((placeholder) => placeholder.textContent?.trim() && placeholder.getClientRects().length > 0)
        .map((placeholder) => {
          const placeholderStyle = getComputedStyle(placeholder);
          if (placeholderStyle.opacity !== '1') throw new Error('文字样本存在独立透明组，需单独采样');
          return {
            text: placeholder.textContent?.trim(),
            color: placeholderStyle.color,
            contrast: contrast(visibleEdge(placeholderStyle.color), inside),
          };
        });
      return {
        id,
        raw,
        inside,
        outside,
        edges,
        expectedHudSurface,
        texts,
        hudSurfacesMatch: surfaceMatches(inside) && surfaceMatches(outside),
      };
    } catch (error) {
      return { id, raw, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

async function settleDefault(page: Page, wrappers: Locator) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      wrappers.evaluateAll((elements) =>
        elements.every((element) => !element.matches(':hover, :focus-within, .is-focused, .is-focus')),
      ),
    )
    .toBe(true);
}

async function sampleDefaults(
  page: Page,
  demo: Locator,
  adapter: SelectorAdapter,
  theme: Theme,
  label: string,
  testInfo: TestInfo,
) {
  const wrappers = demo.locator(adapter.wrappers);
  await expect(wrappers, `${label} 的真实触发器集合不得为空或漏项`).toHaveCount(adapter.ids.length);
  for (const id of adapter.ids) await expect(demo.locator(`#${id}`)).toBeVisible();
  await expect(
    wrappers.locator('input:disabled, input[aria-invalid="true"]'),
    '默认边界不能混入禁用或错误状态',
  ).toHaveCount(0);
  await settleDefault(page, wrappers);
  const measurements = await wrappers.evaluateAll(measureEdges, adapter.edge).catch(async (error: unknown) => {
    await testInfo.attach(`${label}-采样失败`, {
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2),
      contentType: 'application/json',
    });
    throw error;
  });
  // 先附加全部原始层级与计算结果；低对比及采样错误都必须留下可追溯证据。
  await testInfo.attach(`${label}-边界实际采样`, {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
  expect(measurements.map((measurement) => measurement.id).sort()).toEqual([...adapter.ids].sort());
  for (const measurement of measurements) {
    if ('error' in measurement) throw new Error(`${measurement.id}：${measurement.error}`);
    expect(measurement.edges.length, '边线集合不得为空').toBe(adapter.edge === 'border' ? 4 : 1);
    if (adapter.name === 'Select') {
      if (measurement.id !== 'demo-select-units')
        expect(measurement.texts.length, '单选已选值或占位文字样本不得为空').toBeGreaterThan(0);
      for (const text of measurement.texts)
        expect.soft(text.contrast, `${measurement.id}/${text.text} 文字与实际输入表面对比`).toBeGreaterThanOrEqual(4.5);
    }
    for (const edge of measurement.edges) {
      expect
        .soft(edge.insideContrast, `${label}/${measurement.id}/${edge.side} 边界对内侧表面`)
        .toBeGreaterThanOrEqual(3);
      expect
        .soft(edge.outsideContrast, `${label}/${measurement.id}/${edge.side} 边界对外侧表面`)
        .toBeGreaterThanOrEqual(3);
    }
    if (theme === 'root-hud' || theme === 'demo-root-hud' || theme === 'local-hud')
      expect
        .soft(measurement.hudSurfacesMatch, `${label}/${measurement.id} HUD 内外表面必须使用实际卡片令牌`)
        .toBe(true);
  }
  return measurements;
}

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL || new URL(baseURL).port !== (process.env.LXUI_DOCS_PORT ?? '4177'))
    throw new Error('选择器边界测试必须使用既有 docs 专用配置');
  const origin = new URL(baseURL).origin;
  await page.route('**/*', (route) => {
    const request = route.request();
    // Demo 数据由本地宿主提供；禁止把浏览器验收请求发往后台或外部服务。
    return new URL(request.url()).origin === origin &&
      request.method() === 'GET' &&
      !['xhr', 'fetch'].includes(request.resourceType())
      ? route.continue()
      : route.abort();
  });
});

for (const width of [1280, 320]) {
  test(`Select 静态文档硬导航后各触发器关联自己的候选面板 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/components/lxselect');
    for (const [name, option] of [
      ['布控等级', '二级布控'],
      ['处置通道（可清空）', '高密加密专线'],
      ['指挥中心（可过滤）', '城东分局指挥室'],
      ['协同单位', '交警支队'],
      ['值班警员', '赵国强 031204'],
    ]) {
      const input = page.getByRole('combobox', { name, exact: true });
      await input.focus();
      await input.press('ArrowDown');
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      const panelId = await input.getAttribute('aria-controls');
      if (!panelId) throw new Error(`${name} 缺少候选面板关联`);
      const panel = page.locator(`[id="${panelId}"]`);
      await expect(panel, `${name} 的目标必须唯一，避免 SSR 水合时多实例错绑`).toHaveCount(1);
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(option);
      await input.press('Escape');
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(panel).toBeHidden();
    }
  });
}

for (const adapter of adapters) {
  for (const width of [1280, 320]) {
    for (const theme of adapter.themes) {
      test(`${adapter.name} 默认内外边界 3:1 ${width}/${theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
        await page.goto(adapter.route);
        const demo = page.locator(adapter.demo);
        await expect(demo).toHaveCount(1);
        await expect(demo).toBeVisible();
        if (adapter.settings) await demo.locator(adapter.settings).click();
        if (theme === 'local-hud' || theme === 'demo-root-hud') {
          await demo.getByRole('checkbox', { name: adapter.hudLabel, exact: true }).check();
        } else {
          await page.evaluate((selectedTheme) => {
            document.documentElement.classList.toggle('dark', selectedTheme === 'dark' || selectedTheme === 'root-hud');
            document.documentElement.classList.toggle('lx-theme-hud', selectedTheme === 'root-hud');
          }, theme);
        }
        const rootHud = theme === 'root-hud' || theme === 'demo-root-hud';
        expect(await page.locator('html').evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(
          rootHud,
        );
        expect(await page.locator('html').evaluate((element) => element.classList.contains('dark'))).toBe(
          theme === 'dark' || rootHud,
        );
        if (theme === 'local-hud') await expect(demo).toHaveClass(/lx-theme-hud/);

        if (adapter.name === 'Select') {
          await expect(demo.locator('[data-testid="multiple"] .el-select__collapse-item')).toContainText(/\+\s*1/);
          await expect(demo.locator('#demo-select-center')).not.toHaveAttribute('readonly');
          await expect(demo.locator('#demo-select-level')).toHaveAttribute('readonly');
          await sampleDefaults(page, demo, adapter, theme, '单选有值与可过滤空值及折叠多选', testInfo);
          const channelWrapper = demo.locator('[data-testid="basic"] .el-select__wrapper').nth(1);
          await channelWrapper.hover();
          await channelWrapper.locator('.el-select__clear').click();
          await expect(demo.locator('[data-testid="basic"] .lx-select-demo__status')).toHaveText('处置通道已清空');
          await sampleDefaults(page, demo, adapter, theme, '非过滤单选清空后', testInfo);
        } else if (adapter.name === 'TreeSelect') {
          await sampleDefaults(page, demo, adapter, theme, '可过滤单选有值', testInfo);
          await demo.getByRole('button', { name: '清空选择', exact: true }).click();
          await expect(demo.locator('.lx-tree-select-demo__value')).toHaveText('当前值：');
          await sampleDefaults(page, demo, adapter, theme, '可过滤单选空值', testInfo);
          await demo.getByRole('button', { name: '多选模式', exact: true }).click();
          await expect(demo.locator('.lx-tree-select-demo__value')).toHaveText('当前值：["bj-1"]');
          await sampleDefaults(page, demo, adapter, theme, '可过滤多选有值', testInfo);
          await demo.getByRole('button', { name: '清空选择', exact: true }).click();
          await sampleDefaults(page, demo, adapter, theme, '可过滤多选空值', testInfo);
        } else {
          await sampleDefaults(page, demo, adapter, theme, '可过滤单选有值', testInfo);
          const wrapper = demo.locator(adapter.wrappers);
          await wrapper.hover();
          await demo.locator('.el-cascader .icon-circle-close').click();
          await expect(demo.locator('.cascader-demo__status')).toHaveText('已清空组织路径');
          await sampleDefaults(page, demo, adapter, theme, '可过滤单选空值', testInfo);
          await demo.getByRole('button', { name: '多选模式', exact: true }).click();
          await expect(demo.locator('.cascader-demo__status')).toHaveText('多选值已回显 2 条组织路径');
          // 切换模式会重建实例，重新定位当前触发器，不能使用旧 ElementHandle。
          await expect(demo.locator('.el-cascader__tags')).toContainText(/\+\s*1/);
          await sampleDefaults(page, demo, adapter, theme, '可过滤折叠多选有值', testInfo);
          await demo.locator('.lx-cascader').hover();
          await demo.locator('.el-cascader .icon-circle-close').click();
          await expect(demo.locator('.cascader-demo__value')).toHaveText('当前值：');
          await expect(demo.locator('.el-cascader__tags .el-tag')).toHaveCount(0);
          await sampleDefaults(page, demo, adapter, theme, '可过滤多选空值', testInfo);
        }
        const geometry = await demo.locator(adapter.wrappers).evaluateAll((elements) =>
          elements.map((element) => {
            const bounds = element.getBoundingClientRect();
            return { width: bounds.width, height: bounds.height };
          }),
        );
        expect(geometry.length).toBe(adapter.ids.length);
        for (const bounds of geometry) {
          expect(bounds.width).toBeGreaterThan(0);
          if (width === 320) expect(bounds.height, '窄屏触发器触控高度').toBeGreaterThanOrEqual(44);
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
          '页面不得整体横向溢出',
        ).toBeLessThanOrEqual(width);
        await demo.screenshot({ path: testInfo.outputPath('selector-default-border.png') });
      });
    }
  }
}
