Method: isolated Assessment A (independent design review; fresh Playwright Chromium browser, new context/page per scenario; Assessment B and detector output excluded).

# LxTransferPanel Assessment A: Final Revision

评审日期：2026-10-08  
目标：`http://127.0.0.1:4174/components/lxtransferpanel`  
模式：Operate，管理台权限与组织选择组件

## 采证范围

以 VitePress 预览的 HTTP 200 页面为准。使用 Playwright 1.58、Chromium 153.0.8010.12 和全新 browser/context/page，分别检查桌面亮色、VitePress 全站暗色、独立 HUD 暗色、两种暗色同时启用、375px 与 320px 视口、加载/失败/空树、树键盘操作、危险确认的 Escape 取消与撤销、未加载项确认取消。完成 15 个截图和 16 个 DOM/交互断言；断言全通过，页面异常 0 个。评审未运行 detector，也未读取 Assessment B。

样例中的加载、错误与空树由本地内存数据控制，没有真实后端读写。未覆盖真实读屏器、真实浏览器缩放手势或后端联调。首轮空态断言误查了右侧列表空态选择器；结合 DOM 与 `desktop-empty.png` 确认左树真实空态为 `.lx-virtual-tree__empty` 且文案“暂无数据”。修正采证查询后该项通过，属于测试指标误差，不影响页面验收。

缩放补充：Chromium headless 的 `Ctrl+Equal` 未改变 device scale 或布局视口；报告不把 DPR=4 称为 400% 浏览器缩放。`viewport-320-dpr4-dark.png` 只记录 320 CSS px 布局视口、DPR=4 的放大代理检查，作为额外文字/配置区检查；准确的响应式验收证据是 DPR=1 的 375px 和 320px 视口。

本次截图目录：`.impeccable/critique/wave7-transferpanel-2026-10-07/final-assessment-a-postfix-2026-10-08/`。浏览器采集脚本和机器可读结果分别为 `capture-assessment-a.mjs` 与 `capture-evidence.json`。采集期间十项源码文件 SHA-256 前后完全一致：

| 文件 | SHA-256 |
|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `18DAFD31EB3FDC0D123F544D27424C34EAA5C60C48EF3283843B92B079637901` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `E9081F8E77306A2C282FA159213A30CE3F725FD3B307ED91D508C6FE61878240` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `E36B50875832C374FF98C0366493F6FC26AD1CBF6ABDFD056E863B155C2386B4` |
| `linkx-fe/src/components/LxConfirm/index.ts` | `54B8496B99DC35679625A29D74C3C1D1D3216D410AE97A099446D185ABE01A80` |
| `linkx-fe/src/components/LxConfirm/style.css` | `6DE908AED57E417500054658AC93D7FE9D5A777BD97E461F40707592777052E0` |
| `linkx-fe/src/tokens/variables.css` | `7CF5BF056DED0FD77F72EB1E3007E4A439FC712C06DF8D3A1D53053924365F96` |
| `linkx-fe/src/tokens/theme-hud.css` | `E462708E9DD12BDEC167081EAB5A38848DDDBD991306B0E34987DE4174F796AA` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `4E0956E739E6F93DDB5BB400F20A07FEBB637AAA2D09EED7DA1D7C63CA238545` |
| `linkx-fe/docs/.vitepress/theme/custom.css` | `C1918DF03648C6414B283638C940D61FB658D0A9FDDFBCE6420C942671F3430D` |

## 15 个浏览器场景

| 场景 | 结果 | 截图依据 |
|---|---|---|
| 桌面亮色 1440px | 面板白底，默认 5 项选择正常 | `desktop-light.png` |
| VitePress 全站暗色 1440px | 面板 `rgb(22, 22, 24)`、文字变亮，旧的白色断层已消失 | `desktop-global-dark.png` |
| 局部 HUD 暗色 1440px | HUD 面板 `rgb(16, 26, 44)`，全站仍是亮色 | `desktop-hud-dark.png` |
| 全站暗色 + HUD 暗色 | HUD 局部主题正确优先显示，未见主题残缺 | `desktop-global-and-hud-dark.png` |
| 375px 亮色 | 页面无横向溢出，穿梭按钮为 44×44px | `mobile-375-light.png`、`mobile-375-light-demo.png` |
| 375px 全站暗色 | 页面无横向溢出，暗色令牌跟随全站主题 | `mobile-375-global-dark.png`、`mobile-375-global-dark-demo.png` |
| 320px 亮色 | 页面宽度等于视口，配置文字未裁切 | `viewport-320-light.png`、`viewport-320-light-demo.png` |
| 320px 全站暗色 | 页面宽度等于视口，配置文字未裁切，暗色面板保持一致 | `viewport-320-global-dark.png`、`viewport-320-global-dark-demo.png` |
| 320px / DPR4 暗色代理 | 页面无横向溢出、配置文字未裁切；这是缩放代理，不是实际缩放手势 | `viewport-320-dpr4-dark.png`、`viewport-320-dpr4-dark-demo.png` |
| 加载中 | `aria-busy=true`、面板 inert，已有选择仍为 5 项 | `desktop-loading.png` |
| 加载失败 | 错误提示含“重试”，面板锁定且已有选择仍为 5 项 | `desktop-error.png` |
| 空树 | 树行 0、显示“暂无数据”，已选列表保持 5 项 | `desktop-empty.png` |
| 键盘树操作 | ArrowDown 移到下一行；Space 将选择数 5→4，Enter 恢复至 5 | `desktop-keyboard-tree.png` |
| 全部清空确认 | Escape 取消后保持 5；确认变 0；撤销恢复 5 | `desktop-clear-confirm.png` |
| 未加载授权移除确认 | 对“历史授权单位（记录中）”按 Escape 后仍保留 5 项 | `desktop-unloaded-remove-confirm.png` |

## Design Health Score

| # | Nielsen 启发式 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | 计数、加载、错误、空树和撤销反馈可见；一般勾选反馈主要依赖计数。 |
| 2 | 系统与现实匹配 | 3 | 组织层级、业务编码、状态和未加载历史权限贴合管理台；继承授权的范围含义未定义。 |
| 3 | 用户控制与自由 | 4 | 移除/清空可取消，Escape 可退出确认；清空后可撤销，筛选可单独清除并恢复焦点。 |
| 4 | 一致性与标准 | 3 | 全站暗色、HUD 与组合状态均协调；危险标题/图标与蓝色确认按钮语义不一致。 |
| 5 | 错误预防 | 4 | 禁用节点、选择上限、未加载项确认及清空前值快照防止误改。 |
| 6 | 识别而非记忆 | 3 | 名称、编码、状态和未加载标记可直接核对；继承含义没有就地帮助。 |
| 7 | 灵活与效率 | 4 | 搜索匹配批量操作、反选、全量操作、虚拟树及方向键操作覆盖大列表效率。 |
| 8 | 美观与简约 | 3 | 桌面栏位清楚，颜色状态易读；权限码/状态/说明多层并列，窄屏单栏需滚动较长。 |
| 9 | 错误识别、诊断与恢复 | 4 | 错误态保留 5 项选择并提供重试；清空撤销、取消未加载项移除均实测恢复。 |
| 10 | 帮助与文档 | 3 | 同页有 Props、事件、选择规则及宿主持久化示例；业务权限语义仍由宿主补充。 |
| **总分** |  | **34/40** | **Good** |

## 设计特异性

中等偏强。界面沿用常见双栏穿梭和虚拟树布局，但组织节点、稳定业务编码、状态、禁用归档项与未加载既有授权共同表达了具体权限维护任务。主题映射现在与 VitePress 全站主题协调；本次 1440px 与 375px 都实测通过全站暗色预览，HUD 局部主题也能独立工作。

## 整体印象

这是一个操作边界覆盖完整的权限选择面板。之前最明显的视觉断层“全站暗色、示例白底”已经修好：全站暗色下 demo 面板为 `rgb(22, 22, 24)`、文字为 `rgb(223, 223, 214)`；HUD 单独启用时面板为 `rgb(16, 26, 44)`。375px 与 320px 下页面宽度分别严格等于视口宽度，穿梭按钮维持 44×44px。剩余优先改进聚焦在危险语义、继承权限解释和禁用原因的位置。

## 认知负荷

8 项认知负荷清单有 2 项失败，整体为中等负荷：

- **分组容量失败**：每个可见树节点同时展示名称、复选框、编码、状态和层级；虽然信息服务核对权限，但多种标签挤在同一行。
- **最少选择失败**：管理端视口内可同时看见多个可选节点；选择人须并行比较名称、编码、状态。虚拟滚动、树层级和搜索有助缩小范围，但并未把一次决策限制在 4 项以内。
- 单一焦点、相关分组、视觉层级、单步决策、工作记忆和渐进披露均通过。移动端视口按上下顺序排列，操作区保持在两面板之间；需要纵向滚动，但不会横向溢出。

## 情感旅程

用户从“待选/已选”两栏建立方向感，编码与状态支持确认目标。发现历史未加载权限时，确认框会列出旧名称和键值；取消后数量保持 5。清空时确认文案说明存在未加载节点，Escape 可退出，确认后还能撤销到 5 项。加载失败会暂时降低面板透明度，但保留现有选择并给出重试入口。高影响操作的视觉弱点在于确认按钮仍是蓝色主按钮，未延续红色危险图标和标题。

## 做得好的地方

1. **主题修复关闭旧 P1。** 测试了 VitePress 全站暗色、HUD 深色及组合主题；示例和面板分别采用对应的深色 surface/text token，没有再出现亮白面板。证据：`desktop-global-dark.png`、`desktop-hud-dark.png`、`desktop-global-and-hud-dark.png`、`mobile-375-global-dark-demo.png`。
2. **受控高风险动作可退出和恢复。** 清空确认可 Escape 取消；确认后显示撤销，撤销恢复原先 5 项；未加载项移除取消也保留 5 项。证据：`desktop-clear-confirm.png`、`desktop-unloaded-remove-confirm.png`。
3. **窄屏与异常状态保留任务上下文。** 375px/320px 页面无横向溢出，按钮为 44×44px；加载及失败态仍保留 5 项，错误可重试；树为空时明确显示“暂无数据”，右侧既有选择仍存在。证据：`mobile-375-light-demo.png`、`viewport-320-global-dark-demo.png`、`desktop-loading.png`、`desktop-error.png`、`desktop-empty.png`。

## 优先问题

### [P2] 危险确认主按钮仍为蓝色

清空与未加载项移除弹窗使用红色危险图标和深红标题，但主确认按钮实际背景为 `rgb(0, 96, 169)`。这与本库确认框约定的危险态红底主按钮不符，也弱化了授权清空/移除的严重程度。让 `lxConfirm` 的 danger 按钮类应用对应危险令牌，并在亮色/HUD 两主题回归。证据：`desktop-clear-confirm.png`、`desktop-unloaded-remove-confirm.png`。建议命令：`/impeccable polish`。

### [P2] “保留下级继承授权”缺少范围解释

控件目前只有复选框标签，没有就地解释会让哪些下级对象继承权限、何时生效或是否扩大范围。组件文档明确说明语义由宿主定义，对通用组件合理；但实际权限接入者需要可访问的具体提示，才能放心选择。由宿主提供一句业务准确的说明，关联 `aria-describedby`。证据：`desktop-light.png`、`mobile-375-light-demo.png`。建议命令：`/impeccable clarify`。

### [P2] 选择上限提示离被禁用的按钮较远

“已达到选择上限 5 项，不能继续加入待选节点”位于左面板底部，中间“全部加入”按钮只在 title/`aria-describedby` 提供原因。鼠标和触屏用户不一定能发现关联提示，尤其触屏没有悬停；原因在空间上也与操作隔开。把简短提示挪到穿梭操作附近，保留完整的辅助描述。证据：`desktop-light.png`、`viewport-320-light-demo.png`。建议命令：`/impeccable clarify`。

## Persona 红旗

- **Alex（管理台熟练用户）**：搜索、反选、全量操作与方向键支持高效操作；未发现跨树多选快捷操作，快速操作大量节点仍需要逐项或先筛选。
- **Sam（键盘/屏幕阅读器用户）**：方向键进入下一树行，Space 取消选中、Enter 恢复，计数从 5 → 4 → 5；搜索清理可返回输入焦点。没有使用真实屏幕阅读器验证语音顺序，建议在宿主集成级补一次读屏验收。
- **Jordan（首次使用者）**：未加载旧授权会标识“节点未加载”并可查看原键；但“保留下级继承授权”的业务影响仍需猜测，可能无法判断权限范围是否扩大。

## 次要观察

- 文档页强调 1,420 节点；虚拟树截图实际仅渲染 21 个行节点，实测滚动与行数据工作正常。
- 确认框文案对清空动作解释了未知节点，但控件默认文案不完全等同实际权限名称；标题与按钮文本总体足以识别具体动作。
- 320px 与 375px 下配置控件换行完整，检测的配置文字无水平或垂直裁切。DPR4 代理状态不是浏览器缩放实测。
- 首轮空态选择器误差已修正；最终证据文件中的空态断言通过，不是产品缺陷。

## 建议下一步

优先统一危险确认按钮的危险语义，再由具体权限宿主补充继承说明，并让选择上限原因贴近操作按钮。全站暗色与移动端主题断层问题可关闭。

Questions skipped: 0 open design decisions; requested deliverable was an isolated Assessment A report for the parent synthesis.
