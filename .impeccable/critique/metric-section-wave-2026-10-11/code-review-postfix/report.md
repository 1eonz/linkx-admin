# LxMetricCard + LxSectionTitle + LxTag 最终代码复审（Postfix）

日期：2026-10-11

## 结论

适配器上一轮的 `headingLevel` 缺口已修复，且新增回归覆盖默认 `h3` 与显式 `h4`。`LxTag` 小尺寸上下 2px、左右 6px 的实现与文档、浏览器计算样式断言一致。

发现 1 项 P2 公共类型契约缺口：`LxSectionTitleHeadingLevel` 已定义并用于组件 Props，但没有从 `lx-ui` 根入口导出。若本波要求新 API 的公共 TypeScript 类型可按名导入，则该项阻塞提交；它不影响组件运行时或适配器的 `headingLevel` 透传。

## Findings

- **P2：新标题层级类型没有从公共入口导出。** `linkx-fe/src/components/LxSectionTitle/types.ts:6` 定义了 `LxSectionTitleHeadingLevel`，`LxSectionTitleProps.headingLevel` 在 `:12` 使用它；但 `linkx-fe/src/index.ts:146-151` 只导出 `LxSectionTitleProps`、`LxSectionTitleSize`、`LxSectionTitleTagType` 和 `LxSectionTitleVariant`，没有导出该新类型。因此包使用者不能通过受支持的 `import type { LxSectionTitleHeadingLevel } from 'lx-ui'` 获得该类型，和同一组件其他公开类型的导出约定不一致。建议把类型加入根入口导出，并补一条公共入口类型检查。提交阻断：条件性阻断，取决于本波是否把 `headingLevel` 作为完整公共 TypeScript API 交付；不阻断当前运行时行为。

## 已确认修复

- `other-admin/admin-vue3/src/components/SectionTitle/index.vue:13` 已把 `headingLevel` 纳入 `Props`，`:53` 显式绑定到 `LxSectionTitle`。
- `other-admin/admin-vue3/tests/unit/section-title-adapter.test.ts:26-41` 传入 `headingLevel: 4` 并断言输出 `h4`；默认适配器用例仍断言 `h3`。
- `linkx-fe/src/components/LxTag/index.vue:51-55` 使用 `padding: 2px 6px`；SectionTitle 文档 Playwright 在 `other-admin/admin-vue3/tests/e2e/lx-section-title-docs.spec.ts:40-56` 检查实际计算出的四向内距。

## 验证

- 目标单测：4 个文件、32/32 通过（MetricCard、SectionTitle、SectionTitle 适配器、LxTag）。
- 文档 Playwright：4/4 通过（MetricCard 3 项、SectionTitle 1 项），覆盖适配器层级、Tag 间距、状态文本、RTL、主题、减少动效和窄屏行为。
- `linkx-fe` `pnpm typecheck`：通过。
- Vue3 宿主 `pnpm run lint:ts`：通过。
- 宿主定向 ESLint：通过。
- 指定文件 Prettier：宿主和库文件均通过；库文件使用 Vue3 宿主已安装的 Prettier 执行。
- `git diff --check`：通过。

未读取 Impeccable Assessment A/B 报告；本复审只依据当前工作树源码、测试、文档和上述自动化验证。
