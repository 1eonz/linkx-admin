import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(outputDir, '..', '..', '..', '..', '..')
const detectorPath = path.join(
  process.env.USERPROFILE,
  '.codex',
  'skills',
  'impeccable',
  'scripts',
  'detect.mjs',
)
const targets = [
  ['component', 'linkx-fe/src/components/LxSwitch/index.vue'],
  ['demo', 'linkx-fe/src/components/LxSwitch/demo/basic.vue'],
  ['docs', 'linkx-fe/docs/components/lxswitch.md'],
]

await mkdir(outputDir, { recursive: true })
const results = []

for (const [name, relativeTarget] of targets) {
  const args = [detectorPath, '--json', relativeTarget]
  const result = spawnSync(process.execPath, args, {
    cwd: rootDir,
    encoding: 'utf8',
    windowsHide: true,
  })
  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  const exitCode = result.status

  await writeFile(path.join(outputDir, name + '.stdout.json'), stdout, 'utf8')
  await writeFile(path.join(outputDir, name + '.stderr.txt'), stderr, 'utf8')
  await writeFile(
    path.join(outputDir, name + '.exit-code.txt'),
    String(exitCode) + '\n',
    'utf8',
  )

  let parsed = null
  let parseError = null
  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error)
  }

  results.push({
    name,
    command: [process.execPath, ...args],
    cwd: rootDir,
    target: relativeTarget,
    exitCode,
    signal: result.signal,
    spawnError: result.error ? result.error.message : null,
    parseError,
    parsed,
    stdoutFile: name + '.stdout.json',
    stderrFile: name + '.stderr.txt',
    exitCodeFile: name + '.exit-code.txt',
  })
}

await writeFile(
  path.join(outputDir, 'scan-summary.json'),
  JSON.stringify({
    startedAt: new Date().toISOString(),
    detectorPath,
    results,
  }, null, 2) + '\n',
  'utf8',
)

process.stdout.write(
  JSON.stringify(results.map(({ name, exitCode, spawnError, parseError }) => ({
    name,
    exitCode,
    spawnError,
    parseError,
  }))) + '\n',
)
