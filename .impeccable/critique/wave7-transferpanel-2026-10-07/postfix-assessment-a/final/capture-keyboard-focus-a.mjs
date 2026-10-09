import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(
  pathToFileURL(
    'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test/index.mjs',
  ).href,
)

const target = 'http://127.0.0.1:4177/components/lxtransferpanel'
const outDir =
  'F:/work/linkx-admin/.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-assessment-a/final'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))
await page.goto(target, { waitUntil: 'networkidle' })
await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()

const targetButton = page.getByRole('button', { name: '清除已选项筛选' })
const tabPath = []
let reached = false
for (let index = 0; index < 120; index += 1) {
  await page.keyboard.press('Tab')
  const active = await page.evaluate(() => {
    const node = document.activeElement
    if (!(node instanceof HTMLElement)) return null
    return {
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute('role'),
      ariaLabel: node.getAttribute('aria-label'),
      text: (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
      className: typeof node.className === 'string' ? node.className : '',
    }
  })
  tabPath.push(active)
  if (active?.ariaLabel === '清除已选项筛选') {
    reached = true
    break
  }
  if (active?.ariaLabel === '在已选项中检索') {
    await page.keyboard.type('DEPT-03')
    await page.waitForTimeout(100)
    await page.keyboard.press('Tab')
    const next = await page.evaluate(() => {
      const node = document.activeElement
      if (!(node instanceof HTMLElement)) return null
      return {
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute('role'),
        ariaLabel: node.getAttribute('aria-label'),
        text: (node.innerText || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        className: typeof node.className === 'string' ? node.className : '',
      }
    })
    tabPath.push(next)
    reached = next?.ariaLabel === '清除已选项筛选'
    break
  }
}

let focus = null
if (reached) {
  focus = await targetButton.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    return {
      ariaLabel: node.getAttribute('aria-label'),
      focusVisible: node.matches(':focus-visible'),
      rect: {
        x: Number(rect.x.toFixed(2)),
        y: Number(rect.y.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      },
      outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      boxShadow: style.boxShadow,
      viewport: { width: innerWidth, height: innerHeight },
      scrollY,
    }
  })
  await page.screenshot({ path: `${outDir}/mobile-375-keyboard-tab-focus.png` })
}

const evidence = {
  target,
  capturedAt: new Date().toISOString(),
  viewport: { width: 375, height: 812 },
  method: '从文档页初始焦点连续按 Tab；未调用 focus() 设置目标焦点',
  reached,
  tabCount: tabPath.length,
  tabPath,
  focus,
  pageErrors,
}
await fs.writeFile(
  `${outDir}/keyboard-tab-evidence.json`,
  JSON.stringify(evidence, null, 2),
  'utf8',
)
await context.close()
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
