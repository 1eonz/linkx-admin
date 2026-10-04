⚠️ 阶段性：本文件只记录 Wave 1 Assessment B 的 detector 和浏览器证据，不含 Assessment A，也不代表完整 A/B 综合 Critique。原生浏览器 provider 不可用，后续按降级流程使用 Vue3 工作区的 Playwright 与 Chrome headless 补采。

# Wave 1 Assessment B 证据

范围为 LxButton、LxActionButtons、LxInput、LxTextarea、LxInputNumber、LxPasswordInput 的当前源码、Demo 和文档。本文件没有读取或使用 Assessment A 的结论，也没有做设计主观评分。

## 静态 Detector

六个组件源码分别运行了 Impeccable 静态 detector。首轮结果均为 `[]`、stderr 为空、退出码为 `0`，原始 stdout、stderr 和退出码均保留在同目录。LxPasswordInput 源码在首轮扫描后发生变化，因此另存并重跑当前版本：`lxpasswordinput.refreshed-detector.stdout.json` 为 `[]`、stderr 为 0 字节、退出码为 `0`。其余五个组件源码的浏览器采集指纹与首轮扫描版本一致。

静态 `[]` 只表示被扫描 Vue 源码没有静态规则命中，不代表渲染页面、交互、主题或响应式验收通过。

## 首次浏览器尝试

首次使用 `cua.getState()` 时返回 `apps: []`、`browsers: []`；新建 IAB 和 Chrome 标签分别失败，错误为 `Browser is not available: iab` 和 `Browser is not available: chrome`。当时从仓库根目录也无法解析 Playwright/Puppeteer 包。首轮结果保留在 `browser-evidence.json`，其中浏览器字段代表首次失败尝试，不是本次补采结果。

## Playwright 补采

随后从 `other-admin/admin-vue3` 的依赖解析到 Playwright 1.58.0，并使用系统 Chrome 154.0.8037.95，以 headless Chromium 打开六个独立页面。六个路由均返回 `200` 并渲染正文。逐页预检均成功修改标题、注入并执行探针脚本、还原标题并移除探针；本次预检记录在 `browser-preflight-playwright.json`。

`browser-evidence-playwright.json` 记录了六页 DOM 指纹、当前源码/Demo/文档 SHA-256、视口尺寸、交互、Console、请求和响应式测量。六张基线图与五张 overlay 图位于 `screenshots-playwright/`。五个 overlay 代表视图为：LxButton 浅色桌面、LxInput HUD 桌面、LxTextarea 浅色 375×812、LxInputNumber HUD 375×812、LxPasswordInput 浅色桌面；LxActionButtons 采集基线和焦点，但不重复注入 overlay。五页均确认 detector 脚本节点存在，DOM overlay 节点数分别为 12、15、11、6、8。这些是标记数量，不等同于缺陷数量。

六个组件的焦点定位均成功。LxPasswordInput 还验证了显隐按钮：输入从 `password` 变为 `text`，按钮从 `aria-pressed="false"` 变为 `true`，名称从“显示密码”变为“隐藏密码”。

桌面视口为 1280×720，窄屏视口为 375×812。两张窄屏页面在 overlay 注入前 `documentElement` 与 `body` 宽度均为 375；注入后 `documentElement.scrollWidth` 变为 615、`body.scrollWidth` 仍为 375，属于 overlay 标注扩展文档滚动宽度的采集影响，不能据此报告页面自身横向溢出。全程外部请求数和失败请求数均为 0。LxButton 页 Console 记录到一条文档站 `/favicon.ico` 404，其余页面无 Console error。

## Overlay 命中核对

- 组件 Demo 命中：多个 `.lx-*-demo__tip`、`.lx-*-demo__hint`、`.lx-*-demo__status` 和 `.password-input-demo__hint` 使用辅助文字颜色；浅色视图中的 `#86909c`/白底约为 3.2:1，HUD 深色视图中的 `#64748b`/深底约为 3.7:1 至 3.9:1。它们是实际 Demo 文案节点，属于令牌对比度后续核查项。
- 控件令牌命中：LxInput HUD 视图的 `.el-input__count-inner` 实测为 `#cbd5e1`/白底 1.5:1，计数文字令牌与白色输入面混用；LxTextarea 超限态 `.lx-textarea__validation-count.is-overflow` 为 10px，detector 按 11px 下限标记。二者对应真实组件状态，保留为待复核建议，本轮没有改组件。
- Demo/文档内容命中：`line-length` 标记的是 Demo 的说明段落；`skipped-heading` 指向文档“交互示例”`h2` 后接 Demo 内部 `h4` 的结构，应作为文档与示例的语义层级问题单独复核。
- VitePress 外壳或规则误配：`buried-raster` 命中 `<button class="copy" title="Copy Code">` 代码复制控件；`edge-flush-cards` 命中 Props API `<table>` 而非卡片；`first-viewport-column-overflow` 命中 `.VPDoc` 正文与目录栏的文档布局；窄屏 `clipped-overflow-container` 命中 VitePress 菜单汉堡图标的 `.container`/`.top`/`.middle`/`.bottom`；`layout-transition` 和 `em-dash-overuse` 均指向整页 `body`。这些记录不能直接归为六个组件的问题。

上述发现只完成了 B 阶段定位。本轮仅修正取证脚本的路径、焦点选择器和日志采集，再对当前文件版本做有界复验；没有修改产品源码，也没有对组件建议实施修复或宣称复验通过。LxPasswordInput 当前源码的刷新 detector 结果另存，以免首轮 `[]` 被误用到更新后的文件。

Impeccable live detector 服务已在采集脚本 finally 中停止；VitePress 服务也已停止。`Questions skipped: 本文件是隔离的 Assessment B 证据记录；A/B 综合结论与面向用户的问题不在本次范围内。`
