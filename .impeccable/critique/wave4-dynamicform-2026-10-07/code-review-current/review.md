# 定向复审

## 原 P2 结论

原报告针对“移除 DynamicForm `field.feedback` 后上传触发器恢复反馈 ID”的问题已关闭。[`originalDescriptionIds` 会过滤表单内的错误与字段反馈节点 ID](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:58)，其余 ID 会去重并保留。新增回归先挂载必填上传字段及反馈，再移除反馈，并断言反馈节点消失、触发器不再引用其 ID、`aria-required` 仍保留，见 [`lx-dynamic-form.test.ts`](/F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts:521)。这覆盖并修复了原报告描述的路径。

静态的外部自定义描述 ID 也会保留：初始化快照会排除组件管理的 ID，但保留其余 `aria-describedby` 值；当这些值仍在控件属性中时，同步逻辑会继续保留它们。

## 剩余发现

- **[P2] 动态移除调用方提供的描述 ID 后仍可能恢复悬空引用。** `originalDescriptionIds` 会把初始存在的外部 ID 放入 `ariaState` 快照（[快照位置](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:113)）。若调用方随后移除该 `aria-describedby` 值，而字段仍处于必填或错误状态，`MutationObserver` 不监听该属性（[监听配置](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:147)）；校验状态稍后变化时，同步逻辑会过滤表单错误 ID，并在当前描述为空时恢复旧快照（[恢复位置](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:135)）。这会让辅助技术再次指向已删除的外部描述节点。建议跟踪描述属性的当前值，或在属性变更时更新快照，并补充“错误状态中移除外部描述 ID、随后清除校验”的回归。

## 验证范围

本次为定向静态复审，未独立运行测试。根 Agent 报告新增回归及当前单测共 86/86 通过；该回归覆盖了表单管理的字段反馈 ID，未覆盖调用方动态移除外部自定义 ID 的路径。
