import { writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const evidenceDir = path.dirname(scriptDir)
const repoDir = path.resolve(scriptDir, '../../../../..')
const detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
const targets = [
  ['treeselect-source', 'linkx-fe/src/components/LxTreeSelect/index.vue'],
  ['cascader-source', 'linkx-fe/src/components/LxCascader/index.vue'],
  ['treeselect-docs', 'linkx-fe/docs/components/lxtreeselect.md'],
  ['cascader-docs', 'linkx-fe/docs/components/lxcascader.md'],
]

for (const [name, target] of targets) {
  const result = spawnSync(process.execPath, [detector, '--json', target], {
    cwd: repoDir,
    encoding: 'utf8',
  })
  await writeFile(path.join(evidenceDir, `${name}-final.stdout.json`), result.stdout ?? '', 'utf8')
  await writeFile(path.join(evidenceDir, `${name}-final.stderr.txt`), result.stderr ?? '', 'utf8')
  await writeFile(
    path.join(evidenceDir, `${name}-final.exit-code.txt`),
    String(result.status ?? 1),
    'utf8',
  )
  console.log(`${name}: exit ${result.status ?? 1}`)
}
