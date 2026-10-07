# Wave 5 Assessment B：LxTreeSelect、LxCascader、LxSelectPagination

本报告只记录 Assessment B 的机械 detector 与浏览器证据，目标文件以最终工作区版本为准。Assessment A 的判断未读入本报告。

## 结论

- 最终 detector 对 3 个组件源码目录、3 个 Demo 文件和 3 篇中文文档分别执行，共 9 项；全部退出码为 `0`，stdout 均为合法 JSON 空数组 `[]`，stderr 均为空。
- `[]` 只代表对应静态目标没有命中 detector 规则，不代表运行页面通过，也不代表没有视觉或交互问题。
- 最终浏览器捕获覆盖 9 个独立场景：每个组件均有亮色桌面、HUD/错误或加载状态、375px 窄屏状态。每页都在新的 CDP BrowserContext 中打开，先验证可变 DOM 注入，再加载 `http://127.0.0.1:8400/detect.js`。
- 9/9 页的 Demo 均找到，9/9 页 detector overlay 脚本加载成功，9/9 页均有截图、DOM 状态、console 结果和运行时异常记录；最终 capture 退出码为 `0`，stderr 为空，浏览器 target crash 列表为空。
- 亮色场景确认 `html.dark`/`lx-theme-hud` 均未设置；HUD 场景确认深色主题生效。TreeSelect、Cascader 的错误/加载文案可见；SelectPagination 的失败场景确认可见 `role="alert"`，内容为“选项暂时无法加载 / 重新加载”。
- 375px 场景的 `innerWidth` 为 375，媒体查询命中窄屏；Cascader 窄屏标签换行后的最终截图和 DOM 记录在对应文件中。

## Detector 最终结果

| 目标 | stdout | stderr | 退出码 | 解释 |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxTreeSelect` | `[]` | 空 | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxCascader` | `[]` | 空 | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxSelectPagination` | `[]` | 空 | 0 | 静态规则零命中 |
| `LxTreeSelect/demo/basic.vue` | `[]` | 空 | 0 | 静态规则零命中 |
| `LxCascader/demo/basic.vue` | `[]` | 空 | 0 | 静态规则零命中 |
| `LxSelectPagination/demo/basic.vue` | `[]` | 空 | 0 | 静态规则零命中 |
| `docs/components/lxtreeselect.md` | `[]` | 空 | 0 | 静态规则零命中 |
| `docs/components/lxcascader.md` | `[]` | 空 | 0 | 静态规则零命中 |
| `docs/components/lxselectpagination.md` | `[]` | 空 | 0 | 静态规则零命中 |

每项的命令、原始 stdout、stderr 和退出码分别位于 `detector-final/<目标名>/`。

## 浏览器覆盖矩阵

| 场景 | 视口 | 主题/状态 | Demo | overlay | 主要运行证据 | 截图 |
|---|---:|---|---|---|---|---|
| TreeSelect 桌面亮色 | 1440×1000 | 默认单选 | 是 | 成功 | DOM + console | `screenshots/lxtreeselect-desktop-light.png` |
| TreeSelect 桌面 HUD 错误 | 1440×1000 | HUD、模拟加载失败 | 是 | 成功 | 可见错误 alert、重试 | `screenshots/lxtreeselect-desktop-hud-error.png` |
| TreeSelect 375px HUD 错误 | 375×812 | HUD、模拟加载失败 | 是 | 成功 | 窄屏媒体查询、错误 alert | `screenshots/lxtreeselect-mobile-375-hud-error.png` |
| Cascader 桌面亮色 | 1440×1000 | 默认单选 | 是 | 成功 | DOM + console | `screenshots/lxcascader-desktop-light.png` |
| Cascader 桌面 HUD 错误 | 1440×1000 | HUD、失败 | 是 | 成功 | 可见错误 alert、重试 | `screenshots/lxcascader-desktop-hud-error.png` |
| Cascader 375px HUD 加载失败 | 375×812 | HUD、加载中且失败 | 是 | 成功 | 加载优先、窄屏标签 | `screenshots/lxcascader-mobile-375-hud-loading-error.png` |
| SelectPagination 桌面亮色 | 1440×1000 | 默认多选 | 是 | 成功 | DOM + console | `screenshots/lxselectpagination-desktop-light.png` |
| SelectPagination 桌面 HUD 错误 | 1440×1000 | HUD、远程请求失败 | 是 | 成功 | 可见 `role=alert`、重新加载 | `screenshots/lxselectpagination-desktop-hud-error.png` |
| SelectPagination 375px HUD 错误 | 375×812 | HUD、远程请求失败 | 是 | 成功 | 窄屏、可见 `role=alert` | `screenshots/lxselectpagination-mobile-375-hud-error.png` |

每个场景的完整 DOM、console、异常、网络失败和 action 结果在 `browser/<场景名>.json`；汇总在 `browser/browser-evidence.json`。

## Overlay 与清理

浏览器使用独立 Edge 临时 profile 和 `Target.createBrowserContext`，没有连接用户已有 tab。每页均完成 `document.title` 与 preflight script 可变注入，之后加载 detector script；console 中保存了 `[impeccable] N anti-patterns found` 及逐条规则输出。规则命中数量是运行时页面与文档外壳的机械提示，不能直接等同于缺陷数量，需结合截图和目标组件定位。

Impeccable live-server 的启动和停止原始证据在 `live-server/`。停止命令退出码为 `0`，`8400/health` 在停止后不可达；停止 stderr 的 `config_missing` 仅表示没有可移除的 live 注入配置，已按原样记录。浏览器临时 profile 已删除，`edge-stop.json` 记录了 `taskkill /PID ... /T /F` 停止方法与结果。4177 文档站属于主 Agent 进程，本评估未停止它，也未触碰 4174。

## 证据完整性

最终捕获命令的 `capture.exit-code.txt` 为 `0`，`capture.stderr.txt` 为空；`target-crashes.json` 为 `[]`。此前因 4177 重启产生的 `chrome-error://chromewebdata/` 失败尝试已归档在 `browser/unstable-final-attempt/`，不作为最终结果使用。
