# Wave 1 Postfix 代码复审（最终复核）

源码基线：HEAD `48d62ff704eb7f7f09025ef165a19678840ea928` 加当前工作树中 `LxPasswordInput` 实现、类型、中文文档和单测的未提交差异。

实际读取文件：

- `linkx-fe/src/components/LxPasswordInput/index.vue`
- `linkx-fe/src/components/LxPasswordInput/types.ts`
- `other-admin/admin-vue3/tests/unit/lx-password-input.test.ts`
- `linkx-fe/docs/components/lxpasswordinput.md`

本次只复核上述组件及契约，未读取 Assessment A/B 或其他组件，也未修改产品源码。

## 发现

未发现 P0–P2 问题。`getForwardedAttrs()` 复制 `useAttrs()` 并删除 `type`（`index.vue:66-70`），再将过滤结果传给 `LxInput`（`index.vue:101`）。调用方传入 `type="text"` 因而不能覆盖显隐状态驱动的 `:type`（`index.vue:90`）。中文文档现已明确说明 `type` 不作为未声明属性透传（`lxpasswordinput.md:60`），与实现一致。

## 边界与契约

- 普通 `attrs.type="text"` 用例断言输入从 `password` 切换至 `text` 并可再次切回 `password`（`lx-password-input.test.ts:17-28`）。
- 只读组合用例现已关闭上一版报告中的覆盖缺口：使用 `attrs.type="text"` 与 `readonly: true`，断言原生输入初始类型仍为 `password`、readonly 属性存在，点击显隐按钮后类型转为 `text`（`lx-password-input.test.ts:31-45`）。显隐是独立的展示操作；公开文档说明只读输入仍可聚焦和选中，并未要求禁用该按钮。
- 禁用状态下显隐按钮被禁用、输入保持密码类型的用例仍在（`lx-password-input.test.ts:77-81`）；`ElForm` 禁用态继承也有单测（`lx-password-input.test.ts:90-101`）。两者未与 `attrs.type="text"` 组合，不过类型过滤无条件执行，普通及只读组合用例均验证了该过滤行为。
- 剪贴板实现与契约一致：`preventClipboard` 默认 `false`（`index.vue:20`），关闭时默认处理事件，启用时阻止 copy/cut/paste（`index.vue:61-64,107-109`）。Props 类型将其说明为前端事件拦截，不能替代宿主或服务端安全控制（`types.ts:9-10`）；文档 Props 与使用边界已采用同一限定（`lxpasswordinput.md:29,61`）。本轮没有运行浏览器 E2E。

## 验证

`pnpm exec vitest run tests/unit/lx-password-input.test.ts`：通过，1 个文件、7 项测试通过，包含透传 `type` 的显隐往返和只读组合。

## 结论

Approved。此前报告的 P1 已修复，上一版提出的只读组合测试覆盖缺口已关闭。本轮未发现当前可复现的 P0–P2 问题。
