import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const evidenceDirectory = 'F:/work/linkx-admin/.impeccable/critique/wave4-dynamicform-2026-10-07/final-recheck/assessment-b'
const sourcePath = path.join(evidenceDirectory, 'browser-runtime.json')
const outputPath = path.join(evidenceDirectory, 'browser-runtime-classified.json')

function classify(pageId, item) {
  const selector = item.selector ?? ''
  const className = item.className ?? ''
  const tag = (item.tag ?? '').toLowerCase()
  const evidence = `${selector} ${className}`

  if (/impeccable.*overlay|data-impeccable/i.test(evidence)) {
    return { category: 'overlay 自身', basis: 'selector 或 class 标记了 detector overlay' }
  }

  const componentRoot = {
    lxdynamicform: /dynamic-form-demo|lx-dynamic-form|lx-select__popper|el-select__popper|el-select-dropdown/i,
    lxupload: /lx-upload/i,
    lxdatepicker: /lx-date-picker|el-date-|el-picker-panel|el-date-table|el-input/i,
  }[pageId]
  if (componentRoot?.test(evidence)) {
    return { category: '目标组件', basis: 'selector 或 class 命中目标组件根或其传送弹层' }
  }

  if (tag === 'html' || tag === 'body' || /(?:^|\s)html\s*>\s*body(?:$|\s)/i.test(selector)) {
    return { category: 'VitePress 壳层', basis: '命中文档 html/body 根节点' }
  }

  if (/\.vp-doc|\.VPDoc(?:\b|\.)|\.vp-adaptive-theme|\.language-[a-z]+|\.shiki|\.custom-block/i.test(evidence)) {
    return { category: '文档正文', basis: 'selector 位于 .vp-doc 正文、代码示例或文档块内' }
  }

  if (/\.VPNav|\.VPSidebar|\.VPFooter|\.VPContent|\.VPLocalNav|\.VPDocAside|\.content-container|\.content(?:\b|\.)/i.test(evidence)) {
    return { category: 'VitePress 壳层', basis: 'selector 命中 VitePress 导航、侧栏、页脚或布局容器' }
  }

  return { category: '未定位', basis: '保存的 tag/class/selector 无法归入四类目标区域' }
}

function applyClassification(pageId, findings) {
  for (const item of findings ?? []) {
    item.initialCollectionCategory = item.category
    const classified = classify(pageId, item)
    item.category = classified.category
    item.classificationBasis = classified.basis
  }
}

function collectClassifiedLists(value, pageId, prefix = '', output = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output

  if (Array.isArray(value.findings) && value.findings.every((item) => item && typeof item === 'object' && 'category' in item)) {
    applyClassification(pageId, value.findings)
    const counts = {}
    for (const item of value.findings) counts[item.category] = (counts[item.category] ?? 0) + 1
    output[prefix || 'findings'] = { findingCount: value.findings.length, categories: counts }
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key !== 'finding') collectClassifiedLists(nested, pageId, prefix ? `${prefix}.${key}` : key, output)
  }
  return output
}

const report = JSON.parse(await readFile(sourcePath, 'utf8'))
const classificationSummary = []

for (const page of report.pageResults) {
  for (const view of Object.values(page.views ?? {})) applyClassification(page.target, view.findings)
  const interactions = collectClassifiedLists(page.interactions, page.target)

  const views = {}
  for (const [viewName, view] of Object.entries(page.views ?? {})) {
    const counts = {}
    for (const item of view.findings ?? []) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    views[viewName] = { findingCount: view.findings?.length ?? 0, categories: counts }
  }
  classificationSummary.push({ target: page.target, views, interactions })
}

report.classification = {
  method: '对 browser-runtime.json 已保存的视图及交互 detector 命中，依据 tag、className、selector 重新归类；不重新访问浏览器或运行 detector。原采集类别保存在 initialCollectionCategory。',
  categories: ['目标组件', 'VitePress 壳层', '文档正文', 'overlay 自身', '未定位'],
  summary: classificationSummary,
}

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({ outputPath, pages: report.pageResults.length, classificationSummary }, null, 2)}\n`)
