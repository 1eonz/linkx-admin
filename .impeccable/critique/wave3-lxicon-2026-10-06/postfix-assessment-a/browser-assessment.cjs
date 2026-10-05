const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('F:/work/linkx-admin/other-admin/admin-vue3/node_modules/@playwright/test')

const outputDir = __dirname
const targetUrl = 'http://127.0.0.1:4174/components/lxicons.html'
const result = {
  targetUrl,
  browser: 'Chromium via @playwright/test',
  isolatedContext: true,
  measurements: {},
  screenshots: [],
  failures: [],
}

async function saveScreenshot(page, fileName, fullPage = true) {
  const screenshotPath = path.join(outputDir, fileName)
  await page.screenshot({ path: screenshotPath, fullPage })
  result.screenshots.push(fileName)
}

async function readFocus(page) {
  return page.evaluate(() => {
    const active = document.activeElement
    const tile = active?.closest?.('.icon-tile')
    const catalog = active?.closest?.('.icon-catalog')
    return {
      tag: active?.tagName ?? null,
      className: typeof active?.className === 'string' ? active.className : '',
      ariaLabel: active?.getAttribute?.('aria-label') ?? null,
      inCatalog: Boolean(catalog),
      tileName: tile?.querySelector('.icon-tile__name')?.textContent?.trim() ?? null,
      focusVisible: active?.matches?.(':focus-visible') ?? false,
      outline: active ? getComputedStyle(active).outline : null,
    }
  })
}

async function readHudSurface(page) {
  return page.evaluate(() => {
    const colorParts = (color) => {
      const parts = color.match(/[\d.]+/g)?.map(Number)
      if (!parts || parts.length < 3) return null
      return parts.slice(0, 3).map((value) => value / 255)
    }
    const luminance = (color) => {
      const parts = colorParts(color)
      if (!parts) return null
      const channels = parts.map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      )
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    const contrast = (foreground, background) => {
      const foregroundLum = luminance(foreground)
      const backgroundLum = luminance(background)
      if (foregroundLum == null || backgroundLum == null) return null
      const lighter = Math.max(foregroundLum, backgroundLum)
      const darker = Math.min(foregroundLum, backgroundLum)
      return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
    }
    const effectiveBackground = (element) => {
      let current = element
      while (current) {
        const background = getComputedStyle(current).backgroundColor
        if (!background.includes('0, 0, 0, 0') && !background.includes('transparent')) return background
        current = current.parentElement
      }
      return getComputedStyle(document.body).backgroundColor
    }
    const samples = ['.icon-group-title', '.icon-tile__meaning', '.icon-tile__name', '.icon-search']
      .map((selector) => {
        const element = document.querySelector(selector)
        if (!element) return { selector, present: false }
        const foreground = getComputedStyle(element).color
        const background = effectiveBackground(element)
        return { selector, present: true, foreground, background, contrast: contrast(foreground, background) }
      })
    const search = document.querySelector('.icon-search')
    if (search) {
      const foreground = getComputedStyle(search, '::placeholder').color
      const background = effectiveBackground(search)
      samples.push({ selector: '.icon-search::placeholder', present: true, foreground, background, contrast: contrast(foreground, background) })
    }
    const rootStyle = getComputedStyle(document.documentElement)
    const catalog = document.querySelector('.icon-catalog')
    const tile = document.querySelector('.icon-tile')
    return {
      rootClasses: document.documentElement.className,
      hudThemePresent: document.documentElement.classList.contains('lx-theme-hud'),
      pageBackgroundToken: rootStyle.getPropertyValue('--lx-bg-page').trim(),
      cardBackgroundToken: rootStyle.getPropertyValue('--lx-bg-card').trim(),
      textRegularToken: rootStyle.getPropertyValue('--lx-text-regular').trim(),
      catalogBackground: catalog ? getComputedStyle(catalog).backgroundColor : null,
      tileBackground: tile ? getComputedStyle(tile).backgroundColor : null,
      tileBorder: tile ? getComputedStyle(tile).borderColor : null,
      textSamples: samples,
      themeControls: [...document.querySelectorAll('button, [role="switch"]')]
        .filter((element) => !element.closest('.icon-catalog'))
        .map((element) => ({
          tag: element.tagName,
          role: element.getAttribute('role'),
          label: element.getAttribute('aria-label'),
          title: element.getAttribute('title'),
          text: element.innerText?.trim() ?? '',
          className: typeof element.className === 'string' ? element.className : '',
        })),
    }
  })
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'no-preference',
    })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(targetUrl).origin,
    }).catch((error) => result.failures.push(`clipboard permission: ${error.message}`))

    const page = await context.newPage()
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.icon-tile').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(600)

    result.httpStatus = response?.status() ?? null
    result.measurements.initial = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('.icon-tile')]
      const groups = [...document.querySelectorAll('.icon-group-title')].map((item) => item.innerText)
      const hud = document.querySelector('.lx-theme-hud')
      const catalog = document.querySelector('.icon-catalog')
      const style = hud ? getComputedStyle(hud) : null
      return {
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        iconTileCount: tiles.length,
        iconNames: tiles.map((tile) => tile.querySelector('.icon-tile__name')?.textContent?.trim()),
        animatedIconCount: document.querySelectorAll('.icon-tile .lx-icon[data-lx-motion]').length,
        staticIconCount: document.querySelectorAll('.icon-tile .lx-icon:not([data-lx-motion])').length,
        groupHeadings: groups,
        hudThemePresent: Boolean(hud),
        hudBackground: style?.backgroundColor ?? null,
        hudVariables: hud ? {
          page: style.getPropertyValue('--lx-bg-page').trim(),
          card: style.getPropertyValue('--lx-bg-card').trim(),
          text: style.getPropertyValue('--lx-text-regular').trim(),
          border: style.getPropertyValue('--lx-border').trim(),
        } : null,
        catalogBounds: catalog ? catalog.getBoundingClientRect().toJSON() : null,
        documentWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }
    })
    await saveScreenshot(page, 'desktop-default.png')

    await page.evaluate(() => document.documentElement.classList.add('lx-theme-hud'))
    await page.waitForTimeout(100)
    result.measurements.hudSurface = await readHudSurface(page)
    await saveScreenshot(page, 'desktop-hud.png')
    await page.locator('.icon-search').fill('工作台')
    await page.waitForTimeout(150)
    result.measurements.hudSemanticSearch = await page.evaluate(() => ({
      resultCount: document.querySelectorAll('.icon-tile').length,
      label: document.querySelector('.icon-tile__meaning')?.textContent?.trim() ?? null,
      name: document.querySelector('.icon-tile__name')?.textContent?.trim() ?? null,
    }))
    await saveScreenshot(page, 'desktop-hud-search-workbench.png')
    await page.evaluate(() => document.documentElement.classList.remove('lx-theme-hud'))
    await page.locator('.icon-search').fill('')

    const search = page.locator('.icon-search')
    await search.fill('工作台')
    await page.waitForTimeout(250)
    result.measurements.semanticSearch = await page.evaluate(() => ({
      query: document.querySelector('.icon-search')?.value ?? null,
      resultCount: document.querySelectorAll('.icon-tile').length,
      results: [...document.querySelectorAll('.icon-tile__name')].map((item) => item.textContent.trim()),
      groups: [...document.querySelectorAll('.icon-group-title')].map((item) => item.innerText),
      emptyMessageVisible: Boolean(document.querySelector('.icon-empty')),
    }))
    await saveScreenshot(page, 'desktop-search-workbench.png')

    await search.focus()
    await page.keyboard.press('Tab')
    const focusIntoCatalog = await readFocus(page)
    await page.keyboard.press('Tab')
    const focusAfterCatalog = await readFocus(page)
    await page.keyboard.press('Shift+Tab')
    const focusBackIntoCatalog = await readFocus(page)
    result.measurements.keyboardBoundary = {
      fromSearchToFirstResult: focusIntoCatalog,
      tabPastSingleResult: focusAfterCatalog,
      shiftTabBackToResult: focusBackIntoCatalog,
    }
    await saveScreenshot(page, 'desktop-keyboard-focus.png', false)

    await search.fill('zzzz___no_match_2026')
    await page.waitForTimeout(250)
    result.measurements.emptyState = await page.evaluate(() => ({
      resultCount: document.querySelectorAll('.icon-tile').length,
      emptyText: document.querySelector('.icon-empty')?.textContent?.trim() ?? null,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    await saveScreenshot(page, 'desktop-empty-state.png')

    await search.fill('dashboard')
    const dashboardTile = page.locator('.icon-tile').filter({ hasText: 'dashboard' }).first()
    await dashboardTile.click()
    await page.waitForTimeout(250)
    result.measurements.copyBehavior = await page.evaluate(async () => {
      let clipboardText = null
      let clipboardError = null
      try {
        clipboardText = await navigator.clipboard.readText()
      } catch (error) {
        clipboardError = error instanceof Error ? error.message : String(error)
      }
      const messages = [...document.querySelectorAll('.el-message, [role="alert"], [role="status"]')]
        .map((item) => item.innerText.trim())
        .filter(Boolean)
      return { clipboardText, clipboardError, messages, bodyTail: document.body.innerText.slice(-240) }
    })
    await saveScreenshot(page, 'desktop-copy-feedback.png', false)

    const motionStyles = async (name) => page.evaluate((iconName) => {
      const element = document.querySelector(`.icon-tile .lx-icon[data-icon-name="${iconName}"]`)
      return element ? {
        animationName: getComputedStyle(element).animationName,
        transitionDuration: getComputedStyle(element).transitionDuration,
        transform: getComputedStyle(element).transform,
      } : null
    }, name)
    await search.fill('delete')
    await page.mouse.move(0, 0)
    const deleteTile = page.locator('.icon-tile').first()
    await deleteTile.hover()
    const deleteHovered = await motionStyles('delete')

    await search.fill('dashboard')
    await page.mouse.move(0, 0)
    const dashboardMotionTile = page.locator('.icon-tile').first()
    await dashboardMotionTile.hover()
    const dashboardHovered = await motionStyles('dashboard')

    await search.fill('loading')
    await page.mouse.move(0, 0)
    const loadingIdle = await motionStyles('loading')
    await page.locator('.icon-tile').first().hover()
    const loadingHovered = await motionStyles('loading')
    result.measurements.motion = {
      initialAnimatedIconCount: result.measurements.initial.animatedIconCount,
      initialStaticIconCount: result.measurements.initial.staticIconCount,
      deleteHovered,
      staticDashboardHovered: dashboardHovered,
      loadingIdle,
      loadingHovered,
    }

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.move(0, 0)
    await page.locator('.icon-search').fill('loading')
    await page.locator('.icon-tile').first().hover()
    result.measurements.reducedMotion = await page.evaluate(() => {
      const icon = document.querySelector('.icon-tile .lx-icon')
      const tile = document.querySelector('.icon-tile')
      return {
        mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        iconAnimationName: icon ? getComputedStyle(icon).animationName : null,
        iconTransitionDuration: icon ? getComputedStyle(icon).transitionDuration : null,
        iconTransform: icon ? getComputedStyle(icon).transform : null,
        tileTransitionDuration: tile ? getComputedStyle(tile).transitionDuration : null,
      }
    })
    await saveScreenshot(page, 'desktop-reduced-motion.png', false)

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.locator('.icon-tile').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(200)
    result.measurements.mobile375 = await page.evaluate(() => ({
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      catalogWidth: document.querySelector('.icon-catalog')?.getBoundingClientRect().width ?? null,
      searchWidth: document.querySelector('.icon-search')?.getBoundingClientRect().width ?? null,
      tileCount: document.querySelectorAll('.icon-tile').length,
      gridColumns: getComputedStyle(document.querySelector('.icon-grid')).gridTemplateColumns,
      smallestTileWidth: Math.min(...[...document.querySelectorAll('.icon-tile')].map((item) => item.getBoundingClientRect().width)),
    }))
    await saveScreenshot(page, 'mobile-375-default.png')

    result.pageErrors = pageErrors
    await context.close()
  } finally {
    await browser.close()
  }
  await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

main().catch(async (error) => {
  result.failures.push(error instanceof Error ? error.stack ?? error.message : String(error))
  await fs.writeFile(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  process.exitCode = 1
})
