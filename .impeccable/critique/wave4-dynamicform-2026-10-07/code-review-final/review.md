# Wave 4 代码复核

## 结论

未发现 P0/P1 问题；发现一个可复现条件明确的 P2 问题，涉及同批次移除字段反馈并清除校验时的 `aria-describedby` 同步。

## 发现

- **[P2] 同批次移除反馈并清校验时可能缓存已删除的表单错误 ID，触发观察器循环。** [`originalDescriptionIds` 只排除当前仍在表单内的错误/反馈节点 ID](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:63)，没有无条件排除组件自己的 `formItemErrorId`。若必填上传字段已有字段反馈和校验错误，调用方在同一个 Vue 更新批次移除 `field.feedback` 并调用 `clearValidate()`，LxUpload 会去掉原反馈 ID、同时保留当前 `formItemErrorId`；到 MutationObserver 回调时错误节点和反馈节点均已移除，快照逻辑会把只剩的错误 ID 当成调用方描述保存。同步逻辑随后过滤当前错误 ID，却从快照再次恢复它（[恢复分支](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:128)）。`restoreAttribute` 对非空值无条件调用 `setAttribute`（[实现](/F:/work/linkx-admin/linkx-fe/src/components/LxForm/LxFormItem.vue:50)）；相同值写入仍产生属性变更记录，观察器再次同步并重复写入，可持续占用主线程。LxUpload 保留未由自身转交的 ID 的合并逻辑见 [LxUpload/index.vue](/F:/work/linkx-admin/linkx-fe/src/components/LxUpload/index.vue:103)。

  最小修复：快照时始终排除 `formItemErrorId`，即使对应错误节点已卸载；同时让属性恢复在目标值已相同时不写 DOM。增加“必填上传字段已校验失败，在同一更新批次移除反馈并调用 `clearValidate()`”回归，断言错误 ID 不残留且观察器停止产生更新。

## 已核查与覆盖风险

- 两条先前 stale ID 路径已有针对性回归：移除 DynamicForm 字段反馈，见 [`lx-dynamic-form.test.ts`](/F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts:520)；校验期间移除调用方描述，见同文件第 569 行。它们分别验证不同步序列，未覆盖上述同批次组合。
- E2E 密码校验通过 `expect.poll` 等待错误 ID 从 `aria-describedby` 消失（[`lx-dynamic-form-docs.spec.ts`](/F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts:669)），适合异步观察器同步；但只覆盖值修正后的单字段转换，没有覆盖字段反馈移除与 `clearValidate()` 同批次发生。
- 四个类别合计覆盖 14 种字段，E2E 逐项渲染全部类型。当前断言检查类别数量及逐项可选，但只对“日期与数值”类别明确断言排除错误类别的选项；其余类别的精确成员关系仍有覆盖缺口，未发现实现错误。

## 验证范围

未修改产品源码或测试。根 Agent 报告当前单测 87/87、三页 E2E 36/36 及类型/构建检查通过；本次未独立重跑这些检查。另用最小 DOM 复现验证了同值 `setAttribute` 会持续触发 `MutationObserver` 回调；组合触发路径尚无仓库回归测试。
