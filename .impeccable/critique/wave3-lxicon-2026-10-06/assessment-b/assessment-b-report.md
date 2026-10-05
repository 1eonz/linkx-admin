# LxIcon Assessment B

本报告仅记录 Assessment B 的 detector 与浏览器证据，未读取 Assessment A 或既有 Critique。产品代码未修改；采集脚本、原始输出、控制台、浏览器状态和截图都保存在本目录。

## 静态 detector

三份扫描都使用 `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json <target>`。每份原始 stdout 是 `[]`，stderr 长度为 0，退出码为 0，因此是有效静态零命中。

| 目标 | findings | stderr | 退出码 | 结论 |
|---|---:|---:|---:|---|
| `linkx-fe/src/components/LxIcon/index.vue` | 0 | 空 | 0 | 有效零命中 |
| `linkx-fe/src/components/LxIcon/icons.ts` | 0 | 空 | 0 | 有效零命中 |
| `linkx-fe/docs/components/lxicons.md` | 0 | 空 | 0 | 有效零命中 |

完整命令和逐项原始结果见 `detector-{component,icons,docs}.{command.txt,stdout.json,stderr.txt,exit-code.txt}`；汇总见 `detector-summary.json`。

## 浏览器采集

目标页面 `http://127.0.0.1:4174/components/lxicons.html` 返回 HTTP 200。采集使用新的 Chrome CDP BrowserContext 和单独标签页，标题标记为 `[Human] LxIcon motion assessment B`。DOM 写入预检成功，Impeccable `detect.js` 加载成功；脚本在 7 个视图各执行了 `window.impeccableScan()`，控制台有对应的 `[impeccable] ... anti-patterns found` 输出，页面异常数为 0。overlay 实际可见并已截图；它们存在于评估浏览器的截图中，没有接入 Codex 内置的 Human 浏览器标签。

| 视图 | 扫描返回组数 | overlay DOM 数 | 横向溢出 |
|---|---:|---:|---|
| 桌面 1280 / 浅色 | 2 | 3 | 无 |
| 桌面 1280 / HUD | 10 | 19 | 无 |
| 手机 375 / 浅色 | 3 | 5 | 无 |
| 手机 375 / HUD | 10 | 19 | 无 |
| reduce / warning hover | 3 | 5 | 无 |
| warning hover | 1 | 1 | 无 |
| keyboard focus / email | 2 | 3 | 无 |

浅色视图的 `documentWidth/bodyWidth` 为桌面 `1265/1265`（视口 1280）和手机 `375/375`；HUD 一致。桌面源码表格的 `thead/tr/code` 子盒会超出视口，但父表格自身可横向滚动且没有扩张页面宽度。375px 下 VitePress 隐藏侧栏的盒子位于屏幕左侧之外，也没有扩张页面根宽度。

真实 CDP 鼠标移动触发了 warning 与 email hover。loading 图标的计算动画为 `0.8s` 无限旋转，前后 transform 发生变化。warning `0.4s`、email `0.45s` 的 hover 动画在等待 650ms 后 `getAnimations()` 为空，hover 期间只保留静止的缩放/阴影状态。键盘从搜索框用 Tab 到 email 卡片共 63 次；活动元素是按钮“复制 email 图标用法”，`focus-visible` 为 true。`prefers-reduced-motion: reduce` 匹配成功，loading/warning/email 的动画都为 `none`、时长为 `0s`、transition 为 `0s`、transform 为 `none`，活动动画列表为空。email 在该采样时保留了此前的键盘焦点。

## Overlay 归因

- `buried-raster` 命中 VitePress 代码块的 `button.copy`，对应复制按钮图形而不是 `LxIcon`。归为文档外壳命中。
- `first-viewport-column-overflow` 命中 `.VPDoc` 的 `div.container`，框住的是长文正文与 VitePress 页面目录列；长文章结构使正文自然高于目录列。归为文档布局误报。
- `overused-font` 与 `layout-transition` 命中 `body`，来自整站文档壳的字体/过渡规则，无法归因到目标组件。
- `clipped-overflow-container` 仅在 375px 视图命中 `span.container`；同视图页面根宽度仍为 375，未产生横向滚动。它不是页面级溢出证据，作为文档运行时结构命中单独记录。
- HUD 的 `ai-color-palette` 命中代码语法高亮的紫色 span，以及 P2 `zoom-in` 卡片/图形/文字。主题主色令牌 `--lx-color-primary: #38bdf8` 是 HUD 已定义的 sky 蓝；这些颜色命中属于代码高亮与既有主题令牌，不据此认定组件缺陷。
- 动态 hover 视图的 `gpt-thin-border-wide-shadow` 命中 `.icon-tile`，细边框和阴影来自总览卡片 hover 的既有 `--lx-shadow-pop` 令牌。记录为有设计依据的令牌命中。
- 仅 `reduced-motion-warning-hover` 出现 `text-occlusion`，提示文本包含 detector 自己的 `✦ hairline border with w...` overlay 标签。此项是扫描器 overlay 与自身 DOM 交互产生的自命中，不归为产品文本遮挡。

以上浏览器规则命中不改变三份源文件的静态零命中结论；页面级规则、VitePress 外壳和主题令牌没有按命中数量直接计为图标缺陷。

## 运行记录

首轮浏览器脚本在注入 detector 前以退出码 1 失败，原因是 Runtime.evaluate 的 Promise 表达式多调用了一次。失败命令、空 stdout、原始 stderr、退出码及状态说明保存在 `browser-first-run.*`。该轮中间 `browser-evidence.json` 随后被成功复跑覆盖，因此 `browser-first-run-evidence.json` 明确说明它是失败状态记录，不冒充原始中间 JSON。

修正后复跑由 `capture-browser-run.mjs` 捕获，原始 stdout、stderr 和退出码分别在 `browser-rerun.stdout.json`、`browser-rerun.stderr.txt`、`browser-rerun.exit-code.txt`；退出码为 0、stderr 为空。结构化事实见 `browser-evidence.json`，原始控制台见 `browser-console.json`。截图为 `desktop-1280-light.png`、`desktop-1280-hud.png`、`mobile-375-light.png`、`mobile-375-hud.png`、`motion-loading-running.png`、`motion-warning-hover.png`、`motion-email-hover.png`、`interaction-keyboard-focus-email.png`、`reduced-motion-warning-hover.png` 和 `overlay-*.png`。

Impeccable live-server 在复跑结束后于端口 8400 正常停止，stop 退出码为 0，端口无监听；停止命令及输出也已保存。目标组件与文档文件的 Git 状态无新增改动。
