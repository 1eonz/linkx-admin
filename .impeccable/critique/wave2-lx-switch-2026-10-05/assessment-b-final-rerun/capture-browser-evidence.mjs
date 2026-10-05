import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(evidenceDir, '../../../..')
const require = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const targetUrl = 'http://127.0.0.1:4176/components/lxswitch.html'
const detectorUrl = 'http://localhost:8400/detect.js'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})
const results = []

async function capture(name, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: options.isMobile ?? false,
    hasTouch: options.hasTouch ?? false,
    colorScheme: options.colorScheme ?? 'light',
    reducedMotion: options.reducedMotion ?? 'no-preference',
  })
  const page = await context.newPage()
  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []

  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() })
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null })
  })

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 20000 })
  await page.getByRole('heading', { name: 'LxSwitch 状态开关' }).waitFor({ state: 'visible' })

  if (options.hud) {
    await page.locator('.lx-switch-demo__toolbar input[type="checkbox"]').check()
  }
  if (options.scrollTo) {
    await page.getByRole('heading', { name: options.scrollTo, exact: true }).scrollIntoViewIfNeeded()
  }
  if (options.prepare) await options.prepare(page)

  await page.addScriptTag({ url: detectorUrl })
  await page.waitForTimeout(2300)

  if (options.afterDetector) await options.afterDetector(page)
  if (options.afterDetectorWaitMs) await page.waitForTimeout(options.afterDetectorWaitMs)

  const screenshotPath = path.join(evidenceDir, `${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: false })

  const state = await page.evaluate(() => {
    const active = document.activeElement
    const switches = Array.from(document.querySelectorAll('[role="switch"]')).map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        label: element.getAttribute('aria-label') || element.getAttribute('aria-labelledby'),
        checked: element.getAttribute('aria-checked'),
        disabled: element.getAttribute('aria-disabled') === 'true' || element.hasAttribute('disabled'),
        box: { width: Math.round(rect.width), height: Math.round(rect.height) },
      }
    })
    const focusedSwitch = active?.closest?.('[role="switch"]')
    const core = focusedSwitch?.querySelector('.el-switch__core')
    const motionNodes = Array.from(document.querySelectorAll('.el-switch__core, .el-switch__action'))
    return {
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      hudTheme: document.documentElement.classList.contains('lx-theme-hud'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      focus: {
        tag: active?.tagName ?? null,
        role: active?.getAttribute?.('role') ?? null,
        label: active?.getAttribute?.('aria-label') ?? null,
        focusVisible: active instanceof HTMLElement && active.matches(':focus-visible'),
        switchChecked: focusedSwitch?.getAttribute('aria-checked') ?? null,
        outline: core ? getComputedStyle(core).outline : null,
      },
      switches,
      switchMotion: motionNodes.map((element) => {
        const style = getComputedStyle(element)
        return { transitionDuration: style.transitionDuration, animationDuration: style.animationDuration }
      }),
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
    }
  })

  const evidence = {
    state: name,
    url: targetUrl,
    screenshot: path.basename(screenshotPath),
    metrics: state,
    consoleMessages,
    pageErrors,
    failedRequests,
  }
  await fs.writeFile(path.join(evidenceDir, `${name}.console.json`), `${JSON.stringify(evidence, null, 2)}\n`)
  results.push({ state: name, screenshot: path.basename(screenshotPath), metrics: state, pageErrors, failedRequests })
  await context.close()
}

try {
  await capture('browser-light-desktop', { scrollTo: '交互示例' })
  await capture('browser-hud-dark', { hud: true, scrollTo: '交互示例' })
  await capture('browser-disabled', {
    scrollTo: '交互示例',
    prepare: async (page) => page.locator('[data-testid="standard-state"]').scrollIntoViewIfNeeded(),
  })
  await capture('browser-loading', {
    scrollTo: '交互示例',
    prepare: async (page) => page.locator('[data-testid="loading"]').scrollIntoViewIfNeeded(),
    afterDetector: async (page) => {
      await page.getByRole('switch', { name: '省厅镜像同步' }).click()
      await page.waitForTimeout(100)
    },
  })
  await capture('browser-keyboard-focus', {
    scrollTo: '交互示例',
    afterDetector: async (page) => {
      const target = page.getByRole('switch', { name: '夜间低敏静默布防模式' })
      await target.focus()
      await page.keyboard.press('Space')
      await page.waitForTimeout(100)
    },
  })
  await capture('browser-mobile-375-touch', {
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    scrollTo: '交互示例',
  })
  await capture('browser-reduced-motion', { scrollTo: '交互示例', reducedMotion: 'reduce' })

  await fs.writeFile(path.join(evidenceDir, 'browser-evidence-summary.json'), `${JSON.stringify(results, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(results.map(({ state, screenshot, metrics }) => ({
    state,
    screenshot,
    viewport: metrics.viewport,
    horizontalOverflow: metrics.horizontalOverflow,
    hudTheme: metrics.hudTheme,
    reducedMotion: metrics.reducedMotion,
    focusVisible: metrics.focus.focusVisible,
    focusedSwitchValue: metrics.focus.switchChecked,
    overlayCount: metrics.overlayCount,
    switchBoxes: metrics.switches.map((item) => item.box),
  })), null, 2)}\n`)
} finally {
  await browser.close()
}
