# LxTransferPanel Assessment B：选中项密度

**性质：** Assessment B（detector 与浏览器证据），独立记录。本报告不读取、不合并 Assessment A；不修改组件源码或计划文档。

**目标：** `http://127.0.0.1:4174/components/lxtransferpanel`  
**采集日期：** 2026-10-09  
**状态：** 浏览器采集与 overlay 扫描完成；截图及逐视图数据见 [`evidence-index.md`](evidence-index.md)。

## 结论

最需要后续处理的是 320px 窄屏：默认紧凑面板的选中列表可视高度为 155.61px，而 80 字长条目高 166.78px。列表滚到底时，条目顶部约 18.61px 落在列表视口外，删除按钮顶部约 15.61px 落在视口外，用户不能同时看到完整条目和完整删除目标。390px 下条目高 133.19px，能够完整落在 155.61px 列表视口内。此项记为 **P2（窄屏边界问题）**；本任务未修改产品源码。

两种主题在三个宽度下均无页面水平溢出。390px 与 320px 的长名称可换行显示，移除按钮为 44×44px；桌面 1440px 使用单行省略显示长名称，截图中有展开提示，DOM 中也保留完整标题，但本次未验证展开操作的键盘语义或交互结果。

## 浏览器证据

每种宽度均新开浅色与 HUD 深色主题页面，共 6 个视图；页面状态为已选列表，滚动至长历史条目。每页 HTTP 状态为 200，脚本注入和扫描函数均成功。六页记录的 `pageErrors`、`failedRequests`、`badResponses` 都为 0，`documentScrollWidth` 与视口宽度一致。

| 视口 | 选中列表可视高度 / 内容高度 | 长条目高度 | 名称布局 | 删除目标 | 视口内完整显示 |
|---|---:|---:|---|---:|---|
| 1440×1000 | 102.61 / 199px | 50.80px | 单行省略，保留完整标题 | 24×24px | 是 |
| 390×844 | 155.61 / 338px | 133.19px | 4 行，名称区域高 67.19px | 44×44px | 是 |
| 320×844 | 155.61 / 371px | 166.78px | 6 行，名称区域高 100.78px | 44×44px | 否；条目顶部及按钮顶部被列表裁切 |

窄屏所选项的上下内距实测为各 2px。320px 下行高与按钮虽存在，但长条目超过列表视口，滚到底时无法一次性查看完整条目。浅色与 HUD 两种主题的几何数据相同。

1440px 浅色页的 Console 证据另记录一条 `Failed to load resource: the server responded with a status of 404 (Not Found)`；本轮页面计数器没有捕获失败请求或 4xx/5xx 响应，无法将该 Console 文本归因到 LxTransferPanel，故仅作为未归因的环境观察。

## Detector 结果

组件 `index.vue`、Demo `basic.vue`、文档 `lxtransferpanel.md` 均返回有效 JSON `[]`，stderr 为空，退出码为 0。这只表示这三份静态源码目标没有命中 detector 规则，不代表浏览器运行态不存在问题，也不构成整个组件通过正式 Critique 的结论。

浏览器 overlay 的原始命中数如下。命中数包含重复子节点及文档外壳，不能直接解释为同等数量的缺陷。

| 视口与主题 | 原始命中数 |
|---|---:|
| 1440 浅色 / HUD | 27 / 62 |
| 390 浅色 / HUD | 11 / 47 |
| 320 浅色 / HUD | 11 / 48 |

## 命中归属

| 规则或观察 | 证据与判断 |
|---|---|
| `cramped-padding`：所选项 `<li>` | 窄屏计算样式有 2px 上下内距，规则文本称“无内距”并不精确；它反映了紧凑间距，但不能单独等同于零内距缺陷。320px 的视口裁切是独立、可复核的布局问题。HUD 下同一规则还命中 Demo 预览容器，不计作条目缺陷。 |
| `text-occlusion`：`.lx-transfer-panel__selected-name-full` | 路径位于 `details.is-unloaded` 的未展开内容。浅色截图中可见名称省略、编码在下方，不存在报告所称的实际覆盖；按隐藏 DOM 内容判为误报。 |
| `ai-color-palette`：HUD 子节点 | 多条命中落在已勾选虚拟树节点的文本、图标、复选框及计数上，是一次启用的 HUD 主题在后代节点上的重复报告，不是数十项独立问题。是否符合主题令牌需由设计评审决定；本轮未进行对比度仪器测量。 |
| `gpt-thin-border-wide-shadow` | 命中 LxTransferPanel 源面板的 scope-actions 容器，不属于所选项密度；窄屏视图该源面板处于隐藏态。保留为组件内其他区域的样式观察，不计入本报告主问题。 |
| `line-length`、`buried-raster`、`edge-flush-cards` | 命中 VitePress 文档正文、代码块复制按钮及文档表格。中文正文的字符长度判断和文档外壳均不应直接记为组件问题。 |
| `clipped-overflow-container` | 命中 VitePress 窄屏导航按钮和容器，不是穿梭面板的列表。 |
| HUD 预览的 `cramped-padding`、根节点 `bounce-easing` / `layout-transition` | 命中 Demo 预览包装层或文档页根节点；与所选项的可视密度无直接关系。 |

## 验证边界与清理

源文件在浏览器采集起止时的 SHA-256 一致：组件 `234dd72994f8b38d3bdd295fdd73967072ec30a6603057016138e3a52865c662`，Demo `8f6d04221ed5c225d21adcdcf8f2ae4a22912e24913972c9a0884882c1db65dd`，文档 `f7e3c52c5e21f43215126f2c5a1f3d472313993c5eb4e713b1acbd9e697412af`。采集没有改动这些产品文件或计划文档。

Impeccable overlay 服务已停止，8400 端口不再监听。停止脚本因 `.impeccable/live/config.json` 缺失，无法自动移除注入标记；`server.json` 已回到本轮启动前的缺失状态。页面交互的键盘完整流程、真实后端行为及 Assessment A 均不在本报告的验证范围内。
