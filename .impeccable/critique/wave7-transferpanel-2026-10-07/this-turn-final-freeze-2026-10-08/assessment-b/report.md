# Wave 7 Assessment B：当前源码检测与浏览器证据

评估对象为当前工作区的 `LxTransferPanel` 与 `LxVirtualTree` 组件、basic Demo 及对应文档。证据仅写入本目录；本次未修改产品源码或文档，也未读取 Assessment A 或代码审查输出。

## 静态检测

使用 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json <target>` 分别扫描六个 markup target。六次均返回有效 JSON `[]`，stderr 为空、退出码为 `0`，因此记为有效静态零命中；这不代表浏览器 Critique 零命中或通过。

| 目标 | JSON | stderr | 退出码 | 结果 |
| --- | --- | --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `detectors/transferpanel-component/stdout.json` | `detectors/transferpanel-component/stderr.txt` | `detectors/transferpanel-component/exit-code.txt` | 有效 `[]` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `detectors/transferpanel-demo/stdout.json` | `detectors/transferpanel-demo/stderr.txt` | `detectors/transferpanel-demo/exit-code.txt` | 有效 `[]` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `detectors/transferpanel-docs/stdout.json` | `detectors/transferpanel-docs/stderr.txt` | `detectors/transferpanel-docs/exit-code.txt` | 有效 `[]` |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `detectors/virtualtree-component/stdout.json` | `detectors/virtualtree-component/stderr.txt` | `detectors/virtualtree-component/exit-code.txt` | 有效 `[]` |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | `detectors/virtualtree-demo/stdout.json` | `detectors/virtualtree-demo/stderr.txt` | `detectors/virtualtree-demo/exit-code.txt` | 有效 `[]` |
| `linkx-fe/docs/components/lxvirtualtree.md` | `detectors/virtualtree-docs/stdout.json` | `detectors/virtualtree-docs/stderr.txt` | `detectors/virtualtree-docs/exit-code.txt` | 有效 `[]` |

每项完整原命令和 JSON 有效性记在 `detectors/<key>/command.txt` 与 `detector-index.json`。

## 浏览器证据

起初新 Chrome context 导航时 4174 拒绝连接；该失败原始证据保存在 `browser/preflight-connection-refused.json`。复核时端口已无 listener，经父任务确认需保留用户文档预览后，仅用 `linkx-fe` 自带 `pnpm dev --host 127.0.0.1 --port 4174 --strictPort` 在空闲的 4174 重启 VitePress。记录的启动父 PID 为 2636，实际监听 PID 为 27132；两条目标路由随后均返回 HTTP 200。预览服务按要求留给用户使用。

浏览器使用新建的独立 Chrome profile（remote debugging port 9355），两条路由分别在新 browser context/tab 中检查。预检确认 `document.title` 可修改、动态 script tag 可插入且脚本执行；注入前桌面/移动尺寸记录于 `browser/preflight.json`。随后从 `linkx-fe` 启动 `live-server.mjs --background`，PID 27528、端口 8400；`/detect.js` 返回 HTTP 200。八个 desktop/mobile × light/dark 视图都实际加载 detector，页面存在 detector 标注节点，并采集 console、overlay DOM 和截图，完整记录在 `browser/overlay-views.json`，截图和 context 索引在 `browser/evidence-index.json`。

实际主题在八个视图中均与请求主题相同。浅色/深色切换按钮在桌面与移动页面均可见；点击后的同步返回值偶尔先于 VuePress class 更新，报告以随后读取的实际主题 class 和截图为准。浏览器未记录未捕获 JS exception。

| 页面 | 桌面浅/深命中 | 移动浅/深命中 |
| --- | ---: | ---: |
| LxTransferPanel | 18 / 32 | 186 / 22 |
| LxVirtualTree | 13 / 34 | 175 / 197 |

命中数来自每个视图 console 中 detector 的 anti-pattern 汇总行，不应直接视作缺陷数。逐规则结果见 `browser/detector-rule-summary.json`，原始 console 与 DOM 命中见 `browser/overlay-views.json`。

归属复核：移动浅色视图中大量重复的 `ai-color-palette` 命中落在通用 `span`，多为页面文档壳层/overlay 重复覆盖，需按节点确认后再处理。深色视图的相同规则在文档主题的图标或品牌装饰中重复出现；不可把重复数量当作组件缺陷。`buried-raster` 主要命中 VitePress 的代码复制按钮，属于文档壳层。`line-length` 与 `edge-flush-cards` 命中 API 表格或说明文字，部分是文档密度信号，不等价于组件视觉问题。

`low-contrast` 的深色 VirtualTree 命中包含 Demo 的 `legend`、状态/选择说明和文档横向滚动提示；这些属于真实可见目标，值得综合评审逐项核对，不应因使用共享令牌自动忽略。截图同时显示 detector 自己的黄色标注会覆盖页面内容，这是审查 overlay 的呈现效果，不是产品页面元素。`text-occlusion` 的少数命中涉及 Demo 工具按钮、legend 与组件内搜索 `label`；源码中筛选 `label` 会语义包含 input/清除按钮，规则对容器与被包含控件的覆盖判断可能误报，仍须按实际截图/目标矩形判断。`bounce-easing`、`layout-transition` 命中挂载后的页面合成样式，不能据此直接断言目标源码新增了相同动画。

## 移动宽度归属

注入前，两页在 375px 视口的根 `clientWidth` 与 `scrollWidth` 均为 375；API 表格/代码段部分内容超出自身表格，但由表格横向滚动容器承载。注入后，两页 `html.scrollWidth` 均为 615px，`body.scrollWidth` 仍为 375px。归属检查确认新增长出的根滚动宽度来自 detector 新增的绝对定位 `.impeccable-label`，最远标注右边界为 615px；这 240px 增量归 overlay 标注，不是原页面根布局。桌面注入前后根 `scrollWidth` 均为 1425px（viewport `innerWidth=1440`，差值为浏览器滚动条）。详细元素、宽度和 overlay attribution 在 `browser/overflow-attribution.json`；八张屏幕图展示了移动端标注覆盖区域。

## 清理与源码完整性

临时 overlay 使用命令 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject` 停止。首次调用 stdout 为 `Stopped live server on port 8400.`，stderr 为空、退出码 `0`，记录在 `overlay-server-stop-success.json`；持久化复核再次调用返回 `No running live server found.`，退出码 `0`，记录在 `overlay-server-stop.json`。停止后 8400 无 listener，4174 仍由 PID 27132 监听。独立 Chrome browser 已发送 `Browser.close`，对应 profile 下没有存活 browser process。

六个组件、Demo 与文档文件的 SHA-256 在 `hashes-before.json` 与 `hashes-after.json` 中全部一致，证明本次评估未修改目标文件。

Questions skipped: 由主 Agent 统一综合。
