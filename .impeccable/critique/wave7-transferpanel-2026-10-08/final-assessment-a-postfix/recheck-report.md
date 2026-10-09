# Wave 7 LxTransferPanel · Assessment A Post-fix Recheck

## 结果

原 Assessment A 的 3 项发现均已解决：

- **P2 窄屏页签断行：已解决。** 320px 和 390px 可见文案均为“待选 / 已选”；按钮 `aria-label` 仍包含完整面板名和数量，`title` 也保留完整标题。
- **P2 已选数换行：已解决。** 两个窄屏视口下“已选 4 项”保持单行；计算样式为 `white-space: nowrap`，实测高度不超过一行。
- **P3 键盘方式缺少提示：已解决。** 树面板内显示“键盘：方向键移动或展开，Space / Enter 选择”。320px 下 `ArrowDown` 移至目标行，`Enter` 将选择从 4 项改为 5 项；390px 下同样用 `ArrowDown` 导航、`Space` 选择，数量从 4 项变 5 项。

没有发现由这批修改引入的新问题。另有一项**非回归范围观察**：1440px 文档页中的组件预览宽 880px，单侧面板约 357px；该桌面窄列下计数样式仍为 `white-space: normal`，页脚计数会换行。此次改动目标的 320px/390px 视口已通过，故将该桌面容器宽度表现记录为次要观察，不追加修改。

## 浏览器与源码

目标 URL：`http://127.0.0.1:4174/components/lxtransferpanel`。使用 Playwright 控制 Google Chrome `154.0.8037.95`，headless，每个视口创建全新隔离 context：320×740、390×844、1440×960。设置 `prefers-reduced-motion: reduce`；两个窄屏分别检查浅色和组件 HUD 深色主题。未操作用户现有浏览器标签。

当前源码 SHA-256：

```text
D9AA5BABEEB2102DB3C58139EC03355D140FDC3DEC75771CF63D8F45DD3FEA50
```

两个窄屏在浅色与 HUD 深色视图中的 `documentElement.scrollWidth` 都等于各自视口宽度。已选数单行、移动页签文字/无障碍名称、键盘提示和键盘实际操作均有结构化证据。桌面文档页与组件预览已截图；无页面脚本异常或非 2xx 响应。320px context 出现一条 URL 未明的通用 404 console 文案，response 监听没有对应失败 URL，未归因到此组件。

## 证据

- `browser-facts.json`：三个独立 context 的页面状态、ARIA 名称、计数尺寸、键盘操作、主题和溢出数据。
- `source-sha256.txt`：当前目标组件源码指纹。
- `01-desktop-page-smoke.png`、`02-desktop-component-light.png`：桌面冒烟视图。
- `03-mobile320-light-source.png`、`04-mobile320-light-selected.png`、`05-mobile320-keyboard-selection.png`：320px 浅色及 Enter 键操作。
- `06-mobile390-light-source.png`、`07-mobile390-light-selected.png`、`08-mobile390-keyboard-selection.png`：390px 浅色及 Space 键操作。
- `09-mobile320-hud-dark.png`、`10-mobile390-hud-dark.png`：两个窄屏尺寸下的 HUD 深色态。
- `capture-postfix-a.mjs`：本次只读浏览器复核脚本。
