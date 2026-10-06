# LxDynamicForm 下一波实施前复核

盘点日期：2026-10-06
范围：`linkx-fe/src/components/LxDynamicForm/`、对应中文文档与 Demo、Vue3 单测/E2E、动态表单宿主适配和项目交接。本文为只读审计；未修改产品源码、测试或项目台账，也未运行构建或测试命令。为交付本审计新增此报告。

## 结论

未发现可确认的 P0 缺陷。当前组件已具备 schema 字段渲染器映射、`Lx*` 基础控件、`modelValue` 与 `value`/`change` 双受控入口、容器查询布局，以及单图对象/空值和多图数组的上传值转换。布局阈值和公开事件已写入类型、Demo 与中文文档。

本波仍缺三类关键证据：密码 schema 经过真实 `LxForm/LxFormItem` 校验失败后的错误文案和 ARIA 关联；远程查询取消与乱序响应由宿主适配器实际演示；`daterange` 往返、DynamicForm 上传失败恢复及独立容器宽度断点的回归。另有一项需求解释需在拆文件前定准：目前每种 schema type 都进入字段渲染器映射，但 `input/password`、`select/remote-select`、`date/daterange` 各自共用渲染器文件，不是严格的一种 type 一个文件。

Vue3 业务源码中目前没有 `LxDynamicForm` 引用，因此本波能交付组件库、Demo 和测试证据；任何具体业务接口、服务端上传数据结构或生产表单接入都不能据此宣称已验收。

## 已有能力与证据

| 能力 | 当前情况 | 判断 |
| --- | --- | --- |
| 字段分发与基础控件 | `index.vue` 按 type 映射到 `fields/` 下的字段组件；子组件组合 `LxInput`、`LxSelect`、`LxDatePicker`、`LxUpload` 等公开控件，没有在 DynamicForm 字段层直接导入 Element Plus 控件。[index.vue:70](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L70) [fields](../../../linkx-fe/src/components/LxDynamicForm/fields/) | 已有主体实现；确认是否要求每个 type 独立文件。 |
| 受控值 | `value` 优先于 `modelValue`，字段更新发出完整新对象 `change(nextModel)` 与 `update:modelValue`；单测验证 `value` 模式会发出完整对象。[types.ts:58](../../../linkx-fe/src/components/LxDynamicForm/types.ts#L58) [index.vue:238](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L238) [unit test:489](../../../other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts#L489) | API 已存在；单测尚未把事件结果回灌到受控 props 验证完整父子往返。 |
| 1/2/3 列布局 | CSS container query 以 760px 和 520px 为断点；正式 E2E 检查文档容器两列和 375px 视口单列。[style.css:67](../../../linkx-fe/src/components/LxDynamicForm/style.css#L67) [E2E:24](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L24) [E2E:74](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L74) | 已有实现；缺少独立窄容器及完整断点矩阵证据。 |
| 单图/多图上传 | `LxDynamicFieldUpload` 将单值转换为一项文件列表并回传首项或 `null`，多值回传文件数组；Demo 已含内存 adapter，正式 E2E 验证单图和多图成功。[LxDynamicFieldUpload.vue:15](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue#L15) [Demo:100](../../../linkx-fe/src/components/LxDynamicForm/demo/basic.vue#L100) [E2E:30](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts#L30) | 值映射和成功路径已有；失败、重试、取消、移除未通过 DynamicForm adapter 验收。 |
| 远程选择 | `remote-select` 复用 `LxSelect` 的 `remote-method` attrs 和宿主传入 options/loading/feedback。Demo 有 request 序号保护，但只用 `clearTimeout` 清理 300ms Mock 定时器；没有可观察的请求取消结果。正式 E2E 通过按钮切换状态，没有 A/B 请求乱序或取消断言。[LxDynamicFieldSelect.vue:15](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldSelect.vue#L15) [Demo:60](../../../linkx-fe/src/components/LxDynamicForm/demo/basic.vue#L60) [E2E](../../../other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts) | 组件层按边界只负责展示；宿主适配器的取消和乱序验收缺失。 |
| 密码校验和错误 ARIA | `password` 映射为 `LxInput` 并强制密码 `type`；DynamicForm 使用真实 `LxForm/LxFormItem`，FormItem 对普通 `input` 同步 `aria-required`、`aria-invalid` 和错误描述 ID。[LxDynamicFieldInput.vue:10](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldInput.vue#L10) [LxFormItem.vue:65](../../../linkx-fe/src/components/LxForm/LxFormItem.vue#L65) | FormItem 通用能力已有独立 E2E 证据；DynamicForm 没有 password 字段集成验证。 |
| 日期区间 | `daterange` 被映射到日期 renderer，由 `LxDatePicker` 按 schema type 渲染，字段支持日期数组模型值。[index.vue:79](../../../linkx-fe/src/components/LxDynamicForm/index.vue#L79) [LxDynamicFieldDate.vue:15](../../../linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDate.vue#L15) | picker 自身区间测试不能代替 DynamicForm schema 的回显、更新和清空回归。 |
| Vue3 宿主与 API 链 | 在 `other-admin/admin-vue3/src/`、Vue2 `src/` 搜索不到 `LxDynamicForm` 运行时引用。宿主已有 `AbortSignal` 支持，但没有本组件的 API adapter。[useFetch.ts:77](../../../other-admin/admin-vue3/src/composables/useFetch.ts#L77) [http.ts:59](../../../other-admin/admin-vue3/src/utils/http.ts#L59) | 当前没有需要改写的业务 API 链；未来宿主 adapter 按 `.then().catch().finally()` 和实际 API 取消契约接入。 |

## 分级任务

### P0

无已证实 P0。当前缺口是 wave 验收和行为证据，不足以认定用户数据丢失、权限绕过或生产 API 回归。

### P1

1. **按用户要求完成 schema type 字段文件边界。** 当前 type 映射有效，但三组类型共用文件：`input/password`、`select/remote-select`、`date/daterange`。建议拆为 `fields/LxDynamicFieldPassword.vue`、`fields/LxDynamicFieldRemoteSelect.vue`、`fields/LxDynamicFieldDateRange.vue`，共用受控 props/辅助方法留在 `fields/types.ts`。为每种 type 增加渲染器/值类型断言，确认字段层仍只依赖公开 `Lx*` 控件。此项对应用户明确的“schema type 分文件渲染”，可直接实施，不改变 schema 或事件数据结构。

2. **补真实密码字段校验失败与 ARIA 集成。** 在 `demo/basic.vue` 加 required password schema，由现有 DynamicForm 内部真实 `LxForm/LxFormItem` 处理；同步 `lxdynamicform.md`。在 `lx-dynamic-form.test.ts` 和 `lx-dynamic-form-docs.spec.ts` 验证空值时错误文案、首错焦点、`aria-required="true"`、`aria-invalid="true"`，并断言 `aria-describedby` 包含实际存在的错误 ID；填入有效值后验证错误文案和属性清理。FormItem 现有 E2E 已覆盖通用错误关联，新增断言应落在 DynamicForm/password 组合，不在 PasswordInput 单独 Demo 伪造宿主校验。可以直接实施；若集成断言失败，再按实际控件 DOM 修复 FormItem/字段适配。

3. **把 remote-select 的竞态与取消变成真实可观察流程。** Demo 的 `requestId` 只能证明迟到结果会被忽略；`clearTimeout` 清除本地 Mock 定时器不等于真实请求已取消。增加宿主侧可取消 Mock 适配器，在输入查询 A 后查询 B、让 A 晚于 B 返回，断言 A 不覆盖 B；在新查询、重置及卸载路径取消旧请求，断言取消不显示网络错误、loading 最终释放、取消后不回写，并覆盖失败后重试成功。放在 `demo/basic.vue` 和文档 E2E；DynamicForm 继续只接收 options/loading/feedback，不新增请求依赖或私有取消 API。Mock 与组件 E2E 可直接开始；实际业务接口的 `AbortSignal` 参数及取消错误识别需接入时沿 `useFetch`/HTTP 既有契约确认。

4. **保留正式复审作为 wave 关闭门槛。** 行为和浏览器证据完成后再做当前版本独立代码复审、Impeccable A/B、各目标 detector 的 JSON/stderr/退出码、主题/状态/视口 overlay 与快照趋势。按根 `AGENTS.md` 逐项归因命中；静态 `[]` 不能单独关闭审查。此门槛已在 Wave 3/交接中要求，不需要改公开组件契约。

### P2

1. **补 DynamicForm 上传适配器集成矩阵。** 现有 DynamicForm E2E 验证单图/多图成功，LxUpload 自身已有失败/重试/取消/移除覆盖，但未验证字段层值映射。单测覆盖单图文件对象/路径回显、更新首文件、移除后 `null`；多图数组回显、追加、移除后剩余数组。Demo/E2E 对单图和多图各检查上传失败、重试、取消、移除，观察适配器的 XHR abort 与状态恢复。边界放在 `LxDynamicFieldUpload.vue`、DynamicForm 单测、`basic.vue`、文档 E2E。组件已有 `LxUploadRequestHandler` (`XMLHttpRequest | Promise<unknown>`) 和单图 `LxUploadFile | null` / 多图 `LxUploadFile[]` 行为，可按现有契约直接测；任何业务 URL/后端数据结构转换需等具体宿主 API 契约。

2. **补 `daterange` schema 往返。** 在 `lx-dynamic-form.test.ts` 用字符串区间初始值验证输入回显、日期更新发出完整两端值、清空事件回传空值，并检查 DynamicForm 的字段校验/反馈关联只落在本字段。Demo 可加入紧凑的区间字段，中文 API 说明其模型值沿用 `LxDateModelValue` 和 `value-format`。直接使用现有契约，不另造日期格式。

3. **补真实容器宽度布局矩阵。** 在文档 E2E 建立可控宽度容器，在容器 320/520px、521/760px、761/768px 验证单/双/三列及 `span: 8`、`span: 12`、`span: 24`；另覆盖 320/375/768px 视口和窄容器在宽视口内的组合，确认表单容器宽度没有导致页面根横向溢出。当前 CSS 断点是容器宽度（`<=520` 单列，`<=760` 两列，其余三列），测试应直接读取容器宽度，不以 viewport 代替。只有浏览器证据发现错位时才改 `style.css`。

4. **补父级受控往返。** 当前 React-style 单测检查字段改动会发出 `change` 完整对象，但没有父级接收 `$event` 并更新 `value` 后再次渲染的闭环。增加挂载 harness 验证两次字段编辑、外部替换 `value`、`resetFields()` 回传和 `modelValue`/`update:modelValue` 兼容；同时确认两种 prop 同时传入时文档所述 `value` 优先行为。无契约变更，可直接实施。

5. **同步项目追踪文件。** DynamicForm 公共 schema/props、Demo 或测试变化后，按根规则同步 `doc/PROJECT-MAP.md`、`doc/PROJECT-FOLLOWUP-BREAKDOWN.md`、`doc/PROJECT-HANDOFF.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`DYNAMIC-FORM-SPEC.md`、lx-ui Roadmap/Delivery Check 和 `doc/lx-ui/COMPONENT-AUDIT.md`。报告验证状态分开记录静态对照、单测、Mock E2E、正式视觉审查和真实联调。

## 文件边界建议

| 层 | 建议文件 |
| --- | --- |
| 渲染器/类型 | `linkx-fe/src/components/LxDynamicForm/index.vue`、`types.ts`、`fields/types.ts`、现有及新增 `fields/LxDynamicField*.vue` |
| Demo/样式/API 文档 | `linkx-fe/src/components/LxDynamicForm/demo/basic.vue`、`style.css`（仅在布局复验暴露实现问题时）、`linkx-fe/docs/components/lxdynamicform.md` |
| 行为与浏览器证据 | `other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts`、`tests/e2e/lx-dynamic-form-docs.spec.ts` |
| 未来宿主适配 | 目前没有 DynamicForm 运行时使用方；实际页面按具体业务入口落在宿主页面/专属 `components/`，API 类型集中于 `src/api/`，取消复用 `src/composables/useFetch.ts` 或 `src/utils/http.ts` 已有能力 |
| 台账与验收 | `doc/PROJECT-MAP.md`、`doc/PROJECT-FOLLOWUP-BREAKDOWN.md`、`doc/PROJECT-HANDOFF.md`、`other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`DYNAMIC-FORM-SPEC.md`、lx-ui Roadmap/Delivery Check、`doc/lx-ui/COMPONENT-AUDIT.md` |

## 实施前沿现有契约确认

- `remote-select` 的公开选择控件契约是 `LxSelect` 的 `remote-method` attrs；取消归宿主。Mock 可以直接实现取消；真实请求按 Vue3 HTTP 工具的 `AbortSignal` 入口和现有取消识别处理，不给 lx-ui 引入 Axios 或登录凭据。
- 上传字段目前展示层数据结构是单文件 `LxUploadFile | null`、多文件 `LxUploadFile[]`，并兼容已有 URL 字符串回显。Vue3 中没有 DynamicForm 使用方，故对接生产表单前须从目标页面/接口确认提交时应传 URL、文件 ID 还是其他后端字段；组件 Demo 不臆造服务端数据结构。
- `password` 目前经 `LxInput` 的 `type="password"` 渲染。当前要求只要求宿主校验和 ARIA 展示，不需借机改成另一个公共字段契约；若设计评审要求使用 `LxPasswordInput`，单独核对显隐能力、类型和 FormItem 错误关系。
- `daterange` 复用 `LxDatePicker` 的数组值/`value-format` 能力；回归验证用现有 DatePicker 类型，不更改业务日期协议。
- 新增与实质修改的 Demo 说明、代码注释、交接和审查文字均使用中文；宿主业务 API 调用维持 `.then().catch().finally()`。

## 证据索引

- 波次和规则：`doc/PROJECT-FOLLOWUP-BREAKDOWN.md:13,54-61,137-143`；最近交接 `doc/PROJECT-HANDOFF.md:1869-1881`。
- 当前实现：`linkx-fe/src/components/LxDynamicForm/index.vue:70-80,104-145,238-245,318-361`；`types.ts:4-77`；`fields/LxDynamicFieldUpload.vue:11-56`；`fields/LxDynamicFieldDate.vue:8-51`；`style.css:1-86`。
- Demo 与 API 文档：`linkx-fe/src/components/LxDynamicForm/demo/basic.vue:48-150,160-236,278-289`；`linkx-fe/docs/components/lxdynamicform.md:3,43,50-134`。
- Vue3 行为证据：`other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts:60-255,322-489`；`tests/e2e/lx-dynamic-form-docs.spec.ts:1-87`；通用 Form ARIA E2E `tests/e2e/lx-form-docs.spec.ts:108-117`。
- 远程和上传边界：`linkx-fe/src/components/LxSelect/types.ts`、`linkx-fe/src/components/LxUpload/types.ts`、`other-admin/admin-vue3/src/composables/useFetch.ts:77`、`other-admin/admin-vue3/src/utils/http.ts:59-80`。
