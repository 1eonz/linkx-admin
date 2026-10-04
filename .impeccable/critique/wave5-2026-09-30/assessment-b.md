Method: Assessment B only (independent detector + browser evidence; Assessment A was not read)

# Wave 5 Impeccable Assessment B

本报告覆盖以下源码目标及对应 VitePress 文档页：

- `linkx-fe/src/components/LxDialog/index.vue` / `linkx-fe/docs/components/lxdialog.md`
- `linkx-fe/src/components/LxDrawer/index.vue` / `linkx-fe/docs/components/lxdrawer.md`
- `linkx-fe/src/components/LxEmpty/index.vue` / `linkx-fe/docs/components/lxempty.md`
- `linkx-fe/src/components/LxPageCard/index.vue` / `linkx-fe/docs/components/lxpagecard.md`
- `linkx-fe/src/components/LxFormErrorBanner/index.vue` / `linkx-fe/docs/components/lxformerrorbanner.md`

未修改源码。所有输出均写入本目录。

## 1. CLI detector

五个源码目标均执行：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>
```

每个目标的 stdout 都是 `[]`，stderr 为空，进程退出码都是 `0`。原始证据如下：

| 目标 | stdout JSON | stderr | 退出码 |
| --- | --- | --- | --- |
| LxDialog | `detector-dialog.stdout.json` | `detector-dialog.stderr.txt` | `detector-dialog.exitcode.txt` |
| LxDrawer | `detector-drawer.stdout.json` | `detector-drawer.stderr.txt` | `detector-drawer.exitcode.txt` |
| LxEmpty | `detector-empty.stdout.json` | `detector-empty.stderr.txt` | `detector-empty.exitcode.txt` |
| LxPageCard | `detector-pagecard.stdout.json` | `detector-pagecard.stderr.txt` | `detector-pagecard.exitcode.txt` |
| LxFormErrorBanner | `detector-formerrorbanner.stdout.json` | `detector-formerrorbanner.stderr.txt` | `detector-formerrorbanner.exitcode.txt` |

这些文件位于：`F:\work\linkx-admin\.impeccable\critique\wave5-2026-09-30\`。

结论：源码静态 detector 本轮未命中规则。浏览器 overlay 另有运行时命中，见第 3 节；两者不能互相替代。

## 2. 浏览器取证与环境

### 2.1 文档服务

尝试以 4185 端口启动独立 VitePress：

```text
pnpm dev -- --host 127.0.0.1 --port 4185
```

该启动尝试记录在：

- `docs-assessment-b-4185.log`
- `docs-assessment-b-4185.err`

服务在编译 `linkx-fe/src/components/LxForm/index.vue:125` 时报告 Vue 编译错误：`Duplicate attribute`，同一 `<ElForm>` 同时存在 `ref="formRef"` 与 `ref="elFormRef"`。同时端口 5173 已占用，VitePress 回退打印了 5174；4185 没有成为可用的稳定取证服务。

因此浏览器取证复用当时可访问的既有 VitePress 服务 `http://localhost:4177`。五个目标页均能打开并完成示例交互；本报告引用的浏览器 URL、截图和控制台日志都来自这个实际可访问的服务。

### 2.2 Overlay 注入

浏览器标签先设置为 `[Human] ...`，再注入：

```text
http://127.0.0.1:8400/detect.js?wave5=20260930...
```

注入成功，控制台出现 `[assessment-b] detect.js loaded ...`，随后出现 `[impeccable] ... anti-patterns found`。每个视图都保存了截图；27 个视图同时保存了同名 `.console.json` 与 `.requests.json`。初始的 `dialog-desktop-hud-overlay.png` 是早期单独保存的重复 HUD 截图，没有单独 sidecar；对应的完整配对证据为 `dialog-desktop-hud-open-overlay.png`、`.console.json` 和 `.requests.json`。

Drawer 移动端打开后等待约 1600ms，再读取 overlay 尺寸并截图，确保过渡动画稳定。CDP 移动仿真暴露出 `cssLayoutViewport` 为 615px、`cssVisualViewport` 为 375px 的差异；这属于浏览器仿真限制，相关截图仍按请求的 375px 可视视口保存，报告中保留该限制。

### 2.3 截图清单

截图位于 `F:\work\linkx-admin\.impeccable\critique\wave5-2026-09-30\screenshots\`。除上面说明的早期重复 HUD 截图外，每个 PNG 有同名 console/request sidecar。

**LxDialog**

- `dialog-desktop-bright-overlay.png`
- `dialog-desktop-bright-open-overlay.png`
- `dialog-desktop-hud-open-overlay.png`
- `dialog-mobile-bright-open-overlay.png`
- `dialog-mobile-hud-open-overlay.png`

**LxDrawer**

- `drawer-desktop-bright-overlay.png`
- `drawer-desktop-open-overlay.png`
- `drawer-desktop-hud-open-overlay.png`
- `drawer-mobile-bright-overlay.png`
- `drawer-mobile-bright-open-overlay.png`
- `drawer-mobile-hud-open-overlay.png`

**LxEmpty**

- `empty-desktop-bright-overlay.png`
- `empty-desktop-created-overlay.png`
- `empty-desktop-filter-cleared-overlay.png`
- `empty-desktop-hud-overlay.png`
- `empty-mobile-bright-overlay.png`
- `empty-mobile-hud-overlay.png`

**LxPageCard**

- `pagecard-desktop-bright-overlay.png`
- `pagecard-desktop-loading-overlay.png`
- `pagecard-desktop-error-overlay.png`
- `pagecard-desktop-hud-overlay.png`
- `pagecard-mobile-bright-overlay.png`
- `pagecard-mobile-hud-overlay.png`

**LxFormErrorBanner**

- `formerrorbanner-desktop-bright-overlay.png`
- `formerrorbanner-desktop-hud-overlay.png`
- `formerrorbanner-mobile-bright-overlay.png`
- `formerrorbanner-mobile-hud-overlay.png`

覆盖了亮色、HUD、桌面和 375px 移动视口；同时覆盖 Dialog 打开态、Drawer 打开态、Empty 创建/筛选恢复态、PageCard 加载/错误态和 FormErrorBanner 告警态。

## 3. 浏览器 overlay / console 结果

完整原始日志位于各截图同名的 `.console.json`。本轮浏览器中看到的规则包括：

### 3.1 文档外壳或 detector 误报倾向

- `buried-raster`：命中 VitePress 的 `button.copy` 隐藏 raster 背景。
- `first-viewport-column-overflow`：命中 VitePress `div.container` 的文档列高比例差异。
- `layout-transition`：命中 `body` 的高度/内边距过渡。
- `line-length`：命中文档段落约 86 字符行宽。
- `clipped-overflow-container`、`edge-flush-cards`：多次命中文档导航/API 表格结构。

这些命中在五个文档页之间重复出现，截图中的黄色标记也落在文档外壳、复制代码按钮或 API 表格附近，不能直接归因到五个组件源码。

### 3.2 需要记录的组件或 Demo 相关命中

- **LxDialog 移动态**：375px 截图中可见弹窗右侧内容被视口裁切；overlay 同时报告 `clipped-overflow-container`。这是运行时组件边界风险，应复查窄屏弹窗宽度和滚动容器。
- **LxDrawer 内容区**：桌面和移动打开态均报告 `cramped-padding`，定位到 `content-body`；截图中详情行贴近抽屉内容背景边缘。需要确认这是设计令牌的有意密度还是实际内边距不足。
- **LxPageCard**：亮色、加载、错误和 HUD 视图均报告 `low-contrast`；截图中“最近一次状态采集”和“数据来源”等辅助文字较弱。该命中与页面卡片示例内容相关，不能仅按 VitePress 外壳误报处理。
- **LxFormErrorBanner**：桌面和移动亮色/HUD 视图报告 `low-contrast` 与 `tiny-text`；移动截图中错误横幅文字密度高，辅助说明和操作区域需要复核可读性。
- **LxEmpty**：浏览器额外命中主要集中在文档外壳、API 表格和过渡规则，未见可单独确认的 Empty 组件源码规则命中；仍保留所有原始 console 与截图供后续人工核对。

不要把上述运行时命中数量当作缺陷数量：同一规则会在同一文档页的多个节点及多个状态重复触发。

## 4. 外部请求清单

汇总文件：`external-requests-summary.json`。

- 统计范围：所有配对截图的 `*.requests.json`。
- 资源条目总数：6750。
- 主机分布：`localhost` 6750。
- 外部请求数：0。
- 127.0.0.1 仅用于本地 detector overlay 和截图收集服务，不是外部网络请求。

每个视图的完整资源清单保存在同名 `.requests.json` 中，例如 `dialog-desktop-bright-open-overlay.requests.json`、`drawer-mobile-bright-open-overlay.requests.json`、`pagecard-desktop-error-overlay.requests.json` 和 `formerrorbanner-mobile-hud-overlay.requests.json`。

## 5. 失败与限制记录

- 4185 独立启动受 `LxForm/index.vue:125` duplicate `ref` 编译错误影响；没有修改或绕过该源码错误。
- 因此使用既有可访问的 4177 VitePress 服务完成浏览器证据；没有把 4185 的错误页当作组件视觉结果。
- 移动 CDP 仿真存在 615px layout viewport 与 375px visual viewport 的差异；Drawer 移动动画已等待稳定后取证，截图和原始尺寸数据均保留。
- Impeccable live server 8400 在取证完成后已停止。
- 本 Assessment B 未修改任何源码、文档源码或构建产物。

## 6. Assessment B 结论

静态 detector 对五个源码目标均为 clean（五组 `[]`、空 stderr、退出码 0）。独立浏览器证据已覆盖五个文档页、亮色/HUD、桌面/375px 以及主要交互状态。运行时 overlay 发现的组件相关信号集中在：Dialog 移动窄屏裁切、Drawer 内容区内边距、PageCard 辅助文字对比度、FormErrorBanner 小字号/对比度；其余重复命中主要属于 VitePress 文档外壳或 detector 对文档结构的启发式判断。所有命中已记录，未在本阶段修复。
