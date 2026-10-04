⚠️ DEGRADED: single-context (Assessment B had no reliable overlay injection; Playwright fallback unavailable)

# Assessment B：LxTreeSelect 与 LxCascader

范围：`linkx-fe/src/components/LxTreeSelect/`、`linkx-fe/src/components/LxCascader/`（含 Demo），以及 `linkx-fe/docs/components/lxtreeselect.md`、`linkx-fe/docs/components/lxcascader.md` 和本地 VitePress 页面。此文件只记录 Assessment B 的 detector 与浏览器证据；没有读取 Assessment A 或旧 wave6 报告。Assessment A/B 由独立 agent 执行，但本轮 B 的浏览器 overlay 与截图落盘能力受限，因此按降级检查记录。

## 静态 Detector

实际命令：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxTreeSelect linkx-fe/src/components/LxCascader linkx-fe/docs/components/lxtreeselect.md linkx-fe/docs/components/lxcascader.md
```

原始证据分别保存在本目录的 `detector.stdout.json`、`detector.stderr.log`、`detector.exit-code.txt`：

```text
stdout JSON: []
stderr:      (空，0 bytes)
exit code:   0
```

这仅表示 detector 对本次输入没有产生静态规则命中；`[]` 不代表视觉验收通过，也不证明运行时没有问题。Detector 没有给出额外命中，因此没有可判定的 detector false positive。

## 浏览器环境与注入

- CUA 可用。全新 TreeSelect 与 Cascader 标签页均成功打开 `http://127.0.0.1:4179/components/lxtreeselect` 和 `/components/lxcascader`；VitePress 初始进程在两页之间退出，首次 Cascader 导航得到 `net::ERR_CONNECTION_REFUSED`。随后在隔离端口 4179 启动本轮 VitePress，Cascader 页面正常加载。
- 桌面观察使用 1280×800 视口；另将 TreeSelect 页面设为 375×844。CUA 返回了页面截图及 AX 树，但该接口不提供把截图字节写入工作区的能力，因此报告保存可复核的视图/交互记录，未生成 PNG 文件。
- 按规范进行注入预检时，浏览器拒绝 `javascript:` URL（安全策略不允许的协议）。依照该策略没有尝试间接脚本执行，也没有访问 `http://localhost:<live-port>/detect.js`。因此页面里没有运行 detector overlay，console 中也没有可报告的 overlay 命中；不能声称用户看到 overlay。Playwright/Puppeteer 本地依赖未安装，本轮没有使用隔离 Playwright 替代。
- Demo 文档说明数据和加载状态由浏览器内存中的本地演示逻辑提供，没有业务 API 调用。浏览器工具未提供 network request interception/log，故没有可核验的外部请求逐条清单；不能把“未观察到”表述成网络层证明的零请求。

## TreeSelect 浏览器观察

| 项目 | 结果 |
| --- | --- |
| 亮色桌面 | 页面和控件正常显示；默认值“滨江分局”可见。 |
| HUD 深色 | Demo 的 HUD 深色复选项生效；截图可见深色文档外壳、控件与文本。 |
| 375px | 主控件铺满可用宽度；下拉弹层收在视口内，节点行高约 44px，内容可读。文档代码块有自身横向滚动条。 |
| 单选/键盘打开 | 默认单选态可见；控件聚焦后按 ArrowDown 展开树，树节点通过 AX 暴露为行。单选节点即时提交的选择动作未单独完成。 |
| 多选确认 | 切换多选后先有 `bj-1`；勾选 `gx-1` 后 footer 变为“已选 2 项”，点击确认后受控值为 `["bj-1","gx-1"]`。 |
| 多选取消/Escape | 重新打开并增加草稿节点后点击取消，原值保留；打开空目录弹层后按 Escape，弹层关闭。恢复目录后再按 Escape 也观察到关闭。 |
| 空态 | 切换“查看空目录”后展开弹层，出现“暂无数据”。 |
| 错误与重试 | 页面显示红色错误文案和“重试”；点击后错误消失、重试计数增至 1。 |
| 加载 | “模拟加载”按钮可触发短暂状态，但在 CUA 截图/AX 采集时该 1.4 秒过渡已结束，未取得可确认的 loading 画面。 |
| 禁用 | 弹层中的“离线专网（禁用）”节点在 AX 中为 disabled，视觉上灰显。 |
| 减少动效 | 本轮没有浏览器级 `prefers-reduced-motion` 模拟。源码规则同时包含 `.lx-tree-select__popper` 与其后代选择器，能覆盖 teleport 弹层；未做运行时动效复验。 |

## Cascader 浏览器观察

| 项目 | 结果 |
| --- | --- |
| 亮色桌面 | 文档页正常加载；默认路径回显为“杭州市公安局 / 西湖区分局 / 情指中心”。 |
| HUD/暗色 | 此 Demo 没有 HUD 控制；本轮只观察亮色页面，未切换 VitePress 全局主题。 |
| 375px | 未完成移动视口观察。 |
| 单选 | 点击已回显字段展开三列级联面板，根、分局和末级节点可见，当前节点有选中标记。 |
| 多选 | 切换多选后值回显两条路径；展开并选择“情指中心”后，演示受控值显示为该路径。未对两个路径的逐项取消语义作进一步验证。 |
| 加载 | 未在浏览器中切换加载态。 |
| 错误/重试 | 未在浏览器中切换失败态或点击重试。 |
| 禁用 | 文档内有禁用状态按钮及禁用节点；本轮未切换按钮实测。 |
| 过滤 | 在筛选输入中追加“巡防”后出现“暂无数据”；输入原先含有完整已选路径文本，所以该动作没有验证到期望的“巡防大队”匹配结果。 |
| 清空 | 控件可见清除图标，但未实际激活清空操作。 |
| Escape | 打开级联面板后按 Escape，面板收起，输入仍保留。 |
| 44px 行高/弹层宽度 | 文档声明 375px 下 44px 行高与视口内弹层；本轮未在浏览器里核验。源码 CSS 对窄屏设置 44px，并将弹层最大宽度限于视口，但不替代浏览器实测。 |
| 减少动效 | 未作浏览器级模拟。源码的 reduce 规则选择 `.lx-cascader` 及其后代，没有包括 `popperClass` 使用的 `.lx-cascader__popper`。Element Plus Cascader 弹层经 teleport 渲染在触发器根节点之外，因此这条规则不会匹配弹层后代；这是静态源码观察，尚无浏览器动效截图佐证。 |

## 限制与服务清理

- 无 overlay 结果：注入预检在浏览器安全策略处被拒；detector CLI 的 `[]` 不可代替 overlay。
- 无独立截图文件及 network interception 记录：CUA 返回的截图留在工具观察中，未写成 PNG；CUA 没有请求日志接口。未安装隔离 Playwright，未绕过浏览器策略补做。
- 覆盖不完整：Cascader 375px、加载、错误重试、禁用、有效过滤命中、清空、44px 触控行高及弹层宽度未完成浏览器实测。TreeSelect loading 画面未捕获。以上均不能标成通过。
- 临时预览服务由本轮启动，VitePress PID 记在 `vitepress.pid.txt`（34748）；已停止该进程，复核时 4179 无监听记录。
