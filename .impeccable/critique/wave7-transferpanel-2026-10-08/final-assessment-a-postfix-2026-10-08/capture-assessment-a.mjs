import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(root, 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const targetUrl = 'http://127.0.0.1:4177/components/lxtransferpanel'
const browserExecutablePath = [
  chromium.executablePath(),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
].find(existsSync)
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/types.ts',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/src/components/LxVirtualTree/index.vue',
  'linkx-fe/src/tokens/variables.css',
  'linkx-fe/src/tokens/theme-hud.css',
  'linkx-fe/docs/components/lxtransferpanel.md',
]

mkdirSync(outputDir, { recursive: true })

function hashSources() {
  return Object.fromEntries(
    sourceFiles.map((relativePath) => {
      const content = readFileSync(path.join(root, relativePath))
      return [relativePath, createHash('sha256').update(content).digest('hex')]
    }),
  )
}

async function openFreshPage(browser, name, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.transfer-panel-demo__preview .lx-transfer-panel').waitFor({
    state: 'visible',
  })
  await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready.then(() => true))
  return { context, page, name, pageErrors }
}

async function collectFacts(page, pageErrors) {
  return page.evaluate((capturedErrors) => {
    const preview = document.querySelector('.transfer-panel-demo__preview')
    const panel = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const controls = document.querySelector('.lx-transfer-panel__controls')
    const firstControlButton = controls?.querySelector('button')
    const keyboardHint = document.querySelector('.lx-transfer-panel__keyboard-hint')
    const caption = document.querySelector('.lx-transfer-panel__caption')
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const longSelected = [...document.querySelectorAll('.lx-transfer-panel__selected-name')]
      .find((element) => element.textContent.includes('历史授权单位'))
    const clippingPanel = caption?.closest('.lx-transfer-panel__panel')
    const focused = document.activeElement
    const rect = (element) => {
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return {
        x: Math.round(bounds.x * 100) / 100,
        y: Math.round(bounds.y * 100) / 100,
        width: Math.round(bounds.width * 100) / 100,
        height: Math.round(bounds.height * 100) / 100,
      }
    }
    const textMetrics = (element) => {
      if (!element) return null
      const style = getComputedStyle(element)
      return {
        text: element.textContent.trim(),
        title: element.getAttribute('title'),
        rect: rect(element),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        lineHeight: style.lineHeight,
        whiteSpace: style.whiteSpace,
        overflowWrap: style.overflowWrap,
        overflow: style.overflow,
      }
    }
    const longBounds = longSelected?.getBoundingClientRect()
    const listBounds = selectedList?.getBoundingClientRect()
    const captionBounds = caption?.getBoundingClientRect()
    const clippingPanelBounds = clippingPanel?.getBoundingClientRect()
    const keyboardHintBounds = keyboardHint?.getBoundingClientRect()
    const longItemVisibleInList = Boolean(
      longBounds &&
      listBounds &&
      longBounds.bottom > listBounds.top &&
      longBounds.top < listBounds.bottom &&
      longBounds.right > listBounds.left &&
      longBounds.left < listBounds.right,
    )
    const hintStyle = keyboardHint ? getComputedStyle(keyboardHint) : null
    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      },
      preview: {
        rect: rect(preview),
        width: preview?.clientWidth ?? null,
        className: preview?.className ?? null,
        isHud: preview?.classList.contains('lx-theme-hud') ?? false,
        backgroundColor: preview ? getComputedStyle(preview).backgroundColor : null,
      },
      panel: {
        rect: rect(panel),
        width: panel?.clientWidth ?? null,
        scrollWidth: panel?.scrollWidth ?? null,
        hasHorizontalOverflow: Boolean(panel && panel.scrollWidth > panel.clientWidth),
        gridTemplateColumns: panel ? getComputedStyle(panel).gridTemplateColumns : null,
        panelHeight: panel?.clientHeight ?? null,
        backgroundColors: {
          leftPanel: panels[0] ? getComputedStyle(panels[0]).backgroundColor : null,
          controls: controls ? getComputedStyle(controls).backgroundColor : null,
          firstControlButton: firstControlButton ? getComputedStyle(firstControlButton).backgroundColor : null,
          rightPanel: panels[1] ? getComputedStyle(panels[1]).backgroundColor : null,
        },
        mobileSwitchVisible: Boolean(
          panel && getComputedStyle(panel.querySelector('.lx-transfer-panel__mobile-switch')).display !== 'none',
        ),
        mobileSwitch: [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')]
          .map((button) => ({
            text: button.innerText.trim(),
            ariaLabel: button.getAttribute('aria-label'),
            pressed: button.getAttribute('aria-pressed'),
            visible: button.getBoundingClientRect().width > 0,
          })),
      },
      selection: {
        count: document.querySelectorAll('.lx-transfer-panel__selected-item').length,
        longSelected: textMetrics(longSelected),
        activePanel: document.querySelector('.lx-transfer-panel__panel:not(.is-mobile-hidden)')?.id ?? null,
        listScroll: selectedList
          ? {
              scrollTop: selectedList.scrollTop,
              scrollHeight: selectedList.scrollHeight,
              clientHeight: selectedList.clientHeight,
              remainingScroll: selectedList.scrollHeight - selectedList.clientHeight - selectedList.scrollTop,
              longItemVisibleInList,
            }
          : null,
      },
      panelTitles: [...document.querySelectorAll('.lx-transfer-panel__panel .lx-transfer-panel__title')]
        .map((element) => textMetrics(element)),
      keyboardHint: keyboardHint
        ? {
            text: keyboardHint.textContent.trim(),
            display: hintStyle.display,
            visibility: hintStyle.visibility,
            opacity: hintStyle.opacity,
            rect: rect(keyboardHint),
            visible: hintStyle.display !== 'none' && hintStyle.visibility !== 'hidden' && rect(keyboardHint)?.height > 0,
            captionRect: rect(caption),
            captionClientHeight: caption?.clientHeight ?? null,
            panelRect: rect(panel),
            clippingPanelRect: rect(clippingPanel),
            extendsCaption: Boolean(captionBounds && keyboardHintBounds && keyboardHintBounds.bottom > captionBounds.bottom),
            extendsClippingPanel: Boolean(
              clippingPanelBounds && keyboardHintBounds && keyboardHintBounds.bottom > clippingPanelBounds.bottom,
            ),
            clippingPanelOverflow: clippingPanel ? getComputedStyle(clippingPanel).overflow : null,
          }
        : null,
      focus: {
        tagName: focused?.tagName ?? null,
        role: focused?.getAttribute?.('role') ?? null,
        ariaLabel: focused?.getAttribute?.('aria-label') ?? null,
        className: typeof focused?.className === 'string' ? focused.className : null,
        treeItem: focused?.matches?.('[role="treeitem"]') ?? false,
        outlineStyle: focused ? getComputedStyle(focused).outlineStyle : null,
        outlineWidth: focused ? getComputedStyle(focused).outlineWidth : null,
      },
      pageErrors: capturedErrors,
    }
  }, pageErrors)
}

async function capture(browser, name, width, height, configure) {
  const { context, page, pageErrors } = await openFreshPage(browser, name, width, height)
  try {
    if (configure) await configure(page)
    await page.waitForTimeout(150)
    const screenshotPath = path.join(outputDir, `${name}.png`)
    await page.locator('.transfer-panel-demo__preview').screenshot({
      path: screenshotPath,
      animations: 'disabled',
    })
    const facts = await collectFacts(page, pageErrors)
    facts.screenshot = path.basename(screenshotPath)
    return facts
  } finally {
    await context.close()
  }
}

const before = hashSources()
const browser = await chromium.launch({ headless: true, executablePath: browserExecutablePath })
const captures = {}

try {
  captures.desktopLight = await capture(browser, 'desktop-light', 1440, 1000)
  captures.desktopHud = await capture(browser, 'desktop-hud', 1440, 1000, async (page) => {
    await page.locator('.transfer-panel-demo__settings summary').click()
    await page.locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] input').nth(1).check()
  })
  captures.mobile320 = await capture(browser, 'mobile-320', 320, 900)
  captures.mobile320Selected = await capture(
    browser,
    'mobile-320-selected-long-name',
    320,
    900,
    async (page) => {
      await page.locator('[data-testid="mobile-selected-panel"]').click()
      await page.locator('.lx-transfer-panel__selected').evaluate((list) => {
        list.scrollTop = list.scrollHeight
      })
    },
  )
  captures.mobile390Selected = await capture(
    browser,
    'mobile-390-selected-long-name',
    390,
    900,
    async (page) => page.locator('[data-testid="mobile-selected-panel"]').click(),
  )
  captures.mobile390SelectedScrolled = await capture(
    browser,
    'mobile-390-selected-long-name-scrolled',
    390,
    900,
    async (page) => {
      await page.locator('[data-testid="mobile-selected-panel"]').click()
      await page.locator('.lx-transfer-panel__selected').evaluate((list) => {
        list.scrollTop = list.scrollHeight
      })
    },
  )
  captures.desktopTreeFocus = await capture(
    browser,
    'desktop-tree-focus-hint',
    1440,
    1000,
    async (page) => {
      const firstTreeItem = page.locator('.lx-transfer-panel__tree [role="treeitem"][tabindex="0"]').first()
      await firstTreeItem.waitFor({ state: 'visible' })
      await firstTreeItem.focus()
    },
  )
} finally {
  await browser.close()
}

const after = hashSources()
const sourceHashesUnchanged = sourceFiles.every((relativePath) => before[relativePath] === after[relativePath])
const facts = {
  assessment: 'A: 独立设计评审',
  capturedAt: new Date().toISOString(),
  targetUrl,
  browser: {
    engine: 'Chromium',
    executablePath: browserExecutablePath,
    version: browser.version(),
    freshContextAndPagePerCapture: true,
  },
  sourceFiles,
  sourceHashesBefore: before,
  sourceHashesAfter: after,
  sourceHashesUnchanged,
  captures,
}

writeFileSync(path.join(outputDir, 'assessment-a-facts.json'), `${JSON.stringify(facts, null, 2)}\n`, 'utf8')
if (!sourceHashesUnchanged) {
  throw new Error('评审相关源码在浏览器采集前后发生变化，请核对现场哈希。')
}

console.log(JSON.stringify({ outputDir, sourceHashesUnchanged, captures: Object.keys(captures) }, null, 2))
