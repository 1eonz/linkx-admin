# LxSwitch Assessment B

**状态：DEGRADED**。本报告仅记录 Assessment B 的 detector 与浏览器证据，不读取或引用 Assessment A。

## 范围与静态扫描

目标组件：`linkx-fe/src/components/LxSwitch/index.vue`。Demo：`linkx-fe/src/components/LxSwitch/demo/basic.vue`。文档页 `http://127.0.0.1:4176/components/lxswitch.html` 返回 HTTP 200，标题为「LxSwitch 状态开关 | LxUI」。扫描前确认指定目录不存在，证据均写入本目录。

| 目标 | JSON | stderr | 退出码 | 结果 |
|---|---|---|---:|---|
| 组件源码 | [detector-component.json](detector-component.json) | [detector-component.stderr.txt](detector-component.stderr.txt)（空） | [detector-component.exit-code.txt](detector-component.exit-code.txt)（0） | `[]` |
| Demo | [detector-demo.json](detector-demo.json) | [detector-demo.stderr.txt](detector-demo.stderr.txt)（空） | [detector-demo.exit-code.txt](detector-demo.exit-code.txt)（0） | `[]` |

两个 `[]` 只表示对应源码文件没有命中静态规则，不代表文档页或交互状态通过。

## 浏览器证据

在新建的 Codex 浏览器标签（tab 1）打开文档页，并以 CDP 设置 `[Human] LxSwitch 状态开关 | LxUI` 标题、追加 `http://localhost:8400/detect.js`。脚本加载成功；页面状态回报 `loaded`，DOM 中有 16 个 `.impeccable-overlay` 节点。控制台汇总为 **16 anti-patterns found**，可见标注框。采集到的 22 条 CDP 控制台事件（含分组起止）覆盖规则日志；注入窗口内没有观察到异常事件。

经页面截图与 AX 树核对，命中按对象归类如下：

- **Demo 文案的有效规则命中**：`.lx-switch-demo__desc` 的 `#86909c` 在 `#fafbfd` 上对比度为 3.1:1，且字号 11px；`.lx-switch-demo__hint` 对比度为 3.2:1；`.lx-switch-demo__status` 为 2.9:1；`.lx-switch-demo__note` 的 `#cf8a1e` 为 2.6:1。命中的是组件 Demo 内真实可见文字，不是开关胶囊自身。
- **文档结构命中**：检测到 `<h2>交互示例</h2>` 后接 `<h4>开关外状态文字（标本 07 主形态）</h4>`，缺少 h3 层级；AX 树也以 h2 后跟 h4 呈现。
- **文档外壳/内容误报**：`button.copy` 的两条 `buried-raster` 命中属于 VitePress 代码复制按钮；`div.container` 的首屏列高度比较把长文档与短目录栏相较，不能代表组件布局溢出；`body` 的高度/padding transition 是文档页通用规则命中；8 个 em dash 主要是 API 表格默认值占位符及技术说明中的标点，不是组件交互问题。

CUA 返回了浅色桌面初始页和 overlay 标注页截图，截图可在本次浏览器工具记录中查看，但没有写入本目录。尝试用 Playwright 批量落盘时，默认 headless-shell 不存在；显式本地 Chrome 的采集在 30 秒调用窗口内未生成文件。故本目录没有 PNG，也没有完成 HUD、禁用/实际 loading spinner、键盘焦点、375px 触屏及减少动效各状态的独立截图/console 记录。AX 树能确认示例包含禁用和 loading 控件，但不能代替这些状态的实际视觉验收。

临时 live-server 已停止（PID 43504，端口 8400）。为本次服务创建的临时运行目录仍在 `%TEMP%\impeccable-lxswitch-b-aefd62ed679140e89a9a0c318f1f8422`；递归清理命令被工具策略拦截，未继续尝试。产品源码及已有文档未修改。

## 结论

Detector 子项通过：两份源码扫描均为 `[]`、stderr 为空、退出码为 0。浏览器 overlay 注入通过并实际标注 16 个节点；其中 Demo 文案对比度/字号和文档标题层级需要后续评估。由于多状态截图未落盘，Assessment B 整体为 **DEGRADED**，不能标记正式浏览器审查通过。
