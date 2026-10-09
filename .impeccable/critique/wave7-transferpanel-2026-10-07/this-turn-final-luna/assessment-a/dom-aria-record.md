# DOM / ARIA 记录

**证据级别：源码推导，未在 4174 页面运行态确认。** 浏览器导航受拒，以下内容来自本轮指定的冻结源码；不要把它解读成已检查到真实 DOM 的结果。

## LxVirtualTree

- `linkx-fe/src/components/LxVirtualTree/index.vue` 中树容器使用 `role="tree"`、可配置 `aria-label` 和多选标志；已渲染行使用 `role="treeitem"`，提供层级、同级位置/数量、展开、选中/混合、禁用状态和级联选择说明。
- 搜索输入显式标记 `aria-label="过滤节点"`；关键字非空时出现 `aria-label="清除过滤"` 的按钮。输入类型为 `search`，因此 Blink 浏览器的原生清除 affordance 可能与自定义按钮并存；本轮未能在目标页确认可视结果。
- `matchingNodeCount` 只在节点自身匹配时递增；匹配祖先只加入结构保留集合。状态文案明确写出“路径祖先不计入数量”。这满足计数定义的源码证据，运行态播报未验证。
- 行是树内唯一的 Tab 停靠点；行内展开按钮与复选框设为 `tabindex=-1`。树项支持方向键和空格/回车，样式对树行声明 `:focus-visible`。

## LxTransferPanel

- 根节点声明 `data-lx-transfer-layout="5:2:5"`。窄屏切换组有可访问名称；两颗按钮分别提供 `aria-label`、`aria-controls` 和 `aria-pressed`，窄屏隐藏面板用 CSS `display:none` 移出布局。
- 两侧面板使用 `role="group"` 与标题 `aria-labelledby`。左侧树继承虚拟树的 tree/treeitem 语义；右侧列表是可聚焦的 `ul`，带当前显示数/总数的名称及可滚动提示关联。
- “全部加入”按钮在受上限约束时引用隐藏的具体原因说明；全树反选和筛选操作也关联范围/状态说明。
- 继承复选框的说明描述由 `syncInheritChildDescription()` 同步到控件；说明为空时，复选框 disabled，旁边显示“尚未配置经确认的具体继承范围说明，当前不可更改此选项。” Demo 有“提供继承说明”设置可切换该分支。因预览服务拒绝连接，本轮未能看到控件最终渲染属性、实际可见状态或读屏播报。
- 源码声明键盘焦点样式及 767、420、359px 断点；两侧面板的实测溢出、触控命中和焦点样式未运行态验收。指定六文件中没有 `prefers-reduced-motion` 规则或显式过渡/动画；静态检索不能替代运行态媒体模拟。
