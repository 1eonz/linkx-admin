# LxDatePicker Assessment B：Detector 与浏览器证据

## 范围与隔离

本报告只记录 Assessment B。目标源码为 `linkx-fe/src/components/LxDatePicker/demo/basic.vue`，浏览目标为 `http://127.0.0.1:5180/components/lxdatepicker`。本次未读取 Assessment A 输出或旧 critique 报告、截图、detector 输出，也未改动应用源码。

所有新证据位于本目录。Playwright 从 `other-admin/admin-vue3/node_modules` 加载，使用已安装的 Edge channel，并为桌面、375×812、390×375 分别创建新的 Chromium context。

## Detector

执行命令：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxDatePicker/demo/basic.vue
```

标准输出为 `[]`，stderr 为空，退出码为 `0`。这只表示该目标源码的静态规则零命中，不代表运行页面零问题，也不代表 Critique 通过。

分开保存的原始结果：

- `detector.stdout.json`
- `detector.stderr.txt`
- `detector.exit-code.txt`

## 浏览器观察

目标页面各视图 HTTP 状态均为 200。浏览器完整 console、request/response、CSS 响应、视口尺寸、弹层状态和滚动值记录在 `browser-evidence.json`。

- 桌面默认态：1440×900，截图 `desktop-1440x900-default.png`，无可见弹层。
- 桌面区间弹层：1440×900，截图 `desktop-1440x900-range-popper.png`；有 1 个可见 `.lx-date-picker__popper`，尺寸 648×331。
- 手机区间弹层：375×812，截图 `mobile-375x812-range-popper.png`；有 1 个可见 `.lx-date-picker__popper`，尺寸 324×365。
- 短屏快捷区间弹层：390×375，截图 `short-mobile-390x375-shortcuts-before-wheel.png`；弹层 class 包含 `.lx-date-picker-demo__shortcuts-popper`，边界为 x=14、y=8、362×359，内容高度 424、可视高度 357。实际快捷按钮 3 个：今日、本周、近30天。
- 短屏真实滚轮：对弹层内派发 `page.mouse.wheel(0, 360)`。弹层 `scrollTop` 从 0 变为 67，`window.scrollY` 前后均为 1093。滚动后截图为 `short-mobile-390x375-shortcuts-after-real-wheel.png`。
- HUD 开启态：截图 `short-mobile-390x375-shortcuts-hud.png`，`lx-theme-hud` 状态为 true。点击主题复选框关闭了当时打开的弹层，因此该截图只证明 HUD 主题已打开，不作为 HUD 弹层截图。

主组件样式请求 `src/components/LxDatePicker/style.css` 返回 200；`element-plus/dist/index.css` 和 `src/styles/element-theme.css` 也返回 200。Vite 将这些 CSS import 作为转换后的模块响应提供，响应资源类型显示为 `script`，页面没有独立的 `link[rel=stylesheet]` 项。

## Overlay 与 Console

可变 DOM 预检成功；`http://localhost:8400/detect.js` 在三个代表视图均返回 200，脚本节点注入成功，检测器也在页面中运行。console 分别报告 21（桌面）、16（375×812）、35（390×375 HUD）条 anti-pattern 命中。命中数覆盖完整 VitePress 文档页面，包含文档外壳；它们不是已核实的组件缺陷数。逐条归属和误报判断留待综合评审。

捕获使用 headless Edge context；overlay 截图保存在 `desktop-1440x900-range-popper-overlay.png`、`mobile-375x812-range-popper-overlay.png` 和 `short-mobile-390x375-shortcuts-hud-overlay.png`。没有打开供人工观看的 `[Human]` 标签。

浏览器没有 page error 或 failed request，采集到的 HTTP response 中没有非 200 状态。桌面 console 有 1 条通用 404 文案（`Failed to load resource: the server responded with a status of 404 (Not Found)`），但没有对应的非 200 response 或 failed request，因此本次无法归属请求 URL；该原始 console 记录保留在 `browser-evidence.json`。

## 临时服务清理

目标地址最初拒绝连接。本次用 `pnpm dev --host 127.0.0.1 --port 5180 --strictPort` 启动 `linkx-fe` 文档服务，采集后以 Ctrl+C 结束；启动参数的首次尝试短暂落在默认 5173，也已立即结束。Impeccable helper 以 `node live-server.mjs --background` 启动，PID 41040、端口 8400；随后用 `node live-server.mjs stop` 停止，退出码为 0。停止后检查 5173、5180、8400 均无监听。

helper 停止输出确认端口 8400 已停止；同一输出还记录了 live script 移除步骤因缺少 `.impeccable/live/config.json` 给出的提示。本次未注入 `live.js`，detector 使用的是 `detect.js`，其注入与页面运行均成功。停止输出、stderr 和退出码分别保存在 `helper-stop.stdout.txt`、`helper-stop.stderr.txt`、`helper-stop.exit-code.txt`；启动元数据在 `helper-start.json`。
