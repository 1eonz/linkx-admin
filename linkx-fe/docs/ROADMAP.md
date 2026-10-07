# lx-ui 路线图

## 2026-10-07 Wave 6 / Cascader、Descriptions、VirtualTree 正式收口

当前源码、Demo 和中文文档已完成统一版本的组件级验收：VirtualTree/Descriptions 单测 18/18、6/6，文档 E2E 各 3/3，lx-ui 类型检查、库构建和文档构建通过。Cascader HUD 弹层、Descriptions 术语、VirtualTree 键盘事件/键碰撞/空键焦点和移动控件均已修复。Impeccable A 35/40；B 7 个 detector 为有效 `[]`、stderr 空、exit 0，四页浏览器 overlay 证据和当前源码指纹已保存。`[]` 只表示静态零命中；综合报告见 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`。

保留后续 P2/P3：Demo 控制区分组、VirtualTree 自定义插槽行高契约、Cascader loading 语义。下一入口为 `LxTransferPanel`，严格对照双栏穿梭设计稿完成 5:2:5、380px、节点 code/status、状态闭环、窄屏/HUD/键盘/减少动效，再进入宿主适配；Vue3 `element-plus` 直接依赖继续保留。

## 2026-10-07 Wave 5 / TreeSelect、Cascader 与 SelectPagination

- 当前版本实现、中文 Demo/API、行为回归和宿主文档 E2E 已收口：单测 **36/36**、文档 E2E **15/15**；覆盖键盘/清空、错误焦点和英文提示、移动触控、表单禁用继承、请求取消与迟到隔离、续页失败同页重试。
- 独立 Impeccable A **32/40**，B 9 个目标 detector 为有效 `[]`/空 stderr/exit 0，并完成 9 个浏览器 overlay 场景；代码复审无 P0–P2。A 的四项 P2 和长节点 E2E P3 进入后续文档/壳层整改。静态 `[]` 不等于视觉通过。
- 当前不增加 UI-10 52 项严格关闭数，不迁移 Vue3 业务页面，也不删除宿主 `element-plus`。先完成组件库下一批，再按矩阵替换宿主。
- 下一入口：Upload fallback UID/公开 `abort()` 组合回归，然后进入 Descriptions、VirtualTree、TransferPanel、MetricCard、SectionTitle、StatusSwitch、SearchBar 的设计对照、行为测试、浏览器证据、代码复审与 A/B。

## 2026-10-07 UI-13 / DynamicForm、DatePicker 与 Upload 正式收口

- 修复 LxUpload 根节点模板 ref 的 Vue 类型边界，并补齐必填字段 ARIA 回归；另修 `LxFormItem` 同批次移除反馈与清校验时的内部错误 ID 缓存及非幂等属性写入。字段类型预览测试逐类精确核对四组候选项。
- DatePicker/DynamicForm/Upload 定向单测 **89/89**、当前三份文档 E2E 合并 **43/43**（最新 DatePicker/Upload 子集 31/31）；Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块库构建和 VitePress 文档构建通过。文档构建保留既有 chunk 大小警告及 pnpm 旧配置提示。
- lx-ui Playwright 已从冲突的 4176 隔离到 4177；DynamicForm/Switch 来源拦截同步修正，Switch 兼容用例 6/6 通过。
- 独立代码复审未发现 P0–P2；fallback UID 回灌后公开 `abort()` 的组合测试留待后续 Upload 复验。Impeccable A 为 30/40；B 六个静态目标均为有效 JSON `[]`、stderr 空、退出码 0，10 个浏览器 overlay 场景已完成归因。综合报告和 snapshot 已归档；trend 只有本目标首次 30/40 记录。`[]` 只表示静态零命中，不单独代表视觉通过。
- 下一项按依赖顺序为 TreeSelect/Cascader 当前版本复核及 `LxSelectPagination` 禁用继承、竞态和续页失败恢复闭环。Vue3 宿主 Element Plus 替换仍等待全库门禁。

## 2026-10-06 UI-13 / LxUpload 跨实例 UID 修复

独立代码复审发现不同上传实例可能为相同无 UID 文件生成重复回退 UID。已将前缀生成改为模块级序列并新增双实例回归；DatePicker、DynamicForm、Upload 单测 69/69、文档 E2E 13/13、lx-ui 类型检查、203 模块构建、文档构建、目标格式和 Vue3 ESLint 通过，VitePress 保留大 chunk 警告。第二次独立代码复审批准，未发现可复现 P0–P2。旧 Assessment A/B 源码冻结不匹配且 B 浏览器证据不完整，须重建统一冻结后正式复验，不能登记 UI-10 严格矩阵关闭。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件验收

- DynamicForm 字段已按 schema 类型拆成独立文件并组合公开 `Lx*` 控件；`value`/`change(nextValue)` 与 `v-model` 兼容，覆盖密码、远程选择、日期范围和单/多文件上传。
- `daterange` 使用默认日期清空行为时发出 `null`；DatePicker 公共事件类型、DynamicForm 字段 renderer、Demo 与宿主规范已对齐。
- 修复 LxUpload 受控队列重试时序、取消后迟到回调和 UID/URL/response/error 映射；Mock Demo 与中文 API 同步。
- 定向单测 69/69、UID 修复后文档 Playwright 13/13；lx-ui 类型检查、目标 ESLint/Prettier、203 模块构建和 VitePress 文档构建通过，文档构建保留既有大 chunk 警告。
- 独立代码复审发现并修复跨实例 fallback UID 重号；修后复审批准，未发现可复现 P0–P2。旧 Impeccable A/B 源码冻结不一致且 B 浏览器证据不完整，当前版本须重新执行；完成前仍标记为组件集成验收，不关闭 UI-10 严格矩阵。真实上传协议、LxForm 完整设计对照和 Vue3 页面替换仍待后续波次。
- 下一入口：按详细计划进行 TreeSelect/Cascader 当前版正式复验与远程分页选择闭环。

## 2026-10-06 Wave 3 / LxIcon 修后严格复核

`LxIcon` 对未知运行时名称显示有访问名称的问号图标；侧栏菜单先解析图标键并安全回退，设置入口改用现存 `setting` 名称；Upload 状态图标补充名称类型。中文总览增加语义检索、普通文档流搜索、清空回焦、P1 别名计数说明、暗色主题映射和高对比空态。组件单测 7/7、文档 E2E 当前复跑 2/2（单 Chromium 项目，含桌面及 320px 窄屏交互路径；375px 由独立浏览器评估覆盖）；Vue3/lx-ui 类型检查、Vue3 测试文件 ESLint、目标 Prettier、196 模块构建和文档构建通过。lx-ui 没有独立 ESLint 配置。

Impeccable A 修后为 37/40（修前 33/40）。独立 B 对 `LxIcon` 组件和中文文档分别保存 detector JSON、stderr、退出码，两个静态结果均为有效 `[]`；另在五种浏览器状态成功注入 overlay 并保存截图。命中逐项归为 CJK 行长误报、Shiki/VitePress 代码与导航壳层规则提示，没有命中图标控件；浅色默认页一条无 URL 的 console 404 未归因。静态 `[]` 只表示静态规则零命中。真实读屏器播报、权限菜单异常图标和 Firefox/Safari 尚未覆盖。展开 P1/P2 后的 26/29 项长列表保留 P2。综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`，正式 snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。

DynamicForm/Upload 组件级验收状态见本文件顶部；完成 Impeccable A/B 收口后，下一入口按详细计划转为 TreeSelect/Cascader 当前版正式复验与远程分页选择闭环。完整只读审计见 `.impeccable/critique/wave4-dynamicform-agent-audit/followup-review.md`。全库 UI-10/UI-11 完成前保留 Vue3 宿主 Element Plus。

## 2026-10-06 Wave 1 / LxPasswordInput 修后复核

320px 页内“交互示例”锚点现在避开 VitePress 移动目录；普通暗色文档主题同步映射到 Demo 和内部输入面，HUD 仍可独立切换；窄屏工具栏和展开的高级设置标签均达到 44px。单测 10/10、文档 E2E 9/9、类型检查、目标 ESLint/Prettier、lx-ui 类型检查与文档构建通过。独立代码复审批准；Impeccable A 32/40，B 的 3 个 detector 都是有效 `[]`/空 stderr/退出码 0，overlay 11 个目标归因为 HUD 主题提示或 VitePress 文档壳层。证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`。密码字段宿主校验集成示例留在后续 Form/DynamicForm；移动目录项高度留在共享壳层。下一步先严格复核动态图标，再做 `LxDynamicForm`。

## 2026-10-05 Wave 2 / LxSwitch 复验

`LxSwitch` 的组件、Demo、中文 API、行为回归和独立代码复核已完成。单测 14/14、文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。代码复核批准，未发现可复现的 P0–P2 问题。Impeccable A/B 综合 32/40，是基于 29/40 的三项有界修后评分；源码、Demo、文档的 detector 结果均为有效 `[]`、stderr 空、退出码 0，仅代表静态规则零命中。报告与浏览器证据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/`，实现提交为 `1679d9c`。

移动文档侧栏隐藏时的键盘顺序需在共享壳层波次复验；生产高影响开关的确认、授权审计和失败补偿由宿主依据真实业务契约确定；中文术语释义作为文档改进继续跟踪。`LxPasswordInput` 当前复核已记录在本文件顶部，动态图标严格复核已完成，当前进入 `LxDynamicForm`。这些交叉残项没有关闭前，不将组件计入统一严格矩阵关闭数。完成一波后继续下一波，组件实现/E2E 与项目计划/审计/Critique 证据分开提交并推送。

## 2026-10-05 Wave 2 / LxCheckbox 与 LxRadio 复验

`LxCheckbox`/`LxCheckboxGroup` 与 `LxRadio`/`LxRadioGroup` 的当前实现、Demo、中文 API、行为回归和独立审查已完成。定向单测 20/20、文档 Playwright 4/4；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。独立代码复审批准，未发现 P0–P2 代码问题。Impeccable A 为 34/40；B 覆盖 Checkbox/Radio 的亮色、HUD、375px 触屏、禁用、键盘和减少动效状态，Radio 最新矩阵 overlay 注入 16/16；四个组件目录与最终 Radio Demo 的 detector 均为有效 `[]`、stderr 空、退出码 0。`[]` 只代表静态规则零命中。A 留下 375px API 表格扫描效率 P2，窄屏虽有表格自身滚动且页面无横向溢出，阅读体验仍待优化；真实触屏高度已由 B 验证为 44px。报告、截图和综合 Critique 见 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。严格矩阵行保留上述文档 P2。

## 2026-10-05 Wave 2 / LxSelect 交互复验

LxSelect 已完成配置式选项与插槽、远程空/失败状态和弹层开合两态恢复、HUD 弹层主色隔离、离线禁用候选项和窄屏触控选项。组件单测 10/10、当前文档 Playwright 3/3；Vue3 类型检查/目标 ESLint/Prettier、lx-ui 类型检查、库构建（196 modules）和文档构建通过，Luna max 独立代码复审最终批准。E2E 首次精确化时暴露 Select 下拉与折叠标签 tooltip 同带锚定类的问题，最终限定 `.el-select-dropdown.lx-select__popper` 后全绿。Assessment A-only 暂定 29/40；本波没有成功注入 overlay，也未生成当前版本持久截图或 snapshot/trend；detector 的有效 `[]` 只代表静态零命中，因此 LxSelect 严格矩阵行暂不关闭。下一项为 Checkbox/Radio。

## 2026-10-05 Wave 2 / LxDatePicker 短视口复验

DatePicker 短视口修复按实际边界选择原生锚点或居中浮层，日历面板独立滚动，弹层完整留在视口内。文档 Playwright 16/16，DatePicker/DynamicForm 定向单测 39/39；类型检查、库构建 196 modules、文档构建与目标 ESLint/Prettier 通过。正式 Impeccable A 为 31/40，B 覆盖 9 个浏览器场景并记录 detector、覆盖层与生命周期证据，独立代码审核批准。字段上下文遮挡、短屏末行滚动提示、桌面标签遮挡和底边距仍有 3 项 P2、1 项 P3 建议；DatePicker 严格矩阵行不关闭，后续按整改台账跟踪。报告位于 `.impeccable/critique/wave2-date-range-2026-10-05/final-review/`，综合快照为 `.impeccable/critique/2026-10-04T21-53-59Z__linkx-fe-src-components-lxdatepicker-index-vue.md`。下一项为 `LxSelect`；52 项矩阵与 UI-11 仍未关闭。

## 2026-10-05 Wave 2 / LxDatePicker Demo 子项

DatePicker 文档 Demo 已完成信息层级与窄屏弹层专项复核：日期区间示例前移，尺寸/扩展说明默认折叠，HUD 分隔符使用正文对比令牌，弹层宽度按视口减 16px 限制。文档 Playwright 12/12、lx-ui 类型/库构建/文档构建、Vue3 目标 ESLint/Prettier 通过；独立代码审核批准。375×812 下快捷范围弹层初始底部超出 54px，页面滚动后末行可见并可选，记录为需滚动查看的边界。当前组件评审 A/B 和综合 Critique 状态见本波归档；该子项不等于 Wave 2 全部组件或 52 项矩阵关闭。下一项为 `LxSelect`。

## 2026-10-04 基础控件复核状态

`LxPasswordInput` 的透传 `type` 不能覆盖内部密码遮罩；调用方传入 `type="text"` 的回归、显隐往返和只读组合单测 7/7 通过，修后独立代码复审批准，未发现 P0–P2。剪贴板默认允许，`preventClipboard` 只阻止前端事件，不构成凭据安全控制。Wave 1 的正式 Impeccable overlay/snapshot 因浏览器注入限制仍待补；当前按总计划继续 Wave 2 交互修复。

## 2026-10-04 后续任务拆分入口

组件库严格对照、DynamicForm/Form、基础控件、TreeSelect/Cascader、动态图标、登录页、Vue3 宿主替换和整站审查已按 Wave 0–12 拆分，详见仓库文档 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`。Wave 0 的 `LxDatePicker` 字段说明隔离修复、代码审核和定向回归已完成；正式 Impeccable A/B、overlay 与 snapshot/trend 仍待补。当前进入 Wave 1 基础控件批次。新增文档和注释使用中文；API 请求链保持 `.then().catch().finally()`；静态 detector `[]` 不作为正式视觉通过。

## 2026-10-03 Wave 6 交付与审查状态

TreeSelect/Cascader 的实现、Demo、API 和行为验收已完成：单测 17/17，VitePress 文档 Playwright 8/8（`playwright.lxui.config.ts`）。新增组件总览页和 Cascader 独立页均有可见交互 Demo。当前四个源码/文档 detector 结果均为有效 `[]`、stderr 空、exit 0，仅表示静态规则零命中。当前版本 overlay 注入预检被浏览器策略拒绝，10 月 2 日旧 overlay 早于当前代码/文档修改，因此 Wave 6 正式 Impeccable Critique 尚未完成，两个组件不登记为严格 UI-10 已关闭。基础控件批次按计划继续；Vue3 Element Plus 替换仍保持冻结。

## 2026-10-02 LxInputNumber 步进器修复

`LxInputNumber` 的 sm/md/lg 右侧步进器已改为按实际触发器高度连续贴合，Demo 增加 `controls` 参数开关，可验证显示与纯数字输入两种形态。InputNumber 定向单测 12/12、文档 E2E 1/1；基础控件批次和正式 Impeccable 审查继续进行。

## 2026-09-30 基础组件严格对照批次（新增）

在 TreeSelect/Cascader 之后，单独完成按钮和基础表单控件批次：`LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch`、`LxPasswordInput`。验收必须覆盖设计尺寸、边框/聚焦、错误/禁用/加载、主题、键盘、窄屏和减少动效，并补齐 Demo、API、测试、浏览器证据和 A/B 复验；未完成前保持 Vue3 Element Plus 替换冻结。

## UI-10 Wave 5 postfix 复验（2026-09-30）

Wave 5 独立 Assessment A 为 34/40；Assessment B 覆盖亮色/HUD、桌面/375px、Escape、错误恢复和 API 表格滚动，保存 16 张截图及 sidecar，外部请求 0。B 因 CUA 不可用使用 Playwright fallback，保留 `DEGRADED` 标记；P2/P3 建议和 UI-11 全库矩阵继续跟踪。

## UI-13 复修状态（2026-09-30）

`LxDynamicForm` 自适应布局已修正为由 container query 选择 3/2/1 列 span，避免行内样式覆盖两列断点；固定列、通栏、默认值和 reset 契约保留。新增公开 `LxTreeSelect`，树字段不再直接由 DynamicForm 引用 `ElTreeSelect`。LxForm 两个 Demo 也已切换到公开 Lx 基础控件。Form Assessment A 29/40 与 B 证据为历史记录；TreeSelect/Cascader 的实现和文档行为验收已完成，当前正式 Critique 仍待 overlay 与复验。

目标是让 lx-ui 与 LinkX 管理端的实际密度、交互、主题和状态保持一致，同时保持组件库业务无关。

## 优先级

| 优先级 | 内容                                                                                                                                                          | 验收重点                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| P0     | 先完成 `design/` 基础控件（button、表单八件套等）的 Element Plus 样式桥接并复核动态图标；再完成 `LxDynamicForm`；随后验收 SearchBar/StatusSwitch 等待替换控件 | 库级 Demo、键盘、窄屏、明暗主题、减少动效 |
| P1     | Upload、SelectPagination、Descriptions、人员选择弹窗壳、useTable、统一 loading/empty/error                                                                    | adapter 注入、取消、重试、分页和错误恢复  |
| P2     | VirtualTree、TransferPanel、motion primitives、低频业务组件                                                                                                   | 大数据量、动画降级和多场景复用            |

## 与 Vue3 宿主的执行顺序

### UI-13 表单第一波实施状态（2026-09-30）

`LxDynamicForm` 已完成字段子组件拆分、Lx 基础控件组合、`value`/`change` 受控契约、单/多文件列表和容器自适应布局；自适应 span 覆盖问题已修复。`tree-select` 已由公开 `LxTreeSelect` 承接，TreeSelect/Cascader 的文档行为验收已完成；当前正式组件 Critique 尚未完成。LxForm 设计稿逐项浏览器证据、基础控件及全库 UI-10 和 UI-11 Critique 仍未完成。

Vue3 页面中的共享控件替换会重复影响表单、弹窗、表格、搜索、树、键盘焦点和窄屏行为，因此组件库的高频契约先于整页深交互验收。执行时保留 API、字段、状态值和 Vue2 既有菜单/按钮权限等不依赖视觉组件的核查；已通过的页面测试作为基线，不因排期变化作废。

| 顺序 | 工作                                                                                      | 进入下一步的条件                                                                                                                               |
| ---- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 对照 `design/` 完成基础控件桥接与状态 Demo；复核 `doc/LxIcon*` 动态图标                   | 按钮、表单八件套及其他基础控件的键盘、窄屏、主题和减少动效有浏览器证据；图标已有单测与浏览器证据                                               |
| 2    | 按 UI-13 对照设计重做 `LxForm` / `LxDynamicForm`                                          | fields 通过独立子组件只组合 Lx 基础组件；React/TSX 友好受控值并保留 v-model；单/多图片列表；容器自适应 1/2/3 列；状态、键盘、Mock 与浏览器检查 |
| 3    | 对所有 lx-ui 组件逐项核对 design 并修正，再完成 Impeccable 组件/动效审查                  | 建立完整映射；按状态、尺寸、间距、焦点、主题、窄屏和减少动效逐项对照；建议修复并复验后才进入宿主替换                                           |
| 4    | Vue3 统一从 lx-ui 导入 Element Plus 组件、服务、类型和 locale，并按组件影响面分批替换页面 | pnpm 严格依赖解析、类型检查、构建与受影响页面回归通过；保留适配层的分页、选择、取消和校验语义                                                  |
| 5    | 完成业务 Mock/E2E、整站 Impeccable 审查，最后移除 Vue3 宿主的 element-plus 直接依赖       | 页面交互、默认/全菜单 E2E、类型、Lint、单测、生产构建及浏览器检查通过；真实联调单独记录                                                        |

`design/` 是控件视觉和交互规格的当前来源，`doc/LxIcon*` 是动态图标清单来源。每项都要跟踪设计源、lx-ui 实现、Vue3 采用位置和对应验证。动态图标和基础控件桥接已有库级浏览器验收；`LxDynamicForm` 旧版已验收，但按 UI-13 重新打开架构任务：当前 `columns` 固定指定列数、`upload` 依赖宿主插槽、字段由单文件条件分支渲染，尚未满足 type 子组件、Lx 基础控件、受控值式 API、单图/多图列表与容器自适应要求。`LxSearchBar` 的成功/空/错、loading、重置、展开及 375px 窄屏也已验收。`LxDialog` 有独立 API/Demo、4 项宿主单测和 3 项文档 Playwright；375px 下弹窗在视口内、表单单列、页面无横向溢出、触屏目标至少 44px，另覆盖标题可访问名称、焦点环、减少动效、校验、提交、ESC 和自定义 footer。`LxUpload` 已新增设计映射、注入式 Mock、独立 API/Demo、4 项单测和 3 项 Chromium 文档验收，覆盖进度、成功/失败重试、取消、格式校验、禁用、触屏、主题和减少动效。`LxDescriptions` 已对照详情描述行设计补齐 32px 行高、标签宽度/布局、复制字段与状态点；6 项单测、3 项文档 Playwright 覆盖复制键盘焦点、状态、375/320px 布局、480px 抽屉、主题和减少动效，组件级 Impeccable 定向检查 19/20 且 detector 为 `[]`。其他待替换组件仍需补齐独立证据；组件库闭环后先用 Impeccable 审查组件与动效，再迁移 Vue3 页面，Vue3 替换完成后再审查全站页面。Vue2 代码作为迁移对照；迁入 Vue3 的页面直接采用 lx-ui，Vue2 运行时不直接依赖 Vue3 组件。

不为清单中的每种 Element Plus 标签都新增 Lx 包装；没有通用封装时直接从 lx-ui 使用其导出的 Element Plus 控件。每个组件替换波次之前仍要以一个真实宿主场景校验库组件组合，避免只在独立 Demo 中通过。

### 2026-09-30 优先级调整

最新提交 `2a93ef1` 已加入 LxInput、LxInputNumber、LxTextarea、LxSelect、LxDatePicker、LxCheckbox/Group、LxRadio/Group、LxSwitch、LxButton 等基础封装。先对照 `design/` 严格复核并调整 LxForm 与 LxDynamicForm；动态表单的字段子组件只组合公开 Lx 控件，Element Plus 仅保留在 Lx 封装内部。随后建立全部 lx-ui 组件与设计源的逐项映射并修正视觉/交互差异，完成正式 Impeccable 组件与动效审查后，才开始 Vue3 Element Plus 全量替换。

LxIcon 图标总览页已有一次正式单目标 Critique，评分 27/40，快照见 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`。静态源码扫描 `[]` 不表示浏览器页面或动效通过；浏览器 overlay 列出 4 个文档壳层命中，但标题计为 3 个。随后主会话浏览器抽查 `delete`：hover 触发 `lx-icon-delete-shake`，`prefers-reduced-motion: reduce` 下 animation/transform 关闭且 transition 为 `0s`；键盘焦点边框已通过文档 Playwright 验收，其他代表性动效仍待覆盖，整库 UI-11 仍待 UI-10 其他候选闭环后完成。

## 组件行为证据

| 组件                 | 当前证据                                                                                                                                                                                                                                                                            | 未完成                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LxIcon`             | 94 个标准图形、96 个可用名称；静态 detector `index.vue` 返回 `[]`/exit 0；图标总览页正式 Critique 27/40，snapshot 已保存；浏览器 overlay 细项 4 条而标题计数为 3 条；delete hover/reduced-motion 抽查通过；键盘焦点边框已通过文档 Playwright 验收，当前只显示一条贴合卡片的主色边框 | 处理暗色标题对比、分组浏览和尺寸引用；补测其他代表性图标动效；该目标评审不代表整库 UI-11 完成                                                                                  |
| `LxVirtualTree`      | Vue3 宿主单测覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘焦点、公开方法与 node 插槽；独立 Demo/API 页覆盖 props、events、slots、exposes、状态、级联切换及 HUD 主题                                                                                                                    | 文档构建通过；Chrome 桌面交互/方向键、375px HUD 深色、错误/空状态与无横向溢出通过                                                                                              |
| `LxForm`             | 基础 wrapper 与焦点、错误、禁用、网格已有浏览器回归；最新提交增加 LxInput/LxSelect/LxDatePicker 等独立基础封装                                                                                                                                                                      | UI-13 待对照设计稿核验标签、宽度/间距、组件边框/焦点、错误/禁用、明暗主题、窄屏；业务组合只使用 LxForm/LxFormItem 与 Lx 控件；补正式浏览器证据                                 |
| `LxDynamicForm`      | 旧版 Vue3 宿主定向单测 5 项；独立 Demo/API 页覆盖成功/空/错、联动、禁用、重置、栅格和注入式 Mock（作为回归基线）；最新提交的 Lx 基础控件尚未接入                                                                                                                                    | UI-13 待做：按 type 拆独立字段子组件且只组合 Lx 基础控件、value/change + v-model 兼容、单图/多图上传列表、容器自适应 1/2/3 列、完整类型/文档/Mock/浏览器及正式 Impeccable 验收 |
| `LxSidebar`          | 独立中文 API/Demo；文档 Playwright 2/2 覆盖 expanded/rail 分组键盘、单次 select、浮层焦点与 Escape、移动模态抽屉焦点循环/返回、HUD 主题及减少动效；VitePress 浏览器已检查实际渲染                                                                                                   | UI-11 正式视觉/动效审查待 UI-10 闭环；Vue3 现有权限菜单外壳仍未采用，后续替换需保留动态菜单、搜索和“全部菜单”目录契约                                                          |
| `LxBreadcrumb`       | 独立中文 API/Demo；壳层 Playwright 覆盖键盘选择、宿主 `preventDefault()` 与外部原生导航边界                                                                                                                                                                                         | Demo 使用 `.test` 外部地址以避开 VitePress 同源路由接管；实际 Vue Router 宿主契约仍需页面级复验；UI-11 正式 Critique 未完成                                                    |
| `LxNavbar`           | 独立中文 API/Demo；壳层 Playwright 覆盖搜索、通知、用户菜单和 375px 组件容器宽度；修复 `99+` 徽标覆盖通知按钮点击区域                                                                                                                                                               | 真实宿主组合仍按 UI-04 逐页回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                                          |
| `LxTabsBar`          | 独立中文 API/Demo；壳层 Playwright 覆盖切换、关闭、右键事件、新建和 375px 局部滚动容器                                                                                                                                                                                              | Vue3 实际业务页的动态页签持久化与路由回归仍待 UI-04；UI-11 正式 Critique 未完成                                                                                                |
| `LxPageCard`         | 独立中文 API/Demo；壳层 Playwright 覆盖插槽、加载遮罩、`aria-busy`、具名 region、内边距/边框开关和 375px 容器                                                                                                                                                                       | Vue3 实际业务组合仍待 UI-04 回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                                         |
| `LxSplitLayout`      | 独立中文 API/Demo；3 项单测和 3 项文档 Playwright 覆盖 200–480px 限宽、折叠布局、键盘/拖动、375px 表格局部滚动、HUD 深色和减少动效                                                                                                                                                  | Vue3 业务页尚未采用；UI-11 正式组件/动效 Critique 待 UI-10 闭环；容器限宽与主区同行已按浏览器行为复验                                                                          |
| `LxDutyCalendar`     | 独立中文 API/Demo；8 项单测、3 项文档 Playwright 覆盖 42 格、周起始、日期选择、月份边界焦点、slot、宿主状态、375/320px、HUD、对比度和减少动效                                                                                                                                       | 没有专属 `design/` 日历稿；Vue3 排班日历需适配班次详情 popover、loading、月份查询事件和实例方法；UI-11 正式 Critique 待 UI-10 闭环                                             |
| `LxSearchBar`        | Vue3 宿主定向单测 3 项，覆盖受控值更新、默认值重置并立即查询、loading 禁止查询及展开字段                                                                                                                                                                                            | 文档构建通过；Chrome 成功/空/错和失败恢复通过；375px 展开全部 10 项条件且页面宽度保持 375px                                                                                    |
| `LxDialog`           | Vue3 宿主单测 4 项，覆盖可访问标题契约、确认/loading、取消/关闭和 footer；独立 Demo 提供表单、危险操作与自定义 footer                                                                                                                                                               | 文档构建通过；文档 Playwright 3/3，覆盖 375px 面板尺寸、单列表单、44px 触屏目标、键盘焦点、减少动效、校验/提交/ESC/footer                                                      |
| `LxProTable`         | 独立中文 API/Demo；Vue3 文档 Playwright 4 项覆盖跨页选择、清空、加载/减少动效、空/错恢复、排序、375px 局部滚动/键盘、44px 复选目标及 HUD 深色；宿主兼容层另有 4 项单测                                                                                                              | `tableAttrs`/自定义列/脱敏边界和真实业务宿主回归仍待后续组件替换波次；整库 Impeccable 审查未完成                                                                               |
| `LxPagination`       | 中文 API/Demo；5 项库单测、2 项 Vue3 适配器单测及文档 Playwright 3/3，覆盖事件顺序、autoReset/autoScroll、旧 `page/limit/pagination` 契约、自定义 layout、背景、zh-cn locale、主题和 375px 键盘局部滚动                                                                             | Vue3 仍有 4 处页面直接使用 `el-pagination`，须按各页契约迁移；当前 detector `[]` 只表示静态规则零命中，正式 Impeccable Critique 仍待 UI-10 闭环                                |
| `LxSelectPagination` | 独立中文 API/Demo；文档 Playwright 3 项覆盖 targetMap 跨页回显、远程搜索、旧请求取消、失败重试、空结果、375px 弹层边界、Escape 和 48px 分页按钮；兼容 `api`/`valueMap`                                                                                                              | 人员/部门实际宿主替换和 Vue2 取消语义核对仍待 UI-04 波次；整库 Impeccable 审查未完成                                                                                           |
| `LxUpload`           | 独立中文 API/Demo；宿主内存 Mock 适配器注入；单测 4 项，文档 Playwright 3 项覆盖手动/自动提交、进度、成功/失败重试、取消、格式校验、禁用、375px 触屏、HUD 深色和减少动效                                                                                                            | 地图/图标/Excel 业务页替换及真实上传协议联调仍待迁移波次；`chunkSize` 只透传给宿主，不代表组件内置分片实现；整库 Impeccable 审查未完成                                         |
| `LxDescriptions`     | 独立中文 API/Demo；单测 6 项覆盖布局、紧凑行、脱敏和插槽；文档 Playwright 3 项覆盖 32px 行高、复制键盘焦点、状态点、375/320px 抽屉边界、主题及减少动效                                                                                                                              | 阶段性组件启发式复核 19/20，建议已吸收；detector `[]` 只表示静态规则零命中，不是正式 Critique 通过；Vue3 业务详情页仍待替换，整库 Impeccable 审查未完成                        |
| `LxMetricCard`       | 对照 `design/指标卡 MetricCard/`；独立 API/Demo；6 项单测覆盖宿主旧 props/slots、语义色优先级、趋势箭头映射、进度边界/读屏/对比度、RTL 与长标题；文档 Playwright 2 项覆盖 LxIcon 趋势图标、320px、HUD 深色和减少动效                                                                | Vue3 详情抽屉 6 处宿主引用尚未替换，需在 UI-04 对照实际页面组合；UI-11 整库 Impeccable 审查未完成                                                                              |
| `LxAuthImg`          | 独立中文 API/Demo；6 项单测覆盖公开 URL、Blob 请求、载入事件、对象 URL 回收、取消竞态、回退和空状态；3 项文档 Playwright 覆盖本地 Blob、失败恢复、375px/HUD、键盘和减少动效                                                                                                         | Vue3 AuthImg 适配器仍持有鉴权请求，待 UI-04 注入 `.then().catch().finally()` Blob 适配器并逐页回归；真实鉴权联调未执行；UI-11 整库审查未完成                                   |
| `LxStatusSwitch`     | 对照 `design/状态开关 StatusSwitch/`；独立中文 API/Demo；宿主单测 6 项、文档 Playwright 3 项覆盖旧 `0/1` 值、关闭确认/取消、只读、loading、失败恢复、4.5:1 对比度、焦点、42×20px 轨道与 375px 44×44px 点按区、HUD 深色及减少动效                                                    | 库级设计和交互验收完成；Vue3 业务适配器仍使用 Element Plus，尚待宿主替换；整库 Impeccable 审查未完成                                                                           |
| `LxPasswordInput`    | 独立中文 API/Demo；文档 Playwright 3 项覆盖明文切换、清空、focus/blur/select、剪贴板拦截、只读/禁用和 375px HUD；Vue3 宿主适配器单测纳入全量回归                                                                                                                                    | 组件文档和状态演示已补；真实登录/改密联调仍依赖后端；整库 Impeccable 审查未完成                                                                                                |
| `LxTransferPanel`    | 对照 `design/虚拟滚动树 + 双栏穿梭/`；独立中文 API/Demo；单测 4 项、文档 Playwright 3 项覆盖全选/反选、树外键保留、禁用节点、上限、清空、宿主状态、375px 触控、键盘焦点及 HUD 深色                                                                                                  | 库级验收完成后仍需对 Vue3 `DataPermissionTree` 的 props、exposes、勾选与回传契约做宿主替换回归；整库 Impeccable 审查未完成                                                     |
| `LxSectionTitle`     | 独立中文 API/Demo；11 项库单测和 2 项 Vue3 适配器单测通过；文档 Playwright 1/1 覆盖三种变体、字号/标签、键盘操作、HUD 主题、长标题和 320/375px 窄屏                                                                                                                                 | 配置页真实组合回归仍待 UI-04 波次；UI-11 整库 Impeccable 审查未完成                                                                                                            |
| 其他高频组件         | 类型检查、组件库构建及文档构建通过                                                                                                                                                                                                                                                  | 按宿主实际采用范围补行为单测、状态 Demo、键盘/窄屏/主题浏览器验收                                                                                                              |
| `LxEmpty`            | API/Demo 已对齐 64px/48px 尺寸、`imageSize` 兼容和 `default`/`footer` 插槽；历史阶段性评审 28/40、修正后 34/40，均未满足 skill 正式 Critique 的独立评审和快照要求；detector `[]` 只表示对应源码静态零命中                                                                           | UI-11 正式组件/动效审查仍待 UI-10 闭环后按 skill 补齐；Vue3 15 处 `el-empty` 尚未替换，之后按实际 `image-size`/`class` 用法逐页回归                                            |

`LxActionButtons` 已补 disabled 原生按钮、可点按的「更多」展开、Escape 焦点返回、失焦/外部点击收起和长文本窄屏约束；独立 API 示例配有 3 项单测与 3 项文档 Playwright，覆盖操作事件、隐藏项、键盘、375px 44×44px 触控尺寸、HUD 深色和减少动效。Vue3 仍有 29 处使用宿主 `ActionButtons`，组件替换和契约适配尚未开始；整库 Impeccable 审查仍在候选组件闭环之后。

## 多场景矩阵

| 场景       | 必须覆盖                                                                          |
| ---------- | --------------------------------------------------------------------------------- |
| 管理表格   | 加载、空态、失败、重试、分页、排序、跨页选择、窄屏横向滚动                        |
| 动态表单   | 单列/双列/三列、必填、联动、异步选择、上传、插槽、校验失败                        |
| 弹窗和抽屉 | 键盘焦点、Escape、确认关闭、重复提交、失败重试、窄屏全屏化                        |
| 导航与状态 | 侧栏折叠、面包屑、状态点文字、权限隐藏、主题切换                                  |
| Demo       | props/events/slots/exposes、loading/error/empty/disabled、320/390/768、light/dark |

## 动画策略

- 动画只表达状态变化、层级进入和操作反馈，不延迟关键提交或错误信息。
- 统一使用 token 控制时长和缓动，提供短、中两档；列表和表格避免逐行长动画。
- 所有过渡在 `@media (prefers-reduced-motion: reduce)` 下缩短为近乎即时或禁用，仍保留焦点和状态变化。
- Demo 必须展示正常动效与减少动效两种结果；浏览器验收记录实际状态，不以源码推断。

## 发布与兼容

- 公共组件 API 变更必须同步类型、Demo、变更说明和宿主适配层。
- lx-ui 不依赖业务请求、Router、Pinia 或登录凭据；网络能力通过 adapter 注入。
- 构建顺序固定为 typecheck、library build、docs build，再由 Vue3 宿主执行页面和浏览器回归。

## 图标清单进度

| 阶段                        | 状态   | 证据                                                                                                               |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| P0 规范归并与 13 个核心动效 | 已完成 | `docs/components/lxicons.md`、宿主 `tests/unit/lx-icon.test.ts`、`pnpm test:e2e:icons`                             |
| P1 业务语义与 29 枚扩展动效 | 已完成 | 69 个去重名称单测；桌面悬浮/键盘、对齐卡片边界的焦点样式、Chromium 触屏、减少动效和 320px 浏览器验收见总计划 UI-08 |

### 2026-09-30 UI-13 LxForm 首错焦点修复复验

- 修复 `linkx-fe/src/components/LxForm/index.vue` 的首个无效字段聚焦：表单组件挂载后记录真实 `<form>` 根节点，校验失败时按 `.then().catch()` 契约在当前帧、下一帧和事件队列末尾重试聚焦。
- 新增 `other-admin/admin-vue3/tests/e2e/lx-form-docs.spec.ts` 断言，桌面与窄屏提交失败后首个错误输入必须获得焦点并保留 `aria-invalid="true"`。
- 浏览器证据：`.impeccable/critique/form-focus-postfix-2026-09-30/browser-evidence.json`，桌面 1280px 和移动 375px 均首错聚焦、无横向溢出、无外部请求；静态 detector 四个目标 JSON 有效为 `[]`、stderr 为空、退出码 0，仅记静态零命中。
- 验证：LxForm 文档 Playwright 3/3；Vue3 定向单测 34/34；lx-ui `vue-tsc --noEmit`；`git diff --check` 通过。Form 正式 Impeccable 综合仍未关闭，下一步继续 Wave 5 A/B 与全库严格矩阵。

### 2026-09-30 UI-10 Wave 3 LxSidebar reduced-motion 复验

- 修复 `LxGauge` 在 `prefers-reduced-motion` 下的 transition 覆盖优先级，使用 `transition: none !important` 保证基础 token 的全局 `0.01ms` 降级不会被组件 scoped 规则覆盖。
- 修正文档 E2E 的状态定位：`LxGauge` 只在 Sidebar rail footer 渲染，测试改为先切换受控示例到 rail，再检查圆环动效；移动抽屉回归保持。
- 验证：`lx-sidebar-docs.spec.ts` 2/2；LxUI 全量文档回归 67 项中 66 通过、1 项旧 Sidebar 测试失败已修复后单独 2/2；LxGauge 与 LxSidebar detector 均为有效 JSON `[]`、stderr 0 字节、退出码 0。`[]` 仅代表静态规则零命中，Wave 3 仍需正式 A/B Critique。

## 2026-10-04 Wave 0 复验

`LxDatePicker` 字段说明已按实例同步到实际输入，单值、区间和相邻实例回归通过；当前工作区 DatePicker/DynamicForm 单测 36/36，组件库类型、构建和文档构建通过。正式 Impeccable A/B 和修复后 overlay/snapshot 仍待补；进入 Wave 1 基础控件第一组。
