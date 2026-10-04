# LxDatePicker Assessment B 复验报告

记录日期：2026-10-04（Asia/Shanghai）。本报告仅记录 Assessment B 的静态 detector 与浏览器证据，不引用或合并 Assessment A 的结论，也不代表完整正式 Critique 通过。

## 审查基线

静态目标为 `linkx-fe/src/components/LxDatePicker/index.vue`、`linkx-fe/src/components/LxDatePicker/demo/basic.vue` 和 `linkx-fe/docs/components/lxdatepicker.md`。其 SHA-256 与最终 detector 快照一致，Git `HEAD` 为 `2a93ef1a447fc4a72f688471cc14a0692703be60`；具体指纹见 [target-fingerprint.md](../target-fingerprint.md)。

浏览器目标为 `http://127.0.0.1:4188/components/lxdatepicker.html#交互示例`，Chrome `154.0.8037.95`，使用互相隔离的 Playwright 页面上下文。4188 仅用于本报告的浏览器证据；detector 脚本由 `127.0.0.1:8400/detect.js` 提供。执行脚本见 [capture.cjs](../assessment-b-final-live-4180-2026-10-04/capture.cjs)。

## 静态 Detector

三目标均检查了 stdout JSON、stderr 和退出码。每个 JSON 为 `[]`、stderr 为 0 字节、退出码为 `0`：

| 目标 | JSON | stderr | 退出码 |
| --- | --- | --- | --- |
| `index.vue` | [stdout](../assessment-b-final-latest-2026-10-04/detector-index.vue.stdout.json) | [stderr](../assessment-b-final-latest-2026-10-04/detector-index.vue.stderr.txt) | [exit code](../assessment-b-final-latest-2026-10-04/detector-index.vue.exit-code.txt) |
| `demo/basic.vue` | [stdout](../assessment-b-final-latest-2026-10-04/detector-demo-basic.vue.stdout.json) | [stderr](../assessment-b-final-latest-2026-10-04/detector-demo-basic.vue.stderr.txt) | [exit code](../assessment-b-final-latest-2026-10-04/detector-demo-basic.vue.exit-code.txt) |
| `docs/components/lxdatepicker.md` | [stdout](../assessment-b-final-latest-2026-10-04/detector-docs-lxdatepicker.md.stdout.json) | [stderr](../assessment-b-final-latest-2026-10-04/detector-docs-lxdatepicker.md.stderr.txt) | [exit code](../assessment-b-final-latest-2026-10-04/detector-docs-lxdatepicker.md.exit-code.txt) |

这些 `[]` 只代表三份源码目标未命中静态规则，不代表浏览器运行态没有问题。

## 浏览器证据

完整状态记录、脚本 stdout/stderr/退出码、请求记录和控制台记录分别见 [browser-full-state.json](browser-full-state.json)、[browser-full-state.stdout.json](browser-full-state.stdout.json)、[browser-full-state.stderr.txt](browser-full-state.stderr.txt)、[browser-full-state.exit-code.txt](browser-full-state.exit-code.txt)、[requests.json](requests.json) 和 [browser-console.json](browser-console.json)。浏览器任务退出码为 `0`、stderr 为空、page error 为 `0`。遥测记录 2044 个请求和响应、无 failed request，响应码均为 200；控制台另记录一条 `http://127.0.0.1:4188/favicon.ico` 的 404，按独立控制台证据保留。

HUD 区间面板的可见日历文字另用 [inspect-hud-text.cjs](inspect-hud-text.cjs) 取样，分别检查亮色文档和暗色文档；两次诊断均为退出码 `0`、stderr 为空。原始结果见 [亮色 HUD](hud-text-colors.json) 与 [暗色 HUD](hud-text-colors-dark.json)，以及对应的 [亮色退出码](hud-text-colors.exit-code.txt)、[亮色 stderr](hud-text-colors.stderr.txt)、[暗色退出码](hud-text-colors-dark.exit-code.txt)、[暗色 stderr](hud-text-colors-dark.stderr.txt)。

- 桌面亮色双月：弹层为 `648×331`，位于 `1440×1000` 视口内。截图：[原图](desktop-light.png)、[overlay](desktop-light-overlay.png)。
- 桌面亮色页面 + HUD：弹层带 `lx-theme-hud`。普通日期与星期文字是 `rgb(148, 163, 184)` 对 `rgb(22, 35, 58)`，对比度约 `6.13:1`；区间日期是 `rgb(148, 163, 184)` 对 `rgb(242, 246, 252)`，约 `2.36:1`；起止日期白字对 `rgb(56, 189, 248)`，约 `2.14:1`。截图：[原图](desktop-hud.png)、[overlay](desktop-hud-overlay.png)。
- 暗色文档 + HUD：普通日期对深色面板约 `6.13:1`，区间日期对 `rgb(43, 43, 44)` 约 `5.52:1`；起止日期白字对 `rgb(56, 189, 248)` 仍约 `2.14:1`。截图：[原图](desktop-hud-dark.png)、[overlay](desktop-hud-dark-overlay.png)。
- 375×812 移动视口：单月弹层为 `324×365`，坐标 x=26、y=440，右/下边界 x=350、y=805，完整处于视口内；页面 scroll width 为 375。截图：[原图](mobile-375.png)、[overlay](mobile-375-overlay.png)。
- 键盘：ArrowDown 打开面板并聚焦 15 日；ArrowRight 将值从 `2026-09-15` 更新为 `2026-09-16`；Enter 选中并关闭面板，焦点回到输入框；各视觉状态中打开面板后按 Escape 均能关闭。
- 减少动效：`prefers-reduced-motion` 从不匹配变为匹配时，transition duration 从 `0.2s` 降至 `1e-05s`。

Detector overlay 的 DOM `scan.count` 为桌面亮色 28、亮色 HUD 32、暗色 HUD 237、移动端 23；console 文本分别报告 25、27、232、19。两个来源的原始结果均已保留，计数不一致，不合并为一个总数或缺陷数。

## 复核结论

确认的组件可读性问题是 HUD 区间面板的起止日期文字：亮、暗两种文档主题下均为白字对 `rgb(56, 189, 248)`，只有 `2.14:1`；亮色文档 + HUD 下区间文字也只有 `2.36:1`。普通日期和暗色文档下的区间文字对比度通过。另有 Demo hint/status 文案低对比命中（检测值包括 `3.2:1`、`2.9:1` 和 `2.6:1`）及较长说明行，建议按普通正文至少 `4.5:1` 复核并修正。文档交互示例还命中 `h2` 后跳到 `h4` 和约 86 字符长行，可作为文档层级与可读性问题处理。

Overlay 在展开弹层时会覆盖弹层后方的 Demo 内容；行内 `text-occlusion`、HUD 暗色页大量 `ai-color-palette` 及 VitePress 外壳命中不能直接计为组件缺陷。禁用日期的低对比命中也需结合其禁用状态单独核对。该报告未修改产品源码。

4174 的初次连接失败记录在 [browser-4174-failure.stderr.txt](../assessment-b-final-live-4180-2026-10-04/browser-4174-failure.stderr.txt)，未作为通过证据；最终浏览器证据来自 4188。服务清理后，本轮自己的 4180（PID 37164）已停止；上游/A 使用的 4188（PID 8944）和共享 detector 8400（PID 15260）仍在监听，本轮未停止。由 root/A 在确认共享评审完成后负责清理。
