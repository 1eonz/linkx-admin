# LxTransferPanel 本轮代码复审

复审日期：2026-10-08  
复审范围：当前未提交差异中的组件、Demo、中文文档、单元测试与文档站 E2E 测试。  
复审方式：只读源码复审；本轮未运行测试、构建或浏览器验收。

## 结论

发现 1 项 P2 和 1 项 P3；未发现明确的 P0/P1 阻断问题。P2 涉及 Demo 卸载时恢复全局主题的行为，P3 涉及 320px 用例没有验证其标题声称的换行和内部滚动行为。

## 发现

### [P2] Demo 卸载时可能覆盖用户后来切换的站点主题

位置：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:167-176`

Demo 挂载时保存 `html` 上 `dark` 与 `lx-theme-hud` 的初始状态，卸载时无条件恢复这两个快照。如果用户在 Demo 挂载期间通过文档站全局主题控件切换主题，再导航离开，卸载钩子会把根节点主题类改回挂载时状态，导致站点显示状态与用户刚选择的主题不一致。

建议让 Demo 只控制自身作用域内的主题，或接入文档站的主题状态；避免组件通过挂载快照无条件回写全局根节点。增加“挂载 Demo、切换站点主题、导航离开后主题选择仍保留”的浏览器回归用例。

### [P3] 320px E2E 未证明文本实际换行或列表实际内部滚动

位置：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:459-487`

用例标题声称验证“已选名称完整换行”和“列表可聚焦”，但当前断言只检查 `white-space: normal` 与 `scrollWidth <= clientWidth`，不能证明任何名称实际显示为多行。列表部分仅设置 `scrollTop = scrollHeight`，没有检查 `scrollHeight > clientHeight` 或 `scrollTop` 是否变化；末项 `toBeInViewport()` 检查的是浏览器视口可见性，也不能证明列表发生了内部滚动。当前 Demo 默认只选 5 项，这个步骤可能没有触发列表溢出。

建议使用确定会换行的长名称并检查其实际布局行数或高度；同时断言列表存在内部溢出、滚动位置确实改变，并验证末项在列表滚动容器内可见。

## 验证边界

本记录来自限定文件的静态复审，没有执行单测、E2E、构建或浏览器检查；因此不把这些验证标记为通过。建议后续修复 P2 后补充主题切换回归覆盖，并增强 P3 的可观察行为断言。

## 复审源码 SHA-256

以下哈希对应本次复审时读取的文件内容：

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `9250D31A3A382A7D252459C671614CDA4CA681FE0DA0B3C791D3219D4684A0A1` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `C2D78A29FF33D027C873B0AE41D99FAEE7E96BFBC9E3DF0B5A5B9A4888D4FDFA` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C13B6CF97C9FAB39E62CCC82D4CF3B9C71BAEC751D1C3EB4F968C1D33FBB9CC2` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `72F38AD3CD6F46E0B5E315A1698BA969C5964D9B0E4DEA9F5A99AD98AC47F823` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `5CC594C9FDB120F4EEB3558D0856F84451AB036DCC9EDBDC7261EA49E7E61CD7` |
