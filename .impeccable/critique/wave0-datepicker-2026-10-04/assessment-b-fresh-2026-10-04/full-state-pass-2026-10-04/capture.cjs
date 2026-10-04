const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { createRequire } = require('node:module')

const requireFromAdmin = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = requireFromAdmin('@playwright/test')

const outputDir = process.env.ASSESSMENT_B_DIR
const detectorUrl = process.env.DETECTOR_URL
const targetUrl =
  'http://127.0.0.1:4174/components/lxdatepicker.html#%E4%BA%A4%E4%BA%92%E7%A4%BA%E4%BE%8B'
const chromeExe = process.env.CHROME_EXE
const requests = []
const responses = []
const requestFailures = []
const consoleMessages = []
const pageErrors = []

const record = {
  capturedAt: new Date().toISOString(),
  target: { url: targetUrl, route: 'components/lxdatepicker.html#交互示例' },
  browser: {},
  detector: {
    url: detectorUrl,
    serverPid: Number(process.env.DETECTOR_SERVER_PID),
    serverPort: Number(process.env.DETECTOR_SERVER_PORT),
  },
  states: {},
  keyboard: {},
  reducedMotion: {},
  network: { requests, responses, requestFailures },
  consoleMessages,
  pageErrors,
}

function addTelemetry(page, stateName) {
  page.on('request', (request) =>
    requests.push({
      state: stateName,
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    }),
  )
  page.on('response', (response) =>
    responses.push({
      state: stateName,
      url: response.url(),
      status: response.status(),
      resourceType: response.request().resourceType(),
    }),
  )
  page.on('requestfailed', (request) =>
    requestFailures.push({
      state: stateName,
      url: request.url(),
      error: request.failure() ? request.failure().errorText : 'unknown',
    }),
  )
  page.on('console', (message) =>
    consoleMessages.push({
      state: stateName,
      type: message.type(),
      text: message.text(),
      url: message.location().url || '',
    }),
  )
  page.on('pageerror', (error) =>
    pageErrors.push({ state: stateName, message: error.message }),
  )
}

async function createFreshPage(browser, stateName, viewport, colorScheme) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  addTelemetry(page, stateName)
  const response = await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.locator('#demo-date-control-start').waitFor({
    state: 'visible',
    timeout: 30000,
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  return { context, page, response }
}

async function closeCalendar(page) {
  const popper = page.locator('.lx-date-picker__popper:visible').first()
  const wasOpen = await popper.isVisible().catch(() => false)
  if (wasOpen) {
    await page.keyboard.press('Escape')
    await page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll('.lx-date-picker__popper')).some(
          (element) => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              rect.width > 0 &&
              rect.height > 0
            )
          },
        ),
      { timeout: 5000 },
    )
  }
  return { wasOpen, closed: !(await popper.isVisible().catch(() => false)) }
}

async function setDocsTheme(page, dark) {
  const before = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  )
  let method = 'already-requested-state'
  if (before !== dark) {
    const switcher = page.locator('.VPSwitchAppearance').first()
    if ((await switcher.count()) > 0) {
      await switcher.click()
      method = 'VitePress appearance switch'
      await page.waitForFunction(
        (requested) => document.documentElement.classList.contains('dark') === requested,
        dark,
        { timeout: 5000 },
      )
    } else {
      await page.evaluate((requested) => {
        document.documentElement.classList.toggle('dark', requested)
      }, dark)
      method = 'document class fallback'
    }
  }
  return {
    before,
    requestedDark: dark,
    after: await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    ),
    method,
  }
}

async function setHudTheme(page, enabled) {
  const closeResult = await closeCalendar(page)
  const checkbox = page.locator('.lx-date-picker-demo input[type="checkbox"]').first()
  const count = await checkbox.count()
  if (count !== 1) throw new Error(`Expected one HUD checkbox, found ${count}`)
  const before = await checkbox.isChecked()
  if (enabled !== before) {
    if (enabled) await checkbox.check()
    else await checkbox.uncheck()
  }
  return {
    calendarClosedBeforeToggle: closeResult.closed,
    before,
    requested: enabled,
    after: await checkbox.isChecked(),
  }
}

async function inspectPopper(page) {
  return page.evaluate(() => {
    const visible = Array.from(
      document.querySelectorAll('.lx-date-picker__popper'),
    ).filter((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      )
    })
    const popper = visible[visible.length - 1]
    const input = document.querySelector('#demo-date-control-start')
    const inputRect = input ? input.getBoundingClientRect() : null
    const viewport = { width: innerWidth, height: innerHeight }
    const rect = popper ? popper.getBoundingClientRect() : null
    return {
      visible: !!popper,
      count: visible.length,
      className: popper ? String(popper.className) : '',
      hudClass: !!popper && popper.classList.contains('lx-theme-hud'),
      background: popper ? getComputedStyle(popper).backgroundColor : null,
      color: popper ? getComputedStyle(popper).color : null,
      calendarTables: popper ? popper.querySelectorAll('.el-date-table').length : 0,
      rangePanels: popper
        ? popper.querySelectorAll('.el-date-range-picker__content').length
        : 0,
      monthHeadings: popper
        ? Array.from(
            popper.querySelectorAll('.el-date-range-picker__header'),
          ).map((element) => element.innerText.trim())
        : [],
      bounds: rect
        ? {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
          }
        : null,
      triggerBounds: inputRect
        ? {
            x: Math.round(inputRect.x),
            y: Math.round(inputRect.y),
            width: Math.round(inputRect.width),
            height: Math.round(inputRect.height),
            bottom: Math.round(inputRect.bottom),
          }
        : null,
      viewport,
      withinViewport:
        !!rect &&
        rect.left >= 0 &&
        rect.right <= innerWidth &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight,
      scroll: { x: scrollX, y: scrollY, width: document.documentElement.scrollWidth },
      docsDark: document.documentElement.classList.contains('dark'),
      pageHud: !!document.querySelector('.lx-date-picker-demo.lx-theme-hud'),
    }
  })
}

async function runDetector(page) {
  const preflight = await page.evaluate(() => {
    const baseTitle = document.title.replace(/\s+\[Human\]$/, '')
    document.title = '[Human] ' + baseTitle
    const script = document.createElement('script')
    script.textContent = 'window.__impeccableInjectionPreflight = true;'
    document.head.appendChild(script)
    return {
      title: document.title,
      scriptTagAppended: script.isConnected,
      scriptExecuted: window.__impeccableInjectionPreflight === true,
    }
  })
  const scriptResponse = await fetch(detectorUrl)
  const scriptBody = await scriptResponse.text()
  await page.addScriptTag({ url: detectorUrl })
  await page.waitForTimeout(2600)
  const available = await page.evaluate(() => ({
    scanAvailable: typeof window.impeccableScan === 'function',
    detectAvailable: typeof window.impeccableDetect === 'function',
  }))
  await page.evaluate(() => window.impeccableScan())
  await page.waitForTimeout(2600)
  const scan = await page.evaluate(() => {
    const findings = window.impeccableDetect()
    const overlays = Array.from(
      document.querySelectorAll('.impeccable-overlay'),
    ).map((element) => ({
      className: String(element.className).slice(0, 200),
      text: element.innerText.slice(0, 200),
    }))
    return {
      count: findings.length,
      findings,
      overlayCount: overlays.length,
      overlays,
    }
  })
  return {
    preflight,
    httpStatus: scriptResponse.status,
    scriptBytes: Buffer.byteLength(scriptBody),
    scriptSha256: crypto.createHash('sha256').update(scriptBody).digest('hex'),
    available,
    scan,
  }
}

async function captureVisualState(browser, stateName, options) {
  const { context, page, response } = await createFreshPage(
    browser,
    stateName,
    options.viewport,
    options.colorScheme,
  )
  const state = {
    viewport: options.viewport,
    colorScheme: options.colorScheme,
    initialResponseStatus: response ? response.status() : null,
    title: await page.title(),
  }
  try {
    state.docsTheme = await setDocsTheme(page, options.darkDocs)
    state.hudToggle = await setHudTheme(page, options.hud)
    const trigger = page.locator('#demo-date-control-start')
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    await page.locator('.lx-date-picker__popper:visible').first().waitFor({
      state: 'visible',
      timeout: 10000,
    })
    await page.waitForTimeout(500)
    state.beforeOverlay = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, `${stateName}.png`),
    })
    state.detector = await runDetector(page)
    state.afterOverlay = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, `${stateName}-overlay.png`),
    })
    state.escapeBeforeStateEnd = await closeCalendar(page)
  } finally {
    await context.close()
  }
  return state
}

async function inspectKeyboardAndMotion(browser) {
  const { context, page, response } = await createFreshPage(
    browser,
    'keyboard-reduced-motion',
    { width: 1440, height: 1000 },
    'light',
  )
  const input = page.locator('#demo-date-effective')
  await input.waitFor({ state: 'visible', timeout: 30000 })
  const state = {
    initialResponseStatus: response ? response.status() : null,
    noPreference: await input.evaluate((element) => {
      const wrapper = element.closest('.el-input')?.querySelector('.el-input__wrapper')
      return {
        reduceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        duration: wrapper ? getComputedStyle(wrapper).transitionDuration : null,
        property: wrapper ? getComputedStyle(wrapper).transitionProperty : null,
      }
    }),
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  state.reduce = await input.evaluate((element) => {
    const wrapper = element.closest('.el-input')?.querySelector('.el-input__wrapper')
    return {
      reduceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: wrapper ? getComputedStyle(wrapper).transitionDuration : null,
      property: wrapper ? getComputedStyle(wrapper).transitionProperty : null,
    }
  })

  await input.focus()
  state.valueBeforeKeys = await input.inputValue()
  await page.keyboard.press('ArrowDown')
  await page.locator('.lx-date-picker__popper:visible').first().waitFor({
    state: 'visible',
    timeout: 5000,
  })
  state.afterArrowDown = await page.evaluate(() => {
    const element = document.activeElement
    return element
      ? {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          className: String(element.className).slice(0, 160),
          text: element.textContent?.trim() ?? '',
          dataDate: element.getAttribute('data-date'),
        }
      : null
  })
  await page.keyboard.press('ArrowRight')
  state.afterArrowRight = await page.evaluate(() => {
    const element = document.activeElement
    const inputElement = document.querySelector('#demo-date-effective')
    return {
      activeElement: element
        ? {
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute('role'),
            className: String(element.className).slice(0, 160),
            text: element.textContent?.trim() ?? '',
            dataDate: element.getAttribute('data-date'),
          }
        : null,
      value: inputElement ? inputElement.value : null,
    }
  })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(250)
  state.afterEnter = await page.evaluate(() => {
    const element = document.activeElement
    const inputElement = document.querySelector('#demo-date-effective')
    const popper = Array.from(
      document.querySelectorAll('.lx-date-picker__popper'),
    ).some((item) => {
      const rect = item.getBoundingClientRect()
      const style = getComputedStyle(item)
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      )
    })
    return {
      panelOpen: popper,
      activeElement: element
        ? {
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            role: element.getAttribute('role'),
          }
        : null,
      value: inputElement ? inputElement.value : null,
    }
  })
  state.escapeBeforeStateEnd = await closeCalendar(page)
  state.afterEscape = await page.evaluate(() => {
    const element = document.activeElement
    return element
      ? {
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          role: element.getAttribute('role'),
        }
      : null
  })
  await context.close()
  return state
}

async function main() {
  let browser
  try {
    browser = await chromium.launch({ executablePath: chromeExe, headless: true })
    record.browser = {
      name: 'Google Chrome',
      version: browser.version(),
      executablePath: chromeExe,
      isolatedContexts: true,
    }
    record.states.desktopLight = await captureVisualState(
      browser,
      'desktop-light',
      {
        viewport: { width: 1440, height: 1000 },
        colorScheme: 'light',
        darkDocs: false,
        hud: false,
      },
    )
    record.states.desktopHud = await captureVisualState(browser, 'desktop-hud', {
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      darkDocs: false,
      hud: true,
    })
    record.states.desktopDocsDark = await captureVisualState(
      browser,
      'desktop-docs-dark',
      {
        viewport: { width: 1440, height: 1000 },
        colorScheme: 'dark',
        darkDocs: true,
        hud: false,
      },
    )
    record.states.mobile375 = await captureVisualState(browser, 'mobile-375', {
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
      darkDocs: false,
      hud: false,
    })
    record.keyboard = await inspectKeyboardAndMotion(browser)
    record.network.summary = {
      requests: requests.length,
      responses: responses.length,
      failedRequests: requestFailures.length,
      responseCodes: responses.reduce((counts, item) => {
        const key = String(item.status)
        counts[key] = (counts[key] || 0) + 1
        return counts
      }, {}),
    }
    record.consoleSummary = {
      errors: consoleMessages.filter((message) => message.type === 'error'),
      warnings: consoleMessages.filter(
        (message) => message.type === 'warn' || message.type === 'warning',
      ),
      impeccable: consoleMessages.filter((message) =>
        message.text.toLowerCase().includes('impeccable'),
      ),
    }
    fs.writeFileSync(
      path.join(outputDir, 'browser-full-state.json'),
      JSON.stringify(record, null, 2) + '\n',
      'utf8',
    )
    fs.writeFileSync(
      path.join(outputDir, 'requests.json'),
      JSON.stringify(record.network, null, 2) + '\n',
      'utf8',
    )
    fs.writeFileSync(
      path.join(outputDir, 'browser-console.json'),
      JSON.stringify(record.consoleSummary, null, 2) + '\n',
      'utf8',
    )
    process.stdout.write(
      JSON.stringify(
        {
          result: 'captured',
          browserVersion: record.browser.version,
          states: Object.fromEntries(
            Object.entries(record.states).map(([name, state]) => [name, {
              docsTheme: state.docsTheme,
              hudToggle: state.hudToggle,
              bounds: state.beforeOverlay.bounds,
              withinViewport: state.beforeOverlay.withinViewport,
              tables: state.beforeOverlay.calendarTables,
              hudClass: state.beforeOverlay.hudClass,
              detectorCount: state.detector.scan.count,
              escapeBeforeStateEnd: state.escapeBeforeStateEnd,
            }]),
          ),
          keyboard: record.keyboard,
          network: record.network.summary,
          pageErrors: pageErrors.length,
        },
        null,
        2,
      ) + '\n',
    )
  } catch (error) {
    record.error = { message: error.message, stack: error.stack }
    fs.writeFileSync(
      path.join(outputDir, 'browser-full-state.json'),
      JSON.stringify(record, null, 2) + '\n',
      'utf8',
    )
    process.stderr.write((error.stack || error.message) + '\n')
    process.exitCode = 1
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  process.stderr.write((error.stack || error.message) + '\n')
  process.exitCode = 1
})
