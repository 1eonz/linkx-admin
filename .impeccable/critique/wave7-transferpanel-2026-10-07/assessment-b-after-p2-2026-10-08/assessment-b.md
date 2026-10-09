# Assessment B: LxTransferPanel Detector + Browser Evidence

## 范围与来源

- 评估目标源文件：`F:\work\linkx-admin\linkx-fe\src\components\LxTransferPanel\index.vue`
- 浏览器目标：`http://127.0.0.1:4174/components/lxtransferpanel`
- 源文件 SHA-256：`345067251B4EEDA6D31E01783E4B58CA16CF27C0AFBBA0F211C6EB2D7AE23A83`。按此哈希复扫前后字节一致。
- 已读取 Impeccable `reference/critique.md`；`.impeccable/critique/ignore.md` 不存在。
- 本报告仅记录 Assessment B；未读取 Assessment A、旧代码审查或其他评估报告，也未生成综合报告或 snapshot。

## 静态 Detector

完整命令：

```text
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxTransferPanel\index.vue"
```

- stdout JSON：`[]`
- stderr：空
- 进程退出码：`0`
- 结果解释：本次指定的 `.vue` 源文件没有命中静态规则；这不表示浏览器运行页没有检测结果。
- 独立证据：`detector-command.txt`、`detector-stdout.json`、`detector-stderr.txt`、`detector-exit-code.txt`。另有与当前源码哈希对应的复扫结果：`detector-current-*`。

## 浏览器与注入

- 工具预检失败：Node 环境中 `puppeteer`、`puppeteer-core`、`playwright`、`playwright-core` 均缺失。按任务要求将 Puppeteer 缺失明确记为失败。
- 备用采集：使用独立 Chrome 154 临时配置，通过 Node 内建 WebSocket 直接发送 Chrome DevTools Protocol 命令。创建了新的 BrowserContext 和新标签；目标页 `readyState=complete`，页面可见文本约 6,080 字符。目标服务返回 HTTP 200。
- DOM 注入预检成功：设置了页面标题并追加 `<script>`；`http://localhost:8400/detect.js` 加载成功，注入探针返回 `dom-mutation-ok`，页面出现 `impeccableDetect`、`impeccableScan` 等全局函数。
- 浏览器 console overlay 汇总行：`[impeccable] 13 anti-patterns found`。分组原始记录有 14 条规则明细，另有起始和结束分组记录；汇总的 13 与明细条数不一致，保留原文，不把汇总数作为可靠的精确计数。
- 14 条 console 明细：`line-length` 8 条（段落 5、列表项 3）；`buried-raster` 3 条（`button.copy`）；`edge-flush-cards` 1 条（表格，提示 11 张卡片贴近左边缘）；`bounce-easing` 1 条（`body`）；`layout-transition` 1 条（`body`）。完整记录见 `overlay-console.json`，全部浏览器 console 见 `browser-console.json`。

## 发现与误报判断

- 静态源文件未命中；运行页 overlay 则扫描了整张 VitePress 文档页，不是只扫描 `LxTransferPanel` 根节点。overlay 明细指向页面段落、列表项、Props 文档表格、代码复制按钮及 `body`，没有明确指向 `.lx-transfer-panel` 主体的规则项。
- `line-length` 命中的是 VitePress 文档中的段落和列表文字；这些可能是文档排版建议，但不应直接归为组件本身缺陷。
- `buried-raster` 命中的 `.copy` 是 VitePress 代码块复制按钮，其静止时透明、悬停时出现符合文档主题的常见交互；当前 detector 规则没有识别这个主题交互，按组件评估口径列为疑似误报。
- `edge-flush-cards` 指向文档 Props 表格；这是整页 Markdown/VitePress 表格表现，不是 `LxTransferPanel` 的业务卡片。
- `bounce-easing` 与 `layout-transition` 都报告在 `body`，属于页面文档主题的全局样式线索，无法据此归因到组件。
- 浏览器中切换了 VitePress 暗色主题，并在 `.lx-transfer-panel` 内点击“选择 待授权特勤支队”。采集到可见示例仍显示“已达上限 5 项 / 已选 5 项”，而 checkbox checked 数从 5 增至 6。该计数可能受树节点父子勾选语义影响；Assessment B 只记录 DOM 可观察结果，不据此判定业务选择契约错误。

## 截图与运行限制

- `page-initial.png`：默认浅色文档页全页截图。
- `detector-overlay.png`：浅色文档页注入 detector 后的 overlay 截图。
- `theme-alternate.png`：通过 VitePress 主题切换控件进入暗色后的截图；`html` class 为 `dark`，body 背景为 `rgb(27, 27, 31)`。
- `state-selected.png`：点击上述待选节点后的暗色页面截图。
- `browser-dom.json`、`theme-state.json`、`representative-state.json`、`browser-network.json`、`browser-result.json` 保存对应 DOM、主题、交互、网络与运行结果证据。
- Puppeteer 缺失仍是预检失败；CDP 备用路径完成了浏览器采集，但不等同于 Puppeteer 验收。只覆盖桌面 1440×1000 视口和单一组件示例页，未覆盖移动布局、屏幕阅读器或其他组件页面。
- 截图与 console 文件保存在本 Assessment B 目录；没有通过 Codex `[Human]` 浏览器面板展示 overlay。

