# LxDescriptions Assessment A 证据索引

评审目标：`linkx-fe/src/components/LxDescriptions/demo/basic.vue`  
页面：`http://127.0.0.1:4174/components/lxdescriptions`  
浏览器：Playwright 1.58 + 本机 Chrome，独立 context；桌面 `1365x900`，窄屏 `390x844`。截图均为当前工作区服务实时渲染结果。

## 截图

| 文件                             | 视图/状态             | 观察用途                                                   |
| -------------------------------- | --------------------- | ---------------------------------------------------------- |
| `evidence/desktop-route.png`     | 桌面全页面，1365px    | 文档壳、Demo、Props/Slots/状态说明和页面纵向层级。         |
| `evidence/desktop-demo.png`      | 桌面 Demo，1365px     | 控件编排、单列详情、480px 人员档案抽屉、复制字段和状态点。 |
| `evidence/mobile-route.png`      | 窄屏全页面，390px     | 文档窄屏排版、表格密度、页面纵向长度和无横向溢出。         |
| `evidence/mobile-demo-ready.png` | 窄屏 ready，390px     | 控件换行、单列行高、长设备标识换行、抽屉宽度。             |
| `evidence/mobile-grid.png`       | 窄屏双列，390px       | 双列切换后的数据排列与长文本处理。                         |
| `evidence/mobile-grid-hud.png`   | 窄屏双列 + HUD，390px | 整页深色主题影响范围及文档/API 区明暗一致性。              |
| `evidence/mobile-error.png`      | 窄屏错误态，390px     | 错误文案、重试按钮、错误态与抽屉保留情况。                 |

## 浏览器观察记录

- 桌面 `document.documentElement.scrollWidth = 1365`，与 viewport 一致。
- 窄屏 `document.documentElement.scrollWidth = 390`、`body.scrollWidth = 390`，没有页面级横向溢出。
- 窄屏 Demo 宽度约 342px，抽屉在容器内铺满；设备标识在窄屏换行，警号和设备标识复制按钮可通过键盘获得焦点。
- 状态菜单包含“详情、读取中、空结果、错误”；选择“错误”后显示“详情读取失败。/重试”，点击重试恢复详情。
- 控件顺序可通过 Tab 进入；复制按钮的可访问名称包含字段和值，例如“复制警号：005882”。
- 控制台观察到一个资源 404；来源未在 Assessment A 中追踪，不能据此判断 Demo 交互失败。

## 证据边界

截图证明当前页面在指定桌面/窄屏尺寸下的视觉布局和手工交互状态；不证明真实后端联调、屏幕阅读器朗读、200% 缩放、多浏览器兼容性、权限脱敏或 detector 结果。Assessment B 与 detector 证据应由独立评审保留并在综合报告中另行引用。
