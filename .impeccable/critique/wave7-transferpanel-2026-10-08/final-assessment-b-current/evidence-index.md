# Wave 7 LxTransferPanel Assessment B Evidence Index

Assessment B（detector 与浏览器证据）独立采集；没有读取旧 `.impeccable/critique/**` 评审材料或 Assessment A 输出，没有修改产品源码，也没有写综合评分或 snapshot。

## 基线

- [hash-verification.json](./hash-verification.json)：九个冻结文件 SHA-256 全部匹配；任务开始与交付前各复核一次。
- 页面目标：`http://127.0.0.1:4177/components/lxtransferpanel`。浏览器响应为 HTTP 200。

## Detector CLI

每次扫描均保存原始 JSON stdout、stderr、命令和退出码。两次 JSON 都可解析为数组 `[]`，stderr 为空，detector 退出码均为 0，因此满足本次“有效扫描”的条件。`[]` 只说明这两个 Vue 源目录没有静态 detector 命中。

| 扫描目标 | JSON / 命令 / stderr / 退出码 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/` | [stdout](./detector-transferpanel.stdout.json) · [command](./detector-transferpanel.command.txt) · [stderr](./detector-transferpanel.stderr.txt) · [exit](./detector-transferpanel.exit-code.txt) |
| `linkx-fe/src/components/LxVirtualTree/` | [stdout](./detector-virtualtree.stdout.json) · [command](./detector-virtualtree.command.txt) · [stderr](./detector-virtualtree.stderr.txt) · [exit](./detector-virtualtree.exit-code.txt) |

## Browser Evidence

Playwright 从 Vue3 子项目已安装的 `@playwright/test` 启动 Microsoft Edge 154.0.4258.53。五种视图分别使用新的 BrowserContext 和 Page：

| 视图 | 视口 | HUD | 页面横向溢出 | console 中 detector 数量 | 截图 |
| --- | ---: | --- | --- | ---: | --- |
| desktop-light | 1440×960 | 关 | 否 | 21 | [页面](./screenshots/desktop-light.png) · [overlay](./screenshots/desktop-light-detector-overlay.png) |
| desktop-hud | 1440×960 | 开 | 否 | 54 | [页面](./screenshots/desktop-hud.png) · [overlay](./screenshots/desktop-hud-detector-overlay.png) |
| mobile-320 | 320×740 | 关 | 否 | 10 | [页面](./screenshots/mobile-320.png) · [overlay](./screenshots/mobile-320-detector-overlay.png) |
| mobile-390 | 390×844 | 关 | 否 | 11 | [页面](./screenshots/mobile-390.png) · [overlay](./screenshots/mobile-390-detector-overlay.png) |
| desktop-keyboard | 1440×960 | 关 | 否 | 21 | [页面](./screenshots/desktop-keyboard.png) · [overlay](./screenshots/desktop-keyboard-detector-overlay.png) |

- [browser-mutation-preflight.json](./browser-mutation-preflight.json)：预检确认可改 `document.title`、追加 script 元素并执行 inline script。
- [browser-evidence.json](./browser-evidence.json)：导航、键盘、溢出、长文本、console、页面错误、注入状态与 detector 详情的事实 JSON。`detect.js` 每个视图均加载成功；对应 API 可用并运行；DOM 新增 overlay 标记，截图可见 detector 注释。
- 键盘事实：树键盘提示可见；`ArrowDown` 改变焦点节点；`Space` 将已选项从 4 减为 3，`Enter` 恢复为 4。
- 长文本事实：移动端树节点名称以两行显示；桌面已选长名称有 28 字符，内容宽度 336px、可用宽度 281px，完整文本保存在 `title`，视觉上出现省略。320px 与 390px 页面均无横向溢出。
- 除 desktop-light 的一条 `Failed to load resource: 404` console error 外，五视图均无 pageerror 或 failed request；失败资源 URL 未由本次采集器记录。其余四视图没有 console error。
- 当前 harness 没有可呈现的原生浏览器标签；以 Playwright 截图和 console 证据交付，没有声称用户可见的 `[Human]` 标签。

## Overlay 命中归因

- 组件命中：所有视图均有 `#lx-transfer-panel-161-source-panel` 的 `clipped-overflow-container`。截图显示它是待选树的滚动视口，内容被限制在面板内；这是虚拟树窗口化所需的裁切表现，不能仅按规则命中计为缺陷。320/390 页也无 document 横向溢出。
- HUD 命中：HUD console 的 54 条命中中，规则集中在 `ai-color-palette`。结果重复落到同一批已选树行、复选框、图标路径、节点元数据及已选数量节点，颜色描述均为 “Cyan neon text on dark background”。截图显示这些是显式 HUD 预览状态里的 cyan 前景；按同色样式模式归并，不视为 33 个独立问题。
- 文档正文命中：桌面 15 条 `line-length` 落在组件说明段落和列表项，报告约 108–110 字符/行。它们属于真实文档内容的可读性信号，不是组件 overflow；窄屏自动换行且页面无横向溢出。
- 文档外壳命中：`buried-raster` 指向 VitePress 代码块的 copy 按钮；`edge-flush-cards` 指向文档语义表格；`bounce-easing` 和 `layout-transition` 指向 `body`。这些不是 LxTransferPanel/LxVirtualTree 控件本身的命中。移动端 `span.container` 的裁切命中也属于文档布局外壳。
- 当前状态无效的遮挡命中：320px 和 390px 的 `text-occlusion` 都标记为 `isHidden=true`，目标是已折叠“示例状态与主题”内的状态按钮和参数标签，不是截图中的可见遮挡。
- overlay 自身影响后续 API 采样：采集器先注入 detector 并等它渲染 overlay，然后调用 `window.impeccableDetect()` 记录详情；desktop HUD API 结果因此包含以 `✦ ai color palette` 标注文字为目标的 `text-occlusion`。这些是检测器自身 overlay 互相覆盖的结果，不应并入页面基线。截图保留初始页面及 overlay 状态，console 的数量来自 detector 首轮扫描。

## Helper 生命周期

- [live-server-start.json](./live-server-start.json) 和对应 command/stdout/stderr/exit 文件记录启动；本地 token 已从保存的 server JSON 和 stdout 文件中打码。
- [live-server-stop.json](./live-server-stop.json) 与对应 command/stdout/stderr/exit 文件记录关闭，命令为 `node live-server.mjs stop --keep-inject`，退出码 0。
- 关闭后 `127.0.0.1:8400/health` 在 2 秒内无响应；主 Agent 管理的 4177 仍返回 HTTP 200，未停止或重启。

## Reproduction Scripts

- [verify-baseline.mjs](./verify-baseline.mjs)
- [capture-detector.mjs](./capture-detector.mjs)
- [preflight-browser.mjs](./preflight-browser.mjs)
- [capture-browser.mjs](./capture-browser.mjs)
- [manage-live-server.mjs](./manage-live-server.mjs)
