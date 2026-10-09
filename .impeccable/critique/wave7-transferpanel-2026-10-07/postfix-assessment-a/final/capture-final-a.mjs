import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const baseURL = 'http://127.0.0.1:4177/components/lxtransferpanel'
const outDir =
  'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-assessment-a/final'
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})

const evidence = {
  target: baseURL,
  startedAt: new Date().toISOString(),
  captures: [],
  checks: {},
  errors: [],
}

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
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  return { context, page }
}

async function capture(page, name, fullPage = true) {
  const path = `${outDir}/${name}.png`
  await page.screenshot({ path, fullPage })
  evidence.captures.push({
    name,
    path,
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
  })
}

async function measureLayout(page) {
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
    const treeViewport = document.querySelector(
      '.lx-transfer-panel__tree .lx-virtual-tree__viewport',
    )
    const selected = document.querySelector('.lx-transfer-panel__selected')
    const headerActions = [
      ...document.querySelectorAll('.lx-transfer-panel__header-actions button'),
    ]
    const touchTargets = [
      ...document.querySelectorAll(
        '.lx-transfer-panel button, .transfer-panel-demo__toolbar button, .transfer-panel-demo__toolbar label',
      ),
    ].map((node) => ({
      text: node.textContent?.trim() ?? '',
      aria: node.getAttribute('aria-label'),
      ...rect(node),
    }))
    const metadata = [...document.querySelectorAll('[data-lx-transfer-code]')].map(
      (node) => ({
        code: node.textContent?.trim(),
        fontSize: getComputedStyle(node).fontSize,
        title: node.getAttribute('title'),
      }),
    )
    const statusLabels = [...document.querySelectorAll('[data-status-tone]')].map(
      (node) => ({
        text: node.textContent?.trim(),
        tone: node.getAttribute('data-status-tone'),
        fontSize: getComputedStyle(node).fontSize,
      }),
    )
    const names = [...document.querySelectorAll('.lx-transfer-panel__selected-name')].map(
      (node) => ({
        text: node.textContent?.trim(),
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        title: node.getAttribute('title'),
      }),
    )
    return {
      viewport: { width: innerWidth, height: innerHeight },
      root: rect(root),
      layout: root?.getAttribute('data-lx-transfer-layout'),
      gridColumns: root ? getComputedStyle(root).gridTemplateColumns : null,
      panelHeightToken: root
        ? getComputedStyle(root).getPropertyValue('--lx-transfer-panel-height').trim()
        : null,
      panels: panels.map((node) => {
        const labelId = node.getAttribute('aria-labelledby')
        return {
          ...rect(node),
          role: node.getAttribute('role'),
          labelledby: labelId,
          labelledbyText: labelId
            ? document.getElementById(labelId)?.textContent?.trim() ?? null
            : null,
        }
      }),
      headerActions: headerActions.map((node) => ({
        text: node.textContent?.trim(),
        ...rect(node),
      })),
      tree: rect(treeViewport),
      treeScroll: treeViewport
        ? {
            scrollHeight: treeViewport.scrollHeight,
            clientHeight: treeViewport.clientHeight,
            scrollTop: treeViewport.scrollTop,
          }
        : null,
      treeItemsInDom: document.querySelectorAll(
        '.lx-transfer-panel__tree [role="treeitem"], .lx-transfer-panel__tree .lx-virtual-tree__node',
      ).length,
      selected: rect(selected),
      selectedScroll: selected
        ? { scrollHeight: selected.scrollHeight, clientHeight: selected.clientHeight }
        : null,
      visibleSelectedItems: document.querySelectorAll(
        '.lx-transfer-panel__selected-item',
      ).length,
      selectedCount: document.querySelector('[data-testid="selected-count"]')
        ?.textContent?.trim() ?? null,
      sourcePool: document.querySelector('.lx-transfer-panel__caption')
        ?.textContent?.trim() ?? null,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      touchTargets,
      filters: [...document.querySelectorAll('.lx-transfer-panel__filter input')].map(
        (node) => ({
          label: node.getAttribute('aria-label'),
          value: node.value,
          fontSize: getComputedStyle(node).fontSize,
        }),
      ),
      metadata,
      statusLabels,
      names,
      status: document.querySelector('[data-testid="transfer-status"]')
        ?.textContent?.trim() ?? null,
      settingsOpen: document.querySelector('.transfer-panel-demo__settings')?.open ?? null,
    }
  })
}

async function measureState(page) {
  return page.evaluate(() => {
    const surface = document.querySelector('.transfer-panel-demo__surface')
    const panel = document.querySelector('.lx-transfer-panel')
    const message = document.querySelector('.transfer-panel-demo__message')
    return {
      panelPresent: Boolean(panel),
      busy: surface?.getAttribute('aria-busy') ?? null,
      surfaceClass: surface?.className ?? null,
      opacity: panel ? getComputedStyle(panel).opacity : null,
      pointerEvents: panel ? getComputedStyle(panel).pointerEvents : null,
      messageRole: message?.getAttribute('role') ?? null,
      messageText: message?.textContent?.trim() ?? null,
      messageRect: message
        ? (() => {
            const rect = message.getBoundingClientRect()
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }
          })()
        : null,
      selectedText: document.querySelector('.lx-transfer-panel__selected')
        ?.textContent?.trim() ?? null,
      selectedCount: document.querySelector('[data-testid="selected-count"]')
        ?.textContent?.trim() ?? null,
      retry: Boolean(message?.querySelector('button')),
      undo: Boolean(document.querySelector('.transfer-panel-demo__status button')),
    }
  })
}

const desktop = await openPage({ width: 1440, height: 900 })
await capture(desktop.page, 'desktop-default')
evidence.checks.desktopDefault = await measureLayout(desktop.page)

await desktop.page.getByText('示例状态与主题', { exact: true }).click()
await capture(desktop.page, 'desktop-settings-open')
evidence.checks.settings = await desktop.page.evaluate(() => ({
  open: document.querySelector('.transfer-panel-demo__settings')?.open ?? false,
  buttons: [...document.querySelectorAll('.transfer-panel-demo__toolbar button')].map(
    (node) => node.textContent?.trim(),
  ),
}))

const sourceSearch = desktop.page.getByRole('searchbox', { name: '筛选待选节点' })
await sourceSearch.fill('巡检')
await capture(desktop.page, 'desktop-source-search')
evidence.checks.sourceSearch = await desktop.page.evaluate(() => ({
  value: document.querySelector('input[aria-label="筛选待选节点"]')?.value,
  treeText: document.querySelector('.lx-transfer-panel__tree')?.textContent?.trim() ?? null,
}))
await desktop.page.getByRole('button', { name: '清除待选节点筛选' }).click()

await desktop.page.getByRole('searchbox', { name: '在已选项中检索' }).fill('DEPT-03')
await capture(desktop.page, 'desktop-selected-code-search')
evidence.checks.metadataSearch = await desktop.page.evaluate(() => ({
  value: document.querySelector('input[aria-label="在已选项中检索"]')?.value,
  items: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map(
    (node) => node.textContent?.trim(),
  ),
}))
await desktop.page.getByRole('button', { name: '清除已选项筛选' }).click()

await desktop.page.getByRole('button', { name: '清空', exact: true }).click()
await capture(desktop.page, 'desktop-clear-with-undo')
evidence.checks.clearWithUndo = {
  state: await measureState(desktop.page),
  layout: await measureLayout(desktop.page),
}
await desktop.page.getByRole('button', { name: '撤销清空' }).click()
await capture(desktop.page, 'desktop-after-undo')
evidence.checks.afterUndo = await measureState(desktop.page)

await desktop.page.getByRole('button', { name: '加载中' }).click()
await capture(desktop.page, 'desktop-loading')
evidence.checks.loading = {
  state: await measureState(desktop.page),
  layout: await measureLayout(desktop.page),
}
await desktop.page.getByRole('button', { name: '加载失败' }).click()
await capture(desktop.page, 'desktop-error')
evidence.checks.error = {
  state: await measureState(desktop.page),
  layout: await measureLayout(desktop.page),
}
await desktop.page.getByRole('button', { name: '重试' }).click()
evidence.checks.retry = await measureState(desktop.page)

await desktop.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(desktop.page, 'desktop-hud')
evidence.checks.hud = await desktop.page.evaluate(() => ({
  demoClass: document.querySelector('.transfer-panel-demo')?.className,
  panelBackground: getComputedStyle(
    document.querySelector('.lx-transfer-panel__panel'),
  ).backgroundColor,
  primaryBackground: getComputedStyle(
    document.querySelector('.lx-transfer-panel__controls button:first-child'),
  ).backgroundColor,
}))
await desktop.page.getByRole('checkbox', { name: 'HUD 深色主题' }).uncheck()

await desktop.page.getByRole('button', { name: '空结果' }).click()
await capture(desktop.page, 'desktop-empty-tree')
evidence.checks.emptyTree = {
  state: await measureState(desktop.page),
  layout: await measureLayout(desktop.page),
}
await desktop.page.getByRole('button', { name: '清空', exact: true }).click()
await capture(desktop.page, 'desktop-empty-selection')
evidence.checks.emptySelection = await measureState(desktop.page)
await desktop.context.close()

const mobile = await openPage({ width: 375, height: 812 })
await capture(mobile.page, 'mobile-375-default')
evidence.checks.mobileDefault = await measureLayout(mobile.page)
await mobile.page.getByText('示例状态与主题', { exact: true }).click()
await capture(mobile.page, 'mobile-375-settings-open')
evidence.checks.mobileSettings = await measureLayout(mobile.page)

await mobile.page.getByRole('searchbox', { name: '在已选项中检索' }).fill('DEPT-03')
await mobile.page.getByRole('button', { name: '清除已选项筛选' }).focus()
await capture(mobile.page, 'mobile-375-filter-clear-focus')
evidence.checks.mobileClearFocus = await mobile.page.evaluate(() => {
  const active = document.activeElement
  const rect = active?.getBoundingClientRect()
  return {
    aria: active?.getAttribute('aria-label'),
    rect: rect ? { width: rect.width, height: rect.height } : null,
    outline: active ? getComputedStyle(active).outline : null,
  }
})
await mobile.page.getByRole('button', { name: '清除已选项筛选' }).click()
await mobile.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(mobile.page, 'mobile-375-hud')
evidence.checks.mobileHud = await measureLayout(mobile.page)
await mobile.context.close()

const reduced = await openPage({ width: 375, height: 812 }, true)
await reduced.page.getByText('示例状态与主题', { exact: true }).click()
await reduced.page.getByRole('searchbox', { name: '筛选待选节点' }).focus()
await capture(reduced.page, 'mobile-375-reduced-motion-focus')
evidence.checks.reducedMotion = await reduced.page.evaluate(() => ({
  media: matchMedia('(prefers-reduced-motion: reduce)').matches,
  transitions: [
    ...document.querySelectorAll(
      '.lx-transfer-panel__controls button, .lx-transfer-panel__selected-item',
    ),
  ]
    .slice(0, 5)
    .map((node) => ({
      transitionDuration: getComputedStyle(node).transitionDuration,
      animationDuration: getComputedStyle(node).animationDuration,
    })),
}))
await reduced.context.close()

evidence.finishedAt = new Date().toISOString()
await fs.writeFile(`${outDir}/browser-evidence.json`, JSON.stringify(evidence, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
