import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/Administrator/AppData/Local/OpenAI/Codex/runtimes/cua_node/cfb32733c877621e/bin/node_modules/playwright',
)

const baseUrl = 'http://127.0.0.1:4187'
const overlayUrl = 'http://127.0.0.1:8497/detect.js'
const root = resolve(
  'F:/work/linkx-admin/.impeccable/critique/transferpanel-p2-2026-10-11/assessment-b',
)
const screenshotDir = resolve(root, 'screenshots')
mkdirSync(screenshotDir, { recursive: true })

const views = [
  {
    id: 'transfer-desktop-light',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 1280, height: 900 },
    actions: async (page) => {
      await page.locator('.transfer-panel-demo__settings summary').click()
      await page.waitForTimeout(250)
    },
  },
  {
    id: 'transfer-narrow-light',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 390, height: 844 },
    actions: async (page) => {
      await page.waitForTimeout(400)
      const switcher = page.getByRole('button', { name: /显示已选数据权限清单/ })
      if (await switcher.count()) await switcher.click()
    },
  },
  {
    id: 'transfer-hud-desktop',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 1280, height: 900 },
    actions: async (page) => {
      await page.locator('.transfer-panel-demo__settings summary').click()
      const toggle = page.locator(
        '.transfer-panel-demo__toolbar-group label',
      ).filter({ hasText: 'HUD 深色主题' }).locator('input')
      if (await toggle.count()) await toggle.check()
      await page.waitForTimeout(500)
    },
  },
  {
    id: 'transfer-long-selected',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 420, height: 900 },
    actions: async (page) => {
      const selectedTab = page.getByRole('button', {
        name: /显示已选数据权限清单/,
      })
      if (await selectedTab.count()) await selectedTab.click()
      await page.waitForTimeout(500)
      const disclosure = page.locator(
        '.lx-transfer-panel__selected-name-disclosure summary',
      )
      const count = await disclosure.count()
      if (count) {
        await disclosure.last().focus()
        await page.keyboard.press('Enter')
      }
      await page.waitForTimeout(300)
    },
  },
  {
    id: 'transfer-batch-operations',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 1280, height: 900 },
    actions: async (page) => {
      await page.locator('.transfer-panel-demo__settings summary').click()
      const maxCount = page.locator(
        '.transfer-panel-demo__toolbar-group label',
      ).filter({ hasText: '最多 5 项' }).locator('input')
      if (await maxCount.isChecked()) await maxCount.uncheck()
      const sourceFilter = page.getByRole('textbox', {
        name: '按机构名称或部门编码筛选待选节点',
      })
      await sourceFilter.fill('待授权')
      const batch = page.getByRole('button', { name: '全选筛选结果' })
      if (await batch.count()) await batch.click()
      await page.waitForTimeout(500)
    },
  },
  {
    id: 'transfer-demo-controls',
    page: '/components/lxtransferpanel.html',
    viewport: { width: 1024, height: 768 },
    actions: async (page) => {
      await page.locator('.transfer-panel-demo__settings summary').click()
      await page.getByRole('button', { name: '加载失败' }).click()
      await page.waitForTimeout(250)
      const retry = page.getByRole('button', { name: '重试' })
      if (await retry.count()) await retry.click()
      await page.getByLabel('面板高度').selectOption('380')
      await page.waitForTimeout(400)
    },
  },
  {
    id: 'virtual-desktop-light',
    page: '/components/lxvirtualtree.html',
    viewport: { width: 1280, height: 900 },
    actions: async (page) => {
      await page.locator('.virtual-tree-demo__controls summary').first().click()
      await page.waitForTimeout(250)
    },
  },
  {
    id: 'virtual-narrow-hud',
    page: '/components/lxvirtualtree.html',
    viewport: { width: 390, height: 844 },
    actions: async (page) => {
      await page.locator('.virtual-tree-demo__controls summary').first().click()
      await page.locator('.virtual-tree-demo__advanced summary').last().click()
      const hud = page.locator('label').filter({ hasText: 'HUD 深色主题' }).locator('input')
      const stress = page.locator('label').filter({ hasText: '多行插槽压力测试' }).locator('input')
      if (await hud.count()) await hud.check()
      if (await stress.count()) await stress.check()
      await page.waitForTimeout(500)
    },
  },
  {
    id: 'virtual-demo-controls',
    page: '/components/lxvirtualtree.html',
    viewport: { width: 1024, height: 768 },
    actions: async (page) => {
      await page.locator('.virtual-tree-demo__controls summary').first().click()
      const advanced = page.locator('.virtual-tree-demo__advanced').first()
      await advanced.locator('summary').click()
      await advanced.getByRole('button', { name: '筛选第二个辖区', exact: true }).click()
      await page.waitForTimeout(250)
      await advanced.getByRole('button', { name: '清除筛选' }).click()
      await advanced.getByRole('button', { name: '设置示例选择' }).click()
      await advanced.getByRole('button', { name: '展开全部' }).click()
      await page.waitForTimeout(500)
    },
  },
]

function simplifyConsoleMessage(message) {
  return {
    type: message.type(),
    text: message.text(),
  }
}

async function collectDom(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      )
    }
    const active = document.activeElement
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const tree = document.querySelector('[role="tree"]')
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      bodyScroll: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      visibleTextLength: document.body.innerText.length,
      buttonCount: [...document.querySelectorAll('button')].filter(visible).length,
      inputCount: [...document.querySelectorAll('input')].filter(visible).length,
      tabCount: document.querySelectorAll('[role="tab"]').length,
      tree: tree
        ? {
            role: tree.getAttribute('role'),
            ariaLabel: tree.getAttribute('aria-label'),
            itemCount: tree.querySelectorAll('[role="treeitem"]').length,
          }
        : null,
      selectedList: selectedList
        ? {
            visible: visible(selectedList),
            itemCount: selectedList.querySelectorAll(
              '.lx-transfer-panel__selected-item',
            ).length,
            overflow: selectedList.scrollHeight > selectedList.clientHeight + 1,
            longNameCount: [...selectedList.querySelectorAll('.lx-transfer-panel__selected-name')].filter(
              (name) => name.scrollWidth > name.clientWidth + 1 || name.scrollHeight > name.clientHeight + 1,
            ).length,
            openDisclosureCount: selectedList.querySelectorAll('details[open]').length,
          }
        : null,
      hudPreviewCount: document.querySelectorAll('.lx-theme-hud').length,
      overlayCount: document.querySelectorAll('.impeccable-overlay').length,
      overlayBannerCount: document.querySelectorAll('.impeccable-banner').length,
      activeElement: active
        ? {
            tag: active.tagName,
            role: active.getAttribute('role'),
            ariaLabel: active.getAttribute('aria-label'),
            className: active.className,
          }
        : null,
      focusableCount: [...document.querySelectorAll('button,input,select,[tabindex]')].filter(
        (element) => element.getAttribute('tabindex') !== '-1' && visible(element),
      ).length,
      liveRegions: [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')]
        .filter(visible)
        .map((element) => ({
          role: element.getAttribute('role'),
          ariaLive: element.getAttribute('aria-live'),
          text: element.textContent?.trim().slice(0, 240),
        })),
    }
  })
}

async function runView(browser, view) {
  const context = await browser.newContext({ viewport: view.viewport })
  const page = await context.newPage()
  const consoleMessages = []
  const pageErrors = []
  const requestFailures = []
  const responses = []
  page.on('console', (message) => consoleMessages.push(simplifyConsoleMessage(message)))
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  page.on('requestfailed', (request) => {
    requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? null })
  })
  page.on('response', (response) => {
    if (response.url().startsWith(overlayUrl)) {
      responses.push({ url: response.url(), status: response.status() })
    }
  })

  const result = {
    id: view.id,
    page: view.page,
    viewport: view.viewport,
    navigation: null,
    preflight: null,
    actions: { attempted: true, ok: false, error: null },
    keyboard: { attempted: true, ok: false, error: null, before: null, after: null },
    dom: null,
    console: consoleMessages,
    pageErrors,
    requestFailures,
    overlayResponse: responses,
    screenshot: null,
  }

  try {
    const response = await page.goto(`${baseUrl}${view.page}?assessmentB=${view.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    result.navigation = { ok: true, status: response?.status() ?? null }
    await page.waitForTimeout(1000)
  } catch (error) {
    result.navigation = { ok: false, error: String(error) }
  }

  try {
    result.preflight = await page.evaluate((src) => {
      document.title = `[Human] Assessment B · ${document.title}`
      window.__assessmentBMessages = []
      window.addEventListener('message', (event) => {
        if (event.data?.source?.startsWith?.('impeccable')) {
          window.__assessmentBMessages.push(event.data)
        }
      })
      const script = document.createElement('script')
      script.src = `${src}?view=${encodeURIComponent(document.title)}`
      script.dataset.assessmentB = 'true'
      document.head.appendChild(script)
      return {
        title: document.title,
        scriptAppended: Boolean(document.querySelector('script[data-assessment-b="true"]')),
      }
    }, overlayUrl)
    await page.waitForTimeout(2500)
    result.preflight.overlayMessages = await page.evaluate(() => window.__assessmentBMessages ?? [])
    result.preflight.overlayScriptPresent = await page.evaluate(
      () => Boolean(document.querySelector('script[data-assessment-b="true"]')),
    )
  } catch (error) {
    result.preflight = { ok: false, error: String(error) }
  }

  try {
    await view.actions(page)
    result.actions.ok = true
  } catch (error) {
    result.actions.error = String(error)
  }

  try {
    result.keyboard.before = await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 240) ?? null)
    const focusTarget = page.locator('input,button,select,[role="treeitem"]').filter({ visible: true }).first()
    if (await focusTarget.count()) {
      await focusTarget.focus()
      await page.keyboard.press('Tab')
      result.keyboard.after = await page.evaluate(() => ({
        tag: document.activeElement?.tagName ?? null,
        role: document.activeElement?.getAttribute('role') ?? null,
        ariaLabel: document.activeElement?.getAttribute('aria-label') ?? null,
      }))
      result.keyboard.ok = true
    } else {
      result.keyboard.error = '未找到可聚焦控件'
    }
  } catch (error) {
    result.keyboard.error = String(error)
  }

  await page.waitForTimeout(300)
  result.dom = await collectDom(page)
  const screenshotPath = resolve(screenshotDir, `${view.id}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  result.screenshot = screenshotPath
  await context.close()
  return result
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
})
const results = []
try {
  for (const view of views) {
    results.push(await runView(browser, view))
  }
} finally {
  await browser.close()
}

writeFileSync(resolve(root, 'browser-evidence.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify({ viewCount: results.length, results }, null, 2))
