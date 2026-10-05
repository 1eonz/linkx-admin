Method: 独立 Assessment B（detector 与浏览器证据；本文件不做设计评审合成）

# LxSwitch Assessment B 证据报告

日期：2026-10-05  
目标页：`http://127.0.0.1:4195/components/lxswitch.html`  
源码对照：`linkx-fe/src/components/LxSwitch/index.vue`、`linkx-fe/src/components/LxSwitch/demo/basic.vue`、`linkx-fe/docs/components/lxswitch.md`

## 静态 Detector

三次扫描均退出码 `0`，stdout 为有效 JSON `[]`，stderr 为空：

| 扫描目标 | 原始结果 |
|---|---|
| 组件 | `detector-component.stdout.json`、`detector-component.stderr.txt`、`detector-component.exit-code.txt` |
| Demo | `detector-demo.stdout.json`、`detector-demo.stderr.txt`、`detector-demo.exit-code.txt` |
| 文档 | `detector-doc.stdout.json`、`detector-doc.stderr.txt`、`detector-doc.exit-code.txt` |

对应命令保存在三个 `detector-*-command.txt`。`[]` 仅表示这些静态源码目标没有命中规则，不代表浏览器页面、主题、状态或响应式行为通过。

## 浏览器证据

使用 Playwright 1.58.0 与系统 Chrome `154.0.8037.95`。预览响应为 HTTP 200；注入预检能修改标题并运行内联脚本。各状态通过 `http://localhost:8400/detect.js` 注入 detector，页面中 `.impeccable-overlay` 数量大于零，且控制台记录 `[impeccable] N anti-patterns found`。注入前后的详细数据见各状态 JSON；当前记录没有保存注入前后的 `documentElement.clientWidth/scrollWidth` 成对值。

| 状态 | Overlay 数 | Console 事件数 | 页面异常 / 请求失败 | 截图 |
|---|---:|---:|---|---|
| 桌面浅色 | 3 | 8 | 无 page error；0 failed request | [browser-light-desktop.png](browser-light-desktop.png)、[browser-light-desktop-full.png](browser-light-desktop-full.png) |
| HUD 深色 | 165 | 169 | 无 page error；0 failed request | [browser-hud-dark.png](browser-hud-dark.png) |
| 禁用 | 4 | 8 | 无 page error；0 failed request | [browser-disabled.png](browser-disabled.png) |
| Loading | 3 | 7 | 无 page error；0 failed request | [browser-loading.png](browser-loading.png)、[browser-loading-confirm.png](browser-loading-confirm.png) |
| 键盘焦点 | 4 | 8 | 无 page error；0 failed request | [browser-keyboard-focus.png](browser-keyboard-focus.png)、[browser-keyboard-focus-confirm.png](browser-keyboard-focus-confirm.png) |
| 375px 触屏 | 4 | 8 | 无 page error；0 failed request | [browser-mobile-375-touch.png](browser-mobile-375-touch.png) |
| 减少动效 | 4 | 8 | 无 page error；0 failed request | [browser-reduced-motion.png](browser-reduced-motion.png) |
| 桌面属性区 | 3 | 7 | 无 page error；0 failed request | [browser-props-overflow-desktop.png](browser-props-overflow-desktop.png) |

每个视图的完整 metrics、console、requests、responses 和 requestFailures 位于同名 `.json` 文件；汇总见 `browser-summary.json`。图片尺寸经核对：桌面视图 `1280×900`，整页 `1280×4227`，移动截图 `375×812`。Loading 探针确认 `.el-switch.is-disabled` 中出现 `i.el-icon.is-loading`，状态文案为“镜像同步下发中”；焦点探针确认 `:focus-visible` 和 `2px` 实线 outline。移动各开关点击区域至少 `44×44`，外置文案开关为 `144×44`。

状态探针的独立日志另记录到一次 `http://127.0.0.1:4195/favicon.ico` 的 404 控制台错误；主页面仍为 200，没有 failed request。原始记录为 `browser-state-probes.json`。检测器黄色条是注入的 `layout-transition` overlay，不是产品页面自身新增的控件；当前浏览器自动化为无头运行，overlay 证据保存在截图和 console JSON 中，未留在用户的可见浏览器标签页。

## Detector 命中判断

- `buried-raster` 命中两个 `button.copy`。目标是 VitePress 文档代码块的复制按钮，命中描述为 `raster background at opacity 0`；它属于文档外壳，不是 LxSwitch 开关表面的问题。
- `layout-transition` 命中 `body` 的 `transition: height, padding-top, padding-bottom`，同样是文档站外壳规则命中，不定位到开关组件。
- `first-viewport-column-overflow` 命中文档 `div.container`；整页文档截图高 `4227px`。这是长文档阅读列而非开关自身面板，本次按文档上下文误报处理。
- HUD 深色状态有 162 条 `ai-color-palette`：161 条指向文档代码示例中的 token，另 1 条指向实际状态文字“未联动”。后者是实际主题色命中，位置真实；仅凭 detector 证据不能判为色彩缺陷。
- 移动状态的 `clipped-overflow-container` 指向 `span.container`，控制台只保留 `tag=span`、`class=container`，没有祖先、被裁切子项或 DOM 路径。此条仍未分类，不作为误报，也未证明它造成页面宽度异常。

## 移动宽度冲突与 E2E 对照

目标 4195 捕获的上下文是 `viewport 375×812`、`isMobile=true`、`hasTouch=true`、`deviceScaleFactor=1`。`visualViewport` 与 `screen` 都是 `375×812`，viewport meta 为 `width=device-width,initial-scale=1`；测量值却是 `window.innerWidth=615`、`documentElement.clientWidth=375`、`documentElement.scrollWidth=615`。因此该次捕获确有文档级横向溢出，不能据此签为移动验收通过。

同次记录中 `.lx-switch-props` 是 `327/327px`，自身不溢出；其父 `div`、`.vp-doc`、`main`、`.content-container`、`.content` 与 `.container` 均为 `clientWidth=327px`、`scrollWidth=351px`、`overflow-x:visible`。这解释了该祖先链上的 `24px` 超出，但不能解释文档根部 `615px` 的 `240px` 超出。`span.container` 的 overlay 也没有 DOM 路径证据，故目前不能确认 615px 的具体 DOM 来源或 overlay 是否改变了溢出。

现有 LxSwitch E2E 使用 `playwright.lxui.config.ts` 启动同工作区的 VitePress 开发服务于 4176，路由写作 `/components/lxswitch`（无 `.html`）。本次复跑命令是 `pnpm exec playwright test --config=playwright.lxui.config.ts --grep "375px 触屏" --reporter=line --output=../../.impeccable/critique/wave2-lx-switch-2026-10-05/final/assessment-b/e2e-4176-results`，3 项匹配测试通过，其中包括 LxSwitch 的移动测试，退出码 `0`。该测试断言 `window.innerWidth===375` 且 `documentElement.scrollWidth===documentElement.clientWidth`；它没有把后两个值打印为数值。测试路由与 4195 的 `.html` 路径不同，且 4195 的采集没有 overlay 注入前的根宽度基线，所以 E2E 通过与 4195 的 615px 实测构成未解释的证据冲突，不能推断为 detector 注入所致、服务差异或源码缺陷。

**移动验收门槛仍未收口**：需要在同一可复现的目标构建和路由上记录注入前、注入后以及 E2E 断言中的 `innerWidth/clientWidth/scrollWidth`，并检查产生 `615px` 的具体 DOM 节点。此前 4195 服务现已无法连接，无法对原捕获追加同路由复测；本报告不将其标为误报。

## 进程与产物

Detector live-server `8400` 的 stop 命令退出码为 `0`，PID `27316` 已退出且端口无 listener，见 `live-server-stop.*` 和 `live-server-cleanup.json`。开始本次复核时，4176 与 4195 均拒绝连接；Playwright 按配置为本次 E2E 临时启动 4176，并在用例结束时管理其生命周期，没有终止当时已存在的用户服务。复核结束后两个端口均无 listener。临时目录因工具策略阻止递归删除而保留，详见 `live-server-cleanup.json`。

没有修改产品源码。Assessment B 原始命令、JSON、stderr、退出码、截图及失败采集尝试均保留在本目录。  
Questions skipped: 本文件只交付独立 Assessment B 证据，不包含设计优先级问题或完整评审合成。
