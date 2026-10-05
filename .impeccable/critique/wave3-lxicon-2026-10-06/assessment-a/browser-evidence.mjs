import fs from 'node:fs/promises'
import { chromium } from 'file:///F:/work/linkx-admin/other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs'

const url = 'http://127.0.0.1:4174/components/lxicons.html'
const outDir = 'F:/work/linkx-admin/.impeccable/critique/wave3-lxicon-2026-10-06/assessment-a'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const errors = []

async function capturePage(page, name, fullPage = false) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage })
}

async function inspect(page, label) {
  const result = await page.evaluate((view) => {
    const tiles = [...document.querySelectorAll('.icon-tile')]
    const groups = [...document.querySelectorAll('.icon-group-title')]
    const search = document.querySelector('.icon-search')
    const body = document.body
    const first = tiles[0]
    const svg = first?.querySelector('svg')
    const box = (element) => {
      if (!element) return null
      const { x, y, width, height } = element.getBoundingClientRect()
      return { x, y, width, height }
    }
    return {
      view,
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      themeClass: document.documentElement.className,
      background: getComputedStyle(body).backgroundColor,
      iconColor: svg ? getComputedStyle(svg).color : null,
      iconStrokeWidth: svg ? getComputedStyle(svg).strokeWidth : null,
      firstGroupHeadingColor: groups[0] ? getComputedStyle(groups[0]).color : null,
      firstTileBackground: first ? getComputedStyle(first).backgroundColor : null,
      motionTaggedIcons: document.querySelectorAll('.icon-tile svg[data-lx-motion]').length,
      tileCount: tiles.length,
      groupCount: groups.length,
      groups: groups.map((heading) => ({
        title: heading.innerText,
        count: Number((heading.innerText.match(/(?:\(|（)(\d+)(?:\)|）)/) ?? [])[1] ?? 0),
        box: box(heading),
      })),
      search: search ? { placeholder: search.getAttribute('placeholder'), box: box(search), minWidth: getComputedStyle(search).minWidth } : null,
      firstTile: first ? { label: first.getAttribute('aria-label'), box: box(first), text: first.innerText } : null,
      focusTarget: document.activeElement?.className?.toString?.() ?? document.activeElement?.tagName,
    }
  }, label)
  return result
}

const writeJson = async (name, data) => fs.writeFile(`${outDir}/${name}.json`, `${JSON.stringify(data, null, 2)}\n`)

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', text: message.text() })
  })
  page.on('pageerror', (error) => errors.push({ type: 'pageerror', text: error.message }))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push({ type: 'http', status: response.status(), url: response.url() })
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator('.icon-tile').first().waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await capturePage(page, 'desktop-light-full', true)
  await capturePage(page, 'desktop-light-viewport')
  const desktopLight = await inspect(page, 'desktop-light')

  const groupPage = await context.newPage()
  await groupPage.goto(url, { waitUntil: 'networkidle' })
  const groupCaptures = []
  for (const group of [
    { key: 'p0', title: 'P0 高频核心' },
    { key: 'p1', title: 'P1 业务语义' },
    { key: 'p2', title: 'P2 通用补充' },
  ]) {
    const heading = groupPage.locator('.icon-group-title').filter({ hasText: group.title }).first()
    await heading.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY - 120
      window.scrollTo(0, top)
    })
    await groupPage.waitForTimeout(100)
    await capturePage(groupPage, `desktop-light-${group.key}`)
    groupCaptures.push(await heading.evaluate((element) => ({
      title: element.innerText,
      icons: [...element.nextElementSibling.querySelectorAll('.icon-tile')].map((tile) => tile.innerText),
    })))
  }
  await writeJson('desktop-groups', groupCaptures)

  await page.evaluate(() => document.documentElement.classList.add('lx-theme-hud'))
  await page.waitForTimeout(100)
  await capturePage(page, 'desktop-hud-full', true)
  await capturePage(page, 'desktop-hud-viewport')
  const desktopHud = await inspect(page, 'desktop-hud')

  const search = page.locator('.icon-search')
  await search.fill('no-such-icon')
  await page.waitForTimeout(100)
  await capturePage(page, 'desktop-hud-empty-state')
  const emptyState = await page.locator('.icon-empty').innerText()
  await search.fill('')

  const copyPage = await context.newPage()
  await copyPage.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          if (window.__assessmentClipboardFails) throw new Error('Clipboard blocked')
          window.__assessmentClipboardValue = value
        },
      },
    })
  })
  await copyPage.goto(url, { waitUntil: 'networkidle' })
  await copyPage.locator('[aria-label="复制 delete 图标用法"]').click()
  await copyPage.waitForTimeout(100)
  const copySuccess = await copyPage.evaluate(() => ({
    payload: window.__assessmentClipboardValue,
    notices: [...document.querySelectorAll('[role="alert"], [role="status"], .el-message, .lx-message, .el-notification')]
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => element.innerText.trim())
      .filter(Boolean),
  }))
  await capturePage(copyPage, 'desktop-light-copy-success')
  await copyPage.waitForTimeout(3200)
  await copyPage.evaluate(() => { window.__assessmentClipboardFails = true })
  await copyPage.locator('[aria-label="复制 edit 图标用法"]').click()
  await copyPage.waitForTimeout(100)
  const copyFailure = await copyPage.evaluate(() => ({
    notices: [...document.querySelectorAll('[role="alert"], [role="status"], .el-message, .lx-message, .el-notification')]
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => element.innerText.trim())
      .filter(Boolean),
  }))
  await capturePage(copyPage, 'desktop-light-copy-failure')
  await writeJson('copy-feedback', { copySuccess, copyFailure, clipboard: 'in-memory stub; host clipboard untouched' })

  const dashboardTile = page.locator('[aria-label="复制 dashboard 图标用法"]')
  await dashboardTile.hover()
  await page.waitForTimeout(120)
  const dashboardHoverStyle = await dashboardTile.locator('svg').evaluate((svg) => ({
    transform: getComputedStyle(svg).transform,
    animationName: getComputedStyle(svg).animationName,
    animationDuration: getComputedStyle(svg).animationDuration,
    filter: getComputedStyle(svg).filter,
  }))
  await capturePage(page, 'desktop-hud-hover-dashboard')

  const deleteTile = page.locator('[aria-label="复制 delete 图标用法"]')
  await deleteTile.hover()
  await page.waitForTimeout(100)
  const deleteHoverStyle = await deleteTile.locator('svg').evaluate((svg) => ({
    transform: getComputedStyle(svg).transform,
    animationName: getComputedStyle(svg).animationName,
    animationDuration: getComputedStyle(svg).animationDuration,
    filter: getComputedStyle(svg).filter,
  }))
  await capturePage(page, 'desktop-hud-hover-delete')
  await writeJson('desktop-hover', {
    dashboard: dashboardHoverStyle,
    delete: deleteHoverStyle,
    motionTaggedIcons: desktopLight.motionTaggedIcons,
    tileCount: desktopLight.tileCount,
  })

  const focusPage = await context.newPage()
  focusPage.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', text: message.text() })
  })
  await focusPage.goto(url, { waitUntil: 'networkidle' })
  await focusPage.locator('.icon-search').focus()
  let focusTabs = 0
  while (focusTabs < 120) {
    await focusPage.keyboard.press('Tab')
    focusTabs += 1
    const label = await focusPage.evaluate(() => document.activeElement?.getAttribute?.('aria-label'))
    if (label === '复制 delete 图标用法') break
  }
  const focusTarget = focusPage.locator('[aria-label="复制 delete 图标用法"]')
  const focusInfo = await focusTarget.evaluate((tile, tabCount) => ({
    focused: tile === document.activeElement,
    focusVisible: tile.matches(':focus-visible'),
    outline: getComputedStyle(tile).outline,
    outlineWidth: getComputedStyle(tile).outlineWidth,
    outlineStyle: getComputedStyle(tile).outlineStyle,
    borderColor: getComputedStyle(tile).borderColor,
    backgroundColor: getComputedStyle(tile).backgroundColor,
    boxShadow: getComputedStyle(tile).boxShadow,
    accessibleName: tile.getAttribute('aria-label'),
    keyboardTabCountFromSearch: tabCount,
  }), focusTabs)
  await capturePage(focusPage, 'desktop-light-keyboard-focus')
  await writeJson('desktop-focus', focusInfo)

  await focusPage.emulateMedia({ reducedMotion: 'reduce' })
  await focusTarget.hover()
  await focusPage.waitForTimeout(100)
  const reducedMotionStyle = await focusTarget.locator('svg').evaluate((svg) => ({
    animationName: getComputedStyle(svg).animationName,
    animationDuration: getComputedStyle(svg).animationDuration,
    transitionDuration: getComputedStyle(svg).transitionDuration,
    transform: getComputedStyle(svg).transform,
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }))
  await capturePage(focusPage, 'desktop-light-reduced-motion-hover')
  await writeJson('desktop-reduced-motion', reducedMotionStyle)

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  })
  const mobilePage = await mobileContext.newPage()
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', text: message.text() })
  })
  mobilePage.on('response', (response) => {
    if (response.status() >= 400) errors.push({ type: 'http', status: response.status(), url: response.url() })
  })
  await mobilePage.goto(url, { waitUntil: 'networkidle' })
  await mobilePage.locator('.icon-tile').first().waitFor()
  await mobilePage.evaluate(() => window.scrollTo(0, 0))
  await capturePage(mobilePage, 'mobile-375-light-full', true)
  await capturePage(mobilePage, 'mobile-375-light-viewport')
  const mobileLight = await inspect(mobilePage, 'mobile-375-light')
  await mobilePage.evaluate(() => document.documentElement.classList.add('lx-theme-hud'))
  await mobilePage.waitForTimeout(100)
  await capturePage(mobilePage, 'mobile-375-hud-full', true)
  await capturePage(mobilePage, 'mobile-375-hud-viewport')
  const mobileHud = await inspect(mobilePage, 'mobile-375-hud')

  await writeJson('browser-summary', {
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    url,
    context: 'Fresh Playwright browser contexts with no inherited cookies or local storage',
    pageErrors: errors,
    desktopLight,
    desktopHud,
    mobileLight,
    mobileHud,
    emptyState,
    copySuccess,
    copyFailure,
    dashboardHoverStyle,
    deleteHoverStyle,
    focusInfo,
    reducedMotionStyle,
  })
  await mobileContext.close()
  await groupPage.close()
  await copyPage.close()
  await context.close()
} finally {
  await browser.close()
}
