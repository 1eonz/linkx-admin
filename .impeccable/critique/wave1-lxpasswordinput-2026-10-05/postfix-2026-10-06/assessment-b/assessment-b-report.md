# LxPasswordInput Assessment B 取证报告

本报告是独立的 Assessment B，只记录当前目标源码、Demo、中文文档和本次浏览器运行证据；未读取 Assessment A 报告、截图、浏览器证据或修前 Assessment B 报告，也不做综合评审。

## CLI Detector

三个目标均以 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json <target>` 扫描，标准输出均为合法 JSON `[]`，stderr 均为 0 字节，退出码均为 0。`[]` 只表示这些目标的静态扫描没有规则命中，不代表视觉或浏览器审查通过。

| 目标 | stdout | stderr | 退出码 | 命令记录 |
| --- | --- | --- | --- | --- |
| `src/components/LxPasswordInput/index.vue` | [detector-component.stdout.json](./detector-component.stdout.json) | [detector-component.stderr.txt](./detector-component.stderr.txt) | [0](./detector-component.exit-code.txt) | [detector-component-command.txt](./detector-component-command.txt) |
| `src/components/LxPasswordInput/demo/basic.vue` | [detector-demo.stdout.json](./detector-demo.stdout.json) | [detector-demo.stderr.txt](./detector-demo.stderr.txt) | [0](./detector-demo.exit-code.txt) | [detector-demo-command.txt](./detector-demo-command.txt) |
| `docs/components/lxpasswordinput.md` | [detector-doc.stdout.json](./detector-doc.stdout.json) | [detector-doc.stderr.txt](./detector-doc.stderr.txt) | [0](./detector-doc.exit-code.txt) | [detector-doc-command.txt](./detector-doc-command.txt) |

## 浏览器与 Overlay

在全新 Microsoft Edge headless 页打开 `http://127.0.0.1:4177/components/lxpasswordinput`，视口覆盖桌面 1440px、移动端 375px 和 320px。修改 `document.title` 和 body 数据属性的注入预检通过；随后从独立资源服务加载 `http://127.0.0.1:4178/detect.js`，请求返回 200，`window.impeccableScan` 可用。自动扫描和显式 overlay 扫描均输出 `[impeccable] 4 anti-patterns found`。页面存在 7 个 overlay 标注节点，注入与 overlay 截图见 [browser-evidence.json](./browser-evidence.json) 和 [detector-overlay.png](./detector-overlay.png)。标注对象均在文档页较低位置或文档壳层，当前页顶截图只显示固定的 layout-transition banner；没有组件本体的标注。

四组命中归属如下，命中数量不直接等同于缺陷数量：

| 规则 | 目标 | 实际归属与观察 |
| --- | --- | --- |
| `buried-raster` | `button.copy` | VitePress 折叠示例代码块中的复制按钮，不属于 LxPasswordInput。命中矩形为 0×0，默认折叠态不可见；属于隐藏控件背景资源的状态命中，未形成可见组件问题。 |
| `line-length` | `p:nth-of-type(3)` | VitePress 文档正文段落，扫描估算约 86 字符/行；属于中文说明内容，不是组件或 Demo。实际页面按宽度换行，浏览器证据未显示溢出。 |
| `edge-flush-cards` | `table:nth-of-type(1)` | 文档 Props 语义表格。Detector 把表格单元格边缘识别成 14 个贴边卡片；截图呈现的是常规表格行列，属于规则误报，不是组件卡片布局。 |
| `layout-transition` | `body` | VitePress 文档壳层的 `height`、上下 padding transition，和组件局部样式无关；由 Detector 以页面级 banner 标注。 |

## 交互与几何

- 桌面亮色默认遮罩状态下，输入根区域为 480×32px，显隐按钮为 28×28px；`aria-label` 为“显示密码”，`aria-pressed=false`。桌面明文截图验证 `type=text` 与 `aria-pressed=true`。
- 键盘 Tab 可从密码输入框到达显隐按钮，焦点轮廓为 2px 实线。Enter 和 Space 均能切换明文状态；确认使用 CDP `keyDown`、`char`、`keyUp` 序列。开启 `maskOnBlur` 时，Tab 离开组件后回到 `type=password`；关闭时，离焦后保留 `type=text`。结果和状态序列保存在 `browser-evidence.json`。
- 375px 与 320px 下，显隐按钮均为 44×44px；页面 `scrollWidth` 与视口宽度相等，没有水平溢出。320px 下工具按钮自然换行，输入框及说明文字仍在 Demo 容器内；页面高度大于视口，属于纵向文档滚动。
- 只读输入仍能获得焦点；禁用输入跳过焦点。HUD 深色主题在 Demo 内生效。模拟 `prefers-reduced-motion: reduce` 后媒体查询匹配、滚动行为为 `auto`，按钮 transition 计算为 `0.00001s`（浏览器最小计算值，效果等同于无过渡）。
- 浏览器没有 JavaScript exception，也没有 `error`/`warning` 级控制台项。控制台有 3 条 Chromium 提示密码输入框不在 `<form>` 内（Demo 示例无表单容器），以及 Detector 两轮各 4 条命中日志。网络没有请求失败；唯一 HTTP 错误是 VitePress `/favicon.ico` 返回 404。

截图： [桌面亮色基线](./desktop-baseline.png)、[maskOnBlur 开启](./desktop-light-mask-on-blur.png)、[明文状态](./desktop-light-plain.png)、[HUD 深色主题](./desktop-hud.png)、[键盘焦点](./keyboard-focus-visible.png)、[375px](./mobile-375.png)、[320px](./mobile-320.png)、[320px 减少动效](./mobile-320-reduced-motion.png)。

## 服务生命周期

- VitePress：`pnpm exec vitepress dev docs --host 127.0.0.1 --port 4177 --strictPort`；在对应终端会话发送 Ctrl+C 停止。
- Detector 资源服务：`node .impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/assessment-b/serve-detector.mjs`；在对应终端会话发送 Ctrl+C 停止。该服务仅读取已安装 Detector 浏览器脚本，不使用 `.impeccable/live/server.json`。
- Edge CDP：由 `capture-browser.mjs` 启动独立 profile，脚本 `finally` 中关闭进程；采集退出码为 0。
- 两项服务均已停止。停止后监听检查记录于 [service-ports-after-stop.json](./service-ports-after-stop.json)：4177、4178、9223 均未监听。

首轮浏览器采集器曾因尝试把含 DOM 节点的 `impeccableScan()` 返回值直接传回 CDP，报 `Object reference chain is too long` 并退出 1；采集器改为只序列化页面结果后复跑成功。首轮 stderr 保存在 `browser-capture-attempt-1.stderr.txt`，最终运行状态见 [browser-capture.stdout.json](./browser-capture.stdout.json)、[browser-capture.stderr.txt](./browser-capture.stderr.txt) 和 [browser-capture.exit-code.txt](./browser-capture.exit-code.txt)。
