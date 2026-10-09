# LxTransferPanel Wave 7 Assessment B

Method: assessment B（独立 detector + 浏览器证据；未读取 Assessment A 或代码审核结果）

## 目标与证据

- 目标源码：`linkx-fe/src/components/LxTransferPanel/index.vue`、`demo/basic.vue`。
- 浏览器页面：`http://127.0.0.1:5187/components/lxtransferpanel`。
- detector 命令、标准输出、标准错误和退出码保存在 `assessment-b/`。
- 浏览器采集结果保存在 `assessment-b/browser-evidence.json` 与 `assessment-b/runtime.json`，共 7 个视图，覆盖桌面亮色/HUD、加载、错误、空结果、375px 和减少动效。
- 临时 VitePress、overlay 服务和 5173 页面服务均已停止，停止命令及退出码保存在 `assessment-b/*stop*`。

## 静态 detector

`assessment-b/detector.stdout.json` 内容为有效 JSON 数组 `[]`，`detector.stderr.txt` 为空，`detector.exit-code.txt` 为 `0`。这表示本次源码目标没有命中该静态规则集合；它不代表浏览器视觉和交互没有问题，也不单独构成正式通过。

## 浏览器与 overlay

预检、脚本注入和 overlay 注入在 7 个视图均成功，浏览器采集退出码为 `0`；页面错误为 `0`，外部请求为 `0`。浏览器 console 中 detector 分别报告 7、12、27、26、9、6、6 个规则命中，overlay 分别显示 6、11、26、25、8、5、5 个标记。

命中需要按目标归属解释：

- `line-length`、`text-occlusion`、`buried-raster`、`edge-flush-cards` 主要来自 VitePress 代码示例、文档表格或站点外壳，不应直接归因于 TransferPanel 产品组件。
- `cramped-padding` 命中 `LxVirtualTree` 视口边缘，属于树组件已有密度契约，需在 VirtualTree 波次统一处理。
- `undersized-ui-text` 命中状态徽标的 10px 文本，是本波实际组件问题，已交给后续修复把元数据字号和窄屏信息密度纳入评估。
- `low-contrast`、`ai-color-palette` 的 HUD 命中需要结合设计令牌和 HUD 主题语义复核，不能按命中数直接判定缺陷。
- `bounce-easing`、`layout-transition` 命中站点或全局令牌动画；本组件没有新增持续动画，减少动效视图仍验证了降级路径。

## 运行结论

桌面根节点与两侧面板保持 380px 高，布局标记为 5:2:5；375px 下无横向溢出，两个面板同高，批量与删除主触控目标达到 44px。HUD、加载、错误、空结果、键盘焦点和 `prefers-reduced-motion` 视图均可访问。当前剩余问题包括移动端头部操作与筛选清除目标偏小、状态文案筛选语义、Demo 数据量与视觉稿虚拟大数据标本不一致，以及部分文档外壳 detector 误报。

## 结论

Assessment B 证据链完整，静态扫描有效零命中；浏览器证据有效但包含需人工归属的规则命中。因此本次不能把 `[]` 或命中数量单独视为整波通过，必须结合 Assessment A、代码审核和修复后的有界复验。

