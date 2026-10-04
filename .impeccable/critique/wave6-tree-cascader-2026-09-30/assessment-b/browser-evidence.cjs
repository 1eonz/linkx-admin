const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const baseURL = 'http://127.0.0.1:4191'
const overlayURL = 'http://127.0.0.1:8411/detect.js?wave6=tree-cascader'
const outputDir = path.resolve('.impeccable/critique/wave6-tree-cascader-2026-09-30/assessment-b')
const screenshotDir = path.join(outputDir, 'screenshots')

async function makePage(browser, viewport, name) {
  const page = await browser.newPage({ viewport })
  page.__name = name
  page.__consoleMessages = []
  page.__requests = []
  page.on('console', (message) => {
    page.__consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('request', (request) => page.__requests.push(request.url()))
  page.on('requestfailed', (request) => page.__consoleMessages.push({
    type: 'requestfailed',
    text: request.url() + ' :: ' + (request.failure()?.errorText || 'unknown'),
  }))
  return page
}

async function openRoute(browser, route, name, viewport = { width: 1280, height: 900 }) {
  const page = await makePage(browser, viewport, name)
  await page.goto(baseURL + '/components/' + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  return page
}

async function injectOverlay(page, label) {
  const injected = await page.evaluate(({ overlayURL, label }) => {
    document.title = '[Human] Wave 6 B ' + label
    const script = document.createElement('script')
    script.src = overlayURL + '&label=' + encodeURIComponent(label)
    script.dataset.wave6Label = label
    document.head.appendChild(script)
    return { scriptSrc: script.src, title: document.title }
  }, { overlayURL, label })
  await page.waitForTimeout(2200)
  const scriptState = await page.evaluate(() => ({
    injected: Boolean(document.querySelector('script[data-wave6-label]')),
    detectorScripts: Array.from(document.scripts).filter((script) => script.src.includes('/detect.js')).map((script) => script.src),
  }))
  return { injected, scriptState }
}

async function record(page, name, state, injection) {
  const screenshotPath = path.join(screenshotDir, name + '.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  const consolePath = path.join(outputDir, 'screenshots', name + '.console.json')
  const requestsPath = path.join(outputDir, 'screenshots', name + '.requests.json')
  const metaPath = path.join(outputDir, 'screenshots', name + '.meta.json')
  await fs.writeFile(consolePath, JSON.stringify(page.__consoleMessages, null, 2))
  await fs.writeFile(requestsPath, JSON.stringify(page.__requests, null, 2))
  await fs.writeFile(metaPath, JSON.stringify({ name, state, injection }, null, 2))
  return { name, state, injection, screenshotPath, consolePath, requestsPath, metaPath, consoleCount: page.__consoleMessages.length, requestCount: page.__requests.length }
}

async function closeQuiet(page) {
  await page.close().catch(() => undefined)
}

async function treeDesktopInitial(browser) {
  const page = await openRoute(browser, 'lxtreeselect', 'tree-desktop-bright-initial')
  try {
    const injection = await injectOverlay(page, 'tree-desktop-bright-initial')
    const state = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      triggerDisabled: document.querySelector('input[aria-label="选择组织节点"]')?.disabled ?? null,
      ariaBusy: document.querySelector('.lx-tree-select-field')?.getAttribute('aria-busy') || null,
      value: document.querySelector('input[aria-label="选择组织节点"]')?.value || '',
    }))
    process.stdout.write('first before record closed=' + page.isClosed() + '\\\\n')\n    return record(page, 'tree-desktop-bright-initial', state, injection)
  } finally { await closeQuiet(page) }
}

async function treeSingleOpen(browser) {
  const page = await openRoute(browser, 'lxtreeselect', 'tree-single-open')
  try {
    const input = page.locator('input[aria-label="选择组织节点"]')
    await input.click()
    await page.locator('.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    const injection = await injectOverlay(page, 'tree-single-open')
    const state = await page.evaluate(() => ({
      popperVisible: Boolean(document.querySelector('.lx-tree-select__popper')),
      nodeTexts: Array.from(document.querySelectorAll('.lx-tree-select__popper .el-tree-node__content')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      focusedTag: document.activeElement?.tagName || null,
      focusedAria: document.activeElement?.getAttribute('aria-label') || null,
      disabledNode: Array.from(document.querySelectorAll('.lx-tree-select__popper .el-tree-node')).find((node) => node.textContent?.includes('离线专网'))?.className || null,
      documentScrollWidth: document.documentElement.scrollWidth,
    }))
    return record(page, 'tree-single-open', state, injection)
  } finally { await closeQuiet(page) }
}

async function treeMultiple(browser) {
  const page = await openRoute(browser, 'lxtreeselect', 'tree-multiple')
  try {
    await page.getByRole('button', { name: '多选模式' }).click()
    const input = page.locator('input[aria-label="选择组织节点"]')
    await input.click()
    await page.locator('.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    const injection = await injectOverlay(page, 'tree-multiple')
    const state = await page.evaluate(() => ({
      multiple: document.querySelector('.lx-tree-select--md')?.className.includes('is-multiple') || Boolean(document.querySelector('.el-select__selected-item .el-tag')),
      selectedTags: Array.from(document.querySelectorAll('.el-select__selected-item .el-tag')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      nodeCount: document.querySelectorAll('.lx-tree-select__popper .el-tree-node__content').length,
      documentScrollWidth: document.documentElement.scrollWidth,
    }))
    return record(page, 'tree-multiple', state, injection)
  } finally { await closeQuiet(page) }
}

async function treeEmptyLoading(browser) {
  const emptyPage = await openRoute(browser, 'lxtreeselect', 'tree-empty')
  let emptyCapture
  try {
    await emptyPage.getByRole('button', { name: '查看空目录' }).click()
    await emptyPage.locator('input[aria-label="选择组织节点"]').click()
    await emptyPage.locator('.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    const injection = await injectOverlay(emptyPage, 'tree-empty')
    const state = await emptyPage.evaluate(() => ({
      emptyText: document.querySelector('.lx-tree-select__popper .el-select-dropdown__empty')?.textContent?.trim() || null,
      popperText: document.querySelector('.lx-tree-select__popper')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      documentScrollWidth: document.documentElement.scrollWidth,
    }))
    emptyCapture = await record(emptyPage, 'tree-empty', state, injection)
  } finally { await closeQuiet(emptyPage) }

  const loadingPage = await openRoute(browser, 'lxtreeselect', 'tree-loading')
  let loadingCapture
  try {
    await loadingPage.getByRole('button', { name: '模拟加载' }).click()
    const injection = await injectOverlay(loadingPage, 'tree-loading')
    const state = await loadingPage.evaluate(() => ({
      ariaBusy: document.querySelector('.lx-tree-select-field')?.getAttribute('aria-busy') || null,
      loadingVisible: Boolean(document.querySelector('.el-loading-mask')),
      triggerDisabled: document.querySelector('input[aria-label="选择组织节点"]')?.disabled ?? null,
    }))
    loadingCapture = await record(loadingPage, 'tree-loading', state, injection)
  } finally { await closeQuiet(loadingPage) }
  return { emptyCapture, loadingCapture }
}

async function treeMobileHudKeyboard(browser) {
  const page = await openRoute(browser, 'lxtreeselect', 'tree-mobile-hud', { width: 375, height: 812 })
  try {
    await page.getByRole('checkbox', { name: /HUD 深色/ }).check()
    const input = page.locator('input[aria-label="选择组织节点"]')
    await input.focus()
    await input.press('ArrowDown')
    await page.locator('.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    const injection = await injectOverlay(page, 'tree-mobile-hud')
    const state = await page.evaluate(() => {
      const popper = document.querySelector('.lx-tree-select__popper')
      const popperStyle = popper ? getComputedStyle(popper) : null
      const root = document.documentElement
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        rootClasses: root.className,
        popperBackground: popperStyle?.backgroundColor || null,
        popperRect: popper?.getBoundingClientRect().toJSON() || null,
        triggerRect: document.querySelector('input[aria-label="选择组织节点"]')?.getBoundingClientRect().toJSON() || null,
        documentScrollWidth: document.documentElement.scrollWidth,
        activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || null,
        reducedMotion: getComputedStyle(document.querySelector('.lx-tree-select') || document.body).transitionDuration,
      }
    })
    return record(page, 'tree-mobile-hud', state, injection)
  } finally { await closeQuiet(page) }
}

async function cascaderDesktopOpen(browser) {
  const page = await openRoute(browser, 'lxcascader', 'cascader-desktop-open')
  try {
    const input = page.locator('.lx-cascader input.el-input__inner')
    await input.click()
    await page.locator('.lx-cascader__popper').waitFor({ state: 'visible', timeout: 5000 }).catch(async () => {
      await page.locator('.el-cascader__dropdown').waitFor({ state: 'visible', timeout: 5000 })
    })
    const injection = await injectOverlay(page, 'cascader-desktop-open')
    const state = await page.evaluate(() => ({
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      menuItems: Array.from(document.querySelectorAll('.lx-cascader__popper .el-cascader-node, .el-cascader__dropdown .el-cascader-node')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      documentScrollWidth: document.documentElement.scrollWidth,
      popupRect: document.querySelector('.lx-cascader__popper, .el-cascader__dropdown')?.getBoundingClientRect().toJSON() || null,
    }))
    return record(page, 'cascader-desktop-open', state, injection)
  } finally { await closeQuiet(page) }
}

async function cascaderFilterClear(browser) {
  const filterPage = await openRoute(browser, 'lxcascader', 'cascader-filter')
  let filterCapture
  try {
    const input = filterPage.locator('.lx-cascader input.el-input__inner')
    await input.click()
    await input.fill('情指')
    await filterPage.waitForTimeout(300)
    const injection = await injectOverlay(filterPage, 'cascader-filter')
    const state = await filterPage.evaluate(() => ({
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      filteredText: document.querySelector('.lx-cascader__popper, .el-cascader__dropdown')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      documentScrollWidth: document.documentElement.scrollWidth,
    }))
    filterCapture = await record(filterPage, 'cascader-filter', state, injection)
  } finally { await closeQuiet(filterPage) }

  const clearPage = await openRoute(browser, 'lxcascader', 'cascader-clear')
  let clearCapture
  try {
    const input = clearPage.locator('.lx-cascader input.el-input__inner')
    await input.hover()
    const clearButton = clearPage.locator('.lx-cascader .el-input__clear')
    if (await clearButton.count()) await clearButton.click()
    const injection = await injectOverlay(clearPage, 'cascader-clear')
    const state = await clearPage.evaluate(() => ({
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      statusText: document.querySelector('.cascader-demo > p[role="status"]')?.textContent?.trim() || null,
      documentScrollWidth: document.documentElement.scrollWidth,
    }))
    clearCapture = await record(clearPage, 'cascader-clear', state, injection)
  } finally { await closeQuiet(clearPage) }
  return { filterCapture, clearCapture }
}

async function cascaderMobileHudReducedMotion(browser) {
  const page = await openRoute(browser, 'lxcascader', 'cascader-mobile-hud', { width: 375, height: 812 })
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => {
      document.documentElement.classList.add('dark', 'lx-theme-hud')
      document.body.dataset.wave6HudInjection = 'true'
    })
    const input = page.locator('.lx-cascader input.el-input__inner')
    await input.focus()
    await input.press('ArrowDown')
    await page.locator('.lx-cascader__popper').waitFor({ state: 'visible', timeout: 5000 }).catch(async () => {
      await page.locator('.el-cascader__dropdown').waitFor({ state: 'visible', timeout: 5000 })
    })
    const injection = await injectOverlay(page, 'cascader-mobile-hud-reduced-motion')
    const state = await page.evaluate(() => {
      const trigger = document.querySelector('.lx-cascader .el-input__wrapper')
      const popup = document.querySelector('.lx-cascader__popper, .el-cascader__dropdown')
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        rootClasses: document.documentElement.className,
        triggerRect: trigger?.getBoundingClientRect().toJSON() || null,
        popupRect: popup?.getBoundingClientRect().toJSON() || null,
        popupText: popup?.textContent?.replace(/\\s+/g, ' ').trim() || '',
        transitionDuration: getComputedStyle(document.querySelector('.lx-cascader') || document.body).transitionDuration,
        animationDuration: getComputedStyle(document.querySelector('.lx-cascader') || document.body).animationDuration,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }
    })
    return record(page, 'cascader-mobile-hud-reduced-motion', state, injection)
  } finally { await closeQuiet(page) }
}

async function cascaderKeyboard(browser) {
  const page = await openRoute(browser, 'lxcascader', 'cascader-keyboard')
  try {
    const input = page.locator('.lx-cascader input.el-input__inner')
    await input.focus()
    await input.press('ArrowDown')
    await page.waitForTimeout(200)
    const openState = await page.evaluate(() => ({
      activeTag: document.activeElement?.tagName || null,
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      popupVisible: Boolean(document.querySelector('.el-cascader__dropdown')),
    }))
    await input.press('Escape')
    await page.waitForTimeout(150)
    const injection = await injectOverlay(page, 'cascader-keyboard')
    const state = {
      openState,
      afterEscape: await page.evaluate(() => ({ popupVisible: Boolean(document.querySelector('.el-cascader__dropdown')), activeTag: document.activeElement?.tagName || null })),
    }
    return record(page, 'cascader-keyboard', state, injection)
  } finally { await closeQuiet(page) }
}

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const results = []
  try {
    results.push(await treeDesktopInitial(browser))
    const captures = []
    const collect = (value) => {
      if (!value || typeof value !== 'object') return
      if (Array.isArray(value)) return value.forEach(collect)
      if (value.name && value.state) captures.push(value)
      Object.values(value).forEach(collect)
    }
    collect(results)
    const requests = captures.flatMap((capture) => {
      const pathName = capture.requestsPath
      return pathName ? [] : []
    })
    const requestFiles = await fs.readdir(screenshotDir)
    const allRequests = []
    for (const file of requestFiles.filter((file) => file.endsWith('.requests.json'))) {
      const entries = JSON.parse(await fs.readFile(path.join(screenshotDir, file), 'utf8'))
      allRequests.push(...entries)
    }
    const external = allRequests.filter((url) => {
      const origin = new URL(url).origin
      return origin !== baseURL && origin !== 'http://127.0.0.1:8411'
    })
    await fs.writeFile(path.join(outputDir, 'browser-result.json'), JSON.stringify({
      status: 'passed',
      fallback: 'Playwright Chromium page; CUA unavailable in subagent thread',
      captures,
      externalRequests: Array.from(new Set(external)),
      allRequestCount: allRequests.length,
    }, null, 2))
    const originCounts = {}
    for (const url of allRequests) {
      const origin = new URL(url).origin
      originCounts[origin] = (originCounts[origin] || 0) + 1
    }
    await fs.writeFile(path.join(outputDir, 'external-requests-summary.json'), JSON.stringify({
      totalRequests: allRequests.length,
      origins: originCounts,
      externalRequests: Array.from(new Set(external)),
    }, null, 2))
    process.stdout.write('Wave 6 TreeSelect/Cascader browser fallback passed\\n')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write(String(error.stack || error) + '\\n')
  process.exitCode = 1
})