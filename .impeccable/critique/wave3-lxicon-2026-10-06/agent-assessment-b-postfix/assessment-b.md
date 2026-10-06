# Assessment B：LxIcon 文档页修后证据

> **历史分报告：不得作为正式 Assessment B 或综合结论。** 此前一次修后评估存在 A/B 材料交叉风险，已从正式结论中排除。当前保留文件无法唯一确认是否对应那次运行，因此本报告仅作历史记录，不据此作通过判断。正式 Assessment B 以 `../agent-assessment-b-isolated-final/assessment-b.md` 及其成功运行原始证据为准。

Method: Assessment B evidence pass (five saved browser states plus a scoped `LxIcon` source scan)

## 范围与采集

评估目标为 `linkx-fe/docs/components/lxicons.md`，浏览器页面为 `http://127.0.0.1:4174/components/lxicons.html`。本报告仅整理静态 detector 与浏览器证据，不据此代替完整设计评审。

修后浏览器采集覆盖桌面浅色默认、桌面深色键盘焦点、390px 移动端空结果、剪贴板失败回退、减少动效悬停五种状态。五次页面导航均为 HTTP 200，`http://127.0.0.1:8400/detect.js` 均返回 200，overlay 成功注入。对应截图为 `screenshots/desktop-light-default.png`、`screenshots/desktop-dark-keyboard-focus.png`、`screenshots/mobile-light-empty-search.png`、`screenshots/desktop-light-copy-failure.png`、`screenshots/desktop-reduced-motion-hover.png`。

可观察状态：默认首屏只展开 4 个 P0 操作；深色状态下键盘焦点可见；移动端空搜索显示“无匹配图标”，状态播报一致且没有结果组；复制失败显示“复制失败，手动复制代码已就绪。”并聚焦回退文本；减少动效状态下图标 `animation` 为 `none`、`transition` 为 `0s`。这些结果支持上述状态行为正常，不代表真实后端验收。

## 静态扫描

对 `linkx-fe/docs/components/lxicons.md` 的最终静态扫描输出为 `[]`，stderr 为空，退出码为 `0`。另按关联组件范围对 `linkx-fe/src/components/LxIcon/index.vue` 运行静态扫描，输出同为 `[]`，stderr 为空，退出码为 `0`。这两项只说明对应源码目标没有被静态规则命中，不表示运行页面不存在问题，也不单独构成 Critique 通过。

## Overlay 命中归因

五个视图记录的受影响 DOM 数依次为 5、7、3、5、5。计数是 overlay 标记的元素数，console 中的规则日志可能重叠，不能相加当作独立缺陷数。

- `line-length`：三处日志指向目标 Markdown 渲染后的正文段落，约 86 字符/行，属于文档可读性建议，优先级为 P3；可在后续编辑时缩短或拆分对应长段落。它与 Markdown 静态扫描 `[]` 并不矛盾：前者检测运行时渲染文本，后者是源码静态规则结果。
- `buried-raster`：命中 VitePress 代码块中的 `button.copy`，其复制按钮在未悬停时使用隐藏/透明呈现。它属于文档壳层的按需显现控件，不是 LxIcon 样例或图标自身的背景，按误报处理。
- `ai-color-palette`：深色状态命中 Shiki 代码高亮中的 `name`、`size` 文本 token，不是产品配色，按误报处理。
- `clipped-overflow-container`：移动端命中 VitePress 汉堡菜单内的 `span.container`。目标页面内容本身未见对应裁切；现有证据不足以把该壳层命中归因给 LxIcon 文档内容，列为未确认的文档壳层命中。
- `overused-font` 与 `layout-transition`：定位在 `<body>` 范围，归于文档外壳；具体样式来源尚未从本轮证据中确认，不能据此要求组件改动。

移动状态下 `documentElement.scrollWidth` 在 overlay 注入前后由 390 增至 630，`body.scrollWidth` 保持 390。该差值与 detector 注入同时出现，当前不能独立证明页面内容发生横向溢出，因此不记为产品缺陷。

## 异常与结论

五个状态均无 JavaScript page error、失败请求或记录到的非 2xx HTTP 响应。桌面浅色默认状态另有一条通用 console 资源 404 消息，但日志没有 URL，当前无法确认资源来源；将其保留为未归因环境观察，不把它计为 LxIcon 缺陷。其余四种状态没有 console error。

本轮没有发现新的 P0–P2 级目标问题。可操作的目标内容建议限于三处较长的文档正文行（P3）；其余 detector 命中属于文档壳层、代码高亮或尚未确认的壳层归因。没有修改产品源码。浏览器 overlay 服务 8400 已停止，停止后核验显示该端口无监听；页面服务 4174 仍返回 200。

证据索引：`browser-evidence.json` 保存五种状态、注入响应、console/page/network 记录与视口宽度；`detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt` 及 `detector-component.*` 保存两项静态扫描原始结果；`live-server.stop.verification.json` 保存服务停止核验。

Questions skipped: 本文件是 Assessment B 证据分报告；综合评审的问题由父级 Critique 报告提出。
