Method: dual-agent (A: isolated parent assessment · B: /root/g2_browser_b)

# Assessment B：LxSearchBar 与 LxStatusSwitch

## 范围与证据

本次只读检查覆盖两个组件的源码、Demo 与中文文档：

- `linkx-fe/src/components/LxSearchBar/index.vue`
- `linkx-fe/src/components/LxSearchBar/demo/basic.vue`
- `linkx-fe/docs/components/lxsearchbar.md`
- `linkx-fe/src/components/LxStatusSwitch/index.vue`
- `linkx-fe/src/components/LxStatusSwitch/demo/basic.vue`
- `linkx-fe/docs/components/lxstatusswitch.md`

每个目标均保存了 detector 命令、stdout JSON、stderr 和退出码文件。当前保存结果为 JSON `[]`、stderr 为空、退出码 `0`；该结果只表示静态规则没有命中，不能单独证明浏览器视觉或交互通过。若父流程另有 detector 运行记录为非 0（例如退出码 3），应按扫描失败处理并以对应 stderr 为准。

证据目录：`screenshots/`、`browser-evidence.json`、`browser-capture.command.txt`、`browser-capture.stdout.txt`、`browser-capture.stderr.txt`、`browser-capture.exit-code.txt`。截图覆盖 1440px 浅色 SearchBar、375px 浅色减少动效 SearchBar、1440px HUD 深色 StatusSwitch、375px 浅色减少动效 StatusSwitch，并各留存初始/焦点（SearchBar 另有展开）视图。

## 浏览器结果

文档站 `http://127.0.0.1:4174` 可访问，4 个独立 Playwright contexts 均成功加载；`scrollWidth === clientWidth`（1440 与 375 均无水平溢出）。移动视图保留文档导航和组件示例，未观察到页面级横向滚动。SearchBar 示例可见“成功、空结果、失败、等待查询”、查询/重置和展开控件；StatusSwitch 页面可见 HUD 示例及“下一次保存失败”等状态文案。

浏览器控制台每页均有 Vite HMR debug；桌面浅色 SearchBar 另有一个 404 resource 错误，需在正式验收中定位资源来源。其余视图未见运行时错误。`prefers-reduced-motion` contexts 已设置为 `reduce`，未观察到页面溢出或明显失控动效。

尝试按 Impeccable overlay 流程启动独立 live server（PID 21304，端口 8400），并注入 `/detect.js`。注入脚本在当前环境中未能稳定完成（浏览器脚本调用挂起，已记录 stderr/退出码并停止 PID）；因此没有声称存在可见 overlay，浏览器证据以真实截图、DOM 文本、控制台和几何测量为准。停止命令与结果保存在 `live-server-stop.txt`。

## 可观察问题与归因

1. P1：SearchBar 桌面浅色页面出现资源 404。组件主体仍渲染，但缺失资源会使文档验收信号变脏；应从 Network 面板补齐请求 URL 或确认是否为文档 favicon/HMR 外壳误报。
2. P2：Playwright 仅能稳定完成初始、展开、Tab 焦点截图；确认/取消、只读、失败与键盘完整路径未能在本次环境中可靠驱动，原因是 Demo 状态按钮/异步回调需要宿主交互，overlay 注入挂起。不能把未执行状态标为通过，建议后续用专用 Mock adapter 逐项触发并保存结果。
3. P2：StatusSwitch 文档正文明确“状态保存、错误反馈和权限判断由宿主负责”，组件本身不发请求；因此失败状态只能检查 Demo 文案和禁用/只读视觉，真实接口失败恢复属于宿主联调范围。

## 误报与限制

- Vite HMR 的 `connecting/connected` 控制台日志是开发服务器信号，不是组件缺陷。
- 侧栏、搜索文档等大量文本属于 VitePress 外壳，不计入组件信息架构问题。
- detector `[]` 仅代表源码静态规则零命中；overlay 未稳定注入，不能据此宣称 detector 浏览器扫描通过。

## 未完成项

`Questions skipped: Assessment B is evidence-only; final synthesis and targeted questions belong to the parent assessment.`
