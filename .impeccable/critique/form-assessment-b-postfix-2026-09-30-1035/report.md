Method: Assessment B only (fresh detector/browser evidence after contrast and progress fixes; no Assessment A input used)

# 表单与上传组件 Assessment B：检测器与浏览器证据

采集时间：2026-09-30 10:41–10:49（Asia/Shanghai）。浏览器目标为现有 VitePress HMR 服务 http://localhost:4177；本轮另启动 Impeccable detector 服务 8400，并在收集完成后停止。

## 静态扫描

四个表单目标均输出有效 JSON 数组 []，stderr 为 0 字节，退出码为 0：

| 目标 | JSON | 命中 | stderr | 退出码 |
|---|---|---:|---:|---:|
| linkx-fe/src/components/LxForm/index.vue | [] | 0 | 0 B | 0 |
| linkx-fe/src/components/LxForm/LxFormItem.vue | [] | 0 | 0 B | 0 |
| linkx-fe/src/components/LxDynamicForm/index.vue | [] | 0 | 0 B | 0 |
| linkx-fe/src/components/LxDynamicForm/fields/ | [] | 0 | 0 B | 0 |

补充扫描：
- LxUpload/demo/basic.vue：[]，stderr 0 B，退出码 0。
- LxDynamicForm/demo/basic.vue：[]，stderr 0 B，退出码 0。
- LxUpload/index.vue 初始扫描命中 1 条 layout-transition（transition: width，退出码 2）；将聚合进度填充改为固定轨道上的 transform 缩放后复扫为 []，stderr 0 B，退出码 0。

原始 stdout、stderr、退出码文件位于 static/；其中初始与 postfix 结果均保留。

## 浏览器复验

五个视图均返回 HTTP 200，成功注入 detector overlay；各视图 pageError、failedRequest、badResponse 和 blockedRequest 均为 0，页面没有横向溢出：

| 视图 | 视口 | overlay 分组 | 原始规则命中 | scrollWidth |
|---|---:|---:|---:|---:|
| LxForm 桌面 | 1280×800 | 7 | 8 | 1280 |
| LxForm 移动 | 375×812 | 7 | 8 | 375 |
| DynamicForm 桌面 | 1280×800 | 8 | 9 | 1280 |
| DynamicForm 移动 | 375×812 | 9 | 10 | 375 |
| DynamicForm HUD 深色 / 减少动效 | 1280×800 | 188 | 189 | 1280 |

DynamicForm 桌面、移动和 HUD 视图的首错均聚焦“任务名称”，错误节点包含 aria-invalid="true" 和 aria-describedby；两条初始上传文件均显示“上传成功”。HUD 视图确认 html 同时含 dark 与 lx-theme-hud，prefers-reduced-motion 生效。

当前浏览器计算样式证据：
- 亮色辅助文字：rgb(96, 98, 102)，白底约 6.11:1。
- 亮色成功状态：rgb(63, 126, 35) / rgb(240, 249, 235)，约 4.61:1。
- HUD 辅助文字：rgb(148, 163, 184) / #101a2c，约 6.79:1。
- HUD 成功状态：rgb(134, 239, 172)，背景为 rgba(103, 194, 58, 0.15)，与 HUD 卡片底合成后约 5.38:1。
- Upload 文档示例辅助提示为“支持Excel 表格、CSV 文件，单文件不超过 10MB，最多 5 个文件”，图片字段提示为“支持图片…最多 N 个文件”。
- 从 DynamicForm HUD 页面导航到 Upload 后，html class 恢复为空，证明卸载恢复了原主题状态。

## 规则归因

HUD 视图的 184 个 ai-color-palette 命中主要来自主题约定的 sky 青蓝图标、按钮及 SVG 子路径；设计令牌明确采用该主色，不能按命中数量直接归为缺陷。其余命中主要是 VitePress 文档外壳、隐藏 popper、隐藏悬停内容和页面级规则。真实的上传文字对比度问题已由令牌和浏览器复验修复；LxUpload 聚合进度的 layout-transition 也已由 postfix 静态复扫确认清除。

## 证据索引与收尾

- 静态摘要：static/summary.json、static/additional-summary.json；LxUpload 修复后复扫：static/linkx-fe-src-components-LxUpload-index.vue.postfix.json、对应 stderr 与 exit-code。
- 浏览器摘要：browser/summary.json、browser/detector-findings-summary.json、browser/detector-attribution.json。
- 对比度、主题卸载与 Upload 文案：browser/postfix-browser-check.json。
- overlay 截图保存在 browser/lxform-desktop、lxform-mobile、lxdynamicform-desktop、lxdynamicform-mobile、lxdynamicform-hud-dark-reduced-motion。
- detector 服务停止命令退出码为 0，stderr 0 B；8400 无 LISTENING 监听（仅残留 TIME_WAIT）。

Questions skipped: 这是 Assessment B 的独立证据记录；后续问题留给完整 Critique 综合报告。

