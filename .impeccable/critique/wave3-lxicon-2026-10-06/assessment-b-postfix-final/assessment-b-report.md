# LxIcon 修后 Assessment B 复验

**结论：清单标签对比度问题已修复，移动端提示关联也已在浏览器中确认。** 四个新浏览器 context 均加载目标页并成功注入、运行 detector。静态扫描两项目标均为 `[]`；浏览器 overlay 仍有文档内容、图标目录状态和 VitePress 外壳命中，已逐类归因，不能把静态扫描零命中解读为整页无问题。

## 目标与来源

- 文档：`linkx-fe/docs/components/lxicons.md`，`http://127.0.0.1:4174/components/lxicons.html`
- 组件：`linkx-fe/src/components/LxIcon/index.vue`
- 组件 SHA-256：`27cd3898904b39f3f0ad8d8a08fbaccb5bcb1e0f0e5d16a3b827a495bf41f09f`
- 文档 SHA-256：`96dc323b1de1a4039f817bfe60a399a3052f42cd098a98912f74b4ac05043d54`
- 浏览器复核期间两份源码哈希均未变化；目标页四种视图的 HTTP 状态均为 200。

## 静态扫描

| 目标 | JSON stdout | stderr | 退出码 |
|---|---|---|---:|
| `LxIcon/index.vue` | `[]` | 空，0 字节 | 0 |
| `docs/components/lxicons.md` | `[]` | 空，0 字节 | 0 |

对应命令、stdout、stderr 和退出码分别保存在 `static-component.*` 与 `static-docs.*` 文件中。

## 浏览器复核

| 视图 | viewport | Checklist `dt` 对比度 | Overlay 数量与范围 |
|---|---:|---|---|
| 桌面 light | 1440×900 | 4 行均 10.94:1 | 19：文档 4、组件 14、注入横幅 1 |
| 桌面 dark | 1440×900 | 4 行均 12.81:1 | 21：文档 6、组件 14、注入横幅 1 |
| 移动 HUD | 375×812 | 4 行均 10.94:1 | 16：壳层 1、组件 13、文档 1、注入横幅 1 |
| 移动 light | 320×780 | 4 行均 10.94:1 | 9：壳层 1、组件 6、文档 1、注入横幅 1 |

复核使用 `.icon-checklist__row dt { color: var(--vp-c-text-1) }`。实测深色前景/背景为 `rgb(223, 223, 214)` / `rgb(27, 27, 31)`，浅色与 HUD 文档背景为 `rgb(60, 60, 67)` / `rgb(255, 255, 255)`。所有标签均高于普通文字 4.5:1 的 WCAG AA 门槛，桌面 dark 与 375px HUD 中此前的清单低对比命中没有再出现。

移动视图的 `.icon-alias-table-region` 为可聚焦 `region`，`aria-describedby="icon-alias-table-hint"` 指向“窄屏可在表格区域横向滚动查看完整说明。”提示；在 375px HUD 和 320px light 中提示可见。四种视图均没有文档整体横向溢出；清单 `clientWidth` 与 `scrollWidth` 相等。

## Overlay 归因

- **组件文字遮挡**：桌面 light/dark 各 14 条、375px HUD 12 条、320px light 6 条，目标均是图标卡片中的名称或用途文本。命中项所属 `<details>` 初始关闭；复核逐项展开后执行 3 个 `elementFromPoint` 采样，全部落在文字本身或其子节点内，并位于同一张 `.icon-tile` 中。属于将卡片父按钮误判成覆盖层的 detector 命中，不是实际遮挡。
- **桌面 dark 的 2 条 `ai color palette`**：目标分别是 Vue 代码示例里的 `name` 与 `size` 两个 Shiki 语法高亮 token（`span.line > code > pre.shiki`），不是页面配色控件。属于代码高亮被配色规则泛化命中。
- **375px HUD 的 1 条 `ai color palette`**：目标是空的 `.icon-copy-feedback.is-empty`，`role="status"`、`aria-live="polite"`，盒子为 1×1px；这是供辅助技术使用的空状态节点，不是可见配色内容。
- **两种窄屏各 1 条裁切命中**：目标为 VitePress 导航 hamburger 的 `span.container`，scope 为 `outside-target`，不在 LxIcon 目录或文档内容范围内。本次保留为文档站壳层命中，没有据此要求修改组件。
- **代码示例复制按钮**：各视图均有一条 opacity/raster 命中，目标为 VitePress `button.copy`，scope 为文档内容，不是 LxIcon 组件。此复验未将它归类为组件缺陷。
- **文档段落长度**：桌面 light/dark 各有 3 条 `line length too long`。这些段落在页面内容区自然换行，文档 `scrollWidth` 未超出 viewport；保留为文档可读性启发式提示，不据此认定有横向溢出。
- **顶部注入横幅**：每种视图各 1 条字体/布局命中，目标是 detector 自己添加的横幅，不属于产品页面。

页面 console 仅记录到一次资源 404。单独访问确认是 VitePress 壳层的 `/favicon.ico`（404），目标 HTML 页面仍为 HTTP 200；无 JavaScript `pageerror`。该图标缺失不属于 LxIcon 目标内容，探测结果保存在 `shell-favicon-probe.json`。

## 服务与证据

浏览器通过 Impeccable detector server 的 `/detect.js` 实际注入 overlay；采集时 `/health` 与 `/detect.js` 均为 HTTP 200。server PID `41072`、端口 `8400` 已通过 `live-server.mjs stop --keep-inject` 停止，退出码 0、stderr 为空。用户原有 docs 服务 PID `16592`、端口 `4174` 未停止；停止后目标页仍为 HTTP 200。

证据目录内包含四视图的基础、overlay、清单和展开 details 截图；完整命中 target、scope、命中后 DOM 采样及源码哈希记录见 `browser-evidence.json` 与 `browser-summary.json`。服务启动/停止命令、退出码、stderr、HTTP 状态和端口 PID 分别保存在对应的 `detector-server-*`、`service-and-source-before-stop.json` 与 `service-status-after-stop.json` 文件中。静态检测完整证据为 `static-component.*` 和 `static-docs.*`。

本次只新增本目录的复验脚本、报告和证据，没有修改产品源码。
