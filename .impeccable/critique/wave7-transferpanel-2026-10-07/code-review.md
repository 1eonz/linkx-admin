# Wave 7 LxTransferPanel 代码审查

审查日期：2026-10-07

审查范围：`linkx-fe/src/components/LxTransferPanel/`、`linkx-fe/docs/components/lxtransferpanel.md`、`other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts`、`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts`，以及本波迁移记录。

审查方式：对照 `HEAD` 差异、邻近 `LxVirtualTree` API、设计稿 `design/虚拟滚动树 + 双栏穿梭/code.html`，并运行定向类型检查、构建、单测和文档 E2E。未修改产品代码、测试代码或文档。

## 结论

**暂不批准。** 未发现 P0/P1；发现 3 项 P2 和 3 项 P3。组件库类型检查、构建、文档构建、定向单测和 E2E 均通过，但通过的测试没有覆盖下面的状态文案筛选、真实 5:2:5 列宽和左侧筛选转发，因此不能据此确认 Wave 7 契约完全闭环。

## 发现

### P2-1 右侧筛选不能匹配实际展示的状态文案

- 文件/行号：`linkx-fe/src/components/LxTransferPanel/index.vue:117-125`、`62-68`、`233-235`；文档契约：`linkx-fe/docs/components/lxtransferpanel.md:24,56`。
- 证据：列表展示通过 `statusLabelOf()` 把 `online` 渲染成“正常”、`processing` 渲染成“处理中”；但 `visibleSelectedNodes` 只把 `node.status` 原始值（例如 `online`）加入匹配集合，没有加入 `statusLabelOf(node)`。用户在右侧输入文档承诺的可见状态“正常”时，`online` 节点会被过滤掉；只有输入内部值 `online` 才能命中。
- 修复建议：右侧筛选候选值同时包含 `node.label`、`node.code`、原始 `node.status` 和 `statusLabelOf(node)`，保持大小写及空白处理一致；补充单测和 E2E，分别用“正常”“处理中”检索。

### P2-2 移动端头部操作按钮被降为 32px 点按高度

- 文件/行号：`linkx-fe/src/components/LxTransferPanel/index.vue:812-820`。
- 证据：`HEAD` 中移动断点的“全选”“反选”“清空”最小高度为 `44px`，本波改成了 `32px`。同一组件仍把中间批量按钮和右侧删除按钮设为 `44px`（`827-839`）；现有 E2E 只检查这两类按钮（`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:61-71`），所以头部操作回归不会失败。窄屏下这些按钮仍是用户需要触摸的操作入口，且与本波移动触控契约不一致。
- 修复建议：恢复移动端头部操作与清空按钮的 `min-height: 44px`，必要时调整 header 行高/内边距以避免溢出；在 E2E 中逐个断言“全选”“反选”“清空”的实际 `boundingBox()` 高度。

### P2-3 新增源筛选使用了交互元素嵌套的 `label`

- 文件/行号：`linkx-fe/src/components/LxTransferPanel/index.vue:270-288`。
- 证据：源筛选把 `input` 和条件渲染的清除 `button` 同时放在 `<label>` 内。HTML 标签的内容模型不允许在 label 中嵌套另一个交互控件；键盘/读屏器可能把清除按钮激活与 label 的聚焦行为合并，且无法形成清晰的“输入框标签 + 独立清除操作”结构。该源筛选是本波新增代码；`LxVirtualTree` 内部已有同样的历史结构，应另列遗留问题处理。
- 修复建议：改为带明确文本或 `aria-label` 的独立容器，给输入使用 `id` 与 `label[for]`，把清除按钮作为同级元素保留独立焦点；补充 Tab 顺序、Enter/Space 清除和焦点回到输入框的浏览器断言。

### P3-1 桌面 5:2:5 E2E 只验证标记，不验证真实列宽

- 文件/行号：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:7-13`；实现：`linkx-fe/src/components/LxTransferPanel/index.vue:435-440`。
- 证据：E2E 只断言 `data-lx-transfer-layout="5:2:5"`，该属性即使 CSS 改坏也不会变化；它没有读取三个 grid track 的实际 `getBoundingClientRect()` 宽度，也没有检查中间列及两侧列的比例。当前 CSS 通过 `minmax(72px, 2fr)` 还存在容器很窄时触发最小宽度、比例偏离的边界。
- 修复建议：在桌面视口读取左右面板和控制槽宽度，按容器扣除 gap 后允许小数误差验证 5:2:5；另加一个窄容器（视口仍为桌面宽度）的用例，明确最小宽度策略是允许比例退化还是切换单列。

### P3-2 左侧筛选转发没有被单测真正覆盖

- 文件/行号：实现 `linkx-fe/src/components/LxTransferPanel/index.vue:205-208`；测试 stub `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts:40-60`，断言 `146-159`。
- 证据：`TreeStub` 没有公开 `filter()`，因此 `applySourceFilter()` 的 `typeof tree.filter === 'function'` 分支永远不执行；新增单测只验证 placeholder 和 DOM 存在，没有输入源关键词后验证树收到过滤调用。E2E 也只验证内置 `.lx-virtual-tree__filter` 不存在（`15-17`），未验证源筛选结果变化。
- 修复建议：让 stub 公开可观测的 `filter(value)` 并用 spy 断言初始空值、输入值和清空值；文档 E2E 输入一个唯一节点名，断言树行/空态随筛选变化。

### P3-3 reduced-motion 断言目前会被全局令牌“兜底”而失去回归能力

- 文件/行号：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:83-85`；组件局部规则：`linkx-fe/src/components/LxTransferPanel/index.vue:842-847`。
- 证据：组件自身没有声明需要过渡的属性，局部 `transition: none` 当前没有可观察对象；文档全局 `variables.css` 在 `prefers-reduced-motion` 下对所有元素强制 `transition-duration: 0.01ms !important`。因此即使删除或误配组件局部规则，现有断言仍可能通过，不能证明本组件的动效降级实现。
- 修复建议：若组件需要过渡，给正常模式声明明确的过渡并在 reduced-motion 下断言其关闭；若组件刻意无过渡，删除无效局部规则，并把测试改为验证不会引入动画/过渡的 computed style，同时保留全局令牌作为整体兜底证据。

## 对照项与残余风险

- `5:2:5` grid、`border-box` 面板高度、左右筛选输入、`code/status/statusTone` 渲染、树外既有键/禁用键保留、`maxCount` 原子拒绝、清空事件和键盘焦点样式均能在源码或通过的定向用例中找到对应实现。
- 右侧列表 `:key="String(node.id)"`（`index.vue:374-375`）在数字键 `1` 与字符串键 `"1"` 同时存在时会发生 Vue key 碰撞；该代码在 `HEAD` 已存在，本次 Wave 7 未引入，列为遗留风险，不计入本波发现。
- `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md` 在工作区状态中显示修改，但没有本次差异；未将其归因于 Wave 7。`MIGRATION-BACKLOG.md` 的本波记录与组件文档契约一致。
- 组件没有网络 API 调用，`.then().catch().finally()` 风格不适用；Demo 只处理本地状态，未虚构生产接口。

## 实际验证

- `linkx-fe`: `pnpm typecheck` 通过。
- `linkx-fe`: `pnpm build` 通过。
- `linkx-fe`: `pnpm build:docs` 通过。
- `other-admin/admin-vue3`: `pnpm exec vue-tsc --noEmit` 通过。
- 定向单测：`pnpm exec vitest run tests/unit/lx-transfer-panel.test.ts --config vitest.config.ts`，6/6 通过。
- 定向文档 E2E：`pnpm exec playwright test tests/e2e/lx-transfer-panel-docs.spec.ts --config playwright.lxui.config.ts`，4/4 通过。
- 目标文件 Prettier 校验通过（库目录无独立 Prettier 可执行文件，使用管理端已安装版本）；定向测试文件 ESLint 通过。
- 工作区已有的 `ELEMENT-PLUS-LX-UI-MATRIX.md` Prettier 告警未纳入本波判断；没有执行自动修复或写入产品文件。
