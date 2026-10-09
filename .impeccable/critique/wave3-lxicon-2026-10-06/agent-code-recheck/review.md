# LxIcon 波次独立代码复核

复核日期：2026-10-06

复核结论：**Request Changes**。侧栏对畸形的非字符串图标值仍可能在渲染时抛错；剪贴板失败测试没有验证完整文本选区。未修改源码或既有报告。

## 范围与方法

- 只读检查 `linkx-fe/src/components/LxIcon/`、侧栏图标解析调用、对应单测与 E2E，以及 `linkx-fe/docs/components/lxicons.md`、`lxsidebar.md` 和交付核查文档。
- 对照当前工作树相对 `HEAD` 的相关差异，并沿 `LxSidebarItem`、`LxSidebarGroup` 到 `resolveLxIconName` 的调用链检查运行时类型边界。
- 使用 Node 直接复现 JavaScript 属性键转换：`Object.prototype.hasOwnProperty.call({}, { toString: 1 })` 抛出 `TypeError: Cannot convert object to primitive value`。
- 检查了剪贴板失败 E2E 的字段值、焦点和选区断言；没有运行测试、构建或格式化命令。

## Findings

### [P2] 侧栏解析前没有拒绝非字符串图标值

位置：`linkx-fe/src/components/LxSidebar/LxSidebarItem.vue:28`、`linkx-fe/src/components/LxSidebar/LxSidebarGroup.vue:29`、`linkx-fe/src/components/LxIcon/icons.ts:378`。

两个侧栏组件把 `props.item.icon ?? ''` 直接传给 `resolveLxIconName`。虽然菜单类型将 `icon` 声明为 `string`，权限菜单是运行时数据；合法 JSON 值 `{"toString":1}` 可作为 `icon`。解析器调用 `Object.prototype.hasOwnProperty.call(..., name)` 时会将对象转换为属性键，该值因无法转为原始值而抛出 `TypeError`。异常位于渲染计算中，可能中断侧栏渲染。空值和普通未知字符串会回退，但这不覆盖上述畸形值。

当前单测 `other-admin/admin-vue3/tests/unit/lx-icon.test.ts:57` 只使用未知字符串 `not-an-icon`，断言 item/group 分别回退到 `dashboard` 和 `cube`；没有覆盖非字符串值。应在解析边界收窄到字符串后再解析，或让公开解析器对非字符串输入安全返回 `undefined`，并补充对象脏值的回归断言。

### [P3] 复制失败测试没有确认选中了完整代码

位置：`other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts:313`。

失败路径实现 `linkx-fe/docs/components/lxicons.md:283` 会调用 textarea 的 `.select()`，当前实现会选中整段代码。但 E2E 只断言 `selectionEnd === snippet.length`。如果回归后选区变成末尾插入点（`selectionStart === selectionEnd === snippet.length`），现有断言仍会通过，因而没有验证“已选中的代码”这一行为。

测试还应确认 `selectionStart === 0`，并同时确认 `selectionEnd === snippet.length`，或断言 `textarea.value.slice(selectionStart, selectionEnd)` 等于完整代码。

## 中文文档核查

- `linkx-fe/docs/components/lxicons.md:3`、`:374` 用中文说明图标目录、筛选、类型约束和未知名称的问号图标；该契约对字符串图标名成立。复制失败页内反馈也说明了手动复制路径。
- `linkx-fe/docs/components/lxsidebar.md:32` 将菜单字段列为 `key/title/icon/children/...`，未说明畸形运行时 icon 值的回退边界；不构成错误描述，但应随实现补充边界说明。
- `linkx-fe/docs/DELIVERY-CHECK.md:5` 写明“当前代码复审批准，未发现可复现 P0–P2”，与本次可复现的 P2 不一致。此状态应在修复并复审后再更新；本次未改动该文件。

## 验证边界

已通过直接 JavaScript 行为复现确认 P2 的异常机制，并静态核对当前 E2E 断言不足。未运行单测、Playwright、类型检查、库构建或文档构建；不据此报告这些命令的结果。
