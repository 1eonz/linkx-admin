# Wave 4 修复后代码复审

复审范围：LxUpload 的裸 File 回传、受控 modelValue 移除取消、UID 归一化与 AbortSignal 文档，以及 LxDatePicker Demo 的 null 类型。只读检查源码、类型、文档和新增单测；未运行测试或构建。

## Findings

### [P2] 无 UID 文件重排会把请求身份转给同位置的另一文件

位置：linkx-fe/src/components/LxUpload/index.vue:143、337、346、365。

复现：受控列表先传入两个不同的裸 File，二者名称和大小相同且都没有 uid；在父级收到并回传组件生成的 UID 之前启动两个上传请求，然后父级只移除第一个文件。当前回退 sourceKey 使用 fallback:index:name:size。第二个文件移动到索引 0 后会复用第一个文件原有的 sourceKey 和内部 UID。watcher 因而认为第一个请求的 UID 仍在列表中，不会取消它；第二个文件原先的 UID 消失，反而取消了仍保留文件的请求。映射表还会把该内部 UID 对应的 source raw 改成第二个文件，因此第一个请求的迟到成功回调仍可能通过当前请求校验，并以第二个文件的 raw 回传结果。

最小修复建议：有原始 File/raw 对象时，用组件实例级的对象身份映射生成稳定内部 UID，不要用列表索引作为该对象的身份。对于无法取得稳定对象身份且宿主未提供 UID 的记录，应明确其重排限制，或在首次回传时促使宿主保存生成 UID。补一条同名同大小、无 UID 的双文件测试：移除第一个后，第一个请求应取消、第二个请求应保持活动；再触发第一个的迟到回调，确认不会更新第二个文件。

### [P2] 复核日期 Demo 的 v-model 仍声明为字符串

位置：linkx-fe/src/components/LxDatePicker/demo/basic.vue:18、244；值格式契约见 linkx-fe/src/components/LxDatePicker/types.ts:65。

复核日期使用 LxDatePicker 且没有设置 value-format。组件契约规定省略 value-format 时模型值为 Date；用户选中日期后，reviewDate 会接收 Date，但当前声明为 string | null。这个 Demo 的类型与运行时输出不一致，可能造成模板类型检查失败，也会误导示例调用者。

最小修复建议：若示例要展示默认 Date 模型，将 reviewDate 改为 Date | null 并以 null 或 Date 初始化；若要展示字符串模型，为该字段设置 value-format 并保留 string | null。

## 已核实项

- 裸 File 测试确认 Element Plus 收到带内部 UID 的副本，模型回传原始 File，原对象没有被追加 UID：other-admin/admin-vue3/tests/unit/lx-upload.test.ts:189。
- 受控移除 watcher 按归一化后的内部数字 UID 做集合差异，并仅取消消失的 UID。源 UID 的键包含原始类型，数值 UID 与字符串 UID 不会混同；共享 raw UID 的测试覆盖只取消目标内部 UID：other-admin/admin-vue3/tests/unit/lx-upload.test.ts:894。
- 请求回调同时校验当前控制器实例和 aborted 状态；失效逻辑先从 Map 删除控制器再触发 abort。受控移除测试分别覆盖迟到成功和失败回调，未发现这两条路径能回写已移除项：other-admin/admin-vue3/tests/unit/lx-upload.test.ts:853。
- Upload 文档与类型说明一致：宿主需传递 AbortSignal，受控列表移除会取消请求；UID 应保存并按原类型回传。文档也说明忽略 signal 的适配器可能继续传输底层请求。
