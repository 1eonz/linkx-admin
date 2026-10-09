# Wave 4 DynamicForm / Upload 代码复审

**结论：需修。** 发现两项受控上传行为缺陷、一项 DatePicker Demo 类型不一致和一项 UID 文档描述不准确；未发现需要立即升级为 P0/P1 的问题。

## Findings

### [P2] `modelValue` 中的裸 `File` 丢失上传所需的 `raw`

位置：`linkx-fe/src/components/LxUpload/index.vue:234`、`linkx-fe/src/components/LxUpload/index.vue:613`。

`toUploadUserFile()` 明确接收 `File`，但该分支只生成 `uid`、名称、大小和 `ready` 状态，没有保留原始文件。组件随后把这个对象作为 Element Plus `file-list`，而公开的 `submit()` 只委托给 Element Plus。其上传队列只会提交带 `raw` 的 ready 项，因此父级把 `[file]` 作为 `modelValue` 回传时，界面会显示排队文件但提交不会发起上传。当前 Upload 单测覆盖了 `LxUploadFile.raw`，没有覆盖 `modelValue: [File]`。

应让该分支生成带内部 UID 的可上传 raw 文件，并在事件中保留原始文件；若裸 `File` 并非支持输入，则删除接受它的分支并收紧/说明受控值契约。

### [P2] 父级移除受控文件不会取消仍在运行的请求

位置：`linkx-fe/src/components/LxUpload/index.vue:341`、`linkx-fe/src/components/LxUpload/index.vue:371`。

`files` 会随 `props.modelValue` 更新，但没有观察受控列表移除项并使其请求失效的逻辑。请求只在实例 `abort()`、行内移除/重试、清空或卸载时取消（对应 `index.vue:417`、`index.vue:421`、`index.vue:559`、`index.vue:618`）。因此父级重置表单或直接从 `modelValue` 删除上传中文件时，传给宿主适配器的 `signal` 仍保持未取消；支持 `signal` 的适配器会继续传输，忽略 `signal` 的适配器也会持续到完成。对文件上传这类写操作，外部受控移除应停止对应请求，避免用户已移除文件仍写入服务端。现有测试验证了组件自身取消路径，没有验证父级替换/清空 `modelValue`。

### [P2] DatePicker Demo 的受控状态类型不包含清空值 `null`

位置：`linkx-fe/src/components/LxDatePicker/demo/basic.vue:12`、`linkx-fe/src/components/LxDatePicker/demo/basic.vue:15`。

本波把 `LxDateModelValue` 和文档清空契约扩展为 `null`（`types.ts:30`、`docs/components/lxdatepicker.md:42`），但交互 Demo 仍把可清空的区间和单值状态声明为 `ref<[string, string]>`、`ref<string>`。用户清空控件后这些 ref 会在运行时变成 `null`，与示例声明的状态类型不符；示例没有关闭 `clearable`。应将可编辑值的类型包含 `null`，并补上清空后 v-model 状态的示例/类型覆盖。

### [P3] Upload 文档对新选文件的 UID 类型描述不准确

位置：`linkx-fe/docs/components/lxupload.md:64`、`linkx-fe/src/components/LxUpload/index.vue:182`、`linkx-fe/src/components/LxUpload/index.vue:430`。

文档称无 UID 的输入文件首次回传时会获得实例级字符串 UID。正常文件选择会先由 Element Plus 为 raw file 分配数值 UID，再进入组件的 `onChange`；本组件对没有已登记宿主映射的 UID 会返回内部数值 UID。因此普通选择路径实际回传的是数值 UID，字符串只用于组件处理的 fallback 受控项。文档应区分这两种路径，避免调用方误判 UID 类型。

## 审查范围与验证

已阅读本波指定的 DatePicker 类型、日期清空实现路径和 Demo/API 文档；DynamicForm 全部组件/字段渲染器、类型、样式、Demo、API 文档；Upload 组件、UID helper、Demo、API 文档；指定的 DatePicker/DynamicForm/Upload 单测与 DynamicForm/Upload 文档 E2E 的相关新增用例。为确认上传队列的 `raw` 与 UID 行为，另只读检查了已安装 Element Plus 的 upload handler 实现。

忽略 `.pnpm-store` 镜像、Wave 3 LxIcon、基础控件 CSS、生成目录和其他波次文件。没有读取或引用 `.impeccable/critique/wave4-dynamicform-2026-10-06/**/assessment-a`、`assessment-b` 下任何目录、报告或截图。未运行测试、类型检查、构建或浏览器验证。
