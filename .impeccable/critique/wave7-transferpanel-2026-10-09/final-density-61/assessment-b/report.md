# Assessment B：LxTransferPanel 最终密度证据

## 范围与方法

本评估独立执行静态 detector 与浏览器 overlay，未读取 Assessment A 或其它评估报告。目标页为 `http://127.0.0.1:4174/components/lxtransferpanel`；浏览器使用 `other-admin/admin-vue3/node_modules/@playwright/test` 驱动系统 Chrome。评估生成六组视图：浅色/HUD 深色 × 1440、390、320px。每组采集折叠态列表底部、展开态顶部、展开态列表底部三种状态的无 overlay 基线、截图、实时 overlay、控制台日志。

## 静态 detector

三个目标均完成扫描，退出码均为 0，JSON 均为 `[]`，stderr 为空：

| 目标 | JSON | stderr | 退出码 |
|---|---|---|---|
| `src/components/LxTransferPanel/index.vue` | [index.json](index.json) | [index.stderr](index.stderr) | [index.exitCode](index.exitCode) |
| `src/components/LxTransferPanel/demo/basic.vue` | [demo.json](demo.json) | [demo.stderr](demo.stderr) | [demo.exitCode](demo.exitCode) |
| `docs/components/lxtransferpanel.md` | [doc.json](doc.json) | [doc.stderr](doc.stderr) | [doc.exitCode](doc.exitCode) |

`[]` 仅表示静态规则零命中，不代表浏览器页面无问题。

## 浏览器注入与服务

注入预检成功：页面标题修改为 `[Human] ... Assessment B`，动态脚本标签执行成功；六组视图均确认 `/detect.js` 脚本存在，`window.impeccableScan` 与 `window.impeccableDetect` 可调用。独立 overlay 服务使用 8461 端口启动，采集后已停止；4174 服务未停止。启动/停止证据见 [overlay-server-start.json](overlay-server-start.json) 与 [overlay-server-stop.json](overlay-server-stop.json)。

## 可观察行为证据

- 页面 `document.documentElement.scrollWidth === clientWidth`，六组视图均 `overflow=false`，没有页面级横向溢出。
- 1440px 下移除按钮为 24×24px；390/320px 下为 44×44px。每个视图的五点命中测试均命中 `button` 或其 SVG `path`，且按钮在列表与 viewport 内。
- 历史长名称全文在 1440px 为 4 行；390px 折叠为 2 行、展开为 4 行；320px 折叠为 2 行、展开为 5 行。展开顶部与底部状态的全文均在 viewport 内可见，列表滚动位置分别到达记录的 `maxScroll`（证据见 [measurement-summary.txt](measurement-summary.txt) 与各 `*-baseline.json`）。
- HUD 与浅色主题的上述尺寸、滚动和命中结果一致；主题差异只影响颜色 detector 命中。

## Overlay 命中与归因

六组视图都产生真实 overlay 与 console 命中，汇总见 [overlay-summary.json](overlay-summary.json)、[evidence-summary.csv](evidence-summary.csv) 和 [browser-evidence.json](browser-evidence.json)。每组有三张 baseline 与三张 overlay 截图，位于 [screenshots/](screenshots/)。

- `line-length`、`edge-flush-cards`、`text-occlusion` 的部分命中落在 VitePress 文档外壳、示例设置控件或 details 内全文节点；静态 detector 对三个源码目标均为零命中，因此这些是浏览器运行时上下文命中，不能直接归为组件缺陷。
- HUD 的 `ai-color-palette` 大量命中包含隐藏树节点、图标和移动端隐藏面板。390/320px 中分别有 102 个隐藏组；可见命中主要为移动计数及少量 HUD 文本令牌，属于主题令牌扫描结果，不等于颜色可访问性失败。
- 移动视图可见的 `clipped-overflow-container` 命中来自文档外壳的 `span.container`（位于视口外，`y=-578`），不是 LxTransferPanel。
- LxTransferPanel 可见命中集中在移动 `.lx-transfer-panel__selected-item` 的 `cramped-padding`（390px 10 次、320px 10–13 次）；这是 P2 级视觉密度建议，列表仍可滚动、内容和 44px 操作按钮均可用。
- `.lx-transfer-panel__selected-name-full` 的 `text-occlusion` 是全文节点与节点编码层的检测重叠，展开态全文仍在 viewport 内按行可见；归类为 detector 结构误报/低风险观察，不升级为 P1。

## 优先级结论

- P0：无。
- P1：无。没有页面溢出、关键操作不可命中或长名称无法展开/阅读的证据。
- P2：移动 390/320px 选中项被 detector 报告 `cramped-padding`；建议后续在不牺牲 44px 移除按钮的前提下复核条目内边距和元信息密度。

## 源文件完整性

采集前后 SHA256 完全一致，详见 [source-before.json](source-before.json) 与 [source-after.json](source-after.json)，`sourceUnchanged=true`。本次未修改冻结源码、计划文件或 4174 服务。
