# AuthImg Assessment B：Detector 与浏览器证据

**执行方式**：独立 Assessment B（gpt-6-luna / max）；未读取 Assessment A 输出，也未使用旧 AuthImg 审查或 detector 证据。评估目标为 `other-admin/admin-vue3/src/components/AuthImg/index.vue`，页面情境为 `http://127.0.0.1:30847/h5/carousel` 的本地 Mock Vue3 管理端。

## Detector

按 `critique.md` 仅扫描目标 Vue 文件：

- 命令：`node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json other-admin/admin-vue3/src/components/AuthImg/index.vue`
- JSON stdout：`[]`，静态命中 0 条。
- stderr：空。
- 进程退出码：`0`。
- 原始证据：`authimg-assessment-b-luna-max-2026-09-29.scan.stdout.json`、`.scan.stderr.txt`、`.scan.exit-code.txt`。

这只说明目标源码的静态规则没有命中，不代表运行页面零问题。

## 浏览器取证

首次通过 CUA in-app browser 打开时，子 Agent 环境不支持可见标签，隐藏标签连接被拒绝。首次 Chrome 访问受路由守卫送到登录页。主 Agent 恢复用户的 30847 Mock 服务后，使用项目 `tests/e2e/fixtures.ts` 的等价 `seedSession` 在独立浏览器上下文建立测试态，目标路由可达。未停止或重启 30847。

使用 Playwright 启动系统 Chrome，在两个新上下文检查桌面 `1280×800` 与移动 `375×812`。请求拦截器只放行 GET/HEAD/OPTIONS，以及代码中确认用于读取的权限、菜单和全局配置 POST；所有其它 POST/PUT/PATCH/DELETE 都被阻断。桌面有一个 keepalive POST 被拦截；轮播列表、权限、菜单、全局配置、图片及其他读取请求都由本地 Mock 返回，未执行新增、编辑、删除或上传操作。

两个视口均保持在 `/h5/carousel`，显示两条 Mock 轮播图记录；2/2 张鉴权图片完整解码，页面宽度分别为 1280/1280 与 375/375，没有页面级横向溢出。记录了导航状态、API 响应、拦截项、浏览器 console、DOM 预检及截图，详见 `authimg-assessment-b-luna-max-2026-09-29.browser-evidence.json` 与对应桌面/移动 PNG。

在目标文档中设置 `document.title` 并追加可执行脚本的预检成功；随后从 `http://127.0.0.1:8401/detect.js` 注入 detector，确认运行并生成 overlay。console 报桌面 23 条、移动 5 条。桌面逐条 console/DOM 证据将命中定位到：`.sidebar-wrapper.sidebar-container`（布局过渡与裁切）、`.logo-icon`（暗底彩色阴影）、18 个 `li.el-menu-item`（紧凑内边距）、`.main-container` 和 `body`（布局过渡），以及 `.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default`（卡片贴近滚动边缘）。没有命中指向 AuthImg 图片元素或其占位元素。滚动容器命中针对表格视口而不是 AuthImg 或卡片项，属于应结合页面语义复核的 detector 假阳性候选。桌面元素映射保存在 `authimg-assessment-b-luna-max-2026-09-29.detector-elements.json`；overlay 原始截图保存在桌面和移动 `.overlay.png`。

## 范围与失败项

- 首轮 CUA/服务不可达和未建立测试态时的登录壳证据单独保存在 `authimg-assessment-b-luna-max-2026-09-29.browser-initial-evidence.json`、`authimg-assessment-b-luna-max-2026-09-29.login-shell.*`。登录页 overlay 不用于评价 AuthImg；最终结论来自服务恢复后的 carousel 路由。
- 移动视口 overlay 共 5 条；可见标签为布局过渡、暗色发光和滚动边缘提示。该视图中的命中仍是管理端外壳/列表容器范围，未定位到 AuthImg 元素。
- 浏览器取证采用无头系统 Chrome，保存了正常态和 overlay 截图；未在 CUA 人工标签中展示 overlay。无 console 页面异常；桌面 keepalive 请求因写请求拦截而失败，属于预期拦截，不计作应用运行异常。
- 本次启动的 detector helper 已于取证后停止；端口 30847 仍保持监听。

**结论**：AuthImg 源码静态 detector 0 命中；本地 Mock 页面两种视口均已检查，鉴权图片加载成功，运行时 detector 命中属于周边管理端布局且未归因于 AuthImg。本报告仅记录 Assessment B，供主评估合并使用。
