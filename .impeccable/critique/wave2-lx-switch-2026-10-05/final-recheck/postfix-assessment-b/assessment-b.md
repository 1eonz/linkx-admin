# LxSwitch 修后 Assessment B

日期：2026-10-05。范围仅含静态 detector 与浏览器证据；本记录未读取 Assessment A 或综合报告，也未修改产品源码。`.impeccable/critique/ignore.md` 不存在。

## 静态 Detector

按 `node <detect.mjs> --json <target>` 分别扫描组件、Demo 和文档。三次 stdout 都是 `[]`，stderr 均为空，JSON 均可解析，退出码均为 `0`。

| 目标 | 退出码 | stdout | stderr |
| --- | ---: | --- | --- |
| `linkx-fe/src/components/LxSwitch/index.vue` | 0 | `[]` | 空 |
| `linkx-fe/src/components/LxSwitch/demo/basic.vue` | 0 | `[]` | 空 |
| `linkx-fe/docs/components/lxswitch.md` | 0 | `[]` | 空 |

原始命令摘要、stdout、stderr 与退出码分别保存在 `scan-summary.json`、`component.*`、`demo.*`、`docs.*`；可用 `node assessment-b-scans.mjs` 重跑。

## 浏览器证据

目标 `http://127.0.0.1:4195/components/lxswitch.html` 返回 HTTP 200。CUA 没有可用浏览器表面，因此使用 `admin-vue3` 现有 Playwright 1.58 和本机 Chrome 154，在隔离 headless context 中创建新页面；注入前通过设置页面标题、插入并执行 marker 脚本验证 DOM 可变更。之后从 `http://127.0.0.1:8400/detect.js` 注入成功，并等待 3 秒采集控制台与截图。

| 视口 | 注入前根宽度 | 注入后根宽度 | Props 元数据列 x 坐标 | 其他观察 |
| --- | --- | --- | --- | --- |
| 1440×960 | 1440 / 1440，无横向溢出 | 1440 / 1440，无横向溢出 | 547.36 / 817.67 | 7 行均为 grid，列位置一致；列表在视口内、各行未溢出 |
| 375×812 | 375 / 375，无横向溢出 | 375 / 615，根出现横向溢出 | 24 / 193.5 | 7 行均为 grid，列位置一致；列表在视口内、各行未溢出 |

移动端注入后 `body.scrollWidth` 仍为 375，增加发生在 `documentElement.scrollWidth`；所以该 240px 增量来自 detector 可视标注层，不是注入前的页面宽度。截图中可见固定在视口顶部的 detector 标注条。

桌面和移动视口的禁用开关均为 disabled，`aria-describedby="upper-lock-reason"` 命中唯一目标，描述文本为“受上级指令系统锁定，本级不可改动”。HUD 主题 checkbox 的包裹 label 在两个视口均为 `190.38×44px`，计算样式 `min-height: 44px`；checkbox 本体为 `13×13px`，触控区域由包裹 label 提供。

注入后的控制台报告 4 个 anti-pattern：`clipped-overflow-container`（`span.container`）、`buried-raster`（2 次，报告 opacity 0）、`layout-transition`（`transition: height, padding-top, padding-bottom`）。页面没有 JS page error，另有一次未归因的资源 404。组件、Demo 和文档的 CLI 扫描都为零命中；浏览器的 `span.container` 与布局过渡命中属于文档页面运行时的外壳候选，未计为 LxSwitch 缺陷。两条 raster 命中没有可读 selector，因此保留为未归因，不判定为组件问题或误报。控制台只提供节点句柄；目标服务在后续定位尝试前停止，无法继续把这些命中映射到精确 DOM 节点。

Playwright 实际改写了页面标题为 `[Human] Assessment B · LxSwitch`，但因没有可控的交互浏览器标签，本轮不能声称 overlay 已在用户可见的 `[Human]` 标签中展示。八张注入前后截图和完整浏览器记录见 `browser-*.png` 与 `browser-evidence.json`。

## 服务状态与限制

采集开始前，4195 由 PID `38380` 的 VitePress 进程提供，8400 由 PID `34796` 的 Impeccable live server 提供；本轮没有启动或停止服务。第一轮浏览器采集后，4195 不再监听，PID `38380` 已退出；8400 仍由 PID `34796` 提供。未尝试重启 4195，因此精确定位 browser-only 命中的复验未完成。

记录命令：

```powershell
node assessment-b-scans.mjs
node assessment-b-browser.cjs
```
