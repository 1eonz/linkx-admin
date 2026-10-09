# 浏览器证据索引

目标页：`http://127.0.0.1:4174/components/lxtransferpanel.html`。每页都有新 CDP target、独立的 `pages/<case>.json` 和 viewport 截图；逐页 JSON 记录预检、脚本加载、扫描结果、浏览器 console、主题 class、注入前后 overflow 与 overlay 的目标 DOM、祖先链和矩形。

| 页面 / CDP target | 视图与状态 | 截图 | 扫描 overlay | 注入前页面宽度 | 注入后页面宽度 |
| --- | --- | --- | ---: | --- | --- |
| `2BC2CB949EE54E71D2FD0DADB895DE74` | 桌面 1440×1100，正常浅色 | `screenshots/desktop-ready-light.png` | 36 | 1425 / 1425 | 1425 / 1425 |
| `15653057C94E530DFA0A4E2855F6B8C2` | 窄屏 390×844，正常浅色 | `screenshots/narrow-ready-light.png` | 5 | 390 / 390 | 390 / 630 |
| `0D8A91E26FC4256EE9912C635E6BE4FC` | 桌面 1440×1100，空结果浅色 | `screenshots/desktop-empty-light.png` | 36 | 1425 / 1425 | 1425 / 1425 |
| `F283C75B636AC55F3B3070E60ED759DD` | 窄屏 390×844，加载中 HUD 深色 | `screenshots/narrow-loading-dark.png` | 224 | 390 / 390 | 390 / 630 |
| `3F56FCBE0729037971D04236A1FF36CD` | 桌面 1440×1100，加载失败 HUD 深色 | `screenshots/desktop-error-dark.png` | 239 | 1425 / 1425 | 1425 / 1425 |

所有页面的 `preflight.scriptAttached` 为 `true`，`injection.loaded` 为 `true`，`forcedScan.available` 为 `true`，无失败页。`capture-index.json` 汇总结果；每个 `pages/<case>.json` 是该页完整数据。截图是 viewport 截图，顶部黄色区域为 detector overlay/banner，不是产品页面本身的 UI。

当前窄屏 overflow 在注入前基线为 `390 / 390`；注入 detector 后根节点 scroll width 为 `630px`，但 body 与面板宽度仍为 `390px` 与 `342px`。这是 detector banner 布局的取证副作用。
