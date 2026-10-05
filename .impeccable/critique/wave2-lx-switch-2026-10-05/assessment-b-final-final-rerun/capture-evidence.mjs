import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(evidenceDir, '../../../../')
const require = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const targetUrl = 'http://127.0.0.1:4194/components/lxswitch.html'
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
  const externalRequests = []

  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() })
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null })
  })
  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url())
    if (
      (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') &&
      requestUrl.origin !== new URL(targetUrl).origin &&
      requestUrl.origin !== new URL(detectorUrl).origin
    ) {
      externalRequests.push(requestUrl.href)
      await route.abort()
      return
    }
    await route.continue()
  })

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 20000 })
    await page.getByRole('heading', { name: 'LxSwitch 状态开关' }).waitFor({ state: 'visible' })

    if (options.hud) {
      await page.getByRole('checkbox', { name: 'HUD 深色主题（全页预览）' }).check()
    }
    if (options.prepare) await options.prepare(page)

    if (options.captureBeforeDetector) {
      await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false })
    }

    if (options.injectDetector !== false) {
      await page.addScriptTag({ url: detectorUrl })
      await page.waitForTimeout(2300)
    }
    if (options.afterDetector) await options.afterDetector(page)
    if (options.afterDetectorWaitMs) await page.waitForTimeout(options.afterDetectorWaitMs)
    if (!options.captureBeforeDetector || options.captureAfterDetector) {
      await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false })
    }

    const metrics = await page.evaluate(() => {
      const active = document.activeElement
      const focusedSwitch = active?.closest?.('[role="switch"]')
      const core = focusedSwitch?.querySelector('.el-switch__core')
      const table = document.querySelector('#lxswitch-props')?.nextElementSibling?.nextElementSibling
      const switches = Array.from(document.querySelectorAll('[role="switch"]')).map((element) => {
        const host = element.closest('.lx-switch') ?? element
        const rect = host.getBoundingClientRect()
        return {
          label: element.getAttribute('aria-label') || element.getAttribute('aria-labelledby'),
          checked: element.getAttribute('aria-checked'),
          disabled: element.getAttribute('aria-disabled') === 'true' || element.hasAttribute('disabled'),
          box: { width: Math.round(rect.width), height: Math.round(rect.height) },
        }
      })
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
        propsTable: table
          ? { scrollWidth: table.scrollWidth, clientWidth: table.clientWidth, scrollLeft: table.scrollLeft }
          : null,
        overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      }
    })
    const evidence = {
      state: name,
      url: targetUrl,
      screenshot: `${name}.png`,
      metrics,
      consoleMessages,
      pageErrors,
      failedRequests,
      externalRequests,
    }
    await fs.writeFile(path.join(evidenceDir, `${name}.json`), `${JSON.stringify(evidence, null, 2)}\n`)
    results.push({ state: name, ...evidence })
  } catch (error) {
    const failure = { state: name, error: String(error), pageErrors, failedRequests, externalRequests }
    await fs.writeFile(path.join(evidenceDir, `${name}.failure.json`), `${JSON.stringify(failure, null, 2)}\n`)
    results.push(failure)
  } finally {
    await context.close()
  }
}

try {
  await capture('browser-light-desktop', {
    prepare: async (page) => page.getByRole('heading', { name: '交互示例' }).scrollIntoViewIfNeeded(),
  })
  await capture('browser-hud-dark', {
    hud: true,
    prepare: async (page) => page.getByRole('heading', { name: '交互示例' }).scrollIntoViewIfNeeded(),
  })
  await capture('browser-disabled', {
    prepare: async (page) => page.getByTestId('standard-state').scrollIntoViewIfNeeded(),
  })
  await capture('browser-loading', {
    captureBeforeDetector: true,
    injectDetector: false,
    prepare: async (page) => {
      await page.getByTestId('loading').scrollIntoViewIfNeeded()
      const control = page.getByRole('switch', { name: '省厅镜像同步' })
      await page.locator('.lx-switch.el-switch').filter({ has: control }).click()
      await page.waitForTimeout(100)
    },
  })
  await capture('browser-keyboard-focus', {
    prepare: async (page) => {
      await page.getByRole('heading', { name: '交互示例' }).scrollIntoViewIfNeeded()
      const target = page.getByRole('switch', { name: '夜间低敏静默布防模式' })
      await target.focus()
      await page.keyboard.press('Space')
    },
  })
  await capture('browser-mobile-375-touch', {
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    prepare: async (page) => page.getByRole('heading', { name: '交互示例' }).scrollIntoViewIfNeeded(),
  })
  await capture('browser-reduced-motion', {
    reducedMotion: 'reduce',
    prepare: async (page) => page.getByRole('heading', { name: '交互示例' }).scrollIntoViewIfNeeded(),
  })
  await capture('browser-props-sticky-scroll', {
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    prepare: async (page) => {
      const table = page.locator('.vp-doc #lxswitch-props + p + table')
      await table.scrollIntoViewIfNeeded()
      await table.evaluate((element) => {
        element.scrollLeft = element.scrollWidth
      })
    },
  })
  await fs.writeFile(path.join(evidenceDir, 'browser-evidence-summary.json'), `${JSON.stringify(results, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(results.map((item) => ({
    state: item.state,
    screenshot: item.screenshot,
    overlayCount: item.metrics?.overlayCount ?? null,
    viewport: item.metrics?.viewport ?? null,
    hudTheme: item.metrics?.hudTheme ?? null,
    reducedMotion: item.metrics?.reducedMotion ?? null,
    focusVisible: item.metrics?.focus?.focusVisible ?? null,
    horizontalOverflow: item.metrics?.horizontalOverflow ?? null,
    pageErrors: item.pageErrors ?? [],
    failedRequests: item.failedRequests ?? [],
  })), null, 2)}\n`)
} finally {
  await browser.close()
}
