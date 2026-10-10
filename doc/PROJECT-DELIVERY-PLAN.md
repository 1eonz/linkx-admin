# LinkX 项目交付计划与完成台账

## 2026-10-10 Wave 9 / LxUpload 回灌 UID 与公开 abort 回归完成

- 已确认 fallback UID 在父级回灌后仍可由公开 `abort(file?)` 精确定位；新增组合回归，验证请求取消、队列复位和受控值保持一致。
- LxUpload 单测 **38/38**；文档 E2E 前 7 项通过，服务中途断开导致第 8、9 项连接拒绝，两个受影响用例随后单独重跑 **2/2** 通过，合计证据 **9/9**。
- 交接记录见 `.impeccable/critique/wave9-upload-2026-10-10/agent-notes.md`；真实协议、AbortSignal 和业务页面替换继续留在 UI-04/迁移波次。下一入口为 `LxDescriptions`、`LxVirtualTree` 当前版正式复验。

## 2026-10-10 G2 / LxSearchBar + LxStatusSwitch 正式收口

- **本轮修复**：StatusSwitch 确认配置新增 `impact`、`audit`，Demo 展示核心节点、影响范围和不可篡改审计提示；loading、只读和无权限行补齐 `aria-labelledby`/`aria-describedby`，只读标签保留行级关联。SearchBar Demo 新增四字段标准态，明确桌面同行、窄屏单列，并移除工具栏与 `meta` 的重复等待状态。
- **独立证据**：Assessment A/B 已完成并写入 `.impeccable/critique/g2-complete-2026-10-10/recheck-assessment-a/report.md`、`recheck-assessment-b/report.md`；B 六个 detector 均为合法 `[]`、stderr 为空、exit 0，浏览器 overlay、Teleport、HUD、ARIA 和 375px 证据齐备。综合报告见 `.impeccable/critique/g2-complete-2026-10-10/recheck-final/report.md`，SearchBar 与 StatusSwitch 正式 snapshot 分别为 `.impeccable/critique/2026-10-09T19-51-41Z__linkx-fe-src-components-lxsearchbar-index-vue.md` 和 `.impeccable/critique/2026-10-09T19-51-41Z__linkx-fe-src-components-lxstatusswitch-index-vue.md`；trend 查询均返回 `39/40` 非空记录。
- **验证**：定向单测 `26/26`，`linkx-fe` `vue-tsc --noEmit`、203 模块库构建、VitePress 文档构建、目标 ESLint、目标文件 Prettier、StatusSwitch E2E `4/4`、SearchBar E2E `3/3` 和 `git diff --check` 均通过。API 请求与 Demo Mock 继续保持 `.then().catch().finally()`。独立代码复审无 P0-P2，仅发现并确认旧文档计数已同步为 `9/9`。
- **正式结论**：G2 以 `39/40` 收口，P0/P1/P2/P3 为 0；detector `[]` 仅记录静态零命中，正式结论同时依赖独立 A/B、浏览器 overlay、stderr、退出码、快照和趋势证据。VitePress 文档壳长行与复制按钮提示列为观察项，不回写为组件缺陷。
- **下一步**：按用户新增反馈先修复并复验 `LxTransferPanel` 选择框尺寸；该修复完成后进入 `LxDescriptions`、`LxVirtualTree` 当前版正式 A/B。

## 2026-10-11 Wave 10 / TransferPanel 复选框视觉尺寸与当前版复验完成

- **用户反馈与修复**：`LxTransferPanel` 文档样例树节点复选框显得过大。统一增加 `--lx-tree-checkbox-size: 14px` 令牌，`LxVirtualTree` 树节点和 TransferPanel 页脚继承复选框的视觉盒固定为 14×14px；键盘焦点环保留，桌面 24×24px 与窄屏 44×44px 点击区域及行高不变。E2E 增加树节点、页脚真实计算尺寸断言。
- **实现验证**：`lx-ui` 类型检查、203 模块构建、VirtualTree + TransferPanel 单测 **64/64**、TransferPanel 文档 E2E **32/32**、目标 Prettier、`git diff --check` 通过；复选框尺寸修复已包含在提交 `ad797971`。
- **本轮复验发现与处理**：修复前 Assessment A 为 **33/40（Good）**，发现桌面 820px 示例中树行名称、编码和状态挤压（P2）、320px 示例动作区拥挤（P2）及状态/主题入口默认折叠（P3）。浏览器证据显示 320px 视口、body 和组件根节点均无横向溢出，加入/移除按钮在视口内，因此将该窄屏 P2 记为误报。桌面树视口确有内部横向滚动和元数据挤压；已调整节点编码/状态允许收缩，并保留 `title` 完整值。Demo 折叠摘要现显示当前数据状态和主题。
- **改后验证**：`linkx-fe` 类型检查、203 模块构建、VitePress 文档构建、目标 Prettier、E2E ESLint、`git diff --check` 通过；TransferPanel 文档 E2E **33/33**，覆盖新增的桌面树行/元数据不溢出和折叠摘要状态更新。一次默认 Playwright 配置误启 Vue3 业务服务并出现后端 GET 超时，已中止；改用 `playwright.lxui.config.ts` 后所有验证仅访问本地文档站。`.pnpm-store` 为 Git 跟踪的包缓存镜像，不纳入本波提交。
- **最终审查状态**：改后 Assessment A 为 **35/40（Good）**；Assessment B 的组件、Demo、文档三个 detector 均为 JSON `[]`、空 stderr、退出码 `0`，浏览器 overlay 注入成功并完成桌面/窄屏浅色/HUD 检查；逐条记录 29 项命中并归类文档壳、预期省略及误报。独立代码复审无 P0–P3。综合报告见 `.impeccable/critique/transferpanel-final-2026-10-11/final-report.md`，snapshot/trend 在本次写入后登记。
- **遗留边界**：宿主未保存/保存失败提示归 UI-04；约 11px 的树元信息和触屏长编码全文入口列入 VirtualTree 后续复验。Detector overlay 造成的 320px 根宽度变化已通过注入前/后/移除后的测量归因为工具层，不是产品页面缺陷。收尾检查确认 8400、43620、4174 均无监听；4174 未在本轮重启。
- **下一步**：按顺序完成 `LxDescriptions` Demo 控件密度 P2，再对当前版 `LxVirtualTree` 做严格 A/B、插槽固定行高契约与 TransferPanel 联回归。本轮不关闭 UI-10 全库 52 项矩阵，也不代表 Vue3 权限宿主替换或真实后端联调完成。

## 2026-10-10 G2 / LxSearchBar + LxStatusSwitch 阶段性复核（历史记录）

- **LxSearchBar**：已补 `role=search`、loading 的 `aria-busy`、折叠按钮字段数量提示、移动端 44px 触控高度和减少动效降级；单测 8/8、文档 E2E 3/3，类型检查、目标格式检查通过。G2 Assessment A 报告为浏览器不可启动的降级评审，评分 **31/40（Good）**；Assessment B 的 detector JSON `[]`/空 stderr/退出码 0 只说明静态规则零命中，浏览器截图和 DOM 证据已保存，但 overlay 注入未稳定完成，不能据此登记正式视觉通过。报告见 `.impeccable/critique/g2-complete-2026-10-10/assessment-a/report.md` 与 `assessment-b/report.md`。
- **LxStatusSwitch**：已补确认等待期间 modelValue 版本、loading/disabled/权限撤销竞态隔离、loading `aria-busy`、只读/无权限 `aria-disabled`；单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6，类型、Prettier 和 ESLint 已通过。确认、取消、失败重试、Space 键盘、0/1 映射和原地权限源变化均有回归。
- **审查结论**：本轮仅形成阶段性/降级 A/B 证据，没有可用的 G2 综合报告、snapshot/trend，也没有完成 overlay 复验；不能把 detector `[]`、构建或 Mock E2E 记作正式 Critique 通过。A/B 报告登记的 P1 为 SearchBar 四字段操作行与设计稿不一致、StatusSwitch HUD 与 Teleport 确认层可能脱节；P2 为 SearchBar 无 `meta` 时结果/错误状态不可见、StatusSwitch 行名未进入可访问名称、375px 复杂状态和确认/失败/只读路径缺少完整实图证据，以及文档页资源 404 待归因。
- **边界与下一步**：G2 保持开放，先修复或明确 P1/P2，再用可启动浏览器完成独立 A/B、overlay、综合报告和 snapshot/trend；在全库 UI-10 严格矩阵和 Vue3 页面迁移门禁完成前，继续保留 Vue3 宿主 `element-plus`，权限中心、字段权限和引导页按既定计划延后。

## 2026-10-10 Wave 7 / LxTransferPanel 正式收口

- **实现与文档**：已完成 5:2:5 桌面布局、820px 文档预览限宽、窄屏待选/已选语义、超长名称两行折叠与展开、筛选隐藏后展开状态恢复、滚动边界和 44×44px 移除目标；中文 Demo/API/交接记录同步。
- **验证**：TransferPanel + VirtualTree 定向单测 **64/64**，TransferPanel 文档 E2E **32/32**；lx-ui 类型检查、203 模块构建、VitePress 文档构建、目标 Prettier/ESLint 和 Vue3 生产构建通过。
- **审查**：Assessment A **32/40（Good）**；Assessment B 三个 detector 均为有效 JSON `[]`、stderr 为空、退出码 `0`，六组浅色/HUD 与 1440/390/320px 浏览器 overlay、键盘、展开、按钮命中和无溢出证据已归档；独立代码复审无 P0–P3。综合报告、snapshot/trend 位于 `.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/final-report.md` 和 `.impeccable/critique/2026-10-09T16-43-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。
- **遗留与边界**：1024px 元信息碎片化、窄屏条目 `cramped-padding`、整树反选发现成本和列表内滚动提示列为 P2/P3；不阻断本波。UI-10 仍为 0/52，Vue3 `DataPermissionTree`、真实权限保存反馈和后端联调仍属 UI-04，继续保留 Vue3 `element-plus`。
- **下一波**：自动进入 G2 `LxSearchBar` + `LxStatusSwitch`，先补设计对照、文档 Playwright、Mock 成功/空/失败恢复、键盘/375px 证据，再做独立代码复审和 Impeccable A/B。

## 2026-10-09 Wave 7 / LxTransferPanel 文档预览宽度复验

- **用户反馈与处理**：穿梭选择区在文档页显得过宽。仅将 Demo 预览限制为最大 `820px` 并居中，窄屏使用正文可用宽度；组件 API 的宽度和 `panelHeight` 默认 `380px` 契约不变。Demo 的 `240px` 紧凑高度仍为默认值，但高度选择器移到示例上方常显，并提供 `300px`/`380px` 档位。
- **评审建议处理**：移动端候选数量标签改为“待选”，无障碍名称同步，名额剩余数仍由批量操作提示单独说明；组件文档在示例旁说明本地选择不代表权限已保存，真实宿主须按接口结果显示保存状态。
- **验证**：`lx-transfer-panel.test.ts` + `lx-virtual-tree.test.ts` **64/64**；TransferPanel 文档 Playwright **30/30**，其中桌面 1440px 断言 820px 居中，390px 断言正文容器扣除内边距后的实际可用宽度，且页面无横向溢出。lx-ui/Vue3 类型检查、目标 Prettier、Vue3 生产构建和 203 模块 lx-ui 构建通过；VitePress 文档构建与新一轮独立 A/B 仍在收口。
- **代码复审**：独立 Luna 复审未发现 P0-P2；指出项目交接中的 E2E 数字和 Demo 哈希过时，本节正在统一。UI-10 保持 0/52；Vue3 `DataPermissionTree` 真实宿主契约与权限联调仍属 UI-04，保留 Vue3 宿主 `element-plus`。
- **下一步**：补齐最终 Impeccable A/B、正式报告与 snapshot/trend，完成本波白名单提交并推送后进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-08 Wave 7 / LxTransferPanel 最终复审进行中

- **组件修复**：完成双栏穿梭的 5:2:5 桌面轨道、380px 同高面板、名称/部门编码筛选、筛选范围批量操作、节点元数据、未加载授权回显与确认边界；`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px。跨断点焦点、虚拟树滚动后的 Tab 停靠项均有针对性修复。桌面树项基准行高为 32px；普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项的标记与原始键值移至名称下第二行，实际被截断的长名称才提供 disclosure；TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。树节点总数改为明确的“树节点总数”，窄屏名称完整换行。
- **验证**：`lx-transfer-panel.test.ts` 与 `lx-virtual-tree.test.ts` 合计 **64/64**；`lx-transfer-panel-docs.spec.ts` **28/28**。`lx-virtual-tree-docs.spec.ts` 的 13 项文档回归单独统计，不并入本波 TransferPanel 数字。lx-ui TypeScript 检查、203 模块构建、VitePress 文档构建、目标 Prettier/ESLint 与 `git diff --check` 通过。保留构建既有大 chunk、pnpm 配置及 Element Plus chunk 警告。
- **正式审查门槛**：三份较新的代码复审曾提出行内键盘导航、虚拟窗口 Tab 停靠和窄屏切回桌面的焦点问题；当前改动及直接回归已补，但等待本轮独立复审。Assessment B 的 DOM、overlay、截图和安全投影浏览器证据已完成 **20/20**，正在收口证据索引及综合 snapshot/trend；完成前不登记正式 Critique 通过。
- **未完成事项**：Assessment A 对已选名称和计数语义的复验随本次修复进行；“已保存/未保存”只能由 UI-04 权限宿主 dirty 状态和真实保存结果显示，加入宿主迁移清单。Assessment B 中 375px 页面 `scrollWidth=615px` 只出现在注入 overlay 后；无 overlay 基线保持 375px 且组件无横向溢出，不能归因于组件。API 宽表仅在自身容器滚动的 320px 回归已通过，文档壳层仍按共享复验观察。
- **边界与下一步**：UI-10 仍为 **0/52**；Vue3 `DataPermissionTree` 需在 UI-04 核对真实 props、exposes、父子勾选、跨页/树外回显、change 回传和权限错误，并通过 Mock/E2E；真实后端联调另列。保留 Vue3 宿主 `element-plus`。当前审查与两笔白名单提交推送完成后，进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-07 Wave 6 / Cascader、Descriptions、VirtualTree 与文档侧栏正式收口

- **完成内容**：修复 Cascader 传送弹层 HUD 变量继承、Descriptions 中文主题标签和侧栏术语；补齐 VirtualTree 行内控件键盘事件隔离、number/string 键区分、空字符串键过滤焦点恢复、移动触控高度和混合勾选语义；同步中文 Demo、API、E2E 断言和文档导航。
- **验证**：Vue3 全量 Vitest 58 个文件/457 个测试；VirtualTree 18/18、Descriptions 6/6；VirtualTree 文档 E2E 3/3、Descriptions 文档 E2E 3/3；lx-ui 类型检查、库构建、VitePress 文档构建、Vue3 类型检查、目标格式检查和 `git diff --check` 通过。构建保留既有大 chunk 警告。
- **代码复审**：独立审核批准，无可复现 P0-P3；空字符串节点键回归覆盖已按审核意见确保旧实现会失败。
- **Impeccable 正式结果**：Assessment A 35/40（Good）；Assessment B 使用隔离 Playwright fallback，7 个 detector 均为有效 JSON `[]`、stderr 为空、退出码 0，四个新标签 overlay/键盘/HUD/375px 证据与当前源码指纹一致。完整报告见 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`，A/B 和代码审核证据位于同目录；`[]` 只表示静态规则零命中。
- **后续登记**：Demo 高级控制渐进披露（P2）、VirtualTree 自定义 node 插槽单行/可测量高度契约（P2）、Cascader loading 可聚焦语义说明（P3）列入后续台账；不增加 UI-10 52 项全库关闭数。
- **下一步**：进入 Wave 7 `LxTransferPanel`，按 `design/虚拟滚动树 + 双栏穿梭/` 严格实现 5:2:5 布局、380px 高度、节点 code/status、空/加载/错误、窄屏/HUD/键盘和减少动效；完成库级门禁后再回归 Vue3 `DataPermissionTree`，不提前删除宿主 `element-plus`。

## 2026-10-07 Wave 5 / TreeSelect、Cascader 与 SelectPagination 正式收口

- **完成内容**：补齐 `LxTreeSelect` 方向键/Enter 选择、清空和窄屏触控；补齐 `LxCascader` 英文错误文案、错误焦点和窄屏长节点换行；补齐 `LxSelectPagination` 表单禁用继承、迟到响应隔离、续页失败同页重试和禁用不发请求。三个组件 Demo 和中文文档均同步更新组件选型说明。
- **验证**：定向单测 **36/36**，文档 E2E **15/15**；lx-ui typecheck、203 模块库构建、VitePress 文档构建、目标 Prettier/ESLint 和 `git diff --check` 通过。4177 评审服务已停止，用户预览 4174 未触碰；保留既有文档构建大 chunk 与 pnpm 配置提示。
- **代码复审**：独立复审批准，未发现 P0、P1、P2；P3 为 Cascader 移动 E2E 尚未用足够长的真实节点直接断言换行，列入下一次回归增强。
- **Impeccable 正式结果**：A/B 使用独立 Agent。A **32/40（Good）**，修复前基线 29/40；B 的 9 个 detector 目标均为合法 JSON `[]`、stderr 为空、退出码 0，并完成 9 个独立浏览器 overlay 场景。`[]` 仅表示静态零命中；最终报告、证据和 snapshot/trend 见 `.impeccable/critique/wave5-tree-select-pagination-2026-10-07/` 与 `.impeccable/critique/2026-10-07T05-56-06Z__linkx-fe-src-components-lxtreeselect-index-vue.md`。
- **剩余 P2**：移动 Cascader 换行密度、Cascader 错误后的旧成功状态、三个 Demo 主题入口不对称、文档侧栏同级链接过多，已登记下一波文档/壳层整改；不增加 UI-10 52 项全库关闭数。
- **边界**：没有进行真实后端、权限身份或 Vue3 业务页面联调，没有删除宿主 `element-plus`；API 请求继续使用 `.then().catch().finally()`。完成本波两笔白名单提交推送后自动进入下一批复杂组件，继续逐项代码复审和 Impeccable A/B。

## 2026-10-07 Wave 4 / DynamicForm、DatePicker 与 Upload 正式收口

- **修复**：`LxUpload` 根节点 ref 回调在 Vue3 宿主与组件库的 Vue 类型之间存在名义类型冲突；回调改为接收 `unknown` 并以 `HTMLElement` 收窄。上传必填回归验证真实键盘触发器的 required、invalid 和描述关联；同批次移除字段反馈并清除校验时，`LxFormItem` 不再缓存内部错误 ID，ARIA 属性恢复也改为幂等写入。字段类型 E2E 现在逐类精确验证四组候选成员和数量。
- **新增回归**：DatePicker 短视口 E2E 检查触发器在视口内、弹层不遮挡触发器并确实发生弹层内部滚动；Upload 320px 用例确认省略文件名保留完整 `title`。最新 DatePicker/Upload 文档 E2E **31/31**，三份文档 E2E 合并 **43/43**；定向 Vitest **89/89**。
- **代码复审**：独立复审未发现可复现 P0–P2；短视口断言缺口作为 P3 已处理。另有非阻断测试空缺：尚未直接覆盖 fallback UID 回灌后调用公开 `abort()` 的组合路径，后续 Upload 复验补齐。真实上传协议、服务端取消和 `LxForm` 设计稿逐项联调仍开放。
- **Impeccable 正式结果**：双 Agent A/B 已完成。A 为 **30/40（Good）**、P0/P1/P2 为 0；B 对三个组件源码和三份中文文档共六个目标均取得可解析 JSON `[]`、空 stderr、退出码 0，并在 10 个新浏览器场景成功注入 overlay。HUD 令牌、文档壳层、日期弹层预期覆盖和隐藏节点逐项归因。综合报告和 snapshot 已保存；trend 查询只返回本目标的首次 **30/40** 记录，暂无历史趋势。
- **验证**：Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块库构建、VitePress 文档构建和 `git diff --check` 通过；文档构建保留既有大 chunk 警告，pnpm 保留旧配置提示。组件 Mock 证据不代表真实后端或 Vue3 页面迁移。
- **E2E 隔离修复**：4176 当时响应了另一项目的 dumi 页面，Playwright 因复用现有服务而误测到“页面未找到”。lx-ui 文档 E2E 已隔离至 4177，并同步 DynamicForm 请求白名单与 Switch 测试来源；本波三页 43/43、Switch 兼容 6/6 均通过。原 4176 和用户预览 4174 未停止。
- **下一步**：按计划进入 TreeSelect/Cascader 当前版正式复验，并闭环 `LxSelectPagination` 的表单 disabled 继承、迟到响应隔离、续页失败同页重试和禁用不发请求；全库门禁完成前继续保留 Vue3 宿主 `element-plus`。
- **本波代码提交**：`a2ba943 fix(lx-ui): finalize DynamicForm date picker and upload flows`；项目计划、交接和审查证据由配套 `docs(project)` 提交归档。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 复审缺陷修复

- **代码复审发现**：不同 `LxUpload` 实例的回退 UID 前缀原先从相同的实例级计数开始；相同无 UID 文件在两个实例中可能产生相同对外 UID，父级聚合后会覆盖条目。
- **修复与验证**：将 UID 前缀序列移至 `LxUpload/uid.ts` 模块级工厂，新增双实例相同文件回归。DatePicker、DynamicForm、Upload 单测 **69/69** 通过；lx-ui 类型检查、目标 Prettier 和 Vue3 ESLint 通过。文档 Playwright **13/13** 是此前代码状态的通过结果，本次 UID 修复后尚未重跑。
- **Impeccable 状态**：旧 Assessment A 的 31 文件冻结为 10:19 版本，B 的冻结清单为 10:05 版本且浏览器流程不完整；两者无法组成正式 Critique。该结论和原始证据保留在 `.impeccable/critique/wave4-dynamicform-2026-10-06/`，当前源码需重新冻结后独立运行 A/B。
- **下一步**：对最终源码及文档建立一致哈希冻结，完成独立 A/B、建议复验和正式报告后，按 `fix(lx-ui)`、`docs(project)` 两笔白名单提交并推送；然后进入 TreeSelect/Cascader 与 `LxSelectPagination` 闭环。

## 2026-10-06 UI-13 / 日期区间清空值类型补齐

- **发现与修复**：Element Plus 2.14.6 的 `daterange` 默认清空事件发出 `null`，原 `LxDateModelValue` 类型漏掉该值。现在 DatePicker 与 DynamicForm renderer 类型明确包含 `null`；Demo 展示受控日期区间清空后的字段值，中文 API 与宿主规范说明默认清空值。
- **验证**：DatePicker/DynamicForm 定向单测 **47/47**、DynamicForm/Upload 文档 Playwright **13/13**；lx-ui/Vue3 类型检查、定向 ESLint/Prettier、202 模块库构建、VitePress 文档构建通过。构建保留既有大 chunk 警告。没有改变日期解析、表单模型转换或业务 API。
- **复审与 Impeccable**：独立代码复审提出的 LxUpload 跨实例 UID 缺陷已在本轮修复。旧 A/B 文件冻结不一致且浏览器证据不完整，不能作为正式 Critique；detector `[]` 仍只代表静态零命中。
- **边界与下一步**：此修复只补齐默认清空值类型，不代表 Vue3 业务页迁移或 UI-10 严格矩阵关闭。完成复审与提交推送后，继续 TreeSelect/Cascader 当前版 Critique 和远程分页选择闭环。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件验收

- **完成内容**：DynamicForm 依据 `type` 独立渲染字段，字段只组合公开 `Lx*` 控件；受控 `value`/`change(nextValue)` 与既有 `v-model` 保持兼容；单/多文件列表、日期范围严格解析、远程选择竞态、密码字段和字段级反馈均有对应回归。修复 LxUpload 受控父级重试时的队列时序，并保留 UID、URL、response、Error 与取消复位语义。
- **验证**：DynamicForm/Upload 定向单测 46/46、文档 Playwright 13/13；lx-ui 和 Vue3 类型检查、目标 ESLint/Prettier、202 modules 库构建、VitePress 文档构建及 `git diff --check` 通过。并发构建导致的 Windows `EBUSY` 首次 E2E 失败不计通过；串行复跑 13/13。文档构建保留既有大 chunk 警告。
- **代码复审与 Impeccable**：独立代码复审最终批准，未发现可复现阻塞问题。Assessment A/B、建议吸收/复验、正式综合报告与 snapshot/trend 在本节最终归档时补录；未完成前不把阶段结果标为正式 Critique 通过。
- **边界**：仅为 lx-ui 组件和文档 Mock 的集成验收，未迁移 Vue3 业务页面或调用真实上传服务；不关闭 `LxForm` 设计图完整对照，不增加 UI-10 52 项严格关闭数，也不代表真实后端联调。
- **下一步**：依 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md` 转入 TreeSelect/Cascader 当前版本正式复验与远程分页选择闭环；UI-10/UI-11 全库门禁结束前继续保留 Vue3 宿主 `element-plus`。

## 2026-10-06 Wave 3 / LxIcon 严格复核与修后收口

- **完成内容**：未知运行时图标安全回退到有可访问错误名称的问号图标；侧栏菜单图标在数据边界解析并回退；设置入口使用有效图标键；上传状态图标使用 `LxIconName`。目录加入中文语义检索、清除后焦点恢复、别名计数说明、窄屏触控、主题映射和清晰空态。搜索栏采用普通文档流，避免滚动遮挡卡片。
- **验证**：`tests/unit/lx-icon.test.ts` 7/7；图标文档 E2E 当前配置 2/2（单 Chromium 项目，含桌面与 320px 窄屏交互检查；375px 行为另有独立浏览器评估证据）。Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 通过。文档构建保留既有大 chunk 警告；lx-ui 没有独立 ESLint 配置，不把宿主忽略库路径记为库 ESLint 通过。`git diff --check` 通过。
- **代码复审**：独立 Luna max 只读复审批准，未发现可复现 P0–P2。P3 建议是 E2E 除 96 张卡片总数外，进一步比较 `data-icon-name` 去重集合；静态 AST 复核已确认当前分组与注册名称无重复、无遗漏。真实读屏器播报和真实权限菜单中的畸形图标数据仍未覆盖。
- **Impeccable 修后复验**：独立 Assessment A 重评分 37/40（Excellent），修前基线为 33/40；搜索栏遮挡、默认展示过多和缺少业务组合样例三项原问题均已复验解决。独立 Assessment B 扫描组件与文档，均为有效 JSON `[]`、stderr 为空、退出码 0；这只表示静态规则零命中。五个新浏览器 context 均成功注入 overlay，所有规则命中已逐项归因为 CJK 行长规则误报、Shiki/VitePress 文档壳层或导航/code-copy 误报，没有命中 LxIcon 控件节点。综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`；正式 snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`，含最终报告来源说明，目标首次趋势为 37/40。原始扫描、截图及服务记录见 `.impeccable/critique/wave3-lxicon-2026-10-06/`。
- **未关闭项与边界**：展开 P1/P2 长分组后仍有 26/29 个图标，保留为 P2；代码复审提出的名称集合断言保留为 P3。浅色默认页面有一条无 URL 且无匹配 HTTP 404 的 console 事件，未归因。真实读屏器、真实权限菜单数据、Firefox/Safari 和触屏设备未覆盖。本波不增加 UI-10 52 项严格矩阵关闭数，也不关闭 UI-11 整库门禁。
- **实现提交**：`d4972fd fix(lx-ui): harden icon fallbacks and docs search`。
- **下一步**：自动进入 `LxDynamicForm`，按 schema type 拆分字段渲染器；补真实 `LxForm/LxFormItem` 密码校验与 ARIA、宿主远程查询取消/乱序、单图/多图上传状态映射、`daterange` 往返、自适应容器断点和受控值回灌。Vue3 Element Plus 替换仍等待 lx-ui 全库门禁。实现/E2E 与计划、审计、正式评审证据继续分别使用 `fix(lx-ui)`、`docs(project)` Conventional Commit 并推送。

## 2026-10-06 Wave 1 / LxPasswordInput 修后复核

- **完成内容**：修复 320px 页面内“交互示例”锚点被移动目录覆盖；暗色 VitePress 下 Demo 和 Element Plus 输入面映射站点暗色令牌；窄屏主工具栏及高级设置标签提升到 44px。补真实目录链接、明暗/HUD 和高级标签尺寸 E2E。
- **验证**：LxPasswordInput 单测 10/10、文档 Playwright 9/9、Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、VitePress 文档构建和差异检查通过。文档构建仅有既有大 chunk 警告。
- **代码复审与 Impeccable**：独立代码复审最终批准；曾发现高级设置标签触控区不足，修后复核通过。A 32/40；B 三个 detector 均为有效 `[]`、stderr 空、退出码 0，浏览器 overlay 11 个目标经归因后均属 HUD 主题规则提示或 VitePress 文档壳层，不是密码控件缺陷。正式复核与证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`；综合 snapshot/trend 另见 `.impeccable/critique/`。
- **未关闭项**：宿主 `LxForm/LxFormItem` 校验失败集成示例并入 Form/DynamicForm 后续波次；移动 Props 表呈现与 VitePress 目录项高度列入共享文档壳层体验待办。因此 `LxPasswordInput` 不登记为严格矩阵已关闭。
- **下一步**：按用户确认顺序先严格复核动态图标，再进入 `LxDynamicForm`；其中纳入密码字段与宿主校验反馈的集成示例。lx-ui 全库门槛完成前不替换或删除 Vue3 宿主 Element Plus。

## 2026-10-05 Wave 2 / Checkbox 与 Radio 实现及审查

- **完成内容**：完成 `LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 的状态、令牌、中文 API/Demo 和行为回归收口。Radio 改选后的可见/读屏回报采用中文选项名；组选中可用项作为 Tab 入口，已选禁用历史值展示在独立只读示例。
- **验证**：定向单测 20/20、文档 Playwright 4/4；Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 与暂存前 `git diff --cached --check` 通过。测试中 Element Plus 对旧 `label` 作值用法输出既有弃用提示；此回归用于保留迁移兼容契约。
- **代码复审**：独立复审批准；原 Radio Tab 可达性问题通过默认选中可用项、组外禁用历史值和真实 Tab/方向键 E2E 关闭，未发现其他 P0–P2。
- **Impeccable**：A 34/40；B 对 Checkbox/Radio 两组分别检查亮色、HUD、触屏、禁用、焦点和减少动效。Radio 最新 16 个浏览器视图均完成注入/预检，四个组件目录与最终 Radio Demo detector 均为有效 `[]`、stderr 空、退出码 0。触屏 44px 目标已实测；A 提出的 375px API 表格扫描效率 P2 仍开放，严格矩阵行保持打开。完整报告、截图和综合快照位于 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。
- **状态与下一步**：源码及 E2E 已提交为 `be86f10 fix(lx-ui): 完善复选与单选控件状态`；交接、计划和评审证据按既定约定另作 Conventional Commit。下一项自动继续 `LxSwitch`；全库严格门禁前不移除 Vue3 宿主 `element-plus`。

## 2026-10-05 Wave 2 / LxSelect 实现与交互复验

- **完成内容**：修复 HUD 主色变量影响全局的问题，将 Select teleported option 描述改为直接类名样式；远程错误说明继续关联输入框，弹层打开时由 footer 提供重试，关闭时将错误与重试放回控件旁，成功后清理 `aria-describedby`；窄屏/触屏选项行提升到 44px。按设计样本补充单项离线禁用候选项，并将远程失败空态文案明确为请求失败。中文 API 补齐 `options`、公开插槽、错误恢复和 2px 键盘焦点光环说明。
- **验证**：LxSelect 单测 **10/10**、当前文档 E2E **3/3**；E2E 覆盖 options/slot、禁用候选项、空结果/失败/弹层内重试、错误描述清理、HUD 局部主色令牌和 320px 44px 选项行。首次复跑发现宽泛的 `.lx-select__popper` 同时命中 Select 下拉与多选标签 tooltip，改为 `.el-select-dropdown.lx-select__popper` 后通过。Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 和目标 `git diff --check` 通过；文档构建保留既有大 chunk 提示。lx-ui 未安装独立 Vitest 命令，单测结果为现有 LxSelect 单测文件 10/10。
- **代码复审**：Luna max 独立复审最终批准。复审曾初判两个类不能同处下拉节点；实际 Playwright DOM 显示 Select dropdown 同时带两类，而宽泛定位会另命中 tooltip。最终精确定位已由主任务 E2E 3/3 复验，复审者批准且未自行重跑测试。
- **Impeccable**：Assessment A-only 暂定 **29/40**，当前复核环境无可用浏览器且 4174 连接被拒绝；浏览器主题、焦点光环及 320/390/1280px 当前视图因此未验证。Assessment B 两个目标 detector 均为有效 JSON `[]`、stderr 为空、退出码 0，只表示静态零命中；早前只读浏览器交互可见 HUD、失败重试与禁用项，但 overlay 注入、当前版本持久截图、综合快照和趋势记录未完成。证据与范围见 `.impeccable/critique/wave2-lx-select-2026-10-05/`，综合状态为降级，不能登记正式 Critique 通过。
- **状态与下一步**：实现、API/Demo、行为测试、构建、最终代码复审和阶段性浏览器检查已完成；正式视觉 Critique 未闭环前，`LxSelect` UI-10 严格矩阵行保持打开。下一项继续 Wave 2 的 Checkbox/Radio，随后 Switch；组件库和 UI-11 门禁关闭前保留 Vue3 宿主 `element-plus`。

## 2026-10-05 Wave 2 / LxDatePicker 短视口修复与正式复核

- **实现结果**：窄屏打开弹层后测量实际边界；原生定位完整时继续锚定输入框，越界时切换到视口内居中浮层。滚动限制在日历面板内，箭头仅在居中态隐藏；320px 区间弹层保留至少 18.5px 横向余量。
- **回归证据**：DatePicker 文档 Playwright **16/16**；覆盖 320/375/390px 宽度、320×375 和 390×375 普通及快捷区间、滚动后末行可见、滚轮不带动页面、HUD、错误态 ARIA、键盘/Escape 与减少动效。DatePicker/DynamicForm 定向单测 **39/39**。
- **静态与构建验证**：lx-ui `vue-tsc --noEmit`、`build`（196 modules）、`build:docs`、Vue3 目标 ESLint、目标 Prettier 和目标 `git diff --check` 通过。VitePress 构建有既有大 chunk 提示；pnpm 报告旧 `onlyBuiltDependencies` 字段被忽略。
- **正式复核**：Assessment A **31/40**；Assessment B detector 为有效 JSON `[]`、stderr 空、退出码 0，并完成 9 个浏览器场景和 4 个覆盖层视图；独立代码复审批准。完整证据在 `.impeccable/critique/wave2-date-range-2026-10-05/final-review/`，综合快照为 `.impeccable/critique/2026-10-04T21-53-59Z__linkx-fe-src-components-lxdatepicker-index-vue.md`（首次目标记录，无历史趋势）。`[]` 只表示静态零命中。
- **未关闭建议**：A 留下 3 项 P2（字段上下文遮挡、快捷日历需滚动且无提示、桌面标签重叠）和 1 项 P3（桌面弹层贴近底边）；320px 文档横向滚动暂无法归因于 DatePicker。DatePicker 的 UI-10 严格矩阵行仍未关闭，以上建议需进入后续统一整改台账。
- **范围与顺序**：本子项的实现、行为验收、A/B 及代码复审已收口；不关闭 Wave 2 其他控件或 UI-10 的 52 项矩阵。下一项按计划为 `LxSelect`。lx-ui 全库严格核验和 UI-11 门禁完成前，不移除 Vue3 宿主 Element Plus。

## 2026-10-05 Wave 2 / LxDatePicker Demo 与窄屏复核

- 当前完成子项：DatePicker Demo 的区间示例前移、可见说明精简、低频参数改为默认收起；HUD 区间分隔符提高对比度；窄屏快捷区间弹层保留 8px 左右留白。对比度回归拒绝半透明颜色，避免忽略 alpha 后误报通过。
- 可达性证据：375×812 下快捷区间弹层初始下边界约 y=866，超出视口 54px；页面滚动 54px 后弹层随触发器移动，末行完整可见，依次选择 10 月 5/6 日成功且焦点稳定。结论是需滚动后查看末行，不是不可选。日期区间的其他弹层在独立 A/B 视图中另行测量，具体尺寸见本波报告。
- 验证：DatePicker 文档 Playwright 12/12；修改 alpha 对比度 helper 后 HUD 定向用例 1/1；lx-ui `vue-tsc --noEmit`、`build`（196 modules）、`build:docs`、Vue3 定向 ESLint、Prettier 与目标 `git diff --check` 通过。文档构建保留既有大 chunk 与 pnpm 配置警告；首轮 Playwright 因 4176 服务未监听而失败，显式启动服务后单 worker 重跑通过。
- 独立代码审核：批准，无 Critical/Nitpick；指出的半透明颜色测试风险已修复并复核通过。
- Impeccable：当前版本独立 A/B 报告与综合 snapshot/trend 以 `.impeccable/critique/wave2-date-range-2026-10-04/` 和本条后续报告为准；detector `[]` 只表示静态零命中。当前记录仅覆盖 LxDatePicker 文档 Demo 与关联样式，不关闭 Wave 0 的字段关联评审，也不代表 Wave 2 全部组件完成。
- 下一项：继续 `LxSelect` 的设计对照、交互行为与严格审查，再推进 Checkbox/Radio/Switch；Vue3 Element Plus 批量替换仍受 lx-ui 全库门禁约束。

## 2026-10-04 后续任务完整拆分与执行规范

完整的剩余任务拆分、依赖顺序、完成门槛、中文文档/注释规则、`.then().catch().finally()` 规则、Mock 边界、代码审核和 Impeccable A/B 证据要求见 [`PROJECT-FOLLOWUP-BREAKDOWN.md`](./PROJECT-FOLLOWUP-BREAKDOWN.md)。Wave 1 密码框透传 `type` 覆盖遮罩的 P1 已在提交 `2762816` 修复并增加回归；当前单测 7/7，独立代码复审批准且未发现 P0–P2。Assessment A 最新静态复评为暂定 30/40，已检查当前源码和文档，但视觉结论仍依赖旧截图；Assessment B 六个有效 detector 结果均为 `[]`、stderr 空、退出码 0。因浏览器策略未取得修复后的 overlay/snapshot，Wave 1 不能标记视觉审查关闭。当前继续 Wave 2 实现，宿主 Element Plus 替换门槛不变。

- Wave 0 验证：DatePicker/DynamicForm 单测 36/36；lx-ui `typecheck`、`build`（196 modules）、`build:docs`，DatePicker 文档 E2E 1/1，目标 ESLint/Prettier 和差异检查通过。独立代码审核未发现可复现缺陷；相邻区间说明隔离补测已通过。
- Wave 0 未关闭：修复后的正式 Impeccable A/B、overlay、综合报告和 snapshot/trend 尚待完成；DynamicForm/Form 与基础控件均不可据此标记正式视觉审查关闭。
- 当前正式门槛：TreeSelect/Cascader 当前版本 overlay、52 个公开组件严格矩阵、Vue3 Element Plus 分批替换、权限/真实后端联调、登录页与动态图标整站审查均未全部完成。

## 2026-10-03 UI-13 / DynamicForm 字段反馈复验

- 日期字段的 `aria-describedby` 已同步到实际日期输入；描述 ID 更新或移除时同步清理，并通过双日期字段回归验证不会串联到相邻字段。动态表单字段反馈 ID 保持实例级唯一，上传和自定义插槽提供实际控件所需的描述 ID；loading 时禁止重复触发重试。
- Demo 的候选人员状态新增可固定的“加载中”选项；API 文档在完整参考表前新增最小 schema 示例，并明确长表单的业务分区/步骤由宿主负责。文档侧栏“数据录入”分组超过 4 项同级入口，登记为全站文档导航信息架构待办。
- 阶段性验证：DynamicForm 与 DatePicker 定向单测早期曾为 34/34，文档 Playwright 1/1；后续代码复核发现相邻日期选择器说明 ID 隔离缺陷，修复前定向测试有 5 项失败。Wave 0 已修复并在当前工作区复验 36/36；较早失败仅保留为问题发现背景。VitePress 构建保留既有大 chunk 警告。
- Impeccable Assessment A 桌面评审 29/40（Good）；可执行的加载状态、最小接入示例和长表单边界建议已处理，导航分组作为跨站事项保留。Assessment B 源码/文档 detector 为有效 JSON `[]`、stderr 空、退出码 0，仅表示静态零命中。新浏览器标签可访问页面，但注入预检无可用的可变页面接口；未启动 overlay。故本轮只记阶段性评审，未生成正式 Critique 快照，不关闭 UI-13/UI-11。
- 下一步继续基础控件严格设计对照与行为/浏览器验收；保留 DynamicForm 正式 Impeccable 视觉证据待补项，不能将 detector `[]` 或阶段性评审写成正式通过。

## 2026-10-03 UI-10 Wave 6 交付与审查状态更正

- `LxTreeSelect` 与 `LxCascader` 的实现、Demo、API、单测和文档 E2E 已完成；单测 17/17、文档 Playwright 8/8（`playwright.lxui.config.ts`，VitePress 4176）。Cascader Demo 可从 `/components/new-components.html` 总览页和 `/components/lxcascader.html` 独立页查看。
- 当前两组件源码及两份文档的 detector 均为有效 JSON `[]`、stderr 为空、退出码 0，仅表示静态规则零命中。当前浏览器策略拒绝 overlay 注入预检；10 月 2 日旧 overlay 早于当前代码/文档修改，不能作为当前版本正式 Critique 证据。
- 仍保留 P3 观察：English locale 在 Demo 中可进一步增加可见覆盖、两个 Demo 外框风格可统一，移动/减少动效复验受浏览器能力限制；文档外壳横向溢出和 overlay 命中已在报告中与组件缺陷区分。
- Wave 6 的实现和行为验收完成，但当前正式 Impeccable Critique 尚未闭环，因此 TreeSelect/Cascader 不登记为严格 UI-10 已关闭。基础控件批次按计划继续，顺序为 Button、Input、Textarea、Select、DatePicker、Checkbox/Radio、Switch、PasswordInput；InputNumber 已完成实现回归，随批次统一 A/B。Vue3 Element Plus 替换、UI-10/11 全库审查和真实后端联调仍未完成。
- 执行规则（2026-10-03）：每波结束后自动执行 code review，修复本波可复现问题，同步计划与交接记录，再按本波文件清单提交并推送；完成后自动开始下一波。子 Agent 按用户最新配置使用 `gpt-6-luna`、`max` 思考强度。

## 2026-10-02 UI-10 Wave 6 修复与复验中

- `LxTreeSelect` 多选 footer 现在按局部 `locale` 提供中英文“已选数量/未选择/取消/确认”文案，并允许四项文案分别覆盖；`selectedText` 支持 `{count}`。
- `LxCascader` 明确 `loading` 优先于并发 `error`：请求中仅呈现 loading，loading 结束后仍有 error 才呈现错误、`aria-invalid` 与重试；Demo 的路径值不再和状态播报重复读出，模式、数据状态控件分组。
- 当前验证：定向单测 17/17、文档 Playwright 5/5、lx-ui typecheck/build/docs build、Vue3 `vue-tsc --noEmit`、目标 Prettier 检查通过。Vue3 ESLint 对仓库外 linkx-fe 文件输出 ignored，不能视为库 ESLint 通过；linkx-fe 没有独立 ESLint 配置/脚本。
- 前置 Impeccable detector 对源码/文档四个目标 JSON 均为 `[]`、stderr 空、exit 0；仅是静态零命中。前置浏览器 overlay 证据见 `.impeccable/critique/wave6-current-2026-10-02/assessment-b/`。修后独立 A/B 正在进行；在综合快照和剩余建议复验前，TreeSelect/Cascader 不更新为严格 UI-10 已关闭。
- 下一步：收齐修后 A/B，按实际组件缺陷修复并复验，再更新矩阵/交接；本波收口后转入基础控件批次，保留“基础控件与动态图标 → DynamicForm → 其他 lx-ui → Vue3 Element Plus 替换”的顺序。

## 2026-10-02 本地预览分页回归与控件参数确认

- 全菜单 Mock 预览用例复跑通过，32 个子菜单页面及“全部菜单”目录可见；此前记录的菜单定位失败当前不可复现。
- 轮播文章分页已修复：滚动加载增加并发保护、失败页码回退、按文章 ID 去重及请求代次校验；切换/清空公众号后旧响应不再覆盖当前选项。
- `LxInputNumber` 的 `controls` 已有公开参数，默认 `true`，传 `:controls="false"` 隐藏按钮；当前 API、Demo 开关及 12 项单测均覆盖该契约，本轮追加确认浏览器用例 1/1 通过。
- 验证：`preview.spec.ts` 全量 6/6（全菜单、北向 Mock CRUD、轮播分页、AuthImg 失败/键盘/减少动效）；轮播分页定向 E2E 1/1；`vue-tsc --noEmit`、目标 ESLint、Prettier 通过。均为本地 Mock，不代表真实后端联调。
- Impeccable detector 的 JSON、stderr、退出码分别保存于 `.impeccable/critique/carousel-pagination-2026-10-02/`；结果 `[]` 只表示静态零命中。本轮未执行正式双路评审及 snapshot，不将功能验收误记为正式视觉 Critique。

## 2026-10-02 基础控件批次增量：LxInputNumber

- 已修复 sm/md/lg 右侧步进器的中间空白：按钮由触发器实际高度分配，上下连续贴合并保留 1px 分隔线。
- `controls` 参数已在 Demo 提供可视化开关，覆盖显示、隐藏和恢复；组件 API、实际输入框可访问属性与中文说明同步。
- 证据：InputNumber 定向单测 12/12；通过 `playwright.lxui.config.ts`（4176 lx-ui 文档站）运行 `lx-base-controls-docs.spec.ts --grep InputNumber` 为 1/1；基础控件综合 `lx-base-controls-docs.spec.ts` 在修复 DatePicker 区间默认宽度后 4/4；浏览器人工复核、lx-ui `pnpm typecheck`、`pnpm build`（195 modules）、`pnpm build:docs`、目标 Prettier/ESLint 和 `git diff --check` 均通过；文档构建保留仓库已有的大 chunk 警告。宿主 30846 配置本次因代理 172.16.23.8:30844 超时未通过，不作为组件失败证据。Impeccable detector JSON/stderr/退出码已分开保存，`[]` 仅为静态零命中；当前隔离 Agent 额度失败，本批仍需与其他基础控件合并进行正式 A/B，不单独关闭 UI-10。

## 2026-10-01 连续实施与审查安排（子 Agent 配置已于 2026-10-03 更新）

- 当时的子 Agent 配置为 `gpt-6.1-sol`、`medium`；2026-10-03 用户更新为 `gpt-6-luna`、`max`，后续以最新配置为准。每批实施完成后执行独立代码审核与 Impeccable A/B，记录实际证据和未完成项。
- 当前先收口 UI-10 Wave 6：TreeSelect 的叶节点提交/非叶展开、多选确认取消、Cascader 的错误焦点与实际输入框错误描述关联；同步 API、Demo、单测与文档 E2E。
- 下一批严格核对基础控件（Button、Input、Select、Textarea、InputNumber、Checkbox/Radio、Switch、DatePicker、PasswordInput），再完成动态图标和两个 Form 的统一设计矩阵，随后逐批完成其余 lx-ui 组件。
- 各批必须保留设计依据、建议处理、浏览器状态与动效证据、独立审核结论和交接记录；有效 detector `[]` 仍只代表静态零命中，不能单独登记正式通过。
- lx-ui 全库门槛关闭后才执行 Vue3 全量替换；宿主移除自身 Element Plus 依赖，缺少 Lx 专用封装的能力通过 lx-ui 导出桥接并登记，保留库内部 Element Plus。业务迁移与 Mock 深交互验收随后继续；真实联调和用户确认延期项保持单列。

## 2026-09-30 基础组件严格审查扩展（计划确认）

- 基础组件与表单同样纳入 UI-10 严格对照：`LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch` 和 `LxPasswordInput`。
- 每个组件按 `design/` 对照默认、hover、focus、disabled、loading、error、empty（适用时）、明暗/HUD、窄屏、键盘和 `prefers-reduced-motion`；同步 Demo、中文 API、行为测试、浏览器证据和独立代码审核。
- 基础组件批次与 `LxForm`/`LxDynamicForm`、TreeSelect/Cascader 分开记录，未完成前不得把桥接页通过或 detector `[]` 记为严格关闭；完成后再进入其余 lx-ui、UI-11 正式 Critique 和 Vue3 Element Plus 替换。

## 2026-09-30 UI-10 Wave 5 postfix 复验与交接

- **范围**：复验 `LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 及对应 VitePress 文档，覆盖 portal HUD 主题、Drawer Escape、PageCard 错误恢复和窄屏 API 表格边界。
- **Assessment A**：独立设计评审 **34/40（Good）**，确认 HUD portal、Drawer 默认 Escape、Dialog 首错字段聚焦、PageCard 错误恢复和 375px 表格局部滚动。
- **Assessment B**：源码/文档 detector 均为有效 JSON `[]`，stderr 为空、退出码 0；独立 Playwright 取证覆盖亮色/HUD、桌面/375px、打开/Escape、错误恢复和 API 表格滚动，共 16 张截图及 sidecar，外部请求 0。因 CUA 不可用，报告保留 `DEGRADED` 标记。
- **结论**：实现、行为回归和 A/B 证据已落盘；保留 P2（PageCard Demo 状态开关、窄屏 API 表滚动发现性）与 P3（辅助文字字号）建议。UI-11 全库正式审查和 Vue3 宿主替换门槛仍未关闭。
- **证据**：`.impeccable/critique/wave5-postfix-2026-09-30/assessment-a.md`、`assessment-b/assessment-b.md`、`report.md`、`2026-09-30T07-48-23Z__linkx-fe-src-components-lxdialog-index-vue.md`。
- **下一步**：完成当前波次代码审核并登记剩余建议；随后按 `doc/lx-ui/COMPONENT-AUDIT.md` 进入尚未完成正式 A/B 的树/穿梭/上传/远程分页选择等组件。
- **代码审核**：PageCard 文档 E2E 的 hydration 时序误报已修复并复验 6/6；目标单测、类型、Lint、Prettier、库构建和文档构建通过，详细记录见 `other-admin/admin-vue3/docs/CODE-REVIEW-VALIDATION.md`。

## 2026-09-30 UI-10 Wave 5 浮层与反馈组件收口

- **范围**：`LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 的实现、Demo/API、单测和文档浏览器回归。
- **已完成**：五个组件补齐亮色/HUD、375px 窄屏、焦点可见、加载/错误/空态、禁用和 `prefers-reduced-motion` 状态；Dialog/Drawer 保留受控显隐与 ESC/遮罩规则，PageCard 具名 region 使用 `aria-busy`，FormErrorBanner 提供 assertive alert 语义。
- **验证证据**：定向 Vitest 17/17；文档 Playwright 7/7；lx-ui typecheck、build、docs build 通过；`.impeccable/critique/wave5-2026-09-30/browser-result.json` 为 passed、无外部请求；detector JSON `[]`、stderr 空、退出码 0；Drawer 移动端截图已在过渡完成后重拍并确认 375px 无横向溢出。
- **正式门槛**：独立 Impeccable Assessment A/B、综合报告及 snapshot/trend 尚未全部收口，当前只记“实现与阶段性浏览器证据完成”，不关闭 UI-11。`LxForm/demo/control-bridge.vue` 直接使用 `ElTabs`/`ElTabPane` 的 Element Plus 桥接缺口已登记。
- **下一步**：完成 Wave 5 A/B 隔离评审和综合快照；按建议复验后再更新 UI-10 矩阵，并进入 Vue3 宿主替换与整站审查的依赖核对。

## 2026-09-30 UI-13 表单严格对照复修

- 已修复 `LxDynamicForm` 自适应栅格：自适应模式不再写入会覆盖 container query 的行内 `grid-column`，三列/两列由 CSS 变量按容器断点选择；固定列模式仍保留明确跨列契约。
- 已补公开 `LxTreeSelect`，DynamicForm 的 `tree-select` 字段改用该 Lx 封装；保留 Element Plus 树选择值、级联、懒加载和 `$attrs` 契约，组件内统一 lx-ui 控件样式和减少动效。
- `LxForm` 基础/弹窗 Demo 已改用 `LxInput`、`LxSelect`、`LxTextarea` 与 `LxFormItem`，仅保留 Element Plus 类型导入，不再以 `El*` 作为示例 UI。
- 本轮门禁：`linkx-fe` typecheck、build、build:docs 和修改文件 Prettier 通过；DynamicForm 定向 Vitest 首轮 7 项中 6 项通过，1 项暴露初始值重置契约回归，已修复并待重跑。根级 Vitest 缺 jsdom 属于调用环境问题。
- Impeccable Assessment A 已完成（29/40，见 `.impeccable/critique/form-assessment-a-current-2026-09-30.md`）；Assessment B 正在收尾。detector JSON 为 `[]`、stderr 为空、退出码 0，只表示静态规则零命中，待 B 的浏览器/overlay 证据与 A 综合后才登记正式复验。

## 2026-09-30 UI-13 表单第一波实施记录

- `LxDynamicForm` 已从单文件 `El*` 条件分支改为按 schema `type` 分发的独立字段子组件：input/password、textarea、number、select/remote-select、date/daterange、switch、radio、checkbox、upload、tree-select 各自维护输入和输出。字段层只组合公开 `Lx*` 控件；`tree-select` 已切换到公开 `LxTreeSelect`，后续补独立浏览器状态证据。
- 新增 React/TSX 友好受控 `value` + `change(nextValue)`，同时保留 `modelValue`/`v-model`、`update:modelValue`、`field-change`、具名 slot 和表单实例方法；上传字段默认使用 `LxUpload`，支持单文件/多文件列表回写并兼容旧自定义上传 slot。
- 动态表单布局默认按容器宽度自适应 3/2/1 列；`adaptive=false` 时保留固定 `columns` 兼容路径。单列、双列、三列、通栏、禁用、默认值、联动和重置已补测试/文档。
- 本波验证：`linkx-fe` `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 动态表单及基础控件定向单测 40/40；本地 Mock 文档浏览器检查通过（桌面 3 列、375px 自适应 1 列、HUD、无外部请求）。
- 本波尚未关闭：LxForm 的设计稿逐项浏览器证据、全库 UI-10 设计对照、UI-11 正式 Impeccable 双路 Critique；这些必须在代码审核和复验后继续执行，不能仅由 detector `[]` 或构建通过替代。

## 2026-09-30 续接批次与 DynamicForm 重新规划

- 用户最新指定的主顺序：先严格对照设计重做 `LxForm` 与 `LxDynamicForm`，字段控件通过已有 `Lx*` 基础封装组合，不在表单实现中直接用 `El*` 代替；再逐项严格核对和修正全部 lx-ui 组件；完成库级检查及 Impeccable 复验后，才启动 Vue3 Element Plus 全量替换。AuthImg 的 A/B 作为只读取证先补齐；其 P1/P2 修复和 Vue3 DESIGN §8.6 E2E 放在后续宿主替换波次，避免越过库优先顺序。
- AuthImg 旧 Critique 的目标指纹与当前 `src/components/AuthImg/index.vue` 不一致，因此旧 29/40 快照只能作为历史证据，不可证明当前源码已正式复验。本波新 A/B 尚在进行，不登记正式通过；detector 的 `[]` 单独不构成通过。
- 最新提交 `2a93ef1` 已增加 `LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch`、`LxButton` 等基础封装及文档/Demo/测试；`LxDynamicForm` 尚未接入。UI-13 同时覆盖 `LxForm` 与 `LxDynamicForm` 的设计图逐项核对，优先复用这些公开 `Lx*` 组件；Element Plus 可留在 `Lx*` 实现内部，不得在动态表单 field renderer 中直接以 `El*` 作 UI 实现。缺口须先登记，不复制 Element Plus 源码。
- `LxDynamicForm` 现状是一个 `index.vue` 以大型 `v-if` 链直接渲染 Element Plus 字段，列数由固定 `columns` 控制；`upload` 依赖宿主插槽，没有内建单图/多图列表字段。新实现需由 `type` 映射到独立字段子组件文件；图片单张/多张、预览/列表与移除等字段行为在上传子组件管理，网络请求仍由宿主 adapter 注入。
- DynamicForm 提供受控 `value` + `change(nextValue)` 用法以贴近 React/TSX 传值习惯，同时保留现有 `v-model` / `modelValue` 契约兼容；确定优先级并覆盖双向兼容与重置、校验、默认值、联动、disabled、自定义 slot 的行为测试。布局改按容器可用宽度自适应为 1/2/3 列，不再要求调用方固定列数；保留通栏字段能力并验证 320/375/768px 及窄容器。
- UI-13 验收包括类型、库构建、文档构建、行为测试、成功/空/失败/取消 Mock 状态、键盘/焦点和浏览器响应式证据；API、类型、Demo、中文文档与项目地图同步。组件实施后执行独立代码审核及正式 Impeccable Critique，逐条处理建议并复验，再恢复其他 lx-ui 计划波次。

## 2026-09-29 追加交付记录

- CODE-02 请求基础层补齐：`useFetch` 的 signal 取消、请求序号、可取消调度/重试及 `useTable` 防止旧响应覆盖已通过 9 项定向单测；`v-loadmore` 已改为从 `aria-controls` 定位 Element Plus teleport 下拉，延迟挂载时按需观察，支持更新回调并清理滚动监听和 observer。定向单测合计 12/12，轮播文章实际下拉分页 Mock E2E 1/1。
- 质量门禁：`vue-tsc --noEmit`、相关文件 ESLint/Prettier、`git diff --check` 通过。E2E 使用本地 `mock-preview` 并拦截文章读接口；不代表真实后端联调或所有 `v-loadmore` 宿主均已逐页验收。
- Impeccable 复验门槛：每次看到 detector `[]` 都要核验 JSON、stderr、退出码和目标访问结果；有效的零命中只代表对应源码目标静态规则零命中。没有独立 A/B 评审、浏览器状态/overlay 截图和正式 snapshot 时，仍按“复验未完成”处理，不能凭 `[]` 通过。
- GLM #8 License 失败写入已修复：仅有效成功响应更新 store/localStorage；网络异常、业务失败、无效数据和会话切换均保留当前授权。Vue3 全量单测 36 个文件/186 项通过，类型、定向 ESLint/Prettier 和代码评审通过；详见 `other-admin/admin-vue3/docs/CODE-REVIEW-VALIDATION.md`。
- GLM #9 AuthImg 实现和 Mock 验收完成：站内图片 API 使用 Promise 链、请求头传 Token、拒绝外站/协议相对/反斜杠地址；宿主组件支持失败重试、取消旧请求、忽略迟到响应和清理 ObjectURL，10 个调用点补齐图像语义 `alt`。定向单测 12/12、AuthImg Mock E2E 3/3、类型、Lint、Prettier 均通过；真实后端未联调。
- GLM #9 代码审核未发现本次新增的可复现缺陷。Impeccable 为降级检查：detector JSON `[]`、stderr 空、退出码 0 只证明目标源码静态零命中；两次独立 gpt-6-sol 评审因 HTTP 503 未启动，浏览器注入预检因页面桥只读而失败，因此无 overlay、不计正式 Critique 完成。证据与限制见 `.impeccable/critique/authimg-degraded-review-2026-09-29.md`。
- GLM #10 写操作重复提交：角色删除/启停/保存、第三方应用删除/编辑保存、管理员用户删除/启停锁已实现；定向 Mock E2E 5/5 通过，行级锁覆盖确认至请求完成并由 `.finally()` 释放。代码审核未发现新增可复现问题；Impeccable 正式 Critique 因两个隔离评审模型连续 HTTP 503、浏览器 evaluate 只读而延期，detector `[]` 仅记静态零命中。
- 自动进入 GLM #11 ColForm 远程搜索竞态：API 增加可选 AbortSignal；关键词代次保护列表、页码和 loading，触底分页沿用当前关键词；组织切换、重置、关闭、卸载会取消旧请求。Mock E2E 1/1、`vue-tsc`、定向 ESLint/Prettier 通过，代码审核未发现新增可复现问题。
- GLM #1 lx-ui 全局组件注册：入口使用显式 `Lx*` 名称注册表，插件回归验证 39 个组件可注册且无空名称；lx-ui 类型检查、134 模块构建、VitePress 文档构建及 Vue3 全量 Vitest 39 文件/200 项通过。代码复核未发现本次新增问题；组件库无独立 ESLint，使用 Vue3 ESLint 配置会忽略库文件，因此未记为 ESLint 通过。格式检查以 Vue3 已安装的 Prettier 对本次文件复核。
- GLM #2 Cascader 值类型已修复：值契约与 Element Plus 对齐为 string/number/record object，保留具名接口、混合路径和带 `call`/`Symbol.iterator` 字段的记录对象，不再把值字符串化；Demo、中文说明和 6 项行为单测已同步。ColForm 迟到请求 E2E 现在等待旧 Mock route handler 完成后才断言，整组 E2E 4/4 通过；业务 API 仍使用 `.then().catch().finally()`。
- GLM #9/#10 降级视觉复核已由两个独立 Luna `max` A/B 评估重做：AuthImg 29/40，第三方接入重复提交体验 21/40；两份快照分别为 `.impeccable/critique/2026-09-29T01-10-08Z__admin-admin-vue3-src-components-authimg-index-vue.md` 和 `.impeccable/critique/2026-09-29T01-10-09Z__admin-vue3-src-views-basedata-thirdparty-index-vue.md`。两目标源码 detector 均有效 `[]`、stderr 空、退出码 0；浏览器 mutable injection 和 overlay 均成功，命中主要属于 admin 壳层/滚动容器，没有命中 AuthImg；重复提交页面确认框期间同一行操作被禁用，未发送业务写请求。页面访问、overlay、假阳性、Mock 心跳及视口限制详见两份 A/B 报告和证据目录。
- Luna `max` 代码复核确认 `/authority/adminRole` 角色保存和 `/authority/adminPerson` 的授权/改密/删除/状态写操作仍缺并发锁；它们在用户代码规则下属于真实 P1 风险，但不属于旧 GLM #10 的 `/authority/role`、`/authority/userManage` 与第三方应用范围，单列 CODE-03 待办，不把旧 #10 扩大后误记为已通过。A 报告称第三方接口失败“静默”不成立：HTTP/网络错误由共享拦截器提示；Create 表单一次出现浏览器 autofill 值但未用干净 profile 复现，仍是待核实观察。
- ColForm 竞态 E2E 经 Luna 审查后进一步加固：旧 route 的完成信号只由首条 handler 触发，避免同 URL 新响应误满足；首屏列表请求也等待对应响应完成。`col-form-search-race.spec.ts` 最终复跑 4/4 通过。下一步自动进入 CODE-03 写操作 pending 锁补齐。

## 2026-09-28 追加交付记录

- Element Bridge 最终实体边框方案已完成独立 Impeccable A/B。报告为 `.impeccable/critique/.element-bridge-assessment-a-single-border-final.md`、`.impeccable/critique/.element-bridge-assessment-b-single-border-final.md`，综合 snapshot 为 `.impeccable/critique/2026-09-28T11-54-41Z__linkx-fe-docs-components-element-bridge-md.md`（30/40）。B 有独立页面 overlay、截图、computed style、stderr 和退出码证据。
- 规则固化：detector `[]` 仅表示静态规则零命中；单独出现时必须记为“复验未完成”。只有浏览器状态、overlay/截图、stderr、退出码、A/B 报告和 snapshot 同时存在，才可登记为组件级复验完成。当前仍跟踪 P2 窄屏弹层/焦点重量和 P3 错误文字对比度/选项行高。
- CODE-02 已完成 `useFetch` 可选 AbortSignal、取消失效序号、卸载保护、可取消防抖/节流调度，以及 `useTable` 序号校验后的 onSuccess 提交；台账见 `other-admin/admin-vue3/docs/CODE-REVIEW-VALIDATION.md`。7 项单测、定向 ESLint、vue-tsc 通过。
- CODE-02 边界：尚未接入 signal 的旧 API 只能丢弃迟到结果；License、v-loadmore、提交锁、ColForm 和 AuthImg 进入下一波。业务 API 继续使用 `.then().catch().finally()`。

> 创建时间：2026-09-25  
> 适用范围：Vue2 对照工程、Vue3 重构工程、lx-ui 组件库及其项目文档。  
> 配套交接记录：[PROJECT-HANDOFF.md](./PROJECT-HANDOFF.md)

## 1. 目标和完成定义

本计划用于收敛迁移、权限、组件库和验证方面的未完成事项。任何任务只有在代码、文档和对应验证证据都具备时，才可标记为完成。

每个业务模块分别记录以下五种状态：

1. 源码对照：Vue2 入口、API、权限键、状态值和交互语义已核对。
2. 单测：可观察的业务行为和边界已通过 Vitest。
3. Mock 验收：浏览器通过统一 Mock 验证成功、空结果、失败、取消、重复提交和权限状态。
4. 浏览器 E2E：真实浏览器完成页面、键盘、响应式、按钮和文本权限验收。
5. 真实联调：使用可信后端契约完成联调；没有后端契约时记录阻塞，不得猜测接口。

## 2. 当前基线

| 项目                       | 当前事实                                                                                 | 结论                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Vue3 单测                  | 34 个文件、173 项通过（2026-09-28，本轮复验）                                            | 权限按钮/文本、路由映射、业务 API、请求 composable 及 lx-ui 行为有基础回归，业务矩阵仍待补齐 |
| Vue3 类型检查              | `vue-tsc --noEmit` 通过                                                                  | 可继续实现                                                                                   |
| Vue3 构建                  | 通过，有 Less 变量、导入冲突和 chunk 警告                                                | 需要收敛警告                                                                                 |
| Vue3 ESLint                | 0 个 error、0 个 warning                                                                 | P0 代码质量门禁已通过                                                                        |
| Vue3 E2E                   | 默认套件既有基线 100/101；2026-09-28 全菜单 Mock 预览 2/2、LxPasswordInput 文档 3/3 通过 | 33 个入口的首屏样例、全部菜单目录和北向 CRUD 已复验；默认全量 E2E 波动仍需跟踪               |
| Vue2 unit                  | pnpm 忽略依赖构建脚本导致失败                                                            | 环境/依赖门禁待处理                                                                          |
| lx-ui 类型、构建、文档构建 | 通过，有大 chunk 警告                                                                    | 真实浏览器和宿主接入未完成                                                                   |
| 真实后端联调               | 未执行                                                                                   | 受接口、数据和环境约束                                                                       |
| 工作区                     | 存在大量已有修改、删除和未跟踪文件                                                       | 后续不得重置或覆盖既有改动                                                                   |

## 3. 交付阶段

状态取值：`待开始`、`进行中`、`已完成`、`阻塞`、`延期`。`延期`表示经确认移出当前交付范围，保留恢复条件，不代表实现完成。每完成一个步骤，必须同步更新本表和交接记录。

### P0：恢复权限和发布门禁

| 编号  | 任务                            | 产出                                                      | 验收                                              | 状态                                    |
| ----- | ------------------------------- | --------------------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| P0-01 | 统一迁移和权限状态文档          | 本计划、迁移矩阵、项目地图与进度文档状态一致              | 同一模块五类状态不冲突                            | 已完成                                  |
| P0-02 | 建立权限契约清单                | 菜单 ID、URL、按钮码、文本/字段码、管理员例外清单         | 每个现役页面有来源和负责人                        | 已完成                                  |
| P0-03 | 修正菜单与页面访问链路          | 停用菜单、License、全局开关、OAuth 映射和直接地址行为一致 | 普通用户、管理员、空菜单、失效 License 通过       | 进行中（Mock 矩阵通过，真实联调待执行） |
| P0-04 | 迁移 Vue2 明确按钮权限          | 迁移有旧版权限码来源的现役操作；新增权限扩展另行排期      | 旧版明确权限码保持一致，未授权操作不可见/不可执行 | 已完成（迁移基线）；新增权限扩展延期    |
| P0-05 | 文本/字段权限扩展               | `v-auth`/文本权限和字段脱敏消费                           | 后端字段契约确认后验证无权不泄漏及权限重判        | 延期（新增需求）                        |
| P0-06 | 修复 Vue3 ESLint 错误和构建警告 | 代码质量门禁恢复                                          | ESLint error/warning 为 0；构建警告逐项归因       | 已完成                                  |
| P0-07 | 固定 Playwright 浏览器环境      | 可复现 E2E 运行说明和浏览器版本                           | E2E 能实际启动并有报告                            | 已完成                                  |

### CODE：Vue3 宿主 API Promise 链式风格

| 编号    | 任务                  | 产出                                                                                       | 验收                                                                               | 状态   |
| ------- | --------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------ |
| CODE-01 | 统一业务 API 调用风格 | Vue3 宿主业务 API 与请求编排统一使用 `.then().catch().finally()`；状态清理统一放 `finally` | 全源静态扫描无直接业务 API `await`；请求成功、失败、重试、竞态与状态释放有回归证据 | 已完成 |

CODE-01 已覆盖 Vue3 宿主页面、公共组件、请求 composable、菜单/License 路由初始化、HTTP 401 会话结束、登出会话和 PC 页签配置保存。全源扫描未发现直接业务 API `await`；弹窗结果、表单校验、确认框、`nextTick`、动态导入及按序路由过滤器编排保留本地 `async/await`。`auth-http.test.ts` 覆盖当前会话的 401 等待登出、原请求错误透传和提示门恢复。

### 执行顺序调整（2026-09-26）

根据 Vue3 宿主的 Element Plus / lx-ui 用量盘点，先完成共享组件库和接入层，再集中做受影响页面的深交互验收。Vue3 有 103 个源码文件直接引用 Element Plus，模板使用 46 种 Element Plus 标签；其中有通用 Lx 封装候选的控件只有一部分，若先逐页验收再替换，表单、弹窗、表格、导航和树等相同交互可能需要重复验证。用户再次确认库内前置顺序：`design/` 基础控件与动态图标先完成，随后才完成 `LxDynamicForm`，最后替换 Vue3 页面中的 Element Plus。

| 顺序 | 工作                                                  | 执行要求                                                                                                                                                                             |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | lx-ui 设计基础控件与动态图标：UI-01、UI-06～08、UI-10 | 对照 `design/` 的按钮、表单八件套和其他基础控件，逐项补桥接、状态 Demo、键盘/窄屏/主题/减少动效浏览器证据；动态图标已有库级证据，复核映射即可，不能把部分完成记作整库完成。          |
| 2    | 设计对照重做 `LxForm` / `LxDynamicForm`：UI-13        | 逐项对照 design 参考重做表单；动态 schema 类型分发到独立子组件，仅组合 `Lx*` 控件；新增单/多图列表、受控 `value`/`change` 与 v-model 兼容、容器自适应 1/2/3 列。旧测试留作回归基线。 |
| 3    | 全部 lx-ui 组件严格设计核对及审查：UI-10、UI-11       | 建立全组件→设计源映射，逐项对照状态、尺寸、间距、焦点、主题、动效和窄屏并修正；状态/文档/测试同步。之后完成独立 Impeccable Critique 与建议复验。`[]` 仅表示 detector 零命中。        |
| 4    | Vue3 接入与页面替换：UI-09、UI-04                     | 统一库导出和版本，迁移宿主导入/自动导入/类型/插件/样式/分包，再按组件影响面替换页面；没有专用 Lx 封装的控件从 lx-ui 使用其导出的 Element Plus。                                      |
| 5    | 页面深交互与业务迁移验收：P1、UI-12                   | 在对应组件替换稳定后按 Vue2 契约做业务 Mock/E2E；全量替换后执行 Impeccable 整站审查。已通过且未受影响的测试保留为基线。                                                              |
| 6    | 删除宿主直接依赖并做最终回归                          | 所有源码、类型、自动导入和构建入口不再直接依赖 Element Plus 后，才从 Vue3 package.json 移除 element-plus；随后运行类型、Lint、单测、构建、业务 E2E 和全菜单 Mock 验收。              |

该顺序不改变已完成模块和验证结论。P1-04 已通过的排班 4/4、协同下岗 1/1 继续有效；协同树、记录筛选/导出、批量操作等受共享交互影响的深度 Mock/E2E 排在对应组件替换之后。API 字段映射、二进制响应类型、Vue2 已有菜单/按钮权限和管理员例外属于独立契约，可在组件工作期间继续核对和修复。新权限中心、文本/字段权限及页面引导仍按用户确认范围延期。

当前仍处于第 3 步：`LxActionButtons` 已完成库级 API、行为单测和浏览器验收；`LxMetricCard` 已补独立中文 API/Demo、语义色、LxIcon 趋势箭头和旧宿主 props/slots 兼容，6 项单测与 2 项文档 Playwright 通过；`LxAuthImg` 已补独立 API/Demo、链式 Blob 请求、取消竞态与对象 URL 清理，6 项单测与 3 项文档 Playwright 通过；本轮补齐 `LxPasswordInput` 独立中文 API/Demo 和文档 Playwright 3/3。Vue3 详情抽屉及鉴权图片适配器仍待替换波次回归。整库 Impeccable 审查和 Vue3 Element Plus 替换均未完成；固定顺序保持 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件及 Impeccable 库级审查 → Vue3 替换。

`LxEmpty` 的阶段性启发式评审曾记录初评 28/40、修复后 34/40（无明确 P1/P2），并完成源码 detector 与亮色/HUD 浏览器 overlay 检查；Demo 的按钮令牌、创建结果、空态恢复和筛选往返问题已修正，Playwright 覆盖两主题对比度、结果与焦点。2026-09-27 对照 Impeccable `critique` 规范后确认：`.impeccable/critique` 没有该目标的评审快照/趋势；设计评审 Agent 使用主会话提供的截图而未在自己的新标签检查页面；HUD 状态没有单独重跑 detector。因此 28/40、34/40 和已有 overlay 作为阶段性证据保留，不计作正式 Impeccable Critique 完成。源码 `detect.mjs` 的 `[]` 仍只代表该次静态规则零命中。UI-11 正式审查仍待按规范闭环；Vue3 15 处宿主用法未替换。

### P1：完成业务迁移闭环

| 编号  | 模块                 | 未完成事项                                                           | 验收证据                                           | 状态                                                           |
| ----- | -------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| P1-01 | 角色与人员           | 新增角色已有成员读取、回显和安全提交工作流                           | 后端契约、单测、Mock、E2E、联调                    | 延期（Vue2 无已实现读取契约）                                  |
| P1-02 | 权限中心             | Vue2 既有菜单/按钮权限和管理员例外已迁移；新增权限中心工作流另行排期 | 现有权限矩阵与树失败恢复保留；新流程按恢复条件验收 | 已完成（迁移基线）；新增工作流延期                             |
| P1-03 | 基础数据             | 导入导出、地图文件、布局配置和失败恢复                               | 业务 Mock/E2E                                      | 已完成                                                         |
| P1-04 | 协同岗与排班         | 组织树、上下岗、日历、导入导出、批量操作                             | 业务 Mock/E2E                                      | 进行中（排班 4/4；协同下岗 1/1；其余深交互验收待 UI 替换波次） |
| P1-05 | 预警、节点、三方对接 | 查询、保存、上传、拒绝、重试、权限                                   | 业务 Mock/E2E                                      | 待开始                                                         |
| P1-06 | AI、虚拟用户、归档   | 绑定回显、分类持久化、导入、下载和权限                               | 业务 Mock/E2E                                      | 待开始                                                         |
| P1-07 | 真实后端联调         | License、心跳、权限、文件、设备、AI、角色成员                        | 联调记录和问题单                                   | 待开始                                                         |
| P1-08 | H5 群组标签          | `/collaboration/v1/tags/*` 列表、详情、新增、编辑、单删和批删已迁移  | API 契约单测；列表、弹窗、失败恢复和权限 Mock/E2E  | 进行中                                                         |
| P1-09 | 管理员账号契约确认   | `adminPerson` 页面使用的用户 API、状态更新和权限域与后端确认         | 后端契约、API 单测、Mock/E2E、真实联调             | 阻塞                                                           |

#### P1-04 当前证据（排班）

- 已对照 Vue2 排班类型和排班信息的入口、字段与 API；类型 CRUD 保留内置 `type=0` 不可删除规则，值班信息覆盖筛选、日历、导入、模板下载和批量删除。
- `shift-scheduling-workflow.spec.ts`：4/4 Mock E2E 通过，覆盖类型 CRUD/内置类型保护/删除失败重试、列表条件查询、日历查询失败恢复与键盘切月、导入错误纯文本展示、模板文件名及批量删除失败重试。所有后端请求由 Playwright Mock 拦截。
- 修复日历组件挂载时序导致切换视图不发请求、模板下载误用普通二进制 `get`、批量删除失败静默和导入错误 HTML 渲染等问题；API 调用保持 Promise 链风格。
- `collaboration-workflow.spec.ts`：1/1 Mock E2E 通过，覆盖最后一人在岗确认、下岗失败重试及 `switchType=3` 请求载荷；没有新增权限码。
- 未完成：协同岗组织树、层级/职能树挂靠、记录筛选与导出、批量删除等 Mock/E2E；这些深交互验收排在相应 lx-ui 搜索、树、表格替换之后，API/字段契约核查可并行；真实后端联调按 P1-07 跟踪。本次未重跑默认全量 E2E 套件。

### 经用户确认的延期范围（2026-09-26）

| 项目                        | 当前事实                                                                          | 当前处理                                                 | 恢复条件                                           |
| --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| 新增细粒度按钮/权限中心能力 | Vue2 现役页面中有明确来源的按钮码已迁移；其余扩展无完整旧版或后端契约             | 不新增权限码、不扩展页面权限；保留已实现的兼容逻辑与测试 | 产品明确当前版本范围，并提供可信权限码/API 契约    |
| 文本/字段权限               | Vue2 当前页面没有字段权限消费，后端未提供字段码或脱敏字段契约                     | 保留权限框架，不给业务字段套用新权限规则                 | 提供字段到权限码的映射、无权展示规则和账号切换要求 |
| 角色成员新工作流            | Vue2 对应读取仍为 TODO/空 Mock                                                    | 角色成员回显、绑定、解绑及依赖它的新权限中心流程延期     | 提供真实读取/写入契约与验收账号                    |
| 页面引导系统                | 当前 Vue2/Vue3 运行代码未发现引导注册表或 driver.js 流程；现有文档是需求/文案草案 | 暂不接入 driver.js、Navbar 重播按钮或逐页引导锚点        | 产品确认页面范围、文案、首次触发和版本升级规则     |

以上延期不影响 Vue2 已有菜单过滤、明确按钮权限码、管理员例外和直接地址保护的迁移与回归；延期项不得在交付报告中标记为完成。

### P1/P2：lx-ui 接入和设计落实

| 编号  | 任务                   | 产出                                                                                  | 验收                                                          | 状态                                                                                                                                                                                        |
| ----- | ---------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01 | Element Plus 样式桥接  | 对照 `design/` 完成 button、表单八件套、tabs、card、tree、descriptions 等基础控件桥接 | 状态 Demo、设计令牌及浏览器窄屏、焦点、明暗主题、减少动效检查 | 已完成（桥接页桌面、HUD 深色、375px 验收通过；正式库级 Impeccable 汇总审查列入 UI-11）                                                                                                      |
| UI-02 | 新组件独立文档和 Demo  | 每组件 API、事件、插槽、exposes、空/错/禁用/主题/键盘示例                             | 文档构建和浏览器验收                                          | 进行中（已独立文档的组件清单新增 LxPasswordInput；本轮完成其 Props/events/exposes、内存状态 Demo、导航入口和文档构建；仍有其他候选待逐项核查）                                              |
| UI-03 | 组件行为测试           | 远程选择、上传、虚拟树、穿梭、动态表单、检索等测试                                    | 关键边界通过                                                  | 进行中（本轮 `LxPasswordInput` 文档 Playwright 3/3 覆盖显隐/清空、焦点/选中、剪贴板阻止、禁用/只读、375px/HUD；Vue3 全量 Vitest 34 文件/173 项、全菜单 Mock 预览 2/2 通过；其他候选仍待补） |
| UI-04 | 宿主页面接入           | 将设计组件与 LxIcon 按共享组件/页面波次接入 Vue3，保留旧契约                          | 页面业务 Mock/E2E；全部迁移后审查全站页面                     | 进行中（首批适配器和图标已接入；批量替换等待 UI-10 组件闭环及 UI-11 Impeccable 库级审查完成）                                                                                               |
| UI-05 | 登录页设计对照与实现   | 对照 `doc/登录1/` 与 `doc/登录2/`，选定整合方案并落到现有登录页                       | OAuth、记住账号、密码过期/修改、License 提示、键盘和窄屏验收  | 已完成                                                                                                                                                                                      |
| UI-06 | 图标规范归并           | 对照 LxIcon P0、P1 与 29 枚三套资源，整理交集、命名和覆盖矩阵                         | 形成唯一图标清单与动效映射，保留现有接口值                    | 已完成                                                                                                                                                                                      |
| UI-07 | LxIcon P0 核心动效     | 按核心集规范实现 hover/focus 微动效及 Demo、测试                                      | 构建、文档和浏览器通过；支持减少动效                          | 已完成                                                                                                                                                                                      |
| UI-08 | LxIcon P1 与 29 枚扩展 | 完成扩展图标、组件文档、Demo 和宿主接入评估                                           | 无缺项/重名冲突；键盘、触屏、窄屏与减少动效通过               | 已完成                                                                                                                                                                                      |

#### UI-01 表单控件焦点边线对齐复验（2026-09-28）

- 设计依据：`design/表单控件八件套/code.html` 的焦点样例使用控件自身主色边线与 2px、15% 主色光晕；错误样例使用红色边线。焦点环不能再叠加 Element Plus 默认带间隔的 outline。
- 实现规则：输入框、选择框和文本域在控件边界内绘制 1px 状态边线，外侧使用紧邻的 2px 淡色主色光晕；错误态保留红色边线，焦点光晕仍用主色以区分校验错误和键盘位置。根选择器覆盖 Element Plus 延后注入的控件规则；不改表单值、校验和提交时机。
- 验收范围：文档 Playwright 检查输入、选择、文本域及错误态，确认无 outline/outline-offset，焦点前后控件尺寸一致；LxForm 文档测试检查 1440px 双列和 390/320px 单列布局、校验、键盘顺序。当前定向两文件共 3/3 通过。
- 历史 Critique：早期输入/选择/文本域光晕方案的单目标双路复核为 35/40，快照记录 A 的 1280×900/375×844 实测与 B 的静态 `[]`/五状态 overlay 截图；B 的原始 console 明细未保留。该分数对应前一版样式，不代表当前多选 inset 方案。快照：`.impeccable/critique/2026-09-28T02-28-51Z__linkx-fe-src-components-lxform-style-css.md`。
- 后续边界：此项关闭基础控件焦点样式遗漏；Vue3 业务表单契约仍按 UI-04 逐页迁移。整库 UI-11 仍依赖 UI-10 所有候选闭环，`#c45656` 错误文案/`#c9cdd4` placeholder 对比度问题须在后续可访问性工作中单独核查和修正。

#### UI-01 复选框焦点边线对齐修正（2026-09-28）

- 用户反馈：复选框焦点外圈仍与自身方框边线不协调。
- 调整：保留 14px 方框和 1px 自身状态边线，焦点时在边界外零间隙显示设计令牌定义的 2px 浅色主色光晕；不使用偏移 outline，不改变方框尺寸及选中勾号/半选横线颜色。Demo 增加由子选项计算的“全选通知渠道”，真实展示半选与全选状态。
- 验证：定向 Playwright 覆盖未选中、已选中、真实半选、HUD 深色焦点；断言状态边线、2px 外圈、无 outline 和尺寸稳定。构建和文档验证结果见本轮交接记录。
- 边界：只修复基础控件桥接中的复选框键盘焦点样式；不代表整库 UI-11 Impeccable 正式审查或 Vue3 表单替换完成。

- 用户复核指出：多选下拉原焦点态仍像内边线与外扩光晕的双轮廓，且视觉位置不够贴合控件边界。
- 修复：Element Plus 没有稳定区分单选/多选模式的根类，因此共用一条 2px 轮廓线；使用 `outline-offset: -1px` 使线中心落在控件边界上，并关闭下拉 `box-shadow`，避免阴影和轮廓叠加或在状态过渡时残留。错误焦点轮廓改用红色。轮廓不参与布局，选择行为和 32px 控件尺寸不变；输入、数字、日期和文本域仍沿用既有光晕。
- 回归：`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过。检查单选/多选、焦点颜色、2px 轮廓、`outline-offset`、关闭 box-shadow、错误红色、HUD 主题、375px 和尺寸稳定；截图证据见 `.impeccable/critique/evidence-2026-09-28/select-final-*.png`。
- 构建与格式：`pnpm typecheck`、`pnpm build`（134 模块）、`pnpm build:docs`、定向 Prettier、ESLint 与 `git diff --check` 均通过；文档构建提示既有 chunk 超 500kB。
- Impeccable：修复后隔离 Assessment A/B 与综合快照正在完成。修复前的 Assessment A/B 不作为本次新方案的验收证据；静态 detector `[]` 也不单独视为视觉通过。正式复核后回填分数、overlay 归属、截图及趋势；整库 UI-11 仍待 UI-10 闭环。
- 范围：本次关闭基础桥接页单选/多选下拉外圈对齐问题，不代表 Vue3 业务表单替换或整库 UI-11 完成。

#### UI-01 多选下拉外圈贴边与错误态对比度再修（2026-09-28）

- 用户复核后继续收紧对齐标准：上一版 `outline-offset: -1px` 将 2px 线条中心置于控件边界，线条仍跨出控件外缘，视觉上保留外框感。
- 调整：单选/多选统一将 2px 焦点线完全收在控件边界内，`outline-offset: -2px` 使外侧边缘与控件边界重合；错误态改用 `--lx-color-error-strong`，避免浅红底上的错误焦点线对比度不足。选择行为和 32px 高度不变。
- 验收：重新运行定向 Element Bridge Playwright，覆盖桌面/375px、浅色/HUD、普通/错误焦点，检查轮廓偏移、颜色、无阴影、控件尺寸和页面溢出；保存无 overlay 焦点截图，并由新一轮双路 Impeccable 评审复核。
- 独立评审记录上一版还发现错误菜单打开时与提示文案约 2px 交叠，以及错误节点没有持久 `aria-describedby` 关联；两者列入后续可访问性/布局任务，不混入本次外圈修正。整库 UI-11 和 Vue3 页面替换继续按既定顺序跟踪。

#### UI-01 多选下拉改为自身焦点边线（2026-09-28）

- 用户再次指出：把 2px `outline` 收至 `-2px` 后，外圈仍不符合实际视觉预期。即使两路浏览器评审没有在采样截图复现双框，也以用户当前看到的错位感为准继续修正。
- 调整：单选/多选聚焦时直接以单一 2px inset `box-shadow` 替换 Element Plus 原有 1px 内侧边线；错误聚焦使用 `--lx-color-error-strong`。清除 `outline`，边线外沿沿用控件原有圆角和边界；该状态不参与过渡，不改变 32px 尺寸或选择行为。
- 回归：`tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过，检查普通/错误状态、浅色/HUD、桌面/375px、单选/多选仅有一层内嵌边线、outline 关闭和焦点前后尺寸稳定。
- 质量门禁：lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs`、Vue3 定向 ESLint、涉及文件 Prettier 与 `git diff --check` 均通过。文档构建仍有既有大 chunk 警告，pnpm 提示仓库 `onlyBuiltDependencies` 配置字段位置已变化。
- 浏览器与独立评审：本地预览 `http://127.0.0.1:4174/components/element-bridge.html?focus-check=20260928` 保持运行。A/B 已用最终 inset 样式在浅色/HUD、普通/模拟错误、桌面/375px 八种组合检查；焦点线单一贴边、尺寸稳定，桌面 `287×32px`、375px `301×32px`。A 记录和截图位于 `.impeccable/critique/.element-bridge-assessment-a-inset-border.md` 与 `.impeccable/critique/evidence-2026-09-28/assessment-a-inset-border/`；B 记录位于 `.impeccable/critique/.element-bridge-assessment-b-inset-shadow.md`，detector `[]` 只代表静态规则零命中，八态 overlay 证据位于 `.impeccable/critique/evidence-2026-09-28/assessment-b-inset-shadow/`。错误态为隔离浏览器模拟，不代表 Demo 增加了多选校验。
- Critique 与趋势：最终 inset 方案评分 28/40，P0/P1 均为 0；正式快照 `.impeccable/critique/2026-09-28T08-02-17Z__linkx-fe-src-components-lxform-style-css.md` 已保存。趋势保留早期光晕方案 35/40 与本次 inset 方案 28/40 两项不同范围的评审。独立评审发现的窄屏弹层遮挡字段标签、模拟错误态文字对比度约 3.93:1、选项行高 34px（设计参考 32px）转列为后续布局/可访问性工作，不影响本次焦点线修正结论。
- 文档同步：桥接页说明、lx-ui Delivery Check/Roadmap、项目地图、总计划和交接记录均已同步为控件自身 inset 边线规则及本次正式 Critique 结果。
- 后续：错误提示文案对比度、展开菜单与错误提示间距、错误消息持久 `aria-describedby`、窄屏弹层遮挡字段标签及选项行高仍需后续布局/可访问性处理；Vue3 表单适配及整库 UI-11 仍按原顺序跟踪。

#### UI-01 多选下拉聚焦边界再次修正（2026-09-28）

- 用户复核指出：上一版 2px inset 虽然未越出控件边界，但边线加粗后仍像另一圈焦点框。
- 调整：单选/多选统一改用自身 1px 实体边框，普通、悬停、聚焦和错误状态只更换边框颜色；关闭 Select 的 shadow/outline。为保持 32px 基线和原内容起点，固定 `border-box` 并将内边距从 `4px 12px` 调整为 `3px 11px`。
- 浏览器复验：VitePress 4174 的 Element Bridge 页在真实浏览器键盘聚焦；边框计算样式为 1px solid 主色、无 shadow，控件仍为 32px；浅色截图检查了已选标签和展开选项。
- 自动验证：Element Bridge Playwright、lx-ui 类型/构建/文档构建、定向 ESLint/Prettier 和 Impeccable detector 正在复跑，结果完成后补记。
- 边界：上一版 28/40 Critique 快照对应 inset 样式，不作为新边框方案的评审结论；快照发现的窄屏标签遮挡、错误文字对比度和选项行高继续跟踪。Vue3 业务宿主表单替换及整库 UI-11 仍未完成。

#### UI-01 多选下拉焦点光晕按设计稿复修（2026-09-28）

- 反馈与取证：用户指出多选下拉外圈仍有问题。真实浏览器显示控件只有 1px 主色边框且没有外圈；对照 `design/表单控件八件套/code.html` 确认设计稿聚焦态要求主色边框加紧贴外缘的 2px、15% 主色光晕。
- 调整：单选与多选统一使用 1px `border-box` 实体边框和贴边 2px 光晕；共享光晕令牌从 24% 修正为设计稿的 15%。错误下拉保留高对比红边，焦点提示仍显示同一主色光晕。没有 `outline`，32px 高度、标签位置和选择行为保持不变；减少动效继续由全局媒体规则处理。
- 自动回归：Element Bridge Playwright 1/1 通过，使用键盘回车展开多选，并覆盖单选/多选普通与错误态、浅色/HUD、375px 和焦点尺寸稳定；lx-ui 类型/构建、VitePress 文档构建和定向 lint/format 结果在完成后补记。
- Impeccable：旧 28/40 快照对应 inset 版本，1px 无 halo 版本没有当前有效快照；本轮按两个独立评估复核，报告、overlay 截图和趋势在完成后回填。`detect.mjs` 的 `[]` 只记录静态规则零命中，不独立代表视觉通过。
- 后续：窄屏菜单与字段标签遮挡、错误提示对比度、选项行高及持久 `aria-describedby` 按独立可访问性/布局事项跟踪；Vue3 表单替换和整库 UI-11 继续按计划推进。

#### UI-01 多选下拉外圈单边框最终修正（2026-09-28）

- 用户复核：15% 外扩 halo 在真实页面仍读作与控件边框分离的第二圈，因此继续按用户实际观感收敛。
- 样式：单选/多选下拉共用控件自身 1px `border-box` 边框；普通焦点只切换为主色，错误焦点只显示错误色；移除下拉的外扩 `box-shadow` 和 `outline`。保持 32px 高度、选择交互和标签起点不变。这里有意覆盖设计稿静态示例里的 2px/15% select halo；文本、日期、数字、文本域及复选框样式不变。
- 回归：`tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过，覆盖键盘聚焦/展开/关闭、普通与错误态、单选/多选、浅色/HUD、桌面/375px、边框颜色、无额外阴影及尺寸稳定。lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`，Vue3 E2E 定向 ESLint、全文件 Prettier 检查及 `git diff --check` 通过；文档构建有既有大 chunk 警告。Stylelint 因环境缺少 `postcss-less` 未能运行。
- Impeccable：按双路隔离评审完成，A 评分 29/40（Good），B 对目标 Markdown 的 detector 输出 `[]`/stderr 空/exit 0；四个新标签页 overlay 视图计数为桌面浅色 7、桌面 HUD 175、375px 浅色错误 7、375px HUD 错误 173。HUD 高计数主要是主题颜色规则，其他多为 VitePress 外壳命中；真实相关命中是错误文案对比度约 4.4:1。焦点边框规则未命中 detector。完整截图矩阵和实际归属见 A/B 独立报告及本目标正式快照/趋势；headless 评审没有把 overlay 注入用户可见标签页。
- 后续：窄屏弹层遮挡字段标签、错误提示对比度、选项行高及错误消息 `aria-describedby` 独立跟踪；Vue3 表单替换仍属于 UI-04。此组件级 Critique 不关闭 UI-11 整库审查。

#### UI-01 多选下拉外圈按用户实览再次收敛（2026-09-28）

- 反馈：用户在 4174 预览中继续指出多选外圈不协调。实际页面显示 1px 主色边框外叠有 2px、15% 光晕，虽然间距为零，仍被看作第二道轮廓。
- 调整：单选和多选下拉统一只通过自身 1px `border-box` 边框表达焦点；移除多选标签状态的 `:has()` 外扩阴影以及 LxForm 错误态的重复焦点阴影。普通态为主题主色，错误态沿用高对比错误色；不绘制下拉 `box-shadow`/`outline`，不改变 32px 控件尺寸、内容起点或选择行为。该取舍按用户实览优先于静态设计稿示例中的 halo。
- 验证：Element Bridge Playwright 1/1 通过，覆盖单选/多选、浅色/HUD、普通/错误、键盘开合、桌面/375px 和尺寸稳定；4174 浏览器计算样式为 `1px solid rgb(0, 96, 169)`、`box-shadow: none`、`outline: none`，桌面控件 `319×32px`；lx-ui 类型检查、134 模块构建、VitePress 文档构建、定向 ESLint/Prettier 和 `git diff --check` 通过。文档构建仅有既有大 chunk 警告。
- Impeccable：针对本次最终样式的 Assessment A/B 正在隔离复核；综合结果、截图矩阵、detector 输出及正式快照在两路结果完成后补入交接记录。本次调整不等同于 UI-11 整库审查。
- 后续边界：窄屏弹层遮挡字段标签、浅色错误提示对比度和选项行高仍为独立布局/可访问性事项；Vue3 业务表单替换仍属于 UI-04。

### UI-09：Vue3 宿主 Element Plus 依赖归并

| 范围          | 当前证据                                                                                                                                     | 结论                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Vue3 直接依赖 | 103 个 Vue3 源文件直接从 element-plus 导入组件、服务、类型或子路径；main.ts、App.vue、Vite 自动导入和全局样式也直接依赖                      | 不能只从 package.json 删除一行                                            |
| lx-ui 能力    | linkx-fe 将 element-plus 声明为自身依赖，入口 export * from element-plus，并有专用的表单、弹窗、表格、分页、空态、描述、上传、标签和状态封装 | 可把宿主直接依赖收敛到 lx-ui；Element Plus 仍作为 lx-ui 的传递依赖存在    |
| 控件映射      | 46 种标签：13 种存在较直接的 lx-ui 封装候选，8 种只有特定场景封装，25 种没有 Lx 通用封装；完整标签和次数见 Vue3 Element Plus / lx-ui 清单    | 缺少 Lx 封装的控件可从 lx-ui 导出的 Element Plus 使用，不需要复制组件源码 |
| 版本边界      | 当前安装树中 Vue3 宿主 Element Plus 为 2.14.2，lx-ui 为 2.14.6                                                                               | 迁移时要统一解析和类型来源并回归，不预设版本变化无影响                    |

严格按用户确认顺序执行：先按 `design/` 完成 lx-ui 基础控件桥接与状态/浏览器验收，并复核 `doc/LxIcon*` 动态图标的库级证据；再按现行 UI-13 重新完成 `LxDynamicForm`；随后补齐其他待替换组件，使用 Impeccable 审查组件与动效、吸收建议并复验。只有组件库闭环和审查通过后，才进入 Vue3 Element Plus 替换。替换阶段先统一组件、服务、类型和 locale 导入，使其从 lx-ui 公共入口解析，并迁移自动导入、组件类型生成、全局插件、样式和 Vite 分包；接着按共享组件影响面替换 Vue3 适配器和页面中的设计组件与图标，每一波只回归受影响页面，稳定后补该业务模块深交互 Mock/E2E。全部替换后执行 Impeccable 全站审查；所有直接引用迁移后才移除 Vue3 package.json 的直接依赖并更新锁文件。Element Plus 继续由 lx-ui 提供。移除宿主直依赖不等于减少运行时组件或 bundle 体积；当前应用仍整体安装 Element Plus 插件，体积优化须另立验收。

`design/` 是组件视觉和交互的当前来源，压缩包/旧版目录仅作历史参考；`doc/LxIcon*` 是动态图标清单来源。必须分别记录设计稿、lx-ui 实现、Vue3 宿主采用位置和验证证据，库中已有组件不代表宿主已采用。`@element-plus/icons-vue` 的独立依赖在 Vue3 图标迁移波次中另行清点，只有源码已无直接引用且缺失图形有明确处理后才可删除。

| 编号  | 任务                                 | 产出与完成定义                                                                                                                                                                                                                                                                | 状态                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-10 | 设计资产到 lx-ui 闭环                | 建立全量 `design/` 组件与 `doc/LxIcon*` 到 `Lx*` 实现、令牌、Demo、行为测试的映射；严格对照设计修正所有组件并区分库完成与宿主采用                                                                                                                                             | 进行中（上一提交新增多种 Lx 基础封装并有对应 Demo/API；两种 Form 和所有组件尚待完整逐项设计对照，部分宿主/状态证据仍待补）                                                                                                                                                                                                                                                                                                                                                 |
| UI-11 | lx-ui Impeccable 审查                | lx-ui 组件实现和 Demo 完成后，按 skill 双路独立评审，记录启发式评分、静态 detector、逐主题/状态的浏览器 overlay、误报、修复复验，并保存 `.impeccable/critique` 快照/趋势；核对 JSON、stderr、退出码，非 0 即扫描失败，stdout 的 `[]` 不能覆盖失败状态                         | 进行中（LxEmpty 已有阶段性人工评审 34/40、静态扫描和 overlay，但缺正式快照，且设计评审未使用独立新标签、HUD detector 未复扫；不计正式完成。此前 CLI URL 扫描曾因缺 Puppeteer 失败；本轮新标签确认 lxicons 文档页可访问，但可用 CUA 执行接口为只读，未注入 overlay，也未生成评分/快照；若正式评审时仍无注入能力，按 skill 记录浏览器 fallback。LxIcon/LxUpload 动效预检建议已吸收；LxSidebar/SplitLayout 视觉与动效正式审查待 UI-10 闭环；正式整库审查依赖 UI-10 组件闭环） |
| UI-12 | Vue3 整站 Impeccable 审查            | Vue3 组件与图标迁移稳定后，对全菜单页面分批检查视觉一致性、动效、窄屏、键盘和状态；修复后记录页面范围及证据                                                                                                                                                                   | 待开始（依赖 UI-04、UI-09）                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| UI-13 | LxForm 与 LxDynamicForm 设计对照重做 | 对照表单设计逐项核验；动态表单每类 schema `type` 由独立子组件文件渲染且只组合 `Lx*` 控件；上传支持单图/多图列表；使用 React/TSX 友好的受控 `value` + `change(nextValue)` 并兼容原 `v-model`；按容器宽度自适应 1/2/3 列；保留校验、默认值、联动、disabled、slot 和通栏字段契约 | DynamicForm/DatePicker/Upload 组件实现、89 项单测、43 项文档 E2E、类型/构建/代码复审和正式 A/B 已完成；实现与测试提交 `a2ba943`。A 为 30/40，snapshot 已保存，trend 目前只有本次首次记录。fallback UID 回灌后公开 `abort()` 的组合测试、`LxForm` 设计图逐项对照、真实上传联调和 UI-10 严格矩阵关闭仍未完成                                                                                                                                                                 |

#### LxSelectPagination 设计闭环（2026-09-27）

- 设计依据：`design/远程分页下拉 SelectPagination/` 要求 300ms 防抖远程搜索、触底追加分页、独立 `targetMap` 跨页标签缓存、最多平铺 2 个多选标签及完整提示。
- 完成内容：`LxSelectPagination` 新增独立中文 API 文档和状态 Demo；公开 `remoteMethod(keyword, page, options)` 与原 `api(params)` 两种请求入口，支持 `targetMap` 与兼容 `valueMap`、标签格式化函数、`hasMore`、AbortSignal 和 250–400ms 防抖范围。切换查询和卸载会取消/失效旧请求，取消不提示失败；选中元数据只保留当前已选项。业务 API 请求使用 `.then().catch().finally()`。
- 浏览器验收：文档 Playwright 3/3，覆盖跨页标签回显、选择后搜索保持值、远程失败重试、空结果、375px 弹层边界、请求取消、Escape 关闭及实测 44px 以上分页按钮。Demo 仅使用内存 Mock。
- 验证：lx-ui `pnpm typecheck` 通过；Vue3 Vitest 22 个文件/107 项通过；Impeccable detector 对组件、Demo 和独立文档返回 `[]`。组件构建、文档构建、定向 ESLint/Prettier 将在最终文档同步后复核；正式 UI-11 整库审查仍待 UI-10 闭环。
- 边界：Vue3 业务页面尚未实际采用 `LxSelectPagination`。人员/部门选择场景后续替换时仍需按 Vue2 契约验收旧值回显、跨页/取消语义；不把库级 Demo 记作宿主业务完成。
- 下一步：继续补 `LxUpload`、`LxDescriptions`、StatusSwitch 及树/穿梭等 Vue3 替换候选的行为和浏览器证据；组件库闭环后进行正式 Impeccable 审查，再进入 Vue3 Element Plus 替换波次。

#### LxDialog 定向验收（2026-09-27）

- 问题与处理：Impeccable 源码检测器未报告规则项；定向技术审查发现固定 672px 在窄屏可能溢出、关闭按钮触屏尺寸不足及自定义按钮没有明确焦点环。组件现限制最大宽度为视口减 32px，移动按钮/表单控件使用 44px 目标，增加键盘焦点环并显式降级 hover 过渡。
- 验证：Vue3 `tests/unit/lx-dialog.test.ts` 4 项、全量 Vitest 22 个文件/107 项、Dialog 文档 Playwright 3/3（包括 375px 视口/无横向溢出/单列表单/触屏尺寸、标题可访问名称、减少动效、校验失败/成功提交、ESC 和自定义 footer）；lx-ui 类型检查、库构建和文档构建通过。浏览器数据仅为文档 Demo 内存 Mock。
- 边界：此为 Dialog 定向 Impeccable 审查，不代表 UI-11 整库审查完成；其他高频组件的文档、行为与浏览器证据仍待补，Vue3 页面替换保持未开始且继续排在 UI-10/UI-11 之后。

#### LxProTable 定向验收（2026-09-27）

- 问题与处理：浏览器实测发现跨页选择计数保留但返回原页的复选框未选中；根因是受控同步清空 Element Plus 内部选择后只恢复当前页记录。现缓存仍被选中的行对象并在数据页变化后统一恢复。另为表格区域补充 `aria-busy`/读屏加载状态、减少动效降级、可聚焦方向键滚动和 44px 复选点按范围。
- 文档与 Demo：独立 API 文档列出完整 Props、列配置、事件、默认/empty 插槽和 exposes；Demo 覆盖本地成功/加载/空/失败恢复、行点击/排序反馈、跨页选择/清空及 HUD 深色切换。主题离开时恢复进入前的 html class。
- 验证：lx-ui `pnpm typecheck` 和 Vue3 `vue-tsc --noEmit` 通过；`tests/e2e/lx-pro-table-docs.spec.ts` 4/4 通过，覆盖跨页选择/清空、加载与减少动效、空/错恢复/排序、375px 无页面横向溢出/局部滚动/方向键/44px 点按、HUD 深色表头令牌。定向 ESLint、Prettier 和 `git diff --check` 通过。组件库构建与文档构建将在本步骤文档同步后复核。
- 边界：这是 ProTable 定向交互验收，不代表 UI-11 整库 Impeccable 审查或 Vue3 业务页面替换完成。无真实后端请求；权限脱敏仍受宿主权限源契约约束。

#### LxUpload 设计闭环（2026-09-27）

- 设计依据：`design/上传拖拽区 Upload/` 的拖拽区、文件列表、状态、进度与窄屏交互要求；组件只提供展示和通用上传交互，由宿主注入网络适配器。
- 完成内容：补齐进度与可读状态、错误保留/重试、取消、文件校验、标准行/紧凑列表、`drag` 兼容属性及中文 API/Demo。默认手动提交；缺少 `action` 和 `httpRequest` 时阻止提交。`chunkSize` 只传给宿主适配器作为配置提示，组件不实现分片协议。
- 浏览器验收：独立文档 Playwright 3/3，覆盖 Mock 上传进度与成功、失败重试、上传取消、格式校验、禁用、375px 触屏、HUD 深色及减少动效；全量 lx-ui 文档 Playwright 14/14 通过。示例使用内存 Mock，不发送后端请求。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 Vitest 23 个文件/111 项、`pnpm lint:ts` 通过。全量 Playwright 首轮暴露进度断言依赖瞬时 20% 值的问题，现改为验证有效中间百分比，复跑 14/14 通过。定向 Prettier、ESLint 和 `git diff --check` 在文档同步后复核。
- 边界：不代表 Vue3 地图、图标或 Excel 上传业务页已迁移，也不代表真实上传协议/鉴权/分片联调完成；本组件专项 Impeccable 及 UI-11 整库审查仍未完成。
- 下一步：继续补 `LxStatusSwitch`、`LxTransferPanel` 和树/穿梭等宿主候选的契约、Demo、行为与浏览器证据；组件闭环后先完成 Impeccable 整库审查与复验，再进入 Vue3 Element Plus 替换。继续遵守 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及库级审查 → Vue3 替换。

#### LxDescriptions 设计闭环（2026-09-27）

- 设计依据：`design/详情描述行 Descriptions/` 的紧凑详情行、标签和值层级、响应式布局与只读信息呈现；保留既有 Props、插槽和字段脱敏契约。
- 完成内容：补齐 32px 行高、布局和标签宽度控制、可复制字段、状态点及中文 API/Demo；浅色和 HUD 深色辅助文字统一使用正文令牌，复制按钮具备字段和值组成的可访问名称，窄屏限制描述网格宽度并尊重减少动效偏好。
- Impeccable 定向检查：评分 19/20，源码 detector 返回 `[]`；按检查建议修正主题对比度、复制按钮名称、窄屏布局和减少动效状态。该分数只代表 LxDescriptions 定向检查，不代表 UI-11 整库审查完成。
- 验证：`tests/unit/lx-descriptions.test.ts` 6 项；`tests/e2e/lx-descriptions-docs.spec.ts` 3/3，覆盖复制键盘焦点和状态、32px 行高、375px 单列、320px/480px 抽屉边界、主题与减少动效、宿主加载/空/错误恢复；lx-ui 类型检查、构建和文档构建通过；文档站 Playwright 全量 17/17 通过。示例数据保留在浏览器内存。
- 边界：Vue3 业务详情页尚未采用 `LxDescriptions`，真实业务组合和后端联调仍属于后续替换波次；不得将组件库 Demo 验收记为宿主替换完成。
- 下一步：验收 `LxStatusSwitch`、`LxTransferPanel` 及其余实际宿主候选；UI-10 完成后执行 Impeccable 整库组件/动效审查并吸收建议、复验，之后才启动 Vue3 Element Plus 批量替换。

主要设计来源映射见 `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`。未来 Vue2 页面迁入 Vue3 时直接按此映射复用 lx-ui；Vue2 原运行时代码不跨 Vue 大版本直接导入 lx-ui。

完成门槛：Vue3 源码和生成类型不再从 element-plus 包名导入；locale、树/表单实例类型等深层 API 有 lx-ui 出口；构建能在 pnpm 严格依赖解析下完成；宿主只通过 lx-ui 间接获得 Element Plus；单测、类型检查、Lint、构建、默认与全菜单 Mock E2E、浏览器外观/键盘检查均通过。当前状态：用量盘点完成；lx-ui 组件行为浏览器验收及宿主接入迁移仍未完成，UI-09 已提升到业务深交互验收之前执行。

### DEV：本地验收工具

| 编号   | 任务                   | 产出                                                                             | 验收                                                                     | 状态                                                                |
| ------ | ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| DEV-01 | Vue3 隔离式 Mock 预览  | `pnpm dev:mock`、登录/菜单/权限/群组标签内存 Mock、未知接口 501                  | 浏览器验证 Mock 登录及标签增改删；确认不代理真实后端                     | 已完成                                                              |
| DEV-02 | 全现役菜单首屏预览     | 10 个一级菜单、32 个动态子菜单及各入口样例数据、轮播图本地资源                   | 33 个入口（含首页）首屏可见、无未配置 API、菜单可浏览、Mock 无后端代理   | 已完成                                                              |
| DEV-03 | 补齐北向菜单和样例数据 | 对照 Vue2 现役路由补齐 `/thirdParty/thirdParty`；更新为 10 个一级、32 个二级入口 | 菜单、路由、样例数据逐项对应；筛选及增改删 Mock E2E 通过                 | 已完成                                                              |
| DEV-04 | 保留归档群组旧菜单 URL | 主入口恢复 Vue2 `/policeExtend/ArchivedTable`，保留 `/h5/ArchivedTable` 别名跳转 | Mock 按旧父子菜单展示；旧 URL 跳转后经动态路由和 License 权限过滤        | 已完成                                                              |
| DEV-05 | 全菜单可见性与数据回归 | 侧栏滚动/检索、32 个动态入口样例逐项对应、未知 API 检查                          | 全菜单可定位、键盘可导航、全量首屏样例及隔离 Mock E2E 通过；当前复验 2/2 | 已完成（2026-09-28 复验通过；首轮冷启动有一次导航超时，原因待观察） |
| DEV-06 | 首页与全菜单目录补齐   | 固定首页入口、由当前授权路由生成完整菜单目录、补齐首页样例数据                   | 首页直达、目录筛选/键盘和 33 个页面样例 Mock 验收                        | 已完成                                                              |

### P2：配置化架构和清理

| 编号    | 任务                | 产出                                                     | 验收                           | 状态           |
| ------- | ------------------- | -------------------------------------------------------- | ------------------------------ | -------------- |
| ARCH-01 | menu-config S1 Mock | `menu-config`、PageRegistry、TabHost、校验、feature flag | 菜单/路由/tab/占位页全链路演示 | 待开始         |
| ARCH-02 | 引导系统            | GuideRegistry、driver.js、pageId、TabHost 协议           | 页面引导和重播可用             | 延期（新需求） |
| ARCH-03 | S2 后端菜单契约     | `/api/menu/config` 契约、后台字段校验、灰度方案          | legacy/config 同账号一致       | 阻塞           |
| ARCH-04 | 旧链路清理          | OAuth 占位映射、死文件、历史 API 和无效 Mock 分类清理    | 无现役入口指向占位页           | 待开始         |
| ARCH-05 | Vue2 技术债治理     | Vue2/EOL、旧 Axios、依赖构建脚本和停止维护边界           | 风险和停止线有记录             | 待开始         |

## 4. 权限完成标准

### 菜单权限

- 菜单 ID、URL、排序、状态和父子关系来源明确。
- 停用菜单不进入侧边栏和动态路由。
- License、全局开关、管理员例外和生产隐藏规则有单测和浏览器证据。
- OAuth URL 不得映射到未完成占位页。

### 页面权限

- 未授权页面不注册、不渲染。
- 直接地址访问有稳定的无权限反馈或安全回退。
- 页面内部的业务数据范围判断与菜单权限分开记录。

### 按钮权限

- 本期迁移范围仅包含 Vue2 现役代码中已有权限条件、以及已有可信契约的操作；新增权限扩展见延期范围。
- 新增、编辑、删除、启用/禁用、授权、上传、导入、导出、批量操作逐项绑定权限码。
- 权限码沿用 Vue2/API 契约；没有依据时记录阻塞，不创建新码。
- `ActionButtons`、SearchBar actions 和自定义操作按钮不能绕过权限。

### 文本权限

- 敏感文本和字段有权限来源。
- 无权时按设计选择移除、隐藏、禁用或脱敏占位。
- 权限刷新、账号切换后重新判断，不能残留上一账号内容。

### 登录页及图标动效

- 登录页先对照 `doc/登录1/` 和 `doc/登录2/` 当前视觉与交互差异，再确定实现方案；保留现有 OAuth、改密、密码过期、License 提示、表单校验和记住账号行为，不直接依赖设计 HTML 中的 CDN。
- 图标动效先归并 P0、P1 与 29 枚参考的重叠项，统一图标键、SVG 资源和动作语义；业务接口中的旧图标值需继续兼容。
- 动效覆盖鼠标 hover、键盘 focus 和触屏使用；遵守 `prefers-reduced-motion`，提供静态降级，并在 lx-ui Demo 和浏览器验证。

## 5. 每步交接要求

每个步骤完成后必须：

1. 更新本文件对应任务状态和实际证据。
2. 更新 [PROJECT-HANDOFF.md](./PROJECT-HANDOFF.md)，记录改动文件、验证命令、结果、遗留问题和下一步。
3. 若涉及页面、API、路由或组件，同步更新 [PROJECT-MAP.md](./PROJECT-MAP.md) 和迁移台账。
4. 未执行的验证标记为“未执行”，环境失败和代码失败分开记录。
5. 不修改、重置或覆盖其他协作者已有工作。

## 6. 当前阻塞

- 角色设置用户缺少可信的已有成员读取接口，不能安全完成回显和提交；按本节延期范围等待契约，不属于当前迭代阻塞。
- 真实后端 License、权限、文件、设备、AI 等联调环境和契约尚未提供。
- 群组标签已按 Vue2/API 契约迁移；自动化 E2E 覆盖列表、增改删、查询失败重试和批量删除；新增按钮权限扩展延期，取消/重复提交边界和真实后端联调仍未完成。
- 当前工作区存在大量既有修改，提交前需要按文件确认归属。

### P0-06 实际证据

- `pnpm lint`：通过，0 error、0 warning。
- `pnpm exec prettier --check <本次涉及文件>`：通过。
- `pnpm test:unit -- --reporter=dot`：11 个文件、42 项通过。
- `pnpm build`：通过；剩余输出为既有依赖注释、`variables.less` 的 Less `:export` 命名空间提示、动态/静态导入提示和大 chunk 提示，未阻断产物生成，已列为后续性能/构建配置治理项。
- 本步骤未执行真实后端联调和浏览器 E2E。

权限契约明细见：[PERMISSION-CONTRACT.md](./PERMISSION-CONTRACT.md)。

### P0-05 实际证据

- Vue3 已提供 `v-has-perm`、`v-has-text-perm` 和 `v-auth`，支持隐藏、禁用、字段脱敏占位以及权限变化后的重判。
- lx-ui 已提供 `setupLxPermission`、`hasPermission`、`isFieldMasked`、`maskValue`，并由 `LxActionButtons`、`LxProTable`、`LxDescriptions` 消费。
- Vue3 宿主仅注入既有 `userStore.buttons`；后端没有 `maskedFields`/字段权限契约，因此业务字段脱敏保持阻塞，未臆造权限码。
- `linkx-fe` 的 `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 均通过；真实页面逐项脱敏验收和真实后端字段联调未执行。

### P0-04b 实际证据

- 对现役 Vue2 页面进行权限字面量对照后，所有可见且有明确来源的 canonical 按钮码均已在 Vue3 消费；唯一差异 `/admin/executorToEquipment/create` 只存在于已注释的设备/车辆按钮，不纳入现役迁移。
- 修复 `authority/adminPerson` 状态开关：除通用管理员身份外，还必须拥有 `/admin/user/update`，无权限时只展示状态标签，不允许切换。
- `adminPerson` 当前复用普通用户 `/auth/v1/user/page` 等 API，而仓库另有 `adminUser` API；Vue2 也存在同类差异，需后端确认后再调整，不能凭空替换。

### P0-07 实际证据

- `playwright.config.ts` 会优先使用有效的 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，Windows 下自动探测系统 Chrome；其他环境继续回退 Playwright 默认浏览器。
- 系统 Chrome 版本 `153.0.8010.53` 下执行 `pnpm exec playwright test`：42 项通过，包含入口 Smoke、GroupTags 列表/新增/失败重试/批删 Mock、未登录跳转、受限地址拦截、权限按钮矩阵和 UI/窄屏/键盘检查。
- 2026-09-26 再次执行完整套件：43 项通过，新增覆盖历史图标值可见渲染的断言。
- 2026-09-26 补充 GroupTags 编辑和单删 E2E 后，默认回归套件 45 项通过；全菜单预览另由专用配置验证。
- 浏览器测试仍全部通过 Mock 拦截后端请求，不代表真实后端联调。

### DEV-02 实际证据

- `mock/preview-menu.ts` 覆盖 10 个一级模块、32 个现役 Vue3 子路由，与 `src/router/modules/*.ts` 的入口数量和 URL 一致；Mock 管理员获准访问全部菜单。Mock 预览模式在 768px 及以上默认展开侧栏与子菜单，移动端保留抽屉式菜单；390px 和 320px 下顶栏不重叠且页面无横向溢出。
- `mock/preview-data.ts` 为 32 个入口首屏提供样例记录或配置，连同首页共 33 个入口；`tests/e2e/preview.spec.ts` 要求样例文案表与全部 URL 一一对应，并逐页确认无未配置 API。轮播图 SVG 由隔离式 Mock 响应，`AuthImg` 保留响应 MIME 类型后，浏览器自然尺寸检查通过。
- `playwright.config.ts` 排除预览专用用例；`playwright.preview.config.ts` 只在 `mock-preview` 服务运行该用例，避免普通开发模式把预览流量代理到后端。
- `pnpm test:e2e:preview`：1 项通过，遍历 31 个入口、验证两张轮播图加载，并断言 390px/320px 顶栏和页面无溢出；`pnpm test:e2e`：45 项通过；响应式改动后 `pnpm exec playwright test tests/e2e/ui-audit.spec.ts`：4 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、45 项通过；`pnpm exec vue-tsc --noEmit`、涉及文件 ESLint、Prettier 检查及 `pnpm build` 通过。
- 该结果证明全菜单和首屏样例可供本地浏览，不代表各页新增/编辑/删除、上传下载、权限组合和真实后端联调全部完成。构建仍输出已登记的 Less 导出、分包循环和大 chunk 警告。

### DEV-03 实际证据

- 对照 Vue2 `src/router/modules/thirdInterface.js`，发现其现役 `thirdParty` 子路由（北向接入管理）缺少 Vue3 菜单预览项；Vue3 路由和页面已补齐，沿用 Vue2 `systemName` 字段及 `/collaboration/v1/client/*` API 契约。
- `mock/preview-menu.ts` 和 `mock/preview-data.ts` 当前覆盖 10 个一级、32 个二级菜单及全部 32 个入口的首屏样例；`tests/e2e/preview.spec.ts` 逐入口核对菜单、样例内容和未处理 API，并覆盖北向筛选、增改删。
- `pnpm test:e2e:preview`：2 项通过；Northbound CRUD 只改本地预览服务内存数据，重启后恢复样例，不触达真实后端。
- 权限契约表、项目地图、迁移矩阵、Backlog 和 Mock 状态矩阵已同步此入口及 32 个入口的现状。
- 本项证明本地 Mock 菜单和首屏数据齐全，不证明其余业务页的深层操作、完整权限矩阵或真实后端联调完成；北向按钮权限码仍需可信后端契约确认。

### DEV-04 实际证据

- Vue2 `src/router/modules/policeExtend.js` 将 `ArchivedTable` 注册在 `/policeExtend/ArchivedTable`；Vue3 现以该 URL 作为菜单路由，并把旧 Vue3 预览地址 `/h5/ArchivedTable` 保留为隐藏重定向。
- `mock/preview-menu.ts` 将“已归档群组管理”放回“警信扩展信息管理”；Vue2 现役父子关系、Vue3 静态路由和预览菜单现在一致。
- `pnpm test:e2e:preview`：2 项通过，覆盖 32 个菜单入口及旧 H5 地址跳转；License 失效、普通用户权限组合和真实后端菜单仍由 P0-03 单独验收。

### P1-08 实际证据

- `GroupTags` 已从占位页迁移为列表、分页、搜索、重置、单选/批量删除和新增/编辑弹窗。
- 新增 `src/api/h5/groupTags.ts`，严格沿用 Vue2/API 的 `/collaboration/v1/tags/page`、`/tags/{id}`、`/tags` 和 `/tags/delete/list` 契约；未复用语义不同的 `quick` 标签 API。
- `src/views/h5/groupTags/iconMap.ts` 将旧 Font Awesome 类映射为本地 Element Plus SVG，API 仍保存旧值；列表图标可见性已加入 E2E。
- `tests/unit/group-tags.test.ts`：2 个 API 契约测试通过；`tests/e2e/group-tags.spec.ts` 覆盖列表/新增、详情/编辑/单删、失败重试和批删。`pnpm dev:mock` 下另经浏览器手动验证 CRUD，未发现页面错误。
- 按钮权限、取消/重复提交边界和真实后端联调仍未执行，不能标记为业务闭环完成。

### DEV-01 实际证据

- `pnpm dev:mock` 使用 `mock-preview` 专用 Vite 模式和 `.env.mock-preview`，不配置后端代理；支持 Mock 登录、H5 菜单、权限、Navbar 绑定查询及群组标签 CRUD，数据仅保存在开发服务器进程内。
- 未配置接口返回 HTTP 501；实测未知路径没有落到真实后端。预览 `/h5/GroupTags` 会使用本地会话；`/login` 保留独立登录表单。
- 系统 Chrome 浏览器验证标签列表、图标显示、增改删及窄屏登录，页面无 JS 错误；重启服务器会恢复初始 Mock 数据。

### P0-03 实际证据

- `tests/unit/auth-routes.test.ts`：9 项通过，覆盖空受限菜单、停用路由、超级管理员例外、License 过滤、全局开关和生产权限页隐藏规则。
- `tests/e2e/permission-matrix.spec.ts`：7 项通过，浏览器验证空菜单、按钮权限、停用菜单、群组 License、排班开关和直接地址访问。
- 最终 `pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过。Mock 证明前端访问链路，不代表真实菜单、License 字段语义和后端权限联调完成；故 P0-03 仍保持进行中。

### UI-05 实际证据

- 登录页已对照 `doc/登录1/`、`doc/登录2/` 完成整合，实现集中式登录布局、OAuth2 密码登录、密码过期/修改、License 提示、键盘焦点和窄屏适配，并尊重减少动效偏好。
- “记住账号”在明确勾选且登录成功后仅保存账号名；重新打开可回填，取消勾选会清除。密码和登录令牌不写入记住账号字段。Vue2 原登录页没有该交互，因此以设计稿作为该控件行为来源。
- `tests/e2e/ui-audit.spec.ts` 验证 OAuth、密码变更锁定、License 提示、记住账号回填/清除以及 390px/320px 显示；默认 E2E 52 项通过。

### DEV-05 实际证据

- 浏览器确认侧栏原滚动条样式宽度为 0，低视口高度下菜单后半段不明显；现已提供固定在侧栏顶部的菜单搜索、父级/页面名匹配、键盘 Enter 导航和可滚动区域样式。
- `mock/preview-menu.ts` 对应 10 个一级、32 个二级现役入口；`preview.spec.ts` 逐项核对菜单标题、搜索直达和 32 页首屏样例，并收集未知 API 的 501 响应。
- `pnpm test:e2e:preview`：2 项通过，含北向筛选及增改删；`pnpm test:e2e`：52 项通过。当前只承诺全量首屏样例，不将未执行的深层业务操作或真实联调标为完成。
- 2026-09-28 当前复验：第一次冷启动的全菜单用例在 `/h5/GroupTags` 导航超时；独立确认 Mock 路由返回 200、Chromium SPA 挂载约 0.9 秒后，完整重跑 `pnpm test:e2e:preview --reporter=line` 为 2/2。冷启动超时未再次复现，原因未确认，后续观察测试稳定性。

### DEV-06 实际证据

- `/dashboard` 是登录后可用的静态路由，不在动态权限菜单树中；侧栏此前只渲染动态菜单，因此首页入口缺失。现已在侧栏加入首页，并提供从首页和当前权限路由生成的“全部菜单”目录，目录数量随实际授权菜单变化。
- 隔离 Mock 预览总计 33 个入口：固定首页加 10 组、32 个动态子菜单。Mock 版本响应补齐警务协同、MSIP、警信三个版本字段。
- `pnpm test:e2e:preview`：2 项通过，覆盖首页入口、33 项目录与检索跳转、33 页样例、未知 API、北向筛选及增改删。
- `pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过；Vue 类型检查、定向 ESLint、变更文件 Prettier 检查和生产构建通过。
- 2026-09-28 使用项目配置指定的系统 Chrome 生成稳定截图 `other-admin/admin-vue3/test-results/mock-preview-all-menus.png`；截图在 280ms 弹窗过渡结束后采集，显示 33 项目录及群组标签首屏。Playwright 断言目录含 33 条链接；全菜单专项 E2E 本轮复跑 2/2。构建保留已登记的 Less 导出、循环分包和大 chunk 提示。
- 验收仅覆盖页面首屏和已列出的北向操作；其余页面写操作、真实权限和后端数据联调仍按业务模块单独推进。

### UI-08 实际证据

- P1 27 个名称和 29 枚扩展清单均有路径或兼容别名；三清单合计 69 个去重动效名称。图标总览按 P0/P1/P2/别名展示 96 个可用名称，并动态列出三份设计清单的名称。
- P1 按参考实现方向、电话、邮件、分享、复制、锁、开锁、电源、开关、关闭、星形、网格、列表和日期等语义动效。29 枚扩展沿用参考稿的 scale(1.18) 与蓝色投影；别名 date/eye-on 分别解析到 calendar/eye 后使用标准动效。
- 所有清单名称都设置动效标记并通过 tests/unit/lx-icon.test.ts 验证；prefers-reduced-motion 下关闭动效和变换。
- pnpm test:e2e:icons 配置桌面 Chrome 与 Pixel 7 触屏模拟，覆盖全部 96 个展示项、鼠标悬浮、键盘焦点、触屏按压动画、复制代码、减少动效和 320px 横向溢出检查。
- pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot：5 项通过；pnpm test:e2e:icons：桌面 Chrome 和 Pixel 7 项目各 1 项通过。
- Vue3 pnpm exec vue-tsc --noEmit、lx-ui pnpm typecheck、Vue3 定向 ESLint、变更文件 Prettier 检查、lx-ui pnpm build 和 pnpm build:docs：通过。文档构建仍有既有大 chunk 提示。
- lx-ui 没有独立 ESLint 配置；其图标组件由类型检查、Prettier 和组件库构建验证。此项仅验收 LxIcon，不表示其他 lx-ui 组件或宿主按钮已逐页视觉验收。

### P1-02 进行中证据（权限树失败保护）

- `EditRole.vue` 对三套角色菜单树使用全量成功门槛：任一菜单树请求失败或响应码无效时显示错误和重试，未全部加载成功前不能保存。
- `DataPermissionTree.vue` 显示部门树初始加载失败和懒加载节点失败；响应 `code !== 0` 按失败处理，根树提供重试，懒加载节点提供节点级重试。`EditRole.vue` 与管理员用户 `EditUser.vue` 都接收 `load-state` 并在失败/未完成时禁用提交。
- 懒加载重试保留节点未加载状态，成功后展开该节点；重试根树后会把已回显的数据权限重新同步到树。
- `tests/e2e/permission-matrix.spec.ts`：14 项通过，覆盖角色及人员按钮权限码、角色 ID 2/6 例外、`userManage` 身份直达限制、菜单树/部门树初始与懒加载失败重试、失败时阻止写入；全部请求由 Playwright Mock 拦截。
- 验证：`pnpm exec vue-tsc --noEmit`、定向 ESLint、变更文件 `prettier --check`、`pnpm build` 通过。构建仍有已登记的 Less 导出、循环分包、依赖注释和大 chunk 提示；本步骤未运行全量 E2E 或真实后端联调。
- 未完成/阻塞：角色“设置用户”读取/绑定/解绑接口在 Vue2 中仍为 TODO/空 Mock；IM 权限和人员绑定的完整业务闭环、真实账号身份和真实后端联调继续未完成，不能依据 Mock 宣称闭环。

### P1-02 实际证据（IM 角色批量绑定）

- Vue2 `src/api/resource/person.js` 与 Vue3 `src/api/permission/user.ts` 均使用 `GET /auth/v1/user/page` 人员分页；Vue2 `setBatchRole` 使用 `PUT /auth/v1/role/{roleId}/user`，body 为 `userIds` 数组，Vue3 API 保持相同路径、方法和载荷。
- 新增 `tests/e2e/authority-bind-workflow.spec.ts`：无 `/admin/trUserRole/createMany` 时隐藏绑定入口；授权后验证姓名筛选参数、选中人员及数组请求体；绑定失败时保留弹窗和选择并允许重试。
- `pnpm exec playwright test tests/e2e/authority-bind-workflow.spec.ts --reporter=line`：3 项通过；`pnpm exec playwright test --reporter=line`：62/62 通过。请求均由 Playwright Mock 拦截。
- Vue3 `pnpm exec vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查通过。真实 IM 服务联调未执行。
- 未完成/阻塞：IM 权限配置页与 IM 人员“设置角色”保存/回显尚未完成完整工作流验收；后台角色“设置用户”缺少可信已有成员读取接口，仍沿用 Vue2 TODO/空 Mock 阻塞，不实现猜测接口。

> 以下 P1-03 小节记录逐步建设期间的历史缺口；最终验收以 2026-09-26 的 33/33 基础数据专项记录为准。

### P1-03 实际证据（全局参数列表失败恢复）

- Vue2 `src/api/dictionary/globals.js:getGlobalsList` 与 Vue3 `src/api/dictionary/globals.ts:getGlobalsList` 均为 `POST /api/globals/list`，返回全局配置项数组。
- Vue3 全局参数页原先吞掉列表请求异常，失败时只显示空表。现改为校验成功码和数组响应；请求/业务失败时保留已有列表、不覆盖为空，展示页面内错误提示和“重试”按钮，成功重试后清除错误状态。
- `tests/e2e/base-data-workflow.spec.ts` 由 Mock 验证登录初始化请求成功、页面列表请求失败后出现错误态，并通过重试加载样例数据；请求未发往真实后端。
- 验证：专项 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line` 1 项通过；默认 `pnpm exec playwright test --reporter=line` 63/63 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint、相关文件 Prettier 检查通过。
- 未完成：全局参数创建/修改/删除与权限、地图上传/初始化/删除、地理编码及区划导入导出、布局子页读写仍未完成 Mock 验收；真实后端联调未执行。

### P1-03 实际证据（公共布局配置读取保护）

- Vue2 `src/api/h5/layoutConfig.js` 与 Vue3 `src/api/h5/archivedTable.ts` 复用的配置接口均为 `GET /api/system/config`，更新为 `PUT /api/system/config`；`SYSTEM_NAME` 等值按 JSON 字符串封装，协同群组配置使用 `CREAT_GROUP_CONFIG`。
- `CommonConfig.vue` 现在要求读取返回 `code === 0` 且 `data` 为数组后才生成表单；网络或业务失败显示重试入口，编辑控件和单项/整体保存均禁用。失败不生成默认群组配置，不会以默认值覆盖远端设置。
- `tests/e2e/base-data-workflow.spec.ts` 的布局用例让配置读取失败后验证重试提示和“保存配置”入口缺席；重试成功后验证 `SYSTEM_NAME` 回显并恢复保存按钮。
- 验证：基础数据专项 E2E 2/2 通过；默认完整 `pnpm exec playwright test --reporter=line` 64/64 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查、`pnpm build` 通过。构建仍有既有 Less 导出、循环分包、依赖注释和大 chunk 警告。
- 未完成：地图文件/区划导入导出、地图数据保存、布局其他子页读写及真实后端联调仍未完成。

### P1-03 实际证据（地图底图上传与初始化）

- Vue2 `src/api/mapConfig.js` 已有底图上传、初始化和分页查询；Vue3 `src/api/baseData/mapConfig.ts` 保留对应 `POST /api/map/uploadBaseMap`、`POST /api/map/initBaseMap`、`POST /api/map/selectPageBaseMap` 调用契约。
- 地图配置页对 `.mbtiles` 文件执行扩展名校验；上传成功后调用底图初始化，初始化成功后刷新底图列表。扩展名不符时显示错误且不发送上传请求。
- `tests/e2e/base-data-workflow.spec.ts` 用 Playwright Mock 验证拒绝非 `.mbtiles` 文件，以及合法文件以 multipart POST 上传后依次初始化并刷新列表；没有请求真实后端。
- 验证：本步骤基础数据专项 E2E 7/7、默认完整 `pnpm exec playwright test --reporter=line` 69/69、`pnpm exec vue-tsc --noEmit`、定向 ESLint 和相关文件 Prettier 检查通过。
- 未完成：上传大小边界、地理编码读写、行政区划导入导出、全局参数 CRUD、布局其他子页读写及真实后端联调仍待完成。

### P1-03 实际证据（地理编码与行政区划上传）

- Vue2 `src/api/mapConfig.js` 与 Vue3 `src/api/baseData/mapConfig.ts` 的地理编码保存均为 `POST /api/map/updateGeo`，请求字段为 `geocode`、`inversecode`、`poi`；行政区划 `.geojson` 文件沿用底图的 `POST /api/map/uploadBaseMap`，上传后重新读取 `POST /api/map/selectDivision`。
- 新增 Mock E2E 验证可选编码修改后的请求体、拒绝非 `.geojson` 文件，以及合法文件 multipart 上传成功后重新读取并回显最新区域名称。
- 验证：基础数据专项 E2E 10/10、默认完整 `pnpm exec playwright test --reporter=line` 72/72、`pnpm exec vue-tsc --noEmit`、定向 ESLint 和相关文件 Prettier 检查通过。全部请求被 Mock 拦截。
- 未完成：500 MB 文件大小边界、行政区划下载/导出、地理编码失败恢复、全局参数 CRUD、布局其他子页读写及真实后端联调仍待完成。

### P1-03 实际证据（行政区划导出与文件大小边界）

- Vue2 公共上传组件以 `size / 1024 > maxSize` 拒绝超限文件，因此恰好 500 MB 属于允许范围。Vue3 底图和行政区划上传现都允许 500 MB，超过后在发请求前拒绝。
- Vue2 `updateDivision` 使用标准 JSON 业务响应，再把 `res.data` 序列化为 `.geojson` 文件。Vue3 API 已移除不兼容的 `arraybuffer` 响应配置，恢复相同的 POST `/api/map/updateDivision?nodeId=0` JSON 契约；导出失败显示错误。
- 行政区划读取失败现有页面内错误提示和“重试”入口，成功后清除错误并回显区域名。新增浏览器用例验证 500 MB/超限、读取失败恢复、导出请求参数、下载文件名与 JSON 内容以及导出失败提示。
- 验证：基础数据专项 E2E 15/15、默认完整 `pnpm exec playwright test --reporter=line` 77/77、`pnpm exec vue-tsc --noEmit`、定向 ESLint 和变更文件 Prettier 检查通过。所有请求由 Playwright Mock 截获。
- 未完成：全局参数 CRUD/权限、地图配置新增编辑及地理编码失败恢复、布局其他子页读写和真实后端联调仍待验收。

### P1-03 最终验收（基础数据 Mock 工作流）

- App H5 Mock 覆盖 `show=-1` 全量查询、失败后重试、新增防重复提交、编辑回显与 PUT 载荷、删除失败后的状态恢复及成功删除后的列表刷新。
- 公共配置 Mock 覆盖读取失败保护、读取重试、协同群组配置首次创建的 `CREAT_GROUP_CONFIG` 载荷、成功回填 ID 及后续更新载荷；PC 页签覆盖新增/编辑成功回读、保存成功但刷新失败的恢复入口。
- 完整 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：33/33 通过；Playwright 请求全部由 `mockBackend` 拦截。测试文件 ESLint 与 Prettier 检查通过。
- 结论：P1-03 的业务 Mock/E2E 验收已完成。真实后端联调未执行，按 P1-07 跟踪。

### CODE-01 / P1-03 进行中证据（布局配置 API Promise 链）

- 用户明确要求 Vue3 宿主业务 API 保留 `.then().catch().finally()` 风格。规则已写入根目录 `AGENTS.md`；表单校验、确认框和弹窗结果等非 API 异步流程不作机械转换。
- App H5、PC 页签、运维统计、公共配置、全局参数、地图/地理编码/区划相关宿主 API 调用已改为 Promise 链；保留业务码判断、错误提示、竞态保护以及 loading/提交状态释放。统计导出使用原始二进制响应和 HTTP 响应头解析文件名。
- 基础数据 Mock E2E 新增 PC 页签新增/编辑成功写回和 Excel 文件流下载检查；全局参数增改删/恢复与操作权限、底图/地理编码/区划成功失败路径继续由同一专项套件验证。
- 当时 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：31/31 通过；后续完整专项扩展至 33/33，最终记录见上方 P1-03 最终验收。该阶段尚缺的 App H5 编辑/删除和公共配置成功保存 Mock 已由最终验收补齐。
- 真实后端联调未执行；CODE-01 其他业务模块当时仍在迁移，最终状态见 CODE-01 完成记录。

### CODE-01 进行中证据（登录与会话核心）

> 以下 CODE-01 小节记录各批次完成时的状态。后续全源收敛记录优先；旧的“仍需迁移/下一步”仅表示当时进度，不代表当前未完成项。

- Pinia 登录/登出、菜单初始化、角色权限/全局参数/License 获取改为 Promise 链；登出失败仍在 `finally` 清本地会话，旧会话响应仍由 session epoch 丢弃。
- 登录页 License 配置读取与密码修改、会话 keepalive、Navbar 绑定人员查询、部门递归查询和同步进度轮询改为 Promise 链；表单验证、提示弹窗和路由操作等本地流程保留原语义。
- 新增部门 ID 深度优先顺序与同步进度 loading 完成状态单测。静态扫描仍在第三方接口、协同、排班、H5、位置等页面找到历史 API `await`，CODE-01 保持进行中。
- 验证：完整 Vitest 14 个文件、54 项通过；登录 UI E2E 7/7；`pnpm exec vue-tsc --noEmit`、涉及文件定向 ESLint/Prettier 和 `pnpm build` 通过。构建仍有已登记警告；生产请求未实际联调。

### CODE-01 进行中证据（权限中心首批）

- 后台/前台菜单树读取、IM 角色绑定、后台用户详情与保存、密码策略读取改用 Promise 链；请求 loading 在 `finally` 释放，确认框和表单校验仍保留本地异步写法。
- 权限绑定与矩阵 E2E 共 16/17 通过，IM 角色绑定成功与失败重试、权限树失败重试、后台用户编辑门禁均通过。剩余 1 项在 License 菜单测试中因 `.sidebar-container` 选择器未命中失败，待单独核查当前侧栏结构，不归因于本批 API 风格改动。
- 本批 `vue-tsc`、6 个文件定向 ESLint、Prettier 检查通过；真实后端未联调。
- 未完成：权限中心 API-await 已清零；真实后端联调与完整权限业务验收仍由 P1-02/P1-07 跟踪，CODE-01 其他模块尚未完成。

### CODE-01 进行中证据（权限中心树、人员与自定义部门）

- 数据权限树、IM 数据权限、后台/前台人员归属查询、单人/批量设角、三棵角色权限树、自定义组织/部门增改删和人员绑定/解绑改用 Promise 链；API 间的等待也改为链式编排，保留表单校验、确认框等本地 `async/await`。
- 权限中心 API-await 静态扫描无命中；`vue-tsc`、15 个涉及 Vue 文件定向 ESLint/Prettier 通过。`permission-matrix.spec.ts --grep "树"`：3/3 通过，覆盖角色树、数据树与管理员编辑失败重试。
- 较早运行的权限绑定/矩阵组合为 16/17；唯一未通过项仍是 License 菜单用例定位器 `.sidebar-container` 在当前侧栏 DOM 中不存在，与 API Promise 链改动无关。
- 未完成/阻塞：权限中心 Mock 业务、按钮/文本权限和真实后端联调按 P1-02/P1-07 继续；CODE-01 仍需处理第三方接口、协同、排班、H5、位置及其余扫描命中。

### CODE-01 进行中证据（协同岗模块）

- 协同首页全局参数/人员归属、层级与职能树增改查删、默认岗递归分页、成员挂靠、协同表单人员/警单类型/图标上传/保存、上下岗与同步查询、Excel 导出均改为 Promise 链；loading 与提交锁在 `finally` 释放。表单校验、确认框、`nextTick` 保持本地异步写法。
- 协同目录业务 API-await 静态扫描无命中；`vue-tsc`、12 个涉及 Vue 文件定向 ESLint/Prettier 检查通过。
- 本地全菜单预览套件 0/2：全部菜单目录点击后仍停留在 `/h5/GroupTags`；北向接入页面行数断言得到 0。两项均未触达协同交互，属预览导航/Mock 测试基线失败，不作为协同业务 E2E 通过证据。
- 未完成/阻塞：协同工作流专属 Mock E2E 和真实后端联调仍待补；CODE-01 需继续处理第三方接口、排班、H5、位置及其他页面和请求编排工具。

### CODE-01 进行中证据（第三方接口统一通信）

- 设备类型列表/展示状态/图标上传与保存、ICP 服务配置和选择树、非管理员所属部门与部门树、单人/批量授权树读取和授权保存均改用 Promise 链；保留业务码分支、开关失败回滚、上传失败恢复、并行读取、加载/提交状态释放及本地表单校验。
- 统一通信目录的 API-await 静态扫描只剩 `IcpServerConfig.vue` 的表单校验 `await`；`vue-tsc --noEmit`、4 个组件定向 ESLint 和 Prettier 检查通过。
- 当前没有统一通信专属 Mock E2E，本批仅记录静态扫描、类型与代码质量检查，不记为浏览器业务验收或真实后端联调。
- 未完成：智能体、南向、应用/警单等第三方接口区域及排班、H5、位置仍有历史 API-await 待迁移；真实后端联调未执行。

### CODE-01 进行中证据（第三方接口智能体）

- 智能体配置读取/保存、分类读取和全量保存、文件接口列表/增删改、智能体增删改/导入、虚拟用户绑定、查询记录删除/导出和模板下载均改用 Promise 链；表单校验与确认框保留本地 `async/await`。下载 helper 对业务失败返回拒绝态，避免页面在未下载时提示成功。
- 智能体目录和 API helper 静态扫描仅剩表单校验及确认框 `await`；`vue-tsc --noEmit`、8 个文件定向 ESLint/Prettier 和全量 Vitest（14 个文件、54 项）通过。
- 当前没有智能体专属 Mock E2E，本批不记为浏览器业务验收或真实后端联调。
- 未完成：南向、应用/警单等第三方接口区域及排班、H5、位置仍有历史 API-await 待迁移；真实后端联调未执行。

### CODE-01 进行中证据（第三方接口南向）

- Mapper 保存、任务标准件配置读取/保存、南向应用详情读取及新增/更新改用 Promise 链；保留详情弹窗时序、任务配置请求版本保护、读取失败禁止保存、成功码和提交/loading 锁释放。表单校验保留本地 `async/await`。
- 南向目录 API-await 静态扫描只命中 `AppsManageEditModal.vue` 与 `TaskConfigModal.vue` 的表单校验；`vue-tsc --noEmit`、4 个组件定向 ESLint 和 Prettier 检查通过。
- 当前没有南向专属 Mock E2E，本批不记为浏览器业务验收或真实后端联调。
- 未完成：应用/警单等第三方接口区域及排班、H5、位置仍有历史 API-await 待迁移；真实后端联调未执行。

### CODE-01 进行中证据（第三方接口应用与警单）

- 应用与分组列表、候选应用加载、应用详情、图标上传、应用/分组新增更新、应用上下架、Dock 状态、Dock/警单类型保存和警单详情读取均改用 Promise 链；保留确认取消、状态回滚、分页刷新、表单校验和 loading 清理。
- 应用与警单目录 API-await 静态扫描只命中表单校验及确认框；`vue-tsc --noEmit`、7 个文件定向 ESLint 与 Prettier 检查通过。
- 当前没有应用/警单专属 Mock E2E，本批不记为浏览器业务验收或真实后端联调。
- 未完成：北向接入、排班、H5、位置和共享请求组件仍需按 CODE-01 继续扫描迁移；真实后端联调未执行。

### CODE-01 进行中证据（北向接入）

- 列表读取、增改、删除改用 Promise 链；保留列表请求版本号、保存/删除后刷新、最后一页删除后的页码回退、表单校验、确认框和保存锁。
- 北向目录 API-await 静态扫描只命中表单校验和确认框；`vue-tsc --noEmit`、页面定向 ESLint 和 Prettier 检查通过。
- `pnpm exec playwright test tests/e2e/preview.spec.ts --config=playwright.preview.config.ts --grep "北向接入管理使用本地 Mock 完成筛选和增改删" --reporter=line`：0/1，页面行数断言预期 3、实际 0，失败截图为空白；同一预览服务的现有浏览器标签显示 3 条 Mock 行。测试上下文与当前预览页面表现不一致，需另查隔离运行基线，本批不记 E2E 通过。
- 未完成：排班、H5、位置和共享请求组件仍需按 CODE-01 继续扫描迁移；北向 Mock E2E 隔离差异及真实后端联调待处理。

### CODE-01 进行中证据（排班）

- 排班类型分页/新增/更新/删除，值班类型下拉分页读取、排班日历查询、模板下载、导入回调后的刷新等宿主 API 调用均改用 Promise 链；表单校验、确认框和 `nextTick` 保留本地异步写法。
- `shiftScheduling` 目录静态扫描只命中排班类型表单校验与下拉展开后的 `nextTick`；`pnpm exec vue-tsc --noEmit`、3 个文件定向 ESLint 和 Prettier 检查通过。
- 本批没有排班专属 Mock E2E；不记为浏览器业务验收或真实后端联调。
- 未完成：H5、位置、仪表盘/快捷标签/虚拟用户页面及共享请求组件仍需继续扫描迁移；真实后端联调未执行。

### CODE-01 进行中证据（群组标签与快捷标签）

- OAuth 群组标签的分页读取、详情、单删/批删、创建/更新，以及 H5 快捷标签树、警员列表、详情、删除/批删和保存请求改用 Promise 链；协同快捷标签页也改用链式请求。保留表单校验、确认取消语义、成功后刷新、错误提示和 loading/submitting 释放。
- `group-tags.test.ts`：2/2；`group-tags.spec.ts`：3/3。`vue-tsc --noEmit`、6 个文件定向 ESLint 与 Prettier 检查通过；扫描剩余 `await` 仅为三个表单校验。
- 本批测试只验证 GroupTags 覆盖到的 Mock 行为；快捷标签没有专属业务 E2E，真实后端联调未执行。
- 未完成：H5 轮播和归档页、位置、仪表盘/虚拟用户页面及共享请求组件仍需继续迁移。

### CODE-01 进行中证据（H5 轮播与归档）

- 轮播图上传、公众号/文章/环境配置读取、详情回显、新增/更新，以及归档文件下载、系统配置读取、群组同步和同步配置写入改用 Promise 链；图片上传成功后才提交轮播，下载取消仍不提示失败，轮播与下载状态在既有时机清理。
- H5 目录 `rg -n "await"` 无 API 请求命中；剩余命中仅为表单校验和归档下载确认。`pnpm exec vue-tsc --noEmit`、2 个文件定向 ESLint 和 Prettier 检查通过。
- 轮播/归档没有专属业务 Mock E2E，本批不记为浏览器交互验收或真实后端联调。
- 未完成：位置、仪表盘/虚拟用户页面及共享请求组件仍需继续扫描和迁移。

### CODE-01 进行中证据（位置、仪表盘与虚拟用户）

- 位置新增/更新、Dashboard 全局配置读取、虚拟用户列表/新增/编辑/删除请求改用 Promise 链；请求失败有反馈，保存与列表 loading 在 `finally` 释放。虚拟用户表单 API 类型收窄为显式字段，移除该页面原有 `as never`。
- `location`、`dashboard`、`policeExtend/virtualUser` 静态扫描仅剩位置与虚拟用户表单校验 `await`；`pnpm exec vue-tsc --noEmit`、5 个文件定向 ESLint 和 Prettier 检查通过；`business-migration.test.ts`：10/10 通过。
- 本批没有位置或虚拟用户专属业务 Mock E2E；真实后端联调未执行。
- 未完成：共享表格、组织树、分页选择和请求 composable 中仍有 API `await`，需逐项迁移并验证。

#### LxSplitLayout 设计与交互验收（2026-09-28）

- 依据：`doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` 要求左侧栏默认 280px、可调范围 200–480px、折叠后主区撑满；窄屏纵向排列，表格在自身区域横向滚动。
- 完成：新增独立中文 API/Demo 并登记 VitePress 导航；修复桌面折叠后主区落到下一行的问题；宽度上限扣除实际可用容器、分隔条、按钮和间距；零尺寸环境回退到受控宽度；容器变窄自动限宽时通过 `resize` 同步宿主值；上下布局期间保留宿主宽度。
- 验证：`tests/unit/lx-split-layout.test.ts` 3/3；`tests/e2e/lx-split-layout-docs.spec.ts` 3/3，覆盖 1920px 桌面键盘/拖动/限宽、折叠后主区同行、375px 表格局部滚动/44px 按钮、HUD 深色和减少动效。Vue3 `vue-tsc --noEmit`、定向 ESLint/Prettier、lx-ui `pnpm typecheck`、134 模块库构建和 VitePress 文档构建通过；文档构建保留既有大 chunk 警告。
- 边界：这是 lx-ui 库级验证，不代表 Vue3 业务页已采用；没有运行静态 detector 或正式 Impeccable Critique，UI-11 仍待 UI-10 候选闭环后按完整流程执行。源码 detector 的 `[]` 不能作为设计审查结论。
- 下一步：继续补齐 UI-10 其余实际宿主候选；UI-10 结束后完成 UI-11 双路独立评审、逐视图 overlay、综合报告和快照/趋势，再开始 Vue3 替换。业务 API 继续使用 `.then().catch().finally()`。

### CODE-01 进行中证据（共享 UI 请求组件）

- `OrgTreeSelect` 的用户部门、整树和懒加载请求，`UserBindDialog` 绑定/解绑，`SelectPagination` 远程加载，以及 `ProTable` 远程查询改用 Promise 链；保留组织树逐层加载、确认框取消静默、列表刷新、请求序号/取消、业务错误事件和 loading 释放。
- 四个组件静态扫描无 `await`；`pnpm exec vue-tsc --noEmit`、定向 ESLint/Prettier 通过；`pro-table.test.ts` 4/4，权限矩阵部门树失败恢复 2/2 通过。
- 当前没有 SelectPagination 或 UserBindDialog 专属交互 E2E；真实后端联调未执行。
- 未完成：`useTable`、`useFetch` 仍在 composable 内等待注入的业务 API，须迁移后再做全源静态核查。

### CODE-01 完成记录（共享请求编排与全源核查）

- 改动：`useTable` 的 API 包装、搜索、刷新、重置改为 Promise 链；`useFetch` 的执行、错误处理、重试、刷新改为 Promise 链，并让同一逻辑请求的重试复用请求序号，防止旧重试覆盖新请求；修正 `useTable.mutate` 只更新内部副本的问题，使乐观更新直接作用于公开数据。
- 其余入口：菜单初始化、License 路由过滤、Navbar 登出、会话结束和 PC 页签保存不再等待业务 API；业务响应、异常反馈、loading/提交状态释放、会话 epoch 与请求竞态保护均保留。
- `rg -n "\\bawait\\b" src --glob "*.vue" --glob "*.ts"` 扫描仅命中表单校验、确认/弹窗结果、`nextTick`、动态导入和路由过滤顺序编排；未发现直接业务 API `await`。
- 验证：Vue3 全量 Vitest 15 个文件、59 项通过；权限矩阵 Playwright 14/14 通过；`vue-tsc --noEmit`、9 个文件定向 ESLint 与 Prettier 检查通过。
- 真实后端联调仍未执行，按 P1-07 跟踪；CODE-01 的代码迁移与静态核查已完成。

#### LxStatusSwitch 设计与浏览器验收（2026-09-27）

- 目标：对照 `design/状态开关 StatusSwitch/` 补齐 lx-ui 组件、中文 API/Demo 和状态行为证据；Vue3 宿主替换仍等待 UI-10 组件闭环及 UI-11 整库审查。
- 改动：保持布尔与旧 `0=开启/1=关闭` 值契约；仅关闭时确认，取消不更新；补只读呈现、主题文字对比度令牌、42×20px 轨道、键盘焦点、减少动效和窄屏 44×44px 点按区域。Demo 使用内存 Mock 并保持业务保存 `.then().catch().finally()` 风格。
- Impeccable 复核：源码 detector 对组件与 Demo 返回 `[]`；浏览器人工核查发现移动点按区域原宽度为 42px，已扩为 44px 并补宽高断言。此为组件专项建议复核，不代表 UI-11 整库 Impeccable 审查完成。
- 验证：`tests/unit/lx-status-switch.test.ts` 6/6；`tests/e2e/lx-status-switch-docs.spec.ts` 3/3，覆盖数值映射、4.5:1 文字对比度、焦点、轨道尺寸、确认取消、只读、失败恢复、375px 触控、HUD 深色与减少动效；完整 lx-ui 文档 Playwright 20/20；lx-ui 类型检查、构建（134 modules）、文档构建、定向 ESLint、Prettier 和 `git diff --check` 通过。文档构建仍有既有大于 500 kB chunk 警告；示例未请求后端。Impeccable detector 返回 `[]`。
- 未完成/阻塞：Vue3 `src/components/StatusSwitch` 仍独立使用 Element Plus，需在后续宿主替换波次对照其值映射和事件；TransferPanel 等库内候选、UI-10 整体闭环及 UI-11 整库审查仍未完成。新增权限中心、文本/字段权限和引导页继续延期。
- 下一步：按 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 候选与整库 Impeccable 审查 → Vue3 Element Plus 替换的既定顺序，继续验收 `LxTransferPanel` 等候选；完成 UI-10/UI-11 门槛后再替换宿主组件。业务 API 继续使用 `.then().catch().finally()`。

#### LxTransferPanel 设计闭环（2026-09-27）

- 目标：对照 `design/虚拟滚动树 + 双栏穿梭/` 补齐穿梭框交互和独立文档；继续遵守“基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与整库 Impeccable → Vue3 Element Plus 替换”。
- 改动：左侧操作修正为全选/反选；批量加入按 `maxCount` 禁用并在溢出时原子拒绝；树状态更新保留未加载键和既有禁用键；反选只改变当前树中已加载且可选节点；新增 `clear-all` 事件。移动端批量与逐项移除控件达到 44px。
- 文档与示例：新增独立中文 API 和内存 Mock Demo，覆盖全选、反选、上限、树外既有键、禁用项、清空、宿主加载/空/错误、HUD 深色及触屏；登记至 VitePress 侧栏和组件总览。
- 验证：`tests/unit/lx-transfer-panel.test.ts` 4/4；Vue3 Vitest 26 个文件/127 项；`tests/e2e/lx-transfer-panel-docs.spec.ts` 3/3；Vue3 定向 ESLint、Vue3 TypeScript 检查、lx-ui `vue-tsc --noEmit`、Prettier `--check`、lx-ui 构建 134 modules、VitePress 文档构建及 `git diff --check` 通过。构建保留既有大 chunk 警告。浏览器覆盖全选/反选、上限反馈、清空、宿主状态、375px 无溢出、44px 触控、键盘焦点和主题切换。没有真实后端请求。
- 未完成/边界：Vue3 `DataPermissionTree` 未替换；后续 UI-04 仍需核对其 props、实例方法、父子勾选语义和变更回传并执行宿主 Mock/E2E。本次不是权限判定实现；`change.nodes` 仅返回当前 `treeData` 可解析的节点。UI-10 仍有其他组件待验收，UI-11 整库 Impeccable 审查未开始。
- 下一步：继续其他 Vue3 实际替换候选及其独立验证；所有候选闭环后按用户要求使用 Impeccable 审查 lx-ui 组件和动效、记录建议并复验；该门槛完成后再开始 Vue3 替换。Vue3 整站 Impeccable 审查仍排在替换完成之后。

#### 新增组件总览白屏复核（2026-09-27）

- 目标：复查交接中记录的 `LxSelectPagination` 因缺少 `targetMap['user-02']` 导致总览白屏问题。
- 发现：当前 `externalItem` 对空 `targetMap` 安全回退，浏览器能渲染新增组件页全部分区且没有运行时异常；既有报告在当前代码上未复现，因此没有修改组件逻辑。
- 改动：新增 `tests/e2e/lx-new-components-overview-docs.spec.ts`，检查桌面总览的组件分区和运行错误，并检查 375px 下总览内容及页面溢出。
- 验证：新增组件总览 Playwright 2/2；桌面能看到远程选择、虚拟树和穿梭示例，375px 下 `document.documentElement.scrollWidth <= 375`。演示使用本地数据，不请求真实后端。
- 下一步：保留回归覆盖并继续其他 lx-ui 候选。既定顺序不变：基础控件与动态图标 → `LxDynamicForm` → 其他组件与整库 Impeccable → Vue3 Element Plus 替换。

#### LxDutyCalendar 组件文档与交互闭环（2026-09-28）

- 目标：完成 lx-ui 通用排班日历的独立 API/Demo、键盘和窄屏交互验证；Vue3 业务日历替换继续遵循 UI-10/UI-11 后的 UI-04 顺序。
- 改动：补全日期解析和无效月份回退、跨月方向键/Home/End 焦点移动、六周 grid/row/columnheader/gridcell 语义、含日期的班次可访问名称和窄屏 44×44px 月份按钮；非本月格使用主题表头底色以维持对比度。Demo 覆盖周起始、自定义 slot、HUD 和宿主空/加载/失败/只读状态；无业务 API 或状态 props。
- 验证：`tests/unit/lx-duty-calendar.test.ts` 8/8；`tests/e2e/lx-duty-calendar-docs.spec.ts` 3/3，覆盖 42 格、跨月年份、键盘焦点、状态恢复、375/320px、主题、文字对比和减少动效；lx-ui `pnpm typecheck`、134 模块库构建、VitePress 文档构建、定向 ESLint/Prettier 与 `git diff --check` 通过。首次 E2E 暴露 Demo 将默认插件误作具名组件导入，修正后全部通过。VitePress 仍提示既有大 chunk；pnpm 的 `onlyBuiltDependencies` 字段提示也仍存在。
- Impeccable 与边界：本轮不执行正式 Critique；静态 `[]` 只表示 detector 零命中，不能代替视觉评审。UI-11 仍依赖 UI-10 全部候选闭环。当前没有专属 `design/` 日历稿；Vue3 `DutyCalendar.vue` 仍依赖 `calendarList`、loading、详情 popover、月份查询事件及 `getSearchObj/goPrevMonth/goNextMonth` 实例方法，通用库组件尚未覆盖这些业务契约，不能直接替换。
- 下一步：继续其他 UI-10 候选；所有候选闭环后按 Impeccable skill 执行双路隔离评审、可用浏览器 overlay、综合报告和快照，再开始 Vue3 组件替换。业务 API 继续使用 `.then().catch().finally()`。

#### LxPagination 受控交互与宿主适配回归（2026-09-28）

- 目标：补全既有 LxPagination 的 Props/events、演示状态和宿主适配回归；保留 Vue3 `page/limit/pagination` 旧契约。
- 改动：补齐中文 API 对 `layout`、`background`、`update:page-size` 和事件顺序的说明；更新 `COMPONENT-SPEC.md` 中与实现不符的事件名；Demo 展示默认/自定义 layout、背景样式、autoReset/autoScroll、简体中文分页选项和文档站主题；新增库组件与宿主适配器单测、桌面/375px 文档 Playwright。工作区已有的 `layout`/`background` 和适配器横向滚动改动继续保留。
- 验证：库组件 5 项、Vue3 适配器 2 项单测通过；文档 Playwright 3/3；Vue3 全量 Vitest 34 个文件/173 项通过，`vue-tsc --noEmit`、lx-ui 类型检查和 134 模块构建通过；定向 ESLint、修改文件 Prettier、VitePress 文档构建通过。文档构建保留既有大 chunk 警告，pnpm 提示 `onlyBuiltDependencies` 字段迁移。
- Impeccable：对 `LxPagination/index.vue`、Demo、文档 Markdown 与 Vue3 适配器执行 skill 静态 detector，stdout `[]`、stderr 无错误、退出码 0，含义仅为这些源码没有命中当前静态规则；这不是完整视觉验收。UI-11 整库 Critique 仍等待 UI-10 其余组件闭环，尚未生成正式评分或快照。
- 边界：Demo 使用本地状态，不请求业务 API；Vue3 仍有 4 处页面直接使用 `el-pagination`，需在 UI-04 按各页交互契约逐页迁移。宿主 `Pagination` 适配器的两个回归测试不代表 4 个页面已经替换，也不代表真实后端联调。
- 下一步：继续 UI-10 其他组件候选；完成后按 Impeccable Critique 双路独立评审、主题/状态 overlay、综合报告和快照/趋势，再开始 Vue3 批量组件替换。

#### LxPasswordInput 中文文档与状态 Demo 闭环（2026-09-28）

- 目标：补齐现有密码输入组件缺少的独立 API 文档、状态 Demo 和真实浏览器证据，完成表单基础组件的资料闭环。
- 改动：新增 `docs/components/lxpasswordinput.md`、组件站导航入口和 `src/components/LxPasswordInput/demo/basic.vue`；文档说明全部 props、事件、实例方法、属性透传、剪贴板拦截及自动填充边界。Demo 使用内存样例，展示显隐、清空、只读、禁用及 focus/blur/select，不发起请求。
- 验证：`tests/e2e/lx-password-input-docs.spec.ts` 3/3 通过，覆盖明文切换/清空/输入事件、实例方法/焦点/剪贴板事件、只读禁用和 375px HUD 无横向溢出；Vue3 单测全量 34 文件/173 项通过；lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs`、定向 Prettier 和 `git diff --check` 通过；本轮全菜单 Mock 预览 E2E 2/2 通过。
- Impeccable 与边界：本轮未运行 detector 或正式 Critique；浏览器文档页已打开并核实导航和渲染。新增 Demo 不增加自定义动效。整库 UI-11 仍需在 UI-10 候选闭环后进行双路独立评审、主题/状态浏览器证据、综合报告及快照/趋势；Vue3 密码组件已有适配器，但登录真实联调仍受后端环境限制。
- 下一步：继续核实 UI-10 剩余组件文档/状态/行为证据；完成后按 Impeccable skill 正式审查 lx-ui，再开始 Vue3 Element Plus 迁移。业务 API 继续使用 `.then().catch().finally()`。

#### 壳层组件交互修复与 Impeccable 判定校准（2026-09-28）

- 目标：关闭 `LxBreadcrumb`、`LxNavbar`、`LxTabsBar`、`LxPageCard` 文档 Demo 的浏览器回归，并核实静态 detector 多次输出 `[]` 的含义。
- 修复：通知徽标增加 `pointer-events: none`，避免覆盖通知按钮点击区域；面包屑 Demo 改用保留的 `.test` 外部地址，隔离 VitePress 对同源链接的路由接管；有标题的 `LxPageCard` 使用 `useId()` 将标题关联为具名 region；页签 E2E 使用精确 accessible name，窄屏断言限定于组件 Demo 容器。
- 验证：`tests/e2e/lx-shell-components-docs.spec.ts` 4/4 通过；Vue3 `vue-tsc --noEmit`、该 E2E 文件 ESLint、四个改动文件 Prettier 检查通过；lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs` 通过。文档构建保留既有大于 500 kB 的 chunk 提示。
- Impeccable 判定：本轮 `detect.mjs --json linkx-fe/src/components/LxIcon/index.vue` 输出 `[]`、退出码 0，是有效的源码静态零命中；`.impeccable/critique` 没有正式快照。此前 URL CLI 因 Puppeteer 缺失而非零退出，即使输出 `[]` 仍是失败。用户的疑虑成立于把 detector 结果当成整体 Critique；UI-11 继续未完成，不把本轮静态结果记作视觉审查通过。
- 边界与下一步：本轮是壳层组件行为修复和 Impeccable 用法诊断，不是正式 Critique，也不代表 Vue3 业务页已完成宿主回归。继续闭环 UI-10 候选；随后依 `reference/critique.md` 做双路隔离评估、浏览器证据、综合报告和快照，再进入 Vue3 页面替换。

#### LxIcon 图标总览 Impeccable 正式 Critique（2026-09-28）

- 目标与方法：按 Impeccable `reference/critique.md` 对 `linkx-fe/src/components/LxIcon/index.vue` 和可视页 `/components/lxicons.html` 做双路隔离评审。Assessment A 独立检查页面与文档；Assessment B 执行静态 detector、新建浏览器标签、动态注入预检与 overlay。
- 判定：用户对反复看到 `[]` 的疑虑成立于将静态零命中当作整体验收。`detect.mjs --json linkx-fe/src/components/LxIcon/index.vue` 退出码 0、JSON `[]` 是该源码目标的有效静态结果；它不评价运行后的 VitePress 页面、设计质量或图标动画。
- 浏览器证据：页面 overlay 标题报 3 条，实际列出 4 项：`buried-raster`（文档代码区 `button.copy`）、`overused-font`（body 的 Inter）、`layout-transition`（body 高度/内边距过渡）、`first-viewport-column-overflow`（VitePress `.container` 列宽）。它们是有效页面信号，但主要落在文档外壳/代码区，需按组件边界复核；标题计数不一致也应作为 detector 输出质量问题记录。临时 detector 服务已停止，可见 `[Human]` 标签保留 overlay。
- 评审结果：27/40，可接受。P1 暗色主题分组标题对比不足；P2 P1/P2 大组全部展开导致扫描成本高、文档尺寸 16/18/20 与设计稿扩展 24px 说明不一致；P3 双侧导航挤压图标网格。次要观察包括 `DESIGN-SPEC §6` 引用不准及缺少中文语义标签。完整报告见 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`；该 slug 首次趋势为 27/40。
- 覆盖边界与补充检查：独立 Critique 的 A 评审没有直接操作图标 hover/focus；随后主会话在真实浏览器验证 `delete` hover 触发 `lx-icon-delete-shake`，并确认 `prefers-reduced-motion: reduce` 时 animation/transform 关闭、transition 为 `0s`，恢复默认偏好后悬浮效果恢复。后续 E2E 已覆盖键盘 focus；其他代表性动效名称和动画中途状态仍未验证。LxIcon 单目标 Critique 已完成，整库 UI-11 仍待 UI-10 其余候选闭环后覆盖其他组件、主题/状态和动效；Vue3 替换后另做整站审查。
- 下一步：处理 LxIcon 的主题对比、分组浏览和尺寸契约，补齐其他代表性图标动效验证；继续 UI-10 其余候选，保持“基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件 → Vue3 Element Plus 替换”的顺序。

#### LxIcon 图标卡片键盘焦点边框对齐（2026-09-28）

- 发现：图标卡片使用向外偏移的键盘焦点轮廓，与卡片自身边框之间留有间隔，形成两层错位的蓝色边框。
- 调整：文档示例将焦点态改为卡片自身 2px `--lx-color-primary` 边框，移除额外 outline；固定 `box-sizing: border-box`，并仅过渡颜色和阴影，避免边框变粗时改变卡片外部尺寸。
- 验证：`tests/e2e/lx-icon-docs.spec.ts` 1/1 通过，覆盖键盘焦点边框颜色/宽度、无额外 outline 和焦点前后尺寸一致；ESLint、Prettier、`git diff --check` 及 VitePress 文档构建通过。手动浏览器确认桌面 108×84px、320px 视口无横向溢出。构建保留既有大包和 pnpm 配置提示。该项是针对焦点视觉的修正，不代表整库 UI-11 或其他动态图标动效审查完成。

#### LxIcon 焦点边框光学对齐复验（2026-09-28）

- 复核发现：上一轮将焦点边框加粗到 2px 虽固定了卡片尺寸，但蓝色内缘向卡片内部偏移 1px，视觉上仍像与原边界不齐。
- 调整：保留原 1px 边框的外侧位置并切换为主题主色；增加贴合边框内侧的 1px inset 焦点线，形成 2px 可见键盘指标，不绘制向外偏移的蓝色 outline。
- 验证：图标文档 Playwright 1/1 通过；ESLint、Prettier、`git diff --check` 和 VitePress 文档构建通过。系统 Chrome 实测稳定焦点态桌面卡片为 108×84px、390px 为 108.66×84px、320px 为 132×84px；三种宽度均保持 1px 主色外边框、1px inset 主色线、无 outline 且文档无横向溢出。detector `--scope layout` 输出 `[]`、stderr 空、退出码 0，仅表示静态规则零命中。
- 边界与下一步：此为 LxIcon 文档卡片的定向视觉修正，不代表整库 UI-11 Critique、其他图标动效覆盖或 Vue3 整站 UI-12 完成；继续按既定组件计划推进。

#### LxIcon 焦点边框单线样式复验（2026-09-28）

- 反馈：1px 主色边框叠加 1px inset 阴影仍呈双层蓝线，整体不够利落。
- 调整：焦点态只将卡片自身 1px 边框切换为主色，并应用 `--lx-color-primary-light` 浅底；移除 inset 阴影和 outline，保持 `border-box` 外部尺寸。
- 验证：LxIcon 文档 Playwright 桌面与 Pixel 7 两项均通过，检查边框颜色/宽度、浅底、无阴影/outline、焦点前后尺寸稳定及 320px 无横向溢出；浏览器实测 email 卡片键盘焦点与自身边框重合。`pnpm build:docs`、定向 ESLint/Prettier、`git diff --check` 通过。Impeccable `detect.mjs --json --scope layout linkx-fe/docs/components/lxicons.md` 输出 `[]`、stderr 为空、退出码 0，仅代表静态规则零命中。
- 边界：仅调整 LxIcon 文档总览卡片焦点样式，不代表整库 UI-11 Critique、其余图标动效覆盖或 Vue3 替换后 UI-12 完成。

#### UI-01 多选下拉内侧边线对齐复修（2026-09-28）

- 用户反馈：多选下拉仍有外圈观感问题。复核发现它使用真实 border，而输入、日期和文本域使用控件内部 inset 边线；两套绘制层在圆角和边缘抗锯齿上不一致。
- 调整：单选/多选选择器统一改为 border: 0 + 控件内部 1px box-shadow inset；普通、悬停、聚焦和错误态只切换该内侧边线颜色，取消选择器外扩轮廓。恢复 4px 12px 内边距，保留 border-box、32px 高度、标签折叠和键盘展开语义。
- 验证：4174 真实浏览器计算样式为 border: 0、box-shadow: rgb(0, 96, 169) 0 0 0 1px inset、outline: none，盒尺寸 319×32px；定向 Element Bridge Playwright 断言已通过（1 项，测试进程在完成后因复用文档服务保持运行，未再执行终止性重跑）。Impeccable 两路复评等待当前样式稳定后补记。
- 边界：只处理 lx-ui 基础控件桥接的多选/单选边线层级；Vue3 业务表单仍按 UI-04 保留原校验、提交和权限契约。

### UI-13-P1 / DynamicForm 字段反馈与演示设置（2026-09-30）

- Assessment A/B 复核确认：动态表单远程负责人失败状态此前主要出现在演示设置区和全局 footer，脱离负责人字段；本波新增 `LxDynamicFormField.feedback` 与 `LxDynamicFormFieldFeedback`，支持字段级 loading/empty/error 文案和宿主 `retry()`，错误状态通过稳定 ID 与 `aria-describedby` 关联控件。
- Demo 仍按默认关闭的“演示设置（布局、禁用、主题与 Mock 状态）”渐进披露；成功数量保留在设置区，空结果、加载和失败迁移到负责人字段，失败只保留字段内“重试”动作，避免重复文案和无关 footer 状态。
- 类型、公开入口、中文 API、组件样式和 DynamicForm 定向单测同步；请求仍由 Demo/宿主按 `.then().catch().finally()` 编排，`retry()` 只触发宿主恢复流程。
- 验证状态：代码修改已完成，等待 `pnpm typecheck`、定向 Vitest/Playwright、Prettier 和文档构建结果后更新为正式交接结论。Impeccable detector 若输出 `[]` 仍需同时记录 JSON、stderr、退出码及浏览器证据，不能单独作为通过。

## 2026-10-04 Wave 0 结项与 Wave 1 入口

- `LxDatePicker` 使用实例 UID 限定 Fragment 根下实际触发器，将宿主 `aria-describedby` 同步到单值/区间输入，并清理上次由组件管理的说明 ID。
- 当前工作区 DatePicker/DynamicForm 单测 36/36；lx-ui 类型、库构建（196 modules）、文档构建和 DatePicker 文档 E2E 1/1 通过；独立代码审核未发现可复现缺陷，目标 ESLint、Prettier 与差异检查通过。
- 正式 Impeccable A/B、修后 overlay、综合报告及 snapshot/trend 仍待完成；本结项不代表 DynamicForm/Form 或基础控件已完成视觉审查。
- 下一执行入口：Wave 1 基础控件第一组，按 `PROJECT-FOLLOWUP-BREAKDOWN.md` 的状态矩阵与证据门槛逐项推进。

## 2026-10-05 Wave 2 / LxSwitch 结项与后续入口

- 实现与 E2E 已由 `1679d9c fix(lx-ui): align switch behavior and responsive demo` 提交。LxSwitch 单测 14/14、VitePress 文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、组件库构建（196 modules）和文档构建通过。VitePress 有既有大包警告。
- 独立代码复核批准，未发现可复现 P0–P2；测试缺口记录为真实触摸点击、ARIA 描述属性动态移除及 Demo 定时器运行期间卸载。
- Impeccable A/B 综合 32/40，是三项有界修后评分，基线 29/40 的其他分项未重评。三份 detector 为有效 `[]`、stderr 空、退出码 0；只说明静态规则零命中。移动根宽异常归因于注入标记；无用户可见 overlay 声明。正式快照为 `.impeccable/critique/2026-10-05T13-00-21Z__linkx-fe-src-components-lxswitch-index-vue.md`，目标首次正式记录，趋势为 32/40。
- P2 移动文档侧栏隐藏时的键盘顺序转入共享壳层复验；生产高影响动作的确认、授权审计及失败补偿转入 Vue3 宿主迁移，必须以真实业务/API 契约为依据。P3 术语说明保留为中文文档改进，不扩大通用组件 API。
- 下一执行项为 `LxPasswordInput` 的设计严格对照与正式复核；随后完成动态图标，再开展 `LxDynamicForm` 专项。Vue3 Element Plus 替换继续冻结，直到基础组件与动态图标门槛满足。实现/E2E 与计划、审计、交接及 Critique 证据必须按 `fix(lx-ui)`、`docs(project)` 分开提交并推送；每次暂存仅包含本波白名单。
