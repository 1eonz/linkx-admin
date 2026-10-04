# LxDatePicker Assessment B 证据记录

记录时间：2026-10-04（Asia/Shanghai）。本文件只记录 B 侧源码扫描和浏览器证据，不代表完整正式 Critique 通过，也不替代独立设计评审 A 侧证据。

## 审查对象与静态 Detector

目标为当前工作树中的 `linkx-fe/src/components/LxDatePicker/index.vue`、`linkx-fe/src/components/LxDatePicker/demo/basic.vue` 和 `linkx-fe/docs/components/lxdatepicker.md`。终检静态扫描针对 [full-state-pass-2026-10-04](./full-state-pass-2026-10-04/) 记录时的内容。三个 JSON 均为 `[]`，stderr 均为 0 字节，退出码均为 `0`：

| 目标 | JSON | stderr | 退出码 |
| --- | --- | --- | --- |
| `index.vue` | [detector-index.vue.stdout.json](./full-state-pass-2026-10-04/detector-index.vue.stdout.json) | [detector-index.vue.stderr.txt](./full-state-pass-2026-10-04/detector-index.vue.stderr.txt) | [detector-index.vue.exit-code.txt](./full-state-pass-2026-10-04/detector-index.vue.exit-code.txt) |
| `demo/basic.vue` | [detector-demo-basic.vue.stdout.json](./full-state-pass-2026-10-04/detector-demo-basic.vue.stdout.json) | [detector-demo-basic.vue.stderr.txt](./full-state-pass-2026-10-04/detector-demo-basic.vue.stderr.txt) | [detector-demo-basic.vue.exit-code.txt](./full-state-pass-2026-10-04/detector-demo-basic.vue.exit-code.txt) |
| `docs/components/lxdatepicker.md` | [detector-docs-lxdatepicker.md.stdout.json](./full-state-pass-2026-10-04/detector-docs-lxdatepicker.md.stdout.json) | [detector-docs-lxdatepicker.md.stderr.txt](./full-state-pass-2026-10-04/detector-docs-lxdatepicker.md.stderr.txt) | [detector-docs-lxdatepicker.md.exit-code.txt](./full-state-pass-2026-10-04/detector-docs-lxdatepicker.md.exit-code.txt) |

仓库级 `.impeccable/critique/ignore.md` 在检查时不存在，见 [ignore-file-status.txt](./ignore-file-status.txt)。静态 `[]` 只表示这些源码目标没有触发静态规则，不表示浏览器运行态没有问题或整体评审通过。

## 完整浏览器复验

目标 URL：`http://127.0.0.1:4174/components/lxdatepicker.html#交互示例`。Google Chrome `154.0.8037.95`，四个视觉状态分别使用隔离页面 context。完整记录、请求记录和控制台记录位于 [browser-full-state.json](./full-state-pass-2026-10-04/browser-full-state.json)、[requests.json](./full-state-pass-2026-10-04/requests.json) 与 [browser-console.json](./full-state-pass-2026-10-04/browser-console.json)。浏览器命令退出码 `0`、stderr 空；2044 个请求均有响应、无失败、均返回 200；`pageerror` 为 0。控制台单独记录到 VitePress `/favicon.ico` 404，另有 detector 汇总日志。

- 桌面亮色：双月面板显示 2026 年 9 月和 10 月，尺寸 `648×331`，视口 `1440×1000` 内。截图：[desktop-light.png](./full-state-pass-2026-10-04/desktop-light.png)、[desktop-light-overlay.png](./full-state-pass-2026-10-04/desktop-light-overlay.png)。
- 桌面 HUD：HUD checkbox 成功切换，demo 根节点进入 HUD 样式，但弹层仍是白底，并且实际浮层 class 缺少 `lx-theme-hud`；尺寸仍 `648×331`。这是本轮可复现的主题传播问题。截图：[desktop-hud.png](./full-state-pass-2026-10-04/desktop-hud.png)、[desktop-hud-overlay.png](./full-state-pass-2026-10-04/desktop-hud-overlay.png)。较早的部分采集曾观察到深色浮层，但该结果与本轮干净 context 的复验不一致，应以这轮绑定当前源码指纹的结果为准。
- 文档暗色：VitePress 暗色外壳成功启用；浮层保持白底，区间选择背景在暗色页面上呈黑色块。截图：[desktop-docs-dark.png](./full-state-pass-2026-10-04/desktop-docs-dark.png)、[desktop-docs-dark-overlay.png](./full-state-pass-2026-10-04/desktop-docs-dark-overlay.png)。
- 移动 375×812：新页面、新视口下打开单月面板；尺寸 `324×329`，位置 x=26、y=434，完整位于视口中。页面 document scroll width 为 615，故虽浮层本身在视口内，文档页仍存在横向溢出信号。截图：[mobile-375.png](./full-state-pass-2026-10-04/mobile-375.png)、[mobile-375-overlay.png](./full-state-pass-2026-10-04/mobile-375-overlay.png)。
- 键盘：ArrowDown 打开日历并聚焦当前日期；ArrowRight 将活动日期和 v-model 从 `2026-09-15` 移到 `2026-09-16`；Enter 关闭面板、将焦点返回输入框，值保持 `2026-09-16`。Escape 在 Enter 已关闭后再次确认面板保持关闭、焦点仍在输入框。
- 减少动效：`prefers-reduced-motion` 从不匹配变为匹配后，输入框 transition duration 从 `0.2s` 变为 `1e-05s`。
- 每个状态都在改变主题或视口前确认日历已关闭；设置完成后才打开日历、截图、注入 detector。标题被设为 `[Human]`，脚本追加与执行预检成功，Detector HTTP 200、424237 字节，SHA-256 `a9ec563a2e11dabdfa6977837b373c0e2a4f96054dab7ac2d7528bd35b124b22`。四个状态都有 DOM overlay PNG；统计 API 的 findings 数为亮色桌面 28、HUD 30、文档暗色 231、375px 20。对应浏览器 console 汇总是 25、26、228、18，数值和 API 结果不完全相同，已分别保留原始证据，不能混写成单一计数。

观察到的 overlay 命中需要区分页面级和组件级。亮色/HUD/暗色的大部分命中覆盖整个 VitePress 页面；浮层后方 label、标题被日历自然遮挡的 `text-occlusion` 属于当前打开浮层造成的背景重叠，不等于浮层内部文字遮挡。实际可见问题包括 HUD checkbox 已开但弹层仍为白底、HUD 区间面板在暗色主题下缺失样式；Detector 对 Demo hint/status 文案低对比和长行的命中也应结合源码及令牌逐项复核。文档暗色的大量 `ai-color-palette` 命中不能直接等同组件缺陷数。

## 失败尝试与限制

首轮浏览器尝试先打开日历并注入 overlay，再点击 HUD checkbox；日历与 Detector banner 截获点击，退出码 `1`。错误和部分证据保留在 [browser-evidence.json](./browser-evidence.json)、[browser-run.stderr.txt](./browser-run.stderr.txt)、[browser-run.stdout.txt](./browser-run.stdout.txt) 和 [browser-run.exit-code.txt](./browser-run.exit-code.txt)。随后一次修订脚本在媒体仿真 API 调用处中止，四个视觉态截图保存在 [full-state-retry-2026-10-04](./full-state-retry-2026-10-04/)；该次退出码 `1`，错误为 `context.emulateMedia is not a function`。完整最终轮把主题和视口设置放在开日历与 overlay 前，并使用 Page 的 `emulateMedia`，退出码 `0`。所有尝试均保留，未覆盖首轮产物。

在子 Agent 上下文中，CUA 的 IAB 新标签调用返回“visibility is not supported in a subagent thread”；所以浏览器证据由独立 Playwright 页面上下文生成，而非可见的新用户标签。截图中的 detector overlay、DOM scanner JSON、控制台记录与注入预检均可核对；不能声称 overlay 出现在用户当前可见标签中。

## 源码状态与服务清理

工作树在本轮协作期间持续变化，最终扫描与浏览器复验时的 SHA-256 和 `HEAD` 见 [target-fingerprint.md](./target-fingerprint.md)。服务 PID `19312`、端口 `8400` 已通过官方 `live-server.mjs stop --target ...\\.live-server-root --keep-inject` 停止；停止后 8400 无监听且 PID 不存在。原有文档服务 PID `36156`、端口 `4174` 仍在运行，未停止。
