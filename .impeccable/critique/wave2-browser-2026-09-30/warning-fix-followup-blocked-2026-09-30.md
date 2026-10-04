# Wave 2 warning follow-up — resolved — 2026-09-30

状态：**阻塞，未修复、未复验、不可标记完成。** 本文件仅记录已确认根因和建议补丁。没有改组件、测试或说明文档，也没有把既有通过记录当作修复后的验证。

## 变更写入阻塞

主 Agent 明确授权修复以下两个组件。当前子任务对两个现有 Vue 源文件执行 `Set-Content` 和只读测试式的 .NET `File.Open(..., FileAccess.Write, ...)` 都返回 `Access denied`；目标文件 `IsReadOnly=false`，ACL 列有 `Modify`。同目录新建临时文件可写，说明访问限制针对现有源文件，而非整个仓库路径。

随后对原定工作目录请求 `require_escalated`。自动审批服务未能运行，返回 HTTP 403：`This token has no access to model gpt-5.6-luna`，并明确要求不要绕过审批检查。没有再尝试替代写入方法。主 Agent 已收到定位及权限错误，并要求本 Agent 停止写源文件。

## 已确认的代码位置与原因

### LxStatusSwitch structured confirm

- 源码：`linkx-fe/src/components/LxStatusSwitch/index.vue:16` 使用 `withDefaults(defineProps<LxStatusSwitchProps>(), ...)`；`confirm` 默认值在第 22 行。
- 类型：`linkx-fe/src/components/LxStatusSwitch/types.ts:26` 将 `confirm` 声明为 `string | false | LxStatusSwitchConfirmOptions`。对象接口字段包含标题、说明、按钮文案和危险样式。
- 文档：`linkx-fe/docs/components/lxstatusswitch.md:28` 已公开写明 `string | object | false`，示例 `linkx-fe/src/components/LxStatusSwitch/demo/basic.vue` 也实际传入 structured object。
- 浏览器证据：原采集的 `playwright-results.json` 在 `/components/lxstatusswitch` 记录 Vue 警告：`Invalid prop: type check failed for prop "confirm". Expected String | Boolean, got Object`。开关行为仍能完成，警告来自宏按导入的 interface 无法给嵌套对象别名生成完整 runtime constructor；因此此项是类型声明和运行时契约不一致。

建议最小修复：保留现有 `LxStatusSwitchProps` 导出和 string/false/object 的 TS API，在组件内给 props 声明显式 runtime constructor。导入 `PropType`，把当前 `withDefaults(defineProps<...>(), defaults)` 换为 runtime `defineProps` 并保留当前每个默认值；其中：

```ts
confirm: {
  type: [String, Boolean, Object] as PropType<
    NonNullable<LxStatusSwitchProps['confirm']>
  >,
  default: false,
},
```

其余 runtime props 继续使用现有名称、类型和默认值。这样 Vue 会接受 structured object，同时 `String` 仍兼容旧文案，`Boolean` 接受默认/显式 `false`。之后必须由 Vue 类型检查验证 SFC runtime props 没有缩窄或意外放宽对外契约。

建议单测（`other-admin/admin-vue3/tests/unit/lx-status-switch.test.ts`）：

- structured object 可触发 `beforeChange` 并把 title/message/confirmText/cancelText/type 映射到 `lxConfirm`；捕获 `console.warn`，确认没有 `confirm` invalid-prop warning。
- 显式 `confirm: false` 时关闭可以继续且 `lxConfirm` 未调用。现有字符串确认单测仍保留，以覆盖旧 API。

### LxSearchBar daterange id 与标签关联

- ID helper：`linkx-fe/src/components/LxSearchBar/index.vue:100` 的 `fieldId` 生成单个字符串 ID。
- 标签：第 219 行把 label 的 `for` 指向单 ID。
- 日期控件：第 249–259 行的 `LxDatePicker` 对 `date` 和 `daterange` 共用第 251 行 `:id="fieldId(field.key)"`。
- Element Plus runtime 契约：本机安装版本 `linkx-fe/node_modules/element-plus/es/components/date-picker/src/props.d.ts` 将 `id` 声明为 `string | [string, string]`。其 `PickerRangeTrigger` 实现将 `id[0]`、`id[1]` 分别用于开始和结束 input。传 string 时既触发 `Expected Array, got String`，又会把字符串首尾字符误当作两个 input ID，破坏 label 关联；warning 属实且有可访问性影响。
- 原浏览器证据在 `/components/lxsearchbar` 两次记录上述 warning，值为 `lx-search-date`。

建议最小修复：

```ts
function fieldControlId(field: LxSearchField): string | [string, string] {
  const id = fieldId(field.key)
  return field.type === 'daterange' ? [`${id}-start`, `${id}-end`] : id
}

function fieldLabelTarget(field: LxSearchField): string {
  const id = fieldControlId(field)
  return Array.isArray(id) ? id[0] : id
}
```

label 的 `for` 改为 `fieldLabelTarget(field)`；日期选择器的 `id` 改为 `fieldControlId(field)`。单日期仍使用字符串，日期区间得到两个确定且安全的 ID，并让主字段标签关联开始日期输入。

建议单测（`other-admin/admin-vue3/tests/unit/lx-search-bar.test.ts`）：挂载一个 daterange 字段，断言 ElDatePicker 的 `id` 等于 `["lx-search-createdAt-start", "lx-search-createdAt-end"]`，label 的 `for` 指向 `...-start`，两个真实 input 分别持有对应 ID，并确认 Vue console 中不再含 `id` invalid-prop warning。

建议文档仅在复验后补充 `lxsearchbar.md` 的可访问性说明：日期区间生成独立开始/结束 input ID，字段标签关联开始日期。`lxstatusswitch.md` 已说明结构化对象及旧类型，无需改变现有 API 描述；可注明 structured confirm 运行时被正式接受。

## 当前验证与未完成项

- 原始浏览器基线：`wave2-browser-2026-09-30/playwright-results.json` 中 6 个独立交互场景全通过，但这些运行在修复前，不能证明 warning 已修复。
- 原始 Playwright Test 基线：`playwright-runner.json` 中 StatusSwitch/Upload 共 6 项通过，退出码 0；不是修复后复验。对应 stderr 是 Node/NO_COLOR 警告。
- 本次没有运行单测、类型检查或修复后浏览器采集，因为源文件尚未改动。
- 尚需：应用两个补丁；运行 `pnpm exec vitest run tests/unit/lx-status-switch.test.ts tests/unit/lx-search-bar.test.ts`；使用 Wave 2 runner 单 worker 重跑 StatusSwitch 的 3 个 E2E；运行 SearchBar 最小浏览器交互并保留 JSON、stderr 和退出码；确认两个 targeted invalid-prop warning 消失；重新捕获和定位 SearchBar 之前出现但 response hook 未复现的 console-only 404；复验后更新组件文档。
- 不宣称正式 Impeccable Critique 通过。本次发现并记录的 console-only 404 仍未定位，也未被本次阻塞解除。

## Resolution 2026-09-30

主 Agent 已使用工作区内可写方式完成两项补丁并复验：

- `LxStatusSwitch` 的 `confirm` 运行时类型接受字符串、布尔值和结构化对象；定向单测 8/8 通过，浏览器警告不再作为当前阻塞项。
- `LxSearchBar` 的 `daterange` 生成开始/结束两个 input ID 并让 label 关联开始输入；定向单测 8/8 通过，浏览器警告不再作为当前阻塞项。
- 本记录原先的 Access denied / 自动审批 403 只描述当时子任务的写入限制；不再代表当前工作区状态。
- 仍需在 Wave 2 综合交接中保留原始 warning 证据和修复后 JSON/截图，不能将静态 detector `[]` 单独写成视觉通过。
