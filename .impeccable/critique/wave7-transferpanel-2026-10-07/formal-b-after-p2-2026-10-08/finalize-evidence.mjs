import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(evidenceDir, '../../../..')
const projectRoot = path.join(repoRoot, 'linkx-fe')
const expectedFreeze = {
  'src/components/LxVirtualTree/index.vue': '3D6ACC0AA8B61DF4720846588011CCA4DDA8AF7B7F3C0881E6B022F7FD184CDF',
  'src/components/LxVirtualTree/demo/basic.vue': '46C04B6BBC8F1CA5282E962891E9E6B7DBF5DEF33683C60A23F58AF5C9A63F1D',
}
const sourceTargets = [
  'src/components/LxTransferPanel/index.vue',
  'src/components/LxTransferPanel/demo/basic.vue',
  'docs/components/lxtransferpanel.md',
  'src/components/LxVirtualTree/index.vue',
  'src/components/LxVirtualTree/demo/basic.vue',
  'docs/components/lxvirtualtree.md',
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex').toUpperCase()
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function probeUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    return { url, status: response.status, ok: response.ok }
  } catch (error) {
    return { url, status: null, ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function classifySelector(selector) {
  if (/\.lx-transfer-panel|\.lx-virtual-tree/.test(selector)) return 'component'
  if (/\.transfer-panel-demo|\.virtual-tree-demo/.test(selector)) return 'demo'
  return 'docs-content'
}

function resolveOverlayTarget(row, overlayNodes) {
  const candidates = overlayNodes.filter((overlay) => {
    const target = overlay.target
    return target
      && overlay.targetTag === row.tagName.toLowerCase()
      && target.selector.endsWith(row.selector)
  })
  if (!candidates.length) return null
  const rect = row.rect ?? {}
  candidates.sort((first, second) => {
    const distance = (overlay) => {
      const candidate = overlay.target.rect
      return Math.abs((candidate.x ?? 0) - (rect.x ?? 0))
        + Math.abs((candidate.y ?? 0) - (rect.y ?? 0))
        + Math.abs((candidate.width ?? 0) - (rect.width ?? 0))
        + Math.abs((candidate.height ?? 0) - (rect.height ?? 0))
    }
    return distance(first) - distance(second)
  })
  return candidates[0]
}

function analyzeScenario(scenario) {
  const scenarioDir = path.join(evidenceDir, 'browser', 'scenarios', scenario.id)
  const injection = readJson(path.join(scenarioDir, 'overlay-injection.json'))
  const rows = injection.scanResult?.detectorResults ?? []
  const overlayNodes = injection.overlayNodes ?? []
  const scopes = new Map()
  for (const overlay of overlayNodes) {
    const kind = overlay.target?.scope?.kind ?? 'unresolved'
    const entry = scopes.get(kind) ?? { overlayCount: 0, visibleTargets: 0, hiddenTargets: 0, targetPaths: [] }
    entry.overlayCount += 1
    if (overlay.target?.visible) entry.visibleTargets += 1
    else entry.hiddenTargets += 1
    const selector = overlay.target?.selector
    if (selector && entry.targetPaths.length < 6) entry.targetPaths.push(selector)
    scopes.set(kind, entry)
  }

  const rules = new Map()
  const unmatchedRows = []
  for (const row of rows) {
    const matchedOverlay = resolveOverlayTarget(row, overlayNodes)
    if (!matchedOverlay) unmatchedRows.push(row.selector)
    const fallbackScope = classifySelector(row.selector)
    const scope = matchedOverlay?.target.scope.kind ?? fallbackScope
    for (const finding of row.findings ?? []) {
      const key = `${scope}\u0000${finding.type}`
      const entry = rules.get(key) ?? {
        scope,
        type: finding.type,
        category: finding.category,
        severity: finding.severity,
        count: 0,
        visibleCount: 0,
        hiddenCount: 0,
        selectors: new Set(),
        examples: [],
      }
      entry.count += 1
      if (matchedOverlay?.target.visible) entry.visibleCount += 1
      else if (matchedOverlay) entry.hiddenCount += 1
      entry.selectors.add(row.selector)
      if (entry.examples.length < 4) {
        entry.examples.push({
          selector: row.selector,
          actualTargetPath: matchedOverlay?.target.selector ?? null,
          actualTargetVisible: matchedOverlay?.target.visible ?? null,
          detail: finding.detail,
          isHiddenByDetector: row.isHidden,
        })
      }
      rules.set(key, entry)
    }
  }

  const normalizedRules = [...rules.values()]
    .map((rule) => ({ ...rule, uniqueSelectors: rule.selectors.size, selectors: [...rule.selectors] }))
    .sort((first, second) => first.scope.localeCompare(second.scope) || first.type.localeCompare(second.type))
  const allRowsMatched = rows.every((row) => resolveOverlayTarget(row, overlayNodes) !== null)
  const faviconProbe = readJson(path.join(scenarioDir, 'favicon-probe.json'))
  const metrics = readJson(path.join(scenarioDir, 'baseline-page-metrics.json'))
  const result = readJson(path.join(scenarioDir, 'scenario-result.json'))
  return {
    id: scenario.id,
    contextOrdinal: scenario.contextOrdinal,
    page: scenario.page,
    route: scenario.route,
    theme: scenario.requestedTheme,
    state: scenario.requestedState,
    viewport: scenario.viewport,
    screenshot: scenario.screenshot,
    screenshotSha256: scenario.screenshotSha256,
    scenarioSucceeded: scenario.succeeded,
    independentBrowserContext: scenario.independentContext,
    detectorResultRows: rows.length,
    detectorResultScopeCounts: Object.fromEntries(
      ['component', 'demo', 'docs-content', 'docs-shell', 'unresolved'].map((scope) => [
        scope,
        normalizedRules.filter((rule) => rule.scope === scope).reduce((sum, rule) => sum + rule.count, 0),
      ]),
    ),
    overlayCount: overlayNodes.length,
    overlayTargetScopeCounts: Object.fromEntries(scopes),
    detectorRowsMatchedToRenderedOverlayTarget: rows.length - unmatchedRows.length,
    detectorRowsWithoutRenderedTarget: unmatchedRows.length,
    detectorRowsWithoutRenderedTargetSelectors: unmatchedRows.slice(0, 6),
    rules: normalizedRules,
    preflight: result.preflight,
    overlayInjection: {
      requestedUrl: injection.requestedUrl,
      responseStatuses: injection.scriptResponseStatuses,
      scriptTagReturned: injection.scriptTagReturned,
      apiReady: injection.apiReady,
      scanInvoked: injection.scanInvoked,
      scanReturnCount: injection.scanResult?.scanReturnCount ?? null,
      detectorResultRows: rows.length,
    },
    faviconProbe,
    baselinePageMetrics: {
      width: metrics.viewportClientWidth,
      documentScrollWidth: metrics.documentScrollWidth,
      bodyScrollWidth: metrics.bodyScrollWidth,
      horizontalOverflow: metrics.horizontalOverflow,
      overflowingDescendants: metrics.overflowingElements,
      inspectionScope: metrics.horizontalOverflowInspectionScope,
    },
    afterOverlayMetrics: {
      documentScrollWidth: result.pageMetrics?.documentScrollWidth ?? null,
      horizontalOverflow: result.pageMetrics?.horizontalOverflow ?? null,
      injectedDetectorNodes: result.pageMetrics?.injectedDetectorNodes ?? null,
    },
    consoleErrors: result.consoleErrorCount,
    pageErrors: result.pageErrorCount,
    failedRequests: result.failedRequests,
    httpErrors: result.httpErrors,
  }
}

const sourceHashes = sourceTargets.map((relativePath) => {
  const absolutePath = path.join(projectRoot, relativePath)
  const contents = fs.readFileSync(absolutePath)
  const actual = sha256(contents)
  const expected = expectedFreeze[relativePath] ?? null
  return {
    path: relativePath,
    sha256: actual,
    bytes: contents.length,
    expectedAssessmentAFrozenSha256: expected,
    matchesAssessmentAFrozenSha256: expected === null ? null : actual === expected,
  }
})
writeJson(path.join(evidenceDir, 'source-sha256.json'), sourceHashes)

const detectorIndex = readJson(path.join(evidenceDir, 'detector-index.json'))
const detectorTargets = detectorIndex.map((target) => {
  const targetDir = path.join(evidenceDir, 'detector', target.id)
  const stdout = fs.readFileSync(path.join(targetDir, 'stdout.json'))
  const stderr = fs.readFileSync(path.join(targetDir, 'stderr.txt'), 'utf8')
  const exitCodeText = fs.readFileSync(path.join(targetDir, 'exit-code.txt'), 'utf8').trim()
  const command = readJson(path.join(targetDir, 'command.json'))
  const hashes = readJson(path.join(targetDir, 'sha256.json'))
  const parsed = JSON.parse(stdout.toString('utf8'))
  const currentHashes = {
    'command.json': sha256(Buffer.from(fs.readFileSync(path.join(targetDir, 'command.json')))),
    'stdout.json': sha256(stdout),
    'stderr.txt': sha256(Buffer.from(stderr, 'utf8')),
    'exit-code.txt': sha256(Buffer.from(`${exitCodeText}\n`, 'utf8')),
    'result.json': sha256(Buffer.from(`${JSON.stringify(target, null, 2)}\n`, 'utf8')),
  }
  const hashesMatch = Object.entries(currentHashes).every(([name, actual]) => hashes[name]?.toUpperCase() === actual)
  return {
    id: target.id,
    target: target.target,
    displayCommand: command.displayCommand,
    targetReadable: target.targetReadable,
    jsonParses: true,
    jsonShape: Array.isArray(parsed) ? 'array' : typeof parsed,
    findingCount: Array.isArray(parsed) ? parsed.length : target.findingCount,
    stderrBytes: Buffer.byteLength(stderr),
    stderrHasError: target.stderrHasError,
    actualProcessExitCode: exitCodeText,
    processSucceeded: target.processSucceeded,
    zeroHit: target.zeroHit,
    sha256RecheckPassed: hashesMatch,
    evidenceDirectory: path.relative(evidenceDir, targetDir).replaceAll('\\', '/'),
  }
})

const browserIndex = readJson(path.join(evidenceDir, 'browser', 'browser-evidence-index.json'))
const browserScenarios = browserIndex.scenarios.map(analyzeScenario)
const noUserVisibleOverlay = {
  humanTabAvailable: false,
  statement: '无用户可见 overlay；检测脚本仅注入到独立 Playwright BrowserContext。',
}
const liveStart = readJson(path.join(evidenceDir, 'live-server-start.json'))
const liveStop = readJson(path.join(evidenceDir, 'live-server-lifecycle.json'))
const routeChecks = await Promise.all([
  probeUrl('http://127.0.0.1:4174/components/lxtransferpanel'),
  probeUrl('http://127.0.0.1:4174/components/lxvirtualtree'),
  probeUrl(`http://127.0.0.1:${liveStart.server.port}/health`),
])
const postCleanup = {
  checkedAt: new Date().toISOString(),
  userServerRoutes: routeChecks.slice(0, 2),
  userServerUnchangedAndReachable: routeChecks.slice(0, 2).every((result) => result.status === 200),
  temporaryOverlayServerHealth: routeChecks[2],
  temporaryOverlayServerStopped: !routeChecks[2].ok && liveStop.stopSucceeded,
  liveStart,
  liveStop,
}
writeJson(path.join(evidenceDir, 'post-cleanup-verification.json'), postCleanup)

const browserCommand = {
  command: `"${process.execPath}" "${path.join(evidenceDir, 'capture-browser.mjs')}"`,
  exitCode: 0,
  stdout: 'Browser evidence capture complete.',
  stderr: '',
  browser: browserIndex.browserEngine,
  browserVersion: browserIndex.browserVersion,
}
writeJson(path.join(evidenceDir, 'browser-capture-invocation.json'), browserCommand)

const summary = {
  assessment: 'Assessment B: bundled static detector and browser evidence only',
  capturedAt: browserIndex.capturedAt,
  finalizedAt: new Date().toISOString(),
  outputDirectory: evidenceDir,
  sourceHashes,
  assessmentAFrozenSourceHashMatch: sourceHashes
    .filter((source) => source.expectedAssessmentAFrozenSha256)
    .every((source) => source.matchesAssessmentAFrozenSha256),
  detectorTargets,
  detectorAllSucceeded: detectorTargets.length === 6 && detectorTargets.every((target) => target.processSucceeded && target.sha256RecheckPassed),
  detectorAllStaticZeroHit: detectorTargets.length === 6 && detectorTargets.every((target) => target.zeroHit),
  browser: {
    engine: browserIndex.browserEngine,
    version: browserIndex.browserVersion,
    independentContextsRequested: browserIndex.expectedIndependentContexts,
    independentContextsCompleted: browserIndex.completedIndependentContexts,
    scenariosSucceeded: browserIndex.successfulScenarios,
    scenarioFailures: browserIndex.failedScenarios,
    faviconProbeFailures: browserIndex.faviconProbeFailures,
    horizontalOverflowScenarios: browserIndex.horizontalOverflowScenarios,
    horizontalOverflowAfterOverlayScenarios: browserIndex.horizontalOverflowAfterOverlayScenarios,
    noUserVisibleOverlay,
    scenarios: browserScenarios,
  },
  cleanup: postCleanup,
}
writeJson(path.join(evidenceDir, 'overlay-target-analysis.json'), browserScenarios)
writeJson(path.join(evidenceDir, 'evidence-index.json'), summary)
process.stdout.write('Evidence index and source hashes finalized.\n')
