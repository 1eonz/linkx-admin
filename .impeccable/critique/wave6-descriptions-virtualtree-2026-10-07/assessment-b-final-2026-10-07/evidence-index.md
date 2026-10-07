# Wave 6 Assessment B 证据索引

采集日期：2026-10-07（Asia/Shanghai）
范围：LxCascader、LxDescriptions、LxVirtualTree 的组件源码、Demo、中文文档，以及 VitePress 文档侧栏配置和侧栏示例页。
方式：只读采证；没有修改产品源码、测试、正式计划台账或 4175 文档服务。

## 1. 上下文与源码指纹

- Impeccable context：context-target.md
- 稳定 target：linkx-fe/src/components/LxDescriptions/index.vue
- context 命令退出码：0；本项目没有 PRODUCT.md、DESIGN.md 或 surface brief。
- context 输出将现有视觉实现作为窄范围评估依据。context 命令和原始结论见 context-target.md。
- 组件、Demo、文档和侧栏文件 SHA-256 见 fingerprints/。

指纹覆盖：

- lxcascader：组件 index.vue/types.ts/style.css、Demo、docs/components/lxcascader.md
- lxdescriptions：组件 index.vue/types.ts、Demo、docs/components/lxdescriptions.md
- lxvirtualtree：组件 index.vue/types.ts、Demo、docs/components/lxvirtualtree.md
- docs-sidebar：.vitepress/config.ts、.vitepress/theme/index.ts、.vitepress/theme/custom.css

## 2. Detector 证据

命令模板：node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "<target>"

7 个目标均完成真实扫描。每项命令、stdout JSON、stderr 和退出码在对应目录；stdout [] 只代表该静态目标无规则命中，不能替代浏览器证据或表示 Critique 通过。

| 目标 | target | 退出码 | 证据目录 | 结果 |
|---|---|---:|---|---|
| LxCascader 源码 | linkx-fe/src/components/LxCascader | 0 | cli/lxcascader/ | stdout []，stderr 空 |
| LxDescriptions 源码 | linkx-fe/src/components/LxDescriptions | 0 | cli/lxdescriptions/ | stdout []，stderr 空 |
| LxVirtualTree 源码 | linkx-fe/src/components/LxVirtualTree | 0 | cli/lxvirtualtree/ | stdout []，stderr 空 |
| VitePress 侧栏配置 | linkx-fe/docs/.vitepress/config.ts | 0 | cli/docs-sidebar/ | stdout []，stderr 空 |
| LxCascader 文档 | linkx-fe/docs/components/lxcascader.md | 0 | cli-docs/lxcascader/ | stdout []，stderr 空 |
| LxDescriptions 文档 | linkx-fe/docs/components/lxdescriptions.md | 0 | cli-docs/lxdescriptions/ | stdout []，stderr 空 |
| LxVirtualTree 文档 | linkx-fe/docs/components/lxvirtualtree.md | 0 | cli-docs/lxvirtualtree/ | stdout []，stderr 空 |

7 个 stderr 文件均为空，7 个 exit-code 文件均为 0；没有 detector 缺失、非零退出或目标无法扫描。

## 3. 浏览器证据

4175 文档服务由主 Agent 提供，四个路由均 HTTP 200：

- http://127.0.0.1:4175/components/lxcascader.html
- http://127.0.0.1:4175/components/lxdescriptions.html
- http://127.0.0.1:4175/components/lxvirtualtree.html
- http://127.0.0.1:4175/components/lxsidebar.html

浏览器使用系统 Chrome C:\Program Files\Google\Chrome\Application\chrome.exe，Playwright 从 other-admin/admin-vue3/node_modules 加载；每个目标新建独立 page。mutable preflight 成功，detect.js 注入成功。

最终采集命令、stdout、stderr、exit：

- browser/capture-browser-recheck-3.command.txt
- browser/capture-browser-recheck-3.stdout.json
- browser/capture-browser-recheck-3.stderr.txt
- browser/capture-browser-recheck-3.exit-code.txt，值为 0
- 脚本：browser/capture-browser.mjs

所有 overlay JSON 在 browser/overlay/recheck-3/，所有截图在 browser/screenshots/recheck-3/。每个 JSON 保存 viewport、主题、命中元素、截图路径、注入状态、console 和 page error。

### 3.1 页面、主题和状态

| 目标 | 页面状态 | 结果 |
|---|---|---|
| LxCascader | desktop-light、desktop-dark、desktop-hud、375px；Demo 加载中、失败、加载中且失败、禁用 | 4/4 状态按钮 DOM click 成功；HUD checkbox checked；每个状态有独立 UTF-8 hex 文件名 JSON/PNG |
| LxDescriptions | desktop-light、desktop-dark、desktop-hud、375px；Demo 读取中、空结果、错误；错误态聚焦重试并 Enter 恢复 | 3/3 状态按钮 DOM click 成功；HUD checkbox checked；键盘错误/恢复独立留证 |
| LxVirtualTree | desktop-light、desktop-dark、desktop-hud、375px；Demo 空结果、加载中、加载失败；树区域方向键/空格操作 | 3/3 状态按钮 DOM click 成功；HUD checkbox checked；定向 recheck-4 page 另有 keyboard-tree 独立留证 |
| 文档侧栏 | desktop-light、desktop-dark、desktop-hud、375px | 4/4 新 page；示例 HUD checkbox 通过 DOM click，侧栏自身也使用内置 HUD 深色形态；移动页记录侧栏/汉堡菜单尝试 |

中文状态名使用 UTF-8 hex 后缀，避免多个状态清洗成同一个文件名，状态截图没有互相覆盖。

### 3.2 命中元素和归因

- LxCascader：每次 25 个 overlay，12 个可映射。映射包含文档说明段落 P、API TABLE、代码复制按钮和 Element Plus popper。hairline border with wide shadow 对应 div.el-popper.is-light.el-cascader__dropdown.lx-cascader__popper；DOM style 明确 display:none，因此这是隐藏传送弹层的命中，不代表屏幕上出现白色 HUD 弹层。HUD 状态 class 为 lx-cascader__popper dark lx-theme-hud；按隐藏 DOM/文档壳误报归类。没有把它当作可见白色弹层缺陷。
- LxDescriptions：每次 3 个 overlay，1 个映射到 button.copy；raster buried under a wash or opacity 是 VitePress 代码复制 UI，layout property animation 是 detector banner/文档壳。未发现描述行、状态点或重试区域的可见组件命中。
- LxVirtualTree：每次 17 个 overlay，8 个可映射。映射包含 Demo 状态说明 P、label.virtual-tree-demo__strict、代码复制按钮和 span.lang；text occlusion 命中状态标签/代码高亮重叠，区分为 Demo 内容或文档代码壳；截图中的黄色标注本身会盖住目标文字，属于 overlay 视觉层，不把 overlay 自身遮挡算作产品缺陷；未把静态树窗口本身当成 detector 缺陷。
- 文档侧栏：每次 77 个 overlay，38 个可映射；aside.lx-sidebar.lx-sidebar--expanded、品牌环、激活条、lx-sidebar-item、分组和 footer network label 是实际侧栏组件命中。line length、low contrast text、layout-transition、buried-raster 和 copy 命中多属于说明文本、VitePress 壳或 detector UI。cyan/glow 规则需结合 LxSidebar HUD 设计依据判断，不能按命中数量直接判缺陷。

### 3.3 Banner 截获失败

首轮证据：browser/capture-browser.command.txt、browser/capture-browser.stdout.json、browser/capture-browser.stderr.txt、browser/capture-browser.exit-code.txt、browser/screenshots/。

- 四个目标首轮均 navigation=200、detector injection 成功、page errors=0，并保存 desktop-light。
- 物理 locator.click() 点击 VitePress button.VPSwitchAppearance 时，被 detector 自己注入的 .impeccable-overlay.impeccable-banner 拦截，Playwright 3000ms 后 timeout。首轮没有把暗色/HUD/窄屏当成通过。
- 最终重试使用 page 内 DOM click 完成状态切换，并在 JSON 记录 method=DOM click: Impeccable banner intercepted physical pointer input；这只证明状态 mutation 和截图成功，不声称物理鼠标可穿透 overlay。
- 浏览器 console 每页包含 detector startGroup，未发生 pageerror。Cascader 有一次无 URL 的资源 404；没有可归因 URL，因此未把 404 归因到组件。

VirtualTree 键盘定向采集：

- 命令：browser/capture-browser-recheck-4-virtualtree.command.txt
- stdout：browser/capture-browser-recheck-4-virtualtree.stdout.json
- stderr：browser/capture-browser-recheck-4-virtualtree.stderr.txt
- exit：browser/capture-browser-recheck-4-virtualtree.exit-code.txt，值为 0
- 结果包含 desktop-light、desktop-dark、desktop-hud、空/加载/失败、keyboard-tree、mobile-375；keyboard-tree 截图和 overlay 位于 browser/screenshots/recheck-4-virtualtree/ 与 browser/overlay/recheck-4-virtualtree/。

## 4. 服务生命周期

为注入 detect.js，本 Assessment B 临时启动了 Impeccable live-server 8400：

- 启动 JSON：browser/live-server-start.stdout.json，pid=25784、port=8400
- 启动命令/退出码：browser/live-server-start.command.txt、browser/live-server-start.exit-code.txt，退出码 0
- 已停止：browser/live-server-stop.stdout.txt 显示 Stopped live server on port 8400.
- 停止命令/退出码：browser/live-server-stop.command.txt、browser/live-server-stop.exit-code.txt，退出码 0
- stop stderr 只报告仓库没有 live inject config，删除注入标签跳过；8400 服务本身已停止。4175 由主 Agent 管理，本任务没有启动、停止或重启。
- 为 VirtualTree keyboard-tree 定向 recheck-4，8400 之后短暂重启一次；重启和停止证据分别为 browser/live-server-restart-virtualtree.* 与 browser/live-server-stop-recheck-4.*，两次退出码均为 0，最终仍已停止。

## 5. 未覆盖和限制

- 浏览器只检查 4175 VitePress 页面，没有真实后端请求或真实上传/权限联调。
- LxCascader popup 初始保持隐藏；对隐藏 el-popper 的 detector 命中已记录为隐藏 DOM/文档壳误报，没有写成可见白色弹层缺陷。
- 物理鼠标被 detector banner 截获；最终状态切换用 page 内 DOM click，并保留失败证据，不能替代无 overlay 的人工鼠标验收。
- prefers-reduced-motion 未由本次 B 脚本单独切换；源码/文档声明了降级规则，实际浏览器证据留给独立 E2E。
- 本目录只保存 Assessment B 证据，没有写入正式 Critique snapshot 或修改计划台账。
