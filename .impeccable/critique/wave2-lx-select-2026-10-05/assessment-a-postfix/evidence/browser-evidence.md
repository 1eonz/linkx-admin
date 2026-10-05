# 浏览器观测记录

## 目标与过程

- 页面：`http://127.0.0.1:4174/components/lxselect.html`
- 浏览器：Codex In-app Browser，Assessment A 新标签。
- 首次尝试：页面尚不可达，`createBrowserTab` 返回 `net::ERR_CONNECTION_REFUSED`。本评审没有启动或停止服务。
- 后续尝试：主会话启动并保持服务后，在另一新标签成功打开页面；初始桌面视口约 1279×720。最后已恢复默认视口。
- 观察方式：CUA 截图与可访问性树；窄屏尺寸另以浏览器只读 DOM 测量核对。截图在评审会话中查看，工作区保留此处的状态与尺寸记录。

## 观察结果

- 桌面首屏先展示标题、用途、32px/1px 边框/44px 触屏控件规格，再进入交互示例；左侧组件导航、中央内容和右侧目录清楚分区。
- 基础示例以两个并排单选字段起步，过滤字段换到整行；后续多选、远程和禁用区块顺序呈现，卡片标题能快速区分任务。
- 远程情景切到“请求失败”后，收起状态可见“远程检索暂时失败，请重试。”和“重试”。打开值班警员下拉后，浮层显示“远程检索未返回可用选项”，外侧重试按钮被 popper 覆盖；按 Escape 收起后恢复可见。
- HUD 开启后，示例容器与卡片切换到深色，打开的配置式 options popper 也使用深色表面；实测弹层 `--el-bg-color-overlay` 为 `#16233a`，teleported 菜单未留在浅色主题。
- 320×812 视口：`innerWidth=320`、`documentElement.scrollWidth=320`、`body.scrollWidth=320`；当前打开 popper 的左右边界约为 49–271px，仍在视口内。触发器高度为 44px，选项行高度为 32px。

## 证据限制

- 连接拒绝记录来自服务启动前；后续实页检查是在主会话启动服务之后完成。
- 三项 Playwright 测试仅检查源码，没有在本 Assessment A 中执行；aria-describedby 的逐属性读回依赖测试源码与 helper 代码，没有将测试断言记作本次运行结果。
- 未调用 Impeccable detector，也未查看任何 Assessment B 或其他 critique 报告。
