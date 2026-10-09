import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const origin = 'http://127.0.0.1:4174'
const evidence = {
  method: '独立 Assessment A；新建 Playwright browser context 和各文档页',
  origin,
  pages: [],
  screenshots: [],
}

await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  deviceScaleFactor: 1,
})

async function saveDemo(page, selector, name) {
  const locator = page.locator(selector)
  await locator.scrollIntoViewIfNeeded()
  await locator.screenshot({ path: path.join(outputDir, `${name}.png`) })
  evidence.screenshots.push(`${name}.png`)
}

async function metrics(page, selector) {
  return page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector)
    const rect = target?.getBoundingClientRect()
    const visible = (element) => element.getClientRects().length > 0
    const transitionNodes = [...(target?.querySelectorAll('*') ?? [])]
      .map((element) => {
        const style = getComputedStyle(element)
        return {
          className: element.className?.toString?.() ?? element.tagName,
          transitionDuration: style.transitionDuration,
          animationDuration: style.animationDuration,
        }
      })
      .filter(
        (item) => item.transitionDuration !== '0s' || item.animationDuration !== '0s',
      )
      .slice(0, 40)
    return {
      route: location.pathname,
      title: document.title,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        documentOverflow: document.documentElement.scrollWidth > innerWidth,
      },
      target: rect
        ? {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            clientWidth: target.clientWidth,
            scrollWidth: target.scrollWidth,
            overflow: target.scrollWidth > target.clientWidth + 1,
          }
        : null,
      visibleHeadings: [...document.querySelectorAll('h1, h2, h3')]
        .filter(visible)
        .map((element) => ({ level: element.tagName, text: element.innerText })),
      media: {
        darkClass: document.documentElement.classList.contains('dark'),
        hudClass: document.documentElement.classList.contains('lx-theme-hud'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      nonzeroMotionStyles: transitionNodes,
    }
  }, selector)
}

async function captureVirtualTree() {
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) =>
    pageErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`),
  )
  const pageRecord = {
    route: '/components/lxvirtualtree',
    consoleErrors,
    pageErrors,
    states: {},
    responsive: [],
  }
  try {
    const response = await page.goto(`${origin}${pageRecord.route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    pageRecord.status = response?.status() ?? null
    await page.locator('.virtual-tree-demo').waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(500)
    pageRecord.states.initial = await metrics(page, '.virtual-tree-demo')
    await page.screenshot({ path: path.join(outputDir, 'virtualtree-desktop-page.png') })
    evidence.screenshots.push('virtualtree-desktop-page.png')
    await saveDemo(page, '.virtual-tree-demo', 'virtualtree-desktop-light')

    const details = page.locator('.virtual-tree-demo__controls')
    await details.locator('summary').click()
    const actionGroups = await page.locator('.virtual-tree-demo__action-group').evaluateAll(
      (groups) => groups.map((group) => ({
        legend: group.querySelector('legend')?.innerText,
        visibleOptions: [...group.querySelectorAll('button, input')].filter(
          (element) => element.getClientRects().length > 0,
        ).length,
        controlNames: [...group.querySelectorAll('button, label')].map(
          (element) => element.innerText.trim(),
        ),
      })),
    )
    pageRecord.actionGroups = actionGroups

    const darkTreeInput = page.locator('.virtual-tree-demo__action-group').last().locator('input[type="checkbox"]').nth(1)
    await darkTreeInput.check()
    await page.waitForTimeout(100)
    pageRecord.states.dark = await metrics(page, '.virtual-tree-demo')
    pageRecord.states.dark.colors = await page.locator('.virtual-tree-demo').evaluate((demo) => ({
      text: getComputedStyle(demo).color,
      background: getComputedStyle(demo).backgroundColor,
      treeBackground: getComputedStyle(demo.querySelector('.lx-virtual-tree__viewport')).backgroundColor,
    }))
    await saveDemo(page, '.virtual-tree-demo', 'virtualtree-desktop-hud-dark')
    await darkTreeInput.uncheck()

    const search = page.locator('.lx-virtual-tree__filter input')
    await search.fill('执勤单元 01')
    await page.waitForTimeout(100)
    pageRecord.filterEvidence = await page.evaluate(() => ({
      query: document.querySelector('.lx-virtual-tree__filter input')?.value,
      status: document.querySelector('.lx-virtual-tree__filter-status')?.innerText,
      renderedTreeItems: document.querySelectorAll('.lx-virtual-tree__viewport [role="treeitem"]').length,
      renderedItems: [...document.querySelectorAll('.lx-virtual-tree__viewport [role="treeitem"]')].map(
        (item) => ({ label: item.querySelector('.lx-virtual-tree__label')?.textContent, level: item.getAttribute('aria-level') }),
      ),
    }))
    await saveDemo(page, '.virtual-tree-demo', 'virtualtree-filter-count')
    await page.locator('button[aria-label="清除过滤"]').click()
    await page.waitForTimeout(80)
    pageRecord.filterClearFocus = await page.evaluate(() => ({
      activeTag: document.activeElement?.tagName,
      activeLabel: document.activeElement?.getAttribute('aria-label'),
      focusedClass: document.activeElement?.className?.toString?.(),
    }))

    search.focus()
    await page.keyboard.press('Tab')
    const firstTreeItem = page.locator('.lx-virtual-tree__viewport [role="treeitem"]').first()
    if ((await firstTreeItem.count()) > 0) {
      await firstTreeItem.focus()
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(50)
    }
    pageRecord.keyboard = await page.evaluate(() => {
      const active = document.activeElement
      const style = active ? getComputedStyle(active) : null
      return {
        role: active?.getAttribute('role'),
        label: active?.querySelector('.lx-virtual-tree__label')?.textContent,
        matchesFocusVisible: active?.matches(':focus-visible') ?? false,
        outlineStyle: style?.outlineStyle,
        outlineWidth: style?.outlineWidth,
      }
    })
    await saveDemo(page, '.virtual-tree-demo', 'virtualtree-keyboard-focus')

    for (const [label, name] of [['空结果', 'empty'], ['加载中', 'loading'], ['加载失败', 'error']]) {
      await page.getByRole('button', { name: label }).click()
      await page.waitForTimeout(80)
      pageRecord.states[name] = await page.evaluate(() => ({
        demoText: document.querySelector('.virtual-tree-demo')?.innerText,
        roleStatus: document.querySelector('.virtual-tree-demo [role="status"]')?.innerText,
        roleAlert: document.querySelector('.virtual-tree-demo [role="alert"]')?.innerText,
        treePresent: Boolean(document.querySelector('.virtual-tree-demo [role="tree"]')),
      }))
      await saveDemo(page, '.virtual-tree-demo', `virtualtree-${name}`)
      if (name === 'error') {
        await page.getByRole('button', { name: '重试' }).click()
        await page.waitForTimeout(80)
        pageRecord.states.retry = {
          treePresent: (await page.locator('.virtual-tree-demo [role="tree"]').count()) > 0,
          status: await page.locator('.virtual-tree-demo__status').innerText(),
        }
      }
    }
    await page.getByRole('button', { name: '正常数据' }).click()
    await page.waitForTimeout(80)

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      await page.waitForTimeout(100)
      const layout = await metrics(page, '.virtual-tree-demo')
      pageRecord.responsive.push(layout)
      await saveDemo(page, '.virtual-tree-demo', `virtualtree-${width}-light`)
    }

    await page.emulateMedia({ reducedMotion: 'reduce' })
    pageRecord.reducedMotion = await page.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionStyles: [...document.querySelectorAll('.virtual-tree-demo *')]
        .map((element) => {
          const style = getComputedStyle(element)
          return { className: element.className?.toString?.() ?? element.tagName, transitionDuration: style.transitionDuration, animationDuration: style.animationDuration }
        })
        .filter((style) => style.transitionDuration !== '0s' || style.animationDuration !== '0s')
        .slice(0, 30),
    }))
    evidence.pages.push(pageRecord)
  } catch (error) {
    pageRecord.navigationFailure = error?.stack ?? String(error)
    evidence.pages.push(pageRecord)
  } finally {
    await page.close()
  }
}

async function captureTransferPanel() {
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) =>
    pageErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`),
  )
  const pageRecord = {
    route: '/components/lxtransferpanel',
    consoleErrors,
    pageErrors,
    states: {},
    responsive: [],
  }
  try {
    const response = await page.goto(`${origin}${pageRecord.route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    pageRecord.status = response?.status() ?? null
    await page.locator('.transfer-panel-demo').waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(500)
    pageRecord.states.initial = await metrics(page, '.transfer-panel-demo')
    await page.screenshot({ path: path.join(outputDir, 'transferpanel-desktop-page.png') })
    evidence.screenshots.push('transferpanel-desktop-page.png')
    await saveDemo(page, '.transfer-panel-demo', 'transferpanel-desktop-light')
    await page.locator('.transfer-panel-demo__settings summary').click()

    const descriptionControl = page.locator('.transfer-panel-demo__toolbar-group').nth(1).locator('input[type="checkbox"]').nth(2)
    await descriptionControl.uncheck()
    await page.waitForTimeout(100)
    pageRecord.states.inheritDescriptionMissing = await page.locator('.lx-transfer-panel').evaluate((panel) => {
      const input = panel.querySelector('.lx-transfer-panel__inherit-control input[type="checkbox"]')
      const id = input?.getAttribute('aria-describedby') ?? ''
      const description = id ? document.getElementById(id.split(/\s+/)[0]) : null
      return {
        disabled: input?.disabled ?? null,
        checked: input?.checked ?? null,
        describedBy: id,
        descriptionExists: Boolean(description),
        descriptionText: description?.innerText ?? null,
        footerText: panel.querySelector('.lx-transfer-panel__footer')?.innerText,
      }
    })
    await saveDemo(page, '.transfer-panel-demo', 'transferpanel-inherit-description-missing')
    await descriptionControl.check()

    const darkTransferInput = page.locator('.transfer-panel-demo__toolbar-group').nth(1).locator('input[type="checkbox"]').nth(1)
    await darkTransferInput.check()
    await page.waitForTimeout(120)
    pageRecord.states.dark = await metrics(page, '.transfer-panel-demo')
    pageRecord.states.dark.colors = await page.locator('.transfer-panel-demo').evaluate((demo) => ({
      text: getComputedStyle(demo).color,
      panelBackground: getComputedStyle(demo.querySelector('.lx-transfer-panel__panel')).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }))
    await saveDemo(page, '.transfer-panel-demo', 'transferpanel-desktop-hud-dark')
    await darkTransferInput.uncheck()

    for (const [label, name] of [['空结果', 'empty'], ['加载中', 'loading'], ['加载失败', 'error']]) {
      await page.getByRole('button', { name: label }).click()
      await page.waitForTimeout(100)
      pageRecord.states[name] = await page.evaluate(() => {
        const surface = document.querySelector('.transfer-panel-demo__surface')
        const transfer = document.querySelector('.lx-transfer-panel')
        return {
          statusText: document.querySelector('[data-testid="transfer-status"]')?.innerText,
          hostMessage: document.querySelector('.transfer-panel-demo__message')?.innerText,
          messageRole: document.querySelector('.transfer-panel-demo__message')?.getAttribute('role'),
          surfaceBusy: surface?.getAttribute('aria-busy'),
          surfaceInert: surface?.hasAttribute('inert') ?? false,
          sourceTreeItems: transfer?.querySelectorAll('[role="treeitem"]').length ?? 0,
          selectedItems: transfer?.querySelectorAll('.lx-transfer-panel__selected-item').length ?? 0,
          panelDisabled: transfer?.getAttribute('inert') ?? null,
        }
      })
      await saveDemo(page, '.transfer-panel-demo', `transferpanel-${name}`)
      if (name === 'error') {
        await page.getByRole('button', { name: '重试' }).click()
        await page.waitForTimeout(120)
        pageRecord.states.retry = await page.evaluate(() => ({
          messageVisible: Boolean(document.querySelector('.transfer-panel-demo__message')),
          selectedCount: document.querySelector('[data-testid="selected-count"]')?.innerText,
          panelInert: document.querySelector('.transfer-panel-demo__surface')?.hasAttribute('inert') ?? false,
        }))
      }
    }
    await page.getByRole('button', { name: '正常数据' }).click()
    await page.waitForTimeout(100)

    const clearButton = page.getByRole('button', { name: '全部移除' })
    await clearButton.click()
    await page.waitForTimeout(100)
    pageRecord.clearConfirmation = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .el-message-box')
      return {
        visibleDialogText: dialog?.innerText ?? null,
        dialogs: [...document.querySelectorAll('[role="dialog"]')].map((item) => ({ role: item.getAttribute('role'), text: item.innerText })),
        clearConfirmVisible: Boolean(dialog && dialog.getClientRects().length),
      }
    })
    await page.screenshot({ path: path.join(outputDir, 'transferpanel-clear-confirmation.png') })
    evidence.screenshots.push('transferpanel-clear-confirmation.png')
    const cancel = page.getByRole('button', { name: /取消|Cancel/ })
    if ((await cancel.count()) > 0) {
      await cancel.last().click()
      await page.waitForTimeout(100)
    }

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      await page.waitForTimeout(100)
      pageRecord.responsive.push(await page.evaluate(() => {
        const panel = document.querySelector('.lx-transfer-panel')
        const switchButtons = [...(panel?.querySelectorAll('.lx-transfer-panel__mobile-switch button') ?? [])]
        const source = panel?.querySelectorAll('.lx-transfer-panel__panel')[0]
        const selected = panel?.querySelectorAll('.lx-transfer-panel__panel')[1]
        const row = panel?.querySelector('.lx-transfer-panel__panel:not(.is-mobile-hidden) [role="treeitem"]')
        const rect = (element) => {
          const box = element?.getBoundingClientRect()
          return box ? { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right } : null
        }
        return {
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          documentOverflow: document.documentElement.scrollWidth > innerWidth,
          panel: rect(panel),
          switchButtons: switchButtons.map((button) => ({
            name: button.getAttribute('aria-label'),
            pressed: button.getAttribute('aria-pressed'),
            visible: button.getClientRects().length > 0,
            rect: rect(button),
          })),
          sourceVisible: Boolean(source && source.getClientRects().length),
          selectedVisible: Boolean(selected && selected.getClientRects().length),
          treeRow: rect(row),
          treeRowText: row?.querySelector('.lx-virtual-tree__label')?.textContent,
          selectedNameText: panel?.querySelector('.lx-transfer-panel__selected-name')?.textContent,
        }
      }))
      await saveDemo(page, '.transfer-panel-demo', `transferpanel-${width}-source`)
      await page.getByTestId('mobile-selected-panel').click()
      await page.waitForTimeout(80)
      pageRecord.responsive[pageRecord.responsive.length - 1].selectedView = await page.evaluate(() => ({
        selectedPressed: document.querySelector('[data-testid="mobile-selected-panel"]')?.getAttribute('aria-pressed'),
        sourceHidden: document.querySelectorAll('.lx-transfer-panel__panel')[0]?.classList.contains('is-mobile-hidden'),
        selectedVisible: document.querySelectorAll('.lx-transfer-panel__panel')[1]?.getClientRects().length > 0,
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
      }))
      if (width === 375) {
        await saveDemo(page, '.transfer-panel-demo', 'transferpanel-375-selected')
        const sourceButton = page.getByTestId('mobile-source-panel')
        await sourceButton.focus()
        await page.keyboard.press('Tab')
        pageRecord.keyboard = await page.evaluate(() => {
          const active = document.activeElement
          const style = active ? getComputedStyle(active) : null
          const rect = active?.getBoundingClientRect()
          return {
            label: active?.getAttribute('aria-label'),
            matchesFocusVisible: active?.matches(':focus-visible') ?? false,
            outlineStyle: style?.outlineStyle,
            outlineWidth: style?.outlineWidth,
            outlineColor: style?.outlineColor,
            rect: rect ? { width: rect.width, height: rect.height } : null,
          }
        })
        await page.screenshot({ path: path.join(outputDir, 'transferpanel-375-keyboard-focus.png') })
        evidence.screenshots.push('transferpanel-375-keyboard-focus.png')
      }
      await page.getByTestId('mobile-source-panel').click()
    }

    await page.emulateMedia({ reducedMotion: 'reduce' })
    pageRecord.reducedMotion = await page.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      motionStyles: [...document.querySelectorAll('.transfer-panel-demo *')]
        .map((element) => {
          const style = getComputedStyle(element)
          return { className: element.className?.toString?.() ?? element.tagName, transitionDuration: style.transitionDuration, animationDuration: style.animationDuration }
        })
        .filter((style) => style.transitionDuration !== '0s' || style.animationDuration !== '0s')
        .slice(0, 30),
    }))
    evidence.pages.push(pageRecord)
  } catch (error) {
    pageRecord.navigationFailure = error?.stack ?? String(error)
    evidence.pages.push(pageRecord)
  } finally {
    await page.close()
  }
}

try {
  await captureVirtualTree()
  await captureTransferPanel()
} finally {
  await context.close()
  await browser.close()
}

await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
process.stdout.write(`${JSON.stringify({ pages: evidence.pages.map(({ route, status, navigationFailure }) => ({ route, status, navigationFailure })), screenshots: evidence.screenshots }, null, 2)}\n`)
