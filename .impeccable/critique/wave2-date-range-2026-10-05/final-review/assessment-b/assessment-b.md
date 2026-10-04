评审方式：独立 Assessment B 子代理（`/root/datepicker_b_fresh`）；未读取 Assessment A 或代码复审结论。

# LxDatePicker Assessment B 复核报告

## 范围

本报告只记录 Impeccable 静态 detector 与浏览器证据，目标为 `linkx-fe/src/components/LxDatePicker/index.vue`。本次未修改应用源码。静态扫描目标时间为 2026-10-05 05:01；目标文件随后检查的修改时间为 04:55，扫描后未见该文件被改写。

## 静态 Detector

- 命令：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxDatePicker/index.vue`
- 结果：stdout 为 `[]`，stderr 为空，退出码 `0`。
- 解析 slug：`linkx-fe-src-components-lxdatepicker-index-vue`。
- `.impeccable/critique/ignore.md` 不存在，因此本次没有应用忽略规则。

原始记录：`detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`、`target-slug.txt`。

## 浏览器证据

在新启动的 VitePress 文档服务 `http://127.0.0.1:4176/components/lxdatepicker` 上运行独立 Playwright 证据采集。Playwright 配置禁用复用既有服务；Microsoft Edge（Chromium）通过 Playwright 建立独立浏览器上下文。1 个采集测试通过，覆盖 9 个场景：桌面默认/打开区间、320px 普通/快捷面板、390px 普通/快捷面板、HUD 主题、减少动效、390×844 至 390×375 再恢复。

四个视图的 detector 注入预检与脚本加载均成功，页面内记录到的反模式汇总数分别为：桌面打开区间 23、320px 普通面板 13、390px 快捷面板 13、390px HUD 主题 41。数量是 detector 在完整 VitePress 页面中的逐条命中数，包含同类命中与文档外壳；它们不是组件缺陷数或严重度评分。浏览器上下文在采集结束时关闭，因此本报告只认定归档截图中的覆盖层检查成功，不声称当前存在持续打开的 `[Human]` 浏览器标签。

可复核的覆盖层截图：

- `desktop-open-range-overlay.png`
- `ordinary-320x375-overlay.png`
- `shortcuts-390x375-overlay.png`
- `hud-390x375-overlay.png`

场景数据、控制台命中、测量值及全部截图文件名见 `browser-evidence.json`。9 个场景均未记录页面异常或失败请求。

## 命中解释与独立观察

- VitePress 文档外壳命中包括 `.container` 的 overflow、页面 `body` 的 em-dash 与 layout-transition、代码复制按钮的 buried-raster，以及 API Props 表格的 edge-flush-cards。它们不能归为 DatePicker 组件源文件的静态问题。
- `gpt-thin-border-wide-shadow` 命中日期弹层及多个 demo 中的 popper；命中元素确实包含 DatePicker 弹层，但 detector 规则本身不能判断该阴影是否符合 lx-ui 令牌，故仅记为需设计规范核对的视觉信号。
- 打开弹层时，`text-occlusion` 命中被浮层覆盖的底层文档文字。这符合弹层覆盖内容的层级行为，不能仅据此认定页面文字碰撞。
- HUD 下 `ai-color-palette` 在图标、SVG 子节点、日期文字等多处重复命中预期的青色主题。需按主题设计判断，不应把后代节点数量视为独立问题数。
- 320×375 普通与快捷面板均观察到文档水平滚动条；测量为 document `scrollWidth=320`、`clientWidth=305`。DatePicker 弹层分别为 `x=3.5, width=298, right=301.5`，位于 320px 视口内。390px 两种面板均无 document 水平溢出。现有证据无法将 320px 文档溢出归因于 DatePicker，应与组件本身的 bounds 结果分开记录。
- 320/390px、375px 高度视口中的弹层均落在视口内。短视口下滚动发生在面板内部：普通面板 `panelScrollDelta=23px`，快捷面板在 320px 为 `84px`、390px 为 `69px`；对应页面纵向滚动增量为 `0`，滚动后日历末行完整可见。
- 390×844 调整为 390×375 后，`viewport-fit` 模式启用；恢复至 390×844 后该模式清除。减少动效场景匹配 `prefers-reduced-motion: reduce`，输入 transition duration 为 `1e-05s`。

## 服务生命周期

VitePress 由 Playwright `webServer` 配置启动，浏览器采集结束后由 Playwright 测试生命周期清理；Assessment B 没有手动发送停止信号。05:34:12（Asia/Shanghai）的只读核验显示 4176 无监听，启动包装进程 PID `37904` 与 VitePress PID `42340` 均已退出；临时 detector endpoint 8403 也无监听。既有 5180 服务未触碰，核验时仍由 PID `24136` 监听。详细检查记录见 `vitepress-4176-stop-verification.json`。

## 证据索引

- 主记录：`browser-evidence.json`
- 测试退出码：`browser-runner.exit-code.txt`（`0`）
- Detector 结果：`detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`
- 服务生命周期核验：`vitepress-4176-stop-verification.json`
- 截图：本目录下的 `desktop-*.png`、`ordinary-*.png`、`shortcuts-*.png`、`hud-*.png`、`reduced-motion-*.png`、`resize-*.png`
