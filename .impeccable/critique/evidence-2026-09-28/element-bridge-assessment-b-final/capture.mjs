import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(path.resolve('other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const baseUrl = 'http://127.0.0.1:4174/components/element-bridge.html'
const detectorUrl = 'http://127.0.0.1:8400/detect.js'
const outputDir = path.dirname(fileURLToPath(import.meta.url))

const cases = [
  { name: 'desktop-light-normal', viewport: { width: 1280, height: 900 }, hud: false, error: false },
  { name: 'desktop-hud-normal', viewport: { width: 1280, height: 900 }, hud: true, error: false },
  { name: 'desktop-light-error-simulated', viewport: { width: 1280, height: 900 }, hud: false, error: true },
  { name: 'mobile-light-normal', viewport: { width: 390, height: 844 }, hud: false, error: false },
  { name: 'mobile-hud-error-simulated', viewport: { width: 390, height: 844 }, hud: true, error: true },
]

await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const results = []

try {
  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: testCase.viewport, deviceScaleFactor: 1 })
    const consoleMessages = []
    const failedResponses = []
    page.on('console', (message) => {
      consoleMessages.push({ type: message.type(), text: message.text() })
    })
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() })
    })

    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.locator('.lx-control-bridge-demo .el-form-item').filter({ hasText: '协同部门' }).waitFor()
    if (testCase.hud) await page.getByLabel('HUD 深色').check()

    const item = page.locator('.lx-control-bridge-demo .el-form-item').filter({ hasText: '协同部门' })
    const wrapper = item.locator('.el-select__wrapper')
    const readStyle = () =>
      wrapper.evaluate((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return {
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          focused: element.classList.contains('is-focused'),
          border: {
            width: style.borderWidth,
            style: style.borderStyle,
            color: style.borderColor,
            radius: style.borderRadius,
          },
          boxSizing: style.boxSizing,
          boxShadow: style.boxShadow,
          outline: { style: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset },
          background: style.backgroundColor,
          hovered: element.matches(':hover'),
          activeElementMatches: document.activeElement === element.querySelector('.el-select__input'),
        }
      })

    await item.scrollIntoViewIfNeeded()
    const unfocused = await readStyle()
    const nameInput = page.locator('input[placeholder="输入任务名称"]')
    await nameInput.fill('示例任务')
    await nameInput.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await item.scrollIntoViewIfNeeded()
    let keyboardFocused = await readStyle()
    if (!keyboardFocused.focused || !keyboardFocused.activeElementMatches) {
      await item.locator('.el-select__input').focus()
      keyboardFocused = await readStyle()
    }

    if (testCase.error) {
      await page.evaluate(() => {
        const item = [...document.querySelectorAll('.lx-control-bridge-demo .el-form-item')].find((node) =>
          node.querySelector('.el-form-item__label')?.innerText.trim() === '协同部门',
        )
        if (!item) throw new Error('协同部门 FormItem 未找到')
        item.classList.add('is-error')
        const message = document.createElement('div')
        message.className = 'el-form-item__error'
        message.textContent = '视觉模拟：请检查协同部门'
        item.querySelector('.el-form-item__content')?.append(message)
      })
    }

    const stateStyle = await readStyle()
    await page.addScriptTag({ url: detectorUrl })
    await page.waitForTimeout(2500)
    const overlay = await page.evaluate(() => ({
      count: document.querySelectorAll('.impeccable-overlay').length,
      labels: [...document.querySelectorAll('.impeccable-label')].map((label) => label.textContent?.trim()).filter(Boolean),
      targets: [...document.querySelectorAll('*')]
        .filter((element) => element._impeccableOverlay)
        .map((element) => ({
          tag: element.tagName,
          className: typeof element.className === 'string' ? element.className : '',
          label: element._impeccableOverlay.nextElementSibling?.textContent?.trim() || '',
        })),
    }))
    const detectorLogs = consoleMessages.filter((message) => message.text.includes('[impeccable]'))
    const stem = path.join(outputDir, `multiselect-${testCase.name}`)
    await page.screenshot({ path: `${stem}-overlay.png` })

    await page.evaluate(() => {
      document.querySelectorAll('.impeccable-overlay, .impeccable-label, .impeccable-banner').forEach((element) =>
        element.remove(),
      )
    })
    await page.screenshot({ path: `${stem}-focused.png` })

    results.push({
      name: testCase.name,
      viewport: testCase.viewport,
      theme: testCase.hud ? 'HUD 深色' : '浅色',
      errorState: testCase.error ? '仅通过 .is-error 和辅助文字进行视觉模拟；未触发表单校验' : '正常态',
      keyboardFocus: {
        focusedByTabSequence: keyboardFocused.focused && keyboardFocused.activeElementMatches,
        formItemClass: await item.getAttribute('class'),
        ...keyboardFocused,
      },
      unfocused,
      renderedState: stateStyle,
      overlay,
      detectorLogs,
      allConsoleMessages: consoleMessages,
      failedResponses,
      screenshots: [`${path.basename(stem)}-overlay.png`, `${path.basename(stem)}-focused.png`],
    })
    await page.close()
  }
} finally {
  await browser.close()
}

await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(results, null, 2)}\n`)
process.stdout.write(
  `${JSON.stringify(
    results.map((result) => ({
      name: result.name,
      viewport: result.viewport,
      theme: result.theme,
      errorState: result.errorState,
      keyboardFocus: result.keyboardFocus,
      unfocused: result.unfocused,
      renderedState: result.renderedState,
      overlayCount: result.overlay.count,
      detectorSummary: result.detectorLogs.map((message) => message.text),
      failedResponses: result.failedResponses,
      screenshots: result.screenshots,
    })),
    null,
    2,
  )}\n`,
)
