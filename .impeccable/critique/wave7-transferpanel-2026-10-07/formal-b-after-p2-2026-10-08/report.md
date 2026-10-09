# Wave 7 修复后 Assessment B

**范围：** 本报告仅记录静态 detector 与浏览器证据，不代表整轮 Impeccable Critique 已完成。

## 结论

六个 markup 目标的静态 detector 均成功退出（exit `0`），stdout 均为可解析的 `[]`、stderr 为空，逐项证据 SHA-256 复核通过。**零命中仅表示这些静态规则没有命中这六个源码目标**，不代表浏览器 overlay 零发现或整体设计通过。汇总见 [detector-index.json](detector-index.json)，每项原始命令、stdout、stderr、退出码和哈希见 [detector](detector/) 子目录。

当前 browser index 记录 10 个独立 Playwright Chromium 场景，10 个均成功；console error、page error、失败请求、HTTP 错误为零，favicon 探测均 HTTP 200。场景、指标、检测归因分别见 [browser-evidence-index.json](browser/browser-evidence-index.json)、[overlay-target-analysis.json](overlay-target-analysis.json)，截图见 [browser/screenshots](browser/screenshots/)。

## Overlay 归因

- **实际组件：** TransferPanel HUD 视图中的 `.lx-transfer-panel__header-actions`、`.lx-virtual-tree__row.is-checked` 子节点命中 `ai-color-palette`（“Cyan neon text on dark background”）。主题 token 将 HUD 主色设为 `#38bdf8`，注释说明是 HUD 语境的 sky/tactical blue；这是实际渲染的主题 token 命中，需按设计意图判断，重复 DOM 命中不是独立缺陷。[主题定义](../../../../linkx-fe/src/tokens/theme-hud.css)
- **演示容器：** VirtualTree HUD 的 `.virtual-tree-demo.lx-theme-hud` 命中 `cramped-padding`，属于演示容器留白观察，不是树组件自身命中。
- **隐藏控件：** TransferPanel `details.transfer-panel-demo__settings` 和 VirtualTree `details.virtual-tree-demo__controls` 内的 `text-occlusion` 目标均标为不可见；对应截图中 `<details>` 收起。此轮不能据此认定用户可见状态有遮挡。
- **文档与未解析项：** `docs-content` 中的长行、代码块复制按钮、API 表格边缘及 `body` 级 motion 规则属于 VitePress 文档内容/外壳，不计为组件缺陷；复制按钮等命中有些位于收起代码块。每个场景另有一个 overlay target 未解析出实际 selector/path；另有 detector row 无法与 overlay DOM 对应。它们只能保留为未归因证据，不能确认为组件问题，也不能据此断言页面缺陷。逐项可见性、规则和未匹配 selector 已留在 overlay 分析文件中。

检测脚本成功注入并运行于隔离 BrowserContext，**无用户可见 overlay**。十个场景的页面基线均无横向溢出；仅两种移动 HUD 场景在注入 overlay 后 document scroll width 从 390 变为 630（注入两个检测节点），记录为检测层副作用，不归于页面基线。

## 哈希与清理

[source-sha256.json](source-sha256.json) 记录六个当前源码哈希。VirtualTree 的两项 Assessment A 冻结哈希由委托方提供，本次复算匹配：

- `LxVirtualTree/index.vue`: `3D6ACC0AA8B61DF4720846588011CCA4DDA8AF7B7F3C0881E6B022F7FD184CDF`
- `LxVirtualTree/demo/basic.vue`: `46C04B6BBC8F1CA5282E962891E9E6B7DBF5DEF33683C60A23F58AF5C9A63F1D`

临时 overlay server（8400）已停止，PID 不存活且 health 不可达；现有 4174 上两条目标路由清理后仍返回 HTTP 200。记录见 [post-cleanup-verification.json](post-cleanup-verification.json)。未读取 Assessment A 报告；开始时 `git status --short` 只列出了旧 critique 路径名，未打开旧目录内容。本次未修改组件源码或文档。
