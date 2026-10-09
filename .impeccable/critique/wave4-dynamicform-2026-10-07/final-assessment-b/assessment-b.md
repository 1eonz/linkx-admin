方法：独立 Assessment B

# 独立取证报告

本报告只记录 Assessment B 的 detector 与浏览器证据；未读取、引用或合并 Assessment A 产物，也未修改产品源码。采集脚本、命令原文、退出码、原始扫描 JSON、浏览器记录和截图均保存在本目录。

## 结论摘要

- 六个静态 detector 目标均可访问，命令退出码为 `0`，stdout 为有效 JSON `[]`，stderr 为空，扫描前后哈希一致。这只说明静态扫描零命中，不代表浏览器 Critique 零问题或整体审查通过。
- 完成 8 个浏览器页面状态，覆盖 DynamicForm、Upload、DatePicker 的桌面浅色/HUD 与移动交互；首轮采集另有一次重试。DynamicForm HUD 首轮点击隐藏 checkbox input 超时，改点可见标签后重跑成功，overlay、截图和场景记录均完整。
- 八个成功场景均无外部请求尝试、HTTP 错误、失败请求、console error 或 page error；浏览器采集前后六个目标的聚合哈希未变化，产品源码未修改。
- 残余风险：Upload 移动端取消按钮在进度 `20` 时可见，但上传在 overlay 扫描期间完成，取消未生效，因此取消流程未验收通过。DatePicker 打开状态由原始截图核验，自动可见性探针返回值与截图不一致，已保留该差异。

## 静态 Detector

六个目标均可访问。每项命令退出码为 `0`，stdout 是有效 JSON 数组 `[]`，stderr 为空，因此结果只表示该目标的静态扫描零命中。六项目标扫描前后哈希一致。

| 目标 | 结果 | 扫描文件数 | SHA-256 前缀 |
| --- | --- | ---: | --- |
| `src/components/LxDynamicForm/` | 静态零命中 | 18 | `45608a66dd8a` |
| `docs/components/lxdynamicform.md` | 静态零命中 | 1 | `962a9ef4d5eb` |
| `src/components/LxUpload/` | 静态零命中 | 4 | `0591eb684c30` |
| `docs/components/lxupload.md` | 静态零命中 | 1 | `7141bdc2d333` |
| `src/components/LxDatePicker/` | 静态零命中 | 4 | `43a5d0cd06c8` |
| `docs/components/lxdatepicker.md` | 静态零命中 | 1 | `b3fdf451d510` |

每项的完整命令、原始 JSON、stderr、退出码和文件级哈希见 `*-component.*`、`*-doc.*` 对应 sidecar；汇总见 [detector-summary.json](detector-summary.json) 和 [detector-run-summary.json](detector-run-summary.json)。

## 浏览器证据

使用 Playwright `@playwright/test` 1.58.0；每个场景建立独立 context/page，`deviceScaleFactor: 1`。机器默认 Chromium 1208 安装停在下载后的安装阶段；改用本机已有的 Playwright headless-shell 可执行文件启动 Chromium `149.0.7827.55`，采集仍通过 Playwright API 完成。运行时记录见 [playwright-runtime.json](playwright-runtime.json)。

现有文档站 `4174` 由 PID `18956` 提供，采集前后三个路由均返回 HTTP 200，没有停止该服务。Impeccable live server 按 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" --background` 启动在 `8400`；`/health` 与 `/detect.js` 返回 200。结束时执行 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject`，退出码 0，并确认 `8400` 已不可连接。启动、停止、健康检查原始记录见 `overlay-server-*.txt`、`overlay-server-lifecycle.json` 与 `overlay-script-preflight.json`。

共完成 8 个独立页面状态；HUD 动态表单首轮因点击 Element Plus 隐藏 checkbox input 超时，保留 attempt 1 证据后改点可见 label 重跑成功。每个成功状态均注入官方 `http://localhost:8400/detect.js`，`window.impeccableScanAsync()` 返回结构化数组，并保存扫描 JSON、viewport 原始 PNG 和浏览器网络/控制台记录。

| 页面与状态 | 视口 | HTTP | Overlay / 截图 |
| --- | ---: | ---: | --- |
| DynamicForm 默认浅色 | 1440×900 | 200 | 已运行 / 尺寸吻合 |
| DynamicForm HUD、远程字段失败 | 1440×900 | 200 | 重跑成功 / 尺寸吻合 |
| Upload 浅色 | 1440×900 | 200 | 已运行 / 尺寸吻合 |
| Upload HUD | 1440×900 | 200 | 已运行 / 尺寸吻合 |
| Upload 移动端进度与取消尝试 | 375×812 | 200 | 已运行 / 尺寸吻合；取消场景未保持 |
| DatePicker 浅色打开区间 | 1440×900 | 200 | 已运行 / 尺寸吻合 |
| DatePicker HUD 打开区间 | 1440×900 | 200 | 已运行 / 尺寸吻合 |
| DatePicker 触屏打开区间 | 375×812 | 200 | 已运行 / 尺寸吻合 |

首轮加 HUD 重跑共 9 次页面采集，全部 overlay 调用成功；首轮失败原始材料为 `dform-desktop-hud-field-failure.attempt-1.browser.json` 和同名 `.attempt-1.png`。每个状态的结构化检测数量见 [overlay-findings-summary.json](overlay-findings-summary.json)，场景和网络汇总见 [browser-scenario-summary.json](browser-scenario-summary.json) 与 [console-network-summary.json](console-network-summary.json)。

## 命中归属与边界

- HUD 下重复的 `ai-color-palette` 命中集中在 HUD 青色文字和图标；DynamicForm HUD 有 350 条、Upload HUD 有 156 条，绝大多数是同一主题样式在子节点上的重复标记，不应直接按命中数当成缺陷数。DynamicForm HUD 的归属扫描记录了元素 tag、class、文字和位置；示例包括失败选项、`dynamic-form-demo__schema-link`、重试按钮和 `el-upload-dragger`。
- DynamicForm 的 `cramped-padding` 指向真实示例中的 `.el-upload-dragger`，属于组件内命中，需结合设计规范复核。`line-length` 与 `em-dash-overuse` 命中的是文档正文；它们不代表字段控件自身问题。
- DatePicker 的 `text-occlusion` 与细边框/阴影提示落在日历面板和日期网格附近。打开区间的原始截图能看到两个月面板和日期值；该规则会把表格标题、日期网格等相邻层次标出，不能按 overlay 数量直接判为真实遮挡。截图中的叠加标签本身来自 detector overlay。
- 浏览器 detector 扫描整张 VitePress 文档页，而非隔离组件节点；文档外壳、正文和示例中隐藏/备用状态会进入同一结果。静态 `[]`、浏览器节点命中与组件缺陷是不同证据层级。

## 验收限制

所有成功场景均记录 `0` 外部请求尝试、`0` HTTP 错误、`0` 失败请求、`0` console error 和 `0` page error；示例 Mock 未触及真实后端。Upload 移动端首帧前读到进度 `20` 且取消按钮可见，但 overlay 扫描等待期间内存 Mock 已上传成功；最终 375×812 截图显示成功文件，取消点击为 `false`。因此“移动端进度取消态”仍未完成浏览器验收，不能标记通过。

DatePicker 桌面与移动截图肉眼确认区间日历已展开；移动面板几何为 `x=27, y=214, 322×363`，完整处于 `375×812` 视口内。自动可见性 locator 返回 `false`，与截图像素不符，已在场景 JSON 保留探针结果及截图核验说明。

浏览器采集前后六个组件/文档目标的聚合 SHA-256 均未变化，见 [browser-source-integrity.json](browser-source-integrity.json)。4174 服务仍由原 PID `18956` 监听；本轮只停止了临时 overlay 服务。
