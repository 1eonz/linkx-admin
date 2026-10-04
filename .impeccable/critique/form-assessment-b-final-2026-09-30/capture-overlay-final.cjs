const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const outputDir = path.join(__dirname, 'browser')
const overlayUrl = 'http://127.0.0.1:8400/detect.js'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const cases = [
  { key: 'lxform-desktop-light', route: 'lxform', width: 1280, height: 800 },
  { key: 'lxform-375-light', route: 'lxform', width: 375, height: 812 },
  { key: 'lxdynamicform-desktop-light', route: 'lxdynamicform', width: 1280, height: 800 },
  { key: 'lxdynamicform-375-light', route: 'lxdynamicform', width: 375, height: 812 },
  { key: 'lxdynamicform-desktop-hud-reduced', route: 'lxdynamicform', width: 1280, height: 800, hud: true, reducedMotion: true },
  { key: 'lxdynamicform-375-hud-reduced', route: 'lxdynamicform', width: 375, height: 812, hud: true, reducedMotion: true },
]
async function openSettings(page) {
  const details = page.locator('details.dynamic-form-demo__settings').first()
  if (!(await details.count())) return false
  await details.evaluate((element) => { element.open = true })
  await sleep(200)
  return true
}
async function setupState(page, item) {
  let settingsOpened = false
  let hudControl = null
  let candidateError = false
  if (item.route === 'lxdynamicform') {
    settingsOpened = await openSettings(page)
    if (item.hud) {
      const control = page.locator('.dynamic-form-demo__toolbar label').filter({ hasText: 'HUD 深色主题' }).first()
      if (await control.count()) {
        await control.scrollIntoViewIfNeeded()
        hudControl = { visible: await control.isVisible() }
        if (hudControl.visible) {
          await control.click({ timeout: 5000 })
          await sleep(400)
        }
      } else hudControl = { visible: false, error: 'control not found' }
    }
    const failedButton = page.getByRole('button', { name: '失败' }).first()
    if (await failedButton.count()) {
      await failedButton.click()
      candidateError = true
      await sleep(450)
    }
  } else {
    const submit = page.getByRole('button', { name: '提交校验' }).first()
    if (await submit.count()) { await submit.click(); await sleep(350) }
  }
  return { settingsOpened, hudControl, candidateError }
}
async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const item of cases) {
      const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, reducedMotion: item.reducedMotion ? 'reduce' : 'no-preference', colorScheme: item.hud ? 'dark' : 'light' })
      page.setDefaultTimeout(7000)
      const consoleMessages = []
      const pageErrors = []
      const failedRequests = []
      const requestedOrigins = new Set()
      page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
      page.on('pageerror', (error) => pageErrors.push(String(error)))
      page.on('request', (request) => { try { requestedOrigins.add(new URL(request.url()).origin) } catch {} })
      page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))
      const url = `http://127.0.0.1:4174/components/${item.route}.html`
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 12000 })
      await sleep(450)
      const preflight = await page.evaluate(() => {
        const marker = document.createElement('script')
        marker.id = 'impeccable-b-final-overlay-preflight'
        marker.textContent = 'window.__impeccableBFinalOverlayPreflight = true'
        document.head.appendChild(marker)
        document.title = `[Human] ${document.title}`
        return { markerPresent: Boolean(document.getElementById('impeccable-b-final-overlay-preflight')), markerExecuted: window.__impeccableBFinalOverlayPreflight === true, title: document.title }
      })
      const setup = await setupState(page, item)
      const demoRoot = item.route === 'lxform' ? page.locator('.demo-box').first() : page.locator('.dynamic-form-demo').first()
      await demoRoot.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      let injectionError = null
      try { await page.addScriptTag({ url: overlayUrl }); await sleep(2500) } catch (error) { injectionError = String(error) }
      await sleep(200)
      const overlay = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('.impeccable-overlay')]
        const visible = nodes.filter((node) => { const style = getComputedStyle(node); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 })
        const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null
        return { detectorScriptPresent: [...document.scripts].some((script) => script.src.includes('/detect.js')), detectorFunctionAvailable: typeof window.impeccableDetect === 'function', findings, overlayNodeCount: nodes.length, visibleOverlayNodeCount: visible.length, reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, hudThemeApplied: document.documentElement.classList.contains('lx-theme-hud') || Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud')) }
      })
      const screenshot = `${item.key}-overlay.png`
      await page.screenshot({ path: path.join(outputDir, screenshot), animations: 'disabled' })
      const record = { case: item.key, url, httpStatus: response.status(), viewport: { width: item.width, height: item.height }, preflight, setup, injectionError, overlay, screenshot, requestedOrigins: [...requestedOrigins].sort(), failedRequests, pageErrors, consoleMessages }
      records.push(record)
      await fs.writeFile(path.join(outputDir, `${item.key}.overlay.json`), `${JSON.stringify(record, null, 2)}\n`)
      await page.close()
    }
  } finally { await browser.close() }
  await fs.writeFile(path.join(outputDir, 'overlay-evidence.json'), `${JSON.stringify(records, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(records.map((record) => ({ case: record.case, httpStatus: record.httpStatus, preflight: record.preflight, injectionError: record.injectionError, detectorScriptPresent: record.overlay.detectorScriptPresent, overlayNodeCount: record.overlay.overlayNodeCount, visibleOverlayNodeCount: record.overlay.visibleOverlayNodeCount, hudThemeApplied: record.overlay.hudThemeApplied, reducedMotionMatches: record.overlay.reducedMotionMatches, screenshot: record.screenshot })), null, 2)}\n`)
}
main().catch((error) => { process.stderr.write(`${error?.stack || error}\n`); process.exitCode = 1 })
