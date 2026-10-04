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
  preflight: {},
  hud: {},
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
    if (!popper) return { visible: false, count: visiblePoppers.length }
    const rect = popper.getBoundingClientRect()
    return {
      visible: true,
      count: visiblePoppers.length,
      className: popper.className,
      hudClass: popper.classList.contains('lx-theme-hud'),
      background: getComputedStyle(popper).backgroundColor,
      color: getComputedStyle(popper).color,
      calendarTables: popper.querySelectorAll('.el-date-table').length,
      rangePanels: popper.querySelectorAll(
        '.el-date-range-picker__content',
      ).length,
      monthHeadings: Array.from(
        popper.querySelectorAll('.el-date-range-picker__header'),
      ).map((element) => element.innerText.trim()),
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      },
      viewport: { width: innerWidth, height: innerHeight },
      withinViewport:
        rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
      pageHud: !!document.querySelector(
        '.lx-date-picker-demo.lx-theme-hud',
      ),
    }
  })
}

async function scan(page) {
  await page.evaluate(() => window.impeccableScan())
  await page.waitForTimeout(2600)
  return page.evaluate(() => {
    const findings = window.impeccableDetect()
    const overlays = Array.from(
      document.querySelectorAll('.impeccable-overlay'),
    ).map((element) => ({
      className: String(element.className).slice(0, 220),
      text: element.innerText.slice(0, 240),
    }))
    return { count: findings.length, findings, overlayCount: overlays.length, overlays }
  })
}

function transitionState(page) {
  return page.evaluate(() => {
    const input = document.querySelector('#demo-date-effective')
    const wrapper =
      input && input.closest('.el-input')
        ? input.closest('.el-input').querySelector('.el-input__wrapper')
        : null
    return {
      reduceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: wrapper ? getComputedStyle(wrapper).transitionDuration : null,
      property: wrapper ? getComputedStyle(wrapper).transitionProperty : null,
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

    const initialResponse = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    const startInput = page.locator('#demo-date-control-start')
    await startInput.waitFor({ state: 'visible', timeout: 30000 })
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
      initialResponseStatus: initialResponse ? initialResponse.status() : null,
      title: await page.title(),
    }

    await page.evaluate(() => window.scrollTo(0, 0))
    const toggle = page.locator('.lx-date-picker-demo input[type="checkbox"]')
    record.hud.toggleCount = await toggle.count()
    await toggle.check()
    record.hud.toggleChecked = await toggle.evaluate((element) => element.checked)
    await startInput.scrollIntoViewIfNeeded()
    await startInput.click()
    await page.locator('.lx-date-picker__popper:visible').first().waitFor({
      state: 'visible',
      timeout: 10000,
    })
    await page.waitForTimeout(600)
    record.hud.beforeDetector = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, 'hud-floating-popper.png'),
    })

    record.preflight = await page.evaluate(() => {
      document.title = '[Human] ' + document.title.replace(/\s+\[Human\]$/, '')
      const script = document.createElement('script')
      script.textContent = 'window.__impeccableInjectionPreflight = true;'
      document.head.appendChild(script)
      return {
        title: document.title,
        scriptTagAppended: script.isConnected,
        scriptExecuted: window.__impeccableInjectionPreflight === true,
      }
    })
    await page.addScriptTag({ url: detectorUrl })
    await page.waitForTimeout(2600)
    const scriptBodyResponse = await fetch(detectorUrl)
    const scriptBody = await scriptBodyResponse.text()
    record.preflight.detectorLoaded = await page.evaluate(() => ({
      scanAvailable: typeof window.impeccableScan === 'function',
      detectAvailable: typeof window.impeccableDetect === 'function',
    }))
    record.preflight.scriptHttpStatus = scriptBodyResponse.status
    record.preflight.scriptSha256 = crypto
      .createHash('sha256')
      .update(scriptBody)
      .digest('hex')
    record.preflight.scriptBytes = Buffer.byteLength(scriptBody)
    record.hud.detector = await scan(page)
    record.hud.afterDetector = await inspectPopper(page)
    await page.screenshot({
      path: path.join(outputDir, 'hud-floating-popper-overlay.png'),
    })

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    const effectiveInput = page.locator('#demo-date-effective')
    await effectiveInput.waitFor({ state: 'visible', timeout: 30000 })
    record.reducedMotion.noPreference = await transitionState(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    record.reducedMotion.reduce = await transitionState(page)

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
    const popper = page.locator('.lx-date-picker__popper:visible').first()
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
      impeccable: consoleMessages.filter((message) =>
        message.text.toLowerCase().includes('impeccable'),
      ),
      errors: consoleMessages.filter((message) => message.type === 'error'),
      warnings: consoleMessages.filter(
        (message) => message.type === 'warn' || message.type === 'warning',
      ),
    }
    fs.writeFileSync(
      path.join(outputDir, 'browser-retry.json'),
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
          hud: record.hud.afterDetector,
          detectorFindings: record.hud.detector.count,
          keyboard: record.keyboard,
          reducedMotion: record.reducedMotion,
          network: record.network.summary,
          console: record.consoleSummary,
          pageErrors: pageErrors.length,
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
      path.join(outputDir, 'browser-retry.json'),
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
