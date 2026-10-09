# Wave 7 LxTransferPanel 主题所有权修复后复审

复审日期：2026-10-08  
结论：暂不批准，需补足关闭 HUD 的隔离回归断言，并处理一个低概率的观察器记录丢失边界。仅复读当前源码和当前 E2E；未运行测试，也未修改产品文件。

## 发现

### [P2] 关闭 HUD 的 E2E 没有验证外部主题更新后的基线

证据：[`lx-transfer-panel-docs.spec.ts`](F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:122) 在第一段用例将站点切换到深色并导航离开后，直接再次打开组件页；第二段没有先切到浅色，就打开 HUD 并在第 127 行关闭。VitePress 把外观存于 `vitepress-theme-appearance`（当前依赖实现 `linkx-fe/node_modules/vitepress/dist/client/app/data.js:25-28`），同一 Playwright 页面上下文中的第二次 `page.goto` 会沿用第一段选择；因此第二次 Demo 挂载时 `originalDark` 已是 `true`（`basic.vue:179`）。

这使第 128 行的深色断言即使没有吸收 HUD 开启后的浅色、深色两次站点变更也会通过：旧基线本来就是深色。当前用例确实覆盖了从浅色经 HUD、站点浅色、站点深色到卸载的路径（第 104-120 行），但没有在同样的基线差异下单独证明关闭 HUD 会保留用户后来选回的深色。建议第二段在 HUD 开启前先用站点开关切到浅色，再重复 HUD 开启、站点浅色、站点深色、关闭 HUD，并断言关闭前后 `dark` 保持为深色且 `lx-theme-hud` 被清除。

### [P3] 断开观察器会丢弃尚未投递的外部主题变更

证据：[`basic.vue`](F:/work/linkx-admin/linkx-fe/src/components/LxTransferPanel/demo/basic.vue:165) 在每次 Demo 写 class 前直接调用 `MutationObserver.disconnect()`；卸载时也在第 211 行断开。这样 Demo 自己写入的 class 不会污染基线，这是正确的隔离方向；但 `disconnect()` 同时清空尚未投递的 mutation records。若宿主在同一 JS 任务里先改动根节点的主题 class、随后触发 Demo watcher 或卸载，观察器无法把该外部值写入 `originalDark`/`originalHud`，后续恢复仍可能覆盖宿主选择。常规分开的鼠标点击会在下一事件前交付观察器回调，因此风险较窄；当前 E2E 也没有覆盖同任务更新。可在断开前通过 `takeRecords()` 取出并按现有 oldValue 顺序处理待交付记录，再执行 Demo 自身写入/恢复。

## 已核对的主题所有权逻辑

- `onMounted` 先读取根 class 作为初始基线，再注册观察器；`setHudTheme` 在自身 class 写入前断开并在写入后重新观察（`basic.vue:177-205`）。已投递的观察记录只会来自观察器开启期间的外部变化；回调按连续记录的 `oldValue` 重建各次变化后的状态，并仅在 `dark` 或 `lx-theme-hud` 实际变化时更新对应基线（`basic.vue:181-198`）。
- 外部站点更改的 class 与 Demo 最后写入值不同的情况下，卸载会跳过该 class 的回滚；同值回选情况下，观察器更新基线后会保留用户最新值（`basic.vue:212-219`）。这段正常交互路径由第一段 E2E 覆盖。
- 新增 E2E 的导航后检查同时要求保留 `dark` 并移除 Demo 的 `lx-theme-hud`；关闭 HUD 检查要求 `dark` 保持并移除 HUD class（`lx-transfer-panel-docs.spec.ts:116-134`）。其中关闭 HUD 路径因上述初始状态问题不能证明外部变更已被吸收。

## 验证状态

按委托未运行 Playwright、单测、Lint 或构建。复审结论来自当前源文件与 E2E 断言静态检查；未将静态检查描述为测试通过。

## 当前相关源文件 SHA-256

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `B5D719222984DB8D4C4094E946287616BBFCAB6746E8B64C64FD08ADB5E0176F` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `C8DB474CC4220B5883CAE6A376087629C473D37B573752DEF02D201977933306` |
