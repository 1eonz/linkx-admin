import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'

const require = createRequire('F:/work/linkx-admin/other-admin/admin-vue3/package.json')
const { chromium } = require('@playwright/test')
const outputDir = dirname(fileURLToPath(import.meta.url))
const url = 'http://127.0.0.1:4182/components/lxpasswordinput'
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
})
const page = await context.newPage()
const observation = {
  target: url,
  browser: { name: 'Chrome via Playwright Chromium driver', version: browser.version() },
  context: 'new Playwright browser context and page',
  views: {},
  interactions: {},
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
}

page.on('console', (message) => {
  if (message.type() === 'error') {
    observation.consoleErrors.push({ text: message.text(), location: message.location() })
  }
})
page.on('pageerror', (error) => observation.pageErrors.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 400) observation.httpErrors.push({ status: response.status(), url: response.url() })
})

async function waitForSurface() {
  await page.locator('.password-input-demo').waitFor()
  await page.evaluate(() => document.fonts.ready)
}

async function inspect(label, screenshotName) {
  observation.views[label] = await page.evaluate(() => {
    const demo = document.querySelector('.password-input-demo')
    const input = document.querySelector('#password-input-demo')
    const toggle = demo?.querySelector('.lx-password-input__toggle')
    const hint = document.querySelector('.lx-passwordinput-props-hint')
    const table = document.querySelector('.vp-doc table')
    const navCandidates = [...document.querySelectorAll('body *')].map((element) => {
      const { top, bottom, width, height } = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        tag: element.tagName,
        className: typeof element.className === 'string' ? element.className : '',
        rect: { top, bottom, width, height },
        position: style.position,
        display: style.display,
        visibility: style.visibility,
      }
    }).filter((candidate) =>
      ['fixed', 'sticky'].includes(candidate.position) &&
      candidate.rect.top >= -1 &&
      candidate.rect.top < innerHeight &&
      candidate.rect.height > 0 &&
      candidate.rect.width >= innerWidth * 0.8 &&
      candidate.display !== 'none' &&
      candidate.visibility === 'visible',
    )
    const nav = navCandidates
      .sort((a, b) => a.rect.height - b.rect.height)[0]
    const rect = (element) => {
      if (!element) return null
      const { top, right, bottom, left, width, height } = element.getBoundingClientRect()
      return { top, right, bottom, left, width, height }
    }
    const tableAncestors = []
    let ancestor = table
    for (let depth = 0; ancestor && depth < 4; depth += 1, ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      tableAncestors.push({
        tag: ancestor.tagName,
        className: typeof ancestor.className === 'string' ? ancestor.className : '',
        clientWidth: ancestor.clientWidth,
        scrollWidth: ancestor.scrollWidth,
        overflowX: style.overflowX,
      })
    }
    const active = document.activeElement
    const activeStyle = active ? getComputedStyle(active) : null
    const toggleStyle = toggle ? getComputedStyle(toggle) : null
    return {
      title: document.title,
      pathname: location.pathname,
      viewport: { width: innerWidth, height: innerHeight },
      theme: {
        htmlClass: document.documentElement.className,
        darkClass: document.documentElement.classList.contains('dark'),
        colorSchemePreference: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        bodyBackground: getComputedStyle(document.body).backgroundColor,
      },
      pageWidth: {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      },
      nav: {
        rect: nav?.rect ?? null,
        position: nav?.position ?? null,
        className: nav?.className ?? null,
        candidates: navCandidates,
      },
      parameterHint: hint
        ? {
            text: hint.textContent.trim(),
            display: getComputedStyle(hint).display,
            rect: rect(hint),
          }
        : null,
      table: {
        rect: rect(table),
        ancestors: tableAncestors,
      },
      demo: {
        rect: rect(demo),
        scrollMarginBlockStart: demo ? getComputedStyle(demo).scrollMarginBlockStart : null,
      },
      password: {
        type: input?.getAttribute('type'),
        valuePresent: Boolean(input?.value),
        toggleLabel: toggle?.getAttribute('aria-label'),
        togglePressed: toggle?.getAttribute('aria-pressed'),
      },
      mobileToolbarTargets: innerWidth <= 480
        ? [...document.querySelectorAll('.password-input-demo__toolbar label')].map((label) => {
            const { width, height } = label.getBoundingClientRect()
            return { text: label.textContent.trim(), width, height }
          })
        : [],
      focus: {
        tag: active?.tagName,
        id: active?.id || null,
        className: typeof active?.className === 'string' ? active.className : '',
        outline: activeStyle
          ? {
              style: activeStyle.outlineStyle,
              width: activeStyle.outlineWidth,
              color: activeStyle.outlineColor,
            }
          : null,
        toggleFocusVisible: toggle ? toggle.matches(':focus-visible') : false,
        toggleOutline: toggleStyle
          ? {
              style: toggleStyle.outlineStyle,
              width: toggleStyle.outlineWidth,
              color: toggleStyle.outlineColor,
            }
          : null,
      },
    }
  })
  await page.screenshot({ path: join(outputDir, screenshotName), animations: 'disabled' })
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitForSurface()
  await inspect('desktopLight1280', 'desktop-light-1280.png')

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForSurface()
  await inspect('desktopDark1280', 'desktop-dark-1280.png')

  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForSurface()
  await page.locator('.password-input-demo__advanced summary').click()
  await page.getByLabel('HUD 深色主题').check()
  await inspect('hudLight1280', 'hud-light-1280.png')
  observation.interactions.hud = await page.evaluate(() => ({
    enabled: document.querySelector('.password-input-demo')?.classList.contains('lx-theme-hud'),
    checkboxChecked: document.querySelector('.password-input-demo__advanced-controls input[type="checkbox"]:checked') !== null,
    demoBackground: getComputedStyle(document.querySelector('.password-input-demo')).backgroundColor,
    demoText: getComputedStyle(document.querySelector('.password-input-demo')).color,
  }))
  await page.getByLabel('HUD 深色主题').uncheck()
  await page.locator('.password-input-demo__advanced summary').click()

  await page.setViewportSize({ width: 375, height: 812 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await inspect('mobileLight375', 'mobile-light-375.png')

  await page.setViewportSize({ width: 320, height: 800 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await inspect('mobileLight320Top', 'mobile-light-320-top.png')
  await page.evaluate(() => {
    document.querySelector('.lx-passwordinput-props-hint')?.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await inspect('mobileLight320Props', 'mobile-light-320-props.png')
  observation.interactions.parameterTable = await page.evaluate(() => {
    const hint = document.querySelector('.lx-passwordinput-props-hint')
    const table = document.querySelector('.vp-doc table')
    const candidates = []
    let element = table
    for (let depth = 0; element && depth < 4; depth += 1, element = element.parentElement) {
      candidates.push({
        tag: element.tagName,
        className: typeof element.className === 'string' ? element.className : '',
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: getComputedStyle(element).overflowX,
      })
    }
    const before = table?.scrollLeft ?? 0
    if (table) table.scrollLeft = 100
    return {
      hintVisible: Boolean(hint && getComputedStyle(hint).display !== 'none' && hint.getBoundingClientRect().height > 0),
      hintText: hint?.textContent.trim() ?? null,
      pageHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      tableHorizontalScroll: {
        before,
        after: table?.scrollLeft ?? null,
        max: table ? table.scrollWidth - table.clientWidth : null,
      },
      tableContainers: candidates,
    }
  })
  await inspect('mobileLight320PropsScrolled', 'mobile-light-320-props-scrolled.png')

  await page.goto(`${url}#${encodeURIComponent('交互示例')}`, { waitUntil: 'domcontentloaded' })
  await waitForSurface()
  await inspect('mobileLight320DemoHeadingAnchor', 'mobile-light-320-demo-heading-anchor.png')
  observation.interactions.demoHeadingAnchor = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('.vp-doc h2')]
    const heading = headings.find((element) => element.textContent.includes('交互示例'))
    const nav = [...document.querySelectorAll('body *')]
      .map((element) => ({ element, rect: element.getBoundingClientRect(), position: getComputedStyle(element).position, visibility: getComputedStyle(element).visibility, display: getComputedStyle(element).display }))
      .filter(({ rect, position, visibility, display }) =>
        ['fixed', 'sticky'].includes(position) && rect.top >= -1 && rect.top < innerHeight && rect.height > 0 && rect.width >= innerWidth * 0.8 && visibility === 'visible' && display !== 'none',
      )
      .sort((a, b) => a.rect.height - b.rect.height)[0]
    const headingTop = heading?.getBoundingClientRect().top ?? null
    const navBottom = nav?.rect.bottom ?? null
    return {
      fragment: location.hash,
      headingId: heading?.id ?? null,
      headingTop,
      headingScrollMarginBlockStart: heading ? getComputedStyle(heading).scrollMarginBlockStart : null,
      navBottom,
      gap: headingTop !== null && navBottom !== null ? headingTop - navBottom : null,
      headings: headings.map((element) => ({
        text: element.textContent.trim(),
        id: element.id,
        top: element.getBoundingClientRect().top,
        scrollMarginBlockStart: getComputedStyle(element).scrollMarginBlockStart,
      })),
    }
  })

  await page.evaluate(() => {
    document.querySelector('.password-input-demo')?.scrollIntoView({ block: 'start', behavior: 'instant' })
  })
  await inspect('mobileLight320DemoOffset', 'mobile-light-320-demo-offset.png')
  observation.interactions.demoNavigationOffset = await page.evaluate(() => {
    const demo = document.querySelector('.password-input-demo')
    const nav = [...document.querySelectorAll('body *')]
      .map((element) => ({ element, rect: element.getBoundingClientRect(), position: getComputedStyle(element).position, visibility: getComputedStyle(element).visibility, display: getComputedStyle(element).display }))
      .filter(({ rect, position, visibility, display }) =>
        ['fixed', 'sticky'].includes(position) && rect.top >= -1 && rect.top < innerHeight && rect.height > 0 && rect.width >= innerWidth * 0.8 && visibility === 'visible' && display !== 'none',
      )
      .sort((a, b) => a.rect.height - b.rect.height)[0]
    const demoTop = demo?.getBoundingClientRect().top ?? null
    const navBottom = nav?.rect.bottom ?? null
    return {
      demoTop,
      navBottom,
      gap: demoTop !== null && navBottom !== null ? demoTop - navBottom : null,
      scrollMarginBlockStart: demo ? getComputedStyle(demo).scrollMarginBlockStart : null,
      navPosition: nav?.position ?? null,
      navClassName: nav && typeof nav.element.className === 'string' ? nav.element.className : null,
    }
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const passwordInput = page.locator('#password-input-demo')
  const toggle = page.locator('.password-input-demo__field').first().locator('.lx-password-input__toggle')
  observation.interactions.maskOnBlurInitial = await page.evaluate(() => ({
    type: document.querySelector('#password-input-demo')?.getAttribute('type'),
    maskOnBlurEnabled: document.querySelector('.password-input-demo__toolbar label:nth-of-type(4) input[type="checkbox"]')?.checked,
  }))

  await toggle.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await inspect('keyboardFocusToggle', 'keyboard-focus-toggle-1280.png')
  observation.interactions.keyboardFocus = observation.views.keyboardFocusToggle.focus
  await page.keyboard.press('Space')
  observation.interactions.keyboardReveal = await page.evaluate(() => ({
    inputType: document.querySelector('#password-input-demo')?.getAttribute('type'),
    togglePressed: document.querySelector('.password-input-demo__field .lx-password-input__toggle')?.getAttribute('aria-pressed'),
    focusVisible: document.querySelector('.password-input-demo__field .lx-password-input__toggle')?.matches(':focus-visible'),
  }))
  await page.keyboard.press('Tab')
  observation.interactions.maskOnBlurAfterFocusLeaves = await page.evaluate(() => ({
    inputType: document.querySelector('#password-input-demo')?.getAttribute('type'),
    togglePressed: document.querySelector('.password-input-demo__field .lx-password-input__toggle')?.getAttribute('aria-pressed'),
    activeElement: document.activeElement?.tagName,
    activeElementClass: typeof document.activeElement?.className === 'string' ? document.activeElement.className : '',
  }))

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForSurface()
  await page.locator('.password-input-demo__advanced summary').click()
  await inspect('reducedMotion', 'reduced-motion-1280.png')
  observation.interactions.reducedMotion = await page.evaluate(() => {
    const icon = document.querySelector('.password-input-demo__advanced-icon')
    const toggleButton = document.querySelector('.password-input-demo__field .lx-password-input__toggle')
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      advancedIcon: icon
        ? { transitionDuration: getComputedStyle(icon).transitionDuration, transitionProperty: getComputedStyle(icon).transitionProperty }
        : null,
      passwordToggle: toggleButton
        ? { transitionDuration: getComputedStyle(toggleButton).transitionDuration, transitionProperty: getComputedStyle(toggleButton).transitionProperty }
        : null,
      demoScrollBehavior: getComputedStyle(document.querySelector('.password-input-demo')).scrollBehavior,
    }
  })
} catch (error) {
  observation.error = error.stack || error.message
  process.exitCode = 1
} finally {
  observation.finishedAt = new Date().toISOString()
  await writeFile(join(outputDir, 'browser-observations.json'), `${JSON.stringify(observation, null, 2)}\n`, 'utf8')
  await browser.close()
}
