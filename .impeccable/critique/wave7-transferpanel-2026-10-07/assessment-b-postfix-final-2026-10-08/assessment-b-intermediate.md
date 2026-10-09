# Assessment B：Wave 7 修后中间版

**状态：代码复审 P3 修复前的中间源码快照，不是最终验收，也不能标记 Critique 通过。** 六个目标文件在 detector 扫描前冻结哈希，浏览器结束后哈希全部一致。此轮独立重新运行 detector 并创建 8 个新浏览器页签；没有把修复前 Assessment B 的结果当作本轮结论。最终源码统一冻结后仍需重新执行隔离的 Assessment A/B，并综合评审。

## 静态 detector

每个 markup target 分别运行 Impeccable detector。命令、原始 JSON stdout、stderr 和退出码逐目标保存；六项均为 `[]`、stderr 空、exit 0。

| Target | Result | Exit |
| --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 0 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | 0 |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]` | 0 |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `[]` | 0 |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | `[]` | 0 |
| `linkx-fe/docs/components/lxvirtualtree.md` | `[]` | 0 |

这只表示六个文件未命中 detector 的静态规则，不表示运行页面无问题。

## 浏览器与交互

使用 Edge `Edg/154.0.4258.53` 的 headless Chromium/CDP。每页在新建页签中打开，DOM 变更预检成功；TransferPanel 的桌面浅色、暗色、HUD、loading、375px 空态和 320px 错误态，以及 VirtualTree 文档和 Demo 共 8/8 页成功注入 overlay。最终 capture exit 0、脚本错误数组为空。

| View | Overlay console | 观测 |
| --- | ---: | --- |
| TransferPanel 1280px light | 19 | 正常数据、空闲操作可见；组件 705px 宽，自身无横向溢出。 |
| TransferPanel 1280px dark | 209 | 暗色页面正常渲染；组件宽度与 scrollWidth 相等。 |
| TransferPanel 1280px HUD | 242 | HUD 主题生效；组件宽度与 scrollWidth 相等。 |
| TransferPanel 1280px loading | 19 | 宿主提示为 `role=status`，`aria-busy=true`，组件设为 inert；当前 4 项保留。 |
| TransferPanel 375px empty | 5 | 空树显示“暂无数据”；恢复数据后可继续操作。 |
| TransferPanel 320px error | 5 | 错误提示为 `role=alert`，组件 inert；当前选择仍为 4 项，重试恢复可用。 |
| VirtualTree 文档 1280px | 7 | 文档标题及树渲染正确，注入成功。 |
| VirtualTree Demo 1280px | 7 | loading/error/empty、编码筛选、键盘和 HUD 主题操作均完成。 |

以上 console 数值是该页 overlay 的报告数，不能跨页相加成缺陷总数；暗色/HUD 会使颜色规则对多个文本或控件重复命中。

- `DEPT-03` 搜索得到 1 个实际树节点；DOM 另有 1 个已选清单回显，所以 selector 共匹配 2 处。状态文案报告筛选结果共 1 项，并保留机构祖先行。
- 整棵树反选前选择数为 4，第一次反选后为 3，再反选恢复为 4；未知既有键 `LEGACY-08` 保留，禁用节点仍禁用。
- 375px 与 320px 的树复选框触控区均为 44×44px、视觉框为 24×24px、展开按钮为 44×44px，触控区间隔 4px 且不重叠。两种视口都实测收起、展开和勾选成功。
- `unit-03` 焦点行从 375px 跨至 359px 再到 360px 均保留；对应行高分别为 64px、80px、64px。
- VirtualTree 按编码筛选命中 `region-2`；方向键从 `region-1` 移至 `unit-1-1`、再至 `unit-1-2`，空格后该行 `aria-checked=true`，键盘操作通过。
- VirtualTree loading 为 status，error 为 alert 且提供重试，empty 显示“暂无数据”。HUD 复核读到主题类已启用。
- reduced-motion 模拟生效；VirtualTree row/viewport 与 TransferPanel row/panel 的 transition duration 均为 `1e-05s`（0.01ms）。采样时全页 `getAnimations()` 仍分别返回 5 和 3 项，因此没有据此宣称整个文档无动画。

## Overlay 与剩余观察

静态 detector 零命中与运行时 overlay 是不同信号。逐页 console 与截图记录的主要规则如下：

- `line-length` 命中文档说明的 `p` / `li` 长文本；需结合阅读版式判断。
- `buried-raster` 命中 VitePress 代码块的 `button.copy`，属于文档站工具按钮。
- `edge-flush-cards` 命中 API Markdown `table`。
- `first-viewport-column-overflow` 命中 TransferPanel 文档中的 `section.lx-transfer-panel`，或 VirtualTree 文档的 `div.container`。浏览器测得组件本身宽度无溢出；该规则将长文档首屏高度归到所在内容区，仍应交由独立视觉评估判断。
- 窄屏 `clipped-overflow-container` 定位到 VitePress 外层 `span.container`。375px/320px 下 `.vp-doc` 分别为 312/336px 与 272/296px，即各有 24px 内容溢出；TransferPanel 自身 `clientWidth === scrollWidth`，`body` 没有横向溢出。`documentElement.scrollWidth` 分别为 600px 与 560px，且截图可见文档外壳横向滚动；该根宽度测量包含 overlay 页面的影响，不能当作组件溢出结论。
- `bounce-easing` 与 `layout-transition` 指向 VitePress `body` 全局样式；`ai-color-palette` 在暗色品牌文字及 HUD 青色控件/文本上重复命中。规则标签不是缺陷定论，尤其颜色命中需对照已登记主题令牌。

桌面 light-ready 页另有一次 HTTP 404 资源错误，当前 capture 没有记录到具体资源 URL，尚未定位；8 页均无未捕获 JavaScript exception。该项保留为未解析浏览器观察。

## 执行边界

- 本报告对应代码复审指出的 P3 修复前源码中间版；后续源码再变更会使本报告失去最终验收效力。
- 页面均通过本地文档 Demo 和本地内存数据验证，不是后端联调或真实权限验收。
- VitePress 使用 4184、Impeccable overlay 使用 8417、Edge CDP 使用 9347–9349。全部服务及浏览器已停止，临时 profile/root 已清理；本轮没有使用或停止 4174。
- detector 与浏览器原始证据、源文件哈希及截图索引见同目录 `evidence-index.md`。
