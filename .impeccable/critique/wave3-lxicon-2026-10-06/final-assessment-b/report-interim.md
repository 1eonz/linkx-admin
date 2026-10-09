# LxIcon Assessment B 中间记录

状态：中间证据，**不是最终 Assessment B**。取证过程中源码和 4174 服务页面更新；下述扫描和浏览器结论只对应各自采集时点，不能代表主 Agent 本轮追加的复制失败回退、`details` 分组和标签修正。

本轮只做 detector 与浏览器证据，没有查看、搜索或引用 Assessment A、代码复审、综合报告或其计划中的结论。结果文件仅写入本目录。

## 扫描时点与结果

在观察到 `<details>` 分组和本轮追加代码前，分别扫描了六个指定目标。六条命令都以 `[]` 作为原始 JSON stdout、stderr 文件为空、退出码 `0`。因此这组结果不能证明后来新增或修改的源码也通过扫描。每个目标均有独立的 `.command.txt`、`.stdout.json`、`.stderr.txt` 和 `.exit-code.txt`，具体路径见 [evidence-index.md](./evidence-index.md)。

## 旧版页面浏览器证据

新建的隔离 Chrome/Playwright 1.58 上下文访问 `http://127.0.0.1:4174/components/lxicons.html`。HUD 页面没有用户可见切换控件，取证时只在页面根元素设置该页 CSS 已支持的 `lx-theme-hud` 类；截图与 JSON 记录了这一测试方式。

在这版页面上，overlay 注入前 `documentElement.scrollWidth` / `body.scrollWidth` 分别为：桌面浅色 1440/1440、桌面 HUD 1440/1440、手机浅色 375/375、手机 HUD 375/375；四者均无横向溢出。Detector 成功注入后，桌面根宽仍为 1440；手机 `documentElement.scrollWidth` 变为 615、`body.scrollWidth` 仍为 375。这是注入 overlay 的宽度影响，不能归因给页面；以 overlay 前读取的 375 为页面宽度证据。

当时的交互探测记录了 `undo` 搜索只剩 1 个匹配项、清除后输入框重新取得焦点、Tab 可到图标卡片且显示 2px focus outline、hover 时边框和文字颜色变化，以及 `prefers-reduced-motion` 下 loading 图标 animation 为 none/0s、卡片过渡近乎归零。空态在浅色背景实测为 6.11:1（前景 `rgb(96,98,102)` / 背景白色），HUD 为 7.30:1（前景 `rgb(148,163,184)` / 背景 `rgb(11,18,32)`），均达到普通文本 AA 4.5:1。

当时 96 个英文键均是 11px；`fullscreen-exit` 最长，桌面浅色测得宽 96.69px，108px 卡片内可见。随后主 Agent 更新了页面，且过渡稳定等待尚未在旧数据上完成，因此本记录不把旧读数当成最终键名可读性结论。

Detector overlay 在旧页面 DOM 中运行成功。桌面 console 汇总报 6 条，手机报 3 条。实际命中元素可见于浏览器证据 JSON：长行规则落在文档说明段落，raster 规则落在 VitePress `Copy Code` 按钮，字体与布局过渡规则落在 VitePress `body`，手机 clipped-overflow 规则落在 VitePress 导航 `span.container`。这些命中属于文档页面/主题外壳；不能按规则数直接计为 LxIcon 组件缺陷。手机 overlay 造成的 240px document 根宽增量也属于 overlay 取证噪声。

## 源码更新后的采集限制

主 Agent 更新页面后，服务端 DOM 从 `h3`/`div` 分组变成默认收起的 `<details>`。首次适配期间的一次浏览器运行以 hover 定位超时退出，原始 stderr 和退出码 `1` 已保留在 `browser-capture-attempt-2.*`。后续运行虽然成功注入 detector，但当时页面分组仍收起；隐藏键名的 bounding box 为零，所以那次运行不能作为已展开卡片布局证据。最新采集脚本已加入记录默认折叠状态并展开分组的处理；尚未以主 Agent 通知后的最终 DOM 完成复验。

本目录内的 detector server 当前使用 8493 端口供后续最终复验；最终复验完成后应停止它。用户查看用的 4174 页面服务仍运行，未停止或重启。
