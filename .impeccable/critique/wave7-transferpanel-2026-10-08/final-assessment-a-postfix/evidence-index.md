# Assessment A Post-fix Evidence

目标 URL：`http://127.0.0.1:4174/components/lxtransferpanel`  
浏览器：Playwright 控制 Google Chrome 154.0.8037.95，headless；每个视口使用全新 context。  
偏好：`prefers-reduced-motion: reduce`；浅色文档主题，另检查组件 HUD 深色。  
源码 SHA-256：见 `source-sha256.txt`。  
不读取 detector / Assessment B 输出；不修改产品代码。

| 文件 | 证据 |
|---|---|
| `01-desktop-page-smoke.png` | 1440×960 桌面完整文档页。 |
| `02-desktop-component-light.png` | 桌面浅色组件预览与当前列宽。 |
| `03-mobile320-light-source.png` | 320×740 待选侧；短页签、完整 aria-label 在事实文件中。 |
| `04-mobile320-light-selected.png` | 320×740 已选侧；计数单行，树侧 `display:none`。 |
| `05-mobile320-keyboard-selection.png` | 320px 先用方向键导航，再用 Enter 选择，数量 4→5。 |
| `06-mobile390-light-source.png` | 390×844 待选侧与可见键盘提示。 |
| `07-mobile390-light-selected.png` | 390×844 已选侧及计数单行。 |
| `08-mobile390-keyboard-selection.png` | 390px 先用方向键导航，再用 Space 选择，数量 4→5。 |
| `09-mobile320-hud-dark.png` | 320px HUD 深色主题，未横向溢出。 |
| `10-mobile390-hud-dark.png` | 390px HUD 深色主题，未横向溢出。 |
| `browser-facts.json` | 每个视口的 URL、短/全标签、计数尺寸、ARIA、主题、键盘及溢出事实。 |
