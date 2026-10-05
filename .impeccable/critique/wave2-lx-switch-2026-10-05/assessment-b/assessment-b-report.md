# LxSwitch Assessment B

日期：2026-10-05。范围仅含 `linkx-fe/src/components/LxSwitch/index.vue`、`demo/basic.vue`、对应中文 API/Demo 文档、`design/表单控件八件套/code.html` 第 07 项及 `.impeccable/critique/ignore.md`（文件不存在）。未读取 Assessment A 或旧 Critique，也未修改产品文件。

## Detector

| 目标 | 命令 | 退出码 | stdout | stderr |
|---|---|---:|---|---|
| `LxSwitch/index.vue` | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxSwitch\index.vue"` | 0 | 有效 JSON `[]`，0 条 | 空，0 字节 |
| `LxSwitch/demo/basic.vue` | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxSwitch\demo\basic.vue"` | 0 | 有效 JSON `[]`，0 条 | 空，0 字节 |

每个目标的原始 JSON、stderr、exitcode 都保留为 `LxSwitch-*.detector.*`；从仓库根目录复跑并重新逐一解析的证据为 `LxSwitch-*.detector.rerun.*` 及 `detector-verification.rerun.*`。`[]` 只表示静态 detector 零命中，不代表 Critique 通过。第一次后置 JSON 验证器曾因从 `assessment-b` 工作目录重复拼接目录而以 1 退出并报 ENOENT；原始错误保留在 `detector-verification.stderr.txt`。该错误不是 detector 退出失败，根目录重跑后的验证退出码为 0。

## 浏览器证据

在一个全新的 IAB 标签实际打开 `http://127.0.0.1:4192/components/lxswitch.html`。页面返回 200，示例实际渲染。CDP 预检成功：页面标题可变更，追加的行内 `<script>` 已执行；之后 `http://localhost:8400/detect.js` 脚本节点已追加、加载标记为 true、无加载错误，并暴露 `impeccableScan` 等 detector 函数。浏览器控制台报告 `[impeccable] 15 anti-patterns found`。下面六张截图均保留在本目录，画面中可见 detector overlay。

| 视图 | 截图 | 浏览器观察 |
|---|---|---|
| 亮色桌面，1280×720 | `lxswitch-light-desktop.png` | detector banner 和内容命中标记可见。 |
| HUD 深色，1280×1550 | `lxswitch-hud-desktop-states.png` | `.lx-theme-hud` 已生效，示例背景为 `rgb(11, 18, 32)`；overlay 仍在。 |
| 禁用与 loading，1280×720 | `lxswitch-hud-disabled-loading.png` | 同屏可见上级锁定禁用行及 loading 行；点击 loading 示例后出现 spinner、禁用类，状态文字为“镜像同步下发中……（loading 期间点击被拦截）”。该演示由内存计时器模拟。 |
| 键盘焦点，1280×720 | `lxswitch-keyboard-focus.png` | 从 HUD 复选框按 Tab 到第一个 `role=switch`；活动节点为 input，`:focus-visible=true`，计算焦点外环为 3px。 |
| 触屏视口，375×812 | `lxswitch-touch-375.png` | `innerWidth=375`、`screen.width=375`、`maxTouchPoints=1`；开关根命中区实测 44×44，胶囊 42×20。整个文档 `scrollWidth=536`，存在 161px 横向溢出，尚未归因到 demo 还是文档壳。实际触摸事件未验证：此 IAB 不支持 CDP `Input.dispatchTouchEvent`。 |
| reduced motion，1280×720 | `lxswitch-reduced-motion.png` | `prefers-reduced-motion: reduce` 命中；开关根、胶囊、滑块 transition/animation 计算时长均为 `1e-05s`。 |

资源性能条目只观察到 `http://127.0.0.1:4192`；注入的 detector 来自本机 `http://localhost:8400`。loading 点击后捕获的 Network 请求事件为空。未观察到外部业务 API 请求；此项是观察确认，没有设置全局请求拦截。

## 命中归属

实际落在 LxSwitch Demo 内容上的浏览器命中包括：`.lx-switch-demo__desc` 低对比度（报告为 `3.1:1`）、`.lx-switch-demo__hint`（`3.2:1`）、状态文本（`2.9:1`）、提示文本（`2.6:1`），多处 11px 小字，以及约 92 字符的长行。Demo 的 `h4` 紧跟文档 `h2`，漏过 `h3` 也是真实的示例文档层级命中。HUD 截图中这些文本仍被标记，但 overlay 给出的浅色背景值 `#fafbfd` 与 HUD 暗色表面不符；HUD 下的对比度需独立复核，不能直接沿用该比例。

`button.copy` 的 raster 命中落在 VitePress 代码复制控件；`body` 上的 transition 与 `div.container` 首屏栏高命中属于整页文档结构，不能直接归因到开关。8 个 em-dash 命中也是扫描整页 `body` 的结果，不能仅凭这条把问题定位到目标组件。移动视图的页面总宽度确实超过 375px，但本次没有继续拆解文档壳与 Demo 各自的溢出贡献。

## 服务与限制

临时 overlay 服务在 Assessment B 自己的目录根下运行于 8400 端口。停止命令退出码 0，stdout 确认服务已停止，停止后的 `/health` 连接被拒绝。stop 脚本另有 `config_missing` 清理提示，因为隔离目录没有 managed live-inject 配置；本次使用的是页面内临时 `detect.js` 注入，没有修改仓库根的 `.impeccable/live/server.json`。续接后浏览器工具返回 `Browser is not available: 2`，所以没有再操作已关闭的实时标签；注入成功由本次浏览器输出、控制台和六张截图共同留证。首次触屏事件未能模拟，移动页面横向溢出的责任节点未定位。
