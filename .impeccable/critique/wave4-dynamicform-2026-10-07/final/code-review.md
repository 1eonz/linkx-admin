# UI-13 Wave 4 代码复审

审查范围：`LxDynamicForm`、`LxDatePicker`、`LxUpload` 本波源码、相关 Demo、中文 API 文档、Vue3 unit 与 Playwright 用例。已排除 `.pnpm-store/` 和 status 中的 wave3 文件。

验证背景：委托信息给出的全量文档 Playwright 为 27/27、相关 Vitest 为 82/82；本次复审未重跑测试，以下结论基于当前源码、diff 和测试断言。

## Findings

### [P2] 禁用上传时“浏览本地文件”仍暴露为可操作按钮

`linkx-fe/src/components/LxUpload/index.vue:819` 的拖拽区内按钮没有绑定 `disabled`，虽然外层 `ElUpload` 收到了 `disabled`，该原生按钮仍可进入键盘焦点顺序并向辅助技术报告为启用；点击后又会被禁用的上传器拦截，表现为一个看似可用但无效的操作。默认拖拽模式会显示此按钮。现有禁用态 E2E（`other-admin/admin-vue3/tests/e2e/lx-upload-docs.spec.ts:87-89`）只检查文件输入和移除按钮，未覆盖浏览按钮的禁用语义。

### [P2] 动态多图 URL 回显 UID 可与宿主文件 UID 撞号

`linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue:33` 用 `lx-dynamic-${index}` 为 URL 字符串生成 UID，同时保留 `LxUploadFile` 上宿主提供的任意字符串 UID。两者在有效混合值 `['/old.png', { uid: 'lx-dynamic-0', name: 'new.png' }]` 中会重复。`linkx-fe/src/components/LxUpload/index.vue:350-354` 按 UID 建立同一个 `sourceKey` 并复用同一内部 UID，列表也以该 UID 作 key；随后进度、取消和移除都无法可靠区分这两个文件，导致多图模型状态可能更新错项。现有动态表单映射用例覆盖了 URL 与文件对象并存，但没有覆盖生成 UID 与宿主 UID 冲突。

## 观察

- 日期范围清空为 `null`、字符串严格解析与区间顺序校验有对应单测；Playwright 通过真实选择和清空操作检查了回显及 model 更新。
- 上传请求封装有取消信号及迟到成功/失败回调隔离，单测覆盖受控移除、重试和相同文件重排；动态表单 Playwright 覆盖单图/多图失败重试、取消和移除。新增 E2E 多数验证可观察交互，也有少量针对过渡样式/布局实现的断言；后续可补禁用浏览按钮的键盘焦点检查及上述 UID 冲突回归用例。
- 除上述两项外，未发现 P0/P1 缺陷。
