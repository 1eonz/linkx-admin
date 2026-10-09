import { chromium } from 'file:///C:/Users/Administrator/AppData/Local/Temp/wave7-transferpanel-playwright/node_modules/playwright-core/index.mjs'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/postfix-assessment-b-2026-10-07',
)
const screenshotDir = path.join(outDir, 'screenshots')
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const detectorUrl = 'http://localhost:8400/detect.js'
const browserEndpoint = process.env.ASSESSMENT_B_CDP_URL ?? 'http://127.0.0.1:18417'

mkdirSync(screenshotDir, { recursive: true })

const scenarios = [
  { name: 'desktop-light', width: 1440, height: 1080, colorScheme: 'light' },
  { name: 'desktop-hud', width: 1440, height: 1080, colorScheme: 'light', action: 'hud' },
  { name: 'mobile-375-filter-keyboard', width: 375, height: 812, colorScheme: 'light', action: 'mobile-filter' },
  { name: 'loading', width: 1365, height: 900, colorScheme: 'light', action: 'loading' },
  { name: 'error', width: 1365, height: 900, colorScheme: 'light', action: 'error' },
  { name: 'empty-reduced-motion', width: 375, height: 812, colorScheme: 'light', reducedMotion: 'reduce', action: 'empty' },
]
const selectedNames = new Set(process.argv.slice(2))
const selectedScenarios = selectedNames.size
  ? scenarios.filter((scenario) => selectedNames.has(scenario.name))
  : scenarios
const evidencePath = path.join(outDir, 'browser-evidence.json')
const previousScenarios = (() => {
  try {
    return JSON.parse(readFileSync(evidencePath, 'utf8')).scenarios ?? []
  } catch {
    return []
  }
})()
const startedAt = new Date().toISOString()

function textOf(value) {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const browser = await chromium.connectOverCDP(browserEndpoint)
const results = []

try {
  for (const scenario of selectedScenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      colorScheme: scenario.colorScheme,
      reducedMotion: scenario.reducedMotion ?? 'no-preference',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    })
    const page = await context.newPage()
    const consoleMessages = []
    const pageErrors = []
    const requestFailures = []
    let detectorCaptureStarted = false
    page.on('console', (message) => {
      if (detectorCaptureStarted) {
        consoleMessages.push({ type: message.type(), text: message.text() })
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? null }))

    const result = {
      name: scenario.name,
      viewport: { width: scenario.width, height: scenario.height },
      colorScheme: scenario.colorScheme,
      reducedMotion: scenario.reducedMotion ?? 'no-preference',
      targetUrl,
      navigation: null,
      preflight: { titleSet: false, scriptAppended: false, inlineScriptRan: false },
      scenarioAction: null,
      detectorInjection: { attempted: false, succeeded: false, ready: false },
      detectorConsole: consoleMessages,
      pageErrors,
      requestFailures,
      metrics: null,
      screenshots: {},
      failure: null,
    }

    try {
      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      result.navigation = { status: response?.status() ?? null, finalUrl: page.url() }
      await page.waitForSelector('.lx-transfer-panel', { timeout: 30000 })
      await page.waitForTimeout(800)

      if (scenario.action === 'hud') {
        await page.locator('.transfer-panel-demo__settings summary').click()
        await page.getByLabel('HUD 深色主题').check()
      } else if (scenario.action === 'mobile-filter') {
        const sourceInput = page.getByRole('searchbox', { name: '筛选待选节点' })
        await sourceInput.fill('交警')
        await sourceInput.press('Shift+Tab')
        const focusedAction = await page.evaluate(() => ({
          text: document.activeElement?.textContent?.trim() ?? '',
          ariaLabel: document.activeElement?.getAttribute('aria-label'),
          outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
          outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
          outlineColor: getComputedStyle(document.activeElement).outlineColor,
        }))
        result.scenarioAction = { filter: '交警', focusAfterShiftTab: focusedAction }
        await page.keyboard.press('Enter')
        result.scenarioAction.keyboardEnter = 'sent'
      } else if (scenario.action === 'loading') {
        await page.locator('.transfer-panel-demo__settings summary').click()
        await page.getByRole('button', { name: '加载中' }).click()
      } else if (scenario.action === 'error') {
        await page.locator('.transfer-panel-demo__settings summary').click()
        await page.getByRole('button', { name: '加载失败' }).click()
      } else if (scenario.action === 'empty') {
        await page.locator('.transfer-panel-demo__settings summary').click()
        await page.getByRole('button', { name: '空结果' }).click()
      } else {
        result.scenarioAction = '默认数据状态'
      }
      if (result.scenarioAction === null) result.scenarioAction = scenario.action

      await page.locator('.lx-transfer-panel').scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)

      result.preflight = await page.evaluate(() => {
        document.title = `Assessment B - ${location.pathname}`
        const script = document.createElement('script')
        script.textContent = 'window.__assessmentBInjectionProbe = "script-ran";'
        document.head.appendChild(script)
        return {
          titleSet: document.title.startsWith('Assessment B - '),
          scriptAppended: script.isConnected,
          inlineScriptRan: window.__assessmentBInjectionProbe === 'script-ran',
          title: document.title,
        }
      })

      await page.screenshot({ path: path.join(screenshotDir, `${scenario.name}-base.png`) })
      result.screenshots.base = `screenshots/${scenario.name}-base.png`

      result.detectorInjection.attempted = true
      detectorCaptureStarted = true
      await page.addScriptTag({ url: detectorUrl, timeout: 20000 })
      result.detectorInjection.succeeded = true
      await page.waitForTimeout(2800)
      result.detectorInjection.ready = await page.evaluate(() => typeof window.impeccableScan === 'function')
      result.detectorFindings = await page.evaluate(() => {
        if (typeof window.impeccableScan !== 'function') return []
        return window.impeccableScan().flatMap(({ el, findings }) => findings.map((finding) => ({
          id: finding.type ?? finding.id ?? null,
          detail: finding.detail ?? finding.snippet ?? null,
          element: {
            tag: el?.tagName?.toLowerCase() ?? null,
            id: el?.id ?? null,
            className: typeof el?.className === 'string' ? el.className : '',
            text: el?.textContent?.trim().slice(0, 96) ?? '',
          },
        })))
      })
      await page.waitForTimeout(250)

      result.metrics = await page.evaluate(() => {
        const visible = (el) => {
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        }
        const rectOf = (el) => {
          const r = el.getBoundingClientRect()
          return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) }
        }
        const parseColor = (color) => {
          const m = color.match(/rgba?\(([^)]+)\)/)
          if (!m) return null
          const parts = m[1].split(',').map((part) => Number.parseFloat(part.trim()))
          return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
        }
        const luminance = (color) => {
          const channel = (value) => {
            const v = value / 255
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          }
          return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
        }
        const backgroundFor = (el) => {
          let current = el
          while (current && current !== document.documentElement) {
            const color = parseColor(getComputedStyle(current).backgroundColor)
            if (color && color.a > 0.95) return color
            current = current.parentElement
          }
          return parseColor(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 }
        }
        const ratios = ['.lx-transfer-panel__title', '.lx-transfer-panel__caption', '.lx-transfer-panel__node-status', '.lx-transfer-panel__header-status', '.lx-transfer-panel__node-code']
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)).filter(visible).slice(0, 3).map((el) => {
            const foreground = parseColor(getComputedStyle(el).color)
            const background = backgroundFor(el)
            if (!foreground || !background) return { selector, text: el.textContent.trim(), ratio: null }
            const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
            return { selector, text: el.textContent.trim().slice(0, 48), foreground, background, ratio: Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2)) }
          }))
        const panel = document.querySelector('.lx-transfer-panel')
        const panelRect = panel ? panel.getBoundingClientRect() : null
        const shellNodes = Array.from(document.querySelectorAll('.VPNav, .VPLocalNav, .VPSidebar, .VPDocAside'))
          .filter(visible)
          .map((el) => ({ selector: `.${String(el.className).split(/\s+/)[0]}`, rect: rectOf(el) }))
        const shellOcclusions = shellNodes.filter(({ rect }) => panelRect && rect.left < panelRect.right && rect.right > panelRect.left && rect.top < panelRect.bottom && rect.bottom > panelRect.top)
        const overflowRecords = Array.from(document.querySelectorAll('body *')).filter(visible).map((el) => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1)
        const describeOverflow = ({ el, rect }) => ({ tag: el.tagName.toLowerCase(), className: typeof el.className === 'string' ? el.className : '', text: el.textContent.trim().slice(0, 60), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) })
        const rightOverflowElements = overflowRecords.filter(({ rect }) => rect.right > innerWidth + 1)
          .sort((a, b) => b.rect.right - a.rect.right).slice(0, 20).map(describeOverflow)
        const leftOffscreenElements = overflowRecords.filter(({ rect }) => rect.left < -1)
          .sort((a, b) => a.rect.left - b.rect.left).slice(0, 12).map(describeOverflow)
        const disabledControls = Array.from(document.querySelectorAll('.lx-transfer-panel button:disabled')).map((button) => ({
          label: button.getAttribute('aria-label'),
          title: button.title,
          describedBy: button.getAttribute('aria-describedby'),
          describedText: button.getAttribute('aria-describedby') ? document.getElementById(button.getAttribute('aria-describedby'))?.textContent.trim() ?? null : null,
        }))
        const active = document.activeElement
        const focus = active && active !== document.body ? {
          tag: active.tagName.toLowerCase(),
          text: active.textContent?.trim().slice(0, 60) ?? '',
          ariaLabel: active.getAttribute('aria-label'),
          outlineStyle: getComputedStyle(active).outlineStyle,
          outlineWidth: getComputedStyle(active).outlineWidth,
          outlineColor: getComputedStyle(active).outlineColor,
        } : null
        return {
          title: document.title,
          bodyClass: document.body.className,
          demoClass: document.querySelector('.transfer-panel-demo')?.className ?? null,
          panelCount: document.querySelectorAll('.lx-transfer-panel').length,
          panelRect: panel ? rectOf(panel) : null,
          viewport: { width: innerWidth, height: innerHeight },
          screenWidth: screen.width,
          visualViewportWidth: visualViewport?.width ?? null,
          devicePixelRatio,
          max480Media: matchMedia('(max-width: 480px)').matches,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
          pageScrollWidth: document.documentElement.scrollWidth,
          documentHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          rightOverflowElements,
          leftOffscreenElements,
          shellNodes,
          shellOcclusions,
          disabledControls,
          textContrastSamples: ratios,
          selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent.trim() ?? null,
          treeNodeCount: document.querySelector('[data-testid="tree-node-count"]')?.textContent.trim() ?? null,
          hostMessage: document.querySelector('.transfer-panel-demo__message')?.textContent.trim() ?? null,
          loadingBusy: document.querySelector('.transfer-panel-demo__surface')?.getAttribute('aria-busy') ?? null,
          keyboardFocus: focus,
          reducedMotionMedia: matchMedia('(prefers-reduced-motion: reduce)').matches,
          visibleDetectorOverlays: document.querySelectorAll('.impeccable-overlay').length,
          detectorLabels: Array.from(document.querySelectorAll('.impeccable-label')).slice(0, 30).map((el) => el.textContent.trim()),
          detectorBanner: document.querySelector('.impeccable-banner')?.textContent.trim() ?? null,
        }
      })

      await page.screenshot({ path: path.join(screenshotDir, `${scenario.name}-overlay.png`) })
      result.screenshots.overlay = `screenshots/${scenario.name}-overlay.png`
    } catch (error) {
      result.failure = error.stack ?? error.message
    }

    result.detectorConsole = consoleMessages
    result.pageErrors = pageErrors
    result.requestFailures = requestFailures
    results.push(result)
    await context.close()
  }
} finally {
  await browser.close()
}

const updatedNames = new Set(results.map((result) => result.name))
const combinedScenarios = scenarios
  .map((scenario) => results.find((result) => result.name === scenario.name)
    ?? previousScenarios.find((result) => result.name === scenario.name))
  .filter(Boolean)
writeFileSync(
  evidencePath,
  `${JSON.stringify({ startedAt, completedAt: new Date().toISOString(), browser: { name: 'Playwright Chromium over CDP', endpoint: browserEndpoint }, detectorUrl, targetUrl, updatedScenarios: [...updatedNames], scenarios: combinedScenarios }, null, 2)}\n`,
)
writeFileSync(
  path.join(outDir, 'browser-evidence-summary.txt'),
  combinedScenarios.map((result) => `${result.name}: nav=${result.navigation?.status ?? 'failed'}; preflight=${result.preflight.inlineScriptRan ? 'pass' : 'failed'}; detector=${result.detectorInjection.succeeded ? 'loaded' : 'failed'}; ready=${result.detectorInjection.ready}; overlays=${result.metrics?.visibleDetectorOverlays ?? 'n/a'}; failure=${result.failure ?? 'none'}`).join('\n') + '\n',
)
