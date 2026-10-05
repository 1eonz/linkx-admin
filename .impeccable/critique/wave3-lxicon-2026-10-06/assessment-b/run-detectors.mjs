import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(outputDirectory, '../../../..')
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  { name: 'component', path: 'linkx-fe/src/components/LxIcon/index.vue' },
  { name: 'icons', path: 'linkx-fe/src/components/LxIcon/icons.ts' },
  { name: 'docs', path: 'linkx-fe/docs/components/lxicons.md' },
]

mkdirSync(outputDirectory, { recursive: true })

const results = []
for (const target of targets) {
  const args = [detectorPath, '--json', target.path]
  const command = `node "${detectorPath}" --json "${target.path}"`
  const result = spawnSync(process.execPath, args, {
    cwd: repositoryRoot,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  })
  const stdout = result.stdout ?? Buffer.alloc(0)
  const stderr = result.stderr ?? Buffer.alloc(0)
  const prefix = `detector-${target.name}`

  writeFileSync(resolve(outputDirectory, `${prefix}.command.txt`), `${command}\n`)
  writeFileSync(resolve(outputDirectory, `${prefix}.stdout.json`), stdout)
  writeFileSync(resolve(outputDirectory, `${prefix}.stderr.txt`), stderr)
  writeFileSync(
    resolve(outputDirectory, `${prefix}.exit-code.txt`),
    `${result.status ?? 'null'}\n`,
  )
  if (result.error) {
    writeFileSync(resolve(outputDirectory, `${prefix}.launch-error.txt`), `${result.error.stack ?? result.error}\n`)
  }

  let parsed
  try {
    parsed = JSON.parse(stdout.toString('utf8'))
  } catch {
    parsed = null
  }
  const findings = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.findings)
      ? parsed.findings
      : null
  results.push({
    target: target.path,
    command,
    exitCode: result.status,
    signal: result.signal,
    stderr: stderr.toString('utf8'),
    stdoutJsonParsed: parsed !== null,
    findingsCount: findings?.length ?? null,
    findingRules: findings?.map((finding) => finding.rule ?? finding.ruleId ?? null) ?? null,
    launchError: result.error?.message ?? null,
    validZeroHit: result.status === 0 && stderr.length === 0 && findings?.length === 0,
  })
}

writeFileSync(
  resolve(outputDirectory, 'detector-summary.json'),
  `${JSON.stringify({ repositoryRoot, detectorPath, results }, null, 2)}\n`,
)
console.log(JSON.stringify(results, null, 2))
