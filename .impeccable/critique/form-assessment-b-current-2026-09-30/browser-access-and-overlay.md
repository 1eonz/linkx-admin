# Assessment B 浏览器接入与 Overlay 证据

日期：2026-09-30（Asia/Shanghai）  
目标：LxForm、LxFormItem、LxDynamicForm 及 LxDynamicForm/fields

## 页面访问与捕获方式

首次使用 Codex in-app browser 打开了以下新标签，页面均曾加载成功：

- http://127.0.0.1:4174/components/lxform.html
- http://127.0.0.1:4174/components/lxdynamicform.html

随后 CUA 浏览器不可用，改用工作区随附的 Playwright/Chromium 运行时执行 capture-browser-evidence.cjs。脚本为每种视图新建页面，修改标题以 Human 标记并注入 detector。所有六个页面返回 HTTP 200，injectionError 为空，detectorFunctionAvailable 与 detectorScriptPresent 均为 true。浏览器证据汇总为 browser/browser-overlay-evidence.json；原始截屏与逐视图 JSON 同在 browser/。Playwright 脚本及简要执行结果见 capture-browser-evidence.cjs 与 browser-capture.stdout.json。

首次读取的可访问性树显示：LxForm 页面包含任务名称、责任网格、联系电话、现场备注、提交校验、重置和编辑节点信息入口；LxDynamicForm 页面包含列数切换、禁用表单、HUD 深色主题、候选人员成功/空结果/失败状态，以及任务名称、任务类型、负责人、启用任务、附件、提交校验和重置。Playwright 生成的截图和 Overlay JSON 是独立的像素/浏览器证据；它们保存在工作区，并不是当前用户浏览器中仍打开的活动标签。

## 视图、Overlay 与交互记录

- LxForm：桌面 1280×800 和窄屏 375×812 均为亮色普通动效。两个视图各有 6 个 Overlay 节点（3 个可见），分别包含 9 和 7 条发现元素记录。
- LxDynamicForm：桌面 1280×800 和窄屏 375×812 均为亮色普通动效。两个视图各有 12 个 Overlay 节点（9 个可见），分别包含 14 和 13 条发现元素记录。
- LxDynamicForm HUD：桌面与窄屏分别使用深色主题及 prefers-reduced-motion: reduce。每个视图有 169 个 Overlay 节点（15 个可见）、185 条发现元素记录；HUD 主题和减少动效媒体查询均确认生效。
- LxForm 桌面额外点击“提交校验”按钮，空表单出现 2 个错误表单项；截图为 browser/lxform-desktop-invalid-overlay.png。
- 总结图像分别为 browser/lxform-desktop-overlay.png、browser/lxform-375-overlay.png、browser/lxdynamicform-desktop-overlay.png、browser/lxdynamicform-375-overlay.png、browser/lxdynamicform-hud-reduced-desktop-overlay.png、browser/lxdynamicform-hud-reduced-375-overlay.png。

Overlay 节点数、可见 Overlay 节点数与发现元素数是不同计量口径。它们描述当前 detector 输出，不代表独立缺陷数量。

## 命中归属与浏览器运行记录

LxForm 的命中主要集中于 VitePress 文档壳、代码示例和页面级文本/过渡规则；还包括一个隐藏的 Element Plus 节点。普通主题的 LxDynamicForm 命中包括两个上传控件的辅助文字与已上传状态文字的 low-contrast，以及文档代码/壳和设置摘要等命中。

两个 HUD 视图均有 171 个 ai-color-palette 命中：按 selector 核对，157 个来自 VitePress Shiki 代码语法节点，14 个来自 LxUpload 的图标及子节点。后者与表单的青色 HUD 上传表现相关；代码片段部分是文档内容的检测噪声。该数字是逐 DOM 节点发现数，不能直接解释为 171 个产品缺陷。建议人工按截图、组件归属和设计意图逐项判断 detector 结果。

六份逐视图 JSON 记录的 pageErrors 与 failedRequests 均为空。每个页面的 Console error 和 warning 也均为 0。Console 总消息分别为：LxForm 每视图 11 条、普通 LxDynamicForm 每视图 17 条、HUD/reduced 每视图 174 条；多数为 detector 的分组与逐项报告日志。请求来源为本地文档站 127.0.0.1:4174 与 detector 服务 127.0.0.1:8400。

## URL detector 结果

四个 URL 模式尝试——两页各自的 1280×800、375×812——stdout 虽均为 []，stderr 均为 Error: puppeteer is required for URL scanning. Install: npm install puppeteer，真实退出码均为 1。它们是失败扫描，不是 URL 目标无发现。四组 stdout、stderr 与退出码分别存于 lxform-desktop.*、lxform-375.*、lxdynamicform-desktop.*、lxdynamicform-375.* 文件。

## 辅助服务生命周期

捕获轮 Impeccable live server 端口为 8400、PID 为 35528；启动及停止命令退出码均为 0，当前进程已退出。较早的服务 PID 9148 也有退出码 0 的 stop 记录且当前未运行。停止器 stderr 提示项目缺少 .impeccable/live/config.json，故未执行移除 live script tag 的步骤。捕获用 detector 通过 Playwright 页面级 addScriptTag 注入，浏览器页面关闭后上下文结束；本次证据采集没有修改产品源码。
