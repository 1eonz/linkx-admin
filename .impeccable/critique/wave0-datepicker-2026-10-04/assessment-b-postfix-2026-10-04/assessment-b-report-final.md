# LxDatePicker Assessment B（阶段性/受限检查）

日期：2026-10-04  
目标：最终 LxDatePicker 文件与实时文档页  
浏览器：新建 Codex IAB tab 3；未复用用户标签  
独立性：未读取、引用或使用 Assessment A 报告

## 最终指纹

Detector 扫描用户指定的三个目标。配套样式和类型哈希用于界定本次代码版本。

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxDatePicker/style.css` | `B77CDBAC529A07D91CD6960FA71692F1502897DC25A3560E19C1DE1E08B94DFE` |
| `linkx-fe/src/components/LxDatePicker/index.vue` | `E3B4513BB5B39A8C68AD4FE9524FF7E8FE4575D999CBAA834365B4F5218EC6` |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | `1E62E4705E1203070FE526C2063DC12739CA2F1BF3203F373CA0BCA94B0C2368` |
| `linkx-fe/src/components/LxDatePicker/types.ts` | `4A7C664054F868310FCCB04D06F2A345A38B5552B1A021853BF0567A38E99302` |
| `linkx-fe/docs/components/lxdatepicker.md` | `011850196C44A67470A4B433F31C5C73219F3C8148329C62C2DBDE96135A0CD4` |

## 静态 Detector

三个目标分别扫描，均正常退出（exit code `0`）；JSON stdout 是 `[]`，stderr 为空。空数组只代表对应文件没有静态规则命中，不代表浏览器验收通过。

```powershell
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/src/components/LxDatePicker/index.vue"
# exit 0；stdout []；stderr 空

node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/src/components/LxDatePicker/demo/basic.vue"
# exit 0；stdout []；stderr 空

node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/docs/components/lxdatepicker.md"
# exit 0；stdout []；stderr 空
```

本次最终原始文件为 `detector-final-index.{stdout.json,stderr.txt,exit-code.txt}`、`detector-final-demo.{stdout.json,stderr.txt,exit-code.txt}`、`detector-final-docs.{stdout.json,stderr.txt,exit-code.txt}`。三个组件目标没有静态命中，因此没有真实组件命中或令牌命中可供逐项核验。VitePress 外壳不在扫描范围内；由于浏览器 overlay 未运行，不能判定其是否会误报。

## 浏览器检查

在新 IAB tab 3 打开 `http://127.0.0.1:4174/components/lxdatepicker.html`，页面 HTTP 状态为 `200 OK`。该标签实际检查了以下桌面状态：

- Light 默认页：标题、交互示例和日期触发器正常显示，日期值、图标与说明文字可辨。
- Light 区间弹层：并列显示 2026 年 9 月、10 月；周标题为周一至周日；范围连续着色，起止日期带圆点。
- HUD 默认页与区间弹层：深色主题正常；端点文字为浅色并位于青色选中底上，区间带与弹层背景可分辨。
- 区间键盘：ArrowDown 聚焦日期格；ArrowRight 将焦点从 15 移至 16；Escape 关闭弹层并把焦点还给开始日期输入框，示例值没有变化。
- AX 树显示单值和区间输入均为有名称的 combobox，区间开始和结束有各自的可访问名称；高对比主题提示文案可见。

### 受限项

按 Critique 流程进行注入预检时，`tab.goto("javascript:...")` 被浏览器安全策略拒绝。拒绝信息明确禁止通过 DevTools、raw CDP 或其他间接方式实现相同注入。本次遵从拒绝，没有再尝试注入 `detect.js`；因此没有 overlay、overlay console 消息或浏览器命中可供分析，也没有 VitePress 外壳误报核对证据。

CUA 返回了上列四个状态的截图供人工检查，但当前接口没有将图像保存到本地的能力，所以指定目录 `screenshots/` 为空；截图归档未完成。浏览器接口也没有提供 viewport override、页面错误或请求失败列表、reduced-motion 切换证据。根任务先前报告 320px 弹层宽 314px、clientWidth 305px 且出现横向滚动，并据此修改了 CSS；本 Assessment B 没有在最终版本独立复验 320/375/390px，不能确认这项响应式修复。

VitePress 服务日志的 stderr 为空，只说明服务端未记录错误，不能推断浏览器页面无 error 或失败请求。

## 命中分类与严重度

| 项目 | 结论 |
| --- | --- |
| LxDatePicker 静态 detector 命中 | 0；三个 stdout JSON 均为 `[]`。 |
| VitePress shell 误报 | 无法判定；运行时 overlay 被安全策略拒绝。 |
| 设计令牌命中 | 0 个 detector 命中。人工源码读取可见样式引用 `--lx-*` 与 Element Plus 变量；这不是 detector 命中。 |
| P1 | 0 项；实际检查的桌面状态未发现阻断操作的问题。 |
| P2 | 1 项待验证：根任务先前观察到的 320px 横向溢出已有样式修改，但 B 未独立检查最终 320/375/390px 状态，不能确认是否修复。 |

## 进程与证据索引

- 文档站启动命令：`linkx-fe/node_modules/.bin/vitepress.cmd dev docs --host 127.0.0.1 --port 4174`。本任务启动的 CMD PID `40400`、Node PID `39092`；启动输出在 `docs-server.stdout.log` 和 `docs-server.stderr.log`。停止方式：分别停止这两个 PID，并确认 4174 不再监听。
- Overlay server：`node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" --background`，返回 PID `31492`、端口 `8400`。已经调用同脚本的 `stop`，退出码 `0`；stdout 记录 stopped。stderr 报 `config_missing`，无法执行移除 script tag 步骤；本次实际未注入任何脚本，没有页面残留注入。
- 截图接收 helper：PID `11356`、端口 `4175`，已通过 `Stop-Process -Id 11356` 停止；过程记录在 `capture-server.stop.exit-code.txt`。
- CUA 人工截图索引（均由 tab 3 输出、未写成本地文件）：`desktop-light-default`、`desktop-light-range-open`、`desktop-hud-default`、`desktop-hud-range-open`。
- 可复核静态证据：三个 `detector-final-*` stdout/stderr/exit-code 文件及本目录 `detector-final-manifest.json`。

本次 Assessment B 仅完成最终目标的静态扫描和桌面人工交互检查。由于 overlay 注入受安全策略阻止，且移动、reduced-motion、page error/请求失败与可归档截图缺少证据，本报告属于阶段性/受限检查，不是正式 Critique 通过结论。
