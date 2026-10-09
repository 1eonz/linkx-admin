import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../other-admin/admin-vue3/node_modules/@playwright/test/index.mjs'

const baseUrl = 'http://127.0.0.1:4175/components/lxtransferpanel'
const outputDir = fileURLToPath(new URL('.', import.meta.url))
mkdirSync(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function readLayout() {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x * 100) / 100,
        y: Math.round(box.y * 100) / 100,
        width: Math.round(box.width * 100) / 100,
        height: Math.round(box.height * 100) / 100,
      }
    }
    const root = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const leftTree = panels[0]?.querySelector('.lx-virtual-tree__viewport')
    const selectedList = panels[1]?.querySelector('.lx-transfer-panel__selected')
    const styles = root ? getComputedStyle(root) : null
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      root: rect(root),
      gridTemplateColumns: styles?.gridTemplateColumns ?? null,
      gap: styles?.gap ?? null,
      panels: panels.map((panel) => ({
        rect: rect(panel),
        height: getComputedStyle(panel).height,
      })),
      leftTree: rect(leftTree),
      selectedList: {
        rect: rect(selectedList),
        maxHeight: selectedList ? getComputedStyle(selectedList).maxHeight : null,
      },
      rows: [...document.querySelectorAll('.lx-transfer-panel__panel:first-child [role="treeitem"]')].map(
        (row) => ({
          text: row.textContent?.trim() ?? '',
          ariaLabel: row.getAttribute('aria-label'),
          dataKey: row.getAttribute('data-lx-tree-key'),
        }),
      ),
      selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map(
        (item) => item.textContent?.trim() ?? '',
      ),
      selectedEmpty: document.querySelector('.lx-transfer-panel__empty')?.textContent?.trim() ?? null,
      nodeStatusLikeText: [...document.querySelectorAll('[data-status], [data-code], .status, .code')].map(
        (element) => element.textContent?.trim() ?? '',
      ),
    }
  })
}

async function readThemeAndMotion() {
  return page.evaluate(() => {
    const panel = document.querySelector('.lx-transfer-panel__panel')
    const control = document.querySelector('.lx-transfer-panel__controls button')
    const firstRow = document.querySelector('.lx-transfer-panel__selected-item')
    const elements = [panel, control, firstRow].filter(Boolean)
    return {
      hudClass: document.querySelector('.transfer-panel-demo')?.classList.contains('lx-theme-hud') ?? false,
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : null,
      controlBackground: control ? getComputedStyle(control).backgroundColor : null,
      controlTransition: control ? getComputedStyle(control).transitionDuration : null,
      selectedTransition: firstRow ? getComputedStyle(firstRow).transitionDuration : null,
      maxAnimationDuration: Math.max(
        ...elements.map((element) => Number.parseFloat(getComputedStyle(element).animationDuration) || 0),
      ),
    }
  })
}

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${outputDir}desktop-ready.png`, fullPage: true })
const desktopReady = await readLayout()

const keyboard = await page.evaluate(() => {
  const target = document.querySelector('.lx-transfer-panel__header-actions button:nth-of-type(2)')
  target?.focus()
  if (!target) return null
  const style = getComputedStyle(target)
  return {
    label: target.textContent?.trim() ?? '',
    focused: document.activeElement === target,
    outlineWidth: style.outlineWidth,
    outlineStyle: style.outlineStyle,
  }
})

await page.getByRole('button', { name: '加载中' }).click()
const loading = await page.evaluate(() => ({
  message: document.querySelector('.transfer-panel-demo__message')?.textContent?.trim() ?? null,
  role: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
  panelVisible: Boolean(document.querySelector('.lx-transfer-panel')),
}))
await page.screenshot({ path: `${outputDir}state-loading.png`, fullPage: true })

await page.getByRole('button', { name: '加载失败' }).click()
const error = await page.evaluate(() => ({
  message: document.querySelector('.transfer-panel-demo__message')?.textContent?.trim() ?? null,
  role: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role') ?? null,
  retry: [...document.querySelectorAll('.transfer-panel-demo__message button')].map((button) => button.textContent?.trim()),
}))
await page.screenshot({ path: `${outputDir}state-error.png`, fullPage: true })

await page.getByRole('button', { name: '重试' }).click()
await page.getByRole('button', { name: '空结果' }).click()
const empty = await page.evaluate(() => ({
  treeText: document.querySelector('.lx-virtual-tree')?.textContent?.trim() ?? null,
  selectedItems: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => item.textContent?.trim() ?? ''),
  emptyText: document.querySelector('.lx-virtual-tree__empty')?.textContent?.trim() ?? null,
}))
await page.screenshot({ path: `${outputDir}state-empty.png`, fullPage: true })

await page.getByRole('button', { name: '正常数据' }).click()
await page.getByLabel('HUD 深色主题').check()
const hud = await readThemeAndMotion()
await page.screenshot({ path: `${outputDir}desktop-hud.png`, fullPage: true })

await page.emulateMedia({ reducedMotion: 'reduce' })
const reducedMotion = await readThemeAndMotion()

await page.setViewportSize({ width: 375, height: 812 })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
const mobile = await readLayout()
await page.screenshot({ path: `${outputDir}mobile-ready.png`, fullPage: true })

const result = {
  route: baseUrl,
  capturedAt: new Date().toISOString(),
  desktopReady,
  keyboard,
  loading,
  error,
  empty,
  hud,
  reducedMotion,
  mobile,
  artifacts: [
    'desktop-ready.png',
    'desktop-hud.png',
    'mobile-ready.png',
    'state-loading.png',
    'state-error.png',
    'state-empty.png',
  ],
}
writeFileSync(`${outputDir}runtime.json`, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
await browser.close()
