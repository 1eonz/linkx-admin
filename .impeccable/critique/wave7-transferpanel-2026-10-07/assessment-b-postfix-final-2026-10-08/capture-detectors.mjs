import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  ['lxtransferpanel-component', 'linkx-fe/src/components/LxTransferPanel/index.vue'],
  ['lxtransferpanel-demo', 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue'],
  ['lxtransferpanel-doc', 'linkx-fe/docs/components/lxtransferpanel.md'],
  ['lxvirtualtree-component', 'linkx-fe/src/components/LxVirtualTree/index.vue'],
  ['lxvirtualtree-demo', 'linkx-fe/src/components/LxVirtualTree/demo/basic.vue'],
  ['lxvirtualtree-doc', 'linkx-fe/docs/components/lxvirtualtree.md'],
]

async function hashTargets() {
  return Promise.all(targets.map(async ([name, file]) => {
    const bytes = await readFile(path.join(root, file))
    return { name, file, sha256: createHash('sha256').update(bytes).digest('hex') }
  }))
}

const start = await hashTargets()
await writeFile(path.join(outDir, 'source-hashes-start.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  targets: start,
}, null, 2))

const results = []
for (const [name, file] of targets) {
  const args = [detector, '--json', file]
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  })
  const prefix = `detector-${name}`
  const command = [
    `cwd: ${root}`,
    `command: ${JSON.stringify(process.execPath)} ${args.map((arg) => JSON.stringify(arg)).join(' ')}`,
    `target: ${file}`,
    '',
  ].join('\n')
  await Promise.all([
    writeFile(path.join(outDir, `${prefix}.command.txt`), command),
    writeFile(path.join(outDir, `${prefix}.stdout.json`), result.stdout ?? ''),
    writeFile(path.join(outDir, `${prefix}.stderr.txt`), result.stderr ?? ''),
    writeFile(path.join(outDir, `${prefix}.exit-code.txt`), `${result.status ?? 'null'}\n`),
  ])
  results.push({
    name,
    file,
    exitCode: result.status,
    signal: result.signal,
    stderrLength: result.stderr?.length ?? 0,
    stdout: result.stdout?.trim() ?? '',
    error: result.error?.message ?? null,
  })
}

const end = await hashTargets()
await writeFile(path.join(outDir, 'source-hashes-after-detector.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  unchangedDuringDetector: start.every((item, index) => item.sha256 === end[index]?.sha256),
  targets: end,
}, null, 2))
await writeFile(path.join(outDir, 'detector-summary.json'), JSON.stringify(results, null, 2))
process.stdout.write(JSON.stringify({ results, unchangedDuringDetector: start.every((item, index) => item.sha256 === end[index]?.sha256) }))
