import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const projectRequire = createRequire(
  path.resolve(process.cwd(), 'package.json'),
)
const { chromium } = projectRequire('@playwright/test')
const repoRoot = path.resolve(process.cwd(), '../..')
const outputDir = path.resolve(
  repoRoot,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-a-width-final/browser',
)
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
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function capture(name, viewport, showSelected = false) {
  await page.setViewportSize(viewport)
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator('.lx-transfer-panel').first()
  await root.waitFor({ state: 'visible', timeout: 15000 })
  if (showSelected) {
    await page.getByTestId('mobile-selected-panel').click()
  }
  await root.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  const measurement = await page.evaluate(() => {
    const bounds = (element) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
        bottom: Math.round(rect.bottom * 100) / 100,
      }
    }
    const intersect = (a, b) =>
      a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y
    const preview = document.querySelector('.transfer-panel-demo__surface')
    const component = document.querySelector('.lx-transfer-panel')
    const panels = [...document.querySelectorAll('.lx-transfer-panel__panel')]
    const sourcePanel = panels[0]
    const selectedPanel = panels[1]
    const sourceTitle = sourcePanel?.querySelector('.lx-transfer-panel__title')
    const sourceActions = sourcePanel?.querySelector('.lx-transfer-panel__scope-actions')
    const treeViewport = sourcePanel?.querySelector('.lx-transfer-panel__tree')
    const treeRows = [...(treeViewport?.querySelectorAll('.lx-virtual-tree__row') ?? [])]
    const list = selectedPanel?.querySelector('.lx-transfer-panel__selected')
    const selectedRows = [...(list?.querySelectorAll('.lx-transfer-panel__selected-item') ?? [])]
    const listBounds = bounds(list)
    const visibleSelectedRows = selectedRows.filter((row) => intersect(bounds(row), listBounds))
    const fullyVisibleSelectedRows = selectedRows.filter((row) => {
      const rowBounds = bounds(row)
      return (
        rowBounds &&
        listBounds &&
        listBounds.width > 0 &&
        listBounds.height > 0 &&
        rowBounds.y >= listBounds.y &&
        rowBounds.bottom <= listBounds.bottom
      )
    })
    const panelBounds = panels.map((panel) => bounds(panel))
    const componentBounds = bounds(component)
    const widthRatios = panelBounds.map((panel) =>
      panel && componentBounds ? Math.round((panel.width / componentBounds.width) * 1000) / 1000 : null,
    )
    const controls = [...(component?.querySelectorAll('.lx-transfer-panel__controls-action > button') ?? [])]
    const controlsTrack = component?.querySelector('.lx-transfer-panel__controls')
    const mobileTabs = [...(component?.querySelectorAll('.lx-transfer-panel__mobile-switch button') ?? [])]
    const longName = selectedRows.find((row) => row.textContent?.includes('历史授权单位'))
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
      preview: bounds(preview),
      previewMaxWidth: getComputedStyle(preview).maxWidth,
      component: componentBounds,
      panelBounds,
      panelWidthRatios: widthRatios,
      controlsTrack: bounds(controlsTrack),
      sourceHeader: {
        titleText: sourceTitle?.textContent?.trim(),
        actionsText: sourceActions?.textContent?.trim(),
        title: bounds(sourceTitle),
        actions: bounds(sourceActions),
        overlap: intersect(bounds(sourceTitle), bounds(sourceActions)),
      },
      tree: {
        viewport: bounds(treeViewport),
        visibleVirtualRows: treeRows.length,
        rowBounds: treeRows.map(bounds),
      },
      selectedList: {
        viewport: listBounds,
        scrollHeight: list?.scrollHeight ?? null,
        clientHeight: list?.clientHeight ?? null,
        itemCount: selectedRows.length,
        visibleItemCount: visibleSelectedRows.length,
        fullyVisibleItemCount: fullyVisibleSelectedRows.length,
        visibleRows: visibleSelectedRows.map(bounds),
        longItem: longName ? bounds(longName) : null,
        scrollHint: selectedPanel?.querySelector('.lx-transfer-panel__selected-scroll-hint')?.textContent?.trim(),
      },
      controls: controls.map((button) => ({
        name: button.getAttribute('aria-label'),
        disabled: button.disabled,
        bounds: bounds(button),
      })),
      mobileTabs: mobileTabs.map((button) => ({
        label: button.getAttribute('aria-label'),
        pressed: button.getAttribute('aria-pressed'),
        bounds: bounds(button),
      })),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
  await page.screenshot({ path: path.join(outputDir, name), animations: 'disabled' })
  return measurement
}

try {
  await mkdir(outputDir, { recursive: true })
  const evidence = {
    browser: { engine: 'Microsoft Edge', version: browser.version() },
    sourceHashesBefore: await sourceHashes(),
    desktop1440: await capture('desktop-1440x900.png', { width: 1440, height: 900 }),
    desktop1024: await capture('desktop-1024x900.png', { width: 1024, height: 900 }),
    mobile390Source: await capture('mobile-390x844-source.png', { width: 390, height: 844 }),
    mobile390Selected: await capture('mobile-390x844-selected.png', { width: 390, height: 844 }, true),
    mobile320Source: await capture('mobile-320x844-source.png', { width: 320, height: 844 }),
    mobile320Selected: await capture('mobile-320x844-selected.png', { width: 320, height: 844 }, true),
    pageErrors,
  }
  evidence.sourceHashesAfter = await sourceHashes()
  evidence.capturedAt = new Date().toISOString()
  evidence.sourceStableDuringCapture =
    JSON.stringify(evidence.sourceHashesBefore) ===
    JSON.stringify(evidence.sourceHashesAfter)
  await writeFile(
    path.join(outputDir, 'browser-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
  process.stdout.write(
    `${JSON.stringify(
      {
        browser: evidence.browser,
        sourceHashesBefore: evidence.sourceHashesBefore,
        sourceHashesAfter: evidence.sourceHashesAfter,
        capturedAt: evidence.capturedAt,
        sourceStableDuringCapture: evidence.sourceStableDuringCapture,
        pageErrors,
        viewports: Object.fromEntries(
          Object.entries(evidence)
            .filter(([, value]) => value?.viewport)
            .map(([name, value]) => [name, {
              viewport: value.viewport,
              preview: value.preview,
              component: value.component,
              panels: value.panelBounds,
              panelWidthRatios: value.panelWidthRatios,
              controlsTrack: value.controlsTrack,
              sourceHeader: value.sourceHeader,
              treeRows: value.tree.visibleVirtualRows,
              selectedList: value.selectedList,
              document: value.document,
              mobileTabs: value.mobileTabs,
            }]),
        ),
      },
      null,
      2,
    )}\n`,
  )
} finally {
  await context.close()
  await browser.close()
}
