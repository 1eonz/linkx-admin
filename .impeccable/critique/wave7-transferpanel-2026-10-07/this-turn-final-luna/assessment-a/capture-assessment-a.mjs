import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const outputDir = path.dirname(fileURLToPath(import.meta.url))
const baseUrl = 'http://127.0.0.1:4174'
const evidence = {
  method: 'Assessment A; new isolated Playwright browser context and page',
  baseUrl,
  context: { colorScheme: 'light', reducedMotion: 'no-preference' },
  pages: [],
  screenshots: [],
}

await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  deviceScaleFactor: 1,
})

async function recordPage(route, demoSelector, prefix) {
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.locator(demoSelector).waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(800)
  const demo = page.locator(demoSelector)
  await demo.scrollIntoViewIfNeeded()
  const initialState = await page.evaluate((selector) => {
    const root = document.querySelector(selector)
    const panel = document.querySelector('.lx-transfer-panel')
    const tree = document.querySelector('.lx-virtual-tree')
    const buttons = [...(root?.querySelectorAll('button') ?? [])]
    const visible = (element) => element.getClientRects().length > 0
    const inheritInput = panel?.querySelector(
      '.lx-transfer-panel__inherit-control input',
    )
    const describedBy = inheritInput?.getAttribute('aria-describedby') ?? ''
    const describedNode = describedBy
      ? document.getElementById(describedBy.split(/\s+/)[0])
      : null
    const transitions = [...(root?.querySelectorAll('*') ?? [])]
      .map((element) => {
        const style = getComputedStyle(element)
        return {
          selector: element.className?.toString?.() ?? element.tagName,
          transitionDuration: style.transitionDuration,
          animationDuration: style.animationDuration,
        }
      })
      .filter(
        (style) =>
          style.transitionDuration !== '0s' || style.animationDuration !== '0s',
      )
      .slice(0, 30)
    return {
      title: document.title,
      route: location.pathname,
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow:
          document.documentElement.scrollWidth > window.innerWidth,
      },
      headings: [...document.querySelectorAll('h1, h2, h3')]
        .filter(visible)
        .map((element) => ({ level: element.tagName, text: element.innerText })),
      demoText: root?.innerText,
      controls: buttons
        .filter(visible)
        .map((button) => ({
          name:
            button.getAttribute('aria-label') ||
            button.innerText.trim() ||
            button.title,
          disabled: button.disabled,
          pressed: button.getAttribute('aria-pressed'),
        })),
      tree: tree
        ? {
            role: tree.getAttribute('role'),
            label: tree.getAttribute('aria-label'),
            itemCount: tree.querySelectorAll('[role="treeitem"]').length,
          }
        : null,
      transfer: panel
        ? {
            layout: panel.getAttribute('data-lx-transfer-layout'),
            bounds: (() => {
              const rect = panel.getBoundingClientRect()
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            })(),
            mobileSwitch: [...panel.querySelectorAll('.lx-transfer-panel__mobile-switch button')].map((button) => ({
              name: button.getAttribute('aria-label'),
              pressed: button.getAttribute('aria-pressed'),
              visible: visible(button),
              controls: button.getAttribute('aria-controls'),
            })),
            panels: [...panel.querySelectorAll('.lx-transfer-panel__panel')].map((element) => ({
              label: element.getAttribute('aria-labelledby'),
              visible: visible(element),
              bounds: (() => {
                const rect = element.getBoundingClientRect()
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
              })(),
            })),
            treeItemCount: panel.querySelectorAll('[role="treeitem"]').length,
            selectedItemCount: panel.querySelectorAll('.lx-transfer-panel__selected-item').length,
            inherit: inheritInput
              ? {
                  disabled: inheritInput.disabled,
                  checked: inheritInput.checked,
                  describedBy,
                  descriptionText: describedNode?.innerText ?? null,
                  descriptionExists: Boolean(describedNode),
                }
              : null,
          }
        : null,
      activeElement: {
        tagName: document.activeElement?.tagName ?? null,
        role: document.activeElement?.getAttribute('role') ?? null,
        label: document.activeElement?.getAttribute('aria-label') ?? null,
        className: document.activeElement?.className?.toString?.() ?? null,
      },
      media: {
        dark: document.documentElement.classList.contains('dark'),
        hud: document.documentElement.classList.contains('lx-theme-hud'),
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      nonzeroMotionStyles: transitions,
    }
  }, demoSelector)
  await demo.screenshot({ path: path.join(outputDir, `${prefix}-desktop-light.png`) })
  evidence.screenshots.push(`${prefix}-desktop-light.png`)

  const pageEvidence = {
    route,
    status: response?.status() ?? null,
    initialState,
    viewports: [],
    consoleErrors,
    pageErrors,
  }

  if (prefix === 'transferpanel') {
    await page.locator('.transfer-panel-demo__settings summary').click()
    const inheritDescriptionInput = page
      .locator('.transfer-panel-demo__toolbar-group')
      .nth(1)
      .locator('input[type="checkbox"]')
      .nth(2)
    await inheritDescriptionInput.uncheck()
    await page.waitForTimeout(100)
    pageEvidence.missingInheritDescription = await page
      .locator('.lx-transfer-panel')
      .evaluate((panel) => {
        const input = panel.querySelector(
          '.lx-transfer-panel__inherit-control input',
        )
        const describedBy = input?.getAttribute('aria-describedby') ?? ''
        const describedNode = describedBy
          ? document.getElementById(describedBy.split(/\s+/)[0])
          : null
        return {
          disabled: input?.disabled ?? null,
          checked: input?.checked ?? null,
          describedBy,
          descriptionExists: Boolean(describedNode),
          descriptionText: describedNode?.innerText ?? null,
          visibleWarning: panel.innerText.includes('尚未配置经确认的具体继承范围说明'),
        }
      })
    await page.locator('.lx-transfer-panel').screenshot({
      path: path.join(outputDir, 'transferpanel-inherit-description-missing.png'),
    })
    evidence.screenshots.push('transferpanel-inherit-description-missing.png')

    const themeInput = page
      .locator('.transfer-panel-demo__toolbar-group')
      .nth(1)
      .locator('input[type="checkbox"]')
      .nth(1)
    await themeInput.check()
    await page.waitForTimeout(100)
    pageEvidence.darkTheme = await page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      panelBackground: getComputedStyle(
        document.querySelector('.lx-transfer-panel__panel'),
      ).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }))
    await page.locator('.lx-transfer-panel').screenshot({
      path: path.join(outputDir, 'transferpanel-desktop-dark.png'),
    })
    evidence.screenshots.push('transferpanel-desktop-dark.png')
    await themeInput.uncheck()
    await inheritDescriptionInput.check()
  }

  if (prefix === 'virtualtree') {
    await page.locator('.virtual-tree-demo__controls summary').click()
    const themeInput = page.locator('.virtual-tree-demo input[type="checkbox"]').nth(1)
    await themeInput.check()
    await page.waitForTimeout(100)
    pageEvidence.darkTheme = await page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      demoBackground: getComputedStyle(document.querySelector('.virtual-tree-demo')).backgroundColor,
    }))
    await demo.screenshot({ path: path.join(outputDir, 'virtualtree-desktop-dark.png') })
    evidence.screenshots.push('virtualtree-desktop-dark.png')
    await themeInput.uncheck()
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  pageEvidence.reducedMotion = await page.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    demoTransition: getComputedStyle(
      document.querySelector(
        '.lx-transfer-panel, .lx-virtual-tree, .transfer-panel-demo, .virtual-tree-demo',
      ),
    ).transitionDuration,
    demoAnimation: getComputedStyle(
      document.querySelector(
        '.lx-transfer-panel, .lx-virtual-tree, .transfer-panel-demo, .virtual-tree-demo',
      ),
    ).animationDuration,
  }))

  if (prefix === 'transferpanel') {
    const sourceButton = page.locator('.lx-transfer-panel__mobile-switch button').first()
    const mobileSourceButton = page.locator('.lx-transfer-panel__mobile-switch button').nth(1)
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      await page.waitForTimeout(100)
      const beforeSwitch = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        panelWidth: document.querySelector('.lx-transfer-panel')?.getBoundingClientRect().width,
        mobileSwitch: [...document.querySelectorAll('.lx-transfer-panel__mobile-switch button')].map((button) => ({
          label: button.getAttribute('aria-label'),
          pressed: button.getAttribute('aria-pressed'),
          visible: button.getClientRects().length > 0,
          focusOutline: getComputedStyle(button).outlineStyle,
        })),
        sourceVisible: document.getElementById(document.querySelector('.lx-transfer-panel__mobile-switch button')?.getAttribute('aria-controls') ?? '')?.getClientRects().length > 0,
        selectedList: {
          width: document.querySelector('.lx-transfer-panel__selected')?.getBoundingClientRect().width,
          itemWidths: [...document.querySelectorAll('.lx-transfer-panel__selected-item')].map((item) => item.getBoundingClientRect().width),
        },
      }))
      await demo.screenshot({ path: path.join(outputDir, `transferpanel-mobile-${width}-source.png`) })
      evidence.screenshots.push(`transferpanel-mobile-${width}-source.png`)
      await mobileSourceButton.click()
      await page.waitForTimeout(50)
      const afterSwitch = await page.evaluate(() => ({
        selectedTabPressed: document.querySelectorAll('.lx-transfer-panel__mobile-switch button')[1]?.getAttribute('aria-pressed'),
        selectedPanelVisible: document.querySelectorAll('.lx-transfer-panel__panel')[1]?.getClientRects().length > 0,
        sourcePanelHidden: document.querySelectorAll('.lx-transfer-panel__panel')[0]?.getClientRects().length === 0,
      }))
      if (width === 375) {
        await page.locator('.lx-transfer-panel').screenshot({
          path: path.join(outputDir, 'transferpanel-mobile-375-selected.png'),
        })
        evidence.screenshots.push('transferpanel-mobile-375-selected.png')
        await mobileSourceButton.focus()
        const focusState = await mobileSourceButton.evaluate((button) => {
          const style = getComputedStyle(button)
          const rect = button.getBoundingClientRect()
          return {
            matchesFocusVisible: button.matches(':focus-visible'),
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          }
        })
        pageEvidence.focus = focusState
        await page.screenshot({ path: path.join(outputDir, 'transferpanel-mobile-keyboard-focus.png') })
        evidence.screenshots.push('transferpanel-mobile-keyboard-focus.png')
      }
      pageEvidence.viewports.push({ width, beforeSwitch, afterSwitch })
      await sourceButton.click()
    }
  } else {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      await page.waitForTimeout(100)
      const metrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        demoWidth: document.querySelector('.virtual-tree-demo')?.getBoundingClientRect().width,
        treeWidth: document.querySelector('.lx-virtual-tree')?.getBoundingClientRect().width,
      }))
      await demo.screenshot({ path: path.join(outputDir, `virtualtree-mobile-${width}.png`) })
      evidence.screenshots.push(`virtualtree-mobile-${width}.png`)
      pageEvidence.viewports.push({ width, metrics })
    }
  }
  evidence.pages.push(pageEvidence)
  await page.close()
}

try {
  await recordPage('/components/lxvirtualtree', '.virtual-tree-demo', 'virtualtree')
  await recordPage('/components/lxtransferpanel', '.transfer-panel-demo', 'transferpanel')
} finally {
  await context.close()
  await browser.close()
}

await fs.writeFile(
  path.join(outputDir, 'browser-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
)
process.stdout.write(`${JSON.stringify({ pages: evidence.pages.length, screenshots: evidence.screenshots.length, outputDir }, null, 2)}\n`)
