import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const here = path.dirname(fileURLToPath(import.meta.url))
const evidenceDir = here
const targetUrl = 'http://127.0.0.1:4189/components/lxdatepicker.html'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const skillScripts = 'C:/Users/Administrator/.codex/skills/impeccable/scripts'
const liveServerPath = path.join(skillScripts, 'live-server.mjs')
const targets = [
  'linkx-fe/src/components/LxDatePicker/index.vue',
  'linkx-fe/src/components/LxDatePicker/style.css',
  'linkx-fe/src/components/LxDatePicker/demo/basic.vue',
  'linkx-fe/docs/components/lxdatepicker.md',
]

const require = createRequire(import.meta.url)
const { chromium } = require(path.join(
  root,
  'other-admin/admin-vue3/node_modules/@playwright/test',
))

const consoleLogs = []
const pageErrors = []
const network = []
const overlays = []
let liveServerPort
let browser

function writeJson(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase()
}

function fingerprints() {
  return targets.map((relativePath) => {
    const absolutePath = path.join(root, relativePath)
    const stat = fs.statSync(absolutePath)
    return {
      path: relativePath,
      sha256: sha256(absolutePath),
      bytes: stat.size,
      lastWriteTimeUtc: stat.mtime.toISOString(),
    }
  })
}

function attachListeners(page, label) {
  page.on('console', (message) => {
    consoleLogs.push({
      view: label,
      timestamp: new Date().toISOString(),
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('pageerror', (error) => {
    pageErrors.push({ view: label, timestamp: new Date().toISOString(), error: error.stack || error.message })
  })
  page.on('request', (request) => {
    network.push({
      view: label,
      event: 'request',
      timestamp: new Date().toISOString(),
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
    })
  })
  page.on('requestfailed', (request) => {
    network.push({
      view: label,
      event: 'requestfailed',
      timestamp: new Date().toISOString(),
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
      failure: request.failure()?.errorText || 'unknown',
    })
  })
  page.on('response', (response) => {
    network.push({
      view: label,
      event: 'response',
      timestamp: new Date().toISOString(),
      status: response.status(),
      url: response.url(),
    })
  })
}

async function openTarget(context, label) {
  const page = await context.newPage()
  attachListeners(page, label)
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('.lx-date-picker-demo').waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(1800)
  return { page, status: response?.status() ?? null }
}

async function setHumanTitleAndPreflight(page) {
  return page.evaluate(() => {
    const originalTitle = document.title
    document.title = '[Human] LxDatePicker Assessment B'
    const probe = document.createElement('script')
    probe.dataset.assessmentBProbe = 'true'
    probe.textContent = 'window.__ASSESSMENT_B_MUTATION_PROBE__ = true'
    document.head.appendChild(probe)
    return {
      originalTitle,
      title: document.title,
      scriptAppended: probe.isConnected,
      scriptExecuted: window.__ASSESSMENT_B_MUTATION_PROBE__ === true,
    }
  })
}

function startLiveServer() {
  const result = spawnSync(process.execPath, [liveServerPath, '--background'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`live-server start exited ${result.status}: ${result.stderr}`)
  const info = JSON.parse(result.stdout.trim())
  liveServerPort = info.port
  return {
    port: info.port,
    pid: info.pid,
    stopCommand: `node "${liveServerPath}" stop --keep-inject`,
  }
}

function stopLiveServer() {
  if (!liveServerPort) return { attempted: false, reason: 'server was not started' }
  const result = spawnSync(process.execPath, [liveServerPath, 'stop', '--keep-inject'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  })
  return {
    attempted: true,
    exitCode: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

async function injectAndScan(page, view) {
  const src = `http://localhost:${liveServerPort}/detect.js?assessmentB=${encodeURIComponent(view)}`
  const injection = await page.evaluate((scriptUrl) => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = scriptUrl
    script.onload = () => resolve({ loaded: true, src: script.src })
    script.onerror = () => resolve({ loaded: false, src: script.src, error: 'script load error' })
    document.head.appendChild(script)
  }), src)
  await page.waitForTimeout(2500)
  const scan = await page.evaluate(async () => {
    if (typeof window.impeccableScanAsync !== 'function') {
      return { available: false, findings: [] }
    }
    const result = await window.impeccableScanAsync()
    const findings = result.flatMap(({ el, findings: elementFindings }) =>
      elementFindings.map((finding) => ({
        selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\\s+/).join('.')}` : ''}`,
        rule: finding.type || finding.id,
        severity: finding.severity || 'unspecified',
        detail: finding.detail || finding.snippet || '',
      })),
    )
    return { available: true, findings }
  })
  await page.waitForTimeout(400)
  const overlayCounts = await page.evaluate(() => ({
    overlays: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
    banner: document.querySelectorAll('.impeccable-banner').length,
    detectorFunctions: typeof window.impeccableScanAsync === 'function',
  }))
  const evidence = { view, injection, scan, overlayCounts }
  overlays.push(evidence)
  return evidence
}

async function openRange(page) {
  const inputs = page.locator('[data-testid="range"] input.el-range-input')
  const inputCount = await inputs.count()
  const inputEvidence = await inputs.evaluateAll((elements) => elements.map((element) => ({
    value: element.value,
    placeholder: element.placeholder,
    disabled: element.disabled,
    readOnly: element.readOnly,
    visible: element.getClientRects().length > 0,
    id: element.id,
    className: element.className,
  })))
  writeJson('range-inputs.json', inputEvidence)
  const input = inputs.first()
  await input.click({ timeout: 15000 })
  const visiblePanel = page.locator('.el-date-range-picker').filter({ visible: true }).last()
  try {
    await visiblePanel.waitFor({ state: 'visible', timeout: 12000 })
  } catch (error) {
    const panelEvidence = await page.locator('.el-date-range-picker').evaluateAll((elements) => elements.map((element) => {
      const bounds = element.getBoundingClientRect()
      return {
        visible: element.getClientRects().length > 0,
        actualVisible: element.getAttribute('actualvisible'),
        className: element.className,
        text: element.innerText.slice(0, 120),
        rect: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      }
    }))
    writeJson('range-panels-on-open-failure.json', { panelEvidence, inputEvidence })
    await saveScreenshot(page, 'range-open-failure.png')
    throw error
  }
  return { input, inputCount }
}

async function saveScreenshot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, name), fullPage: false, animations: 'disabled' })
}

async function inspectLayout(page, label) {
  return page.evaluate((view) => {
    const visible = (selector) => Array.from(document.querySelectorAll(selector))
      .filter((element) => element.getClientRects().length > 0)
    const popper = visible('.el-picker-panel').at(-1)
    const rect = (element) => {
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom }
    }
    const rgb = (color) => {
      const values = color.match(/[\\d.]+/g)?.map(Number)
      return values && values.length >= 3 ? values.slice(0, 3) : null
    }
    const luminance = (components) => {
      const channels = components.map((component) => {
        const normalized = component / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const samples = [
      ['range-mid', 'td.in-range:not(.start-date):not(.end-date) .el-date-table-cell__text'],
      ['range-start', 'td.start-date .el-date-table-cell__text'],
      ['range-end', 'td.end-date .el-date-table-cell__text'],
      ['weekday', '.el-date-table th'],
    ].map(([name, selector]) => {
      const element = visible(selector)[0]
      if (!element) return { name, present: false }
      const style = getComputedStyle(element)
      let background = style.backgroundColor
      let ancestor = element.parentElement
      while (ancestor && (!background || background === 'transparent' || background === 'rgba(0, 0, 0, 0)')) {
        background = getComputedStyle(ancestor).backgroundColor
        ancestor = ancestor.parentElement
      }
      const foregroundRgb = rgb(style.color)
      const backgroundRgb = rgb(background)
      let contrast = null
      if (foregroundRgb && backgroundRgb) {
        const values = [luminance(foregroundRgb), luminance(backgroundRgb)].sort((a, b) => b - a)
        contrast = Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2))
      }
      return {
        name,
        present: true,
        text: element.textContent.trim(),
        color: style.color,
        backgroundColor: background,
        fontSize: style.fontSize,
        contrastRatio: contrast,
      }
    })
    const dateTable = visible('.el-date-table').at(-1)
    return {
      view,
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      document: {
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      rangePopper: rect(popper),
      popperWithinViewport: !!popper && (() => {
        const bounds = popper.getBoundingClientRect()
        return bounds.left >= 0 && bounds.right <= window.innerWidth && bounds.top >= 0 && bounds.bottom <= window.innerHeight
      })(),
      rangeSummary: {
        visiblePanelCount: visible('.el-date-range-picker').length,
        visibleDateCellCount: visible('.el-date-table td').length,
        inRangeCount: visible('.el-date-table td.in-range').length,
        startCount: visible('.el-date-table td.start-date').length,
        endCount: visible('.el-date-table td.end-date').length,
        tableText: dateTable?.innerText || null,
      },
      textContrastSamples: samples,
      themeClass: document.querySelector('.lx-date-picker-demo')?.className || null,
    }
  }, label)
}

async function main() {
  fs.writeFileSync(path.join(evidenceDir, 'target-fingerprints-start.json'), `${JSON.stringify(fingerprints(), null, 2)}\n`, 'utf8')
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--window-size=1460,1000', '--disable-background-timer-throttling'],
  })
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  const { page: desktopPage, status: desktopStatus } = await openTarget(desktopContext, 'desktop-1440-light')
  const preflight = await setHumanTitleAndPreflight(desktopPage)
  writeJson('preflight.json', { targetUrl, httpStatus: desktopStatus, chromePath, browserVersion: browser.version(), ...preflight })
  if (!preflight.scriptAppended) throw new Error('Mutable script injection preflight failed')

  const serverInfo = startLiveServer()
  const serverHealthResponse = await fetch(`http://localhost:${serverInfo.port}/health`)
  writeJson('live-server.json', {
    ...serverInfo,
    healthStatus: serverHealthResponse.status,
    startedAt: new Date().toISOString(),
  })

  const range = await openRange(desktopPage)
  await saveScreenshot(desktopPage, 'desktop-1440x900-light-range-open.png')
  const lightLayout = await inspectLayout(desktopPage, 'desktop-light-range-open')
  writeJson('desktop-light-layout.json', { inputCount: range.inputCount, ...lightLayout })

  await range.input.focus()
  await range.input.press('ArrowDown')
  await desktopPage.waitForTimeout(250)
  const keyboard = await desktopPage.evaluate(() => {
    const active = document.activeElement
    const cell = active?.closest('td')
    const style = active instanceof HTMLElement ? getComputedStyle(active) : null
    return {
      activeTag: active?.tagName || null,
      activeRole: active?.getAttribute?.('role') || null,
      activeLabel: active?.getAttribute?.('aria-label') || active?.textContent?.trim() || null,
      activeClass: typeof active?.className === 'string' ? active.className : null,
      activeCellClass: cell?.className || null,
      visibleFocusOutline: style ? style.outlineStyle !== 'none' && style.outlineWidth !== '0px' : false,
      focusVisible: active instanceof HTMLElement ? active.matches(':focus-visible') : false,
    }
  })
  await saveScreenshot(desktopPage, 'desktop-1440x900-keyboard-focus.png')
  await desktopPage.keyboard.press('Escape')
  await desktopPage.waitForTimeout(250)
  const escapeClosed = await desktopPage.locator('.el-date-range-picker').filter({ visible: true }).count() === 0
  writeJson('keyboard-evidence.json', { ...keyboard, escapeClosed })

  await openRange(desktopPage)
  const lightOverlay = await injectAndScan(desktopPage, 'desktop-light-range-open')
  await saveScreenshot(desktopPage, 'desktop-1440x900-light-range-open-overlay.png')

  const { page: hudPage } = await openTarget(desktopContext, 'desktop-1440-hud')
  const hudPreflight = await setHumanTitleAndPreflight(hudPage)
  await hudPage.locator('.lx-date-picker-demo__toolbar input[type="checkbox"]').check()
  const hudRange = await openRange(hudPage)
  const hudLayout = await inspectLayout(hudPage, 'desktop-hud-range-open')
  await saveScreenshot(hudPage, 'desktop-1440x900-hud-range-open.png')
  const hudOverlay = await injectAndScan(hudPage, 'desktop-hud-range-open')
  await saveScreenshot(hudPage, 'desktop-1440x900-hud-range-open-overlay.png')
  writeJson('desktop-hud-layout.json', hudLayout)
  writeJson('hud-preflight.json', { ...hudPreflight, inputCount: hudRange.inputCount })

  await hudPage.emulateMedia({ reducedMotion: 'reduce' })
  const reducedMotion = await hudPage.evaluate(() => {
    const wrapper = document.querySelector('.lx-date-picker .el-input__wrapper')
    const popper = document.querySelector('.el-picker-panel')
    const wrapperStyle = wrapper ? getComputedStyle(wrapper) : null
    const popperStyle = popper ? getComputedStyle(popper) : null
    return {
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      wrapperTransitionDuration: wrapperStyle?.transitionDuration || null,
      wrapperAnimationDuration: wrapperStyle?.animationDuration || null,
      popperTransitionDuration: popperStyle?.transitionDuration || null,
      popperAnimationDuration: popperStyle?.animationDuration || null,
    }
  })
  const motionOverlay = await injectAndScan(hudPage, 'desktop-hud-reduced-motion-range-open')
  await saveScreenshot(hudPage, 'desktop-1440x900-hud-reduced-motion.png')
  writeJson('reduced-motion-evidence.json', reducedMotion)

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  const { page: mobilePage, status: mobileStatus } = await openTarget(mobileContext, 'mobile-390x844')
  const mobilePreflight = await setHumanTitleAndPreflight(mobilePage)
  const mobileRange = await openRange(mobilePage)
  const mobile390Layout = await inspectLayout(mobilePage, 'mobile-390x844-range-open')
  const mobileOverlay = await injectAndScan(mobilePage, 'mobile-390x844-range-open')
  await saveScreenshot(mobilePage, 'mobile-390x844-range-open-overlay.png')

  await mobilePage.setViewportSize({ width: 375, height: 844 })
  await mobilePage.waitForTimeout(500)
  const mobile375Layout = await inspectLayout(mobilePage, 'mobile-375x844-range-open')
  const mobile375Overlay = await injectAndScan(mobilePage, 'mobile-375x844-range-open')
  await saveScreenshot(mobilePage, 'mobile-375x844-range-open-overlay.png')
  writeJson('mobile-layouts.json', {
    httpStatus: mobileStatus,
    preflight: mobilePreflight,
    inputCount: mobileRange.inputCount,
    view390: mobile390Layout,
    view375: mobile375Layout,
  })

  writeJson('overlay-evidence.json', {
    injectionMode: 'script element src=/detect.js; detector executed through window.impeccableScanAsync()',
    liveServerUrl: `http://localhost:${liveServerPort}/detect.js`,
    views: [lightOverlay, hudOverlay, motionOverlay, mobileOverlay, mobile375Overlay],
    note: 'An empty overlay list means the scan executed but had no findings to draw; it is not evidence of a visible issue marker.',
  })
  writeJson('network-requests.json', network)
  writeJson('browser-console.json', consoleLogs)
  writeJson('page-errors.json', pageErrors)

  await desktopContext.close()
  await mobileContext.close()
  await browser.close()
  browser = undefined

  const finalFingerprints = fingerprints()
  writeJson('target-fingerprints-end.json', finalFingerprints)
  const startFingerprints = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'target-fingerprints-start.json'), 'utf8'))
  writeJson('fingerprint-comparison.json', startFingerprints.map((start) => {
    const end = finalFingerprints.find((entry) => entry.path === start.path)
    return { path: start.path, startSha256: start.sha256, endSha256: end?.sha256 || null, unchanged: !!end && start.sha256 === end.sha256 }
  }))
}

try {
  await main()
} catch (error) {
  writeJson('capture-failure.json', {
    timestamp: new Date().toISOString(),
    error: error.stack || error.message,
    liveServerPort: liveServerPort || null,
  })
  throw error
} finally {
  if (browser) await browser.close().catch(() => {})
  const stopResult = stopLiveServer()
  writeJson('live-server-stop.json', stopResult)
}
