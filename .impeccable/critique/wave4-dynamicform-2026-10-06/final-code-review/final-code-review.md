# LxDynamicForm 独立代码复审

审查范围：`linkx-fe/src/components/LxDynamicForm/`、相关 `LxUpload` 适配、Vue3 单测与文档 E2E、中文文档。仅检查当前工作区；未修改产品源码，未运行测试或构建。

结论：**请求修改**。发现 3 项 P2 和 1 项 P3。日期区间校验、密码字段、上传 URL/response 回传和新增回归用例未发现本次改动引入的其他明确问题。

## P2

### Demo 的预览重试改变主表单的模拟模式

`linkx-fe/src/components/LxDynamicForm/demo/basic.vue:357` 的 `retrySchemaPreviewCandidates()` 把主表单与字段预览共用的 `candidateMode` 改为 `success`，却只重新加载预览请求。若主表单当前显示失败，预览重试后“成功”状态按钮会被选中，而主表单仍显示失败；之后主表单查询又会按新模式成功。两个表单的查询状态相互独立，但演示模式被交叉修改，导致状态控制和可见结果不一致。为预览单独维护模式，或让重试仅影响预览请求。

### E2E 网络拦截允许部分同源后端路径

`other-admin/admin-vue3/tests/e2e/lx-dynamic-form-docs.spec.ts:16` 只排除了有限的路径前缀，`:17` 又把任意以静态扩展名结尾的路径列入允许集合。因此同源 GET `/uploads/avatar.jpg` 不匹配当前单数 `upload` 前缀，却因 `.jpg` 被当作静态资源而放行到 `route.continue()`（`:30`）。若文档 origin 代理或承载该路径，测试的网络隔离断言无法发现这类后端请求。应将允许项收窄到文档服务实际需要的资源路径，或显式覆盖后端文件路径。

### 被拦截 URL 原样写入 Playwright 附件

`:25` 将完整 `request.url()` 存入列表，`:51-53` 再把列表作为测试附件保存。若被拦截 URL 的 query 携带 token 或其他敏感值，该值会进入测试产物；这违反仓库关于不得在日志或 URL 中泄漏凭据的要求。记录前应移除 query/hash 或按键名对敏感参数脱敏，同时保留定位请求所需的 origin 与 pathname。

## P3

### 项目地图与迁移台账仍把 DynamicForm 记作下一入口

本轮已扩展 DynamicForm 字段 renderer、日期区间和上传值契约，并增加相应单测与文档 E2E；但 `doc/PROJECT-MAP.md:9`、`:55` 及 `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md:8`、`:47` 仍把它描述为后续入口或 2026-10-03 的旧复验。按仓库规则，组件和验收状态变化应同步到项目地图及迁移台账。请补本波范围、验证证据与尚未关闭的审查边界，避免后续工作依据过期状态排期。

## 验证边界

本复审为源码只读检查，没有运行单测、E2E、类型检查或构建；验证结果应以主 Agent 独立运行的记录为准。报告不代表 Impeccable 正式 Critique 通过，也不代表真实后端联调完成。
