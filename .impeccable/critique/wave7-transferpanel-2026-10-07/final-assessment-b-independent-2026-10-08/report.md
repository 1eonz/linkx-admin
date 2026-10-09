# Wave 7 LxTransferPanel Assessment B（修前过程材料）

**状态：未完成正式 Assessment B。** 本报告只保留主控要求暂停前已经完成的修前静态和浏览器证据，不能作为修改后冻结版本的审查结论，也不包含与 Assessment A 的综合或整体评分。

## 取证范围与隔离

- 页面：`http://127.0.0.1:4174/components/lxtransferpanel`。
- 静态目标：组件 `index.vue`、Demo `basic.vue`、组件文档 `lxtransferpanel.md`。
- 浏览器：Playwright 启动的独立 Chromium 154.0.8037.95；每个视图使用新 BrowserContext 和新页面，未复用用户标签。
- 可变注入预检通过：`document.title` 修改与恢复、追加脚本、脚本执行和移除均成功。
- live-server 的 `/detect.js` 返回 HTTP 200；四个目标视图均成功注入并等待扫描完成。
- 主控报告 4174 曾退出并在原端口恢复。本执行者没有收到失败响应或 stderr；详见 [incident-4174.md](incident-4174.md)。正式页面证据均采自恢复后的成功访问。

## 静态 detector

每个目标分别执行 `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json <绝对路径>`。三份原始 stdout 都是 `[]`，对应 stderr 为空且真实进程退出码均为 0；这表示三个源码目标的静态规则零命中。它不表示运行页面视觉通过，运行时 overlay 在文档页仍观察到多个命中。

| 目标 | stdout | stderr | 真实退出码 | 扫描前后 SHA-256 |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 空 | 0 | `9250d31a3a382a7d252459c671614cda4ca681fe0da0b3c791d3219d4684a0a1` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | 空 | 0 | `c8286aff1b94fcab64be579731839228489225577caf79b3ff2ca15e642ff286` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]` | 空 | 0 | `c13b6cf97c9fab39e62ccc82d4cf3b9c71baec751d1c3eb4f968c1d33fbb9cc2` |

命令行、开始/结束时间、退出码和各目标哈希见对应 `*.metadata.json` 与 [detector-index.json](detector-index.json)；原始 JSON 和 stderr 各自保存在 `*.stdout.json` / `*.stderr.txt`。

## 浏览器证据

| 视图 | viewport | 页面/面板 | overlay 总数 / 可见数 | 横向溢出 | 浏览器 console 摘要 |
|---|---:|---|---:|---|---|
| 浅色桌面 | 1440×1000 | HTTP 200；面板 880×380 | 12 / 11 | 否 | 13 条 anti-pattern 汇总；有 `bounce-easing` 命中 |
| 文档深色 | 1440×1000 | HTTP 200；面板 880×380 | 202 / 25 | 否 | 203 条汇总，主项为 `ai-color-palette` |
| HUD 深色 | 1440×1000 | HTTP 200；面板 880×380 | 237 / 60 | 否 | 238 条汇总，主项为 `ai-color-palette` |
| 375px 窄屏 | 375×900 | HTTP 200；面板 327×842 | 6 / 3 | **是，documentWidth 615** | 7 条汇总；命中裁切和遮挡规则 |

overlay 原始归因字段中，“属于组件”是目标元素本身位于 `.lx-transfer-panel` 内，“属于 Demo”是目标元素位于 `.transfer-panel-demo` 内；后者包含前者。页面级 `<main>`/文档容器祖先会包住 Demo，不能据此把所有命中算到组件。

- 浅色桌面：组件和 Demo 内没有 overlay 目标。命中落在文档段落/列表、Props 表格和文档代码复制按钮；有一条 `bounce-easing` 汇总。运行时没有 JS 异常；CDP 记录到文档站 favicon 请求 `404`。
- 文档深色：190 条 `ai-color-palette` 目标位于组件和 Demo 之外，样例为文档代码高亮的 `span`；另有文档 Props 表格、长文本和复制按钮命中。该批次的 overlay 计数受整页文档内容影响，不能作为组件计数。
- HUD 深色：`ai-color-palette` 命中跨文档渲染内容、Demo 和组件。目标元素中有 34 个在 `.lx-transfer-panel` 内、35 个在 `.transfer-panel-demo` 内（嵌套计数）；代表元素包括选中树行、原生复选框与图标路径。该规则名称是“深色背景上的紫/紫罗兰霓虹文字”；捕获证据没有把每个目标颜色映射到设计令牌，因此将其记为需要源码/令牌复核的实际目标命中，不能直接当成缺陷或误报。
- 375px：面板本身宽 327px，视口内可见且截图中两栏内容已纵向堆叠；页面 documentWidth 达 615px。唯一裁切目标记录为 `.container`，不在组件或 Demo 内，归属外层容器的可能性较高但本轮没有继续定位。两条“文字被遮挡”命中指向 Demo 工具栏的“加载中”“加载失败”按钮，所在 `<details>` 默认关闭；不在组件本体内。代码复制按钮命中同样来自文档内容。

除浅色视图的 favicon 404 外，正式视图没有页面 JS 异常或失败请求；另外三个视图没有 CDP 网络错误。预检也记录到 favicon 404。完整控制台、CDP 网络事件、overlay 目标和状态见 [browser-evidence.json](browser-evidence.json)；截图见 [screenshots/](screenshots/)。

## 进程收尾与版本边界

- 正式 live-server 在独立临时目录启动，启动命令退出码 0，PID 9808，端口 8400；停止命令 `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs" stop --keep-inject` 在同一临时目录执行，退出码 0。用户 4174 服务未被停止。
- 早期端点探针曾因命令工作目录没有切到临时目录而启动在仓库根目录；随后按仓库根目录执行 `stop --keep-inject`，退出码 0。该准备性探针没有注入页面。相关启动/停止命令、stderr 和工作目录更正分别留在 `live-server-start.*`、`live-server-root-stop.*` 与 `live-server-preflight-stop.*`。
- 四个 Playwright 页面和 BrowserContext 已关闭；Chromium 由采集脚本的 `browser.close()` 收尾。正式采集退出码 0，stderr 为空。
- 本轮完成时采集到的三个当前源码哈希仍与静态扫描基线一致，见 [current-source-hashes.json](current-source-hashes.json)。主控要求暂停并将在修订后重新委托；因此后续冻结内容必须重新执行 detector 与浏览器流程，不能沿用本报告的视觉结果。
