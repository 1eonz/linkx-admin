Method: 独立 Assessment A 修后复验；使用全新 Edge/Playwright context，仅读取 4174 现场页面，没有运行 detector，也没有查看或引用其他评估产物。

# LxIcon 修后复验

目标：`http://127.0.0.1:4174/components/lxicons.html`  
视口：1440×1000、375×812、320×800。未修改项目代码。

## 版本证据

当前现场页呈现了修后布局：375px 初始视口中“P0 高频核心”已展开，包含 13 张卡片，其中 4 张图标卡片进入首屏；“设计清单覆盖”现在是一个含 4 个术语/定义项的 `<dl>`。全页另有一张兼容别名表。现场 DOM、首屏截图和 320/375px 清单截图均来自本次新建的浏览器 context。

## 原三项 P2

| 检查项 | 结果 | 现场证据 |
|---|---|---|
| 首屏能看到 P0 图标 | **通过** | P0 组默认展开，375×812 首屏有 4 张图标卡片；第一张为“删除 / delete”。见 `mobile-375-light.png` 和 `browser-evidence.json` 的 `checks.mobile375Light.p0`。 |
| 复制反馈避开手机顶栏 | **通过（视觉）** | 成功提示显示在搜索框下方；失败提示与恢复区也位于正文中，没有覆盖品牌或移动菜单。见 `mobile-375-copy-success.png`、`mobile-375-copy-failure.png`。现场没有 `[role="alert"]` 节点，因此未确认读屏器会播报复制结果。 |
| 复制失败后的恢复清楚 | **通过** | 失败后说明代码已就绪，恢复提示要求手动复制；只读文本框获得焦点且 33 个字符全部选中。失败状态显示两段红色说明，第二段重复手动复制指引，视觉上略重复但不影响恢复。 |
| 320/375px 清单定义列表可读 | **通过** | 四项清单定义和名称列表按行换行；两种宽度下定义列表 `scrollWidth` 等于 `clientWidth`，页面无横向溢出。见 `mobile-320-checklist-definition-list.png`、`mobile-375-checklist-definition-list.png`，以及 JSON 的 `checks.mobile320Light.checklist`、`checks.mobile375Light.checklist`。 |

## 回归检查

| 检查项 | 结果 | 现场证据 |
|---|---|---|
| 键盘导航与复制 | **通过** | 初始 Tab 从 Skip to content 开始；清除筛选按钮可用 Enter 激活并把焦点还给输入框；图标卡片有可见焦点，Enter 可复制 `<LxIcon name="dashboard" :size="20" />`。见 `checks.keyboard`。 |
| 深浅主题 | **通过** | 桌面主题开关可切换浅/深色，375px 下两种主题均可渲染。见 `desktop-1440-dark.png`、`mobile-375-dark.png`、`mobile-375-light.png`。 |
| 空态 | **通过（DOM 语义）** | 搜索前后均有常驻的 `.icon-search-status[role="status"][aria-live="polite"][aria-atomic="true"]`；无匹配后状态文本变为“无匹配图标”。可见重复文案节点带 `aria-hidden="true"`。真实读屏器播报未验证。见 `live-status-clarification.json`。 |
| 减少动效 | **通过** | `prefers-reduced-motion: reduce` 生效；分类展开后箭头朝上，折叠/展开图标方向正确，过渡时长约为零。见 `mobile-375-reduced-motion-expanded.png` 与 `checks.reducedMotion`。 |
| 页面异常 | **通过** | 本次浏览器 context 未记录 `pageerror`。 |

## 未验证边界

复制失败由隔离页拒绝 `navigator.clipboard.writeText` 模拟；没有触发浏览器或操作系统原生权限弹窗。没有使用真实读屏器，也没有覆盖 Safari 或 Firefox。live region 的 DOM 属性和文本更新已确认；真实辅助技术播报仍未验证。

## 证据索引

- 原始结构化证据：`browser-evidence.json`
- 桌面主题：`desktop-1440-light.png`、`desktop-1440-light-top.png`、`desktop-1440-dark.png`
- 手机首屏和主题：`mobile-375-light.png`、`mobile-375-dark.png`、`mobile-320-light.png`
- 复制与空态：`mobile-375-copy-success.png`、`mobile-375-copy-failure.png`、`mobile-375-search-empty.png`
- 定义列表与动效：`mobile-320-checklist-definition-list.png`、`mobile-375-checklist-definition-list.png`、`mobile-375-reduced-motion-expanded.png`

## 空态语义澄清

**源码证据：** [lxicons.md](/F:/work/linkx-admin/linkx-fe/docs/components/lxicons.md:349) 将 `.icon-search-status` 常驻挂载，并设置 `role="status"`、`aria-live="polite"`、`aria-atomic="true"`；其文本随匹配数在空字符串与“无匹配图标”间切换。[可见空态副本](/F:/work/linkx-admin/linkx-fe/docs/components/lxicons.md:352) 带 `aria-hidden="true"`。

**E2E 断言证据：** [lx-icon-docs.spec.ts](/F:/work/linkx-admin/other-admin/admin-vue3/tests/e2e/lx-icon-docs.spec.ts:54) 断言 status 节点附着且初始文本为空；无匹配时还断言状态文本、可见副本的 `aria-hidden="true"`、`role="status"` 与 `aria-live="polite"`。该测试没有断言 `aria-atomic`，且本次未执行 E2E。

**浏览器证据：** 新建的 Edge context 中，搜索前 status 节点已存在且文本为空；搜索无匹配项后仍是同一类常驻节点，文本为“无匹配图标”，属性与源码一致。可见副本确为 `aria-hidden="true"`，由专用 live region 承担播报；真实屏幕阅读器是否按预期播报尚未验证。前后快照见 `live-status-clarification.json`。

原回归表中关于空态缺少 live region 的判断已更正为通过。对应状态前后快照见 `live-status-clarification.json`。
