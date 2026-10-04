;(async () => {
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright')

const outputDir = path.resolve('F:/work/linkx-admin/.impeccable/critique/wave5-postfix-2026-09-30/assessment-b')
const screenshotDir = path.join(outputDir, 'screenshots')
const baseUrl = 'http://localhost:4185'
const detectorUrl = 'http://127.0.0.1:8400/detect.js?wave5-postfix=20260930'
fs.mkdirSync(screenshotDir, { recursive: true })

const externalRequests = []
const views = []
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext({ viewport: { width: 1265, height: 720 }, deviceScaleFactor: 1 })
const page = await context.newPage()
let consoleEntries = []
let requestEntries = []

page.on('console', (msg) => {
  consoleEntries.push({ type: msg.type(), text: msg.text(), location: msg.location() })
})
page.on('pageerror', (error) => {
  consoleEntries.push({ type: 'pageerror', text: error.message })
})
page.on('request', (request) => {
  const entry = { url: request.url(), method: request.method(), resourceType: request.resourceType() }
  requestEntries.push(entry)
  try {
    const parsed = new URL(entry.url)
    if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && !['data:', 'blob:'].includes(parsed.protocol)) {
      externalRequests.push(entry)
    }
  } catch {
    // Keep malformed request URLs in the per-view request log.
  }
})

function resetEvidence() {
  consoleEntries = []
  requestEntries = []
}

async function injectDetector(label) {
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

async function saveEvidence(name, label, extra = {}) {
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: false })
  fs.writeFileSync(path.join(screenshotDir, `${name}.console.json`), JSON.stringify(consoleEntries, null, 2))
  fs.writeFileSync(path.join(screenshotDir, `${name}.requests.json`), JSON.stringify(requestEntries, null, 2))
  fs.writeFileSync(path.join(screenshotDir, `${name}.meta.json`), JSON.stringify({ label, url: page.url(), viewport: await page.evaluate(() => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, visual: { width: window.visualViewport?.width, height: window.visualViewport?.height } })), ...extra }, null, 2))
  views.push({ name, label, url: page.url(), consoleCount: consoleEntries.length, requestCount: requestEntries.length, extra })
}

async function openAndInject(pathname, label, viewport) {
  await page.setViewportSize(viewport)
  resetEvidence()
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await injectDetector(label)
}

async function clickByText(text) {
  await page.getByRole('button', { name: text, exact: true }).click()
}

async function toggleCheckbox(name) {
  const locator = page.getByRole('checkbox', { name, exact: true })
  const checked = await locator.isChecked()
  if (!checked) await locator.click()
}

// LxDialog: desktop bright/HUD, open and Escape, then 375px bright/HUD.
await openAndInject('/components/lxdialog.html', 'Dialog desktop bright', { width: 1265, height: 720 })
await clickByText('新建涉警联动工单')
await page.waitForTimeout(600)
await saveEvidence('dialog-desktop-bright-open', 'Dialog desktop bright open')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await saveEvidence('dialog-desktop-bright-esc', 'Dialog desktop bright after Escape')

await toggleCheckbox('HUD 深色主题')
await clickByText('新建涉警联动工单')
await page.waitForTimeout(600)
await saveEvidence('dialog-desktop-hud-open', 'Dialog desktop HUD open')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await saveEvidence('dialog-desktop-hud-esc', 'Dialog desktop HUD after Escape')

await openAndInject('/components/lxdialog.html', 'Dialog mobile bright', { width: 375, height: 900 })
await clickByText('新建涉警联动工单')
await page.waitForTimeout(700)
await saveEvidence('dialog-mobile-bright-open', 'Dialog mobile bright open')
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await saveEvidence('dialog-mobile-bright-esc', 'Dialog mobile bright after Escape')

await toggleCheckbox('HUD 深色主题')
await clickByText('新建涉警联动工单')
await page.waitForTimeout(700)
await saveEvidence('dialog-mobile-hud-open', 'Dialog mobile HUD open')

// LxDrawer: desktop/mobile bright and HUD. Wait for the slide animation to settle.
await openAndInject('/components/lxdrawer.html', 'Drawer desktop bright', { width: 1265, height: 720 })
await clickByText('打开审计抽屉')
await page.waitForTimeout(1600)
await saveEvidence('drawer-desktop-bright-open', 'Drawer desktop bright open', { animationSettledMs: 1600 })
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
await saveEvidence('drawer-desktop-bright-esc', 'Drawer desktop bright after Escape', { animationSettledMs: 1600 })

await toggleCheckbox('HUD 深色主题')
await clickByText('打开审计抽屉')
await page.waitForTimeout(1600)
await saveEvidence('drawer-desktop-hud-open', 'Drawer desktop HUD open', { animationSettledMs: 1600 })

await openAndInject('/components/lxdrawer.html', 'Drawer mobile bright', { width: 375, height: 900 })
await clickByText('打开审计抽屉')
await page.waitForTimeout(1600)
await saveEvidence('drawer-mobile-bright-open', 'Drawer mobile bright open', { animationSettledMs: 1600 })

await toggleCheckbox('HUD 深色主题')
await clickByText('打开审计抽屉')
await page.waitForTimeout(1600)
await saveEvidence('drawer-mobile-hud-open', 'Drawer mobile HUD open', { animationSettledMs: 1600 })

// PageCard: error state and the recovery action.
await openAndInject('/components/lxpagecard.html', 'PageCard desktop bright', { width: 1265, height: 720 })
await page.getByRole('checkbox', { name: '展示错误态', exact: true }).click()
await page.waitForTimeout(350)
await saveEvidence('pagecard-desktop-error', 'PageCard desktop error state')
const refresh = page.getByRole('button', { name: '刷新概况', exact: true })
if (await refresh.count()) {
  await refresh.click()
  await page.waitForTimeout(500)
}
await saveEvidence('pagecard-desktop-error-recovered', 'PageCard desktop error recovery action')

// API table scroll evidence on both requested documentation pages.
await openAndInject('/components/lxdialog.html', 'Dialog API table scroll', { width: 1265, height: 720 })
await page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((node) => node.textContent?.trim().startsWith('API'))
  heading?.scrollIntoView({ block: 'start' })
  window.scrollBy(0, 160)
})
await page.waitForTimeout(400)
await saveEvidence('dialog-api-table-scroll', 'Dialog API table scrolled')

await openAndInject('/components/lxdrawer.html', 'Drawer API table scroll', { width: 1265, height: 720 })
await page.evaluate(() => {
  const heading = [...document.querySelectorAll('h2')].find((node) => node.textContent?.trim().startsWith('API'))
  heading?.scrollIntoView({ block: 'start' })
  window.scrollBy(0, 160)
})
await page.waitForTimeout(400)
await saveEvidence('drawer-api-table-scroll', 'Drawer API table scrolled')

const requestHosts = {}
for (const view of views) {
  const requestPath = path.join(screenshotDir, `${view.name}.requests.json`)
  const requests = JSON.parse(fs.readFileSync(requestPath, 'utf8'))
  for (const request of requests) {
    try {
      const parsed = new URL(request.url)
      requestHosts[parsed.hostname] = (requestHosts[parsed.hostname] || 0) + 1
    } catch {
      requestHosts.invalid = (requestHosts.invalid || 0) + 1
    }
  }
}
fs.writeFileSync(path.join(outputDir, 'external-requests-summary.json'), JSON.stringify({ totalViews: views.length, requestHosts, externalRequestCount: externalRequests.length, externalRequests }, null, 2))
fs.writeFileSync(path.join(outputDir, 'browser-run-summary.json'), JSON.stringify({ baseUrl, detectorUrl, views, browser: 'Playwright Chromium headless fallback (CUA browser unavailable in subagent)' }, null, 2))
await browser.close()
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
