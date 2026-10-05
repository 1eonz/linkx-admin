import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(evidenceDir, '../../../../../')
const require = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const targetUrl = 'http://127.0.0.1:4195/components/lxswitch.html'
const detectorUrl = 'http://localhost:8400/detect.js'

async function openPage(options = {}) {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const consoleErrors = []
  const responseErrors = []
  const requestFailures = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleErrors.push({ type: message.type(), text: message.text(), location: message.location() })
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 400) responseErrors.push({ status: response.status(), url: response.url() })
  })
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? null }))
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.locator('.lx-switch-demo').waitFor({ state: 'visible', timeout: 15000 })
  await page.addScriptTag({ url: detectorUrl, timeout: 15000 })
  await page.waitForTimeout(2200)
  return { context, page, response, consoleErrors, responseErrors, requestFailures }
}

try {
  const mobile = await openPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const mobileState = await mobile.page.evaluate(() => ({
    contextWidthRequested: 375,
    viewport: { width: innerWidth, height: innerHeight },
    visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null,
    screen: { width: screen.width, height: screen.height },
    devicePixelRatio,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    pageHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    propsRegion: (() => {
      const element = document.querySelector('.lx-switch-props')
      if (!element) return null
      return { clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, boxWidth: Math.round(element.getBoundingClientRect().width) }
    })(),
    propsSection: (() => {
      const element = document.querySelector('.vp-doc section[id="lxswitch-props"]') || document.getElementById('lxswitch-props')?.parentElement
      if (!element) return null
      const style = getComputedStyle(element)
      return { tag: element.tagName.toLowerCase(), className: typeof element.className === 'string' ? element.className : '', clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: style.overflowX }
    })(),
    switchHitBoxes: Array.from(document.querySelectorAll('.el-switch')).map((element) => {
      const rect = element.getBoundingClientRect()
      const input = element.querySelector('.el-switch__input')
      return { name: input?.getAttribute('aria-label') ?? null, width: Math.round(rect.width), height: Math.round(rect.height) }
    }),
  }))
  const mobileResult = {
    name: 'true-mobile-375-touch',
    options: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    httpStatus: mobile.response?.status() ?? null,
    metrics: mobileState,
    consoleErrors: mobile.consoleErrors,
    responseErrors: mobile.responseErrors,
    requestFailures: mobile.requestFailures,
  }
  await mobile.context.close()

  const loading = await openPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' })
  const loadingInput = loading.page.locator('.el-switch__input[aria-label="省厅镜像同步"]')
  await loadingInput.evaluate((element) => element.closest('.el-switch')?.click())
  await loading.page.waitForTimeout(100)
  const loadingState = await loadingInput.evaluate((input) => {
    const root = input.closest('.el-switch')
    const core = root?.querySelector('.el-switch__core')
    const action = root?.querySelector('.el-switch__action')
    const loadingNodes = Array.from(root?.querySelectorAll('[class*="load"], [class*="spin"]') ?? []).map((element) => ({
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === 'string' ? element.className : '',
      html: element.outerHTML.slice(0, 300),
    }))
    return {
      rootClass: root?.className ?? null,
      inputDisabled: input.getAttribute('aria-disabled'),
      inputChecked: input.getAttribute('aria-checked'),
      coreHtml: core?.innerHTML ?? null,
      actionHtml: action?.innerHTML ?? null,
      loadingNodes,
      statusText: document.querySelector('.lx-switch-demo__status')?.textContent?.trim() ?? null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
  await loading.page.screenshot({ path: path.join(evidenceDir, 'browser-loading-confirm.png'), fullPage: false })
  const loadingResult = {
    name: 'loading-spinner-confirmation',
    options: { viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' },
    httpStatus: loading.response?.status() ?? null,
    metrics: loadingState,
    consoleErrors: loading.consoleErrors,
    responseErrors: loading.responseErrors,
    requestFailures: loading.requestFailures,
  }
  await loading.context.close()

  const focus = await openPage({ viewport: { width: 1280, height: 900 } })
  const focusInput = focus.page.locator('.el-switch__input[aria-label="夜间低敏静默布防模式"]')
  await focusInput.evaluate((element) => element.focus())
  await focus.page.keyboard.press('Space')
  const focusState = await focusInput.evaluate((input) => {
    const root = input.closest('.el-switch')
    const core = root?.querySelector('.el-switch__core')
    const style = core ? getComputedStyle(core) : null
    return {
      role: input.getAttribute('role'),
      checked: input.getAttribute('aria-checked'),
      focusVisible: input.matches(':focus-visible'),
      outline: style ? style.outline : null,
      outlineOffset: style ? style.outlineOffset : null,
      rootClass: root?.className ?? null,
    }
  })
  await focus.page.screenshot({ path: path.join(evidenceDir, 'browser-keyboard-focus-confirm.png'), fullPage: false })
  const focusResult = {
    name: 'keyboard-focus-ring-confirmation',
    options: { viewport: { width: 1280, height: 900 } },
    httpStatus: focus.response?.status() ?? null,
    metrics: focusState,
    consoleErrors: focus.consoleErrors,
    responseErrors: focus.responseErrors,
    requestFailures: focus.requestFailures,
  }
  await focus.context.close()

  const results = [mobileResult, loadingResult, focusResult]
  await fs.writeFile(path.join(evidenceDir, 'browser-state-probes.json'), `${JSON.stringify(results, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
} finally {
  await browser.close()
}
