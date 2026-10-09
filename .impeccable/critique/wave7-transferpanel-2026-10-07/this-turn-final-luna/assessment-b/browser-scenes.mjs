import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'F:/work/linkx-admin';
const outputRoot = path.join(root, '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-final-luna/assessment-b/browser/scenes-final');
const detectorUrl = 'http://127.0.0.1:8400/detect.js';
const routes = [
  { name: 'virtualtree', url: 'http://127.0.0.1:4174/components/lxvirtualtree' },
  { name: 'transferpanel', url: 'http://127.0.0.1:4174/components/lxtransferpanel' },
];
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

function listenToPage(page) {
  const consoleEvents = [];
  const pendingArgs = [];
  const pageErrors = [];
  const failedRequests = [];
  const errorResponses = [];
  page.on('console', (message) => {
    const event = { type: message.type(), text: message.text(), location: message.location(), args: [] };
    consoleEvents.push(event);
    pendingArgs.push(Promise.all(message.args().map(async (handle) => {
      try {
        return await handle.jsonValue();
      } catch {
        return { unserializable: handle.toString() };
      }
    })).then((args) => { event.args = args; }));
  });
  page.on('pageerror', (error) => pageErrors.push({ name: error.name, message: error.message, stack: error.stack }));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), errorText: request.failure()?.errorText ?? null }));
  page.on('response', (response) => {
    if (response.status() >= 400) errorResponses.push({ url: response.url(), status: response.status(), statusText: response.statusText() });
  });
  return { consoleEvents, pendingArgs, pageErrors, failedRequests, errorResponses };
}

async function runDetector(page) {
  const before = await page.evaluate(() => ({
    title: document.title,
    bodyPresent: !!document.body,
    headPresent: !!document.head,
  }));
  const injected = await page.addScriptTag({ url: detectorUrl }).then(() => ({ loaded: true, error: null }), (error) => ({ loaded: false, error: error.message }));
  await page.waitForTimeout(2800);
  const runtime = await page.evaluate(() => ({
    detect: typeof window.impeccableDetect,
    scan: typeof window.impeccableScan,
    scanAsync: typeof window.impeccableScanAsync,
  }));
  return { before, injected, runtime };
}

async function scanAgain(page) {
  return page.evaluate(async () => {
    if (typeof window.impeccableScan !== 'function') return { available: false };
    const result = window.impeccableScan();
    const value = result && typeof result.then === 'function' ? await result : result;
    return {
      available: true,
      returnType: typeof result,
      resultCount: Array.isArray(value) ? value.length : null,
    };
  });
}

async function pageState(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const bodyText = document.body?.innerText || '';
    const toControl = (element) => ({
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute('role'),
      text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      ariaLabel: element.getAttribute('aria-label'),
      title: element.getAttribute('title'),
      placeholder: element.getAttribute('placeholder'),
      type: element.getAttribute('type'),
      value: 'value' in element ? element.value : null,
      checked: 'checked' in element ? element.checked : null,
      disabled: 'disabled' in element ? element.disabled : null,
      className: typeof element.className === 'string' ? element.className : '',
    });
    const inputs = [...document.querySelectorAll('input, select, textarea')].filter(isVisible).map((element) => ({
      ...toControl(element),
      labels: [...(element.labels || [])].map((label) => label.innerText.trim().replace(/\s+/g, ' ')),
      describedBy: element.getAttribute('aria-describedby'),
      descriptionText: (element.getAttribute('aria-describedby') || '').split(/\s+/).map((id) => document.getElementById(id)?.innerText?.trim() || '').filter(Boolean).join(' '),
    }));
    const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(isVisible).map(toControl);
    const treeItems = [...document.querySelectorAll('[role="treeitem"]')].filter(isVisible).map((element) => ({
      text: (element.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      label: element.getAttribute('aria-label'),
      level: element.getAttribute('aria-level'),
      posinset: element.getAttribute('aria-posinset'),
      setsize: element.getAttribute('aria-setsize'),
      selected: element.getAttribute('aria-selected'),
      expanded: element.getAttribute('aria-expanded'),
      tabIndex: element.getAttribute('tabindex'),
      className: element.className,
    }));
    const liveRegions = [...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')].filter(isVisible).map((element) => ({
      role: element.getAttribute('role'),
      live: element.getAttribute('aria-live'),
      text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 600),
    }));
    const overlays = [...document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-tooltip')].map((element) => ({
      tag: element.tagName.toLowerCase(),
      className: element.className,
      text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500),
      outerHTML: element.outerHTML.slice(0, 8000),
      rect: (() => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; })(),
    }));
    const relevantLines = bodyText.split('\n').map((line) => line.trim()).filter((line) => /当前|已选|筛选|匹配|未找到|暂无|加载|失败|空结果|继承|配置提示|上限|禁用/.test(line)).slice(0, 120);
    const active = document.activeElement;
    const activeTreeItem = active?.closest?.('[role="treeitem"]');
    const width = document.documentElement.clientWidth;
    return {
      title: document.title,
      url: location.href,
      htmlClass: document.documentElement.className,
      htmlDataTheme: document.documentElement.getAttribute('data-theme'),
      themeMediaDark: matchMedia('(prefers-color-scheme: dark)').matches,
      bodyClass: document.body?.className ?? null,
      colors: {
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
        mainBackground: document.querySelector('main') ? getComputedStyle(document.querySelector('main')).backgroundColor : null,
      },
      viewport: { width, height: document.documentElement.clientHeight, scrollWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > width },
      headings: [...document.querySelectorAll('h1,h2,h3,h4')].filter(isVisible).map((element) => element.innerText.trim()),
      controls: { inputs, buttons },
      treeItems,
      liveRegions,
      inheritInputs: inputs.filter((input) => /继承/.test(`${input.ariaLabel || ''} ${input.labels.join(' ')}`)),
      overlays,
      detectorGlobals: { detect: typeof window.impeccableDetect, scan: typeof window.impeccableScan },
      focus: {
        tag: active?.tagName?.toLowerCase() ?? null,
        role: active?.getAttribute?.('role') ?? null,
        label: active?.getAttribute?.('aria-label') ?? null,
        text: (active?.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        treeItemText: (activeTreeItem?.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 180),
        treeItemClass: activeTreeItem?.className ?? null,
      },
      relevantLines,
      bodyText: bodyText.slice(0, 40000),
    };
  });
}

async function persistScene(page, route, scene, context, eventState, extra = {}) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const state = await pageState(page);
  await Promise.all(eventState.pendingArgs);
  const consoleMessages = eventState.consoleEvents.filter((event) => event.text.includes('[impeccable]')).map((event) => ({ type: event.type, text: event.text, args: event.args }));
  const evidence = {
    route: route.name,
    url: route.url,
    scene,
    viewport: context._options?.viewport ?? page.viewportSize(),
    requestedTheme: scene.includes('hud') ? 'HUD' : 'Light',
    observedTheme: state.htmlClass.includes('dark') || state.themeMediaDark ? 'dark' : 'light',
    hudNaming: '页面主题切换控件标记为 Switch to dark/light theme；页面没有可见的 HUD 标签。此 HUD 场景使用该暗色模式作为第二主题取证。',
    extra,
    state,
    detectorConsoleSummary: consoleMessages,
    allConsoleEvents: eventState.consoleEvents,
    pageErrors: eventState.pageErrors,
    failedRequests: eventState.failedRequests,
    errorResponses: eventState.errorResponses,
  };
  const sceneDir = path.join(outputRoot, route.name, scene);
  fs.mkdirSync(sceneDir, { recursive: true });
  fs.writeFileSync(path.join(sceneDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(sceneDir, 'console.json'), `${JSON.stringify(eventState.consoleEvents, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(sceneDir, 'overlay-dom.json'), `${JSON.stringify(state.overlays, null, 2)}\n`, 'utf8');
  await page.screenshot({ path: path.join(sceneDir, 'screenshot.png'), fullPage: true });
  return {
    route: route.name,
    scene,
    url: route.url,
    status: extra.status ?? null,
    observedTheme: evidence.observedTheme,
    viewport: state.viewport,
    horizontalOverflow: state.viewport.horizontalOverflow,
    detectorConsole: consoleMessages.map((event) => ({ type: event.type, text: event.text, args: event.args })),
    overlayCount: state.overlays.length,
    liveRegions: state.liveRegions,
    inheritInputs: state.inheritInputs,
    treeItems: state.treeItems.length,
    relevantLines: state.relevantLines,
    errorResponses: eventState.errorResponses,
    pageErrors: eventState.pageErrors,
  };
}

async function createPage(route, scene, viewport, theme) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', locale: 'zh-CN' });
  const page = await context.newPage();
  const eventState = listenToPage(page);
  const response = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const themeControl = page.locator('button.VPSwitchAppearance');
  const themeBefore = await themeControl.getAttribute('title').catch(() => null);
  let themeAction = { attempted: false, before: themeBefore, clicked: false, after: themeBefore };
  if (theme === 'hud') {
    themeAction.attempted = true;
    if (await themeControl.isVisible().catch(() => false)) {
      if (themeBefore === 'Switch to dark theme') {
        await themeControl.click();
        await page.waitForTimeout(350);
        themeAction.clicked = true;
      }
      themeAction.after = await themeControl.getAttribute('title').catch(() => null);
    }
  }
  const mutation = await page.evaluate((title) => {
    const originalTitle = document.title;
    document.title = title;
    const marker = document.createElement('script');
    marker.dataset.assessmentBPreflight = 'true';
    document.head.appendChild(marker);
    const result = { titleChanged: document.title === title, scriptAppended: marker.parentElement === document.head, originalTitle, titleAfter: document.title };
    marker.remove();
    return result;
  }, `[Human] Assessment B ${route.name}/${scene}`);
  const detector = await runDetector(page);
  return { context, page, eventState, response, themeAction, mutation, detector };
}

async function saveThemeScene(route, scene, viewport, theme) {
  const view = await createPage(route, scene, viewport, theme);
  const result = await persistScene(view.page, route, scene, view.context, {
    ...view.eventState,
    pendingArgs: view.eventState.pendingArgs,
  }, {
    status: view.response?.status() ?? null,
    themeAction: view.themeAction,
    mutation: view.mutation,
    detector: view.detector,
  });
  await view.context.close();
  return result;
}

async function captureInteraction(page, route, scene, context, eventState, extra) {
  const scan = await scanAgain(page).catch((error) => ({ available: null, error: error.message }));
  await page.waitForTimeout(450);
  return persistScene(page, route, scene, context, eventState, { ...extra, manualScan: scan });
}

async function runVirtualTreeInteraction(route) {
  const view = await createPage(route, 'interactive', { width: 1440, height: 1000 }, 'light');
  const { page, context, eventState } = view;
  const results = [];
  results.push(await captureInteraction(page, route, 'interactive-initial', context, eventState, { status: view.response?.status() ?? null, detector: view.detector }));

  const filter = page.locator('input[placeholder="过滤节点"]').first();
  const filterFound = await filter.count();
  if (filterFound) {
    const before = await pageState(page);
    await filter.fill('执勤单元 02');
    await page.waitForTimeout(250);
    const filtered = await pageState(page);
    results.push(await captureInteraction(page, route, 'filter-count', context, eventState, {
      filter: '执勤单元 02',
      before: { treeItemCount: before.treeItems.length, relevantLines: before.relevantLines.filter((line) => /筛选|匹配|当前已选/.test(line)) },
      after: { treeItemCount: filtered.treeItems.length, treeItems: filtered.treeItems.map((item) => item.text), relevantLines: filtered.relevantLines.filter((line) => /筛选|匹配|当前已选|找到/.test(line)), liveRegions: filtered.liveRegions },
    }));
    const clear = page.getByRole('button', { name: '清除筛选', exact: true }).first();
    if (await clear.count()) await clear.click().catch(() => filter.fill(''));
  } else {
    results.push({ route: route.name, scene: 'filter-count', skipped: '未找到输入框 placeholder=过滤节点' });
  }

  const firstItem = page.locator('[role="tree"] [role="treeitem"]').first();
  const firstItemCount = await firstItem.count();
  if (firstItemCount) {
    await firstItem.focus().catch(() => {});
    const before = await pageState(page);
    await page.keyboard.press('ArrowDown');
    const afterArrow = await pageState(page);
    results.push(await captureInteraction(page, route, 'keyboard-arrow-down', context, eventState, {
      beforeFocus: before.focus,
      afterFocus: afterArrow.focus,
      treeActiveDescendant: await page.locator('[role="tree"]').first().getAttribute('aria-activedescendant').catch(() => null),
    }));
    await page.keyboard.press('Space');
    const afterSpace = await pageState(page);
    results.push(await captureInteraction(page, route, 'keyboard-space', context, eventState, {
      focus: afterSpace.focus,
      checkedTreeItems: afterSpace.treeItems.filter((item) => item.className.includes('is-checked')).map((item) => item.text),
      liveRegions: afterSpace.liveRegions,
    }));
  } else {
    results.push({ route: route.name, scene: 'keyboard', skipped: '未找到 role=treeitem' });
  }

  for (const [stateName, buttonName] of [['empty-state', '空结果'], ['loading-state', '加载中'], ['error-state', '加载失败']]) {
    const button = page.getByRole('button', { name: buttonName, exact: true }).first();
    if (!await button.count()) {
      results.push({ route: route.name, scene: stateName, skipped: `未找到按钮 ${buttonName}` });
      continue;
    }
    await button.click();
    await page.waitForTimeout(250);
    const state = await pageState(page);
    results.push(await captureInteraction(page, route, stateName, context, eventState, {
      selectedButton: buttonName,
      visibleTextMatches: state.relevantLines.filter((line) => /暂无|加载|失败|空|错误/.test(line)),
      liveRegions: state.liveRegions,
    }));
  }
  await Promise.all(eventState.pendingArgs);
  fs.writeFileSync(path.join(outputRoot, route.name, 'interactive-console.json'), `${JSON.stringify(eventState.consoleEvents, null, 2)}\n`, 'utf8');
  await context.close();
  return results;
}

async function runTransferPanelInteraction(route) {
  const view = await createPage(route, 'interactive', { width: 1440, height: 1000 }, 'light');
  const { page, context, eventState } = view;
  const results = [];
  let state = await pageState(page);
  results.push(await captureInteraction(page, route, 'inherit-description-default', context, eventState, {
    status: view.response?.status() ?? null,
    inheritInputs: state.inheritInputs,
    detector: view.detector,
  }));

  const summaries = page.locator('details > summary');
  for (let index = 0; index < await summaries.count(); index += 1) {
    const summary = summaries.nth(index);
    const text = (await summary.innerText().catch(() => '')).trim();
    if (/高级.*操作|高级示例/.test(text)) await summary.click().catch(() => {});
  }
  let inputs = await page.locator('input[type="checkbox"]').evaluateAll((elements) => elements.map((element, index) => ({
    index,
    checked: element.checked,
    disabled: element.disabled,
    labels: [...(element.labels || [])].map((label) => label.innerText.trim().replace(/\s+/g, ' ')),
  })));
  const provisionIndex = inputs.find((input) => input.labels.some((label) => /提供继承说明/.test(label)))?.index;
  let missingDescription = { attempted: provisionIndex !== undefined, control: null, result: null };
  if (provisionIndex !== undefined) {
    const provision = page.locator('input[type="checkbox"]').nth(provisionIndex);
    const provisionInput = inputs[provisionIndex];
    if (provisionInput.checked) await provision.uncheck().catch(() => {});
    await page.waitForTimeout(200);
    state = await pageState(page);
    missingDescription.control = provisionInput.labels;
    missingDescription.result = state.inheritInputs;
    results.push(await captureInteraction(page, route, 'inherit-description-missing', context, eventState, missingDescription));
  } else {
    missingDescription.reason = '可见或展开的控件中没有标签包含“提供继承说明”的复选框';
    results.push({ route: route.name, scene: 'inherit-description-missing', skipped: missingDescription.reason });
  }

  const leftFilter = page.locator('input[placeholder^="输入机构名称/部门编码"]').first();
  if (await leftFilter.count()) {
    const before = await pageState(page);
    await leftFilter.fill('SUB-22');
    await page.waitForTimeout(250);
    const after = await pageState(page);
    results.push(await captureInteraction(page, route, 'filter-left-count', context, eventState, {
      filter: 'SUB-22',
      before: { treeItemCount: before.treeItems.length, selectedCountLines: before.relevantLines.filter((line) => /已选|待选池|待选树/.test(line)) },
      after: { treeItemCount: after.treeItems.length, treeItems: after.treeItems.map((item) => item.text), relevantLines: after.relevantLines.filter((line) => /筛选|匹配|已选|待选/.test(line)), liveRegions: after.liveRegions },
    }));
    await leftFilter.fill('');
  } else {
    results.push({ route: route.name, scene: 'filter-left-count', skipped: '未找到待选节点搜索框' });
  }

  const rightFilter = page.locator('input[placeholder^="在已选名单中检索"]').first();
  if (await rightFilter.count()) {
    const before = await pageState(page);
    await rightFilter.fill('指挥中心');
    await page.waitForTimeout(250);
    const after = await pageState(page);
    results.push(await captureInteraction(page, route, 'filter-right-count', context, eventState, {
      filter: '指挥中心',
      before: { selectedItems: before.controls.buttons.filter((button) => (button.ariaLabel || '').startsWith('移除 ')).length },
      after: { selectedItems: after.controls.buttons.filter((button) => (button.ariaLabel || '').startsWith('移除 ')).length, itemButtons: after.controls.buttons.filter((button) => (button.ariaLabel || '').startsWith('移除 ')).map((button) => button.ariaLabel), relevantLines: after.relevantLines.filter((line) => /已选|筛选|未找到|匹配/.test(line)), liveRegions: after.liveRegions },
    }));
    await rightFilter.fill('');
  } else {
    results.push({ route: route.name, scene: 'filter-right-count', skipped: '未找到已选名单搜索框' });
  }

  const firstItem = page.locator('[role="tree"] [role="treeitem"]').first();
  if (await firstItem.count()) {
    await firstItem.focus().catch(() => {});
    const before = await pageState(page);
    await page.keyboard.press('ArrowDown');
    const after = await pageState(page);
    results.push(await captureInteraction(page, route, 'keyboard-arrow-down', context, eventState, { beforeFocus: before.focus, afterFocus: after.focus }));
  } else {
    results.push({ route: route.name, scene: 'keyboard-arrow-down', skipped: '未找到待选树节点' });
  }

  for (const [stateName, buttonName] of [['empty-state', '空结果'], ['loading-state', '加载中'], ['error-state', '加载失败']]) {
    const button = page.getByRole('button', { name: buttonName, exact: true }).first();
    if (!await button.count()) {
      results.push({ route: route.name, scene: stateName, skipped: `未找到按钮 ${buttonName}` });
      continue;
    }
    await button.click();
    await page.waitForTimeout(250);
    state = await pageState(page);
    results.push(await captureInteraction(page, route, stateName, context, eventState, {
      selectedButton: buttonName,
      visibleTextMatches: state.relevantLines.filter((line) => /暂无|加载|失败|空|错误/.test(line)),
      liveRegions: state.liveRegions,
    }));
  }

  await Promise.all(eventState.pendingArgs);
  fs.writeFileSync(path.join(outputRoot, route.name, 'interactive-console.json'), `${JSON.stringify(eventState.consoleEvents, null, 2)}\n`, 'utf8');
  await context.close();
  return results;
}

try {
  const sceneResults = [];
  for (const route of routes) {
    sceneResults.push(await saveThemeScene(route, 'desktop-light', { width: 1440, height: 1000 }, 'light'));
    sceneResults.push(await saveThemeScene(route, 'desktop-hud', { width: 1440, height: 1000 }, 'hud'));
    sceneResults.push(await saveThemeScene(route, 'mobile-375-light', { width: 375, height: 812 }, 'light'));
    sceneResults.push(await saveThemeScene(route, 'mobile-375-hud', { width: 375, height: 812 }, 'hud'));
  }
  const interactionResults = [];
  interactionResults.push(...await runVirtualTreeInteraction(routes[0]));
  interactionResults.push(...await runTransferPanelInteraction(routes[1]));
  const all = { sceneResults, interactionResults };
  fs.writeFileSync(path.join(outputRoot, 'summary.json'), `${JSON.stringify(all, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    scenes: sceneResults.map(({ route, scene, status, observedTheme, viewport, horizontalOverflow, overlayCount, detectorConsole, errorResponses, pageErrors }) => ({ route, scene, status, observedTheme, viewport, horizontalOverflow, overlayCount, detectorConsole, errorResponses, pageErrors })),
    interactions: interactionResults.map(({ route, scene, skipped, overlayCount, liveRegions, inheritInputs, relevantLines, errorResponses, pageErrors }) => ({ route, scene, skipped, overlayCount, liveRegions, inheritInputs, relevantLines, errorResponses, pageErrors })),
  }, null, 2)}\n`);
} finally {
  await browser.close();
}
