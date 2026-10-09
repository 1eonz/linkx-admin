import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(
  'F:\\work\\linkx-admin\\other-admin\\admin-vue3\\package.json',
)
const { chromium } = require('@playwright/test')
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.join(outputDir, 'screenshots')
const repoRoot = path.resolve(outputDir, '..', '..', '..', '..')
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/src/components/LxTransferPanel/types.ts',
  'linkx-fe/docs/components/lxtransferpanel.md',
]

async function hashSources() {
  return Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (relativePath) => {
        const content = await fs.readFile(path.join(repoRoot, relativePath))
        return [relativePath, createHash('sha256').update(content).digest('hex')]
      }),
    ),
  )
}

const sourceHashesBefore = await hashSources()

await fs.mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()
const runtimeErrors = []
page.on('pageerror', (error) => runtimeErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(message.text())
})

const round = (value) => Math.round(value * 100) / 100

async function collectFacts(width, state, interaction = {}) {
  const facts = await page.evaluate(
    ({ width, state, interaction }) => {
      const preview = document.querySelector('.transfer-panel-demo__preview')
      const panel = preview?.querySelector('.lx-transfer-panel')
      const list = panel?.querySelector('.lx-transfer-panel__selected')
      const listRect = list?.getBoundingClientRect()
      const listTop = listRect ? listRect.top + list.clientTop : null
      const listBottom = list && listTop !== null ? listTop + list.clientHeight : null
      const rect = (element) => {
        if (!element) return null
        const value = element.getBoundingClientRect()
        return {
          x: Math.round(value.x * 100) / 100,
          y: Math.round(value.y * 100) / 100,
          width: Math.round(value.width * 100) / 100,
          height: Math.round(value.height * 100) / 100,
          top: Math.round(value.top * 100) / 100,
          right: Math.round(value.right * 100) / 100,
          bottom: Math.round(value.bottom * 100) / 100,
        }
      }
      const selectedItems = [...(list?.querySelectorAll(':scope > li') ?? [])]
      const rows = selectedItems.map((item) => {
        const name = item.querySelector('.lx-transfer-panel__selected-name')
        const nameStyle = name ? getComputedStyle(name) : null
        const lineHeight = Number.parseFloat(nameStyle?.lineHeight ?? '')
        const visibleNameLineCount = name && lineHeight
          ? Math.round(name.clientHeight / lineHeight)
          : 0
        const details = item.querySelector('details')
        const summary = details?.querySelector('summary')
        const full = details?.querySelector('.lx-transfer-panel__selected-name-full')
        const remove = item.querySelector('button[aria-label^="移除"]')
        const removeRect = remove?.getBoundingClientRect()
        const intersectsList = Boolean(
          removeRect && listTop !== null && listBottom !== null &&
          removeRect.bottom > listTop && removeRect.top < listBottom &&
          removeRect.right > listRect.left && removeRect.left < listRect.right,
        )
        const center = removeRect
          ? document.elementFromPoint(
              removeRect.left + removeRect.width / 2,
              removeRect.top + removeRect.height / 2,
            )
          : null
        return {
          text: item.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          height: Math.round(item.getBoundingClientRect().height * 100) / 100,
          nameText: name?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          nameRect: rect(name),
          nameScroll: name ? { width: name.scrollWidth, height: name.scrollHeight, clientWidth: name.clientWidth, clientHeight: name.clientHeight } : null,
          nameVisibleLineCount: visibleNameLineCount,
          nameLayout: nameStyle ? {
            lineHeight: nameStyle.lineHeight,
            maxHeight: nameStyle.maxHeight,
            lineClamp: nameStyle.webkitLineClamp,
          } : null,
          disclosure: details ? {
            open: details.open,
            rect: rect(details),
            summaryRect: rect(summary),
            summaryLabel: summary?.getAttribute('aria-label'),
            ariaExpanded: summary?.getAttribute('aria-expanded'),
            fullText: full?.textContent?.trim() ?? '',
            fullRect: rect(full),
          } : null,
          remove: remove ? {
            label: remove.getAttribute('aria-label'),
            disabled: remove.disabled,
            rect: rect(remove),
            intersectsList,
            centerHit: Boolean(center && (center === remove || remove.contains(center))),
          } : null,
        }
      })
      const previewRect = rect(preview)
      const selectedTabButtons = [...(panel?.querySelectorAll('.lx-transfer-panel__mobile-switch button') ?? [])]
      return {
        width,
        state,
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
        pageSize: {
          htmlClientWidth: document.documentElement.clientWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        },
        previewRect,
        panelRect: rect(panel),
        panelColumns: panel ? getComputedStyle(panel).gridTemplateColumns : null,
        selectedSwitch: selectedTabButtons.map((button) => ({
          text: button.textContent?.replace(/\s+/g, ' ').trim(),
          pressed: button.getAttribute('aria-pressed'),
          rect: rect(button),
        })),
        list: list ? {
          rect: rect(list),
          clientHeight: list.clientHeight,
          scrollHeight: list.scrollHeight,
          scrollTop: list.scrollTop,
          maxScrollTop: list.scrollHeight - list.clientHeight,
          overflowY: getComputedStyle(list).overflowY,
          items: rows,
        } : null,
        interaction,
      }
    },
    { width, state, interaction },
  )
  return facts
}

async function saveScreenshot(width, state) {
  await page.screenshot({
    path: path.join(screenshotDir, `mobile-${width}-${state}-viewport.png`),
    fullPage: false,
  })
  await page.locator('.transfer-panel-demo__preview').screenshot({
    path: path.join(screenshotDir, `mobile-${width}-${state}-preview.png`),
  })
}

async function waitForDisclosure(open) {
  await page.waitForFunction(
    (expected) => {
      const details = document.querySelector(
        '.transfer-panel-demo__preview .lx-transfer-panel__selected details',
      )
      return details instanceof HTMLDetailsElement && details.open === expected
    },
    open,
  )
  await page.waitForTimeout(100)
}

const results = []
for (const width of [320, 390]) {
  await page.setViewportSize({ width, height: 844 })
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.transfer-panel-demo__preview .lx-transfer-panel').waitFor()
  await page.waitForTimeout(700)
  await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()

  const panel = page.locator('.transfer-panel-demo__preview .lx-transfer-panel').first()
  const selectedTab = panel.locator('.lx-transfer-panel__mobile-switch button').nth(1)
  if (await selectedTab.isVisible()) await selectedTab.click()
  const list = panel.locator('.lx-transfer-panel__selected')
  await list.waitFor({ state: 'visible' })
  await page.waitForTimeout(250)

  const disclosure = list.locator('details').first()
  const disclosureCount = await list.locator('details').count()
  if (disclosureCount < 1) {
    throw new Error(`No long-name disclosure found at ${width}px`)
  }
  const summary = disclosure.locator('summary')
  const fullName = (await disclosure.locator('.lx-transfer-panel__selected-name-full').textContent())?.trim() ?? ''
  const collapsedFacts = await collectFacts(width, 'collapsed-before-interactions', {
    disclosureCount,
    fullNameLength: fullName.length,
  })
  await saveScreenshot(width, 'collapsed')
  await list.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.waitForTimeout(100)
  const collapsedBottomFacts = await collectFacts(width, 'collapsed-at-list-bottom', {
    disclosureCount,
    fullNameLength: fullName.length,
  })
  await saveScreenshot(width, 'collapsed-list-bottom')
  await list.evaluate((element) => { element.scrollTop = 0 })
  await page.waitForTimeout(100)
  const clickExpands = await (async () => {
    await summary.click()
    await waitForDisclosure(true)
    return (await disclosure.locator('.lx-transfer-panel__selected-name-full').textContent())?.trim() === fullName
  })()
  await page.screenshot({
    path: path.join(screenshotDir, `mobile-${width}-click-expanded-viewport.png`),
    fullPage: false,
  })
  await disclosure.locator('summary').click()
  await waitForDisclosure(false)

  await summary.focus()
  await summary.press('Enter')
  await waitForDisclosure(true)
  const enterExpands = (await summary.getAttribute('aria-expanded')) === 'true' &&
    (await disclosure.locator('.lx-transfer-panel__selected-name-full').textContent())?.trim() === fullName
  await summary.press('Enter')
  await waitForDisclosure(false)

  await summary.focus()
  await summary.press('Space')
  await waitForDisclosure(true)
  const spaceExpands = (await summary.getAttribute('aria-expanded')) === 'true' &&
    (await disclosure.locator('.lx-transfer-panel__selected-name-full').textContent())?.trim() === fullName
  await saveScreenshot(width, 'space-expanded')

  const expandedFacts = await collectFacts(width, 'expanded-at-list-top', {
    disclosureCount,
    fullNameLength: fullName.length,
    clickExpandsFullText: clickExpands,
    enterExpandsFullText: enterExpands,
    spaceExpandsFullText: spaceExpands,
    ariaExpandedAfterSpace: await summary.getAttribute('aria-expanded'),
  })
  await list.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.waitForTimeout(200)
  await saveScreenshot(width, 'list-bottom-space-expanded')
  const bottomFacts = await collectFacts(width, 'expanded-at-list-bottom', {
    disclosureCount,
    fullNameLength: fullName.length,
    clickExpandsFullText: clickExpands,
    enterExpandsFullText: enterExpands,
    spaceExpandsFullText: spaceExpands,
    ariaExpandedAfterSpace: await summary.getAttribute('aria-expanded'),
  })

  const output = {
    width,
    targetUrl,
    browser: 'Playwright Chromium, isolated browser context and new page',
    facts: [collapsedFacts, collapsedBottomFacts, expandedFacts, bottomFacts],
    runtimeErrors: [...runtimeErrors],
  }
  results.push(output)
}

await context.close()
await browser.close()

const sourceHashesAfter = await hashSources()
const sourceUnchanged = JSON.stringify(sourceHashesBefore) === JSON.stringify(sourceHashesAfter)
const sourceHashEvidence = {
  capturedAt: new Date().toISOString(),
  sourceUnchanged,
  files: Object.fromEntries(
    sourceFiles.map((file) => [file, {
      before: sourceHashesBefore[file],
      after: sourceHashesAfter[file],
      matches: sourceHashesBefore[file] === sourceHashesAfter[file],
    }]),
  ),
}
await fs.writeFile(
  path.join(outputDir, 'source-hashes.json'),
  JSON.stringify(sourceHashEvidence, null, 2),
  'utf8',
)
if (!sourceUnchanged) {
  throw new Error('Source changed during browser capture; screenshots are not valid assessment evidence')
}

for (const result of results) {
  await fs.writeFile(
    path.join(outputDir, `browser-evidence-${result.width}.json`),
    JSON.stringify(result, null, 2),
    'utf8',
  )
}
await fs.writeFile(
  path.join(outputDir, 'browser-evidence.json'),
  JSON.stringify({ targetUrl, sourceUnchanged, results }, null, 2),
  'utf8',
)
