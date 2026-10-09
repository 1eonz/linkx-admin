import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const playwrightEntry =
  'F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/@playwright+test@1.58.0/node_modules/@playwright/test/index.js'
const { chromium } = require(playwrightEntry)
const root = process.cwd()
const evidenceDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-08/postfix-independent-assessment-a-2026-10-08',
)
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const sourceFiles = [
  'linkx-fe/src/components/LxTransferPanel/index.vue',
  'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  'linkx-fe/docs/components/lxtransferpanel.md',
]

mkdirSync(evidenceDir, { recursive: true })

function hashSources() {
  return Object.fromEntries(
    sourceFiles.map((relativePath) => {
      const content = readFileSync(path.join(root, relativePath))
      return [
        relativePath,
        createHash('sha256').update(content).digest('hex').toUpperCase(),
      ]
    }),
  )
}

function writeScreenshotName(name) {
  return path.join(evidenceDir, `${name}.png`)
}

function sameObject(first, second) {
  return JSON.stringify(first) === JSON.stringify(second)
}

const record = {
  capturedAt: new Date().toISOString(),
  targetUrl,
  targetSource: sourceFiles[0],
  viewportAndStateFacts: {},
  screenshots: [],
  browserErrors: [],
  failedResponses: [],
  failedRequests: [],
  sourceHashesBefore: hashSources(),
}

const preferredExecutable = chromium.executablePath()
const executablePath = existsSync(preferredExecutable)
  ? preferredExecutable
  : 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await chromium.launch({ headless: true, executablePath })
const context = await browser.newContext({
  locale: 'zh-CN',
  colorScheme: 'light',
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
page.on('pageerror', (error) => record.browserErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') {
    record.browserErrors.push({
      text: message.text(),
      location: message.location(),
    })
  }
})
page.on('requestfailed', (request) => {
  record.failedRequests.push({
    url: request.url(),
    resourceType: request.resourceType(),
    error: request.failure()?.errorText ?? null,
  })
})
page.on('response', (response) => {
  if (response.status() >= 400) {
    record.failedResponses.push({
      url: response.url(),
      status: response.status(),
      resourceType: response.request().resourceType(),
    })
  }
})

async function screenshot(name, selector = '.transfer-panel-demo') {
  const locator = page.locator(selector).first()
  await locator.scrollIntoViewIfNeeded()
  await locator.screenshot({ path: writeScreenshotName(name) })
  record.screenshots.push(`${name}.png`)
}

async function pageFacts() {
  return page.evaluate(() => {
    const root = document.querySelector('.lx-transfer-panel')
    const preview = document.querySelector('.transfer-panel-demo__preview')
    const rect = (element) => {
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return {
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        right: Math.round(bounds.right),
        bottom: Math.round(bounds.bottom),
      }
    }
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalPageOverflow:
        document.documentElement.scrollWidth > innerWidth,
      demoPreview: rect(preview),
      component: rect(root),
      componentColumns: root ? getComputedStyle(root).gridTemplateColumns : null,
      theme: preview?.classList.contains('lx-theme-hud') ? 'HUD dark' : 'light',
      selectedCount:
        document.querySelector('[data-testid="selected-count"]')?.textContent?.trim() ??
        null,
      selectedDisclosureCount: document.querySelectorAll(
        '.lx-transfer-panel__selected-name-disclosure summary',
      ).length,
      shortFirstNameHasDisclosure: Boolean(
        document
          .querySelector('.lx-transfer-panel__selected-item')
          ?.querySelector('.lx-transfer-panel__selected-name-disclosure'),
      ),
      sourceTreeCount:
        document.querySelector('[data-testid="tree-node-count"]')?.textContent?.trim() ??
        null,
      demoSummary: (() => {
        const summary = document.querySelector('.transfer-panel-demo__summary')
        const spans = [...(summary?.querySelectorAll('span') ?? [])]
        return {
          text: summary?.textContent?.trim() ?? null,
          box: rect(summary),
          clientWidth: summary?.clientWidth ?? null,
          scrollWidth: summary?.scrollWidth ?? null,
          items: spans.map((span) => ({
            text: span.textContent?.trim() ?? '',
            box: rect(span),
            scrollWidth: span.scrollWidth,
            clientWidth: span.clientWidth,
          })),
        }
      })(),
    }
  })
}

try {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.transfer-panel-demo').waitFor({ state: 'visible' })
  await page.locator('.lx-transfer-panel').waitFor({ state: 'visible' })
  await page.waitForTimeout(900)
  record.pageMetadata = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    heading: document.querySelector('h1')?.textContent?.trim() ?? null,
  }))

  await page.locator('.transfer-panel-demo__settings > summary').click()
  await page.waitForTimeout(150)
  record.viewportAndStateFacts['desktop-light'] = await pageFacts()
  await screenshot('01-desktop-light')

  const themeToggle = page
    .locator('[aria-label="示例参数"] label')
    .filter({ hasText: 'HUD 深色主题' })
    .locator('input')
  await themeToggle.check()
  await page.waitForTimeout(150)
  record.viewportAndStateFacts['desktop-hud-dark'] = await pageFacts()
  await screenshot('02-desktop-hud-dark')

  await page.locator('.lx-transfer-panel__selected').focus()
  await page.keyboard.press('Tab')
  await page.waitForTimeout(100)
  record.viewportAndStateFacts['hud-dark-keyboard-focus'] = await page.evaluate(() => {
    const active = document.activeElement
    const style = active ? getComputedStyle(active) : null
    const preview = document.querySelector('.transfer-panel-demo__preview')
    return {
      activeName: active?.getAttribute('aria-label') ?? null,
      focusVisible: active?.matches(':focus-visible') ?? false,
      outlineColor: style?.outlineColor ?? null,
      outlineWidth: style?.outlineWidth ?? null,
      primaryToken: preview
        ? getComputedStyle(preview).getPropertyValue('--lx-color-primary').trim()
        : null,
    }
  })
  await screenshot('14-hud-dark-keyboard-focus')

  await themeToggle.uncheck()
  const scopeDetails = page.locator('.lx-transfer-panel__scope-actions')
  await scopeDetails.locator('summary').click()
  await page.waitForTimeout(150)
  record.viewportAndStateFacts['invert-explanation'] = await page.evaluate(() => {
    const details = document.querySelector('.lx-transfer-panel__scope-actions')
    const panelHeader = details?.closest('.lx-transfer-panel__header')
    const description = details?.querySelector(
      '.lx-transfer-panel__scope-action-description',
    )
    const button = details?.querySelector('button')
    const box = (element) => {
      if (!element) return null
      const { x, y, width, height, right, bottom } =
        element.getBoundingClientRect()
      return { x, y, width, height, right, bottom }
    }
    return {
      expanded: details?.open ?? false,
      header: box(panelHeader),
      details: box(details),
      description: box(description),
      action: box(button),
      descriptionText: description?.textContent?.trim() ?? null,
      treeViewport: box(document.querySelector('.lx-transfer-panel__tree')),
      headerActions: box(panelHeader?.querySelector('.lx-transfer-panel__header-actions')),
      filter: box(document.querySelector('.lx-transfer-panel__filter--source')),
    }
  })
  await screenshot('03-invert-explanation-expanded')
  await scopeDetails.locator('summary').click()

  const selectedList = page.locator('.lx-transfer-panel__selected')
  const disclosureSummaries = page.locator(
    '.lx-transfer-panel__selected-name-disclosure summary',
  )
  const shortName = page.locator(
    '.lx-transfer-panel__selected-item .lx-transfer-panel__selected-name',
  ).first()
  await selectedList.focus()
  await page.keyboard.press('Tab')
  await page.waitForTimeout(100)
  record.viewportAndStateFacts['keyboard-focus'] = await page.evaluate(() => {
    const active = document.activeElement
    const style = active ? getComputedStyle(active) : null
    return {
      activeTag: active?.tagName ?? null,
      activeText: active?.getAttribute('aria-label') ?? active?.textContent?.trim() ?? null,
      focusVisible: active?.matches(':focus-visible') ?? false,
      outlineStyle: style?.outlineStyle ?? null,
      outlineWidth: style?.outlineWidth ?? null,
      outlineColor: style?.outlineColor ?? null,
      shortNameTabStops: document.querySelectorAll(
        '.lx-transfer-panel__selected-item:not(:has(.lx-transfer-panel__selected-name-disclosure)) .lx-transfer-panel__selected-name-disclosure summary',
      ).length,
    }
  })
  await screenshot('04-keyboard-focus')

  const disclosureCountBeforeExpansion = await disclosureSummaries.count()
  const longDisclosure = disclosureSummaries.last()
  const longNameLabel = await longDisclosure.getAttribute('aria-label')
  await longDisclosure.click()
  await page.waitForTimeout(200)
  record.viewportAndStateFacts['long-name-expanded-desktop'] = await page.evaluate(
    () => {
      const details = document.querySelector(
        '.lx-transfer-panel__selected-name-disclosure[open]',
      )
      const list = document.querySelector('.lx-transfer-panel__selected')
      const fullText = details?.querySelector(
        '.lx-transfer-panel__selected-name-full',
      )
      const box = (element) => {
        if (!element) return null
        const bounds = element.getBoundingClientRect()
        return {
          top: Math.round(bounds.top),
          bottom: Math.round(bounds.bottom),
          height: Math.round(bounds.height),
        }
      }
      const listBounds = list?.getBoundingClientRect()
      const listTop = listBounds ? listBounds.top + list.clientTop : null
      const listBottom = listTop === null ? null : listTop + list.clientHeight
      const fullBounds = fullText?.getBoundingClientRect()
      return {
        expanded: Boolean(details?.open),
        listScrollTop: list?.scrollTop ?? null,
        listClientHeight: list?.clientHeight ?? null,
        listScrollHeight: list?.scrollHeight ?? null,
        listVisibleBounds: { top: listTop, bottom: listBottom },
        disclosure: box(details),
        fullText: box(fullText),
        fullTextFullyInListViewport:
          Boolean(fullBounds && listTop !== null && listBottom !== null) &&
          fullBounds.top >= listTop &&
          fullBounds.bottom <= listBottom,
        fullTextChars: fullText?.textContent?.trim().length ?? 0,
        removeButtonAccessibleName:
          details?.closest('.lx-transfer-panel__selected-item')
            ?.querySelector('button')
            ?.getAttribute('aria-label') ?? null,
      }
    },
  )
  record.viewportAndStateFacts['long-name-expanded-desktop'].label = longNameLabel
  record.viewportAndStateFacts['long-name-expanded-desktop'].disclosureCountBeforeExpansion =
    disclosureCountBeforeExpansion
  record.viewportAndStateFacts['short-name'] = await shortName.evaluate((name) => ({
    text: name.textContent?.trim() ?? '',
    isStaticText: !name.closest('.lx-transfer-panel__selected-name-disclosure'),
    hasOwnTabIndex: name.hasAttribute('tabindex'),
  }))
  await screenshot('05-long-name-expanded-desktop')

  const statusButtons = page.locator('[aria-label="宿主数据状态"]')
  const selectedCountBeforeStates = await page
    .locator('[data-testid="selected-count"]')
    .textContent()
  for (const [state, screenshotName] of [
    ['loading', '06-loading-state'],
    ['error', '07-error-state'],
    ['empty', '08-empty-state'],
  ]) {
    await statusButtons.getByRole('button', { name: state === 'loading' ? '加载中' : state === 'error' ? '加载失败' : '空结果' }).click()
    await page.waitForTimeout(120)
    record.viewportAndStateFacts[`${state}-state`] = await page.evaluate(() => {
      const surface = document.querySelector('.transfer-panel-demo__surface')
      const message = document.querySelector('.transfer-panel-demo__message')
      const treeCount = document.querySelector('[data-testid="tree-node-count"]')
      const selected = document.querySelector('[data-testid="selected-count"]')
      return {
        stateMessage: message?.textContent?.trim() ?? null,
        messageRole: message?.getAttribute('role') ?? null,
        surfaceAriaBusy: surface?.getAttribute('aria-busy') ?? null,
        surfaceBlocked: surface?.classList.contains('is-blocked') ?? false,
        panelInert: document.querySelector('.lx-transfer-panel')?.hasAttribute('inert') ?? false,
        treeCount: treeCount?.textContent?.trim() ?? null,
        selectedCount: selected?.textContent?.trim() ?? null,
      }
    })
    await screenshot(screenshotName)
  }
  record.viewportAndStateFacts['selected-count-before-states'] =
    selectedCountBeforeStates?.trim() ?? null

  await statusButtons.getByRole('button', { name: '正常数据' }).click()
  await themeToggle.uncheck().catch(() => undefined)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(250)
  record.viewportAndStateFacts['narrow-light-source'] = await pageFacts()
  await screenshot('09-narrow-light-source')
  await page.getByTestId('mobile-selected-panel').click()
  await page.waitForTimeout(100)
  record.viewportAndStateFacts['narrow-light-selected'] = await pageFacts()
  await screenshot('10-narrow-light-selected')

  await themeToggle.check()
  await page.waitForTimeout(120)
  record.viewportAndStateFacts['narrow-hud-dark-selected'] = await pageFacts()
  await screenshot('11-narrow-hud-dark-selected')
  record.viewportAndStateFacts['narrow-mobile-controls'] = await page.evaluate(() => {
    const switcher = document.querySelector('.lx-transfer-panel__mobile-switch')
    const buttons = [...(switcher?.querySelectorAll('button') ?? [])]
    const list = document.querySelector('.lx-transfer-panel__selected')
    const component = document.querySelector('.lx-transfer-panel')
    return {
      switcherVisible: Boolean(switcher && getComputedStyle(switcher).display !== 'none'),
      switcherButtons: buttons.map((button) => ({
        name: button.getAttribute('aria-label'),
        pressed: button.getAttribute('aria-pressed'),
        height: Math.round(button.getBoundingClientRect().height),
      })),
      componentScrollWidth: component?.scrollWidth ?? null,
      componentClientWidth: component?.clientWidth ?? null,
      selectedListScrollWidth: list?.scrollWidth ?? null,
      selectedListClientWidth: list?.clientWidth ?? null,
      selectedRemoveButtonSize: (() => {
        const button = document.querySelector(
          '.lx-transfer-panel__selected-item button',
        )
        if (!button) return null
        const bounds = button.getBoundingClientRect()
        return {
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
          accessibleName: button.getAttribute('aria-label'),
        }
      })(),
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    }
  })

  const mobileSelectedList = page.locator('.lx-transfer-panel__selected')
  await mobileSelectedList.evaluate((list) => {
    list.scrollTop = list.scrollHeight
  })
  await page.waitForTimeout(120)
  record.viewportAndStateFacts['long-name-wrapped-mobile'] = await page.evaluate(
    () => {
      const names = [...
        document.querySelectorAll('.lx-transfer-panel__selected-name')]
      const name = names.find((element) =>
        element.textContent?.includes('历史授权单位'),
      )
      const row = name?.closest('.lx-transfer-panel__selected-item')
      const list = document.querySelector('.lx-transfer-panel__selected')
      const style = name ? getComputedStyle(name) : null
      const box = (element) => {
        if (!element) return null
        const bounds = element.getBoundingClientRect()
        return {
          top: Math.round(bounds.top),
          bottom: Math.round(bounds.bottom),
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        }
      }
      const nameBounds = name?.getBoundingClientRect()
      const listBounds = list?.getBoundingClientRect()
      const listVisibleTop = listBounds ? listBounds.top + list.clientTop : null
      const listVisibleBottom =
        listVisibleTop === null ? null : listVisibleTop + list.clientHeight
      return {
        textChars: name?.textContent?.trim().length ?? 0,
        hasDisclosure: Boolean(name?.closest('.lx-transfer-panel__selected-name-disclosure')),
        whiteSpace: style?.whiteSpace ?? null,
        overflowWrap: style?.overflowWrap ?? null,
        lineHeight: style?.lineHeight ?? null,
        nameScrollHeight: name?.scrollHeight ?? null,
        nameClientHeight: name?.clientHeight ?? null,
        row: box(row),
        name: box(name),
        listVisibleBounds: {
          top: listVisibleTop,
          bottom: listVisibleBottom,
        },
        nameWithinListViewport:
          Boolean(nameBounds && listVisibleTop !== null && listVisibleBottom !== null) &&
          nameBounds.top >= listVisibleTop &&
          nameBounds.bottom <= listVisibleBottom,
        listScrollTop: list?.scrollTop ?? null,
        listScrollHeight: list?.scrollHeight ?? null,
        listClientHeight: list?.clientHeight ?? null,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      }
    },
  )
  await screenshot('12-narrow-long-name-wrapped')

  const mobileLongDisclosureCount = await page
    .locator('.lx-transfer-panel__selected-name-disclosure summary')
    .count()
  record.viewportAndStateFacts['long-name-wrapped-mobile'].disclosureCount =
    mobileLongDisclosureCount

  await page.emulateMedia({ reducedMotion: 'reduce' })
  record.viewportAndStateFacts['reduced-motion'] = await page.evaluate(() => {
    const panel = document.querySelector('.lx-transfer-panel')
    const candidates = panel ? [...panel.querySelectorAll('*')] : []
    const animated = candidates
      .map((element) => {
        const style = getComputedStyle(element)
        return {
          selector: element.className?.baseVal ?? element.className ?? element.tagName,
          transitionDuration: style.transitionDuration,
          animationName: style.animationName,
          animationDuration: style.animationDuration,
        }
      })
      .filter(
        (style) =>
          style.animationName !== 'none' ||
          style.animationDuration.split(',').some((duration) => parseFloat(duration) > 0) ||
          style.transitionDuration.split(',').some((duration) => parseFloat(duration) > 0),
      )
      .slice(0, 30)
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      animatedDescendants: animated,
      relatedReducedMotionRules: [...document.styleSheets].reduce((rules, sheet) => {
        try {
          const inspect = (cssRules) => {
            for (const rule of cssRules) {
              if (rule.conditionText?.includes('prefers-reduced-motion')) {
                const nested = [...(rule.cssRules ?? [])]
                  .map((nestedRule) => nestedRule.cssText)
                  .filter((text) =>
                    text.includes('lx-transfer-panel') ||
                    text.includes('lx-virtual-tree'),
                  )
                if (nested.length) rules.push(...nested)
              } else if (rule.cssRules) {
                inspect(rule.cssRules)
              }
            }
          }
          inspect(sheet.cssRules)
          return rules
        } catch {
          return rules
        }
      }, []),
    }
  })
  await screenshot('13-narrow-reduced-motion')
} finally {
  record.sourceHashesAfter = hashSources()
  record.sourceSnapshotConsistent = sameObject(
    record.sourceHashesBefore,
    record.sourceHashesAfter,
  )
  record.browserExecutable = executablePath
  writeFileSync(
    path.join(evidenceDir, 'browser-facts.json'),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf8',
  )
  await browser.close()
}

console.log(JSON.stringify(record, null, 2))
