# Wave 7 LxTransferPanel Assessment B

本报告只记录静态 detector 和浏览器/overlay 证据，不含 Assessment A 的主观评分，也不构成综合 Critique 结论。没有读取 Assessment A 或旧综合评审内容；没有修改产品源码。

此前一轮因把给定 E2E 摘要末尾多出的字符当成长度不匹配而中止。主任务复核并更正为 64 位 SHA256 `C987D12BB9F727945384C81A7BACD3368D809E95B91ED95B9339E59D62FB61BC` 后，本轮在新目录重新核验并执行。

七项冻结文件现均与指定 SHA256 匹配，完整 expected/actual 记录在 `hash-check.stdout.json`，退出码为 0。

## 静态 Detector

命令：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxTransferPanel/index.vue`

stdout 原文为 `[]`，由 Node JSON.parse 验证为数组且 0 项；stderr 为空；退出码为 0。三件套分别保存在 `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`，解析及退出状态核验在 `detector-validation.json`。这只表示该 Vue 源文件的静态规则零命中，不能代替浏览器扫描或作为整体验收通过结论。

## 浏览器与 Overlay

目标 `http://127.0.0.1:4174/components/lxtransferpanel.html` 在独立 Chrome 154 新 profile/新页面中返回 HTTP 200。页面可变更预检成功：标题改为 `[Human] LxTransferPanel Assessment B`，新建 script 节点成功追加并执行。`http://127.0.0.1:8512/detect.js` 成功加载，`window.impeccableScan` 和 `window.impeccableDetect` 均可调用；浏览器日志记录了逐状态扫描组数，结构化 finding 与截图一并留档。

下表的“命中项”是把返回对象中的逐条规则项展开计数；“console 组数”是 detector 原始 `[impeccable] N anti-patterns found` 文案里的元素分组数，两者定义不同。空、加载、错误状态是在切换 HUD 深色主题后采集；移动视图切回默认浅色主题。

| 视图 | 视口 | Console 组数 | 规则项 | demo 区域 | VitePress 文档壳 | 关键状态 |
|---|---:|---:|---:|---:|---:|---|
| 默认 | 1440×1000 | 13 | 14 | 0 | 14 | 1,420 个待选节点，5 项已选 |
| HUD | 1440×1000 | 51 | 52 | 38 | 14 | HUD 深色主题 |
| 空结果（HUD） | 1440×1000 | 18 | 19 | 5 | 14 | 树 0 节点，已有 5 项选择保留 |
| 加载中（HUD） | 1440×1000 | 45 | 46 | 38 | 8 | `aria-busy=true`，保留 5 项 |
| 错误（HUD） | 1440×1000 | 45 | 46 | 38 | 8 | 错误提示和重试按钮可见，保留 5 项 |
| 移动默认主题 | 390×844 | 4 | 5 | 0 | 5 | 无页面横向溢出 |

VitePress 文档壳命中包括说明段落 `line-length`、`.copy` 代码复制按钮的 `buried-raster`、API 表格 `edge-flush-cards`、文档代码片段 `text-occlusion`，以及 `body` 上的过渡/弹跳规则；移动视图还命中导航汉堡图标容器 `span.container` 的裁切规则。DOM 归属和截图显示这些目标均在 `.transfer-panel-demo` 外，按文档壳命中记录，不当作 LxTransferPanel 缺陷。

demo 内 HUD 扫描记录 37 项 `ai-color-palette`，目标包括宿主状态按钮、树行、复选框、图标、节点标签和摘要计数；这些命中集中在示例显式启用的 HUD 主题，规则描述为“Cyan neon text on dark background”，应结合主题令牌复核，Assessment B 不自行判为缺陷或误报。demo 另有 1 项 `low-contrast` 命中 `.transfer-panel-demo__note`，detector 报告文字 `#94a3b8` 对 `#ffffff` 为 2.6:1；这是组件示例区域中可复核的具体命中。默认和移动默认主题没有 demo 内 overlay 命中。

Network 事件共记录 430 项，检测器第一次统计把 6 个 `data:image/svg+xml` 内联资源算作外部候选；按 HTTP(S) origin 重新核对后，没有记录到外部网络请求。浏览器另有一条本地 `http://127.0.0.1:4174/favicon.ico` 404，不影响页面 200 或 demo 渲染。完整 console、网络候选、DOM 目标、scan 结果见 `browser-evidence.json`、`browser-console.json`、`browser-network.json` 和 `browser-summary.json`。

## 运行清理

独立 overlay 服务在临时项目根目录按 `live-server.mjs --background --port=8512` 启动，PID `11008`，启动退出码 0；使用同一临时根执行 `live-server.mjs stop --keep-inject` 后退出码 0。端口快照证明停止后 8512 已释放，既有 4174/PID `10672` 与 8489/PID `26684` 仍监听，4174 目标再次返回 HTTP 200。新 Chrome 的 CDP 9515 及独立 profile 进程也已关闭。

CDP 采集器在写完所有结构化浏览器证据和 9 张截图后，因未主动关闭 WebSocket 而继续持有进程；本轮通过 Ctrl+C 结束 wrapper，wrapper 退出码为 1，stdout/stderr 未由 wrapper 落盘。该生命周期问题记录在 `browser-run.wrapper-note.md`，不改变已保存的目标响应、预检、overlay 加载、逐视图 scan 与截图。overlay 注入确实成功，但浏览器已关闭，因此没有声称当前仍有可见的 `[Human]` 标签。

本轮证据覆盖 detector、overlay 注入和指定状态的浏览器观察；没有执行 Assessment A、人工设计评分或真实后端验收。
