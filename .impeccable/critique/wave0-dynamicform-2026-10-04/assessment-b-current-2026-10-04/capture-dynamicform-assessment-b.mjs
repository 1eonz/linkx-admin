import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const evidenceDir = path.join(
  root,
  '.impeccable/critique/wave0-dynamicform-2026-10-04/assessment-b-current-2026-10-04',
)
const skillScripts = 'C:/Users/Administrator/.codex/skills/impeccable/scripts'
const detectPath = path.join(skillScripts, 'detect.mjs')
const liveServerPath = path.join(skillScripts, 'live-server.mjs')
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const targetUrl = 'http://127.0.0.1:4189/components/lxdynamicform.html'
const require = createRequire(import.meta.url)
const { chromium } = require(path.join(
  root,
  'other-admin/admin-vue3/node_modules/@playwright/test',
))

const detectorTargets = [
  { key: 'component', path: 'linkx-fe/src/components/LxDynamicForm' },
  {
    key: 'demo',
    path: 'linkx-fe/src/components/LxDynamicForm/demo/basic.vue',
  },
  { key: 'docs', path: 'linkx-fe/docs/components/lxdynamicform.md' },
]

const views = [
  { key: 'desktop-light-default', width: 1440, height: 900 },
  { key: 'mobile-375-light-default', width: 375, height: 812 },
  {
    key: 'desktop-hud-reduced-default',
    width: 1440,
    height: 900,
    hud: true,
    reducedMotion: true,
  },
  {
    key: 'mobile-375-hud-reduced-default',
    width: 375,
    height: 812,
    hud: true,
    reducedMotion: true,
  },
]

const consoleLogs = []
const pageErrors = []
const networkEvents = []
const browserEvidence = []
let liveServerPort

function writeJson(name, value) {
  fs.writeFileSync(
    path.join(evidenceDir, name),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  )
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase()
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath]
  })
}

function fingerprints() {
  const componentRoot = path.join(root, 'linkx-fe/src/components/LxDynamicForm')
  const files = [
    ...walkFiles(componentRoot),
    path.join(root, 'linkx-fe/docs/components/lxdynamicform.md'),
  ].sort()
  return files.map((absolutePath) => {
    const stat = fs.statSync(absolutePath)
    return {
      path: path.relative(root, absolutePath).replaceAll(path.sep, '/'),
      sha256: sha256(absolutePath),
      bytes: stat.size,
      lastWriteTimeUtc: stat.mtime.toISOString(),
    }
  })
}

function runDetectors() {
  const results = []
  for (const target of detectorTargets) {
    const run = spawnSync(process.execPath, [detectPath, '--json', target.path], {
      cwd: root,
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
    })
    const prefix = `detector-${target.key}`
    fs.writeFileSync(path.join(evidenceDir, `${prefix}.stdout.json`), run.stdout ?? '', 'utf8')
    fs.writeFileSync(path.join(evidenceDir, `${prefix}.stderr.txt`), run.stderr ?? '', 'utf8')
    fs.writeFileSync(
      path.join(evidenceDir, `${prefix}.exit-code.txt`),
      `${run.status ?? 'null'}\n`,
      'utf8',
    )
    let parsed = null
    let jsonError = null
    try {
      parsed = JSON.parse(run.stdout ?? '')
    } catch (error) {
      jsonError = String(error)
    }
    results.push({
      target: target.path,
      exitCode: run.status,
      spawnError: run.error?.message ?? null,
      stderr: run.stderr ?? '',
      legalJson: jsonError === null,
      jsonError,
      findingCount: Array.isArray(parsed) ? parsed.length : null,
      stdoutChars: (run.stdout ?? '').length,
    })
  }
  writeJson('detector-validation.json', results)
  return results
}

function attachListeners(page, view) {
  page.on('console', (message) => {
    consoleLogs.push({
      view,
      type: message.type(),
      text: message.text(),
      location: message.location(),
    })
  })
  page.on('pageerror', (error) => {
    pageErrors.push({ view, error: error.stack || error.message })
  })
  page.on('request', (request) => {
    networkEvents.push({
      view,
      event: 'request',
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
    })
  })
  page.on('requestfailed', (request) => {
    networkEvents.push({
      view,
      event: 'requestfailed',
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
      failure: request.failure()?.errorText ?? 'unknown',
    })
  })
  page.on('response', (response) => {
    networkEvents.push({
      view,
      event: 'response',
      status: response.status(),
      url: response.url(),
    })
  })
}

async function readState(page) {
  return page.evaluate(() => {
    const demo = document.querySelector('.dynamic-form-demo')
    const text = demo?.innerText ?? ''
    const html = document.documentElement
    const body = document.body
    return {
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentClientWidth: html.clientWidth,
      documentScrollWidth: html.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      horizontalOverflow:
        html.scrollWidth > window.innerWidth + 1 || body.scrollWidth > window.innerWidth + 1,
      demoSettingsOpen: Boolean(
        document.querySelector('details.dynamic-form-demo__settings[open]'),
      ),
      formFieldLabels: [...(demo?.querySelectorAll('.el-form-item__label') ?? [])]
        .map((element) => element.textContent?.trim())
        .filter(Boolean),
      formErrorCount: demo?.querySelectorAll('.el-form-item.is-error').length ?? 0,
      candidateLoadingVisible: text.includes('候选人员加载中'),
      candidateEmptyVisible: text.includes('暂无候选人员'),
      candidateErrorVisible: text.includes('候选人员读取失败'),
      retryButtonCount: [...(demo?.querySelectorAll('button') ?? [])]
        .filter((button) => button.innerText.trim() === '重试').length,
      uploadNames: ['东门现场.jpg', '西门现场.jpg'].filter((name) => text.includes(name)),
      mockUploadNameVisible: text.includes('assessment-b-mock-image.png'),
      uploadingFileCount: demo?.querySelectorAll('.lx-upload__file.is-uploading').length ?? 0,
      successfulFileCount: demo?.querySelectorAll('.lx-upload__file.is-success').length ?? 0,
      disabledFieldCount: demo?.querySelectorAll('.el-form .is-disabled').length ?? 0,
      hudThemeApplied:
        document.documentElement.classList.contains('lx-theme-hud') ||
        Boolean(document.querySelector('.dynamic-form-demo.lx-theme-hud')),
      darkThemeApplied: document.documentElement.classList.contains('dark'),
      reducedMotionMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      overlayNodeCount: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
      detectorAvailable: typeof window.impeccableScanAsync === 'function',
    }
  })
}

async function openPage(browser, view) {
  const context = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    colorScheme: view.hud ? 'dark' : 'light',
    reducedMotion: view.reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  attachListeners(page, view.key)
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.locator('.dynamic-form-demo').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(500)
  const preflight = await page.evaluate(() => {
    const originalTitle = document.title
    document.title = '[Human] LxDynamicForm Assessment B'
    const probe = document.createElement('script')
    probe.dataset.assessmentBProbe = 'true'
    probe.textContent = 'window.__ASSESSMENT_B_MUTATION_PROBE__ = true'
    document.head.appendChild(probe)
    return {
      originalTitle,
      title: document.title,
      scriptAppended: probe.isConnected,
      scriptExecuted: window.__ASSESSMENT_B_MUTATION_PROBE__ === true,
    }
  })
  if (response?.status() !== 200) throw new Error(`${view.key}: HTTP ${response?.status()}`)
  if (!preflight.scriptAppended || !preflight.scriptExecuted) {
    throw new Error(`${view.key}: mutable injection preflight failed`)
  }

  const settings = page.locator('details.dynamic-form-demo__settings').first()
  await settings.evaluate((element) => {
    element.open = true
  })
  await page.locator('.dynamic-form-demo').scrollIntoViewIfNeeded()
  if (view.hud) {
    const hudLabel = page
      .locator('.dynamic-form-demo__toolbar label')
      .filter({ hasText: 'HUD 深色主题' })
      .first()
    await hudLabel.click()
    await page.waitForTimeout(250)
  }
  const demoHeading = page.locator('.vp-doc h2').filter({ hasText: '交互示例' }).first()
  await demoHeading.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, Math.max(0, top - 80))
  })
  await page.waitForTimeout(150)
  return { context, page, httpStatus: response.status(), preflight }
}

function startLiveServer() {
  const run = spawnSync(process.execPath, [liveServerPath, '--background'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
  })
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stdout.json'), run.stdout ?? '', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-start.stderr.txt'), run.stderr ?? '', 'utf8')
  fs.writeFileSync(
    path.join(evidenceDir, 'live-server-start.exit-code.txt'),
    `${run.status ?? 'null'}\n`,
    'utf8',
  )
  if (run.error) throw run.error
  if (run.status !== 0) throw new Error(`live-server start exited ${run.status}: ${run.stderr}`)
  const info = JSON.parse(run.stdout.trim())
  liveServerPort = info.port
  return {
    ...info,
    healthStatus: null,
    stopCommand: `node "${liveServerPath}" stop --keep-inject`,
  }
}

function stopLiveServer() {
  if (!liveServerPort) return { attempted: false, reason: 'server was not started' }
  const run = spawnSync(process.execPath, [liveServerPath, 'stop', '--keep-inject'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  })
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stdout.txt'), run.stdout ?? '', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'live-server-stop.stderr.txt'), run.stderr ?? '', 'utf8')
  fs.writeFileSync(
    path.join(evidenceDir, 'live-server-stop.exit-code.txt'),
    `${run.status ?? 'null'}\n`,
    'utf8',
  )
  return {
    attempted: true,
    exitCode: run.status,
    stdout: (run.stdout ?? '').trim(),
    stderr: (run.stderr ?? '').trim(),
  }
}

async function scanOverlay(page, viewKey) {
  await page.evaluate(() => {
    document.querySelectorAll('.impeccable-overlay').forEach((element) => element.remove())
  })
  const alreadyLoaded = await page.evaluate(
    () => typeof window.impeccableScanAsync === 'function',
  )
  let injection = { loaded: alreadyLoaded, alreadyLoaded }
  if (!alreadyLoaded) {
    const scriptUrl = `http://localhost:${liveServerPort}/detect.js?assessmentB=${encodeURIComponent(viewKey)}`
    injection = await page.evaluate((src) => new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve({ loaded: true, src: script.src })
      script.onerror = () => resolve({ loaded: false, src: script.src, error: 'script load error' })
      document.head.appendChild(script)
    }), scriptUrl)
    await page.waitForTimeout(2500)
  }
  const scan = await page.evaluate(async () => {
    if (typeof window.impeccableScanAsync !== 'function') {
      return { available: false, findings: [] }
    }
    try {
      const results = await window.impeccableScanAsync()
      const findings = results.flatMap(({ el, findings: elementFindings }) =>
        elementFindings.map((finding) => ({
          selector: el.id
            ? `#${el.id}`
          : `${el.tagName.toLowerCase()}${
                typeof el.className === 'string' && el.className.trim()
                  ? `.${el.className.trim().split(/\s+/).join('.')}`
                  : ''
              }`,
          rule: finding.type || finding.id,
          severity: finding.severity || 'unspecified',
          detail: finding.detail || finding.snippet || '',
        })),
      )
      return { available: true, findings }
    } catch (error) {
      return { available: false, findings: [], error: String(error) }
    }
  })
  await page.waitForTimeout(350)
  const overlayCounts = await page.evaluate(() => ({
    overlays: document.querySelectorAll('.impeccable-overlay:not(.impeccable-banner)').length,
    banners: document.querySelectorAll('.impeccable-banner').length,
    detectorAvailable: typeof window.impeccableScanAsync === 'function',
  }))
  return { view: viewKey, injection, scan, overlayCounts }
}

async function captureOverlayState(page, viewKey) {
  const before = await readState(page)
  const scan = await scanOverlay(page, viewKey)
  const after = await readState(page)
  const screenshot = `${viewKey}.overlay.png`
  await page.screenshot({ path: path.join(evidenceDir, screenshot), animations: 'disabled' })
  return { view: viewKey, before, scan, after, screenshot }
}

async function clickDemoButton(page, label) {
  const button = page.getByRole('button', { name: label, exact: true }).first()
  await button.waitFor({ state: 'visible' })
  await button.click()
}

async function runStateMatrix(browser) {
  const view = { key: 'desktop-light-state-matrix', width: 1440, height: 900 }
  const opened = await openPage(browser, view)
  const { page, context } = opened
  const screenshots = []
  const actions = []

  try {
    await page.screenshot({
      path: path.join(evidenceDir, 'desktop-light-state-matrix.initial.png'),
      animations: 'disabled',
    })
    screenshots.push(
      await captureOverlayState(page, 'desktop-light-default'),
    )

    await clickDemoButton(page, '提交校验')
    await page.waitForTimeout(250)
    actions.push({ action: 'submit-empty-form', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-validation-error'))

    await clickDemoButton(page, '加载中')
    await page.waitForTimeout(100)
    actions.push({ action: 'show-candidate-loading', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-candidate-loading'))

    await clickDemoButton(page, '空结果')
    await page.waitForTimeout(400)
    actions.push({ action: 'show-candidate-empty', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-candidate-empty'))

    await clickDemoButton(page, '失败')
    await page.waitForTimeout(400)
    actions.push({ action: 'show-candidate-error', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-candidate-error'))

    const retry = page.getByRole('button', { name: '重试', exact: true }).first()
    const retryAvailable = await retry.count() > 0
    if (retryAvailable) await retry.click()
    await page.waitForTimeout(350)
    actions.push({ action: 'retry-candidate-load', retryAvailable, state: await readState(page) })

    const modeField = page.locator('.el-form-item').filter({ hasText: '任务类型' }).first()
    await modeField.locator('.el-select').click()
    await page.getByRole('option', { name: '应急支援', exact: true }).click()
    await page.waitForTimeout(150)
    actions.push({ action: 'show-conditional-support-field', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-support-note'))

    const disabledLabel = page
      .locator('.dynamic-form-demo__toolbar label')
      .filter({ hasText: '禁用表单' })
      .first()
    await disabledLabel.click()
    await page.waitForTimeout(150)
    actions.push({ action: 'disable-form', state: await readState(page) })
    screenshots.push(await captureOverlayState(page, 'desktop-light-disabled'))

    await disabledLabel.click()
    await page.waitForTimeout(100)
    const fileInput = page.locator('.dynamic-form-demo input[type="file"]').first()
    const uploadInputCount = await page.locator('.dynamic-form-demo input[type="file"]').count()
    if (uploadInputCount > 0) {
      await fileInput.setInputFiles({
        name: 'assessment-b-mock-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64',
        ),
      })
      await page.waitForTimeout(100)
      const transientLoadingState = await readState(page)
      await page.evaluate(() => {
        document.querySelectorAll('.impeccable-overlay').forEach((element) => element.remove())
      })
      await page.screenshot({
        path: path.join(evidenceDir, 'desktop-light-upload-transient.png'),
        animations: 'disabled',
      })
      actions.push({
        action: 'upload-mock-file-transient',
        uploadInputCount,
        overlayCaptured: false,
        state: transientLoadingState,
      })
      await page.waitForTimeout(1000)
      actions.push({ action: 'upload-mock-file-complete', state: await readState(page) })
      screenshots.push(await captureOverlayState(page, 'desktop-light-upload-complete'))
    } else {
      actions.push({ action: 'upload-mock-file', uploadInputCount, skipped: true })
    }
  } finally {
    await context.close()
  }
  return { view: view.key, httpStatus: opened.httpStatus, preflight: opened.preflight, actions, screenshots }
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true })
  writeJson('target-fingerprints-start.json', fingerprints())
  const detectorResults = runDetectors()
  const browser = await chromium.launch({ headless: true, executablePath: chromePath })
  const viewRecords = []
  let serverInfo = null

  try {
    const desktop = await openPage(browser, views[0])
    try {
      serverInfo = startLiveServer()
      const health = await fetch(`http://localhost:${serverInfo.port}/health`)
      serverInfo.healthStatus = health.status
      writeJson('live-server.json', { ...serverInfo, startedAt: new Date().toISOString() })

      const initialState = await readState(desktop.page)
      await desktop.page.screenshot({
        path: path.join(evidenceDir, 'desktop-light-default.png'),
        animations: 'disabled',
      })
      const overlay = await captureOverlayState(desktop.page, 'desktop-light-default')
      viewRecords.push({
        ...views[0],
        httpStatus: desktop.httpStatus,
        preflight: desktop.preflight,
        initialState,
        overlay,
      })
    } finally {
      await desktop.context.close()
    }

    for (const view of views.slice(1)) {
      const opened = await openPage(browser, view)
      try {
        const state = await readState(opened.page)
        await opened.page.screenshot({
          path: path.join(evidenceDir, `${view.key}.png`),
          animations: 'disabled',
        })
        const overlay = await captureOverlayState(opened.page, view.key)
        viewRecords.push({ ...view, httpStatus: opened.httpStatus, preflight: opened.preflight, state, overlay })
      } finally {
        await opened.context.close()
      }
    }

    viewRecords.push(await runStateMatrix(browser))
  } finally {
    await browser.close()
    const stop = stopLiveServer()
    writeJson('live-server-stop.json', { ...stop, stoppedAt: new Date().toISOString() })
  }

  writeJson('browser-evidence.json', viewRecords)
  writeJson('browser-console.json', consoleLogs)
  writeJson('page-errors.json', pageErrors)
  writeJson('network-requests.json', networkEvents)
  const endFingerprints = fingerprints()
  writeJson('target-fingerprints-end.json', endFingerprints)
  const beforeByPath = new Map(JSON.parse(fs.readFileSync(path.join(evidenceDir, 'target-fingerprints-start.json'), 'utf8')).map((item) => [item.path, item.sha256]))
  writeJson('fingerprint-comparison.json', endFingerprints.map((item) => ({
    path: item.path,
    unchanged: beforeByPath.get(item.path) === item.sha256,
    startSha256: beforeByPath.get(item.path) ?? null,
    endSha256: item.sha256,
  })))

  process.stdout.write(`${JSON.stringify({
    detectorResults,
    views: viewRecords.map((record) => {
      const scans = record.overlay
        ? [record.overlay.scan]
        : (record.screenshots ?? []).map((screenshot) => screenshot.scan)
      return {
        view: record.key,
        httpStatus: record.httpStatus,
        overlayViews: scans.length,
        allScansAvailable: scans.length > 0 && scans.every((item) => item.scan.available),
        findingCounts: scans.map((item) => item.scan.findings.length),
        horizontalOverflow: record.state?.horizontalOverflow ?? record.overlay?.before?.horizontalOverflow ?? null,
      }
    }),
    pageErrors: pageErrors.length,
    failedRequests: networkEvents.filter((event) => event.event === 'requestfailed').length,
  }, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
})
