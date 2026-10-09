import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = 'F:/work/linkx-admin'
const outputDirectory = path.join(
  projectRoot,
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-a-final-frozen-2026-10-07',
)
const packageRequire = createRequire(
  path.join(projectRoot, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = packageRequire('@playwright/test')
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'

await fs.mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const consoleErrors = []
const failedRequests = []
const httpErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('response', (response) => {
  if (response.status() >= 400) {
    httpErrors.push({ url: response.url(), status: response.status() })
  }
})
page.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), error: request.failure()?.errorText })
})

const evidence = {
  targetUrl,
  browser: 'system Chrome via Playwright',
  context: 'new isolated browser context and page',
  captures: [],
  observations: {},
  consoleErrors,
  failedRequests,
}

async function capture(name, locator = page) {
  await locator.screenshot({
    path: path.join(outputDirectory, `${name}.png`),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push(`${name}.png`)
}

async function openSettings() {
  const settings = page.locator('.transfer-panel-demo__settings')
  if (!(await settings.evaluate((element) => element.open))) {
    await settings.locator('summary').click()
  }
}

async function clickHostState(name) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForTimeout(900)
}

async function takeTreeMetrics() {
  return page.evaluate(() => {
    const tree = document.querySelector('.lx-transfer-panel__tree')
    const viewport = document.querySelector('.lx-virtual-tree__viewport')
    const empty = document.querySelector('.lx-virtual-tree__empty')
    const row = empty ?? document.querySelector('.lx-virtual-tree__row')
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const selectedEmpty = document.querySelector('.lx-transfer-panel__empty')
    const selectedRow = document.querySelector('.lx-transfer-panel__selected-item')
    const rect = (element) => {
      if (!(element instanceof HTMLElement)) return null
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        selector: element.className,
        top: Math.round(box.top * 100) / 100,
        height: Math.round(box.height * 100) / 100,
        minHeight: style.minHeight,
        lineHeight: style.lineHeight,
        flex: style.flex,
      }
    }
    return {
      tree: rect(tree),
      viewport: rect(viewport),
      treeEmptyOrRow: rect(row),
      selectedList: rect(selectedList),
      selectedEmpty: rect(selectedEmpty),
      selectedRow: rect(selectedRow),
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }
  })
}

try {
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle' })
  evidence.httpStatus = response?.status() ?? null
  evidence.documentTitle = await page.title()
  await page.waitForTimeout(900)
  await openSettings()
  await page.locator('.transfer-panel-demo__surface').screenshot({
    path: path.join(outputDirectory, 'desktop-ready-surface.png'),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push('desktop-ready-surface.png')
  await capture('desktop-ready-page')

  await page.getByLabel('HUD 深色主题').check()
  await page.waitForTimeout(200)
  await page.locator('.transfer-panel-demo__surface').screenshot({
    path: path.join(outputDirectory, 'desktop-hud-surface.png'),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push('desktop-hud-surface.png')
  await page.getByLabel('HUD 深色主题').uncheck()

  const sourceFilter = page.getByRole('searchbox', { name: '筛选待选节点' })
  await sourceFilter.fill('交警直属特勤')
  await page.waitForTimeout(250)
  await capture('desktop-source-filter')
  evidence.observations.sourceFilter = {
    matchCount: await page.locator('.lx-transfer-panel__tree [role="treeitem"]').count(),
    selectFilteredEnabled: await page
      .getByRole('button', { name: '全选筛选结果' })
      .isEnabled(),
    invertFilteredEnabled: await page
      .getByRole('button', { name: '反选筛选结果' })
      .isEnabled(),
  }
  await page.getByRole('button', { name: '清除待选节点筛选' }).click()
  evidence.observations.sourceFilterClearReturnsFocus = await sourceFilter.evaluate(
    (element) => element === document.activeElement,
  )

  const selectedFilter = page.getByRole('searchbox', { name: '在已选项中检索' })
  await selectedFilter.fill('DEPT-03')
  await page.waitForTimeout(150)
  await capture('desktop-selected-code-filter')
  evidence.observations.selectedCodeFilterCount = await page
    .locator('.lx-transfer-panel__selected-item')
    .count()
  await page.keyboard.press('Tab')
  evidence.observations.keyboardFocus = await page.evaluate(() => {
    const element = document.activeElement
    return {
      tag: element?.tagName ?? null,
      label: element?.getAttribute('aria-label') ?? null,
      className: typeof element?.className === 'string' ? element.className : '',
      outlineStyle: element ? getComputedStyle(element).outlineStyle : null,
      outlineWidth: element ? getComputedStyle(element).outlineWidth : null,
      boxShadow: element ? getComputedStyle(element).boxShadow : null,
    }
  })
  await capture('desktop-keyboard-tab-selected-clear')
  await page.keyboard.press('Enter')
  evidence.observations.selectedFilterClearReturnsFocus = await selectedFilter.evaluate(
    (element) => element === document.activeElement,
  )
  evidence.observations.selectedFilterClearCount = await page
    .locator('.lx-transfer-panel__selected-item')
    .count()

  await page.locator('.transfer-panel-demo__settings summary').focus()
  evidence.observations.keyboardTabPath = []
  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('Tab')
    const target = await page.evaluate(() => {
      const element = document.activeElement
      return {
        tag: element?.tagName ?? null,
        label: element?.getAttribute('aria-label') ?? '',
        text: element?.textContent?.trim() ?? '',
      }
    })
    evidence.observations.keyboardTabPath.push(target)
    if (target.label === '筛选待选节点') break
  }
  await page.keyboard.type('交警')
  await page.keyboard.press('Tab')
  evidence.observations.sourceClearKeyboardFocus = await page.evaluate(() => {
    const element = document.activeElement
    return {
      label: element?.getAttribute('aria-label') ?? null,
      outlineStyle: element ? getComputedStyle(element).outlineStyle : null,
      outlineWidth: element ? getComputedStyle(element).outlineWidth : null,
      boxShadow: element ? getComputedStyle(element).boxShadow : null,
    }
  })
  await capture('desktop-keyboard-tab-source-clear')
  await page.keyboard.press('Enter')
  evidence.observations.sourceFilterClearByKeyboardReturnsFocus =
    await sourceFilter.evaluate((element) => element === document.activeElement)
  evidence.observations.sourceFilterClearByKeyboardValue = await sourceFilter.inputValue()
  await page.keyboard.press('Tab')

  const treeitem = page.getByRole('treeitem', { name: /市公安局指挥中心/ }).first()
  evidence.observations.treeFocusReachedByTab = await treeitem.evaluate(
    (element) => element === document.activeElement,
  )
  evidence.observations.treeItemTabIndex = await treeitem.getAttribute('tabindex')
  await capture('desktop-keyboard-tree-focus')
  const selectedCountBeforeSpace = await page.getByTestId('selected-count').innerText()
  await page.keyboard.press('Space')
  await page.waitForTimeout(150)
  const selectedCountAfterSpace = await page.getByTestId('selected-count').innerText()
  await page.keyboard.press('Space')
  await page.waitForTimeout(150)
  evidence.observations.treeSpaceOperation = {
    selectedCountBefore: selectedCountBeforeSpace,
    selectedCountAfterOneSpace: selectedCountAfterSpace,
    selectedCountAfterSecondSpace: await page.getByTestId('selected-count').innerText(),
    focusedAfterOperation: await treeitem.evaluate(
      (element) => element === document.activeElement,
    ),
  }

  await clickHostState('加载中')
  await capture('desktop-loading')
  evidence.observations.loading = {
    message: await page.getByRole('status').last().innerText(),
    ariaBusy: await page.locator('.transfer-panel-demo__surface').getAttribute('aria-busy'),
    selectedCount: await page.getByTestId('selected-count').innerText(),
  }

  await clickHostState('加载失败')
  await capture('desktop-error')
  evidence.observations.error = {
    message: await page.getByRole('alert').innerText(),
    retryVisible: await page.getByRole('button', { name: '重试' }).isVisible(),
    selectedCount: await page.getByTestId('selected-count').innerText(),
  }
  await page.getByRole('button', { name: '重试' }).click()
  await page.waitForTimeout(500)
  await capture('desktop-retry-restored')

  await clickHostState('空结果')
  evidence.observations.emptyTreeAfter900ms = await takeTreeMetrics()
  await capture('desktop-empty-tree-900ms')

  await clickHostState('正常数据')
  await page.getByRole('button', { name: '全部移除' }).click()
  await page.waitForTimeout(150)
  evidence.observations.unloadedRemovalConfirmation = {
    visible: await page.getByRole('dialog').isVisible(),
    text: await page.getByRole('dialog').innerText(),
  }
  await capture('desktop-clear-confirmation')
  await page.getByRole('button', { name: '清空全部授权' }).click()
  await page.waitForTimeout(200)
  evidence.observations.emptySelection = await takeTreeMetrics()
  await capture('desktop-empty-selection')
  evidence.observations.undoVisible = await page
    .getByRole('button', { name: '撤销清空' })
    .isVisible()
  await capture('desktop-clear-with-undo')
  await page.getByRole('button', { name: '撤销清空' }).click()
  await page.waitForTimeout(200)
  await capture('desktop-after-undo')

  await page.setViewportSize({ width: 375, height: 1100 })
  await page.waitForTimeout(400)
  await capture('mobile-375-ready-page')
  await page.locator('.transfer-panel-demo__surface').screenshot({
    path: path.join(outputDirectory, 'mobile-375-ready-surface.png'),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push('mobile-375-ready-surface.png')
  evidence.observations.mobileReady = await takeTreeMetrics()

  await page.getByLabel('HUD 深色主题').check()
  await page.waitForTimeout(200)
  await page.locator('.transfer-panel-demo__surface').screenshot({
    path: path.join(outputDirectory, 'mobile-375-hud-surface.png'),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push('mobile-375-hud-surface.png')
  await page.getByLabel('HUD 深色主题').uncheck()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  evidence.observations.reducedMotionPreference = await page.evaluate(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    computedTransitionDurations: [...document.querySelectorAll('.lx-transfer-panel, .lx-transfer-panel__panel, .lx-transfer-panel__selected-item')]
      .slice(0, 20)
      .map((element) => getComputedStyle(element).transitionDuration),
    computedAnimationDurations: [...document.querySelectorAll('.lx-transfer-panel, .lx-transfer-panel__panel, .lx-transfer-panel__selected-item')]
      .slice(0, 20)
      .map((element) => getComputedStyle(element).animationDuration),
  }))
  await capture('mobile-375-reduced-motion')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByLabel('HUD 深色主题').check()
  await page.getByRole('button', { name: '空结果', exact: true }).click()
  await page.waitForTimeout(900)
  await page.locator('.transfer-panel-demo__surface').screenshot({
    path: path.join(outputDirectory, 'mobile-375-empty-tree-hud.png'),
    animations: 'disabled',
    caret: 'hide',
  })
  evidence.captures.push('mobile-375-empty-tree-hud.png')
  evidence.observations.mobileEmptyTree = await takeTreeMetrics()

  evidence.viewport = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  evidence.consoleErrors = consoleErrors
  evidence.failedRequests = failedRequests
  evidence.httpErrors = httpErrors
  await fs.writeFile(
    path.join(outputDirectory, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  )
} finally {
  await context.close()
  await browser.close()
}
