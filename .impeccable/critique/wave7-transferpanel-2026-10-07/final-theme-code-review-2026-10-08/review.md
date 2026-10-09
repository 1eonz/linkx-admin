# Wave 7 LxTransferPanel 暗色主题代码复审

- 审查基准：当前 `HEAD`，`76d620e6baf02297f0d02422e9cc6c512a6880e9`。
- 审查范围：`custom.css` 中 LxTransferPanel 文档示例暗色令牌映射，以及 E2E 新增的暗色回归。
- 方法：只读静态审查并核对 VitePress 暗色变量定义；未运行测试，未读取 Impeccable Assessment A/B 报告或证据，未改产品代码。
- 结论：**Approved**。未发现 P0、P1 或 P2 问题；有一项 P3 测试覆盖建议。

## Findings

### P3：暗色回归未直接检查面板状态文字，也未覆盖 HUD 与文档暗色并用

位置：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:85`、`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:99`

暗色用例读取了实际 settings/panel 背景，并通过 `getComputedStyle` 计算设置摘要和 demo 说明文字的对比度；这些断言测到浏览器计算后的颜色。它没有在文档暗色模式下调用已有的 `selectedStatusContrast`，也没有切换 HUD 后确认 HUD 令牌优先，因此状态色映射或 HUD 排除规则后续回归时未必会失败。建议在暗色用例中断言选中行状态文字的最小对比度，并另测一次文档暗色下启用 HUD 的组合。

这是覆盖建议，不是当前颜色问题。当前暗色选择行使用 VitePress `--vp-c-bg-soft: #202127`；已映射的文字色对比度均达到 4.5:1：`--vp-c-text-2: #98989f` 为 5.60:1，成功 `#86efac` 为 11.43:1，警告 `#f6c76b` 为 10.17:1，错误 `#f78989` 为 6.80:1。主按钮文字使用 `--vp-c-bg: #1b1b1f`，按钮底色为暗色主题品牌色 `#a8b1ff`，对比度也满足 AA。

## 核验结论

暗色映射限定在 `.dark .vp-doc .transfer-panel-demo:not(.lx-theme-hud)`，不会匹配带 `lx-theme-hud` 的示例根节点；范围同时受 `.dark` 与 `.vp-doc` 限制，不会改写站点其它区域。选择器优先级足以覆盖默认 `:root` 令牌，且 HUD 令牌规则不会与其竞争。测试的背景与文本对比度断言读取真实计算样式；其局限是没有直接覆盖面板状态文字和暗色文档中的 HUD 组合。当前实现没有新的 P0–P2 阻断项。

## 源码 SHA-256

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/docs/.vitepress/theme/custom.css` | `C1918DF03648C6414B283638C940D61FB658D0A9FDDFBCE6420C942671F3430D` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `D97940ABEA1717468EC942A4E625CC90B4E6F065C8D32A7D3AF13D4167DDA16B` |
