# Assessment B：LxSwitch Detector 与浏览器证据

**范围：**本文件只记录 Assessment B 的静态 detector 与浏览器证据，供最终合成使用；未读取 Assessment A 报告或输出。目标页面为 `http://127.0.0.1:4195/components/lxswitch.html`，对应 `linkx-fe/src/components/LxSwitch/`。

## Detector

两次源码扫描均按 JSON、stderr、退出码三项核验。结果 `[]`，stderr 均为 0 字节，退出码均为 0：

| 证据文件 | 扫描目标 | JSON 结果 | stderr | 退出码 |
|---|---|---:|---:|---:|
| `source-index.stdout.json` | `linkx-fe/src/index.ts` | `[]` | 0 字节 | 0 |
| `demo-basic.stdout.json` | `linkx-fe/src/components/LxSwitch/demo/basic.vue` | `[]` | 0 字节 | 0 |

这只表示上述源码目标没有命中静态规则，不代表浏览器状态或整体体验均无问题。

## 浏览器状态

目标页返回 HTTP 200，标题为“LxSwitch 状态开关 | LxUI”，挂载 1 个 LxSwitch Demo、共 10 个开关。可连接的原生 CUA 浏览器不可用，因此使用现有 Playwright 与系统 Edge 新建 headed browser context；设置标题、追加并执行 detector script 的 preflight 均成功。浏览器 runner 退出码为 0，stderr 为空。

观察到的状态：

- 浅色默认态的 Demo 背景为 `rgb(240, 242, 245)`。
- HUD 切换成功；根节点包含 `dark`、`lx-theme-hud`，Demo 背景为 `rgb(11, 18, 32)`。
- 禁用示例有 1 个开关处于 disabled，`aria-checked="true"`，标签为“省厅直辖联防调度镜像（锁定）”。
- Tab 键可到达开关；控件 `:focus-visible` 为 true，开关 core 显示 `2px solid rgb(0, 96, 169)` 焦点环。
- Loading 状态显示 spinner 并临时禁用，`aria-checked="false"`；本地模拟下发失败后保留关闭值并显示可重试提示。
- `prefers-reduced-motion` 匹配时，开关 core 的 transition duration 为 `1e-05s`。
- 真正的 mobile context 使用 `isMobile=true`。viewport、visual viewport、document client、document scroll 与 body scroll 宽度均为 375 CSS px，未发现横向溢出。桌面环境下缩窄 viewport 的仿真截图不作为移动端结论依据。

主要截图：[`light-desktop.png`](./light-desktop.png)、[`hud-desktop.png`](./hud-desktop.png)、[`disabled-desktop.png`](./disabled-desktop.png)、[`keyboard-focus.png`](./keyboard-focus.png)、[`loading-desktop.png`](./loading-desktop.png)、[`reduced-motion.png`](./reduced-motion.png)、[`mobile-375.png`](./mobile-375.png)、[`overlay-light-desktop.png`](./overlay-light-desktop.png)。

## 浏览器 Overlay

脚本注入成功，页面执行了 `http://localhost:8400/detect.js`，并输出 `[impeccable] 6 anti-patterns found`。结构化 console 记录中有 7 条逐项命中，分属 4 个规则；标题计数与逐项日志数不一致，保留原始计数如下，不据此推断更多缺陷：

- `buried-raster`：2 条均命中 VitePress 文档代码块的 `.copy` 按钮，不在 `.lx-switch-demo` 内。其图标是 `data:image/svg+xml` 背景，且非 hover 状态 opacity 为 0；规则按 raster/opacity 命中不适用于该矢量图标与文档外壳，归为误报。
- `line-length`：3 条命中可访问性说明、loading 说明和 Vue3 宿主适配说明的正文段落，均在文档正文内、Demo 之外。规则报告约 86 chars/line；它没有按中文字符宽度判读，截图中段落正常换行，故不计为组件缺陷，归为中文长度估算的疑似误报。
- `em-dash-overuse`：报告正文 `body` 聚合含 8 个 em dash；这是页面级文档内容命中，无法定位到 LxSwitch 控件。
- `layout-transition`：命中 `body` 聚合出的 `height, padding-top, padding-bottom` transition；没有命中组件控件，不能归因为 LxSwitch。

没有 `.lx-switch-demo` 内的 overlay 命中，也没有设计 token 命中。Overlay 证据见 [`overlay-console.json`](./overlay-console.json) 与 [`overlay-light-desktop.png`](./overlay-light-desktop.png)。

## 网络与清理

浏览器记录 823 个请求；没有外部请求，也没有非文档写请求。唯一的辅助跨源请求是同机 `localhost:8400/detect.js`，用于注入 detector。页面 console 有 `/favicon.ico` 404；没有 page error。

Impeccable live server 启动退出码为 0，停止退出码为 0，停止输出为 `Stopped live server on port 8400.`；随后确认 8400 无监听、没有 live-server 进程，`.impeccable/live/server.json` 不存在。启动回执中的 token 已脱敏。

原始汇总见 [`browser-evidence.json`](./browser-evidence.json)，浏览器 runner 输出见 [`browser-run.stdout.txt`](./browser-run.stdout.txt)。
