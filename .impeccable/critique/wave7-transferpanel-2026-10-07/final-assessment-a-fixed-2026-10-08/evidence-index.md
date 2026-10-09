# LxTransferPanel Assessment A 证据索引

采集时间：2026-10-08（本地时间；浏览器记录为 2026-10-07T18:15:07Z 至 18:15:20Z）  
目标页：<http://127.0.0.1:4174/components/lxtransferpanel>  
浏览器：Microsoft Edge Headless，通过 Chrome DevTools Protocol 创建新的 `BrowserContext` 与独立页面 target。页面状态均在本地 Demo 中切换，未调用业务后端。

## 哈希冻结

目标源码、Demo 和中文文档在页面采集前及报告落盘前分别计算 SHA-256，值一致：

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `9250D31A3A382A7D252459C671614CDA4CA681FE0DA0B3C791D3219D4684A0A1` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `C2D78A29FF33D027C873B0AE41D99FAEE7E96BFBC9E3DF0B5A5B9A4888D4FDFA` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C13B6CF97C9FAB39E62CCC82D4CF3B9C71BAEC751D1C3EB4F968C1D33FBB9CC2` |

采集期间未修改上述文件。浏览器截图和结构化证据详见 [browser-evidence.json](browser-evidence.json)。

## 截图索引

以下为整页截图；表内移动设备尺寸是 CSS 视口尺寸。

| 文件 | 视口 / 状态 | 证据内容 |
|---|---|---|
| [desktop-light.png](desktop-light.png) | 1440×1080，Light，正常数据 | 5:2:5 双栏、常驻全量按钮文案、继承说明、未加载项与 1,420 节点样例。 |
| [mobile-375-light.png](mobile-375-light.png) | 375×812，Light | 竖向布局、文案换行、窄屏页面边界。 |
| [mobile-320-light.png](mobile-320-light.png) | 320×760，Light | 最窄视口布局与页面无横向溢出；用于观察长表格与组件的手机呈现。 |
| [desktop-hud.png](desktop-hud.png) | 1440×1080，HUD，正常数据 | HUD 下的面板、状态色和继承说明。 |
| [hud-danger-confirmation.png](hud-danger-confirmation.png) | 1440×1080，HUD，危险确认打开 | 未加载授权的全量移除确认框及取消/危险按钮。对应真实计算颜色在 JSON 的 `hudDangerConfirmation` 中。 |
| [empty-tree.png](empty-tree.png) | 1440×1080，HUD，宿主返回空树 | 左侧空树，现有 5 项已选授权仍保留。 |
| [loading-state.png](loading-state.png) | 1440×1080，HUD，加载中 | 加载消息、`aria-busy=true` 和面板暂态。 |
| [error-state.png](error-state.png) | 1440×1080，HUD，加载失败 | 错误说明、保留选择状态和重试入口。 |
| [selection-limit.png](selection-limit.png) | 1440×1080，HUD，选择上限 | 5 项上限下全量加入与筛选加入均禁用，当前剩余名额为 0。 |
| [selected-list-keyboard-focus.png](selected-list-keyboard-focus.png) | 1440×1080，HUD，Tab 聚焦已选列表 | Tab 从右侧搜索框到达可滚动已选列表；2px 可见焦点环。 |
| [reduced-motion.png](reduced-motion.png) | 1440×1080，HUD，`prefers-reduced-motion: reduce` | 页面在减少动效偏好下的外观；组件/列表计算样式数据见 JSON。 |

## DOM 与交互记录

- 全量按钮在桌面及两种移动宽度都存在且可见，显示文案分别为“全部加入”和“全部移除”。
- 继承说明文本与复选框的 `aria-describedby` 值一致；文档说明该文案由宿主按真实授权语义提供。
- HUD 确认框实际背景 `rgb(11, 18, 32)`；危险标题 `rgb(247, 137, 137)`；正文 `rgb(148, 163, 184)`；确认按钮背景 `rgb(245, 108, 108)`、文字 `rgb(11, 18, 32)`；取消按钮背景 `rgb(16, 26, 44)`。
- 320px 与 375px 下 `documentElement.scrollWidth === clientWidth`；目标组件宽分别为 272px 和 327px，均没有横向溢出。
- 上限操作实测：全量加入按钮禁用，旁边显示“已达上限 5 项”，完整 `aria-describedby` 为“已达到选择上限 5 项，不能继续加入待选节点”；筛选加入也禁用，状态说明指出 1 项未选、可再选 0 项。
- Tab 聚焦已选列表成功，`tabindex=0`，可滚动，焦点样式 `2px solid rgb(56, 189, 248)`。
- 设置减少动效后 `matchMedia('(prefers-reduced-motion: reduce)').matches` 为 true，面板与列表 transition / animation 均为 `0.00001s`。
- 空树、加载、错误和重试均在本地 Demo 中切换；错误恢复后 5 项选择仍保留。

## 采集边界

`browser-evidence.json` 的两项值需要结合本索引阅读：脚本用 `[role="status"]` 查询时先命中全量加入的隐藏说明，因此 `loading.status` 字段不是加载消息；`messageVisible=true`、`aria-busy=true` 及加载截图是有效证据。脚本在 `.transfer-panel-demo__surface` 外层读取 `inert` 和 opacity，不代表组件根节点状态，本评估没有据此断言面板是否由 `inert` 阻断。

采集脚本在截图和 JSON 写完后，清理临时 Edge profile 时遇到 Windows 文件锁（`first_party_sets.db-journal`），因此进程退出码为 1；证据文件已经完整生成。临时 Edge 进程已结束。VitePress 服务由本次任务启动并按主 Agent 要求保留在 4174 端口供用户查看。没有运行 Impeccable detector 或 Assessment B。
