import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)
const targets = [
  'lxtransferpanel-component',
  'lxtransferpanel-demo',
  'lxtransferpanel-doc',
  'lxvirtualtree-component',
  'lxvirtualtree-demo',
  'lxvirtualtree-doc',
]
const detectorChecks = []
for (const target of targets) {
  const prefix = path.join(outDir, `detector-${target}`)
  const [stdout, stderr, exitCode, command] = await Promise.all([
    readFile(`${prefix}.stdout.json`, 'utf8'),
    readFile(`${prefix}.stderr.txt`, 'utf8'),
    readFile(`${prefix}.exit-code.txt`, 'utf8'),
    readFile(`${prefix}.command.txt`, 'utf8'),
  ])
  detectorChecks.push({
    target,
    jsonEmpty: JSON.stringify(JSON.parse(stdout)) === '[]',
    stderrEmpty: stderr.length === 0,
    exitCodeZero: Number(exitCode.trim()) === 0,
    commandRecorded: command.includes('detect.mjs'),
  })
}

const [startHashes, finalHashes, browser, shutdown, metadata] = await Promise.all([
  readFile(path.join(outDir, 'source-hashes-start.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'source-hashes-final.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'browser-evidence.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'server-shutdown-verification.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'run-metadata.json'), 'utf8').then(JSON.parse),
])
const browserPages = [
  ...browser.pages,
  browser.virtualTreeDocRoute,
  browser.virtualTreeDemo,
]
const screenshots = new Set([
  ...browser.pages.map((page) => page.initialScreenshot),
  ...browser.pages.map((page) => page.recoveredScreenshot).filter(Boolean),
  ...browser.pages.flatMap((page) => [page.searchScreenshot, page.fullTreeInvertScreenshot, page.reducedMotionScreenshot].filter(Boolean)),
  'breakpoint-359-focus.png',
  'breakpoint-360-focus.png',
  browser.virtualTreeDocRoute.screenshot,
  browser.virtualTreeDemo.initialScreenshot,
  ...browser.virtualTreeDemo.hostStates.map((state) => state.screenshot),
  browser.virtualTreeDemo.reducedMotionScreenshot,
  browser.virtualTreeDemo.hudScreenshot,
])
const screenshotChecks = await Promise.all([...screenshots].map(async (file) => {
  try {
    await access(path.join(outDir, file))
    return true
  } catch {
    return false
  }
}))
const checks = {
  detectorChecks,
  detectorAllPass: detectorChecks.every((item) => item.jsonEmpty && item.stderrEmpty && item.exitCodeZero && item.commandRecorded),
  sourceFreezeUnchanged: startHashes.targets.every((item, index) => item.sha256 === finalHashes.targets[index]?.sha256)
    && finalHashes.unchangedSinceFreeze === true,
  browserPageCount: browserPages.length,
  overlayInjectedOnEveryPage: browserPages.every((page) => page.injection?.loaded === true),
  browserCaptureErrorsEmpty: browser.errors.length === 0,
  transferFullTreeInvertPass: browser.pages.find((page) => page.name === 'desktop-light-ready')?.fullTreeInvert?.pass === true,
  breakpointFocusPass: browser.pages.find((page) => page.name === 'mobile-375-empty')?.breakpointFocus?.pass === true,
  virtualTreeKeyboardPass: browser.virtualTreeDemo.keyboard?.pass === true,
  virtualTreeHudThemePass: browser.virtualTreeDemo.hudThemeEnabled === true,
  browserCleanupPass: browser.browser.cleanup?.completed === true,
  screenshotCount: screenshots.size,
  screenshotsAllPresent: screenshotChecks.every(Boolean),
  ownedPortsClosed: shutdown.remainingOwnedPorts.length === 0,
  temporaryRootRemoved: shutdown.temporaryRootRemoved === true,
  sourceLabelIsIntermediate: metadata.status === 'intermediate-postfix-before-code-review-P3-fixes',
}
checks.passed = checks.detectorAllPass
  && checks.sourceFreezeUnchanged
  && checks.browserPageCount === 8
  && checks.overlayInjectedOnEveryPage
  && checks.browserCaptureErrorsEmpty
  && checks.transferFullTreeInvertPass
  && checks.breakpointFocusPass
  && checks.virtualTreeKeyboardPass
  && checks.virtualTreeHudThemePass
  && checks.browserCleanupPass
  && checks.screenshotsAllPresent
  && checks.ownedPortsClosed
  && checks.temporaryRootRemoved
  && checks.sourceLabelIsIntermediate
await writeFile(path.join(outDir, 'verification-summary.json'), JSON.stringify(checks, null, 2))
process.stdout.write(JSON.stringify(checks))
if (!checks.passed) process.exitCode = 1
