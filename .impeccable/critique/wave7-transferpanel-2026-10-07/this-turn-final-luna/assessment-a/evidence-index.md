# 证据索引

评审范围只含以下六个冻结目标文件和 `design/虚拟滚动树 + 双栏穿梭/` 设计素材；没有读取 Assessment B、detector、代码复审、综合报告或旧 Impeccable 评估结果。

| 文件 | SHA-256（评审开始） | 本轮用途 |
| --- | --- | --- |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `ED179E288878961EEB5A3E8E4EEEBC399C90F9AF9568FF79DD599D35653A7E20` | 树筛选命中计数、ARIA、键盘焦点、搜索清除控件 |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | `06AAAF1458985D1A8A1BA673612258F4B569530ACB48B10F1C4FBB24B9CD4EDE` | 演示状态、折叠工具组、可见操作数量 |
| `linkx-fe/docs/components/lxvirtualtree.md` | `8B640402C7502FBEEC015F905714502989EA4B29BE53E8EEE689AF185124AF99` | 组件定位、交互契约与边界说明 |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `60A6EBA15FA1292EB2457AA153E66AEFAE0495794836D62E684FDA5AE92F1AF7` | 穿梭操作、清空规则、移动布局、ARIA 和焦点样式 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `A8B7A189D6FE2959F9D198DEAE6F5EF8917D3DA6FC13CF5E966456B40D6F949D` | 加载/空/错状态、主题和继承说明切换 |
| `linkx-fe/docs/components/lxtransferpanel.md` | `30CB91FF42C433DEBF3D3CDE0AC6239178B99A3B8F384AE2685E41DCDECC8625` | 选择契约、缺失说明降级和宿主持久化风险 |

## 设计与浏览器证据

- `design-reference-screen.png`：指定设计图 `design/虚拟滚动树 + 双栏穿梭/screen.png` 的原样副本，SHA-256 `4BDF7DED1C8D2272F0AFBB7706A2F103B888D3DAF72BF472204C1AA7DB9DE4F5`。它是设计参考，不代表 4174 当前运行页面。
- `browser-navigation-attempt.md`：新 Playwright context/tab 访问 4174 的实际失败记录。
- `browser-navigation-error.txt`：Playwright 导航错误及只读复查结果。
- `dom-aria-record.md`：源码推导的结构、键盘/ARIA 契约和未运行态确认项。
- `capture-assessment-a.mjs`：本轮只读浏览器采集脚本；导航被拒后未产出页面截图。
- `source-hashes-start.txt` 与 `source-hashes-end.txt`：六个目标文件评审开始/结束的哈希对照。

## 关键源码位置

- 虚拟树：实际命中计数与路径祖先分离 `index.vue:114-138`；搜索输入和清除按钮 `index.vue:648-661`；树项 ARIA `index.vue:715-785`；焦点样式 `index.vue:918-922`。
- 虚拟树 Demo：高级操作默认收起 `demo/basic.vue:99`；一个“树操作”组内有八个动作和两个开关 `demo/basic.vue:136-153`。
- 穿梭面板：缺失说明同步 `index.vue:77-133`；全部清空分支 `index.vue:472-505`；窄屏按钮与断点 `index.vue:626-645, 1588-1630, 1723-1821`；焦点样式 `index.vue:1145-1149, 1629-1632`。
- 穿梭 Demo：默认提供说明、可折叠的主题/状态/参数控制 `demo/basic.vue:18, 271-359`。
- 文档：清空事件在更新后发出并由宿主控制持久化 `lxtransferpanel.md:46, 73-128`；缺失继承说明状态 `lxtransferpanel.md:37, 66`。
