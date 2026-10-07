import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const root = path.dirname(fileURLToPath(import.meta.url))
const runName = process.argv[3] || 'final'
const targetFilter = process.argv[4] || ''
const screenshotDir = path.join(root, 'screenshots', runName)
const overlayDir = path.join(root, 'overlay', runName)
const base = 'http://127.0.0.1:4175'
const detectorUrl = process.argv[2]
const targets = [
  { id: 'lxcascader', route: '/components/lxcascader.html', label: 'LxCascader 文档页' },
  { id: 'lxdescriptions', route: '/components/lxdescriptions.html', label: 'LxDescriptions 文档页' },
  { id: 'lxvirtualtree', route: '/components/lxvirtualtree.html', label: 'LxVirtualTree 文档页' },
  { id: 'docs-sidebar', route: '/components/lxsidebar.html', label: '文档侧栏在 LxSidebar 文档路由中的呈现' },
].filter((target) => !targetFilter || target.id === targetFilter)
const utf8 = { encoding: 'utf8' }
const results = []
fs.mkdirSync(screenshotDir, { recursive: true })
fs.mkdirSync(overlayDir, { recursive: true })

function cleanFilePart(value) {
  const ascii = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  if (/^[a-z0-9-]+$/i.test(value) && ascii) return ascii
  return 'state-' + Buffer.from(value, 'utf8').toString('hex')
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      const box = element.getBoundingClientRect()
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
    }
    const sidebar = document.querySelector('.VPSidebar, aside[aria-label*="侧栏"], aside')
    const overlays = Array.from(document.querySelectorAll('[class*="impeccable"], [id*="impeccable"]'))
      .slice(0, 100)
      .map((element) => {
        const target = element._targetEl || null
        return {
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className : '',
          role: element.getAttribute('role') || '',
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          text: (element.innerText || element.textContent || '').trim().slice(0, 280),
          rect: rect(element),
          targetElement: target ? {
            tagName: target.tagName,
            id: target.id || '',
            className: typeof target.className === 'string' ? target.className : '',
            role: target.getAttribute('role') || '',
            ariaLabel: target.getAttribute('aria-label') || '',
            title: target.getAttribute('title') || '',
            text: (target.innerText || target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 300),
            rect: rect(target),
            outerHTML: target.outerHTML.slice(0, 800),
          } : null,
        }
      })
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      documentTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      documentClasses: document.documentElement.className,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 36).map((element) => ({
        level: element.tagName,
        text: (element.innerText || '').trim().slice(0, 150),
      })),
      visibleButtons: Array.from(document.querySelectorAll('button'))
        .filter((element) => {
          const style = getComputedStyle(element)
          const box = element.getBoundingClientRect()
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
        })
        .slice(0, 80)
        .map((element) => ({
          text: (element.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100),
          ariaLabel: element.getAttribute('aria-label') || '',
          title: element.getAttribute('title') || '',
          className: typeof element.className === 'string' ? element.className : '',
          disabled: element.disabled,
          rect: rect(element),
        })),
      visibleInputs: Array.from(document.querySelectorAll('input, select, textarea'))
        .filter((element) => {
          const style = getComputedStyle(element)
          const box = element.getBoundingClientRect()
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
        })
        .slice(0, 80)
        .map((element) => ({
          tagName: element.tagName,
          type: element.type || '',
          value: element.value || '',
          checked: Boolean(element.checked),
          disabled: Boolean(element.disabled),
          ariaLabel: element.getAttribute('aria-label') || '',
          label: element.labels ? Array.from(element.labels).map((label) => (label.innerText || '').trim()).join(' ') : '',
          className: typeof element.className === 'string' ? element.className : '',
          rect: rect(element),
        })),
      sidebar: sidebar ? {
        className: typeof sidebar.className === 'string' ? sidebar.className : '',
        text: (sidebar.innerText || '').trim().slice(0, 2000),
        activeLinks: Array.from(sidebar.querySelectorAll('[aria-current="page"], .is-active, .active'))
          .slice(0, 30)
          .map((element) => ({ text: (element.innerText || '').trim(), href: element.getAttribute('href') || '' })),
      } : null,
      bodyTextStart: (document.body.innerText || '').trim().slice(0, 2200),
      impeccableNodes: overlays,
      hudNodes: document.querySelectorAll('.lx-theme-hud, [data-theme="hud"], [data-lx-theme="hud"]').length,
      activeElement: document.activeElement ? {
        tagName: document.activeElement.tagName,
        role: document.activeElement.getAttribute('role') || '',
        ariaLabel: document.activeElement.getAttribute('aria-label') || '',
        className: typeof document.activeElement.className === 'string' ? document.activeElement.className : '',
        text: (document.activeElement.innerText || document.activeElement.textContent || '').trim().slice(0, 180),
      } : null,
    }
  })
}

async function clickButtonText(page, scopeSelector, text) {
  return page.evaluate(({ scopeSelector, text }) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim()
    const root = document.querySelector(scopeSelector) || document
    const button = Array.from(root.querySelectorAll('button')).find((element) => normalize(element.innerText || element.textContent) === text)
    if (!button) return { found: false, scopeSelector, text }
    button.click()
    return { found: true, text: normalize(button.innerText || button.textContent), pressed: button.getAttribute('aria-pressed') }
  }, { scopeSelector, text })
}

async function enableCheckboxByLabel(page, scopeSelector, text) {
  return page.evaluate(({ scopeSelector, text }) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim()
    const root = document.querySelector(scopeSelector) || document
    const label = Array.from(root.querySelectorAll('label')).find((element) => normalize(element.innerText || element.textContent).includes(text))
    const input = label?.querySelector('input[type="checkbox"]')
    if (!input) return { found: false, scopeSelector, text }
    const before = input.checked
    if (!before) input.click()
    return { found: true, before, checked: input.checked, label: normalize(label.innerText || label.textContent) }
  }, { scopeSelector, text })
}

async function openDemoDetails(page, selector) {
  return page.evaluate((selector) => {
    const details = document.querySelector(selector)
    if (!details) return false
    details.open = true
    return details.open
  }, selector)
}

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})

try {
  for (const target of targets) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    const consoleMessages = []
    const pageErrors = []
    page.on('console', (message) => consoleMessages.push({
      type: message.type(),
      text: message.text().slice(0, 1200),
      location: message.location(),
    }))
    page.on('pageerror', (error) => pageErrors.push(error.message))

    const record = {
      id: target.id,
      label: target.label,
      url: base + target.route,
      navigation: null,
      preflight: null,
      injection: null,
      errors: pageErrors,
      consoleMessages,
      states: [],
    }

    try {
      const response = await page.goto(base + target.route, { waitUntil: 'domcontentloaded', timeout: 20000 })
      record.navigation = { status: response?.status() ?? null, finalUrl: page.url() }
      await page.waitForTimeout(1200)
      try {
        await page.waitForFunction(() => document.querySelector('.VPDoc h1, main h1, h1'), { timeout: 6000 })
      } catch {
        record.navigation.headingWait = 'timeout'
      }
      record.preflight = await page.evaluate((label) => {
        document.title = '[Human] Assessment B - ' + label
        const script = document.createElement('script')
        script.dataset.assessmentBPreflight = 'true'
        script.textContent = 'window.__assessmentBMutablePreflight = true'
        document.head.appendChild(script)
        return {
          title: document.title,
          scriptConnected: script.isConnected,
          scriptRan: window.__assessmentBMutablePreflight === true,
        }
      }, target.label)

      try {
        await page.addScriptTag({ url: detectorUrl })
        await page.waitForTimeout(2600)
        record.injection = {
          success: true,
          detectorUrl,
          impeccableConsoleMessages: consoleMessages.filter((message) => /impeccable/i.test(message.text)),
        }
      } catch (error) {
        record.injection = { success: false, detectorUrl, error: error.message }
      }

      const capture = async (state) => {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(350)
        const view = await inspectPage(page)
        const screenshot = path.join(screenshotDir, target.id + '-' + cleanFilePart(state) + '-overlay.png')
        await page.screenshot({ path: screenshot, animations: 'disabled' })
        const overlayPath = path.join(overlayDir, target.id + '-' + cleanFilePart(state) + '.json')
        fs.writeFileSync(overlayPath, JSON.stringify({
          target: target.id,
          state,
          screenshot: path.relative(root, screenshot).replaceAll(path.sep, '/'),
          injection: record.injection,
          view,
          consoleMessages: [...consoleMessages],
          pageErrors: [...pageErrors],
        }, null, 2) + '\n', utf8)
        record.states.push({
          state,
          screenshot: path.relative(root, screenshot).replaceAll(path.sep, '/'),
          overlayRecord: path.relative(root, overlayPath).replaceAll(path.sep, '/'),
          theme: view.documentTheme,
          viewport: view.viewport,
          hudNodes: view.hudNodes,
          impeccableNodeCount: view.impeccableNodes.length,
        })
      }

      await capture('desktop-light')

      const appearance = page.locator('button.VPSwitchAppearance').first()
      if (await appearance.count()) {
        await appearance.evaluate((element) => element.click())
        await page.waitForTimeout(500)
        const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
        record.darkToggle = { found: true, resultedInDark: isDark, method: 'DOM click: Impeccable banner intercepted physical pointer input' }
        if (isDark) await capture('desktop-dark')
        if (isDark) {
          await appearance.evaluate((element) => element.click())
          await page.waitForTimeout(400)
        }
      } else {
        record.darkToggle = { found: false }
      }

      const hudScope = target.id === 'lxcascader'
        ? '.cascader-demo'
        : target.id === 'lxdescriptions'
          ? '.lx-descriptions-demo'
          : target.id === 'lxvirtualtree'
            ? '.virtual-tree-demo'
            : '.lx-sidebar-demo'
      const hudToggle = await enableCheckboxByLabel(page, hudScope, 'HUD 深色主题')
      if (hudToggle.found) {
        record.hudToggle = { ...hudToggle, method: 'DOM input click: Impeccable banner intercepted physical pointer input' }
        await page.waitForTimeout(500)
        await capture('desktop-hud')
      } else {
        record.hudToggle = { ...hudToggle, embeddedHudView: target.id === 'docs-sidebar', reason: target.id === 'docs-sidebar' ? '该 Demo 无单独 HUD 开关；当前 LxSidebar 示例自身使用 HUD 深色外观' : '当前 Demo 未找到 HUD 复选框' }
        if (target.id === 'docs-sidebar') await capture('desktop-hud')
      }

      const stateButtons = {
        lxcascader: {
          scope: '.cascader-demo',
          details: '.cascader-demo__settings',
          states: ['加载中', '失败', '加载中且失败', '禁用'],
        },
        lxdescriptions: {
          scope: '.lx-descriptions-demo',
          details: null,
          states: ['读取中', '空结果', '错误'],
        },
        lxvirtualtree: {
          scope: '.virtual-tree-demo',
          details: '.virtual-tree-demo__controls',
          states: ['空结果', '加载中', '加载失败'],
        },
      }[target.id]
      if (stateButtons) {
        if (stateButtons.details) await openDemoDetails(page, stateButtons.details)
        record.componentStates = []
        for (const state of stateButtons.states) {
          const clicked = await clickButtonText(page, stateButtons.scope, state)
          record.componentStates.push({ label: state, clicked: clicked.found })
          if (clicked.found) {
            await page.waitForTimeout(250)
            await capture('state-' + state)
          }
        }
      }

      if (target.id === 'lxvirtualtree') {
        await clickButtonText(page, '.virtual-tree-demo', '正常数据')
        await page.waitForTimeout(300)
        const tree = page.locator('[role="tree"]').first()
        if (await tree.count()) {
          await tree.focus()
          await page.keyboard.press('ArrowDown')
          await page.keyboard.press('ArrowRight')
          await page.keyboard.press(' ')
          await page.waitForTimeout(250)
          await capture('keyboard-tree')
        }
      }

      if (target.id === 'lxdescriptions') {
        const errorButton = page.locator('.lx-descriptions-demo button').filter({ hasText: '错误' }).first()
        if (await errorButton.count()) {
          await errorButton.evaluate((element) => element.click())
          await page.waitForTimeout(250)
          await capture('state-error-keyboard-ready')
          const retry = page.locator('.lx-descriptions-demo__state button').filter({ hasText: '重试' }).first()
          if (await retry.count()) {
            await retry.focus()
            await page.keyboard.press('Enter')
            await page.waitForTimeout(250)
            await capture('state-error-retry-recovered')
          }
        }
      }

      await page.setViewportSize({ width: 375, height: 844 })
      await page.waitForTimeout(400)
      if (target.id === 'docs-sidebar') {
        const menuButton = page.locator('button.VPNavBarHamburger, button[aria-label*="菜单"], button[aria-label*="menu" i]').first()
        if (await menuButton.count()) {
          await menuButton.evaluate((element) => element.click())
          await page.waitForTimeout(350)
          record.mobileSidebarMenu = { found: true, expanded: await menuButton.getAttribute('aria-expanded'), method: 'DOM click: Impeccable banner intercepted physical pointer input' }
        } else {
          record.mobileSidebarMenu = { found: false }
        }
      }
      await capture(target.id === 'docs-sidebar' ? 'mobile-375-sidebar' : 'mobile-375')
    } catch (error) {
      record.captureError = error.stack || error.message
    }

    results.push(record)
    await page.close()
  }
} finally {
  await browser.close()
}

const output = { browser: 'Google Chrome via Playwright', baseUrl: base, detectorUrl, results }
process.stdout.write(JSON.stringify(output, null, 2) + '\n')
