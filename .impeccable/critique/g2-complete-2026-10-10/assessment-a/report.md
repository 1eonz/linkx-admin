Method: Assessment A（设计评审，独立于 Assessment B；浏览器证据降级）

⚠️ 浏览器限制：已对 `http://127.0.0.1:4174/components/lxsearchbar` 与 `http://127.0.0.1:4174/components/lxstatusswitch` 各创建独立 Playwright context/page 并尝试 `networkidle` 导航；本机 Playwright Chromium `chromium-1208` 缺失，改用已安装 `chromium-1243` 与系统 Chrome/Edge 均因 Windows 并行配置缺失无法启动（Playwright `spawn UNKNOWN`，直接执行返回“应用程序的并行配置不正确”）。因此没有把源码推断写成 live browser 通过，也未读取任何 Assessment B 输出。HTTP 预检仅确认两个地址返回 200、HTML 长度 530。

# 范围与证据

目标为 `linkx-fe/src/components/LxSearchBar` 和 `linkx-fe/src/components/LxStatusSwitch`，同时阅读各自 `index.vue`、`types.ts`、`demo/basic.vue`、中文文档，以及 `design/检索面板 SearchBar/code.html`、`design/状态开关 StatusSwitch/code.html` 和对应规范截图。静态来源使用当前工作区版本；没有修改组件、Demo、文档或设计文件。

已实际通过 `view_image` 检查并复制为快照的规范视觉证据：

- [SearchBar 设计标本](/F:/work/linkx-admin/.impeccable/critique/g2-complete-2026-10-10/browser/design-searchbar.png)：浅色公安调度场景，4 字段单行、16px 内距、32px 控件、4px 圆角、查询/重置同一操作行、meta 状态带。
- [StatusSwitch 设计标本](/F:/work/linkx-admin/.impeccable/critique/g2-complete-2026-10-10/browser/design-statusswitch.png)：42×20 胶囊、开绿关灰、加载 Spinner、无权限降级 Tag、高风险确认层和表格行内密度。

设计稿截图是已渲染的静态视觉参考；当前版本 Demo 的浅色/HUD、375px、loading/failure/confirmation/read-only live 状态因浏览器不可启动未能逐状态截图。以下结论以静态实图、源码契约及中文文档交叉评审，属于降级 Assessment A。

# Design Health Score（Nielsen 0–4）

两组件均为 Operate 型控件，10 项均适用；总分 **31/40（77.5%，Good）**。分数反映可维护的业务契约与可访问性基础已经形成，但密度一致性、门户主题和状态反馈仍有落差。

| # | 启发式 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | SearchBar 有 `aria-busy`、loading 按钮、meta 插槽；StatusSwitch 有 loading Spinner、`aria-busy` 与失败 alert。通用组件不自带结果/失败区域，依赖宿主提供。 |
| 2 | 系统与现实匹配 | 4 | 中文“查询/重置/开启/关闭/无权限”与公安调度业务语义一致；StatusSwitch 保留 0=开启、1=关闭旧值映射。 |
| 3 | 用户控制与自由 | 3 | SearchBar 支持重置、收起/展开、Esc；StatusSwitch 支持取消确认、只读降级。确认框等待期间只能取消，缺少显式“正在保存”撤销路径是业务约束。 |
| 4 | 一致性与标准 | 4 | 统一 lx-ui 令牌、LxInput/LxSelect/LxSwitch/LxTag，中文 API 与设计稿术语稳定；按钮和标签遵循 Element Plus 桥接层。 |
| 5 | 错误预防 | 3 | loading 阻止重复提交；关闭操作可确认；字段 schema 默认值用于重置。SearchBar 的 Esc 全局重置可能误触，StatusSwitch 的确认层主题传递仍不完整。 |
| 6 | 识别而非回忆 | 3 | 字段标签、隐藏数量播报、状态文案和权限降级标签清楚；SearchBar 快捷键/结果数依赖 `meta` 插槽，空插槽时缺少即时回显。 |
| 7 | 灵活高效 | 3 | 配置驱动字段、插槽与自定义 controls 支持复杂列表；StatusSwitch 支持布尔/数字模式。未提供批量开关或快捷键聚焦策略，属于宿主层能力。 |
| 8 | 极简审美 | 3 | 令牌、32px 紧凑密度和卡片边界清晰。SearchBar 当前操作栏固定另起 footer，和设计标本的单行布局相比多一层纵向占用；StatusSwitch 行内 Tag/文字在窄屏可能显拥挤。 |
| 9 | 错误识别、诊断与恢复 | 3 | Demo 对 SearchBar 空结果/失败/恢复、StatusSwitch 失败保留旧值均有中文反馈；组件仍把请求失败文案、重试动作交给宿主，确认弹层异常也只返回 false。 |
| 10 | 帮助与文档 | 2 | 中文文档较完整，包含 Props、Events、边界和 Mock 说明；运行时缺少字段级错误/快捷键帮助，`meta`/权限源等关键前置知识仍需读文档。 |
| **总计** |  | **31/40** | **Good（77.5%）**；修复 3 个 P1/P2 后可接近 Excellent。 |

# Design Specificity Verdict

**明确属于 LinkX 公安智慧勤务调度设计体系，但 SearchBar 的当前落地有一处显著结构漂移。** 设计稿以 16px 间距、32px 控件、4px 圆角、蓝色主操作与紧凑信息条建立了可识别的 LinkX 视觉语言；StatusSwitch 的开绿/关灰和高风险确认也保持了业务语义。当前实现通过 lx-ui 令牌延续这些特征，整体不会像通用后台模板。

SearchBar 设计标本的“四字段单行”把查询/重置放在最后一列并与输入控件底对齐，而实现总是把 actions 放到 grid 之后的 footer（`index.vue:330-378`）。在 4 字段列表上，这会把高频操作推到第二行，破坏标本的高密度扫描路径。该问题属于设计契约与布局策略冲突，应优先处理。

# Overall Impression

两组件已经从“仅封装 Element Plus”进入可供业务迁移的契约阶段：SearchBar 具备受控值、字段类型、默认值重置、折叠、插槽和 loading 锁；StatusSwitch 具备旧值映射、权限降级、关闭确认、竞态丢弃和失败恢复。中文 Demo 与文档对使用边界说得清楚，且没有把 Mock 描述成真实后端联调。

静态实图显示设计基准强调“第一屏可扫描”：单行检索、高危操作的明确后果、表格行内 42×20 开关。实现层的主要风险集中在状态落点和壳层主题：SearchBar 的状态/快捷键是可选插槽，StatusSwitch 的确认框通过 `ElMessageBox` 传送到 body，而 Demo 的 HUD 类只挂在内层容器，可能造成 HUD 触发后弹层仍为浅色。浏览器无法启动，故此项标记为源码风险，不能宣称已在页面中复现。

# What's Working

1. **业务语义清楚。** SearchBar 的 `role="search"`、字段标签与 `Enter/Esc` 操作形成可预测的检索面板；StatusSwitch 将数字旧值兼容、关闭确认和无权限 Tag 组合到一个小组件中。
2. **状态边界考虑到位。** SearchBar 在 loading 时停止 search/reset，StatusSwitch 记录确认请求版本并在宿主切换值、loading、权限失效时丢弃旧确认结果；这比只改变颜色的状态控件更可靠。
3. **设计令牌和中文交付完整。** `--lx-control-height:32px`、`--lx-radius-md:4px`、间距令牌与 LxSwitch 开绿/关灰样式共同保持视觉一致；文档明确说明 Mock、宿主请求职责和 375px 触控目标。

# Priority Issues

## P1 — SearchBar 四字段操作行与设计标本不一致

**证据：** 设计截图中 STATE 01 的查询/重置与第四字段同一行；实现在 `linkx-fe/src/components/LxSearchBar/index.vue:330-378` 把 collapse 和 actions 放到 grid 后 footer。默认四字段时，用户需要向下扫一整行才看到主操作，降低列表页节奏并增加首屏高度。

**建议：** 在保持 `controls/actions` 插槽契约的前提下，为 `fields.length <= 4` 提供可选 inline-actions 布局（或让宿主显式选择），让最后一个字段与按钮共享同一栅格行；移动端仍在 767px 断点回落为 footer/全宽触控。补 1280px、375px 和 loading 三态视觉复验。

## P1 — StatusSwitch HUD 与传送确认层可能脱节

**证据：** `LxStatusSwitch` 调用 `lxConfirm`（`index.vue:66-96`）；`lxConfirm` 使用 Element Plus `ElMessageBox.confirm`，弹层传送到 body。`status-switch-demo` 只在内部 `<div>` 加 `lx-theme-hud`（`demo/basic.vue:39-46`），而 HUD 令牌主要由 `.lx-theme-hud` 祖先覆盖；`confirm` options 未注入 `customClass: 'lx-theme-hud'`。在 HUD Demo 中，开关所在面板可变暗而确认弹层可能仍为浅色，造成高风险操作上下文断裂。

**建议：** 由宿主在根 `html` 统一切换 HUD，或让确认选项明确接收/传递主题 class；为 portal 弹层单独覆盖 `lx-confirm.lx-theme-hud`。用新浏览器上下文实测浅色/HUD 的关闭确认、Escape 与取消后状态不变。

## P2 — SearchBar 空状态/错误反馈默认不可见

**证据：** 组件只发 `search/reset`，结果与失败由宿主通过 `meta` 插槽提供（`index.vue:326-328`）；当调用者未提供 `meta` 时，组件在 loading 完成后没有内置成功、空结果或错误区域。文档虽说明职责边界，但一个裸用法的可观察状态可能只停留在按钮。

**建议：** 保持 API 解耦，增加可选的状态占位契约（如 `meta` 默认提示或 `status`/`statusLabel` 插槽），并在中文文档说明“无 meta 时无结果区域”的意图；至少在 Demo 入口保持错误后可重试且不丢查询值。

## P2 — StatusSwitch 当前状态的可访问名称偏泛

**证据：** 开关传入 `aria-label="开启 / 关闭"`（`index.vue:123-128`），当前值依赖底层 `role=switch` 的 checked 状态而非 label 文案；表格行中多条开关共享相同 label，读屏用户只能从相邻文本推断节点。

**建议：** 暴露 `aria-label`/`aria-labelledby` passthrough，Demo 与文档示范把行名 ID 关联到开关（例如“布控服务，当前开启”），并保持只读 Tag 继续播报具体状态。不要用颜色单独表达开关当前值。

## P2 — 375px 复杂状态尚缺实图证据

**证据：** 源码有 `max-width:767px`/`480px` 和 44px 控件规则；设计稿只提供桌面规范图，本轮浏览器无法启动，未能确认 375px 长字段、失败提示、确认层和 portal 是否横向溢出。

**建议：** 下次浏览器可用时为两个独立新 page 采集 375×812 浅色/HUD、loading/failure/confirmation/read-only，并记录 `scrollWidth <= clientWidth`、焦点环和 44px 命中区；截图进入正式快照后再将该风险关闭。

# Persona Red Flags

### Alex（不耐烦的高级用户）

- SearchBar 的主操作若因 P1 另起 footer，需要额外一次视觉跳转；高频列表筛选时会感到密度下降。
- 已有 Enter/Esc 与 controls 插槽，适合键盘与批量宿主；但没有组件级字段快捷跳转或批量切换路径。

### Sam（依赖无障碍的用户）

- SearchBar 标签和 `role=search` 基础较好，折叠按钮会播报隐藏项数量；但 meta 是可选的，缺失时结果状态不一定被读屏宣布。
- StatusSwitch 的 `aria-label="开启 / 关闭"` 没有业务行名；多个表格行会出现同名控件，需要宿主提供 `aria-labelledby`。
- 只读/无权限 Tag 文字区分“当前状态”和“无权限”，没有只靠颜色表达，方向正确。

### Casey（分心的移动用户）

- SearchBar 375px 会单列字段并把按钮提高到 44px，基本符合拇指区；但复杂字段和 meta 纵向增长，必须确认滚动后主操作仍易找到。
- StatusSwitch 的 44px 命中区来自基础 LxSwitch，但 52px 行内文本、右侧控件和长中文标签需要实际截图确认是否拥挤。

### Riley（压力测试者）

- StatusSwitch 已处理确认期间模型变更和失败回滚；SearchBar 的外部请求取消、旧请求覆盖和结果状态仍由宿主负责，宿主若未实现会留下陈旧结果。
- 需要验证字段 key 含特殊字符、级联对象值、超长标签与 375px 组合；源码已有 `fieldId` 清洗和对象值守卫，但未能浏览器实测。

# Cognitive Load Assessment

## Checklist 结果

- **任务目标清晰：通过。** “查询/重置”“开启/关闭”主动作与中文标签直接对应。
- **可见选项控制：SearchBar 条件数超过 4 时通过折叠缓解；StatusSwitch 每行只有一个二态动作。** 折叠前的 4 个字段仍可能各含下拉、树和级联多个选项，需保持默认高频优先。
- **状态反馈：部分通过。** loading、失败、空结果在 Demo 有显式文案；通用 SearchBar 没有 meta 时反馈为空，形成额外记忆负担。
- **视觉噪声：通过。** 令牌和 32px 密度统一；设计稿的大段 API/场景文档属于 Read 壳层，不应与业务面板混用。
- **记忆桥与术语：部分通过。** `controls`/`meta`/`fallbackTag` 是开发契约，不是终端文案；文档已解释，但首次使用仍需阅读。
- **中断恢复：通过。** 失败后保留查询/旧状态并可重试；确认取消不改变状态。

## 需要特别检查的 >4 选项决策点

- SearchBar 首屏可能同时显示 4 个字段，每个下拉/树/日期控件又有多项选择；优先让字段标签、默认值和重置保持稳定，避免再叠加常驻快捷操作。
- StatusSwitch 确认层同时提供标题、影响说明、取消和危险确认；设计稿信息量较大，真实 375px 需检查是否超过一屏、是否仍能先读到后果再做决定。

# Emotional Journey

- **进入：** 设计稿浅色卡片、蓝色主操作和紧凑标签传达“可控、专业”，StatusSwitch 的绿/灰不把正常关闭误染成错误。
- **执行：** SearchBar 查询时按钮 Spinner、StatusSwitch 保存时锁定开关，降低重复操作焦虑。
- **失败：** Demo 明确“保存失败，状态未修改；可以重新切换重试”，属于好的恢复语气；SearchBar 失败信息由宿主注入，需避免只显示技术异常。
- **高风险：** StatusSwitch 关闭确认强调后果，保留取消路径；但 HUD portal 脱节会在最关键时刻破坏沉浸与信任，是 P1。
- **结束：** 成功/空结果的 meta 状态能够形成闭环；裸用 SearchBar 没有 meta 时结尾不确定，是 P2。

# Minor Observations

1. SearchBar 的 `@keyup.esc="reset"` 是明确的产品约定，但当日期/选择弹层先消费 Escape 时应在浏览器确认不会意外清空整组条件。
2. `LxStatusSwitch` 视觉轨道由 LxSwitch 固定为无文字 40×20、有文字 42×20；设计文档写 42×20，契约本身应在 API 说明中注明“含 inlinePrompt 文案时为 42px”。
3. `LxSearchBar` 通过 `fieldId` 清洗 key，级联对象值守卫较谨慎；长中文标签、RTL 和超长选项仍需后续实图。
4. Demo toolbar 的两个 checkbox 属于演示控制，不应被误当作生产组件的主题/失败 API；文档已有 Mock 说明，建议在页内继续保持明显的“模拟”标识。
5. 设计稿以 4px 圆角和 16px padding 为核心，当前令牌已对齐；后续不要在页面层覆盖第二套颜色/间距。

# Provocative Questions

1. SearchBar 的“查询”是否应该与最后一个筛选字段共用一行作为默认密度，还是允许所有宿主统一采用独立 footer？建议优先 **A：四字段 inline，复杂字段 footer**；B 仅在产品明确优先对齐表单栅格时采用。
2. HUD 是否应由 `html` 作为唯一主题源，以保证 Teleport 到 body 的 MessageBox、Select、DatePicker 同步？建议 **A：根级主题**；B：每个宿主显式传 portal class（维护成本更高）。
3. 对读屏用户，StatusSwitch 是否需要把表格行名作为 `aria-labelledby` 组成“节点名 + 当前状态”？建议 **A：开放 aria-labelledby 并在文档示范**；B：继续依赖通用“开启/关闭”标签。

# 证据完整性与限制

- 已完成：源码、类型、Demo、中文文档、设计 HTML 与设计 PNG 对照；设计 PNG 已通过 `view_image` 实际检查；4174 HTTP 200 预检。
- 未完成：当前版本 live 页面 Playwright 截图、浅色/HUD/375px/状态逐项实际渲染、键盘焦点和 portal 主题实测。浏览器启动失败是环境原因，不是组件运行失败结论。
- 本报告没有运行或读取 Assessment B detector/browser 输出，保持评审隔离。没有宣称正式 Critique 通过。

本次未启动新的本地服务：4174 在评审开始前已由外部进程提供，未获取其 PID，也未停止该外部服务。若需要可复现 live 取证，应先恢复可启动的浏览器运行时，再对同一端口或独立端口启动并记录 PID/停止方式。

Questions skipped: 0（Assessment A 由主 Agent 在综合报告中统一提出选择题）

