# Assessment A 浏览器证据

页面：`http://127.0.0.1:4174/components/lxtransferpanel`  
环境：Google Chrome `154.0.8037.95`，Playwright 新 BrowserContext，无既有 cookie/local storage。浏览器采集时目标返回 HTTP 200，无 page error。

## 截图

| 文件 | 视图/状态 |
|---|---|
| `desktop-light-1440.png` | 1440×900，Light，正常数据 |
| `desktop-hud-1440.png` | 1440×900，HUD 深色主题 |
| `mobile-375-light.png` | 375×900，Light 纵向布局 |
| `mobile-320-light.png` | 320×900，Light 纵向布局；名称省略和列表内滚动可见 |
| `keyboard-focus-filter.png` | 键盘 Tab 聚焦待选节点筛选框 |
| `keyboard-focus-tree-item.png` | 从筛选框 Tab 到树项，2px 可见焦点轮廓 |
| `limit-hint-5-of-5.png` | 已选 5/5，上限原因显示在批量操作旁 |
| `limit-warning-toast.png` | 尝试新增第 6 项后的警告；数量仍为 5 |
| `inherit-child-description.png` | 继承开关及宿主说明 |
| `state-empty.png` | 空树数据，已选项仍保留并标为未加载 |
| `state-loading.png` | 加载中状态，`aria-busy=true` |
| `state-error.png` | 错误提示、保留当前选择和可用重试按钮 |
| `prefers-reduced-motion.png` | reduced-motion 上下文下的正常状态 |

## 关键实测

- `375px`：demo 宽 327px；`320px`：demo 宽 272px。两个视口下文档 `scrollWidth` 均等于视口宽度，没有页面横向溢出。
- 上限按钮禁用，旁边显示“已达上限 5 项”；`aria-describedby` 指向 `role=status` 的完整原因。尝试勾选“待授权特勤支队”后显示“最多可选择 5 项”，所选计数保持 5。
- 继承说明“下级继承范围由宿主业务规则决定。”可见，原生复选框的 `aria-describedby` 成功解析到该说明。
- 键盘：筛选框 `:focus-visible` 为 true，父容器显示焦点阴影；Tab 后树项获得焦点，轮廓为实线 2px。
- 空态文本为“暂无数据”，待选树计数为 0，已有 5 项保留；加载态有状态消息且容器 `aria-busy=true`；错误态有 alert、重试按钮，面板 `inert`，重试恢复正常并保留 5 项。
- reduced-motion 媒体查询匹配；组件、面板、按钮和列表项的过渡/动画时长为 `1e-05s`，动画名为 `none`。
- 采集前后 `index.vue` 与 `demo/basic.vue` 的 SHA-256 相同。完整哈希见 `browser-evidence.json`。
