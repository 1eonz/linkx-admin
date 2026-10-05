# Assessment B：Detector 与浏览器证据

本记录来自独立的 Assessment B 子代理；未读取 Assessment A 的发现。Assessment B 的 CLI 与 overlay 均实际运行，但截图仅以内联 CUA 图像返回、未保存到目录，因此浏览器证据档案为降级状态，不是正式 Critique 通过证明。

## CLI Detector

分别扫描组件源码和文档实际引用的 Vue demo：

- `linkx-fe/src/components/LxDatePicker/index.vue`：stdout JSON 为 `[]`，stderr 为空，退出码 `0`。
- `linkx-fe/src/components/LxDatePicker/demo/basic.vue`：stdout JSON 为 `[]`，stderr 为空，退出码 `0`。

原始 stdout、stderr、退出码及命令记录分别保存在同目录 `component.*` 和 `docs-demo.*` 文件中。`[]` 只表示这两个静态目标没有规则命中，不表示运行页面视觉验收通过。

## Overlay 与浏览器

文档地址 `http://127.0.0.1:4174/components/lxdatepicker.html` 可访问。CDP 写入式预检通过：标题改写、script 节点追加和 inline probe 执行均成功，随后清理并恢复页面。detector overlay 从 `http://127.0.0.1:8400/detect.js` 注入成功；console 报告 `14 anti-patterns found`。

DOM overlay 标签涵盖长行、文档列宽、raster wash、正文 em-dash 统计和 transition 属性等。它们是在文档页整体上扫描的；目前只有长行标签可定位到 demo 说明文本附近。其余规则归属尚未确认，自动命中数不能视为组件缺陷数。

桌面浅色弹层显示双面板。键盘检查观察到 ArrowDown 聚焦起始日、ArrowRight 将焦点前移一天、Enter 后输入值未变且 demo 状态文案未更新；Escape 后输入恢复焦点、`aria-expanded=false` 且弹层隐藏。HUD 下 popper 使用 `lx-theme-hud`，计算背景色为 `rgb(22, 35, 58)`。390x844 窄屏下显示一个面板、弹层宽 324px，结束输入的 ArrowDown 聚焦结束日；文档根宽 886px，属于尚未定位节点的页面级横向溢出观察，不归因于日期弹层。

详细交互结果见 `browser-state-evidence.log`；注入与 console 见 `browser-overlay.log`；截图限制见 `browser-captures.md`。

## 截图与服务清理

CUA native 截图 API 返回并显示 1 张桌面浅色概览图（1280x720，overlay 可见），但没有提供本地文件导出接口，故本轮目录中没有截图文件；捕获画面也未打开区间日历。IAB `visibility.set(true)` 因子代理线程限制失败，未能把标签切至前台。此项限制和可见截图清单记录在 `browser-captures.md`。

本次启动的 critique live-server 已执行 `node .../live-server.mjs stop --keep-inject` 停止，PID `23648` 已退出，端口 `8400` 已关闭。停止命令、stderr 和退出码保存在 `live-server-stop.*`；4174 文档服务未停止。
