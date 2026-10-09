# Assessment B 证据索引

本目录记录 LxTransferPanel 选中项密度的 detector、浏览器测量与截图。运行数据为 Assessment B 独立采集，不包含 Assessment A 内容。

## 汇总

- [`assessment-b.md`](assessment-b.md)：结论、测量、命中归属及验证边界。
- [`detector/summary.json`](detector/summary.json)：三项 detector 的状态、JSON 有效性、命中数、stderr 与源码哈希汇总。
- [`browser/run-summary.json`](browser/run-summary.json)：六个新页面的状态、注入信息、DOM 测量、Console 与截图清单。
- [`browser/overlay-summary.json`](browser/overlay-summary.json)：六视图 overlay 扫描计数及采集起止源码哈希。

## 静态扫描

| 目标 | 输出 | stderr | 退出码 | 命令 |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | [`stdout`](detector/component.stdout.json) | [`stderr`](detector/component.stderr.txt) | [`exit`](detector/component.exit-code.txt) | [`command`](detector/component.command.txt) |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | [`stdout`](detector/demo.stdout.json) | [`stderr`](detector/demo.stderr.txt) | [`exit`](detector/demo.exit-code.txt) | [`command`](detector/demo.command.txt) |
| `linkx-fe/docs/components/lxtransferpanel.md` | [`stdout`](detector/docs.stdout.json) | [`stderr`](detector/docs.stderr.txt) | [`exit`](detector/docs.exit-code.txt) | [`command`](detector/docs.command.txt) |

各 stdout 均为有效 JSON `[]`，stderr 为空，退出码为 0。该结果限于静态 detector 规则。

## 浏览器视图

每个视图有 DOM/Console 采集 JSON、overlay 逐节点 JSON、无 overlay 截图和 overlay 截图。页面均为 HTTP 200，且脚本预检、注入、扫描成功。

| 视口 | 主题 | DOM 与 Console | Overlay 命中 | 页面截图 | Overlay 截图 |
|---|---|---|---:|---|---|
| 1440×1000 | 浅色 | [`view`](browser/views/1440-light.json) | [`scan`](browser/views/1440-light.overlay.json) | [截图](browser/screenshots/1440-light.png) | [截图](browser/overlay-screenshots/1440-light.png) |
| 1440×1000 | HUD | [`view`](browser/views/1440-hud.json) | [`scan`](browser/views/1440-hud.overlay.json) | [截图](browser/screenshots/1440-hud.png) | [截图](browser/overlay-screenshots/1440-hud.png) |
| 390×844 | 浅色 | [`view`](browser/views/390-light.json) | [`scan`](browser/views/390-light.overlay.json) | [截图](browser/screenshots/390-light.png) | [截图](browser/overlay-screenshots/390-light.png) |
| 390×844 | HUD | [`view`](browser/views/390-hud.json) | [`scan`](browser/views/390-hud.overlay.json) | [截图](browser/screenshots/390-hud.png) | [截图](browser/overlay-screenshots/390-hud.png) |
| 320×844 | 浅色 | [`view`](browser/views/320-light.json) | [`scan`](browser/views/320-light.overlay.json) | [截图](browser/screenshots/320-light.png) | [截图](browser/overlay-screenshots/320-light.png) |
| 320×844 | HUD | [`view`](browser/views/320-hud.json) | [`scan`](browser/views/320-hud.overlay.json) | [截图](browser/screenshots/320-hud.png) | [截图](browser/overlay-screenshots/320-hud.png) |

## 哈希与限制

组件、Demo、文档的 browser 采集起止 SHA-256 相同；完整值见 `browser/run-summary.json` 和 `browser/overlay-summary.json`。运行态扫描在 1440px 浅色页记录一条未归因的 404 Console 文本；六页采集器均记录 0 个页面错误、失败请求和 4xx/5xx 响应。Assessment B 未执行键盘路径的完整可访问性验收或真实后端联调。
