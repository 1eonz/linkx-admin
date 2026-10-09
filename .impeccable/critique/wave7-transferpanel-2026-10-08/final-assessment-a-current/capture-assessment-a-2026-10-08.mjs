import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const root = process.cwd()
const outputDir = path.join(
  root,
  '.impeccable',
  'critique',
  'wave7-transferpanel-2026-10-08',
  'final-assessment-a-current',
)
const playwrightPath = path.join(
  root,
  'other-admin',
  'admin-vue3',
  'node_modules',
  '.pnpm',
  'playwright@1.58.0',
  'node_modules',
  'playwright',
)
const { chromium } = require(playwrightPath)
const browserExecutable = path.join(
  process.env.LOCALAPPDATA ?? '',
  'ms-playwright',
  'chromium_headless_shell-1243',
  'chrome-headless-shell-win64',
  'chrome-headless-shell.exe',
)
const url = 'http://127.0.0.1:4177/components/lxtransferpanel'
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/types.ts',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/src/components/LxVirtualTree/index.vue',
  'linkx-fe/src/components/LxVirtualTree/types.ts',
  'linkx-fe/docs/components/lxtransferpanel.md',
  'linkx-fe/docs/components/lxvirtualtree.md',
]

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
}

function hashes() {
  return Object.fromEntries(sourceFiles.map((file) => [file, sha256(file)]))
}

function round(value) {
  return Math.round(value * 100) / 100
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const facts = {
    assessment: 'A: independent design review',
    capturedAt: new Date().toISOString(),
    target: url,
    method: 'Fresh Playwright Chromium browser, context, and page; no existing browser tabs reused.',
    browser: null,
    browserExecutable,
    context: { reducedMotion: 'reduce', colorScheme: 'light' },
    sourceHashesAtStart: hashes(),
    screenshots: [],
    scenarios: {},
    consoleErrors: [],
    pageErrors: [],
  }
  if (!fs.existsSync(browserExecutable)) {
    throw new Error('The preinstalled Chromium headless shell executable was not found.')
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable,
  })
  facts.browser = await browser.version()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') facts.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => facts.pageErrors.push(error.message))

  async function screenshot(name, locator) {
    const file = path.join(outputDir, name)
    if (locator) await locator.screenshot({ path: file, animations: 'disabled' })
    else await page.screenshot({ path: file, animations: 'disabled' })
    facts.screenshots.push(name)
  }

  async function snapshot() {
    return page.evaluate(() => {
      const box = (element) => {
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        }
      }
      const css = (element, names) => {
        if (!element) return null
        const style = getComputedStyle(element)
        return Object.fromEntries(names.map((name) => [name, style[name]]))
      }
      const panel = document.querySelector('.lx-transfer-panel')
      const preview = document.querySelector('.transfer-panel-demo__preview')
      const sourcePanel = document.querySelector('.lx-transfer-panel__panel')
      const tree = document.querySelector('.lx-virtual-tree__viewport')
      const selectedList = document.querySelector('.lx-transfer-panel__selected')
      const selectedHint = document.querySelector('.lx-transfer-panel__selected-scroll-hint')
      const rows = [...document.querySelectorAll('.lx-virtual-tree__row')]
      const labels = [
        ...document.querySelectorAll(
          '.lx-virtual-tree__label, .lx-transfer-panel__selected-name, .lx-transfer-panel__inherit-description',
        ),
      ].map((element) => ({
        text: element.textContent.trim(),
        title: element.getAttribute('title'),
        box: box(element),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        style: css(element, [
          'display',
          'overflow',
          'overflowWrap',
          'whiteSpace',
          'textOverflow',
          'lineHeight',
          'fontSize',
          'color',
        ]),
      }))
      const keyRows = rows.map((row) => ({
        text: row.querySelector('.lx-virtual-tree__label')?.textContent.trim() ?? '',
        checked: row.getAttribute('aria-checked'),
        disabled: row.getAttribute('aria-disabled'),
        expanded: row.getAttribute('aria-expanded'),
        level: row.getAttribute('aria-level'),
        tabIndex: row.getAttribute('tabindex'),
        box: box(row),
      }))
      const toggles = [
        ...document.querySelectorAll(
          '.lx-transfer-panel__mobile-switch button, .lx-virtual-tree__toggle, .lx-virtual-tree__checkbox-control, .lx-transfer-panel__selected-item button',
        ),
      ].map((element) => ({
        name:
          element.getAttribute('aria-label') ||
          element.textContent.trim() ||
          element.className,
        box: box(element),
        disabled: element.disabled ?? false,
      }))
      const active = document.activeElement
      const rootStyle = getComputedStyle(document.documentElement)
      return {
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        },
        document: {
          title: document.title,
          readyState: document.readyState,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
          bodyScrollWidth: document.body.scrollWidth,
        },
        preview: {
          box: box(preview),
          themeClass: preview?.className ?? '',
          background: preview ? getComputedStyle(preview).backgroundColor : null,
          themeTokens: {
            background: getComputedStyle(preview ?? document.body).getPropertyValue('--lx-bg-card').trim(),
            foreground: getComputedStyle(preview ?? document.body).getPropertyValue('--lx-text-primary').trim(),
            primary: getComputedStyle(preview ?? document.body).getPropertyValue('--lx-color-primary').trim(),
          },
        },
        panel: {
          box: box(panel),
          className: panel?.className ?? '',
          gridTemplateColumns: panel ? getComputedStyle(panel).gridTemplateColumns : null,
          style: css(panel, ['display', 'gap', 'minWidth', 'height', 'backgroundColor', 'color']),
        },
        sourcePanel: {
          box: box(sourcePanel),
          hiddenOnMobile: sourcePanel?.classList.contains('is-mobile-hidden') ?? false,
        },
        tree: {
          box: box(tree),
          style: css(tree, ['overflow', 'height', 'backgroundColor', 'borderColor']),
          rowCount: rows.length,
          rows: keyRows,
        },
        selectedList: (() => {
          if (!selectedList) return null
          const listBox = selectedList.getBoundingClientRect()
          const hintBox = selectedHint?.getBoundingClientRect()
          const items = [...selectedList.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => {
            const name = item.querySelector('.lx-transfer-panel__selected-name')
            const itemBox = item.getBoundingClientRect()
            const nameStyle = name ? getComputedStyle(name) : null
            return {
              text: name?.textContent.trim() ?? '',
              title: name?.getAttribute('title'),
              box: box(item),
              nameBox: box(name),
              nameScrollWidth: name?.scrollWidth ?? null,
              nameClientWidth: name?.clientWidth ?? null,
              nameStyle: nameStyle
                ? {
                    overflow: nameStyle.overflow,
                    overflowWrap: nameStyle.overflowWrap,
                    textOverflow: nameStyle.textOverflow,
                    whiteSpace: nameStyle.whiteSpace,
                  }
                : null,
              intersectsListViewport:
                itemBox.bottom > listBox.top && itemBox.top < listBox.bottom,
              intersectsScrollHint:
                Boolean(hintBox) &&
                itemBox.right > hintBox.left &&
                itemBox.left < hintBox.right &&
                itemBox.bottom > hintBox.top &&
                itemBox.top < hintBox.bottom,
            }
          })
          return {
            box: box(selectedList),
            clientHeight: selectedList.clientHeight,
            scrollHeight: selectedList.scrollHeight,
            scrollTop: selectedList.scrollTop,
            canScroll: selectedList.scrollHeight > selectedList.clientHeight,
            hint: selectedHint
              ? {
                  text: selectedHint.textContent.trim(),
                  box: box(selectedHint),
                  style: css(selectedHint, ['position', 'pointerEvents', 'backgroundColor', 'minHeight']),
                }
              : null,
            items,
          }
        })(),
        mobileSwitch: {
          style: css(document.querySelector('.lx-transfer-panel__mobile-switch'), ['display', 'gridTemplateColumns']),
          buttons: [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')].map((button) => ({
            text: button.textContent.trim(),
            label: button.getAttribute('aria-label'),
            pressed: button.getAttribute('aria-pressed'),
            box: box(button),
          })),
        },
        keyboardHint: (() => {
          const element = document.querySelector('.lx-transfer-panel__keyboard-hint')
          return element
            ? {
                text: element.textContent.trim(),
                box: box(element),
                display: getComputedStyle(element).display,
              }
            : null
        })(),
        selectedSummary: [...document.querySelectorAll('[data-testid="selected-count"], .lx-transfer-panel__selected-count')]
          .map((element) => element.textContent.trim()),
        mobileAndTouchControls: toggles,
        longTextCandidates: labels,
        activeElement: active
          ? {
              tag: active.tagName,
              role: active.getAttribute('role'),
              label: active.getAttribute('aria-label'),
              text: active.textContent.trim().slice(0, 120),
              tabIndex: active.getAttribute('tabindex'),
              outlineStyle: getComputedStyle(active).outlineStyle,
              outlineWidth: getComputedStyle(active).outlineWidth,
            }
          : null,
        rootColors: {
          background: rootStyle.backgroundColor,
          foreground: rootStyle.color,
        },
      }
    })
  }

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    facts.navigation = { status: response?.status() ?? null, finalUrl: page.url() }
    await page.locator('.lx-transfer-panel').first().waitFor({ state: 'visible', timeout: 30000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    facts.scenarios.desktop1440Light = await snapshot()
    await screenshot('desktop-1440x960-light.png')
    await screenshot('desktop-component-preview-light.png', page.locator('.transfer-panel-demo__preview'))

    const settings = page.locator('.transfer-panel-demo__settings')
    await settings.locator('summary').click()
    await page.locator('.transfer-panel-demo__toolbar-group').nth(1).locator('input[type="checkbox"]').nth(1).check()
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    facts.scenarios.desktop1440HudDark = await snapshot()
    await screenshot('desktop-1440x960-hud-dark.png')
    await screenshot('desktop-component-preview-hud-dark.png', page.locator('.transfer-panel-demo__preview'))
    await page.locator('.transfer-panel-demo__toolbar-group').nth(1).locator('input[type="checkbox"]').nth(1).uncheck()

    for (const viewport of [
      { width: 320, height: 740, label: 'mobile320' },
      { width: 390, height: 844, label: 'mobile390' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      facts.scenarios[viewport.label + 'Source'] = await snapshot()
      await screenshot(viewport.label + '-source.png')
      const tabs = page.locator('.lx-transfer-panel__mobile-switch button')
      if (await tabs.count()) {
        await tabs.nth(1).click()
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        facts.scenarios[viewport.label + 'SelectedLongText'] = await snapshot()
        await screenshot(viewport.label + '-selected-long-text.png')
        const selectedList = page.locator('.lx-transfer-panel__selected')
        await selectedList.evaluate((element) => {
          element.scrollTop = element.scrollHeight
        })
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        facts.scenarios[viewport.label + 'SelectedLongTextAtScrollEnd'] = await snapshot()
        await screenshot(viewport.label + '-selected-long-text-scroll-end.png')
        await tabs.nth(0).click()
      } else {
        facts.scenarios[viewport.label + 'SelectedLongText'] = {
          unavailable: 'The narrow-screen panel switch was not present in the live DOM.',
        }
      }
    }

    await page.setViewportSize({ width: 1440, height: 960 })
    await page.locator('.transfer-panel-demo__preview').scrollIntoViewIfNeeded()
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const rows = page.locator('.lx-virtual-tree__row[role="treeitem"]')
    const rowFacts = await rows.evaluateAll((elements) =>
      elements.map((row, index) => ({
        index,
        label: row.querySelector('.lx-virtual-tree__label')?.textContent.trim() ?? '',
        checked: row.getAttribute('aria-checked'),
        disabled: row.getAttribute('aria-disabled'),
        expanded: row.getAttribute('aria-expanded'),
        level: row.getAttribute('aria-level'),
      })),
    )
    facts.keyboardCandidates = rowFacts
    const candidate = rowFacts.find(
      (row) =>
        row.checked === 'false' &&
        row.disabled !== 'true' &&
        row.expanded === null,
    )
    if (candidate) {
      const target = rows.nth(candidate.index)
      await target.focus()
      await target.press('Space')
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      facts.scenarios.keyboardSelection = {
        method: 'Focused an enabled, unchecked leaf tree item; pressed Space.',
        target: candidate,
        after: await snapshot(),
      }
      await screenshot('desktop-keyboard-selection-use.png')
    } else {
      facts.scenarios.keyboardSelection = {
        unavailable: 'No visible enabled unchecked leaf tree item was available.',
        visibleCandidates: rowFacts,
      }
    }
  } catch (error) {
    facts.captureError = error.stack || error.message
  } finally {
    facts.sourceHashesAtEnd = hashes()
    facts.sourceHashesStable = JSON.stringify(facts.sourceHashesAtStart) === JSON.stringify(facts.sourceHashesAtEnd)
    fs.writeFileSync(
      path.join(outputDir, 'browser-facts-assessment-a-2026-10-08.json'),
      JSON.stringify(facts, null, 2),
      'utf8',
    )
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
  process.stdout.write(JSON.stringify({
    navigation: facts.navigation,
    capturedAt: facts.capturedAt,
    reducedMotion: facts.scenarios.desktop1440Light?.viewport?.reducedMotion,
    scenarios: Object.keys(facts.scenarios),
    screenshots: facts.screenshots,
    sourceHashesStable: facts.sourceHashesStable,
    captureError: facts.captureError ?? null,
  }, null, 2))
}

main().catch((error) => {
  process.stderr.write((error.stack || error.message) + '\n')
  process.exitCode = 1
})
