# TransferPanel P2 Assessment B 证据索引

Method: assessment-b（独立 detector + 浏览器证据；不读取其他评估结果）。本目录只保存本次评估产物，未修改目标源码，也未提交 Git。

## 评估范围

| 编号 | 目标 |
| --- | --- |
| 01 | `linkx-fe/src/components/LxTransferPanel/index.vue` |
| 02 | `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` |
| 03 | `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` |
| 04 | `linkx-fe/docs/components/lxtransferpanel.md` |
| 05 | `linkx-fe/docs/components/lxvirtualtree.md` |

## Detector 三件套

每个目标均单独执行：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>`。5 个目标均输出合法 `[]`，退出码为 `0`，stderr 字节数为 `0`。`[]` 只说明源码静态扫描无命中，不能替代浏览器扫描。

| 目标 | stdout JSON | stderr | 退出码 |
| --- | --- | --- | --- |
| TransferPanel/index.vue | [detector-01-transferpanel-index.stdout.json](./detector-01-transferpanel-index.stdout.json) | [detector-01-transferpanel-index.stderr.txt](./detector-01-transferpanel-index.stderr.txt) | [detector-01-transferpanel-index.exit-code.txt](./detector-01-transferpanel-index.exit-code.txt) |
| TransferPanel/demo/basic.vue | [detector-02-transferpanel-demo.stdout.json](./detector-02-transferpanel-demo.stdout.json) | [detector-02-transferpanel-demo.stderr.txt](./detector-02-transferpanel-demo.stderr.txt) | [detector-02-transferpanel-demo.exit-code.txt](./detector-02-transferpanel-demo.exit-code.txt) |
| VirtualTree/demo/basic.vue | [detector-03-virtualtree-demo.stdout.json](./detector-03-virtualtree-demo.stdout.json) | [detector-03-virtualtree-demo.stderr.txt](./detector-03-virtualtree-demo.stderr.txt) | [detector-03-virtualtree-demo.exit-code.txt](./detector-03-virtualtree-demo.exit-code.txt) |
| lxtransferpanel.md | [detector-04-transferpanel-doc.stdout.json](./detector-04-transferpanel-doc.stdout.json) | [detector-04-transferpanel-doc.stderr.txt](./detector-04-transferpanel-doc.stderr.txt) | [detector-04-transferpanel-doc.exit-code.txt](./detector-04-transferpanel-doc.exit-code.txt) |
| lxvirtualtree.md | [detector-05-virtualtree-doc.stdout.json](./detector-05-virtualtree-doc.stdout.json) | [detector-05-virtualtree-doc.stderr.txt](./detector-05-virtualtree-doc.stderr.txt) | [detector-05-virtualtree-doc.exit-code.txt](./detector-05-virtualtree-doc.exit-code.txt) |

汇总：[detector-summary.json](./detector-summary.json)。命令文本也分别保存在 `detector-*.command.txt`。

## 浏览器环境与注入

使用专用 VitePress 开发服务 `http://127.0.0.1:4187/` 和专用 overlay 服务 `http://127.0.0.1:8497/detect.js`。每个视图都使用独立 Playwright browser context 与新 page；先设置 `[Human] Assessment B` 标题并动态追加 `detect.js`，等待 2.5 秒后采集控制台、DOM、键盘、请求和截图。

| 项目 | 结果 |
| --- | --- |
| 独立视图 | 9 个 |
| 导航成功 | 9/9 |
| Demo 操作成功 | 9/9 |
| 脚本可变注入 | 9/9，`scriptAppended=true`、`overlayScriptPresent=true` |
| overlay HTTP | 9/9 返回 200 |
| page errors | 0 |
| request failures | 0 |
| 截图 | [screenshots/](./screenshots/) |
| 原始结果 | [browser-evidence.json](./browser-evidence.json) |
| 控制台规则汇总 | [browser-console-summary.json](./browser-console-summary.json) |

## 浏览器视图

`overlay` 是页面中实际创建的 detector overlay 节点数；控制台规则数来自该视图的 `[impeccable] N anti-patterns found`。这些运行时命中包含 VitePress 文档外壳、代码示例和页面内容，不能把总数直接等同于组件缺陷。

| 视图 | 尺寸 | 操作与可观察状态 | 导航/操作 | overlay / 控制台 | 错误/失败 | 截图 |
| --- | --- | --- | --- | --- | --- | --- |
| `transfer-desktop-light` | 1280×900 | 亮色；打开 Demo 状态与主题；4 个已选项，列表溢出，长名称 2 个 | 通过 | 28 / 28 | 0 / 0 | [PNG](./screenshots/transfer-desktop-light.png) |
| `transfer-narrow-light` | 390×844 | 窄屏亮色；切换到已选面板；4 个已选项 | 通过 | 6 / 6 | 0 / 0 | [PNG](./screenshots/transfer-narrow-light.png) |
| `transfer-hud-desktop` | 1280×900 | 开启 HUD；`hudPreviewCount=1`，文档外壳仍为亮色 | 通过 | 28 / 28 | 0 / 0 | [PNG](./screenshots/transfer-hud-desktop.png) |
| `transfer-long-selected` | 420×900 | 切换已选面板；长名称详情通过键盘 Enter 展开；`openDisclosureCount=1` | 通过 | 6 / 6 | 0 / 0 | [PNG](./screenshots/transfer-long-selected.png) |
| `transfer-batch-operations` | 1280×900 | 关闭 5 项上限；筛选“待授权”；点击“全选筛选结果”；已选从 4 增至 5，状态播报筛选结果已全部选择 | 通过 | 28 / 28 | 0 / 0 | [PNG](./screenshots/transfer-batch-operations.png) |
| `transfer-demo-controls` | 1024×768 | 打开控制；加载失败→重试；面板高度切换至 380px | 通过 | 10 / 10 | 0 / 0 | [PNG](./screenshots/transfer-demo-controls.png) |
| `virtual-desktop-light` | 1280×900 | 桌面亮色；打开 Demo 控制 | 通过 | 13 / 13 | 0 / 0 | [PNG](./screenshots/virtual-desktop-light.png) |
| `virtual-narrow-hud` | 390×844 | 窄屏；开启 HUD 与多行插槽压力；`hudPreviewCount=1` | 通过 | 9 / 9 | 0 / 0 | [PNG](./screenshots/virtual-narrow-hud.png) |
| `virtual-demo-controls` | 1024×768 | 打开控制与“数据操作与定位”；筛选第二辖区→清除；设置示例选择；展开全部 | 通过 | 12 / 12 | 0 / 0 | [PNG](./screenshots/virtual-demo-controls.png) |

全部视图均通过一次基础键盘探针（聚焦首个可聚焦控件后按 Tab）；未观察到 page error 或请求失败。DOM 快照同时记录了 `role=tree`、可见控件数量、ARIA live 区域和选中列表状态。

## 浏览器规则摘要

| 视图族 | 规则（去重） | 解释边界 |
| --- | --- | --- |
| TransferPanel 桌面亮/HUD/批量 | `line-length`, `text-overflow`, `gpt-thin-border-wide-shadow`, `buried-raster`, `edge-flush-cards`, `text-occlusion`, `bounce-easing`, `layout-transition` | 命中包含文档页代码块、文档表格和外壳；组件标题溢出及控制按钮遮挡需人工复核 |
| TransferPanel 窄屏/长名称 | `clipped-overflow-container`, `gpt-thin-border-wide-shadow`, `buried-raster`, `bounce-easing`, `layout-transition` | 页面滚动宽度大于窄视口，部分来源可能是 VitePress 外壳；长名称详情展开成功 |
| TransferPanel Demo 控制 | `text-overflow`, `text-occlusion`, `edge-flush-cards`, `first-viewport-column-overflow`, `gpt-thin-border-wide-shadow`, `buried-raster`, `bounce-easing`, `layout-transition` | 状态切换和高度选择成功；规则覆盖文档正文与示例代码 |
| VirtualTree 桌面 | `buried-raster`, `edge-flush-cards`, `first-viewport-column-overflow`, `text-occlusion`, `layout-transition` | 控制按钮/legend 的遮挡命中应结合截图与源码定位，页面长列也会触发首屏折叠规则 |
| VirtualTree 窄屏 HUD | `clipped-overflow-container`, `buried-raster`, `text-occlusion`, `layout-transition` | HUD 仅作用于树预览；窄屏文档页面出现横向滚动信号 |
| VirtualTree Demo 控制 | `buried-raster`, `edge-flush-cards`, `text-occlusion`, `layout-transition` | 筛选、清除、受控选择和展开全部均执行成功 |

## 失败与恢复记录

1. 第一次 VitePress 启动错误地使用不存在的 `node_modules/vitepress/bin/vitepress.mjs`，stderr 已保存在 [vitepress.stderr.log](./vitepress.stderr.log)；随后改用实际存在的 `bin/vitepress.js`，4187 健康检查返回 200。
2. 第一次 Playwright 默认寻找不存在的 `chromium_headless_shell-1200`，随后使用环境中已存在的 Chromium headless shell 1243 重试成功。脚本和最终结果见 [browser-evidence.mjs](./browser-evidence.mjs) 与 [browser-evidence.json](./browser-evidence.json)。
3. 修正 VirtualTree Demo 控制器的严格 locator 后重新执行完整 9 视图，最终操作成功率为 9/9。

服务停止记录见 [service-stop.txt](./service-stop.txt)：VitePress PID 8464 与 overlay PID 11732 已停止，停止后 4187、8497 均无监听。

Questions skipped: 本文件是 Assessment B 证据分册，定向设计问题留给父级综合报告。
