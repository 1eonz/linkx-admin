Method: assessment-b recheck（独立 detector + 浏览器证据；不读取其他评估结果）。

# 最终复验报告

5 个目标文件的 CLI detector 均保存了 stdout JSON、stderr 和退出码：结果均为合法 `[]`，exit `0`，stderr 为空。完整三件套见 [evidence-index.md](./evidence-index.md)。

浏览器复验覆盖 9 个独立 context/page：TransferPanel 桌面亮色、窄屏亮色、桌面 HUD、长名称详情、筛选批量、Demo 状态控制，以及 VirtualTree 桌面亮色、窄屏 HUD+插槽压力、Demo 控制入口。9/9 导航、9/9 交互、9/9 mutable injection 和 overlay HTTP 200；page errors 与 request failures 均为 0；9 张截图均已生成。

TransferPanel 的 HUD 视图确认 `hudPreviewCount=1`，主题只作用于组件预览；长名称视图通过 Enter 打开详情，`openDisclosureCount=1`；批量视图筛选“待授权”并全选筛选结果，已选数量由 4 增至 5，状态区同步播报。VirtualTree 的窄屏 HUD 与多行插槽压力均可见；控制入口完成筛选、清除、受控选择和展开全部，最终状态为“已展开全部分支”。

运行时 detector 控制台的命中数为 TransferPanel `29/6/29/6/29/10`，VirtualTree `13/9/12`。这与源码静态 `[]` 并不矛盾：浏览器扫描的是完整 VitePress 文档页，包含站点外壳、表格、代码块、Demo 和虚拟滚动状态。

最终可认为是组件级真实信号、应继续核对的项目：

- `span.lx-transfer-panel__title` 在桌面视图溢出约 26px，在 Demo 控制视图溢出约 66px，selector 直接落在 TransferPanel 标题。
- Demo 控件 `空结果`、`加载中` 被 `select` 覆盖的 detector 命中，需检查面板高度控制附近的实际几何关系。

以下命中目前只能记为页面级或待复核信号：

- `line-length`、`buried-raster`、`gpt-thin-border-wide-shadow`、`bounce-easing`、`layout-transition`、`edge-flush-cards` 多次来自文档外壳、代码展示或通用样式。
- `first-viewport-column-overflow` 将完整文档长列归因于 TransferPanel/VirtualTree section；`clipped-overflow-container` 主要显示在窄屏文档页，不能直接判定组件预览自身横向溢出。
- VirtualTree 的按钮和 legend 被虚拟树行覆盖的命中在交互仍成功的视图出现，需用具体 selector 和截图排除滚动采样造成的误报。

本轮没有失败视图、跳过步骤、page error 或 request failure。VitePress launcher PID 21756、其子进程 PID 5864、overlay PID 9972 均已停止；端口 4188、8498 已释放，记录见 [service-stop.txt](./service-stop.txt)。原始浏览器数据见 [browser-evidence.json](./browser-evidence.json)，规则明细见 [browser-console-summary.json](./browser-console-summary.json)。

Questions skipped: 本文件只交付 Assessment B 最终复验，定向问题由父级综合报告提出。
