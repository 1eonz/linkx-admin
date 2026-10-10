import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs',
  ).href,
)

const baseUrl = 'http://127.0.0.1:5193'
const outputDir = 'F:/work/linkx-admin/.impeccable/critique/lxvirtualtree-wave11-2026-10-11/assessment-a-postfix'
const result = {
  method: 'Assessment A design review; independent Playwright context',
  baseUrl,
  context: { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' },
  screenshots: [],
  observations: {},
  console: [],
  pageErrors: [],
  httpErrors: [],
}

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
  colorScheme: 'light',
  locale: 'zh-CN',
})
const page = await context.newPage()
page.setDefaultTimeout(5000)
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    result.console.push({ type: message.type(), text: message.text() })
  }
})
page.on('pageerror', (error) => {
  result.pageErrors.push(String(error))
})
page.on('response', (response) => {
  if (response.status() >= 400) {
    result.httpErrors.push({ status: response.status(), url: response.url() })
  }
})

async function settle() {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(450)
}

async function screenshot(name, locator = null, fullPage = false) {
  console.log(`screenshot:${name}`)
  const fileName = `${name}.png`
  const filePath = path.join(outputDir, fileName)
  if (locator) await locator.screenshot({ path: filePath })
  else await page.screenshot({ path: filePath, fullPage })
  result.screenshots.push(fileName)
  return fileName
}

async function viewportMetrics(selector) {
  return page.evaluate((target) => {
    const element = document.querySelector(target)
    if (!element) return null
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
    }
  }, selector)
}

async function openVirtualTreeControls() {
  console.log('openVirtualTreeControls')
  const summary = page.locator('summary').filter({ hasText: '演示状态和更多操作' })
  if ((await summary.count()) && !(await summary.first().evaluate((el) => el.parentElement?.open))) {
    await summary.first().click()
  }
}

async function openSummary(text) {
  const summary = page.locator('summary').filter({ hasText: text }).first()
  if ((await summary.count()) && !(await summary.evaluate((el) => el.parentElement?.open))) {
    await summary.click()
  }
}

console.log('goto:virtualtree')
await page.goto(`${baseUrl}/components/lxvirtualtree`)
await settle()
const treeDemo = page.locator('.virtual-tree-demo')
await treeDemo.waitFor()
result.observations.virtualTree = {
  lightDesktop: {
    screenshot: await screenshot('01-virtualtree-desktop-light', treeDemo),
    demo: await viewportMetrics('.virtual-tree-demo'),
    tree: await viewportMetrics('.lx-virtual-tree__viewport'),
    rows: await page.locator('.lx-virtual-tree__row').count(),
  },
  reducedMotion: await page.evaluate(() => ({
    mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    filterTransition: getComputedStyle(document.querySelector('.lx-virtual-tree__filter') ?? document.documentElement).transitionDuration,
    filterAnimation: getComputedStyle(document.querySelector('.lx-virtual-tree__filter') ?? document.documentElement).animationDuration,
  })),
}

await openVirtualTreeControls()
await openSummary('边界与外观')
console.log('toggle:hud')
const hudToggle = page.getByLabel('HUD 深色主题')
await hudToggle.check()
await page.waitForTimeout(200)
result.observations.virtualTree.hud = {
  screenshot: await screenshot('02-virtualtree-desktop-hud', treeDemo),
  previewClass: await page.locator('.virtual-tree-demo__preview').getAttribute('class'),
  colors: await page.locator('.lx-virtual-tree__viewport').evaluate((element) => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderColor, color: style.color }
  }),
}

console.log('toggle:slot')
const slotToggle = page.getByLabel('多行插槽压力测试')
await slotToggle.check()
await page.waitForTimeout(200)
result.observations.virtualTree.slotStress = {
  screenshot: await screenshot('03-virtualtree-desktop-hud-slot-stress', treeDemo),
  firstRow: await page.locator('.lx-virtual-tree__row').first().evaluate((element) => {
    const row = element.getBoundingClientRect()
    const extra = element.querySelector('.lx-virtual-tree__node-extra')?.getBoundingClientRect()
    const next = element.nextElementSibling?.getBoundingClientRect()
    return {
      rowHeight: row.height,
      extraHeight: extra?.height ?? null,
      extraScrollHeight: element.querySelector('.lx-virtual-tree__node-extra')?.scrollHeight ?? null,
      nextTop: next?.top ?? null,
      rowBottom: row.bottom,
    }
  }),
}

const filter = page.getByRole('textbox', { name: '过滤节点' })
await filter.fill('执勤单元 01')
await page.waitForTimeout(200)
result.observations.virtualTree.filtered = {
  screenshot: await screenshot('04-virtualtree-desktop-filtered-slot-stress', treeDemo),
  status: await page.locator('.lx-virtual-tree__filter-status').textContent(),
  visibleRows: await page.locator('.lx-virtual-tree__row').count(),
  firstRowAria: await page.locator('.lx-virtual-tree__row').first().evaluate((element) => ({
    level: element.getAttribute('aria-level'),
    posinset: element.getAttribute('aria-posinset'),
    setsize: element.getAttribute('aria-setsize'),
    expanded: element.getAttribute('aria-expanded'),
  })),
}

await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(300)
await filter.fill('')
await page.waitForTimeout(150)
result.observations.virtualTree.narrow = {
  screenshot: await screenshot('05-virtualtree-narrow-slot-stress', treeDemo),
  tree: await viewportMetrics('.lx-virtual-tree__viewport'),
  controls: await page.locator('.lx-virtual-tree__toggle, .lx-virtual-tree__checkbox-control').evaluateAll((elements) => elements.slice(0, 4).map((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })),
  horizontalOverflow: await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  })),
}

const tree = page.getByRole('tree', { name: '组织结构' })
const firstTreeRow = tree.getByRole('treeitem').first()
await firstTreeRow.focus()
await firstTreeRow.press('ArrowRight')
result.observations.virtualTree.keyboard = await page.evaluate(() => ({
  activeRole: document.activeElement?.getAttribute('role'),
  activeKey: document.activeElement?.getAttribute('data-lx-tree-key'),
  activeLabel: document.activeElement?.textContent?.trim().slice(0, 80),
}))

console.log('goto:transferpanel')
await page.setViewportSize({ width: 1280, height: 900 })
await page.goto(`${baseUrl}/components/lxtransferpanel`)
await settle()
const transferDemo = page.locator('.transfer-panel-demo')
await transferDemo.waitFor()
result.observations.transferPanel = {
  desktop: {
    screenshot: await screenshot('06-transferpanel-desktop-light', transferDemo),
    panel: await viewportMetrics('.lx-transfer-panel'),
    source: await viewportMetrics('[data-lx-transfer-layout] .lx-transfer-panel__panel'),
    selected: await page.locator('.lx-transfer-panel__selected-item').evaluateAll((items) => items.map((item) => {
      const rect = item.getBoundingClientRect()
      return { height: rect.height, width: rect.width, text: item.textContent?.trim().slice(0, 100) }
    })),
    overflow: await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })),
  },
  reducedMotion: await page.evaluate(() => ({
    mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    selectedTransition: getComputedStyle(document.querySelector('.lx-transfer-panel__selected-item') ?? document.documentElement).transitionDuration,
    selectedAnimation: getComputedStyle(document.querySelector('.lx-transfer-panel__selected-item') ?? document.documentElement).animationDuration,
  })),
}

await openSummary('示例状态与主题')
const transferHud = page.getByLabel('HUD 深色主题')
await transferHud.check()
await page.waitForTimeout(180)
result.observations.transferPanel.hud = {
  screenshot: await screenshot('07-transferpanel-desktop-hud', transferDemo),
  previewClass: await page.locator('.transfer-panel-demo__preview').getAttribute('class'),
  colors: await page.locator('.lx-transfer-panel__panel').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderColor, color: style.color }
  }),
}

await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(300)
const sourceSwitch = page.getByTestId('mobile-source-panel')
const selectedSwitch = page.getByTestId('mobile-selected-panel')
result.observations.transferPanel.narrowSource = {
  screenshot: await screenshot('08-transferpanel-narrow-source', transferDemo),
  switcher: await page.locator('.lx-transfer-panel__mobile-switch').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height, text: element.textContent?.trim() }
  }),
  sourceRows: await page.locator('.lx-transfer-panel__tree .lx-virtual-tree__row').evaluateAll((rows) => rows.slice(0, 4).map((row) => {
    const rect = row.getBoundingClientRect()
    const label = row.querySelector('.lx-virtual-tree__label')?.getBoundingClientRect()
    const meta = row.querySelector('.lx-transfer-panel__node-meta')?.getBoundingClientRect()
    return { height: rect.height, labelHeight: label?.height ?? null, metaHeight: meta?.height ?? null, text: row.textContent?.trim().slice(0, 80) }
  })),
  targetSizes: await page.locator('.lx-transfer-panel__mobile-switch button, .lx-transfer-panel__controls button, .lx-transfer-panel__filter button, .lx-virtual-tree__toggle, .lx-virtual-tree__checkbox-control').evaluateAll((elements) => elements.slice(0, 16).map((element) => {
    const rect = element.getBoundingClientRect()
    return { class: element.className, width: rect.width, height: rect.height }
  })),
}

await selectedSwitch.click()
await page.waitForTimeout(220)
const selectedList = page.locator('.lx-transfer-panel__selected')
const disclosure = page.locator('.lx-transfer-panel__selected-name-disclosure').first()
result.observations.transferPanel.narrowSelected = {
  screenshot: await screenshot('09-transferpanel-narrow-selected', transferDemo),
  activePanel: await page.evaluate(() => ({
    panels: [...document.querySelectorAll('.lx-transfer-panel__panel')].map((panel) => ({
      id: panel.id,
      hidden: panel.classList.contains('is-mobile-hidden'),
    })),
  })),
  selectedList: await viewportMetrics('.lx-transfer-panel__selected'),
  items: await page.locator('.lx-transfer-panel__selected-item').evaluateAll((items) => items.map((item) => {
    const rect = item.getBoundingClientRect()
    const main = item.querySelector('.lx-transfer-panel__selected-main')?.getBoundingClientRect()
    const remove = item.querySelector('button')?.getBoundingClientRect()
    return { height: rect.height, mainHeight: main?.height ?? null, removeWidth: remove?.width ?? null, removeHeight: remove?.height ?? null, text: item.textContent?.trim().slice(0, 120) }
  })),
  disclosureCount: await page.locator('.lx-transfer-panel__selected-name-disclosure').count(),
}

if (await disclosure.count()) {
  const summary = disclosure.locator('summary')
  await summary.focus()
  const before = await summary.getAttribute('aria-expanded')
  await summary.press('Enter')
  await page.waitForTimeout(220)
  result.observations.transferPanel.longName = {
    beforeExpanded: before,
    afterExpanded: await summary.getAttribute('aria-expanded'),
    screenshot: await screenshot('10-transferpanel-narrow-long-name-expanded', transferDemo),
    detailsOpen: await disclosure.getAttribute('open'),
    activeRole: await page.evaluate(() => document.activeElement?.tagName),
    listScrollTop: await selectedList.evaluate((element) => element.scrollTop),
    expandedItem: await disclosure.locator('xpath=ancestor::li[1]').evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const remove = element.querySelector('button')?.getBoundingClientRect()
      return { height: rect.height, remove: remove ? { x: remove.x, y: remove.y, width: remove.width, height: remove.height } : null }
    }),
  }
  await summary.press('Space')
  await page.waitForTimeout(120)
  result.observations.transferPanel.longName.afterSpaceCollapsed = await summary.getAttribute('aria-expanded')
}

await sourceSwitch.click()
await page.waitForTimeout(150)
const sourceTree = page.getByRole('tree', { name: '待选资源树' })
const sourceRow = sourceTree.getByRole('treeitem').first()
await sourceRow.focus()
await sourceRow.press('ArrowRight')
await sourceRow.press('Space')
await page.waitForTimeout(160)
result.observations.transferPanel.keyboard = {
  activeElement: await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), key: document.activeElement?.getAttribute('data-lx-tree-key'), tag: document.activeElement?.tagName })),
  selectedCount: await page.locator('[data-testid="selected-count"]').textContent(),
  sourceTreeRows: await sourceTree.getByRole('treeitem').count(),
}

result.observations.transferPanel.crossViewport = await page.evaluate(() => ({
  documentWidth: document.documentElement.clientWidth,
  documentScrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
}))

await browser.close()
await import('node:fs/promises').then(({ writeFile }) => writeFile(path.join(outputDir, 'browser-results.json'), JSON.stringify(result, null, 2), 'utf8'))
