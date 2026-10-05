# 修复前取证状态

本目录当前保存的是后续修复前的 Assessment B 原始取证，**不能作为最终复验或综合 Critique 结论**。源码扫描、页面截图和浏览器数据均保留；待 DatePicker 实现再次稳定后，需重新运行 detector 并完整重拍所有浏览器状态。

## 本轮采集

- 浏览器：Microsoft Edge，Playwright headed context。
- 文档站：本地临时 VitePress `http://127.0.0.1:5181/components/lxdatepicker`；开始时 5180 未监听。本轮未修改应用源码。
- 浏览器证据时间：`browser-evidence.json` 的 `generatedAt` 为 `2026-10-04T20:47:41.214Z`。
- 九个独立视口/状态：1440×900 默认态；375×812 普通与快捷；320×812 普通与快捷；320×375 普通与快捷；390×375 普通与快捷。
- 九个页面状态均为 HTTP 200；组件相关响应无非 200、无 failed request、无 page error；九个视图均成功注入 `detect.js` 并取得 HTTP 200。
- 静态 detector 输出 `[]`，stderr 为空，退出码 `0`。仅表示 `linkx-fe/src/components/LxDatePicker/` 静态规则零命中，不表示浏览器无问题。

## 观测摘录

| 视口/状态 | 弹层边界（x, y, width, height） | 末行 viewport 内 | panel scrollTop / 最大值 | 文档 scrollY 增量 | Overlay 汇总 |
|---|---:|---|---:|---:|---:|
| 375×812 普通 | 26, 158, 324, 365 | 是 | 无内部滚动 | +420 | 17 |
| 375×812 快捷 | 7, 193, 361, 426 | 是 | 无内部滚动 | 0 | 39 |
| 320×812 普通 | 11, 226, 298, 365 | 是 | 无内部滚动 | +420 | 17 |
| 320×812 快捷 | 11, 193, 298, 426 | 是 | 无内部滚动 | 0 | 42 |
| 320×375 普通 | 11, 9, 298, 357 | 是 | 8 / 8 | 0 | 13 |
| 320×375 快捷 | 11, 9, 298, 357 | 是 | 69 / 69 | 0 | 41 |
| 390×375 普通 | 33, 9, 324, 357 | 是 | 8 / 8 | 0 | 13 |
| 390×375 快捷 | 14, 9, 362, 357 | 是 | 69 / 69 | 0 | 39 |

在 375×812 和 320×812 的普通弹层中，弹层与末行都已完全可见，日期面板没有需要滚动的溢出；对弹层额外执行 wheel 后，文档 `scrollY` 各增加 420px。短屏 320×375 和 390×375 普通/HUD 弹层内部滚至末端后，末行完全可见且文档 `scrollY` 不变。快捷预设在四个快捷状态中均为“今日 / 本周 / 近30天”。这些只是本轮浏览器观测，后续修复后必须复验。

## Overlay 归因

Console 中的汇总计数覆盖整张 VitePress 页面，不是 DatePicker 缺陷数。普通态主要命中文档代码块复制按钮（`buried-raster`）、文档正文行长/破折号、页面主体布局过渡、文档表格边缘，以及 9 个日期控件生成的 popper 阴影候选；普通区间打开时可见弹层是这些 popper 中的一项，其余为示例页面的其他日期面板。快捷态额外命中 Demo 中使用主题主色的 Element Plus 日期图标、SVG 和路径（`ai-color-palette`），以及日期表头/选中范围节点；需要结合设计令牌和当前组件分别判断，不能按计数认定缺陷。

## 环境清理

- 临时 overlay helper 8400 已停止，`helper-stop-pre-fix.*` 保存输出和退出码 `0`。停止脚本提示 `.impeccable/live/config.json` 缺失，无法移除注入标签；helper 本身已经停止。
- 本轮临时 VitePress PID 42428 / 5181 已停止，`doc-server-stop-pre-fix.*` 保存输出和退出码 `0`。
- 最后端口检查没有 5180、5181 或 8400 的监听。
- 第一次 VitePress 进程曾因 Windows watcher 对 `docs/.vitepress/dist/auth-img-sample.png` 报 `EBUSY` 退出；重启后的完整九上下文浏览器采集退出码为 `0`。首次 watcher 错误保存在 `doc-server.stderr.txt`，重启日志在 `doc-server-restart.*`，最终采集浏览器退出状态在 `browser-capture.exit-code.txt`。
