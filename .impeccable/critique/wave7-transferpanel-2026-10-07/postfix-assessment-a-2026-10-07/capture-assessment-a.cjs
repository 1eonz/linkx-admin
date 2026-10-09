const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require(path.resolve(
  process.cwd(),
  'other-admin/admin-vue3/node_modules/@playwright/test',
));

const outputDir = path.resolve(
  process.cwd(),
  '.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-assessment-a-2026-10-07',
);
const screenshotsDir = path.join(outputDir, 'screenshots');
const url = 'http://127.0.0.1:4174/components/lxtransferpanel';

function rect(element) {
  if (!element) return null;
  const value = element.getBoundingClientRect();
  return {
    x: Math.round(value.x * 10) / 10,
    y: Math.round(value.y * 10) / 10,
    width: Math.round(value.width * 10) / 10,
    height: Math.round(value.height * 10) / 10,
    right: Math.round(value.right * 10) / 10,
    bottom: Math.round(value.bottom * 10) / 10,
  };
}

async function measure(page, label) {
  return page.evaluate((viewLabel) => {
    const rectOf = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return Object.fromEntries(
        ['x', 'y', 'width', 'height', 'right', 'bottom'].map((key) => [
          key,
          Math.round(box[key] * 10) / 10,
        ]),
      );
    };
    const pick = (selector) => document.querySelector(selector);
    const rgb = (value) => {
      const matches = value.match(/[\d.]+/g) ?? [];
      return matches.slice(0, 4).map(Number);
    };
    const luminance = (color) => {
      const channels = color.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return (
        0.2126 * (channels[0] ?? 0) +
        0.7152 * (channels[1] ?? 0) +
        0.0722 * (channels[2] ?? 0)
      );
    };
    const backgroundFor = (element) => {
      let current = element;
      while (current && current !== document.documentElement) {
        const color = rgb(getComputedStyle(current).backgroundColor);
        if ((color[3] ?? 1) > 0) {
          if (color.length > 3 && color[3] < 1) {
            const alpha = color[3];
            const base = [255, 255, 255];
            return color.slice(0, 3).map((channel, index) => channel * alpha + base[index] * (1 - alpha));
          }
          return color.slice(0, 3);
        }
        current = current.parentElement;
      }
      return rgb(getComputedStyle(document.body).backgroundColor).slice(0, 3).length === 3
        ? rgb(getComputedStyle(document.body).backgroundColor).slice(0, 3)
        : [255, 255, 255];
    };
    const contrast = (element, selector) => {
      const foreground = rgb(getComputedStyle(element).color).slice(0, 3);
      const background = backgroundFor(element);
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return {
        selector,
        text: element.textContent?.trim() ?? '',
        foreground: getComputedStyle(element).color,
        effectiveBackground: `rgb(${background.map((value) => Math.round(value)).join(', ')})`,
        ratio: Math.round((((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05)) * 100) / 100,
      };
    };
    const contrasts = (selector) => [...document.querySelectorAll(selector)].map((element, index) => contrast(element, `${selector}[${index}]`));
    const nav = {
      top: rectOf(pick('.VPNavBar')),
      leftSidebar: rectOf(pick('.VPSidebar')),
      article: rectOf(pick('.VPDoc .content-container')),
      localAside: rectOf(pick('.VPDoc .aside')),
      docContainer: rectOf(pick('.VPDoc .container')),
    };
    const transfer = pick('.lx-transfer-panel');
    const panelRects = [...document.querySelectorAll('.lx-transfer-panel__panel')].map(rectOf);
    const title = pick('.lx-transfer-panel__title');
    const headerMain = title?.parentElement;
    const actions = pick('.lx-transfer-panel__header-actions');
    const headerStatus = pick('.lx-transfer-panel__header-status');
    const actionButtons = [...(actions?.querySelectorAll('button') ?? [])];
    const sourceFilter = pick('input[aria-label="筛选待选节点"]');
    const treeViewport = pick('.lx-virtual-tree__viewport');
    const selectedList = pick('.lx-transfer-panel__selected');
    const selectedRows = [...document.querySelectorAll('.lx-transfer-panel__selected-item')];
    const longLabels = [...document.querySelectorAll('.lx-transfer-panel__selected-name')].map((element) => ({
      text: element.textContent?.trim() ?? '',
      title: element.getAttribute('title'),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      textOverflow: getComputedStyle(element).textOverflow,
      rect: rectOf(element),
    }));
    const control = pick('.lx-transfer-panel__controls button[aria-label="全部加入"]');
    const disabledBatchButtons = [...document.querySelectorAll('.lx-transfer-panel__header-actions button:disabled')].map((element) => ({
      ariaLabel: element.getAttribute('aria-label'),
      title: element.getAttribute('title'),
      hasVisibleInlineReason: Boolean(headerStatus?.textContent?.trim()),
    }));
    const active = document.activeElement;
    const focusStyle = active instanceof HTMLElement
      ? {
          tagName: active.tagName,
          ariaLabel: active.getAttribute('aria-label'),
          text: active.textContent?.trim() ?? '',
          className: typeof active.className === 'string' ? active.className : '',
          outlineWidth: getComputedStyle(active).outlineWidth,
          outlineStyle: getComputedStyle(active).outlineStyle,
          outlineOffset: getComputedStyle(active).outlineOffset,
          rect: rectOf(active),
        }
      : null;
    const animated = [...(transfer?.querySelectorAll('*') ?? [])]
      .map((element) => ({
        selector: element.className && typeof element.className === 'string' ? element.className : element.tagName,
        transitionDuration: getComputedStyle(element).transitionDuration,
        animationDuration: getComputedStyle(element).animationDuration,
      }))
      .filter(({ transitionDuration, animationDuration }) =>
        transitionDuration !== '0s' || animationDuration !== '0s',
      )
      .slice(0, 12);

    return {
      label: viewLabel,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      nav,
      navClearOfArticle: Boolean(
        nav.leftSidebar && nav.article && nav.leftSidebar.right <= nav.article.x + 1,
      ),
      articleClearOfAside: Boolean(
        nav.article && nav.localAside && nav.article.right <= nav.localAside.x + 1,
      ),
      demo: rectOf(pick('.transfer-panel-demo')),
      transfer: rectOf(transfer),
      transferColumnCount: getComputedStyle(transfer ?? document.body).gridTemplateColumns,
      panelRects,
      header: {
        title: rectOf(title),
        titleText: title?.textContent?.trim() ?? '',
        main: rectOf(headerMain),
        actions: rectOf(actions),
        actionButtons: actionButtons.map((button) => ({
          label: button.getAttribute('aria-label'),
          disabled: button.disabled,
          rect: rectOf(button),
        })),
        statusText: headerStatus?.textContent?.trim() ?? null,
        titleAndActionsOnSeparateRows: Boolean(
          title && actions && Math.abs(title.getBoundingClientRect().top - actions.getBoundingClientRect().top) > 1,
        ),
      },
      filters: {
        sourceValue: sourceFilter?.value ?? null,
        sourceClearVisible: Boolean(pick('button[aria-label="清除待选节点筛选"]')),
        sourceFocus: sourceFilter === active,
      },
      disabledOperations: {
        addAll: control ? { disabled: control.disabled, title: control.title, visibleReasonBesideButton: Boolean(headerStatus?.textContent?.trim()) } : null,
        filteredActions: disabledBatchButtons,
      },
      counts: {
        selectedText: pick('[data-testid="selected-count"]')?.textContent?.trim() ?? null,
        treeText: pick('[data-testid="tree-node-count"]')?.textContent?.trim() ?? null,
        virtualTreeRows: document.querySelectorAll('.lx-virtual-tree__row').length,
      },
      scrolling: {
        tree: treeViewport ? { clientHeight: treeViewport.clientHeight, scrollHeight: treeViewport.scrollHeight, scrollTop: treeViewport.scrollTop, scrollable: treeViewport.scrollHeight > treeViewport.clientHeight } : null,
        selected: selectedList ? { clientHeight: selectedList.clientHeight, scrollHeight: selectedList.scrollHeight, scrollable: selectedList.scrollHeight > selectedList.clientHeight } : null,
        longLabels,
        selectedRowHeights: selectedRows.map((row) => Math.round(row.getBoundingClientRect().height)),
      },
      contrast: [
        ...contrasts('.transfer-panel-demo__status span'),
        ...contrasts('.transfer-panel-demo__summary span'),
        ...contrasts('.transfer-panel-demo__note'),
        ...contrasts('.transfer-panel-demo__message'),
        ...contrasts('.lx-transfer-panel__header-status'),
        ...contrasts('.lx-transfer-panel__selected-item .lx-transfer-panel__node-status'),
        ...contrasts('.lx-transfer-panel__selected-item .lx-transfer-panel__node-unloaded'),
      ],
      focusStyle,
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      nonzeroMotionProperties: animated,
    };
  }, label);
}

async function screenshot(page, name, selector) {
  const filePath = path.join(screenshotsDir, name);
  if (selector) {
    await page.locator(selector).screenshot({ path: filePath, animations: 'disabled' });
  } else {
    await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled' });
  }
  return path.relative(outputDir, filePath).replaceAll(path.sep, '/');
}

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  const screenshots = [];
  const measurements = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => {
    if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() });
  });

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.locator('.transfer-panel-demo').waitFor({ state: 'visible', timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  const settings = page.locator('.transfer-panel-demo__settings');
  if (!(await settings.evaluate((element) => element.open))) await settings.locator('summary').click();
  measurements.push({ httpStatus: response?.status() ?? null, title: await page.title(), independentContext: true, reusedPage: false });

  measurements.push(await measure(page, '桌面 1440 浅色初始状态'));
  screenshots.push(await screenshot(page, 'page-1440-light.png'));
  screenshots.push(await screenshot(page, 'demo-1440-light.png', '.transfer-panel-demo'));

  await page.setViewportSize({ width: 1280, height: 900 });
  measurements.push(await measure(page, '桌面 1280 浅色初始状态'));
  screenshots.push(await screenshot(page, 'page-1280-light.png'));

  await page.setViewportSize({ width: 375, height: 812 });
  measurements.push(await measure(page, '移动端 375 浅色初始状态'));
  screenshots.push(await screenshot(page, 'demo-375-light.png', '.transfer-panel-demo'));
  screenshots.push(await screenshot(page, 'page-375-light.png'));
  await page.locator('input[aria-label="筛选待选节点"]').fill('待授权特勤支队');
  measurements.push(await measure(page, '移动端 375 筛选结果受选择上限限制'));
  screenshots.push(await screenshot(page, 'filter-cap-375.png', '.transfer-panel-demo'));
  await page.locator('input[aria-label="筛选待选节点"]').fill('');

  await page.setViewportSize({ width: 1440, height: 1000 });
  const sourceFilter = page.locator('input[aria-label="筛选待选节点"]');
  await sourceFilter.fill('交警直属特勤');
  measurements.push(await measure(page, '筛选结果已全部选择'));
  screenshots.push(await screenshot(page, 'filter-all-selected-1440.png', '.transfer-panel-demo'));

  await sourceFilter.fill('待授权特勤支队');
  measurements.push(await measure(page, '筛选结果受选择上限限制'));
  screenshots.push(await screenshot(page, 'filter-cap-1440.png', '.transfer-panel-demo'));

  await sourceFilter.fill('交警直属特勤');
  await page.keyboard.press('Tab');
  measurements.push(await measure(page, '键盘 Tab 聚焦筛选清除按钮'));
  screenshots.push(await screenshot(page, 'keyboard-focus-1440.png', '.transfer-panel-demo'));

  await sourceFilter.fill('交警直属特勤');
  await sourceFilter.press('Shift+Tab');
  measurements.push(await measure(page, '键盘 Tab 聚焦反选筛选结果'));

  await sourceFilter.fill('');
  await page.getByRole('button', { name: '加载中', exact: true }).click();
  measurements.push(await measure(page, '加载状态'));
  screenshots.push(await screenshot(page, 'state-loading-1440.png', '.transfer-panel-demo'));

  await page.getByRole('button', { name: '加载失败', exact: true }).click();
  measurements.push(await measure(page, '错误状态'));
  screenshots.push(await screenshot(page, 'state-error-1440.png', '.transfer-panel-demo'));

  await page.setViewportSize({ width: 375, height: 812 });
  measurements.push(await measure(page, '移动端 375 错误状态'));
  screenshots.push(await screenshot(page, 'state-error-375.png', '.transfer-panel-demo'));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '空结果', exact: true }).click();
  measurements.push(await measure(page, '空树状态'));
  screenshots.push(await screenshot(page, 'state-empty-tree-1440.png', '.transfer-panel-demo'));

  await page.getByRole('button', { name: '正常数据', exact: true }).click();
  await page.getByLabel('HUD 深色主题').check();
  measurements.push(await measure(page, 'HUD 深色主题桌面'));
  screenshots.push(await screenshot(page, 'demo-1440-hud.png', '.transfer-panel-demo'));
  await page.setViewportSize({ width: 375, height: 812 });
  measurements.push(await measure(page, 'HUD 深色主题移动端 375'));
  screenshots.push(await screenshot(page, 'demo-375-hud.png', '.transfer-panel-demo'));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  measurements.push(await measure(page, 'HUD 移动端 reduced motion'));
  screenshots.push(await screenshot(page, 'demo-375-hud-reduced-motion.png', '.transfer-panel-demo'));

  const result = {
    assessment: 'Assessment A 独立视觉与交互评审采集',
    capturedAt: new Date().toISOString(),
    target: url,
    browser: { name: 'Chromium via @playwright/test', version: browser.version(), executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    isolation: { newBrowser: true, newContext: true, newPage: true, existingTabsReused: false, detectorCalled: false },
    screenshots,
    measurements,
    consoleErrors,
    pageErrors,
    failedRequests,
    httpErrors,
  };
  fs.writeFileSync(path.join(outputDir, 'browser-measurements.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await context.close();
  await browser.close();
  process.stdout.write(`${JSON.stringify({ screenshotCount: screenshots.length, measurementCount: measurements.length, httpStatus: response?.status() ?? null, consoleErrors, pageErrors, failedRequests, httpErrors })}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
