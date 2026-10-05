# LxCheckbox / LxRadio Assessment B：Detector 与浏览器证据

## 范围与隔离

静态扫描目标为 `LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 四个目录（包含组件 Demo 和样式）；浏览器目标为 VitePress `/components/lxcheckbox` 与 `/components/lxradio`。本记录只包含 Assessment B 证据，未读取 Assessment A 的目录或结论，未修改产品源码及正式台账。

## 静态 Detector

执行 Impeccable bundled detector `detect.mjs --json` 扫描四个目标目录。结果 JSON 为 `[]`，stderr 为空，退出码 `0`。完整文件分别为 `detector-source.json`、`detector-source.stderr.txt`、`detector-source.exit-code.txt`。这只代表上述源码目标的静态规则零命中，不代表运行页面没有问题或 Critique 通过。

## 浏览器采集

4174 上已有 VitePress 服务，进程 PID `42868`；两个目标路由均在六个隔离页面运行时载入。该服务由其他进程持有，本次只读使用，没有停止。`cua.getState()` 未提供浏览器表面，Playwright/Puppeteer 也不可用；因此使用独立临时 profile 的 Chrome headless/CDP 完成页面操作，并由临时 localhost 资源只读提供 bundled `detect.js`。每个场景都先修改页面标题和 body 属性，再向 `document.head` 追加脚本；六次脚本加载与扫描均成功。截图是隔离 headless 浏览器证据，不代表用户浏览器中存在可见的 `[Human]` overlay。

六个视图的 viewport、overlay 节点和 detector 标签数如下：

| 页面状态 | 视口 | Overlay 节点 / 标签 | 运行态观察 |
| --- | ---: | ---: | --- |
| Checkbox 默认浅色 | 1280×900 | 8 / 7 | “全部授权”为半选；禁用权限项保持禁用 |
| Checkbox HUD 深色 | 1280×900 | 7 / 6 | HUD 生效，Demo 背景测得 `rgb(11, 18, 32)` |
| Checkbox 窄屏 | 390×844 | 9 / 8 | 含禁用项；无水平溢出 |
| Radio 默认浅色 | 1280×900 | 8 / 7 | 单选初始值与禁用项可见 |
| Radio HUD 深色 | 1280×900 | 10 / 9 | HUD 生效，Demo 背景测得 `rgb(11, 18, 32)` |
| Radio 窄屏键盘 | 390×844 | 10 / 9 | ArrowRight 从“日常勤务”切到“应急处突”，焦点可见 |

两种窄屏场景的 `documentElement.scrollWidth` 和 `clientWidth` 均为 `390`，没有页面横向溢出。Checkbox 半选属性在浏览器属性上为 `indeterminate=true`；Checkbox 与 Radio 的禁用项属性均为 `disabled=true`。可点击选项外层在窄屏实测高 `32px`，低于对应文档说明中的 `44px` 最小触控目标，应由 Assessment A 综合确认是否作为修复项。

浏览器共记录 2,491 个响应事件；六个 `/detect.js` 响应均为 HTTP `200`。唯一失败请求是该既有 VitePress 服务的 `/favicon.ico`，状态 `404`；没有看到业务 API 请求。原始测量、console 与网络摘要保存在 `browser-evidence.json`，运行器 stdout、stderr、退出码分别保存在 `browser-run.stdout.json`、`browser-run.stderr.txt`、`browser-run.exit-code.txt`。

## Overlay 核验

六张 overlay 截图见：

- `checkbox-light-desktop-overlay.png`
- `checkbox-hud-dark-desktop-overlay.png`
- `checkbox-mobile-disabled-overlay.png`
- `radio-light-desktop-overlay.png`
- `radio-hud-dark-desktop-overlay.png`
- `radio-mobile-keyboard-overlay.png`

截图中核对到的规则标签包括 `low contrast text`、`skipped heading level`、`en-dash overuse`、`bounce or elastic easing`、`layout property animation`、`ai color palette`。按实际目标逐项判定：

- `low contrast text` 框选到了 Checkbox/Radio Demo 内的提示、状态和规格说明文字，属于目标内容，建议做对比度复核；不能把它当作 VitePress 壳层误报。
- `skipped heading level` 对应 Markdown 的 `h2`“交互示例”后接 Demo 的 `h4` 组标题，确为当前页面文档结构命中。
- `en-dash overuse` 计数为 Checkbox 8、Radio 9。目标文档 API 表用 `—` 表示无默认值；这是表格占位符，不能直接按正文文案缺陷计数。
- `ai color palette` 框选 Radio 选中态的蓝色主色反馈；文档明确该白底蓝心靶环来自 Lx 设计，属于预期令牌命中。
- `bounce or elastic easing` 与 `layout property animation` 出现在全页扫描 overlay 中，但当前运行证据没有将其定位到 Lx 包装层；暂列待归属，不能据标签数量判定组件缺陷。

## 清理核验

六个 CDP 页面已关闭。检查没有发现命令行带本次临时 profile 标识的 Chrome 进程，临时 profile 目录已清理；没有结束其他 Chrome 进程。PID `42868` 的 VitePress 服务仍运行。没有启动 Impeccable variant live-server；原先缺失的 `.impeccable/live/server.json` 仍缺失，用户工作区状态得到保留。
