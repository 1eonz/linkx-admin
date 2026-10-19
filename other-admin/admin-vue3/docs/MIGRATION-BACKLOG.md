# Vue2 到 Vue3 迁移 Backlog

## 2026-10-19 LxSectionTitle Demo 契约回归

- 组件 Demo 新增 `leading` 自定义图标并覆盖 `icon` 优先级；单测 **14/14**、文档 E2E **1/1**、格式检查通过。
- 页面迁移仍需逐页核对标题层级、标签/副标题、extra 操作的权限过滤和窄屏布局；组件库证据不等于业务页面完成。
- 本波不删除 `element-plus`，不引入权限键或真实后端假设；页面操作引导继续暂缓。

## 2026-10-19 LxSectionTitle 迁移备注

- [ ] 按配置页真实字段和权限契约接入 `LxSectionTitle`，保留 `headingLevel`、`tag`、`subtitle`、`extra` 插槽及 `.then().catch().finally()` 请求编排。
- [ ] 归因 375px 页面级横溢出并补 HUD/真实内容组合证据；组件库 A/B 证据不能替代业务页面 Mock、空/错/权限不足和真实联调。

> **文档职责（2026-10-17）**：本文只维护逐页迁移缺口、旧契约和业务适配备注；不再复制 lx-ui 全局波次状态。全局计划和下一入口以 `doc/PROJECT-DELIVERY-PLAN.md` 为准。

## 2026-10-19 LxPagination 页面替换前置条件

- 当前组件行为已复验：单测 **5/5**、4177 文档 E2E **3/3**；页面替换需继续覆盖跨页回显、空结果、失败恢复、禁用和局部滚动。
- 历史 `pagination-assessment-b-2026-10-17` 快照未在当前工作区找到，不能把旧摘要作为正式 Impeccable A/B；页面迁移前需补当前版独立视觉证据或明确降级结论。
- 页面请求保持 Promise 链 `.then().catch().finally()`，真实分页协议和权限字段不足时保留阻塞。

## 2026-10-19 LxFormErrorBanner 页面接入前置条件

- 组件行为已复验：单测 **2/2**、4177 文档 E2E **1/1**、typecheck 通过；接入页必须提供有意义的标题和恢复/定位操作。
- 独立视觉 Critique 证据尚不存在，G2 SearchBar/StatusSwitch 证据不得复用；页面替换前需补独立 Mock/E2E、按钮权限和窄屏截图。
- 空 props live region 的 P3 留待真实调用面确认，不能凭空修改 Vue2 业务契约。

## 2026-10-19 LxEmpty 页面替换前置条件

- 组件库已复验 `LxEmpty` 的默认/紧凑尺寸、`image-size`、图标与 footer 插槽，单测 **5/5**、4177 文档 E2E **1/1**。
- 业务页替换前逐页确认空态原因文案、创建/清除筛选操作、按钮权限、失败恢复和页面级 Mock；组件不应自行请求接口或把失败结果转换为空态。
- 宿主 Vite 入口不能代替 4177 文档入口；真实后端和权限字段缺失时保留阻塞，不删除 `element-plus`。

## 2026-10-19 LxSectionTitle 窄屏宿主契约

- 宿主接入 `LxSectionTitle` 时，400px 及以下会自动把 `extra` 放到标题下一行；页面仍需为操作插槽提供可访问名称和 44px 触控目标，并保留 `headingLevel`、`tag`、`subtitle` 与具名插槽契约。
- 本次只修复组件库窄屏布局，不代表 Vue3 页面已替换 Element Plus；真实页面组合、按钮权限和后端联调仍按 UI-04 逐页验收。

## 2026-10-19 LxDescriptions 展开状态宿主契约

- lx-ui 长值/长状态现在提供可见展开图标，并在桌面与窄屏分别保持收起省略和展开完整内容；宿主页面接入时应保留 `aria-expanded`、字段和值的可访问名称及键盘点击语义。
- 本次只修复组件库视觉与可访问状态，不代表 Vue3 详情页已替换 Element Plus；页面迁移仍需逐页核对长值、状态点、复制值和抽屉窄屏布局。组件 Assessment B 已完成 4 个 Light/HUD、桌面/窄屏场景，页面错误、失败请求和横向溢出均为 0，但不替代业务页面 Mock/E2E 或真实联调。
- 真实权限码、详情接口和后端联调没有新增假设，继续按可信契约门槛推进。

## 2026-10-18 LxUpload 组件行为回归交接

- `LxUpload` fallback UID、跨实例隔离、受控模型回灌后的公开 `abort()`、UID 映射、单请求取消和迟到回调隔离已验证：单测 **38/38**，文档 E2E **9/9**。
- Vue3 页面接入时仍需由宿主注入真实上传 API、鉴权请求头和取消协议，并保留旧文件列表、进度、失败重试、取消、移除及校验语义；本次 Mock/文档验证不计为页面迁移完成。
- 真实上传契约不足前不修改业务接口、不删除 `element-plus`，也不将该行为回归写成 UI-10 严格矩阵关闭。

## 2026-10-18 LxTag UI-10 关闭后的宿主迁移契约

- lx-ui `LxTag` 已按 UI-10 严格矩阵关闭，宿主迁移仍需保留旧标签的语义色、`closable`/`close` 事件、disabled 只读行为、large 尺寸和长文本省略边界。
- 当前记录只更新组件门禁，不表示 Vue3 页面已替换 Element Plus 标签；实际页面迁移需逐页核对 `type`/`effect`/`size`、关闭按钮权限和列表窄屏布局，并补 Mock/E2E。
- 真实权限码、保存接口和后端联调继续等待可信契约，不在组件库层臆造。

## 2026-10-18 全菜单 Mock 首屏预览复验

- 隔离 `mock-preview` 预览套件已 **6/6** 通过：首页、32 个动态子菜单、33 项全部菜单目录、菜单搜索、页面首屏样例数据、北向筛选增改删、AuthImg 失败恢复和 320/390px 窄屏均有可执行证据。
- 本条不关闭真实权限或业务迁移缺口；深层页面组合、按钮权限码、文本/字段权限、角色成员契约和真实后端联调仍需可信契约后验收。Vue3 `element-plus` 继续保留。

## 2026-10-18 LxForm 通栏文本域宿主接入备注

- `LxFormItem span="full"` 接入业务页面时可直接使用 `LxTextarea`，组件根节点已占满表单项内容轨道；保留原有 `modelValue`、校验、计数和 ARIA 契约。
- 本波只修复组件库布局，不改变 Vue3 页面替换范围；Element Plus 直接依赖继续保留，待组件库门禁和页面组合回归后再分批迁移。

## 2026-10-18 LxInput 复合输入视觉回归

- 2026-10-18 再次收敛高度轨道：宿主接入时保留 `prepend`、`append`、`prefix`、`suffix` 插槽；当前 lx-ui 已对根节点、内框、外侧块和内部槽位统一完整高度，迁移回归需继续验证这些插槽在主题和窄屏状态下不被业务样式覆盖。

- lx-ui 的 `LxInput` 已修复复合前后缀状态的统一外框和焦点环，宿主迁移接入时需保留 `prepend`、`append`、`prefix`、`suffix` 插槽及原有事件契约。
- 组件 E2E **1/1**、单测 **13/13**；本次不改变业务页面替换范围。Vue3 业务中的 Element Plus 依赖继续保留，待 lx-ui 全库门禁和受影响页面回归完成后再按批次替换。

## 2026-10-18 DynamicForm/Form 文档门禁当前版复验

- 本轮使用隔离 lx-ui 文档配置复验 `LxDynamicForm` **14/14** 与 `LxForm` **6/6**，合计 **20/20**；未改变组件 Props、事件、插槽、校验或宿主 API 契约。
- 覆盖窄屏、键盘、主题、错误/禁用、上传失败恢复和远程竞态；组件真实业务页面、API/权限、真实上传协议和 Element Plus 替换仍按原迁移缺口执行。
- 既有 Assessment B 与 detector 证据已归档；静态 `[]` 不代表业务迁移或正式全库 Critique 完成。

## 2026-10-17 G2 组件门禁完成，宿主契约保留

- `LxSearchBar` 与 `LxStatusSwitch` 的库级行为、Demo、浏览器和 Impeccable 证据已收口；UI-10 当前为 **11/52**。这不等于 Vue3 页面已替换 Element Plus。
- SearchBar 宿主迁移必须保留 `fields`/`filters`、组织树与日期参数映射、`selectedCount` 禁用和 `action` key；StatusSwitch 必须保留布尔/`0/1` 值映射、关闭确认、失败恢复、只读和权限降级。
- 真实保存接口、按钮权限码和后端身份契约未在本波臆造；缺少可信来源的项继续按 UI-04/P1-07 阻塞，Vue3 `element-plus` 暂不删除。

## 2026-10-17 LxPageCard 组件审查复核

## 2026-10-17 G2 SearchBar 修后宿主契约

- lx-ui SearchBar 标准态第四字段操作组已固定桌面同排、窄屏独占行；Vue3 适配器迁移时保留四字段 `fields`、`filters` 插槽、`selectedCount` 禁用和 `action` key 事件。
- 库级布局证据不代表业务页已替换；组织树数据源、日期格式化和 `getSearchParams` 仍按页面 API 注入，宿主真实权限与后端联调继续后置。

- lx-ui `LxPageCard` 已通过单测 **3/3**、文档 E2E **1/1** 和正式 A/B 证据；报告见 `.impeccable/critique/pagecard-assessment-b-2026-10-17/assessment-report.md`。
- 页面迁移时保留标题 region、loading 覆盖、`aria-busy`、`header-extra`/`footer` 插槽和 body padding 语义。

## 2026-10-17 LxFormErrorBanner 审查复核

- lx-ui 组件行为已通过单测 **2/2**、文档 E2E **1/1** 和 A/B 阶段证据；报告见 `.impeccable/critique/formerrorbanner-assessment-b-2026-10-17/assessment-report.md`。
- Vue3 页面迁移时继续区分表单整体阻断与字段错误；移动 overlay 横溢出已由无覆盖层基线排除组件缺陷，宿主替换仍按全库顺序执行。

## 2026-10-17 LxPagination 组件审查复核

- lx-ui `LxPagination` 已通过单测 **5/5**、文档 E2E **3/3** 和正式 A/B 证据；报告见 `.impeccable/critique/pagination-assessment-b-2026-10-17/assessment-report.md`。
- 迁移页面时保留分页请求由宿主发起、`change(page, pageSize)` 参数顺序和列表容器滚动处理，不能把自动回顶误用于容器滚动。

## 2026-10-17 LxDrawer 组件审查复核

- lx-ui `LxDrawer` 已通过单测 **4/4**、文档 E2E **1/1** 和正式 A/B 证据；报告见 `.impeccable/critique/drawer-assessment-b-2026-10-17/assessment-report.md`。
- 迁移详情页时保留数字 `size` 的视口约束、footer 插槽、Escape 配置及未保存数据处理；P2 视觉观察不阻塞本波。

## 2026-10-17 LxDialog 组件审查复核

- lx-ui `LxDialog` 已有单测 **4/4**、文档 E2E **3/3**、类型检查和正式 Impeccable A/B 证据；报告见 `.impeccable/critique/dialog-assessment-b-2026-10-17/assessment-report.md`。
- Vue3 宿主逐页迁移时需保留旧页面的提交 loading、关闭/取消/Escape 语义、脏表单处理、字段错误和 footer 插槽契约；组件审查发现的 P1/P2 尚未在宿主层统一解决。

## 2026-10-17 LxEmpty 组件门禁复核

- lx-ui `LxEmpty` 已通过单测 **5/5**、文档 Playwright **1/1**、类型检查和 Assessment A/B；证据见 `.impeccable/critique/empty-assessment-b-2026-10-17/`。
- Vue3 当前仍有 15 处 `el-empty`。逐页迁移时保留 `description`、`image-size`/`imageSize`、`class`、footer 插槽以及页面自己的空/错/加载条件；库级门禁不代表宿主替换完成。

## 2026-10-17 LxDynamicForm 组件级复验

- lx-ui 当前版单测 **30/30**、文档 E2E **12/12**，Assessment B 证据已保存；此前 E2E 失败由 `favicon.svg` 白名单遗漏造成，已修正。
- `LxDynamicForm` 已使用独立字段 renderer 和 `Lx*` 基础控件，支持受控 `value + change`、上传/远程状态及容器自适应列；Vue3 真实业务页面尚未替换，真实 API/权限/上传联调仍为迁移缺口。

## 2026-10-17 LxStatusSwitch 组件级复验

- lx-ui 当前版单测 **18/18**、文档 E2E **4/4**、类型检查通过，Assessment B 证据已保存；组件本体无新增 P0-P2。
- Vue3 `src/components/StatusSwitch` 仍未替换，后续 UI-04 需核对 `0/1` 值映射、确认/失败恢复、权限降级和宿主 Promise 链，不能因库级复验完成而删除 `element-plus`。

## 2026-10-16 UI-04 前置组件：LxSectionTitle 当前版交接

- `SectionTitle` 适配器已透传 `subtitle` 属性/插槽，并转发优先级最高的 `leading` 插槽；映射与未映射图标回退保持兼容。定向单测 **18/18**、文档 E2E **1/1**，类型、ESLint、Prettier 通过。
- Assessment B 证据 `.impeccable/critique/sectiontitle-assessment-b-2026-10-16/` 覆盖 Light/HUD、桌面/375/320、RTL、减少动效；8/8 无页面错误、失败请求和横向溢出。静态 detector 三件套为合法 `[]`、空 stderr、退出码 `0`，未发现组件 P0–P2。
- 真实配置页组合、extra loading/失败恢复、权限和后端联调仍待 UI-04；不删除 Element Plus。历史单 variant 规范冲突已登记，当前按三变体实现维护。

## 2026-10-16 G2 LxSearchBar 当前修复

- 适配器已恢复批量 action 的 `key`/`selectedCount` 禁用并隐藏库默认状态行；库标准态第四字段内含操作组，符合设计四列布局。库单测 **9/9**、适配器单测 **2/2**（合计定向测试 **11/11**）、文档 E2E **4/4**。
- Vue2 `SearchBar` 的组织树、日期格式、`getSearchParams`、`org-change` 和实例方法依赖业务接口，不能由通用 lx-ui 适配器臆造；逐页迁移时使用 `fields`、`filters` 和业务 composable 完成参数映射。

## 2026-10-16 UI-04 前置组件：LxMetricCard 趋势语义交接

- lx-ui `LxMetricCard` 增加 `trendDirection`（`up`/`down`/`flat`），未传入时兼容旧 `trendStatus` 推断；Badge 状态点设为 `aria-hidden`。定向单测 **15/15**、文档 E2E **3/3**，类型检查、构建和目标格式检查通过；独立 E2E 复跑受登录鉴权和代理超时阻断，记录为环境失败。
- Assessment B 证据见 `.impeccable/critique/metriccard-assessment-b-2026-10-16-recheck/`，三个目标 detector JSON 为合法 `[]`、stderr 为空、退出码为 `0`，同时已保存 Light/HUD 桌面与移动浏览器证据；五视图无页面错误或失败请求，浏览器命中归因于文档壳层，`[]` 不单独代表视觉通过。A/B 未发现组件 P0–P2。
- Assessment A 已修复趋势方向错误和 Badge 重复读屏两项问题；只读 hover 暗示与标题 heading 语义暂列低优先级跟踪。宿主 6 处 MetricCard、真实后端和人工读屏仍待 UI-04/联调波次。
- 本波不改变 UI-10 计数、不删除 Vue3 `element-plus`，下一入口为 `LxSectionTitle`，随后继续 G2 和 `LxDynamicForm` 前置门槛。

## 2026-10-16 Wave 25：LxAuthImg 组件修复完成，宿主迁移保持冻结

- lx-ui `LxAuthImg` 已完成当前竞态修复和回归：**17/17** 单测、文档 E2E **5/5**，覆盖鉴权 Blob、取消、失败回退、空地址复用、旧图片事件和显式小尺寸；请求失败并显示 fallback 时的 `error-actions` 重试契约已补测。B 路当前证据已归档于 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`；这不代表 Vue3 旧 `AuthImg` 宿主适配器已替换。
- `other-admin/admin-vue3` 的鉴权图片适配仍需保留旧 props/事件、请求取消、Blob URL 回收和真实网关鉴权头，待可信后端契约与全库 UI-10/UI-11 门禁后单独实施并补 Mock/浏览器回归。宿主 `element-plus` 继续保留。下一入口为 `LxMetricCard` 与 `LxSectionTitle`，随后进入 G2 `LxSearchBar` 与 `LxStatusSwitch`。

## 2026-10-15 全菜单 Mock 预览 E2E 复验

- 将环境变量 `MOCK_PREVIEW_PORT` 设为 `31853` 后运行 `pnpm exec playwright test --config=playwright.preview.config.ts` 隔离重跑，共 **10/10 通过**；覆盖菜单与首屏样例、ColForm 请求竞态、北向 Mock CRUD、轮播分页、AuthImg 错误恢复和减少动效。
- 此结果仅验证本地 Mock 预览与交互，不代表真实后端联调；未占用 `30847` 用户预览端口。随后进入的 `LxActionButtons` UI-10 严格复核已于 Wave 24 关闭；当前组件矩阵下一项为 `LxAuthImg`。页面操作引导暂缓，不实施、不拆分、不排期。

## 2026-10-14 Wave 21：LxTextarea 严格矩阵收口与 E2E 复验

- lx-ui `LxTextarea` 当前 UI-10 严格矩阵行已关闭，全库更新为 **6/52**。组件沿用已完成的设计、主题/状态、行为与 Impeccable 证据；Textarea 单测 14/14，共享文档 E2E 11/11，隔离端口 4179 完整重跑通过。独立代码复审批准 Select E2E 状态定位修改；单独复核尝试曾被旧服务/代理超时阻断，隔离重跑后目标用例和全文件均通过。
- 设计源 `p-2.5` 对应 10px 内边距，组件使用 8px 垂直/12px 水平令牌；基准高度约 74px、实测 76px。此差异已登记在 `doc/lx-ui/COMPONENT-AUDIT.md`，当前评审未列为组件级 P0–P3，不宣称像素完全一致。
- `LxTextarea` 的关闭不代表 Vue3 宿主替换、真实后端或人工读屏完成。`LxInputNumber` 桌面目标尺寸 P2 继续等待设计决策；下一项处理未阻塞的 `LxInput`，之后继续动态图标、`LxDynamicForm` 与其余组件门禁。页面操作引导继续暂缓，不进入待办或排期。

## 2026-10-14 Wave 20：LxSelect 组件门禁与全菜单 Mock 预览

- lx-ui `LxSelect` 已完成 UI-10 当前严格矩阵行，定向单测 15/15、文档 E2E 8/8；Vue3 全量 Vitest 565/565。Impeccable A 36/40、B 四个 detector 与六个浏览器上下文均完成，独立代码复审无未关闭 P0–P2；UI-10 更新为 5/52。此状态不代表 Vue3 业务页已替换 `ElSelect`，也不减少 Vue3 宿主的 `element-plus` 使用量。
- Mock 预览回归 10/10，其中首个用例核对首页及 32 个现役子菜单入口和每页首屏样例数据；其余覆盖 ColForm 远程搜索竞态、北向 CRUD、轮播分页及 AuthImg 错误恢复。修正南向接口预览频率样例值，避免页面显示 `NaN分钟`。本轮使用隔离端口 `31849`，未复用现有预览服务；写操作仍由本地 Mock 接管。
- **后续宿主迁移要求**：等 lx-ui 全库 UI-10 与 UI-11 门禁通过后，才按页面迁移矩阵替换 Vue3 `ElSelect`；届时逐页核对 `modelValue` 类型、默认插槽/配置式选项、错误焦点、清空/多选和远程状态契约，并补宿主 Mock/E2E。真实后端、权限身份和人工读屏不由本次库级或 Mock 验收代替。页面操作引导暂缓，仅在用户后续明确提出需要时再恢复评估。

## 2026-10-13 当前交接：LxInputNumber 桌面目标尺寸 P2 复核完成但未关闭

- Impeccable Assessment A **29/40（Good）**；Assessment B 的四个静态 detector 均为合法 JSON `[]`/空 stderr/退出码 `0`，Light/HUD × 桌面/375px 浏览器视图成功注入且无横向溢出或页面错误。
- 桌面步进目标高 13/15/19px，低于 24px，等待设计决策；既有 28/32/40px 外框与竖向均分布局不能同时满足双按钮 24px 高，未获设计确认前不改横排。触屏目标为 44×44px。
- `LxInputNumber` 严格矩阵行保持开放，不增加 UI-10 全库关闭数；本轮无产品源码变更。A/B 原始证据在 `.impeccable/critique/lxinputnumber-wave19-current-2026-10-13/`。`LxTextarea` 已完成当前版组件级复核；下一项核验尚未关闭严格矩阵行的 `LxSelect`。

## 2026-10-13 UI-10 / Wave 19 Checkbox 与 Radio 四项严格矩阵登记

- `LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 按 `design/表单控件八件套/` 完成矩阵所需的设计源映射、状态适用性、Demo/API、行为和浏览器证据登记；当前 UI-10 为 **4/52**。
- 定向单测 23/23、文档 E2E 16/16；正式 Impeccable A 36/40，B 的 8 个静态目标均为合法 `[]`/空 stderr/退出码 0，8 个主题/视口浏览器视图注入成功；独立代码复审关闭空错误断言 P2。完整报告、代码复审与 snapshot/trend 见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/` 和 `.impeccable/critique/2026-10-13T09-44-41Z__linkx-fe-src-components-lxcheckbox-index-vue.md`。
- 无开放组件级 P0–P2；共享文档导航密度、未来可编辑表格键盘边界为非阻塞 P3。此矩阵登记不代表 Vue3 业务组件替换或真实后端联调完成。
- `LxInputNumber` 桌面步进目标高度 P2 已复核但尚未关闭；`LxTextarea` 已完成当前版组件级复核，下一步核验尚未关闭严格矩阵行的 `LxSelect`，再继续基础控件、动态图标、`LxDynamicForm`、其余 lx-ui 组件及正式整库门禁。页面操作引导当前不执行、不纳入待办、执行队列或排期。

## 2026-10-13 lx-ui Wave 18 / Checkbox 与 Radio 当前版复核及文档窄屏 P2 收口

- Checkbox/Radio 文档将 `disabled` API 长说明移入折叠详情；375px 下 7 张明显溢出表格有提示、键盘滚动、首列固定和 ARIA，3 张短溢出表不进入 Tab 顺序。Checkbox/Radio Demo 已加入 LxForm 必填失败、修正恢复和重置场景，并按业务语义拆分知情确认、通知渠道及历史只读快照。
- 定向单测 **23/23**、当前文档 E2E **16/16**；lx-ui 类型检查、206 modules 构建、VitePress 文档构建、Vue3 类型检查、目标 Prettier、E2E 文件 ESLint 和差异检查通过。Vue3 ESLint 忽略 `linkx-fe` 源文件，不计作组件库 ESLint 通过。
- Assessment A 最终全量评分 36/40（Excellent），两个示例分组 P3 已在 Light/HUD 桌面与 375px 视口复验关闭；B 的 8 个静态目标均为有效 `[]`/空 stderr/退出码 0，8 个视图无页面错误或失败请求。Radio HUD 主色命中属于设计令牌误报；移动根宽增加只发生在 overlay 注入后。独立代码复审关闭了空错误断言空数组导致的 P2 测试缺口，无开放 P0–P2。桌面文档导航密度及未来可编辑表格键盘处理为共享文档外壳的非阻塞 P3，单独跟踪。
- 旧版 8/8 和六视图结果只作为窄屏文档 P2 的历史初验，当前证据见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`。本波不关闭 UI-10 全库 0/52 或四个组件严格矩阵，也不改变 Element Plus 替换矩阵、Vue3 宿主依赖或真实后端联调范围。页面操作引导当前不执行、不纳入待办、执行队列或排期；后续明确有需要时再重新纳入计划。

## 2026-10-14 范围备注：页面操作引导暂缓，后续按需恢复

- 页面操作引导现阶段暂不考虑实施，不纳入待办、执行队列或排期，也不作为 lx-ui 收口及 Element Plus 替换的前置条件。
- `doc/GUIDE-CONTENT-PLAN.md` 与 `doc/lx-ui/MENU-CONFIG-DESIGN.md` 仅保留需求与设计基线；后续确有需要时，再确认页面范围、文案、交互、技术方案及后端契约，届时恢复计划并执行。
- 此范围备注不代表页面操作引导已经实现或验收，也不改变当前 lx-ui 和 Vue3 组件迁移顺序。

## 2026-10-13 lx-ui Wave 17 / LxSelect 当前版组件复核完成

- `LxSelect` 当前组件、Demo、中文 API、Light/HUD、禁用对比度、键盘、远程空/错/重试与窄屏状态按设计源完成复核；桌面 32px、窄屏触发器和选项行 44px。
- 单测 11/11、文档 E2E 3/3；定向 ESLint/Prettier/diff check 通过，类型检查、206 modules 构建、VitePress 和 Vue3 生产构建在实现阶段通过。独立代码复审无 P0–P3。
- Impeccable A 33/40（Good）；B 两个源码 detector 均为 `[]`/空 stderr/退出码 0，五种主题/视口浏览器状态注入成功且无错误。overlay 命中以文档段落/表格、复制按钮、页面外壳和令牌为主；组件命中已对照设计源及浏览器实测核对。完整证据和综合 snapshot/trend 见 `.impeccable/critique/lxselect-wave-2026-10-13/`。
- 本波仅关闭 LxSelect 当前版组件复核，不增加 UI-10 全库 0/52 计数，也未修改 Vue3 页面依赖或开展真实后端联调。下一项先处理 Checkbox/Radio 文档 375px API 表格可读性 P2，再继续基础组件、动态图标、`LxDynamicForm` 和全库门禁。页面操作引导保持暂缓、不纳入当前排期。

## 2026-10-13 lx-ui Wave 16 / LxTextarea 当前版组件复核完成

- `LxTextarea` 当前组件、Demo、中文 API 和主题/状态按设计源复核完成；初始到限/超限保持播报静默，正常转到限/超限只播报一次。disabled/readonly 校验态隐藏计数但保留错误说明。
- 单测 14/14、共享基础控件文档 E2E 11/11；lx-ui typecheck、206 modules build、VitePress build、Vue3 `build:prod`、定向 ESLint/Prettier、组件 CSS/HUD token Stylelint 与 diff check 通过。`custom.css` 既有 14 个属性顺序错误均在本次未改动行。
- Impeccable A 31/40（Good），无 P0–P3；B detector `[]`/空 stderr/退出码 0，六个 Light/站点深色/HUD × 桌面/移动视图已完成。overlay 注入后移动根文档宽 630px，基线 390px 无溢出，E2E 无 overlay 的 320/375px 通过；归为检测覆盖层/页面外壳副作用。代码复审无 P0–P3，证据见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`。
- 本波仅关闭 LxTextarea 组件级审查，不代表 Vue3 Textarea 宿主已替换，也不增加 UI-10 全库 0/52 计数。本条交接时的下一项 `LxSelect` 已于 Wave 17 收口；接着处理 Checkbox/Radio 文档 375px API 表格 P2，再继续其余基础控件与动态图标、`LxDynamicForm` 和 lx-ui 门禁，最后开展 Vue3 Element Plus 分批替换。页面操作引导不纳入当前排期。

## 2026-10-12 lx-ui Wave 15 / LxInputNumber 当前版组件级复核完成

- `LxInputNumber` 的组件、Demo、中文 API、边界语义、键盘/长按交互与设计尺寸已复核；sm/md/lg 外框 28/32/40px，按钮贴合无间距，`controls` 参数生效。Vue3 业务页面本波未进行批量替换。
- 单测 18/18、文档 E2E 2/2、lx-ui 类型检查、206 modules 构建、VitePress、Vue3 类型检查及生产构建、目标 Lint/格式检查通过。最终生产构建包含既有 Element Plus 大 chunk、Less 变量导出和循环 chunk 警告。
- Impeccable A 31/40；B detector 为合法 `[]`/空 stderr/exit 0，Light/HUD × 1440/390px 四视图证据齐备；代码复审无新的 P0–P3。A/B 报告与截图见 `.impeccable/critique/lxinput-wave-2026-10-12/final-stepper-event-fix/`；综合 snapshot 为 `.impeccable/critique/2026-10-12T14-02-10Z__127-0-0-1-components-lxinputnumber.md`，趋势首条 31/40。
- 桌面按钮目标高度约 13/15/19px 按严格设计尺寸保留为待设计决策观察；窄屏 44×44px，键盘替代路径通过。Demo 错误态与重复尾注保留为 P3。
- 桌面按钮高度 P2 尚待设计决策，`LxInputNumber` 严格矩阵行保持开放，不增加 UI-10 全库关闭数；该项不阻止下一批独立复核 `LxTextarea`，之后继续基础控件、动态图标和 `LxDynamicForm`。lx-ui 与整站 Impeccable 门禁仍先于 Vue3 Element Plus 批量替换。页面操作引导、权限中心和字段权限继续后置。

## 2026-10-12 lx-ui Wave 14 / LxInput 当前版组件级复核完成

- `LxInput` 组件库当前版已按设计稿完成组件、Demo、中文 API、键盘清空、必填、禁用/只读、触屏目标和窄屏复核；Vue3 业务页面本波未做批量替换。
- 单测 13/13（含父级 `LxForm disabled`、显式禁用和只读清空），LxInput 文档 E2E 3/3、邻接 InputNumber E2E 1/1；共享基础控件 E2E 全量 6/8 的两项既有标签断言失配见交接记录。lx-ui 类型检查、205 个模块构建、VitePress 文档构建、Vue3 类型检查、相关 ESLint/Prettier 和差异检查通过。Stylelint 因缺少 `postcss-less` 无法启动。
- 最终 Assessment A 为 34/40（Good），未发现 P0–P2；组件与 Demo detector 均为合法 JSON `[]`、stderr 空、退出码 0，Light/HUD × 1440/390px 四视图 overlay 注入成功。综合报告、snapshot/trend、overlay 归因及生命周期证据见 `.impeccable/critique/lxinput-wave-2026-10-12/`。
- codeview 提出的 `change` 事件说明、显式禁用/只读回归和 `clearable` 类型注释问题已修正；最终复审无 P0–P2。联系电话计数断言和窄屏工具栏键盘焦点断言两项 P3 建议保留为后续覆盖增强。
- 下一批按 lx-ui 矩阵进入 `LxInputNumber`；组件库剩余基础控件、动态图标、`LxDynamicForm` 和整站 Impeccable 门禁仍先于 Vue3 Element Plus 批量替换。页面操作引导、权限中心和字段权限继续后置。

## 2026-10-12 lx-ui Wave 13 / LxButton 组件库交接完成

- 组件库 `LxButton` 当前版已完成设计对照实现、中文 Demo/API、纯图标提示并发协调、明暗主题、减少动效、窄屏标签和摘要 44px 触达高度回归；Tooltip 保留 200ms 延迟且不使用 Element Plus 默认淡入淡出；Vue3 业务页面本波未替换按钮。
- 单测 **33/33**、组件文档 E2E **19/19**；lx-ui 类型检查、205 modules 库构建、VitePress 构建、目标 ESLint/Prettier、`git diff --check` 通过。E2E 经 `playwright.lxui.config.ts` 运行并复用共用 Mock，未向真实后端发送请求。`md` 字号为 14px；Tooltip 触摸聚焦不显示，键盘聚焦正常显示。
- 最终复审提出的 Ctrl+点击原页状态与主题迁移 Tooltip 可见/定位两项 E2E 缺口已关闭；修后全量文档 Playwright 19/19，通过真实 Ctrl+点击断言原页 hash、滚动位置和焦点保持。
- 旧 SHA-256 指纹下的评估证据已作废；当前冻结版 A **32/40（Good）**、B 三 detector 合法 `[]`/空 stderr/退出码 0 且 8 个 Light/HUD 视图注入成功，代码复审无未关闭发现。桌面标签 P2 与测试可见性 P3 已关闭；窄屏工具栏高度和整段 region 焦点框两项 P3 决定后置。完整报告、overlay 归因、snapshot/trend 与原始证据见 `.impeccable/critique/lxbutton-wave-2026-10-12/final-after-label-fix/`。
- 本组件库波次不关闭 Vue3 Element Plus 依赖迁移、UI-10 全库 52 项矩阵、业务按钮权限或真实后端联调。下一波 `LxInput` 已于 Wave 14 完成，之后继续 `LxInputNumber` 等基础控件和动态图标；基础控件与动态图标门槛完成后再进入 `LxDynamicForm`，最后进行 Vue3 Element Plus 分批替换。

## 2026-10-11 lx-ui Wave 11 / LxDescriptions 当前版正式复核完成

- `LxDescriptions` 组件库当前版已完成长值、长状态、复制、错误恢复、窄屏表格和 reduced-motion 的 A/B 与浏览器证据；宿主业务页面未在本波改动。
- 单测 9/9、文档 E2E 3/3、lx-ui 类型/库构建、VitePress 构建、目标格式检查通过；综合 Critique 按当前 0-4 口径为 31/40，B 为 42/42 浏览器样本，三份当前 detector `[]`/空 stderr/exit 0。详细证据见 `.impeccable/critique/descriptions-wave-2026-10-11/`。
- `LxDescriptions` 通过不等于 Vue3 详情页替换完成。宿主仍需逐页核对旧 props/slots、真实权限状态、请求 loading/error、抽屉窄屏布局和 `.then().catch().finally()` 错误处理。
- 下一步继续按 `ELEMENT-PLUS-LX-UI-MATRIX.md` 和组件审计矩阵处理基础控件；在 lx-ui 组件与整库审查门槛完成前保留 Vue3 `element-plus`，权限中心、字段权限和引导页按既定计划后置。

## 2026-10-11 lx-ui Wave 12 / MetricCard 与 SectionTitle 组件库收口

- `LxMetricCard` 与 `LxSectionTitle` 已完成当前版组件库审查；适配器透传标题层级并由根入口导出 `LxSectionTitleHeadingLevel`。本波未修改业务 API、路由、权限键或 Element Plus 依赖。
- 单测 32/32、文档 E2E 4/4，类型、构建、文档、目标格式/Lint 通过；A 37/40，B 三 detector 合法 `[]`/空 stderr/exit 0，10 个浏览器视图 overlay 完成，代码复审无 P0–P2。
- `ClientDetailDrawer.vue` 的 6 处 MetricCard 与配置页 SectionTitle 仍需逐页核对旧 props/slots、真实权限状态、请求 loading/error、抽屉窄屏布局；库级证据不能替代宿主迁移。
- 下一步先完成 `LxDescriptions` 正式 A/B 和后续 P2，再按矩阵替换宿主控件；Vue3 `element-plus` 继续保留，权限中心、字段权限和引导页后置。

## 2026-10-11 lx-ui Wave 11 / LxVirtualTree 插槽布局与 TransferPanel 联回归完成

- lx-ui 已公开 `LxVirtualTree` 的 `rowLayout`、`nodeSummary` 和插槽 scope 类型；`LxTransferPanel` 已采用公开行布局，窄屏长名称支持键盘全文展开。该波没有修改 Vue3 业务页面、API、路由、权限键或 `element-plus` 依赖。
- VirtualTree + TransferPanel 定向单测 **67/67**，VirtualTree 文档 E2E **14/14**，TransferPanel 文档 E2E **33/33**；类型、库/文档/生产构建、目标格式和差异检查通过。Impeccable A **31/40**；B 四个 detector 均为有效 `[]`/空 stderr/exit 0，六个视图 overlay/DOM/键盘证据完成；代码复审批准。详细证据见 `.impeccable/critique/lxvirtualtree-wave11-2026-10-11/`。
- 固定行虚拟化下，业务 slot 只能放展示型单行元信息，完整摘要由 `nodeSummary` 提供；窄屏已选首屏、批量动作层级和 Demo 控制密度列后续组件库任务。下一步继续按 UI-10 门禁推进剩余 lx-ui 组件和整库审查，之后才进入 `DataPermissionTree`/Element Plus 替换。

## 2026-10-11 lx-ui Wave 11 / LxDescriptions Demo 控件密度阶段性收口

- `LxDescriptions` Demo 已补可见布局组名，数据状态改用 `LxSelect`；文档 E2E 3/3 覆盖状态切换、边框生效、375/320px 无溢出、HUD、减少动效和键盘路径。组件单测 6/6，类型、格式、代码复审和差异检查通过。
- 修后复审关闭了选择器键盘回归 P2 和 Element Plus 内部类名交互定位 P3。A 31/40；B 的三个 detector 均为有效 `[]`/空 stderr/exit 0，但 Edge 启动失败导致 overlay 缺失，正式 Critique 保持未关闭。
- 不代表 Vue3 业务详情页已经替换、权限菜单已联调或 Element Plus 可删除；下一项先复验当前 `LxVirtualTree` 并联跑 TransferPanel。

## 2026-10-11 lx-ui Wave 10 / TransferPanel 组件库复验完成

- lx-ui 的 `LxVirtualTree`/`LxTransferPanel` 复选框视觉盒已定为 14×14px，树节点桌面/窄屏点击区保留 24×24px / 44×44px；页脚继承开关继续由 `LxCheckbox` label 提供点击区。
- 文档 Demo 桌面节点元数据拥挤已修，状态/主题折叠摘要已补；320px P2 经证据确认是误报。改后 TransferPanel 文档 E2E 33/33，类型、库构建、文档构建和格式/Lint 通过。
- 最终 A 为 35/40，B 三 detector 均为有效 `[]`/空 stderr/exit 0，浏览器 overlay 证据完成，独立代码复审无 P0–P3；综合报告及 snapshot/trend 见 `.impeccable/critique/transferpanel-final-2026-10-11/`。本轮未修改 Vue3 宿主 API、路由或业务页面，不表示 `DataPermissionTree` 替换或真实权限联调完成；下一项先处理 `LxDescriptions` Demo 控件密度，再复验 `LxVirtualTree` 当前版。

## 2026-10-09 lx-ui Wave 7 / LxTransferPanel 交接

- 根据用户反馈，文档 Demo 预览最大宽度设为 `820px` 并居中，窄屏铺满正文可用宽度；保留组件默认 `panelHeight=380px` 与 Demo 默认紧凑 240px，且高度选择器常显。移动候选数量标签改为“待选”，文档在示例旁说明本地选择不是已保存权限。
- 最终组件/Demo 与单测 **64/64**、TransferPanel 文档 E2E **30/30**；E2E 校验 1440px 居中和 390px 正文可用宽度、无横向溢出。lx-ui/Vue3 类型检查、目标 Prettier、203 模块 lx-ui 构建、Vue3 生产构建通过；VitePress 文档构建及最终 Impeccable A/B 正在收口。Luna 代码复审无 P0-P2，已修正旧完成记录的 29/29 和哈希；正式 snapshot/trend 生成后再转 G2。
- UI-04 仍需按真实 `DataPermissionTree` props、exposes、父子勾选、跨页/树外已选值回显、change 回传和权限错误契约完成适配、Mock/E2E；真实权限/后端联调必须依据真实契约。保留 Vue3 宿主 `element-plus`。
- A 遗留三项 P2：Demo 240px 首屏密度、移动“可加入”计数命名、宿主保存状态示例；列入后续 Demo/权限宿主任务，不关闭 UI-10。下一组件库波次为 G2：SearchBar 已有 8 项宿主单测但缺少组件 Demo Playwright；StatusSwitch 已有 8 项单测与 3 项文档 E2E。按白名单提交推送后进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-07 Wave 5 选择器组件交接

- `LxTreeSelect`、`LxCascader`、`LxSelectPagination` 当前版本行为闭环完成：定向单测 36/36、文档 E2E 15/15；覆盖键盘/清空、错误焦点与英文错误、窄屏触控、表单 disabled、取消与迟到请求、续页失败重试及禁用不请求。
- 独立代码复审无 P0–P2；Impeccable A 32/40，B 9 个目标 detector 均为有效 `[]`/空 stderr/exit 0，9 个浏览器场景成功。四项 P2 和长节点 E2E P3 已写入项目台账；`[]` 不等于视觉通过。
- 本波没有迁移 Vue3 业务页、权限菜单或 Element Plus 依赖；继续保留 `.then().catch().finally()` API 链和现有宿主契约。全库 lx-ui 门禁前不得删除宿主 `element-plus`。
- 下一入口：Upload fallback UID/公开 abort 组合回归已完成；继续完成 Descriptions、VirtualTree、TransferPanel、MetricCard、SectionTitle、StatusSwitch、SearchBar 的组件库证据，再进入宿主替换矩阵。

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
| 预警推送                  | `/notification/alertPush`                            | 任务逾期/无人值守列表、筛选与重置参数、批量删除失败后重试及无人值守新增群组流程已由 Mock E2E 验收；所有 API 请求由 Playwright 拦截                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 其他新增/编辑组合、用户/群组分页回显、受限账号和真实后端联调仍未完成；不猜测权限码                                                                                                                                                       | `tests/e2e/alert-push-workflow.spec.ts`：2/2                                                                                                                           |
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

`LxTransferPanel` 已对照 `design/虚拟滚动树 + 双栏穿梭/` 补齐 5:2:5、380px `border-box` 面板、左右筛选、筛选范围批量操作、`code/status/statusTone`、树外既有键与未加载回显/确认、空/加载/错误和 44px 移动端触控。TransferPanel 当前 30 项单测、文档 E2E 28/28；VirtualTree 当前 34 项单测、文档 E2E 13/13，合计单测 64/64。桌面树项基准行高为 32px，TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。未知状态字符串按原值显示，原型键映射缺陷已由 `constructor` 回归关闭。Vue3 `DataPermissionTree` 仍是业务实现，UI-04 必须逐项比对 props、实例 exposes、父子勾选、已选项映射和变更回传，再做该宿主的 Mock/E2E。最终统一冻结版 Impeccable A/B、snapshot/trend 仍待归档，UI-10 仍为 0/52。

`LxActionButtons` 已完成 UI-10 严格复核：当前单测 18/18、文档 Playwright 9/9，A 33/40、B 八视图 overlay 与独立代码复审通过。Vue3 的 29 处引用仍使用宿主组件；UI-04 需保留数组配置与预设动作、原图标映射、单项 `onClick`、gap、禁用及权限过滤语义，不能直接机械替换。当前 UI-10 计数为 8/52；下一矩阵项是 `LxAuthImg`。

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

2026-09-30 UI-13 LxForm 首错焦点修复：LxForm 现在保存真实表单根节点并在校验 Promise reject 后聚焦首个错误输入；桌面/375px 浏览器证据和 3/3 文档 E2E 已通过。该修复不代表 Form 正式 Impeccable 关闭；组件库全量 UI-10/UI-11 完成前不进入宿主 Element Plus 依赖移除。

## 2026-10-11 UI-04 前置组件证据：TransferPanel 与 VirtualTree P2 结项

- lx-ui 当前版已完成双栏穿梭/虚拟树的组件级严格审查：单测合计 67/67，文档 E2E 合计 48/48；TransferPanel 与 VirtualTree 的 props、事件、插槽、键盘和窄屏边界继续由库组件负责，业务请求和权限判断仍由宿主注入。
- Assessment A 为 36/40；Assessment B 的 5 个 detector 均保存 JSON `[]`、stderr 空、退出码 0，并完成 9 个浏览器视图的 overlay/截图/DOM/键盘证据；代码复审批准。证据见 `.impeccable/critique/transferpanel-p2-2026-10-11/`，snapshot 为 `.impeccable/critique/2026-10-10T23-03-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。
- `DataPermissionTree` 仍不能机械替换为 `LxVirtualTree`/`LxTransferPanel`：UI-04 必须先对照节点字段、父子勾选、跨页/树外已选键、exposes、change 回传、加载/空/错和真实权限 API，再用 Mock 覆盖成功、空、失败、权限不足、取消、分页和重复提交。
- Vue3 `element-plus` 直接依赖继续保留；全量替换必须等待组件库剩余正式 Critique、宿主页面组合回归和整站 Impeccable。下一批先审查 `LxMetricCard` + `LxSectionTitle`，G2 `LxSearchBar`/`LxStatusSwitch` 随后处理；权限中心、文本/字段权限和引导页继续延后。

2026-10-17：`LxMetricCard` 与 `LxSectionTitle` 组件级证据完成（单测 33/33、文档 E2E 4/4、detector `[]`/空/0、桌面与移动浏览器证据）。独立设计评审代理服务 503，标记降级评估；下一宿主迁移前置为补完整 A 后进入 G2 搜索/状态组件。

2026-10-17：`LxPasswordInput` 组件级交付已收口（单测 11/11、文档 E2E 9/9、Impeccable A 32/40、B `[]`/空/0、桌面与 375px 浏览器证据）。不代表 Vue3 登录页真实联调完成；下一宿主迁移前置为 `LxMetricCard`、`LxSectionTitle` 和 G2 搜索/状态组件审查。

## 2026-10-04 Wave 0 迁移影响

当前仅修复 lx-ui `LxDatePicker` 对实际输入框的说明 ID 关联，没有改动 Vue3 业务 API、路由、权限或后端协议。当前工作区 DynamicForm 日期字段回归与 DatePicker 合计 36/36；本波提交不包含既存 DynamicForm 实现改动。Wave 1 先完成基础控件审查，宿主 Element Plus 替换顺序不变。
# LxInput 宿主迁移补充

# LxMetricCard 宿主迁移补充

- lx-ui 已提供 320px 以下窄卡分层和 loading/empty/error 宿主状态示例；宿主页面接入时继续由页面负责 API、权限和失败恢复，不能把组件 Demo 当作真实业务联调。
- `status`、`badgeStatus`、`trendStatus` 需按业务字段分别映射；缺少后端契约时保持阻塞，不新增按钮权限码或状态字段。

- `prefix/suffix` 槽位已在完整输入外框内居中，宿主页面复用 lx-ui 时不需要额外覆盖 Element Plus 高度样式；复合 `prepend/append` 仍按完整控件高度布局。
- 组件 E2E **1/1**、LxInput 单测 **13/13**、库 typecheck/build 通过；宿主页面组合、真实后端联调和权限契约没有因本次样式修复提前关闭。

# SectionTitle 宿主迁移补充

- 组件库已支持 viewport 回退与宿主 `@container` 窄屏拆行，标签包含中文辅助名称；Vue3 配置页真实组合回归仍属于 UI-04，不能以组件库 E2E 代替。
- 组件侧单测 **14/14**、文档 E2E **1/1**；真实后端、权限码和宿主页面迁移继续按矩阵执行。

## 2026-10-19 LxInput 前后缀行高

- 已完成：内容、prefix/suffix、内部槽位及 prepend/append 行高统一，复合输入和窄屏回归通过。
- 保留任务：宿主可访问名称、错误描述关联和语义前后缀说明列入表单可访问性专项；不提前关闭权限中心、页面引导或 Element Plus 删除任务。

## 2026-10-19 LxInput 前后缀完整高度

- **已完成**：输入内容、prefix/suffix 及内部槽位与外框统一完整高度；sm/md/lg 和 390px 触屏几何回归通过。
- **仍待办**：宿主表单可访问性、真实后端联调、权限接入和 Vue3 Element Plus 分批替换；请求保持 `.then().catch().finally()`。
# 2026-10-19 LxProTable 当前版复验记录

- 已完成当前组件行为门禁：跨页选择差集与全量清空修复后单测 4/4、文档 E2E 4/4、类型/构建/格式检查通过。
- 待办仍包括真实业务页面接入、分页与权限后端契约核对、宿主请求链回归及正式 Impeccable A/B；API 请求保持 `.then().catch().finally()`。

## 2026-10-19 LxDescriptions 当前版证据

- 组件库长值/长状态展开收起已完成当前版行为与浏览器回归：单测 10/10、文档 E2E 3/3、typecheck 通过。
- 宿主详情页仍需按旧页面字段、脱敏、复制、具名插槽、空/错/加载和权限契约逐页替换；真实 API 调用继续使用 `.then().catch().finally()`。
- Assessment B 及综合记录只证明组件 Demo 当前版状态，不关闭业务迁移、真实权限、后端联调或 Element Plus 删除门禁。

## 2026-10-19 LxPagination 当前版证据复核

- 组件/适配器单测 **7/7**、文档 Playwright **3/3** 已通过；迁移适配继续保留 `change(page, pageSize)`、`autoReset`、`autoScroll` 和窄屏局部滚动契约。
- 历史记录引用的 `linkx-fe/.impeccable/critique/pagination-assessment-b-2026-10-17/` 当前缺失，正式 A/B 与 snapshot/trend 待补；不可用旧文字或静态 `[]` 关闭 UI-10。
- 真实业务分页请求、空/错/取消/重复提交和权限联调继续按页面迁移批次处理，Element Plus 仍保留。

## 2026-10-19 隔离 Mock 全菜单预览复验

- `pnpm exec playwright test --config=playwright.preview.config.ts --reporter=line` **10/10** 通过，首页及 33 个现役入口首屏样例可重复验收。
- 专项覆盖关联人员搜索竞态、关闭重开后的迟到响应、北向接入 Mock CRUD、轮播分页和 AuthImg 失败/键盘重试/减少动效。
- 待办仍为每个业务入口的深层空/失败/取消/权限不足/重复提交状态，以及真实后端联调；本轮不提前删除 Element Plus。

## 2026-10-19 LxPagination 宿主首批迁移

- 三个业务场景完成分页替换：预警推送双 Tab、北向接入、协同岗挂靠弹窗；旧分页状态、事件顺序、请求竞态和注入式查询契约保持不变。
- 类型检查、目标 ESLint、Prettier、全菜单首屏 Mock 和北向 CRUD Mock 均通过。
- 仍待迁移其他直接 `el-pagination` 使用点，并补页面级空/失败/取消/权限不足和真实接口联调；Element Plus 继续保留。
