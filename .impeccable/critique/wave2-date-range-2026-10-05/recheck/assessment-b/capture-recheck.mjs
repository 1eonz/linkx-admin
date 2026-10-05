import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(
  'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json',
)
const { chromium } = require('playwright')
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const targetUrl = 'http://127.0.0.1:5181/components/lxdatepicker'
const overlayUrl = 'http://localhost:8400/detect.js'
const contexts = [
  {
    name: 'desktop-default',
    viewport: { width: 1440, height: 900 },
    mobile: false,
    scenario: 'default',
  },
  {
    name: 'mobile-range',
    viewport: { width: 375, height: 812 },
    mobile: true,
    scenario: 'range-scroll',
  },
  {
    name: 'mobile-375x812-shortcuts',
    viewport: { width: 375, height: 812 },
    mobile: true,
    scenario: 'shortcuts-scroll',
  },
  {
    name: 'narrow-320x812-range',
    viewport: { width: 320, height: 812 },
    mobile: true,
    scenario: 'range-scroll',
  },
  {
    name: 'narrow-320x812-shortcuts',
    viewport: { width: 320, height: 812 },
    mobile: true,
    scenario: 'shortcuts-scroll',
  },
  {
    name: 'short-320x375-range',
    viewport: { width: 320, height: 375 },
    mobile: true,
    scenario: 'range-scroll',
  },
  {
    name: 'short-320x375-shortcuts',
    viewport: { width: 320, height: 375 },
    mobile: true,
    scenario: 'shortcuts-scroll',
  },
  {
    name: 'short-390x375-range',
    viewport: { width: 390, height: 375 },
    mobile: true,
    scenario: 'range-scroll',
  },
  {
    name: 'short-390x375-shortcuts',
    viewport: { width: 390, height: 375 },
    mobile: true,
    scenario: 'shortcuts-scroll',
  },
]

const evidence = {
  targetUrl,
  overlayUrl,
  generatedAt: new Date().toISOString(),
  browser: 'Microsoft Edge via Playwright channel=msedge, headless=false',
  contexts: [],
}

function attachListeners(page, contextEvidence) {
  page.on('console', async (message) => {
    const arguments_ = await Promise.all(
      message.args().map(async (handle) => {
        try {
          const element = await handle.evaluate((value) => {
            if (!(value instanceof Element)) return undefined
            const rect = value.getBoundingClientRect()
            return {
              tagName: value.tagName,
              id: value.id,
              className: value.className,
              text: value.textContent?.trim().slice(0, 180),
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
              },
              inDatePickerPopper: Boolean(
                value.closest('.lx-date-picker__popper'),
              ),
              inDatePickerDemo: Boolean(
                value.closest('.lx-date-picker-demo'),
              ),
              inVitePressShell: Boolean(
                value.closest(
                  '.VPApp, .VPNav, .VPContent, .VPDoc, .VPLocalNav, .VPDocAside',
                ),
              ),
            }
          })
          if (element) return { type: 'element', value: element }
        } catch {}

        try {
          const value = await handle.jsonValue()
          return {
            type: String(handle),
            value:
              typeof value === 'string'
                ? value.slice(0, 240)
                : value === undefined
                  ? undefined
                  : JSON.stringify(value)?.slice(0, 240),
          }
        } catch {
          return { type: String(handle) }
        }
      }),
    )
    contextEvidence.console.push({
      type: message.type(),
      text: message.text(),
      arguments: arguments_,
    })
  })
  page.on('pageerror', (error) => {
    contextEvidence.pageErrors.push(error.stack ?? error.message)
  })
  page.on('requestfailed', (request) => {
    contextEvidence.failedRequests.push({
      url: request.url(),
      method: request.method(),
      error: request.failure()?.errorText,
    })
  })
  page.on('response', (response) => {
    contextEvidence.responses.push({
      url: response.url(),
      status: response.status(),
      resourceType: response.request().resourceType(),
    })
  })
}

async function measurePopup(page) {
  return page.evaluate(() => {
    const popper = document.querySelector(
      '.lx-date-picker__popper[aria-hidden="false"]',
    )
    if (!(popper instanceof HTMLElement)) return { open: false }

    const toRect = (element) => {
      const rect = element.getBoundingClientRect()
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      }
    }
    const panel = popper.querySelector('.el-picker-panel')
    const scrollable = [popper, ...popper.querySelectorAll('*')]
      .filter((element) => {
        const style = getComputedStyle(element)
        return (
          /(auto|scroll)/.test(style.overflowY) &&
          element.scrollHeight > element.clientHeight
        )
      })
      .map((element) => ({
        tagName: element.tagName,
        className: element.className,
        overflowY: getComputedStyle(element).overflowY,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        rect: toRect(element),
      }))
    const lastRows = Array.from(
      popper.querySelectorAll('.el-date-table tbody tr:last-child'),
    ).filter((row) => row.getClientRects().length > 0)
    const lastRow = lastRows.at(-1)
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      visualWidth: window.visualViewport?.width,
      visualHeight: window.visualViewport?.height,
    }
    const popperRect = toRect(popper)
    const lastRowRect = lastRow ? toRect(lastRow) : undefined
    const cells = lastRow
      ? Array.from(lastRow.querySelectorAll('td')).map((cell) => ({
          text: cell.textContent?.trim(),
          rect: toRect(cell),
        }))
      : []

    return {
      open: true,
      className: popper.className,
      position: getComputedStyle(popper).position,
      overflowY: getComputedStyle(popper).overflowY,
      ariaHidden: popper.getAttribute('aria-hidden'),
      viewport,
      windowScrollX: window.scrollX,
      windowScrollY: window.scrollY,
      popperRect,
      popperFullyInsideViewport:
        popperRect.left >= 0 &&
        popperRect.top >= 0 &&
        popperRect.right <= viewport.width &&
        popperRect.bottom <= viewport.height,
      panel: panel
        ? {
            className: panel.className,
            overflowY: getComputedStyle(panel).overflowY,
            scrollTop: panel.scrollTop,
            scrollHeight: panel.scrollHeight,
            clientHeight: panel.clientHeight,
            rect: toRect(panel),
          }
        : undefined,
      scrollable,
      shortcutTexts: Array.from(
        popper.querySelectorAll('.el-picker-panel__shortcut'),
      ).map((shortcut) => shortcut.textContent?.trim()),
      lastDateRow: lastRowRect
        ? {
            rect: lastRowRect,
            fullyInsideViewport:
              lastRowRect.top >= 0 &&
              lastRowRect.bottom <= viewport.height &&
              lastRowRect.left >= 0 &&
              lastRowRect.right <= viewport.width,
            cells,
          }
        : undefined,
    }
  })
}

async function injectOverlay(page, contextEvidence, screenshotName) {
  const consoleStart = contextEvidence.console.length
  const mutablePreflight = await page.evaluate(() => {
    document.title = `${document.title} [Assessment B]`
    document.documentElement.dataset.assessmentB = 'mutable'
    return document.title.endsWith('[Assessment B]')
  })
  let injection
  try {
    injection = await page.evaluate(
      (url) =>
        new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = url
          script.async = true
          script.onload = () => resolve({ loaded: true })
          script.onerror = () => resolve({ loaded: false })
          document.head.append(script)
        }),
      overlayUrl,
    )
  } catch (error) {
    injection = { loaded: false, error: String(error) }
  }
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false })
  const detectResponses = contextEvidence.responses.filter((response) =>
    response.url.includes('/detect.js'),
  )
  const newConsole = contextEvidence.console.slice(consoleStart)
  return {
    attempted: true,
    mutablePreflight,
    injected: injection?.loaded === true,
    injection,
    detectResponses,
    consoleFindings: newConsole.filter((message) =>
      /\[impeccable\]|anti-pattern/i.test(message.text),
    ),
    consoleErrors: newConsole.filter((message) => message.type === 'error'),
    screenshot: screenshotName,
  }
}

async function openRange(page, selector, contextEvidence, prefix, scrollToEnd) {
  const locator = page.locator(selector).first()
  await locator.waitFor({ state: 'visible' })
  contextEvidence.rangeInputs = await page.locator(selector).count()
  await locator.scrollIntoViewIfNeeded()
  contextEvidence.windowScrollBeforeOpen = await page.evaluate(() => window.scrollY)
  await locator.click()
  await page.locator('.lx-date-picker__popper[aria-hidden="false"]').waitFor()
  await page.waitForTimeout(300)
  contextEvidence.popupOpen = true
  contextEvidence.popupBeforeWheel = await measurePopup(page)

  if (!scrollToEnd) {
    const screenshotName = `${prefix}-open.png`
    await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false })
    contextEvidence.screenshots = [screenshotName]
    return
  }

  const before = contextEvidence.popupBeforeWheel
  const rect = before.popperRect
  const pointer = {
    x: Math.max(2, Math.min(before.viewport.width - 2, rect.right - 10)),
    y: Math.max(2, Math.min(before.viewport.height - 2, rect.top + rect.height / 2)),
  }
  const wheelBefore = {
    windowScrollY: before.windowScrollY,
    panelScrollTop: before.panel?.scrollTop,
    scrollables: before.scrollable,
  }
  const beforeShot = `${prefix}-before-wheel.png`
  await page.screenshot({ path: path.join(outputDir, beforeShot), fullPage: false })
  const steps = []
  await page.mouse.move(pointer.x, pointer.y)
  for (let index = 0; index < 8; index += 1) {
    await page.mouse.wheel(0, 420)
    await page.waitForTimeout(160)
    steps.push(await measurePopup(page))
    const current = steps.at(-1)
    const prior = steps.at(-2)
    const noFurtherPopupScroll =
      prior &&
      prior.scrollable.length > 0 &&
      current.scrollable.every((element, scrollIndex) => {
        const previous = prior.scrollable[scrollIndex]
        return previous && previous.scrollTop === element.scrollTop
      })
    const wheelEscapedToPage =
      current.scrollable.length === 0 &&
      current.windowScrollY !== wheelBefore.windowScrollY
    if (wheelEscapedToPage) break
    if (noFurtherPopupScroll) break
  }
  contextEvidence.realWheel = {
    dispatched: true,
    deltaY: 420,
    repetitions: steps.length,
    pointer,
    before: wheelBefore,
    after: steps.at(-1),
    windowScrollDelta:
      steps.at(-1).windowScrollY - wheelBefore.windowScrollY,
    panelScrollDelta:
      (steps.at(-1).panel?.scrollTop ?? 0) -
      (wheelBefore.panelScrollTop ?? 0),
    steps: steps.map((step) => ({
      windowScrollY: step.windowScrollY,
      panelScrollTop: step.panel?.scrollTop,
      scrollables: step.scrollable,
    })),
  }
  contextEvidence.popupAfterWheel = steps.at(-1)
  const afterShot = `${prefix}-after-wheel.png`
  await page.screenshot({ path: path.join(outputDir, afterShot), fullPage: false })
  contextEvidence.screenshots = [beforeShot, afterShot]
}

let browser
try {
  browser = await chromium.launch({
    channel: 'msedge',
    headless: false,
  })
  evidence.browserVersion = browser.version()

  for (const view of contexts) {
    const browserContext = await browser.newContext({
      viewport: view.viewport,
      deviceScaleFactor: 1,
      isMobile: view.mobile,
      hasTouch: false,
    })
    const page = await browserContext.newPage()
    page.setDefaultTimeout(10000)
    const contextEvidence = {
      name: view.name,
      viewport: view.viewport,
      mobile: view.mobile,
      console: [],
      pageErrors: [],
      failedRequests: [],
      responses: [],
    }
    evidence.contexts.push(contextEvidence)
    attachListeners(page, contextEvidence)

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    contextEvidence.httpStatus = response?.status()
    await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible' })
    await page.waitForTimeout(800)
    contextEvidence.initialViewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    }))

    if (view.scenario === 'default') {
      const screenshotName = 'desktop-1440x900-default.png'
      await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false })
      contextEvidence.screenshots = [screenshotName]
    } else if (view.scenario === 'range') {
      await openRange(
        page,
        '[data-testid="range"] input.el-range-input',
        contextEvidence,
        'mobile-375x812-range-popper',
        false,
      )
    } else if (view.scenario === 'range-scroll') {
      await openRange(
        page,
        '[data-testid="range"] input.el-range-input',
        contextEvidence,
        `${view.name}-range-popper`,
        true,
      )
    } else if (view.scenario === 'shortcuts-scroll') {
      const hudToggle = page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]')
      await hudToggle.check()
      contextEvidence.hudEnabled = await hudToggle.isChecked()
      await openRange(
        page,
        '[data-testid="shortcuts"] input.el-range-input',
        contextEvidence,
        `${view.name}-shortcuts-popper`,
        true,
      )
    }

    const overlayScreenshot = `${view.name}-overlay.png`
    contextEvidence.overlay = await injectOverlay(page, contextEvidence, overlayScreenshot)
    contextEvidence.popupOpenAfterOverlay = await page
      .locator('.lx-date-picker__popper[aria-hidden="false"]')
      .count()
      .then((count) => count > 0)
    if (view.scenario === 'range-scroll' || view.scenario === 'shortcuts-scroll') {
      contextEvidence.popupAfterOverlay = await measurePopup(page)
      contextEvidence.lastDateRowFullyInsideViewportAfterWheel =
        contextEvidence.popupAfterOverlay.lastDateRow?.fullyInsideViewport ?? false
    }
    await browserContext.close()
  }
} catch (error) {
  evidence.error = error.stack ?? String(error)
  process.stderr.write(`${evidence.error}\n`)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  await fs.writeFile(
    path.join(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
}
