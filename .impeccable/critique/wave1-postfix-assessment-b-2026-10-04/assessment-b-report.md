⚠️ DEGRADED: browser overlay and screenshot evidence unavailable by explicit browser policy restriction

# Wave 1 Assessment B

当前检出 commit 为 `2762816633be07e9dcc8893790fe4c9f4698e52f`。复核六个组件源码 SHA 后发现 LxPasswordInput 已改变，其余五个 SHA 与之前有效扫描完全一致。五个未变化组件沿用其既有 detector JSON/stderr/退出码；仅对 LxPasswordInput 重新运行 bundled `detect.mjs --json`。此前六个目标扫描所基于的 commit 为 `48d62ff704eb7f7f09025ef165a19678840ea928`。

复核后的六个当前源码 SHA-256 如下；五个“复用”目标与既有扫描字节一致，LxPasswordInput 已按当前字节重新扫描。所有结果均为有效 JSON 空数组 `[]`、stderr 空、退出码 0；有效结果 6/6，失败 0/6，静态命中 0。

| 组件 | 当前源码 SHA-256 | Detector 证据 |
|---|---|---|
| LxActionButtons | `0BA25BAD39A3139503D93D67E1BB9093D3442970A5077C23EFBCC19FC8B6A845` | 复用，源码未变 |
| LxButton | `4AEE3D69205246CECF041CC7FB87A0065A1D93DB8D10DF84977557721DFCBE72` | 复用，源码未变 |
| LxInput | `6D971E34E5E33DF14E4191CB885ED2AE943874D07A68D6C3161EE57DF03B34D4` | 复用，源码未变 |
| LxInputNumber | `3264AAED929C68DBD6B41B5894117C2136D08875D412B49C60A92D551AB589DB` | 复用，源码未变 |
| LxPasswordInput | `8419E6798F0A2200537382FD85B17EA71B78538462A93384EE995B29627C2D02` | 已重跑，扫描前后哈希一致 |
| LxTextarea | `373342E8377E8FCEEC38E86F2C104B7C53E37984B71C54B9C71796E4FF979C0B` | 复用，源码未变 |

每个组件目录保留独立的 `stdout.json`、`stderr.txt`、`exit-code.txt` 和 `source-fingerprint.txt`。LxPasswordInput 的旧指纹另存为 `prior-source-fingerprint.txt`，记录旧扫描 SHA 与当前 SHA 不一致；`[]` 只表示对应模板的静态 detector 零命中。

浏览器证据降级：依据此前浏览器策略对脚本注入的明确拒绝和本轮指示，本轮未打开新标签，也未运行 Playwright、CDP、live-server 或 `detect.js`。因此没有 overlay、浏览器命中日志或截图；这不能解读为页面零视觉命中。详情见 `browser-status.md`。

仅记录 Assessment B 证据；未读取或引用 Assessment A 或代码审核报告，未修改产品源码。
