# LxPasswordInput 后置代码复核

日期：2026-10-06

## 结论

未发现本次指定差异中可确认、可复现的问题。建议通过本次代码复核。

## 证据

- 新增 `maskOnBlur` 默认值为 `false`；焦点离开包装根节点时才清除明文状态，焦点移至根节点内显隐按钮时保留状态（`linkx-fe/src/components/LxPasswordInput/index.vue:81`）。密码 `type` 仍由显隐状态绑定，`getForwardedAttrs()` 继续删除调用方透传的 `type`（同文件第 68 行）。
- 包装根节点仍处于原组件内；底层 `LxInput` 仍以 `disabled: undefined` 透传并处于 Element Plus 表单的 provide/inject 链中，新增 DOM 包装未改变该上下文。现有单测保留表单禁用态覆盖，新增动态 `type` 和失焦遮罩检查（`other-admin/admin-vue3/tests/unit/lx-password-input.test.ts:31`）。
- HUD 的 Element Plus 令牌映射限定在 Demo 的 `.password-input-demo.lx-theme-hud` 上；没有将变量写到全局根节点（`linkx-fe/src/components/LxPasswordInput/demo/basic.vue:196`）。
- E2E 在访问折叠的高级选项前先展开 `<details>`；失焦测试按 DOM 顺序从主输入框移至显隐按钮，再移至只读输入框，验证组件内焦点移动与离开边界（`other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts:99`）。

## 验证范围

按要求仅阅读指定文件相对 HEAD 的工作区差异及其直接相关的 HEAD 实现。未运行测试、未运行其他验证命令；因此本结论是静态代码复核，不代表运行时验收。
