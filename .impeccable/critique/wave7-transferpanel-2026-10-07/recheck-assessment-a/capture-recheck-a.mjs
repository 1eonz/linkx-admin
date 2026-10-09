import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const baseURL = 'http://127.0.0.1:4176/components/lxtransferpanel'
const outDir =
  'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07/recheck-assessment-a'
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
  await page.waitForTimeout(350)
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

async function getLayout(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const rectOf = (node) => {
      if (!node) return null
      const rect = node.getBoundingClientRect()
      return {
        x: Number(rect.x.toFixed(2)),
        y: Number(rect.y.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      }
    }
    const panel = panels[0]
    const tree = document.querySelector('.lx-transfer-panel__tree')
    const viewport = document.querySelector('.lx-transfer-panel__tree .lx-virtual-tree__viewport')
    const selected = document.querySelector('.lx-transfer-panel__selected')
    const groups = [...document.querySelectorAll('[role="group"]')].map((node) => ({
      label: node.getAttribute('aria-label'),
      labelledby: node.getAttribute('aria-labelledby'),
    }))
    const touchTargets = [
      ...document.querySelectorAll(
        '.lx-transfer-panel button, .transfer-panel-demo__toolbar button, .transfer-panel-demo__toolbar label',
      ),
    ].map((node) => {
      const rect = node.getBoundingClientRect()
      return {
        text: node.textContent?.trim() ?? '',
        aria: node.getAttribute('aria-label'),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      }
    })
    return {
      root: rectOf(root),
      panels: panels.map(rectOf),
      gridColumns: root ? getComputedStyle(root).gridTemplateColumns : null,
      panelHeightToken: root ? getComputedStyle(root).getPropertyValue('--lx-transfer-panel-height').trim() : null,
      tree: rectOf(tree),
      treeViewport: rectOf(viewport),
      treeScroll: viewport
        ? { scrollHeight: viewport.scrollHeight, clientHeight: viewport.clientHeight }
        : null,
      selected: rectOf(selected),
      selectedScroll: selected
        ? { scrollHeight: selected.scrollHeight, clientHeight: selected.clientHeight }
        : null,
      layout: root?.getAttribute('data-lx-transfer-layout'),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      groups,
      touchTargets,
      status: document.querySelector('[data-testid="transfer-status"]')?.textContent?.trim() ?? null,
      selectedText: document.querySelector('.lx-transfer-panel__selected')?.textContent?.trim() ?? null,
      metadata: [...document.querySelectorAll('[data-lx-transfer-code]')].map((node) => node.textContent?.trim()),
      statusLabels: [...document.querySelectorAll('[data-status-tone]')].map((node) => ({
        text: node.textContent?.trim(),
        tone: node.getAttribute('data-status-tone'),
      })),
    }
  })
}

async function getState(page) {
  return page.evaluate(() => {
    const surface = document.querySelector('.transfer-panel-demo__surface')
    const root = document.querySelector('.lx-transfer-panel')
    const message = document.querySelector('.transfer-panel-demo__message')
    return {
      hostState: [...document.querySelectorAll('.transfer-panel-demo__toolbar button')]
        .find((node) => node.getAttribute('aria-pressed') === 'true')
        ?.textContent?.trim() ?? null,
      rootPresent: Boolean(root),
      surfaceBusy: surface?.getAttribute('aria-busy') ?? null,
      surfaceClass: surface?.className ?? null,
      rootOpacity: root ? getComputedStyle(root).opacity : null,
      rootPointerEvents: root ? getComputedStyle(root).pointerEvents : null,
      messageRole: message?.getAttribute('role') ?? null,
      messageText: message?.textContent?.trim() ?? null,
      retryPresent: Boolean(message?.querySelector('button')),
      panelLabels: [...document.querySelectorAll('.lx-transfer-panel__panel')].map((node) => ({
        role: node.getAttribute('role'),
        label: node.getAttribute('aria-label'),
        labelledby: node.getAttribute('aria-labelledby'),
      })),
    }
  })
}

const desktop = await openPage({ width: 1440, height: 900 })
await capture(desktop.page, 'desktop-initial')
evidence.checks.desktopInitial = await getLayout(desktop.page)

const sourceSearch = desktop.page.getByRole('searchbox', { name: '筛选待选节点' })
await sourceSearch.fill('巡检')
await capture(desktop.page, 'desktop-source-filter')
evidence.checks.desktopSourceFilter = await desktop.page.evaluate(() => ({
  query: document.querySelector('input[aria-label="筛选待选节点"]')?.value,
  treeText: document.querySelector('.lx-transfer-panel__tree')?.textContent?.trim() ?? null,
}))
await sourceSearch.fill('')

const selectedSearch = desktop.page.getByRole('searchbox', { name: '在已选项中检索' })
await selectedSearch.fill('DEPT-03')
await capture(desktop.page, 'desktop-selected-code-filter')
evidence.checks.desktopMetadataFilter = await desktop.page.evaluate(() => ({
  query: document.querySelector('input[aria-label="在已选项中检索"]')?.value,
  visibleItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((node) => node.textContent?.trim()),
}))
await desktop.page.getByRole('button', { name: '清除已选项筛选' }).click()

await desktop.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(desktop.page, 'desktop-hud')
evidence.checks.desktopHud = await desktop.page.evaluate(() => {
  const surface = document.querySelector('.transfer-panel-demo')
  const panel = document.querySelector('.lx-transfer-panel__panel')
  const primary = document.querySelector('.lx-transfer-panel__controls button:first-child')
  return {
    hudClass: surface?.className ?? null,
    panelBackground: panel ? getComputedStyle(panel).backgroundColor : null,
    primaryBackground: primary ? getComputedStyle(primary).backgroundColor : null,
  }
})

await desktop.page.getByRole('button', { name: '空结果' }).click()
await capture(desktop.page, 'desktop-empty')
evidence.checks.desktopEmpty = { layout: await getLayout(desktop.page), state: await getState(desktop.page) }

await desktop.page.getByRole('button', { name: '加载中' }).click()
await capture(desktop.page, 'desktop-loading')
evidence.checks.desktopLoading = { layout: await getLayout(desktop.page), state: await getState(desktop.page) }

await desktop.page.getByRole('button', { name: '加载失败' }).click()
await capture(desktop.page, 'desktop-error')
evidence.checks.desktopError = { layout: await getLayout(desktop.page), state: await getState(desktop.page) }
await desktop.page.getByRole('button', { name: '重试' }).click()
await capture(desktop.page, 'desktop-error-retry')
evidence.checks.desktopRetry = await getState(desktop.page)
await desktop.context.close()

const mobile = await openPage({ width: 375, height: 812 })
await capture(mobile.page, 'mobile-375-initial')
evidence.checks.mobileInitial = await getLayout(mobile.page)

await mobile.page.getByRole('searchbox', { name: '在已选项中检索' }).fill('DEPT-03')
await mobile.page.getByRole('button', { name: '清除已选项筛选' }).focus()
await capture(mobile.page, 'mobile-375-filter-clear-focus')
evidence.checks.mobileFilterClear = await mobile.page.evaluate(() => {
  const node = document.activeElement
  const rect = node?.getBoundingClientRect()
  return {
    value: document.querySelector('input[aria-label="在已选项中检索"]')?.value,
    active: { tag: node?.tagName, aria: node?.getAttribute('aria-label') },
    rect: rect ? { width: rect.width, height: rect.height } : null,
    outline: node ? getComputedStyle(node).outline : null,
  }
})
await mobile.page.getByRole('button', { name: '清除已选项筛选' }).click()
await mobile.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(mobile.page, 'mobile-375-hud')
evidence.checks.mobileHud = await getLayout(mobile.page)
await mobile.context.close()

const reduced = await openPage({ width: 375, height: 812 }, true)
await reduced.page.getByRole('searchbox', { name: '筛选待选节点' }).focus()
await capture(reduced.page, 'mobile-375-reduced-motion')
evidence.checks.reducedMotion = await reduced.page.evaluate(() => ({
  media: matchMedia('(prefers-reduced-motion: reduce)').matches,
  transitions: [...document.querySelectorAll('.lx-transfer-panel__controls button, .lx-transfer-panel__selected-item')]
    .slice(0, 5)
    .map((node) => ({ transitionDuration: getComputedStyle(node).transitionDuration, animationDuration: getComputedStyle(node).animationDuration })),
}))
await reduced.context.close()

evidence.finishedAt = new Date().toISOString()
await fs.writeFile(`${outDir}/browser-evidence.json`, JSON.stringify(evidence, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
