import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/Administrator/AppData/Local/Temp/linkx-wave7-puppeteer-20261008/node_modules/puppeteer')
const outputDirectory = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-current-final-2026-10-08',
)
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const detectorUrl = 'http://localhost:8400/detect.js'
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function applyView(page, view) {
  await page.evaluate(({ state, theme }) => {
    const settings = document.querySelector('.transfer-panel-demo__settings')
    const summary = settings?.querySelector('summary')
    const wasOpen = Boolean(settings?.open)
    if (settings && !wasOpen) summary?.click()

    const stateButton = [...document.querySelectorAll(
      '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button',
    )].find((button) => button.textContent.trim() === state)
    stateButton?.click()

    const hudInput = [...document.querySelectorAll(
      '.transfer-panel-demo__toolbar-group[aria-label="示例参数"] input[type="checkbox"]',
    )].find((input) => input.parentElement?.textContent.includes('HUD 深色主题'))
    if (hudInput && hudInput.checked !== (theme === 'HUD')) hudInput.click()
    if (settings && !wasOpen) summary?.click()
  }, view)
  await wait(120)
  await page.evaluate(() => document.querySelector('.transfer-panel-demo')?.scrollIntoView({ block: 'center' }))
}

async function collectView(browser, record) {
  const view = record.requested
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const consoleMessages = []
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
  await page.setViewport({ width: view.width, height: view.height })
  if (view.reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  }
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.transfer-panel-demo', { timeout: 15000 })
  await wait(500)
  await applyView(page, view)
  const injection = await page.evaluate((url) => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = url
    const timeout = setTimeout(() => resolve({ result: 'timeout' }), 10000)
    script.onload = () => {
      clearTimeout(timeout)
      resolve({ result: 'loaded' })
    }
    script.onerror = () => {
      clearTimeout(timeout)
      resolve({ result: 'error' })
    }
    document.head.appendChild(script)
  }), `${detectorUrl}?assessment=b-current-details&view=${encodeURIComponent(view.id)}`)
  await wait(2500)

  const dom = await page.evaluate(() => {
    const selectorFor = (element) => {
      const parts = []
      let current = element
      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
        if (current.id) {
          parts.unshift(`#${CSS.escape(current.id)}`)
          break
        }
        const classes = [...current.classList].filter((value) => !value.startsWith('impeccable'))
        const classPart = classes.length ? `.${classes.slice(0, 3).map(CSS.escape).join('.')}` : ''
        let nth = ''
        if (current.parentElement) {
          const peers = [...current.parentElement.children].filter((peer) => peer.tagName === current.tagName)
          if (peers.length > 1) nth = `:nth-of-type(${peers.indexOf(current) + 1})`
        }
        parts.unshift(`${current.tagName.toLowerCase()}${classPart}${nth}`)
        current = current.parentElement
      }
      return parts.join(' > ')
    }
    const underlying = (x, y) => document.elementsFromPoint(x, y)
      .filter((element) => !element.closest('.impeccable-overlay, .impeccable-label'))
      .slice(0, 4)
      .map((element) => ({
        selector: selectorFor(element),
        tag: element.tagName,
        className: String(element.className ?? '').slice(0, 200),
        text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 140) ?? '',
      }))
    const overlays = [...document.querySelectorAll('.impeccable-overlay')]
      .filter((element) => !element.classList.contains('impeccable-banner'))
    const labels = [...document.querySelectorAll('.impeccable-label')]
    const overlayFindings = overlays.map((element, index) => {
      const rect = element.getBoundingClientRect()
      const label = labels[index]
      const labelRect = label?.getBoundingClientRect()
      const centerX = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2))
      const centerY = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2))
      return {
        index,
        className: element.className,
        visible: element.classList.contains('impeccable-visible'),
        targetRect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        labelText: label?.textContent?.trim().replace(/\s+/g, ' ') ?? '',
        labelTitle: label?.getAttribute('title') ?? '',
        labelParentClass: label?.parentElement?.className ?? '',
        labelRect: labelRect ? { x: Math.round(labelRect.x), y: Math.round(labelRect.y), width: Math.round(labelRect.width), height: Math.round(labelRect.height) } : null,
        underlying: underlying(centerX, centerY),
      }
    })
    const banners = [...document.querySelectorAll('.impeccable-banner')]
      .map((element) => element.textContent.trim().replace(/\s+/g, ' '))
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: { document: document.documentElement.scrollWidth, body: document.body.scrollWidth },
      visibleOverlayCount: overlayFindings.filter((finding) => finding.visible).length,
      overlayCount: overlayFindings.length,
      uniqueLabels: [...new Set(overlayFindings.map((finding) => finding.labelText).filter(Boolean))],
      banners,
      overlayFindings: overlayFindings.slice(0, 300),
    }
  })
  const result = {
    id: view.id,
    viewportRequested: { width: view.width, height: view.height },
    theme: view.theme,
    state: view.state,
    injection,
    impeccableConsoleMessages: consoleMessages.filter((message) => /impeccable/i.test(message.text)),
    dom,
  }
  await context.close()
  return result
}

async function main() {
  const browserEvidence = JSON.parse(fs.readFileSync(path.join(outputDirectory, 'browser-evidence.json'), 'utf8'))
  const representatives = browserEvidence.views.filter((view) => view.injection.result === 'loaded')
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  })
  const results = []
  for (const record of representatives) {
    process.stdout.write(`inspect ${record.id}\n`)
    results.push(await collectView(browser, record))
  }
  await browser.close()
  fs.writeFileSync(path.join(outputDirectory, 'overlay-dom-evidence.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8')
  process.stdout.write(JSON.stringify({ views: results.length, injectionResults: results.map((result) => result.injection.result) }))
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
