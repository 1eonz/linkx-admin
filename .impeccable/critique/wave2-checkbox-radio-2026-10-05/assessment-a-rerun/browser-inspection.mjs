import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(resolve(process.cwd(), 'other-admin/admin-vue3/package.json'))
const { chromium } = require('@playwright/test')
const outputDir = resolve(
  '.impeccable/critique/wave2-checkbox-radio-2026-10-05/assessment-a-rerun/screenshots',
)

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
})
const observations = []

async function openPage(route, viewport = { width: 1440, height: 1000 }, mobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  })
  const page = await context.newPage()
  if (mobile) {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
      configuration: 'mobile',
    })
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'hover', value: 'none' },
        { name: 'pointer', value: 'coarse' },
      ],
    })
  }
  await page.goto(`http://127.0.0.1:4174${route}`, { waitUntil: 'domcontentloaded' })
  const demo = page.locator(route.includes('lxcheckbox') ? '.lx-checkbox-demo' : '.lx-radio-demo')
  await demo.waitFor({ state: 'visible' })
  return { context, page, demo }
}

async function capture(page, demo, name, fullPage = true) {
  await page.screenshot({ path: resolve(outputDir, `${name}.png`), fullPage })
  await demo.screenshot({ path: resolve(outputDir, `${name}-demo.png`) })
}

try {
  const checkboxLight = await openPage('/components/lxcheckbox')
  await capture(checkboxLight.page, checkboxLight.demo, 'checkbox-desktop-light')
  observations.push(await checkboxLight.page.evaluate(() => ({
    view: '复选桌面亮色',
    viewport: `${innerWidth}x${innerHeight}`,
    title: document.title,
    rootClasses: document.documentElement.className,
    summary: document.querySelector('[data-testid="selection-summary"]')?.textContent?.trim(),
    verticalGap: getComputedStyle(document.querySelector('.lx-checkbox-group--vertical')).gap,
    checkBackground: getComputedStyle(document.querySelector('[data-testid="group"] .el-checkbox__inner')).backgroundColor,
  })))
  await checkboxLight.context.close()

  const checkboxHud = await openPage('/components/lxcheckbox')
  await checkboxHud.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await capture(checkboxHud.page, checkboxHud.demo, 'checkbox-desktop-hud')
  observations.push(await checkboxHud.page.evaluate(() => ({
    view: '复选桌面 HUD',
    rootClasses: document.documentElement.className,
    pageBackground: getComputedStyle(document.querySelector('.lx-checkbox-demo')).backgroundColor,
    checkedBackground: getComputedStyle(document.querySelector('[data-testid="group"] .el-checkbox__inner')).backgroundColor,
    disabledBackground: getComputedStyle(document.querySelector('[data-testid="disabled-states"] .el-checkbox__inner')).backgroundColor,
    summary: document.querySelector('[data-testid="selection-summary"]')?.textContent?.trim(),
  })))
  await checkboxHud.context.close()

  const checkboxMobile = await openPage('/components/lxcheckbox', { width: 375, height: 812 }, true)
  await capture(checkboxMobile.page, checkboxMobile.demo, 'checkbox-mobile-375')
  observations.push(await checkboxMobile.page.evaluate(() => {
    const option = document.querySelector('[data-testid="group"] .el-checkbox')
    const toggle = document.querySelector('.lx-checkbox-demo__theme-toggle')
    const rect = (element) => {
      const box = element.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height) }
    }
    return {
      view: '复选 375px 触屏',
      viewport: `${innerWidth}x${innerHeight}`,
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      optionTarget: rect(option),
      themeTarget: rect(toggle),
    }
  }))
  await checkboxMobile.context.close()

  const checkboxKeyboard = await openPage('/components/lxcheckbox')
  await checkboxKeyboard.page.getByRole('checkbox', { name: 'HUD 深色主题' }).focus()
  await checkboxKeyboard.page.keyboard.press('Tab')
  const checkboxFocus = await checkboxKeyboard.page.evaluate(() => ({
    view: '复选键盘焦点',
    activeLabel: document.activeElement?.closest('label')?.textContent?.trim(),
    focusVisible: document.activeElement?.matches(':focus-visible'),
    focusRing: getComputedStyle(document.activeElement?.closest('label')).outlineStyle,
    innerBoxShadow: getComputedStyle(document.activeElement?.closest('label')?.querySelector('.el-checkbox__inner')).boxShadow,
  }))
  await capture(checkboxKeyboard.page, checkboxKeyboard.demo, 'checkbox-keyboard-focus')
  observations.push(checkboxFocus)
  await checkboxKeyboard.context.close()

  const radioLight = await openPage('/components/lxradio')
  await capture(radioLight.page, radioLight.demo, 'radio-desktop-light')
  observations.push(await radioLight.page.evaluate(() => ({
    view: '单选桌面亮色',
    viewport: `${innerWidth}x${innerHeight}`,
    title: document.title,
    rootClasses: document.documentElement.className,
    horizontalGap: getComputedStyle(document.querySelector('.lx-radio-group')).gap,
    selectedRingBackground: getComputedStyle(document.querySelector('.el-radio__input.is-checked .el-radio__inner')).backgroundColor,
    selectedRingCenter: getComputedStyle(document.querySelector('.el-radio__input.is-checked .el-radio__inner'), '::after').backgroundColor,
  })))
  await radioLight.context.close()

  const radioHud = await openPage('/components/lxradio')
  await radioHud.page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
  await capture(radioHud.page, radioHud.demo, 'radio-desktop-hud')
  observations.push(await radioHud.page.evaluate(() => ({
    view: '单选桌面 HUD',
    rootClasses: document.documentElement.className,
    pageBackground: getComputedStyle(document.querySelector('.lx-radio-demo')).backgroundColor,
    selectedRingBackground: getComputedStyle(document.querySelector('.el-radio__input.is-checked .el-radio__inner')).backgroundColor,
    selectedRingCenter: getComputedStyle(document.querySelector('.el-radio__input.is-checked .el-radio__inner'), '::after').backgroundColor,
    disabledColor: getComputedStyle(document.querySelector('[data-testid="vertical"] .el-radio.is-disabled .el-radio__label')).color,
  })))
  await radioHud.context.close()

  const radioMobile = await openPage('/components/lxradio', { width: 375, height: 812 }, true)
  await capture(radioMobile.page, radioMobile.demo, 'radio-mobile-375')
  observations.push(await radioMobile.page.evaluate(() => {
    const option = document.querySelector('[data-testid="horizontal"] .el-radio')
    const toggle = document.querySelector('.lx-radio-demo__theme-toggle')
    const rect = (element) => {
      const box = element.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height) }
    }
    return {
      view: '单选 375px 触屏',
      viewport: `${innerWidth}x${innerHeight}`,
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      optionTarget: rect(option),
      themeTarget: rect(toggle),
    }
  }))
  await radioMobile.context.close()

  const radioKeyboard = await openPage('/components/lxradio')
  const themeToggle = radioKeyboard.page.getByRole('checkbox', { name: 'HUD 深色主题' })
  await themeToggle.focus()
  await radioKeyboard.page.keyboard.press('Tab')
  const radioFocusBefore = await radioKeyboard.page.evaluate(() => ({
    view: '单选键盘焦点',
    activeLabel: document.activeElement?.closest('label')?.textContent?.trim(),
    focusVisible: document.activeElement?.matches(':focus-visible'),
    outlineStyle: getComputedStyle(document.querySelector('.el-radio__inner')).outlineStyle,
  }))
  await radioKeyboard.page.keyboard.press('ArrowRight')
  await capture(radioKeyboard.page, radioKeyboard.demo, 'radio-keyboard-focus')
  radioFocusBefore.selectionAfterArrow = await radioKeyboard.page.getByRole('radio', { name: '应急处突' }).isChecked()
  observations.push(radioFocusBefore)

  const center = radioKeyboard.page.locator('.el-radio__input.is-checked .el-radio__inner').first()
  const fullMotion = await center.evaluate((element) => getComputedStyle(element, '::after').transitionDuration)
  await radioKeyboard.page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedMotion = await center.evaluate((element) => getComputedStyle(element, '::after').transitionDuration)
  await capture(radioKeyboard.page, radioKeyboard.demo, 'radio-reduced-motion')
  observations.push({
    view: '单选减少动效',
    mediaReduceMatches: await radioKeyboard.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    fullMotionTransition: fullMotion,
    reducedMotionTransition: reducedMotion,
  })
  await radioKeyboard.context.close()
} finally {
  await browser.close()
}

console.log(JSON.stringify({ outputDir, observations }, null, 2))
