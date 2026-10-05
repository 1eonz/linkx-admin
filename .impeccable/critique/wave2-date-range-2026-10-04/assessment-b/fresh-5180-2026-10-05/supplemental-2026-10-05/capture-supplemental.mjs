import { createRequire } from 'node:module'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const outputDir = 'F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-04/assessment-b/fresh-5180-2026-10-05/supplemental-2026-10-05'
const targetUrl = 'http://127.0.0.1:5180/components/lxdatepicker'
const helperPort = Number(process.env.IMPECCABLE_HELPER_PORT || 8400)
const evidence = { targetUrl, viewport: { width: 390, height: 375 }, generatedAt: new Date().toISOString(), contexts: [] }

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge' })

async function newContext(name) {
  const context = await browser.newContext({ viewport: { width: 390, height: 375 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  const record = { name, console: [], pageErrors: [], failedRequests: [], responses: [], states: [], overlay: null }
  page.on('console', (message) => record.console.push({ type: message.type(), text: message.text() }))
  page.on('pageerror', (error) => record.pageErrors.push(error.message))
  page.on('requestfailed', (request) => record.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
  page.on('response', (response) => record.responses.push({ url: response.url(), status: response.status(), resourceType: response.request().resourceType() }))
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 })
  await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 20000 })
  record.httpStatus = response?.status() ?? null
  record.initialViewport = await page.evaluate(() => ({ innerWidth: innerWidth, innerHeight: innerHeight, dpr: devicePixelRatio }))
  evidence.contexts.push(record)
  return { context, page, record }
}

async function currentPopper(page) {
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]').first()
  await popper.waitFor({ state: 'visible', timeout: 15000 })
  return popper
}

async function captureState(page, record, name, extra = {}) {
  const state = await page.evaluate(() => {
    const poppers = Array.from(document.querySelectorAll('.lx-date-picker__popper[aria-hidden="false"]'))
      .filter((element) => element.getClientRects().length > 0)
    const popper = poppers[0]
    const rectFor = (element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left }
    }
    const scrollable = popper ? [popper, ...popper.querySelectorAll('*')].filter((element) => {
      const style = getComputedStyle(element)
      return element.scrollHeight > element.clientHeight + 1 && /^(auto|scroll|overlay)$/.test(style.overflowY)
    }).map((element) => ({
      tagName: element.tagName,
      className: typeof element.className === 'string' ? element.className : '',
      overflowY: getComputedStyle(element).overflowY,
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      rect: rectFor(element),
    })) : []
    return {
      viewport: { innerWidth, innerHeight, dpr: devicePixelRatio },
      windowScrollY: scrollY,
      visiblePopperCount: poppers.length,
      hudEnabled: document.querySelector('.lx-date-picker-demo')?.classList.contains('lx-theme-hud') ?? false,
      popper: popper ? {
        className: popper.className,
        ariaHidden: popper.getAttribute('aria-hidden'),
        rect: rectFor(popper),
        overflowY: getComputedStyle(popper).overflowY,
        scrollTop: popper.scrollTop,
        scrollHeight: popper.scrollHeight,
        clientHeight: popper.clientHeight,
        shortcutButtonCount: popper.querySelectorAll('.el-picker-panel__shortcut').length,
        shortcutTexts: Array.from(popper.querySelectorAll('.el-picker-panel__shortcut')).map((button) => button.textContent?.trim()),
        scrollableDescendants: scrollable,
      } : null,
    }
  })
  const saved = { screenshot: name, ...state, ...extra }
  await page.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
  record.states.push(saved)
  return saved
}

async function injectOverlay(page, record, screenshotName) {
  const result = { attempted: true, url: `http://localhost:${helperPort}/detect.js` }
  try {
    await page.evaluate(() => {
      document.title = `${document.title} [Assessment B supplemental]`
      const probe = document.createElement('script')
      probe.dataset.assessmentBSupplemental = 'true'
      document.head.append(probe)
      probe.remove()
    })
    result.mutablePreflight = true
    await page.addScriptTag({ url: result.url, timeout: 15000 })
    await page.waitForTimeout(2500)
    result.injected = await page.evaluate((url) => Array.from(document.scripts).some((script) => script.src === url), result.url)
    result.consoleFindings = record.console.filter((entry) => /\[impeccable\].*anti-patterns found/i.test(entry.text))
    result.detectResponse = record.responses.filter((entry) => entry.url === result.url)
    result.errors = record.console.filter((entry) => entry.type === 'error')
    await page.screenshot({ path: path.join(outputDir, screenshotName), animations: 'disabled' })
    result.screenshot = screenshotName
  } catch (error) {
    result.injected = false
    result.error = error.message
  }
  record.overlay = result
}

try {
  const hud = await newContext('hud-shortcuts-popup')
  await hud.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await hud.page.locator('[data-testid="shortcuts"] .el-range-input').first().click({ timeout: 15000 })
  const hudPopper = await currentPopper(hud.page)
  await hud.page.waitForTimeout(500)
  const hudState = await captureState(hud.page, hud.record, 'hud-shortcuts-popup-open.png', { sequence: ['HUD checkbox checked', 'shortcuts range opened'] })
  await injectOverlay(hud.page, hud.record, 'hud-shortcuts-popup-overlay.png')
  hud.record.finalPopupOpenAfterOverlay = await hudPopper.isVisible()
  await hud.context.close()

  const regular = await newContext('regular-range-wheel')
  await regular.page.locator('[data-testid="range"] .el-range-input').first().click({ timeout: 15000 })
  const regularPopper = await currentPopper(regular.page)
  await regular.page.waitForTimeout(500)
  const before = await captureState(regular.page, regular.record, 'regular-range-before-wheel.png')
  const rect = await regularPopper.boundingBox()
  if (rect) {
    await regular.page.mouse.move(rect.x + rect.width / 2, rect.y + Math.min(100, rect.height / 2))
    await regular.page.mouse.wheel(0, 360)
    await regular.page.waitForTimeout(500)
  }
  const after = await captureState(regular.page, regular.record, 'regular-range-after-wheel.png', {
    realWheel: { dispatched: Boolean(rect), deltaY: 360, beforeWindowScrollY: before.windowScrollY, beforePopperScrollTop: before.popper?.scrollTop ?? null },
  })
  if (after.realWheel) {
    after.realWheel.afterWindowScrollY = after.windowScrollY
    after.realWheel.afterPopperScrollTop = after.popper?.scrollTop ?? null
    after.realWheel.windowScrollDelta = after.windowScrollY - after.realWheel.beforeWindowScrollY
    after.realWheel.popperScrollDelta = (after.popper?.scrollTop ?? 0) - (after.realWheel.beforePopperScrollTop ?? 0)
  }
  await injectOverlay(regular.page, regular.record, 'regular-range-after-wheel-overlay.png')
  regular.record.finalPopupOpenAfterOverlay = await regularPopper.isVisible()
  await regular.context.close()

  evidence.cssChecks = evidence.contexts.map((record) => ({
    context: record.name,
    datePickerCss: record.responses.filter((entry) => entry.status === 200 && /LxDatePicker\/style\.css/.test(entry.url)),
    css200Count: record.responses.filter((entry) => entry.status === 200 && /\.css(?:\?|$)/i.test(entry.url)).length,
  }))
  await writeFile(path.join(outputDir, 'supplemental-browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
} finally {
  await browser.close()
}
