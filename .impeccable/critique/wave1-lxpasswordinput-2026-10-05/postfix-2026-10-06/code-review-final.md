# LxPasswordInput 最终实现代码复核

## 结论

需修正后认可：发现 1 项 P2，位于减少动效的 E2E 断言。未发现 P0/P1 问题。组件实现中的焦点边界、受控值与属性透传、HUD 令牌作用域及 ARIA 路径未发现本次差异引入的可复现功能问题。

## 发现

### [P2] 减少动效断言没有验证过渡效果

`other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts:173` 切换 `prefers-reduced-motion` 后，下一行只断言访问密码输入框可见。无论 `.password-input-demo__advanced-icon` 是否仍保留 160ms 旋转过渡，这个输入框都会可见，所以移除 `linkx-fe/src/components/LxPasswordInput/demo/basic.vue:253` 的减少动效规则也不会使该测试失败。该测试因此无法保护新增的减少动效行为。

建议在切换媒体偏好前后读取该图标的计算样式，并断言 `transition-duration` 在减少动效时为 `0s`（或等价地断言其过渡被关闭）。

## 审查范围与边界

相对当前 `HEAD` 审查了：

- `linkx-fe/src/components/LxPasswordInput/index.vue`
- `linkx-fe/src/components/LxPasswordInput/types.ts`
- `linkx-fe/src/components/LxPasswordInput/demo/basic.vue`
- `linkx-fe/docs/components/lxpasswordinput.md`
- `other-admin/admin-vue3/tests/unit/lx-password-input.test.ts`
- `other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts`

为核对透传与主题变量，只读取了直接相关的 `linkx-fe/src/components/LxInput/index.vue`、`linkx-fe/src/components/LxInput/types.ts` 及 `linkx-fe/src/tokens/variables.css`、`linkx-fe/src/tokens/theme-hud.css`。未读取 `.impeccable/critique/**` 中已有的审核或评估证据，也未参考此前代码审核结果。

按任务要求未运行测试；本结论是基于源码差异的静态复核，未验证浏览器运行行为。

## 2026-10-06 复核：P2 尚未关闭

更新后的 `other-admin/admin-vue3/tests/e2e/lx-password-input-docs.spec.ts:175` 读取 `.lx-password-input__toggle` 本体的 `transitionDuration`。该按钮的基础样式没有声明过渡；即使移除 `linkx-fe/src/components/LxPasswordInput/index.vue:195` 中的减少动效规则，按钮本体仍会计算为默认的 `0s`，因此当前断言仍可通过，不能证明减少动效规则生效。

本波新增的实际 160ms 过渡位于 `linkx-fe/src/components/LxPasswordInput/demo/basic.vue:217` 的 `.password-input-demo__advanced-icon`，其减少动效规则位于同文件 `:253`。E2E 应测量该箭头；建议在 `no-preference` 下先断言其计算时长大于零，再切换为 `reduce` 并断言最大时长不超过 `0.00001s`。

新增的逗号列表解析会分别处理 `s` 与 `ms` 并取最大值，针对有效的计算样式时长是合理的；问题在于当前读取了没有基础过渡的错误元素。此次仅静态复核差异，未运行测试。

## 2026-10-06 复核：P2 已关闭

最新 E2E 断言改为读取 `.password-input-demo__advanced-icon`，与 Demo 中 `transform 160ms` 的实际动效选择器一致；普通偏好基线要求时长大于 0，切换 `prefers-reduced-motion: reduce` 后要求时长为 0。结合源码中的媒体查询，该断言能捕获减少动效规则失效，原 P2 已关闭。

一个小的稳定性建议：在读取普通时长前显式调用 `page.emulateMedia({ reducedMotion: 'no-preference' })`，避免基线依赖浏览器或运行环境的默认媒体偏好。秒值由 `Number.parseFloat` 读取后用于正数和零比较，与当前单一过渡声明相符。

此次仅做静态复核，未运行测试。

## 2026-10-06 最终复核：P2 确认关闭

最新 E2E 先显式模拟 `reducedMotion: 'no-preference'`，再读取 `.password-input-demo__advanced-icon` 的普通过渡时长；该元素对应源码中唯一的 `transform 160ms` 过渡。随后切换到 `reduce` 并要求时长 `<= 0.00001`，与同一元素的 `transition: none` 规则一致。顺序、目标元素和断言均准确，原 P2 已关闭。

本次仅静态复核，未运行测试。
