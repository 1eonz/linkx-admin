# Assessment B：LxDatePicker detector 与浏览器证据

本报告是独立的 Assessment B。未读取或联系 Assessment A。目标源码为 `linkx-fe/src/components/LxDatePicker/index.vue`，相关样式、Demo、文档及 SHA-256 指纹见 [target-fingerprint.json](target-fingerprint.json)。目标 slug 由 critique-storage helper 计算为 `linkx-fe-src-components-lxdatepicker-index-vue`。`context.mjs --target <index.vue>` 运行一次，exit code 为 0；原始输出见 `context.stdout.txt`、`context.stderr.txt`、`context.exit-code.txt`。`.impeccable/critique/ignore.md` 不存在。

## Detector

三份 markup 目标均完成扫描，exit code 0，JSON 均为 `[]`，stderr 均为空：

| 目标 | stdout JSON | stderr | exit code |
| --- | --- | --- | --- |
| 组件源码 | `source.stdout.json`：`[]` | `source.stderr.txt`：空 | `source.exit-code.txt`：`0` |
| Demo | `demo.stdout.json`：`[]` | `demo.stderr.txt`：空 | `demo.exit-code.txt`：`0` |
| 文档 | `docs.stdout.json`：`[]` | `docs.stderr.txt`：空 | `docs.exit-code.txt`：`0` |

CSS 单文件未传给 detector；其内容作为浏览器组件实现的一部分查看。

## 浏览器与 Overlay

指定的 4174 文档 URL 起初连接拒绝，随后在 `127.0.0.1:4174` 启动本地 VitePress 并成功返回文档页。CUA 新建 tab 2；子 Agent 不支持将 IAB 设为可见。可变注入预检成功：`document.title` 可修改，追加的 inline script 已挂载并执行；预检标签和标题随后清理恢复，结果见 `browser-preflight.json`。

在桌面亮色、单值日历展开状态，本地隔离 live-server `127.0.0.1:8401` 的 `/detect.js` 返回 200，浏览器脚本加载成功，DOM 出现 `.impeccable-overlay` / `.impeccable-label`，控制台报告 `[impeccable] 18 anti-patterns found`。可见标签包括低对比文字、长行、文档中的 14 个 em dash、h2 后跳到 h4、叠层遮挡文字、细边框宽阴影及动画属性等。命中横跨 VitePress 文档正文、页面外壳与日历弹层；尚未逐条核实所有命中元素，因此 18 不是组件缺陷数。观察到星期表头从星期一开始。该状态 viewport 宽 1280px，document/body `scrollWidth` 均为 1265px；焦点仍在已展开的“布控生效日期” combobox。对应 DOM、控制台和网络限制记录见 `browser-cua-overlay-observation.json`。

CUA 工具返回了初始文档页和该展开态的 overlay 截图，但当前接口未提供将截图写入本地文件的能力。要求的四状态 PNG 未落盘。备用采集脚本 `capture-browser-evidence.mjs` 因 Playwright 1.58 所需 Chromium headless executable 缺失而在启动阶段失败，stdout/stderr/exit code 分别记录在 `browser-capture.stdout.json`、`browser-capture.stderr.txt`、`browser-capture.exit-code.txt`。没有切换浏览器版本或继续增加采集状态；因此桌面双月区间、375px 区间、HUD 深色、键盘和 reduced-motion 状态未验证。具体失败记录见 `screenshot-capture-status.json`。

本轮显式导航与 detector 脚本请求仅指向本机 `127.0.0.1:4174` 和 `127.0.0.1:8401`，未访问真实业务后端。CDP 缓冲网络读取返回空事件，因此完整请求清单不可用；环境未证明所有文档运行时请求均为本地地址。

## 服务停止与变更范围

本轮启动的 VitePress PID 36048 已通过 exec session 60635 的 Ctrl+C 停止；隔离 live-server PID 4064 已用 `node live-server.mjs stop --keep-inject` 停止。验证时 4174、8401 均无监听。既有 8400 服务未用于 overlay、未停止；一次本机 health 请求返回连接拒绝。停止状态见 `server-stop-status.json`。

未修改组件实现、样式、Demo 或文档。
