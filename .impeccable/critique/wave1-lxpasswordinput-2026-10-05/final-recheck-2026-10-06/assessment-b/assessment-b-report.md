# LxPasswordInput 独立复核：Assessment B

本记录只包含本次独立的 detector 与浏览器证据；未读取 Assessment A 报告或发现，未修改产品源码。复核对象为 `LxPasswordInput` 源码、基础 Demo、中文文档及 `http://127.0.0.1:4182/components/lxpasswordinput`。浏览器先强制重载了当前 VitePress 页面，以纳入最新 Demo。

## 静态 Detector

| 目标 | stdout | stderr | 退出码 |
|---|---|---|---:|
| `linkx-fe/src/components/LxPasswordInput/index.vue` | `[]` | 空 | 0 |
| `linkx-fe/src/components/LxPasswordInput/demo/basic.vue` | `[]` | 空 | 0 |
| `linkx-fe/docs/components/lxpasswordinput.md` | `[]` | 空 | 0 |

三个结果分别保存在 `detector-{component,demo,doc}.stdout.json`、`.stderr.txt`、`.exit-code.txt`，并保存了每条命令。静态扫描没有发现命中。

## 浏览器证据

使用独立 Chrome 进程、全新 context 和 page。1280px 的浅色、深色与 Demo HUD 状态均已截图；浅/深主题通过 VitePress 主题切换控件实际切换。宽度实测为：1280px 时 `documentElement/body=1280px`、Demo 宽 624px；320px 时 `documentElement/body=320px`、Demo 宽 272px；两种视口均无页面横向溢出。

在 320px 下，实际打开 “On this page” 并点击 “Props” 锚点，地址变为 `#props`，目标标题滚至视口顶部附近（`top=109.5px`）。工具栏四个标签行高均为 44px；尺寸选择框实测 54×32px，复选框本体 13×13px、由 44px 高标签承载点击区域。展开高级设置后，“阻止剪贴板操作”与 “HUD 深色主题”两项标签分别为 136.45×44px、128.05×44px。三个密码显隐按钮均为 44×44px，禁用实例仍处于 disabled 状态。

交互实测：Enter 将主输入切换为明文并设 `aria-pressed=true`，Space 恢复密码类型；打开 `maskOnBlur` 后，焦点在组件内移动不会遮罩，离开组件后恢复遮罩。只读实例保持 `readOnly=true`，禁用实例保持 `disabled=true`。启用剪贴板阻止后，复制事件 `defaultPrevented=true`。模拟减少动态效果时，显隐按钮与高级设置图标的计算过渡时长均约为 0 秒（`1e-05s`）。

## 页面 Overlay

Detector 以独立、临时的本机 `/detect.js` endpoint 注入，endpoint 没有使用 `.impeccable/live/server.json`；扫描得到 11 个目标节点和 10 个标签，另有 1 条页面级 banner。控制台输出“11 anti-patterns found”两次，分别来自脚本自动扫描与显式复扫，不能按 22 条问题计数。

命中归属如下：

- 7 个 `ai-color-palette` 节点位于 Demo 的 HUD 深色主题内（`summary/span/svg/path` 与三个示例操作按钮）。它们是同一 cyan-on-dark 规则落在多个嵌套节点上的重复命中，不在密码输入控件本身；浅色默认态没有这组命中。HUD 是页面显式提供的主题演示，因此该组命中属于 Demo 主题状态的设计信号，是否需要调整取决于 HUD 配色是否符合预期。
- 1 个 `buried-raster` 命中 VitePress 代码示例的 `button.copy`，属于文档代码块外壳。
- 1 个 `edge-flush-cards` 命中文档 Props 语义表格。它不是组件卡片；该规则按横向卡片容器解释表格，属于疑似语义误报。
- 1 个 `first-viewport-column-overflow` 命中 VitePress 的 `.container` 文档布局容器，长文档内容造成列高差，不是密码输入控件布局。
- 1 个 `layout-transition` 是页面级 `body` 命中，属于 VitePress 文档主题的全局布局过渡。

注入前后 1280px 和 320px 的 `documentElement/body.scrollWidth` 均未变化：宽度增量为 0px，仍无横向溢出。320px 下 Demo 的宽度也保持 272px；其 `y` 坐标由 420px 变为 445px（+25px），这是返回窄视口时记录到的纵向重排，不能据此归因于 Overlay 造成宽度变化。Overlay 自身的橙色提示条会覆盖截图顶部一带，但不参与产品页面布局。

浏览器无页面脚本异常。第一次加载后为读取最新页面而重载，期间 VitePress 字体请求被浏览器取消；这条请求中断已记录，不是应用运行错误。临时 endpoint 在浏览器脚本结束时关闭；其最终端口 `61988` 已无监听，4182 共享文档站仍在监听。

采集脚本首轮在显隐状态步骤因 Playwright 严格模式匹配到三个同名按钮而中止；将定位范围限定至主示例字段后，最终完整采集成功，浏览器脚本退出码为 0。首轮失败属于采集器定位问题，不作为产品交互结论。

## 证据文件

- 浏览器操作、DOM 尺寸、命中归属及控制台：`browser-evidence.json`
- 可复跑的采集脚本：`browser-evidence.mjs`
- 最终采集命令与退出码：`browser-capture-command.txt`、`browser-capture.exit-code.txt`
- 浅色、深色、HUD、320px、减少动态效果及注入后截图：`browser-*.png`
- 临时 detector endpoint 生命周期：`detector-endpoint-lifecycle.json`
- 三个静态扫描的 stdout、stderr、退出码及命令：`detector-*.{stdout.json,stderr.txt,exit-code.txt,command.txt}`
