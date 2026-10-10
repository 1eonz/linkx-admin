Method: assessment-b（独立 detector + 浏览器证据；不读取其他评估结果）。

# 结论

5 个 markup 目标的 CLI detector 均输出合法 `[]`，退出码均为 0，stderr 均为空。这个结果只代表源码静态规则没有命中；运行时浏览器 detector 在 9 个独立视图均成功注入并产生可见 overlay，说明需要结合页面上下文解释浏览器命中。

浏览器证据共 9/9 视图成功：导航 9/9、Demo 交互 9/9、`detect.js` 可变注入 9/9、overlay HTTP 200 为 9/9、page errors 0、request failures 0。全部视图均生成截图。原始明细在 [browser-evidence.json](./browser-evidence.json)，截图在 [screenshots/](./screenshots/)。

# Detector 证据

目标与三件套索引：

- `LxTransferPanel/index.vue`：[stdout](./detector-01-transferpanel-index.stdout.json)、[stderr](./detector-01-transferpanel-index.stderr.txt)、[exit](./detector-01-transferpanel-index.exit-code.txt)，结果 `[]` / `0` / 空。
- `LxTransferPanel/demo/basic.vue`：[stdout](./detector-02-transferpanel-demo.stdout.json)、[stderr](./detector-02-transferpanel-demo.stderr.txt)、[exit](./detector-02-transferpanel-demo.exit-code.txt)，结果 `[]` / `0` / 空。
- `LxVirtualTree/demo/basic.vue`：[stdout](./detector-03-virtualtree-demo.stdout.json)、[stderr](./detector-03-virtualtree-demo.stderr.txt)、[exit](./detector-03-virtualtree-demo.exit-code.txt)，结果 `[]` / `0` / 空。
- `docs/components/lxtransferpanel.md`：[stdout](./detector-04-transferpanel-doc.stdout.json)、[stderr](./detector-04-transferpanel-doc.stderr.txt)、[exit](./detector-04-transferpanel-doc.exit-code.txt)，结果 `[]` / `0` / 空。
- `docs/components/lxvirtualtree.md`：[stdout](./detector-05-virtualtree-doc.stdout.json)、[stderr](./detector-05-virtualtree-doc.stderr.txt)、[exit](./detector-05-virtualtree-doc.exit-code.txt)，结果 `[]` / `0` / 空。

# 浏览器观察

- TransferPanel 桌面亮色、HUD、批量和 Demo 控制视图中，树角色、已选列表和 ARIA live 状态均存在；HUD 视图的 `hudPreviewCount=1`，主题只覆盖组件预览。
- TransferPanel 窄屏视图可切换已选面板；长名称视图中用键盘 Enter 展开了长名称详情，`openDisclosureCount=1`。批量操作视图筛选“待授权”并点击“全选筛选结果”，已选数量由 4 增为 5，状态区播报筛选结果已全部选择。
- VirtualTree 窄屏 HUD 视图同时开启了 HUD 和多行插槽压力，`hudPreviewCount=1`；Demo 控制视图完成筛选第二辖区、清除筛选、设置示例选择和展开全部。
- 每个视图都执行了新标签/新 context、标题变更、脚本追加、截图、DOM 快照和一次 Tab 键盘探针；没有 page error 或 request failure。

浏览器控制台规则命中数量为：TransferPanel 桌面亮/HUD/批量各 28，窄屏亮/长名称各 6，Demo 控制 10；VirtualTree 桌面 13，窄屏 HUD 9，Demo 控制 12。常见规则为 `buried-raster`、`layout-transition`、`gpt-thin-border-wide-shadow`、`text-occlusion`、`edge-flush-cards`、`clipped-overflow-container`、`first-viewport-column-overflow` 和 `line-length`。这些命中来自完整 VitePress 文档页面，包含站点外壳、表格、代码展示和 Demo，不能把规则计数直接当成组件缺陷；需优先按截图和 selector 对实际预览进行复核。

# 可复核问题信号

1. 桌面 TransferPanel 控制台报告 `span.lx-transfer-panel__title` 溢出约 26px，并报告 Demo 控件 `空结果`、`加载中` 被 select 覆盖；这是实际组件/宿主布局中最值得继续人工核对的运行时信号。
2. 窄屏页面 DOM 的 `scrollWidth` 大于视口宽度，命中 `clipped-overflow-container`；截图显示 VitePress 文档长列和外壳参与扫描，需区分文档页面横向溢出与组件自身宽度。
3. VirtualTree 控制器视图报告按钮和 legend 被树行覆盖；交互点击仍成功，说明 detector 可能把滚动中的树行或文档布局当作遮挡目标，应通过具体 selector 与截图确认是否为真实不可点击遮挡。
4. `buried-raster`、`edge-flush-cards`、`line-length` 和 `layout-transition` 多次来自文档页代码/表格或通用外壳，属于待筛除或降权的页面级信号。

# 运行清理

本波启动的 VitePress PID 8464 和 overlay live-server PID 11732 已停止；停止后端口 4187、8497 均无监听。停止证据在 [service-stop.txt](./service-stop.txt)。

Questions skipped: 本文件只交付独立 Assessment B 证据，定向问题由父级综合报告提出。
