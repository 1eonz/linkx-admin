# LxIcon 修后 Assessment B 证据复核

**结论：证据有效，不能判为整体通过。** 静态 detector 对目标文件返回 `[]`，但浏览器注入 detector 在四个视图均产生运行时 overlay。已按作用域区分目标组件、文档内容和 VitePress 外壳；报告只覆盖 Assessment B，不含 Assessment A 或合成设计评审。

## 目标与来源

- 目标：`linkx-fe/docs/components/lxicons.md`
- 本次浏览器访问：本机文档站的 LxIcon 页面；4 个新标签、新视图，detector 注入及页面内运行均成功。
- 目标 SHA-256：`BAD5C6AB8FDD2DD90BAE9BAA5697BF161BAF054111B0D1C46270CFBBA255C28A`

## 执行结果

| 检查 | 结果 |
|---|---|
| 静态 detector | `detector.stdout.json` 为 `[]`；stderr 0 字节；退出码 0。该结果只说明本次静态扫描无命中，不代表浏览器检查通过。 |
| 浏览器检查 | 4/4 视图成功注入并执行 detector；退出码 0；stderr 0 字节。视图为 1440px light、1440px dark、375px HUD、320px light。 |
| 服务清理 | detector server 已停止；停止退出码 0、stderr 0 字节。停止后记录的 4174 端口由 PID 6848 监听，不是本次 detector server（PID 6552 / 8400）。 |
| 截图 | 四个视图各有一张 PNG，浏览器截图中可见 detector overlay。 |

## Overlay 归因

| 视图 | Overlay 计数与范围 | 证据判断 |
|---|---|---|
| 桌面 light | 19：docs-content 4、component 14、page-level-banner 1 | 文档段落有 3 个约 86 字符/行的 `line length too long` 命中，代码示例的 `button.copy` 有 1 个 raster/opacity 命中。组件 14 项均指向 `span.icon-tile__name` 或 `span.icon-tile__meaning`，规则为 `text occluded by an overlapping element`。 |
| 桌面 dark | 72：outside-target 49、docs-content 8、component 14、page-level-banner 1 | 49 项是 VitePress 侧栏 `p.text` 的低对比命中，不属于 LxIcon 页面内容；docs-content 另有上述 4 项及 4 个 `dt` 低对比命中（报告值 1.1:1，文字色 `#1d2129` / 背景色 `#1b1b1f`）。组件 14 项与 light 视图相同。 |
| 375px HUD | 20：outside-target 1、docs-content 5、component 13、page-level-banner 1 | 外壳命中是 VitePress 汉堡按钮内 `.container` 的裁切。文档内容有代码复制按钮 raster 命中及 4 个 checklist `dt` 对比度命中；检测报告的 `#e2e8f0` / `#ffffff`（1.2:1）与截图所见深色 HUD 背景不一致，疑似未合成祖先背景的误报。组件项包含空的 `p.icon-copy-feedback.is-empty` 被标成 `ai color palette`，以及 12 个图标卡名称/用途被标为遮挡；需按具体节点复核。 |
| 320px light | 9：outside-target 1、docs-content 1、component 6、page-level-banner 1 | 外壳仍是汉堡按钮子元素裁切；docs-content 只有代码复制按钮 raster 命中。组件 6 项是 4 个名称和 2 个用途文本被标为遮挡。 |

`page-level-banner` 是 detector 的页面注入横幅，不是 LxIcon 组件问题。`button.copy` 位于 VitePress 代码块复制控件；横幅与此控件均不应计为 LxIcon 实现缺陷。移动端 HUD 的空 `role="status"` 节点初始没有可见文本，交互证据显示它会在复制结果出现时更新，因此 `ai color palette` 标签疑似误报。

截图中当前视口可见的 P0 图标卡文字没有明显遮挡；但脚本没有滚动到每个被报出的名称/用途节点逐个截图，故这些 `text occluded` 命中仍是待核实项，不将其直接判为真缺陷或误报。深色侧栏低对比和移动端汉堡裁切属于文档外壳，需在对应站点/主题范围评估。

## 交互与布局证据

- P0 图标组初始展开，包含 13 个图标；搜索状态节点始终连接，使用 `role="status"` 与 `aria-live="polite"`。搜索 `dashboard` 后显示 1 组/1 个图标；无匹配查询更新状态为“无匹配图标”。
- 复制成功显示页内状态“已复制：…”，剪贴板写入了对应代码；模拟复制拒绝时显示页内错误，手动复制文本框已聚焦并选中。两种路径均未产生外部通知节点。
- 四个视图的文档 `scrollWidth` 均未超过 `innerWidth`（桌面 1425/1440，375px 375/375，320px 320/320）；checklist 的 `clientWidth` 与 `scrollWidth` 相等（桌面 688/688，375px 327/327，320px 272/272），未见横向溢出。
- `prefers-reduced-motion: reduce` 下箭头和图标卡过渡均为 `none 1e-05s`，符合减少动效偏好。

## 证据文件

- `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`
- `browser-evidence.json`、`browser-summary.json`、`browser.stdout.json`、`browser.stderr.txt`、`browser.exit-code.txt`
- `desktop-light.png`、`desktop-dark.png`、`mobile-375-hud.png`、`mobile-320-light.png`
- `source-fingerprint.json`、`detector-server-session.json`、`detector-server-stop.exit-code.txt`、`service-status-after-stop.json`

本文件是独立的 Assessment B 证据记录，不是含 Assessment A 的正式合成 Critique 快照，也不构成正式 Critique 审查通过结论。

## 追加复核与归因（2026-10-06）

本节依据 `overlay-dom-recheck.json`、对应截图和静态扫描三件套更新上文中尚待核实的判断。它覆盖上文“组件遮挡命中仍待核实”的状态；整体结论仍不能判为通过，因为深色主题下清单标签存在实际低对比度。

| 视图 | 首轮 overlay | DOM 复扫 overlay | 复扫范围 |
|---|---:|---:|---|
| 桌面 light | 19 | 19 | 文档内容 4、组件 14、注入横幅 1 |
| 桌面 dark | 72 | 23 | 文档内容 8、组件 14、注入横幅 1 |
| 375px HUD | 20 | 20 | 外壳 1、文档内容 5、组件 13、注入横幅 1 |
| 320px light | 9 | 9 | 外壳 1、文档内容 1、组件 6、注入横幅 1 |

桌面 dark 的首轮与复扫相差 49 项。首轮的 49 项是 VitePress 侧栏 `p.text`，不属于目标页面；复扫没有再次产生这些命中。复核时抽样普通侧栏链接约为 6.31:1，当前链接约为 8.95:1，均不支持低对比度缺陷的判断。现有证据没有说明计数差异的成因，因此后续汇总应采用复扫的 23 项，并把 49 项记录为未复现的外壳命中，而不是当前问题。

### 真实问题

- **深色主题清单标签对比不足**：`desktop-dark-checklist.png` 中 `.icon-checklist__row dt` 几乎融入背景，DOM 取色约为前景 `#1d2129`、背景 `#1b1b1f`、对比度约 1.06:1。`mobile-375-hud-checklist.png` 也显示相同标签很淡；该视图使用 `#e2e8f0` 字色落在白色文档背景上，约 1.23:1。两者均低于普通文字 4.5:1 的 WCAG AA 门槛。建议只调整文档样式中的 `.icon-checklist__row dt`，改用随 VitePress 主题变化的 `var(--vp-c-text-1)`，避免复用与文档背景不匹配的 `var(--lx-text-primary)`。

### 已归因的命中

- **46 条图标文字遮挡命中均为关闭的 `details` 误报**：桌面 light/dark 各 14 条、375px HUD 12 条、320px light 6 条。复核脚本逐项展开对应分组，再在命中文字范围内执行 `elementFromPoint` 取样；所有采样点都落在目标文字或其子节点上，且仍在同一图标卡片内。截图 `component-focus-desktop-light.png`、`component-focus-desktop-dark.png`、`component-focus-mobile-375-hud.png`、`component-focus-mobile-320-light.png` 可见展开后的状态，没有实际重叠。
- **HUD 中的 `✦ ai color palette` 命中不是可见配色问题**：命中节点是空的 `.icon-copy-feedback.is-empty`，具 `role="status"`、`aria-live="polite"`，几何尺寸为 1×1px；复制状态会在交互时更新。`mobile-375-hud-empty-status.png` 保存了对应视图。
- **两条移动端 hamburger 裁切命中不是实际裁切**：它们位于 VitePress 外壳的 `span.container`。复核记录其可见面积比例为 1、裁切列表为空，故不计入目标页面问题。
- **代码示例复制按钮的初始透明是预期交互**：VitePress `button.copy` 初始 opacity 为 0，悬停约 0.955，键盘聚焦为 1 且 `:focus-visible` 生效；截图为 `docs-code-copy-hover.png`。这不是组件图标的问题。
- **图标动效符合当前设置及减少动效偏好**：普通 delete 悬停运行语义动画，loading 持续旋转，显式 spin 等价态也保持旋转；`prefers-reduced-motion: reduce` 下动画时长为 0、transform 与 transition 停用。证据截图包括 `motion-hover-delete.png`、`motion-hover-loading.png`、`motion-hover-spin-prop-clone.png`、`motion-reduced-spin-prop-clone.png`。
- **三个“line length too long”段落命中继续保留为可读性信号**：桌面 light/dark 均命中相同三个文档段落。DOM 记录显示它们在 688px 内容区正常换行，页面没有横向溢出；当前证据不能据此认定存在单行溢出或组件缺陷，也不应静默删除这些 detector 命中。

### 最终验证与边界

- `static-component.stdout.json` 与 `static-docs.stdout.json` 均为 `[]`；对应 stderr 文件均为空、退出码均为 0。静态扫描仅表示该次扫描没有静态命中，不会覆盖上述浏览器实测的主题对比问题。
- 四视图 DOM 复核均成功注入并执行 detector，`overlay-dom-recheck.exit-code.txt` 为 0，stderr 为空。复核期间组件和文档 SHA-256 未变化：`LxIcon/index.vue` 为 `27cd3898904b39f3f0ad8d8a08fbaccb5bcb1e0f0e5d16a3b827a495bf41f09f`，文档为 `bad5c6ab8fdd2dd90bae9baa5697bf161baf054111b0d1c46270cfbba255c28a`。
- Impeccable detector 服务已在 8400 端口停止，停止退出码为 0、stderr 为空。最后一次目标页探测时 4174 端口拒绝连接；本报告引用的是此前成功保存的四视图浏览器证据，不表示目标页目前仍可访问。

追加证据：`overlay-dom-recheck.json`、`overlay-dom-recheck.mjs`、`overlay-dom-recheck.stdout.json`、`overlay-dom-recheck.exit-code.txt`、`overlay-dom-recheck.stderr.txt`；`static-component.command.txt`、`static-component.stdout.json`、`static-component.stderr.txt`、`static-component.exit-code.txt`；`static-docs.command.txt`、`static-docs.stdout.json`、`static-docs.stderr.txt`、`static-docs.exit-code.txt`；以及本节引用的复核截图。
