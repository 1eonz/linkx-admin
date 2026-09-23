# LxUI 图标集设计需求（ICON-DESIGN）

> 版本：v1.0 | 日期：2026-09-22 | 读者：**设计师（主要）** + 前端
> 依据：Vue2 老工程（功能最全）358 处 `el-icon-` 实际使用调研 + lx-ui 现有 26 枚图标现状
> 姊妹文档：`DESIGN-SPEC.md` §6（图标规范约束）

---

## 0. 设计规范约束（所有图标必须遵守，继承 DESIGN-SPEC §6）

| 项 | 规格 |
|---|---|
| 画布 | 24 × 24 |
| 笔触 | stroke 1.5、round cap / round join（线性风格，不用填充面） |
| 颜色 | `currentColor` 单色（继承文字色，禁多色） |
| 展示尺寸 | 16 / 18 / 20px 三档（默认 18） |
| 风格 | 几何简化、公共安全语境（对齐现有 26 枚：dashboard/team/bell/...） |
| 命名 | kebab-case 英文语义名（参考下表清单） |

**现有 26 枚底子**：侧边栏 12（dashboard/team/bell/calendar/setting/shield/cube/server/key/map-pin/camera/alert）+ 交互 10（chevron-down/right/left、chevrons-left、check、search、x、menu、user、pulse）+ 反馈 4（circle-check/circle-x/circle-alert/report）

---

## 1. P0 — 项目高频核心（必设计，Vue2 实测 ≥20 次）

> 调研实测使用频率最高的语义，且当前 lx-ui **全部缺失**。

| # | 图标名 | 语义 | 项目实测场景 | 参考形态 |
|---|---|---|---|---|
| 1 | `delete` | 删除 | 删除/批量删除/解绑/清空（44 处，第一大操作图标） | 垃圾桶 |
| 2 | `edit` | 编辑 | 行内编辑（20 处，统一收敛此一枚，废弃 edit-outline 两套并存） | 铅笔 |
| 3 | `plus` | 新增 | 新增按钮（35+19 处，两套并存，统一为 plus） | 细十字加号 |
| 4 | `refresh` | 刷新 | 列表刷新/重新加载（32 处） | 顺时针环形双箭头 |
| 5 | `undo` | 重置 | 查询条件重置（32 处中大部分 refresh 实为「重置」语义，拆分出来） | 逆时针单箭头 |
| 6 | `download` | 导出/下载 | 导出 Excel/模板下载/归档下载（7 处） | 托盘+下箭头 |
| 7 | `upload` | 导入/上传 | Excel 导入/上传（含 folder 借用，2 处） | 托盘+上箭头 |
| 8 | `eye` | 查看 | 查看详情（3 处 + 详情抽屉体系） | 眼睛（睁） |
| 9 | `loading` | 加载中 | 全局 spinner/树加载（6 处，半圆箭头，配 CSS 旋转） | 3/4 圆弧+箭头 |
| 10 | `more` | 更多操作 | 树节点更多菜单（6 处，ActionButtons 折叠「更多」也可用） | 竖三点（horizontal ellipsis ⋯） |
| 11 | `folder` | 文件夹 | 组织树/权限树节点（files/folder/folder-opened 三种收敛为一枚+开合状态） | 文件夹 |
| 12 | `folder-open` | 文件夹展开态 | 权限树已展开节点（4 处） | 打开的文件夹 |
| 13 | `warning` | 警告 | 危险确认/警示（5 处，与现有 `circle-alert` 区分：实心三角用于横幅级） | 三角+叹号 |

## 2. P1 — 项目在用的中频 + 语义修正（应设计）

| # | 图标名 | 语义 | 场景 / 调研依据 |
|---|---|---|---|
| 14 | `people` | 多人/部门组织 | 组织选择、查看用户（user 4 处为单人，部门/群组需多人形态） |
| 15 | `file` | 文档/详情 | 「详情/授权」按钮（document 4 处） |
| 16 | `file-check` | 已授权节点 | 权限树已授权标记（document-checked 1 处，勾选三态收敛） |
| 17 | `star` | 设为默认/收藏 | 默认角色/星标（6 处） |
| 18 | `tag` | 分类标签 | 创建分类（price-tag 1 处 + H5 标签体系） |
| 19 | `image` | 图片占位 | 头像/轮播占位（picture 系列 11 处收敛） |
| 20 | `video` | 视频/摄像头 | 摄像头权限授权（video-camera 2 处，camera 已有，此为视频流形态） |
| 21 | `mobile` | 手机 | 手机号展示（mobile-phone 2 处） |
| 22 | `link` | 链接绑定 | 绑定链接（3 处） |
| 23 | `share` | 分享 | 协同分享（2 处） |
| 24 | `arrow-up` | 排序上移 | AppsManage 上移（top 2 处，废弃 top/bottom 撞车） |
| 25 | `arrow-down` | 排序下移 | 同上（bottom 3 处，其中 1 处误用于导出） |
| 26 | `arrow-left` | 返回上一级 | 返回/穿梭（3 处） |
| 27 | `arrow-right` | 前进 | 同上（3 处，chevron-right 已有但为细箭头，此为粗箭头导航语义） |
| 28 | `caret-down` | 树收起态/下拉 | 树箭头（caret-right/bottom 5 处，caret-right 可用 chevron-right 替代，需配对） |
| 29 | `close` | 清除已选 | 清除选择/清除图片（circle-close 2 处，区别于现有 `x`：圆形外框，标签可关闭态） |
| 30 | `key` 已有 ✅ | 密码/权限 | 重置密码（key 5 处，**已有无需设计**） |
| 31 | `switch` | 停用/退出 | 退出登录/停用（switch-button 3 处，借语义严重，需专门形态） |
| 32 | `power` | 电源/登出 | 登出（比 switch-button 更准确的语义） |
| 33 | `clock` | 时间/耗时 | 操作时间（time 2 处 + 日程） |
| 34 | `date` 已有 ✅ | 日历视图 | 日历切换（calendar 已有，date 为单日形态，可选） |
| 35 | `grid` | 视图切换 | 表格/卡片视图切换（menu/s-grid 3 处） |
| 36 | `list` | 列表视图 | 同上配对（list 形态） |
| 37 | `copy` | 复制 | 代码槽/警号复制（FA fa-copy 语义，LxCodeSlot 拓展） |
| 38 | `phone` | 电话 | 联系电话（FA fa-phone） |
| 39 | `email` | 邮箱 | 邮箱字段（FA fa-envelope） |
| 40 | `lock` | 锁定 | 锁定/只读（FA fa-lock） |
| 41 | `unlock` | 解锁 | 解锁操作（FA fa-unlock，配对） |

## 3. P2 — 日常开发常用联想补充（建议设计，前瞻覆盖）

> 项目暂未用或低频，但属后台管理系统高频通用图标，补齐后基本无需再扩展。

| # | 图标名 | 语义 | 联想场景 |
|---|---|---|---|
| 42 | `minus` | 减少/收起 | 减少条件行、缩放配对（plus 的反向） |
| 43 | `eye-off` | 隐藏 | 密码可见切换配对（eye 必配） |
| 44 | `filter` | 筛选 | 列筛选、高级筛选（SearchBar 拓展） |
| 45 | `sort` | 排序 | 表头排序态（上下双箭头） |
| 46 | `fullscreen` | 全屏 | 全屏预览（V2 Navbar 有此功能） |
| 47 | `fullscreen-exit` | 退出全屏 | 配对 |
| 48 | `printer` | 打印 | 报表打印 |
| 49 | `location` 已有近似 | 定位 | `map-pin` 已有 ✅，补充 `location-arrow` 导航定位（可选） |
| 50 | `info` | 信息提示 | 中性提示（feedback 三态外的 info 形态，填充圆 i） |
| 51 | `circle-question` | 帮助 | 表单字段说明 tooltip 触发（高频通用） |
| 52 | `history` | 操作记录 | 审计日志/操作历史（审计抽屉体系） |
| 53 | `message` | 消息 | 站内信（区别 bell 铃铛：气泡对话形态） |
| 54 | `password` | 密码字段 | 登录密码框（区别 key：** 形态） |
| 55 | `id-card` | 证件 | 警官证/身份证（person 详情字段） |
| 56 | `logout` | 退出登录 | power/switch 之外的第三种语义收敛（见 §5 混乱修正 #7） |
| 57 | `home` | 首页 | 面包屑根/返回首页 |
| 58 | `language` | 语言 | 国际化（chat-line-square 借用修正） |
| 59 | `screenshot` | 截图 | 警情截图取证 |
| 60 | `wifi` | 网络状态 | 节点在线/离线（nodeManage 体系） |
| 61 | `cloud` | 云同步 | 数据同步状态 |
| 62 | `database` | 数据源 | 数据配置（区别 server：圆柱体形态） |
| 63 | `terminal` | 终端 | 诊断/日志控制台 |
| 64 | `cpu` | 性能指标 | 节点监控 |
| 65 | `pin` | 固定/置顶 | 常用置顶、列固定 |
| 66 | `zoom-in` / `zoom-out` | 放大缩小 | 图片预览、地图 |
| 67 | `drag` | 拖拽排序 | 拖拽把手（六点形态） |
| 68 | `save` | 保存 | 显式保存按钮 |
| 69 | `export` | 归档导出 | 与 download 区分（带文件形态，可选） |

## 4. H5 图标选择器专用集（独立体系，收敛设计）

**现状问题**：Vue2 工程自研 FA 图标选择器，**389 个 Font Awesome 图标名**在 4 个文件中各复制一份，且项目**未引入 FA 字体资源**——选择器弹窗与列表回显实际渲染为空白，是当前最大图标体系隐患。

**设计要求**（配合菜单配置改造 S1 一并解决）：
1. **收敛到 80 枚左右**常用集（从 389 里按使用率+语义去重），覆盖类目：首页/用户/设置/图表/通知/日历/电话/设备/文件/文件夹/剪贴板/刷新/分享/链接/锁/密钥/证件/相机/音视频/网络/云/天气/交通/饮食/物流/建筑/医疗/自然/表情
2. 直接**复用 LxIcon 体系**（24×24 stroke 1.5 单色），选择器改为枚举 `LxIconName` 白名单，消灭 FA 依赖
3. 分组展示（复用文档站图标总览页的分组/搜索/复制交互）
4. **需设计师产出**：这 80 枚的选择器分类清单与图标设计（可从 §1-§3 清单中挑 + 补充生活类目）

---

## 5. 语义混乱修正规范（设计稿务必按此收敛，Vue2 调研发现 11 处混乱）

| # | 混乱现状 | 修正规范 |
|---|---|---|
| 1 | 新增按钮两套并存（plus / circle-plus-outline，54 处分裂） | **统一 `plus`** |
| 2 | 重置三种（refresh / circle-close / refresh-right）且 refresh 与「刷新」混用 | **刷新 = `refresh`，重置 = `undo`**（方向区分） |
| 3 | 导出撞车（bottom 既指导出又指下移） | **导出 = `download`，下移 = `arrow-down`** |
| 4 | 编辑两套（edit / edit-outline） | **统一 `edit`** |
| 5 | 选中三态（check / circle-check / document-checked 场景混用） | **勾选 = `check`，完成反馈 = `circle-check`（已有），已授权节点 = `file-check`** |
| 6 | 树节点三种（files / folder / folder-opened） | **统一 `folder` + `folder-open` 开合两态** |
| 7 | 借用不当：view 当修改密码、goods 当绑定设备、switch-button 当退出/停用/关闭三用、document 当详情+授权、chat-line-square 当语言 | **eye=查看、`switch`/`power` 拆分停用与登出、`file`=详情、`key`已有=密码权限、`language`=语言** |
| 8 | 图片占位三种（picture / picture-outline / plus） | **统一 `image`** |
| 9 | FA 无字体渲染空白（389 个） | §4 收敛到 LxIcon 体系 |
| 10 | Navbar 图片与字体图标混用 | 全部走 LxIcon |
| 11 | svg 库 46 个仅 7 个在用（34 个 vue-element-admin 遗留） | 迁移 lx-ui 时**不迁移**，按本文档清单重建 |

---

## 6. 汇总统计

| 分层 | 数量 | 说明 |
|---|---|---|
| 现有保留 | 26 枚 | 侧边栏 12 + 交互 10 + 反馈 4 |
| P0 新增 | 13 枚 | §1（高频核心，Vue2 实测驱动） |
| P1 新增 | 27 枚 | §2（中频 + 语义修正） |
| P2 新增 | 28 枚 | §3（常用联想前瞻） |
| **全集目标** | **~94 枚** | P0+P1 = 66 枚为核心集（优先出稿） |
| H5 选择器 | ~80 枚（含复用） | §4 独立体系 |

**交付建议**：P0 13 枚先出（解锁组件库 P0 开发：el-button 图标按钮、SearchBar 重置、ActionButtons 语义图标）；P1 出稿后覆盖 Vue2 全部存量场景迁移；P2 与 H5 选择器集可分批补。

---

## 7. 交付物要求

1. **SVG 源文件**：命名 = 图标名（如 `delete.svg`），24×24 viewBox，stroke 1.5，`stroke="currentColor"`
2. **对照表**：旧 el-icon-xxx / FA 类名 → 新 LxIcon 名映射表（迁移用，可由前端基于本文档生成初稿）
3. **审阅点**：P0/P1 图标风格与现有 26 枚的一致性（粗细、圆角、简化程度对齐，建议放同一画布网格对照）
