import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFileSync } from 'node:fs'

const outputDir = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const puppeteer = require(
  join(
    tmpdir(),
    'wave7-transferpanel-assessment-a-puppeteer-20261008',
    'node_modules',
    'puppeteer-core',
  ),
)
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const viewportSizes = [
  { name: 'desktop-1440x1000', width: 1440, height: 1000, mobile: false },
  { name: 'mobile-375x844', width: 375, height: 844, mobile: true },
  { name: 'narrow-320x844', width: 320, height: 844, mobile: true },
]

const evidence = {
  target: targetUrl,
  browser: {
    package: 'puppeteer-core',
    creation: 'new browser process; browser.createBrowserContext(); context.newPage(); page.setViewport() immediately after newPage()',
    viewportMatrix: viewportSizes,
  },
  captures: [],
  checks: [],
  browserErrors: [],
  resourceErrors: [],
  pageErrors: [],
}

const pause = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))
const saveJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')

function failCheck(name, actual, expected) {
  evidence.checks.push({ name, actual, expected, passed: false })
}

function passCheck(name, actual, expected) {
  evidence.checks.push({ name, actual, expected, passed: true })
}

async function pageFacts(page, name) {
  return page.evaluate((captureName) => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    const text = (selector) =>
      document.querySelector(selector)?.innerText?.trim() ?? ''
    const buttonInfo = (button) =>
      button
        ? {
            label:
              button.getAttribute('aria-label') ||
              button.title ||
              button.innerText.trim(),
            disabled: button.disabled,
            title: button.getAttribute('title') ?? '',
            describedByText: (button.getAttribute('aria-describedby') ?? '')
              .split(/\s+/)
              .filter(Boolean)
              .map((id) => document.getElementById(id)?.innerText.trim())
              .filter(Boolean)
              .join(' '),
            rect: rect(button),
            outline: getComputedStyle(button).outlineStyle,
            outlineWidth: getComputedStyle(button).outlineWidth,
          }
        : null
    const selectorRect = (selector) =>
      rect(document.querySelector(selector))
    const selectedList = document.querySelector(
      '.lx-transfer-panel__selected',
    )
    const selectedHint = document.querySelector(
      '[data-testid="selected-scroll-hint"]',
    )
    const sourceFilter = document.querySelector(
      'input[aria-label="筛选待选节点"]',
    )
    const selectedFilter = document.querySelector(
      'input[aria-label="在已选项中检索"]',
    )
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const treeToggle = document.querySelector(
      '.lx-virtual-tree__toggle, .lx-virtual-tree__expand-button',
    )
    const relevantOverflow = [
      '.transfer-panel-demo',
      '.transfer-panel-demo__surface',
      '.lx-transfer-panel',
      '.lx-transfer-panel__panel',
      '.lx-transfer-panel__tree',
      '.lx-transfer-panel__selected-wrap',
      '.lx-transfer-panel__selected-item',
    ]
      .map((selector) => {
        const element = document.querySelector(selector)
        return {
          selector,
          rect: rect(element),
          clientWidth: element?.clientWidth ?? null,
          scrollWidth: element?.scrollWidth ?? null,
          overflowX:
            (element?.scrollWidth ?? 0) > (element?.clientWidth ?? 0) + 1,
        }
      })
      .filter((item) => item.rect)
    const selectedItems = [
      ...document.querySelectorAll('.lx-transfer-panel__selected-item'),
    ].map((item) => ({
      text: item.innerText.trim(),
      rect: rect(item),
      removeButton: buttonInfo(item.querySelector('button')),
    }))
    const clearButtons = {
      source: buttonInfo(
        document.querySelector(
          '.lx-transfer-panel__filter--source button',
        ),
      ),
      selected: buttonInfo(
        document.querySelector(
          '.lx-transfer-panel__filter:not(.lx-transfer-panel__filter--source) button',
        ),
      ),
    }
    const keyTargets = [
      ...document.querySelectorAll(
        '.transfer-panel-demo button, .transfer-panel-demo input, .transfer-panel-demo summary, .lx-transfer-panel button, .lx-transfer-panel input, .lx-transfer-panel [tabindex="0"]',
      ),
    ].map((element) => ({
      tag: element.tagName,
      label:
        element.getAttribute('aria-label') ||
        element.innerText?.trim().slice(0, 64) ||
        element.getAttribute('placeholder') ||
        '',
      tabIndex: element.tabIndex,
      disabled: Boolean(element.disabled),
    }))
    const documentWidth = document.documentElement.scrollWidth
    const bodyWidth = document.body.scrollWidth
    const mediaTransition = treeToggle
      ? getComputedStyle(treeToggle).transitionDuration
      : null
    return {
      name: captureName,
      title: document.title,
      url: location.href,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
        mobile: matchMedia('(max-width: 767px)').matches,
      },
      theme: {
        rootClasses: document.documentElement.className,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        darkChecked:
          [...document.querySelectorAll('.transfer-panel-demo__toolbar label')]
            .find((label) => label.innerText.includes('HUD 深色主题'))
            ?.querySelector('input')?.checked ?? false,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: documentWidth,
        bodyScrollWidth: bodyWidth,
        horizontalOverflow:
          documentWidth > document.documentElement.clientWidth + 1 ||
          bodyWidth > document.documentElement.clientWidth + 1,
        scrollHeight: document.documentElement.scrollHeight,
      },
      reducedMotion: {
        matches: media.matches,
        treeToggleTransitionDuration: mediaTransition,
        treeToggleTransitionProperty: treeToggle
          ? getComputedStyle(treeToggle).transitionProperty
          : null,
      },
      demo: {
        rect: rect(document.querySelector('.transfer-panel-demo')),
        controlsOpen:
          document.querySelector('.transfer-panel-demo__settings')?.open ??
          false,
        liveStatus: text('[data-testid="transfer-status"]'),
        selectedSummary: text('[data-testid="selected-count"]'),
        nodeSummary: text('[data-testid="tree-node-count"]'),
        stateMessage: text('.transfer-panel-demo__message'),
        stateMessageRole:
          document
            .querySelector('.transfer-panel-demo__message')
            ?.getAttribute('role') ?? null,
        ariaBusy:
          document
            .querySelector('.transfer-panel-demo__surface')
            ?.getAttribute('aria-busy') ?? null,
        inert:
          document
            .querySelector('.transfer-panel-demo__surface')
            ?.querySelector('.lx-transfer-panel')
            ?.hasAttribute('inert') ?? false,
        hostButtons: [
          ...document.querySelectorAll(
            '.transfer-panel-demo__toolbar-group[aria-label="宿主数据状态"] button',
          ),
        ].map((button) => ({
          text: button.innerText.trim(),
          pressed: button.getAttribute('aria-pressed'),
          disabled: button.disabled,
        })),
      },
      panel: {
        rect: rect(document.querySelector('.lx-transfer-panel')),
        clientWidth:
          document.querySelector('.lx-transfer-panel')?.clientWidth ?? null,
        scrollWidth:
          document.querySelector('.lx-transfer-panel')?.scrollWidth ?? null,
        panels: [
          ...document.querySelectorAll('.lx-transfer-panel__panel'),
        ].map((panel) => rect(panel)),
        controls: selectorRect('.lx-transfer-panel__controls'),
        sourceFilterValue: sourceFilter?.value ?? '',
        selectedFilterValue: selectedFilter?.value ?? '',
        sourceFilterClearVisible: Boolean(
          document.querySelector('.lx-transfer-panel__filter--source button'),
        ),
        selectedFilterClearVisible: Boolean(
          document.querySelector(
            '.lx-transfer-panel__filter:not(.lx-transfer-panel__filter--source) button',
          ),
        ),
        clearButtons,
        selectedCount: text('.lx-transfer-panel__footer > span'),
        selectedList: {
          rect: rect(selectedList),
          clientWidth: selectedList?.clientWidth ?? null,
          scrollWidth: selectedList?.scrollWidth ?? null,
          clientHeight: selectedList?.clientHeight ?? null,
          scrollHeight: selectedList?.scrollHeight ?? null,
          scrollTop: selectedList?.scrollTop ?? null,
          focused: document.activeElement === selectedList,
          ariaLabel: selectedList?.getAttribute('aria-label') ?? '',
        },
        scrollHint: {
          visible: Boolean(selectedHint),
          text: selectedHint?.innerText?.trim() ?? '',
          ariaHidden: selectedHint?.getAttribute('aria-hidden') ?? null,
          rect: rect(selectedHint),
        },
        treeRows: [
          ...document.querySelectorAll('.lx-virtual-tree__row'),
        ].slice(0, 8).map((row) => ({
          text: row.innerText.trim(),
          rect: rect(row),
          scrollWidth: row.scrollWidth,
          clientWidth: row.clientWidth,
          overflowX: row.scrollWidth > row.clientWidth + 1,
        })),
        selectedItems,
        emptyState: text('.lx-transfer-panel__empty'),
        sourceStatus: text('.lx-transfer-panel__header-status'),
        selectAllCompactHint: text('[data-testid="select-all-compact-hint"]'),
        selectAllDisabledReason: text('[data-testid="select-all-disabled-reason"]'),
        batchButton: buttonInfo(
          document.querySelector(
            '.lx-transfer-panel__header-actions button[aria-label="全选筛选结果"]',
          ),
        ),
        addAllButton: buttonInfo(
          document.querySelector('.lx-transfer-panel__controls button'),
        ),
        removableTargets: [
          ...document.querySelectorAll(
            '.lx-transfer-panel__selected-item button',
          ),
        ].map(buttonInfo),
      },
      keyboardTargets: keyTargets,
      focused: {
        tag: document.activeElement?.tagName ?? null,
        label:
          document.activeElement?.getAttribute('aria-label') ||
          document.activeElement?.innerText?.trim().slice(0, 64) ||
          '',
        outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
        outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
      },
      demoDom: document.querySelector('.transfer-panel-demo')?.outerHTML ?? '',
      panelDom: document.querySelector('.lx-transfer-panel')?.outerHTML ?? '',
    }
  }, name)
}

async function capture(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await pause(80)
  const facts = await pageFacts(page, name)
  const pagePath = join(outputDir, `${name}.page.png`)
  const demoPath = join(outputDir, `${name}.demo.png`)
  const domPath = join(outputDir, `${name}.dom.json`)
  await page.screenshot({ path: pagePath, fullPage: true, captureBeyondViewport: true })
  const demo = await page.$('.transfer-panel-demo')
  if (demo) await demo.screenshot({ path: demoPath, captureBeyondViewport: true })
  saveJson(domPath, facts)
  evidence.captures.push({
    name,
    pageScreenshot: pagePath,
    demoScreenshot: demo ? demoPath : null,
    dom: domPath,
    viewport: facts.viewport,
    theme: facts.theme.rootClasses,
    status: facts.demo.liveStatus,
  })
  return facts
}

async function setViewport(page, size) {
  await page.setViewport({
    width: size.width,
    height: size.height,
    deviceScaleFactor: 1,
    isMobile: size.mobile,
    hasTouch: size.mobile,
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await pause(150)
}

async function setTheme(page, enabled) {
  const checkbox = await page.evaluateHandle(() =>
    [...document.querySelectorAll('.transfer-panel-demo__toolbar label')]
      .find((label) => label.innerText.includes('HUD 深色主题'))
      ?.querySelector('input'),
  )
  const checked = await page.evaluate((element) => Boolean(element?.checked), checkbox)
  if (checked !== enabled) await checkbox.asElement()?.click()
  await pause(180)
  await checkbox.dispose()
}

async function clickDemoButton(page, text) {
  const button = await page.$(`.transfer-panel-demo button`)
  const result = await page.evaluate((label) => {
    const target = [...document.querySelectorAll('.transfer-panel-demo button')]
      .find((item) => item.innerText.trim() === label)
    if (!target) return { ok: false, reason: `未找到按钮：${label}` }
    if (target.disabled) return { ok: false, reason: `按钮已禁用：${label}` }
    target.click()
    return { ok: true, text: target.innerText.trim() }
  }, text)
  if (!button) result.buttonScopeFound = false
  evidence.checks.push({ name: `click-demo:${text}`, ...result })
  await pause(180)
  return result
}

async function fillField(page, selector, value) {
  const input = await page.$(selector)
  if (!input) {
    failCheck(`fill-field:${selector}`, '输入框不存在', value)
    return false
  }
  await input.click()
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
  await input.type(value, { delay: 20 })
  await pause(180)
  return true
}

async function measureClearButtons(page, size) {
  await setViewport(page, size)
  await page.$eval('.transfer-panel-demo__settings summary', (el) => {
    const settings = el.closest('details')
    if (settings) settings.open = true
  })
  await fillField(page, 'input[aria-label="筛选待选节点"]', '待授权')
  await fillField(page, 'input[aria-label="在已选项中检索"]', 'LEGACY-08')
  const facts = await pageFacts(page, `${size.name}-clear-hitbox`)
  const source = facts.panel.clearButtons.source.rect
  const selected = facts.panel.clearButtons.selected.rect
  const minimum = size.mobile ? 44 : 32
  const sourceOk = source?.width >= minimum && source?.height >= minimum
  const selectedOk = selected?.width >= minimum && selected?.height >= minimum
  evidence.checks.push({
    name: `filter-clear-hitboxes:${size.name}`,
    expectedMinimumPx: minimum,
    source,
    selected,
    passed: Boolean(sourceOk && selectedOk),
  })
  saveJson(join(outputDir, `${size.name}-clear-hitbox.dom.json`), facts)
  const demo = await page.$('.transfer-panel-demo')
  if (demo) {
    await demo.screenshot({
      path: join(outputDir, `${size.name}-clear-hitbox.demo.png`),
      captureBeyondViewport: true,
    })
  }
  return facts
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  defaultViewport: null,
  args: [
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
  ],
})

let context
let page

try {
  context = await browser.createBrowserContext()
  page = await context.newPage()
  await page.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  })
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.browserErrors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      evidence.resourceErrors.push({
        status: response.status(),
        url: response.url(),
        method: response.request().method(),
        resourceType: response.request().resourceType(),
      })
    }
  })
  page.on('requestfailed', (request) => {
    evidence.resourceErrors.push({
      failure: request.failure()?.errorText ?? 'unknown',
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    })
  })
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message))
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel', {
    timeout: 15000,
  })

  const initialFacts = await pageFacts(page, 'initial-default')
  evidence.browser = {
    ...evidence.browser,
    product: await browser.version(),
    contextId: context.id,
    pageUrl: page.url(),
    pageTitle: await page.title(),
    processId: browser.process()?.pid ?? null,
  }
  evidence.checks.push({
    name: 'default-selection-capacity',
    selected: initialFacts.panel.selectedItems.length,
    maxCountToggle: await page.$eval(
      '.transfer-panel-demo__toolbar label input',
      (input) => input.checked,
    ),
    expected: '4 selected, maxCount 5; one available slot',
    passed: initialFacts.panel.selectedItems.length === 4,
  })

  for (const size of viewportSizes) {
    await setViewport(page, size)
    await page.evaluate(() => {
      const details = document.querySelector('.transfer-panel-demo__settings')
      if (details) details.open = false
    })
    await setTheme(page, false)
    await capture(page, `${size.name}-light-default`)
    await page.evaluate(() => {
      const details = document.querySelector('.transfer-panel-demo__settings')
      if (details) details.open = true
    })
    await setTheme(page, true)
    await capture(page, `${size.name}-hud-default`)
    await setTheme(page, false)
  }

  await page.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  })
  await page.reload({ waitUntil: 'networkidle2' })
  await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel')
  await page.locator('.transfer-panel-demo__settings summary').click()
  await capture(page, 'desktop-1440x1000-light-controls-open')

  await fillField(page, 'input[aria-label="筛选待选节点"]', '待授权')
  const beforeAdd = await pageFacts(page, 'desktop-add-capacity-before')
  await capture(page, 'desktop-add-capacity-before')
  const addFiltered = await page.evaluate(() => {
    const button = document.querySelector(
      '.lx-transfer-panel__header-actions button[aria-label="全选筛选结果"]',
    )
    if (!button) return { ok: false, reason: '筛选批量按钮不存在' }
    if (button.disabled) return { ok: false, reason: '筛选批量按钮已禁用' }
    button.click()
    return { ok: true }
  })
  evidence.checks.push({
    name: 'add-within-default-capacity',
    action: addFiltered,
    before: beforeAdd.panel.selectedItems.length,
    expectedAfter: 5,
  })
  await pause(180)
  const afterAdd = await pageFacts(page, 'desktop-add-capacity-after')
  evidence.checks.at(-1).after = afterAdd.panel.selectedItems.length
  evidence.checks.at(-1).passed =
    addFiltered.ok && afterAdd.panel.selectedItems.length === 5
  await capture(page, 'desktop-add-capacity-after')

  await fillField(page, 'input[aria-label="筛选待选节点"]', '站前路')
  const atLimit = await pageFacts(page, 'desktop-limit-feedback')
  evidence.checks.push({
    name: 'limit-feedback',
    selectedCount: atLimit.panel.selectedItems.length,
    filter: atLimit.panel.sourceFilterValue,
    status: atLimit.panel.sourceStatus,
    filteredSelectDisabled: atLimit.panel.batchButton.disabled,
    addAllDisabled: atLimit.panel.addAllButton.disabled,
    compactHint: atLimit.panel.selectAllCompactHint,
    disabledReason: atLimit.panel.selectAllDisabledReason,
    buttonTitle: atLimit.panel.addAllButton.title,
    describedByText: atLimit.panel.addAllButton.describedByText,
    passed:
      atLimit.panel.selectedItems.length === 5 &&
      atLimit.panel.sourceFilterValue === '站前路' &&
      atLimit.panel.batchButton.disabled &&
      atLimit.panel.addAllButton.disabled &&
      atLimit.panel.selectAllCompactHint === '已达上限 5 项' &&
      /已达到选择上限 5 项/.test(atLimit.panel.selectAllDisabledReason) &&
      atLimit.panel.addAllButton.title ===
        atLimit.panel.selectAllDisabledReason &&
      atLimit.panel.addAllButton.describedByText ===
        atLimit.panel.selectAllDisabledReason,
  })
  await capture(page, 'desktop-limit-feedback')

  for (const size of viewportSizes) {
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel')
    await setTheme(page, false)
    const facts = await measureClearButtons(page, size)
    evidence.checks.push({
      name: `narrow-horizontal-overflow:${size.name}`,
      viewportWidth: facts.viewport.width,
      documentWidth: facts.document.scrollWidth,
      demoWidth: facts.demo.rect?.width ?? null,
      panelWidth: facts.panel.rect?.width ?? null,
      panelScrollWidth: facts.panel.scrollWidth,
      passed:
        !facts.document.horizontalOverflow &&
        (facts.panel.scrollWidth ?? 0) <= (facts.panel.rect?.width ?? Infinity) + 1,
    })
  }

  await page.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  })
  await page.reload({ waitUntil: 'networkidle2' })
  await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel')
  await page.locator('.transfer-panel-demo__settings summary').click()
  await page.focus('input[aria-label="在已选项中检索"]')
  await page.keyboard.type('LEGACY-08')
  await pause(180)
  await page.keyboard.press('Tab')
  const focusedSelectedClear = await page.evaluate(() => ({
    label: document.activeElement?.getAttribute('aria-label') ?? '',
    outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
    outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
    rect: (() => {
      const box = document.activeElement?.getBoundingClientRect()
      return box
        ? { width: Math.round(box.width), height: Math.round(box.height) }
        : null
    })(),
  }))
  await page.keyboard.press('Enter')
  await pause(180)
  const afterSelectedClear = await page.evaluate(() => ({
    value: document.querySelector('input[aria-label="在已选项中检索"]')?.value,
    focusReturned:
      document.activeElement ===
      document.querySelector('input[aria-label="在已选项中检索"]'),
  }))
  evidence.checks.push({
    name: 'keyboard-clear-selected-filter',
    focusedSelectedClear,
    afterClear: afterSelectedClear,
    passed:
      focusedSelectedClear.label === '清除已选项筛选' &&
      afterSelectedClear.value === '' &&
      afterSelectedClear.focusReturned,
  })
  await capture(page, 'desktop-keyboard-selected-filter-cleared')

  await page.focus('input[aria-label="筛选待选节点"]')
  await page.keyboard.type('待授权')
  await pause(180)
  await page.keyboard.press('Tab')
  const focusedSourceClear = await page.evaluate(() => ({
    label: document.activeElement?.getAttribute('aria-label') ?? '',
    outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
    outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
  }))
  await page.keyboard.press('Enter')
  await pause(180)
  const afterSourceClear = await page.evaluate(() => ({
    value: document.querySelector('input[aria-label="筛选待选节点"]')?.value,
    focusReturned:
      document.activeElement ===
      document.querySelector('input[aria-label="筛选待选节点"]'),
  }))
  evidence.checks.push({
    name: 'keyboard-clear-source-filter',
    focusedSourceClear,
    afterClear: afterSourceClear,
    passed:
      focusedSourceClear.label === '清除待选节点筛选' &&
      afterSourceClear.value === '' &&
      afterSourceClear.focusReturned,
  })
  await capture(page, 'desktop-keyboard-source-filter-cleared')

  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ])
  const motionFacts = await pageFacts(page, 'desktop-reduced-motion')
  evidence.checks.push({
    name: 'reduced-motion-emulation',
    matches: motionFacts.reducedMotion.matches,
    treeToggleTransitionDuration:
      motionFacts.reducedMotion.treeToggleTransitionDuration,
    treeToggleTransitionProperty:
      motionFacts.reducedMotion.treeToggleTransitionProperty,
    passed: motionFacts.reducedMotion.matches,
  })
  await capture(page, 'desktop-reduced-motion')
  await page.emulateMediaFeatures([])

  for (const size of viewportSizes.slice(1)) {
    await page.setViewport({
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    })
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel')
    await page.focus('.lx-transfer-panel__selected')
    const beforeScroll = await pageFacts(page, `${size.name}-selected-scroll-before`)
    await page.keyboard.press('End')
    await pause(250)
    const afterScroll = await pageFacts(page, `${size.name}-selected-scroll-after`)
    evidence.checks.push({
      name: `keyboard-selected-list-scroll:${size.name}`,
      beforeScrollTop: beforeScroll.panel.selectedList.scrollTop,
      beforeHint: beforeScroll.panel.scrollHint,
      afterScrollTop: afterScroll.panel.selectedList.scrollTop,
      afterHint: afterScroll.panel.scrollHint,
      listFocused: afterScroll.panel.selectedList.focused,
      passed:
        afterScroll.panel.selectedList.focused &&
        (afterScroll.panel.selectedList.scrollTop ?? 0) >=
          (beforeScroll.panel.selectedList.scrollTop ?? 0),
    })
    await capture(page, `${size.name}-selected-list-keyboard-end`)
  }

  await page.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  })
  await page.reload({ waitUntil: 'networkidle2' })
  await page.waitForSelector('.transfer-panel-demo .lx-transfer-panel')
  await page.locator('.transfer-panel-demo__settings summary').click()
  for (const [buttonText, captureName] of [
    ['空结果', 'desktop-host-empty'],
    ['加载中', 'desktop-host-loading'],
    ['加载失败', 'desktop-host-error'],
  ]) {
    const clicked = await clickDemoButton(page, buttonText)
    if (!clicked.ok) failCheck(`host-state:${buttonText}`, clicked, 'state visible')
    const facts = await capture(page, captureName)
    evidence.checks.at(-1).state = facts.demo.stateMessage
    evidence.checks.at(-1).role = facts.demo.stateMessageRole
    evidence.checks.at(-1).busy = facts.demo.ariaBusy
    evidence.checks.at(-1).inert = facts.demo.inert
  }
  const retry = await clickDemoButton(page, '重试')
  const recovered = await capture(page, 'desktop-host-retry-recovered')
  evidence.checks.push({
    name: 'host-state-retry',
    action: retry,
    recoveredStatus: recovered.demo.liveStatus,
    passed: retry.ok && !recovered.demo.stateMessage,
  })

  evidence.summary = {
    captureCount: evidence.captures.length,
    checkCount: evidence.checks.length,
    failedChecks: evidence.checks.filter((check) => check.passed === false),
    browserErrors: evidence.browserErrors,
    resourceErrors: evidence.resourceErrors,
    pageErrors: evidence.pageErrors,
  }
  saveJson(join(outputDir, 'browser-evidence.json'), evidence)
  console.log(
    JSON.stringify(
      {
        browser: evidence.browser,
        captures: evidence.captures.length,
        failedChecks: evidence.summary.failedChecks,
        browserErrors: evidence.browserErrors,
        resourceErrors: evidence.resourceErrors,
        pageErrors: evidence.pageErrors,
      },
      null,
      2,
    ),
  )
} catch (error) {
  evidence.failure = error instanceof Error ? error.stack ?? error.message : String(error)
  evidence.summary = {
    captureCount: evidence.captures.length,
    checkCount: evidence.checks.length,
    failedChecks: evidence.checks.filter((check) => check.passed === false),
    browserErrors: evidence.browserErrors,
    resourceErrors: evidence.resourceErrors,
    pageErrors: evidence.pageErrors,
  }
  saveJson(join(outputDir, 'browser-evidence.json'), evidence)
  console.error(evidence.failure)
  process.exitCode = 1
} finally {
  await context?.close().catch(() => {})
  await browser.close().catch(() => {})
}
