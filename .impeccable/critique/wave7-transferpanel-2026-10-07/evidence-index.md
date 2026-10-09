# Wave 7 证据索引

| 证据 | 路径 | 结论 |
| --- | --- | --- |
| detector 命令 | `assessment-b/detector.command.txt` | 已执行 |
| detector JSON | `assessment-b/detector.stdout.json` | 有效 JSON `[]` |
| detector stderr | `assessment-b/detector.stderr.txt` | 空 |
| detector 退出码 | `assessment-b/detector.exit-code.txt` | `0` |
| 浏览器命令 | `assessment-b/browser-capture.command.txt` | 已执行 |
| 浏览器退出码 | `assessment-b/browser-capture.exit-code.txt` | `0` |
| 浏览器运行结果 | `assessment-b/browser-capture.stdout.json` | 7 视图、0 页面错误、0 外部请求 |
| 浏览器明细 | `assessment-b/browser-evidence.json` | 注入与视图截图索引 |
| 运行快照 | `assessment-b/runtime.json` | 版式、状态、焦点和 console 证据 |
| overlay 停止 | `assessment-b/overlay.stop.*` | 退出码 `0` |
| VitePress 停止 | `assessment-b/vitepress.stop.*` | 退出码 `0` |
| 5173 服务停止 | `assessment-b/port-5173.stop.*` | 退出码 `0` |

`[]` 仅表示静态规则零命中；正式结论还依赖独立设计评审、代码审核、浏览器截图和后续复验。
