# Wave 7 LxTransferPanel 独立 Assessment A 证据索引

本目录仅包含独立 Assessment A 的报告和本次生成的浏览器/哈希证据。评审开始前没有读取旧 Assessment A、综合报告、Assessment B 或 detector 产物；未运行 detector。文档服务恢复后，使用独立 Chrome 154 进程、临时用户目录、CDP 新建 browser context 与页面。临时浏览器目录已在采集后移除。

## 核心文件

- [assessment-a-report.md](assessment-a-report.md)：独立中文评审报告。
- [source-sha256.json](source-sha256.json)：组件、类型、Demo、中文文档和设计稿开始/结束指纹；六个文件均未变化。
- [browser-evidence.json](browser-evidence.json)：21 组页面截图与 DOM 状态路径、20 次交互及浏览器错误记录。
- [capture-browser-evidence.mjs](capture-browser-evidence.mjs)：本次 CDP 采集脚本。

## 关键视口截图

| 视口/主题 | 页面截图 | Demo 局部截图 | DOM 状态 |
|---|---|---|---|
| 桌面 1440×1000，浅色，初始 | [desktop-light-initial.png](desktop-light-initial.png) | [desktop-light-initial.demo.png](desktop-light-initial.demo.png) | [desktop-light-initial.dom.json](desktop-light-initial.dom.json) |
| 桌面 1440×1000，HUD 深色 | [desktop-hud-dark.png](desktop-hud-dark.png) | [desktop-hud-dark.demo.png](desktop-hud-dark.demo.png) | [desktop-hud-dark.dom.json](desktop-hud-dark.dom.json) |
| 移动 375×844，浅色，初始 | [mobile-375-light-initial.png](mobile-375-light-initial.png) | [mobile-375-light-initial.demo.png](mobile-375-light-initial.demo.png) | [mobile-375-light-initial.dom.json](mobile-375-light-initial.dom.json) |
| 移动 375×844，HUD 深色 | [mobile-375-hud-dark.png](mobile-375-hud-dark.png) | [mobile-375-hud-dark.demo.png](mobile-375-hud-dark.demo.png) | [mobile-375-hud-dark.dom.json](mobile-375-hud-dark.dom.json) |

## 主要交互与状态

以下每个名称都有同名 `.png` 全页截图、`.dom.json` 结构化 DOM 状态和 `.demo.html` Demo DOM 快照。完整映射见 [browser-evidence.json](browser-evidence.json)。

- `desktop-light-source-filter`、`desktop-light-filtered-selection`、`desktop-light-max-count`：搜索、筛选批量加入与达到上限后的状态。
- `desktop-light-selected-filter-unloaded`、`desktop-light-selected-filter-cleared`：用未加载项编码过滤及清除筛选。
- `desktop-light-remove-unloaded-confirm`、`desktop-light-remove-unloaded-cancelled`：移除未加载项的确认和取消。
- `desktop-light-clear-all-confirm`、`desktop-light-cleared`、`desktop-light-clear-undone`：全量清空确认、空列表与撤销恢复。
- `desktop-light-empty-host-state`、`desktop-light-loading-host-state`、`desktop-light-error-host-state`、`desktop-light-retry-recovered`：宿主空、加载、失败和重试恢复。
- `mobile-375-light-controls-open`、`mobile-375-hud-empty-state`：移动端状态设置及 HUD 深色下的空树状态。

## 源文件范围

| 范围 | 路径 |
|---|---|
| 组件 | `linkx-fe/src/components/LxTransferPanel/index.vue` |
| 类型 | `linkx-fe/src/components/LxTransferPanel/types.ts` |
| Demo | `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` |
| 中文文档 | `linkx-fe/docs/components/lxtransferpanel.md` |
| 设计稿代码 | `design/虚拟滚动树 + 双栏穿梭/code.html` |
| 设计稿截图 | `design/虚拟滚动树 + 双栏穿梭/screen.png` |

