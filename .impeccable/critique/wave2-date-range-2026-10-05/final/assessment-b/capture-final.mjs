import { createRequire } from 'node:module'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const outputDir = 'F:/work/linkx-admin/.impeccable/critique/wave2-date-range-2026-10-05/final/assessment-b'
const targetUrl = 'http://127.0.0.1:5180/components/lxdatepicker'
const helperPort = Number(process.env.IMPECCABLE_HELPER_PORT || 8400)
const evidence = { targetUrl, generatedAt: new Date().toISOString(), contexts: [] }

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'msedge' })

async function newContext(name, width, height, mobile = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  })
  const page = await context.newPage()
  const record = {
    name,
    viewport: { width, height, mobile, deviceScaleFactor: 1 },
    console: [],
    pageErrors: [],
    failedRequests: [],
    responses: [],
    states: [],
    overlay: null,
  }
  page.on('console', (message) => record.console.push({ type: message.type(), text: message.text() }))
  page.on('pageerror', (error) => record.pageErrors.push(error.message))
  page.on('requestfailed', (request) => record.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
  page.on('response', (response) => record.responses.push({ url: response.url(), status: response.status(), resourceType: response.request().resourceType() }))
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 })
  await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(250)
  record.httpStatus = response?.status() ?? null
  record.initialViewport = await page.evaluate(() => ({ innerWidth, innerHeight, dpr: devicePixelRatio }))
  evidence.contexts.push(record)
  return { context, page, record }
}

async function activePopper(page) {
  const popper = page.locator('.lx-date-picker__popper[aria-hidden="false"]').first()
  await popper.waitFor({ state: 'visible', timeout: 15000 })
  return popper
}

async function inspectState(page) {
  return page.evaluate(() => {
    const activePoppers = Array.from(document.querySelectorAll('.lx-date-picker__popper[aria-hidden="false"]'))
      .filter((element) => element.getClientRects().length > 0)
    const popper = activePoppers[0]
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left }
    }
    const scrollables = popper ? [popper, ...popper.querySelectorAll('*')].filter((element) => {
      const style = getComputedStyle(element)
      return element.scrollHeight > element.clientHeight + 1 && /^(auto|scroll|overlay)$/.test(style.overflowY)
    }).map((element) => ({
      tagName: element.tagName,
      className: typeof element.className === 'string' ? element.className : '',
      overflowY: getComputedStyle(element).overflowY,
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      rect: rectOf(element),
    })) : []
    const table = popper?.querySelector('.el-date-table')
    const lastRow = table?.querySelector('tbody tr:last-child')
    const popperRect = popper ? popper.getBoundingClientRect() : null
    const lastRowRect = lastRow ? lastRow.getBoundingClientRect() : null
    return {
      viewport: { innerWidth, innerHeight, dpr: devicePixelRatio },
      windowScrollY: scrollY,
      documentScrollHeight: document.documentElement.scrollHeight,
      hudEnabled: document.querySelector('.lx-date-picker-demo')?.classList.contains('lx-theme-hud') ?? false,
      visiblePopperCount: activePoppers.length,
      popper: popper ? {
        className: popper.className,
        ariaHidden: popper.getAttribute('aria-hidden'),
        rect: rectOf(popper),
        overflowY: getComputedStyle(popper).overflowY,
        scrollTop: popper.scrollTop,
        scrollHeight: popper.scrollHeight,
        clientHeight: popper.clientHeight,
        maxScrollTop: Math.max(0, popper.scrollHeight - popper.clientHeight),
        shortcutButtonCount: popper.querySelectorAll('.el-picker-panel__shortcut').length,
        shortcutTexts: Array.from(popper.querySelectorAll('.el-picker-panel__shortcut')).map((button) => button.textContent?.trim()),
        scrollableDescendants: scrollables,
        lastDateRow: lastRow && lastRowRect && popperRect ? {
          rect: rectOf(lastRow),
          cells: Array.from(lastRow.querySelectorAll('td')).map((cell) => ({ text: cell.textContent?.trim(), className: cell.className })),
          intersectsPopper: lastRowRect.bottom > popperRect.top && lastRowRect.top < popperRect.bottom,
          fullyInsidePopper: lastRowRect.top >= popperRect.top && lastRowRect.bottom <= popperRect.bottom,
        } : null,
      } : null,
    }
  })
}

async function captureState(page, record, screenshot, extra = {}) {
  const state = { screenshot, ...(await inspectState(page)), ...extra }
  await page.screenshot({ path: path.join(outputDir, screenshot), animations: 'disabled' })
  record.states.push(state)
  return state
}

async function injectOverlay(page, record, screenshot) {
  const result = { attempted: true, url: `http://localhost:${helperPort}/detect.js` }
  try {
    await page.evaluate(() => {
      document.title = `${document.title} [Assessment B final preflight]`
      const probe = document.createElement('script')
      probe.dataset.assessmentBFinalPreflight = 'true'
      document.head.append(probe)
      probe.remove()
    })
    result.mutablePreflight = true
    await page.addScriptTag({ url: result.url, timeout: 15000 })
    await page.waitForTimeout(2500)
    result.injected = await page.evaluate((url) => Array.from(document.scripts).some((script) => script.src === url), result.url)
    result.consoleFindings = record.console.filter((entry) => /\[impeccable\].*anti-patterns found/i.test(entry.text))
    result.detectResponses = record.responses.filter((entry) => entry.url === result.url)
    result.consoleErrors = record.console.filter((entry) => entry.type === 'error')
    await page.screenshot({ path: path.join(outputDir, screenshot), animations: 'disabled' })
    result.screenshot = screenshot
  } catch (error) {
    result.injected = false
    result.error = error.message
  }
  record.overlay = result
}

async function openPicker(page, section) {
  await page.locator(`[data-testid="${section}"] .el-range-input`).first().click({ timeout: 15000 })
  const popper = await activePopper(page)
  await page.waitForTimeout(500)
  return popper
}

async function wheelInside(page, popper, deltaY) {
  const box = await popper.boundingBox()
  if (!box) return { dispatched: false, deltaY }
  const x = Math.max(0, Math.min(389, box.x + box.width / 2))
  const y = Math.max(0, Math.min(374, box.y + Math.min(box.height / 2, 120)))
  await page.mouse.move(x, y)
  await page.mouse.wheel(0, deltaY)
  await page.waitForTimeout(220)
  return { dispatched: true, deltaY, pointer: { x, y } }
}

async function scrollToEnd(page, popper, history) {
  for (let index = 0; index < 8; index += 1) {
    const before = await inspectState(page)
    if (!before.popper || before.popper.maxScrollTop - before.popper.scrollTop < 1) break
    const event = await wheelInside(page, popper, 360)
    const after = await inspectState(page)
    history.push({ index: index + 1, event, before: { windowScrollY: before.windowScrollY, popperScrollTop: before.popper.scrollTop }, after: { windowScrollY: after.windowScrollY, popperScrollTop: after.popper?.scrollTop ?? null, maxScrollTop: after.popper?.maxScrollTop ?? null } })
    if (!after.popper || (after.popper.scrollTop <= before.popper.scrollTop && after.windowScrollY !== before.windowScrollY)) break
  }
}

try {
  const desktop = await newContext('desktop-default', 1440, 900)
  await captureState(desktop.page, desktop.record, 'desktop-1440x900-default.png')
  await injectOverlay(desktop.page, desktop.record, 'desktop-1440x900-default-overlay.png')
  await desktop.context.close()

  const mobile = await newContext('mobile-range', 375, 812, true)
  await openPicker(mobile.page, 'range')
  await captureState(mobile.page, mobile.record, 'mobile-375x812-range-popper.png')
  await injectOverlay(mobile.page, mobile.record, 'mobile-375x812-range-popper-overlay.png')
  await mobile.context.close()

  const regular = await newContext('short-regular-range', 390, 375, true)
  const regularPopper = await openPicker(regular.page, 'range')
  const regularBefore = await captureState(regular.page, regular.record, 'short-390x375-range-before-wheel.png')
  const regularWheel = []
  const regularFirstWheel = await wheelInside(regular.page, regularPopper, 360)
  const regularAfterFirst = await captureState(regular.page, regular.record, 'short-390x375-range-after-first-wheel.png', { realWheel: regularFirstWheel, beforeWheel: { windowScrollY: regularBefore.windowScrollY, popperScrollTop: regularBefore.popper?.scrollTop ?? null } })
  regularAfterFirst.realWheel.after = { windowScrollY: regularAfterFirst.windowScrollY, popperScrollTop: regularAfterFirst.popper?.scrollTop ?? null }
  regularAfterFirst.realWheel.windowScrollDelta = regularAfterFirst.windowScrollY - regularBefore.windowScrollY
  regularAfterFirst.realWheel.popperScrollDelta = (regularAfterFirst.popper?.scrollTop ?? 0) - (regularBefore.popper?.scrollTop ?? 0)
  await scrollToEnd(regular.page, regularPopper, regularWheel)
  const regularAtEnd = await captureState(regular.page, regular.record, 'short-390x375-range-at-scroll-end.png', { wheelToEnd: regularWheel })
  await injectOverlay(regular.page, regular.record, 'short-390x375-range-overlay.png')
  regular.record.popupOpenAfterOverlay = await regularPopper.isVisible()
  regular.record.scrollEnd = { windowScrollY: regularAtEnd.windowScrollY, popperScrollTop: regularAtEnd.popper?.scrollTop ?? null, maxScrollTop: regularAtEnd.popper?.maxScrollTop ?? null, lastDateRowFullyInsidePopper: regularAtEnd.popper?.lastDateRow?.fullyInsidePopper ?? false }
  await regular.context.close()

  const shortcuts = await newContext('short-hud-shortcuts-range', 390, 375, true)
  await shortcuts.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  const shortcutsPopper = await openPicker(shortcuts.page, 'shortcuts')
  const shortcutsBefore = await captureState(shortcuts.page, shortcuts.record, 'short-390x375-hud-shortcuts-before-wheel.png')
  const shortcutsWheel = []
  const shortcutsFirstWheel = await wheelInside(shortcuts.page, shortcutsPopper, 360)
  const shortcutsAfterFirst = await captureState(shortcuts.page, shortcuts.record, 'short-390x375-hud-shortcuts-after-first-wheel.png', { realWheel: shortcutsFirstWheel, beforeWheel: { windowScrollY: shortcutsBefore.windowScrollY, popperScrollTop: shortcutsBefore.popper?.scrollTop ?? null } })
  shortcutsAfterFirst.realWheel.after = { windowScrollY: shortcutsAfterFirst.windowScrollY, popperScrollTop: shortcutsAfterFirst.popper?.scrollTop ?? null }
  shortcutsAfterFirst.realWheel.windowScrollDelta = shortcutsAfterFirst.windowScrollY - shortcutsBefore.windowScrollY
  shortcutsAfterFirst.realWheel.popperScrollDelta = (shortcutsAfterFirst.popper?.scrollTop ?? 0) - (shortcutsBefore.popper?.scrollTop ?? 0)
  await scrollToEnd(shortcuts.page, shortcutsPopper, shortcutsWheel)
  const shortcutsAtEnd = await captureState(shortcuts.page, shortcuts.record, 'short-390x375-hud-shortcuts-at-scroll-end.png', { wheelToEnd: shortcutsWheel })
  await injectOverlay(shortcuts.page, shortcuts.record, 'short-390x375-hud-shortcuts-overlay.png')
  shortcuts.record.popupOpenAfterOverlay = await shortcutsPopper.isVisible()
  shortcuts.record.hudPopupVerifiedAfterOverlay = await shortcuts.page.locator('.lx-date-picker__popper[aria-hidden="false"].lx-theme-hud').count() > 0
  shortcuts.record.scrollEnd = { windowScrollY: shortcutsAtEnd.windowScrollY, popperScrollTop: shortcutsAtEnd.popper?.scrollTop ?? null, maxScrollTop: shortcutsAtEnd.popper?.maxScrollTop ?? null, lastDateRowFullyInsidePopper: shortcutsAtEnd.popper?.lastDateRow?.fullyInsidePopper ?? false }
  await shortcuts.context.close()

  evidence.cssChecks = evidence.contexts.map((record) => ({
    context: record.name,
    datePickerCss: record.responses.filter((entry) => entry.status === 200 && /LxDatePicker\/style\.css/.test(entry.url)),
    non200Responses: record.responses.filter((entry) => entry.status < 200 || entry.status >= 300),
    failedRequests: record.failedRequests,
  }))
  await writeFile(path.join(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8')
} finally {
  await browser.close()
}
