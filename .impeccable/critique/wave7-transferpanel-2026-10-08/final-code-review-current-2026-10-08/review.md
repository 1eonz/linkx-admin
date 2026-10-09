# Wave 7 TransferPanel / VirtualTree 当前代码审查

审查依据为本轮工作树中的 `LxTransferPanel`、`LxVirtualTree` 源码、对应中文文档，以及 `other-admin/admin-vue3` 中相关单测和 E2E。没有查看或引用 Assessment A/B 报告。此次只读检查了测试代码，没有执行测试。

## Findings

### P2：窄屏切回桌面时，焦点仍落在被隐藏的面板切换按钮

位置：`linkx-fe/src/components/LxTransferPanel/index.vue:637`、`linkx-fe/src/components/LxTransferPanel/index.vue:1055`、`linkx-fe/src/components/LxTransferPanel/index.vue:336`。

复现：在 375px 视口将键盘焦点放到 `button[data-testid="mobile-selected-panel"]`，再把视口宽度改为 1024px。宽屏规则会令 `.lx-transfer-panel__mobile-switch` 变为 `display: none`，但 resize 处理只更新树行高和已选列表滚动提示，没有将焦点转移到仍可见的面板内容。隐藏当前焦点元素后，键盘用户会失去可见焦点，后续 Tab 导航也无法从原来的面板切换位置继续。

当前 E2E `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:1169` 只检查了桌面缩窄到手机时，焦点已选项和面板状态能够保留；没有覆盖手机切回桌面、焦点位于切换按钮时的反向路径。建议在宽屏断点切换时将焦点交给当前活动面板内合理的可见控件，并补一条反向断点 E2E。

## 已检查项

- 虚拟树在用户滚动后同步唯一的 Tab 停靠项，程序定位不抢占外部焦点；行高变化及树内展开/复选控件方向键导航均有对应实现和测试。
- TransferPanel 受控选择保留未加载键、禁用键及事件顺序；确认清空/移除、相邻项焦点回落和列表清空后的焦点有测试覆盖。
- HUD 预览作用域、Teleport 确认框主题、长标题、键盘提示页脚及窄屏布局有单测或浏览器 E2E 覆盖。
- 未发现上述路径中其他可复现的行为回归。

## 结论

**不批准当前变更；修复 P2 并补充反向断点焦点测试后再批准。** 本结论来自源码和测试代码审查，未执行测试或浏览器验收。
