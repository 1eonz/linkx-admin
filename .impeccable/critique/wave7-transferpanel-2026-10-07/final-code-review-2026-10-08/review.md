# Wave 7 LxTransferPanel 最终代码审查

- 审查基准：当前 `HEAD`，`76d620e6baf02297f0d02422e9cc6c512a6880e9`
- 审查范围：本报告末尾列出的 7 个目标文件相对该基准的当前差异。
- 方法：只读静态审查。未打开 Impeccable Assessment A/B 报告、浏览器截图或 detector 结果；未运行测试。
- 结论：**Request Changes**。以下两处 P2 问题应修复后再批准。

## Findings

### P2：旧的单项移除确认可能删除后来重新加入的授权

位置：`linkx-fe/src/components/LxTransferPanel/index.vue:320`、`linkx-fe/src/components/LxTransferPanel/index.vue:334`

未加载项的确认框打开时，回调捕获了 `node`，但确认通过后 `removeSelectedNode()` 会基于当时最新的 `props.modelValue` 移除这个 ID。若宿主在确认尚未完成时先移除该键、随后又将同键加入（例如刷新或其它界面操作），旧确认通过后会删除新加入的选择。清空确认分支已有快照比较，单项移除没有相同保护。

复现：`modelValue=['legacy']`；点击“移除 legacy”并保持确认 Promise 未决；宿主依次传入 `[]`、`['legacy']`；随后让旧确认返回 `true`。组件会对最新数组发出 `update:modelValue([])`。确认回调应验证确认时的受控值/目标仍未变化，变化时让用户重新检查；补充对应单测。

### P2：文档持久化示例在保存期间允许草稿变化，回调会读错状态

位置：`linkx-fe/docs/components/lxtransferpanel.md:79`、`linkx-fe/docs/components/lxtransferpanel.md:84`、`linkx-fe/docs/components/lxtransferpanel.md:87`

示例发起保存时把 `draftKeys.value` 传给 `savePermissionKeys`，但成功和失败回调都再次读取/写入可变的 `draftKeys.value`；`saving` 只被赋值，没有用于阻止修改或并发提交。清空保存未完成时，若草稿被重新选中或被其它宿主更新，成功回调会把当前草稿记作已保存值，即使服务器收到的是空数组；失败回调则会用旧快照覆盖新草稿。这个片段作为宿主持久化接入示意，可能造成服务端与本地选择不一致或丢失编辑。

应在发起时复制并保存提交快照，并明确保存期间的编辑/提交策略；成功只确认该快照，失败恢复也应避免覆盖提交期间产生的新编辑。示例中“撤销清空只恢复本地快照、服务端补偿由宿主处理”的说明本身表达清楚，但当前持久化片段尚未遵守这个边界。

## 审查结论

受控更新顺序、超限时拒绝新增及仍允许移除、禁用节点处理、面板标题 ID 关联、未知状态文本的原型键安全、示例的本地撤销边界和窄屏布局均有对应实现或测试。当前测试覆盖了全量清空确认期间受控值变化，却没有覆盖上述单项移除竞态。由于两个 P2 问题会影响真实受控状态或复制文档示例后的持久化结果，建议修复后再批准。

## 目标文件 SHA-256

以下哈希对应审查时工作树中的完整文件内容：

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `F3B99891480990AB79AFEBB335519245CCA094076CCF05BBBA2EB729A11845E3` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `E9081F8E77306A2C282FA159213A30CE3F725FD3B307ED91D508C6FE61878240` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `2A803BBC66F1A75A855C16B8E975E20DE84E5C560B9F9853FBE6C157816811F5` |
| `linkx-fe/docs/.vitepress/theme/custom.css` | `27B6B3C1F4D9043A86CAB1C26B88A1B7C007B014C909E90872907A191E9B9EF0` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `BB5036A6BB99971B3D2520C07CFEF1C43E4269F91D60C553DD6D90E1ADD5EE9D` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `44A7237DD5CE6C286A22DD1BB2B244302C7C32FFC463D86EE4D291599EC2180C` |
