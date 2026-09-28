import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')

const baseUrl = 'http://127.0.0.1:4174/components/element-bridge.html?multiselect-review=20260928'
const outputDir = path.resolve('.impeccable/critique/evidence-2026-09-28/multiselect-current-visual')
const executablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const cases = [
  { name: 'desktop-light', width: 1280, height: 900, hud: false },
  { name: 'desktop-hud', width: 1280, height: 900, hud: true },
  { name: 'mobile-375-light', width: 375, height: 812, hud: false },
  { name: 'mobile-375-hud', width: 375, height: 812, hud: true },
  { name: 'mobile-390-light', width: 390, height: 844, hud: false },
  { name: 'mobile-390-hud', width: 390, height: 844, hud: true },
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
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() })
    })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.locator('.lx-control-bridge-demo .el-form-item').filter({ hasText: '协同部门' }).waitFor()
    if (testCase.hud) await page.getByLabel('HUD 深色').check()
    const item = page.locator('.lx-control-bridge-demo .el-form-item').filter({ hasText: '协同部门' })
    const wrapper = item.locator('.el-select__wrapper')
    const read = () => wrapper.evaluate((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      const input = element.querySelector('.el-select__input')
      const inputRect = input?.getBoundingClientRect()
      const parent = element.parentElement?.getBoundingClientRect()
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        parentRect: parent ? { x: parent.x, y: parent.y, width: parent.width, height: parent.height } : null,
        border: { width: style.borderWidth, style: style.borderStyle, color: style.borderColor, radius: style.borderRadius },
        boxShadow: style.boxShadow,
        outline: { style: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor },
        boxSizing: style.boxSizing,
        background: style.backgroundColor,
        focusedClass: element.classList.contains('is-focused'),
        activeElementTag: document.activeElement?.tagName || null,
        activeElementClass: document.activeElement?.className || null,
        inputRect: inputRect ? { x: inputRect.x, y: inputRect.y, width: inputRect.width, height: inputRect.height } : null,
      }
    })
    await item.scrollIntoViewIfNeeded()
    const before = await read()
    const input = item.locator('.el-select__input')
    await input.focus()
    const focused = await read()
    await page.screenshot({ path: path.join(outputDir, `${testCase.name}-focused.png`), fullPage: true })
    await item.click()
    const expanded = await read()
    const popup = page.locator('.el-select-dropdown:visible')
    const popupBox = await popup.count() ? popup.boundingBox() : null
    await page.screenshot({ path: path.join(outputDir, `${testCase.name}-expanded.png`), fullPage: true })
    await page.keyboard.press('Escape')
    const afterEscape = await read()
    results.push({
      name: testCase.name,
      viewport: { width: testCase.width, height: testCase.height },
      theme: testCase.hud ? 'HUD 深色' : '浅色',
      before,
      focused,
      expanded,
      afterEscape,
      popupBox,
      overflow: await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth })),
      consoleMessages,
      failedResponses,
    })
    await page.close()
  }
} finally {
  await browser.close()
}

await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(results, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
