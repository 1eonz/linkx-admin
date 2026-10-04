# LxDatePicker Assessment B

状态：阶段性 / 降级。此报告只记录 Assessment B；未读取 Assessment A 的任何输出。

## Detector

三个指定目标均单独运行 `detect.mjs --json`。每份 stdout 都是合法 JSON `[]`，stderr 为 0 字节，退出码均为 `0`，因此本次静态 detector 对这三个目标报告零命中。

| 目标 | JSON 命中数 | stderr | 退出码 |
| --- | ---: | ---: | ---: |
| `linkx-fe/src/components/LxDatePicker/index.vue` | 0 | 空 | 0 |
| `linkx-fe/src/components/LxDatePicker/demo/basic.vue` | 0 | 空 | 0 |
| `linkx-fe/docs/components/lxdatepicker.md` | 0 | 空 | 0 |

原始 JSON、stderr 和退出码分别保存在本目录的 `detector-*.stdout.json`、`detector-*.stderr.txt` 与 `detector-*.exit-code.txt`。解析验证摘要见 `detector-summary.json`。

## 当前指纹

取证时三个目标的 SHA-256 见 `target-sha256.json`。指纹用于标识本次观察到的文件字节；该评估没有修改产品源码、测试或文档。

## 浏览器证据

在新的 Codex In-app Browser 标签打开 `http://127.0.0.1:4174/components/lxdatepicker.html`。桌面截图中，浅色页面显示 9 月与 10 月双月区间面板，周一为首列，选中区间与中间日期带可见。键盘操作中，`ArrowDown` 打开面板并将可访问焦点移到当前日期；`ArrowRight` 将焦点移至下一日；`Escape` 关闭面板。HUD 深色开关也成功切换，触发器与演示面板随之变为深色。

本轮通过 CUA 工具观察到 4 张截图（桌面初始浅色、桌面浅色双月弹层、键盘焦点、HUD 深色）。CUA 当前接口只把截图作为工具图像输出，没有保存到工作区文件的能力，因此本目录实际归档截图数为 0；观察清单在 `browser-captures.json`。窄屏视口未采集。桌面弹层靠近截图视口下沿，底部日期行与边缘间距较小，是否裁切仍需更高视口复验。

## Overlay 与请求记录

可变更注入预检被浏览器 URL 安全策略拒绝：允许协议仅为 HTTP/HTTPS，`javascript:` 页面动作在执行前被拦截。错误原文保存在 `browser-policy-block.txt`；该浏览器动作未产生进程退出码。没有追加脚本标签，没有加载 `detect.js`，也没有页面内 detector 结果或用户可见 overlay。按该策略提示，本次没有改用 CDP、Puppeteer、其他浏览器入口或间接执行方式。

因此未启动 `live-server.mjs`，也未取得完整网络请求日志。`browser-requests.json` 只记录已确认的目标页导航和未发出的 overlay 脚本请求，不把未采集的网络请求伪装成空列表。

## 降级边界

静态 detector 已完成且退出码为 0；人工桌面浅色/HUD 与键盘状态已观察。正式 Assessment B 的浏览器 overlay、页面内 detector、窄屏视图及归档截图/网络记录没有完成。`[]` 只表示这些静态目标的 detector 零命中，不能代表运行页面没有问题或正式 Critique 通过。
