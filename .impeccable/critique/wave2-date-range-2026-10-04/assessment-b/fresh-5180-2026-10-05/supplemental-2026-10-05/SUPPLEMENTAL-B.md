# Assessment B 补充证据

本目录仅补充 Assessment B 的浏览器证据；未读取 Assessment A 输出或修改应用源码。目标为 `http://127.0.0.1:5180/components/lxdatepicker`，使用已安装 Edge channel，每种状态各自建立全新的 390×375 Playwright Chromium context。视口、状态、完整 console/network、CSS 请求与 wheel 数值保存在 `supplemental-browser-evidence.json`。

## HUD 快捷区间弹层

先勾选“HUD 深色主题”，再打开快捷区间弹层。稳定后 HUD 状态仍为开启，弹层保持可见，class 同时包含 `.lx-date-picker-demo__shortcuts-popper` 和 `.lx-theme-hud`。弹层边界为 x=14、y=8、362×359；内部滚动区域是弹层本身（`overflow-y: auto`，`scrollHeight=424`、`clientHeight=357`），快捷按钮为今日、本周、近30天，共 3 个。

- 状态截图：`hud-shortcuts-popup-open.png`
- overlay 截图：`hud-shortcuts-popup-overlay.png`
- detector overlay 脚本返回 200 且注入成功；console 输出 42 条 anti-pattern 命中。计数覆盖 VitePress 文档页，不能直接等同于组件缺陷数。

## 普通区间弹层与滚轮

另一个全新 context 打开普通主区间弹层。稳定后的边界为 x=33、y=221、324×365（底边 y=586，超出 375px 视口）。弹层 `overflow-y` 为 `visible`，自身 `scrollTop=0`；弹层内没有 `scrollHeight > clientHeight` 且可滚动的容器。

在弹层中点位派发真实 `page.mouse.wheel(0, 360)` 后，`window.scrollY` 从 357 增至 717，弹层 `scrollTop` 仍为 0，弹层顶边从 y=221 移至 y=-139。该状态说明 wheel 滚动了文档，普通主区间弹层没有内部滚动容器。

- wheel 前截图：`regular-range-before-wheel.png`
- wheel 后截图：`regular-range-after-wheel.png`
- overlay 截图：`regular-range-after-wheel-overlay.png`
- detector overlay 脚本返回 200 且注入成功；console 输出 17 条 anti-pattern 命中。该计数同样包含 VitePress 页面外壳。

两个 context 的目标页面均返回 200，组件样式请求 `src/components/LxDatePicker/style.css` 均返回 200。没有 page error 或 failed request。HUD context 的 console 有一条通用 404 文案，但采集到的 HTTP responses 全部为 200，且没有对应 failed request，因此无法定位其请求 URL；完整记录保存在 JSON 中。

## 服务清理

文档服务用 `pnpm dev --host 127.0.0.1 --port 5180 --strictPort` 启动，采集后通过 Ctrl+C 结束。Impeccable helper PID 32012、端口 8400，用 `node live-server.mjs stop` 关闭，退出码为 0。helper 输出报告已停止端口 8400；移除 live script 的步骤因缺少 `.impeccable/live/config.json` 留下一条提示。本次只向临时 Edge 页面注入 `detect.js`。结束后确认端口 5173、5180、8400 均无监听。
