const fs = require('node:fs/promises')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..', '..', '..', '..', '..')
const outputDir = __dirname
const playwrightPath = path.join(
  rootDir,
  'other-admin',
  'admin-vue3',
  'node_modules',
  '.pnpm',
  'playwright@1.58.0',
  'node_modules',
  'playwright',
)
const { chromium } = require(playwrightPath)
const pageUrl = 'http://127.0.0.1:4195/components/lxswitch.html'
const detectorUrl = 'http://127.0.0.1:8400/detect.js'
const browserMessages = []
const pageErrors = []

function round(value) {
  return Math.round(value * 100) / 100
}

async function readEvidence(page) {
  return page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return {
        x: Math.round(bounds.x * 100) / 100,
        y: Math.round(bounds.y * 100) / 100,
        width: Math.round(bounds.width * 100) / 100,
        height: Math.round(bounds.height * 100) / 100,
        right: Math.round(bounds.right * 100) / 100,
        bottom: Math.round(bounds.bottom * 100) / 100,
      }
    }

    const root = document.documentElement
    const body = document.body
    const scrollRoot = document.scrollingElement
    const rows = Array.from(
      document.querySelectorAll('.vp-doc .lx-switch-props__item'),
    )
    const metaRows = Array.from(
      document.querySelectorAll('.vp-doc .lx-switch-props__meta'),
    ).map((item) => {
      const spans = Array.from(item.querySelectorAll('span'))
      return {
        display: getComputedStyle(item).display,
        gridTemplateColumns: getComputedStyle(item).gridTemplateColumns,
        columns: spans.map((span) => rect(span)),
      }
    })
    const propsList = document.querySelector('.vp-doc .lx-switch-props')
    const propsBounds = rect(propsList)
    const propsRows = rows.map((row) => {
      const name = row.querySelector('.lx-switch-props__name')
      const detail = row.querySelector('.lx-switch-props__detail')
      const nameBounds = rect(name)
      const detailBounds = rect(detail)
      return {
        name: name?.textContent?.trim() ?? null,
        nameBounds,
        detailBounds,
        sameLine: Boolean(
          nameBounds && detailBounds &&
          Math.abs(nameBounds.y - detailBounds.y) < 1,
        ),
        rowClientWidth: row.clientWidth,
        rowScrollWidth: row.scrollWidth,
      }
    })
    const lock = document.querySelector(
      '.lx-switch-demo [role="switch"][aria-label="省厅直辖联防调度镜像（锁定）"]',
    )
    const describedBy = lock?.getAttribute('aria-describedby') ?? ''
    const description = describedBy ? document.getElementById(describedBy) : null
    const hudLabel = Array.from(document.querySelectorAll('label')).find((label) =>
      label.textContent?.includes('HUD 深色主题（全页预览）'),
    )
    const hudInput = hudLabel?.querySelector('input[type="checkbox"]') ?? null

    return {
      title: document.title,
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      pageWidth: {
        documentClientWidth: root.clientWidth,
        documentScrollWidth: root.scrollWidth,
        bodyClientWidth: body?.clientWidth ?? null,
        bodyScrollWidth: body?.scrollWidth ?? null,
        scrollRootClientWidth: scrollRoot?.clientWidth ?? null,
        scrollRootScrollWidth: scrollRoot?.scrollWidth ?? null,
        horizontalOverflow: Boolean(
          scrollRoot && scrollRoot.scrollWidth > root.clientWidth,
        ),
      },
      props: {
        listBounds: propsBounds,
        listClientWidth: propsList?.clientWidth ?? null,
        listScrollWidth: propsList?.scrollWidth ?? null,
        listHasOverflow: Boolean(
          propsList && propsList.scrollWidth > propsList.clientWidth,
        ),
        insideViewport: Boolean(
          propsBounds && propsBounds.x >= 0 && propsBounds.right <= root.clientWidth,
        ),
        rowCount: propsRows.length,
        rowsFit: propsRows.every((row) => row.rowScrollWidth <= row.rowClientWidth),
        rows: propsRows,
        metadata: {
          rowCount: metaRows.length,
          allRowsUseGrid: metaRows.every((row) => row.display === 'grid'),
          firstColumnPositions: [...new Set(
            metaRows.map((row) => row.columns[0]?.x).filter(Number.isFinite),
          )],
          secondColumnPositions: [...new Set(
            metaRows.map((row) => row.columns[1]?.x).filter(Number.isFinite),
          )],
          rows: metaRows,
        },
      },
      disabledReason: {
        controlPresent: Boolean(lock),
        disabled: Boolean(lock?.matches(':disabled')),
        describedBy,
        targetExists: Boolean(description),
        descriptionText: description?.textContent?.trim() ?? null,
        targetCount: describedBy
          ? document.querySelectorAll('#' + CSS.escape(describedBy)).length
          : 0,
      },
      hudTouchTarget: {
        labelFound: Boolean(hudLabel),
        labelBounds: rect(hudLabel),
        labelMinHeight: hudLabel ? getComputedStyle(hudLabel).minHeight : null,
        inputBounds: rect(hudInput),
        labelAtLeast44pxHigh: Boolean(hudLabel && hudLabel.getBoundingClientRect().height >= 44),
      },
      htmlClasses: root.className,
    }
  })
}

async function captureViewport(page, width, height, stage) {
  await page.setViewportSize({ width, height })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  const top = await readEvidence(page)
  await page.screenshot({
    path: path.join(outputDir, 'browser-' + width + '-' + stage + '-top.png'),
    animations: 'disabled',
  })

  await page.locator('.vp-doc .lx-switch-props').scrollIntoViewIfNeeded()
  const props = await readEvidence(page)
  await page.screenshot({
    path: path.join(outputDir, 'browser-' + width + '-' + stage + '-props.png'),
    animations: 'disabled',
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  return { top, props }
}

async function main() {
  const result = {
    requestedUrl: pageUrl,
    detectorUrl,
    browser: null,
    navigation: null,
    preflight: null,
    detectorInjection: null,
    viewports: {},
    browserMessages,
    pageErrors,
    limitations: [
      'CUA 浏览器列表为空，改用工作区 Playwright 1.58 和本机 Chrome 新建隔离 context/page。',
      '浏览器为 headless；Codex 无可控浏览器表面，未能在带 [Human] 标签的交互标签中展示页面。',
    ],
  }
  let browser

  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
    result.browser = { version: browser.version(), channel: 'chrome', headless: true }
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: 1,
      hasTouch: true,
    })
    const page = await context.newPage()
    page.on('console', (message) => {
      browserMessages.push({ type: message.type(), text: message.text() })
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const response = await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.locator('.vp-doc .lx-switch-props__item').first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(750)
    result.navigation = {
      status: response?.status() ?? null,
      finalUrl: page.url(),
      title: await page.title(),
    }

    result.viewports.desktop1440Before = await captureViewport(page, 1440, 960, 'before')
    result.viewports.mobile375Before = await captureViewport(page, 375, 812, 'before')

    await page.evaluate(() => {
      document.title = '[Human] Assessment B · LxSwitch'
      const marker = document.createElement('script')
      marker.dataset.assessmentB = 'injection-preflight'
      marker.textContent = 'window.__assessmentBPreflight = true'
      document.head.appendChild(marker)
    })
    result.preflight = await page.evaluate(() => ({
      title: document.title,
      markerPresent: Boolean(document.querySelector('script[data-assessment-b="injection-preflight"]')),
      mutationRan: window.__assessmentBPreflight === true,
    }))

    const script = await page.addScriptTag({ url: detectorUrl })
    await page.waitForTimeout(3000)
    result.detectorInjection = await page.evaluate((scriptNode) => ({
      scriptLoaded: Boolean(scriptNode?.isConnected),
      scriptSource: scriptNode?.src ?? null,
      detectorGlobals: Object.keys(window).filter((key) => /impeccable|detector/i.test(key)),
      overlayNodes: Array.from(document.querySelectorAll('body *'))
        .filter((element) => /impeccable|detector/i.test(
          (element.id || '') + ' ' + (typeof element.className === 'string' ? element.className : ''),
        ))
        .slice(0, 40)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : null,
          text: (element.textContent || '').trim().slice(0, 240),
        })),
    }), script)
    result.viewports.desktop1440After = await captureViewport(page, 1440, 960, 'after')
    result.viewports.mobile375After = await captureViewport(page, 375, 812, 'after')
    await context.close()
  } catch (error) {
    result.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    }
    process.exitCode = 1
  } finally {
    if (browser) await browser.close()
    await fs.writeFile(
      path.join(outputDir, 'browser-evidence.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), ...result }, null, 2) + '\n',
      'utf8',
    )
    process.stdout.write(JSON.stringify({
      navigation: result.navigation,
      preflight: result.preflight,
      detectorInjection: result.detectorInjection,
      viewports: Object.keys(result.viewports),
      error: result.error?.message ?? null,
    }) + '\n')
  }
}

main().catch((error) => {
  process.stderr.write((error instanceof Error ? error.stack : String(error)) + '\n')
  process.exitCode = 1
})
