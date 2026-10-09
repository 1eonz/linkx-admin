# LxDynamicForm 下一波只读盘点

盘点日期：2026-10-06  
范围：当前 `linkx-fe/src/components/LxDynamicForm/` 实现、Vue3 单测/文档 E2E、Demo/中文文档、项目交接与后续计划。未修改产品源码和测试，也未运行安装、构建或测试命令。本文中的“缺口”指缺少 DynamicForm 层可复查的集成证据；不会把已有的基础控件能力误报为组件缺陷。

## 结论

DynamicForm 的字段分发、受控值、字段反馈、容器查询布局、日期范围映射和上传 adapter 接线已有实现。现有单测覆盖默认值、规则合并、feedback ARIA、重置和受控事件；文档 E2E 覆盖远程反馈状态、上传成功、必填错误/首错焦点和 375px。交接列出的主要能力仍有集成验收缺口：密码校验示例、真实取消/旧响应竞态、`daterange` 值往返、DynamicForm 上传失败恢复、320/768px 与窄容器，以及校验错误的 ARIA 状态都没有完整回归证据。

| 项目 | 当前实现/证据 | 尚未证明的边界 | 判断 |
| --- | --- | --- | --- |
| `password` | schema 类型和字段映射存在；子字段强制 `type="password"`，避免 schema props 覆盖遮罩。[types.ts:4](../../../linkx-fe/src/components/LxDynamicForm/types.ts#L4) [index.vue:70](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L70) [LxDynamicFieldInput.vue:10](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldInput.vue#L10) | Demo 字段和 DynamicForm 单测没有密码字段。密码字段由 `LxInput` 承载；没有真实 `LxForm/LxFormItem` 校验失败示例，也没有该字段的错误文案、首错焦点及 ARIA 集成检查。 | **缺口仍在**。项目计划明确要求把密码校验错误放在真实 Form/DynamicForm 宿主组合中。[PROJECT-FOLLOWUP-BREAKDOWN.md:11](../../../doc/PROJECT-FOLLOWUP-BREAKDOWN.md#L11) |
| `remote-select` 竞态/取消 | 组件把 schema props/options 交给公开 `LxSelect`；Demo 有递增请求序号、旧结果忽略、清理旧定时器及 loading/empty/error/retry 状态。[LxDynamicFieldSelect.vue:15](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldSelect.vue#L15) [basic.vue:48](../../../linkx-fe/src/components/LxDynamicForm/demo/basic.vue#L48) [lxdynamicform.md:75](../../../linkx-fe/docs/components/lxdynamicform.md#L75) | Demo 没有 `AbortController`/`AbortSignal` 或可观察的取消路径；清理定时器使旧 Mock Promise 不再 settle。E2E 只切换状态并观察 feedback，没有延迟请求 A/B 乱序、取消后释放状态、重置/关闭/卸载时不回写的检查。组件库把查询取消和请求归属交给宿主，故这里是宿主适配示例/验收缺口，不足以认定组件本身有竞态 bug。 | **高优先级契约验收缺口**。规范要求宿主实现取消与旧请求丢弃。[DYNAMIC-FORM-SPEC.md:35](../../../other-admin/admin-vue3/docs/DYNAMIC-FORM-SPEC.md#L35) |
| `daterange` | `LxDynamicFieldDate` 按 schema 类型传递 `daterange`，并允许日期数组模型值。[LxDynamicFieldDate.vue:15](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDate.vue#L15) | Demo 没有区间字段；DynamicForm 单测没有 `daterange` 输入类型、起止值、清空或事件回传测试。现有日期 feedback 隔离测试只覆盖两个单值字段。[lx-dynamic-form.test.ts:229](../../../other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts#L229) | **中优先级行为回归缺口**。DatePicker 自身的区间测试不能代替 DynamicForm schema 适配验收。 |
| 上传失败/重试/取消/移除 | DynamicForm 上传字段将 props、`multiple`、标准化文件列表与变更回传接到 `LxUpload`。[LxDynamicFieldUpload.vue:11](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue#L11) [LxDynamicFieldUpload.vue:42](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue#L42) LxUpload 自身已有失败重试、批次取消、移除等单测/E2E。[lx-upload.test.ts:84](../../../other-admin/admin-vue3/tests/unit/lx-upload.test.ts#L84) [lx-upload-docs.spec.ts:42](../../../other-admin/admin-vue3/tests/e2e/lx-upload-docs.spec.ts#L42) | DynamicForm Demo adapter 只报告成功；DynamicForm 单测没有经字段适配层验证失败后重试、取消、移除后单/多值更新。文档虽列出完整能力，但只是依赖 LxUpload 的声明。[basic.vue:99](../../../linkx-fe/src/components/LxDynamicForm/demo/basic.vue#L99) [lxdynamicform.md:75](../../../linkx-fe/docs/components/lxdynamicform.md#L75) | **中优先级集成缺口**。基础上传功能已有证据，需证明 DynamicForm 转接契约。 |
| 320/768px 与窄容器 | CSS container query 按容器 `<=760px` 切两列、`<=520px` 切单列；E2E 验证文档页宽 375px 时无根横向溢出并为单列。[style.css:1](../../../linkx-fe/src/components/LxDynamicForm/style.css#L1) [style.css:67](../../../linkx-fe/src/components/LxDynamicForm/style.css#L67) [lx-dynamic-form-docs.spec.ts:74](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L74) | 没有 320px/768px 视口检查，也没有独立窄容器尺寸测试或 3/2/1 列断点矩阵；E2E 初始布局只断言当前文档容器为两列。[lx-dynamic-form-docs.spec.ts:11](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L11) | **中优先级浏览器覆盖缺口**。项目波次计划明确要求 320/375/768px 与窄容器证据。[PROJECT-FOLLOWUP-BREAKDOWN.md:137](../../../doc/PROJECT-FOLLOWUP-BREAKDOWN.md#L137) |
| 表单校验/ARIA | required 规则、全表 validate、失败后滚动/聚焦首错已实现；feedback 的 role、稳定 ID 和控件 `aria-describedby` 已有多控件单测。[index.vue:163](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L163) [index.vue:269](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L269) [lx-dynamic-form.test.ts:60](../../../other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts#L60) [lx-dynamic-form.test.ts:123](../../../other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts#L123) | `LxFormItem` 有校验后维护 `aria-required`、`aria-invalid`、错误描述关联的实现，但 DynamicForm 测试只断言 `validate() === false`/错误文案/焦点；E2E 没检查错误控件的 `aria-invalid` 与 `aria-describedby` 是否指向实际错误消息，也没验证校验清除后属性恢复。[LxFormItem.vue:58](../../../linkx-fe/src/components/LxForm/LxFormItem.vue#L58) [lx-dynamic-form-docs.spec.ts:58](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L58) | **缺少校验错误的 ARIA 集成断言**。注意 feedback ARIA 已验证，不能把两类描述关系混为一谈。 |

## 按优先级的可执行任务

1. **P1：补远程候选宿主适配的竞态/取消验收。** 用本地 Mock 延迟两个不同关键字请求，令旧请求后返回；确认旧候选不覆盖当前结果。分别在换关键字、清空/重置、关闭或卸载时取消，确认 loading 释放、取消不显示网络失败、取消后不回写；失败后重试成功。请求处理按项目约定用 `.then().catch().finally()`。组件本身继续只呈现宿主给定的 options/loading/feedback。
2. **P1：补真实密码字段校验与 ARIA 示例/回归。** 在 `LxDynamicForm` Demo 加真实 `password` schema 和 required/rules，使用 `LxForm/LxFormItem` 原生校验链；空提交时检查中文错误文案、首错聚焦、控件 `aria-invalid="true"`、`aria-required="true"`，且 `aria-describedby` 含存在的错误 ID。输入有效值再验证错误属性清理。同步文档，不在独立密码输入 Demo 伪造宿主校验。
3. **P2：补 DynamicForm 上传 adapter 集成矩阵。** 对单图/多图分别覆盖成功、失败后重试、取消、移除；断言 adapter 调用、失败信息、取消后的文件状态，以及单图回传首文件/空值、多图回传数组。LxUpload 自身已有的基础行为测试可以复用为依赖证据，但不能替代字段值映射回归。
4. **P2：补 `daterange` schema 回归。** 覆盖 `daterange` 控件类型、字符串区间回显、更新事件回传两个端点、清空回传，以及动态表单校验和反馈关联。日期弹层视觉与边界沿用 DatePicker 专项验收。
5. **P2：补响应式容器验收。** 浏览器检查 320/375/768px 视口及窄于视口的嵌入容器；通过改变表单容器宽度验证 `<=520` 单列、`521-760` 两列、`>760` 三列，检查 `span=24` 通栏、长标签和宽上传列表不撑破容器，并确认 `document.scrollWidth` 无意外增长。记录容器实测宽度，不能仅以 viewport 宽度代表 container query 输入。
6. **P2：完成当前版正式 Critique 与复审。** Wave 3 计划要求当前版独立 A/B、源码 detector 的 JSON/stderr/退出码、不同主题/状态/宽度的浏览器 overlay 与截图、综合报告及 snapshot/trend；逐条归因 detector 命中。10 月 4 日 B 报告确有当前版本浏览器/overlay 证据，但 10 月 3 日 A 与之后改动不是同一轮当前版双评；计划本身也仍把正式收口列为未完成。[assessment-b-report.md:5](../wave0-dynamicform-2026-10-04/assessment-b-current-2026-10-04/assessment-b-report.md#L5) [PROJECT-FOLLOWUP-BREAKDOWN.md:28](../../../doc/PROJECT-FOLLOWUP-BREAKDOWN.md#L28)

## 建议验证门槛

- **行为测试**：`lx-dynamic-form.test.ts` 覆盖密码错误 ARIA、`daterange` 值往返和上传单/多图值映射；远程请求竞态测试落在宿主适配/demo 测试层，因为取消责任属于宿主。保留 LxUpload 当前自身测试作为上传状态机证据。
- **Mock E2E**：DynamicForm 文档 E2E 覆盖远程乱序与取消、失败重试、密码首错与 ARIA、daterange 起止值、上传失败/重试/取消/移除；拦截所有后端请求，确认没有外部网络请求。
- **响应式与主题**：至少桌面、320、375、768 视口；另测 320/520/760/768 附近的表单容器宽度；亮色、HUD 深色、减少动效至少包含空态、错误和上传中/失败视图。记录 viewport、container、列数、根滚动宽度和截图。
- **工程门禁**：按仓库规则对修改文件运行 Prettier、无自动修复 ESLint；运行 Vue3 类型检查、lx-ui 类型检查、DynamicForm/LxForm/LxUpload 相关单测、文档 Playwright、lx-ui 构建和文档构建。将环境入口失败与代码失败分开记载。
- **审查收口**：独立代码复审确认没有在组件库引入业务 API/请求，也没有把宿主 API 链改成 `async/await`；Impeccable A/B 分开评估并使用当前同一版本证据。Detector `[]` 仅代表静态零命中，不单独作为通过结论。

## 主要证据索引

- 计划和验收要求：`doc/PROJECT-FOLLOWUP-BREAKDOWN.md:11,137`；交接入口：`doc/PROJECT-HANDOFF.md:1881`。
- DynamicForm 字段映射/表单逻辑：`linkx-fe/src/components/LxDynamicForm/index.vue:70,163,269,318`。
- 字段适配：`linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldInput.vue:10`、`LxDynamicFieldDate.vue:15`、`LxDynamicFieldSelect.vue:15`、`LxDynamicFieldUpload.vue:11`。
- Demo 与布局：`linkx-fe/src/components/LxDynamicForm/demo/basic.vue:48,160`、`linkx-fe/src/components/LxDynamicForm/style.css:1,67`。
- 测试：`other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts:6,60,123,229,260,322,422,477,489`；`tests/e2e/lx-dynamic-form-docs.spec.ts:3`。
- 文档：`linkx-fe/docs/components/lxdynamicform.md:43,75,90,113,124,132`；规范：`other-admin/admin-vue3/docs/DYNAMIC-FORM-SPEC.md:24,35`。
- 先前评审：`.impeccable/critique/dynamicform-feedback-2026-10-03/assessment-a.md:5`；当前 B 取证：`.impeccable/critique/wave0-dynamicform-2026-10-04/assessment-b-current-2026-10-04/assessment-b-report.md:17`。
