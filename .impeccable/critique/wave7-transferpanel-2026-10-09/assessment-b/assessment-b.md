# LxTransferPanel Assessment B 证据

采集日期：2026-10-09  
目标页面：`http://127.0.0.1:4174/components/lxtransferpanel`  
对应源码：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`  
Impeccable skill：`C:\Users\Administrator\.codex\skills\impeccable`，版本 `4.1.3`

本记录仅包含 Assessment B 的静态 detector 和浏览器证据，不含设计评审结论，也未读取 Assessment A。采集期间没有修改组件源码；浏览器前后 SHA-256 均为 `525742ad6e0a2f2c163f17b6fc64b2bca6c4cc70f1beddee75efb5c246adcccf`。

## 静态 Detector

命令：

```text
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "linkx-fe/src/components/LxTransferPanel/demo/basic.vue"
```

- 退出码：`0`
- 标准输出：`[]`
- stderr：空
- 解释：该 Vue markup 目标的静态扫描为零命中。这里的 `[]` 有退出码 `0` 且 stderr 为空作为证据；它只说明此文件没有触发静态规则，不能替代浏览器检查或整体验收。

原始结果见 [detector.stdout.json](detector.stdout.json)、[detector.stderr.txt](detector.stderr.txt)、[detector.exit-code.txt](detector.exit-code.txt) 和 [detector.command.txt](detector.command.txt)。

## 浏览器环境与注入

- 用 `@playwright/test` 启动系统 Chrome，版本为 `HeadlessChrome/154.0.0.0`；在独立 browser context 中新建 page，没有复用用户现有标签。
- 页面响应 `200`，标题为 `LxTransferPanel 双栏穿梭 | LxUI`。
- 可变注入预检通过：页面标题改为 `[Human] LxTransferPanel Assessment B`，新增 script 节点并成功执行。
- detector overlay 从 `http://localhost:8400/detect.js` 加载成功；页面存在 `impeccableDetect`、`impeccableScan` 等运行时 API。控制台报告 `[impeccable] 25 anti-patterns found`；序列化扫描得到 25 个 DOM 分组、26 条规则命中。
- 本次没有可连接到该 Playwright 实例的可视浏览器标签呈现接口，因此 overlay 证据来自新建 headless 页面及截图，不声称它显示在用户已有浏览器标签中。
- 浏览器控制台另有一次 `http://127.0.0.1:4174/favicon.ico` 的 `404` 资源错误；没有页面运行时异常。该错误与 TransferPanel 交互无关。

## Overlay 命中

| 规则 | 数量 | 页面位置与证据范围 |
|---|---:|---|
| `line-length` | 19 | 命中 VitePress `.vp-doc` 中的段落和列表项，属于文档文字区域，不是 TransferPanel 面板节点。完整选择器和文本摘要在浏览器证据 JSON 中。 |
| `gpt-thin-border-wide-shadow` | 1 | 命中实际组件节点 `.lx-transfer-panel__scope-action-content`。当前默认状态下 `display:none`，矩形为 `0×0`；其计算样式为 `1px` border 与 `0 4px 16px` shadow。该证据只确认它是隐藏的组件内节点，不能据此判断其展开后的呈现。 |
| `buried-raster` | 3 | 命中 VitePress 代码示例的 `.copy` 按钮；当前静止态 `opacity:0`，背景图为内嵌 SVG data URL。属于文档外壳控件的状态相关命中，截图和计算样式已保存。 |
| `edge-flush-cards` | 1 | 命中 VitePress Props 文档表格 `table:nth-of-type(1)`，不是组件双栏选择面板。 |
| `bounce-easing` | 1 | 归属 `body` 的页面级命中。 |
| `layout-transition` | 1 | 归属 `body` 的页面级命中。 |

overlay 覆盖图中，多数描边出现在文档段落、Props 表、代码复制按钮及全局 `body`，并非选择器面板本体。`scope-action-content` 是唯一落在组件命名空间的命中，但默认隐藏。文档外壳和全局规则命中不能直接算作 TransferPanel 缺陷；是否属于有设计依据的主题规则，留给综合评审结合对应样式来源判断。完整选择器、坐标、规则 detail 与计算样式见 [browser-evidence.json](browser-evidence.json)。

## 状态测量与截图

| 状态 | 视口 | `.lx-transfer-panel` 尺寸 | 页面水平溢出 |
|---|---:|---:|---|
| 默认高度 300px | 1440×1000 | 880×300 | 否，1440/1440 |
| 紧凑高度 240px | 1440×1000 | 880×240 | 否，1440/1440 |
| 标准高度 380px | 1440×1000 | 880×380 | 否，1440/1440 |
| 紧凑高度 240px | 320×844 | 272×488 | 是，文档 `scrollWidth=468`、`clientWidth=320` |

窄屏读数是整个组件根节点的外框高度；此状态下页面内容重排，读数不能解释为单个左右面板分别达到 488px。当前证据确认文档整体发生横向溢出，但不单凭此项归因到组件节点。

截图：

- [默认页及 overlay](screenshots/overlay-default-1440x1000.png)
- [240px](screenshots/desktop-height-240-1440x1000.png)
- [300px](screenshots/desktop-height-300-1440x1000.png)
- [380px](screenshots/desktop-height-380-1440x1000.png)
- [320px 窄屏、240px](screenshots/narrow-height-240-320x844.png)

## 命令与清理

- 静态扫描退出码 `0`；原始 stdout、stderr 和退出码分别保存。
- 浏览器采集命令退出码 `0`；具体命令记录在 [browser-capture.command.txt](browser-capture.command.txt)，输出及退出码分别保存。
- overlay 服务在 `127.0.0.1:8400` 启动成功并在采集后停止；使用 `stop --keep-inject`，未调用页面源码注入/移除流程。启动与停止的命令、输出、stderr、退出码均有独立记录；停止后端口无监听进程。
- `sourceUnchangedDuringCapture=true`；浏览器采集前后源码哈希相同。

完整原始数据见 [browser-evidence.json](browser-evidence.json)。本证据可用于综合评审；静态扫描零命中不等于 Impeccable Critique 整体通过。
