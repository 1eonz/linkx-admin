import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(
  resolve(process.cwd(), 'other-admin/admin-vue3/package.json'),
)
const { chromium } = require('@playwright/test')
const baseUrl = 'http://127.0.0.1:4174'
const outputDir = resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/this-turn-postfix-final-2026-10-08/assessment-a/evidence',
)
const targets = [
  {
    id: 'transferpanel',
    route: '/components/lxtransferpanel',
    demo: '.transfer-panel-demo',
    summary: '示例状态与主题',
    mobileSelectedName: '已选资源',
  },
  {
    id: 'virtualtree',
    route: '/components/lxvirtualtree',
    demo: '.virtual-tree-demo',
    summary: '演示状态和更多操作',
  },
]
const viewports = [
  { id: 'desktop', width: 1440, height: 1000, hud: false },
  { id: 'mobile-390', width: 390, height: 844, hud: false },
  { id: 'hud-desktop', width: 1440, height: 1000, hud: true },
]

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const results = []

for (const target of targets) {
  for (const view of viewports) {
    process.stdout.write(`Opening ${target.id} ${view.id}\n`)
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    const consoleErrors = []
    const pageErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    const response = await page.goto(`${baseUrl}${target.route}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    await page.locator(target.demo).waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)

    if (view.hud) {
      const summary = page.locator(`${target.demo} details summary`).filter({
        hasText: target.summary,
      })
      if (!(await summary.evaluate((node) => node.closest('details')?.open))) {
        await summary.click()
      }
      await page.getByRole('checkbox', { name: 'HUD 深色主题' }).check()
      await summary.click()
    }

    await page.evaluate((selector) => {
      const demo = document.querySelector(selector)
      if (!demo) return
      const top = demo.getBoundingClientRect().top + window.scrollY - 144
      window.scrollTo(0, Math.max(0, top))
    }, target.demo)
    await page.waitForTimeout(120)

    const screenshotPath = resolve(outputDir, `${target.id}-${view.id}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })

    if (view.id === 'mobile-390' && target.mobileSelectedName) {
      const selectedTab = page.locator(
        '.lx-transfer-panel__mobile-switch button',
      ).nth(1)
      if (await selectedTab.count()) {
        await selectedTab.click({ timeout: 5000 })
        await page.screenshot({
          path: resolve(outputDir, `${target.id}-mobile-390-selected.png`),
          fullPage: false,
        })
      }
    }

    const observations = await page.evaluate((selector) => {
      const demo = document.querySelector(selector)
      const component = demo?.querySelector(
        '.lx-transfer-panel, .lx-virtual-tree',
      )
      const parse = (value) => {
        const values = value.match(/[\d.]+/g)?.map(Number) ?? []
        return values.length >= 3
          ? [values[0], values[1], values[2], values[3] ?? 1]
          : [0, 0, 0, 1]
      }
      const luminance = ([red, green, blue]) => {
        const channel = (value) => {
          const normalized = value / 255
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
        }
        return (
          0.2126 * channel(red) +
          0.7152 * channel(green) +
          0.0722 * channel(blue)
        )
      }
      const visible = (element) => {
        if (!element) return false
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        )
      }
      const resolveBackground = (element) => {
        let current = element
        let color = [255, 255, 255, 1]
        while (current) {
          const next = parse(getComputedStyle(current).backgroundColor)
          if (next[3] > 0) {
            color = [
              next[0] * next[3] + color[0] * (1 - next[3]),
              next[1] * next[3] + color[1] * (1 - next[3]),
              next[2] * next[3] + color[2] * (1 - next[3]),
              1,
            ]
          }
          if (next[3] >= 1) break
          current = current.parentElement
        }
        return color
      }
      const candidates = selector.includes('transfer')
        ? [
            '.lx-transfer-panel__title',
            '.lx-transfer-panel__scope-hint',
            '.lx-transfer-panel__header-status',
            '.lx-transfer-panel__selected-name',
            '.lx-transfer-panel__node-code',
            '.lx-transfer-panel__inherit-description',
            '.lx-transfer-panel__filter input',
          ]
        : [
            '.lx-virtual-tree__selection-scope',
            '.lx-virtual-tree__selection-status',
            '.lx-virtual-tree__filter-status',
            '.lx-virtual-tree__label',
            '.lx-virtual-tree__filter input',
          ]
      const textMetrics = candidates.flatMap((candidate) => {
        const element = [...(demo?.querySelectorAll(candidate) ?? [])].find(visible)
        if (!element) return []
        const style = getComputedStyle(element)
        const foreground = parse(style.color)
        const background = resolveBackground(element)
        const foregroundLuminance = luminance(foreground)
        const backgroundLuminance = luminance(background)
        const contrast =
          (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
          (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
        return [
          {
            selector: candidate,
            text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90),
            color: style.color,
            backgroundColor: style.backgroundColor,
            effectiveBackground: `rgb(${background[0].toFixed(0)}, ${background[1].toFixed(0)}, ${background[2].toFixed(0)})`,
            contrast: Number(contrast.toFixed(2)),
          },
        ]
      })
      const demoRect = demo?.getBoundingClientRect()
      const componentRect = component?.getBoundingClientRect()
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        documentOverflowsViewport: document.documentElement.scrollWidth > innerWidth,
        themeClasses: document.documentElement.className,
        demoThemeClasses: demo?.className ?? '',
        demoRect: demoRect
          ? { x: Math.round(demoRect.x), y: Math.round(demoRect.y), width: Math.round(demoRect.width), height: Math.round(demoRect.height) }
          : null,
        componentRect: componentRect
          ? { x: Math.round(componentRect.x), y: Math.round(componentRect.y), width: Math.round(componentRect.width), height: Math.round(componentRect.height) }
          : null,
        visibleButtons: [...(demo?.querySelectorAll('button') ?? [])]
          .filter(visible)
          .map((button) => button.getAttribute('aria-label') || button.textContent?.trim().replace(/\s+/g, ' '))
          .filter(Boolean),
        visibleHeadings: [...document.querySelectorAll('.vp-doc h1, .vp-doc h2')]
          .filter(visible)
          .slice(0, 5)
          .map((heading) => heading.textContent?.trim()),
        textMetrics,
      }
    }, target.demo)

    results.push({
      target: target.id,
      route: target.route,
      view: view.id,
      status: response?.status() ?? null,
      title: await page.title(),
      screenshot: screenshotPath,
      observations,
      consoleErrors,
      pageErrors,
    })
    await context.close()
  }
}

await browser.close()
await writeFile(
  resolve(outputDir, 'runtime-observations.json'),
  `${JSON.stringify(results, null, 2)}\n`,
)
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
