Assessment B 独立来源：本轮最终复验由独立上下文执行，未读取 Assessment A 或代码复审报告。

# LxMetricCard 与 LxSectionTitle 最终复验

## 范围与执行状态

- Detector 源码目标：`linkx-fe/src/components/LxMetricCard/index.vue`、`linkx-fe/src/components/LxSectionTitle/index.vue`、`linkx-fe/src/components/LxSectionTitle/demo/basic.vue`。
- 浏览器目标：`http://127.0.0.1:4177/components/lxmetriccard`、`http://127.0.0.1:4177/components/lxsectiontitle`。
- 本机 `puppeteer` 模块未安装，按本轮约定将 Puppeteer 专用路径记录为不可用；已有 Playwright Core 与本机 Chrome，因此使用 Playwright 完成了新 context、注入、scan、console 与 overlay 的浏览器证据采集。浏览器步骤本身没有失败。
- 共采集 10 个全新浏览器 context：每个路由分别覆盖亮色桌面 1440×900、暗色 HUD 桌面 1440×900、亮色 320×812、亮色 375×812、亮色减少动效 1440×900。每个视图都完成标题与 DOM 写入 preflight，动态脚本可执行；`detect.js` 注入成功；`window.impeccableScanAsync` 可调用；出现可见 overlay；路由返回 HTTP 200；无 page error。
- 4177 起初连接被拒绝，随后浏览器路由返回 200。采集完成后没有遗留 4177 listener；本轮 Impeccable overlay server 在 8464 启动并以退出码 0 停止。停止证据见下文。

## 静态 Detector 三件套

严格使用：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <markup target>`。

| 目标 | 退出码 | stderr | stdout JSON | 结果 |
| --- | ---: | --- | --- | --- |
| `LxMetricCard/index.vue` | 0 | 空，0 字节 | `[]` | 静态零命中 |
| `LxSectionTitle/index.vue` | 0 | 空，0 字节 | `[]` | 静态零命中 |
| `LxSectionTitle/demo/basic.vue` | 0 | 空，0 字节 | `[]` | 静态零命中 |

原始输出分别保存在 `lxmetriccard-detector.stdout.json`、`lxmetriccard-detector.stderr.txt`、`lxmetriccard-detector.exit-code.txt`，以及 `lxsectiontitle-detector.*`、`lxsectiontitle-demo-detector.*`。只有这三份静态 markup 扫描可据此记为零命中；浏览器运行时扫描命中见下文。

## 浏览器扫描结果

`scan` 数量来自每页注入后显式等待的 `window.impeccableScanAsync()` 返回值；console 原始消息另存于每页 JSON，包含规则文本和对应 DOM 参数。命中数是整个 VitePress 路由视图的规则条目数，不是组件缺陷数。

| 组件 | 视图 | scan 条目 | Overlay | 页面水平溢出 |
| --- | --- | ---: | --- | --- |
| LxMetricCard | 亮色桌面 | 4 | 成功，可见 3 个 overlay 节点 | 否 |
| LxMetricCard | 暗色 HUD 桌面 | 54 | 成功，可见 3 个节点 | 否 |
| LxMetricCard | 亮色 320px | 4 | 成功，可见 3 个节点 | 否 |
| LxMetricCard | 亮色 375px | 4 | 成功，可见 3 个节点 | 否 |
| LxMetricCard | 亮色减少动效 | 4 | 成功，可见 3 个节点 | 否 |
| LxSectionTitle | 亮色桌面 | 6 | 成功，可见 5 个节点 | 否 |
| LxSectionTitle | 暗色 HUD 桌面 | 93 | 成功，可见 15 个节点 | 否 |
| LxSectionTitle | 亮色 320px | 5 | 成功，可见 4 个节点 | 否 |
| LxSectionTitle | 亮色 375px | 5 | 成功，可见 4 个节点 | 否 |
| LxSectionTitle | 亮色减少动效 | 6 | 成功，可见 5 个节点 | 否 |

### 窄屏归属核验

两个路由在 320px 和 375px 的 `document.clientWidth` 与 `document.scrollWidth` 相等，没有页面级水平滚动。组件本身也未超出视口：

- 320px 时指标卡片右边界为 296px（宽 272px）；375px 时右边界为 351px（宽 327px）。
- 320px 时区块标题右边界为 267px（宽 214px）；375px 时右边界为 322px（宽 269px）。
- 宽内容来自 `.vp-doc` 的 Props 表格。指标卡页面在 320/375px 下表格 `scrollWidth=731`，容器可见宽度分别为 272/327px；区块标题页面对应为 `681` 与 `272/327px`。表格 `overflow-x: auto`，页面根节点仍不横向溢出。窄屏截图中 Props 表格列被容器裁切并可在表格内部横向滚动。
- `edge-flush-cards` 实际 selector 是 `div.content-container > main.main > div.vp-doc._components_lxmetriccard > div > table` 或对应 `_components_lxsectiontitle` 的 Props 表格，不是指标卡片或区块标题。
- `clipped-overflow-container` 指向 VitePress 移动导航汉堡按钮的 `span.container`（`div.container > div.content > div.content-body > button.VPNavBarHamburger.hamburger > span.container`）。这是文档导航的裁切区域，不是目标组件。

### 规则命中及归属

- **LxMetricCard**：亮色视图的四项规则落在 VitePress 页面壳层：`buried-raster` 指向示例代码块的 `button.copy`；`line-length` 指向 Markdown 说明段落；`edge-flush-cards` 指向 `.vp-doc` Props 表格；`layout-transition` 指向 `html > body`。窄屏中 `clipped-overflow-container` 指向导航汉堡图标容器。未发现命中 `.lx-metric-card` 根节点的运行时规则。
- **LxSectionTitle 的小标签**：亮色桌面及窄屏都报告 `cramped-padding`，实际元素为示例组件内部的 `span.lx-tag.lx-tag--primary.lx-tag--small`，外框高 18px、内容高 16px。截图中“8 项字段”标签的上下留白较紧。这是当前保留的直接可见提示，属于 SectionTitle 示例组合中的 LxTag 子组件，不是 SectionTitle 根节点溢出。
- **LxSectionTitle 的长标题**：桌面有 `text-overflow` 命中，实际 selector 是 `.lx-section-title__label`，`scrollWidth=319`、`clientWidth=266`，computed `overflow:hidden; text-overflow:ellipsis`。桌面截图可见按设计截断的省略号；窄屏截图中标题换行，组件右边界仍在视口内，320/375px 扫描不再命中该规则。因此这条桌面命中是预期截断行为，不作为确认缺陷。
- **文档壳层命中**：`buried-raster` 指向 VitePress `button.copy`；`line-length` 指向组件说明文字；`layout-transition` 指向 `BODY`。这些都不属于目标组件。
- **暗色 palette 规则**：LxMetricCard 的 54 条中有 50 条 `ai-color-palette` 指向文档包裹层里的 `span`（文本 `setup`），其余为上述文档壳层命中。LxSectionTitle 的 93 条中 77 条指向相同的 `span`；另有规则落到示例操作按钮、图标路径、`lx-section-title__leading` 和 LxTag 内容/外框。重复命中总数主要受整页暗色扫描影响；其中组件和示例节点上的青色语义色仍保留为 HUD 视觉复核项，不凭规则数直接认定为缺陷。

减少动效状态中 `matchMedia('(prefers-reduced-motion: reduce)')` 为真；两个组件的 computed transition 均降为约 `1e-05s`。减少动效页的 `layout-transition` 命中仍指向 VitePress `BODY`。

## 原始浏览器证据与清理

- 每视图原始 JSON：`lxmetriccard-light-desktop.json`、`lxmetriccard-dark-desktop.json`、`lxmetriccard-light-320.json`、`lxmetriccard-light-375.json`、`lxmetriccard-light-reduced-motion.json`，以及对应的 `lxsectiontitle-*` 文件；聚合状态在 `browser-summary.json`。
- `screenshots/` 中保存 20 张截图，每视图各一张 `*.baseline.png` 和 `*.overlay.png`。窄屏两页 overlay 截图可直接核对组件边界、移动导航命中与 Props 表格内部滚动。
- VitePress 启动尝试的 PID 和 stdout/stderr 在 `docs-server.pid`、`docs-server.stdout.log`、`docs-server.stderr.log`。清理后状态记录于 `docs-server-stop.json`：本轮 pnpm 包装进程及 conhost 已结束，4177 无监听进程；未停止任何可能属于并行评估的其它服务。
- Impeccable overlay server 启动记录在 `overlay-server-start.json`，停止输出与退出码在 `overlay-server-stop.stdout.txt`、`overlay-server-stop.stderr.txt`、`overlay-server-stop.exit-code.txt`。停止退出码为 0，8464 无监听进程。
- `run-browser.mjs` 是本轮浏览器证据采集脚本。未修改业务源码，未提交变更。

## 最终结论

三个源码目标的 detector 静态结果均为干净零命中，浏览器 preflight、注入、scan、console 记录和可见 overlay 在 10 个代表视图中均成功。窄屏页面没有 body 级水平溢出；可横向滚动的宽表格属于 VitePress 文档壳层。仍需设计侧注意的是 HUD 深色扫描落在组件/示例令牌色上的 palette 提示，以及 SectionTitle 示例中 LxTag 的紧凑垂直留白。Puppeteer 模块缺失已明确记录，Playwright Core + Chrome 的替代浏览器证据完整成功。
