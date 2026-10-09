# Assessment A 证据索引

目标：`http://127.0.0.1:4174/components/lxdynamicform.html`

评审方式：Google Chrome headless，临时隔离 profile，新建 CDP browser context。桌面 1440×1000；移动 375×812 CSS px、DPR 2、触屏启用，并模拟 coarse pointer、no hover 与减少动效偏好。页面目标返回 HTTP 200。

分数：**29/40（Good，72.5%）**。冻结清单包含 33 个文件，评审开始时 33/33 一致；结束时复核 33/33 一致。详见 [report.md](report.md)。

## 截图

| 文件 | 视图 |
|---|---|
| [desktop-page.png](desktop-page.png) | 桌面文档页面与导航结构 |
| [desktop-form.png](desktop-form.png) | 桌面动态表单初始状态 |
| [desktop-validation-error.png](desktop-validation-error.png) | 空表单提交后的必填错误 |
| [desktop-remote-failure.png](desktop-remote-failure.png) | HUD 开启前的远程候选失败状态 |
| [desktop-hud.png](desktop-hud.png) | HUD 深色主题和远程失败反馈 |
| [desktop-upload-progress.png](desktop-upload-progress.png) | 新文件上传进度状态 |
| [desktop-upload-failure.png](desktop-upload-failure.png) | 本地 Mock 上传失败状态 |
| [desktop-upload-success.png](desktop-upload-success.png) | 上传重试交互后的视口；重试未确认触发，不能作为成功态证据 |
| [mobile-form.png](mobile-form.png) | 375px 触屏模拟下的表单和竖向布局 |
| [mobile-date-range-picker.png](mobile-date-range-picker.png) | 日期范围值回显；点击后未显示弹层，不能用于日历状态验收 |

## 评审脚本

[capture.mjs](capture.mjs) 使用 CDP 运行一次有界浏览器捕获。脚本不读取 detector 或 overlay 数据。交互失败记录为未观察项，不重试。

[browser-evidence.json](browser-evidence.json) 保存本次 CDP 可见状态、视口几何和交互结果；它不包含 Assessment B 或 detector/overlay 数据。

## 哈希复核

清单路径：`.impeccable/critique/wave4-dynamicform-2026-10-06/final-unified-freeze/source-hashes-freeze.json`

- 开始：33 个声明文件全部存在，SHA-256 全匹配。
- 结束：33 个声明文件全部存在，SHA-256 全匹配。
