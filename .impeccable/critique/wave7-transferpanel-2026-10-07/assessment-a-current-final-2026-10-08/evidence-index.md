# Assessment A 浏览器证据索引

目标：`http://127.0.0.1:4174/components/lxtransferpanel`；页面标题为 `LxTransferPanel 双栏穿梭 | LxUI`。采集使用独立 Chrome 154 进程、全新 BrowserContext 与 Page。

| 覆盖项 | 证据文件 |
|---|---|
| 1440×1000、375×844、320×844 浅色与 HUD 深色默认态 | `desktop-1440x1000-light-default.*`、`desktop-1440x1000-hud-default.*`、`mobile-375x844-*default.*`、`narrow-320x844-*default.*` |
| Demo 控件展开、上限前后与限额提示 | `desktop-1440x1000-light-controls-open.*`、`desktop-add-capacity-before.*`、`desktop-add-capacity-after.*`、`desktop-limit-feedback.*` |
| 三种视口的筛选清除目标尺寸 | `desktop-1440x1000-clear-hitbox.*`、`mobile-375x844-clear-hitbox.*`、`narrow-320x844-clear-hitbox.*` |
| 键盘清除筛选后的焦点归还 | `desktop-keyboard-selected-filter-cleared.*`、`desktop-keyboard-source-filter-cleared.*` |
| prefers-reduced-motion 与窄屏列表 End 键滚动 | `desktop-reduced-motion.*`、`mobile-375x844-selected-list-keyboard-end.*`、`narrow-320x844-selected-list-keyboard-end.*` |
| 空结果、加载、错误和重试恢复 | `desktop-host-empty.*`、`desktop-host-loading.*`、`desktop-host-error.*`、`desktop-host-retry-recovered.*` |

每个完整状态组含 `.page.png`（文档页面）、`.demo.png`（组件 Demo）、`.dom.json`（DOM、尺寸、状态及焦点事实）。三种视口的清除目标尺寸另有 `.demo.png` 与 `.dom.json`，不计入完整状态组数量。`browser-evidence.json` 汇总 19 个状态采集、19 个断言、失败项、HTTP 错误 URL 和浏览器异常；结果为 19/19 通过、0 个 pageerror。`capture-assessment-a.mjs` 是可复核的采集脚本。

复核发现只有 `GET http://127.0.0.1:4174/favicon.ico` 返回 404（resourceType=`other`）。页面路由 HTTP 200，监听 PID 23700。初次服务不可用记录见 `preflight-service-availability.json`；Assessment A 未停止或修改其记录中的旧 PID。
