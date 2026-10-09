'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('C:/Users/Administrator/AppData/Local/OpenAI/Codex/runtimes/cua_node/71e3f41277f96d73/bin/node_modules/playwright')

const [appUrl, detectUrl, evidenceDir] = process.argv.slice(2)

if (!appUrl || !detectUrl || !evidenceDir) {
  throw new Error('Usage: node browser-assessment-b.cjs <app-url> <detect-url> <evidence-dir>')
}

fs.mkdirSync(evidenceDir, { recursive: true })

const scenarios = [
  {
    id: 'desktop-light-filter-keyboard',
    viewport: { width: 1440, height: 1100 },
    colorScheme: 'light',
    isMobile: false,
    hasTouch: false,
    interact: async (page) => {
      await page.getByRole('checkbox', { name: /最多 5 项/ }).uncheck()
      const filter = page.locator('[aria-label="筛选待选节点"]')
      await filter.fill('待授权')
      await page.waitForTimeout(250)
      const candidateVisible = await page.getByText('待授权特勤支队', { exact: true }).isVisible()
      const batchAction = page.getByRole('button', { name: '全选筛选结果' })
      const batchActionCount = await batchAction.count()
      let activeAfterTab = null
      let activated = false
      if (batchActionCount) {
        await filter.press('Tab')
        activeAfterTab = await page.evaluate(() => {
          const element = document.activeElement
          return element
            ? {
                tagName: element.tagName.toLowerCase(),
                ariaLabel: element.getAttribute('aria-label'),
                text: element.textContent?.trim() || '',
              }
            : null
        })
        await batchAction.focus()
        if (await batchAction.isEnabled()) {
          await page.keyboard.press('Enter')
          activated = true
        }
      }
      return {
        candidateVisible,
        batchActionCount,
        activeAfterTab,
        keyboardActivatedBatchAction: activated,
        statusText: await page.locator('[data-testid="transfer-status"]').innerText(),
      }
    },
  },
  {
    id: 'desktop-dark-loading',
    viewport: { width: 1440, height: 1100 },
    colorScheme: 'light',
    isMobile: false,
    hasTouch: false,
    interact: async (page) => {
      const globalDark = await enableGlobalDark(page)
      await page.getByRole('checkbox', { name: /HUD 深色主题/ }).check()
      await page.getByRole('button', { name: '加载中' }).click()
      const status = page.locator('.transfer-panel-demo__message[role="status"]')
      await page.waitForTimeout(350)
      const statusVisible = await status.isVisible().catch(() => false)
      return {
        globalDark,
        hudThemeActive: await page.locator('.transfer-panel-demo.lx-theme-hud').count() === 1,
        ariaBusy: await page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
        statusVisible,
        statusText: statusVisible ? await status.innerText() : await page.locator('[data-testid="transfer-status"]').innerText(),
        loadingButtonPressed: await page.getByRole('button', { name: '加载中' }).getAttribute('aria-pressed'),
      }
    },
  },
  {
    id: 'mobile-light-empty',
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
    hasTouch: true,
    interact: async (page) => {
      await page.getByRole('button', { name: '空结果' }).click()
      await page.waitForTimeout(250)
      return {
        emptyStateSelected: await page.getByRole('button', { name: '空结果' }).getAttribute('aria-pressed'),
        selectedCount: await page.getByTestId('selected-count').innerText(),
        treeNodeCount: await page.getByTestId('tree-node-count').innerText(),
      }
    },
  },
  {
    id: 'mobile-dark-error',
    viewport: { width: 375, height: 812 },
    colorScheme: 'light',
    isMobile: true,
    hasTouch: true,
    interact: async (page) => {
      const globalDark = await enableGlobalDark(page)
      await page.getByRole('checkbox', { name: /HUD 深色主题/ }).check()
      await page.getByRole('button', { name: '加载失败' }).click()
      const alert = page.getByRole('alert')
      await alert.waitFor({ state: 'visible' })
      return {
        globalDark,
        hudThemeActive: await page.locator('.transfer-panel-demo.lx-theme-hud').count() === 1,
        errorText: await alert.innerText(),
        retryVisible: await page.getByRole('button', { name: '重试' }).isVisible(),
      }
    },
  },
  {
    id: 'desktop-light-clear-confirmation',
    viewport: { width: 1440, height: 1100 },
    colorScheme: 'light',
    isMobile: false,
    hasTouch: false,
    interact: async (page) => {
      const clearAll = page.getByRole('button', { name: '全部移除' })
      await clearAll.waitFor({ state: 'visible' })
      await clearAll.click()
      const dialog = page.locator('.el-message-box, [role="alertdialog"], [role="dialog"]')
        .filter({ hasText: '清空已选授权' })
        .last()
      let dialogVisible = false
      let dialogText = ''
      let buttonLabels = []
      try {
        await dialog.waitFor({ state: 'visible', timeout: 5000 })
        dialogVisible = true
        dialogText = await dialog.innerText()
        buttonLabels = await dialog.locator('button').allTextContents()
      } catch (error) {
        dialogText = `确认弹窗未出现：${error.message}`
      }
      return { dialogVisible, dialogText, buttonLabels, cancelled: false }
    },
  },
]

function summarizeFindings(findings) {
  const groups = Array.isArray(findings) ? findings : []
  const rules = groups.flatMap((group) => (group.findings || []).map((finding) => ({
    selector: group.selector,
    tagName: group.tagName,
    type: finding.type,
    severity: finding.severity,
    category: finding.category,
    advisory: finding.advisory,
    detail: finding.detail,
    name: finding.name,
  })))
  return { groupCount: groups.length, ruleCount: rules.length, rules, groups }
}

async function enableGlobalDark(page) {
  let menuOpened = false
  let appearanceSwitch = page.locator('.VPSwitchAppearance[role="switch"]:visible').first()
  if (await appearanceSwitch.count() === 0) {
    const mobileNavigation = page.getByRole('button', { name: 'mobile navigation' })
    if (await mobileNavigation.isVisible()) {
      await mobileNavigation.click()
      menuOpened = true
      await page.locator('#VPNavScreen').waitFor({ state: 'visible' })
    }
    appearanceSwitch = page.locator('#VPNavScreen .VPSwitchAppearance[role="switch"]:visible').first()
  }
  await appearanceSwitch.waitFor({ state: 'visible' })
  const before = await appearanceSwitch.getAttribute('aria-checked')
  if (before !== 'true') {
    await appearanceSwitch.click()
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  }
  const result = {
    before,
    after: await appearanceSwitch.getAttribute('aria-checked'),
    htmlDarkClass: await page.evaluate(() => document.documentElement.classList.contains('dark')),
    mobileMenuOpened: menuOpened,
  }
  if (menuOpened) await page.getByRole('button', { name: 'mobile navigation' }).click()
  return result
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const results = []

  const browserVersion = browser.version()

  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: scenario.viewport,
        colorScheme: scenario.colorScheme,
        isMobile: scenario.isMobile,
        hasTouch: scenario.hasTouch,
        locale: 'zh-CN',
      })
      const page = await context.newPage()
      const consoleMessages = []
      const pageErrors = []
      const requestFailures = []
      page.on('console', (message) => {
        consoleMessages.push({ type: message.type(), text: message.text() })
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('requestfailed', (request) => requestFailures.push({
        url: request.url(),
        error: request.failure()?.errorText || '',
      }))

      const startedAt = new Date().toISOString()
      const record = {
        id: scenario.id,
        viewport: scenario.viewport,
        colorScheme: scenario.colorScheme,
        isMobile: scenario.isMobile,
        hasTouch: scenario.hasTouch,
        startedAt,
        navigation: {},
        mutationPreflight: {},
        interactions: {},
        injection: {},
        scan: {},
        browser: {},
        consoleMessages,
        pageErrors,
        requestFailures,
      }

      try {
        const response = await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.locator('.transfer-panel-demo').waitFor({ state: 'visible', timeout: 20000 })
        await page.waitForTimeout(700)
        record.navigation = {
          httpStatus: response?.status() ?? null,
          finalUrl: page.url(),
          title: await page.title(),
          demoVisible: await page.locator('.transfer-panel-demo').isVisible(),
        }

        record.mutationPreflight = await page.evaluate(() => {
          document.title = '[Human] LxTransferPanel Assessment B'
          const script = document.createElement('script')
          script.textContent = 'window.__impeccableMutationPreflight = true'
          document.head.appendChild(script)
          return {
            titleSet: document.title === '[Human] LxTransferPanel Assessment B',
            scriptAppended: script.isConnected,
            scriptExecuted: window.__impeccableMutationPreflight === true,
          }
        })

        const settings = page.locator('.transfer-panel-demo__settings')
        if (await settings.getAttribute('open') === null) {
          await settings.locator('summary').click()
        }
        record.interactions = await scenario.interact(page)
        record.playwrightViewport = page.viewportSize()
        record.preInjectionBrowser = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          devicePixelRatio: window.devicePixelRatio,
          visualViewportWidth: window.visualViewport?.width ?? null,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
          htmlClasses: document.documentElement.className,
        }))

        const scriptHandle = await page.addScriptTag({ url: `${detectUrl}/detect.js` })
        record.injection = {
          succeeded: true,
          scriptSrc: await scriptHandle.getAttribute('src'),
        }
        await page.waitForTimeout(2500)

        const scan = await page.evaluate(async () => {
          if (typeof window.impeccableDetectAsync !== 'function') {
            return {
              apiAvailable: false,
              overlayCount: document.querySelectorAll('.impeccable-overlay').length,
              bannerCount: document.querySelectorAll('.impeccable-banner').length,
              scriptPresent: Boolean(document.querySelector('script[src*="/detect.js"]')),
            }
          }
          const findings = await window.impeccableDetectAsync()
          return {
            apiAvailable: true,
            findings,
            overlayCount: document.querySelectorAll('.impeccable-overlay').length,
            bannerCount: document.querySelectorAll('.impeccable-banner').length,
            scriptPresent: Boolean(document.querySelector('script[src*="/detect.js"]')),
          }
        })
        record.scan = {
          apiAvailable: scan.apiAvailable,
          scriptPresent: scan.scriptPresent,
          overlayCount: scan.overlayCount,
          bannerCount: scan.bannerCount,
          ...summarizeFindings(scan.findings),
        }
        record.browser = await page.evaluate(() => ({
          title: document.title,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          devicePixelRatio: window.devicePixelRatio,
          visualViewportWidth: window.visualViewport?.width ?? null,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
          htmlClasses: document.documentElement.className,
          documentWidth: document.documentElement.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
          documentHeight: document.documentElement.scrollHeight,
          bodyClasses: document.body.className,
          themeClasses: Array.from(document.querySelectorAll('.transfer-panel-demo'))
            .map((element) => element.className),
          activeElement: document.activeElement
            ? {
                tagName: document.activeElement.tagName.toLowerCase(),
                ariaLabel: document.activeElement.getAttribute('aria-label'),
                text: document.activeElement.textContent?.trim() || '',
              }
            : null,
        }))

        await page.waitForTimeout(250)
        record.screenshot = path.join(evidenceDir, `${scenario.id}.png`)
        await page.screenshot({ path: record.screenshot, fullPage: true })

        if (scenario.id === 'desktop-light-clear-confirmation' && record.interactions.dialogVisible) {
          const dialog = page.locator('.el-message-box, [role="alertdialog"], [role="dialog"]')
            .filter({ hasText: '清空已选授权' })
            .last()
          const cancel = dialog.getByRole('button', { name: /取消|返回/ })
          if (await cancel.count()) {
            await cancel.click()
            record.interactions.cancelled = true
          }
        }
      } catch (error) {
        record.error = error.stack || error.message
      } finally {
        await context.close()
      }

      record.finishedAt = new Date().toISOString()
      results.push(record)
      fs.writeFileSync(
        path.join(evidenceDir, `${scenario.id}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
        'utf8',
      )
    }
  } finally {
    await browser.close()
  }

  const summary = {
    appUrl,
    detectUrl,
    browserVersion,
    scenarioCount: results.length,
    scenarios: results.map((result) => ({
      id: result.id,
      navigationStatus: result.navigation.httpStatus ?? null,
      preflightSucceeded: Boolean(
        result.mutationPreflight.titleSet
        && result.mutationPreflight.scriptAppended
        && result.mutationPreflight.scriptExecuted,
      ),
      injectionSucceeded: Boolean(result.injection.succeeded),
      detectorApiAvailable: Boolean(result.scan.apiAvailable),
      findingCount: result.scan.ruleCount ?? 0,
      overlayCount: result.scan.overlayCount ?? 0,
      consoleFindingLines: (result.consoleMessages || [])
        .filter((message) => message.text.includes('[impeccable]'))
        .map((message) => message.text),
      pageErrors: result.pageErrors || [],
      requestFailures: result.requestFailures || [],
      error: result.error || null,
      screenshot: result.screenshot || null,
    })),
  }

  fs.writeFileSync(path.join(evidenceDir, 'browser-assessment.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'browser-console.json'), `${JSON.stringify(results.map((result) => ({
    id: result.id,
    consoleMessages: result.consoleMessages,
    pageErrors: result.pageErrors,
    requestFailures: result.requestFailures,
  })), null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

  if (results.some((result) => result.error || !result.injection.succeeded || !result.scan.apiAvailable)) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
