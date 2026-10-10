import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/Administrator/AppData/Local/OpenAI/Codex/runtimes/cua_node/cfb32733c877621e/bin/node_modules/playwright',
)

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(
  'http://127.0.0.1:4189/components/lxtransferpanel.html?assessmentB=geometry',
  { waitUntil: 'networkidle' },
)
await page.locator('.transfer-panel-demo__settings summary').click()
await page.waitForTimeout(250)
const result = await page.evaluate(() => {
  const rect = (element) => {
    if (!element) return null
    const box = element.getBoundingClientRect()
    return {
      tag: element.tagName,
      className: element.className,
      text: element.textContent?.trim(),
      left: Math.round(box.left),
      top: Math.round(box.top),
      right: Math.round(box.right),
      bottom: Math.round(box.bottom),
      width: Math.round(box.width),
      height: Math.round(box.height),
    }
  }
  const buttons = [...document.querySelectorAll('.transfer-panel-demo button')]
    .filter((element) => ['空结果', '加载中'].includes(element.textContent?.trim()))
    .map(rect)
  const select = rect(document.querySelector('.transfer-panel-demo select'))
  const title = rect(document.querySelector('.lx-transfer-panel__title'))
  const scroll = rect(document.querySelector('.lx-transfer-panel__scroll'))
  return { buttons, select, title, scroll }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
