import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const outputDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final-v2/browser/mobile-layout-baseline',
)
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const chromePath = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const packageRequire = createRequire(
  path.join(root, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = packageRequire('@playwright/test')
const consoleMessages = []
const pageErrors = []

fs.mkdirSync(outputDir, { recursive: true })

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--no-first-run'],
})

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  })
  const page = await context.newPage()
  page.on('console', (message) =>
    consoleMessages.push({ type: message.type(), text: message.text() }),
  )
  page.on('pageerror', (error) => pageErrors.push(error.message))

  const response = await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.locator('.transfer-panel-demo').waitFor({
    state: 'attached',
    timeout: 45_000,
  })
  const selectedTab = page.getByTestId('mobile-selected-panel')
  await selectedTab.waitFor({ state: 'visible' })
  await selectedTab.click()
  await page.locator('.transfer-panel-demo').scrollIntoViewIfNeeded()

  const baseline = await page.evaluate(() => {
    const describe = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className:
          typeof element.className === 'string' ? element.className : null,
        text: (element.textContent ?? '').trim().slice(0, 140),
        rect: {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        },
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: style.overflowX,
        position: style.position,
        transform: style.transform,
        visibility: style.visibility,
        display: style.display,
      }
    }
    const pathOf = (element) => {
      const parts = []
      let current = element
      for (let depth = 0; current && depth < 6; depth += 1) {
        const classes =
          typeof current.className === 'string'
            ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 3)
            : []
        parts.push(
          `${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${classes.map((name) => `.${name}`).join('')}`,
        )
        current = current.parentElement
      }
      return parts
    }
    const all = Array.from(document.querySelectorAll('body *'))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          !element.closest('.impeccable-overlay')
        )
      })
      .map((element) => ({ element, metrics: describe(element) }))
      .filter(({ metrics }) =>
        metrics.rect.right > window.innerWidth + 1 ||
        metrics.rect.x < -1 ||
        metrics.scrollWidth > metrics.clientWidth + 1,
      )
      .map(({ element, metrics }) => ({
        ...metrics,
        rightOverflow: Math.max(0, metrics.rect.right - window.innerWidth),
        contentOverflow: Math.max(0, metrics.scrollWidth - metrics.clientWidth),
        ancestorPath: pathOf(element),
      }))
      .sort(
        (a, b) =>
          Math.max(b.rightOverflow, b.contentOverflow) -
          Math.max(a.rightOverflow, a.contentOverflow),
      )

    const selectors = [
      'html',
      'body',
      '.VPContent',
      '.VPDoc',
      '.vp-doc',
      '.VPDocAsideOutline',
      '.VPDocAside',
      '.VPNavBar',
      '.transfer-panel-demo',
      '.lx-transfer-panel',
      '.lx-transfer-panel__selected',
    ]
    const keyElements = Object.fromEntries(
      selectors.map((selector) => {
        const element = document.querySelector(selector)
        return [selector, element ? describe(element) : null]
      }),
    )

    return {
      title: document.title,
      url: location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflowX: getComputedStyle(document.documentElement).overflowX,
      },
      selectedTabPressed:
        document
          .querySelector('[data-testid="mobile-selected-panel"]')
          ?.getAttribute('aria-pressed') ?? null,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      keyElements,
      overflowCandidates: all.slice(0, 50),
      targetDom: document.querySelector('.transfer-panel-demo')?.outerHTML ?? null,
    }
  })

  writeJson(path.join(outputDir, 'layout-baseline.json'), {
    pageWasNew: true,
    pageCountInFreshContext: context.pages().length,
    responseStatus: response?.status() ?? null,
    browserOverlayPresent: baseline.overlayCount > 0,
    ...baseline,
    consoleMessages,
    pageErrors,
  })
  fs.writeFileSync(
    path.join(outputDir, 'transfer-panel.dom.html'),
    baseline.targetDom ?? '<!-- demo DOM unavailable -->',
    'utf8',
  )
  await page.screenshot({
    path: path.join(outputDir, 'mobile-selected-no-overlay.png'),
    fullPage: false,
    animations: 'disabled',
  })
} finally {
  await browser.close().catch(() => {})
}
