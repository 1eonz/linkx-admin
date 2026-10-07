# Assessment B 六目标 Detector 补充

日期：2026-10-07

本补充把项目台账要求的三组件源码目录与三组件文档合并记录。浏览器 overlay 仍只对组件页面执行，本文不读取或引用 Assessment A。

## 六目标结果

六个目标均使用 `C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json` 执行。每个 stdout 都是可解析的 JSON `[]`（3 字节，含换行），stderr 为 0 字节，退出码为 0，findings count 为 0，`scanIntegrity` 为 `valid`。

| 类别 | 目标 | stdout JSON | stderr | 退出码 | 解析/findings |
|---|---|---|---|---:|---|
| 组件源码 | `linkx-fe/src/components/LxDatePicker` | `lxdatepicker.stdout.json` | `lxdatepicker.stderr.txt` | 0 | JSON `[]`，0 |
| 组件源码 | `linkx-fe/src/components/LxDynamicForm` | `lxdynamicform.stdout.json` | `lxdynamicform.stderr.txt` | 0 | JSON `[]`，0 |
| 组件源码 | `linkx-fe/src/components/LxUpload` | `lxupload.stdout.json` | `lxupload.stderr.txt` | 0 | JSON `[]`，0 |
| 组件文档 | `linkx-fe/docs/components/lxdatepicker.md` | `docs-lxdatepicker.stdout.json` | `docs-lxdatepicker.stderr.txt` | 0 | JSON `[]`，0 |
| 组件文档 | `linkx-fe/docs/components/lxdynamicform.md` | `docs-lxdynamicform.stdout.json` | `docs-lxdynamicform.stderr.txt` | 0 | JSON `[]`，0 |
| 组件文档 | `linkx-fe/docs/components/lxupload.md` | `docs-lxupload.stdout.json` | `docs-lxupload.stderr.txt` | 0 | JSON `[]`，0 |

源码目录三项的原始扫描聚合仍见 `detector-summary.json`；文档三项的原始扫描聚合见 `docs-detector-summary.json`。文档扫描命令、原始 stdout、stderr 和退出码分别保存在对应的 `docs-*.command.txt`、`docs-*.stdout.json`、`docs-*.stderr.txt`、`docs-*.exit-code.txt`。

六目标静态扫描总 findings 为 0。该结论只覆盖 detector 的静态规则；它不替代三个组件页面的浏览器 overlay 证据，也不把 `[]` 解释为运行时无问题。
