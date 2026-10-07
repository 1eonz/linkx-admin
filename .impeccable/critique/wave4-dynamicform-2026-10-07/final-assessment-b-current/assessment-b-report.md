# Assessment B：Detector 与浏览器 Overlay

日期：2026-10-07

范围：`LxDatePicker`、`LxDynamicForm`、`LxUpload` 三个源码目录，以及 `http://127.0.0.1:4174/components/{lxdatepicker,lxdynamicform,lxupload}` 的浏览器状态。本文只记录 detector 与浏览器证据；没有读取 Assessment A 报告或截图。

## Detector 静态扫描

三个源码目录分别执行 `detect.mjs --json`。原始 stdout 均为 JSON `[]`（3 字节，含换行），stderr 均为 0 字节，退出码均为 0，解析成功且 findings count 为 0。项目台账要求的三个组件文档也已单独扫描；`linkx-fe/docs/components/lxdatepicker.md`、`lxdynamicform.md`、`lxupload.md` 同样全部通过，详见 [六目标补充报告](assessment-b-six-targets-addendum.md)。本报告的浏览器 overlay 仍只针对三个组件页面。

| 目标 | 原始 JSON | stderr | 退出码 |
|---|---|---|---:|
| `linkx-fe/src/components/LxDatePicker` | `lxdatepicker.stdout.json`：`[]` | `lxdatepicker.stderr.txt`：空 | 0 |
| `linkx-fe/src/components/LxDynamicForm` | `lxdynamicform.stdout.json`：`[]` | `lxdynamicform.stderr.txt`：空 | 0 |
| `linkx-fe/src/components/LxUpload` | `lxupload.stdout.json`：`[]` | `lxupload.stderr.txt`：空 | 0 |

每个目标对应的 `.command.txt` 与 `.exit-code.txt` 保留在证据目录。`[]` 只表示源码规则扫描无静态命中，不代表运行页面没有问题。

## 浏览器 Overlay

10 个场景各使用一个全新 Playwright context。所有页面导航均为 HTTP 200；注入前可变 DOM 预检成功并还原标题；`detect.js` 均成功加载，`impeccableScan()` 均可运行。页面异常数和失败请求数均为 0。上传 HUD 进度场景在首次扫描后另对进度状态复扫一次。

| 场景 | 首轮 finding groups | 明确落在目标组件选择器的 groups | 归因 |
|---|---:|---:|---|
| `datepicker-desktop-light-open` | 23 | 4 | 4 项均为打开的日期弹层覆盖其下方标题/标签的 `text-occlusion`；属于浮层打开时的预期覆盖关系，不当作缺陷数。 |
| `datepicker-desktop-hud-open` | 309 | 15 | 12 项是 HUD 深色背景上的预期 cyan token 命中（含重复 SVG/path）；3 项是日期弹层覆盖底层内容。其余大多来自文档外壳、隐藏或当前视口外节点。 |
| `datepicker-mobile-375-light-open` | 15 | 2 | 2 项为日期弹层覆盖底层提示/标签；截图中日历网格仍可见，黄色标记是 detector overlay。 |
| `datepicker-desktop-light-keyboard-open` | 21 | 2 | ArrowDown 成功打开日历；2 项为弹层与底层内容的覆盖检测。 |
| `dynamicform-desktop-light-validation-error` | 19 | 0 | 该状态下可见表单校验错误；扫描命中集中在 VitePress 文档文本、代码块及外壳样式。 |
| `dynamicform-desktop-hud-field-preview` | 375 | 15 | 1 项为 schema 链接，14 项为表单内嵌 `LxUpload` 的图标、路径、浏览链接及拖拽提示；均被 `ai-color-palette` 规则命中。 |
| `dynamicform-mobile-375-hud-error-reduced-motion` | 371 | 19 | 15 项为同类 HUD cyan token；另有 1 项隐藏/视口外提示的低对比度，以及 3 项隐藏/视口外候选控件与校验文字覆盖。当前截图没有显示这些候选控件，未将其判为可见缺陷。 |
| `upload-desktop-light-failure` | 8 | 0 | 预设上传失败状态可见；finding groups 为文档壳与示例说明命中。 |
| `upload-desktop-hud-progress` | 216 | 4 | 首轮命中 2 项 HUD cyan token 和 2 项上传标题/提示低对比度候选。进度状态复扫另有 164 groups、327 个 overlay 元素，其中 9 项显式落在上传控件（均为 cyan token）。 |
| `upload-mobile-375-light-failure` | 4 | 1 | `span.lx-upload__file-name` 被标记超出容器 42px；375px 截图显示文件名被截为 `assessment-sa...`。这是待确认候选，截图未证明省略后无法取得完整文件名。 |

首轮总计 1,361 个 finding groups，进度复扫再记录 164 个 groups。它们是元素级且会重复的规则命中，不是独立问题数：例如一个 SVG 图标会分别命中图标容器、SVG 和 path。首轮有 62 个 selector 明确带有本次组件/demo 标识；其余命中主要位于 `.vp-doc` 文档正文、侧边导航、目录、代码示例与复制按钮。首轮记录中有 1,135 个 group 标为隐藏、1,235 个 group 的纵向坐标在当前视口外；两类可重叠，且都包含跨场景重复项。

### 归因与候选项

- HUD 下的 `ai-color-palette` 大量标记深色主题采用的 cyan 文本/图标，包括 DynamicForm 内嵌上传控件。截图表明这些是已启用的 HUD 配色；这类规则命中是有设计依据的 token 命中，不按数量计为缺陷。
- DatePicker 打开日历时，detector 把浮层覆盖下方文档标题、提示及标签记为文字遮挡。覆盖随弹层开闭而变化，截图显示日历内容仍可见；这是浮层布局下的预期覆盖。黄色框和提示标签本身是评估 overlay 的标注，不是产品 UI。
- 移动端上传文件名的 42px 溢出值得复核。截图显示省略显示，但本轮未验证是否有 title、可访问名称或其他方式读取完整文件名，因此只列为候选。
- Upload HUD 首轮另报 `.lx-upload__title` 对比度 1.1:1（`#e2e8f0` 对 `#eff2f6`）、`.lx-upload__hint` 2.3:1（`#94a3b8` 对 `#eff2f6`）。保留为对比度候选；当前截图没有足够证据确认 detector 取色背景与用户实际看到的背景完全一致。
- DynamicForm 手机 HUD 扫描到的低对比度和三项文字覆盖均标记为隐藏或视口外；当前截图不支持把它们报告成可见问题。

## 控制台与请求

- 10 个页面均无 `pageerror`，无 `requestfailed`；跟踪到的 HTTP 响应均为 200。
- Upload 桌面和手机失败状态各有一条预设 Mock 错误 `UploadAjaxError: 上传服务暂不可用，请重试`。它对应本次采集主动展示的失败状态，不是未处理页面异常；未观察到失败网络请求。
- DatePicker 桌面浅色打开状态有一条控制台 `Failed to load resource: ... 404`。该条日志没有对应到采集器记录的非 200 response（该场景跟踪的 417 个响应均为 200，失败请求为 0），来源未能从本轮证据确认，故单列为未归因的控制台噪声。
- detector 每次扫描会在 console 输出 `[impeccable] ... anti-patterns found` 分组标题；脚本既调用 `impeccableScan()` 又调用 `impeccableDetect()`，所以首轮多数视图记录两条同类日志。这不是额外 findings。

## 哈希与服务状态

三组源码在初始、静态扫描后、浏览器采证开始前及结束后的 SHA-256 清单保持一致：`LxDatePicker` 4 个文件、`LxDynamicForm` 18 个文件、`LxUpload` 4 个文件，均未因采证发生改动。详见 `source-hashes-start.json`、`source-hashes-after-detector.json`、`source-hashes-before-browser.json`、`source-hashes-after-browser.json`。

Assessment B 启动的 Impeccable live-server 使用 8493 端口，停止命令退出码 0，日志为 `Stopped live server on port 8493.`；最终 8493 无监听。原有 4174 服务仍在，`/components/lxdynamicform` 返回 HTTP 200。

## 证据索引

逐文件清单见 [assessment-b-evidence-index.md](assessment-b-evidence-index.md)。本目录中的 detector 原始输出、逐场景 overlay/evidence/console-network JSON、运行时信息、服务启停记录、哈希清单及截图均保留；其中 3 张 `-incomplete.png` 是前一轮遗留文件，未被最新 `browser-capture-summary.json` 引用。没有因本次采证删除或覆盖它们。
