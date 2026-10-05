# LxPasswordInput Assessment B（2026-10-06，修前复核）

本报告只记录 detector 与浏览器证据，不包含独立设计评审，也未读取或引用 Assessment A 报告及旧 Assessment B 结论。结果对应后续标题锚点遮挡修正之前的页面，不能当作修后复验或完整 Critique 通过结论。

## Detector

三个指定目标都按要求分别运行 `node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json <target>`。stdout 均为可解析的 JSON 空数组；stderr 均为 0 字节；进程退出码均为 `0`。这表示这些静态目标没有输出 findings，不能代替浏览器页面检查。

| 目标 | stdout JSON | stderr | 退出码 |
|---|---|---|---:|
| `LxPasswordInput/index.vue` | [原始 JSON](./linkx-fe-src-components-LxPasswordInput-index-vue.stdout.json)，`[]` | [stderr](./linkx-fe-src-components-LxPasswordInput-index-vue.stderr.txt)，0 字节 | [exit code](./linkx-fe-src-components-LxPasswordInput-index-vue.exit-code.txt)，0 |
| `LxPasswordInput/demo/basic.vue` | [原始 JSON](./linkx-fe-src-components-LxPasswordInput-demo-basic-vue.stdout.json)，`[]` | [stderr](./linkx-fe-src-components-LxPasswordInput-demo-basic-vue.stderr.txt)，0 字节 | [exit code](./linkx-fe-src-components-LxPasswordInput-demo-basic-vue.exit-code.txt)，0 |
| `docs/components/lxpasswordinput.md` | [原始 JSON](./linkx-fe-docs-components-lxpasswordinput-md.stdout.json)，`[]` | [stderr](./linkx-fe-docs-components-lxpasswordinput-md.stderr.txt)，0 字节 | [exit code](./linkx-fe-docs-components-lxpasswordinput-md.exit-code.txt)，0 |

逐条命令与运行目录记录在 [detector-commands.tsv](./detector-commands.tsv)。

## 浏览器注入与视图

目标 URL `http://127.0.0.1:4182/components/lxpasswordinput` 返回 HTTP 200。使用 Playwright 1.58.0、Chrome 154.0.8037.95 创建独立 context/page。注入预检实际修改了 `document.title`，插入的 inline script 已执行且标记节点计数为 1；详见 [preflight.json](./preflight.json)。

随后以 `live-server.mjs --background` 启动本次 detector 服务，`/health` 与 `/detect.js` 均返回 200。七个隔离页面均确认 `window.impeccableScan()` 已加载，调用返回 findings，控制台输出 `[impeccable] N anti-patterns found`，DOM 中也存在对应 overlay 元素。每个页面都执行自动扫描并显式调用一次以保存结构化目标，因此控制台同一计数出现两次；表中计数按一次扫描的结果记录，不相加。

| 视图 | 一次扫描的目标数 | 主要观察 |
|---|---:|---|
| [1280 light 截图](./1280-light.png) | 5 | Demo 安全提示命中低对比度；另有文档 table、代码复制按钮和 VitePress 页面壳层命中。 |
| [320 props 截图](./320-props.png) | 81 | 其中 76 条 `text-occlusion` 指向折叠代码示例里的语法高亮 span；另有 1 条文档汉堡图标裁切、1 条 Demo 低对比度、1 条折叠代码区复制按钮、1 条 table 分类误报、1 条 body 转场。 |
| [320 demo 截图](./320-demo.png) | 5 | Demo 提示低对比度；其余是汉堡图标、折叠代码区按钮、props table 和 body 页面级命中。 |
| [320 HUD 截图](./320-hud.png) | 11 | 7 条颜色规则命中 `.lx-theme-hud` 下的标题、图标和操作按钮；这是 Demo 中主动开启的 HUD 状态，不是默认 light 状态。 |
| [320 disabled/readonly 截图](./320-disabled-readonly.png) | 6 | 只读输入 `readOnly=true`，禁用输入 `disabled=true`；另有 1 条 `span.lang` 被报遮挡，实际位于折叠代码示例。 |
| [320 focus 截图](./320-focus.png) | 5 | 键盘 Tab 将焦点移至密码输入；`.el-input__wrapper` 有 `is-focus` 和可见 box-shadow。 |
| [320 reduced-motion 截图](./320-reduced-motion.png) | 5 | `prefers-reduced-motion: reduce` 为 true，页面滚动行为是 `auto`，Demo 图标与显隐按钮 transition 计算为 `0.00001s`。 |

截图中的 overlay 只在本次 Playwright 自动化页面中出现；没有把页面展示到 `[Human]` 标签，也不声称用户看到了该 overlay。七个视图的原始 findings、console、DOM target 与布局记录分别保存在对应同名 `.json` 文件；汇总在 [browser-summary.json](./browser-summary.json)。

## 视图测量与误报核验

- 1280px light 下 `documentElement` 与 `body` 的 `scrollWidth` 均为 1280，无横向溢出。固定 `VPNav` 底边在 y=64px，Demo `scrollIntoView` 后顶边在 y=80px，间距 16px；CSS `scroll-margin-block-start` 为 80px。
- 320px 下每个页面在注入前 `documentElement` 与 `body` 的 `scrollWidth` 都是 320。注入 detector overlay 后，`documentElement.scrollWidth` 变成 560，`body.scrollWidth` 仍是 320；同一页面临时移除 overlay DOM 节点后，根宽恢复到 320。最右侧 overlay 子标签到 x=560。因此 240px 的额外根滚动范围由 detector 标注产生，不是原始页面溢出。
- props table 本身为 `overflow-x: auto`；可视宽 272px，内容 `scrollWidth` 为 917px。直接设置其 `scrollLeft` 可生效，最大内部滚动范围为 645px。根节点注入前没有横向滚动范围。`edge-flush-cards` 命中对象是语义 props table，不是卡片。
- 320px 下 Demo 的固定导航关系不适用：VitePress `VPNav` 为文档流布局，在 Demo 对齐到 y=80px 时已滚出视口；不能把它当成仍固定在顶部的导航条。
- 320px 下密码显隐按钮实测为 44×44px；三个实例操作按钮高度均为 44px，宽度均大于 44px。只读与禁用语义、键盘焦点和减少动效状态均在 DOM/CSS 计算值中核实。
- `clipped-overflow-container` 的目标路径是 VitePress 汉堡按钮内的 `span.container`；它属于文档导航壳层。大量 `text-occlusion` 指向折叠代码示例中的 token。`button.copy` 同样位于折叠代码块。`first-viewport-column-overflow` 指向 `.VPDoc` 下的 `.container`，`layout-transition` 指向 `body`。这些命中不应算作 LxPasswordInput 本体缺陷。
- `low-contrast` 的实际目标是 `.password-input-demo__security-hint`，detector 测得 3.2:1（文本 `#86909c` 对白底）；这是本批中确认落在组件 Demo 可见内容上的非主题模式命中。HUD 颜色规则只在启用 `.lx-theme-hud` 时触发，需按该演示主题单独判断。

## 失败与限制

预检时浏览器报告 `/favicon.ico` HTTP 404，并有三条 Chrome “Password field is not contained in a form” verbose 提示；它们不是 detector findings。七个正式视图没有 `pageerror` 或 failed request。窄屏 detector 结果受折叠代码示例和文档框架 DOM 影响，不能把 81 直接解读为 81 个组件问题。

所有命令、原始 stderr、退出码及脚本都留在本目录：[browser-commands.tsv](./browser-commands.tsv)、[service-commands.tsv](./service-commands.tsv)、[browser-evidence.mjs](./browser-evidence.mjs)、[run-detectors.ps1](./run-detectors.ps1)、[run-browser-phase.ps1](./run-browser-phase.ps1)、[run-live-server.ps1](./run-live-server.ps1)、[stop-live-server.ps1](./stop-live-server.ps1)。

本次 live-server PID 9764、端口 8400 已停止；停止命令退出码为 0，TCP 端口关闭且 PID 不再存活，见 [live-server-stop-verification.json](./live-server-stop-verification.json)。随后重新请求 4182 仍返回 HTTP 200；未停止 4182 服务。
