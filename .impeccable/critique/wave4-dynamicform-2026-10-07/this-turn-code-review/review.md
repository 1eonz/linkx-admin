# 代码复核

## 发现

- **[P1] 上传触发器测试仍断言已移除的内层控件属性。** [lx-upload.test.ts](/F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-upload.test.ts:416) 仍要求 `.lx-upload__browse` 在禁用时带 `disabled`。当前它是纯 `<span>`；禁用语义由 Element Plus 外层 `.el-upload[role="button"]` 的 `aria-disabled` 和 `tabindex` 承担，因此该断言会失败。测试应检查外层触发器的禁用状态。
- **[P1] 上传字段说明关联测试仍读取 span 上的 `aria-describedby`。** [lx-dynamic-form.test.ts](/F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts:156) 对 `.lx-upload__browse` 读取该属性，但组件将说明 ID 转交给 Element Plus 外层按钮语义触发器，span 本身没有该属性；当前测试会失败。应断言 `.el-upload[role="button"]` 上的描述关联。

## 已核查

- `focusFirstInvalidFormField` 会跳过不可聚焦的提示 span；Element Plus 可用态触发器带 `tabindex="0"`，被通用 `[tabindex]` 选择器找到。禁用态根触发器没有 tabindex，不会被聚焦。
- fallback UID 会由 `modelUidFor` 注册回源 UID 映射；公开 `abort(file)` 再通过该 UID 找回内部文件和请求 UID。未发现该路径上的实现错误，但现有测试没有直接覆盖“生成 fallback UID、受控回灌后调用公开 abort”的完整组合。
- 日期范围 helper 检查无 `valueFormat` 的 ISO 日历日期，并允许日期后跟 `T`/`t` 或空白的时间部分；旧版宽松解析问题已处理，不作为当前缺陷。

## 验证范围

本复核未运行测试或构建；以上两条测试失败由当前测试断言与组件模板属性分配不一致直接确认。其余结论为静态代码复核。
