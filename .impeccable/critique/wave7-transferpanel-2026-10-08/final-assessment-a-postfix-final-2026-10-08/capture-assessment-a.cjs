const fs = require('node:fs/promises')
const path = require('node:path')

const { chromium } = require(require.resolve('@playwright/test', {
  paths: [path.resolve('other-admin/admin-vue3')],
}))

const artifactDir = __dirname
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
const longNameSnippet = '历史授权单位（记录中）'

async function waitForPanel(page) {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.lx-transfer-panel').waitFor({
    state: 'visible',
    timeout: 30000,
  })
  await page.waitForTimeout(500)
}

async function capturePreview(page, name) {
  await page.locator('.transfer-panel-demo__preview').screenshot({
    path: path.join(artifactDir, name),
  })
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  })
  const evidence = {
    targetUrl,
    screenshots: [],
    observations: {},
    pageErrors: [],
  }

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    })
    const desktop = await desktopContext.newPage()
    desktop.on('pageerror', (error) => evidence.pageErrors.push(error.message))
    await waitForPanel(desktop)
    await capturePreview(desktop, 'desktop-light.png')
    evidence.screenshots.push('desktop-light.png')

    await desktop.locator('.lx-transfer-panel__scope-actions > summary').click()
    await capturePreview(desktop, 'desktop-invert-disclosure-open.png')
    evidence.screenshots.push('desktop-invert-disclosure-open.png')

    const longNameDisclosure = desktop
      .locator('.lx-transfer-panel__selected-name-disclosure')
      .filter({ hasText: longNameSnippet })
      .locator('summary')
    evidence.observations.desktopLongNameDisclosureCount = await longNameDisclosure.count()
    if (evidence.observations.desktopLongNameDisclosureCount === 1) {
      await longNameDisclosure.focus()
      await longNameDisclosure.press('Enter')
      await desktop.waitForTimeout(100)
      evidence.observations.desktopLongNameExpanded = await longNameDisclosure.getAttribute('aria-expanded')
      await capturePreview(desktop, 'desktop-long-name-keyboard-expanded.png')
      evidence.screenshots.push('desktop-long-name-keyboard-expanded.png')
      await longNameDisclosure.press('Space')
      await desktop.waitForTimeout(100)
      evidence.observations.desktopLongNameCollapsed = await longNameDisclosure.getAttribute('aria-expanded')
      await capturePreview(desktop, 'desktop-long-name-keyboard-collapsed.png')
      evidence.screenshots.push('desktop-long-name-keyboard-collapsed.png')
    }

    const settings = desktop.locator('.transfer-panel-demo__settings')
    await desktop.locator('.lx-transfer-panel__scope-actions > summary').click()
    await settings.locator('summary').click()
    await settings
      .locator('.transfer-panel-demo__toolbar-group[aria-label="示例参数"] label')
      .filter({ hasText: 'HUD 深色主题' })
      .locator('input')
      .check()
    await capturePreview(desktop, 'desktop-hud.png')
    evidence.screenshots.push('desktop-hud.png')
    await desktopContext.close()

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      isMobile: true,
      hasTouch: true,
    })
    const mobile = await mobileContext.newPage()
    mobile.on('pageerror', (error) => evidence.pageErrors.push(error.message))
    await waitForPanel(mobile)
    await capturePreview(mobile, 'mobile-375-source.png')
    evidence.screenshots.push('mobile-375-source.png')
    await mobile.locator('[data-testid="mobile-selected-panel"]').click()
    await capturePreview(mobile, 'mobile-375-selected.png')
    evidence.screenshots.push('mobile-375-selected.png')

    const mobileLongNameDisclosure = mobile
      .locator('.lx-transfer-panel__selected-name-disclosure')
      .filter({ hasText: longNameSnippet })
      .locator('summary')
    evidence.observations.mobileLongNameDisclosureCount = await mobileLongNameDisclosure.count()
    if (evidence.observations.mobileLongNameDisclosureCount === 1) {
      const name = mobileLongNameDisclosure.locator('.lx-transfer-panel__selected-name')
      evidence.observations.mobileLongNameBefore = await name.evaluate((element) => ({
        lineClamp: getComputedStyle(element).webkitLineClamp,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        text: element.textContent.trim(),
      }))
      await mobileLongNameDisclosure.focus()
      await mobileLongNameDisclosure.press('Enter')
      await mobile.waitForTimeout(100)
      evidence.observations.mobileLongNameExpanded = await mobileLongNameDisclosure.getAttribute('aria-expanded')
      await capturePreview(mobile, 'mobile-375-long-name-keyboard-expanded.png')
      evidence.screenshots.push('mobile-375-long-name-keyboard-expanded.png')
      evidence.observations.mobileExpandedNameGeometry = await mobile.evaluate(() => {
        const rectOf = (element) => {
          const rect = element.getBoundingClientRect()
          return {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height),
          }
        }
        const disclosure = document.querySelector(
          '.lx-transfer-panel__selected-name-disclosure[open]',
        )
        const list = document.querySelector('.lx-transfer-panel__selected')
        const hint = document.querySelector('.lx-transfer-panel__selected-scroll-hint')
        const fullName = disclosure?.querySelector('.lx-transfer-panel__selected-name-full')
        const listRect = list?.getBoundingClientRect()
        const nameRect = fullName?.getBoundingClientRect()
        return {
          list: list ? rectOf(list) : null,
          fullName: fullName ? rectOf(fullName) : null,
          hint: hint ? rectOf(hint) : null,
          clippedAtListBottom: Boolean(listRect && nameRect && nameRect.bottom > listRect.bottom),
          scrollTop: list?.scrollTop ?? null,
          scrollHeight: list?.scrollHeight ?? null,
          clientHeight: list?.clientHeight ?? null,
        }
      })
      const clippedPixels = Math.max(
        0,
        evidence.observations.mobileExpandedNameGeometry.fullName.bottom -
          evidence.observations.mobileExpandedNameGeometry.list.bottom,
      )
      if (clippedPixels > 0) {
        await mobile.locator('.lx-transfer-panel__selected').evaluate((list, pixels) => {
          list.scrollTop += pixels
        }, clippedPixels)
        await mobile.waitForTimeout(120)
        await capturePreview(mobile, 'mobile-375-long-name-expanded-scrolled.png')
        evidence.screenshots.push('mobile-375-long-name-expanded-scrolled.png')
        evidence.observations.mobileExpandedNameAfterScroll = await mobile.evaluate(() => {
          const list = document.querySelector('.lx-transfer-panel__selected')
          const name = document.querySelector(
            '.lx-transfer-panel__selected-name-disclosure[open] .lx-transfer-panel__selected-name-full',
          )
          const listBottom = list?.getBoundingClientRect().bottom ?? 0
          const nameBottom = name?.getBoundingClientRect().bottom ?? 0
          return {
            listBottom: Math.round(listBottom),
            nameBottom: Math.round(nameBottom),
            fullyVisible: Boolean(name && nameBottom <= listBottom),
          }
        })
      }
      await mobileLongNameDisclosure.press('Space')
      await mobile.waitForTimeout(100)
      evidence.observations.mobileLongNameCollapsed = await mobileLongNameDisclosure.getAttribute('aria-expanded')
      await capturePreview(mobile, 'mobile-375-long-name-keyboard-collapsed.png')
      evidence.screenshots.push('mobile-375-long-name-keyboard-collapsed.png')
    }

    await mobile.emulateMedia({ reducedMotion: 'reduce' })
    const selectedList = mobile.locator('.lx-transfer-panel__selected')
    await selectedList.focus()
    await mobile.keyboard.press('Tab')
    evidence.observations.keyboardFocus = await mobile.evaluate(() => {
      const active = document.activeElement
      return {
        className: active instanceof HTMLElement ? active.className : '',
        label: active instanceof HTMLElement ? active.getAttribute('aria-label') : null,
        focusVisible: active instanceof HTMLElement && active.matches(':focus-visible'),
        outlineStyle: active instanceof HTMLElement ? getComputedStyle(active).outlineStyle : '',
        outlineWidth: active instanceof HTMLElement ? getComputedStyle(active).outlineWidth : '',
      }
    })
    evidence.observations.reducedMotion = await mobile.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transferPanelTransitions: [...document.querySelectorAll('.lx-transfer-panel *')]
        .filter((element) => {
          const style = getComputedStyle(element)
          return style.transitionDuration !== '0s' || style.animationDuration !== '0s'
        })
        .slice(0, 10)
        .map((element) => ({
          className: element.className,
          transition: getComputedStyle(element).transitionDuration,
          animation: getComputedStyle(element).animationDuration,
        })),
    }))
    await capturePreview(mobile, 'mobile-375-focus-reduced-motion.png')
    evidence.screenshots.push('mobile-375-focus-reduced-motion.png')

    evidence.observations.desktopViewport = { width: 1440, height: 1100 }
    evidence.observations.mobileViewport = { width: 375, height: 812 }
    evidence.observations.pageHorizontalOverflow = await mobile.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      componentScrollWidth: document.querySelector('.lx-transfer-panel')?.scrollWidth,
      componentClientWidth: document.querySelector('.lx-transfer-panel')?.clientWidth,
    }))

    await fs.writeFile(
      path.join(artifactDir, 'browser-observations.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
      'utf8',
    )
    await mobileContext.close()
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
})
