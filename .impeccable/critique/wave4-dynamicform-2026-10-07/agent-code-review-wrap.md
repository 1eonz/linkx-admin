# Wave 4 代码复审

复审范围：`LxDatePicker`、`LxDynamicForm`、`LxUpload` 的实现和对应单测/E2E，以及 `playwright.lxui.config.ts` 的端口配置。仅做静态只读检查；按要求未运行浏览器、测试或包管理安装。

## 发现

### 已关闭（原 P2）：lxswitch 文档 E2E 端口不一致

初次复核发现 [`playwright.lxui.config.ts`](../../../other-admin/admin-vue3/playwright.lxui.config.ts:9) 的 `testMatch` 包含 `lx-switch-docs.spec.ts`，但该 spec 曾将 `baseURL` 和本地来源白名单固定到 `4176`。当前配置的 `baseURL`、Vite 服务命令及探测 URL 均为 `4177`（配置第 12、15-16 行）；[`lx-switch-docs.spec.ts`](../../../other-admin/admin-vue3/tests/e2e/lx-switch-docs.spec.ts:117) 的测试上下文 `baseURL` 与第 127 行本地来源白名单也已同步为 `4177`，第 141 行相对路径导航因此使用同一来源。端口不一致风险已关闭。

复审阶段只做静态检查，未运行用例；主 Agent 后续使用 `pnpm exec playwright test --config=playwright.lxui.config.ts tests/e2e/lx-switch-docs.spec.ts --reporter=list` 实测 **6/6 通过**，确认导航和本地来源拦截与 4177 一致。

## 其他范围

对上述三个组件及其新增单测/E2E 做了静态检查，未发现其他明确的 P0–P2 问题。组件交互和浏览器渲染未在本次复审中执行验证。
