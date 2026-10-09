import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const baseURL = 'http://127.0.0.1:5173/components/lxtransferpanel'
const outDir = 'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07'
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const evidence = {
  target: baseURL,
  startedAt: new Date().toISOString(),
  server: 'pnpm dev --host 127.0.0.1 (linkx-fe), stop with session 1841 / Ctrl+C',
  captures: [],
  checks: {},
}

async function openPage(viewport, reducedMotion = false) {
  const context = await browser.newContext({
    viewport,
    colorScheme: 'light',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  return { context, page }
}

async function capture(page, name, fullPage = false) {
  const path = `${outDir}/${name}.png`
  await page.screenshot({ path, fullPage })
  evidence.captures.push({ name, path, viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })) })
}

const desktop = await openPage({ width: 1365, height: 900 })
await capture(desktop.page, 'desktop-light-initial', true)
evidence.checks.desktop = await desktop.page.evaluate(() => {
  const root = document.querySelector('.lx-transfer-panel')
  const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
  const rect = root?.getBoundingClientRect()
  return {
    rootRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
    panelRects: panels.map((node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }),
    layout: root?.getAttribute('data-lx-transfer-layout'),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    focusable: [...document.querySelectorAll('button,input,[role="treeitem"]')].length,
  }
})

const sourceSearch = desktop.page.getByRole('searchbox', { name: '筛选待选节点' })
await sourceSearch.fill('巡检')
await capture(desktop.page, 'desktop-source-search', true)
await sourceSearch.fill('')
await desktop.page.getByRole('button', { name: '全部加入' }).click()
await capture(desktop.page, 'desktop-after-bulk-add', true)

await desktop.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(desktop.page, 'desktop-hud-dark', true)

await desktop.page.getByRole('button', { name: '空结果' }).click()
await capture(desktop.page, 'desktop-empty-state', true)
await desktop.page.getByRole('button', { name: '加载中' }).click()
await capture(desktop.page, 'desktop-loading-state', true)
await desktop.page.getByRole('button', { name: '加载失败' }).click()
await capture(desktop.page, 'desktop-error-state', true)
await desktop.context.close()

const mobile = await openPage({ width: 375, height: 900 })
await capture(mobile.page, 'mobile-375-light-initial', true)
evidence.checks.mobile = await mobile.page.evaluate(() => {
  const root = document.querySelector('.lx-transfer-panel')
  const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
  return {
    rootRect: root ? (() => { const r = root.getBoundingClientRect(); return { width: r.width, height: r.height } })() : null,
    panelRects: panels.map((node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    viewport: { width: innerWidth, height: innerHeight },
    minTouchTargets: [...document.querySelectorAll('.lx-transfer-panel button, .transfer-panel-demo__toolbar button, .transfer-panel-demo__toolbar label')].map((node) => { const r = node.getBoundingClientRect(); return { text: node.textContent?.trim(), width: r.width, height: r.height } }),
  }
})
await mobile.page.getByRole('searchbox', { name: '在已选项中检索' }).focus()
await capture(mobile.page, 'mobile-375-keyboard-search-focus', true)
await mobile.page.keyboard.press('Tab')
evidence.checks.keyboard = await mobile.page.evaluate(() => ({ active: { tag: document.activeElement?.tagName, aria: document.activeElement?.getAttribute('aria-label'), text: document.activeElement?.textContent?.trim() }, outline: document.activeElement ? getComputedStyle(document.activeElement).outline : null }))
await mobile.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
await capture(mobile.page, 'mobile-375-hud-dark', true)
await mobile.context.close()

const reduced = await openPage({ width: 375, height: 900 }, true)
await reduced.page.getByRole('searchbox', { name: '筛选待选节点' }).focus()
await capture(reduced.page, 'mobile-375-reduced-motion-focus', true)
evidence.checks.reducedMotion = await reduced.page.evaluate(() => ({ media: matchMedia('(prefers-reduced-motion: reduce)').matches, transitions: [...document.querySelectorAll('.lx-transfer-panel__controls button, .lx-transfer-panel__selected-item')].slice(0, 3).map((node) => getComputedStyle(node).transitionDuration) }))
await reduced.context.close()

evidence.finishedAt = new Date().toISOString()
await fs.writeFile(`${outDir}/browser-evidence.json`, JSON.stringify(evidence, null, 2), 'utf8')
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
