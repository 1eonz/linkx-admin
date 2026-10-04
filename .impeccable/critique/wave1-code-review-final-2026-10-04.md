# Wave 1 基础控件独立代码审查

## P1

- **关闭密码显隐能力后，已显示的密码仍保持明文。** [LxPasswordInput/index.vue](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:70) 仅依据本地 `isPasswordVisible` 决定 `type`，而 `showPassword=false` 只在 [同文件](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:91) 移除按钮，不重置显隐状态。复现：打开文档 Demo，点击“显示密码”，再取消“允许切换明文”；按钮消失，但输入仍是 `type="text"`，之后没有控件可将它遮回。应在关闭能力时强制恢复密码类型。

## P2

- **继承 `ElForm` 禁用态时，密码显隐按钮仍可操作。** [LxPasswordInput/index.vue](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:14) 有意让 `disabled` 保持 `undefined` 以继承表单状态；内部 `LxInput` 因此会禁用原生输入，但显隐处理和按钮禁用分别只检查该 prop（[同文件](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:53)、[同文件](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:95)）。复现：将组件放在 `<ElForm disabled>` 中，输入框呈禁用态，眼睛按钮仍可点击并切换成明文。当前单测只断言继承禁用的原生输入，没有断言该按钮（[lx-password-input.test.ts](F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-password-input.test.ts:53)）。

- **窄屏尺寸下，显隐按钮的键盘焦点框会压到字段标签。** [LxPasswordInput/index.vue](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:138) 在 480px 内将按钮扩大到 44px，并用负外边距维持较小的输入框外框；焦点框另向外扩 3px（[同文件](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/index.vue:129)）。文档 Demo 的字段标签与控件间距为 8px（[basic.vue](F:/work/linkx-admin/linkx-fe/src/components/LxPasswordInput/demo/basic.vue:162)）。在当前 Playwright `Desktop Chrome` 项目以 375px 视口运行时，`hover:none` 不成立，输入框仍是 28/32/40px，而按钮为 44px；sm/md 档焦点框分别越过这 8px 间距约 3px/1px，遮到标签下缘。现有 E2E 断言尺寸和点击区，却没有检查显隐按钮聚焦时与标签的间隔（[lx-password-input-docs.spec.ts](F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts:76)）。

- **点击溢出菜单项后焦点没有回到“更多”按钮。** [LxActionButtons/index.vue](F:/work/linkx-admin/linkx-fe/src/components/LxActionButtons/index.vue:58) 默认 `fromMenu=false`，菜单项模板在 [同文件](F:/work/linkx-admin/linkx-fe/src/components/LxActionButtons/index.vue:166) 调用 `onClick(action)` 时没有传 `true`，因此会隐藏仍持焦的菜单项而不执行焦点恢复。复现：展开“更多”，聚焦并点击“停用”；菜单关闭后焦点离开操作组。新增 E2E 只断言菜单隐藏和事件反馈，没有检查焦点去向（[lx-action-buttons-docs.spec.ts](F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-action-buttons-docs.spec.ts:20)）。

## 验证边界

- 本次检查了指定组件、中文 Demo/API、单测和文档 E2E 的工作树内容及相关上下文；未运行单测、Playwright 或浏览器交互，因此运行时结果未验证。
- 指定范围内未发现业务 API 调用，`.then().catch().finally()` 规则不适用。
