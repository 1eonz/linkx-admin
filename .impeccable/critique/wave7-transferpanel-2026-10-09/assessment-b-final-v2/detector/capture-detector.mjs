import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = String.raw`F:\work\linkx-admin`
const detector = String.raw`C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs`
const outputDir = path.join(
  root,
  '.impeccable/critique/wave7-transferpanel-2026-10-09/assessment-b-final-v2/detector/attempt-2',
)

const targets = [
  {
    name: 'component',
    target: 'linkx-fe/src/components/LxTransferPanel/index.vue',
  },
  {
    name: 'demo',
    target: 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue',
  },
]

fs.mkdirSync(outputDir, { recursive: true })

for (const item of targets) {
  const absoluteTarget = path.join(root, item.target)
  const args = [detector, '--json', absoluteTarget]
  const command = [process.execPath, ...args]
    .map((part) => JSON.stringify(part))
    .join(' ')
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  })

  fs.writeFileSync(path.join(outputDir, `${item.name}.command.txt`), `${command}\n`)
  fs.writeFileSync(
    path.join(outputDir, `${item.name}.stdout.json`),
    result.stdout ?? '',
  )
  fs.writeFileSync(
    path.join(outputDir, `${item.name}.stderr.txt`),
    result.stderr ?? '',
  )
  fs.writeFileSync(
    path.join(outputDir, `${item.name}.exit-code.txt`),
    `${result.status ?? 'null'}\n`,
  )
  fs.writeFileSync(
    path.join(outputDir, `${item.name}.process.json`),
    `${JSON.stringify(
      {
        status: result.status,
        signal: result.signal,
        spawnError: result.error?.message ?? null,
      },
      null,
      2,
    )}\n`,
  )

  process.stdout.write(
    `${JSON.stringify({
      name: item.name,
      target: absoluteTarget,
      status: result.status,
      signal: result.signal,
      spawnError: result.error?.message ?? null,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    })}\n`,
  )
}
