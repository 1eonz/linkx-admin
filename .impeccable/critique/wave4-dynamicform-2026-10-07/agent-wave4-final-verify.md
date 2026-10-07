# Wave 4 收口独立核验

日期：2026-10-07

范围：`LxDatePicker`、`LxDynamicForm`、`LxUpload` 的文档 E2E、定向门禁、Impeccable detector 证据和本波提交白名单。未修改产品代码，未提交。

## 结论

- 文档 E2E 三个目标文件共 43 项：DatePicker 22、DynamicForm 12、Upload 9。当前交付记录中的 31/31 是 DatePicker 与 Upload 子集（22 + 9），不是三页总数。本轮三页合并 43/43 通过；`test-results/.last-run.json` 为 `status=passed` 且 `failedTests=[]`。
- 配置原先使用 4176，工作区已有其他文档服务占用该端口，曾造成误复用风险。当前 Playwright lx-ui 配置改为 4177；本轮测试在 4177 完成，结束后 4177 无监听，原有 4176 服务仍在。另以相同配置运行 Switch 文档 E2E 6/6，通过以确认新端口配置兼容。
- 定向 Vitest 89/89；Vue3 `vue-tsc --noEmit`、lx-ui `pnpm typecheck`、目标 ESLint、目标 Prettier 通过。lx-ui 构建 203 modules、VitePress 文档构建通过；保留既有 >500KB chunk 和 pnpm `onlyBuiltDependencies` 提示。
- Assessment A 为 30/40（Good）。独立代码复审未发现可复现 P0–P2。Assessment B 记录 10 个 overlay 浏览器场景。Detector 的 `[]` 仅表示静态零命中，不代表视觉或交互通过。

## 可复现命令

从 `other-admin/admin-vue3` 执行三页完整文档 E2E：

```powershell
pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-date-picker-docs.spec.ts tests/e2e/lx-dynamic-form-docs.spec.ts tests/e2e/lx-upload-docs.spec.ts --reporter=line
```

DatePicker 与 Upload 的 31 项子集命令：

```powershell
pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-date-picker-docs.spec.ts tests/e2e/lx-upload-docs.spec.ts --reporter=line
```

定向单测命令：

```powershell
pnpm exec vitest run tests/unit/lx-date-picker.test.ts tests/unit/lx-dynamic-form.test.ts tests/unit/lx-upload.test.ts --reporter=dot
```

三个 E2E 文件均使用文档站 Demo 的本地状态或内存 Mock，DynamicForm 用例阻止非本地和业务 API 请求。真实上传协议与后端联调不在这组测试范围内。

## Detector 证据

我逐项读取并解析 `final-assessment-b-current` 下六个原始 stdout 文件。三个源码目标与三份组件文档目标均为有效 JSON `[]`、stderr 0 字节、退出码 0：

| 目标               | stdout                           | stderr | 退出码 |
| ------------------ | -------------------------------- | ------ | -----: |
| LxDatePicker 源码  | `lxdatepicker.stdout.json`       | 0 字节 |      0 |
| LxDynamicForm 源码 | `lxdynamicform.stdout.json`      | 0 字节 |      0 |
| LxUpload 源码      | `lxupload.stdout.json`           | 0 字节 |      0 |
| DatePicker 文档    | `docs-lxdatepicker.stdout.json`  | 0 字节 |      0 |
| DynamicForm 文档   | `docs-lxdynamicform.stdout.json` | 0 字节 |      0 |
| Upload 文档        | `docs-lxupload.stdout.json`      | 0 字节 |      0 |

原始记录和聚合结果见 `.impeccable/critique/wave4-dynamicform-2026-10-07/final-assessment-b-current/assessment-b-six-targets-evidence-index.md`、`detector-summary.json` 与 `docs-detector-summary.json`。该 Assessment B 报告另记 10 个独立浏览器 context；有一条未归因的 VitePress favicon 404，没有 page error 或失败请求。上传失败态的 `UploadAjaxError` 是预设 Mock。

Assessment B 的旧移动截图曾把 375px 文件名省略记为待确认候选。当前组件保留完整 `title`，上传文档 E2E 在 `other-admin/admin-vue3/tests/e2e/lx-upload-docs.spec.ts:326` 检查长文件名属性；本轮三页 E2E 已通过。这是行为复验记录，不是对 overlay 的重新截图。

综合报告与 snapshot：`.impeccable/critique/wave4-dynamicform-2026-10-07/final-report.md`、`.impeccable/critique/2026-10-07T03-11-47Z__linkx-fe-src-components-lxdynamicform-index-vue.md`。

## 白名单核对

当前没有暂存文件。建议实现与回归白名单限于三个组件目录、四个新增字段/UID 源文件、对应中文组件文档、三份 Vue3 unit/E2E 文件，以及 DynamicForm 上传字段直接依赖的 `LxForm/LxFormItem.vue` 和 `utils/focusInvalidFormField.ts`。`playwright.lxui.config.ts` 的 4177 调整解决 4176 服务误复用，应纳入测试配置白名单。

工作树另有 `.pnpm-store/v11/projects/...` 镜像、Wave 3 评审产物，以及 LxInput/LxInputNumber/LxSelect/LxTreeSelect 样式、VitePress 壳层和共享令牌等改动。当前 Wave 4 汇总没有逐一说明这些文件与本波的关系；暂存前应单独核对归属，不要用 `git add -A` 或整目录暂存。`.impeccable/critique/wave4-dynamicform-2026-10-07/` 中还包含 superseded 与 draft 评审证据，文档提交应按最终报告、canonical A/B 证据和 snapshot 精确暂存，避免连带所有尝试记录。

本次未启动额外测试、未修改产品文件、未暂存或提交。
