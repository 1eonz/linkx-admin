import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const target = 'http://127.0.0.1:4174/components/lxicons.html'
const evidence = { target, capturedAt: new Date().toISOString(), screenshots: {}, views: {}, interactions: {}, browserErrors: [] }

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(target).origin })

  const attachErrors = (page) => {
    page.on('pageerror', (error) => evidence.browserErrors.push({ type: 'pageerror', message: error.message, stack: error.stack }))
    page.on('console', (message) => {
      if (message.type() === 'error') evidence.browserErrors.push({
        type: 'console',
        message: message.text(),
        location: message.location(),
      })
    })
  }

  const setAppearance = (page, appearance) => page.addInitScript(
    (value) => localStorage.setItem('vitepress-theme-appearance', value),
    appearance,
  )

  const inspect = async (page) => page.evaluate(() => {
    const catalog = document.querySelector('.icon-catalog')
    const input = document.querySelector('.icon-search')
    const groups = [...document.querySelectorAll('.icon-group')]
    const tiles = [...document.querySelectorAll('.icon-tile')]
    return {
      title: document.title,
      heading: document.querySelector('h1')?.innerText ?? null,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      catalogWidth: catalog?.getBoundingClientRect().width ?? null,
      searchBounds: input ? {
        top: Math.round(input.getBoundingClientRect().top),
        height: Math.round(input.getBoundingClientRect().height),
        sticky: getComputedStyle(input.parentElement).position,
      } : null,
      firstGroupTop: Math.round(groups[0]?.querySelector('summary')?.getBoundingClientRect().top ?? -1),
      searchLabel: input?.getAttribute('aria-label') ?? null,
      searchPlaceholder: input?.getAttribute('placeholder') ?? null,
      groupCount: groups.length,
      openGroups: groups.filter((group) => group.open).length,
      groupLabels: groups.map((group) => group.querySelector('summary')?.innerText.trim()),
      tileCount: tiles.length,
      localizedTileLabelCount: tiles.filter((tile) => /[\u4e00-\u9fff]/.test(tile.getAttribute('aria-label') ?? '')).length,
      firstTileLabel: tiles[0]?.getAttribute('aria-label') ?? null,
      emptyMessage: document.querySelector('.icon-empty')?.innerText ?? null,
    }
  })

  const desktop = await context.newPage()
  attachErrors(desktop)
  await setAppearance(desktop, 'light')
  await desktop.goto(target, { waitUntil: 'networkidle' })
  await desktop.locator('.icon-catalog').waitFor()
  evidence.views.desktopLight = await inspect(desktop)
  await desktop.screenshot({ path: path.join(outputDir, 'desktop-light-initial.png') })
  evidence.screenshots.desktopLight = path.join(outputDir, 'desktop-light-initial.png')

  const desktopFirstSummary = desktop.locator('.icon-group summary').first()
  await desktopFirstSummary.click()
  evidence.interactions.mouseDisclosure = {
    firstGroupOpenAfterClick: await desktop.locator('.icon-group').first().evaluate((element) => element.open),
  }
  await desktop.screenshot({ path: path.join(outputDir, 'desktop-light-group-open.png') })
  evidence.screenshots.desktopLightGroupOpen = path.join(outputDir, 'desktop-light-group-open.png')

  await desktop.locator('.icon-group summary').nth(1).focus()
  await desktop.keyboard.press('Enter')
  evidence.interactions.keyboardDisclosure = {
    secondGroupOpenAfterEnter: await desktop.locator('.icon-group').nth(1).evaluate((element) => element.open),
  }
  await desktop.locator('.icon-search').fill('仪表盘')
  await desktop.getByRole('button', { name: /复制 dashboard/ }).click()
  await desktop.locator('.el-message--success').waitFor()
  evidence.interactions.clipboardSuccess = {
    copiedText: await desktop.evaluate(() => navigator.clipboard.readText()),
    feedback: await desktop.locator('.el-message--success').innerText(),
  }
  await desktop.screenshot({ path: path.join(outputDir, 'desktop-light-copy-success.png') })
  evidence.screenshots.desktopCopySuccess = path.join(outputDir, 'desktop-light-copy-success.png')

  const desktopDark = await context.newPage()
  attachErrors(desktopDark)
  await setAppearance(desktopDark, 'dark')
  await desktopDark.goto(target, { waitUntil: 'networkidle' })
  await desktopDark.locator('.icon-catalog').waitFor()
  await desktopDark.locator('.icon-group summary').first().click()
  evidence.views.desktopDark = await inspect(desktopDark)
  evidence.interactions.darkGroupOpen = await desktopDark.locator('.icon-group').first().evaluate((element) => element.open)
  await desktopDark.screenshot({ path: path.join(outputDir, 'desktop-dark.png') })
  evidence.screenshots.desktopDark = path.join(outputDir, 'desktop-dark.png')

  const mobile = await context.newPage()
  await mobile.setViewportSize({ width: 375, height: 812 })
  attachErrors(mobile)
  await setAppearance(mobile, 'light')
  await mobile.goto(target, { waitUntil: 'networkidle' })
  await mobile.locator('.icon-catalog').waitFor()
  evidence.views.mobileLight = await inspect(mobile)
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-375-light.png') })
  evidence.screenshots.mobileLight = path.join(outputDir, 'mobile-375-light.png')

  const mobileDark = await context.newPage()
  await mobileDark.setViewportSize({ width: 375, height: 812 })
  attachErrors(mobileDark)
  await setAppearance(mobileDark, 'dark')
  await mobileDark.goto(target, { waitUntil: 'networkidle' })
  await mobileDark.locator('.icon-catalog').waitFor()
  evidence.views.mobileDark = await inspect(mobileDark)
  await mobileDark.screenshot({ path: path.join(outputDir, 'mobile-375-dark.png') })
  evidence.screenshots.mobileDark = path.join(outputDir, 'mobile-375-dark.png')

  const input = mobile.locator('.icon-search')
  await input.fill('no-match-图标-不存在')
  evidence.views.mobileEmpty = await inspect(mobile)
  evidence.interactions.emptyState = {
    message: await mobile.locator('.icon-empty').innerText(),
    remainingTiles: await mobile.locator('.icon-tile').count(),
    visibleGroups: await mobile.locator('.icon-group').count(),
  }
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-375-empty.png') })
  evidence.screenshots.mobileEmpty = path.join(outputDir, 'mobile-375-empty.png')

  await mobile.getByRole('button', { name: '清除筛选' }).click()
  evidence.interactions.clearSearch = {
    value: await input.inputValue(),
    focusRestored: await input.evaluate((element) => document.activeElement === element),
    tileCountAfterClear: await mobile.locator('.icon-tile').count(),
  }
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-375-clear-restored.png') })
  evidence.screenshots.mobileClearRestored = path.join(outputDir, 'mobile-375-clear-restored.png')

  await input.fill('警报')
  evidence.interactions.chineseSearch = {
    matchingTileLabels: await mobile.locator('.icon-tile').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label'))),
    groupsAutoExpanded: await mobile.locator('.icon-group').evaluateAll((elements) => elements.every((element) => element.open)),
  }
  await mobile.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('forced clipboard failure for assessment') } },
    })
  })
  await mobile.getByRole('button', { name: /复制 alert/ }).click()
  await mobile.locator('.icon-copy-fallback').waitFor()
  evidence.interactions.clipboardFailure = {
    message: await mobile.locator('.icon-copy-fallback[role="alert"]').innerText(),
    selectedText: await mobile.locator('.icon-copy-fallback textarea').evaluate((element) => element.value.slice(element.selectionStart, element.selectionEnd)),
    textareaFocused: await mobile.locator('.icon-copy-fallback textarea').evaluate((element) => document.activeElement === element),
  }
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-375-clipboard-fallback.png') })
  evidence.screenshots.mobileClipboardFallback = path.join(outputDir, 'mobile-375-clipboard-fallback.png')

  const reduced = await context.newPage()
  attachErrors(reduced)
  await setAppearance(reduced, 'light')
  await reduced.emulateMedia({ reducedMotion: 'reduce' })
  await reduced.goto(target, { waitUntil: 'networkidle' })
  await reduced.locator('.icon-catalog').waitFor()
  await reduced.locator('.icon-group summary').first().focus()
  await reduced.keyboard.press('Enter')
  evidence.interactions.reducedMotion = await reduced.evaluate(() => ({
    preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
    tileTransitionDuration: getComputedStyle(document.querySelector('.icon-tile')).transitionDuration,
    disclosureTransitionDuration: getComputedStyle(document.querySelector('.icon-group-title .lx-icon')).transitionDuration,
    disclosureTransform: getComputedStyle(document.querySelector('.icon-group-title .lx-icon')).transform,
  }))

  await writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`)
} finally {
  await browser.close()
}
