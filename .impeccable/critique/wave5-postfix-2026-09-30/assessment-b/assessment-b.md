⚠️ DEGRADED: single-context (CUA browser unavailable in the subagent; a fresh Playwright Chromium page was used as the browser-evidence fallback)

# Wave 5 postfix Assessment B

本次只执行 Assessment B，未读取 Assessment A，未修改源码。目标为：

- `linkx-fe/src/components/LxDialog/index.vue`
- `linkx-fe/docs/components/lxdialog.md`
- `linkx-fe/src/components/LxDrawer/index.vue`
- `linkx-fe/docs/components/lxdrawer.md`

同时补取对应的 LxPageCard 文档交互证据，用于错误恢复和 API 表格滚动场景。

## 1. CLI detector 证据

四个目标均执行 `detect.mjs --json`，每个目标的 stdout 为 `[]`，stderr 为空，退出码为 `0`。

| 目标 | stdout JSON | stderr | 退出码 |
| --- | --- | --- | --- |
| LxDialog 源码 | `lxdialog-source.stdout.json` | `lxdialog-source.stderr.txt` | `lxdialog-source.exitcode.txt` |
| LxDialog 文档 | `lxdialog-doc.stdout.json` | `lxdialog-doc.stderr.txt` | `lxdialog-doc.exitcode.txt` |
| LxDrawer 源码 | `lxdrawer-source.stdout.json` | `lxdrawer-source.stderr.txt` | `lxdrawer-source.exitcode.txt` |
| LxDrawer 文档 | `lxdrawer-doc.stdout.json` | `lxdrawer-doc.stderr.txt` | `lxdrawer-doc.exitcode.txt` |

原始 detector 文件位于：

`F:\work\linkx-admin\.impeccable\critique\wave5-postfix-2026-09-30\assessment-b\`

## 2. 浏览器取证方式与 overlay

由于当前 subagent 没有可用的 CUA browser（`cua.getState()` 返回空 browsers，创建 `iab` 标签失败），使用新的 Playwright Chromium headless context/page 完成独立浏览器取证。浏览器 executable 为本机 Chrome，文档服务为：

`http://localhost:4185`

每个视图都先设置 `[Human] ...` 标题，再注入：

`http://127.0.0.1:8400/detect.js?wave5-postfix=20260930...`

overlay 注入成功；每个视图的 console sidecar 均记录 `[impeccable] ... anti-patterns found`。用于自动化的脚本保存在：

- `postfix-browser-evidence.cjs`
- `postfix-browser-continuation.cjs`

证据目录共保存 16 张 PNG、16 份同名 `.console.json`、16 份 `.requests.json` 和 16 份 `.meta.json`。

## 3. 状态覆盖

### LxDialog

- 桌面亮色打开：`screenshots/dialog-desktop-bright-open.png`
- 桌面亮色按 ESC 后：`screenshots/dialog-desktop-bright-esc.png`，弹窗关闭
- 桌面 HUD 打开：`screenshots/dialog-desktop-hud-open.png`
- 桌面 HUD 按 ESC 后：`screenshots/dialog-desktop-hud-esc.png`，弹窗关闭
- 375px 亮色打开：`screenshots/dialog-mobile-bright-open.png`
- 375px 亮色按 ESC 后：`screenshots/dialog-mobile-bright-esc.png`，弹窗关闭
- 375px HUD 打开：`screenshots/dialog-mobile-hud-open.png`

### LxDrawer

- 桌面亮色打开：`screenshots/drawer-desktop-bright-open.png`
- 桌面亮色按 ESC 后：`screenshots/drawer-desktop-bright-esc.png`，抽屉关闭
- 桌面 HUD 打开：`screenshots/drawer-desktop-hud-open.png`
- 375px 亮色打开：`screenshots/drawer-mobile-bright-open.png`
- 375px HUD 打开：`screenshots/drawer-mobile-hud-open.png`

移动 Drawer 打开后统一等待 1600ms，再截图和写入 `.meta.json`，避免把滑入动画中间帧当作最终状态。

### LxPageCard

- 错误态：`screenshots/pagecard-desktop-error.png`，`展示错误态` 已选中并显示红色错误面板。
- 错误恢复：`screenshots/pagecard-desktop-error-recovered.png`，点击 `刷新概况` 后恢复统计内容，错误态复选框取消。

### API 表格滚动

- Dialog API 表格滚动：`screenshots/dialog-api-table-scroll.png`
- Drawer API 表格滚动：`screenshots/drawer-api-table-scroll.png`

两个页面均滚动到 API 标题并继续下移 160px，截图可见表格行与 API 说明内容。

## 4. 浏览器 console / overlay 结果

每个 PNG 对应的原始日志在 `screenshots/<name>.console.json`。规则按视图归纳如下：

| 视图 | overlay 规则 |
| --- | --- |
| Dialog 桌面亮色/HUD、API 滚动 | `line-length`, `buried-raster`, `layout-transition` |
| Dialog 375px 亮色/HUD | 上述规则 + `clipped-overflow-container`, `edge-flush-cards` |
| Drawer 桌面亮色/HUD、API 滚动 | `buried-raster`, `line-length`, `layout-transition` |
| Drawer 375px 亮色/HUD | 上述规则 + `clipped-overflow-container`, `edge-flush-cards` |
| PageCard 错误/恢复 | `low-contrast`, `buried-raster`, `line-length`, `layout-transition` |

可见标记主要落在 VitePress 文档外壳、复制代码按钮、API 表格和文档正文；`buried-raster`、`line-length`、`layout-transition` 更像文档外壳或 detector 启发式命中。移动视图的 `clipped-overflow-container`/`edge-flush-cards` 已保留原始截图，后续可再人工确认是否属于窄屏文档容器。PageCard 的 `low-contrast` 标记落在“最近一次状态采集”和辅助元数据附近；错误态与恢复态均保留。

少数 console 日志还记录了 `http://localhost:4185/favicon.ico` 的 404，这是文档静态资源缺失，不影响组件示例交互。

## 5. 外部请求清单

汇总文件：`external-requests-summary.json`。

- request sidecar 数量：16
- `localhost` 请求：6496
- `127.0.0.1` 请求：16（仅 detector overlay）
- 外部请求：0

每个视图的完整 URL 清单均在同名 `.requests.json` 中，未发现第三方或真实后端请求。

## 6. 限制与交付结论

- 这是降级浏览器证据：CUA 在本 subagent 中不可用，因此不能声称是 CUA 原生可见标签；已使用新的 Playwright Chromium page，并把该限制写入首行和 `continuation-summary.json`。
- 文档服务 `localhost:4185` 可访问，所有目标页面和交互状态均能加载。
- `postfix-browser-evidence.cjs` 首轮在 Drawer 移动 HUD 切换前等待超时；已停止该尝试并用短超时 continuation 脚本补齐 `drawer-mobile-hud-open`、PageCard 错误恢复和两页 API 滚动证据。最终 16 个视图均有完整 PNG/console/request/meta sidecar。
- 本阶段没有修改源码、文档源码或构建产物。
