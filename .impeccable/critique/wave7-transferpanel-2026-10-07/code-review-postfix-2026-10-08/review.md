# LxTransferPanel 修复后代码复审

复审日期：2026-10-08  
复审范围：组件、Demo、中文文档、单元测试和文档站 E2E 测试的最终工作区版本。  
复审方式：只读差异与源码审查；本轮未运行测试、构建或浏览器验收。

## 结论

此前 P2 的主题恢复问题已缓解，P3 中列表内部滚动断言已补齐；但主题所有权仍有边界风险，且 320px 文本换行断言没有确定性的长文本输入。未发现明确的 P0/P1 阻断问题，也未发现相邻选择、筛选或清空契约的直接回归。

## 发现

### [P2] 主题恢复仍会在根类值碰巧相同时覆盖站点后续选择

位置：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:158-184`

本次加入 `lastAppliedDark` 与 `lastAppliedHud`，并只在根节点类值仍等于 Demo 最后写入值时恢复挂载快照。这能处理文档站从 HUD 深色切到浅色的情况，新增 E2E 也覆盖了该路径。

不过，类值相等只能判断当前状态，无法判断是谁最后写入。若 Demo 将 `dark` 设为 `true` 后，文档站用户或其它代码将主题改为 `false`，再由另一处状态更新将其设回 `true`，离开页面时 Demo 会把 `true` 当作仍由自己拥有并恢复旧快照。组件仍在直接写共享的 `document.documentElement`，因此全局主题所有权没有完全解决。

建议 Demo 不修改全局主题状态，改用文档站正式主题状态接口，或仅在可隔离的 Demo 根容器上提供主题变量。若保留全局写入，应由宿主提供可观察、可协调的主题状态，而不是通过类值相等推断所有权。新增回归应覆盖主题在 Demo 应用值期间发生外部切换后又回到同值的情况。

### [P3] 320px 换行断言缺少确定会换行的测试文本

位置：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:479-511`

测试现在读取名称文本的 Range 矩形，断言至少一个名称的 `lineCount > 1`，比之前只检查 `white-space: normal` 更有力。但操作仅把短名称“待授权特勤支队”加入列表；这个名称是否超过当前可用宽度取决于页面内容宽度、字体和布局。测试本身没有建立长文本输入，因此覆盖依赖外部文档布局条件，可能在某些环境中无法触发换行。

建议在该 E2E 场景中为已选详情提供一个明确长于窄屏可用宽度的名称，再检查其 Range 行数大于 1，并检查所有名称无水平裁切。这样断言直接覆盖换行能力，而不是寄望短标签在当前页面恰好换行。

## 已修复项与回归核对

- 主题卸载现在检查当前类值是否仍等于 Demo 最后应用值；新增 E2E 从 Demo 开启 HUD、由文档站切换至浅色、导航离开并确认主题保持浅色。原先无条件恢复快照的问题在此常规路径已修复。
- 320px E2E 现在取消选择上限并添加第六个项目，检查真实文本 Range 行数；同时确认列表 `scrollHeight > clientHeight`、`scrollTop > 0`、末项位于列表滚动容器内且页面不横向溢出。内部滚动断言已补齐。
- 只读检查组件模板和相邻单测，确认新增属性仍保留已选列表 `tabindex="0"` 与动态 `aria-label`，全量按钮可访问名称、筛选操作以及未加载节点清空确认相关测试仍在。

## 验证边界

本轮没有运行测试、构建或浏览器验收；上述结论仅基于源码与工作区差异。报告不将新增 E2E 标记为已通过。

## 复审文件 SHA-256

以下哈希对应本次复审读取的最终文件内容：

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `9250D31A3A382A7D252459C671614CDA4CA681FE0DA0B3C791D3219D4684A0A1` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `1D268A815C1F85BEF916A16731368ED7F1FA9542CFDD862A18D7BC47C3B57272` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C13B6CF97C9FAB39E62CCC82D4CF3B9C71BAEC751D1C3EB4F968C1D33FBB9CC2` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `72F38AD3CD6F46E0B5E315A1698BA969C5964D9B0E4DEA9F5A99AD98AC47F823` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `637E3E6076A8DF2BA95C1E8D0245E52F9335D1B51CACF4C53E6ABB71482C1FCB` |
