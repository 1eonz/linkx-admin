import { createRequire } from 'node:module'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')

const outputDir = 'F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-04/assessment-b/fresh-5180-2026-10-05'
const targetUrl = 'http://127.0.0.1:5180/components/lxdatepicker'
const helperPort = Number(process.env.IMPECCABLE_HELPER_PORT || 8400)
const evidence = { targetUrl, generatedAt: new Date().toISOString(), views: [], overlay: {} }

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL || 'msedge' })

async function createView(name, width, height, mobile = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  })
  const page = await context.newPage()
  const logs = { console: [], pageErrors: [], failedRequests: [], responses: [], stylesheetResponses: [] }
  page.on('console', (message) => logs.console.push({ type: message.type(), text: message.text() }))
  page.on('pageerror', (error) => logs.pageErrors.push(error.message))
  page.on('requestfailed', (request) => logs.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
  page.on('response', (response) => {
    const request = response.request()
    const row = { url: response.url(), status: response.status(), resourceType: request.resourceType() }
    if (request.resourceType() === 'stylesheet' || /\.css(?:\?|$)/i.test(response.url())) {
      logs.stylesheetResponses.push(row)
    }
    logs.responses.push(row)
  })
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 })
  await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(350)
  const initial = await page.evaluate(() => ({
    title: document.title,
    viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, dpr: window.devicePixelRatio },
    documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    stylesheetLinks: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => ({ href: link.href, media: link.media })),
    visiblePopperCount: Array.from(document.querySelectorAll('.lx-date-picker__popper')).filter((element) => element.getClientRects().length > 0).length,
  }))
  const result = { name, viewport: { width, height, mobile }, httpStatus: response?.status() ?? null, initial, logs }
  evidence.views.push(result)
  return { context, page, result, logs }
}

async function saveState(page, result, screenshotName, extra = {}) {
  const dom = await page.evaluate(() => {
    const poppers = Array.from(document.querySelectorAll('.lx-date-picker__popper'))
    const visible = poppers.filter((element) => element.getClientRects().length > 0)
    return {
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, dpr: window.devicePixelRatio },
      documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      windowScrollY: window.scrollY,
      popperCount: poppers.length,
      visiblePopperCount: visible.length,
      poppers: visible.map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          className: element.className,
          ariaHidden: element.getAttribute('aria-hidden'),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
          scrollTop: element.scrollTop,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          shortcutButtonCount: element.querySelectorAll('.el-picker-panel__shortcut').length,
          shortcutTexts: Array.from(element.querySelectorAll('.el-picker-panel__shortcut')).map((button) => button.textContent?.trim()),
        }
      }),
      hudEnabled: document.querySelector('.lx-date-picker-demo')?.classList.contains('lx-theme-hud') ?? false,
      visibleDatePickerPopperClasses: visible.map((element) => element.className),
    }
  })
  result.states ??= []
  const state = { screenshot: screenshotName, ...dom, ...extra }
  await page.screenshot({ path: path.join(outputDir, screenshotName), animations: 'disabled' })
  result.states.push(state)
  return state
}

async function openRange(page, section = 'range') {
  const inputs = page.locator(`[data-testid="${section}"] .el-range-input`)
  await inputs.first().click({ timeout: 15000 })
  await page.locator('.lx-date-picker__popper[aria-hidden="false"]').first().waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(500)
}

async function injectOverlay(page, viewName, logs) {
  const result = { attempted: true, url: `http://localhost:${helperPort}/detect.js` }
  try {
    await page.evaluate(() => {
      document.title = `${document.title} [Assessment B preflight]`
      const probe = document.createElement('script')
      probe.dataset.assessmentBPreflight = 'true'
      document.head.append(probe)
      probe.remove()
    })
    result.mutablePreflight = true
    await page.addScriptTag({ url: result.url, timeout: 15000 })
    await page.waitForTimeout(2500)
    result.injected = await page.evaluate((url) => Array.from(document.scripts).some((script) => script.src === url), result.url)
    result.consoleFindings = await page.evaluate(() => window.__impeccableAssessmentB ?? null)
    result.console = await page.evaluate(() => ({ title: document.title, scriptCount: document.scripts.length }))
    result.impeccableConsoleMessages = logs.console.filter((entry) => /impeccable/i.test(entry.text))
    await page.screenshot({ path: path.join(outputDir, `${viewName}-overlay.png`), animations: 'disabled' })
  } catch (error) {
    result.injected = false
    result.error = error.message
    result.consoleMessages = []
  }
  evidence.overlay[viewName] = result
}

try {
  const desktop = await createView('desktop-1440x900', 1440, 900)
  await saveState(desktop.page, desktop.result, 'desktop-1440x900-default.png')
  await openRange(desktop.page)
  await saveState(desktop.page, desktop.result, 'desktop-1440x900-range-popper.png')
  await injectOverlay(desktop.page, 'desktop-1440x900-range-popper', desktop.logs)
  await desktop.context.close()

  const mobile = await createView('mobile-375x812', 375, 812, true)
  await openRange(mobile.page)
  await saveState(mobile.page, mobile.result, 'mobile-375x812-range-popper.png')
  await injectOverlay(mobile.page, 'mobile-375x812-range-popper', mobile.logs)
  await mobile.context.close()

  const short = await createView('short-mobile-390x375', 390, 375, true)
  await openRange(short.page, 'shortcuts')
  const beforeWheel = await saveState(short.page, short.result, 'short-mobile-390x375-shortcuts-before-wheel.png')
  const popperBox = await short.page.locator('.lx-date-picker-demo__shortcuts-popper').boundingBox()
  if (popperBox) {
    await short.page.mouse.move(popperBox.x + popperBox.width / 2, popperBox.y + Math.min(100, popperBox.height / 2))
    await short.page.mouse.wheel(0, 360)
    await short.page.waitForTimeout(600)
  }
  const afterWheel = await saveState(short.page, short.result, 'short-mobile-390x375-shortcuts-after-real-wheel.png', {
    realWheel: { dispatched: Boolean(popperBox), deltaY: 360, beforePopperScrollTop: beforeWheel.poppers[0]?.scrollTop ?? null },
  })
  if (afterWheel.realWheel) {
    afterWheel.realWheel.afterPopperScrollTop = afterWheel.poppers[0]?.scrollTop ?? null
    afterWheel.realWheel.windowScrollY = afterWheel.windowScrollY
  }
  await short.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await short.page.waitForTimeout(350)
  const hud = await saveState(short.page, short.result, 'short-mobile-390x375-shortcuts-hud.png', { hudEnabled: true })
  await injectOverlay(short.page, 'short-mobile-390x375-shortcuts-hud', short.logs)
  await short.context.close()

  evidence.cssAssessment = {
    stylesheetResponses: evidence.views.flatMap((view) => view.logs.stylesheetResponses),
    independentCssResponse200: evidence.views.flatMap((view) => view.logs.stylesheetResponses).some((response) => response.status === 200),
    mainCssHrefList: desktop.result.initial.stylesheetLinks,
  }
  evidence.hudState = hud
  await writeFile(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
} finally {
  await browser.close()
}
