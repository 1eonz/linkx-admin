# LinkX 项目交接记录

## [2026-10-20] LxTag 第六批宿主替换

- **改动**：南向接口应用类型、用户选择弹窗状态、代理管理分类/优先级/可见范围改用 `LxTag`，保留分类关闭、循环列表、条件和文案；`danger` 映射为 `error`。
- **事实**：直接 `<el-tag>` 由 14 降为 **9**，剩余均属于权限树路径或用户/角色状态场景，按用户要求后置。
- **验证**：Vue3 `vue-tsc --noEmit`、目标 Prettier、Mock 全菜单 **6/6** 通过；真实权限/后端联调仍开放。

## [2026-10-20] LxTag 第五批宿主替换

- **改动**：客户端详情授权状态、第三方应用分组/类型和代理文件请求方式改用 `LxTag`；保留条件、循环、文案和 class，`danger` 映射为 `error`。
- **事实**：直接 `<el-tag>` 由 18 降为 **14**；剩余标签涉及权限路径/状态和代理分类优先级，按后置/能力差异跟踪。
- **验证**：Vue3 `vue-tsc --noEmit`、目标 Prettier、Mock 全菜单 **6/6** 通过；真实权限和后端联调仍未执行。

## [2026-10-20] LxTag 第四批宿主替换

- **改动**：事件类型第三方状态、PC/H5 布局配置标签改用 `LxTag`，保留 slot、状态条件和文案；`danger` 映射为 `error`。
- **事实**：直接 `<el-tag>` 由 22 降为 **18**；剩余标签含权限路径、循环内容和代理状态等不同能力场景。
- **验证**：Vue3 `vue-tsc --noEmit`、目标 Prettier、Mock 全菜单 **6/6** 通过；正式 UI-10/UI-11 和 Element Plus 删除门禁仍开放。

## [2026-10-20] LxTag 第三批宿主替换

- **改动**：节点管理入向、出向和客户端管理三页的标签/授权状态列改用 `LxTag`，保留空值、授权、过期条件和原表格插槽。
- **事实**：直接 `<el-tag>` 由 31 降为 **22**；`danger` 映射为 lx-ui `error`，没有改变业务权限和请求契约。
- **验证**：Vue3 `vue-tsc --noEmit`、目标 Prettier、Mock 全菜单 **6/6** 通过；剩余标签的 effect、关闭、插槽和权限状态继续开放。

## [2026-10-20] LxTag 第二批宿主替换

- **改动**：第三方应用列表、第三方详情弹窗和地图配置激活列改用 `LxTag`；保留紧凑/标准状态条件、文案和 class，`danger` 映射为 `error`。
- **事实**：源码直接 `<el-tag>` 由 35 降为 **31**；剩余标签含不同 effect、关闭、插槽或权限状态，继续逐页核对。
- **验证**：Vue3 `vue-tsc --noEmit`、目标文件 Prettier、Mock 全菜单 **6/6** 通过；UI-10/UI-11、真实后端和 Element Plus 删除门禁仍开放。

## [2026-10-20] LxTag 首批宿主替换

- **改动**：`baseData/globals` 状态列与 `nodeManage/serverManage` 标签列改用 `LxTag`；Element Plus `danger` 映射为 `error`，保留原文案、条件和表格插槽。
- **事实**：源码重新扫描后直接 `<el-tag>` 为 **35** 处，旧矩阵的 38 处已校正；剩余场景含 effect、关闭、插槽或状态组合差异，不能一次性替换。
- **验证**：Vue3 `vue-tsc --noEmit`、两个目标文件 Prettier 通过；UI-10/UI-11、页面 Mock 状态和真实后端联调仍开放。

## [2026-10-20] Vue3 剩余 LxEmpty 宿主替换

- **改动**：5 个复杂空态改用 `LxEmpty`，覆盖表格 `#empty` 插槽、详情条件空态和两个字段映射弹窗；保留 `v-if`、原文案、`image-size="80"` 与 `mapper-empty` class。
- **迁移事实**：`other-admin/admin-vue3/src/views` 直接使用 `el-empty` 数量由 5 降为 **0**。
- **边界**：这只收敛展示组件，不改变请求链、权限键、加载/失败状态或 Element Plus 依赖；页面级空/错/权限状态和 UI-10/UI-11 仍需继续验收。

## [2026-10-20] LxInput 边框测试定位修复

- **排查结论**：`LxInput` 前后缀、密码和透传场景的计算样式均保留 `1px solid` 外边框；此前专项测试失败是测试误使用 Vue3 宿主服务且通过 `label` 祖先关系定位，未命中文档 Demo 控件，不是组件或 Demo 样式缺失。
- **处理**：基础控件文档测试固定使用本地 4177 文档服务，按真实输入节点 `id` 等待渲染，再定位最近的 `LxInput` 根节点和 wrapper；不在 Demo 增加重复边框样式。
- **验证**：边框专项 Playwright **1/1**、目标文件 Prettier 通过；4177 页面计算样式确认普通、密码、透传 wrapper 及复合根节点均为非透明 `1px` 边框。
- **边界**：正式 Impeccable A/B、overlay、snapshot/trend 和 UI-10/UI-11 全库门禁仍按原计划开放。

## [2026-10-20] Vue3 分页迁移矩阵事实校正

- **复核**：重新扫描 `other-admin/admin-vue3/src`，业务页面直接使用 `el-pagination` 为 **0**；共享 `src/components/Pagination` 内部已使用 `LxPagination` 并保留旧 `page/limit/pagination` 事件适配。
- **处理**：迁移矩阵已将分页计数由 4 修正为 0，避免把历史盘点误当作当前待迁移页面数量。
- **边界**：真实分页接口、空/错/权限不足/取消、嵌套滚动和页面级 Mock 仍需按页面契约验收；本项不代表 Vue3 `element-plus` 可删除或 UI-04/UI-10/UI-11 已完成。

## [2026-10-20] Vue3 首批 LxEmpty 宿主替换

- **改动**：6 个纯占位页面改用 `LxEmpty`，保留原空态文案和容器布局；复杂条件空态暂未替换。
- **验证**：Vue3 `vue-tsc --noEmit`、目标文件 Prettier 和 Mock 全菜单回归 **6/6** 通过。
- **矩阵**：`el-empty` 直接使用从 15 修正为 9；剩余 9 个页面需按条件、插槽、加载/失败和权限状态逐页回归。
- **边界**：未删除 `element-plus`，未改变请求链、权限标识或页面数据契约；正式 UI-10/UI-11 仍开放。

## [2026-10-20] Vue3 第二批 LxEmpty 宿主替换

- **改动**：4 个条件空态改用 `LxEmpty`，保留原 `v-if`、业务树/表格和文案；剩余复杂空态暂未机械替换。
- **验证**：Vue3 类型检查、目标格式和 Mock 全菜单回归 **6/6** 通过。
- **矩阵**：`el-empty` 直接使用从 9 修正为 5；剩余 5 个调用需补业务状态、插槽和失败恢复证据。
- **边界**：请求链、权限标识和 Element Plus 依赖未改变；UI-10/UI-11 仍开放。

## [2026-10-20] LxPagination P1 修复与默认值冲突

- **改动**：`LxPagination` 新增 `ariaLabel`，由语义 `nav` 提供分页导航名称；移动断点将 prev/next/页码/条数触发器命中区提升到 44px，桌面仍保持 28px 紧凑视觉。
- **验证**：单测 **7/7**、文档 E2E **3/3**、lx-ui 类型检查和目标 Prettier 通过；现有业务调用均显式传入分页大小，未改变页面请求参数。
- **评审**：A **27/40（Acceptable）**；B 三目标 detector 为合法 `[]`/空/`0`，独立 4179 服务 6 视图无页面错误、失败请求和页面横溢出。overlay 命中均需归因，正式 snapshot/trend 尚未完成。
- **阻塞**：设计规范建议默认 20 条并含 jumper，当前实现兼容默认 10 条且不含 jumper；已更新规范说明，待产品确认后统一，不臆改默认值。加载/失败/重试状态继续由宿主组合。

## [2026-10-20] LxPagination Assessment B 当前版证据

- **静态**：三个目标 detector 均输出合法 `[]`，stderr 为空，退出码 `0`；原始文件保存在 `tmp-pagination-assessment-b-current/`。
- **浏览器**：隔离 4179 服务 + 新 CDP context 完成 Light/HUD、1280/375/320px、reduced-motion 6 视图；HTTP 200、页面错误/失败请求/console error 为 0，窄屏分页区域局部横向滚动，分页 region 可键盘聚焦，下一页可从 4 切换到 5。
- **审查边界**：overlay 7 项命中归属于文档壳层、API 表格、复制按钮或全局样式，需综合评审逐条归因；Assessment A、正式 snapshot/trend、真实后端和 UI-10 仍未完成。

## [2026-10-20] LxDescriptions 长状态播报语义收口

- **改动**：长状态展开按钮内部的 `LxStatusDot` 增加 `aria-hidden="true"`，按钮自身保留字段和值的完整可访问名称；短状态不受影响。
- **验证**：LxDescriptions 单测 **10/10**、文档 E2E **3/3**、组件类型检查和目标 Prettier 通过。E2E 已从 `role="img"` 查询调整为视觉节点查询，避免把预期隐藏的子节点当作失败。
- **未完成**：真实 NVDA/VoiceOver、复杂值格式化、复制失败恢复和正式 UI-10/UI-11 仍开放。

## [2026-10-20] LxDescriptions 移动端展开入口收口

- **Assessment A**：当前源码评审 **32/40（Good）**，无 P0；P1 为普通长值/长状态展开入口缺少 44px 触控高度，P2/P3 详见 `tmp-descriptions-assessment-a-current.md`。
- **Assessment B**：三个 detector 均为合法 `[]`、stderr 空、退出码 `0`；隔离 4180 文档服务完成 6 个主题/窄屏/减少动效视图，页面错误、失败请求和横溢出为 0，证据见 `tmp-descriptions-assessment-b-current.md`。A 未形成可靠自动化截图，B 的 CDP 合成 Enter 未切换状态，均不能替代正式真实键盘复验。
- **修复与验证**：移动断点的普通长值、长状态按钮增加 `min-height: 44px` 和上下内边距；单测 **10/10**、文档 E2E **3/3**、组件类型检查和目标 Prettier 通过。
- **未关闭**：长状态嵌套 `role=img`、复杂 `unknown` 值、复制失败恢复、主题多实例竞态及正式 UI-10/UI-11 继续开放。

## [2026-10-20] LxInput 边框专项复跑

- **验证**：运行 `lx-base-controls-docs.spec.ts` 的复合前后缀及前后缀/密码/透传边框用例，结果 **2/2** 通过。
- **结论**：当前边框由 `LxInput` 组件的 `--lx-control-border` 和复合根节点规则提供，不是 Demo 缺少样式。正式 Impeccable A/B、UI-10/UI-11 和真实后端联调仍开放。

## [2026-10-20] LxFormErrorBanner 空内容播报语义收口

- **改动**：根节点 `role` 改为按内容条件输出；空内容同时移除 `aria-live` 与 `aria-atomic`，避免读屏器把空横幅当作紧急区域。
- **验证**：单测 **3/3**、文档 E2E **1/1**、`vue-tsc --noEmit` 和目标测试格式检查通过；有内容场景仍保持主题、键盘、窄屏和 assertive 播报。
- **后续**：真实读屏器、首错字段聚焦、重试动作及动态清单播报仍需宿主契约，不新增业务 API。

## [2026-10-20] 历史代码审查 Major 状态复核

- **复核范围**：核对 `CODE-REVIEW.md` 的全局注册、SearchBar 级联值、SelectTree 懒加载以及 useFetch/useTable 竞态条目。
- **当前证据**：安装注册、SearchBar 和 SelectTree 单测 **15/15**；useFetch/useTable 竞态与取消单测 **9/9**。当前实现已分别使用显式组件注册表、原值级联传递、失败重试事件和 signal/请求序号保护。
- **交接结论**：上述历史 Major 不再重复排期；提交锁、License 失败保留、触底分页、宿主 AuthImg、ColForm 远程搜索以及页面级权限/真实 API 联调仍保持开放。测试结果不替代正式 Impeccable A/B 或 UI-10 全库门禁。

## [2026-10-20] v-loadmore Teleport 绑定复核

- **当前实现**：`v-loadmore` 已通过控件 `aria-controls` 定位 teleported 下拉，兼容 Element Plus 滚动容器，并在打开、DOM 变化和卸载时同步/解绑监听。
- **验证**：`loadmore.test.ts` **3/3**，与 `use-fetch.test.ts` 联跑 **12/12**。这证明指令层查找和清理契约，不代表三处页面真实 API 或权限联调完成。

## [2026-10-20] Major #7–#11 当前实现复核

- **结论**：License 失败保留、AuthImg 失败与取消清理、写操作提交锁、ColForm 远程查询竞态均已在当前代码中处理。
- **证据**：`auth-store.test.ts`、`auth-img.test.ts`、`business-migration.test.ts` **21/21**；业务请求链仍为 Promise 链。页面级 Mock 组合和真实后端/权限联调继续开放。

## [2026-10-20] 评估临时产物忽略规则

- 根 `.gitignore` 新增 `.impeccable-*`，与已有 `.pnpm-store/`、`.impeccable/` 规则配合，避免 detector 和截图临时文件进入暂存区。
- 未删除或重置任何既有评估产物；正式报告仍按文档路径单独归档。

## [2026-10-20] LxFormErrorBanner 双路 Critique 与说明可读性修复

- **评审**：Assessment A 独立评分 **27/40（Good）**，无 P0；P1 为宿主首错字段/恢复路径未形成统一契约，P2 为动态 live region 分层、Demo 信息密度和正文可读性，P3 为空内容仍保留 `role="alert"`。
- **Assessment B**：组件、Demo、文档 detector 均为合法 JSON `[]`、stderr 为空、退出码 `0`；Light/HUD 桌面/窄屏及 reduced-motion 四视图 overlay 注入成功，页面错误、失败请求和错误响应均为 `0`。窄屏页面宽度信号来自隐藏 VitePress 侧栏，组件自身无横溢出。
- **修复**：说明正文由 11px 调整为 12px、1.5 倍行高，中文 API 与 E2E 同步；单测 **3/3**、文档 E2E **1/1**、`vue-tsc --noEmit` 通过。未改变组件 Props、插槽、请求链或权限契约。
- **证据**：正式快照已写入 `.impeccable/critique/2026-10-19T19-09-55Z__rc-components-lxformerrorbanner-index-vue-94bff5bd.md`；A/B 原始记录在本地临时评审文件中。静态 `[]` 不单独代表正式全库门禁通过。
- **后续**：真实宿主需确认首错字段聚焦、重试动作、字段清单播报和空 `role="alert"` 的 NVDA/VoiceOver 语义；在可信业务契约前不新增公共 API、不开始该页面迁移。

## [2026-10-20] LxInput 前后缀/密码/透传边框当前运行时复核

- **复核结论**：问题属于 `LxInput` 组件样式层，不是 Demo 外壳。当前 4177 文档运行时中，案件编码复合输入、涉密核验密码输入、联系电话透传输入的 `.el-input__wrapper` 均计算为 `1px solid rgb(220, 223, 230)`；复合输入根节点也保留同样的连续外框。
- **验证**：运行 `Input 前后缀、密码和透传场景保留可见外边框` Playwright 专项 **1/1** 通过；断言普通 wrapper 与复合根节点为 `1px solid` 且边框颜色非透明，并直接读取 `/components/lxinput` 页面计算样式确认 `--lx-control-border` 令牌生效。Node/npm 弃用提示属于环境输出，不是页面或代码失败。
- **处理建议**：若浏览器仍显示无边框，先硬刷新 `/components/lxinput`（或重启旧的 4177 Vite 进程）以清除旧 CSS/HMR 缓存；不在 Demo 中添加重复边框规则。
- **边界**：本次是运行时复核，不改变 props、事件、插槽或 API 请求风格；正式 Impeccable A/B、overlay、snapshot/trend 和 UI-10 全库门禁仍开放。

## [2026-10-20] LxMetricCard 只读语义与标题运行时交接

- **改动**：移除只读卡片桌面 hover 抬升；趋势文本改为两行截断并保留完整 `title`/`aria-label`，值保留完整 `title`；模板显式使用 `props.headingLevel`，修复 VitePress 直接编译时标题节点不渲染的问题。
- **验证**：LxMetricCard 单测 **17/17**、4177 文档 E2E **3/3**、lx-ui `vue-tsc`、206 modules 构建、目标 ESLint、Prettier 和差异检查通过。重启旧文档进程后页面标题、卡片标题和提示属性均可见。
- **审查边界**：本次是行为与可用性 P2 收口，不替代正式 Impeccable A/B；历史 A **31/40** 与 B 的窄屏文档壳层横溢出归因仍需独立 snapshot/trend 和 UI-10 归档。真实详情宿主、权限和后端联调不在本波。
- **后续**：按组件矩阵继续收口剩余正式视觉证据；业务 API 仍保持 `.then().catch().finally()`，Vue3 Element Plus 替换继续等待全库门禁。

## [2026-10-20] LxUpload 手动队列提示与双路评审

- **改动**：手动模式的拖拽区、非拖拽按钮和选择后 live region 现在明确区分“加入队列”和“真正提交”；自动上传模式不变。新增单测和文档 E2E 断言。
- **验证**：单测 **40/40**；4178 文档 E2E **9/9**；目标 Prettier 通过。Assessment A **29/40**；B detector 三目标为 JSON `[]`/空 stderr/退出码 `0`，浏览器五视图和状态操作均无页面错误、失败请求、横溢出，触控目标满足 44px。
- **后续**：宿主错误原文安全映射、批量上传失败摘要和 Demo 信息密度仍待产品/接口契约；B 的预期 Mock `UploadAjaxError` 控制台输出不作为页面失败。正式 Impeccable snapshot/trend 和 UI-10 不关闭，真实上传、权限和 Vue3 页面迁移继续后置。

## [2026-10-20] LxMetricCard 趋势语义与标题层级收口

- **修复**：趋势图标不再根据 `trendStatus` 猜测上升/下降；只有显式传入 `trendDirection=up/down/flat` 才渲染对应图标，避免将在线、忙碌等状态误读为趋势。标题默认使用 `h3`，新增 `headingLevel` 类型并保留标题/标签插槽契约。
- **同步**：Demo 首张卡补充显式上行方向；中文 API 文档和单测同步更新。
- **验证**：LxMetricCard 单测 **16/16**；4178 隔离文档 Playwright **3/3**；lx-ui typecheck、生产构建、目标 Prettier 和 `git diff --check` 通过。组件、Demo、文档 detector 均为合法 JSON `[]`、退出码 `0`；stderr 含 npm 配置弃用警告，不能称为干净扫描。
- **审查边界**：Assessment A **31/40** 记录只读卡 hover 暗示可点击、Demo 首屏密度和长值截断等 P2；Assessment B 发现窄屏页面级约 `630px > 390px` 横溢出，卡片自身边界正常，暂归文档壳层/表格待归因。未取得独立视觉 overlay/snapshot，正式 Impeccable 与 UI-10 仍开放。
- **后续**：继续按组件门禁队列处理未关闭项；权限、页面引导、真实后端和 Vue3 Element Plus 替换保持后置。业务 API 继续使用 `.then().catch().finally()`。

## [2026-10-20] LxInput 边框与触屏清空入口交接

- **排查结论**：前后缀、密码和透传输入框的边框缺失属于组件样式层问题，不是 Demo 问题；`LxInput` 已统一使用控件边框令牌绘制普通 wrapper 和复合根节点外框。
- **本次修复**：清空按钮在 390px 窄屏由 CSS 设置为可见，但模板的 `aria-hidden` 仍使可访问角色查询不到；已移除冗余 `aria-hidden`，保留隐藏态视觉规则、禁用/只读限制和键盘顺序控制。
- **验证**：LxInput 单测 **13/13**；基础控件文档 Playwright **14/14**；目标文件 Prettier 通过。运行日志中的 Node/npm 弃用警告属于环境输出，不计为代码失败。
- **后续**：正式 Impeccable A/B、浏览器 overlay 与 snapshot/trend 证据仍未完成，不能用 detector `[]` 单独宣布 UI-10 通过；Vue3 页面替换、权限和真实后端联调继续后置。业务 API 仍保持 `.then().catch().finally()`。

## [2026-10-20] LxMetricCard Impeccable detector 复验边界

- 组件、Demo、中文文档 detector 均为 JSON `[]`、退出码 `0`，但 stderr 有 npm 项目配置弃用警告；按规则不能伪称干净空 stderr 或正式 Critique 通过。
- 文档 Playwright **3/3**、单测 **15/15** 继续作为当前行为证据；需要可变浏览器运行时后补 Light/HUD、窄屏、reduced-motion、overlay 和 snapshot/trend。

## [2026-10-20] LxMetricCard 状态决策与宿主失败边界交接

- **改动**：Demo 增加显式 `status` 与旧 `valueType` 冲突、趋势方向与趋势状态分离、角标独立状态的可见示例；中文文档补充优先级矩阵及 stale/失败不转 0 规则。
- **验证**：单测 **15/15**、4177 文档 E2E **3/3**、typecheck、目标 Prettier 和差异检查通过；E2E 确认冲突示例显示 `success` 状态和上行图标。
- **后续**：两个 P1 仍需正式 Impeccable A/B 与宿主业务契约确认；真实接口、权限、页面迁移和 Element Plus 保留策略不变。

## [2026-10-20] LxSectionTitle Assessment B 降级归因交接

- **证据**：三路 detector 均为 `[]`/空 stderr/退出码 `0`；独立 headless fallback 在 375/320px 记录右侧裁切，但仓库 Playwright 配置下 `lx-section-title-docs.spec.ts` **1/1** 通过，操作区边界和 `documentElement.scrollWidth` 断言均通过。
- **判断**：裁切信号暂归为独立脚本运行时/文档壳层待归因，不直接修改组件布局；没有可变浏览器 API，HUD 点击、Tab 全序列、reduced-motion runtime 和 overlay 未验证。
- **后续**：保留 P1 归因项，补可用浏览器运行时后再做正式 A/B、overlay、snapshot/trend；UI-10、真实业务权限和 Vue3 宿主迁移继续开放。

## [2026-10-20] LxSectionTitle Demo 操作契约补强交接

- **改动**：边框变体增加 `icon` 属性示例；接口配置变体增加“刷新”和“查看日志”两个操作；保留 `leading` 插槽覆盖 `icon` 的优先级示例。
- **验证**：单测 **14/14**、4177 文档 E2E **1/1**、键盘焦点/Enter 反馈/图标优先级断言、lx-ui typecheck、目标 Prettier 和差异检查通过。
- **后续**：375px 文档壳横溢出与 HUD 证据仍需独立归因；正式 Critique、业务权限过滤和宿主 Vue3 迁移未完成，API 请求继续使用 `.then().catch().finally()`。

## [2026-10-20] LxDescriptions Demo 工具栏密度收口交接

- **改动**：文档 Demo 工具栏使用响应式网格，桌面并列布局/状态控制，摘要与高级设置独占整行；600px 以下单列，避免首屏控件竞争和窄屏横溢出。
- **验证**：LxDescriptions 单测 **10/10**、4177 文档 Playwright **3/3**、375px 工具栏单列几何断言、lx-ui typecheck、目标 Prettier 和差异检查通过。
- **后续**：组件正式 Critique、真实详情 API、权限/错误恢复宿主组合和 Vue3 Element Plus 替换仍未完成；API 请求继续使用 `.then().catch().finally()`。

## [2026-10-20] LxFormErrorBanner 空播报修复交接

- **改动**：空内容的错误横幅不再创建空 live region；有标题、说明或默认插槽时继续使用 `role="alert"`、assertive live region 和原子播报。
- **验证**：组件单测 **3/3**、4177 文档 Playwright **1/1**、lx-ui typecheck、206 modules 库构建、目标格式和差异检查通过。
- **后续**：正式 Impeccable A/B、真实读屏器、宿主表单组合和权限/后端联调仍未完成；业务 API 请求继续使用 `.then().catch().finally()`。

## [2026-10-20] LxPagination 嵌套滚动修复交接

- **改动**：`autoScroll` 优先滚动最近的可滚动祖先，只有找不到祖先时才调用 `window.scrollTo`；保留 reduced-motion 即时滚动和原有事件顺序。
- **验证**：组件/适配器单测 **8/8**、4177 文档 E2E **3/3**、lx-ui typecheck、206 modules 库构建、目标 Prettier 和差异检查通过。
- **后续**：宿主分页仍需逐页验证空/失败/取消/权限不足和真实接口；Assessment B 因评估服务 403 额度不足待重跑，静态 `[]` 不代表正式 Critique 通过。

## [2026-10-19] LxDynamicForm 当前版行为验证交接

- **证据**：DynamicForm 单测 **30/30**、文档 Playwright **14/14**、lx-ui `pnpm typecheck` 通过；当前文档服务使用 `playwright.lxui.config.ts` 指向 4177 入口。
- **覆盖**：schema 类型独立渲染、受控 `value`/`change`、密码字段错误与 ARIA、单图/多图上传失败重试/取消/移除、日期范围回写、远程候选取消与迟到响应、自适应 1/2/3 列和窄屏触控。
- **边界**：async-validator required stderr 是测试主动触发的预期校验输出，测试退出码为 0；不代表代码失败。当前只完成行为复验，不能替代独立 Impeccable A/B、overlay、snapshot/trend，也不能代表真实上传协议、权限接口或 Vue3 业务页迁移完成。
- **交接要求**：后续宿主接入继续保留 `value + change(nextValue)` 与旧 schema 语义，业务请求使用 `.then().catch().finally()`；缺少可信后端契约的上传、权限和字段映射保持阻塞。

## [2026-10-19] LxSectionTitle 当前版双路评审交接

- **验证**：单测 **14/14**、文档 E2E **1/1**、lx-ui typecheck 和 Vue3 项目已安装 Prettier 校验通过；覆盖 375/320px、HUD、键盘、减少动效、360px 容器查询。
- **Assessment A**：32/40（Good），无 P0/P1；需补真实内容 Demo、`extra`/`leading` 无障碍与数量契约，核对 HUD 实际主题变化。
- **Assessment B**：三路 detector 合法 `[]`/空 stderr/0；浏览器证据目录为 `linkx-fe/.impeccable/critique/lxsectiontitle-assessment-b-2026-10-19/`。1280、320 和 360px 容器通过；375px 有 `documentWidth=478` 页面级横溢出信号，不能归因到组件前先定位；HUD 只观察到局部颜色变化。
- **交接边界**：本轮不关闭 UI-10，不替换 Vue3 页面，不删除 Element Plus，不引入权限或业务 API；后续请求继续使用 `.then().catch().finally()`。`npx impeccable update` 因网络超时未更新本地 skill。

## [2026-10-19] LxPagination 当前版复验与 Critique 快照核对

- **验证**：单测 **5/5**、4177 文档 Playwright **3/3**；受控页码/条数事件、自动回第一页、滚动开关、自定义布局、背景、HUD、键盘和 375px 局部滚动均通过。
- **审查边界**：历史台账引用的 `pagination-assessment-b-2026-10-17` 目录当前不存在，未找到独立当前版 A/B 快照；本轮只登记源码审查和可执行行为证据，不关闭 UI-10。
- **接入要求**：业务页替换时保留 `change` 参数顺序、局部滚动而非强制修改容器滚动、分页请求由宿主按 `.then().catch().finally()` 编排。

## [2026-10-19] LxFormErrorBanner 当前版复验与 Critique 证据更正

- **验证**：LxFormErrorBanner 单测 **2/2**、4177 文档 Playwright **1/1**、lx-ui typecheck 通过；未发现可复现 P0–P2，角色、播报属性、错误令牌、slot 操作和 375px 布局保持当前契约。
- **证据边界**：未找到独立 FormErrorBanner Critique 快照；`g2-assessment-b-2026-10-17` 的浏览器证据目标是 SearchBar/StatusSwitch，不能作为本组件视觉 A/B，已按阶段性源码/行为复验记录处理。
- **待办**：空 props 会产生空 assertive live region，当前仅记录 P3，待真实调用面明确后决定 title 必填或空内容降级；页面迁移、权限和真实后端继续开放。

## [2026-10-19] LxEmpty 当前版门禁复验交接

- **复验**：覆盖默认/紧凑空态、自定义图标、footer 操作、创建和筛选恢复、长描述、HUD、键盘焦点及 320/375px 窄屏。
- **证据**：LxEmpty 单测 **5/5**、4177 文档 Playwright **1/1**、lx-ui typecheck、文档构建通过；既有 Assessment A **35/40**、B 浏览器证据未发现新增 P0–P2。
- **环境说明**：宿主 Vite 配置不是 lx-ui 文档入口，使用它运行该文档测试会因缺少标题或代理超时而失败；后续必须使用 `playwright.lxui.config.ts` 和 4177 服务。
- **边界**：本轮无源码改动，不关闭 UI-10 严格矩阵；正式独立 A/B、页面迁移、权限契约和真实后端联调仍开放。

## [2026-10-19] LxInput 真实输入元素与前后缀高度对齐交接

- **根因**：`prefix/suffix` 及内部槽位已经是描边内 30/42px 内容轨道，但真实输入元素仍为 `height: 100%`，在 32/44px 外框中比前后缀高 2px。
- **修复**：输入元素改为 `--lx-input-content-height`，`align-self: center`，并同步 `line-height`；外侧复合块继续使用完整控件高度。
- **证据**：复合前后缀 Playwright **1/1**、LxInput 单测 **13/13**、lx-ui typecheck/build、目标 Prettier 通过；浏览器测量确认 md 档输入元素、prefix、suffix 均为 30px，窄屏内容轨道为 42px。
- **边界**：没有改变 props、事件、校验、Promise 链式 API 或焦点环；正式 Impeccable A/B 仍需按独立 JSON、stderr、退出码及浏览器证据门禁执行，detector `[]` 不单独代表通过。

## [2026-10-19] LxMetricCard 窄卡与宿主状态契约补强交接

- **改动**：指标卡新增 `@container (max-width: 320px)` 布局，标题/角标/数值/补充内容在窄卡中分层换行；Demo 增加 loading、empty、error 宿主组合和可观察的重试反馈。
- **契约**：`status` 表示指标结果，`badgeStatus` 表示角标/连接状态，`trendStatus` 表示趋势/请求状态，三者不互相推断；数据请求和失败恢复仍由宿主使用 Promise 链编排。
- **验证**：`lx-metric-card.test.ts` **15/15**；`lx-metric-card-docs.spec.ts` **3/3**；320px 浏览器几何、typecheck/build、目标 Prettier/ESLint 通过。
- **边界**：未引入 API、Pinia、Router 或权限逻辑；正式独立 Impeccable A/B、真实后端和 Vue3 页面组合仍开放。

## [2026-10-19] LxInput 前后缀槽位垂直居中修复交接

- **问题与实现**：`prefix/suffix` 及内部槽位原本已经使用 30/42px 内容轨道，但 flex 拉伸从外框顶部开始，造成底部少 2px。改为在完整 32/44px 输入外框内居中，保留上下描边内缩和 `prepend/append` 完整高度契约。
- **验证**：LxInput 单测 **13/13**；复合前后缀文档 Playwright **1/1**；lx-ui typecheck、206 modules 生产构建、目标 Prettier 通过；浏览器实测 sm/md/lg 与 390px 窄屏上下边界各 1px 对齐。
- **审查边界**：页面 detector 报告既有低对比度建议（2.9:1），与本次几何修复无关；`npx impeccable update` 因网络超时未更新技能包，不能记为正式 Impeccable A/B 通过。未改变 Props、事件、表单校验或 Promise 链式 API。

## [2026-10-19] LxSectionTitle 容器响应式与标签语义修复交接

- **改动**：增加宿主 `@container` 窄屏规则并保留 viewport 回退；`extra` 多控件支持换行；标题标签增加中文辅助名称。
- **验证**：单测 **14/14**、文档 E2E **1/1**，覆盖 375/320px、HUD、减少动效、键盘及 1280px viewport 下 360px 嵌套容器；lx-ui typecheck/build 和格式检查通过。
- **边界**：正式 Impeccable A/B/snapshot 尚未完成（本轮 luna 代理服务 503）；Vue3 宿主配置页组合回归、权限和真实后端保持原阻塞。

## [2026-10-19] LxInput 前后缀内容轨道对齐交接

- **改动**：修复 wrapper 内部 `prefix/suffix` 槽位比真实输入内容多 2px 的问题；新增 `--lx-input-content-height`，sm/md/lg 使用 26/30/38px，窄屏使用 42px。外层输入框和 `prepend/append` 仍为完整 28/32/40px 或 44px。
- **验证**：复合前后缀 E2E **1/1**、单测 **13/13**、typecheck/build、目标格式和 `git diff --check` 通过。
- **边界**：未改变 props、事件、表单校验和 Promise 链式风格；Impeccable 正式 A/B、代码审查及 UI-10 关闭数仍需按证据门禁处理。

## [2026-10-19] LxSectionTitle 窄屏布局修复交接

- **问题与实现**：400px 及以下标题和 `extra` 操作区改为两行布局，标题区完整占据第一行，操作区右对齐并保留宿主操作的 44px 触控目标；长标题仍按当前设计换行，不改变 Props、插槽或标题层级契约。
- **验证**：`lx-section-title.test.ts` **14/14**；`lx-section-title-docs.spec.ts` **1/1**；覆盖 375px/320px、HUD、减少动效、键盘操作及无横向溢出；lx-ui typecheck/build、目标 Prettier、定向 ESLint 和 `git diff --check` 通过。
- **审查边界**：三路 detector 为合法 `[]`、空 stderr、退出码 `0`，仅作静态 B 证据；当前使用既有 Assessment A 基线，未将本波标为正式 UI-10/整库 Critique 通过。
- **下一步**：继续 UI-10 未关闭组件与正式独立 A/B 评审；Vue3 Element Plus 替换、权限中心、文本/字段权限、真实后端和页面操作引导保持后置。

## [2026-10-19] LxDescriptions 长值展开状态修复交接

- **改动**：移除长值按钮 `:focus` 无条件展开规则，修复收起态与 `aria-expanded` 不一致；调整 `LxStatusDot` 深层样式顺序，确保长状态收起时稳定省略；长值/长状态加入 `chevron-down` 旋转图标，窄屏采用两行收起预览，展开后显示完整内容。
- **验证**：`tests/unit/lx-descriptions.test.ts` **10/10**；`tests/e2e/lx-descriptions-docs.spec.ts` **3/3**；lx-ui typecheck、目标 Prettier、`git diff --check` 通过。detector JSON 合法 `[]`、stderr 无检测错误、退出码 `0`。
- **审查**：独立 Assessment A **27/40** 发现的两个 P1 已处理；报告位于 `linkx-fe/.impeccable/critique/lxdescriptions-toggle-assessment-a-2026-10-19/assessment.md`。Assessment B 已完成 Light/HUD、1280/375px（含窄屏减少动效）4 场景、28 个状态步骤，页面错误、失败请求和横向溢出均为 0；证据见 `linkx-fe/.impeccable/critique/lxdescriptions-toggle-assessment-b-2026-10-19/assessment-b-report.md`。三路 detector 的 JSON/stderr/退出码为合法 `[]`/空/`0`，仍不把静态 `[]` 单独当作正式 Critique 通过。
- **边界**：没有改变 Props、事件、权限、请求或 Promise 链；宿主页面替换、真实后端联调和 UI-10 全库计数继续保持开放。

## [2026-10-18] LxInput 前后缀高度令牌回归交接

- **改动**：`prefix/suffix` 及内部槽位直接使用 `--lx-input-track-height`，不再依赖父级 `100%` 传递；复合输入在 sm/md/lg 与窄屏 44px 下继续与输入框共用同一高度轨道。
- **验证**：复合前后缀 E2E **1/1**、LxInput 单测 **13/13**、lx-ui typecheck/build/build:docs、目标 ESLint/Prettier 和 `git diff --check` 通过。
- **边界**：本轮只修复视觉几何，不改变 API、事件、表单校验或 Promise 链式风格；不增加 UI-10 关闭数。Impeccable 复验必须按 A/B 隔离执行，`[]` 只记录静态零命中。
- **下一步**：等待独立 A/B 证据后归档 snapshot/trend；继续组件库未关闭门禁，再进入 Vue3 Element Plus 分批替换。

## [2026-10-18] LxDescriptions/LxCodeSlot 动态标签与双路审查交接

- **交付**：修复 `LxCodeSlot` 自定义 `aria-label` 在宿主字段标签变化后可能残留旧值的问题；移动端 Descriptions E2E 改为验证响应式换行和外层边界；新增动态字段标签单测。
- **验证**：单测 **10/10**，Descriptions 文档 E2E **3/3**，CodeSlot 文档 E2E **1/1**；lx-ui typecheck/build/build:docs、目标 Prettier、E2E ESLint 和差异检查通过。提交 `074a1771` 已推送 `origin/main`。
- **审查**：A **32/40（Good）**，无 P0，开放三个 P1；B 四目标 detector 为合法 `[]`/空 stderr/退出码 `0`，8 个 Light/HUD、桌面/375px 视图注入成功，页面错误/失败请求/HTTP 失败均为 0。报告见 `linkx-fe/.impeccable/critique/descriptions-codeslot-assessment-2026-10-18/`，浏览器证据见 `descriptions-codeslot-browser/`。
- **下一步**：继续处理长值展开/复制发现性、复制中/失败可见反馈和 Demo 信息架构；本波不增加 UI-10 关闭数，也不提前进入 Element Plus 删除、权限联调或页面操作引导。

## [2026-10-18] LxCodeSlot 当前版复核交接

- **交付内容**：补齐复制按钮可访问名称合并、复制忙态与重复提交保护、空值提示、窄屏 44px 触控高度和长值 flex 收缩；同步中文文档及文档 E2E。
- **证据**：文档 E2E **1/1**；lx-ui 类型检查、生产构建、目标 Prettier 通过。Assessment A **30/40（Good）**；Assessment B 四视图注入成功，页面错误/失败请求为 0，detector JSON/stderr/退出码为合法 `[]`/空/`0`。证据目录：`linkx-fe/.impeccable/critique/lxcodeslot-assessment-b-2026-10-18/`。
- **注意事项**：detector 对文档壳层、代码高亮和 HUD 示例的命中已归因；真实 NVDA/VoiceOver、系统剪贴板和宿主组合仍未完成，业务 API 风格未改动。
- **代码复审补强**：独立复审发现并已修复外部 `disabled` 被内部忙态覆盖、动态 `aria-label` 不更新和剪贴板 Promise 卸载后回写三个问题；复修后 E2E **1/1**、类型检查和构建再次通过。键盘、空值、失败和重复提交的深度单测仍列为后续共享组件回归增强项。

## [2026-10-18] LxInput 前后缀与输入框高度轨道补强

- **问题与实现**：普通 `LxInput` 根节点此前仍依赖 Element Plus 的 `line-height` 和 flex 默认拉伸，带 `prefix/suffix` 或切换尺寸时可能出现输入框与槽位上下边界不一致。现由 `.lx-input` 根节点统一声明 `box-sizing`、`height`、`min-height` 和 `align-items: stretch`，与既有 `--lx-input-track-height`、sm/md/lg 和窄屏 44px 轨道一致；不改变值、事件、校验、插槽或公开方法契约。
- **验证**：`lx-input.test.ts` **13/13**；`linkx-fe` `pnpm run typecheck`、`pnpm run build`、`pnpm run build:docs`、目标 Prettier 均通过。使用 `playwright.lxui.config.ts` 正确指向 4177 文档服务后，复合前后缀与普通根节点几何 E2E **2/2** 通过；此前 30846 宿主配置失败属于入口错配，不计为代码失败。
- **Impeccable**：Assessment A 与 B 由独立子代理完成。B 的组件源码 detector 为合法 JSON `[]`、stderr 为空、退出码 `0`；Light/HUD、桌面/390px、sm/md/lg 共 8/8 视图成功注入，复合根、prepend、append、prefix、suffix 高度分别稳定为 28/32/40px，窄屏为 44px，页面错误和失败请求均为 0。原始证据见 `linkx-fe/.impeccable/critique/lxinput-height-wave-2026-10-18/assessment-b/`；移动页面 `scrollWidth=630` 与 detector 命中仍待归因，不能把命中数直接视为组件缺陷。A 提出减少动效和触屏清空语义问题，登记为后续独立任务。
- **工具状态**：已执行 `npx impeccable update`，因 GitHub skill bundle 下载连接超时未安装更新；没有改动本地组件库版本。页面操作引导继续暂缓，Vue3 API 请求链继续保持 `.then().catch().finally()`。

## [2026-10-18] LxMetricCard 与 LxSectionTitle 双路复核交接

- **交付**：完成当前源码、Demo 和组件目录的 Assessment A/B 隔离复核；A 分别为 `32/40` 与 `33/40`，B 六个 detector 为合法 `[]`/空 stderr/退出码 `0`，六个 Light/HUD、桌面/375px 场景注入成功。
- **发现**：MetricCard 需要明确 `status`、`badgeStatus`、`trendStatus` 的独立维度并补充宿主错误/空态组合规范；SectionTitle 需要继续处理窄屏 extra 与长标题竞争、标题层级责任和 tag 的读屏策略。没有 P0/P1 实现阻塞，但评审建议仍开放。
- **证据**：B 证据见 `linkx-fe/.impeccable/critique/metric-section-assessment-b-2026-10-18/`；双路快照见根 `.impeccable/critique/2026-10-17T20-43-58Z__linkx-fe-src-components-lxmetriccard-index-vue.md` 和 `...lxsectiontitle-index-vue.md`；综合归档见 `linkx-fe/.impeccable/critique/metric-section-assessment-2026-10-18/`。
- **边界**：375px `scrollWidth=615` 是文档壳层/代码区信号，不能直接归因组件；Demo 未提供 loading/error/empty/disabled 入口。当前不增加 UI-10 52 项关闭数，也不开始 Vue3 Element Plus 删除。
- **下一入口**：继续当前 UI-10 候选的设计、行为和宿主契约回归；保留业务 API `.then().catch().finally()`、中文注释及白名单提交规则。
- **下一波**：继续当前 UI-10 未关闭组件门禁；取得可用浏览器后补跑 LxInput 普通前后缀的几何 E2E 与截图证据，再进入下一个组件。保持白名单暂存，避免提交 `.pnpm-store`、`.impeccable-*`、`test-results` 和日志。

## [2026-10-18] LxVirtualTree/TransferPanel 组合复验交接

- **本轮结论**：`LxVirtualTree` 固定行与插槽摘要、`LxTransferPanel` 批量/筛选/已选列表组合的 P2 复验完成；48/48 文档 E2E 通过，未复现组件级 P0/P1/P2。
- **覆盖证据**：桌面 32px、窄屏 44/64px 行高、长名称全文入口、未加载项、筛选隐藏项、批量上下限、键盘方向键、虚拟滚动卸载后的焦点恢复、HUD/暗色/减少动效、空/加载/错误恢复均有浏览器断言；`pnpm typecheck` 和 lx-ui 206 modules 构建通过。
- **边界**：`DataPermissionTree` 宿主保存状态、真实权限接口、跨浏览器/人工读屏和 Vue3 页面替换未完成。组件库无独立 ESLint CLI，不能用错误 glob 的“无文件”结果冒充通过。
- **交接下一波**：盘点剩余 UI-10 基础组件与 Element Plus 直接用法，按页面契约分批替换；业务 API 继续使用 `.then().catch().finally()`，不臆造权限或后端字段。

## [2026-10-18] LxDescriptions 当前版复验交接

- **本轮结论**：当前源码、Demo、中文文档与设计稿契约已冻结复验，未发现需要修改的 P0/P1/P2 组件缺陷。已验证两端布局、双列转单列、32px 行高、长值和长状态键盘可读性、复制按钮、480px 抽屉、空/加载/错误恢复、HUD 和 `prefers-reduced-motion`。
- **证据**：组件单测 **9/9**；lx-ui 文档 E2E **3/3**，使用 `playwright.lxui.config.ts` 的 `4177` 文档入口；本轮工作区全量 Vitest **61/61 文件、603/603 测试**通过。静态 detector 的 `[]` 仍只代表零命中，不能替代独立 A/B 视觉证据。
- **未关闭边界**：真实读屏器、跨浏览器、剪贴板、真实后端和 Vue3 宿主 `el-descriptions` 替换仍属于 UI-04/UI-11；没有可信契约时不臆造权限或保存接口。
- **交接下一波**：复核 `LxVirtualTree` 的固定行/插槽摘要和 `LxTransferPanel` 的组合 P2，随后整理宿主替换清单；API 请求继续保持 `.then().catch().finally()`，新增注释和文档使用中文。

## [2026-10-18] UI-13 / Wave 28 LxUpload 进度真实性与 Demo 可访问结构收口

- **改动**：批量上传进度改为按文件大小加权；受控文件缺少大小时使用等权回退，不把未知大小伪装成字节精度。Demo 外层字段改为普通容器，使用 `aria-labelledby` 关联“上传文件”标题，避免嵌套 `label` 造成重复文件选择。
- **验证**：LxUpload 单测 **39/39**；lx-ui 类型检查、206 modules 生产构建、目标 Prettier 和差异检查通过。Assessment A **29/40**；Assessment B 8 个视图全部可访问且无页面错误/失败请求，detector 三件套为合法 `[]`/空 stderr/退出码 `0`。
- **审查**：综合报告位于 `linkx-fe/.impeccable/critique/upload-wave-2026-10-18/assessment-report.md`，snapshot/trend 已写入并读取。B 的 HUD 大量命中来自 VitePress 壳层；没有将静态 `[]` 单独当作视觉通过。
- **边界**：LxUpload UI-10 严格矩阵仍开放；真实上传 URL、鉴权请求头、服务端取消协议和 Vue3 宿主迁移没有可信联调环境。宿主文档 E2E 当前固定使用 `30846`，本次超时属于配置入口错配，不能覆盖 `4177` 文档证据。
- **下一步**：继续统一 UI-10 未关闭组件和 P1/P2 台账；完成组件库门禁后再迁移 Vue3 Element Plus。页面操作引导继续暂缓，API 请求保持 `.then().catch().finally()`。

## [2026-10-18] LxInput 前后缀尺寸切换高度修复

- **问题与根因**：`LxInput` Demo 在切换 `sm/md/lg` 时，Element Plus 对 `prefix/suffix` 默认应用 `transition: all`，高度处于过渡帧，造成输入框与前后缀的上下边界短暂不一致。
- **改动**：保留前后缀和内部槽位已有的完整高度 flex 轨道，将 Element Plus 的 `transition: all` 收窄为颜色过渡，避免尺寸切换时高度参与动画；窄屏 44px 触控高度、统一焦点环和 prepend/append 结构保持原契约。
- **验证**：复合前后缀 Playwright **1/1**、`lx-input.test.ts` **13/13**、lx-ui 类型检查/生产构建、目标格式检查和 `git diff --check` 通过。完整 Input 相关 E2E **5/6**，唯一失败是既有清空按钮在鼠标移出后的可见性断言，不属于本次高度修复，已保留为后续独立回归项。
- **Impeccable**：detector JSON 合法 `[]`、stderr 为空、退出码 `0`；该静态结果仅代表规则零命中，不宣称新增正式双路 Critique 通过。`npx impeccable update` 已执行，因网络无法下载引擎但本地 skill/hook 更新完成。
- **交接边界**：本波不增加 UI-10 关闭数，不改变 API、事件、校验或 Vue3 API 链式风格；Element Plus 替换、真实后端/权限联调和页面引导继续按既定计划后置。

## [2026-10-18] UI-13 / Wave 27 LxUpload fallback UID 与 abort 组合回归

- **交接结果**：确认 `LxUpload` 的 fallback UID 生成与稳定性、多个实例隔离、受控模型回灌、内部 Element Plus UID 映射、公开 `abort()`、对应请求取消以及迟到 success/error 回调忽略均已有当前实现和回归覆盖。
- **验证证据**：`lx-upload.test.ts` **38/38**；`lx-upload-docs.spec.ts` **9/9**。本次命令串行执行，未连接真实后端；文档 E2E 覆盖成功、空/失败/重试、取消、移除、禁用、HUD、320/375px 和拖拽悬停状态。
- **边界与交接**：真实上传 URL、鉴权请求头、服务端取消协议、下载/上传业务权限和 Vue3 宿主替换仍未完成，不能用 Mock 证据替代；`LxUpload` UI-10 设计严格矩阵仍保持开放，正式 Critique 需另按 A/B、detector 三件套和浏览器证据执行。
- **下一步**：继续审计矩阵中的 `LxDescriptions`、`LxVirtualTree`/`LxTransferPanel`、`LxForm`/`LxDynamicForm` 及剩余基础组件；完成 lx-ui 门禁前保留 Vue3 `element-plus`。

## [2026-10-18] UI-10 / Wave 26 LxTag 严格矩阵关闭

- **矩阵状态**：`LxTag` 从待严格复核正式更新为已关闭，UI-10 由 **11/52** 更新为 **12/52**；依据为当前版实现、中文 Demo/API、单测、文档 E2E、Impeccable A/B、浏览器视图和代码复审证据。
- **验证**：单测 **5/5**、文档 Playwright **2/2**、lx-ui typecheck/build、VitePress build、目标格式/Lint 和差异检查通过；B 证据目录为 `.impeccable/critique/lxtag-assessment-b-2026-10-18-recheck/`，detector JSON/stderr/退出码为合法 `[]`/空/`0`，五视图无页面错误、失败请求或页面级横溢出。
- **交接边界**：small 档 `2px 6px` 紧凑内距有 `DESIGN-SPEC.md` 设计依据；Vue3 宿主仍待 UI-04 逐页替换，需保留标签语义、`close` 事件、disabled 只读和长文本契约。真实权限/后端联调、UI-11 整库审查、Element Plus 删除及页面引导不因本波提前。
- **下一步**：继续 UI-10 未关闭组件矩阵；完成全库组件/动效 Impeccable 后，再进入 Vue3 Element Plus 分批替换。

## [2026-10-18] 全菜单 Mock 首屏预览复验

- **结果**：`other-admin/admin-vue3/tests/e2e/preview.spec.ts` 在隔离 `mock-preview` 服务下 **6/6** 通过，覆盖首页与 32 个动态子菜单（总目录 33 项）。
- **已核对**：分组菜单、全部菜单目录和搜索、所有入口页面壳层与样例数据、未知 API 501 检查、北向筛选/增改删、分页文章、AuthImg 失败/键盘重试/减少动效、320/390px 窄屏。
- **边界**：Mock 仅证明本地首屏可浏览和指定交互可回归；真实后端、按钮/文本/字段权限、深层页面组合和角色成员契约仍未完成，不能据此删除 Element Plus 或关闭权限阻塞。
- **下一步**：按 UI-10 未关闭 lx-ui 组件门禁推进，组件库和整站审查完成后再分批迁移 Vue3 宿主。

## [2026-10-18] LxInput URL detector 结果归因

- Impeccable 引擎 **0.1.15** 扫描 LxInput 文档 URL 返回退出码 **2**；结果不是空数组，报告 `#929295` 正文低对比度以及代码高亮 `#22863a/#d73a49` advisory。
- 通过 DOM/样式来源核对，命中均来自 VitePress 文档壳层或 Shiki 代码块，不属于 `LxInput`、前后缀槽位或 Demo 令牌。组件不为此引入局部颜色覆盖；正式 Critique 仍需独立 A/B 和页面命中归因。
- 该结果覆盖 URL detector 的真实失败证据，不能与此前源码 detector 的 `[]/0` 混写；`[]` 仍不代表视觉通过。

## [2026-10-18] LxInput 前后缀高度轨道最终收敛

- **问题**：前后缀容器与输入框虽然已有高度断言，但 Element Plus 内部 flex 项仍混用 `min-height: 100%`、令牌高度和内容尺寸，主题或尺寸切换时可能出现视觉上下边界不齐。
- **实现**：`linkx-fe/src/components/LxInput/style.css` 将复合根节点、输入内框、`prepend/append` 和 `prefix/suffix` 内部槽位统一为完整高度 `border-box` 伸展轨道；不改变事件、校验、公开方法或业务 API。
- **验证**：复合前后缀 Playwright **1/1**，覆盖 sm/md/lg、390px 触屏、根/内框/前后缀上下边界、内部槽位高度和统一焦点环；LxInput 单测 **13/13**；lx-ui typecheck/build、目标 ESLint/Prettier、`git diff --check` 通过。
- **审查边界**：detector 的 JSON、stderr、退出码必须一起读取；`[]` 仅表示静态零命中。本轮没有伪造独立 Assessment A/B 或 snapshot/trend，不增加 UI-10 关闭数；下一入口继续按未关闭 lx-ui 组件门禁推进。

## [2026-10-18] LxForm 通栏文本域宽度收口

- **问题与修复**：双列弹窗中 `span="full"` 的表单项虽然跨列，`LxTextarea` 根节点却没有宽度约束，实际只占左侧约半列。现已让 `LxTextarea` 根节点占满父级内容轨道，通栏备注与设计稿一致。
- **验证**：LxTextarea 单测 **14/14**、LxForm 文档 E2E **6/6**、lx-ui 类型检查、目标 ESLint/Prettier 通过；浏览器测得内容区/文本域均为 **608px**。两个 detector 的 JSON 为合法 `[]`、stderr 为空、退出码 `0`。
- **边界**：未改变表单校验、ARIA、计数器或 Promise 链规则；本轮没有伪造独立 Assessment A/B 或 snapshot/trend，`[]` 仅作静态证据，不能单独代表正式视觉审查通过。

## [2026-10-18] LxInput 复合前后缀统一外框

- **问题与修复**：复合输入的输入内框焦点环与 `prepend/append` 分段边线在视觉上不共边。现由复合根节点统一圆角、外框和焦点环，内框取消独立圆角/焦点环，外侧块仅保留分隔线；高度轨道和窄屏 44px 规则保持不变。
- **验证**：定向 Playwright **1/1**、LxInput 单测 **13/13**、lx-ui `vue-tsc --noEmit`、目标 ESLint/Prettier、`git diff --check` 通过。detector JSON 为合法 `[]`、stderr 为空、退出码 `0`；浏览器实际核对 sm/md/lg、390px、上下边界和焦点环。
- **审查边界**：`[]` 仅记录静态规则零命中；本轮没有伪造独立 Assessment A/B 或 snapshot/trend。正式双路 Critique、UI-10 全库门禁、Vue3 宿主替换和真实后端联调仍按计划执行。

## [2026-10-18] DynamicForm/Form 文档门禁当前版复验

- **验证**：使用隔离 lx-ui 文档配置和本机 Chrome，`lx-dynamic-form-docs.spec.ts` **14/14**、`lx-form-docs.spec.ts` **6/6**，合计 **20/20**；测试未连接真实后端。
- **覆盖**：窄屏自适应、API 表格可访问滚动、键盘顺序、HUD/普通暗色、校验错误与恢复、密码字段 ARIA、单图/多图上传失败重试与取消、远程查询取消及迟到响应隔离。
- **证据与边界**：既有独立 B 证据和 detector 三件套见 `.impeccable/critique/dynamicform-form-assessment-b-2026-10-17/`；detector 的 `[]` 仅表示静态零命中。LxForm 设计稿逐项对照、真实上传协议和 Vue3 宿主替换仍未完成，不能据此关闭 UI-10/UI-11。

## [2026-10-18] LxInput 前后缀复合轨道再次收敛

- **问题**：部分主题或尺寸下，Element Plus 输入内框按内容尺寸参与 flex 计算，导致前后缀状态下输入框与外侧前后缀的上下边界看起来不一致。
- **实现**：`LxInput` 复合根节点、输入内框和 `prepend/append` 统一采用伸展高度轨道；内框显式继承 `--el-input-height`，并保留窄屏 44px 触控规则。新增 E2E 根节点与内框上下边界断言。
- **验证要求**：运行定向复合输入 E2E、lx-ui 类型检查、目标格式/差异检查，并按 Impeccable 规则记录浏览器证据、detector JSON、stderr 与退出码；detector 返回 `[]` 不能单独作为通过依据。
- **边界**：本修复只涉及 `LxInput` 视觉几何，不改变事件、表单校验或 API 请求链式风格；Vue3 全量替换和 UI-10 整库门禁仍按原计划推进。

## [2026-10-18] LxTag 关闭操作、尺寸和禁用态复核

- **实现**：关闭按钮统一使用 `LxIcon name="x"`，可见名称和提示为“关闭标签”；补齐 `large` 尺寸，三档标签设置稳定最小高度；禁用态使用 `--lx-btn-disabled-*` 令牌，不再使用整体 `opacity: 0.4`；长内容在可用宽度内省略。Demo 与中文说明补充 large、disabled 和键盘焦点状态。
- **验证**：定向单测 **5/5**、LxTag 文档 Playwright **2/2**；lx-ui `typecheck`、库构建、VitePress 文档构建、宿主 ESLint/Prettier 和差异检查通过。文档构建保留既有大 chunk 警告。
- **代码复审**：修前 Assessment A 发现 disabled 文字对比度约 1.89:1、`large` 类型未实现、长文本窄屏风险；修后代码复核确认关闭按钮仍为原生 button，disabled 不渲染关闭操作，`LxIcon` 作为装饰图标隐藏于辅助技术，不改变 `close` 事件契约。
- **Impeccable**：Assessment A **27/40（Good）**；修后 Assessment B 证据见 `.impeccable/critique/lxtag-assessment-b-2026-10-18-recheck/`，五个 Light/HUD、桌面/375px、减少动效视图均无页面错误或失败请求，detector JSON/stderr/退出码为合法 `[]`/空/`0`。唯一组件命中 `cramped-padding` 与设计稿 `small` 档内距一致，其余命中为文档壳层。
- **边界与下一步**：本波只完成 LxTag 组件级门禁，不增加 Vue3 Element Plus 替换、权限中心、真实后端联调或页面操作引导完成度；继续按 UI-10 未关闭组件矩阵推进。

## [2026-10-17] DynamicForm/Form 正式双路 Critique 归档

- **审查结论**：A/B 均由独立 `gpt-6.1-sol` 完成，综合 **28/40（Good）**；A 的原始 P1（375px 横溢出、字段错误可见性）已由 B 稳定重跑关闭，当前只保留文档信息密度、HUD 层级和键盘效率提示三个 P2/P3 观察。
- **证据路径**：`.impeccable/critique/dynamicform-form-assessment-a-2026-10-17/`、`.impeccable/critique/dynamicform-form-assessment-b-2026-10-17/`、`.impeccable/critique/lxform-dynamicform-assessment-b-2026-10-17/assessment-report.md`；两个文档 snapshot/trend 已写入，detector 均为合法 `[]`、空 stderr、退出码 `0`。
- **边界**：不把 `[]` 单独当作视觉通过，不关闭 UI-10/UI-11；真实上传协议、权限和 Vue3 宿主替换继续按原计划后置。下一入口为剩余组件门禁与已登记硬化项。

## [2026-10-17] DynamicForm/Form 文档信息层级与折叠复验（阶段性）

- **实现**：最小配置已移到 DynamicForm Demo 后；LxForm 的 API 与设计/迁移说明分为两个 `<details>`；`custom.css` 为 `.lx-doc-details > summary` 固化 44px 触达尺寸、2px `focus-visible`、主题令牌颜色和减少动效。
- **证据**：文档 Playwright **17/17**、VitePress 构建成功；两份 Markdown detector 均合法 `[]`、stderr 为空、退出码 `0`。新增用例实际验证默认收起、Enter 展开、44px 高度、焦点环和页面无横溢出。
- **审查边界**：独立 A **30/40（Good）**；B 两次使用 `gpt-6-luna` 均因 HTTP 503 无法完成，故本轮不写正式 snapshot/trend，不标记 UI-10/UI-11 关闭。P2 表格滚动提示、outline 影响和更细折叠粒度交给下一轮可用 B 通道复验。

## [2026-10-17] DynamicForm/Form Assessment B 宽度归因复验

- **脚本修正**：`browser-evidence.mjs` 在首次加载和每次视口切换后等待 250ms，再读取页面级滚动宽度；重跑退出码 `0`、stderr 为空。
- **结果**：DynamicForm、LxForm 在 375px 的 `document/body.scrollWidth` 均为 `375`，overlay 后仍为 `375`。代码示例长行与 API 表格子内容由各自滚动容器承载；旧报告的 `474/525` 是布局尚未稳定时的中间态，不再登记为 P1 页面溢出。
- **业务证据**：DynamicForm/Form 文档 E2E **15/15**，确认 375/320px 单列、字段级错误文本、`aria-invalid`、稳定 `aria-describedby`、首错聚焦、HUD、禁用、上传失败恢复和远程竞态。
- **边界与下一步**：A/B 的 P1 观察已完成归因；P2 文档信息密度、HUD 层级和 P3 键盘效率提示仍未处理，正式 snapshot/trend 与代码复审仍待完成，不关闭 UI-10 或 UI-11。

## [2026-10-17] LxInput 前后缀内容轨道高度修复

- **问题与实现**：Element Plus 默认 wrapper 上下内边距使输入值、prefix、suffix 的可见子轨道比 28/32/40px 外框少 2px。`LxInput` 现在移除垂直内边距，并让输入值、prefix、suffix 使用完整控件高度；prepend/append、焦点内描边、左右内边距和 44px 窄屏触控规则保持不变。
- **验证**：文档复合输入 Playwright **1/1**，sm/md/lg 和 390px 视口均通过；`LxInput` 单测 **13/13**；lx-ui 类型检查、目标 Prettier、`git diff --check` 通过。静态 detector 返回合法 `[]`、stderr 为空、退出码 0；根据规则，未把空数组单独当作视觉审查通过，浏览器几何断言作为本次回归证据。
- **边界**：本次只修复组件级高度轨道，不增加 UI-10 关闭数，不代表全库 Impeccable Critique、Vue3 Element Plus 替换、权限或真实后端联调完成。下一波按组件门禁顺序继续。

## [2026-10-17] LxDynamicForm/LxForm 窄屏与错误焦点修复

- **实现**：密码输入在窄屏或触屏下的真实输入外框统一为 `44px`；`LxForm` 的错误选择器只保留自身错误边框，避免与外层焦点环叠加；`LxDynamicForm` 保留错误选择器键盘焦点环，分别满足两个宿主的既有交互契约。
- **验证**：`LxDynamicForm` 单测 **30/30**；DynamicForm/Form 文档 Playwright **15/15**；窄屏触控、密码字段 ARIA、静态表单错误态和 HUD 状态均通过；lx-ui `vue-tsc --noEmit`、目标 `git diff --check` 通过。Prettier 使用 Vue3 宿主已安装 CLI 修复并复查目标文件；linkx-fe 本地未安装独立 prettier CLI，不能把缺少 CLI 误报为代码失败。
- **Impeccable**：Assessment A **28/40（Good）**，证据见 `.impeccable/critique/dynamicform-form-assessment-a-2026-10-17/`；Assessment B 已完成，证据见 `.impeccable/critique/dynamicform-form-assessment-b-2026-10-17/`。四个 detector 均为合法 `[]`、stderr 为空、退出码 `0`，浏览器 Light/HUD、桌面/375px、错误态、禁用态和键盘证据完整；无覆盖层基线仍记录 DynamicForm `474`、LxForm `525` 的移动宽度异常，需继续定位文档代码块/表格来源。空数组不单独作为正式通过依据，当前不关闭 Critique。
- **边界与下一步**：本波关闭可复现的密码框触控高度和静态表单错误焦点缺陷，不关闭 UI-10 全库、Vue3 宿主替换、真实上传/后端协议或权限任务；等待 B 证据后继续 P1/P2 收口和组件门禁。

## [2026-10-17] LxInput 前后缀复合高度二次修复

- **问题与实现**：此前只约束了 prepend/append 自身高度，部分 Element Plus 布局下复合根节点仍可能没有与输入框处于同一拉伸轨道，导致视觉边界不齐。现为 `.lx-input.el-input-group` 明确设置尺寸高度和 `stretch` 对齐，并让输入内框与两侧外块统一拉伸；窄屏/触屏继续统一为 44px。
- **验证**：复合前后缀 Playwright 几何测试 **1/1**，覆盖 sm/md/lg 根节点、输入内框、prepend、append 等高，prefix/suffix 垂直居中以及 390px 触屏高度；`LxInput` 单测 **13/13**，lx-ui `vue-tsc --noEmit`、目标 Prettier、目标 ESLint 和 `git diff --check` 通过。
- **审查边界**：本次是已完成组件的局部回归修复，不增加 UI-10 严格矩阵计数；正式 Impeccable 双路 Critique、Vue3 宿主替换和真实后端联调状态不变。下一入口仍按组件门禁顺序继续。

## [2026-10-17] G2 SearchBar 布局修复与修后验证

- **实现**：前三个字段各占 4 列，最后集成字段占 12 列；选择器与查询/重置按钮桌面同排底边对齐，操作按钮禁止在桌面换行；375px 时选择器全宽、操作组回落为独占行。同步中文 API/设计对照说明，并增加桌面几何与移动边界 E2E 断言。
- **验证**：SearchBar 单测 **10/10**、文档 Playwright **5/5**、lx-ui 类型检查和 VitePress 构建通过；修后源码/Demo detector 均为合法 `[]`、空 stderr、退出码 `0`。Assessment A/B 已独立复验，八个 Light/HUD × 1440/375 视图 HTTP 200、无页面错误和失败请求。
- **Critique 边界**：综合报告为 **34/40（Good）**，无开放 P0/P1；375px 的 `document` 宽度异常仅在 overlay 注入后出现，`.VPDoc` 与组件基线保持 375px，归因于文档壳层/overlay。证据目录为 `.impeccable/critique/g2-searchbar-postfix-2026-10-17/`；snapshot 已写入 `.impeccable/critique/2026-10-17T09-20-56Z__linkx-fe-src-components-lxsearchbar-index-vue.md`，trend 已读取。
- **下一入口**：按白名单提交推送；继续下一未关闭 lx-ui 组件。Vue3 宿主替换、权限/真实后端联调和引导页保持后置。

## [2026-10-17] 预警推送 Mock 业务验收

- **实现与验证**：新增 `other-admin/admin-vue3/tests/e2e/alert-push-workflow.spec.ts`，Mock 拦截所有后端请求，覆盖任务逾期/无人值守分类、搜索/重置参数、批量删除失败后重试成功，以及无人值守新增切换群组后按 `groupName` 查询、显示并提交。Playwright **2/2**、Vue3 `vue-tsc --noEmit`、目标 ESLint、Prettier 和 `git diff --check` 通过。
- **失败定位**：首轮测试遇到隐藏 Tab 内同名输入框和 Element Plus 隐藏原生 checkbox；已按可访问 `tabpanel` 和可见复选框外壳修正定位，最终测试通过。这些是测试定位问题，不是生产代码缺陷。
- **表单修复与边界**：四个新增/编辑表单的通知对象 API 随类型响应式更新；切换类型时重建分页选择器，群组选项使用 `groupName` 回显。新增流程的群组场景已有端到端证据；编辑表单与任务逾期新增场景仍待覆盖。分页回显、受限账号及真实后端联调仍未完成，不代表模块整体迁移完成。
- **下一入口**：按全局计划完成 G2 `LxSearchBar`/`LxStatusSwitch` 的可核验独立审查；指定模型通道此前返回 HTTP 503，正式 Critique 尚未闭环。

## [2026-10-17] LxInput 前后缀高度修复

- **问题与实现**：复合输入在 sm 档实测 wrapper 为 28px，而 prepend/append 为 37.33px；将外侧 addon 约束为当前输入尺寸令牌高度，并在窄屏/触屏下统一为 44px。prefix/suffix 原先已垂直居中，保留并加入回归断言。
- **验证状态**：新增几何浏览器 E2E **1/1**，覆盖 sm/md/lg、prepend/append 等高、prefix/suffix 垂直居中及 390px 触屏高度；lx-ui `vue-tsc --noEmit`、206 modules 构建、目标 Prettier/ESLint 和 `git diff --check` 通过。旧综合 E2E 在窄屏清空按钮的可访问角色查询处失败（按钮带 `aria-hidden` 时无法由 `getByRole` 查到），与本次 addon 样式无关；该旧断言需另行评估。
- **Impeccable 状态**：正式双路 Critique 未完成；Assessment A/B 子任务均因指定的 6-luna 模型通道返回 HTTP 503 而未启动，未运行 detector，也未将本次改动标记为正式视觉审查通过。后续需在模型通道恢复后补齐。
- **边界**：属于已完成组件的局部回归修复，不增加 UI-10 严格矩阵计数，也不代表正式 Impeccable Critique、宿主替换或真实后端联调完成。

> **文档职责（2026-10-17）**：本文件是唯一的时间序列交接与审查证据索引。新波次只追加一条中文交接记录，包含实现、验证、A/B 证据、未完成边界和下一入口；不要把同一状态复制到多个全局计划文件。全局计划见 `doc/PROJECT-DELIVERY-PLAN.md`，架构定位见 `doc/PROJECT-MAP.md`，历史拆分文档不再新增状态。

## [2026-10-17] LxPageCard 正式组件审查

- **验证**：单测 **3/3**、文档 E2E **1/1**；覆盖标题/插槽、loading/error、HUD 和窄屏。
- **Impeccable**：Assessment A **33/40（Good）**；B 五视图注入成功，detector 合法 `[]`、stderr 空、退出码 `0`。
- **边界**：组件门禁完成；Vue3 宿主替换及 Element Plus 删除继续后置。

## [2026-10-17] LxFormErrorBanner 阶段审查

- **验证**：单测 **2/2**、文档 E2E **1/1**；覆盖 alert 语义、slot 操作、主题和窄屏。
- **Impeccable**：Assessment A **32/40（Good）**；B detector 为合法 `[]`/空 stderr/退出码 `0`，五视图注入成功。
- **复验结论**：移动 overlay 的 `462/375` 横溢出在无覆盖层 Playwright 基线中为 `<=375`，归因于检测覆盖层/文档壳层，不是组件缺陷；窄屏门禁正式收口。高缩放说明文字仍为 P2 观察。

## [2026-10-17] LxPagination 正式组件审查

- **验证**：单测 **5/5**、文档 E2E **3/3**；覆盖受控翻页、条数切换、布局、主题、自动回顶、键盘焦点和 375px 局部滚动。
- **Impeccable**：Assessment A **32/40（Good）**；B 五视图注入成功，detector 合法 `[]`、stderr 空、退出码 `0`，证据见 `.impeccable/critique/pagination-assessment-b-2026-10-17/`。
- **边界**：不修改实现；宿主替换继续后置，保留 change 参数和滚动契约。

## [2026-10-17] LxDrawer 正式组件审查

- **验证**：定向单测 **4/4**、文档 Playwright **1/1**；浏览器五视图注入成功，窄屏无横向溢出。
- **Impeccable**：Assessment A **32/40（Good）**；B 证据 `.impeccable/critique/drawer-assessment-b-2026-10-17/`，detector 合法 `[]`、stderr 为空、退出码 `0`。
- **边界**：长标题补充提示、移动 footer 顺序和高缩放可读性为 P2 观察；未保存数据仍由宿主控制 Escape。未修改组件实现，下一入口继续剩余组件门禁。

## [2026-10-17] LxDialog 正式组件审查

- **验证**：定向单测 **4/4**、文档 Playwright **3/3**、lx-ui 类型检查和目标格式检查通过。
- **Impeccable**：Assessment A **28/40（Good）**；B 证据目录 `.impeccable/critique/dialog-assessment-b-2026-10-17/`。detector 为合法 `[]`、stderr 为空、退出码 `0`；五个 Light/HUD/减少动效浏览器视图重试注入成功，无页面错误或失败请求。
- **审查发现**：P1 是提交中仍可关闭和脏表单无离开保护；P2 是长内容滚动、重复错误反馈、拖拽光标/长标题提示和危险模式文案范围。初次浏览器注入因 8400 服务未启动失败，已保留失败证据并完成启动服务后的有效复验。
- **边界**：本波未修改 LxDialog 关闭语义；宿主页面替换、权限、真实后端和 Element Plus 移除仍后置。下一波处理剩余组件或明确的硬化项。

## [2026-10-17] LxEmpty 组件门禁交接

- **验证**：单测 **5/5**、文档 Playwright **1/1**、lx-ui 类型检查通过；覆盖默认/紧凑尺寸、图片尺寸、插槽、焦点、筛选恢复、HUD、320/375px 和减少动效。
- **Impeccable**：Assessment A **35/40（Good）**；Assessment B 证据目录 `.impeccable/critique/empty-assessment-b-2026-10-17/`，三路 detector 三件套为合法 `[]`、空 stderr、退出码 `0`，浏览器 JSON 可解析且退出码 `0`。空数组未单独作为通过依据。
- **边界**：Vue3 15 处 `el-empty` 尚未逐页替换；宿主空/错/加载契约和真实后端联调仍待 UI-04。未发现组件范围内可复现 P0-P2。
- **下一入口**：继续剩余组件正式门禁与 P1/P2 台账。

## [2026-10-17] LxTransferPanel 与 LxVirtualTree 当前版复验交接

- **验证**：定向单测 **67/67**；TransferPanel 文档 Playwright **33/33**。覆盖桌面/窄屏、键盘、筛选批量、空/错/加载、确认清空、长名称、HUD 和减少动效。
- **Impeccable B**：证据目录 `.impeccable/critique/transferpanel-virtualtree-assessment-b-2026-10-17/`。四路 detector JSON/stderr/退出码均为合法 `[]`、空 stderr、退出码 `0`；浏览器 JSON 可解析且退出码 `0`。空数组未单独作为通过依据。
- **尺寸结论**：桌面筛选/操作按钮 32px，移动端 44px 触控目标；当前没有证据支持缩小移动选择框。`LxInputNumber` 桌面步进 P2 继续等待设计决策。
- **下一入口**：继续未关闭的基础组件与已登记 P1/P2，完成组件库全库门禁后再进入 Vue3 宿主替换。

## [2026-10-17] LxCascader 与 LxTreeSelect 组件门禁交接

- **验证**：定向单测 **32/32**（Cascader 18、TreeSelect 14）；文档 Playwright **10/10**；覆盖键盘、单选/多选、空态、loading、失败重试、禁用、Escape、窄屏、HUD 和减少动效。
- **Impeccable B**：证据目录为 `.impeccable/critique/treeselect-cascader-assessment-b-2026-10-17/`。六路 detector JSON/stderr/退出码均核验为合法 `[]`、空 stderr、退出码 `0`；浏览器 JSON 可解析且退出码 `0`。空数组未单独作为通过依据。
- **结论**：当前组件范围未发现可复现 P0-P2，UI-10 严格矩阵登记为 11/52。真实宿主替换、权限/后端联调、整库 Impeccable 和 Element Plus 删除仍后置。
- **下一入口**：继续处理未关闭的基础组件正式审查与已登记 P1/P2，之后才进入 Vue3 宿主分批替换。

## [2026-10-17] LxStatusSwitch 确认竞态修复交接

- **实现**：新增 `contextKey` 用于绑定行/实体上下文；确认等待期间同时校验状态版本、业务值、实体键、loading、只读和权限。加入单实例确认互斥锁，避免重复 Space 或程序调用打开多个确认框；确认配置做快照，避免宿主原地修改对象影响已打开的确认。只读/无权限标签保留调用方自定义 `aria-label`。
- **验证**：定向单测 **21/21**；lx-ui 与 Vue3 `vue-tsc --noEmit` 通过；目标 Prettier 已通过。宿主 ESLint 对 `linkx-fe` 跨目录文件按配置忽略，未将该警告计为代码失败。
- **复验**：文档 Playwright **4/4** 通过；新的 Assessment B 证据见 `.impeccable/critique/statusswitch-assessment-b-2026-10-17-reverify/`。三路 detector JSON/stderr/退出码均核验为合法 `[]`、空 stderr、退出码 `0`，浏览器 JSON 可解析且退出码 `0`。空数组未单独作为通过依据。
- **边界**：未发现组件范围内可复现 P0-P2；Vue3 宿主替换、权限后端和 Element Plus 删除仍后置。
- **下一入口**：进入下一项未关闭 lx-ui 基础组件严格矩阵。

## [2026-10-17] LxStatusSwitch 当前版 Assessment B 复验

- **验证**：单测 **18/18**、文档 E2E **4/4**、Vue3 类型检查通过；覆盖 `0/1` 映射、确认竞态、只读/无权限降级、失败恢复、窄屏触控、HUD 和减少动效。
- **Impeccable B**：证据目录为 `.impeccable/critique/statusswitch-assessment-b-2026-10-17/`。组件、文档、Demo 三路 detector 均保存 JSON/stderr/退出码，均为合法 `[]`、空 stderr、退出码 `0`；Chromium 4/4 通过，无页面错误或失败请求。空数组不是单独通过条件。
- **边界**：组件级复验无新增 P0-P2；Vue3 真实 `StatusSwitch` 适配器、权限后端、宿主 Promise 链和 Element Plus 删除继续后置到 UI-04/UI-10/UI-11 门禁。

## [2026-10-17] LxDynamicForm 当前版复验

- **验证**：单测 **30/30**、文档 E2E **12/12**、类型检查通过；覆盖独立字段 renderer、Lx 基础控件、`value + change` 受控调用、`v-model`、单图/多图上传、远程候选取消/失败/迟到保护、自适应 3/2/1 列、校验/ARIA、主题和减少动效。
- **Impeccable B**：证据目录为 `.impeccable/critique/dynamicform-assessment-b-2026-10-17/`。三路 detector 均保存 JSON/stderr/退出码，结果为合法 `[]`、空 stderr、退出码 `0`；浏览器 12/12 通过。首次 E2E 的 `favicon.svg` 白名单误报已修正并复验。
- **边界**：组件级复验无 P0-P2；真实 API、权限、上传协议和 Vue3 宿主替换仍按 UI-04/UI-10/UI-11 后置。下一入口继续剩余组件门禁和整库审查准备。

## [2026-10-16] UI-04 前置组件：LxSectionTitle 当前版适配器交接

- **实现**：Vue3 `SectionTitle` 适配器透传 `subtitle` 属性和插槽；转发 `leading` 插槽并让其优先于映射的 `LxIcon` 和未映射图标的 Element Plus 回退，保留旧 `dashed` 默认、标题插槽、extra 和现有 props。库组件三变体、三档字号、标题层级、标签、窄屏和减少动效契约保持不变。
- **验证**：组件与适配器单测 **18/18**；`lx-section-title-docs.spec.ts` **1/1**；Vue3 类型检查、ESLint、Prettier、`git diff --check` 通过。
- **Impeccable B**：`.impeccable/critique/sectiontitle-assessment-b-2026-10-16/assessment-b-report.md` 保存 8 个 Light/HUD 桌面/移动、RTL、减少动效视图、DOM 和静态 detector 三件套。三目标为合法 `[]`/空 stderr/0；8/8 视图无横溢出、页面错误或失败请求。运行时 8 条组件命中是 HUD 令牌与 LxTag 紧凑尺寸提示，88 条为文档壳层/overlay，未发现组件 P0–P2。
- **审查边界**：Assessment A/B 已完成；真实业务组合、extra loading/失败恢复、权限、后端联调和读屏器仍待宿主波次。`COMPONENT-SPEC.md` 的单 variant 为历史冲突，当前三 variant 规范已补注。下一波为 G2 `LxSearchBar`/`LxStatusSwitch`。

## [2026-10-16] G2 LxSearchBar 布局与适配器修复交接

- **实现**：标准四字段使用 `span 6` 四列，第四列内部渲染查询/重置操作；Vue3 `SearchBar` 适配器隐藏库默认状态行，支持 action `key`、`selectedCount` 批量禁用和 `action` 事件。
- **验证**：库单测 **9/9**、适配器单测 **2/2**（合计定向测试 **11/11**）、文档 E2E **4/4**；类型检查、Prettier 和差异检查通过。
- **迁移边界**：旧 Vue2 的组织树、日期格式、`getSearchParams`/`org-change`/实例方法依赖具体业务 API，当前只登记为迁移缺口，不伪造通用接口。后续逐页用 lx-ui `fields`/`filters` 和业务参数映射完成。

- **Assessment B 复验**：`.impeccable/critique/searchbar-assessment-b-2026-10-17/assessment-b-report.md` 保存三路 detector JSON、stderr、退出码及 Chromium 结果。三路静态输出为合法 `[]`、stderr 为空、退出码 `0`；文档 E2E **4/4** 通过，覆盖成功/空/错恢复、重置、loading、375px 和四字段同行布局。空数组未单独作为视觉通过依据。

## [2026-10-16] UI-04 前置组件：LxMetricCard 当前版趋势语义交接

- **实现**：`LxMetricCard` 新增 `trendDirection` 类型与计算图标，显式 `down`/`flat` 不再由状态颜色猜测；未传入时保留 `trendStatus === 'error'` 下行、其他上行的旧兼容规则。Badge 内 `LxStatusDot` 增加 `aria-hidden="true"`，文字仍提供状态信息。
- **验证**：组件定向单测 **15/15**；`lx-metric-card-docs.spec.ts` **3/3**；lx-ui 类型检查、构建及目标格式检查通过。E2E 断言覆盖显式上行/下行/持平示例和旧错误态下行回退；独立复跑因登录鉴权和代理超时阻断，记录为环境失败，不改写此前通过的 Mock 证据。
- **Impeccable B 证据**：`.impeccable/critique/metriccard-assessment-b-2026-10-16-recheck/` 含三个目标的 `stdout.json`、`stderr.log`、退出码、Light/HUD 桌面和移动截图及 DOM 记录。三件套均为合法 JSON `[]`、空 stderr、退出码 `0`；浏览器五视图无页面错误或失败请求，命中归因于 VitePress 文档壳层。`[]` 只代表静态规则零命中，不能替代浏览器证据。
- **审查边界**：Assessment A 的趋势方向与 Badge 重复读屏问题已修复，最终 A/B 复核未发现组件 P0–P2；只读 hover 可点击暗示和标题 heading 语义保留为低优先级后续评估。未执行真实读屏器、真实后端联调和宿主组合迁移。
- **交接下一步**：不修改权限中心、字段权限、页面操作引导或 Vue3 `element-plus` 依赖；下一波进入 `LxSectionTitle`，之后继续基础组件和 `LxDynamicForm` 门槛。

## [2026-10-16] UI-10 / Wave 25 LxAuthImg 当前版审查收口交接

- **修复范围**：`linkx-fe/src/components/LxAuthImg/index.vue` 记录已加载地址并在复用时补发完成事件；用当前图片元素身份与地址双重校验隔离 A→B→A 迟到事件；显式宽高下移除 frame 的加载期最小尺寸。单测补充空地址复用、旧节点事件和 12×14 小尺寸加载时序。
- **验证结果**：`other-admin/admin-vue3/tests/unit/lx-auth-img.test.ts` **17/17**；`tests/e2e/lx-auth-img-docs.spec.ts` **5/5**；lx-ui `vue-tsc`、库构建 206 modules、VitePress 构建、Vue3 `vue-tsc`、目标 Prettier 和 `git diff --check` 通过。pnpm 构建仅保留已有配置及大 chunk 警告；linkx-fe 未安装独立 ESLint CLI，命令失败属于环境门禁缺失，不是代码错误。
- **Impeccable B**：`.impeccable/critique/authimg-assessment-b-final-2026-10-16/` 及同目录 detector、截图、DOM、源码指纹和停止证据。detector JSON `[]`、stderr 空、exit 0；Light/HUD × 桌面/375px 四视图全部 HTTP 200、注入成功，页面错误、失败请求和 HTTP 400+ 响应为 0；运行时命中均为文档壳层、代码示例、props 滚动容器或 HUD 令牌，未命中组件节点。空数组不是视觉通过的单独证明。
- **A 路与综合结论**：当前版独立 A 为 **37/40（Good）**，四视图均 HTTP 200，页面错误和失败请求为 0；综合报告、趋势和复验材料均位于 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`。代码复审未发现可复现 P0–P2。
- **矩阵状态**：UI-10 从 8/52 更新为 **9/52**，仅表示 LxAuthImg 组件严格矩阵收口。真实鉴权后端联调、Vue3 AuthImg 适配和全库 Element Plus 替换仍冻结；下一入口为 `LxMetricCard` 与 `LxSectionTitle`，随后进入 G2 `LxSearchBar` 与 `LxStatusSwitch`；页面操作引导继续暂缓、不进入排期。

## [2026-10-15] UI-10 / Wave 24 LxActionButtons 严格矩阵关闭与下一入口

- **完成范围**：按 `design/按钮体系/` 严格复核 LxActionButtons 组件、Demo、中文 API、权限语义、Light/HUD、桌面/375px 和键盘/溢出菜单行为。省略 `auth` 为公开操作；显式空字符串、空数组、缺少权限源或无匹配权限时隐藏。A 路关闭原权限示例 P2。
- **验证结果**：单测 **18/18**、文档 Playwright **9/9**；Vue3 类型检查和目标 ESLint、lx-ui 类型检查/206 模块构建、VitePress 文档构建、Stylelint、目标 Prettier、`git diff --check` 通过。构建只有已知 pnpm 配置和 VitePress 大 chunk 警告。
- **Impeccable 与代码复审**：A **33/40（Good）**，无开放 P0–P3；B 四个 detector 为有效 JSON `[]`、stderr 空、退出码 `0`，8 个浏览器视图 overlay 均成功注入，无页面错误、失败请求或 HTTP 错误。HUD 命中按主题令牌核对；移动根宽变化仅由注入 overlay 造成。独立代码复审批准，无可复现 P0–P3。
- **证据与边界**：A 复验位于 `.impeccable/critique/assessment-a-actionbuttons-auth-contrast-20261015/`；B 证据位于 `.impeccable/critique/actionbuttons-assessment-b-final-64a2951-2026-10-15/`；综合快照为 `.impeccable/critique/2026-10-15T03-34-29Z__linkx-fe-src-components-lxactionbuttons-index-vue.md`，趋势首条 33/40。UI-10 为 **8/52**；Vue3 29 处宿主引用仍待 UI-04，真实权限后端未联调。
- **下一步**：按未关闭组件矩阵进入 `LxAuthImg`；真实鉴权联调等待可信后端契约与环境。页面操作引导继续暂缓、不进入待办或排期。
- **提交边界**：按约定将本波实现/回归与项目计划/审计/地图/交接按白名单分开提交并推送；不得包含根目录用户文件 `0`、`.pnpm-store/` 或 `.impeccable/`。

## [2026-10-15] 全菜单 Mock 预览 E2E 复验与下一入口

- **验证结果**：在 `other-admin/admin-vue3` 将 `MOCK_PREVIEW_PORT` 设为 `31853` 后运行 `pnpm exec playwright test --config=playwright.preview.config.ts`，10/10 通过。关联人员搜索竞态 4 项、全菜单/样例与北向 CRUD/轮播/AuthImg 场景 6 项均通过；服务器使用本地 Mock，未占用 `30847` 用户预览端口。
- **范围边界**：本次只复验 Mock 预览与交互，不代表真实后端联调；当时 UI-10 计数为 7/52，此后 LxActionButtons 已关闭并更新至 8/52。
- **当时下一步**：随后按矩阵进入的 LxActionButtons 已在 Wave 24 完成；当前交接入口为 `LxAuthImg`。`LxInputNumber` 桌面步进目标尺寸 P2 继续等待设计决策；页面操作引导暂缓，不实施、不拆分、不排期。

## [2026-10-15] lx-ui / Wave 23 LxButton Demo 键盘焦点复验

- **完成范围**：完整演示锚点现在将键盘焦点交给可见标题，命名区域由标题命名；尺寸选择框键盘聚焦时显示 2px 主色外框。没有修改 `LxButton` 公开 API 或业务行为。
- **验证结果**：文档 E2E 19/19；补充主题色断言后焦点专项回归 1/1。目标 Prettier、E2E 文件 ESLint、`git diff --check` 通过；断言覆盖键盘到达、`:focus-visible`、Light/HUD 计算色、2px 实线外框和窄屏边界。
- **Impeccable 与代码复审**：A 初评 30/40（Good）；尺寸选择框 P2 经 A 路 Light/HUD × 桌面/320px 四视图复验关闭，旧 320px 工具栏 P3 未复现。B 三个源码检测器均为有效 `[]`/空 stderr/退出码 0；四个 Light/HUD × 桌面/390px 浏览器上下文的覆盖层注入成功，无页面错误、失败请求或 HTTP 错误。命中归因到 VitePress 代码复制控件、文档外壳/长内容及 HUD `--lx-color-primary` 令牌，不作为按钮 Demo 缺陷。代码复审指出的主题色断言 P3 已修复并复验；最终批准，无未关闭 P0–P3。
- **证据与边界**：A 初评和复验位于 `.impeccable/critique/lxbutton-wave-2026-10-14-final/assessment-a/`，B 的检测器输出、stderr、退出码、源码指纹、浏览器 JSON 和截图位于同目录 `assessment-b/`；正式综合快照为 `.impeccable/critique/2026-10-14T16-33-46Z__linkx-fe-src-components-lxbutton-index-vue.md`。本波记录时 UI-10 为 **7/52**；后续更新见 Wave 24。该记录不代表 Vue3 宿主替换或真实后端联调；`LxInputNumber` P2 仍等待设计决策。

## [2026-10-14] UI-10 / Wave 22 LxInput 严格矩阵交接

- **完成范围**：关闭 `LxInput` 当前 UI-10 严格矩阵行，全库计数更新为 **7/52**。按设计稿复核 32px 基准、四态、焦点/错误/禁用/只读、清空交互、键盘和窄屏目标；桌面清空入口 hover/focus 显示、触屏或 640px 以下有值即显示，作为已记录的有意设计差异。
- **验证结果**：单测 13/13、共享基础控件文档 E2E 11/11、最终两段提示断行复验 1/1；lx-ui 类型检查/构建、VitePress、Vue3 类型检查/生产构建、目标 ESLint/Prettier 与差异检查通过。Impeccable A 34/40；B 三个 detector 均为 JSON `[]`/空 stderr/退出码 0，Light/HUD × 桌面/390px 四视图注入成功。独立代码复审无 P0–P3。`[]` 只表示静态规则零命中。
- **复验和归因**：320/390px 提示各自单行显示，没有孤字或拆词；无 overlay 页面宽度正常。overlay 的长行命中落在文档和 Demo 说明，复制按钮遮罩属于 VitePress 代码块，HUD 命中符合令牌；根宽变化仅在 overlay 注入后出现。A 路最终报告和截图见 `.impeccable/critique/lxinput-wave-2026-10-14/assessment-a-final-reverify-2026-10-14/`；B 路完整报告、detector 原始输出、DOM、截图和源码指纹见 `.impeccable/critique/lxinput-wave-2026-10-14/assessment-b-final-content-2026-10-14/`；综合 snapshot 为 `.impeccable/critique/2026-10-14T02-31-56Z__linkx-fe-src-components-lxinput-index-vue.md`。
- **范围边界与下一步**：不代表 Vue3 宿主替换、真实后端联调或人工读屏完成。继续未关闭 UI-10 矩阵；`LxInputNumber` 桌面步进目标尺寸 P2 等待设计决策。页面操作引导暂不考虑、不继续拆分、不纳入待办或排期，后续确有需要时再恢复计划。

## [2026-10-14] UI-10 / Wave 21 LxTextarea 严格矩阵交接

- **完成范围**：关闭 `LxTextarea` 当前 UI-10 严格矩阵行，组件库全库计数更新为 **6/52**。三行基准、长度截断/校验、错误和焦点、禁用/只读、主题、键盘、窄屏及减少动效均按 `design/表单控件八件套/code.html` 第 08 区核验。
- **验证结果**：定向单测 14/14、共享基础控件文档 E2E 11/11；Playwright 使用隔离端口 4179，Select 状态断言限定 basic Demo 并断言唯一节点。lx-ui 类型检查、206 modules 构建、VitePress、Vue3 生产构建、目标 ESLint/Prettier、Stylelint 与 `git diff --check` 通过。生产构建既有告警见 Wave 16 记录。
- **设计差异**：设计稿 `p-2.5` 为 10px 内边距，当前组件为 8px 垂直/12px 水平令牌；基准高度约 74px，实测 76px。矩阵如实记录约 2px 的映射与高度差；当前 A/B 和代码复审未发现组件级 P0–P3，但不写作像素值完全一致。
- **Impeccable 与代码复审**：Assessment A 31/40（Good），无 P0–P3；Assessment B 两个 detector 为合法 `[]`/空 stderr/退出码 0，六个主题/视口视图完成。独立代码复审批准 E2E 定位修改；它的独立运行在到达新断言前遇到服务代理超时，随后以隔离端口重跑，目标用例和 11 项全量均通过。原始证据见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`。
- **边界与下一步**：不代表 Vue3 宿主替换、真实后端联调或 NVDA/VoiceOver 人工读屏完成。`LxInput` 已于 Wave 22 关闭；`LxInputNumber` 桌面目标尺寸 P2 仍等待设计决策。页面操作引导不在待办或排期中，后续确有需要时再恢复计划。

## [2026-10-14] UI-10 / Wave 20 LxSelect 严格矩阵交接

- **完成范围**：LxSelect 按 `design/表单控件八件套/` 完成当前组件、Demo、中文 API、主题/状态、键盘、窄屏与远程状态复核；登记 UI-10 第 5/52 项关闭。无组件级 P0–P2；参考页 9 个章节的目录密度为 P3 后续整理。
- **验证结果**：LxSelect 定向单测 15/15（两个文件）、文档 E2E 8/8、Vue3 全量 Vitest 565/565、隔离全菜单/预览 E2E 10/10；lx-ui 类型检查、206 modules 构建、VitePress、Vue3 类型检查/生产构建及目标格式/Lint 通过。Vue3 ESLint 忽略库源码，未记作库 ESLint 通过。
- **Impeccable 与代码复审**：双代理 Assessment A 36/40（Excellent）；B 四个 detector 均为有效 `[]`/空 stderr/退出码 0，六个浏览器上下文均完成，无页面错误、失败请求或 HTTP 错误响应。静态 `[]` 只表示规则零命中。loading 有确定性 E2E 断言但缺少可信专属截图；共享 VitePress 目录密度为 P3。独立代码复审无未关闭 P0–P2。A/B 与源码锁见 `.impeccable/critique/lxselect-final-2026-10-14-post-fix/`，snapshot 为 `.impeccable/critique/2026-10-14T00-42-11Z__linkx-fe-src-components-lxselect-index-vue.md`，趋势 33/40 → 35/40 → 36/40。
- **下一步**：对 `LxTextarea` 完成全库 UI-10 严格矩阵取证；InputNumber 桌面步进目标尺寸 P2 继续等待设计决策。全库门禁完成前继续保留 Vue3 宿主 Element Plus。页面操作引导不在待办、队列或排期中，后续仅在用户明确提出需要时再恢复评估。
- **提交边界**：组件、Demo、中文 API 与行为测试使用 `fix(lx-ui)`；Mock 预览与项目文档按白名单分开提交；项目计划、审计、地图、交接和路线图使用 `docs(project)`。`.pnpm-store/`、`.impeccable/`、`docs/.vitepress/cache/` 及根目录用户文件 `0` 均不得纳入提交。

## [2026-10-15] SCOPE / 页面操作引导暂缓，后续按需再执行

- 页面操作引导当前暂缓：不实施、不继续拆分，也不纳入待办、执行队列或排期；不作为 lx-ui 收口、Vue3 Element Plus 替换或其他迁移任务的前置条件。
- 本次已将此范围决定补充到 `doc/PROJECT-DELIVERY-PLAN.md` 首页；`doc/GUIDE-CONTENT-PLAN.md` 与 `doc/lx-ui/MENU-CONFIG-DESIGN.md` §14 仅保留历史需求和设计基线。后续确有需要时再恢复计划并执行，届时按当时的页面范围、文案、交互、技术方案及后端契约重新确认。
- 此范围说明不表示功能已经实现或验收，也不改变当前 lx-ui 与 Vue3 组件迁移顺序。

## [2026-10-13] SCOPE / 页面操作引导当前不执行，后续按需纳入计划

- 页面操作引导当前不执行、不纳入待办、执行队列或排期，也不作为其他迁移任务的前置条件；后续明确有需要时再重新确认并纳入计划。
- `doc/GUIDE-CONTENT-PLAN.md` 与 `MENU-CONFIG-DESIGN.md` 相关内容仅作需求与设计基线保留；重新启动时需确认页面范围、文案、交互、技术方案及后端契约。
- 该范围决定不改变基础控件与动态图标、`LxDynamicForm`、Vue3 Element Plus 替换的既定顺序，也不代表页面引导功能已实现或通过验收。

## [2026-10-13] UI-10 / LxInputNumber 当前版严格复核交接，桌面 P2 未关闭

- **评审结果**：Assessment A **29/40（Good）**。Assessment B 四个目标 detector 均为合法 JSON `[]`、stderr 空、退出码 `0`；Light/HUD × 桌面/375px 四视图注入成功，无横向溢出或浏览器错误。detector `[]` 仅说明静态规则零命中。
- **保留问题**：桌面 sm/md/lg 上下按钮高 13/15/19px，低于 24px。保留设计稿的 28/32/40px 外框及纵向均分布局时无法满足两个目标各 24px 高；未经设计决策不要静默改成横排。窄屏目标 44×44px，方向键、Tab、Enter、空格及焦点反馈正常。
- **范围边界**：本轮没有组件源码变更，不增加 UI-10 全库关闭数；`LxInputNumber` 严格矩阵行保持开放。A/B、浏览器截图、detector 三件套及源码指纹见 `.impeccable/critique/lxinputnumber-wave19-current-2026-10-13/`。桌面指针目标 P2 后续取得设计决策并复验。
- **下一步**：`LxTextarea` 已完成当前版组件级复核；按仍未关闭的基础控件矩阵进入 `LxSelect` 严格矩阵核验，再推进其他控件、动态图标、`LxDynamicForm`、剩余组件和整库门禁。页面操作引导当前不执行、不纳入待办、自动执行队列或排期；后续用户明确提出时再重新评估。

## [2026-10-13] lx-ui Wave 19 / Checkbox 与 Radio 四项 UI-10 严格矩阵登记

- **关闭范围**：`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 四行按统一标准登记关闭；UI-10 当前 **4/52**。标本尺寸、令牌映射、适用/不适用状态、Demo/API、行为覆盖和剩余项见 `doc/lx-ui/COMPONENT-AUDIT.md`。
- **证据**：设计源 `design/表单控件八件套/screen.png` 与 `code.html` 第 03/04 区；单测 23/23、当前文档 E2E 16/16、类型/构建/VitePress/Vue3 类型/目标格式与 Lint 均通过。Impeccable A 36/40；B 8 个静态目标合法 `[]`/空 stderr/退出码 0，8 个 Light/HUD × 桌面/375px 浏览器视图成功注入；独立代码复审关闭空错误断言 P2。综合报告与原始证据见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`，正式快照见 `.impeccable/critique/2026-10-13T09-44-41Z__linkx-fe-src-components-lxcheckbox-index-vue.md`。
- **剩余/边界**：无组件级 P0–P2；桌面文档导航密度与未来可编辑表格的方向键边界为非阻塞 P3。真实读屏器、Vue3 宿主替换、后端联调及其余 48 项仍未完成。
- **下一步**：`LxInputNumber` 当前版桌面步进目标尺寸 P2 已完成复核但仍开放，详见本文件最新交接；`LxTextarea` 已于 Wave 16 完成组件级复核，下一项按未关闭矩阵行为 `LxSelect`。页面操作引导当前不执行、不纳入待办或排期。

## [2026-10-13] lx-ui Wave 18 / Checkbox 与 Radio 当前版复核及窄屏 P2 收口

- **完成范围**：Checkbox Demo 将知情确认和通知渠道分组，并演示授权范围必填校验；Radio Demo 分离当前选项与历史只读快照，并演示响应通道必填校验。同步复核 Checkbox 禁用勾选/半选标记、Radio hover/纵向选中/禁用文字、中文组件 API 和 `disabled` 文档说明。
- **验证结果**：定向单测 23/23、当前文档 Playwright 16/16；lx-ui 类型检查、206 modules 构建、VitePress 文档构建、Vue3 类型检查、目标 Prettier、E2E 文件 ESLint 和 `git diff --check` 通过。Vue3 ESLint 将 `linkx-fe` 组件源码标记为 ignored，因此没有将它记录为库源码 ESLint 通过。历史计划文档未整篇重排。
- **Impeccable 结论**：最终全量 Assessment A 36/40（Excellent）；Checkbox 分组及 Radio 历史态容器两个 P3 已由独立 Light/HUD 桌面与 375px 复验关闭，无开放 P0–P2。B 的 8 个静态扫描目标均为有效 JSON `[]`、stderr 空、退出码 0；8 个独立浏览器视图注入成功，无页面错误或失败请求。Radio HUD 两个标签颜色与主色令牌及设计参考一致，属 detector 误报；375px 根宽从 375 增至 615 仅发生在 overlay 注入后，基线无页面溢出。独立代码复审关闭了空错误断言真空通过的 P2；共享页内目录密度和未来可编辑表格键盘处理为非阻塞 P3。
- **后续 P3**：桌面 VitePress 组件页本页导航约有 8–10 个同级锚点，留作共享文档外壳的信息架构评估，不作为组件缺陷或本波阻塞项。
- **证据版本**：旧记录的 8/8 与六视图结果只代表文档 P2 初验，不能代表新增表单示例后的当前版本。当前报告、A/B、截图、源码指纹与复审材料见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`；合法静态 detector `[]` 不单独代表视觉通过。
- **边界与下一步**：当前变更不关闭 Checkbox、CheckboxGroup、Radio、RadioGroup 的 UI-10 严格设计矩阵行，全库仍为 0/52；不代表 Vue3 页面替换、移除 Element Plus 或真实后端联调。按 `COMPONENT-AUDIT.md` 补齐这四个组件未关闭的矩阵证据，再继续基础组件、动态图标、`LxDynamicForm` 和 Vue3 Element Plus 分批替换。页面操作引导当前不执行、不纳入待办或排期；后续明确有需要时再重新纳入计划。
- **环境清理**：Assessment B 已停止 VitePress 与 detector 服务，端口 4177/8400 均无监听进程；当前复验的浏览器页面已关闭。

- **最终补记**：真实 `LxForm` 空错误节点探针在 Checkbox/Radio 两条恢复用例中通过，覆盖隐藏、零高度、无图标及无可见残留；空数组真空通过的 P2 已由独立代码复审确认关闭。综合报告、A/B 证据和复审文件均在 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`。

## [2026-10-13] lx-ui Wave 17 / LxSelect 当前版组件级复核交接

- **完成范围**：按 `design/表单控件八件套/` 完成 LxSelect 当前实现、Demo、中文 API、禁用值对比度、键盘、远程空/错/重试、Light/HUD 与窄屏状态复核。桌面 32px，390px 下触发器和选项行 44px；320px 注入前页面无横向溢出。
- **验证结果**：单测 11/11、文档 E2E 3/3；本轮定向 ESLint、Prettier、`git diff --check` 通过。lx-ui 类型检查、206 modules 构建、VitePress 文档构建和 Vue3 生产构建在实现阶段通过。
- **Impeccable 与代码复审**：Assessment A 33/40（Good），无 P0–P3；B 两个源码 detector 为合法 JSON `[]`、stderr 空、退出码 0，五种 Light/HUD × 桌面/窄屏及站点深色状态均有注入证据且无浏览器错误。overlay 命中主要属于文档、复制按钮和页面外壳；组件选项/标签命中已对照设计令牌与实测对比度复核。独立代码复审无 P0–P3。报告、A/B 证据、截图、指纹、清理记录及 snapshot/trend 位于 `.impeccable/critique/lxselect-wave-2026-10-13/`。
- **边界与下一步**：本波仅关闭 LxSelect 当前版组件级审查，不增加 UI-10 全库 0/52 计数，也不代表 Vue3 宿主替换、真实后端或人工读屏验收。下一步先修 Checkbox/Radio 组件 API 文档 375px 可读性 P2，再继续其余基础控件和动态图标、`LxDynamicForm` 与剩余组件矩阵。
- **提交约定**：本波组件/Demo/测试/API 文档与项目文档分两笔按文件白名单提交、推送；根目录其他既有改动不属于本波。

## [2026-10-13] lx-ui Wave 16 / LxTextarea 当前版组件级复核交接

- **完成范围**：按 `design/表单控件八件套/` 复核 `LxTextarea` 组件、Demo、中文 API、主题和长度/错误/焦点/禁用/只读状态；初始到限/超限不播报，正常转到限或超限只播报一次；disabled/readonly 校验字段隐藏计数且保留错误说明。
- **验证结果**：定向单测 14/14、共享基础控件文档 E2E 11/11、lx-ui 类型检查、206 modules 构建、VitePress 文档构建、Vue3 生产构建、定向 ESLint/Prettier、组件 CSS/HUD token Stylelint 与差异检查通过。`custom.css` 的 14 个属性排序问题都在未改动行；生产构建保留既有 Less/Element Plus/chunk 警告。
- **Impeccable 与代码复审**：Assessment A 31/40（Good），无 P0–P3；B 的两个 detector 为 `[]`/空 stderr/退出码 0，六个 Light/站点深色/HUD × 桌面/移动视图注入成功。移动根文档扩宽仅出现在 overlay 注入后（390px → 630px），基线及无 overlay E2E 无溢出，归因为覆盖层/页面外壳副作用。独立代码复审无 P0–P3。报告、18 张 overlay 截图、浏览器证据、源码指纹和正式综合 snapshot/trend 见 `.impeccable/critique/lxtextarea-wave-2026-10-13/`。
- **边界与下一步**：仅关闭 `LxTextarea` 当前组件级审查，不增加 UI-10 全库 0/52 计数，不代表宿主页面替换、真实后端或 NVDA/VoiceOver 人工验收完成。下一项为 `LxSelect`，随后按既定顺序完成其他基础控件、动态图标、`LxDynamicForm`、其余组件与整库审查，再替换 Vue3 Element Plus。
- **提交约定**：组件、Demo、行为测试和组件 API 文档使用 `fix(lx-ui): ...`；计划、审计、项目地图、迁移台账和交接使用 `docs(project): ...`，按本波文件白名单分开提交并推送。

## [2026-10-12] SCOPE / 页面操作引导暂缓，后续按需执行

- 页面操作引导暂不纳入当前执行队列、不主动排期，也不阻塞 lx-ui 收口或 Vue3 Element Plus 替换。
- 后续确有需要时，再重新确认页面范围、文案、交互、后端契约，并评估实施排期；`doc/GUIDE-CONTENT-PLAN.md` 与 `doc/lx-ui/MENU-CONFIG-DESIGN.md` 仅作为需求草案和未来设计基线。
- 本次只调整范围备注，不代表引导功能已实施或完成验收。

## [2026-10-12] lx-ui Wave 15 / LxInputNumber 当前版组件级复核交接

- **完成范围**：按 `design/表单控件八件套/code.html` 05 复核组件、Demo、中文 API 和尺寸；sm/md/lg 外框为 28/32/40px，步进器按钮连续贴合，`controls` 参数可隐藏步进器。readonly 保留步进操作但禁止直接输入；修正 min/max 中文禁用说明，并阻止合成方向键冒泡到宿主快捷键。
- **验证结果**：单测 18/18、InputNumber 文档 E2E 2/2、lx-ui 类型检查、206 modules 构建、VitePress 文档构建、Vue3 类型检查与生产构建、目标 Stylelint/ESLint/Prettier、`git diff --check` 通过。生产构建警告来自既有 Element Plus 大 chunk、Less 变量导出和循环 chunk。
- **Impeccable**：Assessment A 31/40（Good）；Assessment B 组件和 Demo detector 为合法 JSON `[]`、stderr 空、退出码 0，四个 Light/HUD × 桌面/窄屏视图注入成功，页面错误和失败请求为 0。A/B 原始报告、逐项命中归因、截图和指纹位于 `.impeccable/critique/lxinput-wave-2026-10-12/final-stepper-event-fix/`；综合 snapshot 为 `.impeccable/critique/2026-10-12T14-02-10Z__127-0-0-1-components-lxinputnumber.md`，趋势首条 31/40。
- **审查处置**：代码复审无新的 P0–P3。桌面按钮目标高度 13/15/19px 按设计源上下均分结构保留，作为待设计决策观察项；不宣称满足桌面 24px 指针目标下限。窄屏步进目标为 44×44px，键盘路径实测通过。表单错误态 Demo、尾注重复列为后续 P3。
- **边界与下一步**：桌面步进目标高度 P2 尚待设计决策，`LxInputNumber` 严格矩阵行保持开放且不增加 UI-10 全库关闭数；可并行进入下一项 `LxTextarea` 复核。本波不代表 Vue3 Element Plus 替换、真实权限或后端联调完成。页面操作引导继续暂缓、后续按需恢复。
- **提交约定**：组件、Demo、行为测试和组件 API 文档使用 `fix(lx-ui): ...`；交付计划、审计、路线图、项目地图、迁移台账和交接使用 `docs(project): ...`，按文件白名单分开提交并推送。

## [2026-10-12] lx-ui Wave 14 / LxInput 当前版组件级复核交接完成

- **完成范围**：按表单控件设计源复核 LxInput、Demo 与中文 API；清空按钮支持键盘操作和 44×44px 触屏目标，必填、禁用/只读、公开方法、错误提示排版、320px 网格及 Demo 标题层级均已核对。codeview 发现并修复父级 `LxForm disabled` 未同步禁用自定义清空按钮的问题。`autocomplete="off"` 已明确为不可靠的浏览器提示，不能作为敏感信息保护措施。
- **验证结果**：最终单测 13/13；LxInput 文档 E2E 3/3，邻接 InputNumber E2E 1/1。共享基础控件 E2E 全量运行 6/8，另两项旧断言分别将 LxSelect 的“指挥中心（可过滤）”误写为“指挥中心”，以及将 DatePicker 的“文档站整体深色（HUD）”误写为“HUD 深色主题”，详见测试输出；这两项不是 LxInput 回归。lx-ui 类型检查、205 个模块的库构建、VitePress 文档构建、Vue3 类型检查、目标 ESLint/Prettier 和 `git diff --check` 通过。Stylelint 因环境缺少 `postcss-less` 无法启动。
- **Impeccable**：最终 Assessment A 34/40（Good），无 P0–P2。组件与 Demo detector 均为合法 JSON `[]`、stderr 空、退出码 0；Light/HUD × 1440/390px 四视图均成功注入 overlay。命中归因、源码指纹、截图、停服记录和 snapshot/trend 见 `.impeccable/critique/lxinput-wave-2026-10-12/`。静态 `[]` 只表示静态规则零命中。
- **代码复审与遗留项**：父级禁用、`change` 事件说明、显式禁用/只读清空测试和 `clearable` 类型注释均已修正；最终 codeview 未发现 P0–P2。保留联系电话计数精确文案及窄屏工具栏键盘焦点两项 P3 测试增强建议，不阻塞下一波。
- **范围边界**：本波不增加 UI-10 全库 52 项关闭数，不代表宿主表单、真实权限/后端、Vue3 Element Plus 替换完成；页面操作引导继续暂缓。下一步按组件矩阵进入 `LxInputNumber`。
- **提交约定**：组件/Demo/测试使用 `fix(lx-ui): ...`；路线图、审计、项目地图、迁移台账和交接使用 `docs(project): ...`，按文件白名单分开提交并推送。

## [2026-10-12] lx-ui Wave 13 / LxButton 组件级正式收口

- **完成范围**：按钮实现、Tooltip 并发协调和动画约束、尺寸与明暗主题、纯图标短标签、窄屏触控、键盘锚点、中文 Demo/API 和行为回归已按当前源码冻结完成。
- **验证结果**：定向单测 33/33、文档 Playwright 19/19；`pnpm typecheck`、205 modules `pnpm build`、`pnpm build:docs`、目标 ESLint/Prettier、`git diff --check` 均通过。E2E 使用 `playwright.lxui.config.ts` 和共用 Mock。
- **Impeccable**：A 32/40（Good），桌面纯图标标签 P2 已关闭；320px 工具栏高度与完整演示 region 焦点框两项 P3 决定后置。B 三 detector 均为有效 JSON `[]`、stderr 空、退出码 0；8/8 Light/HUD × 320/375/1024/1280 视图注入成功。overlay 宽度增加由 detector 标签坐标归因，未注入页面本身无横向溢出。综合报告、snapshot/trend、A/B 和代码复审见 `.impeccable/critique/lxbutton-wave-2026-10-12/final-after-label-fix/`。
- **边界**：不增加 UI-10 全库计数，不代表 Vue3 业务按钮全面替换、真实权限或后端联调完成。页面操作引导继续暂缓。下一步按计划进入 `LxInput` 基础控件严格复核。
- **提交约定**：组件实现与 E2E 使用 `fix(lx-ui): ...`；路线图、交付计划、审计、地图、迁移台账和交接记录使用 `docs(project): ...`；按本波白名单分开提交并推送。

## [2026-10-11] SCOPE / 页面操作引导暂缓执行

- 用户决定页面操作引导暂时不执行，后续确有需要时再恢复。
- 已同步更新 `doc/GUIDE-CONTENT-PLAN.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-FOLLOWUP-BREAKDOWN.md`、`doc/PROJECT-MAP.md` 和 `doc/lx-ui/MENU-CONFIG-DESIGN.md`：该项不进入当前执行队列、不自动排期、不阻塞 lx-ui 收口或 Vue3 Element Plus 替换；恢复前重新确认页面范围、文案、交互、后端契约和技术方案。
- 本次仅调整计划备注与交接，不代表页面引导功能已经实现或完成验收。

## [2026-10-11] Wave 11 交接：LxDescriptions 当前版正式 A/B 收口

- **完成范围**：完成长值和长状态的键盘可读性、状态点完整名称、复制按钮 44px 触控底线、错误重试、窄屏表格焦点/方向键、HUD、主题和 reduced-motion 复核；同步 Demo 分组、中文 API、响应式表格提示、9 项单测和 3 项文档 E2E。
- **实际验证**：单测 9/9、文档 E2E 3/3、lx-ui `typecheck`、203 modules `build`、VitePress `build:docs`、目标 Prettier 和 `git diff --check` 通过；保留既有 chunk 大小警告。API 请求链保持 `.then().catch().finally()`。
- **Impeccable**：A 原始评分 4.1/5；按当前综合表记录 31/40（Good），无 P0-P3。B 42 个独立 context 全部 HTTP 200、注入成功、无页面/控制台/请求错误；当前三份 detector 为 JSON `[]`、空 stderr、退出码 0，旧退出码异常记录已标为无效。报告、snapshot/trend、代码复审和停服证据在 `.impeccable/critique/descriptions-wave-2026-10-11/`。
- **未完成/边界**：API 表格无溢出时的滚动提示一致性、指标采集 role 字段核对、真实屏幕阅读器/缩放/跨浏览器/剪贴板/后端联调列入后续；不关闭 UI-10 全库计数，不代表 Vue3 页面迁移、权限中心、字段权限、引导页或 Element Plus 删除完成。
- **下一步**：按 `doc/lx-ui/COMPONENT-AUDIT.md` 继续基础控件严格设计对照和正式 A/B，完成组件库门禁后再进入 Vue3 Element Plus 分批替换。实现提交与项目文档提交继续分开使用 `fix(lx-ui): ...` / `docs(project): ...` 并推送 `origin/main`。

## [2026-10-11] UI-10 / Wave 12 交接：LxMetricCard 与 LxSectionTitle

- **目标**：完成指标卡与区块标题的当前版设计、行为、无障碍、窄屏和动效审查，并修复复评发现的契约缺口。
- **改动文件**：`linkx-fe/src/components/LxMetricCard/index.vue`、`LxSectionTitle/index.vue`/`types.ts`/Demo、`LxTag/index.vue`；`other-admin/admin-vue3/src/components/SectionTitle/index.vue`；对应中文文档、单测和文档 E2E；`linkx-fe/src/index.ts` 增加 `LxSectionTitleHeadingLevel` 根出口。
- **完成内容**：指标状态读屏文本和进度 ARIA；标题层级、副标题、长标题换行和 Demo 键盘反馈；LxTag 紧凑尺寸对齐设计；适配器保留旧 props/slots 并透传新层级类型。
- **实际验证**：定向单测 32/32、文档 E2E 4/4、宿主/lx-ui 类型检查、203 modules 库构建、VitePress 构建、Vue3 生产构建、目标 ESLint/Prettier、差异检查通过。Impeccable A 37/40；B 三 detector `[]`/空 stderr/exit 0，10 个视图 overlay 成功；代码复审无 P0–P2。
- **审查说明**：B 的 `cramped-padding` 指向示例 LxTag，`2px 6px` 有 `design/区块标题 SectionTitle/code.html` 依据；窄屏 Props 表格只在自身容器滚动。不能把 detector `[]` 单独当作视觉通过。
- **未完成/阻塞**：Vue3 详情抽屉 6 处 MetricCard 和配置页真实 SectionTitle 组合回归；真实后端、权限、读屏器和上传协议；全库 UI-10；Element Plus 删除门禁。4174 未触碰。
- **下一步**：对 `LxDescriptions` 当前版补正式 A/B/overlay/snapshot/trend；再按组件矩阵处理剩余基础控件和页面宿主替换。
- **提交范围**：第一笔仅本波组件、适配器、测试和组件文档，使用 `fix(lx-ui): ...`；第二笔仅计划、交接、审计、迁移和 Impeccable 综合证据，使用 `docs(project): ...`。提交前复跑目标门禁并推送 `origin/main`。

## [2026-10-11] Wave 11 交接：LxVirtualTree 插槽行布局与 TransferPanel 联回归完成

- **完成范围**：`LxVirtualTree` 新增公开 `rowLayout`、`nodeSummary`、`LxVirtualTreeNodeSlotProps` 和 `LxVirtualTreeSlots`；`stacked`/`responsive` 统一行高、虚拟占位、滚动偏移和焦点恢复。`LxTransferPanel` 已改用该公开契约，移除树行元信息的 `:deep` 覆盖；窄屏长名称提供“查看全文/收起”。
- **验证**：VirtualTree + TransferPanel 定向单测 **67/67**；VirtualTree 文档 E2E **14/14**；TransferPanel 文档 E2E **33/33**；lx-ui 类型检查、203 modules 构建、VitePress 构建、Vue3 生产构建、目标 Prettier/ESLint、`git diff --check` 通过。未改变业务 API、路由、权限键、真实协议或 Vue3 `element-plus` 依赖。
- **Impeccable**：Assessment A **31/40（Good）**。Assessment B 四个 detector 目标的 JSON、stderr、退出码分别为 `[]`、空、`0`；浅色/HUD 桌面和窄屏六个独立 context 均 HTTP 200、注入成功、无 page error，并保存 overlay、DOM、长筛选和键盘证据。合法 `[]` 只表示源码静态零命中，浏览器命中已按文档壳、HUD 令牌和标注层归因。证据目录为 `.impeccable/critique/lxvirtualtree-wave11-2026-10-11/`。
- **代码复审**：结论批准，无 P0-P3；原 P3 类型注释已修正为“固定行容器、`stacked`/`responsive` 可使用第二行、仅展示型元信息”。剩余 `:deep` 仅为树容器、选择信息、viewport 布局和 Element Plus checkbox 内核尺寸，当前无行为回归。
- **遗留与下一步**：多行 slot 的可见内容仍受固定行契约约束，完整文本由 `nodeSummary` 的 `aria-label/title` 兜底；窄屏已选列表首屏密度、批量按钮层级和 Demo 控制密度记录为后续 P2。宿主保存状态、`DataPermissionTree` 替换、真实权限联调及 UI-10 `0/52` 保持开放。完成两笔提交/推送后进入下一组件审查批次。

## [2026-10-11] Wave 11 交接：LxDescriptions Demo 控件密度阶段性收口

- **完成范围**：`linkx-fe/src/components/LxDescriptions/demo/basic.vue` 增加布局组名，数据状态改用 `LxSelect`；`lx-descriptions-docs.spec.ts` 覆盖分组、边框、375/320px、状态恢复和键盘选择。
- **验证**：组件单测 6/6、文档 E2E 3/3、类型、目标格式、修后代码复审和 `git diff --check` 通过。代码复审原 P2/P3 已关闭：交互定位统一使用可访问 `combobox`，键盘路径为 Enter/ArrowDown/Enter。
- **审查边界**：A 31/40，有桌面/窄屏截图；B 三个 detector 合法 `[]`、空 stderr、exit 0，但 Edge 新 profile 启动失败、overlay 未注入，不能登记正式视觉 Critique。证据与报告见 `.impeccable/critique/lxdescriptions-p2-2026-10-11/`。
- **下一步**：冻结并复验当前 `LxVirtualTree` 的自定义 node 插槽固定行高、长文本、滚动和焦点，联跑 TransferPanel；继续保持 Vue3 页面替换和权限/真实后端联调后置。

## [2026-10-10] Wave 9 正式交接：LxUpload 回灌 UID 与公开 abort

- **完成范围**：补充无 UID 文件生成 fallback UID、父级原样回灌后调用公开 `abort(file?)` 的组合回归；验证请求取消、队列状态复位和受控值 UID 保持一致。
- **验证**：LxUpload 单测 38/38。文档 E2E 7 项批量通过；文档服务中途退出造成 2 项连接拒绝，两个用例已独立重跑 2/2 通过，合计 9/9。详细记录 `.impeccable/critique/wave9-upload-2026-10-10/agent-notes.md`。
- **边界与下一步**：真实上传协议、服务端 AbortSignal 和业务页面替换仍未完成；下一波为 `LxDescriptions`、`LxVirtualTree` 当前版正式复验。API 请求继续使用 `.then().catch().finally()`。

## [2026-10-10] G2 正式交接完成：LxSearchBar + LxStatusSwitch

- Assessment A/B 独立报告已落盘；B 六个静态目标均为有效 `[]`、空 stderr、exit 0，浏览器 overlay、Teleport 确认、HUD、ARIA 和 375px 证据齐备。
- 本轮根据 A 的 P1/P2 修复：确认层支持影响范围与审计提示；StatusSwitch 所有只读、loading、无权限行补齐行名关联；SearchBar Demo 增加四字段标准态并移除重复等待状态。
- 定向单测 `26/26`，`vue-tsc --noEmit`、203 模块库构建、VitePress 文档构建、目标 ESLint、Prettier、SearchBar E2E `3/3`、StatusSwitch E2E `4/4` 通过。独立代码复审无 P0-P2；综合报告与正式 snapshot/trend 已收口，两个目标趋势均为非空 `39/40` 记录。当前先处理用户新增的 TransferPanel 选择框尺寸反馈，再进入 `LxDescriptions`、`LxVirtualTree`。
- 综合报告：`.impeccable/critique/g2-complete-2026-10-10/recheck-final/report.md`；正式快照：`.impeccable/critique/2026-10-09T19-51-41Z__linkx-fe-src-components-lxsearchbar-index-vue.md`、`.impeccable/critique/2026-10-09T19-51-41Z__linkx-fe-src-components-lxstatusswitch-index-vue.md`。`[]` 仅代表静态零命中，正式结论同时依赖独立 A/B、浏览器 overlay、stderr、退出码和快照。

## [2026-10-11] Wave 10 正式交接完成：TransferPanel 选择框视觉尺寸与密度复验

- 用户反馈文档页选择框过大；修复将树节点与页脚继承选框的视觉尺寸统一为 14×14px，保留树节点桌面 24×24px、窄屏 44×44px 点击区；页脚 `LxCheckbox` 标签点击区为桌面最小高 32px、触屏最小高 44px。代码已随提交 `ad797971` 合入。
- 修前 Assessment A 评分 33/40（Good），报告中的桌面树行信息拥挤已由浏览器截图确认并修复；320px 动作区拥挤为误报，页面/组件外框没有横向溢出。Demo 折叠项增加状态和主题摘要。改后 TransferPanel 文档 E2E 33/33、类型检查、203 模块库构建、VitePress 文档构建、目标 ESLint/Prettier 和 `git diff --check` 通过。
- 改后 A 为 35/40（Good）；B 的三个 detector 均为 JSON `[]`、空 stderr、退出码 0，且浏览器 overlay 成功覆盖桌面/窄屏亮色与 HUD。console 分组报告 28 项、逐条日志 29 项，差异已保留并逐项归因；320px 根滚动宽度增加由 overlay 标注层造成，移除 8 个注入节点后恢复。独立代码复审无 P0–P3。
- 证据见 `.impeccable/critique/transferpanel-final-2026-10-11/final-report.md`、`assessment-a/`、`assessment-b/` 与 `code-review/report.md`；当前目标 snapshot/trend 由 `critique-storage.mjs` 写入。A 的宿主保存状态进入 UI-04，11px 元信息和触屏长编码全文查看进入 VirtualTree 后续复验。
- 本波改后 E2E 33/33、类型检查、203 模块构建、VitePress 文档构建、目标 ESLint/Prettier 与 `git diff --check` 通过。收尾时 8400、43620、4174 均无监听；4174 本轮未重启。`.pnpm-store` 包缓存镜像不纳入提交。
- 下一入口按计划为 `LxDescriptions` Demo 控件密度 P2，再为 `LxVirtualTree` 当前版自定义插槽固定行高、滚动与 TransferPanel 共享回归。UI-10 52 项矩阵、Vue3 宿主组件替换和真实权限/后端联调不因本波关闭。

### 下一波执行清单

- **先做 LxDescriptions**：对照 `design/详情描述行 Descriptions/screen.png`、`code.html` 复核 32px 描述行、标签/值层级、复制字段、状态点、抽屉以及 320/375px。修复 Demo 控件密度：布局组增加可见组名；四个演示状态从平铺按钮改为有标签的状态选择器；布局仍用分段控件，边框和主题继续用复选框。文档 E2E 更新状态切换，并覆盖 375px 无横向溢出及边框开关实际生效；保留 6 项组件单测和既有主题、布局回归。完成库类型/构建、文档构建、目标格式/Lint、浏览器状态与键盘焦点检查后做独立 A/B、代码复审和 snapshot/trend。
- **再做 LxVirtualTree**：先冻结当前源码指纹并正式复验，不引用 Wave 6 的旧版截图或报告。确认自定义 `node` 插槽的固定行高契约；当前实现按固定高度虚拟滚动，文档要求单行但组件边界没有约束整个插槽。优先保留固定行高，在组件层限制行内容并使长文本仍可访问；只有确需多行时才设计可测量高度模式。补长文本与块级/多行插槽回归，覆盖桌面 32px、窄屏 44px、相邻行不覆盖、滚动偏移、`scrollToKey` 和焦点恢复。复验分组 Demo、键盘/级联选择、过滤、空/加载/错误、HUD、320/375px 和大量节点；改动后联跑 VirtualTree 单测/E2E、TransferPanel 单测及文档 E2E，再做独立 A/B、代码复审和 snapshot/trend。
- 每一波按已约定的两笔提交分开提交实现/回归与中文计划/审查证据，推送后再自动进入下一波；`DataPermissionTree` 宿主替换、真实权限保存和 UI-10 全库矩阵继续单独登记。

## [2026-10-10] G2 阶段性交接（历史记录，降级未正式收口）：LxSearchBar + LxStatusSwitch

- **SearchBar 已完成的实现范围**：根节点 `role=search`，loading 暴露 `aria-busy`，折叠按钮提示隐藏字段数量，移动按钮最小高度 44px，`prefers-reduced-motion` 下关闭图标过渡；单测 8/8、文档 E2E 3/3、类型/Prettier/ESLint 已通过。Assessment A 因浏览器不可启动为降级评审，评分 31/40（Good）。
- **StatusSwitch 已完成的实现范围**：确认等待期间检测 modelValue 版本、loading、disabled 和权限撤销，避免旧确认结果回写；loading 暴露 `aria-busy`，只读/无权限 Tag 暴露 `aria-disabled`；单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6。
- **Impeccable 证据**：本节原文保留为历史阶段性记录；正式复验已补齐 overlay、截图、ARIA、HUD、Teleport、减少动效和 1440/375px 证据。正式综合报告为 `.impeccable/critique/g2-complete-2026-10-10/recheck-final/report.md`，两个源码目标 snapshot/trend 已写入且均为 `39/40` 非空记录；`[]` 只表示静态零命中，不能单独代替视觉/交互结论。
- **下一位执行者**：G2 已关闭。先完成 `LxTransferPanel` 选择框尺寸反馈的源码修复、代码复审和有界 Impeccable 复验，再进入 `LxDescriptions`、`LxVirtualTree`；API 请求必须保持 `.then().catch().finally()`。

## [2026-10-10] Wave 7 正式交接完成，进入 G2

- **完成范围**：`LxTransferPanel` 与 `LxVirtualTree` 当前实现、中文 Demo/API、超长名称折叠展开、筛选恢复、滚动边界、触控按钮和文档预览宽度已冻结；API `panelHeight` 默认 380px，Demo 预览最大 820px。
- **验证与审查**：定向单测 64/64，TransferPanel 文档 E2E 32/32；lx-ui 类型/构建、VitePress 文档构建、Vue3 生产构建、目标格式与 ESLint 通过。Assessment A 32/40；Assessment B 三 detector 有效 `[]`、stderr 空、exit 0，浅色/HUD 六视图浏览器证据完整；代码复审无 P0–P3。
- **证据**：综合报告 `.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/final-report.md`，A/B、截图、overlay、JSON、stderr、退出码和哈希均在同目录；快照 `.impeccable/critique/2026-10-09T16-43-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。
- **后续**：P2/P3 观察项进入后续密度优化；UI-04 保留真实权限保存状态和 `DataPermissionTree` 宿主契约。下一波为 G2 `LxSearchBar` + `LxStatusSwitch`，完成一波后继续自动推进。

## [2026-10-09] Wave 7 / 320px 展开边界与筛选状态修复进度

- 用户继续要求子 Agent 使用 GPT-6.1-sol 中高思考强度；最终设计评估与 detector/浏览器评估使用 high，代码复审使用 medium，三路隔离。
- 修复前发现：320px 长历史项展开后滚到底时全文上沿与移除按钮被裁切；名称被筛选隐藏再恢复后原生收起状态与 `aria-expanded` 不一致。
- 当前修复：两行折叠、展开全文利用条目宽度、移除按钮固定于展开标题旁、元数据显式行高、原始键值显式内距；`details.open` 绑定展开集合，下一帧滚动只处理仍连接且仍展开的条目，以条目整体定位。
- 当前实测：320px 展开历史示例约 157px、列表视口约 168px。已补可见边界与按钮中心命中回归，新增筛选隐藏/恢复状态一致性用例。
- 验证状态：Prettier、目标 ESLint、lx-ui 类型检查通过；定向单测、32 项 E2E、构建和最终隔离评审待收口。此前 31/31 为本轮修复前通过记录，不作为当前最终版全部完成证据。
- 交接入口：`.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/`。最终证据齐备后按本波白名单分别提交实现与文档并推送，再进入 G2。

## [2026-10-09] Wave 7 / LxTransferPanel 文档预览宽度修复

- **用户反馈与处理**：文档页穿梭选择区显得过宽；Demo 预览限制为最大 `820px` 并居中，窄屏铺满正文可用宽度，组件 API 宽度和默认 `panelHeight=380px` 不变。默认 `240px` 紧凑高度仍保留，高度选择器现常显于示例上方，另有 `300px`/`380px` 档位。
- **评审建议处理**：窄屏标签和无障碍名称使用“待选”，不再把候选数量描述为可添加名额；批量操作提示单独说明剩余名额。组件文档在 Demo 旁明确示例只保存在本地内存，不代表权限已经保存。
- **验证**：两组件定向单测 **64/64**、TransferPanel 文档 E2E **30/30**；覆盖 1440px 居中限宽、390px 对比正文容器可用宽度、窄屏无横向溢出与候选标签。lx-ui/Vue3 类型检查、目标 Prettier、203 模块 lx-ui 构建和 Vue3 生产构建通过；VitePress 文档构建待完成。生产构建保留既有 Less 导出、Element Plus circular chunk、动态导入和 chunk size 警告。
- **代码复审**：独立 Luna 复审未发现 P0-P2；P3 记录为本交接旧测试计数/源码哈希过时，正在更新。正式 Impeccable A/B、综合报告及 snapshot/trend 正在最终收口；detector `[]` 只表示静态零命中。
- **后续边界**：UI-10 仍为 0/52，Vue3 `DataPermissionTree` 适配和真实权限保存反馈仍属 UI-04；真实后端联调按真实契约进行，保留 Vue3 宿主 `element-plus`。完成最终复验及本波白名单提交推送后进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## [2026-10-08] Wave 7 LxTransferPanel 修后交接（正式审查收口中）

- **范围与修复**：完成 `LxTransferPanel`/`LxVirtualTree` 的组件实现、中文 Demo/API 和状态回归；桌面采用 5:2:5 轨道与 380px `border-box` 同高面板，`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px。桌面树项基准行高为 32px；普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项标记与原始键值移至名称下第二行，实际截断的长名称才提供 disclosure；窄屏保持 380px 面板并完整换行，TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。行高跨断点时焦点恢复到 `treeitem` 的 P2 已修，VitePress 文档站已加入 SVG favicon。
- **验证**：`lx-transfer-panel.test.ts` 与 `lx-virtual-tree.test.ts` 合计 64/64，`lx-transfer-panel-docs.spec.ts` 28/28；VirtualTree 文档 E2E 的 13 项另行统计。lx-ui typecheck、TransferPanel E2E ESLint、目标 Prettier、`git diff --check`、lx-ui 203 modules build、VitePress docs build、Vue3 `build:prod` 均通过。后者保留既有 Less 导出、Element Plus circular chunk 和 chunk size 警告；VitePress 保留大 chunk 警告。
- **断言修正**：Range 的逐片段 `top` 差异把单行数字与普通文字误判为两行；独立 Chrome 复现中单行元素盒高 15px、真实两行 29px。E2E 改为验证 `white-space: nowrap`、盒高不超过 `line-height + 1px`、文本无横向裁切；320/390/880px 用例现已通过。
- **代码复审**：既有组件复审批准；本次 E2E 断言修订的最新独立复审待确认。
- **Impeccable 状态**：旧 A/B 仅作为修复前基线，不计正式通过；当前冻结源码的 Assessment B 浏览器证据已完成 **20/20**，正在收口证据索引和综合 snapshot/trend。完成综合报告和 snapshot/trend 前，Wave 7 仍为正式审查收口中。
- **边界**：UI-10 保持 0/52。Vue3 `DataPermissionTree` 替换仍属 UI-04，须对照真实 props/exposes/选择与回传契约完成 Mock/E2E；真实权限/后端联调需真实契约。保留 Vue3 `element-plus`。
- **下一步**：新的严格隔离 A/B 正式完成后再提交、推送并进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## [2026-10-07] UI-13 / Wave 5 选择器组件正式交接

- **范围**：`LxTreeSelect`、`LxCascader`、`LxSelectPagination` 的当前实现、类型、Demo、中文文档、主题样式和 Vue3 文档 E2E；没有改业务 API、路由、权限键、真实后端协议或 Vue3 页面。
- **行为结果**：TreeSelect 支持真实方向键/Enter 选择与清空，Cascader 提供英文错误/Retry、错误焦点和 375px 长节点换行，SelectPagination 处理表单 disabled、请求代次、取消、续页失败同页重试和禁用不请求。
- **实际验证**：定向单测 **36/36**、文档 E2E **15/15**；lx-ui 类型检查、203 模块构建、VitePress 构建、目标 ESLint/Prettier 和差异检查通过。4177 临时评审服务已停止，4174 保持用户预览。
- **独立审查**：A 32/40（Good），B 9 项 detector 均为有效 `[]`/空 stderr/exit 0，9 个浏览器场景 overlay 成功；代码复审无 P0–P2，P3 为长节点实际换行 E2E 覆盖增强。完整证据见 `.impeccable/critique/wave5-tree-select-pagination-2026-10-07/`。静态 `[]` 不代表视觉通过。
- **剩余项**：四项 P2（移动换行密度、错误旧状态、主题入口不对称、侧栏同级密度）转入下一波；不关闭 UI-10 全库矩阵。真实权限、后端联调和 Element Plus 删除仍冻结。
- **交接给下一波**：先处理上述文档/壳层 P2 与长节点 E2E，再进入 `LxUpload` fallback UID/abort 组合回归、`LxDescriptions`、`LxVirtualTree`、`LxTransferPanel`、`LxMetricCard`、`LxSectionTitle`、`LxStatusSwitch`、`LxSearchBar` 的设计对照、行为闭环、代码复审和 A/B；每完成一个批次自动提交、推送并更新交接文档。

## [2026-10-07] UI-13 / Wave 4 正式收口与下一波交接

- **范围**：`LxDatePicker`、`LxDynamicForm`、`LxUpload` 当前实现、字段 renderer、中文 API/Demo、Vue3 定向单测和文档 E2E。未修改业务 API、路由、权限键、真实上传协议或 Vue3 页面，也未移除宿主 `element-plus`。
- **行为补充**：短视口日期 E2E 现在检查触发器可见、弹层不相交并验证面板滚动；Upload 省略文件名保留完整 `title`，不改变窄屏省略设计。新增文档、交接备注和代码说明使用中文；宿主 API 请求写法继续使用 `.then().catch().finally()`。
- **验证**：定向 Vitest **89/89**；三份文档 E2E 合并 **43/43**，最新 DatePicker/Upload 子集 **31/31**；Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块构建、VitePress 文档构建和差异检查通过。构建仅保留既有大 chunk 与 pnpm 配置提示。
- **测试服务端口**：发现 4176 已被另一项目的 dumi 服务占用，首次 E2E 实际复用了错误站点；lx-ui Playwright 配置、DynamicForm 来源拦截和 Switch 测试已统一到 4177。Wave 4 三页 43/43 重跑通过，Switch 配置兼容用例 6/6；用户的 4174 预览和原有 4176 服务保持运行。
- **代码审核**：独立复审未发现 P0–P2。P3 短视口断言已补并通过；fallback UID 回灌后再调用公开 `abort()` 的组合路径尚无直接测试，作为非阻断测试空缺交给后续 Upload 复验。真实后端、上传服务端 AbortSignal、读屏器和 Firefox/Safari 未覆盖。
- **Impeccable**：A/B 使用独立 Agent。A 30/40（Good）；B 六个静态目标均为有效 `[]`/空 stderr/exit 0，10 个浏览器 context 的 overlay 证据已归因。`[]` 仅代表静态零命中；综合报告 `.impeccable/critique/wave4-dynamicform-2026-10-07/final-report.md`，snapshot `.impeccable/critique/2026-10-07T03-11-47Z__linkx-fe-src-components-lxdynamicform-index-vue.md`。Trend 查询仅有本目标首次 30/40 记录，暂无历史趋势。
- **提交**：组件与测试已提交 `a2ba943 fix(lx-ui): finalize DynamicForm date picker and upload flows`；项目计划、交接和审查证据由配套 `docs(project)` 提交归档。
- **交接给下一波**：先复验当前 TreeSelect/Cascader 的键盘、触控、错误焦点、主题和减少动效；再补 `LxSelectPagination` disabled 继承、迟到响应隔离、续页失败同页重试及禁用不发请求。后续 Upload 复验同时补 fallback UID 回灌后公开 `abort()` 的组合测试。完成对应 A/B、代码复审和文档后才推进 Vue3 Element Plus 替换。

## [2026-10-06] UI-13 / LxUpload 跨实例 UID 复审修复与 Critique 重新冻结

- **目标**：处理独立代码复审发现的回退文件 UID 跨组件实例冲突，并校正 DynamicForm/Upload 当前 Impeccable 证据状态。
- **改动文件**：新增 `linkx-fe/src/components/LxUpload/uid.ts`，修改 `linkx-fe/src/components/LxUpload/index.vue` 与 `other-admin/admin-vue3/tests/unit/lx-upload.test.ts`；同步交付计划、后续拆分、项目地图、组件审计、lx-ui Roadmap/Delivery Check、Vue3 迁移台账和本交接记录。
- **完成内容**：多个 LxUpload 实例共享模块级序列生成唯一回退 UID 前缀；原有来源 UID 和既有 UID 映射保持不变。双实例挂载相同无 UID 文件的行为测试通过。
- **实际验证**：`pnpm exec vitest run tests/unit/lx-date-picker.test.ts tests/unit/lx-dynamic-form.test.ts tests/unit/lx-upload.test.ts` 为 **69/69**；`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-dynamic-form-docs.spec.ts tests/e2e/lx-upload-docs.spec.ts --reporter=list` 为 **13/13**。lx-ui `pnpm run typecheck`、203 模块生产构建、VitePress 文档构建、目标 Prettier 和 Vue3 ESLint 通过；VitePress 保留大 chunk 警告。
- **代码复审**：独立复审曾发现一个 P2 UID 重号风险；本次修复并补回归，第二次独立只读复审批准，未发现可复现 P0–P2。
- **Impeccable 证据**：Assessment A 27/40 的截图采集冻结于 10:19；Assessment B 使用 10:05 的另一份 31 文件冻结，浏览器流程只完成部分场景，最终新标签尝试失败。A/B 源码版本不匹配，禁止合并为正式 Critique。原始报告、detector JSON/stderr/退出码、浏览器记录、失败信息及服务清理证据保存在 `.impeccable/critique/wave4-dynamicform-2026-10-06/`；detector `[]` 仅代表静态零命中。
- **风险与未完成**：新的统一源码/文档冻结、隔离 A/B、移动浮层和触控尺寸复核、正式报告及 snapshot/trend 待完成。`LxForm` 设计图逐项对照、真实上传协议和服务端取消联调仍开放。
- **下一步**：完成最终验证和新冻结 A/B 后，按组件/E2E 与计划/审查文档两笔白名单 Conventional Commit 分别提交并推送；随后执行 Wave 4 TreeSelect/Cascader 与 LxSelectPagination，先处理表单 disabled 继承及请求状态机 Vitest 缺口。

## [2026-10-06] UI-13 / 日期区间默认清空值契约补齐

- **目标**：修复 `LxDatePicker` 实际清空值与公开事件类型、DynamicForm 日期 renderer 类型不一致的问题，并留存受控回写证据。
- **改动范围**：`linkx-fe/src/components/LxDatePicker/types.ts`、`LxDynamicForm/fields/LxDynamicFieldDateRange.vue`、DynamicForm Demo、DatePicker/DynamicForm 中文文档与 Vue3 单测/E2E；同步更新交付计划、项目地图、迁移台账、组件审计和 lx-ui 路线图/交付核查。
- **完成内容**：根据 Element Plus 2.14.6 当前实现，默认日期区间清空事件发出 `null`；公开值类型和动态字段转发类型已包含 `null`。Demo 显示日期区间受控值，浏览器用例验证选择、清空后两个输入变空且字段回写为 `null`。
- **实际验证**：DatePicker/DynamicForm 定向单测 **47/47**，DynamicForm/Upload 文档 Playwright **13/13**，其中浏览器用例真实选择并清空区间，断言两个输入框清空且模型显示 `null`。Vue3 `vue-tsc --noEmit`、lx-ui `vue-tsc --noEmit`、目标 ESLint、目标 Prettier、lx-ui 生产构建（202 modules）和 VitePress 文档构建通过；保留 VitePress 既有大 chunk 警告。`git diff --check`、代码复审及 Impeccable 仍待完成。
- **未完成/风险**：旧 23 文件冻结不包含 Vue3 集成测试且早于本修复，不能作为正式 A/B 证据；真实宿主页面没有 DynamicForm 使用方，本轮不代表业务迁移或真实后端联调。
- **下一步与提交范围**：完成新冻结后的隔离 Assessment A/B、合并报告和代码复审，再仅暂存本波组件/E2E 文件提交 `fix(lx-ui)`，另将计划、交接、审计和 Critique 证据提交 `docs(project)` 并推送；排除 `.pnpm-store/`、Wave 3 文件和其他无关改动。随后继续 TreeSelect/Cascader 当前版复验与远程分页选择闭环。

## [2026-10-06] UI-13 / DynamicForm 与 Upload 组件验收

- **目标**：完成 DynamicForm 分字段渲染、受控值与上传适配回归，并为后续组件严格对照和宿主替换保留可追溯证据。
- **改动范围**：`linkx-fe/src/components/LxDynamicForm/`、`LxUpload/`、对应中文 API/Demo、Vue3 定向单测与文档 E2E；另更新项目地图、详细计划、迁移台账、组件审计和 lx-ui Roadmap/Delivery Check。没有替换 Vue3 业务组件，没有更改 API、路由、权限键或后端协议。
- **完成内容**：按 schema `type` 加载独立字段 renderer；字段组合公开 `Lx*` 控件；受控 `value`/`change(nextValue)` 保持旧 `v-model`；覆盖密码、远程选择、日期范围及单/多文件上传。上传重试等待受控队列更新，迟到回调不覆盖取消结果；模型回灌保留文件 UID、URL、response 和 Error。
- **实际验证**：DynamicForm/Upload 定向单测 46/46；文档 Playwright 13/13。lx-ui/Vue3 类型检查、目标 ESLint/Prettier、202 模块生产构建、VitePress 文档构建和差异检查通过。首次 E2E 与文档构建并行时出现 Windows `EBUSY`，该次失败作废；构建退出后独立重跑 13/13。文档构建仍有既有大 chunk 警告。
- **代码与样式审查**：独立代码复审最终批准。正式 Impeccable A/B、建议处理、snapshot/trend 正在本轮单独完成；在最终结果入档前保持正式 Critique 未收口。
- **未完成/阻塞**：不代表真实上传后端联调；`LxForm` 设计稿逐项核对、UI-10 52 项严格矩阵及 UI-11 整库 Critique 仍开放。Vue3 页面替换和宿主 Element Plus 移除继续等待全库门禁。
- **风险与下一步**：外部上传 adapter、真实身份/权限和服务端取消需按宿主协议联调。完成 A/B 修后复验与两笔提交推送后，按详细计划进入 TreeSelect/Cascader 当前版 Critique 和远程分页选择闭环。提交仅纳入本波白名单，不含 `.pnpm-store/` 镜像或其他波次产物。

## [2026-10-06] UI-13 / DynamicForm 与 Upload 组件验收

- **目标**：完成 DynamicForm 分字段渲染、受控值与上传适配回归，并为后续组件严格对照和宿主替换保留可追溯证据。
- **改动范围**：`linkx-fe/src/components/LxDynamicForm/`、`LxUpload/`、对应中文 API/Demo、Vue3 定向单测与文档 E2E；另更新项目地图、详细计划、迁移台账、组件审计和 lx-ui Roadmap/Delivery Check。没有替换 Vue3 业务组件，没有更改 API、路由、权限键或后端协议。
- **完成内容**：按 schema `type` 加载独立字段 renderer；字段组合公开 `Lx*` 控件；受控 `value`/`change(nextValue)` 保持旧 `v-model`；覆盖密码、远程选择、日期范围及单/多文件上传。上传重试等待受控队列更新，迟到回调不覆盖取消结果；模型回灌保留文件 UID、URL、response 和 Error。
- **实际验证**：DynamicForm/Upload 定向单测 46/46；文档 Playwright 13/13。lx-ui/Vue3 类型检查、目标 ESLint/Prettier、202 模块生产构建、VitePress 文档构建和差异检查通过。首次 E2E 与文档构建并行时出现 Windows `EBUSY`，该次失败作废；构建退出后独立重跑 13/13。文档构建仍有既有大 chunk 警告。
- **代码与样式审查**：独立代码复审最终批准。正式 Impeccable A/B、建议处理、snapshot/trend 正在本轮单独完成；在最终结果入档前保持正式 Critique 未收口。
- **未完成/阻塞**：不代表真实上传后端联调；`LxForm` 设计稿逐项核对、UI-10 52 项严格矩阵及 UI-11 整库 Critique 仍开放。Vue3 页面替换和宿主 Element Plus 移除继续等待全库门禁。
- **风险与下一步**：外部上传 adapter、真实身份/权限和服务端取消需按宿主协议联调。完成 A/B 修后复验与两笔提交推送后，按详细计划进入 TreeSelect/Cascader 当前版 Critique 和远程分页选择闭环。提交仅纳入本波白名单，不含 `.pnpm-store/` 镜像或其他波次产物。

## [2026-10-06] Wave 3 / LxIcon 修后复验与 Wave 4 交接

- **目标**：完成 LxIcon 修后独立 A/B、正式 detector/浏览器证据、代码复审及下一波 DynamicForm 任务拆解。
- **实现范围**：`LxIcon` 未知运行时名称回退与可访问标签、侧栏图标解析及缺省回退、设置入口有效图标键、Upload 状态图标名称类型、中文目录搜索/键盘/主题/空态与业务节点样例；Vue3 侧为该组件的单测和文档 E2E，没有迁移业务页面或修改接口。
- **验证**：单测 7/7、图标 E2E 4/4；Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 和 `git diff --check` 通过。文档构建保留既有大 chunk 警告。
- **代码复审**：独立 Luna max 批准，无可复现 P0–P2。非阻断 P3：E2E 建议比较 96 个 `data-icon-name` 的去重集合；静态 AST 核对已确认当前完整无重无漏。真实读屏器与真实权限菜单畸形图标数据仍待宿主 Mock/辅助技术覆盖。
- **Impeccable**：独立 A 修后 37/40（修前 33/40）；sticky 遮挡、默认展开过多、缺少权限组合样例三项已解决。B 两个静态目标均为有效 JSON `[]`、空 stderr、退出码 0；五个新 context 的 overlay 均成功。CJK 行长规则、Shiki、code-copy、导航和文档壳层命中逐条归因，不是图标控件缺陷。浅色桌面有一条无 URL、无 HTTP 404 对应事件的 console 404，未归因。综合报告、快照、trend 和原始证据见 `.impeccable/critique/wave3-lxicon-2026-10-06/`。
- **流程记录**：第一份修后 B 因执行上下文意外看到 A 报告片段而不纳入正式结果；其过程材料与说明位于 `agent-assessment-b-postfix/`。正式 B 由全新隔离 agent 独立重跑，未读取 A 或旧 B 材料。
- **实现提交**：后续记录提交号。项目计划、地图、审计、代码复审、Impeccable 报告和交接使用单独 `docs(project)` 提交；两笔只推送本波白名单文件。
- **下一波**：进入 `LxDynamicForm`。只读复核报告 `.impeccable/critique/wave4-dynamicform-agent-audit/followup-review.md` 指出无可确认 P0。P1：每个 schema type 的独立 renderer 文件、真实宿主 password 校验错误与 ARIA、remote-select 乱序/取消与重试。P2：上传失败/重试/取消/移除值映射、`daterange` 往返、320/375/768px 和 320/520/760/768px 容器断点、受控 `value` 回灌。业务网络和上传契约只在确认宿主 API 后接入；lx-ui 不引入请求层。

## [2026-10-05] Wave 2 / LxSwitch 交付与复验

- **目标**：对照表单控件标本 07 完成 LxSwitch 组件、Demo、中文 API 和行为/视觉复核。
- **实现提交**：`1679d9c fix(lx-ui): align switch behavior and responsive demo`，已本地提交；本交接的文档与 Critique 快照另用 `docs(project)` 提交并推送。
- **验证**：单测 14/14、文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。文档构建有既有大包警告。此前默认 Playwright 配置误启 Vue3 应用并遇只读接口超时，不计验收；切到 `playwright.lxui.config.ts` 后 6/6 通过，未发出业务写请求。
- **代码复核**：独立复核批准，未发现可复现 P0–P2。剩余非阻塞覆盖缺口为真实触摸点击、ARIA 说明动态移除、定时器运行时卸载 Demo。
- **Impeccable**：独立 Assessment A/B 综合 32/40；为以 29/40 为基线的有界复评，不是全量重评分。三份源码 detector 均为有效 `[]`、stderr 空、退出码 0，只代表静态零命中。B 的 375px 根宽增量已归因于 detector overlay 标记，原始页面宽度正常；没有声称 `[Human]` 用户标签显示了 overlay。完整报告与证据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/`；正式快照为 `.impeccable/critique/2026-10-05T13-00-21Z__linkx-fe-src-components-lxswitch-index-vue.md`，本目标首次正式记录，趋势为 32/40。
- **剩余项**：移动文档侧栏关闭状态的 Tab 顺序属于共享壳层，进入壳层复验；生产高影响开关的确认、授权审计及失败补偿由 Vue3 宿主依据真实接口契约验收；专业缩写可在组件中文文档首次出现时释义。这些不由 lx-ui 通用组件臆造。
- **下一步**：按基础控件顺序验收 `LxPasswordInput`，随后复核动态图标，再进入 `LxDynamicForm`；完成基础组件和动态图标门槛前不开始 Vue3 Element Plus 替换。每波先提交实现/E2E 的 `fix(lx-ui)`，再用独立 `docs(project)` 提交计划、交接、审计、代码复核记录与 Critique 快照，核对白名单后推送。

## [2026-10-05] Wave 2 / LxCheckbox 与 LxRadio 实现及复核

- **目标**：按 `design/表单控件八件套/code.html` 03/04 标本完成 Checkbox/Radio 控件与组的状态、主题、键盘、触屏和减少动效复核。
- **改动范围**：四个组件的 Demo、类型与样式；Element Plus/HUD 主题令牌；中文 API；Vue3 单测与文档 E2E。源码与回归已按第一笔提交独立提交为 `be86f10 fix(lx-ui): 完善复选与单选控件状态`。
- **关键行为**：浅色禁用文字采用 `#909399`，HUD 次级文字采用 `#94a3b8`；Radio 状态区与 `aria-live` 播报中文选项名；组内默认焦点项可操作，已选禁用历史值放在组外只读展示；触屏目标为 44px。
- **验证**：Checkbox/Radio 定向单测 20/20、文档 Playwright 4/4；Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、生产构建（196 modules）、文档构建及目标 `git diff --cached --check` 通过。浏览器 E2E 拦截外部网络；Mock/文档 Demo 不代表真实业务后端。
- **代码复审**：独立复审批准；未发现当前差异中的可复现 P0–P2 代码问题。原 Tab 停靠问题已由可用的组选中项、组外历史值和真实 Tab/方向键测试关闭；复审者未自行重跑测试。
- **Impeccable**：独立 A 评分 34/40；独立 B 完成四组件源码 detector 三件套、Radio Demo 最终复扫和 16 个 Radio/RadioGroup overlay 浏览器视图，触屏 44px 由 E2E 覆盖。静态 `[]` 仅代表源码规则零命中。A 的 375px API 多列表格扫描效率 P2 仍开放，故 Checkbox/Radio 严格设计矩阵行不标记关闭。A/B、截图与中文综合报告位于 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`；snapshot 为 `.impeccable/critique/2026-10-05T05-40-12Z__linkx-fe-src-components-lxradio-demo-basic-vue.md`，该目标首次记录，趋势为 34/40。
- **提交约定**：仅本波实现/E2E 文件纳入 `fix(lx-ui)`；计划、项目地图、组件审计、代码审核台账与 Impeccable 证据另用 `docs(project)` Conventional Commit。只暂存白名单文件，不包含 `.pnpm-store/` 镜像、`test-results`、live-server 运行状态或其他波次产物。推送后自动进入 `LxSwitch`。
- **未完成/风险**：375px API 表格的阅读方式需另行设计和浏览器复验；UI-10 52 项总矩阵、Vue3 宿主 Element Plus 替换和真实后端联调均未由本波关闭。

## [2026-10-05] Wave 2 / LxSelect 交互修复与提交准备

- **目标**：完成 Select options/插槽、远程错误恢复、主题边界、设计样本中的单项禁用状态和窄屏点按目标验收，并保留代码/设计审查证据。
- **改动文件**：`linkx-fe/src/styles/element-theme.css`、`linkx-fe/src/components/LxSelect/style.css`、`demo/basic.vue`、`linkx-fe/docs/components/lxselect.md`、`other-admin/admin-vue3/tests/e2e/lx-select-docs.spec.ts`；项目计划、地图、迁移台账、组件矩阵、代码复审与 Impeccable 记录同步更新。
- **实现**：HUD 的 `--lx-color-primary` 覆写仅作用于 LxSelect popper；teleported 选项描述用自身类选择器；远程失败说明保留 alert/`aria-describedby`，弹层打开时 footer 提供重试，关闭时错误和重试回到控件旁，成功后清理描述关联；Demo 展示设计样本中的离线禁用项；`hover: none` 或视口不大于 640px 时选项行高为 44px。中文 API 同步焦点光环和错误恢复契约，hover 采用综合演练卡主色描边。
- **验证**：LxSelect 单测 10/10、修复 locator 后文档 Playwright 3/3；Vue3 `vue-tsc --noEmit`、目标 Prettier、无自动修复 ESLint；lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 和目标 `git diff --check` 通过。VitePress 保留既有大 chunk 提示。E2E 拦截非本地流量，Mock 不代表真实后端联调。
- **代码复审**：Luna max 独立复审最终批准。实际下拉节点同时带 `.el-select-dropdown` 与 `.lx-select__popper`；更宽泛的锚定类会把多选 tooltip 一并命中，已限定下拉内容节点并由主任务重跑 3/3。复审者未重跑测试。
- **Impeccable**：Assessment A-only 暂定 29/40，当前评估环境无可用浏览器且 4174 拒绝连接；Assessment B detector 为有效 JSON `[]`、stderr 空、退出码 0，仅表示静态零命中。早前只读浏览器交互记录于 `.impeccable/critique/wave2-lx-select-2026-10-05/assessment-b-final/`，但本波没有成功注入 overlay，也没有当前版本持久截图、综合 snapshot/trend；只登记阶段性复验，不能标记正式 Critique 通过。
- **本波提交**：实现与 E2E 已单独提交为 `4e0b544 fix(lx-ui): complete select interaction states`；本交接、计划、审核记录和 Impeccable 原始证据另作文档提交。推送状态由本波完成回报记录。
- **未完成/风险**：Vue3 业务页尚未替换；真实接口、权限与后端联调不在本波。正式 Impeccable overlay/snapshot/trend 仍未闭环，UI-10 严格矩阵行保持开放。
- **提交约定**：按既定规则仅暂存本波文件，先 Conventional Commit 提交组件实现/E2E，再独立提交 API、计划、审计、交接与审查证据；排除 `.pnpm-store/` 镜像、`.impeccable/live/server.json` 删除、`0`、`test-results` 和其他波次材料。完成推送后自动进入 Checkbox/Radio。

## [2026-10-05] Wave 2 / LxDatePicker 短视口修复与正式复核

- **问题与修复**：原弹层在 390×375 下超出视口，内部滚动不能让视口外的末行可见。现按实际边界检测：原生定位完整时保留输入框锚点；越界时使用视口内居中浮层，滚动限制在 `.el-picker-panel` 内，避免箭头裁切和页面滚动串联。320px 区间面板宽度同步受视口约束。
- **实现与回归文件**：`linkx-fe/src/components/LxDatePicker/index.vue`、`style.css`、`demo/basic.vue`、`other-admin/admin-vue3/tests/e2e/lx-date-picker-docs.spec.ts`。
- **最终行为验证**：DatePicker 文档 E2E **16/16**；DatePicker/DynamicForm 定向单测 **39/39**。320/375/390px 宽度、短屏普通/快捷弹层、末行滚动可达、页面纵向滚动隔离、键盘/Escape、HUD、错误态和减少动效均有覆盖。
- **质量验证**：lx-ui `vue-tsc --noEmit`、`pnpm build`（196 modules）、`pnpm build:docs`，Vue3 目标 ESLint、Prettier 与目标 `git diff --check` 通过。文档构建有既有大 chunk 提示；pnpm 忽略旧 `onlyBuiltDependencies` 字段。
- **Impeccable 正式复核**：Assessment A **31/40**；Assessment B 静态 detector 为 JSON `[]`、stderr 空、退出码 0，另有 9 场景浏览器证据、4 个覆盖层视图；独立代码复审批准。A/B、测量、截图及服务生命周期文件位于 `.impeccable/critique/wave2-date-range-2026-10-05/final-review/`；综合快照为 `.impeccable/critique/2026-10-04T21-53-59Z__linkx-fe-src-components-lxdatepicker-index-vue.md`，这是该目标的首次记录，暂无历史趋势。
- **未关闭建议**：窄屏遮挡活动字段、快捷日历需内部滚动且缺少提示、桌面标签重叠约 16px（3 项 P2），桌面弹层距底边约 1px（1 项 P3）。320px 文档页横向滚动暂不能归因于 DatePicker。短视口修复子项已验收，但 DatePicker 的 UI-10 严格矩阵行仍开放，后续需跟踪上述建议。
- **服务状态**：Assessment B 启动的 4176 和 8403 临时服务均已退出；原有 5180 服务仍运行且未触碰。
- **提交约定**：本波先单独提交实现/E2E，再单独提交计划、交接、评审台账和 Impeccable 证据，使用 Conventional Commit；逐项暂存，排除 `.pnpm-store/` 镜像和 live-server 状态。推送 `main` 后自动进入 `LxSelect`。
- **代码提交**：实现与回归已提交为 `c63b39a fix(lx-ui): keep DatePicker popper within short viewports`；本交接、审计台账和 A/B 证据使用独立文档提交。推送状态以本次 Git 记录为准。

## [2026-10-05] Wave 2 / LxDatePicker Demo 与窄屏复核

- **目标**：收敛日期区间 Demo 信息层级，修正 HUD 分隔符对比和移动端弹层宽度，并确认弹层末行是否能通过页面滚动到达。
- **改动文件**：`linkx-fe/src/components/LxDatePicker/demo/basic.vue`、`style.css`、`other-admin/admin-vue3/tests/e2e/lx-date-picker-docs.spec.ts`；计划、项目地图、迁移 Backlog、组件路线图/交付核查、组件审计、代码复审台账与本交接记录；Impeccable 证据归档于 `.impeccable/critique/wave2-date-range-2026-10-04/`。
- **完成内容**：区间示例前移；精简可见标题，将尺寸/扩展参数置于默认收起的键盘可访问说明；HUD 区间分隔符采用高对比正文令牌；小屏日期弹层宽度改为视口宽减 16px。对比度 helper 明确拒绝半透明颜色。
- **浏览器和代码审核**：独立代码审查批准，无 Critical/Nitpick；对 alpha helper 的改进建议已落实并复核。375×812 快捷区间弹层最初 y=440–866，末行超出视口 54px；向下滚动 54px 后弹层 y=386–812、末行 y=766–811。点击 10 月 5/6 日成功，焦点稳定。完整 A/B 与快照路径、分数和 overlay 归属以后续本波综合报告为准。
- **验证**：`tests/e2e/lx-date-picker-docs.spec.ts` **12/12**；改动 helper 后 HUD 用例 **1/1**；lx-ui `pnpm exec vue-tsc --noEmit`、`pnpm build`（196 modules）、`pnpm build:docs`，Vue3 目标 ESLint、目标 Prettier、目标 `git diff --check` 通过。首轮测试在 4176 尚未监听时失败；手动启动 VitePress 后单 worker 重跑通过。文档构建有既有大 chunk 与 pnpm 配置警告。
- **未完成/风险**：滚动前末行部分越界，需要页面滚动后完整查看；未改变 Element Plus 的弹层自动定位策略。真实业务宿主页和后端不在本波。Wave 2 的 `LxSelect`、Checkbox/Radio、Switch 及全库严格审查仍待完成。
- **本波提交范围与提交号**：实现与 E2E 单独使用 Conventional Commit；计划、审核记录和 Impeccable 证据单独使用文档 Conventional Commit；仅暂存本波文件，不包括 `.pnpm-store/` 镜像目录。提交号和推送结果以 Git 最终记录为准。
- **下一步**：自动进入 `LxSelect` 严格对照与行为复核，继续遵守 API `.then().catch().finally()`、中文文档/注释、Detector JSON/stderr/退出码及浏览器证据规则；每个子项完成后复审、分别提交并推送。

## [2026-10-04] 后续任务完整拆分与当前入口

- 已新增 [`PROJECT-FOLLOWUP-BREAKDOWN.md`](./PROJECT-FOLLOWUP-BREAKDOWN.md)，按 Wave 0–12 拆分组件库严格对照、DynamicForm/Form、TreeSelect/Cascader、动态图标、登录页、Vue3 Element Plus 替换、权限、Mock 全菜单和整站发布门禁。
- 统一规则：新增/实质修改的文档、交接备注、审核记录和代码注释使用中文；Vue3 宿主业务 API 保持 `.then().catch().finally()`；不以 detector `[]` 代替视觉审查；缺少后端契约的权限和真实联调保持阻塞；每波完成后同步计划、项目地图、迁移台账和本交接记录。
- Wave 0 已完成 `LxDatePicker` 相邻实例 `aria-describedby` 隔离修复和代码复核；36 项 DatePicker/DynamicForm 单测、lx-ui 类型/构建/文档构建、DatePicker 文档 E2E 1/1 及目标静态检查通过。
- 当前入口转为 Wave 1 基础控件第一组。DynamicForm/Form 的正式 Impeccable A/B、当前版本 overlay 和 snapshot/trend 仍待补齐；此前失败记录保留为缺陷发现背景，不再代表当前修复后的测试状态。

## [2026-10-03] UI-10 Wave 6 TreeSelect/Cascader 正式收口

- 目标：完成 TreeSelect/Cascader 修后独立 A/B、浏览器 overlay、截图、综合报告和 critique storage 收口。
- 实现与验证：TreeSelect/Cascader 单测 17/17，文档 Playwright 6/6；lx-ui typecheck/build/docs build、Vue3 `vue-tsc --noEmit`、原组件修复目标 Prettier 通过。TreeSelect 多选 footer 现在跟随 locale 并支持逐项文案覆盖；Cascader 在并发 `loading && error` 时 loading 优先；Demo 标签、宽度、间距和移动重试热区已修复。
- 可见性补充：独立 `/components/lxcascader` 文档页原本已有完整交互 Demo 和侧栏入口；现也将同一 Demo 加入 `/components/new-components` 总览，新增浏览器断言确认“组织路径”控件可见。VitePress 构建通过；两个文档目标文件的 Prettier 检查存在 HEAD 基线格式差异，本次未对整文件做无关重排。
- Impeccable：修复前 Assessment A 29/40、修复后 Assessment A 30/40（均 Good）；follow-up 确认本波问题已处理。Assessment B 四个 detector 均 JSON `[]`、stderr 空、exit 0，六个浏览器视图均有 overlay 与截图。综合报告见 `.impeccable/critique/wave6-postfix-2026-10-02/report.md`，正式 snapshot 为 `.impeccable/critique/2026-10-03T05-59-43Z__linkx-fe-src-components-lxtreeselect-index-vue.md`，trend 已登记。
- 边界：`[]` 仅表示静态规则零命中；B 的文档壳层命中和 375px 文档页横向溢出已单列，溢出来源尚未归因，不能按命中数量判定组件失败。P3 观察项保留至基础控件/文档壳层复核；真实后端未联调。
- 下一步：启动基础控件严格 UI 批次，按 `design/` 逐项补齐状态、Demo/API、行为测试、桌面/375px/HUD/减少动效浏览器证据、代码审核和 Impeccable A/B；完成前冻结 Vue3 Element Plus 批量替换。

## [2026-10-03] LxInputNumber 步进器参数复验

- 复核 `LxInputNumber` 的公开参数契约：`controls` 默认 `true`；传入 `:controls="false"` 时隐藏增减按钮并保留数字输入、键盘输入和表单校验能力；恢复为 `true` 后按钮重新渲染。
- 复核范围包含组件类型、Demo 的“显示步进器”开关、中文 API 文档及 sm/md/lg 示例。未发现实现或文档缺口，因此本次不重复修改组件源码。
- 本次验证：`tests/unit/lx-input-number.test.ts` **12/12**；使用 `playwright.lxui.config.ts`（4176 lx-ui 文档站）运行 `tests/e2e/lx-base-controls-docs.spec.ts --grep InputNumber` **1/1**。同一用例在宿主 `30846` 配置下因 Vite 代理 `172.16.23.8:30844` 超时，未将该环境失败计入组件功能失败。
- 该项仍归属基础控件批次；上述功能证据不替代整批正式 Impeccable Assessment A/B、浏览器 overlay 和 snapshot/trend 收口。

## [2026-10-02] 全菜单预览复验、轮播文章分页与步进器参数

- 用户补充确认步进器应可按参数显示/隐藏。现有 `LxInputNumber` 已提供 `controls`（默认 `true`），`:controls="false"` 时保留数字输入并隐藏增减按钮；API、Demo 全局开关、12 项单测和文档浏览器用例 1/1 均覆盖，当前无需重复改组件实现。
- 全菜单用例复跑通过，覆盖 10 组、32 个子菜单和 33 项目录；此前交接中的菜单选择器失败当前不可复现。
- 轮播分页实际故障为触底重复触发可产生重复文章选项。修复 `CarouselForm.vue`：分页请求期间防重、失败恢复页码、按文章 ID 去重；加入请求代次与账号归属检查，账号切换/清空后忽略迟到响应。E2E 由 `aria-controls` 定位关联 listbox 的滚动容器，验证请求页码 `[1, 2]` 且第 21 篇仅出现一次。
- 验证：完整 `preview.spec.ts` **6/6**；轮播分页定向 E2E **1/1**；`lx-input-number.test.ts` **12/12**；InputNumber 文档 E2E **1/1**；Vue3 `vue-tsc --noEmit`、目标 ESLint、Prettier 通过。真实后端联调未执行，其他 `v-loadmore` 宿主未由本轮逐页覆盖。
- 文档同步：交付计划、项目地图、迁移台账及代码评审核验台账。Detector JSON/stderr/退出码与解释见 `.impeccable/critique/carousel-pagination-2026-10-02/`；本项 E2E/功能交付不等于正式 Impeccable A/B Critique，后续按 UI-10 批次统一完成正式评审与快照。

## [2026-10-02] LxInputNumber 步进器连续布局与参数控制

- 用户复核指出 `LxInputNumber` 尺寸 Demo 的 sm/md 步进按钮之间有明显空白；原因是 Element Plus 对 small/default 固定使用 11/15px 高度，而当前触发器实际高度为 34/36px。
- 修复：`LxInputNumber` 右侧增减按钮按触发器实际高度各占一半，保留中间 1px 分隔线；sm、md、lg 均首尾贴合，不改变 `controlsPosition="right"` 契约。同步实际输入框 `id/name/autocomplete/aria-*` 属性，确保可见标签关联原生数字输入。
- Demo 增加“显示步进器”开关，将 `controls` 参数接入 sm/md/lg 尺寸示例；关闭时三档均隐藏按钮，重新开启恢复。中文 API 文档补充连续贴合与属性关联说明。
- 验证：浏览器 4174 新标签确认开关关闭/恢复和三档按钮几何；`lx-input-number.test.ts` 12/12；`lx-base-controls-docs.spec.ts --grep InputNumber` 1/1；先由基础控件综合 E2E 发现 DatePicker 禁用/只读区间在 320px 仍被 EP 默认 350px 宽度撑开，已用 `:deep()` 局部宽度约束修复；综合 `lx-base-controls-docs.spec.ts` 最终 4/4。lx-ui `pnpm typecheck`、`pnpm build`（195 modules）和 `pnpm build:docs` 通过；目标 Prettier、ESLint、`git diff --check` 通过。文档构建保留仓库已有的大 chunk 警告。
- Impeccable：`detect.mjs --json linkx-fe/docs/components/lxinputnumber.md` 的 JSON 为 `[]`、stderr 为空、退出码 0，已分别保存 stdout/stderr/exit-code；这只表示静态规则零命中。因当前隔离 Assessment A/B 子 Agent 额度失败，本次只记为降级 detector + 浏览器复验，不登记正式双路 Critique 或快照通过；证据见 `.impeccable/critique/lxinputnumber-detector-2026-10-02.*`。

## [2026-10-01] 继续实施与子 Agent 配置

- 用户最新配置：子 Agent 使用 `gpt-6.1-sol`、`medium` 思考，替代此前 Luna max；无需逐批用户审查，按既定依赖顺序连续推进。
- 当前接手 Wave 6 未闭环项：TreeSelect/Cascader 的错误描述、locale、选择关闭契约与定向回归。非叶展开与叶选择必须按 Element Plus 原契约验证，不以改动业务语义消除测试失败。
- 独立基础控件设计清点同步启动，结果用于下一批实施。前轮 Wave 6 Assessment B 缺少完整浏览器证据，不能登记正式通过；修复后重新隔离 A/B 并保留 detector JSON、stderr、退出码、状态截图和快照。
- 完成情况与剩余任务将在各批结束时补充；52 项严格矩阵当前未因接手续跑而改变。

## [2026-09-30] 基础组件审查范围扩展

用户补充要求：基础控件不能只作为表单内部依赖，需要单独完成 `LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、Checkbox/Radio 组、`LxSwitch`、`LxPasswordInput` 的设计严格对照。后续交接必须记录状态、焦点、错误/禁用、主题、窄屏、键盘、减少动效、代码审核和 Impeccable A/B；完成该批次及其复验前不启动 Vue3 Element Plus 依赖删除。

## [2026-09-30] UI-10 Wave 5 postfix 独立复验

- 复验对象：`LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 及对应文档页。
- Assessment A 独立评分 **34/40（Good）**；确认 HUD portal 令牌、Drawer 默认 Escape、Dialog 首错聚焦、PageCard 错误恢复和 375px API 表格局部滚动。
- Assessment B 保存四个目标的 detector JSON、stderr、退出码、16 张桌面/375px/亮色/HUD/交互截图及 sidecar；外部请求为 0。因 CUA 不可用，使用隔离 Playwright fallback，报告标记 `DEGRADED`。
- 代码/行为结果：Drawer 单测 4/4；Dialog、Drawer、PageCard 文档 E2E 5/5；`vue-tsc --noEmit`、lx-ui 构建、VitePress 构建和 Prettier/定向 ESLint 通过。静态 `[]` 只代表 detector 零命中。
- 剩余建议：PageCard Demo 五个平级状态开关、窄屏 API 表滚动发现性、Drawer/PageCard 辅助文字字号；纳入后续全库设计复核。
- 当前交接边界：Wave 5 postfix 证据已完成并可复查；UI-11 全库正式关闭、宿主替换和真实后端联调仍未完成。下一波优先处理 `COMPONENT-AUDIT.md` 中已有实现但缺正式 A/B 的组件。
- 代码审核补充：PageCard E2E 曾在 hydration 前查询 API 表导致 0 表误报，已增加 `Props` 标题可见等待；定向 E2E 复跑 6/6，目标范围 diff check 通过。全库 EOF 空行属于既有无关改动，保留不动。

## [2026-09-30] UI-10 Wave 5 / LxDialog、LxDrawer、LxEmpty、LxPageCard、LxFormErrorBanner

- 目标：收尾五个高频浮层、容器和反馈组件的实现、文档、状态回归及浏览器取证，保留统一的亮色/HUD、窄屏、焦点、加载/错误/空态与减少动效契约。
- 改动入口：`linkx-fe/src/components/LxDialog/`、`LxDrawer/`、`LxEmpty/`、`LxPageCard/`、`LxFormErrorBanner/` 及对应 Demo、中文 API 文档；单测位于 `other-admin/admin-vue3/tests/unit/`，文档 E2E 位于 `other-admin/admin-vue3/tests/e2e/`。
- 交付结果：五个组件的公开 props/events/slots/exposes 和可访问名称保持受控契约；Dialog/Drawer 在 375px 视口内稳定，PageCard 暴露具名 region 与 `aria-busy`，FormErrorBanner 使用 `role=alert`、`aria-live=assertive`、`aria-atomic=true`，Empty 提供空态恢复操作；自定义过渡在 `prefers-reduced-motion` 下关闭或降级。
- 验证：定向单测 **17/17**；文档 Playwright **7/7**；lx-ui typecheck、build、docs build 通过。Wave 5 detector JSON 为 `[]`、stderr 为空、退出码 0；浏览器结果 `status=passed` 且无外部请求。Drawer 移动截图已等待动画结束后重拍，`.impeccable/critique/wave5-2026-09-30/browser-result.json` 中 `drawerBox` 为 `x=0,y=0,width=375,height=812`，`scrollWidth=375`。
- 审查边界：以上静态 detector 和浏览器证据不等于正式 UI-11 Critique。独立 Assessment A/B、综合报告、snapshot/trend 完成前，五个组件仍记为“Wave 5 证据完成，正式 Impeccable 待收口”。
- 已登记缺口：`linkx-fe/src/components/LxForm/demo/control-bridge.vue` 仍直接演示 `ElTabs`/`ElTabPane`，这是 Element Plus 桥接缺口；该示例暂不冒充公开 LxTabs 组件，待后续 UI-10 对照时补齐或明确保留理由。
- 下一步：收齐 Wave 5 A/B 隔离报告并保存综合快照；完成正式复验后，再更新 UI-10 矩阵状态并进入 Vue3 宿主替换门槛核对。

## [2026-09-30] UI-13 表单严格对照复修（当前交接）

- 根据独立 Assessment A（29/40）修正自适应布局：`LxDynamicForm` 自适应字段不再将三列 span 写入行内 `grid-column`，避免约 600px 文档容器中两列断点被覆盖；固定列和 `span="full"` 仍保持原契约。
- 新增 `linkx-fe/src/components/LxTreeSelect/`，DynamicForm 树字段已切换到公开 `LxTreeSelect`。Element Plus 只作为封装内部内核，组件导出类型、文档、导航和减少动效样式已同步。
- 两个 LxForm Demo 已切换为 `LxInput`/`LxSelect`/`LxTextarea`；业务存量兼容的 `ElFormItem` 能力仍保留在 LxForm 说明中，但新示例不再把 `El*` 当作设计组件使用。
- 复验：`linkx-fe pnpm typecheck`、`pnpm build`、`pnpm build:docs`、修改文件 Prettier 通过。DynamicForm 本地 Vitest 首轮 7 项中 6 项通过，重置初始值断言已修正实现，需使用 `other-admin/admin-vue3/node_modules/.bin/vitest.CMD` 重跑；根级 Vitest 缺 jsdom 不代表代码失败。
- 审查状态：A 报告已落盘；B 目录已落盘 detector `[]`/stderr/exit-code，浏览器证据尚待独立 Agent 结束后读取。当前不能标记正式 Impeccable 通过。
- 下一步：完成 B/A 综合快照和代码审核；然后按 `design/` 逐项盘点其余组件，每项同步实现、Demo、Mock、浏览器证据和交接，再进入 Vue3 Element Plus 替换。

## [2026-09-30] UI-13 表单第一波已实现，待独立审核与正式 Critique

- `LxDynamicForm` 已拆分 `src/components/LxDynamicForm/fields/` 字段子组件，动态字段改用 `LxInput`、`LxSelect`、`LxDatePicker`、`LxSwitch`、`LxRadio`、`LxCheckbox`、`LxUpload`、`LxTreeSelect` 等公开封装；树下拉已完成库内封装，待独立浏览器状态证据。
- 受控契约：`value` 优先、`change(nextValue)` 回传完整对象；原 `v-model`、`modelValue`、字段 slot、校验/重置实例方法保留。上传默认支持单/多文件列表；有同名 slot 时兼容旧宿主自定义上传。
- 布局契约：自适应模式使用容器查询在 3/2/1 列之间切换，`adaptive=false` 保留固定 `columns`。已验证桌面三列、375px 单列、通栏字段、禁用状态、HUD 和无外部请求。
- 验证记录：库类型检查、库构建、文档构建、40 项 Vue3 定向单测和本地 Mock 浏览器检查通过。浏览器检查脚本为 `other-admin/admin-vue3/tests/tmp-lxdynamicform-doc-check.mjs`。
- 交接下一步：独立代码审核 → LxForm/LxDynamicForm Impeccable A/B（读取 JSON、stderr、退出码和浏览器 overlay；`[]` 不单独通过）→ 修复建议并复验 → 继续 UI-10 全库严格设计对照。

## [2026-09-30] 续接任务盘点与 DynamicForm 重新排期

- 最新主顺序：先严格按设计稿复核并修改 `LxForm` 与 `LxDynamicForm`，动态表单只组合公开 `Lx*` 基础组件；再逐项严格核对全部 lx-ui 组件，完成库级验收及 Impeccable 复验后才开始 Vue3 Element Plus 全量替换。AuthImg A/B 是只读取证，可先补齐；其 P1/P2 修复和 Vue3 DESIGN §8.6 Mock E2E 延后至宿主替换波次。
- 已找到的未完成计划：UI-10 仍有待验收组件，UI-11 lx-ui 整库 Impeccable Critique 未完成，UI-04 Vue3 组件替换未完成，UI-12 整站审查依赖 UI-04/UI-09；`CODE-REVIEW.md` 保存 lx-ui/admin-vue3 问题清单，`CODE-REVIEW-VALIDATION.md` 还列有 CODE-03 权限管理页写操作锁等后续工作。全量清单在后续按路线逐项核对，不将旧静态审查报告的每条历史建议直接认作当前缺陷。
- AuthImg 旧快照的源码指纹与当前目标文件不一致，因此仅留作历史参考；新 A/B 正在独立运行，结果收齐前状态为未完成。浏览器只使用本地 Mock，真实后端尚未联调。
- 最新提交 `2a93ef1` 已加入 `LxInput`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`Group`、`LxRadio`/`Group`、`LxSwitch`、`LxButton` 等基础封装，确认代码已在本地。UI-13 同时覆盖 `LxForm` 与 `LxDynamicForm`，动态字段每类 type 使用独立子组件且只组合 Lx 控件，禁止直接用 `El*` 字段控件替代；增加 React/TSX 友好 `value` + `change(nextValue)` 并保持旧 `v-model` 兼容；上传支持单图、多图列表；布局按容器宽度自适应 1/2/3 列。所有 lx-ui 组件逐项映射到设计依据并严格核对，修复后完成测试与正式 Impeccable 复验。
- 当前没有改动业务源码；本次仅更新计划、路线图、交付核查和项目地图，用于记录新需求及波次依赖。后续按上面顺序继续，不等待逐波人工确认。

## [2026-09-29] GLM #2 Cascader 值契约修正与 ColForm 竞态回归稳定化

- 目标：让 `LxSearchBar` 的级联字段遵循实际 Element Plus 值契约，并避免竞态 E2E 在旧 Mock route 尚未结束时提前断言。
- 改动文件：`linkx-fe/src/components/LxSearchBar/{types.ts,index.vue,demo/basic.vue}`、`linkx-fe/docs/components/lxsearchbar.md`、`other-admin/admin-vue3/tests/unit/lx-search-bar.test.ts`、`other-admin/admin-vue3/tests/e2e/col-form-search-race.spec.ts`，以及计划、项目地图、迁移和代码评审核验台账。
- 完成内容：Cascader 节点值接受 string、number 与普通 record object；组件不再因普通 `call` 或 `Symbol.iterator` 字段拒绝记录对象，保留混合路径及值类型。Demo 改为数字组织 ID，中文 API 与测试说明同步。迟到人员查询测试释放旧请求后等待 route handler 的 `finally` 完成，再确认重开表单没有旧人员选项。
- 验证命令与结果：Vue3 `vue-tsc --noEmit` 通过；`lx-search-bar.test.ts` 6/6；`col-form-search-race.spec.ts` 4/4；定向 ESLint 对 Vue3 测试文件无错误；本次文件 Prettier 检查通过；lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs` 通过；`git diff --check` 无空白错误。linkx-fe 没有独立 ESLint CLI，因此未将 ESLint 记录为通过。E2E 使用本地 Mock，不代表真实后端联调。
- 未完成/阻塞：GLM #2 的独立 Luna 代码复审仍待完成；鉴权图片及重复提交的 Impeccable Luna A/B 正式复核仍在运行，未将 detector `[]` 当作视觉通过。
- 下一步：收齐代码审查与两项独立 A/B 报告，核验浏览器注入、截图、stderr 和退出码后综合并保存正式 snapshot；根据正式报告更新 UI-04 后续事项。

## [2026-09-29] GLM #1 lx-ui 全局组件注册完成，进入 #2

- 目标：确保 lx-ui 插件安装时使用明确、稳定的全局名称，不把组件注册到空名称。
- 改动文件：`linkx-fe/src/index.ts`、`other-admin/admin-vue3/tests/unit/lx-ui-install.test.ts`，以及交付计划、项目地图和迁移/审核台账。
- 完成内容：以 `Record<string, Component>` 显式注册 39 个 `Lx*` 组件；插件回归检查每个公开名称均可获取、名称无重复、空注册名不存在。公共导出和组件 API 未改变。
- 验证命令与结果：定向 Vitest 1/1；lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs` 通过；Vue3 全量 Vitest 39 文件/200 项、Vue3 `vue-tsc` 与 Prettier 通过。Code Review 未发现新增可复现问题。
- 未完成/阻塞：linkx-fe 没有独立 ESLint CLI，Vue3 ESLint 对库文件会忽略，故不记 ESLint 通过；VitePress 构建有大 chunk 警告。此任务无样式或动效变化，不需要 Impeccable 视觉结论。
- 下一步：GLM #2 Cascader 值类型；#11 另执行 Impeccable Audit 并核对浏览器状态，`[]` 只作为静态 detector 结果。

## [2026-09-28] Impeccable 规则固化与 CODE-02 请求竞态波次

- 最新选择器样式为自身 1px `border-box` 实体边框，状态只切换边框色，选择器无 `box-shadow`/`outline`，32px 高度和键盘行为稳定。旧 inset 记录保留为历史，不作为当前实现证据。
- Impeccable A/B 报告为 `.impeccable/critique/.element-bridge-assessment-a-single-border-final.md` 与 `.impeccable/critique/.element-bridge-assessment-b-single-border-final.md`；综合 snapshot 30/40。detector `[]` 只代表静态规则零命中，缺少浏览器状态、overlay/截图、stderr/退出码和 snapshot 时必须登记为复验未完成。
- CODE-02 完成 `useFetch` signal 通道、取消失效序号、卸载保护和可取消调度；`useTable` 仅在序号校验后的 onSuccess 写入列表/总数。7 项单测、定向 ESLint、vue-tsc 通过。
- 边界：未接入 signal 的旧 API 只能丢弃迟到结果；License、v-loadmore、四处提交锁、ColForm、AuthImg 留待下一波。所有 API 请求保持 `.then().catch().finally()`。

> 对应计划：[PROJECT-DELIVERY-PLAN.md](./PROJECT-DELIVERY-PLAN.md)  
> 记录原则：每个阶段只记录实际完成和实际验证，不把静态检查写成联调完成。

## 记录模板

```text
### [日期] 步骤编号 / 步骤名称

- 目标：
- 改动文件：
- 完成内容：
- 验证命令与结果：
- 未完成/阻塞：
- 下一步：
```

## [2026-09-25] P0-01 / 建立统一交付计划

- 目标：把迁移、权限、lx-ui、架构和验证缺口收敛到一份可持续更新的计划中。
- 改动文件：
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - 建立五类完成状态：源码对照、单测、Mock、E2E、真实联调。
  - 纳入按钮、文本、菜单、页面展示四层权限任务。
  - 纳入角色成员读取阻塞、OAuth 占位映射、组件库接入、menu-config 和引导系统。
  - 记录当前验证基线和工作区保护要求。
- 验证命令与结果：
  - 已完成只读代码和文档盘点。
  - 尚未修改业务实现，未宣称任何新增功能完成。
- 未完成/阻塞：
  - P0-02 以后任务尚未实施。
  - 角色成员读取、真实后端联调和 Playwright 浏览器环境仍阻塞。
- 下一步：执行 P0-02 权限契约清单和权限覆盖盘点。

## [2026-09-25] P0-02 / 建立权限契约清单

- 目标：明确菜单、页面、按钮、文本四层权限的真实来源，禁止凭空增加权限码。
- 改动文件：
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 记录菜单树、菜单权限 ID、操作权限码、身份类型、License 和全局开关来源。
  - 登记现役 Vue3 菜单和页面入口。
  - 列出已确认的按钮权限码和目前没有可信来源的操作范围。
  - 明确文本/字段权限契约尚未存在，不能直接实现脱敏规则。
  - 建立管理员、普通用户、空菜单、停用菜单和账号切换验收矩阵。
- 验证命令与结果：
  - 只读扫描 Vue2/Vue3 路由、权限工具、页面权限调用和测试文件，完成清单核对。
  - 未修改业务代码。
- 未完成/阻塞：
  - 未确认按钮权限码的模块必须等待 Vue2/API/后端证据。
  - 文本字段权限等待后端契约。
- 下一步：执行 P0-03 菜单、页面访问和 OAuth 映射修正。

## [2026-09-25] P0-03a / legacy 菜单过滤和确定性 OAuth 映射

- 目标：修复能够从现有路由/API 证据确定的菜单和占位映射问题。
- 改动文件：
  - `other-admin/admin-vue3/src/router/filterChain.ts`
  - `other-admin/admin-vue3/src/utils/menuRouteMapper.ts`
  - `other-admin/admin-vue3/tests/unit/auth-routes.test.ts`
  - `other-admin/admin-vue3/tests/unit/auth-oauth-map.test.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - legacy 菜单过滤忽略 `status=0` 停用节点，即使权限 ID 仍在缓存中也不会恢复。
  - 子菜单独立递归，父菜单没有单独权限 ID 时可以匹配已授权叶子节点。
  - `thirdParty`、`globals`、`collaboration` 及警单旧子路径改为当前实现或当前组件。
  - 新增 OAuth 映射测试和停用菜单路由测试。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/auth-routes.test.ts tests/unit/auth-oauth-map.test.ts --reporter=dot`：2 个文件、10 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error；`menuRouteMapper.ts` 仍有既有 console warning。
- 未完成/阻塞：
  - `GroupTags` 仍映射到 Vue3 占位页，需迁移或产品确认下线。
  - 真实浏览器直接地址和停用菜单验证尚未运行，Playwright Chromium 缺失。
  - P0-03 整体仍为进行中。
- 下一步：执行 P0-04，先把已确认权限码接入遗漏的高风险按钮页面。

## [2026-09-25] P0-04a / 已确认权限码的按钮接入

- 目标：让已有后端/Vue2 契约依据的按钮先统一消费权限，避免把未知业务码猜成新协议。
- 改动文件：
  - `other-admin/admin-vue3/src/components/ActionButtons/index.vue`
  - `other-admin/admin-vue3/src/composables/usePermission.ts`
  - `other-admin/admin-vue3/src/views/authority/auth/index.vue`
  - `other-admin/admin-vue3/src/views/authority/adminRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/userManage/index.vue`
  - `other-admin/admin-vue3/tests/unit/permission-ui.test.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `ActionButtons` 增加可选 `auth` 权限码，保留未传 `auth` 的兼容行为。
  - 后台角色、前台角色、管理员账号的新增、编辑、删除、启用/禁用、绑定和重置密码接入已确认权限码。
  - 后台角色状态切换无更新权限时禁用。
  - 新增按钮权限过滤单测。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/permission-ui.test.ts --reporter=dot`：3 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error；测试文件曾有 import/order warning，已调整。
- 未完成/阻塞：
  - 三方、地图、布局、协同、排班、预警、节点、警单、AI、虚拟用户等模块缺少可信按钮码映射，尚未接入。
  - `ActionButtons` 只覆盖统一组件，直接写在模板和 SearchBar 的按钮仍需逐页盘点。
- 下一步：执行 P0-05 文本权限指令和字段脱敏消费；随后继续补齐有契约依据的按钮。

## [2026-09-25] P0-05a / 文本权限消费框架

- 目标：按设计文档建立可更新的隐藏、禁用和脱敏权限指令，为后端字段权限契约预留安全消费边界。
- 改动文件：
  - `other-admin/admin-vue3/src/composables/usePermission.ts`
  - `other-admin/admin-vue3/src/directives/index.ts`
  - `other-admin/admin-vue3/tests/unit/permission-ui.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `v-has-perm`、`v-has-text-perm` 增加权限变化后的 `updated` 重判。
  - 新增 `v-auth`，支持默认移除、`.hide`、`.disable` 和 `.mask:field`。
  - 脱敏默认显示 `***`，恢复权限后还原原文本；未添加业务使用点，避免臆造字段权限码。
  - 新增指令行为单测。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/permission-ui.test.ts --reporter=dot`：3 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
- 未完成/阻塞：
  - 后端尚未提供文本/字段权限码，业务页面尚不能安全添加脱敏调用。
  - lx-ui 的 `setupLxPermission`、`permissionSource` 和组件列/描述脱敏仍未实现。
- 下一步：继续逐页盘点按钮，优先补有 Vue2/API 依据的操作；同步准备权限矩阵 E2E。

## [2026-09-25] P0-06 / Vue3 质量门禁收敛

- 目标：清理 Vue3 当前 ESLint 错误和调试输出，确认类型、单测、格式和生产构建可以重复运行。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/customDepartment/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/thirdParty/index.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColFunctionTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColSearch.vue`
  - `other-admin/admin-vue3/src/utils/menuRouteMapper.ts`
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - 移除未使用导入、局部状态和恒假条件；保留 `ColSearch` 原有 `hiddenSync` 兼容开关。
  - 删除未被消费的 OAuth 调试打印函数，异常路径不再输出敏感或无用对象。
  - 对查询/导出失败路径补充中文原因说明，避免空 catch 被误判为吞错。
- 验证命令与结果：
  - `pnpm lint`：通过，0 error、0 warning。
  - `pnpm exec prettier --check <本次涉及文件>`：通过。
  - `pnpm test:unit -- --reporter=dot`：11 个文件、42 项通过。
  - `pnpm build`：通过，产物生成成功。
- 未完成/阻塞：
  - 构建仍提示第三方依赖纯函数注释、Less `:export` 命名空间、动态/静态导入和大 chunk；属于构建配置/性能治理，不影响当前功能门禁。
  - Playwright Chromium、真实后端联调尚未执行。
- 下一步：继续补齐有可信来源的按钮权限，建立浏览器权限矩阵并处理 GroupTags 占位模块。

## [2026-09-25] P0-05b / lx-ui 权限消费层

- 目标：按 `doc/lx-ui/MENU-CONFIG-DESIGN.md` 建立与业务无关的权限消费层，让按钮和字段展示由宿主注入权限源控制。
- 改动文件：
  - `linkx-fe/src/permissions.ts`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/src/components/LxActionButtons/index.vue`
  - `linkx-fe/src/components/LxActionButtons/types.ts`
  - `linkx-fe/src/components/LxProTable/index.vue`
  - `linkx-fe/src/components/LxProTable/types.ts`
  - `linkx-fe/src/components/LxDescriptions/index.vue`
  - `linkx-fe/src/components/LxDescriptions/types.ts`
  - `linkx-fe/docs/components/permissions.md`
  - `linkx-fe/docs/.vitepress/config.ts`
  - `linkx-fe/docs/components/new-components.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/src/main.ts`
- 完成内容：
  - 新增 `setupLxPermission`、`hasPermission`、`isFieldMasked` 和 `maskValue`；库不请求接口、不保存登录态。
  - `LxActionButtons.auth`、`LxProTable` 列 `mask` 和 `LxDescriptions` 条目 `mask` 消费宿主注入的权限源。
  - Vue3 宿主注入已有 `userStore.buttons`；`maskedFields` 保持为空，等待可信后端字段权限契约。
- 验证命令与结果：
  - `linkx-fe/pnpm typecheck`：通过。
  - `linkx-fe/pnpm build`：通过。
  - `linkx-fe/pnpm build:docs`：通过；仅有文档 chunk 体积提示。
- 未完成/阻塞：
  - 后端尚未提供字段权限来源，业务页面不能凭空添加脱敏权限码。
  - 真实业务页面逐页替换和浏览器主题/上传网络验收仍待完成。
- 下一步：保持字段权限阻塞边界，继续补充有 Vue2/API 证据的业务按钮和组件宿主接入。

## [2026-09-25] P0-07 / 固定 Playwright 浏览器环境与权限矩阵验收

- 目标：让浏览器验收在本机可重复启动，并把权限按钮、菜单停用和页面展示纳入真实浏览器矩阵。
- 改动文件：
  - `other-admin/admin-vue3/playwright.config.ts`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/tests/e2e/fixtures.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - Playwright 优先使用有效环境变量，Windows 下自动查找 Program Files、Program Files (x86) 和 LocalAppData 中的 Chrome；找不到时回退 Playwright 自带浏览器。
  - 权限矩阵覆盖无操作权限隐藏新增/行内操作、权限恢复显示操作，以及停用菜单即使保留权限 ID 也不能注册页面路由。
  - 修复共享 `SearchBar` 的 controls/actions 插槽冲突，避免新增和批量操作按钮在浏览器中被吞掉。
- 验证命令与结果：
  - `pnpm exec playwright test`：系统 Chrome `153.0.8010.53` 下当前 42 项通过。
  - 包含 31 个入口 Smoke、GroupTags 列表/新增/失败重试/批删 Mock、未登录跳转、受限账号直接地址拦截、4 个权限矩阵用例和 4 个 UI/窄屏/键盘用例。
- 未完成/阻塞：
  - E2E 使用统一 Mock，不代表真实后端权限和业务联调。
  - 未知业务模块仍缺少可信按钮权限码，继续保留在权限契约阻塞清单。
- 下一步：补齐 GroupTags 编辑、单删和失败恢复边界；继续逐模块补业务 Mock/E2E。

## [2026-09-25] P0-04b / 现役按钮权限复核与后台用户状态守卫

- 目标：复核现役 Vue2/Vue3 可见按钮权限码，修复遗漏的状态切换守卫，并登记仍需后端确认的管理员账号 API 域。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - `adminPerson` 状态开关新增 `/admin/user/update` 权限判断，无权限时只显示状态标签。
  - 对照现役 Vue2 页面后，所有可见且有明确来源的 canonical 按钮码均已接入；`/admin/executorToEquipment/create` 仅出现在注释按钮中，登记为 P2 遗留契约，不直接恢复。
  - 发现 `adminPerson` 使用普通用户 API，而仓库另有 `adminUser` API；Vue2 同样存在差异，单独作为 P1 后端契约阻塞，不凭空替换。
- 验证命令与结果：
  - 权限矩阵新增“后台用户无更新权限时状态开关不可操作”用例。
  - 完整 `pnpm exec playwright test` 在系统 Chrome 下当前 42 项通过。
  - 定向 ESLint 和 Prettier 检查通过；完整单测 12 个文件、45 项通过。
- 未完成/阻塞：
  - 管理员账号 API/权限域需后端确认后才能做真实联调。
- 下一步：处理 GroupTags 编辑和单条删除 E2E，再按模块推进 P1 业务 Mock。

## [2026-09-25] P1-08 / H5 群组标签迁移

- 目标：移除 `GroupTags` 占位页，恢复 Vue2 已存在的标签分页、详情、新增、编辑、单删和批删能力。
- 改动文件：
  - `other-admin/admin-vue3/src/api/h5/groupTags.ts`
  - `other-admin/admin-vue3/src/router/modules/h5.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/tests/unit/group-tags.test.ts`
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：
  - 按 `src/api/h5/groupTags.js` 恢复 `/collaboration/v1/tags/page`、`/tags/{id}`、`/tags` 和 `/tags/delete/list`，删除路径统一编码。
  - 在 `router/modules/h5.ts` 注册 `/h5/GroupTags`，使动态菜单权限过滤后的真实页面可直接访问。
  - 页面提供搜索、重置、分页、多选、单条删除、批量删除、新增/编辑弹窗、图标选择和颜色编辑。
  - 明确 `GroupTags` 与 `/collaboration/quick` 的标签树业务使用不同接口，未将两套契约合并。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/group-tags.test.ts --reporter=dot`：2 项通过。
  - `pnpm exec playwright test`：包含 `tests/e2e/group-tags.spec.ts` 在内共 42 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：0 error、0 warning；本次文件 Prettier 检查通过。
- 未完成/阻塞：
  - 编辑、单条删除、完整按钮权限和真实后端联调尚未执行。
  - Vue2 没有为该页面提供明确的按钮权限码，暂不猜测新增/编辑/删除/批删权限键。
- 下一步：补齐 GroupTags 编辑、单删和失败恢复边界；继续按权限契约逐页补齐有证据的按钮码。

## [2026-09-26] DOC-02 / 登录与图标动效规划

- 目标：把新增登录页和 LxIcon 动效设计资料纳入总计划，明确先后顺序和验收标准。
- 参考资料：
  - `doc/登录1/`、`doc/登录2/`：两套登录页设计参考，尚未选定最终方案。
  - `doc/LxIcon P0 核心矢量线性图标集规范标本 (含Hover微交互动效版)/`
  - `doc/LxIcon P1 级矢量线性图标集规范标本 (含Hover微动效交互版)/`
  - `doc/LxIcon 29枚矢量线性图标集规范标本 (含Hover灵动微交互)/`
- 改动文件：
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增 UI-05 登录页视觉对照与实现任务，要求保留 OAuth、改密、License 提示、校验和键盘/窄屏行为。
  - 新增 UI-06 归并 P0/P1/29 枚图标命名及覆盖关系、UI-07 P0 实现、UI-08 P1/29 扩展任务。
  - 将 `prefers-reduced-motion`、focus/触屏验收和本地 SVG/接口值兼容纳入图标完成标准。
- 验证命令与结果：只读核对设计目录和当前登录页/图标组件入口；未实施登录视觉改版或 LxIcon 动效，不将其标记为完成。
- 未完成/阻塞：UI-05 至 UI-08 均待开始；三套图标清单之间的重叠尚未归并。
- 下一步：先完成 GroupTags 自动化编辑/单删边界，再进入已排期 UI 设计实现。

## [2026-09-26] DEV-01 / 隔离式本地 Mock 预览

- 目标：提供可直接查看 Vue3 群组标签页的本地预览，所有 API 请求不触达真实后端。
- 改动文件：
  - `other-admin/admin-vue3/package.json`
  - `other-admin/admin-vue3/.env.mock-preview`
  - `other-admin/admin-vue3/vite.config.mts`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/iconMap.ts`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增 `pnpm dev:mock`，使用独立 `mock-preview` 模式和 30847 端口，不设置 API proxy。群组标签、登录、菜单、权限和 Navbar 绑定查询使用本地 Mock；写操作只改当前 Vite 进程内存，重启后恢复样例数据。
  - 未配置的 `/linkx/admin/**` 请求返回 HTTP 501；验证登录 API 返回本地令牌，未知 API 返回 501。
  - 预览业务 URL 自动建立本地会话，`/login` 会清除该会话并显示登录表单；Mock 登录可实际提交。
  - 旧 Font Awesome 类名映射为 Element Plus SVG，不改变存储和 API 传输值；为旧图标渲染增加 E2E 断言。
- 验证命令与结果：
  - `pnpm exec vue-tsc --noEmit`：通过。
  - 定向 ESLint：通过，0 error、0 warning；相关文件 Prettier `--check` 通过。
  - `pnpm exec playwright test`：系统 Chrome 下 43 项通过。
  - 本地浏览器验证：登录表单提交成功；GroupTags 列表、5 个图标、增/改/单删通过，无页面 JS 错误或 Mock 错误提示；390px 登录页无横向溢出。
- 未完成/阻塞：
  - 本地 Mock 不代表真实接口联调；未配置页面 API 会明确报 501。
  - GroupTags 按钮权限码仍等待可信契约来源。
- 下一步：按权限契约继续确认 GroupTags 操作权限，并推进下一个未闭环模块。

## [2026-09-26] P1-08b / GroupTags 编辑与单删 E2E

- 目标：把本地预览手工验证过的编辑和单条删除行为固化为 Playwright Mock 回归。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/group-tags.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 新增编辑与单删浏览器用例，验证详情 GET、标签 ID 对应的 PUT/DELETE、更新后列表回显和删除后空列表。
  - 在迁移台账中记录自动化证据，并将当前 E2E 基线更新为 44 项。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/group-tags.spec.ts`：3 项通过。
  - `pnpm exec playwright test`：44 项通过。
  - `pnpm exec vue-tsc --noEmit`：通过；定向 ESLint、Prettier 检查通过。
- 未完成/阻塞：GroupTags 按钮权限码缺少可信来源；取消/重复提交边界及真实后端联调未完成。
- 下一步：根据权限契约确认按钮操作可见性，再推进迁移台账中的下一个未闭环模块。

## [2026-09-26] DEV-02 / 全现役菜单与首屏 Mock 数据

- 目标：让本地预览显示全部现役 Vue3 菜单，并让 31 个业务入口首屏都有可核对的样例数据。
- 改动文件：
  - `other-admin/admin-vue3/mock/preview-data.ts`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/src/layout/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/src/components/AuthImg/index.vue`
  - `other-admin/admin-vue3/playwright.config.ts`
  - `other-admin/admin-vue3/playwright.preview.config.ts`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 核对现役路由与 Mock 菜单均为 10 个一级、31 个二级入口；Mock 模式在桌面和窄桌面展开全部子菜单，移动端仍使用原有抽屉行为。
  - 补齐 31 个入口的首屏样例文案断言和轮播图 SVG Mock 响应；AuthImg 以响应 MIME 类型创建 Blob，确保图片可解码。
  - 修复 390px 以下顶栏拥挤：隐藏非关键提示和长用户名，为面包屑保留弹性空间；320px/390px 检查顶栏不重叠且文档无横向溢出。
  - 默认 Playwright 配置排除预览专用测试，避免 Mock 预览请求进入普通开发服务器的真实后端代理；预览配置独立运行该测试。
- 验证命令与结果：
  - `pnpm test:e2e:preview`：1 项通过，覆盖 31 个入口、全部样例文案、未知 API 和 2 张轮播图解码。
  - `pnpm test:e2e`：45 项通过，未出现后端代理请求。
  - `pnpm test:unit -- --reporter=dot`：12 个文件、45 项通过。
  - `pnpm exec vue-tsc --noEmit`、本次文件定向 ESLint、Prettier 检查：通过。
  - 响应式修复后 `pnpm exec playwright test tests/e2e/ui-audit.spec.ts`：4 项通过；390px 和 320px 浏览器截图已检查。
  - `pnpm build`：通过；仍有既有 Less 导出提示、分包循环和大 chunk 警告。
- 未完成/阻塞：这里只验收首屏样例展示，不代表 31 个入口的全部业务操作、上传下载、权限状态或真实后端联调已完成；`adminPerson` API 域仍待后端契约确认。
- 下一步：继续处理计划中的 UI-05 登录页设计对照与实现，并按步骤补齐 UI-06 至 UI-08 图标规范和动效任务。

## [2026-09-26] DEV-03 / 北向菜单与样例数据补齐

- 目标：修复 Mock 预览遗漏 Vue2 现役“北向接入管理”菜单的问题，并让入口数据和 E2E 断言覆盖实际菜单数量。
- 改动文件：`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`doc/PERMISSION-CONTRACT.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`。
- 完成内容：
  - 对照 Vue2 `thirdInterface.js` 和 Vue3 `thirdParty.ts`，确认 `/thirdParty/thirdParty` 属于现役入口；此前页面实现和预览菜单已有，但项目台账仍按 31 个入口记录。
  - 当前 Mock 提供 10 个一级菜单、32 个二级入口及逐入口首屏样例；北向页面使用 `systemName` 和既有 client API，支持筛选、详情和增改删。
  - 同步总计划、项目地图、权限契约、迁移矩阵、Backlog 和 Mock 场景说明，明确北向按钮权限与真实后端联调仍待确认。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；遍历 32 个入口并验证北向筛选及增改删，未知 API 保持隔离返回。
- 未完成/阻塞：其余业务页深层交互及全权限组合未覆盖；北向按钮权限码和真实后端字段/行为仍需可信契约及联调环境。
- 下一步：按计划推进 UI-05 登录页设计落地，并记录实际视觉、键盘、窄屏及功能验收。

## [2026-09-26] DEV-04 / 归档群组旧菜单路径兼容

- 目标：恢复 Vue2 菜单使用的 `/policeExtend/ArchivedTable` 层级和 URL，并保留 Vue3 已使用的 H5 地址兼容。
- 改动文件：`other-admin/admin-vue3/src/router/index.ts`、`src/router/modules/h5.ts`、`src/router/modules/policeExtend.ts`、`mock/preview-menu.ts`、`tests/e2e/preview.spec.ts`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`doc/PERMISSION-CONTRACT.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`。
- 完成内容：归档页现在由 Vue2 同源的警信扩展父菜单进入；`/h5/ArchivedTable` 隐藏重定向到规范路径。License 与菜单权限过滤继续作用于规范路由。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；覆盖全部 32 个入口、首屏样例以及旧 H5 地址重定向。
- 未完成/阻塞：归档页下载、批删、同步配置和业务按钮权限仍未完成；真实 License/菜单后端未联调。
- 下一步：推进 UI-05 登录页设计实现；P0-03 的受限账号、空菜单及 License 矩阵仍需单独验收。

## [2026-09-26] UI-05 / 登录页设计对照与实现

- 目标：把 `doc/登录1/` 与 `doc/登录2/` 的登录视觉落到 Vue3 页面，同时保留 OAuth、改密、License 和键盘/窄屏行为。
- 改动文件：`other-admin/admin-vue3/src/views/login/index.vue`、`tests/e2e/ui-audit.spec.ts`、`src/styles/login.less`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`。
- 完成内容：整合为居中单列认证页，保留 OAuth2 密码流程、密码过期/修改和 License 提示；实现“记住账号”显式勾选后仅在登录成功时保存账号名，取消时清除，不保存密码或令牌；支持减少动效并保留窄屏和键盘操作。
- 验证命令与结果：`pnpm test:e2e`：52 项通过，覆盖登录、改密重复提交锁定、License 提示、记住账号回填/清除及 390px/320px 布局；`pnpm lint`、`pnpm exec vue-tsc --noEmit` 和涉及文件 Prettier 检查通过。
- 未完成/阻塞：真实 License、登录和心跳接口联调未执行；记住账号仅用于本机账号名回填，不保存凭证。
- 下一步：推进 UI-06 图标规范归并，再依序实现 UI-07 核心动效和 UI-08 扩展图标。

## [2026-09-26] DEV-05 / 全菜单可见性与首屏数据回归

- 目标：解决长菜单在普通视口下后半段不明显的问题，并确认所有现役入口有可见的 Mock 首屏数据。
- 改动文件：`other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`、`src/styles/sidebar.less`、`tests/e2e/preview.spec.ts`、`docs/MOCK-SCENARIOS.md`、`docs/MIGRATION-MATRIX.md`、`docs/MIGRATION-BACKLOG.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`。
- 完成内容：侧栏增加常驻菜单检索，按父级/页面标题过滤，仅从当前权限菜单构建结果；结果可键盘聚焦并按 Enter 导航。预览 E2E 逐项比对 10 个分组、32 个页面名称，遍历全部 32 页验证对应样例内容并检查未知 Mock API；北向业务操作继续使用内存 Mock。
- 验证命令与结果：`pnpm test:e2e:preview`：2 项通过；`pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过；`pnpm lint`、`pnpm build` 和变更文件 Prettier 检查通过。构建仍有已登记的 Less 导出、分包循环和大 chunk 警告。
- 未完成/阻塞：此项验收全菜单导航与首屏样例，不等于全部页面深层写操作均已 Mock 或真实后端数据联调通过。
- 下一步：继续补齐 P0-03 权限访问矩阵，并逐模块推进 P1 业务 Mock/E2E。

## [2026-09-26] P0-03b / 页面访问权限浏览器矩阵

- 目标：验证菜单过滤结果和直接地址访问一致，覆盖空菜单、停用菜单、License、全局开关及生产隐藏规则。
- 改动文件：`other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`、`tests/unit/auth-routes.test.ts`、`doc/PERMISSION-CONTRACT.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`。
- 完成内容：新增空受限菜单不能直达、群组协同 License 失效时归档/位置菜单及页面受限、排班开关关闭时排班信息隐藏的浏览器用例；单测明确生产环境隐藏 6 个权限页。当前代码的 `permissions.type=0` 超管例外仍保留，停用菜单和 License/全局过滤继续优先执行。
- 验证命令与结果：`tests/e2e/permission-matrix.spec.ts`：7 项通过；`tests/unit/auth-routes.test.ts`：9 项通过；完整默认 E2E 52 项、单测 46 项通过。
- 未完成/阻塞：真实后端的管理员类型、License 字段真假语义、菜单列表和权限同步仍需可信接口环境；P0-03 因真实联调未执行保持进行中。
- 下一步：确认真实后端菜单/License 契约后完成联调；继续 UI-06 图标规范归并及剩余 P0/P1 任务。

## [2026-09-26] DEV-06 / 首页菜单与全菜单目录补齐

- 目标：补齐静态首页菜单，并让 Mock 预览可以一次浏览完整菜单目录和全部页面样例。
- 改动文件：
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/src/styles/sidebar.less`
  - `other-admin/admin-vue3/mock/preview-server.ts`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - `/dashboard` 是静态登录后路由，之前没有从动态权限菜单树进入侧栏；现已补入首页入口和包含全部当前授权菜单的目录。目录支持筛选、键盘导航和路由直达，不展示 `meta.hidden` 项。
  - 全量预览为首页加 10 组、32 个动态子菜单，共 33 个页面；首页样例检查欢迎语和警务协同、MSIP、警信三项版本 Mock。
  - 菜单/样例数量和首页固定路由例外已同步至权限契约、迁移矩阵、Backlog、项目地图和本计划。
- 验证命令与结果：
  - `pnpm test:e2e:preview`：2 项通过，覆盖 33 页首屏、完整目录与筛选跳转、未知 API、北向筛选及增改删。
  - `pnpm test:e2e`：52 项通过；`pnpm test:unit -- --reporter=dot`：12 个文件、46 项通过。
  - `pnpm exec vue-tsc --noEmit`、改动文件 ESLint、改动文件及文档 Prettier 检查、`pnpm build`：通过。
  - 浏览器检查确认首页入口和 33 项目录入口可见。构建仍有既有 Less 导出、分包循环和大 chunk 警告。
- 未完成/阻塞：Mock 样例只代表预览数据；其余业务页面的深层写操作、真实后端数据与权限联调仍未完成。
- 下一步：继续 UI-06 图标清单与别名归并，然后按 UI-07、UI-08 完成图标动效、Demo 和验收。

## [2026-09-26] UI-06 / P0、P1 与 29 枚图标清单归并

- 目标：将三份图标设计清单映射到 lx-ui 现有图形键，保持旧调用名称可继续使用。
- 改动文件：
  - `linkx-fe/src/components/LxIcon/icons.ts`
  - `linkx-fe/src/components/LxIcon/index.vue`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/docs/components/lxicons.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-icon.test.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
- 完成内容：
  - P0 清单 13 个名称全部命中；P1 清单 27 个名称中 `date` 映射到既有 `calendar`；29 枚清单中 `eye-on` 映射到既有 `eye`。其余名称与现有 94 个图形键一致。
  - 新增有类型约束的别名表和统一解析函数，`LxIconName` 现在覆盖 94 个标准图形键和 2 个别名；渲染元素保留调用方传入的名称用于诊断和动效定位。
  - 图标总览显示兼容别名，并说明别名复用的图形；交付核查、项目地图和迁移台账同步更新。
- 验证命令与结果：`pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot`：4 项通过；Vue3 `pnpm exec vue-tsc --noEmit` 与 lx-ui `pnpm exec vue-tsc --noEmit -p ../../linkx-fe/tsconfig.json` 均通过；本次源文件及文档 Prettier 已运行。
- 未完成/阻塞：Hover/focus/触屏动效、减少动效、浏览器验收和 Demo 交互属于 UI-07/08，尚未完成。组件库源文件不在 Vue3 ESLint base path 内，本步骤没有把它们记为通过 ESLint。
- 下一步：按 P0 参考为 13 个图标实现鼠标、键盘焦点和触屏按压微动效，完成 Demo、浏览器检查与减少动效验收。

## [2026-09-26] UI-07 / LxIcon P0 核心动效

- 目标：按 P0 参考实现 13 个核心图标的微动效，并覆盖键盘焦点和减少动效偏好。
- 改动文件：
  - `linkx-fe/src/components/LxIcon/icons.ts`
  - `linkx-fe/src/components/LxIcon/index.vue`
  - `linkx-fe/src/index.ts`
  - `linkx-fe/docs/components/lxicons.md`
  - `linkx-fe/docs/DELIVERY-CHECK.md`
  - `linkx-fe/docs/ROADMAP.md`
  - `other-admin/admin-vue3/package.json`
  - `other-admin/admin-vue3/playwright.icons.config.ts`
  - `other-admin/admin-vue3/tests/unit/lx-icon.test.ts`
  - `other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：
  - P0 删除、编辑、加减、刷新、撤销、上传下载、查看、加载、更多、文件夹和警告等 13 个图标按参考实现语义动效。图标跟随按钮/链接/role=button 的 hover、键盘 `focus-visible` 和按压状态，不会自行进入 Tab 顺序。
  - `prefers-reduced-motion: reduce` 时停止图标动画及位移变换；总览 Demo 为每个图标提供可访问名称、明确焦点样式、固定最小尺寸及筛选输入标签。
  - 新增独立 Playwright 配置与 `test:e2e:icons`，避免把文档站加入普通业务 E2E 的服务依赖。
- 验证命令与结果：
  - `pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot`：5 项通过。
  - `pnpm test:e2e:icons`：1 项通过，浏览器确认 96 个名称、P0 鼠标悬浮和键盘焦点动画、减少动效和 320px 无横向溢出。
  - Vue3 与 lx-ui `vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查、`pnpm build`、`pnpm build:docs`：通过；文档构建保留既有大 chunk 提示。
- 未完成/阻塞：P1 专属动效与 29 枚清单的触屏验收属于 UI-08；当前截图/浏览器证据只覆盖本步骤 P0 Demo，不代表所有宿主业务按钮都逐页视觉验收。
- 下一步：将 P1 和 29 枚清单按参考映射到既有图形名，补齐语义动效、别名焦点触发、触屏按压和整套文档浏览器验收。

## [2026-09-26] UI-08 / LxIcon P1 与 29 枚扩展动效

- 目标：完成扩展图标清单映射、参考动效、文档展示及桌面/触屏验收。
- 改动文件：
  - linkx-fe/src/components/LxIcon/index.vue
  - linkx-fe/docs/components/lxicons.md
  - linkx-fe/docs/DELIVERY-CHECK.md
  - linkx-fe/docs/ROADMAP.md
  - other-admin/admin-vue3/playwright.icons.config.ts
  - other-admin/admin-vue3/tests/unit/lx-icon.test.ts
  - other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts
  - other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md
  - doc/PROJECT-DELIVERY-PLAN.md
  - doc/PROJECT-MAP.md
  - doc/PROJECT-HANDOFF.md
- 完成内容：
  - P1 27 个名称与 29 枚扩展清单全部映射；date 和 eye-on 分别复用 calendar 与 eye，总计 69 个去重动效名称。
  - P1 补齐参考语义动效；29 枚扩展采用 scale(1.18) 与蓝色阴影。别名以标准图形的动效身份渲染，减少动效偏好会清除动画和变换。
  - 文档列出三份设计清单的完整名称，图标总览保留 96 个可用名称；Playwright 增加 Pixel 7 触屏项目。
- 验证命令与结果：
  - pnpm exec vitest run tests/unit/lx-icon.test.ts --reporter=dot：5 项通过。
  - pnpm test:e2e:icons：桌面 Chrome 与 Pixel 7 各 1 项通过，覆盖名称总览、清单计数、悬浮、键盘、触屏反馈、复制代码、减少动效和 320px 无溢出。
  - Vue3 pnpm exec vue-tsc --noEmit、lx-ui pnpm typecheck、Vue3 定向 ESLint、涉及文件 Prettier 检查、lx-ui pnpm build、pnpm build:docs：通过；文档构建保留既有大 chunk 提示。
  - lx-ui 没有独立 ESLint 配置；尝试将库内 SFC 交给宿主 ESLint 时被配置忽略，因此不记录为库 ESLint 通过。组件文件已由类型检查、Prettier 和构建验证。
- 未完成/阻塞：P1/P2 其他组件接入、上传/远程选择失败重试和真实业务页面逐项验收仍属于其他 UI 任务；P0 权限真实后端契约也仍待确认。
- 下一步：按总计划继续 P1-02 权限中心的 Vue2 源码对照和可验证缺口实现；对缺少后端契约的部分保留阻塞记录。

## [2026-09-26] P1-02 / 权限树失败保护与保存门禁

- 目标：补齐角色菜单树和部门数据权限树加载失败的可见反馈、恢复入口及提交保护。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/auth/components/EditRole.vue`
  - `other-admin/admin-vue3/src/views/authority/components/DataPermissionTree.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 三套角色菜单树任一失败时显示错误和重试；未全部成功前禁用保存。
  - 部门树校验成功响应码；初始部门树失败显示重试，懒加载失败保留未加载节点并在节点内提供重试。
  - 部门树状态传给角色弹窗；初次加载未完成或任一部门节点失败时禁止提交，重试成功后恢复保存。
  - 懒加载重试完成后重新展开节点；初始树重试成功后恢复已回显的权限选中项。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/permission-matrix.spec.ts --reporter=line`：10 项通过，其中包含部门树初始失败和懒加载子节点失败恢复。
  - `pnpm exec vue-tsc --noEmit`、定向 ESLint、涉及文件 `pnpm exec prettier --check ...`：通过。
  - `pnpm build`：通过；输出保留已有 Less 导出、循环分包、依赖注释和大 chunk 警告。
  - Playwright 请求全部由 Mock 拦截；没有执行真实权限/部门服务联调。
- 未完成/阻塞：角色设置用户仍缺少可信已有成员读取接口；人员绑定、管理员例外、直接地址的完整权限中心矩阵和真实后端联调尚未验收。
- 下一步：继续按 Vue2 对照逐项核验角色/人员绑定与管理员特殊角色；缺少可信接口时保留阻塞，不臆造字段或权限码。

## [2026-09-26] P1-02 / 管理员账号、人员权限和身份例外验证

- 目标：将部门树失败门禁覆盖到所有权限中心消费者，并补齐 Vue2 有据的人员按钮、特殊角色和管理员账号直达行为验证。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/userManage/components/EditUser.vue`
  - `other-admin/admin-vue3/tests/e2e/permission-matrix.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `doc/PERMISSION-CONTRACT.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：
  - 管理员用户编辑弹窗复用部门树加载状态；部门树失败或未完成时禁用并在处理函数中拦截提交，重试后恢复。
  - 角色 ID 2/6 的 Vue2 规则获得 E2E 证据：保留编辑，隐藏删除和启停；普通角色仍显示对应操作。
  - 普通人员操作矩阵验证 `/admin/executor/*`、`/admin/user/*`、`/admin/trUserRole/createMany` 权限码，以及仅通用管理员可重置密码/启停的条件。
  - `UserAuthFilter` 直接地址矩阵验证：管理员 ID 1 可加载管理员账号页；ID 2 即使权限菜单全量也不能进入或触发账号列表 API。
- 验证命令与结果：
  - `pnpm exec playwright test tests/e2e/permission-matrix.spec.ts --reporter=line`：14 项通过，所有后端读写请求均由 Mock 拦截。
  - Vue3 `pnpm exec vue-tsc --noEmit`、涉及文件 ESLint 和 Prettier 检查、`pnpm build`：通过。
  - 构建仍输出已有 Less 导出、循环分包、依赖注释和大 chunk 提示；新增用例后的默认全量 E2E 尚未重跑。
- 未完成/阻塞：Vue2 角色“设置用户”读取/绑定/解绑仍为 TODO/空 Mock；IM 权限和人员绑定完整业务闭环、生产环境真实账号身份/权限契约及真实后端联调尚未完成。
- 下一步：按契约继续核验 IM 权限与人员绑定；接口缺少可信 Vue2/API 来源时维持阻塞，然后推进 P1-03 基础数据导入导出、地图和布局配置失败恢复。

## [2026-09-26] 验证基线 / Playwright 套件范围与全量回归

- 目标：让默认业务 E2E 与 lx-ui 图标文档 E2E 各自使用匹配的服务配置，并重跑权限中心修改后的完整业务套件。
- 改动文件：
  - `other-admin/admin-vue3/playwright.config.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：默认配置排除 `lx-icon-docs.spec.ts`，由 `playwright.icons.config.ts` 独立运行图标文档项目，避免图标文档用例访问业务 Vite 服务并发起真实代理请求。
- 验证命令与结果：`pnpm exec playwright test --reporter=line`：59/59 通过；此前错误配置下观察到的 1 项图标文档失败是套件范围问题，修正后默认套件不再包含该用例。图标独立套件已在 UI-08 记录为桌面 Chrome 和 Pixel 7 各 1 项通过。
- 未完成/阻塞：全量 E2E 仍是路由、权限与既有交互覆盖，不代表每个业务模块已完成 Mock，也不代表真实后端联调。
- 下一步：补 IM 角色绑定弹窗的人员分页查询、权限门禁、批量绑定请求体和失败恢复 Mock E2E；通用后台角色设置用户成员回显接口仍按 Vue2 TODO 单独阻塞。

## [2026-09-26] P1-02 / IM 角色批量绑定 Mock 验收

- 目标：基于 Vue2 已存在的 IM 角色绑定 API 契约补齐浏览器权限与交互验证。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/authority-bind-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：无 `/admin/trUserRole/createMany` 权限时隐藏绑定按钮；授权后按人员姓名筛选，提交 `PUT /auth/v1/role/{roleId}/user` 和 `userIds` 数组；服务失败时保持弹窗及选择，允许重试。测试只访问 Playwright Mock。
- 验证命令与结果：专项 `pnpm exec playwright test tests/e2e/authority-bind-workflow.spec.ts --reporter=line`：3/3 通过；默认完整 `pnpm exec playwright test --reporter=line`：62/62 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint、变更文件 Prettier 检查通过。
- 未完成/阻塞：IM 权限配置页面和 IM 人员“设置角色”保存/回显仍需逐项验收；后台角色“设置用户”的 Vue2 读取接口仍是 TODO/空 Mock，无可信契约，不得提交可能覆盖全部成员的用户列表。
- 下一步：推进 P1-03，从全局参数配置加载失败提示与重试开始，随后覆盖地图文件、地理编码/区划和布局配置的读写及导出。

## [2026-09-26] P1-03 / 全局参数列表失败恢复

- 目标：让基础数据全局参数列表在接口或业务响应失败时保留现有数据并提供可操作的恢复入口。
- 改动文件：
  - `other-admin/admin-vue3/src/views/baseData/globals/index.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：全局参数查询现在验证 `code === 0` 和数组数据；失败时不清空已有列表，页面展示错误提示和重试按钮；成功后关闭错误提示。Mock E2E 特意放过启动阶段第一次全局参数读取，只让页面列表读取失败，随后验证重试恢复。
- 验证命令与结果：专项 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：1 项通过；默认全量 `pnpm exec playwright test --reporter=line`：63/63 通过；`pnpm exec vue-tsc --noEmit`、变更文件 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：全局参数 CRUD、地图底图/区划文件及布局子页读写、导出尚未完成 Mock；真实后端联调未执行。
- 下一步：继续 P1-03，优先为公共布局配置加载失败加重试和提交门禁，再覆盖地图上传、初始化、地理编码和区划下载。

## [2026-09-26] P1-03 / 公共布局配置读取失败保护

- 目标：避免 `/api/system/config` 读取失败时生成默认配置并开放保存，提供重试并在读取成功后恢复真实表单。
- 改动文件：
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/CommonConfig.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：配置加载要求成功码与数组数据；网络或业务失败显示重试，禁用字段与保存按钮，阻止单项或协同群组默认值写回；重试成功后回显服务器的 `SYSTEM_NAME` 等设置。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：2/2 通过；默认 `pnpm exec playwright test --reporter=line`：64/64 通过；`pnpm exec vue-tsc --noEmit`、相关文件 ESLint、Prettier 检查及 `pnpm build` 通过。构建保留已登记的 Less 导出、循环分包、依赖注释和大 chunk 警告。
- 未完成/阻塞：地图配置和文件导入导出、布局 App H5/PC/统计子页操作、真实后端联调仍未完成。
- 下一步：继续 P1-03，补地图底图上传/初始化和地理编码/区划导入导出 Mock，之后逐项覆盖布局其余子页。

## [2026-09-26] P1-03 / 地图底图上传与初始化 Mock 验收

- 目标：依据 Vue2 已有地图 API 契约验证 `.mbtiles` 扩展名门禁，以及上传成功后的初始化和列表刷新顺序。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：非 `.mbtiles` 文件显示错误且不调用上传接口；合法文件以 multipart POST 调用 `/api/map/uploadBaseMap`，随后调用 `/api/map/initBaseMap`，成功后刷新 `/api/map/selectPageBaseMap`。全部请求由 Playwright Mock 截获。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line --grep "地图底图"`：2/2 通过；默认完整 `pnpm exec playwright test --reporter=line`：66/66 通过；`pnpm exec vue-tsc --noEmit`、定向 ESLint 和 Prettier 检查通过。
- 回归稳定性复验：基础数据专项扩展至 7/7 后，默认完整套件 69/69 通过；此前 GroupTags 与 `/baseData/thirdParty` 两项首屏超时未在本轮全量套件中复现。
- 本地预览：`pnpm dev:mock` 已启动，`http://127.0.0.1:30847/h5/GroupTags` 返回 HTTP 200；浏览器确认侧栏 10 组菜单、“全部菜单”33 项和 5 条群组标签样例。Mock 模式不启用真实后端代理。
- 未完成/阻塞：地图上传大小上限和接口失败恢复、底图删除、地理编码与行政区划导入导出、全局参数 CRUD、布局其他子页及真实后端联调仍待验收。
- 下一步：继续 P1-03，覆盖底图上传/初始化失败与删除，再验证地理编码和行政区划文件流程；之后完成全局参数 CRUD 与布局子页读写。真实后端契约或环境不可得的部分继续单独标记阻塞。

## [2026-09-26] P1-03 / 地图底图失败恢复与删除 Mock 验收

- 目标：补齐底图上传失败、初始化失败和删除后的浏览器可观察行为。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：上传接口失败时不调用初始化；初始化失败时不刷新底图列表；删除使用 Vue2 既有 `POST /api/map/deleteBaseMap?id=...` 契约，成功后刷新并移除对应行。以上读写均由 Playwright Mock 拦截。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：7/7；默认 `pnpm exec playwright test --reporter=line`：69/69；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 和 `git diff --check` 通过。
- 未完成/阻塞：文件大小 500 MB 边界、地理编码读写、行政区划导入导出、全局参数 CRUD、布局其余子页及真实后端联调仍待完成。
- 下一步：继续 P1-03，验证地理编码与行政区划文件流程，再逐项覆盖全局参数 CRUD 和布局子页读写；真实后端契约或环境不可得的内容保持阻塞并记录依据。

## [2026-09-26] P1-03 / 行政区划导出与文件大小边界

- 目标：按 Vue2 契约完成行政区划导出、验证 500 MB 上传边界，并让行政区划读取失败可见且可重试。
- 改动文件：
  - `other-admin/admin-vue3/src/api/baseData/mapConfig.ts`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：旧上传组件以超过 500 MB 才拒绝，Vue3 两类上传现允许精确 500 MB；行政区划导出恢复 `POST /api/map/updateDivision?nodeId=0` 标准 JSON 响应并生成 `.geojson` 下载；区域读取失败展示错误和重试按钮。新增 5 项 E2E 覆盖边界、读取恢复、导出文件内容和失败提示。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：15/15；`pnpm exec playwright test --reporter=line`：77/77；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 和 `git diff --check` 通过。全部业务请求由 Playwright Mock 截获。
- 未完成/阻塞：全局参数 CRUD 与权限、地图配置新增编辑、地理编码失败恢复、布局其余子页读写和真实后端联调未完成。
- 下一步：继续 P1-03，优先检查全局参数可用操作与旧版契约，再完成布局子页读写；真实后端契约不可证实的权限和接口继续记录为阻塞。

## [2026-09-26] UI-09 依赖盘点与菜单目录回归

- 目标：确认 Vue3 宿主能否移除自己的 Element Plus 直依赖，列出 lx-ui 可替换项与缺少封装项，并复验全菜单目录导航。
- 改动文件：
  - `other-admin/admin-vue3/src/layout/components/Sidebar/index.vue`
  - `other-admin/admin-vue3/tests/e2e/preview.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：全菜单目录从“点击时关闭并销毁弹窗”改为“路由变化后关闭”，避免导航被同一点击中的弹窗销毁打断；E2E 断言北向路由跳转及弹窗关闭。完成 46 种 Element Plus 标签映射：13 种有 lx-ui 封装候选、8 种只有场景型封装、25 种没有通用 Lx 封装；后者仍可从 lx-ui 全量导出的 Element Plus 使用。确认 103 个 Vue3 Vue/TS 文件直接引用 element-plus，当前宿主和 lx-ui 实际解析版本分别为 2.14.2 与 2.14.6。结论是可移除宿主 package.json 直依赖，但必须先迁移导入、resolver、类型、locale、插件、样式和 Vite 配置；Element Plus 仍作为 lx-ui 传递依赖。
- 验证：`pnpm test:e2e:preview --reporter=line`：2/2；`pnpm exec vitest run --reporter=dot`：13 个文件、51 项；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 检查通过。默认 Playwright 86/86 与基础数据专项 24/24 为前一实现步骤的结果，本步骤未重跑；生产构建未运行。
- 未完成/阻塞：UI-09 的源码/构建迁移未开始，Vue3 宿主 element-plus 依赖当前仍保留。P1-03 的布局 App H5、PC 和运维统计读写/失败恢复、全局参数 CRUD、真实后端联调仍未完成。
- 下一步：继续 P1-03，对照 Vue2 检查布局 App H5、PC 和运维统计接口及失败状态，补 Mock/E2E 后更新迁移矩阵和交接记录。

## [2026-09-26] CODE-01 / P1-03 布局配置 API Promise 链风格

- 目标：按用户偏好保留 Vue3 宿主业务 API 的 `.then().catch().finally()` 调用方式，并将该约定记录到协作规则。
- 改动文件：
  - `AGENTS.md`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/AppH5Config.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/PcConfig.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/OpsStatistic.vue`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/CommonConfig.vue`
  - `other-admin/admin-vue3/src/utils/createDialog.ts`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-HANDOFF.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
- 完成内容：四个布局组件中的业务 API 调用改为 `.then().catch().finally()`；接口业务码判断和网络错误提示保留，请求状态在 `finally` 释放；App H5 写操作增加重复提交锁。修复 `createDialog` 可见状态未使用响应式变量、导致新增编辑弹窗不显示的问题。协作规则明确：弹窗、表单校验等非 API 异步流程可继续使用 `async/await`；其他 Vue3 模块的历史 API 调用纳入 CODE-01 分批迁移。
- 验证命令与结果：`pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：29/29 通过；`pnpm exec vue-tsc --noEmit`、涉及文件 ESLint、Prettier 检查、`pnpm build` 通过。构建仍有 Less 变量导出、Element Plus 循环分包、动态/静态导入、依赖注释和大 chunk 警告。Playwright 后端请求均由 Mock 拦截；`http://127.0.0.1:30847/h5/GroupTags` 返回 HTTP 200，本地 Mock 预览保持运行。
- 未完成/阻塞：全局参数完整 CRUD 与权限、PC 页签新增/编辑成功工作流、统计导出成功文件流、真实后端联调仍待完成；CODE-01 其他业务模块的历史 API 风格盘点/迁移尚未开始。`CODE-01` 整体保持进行中。
- 下一步：继续按基础数据未完成项补 PC 页签新增/编辑、统计导出成功路径和全局参数权限；之后按业务模块扫描 Vue3 宿主接口调用并分批改为链式处理，每步同步计划、迁移台账和交接记录。

## [2026-09-26] P1-03 / CODE-01 基础数据成功流程与 Promise 链迁移

- 目标：补齐 PC 页签和统计导出的成功路径，并把基础数据全局参数、地图与区划页面中直接 `await API()` 的调用改为 Promise 链。
- 改动文件：
  - `other-admin/admin-vue3/src/api/baseData/layoutConfig.ts`
  - `other-admin/admin-vue3/src/utils/http.ts`
  - `other-admin/admin-vue3/types/axios.d.ts`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/OpsStatistic.vue`
  - `other-admin/admin-vue3/src/views/baseData/globals/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/globals/components/globalsConfig.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/index.vue`
  - `other-admin/admin-vue3/src/views/baseData/mapConfig/components/EditMap.vue`
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `other-admin/admin-vue3/docs/MOCK-SCENARIOS.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：统计导出现在保留 ArrayBuffer 与 HTTP 响应头，处理服务端 JSON 错误并按 `Content-Disposition` 下载文件；新增 PC 页签按 Vue2 配置格式新增/编辑成功回读和 Excel 文件内容检查。基础数据全局参数和地图/地理编码/区划 API 改用 `.then().catch().finally()`，保留请求竞态、业务失败、重试和 loading/提交锁行为；表单校验、确认弹窗等本地异步流程保留 `async/await`。
- 验证命令与结果：基础数据专项 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：31/31 通过；`pnpm exec vue-tsc --noEmit`、涉及文件定向 ESLint、源码 Prettier `--check`、`pnpm build` 和 `git diff --check` 通过。构建保留 Less 变量导出、分包循环、动态/静态导入和大 chunk 警告；浏览器请求由 Mock 截获，真实后端联调未执行。Markdown Prettier 检查提示计划、地图、迁移矩阵和 backlog 的表格排版差异，本步骤未对整份文档自动重排。
- 当时未完成：App H5 编辑/删除、公共配置成功保存 Mock，及 CODE-01 其他业务模块的历史 API 调用。前两项由本文件 P1-03 最终验收关闭；API 风格迁移由后续 CODE-01 完成记录关闭。
- 真实后端联调未执行；该项仍按 P1-07 跟踪。

## [2026-09-26] CODE-01 / 登录与会话核心 API Promise 链

- 目标：把认证启动、会话清理、License/权限读取和共用同步查询中的宿主 API 调用统一为用户指定的 Promise 链风格。
- 改动文件：
  - `other-admin/admin-vue3/src/store/modules/useUserStore.ts`
  - `other-admin/admin-vue3/src/utils/session.ts`
  - `other-admin/admin-vue3/src/utils/auth.ts`
  - `other-admin/admin-vue3/src/utils/pageLoading.ts`
  - `other-admin/admin-vue3/src/views/login/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/tests/unit/auth.test.ts`
  - `other-admin/admin-vue3/tests/unit/page-loading.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：登录/登出、菜单初始化、权限/全局参数/License 读取、keepalive、登录密码修改、Navbar 绑定人员查询、部门递归查询和同步进度轮询改用 Promise 链；登出失败清会话、session epoch 竞态保护、5 秒轮询和深度优先结果顺序保留。表单验证、提示弹窗、路由和动态导入仍使用本地异步处理。
- 验证命令与结果：完整 `pnpm exec vitest run --reporter=dot`：14 个文件、54 项通过；`pnpm exec playwright test tests/e2e/ui-audit.spec.ts --reporter=line`：7/7；`pnpm exec vue-tsc --noEmit`、定向 ESLint、Prettier 检查和 `pnpm build` 通过。构建保留已记录的 Less 变量、循环分包、动态/静态导入及 chunk 警告。
- 未完成/阻塞：静态扫描仍在第三方接口、协同、权限中心、排班、H5、位置等模块发现历史 API `await`；真实后端联调未执行。`CODE-01` 保持进行中。
- 下一步：逐模块继续改写剩余页面的直接 API-await 调用，优先覆盖权限中心和第三方接口，并为每个模块补充行为回归与交接记录。

## [2026-09-26] CODE-01 / 权限中心首批 API Promise 链

- 目标：按项目约定收敛权限菜单、角色绑定、后台用户详情/保存和密码策略 API 的直接 `await` 调用。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/adminPermission/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPermission/index.vue`
  - `other-admin/admin-vue3/src/views/authority/adminRole/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imRole/components/BindUser.vue`
  - `other-admin/admin-vue3/src/views/authority/userManage/components/EditUser.vue`
  - `other-admin/admin-vue3/src/views/permission/components/userPassword.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：菜单树、角色批量绑定、用户详情/保存和密码策略请求改用 Promise 链；业务码在 `.then()` 处理，网络错误在 `.catch()` 提示，提交和加载状态在 `.finally()` 清理。保留公开的 `EditUser.open()` Promise 返回契约；确认框、表单校验等本地异步步骤继续使用 `async/await`。
- 验证：`pnpm exec vue-tsc --noEmit`、6 个文件定向 ESLint 和 Prettier 检查通过；`authority-bind-workflow.spec.ts` 与 `permission-matrix.spec.ts` 合计 16/17 通过。IM 角色绑定、失败后重试、数据权限树重试和用户编辑门禁通过。
- 未完成/阻塞：唯一失败为 License 菜单用例的 `.sidebar-container` 定位器未命中，需核对当前侧栏 DOM 与测试选择器；此失败点不在本批改动文件内。权限中心自定义部门、数据权限树、人员设角和 IM 权限 API 仍待迁移；真实后端未联调。
- 下一步：继续收敛权限中心剩余 API 请求，再按协同、第三方接口、排班、H5、位置模块推进 CODE-01。

## [2026-09-26] CODE-01 / 权限中心剩余请求链收敛

- 目标：完成权限中心其余人员角色、组织树、数据权限和自定义部门业务 API 的链式风格迁移，并清理等待 API helper 的 `async/await`。
- 改动文件：
  - `other-admin/admin-vue3/src/views/authority/components/DataPermissionTree.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/components/SetDataPermission.vue`
  - `other-admin/admin-vue3/src/views/authority/adminPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/index.vue`
  - `other-admin/admin-vue3/src/views/authority/imPerson/index.vue`
  - `other-admin/admin-vue3/src/views/authority/person/components/setRole.vue`
  - `other-admin/admin-vue3/src/views/authority/person/components/setBatchRole.vue`
  - `other-admin/admin-vue3/src/views/authority/customDepartment/index.vue`
  - `other-admin/admin-vue3/src/views/authority/auth/components/EditRole.vue`
  - `other-admin/admin-vue3/src/views/permission/components/userPassword.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：组织/部门及懒加载树、角色菜单树、人员设角和数据权限读取/保存均改用 `.then().catch().finally()`；业务码错误在 `.then()` 中反馈，网络失败由 `.catch()` 处理，loading 在 `.finally()` 清理。链式加载结果显式保留失败状态，避免请求失败后打开空弹窗或清空人员选择。权限中心剩余 `await` 仅用于表单校验、确认框等本地异步。
- 验证：`pnpm exec vue-tsc --noEmit`、15 个权限页面/组件定向 ESLint 与 Prettier 检查通过；`permission-matrix.spec.ts --grep "树"`：3/3 通过。树用例验证角色菜单树失败阻止保存及重试、数据权限部门树失败重试、管理员用户编辑的部门树门禁。
- 未完成/阻塞：完整权限矩阵较早一次为 16/17，唯一失败是 License 菜单用例找不到 `.sidebar-container` 侧栏选择器；该测试结构差异待单列检查。权限业务完整 Mock、真实菜单/License/角色接口联调仍按 P1-02/P1-07 跟踪。
- 下一步：迁移协同岗 API 请求，再处理第三方接口、排班、H5 和位置等 CODE-01 剩余模块。

## [2026-09-26] CODE-01 / 协同岗 API Promise 链

- 目标：统一协同岗主页、层级、职能、默认岗、上下岗、表单和导出请求的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/collaboration/index.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colLevelManage.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colOnOffRecord.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colEditRecord.vue`
  - `other-admin/admin-vue3/src/views/collaboration/colManage.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColForm.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColDefaultCoopTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/ColFunctionTab.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopLevelTree.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopBindDialog.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/CoopNodeDialog.vue`
  - `other-admin/admin-vue3/src/views/collaboration/components/OffDutyDialog.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：协同首页配置与人员归属、层级/职能/组织懒加载、默认岗递归分页与挂靠、协同表单查询/图标上传/新增编辑、上下岗、IM 同步状态/触发和两个 Excel 导出改用 Promise 链。保留业务响应判断、人员分页累加、切换组织选择过滤、递归总数、请求 loading/提交锁、树父节点刷新；表单验证、确认框和渲染等待保留本地异步。
- 验证：协同目录直接 API-await 静态扫描无命中；`pnpm exec vue-tsc --noEmit`、12 个文件定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：`preview.spec.ts` 2 项均失败且没有进入协同交互：全部菜单导航点击后仍在 `/h5/GroupTags`，北向接入 Mock 表格行断言为 0。协同专属业务 Mock E2E 和真实后端联调尚未执行。
- 下一步：继续扫描第三方接口，再迁移排班、H5、位置及剩余 API 请求编排工具；为协同补独立的 Mock 交互验收。

## [2026-09-26] CODE-01 / 第三方接口统一通信 Promise 链

- 目标：统一 ICP 服务配置、设备类型、部门树和单人/批量授权组件中的业务 API 调用风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/DeviceTypeManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/IcpServerConfig.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/IcpAuthManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/unifiedComm/components/AuthTreeModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：设备类型读取、展示状态修改、图标上传/保存，ICP 配置读取/保存/部门与摄像头树，非管理员部门归属查询、部门树，以及授权树与单人/批量授权保存均使用 Promise 链。保留业务码处理、开关回滚、上传临时 URL 清理与失败恢复、并行请求和 loading/提交锁释放；表单校验保留本地 `async/await`。
- 验证命令与结果：统一通信目录 `rg -n "await"` 只命中 `IcpServerConfig.vue` 的表单校验；`pnpm exec vue-tsc --noEmit`、4 个组件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：统一通信没有专属 Mock E2E，本批不记为浏览器交互或真实后端验收。智能体、南向、应用/警单等第三方接口子模块仍待扫描迁移，真实后端联调未执行。
- 下一步：迁移智能体接口，再处理南向、应用/警单、排班、H5 和位置模块，并继续为每个模块记录验证证据。

## [2026-09-26] CODE-01 / 第三方接口智能体 Promise 链

- 目标：统一智能体配置、分类、文件接口、查询记录、导入导出和虚拟用户绑定中的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/api/thirdInterface/agentInterface.ts`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/utils/category.ts`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentBindVirtualUser.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentConfig.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentFile.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentHistory.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/agentInterface/components/AgentManageEditModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：智能体设置与导入、分类读取/全量更新、文件接口 CRUD、智能体 CRUD、虚拟用户绑定、查询记录删除/导出和模板下载均使用 Promise 链。保留表单校验、确认框、绑定请求版本保护及状态释放；下载接口非成功业务码现在会进入页面失败反馈，避免误报成功。
- 验证命令与结果：智能体目录/API helper `rg -n "await"` 只命中表单校验和确认框；`pnpm exec vue-tsc --noEmit`、8 个文件定向 ESLint、Prettier 检查通过；全量 Vitest 14 个文件、54 项通过。
- 未完成/阻塞：未发现智能体专属 Mock E2E；真实后端字段、文件传输和绑定联调未执行。
- 下一步：迁移第三方南向、应用/警单模块，再处理排班、H5、位置和共享请求组件。

## [2026-09-26] CODE-01 / 第三方接口南向 Promise 链

- 目标：统一南向 Mapper、任务标准件配置、应用详情读取和应用新增/更新请求的写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/index.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/TaskConfigModal.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/AppsManageEditModal.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/southInterface/components/AppsManageDetailModal.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：Mapper 保存、任务标准件配置读取/保存、南向应用详情读取及新增/更新使用 Promise 链；详情加载状态、任务配置请求版本保护、失败门禁、成功码判断和提交/loading 锁释放均保留。表单校验使用本地 `async/await`。
- 验证命令与结果：南向目录 `rg -n "await"` 只命中两个表单校验；`pnpm exec vue-tsc --noEmit`、4 个文件定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：暂无南向专属 Mock E2E，真实后端联调未执行。
- 下一步：迁移应用与警单模块，再处理北向接入、排班、H5、位置和共享请求组件。

## [2026-09-26] CODE-01 / 第三方接口应用与警单 Promise 链

- 目标：统一应用/分组管理、图标上传、上下架、警单 Dock、类型和详情组件中的宿主 API 写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/AppManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/AppForm.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/app/components/GroupManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/DockManage.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/EditDock.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/TicketDetail.vue`
  - `other-admin/admin-vue3/src/views/thirdInterface/policeReport/components/TypeEdit.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：应用/分组分页与候选项读取、图标上传、应用及分组增改、上下架、Dock 状态/保存、警单类型保存和详情读取使用 Promise 链。保留表单校验、确认框、本地状态回滚、列表刷新与 loading/提交状态清理。
- 验证命令与结果：应用/警单目录 `rg -n "await"` 只命中表单校验与确认框；`pnpm exec vue-tsc --noEmit`、7 个文件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：暂无应用/警单专属 Mock E2E，真实后端联调未执行。
- 下一步：迁移北向接入，然后继续排班、H5、位置与共享请求组件。

## [2026-09-26] CODE-01 / 北向接入 Promise 链

- 目标：统一北向接入列表、应用新增/更新和删除请求的调用写法。
- 改动文件：
  - `other-admin/admin-vue3/src/views/eventType/thirdParty/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：列表读取、增改、删除使用 Promise 链；保留请求版本保护、保存/删除后的列表刷新、末页删除回退、确认框和表单校验。
- 验证命令与结果：北向页面 `rg -n "await"` 只命中表单校验和确认框；`pnpm exec vue-tsc --noEmit`、页面定向 ESLint 和 Prettier 检查通过。
- 未完成/阻塞：定向北向 Mock E2E 0/1，首屏表格预期 3 行实际 0 行、失败截图为空白；同一服务现有浏览器页面显示 3 行。两种运行表现不一致，需调查测试隔离/启动基线。真实后端未联调。
- 下一步：继续排班、H5、位置与共享请求组件，并独立排查北向 E2E 空白页问题。

## [2026-09-26] CODE-01 / 排班 Promise 链

- 目标：统一排班类型、值班信息和排班查询栏中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/DutySearchBar.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyType/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：排班类型分页、创建/更新/删除，排班下拉分页、日历查询、模板下载和导入后刷新改用 Promise 链。表单校验、确认框和 `nextTick` 保留本地 `async/await`；类型检查发现并修复下拉请求并发/无更多数据时的 `Promise<void>` 早退分支。
- 验证：`src/views/shiftScheduling` 的 `rg -n "await"` 仅剩表单校验和 `nextTick`；`pnpm exec vue-tsc --noEmit`、3 个文件定向 ESLint 与 Prettier 检查通过。
- 未完成/阻塞：无排班专属 Mock E2E；真实后端联调未执行。
- 下一步：继续 H5 轮播、归档、快捷标签和群组标签 API，再迁移位置及共享请求组件；真实后端联调仍单独记录。

## [2026-09-26] CODE-01 / H5 与快捷标签 Promise 链

- 目标：统一群组标签、H5 快捷标签及协同快捷标签页面的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/GroupTagsForm.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/TreeLabel.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/LookLabel.vue`
  - `other-admin/admin-vue3/src/views/h5/quick/EditForm.vue`
  - `other-admin/admin-vue3/src/views/quick/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：标签分页、详情、保存、单删/批删和警员关联读取改用 Promise 链；loading/submitting 在 `finally` 释放，业务失败与网络失败分别反馈。确认框取消保持静默；表单校验保留本地 `async/await`。
- 验证：`pnpm exec vue-tsc --noEmit`、6 个文件定向 ESLint/Prettier 检查通过；`group-tags.test.ts` 2/2、`group-tags.spec.ts` 3/3 通过；静态扫描仅剩 3 个表单校验 `await`。
- 未完成/阻塞：快捷标签无专属业务 E2E；H5 轮播/归档、真实后端联调未执行。
- 下一步：收敛轮播和归档 API 请求，再处理位置、仪表盘、虚拟用户及共享请求组件。

## [2026-09-26] CODE-01 / H5 轮播与归档 Promise 链

- 目标：统一 H5 轮播图和已归档群组页面中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/views/h5/carousel/components/CarouselForm.vue`
  - `other-admin/admin-vue3/src/views/h5/archivedTable/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：轮播图片上传、公众号/文章/环境配置及详情读取、轮播新增/更新，归档文件下载、系统配置读取、群组同步和同步配置写入改用 Promise 链。保留图片上传先于保存、下载取消静默、下载进度及定时器清理；同步配置业务失败不会误提示同步成功。
- 验证：H5 页面 `rg -n "await"` 只命中表单校验和归档下载确认；`pnpm exec vue-tsc --noEmit`、2 个文件定向 ESLint 和 Prettier 检查通过。未发现轮播/归档专属业务 Mock E2E。
- 未完成/阻塞：位置、仪表盘、虚拟用户与共享请求组件仍待迁移；真实后端联调未执行。
- 下一步：处理位置、仪表盘和虚拟用户页面，再审查共享表格、选择控件与请求 composable。

## [2026-09-26] CODE-01 / 位置、仪表盘与虚拟用户 Promise 链

- 目标：统一位置编辑、Dashboard 全局配置和虚拟用户管理中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/api/policeExtend/virtualUser.ts`
  - `other-admin/admin-vue3/src/views/dashboard/index.vue`
  - `other-admin/admin-vue3/src/views/location/components/EditLocation.vue`
  - `other-admin/admin-vue3/src/views/policeExtend/virtualUser/index.vue`
  - `other-admin/admin-vue3/src/views/policeExtend/virtualUser/EditVirtualUser.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：位置新增/更新、Dashboard 全局配置、虚拟用户列表/新增/编辑/删除改用 Promise 链；失败反馈与 loading 释放保留。将虚拟用户请求表单从动态索引类型收窄为显式字段，移除页面中的 `as never`。
- 验证：目录静态扫描只剩位置和虚拟用户表单校验 `await`；`pnpm exec vue-tsc --noEmit`、5 个文件定向 ESLint/Prettier 检查通过；`business-migration.test.ts` 10/10 通过。
- 未完成/阻塞：本批没有位置或虚拟用户专属业务 Mock E2E，真实后端联调未执行。
- 下一步：迁移 `OrgTreeSelect`、`UserBindDialog`、`SelectPagination`、`ProTable`、`useTable` 与 `useFetch` 中的请求等待。

## [2026-09-26] CODE-01 / 共享 UI 请求组件 Promise 链

- 目标：统一组织树选择、人员绑定弹窗、远程分页选择器和 ProTable 中的宿主 API 请求风格。
- 改动文件：
  - `other-admin/admin-vue3/src/components/OrgTreeSelect/index.vue`
  - `other-admin/admin-vue3/src/components/UserBindDialog/index.vue`
  - `other-admin/admin-vue3/src/components/SelectPagination/index.vue`
  - `other-admin/admin-vue3/src/components/ProTable/index.vue`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-HANDOFF.md`
- 完成内容：四个组件的直接 API 等待改为 Promise 链；保留组织树查询先后与懒加载回退、确认框取消静默、绑定/解绑状态清理、ProTable 请求序号与 abort 取消、错误事件和最终 loading 通知。
- 验证：四个组件 `rg -n "await"` 无命中；`pnpm exec vue-tsc --noEmit`、定向 ESLint/Prettier 检查通过；`pro-table.test.ts` 4/4，部门树失败恢复 E2E 2/2 通过。
- 未完成/阻塞：没有 SelectPagination 或 UserBindDialog 专属交互 E2E；真实后端联调未执行。
- 下一步：把 `useTable` 与 `useFetch` 改为链式请求，再全量扫描 Vue3 `src`，确认只保留表单/确认/渲染等待等本地异步。

## [2026-09-26] CODE-01 / 请求 composable 与全源风格收敛

- 目标：完成 `useTable`、`useFetch` 及全源扫描发现的剩余 API 等待，关闭 CODE-01。
- 改动文件：
  - `other-admin/admin-vue3/src/composables/useFetch.ts`
  - `other-admin/admin-vue3/src/composables/useTable.ts`
  - `other-admin/admin-vue3/src/composables/useLicense.ts`
  - `other-admin/admin-vue3/src/router/filterChain.ts`
  - `other-admin/admin-vue3/src/router/routerGuard.ts`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`
  - `other-admin/admin-vue3/src/utils/session.ts`
  - `other-admin/admin-vue3/src/views/baseData/layoutConfig/components/PcConfig.vue`
  - `other-admin/admin-vue3/tests/unit/use-fetch.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：`useTable` API 包装和查询操作改用 Promise 链；`useFetch` 请求、错误处理、重试、刷新改用 Promise 链，重试复用请求序号以阻止过期重试覆盖新请求；修复 `useTable.mutate` 只更新内部副本的问题。菜单初始化、License 过滤、登出会话和 PC 页签保存的 API 调用也不再使用 `await`。表单校验、确认/弹窗结果、`nextTick`、动态导入和按序路由过滤器仍保留本地异步写法。
- 验证：全量 Vitest 15 个文件、59 项通过；权限矩阵 Playwright 14/14；`pnpm exec vue-tsc --noEmit`、9 个文件定向 ESLint/Prettier 检查通过。Vue3 `src` 全量 `await` 扫描未发现直接业务 API `await`。
- 未完成/阻塞：真实后端联调未执行，按 P1-07 跟踪；无剩余 CODE-01 代码迁移项。
- 下一步：继续 P1 权限和业务 Mock 验收，并按 UI-09 计划迁移 Vue3 宿主对 Element Plus 的直接依赖。

## [2026-09-26] P1-03 / 基础数据 App H5 与公共配置 Mock 验收

- 目标：补齐基础数据台账中 App H5 编辑/删除和公共配置成功保存边界。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/base-data-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：新增 App H5 编辑回显与 PUT 载荷检查、删除失败后操作恢复和再次删除成功刷新；新增公共配置首次写入 `CREAT_GROUP_CONFIG`、回填 ID 后再次更新的请求载荷和界面成功状态检查。页面和 Vue2 API 契约一致，本步骤仅补 Mock 验收。
- 验证：完整 `pnpm exec playwright test tests/e2e/base-data-workflow.spec.ts --reporter=line`：33/33 通过；测试文件 ESLint 与 Prettier 检查通过。Playwright 通过 `mockBackend` 拦截请求，没有连接真实后端。
- 未完成/阻塞：真实后端联调尚未执行，按 P1-07 跟踪；基础数据 Mock/E2E 台账范围完成。
- 下一步：推进 P0-04 按钮权限逐页面契约核对与 P1-02 权限中心工作流，保留可信接口缺失项为阻塞。

## [2026-09-26] CODE-01 / HTTP 401 会话结束链式处理补漏

- 目标：清除业务请求失败拦截器中间接等待登出 API 的 `await`，保持宿主 API 链式风格，并确保提示门可以恢复。
- 改动文件：
  - `other-admin/admin-vue3/src/utils/http.ts`
  - `other-admin/admin-vue3/tests/unit/auth-http.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`
  - `doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：401 拦截器调用 `endSession()` 后以 Promise 链等待登出；在 `.finally()` 恢复提示门，并继续拒绝原始 401 请求。动态导入仍保留本地 `async/await`。
- 验证：`auth-http.test.ts` 6/6；全量 Vitest 15 个文件、60 项通过；`vue-tsc --noEmit`、涉及文件 ESLint 与 Prettier 检查通过。全源扫描剩余 `await` 均为本地表单、弹窗、动态导入、路由过滤顺序或渲染等待。
- 未完成/阻塞：真实后端登出与 401 联调未执行，按 P1-07 跟踪。
- 下一步：继续 P0-04 按钮权限逐页面契约核对与 P1-02 权限中心工作流，保留可信接口缺失项为阻塞。

## [2026-09-26] SCOPE / 新权限扩展与页面引导延期

- 目标：按用户最新范围决策区分 Vue2 迁移基线与新增需求，避免将新增功能当作本期迁移阻塞。
- 范围决策：Vue2 已有菜单过滤、明确按钮码和管理员例外继续迁移并保留回归；Vue2 没有的文本/字段权限、新权限中心工作流、缺少旧版权限码的额外按钮授权及页面引导系统延期。
- 依据：现役 Vue2 页面中的明确按钮码已在 Vue3 消费；`/admin/executorToEquipment/create` 只在注释按钮出现。角色成员读取在 Vue2 仍为 TODO/空 Mock。Vue3/Vue2 运行源码未找到 `GuideRegistry` 或 `driver.js` 引导流程；引导文件保留为草案。
- 文档同步：总交付计划、权限契约、项目地图、迁移矩阵、迁移 Backlog 和 `GUIDE-CONTENT-PLAN.md` 已记录延期状态及恢复条件。
- 未完成/阻塞：延期项不计为当前迭代阻塞，也不能报告为已完成；真实菜单/权限联调仍由 P0-03/P1-07 单独跟踪。
- 下一步：转入 P1-04 协同岗与排班的 Vue2 行为对照及 Mock 验收；保留既有权限门禁，不扩展无契约的权限键。

## [2026-09-26] P1-04 / 排班类型和值班信息 Mock 验收

- 目标：按 Vue2 行为补齐排班类型与值班信息的浏览器 Mock 验收，并修复验证中发现的问题。
- 改动文件：
  - `other-admin/admin-vue3/src/api/shiftScheduling/index.ts`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/index.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/DutyCalendar.vue`
  - `other-admin/admin-vue3/src/views/shiftScheduling/dutyInformation/components/ImportResultDialog.vue`
  - `other-admin/admin-vue3/tests/e2e/shift-scheduling-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：排班专项 E2E 覆盖类型 CRUD 与内置类型保护、列表条件查询、日历失败提示/重试和键盘切月、导入错误文本安全展示、模板下载文件名、批量删除失败后重试。修复日历切换早于子组件挂载导致漏查；模板导出改用 `getBinary` 并解析真实响应头；批删失败提供反馈且不提前刷新；服务端导入错误不再作为 HTML 渲染；日历读取增加 loading、失败提示及旧请求结果保护。
- 验证：`pnpm exec playwright test tests/e2e/shift-scheduling-workflow.spec.ts --reporter=line --timeout=20000`：4/4；`pnpm exec vue-tsc --noEmit`、5 个涉及文件的 ESLint 与 Prettier 检查通过。所有浏览器请求由 Mock 拦截；默认全量 E2E 未重跑。
- 未完成/阻塞：协同岗组织树、挂靠/上下岗、导入导出和失败恢复尚未补业务 E2E；真实后端联调未执行。
- 下一步：继续 P1-04 协同岗行为验收，权限仅保留 Vue2 已有菜单/按钮契约，不扩展新权限码。

## [2026-09-26] P1-04 / 协同岗下岗工作流 Mock 验收

- 目标：验证 Vue2 已有的管理员下岗工作流及失败恢复，不扩展权限契约。
- 改动文件：
  - `other-admin/admin-vue3/tests/e2e/collaboration-workflow.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：模拟协同岗列表、在岗人员、最后一人在岗判断和管理员下岗接口；验证最后一人提示、首次写入失败后人员仍在列表、重试成功后重新查询并关闭弹窗。请求载荷断言使用人员记录 ID，并保留服务端注入的 `switchType: 3`。
- 验证：`pnpm exec playwright test tests/e2e/collaboration-workflow.spec.ts --reporter=line --timeout=20000`：1/1；定向 ESLint 与 Prettier 检查通过。所有接口请求均由 `mockBackend` 截获。
- 未完成/阻塞：协同组织树、层级与职能挂靠、上下岗记录查询/导出、批量操作仍需验收；真实后端联调未执行。
- 下一步：验证协同岗上下岗记录筛选和二进制导出契约，然后继续树与挂靠工作流。

## [2026-09-26] PLAN / lx-ui 先行与页面验收顺序调整

- 目标：减少共享组件替换前后对同一表单、弹窗、表格、搜索、树、焦点和窄屏行为的重复验收。
- 依据：Vue3 宿主有 103 个源码文件直接引用 Element Plus，模板使用 46 种 Element Plus 标签；lx-ui 已有封装覆盖部分常用场景，其余控件仍由库入口导出 Element Plus。组件库目前类型、构建和文档构建通过，但除图标外的组件尚未完成完整真实浏览器验收。
- 决策：先完成将由宿主采用的高频 lx-ui 组件契约、Demo、行为测试和浏览器验收；再迁移宿主导入/自动导入/类型/插件/样式/分包；随后按共享组件影响面分批替换页面，并在每批后回归受影响页面；所有直接引用迁移后才移除 Vue3 对 Element Plus 的直接依赖。
- 并行边界：Vue2 源码对照、API/字段/状态契约及已有菜单/按钮权限与管理员例外核查可继续；不因调整重复运行未受影响的已通过测试。没有通用 Lx 封装的控件继续从 lx-ui 导入 Element Plus，不强制新建包装。
- 当前排队：P1-04 已通过的排班 4/4 与协同下岗 1/1 保留；协同树、记录筛选/导出、批量操作等深交互验收排在搜索/树/表格组件替换后。新权限中心、文本/字段权限及页面引导仍延期。
- 文档同步：`PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`linkx-fe/docs/ROADMAP.md`、`ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`。
- 下一步：从 lx-ui 高频组件与 UI-09 接入前置开始，先确认 `LxDynamicForm`、`LxDialog`、`LxProTable`、`LxSearchBar`、`LxVirtualTree` 等被宿主实际采用场景的 Demo/行为测试和样式缺口；保留 API 契约修复作为并行工作。

## [2026-09-26] UI-03 / LxVirtualTree 行为单测

- 目标：按 lx-ui 先行的新优先级，先为虚拟树补充可观察行为回归，再进入宿主逐页替换。
- 改动文件：
  - `other-admin/admin-vue3/tests/unit/lx-virtual-tree.test.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`
  - `linkx-fe/docs/ROADMAP.md`、`linkx-fe/docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`
- 完成内容：验证 100 项数据只渲染可视窗口、过滤时保留匹配节点祖先、选中父节点时跳过禁用后代、方向键展开并将焦点移至子节点。键盘测试将树挂载到文档中，验证真实 `document.activeElement`。
- 验证：Vue3 全量 Vitest 16 个文件、64 项通过；`pnpm exec eslint tests/unit/lx-virtual-tree.test.ts` 和该文件 Prettier 检查通过。该单测不代表独立 Demo 或真实浏览器验收。
- 未完成/阻塞：LxVirtualTree 独立 Demo、公开 exposes/属性覆盖和浏览器窄屏/主题验收仍待完成；其他高频组件的行为测试和 Demo 也未完成。
- 下一步：为 LxVirtualTree 补独立中文 Demo 和 API 页面，覆盖过滤、受控勾选、禁用节点、空态、exposes 与键盘；随后继续 LxDynamicForm、LxDialog、LxSearchBar 和 LxProTable 的库级证据。

## [2026-09-26] UI-04 / LxSectionTitle、LxIcon 与窄屏分页首批接入

- 目标：让 Vue3 首批高频入口采用 lx-ui 图标/标题组件，并修复 GroupTags 窄屏下表格和分页控件不可达的问题。
- 改动文件：
  - `linkx-fe/src/components/LxSectionTitle/index.vue`
  - `other-admin/admin-vue3/src/components/SectionTitle/index.vue`、`SearchBar/index.vue`、`Pagination/index.vue`
  - `other-admin/admin-vue3/src/layout/components/Navbar.vue`、`Sidebar/index.vue`
  - `other-admin/admin-vue3/src/views/h5/groupTags/index.vue`、`GroupTagsForm.vue`、`iconMap.ts`
  - `other-admin/admin-vue3/tests/unit/group-tag-icon.test.ts`、`section-title-adapter.test.ts`、`tests/e2e/group-tags.spec.ts`
  - 总计划、项目地图、迁移矩阵、lx-ui 路线图与交付核查、`AGENTS.md`
- 完成内容：SectionTitle 适配器改为使用 `LxSectionTitle`，保留旧 dashed 默认、旧 props 和未映射图标回退；侧栏、Navbar、SearchBar 与 GroupTags 常用图标改用 `LxIcon`。GroupTags 的 Font Awesome 接口字符串保持不变，仅本地映射到 LxIcon。GroupTags 表格和分页分别增加独立、可聚焦的横向滚动容器；375px 下页面本身无横向溢出，操作列及跳页控件可通过各自容器到达。
- 验证：Vue3 `vue-tsc --noEmit` 通过；Vitest 19 个文件、91 项通过；定向 ESLint 与本轮代码 Prettier 检查通过；GroupTags Mock E2E 4/4；默认 E2E 100/101，唯一 `/baseData/thirdParty` Smoke 隔离复跑 1/1 通过；Vue3 生产构建、lx-ui 类型/构建/文档构建通过。生产构建仍有 LESS 变量导出、Element Plus 分包循环和 chunk 警告。桌面及 375px 浏览器渲染已检查；Impeccable 检测器对本轮组件返回空结果。
- 未完成/阻塞：全量 E2E 中 `/baseData/thirdParty` 入口 Smoke 的间歇失败仍需观察。lx-ui 其他组件的 Demo、状态/键盘/主题浏览器证据未齐，因此正式 Impeccable 组件/动效审查尚未执行；Vue3 全量组件替换后的整站审查也未执行。其他 Vue3 页面仍有 Element Plus 图标和独立组件待迁移。
- 下一步：继续补 LxVirtualTree、LxDynamicForm、LxDialog、LxSearchBar、LxProTable 等组件的独立 Demo、行为测试和浏览器证据；组件库完成后用 Impeccable 审查组件与动效，落实建议并复验，再按共享组件波次迁移 Vue3 页面。未来 Vue2 页面迁入 Vue3 时直接采用 lx-ui；整站审查留到全量替换后。

## [2026-09-26] UI-02/UI-03 / LxVirtualTree 文档与公开契约

- 目标：补齐虚拟树调用者可见的 API、交互示例和实例方法类型，为 lx-ui 组件库验收建立可复查证据。
- 改动文件：
  - `linkx-fe/src/components/LxVirtualTree/types.ts`、`index.vue`、`src/index.ts`
  - `linkx-fe/src/components/LxVirtualTree/demo/basic.vue`
  - `linkx-fe/docs/components/lxvirtualtree.md`、`new-components.md`、`.vitepress/config.ts`
  - `linkx-fe/docs/ROADMAP.md`、`DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-virtual-tree.test.ts`、`docs/MIGRATION-MATRIX.md`、`docs/MIGRATION-BACKLOG.md`、`docs/ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`
- 完成内容：增加导出的 `LxVirtualTreeExpose` 类型和独立中文 API 文档；Demo 覆盖 240 节点窗口树、受控勾选、禁用节点、级联开关、筛选、`node` 插槽、公开方法、HUD 深色主题，以及由宿主提供的加载/错误/空状态。单测扩展到 8 项，覆盖公开方法和插槽。
- 验证：`pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 定向 Vitest 8/8，ESLint 和本轮新增 Demo/API/测试的 Prettier 检查通过。Chrome 浏览器中桌面筛选、受控选择、空/错状态恢复和方向键焦点通过；375px HUD 深色主题计算色为 `rgb(16, 26, 44)`，页面宽度 375/375 无横向溢出。Impeccable detector 对组件和 Demo 返回 `[]`。构建仍提示文档 bundle 超过 500 kB；现有大文档的全文件 Prettier 检查有既有格式差异，未整篇重排。
- 未完成/阻塞：其他高频组件的独立 Demo/行为证据仍待补；Impeccable 组件/动效审查要等库级 Demo 和浏览器检查完成后执行，Vue3 整站审查排在全量替换后。
- 下一步：继续 LxDynamicForm、LxDialog、LxSearchBar、LxProTable 等组件的独立验收材料；累积完成组件库 Demo、行为与浏览器检查后执行第一阶段 Impeccable 正式审查，再迁移 Vue3 页面，最终执行整站审查。

## [2026-09-27] UI-01 / 基础控件桥接与 DynamicForm 库级验收

- 目标：按用户确认的先后顺序，先完成 `design/` 基础控件与动态图标，再收尾 `LxDynamicForm`；Vue3 Element Plus 页面替换继续排在组件库完成和 Impeccable 库级审查之后。
- 改动文件：
  - `linkx-fe/src/styles/element-theme.css`
  - `linkx-fe/src/tokens/variables.css`、`linkx-fe/src/tokens/theme-hud.css`
  - `linkx-fe/src/components/LxForm/demo/control-bridge.vue`
  - `linkx-fe/docs/components/element-bridge.md`、`linkx-fe/docs/.vitepress/config.ts`
  - `linkx-fe/docs/components/lxdynamicform.md`、`linkx-fe/src/components/LxDynamicForm/*`（本轮只做浏览器验证）
  - `doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-MAP.md`、`linkx-fe/docs/ROADMAP.md`、`linkx-fe/docs/DELIVERY-CHECK.md`
- 完成内容：基础桥接 Demo 覆盖按钮 28/32/40px、默认/主/危险/禁用态、输入、选择、单选、复选、数字、日期范围、开关、文本域、Tabs、Card、Tree、Descriptions；表单必填错误可见，键盘焦点存在，HUD 深色令牌可切换。修正 HUD 主/危险按钮文字变量和占位文字对比度，避免亮底白字及过暗占位。
- DynamicForm 浏览器证据：文档页实际渲染；成功/空结果/失败状态与失败重试入口可见；切回成功恢复；任务类型联动显示“支援说明”；1/2/3 列栅格、24 栅格通栏、受控禁用、重置和 375px 单列/无页面横向溢出通过。失败模式下重试仍失败是当前 Mock 模式的预期结果，切换成功模式后可恢复。
- 验证：`linkx-fe/pnpm typecheck` 通过；`linkx-fe/pnpm build:docs` 通过（保留既有大 chunk 警告）；指定文件由 Vue3 已安装 Prettier 写入并检查；Impeccable detector 对本轮组件、Demo、令牌和桥接 CSS 返回 `[]`。基础控件和 DynamicForm 的浏览器检查均使用本地文档服务 `http://127.0.0.1:4174`，没有真实后端请求。
- 未完成/阻塞：UI-01/UI-02/UI-03 仍不能整体标记完成，其他待替换组件的 Demo、状态/键盘/主题浏览器证据尚未齐；正式 Impeccable 组件库审查要等库级组件闭环后执行，Vue3 全站审查要等全量替换后执行。Vue3 宿主仍有 Element Plus 直接引用，不能现在删除自身依赖；无专用 Lx 封装的控件继续从 lx-ui 导出的 Element Plus 使用。新权限中心、文本/字段权限和页面引导按确认范围延期。
- 下一步：继续补齐 LxDialog、LxSearchBar、LxProTable、LxSelectPagination、LxUpload 等宿主实际采用组件的 Demo、行为测试和浏览器证据；库级组件闭环后执行 Impeccable 审查并记录修复/复验，再进入 Vue3 导入和页面替换波次。业务 API 继续保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxSearchBar 状态验收与窄屏修复

- 目标：收尾 SearchBar 的 Mock 状态、受控查询交互和窄屏布局证据，按已确认顺序继续完成 lx-ui 后再替换 Vue3 的 Element Plus 控件。
- 改动文件：
  - `linkx-fe/src/components/LxSearchBar/index.vue`、`docs/components/lxsearchbar.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-search-bar.test.ts`、`docs/MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：新增 SearchBar 3 项行为测试，覆盖受控字段更新、按 schema 默认值重置并立即查询、loading 时禁止查询及超过 8 个字段后的展开。375px 展开时发现原 24 列及列间距撑宽组件，现移动断点使用单列网格并限制最小宽度。
- 浏览器验收：文档页 `http://127.0.0.1:4174/components/lxsearchbar` 桌面通过成功、空结果、失败、失败后恢复、重置、展开/收起和 loading 禁用；375px 下折叠/展开均为 375/375 页面宽度，十项条件全部可见，查询成功。数据为本地内存 Mock，不请求后端。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 全量 Vitest 21 个文件、103 项通过，`pnpm lint:ts`、定向 ESLint/Prettier、`pnpm build` 和 `git diff --check` 通过。构建保留既有 Less 变量导出、Element Plus 循环分包、大 chunk 和文档 chunk 提示。长篇 Markdown Prettier 检查在索引中的原始版本也失败，因此未做整篇格式重排。
- 未完成/阻塞：其他高频 lx-ui 组件的 Demo、行为和浏览器证据仍待补；组件库级 Impeccable 审查必须等库级组件闭环后执行，Vue3 整站审查仍排在宿主全量替换后。宿主仍有 Element Plus 直接引用，尚未进入依赖删除门槛；新增权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 LxDialog、LxProTable、LxSelectPagination、LxUpload 等宿主采用组件，完成组件行为证据后先做 Impeccable 库级审查，再按共享组件影响面替换 Vue3 页面；全量替换后再做整站审查并移除宿主 Element Plus 直接依赖。

## [2026-09-27] UI-02/UI-03/UI-11 / LxDialog 定向审查与窄屏验收

- 目标：补齐 LxDialog 独立文档、状态 Demo、移动端约束和可复查的 Impeccable 定向审查证据；保持“基础控件与动态图标 → LxDynamicForm → 其余 lx-ui 组件及组件库审查 → Vue3 Element Plus 替换”的已确认顺序。
- 改动文件：
  - `linkx-fe/src/components/LxDialog/index.vue`、`src/components/LxDialog/demo/basic.vue`、`docs/components/lxdialog.md`
  - `linkx-fe/docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/package.json`、`playwright.config.ts`、`playwright.lxui.config.ts`
  - `other-admin/admin-vue3/tests/unit/lx-dialog.test.ts`、`tests/e2e/lx-dialog-docs.spec.ts`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`
- 完成内容：定向 Impeccable 审查发现默认 672px 宽度缺少视口约束、移动端关闭按钮小于触屏目标及自定义按钮无明确焦点环。现限制 Dialog 最大宽度为视口减 32px；移动端关闭/操作按钮和示例表单控件采用 44px 尺寸；新增键盘焦点环、限制 hover 过渡属性，并对减少动效提供降级。标题保留 Element Plus `titleId`/`titleClass` 关联机制；Demo 覆盖表单校验/提交、危险操作与自定义 footer。`design/` 无单独的 Dialog 设计文件，外观沿用已有 FormModal 视觉实现和 lx-ui 令牌。
- Impeccable 检查：定向技术审查的建议已按上述范围吸收；源码 detector 对 Dialog 与 Demo 返回 `[]`。浏览器手动检查通过桌面表单、校验错误、loading 锁、危险样式、ESC、footer 和焦点回退。Chromium Playwright 3/3，通过 375px 面板边界、无页面横向溢出、单列表单、44px 关闭目标、可访问标题、键盘焦点环、减少动效、提交/错误/ESC/footer 检查。示例提交为本地内存 Mock，没有请求后端。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 Vitest 22 个文件、107 项通过；Dialog 文档 Playwright 3/3；定向 ESLint、Prettier 和 `git diff --check` 通过。构建仍提示 VitePress 文档 chunk 超过 500 kB；全库 Impeccable 审查不在本步骤宣告完成。
- 未完成/阻塞：UI-10 其他高频组件的设计映射、Demo/行为/浏览器矩阵仍在进行；UI-11 整库 Impeccable 审查待这些组件闭环。Vue3 Element Plus 页面替换和依赖删除仍未开始；权限中心、文本/字段权限及页面引导继续按用户确认延期。
- 下一步：继续 LxProTable、LxSelectPagination、LxUpload、树/穿梭等被 Vue3 采用组件的契约与状态验收；完成库级 Impeccable 审查及修复复验后，才启动 Vue3 组件接入和替换波次。业务 API 调用继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxProTable 选择与响应式验收

- 目标：按既定顺序补齐 LxProTable 的真实分页选择、加载可访问性、窄屏滚动与主题证据；Vue3 Element Plus 替换保持在 lx-ui 组件闭环和整库审查之后。
- 改动文件：
  - `linkx-fe/src/components/LxProTable/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxprotable.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/playwright.lxui.config.ts`、`tests/e2e/lx-pro-table-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：浏览器首先暴露跨页选择问题：已选计数为 2，但返回第一页时原行未勾选。组件现缓存仍选中的行对象，在 `selectedKeys` 或分页数据变化后恢复 Element Plus 内部选择；清空选择会移除全部缓存项。宽表格溢出时将组件区域加入 Tab 顺序并支持左右/Home/End 滚动；复选点按区域扩大到 44px；loading 增加 `aria-busy` 和 live status，系统减少动效时停止旋转但保留文字状态。Demo 新增成功/加载/空/错误重试、本地 HUD 主题切换、行点击/排序反馈、跨页清空和公开实例调用。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 `vue-tsc --noEmit` 和 Vitest 22 个文件/107 项通过；ProTable 文档 Playwright 4/4 通过，包含跨页选中恢复与清空、加载读屏/减少动效、空结果/错误恢复/排序、375px 页面无横向溢出/表内方向键滚动/44px 复选范围，以及真实 `.lx-theme-hud` 表头令牌切换。定向 ESLint、Prettier、`git diff --check` 通过；Impeccable 源码 detector 返回 `[]`。文档构建保留既有大于 500 kB chunk 提示；示例为本地内存数据，没有后端请求。
- 未完成/阻塞：组件级定向改进不等于 UI-11 整库 Impeccable 审查完成。`tableAttrs`、自定义列/单元格契约和权限脱敏尚无完整专项矩阵；其他 lx-ui 高频组件仍待 Demo、行为与浏览器验收。Vue3 Element Plus 导入切换、逐页替换和依赖删除没有开始；新权限中心、文本/字段权限及页面引导继续延期。
- 下一步：继续 LxSelectPagination、LxUpload 及其他 Vue3 实际采用组件；UI-10 闭环后进行正式 Impeccable 组件/动效审查，吸收建议并复验，再进入宿主接入和页面替换。保持“`design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件及整库审查 → Vue3 Element Plus 替换”顺序；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxUpload 上传状态与浏览器验收

- 目标：按已确认顺序继续完成 lx-ui 组件库证据；Vue3 Element Plus 替换必须等待其他候选组件闭环和整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxUpload/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxupload.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-upload.test.ts`、`tests/e2e/lx-upload-docs.spec.ts`、`playwright.lxui.config.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：对照 `design/上传拖拽区 Upload/` 增加进度与可读状态、失败保留/重试、取消、文件校验、紧凑列表和 `drag` 兼容属性；网络请求由宿主 `httpRequest` 或 `action` 配置。默认手动提交，无配置时阻止提交；`chunkSize` 只透传给宿主，不宣称内置分片协议。中文 API 和内存 Mock Demo 覆盖成功、加载、错误、重试、取消、禁用及主题。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`、`pnpm build:docs` 通过；Vue3 Vitest 23 个文件/111 项和 `pnpm lint:ts` 通过；Upload 定向单测 4 项、文档 Playwright 3 项通过。首次跑全量文档 E2E 时，Upload 进度测试因断言精确要求瞬时 20% 而观察到 40%/60% 失败；将其改为检查有效中间进度后，全量 Chromium 文档 E2E 14/14 通过。文档 chunk 大于 500 kB 的既有构建提示保留。
- 边界：示例全部由浏览器内存 Mock 驱动，未请求后端；地图/图标/Excel 业务页尚未替换，真实上传协议、鉴权及分片联调未执行。Upload 单项证据和定向源码检查不等于 UI-11 整库 Impeccable 审查。
- 下一步：继续验收 `LxDescriptions`、`LxStatusSwitch`、`LxTransferPanel` 与树/穿梭等 Vue3 替换候选；全部库级证据齐备后，使用 Impeccable 审查组件和动效、落实建议并复验，再开始 Vue3 Element Plus 替换。顺序保持 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与整库审查 → Vue3 替换。

## [2026-09-27] UI-02/UI-03 / LxDescriptions 设计验收

- 目标：按 `design/详情描述行 Descriptions/` 补齐描述行的设计实现、API/Demo、行为与窄屏证据；Vue3 Element Plus 批量替换继续等待 lx-ui 组件闭环及整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxDescriptions/index.vue`、`types.ts`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxdescriptions.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-descriptions.test.ts`、`tests/e2e/lx-descriptions-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：补齐 32px 紧凑行高、布局和标签宽度控制、复制字段与状态点；保留既有 Props、插槽及脱敏能力。浅色/HUD 深色辅助文字使用正文令牌；复制操作的可访问名称包含字段和值；描述网格适配窄屏并尊重减少动效设置。
- Impeccable 定向检查：评分 19/20，源码 detector 返回 `[]`。检查建议集中在辅助文字对比度、复制按钮可访问名称、窄屏约束和减少动效；已修改并由组件行为和浏览器用例复验。该定向结果不等于 UI-11 整库审查完成。
- 验证：`tests/unit/lx-descriptions.test.ts` 6/6；`tests/e2e/lx-descriptions-docs.spec.ts` 3/3，覆盖复制键盘焦点、32px 行高、状态展示、375/320px 抽屉边界、主题/减少动效及宿主加载/空/错误恢复；lx-ui 类型检查、构建、文档构建通过；lx-ui 文档 Playwright 全量 17/17。Vue3 全量 Vitest 基线 24 个文件、117 项通过。演示使用本地内存 Mock，不发起后端请求。
- 未完成/阻塞：Vue3 业务详情页尚未采用 `LxDescriptions`；UI-10 仍有 `LxStatusSwitch`、`LxTransferPanel` 和其他宿主候选待补；UI-11 整库组件/动效审查与复验未完成。权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 `LxStatusSwitch`、`LxTransferPanel` 及其余被 Vue3 使用的组件；UI-10 结束后做完整 Impeccable 审查并落实建议、复验；之后才进入 Vue3 Element Plus 替换。顺序固定为 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与整库审查 → Vue3 替换。Vue3 业务 API 保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxStatusSwitch 设计与浏览器验收

- 目标：对照 `design/状态开关 StatusSwitch/` 补齐 lx-ui 组件、中文 API/Demo 和交互证据；遵守既定顺序，暂不替换 Vue3 宿主 ElSwitch。
- 改动文件：
  - `linkx-fe/src/components/LxStatusSwitch/index.vue`、`types.ts`、`demo/basic.vue`、`src/tokens/variables.css`
  - `linkx-fe/docs/components/lxstatusswitch.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-status-switch.test.ts`、`tests/e2e/lx-status-switch-docs.spec.ts`
  - `other-admin/admin-vue3/docs/MIGRATION-MATRIX.md`、`MIGRATION-BACKLOG.md`、`ELEMENT-PLUS-LX-UI-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：保持布尔和旧 `0=开启/1=关闭` 映射；关闭操作可确认且取消不发出状态变更；提供只读、loading、失败恢复示例。轨道按设计固定 42×20px；为轨道文案增加对比度令牌、可见键盘焦点、减少动效和窄屏 44×44px 点按区域。Demo 保存逻辑使用 Promise 链风格的本地内存 Mock。
- Impeccable 定向复核：detector 对组件和 Demo 返回 `[]`；实测窄屏开关原触控盒宽 42px，修正为宽高至少 44px 并增加 Playwright 断言。该组件专项复核不等于 UI-11 整库审查。
- 验证：`tests/unit/lx-status-switch.test.ts` 6/6；`tests/e2e/lx-status-switch-docs.spec.ts` 3/3；完整 lx-ui 文档 Playwright 20/20。lx-ui 类型检查、构建（134 modules）、文档构建、定向 ESLint、Prettier 和 `git diff --check` 通过；文档构建仍有既有的大 chunk 警告。Impeccable detector 返回 `[]`。Mock 未访问后端。
- 未完成/阻塞：Vue3 宿主状态开关仍独立使用 Element Plus，需在后续 UI-04 替换波次核对数值映射和事件；`LxTransferPanel` 等其他组件、UI-10 整体闭环和 UI-11 整库 Impeccable 审查未完成。新增权限中心、文本/字段权限和页面引导继续延期。
- 下一步：继续验收 `LxTransferPanel` 及其余 lx-ui 候选；全部库级证据齐备后执行整库 Impeccable 审查、落实建议并复验，只有随后才开始 Vue3 Element Plus 替换。固定顺序为 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件与整库 Impeccable 审查 → Vue3 Element Plus 替换；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03 / LxTransferPanel 设计与浏览器验收

- 目标：按 `design/虚拟滚动树 + 双栏穿梭/` 补齐双栏穿梭行为、独立文档和移动端证据；Vue3 `DataPermissionTree` 替换继续等待其余组件闭环及整库 Impeccable 审查。
- 改动文件：
  - `linkx-fe/src/components/LxTransferPanel/index.vue`、`demo/basic.vue`
  - `linkx-fe/docs/components/lxtransferpanel.md`、`components/new-components.md`、`.vitepress/config.ts`、`ROADMAP.md`、`DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts`、`tests/e2e/lx-transfer-panel-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：将设计稿的左侧“全选/反选”落实到组件；全选和中间批量加入会按 `maxCount` 原子拒绝溢出操作，并显示 disabled 状态。树勾选更新会保留树外未加载键及已有禁用键；反选只翻转当前已加载、未禁用节点。右侧单项删除和清空即使初始选择超限仍可用；新增 `clear-all` 事件。文档明确 `change.nodes` 只包含当前树可解析节点，不伪造未加载数据。
- 验证：TransferPanel 单测 4/4、文档 Playwright 3/3；Vue3 Vitest 全量 26 个文件/127 项；Vue3 定向 ESLint 和 TypeScript 检查通过；lx-ui `vue-tsc --noEmit`、134 modules 构建、VitePress 文档构建、定向 Prettier 检查及 `git diff --check` 通过。浏览器检查覆盖批量状态、加载/空/错误恢复、375px 无横向溢出、44px 触控区域、焦点环、HUD 深色与减少动效设置。示例使用本地数据，不访问后端。文档构建仍有既有的大 chunk 警告。
- 未完成/边界：Vue3 `DataPermissionTree` 仍是业务实现，尚未采用 `LxTransferPanel`；后续替换时需对照 props、exposes、树勾选和父级回传契约并补真实宿主 Mock/E2E。本次未新增权限判断；UI-10 仍有其他 lx-ui 候选待补，UI-11 整库 Impeccable 审查未开始。
- 下一步：继续其他候选组件的设计、Demo、行为与浏览器验收；全部闭环后再按用户要求执行 Impeccable 组件/动效审查、落实建议并复验，之后才开始 Vue3 Element Plus 替换。顺序仍为基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件和 Impeccable → Vue3 替换；新权限中心、文本/字段权限、页面引导延期，业务 API 写法保持 `.then().catch().finally()`。

## [2026-09-27] UI-02 / 新增组件总览浏览器复核

- 目标：复查此前交接里记录的 `LxSelectPagination` 因 `targetMap['user-02']` 失败导致总览白屏。
- 发现：当前 `LxSelectPagination.externalItem` 可在目标映射缺失时安全回退到值标签；新增组件总览桌面实测能完整渲染，运行时没有报错。该白屏线索在当前代码上未复现，本轮没有改动组件实现。
- 改动文件：`other-admin/admin-vue3/tests/e2e/lx-new-components-overview-docs.spec.ts`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-HANDOFF.md`。
- 验证：文档 Playwright 2/2。桌面检查新增组件分区、远程分页选择、虚拟树、穿梭示例及无运行错误；375px 检查页面内容可见且无横向溢出。演示使用本地数据，无真实后端请求。
- 后续：此复核不改变 Vue3 组件替换门槛；继续按基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及 Impeccable 整库审查 → Vue3 Element Plus 替换推进。

## [2026-09-27] UI-02/UI-03 / LxActionButtons 键盘与窄屏验收

- 目标：补齐高频行内操作组件的真实按钮语义、溢出操作键盘交互及浏览器证据；严格保持 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件和 Impeccable 整库审查 → Vue3 Element Plus 替换的既定顺序。
- 改动文件：
  - `linkx-fe/src/components/LxActionButtons/index.vue`、`types.ts`
  - `linkx-fe/docs/components/lxactionbuttons.md`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-action-buttons.test.ts`、`tests/e2e/lx-action-buttons-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`、`MIGRATION-MATRIX.md`
  - `doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：把行内链接改为原生按钮，添加 `disabled` 和稳定 `key` 类型；“更多”现在点击展开，可由 Tab/Enter/Space 操作，Escape 关闭并恢复焦点，焦点移出或点击外部时收起；自定义 `moreText` 用于可见按钮和辅助名称。窄屏点按目标至少 44px，溢出列表受视口宽度约束并允许长文案换行，减少动效设置会停用过渡。
- Impeccable：按局部 harden 流程核对现有设计；代码 detector 结果已复核为 `[]`。这不代表 UI-11 整库组件/动效审查已完成。
- 验证：`tests/unit/lx-action-buttons.test.ts` 3/3；`tests/e2e/lx-action-buttons-docs.spec.ts` 3/3，覆盖原始 action 事件、hidden/disabled、键盘展开、Escape 焦点恢复、外部点击/焦点移出收起、375px 44×44px 点按/菜单边界、HUD 深色及减少动效。Vue3 与 lx-ui 类型检查、定向 ESLint、组件/测试/API 页 Prettier 检查、lx-ui 构建和文档构建通过；既有的大块 Markdown 文件全文件 Prettier 检查在暂存基线中也失败，未对整篇重排。构建仍有已记录的大 chunk 提示。Demo 使用本地静态数据，不请求后端。
- 未完成/边界：Vue3 约 29 处 `ActionButtons` 仍由宿主组件实现；`buttons` 与预设 `actions`、逐项 `onClick`、Element Plus 图标到 `LxIcon` 映射、`gap`、disabled 及权限语义须在后续适配中逐项保留。本轮没有修改宿主页面、Element Plus 导入或权限流程。
- 下一步：继续补 `LxMetricCard`、`LxAuthImg` 及其余 Vue3 实际替换候选的契约、Demo 与行为/浏览器证据；候选闭环后先进行 Impeccable 整库审查、处理建议并复验，之后才能开始 Vue3 组件替换。全量 Vue3 替换后再做整站审查。

## [2026-09-27] UI-02/UI-03/UI-10 / LxMetricCard 设计与宿主兼容验收

- 目标：对照 `design/指标卡 MetricCard/` 完成 lx-ui 组件契约和独立验收，保留 Vue3 宿主旧接口；遵守基础控件/动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与 Impeccable → Vue3 Element Plus 替换顺序。
- 改动文件：
  - `linkx-fe/src/components/LxMetricCard/index.vue`、`types.ts`、`demo/basic.vue`、`src/index.ts`
  - `linkx-fe/docs/components/lxmetriccard.md`、`docs/components/new-components.md`、`.vitepress/config.ts`、`docs/ROADMAP.md`、`docs/DELIVERY-CHECK.md`
  - `other-admin/admin-vue3/tests/unit/lx-metric-card.test.ts`、`tests/e2e/lx-metric-card-docs.spec.ts`
  - `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、`MIGRATION-BACKLOG.md`
  - `doc/lx-ui/COMPONENT-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md`、`PROJECT-DELIVERY-PLAN.md`、`PROJECT-MAP.md`、`PROJECT-HANDOFF.md`
- 完成内容：按设计稿补 `title` / `status` / `badgeText` / 进度标签与格式化进度值；保留 lx-ui `label` / `badge` 与 Vue3 宿主 `valueType` / `footer` 及 `title`、`value`、`footer`、`extra` 插槽。显式 `status` 优先于旧 `valueType`，标题和角标属性/插槽的优先级写入 API 文档。趋势方向改用 LxIcon `arrow-up` / `arrow-down`，趋势状态语义色保持高对比；进度值限制在 0–100，提供 `aria-label` 和 `aria-valuetext`，RTL 下从右侧展开。
- Impeccable 定向检查：首轮发现普通小字沿用 secondary token 对比度仅 3.24:1、浅色 warning 数值不足大号文字 3:1，且进度条过渡 `width` 会触发布局。小字改用高对比正文令牌，趋势文字保留状态语义色并在浅色及 HUD 主题验证 ≥4.5:1；浅色 warning 数值调深、HUD 沿用主题令牌；进度填充改用 transform 缩放固定轨道，并尊重减少动效。桌面浅色及 320px HUD 截图已检查；本轮 detector 返回 `[]`。此为 MetricCard 定向复核，不代表 UI-11 整库审查完成。
- 验证：lx-ui `vue-tsc --noEmit`、Vue3 `vue-tsc --noEmit` 均通过；MetricCard 单测 6/6、文档 Playwright 2/2。浏览器用例验证旧 API 展示、进度读屏名称/值、三种趋势语义图标、浅色和 HUD 主题正文/趋势文字 ≥4.5:1、大号值 ≥3:1、320px 无横向溢出、超长标题换行及减少动效时关闭过渡。lx-ui 构建通过（134 modules），VitePress 文档构建通过；保留既有大 chunk 警告。Prettier 定向写入与 `--check` 通过，测试文件 ESLint 通过；lx-ui 无独立 ESLint 配置，Vue3 ESLint 忽略仓库外的 `linkx-fe` 文件。示例为静态数据，没有真实接口请求。
- 未完成/边界：Vue3 `ClientDetailDrawer.vue` 仍有 6 个宿主 `<MetricCard>`，尚未替换为 `LxMetricCard`，须在 UI-04 对照旧 `valueType`、插槽和抽屉组合回归。UI-11 整库审查、Vue3 组件替换及 UI-12 全站审查均未完成。
- 下一步：继续 `LxAuthImg` 和其余实际宿主替换候选；候选库级契约、Demo 和行为/浏览器证据闭环后，执行完整 Impeccable 组件/动效审查并吸收建议、复验，再开始 Vue3 Element Plus 替换。Vue3 全量替换稳定后另做整站审查。

## [2026-09-27] UI-10 / LxMetricCard 趋势动态图标与对比度复验

- 目标：复验趋势语义色调整，并确保设计资产中的动态图标真正用于指标卡；继续遵守 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及整库 Impeccable → Vue3 Element Plus 替换的顺序。
- 改动：MetricCard 趋势方向由 Unicode 箭头改为库内 `LxIcon` `arrow-up` / `arrow-down`；新增状态映射单测和文档浏览器断言，减少动效时同时检查图标过渡已关闭。同步 API、组件设计规格、路线图、交付核查、项目地图和总计划。
- Impeccable 定向复核：修正后的 detector 对组件与 Demo 返回 `[]`；320px HUD 实际浏览器截图无横向溢出，标题、状态色和指标布局正常。浅色/HUD 趋势文字对比度均由 Playwright 检查达到 4.5:1，warning 大号值达到 3:1。
- 验证：MetricCard 单测 6/6、文档 Playwright 2/2；lx-ui 和 Vue3 `vue-tsc --noEmit`、lx-ui 构建（134 modules）、VitePress 文档构建、定向 ESLint/Prettier、`git diff --check` 均通过。文档构建有既有 500 kB chunk 警告；示例为静态数据，不请求后端。
- 未完成/边界：Vue3 详情抽屉 6 处旧 `MetricCard` 尚未替换；此为单组件定向检查，不代表 UI-11 整库 Impeccable 审查完成。Vue3 批量 Element Plus 替换仍未开始。
- 下一步：继续补齐 `LxAuthImg` 和其他实际宿主候选的 API/Demo、行为和浏览器证据；全部闭环后开展 Impeccable 整库审查、落实建议并复验，再进入 Vue3 替换。权限中心、文本/字段权限与页面引导仍延期；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03/UI-10 / LxAuthImg 台账与验收复核

- 目标：将 `LxAuthImg` 库级交付、文档与浏览器证据同步到计划台账；继续遵守 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及完整 Impeccable 审查 → Vue3 Element Plus 替换的顺序。
- 文档改动：修正 UI-03 中 `LxMetricCard` 单测数为 6；将 `LxAuthImg` 的独立文档、6 项单测和 3 项文档 Playwright 纳入 UI-02/UI-03；补齐 lx-ui 交付核查的 MetricCard/AuthImg 专项证据概览；Vue3 单测基线更新为 29 个文件、142 项。
- 验证：Vue3 全量 Vitest 29/29 文件、142/142 项通过；AuthImg 文档 Playwright 3/3；Vue3 与 lx-ui 类型检查通过；lx-ui 构建通过（134 modules）；VitePress 文档构建通过但保留既有大 chunk 警告；定向 ESLint 通过；AuthImg 组件与 Demo 的 Impeccable detector 返回 `[]`。本轮未改 UI 代码，因此没有运行代码格式化。
- 格式现状：`linkx-fe/docs/DELIVERY-CHECK.md` 的 Prettier 检查通过；`doc/PROJECT-DELIVERY-PLAN.md` 与 `doc/PROJECT-HANDOFF.md` 在本轮和暂存版本检查时均未通过全文件 Prettier，且 `git diff --check` 检出既有 Markdown 硬换行尾空格。没有对两份含大量既有改动的长文档做全文件重排。
- 未完成/边界：detector 为空只说明 AuthImg 本轮静态检查未报项，不等于 UI-11 整库 Impeccable 审查。Vue3 鉴权适配器、详情抽屉与其他候选尚未替换；真实鉴权后端联调未执行。UI-10 其余候选、UI-11 整库审查、UI-04 替换及 UI-12 整站审查仍未完成；新增权限中心、文本/字段权限和引导页继续延期。
- 下一步：核对 UI-10/迁移矩阵中仍未完成库级证据的实际宿主候选，逐个补设计映射、API/Demo、行为测试与浏览器验收；完成后先做 Impeccable 组件/动效整库审查、吸收建议并复验，再开始 Vue3 Element Plus 组件替换。业务 API 保持 `.then().catch().finally()`。

## [2026-09-27] UI-02/UI-03/UI-10 / SectionTitle 补验与 Impeccable 预检建议吸收

- 目标：按已确认顺序维护组件库验收证据：`design/` 基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件与 Impeccable 整库审查 → Vue3 Element Plus 替换。
- 完成内容：复验 `LxSectionTitle` 的字号、三种标题变体、`tag`/`tagType` 和 Vue3 旧适配器兼容。图标 hover/focus 改用自然减速曲线，warning/email 保留短时微动效；上传进度填充改用固定轨道上的 `transform`，并在 `prefers-reduced-motion` 下关闭过渡。
- 文档同步：更新 lx-ui 路线图、交付核查、SectionTitle/LxIcon/LxUpload API 文档、Vue3 组件替换矩阵、迁移 Backlog、项目地图、本计划和本交接日志；UI-11 保持进行中，正式整库审查仍等待 UI-10 组件闭环。
- Impeccable detector 预检：首轮发现 LxIcon 弹性曲线、LxUpload 进度 `width` 过渡及 LxSidebar/LxSplitLayout 两处宽度布局过渡。已按建议修改图标 easing 和上传进度实现；复扫只剩 Sidebar/SplitLayout 两项。它们是否保留需结合各自真实布局交互和减少动效检查，在正式整库审查时处理；本次不是 UI-11 全库结论。
- 验证：SectionTitle 单测 13/13、文档 Playwright 1/1（含截图与 320/375px 长标题检查）；LxIcon 单测 5/5，桌面和 Pixel 7 浏览器各 1/1；LxUpload 单测 4/4、Chromium 文档 Playwright 3/3（进度 transform 与减少动效）；Vue3 类型检查、相关 E2E ESLint/Prettier、lx-ui 类型检查、134 modules 构建及 VitePress 文档构建通过。文档构建保留既有大 chunk 提示，pnpm 保留现有 `onlyBuiltDependencies` 字段告警。`git diff --check` 通过；截图已在浏览器查看 SectionTitle 的 320px 布局。
- 未完成/边界：其他实际替换候选仍有库级 Demo/状态/键盘/响应式证据待闭环；Sidebar/SplitLayout 布局动画仍待正式审查。此次没有开始 Vue3 Element Plus 批量替换，也没有执行全站 Impeccable；权限中心、文本/字段权限和引导页继续延期。
- 下一步：继续 UI-10 尚未闭环的 lx-ui 候选；达到门槛后完整运行 Impeccable 审查、吸收建议并复验，再进入 Vue3 替换。Vue3 全量替换完成后再做 UI-12 整站审查；业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-27] UI-11 / LxEmpty Impeccable 使用校准与定向复验

- 目标：确认静态 detector `[]` 是否被正确解释，并完成 `LxEmpty` Demo 修复与浏览器复验；完整组件库审查仍依赖 UI-10 所有组件闭环。
- 改动文件：
  - `linkx-fe/src/components/LxEmpty/demo/basic.vue`
  - `linkx-fe/docs/components/lxempty.md`
  - `other-admin/admin-vue3/tests/e2e/lx-empty-docs.spec.ts`
  - `AGENTS.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`doc/PROJECT-HANDOFF.md`
- 完成内容：主按钮前景使用 `--lx-color-on-primary`；“新建映射”改为添加可见的本地记录，并可恢复初始空态；无匹配结果可清除筛选并重新应用。状态变更后将键盘焦点交给结果列表，返回时恢复到对应操作按钮。中文组件文档同步说明创建结果和双向恢复示例。
- Impeccable 评估：独立设计评估为 34/40（10 项启发式均适用，0 项明确 P1/P2）；修复前评分为 28/40，发现按钮对比度、无真实创建结果及单向筛选三个问题，本轮全部修复。当前源码 detector 对 `index.vue` 与 Demo 均返回 `[]`，仅表示静态规则零命中。隔离 detector Agent 的 Chromium/Edge 回退 overlay 与主会话 Playwright 复核一致：亮色 3 项，HUD 6 项。3 项重复页面壳命中分别是隐藏的 VitePress 复制按钮、VitePress 文档容器的列高启发式以及 Element Plus 全局折叠过渡；HUD 额外 3 项落在同一个 LxIcon 搜索 SVG 的 path 上，命中青色深底规则。项目 `theme-hud.css` 明确将 HUD 主色设为 sky/cyan，该发现是有设计来源的令牌用法而非组件误配，保留并记录；本轮未发现实际组件低对比度项。隔离设计 Agent 以 Playwright 截图加源码完成评估；它的子会话没有浏览器，交互焦点改由主会话 Playwright E2E 实测。
- 验证：`tests/e2e/lx-empty-docs.spec.ts` 1/1；覆盖浅色和 HUD 正文/按钮对比度、创建和恢复、筛选往返、列表/按钮焦点、44px 操作区、375/320px 无横向溢出与减少动效。Vue3 定向 ESLint、Prettier 检查通过；lx-ui `vue-tsc --noEmit`、134 modules 构建、VitePress 文档构建通过。文档构建仍提示已有大 chunk；pnpm 提示 `package.json` 内 `onlyBuiltDependencies` 字段位置将被忽略。局部视觉截图和 overlay 截图在 `other-admin/admin-vue3/test-results/`，本地文档预览仍为 `http://127.0.0.1:4174/components/lxempty.html`，Impeccable helper 已停止。
- 未完成/边界：Vue3 15 处 `el-empty` 宿主用法未替换；UI-10 仍有组件待验收，UI-11 的 LxIcon/LxSidebar/LxSplitLayout 等整库组件与动效审查仍未完成。此次只完成 LxEmpty 定向复查，不代表整库或 Vue3 全站审查；权限中心、文本/字段权限和引导页继续延期。
- 下一步：继续按 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 组件 → Impeccable 整库审查及复验 → Vue3 Element Plus 替换推进；替换完成后再做 UI-12 整站审查。业务 API 调用继续保持 `.then().catch().finally()`。

## [2026-09-27] UI-11 / Impeccable Critique 流程核验与状态更正

- 目标：核实 `detect.mjs` 多次返回 `[]` 是否代表 Impeccable 审查通过，并按 skill 规范纠正计划台账。
- 核验依据：已安装 Impeccable `reference/critique.md` 明确要求两路隔离评估、可浏览目标各自新建浏览器标签、detector 与浏览器 overlay 证据、完整综合评审，以及将快照写入 `.impeccable/critique` 并记录趋势。`critique-storage.mjs trend "linkx-fe/src/components/LxEmpty/index.vue" 5` 返回空数组，`latest` 无该目标记录。历史 Assessment A 明确使用主会话截图而未在自己的新标签查看；Assessment B 记录 HUD 切换后未单独重跑 detector。
- 结论：此前确实有启发式评分、静态扫描、overlay 和行为测试，但没有完成 Impeccable `critique` 的全部硬性步骤。28/40 与 34/40 保留为阶段性人工评审记录，不作为正式验收；detector `[]` 只表示对应源码扫描零命中。
- 文档改动：更新 `AGENTS.md` 的正式 Critique 门槛、`doc/PROJECT-DELIVERY-PLAN.md` 的 UI-11 顺序/状态、`doc/PROJECT-MAP.md` 的 LxEmpty 状态及 `linkx-fe/docs/DELIVERY-CHECK.md` 的 LxEmpty 说明；正式评审未闭环，不推进 UI-11 完成状态，也不改变 UI-10 组件完成后再 Vue3 替换的既定次序。
- 验证：`critique-storage.mjs trend` 确认当前无快照；`latest` 确认无目标记录。文档修改后 `git diff --check` 通过；Prettier 检查中 `AGENTS.md` 与 `DELIVERY-CHECK.md` 通过，计划和交接长文档仍有既有全文件格式差异，未作整篇重排。本次只更正文档和协作规则，没有修改 UI，因此未运行 detector 或浏览器测试。
- 后续正式评审：待 UI-10 组件闭环后，按 Impeccable `critique.md` 为设计评估与 detector/浏览器证据分别安排隔离评估；二者各自开新标签检查，覆盖所有实际使用主题/状态，提交含启发式评分、优先问题、误报核验的完整报告，并保存快照/趋势。任何条件不可用时标为阶段性/降级，不以 `[]` 代替审查。

## [2026-09-28] DEV-05 / 全菜单 Mock 复验交接与 UI-11 Impeccable 扫描诊断

- 目标：补齐全菜单 Mock E2E 的交接记录，并核实 Impeccable 经常返回 `[]` 是扫描错误还是正确的静态结果。
- 全菜单 Mock 复验：`pnpm test:e2e:preview --reporter=line` 最终 2/2 通过，首页、群组标签、北向页面可挂载，预览菜单共 10 组/32 个动态入口与静态首页，共 33 个入口；未配置 Mock 的 API 返回 501。首次冷启动时首页导航超时，Chromium 手动复现正常，完整重跑通过，根因未确认，作为稳定性观察项保留。Mock 服务继续运行于 `http://127.0.0.1:30847/h5/GroupTags`。
- Impeccable 诊断：直接执行 skill `detect.mjs --json` 扫描 `LxEmpty/index.vue` 和 `LxIcon/index.vue` 均输出 `[]`、退出码 0，说明这两个源码目标没有命中当前静态规则。2026-09-28 另复核 `linkx-fe/src/components/LxSidebar` 同为 `[]`、退出码 0；对本地 GroupTags URL 使用同一 CLI 时，stderr 报 `Puppeteer is required for URL scanning`、退出码为 1，但 stdout 仍输出 `[]`，且 `critique-storage trend` 对 Sidebar 返回空数组、没有正式快照。URL 结果是扫描失败，不能记录为零命中。此前通过 skill `live-server.mjs --background` 在 VitePress 新标签实际注入 `/detect.js` 成功，浏览器控制台报告 3 条 anti-pattern；页面标注涉及 Inter 字体占比、height/padding 过渡、首屏单栏及代码区透明度提示，需按实际目标核对文档壳和代码示例，不能把 overlay 数量直接当成组件缺陷。诊断标签和临时文档服务已关闭，Impeccable helper 已停止。
- 本轮复测：`context.mjs --target linkx-fe/src/components/LxIcon/index.vue` 识别到目标源码，但报告本会话没有自动 detector hook，要求 UI 完成后手动扫描。源码 CLI 输出 `[]`、退出码 0；把当前图标文档 URL 直接传给 CLI 后，stderr 报 Puppeteer 缺失、退出码 1，stdout 仍是 `[]`。该目标 `critique-storage trend` 仍为空；本地 `127.0.0.1:4174/components/lxicons.html` 当前拒绝连接，因此本轮没有运行浏览器 overlay 或正式 Critique，也没有生成评分/快照。
- 结论与规则：此前若只看 stdout 的 `[]`，确实存在误判。今后必须同时核对 JSON、stderr、退出码；源码扫描与运行时浏览器 overlay 分开记录。URL CLI 缺 Puppeteer 时按失败处理，并在浏览器自动化可用时走 skill 的 overlay 注入路径；overlay 逐条核对命中后再综合，不以静态扫描、阶段性评分或构建结果替代正式 Critique。
- 文档同步：更新 `AGENTS.md`、总交付计划、项目地图、lx-ui 路线图和交付核查；将 LxEmpty 的 28/40、34/40 及 LxDescriptions 的 19/20 明确标为阶段性证据。UI-11 仍等待 UI-10 组件闭环后按 skill 完成双路隔离评审、主题/状态浏览器证据、综合报告及 `.impeccable/critique` 快照/趋势。
- 本步边界：本次是 detector 使用路径诊断，不是正式 Impeccable Critique；未生成评分或快照，也未调整组件代码。Vue3 Element Plus 替换仍按既定顺序等待 UI-10/UI-11；权限中心、文本/字段权限及引导页仍延期。
- 下一步：继续补齐 UI-10 的库级组件证据；正式评审时为设计评估和 detector/浏览器证据安排两个隔离评估，各自新建浏览器标签，按实际主题/状态注入并复查，写入报告和快照后修复、有限复验；再推进 Vue3 组件替换。业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-28] UI-10 / LxSidebar 交互与组件文档验收

- 目标：完成 LxSidebar 交互补强并以实际文档浏览器验证 expanded/rail 与移动抽屉行为；Vue3 宿主迁移仍受 UI-10/UI-11 顺序约束。
- 完成内容：分组按钮提供 `aria-expanded` 和键盘切换；直达项/二级项每次只触发一次 `select`，无路径项使用按钮；rail 子项浮层可键盘打开、Escape 关闭并还焦点；移动端抽屉提供对话框语义、焦点进入/循环/返回，支持 Escape、遮罩和菜单选择关闭；侧栏动效尊重减少动效设置。Demo 展示选择次数、移动入口和 HUD 主题，中文 API 文档同步更新。
- 验证：`tests/e2e/lx-sidebar-docs.spec.ts` Chromium 2/2；组件库 `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs` 通过，文档构建有既有大 chunk 提示；Vue3 ESLint 对 E2E 文件通过，Vue3 Prettier 对本步变更组件、Demo、文档和测试文件 `--check` 通过。实际打开 VitePress 页面并检查 expanded 示例渲染，375px 移动抽屉交互由 E2E 实测。
- 未完成/边界：这是 LxSidebar 定向行为和文档验收，不是 UI-11 正式视觉/动效 Critique；静态 `detect.mjs` 的 `[]` 不作为通过。UI-10 仍有其他高频组件待闭环，Vue3 当前侧栏仍使用权限路由驱动的 Element Plus `el-menu`/`SidebarItem`，需在后续 UI-04 保留菜单搜索、“全部菜单”目录、权限和路由激活语义后替换；新权限中心、文本/字段权限及引导页继续延期。
- 下一步：继续补齐 UI-10 其余待替换组件的 API/Demo、行为与浏览器证据；UI-10 闭环后执行正式 Impeccable 双路组件/动效审查及复验，再进入 Vue3 页面替换。Mock 预览服务运行状态按实时端口和浏览器页面核验，不沿用旧交接状态推断。

## [2026-09-28] DEV-07 / 全菜单 Mock 稳定截图与服务复验

- 目标：确认全菜单 Mock 仍可本地查看，并留存菜单目录与首屏样例的稳定画面，供后续继续验收。
- 运行状态：`127.0.0.1:30847` 由 `vite --mode mock-preview --host 127.0.0.1 --strictPort` 提供；本轮确认端口监听、浏览器页面可访问，数据来自本地内存 Mock，未知接口返回 501，不代理真实后端。服务保持运行，入口为 `http://127.0.0.1:30847/h5/GroupTags`。
- 完成内容：浏览器首屏显示 5 条群组标签样例；全菜单弹窗显示 33 项并以内部滚动呈现全部目录。稳定截图等待 280ms 过渡结束后生成于 `other-admin/admin-vue3/test-results/mock-preview-all-menus.png`。临时截图脚本复用项目指定的系统 Chrome，截图完成后已清理。
- 验证：`pnpm test:e2e:preview --reporter=line` 本轮 2/2 通过；截图脚本断言全菜单目录恰有 33 条链接。全量入口样例、目录筛选、未知接口、北向 CRUD、归档旧地址和 390/320px 布局均由专项预览 E2E 覆盖。`4174` 文档预览端口当前未监听，与 `30847` Mock 预览相互独立。
- 未完成/边界：此项只证明 33 个入口首屏与全菜单目录可预览，不代表各业务深层操作、完整权限组合或真实后端联调完成；冷启动超时原因仍待观察。
- 文档同步：更新总交付计划 DEV-06 证据、项目地图 Mock 预览入口、迁移 Backlog 与迁移矩阵，并更新本交接记录。只生成截图产物，未改业务代码。
- 下一步：保持 Mock 服务运行，继续按 `design/` 基础控件与动态图标 → `LxDynamicForm` → 其余 lx-ui 候选及正式 Impeccable 审查 → Vue3 Element Plus 替换顺序推进。

## [2026-09-28] UI-10 / LxSplitLayout 交互闭环

- 目标：按 `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` 完成分栏布局独立文档、键盘/鼠标调整、折叠和窄屏回归；保持 UI-10 → UI-11 → Vue3 替换的既定顺序。
- 改动：新增 `linkx-fe/docs/components/lxsplitlayout.md`、状态 Demo 和 VitePress 导航；修复桌面折叠时主区被网格自动放到下一行；调整上限测量以扣除真实分隔条、控制按钮和间距；零宽 DOM 回退到受控宽度；容器收窄触发自动限宽时发出 `resize` 同步宿主；移动端纵向布局不覆盖宿主宽度。
- 验证：`tests/unit/lx-split-layout.test.ts` 3/3；`tests/e2e/lx-split-layout-docs.spec.ts` 3/3，覆盖 1920px 键盘/拖动、桌面折叠同行、375px 表格局部滚动和 44px 按钮、HUD 深色及减少动效。Vue3 `vue-tsc --noEmit`、定向 ESLint/Prettier、lx-ui `pnpm typecheck`、134 模块库构建及 VitePress 文档构建通过；VitePress 有既有大 chunk 警告。
- 本地预览：VitePress 服务保持运行于 `http://127.0.0.1:4174/components/lxsplitlayout`，已在浏览器打开并确认页面标题；全菜单业务 Mock 服务仍在 `http://127.0.0.1:30847/h5/GroupTags`，本轮 HTTP 200。
- Impeccable：本步未执行 detector 或正式 Critique；库组件仍在 UI-10 阶段，UI-11 要在候选组件闭环后完成两路隔离评审、各自新标签、实际主题/状态 overlay、综合报告和快照/趋势。源码扫描 `[]` 仅是静态规则零命中，URL 扫描若 stderr 或退出码失败必须记录为失败，不能拿 stdout `[]` 代表通过；相关流程诊断见本文件 DEV-05 记录。
- 未完成/边界：Vue3 业务树/表页面尚未接入 `LxSplitLayout`；单独组件 Demo 通过不代表宿主业务迁移完成，真实后端不在本步范围。
- 文档同步：更新总计划、项目地图、lx-ui 路线图/交付核查、Vue3 迁移 Backlog/矩阵及本交接记录；`AGENTS.md` 已保留 detector JSON/stderr/退出码和正式 Critique 的强制标准。
- 下一步：继续 UI-10 的其余候选；UI-10 完成后正式执行 UI-11 并按建议有界修复复验，之后进入 Vue3 Element Plus 替换。Mock 业务 API 仍使用 `.then().catch().finally()`。

## [2026-09-28] UI-11 / Impeccable `[]` 与当前浏览器能力复核

- 目标：回应对 detector 多次输出 `[]` 的疑虑，区分静态零命中、浏览器 overlay 和正式 Critique。
- 静态扫描：按 skill 的 `detect.mjs --json` 扫描 `linkx-fe/src/components/LxIcon/index.vue` 与图标定义文件，stdout 为 `[]`、退出码 0 且无错误输出；这只表示该次静态规则没有命中，不评价视觉设计质量。
- 浏览器复核：在新标签打开 `http://127.0.0.1:4174/components/lxicons.html`，页面当前可访问并正常渲染。可用 CUA 页面接口支持可访问树和截图，但页面脚本执行接口是只读，不能设置标题或注入 `/detect.js`；依照 skill 的不可变更 fallback，本轮未启动 overlay helper、未宣称 overlay 已运行，也未将扫描结果写成视觉发现。
- 正式审查状态：`.impeccable/critique` 目录当前不存在；本轮没有两路隔离评估、完整 10 项启发式报告、主题/状态 overlay 或快照/趋势，因此不构成正式 Impeccable Critique。之前记录的源码 `[]`、阶段性评分与定向浏览器验收均保持各自证据边界。
- 结论：用户的疑虑成立在“把 `[]` 当整体验收”这一用法上；`[]` 本身并非异常。本轮 `LxIcon` 源码扫描是有效的静态零命中，当前浏览器 overlay 则因接口只读而未执行；正式 UI-11 仍等待 UI-10 闭环及满足隔离评估、浏览器证据与快照要求。
- 下一步：正式 Critique 中继续分别记录 detector JSON、stderr、退出码与浏览器能力；按 skill 创建两路隔离评估和各自的新标签。若当时不能注入 overlay，明确写 fallback 并按 skill 降级说明，不用静态 `[]` 补足缺失证据。

## [2026-09-28] UI-10 / LxDutyCalendar 库组件闭环

- 目标：完成 lx-ui 日历组件的文档、Demo、无障碍和响应式交互证据；继续保持 UI-10 完成后做 Impeccable UI-11、再做 Vue3 替换 UI-04 的顺序。
- 实现：新增独立中文 API/Demo 与文档侧栏入口；加入严格 `YYYY-MM` 解析/无效月份回退、42 格语义网格、方向键/Home/End 跨月焦点保持、日期自包含班次名称、主题化非本月日期和窄屏 44×44px 月份导航。Demo 只用内存样例，状态由宿主示例包装，不发网络请求，也不扩展业务 props。
- 测试：`tests/unit/lx-duty-calendar.test.ts` 8/8；`tests/e2e/lx-duty-calendar-docs.spec.ts` 3/3（Chromium）。覆盖周起始与闰年月份、非法月份回退、月份年份滚动、日期/班次事件、slot、键盘及跨网格焦点、宿主空/加载/错误恢复/只读、375/320px 内滚动、44px 按钮、浅色/HUD 对比度及减少动效。
- 失败修复：首轮 E2E 发现 Demo 从入口默认导入了组件库插件而非具名组件，导致日历未挂载；改为具名导入 `LxDutyCalendar` 后三项 E2E 通过，防止只凭文档构建误判 Demo 可用。
- 验证：lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、定向 ESLint/Prettier 和 `git diff --check` 通过。文档构建保留既有大 chunk 警告，pnpm 继续提示 `onlyBuiltDependencies` 配置位置已变更。
- Impeccable：本步没有运行 detector 或正式 Critique。用户对多次 `[]` 的疑问是合理的：静态 `[]` 只能表示静态规则零命中；整体验收还需设计评估、实际页面/主题检查、overlay 证据（若注入受限则记 fallback）和 `.impeccable/critique` 快照。该流程诊断及 UI-11 状态见上方 UI-11 记录；本步不把 `[]` 记作通过。
- 未完成/边界：未发现专属 `design/` 日历稿；Vue3 `DutyCalendar.vue` 尚未替换，其 `calendarList`、loading、完整详情 popover、`dutyTypeFilter`、月份查询事件和父级实例方法需在 UI-04 适配并做业务 Mock/E2E。库级日历不代表排班页迁移完成。
- 文档同步：更新 UI-02/03/10 总计划、项目地图、lx-ui 路线图与交付核查、Vue3 Element Plus/lx-ui 迁移矩阵及本交接记录。
- 下一步：继续 UI-10 其余待补组件；UI-10 全部闭环后，按 Impeccable skill 执行两路隔离 Critique、浏览器证据、综合报告和快照，然后开始 Vue3 Element Plus 替换。业务 API 继续使用 `.then().catch().finally()`。

## [2026-09-28] UI-10 / LxPagination API、Demo 与适配器回归

- 目标：补全 LxPagination 的中文 API/Demo 和受控事件回归，并回答静态 detector 多次输出 `[]` 是否代表 Impeccable 验收通过。
- 改动：文档补齐 `layout`、`background`、`update:page-size` 及事件触发顺序；修正 `doc/lx-ui/COMPONENT-SPEC.md` 中旧事件名；Demo 展示默认/自定义布局、背景、自动重置/滚动，分页文案使用 `zh-cn` locale，窄屏分页在可聚焦的局部横向滚动区。工作区原有库组件和 Vue3 `Pagination` 适配器改动已保留，本步新增 5 项库测试、2 项适配器测试和 3 项文档 Playwright。
- 验证：LxPagination 单测 5/5，宿主适配器 2/2，文档 Playwright 3/3；Vue3 全量 Vitest 34 个文件/173 项通过，`vue-tsc --noEmit`、lx-ui 类型检查、134 模块构建、VitePress 文档构建、定向 ESLint/Prettier 通过。文档构建保留既有大 chunk 警告，pnpm 提示 `onlyBuiltDependencies` 字段迁移。
- Impeccable 结论：本次按 skill 对 `LxPagination/index.vue`、Demo、文档 Markdown、Vue3 适配器运行静态 detector，stdout 为 `[]`、stderr 无错误、退出码 0；这是有效静态零命中。静态 `[]` 不代表页面没有视觉问题或 Critique 通过。此前本地 URL 扫描曾因 Puppeteer 缺失退出码 1，stdout 仍输出 `[]`，该情形是扫描失败。当前 `.impeccable/critique` 无正式快照，UI-11 仍待 UI-10 组件闭环；本步没有伪记正式评分或 overlay。
- 浏览器发现：首轮分页下拉呈现英文 `20/page`，与中文宿主不一致；Demo 加入 Element Plus `zh-cn` ConfigProvider 后，E2E 使用实际中文选项复验通过。VitePress 当前全局主题开关用于明暗状态验收。
- 边界：示例只用本地数据，没有业务 API。Vue3 共享适配器现在使用 LxPagination，但仍有 4 处页面直接使用 `el-pagination`；后续 UI-04 需逐页保留加载、空态和滚动语义，不能把组件级通过记作整页迁移或真实联调。
- 文档同步：更新总计划、项目地图、lx-ui 路线图与交付核查、Element Plus/lx-ui 映射矩阵、迁移 Backlog、组件规格和本交接记录。
- 下一步：继续 UI-10 其余组件；全部闭环后用 Impeccable 执行两路隔离评审、实际主题/状态 overlay、完整报告与快照/趋势，再进入 Vue3 Element Plus 替换。

## [2026-09-28] UI-10 / LxPasswordInput 文档与交互闭环、全菜单预览复验

- 目标：补齐密码输入组件资料缺口，并复核隔离 Mock 预览仍覆盖当前全部现役菜单和首屏样例。
- 改动：新增 `linkx-fe/docs/components/lxpasswordinput.md`、`linkx-fe/src/components/LxPasswordInput/demo/basic.vue`、组件站侧栏入口及 `other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts`。既有组件实现和 Vue3 适配器保持原行为；Demo 覆盖明文切换、清空、只读、禁用、事件状态及 focus/blur/select，不访问 API。同步总计划、项目地图、迁移 Backlog、Element Plus/lx-ui 映射、lx-ui 路线图与交付核查。
- 验证：LxPasswordInput 文档 Playwright 3/3；Vue3 Vitest 34 个文件/173 项；全菜单 Mock 预览 2/2。预览验证 10 个分组、32 个动态菜单及首页共 33 个入口的首屏样例、全部菜单目录搜索跳转、未知 Mock API 检测和北向筛选/增改删。lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`、Prettier 检查、`git diff --check` 通过。
- 浏览器复核：VitePress `http://127.0.0.1:4174/components/lxpasswordinput.html` 正常渲染，侧栏可见入口、标签可访问名称、密码值受遮蔽、只读/禁用状态和实例按钮均可见；预览服务 `127.0.0.1:30847` 保持运行。文档构建仍有既有大 chunk 提示，pnpm 提示 `onlyBuiltDependencies` 配置迁移。
- Impeccable：本步未运行 detector 或正式 Critique。整库 UI-11 仍待其余 UI-10 候选闭环后执行双路隔离评审、可用浏览器 overlay、综合报告和快照/趋势；静态 `[]` 不作为视觉验收。Vue3 登录、权限及文件真实后端联调仍按计划保留为未完成或阻塞项。
- 下一步：继续检查 UI-10 尚未闭环的组件/API 文档、Demo 和状态证据；库级 Impeccable 门槛完成后，按映射表逐波替换 Vue3 Element Plus 并回归页面契约。业务 API 保持 `.then().catch().finally()`。

## [2026-09-28] UI-10 / 壳层组件交互修复与 Impeccable 判定校准

- 目标：完成 `LxBreadcrumb`、`LxNavbar`、`LxTabsBar`、`LxPageCard` 文档 Demo 的失败 E2E，并核实 Impeccable 多次输出 `[]` 的原因。
- 发现：源码扫描 `linkx-fe/src/components/LxIcon/index.vue` 返回 `[]`、退出码 0，代表当前静态规则零命中；它不评价真实页面视觉。历史 URL CLI 缺 Puppeteer 的运行退出码为 1，虽然 stdout 仍有 `[]`，应判扫描失败。当前 `.impeccable/critique` 没有正式快照，UI-11 继续未完成；把 `[]` 当成整体 Critique 结论才是误用。
- 修复：通知徽标设置 `pointer-events: none`，避免遮住按钮点击点；面包屑 Demo 链接使用 `.test` 外部地址，避免 VitePress 捕获同源链接；有标题的 `LxPageCard` 使用 `useId()` 建立具名 region；页签测试精确匹配 trigger accessible name。窄屏检查改为度量组件容器，排除文档代码表格对整页 `scrollWidth` 的影响。
- 验证：`tests/e2e/lx-shell-components-docs.spec.ts` 4/4；Vue3 `vue-tsc --noEmit`、定向 ESLint 和 Prettier 检查通过；lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs` 通过。文档构建保留既有大 chunk 提示。
- 文档同步：更新总计划、项目地图、lx-ui 路线图与交付核查、迁移 Backlog 和本交接记录。UI-10 仍有其他候选；UI-11 继续等 UI-10 闭环后按 Impeccable skill 做双路隔离评估、浏览器证据、综合报告和快照。
- 下一步：继续 UI-10 的其余组件状态和浏览器验收；正式 Critique 前分别记录 detector JSON/stderr/退出码与 overlay 注入结果，不以 `[]` 代替视觉判断。之后再开始 Vue3 Element Plus 组件替换及页面级回归。

## [2026-09-28] UI-11 / LxIcon Impeccable Critique 与 detector 范围核验

- 用户疑虑：反复看到 Impeccable 输出 `[]`，怀疑没有正确使用。
- 结论：疑虑有依据。针对 `LxIcon/index.vue` 的 detector 命令有效退出码 0、输出 `[]`，但只表示该源码目标的静态规则零命中。它不是设计评审，也不是浏览器页面扫描；把它当作整体通过属于误判。
- 方法：按正式 Critique 流程使用两个隔离评估。A 在新标签检查文档页、筛选/无结果和明暗主题；B 对源码运行 CLI detector，并在独立新标签验证动态注入、展示 overlay 和读取实际控制台。主会话再把 overlay 留在可见 `[Human]` 标签供复核。
- 证据：静态源码 `[]`/exit 0；浏览器页标题报 3 条、细项 4 条（`buried-raster`、`overused-font`、`layout-transition`、`first-viewport-column-overflow`），主要命中 VitePress 文档壳层/代码区，不直接归因于 LxIcon 图形实现。标题计数差异保留为 detector 报告问题。Live-server 已停止。
- 设计评审：27/40；主要问题为暗色组标题对比不足、P1/P2 组项目过多且全展开、尺寸规范和设计稿 24px 扩展用法不一致、双侧文档导航挤压正文。完整启发式、persona、认知负荷与建议已写入 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`；首次趋势只有 27/40。
- 补充动效证据：Critique 之后在可见浏览器抽查 `delete` 图标，悬停实际触发 `lx-icon-delete-shake`；模拟 `prefers-reduced-motion: reduce` 后 computed style 为 animation `none`、transform `none`、transition `0s`，恢复默认后 hover 动效重新生效。键盘 focus、其他代表性图标及动画中途状态仍未验证。
- 未覆盖：LxIcon 单目标 Critique 已完成，整库 UI-11 仍待 UI-10 其他组件闭环；Vue3 替换后仍需另做整站审查。
- 下一步：处理 LxIcon 页面发现并补其他代表性动效浏览器验证；继续其余 lx-ui 候选。组件替换次序保持基础控件与动态图标 → `LxDynamicForm` → 其他 lx-ui 组件及整库审查 → Vue3 Element Plus 替换。

## [2026-09-28] UI-11 / LxIcon 卡片键盘焦点边框对齐

- 目标：修正文档图标卡片外侧蓝色焦点框与卡片边框分离的问题，同时保留清晰键盘焦点。
- 改动：`linkx-fe/docs/components/lxicons.md` 的焦点态改为卡片自身 2px 主色边框，移除额外 outline；固定 `box-sizing: border-box` 并限制过渡属性，避免边框状态改变卡片外部尺寸。`tests/e2e/lx-icon-docs.spec.ts` 增加焦点颜色、宽度、外框和前后尺寸断言。
- 验证：Playwright 图标文档用例 1/1 通过，覆盖图标全集、hover/focus 动效、减少动效、焦点边框状态和窄屏；ESLint、Prettier、`git diff --check` 及 VitePress 文档构建通过。手动浏览器确认桌面卡片为 108×84px，320px 视口文档宽度为 320px。构建保留既有大包和 pnpm 配置提示；VitePress 本地预览仍使用 4174 端口。
- 文档同步：更新总计划、项目地图、lx-ui Roadmap/Delivery Check 和本交接记录。Impeccable 静态 `[]` 没有作为视觉验收；以真实焦点状态截图与 E2E 结果记录本次改动。
- 未完成/边界：本次只修复 LxIcon 文档目录的卡片键盘焦点样式，不代表整库 UI-11 Critique 完成；其他代表性图标动画、暗色标题对比、分组浏览及尺寸契约仍待处理。
- 下一步：继续 LxIcon 其余视觉建议与动效覆盖，并推进剩余 UI-10 候选；维持基础控件/动态图标 → `LxDynamicForm` → 其他 lx-ui 组件 → Impeccable 整库审查 → Vue3 Element Plus 替换的顺序。

## [2026-09-28] UI-11 / LxIcon 焦点边框光学对齐复验

- 反馈：上一轮的 2px 蓝色卡片边框虽然没有造成尺寸变化，但视觉上仍与卡片自身的原边界错开。
- 证据：独立浏览器评估检查桌面焦点、hover 和 390px 窄屏；源码显示原边框为 1px，焦点加粗后内缘变化 1px。detector `--scope layout` 对 `lxicons.md` 输出 `[]`、stderr 空、退出码 0；这只表示本次静态规则零命中，不代替视觉检查。
- 修复：焦点态保留 1px 外边框并切换为主题主色，以 1px inset 主色线补足 2px 键盘焦点指标；无外扩 outline，卡片盒尺寸不变。
- 验证：`tests/e2e/lx-icon-docs.spec.ts` Playwright 1/1；该文件 ESLint、Prettier 检查、`git diff --check` 和 VitePress 文档构建通过。系统 Chrome 等待过渡结束后实测桌面卡片 108×84px、390px 视口 108.66×84px、320px 视口 132×84px，三个视口均为 1px 主色边框 + 1px inset 焦点线、无 outline/横向溢出；detector `--scope layout` 对文档源码 stdout `[]`、stderr 空、退出码 0，仅为静态零命中。
- 文档同步：更新交付计划、项目地图、组件交付核查和本交接日志。整库 UI-11 与 UI-12 仍未完成。
- 下一步：继续 LxIcon 主题/分组/尺寸建议和其他 UI-10 组件验收，再依计划完成组件库 Impeccable 审查和 Vue3 页面替换。

## [2026-09-28] UI-11 / LxIcon 焦点边框单线样式复验

- 反馈：此前 1px 边框加 1px inset 主色线仍像双层蓝框，视觉上不够整齐。
- 改动：焦点态只将卡片自己的 1px 边框切换为主题主色，并使用主色浅底；关闭 inset 阴影和 outline，让蓝色边界与卡片真实边界重合。
- 验证：`pnpm test:e2e:icons` 桌面 Chromium 与 Pixel 7 共 2/2 通过；覆盖图标全集、hover/focus 动效、减少动效、焦点边框颜色/宽度、主题浅底、无额外阴影/轮廓、焦点前后尺寸稳定和 320px 横向溢出。浏览器实测 email 图标键盘焦点样式与卡片边界对齐。`pnpm build:docs`、该 E2E 文件 ESLint/Prettier 检查、`git diff --check` 通过；文档构建有既有 chunk >500 kB 和 pnpm 配置提示。Impeccable layout detector 输出 `[]`、stderr 为空、退出码 0，只表示静态规则零命中。
- 文档同步：更新 LxUI Delivery Check、Roadmap、项目计划与本交接记录。
- 未完成：整库 UI-11 Critique、其他代表性图标动效、UI-10 剩余组件候选及 Vue3 替换后 UI-12 仍按既定计划跟踪。

## [2026-09-28] UI-01 / 输入、选择与表单控件焦点边线贴合

- 用户反馈：基础控件键盘聚焦时的外层蓝色边框与输入框/选择框自身边界有间隔，视觉上不齐。
- 修正：按 `design/表单控件八件套/` 的 1px 状态边线与 2px、15% 主色光晕实现输入框、选择框和文本域焦点态。移除控件焦点的默认 outline/offset；错误态仍保留 1px 红色内线，外侧主色光晕表示当前焦点。Element Plus 延后注入的规则由根选择器覆盖，不改变表单值、校验或提交时机。
- 验证：定向 Playwright 3/3 通过，覆盖默认输入/选择/文本域、校验错误后的输入/选择聚焦、焦点尺寸稳定、1440px 桌面双列及 390/320px 单列。ESLint、Prettier 通过。Assessment A 用本机 Chrome 截图检查 1280×900 与 375×844：光晕贴边、红边保留、无控件尺寸变化；assessment 文件见 `.impeccable/critique/.element-bridge-assessment-a-postfix.md`。Assessment B 的 Markdown detector 为 `[]`/stderr 空/exit 0，五个状态成功注入 overlay 并截图；静态结果只代表零规则命中，原始 console 文本未保留。B 报告见 `.impeccable/critique/.element-bridge-assessment-b-postfix.md`。
- Impeccable 复核：合并快照评分 35/40，已写入 `.impeccable/critique/2026-09-28T02-28-51Z__linkx-fe-src-components-lxform-style-css.md`。overlay 对设计令牌主色的 palette 命中属误报；select popup 的“文字遮挡”标签本身覆盖了选项文字，未证实页面遮挡。另记录错误文案 `#c45656` 对白底 4.36:1、placeholder `#c9cdd4` 对白底 1.59:1，需作为后续可访问性事项独立处理，不阻塞本次焦点边线对齐。
- 服务状态：Playwright 临时服务 4176 和 Critique helper 8400 均已停止；用户的 VitePress 预览 4174 保持运行，可查看 `http://127.0.0.1:4174/components/element-bridge.html`。
- 未完成/边界：这是基础控件焦点样式闭环，不代表 Vue3 业务表单替换或整库 UI-11 完成。后续按既定顺序继续 UI-10 候选，再做整库 Impeccable 审查；错误/placeholder 对比度纳入后续可访问性清单。

## [2026-09-28] UI-01 / 复选框焦点外圈与自身边界对齐

- 反馈：复选框焦点外圈仍有视觉问题。
- 调整：保留复选框自身 14px 方框与 1px 状态边线，焦点时在边界外零间隙显示 2px 淡色主色焦点环，不使用偏移 outline 或改变方框尺寸。Demo 增加由子项自动计算的“全选通知渠道”，演示真实半选状态。
- 验证：定向 Playwright 覆盖未选中、已选中、真实半选及 HUD 深色焦点；检查外圈宽度、无 outline、控件尺寸稳定。库构建、文档构建、类型检查及定向 ESLint 已通过；最终测试和格式结果见下方补充。
- 下一步：持续按 UI-10 → UI-11 → UI-04 顺序推进；本修正不关闭整库 Impeccable 审查，也不代表 Vue3 表单宿主已迁移。

## [2026-09-28] UI-01 / 多选下拉焦点外圈复修

- 反馈：用户在浏览器复核时指出多选组件外圈仍有问题。上一版多选聚焦为 1px 内侧主色边线叠加 2px、24% 主色外扩光晕，视觉上仍像两道轮廓。
- 处理：Element Plus 当前版本没有单选/多选模式的独立根状态类，因此两种下拉共用单一 2px `outline`，设置 `outline-offset: -1px` 让焦点线中心与控件边缘重合。焦点时不绘制 box-shadow，也关闭其阴影过渡，避免第二道轮廓和切换残影；错误焦点轮廓为红色。该轮廓不改变边框盒或选择行为；其他输入、数字、日期和文本域维持原有光晕。
- 验证：`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过，覆盖单选/多选、焦点/错误、浅色/HUD、桌面/375px、焦点颜色、轮廓偏移、无 box-shadow、错误态红色及尺寸稳定。`pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs`、定向 Prettier/ESLint 与 `git diff --check` 通过；文档构建保留既有 chunk 体积警告。
- 浏览器：保留预览 `http://127.0.0.1:4174/components/element-bridge.html`。浅色桌面、HUD 桌面、浅色 375px、HUD 错误态 375px 截图及 computed style 记录位于 `.impeccable/critique/evidence-2026-09-28/select-final-*.png`；多选宽度为 287px/301px，高度均 32px；375px 页面 scrollWidth 为 375。
- 文档同步：更新 Element Bridge 状态说明、LxForm 组件交付核查与路线图、项目地图、总计划及交接。Impeccable 修复后双路审查和综合快照完成后，将结果补在本条。
- 范围：仅关闭基础控件桥接的单选/多选焦点边缘对齐问题；不代表 Vue3 业务表单已迁移或整库 UI-11 已完成。

## [2026-09-28] UI-01 / 多选下拉焦点外缘贴边复验

- 用户复核指出：`outline-offset: -1px` 虽然消除了双轮廓，但 2px 焦点线仍跨过控件外缘，整体看起来像额外包了一圈。
- 调整：单选/多选统一将焦点 outline 内收至 `-2px`，让线条外缘贴住控件边界，不改变 32px 高度或选择行为。错误焦点使用 `--lx-color-error-strong`，强化其在浅红色错误底上的可见度。
- 验证：`lx-element-bridge-docs.spec.ts` 1/1 通过，覆盖单选、多选、桌面/375px、浅色/HUD、普通/错误焦点、颜色、轮廓偏移、无阴影、控件尺寸和移动端页面宽度。lx-ui `vue-tsc --noEmit` 与 134 模块 `vite build` 通过；定向 ESLint、Prettier 检查及 `git diff --check` 通过。VitePress 文档构建与本轮浏览器评审尚待完成。
- Impeccable：上一版的两路评审指出多选几何已无分离 halo，但错误态对比度偏弱；本轮 `-2px` 版本已重新启动隔离 A/B 复验。检测器 `[]` 只作为静态零命中记录，不单独判定视觉通过。
- 后续边界：评审还发现错误下拉展开时与提示行约 2px 交叠、错误信息缺少持久 ARIA 关联；这两项记入后续布局与可访问性任务，不混入本次焦点外缘修改。Vue3 表单迁移及整库 UI-11 仍按原计划跟踪。

## [2026-09-28] UI-01 / 多选下拉改为控件自身焦点边线

- 用户复核指出：即使把 `outline` 偏移到 `-2px`，多选焦点外圈仍不顺眼。上一轮 A/B 在各自截图中没有复现双框；该结论不足以推翻用户当前浏览器中的观感反馈。
- 改动：单选和多选下拉聚焦时用单一 2px inset 边线替换组件原有内边线，普通态使用主题主色，错误态使用高对比错误强调色；移除独立 `outline`。该规则沿用控件自身边界/圆角，不参与布局或阴影过渡，32px 高度及选择行为不变。
- 回归：`tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过，覆盖单选/多选、错误/普通、HUD/浅色、桌面/375px、单一 inset 阴影、无 outline 和尺寸稳定。lx-ui `pnpm typecheck`、134 模块构建、VitePress 文档构建、Vue3 定向 ESLint/Prettier 和 `git diff --check` 均通过；文档构建保留既有大 chunk 警告，pnpm 有既有配置迁移提示。
- 浏览器与独立评审：本地预览 `http://127.0.0.1:4174/components/element-bridge.html?focus-check=20260928` 保持运行。A/B 已用最终 inset 样式在浅色/HUD、普通/模拟错误、桌面/375px 八种组合检查；焦点线单一贴边、尺寸稳定，桌面 `287×32px`、375px `301×32px`。A 记录和截图位于 `.impeccable/critique/.element-bridge-assessment-a-inset-border.md` 与 `.impeccable/critique/evidence-2026-09-28/assessment-a-inset-border/`；B 记录位于 `.impeccable/critique/.element-bridge-assessment-b-inset-shadow.md`，detector `[]` 只代表静态规则零命中，八态 overlay 证据位于 `.impeccable/critique/evidence-2026-09-28/assessment-b-inset-shadow/`。
- Impeccable 正式记录：28/40，P0/P1 均为 0；快照 `.impeccable/critique/2026-09-28T08-02-17Z__linkx-fe-src-components-lxform-style-css.md` 已保存，趋势包含旧光晕方案 35/40 与本次 inset 方案 28/40 两项不同范围的评审。评审记录的后续问题为窄屏菜单遮挡字段标签、模拟错误态文字对比度约 3.93:1、选项行高 34px（设计参考 32px）。
- 文档同步：桥接页说明、lx-ui Delivery Check/Roadmap、项目地图、总计划和本交接记录均已更新为控件自身 inset 边线规则及正式评审结果；临时报告草稿已清理。
- 后续项：错误提示文案对比度、展开菜单与错误提示重叠、错误消息持久 ARIA 关联仍未修复；Vue3 表单替换和整库 UI-11 也未因此完成。

## [2026-09-28] UI-01 / 多选下拉外圈按设计稿复修

- 用户复核指出 1px 实体边框方案下多选仍有外圈样式问题。对照 `design/表单控件八件套/code.html` 后确认设计稿聚焦态要求 1px 主色边框及贴边 2px、15% 主色微光；此前实现漏掉了外圈光晕，只有边框变色。
- 调整：单选/多选共享 1px `border-box` 边框与零间隙 2px、15% 外侧光晕；错误态保留红边并显示主色焦点环。共享 `--lx-control-focus-halo-color` 从 24% 调为设计稿中的 15%，输入、日期、文本域和复选框焦点同步回到设计基准。无 `outline`，32px 控件高度及选择行为不变；减少动效由全局 `prefers-reduced-motion` 规则覆盖。
- 浏览器实测：4174 的 Element Bridge 实际多选通过键盘回车展开；计算样式为 `1px solid rgb(0, 96, 169)` + `color(srgb 0 0.376471 0.662745 / 0.15) 0px 0px 0px 2px`，盒尺寸 `319×32px`。Playwright 1/1 通过，覆盖多选键盘展开、单选/多选错误态、HUD 与 375px。后续类型/构建、格式检查及 Impeccable 独立双路复评结果见本条补充。
- 文档同步：Element Bridge 说明、LxForm Delivery Check/Roadmap、Element Plus/LxUI 矩阵、项目地图、总计划与迁移 Backlog 已按设计稿更新。窄屏弹层遮挡标签、错误提示对比度、选项行高和错误消息 `aria-describedby` 仍列入后续问题；Vue3 表单替换和整库 UI-11 未完成。

## [2026-09-28] UI-01 / 多选下拉外圈单边框最终修正

- 用户复核：15% 外扩 halo 在页面中仍像第二道边框，上一轮静态设计稿核对和自动断言不足以代表用户实际观感。
- 样式：单选与多选下拉统一用控件自身 1px `border-box` 边框表达焦点；正常焦点显示主色边框，错误焦点优先显示错误色边框；不叠加外扩 `box-shadow` 或 `outline`。保留 32px 控件高度、标签起点、键盘选择及标签折叠行为。根据用户反馈，有意覆盖设计稿静态 select 样例中的 2px/15% halo；其他输入类控件不变。
- 验证：Element Bridge Playwright 1/1 通过，覆盖键盘展开/关闭、单选/多选、普通/错误、浅色/HUD、桌面/375px、`box-shadow: none`、状态边框颜色和焦点前后尺寸稳定。4174 真实浏览器复核计算样式确认普通焦点为 1px 主色边框、无 shadow；错误焦点切换错误色。桌面控件 `287×32px`，375px 为 `301×32px`，页面横向溢出为 0。
- 构建与代码检查：lx-ui `pnpm typecheck`、`pnpm build`（134 modules）、`pnpm build:docs`，Vue3 定向 Playwright 1/1、E2E 文件 ESLint、修改文件 Prettier 检查、`git diff --check` 通过；文档构建有既有大 chunk 警告。Stylelint 因环境缺少 `postcss-less` 无法运行；lx-ui 自目录也未暴露 stylelint 命令。
- Impeccable 综合评审：Assessment A `/root/select_final_assessment_a` 与 Assessment B `/root/select_final_assessment_b` 隔离执行。评分 29/40（Good），P0/P1 均为 0。detector 对 `linkx-fe/docs/components/element-bridge.md` 输出 `[]`、stderr 空、退出码 0；四个独立 overlay 视图计数：桌面浅色 7、桌面 HUD 175、375px 浅色真实错误 7、375px HUD 模拟错误 173。HUD 命中主要是目标主题调色板，其他命中多属 VitePress 外壳；实际组件附近有效命中是浅色错误文案约 4.4:1。overlay 保存在截图，未显示到用户可见的浏览器标签。
- 评审记录：正式快照 `.impeccable/critique/2026-09-28T10-30-19Z__linkx-fe-docs-components-element-bridge-md.md`，首次趋势为 29/40。A 记录 `.impeccable/critique/.element-bridge-assessment-a-single-border-final.md`，截图目录 `evidence-2026-09-28/assessment-a-single-border-final/`；B 记录 `.impeccable/critique/.element-bridge-assessment-b-single-border-final.md`，20 张截图目录 `evidence-2026-09-28/assessment-b-single-border-final-verified/`。
- 文档：已更新 Element Bridge 组件说明、LxForm 交付核查/路线图、项目地图、总计划、Vue3 迁移矩阵和 Backlog。Impeccable 建议：375px 弹层遮挡字段标签（P2）、浅色错误提示 4.4:1（P2）、选项行高 34px 对照 32px 设计契约（P3）；错误消息持久 ARIA 关联也继续单独跟踪。
- 边界：此项关闭 lx-ui 基础桥接页的下拉外圈问题，不代表 Vue3 业务表单替换或 UI-11 整库审查完成；后续宿主迁移仍需保留原校验与提交契约。

## [2026-09-28] UI-01 / 多选下拉外圈按实览再次收敛

- 用户反馈：15% 主色外扩光晕在实际 Element Bridge 页仍看起来像第二圈，与下拉自身边框观感不协调。
- 修正：单选、多选下拉都只用自身 1px 边框呈现焦点；删除依赖 `:has(.el-tag)` 的多选光晕及 LxForm 错误多选重复阴影。普通焦点切换主色边框，错误焦点保留高对比错误色边框。下拉焦点不再绘制 `box-shadow` 或 `outline`，不改变 32px 高度、标签位置、键盘选择和折叠行为；文本输入、日期、数字、文本域及复选框维持各自规则。
- 验证：`tests/e2e/lx-element-bridge-docs.spec.ts` 1/1 通过，检查真实键盘开合、单选/多选、普通/错误、浅色/HUD、桌面/375px、无额外阴影和尺寸稳定。4174 浏览器实测为 `1px solid rgb(0, 96, 169)`、`box-shadow: none`、`outline: none`，桌面 `319×32px`；lx-ui `pnpm typecheck`、134 模块 `pnpm build`、`pnpm build:docs`、定向 ESLint/Prettier、`git diff --check` 通过。VitePress 构建提示既有大 chunk 警告；Stylelint 未运行（环境无 `postcss-less`）。
- 文档：同步 Element Bridge、LxForm Delivery Check/Roadmap、Vue3 迁移矩阵、项目地图和总计划。
- Impeccable：针对本次用户反馈后的最终样式，A/B 两路隔离浏览器评审正在执行；完成后把完整评审结论、detector 证据、截图及 snapshot/trend 路径补入此记录。
- 边界：该修正只关闭 lx-ui Element Bridge 下拉外圈样式问题，不代表 Vue3 业务表单替换或 UI-11 整库审查完成。375px 弹层遮挡字段标签、错误提示对比度和选项行高仍独立跟踪。

## [2026-09-28] UI-01 / 多选下拉改用控件内部单线

- 用户反馈：上一版真实 1px border 虽无外扩 shadow，仍与输入框的内部边线呈现不一致，页面看起来像多了一层外圈。
- 调整：linkx-fe/src/styles/element-theme.css 与 src/components/LxForm/style.css 将单选/多选选择器统一为 border: 0、1px inset box-shadow；普通、悬停、聚焦和错误态只替换边线 token，移除外扩轮廓，恢复 4px 12px 内容内距。焦点前后均维持 border-box、32px 高度、标签起点和键盘开合。
- 浏览器证据：4174 实测“协同部门”聚焦 wrapper 为 border: 0px none、box-shadow: rgb(0, 96, 169) 0 0 0 1px inset、outline: none、319×32px；展开菜单和两个已选标签可见。
- 自动验证：定向 lx-element-bridge-docs.spec.ts 1 项通过；断言覆盖单选/多选、浅色/HUD、普通/错误、键盘开合、375px、内侧边线及尺寸稳定。因配置启动的 4176 文档服务在测试结束后仍保持复用，未以 Ctrl-C 结果作为测试失败依据。
- 文档同步：Element Bridge 说明、LxForm Delivery Check/Roadmap、Element Plus/lx-ui 矩阵、项目地图、总计划和迁移台账均已改为“控件内部 1px inset 单线”规则。
- Impeccable：两路独立评审正在针对本次最终样式取证；detector JSON、stderr、退出码、overlay、快照和趋势在复评完成后补充。此前 30/40 记录仅对应上一版实体 border，不代表本次结果。
- 边界：该项只关闭基础控件的边线层级问题，不代表 Vue3 业务表单替换或整库 UI-11 完成。

## [2026-09-29] CODE-02 / 请求取消与远程下拉分页修复

- `useFetch`/`useTable`：复核 signal 传递、取消时请求序号失效、`abortPrevious=false` 时全部活动请求取消、取消防抖和重试等待，以及列表只在序号有效的 `onSuccess` 中提交。`tests/unit/use-fetch.test.ts` 9/9 通过。
- `v-loadmore`：重建 `src/directives/loadmore.ts`，通过选择器输入上的 `aria-controls` 找到被 teleport 的 listbox 和滚动容器；监听聚焦/展开后的延迟挂载，更新回调，并在目标切换/卸载时清理滚动监听、observer 和宿主事件。`tests/unit/loadmore.test.ts` 3/3 覆盖延迟 teleport、距底阈值、回调更新、滚动监听及未完成观察时卸载清理。
- 浏览器验收：`tests/e2e/preview.spec.ts` 的轮播文章分页用例以本地 mock-preview 拦截读接口，真实 Element Plus 下拉滚动后请求第 2 页并呈现第 21 篇文章，1/1 通过；不发送后端写请求。其他 `v-loadmore` 宿主尚未逐页做浏览器验收。
- 代码门禁：`pnpm exec vue-tsc --noEmit`、相关文件定向 ESLint 和 Prettier、`git diff --check` 通过。业务 API 调用写法保持 `.then().catch().finally()`。
- Impeccable 规则再确认：任何 detector `[]` 都要检查 JSON、stderr、退出码和目标访问结果；有效 `[]` 只是静态零命中，若没有独立 A/B、浏览器各状态 overlay/截图及 snapshot，仍记为“复验未完成”。
- 下一步：按 GLM 评审台账继续 #8 License、#9 AuthImg、#10 重复提交和 #11 ColForm；保留 #1/#2 与 #3/#4 的后续核验，真实后端未知项不猜测。

## [2026-09-29] UI-01 / Element Bridge 最终样式记录更正

- 前序交接中的“控件内部 inset 边线”只对应历史方案，已被用户实览后的最终单边框样式取代。当前选择器聚焦态使用自身 1px `border-box` 边框，只切换边框色，不使用 `box-shadow` 或 `outline`。
- 最终 Impeccable A/B 快照为 30/40；A/B 独立报告、浏览器截图和 overlay 证据见 `.impeccable/critique/.element-bridge-assessment-a-single-border-final.md`、`.impeccable/critique/.element-bridge-assessment-b-single-border-final.md`、`.impeccable/critique/2026-09-28T11-54-41Z__linkx-fe-docs-components-element-bridge-md.md`。其中 detector `[]` 只记静态零命中，不作为视觉通过的单独依据。

## [2026-09-29] GLM #8 / License 失败不覆盖既有授权

- `refreshLicenseAuthAction` 现在只在 `code === 0` 且状态值有效时生成并持久化新授权；网络异常、业务码失败、无效状态/日期和会话 epoch 变化均不写入缓存，返回当前 store 授权。
- `auth-store.test.ts` 新增失败保留、无效响应保留和有效响应更新覆盖；Vue3 全量单测 36 个文件/186 项通过，`vue-tsc`、定向 ESLint/Prettier、`git diff --check` 通过。`code-reviewer` 复核未发现本次新增问题。
- 本项为状态/错误处理，无视觉改动；Impeccable 不适用，未运行 detector。业务 API 继续使用 Promise 链，未改成 `async/await`。
- 下一步按台账处理 GLM #9 宿主 AuthImg 的失败状态、请求取消/响应归属和对象 URL 回收；UI 相关验证需按 Impeccable 检查，`[]` 不单独构成通过证据。

## [2026-09-29] GLM #9 / AuthImg 失败恢复、竞态与资源生命周期

- 改动：新增 `src/api/authImage.ts`，依 Vue2 规则将 `/static` 映射到 `/api/static`，只允许站内相对路径，Token 仅通过 Authorization header 发送，响应以 Promise 链检查 HTTP 状态并返回 Blob。`AuthImg` 在资源变化/卸载时 abort 请求、用递增序号阻止迟到结果覆盖，并在资源切换、图片解码失败和卸载时回收 ObjectURL；失败占位新增可键盘重试按钮并尊重减少动效。
- 可访问性：10 个宿主调用点补充轮播缩略图、头像、设备/协同/应用图标的 `alt`；Mock E2E 检查键盘重试名称、图片替代文本及载入完成后的 `aria-busy=false`。
- 代码审核：核对 Vue2 `src/components/AuthImg/index.vue` 的网关路径拼接契约、Vue3 Token/header 边界、URL 外站拦截、请求竞态与 ObjectURL 释放，无本次新增的可复现缺陷。真实鉴权服务未联调。
- Impeccable 降级检查：detector 读取 JSON `[]`、stderr 空文件、退出码 0；只代表 AuthImg 源码静态零命中。两个隔离 gpt-6-sol Agent 均因服务端 HTTP 503 未启动；新浏览器标签可正常访问 Mock 页面，但 `document.title` 修改报 getter-only 错误，确认页面桥只读，因此未注入 overlay、无正式 A/B 综合 Critique。之前保存的 375px、加载、失败、减少动效截图保留；旧 `desktop-retry-success.png` 是图片完成 load 前的过渡帧，本轮 E2E 已补等待 `aria-busy=false` 的断言。报告：`.impeccable/critique/authimg-degraded-review-2026-09-29.md`。
- 验证：AuthImg 定向单测 12/12；`tests/e2e/preview.spec.ts --grep AuthImg` 3/3；`vue-tsc --noEmit`、相关文件 ESLint、Prettier 检查通过。Detector `[]` 不视为视觉通过；Impeccable 正式审查仍待后续环境可用时补齐。
- 下一步：按用户要求自动开始 GLM #10，处理权限角色删除、第三方应用删除/编辑、管理员用户删除的重复提交锁，锁定从确认开始并由 `.finally()` 释放。

## [2026-09-29] GLM #10 / 写操作重复提交锁

- 目标范围：角色删除、角色启停与角色保存；第三方应用删除与编辑保存；管理员用户删除与启停。角色、用户删除的锁在确认框打开时建立，取消和 API 请求结束后均恢复；请求进行时相应操作禁用并呈现 loading/`aria-busy`。第三方应用行级删除锁覆盖确认到请求结束，编辑保存有独立提交锁。
- 浏览器回归：`tests/e2e/duplicate-submit.spec.ts` 5/5 通过；覆盖删除确认取消后恢复、请求中重复点击只发一次、角色启停/保存、管理员用户删改、失败重试，以及第三方应用浅色/HUD 桌面/375px 文本对比度和 44×44px 操作目标。四张截图：`.impeccable/critique/duplicate-submit-third-party-light.png`、`duplicate-submit-third-party-hud.png`、`duplicate-submit-third-party-light-375.png`、`duplicate-submit-third-party-hud-375.png`。
- 代码审核：检查行锁归属、确认取消、并发触发、失败后释放和恢复重试，未发现本次新增可复现问题。传输层 `src/utils/http.ts` 已统一显示 HTTP/网络错误；页面空 `.catch()` 同时承接 Element Plus 确认取消，避免重复 Toast。
- 构建与静态检查：`pnpm build`（包含 vue-tsc）通过；定向 ESLint/Prettier 与 `git diff --check` 通过。Rollup 有仓库原有的 sidebar Less 导出告警，不影响构建产物生成。
- Impeccable：目标 detector stdout 为 `[]`、stderr 0 字节、退出码 0，仅证明目标源码静态规则零命中。五次隔离 `gpt-6-sol ultra` 评审尝试因提供方 HTTP 503 无法启动；本地浏览器可访问 Mock 页面，但 CUA DOM evaluate 是只读，未注入 overlay。人工检查的浅色/HUD、桌面/375px 截图不构成正式双路 Critique；无 A/B 报告或 snapshot，状态仍为“视觉 Critique 待补”。完整降级记录：`.impeccable/critique/duplicate-submit-degraded-review-2026-09-29.md`。
- 下一步：自动进入 GLM #11 ColForm 远程人员搜索竞态；Impeccable detector 的 `[]` 不作为视觉通过证据。

## [2026-09-29] GLM #11 / ColForm 远程搜索竞态与分页

- 改动：`queryUserByPage` 接受可选 AbortSignal；ColForm 以递增请求代次拒绝旧结果/旧 `finally`，请求成功后才提交页码，触底分页保留当前关键词并阻止重复请求。新关键词、组织切换、重置、关闭和卸载均取消旧请求；查询组件暴露 `aria-busy` 状态。
- Mock E2E：`tests/e2e/col-form-search-race.spec.ts` 1/1，通过延迟旧关键词响应验证取消/迟到保护、当前搜索 loading 清理、分页第 2 页继续携带同一关键词，且列表没有旧候选。全程只拦截本地 Mock，不发送真实后端请求。
- 代码审核：核对请求代次和 AbortSignal 互补保护、旧 `finally` 归属、pageNum 仅在当前成功响应后推进、触底并发保护与关键词保留，未发现新增可复现问题。
- 静态门禁：`vue-tsc --noEmit`、API/ColForm/E2E 定向 ESLint 与 Prettier 检查、`git diff --check` 通过；业务请求仍使用 `.then().catch().finally()`。
- 下一步：自动开始 GLM #1 lx-ui 全局组件注册，再按评审台账继续 #2。#10 Impeccable 正式 Critique 作为环境恢复后的独立补充项继续跟踪。

#### LxDynamicForm 远程负责人反馈与演示设置修复（2026-09-30）

- 依据 Assessment A/B 的有限修复建议，`linkx-fe/src/components/LxDynamicForm` 新增可选字段级 `feedback`：`status`、`message`、`retry`、`retryLabel`。反馈节点紧邻对应 Lx 控件，错误用 `role="alert"`，并通过稳定 ID 与控件 `aria-describedby` 关联；宿主仍负责请求、取消、loading 和 Promise 链错误处理。
- Demo 的动态候选负责人不再把失败文案同时放在候选设置和 footer；设置区默认关闭且摘要明确列出低频控制项，成功数量仍仅作设置状态，加载/空结果/失败均显示在负责人字段下，失败提供字段内“重试”。表单首屏因此优先呈现可填写任务字段。
- 同步 `LxDynamicFormFieldFeedback` 公共类型导出、中文 API/边界说明、动态表单样式和定向单测；未修改 Vue3 Element Plus 替换顺序，未改变 52 个公开组件“0/52 正式严格关闭”口径。
- 验证待执行：lx-ui `pnpm typecheck`、DynamicForm 单测/文档 Playwright、目标文件 Prettier/ESLint、库构建/文档构建；完成后再按 Impeccable A/B 规则核对 detector JSON、stderr、退出码、浏览器 overlay 与快照。业务 API 请求写法保持 `.then().catch().finally()`。

## [2026-09-30] UI-13 / LxForm 首错焦点修复与当前证据

- 目标：处理 Form 综合 Critique 中复现的 LxForm 提交失败后焦点停在提交按钮问题，并把修复证据写入交接记录。
- 改动：`linkx-fe/src/components/LxForm/index.vue` 在组件挂载后保存真实 `vnode.el` 表单根节点；校验失败继续使用 Promise 链，在当前 tick、requestAnimationFrame 和零延迟队列各尝试一次 `focusFirstInvalidFormField`。未改变业务 API 请求风格，仍由宿主使用 `.then().catch().finally()`。
- 测试：`tests/e2e/lx-form-docs.spec.ts` 新增首错输入聚焦断言；文档 Playwright 3/3 通过；定向 Vitest 5 文件 34/34；lx-ui `vue-tsc --noEmit`；`git diff --check` 通过。
- 浏览器证据：`.impeccable/critique/form-focus-postfix-2026-09-30/browser-evidence.json`，1280px 和 375px 均聚焦“任务名称”错误输入，`aria-invalid=true`，页面无横向溢出；四个静态 detector 目标 JSON 有效 `[]`、stderr 为空、退出码 0。该 `[]` 只说明静态规则零命中，不是视觉 Critique 通过。
- 当前未完成：Form 旧综合报告仍含修复前的对比度/焦点表述，需更新为当前源码证据；Wave 5 A/B 正在收尾；52 个公开组件严格矩阵仍为正式关闭前状态。
- 下一步：先更新 Form 综合报告并收口 Wave 5，再按 `COMPONENT-AUDIT.md` 逐项补设计差异、Demo/API、行为测试、浏览器状态、A/B snapshot 和代码审核，完成后才开始 Vue3 Element Plus 替换。

## [2026-10-02] UI-10 Wave 6 / TreeSelect 与 Cascader 修后交接

- TreeSelect footer 的 `selectedText`、`unselectedText`、`cancelText`、`confirmText` 已本地化，英文默认分别显示 `{count} selected`、`None selected`、`Cancel`、`Confirm`；`selectedText` 支持 `{count}`。保留 footer slot 和多选确认/取消边界。
- Cascader loading 状态优先于 error：并发状态只报告加载；loading 解除后仍有 error 才显示错误、错误 ARIA 和重试。级联 Demo 的当前值改为普通文本，单个 status 只播报简短操作反馈；TreeSelect/Cascader 的 Demo 状态按模式、数据、外观分组。
- 修后验证：TreeSelect/Cascader 单测 17/17，文档 E2E 5/5；lx-ui `pnpm typecheck`、`pnpm build`（195 modules）、`pnpm build:docs`，Vue3 `pnpm exec vue-tsc --noEmit`，目标 Prettier 检查通过。VitePress 有既存 >500kB chunk 警告。Vue3 ESLint 忽略 linkx-fe 外部库文件；linkx-fe 没有独立 ESLint 配置，不能声称该库 ESLint 已通过。
- 前置 Assessment A 为 TreeSelect 33/40、Cascader 32/40；前置 Assessment B 四个 detector 目标均为有效 JSON `[]` / 空 stderr / exit 0，并完成六种 overlay 捕获。空数组仅表示静态规则零命中。前置报告和截图位于 `.impeccable/critique/wave6-current-2026-10-02/`。
- 修后 Assessment A/B 已按 `gpt-6.1-sol` medium 并行重评，输出目录 `.impeccable/critique/wave6-postfix-2026-10-02/`。在报告综合、建议复验和 snapshot/trend 完成前，两组件状态仍为严格 UI-10 审查中；52 组件全库严格矩阵仍为 0/52。
- 当前用户可继续通过 `http://127.0.0.1:4174/components/lxinputnumber.html` 查看原有文档服务；端口 4174 未停止。UI-10 Wave 6 收口后，下一顺序为基础控件严格对照。

## [2026-10-03] Cascader Demo 定位与 Wave 6 证据更正

- 用户询问 LxCascader 是否加入 Demo。确认独立组件页 `linkx-fe/docs/components/lxcascader.md` 内嵌 `src/components/LxCascader/demo/basic.vue`，新增组件总览 `NewComponentsDemo.vue` 也导入并渲染同一 Demo，`new-components.md` 和 VitePress 侧栏均提供入口。4174 文档服务页面可访问；Playwright 复验确认总览内级联 Demo 可见。
- TreeSelect/Cascader 文档 E2E 正确使用 `playwright.lxui.config.ts`（VitePress 4176）运行，8/8 通过。此前误用 Vue3 默认 `playwright.config.ts` 会启动业务宿主并尝试代理 GET 接口；该运行已停止，正确文档测试没有访问业务后端。
- 当前四个 Impeccable detector 目标（两个组件源码、两份 Markdown）均为 JSON `[]`、stderr 空、退出码 0；只代表静态规则零命中。浏览器拒绝当前 overlay 注入预检，旧 overlay 截图早于当前代码/文档修改，因此 Wave 6 正式 Critique 仍未完成，`COMPONENT-AUDIT.md` 严格关闭数更正为 0/52。
- 下一步：按 `COMPONENT-AUDIT.md` 继续基础控件严格设计对照和验收；Wave 6 当前版本 overlay/Critique 证据保留为待补门槛，不得把静态 `[]` 或旧截图写成正式通过。Element Plus 替换顺序不变。

## [2026-10-04] Wave 0 / DatePicker 字段说明隔离修复

- **目标**：修复 Element Plus Fragment 根下日期触发器定位不稳定的问题，避免相邻日期字段互相覆盖 `aria-describedby`。
- **改动文件**：`linkx-fe/src/components/LxDatePicker/index.vue`、`linkx-fe/src/utils/syncAriaDescribedBy.ts`、`other-admin/admin-vue3/tests/unit/lx-date-picker.test.ts`，以及计划、项目地图、迁移台账、组件审计和中文日期组件文档。DynamicForm 定向测试参与本地交叉验证，其既有实现与测试改动不纳入 Wave 0 提交。
- **实现**：使用 Vue 实例 UID 标记日期触发器，Fragment 回退只在当前实例范围查找输入；按输入框同步宿主说明 ID，并移除上次由组件管理的 ID。单值、区间起止输入、相邻单值/区间实例及 DynamicForm 字段反馈均有测试覆盖。
- **代码审核**：独立审核未发现可复现实现缺陷；审核建议直接验证区间两个输入和相邻区间实例，本波已新增该断言。
- **验证**：当前工作区 DatePicker/DynamicForm 定向单测 36/36；lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs`；DatePicker 文档 E2E 1/1；目标 ESLint、Prettier 和 `git diff --check` 通过。文档构建有既有大 chunk 警告。提交仅包含本波 DatePicker 回归；既存 DynamicForm 实现与测试改动不纳入本波提交。
- **浏览器/视觉审查**：文档 E2E 只验证当前组件交互，不是完整主题、窄屏、减少动效或 overlay 审查。本轮没有形成修复后独立 Impeccable A/B、综合报告和 snapshot/trend，继续标记阶段性。
- **未完成与风险**：正式 Impeccable Critique 待补；DynamicForm/Form 不登记视觉验收关闭。真实后端不涉及。
- **本波提交范围与提交号**：Wave 0 日期说明隔离修复、回归测试与本记录列出的计划/台账/API 文档；提交号由最终 Git 提交记录确认。
- **下一步**：进入 Wave 1，按 `design/按钮体系/` 与 `design/表单控件八件套/` 严格复核 Button、ActionButtons、Input、Textarea、InputNumber、PasswordInput；当前正式 Critique 缺口持续跟踪。

## [2026-10-04] Wave 1 / LxPasswordInput 透传属性遮罩修复

- **目标**：防止调用方透传 `type="text"` 覆盖密码输入框的显隐状态，统一剪贴板前端交互说明，并将 P1 修复和验收证据交接给后续波次。
- **改动范围**：`linkx-fe/src/components/LxPasswordInput/index.vue`、`types.ts`、中文组件文档与 lx-ui 交付记录；Vue3 密码框单测和文档 E2E 源码；项目交付计划、波次拆分、项目地图、组件审计及迁移台账；`.impeccable/critique/wave1-final-*`、`wave1-postfix-*` 评估和代码复审记录。
- **完成内容**：组件复制 `$attrs` 后移除 `type`，确保原生输入类型始终受 `showPassword` 状态控制；剪贴板默认允许，显式 `preventClipboard` 只阻止前端事件，不代表服务端凭据安全控制。单测覆盖透传 `type` 下的密码/明文往返、只读组合及已有禁用边界；中文文档注明 `type` 不会透传。
- **代码审核**：修后独立复审批准，未发现 P0–P2；只读与透传 `type` 组合回归已补齐。复审未读取独立 Assessment A/B，也未修改产品源码。
- **验证**：Vue3 密码框 Vitest 7/7；Vue3 `vue-tsc --noEmit`；lx-ui `pnpm typecheck`；`pnpm build`（196 modules）；VitePress `pnpm build:docs`；本波文件 Prettier 检查；Vue3 单测/E2E 源码 ESLint。文档构建有既有 500KB chunk 警告。Vue3 ESLint 对 `linkx-fe` 路径报告超出 base path 并忽略，因此本次没有把 lx-ui 源码记为 ESLint 通过；lx-ui 使用已通过的 Prettier 检查。
- **Impeccable 状态**：Assessment A 最新静态复评暂定 30/40，已核对当前源码与文档；现存截图早于透传过滤实现，不能验证属性覆盖或修复后的交互。Assessment B 六个源码 detector 均为有效 JSON `[]`、stderr 为空、退出码 0，仅说明静态零命中。受浏览器脚本注入策略限制，本轮未运行文档 E2E、overlay、现场截图、综合报告或 snapshot/trend；Wave 1 及 Wave 0 正式视觉 Critique 仍未关闭，不计入 52 项严格关闭数。
- **未完成/风险**：未实测修复后浏览器剪贴板行为和视觉 overlay；真实登录、改密及后端安全联调不在本波范围。文档 E2E 源码已更新，但本轮未运行。
- **本波提交范围与提交号**：实现、回归测试、组件文档先以 `2762816`（`fix(lx-ui): prevent forwarded type from bypassing password mask`）提交。计划、地图、审计、独立评审报告及本记录由后续 `docs(project)` 提交承载；两笔提交一并推送。
- **下一步**：自动继续 Wave 2（选择与日期），优先按 `PROJECT-FOLLOWUP-BREAKDOWN.md` 检查 DatePicker 窄屏区间首屏布局和 Escape 起止端点；UI 实施前遵循 `frontend-ui-ux` 与 Impeccable `distill` skill。正式 overlay 与 snapshot/trend 仍是视觉关闭门槛。

## [2026-10-06] Wave 1 / LxPasswordInput 修后验收与交接

- **修复**：320px 下页内目录锚点跳转后标题不再被移动导航遮挡；VitePress 暗色主题同步作用于 Demo 和输入框表面，同时保留独立 HUD 切换；移动工具栏及展开后的高级设置标签高度统一为 44px。
- **验证**：LxPasswordInput 单测 10/10，文档 E2E 9/9；Vue3 类型检查、定向 ESLint、目标 Prettier、lx-ui 类型检查与 VitePress 文档构建通过。最后一次构建直接调用已安装的 VitePress CLI；pnpm 脚本入口因被忽略的依赖构建脚本触发安装状态检查而退出，CLI 构建本身成功。文档构建保留既有大 chunk 提示。
- **代码审核**：独立复审批准，未发现 P0–P2；复审提出的高级设置标签触控高度不足已修复并由 E2E 覆盖。
- **Impeccable**：双路 Assessment A/B 完成，32/40（Good），P0/P1 为 0。detector 的 JSON `[]`、空 stderr、退出码 0 仅记录静态零命中；浏览器 overlay 11 个节点经归因属于 HUD 调色板规则和 VitePress 文档壳层，没有把命中数当作组件缺陷。注入前后页面宽度增量为 0。最终复验见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`；首次趋势记录为 32/40，snapshot 为 `.impeccable/critique/2026-10-05T19-16-45Z__linkx-fe-src-components-lxpasswordinput-index-vue.md`。
- **未关闭事项**：宿主 `LxForm/LxFormItem` 校验失败集成示例移入 `LxForm/LxDynamicForm` 波次；移动 Props 表扫描成本及共享 VitePress 移动目录 32px 行高作为 P3 继续跟踪。PasswordInput 本次完成修后验收，但这些跨组件/文档待办未完成前，不据此宣称 52 项严格矩阵已关闭。
- **提交范围**：组件、Demo、中文 API 文档、Vue3 单测/E2E 已提交为 `45a6b6f`（`fix(lx-ui): refine password input documentation flow`）；项目计划、地图、交接、迁移台账、组件审计、代码复核、Impeccable 报告/证据和 snapshot 随本波 `docs(project)` 提交。
- **下一步**：按用户确定的顺序先严格复核动态图标，再实现/完善 `LxDynamicForm`，其中加入真实宿主校验失败示例；随后继续基础组件与 Vue3 Element Plus 替换计划。业务 API 调用继续使用 `.then().catch().finally()`，文档与新增注释保持中文。

## [2026-10-06] Wave 3 / LxIcon 严格复核与交接

- **目标**：完成动态图标当前实现和可视目录的正式独立 A/B 复核，吸收有效设计意见，保留 detector 原始结果、浏览器覆盖、代码复审与波次交接。
- **改动文件**：`linkx-fe/src/components/LxIcon/index.vue`、`linkx-fe/src/components/LxSidebar/LxSidebarFooter.vue`、`LxSidebarGroup.vue`、`LxSidebarItem.vue`、`linkx-fe/src/components/LxUpload/index.vue`、`linkx-fe/docs/components/lxicons.md`、`other-admin/admin-vue3/tests/unit/lx-icon.test.ts`、`tests/e2e/lx-icon-docs.spec.ts`；另同步项目计划、项目地图、迁移 Backlog、波次拆分、组件审计、lx-ui Roadmap/Delivery Check、代码复审台账和本交接。
- **完成内容**：`LxIcon.name` 收窄到 `LxIconName`；未知运行时名称回退问号图形并提供访问名称；侧栏菜单在数据边界 resolve 图标名并回退；设置入口改为真实图标键；上传状态图标使用具体名称类型。图标页增加中文语义检索、普通文档流搜索、清除并回焦、P1 计数说明、常规暗色令牌、11px 英文键与强对比空态。
- **验证**：图标单测当前复跑 7/7；文档 Playwright 当前配置 2/2（单 Chromium 项目，含桌面与 320px 窄屏交互路径，375px 由独立浏览器评估覆盖）；Vue3 `vue-tsc --noEmit`、目标 ESLint/Prettier、lx-ui `pnpm typecheck`、`pnpm build`（196 modules）、`pnpm build:docs` 均通过。VitePress 有既有大 chunk 警告。
- **代码审核**：独立 Luna max 只读批准，未发现可复现 P0–P2。保留两项测试风险：屏幕阅读器实际播报尚未验证；真实权限菜单异常图标数据尚未进入回归。
- **Impeccable Assessment A**：独立评估 32/40（Good），这是修前基线，0 项 P0/P1；建议包括长目录检索可恢复性、英文键 10px、P1 计数口径和空态文字对比。窄屏最终有效批次在重新加载页面后确认 VitePress 侧栏关闭，浅色/HUD 均无根级横向溢出；早前 resize 状态污染与失败主题开关采集均已排除。
- **Impeccable Assessment B**：六个目标的原始 detector stdout 均为 JSON `[]`，stderr 0 字节、退出码 0；只表示静态规则零命中。9 个浏览器视图均实际注入并运行 detector，截图确认黄色标记显示。真实问题为图标英文键字号与浅色空态对比度；其他命中分别归于 VitePress 壳层、设计 token 提示或 overlay 自身标签。375px `615px` 根宽是在 overlay 激活后测得，不作为原页面溢出证据。通用 404 console 没有资源 URL，未归因。临时 8400 服务已停止，用户的 4174 服务 PID 前后均为 44124。
- **修后复验（早期记录，已由下方正式补充交接校正）**：早期 E2E 汇总曾写为“两项目 2/2”，与当前 Playwright 配置不符；当前配置实际为单 Chromium 项目，最新实跑 2/2。桌面/移动视口与主题结论以独立 A/B 浏览器证据及下方正式补充交接为准。
- **未完成/风险**：本波不增加 UI-10 52 项矩阵关闭计数；整库 UI-11 尚未完成。真实读屏器、生产权限菜单异常数据和真实后端不在本次浏览器验收范围。浏览器存在一条无 URL 的资源 404，当前无法归因。
- **本波提交范围**：实现、中文组件文档、Vue3 单测/E2E 已单独提交为 `d4972fd fix(lx-ui): harden icon fallbacks and docs search`；计划/地图/迁移台账/交接/审计/代码复审和 Impeccable 报告、截图、快照按 `docs(project)` 第二笔提交。仅暂存本波白名单；保留 `.pnpm-store` 镜像、`0`、`test-results`、PasswordInput 评审、其他组件评审与运行时文件。
- **下一步**：自动开始 `LxDynamicForm` 波次，按 `PROJECT-FOLLOWUP-BREAKDOWN.md` 执行 schema 字段组件拆分、单/多图上传列表、容器自适应 1/2/3 列、受控 `value`/`change(nextValue)`、远程状态与取消竞态，并纳入密码字段宿主校验失败和 ARIA 示例。Vue3 业务 API 继续使用 `.then().catch().finally()`；文档与注释用中文；完成后再次代码复审、Impeccable、分别提交并推送。

## [2026-10-06] Wave 3 / LxIcon 正式复核补充交接

- 本节修正上方同日历史记录中的最终复核数据；旧记录保留为过程记录，提交及后续引用以本节为准。
- **最终实现与验证**：图标单测 7/7；文档 Playwright 当前配置 2/2，实际为单 Chromium 项目，覆盖桌面流程和 320px 窄屏路径；375px/320px 多状态视觉覆盖由独立 Assessment A/B 浏览器证据承担。Vue3/lx-ui 类型检查、目标 ESLint/Prettier、196 模块构建、文档构建与 `git diff --check` 通过。
- **代码复审与 Impeccable**：独立代码复审批准，无可复现 P0–P2；名称集合断言保留 P3。修后 Assessment A 37/40，修前基线 33/40；正式隔离 B 的组件和文档扫描均是 JSON `[]`、stderr 空、退出码 0，五个浏览器 context 的 overlay 均成功。规则命中归属于 CJK 行长提示、VitePress/Shiki 壳层或 code-copy 控件，没有命中 LxIcon 控件。无 URL console 404 未归因。正式综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`；正式 snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`，目标趋势两次均为 37/40。
- **提交与后续**：实现提交为 `d4972fd fix(lx-ui): harden icon fallbacks and docs search`；计划、交接及审查证据随本次 `docs(project)` 提交推送。该波完成归档后自动进入 DynamicForm 波次。
- **未关闭**：展开的 P1/P2 分组仍分别含 26/29 项，作为 P2 跟踪；E2E 名称集合核对作为 P3 跟踪。真实屏幕阅读器、生产权限菜单畸形数据、Firefox/Safari 和实体触屏未覆盖，且浅色默认页一条 console 404 未归因；因此不增加 52 项严格矩阵关闭数。
- **评估记录边界**：一份较早修后 B 运行已从综合结论排除。现存报告不能唯一证明哪一文件对应交叉风险；`agent-assessment-b-postfix/assessment-b.md` 已标为历史分报告，正式 B 仅指向 `agent-assessment-b-isolated-final/assessment-b.md`。
- **下一步**：自动进入 DynamicForm 波次，按后续拆分完成 renderer 独立文件、密码宿主校验/ARIA、远程 Mock 取消和乱序、上传状态映射、`daterange` 往返、自适应列数及父级受控值回灌。生产接口和上传值契约需按真实宿主来源确认。API 请求保持 `.then().catch().finally()`；每步同步中文计划、交接和审查记录，并分两笔 Conventional Commit 推送。

## 2026-10-07 Wave 6 交接：Cascader、Descriptions、VirtualTree 与文档侧栏

### 目标

完成当前版本 Cascader、Descriptions、VirtualTree 和文档侧栏的严格设计对照、行为回归、浏览器取证、独立代码审核及 Impeccable A/B；修复审核中发现的焦点、键碰撞、键盘冒泡和主题传送问题。

### 改动与结果

- Cascader 传送弹层继承 HUD Element Plus 变量；Descriptions 主题标签和侧栏术语改为中文；VirtualTree 行内展开按钮/复选框不再参与重复键盘操作，number/string 键使用类型隔离，空字符串键过滤后保留焦点，移动 Demo 控件最小高度为 44px。
- 同步中文 Demo、API 文档、侧栏配置、Vue3 单测和文档 E2E。业务 API、权限协议、路由和宿主 Element Plus 依赖未改变。
- 空字符串键回归测试使用两行都匹配过滤条件，旧实现会错误回退到第一行；当前定向 VirtualTree 18/18 通过。

### 实际验证

- Vue3 全量 Vitest：58 个文件、457 个测试通过。
- VirtualTree 18/18、Descriptions 6/6；两个文档 E2E 共 6/6。
- lx-ui 类型检查、库构建、VitePress 文档构建、Vue3 类型检查、目标格式检查和 `git diff --check` 通过；文档构建保留既有大 chunk 警告。
- 独立代码审核批准，无可复现 P0-P3；报告为 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/code-review-wave6.md`。
- Assessment A 35/40（Good）；Assessment B 7 项 detector 均为有效 JSON `[]`、stderr 空、退出码 0，四页新标签 overlay/键盘/HUD/错误/空态/375px 采集完成。B 使用隔离 Playwright fallback，完整证据索引为 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/recheck-assessment-b/evidence-index.md`。
- 正式综合报告为 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`。detector 的 `[]` 只表示静态规则零命中，不单独代表视觉通过；临时 live server 和文档服务均已停止并验证端口不可达。

### 未完成与风险

- Demo 控制区渐进披露、VirtualTree 自定义 node 插槽单行/可测量高度契约、Cascader loading 触发器语义分别登记为 P2、P2、P3。
- 本波只关闭组件级审核门禁，不增加 UI-10 52 项全库严格矩阵关闭数；Vue3 `DataPermissionTree` 宿主替换、真实权限联调、权限中心/文本字段权限/引导页继续延期。

### 下一步交接

进入 Wave 7 `LxTransferPanel`：严格对照 `design/虚拟滚动树 + 双栏穿梭/code.html` 和 `screen.png`，落实 5:2:5 栅格、380px 面板、桌面 32px 基准行高、TransferPanel 在 320–420px 窄屏 64px/421px 起 44px、VirtualTree 窄屏 44px、节点 code/status、空/加载/错误、上限/禁用、窄屏 44px 触控区、HUD 和 `prefers-reduced-motion`；补单测、Mock/E2E、A/B、代码审核和 snapshot/trend。库级门禁完成后再回归 Vue3 `DataPermissionTree` 的 props、exposes、勾选与回传契约。

### 提交约定

实现和回归文件使用一笔 `fix(lx-ui): ...`；计划、交接、审计、审核和 Impeccable 证据使用一笔 `docs(project): ...`。只暂存本波白名单，排除 `.pnpm-store`、旧波次证据和运行时文件；两笔提交均需推送 `origin/main`。

## [2026-10-07] Wave 7 / LxTransferPanel 修后交接

- **本波完成**：`LxTransferPanel` 按双栏穿梭设计补齐 5:2:5 桌面轨道、380px `border-box` 同高面板、筛选结果批量操作、两侧 code/status 元数据、树外既有键与 `selectedItems` 回显、未加载键确认和移动端宽度约束。未知 `status` 文本原样展示，语义色仍使用白名单。
- **代码复审与修复**：独立代码复审发现 `status="constructor"` 会读到普通对象原型成员；新增可复现单测并改用自有键判断。修后复审通过，未发现未关闭的 P0–P2。空白搜索边界与窄屏未加载长文本行高未由本波用例完全覆盖，按后续覆盖事项保留。
- **验证**：定向单测 14/14、文档 Playwright 5/5；lx-ui typecheck、203 模块构建、VitePress 文档构建、Vue3 `vue-tsc --noEmit`、目标 Prettier、宿主单测 ESLint 和 `git diff --check` 通过。VitePress 保留既有大 chunk 警告；Vue3 ESLint 对 linkx-fe 文件的输出是 ignored，故不记作库 ESLint 通过。评审者首次 E2E 遇到内网代理超时，主会话随后用 `playwright.lxui.config.ts` 隔离到 4177 复跑 5/5。
- **Impeccable 状态**：修复前截图和评估标为过程证据。当前 7 个目标文件的统一 SHA-256 冻结版由独立 A/B 最终复核；正式综合报告、overlay 归因、snapshot/trend 完成前，不标记 Critique 通过。
- **边界**：UI-10 仍为 0/52；Vue3 `DataPermissionTree` 的 props、exposes、父子勾选、键回显与 change 回传仍需 UI-04 Mock/E2E；真实权限后端联调继续延期。Vue3 宿主 Element Plus 暂不移除。
- **下一步交接**：Wave 7 A/B、综合报告和 snapshot/trend 收口后进入 G2 `LxSearchBar` + `LxStatusSwitch`。组件实现/Demo/API/测试和组件中文文档使用 `fix(lx-ui)`；项目计划、地图、台账、交接、评审及 Impeccable 证据使用 `docs(project)`；两笔均只暂存本波白名单并推送 `origin/main`。

### [2026-10-08] Wave 7 修后回归补充

- **修复内容**：确认期间仅当 `modelValue` 键序列变化时拒绝旧确认；仅更换相同键的新数组引用仍接受用户确认。移除已选项时先将焦点置于稳定列表，再移到下一项或前一项；列表清空时留在列表。溢出提示移除 `aria-hidden`，作为礼貌播报并通过 `aria-describedby` 关联到已选列表。
- **文档与测试**：更正 `clear-all` 的条件确认说明；组件中文文档同步焦点回落、屏幕阅读器描述和确认版本规则。新增同值新数组单测和键盘移除焦点/读屏关联 E2E。
- **验证**：定向单测 **20/20**，文档 Playwright **10/10**；lx-ui 类型检查、203 模块生产构建、VitePress 文档构建、Vue3 单测/E2E 文件 ESLint 和目标 Prettier 通过。VitePress 仍有既有大 chunk 警告，4174 用户预览仍返回 HTTP 200。独立代码复审及修后 Impeccable A/B 的正式结论待补入本节。
- **范围边界**：本修复不关闭 UI-10 52 项严格矩阵；Vue3 `DataPermissionTree` 适配、真实权限联调和 Vue3 宿主 Element Plus 替换仍未完成。提交时只暂存本波实现/回归与本波计划、交接和审查证据白名单；按约定分为 `fix(lx-ui)` 与 `docs(project)` 两笔并推送 `origin/main`，再开始 G2。

## [2026-10-11] Wave 11 P2 / LxTransferPanel 与 LxVirtualTree 最终交接

- **完成内容**：TransferPanel Demo 默认值为标准 `380px`，保留 `240px`/`300px` 边界；桌面和窄屏长名称支持键盘或点击查看全文；VirtualTree 三组折叠入口统一使用 `LxIcon chevron`，减少动效时不旋转；批量栏增加可加入/已选计数，紧凑布局只显示“剩余 N 个名额”，完整拒绝原因仍在 `title` 和 `aria-describedby`；隐藏原生 details marker，修正可加入数量计算。
- **涉及文件**：`linkx-fe/src/components/LxTransferPanel/**`、`linkx-fe/src/components/LxVirtualTree/**`、两份中文组件文档、TransferPanel 单测和 TransferPanel/VirtualTree 文档 E2E。`.pnpm-store` 镜像目录中的同名文件属于生成镜像，不进入本波提交。
- **验证结论**：组件单测合计 67/67，文档 E2E 合计 48/48；lx-ui 类型检查、203 modules 构建、VitePress、Vue3 生产构建、目标 Prettier、差异检查通过；代码复审批准且没有 P0-P3。ESLint 仅有既有 `SidebarItem.vue` import/order warning。
- **Impeccable 结论**：A 36/40（Good），P0/P1/P2 为 0，唯一 P3 为 Demo 设置区展开后选项较多；B 的 5 个 detector 三件套均为 `[]`/空 stderr/退出码 0，9/9 浏览器视图完成导航、交互、注入、overlay 和截图。正式报告、证据和停止记录位于 `.impeccable/critique/transferpanel-p2-2026-10-11/`；snapshot 为 `.impeccable/critique/2026-10-10T23-03-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。`[]` 不作为单独的视觉通过凭据。
- **未关闭边界**：宿主保存状态、真实权限 API、`DataPermissionTree` 业务契约、读屏器专项和 Vue3 Element Plus 替换仍未完成；权限中心、文本/字段权限和引导页继续后置。组件级结项不增加 UI-10 全库 52 项关闭数。
- **下一波交接**：`LxMetricCard` + `LxSectionTitle` 严格 UI A/B 复核；完成后处理台账中的 G2 `LxSearchBar`/`LxStatusSwitch`。下一波仍须先执行组件库验证和 Impeccable，再进入 Vue3 页面替换。
- **提交与推送**：实现白名单提交 `fix(lx-ui): ...`，文档/证据白名单提交 `docs(project): ...`；提交前确认无 `.pnpm-store`、旧评估目录或其他协作者文件，随后推送 `origin/main`。所有后续 API 请求继续使用 `.then().catch().finally()`，新增注释和文档使用中文。

## [2026-10-12] Wave 13 / LxButton 当前交接（正式收口补记）

- **组件与设计入口**：`linkx-fe/src/components/LxButton/`、`linkx-fe/docs/components/lxbutton.md`、`design/按钮体系/DESIGN.md`；共享纯图标浮层协调器为 `icon-tooltip-coordinator.ts`。
- **实现与行为**：补齐语义按钮样式、图标提示唯一性、禁用/加载时浮层关闭、窄屏纯图标可见短标签、块级主操作互斥 Demo、危险操作宿主确认边界、明暗主题和减少动效；320/375px 下摘要触达高度至少 44px。
- **验证**：单测 **33/33**、文档 E2E **19/19**、lx-ui 类型检查、205 modules 构建、VitePress 构建、目标 ESLint/Prettier 与 `git diff --check` 通过。Playwright 使用 `playwright.lxui.config.ts`，所有后端请求由共用 Mock 拦截。首屏 E2E 使用真实 Ctrl+点击并拦截新标签默认动作，确认原页 hash、滚动位置和焦点不变；主题迁移用例在迁移后聚焦按钮，确认 Tooltip 实际可见、跟随 HUD 主题且位于按钮上方。Tooltip 保留 200ms 延迟并关闭 Element Plus 默认淡入淡出；`md` 字号为 14px；触摸聚焦不触发提示，键盘聚焦仍可触发。
- **复审整改**：关闭首屏 Ctrl+点击保护与主题迁移 Tooltip 可见性/位置两项 E2E 覆盖发现，修后完整文档 E2E **19/19** 通过。
- **当前状态**：两轮代码复审发现的动效白名单、字号和触屏聚焦问题均已修复，并补充浏览器/单测覆盖。当前冻结版 A/B、综合报告、detector 三件套、snapshot/trend 和代码复审已完成；A 为 32/40，代码复审无未关闭发现。静态 `[]` 只表示零条静态规则命中。
- **范围边界**：不代表 Vue3 业务页面完成按钮替换，不关闭 UI-10 的 52 项全库审计，不修改权限/API/后端契约。页面操作引导计划已按用户决定暂缓，后续有需要再恢复排期。
- **下一步与提交**：完成评审建议及有界复验后，更新路线图、交付检查、迁移台账、项目地图和本交接。实现/回归/组件中文文档使用一笔 `fix(lx-ui)`；项目计划/评审/审查证据使用一笔 `docs(project)`，只暂存本波白名单并推送 `origin/main`，再按组件审计矩阵继续下一组件。

## 2026-10-17 Wave 14 / LxPasswordInput 修后交接

- 清空按钮保留 `.el-input__clear` 兼容选择器并移出 Tab 顺序；窄屏显隐按钮采用绝对定位，保持 44px 触控目标且不撑高 sm/md/lg 外框。
- 单测 11/11、文档 E2E 9/9、`vue-tsc --noEmit` 和目标 Prettier 通过。linkx-fe 文件被宿主 ESLint 配置判定为 outside base path，未将其冒充为库 ESLint 通过。
- Impeccable A 32/40；B detector 为合法 `[]`、stderr 空、退出码 0；1280px/375px 浏览器注入成功且无横向溢出。快照 `.impeccable/critique/2026-10-17T05-26-20Z__linkx-fe-src-components-lxpasswordinput-index-vue.md`，报告 `.impeccable/critique/password-input-assessment-b-2026-10-17.md`。
- `npx impeccable update` 因 GitHub 下载连接超时退出码 1，已安装 4.6.0 未被覆盖；临时 live-server 已停止，临时 E2E 已删除。真实登录/改密和后端联调仍未执行。
- 下一波进入 `LxMetricCard` + `LxSectionTitle`，随后处理 G2 `LxSearchBar`/`LxStatusSwitch`；权限中心、文本/字段权限、页面引导和 Vue3 Element Plus 移除继续后置。

## 2026-10-17 Wave 15 / LxMetricCard 与 LxSectionTitle 复核

- 单测 33/33、文档 E2E 4/4；两个 detector 均为 JSON `[]`、stderr 空、退出码 0。
- 1280px/375px 四个浏览器视图注入成功，控制台返回 `No anti-patterns found`，无横向溢出。
- 独立 Luna Assessment A 代理因服务 503 失败，本波为降级设计评估，不能冒充完整双代理 Critique；报告见 `.impeccable/critique/metric-section-assessment-2026-10-17.md`。
- 下一波为 G2 `LxSearchBar` 与 `LxStatusSwitch`；真实读屏器、宿主组合、后端联调和 Element Plus 移除仍未执行。

## 2026-10-17 LxInput 前后缀轨道复验

- **修复**：前后缀容器及内部槽位改为明确的完整高度 flex 居中轨道，并将行高收敛为 `1`，避免输入框边框与前后缀内容出现上下错位。
- **验证**：复合前后缀文档 E2E 1/1、`LxInput` 单测 13/13、目标 Prettier 和 `git diff --check` 通过；覆盖 sm、md、lg 与 390px 窄屏。
- **Impeccable 取证**：组件样式 detector 为合法 JSON `[]`、stderr 为空、退出码 0；该静态结果只表示零规则命中，浏览器 E2E 的几何断言作为本次复验依据。

## 2026-10-17 G2 自动化门禁与 Critique 阻断记录

- G2 当前版全量单测 **598/598**、文档 Playwright **8/8**，lx-ui 类型检查、206 modules 构建和 VitePress 构建通过；`npx impeccable update` 已成功更新引擎至 **0.1.15**。
- 新引擎在线 detector 初次命中 SearchBar Demo 卡片嵌套和说明文字对比度；已移除 Demo 卡片壳并提升文字对比度。修后 SearchBar 与 StatusSwitch 均为合法 JSON `[]`、stderr 空、exit `0`。该结果只关闭静态 detector 阻断，G2 正式 Critique 仍需独立 A/B、代码复审和综合 snapshot/trend。
- 375×812 窄屏 detector 复验同样为合法 JSON `[]`、stderr 空、exit `0`；该证据与现有 8/8 文档 E2E 一并作为 G2 正式 A/B 的输入。
- 该阻断不改变已通过的实现级自动化门禁，也不引入未经设计确认的样式修改。处理完成后继续独立 Assessment A/B、代码复审、综合 snapshot/trend，再进入下一组件批次。

## 2026-10-18 LxInput 前后置复合块修复

- **改动**：`linkx-fe/src/components/LxInput/style.css` 将 `prepend/append` 设为完整高度的 inline-flex 居中轨道，去除上下内边距并统一行高，修复 Demo 中输入框与前后置块的视觉高度不一致。
- **验证**：`lx-base-controls-docs.spec.ts` 的复合前后缀用例 **1/1**；覆盖 sm、md、lg、390px 触屏高度及新增上下边界对齐断言。`pnpm typecheck`、`git diff --check` 通过。
- **Impeccable 证据**：`detect.mjs --json linkx-fe/src/components/LxInput/index.vue` 退出码 `0`，JSON 为合法 `[]`，stderr 为空；该静态结果只表示零规则命中，浏览器几何回归作为本次修复依据，未宣称新的正式双路 Critique 已完成。
- **后续**：保持 Vue3 Element Plus 替换、真实后端联调及页面操作引导的既定后置安排；继续按组件门禁推进下一项。

## 2026-10-18 LxInput 前后缀槽位高度补强

- **改动**：`LxInput` 的 prefix/suffix 容器和内部槽位补充 `border-box`、完整高度 flex 轨道、零上下内边距和显式 `inline-flex`，使图标前后缀在 sm、md、lg 及窄屏状态与输入框外框保持同高。
- **验证**：复合前后缀文档 E2E **1/1**；新增 390px 窄屏 prefix、prefix-inner、suffix、suffix-inner 均为 44px 的断言；基础控件套件本轮 10/12 通过，另有 2 项既有清空按钮角色查询失败，失败与本次高度规则无关，已单独记录。
- **质量门禁**：lx-ui `pnpm typecheck`、`pnpm build`、目标 Prettier 和 `git diff --check` 通过；`detect.mjs --json` 输出合法 JSON `[]`、stderr 为空、退出码 `0`，仅表示静态规则零命中，不能替代浏览器证据或正式 Impeccable A/B。

## 2026-10-18 DynamicForm/Form 文档 P2 收口

- **改动**：DynamicForm/LxForm 文档将低频 API、schema、事件、实例和迁移说明收进原生 `details`；新增 44px summary、焦点样式、窄屏表格滚动提示、表格键盘横向滚动、`aria-describedby` 和 SPA 路由重绑定；普通 VitePress 暗色模式补充文档令牌桥接。
- **验证**：文档 E2E **20/20**；lx-ui `typecheck`、VitePress `build:docs`、目标 Prettier、`git diff --check` 通过。浏览器复验覆盖 Light/HUD、1280/375、减少动效、错误/禁用、键盘和 overlay 注入；清洁页面无横向溢出与页面错误，overlay 造成的 547px 扩展已单独归因。
- **审查**：四个 detector 的 stdout/stderr/退出码分别为合法 `[]`/空/`0`。已有独立 Assessment A/B 基线与本轮修后浏览器证据均已保留；本轮未新增独立评分，不把空数组当作正式通过。代码复核未发现新的 P0/P1/P2。
- **后续**：首列 sticky、API 子分区锚点、真实读屏器和 MutationObserver 性能继续作为 P2；不改变宿主 API、业务请求链式写法、权限和迁移顺序。

## 2026-10-18 G2 LxStatusSwitch 无权限状态可访问性补强

- **改动**：无权限 `fallbackTag` 现在显示当前状态和“无权限，只读”原因，并向只读标签写入 `aria-label`/`aria-description`；`aria-description` 同时支持调用方透传。Vue3 `StatusSwitch` 适配层改为复用 `LxStatusSwitch`，保留旧数字状态值、文案 props 和数字 `change` 事件。
- **验证**：lx-ui 单测 **21/21**、宿主适配器单测 **2/2**、文档 E2E **4/4**；lx-ui typecheck/build、目标 Prettier 与差异检查通过。detector 三件套为合法 `[]`/空 stderr/0，浏览器用例覆盖无权限只读播报、确认取消、失败恢复、HUD、窄屏和减少动效。
- **代码边界**：未向 lx-ui 引入 API、Router、Pinia 或权限请求；真实权限后端和宿主全量迁移仍未完成。该波不关闭 UI-11 整库审查。

## 2026-10-18 LxInput 前后缀高度轨道修复

- **问题**：`LxInput` 的输入内容、prefix/suffix 与 prepend/append 依赖 Element Plus 内部高度变量分别计算，尺寸或主题切换时可能产生上下边界视觉差异。
- **实现**：新增组件级 `--lx-input-track-height`，输入内框、真实输入节点、前后缀容器/内部槽位及外侧复合块统一使用同一高度轨道；窄屏触控态统一覆盖为 44px，并同步 Element Plus 输入行高变量。
- **验证**：lx-ui `vue-tsc --noEmit`、生产构建通过；`LxInput` 单测 **13/13**；4177 文档服务浏览器几何复验覆盖 `sm/md/lg` 与 390px 窄屏，前后缀及输入内容轨道一致。Impeccable A **32/40**；B detector 为合法 `[]`/空 stderr/退出码 0，8/8 Light/HUD 视图注入成功且无页面错误。综合报告与快照见 `linkx-fe/.impeccable/critique/lxinput-height-wave-2026-10-18/assessment-report.md` 与 `.impeccable/critique/2026-10-17T19-42-24Z__linkx-fe-src-components-lxinput-index-vue.md`。
- **边界**：本波只修复组件高度轨道，不改变 props、事件、插槽或 Vue3 宿主迁移范围；真实后端联调、权限任务和整站替换仍按总计划执行。

## [2026-10-18] LxInput 前后缀高度反馈复验

- **反馈**：用户指出 `prefix/suffix` 状态下输入框与前后缀高度不一致。
- **复验**：使用 `playwright.lxui.config.ts` 运行 `lx-base-controls-docs.spec.ts` 中复合前后缀和普通根节点两条用例，结果 **2/2 通过**；覆盖 `sm/md/lg`、390px 窄屏、根节点、输入内框、前后缀内外槽位及 `prepend/append`。
- **结论**：当前 `.lx-input` 统一高度轨道已生效，无需重复修改组件样式。后续继续按 UI-10 组件门禁推进，保留 API 链式调用、中文文档和临时产物白名单规则。

## 2026-10-18 G2 / LxSearchBar Escape 语义修复交接

- **实现**：`LxSearchBar` 新增 `escapeReset`，默认 `false`，文本输入按 Escape 不再重置整组条件；显式开启时保留旧行为。Demo 快捷键提示、中文 API 和单测同步更新。
- **证据**：`lx-search-bar.test.ts` 与 `search-bar-adapter.test.ts` 共 **13/13**；SearchBar 文档 E2E **5/5**；lx-ui 类型检查、构建、文档构建、目标格式与差异检查通过。G2 Assessment A 修后综合 **34/40**；Assessment B 已保存 detector JSON、stderr、退出码及 Light/HUD、1440/375 证据。
- **审查边界**：`[]` 仅表示静态 detector 零命中，正式结论依赖 A 评审、浏览器证据和回归测试。文档总览 `NewComponentsDemo.vue` 的 side-tab 命中属于文档壳层 P3 观察。`npx impeccable update` 因网络超时未更新。
- **下一交接**：继续 UI-10 未关闭组件矩阵和宿主替换准备；保持 Promise 链请求、中文文档注释及白名单提交规则。不要把本轮 SearchBar 文件与 CodeSlot、临时 detector、test-results 共同提交。

## 2026-10-18 LxCodeSlot 复制中反馈交接

- **改动**：复制按钮忙态显示加载图标、中文标题和 `aria-busy`，防止复制请求未完成时重复提交；文档补充该状态说明，E2E 使用受控剪贴板 Promise 断言中间态。
- **验证**：lx-ui 专用 Playwright **1/1**、lx-ui typecheck、目标 Prettier 和差异检查通过。默认 Vue3 Playwright 配置命中登录页，已改用 `playwright.lxui.config.ts` 重新执行并获得有效结果。
- **代码审查**：未发现 P0/P1/P2；状态由组件内部维护，未引入 API、Router、Pinia 或权限依赖。临时 `code-slot-e2e.json`、test-results 和其他协作者文件不纳入提交。
- **下一步**：继续 LxDescriptions 与 UI-10 未关闭候选；保持中文注释、Promise 链请求风格和白名单提交规则。

## 2026-10-19 LxInput 前后缀行高交接

- LxInput 的 prefix/suffix、内部槽位和 prepend/append 已绑定内容轨道行高，未修改 props、事件、插槽或 API 请求边界。
- 复合前后缀 E2E 1/1；lx-ui typecheck/build、目标格式和 ESLint 通过；sm/md/lg 为 28/32/40px，390px 触屏为 44px。
- Impeccable A 31/40；B detector JSON/stderr/退出码为 []/空/0，浏览器证据已保存。焦点环误读由复合输入正式断言排除；临时截图、日志和 detector 文件不提交。

## 2026-10-19 LxInput 前后缀高度令牌补强

- 将 `sm/md/lg` 的统一高度轨道绑定到 lx-ui 控件高度令牌，降低 Element Plus 主题变量覆盖导致输入框与 prefix/suffix、prepend/append 高度漂移的风险。
- 复合前后缀 E2E **1/1**、LxInput 单测 **13/13**、lx-ui 类型检查通过；Impeccable detector 为合法 `[]`、空 stderr、退出码 `0`，未将空数组单独当作正式视觉通过。
- 继续沿用中文文档、Promise 链 API 风格和白名单提交；权限、真实后端联调、Vue3 Element Plus 分批替换仍按总计划后置。

## 2026-10-19 LxDescriptions 长值展开交互

- 长普通值使用原生按钮切换展开/收起，长状态使用按钮包裹 `LxStatusDot`；状态点内部退出 Tab 顺序，保留标签和值的完整可访问名称。
- 单测 **10/10**、文档 E2E **3/3**、lx-ui typecheck、目标格式检查通过；detector 合法 `[]`、空 stderr、退出码 `0`，仅代表静态零命中。
- 新独立 Impeccable A/B、综合报告和 snapshot/trend 待补；后续复验必须覆盖 Light/HUD、窄屏、减少动效和展开前后状态。

## 2026-10-19 LxInput 前后缀完整高度交接

- 输入、prefix/suffix、内部槽位与 prepend/append 已统一完整高度轨道，解决前后缀比 32/44px 外框少 2px 的视觉差异；未改变 props、事件、插槽或 API 请求风格。
- 定向 E2E **1/1**、单测 **13/13**、lx-ui typecheck 通过；后续仍需遵守 Impeccable A/B 独立证据和临时产物白名单。

## 2026-10-19 LxInput 复合边框交接

- 复合输入边框消失确认为组件样式问题：`overflow: hidden` 下子槽背景遮挡 inset 阴影；现改为根节点真实 1px 外边框，并补回内部轨道高度。
- 复合 E2E **1/1**、单测 **13/13**；全基础控件 E2E **12/13**，剩余失败是既有窄屏清空按钮可访问显示契约，不归因本波。
- detector JSON/stderr/退出码为合法 `[]`/空/`0`；空数组只作静态证据，不能替代正式 Impeccable A/B。临时截图、日志和 detector 文件不提交。

## 2026-10-19 LxDialog footer 交接

- 修复自定义 `footer` 插槽与 `hideFooter` 的分支：自定义底栏不会再混入默认取消/确认按钮；隐藏且无插槽时不渲染空 footer。
- 单测 **6/6**、文档 E2E **3/3**；detector JSON/stderr/退出码为合法 `[]`/空/`0`，未把空数组单独作为 Impeccable 通过。
- 代码和测试保持中文注释、现有组件纯展示边界和宿主 Promise 链请求规则；临时 detector 文件不提交。

# [2026-10-19] LxProTable 当前版行为门禁复验

- **交接结果**：修复 `selection-change` 当前页差集逻辑，并为暴露的 `clearSelection()` 增加全量清空路径；取消当前页行不会误删其他页选择，清空操作也不会残留远端页 key。跨页受控选择、加载/空态/错误重试、排序、375px 局部滚动、方向键、44px 复选目标、HUD 和卸载清理复核均通过。
- **验证**：宿主适配器单测 **4/4**，4177 文档 Playwright **4/4**；lx-ui 类型检查、生产构建、文档构建、目标 Prettier 和差异检查通过。
- **审查边界**：Assessment A **29/40（Good）**；其跨页选择 P1 已修复，Demo 危险动作、工具栏密度和横向滚动提示列为后续 P1/P2。detector JSON/stderr/退出码为合法 `[]`/空/`0`，但 headless 页面截图为空白，未形成可靠 overlay 或 snapshot/trend，不能宣称正式 Impeccable 通过，UI-10 行保持开放。
- **下一步**：继续补齐剩余组件的当前版门禁与正式双路 Critique；完成 lx-ui 全库门禁后，再按迁移契约分批替换 Vue3 Element Plus。真实权限、后端联调和页面操作引导继续后置。

## 2026-10-19 LxDescriptions 当前版 Critique 复验

- **结果**：旧 Assessment A 的 27/40 为修前基线；当前版已吸收其焦点状态错位、长状态层叠、窄屏无可见反馈和展开 affordance 建议。当前单测 10/10、文档 E2E 3/3、typecheck 通过。
- **浏览器证据**：Assessment B 覆盖 Light/HUD、1280/375px、默认/聚焦/展开/收起、reduced-motion；4 场景无页面错误、失败请求和横向溢出。detector JSON/stderr/退出码为合法 `[]`/空/0，未把空数组单独当作通过。
- **记录**：综合说明为 `doc/lx-ui/IMPECCABLE-LXDESCRIPTIONS-2026-10-19.md`；真实读屏器、跨浏览器、业务宿主、真实权限及 UI-10/UI-11 全库门禁仍开放。
- **下一步**：继续剩余 UI-10 组件当前版门禁和正式双路 Critique，再进入 Vue3 Element Plus 分批替换；业务 API 保持 `.then().catch().finally()`。

## 2026-10-19 LxPagination 当前版证据核对

- 组件/适配器单测 **7/7**、文档 Playwright **3/3** 通过，分页事件顺序、自动重置、布局、主题、键盘和窄屏局部滚动均有回归。
- 当前正式 B 证据目录 `linkx-fe/.impeccable/critique/pagination-assessment-b-2026-10-17/` 不存在；历史“正式审查”描述不作为当前交付依据，UI-10 继续开放。
- `npx impeccable update` 执行成功；补证据时必须同时保存 detector JSON、stderr、退出码、独立浏览器视图和 snapshot/trend，空数组不能单独代表通过。

## 2026-10-19 LxSectionTitle Assessment B 当前版复验

- 独立证据目录：`linkx-fe/.impeccable/critique/lxsectiontitle-assessment-b-2026-10-19-recheck/`；组件源码与文档 detector 为合法 `[]`、stderr 为空、退出码 `0`。
- Light/HUD、1280/375/320px、键盘、`leading` 优先级和 reduced-motion 均已执行；375px/320px 页面 `scrollWidth` 分别为 615/560，属于文档外壳级溢出观察，不能直接归因组件，但当前版正式 Critique 保持开放。
- VitePress 外壳 transition/动画命中已在证据中标记为误报；后续需要单独收口文档壳层窄屏溢出，再评估 UI-10。

## 2026-10-19 隔离 Mock 全菜单预览复验

- `playwright.preview.config.ts` 隔离运行 **10/10** 通过，覆盖 33 个现役入口的首屏样例和全部预览专项场景。
- 通过项包括菜单目录与搜索、关联人员远程搜索迟到响应、北向接入筛选/增改删、轮播文章分页、鉴权图片失败恢复/键盘重试和减少动效。
- 证据范围仍是本地 Mock；真实权限、真实后端、深层页面操作和写接口联调继续保持阻塞标记。

## 2026-10-19 LxButton 纯图标居中交接

- 已清除纯图标 tooltip 空触发节点的 Element Plus 图标后间距，图标槽按 sm/md/lg 令牌使用无行高 flex 居中布局。
- LxButton 单测 33/33、文档 E2E 19/19；新增三档纯图标和文字形态图标几何中心断言。目标 ESLint、Prettier、差异检查通过。
- detector JSON/stderr/退出码为 []/npm 配置警告/0，不能单独代表 Impeccable 通过；独立 A 与 snapshot/trend 待后续批次补齐。lx-ui typecheck 受既有 SectionTitle Demo 图标名错误阻断。

## 2026-10-19 分页宿主首批替换交接

- `alertPush/index.vue` 两个分页、`thirdParty/index.vue` 北向分页和 `CoopBindDialog.vue` 分页均改用 `LxPagination`，不再直接渲染 `el-pagination`。
- 页面仍由宿主维护请求、加载、错误和滚动：通知页按 `change(page, size)` 查询，北向页保留请求序号防迟到响应，挂靠弹窗继续通过 `fetchList` 注入数据。
- 验证已完成：类型检查、目标 ESLint、Prettier、差异检查；Mock 首屏与北向 CRUD 各 1/1。真实分页协议、权限和其他页面的深层操作仍未联调。

## 2026-10-19 ProTable 隐藏列交接

- `other-admin/admin-vue3/src/components/ProTable/index.vue` 已按 `ITableColumn.hide` 跳过隐藏列，适配层仍保留可见列属性和插槽。
- 单测 **5/5**、LxProTable 文档 E2E **4/4**，目标格式、ESLint 和差异检查通过；detector `[]`/空 stderr/退出码 `0` 只表示静态扫描零命中。
- 真实业务列表、权限字段来源、正式 Impeccable A/B 和其他 Element Plus 表格替换继续开放；API 请求仍须使用 `.then().catch().finally()`。

## 2026-10-19 LxPagination 当前版复验交接

- 文档行为 E2E **3/3** 通过；覆盖翻页、条数切换、布局、主题、375px 局部滚动和键盘焦点。
- detector 三件套为合法 `[]`、空 stderr、退出码 `0`；因缺少隔离 A/B 与可写 overlay，本次为降级复验，证据见 `linkx-fe/.impeccable/critique/lxpagination-assessment-b-current-2026-10-19/`。
- 正式 UI-10、真实宿主分页 API、权限联调和跨浏览器仍未完成；不得把本条写成组件正式 Critique 通过。

## 2026-10-19 LxInput 普通边框可见性交接

- 普通、密码、透传 `LxInput` 的 `.el-input__wrapper` 现在使用真实 `1px` 外边框；复合 prepend/append 继续由根节点提供连续外框，焦点光环和错误态语义保持不变。
- LxInput 单测 **13/13**；前后缀/密码/透传边框专项与复合尺寸 E2E **2/2**；目标 Prettier 通过。完整基础控件 E2E 的既有清空按钮失败不属于本波。
- 未改变 API、权限、业务请求链和宿主 Element Plus 依赖；正式 Critique 仍需独立 A/B、浏览器证据和 snapshot/trend，空数组不能单独作为通过。

## 2026-10-19 LxSelectPagination 防抖交接

- `debounce` 现在按调用方传入毫秒数执行；非有限值使用 300ms，负数按 0ms 处理，不再静默限制到 250–400ms。
- 单测 **5/5**、文档 E2E **6/6**；detector 为合法 `[]`/空 stderr/退出码 `0`。未改变远程搜索取消、分页、失败恢复和宿主 API 请求链。
- 因本波没有独立 A/B、可写 overlay 和 snapshot/trend，只记为降级复验；不得把空数组写成正式 Impeccable 通过。

## 2026-10-19 LxSectionTitle Demo 图标名交接

- Demo 与 E2E 断言已将不存在的 `settings` 统一修正为已注册的 `setting`；不增加图标别名，不改变组件公开契约。
- lx-ui 类型检查通过；SectionTitle 单测 **14/14**、文档 E2E **1/1**、目标格式检查通过。
- 该修复只解除 Demo 类型门禁，不关闭 UI-10/UI-11，也不触发 Vue3 Element Plus 替换或权限任务。
-
## 2026-10-20 LxSectionTitle 当前版交接

- 组件 `extra` 使用可收缩布局并保留 400px 以下分行；Demo HUD 主题同步文档根节点，卸载恢复逻辑不会覆盖宿主在生命周期内接管的主题状态。
- Assessment B 独立证据见 `tmp-sectiontitle-followup-b.md` 与 `tmp-sectiontitle-followup-b/`：1280/420/375/320px、Light/HUD、normal/reduced-motion 共 16 视图，页面错误、失败请求、页面横溢出和操作越界均为 0；detector 三件套均为 `[]`/空/0，未单独解释为通过。
- Assessment A **32/40（Good）**，P0/P1 为 0；其主题并发竞争建议已在卸载恢复中加入状态所有权判断。默认 Vue3 E2E 因真实后端代理超时未形成页面证据，需使用 lx-ui 4177 文档服务或专用 Mock 配置复验。
- 下一步：按 UI-10 继续处理剩余组件的正式双路 Critique；完成组件库门禁后再替换 Vue3 Element Plus。权限、真实后端和页面引导仍后置。
# 2026-10-20 LxDynamicForm schema 诊断交接

- **改动**：`LxDynamicForm` 开发环境诊断重复字段 key、未知字段 type、radio/checkbox 不支持的 option value 类型；不阻断生产渲染，不改变 `value/change`、校验、提交、上传或远程请求边界。文档同步值域和 520/760px 断点定义。
- **验证**：`lx-dynamic-form.test.ts` **31/31**；`lx-dynamic-form-docs.spec.ts` **14/14**；lx-ui `vue-tsc --noEmit` 通过。API 请求链规则未改变。
- **审查**：Assessment A **32/40**。Assessment B 三个 detector 均为合法 `[]`、stderr 为空、退出码 `0`；独立浏览器 8/8 视图覆盖 Light/HUD、桌面/窄屏和 reduced-motion，无页面错误、失败请求或业务横溢出。缺少综合 snapshot/trend，仍不关闭 UI-10/UI-11。
- **下一步**：恢复可执行 detector 后重跑 Light/HUD、桌面/窄屏、reduced-motion 和 overlay；再决定 feedback 与 required 的错误播报优先级。真实上传、远程接口、权限和 Element Plus 删除继续阻塞。
# 2026-10-20 LxTransferPanel 当前版复验

- 文档 E2E **33/33** 通过；桌面复选框视觉盒保持 14px，窄屏触控目标保持 44px，用户反馈的“选择框太大”修复未回归。
- Assessment A **29/40**，仅做静态源码/设计评估，未执行浏览器、detector、overlay 或 console。桌面删除/清除按钮的紧凑命中区和宿主保存状态列为后续设计/契约决策，不在本波擅自改大桌面布局。
- 当前已有 TransferPanel B 证据不因本次 A 重评自动复用为新增正式快照；需按当前源码重新核对 B、snapshot/trend 和 UI-10 状态。

# 2026-10-20 LxStatusSwitch 首批宿主替换交接

- **实现**：`other-admin/admin-vue3/src/views/eventType/thirdParty/index.vue` 已将编辑表单状态 `el-switch` 替换为 `LxStatusSwitch`；页面通过 `setFormStatus` 将 `true/false` 映射为原业务 `1/0`，保留启用/停用文案和提交契约。
- **验证**：`vue-tsc --noEmit`、目标 ESLint/Prettier、`status-switch-adapter` 与 `lx-status-switch` 单测 **23/23**、隔离 Mock Playwright **10/10** 通过。
- **代码边界**：未修改接口、权限键、表单校验或请求链；API 调用继续使用 `.then().catch().finally()`。注释和交接记录使用中文。
- **能力差异**：`thirdInterface/app/AppManage.vue` 仍使用 `el-switch`，因为现有页面要求开启/关闭均弹确认并在 API 成功后才切换，而 `LxStatusSwitch` 当前只拦截关闭；待组件契约明确后再扩展或迁移。
- **下一步**：继续核对剩余 15 个 `el-switch` 场景，优先无前置保存钩子的表单；全库 UI-10/UI-11、权限中心、真实后端、页面引导和 Element Plus 删除门禁仍未完成。
# 2026-10-20 LxSwitch 第二批宿主替换交接

- **实现**：`AgentConfig.vue` 的分离部署/审批开关、`EditMap.vue` 激活状态、`thirdPartyEdit.vue` 应用状态共 4 处改用 `LxSwitch`；组件透传原有 `active-value/inactive-value`、文字和 `inline-prompt`，页面数据与提交契约保持不变。
- **验证**：`vue-tsc --noEmit`、目标 ESLint/Prettier、`git diff --check` 和隔离 Mock Playwright **10/10** 通过；源码直接 `el-switch` 从 14 降到 **10**。
- **边界**：未改变接口、权限、表单校验和链式请求；剩余 10 处包含异步保存、确认、权限或复杂配置，需按能力差异继续评估。正式 Impeccable 全库门禁、真实后端和 Element Plus 删除仍未完成。
- **下一步**：继续处理统一通信、南向配置与布局配置中的简单开关，复杂前置保存场景暂保留并登记。
# 2026-10-20 LxSwitch 第三批宿主替换交接

- **实现**：`TaskConfigModal.vue`、`EditPcTabModal.vue`、`EditSectionModal.vue` 共 4 个表单开关改用 `LxSwitch`；保留 1/0 值域、表单条件、文案和保存时机。
- **验证**：`vue-tsc --noEmit`、目标 ESLint/Prettier、`git diff --check`、隔离 Mock Playwright **10/10** 通过；源码直接 `el-switch` 从 10 降到 **6**。
- **边界**：未改变接口、权限、校验和链式 API 请求；剩余 6 处涉及异步表格保存、权限筛选或失败回滚，暂不机械替换。正式 Impeccable 全库门禁、真实后端和 Element Plus 删除仍未完成。
- **下一步**：继续核对统一通信与警务上报开关的 loading、失败恢复和权限语义，确认可由 `LxSwitch` 或 `LxStatusSwitch` 完整承接后再迁移。
# 2026-10-20 LxSwitch 剩余宿主替换交接

- **实现**：六个剩余页面开关已全部由 `el-switch` 改用 `LxSwitch`：设备类型、ICP 子部门筛选、警务上报编辑/列表、协同成员、第三方应用上架。`LxSwitch` 透传 `active-value/inactive-value`、`before-change` 和 `@change`，页面 loading、失败回滚和确认逻辑保持。
- **验证**：`vue-tsc --noEmit`、六个目标文件 ESLint/Prettier、`git diff --check`、隔离 Mock Playwright **10/10** 通过；业务页面直接 `el-switch` 扫描为 **0**。
- **边界**：没有删除 Vue3 `element-plus`，因为其他 Element Plus 控件及 lx-ui 内核仍依赖它；权限、真实后端、跨浏览器、正式 Impeccable 全库审查和页面引导仍按计划后置。
- **下一步**：转入剩余 `el-input`、`el-select`、`el-dialog` 等矩阵项；组件迁移仍须保留中文文档、Promise 链 API 风格和页面原有业务契约。
# 2026-10-20 SearchBar 默认输入迁移交接

- **实现**：共享 `SearchBar` 默认关键字输入已由 `el-input` 改为 `LxInput`；保留 `searchKey` 受控更新、清空、回车搜索、前缀图标和自定义筛选插槽边界。
- **验证**：目标 Prettier/ESLint、`vue-tsc --noEmit`、SearchBar 适配器单测 **2/2**、隔离 Mock 全菜单 Playwright **10/10** 通过。
- **边界**：未改变页面搜索 API、权限或请求链；页面级密码/textarea/复合前后缀输入仍需按旧 props、校验和错误恢复逐项迁移。Element Plus 删除、正式 Impeccable 和真实后端门禁仍未完成。
- **下一步**：继续选择低风险页面输入场景，迁移前补齐 Demo/Mock/表单上下文证据并保持中文文档和链式 API 风格。
# 2026-10-20 Sidebar 菜单输入迁移交接

- **实现**：`layout/components/Sidebar/index.vue` 的菜单搜索和全部菜单筛选由 `el-input` 改用 `LxInput`；旧 `size="small"` 映射为 lx-ui `size="sm"`，前缀图标、清空和过滤状态保持。
- **验证**：目标 Prettier/ESLint、`vue-tsc --noEmit` 和隔离 Mock Playwright **10/10** 通过。
- **阻塞**：尝试迁移 `policeExtend/virtualUser/EditVirtualUser.vue` 时，类型检查确认 `VirtualUserForm` 的 userName/contactNumber/appId/appSecret/remark 被声明为 number，而 `LxInput` 明确要求字符串值；已撤回该部分，未使用 `as any` 或强制断言掩盖问题。
- **下一步**：继续迁移字符串类型明确的页面输入；虚拟用户待 API/类型契约核实后再处理，Element Plus 删除门禁、权限和真实后端仍未完成。
# 2026-10-20 三方应用输入迁移交接

- **实现**：`baseData/thirdParty/index.vue` 的应用名称搜索与只读应用密钥改用 `LxInput`；保留 clearable、回车搜索、`type=password`、show-password 和 disabled。
- **验证**：目标 Prettier/ESLint、`vue-tsc --noEmit`、隔离 Mock Playwright **10/10** 通过。
- **边界**：未修改列表 API、权限或请求链；虚拟用户表单因文本字段 number 类型与 `LxInput` 字符串契约冲突仍未迁移。
- **下一步**：继续字符串类型明确的页面输入，补齐密码/textarea/前后缀和错误态证据后再扩大批次。

# 2026-10-20 authority 人员输入迁移交接

- 本批改动：`authority/person/index.vue`、`authority/imPerson/index.vue` 共 4 个姓名/身份证筛选框改用 `LxInput`，保留清空、回车搜索、占位文案和原请求契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；未修改 API、权限标识或 `.then().catch().finally()` 规则。
- LxInput 边框问题已在组件层处理：普通、密码、透传使用真实 `1px` 边框，复合前后缀由根节点提供连续外框；专项 E2E **2/2**。其余 authority 表单和真实权限联调仍未完成。

# 2026-10-20 dutyType 输入迁移交接

- `shiftScheduling/dutyType/index.vue` 的排班类型名称字段改用 `LxInput`，保留 `maxlength=100`、表单校验、弹窗提交和接口契约；`maxlength` 使用数字绑定以符合组件类型。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；未改变权限、请求链或 Element Plus 删除门槛。

# 2026-10-20 userManage 输入迁移交接

- `authority/userManage/components/EditUser.vue` 的用户名称输入改用 `LxInput`，保留新增/编辑禁用、失焦去空格、正则校验和最大长度 20；DataPermissionTree 与提交请求未改变。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**。复杂权限联调和剩余输入迁移仍未完成。

# 2026-10-20 location 输入迁移交接

- `location/components/EditLocation.vue` 的经纬度字段改用 `LxInput`，保留格式/范围校验、最大长度 25、组织选择和保存接口。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；请求链、权限和弹窗契约未改变。

# 2026-10-20 dutyInformation 搜索输入迁移交接

- `shiftScheduling/dutyInformation/components/DutySearchBar.vue` 的人员 ID、姓名两个输入改用 `LxInput`，保留清空、回车搜索和查询字段；排班类型分页、日期筛选、上传功能未改动。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；权限和 API 契约未改变。

# 2026-10-20 H5 标签查看搜索交接

- `h5/quick/LookLabel.vue` 的警员姓名搜索改用 `LxInput`，保留前缀搜索图标、清空、回车搜索、前端过滤和分页；标签树与详情请求未改动。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；真实后端和权限联调仍未执行。

# 2026-10-20 H5 快捷标签表单交接

- `h5/quick/index.vue` 标签编辑弹窗的名称、图标类名、颜色值改用 `LxInput`，保留动态长度、字数统计、颜色选择器同步、校验、License 分支和保存请求。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；权限和真实后端联调仍未执行。

# 2026-10-20 alertPush 搜索输入交接

- `notification/alertPush/index.vue` 双 Tab 的组织/协同岗名称和预警通知对象共 4 个输入改用 `LxInput`，保留清空、回车、类型筛选、分页、增改删和请求链。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；预警表单权限和真实后端联调未执行。

# 2026-10-20 eventType 第三方搜索交接

- `eventType/thirdParty/index.vue` 搜索区应用名称改用 `LxInput`，保留 SearchBar 插槽、清空、回车搜索和查询请求；密码、数字有效期、textarea 字段未改动。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；复杂字段待契约核对后再迁移。

# 2026-10-20 IcpAuthManage 搜索交接

- `thirdInterface/unifiedComm/components/IcpAuthManage.vue` 的姓名、身份证号、组织树筛选改用 `LxInput`，树筛选使用 `size="sm"`；保留清空、回车查询、部门过滤、开关、权限按钮和授权弹窗。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；真实权限数据与授权后端联调仍未执行。

# 2026-10-20 IcpServerConfig 文本输入交接

- `thirdInterface/unifiedComm/components/IcpServerConfig.vue` 的 IP、WSS、用户名、只读组织/摄像头及树搜索改用 `LxInput`，保留 append 操作、树选择、表单校验和提交契约；密码、端口未改动。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；服务配置真实后端联调仍未执行。

# 2026-10-20 南向与应用管理搜索交接

- `thirdInterface/southInterface/index.vue`、`thirdInterface/app/components/AppManage.vue` 的应用名称搜索改用 `LxInput`，保留 SearchBar、清空、回车、分页、状态和映射操作。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；任务配置、映射和真实第三方接口未改变。

# 2026-10-21 应用分类与授权树输入交接

- `GroupManage.vue` 的分类搜索/名称字段和 `AuthTreeModal.vue` 的树过滤字段改用 `LxInput`，保留清空、长度限制、树过滤、排序/应用选择和授权保存边界。
- 验证：类型检查、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；数字排序、应用编辑条件字段和真实权限接口未改动。

# 2026-10-21 AppForm 普通文本交接

- `AppForm.vue` 应用名称、H5 链接、安装包路径、Activity、鸿蒙 appId、启动参数共 7 个字段改用 `LxInput`，保留条件渲染、长度限制、表单校验、上传、选择器、排序和保存契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；数字/上传/选择器未机械替换。

# 2026-10-21 南向任务配置输入交接

- `TaskConfigModal.vue` 的任务名称、开始时间、结束时间表达式改用 `LxInput`，保留占位文案、校验、textarea、等级选择、紧急开关和保存契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；远程配置接口和 textarea 未改变。

# 2026-10-21 警务上报类型输入交接

- `TypeManage.vue` 类型标签搜索与 `TypeEdit.vue` 类型标签字段改用 `LxInput`，保留 SearchBar、清空、回车、长度限制、校验和保存契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；节点服务混合类型表单未改动。

# 2026-10-21 节点服务文本交接

- `ServerFormDialog.vue` 的 IP、名称、标签、备注改用 `LxInput`，保留编辑态禁用、长度限制、端口只读、表单校验、提交事件和 loading。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；端口和节点 API 未改变。

# 2026-10-21 警务对接文本交接

- `DockManage.vue` 系统名/IP/路径搜索与 `EditDock.vue` 名称、系统名、系统编码、IP、路径共 8 个普通字段改用 `LxInput`，保留 SearchBar、长度、启用开关、端口、JSON/脚本 textarea 和保存契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；警务真实接口和复杂文本内容未改动。

# 2026-10-21 客户端编辑输入交接

- `EditDialog.vue` 的名称、备注、标签改用 `LxInput`，保留最大长度、提交事件和 loading；拒绝理由 textarea 未改动。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；客户端 API 契约未改变。

# 2026-10-21 协同与 H5 搜索交接

- `colLevelManage.vue`、`ColSearch.vue`、`globals/index.vue`、`archivedTable/index.vue` 共 5 个字符串搜索输入改用 `LxInput`，保留清空、回车、前缀、组织选择、时间筛选和归档操作。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；协同权限和归档真实接口未改变。

# 2026-10-21 H5 轮播输入交接

- `CarouselForm.vue` 的标题、跳转链接改用 `LxInput`，保留条件渲染、长度、校验、上传、公众号/文章选择、排序和保存契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；上传和选择器未改变。

# 2026-10-21 预警编辑只读输入交接

- `TaskDueEditForm.vue`、`UnattendedEditForm.vue` 共 4 个只读组织/协同岗字段改用 `LxInput`，保留 disabled、通知对象选择、校验和提交契约。
- 验证：`vue-tsc --noEmit`、目标 Prettier、ESLint、隔离 Mock 全菜单 **10/10**；预警 API 和复杂选择器未改变。
