import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const target = 'http://127.0.0.1:4177/components/lxtransferpanel'
const outDir =
  'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-a-final-luna-2026-10-07'
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const evidence = { target, capturedAt: new Date().toISOString(), captures: [], checks: {}, errors: [] }

async function openPage(viewport, reducedMotion = false) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'light',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => evidence.errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.errors.push(`console: ${message.text()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      evidence.errors.push(`http ${response.status()}: ${response.url()}`)
    }
  })
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  return { context, page }
}

async function capture(page, name) {
  const path = `${outDir}/${name}.png`
  await page.locator('.transfer-panel-demo').screenshot({ path })
  evidence.captures.push({
    name,
    path,
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  })
}

async function measure(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      if (!node) return null
      const box = node.getBoundingClientRect()
      return {
        x: Number(box.x.toFixed(2)),
        y: Number(box.y.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
      }
    }
    const root = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const treeViewport = document.querySelector('.lx-transfer-panel__tree .lx-virtual-tree__viewport')
    const selected = document.querySelector('.lx-transfer-panel__selected')
    const node = document.querySelector('.lx-transfer-panel__tree [role="treeitem"]')
    const names = [...document.querySelectorAll('.lx-transfer-panel__selected-name')].map((item) => ({
      text: item.textContent?.trim(),
      clientWidth: item.clientWidth,
      scrollWidth: item.scrollWidth,
      title: item.getAttribute('title'),
    }))
    return {
      viewport: { width: innerWidth, height: innerHeight },
      root: rect(root),
      layout: root?.getAttribute('data-lx-transfer-layout'),
      gridColumns: root ? getComputedStyle(root).gridTemplateColumns : null,
      panels: panels.map((panel) => ({
        ...rect(panel),
        role: panel.getAttribute('role'),
        labelledby: panel.getAttribute('aria-labelledby'),
        label: panel.getAttribute('aria-labelledby')
          ? document.getElementById(panel.getAttribute('aria-labelledby'))?.textContent?.trim()
          : null,
      })),
      sourceScroll: treeViewport
        ? {
            ...rect(treeViewport),
            scrollHeight: treeViewport.scrollHeight,
            clientHeight: treeViewport.clientHeight,
            rowsInDom: treeViewport.querySelectorAll('[role="treeitem"]').length,
          }
        : null,
      selectedScroll: selected
        ? { ...rect(selected), scrollHeight: selected.scrollHeight, clientHeight: selected.clientHeight }
        : null,
      sourcePool: document.querySelector('.lx-transfer-panel__caption')?.textContent?.trim(),
      selectedCount: document.querySelector('.lx-transfer-panel__footer strong')?.textContent?.trim(),
      headerActions: [...document.querySelectorAll('.lx-transfer-panel__header-actions button')].map((item) => ({
        text: item.textContent?.trim(),
        ...rect(item),
      })),
      filterButtons: [...document.querySelectorAll('.lx-transfer-panel__filter button')].map((item) => ({
        ariaLabel: item.getAttribute('aria-label'),
        ...rect(item),
      })),
      treeRow: node ? rect(node) : null,
      metadataFontSizes: [...document.querySelectorAll('.lx-transfer-panel__node-code, .lx-transfer-panel__node-status')]
        .slice(0, 6)
        .map((item) => getComputedStyle(item).fontSize),
      settingsOpen: document.querySelector('.transfer-panel-demo__settings')?.open ?? false,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      demoStatus: document.querySelector('[data-testid="transfer-status"]')?.textContent?.trim(),
    }
  })
}

const desktop = await openPage({ width: 1440, height: 900 })
evidence.checks.desktopDefault = await measure(desktop.page)
await capture(desktop.page, 'desktop-default')
await desktop.page.locator('.transfer-panel-demo__settings summary').click()
evidence.checks.settings = await measure(desktop.page)
await capture(desktop.page, 'desktop-settings-open')
await desktop.page.getByRole('searchbox', { name: '在已选项中检索' }).fill('DEPT-03')
evidence.checks.selectedSearch = {
  filteredItems: await desktop.page.locator('.lx-transfer-panel__selected-item').allTextContents(),
  clearButtonVisible: await desktop.page.getByRole('button', { name: '清除已选项筛选' }).isVisible(),
}
await capture(desktop.page, 'desktop-selected-code-search')
await desktop.page.getByRole('button', { name: '清除已选项筛选' }).click()
await desktop.page.getByRole('button', { name: '清空' }).click()
evidence.checks.clearWithUndo = {
  selectedCount: await desktop.page.locator('.lx-transfer-panel__footer strong').textContent(),
  status: await desktop.page.locator('[data-testid="transfer-status"]').textContent(),
  undoVisible: await desktop.page.getByRole('button', { name: '撤销清空' }).isVisible(),
}
await capture(desktop.page, 'desktop-clear-with-undo')
await desktop.page.getByRole('button', { name: '撤销清空' }).click()
evidence.checks.afterUndo = await measure(desktop.page)
await capture(desktop.page, 'desktop-after-undo')
await desktop.page.getByRole('button', { name: '加载中' }).click()
evidence.checks.loading = {
  layout: await measure(desktop.page),
  busy: await desktop.page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
  messageRole: await desktop.page.locator('.transfer-panel-demo__message').getAttribute('role'),
  messageText: await desktop.page.locator('.transfer-panel-demo__message').textContent(),
  surfaceOpacity: await desktop.page.locator('.lx-transfer-panel').evaluate((item) => getComputedStyle(item).opacity),
  selectedItems: await desktop.page.locator('.lx-transfer-panel__selected-item').allTextContents(),
}
await capture(desktop.page, 'desktop-loading')
await desktop.page.getByRole('button', { name: '加载失败' }).click()
evidence.checks.error = {
  layout: await measure(desktop.page),
  messageRole: await desktop.page.locator('.transfer-panel-demo__message').getAttribute('role'),
  messageText: await desktop.page.locator('.transfer-panel-demo__message').textContent(),
  retryVisible: await desktop.page.getByRole('button', { name: '重试' }).isVisible(),
}
await capture(desktop.page, 'desktop-error')
await desktop.page.getByRole('button', { name: '重试' }).click()
evidence.checks.retry = await measure(desktop.page)
await desktop.page.getByRole('button', { name: '空结果' }).click()
evidence.checks.emptyTree = await measure(desktop.page)
await capture(desktop.page, 'desktop-empty-tree')
await desktop.page.getByRole('button', { name: '正常数据' }).click()
await desktop.page.getByLabel('HUD 深色主题').check()
evidence.checks.hud = await desktop.page.locator('.lx-transfer-panel').evaluate((node) => ({
  className: node.closest('.transfer-panel-demo')?.className,
  background: getComputedStyle(node).backgroundColor,
  primary: getComputedStyle(node.querySelector('.lx-transfer-panel__controls button')).backgroundColor,
}))
await capture(desktop.page, 'desktop-hud')
await desktop.context.close()

const mobile = await openPage({ width: 375, height: 812 })
evidence.checks.mobileDefault = await measure(mobile.page)
await capture(mobile.page, 'mobile-375-default')
await mobile.page.locator('.transfer-panel-demo__settings summary').click()
evidence.checks.mobileSettings = await measure(mobile.page)
await capture(mobile.page, 'mobile-375-settings-open')
await mobile.context.close()

const keyboard = await openPage({ width: 375, height: 812 })
const tabPath = []
let focusedClearButton = null
for (let index = 0; index < 110; index += 1) {
  await keyboard.page.keyboard.press('Tab')
  const active = await keyboard.page.evaluate(() => {
    const item = document.activeElement
    if (!(item instanceof HTMLElement)) return null
    return {
      tag: item.tagName.toLowerCase(),
      ariaLabel: item.getAttribute('aria-label'),
      text: (item.innerText || item.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    }
  })
  tabPath.push(active)
  if (active?.ariaLabel === '在已选项中检索') {
    await keyboard.page.keyboard.type('DEPT-03')
    await keyboard.page.waitForTimeout(100)
    await keyboard.page.keyboard.press('Tab')
    focusedClearButton = await keyboard.page.getByRole('button', { name: '清除已选项筛选' }).evaluate((node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        focusVisible: node.matches(':focus-visible'),
        rect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
        outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
        scrollY,
      }
    })
    await capture(keyboard.page, 'mobile-375-keyboard-filter-focus')
    break
  }
}
evidence.checks.keyboardPath = { tabCount: tabPath.length, focusedClearButton, tabPath }
await keyboard.context.close()

const reduced = await openPage({ width: 375, height: 812 }, true)
evidence.checks.reducedMotion = await reduced.page.evaluate(() => ({
  media: matchMedia('(prefers-reduced-motion: reduce)').matches,
  samples: [...document.querySelectorAll('.lx-transfer-panel button, .lx-transfer-panel__selected-item')]
    .slice(0, 6)
    .map((item) => ({
      transitionDuration: getComputedStyle(item).transitionDuration,
      animationDuration: getComputedStyle(item).animationDuration,
    })),
}))
await capture(reduced.page, 'mobile-375-reduced-motion')
await reduced.context.close()

evidence.finishedAt = new Date().toISOString()
await fs.writeFile(`${outDir}/browser-evidence.json`, JSON.stringify(evidence, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify({
  target,
  capturedAt: evidence.capturedAt,
  finishedAt: evidence.finishedAt,
  captures: evidence.captures,
  checks: {
    desktopDefault: evidence.checks.desktopDefault,
    selectedSearch: evidence.checks.selectedSearch,
    clearWithUndo: evidence.checks.clearWithUndo,
    loading: { busy: evidence.checks.loading.busy, opacity: evidence.checks.loading.surfaceOpacity, messageRole: evidence.checks.loading.messageRole, selectedItems: evidence.checks.loading.selectedItems },
    error: evidence.checks.error,
    mobileDefault: evidence.checks.mobileDefault,
    keyboardPath: { tabCount: evidence.checks.keyboardPath.tabCount, focusedClearButton: evidence.checks.keyboardPath.focusedClearButton },
    reducedMotion: evidence.checks.reducedMotion,
  },
  errors: evidence.errors,
}, null, 2))
