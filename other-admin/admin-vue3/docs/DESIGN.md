警务协同智能中枢系统 - 设计系统与规范 (Design System)
本文档定义了“警务协同智能中枢”系统的设计语言、视觉规范、颜色梯度、排版规则及全局组件标准[cite: 3]。所有前端开发人员及 AI 辅助编程工具（如 Cursor、GitHub Copilot 等）需严格遵守本规范，确保全项目 UI 的一致性与高密度的实战化视觉风格[cite: 3]。

1. 视觉主题与核心氛围 (Visual Theme & Atmosphere)
系统整体采用高信息密度的警务级科技风格：深色背景画布、冷色调边界、警务蓝高亮、密集大写结构标签以及锐利的几何直角[cite: 3]。

暗色模式（默认）：
页面底层画布采用纯黑（#0f172a / #000000 体系）[cite: 3]。
面板与卡片采用带深灰边界的结构[cite: 3]。
核心动效与高亮采用警务蓝（#2563eb）及动态呼吸灯[cite: 3]。
视觉原则：
坚持锐利、扁平、高对比度的技术流路线[cite: 3]。
避免柔和的毛玻璃、大圆角或冗余的渐变装饰[cite: 3]。
2. 颜色规范与角色分配 (Color Palette & Roles)
主色调与语义色
角色	色值 (Dark)	描述与用途
Primary Accent	#2563eb	警务主色：高亮按钮、激活标签、选中菜单项[cite: 3]
Success / Online	#10b981	成功、在线、设备正常、呼吸灯正常态[cite: 3]
Warning / Busy	#f59e0b	警告、处置中、忙碌状态、告警提示[cite: 3]
Danger / Emergency	#ef4444	危险、紧急告警、批量删除、高危标记[cite: 3]
Info / Offline	#64748b	次要信息、离线、中性占位[cite: 3]
表面与背景色
角色	色值 (Dark)	用途
Page background	#f8fafc / #0f172a	页面底层基底[cite: 3]
Panel / Card background	#ffffff / #1e293b	顶栏、侧边栏、卡片容器背景[cite: 3]
Border color	#e2e8f0 / #334155	边框、分割线、容器边界[cite: 3]
3. 排版与文字规范 (Typography Rules)
字体族：
基础/正文/标题：'Inter', -apple-system, sans-serif[cite: 3]
代码/警号/设备编号/数值大字：'JetBrains Mono', monospace[cite: 3]
层级与字重：
大标题 / 英雄区 (Hero)：字重 900，紧凑行高[cite: 3]。
区块标题 (Section Title)：字重 600-700，包含图标与底部虚线[cite: 3]。
结构标签 (Structure Label)：14px，大写，带字符间距[cite: 3]。
警号专属样式 (.police-id)：单行等宽字体、浅色主色背景、小圆角[cite: 3]。
4. 组件样式规范 (Component Stylings)
侧边栏与顶栏 (Sidebar & Header)：
深色沉浸式设计，支持折叠切换[cite: 3]。
菜单栏支持高亮选中状态、图标对齐[cite: 3]。
卡片容器 (.modern-card)：
具备清晰的边框、适度的圆角（--radius-base: 8px）、干净的阴影[cite: 3]。
表格与行内操作列：
表格支持多选框（Checkbox）、状态标签、固定操作列[cite: 3]。
行内按钮必须统一使用 link 模式并搭配标准图标（如查看、编辑、禁用、启用、删除）[cite: 3]。
表单控件与级联选择：
包含复合输入框、单选/多选下拉、日期时间选择器、拖拽上传区域及弹窗（Modal）[cite: 3]。

4.1 业务通用组件规范（2026-07-24 新增）

ProTable 高级表格：
- 三种数据模式：展示模式（仅 data）、纯远程模式（仅 fetchApi）、受控模式（data + fetchApi + @response）
- 配置式 columns，支持 slotName 自定义列渲染
- 内置分页、多选、序号列、loading 状态
- defaultTableFormatter 兼容 4 种后端响应结构

SearchBar 搜索栏：
- 内置关键字输入框 + 搜索/重置按钮
- #filters 插槽支持自定义筛选字段（下拉、日期范围等）
- actions 数组配置右侧操作按钮（新增、批量下载等）

StatusSwitch 状态切换：
- 反向值映射：value=0=启用，value=1=禁用
- 禁用状态下显示 el-tag 标签
- loading 状态防止重复切换

OrgTreeSelect 组织树选择：
- 支持 v-model 双向绑定
- 同步/懒加载双模式（DEPARTMENT_SYNC_SIGN 控制）
- 非管理员视角限定初始根

SelectPagination 远程分页下拉：
- 支持 v-model + multiple + trans 字段映射
- v-loadmore 滚动加载下一页
- valueMap 回显映射

AuthImg 鉴权图片：
- XMLHttpRequest 携带 token 拉取 blob
- /static 前缀自动拼接 /api 网关路径
- 组件卸载时回收 ObjectURL

DataPermissionTree 数据权限穿梭树：
- 左侧部门树（el-tree，同步/懒加载双模式）
- 右侧已选列表（含 path 路径展示）
- check-strictly 父子不联动
- syncFromDetail 高阶回显（兼容 orgList 新格式 + orgIds 旧格式）

PoliceSelectDialog 警员选择弹窗：
- 基于 ProTable 跨页多选（show-selection + row-key）
- 搜索栏（姓名、身份证号、组织）
- confirm 事件返回选中用户数组

SplitDivider 拖拽分割线：
- mousedown/mousemove/mouseup 实现
- 约束最小/最大宽度（180~480px）
- hover 显示拖拽 handle

5. 布局与深度原则 (Layout & Depth)
网格布局：
采用自适应网格（Grid / Flex），在不同屏幕尺寸下流畅折行[cite: 3]。
深度与阴影：
深度主要通过边框对比和内容 containment 来体现，而非过度的虚化模糊或重阴影[cite: 3]。
悬浮（Hover）时呈现轻微位移与高亮边框强化[cite: 3]。
6. 开发实施指南 (Do's and Don'ts)
Do's（推荐做法）：
严格使用 CSS 变量管理颜色与间距[cite: 3]。
确保所有图标与文本对齐规范[cite: 3]。
保持圆角克制（4px 至 8px）[cite: 3]。
Don'ts（严禁做法）：
不要引入大面积的暖色、毛玻璃或柔和渐变[cite: 3]。
不要使用无图标的纯文本表格操作按钮[cite: 3]。
不要打破深色科技感主基调[cite: 3]。