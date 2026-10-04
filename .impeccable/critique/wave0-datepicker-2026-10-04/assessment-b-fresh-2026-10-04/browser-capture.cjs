const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { createRequire } = require('node:module')

const requireFromAdmin = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = requireFromAdmin('@playwright/test')

const outputDir = process.env.ASSESSMENT_B_DIR
const targetUrl =
  'http://127.0.0.1:4174/components/lxdatepicker.html#%E4%BA%A4%E4%BA%92%E7%A4%BA%E4%BE%8B'
const detectorUrl = process.env.DETECTOR_URL
const requests = []
const responses = []
const requestFailures = []
const consoleMessages = []
const pageErrors = []

const record = {
  capturedAt: new Date().toISOString(),
  browser: {},
  target: { url: targetUrl, route: 'components/lxdatepicker.html#交互示例' },
  detector: {
    url: detectorUrl,
    serverPid: Number(process.env.DETECTOR_SERVER_PID),
    serverPort: Number(process.env.DETECTOR_SERVER_PORT),
  },
  injection: {},
  views: {},
  keyboard: {},
  reducedMotion: {},
  network: { requests, responses, requestFailures },
  consoleMessages,
  pageErrors,
}

async function inspectPopper(page) {
  return page.evaluate(() => {
    const visiblePoppers = Array.from(
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
    const popper = visiblePoppers[visiblePoppers.length - 1]
    if (!popper) {
      return {
        visible: false,
        visiblePopperCount: visiblePoppers.length,
        viewport: { width: innerWidth, height: innerHeight },
      }
    }

    const rect = popper.getBoundingClientRect()
    const contents = Array.from(
      popper.querySelectorAll('.el-date-range-picker__content'),
    )
    const tables = Array.from(popper.querySelectorAll('.el-date-table'))
    return {
      visible: true,
      visiblePopperCount: visiblePoppers.length,
      className: popper.className,
      rangeCalendarCount: contents.length,
      rangeCalendarClasses: contents.map((element) => element.className),
      calendarTableCount: tables.length,
      monthHeadings: Array.from(
        popper.querySelectorAll('.el-date-range-picker__header'),
      ).map((element) => element.innerText.trim()),
      weekdayHeaders: tables[0]
        ? Array.from(tables[0].querySelectorAll('th')).map((element) =>
            element.innerText.trim(),
          )
        : [],
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      },
      withinViewport:
        rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
      viewport: { width: innerWidth, height: innerHeight },
      narrowBreakpointMatches: matchMedia('(max-width: 640px)').matches,
      theme: {
        pageHud: !!document.querySelector(
          '.lx-date-picker-demo.lx-theme-hud',
        ),
        popperHud: popper.classList.contains('lx-theme-hud'),
        background: getComputedStyle(popper).backgroundColor,
        color: getComputedStyle(popper).color,
      },
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

async function scanView(page) {
  await page.evaluate(() => window.impeccableScan())
  await page.waitForTimeout(2600)
  return page.evaluate(() => {
    const findings = window.impeccableDetect()
    const nodes = Array.from(document.querySelectorAll('[class*="impeccable-"]'))
    return {
      count: Array.isArray(findings) ? findings.length : null,
      findings,
      overlayNodes: nodes
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className).slice(0, 220),
        }))
        .slice(0, 80),
      overlayNodeCount: nodes.length,
    }
  })
}

function getTransition(page) {
  return page.evaluate(() => {
    const input = document.querySelector('#demo-date-effective')
    const wrapper =
      input && input.closest('.el-input')
        ? input.closest('.el-input').querySelector('.el-input__wrapper')
        : null
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: wrapper
        ? getComputedStyle(wrapper).transitionDuration
        : null,
      transitionProperty: wrapper
        ? getComputedStyle(wrapper).transitionProperty
        : null,
    }
  })
}

async function main() {
  let browser
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_EXE,
      headless: true,
    })
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()

    page.on('request', (request) =>
      requests.push({
        at: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      }),
    )
    page.on('response', (response) =>
      responses.push({
        at: new Date().toISOString(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        resourceType: response.request().resourceType(),
      }),
    )
    page.on('requestfailed', (request) =>
      requestFailures.push({
        at: new Date().toISOString(),
        url: request.url(),
        resourceType: request.resourceType(),
        error: request.failure()
          ? request.failure().errorText
          : 'unknown',
      }),
    )
    page.on('console', (message) =>
      consoleMessages.push({
        at: new Date().toISOString(),
        type: message.type(),
        text: message.text(),
        url: message.location().url || '',
      }),
    )
    page.on('pageerror', (error) =>
      pageErrors.push({ at: new Date().toISOString(), message: error.message }),
    )

    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.locator('#demo-date-control-start').waitFor({
      state: 'visible',
      timeout: 30000,
    })
    record.browser = {
      name: 'Google Chrome',
      version: browser.version(),
      executablePath: process.env.CHROME_EXE,
      context: {
        isolated: true,
        viewport: { width: 1440, height: 1000 },
        colorScheme: 'light',
        reducedMotion: 'no-preference',
      },
      initialResponseStatus: response ? response.status() : null,
      initialTitle: await page.title(),
    }

    record.injection.preflight = await page.evaluate(() => {
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
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.addScriptTag({ url: detectorUrl })
    await page.waitForTimeout(2600)
    record.injection.detectorScriptLoaded = await page.evaluate(() => ({
      scanAvailable: typeof window.impeccableScan === 'function',
      detectAvailable: typeof window.impeccableDetect === 'function',
    }))
    const detectorResponse = await fetch(detectorUrl)
    const detectorBody = await detectorResponse.text()
    record.injection.scriptHttpStatus = detectorResponse.status
    record.injection.scriptSha256 = crypto
      .createHash('sha256')
      .update(detectorBody)
      .digest('hex')
    record.injection.scriptBytes = Buffer.byteLength(detectorBody)
    record.injection.scriptUrlInBrowserRequests = requests.some(
      (item) => item.url === detectorUrl,
    )

    const rangeStart = page.locator('#demo-date-control-start')
    await rangeStart.scrollIntoViewIfNeeded()
    await rangeStart.click()
    await page.locator('.lx-date-picker__popper:visible').first().waitFor({
      state: 'visible',
      timeout: 10000,
    })
    await page.waitForTimeout(350)
    record.views.desktopLightTwoMonth = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, 'desktop-light-two-month.png'),
    })
    record.views.desktopLightTwoMonth.detector = await scanView(page)
    await page.screenshot({
      path: path.join(outputDir, 'desktop-light-two-month-overlay.png'),
    })

    record.reducedMotion.noPreference = await getTransition(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    record.reducedMotion.reduce = await getTransition(page)

    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(350)
    record.views.mobile375SinglePanel = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, 'mobile-375x812-single-panel.png'),
    })
    record.views.mobile375SinglePanel.detector = await scanView(page)
    await page.screenshot({
      path: path.join(outputDir, 'mobile-375x812-single-panel-overlay.png'),
    })

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.waitForTimeout(250)
    const hudToggle = page.locator(
      '.lx-date-picker-demo input[type="checkbox"]',
    )
    record.views.hudToggleCount = await hudToggle.count()
    await hudToggle.check()
    await page.waitForTimeout(150)
    const popper = page.locator('.lx-date-picker__popper:visible').first()
    if (!(await popper.isVisible())) {
      await rangeStart.scrollIntoViewIfNeeded()
      await rangeStart.click()
    }
    await popper.waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(350)
    record.views.hudFloatingPopper = await inspectPopper(page)
    await page.screenshot({ path: path.join(outputDir, 'hud-floating-popper.png') })
    record.views.hudFloatingPopper.detector = await scanView(page)
    await page.screenshot({
      path: path.join(outputDir, 'hud-floating-popper-overlay.png'),
    })

    await hudToggle.uncheck()
    const effectiveInput = page.locator('#demo-date-effective')
    await effectiveInput.scrollIntoViewIfNeeded()
    if (await popper.isVisible()) {
      await effectiveInput.press('Escape').catch(() => {})
      await page.waitForTimeout(200)
    }
    await effectiveInput.focus()
    record.keyboard.valueBeforeKeys = await effectiveInput.inputValue()
    await effectiveInput.press('ArrowDown')
    await page.locator('.lx-date-picker__popper:visible').first().waitFor({
      state: 'visible',
      timeout: 5000,
    })
    record.keyboard.arrowDownOpenedPanel = true
    record.keyboard.activeElementAfterArrowDown = await page.evaluate(() => {
      const element = document.activeElement
      return element
        ? {
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
            className: String(element.className).slice(0, 180),
          }
        : null
    })
    await effectiveInput.press('ArrowRight')
    record.keyboard.valueAfterArrowRight = await effectiveInput.inputValue()
    await effectiveInput.press('Enter')
    await page.waitForTimeout(300)
    record.keyboard.enterClosedPanel = !(await popper.isVisible())
    record.keyboard.valueAfterEnter = await effectiveInput.inputValue()
    if (!(await popper.isVisible())) {
      await effectiveInput.press('ArrowDown')
      await page.locator('.lx-date-picker__popper:visible').first().waitFor({
        state: 'visible',
        timeout: 5000,
      })
    }
    await effectiveInput.press('Escape')
    await page.waitForTimeout(350)
    record.keyboard.escapeClosedPanel = !(await popper.isVisible())
    record.keyboard.focusAfterEscape = await page.evaluate(() => {
      const element = document.activeElement
      return element
        ? {
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            role: element.getAttribute('role'),
          }
        : null
    })

    const resourceUrls = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter(
          (url) =>
            url.toLowerCase().includes('datepicker') &&
            url.toLowerCase().includes('.vue'),
        ),
    )
    const servedModules = []
    for (const url of Array.from(new Set(resourceUrls))) {
      try {
        const fetched = await page.evaluate(async (resourceUrl) => {
          const result = await fetch(resourceUrl, { cache: 'no-store' })
          return { status: result.status, body: await result.text() }
        }, url)
        servedModules.push({
          url,
          status: fetched.status,
          bytes: Buffer.byteLength(fetched.body),
          sha256: crypto.createHash('sha256').update(fetched.body).digest('hex'),
          markers: {
            singlePanel: fetched.body.includes('singlePanel'),
            narrowViewport:
              fetched.body.includes('max-width: 640px') ||
              fetched.body.includes('maxWidth'),
            hudTheme: fetched.body.includes('lx-theme-hud'),
            demoDateControl: fetched.body.includes('demo-date-control'),
          },
        })
      } catch (error) {
        servedModules.push({ url, error: error.message })
      }
    }
    record.target.performanceResourceCandidates = resourceUrls
    record.target.servedModuleCandidates = servedModules
    record.target.sourceFingerprint = {
      componentSourceFiles: [
        'linkx-fe/src/components/LxDatePicker/index.vue',
        'linkx-fe/src/components/LxDatePicker/types.ts',
        'linkx-fe/src/components/LxDatePicker/style.css',
        'linkx-fe/src/components/LxDatePicker/demo/basic.vue',
      ],
      commitAtCollection: '2a93ef1a447fc4a72f688471cc14a0692703be60',
      note: '源码指纹和工作树差异详见 target-fingerprint.md',
    }

    record.network.summary = {
      requestCount: requests.length,
      responseCount: responses.length,
      failedRequestCount: requestFailures.length,
      responseCodes: responses.reduce((counts, item) => {
        const key = String(item.status)
        counts[key] = (counts[key] || 0) + 1
        return counts
      }, {}),
    }
    record.consoleSummary = {
      impeccableMessages: consoleMessages.filter((item) =>
        item.text.toLowerCase().includes('impeccable'),
      ),
      errors: consoleMessages.filter((item) => item.type === 'error'),
      warnings: consoleMessages.filter(
        (item) => item.type === 'warning' || item.type === 'warn',
      ),
    }
    fs.writeFileSync(
      path.join(outputDir, 'browser-evidence.json'),
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
          desktopPanels: record.views.desktopLightTwoMonth.rangeCalendarCount,
          mobilePanels: record.views.mobile375SinglePanel.rangeCalendarCount,
          hudClass: record.views.hudFloatingPopper.className,
          keyboard: record.keyboard,
          reducedMotion: record.reducedMotion,
          requestSummary: record.network.summary,
          detectorMessages: record.consoleSummary.impeccableMessages,
          pageErrors: pageErrors.length,
          modules: servedModules,
        },
        null,
        2,
      ) + '\n',
    )
    await context.close()
    await browser.close()
  } catch (error) {
    record.error = { message: error.message, stack: error.stack }
    fs.writeFileSync(
      path.join(outputDir, 'browser-evidence.json'),
      JSON.stringify(record, null, 2) + '\n',
      'utf8',
    )
    process.stderr.write((error.stack || error.message) + '\n')
    if (browser) await browser.close().catch(() => {})
    process.exitCode = 1
  }
}

main().catch((error) => {
  process.stderr.write((error.stack || error.message) + '\n')
  process.exitCode = 1
})
