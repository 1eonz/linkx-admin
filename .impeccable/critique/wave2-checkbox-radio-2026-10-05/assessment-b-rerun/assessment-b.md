# LxCheckbox / LxRadio Assessment B 复评

日期：2026-10-05  
范围：仅记录 Assessment B 的独立浏览器与 detector 证据，不读取其他评估或 code review 报告，也不代表完整 Critique 结论。

## 结论

本轮覆盖的八个视图均完成采集。按当前证据，未确认 LxCheckbox / LxRadio 本体存在新的视觉或交互缺陷。此结论仅适用于本报告列出的视图和状态；不能替代完整 Critique 或真实用户环境验收。

## 静态检测

对 `linkx-fe/src/components/LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 运行静态 detector：stdout 为 `[]`，stderr 为空，退出码为 `0`。这仅表示该次静态规则扫描没有报告命中，不表示运行页面没有问题，也不单独构成 Critique 通过。

## 浏览器证据

使用 Chrome 154.0.8037.95 与 Playwright 1.58.0，在 `http://127.0.0.1:4174` 逐视图使用独立 BrowserContext。八个视图都完成 detector 注入与扫描；detector 脚本八次均返回 HTTP 200。采集到 0 个网络请求失败和 0 个 HTTP 错误。浏览器 console 有 1 条未带 URL 的通用 404 错误（仅出现在 checkbox 浅色桌面视图）；由于网络记录没有对应 HTTP 错误，目前不能定位来源，故保留为未解决的环境观察，不归因于组件。

| 视图 | 结果 | 核验记录 |
| --- | --- | --- |
| Checkbox 浅色桌面，1280px | 完成，4 个 overlay 节点 | 已选、半选、未选和禁用状态可见；无页面横向溢出。 |
| Checkbox HUD 深色桌面，1280px | 完成，84 个 overlay 节点 | overlay 主要落在代码示例与文档内容；未命中 Checkbox demo 控件。 |
| Checkbox 触屏，375px | 完成，4 个 overlay 节点 | 实际点按长标签选项，控件区域为 269×44px；文档宽度仍为 375px。 |
| Checkbox 禁用已选/半选，375px | 完成，4 个 overlay 节点 | 两种禁用回显均可见；无页面横向溢出。 |
| Radio 浅色桌面，1280px | 完成，3 个 overlay 节点 | 无 Radio demo 控件命中；无页面横向溢出。 |
| Radio HUD 深色桌面，1280px | 完成，82 个 overlay 节点 | 3 个实际 Radio 标签被标为 `ai color palette`；实测颜色均为 `rgb(56, 189, 248)`，与 `#38bdf8` 主色令牌一致，判为 detector 误报。其余命中集中在代码示例。 |
| Radio 触屏，375px | 完成，4 个 overlay 节点 | 实际点按“应急处突”，选项区域为 74×44px；文档宽度仍为 375px。 |
| Radio 键盘 / 减少动效，1280px | 完成，3 个 overlay 节点 | Tab 聚焦“日常勤务”并显示键盘焦点；ArrowRight 选中“应急处突”；垂直组选中“高密加密专线”后按 ArrowDown 跳过禁用项“卫星链路直通”，聚焦并选中“光纤骨干网”。减少动效媒体查询生效，控件 transition 时长为 `1e-05s`。 |

Overlay 逐条核对后，浅色与触屏视图中的命中位于 VitePress 导航、代码复制按钮或文档表格；HUD 视图的大量命中位于 Shiki 代码高亮 token。Radio HUD 上三处组件内命中与设计令牌一致，没有发现可复现的组件级问题。截图中的 overlay 标签数量不作为缺陷数量。

## 限制与文件

CUA 的 IAB 浏览器不可用，原始错误为 `Browser is not available: iab`；该工具调用没有本地进程退出码。后续浏览器证据来自本轮单独启动的 Playwright Chrome。补充后的键盘验证保存在 `browser-evidence.mjs` 与 `browser-evidence.json`；完整 stdout、stderr 和退出码文件也一并保留。

八张视图截图为 `*-overlay.png`。代表性浅色、HUD 深色、触屏、禁用状态及键盘焦点截图已目视核对。浏览器服务 `4174` 仍在 PID `26412` 上运行。本轮没有编辑产品源码；只修正了本目录的 Assessment B 浏览器采集脚本并增加本报告。
