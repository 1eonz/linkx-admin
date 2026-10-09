# G2 组件契约只读审计

日期：2026-10-08

审计对象仅为 `LxSearchBar` 与 `LxStatusSwitch`。对照了 `design/` 标本、Vue2 原组件、Vue3 适配器、lx-ui 源码、中文文档、Demo、单测与现有 Playwright 文件。结论基于当前工作树静态阅读；本次未运行测试、浏览器或后端请求，未修改产品源码，未暂存或提交，也未读取 Wave 7 Assessment A/B 输出。

## 最高优先级

Vue3 `SearchBar` 适配器没有保留 Vue2 `SearchBar` 的查询对象与组织/日期条件契约：组织/日期 props 在适配器中标为预留且未实现，`search`/`reset` 丢失原参数对象，`action(key)` 变为直接执行 `onClick`，批量按钮的 `selectedCount` 禁用语义也不存在。旧组件另有可由 Vue2 ref 调用的 `getSearchParams()` 与 `setOrgValue()`，新适配器和 lx-ui 均未 `defineExpose`。这会影响直接替换旧宿主的行为；G2 应先确定并落实适配边界，再据此做宿主回归。

## SearchBar

| 契约面 | Vue2 原组件 | Vue3 适配器 | lx-ui 组件 |
| --- | --- | --- | --- |
| Props | `searchKey`、`searchPlaceholder`、`searchDefaultValue`、`searchWidth`；`showOrg`、`orgDefaultValue`、`orgSyncSign`；`showDateRange`、范围类型/格式/默认值/起止 placeholder；`actions`、`selectedCount`。 | `searchKey`、`placeholder`、`showOrg`、`showDateRange`、`actions`。注释明确 `showOrg` / `showDateRange` 当前未使用；无旧组织/日期参数、默认值/宽度、选中数契约。 | `fields` schema、`modelValue: Record<string, unknown>`、`loading`、折叠 props、文案、尺寸；字段类型包括 input/select/date/daterange/number/tree-select/cascader。字段支持 disabled，无 error/errorText 字段。 |
| Events | `search(params)`、`reset(params)`、`action(key)`、`org-change({ code, name, id })`。参数包含关键字、组织字段及日期范围/起止值；reset 只发 reset。 | `update:searchKey(string)`、无参数 `search`/`reset`。reset 只清空关键字并发 reset，不立即 search。新 `ActionItem` 用 `onClick` 且无旧 `key`，直接执行回调，不发 `action`；无组织事件。 | `update:modelValue(record)`、无参数 `search`/`reset`、`update:collapsed(boolean)`。字段回车发 `search`；reset 发模型默认值、`reset`，并立即再发 `search`。 |
| 插槽与实例 | 未声明插槽。Vue2 实例包含 `getSearchParams()`、`setOrgValue(...)` 等方法。 | 提供 `filters` 插槽；文档声明无 `defineExpose` 方法。内层控件由适配器自行渲染。 | `meta`、`controls`、`actions`、`filters` 插槽；未 `defineExpose`。 |

实现证据：Vue2 props、事件、参数映射及实例方法见 [SearchBar/index.vue](../../../../src/components/SearchBar/index.vue#L157)、[SearchBar/index.vue](../../../../src/components/SearchBar/index.vue#L308)、[SearchBar/index.vue](../../../../src/components/SearchBar/index.vue#L336)、[SearchBar/index.vue](../../../../src/components/SearchBar/index.vue#L414)。Vue3 适配器的精简 props/events、无 expose 说明和控件实现见 [SearchBar/index.vue](../../../../other-admin/admin-vue3/src/components/SearchBar/index.vue#L28)、[SearchBar/index.vue](../../../../other-admin/admin-vue3/src/components/SearchBar/index.vue#L44)、[SearchBar/index.vue](../../../../other-admin/admin-vue3/src/components/SearchBar/index.vue#L87)、[SearchBar/index.vue](../../../../other-admin/admin-vue3/src/components/SearchBar/index.vue#L112)。库 API 与事件见 [LxSearchBar/types.ts](../../../../linkx-fe/src/components/LxSearchBar/types.ts#L42)、[LxSearchBar/index.vue](../../../../linkx-fe/src/components/LxSearchBar/index.vue#L34)。

设计标本要求 32px 控件、4px 圆角、默认/悬浮/聚焦/禁用/错误五种状态；示例含四字段单行和多字段收起布局。schema 目前能表达 disabled，不能表达 error；错误态只能由自定义字段控件另行实现，当前 SearchBar Demo 没有演示它。另有两处设计契约差异：正文说字段数大于 8 才折叠，API 表说大于 4；API 表的 `@search(query)` 与库组件无参数 `search` 事件也不一致。lx-ui 实现与中文文档采用“大于 8，收起时显示前 4 项”。见 [设计标本](../../../../design/检索面板%20SearchBar/code.html#L255)、[设计状态矩阵](../../../../design/检索面板%20SearchBar/code.html#L411)、[设计 API](../../../../design/检索面板%20SearchBar/code.html#L735)、[设计 search 事件](../../../../design/检索面板%20SearchBar/code.html#L747)、[lxsearchbar.md](../../../../linkx-fe/docs/components/lxsearchbar.md#L19)。

当前可执行行为证据是宿主单测 8 项，覆盖受控输入、级联值边界、默认值重置并查询、Escape、loading 搜索锁、字段折叠与日期可访问 ID，见 [lx-search-bar.test.ts](../../../../other-admin/admin-vue3/tests/unit/lx-search-bar.test.ts#L19)。未找到针对 `LxSearchBar`/Vue3 `SearchBar` 的 Playwright 组件交互用例；`lx-search-docs.spec.ts` 测的是 VitePress 全站文档搜索，`col-form-search-race.spec.ts` 测的是弹窗内远程人员选择。中文文档记录了 Chrome 桌面与 375px 手动检查，但这不是可重复的组件级浏览器覆盖，见 [lxsearchbar.md](../../../../linkx-fe/docs/components/lxsearchbar.md#L39)。

因此 G2 的浏览器覆盖缺口是：通过实际页面交互验证筛选字段、按钮/回车/清空、reset 后模型与查询事件、失败后恢复、loading 锁、折叠，以及 375px 展开长表单时的布局；同时验证设计要求的 focus、disabled 与 error 状态。尤其要为宿主适配器单独验证旧参数对象与组织/日期语义，库组件 Demo 不能替代该回归。

## StatusSwitch

| 契约面 | Vue2 原组件 | Vue3 适配器 | lx-ui 组件 |
| --- | --- | --- | --- |
| Props | `value:number`，默认 0；0=启用、1=禁用；`disabled`、`loading`、`normalText`、`forbiddenText`。 | 保留上述数值 props 与文本名。 | `modelValue:boolean \| number`，默认 false；数值模式 0=开启、1=关闭，布尔模式 true/false；另有 `loading`、`disabled`、`permission`、`fallbackTag`、`confirm`、`onText`、`offText`。 |
| Events | `change(number)`，每次发 0 或 1。 | `change(number)`，将开关布尔值映射为 0/1。 | `update:modelValue` 与 `change` 的值类型跟随输入模式：数值输入仍发 0/1，布尔输入发 boolean。 |
| 确认/只读 | 不含确认或权限 props；disabled 时显示状态 Tag。 | 不含 `confirm`、`permission`、`fallbackTag`；disabled 时显示状态 Tag。 | `confirm` 仅拦截关闭；取消时不发值更新。disabled 显示当前状态只读 Tag；权限不足可按 `fallbackTag` 降级。 |
| 错误/暴露 | 没有组件错误态契约或文档化 expose；Vue2 实例有 `switchValue` computed 与 `handleChange` method，源码中未找到调用点。 | 没有组件错误态契约或 `defineExpose`。 | 没有 `error` prop 或 `defineExpose`；保存错误反馈由宿主负责。 |

Vue2 映射和标签见 [StatusSwitch/index.vue](../../../../src/components/StatusSwitch/index.vue#L55)、[StatusSwitch/index.vue](../../../../src/components/StatusSwitch/index.vue#L100)、[StatusSwitch/index.vue](../../../../src/components/StatusSwitch/index.vue#L117)。Vue3 适配器的 prop/event 与映射见 [StatusSwitch/index.vue](../../../../other-admin/admin-vue3/src/components/StatusSwitch/index.vue#L42)、[StatusSwitch/index.vue](../../../../other-admin/admin-vue3/src/components/StatusSwitch/index.vue#L64)、[StatusSwitch/index.vue](../../../../other-admin/admin-vue3/src/components/StatusSwitch/index.vue#L76)。lx-ui 值映射、确认拦截和权限回退见 [LxStatusSwitch/index.vue](../../../../linkx-fe/src/components/LxStatusSwitch/index.vue#L16)、[LxStatusSwitch/index.vue](../../../../linkx-fe/src/components/LxStatusSwitch/index.vue#L40)、[LxStatusSwitch/index.vue](../../../../linkx-fe/src/components/LxStatusSwitch/index.vue#L56)、[LxStatusSwitch/index.vue](../../../../linkx-fe/src/components/LxStatusSwitch/index.vue#L75)。

状态开关设计契约包括 boolean/0-1、loading、disabled、permission/fallbackTag、关闭确认和取消；标本规定 42×20px 轨道、16px 滑块、绿色开启、灰色关闭，并明确红色只用于错误/警报与高危确认按钮。当前 Vue3 适配器仍直接用 Element Plus，轨道为 46×22px、滑块 18px，关闭色使用危险红；它也没有把 `confirm` 和权限回退提供给宿主。lx-ui 的 `LxStatusSwitch` 已支持确认、只读、权限回退和统一灰关闭态。见 [设计 API](../../../../design/状态开关%20StatusSwitch/code.html#L607)、[设计映射用法](../../../../design/状态开关%20StatusSwitch/code.html#L655)、[设计 token](../../../../design/状态开关%20StatusSwitch/code.html#L668)、[Vue3 适配器样式](../../../../other-admin/admin-vue3/src/components/StatusSwitch/index.vue#L118)、[lx-ui 文档](../../../../linkx-fe/docs/components/lxstatusswitch.md#L19)。

当前覆盖情况：单测文件有 8 个用例，验证数值 0/1 到开关状态映射、从数值 0 切至关闭时 `change` 发出数字 1、只读标签、权限回退、loading 锁和确认取消；没有数值 1 切回 0 的事件断言，也没有直接测试 Vue3 兼容适配器。文档 Playwright 有 3 项：浏览器验证数值 0→1、只读不显示 switch、确认取消不改值/确认后关闭，以及宿主模拟保存失败时保持原值；浏览器用例通过 `update:modelValue` 驱动 Demo，未直接断言 `change(number)`。见 [单测](../../../../other-admin/admin-vue3/tests/unit/lx-status-switch.test.ts#L43)、[Playwright](../../../../other-admin/admin-vue3/tests/e2e/lx-status-switch-docs.spec.ts#L3)、[Demo 保存失败处理](../../../../linkx-fe/src/components/LxStatusSwitch/demo/basic.vue#L15)。

缺口与边界：`change(number)` 的组件单测已覆盖数值 0→1，但数值 1→0 和浏览器事件类型仍缺；适配器本身没有测试确认/只读/映射。只读已有单测和浏览器覆盖。组件没有独立 error state，设计也没有定义状态开关错误态；当前 Playwright 覆盖的是宿主保存失败反馈和原值保留，不应记成组件 error prop 覆盖，Demo 的失败后重试也未由该用例实际操作。

## UI-04 与 Element Plus 边界

G2 是 `LxSearchBar` + `LxStatusSwitch` 的组件库与适配器工作。路线图明确要求组件库门禁关闭前保留 Vue3 `element-plus`，后续 UI-04 才按页面替换并完成宿主回归；宿主依赖目前仍列在 [admin-vue3/package.json](../../../../other-admin/admin-vue3/package.json#L32)。本次审计不删除该依赖，也不把适配器使用 Element Plus 当作 G2 的依赖清理项。路线图依据见 [ROADMAP.md](../../../../linkx-fe/docs/ROADMAP.md#L8) 与 [ROADMAP.md](../../../../linkx-fe/docs/ROADMAP.md#L130)。

## 建议带入 G2

1. 先确定 SearchBar 的旧宿主兼容合同：查询参数对象、组织与日期字段、action key/批量禁用及 `getSearchParams`/`setOrgValue` 的兼容要求；适配器当前均未实现。源码范围未找到旧实例方法的调用点，但调用者契约仍需以实际迁移页面确认。
2. 统一 SearchBar 折叠阈值与 `search` 参数说明；设计 API 表和设计正文不一致，实际代码/中文文档使用大于 8。
3. 补 SearchBar 组件与适配器级 Playwright 行为覆盖，特别是失败恢复、窄屏展开、键盘和字段状态。
4. StatusSwitch 适配器替换/桥接时维持旧 `value` / `change(number)` / 文案命名；数值初值必须以 number 传入 lx-ui，避免迁移后将事件改成 boolean。补 1→0 与适配器用例，并保留确认取消和宿主失败回归。
5. 记录状态开关设计修正：关闭态应为灰色、42×20px；关闭危险性通过确认弹窗表达。
