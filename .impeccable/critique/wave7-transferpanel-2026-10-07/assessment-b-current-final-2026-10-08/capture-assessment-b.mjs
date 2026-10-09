import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/Administrator/AppData/Local/Temp/linkx-wave7-puppeteer-20261008/node_modules/puppeteer')

const outputDirectory = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-current-final-2026-10-08',
)
const screenshotDirectory = path.join(outputDirectory, 'screenshots')
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const detectorUrl = 'http://localhost:8400/detect.js'

const views = [
  { id: '1440-light-normal', width: 1440, height: 1000, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: false, overlay: true },
  { id: '1440-hud-normal', width: 1440, height: 1000, theme: 'HUD', state: '正常数据', reducedMotion: false, keyboard: false, overlay: true },
  { id: '1440-light-empty', width: 1440, height: 1000, theme: 'light', state: '空结果', reducedMotion: false, keyboard: false, overlay: false },
  { id: '1440-light-error', width: 1440, height: 1000, theme: 'light', state: '加载失败', reducedMotion: false, keyboard: false, overlay: false },
  { id: '1440-light-reduced-motion', width: 1440, height: 1000, theme: 'light', state: '正常数据', reducedMotion: true, keyboard: false, overlay: false },
  { id: '1440-light-keyboard', width: 1440, height: 1000, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: true, overlay: false },
  { id: '375-light-normal', width: 375, height: 844, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: false, overlay: false },
  { id: '375-hud-normal', width: 375, height: 844, theme: 'HUD', state: '正常数据', reducedMotion: false, keyboard: false, overlay: false },
  { id: '375-light-empty', width: 375, height: 844, theme: 'light', state: '空结果', reducedMotion: false, keyboard: false, overlay: true },
  { id: '375-light-error', width: 375, height: 844, theme: 'light', state: '加载失败', reducedMotion: false, keyboard: false, overlay: true },
  { id: '375-light-reduced-motion', width: 375, height: 844, theme: 'light', state: '正常数据', reducedMotion: true, keyboard: false, overlay: false },
  { id: '375-light-keyboard', width: 375, height: 844, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: true, overlay: false },
  { id: '320-light-normal', width: 320, height: 844, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: false, overlay: true },
  { id: '320-hud-normal', width: 320, height: 844, theme: 'HUD', state: '正常数据', reducedMotion: false, keyboard: false, overlay: false },
  { id: '320-hud-reduced-motion', width: 320, height: 844, theme: 'HUD', state: '正常数据', reducedMotion: true, keyboard: false, overlay: true },
  { id: '320-light-empty', width: 320, height: 844, theme: 'light', state: '空结果', reducedMotion: false, keyboard: false, overlay: false },
  { id: '320-light-error', width: 320, height: 844, theme: 'light', state: '加载失败', reducedMotion: false, keyboard: false, overlay: false },
  { id: '320-light-keyboard', width: 320, height: 844, theme: 'light', state: '正常数据', reducedMotion: false, keyboard: true, overlay: false },
]

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function setDemoControls(page, view) {
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
  await delay(120)
}

async function screenshotMetrics(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.transfer-panel-demo')
    const alert = document.querySelector('[role="alert"]')
    const selectedEmpty = [...document.querySelectorAll('.lx-transfer-panel__empty')]
      .map((node) => node.textContent.trim())
    const active = document.activeElement
    const component = document.querySelector('.lx-transfer-panel')
    const style = component ? getComputedStyle(component) : null
    return {
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      scrollWidth: {
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      },
      scrollY,
      theme: panel?.classList.contains('lx-theme-hud') ? 'HUD' : 'light',
      selectedCount: document.querySelector('[data-testid="selected-count"]')?.textContent.trim() ?? null,
      treeCount: document.querySelector('[data-testid="tree-node-count"]')?.textContent.trim() ?? null,
      emptyText: selectedEmpty,
      alertText: alert?.textContent.trim() ?? null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      componentTransitionDuration: style?.transitionDuration ?? null,
      componentAnimationDuration: style?.animationDuration ?? null,
      focusedElement: active
        ? {
            tag: active.tagName,
            role: active.getAttribute('role'),
            ariaLabel: active.getAttribute('aria-label'),
            text: active.textContent?.trim().slice(0, 120) ?? '',
            className: typeof active.className === 'string' ? active.className : '',
            outlineStyle: getComputedStyle(active).outlineStyle,
            outlineWidth: getComputedStyle(active).outlineWidth,
          }
        : null,
    }
  })
}

async function collectOverlayNodes(page) {
  return page.evaluate(() => {
    const matches = []
    const visit = (root) => {
      for (const element of root.querySelectorAll('*')) {
        const attrs = [...element.attributes]
          .filter((attr) => /impeccable|detector|overlay/i.test(`${attr.name} ${attr.value}`))
          .map((attr) => ({ name: attr.name, value: attr.value.slice(0, 240) }))
        if (attrs.length || /impeccable|detector|overlay/i.test(`${element.id} ${element.className}`)) {
          matches.push({ tag: element.tagName, id: element.id, className: String(element.className).slice(0, 240), attrs })
        }
        if (element.shadowRoot) visit(element.shadowRoot)
      }
    }
    visit(document)
    return matches.slice(0, 100)
  })
}

async function injectDetector(page, viewId) {
  return page.evaluate(({ url, viewId }) => new Promise((resolve) => {
    const script = document.createElement('script')
    script.dataset.assessmentBView = viewId
    script.src = `${url}?assessment=b-current&view=${encodeURIComponent(viewId)}`
    const timeout = setTimeout(() => resolve({ result: 'timeout', src: script.src }), 10000)
    script.onload = () => {
      clearTimeout(timeout)
      resolve({ result: 'loaded', src: script.src })
    }
    script.onerror = () => {
      clearTimeout(timeout)
      resolve({ result: 'error', src: script.src })
    }
    document.head.appendChild(script)
  }), { url: detectorUrl, viewId })
}

async function preflight(browser) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.transfer-panel-demo', { timeout: 15000 })
  await delay(500)
  const result = await page.evaluate(() => {
    const originalTitle = document.title
    const script = document.createElement('script')
    script.dataset.assessmentBMutationPreflight = 'true'
    script.textContent = 'window.__assessmentBMutationPreflight = true'
    document.title = `${originalTitle} [Assessment B mutation preflight]`
    document.head.appendChild(script)
    const evidence = {
      titleMutationWorked: document.title.endsWith('[Assessment B mutation preflight]'),
      scriptAppendWorked: script.isConnected,
      scriptExecuted: window.__assessmentBMutationPreflight === true,
      appendedTag: script.tagName,
    }
    script.remove()
    document.title = originalTitle
    delete window.__assessmentBMutationPreflight
    return evidence
  })
  await context.close()
  return result
}

async function captureView(browser, view) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const consoleMessages = []
  const pageErrors = []
  const requestFailures = []
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }))
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? null }))
  await page.setViewport({ width: view.width, height: view.height })
  if (view.reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  }
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.transfer-panel-demo')
  await delay(500)
  await setDemoControls(page, view)
  if (view.keyboard) {
    await page.focus('input[aria-label="筛选待选节点"]')
    await page.keyboard.press('Tab')
    await delay(100)
  }
  await page.evaluate(() => document.querySelector('.transfer-panel-demo')?.scrollIntoView({ block: 'center' }))
  await delay(150)
  await page.evaluate(() => document.fonts.ready)

  const metricsBeforeScreenshot = await screenshotMetrics(page)
  const baselineScreenshot = `screenshots/${view.id}.png`
  await page.screenshot({ path: path.join(outputDirectory, baselineScreenshot) })

  let injection = { result: 'not-requested' }
  let overlayScreenshot = null
  let overlayNodes = []
  let impeccableConsoleMessages = []
  let metricsBeforeOverlayScreenshot = null
  if (view.overlay) {
    injection = await injectDetector(page, view.id)
    await delay(2500)
    impeccableConsoleMessages = consoleMessages.filter((message) => /impeccable/i.test(message.text))
    overlayNodes = await collectOverlayNodes(page)
    metricsBeforeOverlayScreenshot = await screenshotMetrics(page)
    overlayScreenshot = `screenshots/${view.id}-overlay.png`
    await page.screenshot({ path: path.join(outputDirectory, overlayScreenshot) })
  }

  const record = {
    id: view.id,
    requested: view,
    targetUrl,
    metricsBeforeScreenshot,
    baselineScreenshot,
    injection,
    impeccableConsoleMessages,
    overlayNodes,
    metricsBeforeOverlayScreenshot,
    overlayScreenshot,
    pageErrors,
    requestFailures,
  }
  await context.close()
  return record
}

async function main() {
  fs.mkdirSync(screenshotDirectory, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  })
  const evidence = {
    browser: { name: 'Google Chrome', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', automation: 'external Puppeteer', headless: true },
    isolation: '每个截图均创建独立 BrowserContext 和新 Page；新 Page 后显式设置 viewport。',
    mutationPreflight: await preflight(browser),
    views: [],
  }
  for (const view of views) {
    process.stdout.write(`capture ${view.id}\n`)
    evidence.views.push(await captureView(browser, view))
  }
  await browser.close()
  fs.writeFileSync(path.join(outputDirectory, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  process.stdout.write(JSON.stringify({ preflight: evidence.mutationPreflight, views: evidence.views.length, overlays: evidence.views.filter((view) => view.injection.result === 'loaded').length }))
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
})
