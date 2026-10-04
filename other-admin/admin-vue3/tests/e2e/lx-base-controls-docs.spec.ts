import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 文档 Demo 仅运行本地交互，阻止意外的外部请求。
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('Select 可见标签关联真实输入，并支持键盘选择', async ({ page }) => {
  await page.goto('/components/lxselect');
  const demo = page.locator('.lx-select-demo');
  for (const name of ['布控等级', '处置通道（可清空）', '协同单位', '指挥中心', '值班警员', '应急链路（锁定）']) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }

  const center = demo.getByLabel('指挥中心', { exact: true });
  await center.focus();
  await center.press('ArrowDown');
  const popper = page.locator('.el-select-dropdown.lx-select__popper:visible');
  await expect(popper).toBeVisible();
  await center.press('ArrowDown');
  await center.press('Enter');
  await expect(demo.locator('.lx-select-demo__status')).toContainText('指挥中心 已选：');
  await expect(popper).toBeHidden();
  await expect(demo.getByLabel('应急链路（锁定）', { exact: true })).toBeDisabled();
});

test('Input 标签、尺寸、清空、键盘焦点与窄屏主题状态可用', async ({ page }) => {
  await page.goto('/components/lxinput');
  const demo = page.locator('.lx-input-demo');
  const name = demo.getByLabel('警员姓名 / 警号', { exact: true });
  const size = demo.getByLabel('输入框尺寸档', { exact: true });
  const inputRoot = name.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " lx-input ")]',
  );
  const counterRoot = demo.locator('.lx-input-demo__validation-form .lx-input');

  await expect(name).toHaveCount(1);
  for (const [option, expectedHeight] of [
    ['sm', 28],
    ['md', 32],
    ['lg', 40],
  ] as const) {
    await size.selectOption(option);
    await expect(inputRoot).toHaveClass(new RegExp(`lx-input--${option}`));
    const geometry = await inputRoot.locator('.el-input__wrapper').evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      token: getComputedStyle(element).getPropertyValue('--el-input-height').trim(),
    }));
    expect(geometry.height, `${option} 档外框高度不匹配：${JSON.stringify(geometry)}`).toBe(expectedHeight);
  }

  const counter = counterRoot.locator('.el-input__count-inner');
  await expect(counter).toBeVisible();
  const getInputCounterContrast = () =>
    counter.evaluate((element) => {
      const luminance = (color: string) => {
        const rgb = color
          .match(/[\d.]+/g)
          ?.map(Number)
          .slice(0, 3);
        if (!rgb || rgb.length !== 3) throw new Error(`无法解析颜色值：${color}`);
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const parseColor = (color: string) => {
        const channels = color.match(/[\d.]+/g)?.map(Number);
        if (!channels || channels.length < 3) throw new Error(`无法解析颜色值：${color}`);
        return { rgb: channels.slice(0, 3), alpha: channels[3] ?? 1 };
      };
      const backgrounds: Array<{ rgb: number[]; alpha: number; source: string }> = [];
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const background = parseColor(getComputedStyle(ancestor).backgroundColor);
        if (background.alpha > 0) {
          const className = typeof ancestor.className === 'string' ? ancestor.className : '';
          backgrounds.push({ ...background, source: `${ancestor.tagName}.${className}` });
        }
        if (background.alpha >= 1) break;
      }
      let visibleBackground: number[] = [255, 255, 255];
      for (let index = backgrounds.length - 1; index >= 0; index -= 1) {
        const layer = backgrounds[index];
        visibleBackground = layer.rgb.map(
          (channel, channelIndex) => channel * layer.alpha + visibleBackground[channelIndex] * (1 - layer.alpha),
        );
      }
      const foregroundColor = getComputedStyle(element).color;
      const backgroundColor = `rgb(${visibleBackground.join(', ')})`;
      const foreground = luminance(foregroundColor);
      const background = luminance(backgroundColor);
      return {
        ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        foregroundColor,
        backgroundColor,
        backgroundLayers: backgrounds.map(({ source, rgb, alpha }) => ({ source, rgb, alpha })),
      };
    });
  const lightCounterContrast = await getInputCounterContrast();
  expect(lightCounterContrast.ratio, JSON.stringify(lightCounterContrast)).toBeGreaterThanOrEqual(4.5);
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  const hudCounterContrast = await getInputCounterContrast();
  expect(hudCounterContrast.ratio, JSON.stringify(hudCounterContrast)).toBeGreaterThanOrEqual(4.5);

  await size.selectOption('md');
  await name.focus();
  await expect(name).toBeFocused();
  await name.fill('张文远');
  await name.locator('xpath=..').hover();
  const clearButton = inputRoot.locator('.el-input__clear');
  await expect(clearButton).toBeVisible();
  await clearButton.click();
  await expect(name).toHaveValue('');
  await expect(demo.locator('.lx-input-demo__status')).toContainText('已清空');
  await expect(demo.getByLabel('所属分局系统节点 (只读)', { exact: true })).toBeDisabled();

  await page.setViewportSize({ width: 320, height: 812 });
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  await expect(name).toBeVisible();
  expect(await demo.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('DatePicker 双输入各有标签，自定义日期与导航插槽保留内核选择', async ({ page }) => {
  await page.goto('/components/lxdatepicker');
  const demo = page.locator('.lx-date-picker-demo');
  for (const name of ['布控生效日期', '月份选择（月度复盘）', '专项复盘日期', '告警汇聚窗口']) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }
  for (const name of ['专项布控日期区间', '研判时间范围', '省厅锁定区间', '归档区间']) {
    const start = demo.getByLabel(`${name}开始日期`, { exact: true });
    const end = demo.getByLabel(`${name}结束日期`, { exact: true });
    await expect(start).toHaveCount(1);
    await expect(end).toHaveCount(1);
    expect(await start.getAttribute('id')).not.toBe(await end.getAttribute('id'));
  }
  await expect(demo.locator('[data-testid="shortcuts"] .el-range-separator')).toHaveCount(0);
  await expect(demo.locator('[data-testid="shortcuts"] .el-range-input').first()).toHaveValue('2026-09-15');

  const annotated = demo.getByLabel('专项复盘日期', { exact: true });
  await annotated.click();
  const popper = page.locator('.lx-date-picker__popper:visible');
  await expect(popper.locator('.lx-icon[data-icon-name="chevron-left"]')).toBeVisible();
  await expect(popper.locator('.lx-icon[data-icon-name="chevron-right"]')).toBeVisible();
  await expect(popper.getByRole('img', { name: '专项复盘' })).toBeVisible();
  await popper
    .locator('td.available')
    .filter({ has: page.locator('.el-date-table-cell__text', { hasText: /^16$/ }) })
    .click();
  await expect(annotated).toHaveValue('2026-09-16');
  await expect(popper).toBeHidden();

  const effective = demo.getByLabel('布控生效日期', { exact: true });
  await effective.focus();
  await effective.press('ArrowDown');
  await expect(page.locator('.lx-date-picker__popper:visible')).toBeVisible();
  await effective.press('Escape');
  await expect(page.locator('.lx-date-picker__popper:visible')).toHaveCount(0);
});

test('InputNumber 全部可见标签关联原生数值输入，键盘步进保留边界', async ({ page }) => {
  await page.goto('/components/lxinputnumber');
  const demo = page.locator('.lx-input-number-demo');
  const names = [
    '巡逻车组配置配额（步长 1）',
    '告警确认时限（分钟，步长 5）',
    '最高并发处警上限',
    '灵敏度系数（0.1 步长）',
    '无步进钮形态（controls=false）',
    '紧凑档 sm',
    '基准档 md（默认）',
    '宽松档 lg',
    '省厅锁定配额（禁用）',
  ];
  for (const name of names) {
    const input = demo.getByLabel(name, { exact: true });
    await expect(input).toHaveCount(1);
    expect(await input.evaluate((element) => element.tagName)).toBe('INPUT');
  }
  const quota = demo.getByLabel('巡逻车组配置配额（步长 1）', { exact: true });
  const timeout = demo.getByLabel('告警确认时限（分钟，步长 5）', { exact: true });
  await expect(quota).toHaveValue('30');
  await expect(quota).toHaveAttribute('name', 'patrolQuota');
  await expect(timeout).toHaveValue('30');
  await quota.fill('31');
  await expect(timeout).toHaveValue('30');
  await timeout.fill('35');
  await expect(quota).toHaveValue('31');
  const limit = demo.getByLabel('最高并发处警上限', { exact: true });
  await expect(limit).toHaveValue('100');
  await expect(demo.getByLabel('省厅锁定配额（禁用）', { exact: true })).toBeDisabled();

  const sizeControls = demo.locator('[data-testid="sizes"] .lx-input-number');
  for (const index of [0, 1, 2]) {
    const geometry = await sizeControls.nth(index).evaluate((element) => {
      const increase = element.querySelector<HTMLElement>('.el-input-number__increase');
      const decrease = element.querySelector<HTMLElement>('.el-input-number__decrease');
      if (!increase || !decrease) throw new Error('尺寸示例缺少步进按钮');
      return {
        increaseBottom: increase.getBoundingClientRect().bottom,
        decreaseTop: decrease.getBoundingClientRect().top,
      };
    });
    expect(Math.abs(geometry.increaseBottom - geometry.decreaseTop)).toBeLessThanOrEqual(0.5);
  }
  await page.getByLabel('显示步进器', { exact: true }).uncheck();
  await expect(sizeControls.locator('.el-input-number__increase')).toHaveCount(0);
  await expect(sizeControls.locator('.el-input-number__decrease')).toHaveCount(0);
  await page.getByLabel('显示步进器', { exact: true }).check();
  await expect(sizeControls.locator('.el-input-number__increase')).toHaveCount(3);
});

test('Textarea 默认硬截断；校验模式保留超限内容并呈现可访问错误', async ({ page }) => {
  await page.goto('/components/lxtextarea');
  const demo = page.locator('.lx-textarea-demo');
  const hardLimit = demo.getByLabel('处置要求及布控指令说明', { exact: true });
  const overflow = demo.getByLabel('涉密核验备忘（溢出校验态）', { exact: true });

  await hardLimit.fill('');
  await hardLimit.pressSequentially('a'.repeat(210));
  await expect(hardLimit).toHaveValue('a'.repeat(200));
  await expect(demo.locator('.lx-textarea-demo__tip').first()).toContainText('最多 200 字；达到上限后继续输入不会写入');

  const initialOverflowValue = await overflow.inputValue();
  expect(initialOverflowValue.length).toBeGreaterThan(200);
  await expect(overflow).toHaveAttribute('aria-invalid', 'true');
  const descriptionId = (await overflow.getAttribute('aria-describedby'))?.split(' ').at(-1);
  expect(descriptionId).toBeTruthy();
  await expect(demo.locator(`#${descriptionId}`)).toContainText('字数超出上限 200 字');
  await expect(demo.locator('.lx-textarea__validation-count')).toHaveText(`${initialOverflowValue.length} / 200`);

  const counter = demo.locator('.lx-textarea__validation-count');
  await expect(counter).toHaveCSS('font-size', '11px');
  const getCounterContrast = () =>
    counter.evaluate((element) => {
      const panel = element.closest('.lx-textarea-demo__panel');
      if (!panel) throw new Error('找不到文本域 Demo 面板背景');

      const getChannels = (color: string): [number, number, number] => {
        const channels = color.match(/[\d.]+/g) ?? [];
        if (channels.length < 3) throw new Error(`无法解析颜色值：${color}`);
        return [Number(channels[0]), Number(channels[1]), Number(channels[2])];
      };
      const [red, green, blue] = getChannels(getComputedStyle(element).color);
      const [backgroundRed, backgroundGreen, backgroundBlue] = getChannels(getComputedStyle(panel).backgroundColor);
      const luminance = (r: number, g: number, b: number) => {
        const linearize = (channel: number) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
      };

      const foregroundLuminance = luminance(red, green, blue);
      const backgroundLuminance = luminance(backgroundRed, backgroundGreen, backgroundBlue);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    });

  const overflowBackground = await overflow.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(overflowBackground).not.toBe('rgb(255, 255, 255)');
  expect(await getCounterContrast()).toBeGreaterThanOrEqual(4.5);
  await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(true);
  expect(await getCounterContrast()).toBeGreaterThanOrEqual(4.5);

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(demo.locator('.lx-textarea__overflow-message')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('三个 Demo 在 375/320px 和局部 HUD 下标签、禁用状态与页面宽度稳定', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const surfaces = [
    ['lxselect', '.lx-select-demo', '布控等级'],
    ['lxdatepicker', '.lx-date-picker-demo', '布控生效日期'],
    ['lxinputnumber', '.lx-input-number-demo', '巡逻车组配置配额（步长 1）'],
    ['lxtextarea', '.lx-textarea-demo', '处置要求及布控指令说明'],
  ];
  for (const [route, selector, name] of surfaces) {
    await page.goto(`/components/${route}`);
    const demo = page.locator(selector);
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      for (const hud of [false, true]) {
        await demo.getByLabel('HUD 深色主题', { exact: true }).setChecked(hud);
        await expect(demo.getByLabel(name, { exact: true })).toBeVisible();
        expect(await demo.evaluate((element) => element.classList.contains('lx-theme-hud'))).toBe(hud);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        await page.screenshot({
          path: testInfo.outputPath(`${route}-${width}-${hud ? 'hud' : 'light'}.png`),
          fullPage: true,
        });
      }
    }
  }
});
