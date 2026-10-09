import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(
  resolve(process.cwd(), 'other-admin/admin-vue3/package.json'),
)
const { chromium } = require('@playwright/test')
const outputDir = resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-postfix-final-2026-10-08/assessment-a/evidence',
)

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
await page.goto('http://127.0.0.1:4174/components/lxtransferpanel', {
  waitUntil: 'networkidle',
  timeout: 30000,
})
await page.locator('.lx-transfer-panel').waitFor({ state: 'visible' })
await page.locator('.lx-transfer-panel__tree [role="treeitem"]').first().focus()
await page.keyboard.press('ArrowDown')

const states = []
for (const width of [430, 390, 359, 430]) {
  await page.setViewportSize({ width, height: 900 })
  await page.waitForTimeout(160)
  const state = await page.evaluate(() => {
    const active = document.activeElement
    const row = active?.closest('[role="treeitem"]')
    const firstRow = document.querySelector(
      '.lx-transfer-panel__tree [role="treeitem"]',
    )
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    return {
      width: innerWidth,
      activeTag: active?.tagName ?? null,
      activeRole: active?.getAttribute('role') ?? null,
      activeKey: row?.getAttribute('data-lx-tree-key') ?? null,
      activeIsFocused: Boolean(row && row === active),
      activeMatchesFocusVisible: Boolean(row?.matches(':focus-visible')),
      activeRect: rect(row),
      firstRowRect: rect(firstRow),
      scrollTop: document.querySelector('.lx-transfer-panel__tree .lx-virtual-tree__viewport')?.scrollTop ?? null,
      visibleTreeItems: document.querySelectorAll('.lx-transfer-panel__tree [role="treeitem"]').length,
    }
  })
  const screenshot = resolve(outputDir, `transferpanel-focus-${width}.png`)
  await page.screenshot({ path: screenshot, fullPage: false })
  states.push({ ...state, screenshot })
}

await writeFile(
  resolve(outputDir, 'focus-resize-observations.json'),
  `${JSON.stringify(states, null, 2)}\n`,
)
process.stdout.write(`${JSON.stringify(states, null, 2)}\n`)
await context.close()
await browser.close()
