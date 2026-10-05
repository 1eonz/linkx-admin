const fs = require('node:fs/promises')
const path = require('node:path')
const { createRequire } = require('node:module')

const repoRoot = process.cwd()
const outDir = path.join(
  repoRoot,
  '.impeccable/critique/wave2-lx-switch-2026-10-05/assessment-b-recheck',
)
const projectRequire = createRequire(
  path.join(repoRoot, 'other-admin/admin-vue3/package.json'),
)
const { chromium } = projectRequire('@playwright/test')
const targetUrl = 'http://127.0.0.1:4192/components/lxswitch.html'
const targetOrigin = new URL(targetUrl).origin
const evidence = {
  targetUrl,
  startedAt: new Date().toISOString(),
  launchAttempts: [],
  externalBusinessRequests: [],
  blockedCrossOriginRequests: [],
  pageErrors: [],
  consoleErrors: [],
  screenshots: {},
}

async function addRequestGuards(context) {
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const resourceType = request.resourceType()

    if (resourceType === 'fetch' || resourceType === 'xhr') {
      evidence.externalBusinessRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType,
        blocked: true,
      })
      await route.abort()
      return
    }

    if (url.origin !== targetOrigin) {
      evidence.blockedCrossOriginRequests.push({
        url: request.url(),
        resourceType,
        blocked: true,
      })
      await route.abort()
      return
    }

    await route.continue()
  })
}

async function measurePage(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Number(box.x.toFixed(2)),
        y: Number(box.y.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        right: Number(box.right.toFixed(2)),
        bottom: Number(box.bottom.toFixed(2)),
      }
    }
    const switches = Array.from(document.querySelectorAll('.lx-switch'))
    const inline = document.querySelector(
      '[data-testid="inline-default"] .lx-switch',
    )
    const inlineCore = inline?.querySelector('.el-switch__core')
    const locked = document.querySelector(
      '.lx-switch-demo__item--locked .lx-switch',
    )
    const lockedCore = locked?.querySelector('.el-switch__core')
    const loading = document.querySelector(
      '[data-testid="loading"] .lx-switch',
    )
    const loadingCore = loading?.querySelector('.el-switch__core')
    const styleOf = (element) => {
      if (!element) return null
      const style = getComputedStyle(element)
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        opacity: style.opacity,
        transitionDuration: style.transitionDuration,
        animationDuration: style.animationDuration,
      }
    }

    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
      switchCount: switches.length,
      inlineSwitch: {
        rect: rect(inline),
        coreRect: rect(inlineCore),
        coreStyle: styleOf(inlineCore),
        role: inline?.getAttribute('role'),
        ariaChecked: inline?.getAttribute('aria-checked'),
        ariaDisabled: inline?.getAttribute('aria-disabled'),
        accessibleNameAttributes: {
          ariaLabel: inline?.getAttribute('aria-label'),
          ariaLabelledby: inline?.getAttribute('aria-labelledby'),
        },
      },
      disabledSwitch: {
        rect: rect(locked),
        coreRect: rect(lockedCore),
        coreStyle: styleOf(lockedCore),
        parentOpacity: locked?.parentElement
          ? getComputedStyle(locked.parentElement).opacity
          : null,
        ariaDisabled: locked?.getAttribute('aria-disabled'),
        inputDisabled: locked?.querySelector('input')?.disabled ?? null,
      },
      loadingSwitch: {
        rect: rect(loading),
        coreRect: rect(loadingCore),
        coreStyle: styleOf(loadingCore),
        ariaDisabled: loading?.getAttribute('aria-disabled'),
        inputDisabled: loading?.querySelector('input')?.disabled ?? null,
        hasLoadingClass: loading?.classList.contains('is-loading') ?? false,
        spinnerCount: loading?.querySelectorAll('.is-loading, .el-icon.is-loading').length ?? 0,
      },
      activeElement: {
        tagName: document.activeElement?.tagName ?? null,
        className: document.activeElement?.className?.toString?.() ?? null,
        focusVisible: document.activeElement?.matches?.(':focus-visible') ?? false,
      },
    }
  })
}

async function waitForDemo(page) {
  await page.locator('.lx-switch-demo').waitFor({
    state: 'visible',
    timeout: 15000,
  })
}

async function main() {
  let browser
  for (const options of [
    { channel: 'msedge', headless: true },
    { headless: true },
  ]) {
    try {
      browser = await chromium.launch(options)
      evidence.launchAttempts.push({ options, success: true })
      break
    } catch (error) {
      evidence.launchAttempts.push({
        options,
        success: false,
        error: String(error?.stack || error),
      })
    }
  }

  if (!browser) {
    throw new Error('No browser engine could be launched')
  }

  evidence.browserVersion = browser.version()

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  await addRequestGuards(desktopContext)
  const page = await desktopContext.newPage()
  page.on('pageerror', (error) => evidence.pageErrors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text())
  })

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await waitForDemo(page)
  evidence.preflight = await page.evaluate(() => {
    const originalTitle = document.title
    document.title = `${originalTitle} [assessment-b-preflight]`
    const script = document.createElement('script')
    script.textContent = 'window.__lxSwitchMutationProbe = "script-ran"'
    document.head.append(script)
    const result = {
      originalTitle,
      mutatedTitle: document.title,
      scriptAppended: script.isConnected,
      scriptExecuted: window.__lxSwitchMutationProbe === 'script-ran',
      scriptTagCount: document.head.querySelectorAll('script').length,
    }
    document.title = originalTitle
    script.remove()
    return result
  })

  evidence.desktopDefault = await measurePage(page)
  const desktopDefaultPath = path.join(outDir, 'desktop-default.png')
  await page.screenshot({ path: desktopDefaultPath, fullPage: true })
  evidence.screenshots.desktopDefault = path.basename(desktopDefaultPath)

  await page.locator('.lx-switch-demo__toolbar input[type="checkbox"]').check()
  await page.waitForTimeout(300)
  evidence.desktopHud = await measurePage(page)
  const desktopHudPath = path.join(outDir, 'desktop-hud-dark.png')
  await page.screenshot({ path: desktopHudPath, fullPage: true })
  evidence.screenshots.desktopHud = path.basename(desktopHudPath)

  const loadingSwitch = page.locator('[data-testid="loading"] .lx-switch').first()
  await loadingSwitch.click()
  await page.waitForTimeout(100)
  evidence.loadingDuringAction = {
    switch: await measurePage(page),
    statusText: await page.locator('.lx-switch-demo__status').innerText(),
  }
  const loadingPath = path.join(outDir, 'loading-active.png')
  await page.screenshot({ path: loadingPath, fullPage: true })
  evidence.screenshots.loadingActive = path.basename(loadingPath)

  await page.locator('body').click({ position: { x: 4, y: 4 } })
  evidence.keyboardFocus = { tabSteps: 0 }
  for (let step = 1; step <= 120; step += 1) {
    await page.keyboard.press('Tab')
    const active = await page.evaluate(() => ({
      tagName: document.activeElement?.tagName ?? null,
      className: document.activeElement?.className?.toString?.() ?? null,
      isSwitchInput:
        document.activeElement?.tagName === 'INPUT' &&
        Boolean(document.activeElement?.closest?.('.lx-switch-demo .lx-switch')),
      focusVisible: document.activeElement?.matches?.(':focus-visible') ?? false,
      parentClassName:
        document.activeElement?.parentElement?.className?.toString?.() ?? null,
      coreOutline: document.activeElement?.parentElement
        ?.querySelector?.('.el-switch__core')
        ? getComputedStyle(
            document.activeElement.parentElement.querySelector('.el-switch__core'),
          ).outline
        : null,
    }))
    if (active.isSwitchInput) {
      evidence.keyboardFocus = { tabSteps: step, ...active }
      break
    }
  }
  const focusPath = path.join(outDir, 'keyboard-focus.png')
  await page.screenshot({ path: focusPath, fullPage: true })
  evidence.screenshots.keyboardFocus = path.basename(focusPath)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  evidence.reducedMotion = await page.evaluate(() => {
    const selectors = [
      '.lx-switch .el-switch__core',
      '.lx-switch .el-switch__action',
      '.lx-switch .el-switch__inner',
    ]
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      elements: selectors.map((selector) => {
        const element = document.querySelector(selector)
        if (!element) return { selector, present: false }
        const style = getComputedStyle(element)
        return {
          selector,
          present: true,
          transitionDuration: style.transitionDuration,
          animationDuration: style.animationDuration,
        }
      }),
    }
  })

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  })
  await addRequestGuards(mobileContext)
  const mobilePage = await mobileContext.newPage()
  mobilePage.on('pageerror', (error) => evidence.pageErrors.push(String(error)))
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text())
  })
  await mobilePage.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  })
  await waitForDemo(mobilePage)
  evidence.mobileTouch = await mobilePage.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: Number(box.x.toFixed(2)),
        y: Number(box.y.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        right: Number(box.right.toFixed(2)),
        bottom: Number(box.bottom.toFixed(2)),
      }
    }
    const rows = Array.from(
      document.querySelectorAll('.lx-switch-demo__item'),
    ).map((item) => {
      const copy = item.children[0]
      const control = item.querySelector('.lx-switch')
      const copyRect = copy?.getBoundingClientRect()
      const controlRect = control?.getBoundingClientRect()
      return {
        label: copy?.querySelector('.lx-switch-demo__title')?.textContent?.trim(),
        rowRect: rect(item),
        copyRect: rect(copy),
        controlRect: rect(control),
        overlaps:
          Boolean(copyRect && controlRect) &&
          copyRect.right > controlRect.left &&
          copyRect.left < controlRect.right &&
          copyRect.bottom > controlRect.top &&
          copyRect.top < controlRect.bottom,
      }
    })
    const controls = Array.from(
      document.querySelectorAll('.lx-switch-demo .lx-switch'),
    ).map((element) => ({
      rect: rect(element),
      minWidth: getComputedStyle(element).minWidth,
      minHeight: getComputedStyle(element).minHeight,
    }))
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
      hasTouch: 'ontouchstart' in window,
      devicePixelRatio,
      switchCount: controls.length,
      controls,
      rows,
    }
  })
  const mobilePath = path.join(outDir, 'mobile-375-touch.png')
  await mobilePage.screenshot({ path: mobilePath, fullPage: true })
  evidence.screenshots.mobileTouch = path.basename(mobilePath)

  evidence.requestSummary = {
    blockedFetchOrXhrRequests: evidence.externalBusinessRequests.length,
    blockedCrossOriginRequests: evidence.blockedCrossOriginRequests.length,
    businessRequestDetails: evidence.externalBusinessRequests,
    crossOriginRequestDetails: evidence.blockedCrossOriginRequests,
  }
  evidence.finishedAt = new Date().toISOString()
  await fs.writeFile(
    path.join(outDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  )

  await mobileContext.close()
  await desktopContext.close()
  await browser.close()
}

main().catch(async (error) => {
  evidence.failedAt = new Date().toISOString()
  evidence.failure = String(error?.stack || error)
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(
    path.join(outDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  )
  process.stderr.write(`${evidence.failure}\n`)
  process.exitCode = 1
})
