import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const repoRoot = process.cwd()
const outputRoot = path.resolve(
  repoRoot,
  '.impeccable/critique/wave4-dynamicform-2026-10-07/assessment-b-postfix-final-2026-10-07',
)
const docsBaseUrl = process.argv[2] || 'http://127.0.0.1:4174'
const detectorUrl = process.argv[3]

if (!detectorUrl) {
  throw new Error('Usage: node capture-browser-evidence.mjs <docs-base-url> <detector-url>')
}

const playwrightEntry = path.join(
  repoRoot,
  'other-admin/admin-vue3/node_modules/.pnpm/playwright@1.58.0/node_modules/playwright/index.mjs',
)
const { chromium } = await import(pathToFileURL(playwrightEntry).href)
const browserCache = path.join(
  process.env.LOCALAPPDATA || '',
  'ms-playwright',
)
const browserVersions = (await fs.readdir(browserCache, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
  .sort((left, right) => Number(right.name.slice(9)) - Number(left.name.slice(9)))
let browserExecutable
const browserCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ...browserVersions.map((entry) =>
    path.join(browserCache, entry.name, 'chrome-win64', 'chrome.exe'),
  ),
]
for (const candidate of browserCandidates) {
  try {
    await fs.access(candidate)
    browserExecutable = candidate
    break
  } catch {
    // 继续查找已安装的 Chromium 版本。
  }
}
if (!browserExecutable) throw new Error(`No installed Chromium found in ${browserCache}`)
const targets = [
  {
    slug: 'lxdynamicform',
    route: '/components/lxdynamicform',
    componentSelector: '.dynamic-form-demo',
    hudToggleLabel: '文档站整体深色（HUD）',
    hudToggleDisclosure: '.dynamic-form-demo__settings',
    sourceDir: 'linkx-fe/src/components/LxDynamicForm',
    docFile: 'linkx-fe/docs/components/lxdynamicform.md',
  },
  {
    slug: 'lxdatepicker',
    route: '/components/lxdatepicker',
    componentSelector: '.lx-date-picker-demo',
    hudToggleLabel: 'HUD 深色主题',
    sourceDir: 'linkx-fe/src/components/LxDatePicker',
    docFile: 'linkx-fe/docs/components/lxdatepicker.md',
  },
  {
    slug: 'lxupload',
    route: '/components/lxupload',
    componentSelector: '.lx-upload-demo',
    hudToggleLabel: 'HUD 深色主题',
    sourceDir: 'linkx-fe/src/components/LxUpload',
    docFile: 'linkx-fe/docs/components/lxupload.md',
  },
]
const views = [
  { id: 'desktop-light', width: 1440, height: 1000, hud: false },
  { id: 'desktop-hud', width: 1440, height: 1000, hud: true },
  { id: 'mobile-375-light', width: 375, height: 812, hud: false },
]
const attributionSelectors = {
  component: [
    '.dynamic-form-demo',
    '.lx-date-picker-demo',
    '.lx-upload-demo',
    '.lx-dynamic-form',
    '.lx-date-picker',
    '.lx-upload',
  ],
  shell: [
    '.VPNavBar',
    '.VPSidebar',
    '.VPFooter',
    '.VPDocFooter',
    '.VPDocAside',
    '.VPContent',
    '.VPDoc',
    '.VPHome',
  ],
}

await fs.mkdir(path.join(outputRoot, 'browser-evidence', 'screenshots'), {
  recursive: true,
})

async function sourceHashes() {
  const entries = []
  for (const target of targets) {
    const dir = path.join(repoRoot, target.sourceDir)
    const files = await fs.readdir(dir, { recursive: true, withFileTypes: true })
    for (const file of files) {
      if (!file.isFile()) continue
      const absolutePath = path.join(file.parentPath || file.path, file.name)
      entries.push(absolutePath)
    }
    entries.push(path.join(repoRoot, target.docFile))
  }
  const linkedDependency = path.join(
    repoRoot,
    'linkx-fe/src/components/LxForm/LxFormItem.vue',
  )
  entries.push(linkedDependency)

  const uniquePaths = [...new Set(entries)].sort()
  const hashed = await Promise.all(
    uniquePaths.map(async (absolutePath) => {
      const content = await fs.readFile(absolutePath)
      return {
        path: path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/'),
        sha256: createHash('sha256').update(content).digest('hex'),
        bytes: content.byteLength,
        linkedDependency: absolutePath === linkedDependency,
      }
    }),
  )
  return hashed
}

function summarizeAttribution(rows) {
  return rows.map((row) => {
    if (row.isPageLevel) return { ...row, attribution: '页面级 / 文档外壳' }
    if (row.componentRoot) return { ...row, attribution: '组件 Demo / 目标组件区域' }
    if (row.shellRoot) return { ...row, attribution: 'VitePress 文档外壳' }
    return { ...row, attribution: '待人工核对' }
  })
}

const beforeHashes = await sourceHashes()
const browser = await chromium.launch({ headless: true, executablePath: browserExecutable })
const targetResults = []
let failed = false

try {
  for (const target of targets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    const consoleLog = []
    const pageErrors = []
    page.on('console', (message) => {
      consoleLog.push({ type: message.type(), text: message.text() })
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    const targetResult = {
      target: target.slug,
      url: `${docsBaseUrl}${target.route}`,
      contextCreated: true,
      views: [],
      pageErrors,
    }

    try {
      const response = await page.goto(targetResult.url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })
      targetResult.httpStatus = response?.status() ?? null
      targetResult.pageTitle = await page.title()
      targetResult.componentDemoFound = (await page.locator(target.componentSelector).count()) > 0
      if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status()}`)
      if (!targetResult.componentDemoFound) {
        throw new Error(`Component demo not found: ${target.componentSelector}`)
      }

      const preflight = await page.evaluate(() => {
        const oldTitle = document.title
        const markerTitle = `${oldTitle} [Assessment B]`
        document.title = markerTitle
        const marker = document.createElement('script')
        marker.type = 'application/json'
        marker.dataset.assessmentBPreflight = 'true'
        marker.textContent = '{}'
        document.head.appendChild(marker)
        return {
          titleChanged: document.title === markerTitle,
          scriptAppended: marker.isConnected && marker.tagName === 'SCRIPT',
          markerTitle,
          oldTitle,
        }
      })
      targetResult.mutationPreflight = preflight
      if (!preflight.titleChanged || !preflight.scriptAppended) {
        throw new Error('Mutable injection preflight failed')
      }

      const scriptResponse = await page.addScriptTag({ url: detectorUrl })
      targetResult.detectorInjected = Boolean(scriptResponse)
      await page.waitForFunction(
        () => typeof window.impeccableScan === 'function'
          && typeof window.impeccableDetect === 'function',
        null,
        { timeout: 10000 },
      )
      targetResult.detectorReady = true
      await page.evaluate((title) => { document.title = title }, preflight.oldTitle)
      let hudEnabled = false

      for (const view of views) {
        await page.setViewportSize({ width: view.width, height: view.height })
        await page.emulateMedia({ colorScheme: 'light' })
        if (hudEnabled !== view.hud) {
          const hudText = page.getByText(target.hudToggleLabel, { exact: true }).first()
          let openedDisclosure = false
          if (!(await hudText.isVisible().catch(() => false)) && target.hudToggleDisclosure) {
            const disclosure = page.locator(target.hudToggleDisclosure)
            const isOpen = await disclosure.evaluate((element) => element.open)
            if (!isOpen) {
              await disclosure.locator('summary').click({ timeout: 10000 })
              openedDisclosure = true
            }
          }
          await hudText.click({ timeout: 10000 })
          if (openedDisclosure) {
            await page.locator(target.hudToggleDisclosure).locator('summary').click({ timeout: 10000 })
          }
          hudEnabled = view.hud
        }
        await page.waitForTimeout(350)

        const consoleStart = consoleLog.length
        const scan = await page.evaluate(() => {
          const raw = window.impeccableScan()
          const findings = window.impeccableDetect()
          const attribution = findings.map((row) => {
            const element = row.selector ? document.querySelector(row.selector) : null
            const componentRoot = element?.closest(
              '.dynamic-form-demo, .lx-date-picker-demo, .lx-upload-demo, .lx-dynamic-form, .lx-date-picker, .lx-upload',
            )
            const shellRoot = element?.closest(
              '.VPNavBar, .VPSidebar, .VPFooter, .VPDocFooter, .VPDocAside, .VPContent, .VPDoc, .VPHome',
            )
            return {
              ...row,
              componentRoot: componentRoot?.className?.baseVal ?? componentRoot?.className ?? null,
              shellRoot: shellRoot?.className?.baseVal ?? shellRoot?.className ?? null,
            }
          })
          return {
            rawGroupCount: raw.length,
            findings: attribution,
            detectorGlobals: {
              scan: typeof window.impeccableScan,
              detect: typeof window.impeccableDetect,
            },
          }
        })
        await page.waitForTimeout(2300)
        const overlayVisibility = await page.evaluate(() => {
          const overlays = Array.from(document.querySelectorAll('.impeccable-overlay'))
          const describe = (element) => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()
            return {
              className: typeof element.className === 'string' ? element.className : '',
              text: (element.textContent || '').trim().slice(0, 120),
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            }
          }
          const described = overlays.map((element) => ({ element, state: describe(element) }))
          const visible = described.filter(({ state }) =>
            state.display !== 'none'
              && state.visibility !== 'hidden'
              && Number(state.opacity) > 0
              && state.width > 0
              && state.height > 0,
          )
          return {
            total: overlays.length,
            visible: visible.length,
            hidden: overlays.length - visible.length,
            visibleSamples: visible.slice(0, 5).map(({ state }) => state),
            hiddenSamples: described.filter(({ state }) =>
              state.display === 'none' || state.visibility === 'hidden' || Number(state.opacity) === 0,
            ).slice(0, 3).map(({ state }) => state),
          }
        })
        const consoleForView = consoleLog.slice(consoleStart)
        const errorsForView = pageErrors.slice()
        const screenshotPath = path.join(
          outputRoot,
          'browser-evidence',
          'screenshots',
          `${target.slug}-${view.id}.png`,
        )
        await page.screenshot({ path: screenshotPath, animations: 'disabled' })
        const summarized = summarizeAttribution(scan.findings)
        const viewResult = {
          id: view.id,
          viewport: { width: view.width, height: view.height },
          theme: view.hud ? 'HUD' : 'light',
          detectorRun: true,
          rawGroupCount: scan.rawGroupCount,
          overlayCount: overlayVisibility.total,
          visibleOverlayCount: overlayVisibility.visible,
          hiddenOverlayCount: overlayVisibility.hidden,
          overlayComputedStyleSamples: {
            visible: overlayVisibility.visibleSamples,
            hidden: overlayVisibility.hiddenSamples,
          },
          findings: summarized,
          console: consoleForView,
          pageErrors: errorsForView,
          screenshot: path.relative(outputRoot, screenshotPath).replaceAll(path.sep, '/'),
        }
        targetResult.views.push(viewResult)
        if (scan.overlayCount < 1) {
          viewResult.overlayStatus = '注入成功，但未生成可见标注元素'
        } else {
          viewResult.overlayStatus = '注入与 overlay 生成成功'
        }
      }
      targetResult.status = 'success'
    } catch (error) {
      failed = true
      targetResult.status = 'failed'
      targetResult.failure = error instanceof Error ? error.message : String(error)
      targetResult.console = consoleLog
    } finally {
      await context.close()
      targetResults.push(targetResult)
    }
  }
} finally {
  await browser.close()
}

const afterHashes = await sourceHashes()
const hashesStable = JSON.stringify(beforeHashes) === JSON.stringify(afterHashes)
await fs.writeFile(
  path.join(outputRoot, 'browser-evidence', 'source-hashes.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), stableAcrossCapture: hashesStable, files: afterHashes }, null, 2)}\n`,
)

const browserEvidence = {
  capturedAt: new Date().toISOString(),
  docsBaseUrl,
  detectorUrl,
  browserExecutable,
  freshContextPerTarget: true,
  screenshotsPerTarget: views.map(({ id }) => id),
  sourceHashesStableAcrossCapture: hashesStable,
  targets: targetResults,
}
await fs.writeFile(
  path.join(outputRoot, 'browser-evidence', 'browser-evidence.json'),
  `${JSON.stringify(browserEvidence, null, 2)}\n`,
)

if (failed || !hashesStable) process.exitCode = 1
