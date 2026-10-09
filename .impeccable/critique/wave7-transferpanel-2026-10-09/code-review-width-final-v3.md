# LxTransferPanel 宽度回归断言复审（v3）

## 结论

桌面断言现已明确设置 `1440×960` 视口，验证组件宽度为 `820px`，并检查组件相对 Demo 容器居中；这补足了此前默认视口下无法证明限宽居中的问题。指定 Playwright 用例通过（1/1）。仍有 1 项 P2 测试覆盖缺口：窄屏断言只比较组件、surface 和 Demo 三者彼此同宽，没有将其与外层实际可用内容宽度比较，因此三者一起缩窄时仍可能通过。本次仅审查并新增记录，没有修改产品源码或测试代码。

## 问题

- **[P2] 窄屏宽度断言没有验证组件占满外层可用宽度** — `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:487`、`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:490`。当前测试要求组件、surface、`.transfer-panel-demo` 宽度两两相等，并断言文档没有横向溢出；但如果窄屏样式回归使 Demo 整体收窄，例如给 `.transfer-panel-demo` 增加 `max-width: 320px` 并居中，三个宽度仍可相等且页面不溢出，用例仍会通过，即使外层还有可用空间。建议比较 Demo 与其实际 containing block 的内容区左右边界（计算父级 padding/border 后），并保持组件与 surface 的同宽断言。

## 断言评估

- 桌面设为 `1440×960`，直接要求组件宽 `820px`，并比较组件与更宽 Demo 容器中心，能够覆盖最大宽度和居中行为：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:474`。
- 窄屏设为 `390×844`，组件、surface、Demo 三者宽度差不超过 `1px`，同时要求 `scrollWidth === clientWidth`：`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:482`。
- `.toBeLessThan(760)` 是旧的宽度上限检查；它不会造成当前失败，但不能证明窄屏填满可用空间，也无法弥补上述父级边界未比较的问题。
- Demo 当前使用 `.transfer-panel-demo__surface { max-width: 820px; margin-inline: auto; }`，与文档中“预览最大宽度为 `820px` 并居中，窄屏使用全部可用宽度”的说明一致：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:446`、`linkx-fe/docs/components/lxtransferpanel.md:3`。

## 验证

- 定向 Playwright：`pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-transfer-panel-docs.spec.ts --grep '文档预览桌面限宽居中'`，通过（1/1）。
- 运行期间仅出现 Node.js deprecation、颜色环境变量和 pnpm 配置警告；测试退出码为 `0`。
