const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const base = 'http://127.0.0.1:4191'
const overlay = 'http://127.0.0.1:8411/detect.js?wave6=tree-cascader'
const out = path.resolve('.impeccable/critique/wave6-tree-cascader-2026-09-30/assessment-b')
const shots = path.join(out, 'screenshots')
const results = []
const failures = []

async function runScenario(browser, name, route, viewport, action, state) {
  const page = await browser.newPage({ viewport })
  const logs = []
  const requests = []
  page.on('console', (message) => logs.push({ type: message.type(), text: message.text(), location: message.location() }))
  page.on('request', (request) => requests.push(request.url()))
  page.on('requestfailed', (request) => logs.push({ type: 'requestfailed', text: request.url() + ' :: ' + (request.failure()?.errorText || 'unknown') }))
  try {
    await page.goto(base + '/components/' + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await action(page)
    const injected = await page.evaluate(({ overlay, name }) => {
      document.title = '[Human] Wave 6 B ' + name
      const script = document.createElement('script')
      script.src = overlay + '&name=' + encodeURIComponent(name)
      script.dataset.wave6Overlay = name
      document.head.appendChild(script)
      return { requested: script.src, title: document.title }
    }, { overlay, name })
    await page.waitForTimeout(2200)
    const injectionState = await page.evaluate(() => ({
      scriptTag: Boolean(document.querySelector('script[data-wave6-overlay]')),
      detectorScripts: Array.from(document.scripts).filter((script) => script.src.includes('/detect.js')).map((script) => script.src),
    }))
    const observed = await state(page)
    const png = path.join(shots, name + '.png')
    const consoleFile = path.join(shots, name + '.console.json')
    const requestFile = path.join(shots, name + '.requests.json')
    const metaFile = path.join(shots, name + '.meta.json')
    await page.screenshot({ path: png, fullPage: true })
    await fs.writeFile(consoleFile, JSON.stringify(logs, null, 2))
    await fs.writeFile(requestFile, JSON.stringify(requests, null, 2))
    await fs.writeFile(metaFile, JSON.stringify({ name, route, viewport, observed, injected, injectionState }, null, 2))
    results.push({ name, route, viewport, observed, injected, injectionState, screenshot: png, console: consoleFile, requests: requestFile, meta: metaFile, consoleCount: logs.length, requestCount: requests.length })
  } catch (error) {
    failures.push({ name, route, message: String(error.stack || error) })
    await fs.writeFile(path.join(out, name + '.failure.txt'), String(error.stack || error))
  } finally {
    await page.close().catch(() => undefined)
  }
}

const treeBaseState = async (page) => page.evaluate(() => ({
  viewport: { width: window.innerWidth, height: window.innerHeight },
  documentScrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
  triggerValue: document.querySelector('input[aria-label="选择组织节点"]')?.value || '',
  ariaBusy: document.querySelector('.lx-tree-select-field')?.getAttribute('aria-busy') || null,
  triggerDisabled: document.querySelector('input[aria-label="选择组织节点"]')?.disabled ?? null,
}))

async function main() {
  await fs.mkdir(shots, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    await runScenario(browser, 'tree-desktop-bright-initial', 'lxtreeselect', { width: 1280, height: 900 }, async () => {}, treeBaseState)
    await runScenario(browser, 'tree-single-open', 'lxtreeselect', { width: 1280, height: 900 }, async (page) => {
      await page.locator('.lx-tree-select .el-select__wrapper').click()
      await page.locator('.el-select-dropdown.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => ({
      ...(document.querySelector('.lx-tree-select-field') ? { popperVisible: Boolean(document.querySelector('.el-select-dropdown.lx-tree-select__popper')) } : {}),
      nodeTexts: Array.from(document.querySelectorAll('.el-select-dropdown.lx-tree-select__popper .el-tree-node__content')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      disabledNodeClass: Array.from(document.querySelectorAll('.el-select-dropdown.lx-tree-select__popper .el-tree-node')).find((node) => node.textContent?.includes('离线专网'))?.className || null,
      activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || null,
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'tree-multiple', 'lxtreeselect', { width: 1280, height: 900 }, async (page) => {
      await page.getByRole('button', { name: '多选模式' }).click()
      await page.locator('.lx-tree-select .el-select__wrapper').click()
      await page.locator('.el-select-dropdown.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => ({
      selectedTags: Array.from(document.querySelectorAll('.el-select__selected-item .el-tag')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      checkboxCount: document.querySelectorAll('.el-select-dropdown.lx-tree-select__popper .el-checkbox').length,
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'tree-empty', 'lxtreeselect', { width: 1280, height: 900 }, async (page) => {
      await page.getByRole('button', { name: '查看空目录' }).click()
      await page.locator('.lx-tree-select .el-select__wrapper').click()
      await page.locator('.el-select-dropdown.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => ({
      emptyText: document.querySelector('.el-select-dropdown.lx-tree-select__popper .el-select-dropdown__empty')?.textContent?.trim() || null,
      popperText: document.querySelector('.el-select-dropdown.lx-tree-select__popper')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'tree-loading', 'lxtreeselect', { width: 1280, height: 900 }, async (page) => {
      await page.getByRole('button', { name: '模拟加载' }).click()
    }, async (page) => page.evaluate(() => ({
      ariaBusy: document.querySelector('.lx-tree-select-field')?.getAttribute('aria-busy') || null,
      triggerDisabled: document.querySelector('input[aria-label="选择组织节点"]')?.disabled ?? null,
      loadingSpinner: Boolean(document.querySelector('.lx-tree-select .is-loading')),
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'tree-mobile-hud-keyboard', 'lxtreeselect', { width: 375, height: 812 }, async (page) => {
      await page.getByRole('checkbox', { name: /HUD 深色/ }).check()
      const input = page.locator('input[aria-label="选择组织节点"]')
      await input.focus()
      await input.press('ArrowDown')
      await page.locator('.el-select-dropdown.lx-tree-select__popper').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => {
      const popper = document.querySelector('.el-select-dropdown.lx-tree-select__popper')
      const style = popper ? getComputedStyle(popper) : null
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        rootClasses: document.documentElement.className,
        popperBackground: style?.backgroundColor || null,
        popperRect: popper?.getBoundingClientRect().toJSON() || null,
        triggerRect: document.querySelector('input[aria-label="选择组织节点"]')?.getBoundingClientRect().toJSON() || null,
        documentScrollWidth: document.documentElement.scrollWidth,
        activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || null,
      }
    }))

    await runScenario(browser, 'cascader-desktop-open', 'lxcascader', { width: 1280, height: 900 }, async (page) => {
      await page.locator('.lx-cascader input.el-input__inner').click()
      await page.locator('.el-cascader__dropdown').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => ({
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      menuItems: Array.from(document.querySelectorAll('.el-cascader__dropdown .el-cascader-node')).map((node) => node.textContent?.replace(/\\s+/g, ' ').trim()).filter(Boolean),
      popupRect: document.querySelector('.el-cascader__dropdown')?.getBoundingClientRect().toJSON() || null,
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'cascader-filter', 'lxcascader', { width: 1280, height: 900 }, async (page) => {
      const input = page.locator('.lx-cascader input.el-input__inner')
      await input.click()
      await input.fill('情指')
      await page.waitForTimeout(300)
    }, async (page) => page.evaluate(() => ({
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
      filteredText: document.querySelector('.el-cascader__dropdown')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
      documentScrollWidth: document.documentElement.scrollWidth,
    })))
    await runScenario(browser, 'cascader-clear', 'lxcascader', { width: 1280, height: 900 }, async (page) => {
      await page.locator('.lx-cascader .el-input__wrapper').hover()
      await page.locator('.lx-cascader .el-input__clear').click()
    }, async (page) => ({
      inputValue: await page.locator('.lx-cascader input.el-input__inner').inputValue(),
      statusText: await page.locator('.cascader-demo > p[role="status"]').innerText(),
      documentScrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    }))
    await runScenario(browser, 'cascader-mobile-hud-reduced-motion', 'lxcascader', { width: 375, height: 812 }, async (page) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.evaluate(() => document.documentElement.classList.add('dark', 'lx-theme-hud'))
      const input = page.locator('.lx-cascader input.el-input__inner')
      await input.focus()
      await input.press('ArrowDown')
      await page.locator('.el-cascader__dropdown').waitFor({ state: 'visible', timeout: 5000 })
    }, async (page) => page.evaluate(() => {
      const trigger = document.querySelector('.lx-cascader .el-input__wrapper')
      const popup = document.querySelector('.el-cascader__dropdown')
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        rootClasses: document.documentElement.className,
        triggerRect: trigger?.getBoundingClientRect().toJSON() || null,
        popupRect: popup?.getBoundingClientRect().toJSON() || null,
        transitionDuration: getComputedStyle(document.querySelector('.lx-cascader') || document.body).transitionDuration,
        animationDuration: getComputedStyle(document.querySelector('.lx-cascader') || document.body).animationDuration,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }
    }))
    await runScenario(browser, 'cascader-keyboard', 'lxcascader', { width: 1280, height: 900 }, async (page) => {
      const input = page.locator('.lx-cascader input.el-input__inner')
      await input.focus()
      await input.press('ArrowDown')
      await page.waitForTimeout(200)
      await input.press('Escape')
    }, async (page) => page.evaluate(() => ({
      popupVisibleAfterEscape: Boolean(document.querySelector('.el-cascader__dropdown')),
      activeTag: document.activeElement?.tagName || null,
      inputValue: document.querySelector('.lx-cascader input.el-input__inner')?.value || '',
    })))
  } finally {
    await browser.close()
  }
  const allRequests = []
  for (const file of await fs.readdir(shots)) {
    if (file.endsWith('.requests.json')) allRequests.push(...JSON.parse(await fs.readFile(path.join(shots, file), 'utf8')))
  }
  const origins = {}
  for (const url of allRequests) {
    const origin = new URL(url).origin
    origins[origin] = (origins[origin] || 0) + 1
  }
  const external = Array.from(new Set(allRequests.filter((url) => ![base, 'http://127.0.0.1:8411'].includes(new URL(url).origin))))
  await fs.writeFile(path.join(out, 'browser-result.json'), JSON.stringify({
    status: failures.length ? 'partial' : 'passed',
    fallback: 'Playwright Chromium page; CUA unavailable in subagent thread',
    captures: results,
    failures,
    externalRequests: external,
    totalRequests: allRequests.length,
  }, null, 2))
  await fs.writeFile(path.join(out, 'external-requests-summary.json'), JSON.stringify({
    totalRequests: allRequests.length,
    origins,
    externalRequests: external,
  }, null, 2))
  process.stdout.write('Wave 6 browser evidence finished\\n')
}

main().catch((error) => { process.stderr.write(String(error.stack || error) + '\\n'); process.exitCode = 1 })