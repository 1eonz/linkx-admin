import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const projectRequire = createRequire(
  path.resolve(process.cwd(), 'package.json'),
)
const { chromium } = projectRequire('@playwright/test')
const outputDir = path.resolve(
  process.cwd(),
  '../../.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-a-final-v3/browser',
)
const repoRoot = path.resolve(process.cwd(), '../..')
const sourceFiles = {
  component: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/index.vue'),
  demo: path.join(repoRoot, 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'),
}
const targetUrl = 'http://127.0.0.1:4174/components/lxtransferpanel'
async function sourceHashes() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(sourceFiles).map(async ([name, file]) => [
        name,
        createHash('sha256')
          .update(await readFile(file))
          .digest('hex')
          .toUpperCase(),
      ]),
    ),
  )
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const context = await browser.newContext({
  colorScheme: 'light',
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const consoleErrors = []
page.on('pageerror', (error) => consoleErrors.push(error.message))

async function capture(
  name,
  viewport,
  mobilePanel,
  scrollSelectedBottom = false,
  theme = 'light',
) {
  await page.setViewportSize(viewport)
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  if (theme === 'hud') {
    await page.locator('.transfer-panel-demo__settings summary').click()
    await page
      .locator('.transfer-panel-demo__settings label')
      .filter({ hasText: 'HUD 深色主题' })
      .locator('input')
      .check()
  }
  const component = page.locator('.lx-transfer-panel').first()
  await component.waitFor({ state: 'visible', timeout: 15000 })
  if (mobilePanel) {
    const panelButton = page.locator(
      `.lx-transfer-panel__mobile-switch button:nth-child(${mobilePanel === 'source' ? 1 : 2})`,
    )
    await panelButton.click()
  }
  if (scrollSelectedBottom) {
    await page.locator('.lx-transfer-panel__selected').evaluate((list) => {
      list.scrollTop = list.scrollHeight
    })
  }
  await component.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  const details = await page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const { x, y, width, height } = element.getBoundingClientRect()
      return { x, y, width, height }
    }
    const root = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const tree = document.querySelector('.lx-transfer-panel__tree')
    const selected = document.querySelector('.lx-transfer-panel__selected')
    const buttons = [...(root?.querySelectorAll('button') ?? [])]
    return {
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      component: rect(root),
      panels: panels.map((panel) => ({
        title: panel.querySelector('.lx-transfer-panel__title')?.textContent?.trim(),
        visible: getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().width > 0,
        bounds: rect(panel),
      })),
      tree: rect(tree),
      selectedList: rect(selected),
      selectedItems: root?.querySelectorAll('.lx-transfer-panel__selected-item').length ?? 0,
      labels: [...(root?.querySelectorAll('.lx-transfer-panel__selected-name') ?? [])]
        .map((element) => element.textContent?.trim()),
      controls: buttons.map((button) => ({
        name: button.getAttribute('aria-label') || button.textContent?.trim(),
        disabled: button.disabled,
        bounds: rect(button),
      })),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
  await page.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
  return { ...details, theme }
}

await mkdir(outputDir, { recursive: true })
const captures = {}
try {
  captures.browser = { engine: 'Microsoft Edge', version: browser.version() }
  captures.sourceHashesBefore = await sourceHashes()
  captures.desktop = await capture('desktop-1440x900.png', {
    width: 1440,
    height: 900,
  })
  captures.desktopHud = await capture(
    'desktop-1440x900-hud.png',
    { width: 1440, height: 900 },
    undefined,
    false,
    'hud',
  )
  captures.mobileSource = await capture(
    'mobile-390x844-source.png',
    { width: 390, height: 844 },
    'source',
  )
  captures.mobileSelected = await capture(
    'mobile-390x844-selected.png',
    { width: 390, height: 844 },
    'selected',
  )
  captures.mobileSelectedScrolled = await capture(
    'mobile-390x844-selected-scrolled.png',
    { width: 390, height: 844 },
    'selected',
    true,
  )
  captures.mobile320Source = await capture(
    'mobile-320x844-source.png',
    { width: 320, height: 844 },
    'source',
  )
  captures.mobile320Selected = await capture(
    'mobile-320x844-selected.png',
    { width: 320, height: 844 },
    'selected',
  )
  captures.consoleErrors = consoleErrors
  captures.sourceHashesAfter = await sourceHashes()
  if (
    JSON.stringify(captures.sourceHashesBefore) !==
    JSON.stringify(captures.sourceHashesAfter)
  ) {
    throw new Error('源码在浏览器采集期间发生变化')
  }
  captures.capturedAt = new Date().toISOString()
  await writeFile(
    path.join(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(captures, null, 2)}\n`,
  )
  process.stdout.write(`${JSON.stringify(captures, null, 2)}\n`)
} finally {
  await context.close()
  await browser.close()
}
