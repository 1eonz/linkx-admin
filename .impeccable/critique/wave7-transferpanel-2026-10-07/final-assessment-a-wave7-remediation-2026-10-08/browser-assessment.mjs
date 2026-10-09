import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = require('@playwright/test')

const outputDir = dirname(fileURLToPath(import.meta.url))
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const evidence = {
  assessment: 'A: 独立设计与浏览器审查',
  targetUrl,
  capturedAt: new Date().toISOString(),
  browser: 'Playwright Chromium, 新建 browser context 与 page',
  checkpoints: [],
  actions: [],
}

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
})
const page = await context.newPage()

async function openTarget(width, height = 900) {
  await page.setViewportSize({ width, height })
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.locator('.transfer-panel-demo').waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  await page.evaluate(() => {
    const demo = document.querySelector('.transfer-panel-demo')
    if (demo) window.scrollTo(0, demo.getBoundingClientRect().top + window.scrollY)
  })
}

async function checkpoint(name) {
  const details = await page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      const round = (value) => Math.round(value * 10) / 10
      return {
        x: round(box.x),
        y: round(box.y),
        width: round(box.width),
        height: round(box.height),
        right: round(box.right),
        bottom: round(box.bottom),
      }
    }
    const root = document.documentElement
    const panel = document.querySelector('.lx-transfer-panel')
    const sides = [...(panel?.querySelectorAll('.lx-transfer-panel__panel') ?? [])]
    const filterInputs = [...(panel?.querySelectorAll('.lx-transfer-panel__filter input') ?? [])]
    const selectedList = panel?.querySelector('.lx-transfer-panel__selected')
    const selectedItems = [...(selectedList?.querySelectorAll(':scope > li.lx-transfer-panel__selected-item') ?? [])]
    const clearButtons = [...(panel?.querySelectorAll('.lx-transfer-panel__filter button[aria-label]') ?? [])]
    const hint = panel?.querySelector('[data-testid="selected-scroll-hint"]')
    const addAll = panel?.querySelector('button[aria-label="全部加入"]')
    const compactHint = panel?.querySelector('[data-testid="select-all-compact-hint"]')
    const focus = document.activeElement
    const css = (element, property) => element ? getComputedStyle(element).getPropertyValue(property).trim() : ''
    const pageWidth = root.clientWidth
    const scrollWidth = root.scrollWidth

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { clientWidth: pageWidth, scrollWidth, horizontalOverflow: scrollWidth > pageWidth + 1 },
      theme: {
        htmlClasses: root.className,
        colorScheme: css(document.querySelector('.transfer-panel-demo'), 'color-scheme'),
        panelBackground: css(sides[0], 'background-color'),
        panelText: css(sides[0], 'color'),
        primary: css(panel, '--lx-color-primary'),
      },
      panel: {
        rect: rect(panel),
        columns: css(panel, 'grid-template-columns'),
        sideRects: sides.map(rect),
        sourceHeader: rect(sides[0]?.querySelector('.lx-transfer-panel__header')),
        sourceActions: rect(sides[0]?.querySelector('.lx-transfer-panel__header-actions')),
        sourceStatus: rect(sides[0]?.querySelector('.lx-transfer-panel__header-status')),
      },
      treeLabels: [...(panel?.querySelectorAll('.lx-virtual-tree__label') ?? [])]
        .slice(0, 8)
        .map((label) => ({
          text: label.textContent.trim(),
          rect: rect(label),
          clientWidth: label.clientWidth,
          scrollWidth: label.scrollWidth,
          overflow: css(label, 'text-overflow'),
          whiteSpace: css(label, 'white-space'),
        })),
      filters: filterInputs.map((input, index) => ({
        label: input.getAttribute('aria-label'),
        value: input.value,
        inputType: input.type,
        rect: rect(input.closest('.lx-transfer-panel__filter')),
        clearLabel: clearButtons[index]?.getAttribute('aria-label') ?? null,
        clearRect: rect(clearButtons[index]),
        clearTargetSize: clearButtons[index] ? {
          width: rect(clearButtons[index]).width,
          height: rect(clearButtons[index]).height,
        } : null,
      })),
      selected: {
        count: selectedItems.length,
        visibleNames: selectedItems.slice(0, 8).map((item) => item.querySelector('.lx-transfer-panel__selected-name')?.textContent.trim() ?? ''),
        listRect: rect(selectedList),
        clientHeight: selectedList?.clientHeight ?? 0,
        scrollHeight: selectedList?.scrollHeight ?? 0,
        scrollTop: selectedList?.scrollTop ?? 0,
        overflowClass: selectedList?.classList.contains('has-overflow') ?? false,
        scrollHintVisible: Boolean(hint && hint.getClientRects().length),
        scrollHintText: hint?.textContent.trim() ?? null,
      },
      addAll: {
        disabled: addAll?.disabled ?? null,
        compactHint: compactHint?.textContent.trim() ?? null,
        selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent.trim() ?? null,
      },
      focus: focus ? {
        tag: focus.tagName.toLowerCase(),
        label: focus.getAttribute('aria-label'),
        text: focus.textContent?.trim().slice(0, 80) ?? '',
        className: typeof focus.className === 'string' ? focus.className : '',
        outlineStyle: css(focus, 'outline-style'),
        outlineWidth: css(focus, 'outline-width'),
      } : null,
    }
  })
  evidence.checkpoints.push({ name, ...details })
  return details
}

async function captureDemo(name) {
  const file = `${name}.png`
  await page.locator('.transfer-panel-demo').screenshot({
    path: join(outputDir, file),
    animations: 'disabled',
  })
  evidence.actions.push({ type: 'screenshot', file, subject: '.transfer-panel-demo' })
}

await openTarget(1280)
await page.screenshot({ path: join(outputDir, 'desktop-page-viewport.png') })
await captureDemo('desktop-default-demo')
const initial = await checkpoint('桌面默认浅色，4 项已选与 1 个可新增名额')

const sourceFilter = page.getByRole('searchbox', { name: '筛选待选节点' })
const selectedFilter = page.getByRole('searchbox', { name: '在已选项中检索' })
await sourceFilter.fill('待授权特勤支队')
await page.getByRole('checkbox', { name: '选择 待授权特勤支队' }).check()
await page.waitForTimeout(100)
const afterAddingOne = await checkpoint('使用可用名额加入一个待选节点')
evidence.actions.push({
  type: 'select-one',
  control: '选择 待授权特勤支队',
  before: initial.addAll.selectedCount,
  after: afterAddingOne.addAll.selectedCount,
})
await captureDemo('desktop-after-adding-fifth')

await sourceFilter.focus()
await sourceFilter.press('Tab')
const sourceClearFocus = await checkpoint('键盘从待选筛选框移至清除按钮')
await captureDemo('desktop-source-clear-keyboard-focus')
await page.getByRole('button', { name: '清除待选节点筛选' }).click()
const sourceClearReturn = await checkpoint('清除待选筛选后焦点返回输入框')

await selectedFilter.fill('历史授权单位')
await selectedFilter.focus()
await selectedFilter.press('Tab')
const selectedClearFocus = await checkpoint('键盘从已选检索框移至清除按钮')
await page.getByRole('button', { name: '清除已选项筛选' }).click()
const selectedClearReturn = await checkpoint('清除已选检索后焦点返回输入框')
evidence.actions.push({
  type: 'keyboard-focus',
  sourceClearButton: sourceClearFocus.focus?.label,
  sourceClearReturnsToInput: sourceClearReturn.focus?.label === '筛选待选节点',
  selectedClearButton: selectedClearFocus.focus?.label,
  selectedClearReturnsToInput: selectedClearReturn.focus?.label === '在已选项中检索',
})

await page.locator('.transfer-panel-demo__settings summary').click()
const maxCountCheckbox = page.locator('[aria-label="示例参数"] input[type="checkbox"]').nth(0)
await maxCountCheckbox.uncheck()
await page.getByRole('button', { name: '全部加入' }).click()
await page.waitForTimeout(300)
const overflowBeforeScroll = await checkpoint('取消演示上限后加入全部可选节点，滚动前')
await captureDemo('desktop-selected-overflow-hint-visible')
const selectedList = page.locator('.lx-transfer-panel__selected')
await selectedList.evaluate((element) => { element.scrollTop = element.scrollHeight })
await page.waitForTimeout(100)
const overflowAfterScroll = await checkpoint('已选列表滚至底部')
await captureDemo('desktop-selected-overflow-at-bottom')
evidence.actions.push({
  type: 'selected-list-scroll',
  before: {
    count: overflowBeforeScroll.selected.count,
    scrollHeight: overflowBeforeScroll.selected.scrollHeight,
    clientHeight: overflowBeforeScroll.selected.clientHeight,
    hintVisible: overflowBeforeScroll.selected.scrollHintVisible,
  },
  after: {
    scrollTop: overflowAfterScroll.selected.scrollTop,
    scrollHeight: overflowAfterScroll.selected.scrollHeight,
    hintVisible: overflowAfterScroll.selected.scrollHintVisible,
  },
})

for (const width of [375, 320]) {
  await openTarget(width)
  const label = `mobile-${width}`
  await page.screenshot({ path: join(outputDir, `${label}-page-viewport.png`) })
  await captureDemo(`${label}-default-demo`)
  const mobileDefault = await checkpoint(`${width}px 默认窄屏`) 
  await page.getByRole('searchbox', { name: '筛选待选节点' }).fill('待授权特勤支队')
  await page.getByRole('searchbox', { name: '在已选项中检索' }).fill('历史授权单位')
  const mobileFilters = await checkpoint(`${width}px 两侧筛选清除按钮尺寸与筛选后排版`)
  await captureDemo(`${label}-filters-visible`)
  evidence.actions.push({
    type: 'mobile-layout',
    width,
    horizontalOverflow: mobileDefault.document.horizontalOverflow,
    sourceClearSize: mobileFilters.filters[0]?.clearTargetSize,
    selectedClearSize: mobileFilters.filters[1]?.clearTargetSize,
    sideBySide: mobileDefault.panel.sideRects.length === 2 && mobileDefault.panel.sideRects[0].y === mobileDefault.panel.sideRects[1].y,
  })
}

await openTarget(1280)
await page.locator('.transfer-panel-demo__settings summary').click()
await page.locator('[aria-label="示例参数"] input[type="checkbox"]').nth(1).check()
await page.waitForTimeout(150)
const darkTheme = await checkpoint('HUD 深色主题')
await captureDemo('desktop-hud-dark-theme')
await page.emulateMedia({ reducedMotion: 'reduce' })
const reducedMotion = await page.evaluate(() => {
  const panel = document.querySelector('.lx-transfer-panel')
  const button = panel?.querySelector('.lx-transfer-panel__controls button')
  const selectedItem = panel?.querySelector('.lx-transfer-panel__selected-item')
  const style = (element) => element ? {
    transitionDuration: getComputedStyle(element).transitionDuration,
    animationDuration: getComputedStyle(element).animationDuration,
  } : null
  return {
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    panel: style(panel),
    actionButton: style(button),
    selectedItem: style(selectedItem),
  }
})
  evidence.checkpoints.push({ name: '减少动效偏好', ...reducedMotion })
await captureDemo('desktop-hud-dark-reduced-motion')
evidence.actions.push({ type: 'theme', htmlClasses: darkTheme.theme.htmlClasses })
evidence.actions.push({ type: 'reduced-motion', ...reducedMotion })

await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
await context.close()
await browser.close()
console.log(JSON.stringify({ checkpoints: evidence.checkpoints.length, screenshots: evidence.actions.filter((entry) => entry.type === 'screenshot').length, outputDir }))
