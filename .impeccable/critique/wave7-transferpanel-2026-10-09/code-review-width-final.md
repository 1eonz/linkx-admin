# LxTransferPanel 宽度改动代码复审

## 结论

发现 1 项需修复的问题：桌面宽度 E2E 将“最大宽度 760px”断言成“固定宽度 760px”，在仓库默认 Playwright 视口下失败。Demo 样式及中文文档本身与最大宽度、窄屏自适应的行为一致；本次只读审查未修改组件或测试代码。

## 问题

- **[P1] 默认桌面视口下宽度断言失败** — `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:479`。该用例未设置桌面视口，沿用 `Desktop Chrome` 的 1280px 宽度。当前文档列可用宽度为 720px，组件宽度实测也是 720px；`max-width: 760px` 只限制上限，并不要求窄于上限的父容器也扩宽至 760px。定向 Playwright 用例在此断言收到 `Expected: 760, Received: 720`，因此默认 E2E 检查会失败。建议在断言前设置足够宽的桌面视口并验证限宽效果，或将断言改为不超过 760px；需要验证居中时应保证父容器确实宽于预览。

## 相关核对

- Demo 的 `.transfer-panel-demo__surface` 使用 `max-width: 760px` 和 `margin-inline: auto`，是合理的上限与自动居中组合：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:446`。
- 中文文档说明“最大宽度为 760px 并居中，窄屏仍使用全部可用宽度”，与 CSS 语义一致：`linkx-fe/docs/components/lxtransferpanel.md:3`。
- 窄屏断言在 390px 下要求面板与 surface 同宽，但没有直接断言该宽度等于父级可用宽度：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:482`。当前浏览器测量确认 390px 视口下父级可用列、surface 和组件均为 342px，无横向溢出；可考虑让 E2E 也直接检查 surface 覆盖可用列。

## 当前验证证据

- 定向 E2E：`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-transfer-panel-docs.spec.ts --grep '文档预览桌面限宽居中'`，失败于上述 760px 固定宽度断言。
- 使用当前源码启动 lx-ui 文档服务并在浏览器测量：1280px 视口为 720px；1440px 视口为 760px；390px 视口为 342px；三个宽度均未产生页面横向溢出，组件均在预览容器中居中。
