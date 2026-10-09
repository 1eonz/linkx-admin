# Wave 7 LxTransferPanel 当前实现代码复审

复审日期：2026-10-08  
范围：`linkx-fe/src/components/LxTransferPanel/index.vue`、`types.ts`、`demo/basic.vue`、组件文档、库导出及指定 unit/E2E 测试。对照 `LxVirtualTree` 与 `lxConfirm` 当前 API，并查看 `design/虚拟滚动树 + 双栏穿梭/screen.png`。

结论：未发现 P0 或 P1 问题；发现 2 项 P2 和 1 项 P3。没有修改源码。

## Findings

### [P2] 同值 `modelValue` 更新会误拒用户已确认的操作

位置：`linkx-fe/src/components/LxTransferPanel/index.vue:127`、`linkx-fe/src/components/LxTransferPanel/index.vue:434`

确认版本计数在每次深度 watcher 回调中递增，没有比较新旧键序列是否实际变化。宿主若以会返回新数组的绑定表达式提供 `modelValue`，在确认框打开期间因数据刷新或其他页面状态重算而传入相同键的新数组，`selectionRevision` 仍会变化；用户按确认后，`selectionMatchesSnapshot` 因版本不同拒绝清空/移除，并提示“已选授权在确认期间发生变化”。此时键和值顺序均未变，用户的确认被无效丢弃。

建议只在键序列发生语义变化时推进版本，同时保留对确认期间真实变更后恢复的检测；增加“确认期间以新数组引用传入相同键”用例。

### [P2] 确认移除后焦点没有回到已选列表

位置：`linkx-fe/src/components/LxTransferPanel/index.vue:473`、`linkx-fe/src/components/LxTransferPanel/index.vue:479`

未加载节点通过 `lxConfirm` 确认后会更新受控键并卸载对应列表行。若用户通过键盘激活该行的移除按钮，按钮随行移除后代码没有把焦点移到相邻移除按钮或列表；浏览器会将焦点退回文档，用户无法从当前位置继续键盘处理已选项。新增测试覆盖了确认结果和受控值，但没有验证确认后的焦点位置。

建议删除成功后把焦点移动到下一行（若为末行则上一行）；列表清空时聚焦可用的稳定控件，并用 E2E 覆盖键盘确认路径。

### [P3] `clear-all` 文档把条件确认描述成无条件确认

位置：`linkx-fe/docs/components/lxtransferpanel.md:41`、`linkx-fe/src/components/LxTransferPanel/index.vue:421`

事件表称 `clear-all` 在“用户确认后”发出，但实现仅当已选列表含未加载节点时调用确认框；所有已选节点都在当前树中时，点击“全部移除”会立即清空并发出事件。文档后文已说明未加载项需要确认，因此事件表表述与后文及实际契约不一致，可能让宿主误以为所有清空操作都有组件级二次确认。

建议在事件表明确写成“清空完成后发出；包含未加载项时经组件确认”。

## 覆盖与剩余风险

单测覆盖筛选批量操作、选择上限、树外键保留、未加载详情回显、确认取消及键变化、状态键边界和多个实例的 ID；E2E 覆盖桌面 5:2:5、1,420 节点虚拟树、375px/320px 布局、加载/错误/空结果、主题、对比度及滚动提示。主要缺口是同值新数组造成的确认误拒，以及删除后的焦点管理。

本次没有运行 unit/E2E 或浏览器验收；因此实际浏览器中的确认焦点与窄屏渲染仍未由本次复审验证。静态检查通过不替代这些验证。

## 验证证据

- `pnpm exec prettier --check` 覆盖 7 个指定目标文件：通过。
- `pnpm exec eslint` 覆盖指定 Vue/TypeScript 和 unit/E2E 文件：退出码 0；其中 4 个 `linkx-fe` 源文件被 Vue3 应用的 ESLint 配置以“outside of base path”忽略，unit/E2E 文件无 lint 报错。`linkx-fe` 未发现独立 ESLint 配置。
- 在 `linkx-fe` 执行 `pnpm exec vue-tsc --noEmit`：退出码 0。
- 设计对照：`design/虚拟滚动树 + 双栏穿梭/screen.png`。截图展示桌面双栏穿梭和 5:2:5 规格；移动布局以源码和未执行的 E2E 断言检查，未作浏览器视觉验收。
