import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const baseUrl = 'http://127.0.0.1:4174/components/element-bridge.html?multiselect-detector-current=20260928'
const outputDir = path.resolve('.impeccable/critique/evidence-2026-09-28/multiselect-current-verified')
const executablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const cases = [
  { name: 'desktop-light', width: 1280, height: 900, hud: false },
  { name: 'desktop-hud', width: 1280, height: 900, hud: true },
  { name: 'mobile-375-light', width: 375, height: 812, hud: false },
  { name: 'mobile-375-hud', width: 375, height: 812, hud: true },
]
await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath })
const results = []
try {
  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height }, deviceScaleFactor: 1 })
    const consoleMessages = []
    const failedResponses = []
    page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
    page.on('response', (response) => { if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() }) })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    const item = page.locator('.lx-control-bridge-demo .el-form-item').filter({ hasText: '协同部门' }).first()
    const wrapper = item.locator('.el-select__wrapper').first()
    const input = item.locator('.el-select__input').first()
    await wrapper.waitFor({ state: 'visible' })
    if (testCase.hud) { await page.getByLabel('HUD 深色').check(); await page.waitForTimeout(250) }
    const read = async (label) => wrapper.evaluate((element, label) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      const before = getComputedStyle(element, '::before')
      const after = getComputedStyle(element, '::after')
      const ancestors = []
      let current = element
      for (let depth = 0; current && depth < 4; depth += 1, current = current.parentElement) {
        const s = getComputedStyle(current)
        const r = current.getBoundingClientRect()
        ancestors.push({ depth, tag: current.tagName, className: String(current.className || ''), rect: { x: r.x, y: r.y, width: r.width, height: r.height }, border: s.border, boxShadow: s.boxShadow, outline: s.outline, pseudoBefore: getComputedStyle(current, '::before').content, pseudoAfter: getComputedStyle(current, '::after').content })
      }
      return {
        label,
        className: String(element.className || ''),
        ariaExpanded: element.getAttribute('aria-expanded'),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        border: { width: style.borderWidth, style: style.borderStyle, color: style.borderColor, radius: style.borderRadius },
        boxShadow: style.boxShadow,
        outline: { style: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor },
        boxSizing: style.boxSizing,
        background: style.backgroundColor,
        transition: { property: style.transitionProperty, duration: style.transitionDuration },
        pseudoBefore: { content: before.content, display: before.display, position: before.position, border: before.border, boxShadow: before.boxShadow },
        pseudoAfter: { content: after.content, display: after.display, position: after.position, border: after.border, boxShadow: after.boxShadow },
        ancestors,
      }
    }, label)
    const before = await read('idle')
    await input.focus(); await page.waitForTimeout(300)
    const focused = await read('focused')
    await page.screenshot({ path: path.join(outputDir, `${testCase.name}-focused.png`), fullPage: true })
    await page.keyboard.press('Enter'); await page.waitForTimeout(300)
    const expanded = await read('expanded')
    await page.screenshot({ path: path.join(outputDir, `${testCase.name}-expanded.png`), fullPage: true })
    await page.keyboard.press('Escape'); await page.waitForTimeout(100)
    await item.evaluate((element) => element.classList.add('is-error'))
    await input.focus(); await page.waitForTimeout(300)
    const errorFocused = await read('error-focused')
    await page.screenshot({ path: path.join(outputDir, `${testCase.name}-error-focused.png`), fullPage: true })
    const errorItemClass = await item.getAttribute('class')
    results.push({
      name: testCase.name,
      viewport: { width: testCase.width, height: testCase.height },
      theme: testCase.hud ? 'HUD 深色' : '浅色',
      errorSimulated: true,
      before, focused, expanded, errorFocused, errorItemClass,
      overflow: await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth })),
      consoleMessages, failedResponses,
    })
    await page.close()
  }
} finally { await browser.close() }
await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(results, null, 2)}\n`)
console.log(JSON.stringify({ outputDir, cases: results.map((result) => ({ name: result.name, viewport: result.viewport, before: result.before, focused: result.focused, expanded: result.expanded, errorFocused: result.errorFocused, overflow: result.overflow, failedResponses: result.failedResponses.length })) }, null, 2))
