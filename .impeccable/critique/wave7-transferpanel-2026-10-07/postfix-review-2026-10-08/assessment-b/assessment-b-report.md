# Assessment B 取证结果

日期：2026-10-08。范围仅含 `LxTransferPanel`、`LxVirtualTree` 的源码目录与中文文档；本评估没有读取 Assessment A、设计评审报告或代码复审报告，也没有修改产品源码。

## CLI Detector

四个目标分别以 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>` 扫描。四份 stdout 都是合法 JSON 空数组 `[]`，stderr 为空，退出码均为 0；每项摘要同时核验了三者，命中数为 0。

| 目标 | 机器摘要 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel` | `detector/lxtransferpanel-component/summary.json` |
| `linkx-fe/src/components/LxVirtualTree` | `detector/lxvirtualtree-component/summary.json` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `detector/lxtransferpanel-doc/summary.json` |
| `linkx-fe/docs/components/lxvirtualtree.md` | `detector/lxvirtualtree-doc/summary.json` |

各目录内另存原始 `stdout.json`、`stderr.txt`、`exit-code.txt` 和 `command.txt`。此结果只代表 CLI 静态规则零命中。

## 浏览器证据

文档页使用现有 `http://127.0.0.1:4174`，Edge 154.0.4258.53 的 Playwright 独立 BrowserContext；每个目标/视口都开新页面，视口为 1440×1000 与 375×812。Mutation preflight 确认标题可改、内联脚本可追加并执行。随后从自己启动的 8400 live-server 注入 detector，等待 2.5 秒；四页均确认脚本与 API 存在、console 报告 detector 结果，未见 pageerror 或失败请求。

| 页面 | Console 扫描数 | Overlay DOM 节点数 | 截图 |
| --- | ---: | ---: | --- |
| TransferPanel 桌面 | 19 | 37 | `browser/lxtransferpanel-desktop-1440x1000-overlay.png` |
| TransferPanel 375px | 8 | 15 | `browser/lxtransferpanel-mobile-375x812-overlay.png` |
| VirtualTree 桌面 | 7 | 13 | `browser/lxvirtualtree-desktop-1440x1000-overlay.png` |
| VirtualTree 375px | 9 | 17 | `browser/lxvirtualtree-mobile-375x812-overlay.png` |

Overlay 节点数包含标签与不可见候选框，不等同命中数。`browser/session.json` 保存每视图运行确认、视口和截图；`*-detailed.json`/`session-detailed.json` 还保存完整 console 参数与命中 DOM 的 selector、文本、HTML。截图中的黄色 banner 和标记可见。Edge 以 headless 模式运行，没有保留可交互的 Codex `[Human]` 标签页；浏览器 UI 展示因此降级为可复核截图和 DOM/console 记录。

## 命中归因

- 文档命中主要来自 VitePress：`button.copy` 的隐藏 raster 背景、手机导航 `span.container` 的图标裁切、`body` 上的 easing/transition，以及文档说明段落和列表的 line-length。中文段落约 86–110 字符但在受限正文宽度中正常换行；这些行长规则不直接映射为组件源码问题。
- `edge-flush-cards` 指向 Props 的语义化 `<table>`，不是卡片；属于规则把文档表格当作卡片的误报。
- TransferPanel 的 `span.lx-transfer-panel__scope-hint` 命中真实 11px 提示文本，保留为组件级有效命中。375px 下“加载中/加载失败”两个 demo 状态按钮分别被 `.lx-transfer-panel__mobile-switch` 判定遮挡 33%；记录为潜在 demo/组件布局问题，不作为误报消除。
- VirtualTree 375px 下 demo 按钮“筛选第二个辖区”被 `.lx-virtual-tree__filter` 判定遮挡 48%，`label.virtual-tree-demo__strict` 被已勾选树行判定遮挡 70%；两项均保留为 demo 交互命中，供综合评审判断。
- Mutation preflight 单独记录到文档站 `/favicon.ico` 404 console 消息；它不属于 detector 结果。后续四个视图没有 pageerror 或 requestfailed。
- 375px 页面 `documentWidth` 为 615px；浏览器证据显示文档存在横向溢出信号，需结合页面内表格滚动容器由综合评审判断归属。

## 快照与清理

`target-sha256.txt` 保存两个组件目录内全部源码/演示文件及两份 Markdown 的 SHA-256。临时 live-server 由 `browser/live-server-stop.command.txt` 停止：退出码 0，stdout 为 `Stopped live server on port 8400.`，stderr 为空。确认 PID 23804 已退出、8400 不再监听、live-server 状态文件不存在；原有 4174/PID 26280 仍在运行。
