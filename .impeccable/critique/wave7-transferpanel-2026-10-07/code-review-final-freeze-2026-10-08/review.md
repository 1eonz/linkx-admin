# Wave 7 LxTransferPanel 冻结版独立代码复审

## 范围与来源

复审当前工作区中的 `linkx-fe/src/index.ts`、LxTransferPanel 组件与类型、Demo、中文文档、Vue3 宿主中的 unit/E2E 测试，以及设计参考 `design/虚拟滚动树 + 双栏穿梭/`。组件库源码以 `linkx-fe/` 为准；宿主 `other-admin/admin-vue3/node_modules/lx-ui` 是指向该目录的 junction。工作区为 `main` 分支上的冻结工作副本，HEAD 为 `76d620e`，存在大量与本复审无关的既存改动；本次未修改产品代码，也未读取 Impeccable Assessment A/B 报告。

复审覆盖冻结前最后一项语义变化：`setSelectedRemoveButton` 的 ref 参数由具体 DOM/ref 类型改为 `unknown`，以适配库与宿主所安装 Vue 类型版本的差异。当前库解析 Vue `3.5.43`，宿主解析 Vue `3.5.39`。实现仍通过 `instanceof HTMLButtonElement` 收窄后存入按钮 Map；ref 回调收到非按钮值（包括卸载时的 `null`）时删除对应条目。该变化没有改变用户可见行为或 UI。

## 结论

没有发现 P0、P1、P2 或 P3 问题。当前冻结版的公开类型、键盘焦点恢复、移动端面板切换及测试契约一致；本次所获定向测试和构建结果均通过。

## 复核要点

- 按钮 ref Map 只保存真实 `HTMLButtonElement`，并在 ref 解绑时清除条目。删除已选项时先记录当前筛选视图中的下一项，若不存在则选上一项；模型更新后的下一帧将焦点移到该项的删除按钮，目标暂不可用时回退到可聚焦列表。单项移除、未加载项确认后的移除及列表最后一项回退均有 E2E 行为断言。
- `modelValue` 仍是选择状态事实来源。未加载项通过 `selectedItems` 回显；清空或移除未加载项需要确认，并在确认期间检测选择快照是否变化，避免旧确认结果覆盖新状态。
- 移动端 source/selected 面板切换由互斥按钮控制，保留 `aria-pressed` 状态；窄屏测试覆盖键盘切换、触控目标、长文本换行、滚动列表和页面横向溢出。
- 可选节点与禁用节点、最大选择数、筛选范围批量操作及树外既有选择的处理均沿当前类型与实现契约执行；未发现状态映射、筛选批量范围或焦点恢复方面的确认缺陷。

## 验证

以下结果由主 Agent 在当前冻结版上运行并回报，本复审未重复启动相同测试：

- `pnpm exec playwright test --config playwright.lxui.config.ts tests/e2e/lx-transfer-panel-docs.spec.ts`：10/10 通过。
- `pnpm exec vitest run tests/unit/lx-transfer-panel.test.ts`：21/21 通过。
- 宿主 `vue-tsc --noEmit`、lx-ui `pnpm typecheck` 通过；lx-ui `pnpm build` 通过，共 203 modules。
- 目标 ESLint、Prettier 与 `git diff --check` 通过。

## 冻结文件 SHA-256

以下哈希在写入本报告前从当前工作区计算，覆盖本次复审引用的源码、契约、测试和设计参考。

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/index.ts` | `57E7A5854369B38C9AC68045FF8F1C78038218561517516BE0A7EB39BBC3229B` |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `1E726F334A02924D1BE0C2D30450DD8D8592A92310769D49E41B92F174FF0D87` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `AD19C9CDDCD7EF7BDCC03D1A0F440D1773219163DAA9E20F1BE4B7896443DA8F` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `4EBBAEB913DB982CB86ADCFBA34905AEDE6B6A8397E4E5700D58D68AFD54BF39` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `4559A8D8A2C5DFBC54B80579683D08B864685A6C66A4CA5059F52BD8C5C01221` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `697A961276F54D894AD9EC9F4F867FD8C7C99A6126BC8FC3F654471BB13A7078` |
| `design/虚拟滚动树 + 双栏穿梭/code.html` | `D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA` |
| `design/虚拟滚动树 + 双栏穿梭/screen.png` | `4BDF7DED1C8D2272F0AFBB7706A2F103B888D3DAF72BF472204C1AA7DB9DE4F5` |
