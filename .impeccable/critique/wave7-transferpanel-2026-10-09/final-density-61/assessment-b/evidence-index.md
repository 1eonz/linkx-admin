# 证据索引

- `report.md`：中文 Assessment B 结论、归因与优先级。
- `detector-commands.md`：静态 detector 命令、JSON/stderr/exitCode 与 SHA 关联。
- `index.json` / `demo.json` / `doc.json`：三份当前 detector JSON（均 `[]`）。
- `index.stderr` / `demo.stderr` / `doc.stderr`：三份 stderr（均空）。
- `index.exitCode` / `demo.exitCode` / `doc.exitCode`：三份退出码（均 `0`）。
- `browser-evidence.json`：注入、控制台、六视图三状态和源文件完整性总记录。
- `overlay-summary.json`、`evidence-summary.csv`：按视图汇总 overlay 命中与隐藏 DOM 归因。
- `measurement-summary.txt` / `.csv`：长名称折叠/展开、列表滚动、移除按钮尺寸/命中、页面溢出测量。
- `light-*` / `hud-*` `*-baseline.json`：无 overlay 基线测量。
- `light-*` / `hud-*` `*-overlay.json`：实时 overlay 扫描结果与元素归因。
- `*-console.json`：每个视图控制台日志。
- `screenshots/`：每视图每状态 baseline 与 overlay 截图（共 36 张）。
- `overlay-server-start.json` / `overlay-server-stop.json`：独立 8461 overlay 服务启动、停止证据。
- `source-before.json` / `source-after.json`：三份冻结源文件 SHA256。
