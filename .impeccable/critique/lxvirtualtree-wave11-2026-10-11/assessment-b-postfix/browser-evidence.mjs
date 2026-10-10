import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawn, spawnSync } from 'node:child_process'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')

const outputDir = path.dirname(new URL(import.meta.url).pathname).replace(
  /^\/(\w:)/,
  '$1',
)
const workspaceRoot = path.resolve(outputDir, '../../../..')
const linkxFeRoot = path.join(workspaceRoot, 'linkx-fe')
const liveServerScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
const liveServerPort = 8427
const vitepressPort = 5194

fs.mkdirSync(outputDir, { recursive: true })

function writeJson(fileName, value) {
  fs.writeFileSync(
    path.join(outputDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  )
}

function writeText(fileName, value) {
  fs.writeFileSync(path.join(outputDir, fileName), value, 'utf8')
}

async function waitForHttp(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  let lastError = ''
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) return response.status
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`等待 ${url} 超时：${lastError}`)
}

function stopProcessTree(pid) {
  if (!pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // 进程可能已自行退出。
  }
}

async function startVitePress() {
  const stdoutPath = path.join(outputDir, 'vitepress.stdout.log')
  const stderrPath = path.join(outputDir, 'vitepress.stderr.log')
  const stdout = fs.createWriteStream(stdoutPath, { flags: 'w' })
  const stderr = fs.createWriteStream(stderrPath, { flags: 'w' })
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const processHandle = spawn(
    command,
    ['dev', '--host', '127.0.0.1', '--port', String(vitepressPort), '--strictPort'],
    {
      cwd: linkxFeRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      windowsHide: true,
    },
  )
  processHandle.stdout.pipe(stdout)
  processHandle.stderr.pipe(stderr)
  writeText('vitepress.pid.txt', `${processHandle.pid ?? ''}\n`)
  await waitForHttp(`http://127.0.0.1:${vitepressPort}/components/lxvirtualtree`)
  return {
    processHandle,
    close: () => {
      stopProcessTree(processHandle.pid)
      stdout.end()
      stderr.end()
    },
  }
}

async function startOverlayServer() {
  const stdoutPath = path.join(outputDir, 'overlay-server.stdout.log')
  const stderrPath = path.join(outputDir, 'overlay-server.stderr.log')
  const stdout = fs.createWriteStream(stdoutPath, { flags: 'w' })
  const stderr = fs.createWriteStream(stderrPath, { flags: 'w' })
  const processHandle = spawn(
    process.execPath,
    [liveServerScript, `--port=${liveServerPort}`],
    {
      cwd: workspaceRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  )
  processHandle.stdout.pipe(stdout)
  processHandle.stderr.pipe(stderr)
  writeText('overlay-server.pid.txt', `${processHandle.pid ?? ''}\n`)
  await waitForHttp(`http://127.0.0.1:${liveServerPort}/health`)
  writeText(
    'service-stop.txt',
    `VitePress: taskkill /PID ${processHandle.pid ?? '<pid>'} /T /F\n` +
      `Overlay: node ${liveServerScript} stop --keep-inject\n`,
  )
  return {
    processHandle,
    close: () => {
      spawnSync(process.execPath, [liveServerScript, 'stop', '--keep-inject'], {
        cwd: workspaceRoot,
        stdio: 'ignore',
        windowsHide: true,
      })
      stopProcessTree(processHandle.pid)
      stdout.end()
      stderr.end()
    },
  }
}

async function openRoute(page, route, waitForSelector) {
  await page.goto(`http://127.0.0.1:${vitepressPort}${route}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForSelector(waitForSelector, { timeout: 30_000 })
  await page.waitForTimeout(400)
}

async function openDetails(locator) {
  if ((await locator.getAttribute('open')) === null) {
    await locator.locator('summary').first().click()
  }
}

async function injectOverlay(page, label) {
  const src = `http://127.0.0.1:${liveServerPort}/detect.js`
  const preflight = await page.evaluate((title) => {
    document.title = title
    return {
      title: document.title,
      bodyPresent: Boolean(document.body),
      mutationAvailable: typeof document.createElement === 'function',
    }
  }, `[Human] ${label}`)
  const injection = await page.evaluate(
    (scriptSource) =>
      new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = scriptSource
        script.dataset.impeccableAssessment = 'B-postfix'
        script.onload = () => resolve({ ok: true, src: script.src })
        script.onerror = () => resolve({ ok: false, src: script.src })
        document.head.appendChild(script)
      }),
    src,
  )
  await page.waitForTimeout(400)
  const detectResult = await page.evaluate(() => {
    if (typeof window.impeccableDetect !== 'function') return null
    return window.impeccableDetect()
  })
  await page.evaluate(() => {
    if (typeof window.impeccableScan === 'function') window.impeccableScan()
  })
  await page.waitForTimeout(2_400)
  const overlayState = await page.evaluate(() => ({
    scriptPresent: Boolean(
      document.querySelector('script[data-impeccable-assessment="B-postfix"]'),
    ),
    overlayCount: document.querySelectorAll('.impeccable-overlay').length,
    bannerCount: document.querySelectorAll('.impeccable-banner').length,
  }))
  return { preflight, injection, detectResult, overlayState }
}

async function box(page, selector) {
  const locator = page.locator(selector).first()
  if ((await locator.count()) === 0) return null
  const rect = await locator.boundingBox()
  if (!rect) return null
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }
}

async function collectMeasurements(page, viewName, overlayEvidence) {
  const domMeasure = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const box = element.getBoundingClientRect()
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
      }
    }
    const active = document.activeElement
    const tree = document.querySelector('[role="tree"]')
    const selectedList = document.querySelector('.lx-transfer-panel__selected')
    const slotStress = document.querySelector('.virtual-tree-demo__slot-stress')
    return {
      title: document.title,
      url: location.href,
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      },
      scroll: {
        documentScrollWidth: document.documentElement.scrollWidth,
        documentScrollHeight: document.documentElement.scrollHeight,
        bodyScrollWidth: document.body?.scrollWidth ?? null,
      },
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      component: {
        virtualDemo: rect('.virtual-tree-demo'),
        virtualPreview: rect('.virtual-tree-demo__preview'),
        transferDemo: rect('.transfer-panel-demo'),
        transferPanel: rect('.lx-transfer-panel'),
        sourcePanel: rect('.lx-transfer-panel__panel[aria-labelledby*="source"]'),
        selectedPanel: rect('.lx-transfer-panel__panel[aria-labelledby*="selected"]'),
        tree: rect('[role="tree"]'),
        selectedList: rect('.lx-transfer-panel__selected'),
        slotStress: rect('.virtual-tree-demo__slot-stress'),
      },
      counts: {
        treeItems: tree?.querySelectorAll('[role="treeitem"]').length ?? 0,
        selectedItems: document.querySelectorAll('.lx-transfer-panel__selected-item').length,
        rows: document.querySelectorAll('.lx-virtual-tree__row').length,
        overlayNodes: document.querySelectorAll('.impeccable-overlay').length,
      },
      focus: active
        ? {
            tagName: active.tagName.toLowerCase(),
            className: active.className,
            role: active.getAttribute('role'),
            ariaLabel: active.getAttribute('aria-label'),
            text: active.textContent?.trim().slice(0, 160) ?? '',
          }
        : null,
      classes: {
        virtualPreview: document.querySelector('.virtual-tree-demo__preview')?.className ?? '',
        transferPreview: document.querySelector('.transfer-panel-demo__preview')?.className ?? '',
      },
      selectedListScroll: selectedList
        ? {
            clientHeight: selectedList.clientHeight,
            scrollHeight: selectedList.scrollHeight,
            scrollTop: selectedList.scrollTop,
          }
        : null,
      slotStressText: slotStress?.textContent?.trim() ?? null,
    }
  })
  const domHtml = await page.locator('body').evaluate((element) => element.outerHTML)
  writeJson(`${viewName}/dom-measure.json`, {
    ...domMeasure,
    overlay: overlayEvidence.overlayState,
  })
  writeText(`${viewName}/dom.html`, domHtml)
  return domMeasure
}

async function runView(browser, {
  name,
  label,
  route,
  viewport,
  reducedMotion = 'no-preference',
  setup,
  waitForSelector,
}) {
  const viewDir = path.join(outputDir, name)
  fs.mkdirSync(viewDir, { recursive: true })
  const context = await browser.newContext({ viewport, reducedMotion })
  const page = await context.newPage()
  const consoleEvents = []
  const pageErrors = []
  const requestFailures = []
  page.on('console', (message) => {
    consoleEvents.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('pageerror', (error) => {
    pageErrors.push({ name: error.name, message: error.message, stack: error.stack })
  })
  page.on('requestfailed', (request) => {
    requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      resourceType: request.resourceType(),
    })
  })

  let interactionError = null
  let overlayEvidence = null
  let measurement = null
  try {
    await openRoute(page, route, waitForSelector)
    try {
      await setup(page)
    } catch (error) {
      interactionError = error instanceof Error ? error.message : String(error)
    }
    overlayEvidence = await injectOverlay(page, label)
    measurement = await collectMeasurements(page, name, overlayEvidence)
    await page.screenshot({
      path: path.join(viewDir, 'screenshot.png'),
      fullPage: false,
    })
  } catch (error) {
    interactionError = interactionError ?? (error instanceof Error ? error.message : String(error))
  }

  writeJson(`${name}/script-injection.json`, {
    label,
    route,
    viewport,
    reducedMotion,
    overlay: overlayEvidence,
    interactionError,
  })
  writeJson(`${name}/console.json`, consoleEvents)
  writeJson(`${name}/page-errors.json`, pageErrors)
  writeJson(`${name}/request-failures.json`, requestFailures)
  writeJson(`${name}/summary.json`, {
    name,
    label,
    route,
    viewport,
    reducedMotion,
    interactionError,
    measurement,
    pageErrors: pageErrors.length,
    requestFailures: requestFailures.length,
    consoleFindingMessages: consoleEvents.filter((entry) =>
      entry.text.includes('[impeccable]'),
    ),
  })

  await context.close()
  return {
    name,
    viewport,
    interactionError,
    overlay: overlayEvidence?.overlayState ?? null,
    pageErrors: pageErrors.length,
    requestFailures: requestFailures.length,
    measurement,
  }
}

async function main() {
  const failurePath = path.join(outputDir, 'browser-evidence.failure.txt')
  if (fs.existsSync(failurePath)) fs.rmSync(failurePath, { force: true })
  let vitepress = null
  let overlay = null
  let browser = null
  const results = []
  try {
    vitepress = await startVitePress()
    overlay = await startOverlayServer()
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    })
    results.push(
      await runView(browser, {
        name: 'virtualtree-desktop-light',
        label: 'LxVirtualTree 桌面浅色',
        route: '/components/lxvirtualtree',
        viewport: { width: 1440, height: 900 },
        waitForSelector: '.virtual-tree-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.virtual-tree-demo__controls'))
        },
      }),
    )
    results.push(
      await runView(browser, {
        name: 'virtualtree-hud-375',
        label: 'LxVirtualTree 375px HUD',
        route: '/components/lxvirtualtree',
        viewport: { width: 375, height: 812 },
        waitForSelector: '.virtual-tree-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.virtual-tree-demo__controls'))
          await openDetails(
            page.locator('.virtual-tree-demo__advanced').filter({ hasText: '边界与外观' }),
          )
          await page
            .locator('label')
            .filter({ hasText: 'HUD 深色主题' })
            .locator('input')
            .check()
        },
      }),
    )
    results.push(
      await runView(browser, {
        name: 'virtualtree-slot-desktop',
        label: 'LxVirtualTree 桌面多行 slot',
        route: '/components/lxvirtualtree',
        viewport: { width: 1280, height: 900 },
        waitForSelector: '.virtual-tree-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.virtual-tree-demo__controls'))
          await openDetails(
            page.locator('.virtual-tree-demo__advanced').filter({ hasText: '边界与外观' }),
          )
          await page
            .locator('label')
            .filter({ hasText: '多行插槽压力测试' })
            .locator('input')
            .check()
        },
      }),
    )
    results.push(
      await runView(browser, {
        name: 'virtualtree-narrow-390-keyboard',
        label: 'LxVirtualTree 390px 键盘',
        route: '/components/lxvirtualtree',
        viewport: { width: 390, height: 844 },
        waitForSelector: '.virtual-tree-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.virtual-tree-demo__controls'))
          const firstRow = page.getByRole('tree', { name: '组织结构' }).getByRole('treeitem').first()
          await firstRow.focus()
          await firstRow.press('ArrowRight')
        },
      }),
    )
    results.push(
      await runView(browser, {
        name: 'transferpanel-desktop-source-selected',
        label: 'LxTransferPanel 桌面待选已选长名称键盘',
        route: '/components/lxtransferpanel',
        viewport: { width: 1440, height: 900 },
        waitForSelector: '.transfer-panel-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.transfer-panel-demo__settings'))
          const sourceFilter = page.getByRole('textbox', {
            name: '按机构名称或部门编码筛选待选节点',
          })
          await sourceFilter.fill('待授权特勤支队')
          await page.waitForTimeout(200)
          await sourceFilter.fill('')
          const candidate = page
            .locator('.lx-transfer-panel [role="treeitem"]')
            .filter({ hasText: '站前路派出所综合作战室' })
            .first()
          if ((await candidate.count()) > 0) {
            await candidate.focus()
            await candidate.press('Space')
            await page.waitForTimeout(120)
          }
          const longItem = page
            .locator('.lx-transfer-panel__selected-item')
            .filter({ hasText: '历史授权单位（记录中）' })
            .first()
          const disclosure = longItem.locator('.lx-transfer-panel__selected-name-disclosure summary')
          if ((await disclosure.count()) > 0) await disclosure.click()
          const selectedList = page.locator('.lx-transfer-panel__selected').first()
          await selectedList.focus()
          await selectedList.press('ArrowDown')
        },
      }),
    )
    results.push(
      await runView(browser, {
        name: 'transferpanel-narrow-390-reduced-motion',
        label: 'LxTransferPanel 390px HUD 减少动效',
        route: '/components/lxtransferpanel',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
        waitForSelector: '.transfer-panel-demo__preview',
        setup: async (page) => {
          await openDetails(page.locator('.transfer-panel-demo__settings'))
          await page
            .locator('label')
            .filter({ hasText: 'HUD 深色主题' })
            .locator('input')
            .check()
          const sourceFilter = page.getByRole('textbox', {
            name: '按机构名称或部门编码筛选待选节点',
          })
          await sourceFilter.fill('ORG-01')
          await page.waitForTimeout(200)
          await page.getByRole('button', { name: '清除待选节点筛选' }).click()
          await page.getByTestId('mobile-selected-panel').click()
          const selectedList = page.locator('.lx-transfer-panel__selected').first()
          await selectedList.focus()
          await selectedList.press('ArrowDown')
          const longItem = page
            .locator('.lx-transfer-panel__selected-item')
            .filter({ hasText: '历史授权单位（记录中）' })
            .first()
          const disclosure = longItem.locator('.lx-transfer-panel__selected-name-disclosure summary')
          if ((await disclosure.count()) > 0) await disclosure.click()
        },
      }),
    )
  } finally {
    if (browser) await browser.close().catch(() => undefined)
    if (overlay) overlay.close()
    if (vitepress) vitepress.close()
  }

  writeJson('run-summary.json', {
    method: 'dual-agent (A: pending · B: virtualtree_assessment_b_postfix_luna)',
    vitepressPort,
    liveOverlayPort: liveServerPort,
    views: results,
    allPagesErrorFree: results.every((result) => result.pageErrors === 0),
    allRequestFailureFree: results.every((result) => result.requestFailures === 0),
  })
}

main().catch((error) => {
  writeText(
    'browser-evidence.failure.txt',
    error instanceof Error ? `${error.stack ?? error.message}\n` : `${String(error)}\n`,
  )
  process.exitCode = 1
})
