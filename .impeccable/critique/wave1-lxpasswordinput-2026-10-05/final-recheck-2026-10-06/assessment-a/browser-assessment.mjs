import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../../../other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs'

const outputDir = fileURLToPath(new URL('.', import.meta.url))
await mkdir(outputDir, { recursive: true })

const cdpEndpoint = process.env.ASSESSMENT_CDP_ENDPOINT ?? 'http://127.0.0.1:41991'
const browser = await chromium.connectOverCDP(cdpEndpoint)
const context = browser.contexts()[0]
await Promise.all(context.pages().map((existingPage) => existingPage.close()))
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
await page.setViewportSize({ width: 1280, height: 960 })
await page.goto('http://127.0.0.1:4182/components/lxpasswordinput', {
  waitUntil: 'networkidle',
})
await page.locator('.password-input-demo').waitFor()
await page.evaluate(() => document.fonts.ready)

const desktopLight = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.innerText,
  viewport: { width: innerWidth, height: innerHeight },
  document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
  main: (() => {
    const rect = document.querySelector('.VPDoc .container')?.getBoundingClientRect()
    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
  })(),
  sidebarVisible: Boolean(document.querySelector('.VPSidebar')?.getBoundingClientRect().width),
  headings: [...document.querySelectorAll('.VPDoc h2, .VPDoc h3')].map((heading) => heading.innerText),
  localAnchors: [...document.querySelectorAll('.VPDocAsideOutline a[href^="#"]')].map((link) => ({
    text: link.innerText.trim(),
    href: link.getAttribute('href'),
    visible: Boolean(link.getBoundingClientRect().width && link.getBoundingClientRect().height),
  })),
}))

await page.screenshot({ path: join(outputDir, '01-desktop-light-full.png'), fullPage: true })

const appearanceButton = page.locator('button.VPSwitchAppearance')
await appearanceButton.first().click()
await page.waitForTimeout(250)
const desktopDark = await page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  bodyBackground: getComputedStyle(document.body).backgroundColor,
  pageBackground: getComputedStyle(document.querySelector('.VPDoc')).backgroundColor,
  textColor: getComputedStyle(document.querySelector('.VPDoc .content')).color,
}))
await page.screenshot({ path: join(outputDir, '02-desktop-dark-full.png'), fullPage: true })
await appearanceButton.first().click()
await page.waitForTimeout(250)

const primaryInput = page.locator('#password-input-demo')
const primaryToggle = page.getByRole('button', { name: '显示密码' }).first()
const interaction = {
  initialType: await primaryInput.getAttribute('type'),
  toggle: {},
  maskOnBlur: {},
  clear: {},
  readOnly: {},
  disabled: {},
  status: {},
}
await primaryToggle.click()
interaction.toggle.afterRevealType = await primaryInput.getAttribute('type')
interaction.toggle.pressed = await page.getByRole('button', { name: '隐藏密码' }).first().getAttribute('aria-pressed')
await page.getByRole('button', { name: '隐藏密码' }).first().focus()
await page.keyboard.press('Space')
interaction.toggle.afterSpaceType = await primaryInput.getAttribute('type')
await page.keyboard.press('Enter')
interaction.toggle.afterEnterType = await primaryInput.getAttribute('type')
await page.getByRole('button', { name: '移除焦点' }).click()
interaction.maskOnBlur.afterLeaveType = await primaryInput.getAttribute('type')
interaction.maskOnBlur.ariaLabelAfterLeave = await page.getByRole('button', { name: '显示密码' }).first().getAttribute('aria-label')

await primaryInput.fill('Assessment-Password')
await primaryInput.hover()
const clearButton = page.locator('#password-input-demo').locator('xpath=..').locator('.el-input__clear')
if (await clearButton.count()) {
  await clearButton.click()
}
interaction.clear.value = await primaryInput.inputValue()
interaction.clear.status = await page.locator('[data-testid="last-action"]').innerText()

interaction.readOnly = {
  readonly: await page.locator('#password-input-readonly').getAttribute('readonly'),
  type: await page.locator('#password-input-readonly').getAttribute('type'),
}
interaction.disabled = {
  disabled: await page.locator('#password-input-disabled').getAttribute('disabled'),
  toggleDisabled: await page.locator('#password-input-disabled').locator('xpath=..').locator('button.lx-password-input__toggle').isDisabled(),
}
interaction.status.liveRegion = await page.locator('[data-testid="last-action"]').getAttribute('aria-live')

await page.setViewportSize({ width: 320, height: 844 })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(200)

const mobileTop = await page.evaluate(() => {
  const rect = (element) => {
    const box = element.getBoundingClientRect()
    return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
  }
  return {
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    toolbarTargets: [...document.querySelectorAll('.password-input-demo__toolbar label')].map((label) => ({
      text: label.innerText.trim().replace(/\s+/g, ' '),
      rect: rect(label),
      checkbox: label.querySelector('input[type="checkbox"]') ? rect(label.querySelector('input[type="checkbox"]')) : null,
      select: label.querySelector('select') ? rect(label.querySelector('select')) : null,
    })),
    toggleTarget: rect(document.querySelector('.lx-password-input__toggle')),
    actionTargets: [...document.querySelectorAll('.password-input-demo__actions button')].map((button) => ({
      text: button.innerText.trim(), rect: rect(button),
    })),
    anchorControls: [...document.querySelectorAll('.VPDocAsideOutline a[href^="#"], .VPDocAsideOutline button, .VPDocAsideOutline select')].map((control) => ({
      tag: control.tagName,
      text: control.innerText.trim(),
      href: control.getAttribute('href'),
      ariaLabel: control.getAttribute('aria-label'),
      rect: rect(control),
      visible: Boolean(control.getBoundingClientRect().width && control.getBoundingClientRect().height),
    })),
  }
})
await page.screenshot({ path: join(outputDir, '03-mobile-320-top.png'), fullPage: false })

const advanced = page.locator('.password-input-demo__advanced')
await advanced.locator('summary').click()
const advancedMobile = await page.evaluate(() => {
  const rect = (element) => {
    const box = element.getBoundingClientRect()
    return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
  }
  const details = document.querySelector('.password-input-demo__advanced')
  const icon = details.querySelector('.password-input-demo__advanced-icon')
  const toggle = document.querySelector('.lx-password-input__toggle')
  return {
    open: details.open,
    labels: [...details.querySelectorAll('.password-input-demo__advanced-controls label')].map((label) => ({
      text: label.innerText.trim(),
      rect: rect(label),
      checkbox: rect(label.querySelector('input[type="checkbox"]')),
    })),
    summary: rect(details.querySelector('summary')),
    reducedMotion: {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      iconTransitionDuration: getComputedStyle(icon).transitionDuration,
      demoScrollBehavior: getComputedStyle(document.querySelector('.password-input-demo')).scrollBehavior,
      inputToggleTransitionDuration: getComputedStyle(toggle).transitionDuration,
    },
  }
})

const mobileLocalNavButton = page.getByRole('button', { name: /on this page/i }).first()
const mobileLocalNav = {
  buttonFound: await mobileLocalNavButton.count() > 0,
  buttonVisible: await mobileLocalNavButton.isVisible().catch(() => false),
  opened: false,
  visibleAnchors: [],
}
if (mobileLocalNav.buttonVisible) {
  await mobileLocalNavButton.click()
  await page.waitForTimeout(150)
  mobileLocalNav.opened = true
  mobileLocalNav.visibleAnchors = await page.locator('a[href^="#"]:visible').evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect()
    return {
      text: link.innerText.trim(),
      href: link.getAttribute('href'),
      rect: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
    }
  }))
  await page.screenshot({ path: join(outputDir, '04-mobile-320-localnav-open.png'), fullPage: false })
}

const anchorCandidates = await page.locator('.VPDocAsideOutline a[href^="#"]').evaluateAll((links) => links.map((link) => ({
  text: link.innerText.trim(),
  href: link.getAttribute('href'),
  visible: Boolean(link.getBoundingClientRect().width && link.getBoundingClientRect().height),
})))
let anchorNavigation = { candidates: anchorCandidates, clicked: null, hash: null, targetY: null, scrollY: null }
const visibleAnchor = page.locator('a[href="#props"]').filter({ hasText: 'Props' }).first()
if (await visibleAnchor.count()) {
  if (await visibleAnchor.isVisible()) await visibleAnchor.click()
  await page.waitForTimeout(350)
  anchorNavigation = {
    candidates: anchorCandidates,
    clicked: await visibleAnchor.innerText(),
    hash: await page.evaluate(() => location.hash),
    targetY: await page.locator('#props').evaluate((element) => Math.round(element.getBoundingClientRect().y)),
    scrollY: await page.evaluate(() => Math.round(scrollY)),
  }
}
await page.screenshot({ path: join(outputDir, '05-mobile-320-after-anchor.png'), fullPage: false })
await page.screenshot({ path: join(outputDir, '06-mobile-320-full.png'), fullPage: true })

const results = {
  target: 'http://127.0.0.1:4182/components/lxpasswordinput',
  browser: await browser.version(),
  context: `Fresh system Chrome process with isolated temporary profile at ${cdpEndpoint}; new Playwright page`,
  desktopLight,
  desktopDark,
  interaction,
  mobileTop,
  advancedMobile,
  mobileLocalNav,
  anchorNavigation,
  pageErrors,
  screenshots: [
    '01-desktop-light-full.png',
    '02-desktop-dark-full.png',
    '03-mobile-320-top.png',
    '04-mobile-320-localnav-open.png',
    '05-mobile-320-after-anchor.png',
    '06-mobile-320-full.png',
  ],
}
await writeFile(join(outputDir, 'browser-evidence.json'), `${JSON.stringify(results, null, 2)}\n`)
console.log(JSON.stringify(results, null, 2))
} finally {
  await page.close()
await browser.close()
}
