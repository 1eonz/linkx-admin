;(async () => {
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright')

const outputDir = path.resolve('F:/work/linkx-admin/.impeccable/critique/wave5-postfix-2026-09-30/assessment-b')
const screenshotDir = path.join(outputDir, 'screenshots')
const baseUrl = 'http://localhost:4185'
const detectorUrl = 'http://127.0.0.1:8400/detect.js?wave5-postfix=20260930'
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext({ viewport: { width: 1265, height: 720 }, deviceScaleFactor: 1 })
const page = await context.newPage()
page.setDefaultTimeout(5000)
let consoleEntries = []
let requestEntries = []
page.on('console', (msg) => consoleEntries.push({ type: msg.type(), text: msg.text(), location: msg.location() }))
page.on('pageerror', (error) => consoleEntries.push({ type: 'pageerror', text: error.message }))
page.on('request', (request) => requestEntries.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() }))

function reset() {
  consoleEntries = []
  requestEntries = []
}

async function open(pathname, label, viewport = { width: 1265, height: 720 }) {
  reset()
  await page.setViewportSize(viewport)
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.evaluate(({ label, detectorUrl }) => {
    document.title = `[Human] ${label}`
    const old = document.getElementById('impeccable-postfix-detector')
    if (old) old.remove()
    const script = document.createElement('script')
    script.id = 'impeccable-postfix-detector'
    script.src = `${detectorUrl}&label=${encodeURIComponent(label)}`
    document.head.appendChild(script)
  }, { label, detectorUrl })
  await page.waitForTimeout(2200)
}

async function directClickButton(text) {
  await page.evaluate((text) => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === text)
    if (!button) throw new Error(`button not found: ${text}`)
    button.click()
  }, text)
}

async function directToggle(labelText) {
  await page.evaluate((labelText) => {
    const input = [...document.querySelectorAll('input[type="checkbox"]')].find((node) => node.parentElement?.textContent?.includes(labelText) || node.closest('label')?.textContent?.includes(labelText))
    if (!input) throw new Error(`checkbox not found: ${labelText}`)
    input.click()
  }, labelText)
}

async function save(name, label, extra = {}) {
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: false })
  fs.writeFileSync(path.join(screenshotDir, `${name}.console.json`), JSON.stringify(consoleEntries, null, 2))
  fs.writeFileSync(path.join(screenshotDir, `${name}.requests.json`), JSON.stringify(requestEntries, null, 2))
  fs.writeFileSync(path.join(screenshotDir, `${name}.meta.json`), JSON.stringify({ label, url: page.url(), viewport: await page.evaluate(() => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, visualWidth: window.visualViewport?.width, visualHeight: window.visualViewport?.height })), ...extra }, null, 2))
}

// Finish Drawer mobile HUD state from the first browser pass.
await open('/components/lxdrawer.html', 'Drawer mobile HUD', { width: 375, height: 900 })
await directToggle('HUD 深色主题')
await directClickButton('打开审计抽屉')
await page.waitForTimeout(1600)
await save('drawer-mobile-hud-open', 'Drawer mobile HUD open', { animationSettledMs: 1600 })

// PageCard error and recovery action.
await open('/components/lxpagecard.html', 'PageCard desktop error recovery')
await directToggle('展示错误态')
await page.waitForTimeout(400)
await save('pagecard-desktop-error', 'PageCard desktop error state')
await directClickButton('刷新概况')
await page.waitForTimeout(500)
await save('pagecard-desktop-error-recovered', 'PageCard desktop error recovery action')

// API table scroll evidence on both requested docs pages.
await open('/components/lxdialog.html', 'Dialog API table scroll')
await page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((node) => node.textContent?.trim().startsWith('API'))
  heading?.scrollIntoView({ block: 'start' })
  window.scrollBy(0, 160)
})
await page.waitForTimeout(350)
await save('dialog-api-table-scroll', 'Dialog API table scrolled')

await open('/components/lxdrawer.html', 'Drawer API table scroll')
await page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((node) => node.textContent?.trim().startsWith('API'))
  heading?.scrollIntoView({ block: 'start' })
  window.scrollBy(0, 160)
})
await page.waitForTimeout(350)
await save('drawer-api-table-scroll', 'Drawer API table scrolled')

const requestFiles = fs.readdirSync(screenshotDir).filter((file) => file.endsWith('.requests.json'))
const hostCounts = {}
const external = []
for (const file of requestFiles) {
  const entries = JSON.parse(fs.readFileSync(path.join(screenshotDir, file), 'utf8'))
  for (const entry of entries) {
    try {
      const parsed = new URL(entry.url)
      hostCounts[parsed.hostname] = (hostCounts[parsed.hostname] || 0) + 1
      if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && !['data:', 'blob:'].includes(parsed.protocol)) external.push({ file, ...entry })
    } catch {
      // Preserve malformed URLs only in the per-view logs.
    }
  }
}
fs.writeFileSync(path.join(outputDir, 'external-requests-summary.json'), JSON.stringify({ requestFiles: requestFiles.length, hostCounts, externalRequestCount: external.length, externalRequests: external }, null, 2))
fs.writeFileSync(path.join(outputDir, 'continuation-summary.json'), JSON.stringify({ completed: ['drawer-mobile-hud-open', 'pagecard-desktop-error', 'pagecard-desktop-error-recovered', 'dialog-api-table-scroll', 'drawer-api-table-scroll'], browser: 'Playwright Chromium headless fallback (CUA browser unavailable in subagent)', baseUrl }, null, 2))
await browser.close()
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
