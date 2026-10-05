import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(outputDirectory, '../../../..')
const browserScript = resolve(outputDirectory, 'browser-evidence.mjs')
const command = `node "${browserScript}"`
const result = spawnSync(process.execPath, [browserScript], {
  cwd: repositoryRoot,
  maxBuffer: 32 * 1024 * 1024,
  windowsHide: true,
})

writeFileSync(resolve(outputDirectory, 'browser-rerun.command.txt'), `${command}\n`)
writeFileSync(resolve(outputDirectory, 'browser-rerun.stdout.json'), result.stdout ?? Buffer.alloc(0))
writeFileSync(resolve(outputDirectory, 'browser-rerun.stderr.txt'), result.stderr ?? Buffer.alloc(0))
writeFileSync(
  resolve(outputDirectory, 'browser-rerun.exit-code.txt'),
  `${result.status ?? 'null'}\n`,
)
if (result.error) {
  writeFileSync(resolve(outputDirectory, 'browser-rerun.launch-error.txt'), `${result.error.stack ?? result.error}\n`)
}

if (result.stdout?.length) process.stdout.write(result.stdout)
if (result.stderr?.length) process.stderr.write(result.stderr)
process.exitCode = result.status ?? 1
