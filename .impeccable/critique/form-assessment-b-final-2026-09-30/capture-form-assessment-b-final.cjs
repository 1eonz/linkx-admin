const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const outputDir = path.join(__dirname, 'browser')
const overlayUrl = 'http://127.0.0.1:8400/detect.js'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const cases = [
  { key: 'lxform-desktop-light', route: 'lxform', width: 1280, height: 800 },
  { key: 'lxform-375-light', route: 'lxform', width: 375, height: 812 },
  { key: 'lxdynamicform-desktop-light', route: 'lxdynamicform', width: 1280, height: 800 },
  { key: 'lxdynamicform-375-light', route: 'lxdynamicform', width: 375, height: 812 },
  { key: 'lxdynamicform-desktop-hud-reduced', route: 'lxdynamicform', width: 1280, height: 800, hud: true, reducedMotion: true },
  { key: 'lxdynamicform-375-hud-reduced', route: 'lxdynamicform', width: 375, height: 812, hud: true, reducedMotion: true },
]

async function openSettings(page) {
  const details = page.locator('details.dynamic-form-demo__settings').first()
  if (await details.count()) {
    await details.evaluate((element) => { element.open = true })
    await sleep(200)
    return true
  }
  return false
}

async function clickDynamicControl(page, label) {
  const control = page.locator('.dynamic-form-demo__toolbar label').filter({ hasText: label }).first()
  if (!(await control.count())) return { found: false, visible: false }
  await control.scrollIntoViewIfNeeded()
  const visible = await control.isVisible()
  if (visible) await control.click({ timeout: 5000 })
  return { found: true, visible }
}

async function readVisibleState(page) {
  return page.evaluate(() => {
    const text = document.body.innerText
    const uploadNames = ['东门现场.jpg', '西门现场.jpg'].filter((name) => text.includes(name))
    const loading = text.includes('候选人员加载中')
    const empty = text.includes('暂无候选人员')
    const failed = text.includes('候选人员读取失败')
    const formErrors = document.querySelectorAll('.el-form-item.is-error').length
    const nodes = [...document.querySelectorAll('.impeccable-overlay')]
    const visible = nodes.filter((node) => {
      const style = getComputedStyle(node)
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
    })
    const findingTypes = {}
    for (const node of visible) {
      const value = node.textContent || ''
      const match = value.match(/([a-z][a-z-]+)\s*:/i)
      if (match) findingTypes[match[1]] = (findingTypes[match[1]] || 0) + 1
    }
    return {
      uploadNames,
      uploadNameCount: uploadNames.length,
      candidateLoadingVisible: loading,
      candidateEmptyVisible: empty,
      candidateErrorVisible: failed,
      formErrorCount: formErrors,
      overlayNodeCount: nodes.length,
      visibleOverlayNodeCount: visible.length,
      findingTypes,
      reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      hudThemeApplied: document.documentElement.classList.contains('lx-theme-hud') || Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud')),
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }
  })
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const item of cases) {
      const page = await browser.newPage({
        viewport: { width: item.width, height: item.height },
        reducedMotion: item.reducedMotion ? 'reduce' : 'no-preference',
        colorScheme: item.hud ? 'dark' : 'light',
      })
      page.setDefaultTimeout(7000)
      const consoleMessages = []
      const pageErrors = []
      const failedRequests = []
      const requestedOrigins = new Set()
      page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
      page.on('pageerror', (error) => pageErrors.push(String(error)))
      page.on('request', (request) => { try { requestedOrigins.add(new URL(request.url()).origin) } catch {} })
      page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))

      const url = `http://127.0.0.1:4174/components/${item.route}.html`
      let response = null
      let navigationError = null
      try {
        response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 12000 })
        await sleep(500)
      } catch (error) {
        navigationError = String(error)
      }
      if (navigationError) {
        records.push({ case: item.key, url, httpStatus: response?.status() ?? null, navigationError, pageErrors, failedRequests, consoleMessages })
        await page.close()
        continue
      }

      const preflight = await page.evaluate(() => {
        const marker = document.createElement('script')
        marker.id = 'impeccable-b-preflight-marker'
        marker.textContent = 'window.__impeccableBPreflight = true'
        document.head.appendChild(marker)
        return {
          titleBefore: document.title,
          titleMutationSupported: true,
          markerPresent: Boolean(document.getElementById('impeccable-b-preflight-marker')),
          markerExecuted: window.__impeccableBPreflight === true,
        }
      })
      await page.evaluate(() => { document.title = `[Human] ${document.title}`; window.scrollTo(0, 0) })

      let settingsOpened = false
      let hudControl = null
      if (item.route === 'lxdynamicform') {
        settingsOpened = await openSettings(page)
        if (item.hud) {
          hudControl = await clickDynamicControl(page, 'HUD 深色主题')
          await sleep(500)
        }
      }

      const baseState = await readVisibleState(page)
      const baseScreenshot = `${item.key}.png`
      await page.screenshot({ path: path.join(outputDir, baseScreenshot), animations: 'disabled' })

      let invalidScreenshot = null
      let invalidState = null
      if (item.route === 'lxform') {
        const submit = page.getByRole('button', { name: '提交校验' }).first()
        if (await submit.count()) {
          await submit.click()
          await sleep(350)
          invalidState = await readVisibleState(page)
          invalidScreenshot = `${item.key}-error.png`
          await page.screenshot({ path: path.join(outputDir, invalidScreenshot), animations: 'disabled' })
        }
      }

      let dynamicStates = {}
      if (item.route === 'lxdynamicform') {
        const modeError = page.getByRole('button', { name: '失败' }).first()
        if (await modeError.count()) {
          await modeError.click()
          await sleep(80)
          dynamicStates.loading = await readVisibleState(page)
          await page.screenshot({ path: path.join(outputDir, `${item.key}-candidate-loading.png`), animations: 'disabled' })
          await sleep(450)
          dynamicStates.error = await readVisibleState(page)
          await page.screenshot({ path: path.join(outputDir, `${item.key}-candidate-error.png`), animations: 'disabled' })
        }
        const retry = page.getByRole('button', { name: '重试' }).first()
        dynamicStates.retryControlPresent = await retry.count() > 0
      }

      // Injection is intentionally performed after state setup, so the overlay cannot block controls.
      let injectionError = null
      try {
        await page.addScriptTag({ url: overlayUrl })
        await sleep(2500)
      } catch (error) {
        injectionError = String(error)
      }
      const demoRoot = item.route === 'lxform' ? page.locator('.demo-box').first() : page.locator('.dynamic-form-demo').first()
      try { await demoRoot.evaluate((element) => element.scrollIntoView({ block: 'start' })) } catch {}
      await sleep(250)
      const overlayState = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('.impeccable-overlay')]
        const visible = nodes.filter((node) => {
          const style = getComputedStyle(node)
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
        })
        const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null
        return {
          detectorFunctionAvailable: typeof window.impeccableDetect === 'function',
          detectorScriptPresent: [...document.scripts].some((script) => script.src.includes('/detect.js')),
          findings,
          overlayNodeCount: nodes.length,
          visibleOverlayNodeCount: visible.length,
          reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          hudThemeApplied: document.documentElement.classList.contains('lx-theme-hud') || Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud')),
        }
      })
      const finalState = await readVisibleState(page)
      const record = {
        case: item.key,
        url,
        httpStatus: response?.status() ?? null,
        title: await page.title(),
        viewport: { width: item.width, height: item.height },
        emulatedReducedMotion: Boolean(item.reducedMotion),
        emulatedColorScheme: item.hud ? 'dark' : 'light',
        preflight,
        settingsOpened,
        hudControl,
        injectionError,
        baseState,
        invalidState,
        dynamicStates,
        overlayState,
        finalState,
        screenshots: {
          base: baseScreenshot,
          error: invalidScreenshot,
          candidateLoading: item.route === 'lxdynamicform' ? `${item.key}-candidate-loading.png` : null,
          candidateError: item.route === 'lxdynamicform' ? `${item.key}-candidate-error.png` : null,
        },
        requestedOrigins: [...requestedOrigins].sort(),
        failedRequests,
        pageErrors,
        consoleMessages,
      }
      records.push(record)
      await fs.writeFile(path.join(outputDir, `${item.key}.json`), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
      await page.close()
    }
  } finally {
    await browser.close()
  }
  await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(records.map((record) => ({
    case: record.case,
    httpStatus: record.httpStatus,
    navigationError: record.navigationError ?? null,
    preflight: record.preflight,
    injectionError: record.injectionError,
    detectorScriptPresent: record.overlayState?.detectorScriptPresent ?? false,
    detectorFunctionAvailable: record.overlayState?.detectorFunctionAvailable ?? false,
    overlayNodeCount: record.overlayState?.overlayNodeCount ?? null,
    visibleOverlayNodeCount: record.overlayState?.visibleOverlayNodeCount ?? null,
    hudThemeApplied: record.overlayState?.hudThemeApplied ?? false,
    reducedMotionMatches: record.overlayState?.reducedMotionMatches ?? false,
    uploadNameCount: record.finalState?.uploadNameCount ?? null,
    formErrorCount: record.invalidState?.formErrorCount ?? null,
    candidateErrorVisible: record.dynamicStates?.error?.candidateErrorVisible ?? false,
  })), null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`)
  process.exitCode = 1
})
