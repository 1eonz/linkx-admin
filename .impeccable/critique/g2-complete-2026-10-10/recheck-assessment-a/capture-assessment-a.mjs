import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright')
const out = path.resolve('.impeccable/critique/g2-complete-2026-10-10/recheck-assessment-a')
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const views = [
  { name: 'searchbar-desktop-light', url: 'http://127.0.0.1:4177/components/lxsearchbar', width: 1440, height: 1000 },
  { name: 'searchbar-mobile-375-light', url: 'http://127.0.0.1:4177/components/lxsearchbar', width: 375, height: 900 },
  { name: 'statusswitch-desktop-light', url: 'http://127.0.0.1:4177/components/lxstatusswitch', width: 1440, height: 1000 },
  { name: 'statusswitch-mobile-375-light', url: 'http://127.0.0.1:4177/components/lxstatusswitch', width: 375, height: 900 },
]
const evidence = []
for (const view of views) {
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const consoleLogs = []
  page.on('console', (message) => consoleLogs.push({ type: message.type(), text: message.text() }))
  await page.goto(view.url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.evaluate(() => { document.title = '[Human] Assessment A'; window.__impeccableAssessmentA = true })
  await page.screenshot({ path: path.join(out, 'screenshots', `${view.name}-initial.png`), fullPage: true })
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    title: document.title,
    roleSearch: document.querySelector('[role="search"]')?.getAttribute('aria-label'),
    switches: [...document.querySelectorAll('[role="switch"]')].map((el) => ({ label: el.getAttribute('aria-label'), labelledby: el.getAttribute('aria-labelledby'), busy: el.getAttribute('aria-busy') })),
  }))
  if (view.url.includes('lxsearchbar')) {
    const expand = page.getByRole('button', { name: /展开检索条件/ }).first()
    if (await expand.count()) {
      await expand.click()
      await page.screenshot({ path: path.join(out, 'screenshots', `${view.name}-expanded.png`), fullPage: true })
    }
    await page.keyboard.press('Tab')
    await page.screenshot({ path: path.join(out, 'screenshots', `${view.name}-focus.png`), fullPage: true })
  } else {
    const confirmSwitch = page.locator('.el-switch').last()
    if (await confirmSwitch.count()) {
      await confirmSwitch.focus()
      await page.screenshot({ path: path.join(out, 'screenshots', `${view.name}-focus.png`), fullPage: true })
      await confirmSwitch.click({ timeout: 5000 })
      await page.waitForTimeout(250)
      await page.screenshot({ path: path.join(out, 'screenshots', `${view.name}-confirm.png`), fullPage: true })
    }
  }
  evidence.push({ ...view, metrics, console: consoleLogs, bodyText: (await page.locator('body').innerText()).slice(0, 3000) })
  await context.close()
}
await browser.close()
fs.writeFileSync(path.join(out, 'browser-evidence.json'), JSON.stringify(evidence, null, 2))
console.log(JSON.stringify(evidence, null, 2))
