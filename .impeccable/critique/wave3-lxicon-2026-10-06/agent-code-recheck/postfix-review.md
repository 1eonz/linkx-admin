# LxIcon 修后独立复核

复核日期：2026-10-06

结论：**Request Changes**。侧栏菜单的非字符串图标回退和剪贴板失败选区断言已修复；但 `LxIcon` 直接接收同类非字符串运行时值时，错误名称格式化仍会抛异常，原 P2 的组件边界风险尚未完全关闭。

## 复核范围与方法

- 只读检查本轮 `resolveLxIconName`、侧栏 item/group、中文侧栏文档、图标单测和剪贴板 E2E 的差异，并复看此前报告指出的 `LxIcon` 运行时名称处理。
- 静态沿解析、fallback 和可访问标签计算路径检查对象值 `{"toString":1}` 的处理；未运行测试、构建或格式化命令。
- `git diff --check` 对相关文件未报告空白错误；Git 仅提示 LF/CRLF 转换。

## Findings

### [P2] LxIcon 自身对非字符串未知名称仍会在标签格式化时抛错

位置：`linkx-fe/src/components/LxIcon/index.vue:40`、`:57`。

`resolveLxIconName` 现在接受 `unknown` 并在 `typeof name !== 'string'` 时返回 `undefined`，因此 `LxSidebarItem` 和 `LxSidebarGroup` 能将畸形菜单值分别替换为 `dashboard` / `cube`。新增单测以 JSON 解析生成 `{"toString":1}`，挂载完整侧栏并断言两种 fallback；这一条侧栏菜单路径已关闭原 P2。

但 `LxIcon` 直接接收运行时脏值时仍会继续执行 `accessibleLabel` 的模板字符串 `未知图标：${props.name}`。对 `{"toString":1}` 做字符串转换会抛出 `TypeError`，导致组件渲染失败。模板还把原始值绑定到 `data-icon-name`（第 57 行），同样不应把未校验对象直接交给 DOM 属性。组件 prop 的 TypeScript 类型不构成运行时校验；现有未知名称回退功能和中文说明也表明运行时异常名称处于处理范围。

建议为错误标签使用安全的字符串表示（例如非字符串统一显示通用错误名），并避免把对象原值绑定到 DOM 属性；补一个直接挂载 `LxIcon`、传入上述 JSON 值的回归用例。当前单测只验证字符串 `unknown-icon` 的问号图标 fallback，侧栏畸形数据测试不会触发 `LxIcon` 的原始异常分支，因为侧栏已先替换为合法名称。

### P3 已关闭：剪贴板失败回退选中了完整代码

位置：`other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts:313`。

E2E 现在同时断言 `selectionStart === 0` 与 `selectionEnd === snippet.length`；配合前面的字段值断言，能够确认选区覆盖 textarea 中的完整代码。此前“仅检查 selectionEnd”的缺口已关闭。

## 文档核查

`linkx-fe/docs/components/lxsidebar.md:32` 已补充未知或非字符串菜单图标会安全回退为默认图标，与 item/group 实现和单测一致。该描述只说明侧栏菜单路径，不代表直接传入 `LxIcon` 的畸形值也已安全处理。

## 验证边界

本次仅做差异和调用路径静态复核，没有运行 Vitest、Playwright、类型检查、组件库构建或文档构建。最终建议：剪贴板 P3 可关闭；侧栏菜单部分已修复，但 `LxIcon` 的直接运行时边界仍需修复并复审后，才能关闭原 P2。
