# LxCheckbox / LxRadio Assessment B

本文件仅记录检测器与浏览器证据，不包含 Assessment A 的设计评审，也不构成完整双评估 Critique 的正式通过结论。

## 范围与采集方式

静态扫描目标为 `LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 四个目录。浏览器目标为 VitePress 页面 `http://127.0.0.1:4174/components/lxcheckbox` 与 `http://127.0.0.1:4174/components/lxradio`。所有八个状态视图均使用独立临时 Chrome profile 和 Chrome DevTools Protocol 重新访问指定的 4174 服务；每页都成功注入 bundled detector，并调用 `window.impeccableScan()`。截图是注入后的 viewport 截图，浏览器证据 JSON 保存各页尺寸、组件状态、overlay 目标、console 消息和网络事件。

首次只读探测时 4174 返回 `ERR_CONNECTION_REFUSED`，我记录后没有停止、替换或覆盖该端口。随后 parent 启动 4174 并保持运行，我复查得到 HTTP 200，再将全部采集切到 4174。因为当前子 Agent 的 CUA 无法创建 IAB 标签（返回 `IAB visibility is not supported in a subagent thread`），浏览器检查使用独立 CDP Chrome；没有复用或结束其他 Chrome 进程。

## 静态检测

执行命令：

```text
node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json linkx-fe/src/components/LxCheckbox linkx-fe/src/components/LxCheckboxGroup linkx-fe/src/components/LxRadio linkx-fe/src/components/LxRadioGroup
```

退出码为 `0`，stdout JSON 为 `[]`，stderr 为空。含义仅为四个组件目录的静态规则零命中，不能据此宣布浏览器或正式 Critique 通过。原始输出分别保存在 `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`。

针对退出码记录疑义，我重新读取了上述原始三份文件：当前 `detector.exit-code.txt` 内容为 `0`，stdout 是 `[]`，stderr 长度为 0。随后按当前源码再次执行同一四目录命令，结果仍为 exit `0`、JSON `[]`、stderr 0 字节；复跑三份原始文件为 `detector-rerun.stdout.json`、`detector-rerun.stderr.txt`、`detector-rerun.exit-code.txt`。因此当前证据不支持 detector 曾以 `2` 退出。

本目录中可复现的旧 exit `2` 实际位于 `browser-run-attempt-1.exit-code.txt`，属于首轮浏览器采集器进程。其对应日志 `browser-run-attempt-1.stdout.json` 的错误为 `Touch points must be between 1 and 16`：采集器向桌面场景的 `Emulation.setTouchEmulationEnabled` 发送了 `maxTouchPoints=0`。这次失败与静态 detector 命令无关；修正采集参数后浏览器八视图复跑退出码为 `0`。

## 浏览器状态

| 视图 | 目标状态 | 注入与截图 | 页面宽度 / 横向滚动宽度 |
| --- | --- | --- | --- |
| `checkbox-light-desktop` | 浅色桌面，默认、半选、已选及禁用控件 | 成功；4 个 overlay 节点 | 1265 / 1265 |
| `checkbox-hud-dark-desktop` | HUD 深色桌面 | 成功；14 个 overlay 节点 | 1265 / 1265 |
| `checkbox-touch-375` | 375px 触屏，实际触摸独立复选框 | 成功；4 个 overlay 节点 | 375 / 375 |
| `checkbox-disabled-selected-half-375` | 375px 触屏，禁用已选与禁用半选回显 | 成功；4 个 overlay 节点 | 375 / 375 |
| `radio-light-desktop` | 浅色桌面，水平、垂直和旧值用法 | 成功；3 个 overlay 节点 | 1265 / 1265 |
| `radio-hud-dark-desktop` | HUD 深色桌面 | 成功；7 个 overlay 节点 | 1265 / 1265 |
| `radio-touch-375` | 375px 触屏，实际触摸“应急处突” | 成功；4 个 overlay 节点 | 375 / 375 |
| `radio-tab-arrow-reduced-motion` | Tab 焦点、方向键跳过禁用项、系统减少动效 | 成功；3 个 overlay 节点 | 1265 / 1265 |

checkbox 的禁用已选项在浏览器状态中为 `checked=true`、`disabled=true`；禁用半选项为 `checked=false`、`indeterminate=true`、`disabled=true`。桌面选项高度为 32px，触屏场景为 44px。键盘场景中，Tab 进入“高密加密专线”并显示 `:focus-visible`；ArrowRight 跳过禁用的“卫星链路直通”，将焦点和选中状态移至“光纤骨干网”。减少动效场景的 radio 内核过渡时长为 `0.00001s`。所有视图均无页面横向溢出。

每个视图对应的截图为 `<视图名>-overlay.png`；完整测量、overlay 和请求/console 记录见 `browser-evidence.json`。八次 detector 脚本请求均返回 HTTP 200，浏览器采集进程 stderr 为空、最终退出码为 `0`，详情见 `browser-run.stdout.json`、`browser-run.stderr.txt`、`browser-run.exit-code.txt`。

## Detector 命中归属

- `buried-raster` 命中 `.copy` 按钮，DOM 祖先是 VitePress 的代码块 `.vp-adaptive-theme`，来自文档示例代码的复制按钮，属于文档外壳。
- `clipped-overflow-container` 在 375px 视图命中 `span.container`，其祖先是 VitePress `VPNavBarHamburger` 汉堡菜单按钮，不属于 checkbox 或 radio 控件。
- `cards-flush-scroller` 命中 Props 文档表格 `TABLE`，位于 VitePress `.vp-doc` 文档区域，不是组件演示面板。
- `em-dash-overuse`、`bounce-easing`、`layout-transition` 被归到整页 `body`；它们针对文档正文或 VitePress 页面级样式，不定位到这四个组件。
- HUD radio 的 `ai-color-palette` 命中三个已选 `.el-radio__label`。实测文字颜色为 `rgb(56, 189, 248)`，当前 `--lx-color-primary` 与 `--el-color-primary` 都是 `#38bdf8`。这是组件样式表为已选状态指定的主色令牌，符合此组件的视觉规格，属于令牌命中而非错误色彩硬编码。HUD 下另有同规则命中代码示例中的 Shiki 语法高亮 `SPAN`，它位于 VitePress 代码块。

没有 overlay 命中 checkbox/radio 的禁用选中呈现、触控尺寸或键盘焦点环。以上分类基于 overlay 实际目标节点、DOM 祖先、测得的主题令牌与组件样式表，不把 detector 的命中数量直接当成缺陷数量。

## 异常与限制

最终八个状态均可访问且注入成功。网络记录中唯一 HTTP 错误是首次浅色 checkbox 页面的 `favicon.ico` 返回 404，并对应一条浏览器资源加载 console error；请求事件未记录 `Network.loadingFailed`。其余路由资源与八次 detector 请求均成功。

首轮浏览器采集曾因采集器向桌面场景发送无效的 `maxTouchPoints=0` 而退出 `2`；三个 375px 状态当轮仍完成。该轮原始证据留存在 `browser-evidence-attempt-1.json` 和 `browser-run-attempt-1.*`。修正采集器后复跑全部八个视图，最终退出码为 `0`，旧失败轮没有被当作最终结果。
