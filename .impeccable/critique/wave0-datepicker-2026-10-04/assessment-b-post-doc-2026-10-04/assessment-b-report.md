# LxDatePicker Assessment B

本报告记录独立的 detector 与浏览器证据，目标页面为 `http://127.0.0.1:4174/components/lxdatepicker.html`。页面预检返回 HTTP 200；独立 Chrome 154.0.8037.95 使用 `C:/Program Files/Google/Chrome/Application/chrome.exe` 启动。新页面成功修改标题、追加并执行探针脚本，随后成功注入 `/detect.js` 并调用 `window.impeccableScanAsync()`。

## 取证版本

开始与结束的 SHA-256 完全一致：

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxDatePicker/index.vue` | `9C0C99C6FA50A451D3A36D56F0287C9CBDCE7D220847ACF07915831CC7023B88` |
| `linkx-fe/src/components/LxDatePicker/style.css` | `030760F23A2420E90C23806A0758C19EA21F9A6C998EC37D93C632876550DC27` |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | `1E62E4705E1203070FE526C2063DC12739CA2F1BF3203F373CA0BCA94B0C2368` |
| `linkx-fe/docs/components/lxdatepicker.md` | `1F430653213950481D7FDBD134F61CB18B5EA98A509E70ACDCF621541DC92AD4` |

指纹记录在 `target-fingerprints-start.json`、`target-fingerprints-end.json` 和 `fingerprint-comparison.json`。

## CLI Detector

| 目标 | stdout JSON | stderr | 退出码 |
|---|---|---|---:|
| `src/components/LxDatePicker/index.vue` | `[]` | 空 | 0 |
| `src/components/LxDatePicker/demo/basic.vue` | `[]` | 空 | 0 |
| `docs/components/lxdatepicker.md` | `[]` | 空 | 0 |

每项输出均通过 JSON 解析。`style.css` 按 detector 规则不作为 CSS-only CLI 输入；样式已通过运行页面浏览器扫描。`[]` 只表示对应静态目标零命中，不代表运行时页面没有问题。每项目标的 stdout、stderr、退出码分别保存在同名证据文件中。

## 浏览器结果

截图实际像素尺寸：桌面亮色/HUD/键盘/减少动效均为 `1440×900`，移动视图为 `390×844` 和 `375×844`。桌面亮色截图显示九月与十月双面板、周一至周日表头、区间填色和首尾日期；HUD 截图显示深色日历与青色强调。390px 截图显示单面板且页面内容宽度为 390px，没有水平溢出。375px 截图文件确为 375×844，但该次移动 emulation 报告 `window.innerWidth=615`、`body.scrollWidth=375`，因此基于 `innerWidth` 的溢出指标不可靠；截图仍保留为该物理尺寸下的页面证据。

键盘复现步骤：点击 `[data-testid="range"] input.el-range-input` 的第一个输入，按 `ArrowDown`；焦点移到日期格 `TD.available.in-range.start-date`（文本 `15`），`:focus-visible` 为 `true`。随后按 `Escape`，查询 `.el-date-range-picker:visible` 仍得到至少一个面板，记录为 `escapeClosed: false`；这与 Demo 文案所述的 Escape 关闭行为不符。Escape 后没有另行读取 `document.activeElement`，所以此处只确认面板仍可见，不推断焦点是否迁移。详细前后记录见 `keyboard-evidence.json`。

减少动效视图中 `prefers-reduced-motion` 为 `true`，触发器与弹层的 transition/animation duration 均为 `1e-05s`。

高对比度取样结果见 `contrast-validation.json`：亮色区间中段、端点、星期表头分别为 `14.65:1`、`6.47:1`、`7.10:1`；HUD 对应取样为 `10.19:1`、`8.74:1`、`6.13:1`。采集脚本中的内联 ratio 字段为空（颜色解析器未匹配到 RGB 数字），这些比值因此由已记录的浏览器 computed colors 独立重算；HUD 中段半透明底色按实测日历底色合成，所有取样均超过 4.5:1。

## Overlay 核验

五种打开区间面板的状态均成功加载 detector 脚本、执行扫描，并绘制 overlay 标记：桌面亮色 24 项、HUD 48 项、HUD 减少动效 48 项、390px 16 项、375px 16 项。完整 selector、规则名、详情、marker 数量以及截图见 `overlay-evidence.json` 和相应 `*-overlay.png`。

- HUD 的 `ai-color-palette` 命中指向日期图标、日期格和表头的青色；截图与组件 HUD 主题一致。颜色取样对比度充足，属于有设计依据的令牌命中，不能按 33 个规则项算成 33 个独立缺陷。
- `text-occlusion` 命中出现在日历弹层打开时，指向其覆盖的说明、标题和字段标签。截图确认弹层在桌面会向上展开并覆盖邻近说明，在窄屏会压住下方说明；这反映弹层覆盖关系，不是静态状态下文字互相重叠。是否保留说明在弹层打开时可见，仍需结合交互意图评估。
- `line-length` 在组件示例说明 `.lx-date-picker-demo__hint` 与 `.lx-date-picker-demo__note` 上报约 105/109 字符；这是组件页面内容命中，可作为精简长说明的候选。其余 `button.copy`、`table`、`body` 与 `.container` 命中来自文档站代码示例、表格或页面容器，不应直接归因给日期选择器。
- 8 个 `#el-id-1024-*` 节点命中 `gpt-thin-border-wide-shadow`，属于运行时生成的 Element Plus ID。截图中主要视觉阴影来自日期弹层；规则命中应按实际组件和令牌逐个核对，不按 ID 数量统计缺陷。

## 运行记录

浏览器采集共记录 2,476 个 request/response 事件，无 `requestfailed`、无 page error。唯一 console error 是文档站 `/favicon.ico` 返回 404，与组件请求无关。Impeccable live server 在 `localhost:8400` 启动并健康检查 200；停止命令 `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs" stop --keep-inject` 退出码为 0，之后 `/health` 已不可访问。

完整截图：`desktop-1440x900-light-range-open.png`、`desktop-1440x900-light-range-open-overlay.png`、`desktop-1440x900-hud-range-open.png`、`desktop-1440x900-hud-range-open-overlay.png`、`desktop-1440x900-keyboard-focus.png`、`desktop-1440x900-hud-reduced-motion.png`、`mobile-390x844-range-open-overlay.png`、`mobile-375x844-range-open-overlay.png`。本目录也保留原始 console、网络、page error、preflight、server stop、detector JSON/错误流/退出码和采集脚本。
