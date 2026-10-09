# Wave 4：LxDynamicForm / LxUpload 只读代码复审

日期：2026-10-06  
结论：**Changes requested**  
审查范围：当前工作树中的 `linkx-fe/src/components/LxDynamicForm/`、`linkx-fe/src/components/LxUpload/`、关联基础控件样式、中文组件文档、Vue3 单元测试和动态表单文档 E2E。未读取 Assessment A/B 报告。

## Findings

### P2：Promise 型上传适配器无法被取消，迟到回调会覆盖取消结果

[LxUpload/index.vue](/F:/work/linkx-admin/linkx-fe/src/components/LxUpload/index.vue:413) 的 `cancelUpload()` 调用 Element Plus `abort()`，随后把上传中文件改为 `ready` 并发出新模型。但公开的 [LxUpload/types.ts](/F:/work/linkx-admin/linkx-fe/src/components/LxUpload/types.ts:11) 允许 adapter 返回 `Promise<unknown>`。当前安装的 Element Plus 2.14.2 在 `upload-content.vue_vue_type_script_setup_true_lang.mjs:105-107` 将 Promise 的完成回调继续接到 `onSuccess/onError`；其 `abort()` 在 `123-127` 只对 `XMLHttpRequest` 调用 `abort()`，对 Promise 仅删除请求跟踪。Promise 完成后仍会进入成功/失败处理；取消后仍留在受控列表中的文件状态因此会被迟到回调改成 `success` 或 `fail`，与“取消上传并回队列”的文档行为冲突。服务端 Promise 请求也可能继续完成。

现有单测 [lx-upload.test.ts](/F:/work/linkx-admin/other-admin/admin-vue3/tests/unit/lx-upload.test.ts:245) 只确认 Element Plus `abort()` 被调用和发出的列表状态，没有覆盖 Promise adapter 取消后的迟到成功/失败回调。需要让适配器的取消能力可表达并屏蔽已取消请求的回调，或收紧 adapter 契约及相应文档；补回归覆盖取消后成功与失败回调。

### P3：项目地图与迁移台账仍把本波列为下一入口

[PROJECT-MAP.md](/F:/work/linkx-admin/doc/PROJECT-MAP.md:9)、[MIGRATION-BACKLOG.md](/F:/work/linkx-admin/other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md:8) 和 [ROADMAP.md](/F:/work/linkx-admin/linkx-fe/docs/ROADMAP.md:9) 仍称下一步/下一入口是 `LxDynamicForm`，并把字段 renderer 拆分、取消竞态、上传映射及区间值等作为待做项；这些内容已经出现在当前实现、文档和测试中。按仓库规则，公共组件改动需同步更新项目地图及对应迁移台账。请补本波交接记录，避免后续从旧入口继续推进。

## 未复现的问题

- 未复现“主表单与类型预览共用候选模式状态”：`basic.vue:47` 的 `candidateDemoMode` 绑定主表单状态，`basic.vue:101` 起单独维护 `schemaPreviewCandidateMode`，预览请求也从该状态读取（`basic.vue:330-342`）。
- 未复现“E2E 请求日志包含查询参数”：`lx-dynamic-form-docs.spec.ts:36` 仅记录 `origin + pathname`，不记录 `search`。
- 未复现“E2E 允许任意静态扩展名路径”：`lx-dynamic-form-docs.spec.ts:16-34` 使用文档路由、Vite 开发路径及少数明确路径；没有通用文件扩展名 allowlist，并显式屏蔽后端路径。

## 测试缺口

- 触控 E2E [lx-dynamic-form-docs.spec.ts](/F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts:209) 在 375px、`hover:none` 下测量 input、password、select、number、date、daterange 和 tree-select；没有测量 Upload 的浏览、清空、重试、移除和取消操作。当前 CSS 为这些操作提供了 44px 规则（`LxUpload/index.vue:910-919, 1143-1167, 1268-1281`），但文档 `lxupload.md:85` 的移动端 44px 约定尚无本波浏览器断言。
- 本次没有运行单测或 E2E，故无法给出运行通过率；Promise 取消缺陷也缺少覆盖它的回归用例。

## 已核对通过的重点

- `sectionTitleBefore` 随可见字段渲染为通栏标题，不产生 model key 或校验项；单测覆盖其渲染、必填校验与 reset（`lx-dynamic-form.test.ts:679-703`）。
- 表单默认值、受控值替换、`value/change`、reset 初始快照、不修改父级对象均有单测；密码控件保持遮罩，日期范围校验覆盖类型一致、可解析和顺序约束。
- 远程查询 Demo 分开维护主表单/预览状态，并通过请求序号、AbortController 和卸载清理处理乱序、取消与组件卸载；E2E 覆盖取消、迟到结果和失败恢复。
- 上传对外 `error` 到 Element Plus `fail` 的映射、成功响应、URL、失败 Error 的受控回灌均有单测覆盖。未发现 `sectionTitleBefore`、表单校验/受控 reset 或状态映射的 P1/P2 代码缺陷。

## 验证与指纹

- `git diff --check`：通过（退出码 0；仅检查本次相关路径）。
- 测试/构建：未运行。此报告是只读复审；本次仅收集静态证据。
- 源码指纹：`.impeccable/critique/wave4-dynamicform-2026-10-06/assessment-b-postfix/target-hashes-before.json` 的 23 项 SHA-256 与当前工作树逐项一致（清单时间 `2026-10-06T07:27:34.138Z`）。另记录本次测试文件指纹：`tests/unit/lx-dynamic-form.test.ts` `258F18994392951BC90B5D6DD5F07B418D4409E8BB795F0184F33D603161CEFF`；`tests/unit/lx-upload.test.ts` `8B8BEF34C4E9BCBC87454060D14110DC0154DECF7E71EB740B0DD6C29070329C`；`tests/e2e/lx-dynamic-form-docs.spec.ts` `CEFCE396F4D45DADDBE81D98AD3F458B9268664D07072B478FB85ACFDDB7BF7D`。

复审结论保持 **Changes requested**，解除 P2 上传取消缺陷并同步 P3 台账后再复审。
