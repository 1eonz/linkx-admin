import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(evidenceDir, '../../../..')
const detectorPath = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  {
    name: 'component',
    path: 'linkx-fe/src/components/LxTransferPanel/index.vue',
  },
  {
    name: 'demo',
    path: 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  },
  {
    name: 'docs',
    path: 'linkx-fe/docs/components/lxtransferpanel.md',
  },
]

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function runTarget(target) {
  const absoluteTarget = path.resolve(repoRoot, target.path)
  const commandArgs = [detectorPath, '--json', absoluteTarget]
  const command = `"${process.execPath}" "${detectorPath}" --json "${absoluteTarget}"`
  const startedAt = new Date().toISOString()
  const sha256Before = sha256(absoluteTarget)

  return new Promise((resolve) => {
    const child = spawn(process.execPath, commandArgs, { cwd: repoRoot, windowsHide: true })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', (error) => {
      const endedAt = new Date().toISOString()
      const result = {
        name: target.name,
        target: path.relative(repoRoot, absoluteTarget).replaceAll('\\', '/'),
        command,
        cwd: repoRoot,
        startedAt,
        endedAt,
        sha256Before,
        sha256After: sha256(absoluteTarget),
        realExitCode: null,
        signal: null,
        spawnError: error.message,
        stdoutFile: `${target.name}.stdout.json`,
        stderrFile: `${target.name}.stderr.txt`,
      }
      fs.writeFileSync(path.join(evidenceDir, result.stdoutFile), Buffer.concat(stdout))
      fs.writeFileSync(path.join(evidenceDir, result.stderrFile), Buffer.concat(stderr))
      fs.writeFileSync(
        path.join(evidenceDir, `${target.name}.metadata.json`),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      resolve(result)
    })
    child.on('close', (code, signal) => {
      const endedAt = new Date().toISOString()
      const result = {
        name: target.name,
        target: path.relative(repoRoot, absoluteTarget).replaceAll('\\', '/'),
        command,
        cwd: repoRoot,
        startedAt,
        endedAt,
        sha256Before,
        sha256After: sha256(absoluteTarget),
        realExitCode: code,
        signal,
        stdoutFile: `${target.name}.stdout.json`,
        stderrFile: `${target.name}.stderr.txt`,
      }
      fs.writeFileSync(path.join(evidenceDir, result.stdoutFile), Buffer.concat(stdout))
      fs.writeFileSync(path.join(evidenceDir, result.stderrFile), Buffer.concat(stderr))
      fs.writeFileSync(
        path.join(evidenceDir, `${target.name}.metadata.json`),
        `${JSON.stringify(result, null, 2)}\n`,
      )
      resolve(result)
    })
  })
}

const results = await Promise.all(targets.map(runTarget))
const summary = { generatedAt: new Date().toISOString(), results }
fs.writeFileSync(
  path.join(evidenceDir, 'detector-index.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
)
console.log(JSON.stringify(results, null, 2))
