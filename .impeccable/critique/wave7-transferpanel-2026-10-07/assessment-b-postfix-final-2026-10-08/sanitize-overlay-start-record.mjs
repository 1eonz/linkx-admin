import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve(
  '.impeccable/critique/wave7-transferpanel-2026-10-07/assessment-b-postfix-final-2026-10-08',
)

function summarize(raw) {
  try {
    const value = JSON.parse(raw)
    return JSON.stringify({
      pid: value.pid ?? null,
      port: value.port ?? null,
      credentialValueStored: false,
    })
  } catch {
    return raw.trim()
  }
}

const startPath = path.join(outDir, 'overlay-server.start.stdout.json')
await writeFile(startPath, summarize(await readFile(startPath, 'utf8')))

const verificationPath = path.join(outDir, 'server-start-verification.json')
const verification = JSON.parse(await readFile(verificationPath, 'utf8'))
for (const field of ['overlayStartStdout', 'overlayStartSummary']) {
  if (typeof verification[field] === 'string') verification[field] = summarize(verification[field])
}
await writeFile(verificationPath, JSON.stringify(verification, null, 2))
