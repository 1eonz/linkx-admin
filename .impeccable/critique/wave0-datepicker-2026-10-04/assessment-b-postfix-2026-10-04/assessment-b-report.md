# LxDatePicker Assessment B（中间快照；待响应式修复复验）

日期：2026-10-04  
评估目标：根任务修复响应式问题前的 LxDatePicker 源码快照与实时文档页  
浏览器上下文：新建 Codex IAB 标签（tab 2）；未复用用户标签  
独立性：未读取、引用或使用 Assessment A 报告

## 中间快照指纹

以下 hashes 对应本报告已完成的三项静态扫描与桌面交互证据，不代表根任务当前或最终版本。根任务随后在 320px 浏览器检查发现区间弹层横向溢出并正在修复；修复完成后必须重取 hashes、重跑 detector 并刷新浏览器证据。

| 目标 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxDatePicker/index.vue` | `E3B4513BB5B39A8C68AD4FE9524FF7E8FE4575D999CBAA834365B4B4F5218EC6` |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | `1E62E4705E1203070FE526C2063DC12739CA2F1BF3203F373CA0BCA94B0C2368` |
| `linkx-fe/docs/components/lxdatepicker.md` | `011850196C44A67470A4B433F31C5C73219F3C8148329C62C2DBDE96135A0CD4` |

## 静态 Detector

在上述中间快照上，每个目标单独扫描均以退出码 `0` 正常结束，JSON stdout 为 `[]`，stderr 文件为空。`[]` 只表示该快照中目标的静态规则没有命中，不构成浏览器检查通过或最终版本通过。

```powershell
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/src/components/LxDatePicker/index.vue"
# 退出码：0；stdout：[]；stderr：空

node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/src/components/LxDatePicker/demo/basic.vue"
# 退出码：0；stdout：[]；stderr：空

node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/docs/components/lxdatepicker.md"
# 退出码：0；stdout：[]；stderr：空
```

逐目标原始输出和进程状态：

- `detector-index.stdout.json`、`detector-index.stderr.txt`、`detector-index.exit-code.txt`
- `detector-demo.stdout.json`、`detector-demo.stderr.txt`、`detector-demo.exit-code.txt`
- `detector-docs.stdout.json`、`detector-docs.stderr.txt`、`detector-docs.exit-code.txt`

源码三个目标没有静态命中，故没有可归类的真实组件命中或设计令牌命中。VitePress 文档外壳不在这三次源码扫描的目标集合中，因此不能把它归为 detector 误报。

## 浏览器实证

打开 `http://127.0.0.1:4174/components/lxdatepicker.html`，HTTP 响应为 `200 OK`。由于请求地址当时拒绝连接，本次启动了临时 VitePress 服务；该独立标签标题为 `LxDatePicker 日期选择器 | LxUI`。

本次在独立标签观察到：

- Light 默认页的标题、交互示例和日期触发器正常显示；日期值字体、日历图标与文档内容可辨。
- 桌面打开“专项布控日期区间”后显示 2026 年 9 月、10 月双面板；周标题顺序为周一至周日，示例范围连续着色，起止日期均有圆点标记。
- 切到 HUD 后触发器及弹层使用深色主题；选中起止日期的文字为高对比浅色，区间填充与面板背景可区分。
- 区间键盘操作通过：ArrowDown 将焦点送入日期格；ArrowRight 将焦点从 15 移到 16；Escape 关闭弹层并把焦点还给开始日期输入框，示例值没有被改动。
- 触发器 AX 语义为带标签的 combobox；开始、结束输入分别有可访问名称。页面 AX 树能看到本次新增的主题提示文案。

浏览器证据限制：按 Impeccable 流程尝试通过 `tab.goto("javascript:...")` 修改当前新标签标题以进行注入预检，浏览器安全策略拒绝该协议，并明确禁止通过 DevTools、raw CDP 或其他间接方式实现同一脚本注入。本次遵从该拒绝，没有继续注入 `detect.js`；所以无可靠、用户可见 overlay，也没有 overlay 命中可供区分。当前 CUA 接口能显示截图供人工观察，但没有将这些图像落盘到本目录的接口；`screenshots/` 因而为空。

根任务后续在 320px 检查发现日期弹层宽度为 314px、clientWidth 为 305px，产生横向滚动，并正在修复。375/390px 状态、减少动效、请求失败与 page error 检查及浏览器截图归档仍待根任务对修复后的最终版本复验；不标作通过。

## 视觉命中分类

| 类别 | 本次结论 |
| --- | --- |
| 真实 LxDatePicker 组件 detector 命中 | 0；三个源码目标的 JSON 均为 `[]`。 |
| VitePress 外壳误报 | 无法判定；静态扫描未扫描文档运行时 DOM，浏览器 overlay 注入被安全策略拒绝。 |
| 设计令牌命中 | 无 detector 命中可供逐项核验；人工源码读取可见组件样式使用 `--lx-*` 与 Element Plus 变量。 |
| HUD 端点文字 | 桌面弹层实见为高对比浅色文字与青色选中底；对应 post-fix 文案已在页面可见。 |

## 进程与证据索引

启动命令及状态文件：

- 文档站：`linkx-fe/node_modules/.bin/vitepress.cmd dev docs --host 127.0.0.1 --port 4174`；父进程 PID `40400`；stdout/stderr 为 `docs-server.stdout.log`、`docs-server.stderr.log`。停止方式：`Stop-Process -Id 40400`，随后确认 4174 已无监听进程。
- Impeccable overlay server：`node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" --background`；返回 PID `31492`、端口 `8400`；启动 stdout/stderr/退出码分别保存为 `overlay-server.start.stdout.txt`、`overlay-server.start.stderr.txt`、`overlay-server.start.exit-code.txt`。已执行 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop`，退出码 `0`，stdout 为 `Stopped live server on port 8400.`。stderr 报 `config_missing`，无法移除 live script tag；本次没有注入脚本，故无残留注入。
- 截图接收 helper：PID `11356`、端口 `4175`；已用 `Stop-Process -Id 11356` 停止，记录于 `capture-server.stop.exit-code.txt`。
- 文档站实际监听进程：CMD PID `40400` 启动 Node PID `39092`（另有 conhost `8776`）。为根任务稍后检查移动视口暂时保留；检查结束后应停止两个进程并确认 4174 端口无监听。
- 已显示但未落盘的 CUA 截图：`desktop-light-default`、`desktop-light-range-open`、`desktop-hud-default`、`desktop-hud-range-open`。浏览器交互树记录的是独立 IAB tab 2；目前没有可引用的 PNG/JPG 文件。

本报告当前仅是 Assessment B 中间快照的确定性扫描和桌面手动交互结果。根任务修复后必须更新目标指纹、重跑扫描、补齐移动视口、页面错误/请求错误、减少动效及可保存的浏览器截图；在这些证据补齐前，不标为最终版本通过。
