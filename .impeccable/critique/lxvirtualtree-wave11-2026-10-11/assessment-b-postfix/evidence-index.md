# Assessment B 证据索引

根目录：`F:/work/linkx-admin/.impeccable/critique/lxvirtualtree-wave11-2026-10-11/assessment-b-postfix/`

## 静态 detector

| 目标 | stdout | stderr | exit |
|---|---|---|---|
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `virtualtree-index.stdout.json` (`[]`) | `virtualtree-index.stderr.log`（空） | `virtualtree-index.exit-code.txt`（`0`） |
| `linkx-fe/src/components/LxVirtualTree/types.ts` | `virtualtree-types.stdout.json` (`[]`) | `virtualtree-types.stderr.log`（空） | `virtualtree-types.exit-code.txt`（`0`） |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | `virtualtree-demo-basic.stdout.json` (`[]`) | `virtualtree-demo-basic.stderr.log`（空） | `virtualtree-demo-basic.exit-code.txt`（`0`） |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `transferpanel-index.stdout.json` (`[]`) | `transferpanel-index.stderr.log`（空） | `transferpanel-index.exit-code.txt`（`0`） |

`[]` 是静态零命中证据，不是对浏览器页面的整体通过结论。

## 浏览器证据包

每个目录都包含同一组文件：`screenshot.png`、`dom.html`、`dom-measure.json`、`script-injection.json`、`console.json`、`page-errors.json`、`request-failures.json`、`summary.json`。

| 目录 | 页面与状态 | 视口 | overlay | 关键结果 |
|---|---|---:|---:|---|
| `virtualtree-desktop-light/` | VirtualTree 桌面浅色 | 1440×900 | 9 | 21 个树项，无 page error/request failure |
| `virtualtree-hud-375/` | VirtualTree HUD | 375×812 | 20 | HUD 生效；`documentScrollWidth=615`、`bodyScrollWidth=375` |
| `virtualtree-slot-desktop/` | VirtualTree 多行 slot | 1280×900 | 7 | slot 文案未撑高相邻树行 |
| `virtualtree-narrow-390-keyboard/` | VirtualTree 键盘窄屏 | 390×844 | 7 | 键盘选择后 `role=treeitem.is-checked` 获焦 |
| `transferpanel-desktop-source-selected/` | TransferPanel 桌面待选/已选、长名称 | 1440×900 | 25 | Space 后已选 4→5；长名称展开；已选列表滚动 217 |
| `transferpanel-narrow-390-reduced-motion/` | TransferPanel HUD + 减少动效 | 390×844 | 49 | 减少动效匹配；已选面板与长名称可操作 |

## Overlay 规则速查

| 规则 | 视图 | 主要 selector / 归因 |
|---|---|---|
| `line-length` | VirtualTree/TransferPanel 桌面 | VitePress 文档段落，文档外壳 |
| `buried-raster` | 全部 VirtualTree、TransferPanel 桌面/移动 | VitePress 代码块 copy 按钮，文档外壳 |
| `edge-flush-cards` | VirtualTree 桌面 | 文档 API 表格 |
| `first-viewport-column-overflow` | VirtualTree slot 桌面 | VitePress `.VPDoc` 页面容器 |
| `clipped-overflow-container` | VirtualTree 窄屏/HUD、TransferPanel 移动 | VitePress 汉堡按钮 `span.container` |
| `layout-transition` | 全部视图 | `body` 全局样式，当前不能归因到组件源码 |
| `bounce-easing` | TransferPanel 桌面/移动 | `body` 全局样式，当前不能归因到组件源码 |
| `cramped-padding` | VirtualTree HUD、TransferPanel 移动 | 示例预览与已选条目内容区，组件/示例实现 |
| `gpt-thin-border-wide-shadow` | TransferPanel 桌面 | `.lx-transfer-panel__scope-action-content`，组件实现 |
| `ai-color-palette` | VirtualTree HUD、TransferPanel 移动 | HUD 主题的青色深色配色，意图提示而非自动缺陷 |

## 运行与清理

- `browser-evidence.mjs`：启动 VitePress、启动 overlay、执行六视图注入与交互、写出上述证据。
- `vitepress.stdout.log` / `vitepress.stderr.log`：服务日志。
- `overlay-server.stdout.log` / `overlay-server.stderr.log`：overlay 服务日志。
- `service-stop.txt`：停止命令记录。
- 复核结果：端口 `5194`、`8427` 均无监听进程。
