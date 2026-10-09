# Assessment B：Detector 与浏览器证据

本报告只记录静态 detector、Impeccable 浏览器 overlay、运行目标和证据边界；不含设计评分，也不构成代码复审结论。

## 静态 detector

按 markup target 分别执行 `node "<skill>/scripts/detect.mjs" --json "<target>"`。六次 stdout 都是有效 JSON 空数组 `[]`，stderr 均为 0 bytes，退出码均为 0。各自的原命令、stdout、stderr 和退出码保存在 `detector/`：

| Target | JSON | stderr | exit |
| --- | --- | ---: | ---: |
| `LxTransferPanel/index.vue` | `[]` | 0 bytes | 0 |
| `LxTransferPanel/demo/basic.vue` | `[]` | 0 bytes | 0 |
| `docs/components/lxtransferpanel.md` | `[]` | 0 bytes | 0 |
| `LxVirtualTree/index.vue` | `[]` | 0 bytes | 0 |
| `LxVirtualTree/demo/basic.vue` | `[]` | 0 bytes | 0 |
| `docs/components/lxvirtualtree.md` | `[]` | 0 bytes | 0 |

这些空数组仅表示各自静态 markup 扫描零命中，不代表浏览器 overlay 零命中或页面审查通过。

## 浏览器证据

运行目标为 `http://127.0.0.1:4174/components/lxtransferpanel.html` 与 `http://127.0.0.1:4174/components/lxvirtualtree.html`。两页各在新的 Edge CDP browser context/page 中运行；TransferPanel context 为 `10ECB3C80545642213EC9C821A224B58`，VirtualTree context 为 `98BF39C712F847B288BE6AB54B63FF2F`。每个页面分别采集 1440×1000 desktop 与 390×844 mobile 的 light 和 HUD dark 状态，共 8 张 full-page PNG。

8/8 状态都通过 DOM 注入 preflight：页面标题可改写并还原，临时 script 节点可追加并执行；8/8 overlay `<script src="http://localhost:8400/detect.js">` 加载成功，等待 2.5 秒后采集截图和控制台。浏览器控制台未记录 `error` 或 `exception`。截图位于 `browser/screenshots/`，每次状态的上下文 ID、preflight、overlay 加载结果、console 消息、注入前后宽度和截图路径位于 `browser/browser-evidence.json`。

| 页面 | 状态 | Overlay 控制台 banner | 规则名（该状态） |
| --- | --- | ---: | --- |
| TransferPanel | desktop / light | 18 | `bounce-easing`, `buried-raster`, `edge-flush-cards`, `layout-transition`, `line-length` |
| TransferPanel | desktop / HUD dark | 251 | `ai-color-palette`, `bounce-easing`, `buried-raster`, `edge-flush-cards`, `layout-transition`, `line-length` |
| TransferPanel | mobile / light | 5 | `bounce-easing`, `buried-raster`, `clipped-overflow-container`, `layout-transition` |
| TransferPanel | mobile / HUD dark | 240 | `ai-color-palette`, `bounce-easing`, `buried-raster`, `clipped-overflow-container`, `layout-transition` |
| VirtualTree | desktop / light | 7 | `buried-raster`, `layout-transition`, `line-length` |
| VirtualTree | desktop / HUD dark | 28 | `ai-color-palette`, `buried-raster`, `layout-transition`, `line-length`, `low-contrast` |
| VirtualTree | mobile / light | 6 | `buried-raster`, `clipped-overflow-container`, `layout-transition` |
| VirtualTree | mobile / HUD dark | 27 | `ai-color-palette`, `buried-raster`, `clipped-overflow-container`, `layout-transition`, `low-contrast` |

banner 数字按 overlay 原文记录，不能当成独立缺陷数、设计分数或跨状态去重后的问题数。尤其 TransferPanel HUD dark 的 251/240 次输出包含大量元素级命中；本次没有逐条人工归类全部命中。完整 console 原文和 selector 留在 JSON 中。

代表性归因仅限可直接核对的 selector：`buried-raster` 命中 VitePress `button.copy`，`layout-transition` / `bounce-easing` 命中 `body`，`line-length` 命中文档 `p` / `li`，`edge-flush-cards` 命中文档 `table`，属于文档外壳或文档内容候选。`clipped-overflow-container` 报告泛化 selector `span.container`；当前 JSON 未记录其完整祖先链，无法仅凭该 selector 判定归属。

HUD dark 下的 `ai-color-palette` 命中实际组件节点，包括 `.lx-transfer-panel__node-meta`、`.lx-transfer-panel__mobile-count`、`.lx-virtual-tree__row.is-checked`、`.lx-virtual-tree__checkbox-control`、`.lx-virtual-tree__label`、`.lx-virtual-tree__toggle-placeholder` 和 `.virtual-tree-demo__selected`。其中组件源码将选中、焦点或计数状态关联到 `var(--lx-color-primary)`；这是 token 来源证据，不是对颜色适用性作出的判断。VirtualTree 的 `low-contrast` 原文报告 `#94a3b8 on #ffffff`、2.6:1，涉及 `legend`、`summary`、`.lx-virtual-tree__selection-scope`、`.lx-virtual-tree__selection-status`、`.virtual-tree-demo__status` 与 `.virtual-tree-demo__note`。这些是 detector 原始结果；本次没有据此作无障碍或设计结论。

## Overlay 宽度边界

Desktop 两页的 document scroll width 注入前后均为 1425 px；`.VPDoc`、`.vp-doc` 和各 demo 的 client/scroll width 均不变。Mobile viewport 为 390 px，注入前 document scroll width 均为 390 px；注入后均为 630 px，增加 240 px。与此同时，两页 `.VPDoc` 仍为 390/390 px，`.vp-doc` 与 demo 仍为 342/342 px。注入后越过 viewport 的元素属于 `div.impeccable-label`，最右边界到 x=630；因此这 240 px 是 overlay 标注层自身扩展页面 scroll width 的测量结果，不是产品内容宽度变化。每个状态的注入前后原始测量值均保留在 JSON。

## Server 与源码完整性

临时 Impeccable server 启动为 PID `20740`、端口 `8400`；`/health` 和 `/detect.js` 分别返回 HTTP 200，overlay 脚本响应 424237 bytes。停止命令 `node "<skill>/scripts/live-server.mjs" stop --keep-inject` 退出码为 0，输出 `Stopped live server on port 8400.`；之后 8400 无监听进程，`/health` 请求超时。VitePress 用户预览 PID `27132` 始终未停止；结束核验时 4174 仍由该 PID 监听，两个目标 URL 均返回 HTTP 200。启动前不存在的 `.impeccable/live/server.json` 在停止后仍不存在。

六个产品目标文件的起始和结束 SHA-256 完全一致，详见 `source-hashes.md`；本次没有修改产品文件。

## 证据边界

本次结果区分静态 markup 扫描与页面中的动态 overlay console。Overlay selector 和 banner 计数保留为原始检测证据；文档壳层命中、通用 `span.container`、主题 token 命中和低对比度数值均未被归并为产品缺陷。截图证明脚本成功注入及当前状态渲染，不替代对全部元素级命中的独立人工复核。

Questions skipped: 由主 Agent 统一综合。
