# LxTransferPanel 820px 宽度改动复审

## 结论

Demo 的 `820px` 最大宽度、中文说明及当前渲染行为一致。默认 1280px 正文列的宽度断言稳定，1440px 下预览达到 820px，历史未加载项仍保持紧凑元数据行。发现 1 项 E2E 覆盖缺口：居中和窄屏填满断言没有直接比较可用父容器边界。本次只读复审未修改产品源码或测试代码。

## 问题

- **[P2] 居中与窄屏填满断言可能漏过宽度回归** — `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:481`、`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:486`。默认 1280px Playwright 视口下，`.transfer-panel-demo` 和预览 surface 都宽 720px，桌面中心点比较没有超出上限后的剩余空间，不能验证 820px surface 在更宽父容器内居中。1440px 用例检查 820px 宽度和计数单行，但没有检查居中。窄屏断言只要求组件与 surface 同宽，并小于旧值 760px；它没有比较 surface 与可用文档列宽，也没有检查页面横向溢出，因此组件和 surface 同时意外变窄或同时溢出仍可能通过。建议在 1440px 场景验证 surface 相对更宽 Demo 容器居中；在 390px 场景比较 surface 与其可用父容器左右边界，并断言文档没有横向溢出。

## 已确认行为

- Demo 通过 `.transfer-panel-demo__surface { max-width: 820px; margin-inline: auto; }` 设置预览上限和自动居中：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue:446`。
- 文档已同步说明 `820px` 最大宽度及窄屏占满可用宽度：`linkx-fe/docs/components/lxtransferpanel.md:3`。
- 默认 1280px 正文列实际宽度为 720px；相关 E2E 使用 `<=820px` 且 `>600px`，定向用例通过。
- 1440px 下组件和 surface 均为 820px，Demo 容器为 880px，左右各留 30px；实测居中且页面无横向溢出。
- 390px 下可用文档列、Demo、surface 和组件均为 342px，页面无横向溢出。
- 1440px 下历史未加载项所在行高 51px，名称行高 17px；编码、状态、未加载标记和原始键值仍在紧凑元数据行内。默认桌面布局中的相关元数据几何断言也通过。

## 当前验证

- 定向 Playwright：`文档预览桌面限宽居中，窄屏仍占满可用宽度`，通过（1/1）。
- 定向 Playwright：`820px 文档预览中的桌面单侧面板也保持已选计数单行`，通过（1/1）。
- 定向 Playwright：`桌面预览默认 240px，可切换 300px 和标准 380px 并保持 5:2:5`，通过（1/1）。
- 当前源码浏览器测量：1280px 为 720px；1440px 为 820px；390px 为 342px；三种视口均无页面横向溢出。
