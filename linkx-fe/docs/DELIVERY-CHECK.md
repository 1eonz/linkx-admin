# lx-ui 交付核查

## 2026-10-10 G2 正式核查

- `LxSearchBar` 单测 8/8、文档 E2E 3/3、Assessment A 25/40；`LxStatusSwitch` 单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6。类型检查、库构建、目标 Prettier/ESLint 已通过。
- SearchBar 修后 Assessment B 的组件、Demo、文档 detector 均为有效 JSON `[]`、stderr 空、退出码 0；亮色/HUD、1440/375px、减少动效和交互证据已归档。`[]` 仅代表静态规则零命中；375px 整页横溢出来自文档 API 表格/代码区域，组件自身无溢出。
- **已完成门禁**：`F:\work\linkx-admin\linkx-fe` 下 `pnpm exec vite build` 已通过；SearchBar Assessment A 修后评分、G2 综合报告、snapshot/trend 与独立代码复审已完成。复审修后无 P0/P1/P2，P3 ARIA 单测增强进入后续台账；按两笔白名单提交推送后继续下一波。
- UI-10 仍为 0/52；真实后端/权限联调及 Vue3 宿主 `element-plus` 删除继续冻结，API 请求链保持 `.then().catch().finally()`。

## 2026-10-10 Wave 7 / LxTransferPanel 正式收口

- 组件、中文 Demo/API 与文档已同步；文档预览最大 820px，窄屏长名称折叠/展开、筛选恢复、滚动边界和 44×44px 移除按钮已回归。
- TransferPanel + VirtualTree 定向单测 **64/64**，TransferPanel 文档 E2E **32/32**；lx-ui 类型检查、203 模块构建、VitePress 文档构建、目标 Prettier/ESLint 和 Vue3 生产构建通过。
- Impeccable A **32/40**；B 三个 detector 均为有效 JSON `[]`、stderr 空、退出码 0，浅色/HUD 六视图 overlay 与测量证据完整；独立代码复审无 P0–P3。`[]` 只表示静态规则零命中。
- 证据目录：`.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/`；当前进入 G2 `LxSearchBar` + `LxStatusSwitch`。UI-10、真实后端联调和 Vue3 `element-plus` 删除门禁保持未完成。

## 2026-10-09 Wave 7 / 窄屏长名称与展开状态收口

- 320–420px 已选超长名称默认收为两行；展开后全文使用条目可用宽度，移除按钮保留 44×44px，元数据显式行高及原始键值内距避免继承文档外壳的大行高。320px 示例展开条目实测约 157px，列表可视区约 168px。
- 已展开名称绑定原生 `open`，筛选隐藏再恢复时同步展开内容、`aria-expanded` 和操作文案。展开定位按整条边界计算，并在下一帧确认条目仍连接且仍处于展开态。
- 已补 320px 展开后滚到底的全文、焦点入口和移除按钮命中断言，以及筛选隐藏再恢复的展开状态回归。
- 本轮目标格式、ESLint 和 lx-ui 类型检查已通过；32 项 E2E、定向单测、构建及 GPT-6.1-sol 隔离 A/B/代码复审正在完成。结果归档到 `.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/`，当前不标记正式审查通过。

## 2026-10-09 Wave 7 / LxTransferPanel 820px 预览复验

- Demo 预览最大宽度 `820px` 并居中，窄屏铺满正文可用宽度；默认 `240px` 紧凑高度选择器常显于预览上方，可切换 `300px`/`380px`。组件 API 默认高度仍为 `380px`，窄屏至少 `352px`。组件与 Demo 局部重置 VitePress `summary` 外边距。
- 修复超长名称展开后的紧凑列表裁切，并将反选说明浮层锚定到待选面板标题区；桌面、HUD、240/300/380px、长名称、反选浮层及 390px 窄屏均有独立浏览器证据。
- 移动数量标签和无障碍名称改为“待选”；中文指南紧邻示例说明本地选择不代表权限已保存。
- 单测 **64/64**、TransferPanel 文档 E2E **30/30**；E2E 断言 1440px 居中限宽、390px 正文可用宽度及无页面横向溢出。lx-ui/Vue3 类型检查、目标 Prettier、203 模块构建和 Vue3 生产构建通过；VitePress 文档构建待完成。
- 代码复审未发现 P0-P2，P3 旧计数和哈希已修正；独立 Impeccable A/B、正式报告和 snapshot/trend 正在收口。detector `[]` 不单独代表视觉通过。UI-10 仍为 0/52，Vue3 `DataPermissionTree` 与真实权限联调继续留在 UI-04。

## 2026-10-08 Wave 7 / LxTransferPanel 修后复验中

- 设计对照和组件修复覆盖 5:2:5/380px 面板、名称/部门编码筛选、树外键回显/确认、错误/空/加载、键盘、HUD、窄屏和减少动效。`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px；桌面树项基准行高为 32px，普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项标记与原始键值移至名称下第二行，实际截断的长名称才提供 disclosure。TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px，窄屏名称完整换行；行高跨断点时焦点恢复到 `treeitem` 的 P2 已修，VitePress 文档站已加入 SVG favicon。
- 两组件定向单测合计 64/64，`lx-transfer-panel-docs.spec.ts` 28/28；VirtualTree 文档 E2E 的 13 项另行统计。lx-ui typecheck、Vue3 `lint:ts`、目标 ESLint/Prettier、`git diff --check`、lx-ui 203 模块构建、VitePress 文档构建和 Vue3 `build:prod` 均通过。保留 Vue3 构建既有 Less 导出、Element Plus circular chunk、chunk size 警告及 VitePress 大 chunk 警告。独立代码复审批准，无 P0–P3。
- 当前旧 A/B 只作修复前基线、不计正式通过；Assessment B 浏览器证据已完成 **20/20**，正在收口证据索引及综合 snapshot/trend。Wave 7 仍为**正式审查收口中**。UI-10 保持 0/52；Vue3 `DataPermissionTree` 替换属 UI-04，真实权限/后端联调需真实契约；保留 Vue3 Element Plus。
- 下一入口为 G2 `LxSearchBar` + `LxStatusSwitch`；新的严格隔离 A/B 正式完成后再提交、推送并进入 G2。

## 2026-10-07 Wave 6 正式交付检查

- `LxCascader`、`LxDescriptions`、`LxVirtualTree` 与文档侧栏已完成当前源码冻结后的实现、中文 Demo/API、行为回归和浏览器验收；VirtualTree/Descriptions 单测 18/18、6/6，文档 E2E 6/6，Vue3 全量 Vitest 58/457。
- lx-ui 类型检查、库构建、VitePress 文档构建、Vue3 类型检查和差异检查通过；代码复审批准，无可复现 P0-P3。构建保留既有大 chunk 警告。
- Impeccable A 35/40（Good）；B 7 个 detector 均为有效 `[]`、stderr 空、退出码 0，四个新标签完成 overlay、键盘、HUD、错误/空态和 375px 证据。`[]` 只代表静态规则零命中，完整报告和指纹见 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/`。
- 后续 P2/P3：Demo 控制区渐进披露、VirtualTree 自定义 node 插槽单行/高度契约、Cascader loading 触发器语义。组件级交付不等于 Vue3 页面已替换，`DataPermissionTree` 宿主回归和真实权限联调仍待完成。
- 下一波为 `LxTransferPanel`，继续覆盖设计稿 5:2:5、380px 面板、节点 code/status、空/加载/错误、键盘、HUD、窄屏、减少动效和宿主 Mock；完成后才推进 Vue3 Element Plus 替换。

## 2026-10-07 Wave 5 选择器组件正式核查

- TreeSelect/Cascader/SelectPagination 当前源码、Demo 和中文文档已完成行为闭环；定向单测 **36/36**、文档 Playwright **15/15**，覆盖键盘、清空、错误/重试、窄屏、禁用继承、取消、迟到响应和续页失败恢复。
- lx-ui typecheck、203 模块构建、VitePress 文档构建、目标 ESLint/Prettier 和 `git diff --check` 通过。4177 评审服务已清理，4174 未触碰。
- Impeccable A **32/40（Good）**；B 的 9 个 detector 结果均为合法 `[]`、stderr 空、exit 0，浏览器 9/9 场景 overlay 成功。代码复审无 P0–P2；剩余 P2/P3 见 `.impeccable/critique/wave5-tree-select-pagination-2026-10-07/final-report.md`。`[]` 只代表静态零命中。
- 本项不代表真实后端/权限联调、Vue3 业务页替换或 UI-10 全库矩阵关闭。下一批为 Upload 组合 abort 回归和数据展示/复杂交互组件。

## 2026-10-07 UI-13 / DynamicForm、DatePicker 与 Upload 正式收口

- 修复 Upload 模板根节点 ref 的跨 Vue 类型边界，并补齐上传必填字段真实触发器的 ARIA 错误态和恢复回归。
- 修复 `LxFormItem` 在同批次移除反馈与清除校验时快照内部错误 ID、造成重复观察器更新的风险；恢复属性改为幂等写入。字段类型 E2E 精确检查四类完整成员。
- 当前三份文档 E2E 合并 **43/43** 通过，最新 DatePicker/Upload 子集 **31/31**，DatePicker/DynamicForm/Upload 定向单测 **89/89**；Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块生产构建和文档构建通过。文档构建保留既有大 chunk 警告。
- lx-ui Playwright 因 4176 被另一项目占用已隔离至 4177，并同步 DynamicForm/Switch 的来源校验；Switch 配置兼容用例 6/6 通过，4174 预览保持运行。
- 独立代码复审未发现 P0–P2。Assessment A 30/40；B 对三组件源码和三份中文文档六目标的 detector 均为有效 JSON `[]`、stderr 空、退出码 0，并完成 10 个浏览器 overlay 场景。`[]` 仅代表静态零命中，命中归因和截图见 `.impeccable/critique/wave4-dynamicform-2026-10-07/`。
- Snapshot 已保存；trend 查询仅返回本目标首次 30/40 记录，暂无历史趋势。代码复审记录的 fallback UID 回灌后公开 `abort()` 组合测试缺口留待后续 Upload 复验；组件实现与测试提交为 `a2ba943`。
- 该轮仍只代表组件库与文档 Mock 验收，不代表真实上传 API 联调、完整 LxForm 设计核对、Vue3 业务迁移或 UI-10 矩阵关闭。下一项为 TreeSelect/Cascader 当前版复验与 `LxSelectPagination` 状态闭环。

## 2026-10-06 UI-13 / LxUpload 跨实例 UID 回归

- 独立代码复审发现回退 UID 前缀为实例级计数；现抽至 `LxUpload/uid.ts` 模块级序列，同一父组件内两个实例接收相同无 UID 文件时会生成不同对外 UID。
- DatePicker/DynamicForm/Upload 单测 **69/69**、UID 修复后文档 Playwright **13/13**、lx-ui 类型检查、目标 Prettier/Vue3 ESLint、203 模块生产构建和 VitePress 文档构建通过；文档构建保留大 chunk 警告。
- 第二次独立代码复审批准，未发现可复现 P0–P2。原 Impeccable A/B 使用不同源码冻结且 B 浏览器状态不完整，不能记为正式 Critique。完成统一冻结、隔离评估和浏览器复验前不更新正式审查结论或 UI-10 矩阵计数。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件集成复验

- DatePicker/DynamicForm/Upload 定向单测 **69/69**、UID 修复后文档 Playwright **13/13**；覆盖分类型字段、受控 `value`/`change`、日期范围选择/清空、远程查询迟到响应、上传受控重试/取消/移除、错误恢复和跨实例 fallback UID 唯一性。
- 日期区间使用默认清空行为时，Element Plus 2.14.6 发出 `null`；已补 DatePicker 真实清空单测、DynamicForm 受控回写断言和 Demo 文档浏览器断言。
- lx-ui 类型检查、目标 ESLint/Prettier、69 项单测、13 项文档 E2E、203 modules 生产构建和 VitePress 文档构建均在 UID 修复后通过；文档构建保留既有 chunk 大小警告。
- 独立代码复审发现并修复跨实例 fallback UID 重号；修后独立复审批准，未发现可复现 P0–P2。旧 Impeccable A/B 冻结不匹配且 B 浏览器证据不完整，当前源码 A/B 与 snapshot/trend 待重新执行；`[]` 仍只表示目标源码静态规则零命中，须与 stderr、退出码和浏览器证据一并解释。
- 本结果不代表真实上传协议联调，不关闭 `LxForm` 完整设计图对照或 52 项 UI-10 严格矩阵，也不表示 Vue3 业务页已改用 lx-ui。下一项按计划为 TreeSelect/Cascader 当前版 Critique 与远程分页选择。

## 2026-10-06 LxIcon 修后交付复验

- 当前代码复审批准，未发现可复现 P0–P2。未知图标运行时回退、侧栏图标解析/回退、设置入口键与 Upload 名称类型已复核；真实读屏器和权限菜单畸形数据未覆盖。另有 E2E 名称集合比较的 P3 建议。
- 组件单测 7/7、文档 E2E 当前复跑 2/2（单 Chromium 项目，覆盖桌面与 320px 窄屏交互路径；375px 行为由独立浏览器评估覆盖）；覆盖 96 个名称、语义搜索、清除与焦点恢复、明暗/HUD 空态对比度、键盘、复制和减少动效。Vue3 类型检查、测试文件 ESLint、目标 Prettier、196 模块构建、文档构建均通过；lx-ui 无独立 ESLint 配置。
- Impeccable 修后 Assessment A 为 37/40（修前 33/40）；B 两个静态目标均为有效 JSON `[]`、空 stderr、退出码 0，并在五个新浏览器 context 成功运行 overlay。页面规则命中归为 CJK 行长误报、Shiki/VitePress 文档壳层或导航/code-copy 规则误报，没有命中 LxIcon 控件。`[]` 仅表示静态零命中；浅色默认页一条无 URL console 404 未归因。综合报告及正式 snapshot：`.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`、`.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。
- 展开 P1/P2 长分组后仍有 26/29 项，作为 P2 继续跟踪；本项不关闭 UI-10 的 52 项全库矩阵或 UI-11 整库评审。DynamicForm/Upload 当前交接见本文件顶部；Vue3 全量替换继续冻结。

## 2026-10-05 LxSwitch 交付复验

- LxSwitch 组件、Demo、中文 API、状态/键盘/主题/窄屏回归和独立代码复核已完成。单测 14/14、文档 E2E 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、生产构建（196 modules）和文档构建通过。VitePress 保留既有大包提示。
- Impeccable A/B 综合评分 32/40；这是从 29/40 基线更新系统控制、识别和窄屏简约性三项的有界复评。组件、Demo、文档 detector 均为有效 `[]`、stderr 空、退出码 0，只表示当前静态规则零命中。移动 375px 下 overlay 造成的根宽增加已归因于注入标记；隐藏标记后页面恢复 375px。没有声称用户可见标签中存在 overlay。
- 独立代码复核批准，未发现可复现 P0–P2。非阻塞验证缺口：E2E 尚未执行真实触摸点击；ARIA 属性动态移除、定时器运行中离开 Demo 的回归尚未覆盖。
- 仍跟踪的交叉事项：移动文档侧栏关闭后的键盘顺序列入共享壳层复验；生产高影响操作的确认/审计/失败补偿需按真实宿主契约验收；术语释义属于后续文档改进。LxSwitch 本波完成不代表 52 项矩阵、Vue3 组件替换或真实后端联调已完成。
- 证据与快照：`.impeccable/critique/wave2-lx-switch-2026-10-05/`；正式快照 `.impeccable/critique/2026-10-05T13-00-21Z__linkx-fe-src-components-lxswitch-index-vue.md`，该目标首次正式记录，趋势为 32/40；实现提交 `1679d9c`。

## 2026-10-05 LxCheckbox / LxRadio 交付复验

- Checkbox、CheckboxGroup、Radio、RadioGroup 的状态样式、中文 API/Demo 与可观察行为回归已复核；浅色禁用文字为 `#909399`，HUD 次级文字为 `#94a3b8`，Radio `aria-live` 播报中文选项名，Demo 展示组外已选禁用历史值。
- 定向单测 20/20、文档 E2E 4/4；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、生产构建（196 modules）、文档构建和目标差异检查通过。独立代码复审批准，未发现 P0–P2 代码问题。
- Impeccable A 34/40；B 记录 Checkbox/Radio 与组控件的主题、触屏、键盘、减少动效状态，最新 Radio 矩阵 16/16 成功注入 overlay。静态 detector 四个组件目录及最终 Radio Demo 均为有效 `[]`、stderr 空、退出码 0；这不替代浏览器结论。
- 尚存建议：375px API 多列表格仍不易快速扫描。文档页保持无整体横向溢出，现有表格容器可横向滚动；此项列为文档体验 P2，严格设计矩阵行不关闭。真实触屏 44px 目标已由 B 验证通过。
- 证据：`.impeccable/critique/wave2-checkbox-radio-2026-10-05/`；实现/E2E 提交 `be86f10`。

## 2026-10-05 LxSelect 行为与窄屏复验

- HUD 下拉主色变量现限制于 Select popper；Teleported option 描述使用直接类名；远程失败说明仍关联输入框，弹层打开时 footer 提供重试，关闭时错误和重试回到控件旁；Demo 增加单项离线禁用候选项。
- 窄屏/触屏将 Select 选项行提升至 44px，桌面继续按 02 标本保持 32px。hover 视觉规范记录 02 字段样本与综合演练卡两种依据，当前沿用综合演练卡的主色描边。主会话 320px 实测触发器与弹层留在视口内，HUD 传送菜单使用深色表面和局部主色。
- LxSelect 单测 10/10、当前文档 E2E 3/3；Vue3 类型检查、目标 Prettier/ESLint、lx-ui 类型/196 模块构建/文档构建通过。构建保留既有大 chunk 警告。
- Luna max 独立代码复审最终批准。人工浏览器阶段记录见 `.impeccable/critique/wave2-lx-select-2026-10-05/main-session-check.md`；Assessment A-only 暂定 29/40。overlay、当前版本持久截图和 snapshot/trend 缺失，正式 Impeccable 及严格 UI-10 行保持未完成。Vue3 宿主替换仍等待组件库门禁。

## 2026-10-05 LxDatePicker 窄视口修复复验

- DatePicker 窄屏弹层按实际边界选择原生锚定或视口居中；居中模式隐藏定位箭头，滚动限制在日期面板内部，窄屏宽度受视口约束。
- 文档 Playwright 16/16、DatePicker/DynamicForm 定向单测 39/39；覆盖 320/375/390px、短屏普通及快捷区间、滚动后末行可见、页面滚动隔离、HUD、键盘、错误态和减少动效。
- lx-ui 类型检查、库构建（196 modules）、文档构建、Vue3 目标 ESLint/Prettier 和目标差异检查通过；VitePress 有既有大 chunk 提示。
- 正式 Assessment A 31/40、Assessment B 9 个场景及独立代码审查均完成。4 项 P2/P3 体验建议仍在跟踪，故 DatePicker 严格审查行不关闭；detector `[]` 只代表源码静态零命中。证据位于 `.impeccable/critique/wave2-date-range-2026-10-05/final-review/`，综合快照为 `.impeccable/critique/2026-10-04T21-53-59Z__linkx-fe-src-components-lxdatepicker-index-vue.md`。

## 2026-10-05 LxDatePicker Demo 专项复核

- Demo 将日期区间主示例前移，低频尺寸/扩展参数放入默认收起、可键盘访问的说明；HUD 分隔符使用正文色令牌，小屏含侧栏弹层限制为视口宽减 16px。
- Playwright 文档 E2E 12/12；alpha 安全对比度 helper 修改后 HUD 定向用例 1/1；lx-ui 类型、库构建（196 modules）、文档构建及 Vue3 目标 ESLint/Prettier 通过。独立代码审查批准；详情与 Impeccable A/B 证据路径见 `.impeccable/critique/wave2-date-range-2026-10-04/`。
- 375×812 常用日期范围弹层底部初始越界约 54px；滚动后末行完整可见、可选，键盘焦点稳定。该边界继续记为已知体验限制，不声称初始状态完全置于视口。
- 只覆盖 LxDatePicker Demo 与样式的本轮改动；LxSelect、Checkbox/Radio、Switch 及全库 UI-10/UI-11 门槛仍待完成。

## 2026-10-04 密码输入框回归约定

`LxPasswordInput` 必须以组件显隐状态控制密码类型，调用方透传的 `type` 不能覆盖遮罩。剪贴板默认允许；宿主显式开启 `preventClipboard` 时组件只阻止前端事件，不得将其作为服务端安全边界。Wave 1 行为修复与 Impeccable 正式视觉审查分别记录。

## 2026-10-04 后续交付拆分

Wave 0–12 的完整任务、证据门槛和阻塞口径见仓库文档 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`。Wave 0 已修复 `LxDatePicker` 相邻实例说明 ID 隔离，36 项 DatePicker/DynamicForm 单测、组件库构建、文档构建和 DatePicker 文档 E2E 通过；正式 Impeccable Critique 仍未关闭。基础控件统一严格审查、TreeSelect/Cascader 当前版本 overlay 及全库 52 项矩阵继续进行。所有新备注和组件说明使用中文，`[]` 仅记静态 detector 零命中。

## 2026-10-03 UI-13 DynamicForm 字段反馈复验

- 日期输入框接收字段 `aria-describedby`；字段说明更新/移除及相邻两个日期字段互不串联由单测覆盖。字段反馈 ID 实例级唯一，loading 时重试按钮禁用，上传和自定义 slot 将描述 ID 传到实际控件。
- Demo 增加可固定查看的候选项加载状态；API 文档新增最小 schema 示例，并说明较长表单的分区标题或步骤由宿主编排。
- 定向单测 34/34，动态表单文档 Playwright 1/1；lx-ui `typecheck`、库构建及文档构建通过，Vue3 类型检查、目标 ESLint/Prettier、差异空白检查通过。VitePress 有既有的大 chunk 警告。
- Impeccable Assessment A 桌面评审 29/40（Good），加载状态、最小示例和宿主分区说明已落实；文档侧栏同级入口过多登记为全站后续项。Assessment B 和当前 detector 的 `[]`、空 stderr、退出码 0 只表示静态零命中；浏览器页面可访问，但没有可用的动态注入接口，overlay 未运行，因此正式 Impeccable Critique 仍待补，不能记为组件通过。

## 2026-10-03 TreeSelect/Cascader 交付与审查状态

- `LxTreeSelect`、`LxCascader` 的组件单测 17/17、文档 Playwright 8/8；测试使用 `playwright.lxui.config.ts` 和 VitePress 4176。“新增组件”总览与 Cascader 独立页都展示交互 Demo。
- 当前两份组件源码与两份文档的 detector 均为有效 JSON `[]`、stderr 空、exit 0，仅表示静态规则零命中。浏览器策略拒绝当前 overlay 注入预检；旧 overlay 早于当前代码/文档，不能登记为当前版本正式 Critique 通过。正式 Impeccable Critique 仍待补。
- 既有 Assessment A 建议已落实；保留 P3 与文档壳层观察，不把本波写成全库完成。基础控件统一桌面/375px/HUD/减少动效审查继续进行，Vue3 Element Plus 替换门槛不变。

## 2026-10-02 LxInputNumber 增量

- sm、md、lg 步进按钮按触发器高度连续贴合，中间保留 1px 分隔线；Demo 提供 `controls` 显示/隐藏开关。
- 实际数字输入同步 `id/name/autocomplete/aria-*`，可见字段标签可关联原生输入；定向单测 12/12、InputNumber 文档 E2E 1/1。
- lx-ui `pnpm typecheck`、库构建（195 modules）和 VitePress 文档构建已复验通过；文档构建保留仓库已有的大 chunk 警告。
- 基础控件综合文档 E2E 已 4/4：Select、DatePicker、InputNumber 的标签/键盘行为，以及 375/320px、HUD、减少动效和页面宽度均通过；DatePicker 禁用/只读区间的窄屏默认宽度问题已修复。
- 仍待基础控件批次统一的桌面/375px/HUD/减少动效证据及 Impeccable A/B。

## 2026-09-30 基础组件审查门禁

基础组件批次包含 `LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、Checkbox/Radio 组、`LxSwitch` 和 `LxPasswordInput`。各项必须有设计源映射、中文 API/Demo、状态与键盘行为测试、桌面/375px/HUD/减少动效浏览器证据、代码审核及 Impeccable A/B 记录；静态 detector `[]` 不单独构成通过。

## 2026-09-30 UI-13 复修增量

- 自适应布局已修复：字段不再通过行内 `grid-column` 固定三列 span，容器在 760px/520px 断点分别选择两列/单列；固定列与 `span=24` 通栏保持兼容。
- 新增公开 `LxTreeSelect` 并接入 DynamicForm；Element Plus 仅保留在 Lx 封装内部。新增 API 文档和侧栏入口；Wave 6 已补成功/空/失败/禁用、键盘、HUD、窄屏浏览器证据及文档 E2E，正式 Critique 仍待当前 overlay 证据，详情见本页顶部记录。
- LxForm 基础/弹窗 Demo 改用 `LxInput`、`LxSelect`、`LxTextarea`，避免新示例直接使用 `El*`。
- Assessment A 29/40；Assessment B 的 detector `[]`（stderr 空、exit 0）已记录，浏览器 overlay/截图与综合快照待收尾。静态 `[]` 不代表组件审查完成。

## 本次组件

新增 18 个组件并从 `src/index.ts` 命名导出：`LxPageCard`、`LxSectionTitle`、`LxMetricCard`、`LxDescriptions`、`LxCodeSlot`、`LxSearchBar`、`LxStatusSwitch`、`LxUpload`、`LxSelectPagination`、`LxPasswordInput`、`LxVirtualTree`、`LxTransferPanel`、`LxAuthImg`、`LxNavbar`、`LxTabsBar`、`LxBreadcrumb`、`LxSplitLayout`、`LxDutyCalendar`。对应公共 Props 类型也从入口导出。`LX_ICONS` 提供 94 个标准图形，`LX_ICON_ALIASES` 提供 `date` -> `calendar` 和 `eye-on` -> `eye` 两个兼容名称；`LxIconName` 覆盖共 96 个可用名称。

## 接入契约

### UI-13 表单验收记录（2026-09-30）

- 已完成：字段独立子组件、Lx 基础控件组合、`value` + `change` 与旧 `v-model` 兼容、LxUpload 单/多文件列表、3/2/1 列容器自适应、固定列兼容模式。
- 已验证：类型检查、库构建、文档构建、Vue3 定向单测 40/40、本地 Mock 浏览器成功/空/错/禁用/HUD/375px/无外部请求。
- 待完成：LxForm 设计图逐项浏览器证据；TreeSelect/Cascader 当前版本正式 Critique；基础控件及其余组件的全库 UI-10 严格设计对照和 UI-11 正式 Impeccable 双路 Critique。

- `LxForm` 与 `LxDynamicForm` 依 UI-13 逐项对照 `design/` 参考验收。动态表单按字段 `type` 分发至独立子组件，只组合公开 `Lx*` 控件（Element Plus 可留在这些封装内部），不以 `El*` 字段控件代替设计实现；补 React/TSX 友好的受控 `value` + `change(nextValue)` 与旧 `v-model` 兼容、单图/多图上传列表、容器宽度自适应 1/2/3 列。全库组件也须逐项对照设计源，不能以构建或 detector `[]` 代替设计验收。

- 库入口为 `lx-ui`，样式入口为 `lx-ui/style.css`；本地消费保留 `src` 入口，发布配置指向 `dist/lx-ui.js`、`dist/style.css` 和 `dist/index.d.ts`。
- 选择、树、穿梭、上传的值由宿主通过 `v-model` 管理。`LxSelectPagination.api({ page, pageSize, keyword, ...params })` 返回 `{ records, total }` 或 `{ data: { records, total } }`，初始跨页标签可由 `valueMap` 提供；请求变化、搜索和卸载会使旧响应失效，续页失败可重试。
- `LxUpload` 默认手动提交；`action` 或 `httpRequest` 由宿主配置。文件校验、进度/状态展示、失败重试、取消和 `clearFiles()` 回写由库处理；自定义适配器收到 `chunkSize` 提示，但分片协议仍由宿主实现。独立 Mock Demo、4 项单测和 3 项 Chromium 用例已通过，未触发真实上传。
- `LxVirtualTree` 的禁用节点不可勾选；`LxTransferPanel` 在树勾选更新时保留暂未加载和禁用节点，支持全选/反选、上限禁用和清空事件。其 `change.nodes` 只包含当前树可解析的节点，未加载键只通过 keys 回传。
- `LxSplitLayout.asideWidth` 接受数值像素或 CSS 宽度字符串；拖拽、方向键调整及容器变窄限宽时发出像素 `resize`，折叠后主区保持同行。
- `LxProTable` 的默认插槽可覆盖配置列，`empty` 插槽覆盖空态；`tableAttrs` 透传 Element Plus 表格属性与原生事件。实例暴露 `getTableRef()`、`clearSelection()`、`toggleRowSelection(row, selected?)`、`getSelectionRows()`，原 `row-click` 语义事件仍保留。
- `LxProTable` 的独立文档 Playwright 4/4 通过：跨页选择/清空、加载读屏状态与减少动效、空结果/失败重试/排序反馈、375px 局部滚动与方向键、44px 复选目标和 HUD 深色令牌。选择状态由 `selectedKeys` 驱动；分页切换时保留已选记录并更新当前页复选框。示例数据和状态只存在于浏览器内存。
- `LxPagination` 增加 `layout`、`background`，默认行为不变；局部滚动页面使用 `autoScroll=false`。`LxSearchBar.controls` 覆盖内置查询/重置按钮，原 `actions` 插槽保留。`LxNavbar.showFullscreen` 默认 `true`。`LxBreadcrumb.select` 传 `(item, MouseEvent)`。`LxSectionTitle` 默认插槽和 `LxMetricCard` 的 `label`、`value`、`footer` 插槽均有原内容回退。
- `LxMetricCard` 按设计稿支持 `title`、语义 `status`、`badgeText`、进度标签与格式化值，并继续兼容 lx-ui `label`/`badge` 和 Vue3 宿主 `valueType`/`footer` 及 `title`/`value`/`footer`/`extra` 插槽；进度值被限制到 `0–100` 并提供 ARIA 名称和值文本；固定轨道内使用 transform 更新填充，并支持 RTL 起点。
- 权限消费层已提供 `setupLxPermission`、`hasPermission`、`isFieldMasked` 和 `maskValue`；`LxActionButtons.auth`、`LxProTable`/`LxDescriptions` 的 `mask` 只消费宿主注入的权限源。

## 验证

在 `linkx-fe` 目录执行：

| 命令              | 结果                                              |
| ----------------- | ------------------------------------------------- |
| `pnpm typecheck`  | 通过，包含 `docs/**/*.vue` 的类型检查             |
| `pnpm build`      | 通过，130 个模块；生成 JS、CSS 与声明文件         |
| `pnpm build:docs` | 通过，页面渲染完成；存在大于 500 kB 的 chunk 提示 |

Vue3 宿主 `tests/unit/lx-virtual-tree.test.ts` 覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘展开/焦点移动、全部公开方法和 node 插槽。独立中文 Demo/API 页位于 `docs/components/lxvirtualtree.md`，状态示例中的加载和错误由宿主展示。Chrome 浏览器已验证桌面筛选/选择/键盘焦点、空结果/错误恢复、375px HUD 深色令牌和无横向溢出；不等于 Vue3 业务宿主替换或真实后端联调。

Vue3 宿主 `tests/unit/lx-search-bar.test.ts` 覆盖受控值更新、默认值重置并立即查询、loading 锁定和展开字段。SearchBar 文档 Demo 的成功/空/错、失败恢复、重置和 loading 已通过桌面浏览器检查；375px 展开十项条件时页面没有横向溢出。

Vue3 宿主 `tests/unit/lx-dialog.test.ts` 覆盖标题关联、确认与 loading 锁、取消/关闭和自定义 footer 共 4 项。`tests/e2e/lx-dialog-docs.spec.ts` 的 3 项 Playwright 浏览器检查覆盖 375px 面板收缩/页面无横向溢出/单列布局/44px 点按目标、键盘焦点环、减少动效、校验失败、loading、防重复确认、提交成功、ESC 与自定义 footer。弹窗标题由 Element Plus `titleId` 关联到标题文本；示例提交只使用本地内存 Mock。

以下组件已有专项证据：LxIcon、LxVirtualTree、LxTransferPanel、LxDialog、LxSelectPagination、LxUpload、LxDescriptions、LxMetricCard、LxAuthImg、LxStatusSwitch、LxActionButtons、LxEmpty、LxSidebar、LxBreadcrumb、LxNavbar、LxTabsBar、LxPageCard、LxSplitLayout、LxDutyCalendar、LxPagination、基础控件桥接、LxDynamicForm 和 LxSearchBar。壳层组件 Playwright 4/4 覆盖键盘路由接管、通知和用户菜单、页签交互、具名 region 及组件容器窄屏布局；修复了通知徽标遮挡点击的问题。其余组件尚未完成真实浏览器下的鼠标、键盘、响应式和深色主题验收，不能由构建通过推断。

Impeccable `detect.mjs` 的源码输出 `[]` 且退出码为 0，只代表本次静态规则没有命中；URL 扫描的非零退出码即使同时输出 `[]` 仍是失败。LxIcon 文档页已有一份正式单目标 Critique 快照（27/40）；静态 `index.vue` 扫描为 `[]`，浏览器 overlay 则列出 4 条细项、标题计数为 3，命中主要在 VitePress 文档外壳。主会话浏览器另抽查 `delete` hover 动画和 `prefers-reduced-motion` 降级均符合预期。键盘 focus 现仅将卡片自身 1px 边框切换为主色并应用主题浅底，不叠加 inset 阴影或额外轮廓；文档 Playwright 检查焦点颜色、底色及焦点前后尺寸一致。其余图标动效仍待覆盖。该快照不关闭整库 UI-11；整库评审仍需在 UI-10 闭环后覆盖其他组件、主题/状态与动效，并按组件边界复核 overlay 命中。

`LxSidebar` 有独立中文 API/Demo；文档 Playwright 2/2 覆盖分组键盘与 `aria-expanded`、菜单单次选择、rail 浮层焦点和 Escape、移动模态抽屉的焦点循环/关闭后返回、HUD 深色及减少动效。当前证据为组件库级验证；Vue3 现有侧栏仍使用 Element Plus 菜单和权限路由数据，尚未替换为 `LxSidebar`。整库 Impeccable 视觉/动效审查仍待 UI-10 完成。

`LxForm` 桌面网格沿用设计稿 16px 列距和 `span="full"` 通栏字段；视口不大于 640px 时折成单列并让所有字段占满宽度。输入、数字、日期范围和文本域聚焦使用贴边 1px 状态边线与紧邻的 2px、15% 主色光晕；单选与多选下拉统一由控件自身 1px `border-box` 实体边框表达焦点，不在控件外叠加第二圈。普通焦点显示主色边框，错误焦点保留错误色边框；下拉不使用 `box-shadow` 或 `outline`，焦点时控件维持 32px 尺寸。复选框保留 14px 方框和 1px 状态边线，焦点环在方框外零间隙显示 2px 主色光晕，不使用偏移 outline 或改变尺寸；HUD 未选复选框采用深色填充与可辨边线。Demo 将“全选通知渠道”与缩进子项分行展示半选/全选，定向 Playwright 覆盖单选/多选边框、错误态、分行位置、真实未选中/已选中/半选、HUD 和 375px。多选边线已加入桌面、深色、错误及窄屏回归，正式 Critique 结果见本轮交接；此前发现的错误文案约 4.4:1、375px 弹层遮挡字段标签和 34px 选项行高仍作为后续独立任务。组件级评审不代表 UI-11 整库审查。Vue3 业务表单尚未替换，仍需按原表单校验和提交契约做宿主适配。

`LxSplitLayout` 有独立中文 API/Demo；宿主单测 3/3 覆盖键盘宽度边界、受控折叠和 `ResizeObserver` 清理；文档 Playwright 3/3 覆盖 1920px 键盘/拖动限宽、桌面折叠主区同行、375px 局部表格滚动/44px 按钮、HUD 深色和减少动效。库类型检查、134 模块构建与文档构建通过。Vue3 业务页仍待 UI-04 契约迁移；UI-11 正式 Critique 未完成，本次不以 detector `[]` 作为验收。

`LxDutyCalendar` 有独立中文 API/Demo；8 项单测与文档 Playwright 3/3 覆盖 42 格、月份边界与年份切换、键盘焦点、slot、宿主空/加载/失败/只读状态、375/320px、触控尺寸、HUD 深色、文字对比度和减少动效。库类型检查、134 模块构建及 VitePress 构建通过。无专属 `design/` 日历稿；Vue3 旧排班页的班次详情、加载、查询和实例方法契约需在 UI-04 适配，UI-11 正式 Critique 仍待 UI-10 闭环。

`LxPagination` 的中文 API/Demo 覆盖默认与自定义 layout、背景样式、自动重置/滚动和站点明暗主题；5 项组件单测验证受控事件顺序与滚动开关，2 项适配器单测保留旧 `page/limit/pagination` 契约，文档 Playwright 3/3 覆盖条数切换、主题、375px 局部滚动及键盘焦点。文档 Demo 使用 `zh-cn` locale；detector 对组件、Demo、文档和 Vue3 适配器 stdout `[]`、stderr 空、退出码 0，仅表示本次静态规则零命中；UI-11 正式 Critique 仍待 UI-10 其余组件闭环。

`LxPasswordInput` 独立中文 API/Demo 已覆盖密码显隐与清空、输入事件、focus/blur/select 实例方法、默认剪贴板可用与显式阻止、只读/禁用语义和窄屏布局。2026-10-06 修后单测 10/10、文档 Playwright 9/9，覆盖 320px 真实目录锚点、暗色 VitePress 表面与 Element Plus 输入主题变量、HUD 切换、44px 工具栏/高级标签、键盘和减少动效；独立代码复审批准，Impeccable A 为 32/40。B 的三个 detector 均为有效 JSON `[]`、stderr 空、退出码 0；overlay 11 个目标归因为 HUD 主题提示或 VitePress 文档壳层。`preventClipboard` 只阻止前端剪贴板事件，不是安全边界；Demo 使用内存样例，不访问登录接口。宿主 Form 校验失败集成示例仍列在 Form/DynamicForm 后续任务；组件验收不代表真实认证联调或 UI-11 整库 Critique 完成。

`LxEmpty` 有独立中文 API/Demo；5 项单测覆盖默认文案、status 语义、紧凑档、自定义尺寸校验、图标/操作插槽与宿主 class 透传。文档 Playwright 覆盖默认 64px、`image-size=80`、键盘操作、筛选恢复、两主题对比度、长描述和 375/320px 无横向溢出。阶段性启发式评审曾记 28/40，亮色浏览器 overlay 发现 5 项真实低对比度文字；已改用正文令牌并补对比度回归。后续流程审计确认该评分没有对应的 Impeccable Critique 快照，且设计评审未在独立新标签检查页面，因此不能视为正式 Impeccable 验收，需在 UI-11 按 skill 规范补齐。detector `[]` 仅表示静态规则零命中。Vue3 15 处 `el-empty` 仍待 UI-04 替换，组件证据不代表宿主页面已经采用。

VirtualTree 已检查桌面浅色与 375px HUD 深色；TransferPanel 当前 30 项单测、文档 E2E 28/28，VirtualTree 当前 34 项单测、文档 E2E 13/13，合计单测 64/64；覆盖树外键/禁用键保留、全选/反选、上限与清空、宿主状态、窄屏触控、键盘焦点及 HUD 深色。桌面树项基准行高为 32px，TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。Dialog 已通过桌面手动检查和 375px Chromium 测试；SelectPagination 已通过跨页回显、搜索取消、失败恢复、空结果、375px 弹层和触屏按钮 Playwright 3/3；LxUpload 已通过手动 Mock 上传、进度、失败恢复、取消、校验及 375px 交互；LxDescriptions 已通过 6 项单测、3 项文档 Playwright 和阶段性组件级 Impeccable 定向检查（19/20），覆盖 32px 行高、复制键盘焦点、状态点、375/320px 抽屉边界、主题及减少动效；其 detector `[]` 仅代表静态规则零命中，不是正式 Critique 通过；LxMetricCard 已通过 6 项单测和 2 项文档 Playwright，覆盖旧宿主契约、趋势图标、语义色、进度读屏、对比度及 320px/HUD/减少动效；LxAuthImg 已通过 6 项单测和 3 项文档 Playwright，覆盖 Blob Mock、取消竞态、对象 URL 清理、失败回退、空源及 375px/HUD/减少动效；LxStatusSwitch 已通过 6 项单测和 3 项文档 Playwright，覆盖旧值映射、确认取消、只读、失败恢复、4.5:1 对比度、焦点、42×20px 轨道、375px 44×44px 点按区、HUD 深色和减少动效；LxActionButtons 已通过 3 项单测和文档 Playwright 3/3，覆盖 hidden/disabled、click 事件、键盘展开、Escape 焦点恢复、焦点移出/外部点击收起、375px 44×44px 点按区、HUD 深色和减少动效；基础控件桥接、DynamicForm 和 SearchBar 已检查桌面及 375px。这些证据不代表全部组件矩阵、Vue3 业务宿主回归或真实上传协议联调。文档站演示使用本地示例数据，上传网络接口需由宿主提供。

## 设计来源与宿主采用

`design/` 中的按钮、表单控件、检索、状态开关、远程分页选择、描述行、虚拟树/穿梭、上传、指标卡和区块标题是当前视觉/交互源；`doc/LxIcon*` 的动态图标已进入 LxIcon 目录和文档 Demo。基础控件桥接页 `/components/element-bridge` 现覆盖按钮、表单八件套、Tabs、Card、Tree、Descriptions，并通过桌面、HUD 深色和 375px 检查；`LxDynamicForm` 独立页覆盖 Mock 成功/空/错、联动、禁用、重置、栅格和 375px；`LxSearchBar` 独立页覆盖成功/空/错、失败恢复、展开、重置、loading 与 375px 全字段布局；`LxSelectPagination` 独立页覆盖 300ms 防抖、远程追加分页、targetMap 跨页标签、取消和错误恢复；`LxUpload` 独立页覆盖内存 Mock 进度、成功/失败重试、取消、文件校验、两种列表布局、375px 触屏和 HUD 深色；`LxDescriptions` 独立页覆盖 32px 紧凑行、复制字段、状态点、主题及窄屏抽屉边界；`LxMetricCard` 独立页按指标卡设计稿展示语义色、角标、趋势与进度，趋势箭头采用 LxIcon，兼容宿主旧属性，6 项单测及 320px/HUD/减少动效文档浏览器用例通过；`LxAuthImg` 独立 API/Demo 使用本地 PNG 和宿主 Blob Mock，6 项单测、3 项文档 Playwright 覆盖成功、失败回退、空源、取消、对象 URL 清理、375px、HUD 深色、键盘与减少动效；`LxStatusSwitch` 独立页覆盖 `boolean`/旧 `0/1`、关闭确认、只读、loading、Mock 失败恢复、对比度、焦点、轨道尺寸、375px 点按区、HUD 深色及减少动效；`LxTransferPanel` 独立页覆盖全选/反选、上限、树外既有键、禁用项、清空和宿主 loading/empty/error 状态。库内已有实现不等于 Vue3 已采用，宿主页面映射及状态见 `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`。

Vue3 的 SearchBar、ProTable、PasswordInput、Breadcrumb、Navbar、SectionTitle 适配器已使用 lx-ui；侧栏、Navbar、SearchBar 和 GroupTags 的首批图标也已改用 LxIcon，其他页面的 Element Plus 图标仍待分批迁移。GroupTags 表格与分页在窄屏使用独立键盘可聚焦滚动区，Mock E2E 4/4。ActionButtons、StatusSwitch 等仍由宿主独立实现。组件库行为和 Demo 完成后再执行 Impeccable 组件/动效审查；Vue3 全量替换后执行 Impeccable 页面审查。二者均需写入交接记录，不能由构建通过代替。

## LxIcon 设计清单验收

- 94 个标准图形键和 2 个兼容名称已归并；名称/路径单测位于 Vue3 宿主 `tests/unit/lx-icon.test.ts`。
- P0 13 个核心图标、P1 27 个业务图标和 29 枚扩展清单均映射至可用图形；其中 `date`、`eye-on` 复用既有图形。
- 组件测试覆盖 69 个去重动效名称；专项浏览器验收 `pnpm test:e2e:icons` 分别验证桌面悬浮、键盘焦点、减少动效，以及 Chromium 触屏按压、剪贴板操作和 320px 窄屏。
- 扩展清单沿用 P1 语义动效；29 枚清单使用与参考稿一致的放大和蓝色阴影反馈。所有动效尊重 `prefers-reduced-motion`。
- Impeccable 定向预检后，LxIcon hover/focus 使用自然减速曲线；warning 与 email 动效仍提供轻微语义反馈。桌面和 Pixel 7 浏览器均验证 hover/键盘/触屏及减少动效。
- `LxUpload` 进度填充已改为固定轨道上的 `transform` 缩放，并在减少动效设置下关闭过渡；Chromium 文档 E2E 覆盖进度、重试、取消和该偏好。
- 本阶段验证：图标单测 5 项、桌面/移动专项 E2E 各 1 项通过；Vue3 与 lx-ui 类型检查、Vue3 定向 ESLint、Prettier、组件库构建和文档构建通过。组件库未配置独立 ESLint。

### 2026-09-30 UI-13 LxForm 首错焦点修复复验

- 状态：实现与回归已完成，正式 UI-11 仍未关闭。
- 证据：`.impeccable/critique/form-focus-postfix-2026-09-30/browser-evidence.json`；LxForm 桌面/375px 提交失败后首个错误输入获得焦点，`aria-invalid` 和页面宽度契约保持。
- detector：LxForm、LxFormItem、LxDynamicForm 及 fields 目录均为有效 JSON `[]`，stderr 为空、退出码 0；该结果只代表静态规则零命中。
- Form 综合报告中的旧“焦点未修复”结论已由 postfix 证据标记为历史观察；当前首错焦点已在桌面/375px 复验。Wave 5 独立 A/B、综合报告和 snapshot 已保存，B 保留 CUA 不可用的 `DEGRADED` 限制；下一步继续处理剩余 P2/P3 建议并推进全库 52 项矩阵。

## 2026-10-04 Wave 0 日期说明关联

- 当前工作区 DatePicker/DynamicForm 定向单测 36/36；lx-ui 类型、构建、文档构建通过，DatePicker 文档 E2E 1/1。
- 代码审核未发现可复现缺陷；新增区间起止和相邻区间说明 ID 隔离断言。
- 正式 Impeccable A/B、overlay 和 snapshot/trend 仍待完成；该行为修复不代表基础控件严格视觉矩阵关闭。
