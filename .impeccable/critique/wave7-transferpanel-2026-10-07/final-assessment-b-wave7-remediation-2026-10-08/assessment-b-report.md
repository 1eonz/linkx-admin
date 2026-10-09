# LxTransferPanel Assessment B 取证报告

## 结论

**Assessment B 未通过正式浏览器门槛。** Puppeteer 与 Puppeteer Core 在工作区 Node 模块解析中均缺失。`@playwright/test` 包路径存在，但本轮没有运行测试，也没有将其他自动化方式记作 Puppeteer 通过。独立 Chromium/CDP 的实际浏览器记录仅作为补充证据；页面截图与 overlay 注入结果均如实归档。

## 目标与完整性

- 源码扫描目标：`linkx-fe/src/components/LxTransferPanel/index.vue`
- 浏览器目标：`http://127.0.0.1:4174/components/lxtransferpanel`，HTTP HEAD 返回 200。
- 开始和结束 SHA256 记录分别见 `sha256-start.txt` 与 `sha256-end.txt`。七个指定文件的开始、结束值均与任务给定值一致；本轮没有修改目标源码。

## 源码静态扫描

执行 `node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json linkx-fe/src/components/LxTransferPanel/index.vue`。原始 stdout 是 `[]`（3 字节，含换行），stderr 为空（0 字节），退出码为 `0`。因此源码目标静态扫描为零命中，没有规则名或源码位置。stdout、stderr、exit 与元数据分别保存在本目录；该结果不代表浏览器视觉检查通过。

## 浏览器补充证据

虽然 Puppeteer 不可用，系统 Chrome 可启动。本轮以独立 headless Chrome 进程、全新临时 profile 和 CDP 收集了五个视图；没有复用 4174 上的用户标签。DOM 可变性预检成功，每个视图都成功加载 `http://localhost:8400/detect.js`，保存了截图和完整 console 事件。该过程仅作补充，不改变本报告的未通过结论。

| 视图 | 结果 |
|---|---|
| 浅色桌面，1365×900 | overlay 注入成功；console 标题报告 15 条命中 |
| 375×812 短筛选 | 输入“站前路”，可见 1 个匹配项；注入成功，console 标题报告 6 条命中 |
| 375×812 清除筛选后恢复 | 筛选值清空，完整树恢复，滚动提示可见；注入成功，console 标题报告 6 条命中 |
| 375×812 滚至已选列表末尾 | `scrollTop=104`，滚动提示消失；注入成功，console 标题报告 5 条命中 |
| 375×812 HUD 深色 | 根节点具有 `dark lx-theme-hud`；注入成功，console 标题报告 45 条命中 |

375px 截图像素尺寸和浏览器 CSS 视口均为 375×812；页面 `documentElement.scrollWidth` 为 600，截图底部可见横向滚动条。这是实际页面级横向溢出证据；现有记录不足以确认它来自组件本身还是文档页其他内容，因此不归因为 LxTransferPanel。

## Overlay 命中核验

浏览器 console 的原始事件保存在 `browser-evidence.json`，位置以运行时 DOM 选择器记录：

- `text-occlusion` 命中组件滚动提示“向下滚动查看更多”：桌面报告被 `span.lx-transfer-panel__node-unloaded` 遮挡 31%；窄屏报告与 `span.lx-transfer-panel__selected-name.is-unloaded` 重叠 50%。这是组件区域的真实候选问题，截图同时保留了提示、未加载项和 overlay 标注，应优先由后续评审检查。
- `ai-color-palette` 只在 HUD 深色视图显著增加，命中 `.lx-virtual-tree__row.is-checked`、`.lx-virtual-tree__checkbox`、`.lx-virtual-tree__node-icon`、`.lx-virtual-tree__label` 等真实组件节点，也命中通用 `button`、`span`。这些包括主题主色和状态色的令牌命中；规则命中数量不能直接当作同数量的设计缺陷。
- `clipped-overflow-container` 的目标是 `span.container`；`buried-raster` 命中文档代码复制按钮 `button.copy`；`line-length` 命中文档段落 `p` 和列表项 `li`；`edge-flush-cards` 命中文档属性表 `table`。这些位置属于 VitePress 文档外壳或文档内容，不是 TransferPanel 控件。
- `bounce-easing` 与 `layout-transition` 均报告在 `body`，属于页面全局样式范围；当前记录不能将其归因到 TransferPanel。
- 桌面 console 另有一条未提供 URL 的通用 404 资源错误，来源未确定。

移动端 console 标题计数和逐条规则消息数量存在不一致：筛选/恢复视图标题为 6，滚到底部视图标题为 5，但捕获到的逐条规则消息分别为 7、7、6 条。原始事件未改写并已保存；报告不把两种计数强行合并。桌面标题 15 与逐条消息一致。

## 清理与限制

- 浏览器资料由独立临时 profile 提供；Chrome PID 24248 已退出。
- 本轮启动的 Impeccable live-server 已通过记录的 `stop --keep-inject` 命令停止；复核时 8400 端口监听数为 0。
- 按任务要求未运行测试或格式化。
- `browser-evidence-first-attempt.json` 保留了首次恢复交互因 Vue 条件按钮尚未渲染而失败的记录；最终五视图结果在 `browser-evidence.json`。
