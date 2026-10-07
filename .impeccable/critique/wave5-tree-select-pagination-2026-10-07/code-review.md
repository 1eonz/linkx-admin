# Wave 5 TreeSelect / Cascader / SelectPagination 代码复审

审查日期：2026-10-07。审查范围为本波次涉及的 `LxTreeSelect`、`LxCascader`、`LxSelectPagination` 实现、Demo、中文组件文档、相关单测和文档 Playwright 用例；重点核对 P0-P2 风险、主题类恢复、Cascader 窄屏行高与换行、SelectPagination 请求取消及 `dispatchEvent` / `aria-busy` 语义，以及 TreeSelect 的方向键和 Enter 行为。

## 结论

**批准：未发现 P0、P1 或 P2 缺陷。**

- `LxSelectPagination` 的 slow Mock 与请求计数流程能够覆盖第二次搜索取消旧请求、第三次请求成功和 `POL-00008` 失败反馈；E2E 在设置下一次请求状态时使用 `dispatchEvent('click')`，避免真实点击 Demo 外部按钮触发 Element Plus click-outside 关闭 teleported 下拉框。组件 `loading` 通过 `aria-busy` 透传到 `LxSelect` 根节点，测试选择器与实际语义一致。
- `LxSelectPagination` 的取消、迟到响应丢弃、失败页重试和空页失败重试路径与新增单测契约一致，未见旧响应覆盖新搜索结果或失败后无法恢复的问题。
- `LxTreeSelect` 的主题 Demo 在卸载时恢复 `html` 原始 `dark` / `lx-theme-hud` 类；TreeSelect 方向键和 Enter 用例符合 Element Plus 2.14.6 的底层契约：首个 `ArrowDown` 展开，再次移动当前节点，`Enter` 选择并关闭单选弹层。
- `LxTreeSelect` 与 `LxCascader` 的 HUD 颜色、禁用/错误反馈、触控尺寸和减少动效断言与当前实现及已有浏览器证据相符。Cascader 节点使用 `height: auto`、`min-height: 44px`、`line-height: 20px` 和块级内边距，长文本具备换行空间。
- 三份组件选型说明与各组件职责匹配：固定层级路径使用 Cascader，组织树使用 TreeSelect，远程大数据分页使用 SelectPagination。

## P3 观察

`other-admin/admin-vue3/tests/e2e/lx-cascader-docs.spec.ts:141-155` 检查了首个节点的 `white-space: normal`、`overflow: visible` 和最小行高，但样本文本“杭州市公安局”较短，未直接证明长节点在 375px 视口中实际产生换行。可在后续回归中增加更长的节点样例，或断言长文本节点的实际高度超过单行基线；这属于测试覆盖增强，不影响本次批准，也不构成 P0-P2 阻断项。

## 验证边界

本次为只读代码复审，未重新运行单测、构建或会生成报告的 E2E；报告结论基于当前源码、差异、测试断言和已提供的浏览器证据。未将静态 detector 的 `[]` 或历史通过记录当作本次执行结果。
