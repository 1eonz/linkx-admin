# Wave 4 修后独立代码复审

## 结论

本次复审未发现新增真实缺陷。P0、P1、P2 均无发现；P3 也无需要登记的问题。已修复的事项仅作为复核目标，不重复列为发现。

## 复核范围

- `LxUpload` 无 UID 裸 `File` / raw `File` 的回退身份映射、受控列表重排、请求取消及迟到回调隔离。
- 同名同大小双文件重排回归用例。
- `LxDatePicker` Demo 的 `reviewDate` 模型类型。
- `LxUpload` 中文文档中的 UID 与宿主回传约定。
- 相关上传字段适配器、组件类型及请求 API 边界。

## 复核依据

- `linkx-fe/src/components/LxUpload/index.vue:157` 以原始 `File` 对象在弱映射表中的条目生成稳定回退身份；`uniqueUploadFiles` 使用该身份取得内部 UID，并用分离的 raw 文件副本满足 Element Plus 的数值 UID 约束。文件重排时不再依赖数组下标识别有 raw 的无 UID 文件。
- `linkx-fe/src/components/LxUpload/index.vue:381` 在受控列表移除内部 UID 时失效对应请求并调用 Element Plus 取消；`linkx-fe/src/components/LxUpload/index.vue:415` 的进度、成功、失败回调均检查请求代次是否仍有效。重试、移除、批量取消和卸载路径也会先使旧请求失效。
- `other-admin/admin-vue3/tests/unit/lx-upload.test.ts:894` 的回归用例以两个不同的同名同大小 `File` 对象启动请求，移除第一项后断言仅第一项的 signal 被中止、旧成功回调被忽略且第二项仍保留。该用例覆盖本次修复所指的身份交换场景。
- `linkx-fe/src/components/LxDatePicker/demo/basic.vue:18` 将未配置 `value-format` 的复核日期建模为 `Date | null`，与 `linkx-fe/src/components/LxDatePicker/types.ts` 的 `LxDateModelValue` 契约一致。
- `linkx-fe/docs/components/lxupload.md:64` 说明了缺省 UID 的回传行为、raw File 对象身份及宿主保留生成 UID 的要求，与实现边界一致。
- 动态表单上传适配器继续把单文件值映射为单项或 `null`、多文件值映射为数组，并通过公开 `LxUploadFile` 与宿主上传适配器传递状态；未发现本次修复造成的类型或请求边界回归。

## 验证

- 复核前按冻结清单核验 40 项 SHA-256，40 项全部匹配。
- 对本次相关的跟踪文件运行 `git diff --check`，通过；Git 仅提示若干文件的 LF/CRLF 转换提醒。
- 未运行测试、格式器、构建或会写入产品产物的命令；本报告是静态代码复核结论，不代表测试或构建通过。
- 复核后按冻结清单再次核验 40 项 SHA-256，40 项全部匹配，0 项变化。
