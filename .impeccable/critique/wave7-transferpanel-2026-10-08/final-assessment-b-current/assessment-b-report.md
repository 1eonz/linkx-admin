# Assessment B：LxTransferPanel 与 LxVirtualTree

本记录仅包含 detector 与浏览器证据，供主 Agent 后续综合。采集时没有读取其他 Assessment A/B 结论；没有修改产品源码、运行 Playwright E2E 套件、保存综合评分或写 snapshot。

静态 detector 对 `LxTransferPanel/` 与 `LxVirtualTree/` 源目录的两次扫描都以退出码 0 完成，stdout 是可解析的 `[]`，stderr 为空。对应目录包含组件 Vue 文件及 demo；结果只表示这两个目标的静态规则零命中。

浏览器证据来自 Edge 154.0.4258.53；页面 `http://127.0.0.1:4177/components/lxtransferpanel` 在五个独立 Playwright context/page 中均返回 200。检查了 1440×960 亮色与 HUD、320×740、390×844 及一次独立键盘操作视图。所有视图均没有页面横向溢出。树上的方向键移动了焦点；Space/Enter 将选择数从 4 改为 3 再恢复为 4。移动端树名称会换行；桌面已选长名称视觉省略，但 DOM 的 `title` 保留完整内容。

Detector 可写入当前页面：预检设置标题、追加及运行 script 均成功。五个视图的 `detect.js` 脚本均加载并运行，截图里都能看到真实 overlay 标注。console 首轮显示 anti-pattern 计数依次为 21、54、10、11、21。detector 自身报告数并非缺陷数：移动端遮挡命中指向折叠 details 中 `isHidden=true` 的控件；HUD 的 cyan 规则在同一配色的多个子节点上重复；后续 `window.impeccableDetect()` 采样还把 overlay 自己的标注文字识别成遮挡。

目标控件上重复出现的主要静态视觉命中是待选树滚动面板裁切定位子项。浏览器画面显示它限制在虚拟树面板内，且没有造成页面级横向溢出，因此应由综合评审结合虚拟化结构判断。其余命中主要属于文档正文行长、VitePress 代码复制按钮、文档表格及 `body` 的动效规则；这些不应计作组件命中。desktop-light 另有一条 404 console error，当前记录没有失败资源 URL，需保留为未归因环境信号。

临时 detector helper 已使用 `stop --keep-inject` 关闭并通过健康检查确认 8400 不再响应。主 Agent 管理的 4177 页面仍为 HTTP 200。完整命令、输出、截图、逐视图事实和归因见 [evidence-index.md](./evidence-index.md)。
