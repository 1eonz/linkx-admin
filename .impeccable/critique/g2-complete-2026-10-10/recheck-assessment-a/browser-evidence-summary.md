# Assessment A 浏览器证据摘要

- 独立服务：`http://127.0.0.1:4177/`，VitePress 文档站，启动 PID 13548；停止命令：`Stop-Process -Id 13548`。
- 独立浏览器上下文：SearchBar/StatusSwitch 各新建 1440×1000 与 375×900 页面；未复用其他评审页面。
- 结果：四个视图均成功加载并保存截图；375px 页面 `scrollWidth=clientWidth=375`，未见页面级横向溢出。
- SearchBar：文档 Demo 为 11 字段折叠态，前四字段可见，日期字段按其 span 落在第二行；源码存在 `fields.length === 4` 的同一行操作分支，但本次没有单独四字段最小宿主页面。
- StatusSwitch：关闭确认层可见；确认层遮罩、标题、消息、取消和危险按钮均可交互观察。桌面组件外层命中高度约 32px、视觉轨道约 42×20；375px 外层命中区域约 44×44。
- ARIA：SearchBar 根节点 `role=search`/`aria-label=检索条件`；StatusSwitch 布控、旧值、确认行存在 `aria-labelledby`，loading/只读/权限行未提供业务行名。
- 控制台：SearchBar 桌面页出现一次 `Failed to load resource: 404`，未追溯到目标组件请求；其他视图未出现该日志。它被视为文档站资源噪声，不能当作组件视觉结论。
- Overlay：本评审未注入 detector overlay，也未读取 detector 输出；因此没有可声明的 `[Human]` overlay 证据，且本报告不把 detector 当作视觉结论。
- 正式性：浏览器/静态设计评审证据完整，可作为 Assessment A 正式设计评审；由于没有独立四字段宿主页面、真实读屏器和真实后端/权限联调，相关结论注明证据限制，不宣称业务联调通过。
