# LxSearchBar Assessment B 修后复验（2026-10-10）

## Detector

当前源码三目标均重新执行 `detect.mjs --json`，结果均为 JSON `[]`、stderr 空、退出码 `0`：

- `linkx-fe/src/components/LxSearchBar/index.vue` → `linkx-fe-src-components-LxSearchBar-index-vue.{json,stderr,exitcode}`
- `linkx-fe/src/components/LxSearchBar/demo/basic.vue` → `linkx-fe-src-components-LxSearchBar-demo-basic-vue.{json,stderr,exitcode}`
- `linkx-fe/docs/components/lxsearchbar.md` → `linkx-fe-docs-components-lxsearchbar-md.{json,stderr,exitcode}`

`[]` 仍只表示静态规则零命中，必须结合下方浏览器证据解读。

## 浏览器复验

使用隔离 VitePress 服务 `127.0.0.1:4174` 与独立 Impeccable live server。五个 Playwright 新 context 均完成 mutable preflight 与 `detect.js` 注入，截图/console/指标 JSON 位于本目录：

- `light-1440.*`, `light-375.*`
- `hud-1440.*`, `hud-375.*`
- `reduced-motion-1440.*`

Overlay headline：浅色桌面 16、浅色 375 7、HUD 桌面 89、HUD 375 81、减少动效 16。HUD 计数主要是预期 cyan/violet 主题命中；其余是 VitePress 表格代码高亮、文档壳层过渡/裁切及卡片 token 命中。未见 SearchBar 字段、按钮、折叠控件、状态或焦点的特定命中。

修后指标已确认：SearchBar 根节点 `role="search"`；375px 折叠按钮高度 44px，1440px 为 32px；`prefers-reduced-motion: reduce` 下图标 transition 为 `none 1e-05s`。桌面页面 `scrollWidth === clientWidth`。375px 文档整体 `scrollWidth` 受 VitePress API 表格和代码块长行影响（组件卡片自身未发现溢出；具体节点记录在 `overflow.mjs` 输出对应的文档 `table/code`）。服务停止记录：`docs-server/stopped.txt`。

## P0–P3

- P0：无。
- P1：无组件级问题。文档壳层在 375px 存在表格/代码块横向溢出，属于文档承载层而非 SearchBar；若要求整页无横向滚动，另开文档壳层修复。
- P2：无新增组件问题；保留 detector 对 VitePress 长行、代码高亮 occlusion、card border+shadow 和 HUD 令牌的归因。
- P3：以上设计令牌/文档壳层命中无需组件改动。
