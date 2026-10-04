# Assessment B：LxTreeSelect 与 LxCascader 最终证据

方法：独立 detector + 浏览器证据采集。未读取 Assessment A。未修改产品源码。文档服务 `http://127.0.0.1:4174` 是已有进程，本次未停止或重启；只停止了本次启动的 Impeccable detector server（端口 8400）。

## 静态 detector

四个目标均由 bundled `detect.mjs --json` 单独扫描。四份 stdout 均为 `[]`，stderr 均为空，进程退出码均为 `0`。这只表示静态扫描没有规则命中，不代表视觉、可访问性或浏览器 Critique 通过。

| 目标 | JSON stdout | stderr | exit code |
|---|---|---|---:|
| `linkx-fe/src/components/LxTreeSelect/index.vue` | [treeselect-source-final.stdout.json](./treeselect-source-final.stdout.json) | [treeselect-source-final.stderr.txt](./treeselect-source-final.stderr.txt) | [0](./treeselect-source-final.exit-code.txt) |
| `linkx-fe/src/components/LxCascader/index.vue` | [cascader-source-final.stdout.json](./cascader-source-final.stdout.json) | [cascader-source-final.stderr.txt](./cascader-source-final.stderr.txt) | [0](./cascader-source-final.exit-code.txt) |
| `linkx-fe/docs/components/lxtreeselect.md` | [treeselect-docs-final.stdout.json](./treeselect-docs-final.stdout.json) | [treeselect-docs-final.stderr.txt](./treeselect-docs-final.stderr.txt) | [0](./treeselect-docs-final.exit-code.txt) |
| `linkx-fe/docs/components/lxcascader.md` | [cascader-docs-final.stdout.json](./cascader-docs-final.stdout.json) | [cascader-docs-final.stderr.txt](./cascader-docs-final.stderr.txt) | [0](./cascader-docs-final.exit-code.txt) |

## 浏览器证据

使用复制到 `final-run` 的修订脚本，以 Playwright 新建六个独立页面；未复用已有浏览器标签。每页都从文档 URL 导航后注入 `http://127.0.0.1:8400/detect.js`，等待 overlay 运行，再保存 viewport 截图和页面证据。每个视图有 408–409 个浏览器请求，均为文档页、Vite/VitePress 模块与组件资源请求；没有写操作。共记录 61 条 console 消息，其中六条 detector 汇总分别确认 overlay 运行，未记录 pageerror。TreeSelect 首个桌面页有一条通用资源 404 console 错误；对应响应事件没有捕获到 4xx，URL 未能从 console 文本确定。

| 视图 | 结果与页面状态 | overlay detector console 命中 | 截图 |
|---|---|---|---|
| TreeSelect 桌面英文 footer | 1280×900，文档宽度 1280；English footer 已勾选 | 5：`buried-raster`（2 条）、`gpt-thin-border-wide-shadow`、`edge-flush-cards`、`layout-transition` | [treeselect-final-desktop-overlay-final.png](./final-run/treeselect-final-desktop-overlay-final.png) |
| TreeSelect 桌面打开弹层 | 1280×900，树弹层可见，含禁用节点 | 5：`buried-raster`（2）、`clipped-overflow-container`、`gpt-thin-border-wide-shadow`、`edge-flush-cards`、`layout-transition` | [treeselect-final-open-overlay-final.png](./final-run/treeselect-final-open-overlay-final.png) |
| TreeSelect 移动失败 | 375×812；错误文案“组织目录加载失败，请重试。”与“重试”按钮可见，`aria-busy` 未置位 | 6：`clipped-overflow-container`、`buried-raster`（2）、`gpt-thin-border-wide-shadow`、`text-occlusion`、`layout-transition` | [treeselect-final-error-mobile-overlay-final.png](./final-run/treeselect-final-error-mobile-overlay-final.png) |
| Cascader 桌面 | 1280×900，组织路径、状态面板可见 | 汇总 5；日志标签：`buried-raster`、`gpt-thin-border-wide-shadow`、`overused-font`、`layout-transition`、`edge-flush-cards`、`first-viewport-column-overflow` | [cascader-final-desktop-overlay-final.png](./final-run/cascader-final-desktop-overlay-final.png) |
| Cascader 桌面打开弹层 | 1280×900，级联列弹层可见 | 汇总 7；日志标签：`buried-raster`、`gpt-thin-border-wide-shadow`、`overused-font`、`layout-transition`、`edge-flush-cards`、`text-occlusion`（2）、`first-viewport-column-overflow` | [cascader-final-open-overlay-final.png](./final-run/cascader-final-open-overlay-final.png) |
| Cascader 移动“加载中且失败” | 375×812；显示“加载中”，`aria-busy=true`，错误及重试隐藏 | 汇总 4；日志标签：`clipped-overflow-container`、`buried-raster`、`gpt-thin-border-wide-shadow`、`overused-font`、`layout-transition` | [cascader-loading-error-mobile-final.png](./final-run/cascader-loading-error-mobile-final.png) |

加载与失败并发时隐藏失败反馈是 demo 和组件明示的优先级规则，因此 Cascader 移动视图捕获到加载状态属于预期行为。两张 375px 文档页面的 `documentElement.scrollWidth` 为 615px，说明整页存在横向溢出；该值涵盖 VitePress 文档外壳，不能单凭它归因给目标组件。TreeSelect 打开弹层时 detector 命中 `clipped-overflow-container`，截图确认命中对象为弹层容器；需要结合组件与 Popper 的实际裁切边界判断，不把规则计数直接当缺陷数。其他常见命中涉及文档代码区、props 表格或 VitePress 页面结构，overlay 命中只记录为待核验建议。

浏览器原始事件及六个页面快照见 [browser-evidence-final.json](./final-run/browser-evidence-final.json)；本次独立脚本见 [capture-final-evidence.mjs](./final-run/capture-final-evidence.mjs)。

## 结论

四个静态目标扫描完成且零命中；所需六个浏览器视图均由新页面采集，overlay 注入成功并有 console 与截图证据。已覆盖 TreeSelect 英文 footer、打开弹层、移动失败，以及 Cascader 桌面、打开弹层、移动加载与失败并发。移动文档宽度溢出与 overlay 建议应进入整体综合评审；Assessment B 本身不据 detector 命中数判定 Critique 通过。
