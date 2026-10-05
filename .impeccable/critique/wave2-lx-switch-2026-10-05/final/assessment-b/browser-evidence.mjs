import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(evidenceDir, '../../../../../')
const require = createRequire(path.join(projectRoot, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const targetUrl = 'http://127.0.0.1:4195/components/lxswitch.html'
const detectorUrl = 'http://localhost:8400/detect.js'
const mode = process.argv[2]

const browser = await chromium.launch({ headless: true, executablePath: browserPath })
const browserInfo = { version: browser.version(), executablePath: browserPath }

async function saveJson(name, value) {
  await fs.writeFile(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`)
}

async function clickSwitch(page, name) {
  const input = page.locator(`.el-switch__input[aria-label="${name}"]`)
  await input.evaluate((element) => element.closest('.el-switch')?.click())
}

async function preflight() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  const mutation = await page.evaluate(() => {
    document.title = '[Human] LxSwitch Assessment B'
    const script = document.createElement('script')
    script.dataset.assessmentBPreflight = 'true'
    script.textContent = 'window.__assessmentBPreflight = "mutation-ok"'
    document.head.appendChild(script)
    return {
      title: document.title,
      scriptConnected: script.isConnected,
      injectedValue: window.__assessmentBPreflight,
    }
  })
  const result = {
    status: 'preflight',
    url: targetUrl,
    browserInfo,
    viewport: { width: 1280, height: 900 },
    httpStatus: response?.status() ?? null,
    mutation,
    pageErrors: errors,
  }
  await saveJson('browser-injection-preflight.json', result)
  await context.close()
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (response?.status() !== 200 || mutation.injectedValue !== 'mutation-ok' || errors.length) process.exitCode = 2
}

async function captureState(name, options = {}) {
  const contextOptions = {
    viewport: options.viewport ?? { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: options.colorScheme ?? 'light',
    reducedMotion: options.reducedMotion ?? 'no-preference',
    isMobile: options.isMobile ?? false,
    hasTouch: options.hasTouch ?? false,
  }
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  const consoleEvents = []
  const consoleTasks = []
  const pageErrors = []
  const requestFailures = []
  const responses = []
  const requests = []

  page.on('console', (message) => {
    consoleTasks.push((async () => {
      const args = await Promise.all(message.args().map(async (arg) => {
        try {
          return await arg.evaluate((value) => value instanceof Element
            ? {
                node: value.tagName.toLowerCase(),
                className: typeof value.className === 'string' ? value.className : '',
                text: (value.innerText || value.textContent || '').trim().slice(0, 140),
              }
            : value)
        } catch {
          return null
        }
      }))
      consoleEvents.push({ type: message.type(), text: message.text(), args: args.filter((arg) => arg !== null) })
    })())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }))
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? null }))
  page.on('response', (response) => responses.push({ url: response.url(), status: response.status() }))

  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.locator('.lx-switch-demo').waitFor({ state: 'visible', timeout: 15000 })

  if (options.hud) await page.locator('.lx-switch-demo__toolbar input[type="checkbox"]').check()
  if (options.scrollSelector) await page.locator(options.scrollSelector).scrollIntoViewIfNeeded()

  const beforeInjection = await page.evaluate(() => ({
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    mobileEmulation: { coarsePointer: matchMedia('(pointer: coarse)').matches, touchPoints: navigator.maxTouchPoints },
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hudTheme: document.documentElement.classList.contains('lx-theme-hud'),
  }))

  await page.addScriptTag({ url: detectorUrl, timeout: 15000 })
  await page.waitForTimeout(2200)

  if (options.focusSwitch) {
    await page.keyboard.press('Tab')
    const focusedName = await page.evaluate(() => {
      const element = document.activeElement?.closest?.('[role="switch"]')
      return element?.getAttribute('aria-label') || element?.getAttribute('aria-labelledby') || null
    })
    if (focusedName !== options.focusSwitch) {
      await page.getByRole('switch', { name: options.focusSwitch }).focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
    }
    await page.keyboard.press('Space')
  }
  if (options.startLoading) {
    await clickSwitch(page, options.startLoading)
    await page.waitForTimeout(90)
  }
  if (options.toggleSwitch) {
    await clickSwitch(page, options.toggleSwitch)
  }
  if (options.afterActionWait) await page.waitForTimeout(options.afterActionWait)

  const metrics = await page.evaluate(() => {
    const propsHeading = document.getElementById('lxswitch-props')
    const propsRegion = document.querySelector('.lx-switch-props')
    const overflowAncestors = (element) => {
      const result = []
      let current = element
      while (current && current !== document.body) {
        const style = getComputedStyle(current)
        if (current.scrollWidth > current.clientWidth + 1 || ['auto', 'scroll', 'hidden'].includes(style.overflowX)) {
          result.push({
            element: current.tagName.toLowerCase(),
            className: typeof current.className === 'string' ? current.className : '',
            clientWidth: current.clientWidth,
            scrollWidth: current.scrollWidth,
            overflowX: style.overflowX,
          })
        }
        current = current.parentElement
      }
      return result
    }
    const active = document.activeElement
    const focusedSwitch = active?.closest?.('[role="switch"]')
    const focusedCore = focusedSwitch?.querySelector('.el-switch__core')
    const switches = Array.from(document.querySelectorAll('[role="switch"]')).map((element) => {
      const rect = element.getBoundingClientRect()
      const parentSwitch = element.closest('.el-switch')
      return {
        name: element.getAttribute('aria-label') || element.getAttribute('aria-labelledby'),
        checked: element.getAttribute('aria-checked'),
        disabled: element.getAttribute('aria-disabled') === 'true' || parentSwitch?.classList.contains('is-disabled') === true,
        loading: parentSwitch?.classList.contains('is-loading') === true,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    })
    const demo = document.querySelector('.lx-switch-demo')
    const demoRect = demo?.getBoundingClientRect()
    const propsRect = propsRegion?.getBoundingClientRect()
    const animationStyles = Array.from(document.querySelectorAll('.el-switch__core, .el-switch__action')).slice(0, 8).map((element) => {
      const style = getComputedStyle(element)
      return { transitionDuration: style.transitionDuration, animationDuration: style.animationDuration }
    })
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      pageHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      demo: demoRect ? { clientWidth: demo.clientWidth, scrollWidth: demo.scrollWidth, width: Math.round(demoRect.width) } : null,
      props: propsRegion ? {
        clientWidth: propsRegion.clientWidth,
        scrollWidth: propsRegion.scrollWidth,
        horizontalOverflow: propsRegion.scrollWidth > propsRegion.clientWidth,
        rect: propsRect ? { x: Math.round(propsRect.x), y: Math.round(propsRect.y), width: Math.round(propsRect.width), height: Math.round(propsRect.height) } : null,
        overflowAncestors: overflowAncestors(propsRegion),
      } : null,
      propsHeadingFound: Boolean(propsHeading),
      mobileEmulation: { coarsePointer: matchMedia('(pointer: coarse)').matches, touchPoints: navigator.maxTouchPoints },
      hudTheme: document.documentElement.classList.contains('lx-theme-hud'),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      focus: {
        role: active?.getAttribute?.('role') ?? null,
        label: active?.getAttribute?.('aria-label') || active?.getAttribute?.('aria-labelledby') || null,
        focusVisible: active instanceof HTMLElement && active.matches(':focus-visible'),
        checked: focusedSwitch?.getAttribute('aria-checked') ?? null,
        outline: focusedCore ? getComputedStyle(focusedCore).outline : null,
      },
      switches,
      animationStyles,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      loadingSwitchCount: document.querySelectorAll('.el-switch.is-loading').length,
    }
  })

  const screenshot = `${name}.png`
  await page.screenshot({ path: path.join(evidenceDir, screenshot), fullPage: false })
  if (options.fullPage) await page.screenshot({ path: path.join(evidenceDir, `${name}-full.png`), fullPage: true })
  await Promise.all(consoleTasks)

  const result = {
    state: name,
    url: targetUrl,
    httpStatus: response?.status() ?? null,
    browserInfo,
    context: contextOptions,
    metrics: { ...beforeInjection, ...metrics },
    screenshot,
    fullPageScreenshot: options.fullPage ? `${name}-full.png` : null,
    overlayScript: detectorUrl,
    consoleEvents,
    pageErrors,
    requests,
    responses,
    requestFailures,
  }
  await saveJson(`${name}.json`, result)
  await context.close()
  return result
}

try {
  if (mode === 'preflight') {
    await preflight()
  } else if (mode === 'capture') {
    const results = []
    results.push(await captureState('browser-light-desktop', { fullPage: true, scrollSelector: '.lx-switch-demo' }))
    results.push(await captureState('browser-hud-dark', { hud: true, scrollSelector: '.lx-switch-demo' }))
    results.push(await captureState('browser-disabled', { scrollSelector: '[data-testid="standard-state"]' }))
    results.push(await captureState('browser-loading', { scrollSelector: '[data-testid="loading"]', startLoading: '省厅镜像同步' }))
    results.push(await captureState('browser-keyboard-focus', { scrollSelector: '[data-testid="standard-state"]', focusSwitch: '夜间低敏静默布防模式' }))
    results.push(await captureState('browser-mobile-375-touch', {
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
      scrollSelector: '#lxswitch-props',
    }))
    results.push(await captureState('browser-reduced-motion', { reducedMotion: 'reduce', scrollSelector: '[data-testid="standard-state"]' }))
    results.push(await captureState('browser-props-overflow-desktop', { scrollSelector: '#lxswitch-props' }))
    const summary = results.map((result) => ({
      state: result.state,
      screenshot: result.screenshot,
      fullPageScreenshot: result.fullPageScreenshot,
      httpStatus: result.httpStatus,
      viewport: result.metrics.viewport,
      mobileEmulation: result.metrics.mobileEmulation,
      hudTheme: result.metrics.hudTheme,
      reducedMotion: result.metrics.reducedMotion,
      pageHorizontalOverflow: result.metrics.pageHorizontalOverflow,
      props: result.metrics.props,
      focus: result.metrics.focus,
      overlayCount: result.metrics.overlayCount,
      loadingSwitchCount: result.metrics.loadingSwitchCount,
      consoleEventCount: result.consoleEvents.length,
      pageErrors: result.pageErrors,
      requestFailureCount: result.requestFailures.length,
    }))
    await saveJson('browser-summary.json', { browserInfo, targetUrl, results: summary })
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
    if (results.some((result) => result.httpStatus !== 200 || result.metrics.overlayCount === 0)) process.exitCode = 2
  } else {
    throw new Error('Usage: browser-evidence.mjs <preflight|capture>')
  }
} finally {
  await browser.close()
}
