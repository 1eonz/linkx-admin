# Assessment B 浏览器证据

## 目标指纹

- `linkx-fe/src/components/LxDatePicker/demo/basic.vue`: `506F885E3C22F49FCE51A94B970579D80F5A390F2E24AA86047816FFD4491B4D`
- `linkx-fe/src/components/LxDatePicker/style.css`: `E848DB91083DFB63DDE8065D2AEBD55510EA8D470406EEEF5DB7D396BF23C5DF`

## Detector

- 命令：`node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxDatePicker\demo\basic.vue"`
- Exit code：`0`
- stdout：`[]`
- stderr：空
- 此结果只表示目标 markup 的静态规则零命中。

## 浏览器观察

- 页面：`http://127.0.0.1:5179/components/lxdatepicker`
- 视口：桌面 `1280x720`；窄屏 `375x812`（页面 CSS client width 为 360px）。
- HUD：开。
- Overlay：成功注入 `http://localhost:8400/detect.js`；脚本存在于 DOM，检测器在 console 报 37 项，37 个 overlay 框可见。
- 桌面日期区间用 `ArrowDown` 打开；星期从周一排列；`ArrowRight` 将焦点从 15 移至 16；`Escape` 关闭面板并将焦点还给开始日期输入。
- 桌面弹层 `648x331px`，位置 `left=317, top=330, bottom=661`；未被视口底部裁掉。
- 窄屏触发器宽 `280px`。弹层 `324x365px`，位置 `left=18, top=440, bottom=805`；视口底边为 812px，面板底部可达且留约 7px。日期格实测 `44x46px`。
- 窄屏开始端与结束端都能以 ArrowDown 打开当前端点月份；结束端打开 2026 年 10 月并聚焦 8 日。Escape 关闭面板并还焦。
- 窄屏日期面板打开时文档 `scrollWidth=clientWidth=360`。Props 表格宽 1381px，但其自身 `overflow-x:auto` 且容器宽 312px；横向滚动未扩展到页面。
- 打开面板时向下滚动页面后，弹层随页面滚出视口；重新聚焦日期输入后可重新打开并定位端点。
- `prefers-reduced-motion: reduce` 生效；组件触发器过渡时长计算为 `1e-05s`。

## Overlay 命中归属

- Console 原文见 `browser-console.json`。运行报告共 37 项。
- DOM 框主要落在 `.lx-date-picker-demo__panel`、`.el-date-table-cell`、图标 `path` 以及 `.curtain`；框标签以 `ai color palette` 为主。设计令牌与图标配色来自当前组件主题，需按源码样式核对，不能据此将命中数视为缺陷数。
- Console 逐条输出中 `ai-color-palette` 为 33 次，目标包括区间日历图标、Element Plus 图标/日期文本节点、日期标记 SVG。主题以令牌驱动且 HUD 明确使用青色强调，属于设计相关命中，需结合设计意图判读，不能按 33 项缺陷处理。
- `buried-raster` 为 2 次且目标选择器均是 VitePress 的 `button.copy`，属于文档外壳误报；页面没有对应的日期选择器图片背景。
- `em-dash-overuse` 在 body 命中 14 个破折号（1 条 advisory）；`layout-transition` 命中 body 的高度/内边距过渡，均是文档页全局文本或外壳规则。
- `first-viewport-column-overflow` 命中 `div.container`，描述长文档列高于首屏；这是整个组件文档页的纵向结构信号，不等价于日期面板布局缺陷。
- 窄屏初始截图中 overlay 标签本身超出视口并令 `scrollWidth` 临时到 536px；关闭 overlay 后页面 `scrollWidth=360px`。这是检测标注层对溢出观测的干扰，不是日期 demo 的页面溢出。

## 截图与服务

- `desktop-hud-overlay-open.png`
- `mobile-hud-overlay-open.png`
- `mobile-hud-overlay.png`
- 文档服务命令：`node "linkx-fe/node_modules/vitepress/bin/vitepress.js" dev docs --host 127.0.0.1 --port 5179 --strictPort`；PID `16260`；停止方式：`Stop-Process -Id 16260`。
- Impeccable 服务命令：`node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" --background`；PID `41472`；停止方式：同脚本执行 `stop --keep-inject`。
- 清理结果：Impeccable stop 命令 exit code `0` 并报告 8400 已停止；docs PID `16260` 已停止；随后确认 5179 与 8400 均无监听进程。
