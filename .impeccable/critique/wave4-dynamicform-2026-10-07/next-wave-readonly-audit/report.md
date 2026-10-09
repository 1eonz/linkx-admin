# Wave 4 下一波组件只读盘点

日期：2026-10-07

## 结论

`doc/PROJECT-FOLLOWUP-BREAKDOWN.md` 将 TreeSelect、Cascader 的实现、Demo、单测和文档 E2E 记为已完成；当前源码和测试文件也确实提供了这些门槛的对应材料。本次只读检查没有重跑测试，因此“已完成”是台账状态和覆盖存在的确认，不是本次运行通过证明。

下一波明确缺口是：TreeSelect 的键盘选择 E2E 和触发器 44px 断言；Cascader Demo 的英文 locale 示例、错误态聚焦样式 E2E；SelectPagination 的组件级行为覆盖。源码层可确认一项行为缺陷：SelectPagination 显式 `disabled=false` 会阻止 `ElForm disabled` 传到内部选择器和请求守卫。SelectPagination 显式传 `disabled` 时已有请求拦截、禁用时作废迟到响应，以及追加页失败回退页码的实现，但这些目标行为尚无对应测试。

## 门槛现状

| 组件 | 已有材料/覆盖 | 仍需验证 |
| --- | --- | --- |
| TreeSelect | 计划台账记录实现、Demo、单测、文档 E2E 完成。现有 E2E 覆盖单/多选、空/加载/错误与重试、英文 footer、HUD、375px、减少动效；单测覆盖值契约、表单错误关联及 locale 变化。 | E2E 没有 `ArrowUp` / `ArrowDown` / `Enter` 选择路径，也没有测触发器本身的 44px 高度。现有 44px 断言测的是树节点行。属于可观察覆盖缺口，当前代码把键盘行为交给 Element Plus，未发现本地键盘处理缺陷。 |
| Cascader | 计划台账记录实现、Demo、单测、文档 E2E 完成。E2E 已覆盖方向键、Enter、Escape、错误恢复、减少动效、375px 节点行和重试按钮尺寸；单测覆盖英文反馈 locale。 | Demo 没有英文 locale 切换；E2E 没有在错误状态聚焦触发器并检查焦点样式。当前 CSS 已设置错误焦点内侧 1px 边线和窄屏触发器 44px，E2E 现有 44px 断言针对节点行与重试按钮，未直接量触发器。以上是 Demo/E2E 覆盖缺口，未从源码确认实现缺陷。 |
| LxSelectPagination | Demo 和中文文档提供远程 Mock、跨页回显、取消、空、失败重试和禁用操作。现有 3 个文档 E2E 覆盖跨页回显、首请求失败重试/空结果、375px 搜索/取消/Escape 和继续加载按钮 44px。源码有显式禁用请求守卫、请求代次隔离、AbortController、追加页失败后页码回退及重试入口。 | 没有组件级 Vitest；现有 E2E 未断言禁用时不发请求、禁用后忽略迟到响应、追加页失败后重试相同页。Form disabled 继承是代码缺陷，详见下文。 |

## 逐项证据与最小后续范围

### TreeSelect

- 计划状态与下一步：`doc/PROJECT-FOLLOWUP-BREAKDOWN.md:21-24,43-44,157-160`。Wave 4 前的盘点要求键盘 E2E 和当前触屏触发器 44px；总览则将实现、Demo、单测、文档 E2E 记为完成。
- 键盘契约：`linkx-fe/docs/components/lxtreeselect.md:66` 声明方向键移动、Enter 选择、Escape 收起；`linkx-fe/src/components/LxTreeSelect/index.vue` 将未声明属性传给 Element Plus 内核，没有自有键盘拦截逻辑。现有 `other-admin/admin-vue3/tests/e2e/lx-tree-select-docs.spec.ts` 有 Escape，但没有方向键或 Enter。
- 移动目标：当前 `linkx-fe/src/components/LxTreeSelect/style.css:19-22` 将触屏/窄屏触发器 `min-height` 设为 44px。E2E `other-admin/admin-vue3/tests/e2e/lx-tree-select-docs.spec.ts:103-132` 只断言弹层树行至少 44px，不断言 `.el-select__wrapper`。
- 最小建议：在现有文档 E2E 中增加一条实际 Arrow/Enter 选择并断言回显的路径；在 375px 断言触发器 wrapper 高度至少 44px。若断言失败再修源码；静态文档已声称该键盘契约，不能以缺测试直接判为代码缺陷。

### Cascader

- 计划状态与 Wave 4 要求：`doc/PROJECT-FOLLOWUP-BREAKDOWN.md:43-44,157-160`。计划列出英文 locale、移动触控和错误焦点复验。
- 键盘与触屏现状：`other-admin/admin-vue3/tests/e2e/lx-cascader-docs.spec.ts:12-29` 覆盖方向键和 Enter；`:32-86` 覆盖 Escape、失败反馈与恢复；`:100-138` 检查 375px、节点行 44px 和重试按钮 44px。`linkx-fe/src/components/LxCascader/style.css:44-47,134-144` 另有错误焦点 1px inset 与窄屏触发器/节点 44px 规则，但 E2E 未直接断言触发器尺寸或错误焦点样式。
- 英文 locale：`other-admin/admin-vue3/tests/unit/lx-cascader.test.ts:351-379` 覆盖组件 locale 与继承 locale；`linkx-fe/docs/components/lxcascader.md:51,91` 说明 locale 契约。当前 `linkx-fe/src/components/LxCascader/demo/basic.vue:1-8,81-101` 未导入/传入 locale，也没有英文切换控件，文档 Demo 不可观察英文状态。
- 最小建议：Demo 增加英文 locale 切换并绑定 `locale`；E2E 切换后检查失败和重试英文文案。另在已有失败态 E2E 聚焦 input，断言 `.el-input__wrapper` 的计算焦点阴影仍是错误色的内侧 1px；保留已有节点行与重试按钮 44px 断言，按门槛需要再补触发器 44px 断言。

### LxSelectPagination

- 现有入口与覆盖：`linkx-fe/src/components/LxSelectPagination/demo/basic.vue:48-63,145-183` 使用本地异步 Mock 并显示请求/取消计数，提供失败、空、禁用操作。`other-admin/admin-vue3/tests/e2e/lx-select-pagination-docs.spec.ts:7-30,32-46,48-84` 覆盖跨页回显、首请求失败重试、空结果、取消竞态、375px 和 Escape。`other-admin/admin-vue3/tests/unit/` 当前无 SelectPagination 对应测试文件。
- 显式 disabled 和迟到响应：`linkx-fe/src/components/LxSelectPagination/index.vue:234-239` 在请求入口检查 `props.disabled`；`:272-293` 以请求代次隔离写入；`:328-337` 禁用时清理定时器、增加请求代次并 abort；`:407-418` 阻止禁用状态绑定滚动或打开时加载。因此显式 prop 路径已有实现，但 E2E 未验证请求计数或无法取消的迟到 Promise 不回写。
- 可确认缺陷（Form disabled）：`:42` 将 `disabled` 默认成 `false`，`:453-465` 又把该值显式传给 `LxSelect`。`LxSelect` 的 `disabled` 默认保持 `undefined`，供 Element Plus 从表单上下文继承（`linkx-fe/src/components/LxSelect/index.vue:43-58,104-120`）；Pagination 的显式 `false` 会覆盖该继承，且自身请求守卫只看 `props.disabled`。所以仅将外层 `ElForm` 设为 disabled 时，触发器/搜索框和请求入口仍按启用状态工作。最小修复方向是让 Pagination 的缺省值保持 `undefined`，用 `useFormDisabled` 得到统一的有效禁用态，并将该值用于选择器、搜索、分页按钮及所有请求入口/禁用监听。
- 追加页失败/重试：`:283-293` 在追加失败时回退页码并展示错误；`:340-344` 重新追加下一页；`:433-436` 在已有结果时通过 `loadMore()` 重试。逻辑上路径已实现，现有 E2E 只测第一页失败 (`lx-select-pagination-docs.spec.ts:32-46`)，不是分页失败。最小测试应令第 2 页首次拒绝、检查错误可见，再触发重试并观察请求页序列为 1、2、2 及第 2 页选项出现。
- 最小行为测试：新增 SelectPagination 组件 Vitest，覆盖 (1) `ElForm disabled` 初始及运行时状态会禁用控件且不发新请求；(2) 在途请求禁用后，即使 API 忽略 abort 并完成也不发 `load`、不写入选项；(3) 追加页失败后重试仍请求相同页。Demo 可继续作为手动可观察状态入口，但不替代这三项断言。

## 核验边界

本报告依据当前源码、中文文档、Demo 和测试定义静态盘点；没有执行 Vitest、Playwright 或 detector。当前工作区中 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md` 与 `linkx-fe/src/components/LxTreeSelect/style.css` 已有未提交改动，报告按读取时的工作区内容记录。
