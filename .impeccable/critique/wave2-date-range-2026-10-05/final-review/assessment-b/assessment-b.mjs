import { createServer } from 'node:http'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const outputDir = dirname(fileURLToPath(import.meta.url))
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const docsUrl = 'http://127.0.0.1:4176/components/lxdatepicker'
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detector/detect-antipatterns-browser.js'
const overlayPort = 8403
const evidence = {
  target: 'linkx-fe/src/components/LxDatePicker/index.vue',
  docsUrl,
  browser: { engine: 'Chromium via Playwright', executablePath: edgePath, headless: false },
  overlayServer: { command: 'node assessment-b.mjs', port: overlayPort, pid: process.pid },
  scenarios: [],
  errors: [],
}

const round = (value) => Math.round(value * 100) / 100
async function installConsoleCapture(page, scenario) {
  const pending = []
  page.on('console', (message) => {
    const type = message.type()
    const text = message.text()
    const detectorOutput = scenario.detectorActive && (text.includes('%c') || text.includes('[impeccable]'))
    if (!detectorOutput && type !== 'error' && type !== 'warning') return

    pending.push(Promise.all(message.args().map(async (handle) => {
      const element = handle.asElement()
      if (element) {
        return element.evaluate((node) => ({
          tag: node.tagName.toLowerCase(),
          id: node.id || null,
          classes: typeof node.className === 'string' ? node.className : null,
          testId: node.getAttribute('data-testid'),
          role: node.getAttribute('role'),
          text: (node.innerText || node.textContent || '').trim().slice(0, 160),
          outerHTML: node.outerHTML.slice(0, 700),
        })).catch(() => ({ detachedElement: true }))
      }
      return handle.jsonValue().catch(() => '[unserializable]')
    })).then((args) => scenario.console.push({ type, text, args })))
  })
  page.on('pageerror', (error) => scenario.pageErrors.push(String(error)))
  page.on('requestfailed', (request) => scenario.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown request failure',
  }))
  page.on('response', (response) => scenario.responses.push({
    status: response.status(),
    url: response.url(),
  }))
  return async () => Promise.all(pending)
}

async function gotoDemo(page) {
  await page.goto(docsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
}

async function openPicker(page, testId) {
  const input = page.locator(`[data-testid="${testId}"] input.el-range-input`).first()
  await input.scrollIntoViewIfNeeded()
  await input.click()
  await page.waitForFunction(() => {
    const popper = document.querySelector('.lx-date-picker__popper[aria-hidden="false"]')
    return !!popper && popper.getBoundingClientRect().width > 0
  }, null, { timeout: 10000 })
  await page.waitForTimeout(450)
}

async function measurePopper(page) {
  return page.evaluate(() => {
    const popper = Array.from(document.querySelectorAll('.lx-date-picker__popper'))
      .find((node) => node.getAttribute('aria-hidden') === 'false' && node.getBoundingClientRect().width > 0)
    const panel = popper?.querySelector('.el-picker-panel')
    const panelRect = panel?.getBoundingClientRect()
    const popperRect = popper?.getBoundingClientRect()
    const visibleContents = Array.from(popper?.querySelectorAll('.el-date-range-picker__content') ?? [])
      .filter((node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden')
    const sidebar = popper?.querySelector('.el-picker-panel__sidebar')
    const sidebarRect = sidebar?.getBoundingClientRect()
    const activeContent = Array.from(popper?.querySelectorAll('.el-date-range-picker__content') ?? [])
      .find((node) => node.getClientRects().length > 0)
    const shortcuts = Array.from(popper?.querySelectorAll('.el-picker-panel__shortcut') ?? [])
    const rect = (value) => value && ({
      x: Math.round(value.x * 100) / 100,
      y: Math.round(value.y * 100) / 100,
      width: Math.round(value.width * 100) / 100,
      height: Math.round(value.height * 100) / 100,
      top: Math.round(value.top * 100) / 100,
      right: Math.round(value.right * 100) / 100,
      bottom: Math.round(value.bottom * 100) / 100,
      left: Math.round(value.left * 100) / 100,
    })
    const style = panel ? getComputedStyle(panel) : null
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollX,
        scrollY,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      },
      popper: popper ? {
        rect: rect(popperRect),
        position: getComputedStyle(popper).position,
        viewportFitClass: popper.classList.contains('lx-date-picker__popper--viewport-fit'),
      } : null,
      panel: panel ? {
        rect: rect(panelRect),
        scrollTop: panel.scrollTop,
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight,
        overflowY: style?.overflowY,
        overscrollBehaviorY: style?.overscrollBehaviorY,
        scrollable: panel.scrollHeight > panel.clientHeight,
      } : null,
      visibleCalendars: visibleContents.map((content) => {
        const rows = Array.from(content.querySelectorAll('.el-date-table tbody tr'))
        const lastRect = rows.at(-1)?.getBoundingClientRect()
        return {
          rowCount: rows.length,
          lastRowRect: rect(lastRect),
          lastRowFullyWithinPanel: !!(lastRect && panelRect && lastRect.top >= panelRect.top && lastRect.bottom <= panelRect.bottom),
        }
      }),
      content: activeContent ? {
        rect: rect(activeContent.getBoundingClientRect()),
        scrollTop: activeContent.scrollTop,
        scrollHeight: activeContent.scrollHeight,
        clientHeight: activeContent.clientHeight,
      } : null,
      shortcuts: {
        labels: shortcuts.map((node) => node.textContent?.trim()).filter(Boolean),
        rect: rect(sidebarRect),
        buttons: shortcuts.map((node) => ({
          text: node.textContent?.trim(),
          rect: rect(node.getBoundingClientRect()),
          minHeight: getComputedStyle(node).minHeight,
        })),
      },
    }
  })
}

async function injectDetector(page, scenario) {
  const probe = await page.evaluate(() => {
    document.title = 'Assessment B - LxDatePicker'
    const script = document.createElement('script')
    script.textContent = 'window.__assessmentBMutationProbe = true'
    document.head.appendChild(script)
    return {
      title: document.title,
      scriptAppended: script.isConnected,
      probeExecuted: window.__assessmentBMutationProbe === true,
    }
  })
  scenario.injectionPreflight = probe
  scenario.detectorActive = true
  await page.addScriptTag({ url: `http://127.0.0.1:${overlayPort}/detect.js` })
  scenario.detectorScriptLoaded = await page.evaluate(() => Array.from(document.scripts)
    .some((script) => script.src === 'http://127.0.0.1:8403/detect.js'))
  await page.waitForTimeout(2500)
}

async function wheelAndMeasure(page) {
  const before = await page.evaluate(() => {
    const popper = document.querySelector('.lx-date-picker__popper[aria-hidden="false"]')
    const panel = popper?.querySelector('.el-picker-panel')
    return { pageY: scrollY, panelY: panel?.scrollTop ?? null }
  })
  const panelLocator = page.locator('.lx-date-picker__popper[aria-hidden="false"] > .el-picker-panel').first()
  const box = await panelLocator.boundingBox().catch(() => null)
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(250)
  }
  const after = await page.evaluate(() => {
    const popper = document.querySelector('.lx-date-picker__popper[aria-hidden="false"]')
    const panel = popper?.querySelector('.el-picker-panel')
    const panelRect = panel?.getBoundingClientRect()
    const content = Array.from(popper?.querySelectorAll('.el-date-range-picker__content') ?? [])
      .find((node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden')
    const lastRow = Array.from(content?.querySelectorAll('.el-date-table tbody tr') ?? []).at(-1)
    const lastRect = lastRow?.getBoundingClientRect()
    return {
      pageY: scrollY,
      panelY: panel?.scrollTop ?? null,
      lastRowFullyWithinPanel: !!(lastRect && panelRect && lastRect.top >= panelRect.top && lastRect.bottom <= panelRect.bottom),
    }
  })
  return {
    before,
    after,
    pageScrollDelta: round(after.pageY - before.pageY),
    panelScrollDelta: before.panelY === null || after.panelY === null ? null : round(after.panelY - before.panelY),
    lastRowFullyWithinPanelAfterWheel: after.lastRowFullyWithinPanel,
  }
}

async function newScenario(browser, name, { viewport, reducedMotion = 'no-preference' }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    colorScheme: 'light',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const scenario = {
    name,
    viewport,
    reducedMotion,
    console: [],
    pageErrors: [],
    failedRequests: [],
    responses: [],
  }
  const flushConsole = await installConsoleCapture(page, scenario)
  await gotoDemo(page)
  scenario.documentTitle = await page.title()
  return { context, page, scenario, flushConsole }
}

async function saveScreenshot(page, name) {
  const path = join(outputDir, `${name}.png`)
  await page.screenshot({ path, animations: 'disabled' })
  return path.split(/[\\/]/).at(-1)
}

async function finishScenario(record) {
  await record.flushConsole()
  evidence.scenarios.push(record.scenario)
  await record.context.close()
}

async function main() {
  const detectorCode = await readFile(detectorPath, 'utf8')
  const server = createServer((request, response) => {
    if (request.url !== '/detect.js') {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    response.writeHead(200, {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    })
    response.end(detectorCode)
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(overlayPort, '127.0.0.1', resolve)
  })
  evidence.overlayServer.startOutput = `Listening at http://127.0.0.1:${overlayPort}/detect.js`
  evidence.overlayServer.startExitCode = 0

  let browser
  try {
    browser = await chromium.launch({
      headless: false,
      executablePath: edgePath,
      args: ['--no-first-run', '--no-default-browser-check'],
    })

    const desktop = await newScenario(browser, 'desktop-default', { viewport: { width: 1440, height: 900 } })
    await desktop.page.locator('[data-testid="range"] input.el-range-input').first().scrollIntoViewIfNeeded()
    desktop.scenario.defaultPopper = await measurePopper(desktop.page)
    desktop.scenario.screenshot = await saveScreenshot(desktop.page, 'desktop-default')
    await finishScenario(desktop)

    const desktopOpen = await newScenario(browser, 'desktop-open-range', { viewport: { width: 1440, height: 900 } })
    await openPicker(desktopOpen.page, 'range')
    desktopOpen.scenario.popper = await measurePopper(desktopOpen.page)
    desktopOpen.scenario.screenshot = await saveScreenshot(desktopOpen.page, 'desktop-open-range')
    await injectDetector(desktopOpen.page, desktopOpen.scenario)
    desktopOpen.scenario.overlayScreenshot = await saveScreenshot(desktopOpen.page, 'desktop-open-range-overlay')
    await finishScenario(desktopOpen)

    for (const width of [320, 390]) {
      const ordinary = await newScenario(browser, `ordinary-${width}x375`, { viewport: { width, height: 375 } })
      await openPicker(ordinary.page, 'range')
      ordinary.scenario.popper = await measurePopper(ordinary.page)
      ordinary.scenario.screenshot = await saveScreenshot(ordinary.page, `ordinary-${width}x375`)
      if (width === 320) await injectDetector(ordinary.page, ordinary.scenario)
      if (width === 320) ordinary.scenario.overlayScreenshot = await saveScreenshot(ordinary.page, 'ordinary-320x375-overlay')
      ordinary.scenario.scroll = await wheelAndMeasure(ordinary.page)
      ordinary.scenario.scrolledScreenshot = await saveScreenshot(ordinary.page, `ordinary-${width}x375-scrolled`)
      await finishScenario(ordinary)

      const shortcuts = await newScenario(browser, `shortcuts-${width}x375`, { viewport: { width, height: 375 } })
      await openPicker(shortcuts.page, 'shortcuts')
      shortcuts.scenario.popper = await measurePopper(shortcuts.page)
      shortcuts.scenario.screenshot = await saveScreenshot(shortcuts.page, `shortcuts-${width}x375`)
      if (width === 390) await injectDetector(shortcuts.page, shortcuts.scenario)
      if (width === 390) shortcuts.scenario.overlayScreenshot = await saveScreenshot(shortcuts.page, 'shortcuts-390x375-overlay')
      shortcuts.scenario.scroll = await wheelAndMeasure(shortcuts.page)
      shortcuts.scenario.scrolledScreenshot = await saveScreenshot(shortcuts.page, `shortcuts-${width}x375-scrolled`)
      await finishScenario(shortcuts)
    }

    const hud = await newScenario(browser, 'hud-390x375', { viewport: { width: 390, height: 375 } })
    const hudToggle = hud.page.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]')
    await hudToggle.check()
    hud.scenario.hudEnabled = await hud.page.locator('.lx-date-picker-demo.lx-theme-hud').count() === 1
    await openPicker(hud.page, 'range')
    hud.scenario.popper = await measurePopper(hud.page)
    hud.scenario.screenshot = await saveScreenshot(hud.page, 'hud-390x375')
    await injectDetector(hud.page, hud.scenario)
    hud.scenario.overlayScreenshot = await saveScreenshot(hud.page, 'hud-390x375-overlay')
    await finishScenario(hud)

    const reduced = await newScenario(browser, 'reduced-motion-390x375', {
      viewport: { width: 390, height: 375 },
      reducedMotion: 'reduce',
    })
    await openPicker(reduced.page, 'range')
    reduced.scenario.reducedMotionMediaMatches = await reduced.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
    reduced.scenario.transitionDurations = await reduced.page.evaluate(() => {
      const input = document.querySelector('[data-testid="range"] .el-input__wrapper')
      return input ? getComputedStyle(input).transitionDuration : null
    })
    reduced.scenario.popper = await measurePopper(reduced.page)
    reduced.scenario.screenshot = await saveScreenshot(reduced.page, 'reduced-motion-390x375')
    await finishScenario(reduced)

    const resize = await newScenario(browser, 'resize-390x844-to-390x375-to-390x844', { viewport: { width: 390, height: 844 } })
    await openPicker(resize.page, 'range')
    resize.scenario.tallBefore = await measurePopper(resize.page)
    resize.scenario.screenshotTallBefore = await saveScreenshot(resize.page, 'resize-390x844-open')
    await resize.page.setViewportSize({ width: 390, height: 375 })
    await resize.page.waitForTimeout(650)
    resize.scenario.shortAfter = await measurePopper(resize.page)
    resize.scenario.screenshotShort = await saveScreenshot(resize.page, 'resize-390x375-open')
    resize.scenario.shortScroll = await wheelAndMeasure(resize.page)
    resize.scenario.screenshotShortScrolled = await saveScreenshot(resize.page, 'resize-390x375-scrolled')
    await resize.page.setViewportSize({ width: 390, height: 844 })
    await resize.page.waitForTimeout(650)
    resize.scenario.tallRestored = await measurePopper(resize.page)
    resize.scenario.screenshotTallRestored = await saveScreenshot(resize.page, 'resize-390x844-restored')
    await finishScenario(resize)
  } catch (error) {
    evidence.errors.push(String(error?.stack || error))
    throw error
  } finally {
    if (browser) await browser.close().catch((error) => evidence.errors.push(`browser.close: ${error}`))
    evidence.overlayServer.stopCommand = 'HTTP server.close() in assessment-b.mjs'
    await new Promise((resolve) => server.close(resolve))
    evidence.overlayServer.stopOutput = 'Temporary /detect.js endpoint stopped.'
    evidence.overlayServer.stopExitCode = 0
    evidence.overlayServer.finalPortListening = false
    await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`)
  process.exitCode = 1
})
