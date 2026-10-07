# Assessment B 六目标证据索引

所有路径均相对本目录：`.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-b-current/`。

## 组件源码三目标

| 目标 | 命令 | stdout | stderr | 退出码 |
|---|---|---|---|---|
| `linkx-fe/src/components/LxDatePicker` | `lxdatepicker.command.txt` | `lxdatepicker.stdout.json` | `lxdatepicker.stderr.txt` | `lxdatepicker.exit-code.txt` |
| `linkx-fe/src/components/LxDynamicForm` | `lxdynamicform.command.txt` | `lxdynamicform.stdout.json` | `lxdynamicform.stderr.txt` | `lxdynamicform.exit-code.txt` |
| `linkx-fe/src/components/LxUpload` | `lxupload.command.txt` | `lxupload.stdout.json` | `lxupload.stderr.txt` | `lxupload.exit-code.txt` |

聚合：`detector-summary.json`。执行脚本：`run-detectors.mjs`。

## 组件文档三目标

| 目标 | 命令 | stdout | stderr | 退出码 |
|---|---|---|---|---|
| `linkx-fe/docs/components/lxdatepicker.md` | `docs-lxdatepicker.command.txt` | `docs-lxdatepicker.stdout.json` | `docs-lxdatepicker.stderr.txt` | `docs-lxdatepicker.exit-code.txt` |
| `linkx-fe/docs/components/lxdynamicform.md` | `docs-lxdynamicform.command.txt` | `docs-lxdynamicform.stdout.json` | `docs-lxdynamicform.stderr.txt` | `docs-lxdynamicform.exit-code.txt` |
| `linkx-fe/docs/components/lxupload.md` | `docs-lxupload.command.txt` | `docs-lxupload.stdout.json` | `docs-lxupload.stderr.txt` | `docs-lxupload.exit-code.txt` |

聚合：`docs-detector-summary.json`。执行脚本：`run-doc-detectors.mjs`。

## 范围说明

文档 detector 是静态文件扫描，未新增浏览器场景。三个组件页面的 10 个 overlay 场景、截图、console/network 与注入证据仍由 `browser-capture-summary.json` 及各场景 JSON 记录。
