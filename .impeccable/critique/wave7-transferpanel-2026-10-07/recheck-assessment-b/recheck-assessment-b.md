# Wave 7 LxTransferPanel Assessment B 复验

## 复验边界

本次只执行 Impeccable Assessment B（detector 与浏览器证据），与 Assessment A 独立完成，未读取 Assessment A 的报告或结论，也没有修改产品源码。目标为：

- `linkx-fe/src/components/LxTransferPanel/index.vue`
- `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`
- `linkx-fe/docs/components/lxtransferpanel.md`

复验期间目标文件保持冻结；复验目录中的 `source-hashes.json` 记录了三份文件的 SHA-256。

## 运行记录

独立 VitePress 使用 `http://127.0.0.1:4187/components/lxtransferpanel`，独立 Impeccable overlay 使用 `http://127.0.0.1:8487/detect.js`。两项服务的 stdout、stderr、PID、停止命令和停止后端口检查均保存在本目录；复验结束时 `4187`、`8487` 均无监听进程。

第一次 CDP 尝试无效：Chrome 初始化目标仍是 `about:blank`，页面尚未渲染，`body` 与布局为空，退出码为 1。该次结果记录在 `browser-attempt-1-failed.md`，不计入任何结论。随后脚本改为显式导航并等待 `.lx-transfer-panel` 出现，第二次采集才作为有效浏览器证据。

## Detector 结果

运行命令：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxTransferPanel/index.vue linkx-fe/src/components/LxTransferPanel/demo/basic.vue linkx-fe/docs/components/lxtransferpanel.md
```

- `detector.stdout.json` 内容严格为 `[]`。
- `detector.stderr.txt` 为空（0 字节）。
- `detector.exitcode.txt` 为 `0`。
- 三个目标分别执行的 `detector-index-vue.*`、`detector-demo-basic-vue.*`、`detector-docs-lxtransferpanel-md.*` 也分别得到 `[]`、空 stderr、退出码 `0`。
- VitePress 目标路由 HTTP 状态为 `200`；有效浏览器会话最终地址为 `http://127.0.0.1:4187/components/lxtransferpanel`，且 `appReady: true`、真实 DOM 中存在 `.lx-transfer-panel`。

以上条件同时满足，因此本次 `[]` 是有效的静态零命中。它只表示三份源码目标没有命中 detector 的静态规则，不覆盖浏览器运行时 overlay 结果。

## 浏览器证据

有效会话通过独立 Chrome CDP tab 运行，页面标题预置为 `[Human] LxTransferPanel recheck B`。overlay 脚本加载 Promise 成功，页面生成 `impeccable-overlay` 节点，并在 console 输出 `[impeccable] 5 anti-patterns found`。采集没有页面异常（`pageErrors: 0`）。

overlay console 记录的标签如下：

- `line-length`：文档说明段落 `p`，约 86 字符。
- `cramped-padding`：实际组件使用的 `div.lx-virtual-tree__viewport`，树内容贴近上下边缘。
- `buried-raster`：文档代码复制按钮 `button.copy`。
- `edge-flush-cards`：文档 Props 表格 `table`。
- `bounce-easing`：文档页面 `body` 的 `cubic-bezier(.71, -.46, .29, 1.46)`。
- `layout-transition`：文档页面 `body` 的高度和 padding transition。

console 的组标题按 detector 自身口径写为 5 条，随后输出了上述 6 条标签记录。后四项属于 VitePress 文档外壳或其代码示例；`cramped-padding` 指向目标组件的虚拟树 viewport，应作为真实组件观察项保留。overlay 截图中的黄色标注可在 `desktop-light-overlay.png`、`mobile-375-light.png` 与状态截图中核对。

### 布局与主题

- Desktop light 的组件布局实际 computed track 为 `276.656px 110.672px 276.656px`，组件宽度 `688px`，与 `5:2:5` 结构一致；两侧面板高度均为 `380px`。
- HUD 深色主题截图 `desktop-hud.png` 已采集，深色背景、面板和状态色均随示例开关切换。
- 375px 视口实际 computed track 为单列 `312px`，行轨道为 `380px 56px 380px`；两侧面板均为 `312px × 380px`，未出现页面级横向溢出。

### 状态、键盘与减少动效

- `state-loading.png`：宿主状态文案为“宿主正在加载组织权限数据”，遮罩状态显示“组织权限数据加载中……”。
- `state-error.png`：状态文案为“组织权限数据加载失败，可重试”，错误提示保留当前选择并提供“重试”。
- `state-empty.png`：宿主返回空树，左树显示“暂无数据”，右侧原有已选键仍保留。
- 键盘路径先聚焦“筛选待选节点”，再发送 Tab；`focused: true`，焦点继续进入树节点（`市公安局指挥中心`），证据为 `keyboard-focus.png` 与 `browser-evidence.json`。
- `prefers-reduced-motion: reduce` 已模拟，`reducedMotion: true`，截图为 `reduced-motion.png`。页面无新增脚本异常。

### 移动交互与触控尺寸

375px 会话验证了以下真实点击路径：

- “全选”成功，已选从 2 项变为 5 项。
- 右侧状态文案筛选输入“正常”，命中 2 个已选项；“清除已选项筛选”存在且尺寸 `44 × 44`，清除后输入为空。
- “反选”成功，已选回到 1 项。
- “全部移除”成功，已选变为 0 项。
- 左侧筛选输入“情指行”命中“情指行一体化研判调度专班”；“清除待选节点筛选”存在且尺寸 `44 × 44`，清除后输入为空。
- 移动端“全选/反选/清空”按钮高度均为 `44px`；中间“全部加入/全部移除”以及筛选清除按钮均为 `44 × 44`。截图为 `mobile-375-interactions.png`，细节尺寸在 `browser-evidence.json` 的 `mobileActions` 中。

### 外部请求与页面错误

共记录 6 个非 localhost 请求，全部是组件图标使用的 `data:image/svg+xml`，没有 HTTP(S) 外部请求。`external-requests-summary.json` 记录了 `httpExternal: 0`。页面错误数量为 0；完整请求、console 与异常事件保存在 `browser-evidence.json`。

## 结论

静态 detector 复验通过：三份目标均可访问、stdout 为有效 `[]`、stderr 为空且退出码为 0。浏览器复验通过真实页面渲染、独立 overlay 注入、desktop light/HUD、375px、loading/error/empty、键盘、减少动效、实际 grid tracks、移动批量选择与筛选清除路径；运行时 overlay 仍提示虚拟树 viewport 的贴边内容，以及文档外壳相关规则。第一次空白 `about:blank` 采集已明确标记失败并排除。
