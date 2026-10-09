# LxTransferPanel / LxConfirm 代码复审

## 审查范围

按 2026-10-08 当前未提交工作区复核 `LxTransferPanel`、`LxConfirm` 危险按钮样式、对应 Demo、组件文档、单元测试与 Playwright 测试。此次只读产品代码；未运行可能生成或改写工作区产物的测试命令。

## 发现

### [P2] HUD 局部主题没有传递到危险确认框，主题 E2E 断言可能假通过

`linkx-fe/src/components/LxTransferPanel/demo/basic.vue` 只把 `lx-theme-hud` 加在 `.transfer-panel-demo` 上。`linkx-fe/src/components/LxConfirm/index.ts:29` 调用 `ElMessageBox.confirm` 时只传递 `lx-confirm` 类；Element Plus 当前版本默认将 MessageBox 挂载到 `document.body`，源码 `linkx-fe/node_modules/element-plus/es/components/message-box/src/messageBox.mjs:10` 可确认这一默认行为。因此危险确认框不在 Demo 的 `.lx-theme-hud` 子树内。

HUD 令牌 `--lx-color-on-danger` 在 `linkx-fe/src/tokens/theme-hud.css:56` 覆盖为 `#0b1220`，基础令牌在 `linkx-fe/src/tokens/variables.css:39` 是 `#1d2129`。当前危险按钮样式 `linkx-fe/src/components/LxConfirm/style.css:36` 从确认框自身解析令牌，HUD 局部覆盖不会生效。新增 E2E `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:103` 虽在浅色和 HUD 下重复检查，但其 `tokenColor` 探针在同文件第 121 行追加到 `document.body`，读到的是基础令牌；所以 HUD 分支会以确认框当前实际继承的基础值作为期望值，不能证明 HUD 令牌生效。当前背景和悬停令牌在两个主题中相同，真正未覆盖的差异是前景令牌。

建议先明确 MessageBox 是否应跟随组件局部主题。若应跟随，需把主题上下文传到对话框（例如给确认 API 增加受控主题类并施加到 MessageBox 根节点），然后让 E2E 从 `.lx-theme-hud` 元素读取 HUD 令牌并与对话框实际计算样式比较。若对话框设计上始终使用全局基础主题，则应调整测试名称和验证目标，避免把局部 HUD 状态记为已验证。

## 已复核项目

- `inheritChildDescription` 是可选字符串属性；组件只显示去除首尾空格后的宿主文案，不推断权限语义。文案节点使用每实例 ID，组件通过 `querySelector('input[type="checkbox"]')` 将说明同步到原生复选框，而非依赖 `LxCheckbox` 的属性透传。
- 描述变化使用 `flush: 'post'` watcher，在挂载时也执行同步。复用的 `syncAriaDescribedBy` 会保留未由本组件管理的描述 ID，并在说明被清空时移除本组件此前加入的 ID。单测覆盖绑定、更新、移除；Playwright 覆盖真实可访问 checkbox 的 `aria-describedby` 关联。
- “全部加入”按钮附近展示简短提示，提示标记为 `aria-hidden`；完整原因保留在 visually-hidden `role="status"` 节点，并由按钮的 `aria-describedby` 引用。原因消失时描述节点与引用一起移除。单测覆盖短提示、父级相邻位置和完整 ID 关联。
- 危险确认选择器 `.lx-confirm.el-message-box .el-message-box__btns .el-button.el-button--primary.lx-confirm__btn-danger` 的类特异性高于 `linkx-fe/src/styles/element-theme.css:73` 的全局主按钮规则；危险背景、边框、hover/active 及文字令牌均有定义。新增 E2E 检查实际按钮计算色和 hover 色，但 HUD 前景令牌存在上一节所述问题。
- 布局以 `min-width: 0`、`max-width: 100%` 和 `overflow-wrap: anywhere` 限制短提示；移动断点沿用按钮 44px 触控尺寸。E2E 检查 375px 下提示邻近按钮并处于视口宽度内。当前未见 P2 级窄屏缺陷；没有 320px 专项断言，属于额外覆盖空间。

## 验证边界

本轮未执行单测或浏览器测试，因此新增测试仅作为代码中的验收断言，不报告为已运行通过。只读执行 `git diff --check`，未发现空白错误；Git 提示个别文件存在 LF/CRLF 转换提示。

## 结论

复审发现 1 项 P2：HUD 局部主题未传递到危险确认框，且新增主题 E2E 读取了错误作用域的令牌，修复或明确全局主题行为并调整断言后才能关闭此项。未发现 P0 或 P1；本次指定的继承说明与上限提示问题从静态实现及现有测试断言看已修复。
