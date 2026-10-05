import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const outputDirectory = path.dirname(fileURLToPath(import.meta.url))
const playwrightPath = String.raw`F:\work\linkx-admin\other-admin\admin-vue3\node_modules\.pnpm\playwright@1.58.0\node_modules\playwright\index.mjs`
const { chromium } = await import(pathToFileURL(playwrightPath).href)
const baseUrl = 'http://127.0.0.1:4182/components/lxpasswordinput.html'
const browser = await chromium.launch({
  headless: true,
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const observations = []
const screenshots = []
const browserEvents = { pageErrors: [], consoleErrors: [], failedRequests: [], httpErrors: [] }

page.on('pageerror', (error) => browserEvents.pageErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') browserEvents.consoleErrors.push(message.text())
})
page.on('requestfailed', (request) => {
  browserEvents.failedRequests.push({ url: request.url(), error: request.failure()?.errorText })
})
page.on('response', (response) => {
  if (response.status() >= 400) browserEvents.httpErrors.push({ url: response.url(), status: response.status() })
})

async function saveScreenshot(name, fullPage = false) {
  const filePath = path.join(outputDirectory, name)
  await page.screenshot({ path: filePath, fullPage })
  screenshots.push({ file: name, fullPage })
}

async function saveDemoScreenshot(name) {
  const filePath = path.join(outputDirectory, name)
  await page.locator('.password-input-demo').screenshot({ path: filePath })
  screenshots.push({ file: name, target: '.password-input-demo' })
}

async function inspect(label) {
  const evidence = await page.evaluate((snapshotLabel) => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    }
    const demo = document.querySelector('.password-input-demo')
    const mainInput = document.querySelector('#password-input-demo')
    const mainRoot = mainInput?.closest('.lx-password-input__focus-root')
    const toggle = mainRoot?.querySelector('.lx-password-input__toggle')
    const details = document.querySelector('.password-input-demo__advanced')
    const summary = details?.querySelector('summary')
    const advancedIcon = details?.querySelector('.password-input-demo__advanced-icon')
    const labels = [...document.querySelectorAll('.password-input-demo__toolbar label')]
    const advancedLabels = [...document.querySelectorAll('.password-input-demo__advanced-controls label')]
    const tableMetrics = [...document.querySelectorAll('.vp-doc table')].map((table) => ({
      rect: rect(table),
      clientWidth: table.clientWidth,
      scrollWidth: table.scrollWidth,
      parentClientWidth: table.parentElement?.clientWidth ?? null,
    }))
    const distinctLabelLines = new Set(labels.map((label) => Math.round(label.getBoundingClientRect().top)))
    const demoStyle = demo ? getComputedStyle(demo) : null
    const toggleStyle = toggle ? getComputedStyle(toggle) : null
    const iconStyle = advancedIcon ? getComputedStyle(advancedIcon) : null
    const inputState = (selector) => {
      const input = document.querySelector(selector)
      const root = input?.closest('.lx-password-input__focus-root')
      const action = root?.querySelector('.lx-password-input__toggle')
      return {
        type: input?.type ?? null,
        readonly: input?.readOnly ?? null,
        disabled: input?.disabled ?? null,
        focused: document.activeElement === input,
        toggleDisabled: action?.disabled ?? null,
        toggleRect: rect(action),
      }
    }

    return {
      label: snapshotLabel,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      theme: {
        hudEnabled: demo?.classList.contains('lx-theme-hud') ?? false,
        demoBackground: demoStyle?.backgroundColor ?? null,
        demoText: demoStyle?.color ?? null,
      },
      demo: {
        rect: rect(demo),
        clientWidth: demo?.clientWidth ?? null,
        scrollWidth: demo?.scrollWidth ?? null,
        toolbarLabelCount: labels.length,
        toolbarLineCount: distinctLabelLines.size,
        toolbarRect: rect(document.querySelector('.password-input-demo__toolbar')),
        showPasswordEnabled: labels.find((label) => label.textContent?.includes('允许切换明文'))?.querySelector('input')?.checked ?? null,
        maskOnBlurEnabled: labels.find((label) => label.textContent?.includes('离开组件后重新遮罩'))?.querySelector('input')?.checked ?? null,
        preventClipboardEnabled: advancedLabels.find((label) => label.textContent?.includes('阻止剪贴板操作'))?.querySelector('input')?.checked ?? null,
        mainInput: inputState('#password-input-demo'),
        readonlyInput: inputState('#password-input-readonly'),
        disabledInput: inputState('#password-input-disabled'),
        mainInputAccessibleName: mainInput?.getAttribute('aria-label') ?? null,
        toggle: {
          accessibleName: toggle?.getAttribute('aria-label') ?? null,
          pressed: toggle?.getAttribute('aria-pressed') ?? null,
          computedTransitionDuration: toggleStyle?.transitionDuration ?? null,
          rect: rect(toggle),
        },
        securityHint: document.querySelector('.password-input-demo__security-hint')?.textContent?.trim() ?? null,
        advanced: {
          open: details?.open ?? null,
          summaryText: summary?.textContent?.trim() ?? null,
          summaryRect: rect(summary),
          iconTransform: iconStyle?.transform ?? null,
          iconTransitionDuration: iconStyle?.transitionDuration ?? null,
        },
        focusedElement: {
          tag: document.activeElement?.tagName ?? null,
          type: document.activeElement?.getAttribute?.('type') ?? null,
          name: document.activeElement?.getAttribute?.('aria-label') ?? null,
          text: document.activeElement?.textContent?.trim()?.slice(0, 80) ?? null,
        },
      },
      tables: tableMetrics,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  }, label)

  observations.push(evidence)
  return evidence
}

try {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45000 })
  await page.locator('.password-input-demo').waitFor({ state: 'visible' })
  await page.waitForTimeout(250)
  await saveScreenshot('docs-1280-light-top.png')
  await inspect('1280-light-docs-top')

  const mainField = page.locator('.password-input-demo__field').filter({ has: page.locator('#password-input-demo') })
  const mainInput = mainField.locator('input')
  const toggle = mainField.locator('button.lx-password-input__toggle')
  const showPassword = page.locator('.password-input-demo__toolbar label').filter({ hasText: '允许切换明文' }).locator('input')
  const maskOnBlur = page.locator('.password-input-demo__toolbar label').filter({ hasText: '离开组件后重新遮罩' }).locator('input')
  const details = page.locator('.password-input-demo__advanced')
  const summary = details.locator('summary')
  const hudTheme = page.locator('.password-input-demo__advanced-controls label').filter({ hasText: 'HUD 深色主题' }).locator('input')

  await page.locator('.password-input-demo').scrollIntoViewIfNeeded()
  await saveDemoScreenshot('demo-1280-light-masked.png')
  await inspect('1280-light-masked-mask-on-blur-off')

  await toggle.click()
  await saveDemoScreenshot('demo-1280-light-revealed-mask-off.png')
  await inspect('1280-light-revealed-mask-on-blur-off')
  await page.getByRole('button', { name: '聚焦输入框' }).click()
  await page.getByRole('button', { name: '移除焦点' }).click()
  await inspect('1280-light-revealed-after-blur-mask-on-blur-off')

  await toggle.focus()
  await page.keyboard.press('Enter')
  const enterState = await inspect('keyboard-enter-toggle')
  await toggle.focus()
  await page.keyboard.press('Space')
  const spaceState = await inspect('keyboard-space-toggle')

  await maskOnBlur.check()
  if ((await mainInput.getAttribute('type')) === 'text') await toggle.click()
  await mainInput.focus()
  await toggle.click()
  const internalFocusState = await inspect('mask-on-blur-internal-focus-transfer')
  await page.getByRole('button', { name: '移除焦点' }).click()
  const maskedAfterBlurState = await inspect('mask-on-blur-after-leaving-component')
  await saveDemoScreenshot('demo-1280-light-mask-on-blur-after-exit.png')

  const readonlyField = page.locator('.password-input-demo__field').filter({ has: page.locator('#password-input-readonly') })
  const disabledField = page.locator('.password-input-demo__field').filter({ has: page.locator('#password-input-disabled') })
  const readonlyInput = readonlyField.locator('input')
  const readonlyToggle = readonlyField.locator('button.lx-password-input__toggle')
  const disabledInput = disabledField.locator('input')
  const disabledToggle = disabledField.locator('button.lx-password-input__toggle')
  await readonlyInput.focus()
  const readonlyInputFocusable = await readonlyInput.evaluate((element) => document.activeElement === element)
  await inspect('1280-readonly-disabled-masked')
  await readonlyToggle.click()
  await saveDemoScreenshot('demo-1280-readonly-visible-disabled.png')
  await inspect('1280-readonly-visible-disabled')

  await details.locator('summary').focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(180)
  await saveDemoScreenshot('demo-1280-disclosure-open.png')
  await inspect('1280-disclosure-open')

  await hudTheme.check()
  await page.waitForTimeout(150)
  await saveDemoScreenshot('demo-1280-hud-open.png')
  await inspect('1280-hud-open')

  const tabOrder = []
  await page.locator('select[aria-label="密码框尺寸档"]').focus()
  for (let index = 0; index < 9; index += 1) {
    await page.keyboard.press('Tab')
    tabOrder.push(await page.evaluate(() => {
      const active = document.activeElement
      return {
        tag: active?.tagName ?? null,
        type: active?.getAttribute?.('type') ?? null,
        name: active?.getAttribute?.('aria-label') ?? null,
        text: active?.textContent?.trim()?.slice(0, 80) ?? null,
      }
    }))
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await inspect('1280-hud-reduced-motion')
  await saveDemoScreenshot('demo-1280-reduced-motion.png')
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  if ((await readonlyInput.getAttribute('type')) === 'text') await readonlyToggle.click()
  if (await maskOnBlur.isChecked()) await maskOnBlur.uncheck()
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    window.getSelection()?.removeAllRanges()
  })

  for (const viewport of [
    { width: 375, height: 844, label: '375-light' },
    { width: 320, height: 800, label: '320-light' },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
    if (await hudTheme.isChecked()) await hudTheme.uncheck()
    if (!(await details.isVisible())) throw new Error('Details element unexpectedly hidden')
    await details.evaluate((element) => { element.open = false })
    if (await mainInput.getAttribute('type') === 'text') await toggle.click()
    await page.locator('.password-input-demo').evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(100)
    await saveDemoScreenshot(`demo-${viewport.label}.png`)
    await inspect(`${viewport.label}-demo-light-masked`)

    await page.locator('.vp-doc h2').filter({ hasText: 'Props' }).first().scrollIntoViewIfNeeded()
    await saveScreenshot(`docs-${viewport.label}-props.png`)
    await inspect(`${viewport.label}-props-tables`)
  }

  await page.setViewportSize({ width: 320, height: 800 })
  await page.locator('.password-input-demo').evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await details.evaluate((element) => { element.open = true })
  if (!(await hudTheme.isChecked())) await hudTheme.check()
  await page.waitForTimeout(120)
  await saveDemoScreenshot('demo-320-hud-expanded.png')
  await inspect('320-hud-expanded')

  const report = {
    assessment: 'A-only design and UX review; Assessment B and detector intentionally omitted by task scope',
    capturedAt: new Date().toISOString(),
    target: 'linkx-fe/src/components/LxPasswordInput/index.vue',
    document: baseUrl,
    server: {
      startCommand: 'pnpm dev --host 127.0.0.1 --port 4182 --strictPort',
      sessionId: 30208,
      listenerPidAtCapture: 15008,
      stopMethod: 'Send Ctrl+C to the active exec session (sessionId 30208), then verify Get-NetTCPConnection -State Listen -LocalPort 4182 returns no row.',
      stoppedAndVerified: false,
    },
    browser: {
      automation: 'Playwright 1.58.0',
      executable: 'Google Chrome 154.0.8037.95',
      freshContext: true,
      freshPage: true,
      status: response?.status() ?? null,
      title: await page.title(),
    },
    interactions: {
      keyboardEnterPressed: enterState.demo.toggle.pressed,
      keyboardSpacePressed: spaceState.demo.toggle.pressed,
      maskOnBlurInternalTransferType: internalFocusState.demo.mainInput.type,
      maskOnBlurAfterLeavingType: maskedAfterBlurState.demo.mainInput.type,
      tabOrder,
      readonlyInputFocusable,
      readonlyToggleAccessibleName: await readonlyToggle.getAttribute('aria-label'),
      disabledInputDisabled: await disabledInput.isDisabled(),
      disabledToggleDisabled: await disabledToggle.isDisabled(),
    },
    screenshots,
    observations,
    browserEvents,
  }

  await fs.writeFile(path.join(outputDirectory, 'browser-evidence.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
} finally {
  await context.close()
  await browser.close()
}
