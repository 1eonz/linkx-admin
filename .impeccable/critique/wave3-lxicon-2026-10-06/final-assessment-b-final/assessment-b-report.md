# LxIcon Assessment B

## 范围与隔离

本报告记录最终版本 `linkx-fe/docs/components/lxicons.md` 的 Assessment B：静态 detector、8 个浏览器视图、console 和 overlay DOM 证据。目标页面为 `http://127.0.0.1:4174/components/lxicons.html`。源码 SHA-256：`C5406F0A3C86FF82F31CD5C03CCAFC0F34462640B214793CEEF987AE9C920E12`。最终报告、采证脚本和证据都在当前目录；未读取其他评估或代码复审材料。临时 live-server 会话记录已在停止服务时清理。

## 静态 Detector

命令：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/docs/components/lxicons.md
```

标准输出 JSON 为 `[]`；标准错误 0 字节；真实进程退出码为 `0`。证据分别保存在 `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt` 和 `detector-command.txt`。该结果只说明这份 Markdown 源码没有静态规则命中，不代表运行页面没有 browser detector 命中。

## 浏览器视图

使用新建的隔离 Chrome 用户目录和全新 BrowserContext；每个视图新建一个标签。8/8 标签成功预检页面可变更、加载 `http://localhost:8400/detect.js`，并确认 `window.impeccableScan` 已建立。8 张截图、每条原始 console 事件及对应 overlay DOM 节点都保存在 `browser-evidence.json`；`browser-summary.json` 是逐视图摘要。

| 视图 | Console 命中 | 组件节点 | 文档页节点 | 页面级 banner | 命中 overlay 自身 |
|---|---:|---:|---:|---:|---:|
| 桌面 / light / 目录 | 5 | 0 | 4 | 1 | 0 |
| 桌面 / light / 空态 | 6 | 0 | 5 | 1 | 0 |
| 桌面 / dark / 目录 | 7 | 0 | 6 | 1 | 0 |
| 桌面 / dark / 空态 | 8 | 0 | 7 | 1 | 0 |
| 375px / light / 目录 | 3 | 0 | 2 | 1 | 0 |
| 375px / light / 空态 | 3 | 0 | 2 | 1 | 0 |
| 375px / dark / 目录 | 5 | 0 | 4 | 1 | 0 |
| 375px / dark / 空态 | 5 | 0 | 4 | 1 | 0 |

每个 console 计数均来自 `[impeccable] N anti-patterns found`。单个命中节点的 selector、规则标签、文本片段、范围和矩形位置在 `browser-evidence.json` 的 `views[].overlays.hits[]` 中。页面级 banner 只在 screenshot/DOM 记录为 banner 节点，具体规则及目标由同视图的 console 事件记录。

## 命中归属

8 个视图均没有命中 `.icon-catalog` 内的组件节点，也没有节点指向 `.impeccable-overlay`、label、banner 或 live overlay 自身。普通节点命中都在 VitePress 文档页及 `.icon-catalog` 之外的说明内容：

- `line-length`：说明段落 `<p>`，约 86 字符/行；共 12 条 console 命中。
- `buried-raster`：文档代码区 `button.copy`，共 8 条。
- `ai-color-palette`：深色视图中的文档 `<span>`，文本为 `size` / `name`，共 8 条。
- `edge-flush-cards`：设计清单 Markdown `<table>`，仅桌面空态共 2 条。
- `clipped-overflow-container`：375px 视图的 VitePress `span.container`，共 4 条。

此外，每个视图的 page-level console 记录都包含 `overused-font`（body 上的 Inter 文本占比 67% 或 91%）和 `layout-transition`（body 的 height/padding transition）。这些命中归属于文档页面，不归属于 LxIcon 目录组件；本 Assessment B 只报告规则及 DOM 归属，不判断文档设计意图。detector 自身命中数为 0。

## 客观状态采证

- 4 个空态视图都呈现 `role="status"`、`aria-live="polite"`、`aria-atomic="true"`，文本为“无匹配图标”。
- 8 个视图的 `html.dark` 与 light/dark 设置一致。宽度采样为桌面 `1425/1440`、375px `375/375`。
- 在桌面 light 目录视图，箭头基线 computed transition 为 `transform 0.2s ease-out`；模拟 `prefers-reduced-motion: reduce` 后为 `none 1e-05s`。箭头 transform 为 `matrix(-1, 0, 0, -1, 0, 0)`。
- 筛选改词复验字段**无效，结论未定**：脚本在同一 Runtime.evaluate 调用中连续 dispatch 两次 input 后立即读取 DOM，没有等待 Vue 更新队列刷新。8 个 `changedQueryReopenedMatch=false` 和 `openGroupCount=0` 均已在 JSON 中标记为 `measurementValid=false`，不能解读为页面行为或缺陷。该行为没有得到有效的浏览器结论。
- 8 个页面均无 JavaScript exception；桌面 light 目录页记录 1 个 404 资源事件，捕获日志没有提供具体资源 URL。

## 截图与服务清理

截图：`desktop-light-directory.png`、`desktop-light-empty.png`、`desktop-dark-directory.png`、`desktop-dark-empty.png`、`mobile-375-light-directory.png`、`mobile-375-light-empty.png`、`mobile-375-dark-directory.png`、`mobile-375-dark-empty.png`。

本次启动的 Impeccable live server 在 8400 端口、PID 44504，已通过 `node .../live-server.mjs stop --keep-inject` 停止，停止命令退出码 `0`。`service-status-after-stop.json` 记录 8400 已无监听，用户原有 4174 仍由 PID 6848 监听。停止记录及命令 stdout/stderr/退出码保存在 `live-server-session.json` 和 `live-server-stop.*`。
