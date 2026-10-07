import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const root = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.join(root, 'screenshots')
const overlayDir = path.join(root, 'overlay')
const base = 'http://127.0.0.1:4175'
const detectorUrl = process.argv[2]
const targets = [
  { id: 'lxcascader', route: '/components/lxcascader.html', label: 'LxCascader 文档页' },
  { id: 'lxdescriptions', route: '/components/lxdescriptions.html', label: 'LxDescriptions 文档页' },
  { id: 'lxvirtualtree', route: '/components/lxvirtualtree.html', label: 'LxVirtualTree 文档页' },
  { id: 'docs-sidebar', route: '/components/lxsidebar.html', label: '文档侧栏在 LxSidebar 文档路由中的呈现' },
]
const utf8 = { encoding: 'utf8' }
const results = []

function cleanFilePart(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
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
      .map((element) => ({
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        role: element.getAttribute('role') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        title: element.getAttribute('title') || '',
        text: (element.innerText || element.textContent || '').trim().slice(0, 280),
        rect: rect(element),
      }))
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
    }
  })
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
        await appearance.click({ timeout: 3000 })
        await page.waitForTimeout(500)
        const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
        record.darkToggle = { found: true, resultedInDark: isDark }
        if (isDark) await capture('desktop-dark')
        if (isDark) {
          await appearance.click({ timeout: 3000 })
          await page.waitForTimeout(400)
        }
      } else {
        record.darkToggle = { found: false }
      }

      const hudButton = page.getByRole('button', { name: /HUD/i }).first()
      if (await hudButton.count()) {
        const hudLabel = await hudButton.innerText().catch(() => '')
        await hudButton.click({ timeout: 3000 })
        await page.waitForTimeout(500)
        record.hudToggle = {
          found: true,
          label: hudLabel.trim().slice(0, 100),
          hudNodes: await page.locator('.lx-theme-hud, [data-theme="hud"], [data-lx-theme="hud"]').count(),
        }
        await capture('desktop-hud')
      } else {
        record.hudToggle = { found: false, reason: '当前路由没有可见 HUD 按钮' }
      }

      await page.setViewportSize({ width: 375, height: 844 })
      await page.waitForTimeout(400)
      if (target.id === 'docs-sidebar') {
        const menuButton = page.locator('button.VPNavBarHamburger, button[aria-label*="菜单"], button[aria-label*="menu" i]').first()
        if (await menuButton.count()) {
          await menuButton.click({ timeout: 3000 })
          await page.waitForTimeout(350)
          record.mobileSidebarMenu = { found: true, expanded: await menuButton.getAttribute('aria-expanded') }
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
