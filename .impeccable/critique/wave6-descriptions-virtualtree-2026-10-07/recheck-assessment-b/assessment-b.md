⚠️ DEGRADED: single-context (no native CUA browser tool was exposed; isolated Playwright fallback used)

# Assessment B：Detector 与浏览器证据

本轮只记录 deterministic detector 和浏览器证据，不读取或复述 Assessment A。浏览器使用运行时自带的 Chromium 154.0.8037.95，四个目标各在新 tab 打开。最新一次浏览器采集在 VirtualTree activeKey 修复之后执行，使用临时 VitePress 服务和 Impeccable live server（PID 23268，端口 8400）；两项服务均在采集完成后停止。当前版本指纹保存在 fingerprints.json，其中 LxVirtualTree/index.vue 为 E36B50875832C374FF98C0366493F6FC26AD1CBF6ABDFD056E863B155C2386B4。

## 静态 Detector

本轮重新扫描当前工作区的 7 个目标，每项都独立保存 stdout.json、stderr.txt、exit-code.txt 和命令文件。7 项均退出码 0，JSON 为 []，stderr 为空：

| 目标 | 结果 |
| --- | --- |
| linkx-fe/src/components/LxCascader | [] / exit 0 |
| linkx-fe/src/components/LxDescriptions | [] / exit 0 |
| linkx-fe/src/components/LxVirtualTree | [] / exit 0 |
| linkx-fe/docs/.vitepress/config.ts | [] / exit 0 |
| linkx-fe/docs/components/lxcascader.md | [] / exit 0 |
| linkx-fe/docs/components/lxdescriptions.md | [] / exit 0 |
| linkx-fe/docs/components/lxvirtualtree.md | [] / exit 0 |

证据目录为 recheck-assessment-b/cli-final/，汇总为 recheck-assessment-b/cli-final/summary.json。早先根目录的 aggregate detector.exit-code=1 和 3 字节 stdout 属于旧的失败尝试，已废弃，未被当作通过。

## 浏览器覆盖

每页都执行了可变 DOM 注入前置检查：设置文档标题和 data-impeccable-preflight=ok，随后成功加载 http://127.0.0.1:8400/detect.js。每页均有 [impeccable] … anti-patterns found console 组、overlay DOM 和截图。

| 页面 | 覆盖的状态 |
| --- | --- |
| /components/lxcascader | 1280px 浅色初始；打开真实级联弹层并切换组件 scoped HUD；失败态；375px 错误态；Esc 关闭弹层 |
| /components/lxdescriptions | 1280px 双列+网格边框；全局 HUD；空结果；复制按钮焦点；375px 空结果 |
| /components/lxvirtualtree | 展开全部；组件 scoped HUD；树获得焦点后 ArrowDown、ArrowRight、Space；加载失败；375px 错误态 |
| /components/lxupload | 全局 HUD；紧凑标签列表；注入 CSV 到文件控件并通过本地 Mock 成功上传；375px 成功态 |

浏览器证据在 recheck-assessment-b/browser/browser-evidence.json，采集时间为 2026-10-07T09:33:04Z。4 页的注入结果均为 preflight=true、injected=true、脚本存在；overlay 数量分别为 Cascader 6、Descriptions 4、VirtualTree 7、Upload 4。四页均无 Playwright failed request，也没有外部域请求。Cascader 有一个非致命的 404 resource console 提示，页面仍加载并完成全部交互。VirtualTree 的键盘步骤在当前 E36B... 指纹源码上完成：首个 treeitem region-1 获得焦点，ArrowDown 将焦点移到 unit-1-1，ArrowRight 保持该节点，Space 将 aria-checked 从 true 切为 false。

截图保存在 recheck-assessment-b/browser/screenshots/，包含每页的 desktop-light-overlay、HUD/弹层或状态截图，以及 375px 截图。browser-console.json、browser-requests.json 和 overlay-results.json 保存原始消息、请求与 overlay 明细。

## Overlay 命中与判读

浏览器 detector 看到的页面级命中不是静态源码扫描结果，主要来自 VitePress 文档外壳：

- buried-raster 命中文档代码块的复制按钮背景；它位于 VitePress 主题，而非四个组件实现，属于文档壳层误报。
- edge-flush-cards 命中 API 文档表格；这是表格展示规则，不能归因到组件运行时布局。
- first-viewport-column-overflow 命中 .VPDoc.has-sidebar > .container；长 API 文档与侧栏造成纵向比例，属于文档页面结构提示。
- layout-transition 命中文档主题的全局 body transition；不是本轮组件 CSS 的新命中。
- Cascader 的 skipped-heading 确实指向文档 H1 后直接出现 H3，属于可修复的文档语义层级问题。
- Cascader 的 gpt-thin-border-wide-shadow 指向真实打开的 Element Plus 级联弹层。截图显示这是弹层边界和投影，功能上可读；若要消除命中，应在设计令牌层确认弹层阴影规范，而不是删除可见焦点/层级。
- VirtualTree 的两条 text-occlusion 指向“父子独立勾选”和“HUD 深色主题”标签。人工复核同一状态下标签中心的 elementFromPoint 为对应 checkbox，标签矩形位于 viewport 之上（标签 y=519，树 viewport y=629），截图中两段文字可读，因此这是 detector 对虚拟树滚动容器的覆盖计算误报。

## 生命周期证据

browser/live-server.start.* 记录了初次有效采集的 PID 9676，browser/live-server.stop.* 记录了该进程的退出码 0；browser/keyboard-rerun/ 下记录了 activeKey 修复后的最终 live server PID 23268、临时 VitePress PID 27036/16028、采集命令和停止验证。最终验证为 8400/health=unreachable、4175/组件页=unreachable（临时服务已停止），对应进程均已退出。停止命令报告 .impeccable/live/config.json 缺失导致 live-inject 清理跳过，但本轮只使用页面级 addScriptTag，不存在需要清理的项目注入标签。此前一次因并行流程提前退出 4175 而产生的 ERR_CONNECTION_REFUSED 采集没有计入有效证据。

## 限制

没有原生 CUA 浏览器接口，因此按要求标记为降级，并用隔离 Playwright tab 完成可见 overlay 与截图。detector CLI 的 7 项 [] 只表示静态规则零命中，不能替代浏览器状态检查或真实后端联调；本轮上传使用本地 CSV 和宿主 Mock，没有发送真实上传写请求。
