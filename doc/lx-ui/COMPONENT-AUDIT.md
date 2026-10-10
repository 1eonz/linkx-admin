# LinkX 项目组件审计报告 — lx-ui 覆盖度与设计决策底稿

## 2026-10-11 UI-10 / Wave 10 TransferPanel 选择框与桌面树行复验完成

树节点与页脚继承复选框的视觉盒统一为 14×14px；树节点点击区桌面保留 24×24px、窄屏保留 44×44px，页脚 `LxCheckbox` 标签点击区桌面最小高度 32px、无悬停设备最小高度 44px。键盘焦点和原有树行键盘模型保留。尺寸修复已合入 `ad797971`。

修前独立 Assessment A 为 33/40（Good）：桌面 820px Demo 树行名称、编码和状态挤压的 P2 由截图确认，已使元数据可收缩并由 title 保留完整值；320px 动作区拥挤的 P2 经浏览器 DOM、按钮位置和整页宽度测量排除为误报；状态/主题默认折叠的 P3 已通过动态摘要处理。Demo 交互用例现在覆盖摘要更新。

改后验证：`linkx-fe` 类型检查、203 模块构建、VitePress 文档构建、TransferPanel 文档 E2E 33/33、目标 ESLint/Prettier 和 `git diff --check` 通过。正式 A 为 35/40（Good）；B 三个目标 detector 均为有效 JSON `[]`、空 stderr、退出码 0，浏览器 overlay 成功并完成桌面/窄屏浅色/HUD 取证；隔离代码复审无 P0–P3。综合报告与 snapshot/trend 见 `.impeccable/critique/transferpanel-final-2026-10-11/`。宿主保存状态归 UI-04，元信息字号和触屏长编码全文入口留给 VirtualTree 复验。本波不增加 UI-10 52 项矩阵关闭数。

## 2026-10-10 UI-13 / Wave 9 LxUpload 回灌 abort 回归

`LxUpload` 已补 fallback UID 回灌后公开 `abort()` 的组合回归，单测 38/38；文档 E2E 首次为 7/9，服务恢复后两个用例独立重跑 2/2，当前证据合计 9/9。记录见 `.impeccable/critique/wave9-upload-2026-10-10/agent-notes.md`。真实上传协议和服务端 AbortSignal 联调仍属 UI-04，下一项进入 `LxDescriptions`、`LxVirtualTree` 当前版正式审查。

## 2026-10-10 UI-10 / G2 SearchBar、StatusSwitch 阶段性审查（降级，未正式关闭）

`LxSearchBar` 已完成当前修复：`role=search`、loading/折叠字段 ARIA、移动 44px 触控和减少动效降级；单测 8/8、文档 E2E 3/3，Assessment A 降级评分 31/40。`LxStatusSwitch` 已完成确认竞态、外部 modelValue/权限源变化和权限撤销保护、loading/只读 ARIA、Space 键盘和失败重试；单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6。

SearchBar 修后 Assessment B 的组件、Demo、文档 detector 均为有效 JSON `[]`，stderr 为空、退出码 0，并已保存亮色/HUD、1440/375px、减少动效和交互截图/DOM 证据；overlay 注入未稳定完成，`[]` 仅表示静态规则零命中。Assessment A 因浏览器不可启动为降级评审，评分 **31/40（Good）**。报告位于 `.impeccable/critique/g2-complete-2026-10-10/assessment-a/report.md` 与 `assessment-b/report.md`；没有可用统一综合报告、snapshot/trend，故 G2 与全库 UI-10 **0/52** 均保持阶段性状态。

当前仅关闭实现级检查：`linkx-fe` 的库构建、定向单测/E2E、类型和格式检查通过。不能把构建、Mock 或 detector `[]` 当作正式 Critique 通过。P1：SearchBar 四字段操作行与设计稿不一致、StatusSwitch HUD 与 Teleport 确认层可能脱节；P2：SearchBar 无 `meta` 时结果/错误状态不可见、StatusSwitch 行名未进入可访问名称、375px 复杂状态及确认/失败/只读路径缺少完整实图、文档页资源 404 待归因。Vue3 宿主 `element-plus`、权限中心、字段权限和引导页仍按计划冻结。

## 2026-10-10 UI-10 / Wave 7 LxTransferPanel 正式关闭

`LxTransferPanel` 已完成当前源码冻结后的严格组件审查。定向单测 **64/64**，TransferPanel 文档 E2E **32/32**；覆盖 820px 文档预览、5:2:5 桌面布局、320/390px 长名称折叠展开、筛选恢复、键盘、触控和无横向溢出。Assessment A **32/40（Good）**；Assessment B 的组件、Demo、文档 detector 均为有效 JSON `[]`、stderr 空、退出码 0，并完成浅色/HUD × 1440/390/320px overlay 和浏览器测量。`[]` 仅表示静态规则零命中，不能替代视觉证据。独立代码复审无 P0–P3。

综合报告与 snapshot/trend：`.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/final-report.md`、`.impeccable/critique/2026-10-09T16-43-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。P2/P3 保留 1024px 元信息扫描密度、窄屏条目内距、整树反选发现成本和滚动提示位置；不增加 Vue3 宿主替换或 UI-10 之外的关闭数。下一项为 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-09 UI-10 / Wave 7 LxTransferPanel 820px 预览复验

根据页面宽度反馈，文档 Demo 预览最大宽度设为 `820px` 并居中，窄屏使用正文可用宽度；组件 API 默认高度仍为 `380px`。`240px` 紧凑档保留为 Demo 默认，高度选择器移至示例上方常显；300px 和 380px 作为可选档。移动候选计数改为“待选”，无障碍名称同步；文档在示例旁明确本地选择不是已保存权限。

定向单测 **64/64**、TransferPanel 文档 E2E **30/30**；E2E 覆盖 1440px 居中限宽、390px 正文可用宽度、页面无横向溢出及移动标签。lx-ui/Vue3 类型检查、目标 Prettier、203 模块构建、Vue3 生产构建通过。VitePress 文档构建与最终独立 A/B 正在完成。Luna 代码复审无 P0-P2；旧完成记录中的测试计数和哈希已按 P3 建议修正。

## 2026-10-08 UI-10 / Wave 7 LxTransferPanel 正式审查收口中

`LxTransferPanel`/`LxVirtualTree` 的组件实现、中文 Demo/API 和修复已完成；桌面采用 5:2:5 轨道与 380px `border-box` 同高面板，`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px。桌面树项基准行高为 32px；普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项标记与原始键值移至名称下第二行，实际截断的长名称才提供 disclosure；窄屏保持 380px 面板并完整换行，TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。行高跨断点时焦点恢复到 `treeitem` 的 P2 已修，文档站 SVG favicon 已加入。当前两组件定向单测合计 64/64，TransferPanel 文档 E2E 28/28；VirtualTree 文档 E2E 的 13 项另行统计。lx-ui typecheck、TransferPanel E2E ESLint、目标 Prettier、`git diff --check`、203 模块 lx-ui 构建、VitePress 文档构建和 Vue3 `build:prod` 均通过。Range 文本片段顶部计数曾将单行误判为折行，现以行盒高度、`nowrap` 与横向裁切重新断言，320/390/880px 通过。Vue3 构建保留既有 Less 导出、Element Plus circular chunk 与 chunk size 警告，VitePress 保留大 chunk 警告。此前组件代码复审已批准；本次断言修订的独立复审待确认。

旧 A/B 只作为修复前基线且不计正式通过；当前冻结版 Assessment B 浏览器证据已完成 **20/20**，正在收口证据索引及综合 snapshot/trend。完成综合报告和 snapshot/trend 前不登记正式通过。UI-10 仍为 0/52；Vue3 `DataPermissionTree` 替换和真实权限/后端联调属 UI-04，后者须依据真实契约验收。保留 Vue3 `element-plus`；新的严格隔离 A/B 与最新代码复审完成后再提交、推送并进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-07 UI-13 / Wave 6 Cascader、Descriptions、VirtualTree 正式审计

当前版本 `LxCascader`、`LxDescriptions`、`LxVirtualTree` 及文档侧栏已完成统一源码冻结后的组件级行为、浏览器和视觉复验。VirtualTree/Descriptions 定向单测 18/18、6/6，文档 E2E 3/3、3/3；Vue3 全量单测 58 个文件/457 个测试；lx-ui 类型检查、库构建、文档构建和 Vue3 类型检查通过。独立代码复审批准，无可复现 P0-P3。

Assessment A 为 35/40（Good）。Assessment B 的 7 个源码/文档目标均保存 JSON、stderr、退出码，结果为有效 `[]`、stderr 空、exit 0；四个新标签完成 overlay、键盘、HUD、错误/空态和 375px 证据。`[]` 仅表示静态规则零命中，B 使用隔离 Playwright fallback 的限制已写入报告。正式综合报告为 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`，原始证据、指纹和生命周期记录位于同目录。

本波关闭组件级审核门禁，但不增加 UI-10 52 项全库严格矩阵关闭数。Demo 控制区渐进披露、VirtualTree 自定义插槽行高契约和 Cascader loading 触发器语义列入后续 P2/P3；`LxTransferPanel` 进入下一波，继续对照 `design/虚拟滚动树 + 双栏穿梭/` 后再进行 Vue3 `DataPermissionTree` 宿主替换。

## 2026-10-07 Wave 5 选择器组件正式审计

`LxTreeSelect`、`LxCascader`、`LxSelectPagination` 已完成当前源码冻结后的行为、浏览器和视觉复验。定向单测 36/36、文档 E2E 15/15；A 32/40（Good），B 对 9 个源码/Demo/文档目标取得有效 JSON `[]`、空 stderr、退出码 0，并完成 9 个独立 overlay 场景；独立代码复审无 P0–P2。完整证据见 `.impeccable/critique/wave5-tree-select-pagination-2026-10-07/`。

本波修复了 SelectPagination HUD 令牌、Cascader 375px 长标签和三份文档选型说明。A 保留四项 P2：移动换行密度、错误后的旧成功状态、主题开关入口不对称、文档侧栏同级密度；另有长节点实际换行 E2E 的 P3 覆盖增强。静态 detector `[]` 只表示零命中，不作为视觉通过；本波不增加 UI-10 52 项矩阵关闭数。下一批按审计优先级进入 Upload 组合 abort 回归及数据展示/复杂交互组件。

## 2026-10-07 UI-13 / Wave 4 严格复验结论

`LxDatePicker`、`LxDynamicForm`、`LxUpload` 已完成统一源码冻结后的独立 A/B、代码复审和浏览器复验。A 设计评分 30/40（Good），没有 P0–P2；B 对三组件源码和三份中文文档共六个目标保存 JSON、stderr、退出码，均为有效 `[]`、stderr 为空、exit 0，并在 10 个新 context 覆盖 Light/HUD、桌面/375px、校验/上传/日期弹层状态。Overlay 命中已归因到 HUD 令牌、文档壳层、预期浮层覆盖和隐藏节点；移动文件名省略由 `title`、完整文本和操作标签保留可访问名称。定向单测 89/89，文档 E2E 43/43，目标格式、类型、203 模块构建和文档构建通过。

端口复验：4176 被另一项目占用后，lx-ui Playwright 与 DynamicForm/Switch 本地来源校验已统一隔离到 4177；三页组件 E2E 43/43、Switch 兼容 6/6 均通过。

本结果关闭本波组件级行为与视觉复验，不增加 UI-10 52 项严格矩阵的全库关闭数：`LxForm` 设计图逐项对照、真实上传服务端协议/取消、真实业务页面采用和整站 UI-11 Critique 仍开放。Wave 5 A 32/40、B 9 项 detector 与 9 个浏览器场景、代码复审无 P0–P2；移动换行密度、错误旧状态、主题入口不对称和侧栏密度四项 P2，以及长节点 E2E P3，列入下一批文档/壳层整改。Snapshot 已保存；下一审查批次为 Upload 组合 abort 回归和数据展示/复杂交互组件。

## 2026-10-07 UI-13 / DynamicForm、DatePicker 与 Upload 修后复验（过程记录）

本条保留统一冻结前的过程数据：DatePicker/DynamicForm/Upload 定向单测 **88/88**、文档 Playwright **36/36**；随后补充短视口与文件名回归并以顶部正式结论为准。真实上传服务端联调及 `LxForm` 设计图完整对照仍不包含在本次验收内。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 复审更正

独立复审发现并修复了 `LxUpload` 多实例回退 UID 冲突：UID 前缀序列现由 `LxUpload/uid.ts` 模块级工厂生成，同一父组件内两个实例对相同无 UID 文件的单测通过。DatePicker/DynamicForm/Upload 单测为 69/69、修复后文档 E2E 13/13，lx-ui 类型检查、203 模块构建、VitePress 文档构建和目标 Prettier/Vue3 ESLint 通过，文档构建保留大 chunk 警告。第二次独立代码复审核准，未发现可复现 P0–P2。此前 Impeccable A 与 B 使用不同文件冻结且 B 浏览器证据不完整，不能登记为正式 Critique；当前统一冻结后的隔离 A/B 待完成。该复审修复和组件级验收仍不关闭 `LxForm` 设计差异、真实上传联调或 52 项 UI-10 严格矩阵，当前仍为 0/52。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件验收

`LxDynamicForm` 的字段子组件、公开 Lx 控件组合、受控值兼容、远程查询、日期范围与上传映射已完成组件级实现和行为回归；默认 `daterange` 清空值明确为 `null`，并由 LxDatePicker 类型、DynamicForm 事件、Demo 和测试共同覆盖。`LxUpload` 受控重试队列、取消迟到回调、文件元数据回灌和跨实例 fallback UID 唯一性由回归覆盖。定向单测 69/69、UID 修复后文档 Playwright 13/13，lx-ui 类型检查和目标 Prettier/Vue3 ESLint 通过；生产库及文档构建待修后补跑。独立代码复审发现的 UID 重号已修复。此前 Impeccable A/B 源码冻结不匹配且 B 浏览器证据不完整，统一冻结后的正式 A/B 与 snapshot/trend 待重新执行。即使组件级 Critique 完成，也不等于 `LxForm` 全部设计差异关闭或本组件行达到统一 UI-10 严格口径。严格矩阵仍为 0/52。真实 adapter 服务端取消另需宿主协议验收。

## 2026-10-06 Wave 3 / LxIcon 修后复核

`LxIcon` 修后独立 Assessment A/B、浏览器 overlay 和代码复审均已完成。A 修后 37/40（修前基线 33/40）；B 对组件与文档各扫描一次，均为有效 JSON `[]`、stderr 0 字节、退出码 0，并在五个新浏览器 context 成功注入 overlay。命中已逐项归因到 CJK 字符宽度误报、Shiki/VitePress 文档壳层或 code-copy/导航规则误报，没有落在图标控件节点。单测 7/7、文档 E2E 当前配置复跑 2/2（单 Chromium 项目，独立浏览器评估覆盖 375px）。展开 P1/P2 分组仍需浏览 26/29 项，保留 P2；代码复审建议 E2E 直接比较图标名称集合，保留 P3，因此不增加 52 项严格矩阵关闭数。真实读屏器、真实权限菜单畸形数据和无 URL console 404 仍未覆盖/归因。综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`，snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。

## 2026-10-06 LxPasswordInput 严格复核进度

当前版独立 Assessment A 为 32/40，Assessment B 完成源码/Demo/文档三项有效 detector 与浏览器 overlay；三个 JSON 均为 `[]`、stderr 空、退出码 0。11 个 overlay 目标归因为 HUD 深色主题提示重复节点及 VitePress 文档表格/壳层，不是密码输入控件缺陷。修复后的移动锚点、暗色 Demo 和 44px 设置标签均经浏览器与 E2E 验证，独立代码复审批准。正式证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`。仍需在 Form/DynamicForm 波次补真实宿主表单校验失败集成示例，严格矩阵行暂不关闭。

## 2026-10-05 Wave 2 / LxSwitch 复验状态

`LxSwitch` 已完成组件实现、Demo、中文 API、行为回归及独立代码复核。单测 14/14、文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。独立代码复核批准，未发现可复现的 P0–P2 代码问题。Impeccable 双路评审为 32/40；这是以 29/40 为基线的有界复评，仅更新三项启发式，不是全量重新评分。组件、Demo、中文文档 detector 都是有效 `[]`、stderr 空、退出码 0，仅代表静态规则零命中。实现提交为 `1679d9c`，综合报告和浏览器证据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/`。

剩余事项分属共享文档壳层与宿主业务：移动侧栏关闭时的键盘顺序列入后续壳层复验；生产高影响操作的确认、审计和失败补偿须按真实宿主/API 契约验收；专业术语释义列为中文文档改进。它们不应由 LxSwitch 通用组件臆造。本次完成 LxSwitch 组件级复核，但以上交叉事项未关闭前不增加 52 项统一严格矩阵的关闭计数。其后续基础控件及动态图标子项已处理，DynamicForm/Upload 当前状态见本文件顶部；下一项按详细计划为 TreeSelect/Cascader 当前版正式复验。

## 2026-10-05 Wave 2 / Checkbox 与 Radio 复验状态

`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 的实现、中文 API/Demo、单测 20/20、文档 E2E 4/4、构建及独立代码复审已完成。Impeccable A 为 34/40；B 完成两组亮色/HUD/触屏/禁用/键盘/减少动效状态检查，Radio 与 RadioGroup 的最终版 overlay/preflight 16/16，触屏目标 44px 实测通过。四个源码目录和最终 Radio Demo 的 detector 均为有效 `[]`、stderr 空、退出码 0；仅代表静态扫描零命中。A 提出的 375px API 表格阅读 P2 仍开放；严格矩阵行继续保持待整改。证据及综合快照见 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。源码/E2E 提交 `be86f10`。

## 2026-10-05 Wave 2 / LxSelect 复验状态

`LxSelect` 已补齐远程失败时弹层开合两态就近恢复、HUD token 局部作用域、Teleported option 描述样式、设计样本中的单项离线禁用状态及触屏/窄屏 44px 选项行；中文 API/Demo 已同步，组件单测 10/10、当前文档 E2E 3/3，类型、库构建、文档构建和 Luna max 独立代码复审通过。主会话阶段检查及独立评估的证据边界见 `.impeccable/critique/wave2-lx-select-2026-10-05/`。Assessment A-only 暂定 29/40；正式 Critique 仍缺当前版 overlay、持久截图和 snapshot/trend；detector 有效 `[]` 只代表静态零命中。本矩阵仍为 **0/52 个公开组件按统一严格口径关闭**；下一基础控件子项为 Checkbox/Radio。

## 2026-10-04 基础控件 P1 复核

代码审核发现并定位到 `LxPasswordInput` 透传 `$attrs` 会允许 `type="text"` 绕过密码遮罩；当前已从透传属性中剔除 `type`，新增显隐往返及只读组合回归，7/7 通过，修后独立代码复审批准、未发现 P0–P2。剪贴板契约统一为默认允许，`preventClipboard` 仅为前端事件策略。Wave 1 的正式浏览器 overlay/snapshot 尚缺，因此该批不计入 52 项严格关闭数。

## 2026-10-03 UI-10 Wave 6 交付与审查状态更正

`LxTreeSelect` 与 `LxCascader` 的实现、Demo、API、单测和文档 E2E 已完成：单测 17/17，VitePress Playwright 8/8。当前源码与两份文档的 detector 均为有效 `[]`、stderr 为空、退出码 0，仅代表静态规则零命中。现存 10 月 2 日 overlay 截图早于当前代码/文档修改；本次浏览器策略拒绝 overlay 注入预检，因此当前版本缺少正式 Critique 所需的 overlay/复验，两个组件不登记为严格 UI-10 已关闭。既有 Assessment A 建议已落实，P3 观察项继续跟踪。本矩阵当前 **0/52 个公开组件按统一严格口径关闭**。

## 2026-10-02 UI-10 Wave 6 修后复验进行中

- TreeSelect 多选 footer 的内置中文硬编码改为 locale-aware 中英文默认和逐项覆盖；`selectedText` 支持 `{count}`。多选提交/取消语义及 footer slot 未改。
- Cascader 对并发 `loading`/`error` 采用 loading 优先规则，只有 loading 结束后 error 仍然存在才暴露错误、无效输入状态及 retry；Demo 删除路径与 last-action 双重读屏播报并分组演示控制。
- 修后行为单测 17/17、文档 E2E 5/5、lx-ui typecheck/build/docs build 及 Vue3 vue-tsc/Prettier 通过。组件库无独立 ESLint 配置；Vue3 ESLint ignored 外部路径不计通过。
- 前置 A/B 仅用于确定本次问题；修后 A/B 正在独立评估。完成建议复验、综合 snapshot/trend 前，矩阵状态仍“待严格复核”，不增加 0/52 严格关闭计数。前置 detector `[]` 是静态零命中，不是视觉通过。

## 2026-09-30 基础组件审查批次登记

除 `LxForm`/`LxDynamicForm` 外，基础控件本身也必须逐项严格对照设计：`LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch`、`LxPasswordInput`。矩阵关闭条件与其他组件相同：设计源、实现/token、Demo/API、行为测试、浏览器状态证据、代码审核和 Impeccable A/B 均齐备；不以 Element Plus 内核可用或 detector `[]` 代替视觉对照。

## Wave 5 postfix 审计状态（2026-09-30）

- `LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 已完成实现、定向行为回归和独立 A/B 证据收集；Assessment A 为 34/40（Good）。
- Assessment B 的源码/文档 detector 均为有效 `[]`、stderr 为空、退出码 0；Playwright 证据覆盖亮色/HUD、桌面/375px 和关键交互，保存 16 张截图及 sidecar，外部请求 0。因 CUA 不可用，B 标记为 `DEGRADED`。
- 已关闭上一轮 P1：portal HUD 主题断层、Drawer Escape 默认关闭、PageCard 错误恢复和窄屏 API 表格撑破页面。仍保留 P2/P3 设计建议，且 UI-11 全库正式矩阵不能由本波单独关闭。

## Wave 5 组件证据（2026-09-30）

本波完成 `LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 的实现与阶段性验收：对应 Demo/API、17 项定向单测和 7 项文档 Playwright 均通过；lx-ui 类型检查、构建和文档构建通过。浏览器证据保存在 `.impeccable/critique/wave5-2026-09-30/`，包含亮色/HUD、桌面/375px 截图、可访问性状态和无外部请求结果；Drawer 移动端截图在过渡完成后重拍，面板为 375px 全宽且页面无横向溢出。源码 detector JSON `[]`、stderr 为空、退出码 0 只代表静态规则零命中。

Wave 5 的独立 Assessment A/B、综合报告和 snapshot/trend 已落盘；B 由于 CUA 不可用使用 Playwright fallback，保留 `DEGRADED` 限制和剩余 P2/P3 建议。另登记 Element Plus 桥接缺口：`linkx-fe/src/components/LxForm/demo/control-bridge.vue` 直接使用 `ElTabs`/`ElTabPane`，待后续 UI-10 对照时补齐专用封装或明确桥接边界。

## UI-13 表单专项复验补丁（2026-09-30）

- 根据 Form/DynamicForm Assessment A 的真实发现，`LxDynamicForm` 新增可选 `field.feedback` 契约：状态文案贴在对应控件下方，并支持由宿主注入 `retry()` 与自定义按钮文案；错误反馈使用 `role="alert"`、稳定 ID 和 `aria-describedby`，不再把远程负责人失败提示孤立放在演示设置或表单底部。
- 动态表单 Demo 默认仍只展示可填写表单；布局、禁用、HUD 与候选 Mock 控制保留在默认关闭的“演示设置（布局、禁用、主题与 Mock 状态）”中。候选成功数量仍只在设置区显示，空结果/加载/失败状态移到“负责人”字段，避免重复错误文案。
- `LxDynamicFormFieldFeedback` 已同步导出、中文 API 文档、类型回归测试；宿主 `retry` 只触发已有恢复流程，网络请求继续由宿主按 `.then().catch().finally()` 编排。该补丁不改变 52 个组件“0/52 正式关闭”口径，仍需库级 UI-10 矩阵与 Impeccable 正式 A/B。

## 2026-09-30 当前完整清点（后续以本节为准）

旧版调研是 15 个组件时期的历史快照，不能代表当前库规模或 Element Plus 覆盖度。按 `linkx-fe/src/index.ts` 的 `componentRegistry` 逐项核对，当前公开注册 **52 个 Lx 组件**，另有 `lxMessage`、`lxConfirm` 两个反馈服务 API；源码中有 47 个组件目录，Sidebar 的子组件和 FormItem 等复合导出共用父目录，因此目录数不等于公开组件数。表格下方的旧统计和“明确排除组件”结论只保留作历史调研，不作为当前实施清单。

当前任务是对 52 个注册组件逐项做严格视觉对照。此前的单组件功能测试、局部截图或桥接页验收可作为证据，但没有完成本轮统一矩阵记录前，一律不视为全库严格对照完成。**基础组件内部使用 Element Plus 作为行为内核是允许的；对外公开和业务组合必须使用 Lx 封装，并由 Lx token/样式落实视觉稿。**

### 有直接视觉资产的组件

| 当前设计源                                                                                | 必须纳入对照的公开组件                                                                                                                                                                                                                 | 严格对照状态                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/按钮体系/`                                                                        | `LxButton`、`LxActionButtons`                                                                                                                                                                                                          | 待按状态、尺寸、按钮层级、危险操作与键盘焦点逐项核验                                                                                                                                             |
| `design/表单控件八件套/`                                                                  | `LxForm`、`LxFormItem`、`LxDynamicForm`、`LxInput`、`LxTextarea`、`LxRadio`、`LxRadioGroup`、`LxCheckbox`、`LxCheckboxGroup`、`LxSwitch`、`LxSelect`、`LxDatePicker`、`LxInputNumber`、`LxPasswordInput`、`LxCascader`、`LxTreeSelect` | TreeSelect/Cascader 当前版 A/B、浏览器和代码复审已完成，保留移动密度与状态一致性 P2；LxForm/DynamicForm 与基础控件仍按设计逐项核验。无 Cascader 专属稿时按 Select 控件外形与本设计源状态令牌验收 |
| `design/高频核心 13 枚/`、`design/中频 27 枚/`、`design/常用联想 29 枚/` 与 `doc/LxIcon*` | `LxIcon`                                                                                                                                                                                                                               | 按图标路径、命名、尺寸、动效触发/结束、主题、键盘及减少动效逐项核验                                                                                                                              |
| `design/检索面板 SearchBar/`                                                              | `LxSearchBar`                                                                                                                                                                                                                          | 待纳入全库矩阵复核字段密度、展开/收起、响应式及操作层级                                                                                                                                          |
| `design/状态开关 StatusSwitch/`                                                           | `LxStatusSwitch`                                                                                                                                                                                                                       | 待纳入全库矩阵复核开关轨道、状态色、只读/加载及确认反馈                                                                                                                                          |
| `design/上传拖拽区 Upload/`                                                               | `LxUpload`                                                                                                                                                                                                                             | 待纳入全库矩阵复核拖放区、列表、进度/失败/重试及移动操作                                                                                                                                         |
| `design/详情描述行 Descriptions/`                                                         | `LxDescriptions`                                                                                                                                                                                                                       | 待纳入全库矩阵复核标签和值的层级、行高、复制和窄屏折叠                                                                                                                                           |
| `design/虚拟滚动树 + 双栏穿梭/`                                                           | `LxVirtualTree`、`LxTransferPanel`                                                                                                                                                                                                     | 待纳入全库矩阵复核树密度、选中/禁用、双栏比例、空/加载和窄屏交互                                                                                                                                 |
| `design/远程分页下拉 SelectPagination/`                                                   | `LxSelectPagination`                                                                                                                                                                                                                   | 当前版行为、15 项文档 E2E、A/B 和代码复审已完成；保留严格矩阵中的设计差异与 P2 文档壳层整改                                                                                                      |
| `design/指标卡 MetricCard/`                                                               | `LxMetricCard`                                                                                                                                                                                                                         | 待纳入全库矩阵复核数值层级、语义色、趋势/进度和窄屏排列                                                                                                                                          |
| `design/区块标题 SectionTitle/`                                                           | `LxSectionTitle`                                                                                                                                                                                                                       | 待纳入全库矩阵复核变体、图标、标签、标题截断和对齐                                                                                                                                               |

### 按组件规范和既有唯一视觉源对照的组件

下列组件没有单独的 `design/` 画板时，不能据此沿用 Element Plus 默认视觉；须以 `doc/lx-ui/DESIGN-SPEC.md`、`COMPONENT-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md` 中适用章节为准。侧栏家族的唯一视觉源是 `doc/stitch_侧边栏/stitch_/`。每个条目同样要补当前源码、Demo、主题/尺寸/状态浏览器证据和复验结论。

| 规范/视觉源                                     | 必须纳入对照的公开组件                                                                                                                                                                                                                            | 严格对照状态                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `doc/stitch_侧边栏/stitch_/` + `DESIGN-SPEC.md` | `LxSidebar`、`LxSidebarBrand`、`LxSidebarItem`、`LxSidebarGroup`、`LxSidebarFooter`、`LxGauge`、`LxNodeBadge`                                                                                                                                     | 待全库视图逐项复核 rail/expanded、菜单状态、焦点、动效和窄屏抽屉               |
| `DESIGN-SPEC.md` + 对应组件 API/交互规范        | `LxNavbar`、`LxBreadcrumb`、`LxTabsBar`、`LxSplitLayout`、`LxPageCard`、`LxProTable`、`LxPagination`、`LxEmpty`、`LxStatusDot`、`LxTag`、`LxCodeSlot`、`LxSelectTree`、`LxDialog`、`LxDrawer`、`LxFormErrorBanner`、`LxDutyCalendar`、`LxAuthImg` | 待全库视图逐项复核；已有专项行为证据保留，但需补齐当前实现与规范的视觉差异记录 |
| `DESIGN-SPEC.md` §2、§6–§9 + `LxDialog` 规范    | `lxMessage`、`lxConfirm`（服务 API，不计入 52 个注册组件）                                                                                                                                                                                        | 对照反馈类型、语义色、字号、位置、时长、键盘关闭和减少动效                     |

### UI-10 统一完成门槛

1. 每个注册组件对应一个可信设计源，并记录关键数值或状态；直接设计资产优先于通用规范，旧版/压缩包仅用于追溯。
2. 对照默认、hover、focus、disabled、loading、error、empty、明暗主题、窄屏和 `prefers-reduced-motion` 中适用的状态；不可适用项说明原因。
3. 公共组合只使用 `Lx*` 导出；若库内暂时没有专用控件，则明确登记缺口和允许从 lx-ui 导出的 Element Plus 备选。Element Plus 实现可作为 Lx 包装内部的行为内核，不等于视觉对照完成。
4. Demo、中文 API 文档、行为测试和浏览器证据同步；记录 `component → design source → implementation/token → evidence → residual issues`。检测器 `[]` 只代表对应源码静态规则零命中。
5. 全量矩阵关闭后，先完成 lx-ui 组件/动效 Impeccable 正式复验和建议处理，再进入 Vue3 Element Plus 替换；替换完成后另做 Vue3 整站审查。

### 52 个公开组件逐项验收矩阵

本矩阵与 `src/index.ts` 的 `componentRegistry` 对齐。只有“当前矩阵状态”更新为已关闭，且记录设计差异、修改、Demo/API、行为测试、浏览器状态证据与剩余项，组件才算通过 UI-10。已有单测、局部截图或旧 Critique 只作支持证据。当前 **0/52 已按统一严格口径关闭**；TreeSelect/Cascader/SelectPagination 的组件级 A/B 已完成，但 P2 与全库设计矩阵仍未关闭。

| 公开组件             | 唯一对照源                                        | 当前矩阵状态                                                                                                                                                                               |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LxActionButtons`    | `design/按钮体系/`                                | 待严格复核；保留既有键盘/窄屏行为证据                                                                                                                                                      |
| `LxAuthImg`          | `DESIGN-SPEC.md` + 组件 API/Demo                  | 待严格复核；真实鉴权联调另列                                                                                                                                                               |
| `LxBreadcrumb`       | `DESIGN-SPEC.md` + 导航规范                       | 待严格复核；保留现有宿主导航契约                                                                                                                                                           |
| `LxButton`           | `design/按钮体系/`                                | 待严格复核；基础尺寸/层级/危险态逐项对照                                                                                                                                                   |
| `LxCascader`         | `design/表单控件八件套/`（无专属画板）            | 当前版单测/E2E、A/B 和代码复审完成；P2 为移动换行密度、错误旧状态、主题入口；按 Select 控件外形与状态令牌映射                                                                              |
| `LxCheckbox`         | `design/表单控件八件套/`                          | A/B 与行为完成；窄屏 API 表格 P2 待处理                                                                                                                                                    |
| `LxCheckboxGroup`    | `design/表单控件八件套/`                          | A/B、半选、禁用与触屏验收完成；随 API 表格 P2 保持开放                                                                                                                                     |
| `LxCodeSlot`         | `DESIGN-SPEC.md` + 组件 API/Demo                  | 待严格复核；代码区层级、复制反馈与窄屏                                                                                                                                                     |
| `LxDatePicker`       | `design/表单控件八件套/`                          | Wave 2 E2E 16/16、单测 39/39；A 31/40、B 9 场景、代码复审通过；4 项 P2/P3 未结，严格矩阵行保持打开                                                                                         |
| `LxDescriptions`     | `design/详情描述行 Descriptions/`                 | 部分证据；19/20 阶段审查不是正式关闭                                                                                                                                                       |
| `LxDialog`           | `DESIGN-SPEC.md` + Dialog API/Demo                | Wave 5 实现/17 项定向单测与文档证据完成；正式 Critique 待收口（焦点、确认、窄屏和动效）                                                                                                    |
| `LxDrawer`           | `DESIGN-SPEC.md` + Drawer API/Demo                | Wave 5 实现/文档证据完成；移动端稳态截图已复拍；正式 Critique 待收口（宽度、焦点、遮罩与窄屏）                                                                                             |
| `LxDutyCalendar`     | `DESIGN-SPEC.md` + Calendar API/Demo              | 待严格复核；无专属画板，需记录规范映射                                                                                                                                                     |
| `LxDynamicForm`      | `design/表单控件八件套/`                          | 实现、46 项单测、13 项文档 E2E 和代码复审通过；正式 Critique 收口中；`LxForm` 设计差异及统一 UI-10 严格矩阵仍开放                                                                          |
| `LxEmpty`            | `DESIGN-SPEC.md` + Empty API/Demo                 | Wave 5 实现/文档证据完成；正式 Critique 待收口，阶段性评分不替代本矩阵                                                                                                                     |
| `LxForm`             | `design/表单控件八件套/`                          | UI-13 实现/回归通过；首错焦点已修复并有桌面/375px 浏览器证据；正式 Critique 仍待综合关闭（移动提示层级与整库门槛）                                                                         |
| `LxFormErrorBanner`  | `DESIGN-SPEC.md` + 表单错误态规范                 | Wave 5 实现/文档证据完成；正式 Critique 待收口（图标、文案、语义色及窄屏）                                                                                                                 |
| `LxFormItem`         | `design/表单控件八件套/`                          | UI-13 本波；错误/必填 ARIA 与样式待正式 Critique                                                                                                                                           |
| `LxGauge`            | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；尺寸、比例、数值和深浅主题                                                                                                                                                     |
| `LxIcon`             | `design/LxIcon*` + `doc/LxIcon*`                  | A/B 与代码复审通过；真实读屏及权限菜单数据未覆盖，暂不计入严格矩阵                                                                                                                         |
| `LxInput`            | `design/表单控件八件套/`                          | 待严格复核；32px、边界、清空、错误/禁用/焦点                                                                                                                                               |
| `LxInputNumber`      | `design/表单控件八件套/`                          | 待严格复核；32px、步进按钮、边界与键盘                                                                                                                                                     |
| `LxMetricCard`       | `design/指标卡 MetricCard/`                       | 待严格复核；数值、语义色、趋势、进度和窄屏                                                                                                                                                 |
| `LxNavbar`           | `DESIGN-SPEC.md` + Navbar API/Demo                | 待严格复核；导航密度、焦点、菜单与窄屏                                                                                                                                                     |
| `LxNodeBadge`        | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；节点状态、字号和对齐                                                                                                                                                           |
| `LxPageCard`         | `DESIGN-SPEC.md` + PageCard API/Demo              | Wave 5 实现/文档证据完成；正式 Critique 待收口（表面、内距、加载及插槽态）                                                                                                                 |
| `LxPagination`       | `DESIGN-SPEC.md` + Pagination API/Demo            | 待严格复核；密度、分页按钮、背景与窄屏                                                                                                                                                     |
| `LxPasswordInput`    | `design/表单控件八件套/` + PasswordInput API/Demo | A 32/40、B overlay/浏览器、代码复审通过；10/10 单测、9/9 E2E；宿主校验失败集成示例 P2 待 Form 波次，因此严格行保持打开                                                                     |
| `LxProTable`         | `DESIGN-SPEC.md` + ProTable API/Demo              | 待严格复核；表头/行密度、选择、空错态和滚动                                                                                                                                                |
| `LxRadio`            | `design/表单控件八件套/`                          | A/B 与行为完成；中文播报、触屏和减少动效通过；窄屏 API 表格 P2 待处理                                                                                                                      |
| `LxRadioGroup`       | `design/表单控件八件套/`                          | A/B、键盘及禁用态验收完成；随 API 表格 P2 保持开放                                                                                                                                         |
| `LxSearchBar`        | `design/检索面板 SearchBar/`                      | 单测 9/9、文档 E2E 3/3；修后 A/B 已补独立浏览器/overlay 证据，Demo 增加四字段标准态；最终综合快照待收口，严格矩阵保持打开 |
| `LxSectionTitle`     | `design/区块标题 SectionTitle/`                   | 待严格复核；变体、图标、标签和长标题                                                                                                                                                       |
| `LxSelect`           | `design/表单控件八件套/`                          | 实现与行为验收：单测 10/10、文档 E2E 3/3；当前严格 Critique 待修后 A/B、overlay/snapshot；桌面 32px、窄屏 44px                                                                             |
| `LxSelectPagination` | `design/远程分页下拉 SelectPagination/`           | 当前版行为 4 项单测、文档 E2E、A/B 和代码复审完成；严格矩阵仍待 P2 处理与全库复验                                                                                                          |
| `LxSelectTree`       | `DESIGN-SPEC.md` + 组织树选择 API/Demo            | 待严格复核；与独立 TreeSelect 的视觉语义区分                                                                                                                                               |
| `LxSidebar`          | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；rail/expanded、菜单态、动效和抽屉                                                                                                                                              |
| `LxSidebarBrand`     | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；品牌锁定区、折叠态与对齐                                                                                                                                                       |
| `LxSidebarFooter`    | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；底部操作、焦点与窄屏                                                                                                                                                           |
| `LxSidebarGroup`     | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；分组层级、展开态和动效                                                                                                                                                         |
| `LxSidebarItem`      | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；选中/禁用/悬停/键盘态                                                                                                                                                          |
| `LxSplitLayout`      | `DESIGN-SPEC.md` + SplitLayout API/Demo           | 待严格复核；分栏比例、拖动、键盘和折叠态                                                                                                                                                   |
| `LxStatusDot`        | `DESIGN-SPEC.md` §2 + 状态点 API/Demo             | 待严格复核；状态语义、动画和减少动效                                                                                                                                                       |
| `LxStatusSwitch`     | `design/状态开关 StatusSwitch/`                   | 单测 17/17、文档 E2E 3/3；修后 A/B 已覆盖 HUD Teleport、ARIA 行名、确认影响/审计上下文和 375px 路径；最终综合快照待收口，Vue3 宿主替换仍待 UI-04 |
| `LxSwitch`           | `design/表单控件八件套/`                          | 组件级复核已完成；共享壳层与宿主契约仍跟踪，暂不计入全库严格关闭                                                                                                                           |
| `LxTabsBar`          | `DESIGN-SPEC.md` + TabsBar API/Demo               | 待严格复核；页签层级、关闭/拖动和横向滚动                                                                                                                                                  |
| `LxTag`              | `DESIGN-SPEC.md` §2 + Tag API/Demo                | 待严格复核；语义色、尺寸、关闭态与对比度                                                                                                                                                   |
| `LxTextarea`         | `design/表单控件八件套/`                          | 待严格复核；行高、字数、错误/焦点与窄屏                                                                                                                                                    |
| `LxTransferPanel`    | `design/虚拟滚动树 + 双栏穿梭/`                   | 当前实现、30 项单测、文档 E2E 28/28、名称/编码筛选及移动触控修复完成；桌面 32px 基准行高、320–420px 为 64px、421px 起为 44px；最新断言修订代码复审与正式 A/B 收口中；全库严格矩阵仍为 0/52 |
| `LxTreeSelect`       | `design/表单控件八件套/` + TreeSelect API/Demo    | 当前版单测/E2E、A/B 和代码复审完成；P3 为长节点换行 E2E 覆盖增强，严格矩阵仍待全库复验                                                                                                     |
| `LxUpload`           | `design/上传拖拽区 Upload/`                       | 受控模型、进度/失败/重试/取消/移除已有组件行为证据；设计图严格对照、提示文字视觉复核、正式 Critique 收口中                                                                                 |
| `LxVirtualTree`      | `design/虚拟滚动树 + 双栏穿梭/`                   | 当前 34 项行为单测、文档 E2E 13/13，含自定义 `filterMethod`、44px 移动触控和跨行高断点焦点回归；与 TransferPanel 联合参与本次严格 A/B，UI-10 全库矩阵仍待关闭                              |

---

> 用途：组件库样式与交互设计的依据文档。
> 调研范围：Vue2 老工程（`src/`，Vue 2.6 + Element UI 2.15）、Vue3 新工程（`other-admin/admin-vue3/`，Vue 3 + Element Plus 全量，全局 `size='large'`）、lx-ui（`linkx-fe/`，15 组件 + 2 函数式 API）。
> 统计口径：Grep count 实测按文件统计后汇总；数字为两工程合并值（标注分代的除外）。
> 结论速览：核心 15 类场景已覆盖 13 类；三大缺口 = SearchBar / StatusSwitch / EP 桥接样式层补齐。

---

## 一、项目全景

| 工程                                      | 技术栈                                | 组件形态                                                     | 业务模块                                                                                |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Vue2 老工程** `src/`                    | Vue 2.6 + Element UI 2.15（全局注册） | el-xxx + 自研组件全局注册（components/index.js install）     | 权限中心、通知、基础数据、协同岗、位置、排班、三方对接、警信扩展、多节点管理（10 大块） |
| **Vue3 新工程** `other-admin/admin-vue3/` | Vue 3 + EP 全量注册（`size='large'`） | el-xxx 按需 + 22 个自研组件按需 import                       | 同上 10 大块迁移；ProTable 三模式成熟化                                                 |
| **lx-ui** `linkx-fe/`                     | Vue3 + EP 二次封装 + 设计令牌         | 15 组件 + lxMessage/lxConfirm + `--lx-*` 令牌 + HUD 深色主题 | 目标：统一两代工程视觉与交互                                                            |

**两代工程交互范式高度一致**（迁移友好）：

```
列表页 = SearchBar + ProTable + 分页 + N 个弹窗子组件
弹窗   = init(type, row) 回显 → validate 校验 → 提交 → message + refresh
危险操作 = MessageBox.confirm 二次确认
加载态 = v-loading（表格） + 按钮 loading（提交防抖） + ElLoading.service（全屏轮询）
```

---

## 二、EP 组件使用全景（按频率分层）

### T0 高频核心（样式设计最高优先级）

| 组件                            | 次数                        | 项目中的作用与交互                                                                                                      |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| el-button                       | **~687**（V2 458 / V3 229） | 所有操作触发：搜索/重置/新增/批量删除/行内编辑/弹窗确定取消；V3 大量 `link` 型行内按钮                                  |
| el-table / el-table-column      | ~58 / ~418 列               | 列表数据展示；绝大多数经自研 ProTable 封装；行 hover、固定操作列、多选列（reserve-selection 跨页保留）                  |
| el-form / el-form-item          | ~447 / ~620                 | 弹窗表单（label-width 100~200px，90% label-position=left）+ 行内搜索表单（68px）；rules 校验（输入 blur / 选择 change） |
| el-input                        | **~436**                    | 文本/密码/textarea；clearable、回车搜索、前缀图标（唯一允许的装饰=搜索放大镜）                                          |
| el-select / el-option           | ~130 / ~159                 | 下拉枚举选择，大量 v-for 动态 options                                                                                   |
| el-dialog                       | **~128**                    | 编辑/详情/选择弹窗；标准配置 `close-on-click-modal=false` + `append-to-body` + `align-center`，宽 500~800px             |
| $message / ElMessage            | **~950**                    | 操作结果反馈之首；成功绿/失败红；http 拦截器统一 4 处提示                                                               |
| $confirm / ElMessageBox.confirm | **~117**                    | 删除/解绑/退出登录危险操作二次确认，warning 图标，取消走 `.catch(() => {})` 静默                                        |
| v-loading                       | ~100                        | 表格/树/抽屉加载遮罩 + ElLoading.service 全屏轮询（"数据同步中…"，5s 轮询）                                             |

### T1 中频

| 组件                    | 次数                  | 作用                                                                            |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------- |
| el-pagination           | ~14 直用 + 全部经封装 | 列表分页；pageSizes [10,20,50,100]，切条数回第 1 页                             |
| el-tag                  | ~89                   | 状态标记、已选人员标签、关键词标签                                              |
| el-card                 | ~63（集中 V3）        | V3 列表页标准容器（`.app-container > el-card shadow="always"`）                 |
| el-tabs / el-tab-pane   | ~30 / ~72             | 模块内多 Tab；**9 处 `type="border-card"`**                                     |
| el-tree                 | ~38                   | 权限树/部门树/菜单树勾选与展示（区别于选择器形态）                              |
| el-tooltip              | ~41                   | 长文本提示、详情抽屉指标说明（9 处集中）                                        |
| el-descriptions(+item)  | ~36 / ~57             | 详情键值对展示（客户端详情、授权详情、抽屉内）                                  |
| el-empty                | ~35                   | 树/列表/穿梭无数据占位                                                          |
| el-upload               | ~20                   | 头像/图标手动上传（`action="#" + auto-upload=false`）、Excel 导入、地图底图上传 |
| el-popover              | ~23                   | 组织树下拉容器（OrgTreeSelect 基座）、选中项详情弹出                            |
| el-date-picker          | ~21                   | 日期范围筛选、授权到期日                                                        |
| el-switch               | ~22                   | 启用/禁用行内切换（loading 防抖，inline-prompt 内嵌文字）                       |
| el-radio(+group)        | ~75                   | 表单单选、推送方式选择                                                          |
| el-checkbox(+group)     | ~33                   | 多选、记住密码、树节点勾选                                                      |
| el-input-number         | ~15                   | 端口/排序号/有效期                                                              |
| el-dropdown(+menu/item) | ~23                   | Navbar 用户菜单、"更多操作"折叠                                                 |
| el-row / el-col         | ~92                   | 表单栅格双列布局                                                                |
| el-scrollbar            | ~19                   | 侧边栏/弹窗滚动（仅 V2）                                                        |
| el-icon                 | ~46                   | EP 图标承载（仅 V3）                                                            |

### T2 低频

el-divider(12)、el-color-picker(6)、el-menu(3)、el-alert(3)、el-collapse(2)、el-breadcrumb(2)、el-progress(2)、el-drawer(2)、el-image(2)

### 完全未使用（0 次 → 明确排除出组件库范围）

`el-cascader、el-tree-select、el-steps、el-timeline、el-carousel、el-transfer、el-slider、el-rate、el-skeleton、el-result、el-badge、el-avatar、el-notification、el-popconfirm、el-statistic、el-select-v2、el-table-v2、el-autocomplete、el-time-picker、el-calendar、el-watermark、el-tour、el-anchor、el-float-button` 等。
**结论：项目重度依赖 表格 / 表单 / 弹窗 / 消息 四类，组件库以此为核心；上表零使用组件不设计、不封装。**

---

## 三、自研组件全景（两工程合并去重，30+）

### 3.1 表格与搜索（列表页骨架）

| 组件              | 频次                         | 作用 / 关键交互逻辑                                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ProTable**      | V2 8 / **V3 49（绝对核心）** | 配置式 columns + 内置分页。**三种数据模式**：纯 data / fetchApi 自治 / fetchApi 受控 + @response 回调（项目主流）；AbortController 竞态取消；reserve-selection 跨页保留选中；defaultTableFormatter 兼容 4 种后端结构；expose `init()`（回第 1 页）`refresh()`（保持页码）`mutate()`（乐观更新） |
| **SearchBar**     | V2 8 / **V3 25**             | V2：props 全配置（searchKey/showOrg/showDateRange/actions）+ ResizeObserver 自动换行。V3：`#filters` 插槽 + 关键字框（220px 回车搜索）+ 搜索/重置 + 右侧 actions 配置按钮（label/type/icon/onClick）                                                                                            |
| **Pagination**    | V2 26                        | v-model page/limit；**切 pageSize 自动回第 1 页**；autoScroll 回顶；`@pagination {page, limit}`                                                                                                                                                                                                 |
| **ActionButtons** | V3 29                        | 行内操作：`buttons` 配置或 `actions` **预设语义**（view/edit/disable/enable/delete → 自动图标+配色）；el-button link 型                                                                                                                                                                         |

### 3.2 选择器类

| 组件                                            | 频次     | 作用 / 关键交互逻辑                                                                                                                            |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **SelectTree / SelectTreeLazy / OrgTreeSelect** | 合计 ~36 | 组织树选择：popover + input + tree 组合；懒加载/同步双模式（读全局配置 DEPARTMENT_SYNC_SIGN）；非 admin 自动定位本部门；搜索过滤；选中回填关闭 |
| **SelectPagination**                            | V3 6     | **远程分页下拉**：remote 搜索 + 滚动加载更多（v-loadmore）；内部 targetMap 解决回显（已选项不在当前页仍显示）；api 必传注入                    |
| **SelectPopper**                                | 1        | 多选下拉容器基座（搜索 + 已选 tag 区 + footer）                                                                                                |
| **VirtualTree**                                 | 7        | 万级树虚拟滚动（可视区渲染）；getCheckedKeys/expandAll/filter 全量树方法                                                                       |
| **VirtualCheckboxList**                         | 1        | 花名册虚拟勾选列表（卡片式 checkbox + 计数）                                                                                                   |
| **DataPermissionTree**                          | 3        | **左树右已选双栏穿梭**：VirtualTree + VirtualCheckboxList + 全选/取消                                                                          |
| **RelatedUserSelect**                           | 1        | 协同人员选择：**树模式/搜索模式自动切换**，双数组 v-model（value + labels）                                                                    |

### 3.3 弹窗类

| 组件                                                   | 频次 | 作用                                                                                                       |
| ------------------------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------- |
| UserSelectDialog / PoliceSelectDialog / UserBindDialog | 各 1 | 搜索 + ProTable 跨页选人弹窗；标题实时"已选 N 人"；确认回传数组                                            |
| createDialog（V2 工厂函数）                            | 多处 | Promise 弹窗：`await dialogFn()` 拿提交数据；ok/cancel/close 三态 resolve/reject；全局登记 closeAllDialogs |
| Upload（V2）                                           | 2    | 拖拽/点击上传弹窗：格式大小校验 → uploadApi(FormData) 注入式 → 成功关闭                                    |

### 3.4 展示与状态类

| 组件                                  | 频次   | 作用                                                                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| **StatusSwitch**                      | 14     | **业务值反向映射 0=启用/1=禁用**；disabled 降级显示 el-tag；loading 防抖；开关内嵌文字                       |
| **StatusDot / ConnectionStatusDot**   | 8+     | 五态呼吸灯；**code 0-7 数字兼容层**（4→online，1/2/7→processing，0/5→busy，3/6→error，对齐后端连接状态枚举） |
| **SectionTitle**                      | 20     | 区块标题三 variant（dashed 虚线 / border 主色竖条 / plain）；icon + #extra                                   |
| **MetricCard**                        | 8      | 指标卡：title / 等宽字体大数值 / valueType 语义配色 / footer —— 客户端详情抽屉 6 连用                        |
| ModernCard / PersonnelCard / PoliceId | 储备   | 白底卡片容器 / 人员卡（头像+警号+状态点）/ 警号高亮标签                                                      |
| AuthImg                               | 12     | XHR 带 token 拉 blob 图片（鉴权头像/图标）                                                                   |
| PasswordInput                         | 9      | 密码框禁 copy/paste/cut；透传 el-input 全量                                                                  |
| Breadcrumb / Hamburger / SvgIcon      | 布局级 | 面包屑自动生成 / 侧边栏折叠 / svg sprite                                                                     |

### 3.5 Composables

`useTable`（分页/搜索/刷新/多选/乐观更新 + 竞态取消，API 与 ProTable expose 对齐）、`useFetch`、`v-loadmore` 指令。

---

## 四、lx-ui 现有组件清单

| 分类       | 组件                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 布局导航   | LxSidebar（+Brand/Item/Group/Footer）、LxGauge、LxNodeBadge、LxSelectTree            |
| 数据展示   | LxProTable、LxPagination、LxStatusDot、LxTag、LxEmpty、LxActionButtons               |
| 数据录入   | LxForm / LxFormItem（$attrs 透传 + 错误态接管 + columns 网格）                       |
| 反馈与浮层 | LxDialog、LxDrawer、LxFormErrorBanner、lxMessage、lxConfirm                          |
| 基础设施   | LxIcon（内置 24px stroke1.5 图标集）、`--lx-*` 全量令牌、HUD 深色主题、EP 变量桥接层 |

---

## 五、对比矩阵：lx-ui 覆盖度评估

### A. 已覆盖且满足 ✅

| 项目需求                        | lx-ui 对应          | 符合度说明                                                          |
| ------------------------------- | ------------------- | ------------------------------------------------------------------- |
| el-table + ProTable             | LxProTable          | 纯受控（columns/data/分页/多选/插槽）；数据模式差异见 B-1           |
| el-form 全家                    | LxForm / LxFormItem | $attrs 透传 + 五方法 + 错误态接管；label 上置/left 双形态兼容老项目 |
| el-dialog 弹窗                  | LxDialog            | close-on-click-modal=false 防误触、672px 双列、loading              |
| el-drawer 详情抽屉              | LxDrawer            | 480px 右滑、图标标题、footer 插槽                                   |
| $message / ElMessage            | lxMessage           | 时长差异见 B-2                                                      |
| $confirm / ElMessageBox.confirm | lxConfirm           | Promise\<boolean\> 优于项目 then/catch 写法                         |
| SelectTree 系组织树选择         | LxSelectTree        | 懒加载注入式、搜索过滤、checked-keys 受控                           |
| StatusDot / ConnectionStatusDot | LxStatusDot         | 五态 + code 0-7 兼容层已有 + pulse 节流建议                         |
| el-tag                          | LxTag               | 四语义 + closable                                                   |
| el-menu + Hamburger + 侧边栏    | LxSidebar           | rail/expanded 双态、HUD 风格，超出项目现状                          |
| SvgIcon / el-icon               | LxIcon              | 内置图标集                                                          |
| el-empty                        | LxEmpty             | —                                                                   |
| el-alert（表单阻断场景）        | LxFormErrorBanner   | report 图标 + 深红标题规格                                          |

### B. 已覆盖但存在交互差异 ⚠️（需设计决策）

| #   | 差异点                 | 项目现状                                                               | lx-ui 现状                                    | 建议                                                                            |
| --- | ---------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **表格数据模式**       | fetchApi 三模式 + 竞态取消 + mutate 乐观更新 + formatter 兼容 4 种后端 | 纯受控 data/total（P7 零请求铁律）            | 保持 P7；竞态取消/乐观更新下沉到 **useTable composable**（纯前端逻辑不违反 P7） |
| 2   | **Message 时长**       | 3s                                                                     | 设计稿 1.6s                                   | 设计稿为准；duration 参数已有可覆盖                                             |
| 3   | **ActionButtons 图标** | V3 带图标 + 预设语义（view/edit/delete 自动配色）                      | 纯文字（设计稿 P2 铁律"禁止图标按钮"）        | **冲突点待拍板**：遵循设计稿纯文字 vs 保留预设语义映射                          |
| 4   | **控件密度**           | V3 `size='large'`（40px）                                              | `--lx-control-height: 32px`（设计稿紧凑密度） | 设计稿为准；迁移时控件变紧凑属预期视觉升级                                      |
| 5   | **分页回第 1 页**      | 封装内置"切 pageSize 回第 1 页" + autoScroll                           | 纯受控，业务自行处理                          | 可加可选 `autoReset`，或文档推荐惯用法                                          |
| 6   | **弹窗宽度**           | 500~800px 不等                                                         | 默认 672                                      | width 可覆盖，兼容 ✅                                                           |

### C. 未覆盖 — EP 原生组件（不封装，但**桥接样式层需补齐**）⚠️

`element-theme.css` 目前只桥接颜色/圆角/字体基础变量，以下高频组件的**视觉规格尚未按设计稿定制**：

| 优先级 | 组件                                                                               | 理由                                                                     |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| P0     | **el-button**（687 次）                                                            | 第一大组件；主/次/link 三态需对齐设计规范（32px 高、4px 圆角、主色三态） |
| P0     | **表单八件套**：input/select/radio/checkbox/switch/input-number/date-picker/upload | LxForm 只接管错误态；控件本身的边框/焦点环/尺寸需桥接覆盖                |
| P1     | **el-tabs**（30 次，9 处 border-card）                                             | 设计稿已有 `--lx-bg-tabsbar` 专用 token，桥接待接                        |
| P1     | **el-card**（63 次）                                                               | V3 列表页容器；卡片阴影需对齐 `--lx-shadow-card`                         |
| P1     | **el-tree**（38 次）                                                               | 树勾选/展示形态（LxSelectTree 只覆盖选择器形态）                         |
| P1     | **el-descriptions**（36 次）                                                       | LxDrawer 详情内容主力，标签-值对齐规格                                   |
| P2     | tooltip / popover / dropdown 浮层三件套（92 次）                                   | 阴影/圆角对齐 `--lx-shadow-pop`                                          |
| P2     | collapse / divider / progress / scrollbar / breadcrumb / color-picker / image      | 低频，桥接兜底即可                                                       |

### D. 未覆盖 — 业务封装层缺口（lx-ui 高价值新增）

| 优先级 | 组件                                      | 频次 | 设计稿标本                                   | 封装要点（P7 兼容设计）                                                                                      |
| ------ | ----------------------------------------- | ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **P0** | **LxSearchBar**                           | 33   | 有（GRID 4-COL 检索面板 + ACTION 行）        | COMPONENT-SPEC 已有签名规划：字段驱动 `LxSearchField[]` + `#filters` 插槽 + actions 配置 + search/reset 事件 |
| **P0** | **LxStatusSwitch**                        | 14   | 有（胶囊滑块内嵌"开启/关闭"）                | 0/1 反向映射 + disabled 降级 Tag + loading 防抖，纯前端可封装                                                |
| P1     | **LxUpload**                              | 20   | 有（UploadDropZone 虚线拖拽区标本）          | V2 已是 uploadApi 注入式 → 不违反 P7；拖拽区 + 格式/大小校验 + tips                                          |
| P1     | **LxSelectPagination**                    | 6    | 无专门标本                                   | 远程分页下拉；api 注入 + **targetMap 回显**是项目独有难点                                                    |
| P1     | **LxDescriptions**                        | 36   | 有（抽屉标签-值两端对齐行）                  | 配 LxDrawer 的详情行组件                                                                                     |
| P1     | **LxSectionTitle / LxMetricCard**         | 28   | 有                                           | 区块标题三 variant / 指标卡等宽数值；V3 已有成熟原型可直接吸收                                               |
| P2     | **LxVirtualTree / LxCheckboxList**        | 8    | 有（花名册勾选标本：卡片式 checkbox + 计数） | 万级虚拟滚动，纯前端可封装                                                                                   |
| P2     | **LxTransferPanel**（DataPermissionTree） | 3    | 有                                           | 左树右已选双栏 + 全选/取消                                                                                   |
| P2     | **LxPasswordInput**                       | 9    | 无                                           | 复用 LxInput、显隐切换；默认允许剪贴板，显式事件拦截不作为安全控制                                           |
| P2     | **LxAuthImg**                             | 12   | 无                                           | 请求函数由业务传入（P7）                                                                                     |
| P3     | 人员选择弹窗壳                            | 3    | 无                                           | "SearchBar + ProTable + 多选"壳组件，fetchApi 注入                                                           |
| P3     | LxBreadcrumb                              | 2    | 无                                           | 路由自动生成                                                                                                 |
| P3     | **useTable composable**                   | —    | —                                            | 竞态取消/乐观更新/搜索刷新语义，纯前端逻辑（B-1 配套）                                                       |

### E. 明确不做 ❌

cascader / steps / timeline / carousel / transfer(EP 原生) / slider / rate / skeleton / result / badge / avatar / notification / popconfirm —— 项目 0 使用 + 设计稿无标本。

---

## 六、结论与建议

**覆盖度**：项目实际使用的 **15 类核心场景中 lx-ui 已覆盖 13 类**（表格/表单/弹窗/抽屉/消息/确认/树选择/标签/状态点/操作按钮/空态/侧边栏/错误横幅），核心骨架完整。

**三大缺口**（按投入产出排序）：

1. **P0**：LxSearchBar（33 次最大缺口、有设计稿标本、有规范签名）+ LxStatusSwitch（14 次）+ **EP 桥接样式补齐**（el-button 687 次与表单八件套是视觉统一主战场）
2. **P1**：LxUpload（有标本）、LxSelectPagination、LxDescriptions、el-tabs/el-card/el-tree/el-descriptions 桥接、LxSectionTitle/LxMetricCard
3. **P2**：虚拟滚动双件、双栏穿梭、PasswordInput、AuthImg、Breadcrumb、useTable

**待拍板的两个交互冲突**：

| 冲突               | 选项 A                 | 选项 B                                                 |
| ------------------ | ---------------------- | ------------------------------------------------------ |
| ActionButtons 形态 | 设计稿 P2 铁律：纯文字 | 项目现状：图标 + 预设语义（view/edit/delete 自动配色） |
| 控件密度           | 设计稿：32px 紧凑      | V3 现状：size='large' 40px                             |

---

_调研方法：Grep count 实测 + 关键文件精读（appForm.vue / editPerson.vue / ServerFormDialog.vue / thirdPartyEdit.vue / ProTable / SearchBar / OrgTreeSelect / SelectPagination 等 30+ 文件）。本文件为设计工作底稿，后续按 P0 → P1 → P2 顺序补齐。_

## 2026-10-04 Wave 0 复验记录

`LxDatePicker` 的单值说明更新/移除、相邻单值实例、区间起止输入及相邻区间实例隔离已通过行为回归。该修复只关闭可访问性关联缺陷；输入边界、弹层、范围视觉、窄屏和正式 Impeccable Critique 仍按基础控件批次复核，52 项严格关闭数不变。
