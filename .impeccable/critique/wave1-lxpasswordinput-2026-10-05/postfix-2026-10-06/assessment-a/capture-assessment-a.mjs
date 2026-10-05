import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const requireFromApp = createRequire(
  'F:/work/linkx-admin/other-admin/admin-vue3/package.json',
)
const { chromium } = requireFromApp('@playwright/test')
const outputDir = dirname(fileURLToPath(import.meta.url))
const url = 'http://127.0.0.1:4182/components/lxpasswordinput.html'
const browserExecutable = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await chromium.launch({
  headless: true,
  executablePath: browserExecutable,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: 'light',
})
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.locator('#password-input-demo').waitFor()
await page.waitForTimeout(700)

const viewportEvidence = []
for (const width of [1280, 375, 320]) {
  const viewportContext = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: 'light',
  })
  const viewportPage = await viewportContext.newPage()
  await viewportPage.goto(url, { waitUntil: 'domcontentloaded' })
  await viewportPage.locator('#password-input-demo').waitFor()
  await viewportPage.waitForTimeout(500)
  await viewportPage.evaluate(() => window.scrollTo(0, 0))
  if (width !== 1280) {
    await viewportPage.locator('.password-input-demo').scrollIntoViewIfNeeded()
  }
  const layout = await viewportPage.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    demoWidth: Math.round(
      document.querySelector('.password-input-demo')?.getBoundingClientRect().width ?? 0,
    ),
    advancedSummaryHeight: Math.round(
      document
        .querySelector('.password-input-demo__advanced summary')
        ?.getBoundingClientRect().height ?? 0,
    ),
    eyeToggleHeight: Math.round(
      document
        .querySelector('.password-input-demo__field .lx-password-input__toggle')
        ?.getBoundingClientRect().height ?? 0,
    ),
    actionButtonHeight: Math.round(
      document
        .querySelector('.password-input-demo__actions button')
        ?.getBoundingClientRect().height ?? 0,
    ),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }))
  viewportEvidence.push(layout)
  await viewportPage.screenshot({
    path: resolve(outputDir, `light-${width}.png`),
    fullPage: width === 1280,
  })
  await viewportContext.close()
}

await page.setViewportSize({ width: 1280, height: 900 })
await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('#password-input-demo').waitFor()
await page.locator('.password-input-demo__advanced summary').click()
await page.getByLabel('HUD 深色主题').check()
await page.locator('.password-input-demo').scrollIntoViewIfNeeded()
await page.waitForTimeout(150)
const hudColors = await page.locator('.password-input-demo').evaluate((demo) => {
  const field = demo.querySelector('.lx-password-input')
  const input = demo.querySelector('#password-input-demo')
  return {
    demoBackground: getComputedStyle(demo).backgroundColor,
    demoText: getComputedStyle(demo).color,
    inputBackground: input ? getComputedStyle(input).backgroundColor : null,
    inputText: input ? getComputedStyle(input).color : null,
    inputBorder: field ? getComputedStyle(field).borderColor : null,
    hudClassApplied: demo.classList.contains('lx-theme-hud'),
  }
})
await page.screenshot({ path: resolve(outputDir, 'hud-dark-1280.png') })

await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('#password-input-demo').waitFor()
const maskOnBlurControl = page.getByLabel('离开组件后重新遮罩')
const input = page.locator('#password-input-demo')
const keyboardStates = {}

await maskOnBlurControl.uncheck()
await input.focus()
await page.keyboard.press('Tab')
keyboardStates.defaultNextFocus = await page.evaluate(() => ({
  tag: document.activeElement?.tagName,
  label: document.activeElement?.getAttribute('aria-label'),
}))
await page.keyboard.press('Enter')
keyboardStates.defaultEnterShows = await input.getAttribute('type')
await page.keyboard.press('Space')
keyboardStates.defaultSpaceHides = await input.getAttribute('type')
await page.keyboard.press('Enter')
keyboardStates.defaultBeforeExit = await input.getAttribute('type')
await page.keyboard.press('Tab')
keyboardStates.defaultAfterLeavingComponent = await input.getAttribute('type')
await page.screenshot({ path: resolve(outputDir, 'default-mask-off-after-exit.png') })

await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('#password-input-demo').waitFor()
await page.getByLabel('离开组件后重新遮罩').check()
const maskedInput = page.locator('#password-input-demo')
await maskedInput.focus()
await page.keyboard.press('Tab')
keyboardStates.maskOnBlurNextFocus = await page.evaluate(() => ({
  tag: document.activeElement?.tagName,
  label: document.activeElement?.getAttribute('aria-label'),
}))
await page.keyboard.press('Enter')
keyboardStates.maskOnBlurAfterEnter = await maskedInput.getAttribute('type')
await page.keyboard.press('Shift+Tab')
keyboardStates.maskOnBlurAfterMoveWithinControl = await maskedInput.getAttribute('type')
await page.screenshot({ path: resolve(outputDir, 'mask-on-blur-within-control.png') })
await page.keyboard.press('Tab')
await page.keyboard.press('Tab')
keyboardStates.maskOnBlurAfterLeavingComponent = await maskedInput.getAttribute('type')
keyboardStates.focusAfterLeavingComponent = await page.evaluate(() => ({
  tag: document.activeElement?.tagName,
  id: document.activeElement?.id,
  label: document.activeElement?.getAttribute('aria-label'),
}))
await page.screenshot({ path: resolve(outputDir, 'mask-on-blur-after-exit.png') })

const evidence = {
  target: url,
  browser: 'Chrome via @playwright/test from other-admin/admin-vue3',
  browserExecutable,
  freshContext: true,
  viewports: viewportEvidence,
  hudColors,
  keyboardStates,
  pageErrors,
}
await import('node:fs/promises').then(({ writeFile }) =>
  writeFile(resolve(outputDir, 'browser-evidence.json'), JSON.stringify(evidence, null, 2)),
)
await browser.close()
console.log(JSON.stringify(evidence, null, 2))
