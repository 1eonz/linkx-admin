# Wave 7 Assessment B：TransferPanel 与 VirtualTree

日期：2026-10-08  
范围：最终冻结源码的 detector 与浏览器证据；本文件只记录 Assessment B，不代替 Assessment A 或最终综合报告。

## 结论

六个 markup 目标的静态 detector 均为零命中；四个浏览器视图均成功加载页面并注入 Impeccable overlay，主要交互状态均有记录。响应式检查发现 VirtualTree 文档页在 375px 和 320px 窄屏下有实际的内容列横向溢出，根因已定位到文档壳层的代码块负边距。TransferPanel 同尺寸下的文档内容列没有该溢出。

浏览器初次采集记录的 `documentElement.scrollWidth` 超出视口 240px，但补测证实这个增量由 overlay 注入引入：注入前根元素无横向溢出，注入后仅根元素滚动宽度增加，`body`、`.vp-doc`、代码块和表格宽度均无 overlay 引起的变化。因此不能把这 240px 归因于页面本身。

## 静态 Detector

TransferPanel 与 VirtualTree 的组件、Demo、文档共六个 markup 文件分别执行 detector。六项真实进程退出码均为 0，JSON 均为 `[]`，stderr 均为空。另对主题 CSS 执行了辅助尝试；Impeccable CLI 不支持以 CSS-only 扫描结果证明样式通过，该项不计入六个有效 markup 目标。

冻结前后七个目标文件的 SHA-256 一致，见 `source-hashes-before.json` 与 `source-hashes-after.json`。源码文件没有在本轮补测中修改。

## 浏览器与 Overlay

本地文档路由为 `/components/lxtransferpanel.html` 与 `/components/lxvirtualtree.html`。桌面与移动视图共四个新页面，脚本注入均成功，保存了 25 张截图。TransferPanel 桌面流程覆盖大小写编码查询、筛选结果反选、`aria-describedby`、无匹配、空树、加载、失败、重试、浅色/深色/HUD 与减少动态效果。VirtualTree 桌面流程覆盖大小写查询、无匹配、空树、加载、失败、重试、HUD 与减少动态效果；移动视图保存了焦点与窄屏状态证据。

Overlay 控制台汇总数分别为 TransferPanel 桌面 19、移动 5，VirtualTree 桌面 7、移动 6 条 anti-pattern。它们是整张 VitePress 文档页的规则命中数，不是组件缺陷数。长代码行、Props 表格、复制按钮、文档首屏长度及被裁切的文档容器均可能属于 VitePress 壳层或规则误报；需要按实际目标元素判读。组件内桌面标题/操作区域的 overlay 命中保留为人工复核项。

唯一网络及 console 异常是文档站壳层请求 `http://127.0.0.1:8418/favicon.ico` 返回 404；其余记录的页面请求均为 200，没有其他失败请求或 console error。

## 响应式溢出归因

尺寸补测采用独立 CDP 会话，在 375px 与 320px 下对两个文档页分别测量 overlay 注入前后。完整盒模型、表格、代码块、候选元素及 overlay delta 见 `overflow-dimensions-supplement.json`。

| 页面 | 视口 | `.vp-doc` client/scroll | 代码块盒 | 表格容器 client/scroll | 结论 |
|---|---:|---:|---|---|---|
| TransferPanel | 375px | 327/327 | 3 个代码块均在正文列内；x=24、宽327（Demo 代码块 x=41、宽293） | 327/997、327/486、327/443，`overflow-x:auto` | 正文列无横溢；宽表由表格自身滚动 |
| TransferPanel | 320px | 272/272 | 代码块 x=24、宽272；Demo 代码块 x=41、宽238 | 272/997、272/486、272/443，`overflow-x:auto` | 正文列无横溢；宽表由表格自身滚动 |
| VirtualTree | 375px | 327/351（多24px） | 3 个 `div.language-ts.vp-adaptive-theme` 位于 x=0、宽375，越过 x=24 起始的正文列 | 327/637、327/414、327/352、327/384，`overflow-x:auto` | 代码块横跨全视口，正文内容列多出24px横向滚动范围；宽表仍由表格自身滚动 |
| VirtualTree | 320px | 272/296（多24px） | 3 个 `div.language-ts.vp-adaptive-theme` 位于 x=0、宽320，越过 x=24 起始的正文列 | 272/637、272/414、272/352、272/384，`overflow-x:auto` | 同一代码块负边距问题，正文内容列多出24px横向滚动范围；宽表仍由表格自身滚动 |

VirtualTree 的相关代码块盒为 x=0 到 x=375/320，而 `.vp-doc` 从 x=24 开始、宽327/272，故其右缘超出正文列24px，`.vp-doc.scrollWidth` 相应为351/296。根因与以下样式相符：VitePress 默认规则 `.vp-doc div[class*='language-']` 设置 `margin: 16px -24px`（`linkx-fe/node_modules/vitepress/dist/client/theme-default/styles/components/vp-doc.css:277`）；仓库窄屏重置只匹配 `.VPDoc:has(.transfer-panel-demo)` 并为代码块设置 `margin-inline: 0`（`linkx-fe/docs/.vitepress/theme/custom.css:32`、`linkx-fe/docs/.vitepress/theme/custom.css:43`），不匹配 `.virtual-tree-demo`。因此这是实际的 VirtualTree 文档内容列溢出，归属 VitePress 文档壳层 CSS；建议由后续修复为 VirtualTree 文档页覆盖同一负边距，不改动组件源码。

补测的 overlay delta 在四个视图均为：`documentElement.scrollWidth` 增加240px；`documentElement.clientWidth`、`body.scrollWidth`、`.vp-doc` 尺寸及代码块/表格宽度不变。overlay 最右缘为375px视口下615px、320px视口下560px，超出文档 client width 240px，足以解释初次采集中 `615/560` 的根滚动宽度。

## 采集限制与清理

初次移动浏览器记录存在视口元数据不一致：标为375px时 `innerWidth` 为615、`visualViewport.width` 为375；标为320px时分别为560和375，尽管 `documentElement.clientWidth` 为375/320。独立补测的四个视图在 375px/320px 设置下，`innerWidth`、`visualViewport.width` 与 client width 一致。补测提供尺寸证据但未生成新截图，因此初次 320px 截图仅作为交互状态材料，不单独作为严格的320px视觉验收。

采集与补测使用的 VitePress、live-server、Edge/CDP 均已停止，端口 8418、9351、9355、8421、9356、9357 均确认关闭；补测临时 profile 与 overlay 根目录已清理。live-server stop 输出含隔离目录 `config_missing` 提示，但同时返回停止成功，补测结果记录 `portsClosed: true`。

