Method: assessment-b recheck（独立 detector + 浏览器证据；不读取其他评估结果）。

# TransferPanel P2 最终复验证据索引

本目录是最终源码的有界复验，只写证据文件，不修改目标源码、不提交 Git。

## Detector 三件套

5 个 markup 目标分别执行 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>`。每个 stdout 都是合法 `[]`，退出码 `0`，stderr 字节数 `0`。

| 目标 | stdout JSON | stderr | exit code |
| --- | --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | [stdout](./detector-01-transferpanel-index.stdout.json) | [stderr](./detector-01-transferpanel-index.stderr.txt) | [exit](./detector-01-transferpanel-index.exit-code.txt) |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | [stdout](./detector-02-transferpanel-demo.stdout.json) | [stderr](./detector-02-transferpanel-demo.stderr.txt) | [exit](./detector-02-transferpanel-demo.exit-code.txt) |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | [stdout](./detector-03-virtualtree-demo.stdout.json) | [stderr](./detector-03-virtualtree-demo.stderr.txt) | [exit](./detector-03-virtualtree-demo.exit-code.txt) |
| `linkx-fe/docs/components/lxtransferpanel.md` | [stdout](./detector-04-transferpanel-doc.stdout.json) | [stderr](./detector-04-transferpanel-doc.stderr.txt) | [exit](./detector-04-transferpanel-doc.exit-code.txt) |
| `linkx-fe/docs/components/lxvirtualtree.md` | [stdout](./detector-05-virtualtree-doc.stdout.json) | [stderr](./detector-05-virtualtree-doc.stderr.txt) | [exit](./detector-05-virtualtree-doc.exit-code.txt) |

逐条命令另见 `detector-*.command.txt`，机器汇总见 [detector-summary.json](./detector-summary.json)。源码 `[]` 只代表静态扫描零命中，不能单独作为页面通过依据。

## 浏览器环境

复验启动专用 VitePress `http://127.0.0.1:4188/` 和 overlay `http://127.0.0.1:8498/detect.js`。每个视图使用新的 Playwright context 与 page，预检先修改 `document.title`、追加脚本，再等待 detector；同时监听 console、page errors、request failures，采集 DOM 快照和截图。

| 项目 | 结果 |
| --- | --- |
| 视图数量 | 9 |
| 导航/交互成功 | 9/9、9/9 |
| mutable injection | 9/9，`scriptAppended=true`、`overlayScriptPresent=true` |
| overlay HTTP | 9/9 返回 200 |
| page errors / request failures | 0 / 0 |
| 浏览器脚本退出码 | [browser-evidence.exit-code.txt](./browser-evidence.exit-code.txt) 为 0 |
| 原始 JSON | [browser-evidence.json](./browser-evidence.json) |
| 控制台规则摘要 | [browser-console-summary.json](./browser-console-summary.json) |
| 截图 | [screenshots/](./screenshots/) |

## 浏览器视图清单

| 视图 | viewport | 操作与 DOM 状态 | overlay / console | errors / failures | 截图 |
| --- | --- | --- | --- | --- | --- |
| `transfer-desktop-light` | 1280×900 | 亮色；打开 Demo 控制；4 个已选，长名称 2 个 | 29 / 29 | 0 / 0 | [PNG](./screenshots/transfer-desktop-light.png) |
| `transfer-narrow-light` | 390×844 | 窄屏亮色；切到已选面板；4 个已选，长名称 1 个 | 6 / 6 | 0 / 0 | [PNG](./screenshots/transfer-narrow-light.png) |
| `transfer-hud-desktop` | 1280×900 | HUD 复选框开启；`hudPreviewCount=1`，外壳仍为亮色 | 29 / 29 | 0 / 0 | [PNG](./screenshots/transfer-hud-desktop.png) |
| `transfer-long-selected` | 420×900 | 已选面板；用 Enter 展开长名称；`openDisclosureCount=1` | 6 / 6 | 0 / 0 | [PNG](./screenshots/transfer-long-selected.png) |
| `transfer-batch-operations` | 1280×900 | 关闭 5 项限制，筛选“待授权”，点击“全选筛选结果”；已选 4→5 | 29 / 29 | 0 / 0 | [PNG](./screenshots/transfer-batch-operations.png) |
| `transfer-demo-controls` | 1024×768 | 加载失败→重试，面板高度切换到 380px | 10 / 10 | 0 / 0 | [PNG](./screenshots/transfer-demo-controls.png) |
| `virtual-desktop-light` | 1280×900 | 桌面亮色；打开 Demo 控制 | 13 / 13 | 0 / 0 | [PNG](./screenshots/virtual-desktop-light.png) |
| `virtual-narrow-hud` | 390×844 | 窄屏，开启 HUD 与多行插槽压力；`hudPreviewCount=1` | 9 / 9 | 0 / 0 | [PNG](./screenshots/virtual-narrow-hud.png) |
| `virtual-demo-controls` | 1024×768 | 筛选第二辖区→清除，设置示例选择，展开全部；最终 live region 为“已展开全部分支” | 12 / 12 | 0 / 0 | [PNG](./screenshots/virtual-demo-controls.png) |

所有视图均完成一次基础 Tab 探针；DOM 快照记录树 `role=tree`、ARIA live 区域、可见控件和选中列表。无视图失败或跳过。

## 运行时命中与误报边界

- TransferPanel 桌面亮/HUD/批量的去重规则为 `line-length`、`text-overflow`、`gpt-thin-border-wide-shadow`、`buried-raster`、`edge-flush-cards`、`text-occlusion`、`first-viewport-column-overflow`、`bounce-easing`、`layout-transition`；窄屏/长名称为 `clipped-overflow-container`、`gpt-thin-border-wide-shadow`、`buried-raster`、`bounce-easing`、`layout-transition`。
- VirtualTree 桌面为 `buried-raster`、`edge-flush-cards`、`first-viewport-column-overflow`、`text-occlusion`、`layout-transition`；窄屏 HUD 为 `clipped-overflow-container`、`buried-raster`、`text-occlusion`、`layout-transition`；控制视图为 `buried-raster`、`edge-flush-cards`、`text-occlusion`、`layout-transition`。
- 可信的组件级信号：`span.lx-transfer-panel__title` 的 `text-overflow`（桌面约 26px，Demo 控制视图约 66px），以及 detector 指向该按钮的 `空结果`/`加载中` 遮挡提示。它们需要结合组件布局继续复核。
- 需要降权或人工复核的页面级信号：`line-length`、`buried-raster`、阴影/过渡、`edge-flush-cards`、`first-viewport-column-overflow` 多数命中文档表格、代码块或 VitePress 外壳；VirtualTree 的按钮/legend 遮挡命中发生在虚拟滚动行存在时，但实际点击仍成功，不能直接判定为不可用。
- `clipped-overflow-container` 与窄屏页面宽度信号反映完整文档页可能横向溢出；它们不等于组件预览必然溢出，需按 screenshot 和 selector 分开判断。

## 服务与停止

[service-stop.txt](./service-stop.txt) 记录 VitePress launcher PID 21756、其子进程 PID 5864 和 overlay PID 9972 均已停止；停止后端口 4188、8498 均无监听。服务 stdout/stderr 与 overlay exit code 也保留在本目录。

Questions skipped: 本文件只交付 Assessment B 最终复验，定向问题留给父级综合报告。
