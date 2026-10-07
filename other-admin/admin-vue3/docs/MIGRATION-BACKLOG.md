# Vue2 到 Vue3 迁移 Backlog

## 2026-10-07 lx-ui Wave 4 组件门禁收口

- DynamicForm/DatePicker/Upload 组件单测 **89/89**、三份文档 E2E **43/43**；最新 DatePicker/Upload 子集 **31/31**。新增短视口弹层关系、面板滚动和上传文件名可访问名称回归；Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块库构建和文档构建通过。证据对应组件库本身及本地 Mock，不表示 Vue3 业务页已采用。
- Upload ref 类型边界、上传必填字段 ARIA 回归及 `LxFormItem` 同批次字段反馈移除/`clearValidate()` 的观察器风险均已修复；独立代码复审未发现 P0–P2。Assessment A 30/40；B 六项目标 detector 有效 `[]`、空 stderr、exit 0，浏览器 overlay 已完成归因。
- 本波没有修改业务 API、路由、权限键或 Vue3 页面，没有删除 Vue3 宿主 `element-plus`，也没有真实上传服务端联调。后续仍按计划优先完成 TreeSelect/Cascader 与 `LxSelectPagination`，全库 lx-ui 门禁后再开展宿主组件替换。
- lx-ui 文档 E2E 已从被其他项目占用的 4176 隔离到 4177；三组件文档 E2E 43/43 与 Switch 兼容用例 6/6 通过。当前仍是组件库和本地 Mock 证据，不代表 Vue3 业务页面已采用。
- 组件与测试提交为 `a2ba943`。Impeccable snapshot 已保存；trend 查询仅有本目标首次 30/40 记录。代码复审指出的 fallback UID 回灌后公开 `abort()` 组合测试列入后续 Upload 复验。

## 2026-10-06 DynamicForm / Upload 复审修复边界

- 独立代码复审发现 `LxUpload` 跨实例回退 UID 冲突并已修复；新增两个组件实例接收相同无 UID 文件的单测。DatePicker/DynamicForm/Upload 单测 69/69、UID 修复后文档 Playwright 13/13、lx-ui 类型检查、203 模块构建、文档构建、目标 Prettier 和 Vue3 ESLint 通过。第二次独立代码复审批准，未发现可复现 P0–P2。
- 此前 Impeccable A/B 文件冻结不一致，B 浏览器证据不完整，不能标记正式通过；统一冻结后的 A/B 待完成。
- 本轮仍无 Vue3 业务页面采用 DynamicForm 的证据，也未迁移 Element Plus、改动 API/路由/权限键或触及真实上传协议。

## 2026-10-06 DynamicForm 日期清空值契约补齐

- `LxDatePicker` 基于 Element Plus 2.14.6，日期区间使用默认清空行为时发出 `null`；组件事件类型、DynamicForm 受控字段回写、中文文档与 Demo 已同步该值形状。
- 该改动只校正 lx-ui 公共类型和文档 Mock 回归，没有 Vue3 业务页使用方，也没有替换 Element Plus 控件、API、路由或权限逻辑。
- DatePicker/DynamicForm/Upload 定向单测 69/69、UID 修复后 DynamicForm/Upload 文档 Playwright 13/13 通过；测试覆盖日期区间实际清空、受控字段回写 `null` 和跨实例文件 UID 唯一性。实际命令与评审边界见 `doc/PROJECT-HANDOFF.md` 最新交接记录。

## 2026-10-06 DynamicForm 组件库验收边界

- 本轮完善 `linkx-fe` 的 DynamicForm/LxUpload 组件契约、中文说明和组件级回归；Vue3 项目目前没有 `LxDynamicForm` 业务页面使用方，因此本轮不登记宿主迁移完成。
- 47 项定向单测、13 项 lx-ui 文档 E2E 与类型/构建检查通过；其中 1 项新增默认日期区间清空回归验证 `null` 事件载荷，详细交接见 `doc/PROJECT-HANDOFF.md` 和 `linkx-fe/docs/DELIVERY-CHECK.md`。
- 本轮未替换业务 API、路由、权限标识或 Vue3 页面中的 Element Plus，也未删除宿主依赖。真实上传与远程查询仍由宿主提供 adapter，真实后端取消和权限联调单列验收。
- DynamicForm/Upload 组件级完成后，计划继续 TreeSelect/Cascader 当前版本 Critique 和远程分页选择闭环；全库 UI-10/UI-11 门禁结束前不启动 Element Plus 全量替换。

## 2026-10-06 Wave 3 / LxIcon 组件侧交接

- 本轮修改限于 lx-ui 图标运行时类型/回退、侧栏和上传图标调用点、中文图标文档及文档 E2E；没有迁移 Vue3 业务页、改 API/路由/权限键/后端协议，也没有删除 Vue3 Element Plus。
- 单测 7/7、浏览器 E2E 当前配置复跑 2/2（单 Chromium 项目，覆盖桌面与 320px 窄屏交互；375px 由独立浏览器评估覆盖）；类型、Vue3 测试文件 ESLint、目标 Prettier、196 模块库构建和文档构建通过。文档搜索、主题、触控、键盘和减少动效均使用本地页面，无真实后端请求。
- Impeccable A 修后 37/40（修前 33/40）；独立 B 的组件/文档 detector 均为 JSON `[]`、stderr 空、退出码 0，五个浏览器 overlay context 全部成功。清除回焦、搜索布局、权限组合样例和主题空态均有修后复验；`[]` 只表示静态规则零命中。长分组与无 URL console 404 分别保留 P2 和未归因观察。
- 图标类型和演示可供后续宿主迁移复用，但本波未替换 Vue3 业务页图标、Element Plus 图标或权限数据，也不代表 UI-10/UI-11 全库门槛完成。后续 DynamicForm 组件层状态见本文件顶部；不代表 Vue3 宿主使用方已迁移。

## 2026-10-06 Wave 1 / PasswordInput 组件侧交接

- 本轮修改限于 lx-ui PasswordInput Demo、中文 API/文档样式和文档 E2E；没有迁移 Vue3 业务表单、修改 API/路由/权限/后端协议，也没有删除 Element Plus。
- 组件单测 10/10、文档 Playwright 9/9；覆盖真实移动目录锚点、亮/暗/HUD、键盘显隐、离焦遮罩、清空、只读/禁用、44px 设置项和减少动效。Vue3 类型检查、定向 ESLint/Prettier、lx-ui 类型与文档构建通过。
- 独立代码复审批准。Impeccable A 32/40；B 三个 detector 均为有效 `[]`、空 stderr、退出码 0，overlay 命中经核验属于 HUD 主题提示或 VitePress 文档壳层。报告与证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`。
- 密码字段校验失败、错误文案和 ARIA 关联已加入 DynamicForm 组件级样例与测试；真实登录/改密仍需后端联调。动态图标和 DynamicForm 组件层验收已推进，宿主 Element Plus 替换继续冻结。

## 2026-10-05 Wave 2 / LxSelect 组件侧验收

- 本次修改限于 lx-ui、中文组件文档和文档 E2E；没有替换 Vue3 业务页，没有改请求 API、路由、权限键或后端协议。
- 组件单测 10/10、当前文档 Playwright 3/3，覆盖本地 Mock 的成功/空/失败与弹层开合两态恢复、键盘、单项禁用、HUD 局部令牌和 320px 行高。严格 locator 排除了同样带 `lx-select__popper` 的折叠标签 tooltip。类型、目标 ESLint/Prettier、组件库构建和文档构建通过；主会话另完成当前版本 HUD/失败状态与窄屏的阶段性现场检查。
- LxSelect 的配置式 options、插槽和远程状态能力可供后续宿主迁移；实际业务接口继续由宿主按 `.then().catch().finally()` 提供，不把 Demo Mock 当作迁移或真实联调证据。
- Luna max 独立代码复审批准。正式 Impeccable overlay、当前版本持久截图与 snapshot/trend 尚未完成，UI-10 严格行保持开放；库级 UI-10/UI-11 门禁结束前保留 Vue3 宿主 Element Plus 依赖。

## 2026-10-05 Wave 2 / DatePicker 短视口边界

- 本子项只修改 lx-ui DatePicker、中文 Demo/API 文档和文档 E2E；未改 Vue3 业务页面、请求 API、权限键、路由或后端协议。
- 文档 E2E 16/16、DatePicker/DynamicForm 定向单测 39/39；lx-ui 类型检查、库构建、文档构建及 Vue3 目标 ESLint/Prettier 通过。
- 320/375/390px 与短视口验证覆盖原生锚定和越界居中两种定位；短屏外框完整入屏，末行在面板内滚动可达，页面滚动保持不变。当前证据属于组件文档，不代表宿主业务页迁移或真实后端验收。
- Assessment A 31/40、Assessment B 9 个浏览器场景、独立代码审核已完成。字段上下文、滚动提示和桌面边距建议仍待整改，因此 DatePicker 严格矩阵行保持打开。
- 下一组件入口为 `LxSelect`；lx-ui 全部组件严格检查与 UI-11 结束前继续保留 Vue3 宿主 Element Plus 依赖。

## 2026-10-05 Wave 2 / DatePicker 文档边界

- 当前只调整 lx-ui DatePicker 文档 Demo、窄屏弹层宽度和对应文档 E2E；未改 Vue3 业务页面、API、权限键、路由或后端协议。
- 文档 Playwright 12/12；Vue3 定向 ESLint 与 Prettier、lx-ui 类型检查/构建/文档构建通过。代码审核批准；HUD 对比度测试拒绝透明色的回归也已通过。
- 375×812 的常用区间弹层初始底部越界约 54px，页面滚动后末行可见、可选且焦点稳定。当前证据针对文档 Demo，不代替宿主业务页迁移或真实后端验收。
- 下一组件入口为 `LxSelect`；保留现有宿主 Element Plus，直到组件库严格检查和 UI-11 门禁完成。

## 2026-10-04 基础控件迁移边界

`LxPasswordInput` 的密码类型由组件显隐状态控制，未声明属性 `type` 只能透传其他语义，不能覆盖遮罩。剪贴板默认允许；`preventClipboard` 是组件前端交互选项，不作为宿主或后端凭据安全措施。登录和改密仍需独立的真实认证联调。

## 2026-10-04 后续迁移波次拆分

组件库、权限、Mock、登录页、动态图标和宿主替换的完整执行拆分见仓库文档 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`。Wave 0 已修复 `LxDatePicker` 相邻实例说明 ID 隔离，DatePicker/DynamicForm 定向测试 36/36；组件库正式 Critique 仍待补。当前入口为 Wave 1 基础控件第一组，之后按其余 lx-ui、宿主 Element Plus 分批替换推进。所有 API 请求继续使用 `.then().catch().finally()`；中文文档和注释规则、Impeccable `[]` 证据规则以及真实后端阻塞口径以该拆分文档为准。

## 2026-10-03 UI-13 DynamicForm 字段反馈复验

- Vue3 集成以 `lx-ui` 的 `LxDynamicForm` 为对照；日期字段反馈说明现在到达可聚焦的日期输入框，并覆盖 ID 更新/移除及两个相邻日期字段的隔离回归。
- 验证：DynamicForm/DatePicker 定向单测 34/34、lx-ui 文档浏览器 E2E 1/1、Vue3 `vue-tsc --noEmit` 和目标 ESLint/Prettier 通过；本波未修改业务 API 或真实后端协议。
- Impeccable A 桌面评审 29/40（Good），Demo 固定 loading、最小 schema 文档建议已落实。B 的 detector 为 `[]`、stderr 空、退出码 0，仅代表静态零命中；浏览器不提供可变注入接口，overlay 未运行，正式 Critique 未关闭，未生成正式快照。
- Vue3 Element Plus 页面替换仍按组件库计划后续执行；本条是组件库字段反馈验收，不代表宿主业务页迁移完成。

## 2026-10-03 lx-ui Wave 6 交付与宿主替换门槛

- TreeSelect/Cascader 库级实现、行为测试、文档 E2E 已收口：单测 17/17，lx-ui 文档 Playwright 8/8（VitePress 4176）。当前正式 Impeccable Critique 未收口：旧 overlay 早于当前代码/文档修改，本次浏览器策略拒绝注入预检；detector `[]` 只表示静态零命中。该项仍不代表 Vue3 页面已经替换 Element Plus。
- Vue3 宿主继续保留自身 `element-plus` 依赖。必须先完成基础控件严格 UI 批次、其余 lx-ui 组件和 UI-11 全库 Critique，再按 `ELEMENT-PLUS-LX-UI-MATRIX.md` 分批替换页面并回归受影响业务。
- API 请求继续使用 `.then().catch().finally()`；权限中心、按钮/文本/字段权限和引导页仍为延期新需求，不能混入本轮组件迁移完成度。

## 2026-10-02 TreeSelect/Cascader 行为补齐（2026-10-03 行为复验）

- `LxTreeSelect` 多选 footer 按 locale 显示中英文计数/操作文案，提供 `selectedText`、`unselectedText`、`cancelText`、`confirmText` 覆盖；宿主单测覆盖默认英文和自定义文本。
- `LxCascader` 统一并发 loading/error 契约：loading 中不声明输入错误、不呈现错误或重试；loading 结束且 error 保持时显示失败和重试。Demo 单独播报简洁操作结果，值显示不再重复 live announcement。
- 单测 17/17、lx-ui typecheck/build/docs build、Vue3 `vue-tsc`、Prettier、TreeSelect/Cascader 文档 Playwright 8/8 通过；Playwright 使用 `playwright.lxui.config.ts`，真实后端不在本波范围。
- 当前源码及两份组件文档 detector 均为 JSON `[]`、stderr 空、退出码 0；这仅代表静态零命中。当前正式 Impeccable Critique 尚未完成，不能引用 10 月 2 日旧 overlay 关闭此项。该项不代表 Vue3 Element Plus 替换或 UI-10 全库完成。linkx-fe 无独立 ESLint 配置，Vue3 ESLint 的 ignored 输出不记为组件库 Lint 通过。

## 2026-10-02 本地预览增量回归

- 全菜单 32 个路由、全部菜单目录和北向接入 Mock CRUD 已在 `preview.spec.ts` 复跑通过；轮播文章分页的页码 1/2、唯一选项和 AuthImg 失败/重试/减少动效场景均通过，预览套件共 6/6。
- 轮播文章分页增加请求锁、失败页码回退、文章 ID 去重和公众号切换请求代次保护。定向 E2E、目标 ESLint、Prettier 和 `vue-tsc --noEmit` 通过；仅为 Mock/browser 证据，真实后端及其他 v-loadmore 宿主仍待逐页验证。
- `LxInputNumber.controls` 默认显示步进按钮，传 `false` 隐藏，API/Demo/行为测试与浏览器验收已具备；Vue3 Element Plus 替换门槛仍按 UI-10/UI-11/UI-04 执行。

## 2026-09-30 lx-ui 基础组件审查批次

Vue3 宿主替换前新增基础组件门槛：先严格审查并稳定 `LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、Checkbox/Radio 组、`LxSwitch`、`LxPasswordInput` 的设计和交互，再按矩阵逐页接入。宿主现有 `element-plus` 依赖继续保留，直到组件库 UI-10/UI-11 和受影响页面回归完成。

2026-09-30 UI-10 Wave 5 postfix：`LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 的宿主回归证据已更新。Dialog/Drawer/PageCard 相关单测和文档 E2E 通过，组件 A/B 证据位于 `.impeccable/critique/wave5-postfix-2026-09-30/`；Assessment A 34/40，Assessment B 为 Playwright fallback 的降级浏览器证据。宿主业务页尚未批量替换 Element Plus，真实后端联调仍单独跟踪。

## 2026-09-29 追加记录

- GLM #1 lx-ui 全局注册：使用显式 `Lx*` 注册表注册 39 个组件，插件单测 1/1；lx-ui 类型检查、库构建、VitePress 文档构建及 Vue3 全量单测 39 文件/200 项通过。代码审核无新增可复现问题。linkx-fe 没有独立 ESLint CLI，不将 Vue3 配置忽略视为通过；无视觉变化，不需要 Impeccable 检查。GLM #2 Cascader 值契约现已按 Element Plus 的 string/number/record object 完成修正；SearchBar 6 项单测、ColForm 竞态 E2E 4/4、lx-ui typecheck/build/docs build 和正式交接记录通过。
- CODE-02：`useFetch`/`useTable` 请求取消、迟到响应和重试清理回归 9/9 通过；`v-loadmore` 现按输入的 `aria-controls` 绑定延迟 teleport 的滚动容器，并在更新和卸载时同步/清理。定向指令单测 3/3；`preview.spec.ts` 轮播文章分页 Mock E2E 1/1，实际请求页码为 1、2 并显示第 21 项。
- GLM #10/#11：重复提交锁 Mock E2E 5/5；ColForm 人员搜索取消/代次/关键词分页 Mock E2E 最终 4/4，旧 handler 与首屏响应已建立明确等待。正式 Impeccable Luna `max` A/B 均已完成；额外发现 `/authority/adminRole` 与 `/authority/adminPerson` 写操作缺锁，作为 CODE-03 排期，不混入旧 #10 结论。
- Vue3 `vue-tsc --noEmit`、相关文件 ESLint/Prettier 和 `git diff --check` 通过。Mock E2E 只验证轮播文章这一宿主和本地拦截数据，不等同真实后端联调，也不声称权限页和协同页的所有下拉场景均验收完毕。
- Impeccable detector 返回 `[]` 一律先按待调查信号处理：检查 JSON、stderr、退出码和目标可访问性；通过后仍只可记为对应源码范围的静态零命中。缺少隔离 A/B、浏览器状态/overlay 证据或正式 snapshot 时不得写成复验通过。
- Element Bridge 历史 inset 记录已被 2026-09-28 最终单边框方案取代；当前单选/多选使用自身 1px `border-box` 边框、只切换状态色且没有额外 `box-shadow`/`outline`。30/40 正式评审与证据见 `doc/PROJECT-HANDOFF.md`。

## 2026-09-28 追加记录

- 最新选择器实现使用自身 1px `border-box` 实体边框，状态只切换边框色，选择器无 shadow/outline。旧 inset 记录仅保留为历史。
- 最终 Impeccable A/B 有独立浏览器 overlay、截图、computed style、stderr、退出码和 30/40 snapshot；detector `[]` 不能独立作为通过依据。P2/P3 的窄屏弹层、错误文字对比度、选项行高继续排期。
- CODE-02 已修复 useFetch/useTable 请求竞态和取消基础能力，详情见 `docs/CODE-REVIEW-VALIDATION.md`；License、v-loadmore、提交锁、ColForm、AuthImg 已完成代码或 Mock 验收。#10 正式 Impeccable Critique 仍待环境恢复；其他 UI 替换按计划继续。

状态含义：`源码对照` 表示完成静态核对；`单测`、`Mock`、`E2E`、`真实联调` 分开记录；`延期`表示经确认移出当前范围，不等于完成。

指标卡库级验收已完成：`LxMetricCard` 保留 lx-ui 既有接口并兼容宿主 `title`、`valueType`、`footer` 与命名插槽，6 项单测和 2 项文档浏览器用例通过。Vue3 `ClientDetailDrawer.vue` 当前有 6 个宿主组件实例，仍需在 UI-04 替换波次逐项验证数值/插槽契约及抽屉布局；库级证据不代表宿主页面已迁移。

鉴权图片库级验收已完成：`LxAuthImg` 通过宿主注入 Blob 请求，不读取 Token；6 项单测、3 项文档 Playwright 覆盖公开图片、成功/失败、回退、空地址、取消竞态和对象 URL 清理。Vue3 仍由各业务页面的 `AuthImg` 适配器提供鉴权请求，须在 UI-04 转为链式 Blob 适配器并逐页核对图片字段、尺寸/fit、fallback 及错误反馈；真实鉴权接口未联调。

2026-09-29：Vue3 `AuthImg` 已增加站内鉴权 Blob API 与链式处理、外站地址拦截、取消/迟到响应保护、失败重试和 ObjectURL 清理；10 个宿主图片调用补 `alt`。定向单测 12/12、Mock E2E 3/3。后续 UI-04 仍需将 Element Plus 图标/宿主实现替换为 `lx-ui` 的 `LxAuthImg`/`LxIcon` 并逐页核对尺寸、fit 和失败反馈；真实后端及正式 Impeccable 双路 Critique 尚未完成。

`LxPasswordInput` 已补独立中文 API/Demo 和文档 Playwright，覆盖显隐/清空、受控输入、公开 focus/blur/select、默认剪贴板可用与显式拦截、只读/禁用及窄屏 HUD。密码类型由组件内部状态控制，调用方透传 `type` 不得覆盖遮罩；`preventClipboard` 是前端交互策略，不代表宿主或服务端安全控制。宿主适配器测试与组件回归分开记录；真实登录/改密联调仍未完成。

| 模块                      | 入口                                                  | 当前状态                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 未完成事项                                                                                                                                                                                                                               | 验证证据                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 全菜单本地首屏预览        | `pnpm dev:mock`、静态首页 + 32 个动态 Vue3 业务入口   | 2026-09-28 专用隔离预览 E2E 复跑 2/2；10 个分组、32 个动态子菜单和首页目录逐项对应，33 个页面首屏样例、目录筛选、未知 API 和北向 CRUD 检查通过；Chrome 稳定截图已留档                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 各页面深层操作、权限组合及真实联调仍按业务模块逐项验收；首轮冷启动发生一次导航超时，完整复跑通过，原因待观察                                                                                                                             | `tests/e2e/preview.spec.ts`、`test-results/mock-preview-all-menus.png`                                                                                                   |
| 北向接入管理              | `/thirdParty/thirdParty`                              | Vue2 字段/API 已对照；列表、筛选、详情、增改删代码已迁移；2026-09-28 隔离预览套件含北向筛选/增改删，完整 2/2 通过                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 按钮权限码等待可信后端契约；真实后端联调未执行                                                                                                                                                                                           | `views/eventType/thirdParty`、`mock/preview-server.ts`、`tests/e2e/preview.spec.ts`                                                                                      |
| 登录、登出、401、账号切换 | `/login`                                              | 源码对照、单测、Mock、E2E 已有                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 真实 License/心跳联调                                                                                                                                                                                                                    | `tests/unit/auth*`、`migration.spec.ts`                                                                                                                                  |
| 权限与动态路由            | `/authority/*`                                        | 默认业务 E2E 77 项通过；菜单/部门树失败恢复、人员按钮码、ID 2/6 特殊角色、userManage 身份直达、IM 绑定工作流 3 项通过                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | IM 权限配置与人员设角验收；真实菜单/License 联调；后台角色成员读取契约确认                                                                                                                                                               | `router/*`、`tests/e2e/permission-matrix.spec.ts`、`tests/e2e/authority-bind-workflow.spec.ts`                                                                           |
| 页面/按钮/文本权限        | 所有受保护页面                                        | Vue2 有来源的菜单过滤、已确认按钮码和管理员例外已迁移；按钮/文本消费框架已有测试                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 文本/字段权限、无旧版权限码的操作授权和新权限中心流程延期；现有迁移回归继续保留                                                                                                                                                          | `filterChain.ts`、`usePermission.ts`、权限 Mock、交付计划延期范围                                                                                                        |
| 角色与人员                | `/authority/role`、`/authority/person`                | 角色/部门树失败保护、人员按钮码、ID 2/6 特例、管理员账号门禁及 IM 角色批量绑定已有 Mock E2E                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 角色成员读取/回显/绑定仍为 Vue2 TODO/空 Mock，新增工作流延期；真实身份/后端联调另跟踪                                                                                                                                                    | `EditRole.vue`、`EditUser.vue`、`DataPermissionTree.vue`、`tests/e2e/permission-matrix.spec.ts`、`tests/e2e/authority-bind-workflow.spec.ts`                             |
| 基础数据                  | `/baseData/*`                                         | 全局参数 CRUD/权限、地图/区划文件、App H5 板块 CRUD、协同群组配置 ID 回填、PC 页签回读、统计 Excel；基础数据 Mock E2E 33/33 通过                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Mock/E2E 范围已完成；真实后端联调由 P1-07 跟踪                                                                                                                                                                                           | `tests/e2e/base-data-workflow.spec.ts`、`MIGRATION-MATRIX.md`                                                                                                            |
| Vue3 API 调用风格         | Vue3 宿主页面、组件和请求编排工具                     | 页面、共享组件、`useTable`/`useFetch`、菜单/License 初始化、HTTP 401 登出、会话及 PC 页签保存均按 Promise 链收敛；静态扫描无直接业务 API `await`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 代码迁移无剩余；真实后端联调由 P1-07 跟踪                                                                                                                                                                                                | `AGENTS.md`、`doc/PROJECT-DELIVERY-PLAN.md`、`PROJECT-HANDOFF.md`、`tests/unit/auth-http.test.ts`、`tests/unit/use-fetch.test.ts`、`tests/e2e/permission-matrix.spec.ts` |
| 节点管理                  | `/nodeManage/*`                                       | 代码已迁移、Mock 有限                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 浏览器窄屏、客户端拒绝真实联调                                                                                                                                                                                                           | `clientManage`、`ui-audit.spec.ts`                                                                                                                                       |
| 智能体                    | `/thirdParty/agentInterface`                          | 配置、分类、文件、查询记录、虚拟用户绑定请求已按 Promise 链风格收敛；Vue3 全量 Vitest 60 项通过；无专属 Mock E2E                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 绑定虚拟用户、分类持久化 Mock 验收和真实后端字段核对；新增细粒度按钮权限延期                                                                                                                                                             | Agent 组件、API helper、`doc/PROJECT-HANDOFF.md`                                                                                                                         |
| 南向/通信                 | `/thirdParty/southInterface`、`unifiedComm`           | 统一通信和南向 Mapper、任务配置及应用详情/增改请求已按 Promise 链风格收敛；暂无南向专属 Mock E2E                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 任务标准件和设备类型完整业务验收、真实联调                                                                                                                                                                                               | 对应组件、API 文件、`doc/PROJECT-HANDOFF.md`                                                                                                                             |
| 应用/警单                 | `/thirdParty/app`、`/thirdParty/policeReport`         | 应用/分组管理、图标上传、上下架、Dock/警单类型与详情 API 请求已按 Promise 链风格收敛；暂无专属 Mock E2E                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 分组/上下架、警单 Dock 和类型的 Mock 交互验收及真实联调                                                                                                                                                                                  | App/警单组件、`doc/PROJECT-HANDOFF.md`                                                                                                                                   |
| 位置、协同、排班          | `/location/*`、`/collaboration/*`、`/scheduling/*`    | 排班 Mock E2E 4/4；协同下岗 Mock E2E 1/1，验证最后一人确认、失败重试、成功回查及 `switchType=3`；位置/协同/排班 API 风格已收敛                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 协同组织/职能树、层级挂靠、上下岗记录筛选/导出、批量操作、位置查询/状态切换及真实后端联调仍待验收；受共享搜索/树/表格组件替换影响的深交互 E2E 排在 lx-ui 宿主替换后                                                                      | `tests/e2e/shift-scheduling-workflow.spec.ts`、`tests/e2e/collaboration-workflow.spec.ts`、`MIGRATION-MATRIX.md`、`doc/PROJECT-HANDOFF.md`                               |
| H5 群组标签、归档、预警   | OAuth `GroupTags`、`/h5/*`、`/notification/*`         | GroupTags、H5/协同快捷标签、轮播和归档 API 已按 Promise 链改写；归档沿用 Vue2 `/policeExtend/ArchivedTable` 并保留 H5 地址重定向；旧 Font Awesome 字符串由本地 `LxIcon` 映射渲染，接口值不变                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | GroupTags 补完整权限和真实联调；轮播/归档下载、批删和同步配置 Mock；补其余入口对照                                                                                                                                                       | 路由台账、`preview.spec.ts`、`group-tags.spec.ts`                                                                                                                        |
| lx-ui 设计与宿主接入      | `design/`、`doc/LxIcon*`、`linkx-fe`、Vue3 公共适配器 | SearchBar、ProTable、PasswordInput、Breadcrumb、Navbar、SectionTitle 已接入 lx-ui；SearchBar 6 项值/交互行为测试及 375px 状态浏览器证据通过，Cascader 保留 string/number/record object 原值；Dialog 4 项单测、文档 Playwright 3/3（375px 无溢出、标题可访问名称、44px 点按目标、减少动效、校验/提交/ESC/footer）通过；LxForm 文档 Playwright 2/2 覆盖桌面双列/16px 间距、span 通栏、390/320px 单列、校验和键盘顺序；SelectPagination 独立 API/Demo 与文档 Playwright 3/3（跨页回显、搜索取消、错误/空态和 375px 触屏）通过；Descriptions 6 项单测和文档 Playwright 3/3（32px 紧凑行、复制键盘焦点、状态点、375/320px 抽屉边界、主题、减少动效），组件级 Impeccable 19/20 且 detector `[]`；LxSidebar 独立 API/Demo 与文档 Playwright 2/2（分组键盘、单次选择、rail 焦点、移动模态抽屉、HUD、减少动效）通过，但正式视觉/动效审查待 UI-11，Vue3 侧栏仍是权限路由驱动的 Element Plus 菜单；首批图标使用 LxIcon；GroupTags 窄屏表格/分页 E2E 4/4；VirtualTree 8 项单测及桌面/375px HUD 深色浏览器验收完成；LxPagination 5 项库单测、2 项适配器单测和文档 Playwright 3/3 通过；图标目录 96 个名称/69 个动效有单测和浏览器证据；其他设计源到组件及宿主页面闭环仍未完成 | 补全其余设计映射、Demo/交互/浏览器验收；迁移 ActionButtons、StatusSwitch、Upload、Descriptions、SelectPagination、树/穿梭、指标卡、LxSidebar 及剩余 Vue3 图标；保留权限菜单搜索/完整目录契约，库完成与宿主完成后分别执行 Impeccable 审查 | `linkx-fe/docs/ROADMAP.md`、`linkx-fe/docs/DELIVERY-CHECK.md`、`other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`、Vue3 单测及 E2E、`doc/PROJECT-HANDOFF.md`     |

Vue3 共享 `Pagination` 适配器已使用 lx-ui `LxPagination`，`tests/unit/pagination-adapter.test.ts` 2 项回归保留 `page/limit/pagination` 旧事件契约；组件库与适配器证据不代表业务页直接使用的分页组件已迁移。

2026-09-28 lx-ui 表单桥接补充：输入框、选择框和文本域聚焦样式现按 `design/表单控件八件套/` 使用控件边缘 1px 状态边线及紧邻的 2px 淡色主色光晕；校验错误态保留红色边线，主色光晕继续单独提示焦点。基础控件及 LxForm 文档 Playwright 共 3/3、lx-ui 类型检查通过；Vue3 的 `el-form`/`el-form-item` 仍按 UI-04 保留原校验、提交和宿主契约逐页适配，库级样式验收不代表宿主替换完成。

2026-09-28 多选下拉焦点样式二次修正：浏览器复核认为上一版 2px inset 仍像额外套上的粗边线。当前改为单选/多选共用 1px 实体边框，各状态只改边框色，不叠加 outline/shadow；以 `border-box` 与 `3px 11px` 内边距保持 32px 控件高度及原内容起点。实际浏览器已复核浅色键盘焦点，Playwright 和构建门禁待本条交接补记；此为 lx-ui 样式改进，不表示 Vue3 业务表单已替换。

2026-09-28 多选下拉外圈按用户实览复修：用户指出 2px、15% 主色 halo 在当前页面仍像第二道轮廓，已撤除标签态外扩阴影并统一单选/多选自身 1px 边框；普通态为主题主色，错误态保留高对比错误色。此前 29/40（Good）Critique 只作为上一版记录，不代表本轮修改的评审结论；本轮双路复评完成后补充最新分数、detector、截图及快照。移动弹层遮挡字段标签、错误文案约 4.4:1 和选项行高 34px 保留为独立可访问性/布局待办。Vue3 业务表单仍待 UI-04，证据详见 `doc/PROJECT-HANDOFF.md`。

2026-09-28 壳层组件库级回归：`LxBreadcrumb`、`LxNavbar`、`LxTabsBar`、`LxPageCard` 的文档 Playwright 4/4 通过，覆盖路由事件、通知/用户菜单、页签交互、具名 region 和 375px 容器。Vue3 实际业务页面的路由/动态菜单组合仍需 UI-04 逐页验证；UI-11 整库 Impeccable Critique 仍等待 UI-10 闭环。

## Element Plus / lx-ui 依赖迁移

2026-09-27 `LxEmpty` 库级闭环：独立 API/Demo、5 项单测、文档 Playwright 1/1、组件库构建和文档构建通过；`imageSize` 兼容 Vue3 两处 `image-size=80`，宿主 `class` 继续落到根节点。15 处宿主 `el-empty` 仍待 UI-04 替换；组件库尚有其他候选未闭环，UI-11 整库 Impeccable 审查仍排在 Vue3 替换之前。

2026-09-27 组件库复核：`LxSectionTitle` 的 `size`、`tag`、`tagType` 已透传到 Vue3 适配器，库级及文档浏览器验收通过；`LxIcon` 动效曲线和 `LxUpload` 进度呈现已按 Impeccable 预检建议修订。配置页组合回归与剩余 Element Plus 替换仍待各自迁移波次。

`LxStatusSwitch` 库级验收已完成：独立中文 API/Demo、6 项单测和文档 Playwright 3/3 覆盖旧值映射、确认取消、只读、失败恢复、对比度、键盘焦点、窄屏点按区、主题及减少动效。Vue3 `src/components/StatusSwitch` 尚未采用该组件；等其他 lx-ui 候选闭环并完成整库 Impeccable 审查后，再在 UI-04 波次核对 props、事件和 `0/1` 值语义并替换。

UI-09 的 46 种标签映射、25 种没有通用 Lx 封装的控件、103 个 Element Plus 直接导入源文件及宿主依赖移除门槛见 [ELEMENT-PLUS-LX-UI-MATRIX.md](./ELEMENT-PLUS-LX-UI-MATRIX.md)。盘点已完成；直接导入、自动导入、类型声明、全局样式和 Vite 配置仍待迁移。按调整后的优先级，先完成将被采用的高频 lx-ui 组件及接入层，再分批替换 Vue3 页面；受这些组件影响的业务深交互验收跟随替换波次进行。API、字段和 Vue2 既有权限契约核查不受此顺序阻塞。

`design/` 的组件稿与 `doc/LxIcon*` 的动态图标已纳入接入清单。Vue3 还有其他页面和操作入口尚未采用 lx-ui；其余库组件存在不代表页面已完成替换。Vue3 仍有 Element Plus 图标直接导入，剩余数量在页面迁移完成后统一复核。Impeccable 审查分两道门：先审 lx-ui 组件和动画，再在 Vue3 组件迁移后审全站页面。未来迁入 Vue3 的 Vue2 页面按映射表优先使用 lx-ui。

本轮完成 `LxProTable` 独立 API/Demo 和文档浏览器 4/4；修复跨页选择在外部 `selectedKeys` 同步时丢失可见勾选的问题，并补充加载读屏状态、减少动效、方向键横向滚动和触屏选择范围。业务 ProTable 适配层仍待替换波次的真实页面回归，Vue3 Element Plus 依赖尚未进入删除门槛。

`LxTransferPanel` 已对照 `design/虚拟滚动树 + 双栏穿梭/` 补齐全选/反选、批量按钮禁用、`maxCount` 原子上限、树外既有键及禁用键保留、右侧清空事件和 44px 移动端触控。独立 API/Demo、4 项单测及文档 Playwright 3/3 仅证明库级能力；Vue3 `DataPermissionTree` 仍是业务实现，后续 UI-04 必须逐项比对 props、实例 exposes、父子勾选、已选项映射和变更回传，再做该宿主的 Mock/E2E。

`LxActionButtons` 库级证据已补齐：3 项单测和 3 项文档 Playwright 覆盖隐藏/禁用项、click 事件、溢出操作、键盘展开、Escape 焦点恢复、外部点击/焦点移出收起、375px 44×44px 触控、HUD 深色和减少动效。Vue3 的 29 处引用仍使用宿主组件；UI-04 需保留数组配置与预设动作、原图标映射、单项 `onClick`、gap、禁用及权限过滤语义，不能直接机械替换。

`LxSplitLayout` 库级 API/Demo、3 项单测和 3 项文档 Playwright 已完成；桌面折叠/键盘拖动限宽、375px 局部滚动与主题状态通过。该组件目前尚未接入 Vue3 业务页；UI-04 需按页面对照树/表工作区契约并回归。正式 Impeccable Critique 仍待 UI-10 候选闭环后执行。

## 路由差异待决

- 核对 `/baseData/thirdParty` 与 Vue2 `thirdInterface` 的菜单来源，禁止只凭路径相似合并。
- Vue3 新增 `/h5/carousel` 需确认是否为现役菜单，未确认前仅记录为新增入口。

## 交互兼容检查表

- 搜索重置是否恢复 Vue2 默认值；分页、跨页选择和空页是否保持语义。
- 弹窗关闭、确认、重复提交和提交失败后是否可重试。
- 树选择、人员回显、上传预览、导入结果和下载错误是否可见且可恢复。
- 取消请求不能提示失败，旧请求不能覆盖新对象状态。
- Mock 通过只记录为 Mock 验收；真实权限、文件传输和后端状态值另列联调门槛。

## 权限验收矩阵

| 层级     | 输入                                      | 预期行为                                                       | 必须验证                               |
| -------- | ----------------------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| 页面路由 | 菜单 `menus`、菜单 URL、全局开关、License | 仅注册允许页面；直接访问未授权地址不得显示页面                 | 管理员、普通用户、空菜单、失效 License |
| 按钮     | 权限 `actions` 精确键                     | `v-has-perm` 或 `hasPermission` 控制操作入口；无权限不应可点击 | 增改删、导入导出、授权、上传和批量操作 |
| 文本     | 权限 `actions` 精确键                     | `v-has-text-perm` 隐藏受限文案，避免仅禁用按钮造成信息泄漏     | 状态说明、敏感字段、受限提示和空态     |

权限键必须沿用 Vue2/API 契约。若后端没有区分按钮和文本的独立字段，前端只做展示层区分，不臆造新的服务端权限类型。

2026-09-28 多选下拉内侧边线对齐复修：用户仍反馈外圈观感不协调。经真实 DOM 对照，选择器原先使用实体 border，输入类控件使用内部 inset 边线；现统一为无实体 border、1px inset 状态线，普通/悬停/聚焦/错误仅切换 token 颜色，保留 32px 和原交互。4174 计算样式及 Element Bridge 定向 Playwright 已验证；正式 Impeccable 双路复评待当前样式稳定后补录。

2026-09-30 UI-13 LxForm 首错焦点修复：LxForm 现在保存真实表单根节点并在校验 Promise reject 后聚焦首个错误输入；桌面/375px浏览器证据和 3/3 文档 E2E 已通过。该修复不代表 Form 正式 Impeccable 关闭；组件库全量 UI-10/UI-11 完成前不进入宿主 Element Plus 依赖移除。

## 2026-10-04 Wave 0 迁移影响

当前仅修复 lx-ui `LxDatePicker` 对实际输入框的说明 ID 关联，没有改动 Vue3 业务 API、路由、权限或后端协议。当前工作区 DynamicForm 日期字段回归与 DatePicker 合计 36/36；本波提交不包含既存 DynamicForm 实现改动。Wave 1 先完成基础控件审查，宿主 Element Plus 替换顺序不变。
