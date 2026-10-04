const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const outputDir = path.join(__dirname, 'browser')
const overlayUrl = 'http://127.0.0.1:8400/detect.js'
const cases = [
  { key: 'lxform-desktop', route: 'lxform', width: 1280, height: 800 },
  { key: 'lxform-375', route: 'lxform', width: 375, height: 812 },
  { key: 'lxdynamicform-desktop', route: 'lxdynamicform', width: 1280, height: 800 },
  { key: 'lxdynamicform-375', route: 'lxdynamicform', width: 375, height: 812 },
  { key: 'lxdynamicform-hud-reduced-desktop', route: 'lxdynamicform', width: 1280, height: 800, hud: true, reducedMotion: true },
  { key: 'lxdynamicform-hud-reduced-375', route: 'lxdynamicform', width: 375, height: 812, hud: true, reducedMotion: true },
]

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
      const consoleMessages = []
      const pageErrors = []
      const failedRequests = []
      const requestedOrigins = new Set()
      page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
      page.on('pageerror', (error) => pageErrors.push(String(error)))
      page.on('request', (request) => {
        try { requestedOrigins.add(new URL(request.url()).origin) } catch {}
      })
      page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))

      const url = `http://127.0.0.1:4174/components/${item.route}.html`
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.locator('.vp-doc').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(500)
      await page.evaluate(() => { document.title = `[Human] ${document.title}`; window.scrollTo(0, 0) })

      let injectionError = null
      try {
        await page.addScriptTag({ url: overlayUrl })
        await page.waitForTimeout(2500)
      } catch (error) {
        injectionError = String(error)
      }

      if (item.hud) {
        await page.locator('.dynamic-form-demo__toolbar label').filter({ hasText: 'HUD 深色主题' }).click()
      }

      const demoRoot = item.route === 'lxform'
        ? page.locator('.demo-box').first()
        : page.locator('.dynamic-form-demo')
      await demoRoot.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await page.waitForTimeout(350)

      const overlayEvidence = await page.evaluate(() => {
        const findings = typeof window.impeccableDetect === 'function' ? window.impeccableDetect() : null
        const nodes = [...document.querySelectorAll('.impeccable-overlay')]
        return {
          detectorFunctionAvailable: typeof window.impeccableDetect === 'function',
          detectorScriptPresent: [...document.scripts].some((script) => script.src.includes('/detect.js')),
          findings,
          overlayNodeCount: nodes.length,
          visibleOverlayNodeCount: nodes.filter((node) => {
            const style = getComputedStyle(node)
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
          }).length,
          reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          hudThemeApplied: Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud')),
        }
      })

      const screenshotPath = path.join(outputDir, `${item.key}-overlay.png`)
      await page.screenshot({ path: screenshotPath, animations: 'disabled' })

      let invalidState = null
      if (item.route === 'lxform' && item.key === 'lxform-desktop') {
        await page.getByRole('button', { name: '提交校验' }).first().click()
        await page.waitForTimeout(350)
        invalidState = await page.locator('.el-form-item.is-error').count()
        await page.screenshot({ path: path.join(outputDir, 'lxform-desktop-invalid-overlay.png'), animations: 'disabled' })
      }

      const result = {
        case: item.key,
        url,
        httpStatus: response?.status() ?? null,
        title: await page.title(),
        viewport: { width: item.width, height: item.height },
        emulatedReducedMotion: item.reducedMotion === true,
        emulatedColorScheme: item.hud ? 'dark' : 'light',
        injectionError,
        overlayEvidence,
        invalidFormItemCountAfterEmptySubmit: invalidState,
        screenshot: path.basename(screenshotPath),
        requestedOrigins: [...requestedOrigins].sort(),
        failedRequests,
        pageErrors,
        consoleMessages,
      }
      records.push(result)
      await fs.writeFile(path.join(outputDir, `${item.key}.overlay.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
      await page.close()
    }
  } finally {
    await browser.close()
  }
  await fs.writeFile(path.join(outputDir, 'browser-overlay-evidence.json'), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(records.map(({ case: name, httpStatus, injectionError, overlayEvidence, screenshot, invalidFormItemCountAfterEmptySubmit }) => ({ name, httpStatus, injectionError, detectorFunctionAvailable: overlayEvidence.detectorFunctionAvailable, overlayNodeCount: overlayEvidence.overlayNodeCount, findingElements: overlayEvidence.findings?.length ?? null, screenshot, invalidFormItemCountAfterEmptySubmit })), null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`)
  process.exitCode = 1
})

