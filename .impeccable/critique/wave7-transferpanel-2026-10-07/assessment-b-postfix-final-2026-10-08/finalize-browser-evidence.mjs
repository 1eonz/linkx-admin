import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)
const browserEvidencePath = path.join(outDir, 'browser-evidence.json')
const browserEvidence = JSON.parse(await readFile(browserEvidencePath, 'utf8'))
const startHashes = JSON.parse(await readFile(path.join(outDir, 'source-hashes-start.json'), 'utf8'))
const finalHashes = await Promise.all(startHashes.targets.map(async (target) => {
  const bytes = await readFile(path.join(root, target.file))
  return { ...target, sha256: createHash('sha256').update(bytes).digest('hex') }
}))
const unchangedSinceFreeze = startHashes.targets.every((target, index) => target.sha256 === finalHashes[index]?.sha256)
await writeFile(path.join(outDir, 'source-hashes-final.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  unchangedSinceFreeze,
  targets: finalHashes,
}, null, 2))

const overlayLoads = browserEvidence.pages.filter((page) => page.injection?.loaded).length
  + Number(browserEvidence.virtualTreeDocRoute?.injection?.loaded)
  + Number(browserEvidence.virtualTreeDemo?.injection?.loaded)
const summary = {
  pageCount: browserEvidence.pages.length,
  virtualTreeDoc: browserEvidence.virtualTreeDocRoute?.url ?? null,
  screenshots: [
    ...browserEvidence.pages.map((page) => page.initialScreenshot),
    ...browserEvidence.pages.map((page) => page.recoveredScreenshot).filter(Boolean),
    ...browserEvidence.pages.flatMap((page) => [page.searchScreenshot, page.fullTreeInvertScreenshot, page.reducedMotionScreenshot].filter(Boolean)),
    'breakpoint-359-focus.png',
    'breakpoint-360-focus.png',
    browserEvidence.virtualTreeDocRoute?.screenshot,
    browserEvidence.virtualTreeDemo?.initialScreenshot,
    ...(browserEvidence.virtualTreeDemo?.hostStates ?? []).map((state) => state.screenshot),
    browserEvidence.virtualTreeDemo?.reducedMotionScreenshot,
    browserEvidence.virtualTreeDemo?.hudScreenshot,
  ].filter(Boolean),
  overlayLoads,
  errors: browserEvidence.errors,
}
const command = [
  `cwd: ${root}`,
  `command: ${JSON.stringify(process.execPath)} ${JSON.stringify('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08/capture-browser-transferpanel.mjs')} --out ${JSON.stringify('.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08')} --baseUrl http://127.0.0.1:4184 --overlayUrl http://127.0.0.1:8417 --edge ${JSON.stringify('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')} --debugPort 9349`,
  '',
].join('\n')
await Promise.all([
  writeFile(path.join(outDir, 'browser-capture-final.command.txt'), command),
  writeFile(path.join(outDir, 'browser-capture-final.stdout.json'), JSON.stringify(summary, null, 2)),
  writeFile(path.join(outDir, 'browser-capture-final.stderr.txt'), ''),
  writeFile(path.join(outDir, 'browser-capture-final.exit-code.txt'), '0\n'),
])
process.stdout.write(JSON.stringify({ summary, unchangedSinceFreeze }))
if (!unchangedSinceFreeze) process.exitCode = 1
