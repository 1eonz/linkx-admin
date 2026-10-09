# LxTransferPanel Assessment A 修前证据索引

状态：**修前过程材料，不用于最终综合。** 主 Agent 已指出主题所有权边界仍待修复；本目录保存修复开始前独立 Assessment A 的证据，最终冻结版需重跑 Assessment A。  
页面：<http://127.0.0.1:4174/components/lxtransferpanel>  
浏览器：Microsoft Edge headless，通过 Chrome DevTools Protocol 创建全新 BrowserContext 与独立页面；本轮没有运行 detector 或读取 Assessment B 结果。

## 哈希与版本边界

浏览器采集启动时读取到的 SHA-256：

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `9250D31A3A382A7D252459C671614CDA4CA681FE0DA0B3C791D3219D4684A0A1` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `1D268A815C1F85BEF916A16731368ED7F1FA9542CFDD862A18D7BC47C3B57272` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C13B6CF97C9FAB39E62CCC82D4CF3B9C71BAEC751D1C3EB4F968C1D33FBB9CC2` |

本轮末次复核时，Demo 哈希已变为 `B5D719222984DB8D4C4094E946287616BBFCAB6746E8B64C64FD08ADB5E0176F`，与采集启动哈希不同，说明并行修复期间 Demo 文件发生变化。浏览器证据覆盖 `2026-10-07T18:39:58Z` 至 `18:40:14Z`，不能证明该区间所有截图都对应同一份 Demo；请将本索引与报告视为修前过程材料，不能用于末次哈希的最终视觉验收。组件与中文文档末次哈希与表中相同。本评估代理没有编辑产品文件。

## 截图

截图均为目标文档整页，移动视口以 CSS 像素计：

| 文件 | 视口 / 场景 | 观察点 |
|---|---|---|
| [current-desktop-light.png](current-desktop-light.png) | 1440×1080，Light | 1,420 节点样例、双栏选择、全量操作和继承说明。 |
| [current-mobile-375-light.png](current-mobile-375-light.png) | 375×812，Light | 窄屏纵向面板及页面无横向溢出。 |
| [current-mobile-320-light.png](current-mobile-320-light.png) | 320×760，Light | 已选长名称自然换行、纵向面板和文档表格阅读宽度。 |
| [current-desktop-hud.png](current-desktop-hud.png) | 1440×1080，HUD | 深色页面上的面板、状态及继承说明。 |
| [current-hud-danger-confirmation.png](current-hud-danger-confirmation.png) | 1440×1080，HUD 危险确认 | 未加载授权全量清空确认框及实际配色。 |
| [current-empty-tree.png](current-empty-tree.png) | HUD，空树 | 左树空结果；右侧既有选择保留。 |
| [current-loading.png](current-loading.png) | HUD，加载中 | 真实加载消息、禁用外观。 |
| [current-error.png](current-error.png) | HUD，错误 | 选择保留、错误说明和重试入口。 |
| [current-selection-limit.png](current-selection-limit.png) | HUD，上限 | 全量和筛选加入禁用原因。 |
| [current-keyboard-selected-list.png](current-keyboard-selected-list.png) | HUD，键盘聚焦 | Tab 到达可滚动结果清单且焦点环可见。 |
| [current-reduced-motion.png](current-reduced-motion.png) | HUD，减少动效 | `prefers-reduced-motion` 下组件呈现。 |

## DOM / ARIA 证据

完整浏览器记录见 [current-browser-evidence.json](current-browser-evidence.json)。主要观察如下：

- 三种视口均显示“全部加入”和“全部移除”；继承范围说明的 ID 与复选框 `aria-describedby` 对应。
- 320px 页面宽度为 320px，组件宽 272px；所有选中项的 `scrollWidth` 等于 `clientWidth`。历史授权长名称为 `white-space: normal`、`overflow-wrap: anywhere`，行高增至约 104px。
- HUD 危险确认框实际背景为 `rgb(11, 18, 32)`，标题为 `rgb(247, 137, 137)`，正文为 `rgb(148, 163, 184)`，确认按钮背景为 `rgb(245, 108, 108)`。取消后仍选 5 项。
- 上限 5 项时，全量加入和筛选全选均禁用，并关联剩余名额为 0 的完整原因。
- 加载态 `aria-busy=true`、组件根 `inert=true`、透明度 `0.62`；错误态 `role=alert` 显示选择仍保留及重试，重试后 5 项选择不变。
- 已选列表可用 Tab 到达，`tabindex=0`、可滚动且有 2px 可见焦点环。减少动效时，面板与列表的 transition / animation 均为 `0.00001s`。
- 在本轮实测的“挂载前已有主题类”和“Demo 自行打开主题”两种场景中，卸载前后的根主题类记录见 JSON。主 Agent 的后续说明指出仍有其他主题所有权边界需要修复；本轮报告按修前过程材料处理，不以已测场景代替最终 A 验收。

## 方法边界

页面来自本地 VitePress，未访问真实后端。状态证据只代表示例交互；没有进行 detector、Assessment B、真实授权联调或 E2E 测试。`final-assessment.md` 含十项评分、认知负荷、优势、优先问题、persona 红旗、细节观察及问题，且已在报告顶部标为修前/过程材料。
