# Assessment B：Detector 与浏览器证据

本报告只记录 detector 与浏览器证据，不包含设计评分或整体 Critique 结论。页面注入已通过可变注入预检；下方将文档渲染层、实际组件 DOM 与 detector HUD 分开归因。

## 目标与完整性

- 目标页面：http://127.0.0.1:4174/components/lxdynamicform.html
- 冻结清单：.impeccable/critique/wave4-dynamicform-2026-10-06/final-recheck-2026-10-06/source-hashes-freeze.json，共 39 项。
- 评估前哈希：39/39 匹配。
- 评估后哈希：39/39 匹配。
- 评估前后内容一致：是；完整性 JSON：integrity.json。
- Assessment B 期间未改产品文件。Assessment A 与 grouped-types-freeze 的评估材料未作为输入读取。

## 静态 Detector

逐个调用 node scripts/detect.mjs --json <冻结 Vue/TS 文件>。只有 stdout 是有效 JSON 数组 []、stderr 为空且退出码为 0 时，才计为严格静态零命中。以下结果不代表浏览器整体通过。

- 支持并扫描：31 个 .vue/.ts/.tsx 文件。
- 严格零命中：31/31。
- 有效 JSON：31/31；stderr 非空：0；非零退出码：0。
- Markdown 未扫描：文档/静态对照文件不属于本次 Vue/TS 源文件范围。
- CSS 未扫描：本次任务要求扫描 Vue/TS 文件，冻结清单中的独立 CSS 已列明扩展名和范围原因。

| 冻结源文件 | JSON | stderr | exit | 命中 | 原始材料 |
| --- | --- | ---: | ---: | ---: | --- |
| linkx-fe/src/components/LxDatePicker/index.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDatePicker__index.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDatePicker__index.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDatePicker__index.vue.exit-code.txt) |
| linkx-fe/src/components/LxDatePicker/types.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDatePicker__types.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDatePicker__types.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDatePicker__types.ts.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/demo/basic.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__demo__basic.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__demo__basic.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__demo__basic.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldCheckbox.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldCheckbox.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldCheckbox.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldCheckbox.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDate.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDate.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDate.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDate.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldDateRange.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDateRange.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDateRange.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldDateRange.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldInput.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldInput.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldInput.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldInput.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldNumber.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldNumber.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldNumber.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldNumber.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldPassword.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldPassword.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldPassword.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldPassword.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldRadio.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRadio.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRadio.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRadio.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldRemoteSelect.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRemoteSelect.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRemoteSelect.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldRemoteSelect.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldSelect.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSelect.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSelect.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSelect.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldSwitch.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSwitch.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSwitch.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldSwitch.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldTextarea.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTextarea.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTextarea.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTextarea.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldTreeSelect.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTreeSelect.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTreeSelect.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldTreeSelect.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/LxDynamicFieldUpload.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldUpload.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldUpload.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__LxDynamicFieldUpload.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/fields/types.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__fields__types.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__fields__types.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__fields__types.ts.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/index.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__index.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__index.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__index.vue.exit-code.txt) |
| linkx-fe/src/components/LxDynamicForm/types.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxDynamicForm__types.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxDynamicForm__types.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxDynamicForm__types.ts.exit-code.txt) |
| linkx-fe/src/components/LxUpload/demo/basic.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxUpload__demo__basic.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxUpload__demo__basic.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxUpload__demo__basic.vue.exit-code.txt) |
| linkx-fe/src/components/LxUpload/index.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxUpload__index.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxUpload__index.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxUpload__index.vue.exit-code.txt) |
| linkx-fe/src/components/LxUpload/types.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxUpload__types.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxUpload__types.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxUpload__types.ts.exit-code.txt) |
| linkx-fe/src/components/LxUpload/uid.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxUpload__uid.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxUpload__uid.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxUpload__uid.ts.exit-code.txt) |
| other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/other-admin__admin-vue3__tests__e2e__lx-dynamic-form-docs.spec.ts.stdout.txt) / [stderr](detector-results/other-admin__admin-vue3__tests__e2e__lx-dynamic-form-docs.spec.ts.stderr.txt) / [exit](detector-results/other-admin__admin-vue3__tests__e2e__lx-dynamic-form-docs.spec.ts.exit-code.txt) |
| other-admin/admin-vue3/tests/e2e/lx-upload-docs.spec.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/other-admin__admin-vue3__tests__e2e__lx-upload-docs.spec.ts.stdout.txt) / [stderr](detector-results/other-admin__admin-vue3__tests__e2e__lx-upload-docs.spec.ts.stderr.txt) / [exit](detector-results/other-admin__admin-vue3__tests__e2e__lx-upload-docs.spec.ts.exit-code.txt) |
| other-admin/admin-vue3/tests/unit/lx-date-picker.test.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/other-admin__admin-vue3__tests__unit__lx-date-picker.test.ts.stdout.txt) / [stderr](detector-results/other-admin__admin-vue3__tests__unit__lx-date-picker.test.ts.stderr.txt) / [exit](detector-results/other-admin__admin-vue3__tests__unit__lx-date-picker.test.ts.exit-code.txt) |
| other-admin/admin-vue3/tests/unit/lx-dynamic-form.test.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/other-admin__admin-vue3__tests__unit__lx-dynamic-form.test.ts.stdout.txt) / [stderr](detector-results/other-admin__admin-vue3__tests__unit__lx-dynamic-form.test.ts.stderr.txt) / [exit](detector-results/other-admin__admin-vue3__tests__unit__lx-dynamic-form.test.ts.exit-code.txt) |
| other-admin/admin-vue3/tests/unit/lx-upload.test.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/other-admin__admin-vue3__tests__unit__lx-upload.test.ts.stdout.txt) / [stderr](detector-results/other-admin__admin-vue3__tests__unit__lx-upload.test.ts.stderr.txt) / [exit](detector-results/other-admin__admin-vue3__tests__unit__lx-upload.test.ts.exit-code.txt) |
| linkx-fe/docs/.vitepress/config.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__docs__.vitepress__config.ts.stdout.txt) / [stderr](detector-results/linkx-fe__docs__.vitepress__config.ts.stderr.txt) / [exit](detector-results/linkx-fe__docs__.vitepress__config.ts.exit-code.txt) |
| linkx-fe/src/components/LxIcon/icons.ts | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxIcon__icons.ts.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxIcon__icons.ts.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxIcon__icons.ts.exit-code.txt) |
| linkx-fe/src/components/LxIcon/index.vue | 有效数组 | 0 bytes | 0 | 0 | [stdout](detector-results/linkx-fe__src__components__LxIcon__index.vue.stdout.txt) / [stderr](detector-results/linkx-fe__src__components__LxIcon__index.vue.stderr.txt) / [exit](detector-results/linkx-fe__src__components__LxIcon__index.vue.exit-code.txt) |

### 范围内未扫描文件

| 文件 | 原因 |
| --- | --- |
| linkx-fe/docs/components/lxdatepicker.md | Markdown 静态对照/说明文件不属于本次 Vue/TS 源文件扫描范围。 |
| linkx-fe/docs/components/lxdynamicform.md | Markdown 静态对照/说明文件不属于本次 Vue/TS 源文件扫描范围。 |
| linkx-fe/docs/components/lxupload.md | Markdown 静态对照/说明文件不属于本次 Vue/TS 源文件扫描范围。 |
| linkx-fe/src/components/LxDynamicForm/style.css | 独立 CSS 文件按本次冻结任务要求不扫描；Vue/TS 文件仍逐文件交给 detect.mjs。 |
| other-admin/admin-vue3/docs/DYNAMIC-FORM-SPEC.md | Markdown 静态对照/说明文件不属于本次 Vue/TS 源文件扫描范围。 |
| linkx-fe/src/components/LxInput/style.css | 独立 CSS 文件按本次冻结任务要求不扫描；Vue/TS 文件仍逐文件交给 detect.mjs。 |
| linkx-fe/src/components/LxInputNumber/style.css | 独立 CSS 文件按本次冻结任务要求不扫描；Vue/TS 文件仍逐文件交给 detect.mjs。 |
| linkx-fe/src/components/LxTreeSelect/style.css | 独立 CSS 文件按本次冻结任务要求不扫描；Vue/TS 文件仍逐文件交给 detect.mjs。 |

## 浏览器证据

浏览器：Microsoft Edge，通过项目已有 Playwright 1.58.0 启动。每个目标视图使用独立 browser context 和 page。预检先修改 document.title，再追加 detector script；script 响应、load 事件与 impeccableDetect/impeccableScan API 都有记录。每页由 detector 自动扫描并显式调用 impeccableScan，等待 HUD 渲染后保存 viewport 与 full-page PNG。

- 可变注入预检：通过
- 预检页面状态：HTTP 200；script load load；detector API 可用。

| 视图 | 视口/主题 | 页面与注入 | 控制台/网络 | Detector groups / HUD overlays | 截图 |
| --- | --- | --- | --- | --- | --- |
| 亮色桌面 | 1440×960, light; html=(no class); body=rgb(255, 255, 255) | HTTP 200; inject 成功 | console error 0; pageerror 0; failed request 0; non-2xx 0 | groups 16/17; visible overlay nodes 23; outlines/labels 15/15 | [viewport](screenshots/desktop-light-1440.png) / [full page](screenshots/desktop-light-1440-full.png) |
| 深色/HUD 桌面 | 1440×960, dark; html=dark; body=rgb(27, 27, 31) | HTTP 200; inject 成功 | console error 0; pageerror 0; failed request 0; non-2xx 0 | groups 341/342; visible overlay nodes 47; outlines/labels 339/339 | [viewport](screenshots/desktop-dark-hud-1440.png) / [full page](screenshots/desktop-dark-hud-1440-full.png) |
| 375px 触屏 | 375×812, light; html=(no class); body=rgb(255, 255, 255) | HTTP 200; inject 成功 | console error 0; pageerror 0; failed request 0; non-2xx 0 | groups 10/11; visible overlay nodes 11; outlines/labels 9/9 | [viewport](screenshots/touch-375.png) / [full page](screenshots/touch-375-full.png) |

### Browser overlay 逐项归因

每个 findings group 的 selector、规则、severity/advisory、hidden 状态、DOM ancestry、匹配 HUD overlay 和实际控件清单均保存在 overlay-attribution.json。HUD 轮廓、标签和可见节点是标注层数量，不按缺陷计数。

- VitePress/Shiki：深色视图的 ai-color-palette 命中位于 pre.shiki 语法高亮 span，着色来自代码示例 token；将其标为代码高亮上下文，不归为动态表单 UI。完整 token selector 逐项保留在归因 JSON。
- VitePress 文档正文：line-length 命中的是 .vp-doc 内说明段落。它描述文档文本行宽，不命中实际表单字段。
- VitePress 代码块按钮：buried-raster 命中 .language-vue/.language-ts 容器内的 button.copy；属于文档复制按钮，不是 LxDynamicForm 上传图片或表单控件。浏览器截图未执行 hover，因此不判断 hover 后按钮背景表现。
- 页面全局：bounce-easing 与 layout-transition 的锚点是 body，记录为页面级样式信号；DOM 证据不能单独确定具体 CSS 来源。
- 移动导航：clipped-overflow-container 命中 span.container，只出现在 VitePress 导航容器；不归属动态表单。
- 实际控件：三个 gpt-thin-border-wide-shadow 是 Element Plus LxSelect popper（class 含 el-select__popper lx-select__popper），均 isHidden=true、bounds 0×0，属于 Demo 中关闭状态的下拉浮层；规则为 advisory，截图中不可见。未发现可见动态表单字段被该规则标记。
- Detector 自身：dark/HUD 视图的一个 text-occlusion selector ancestry 包含 .impeccable-label，文本是 HUD 自己生成的 “ai color palette” label，记录为注入工具自标注产物。

组件 DOM inventory 显示页面包含动态表单 Demo 和 schema preview；完整表单/输入/combobox selector 与可访问名称保存在 overlay-attribution.json 的 controlInventory 中。

## 服务生命周期

- 启动命令：node assessment-b.mjs server-start；只监听 127.0.0.1 的动态本机端口，提供 Impeccable detect-antipatterns-browser.js。
- 停止命令：node assessment-b.mjs server-stop；停止请求 HTTP 200、请求退出码 0、服务进程退出码 0。
- 停止后：临时端口 listener 数为 0；预览 URL 再次请求仍为 HTTP 200。
- 端口、PID、bundle 哈希与生命周期记录见 detector-server-start.json、detector-server-stop.json、detector-server-exit.json；停止密钥已在归档记录中移除。

## 材料索引

- 完整 detector 汇总与 Markdown/CSS 跳过列表：detector-index.json。
- 每个冻结 Vue/TS 文件的原始 stdout、stderr、命令、退出码与解析摘要：detector-results/。
- 页面响应、console、pageerror、failed request、selector inventory、findings 与 overlay DOM 快照：browser-evidence.json。
- 全 selector 归因与控件清单：overlay-attribution.json。
- 可变注入预检和三视图 viewport/full-page 截图：screenshots/。
- 39 项评估前后 SHA-256 逐项记录：integrity.json。
