# DynamicForm 修复后 Assessment B

Assessment B 只采集 bundled detector 与浏览器 overlay 证据；没有读取 Assessment A 目录、旧 A/B 报告或综合报告。目标为 `http://127.0.0.1:4174/components/lxdynamicform.html`，冻结源清单共 34 个文件。开始哈希 34/34 匹配，结束哈希记录见 [`hashes-end.json`](hashes-end.json)。

## 源码 detector

按 Impeccable 要求没有对 URL 运行 CLI scan。对冻结清单里的 22 个 `.vue` / `.md` markup 文件，逐目标执行 bundled `detect.mjs --json`；每个目标单独保存命令、原始 stdout JSON、stderr 与退出码。22/22 命令退出码为 `0`，stdout 均为 JSON 空数组 `[]`，stderr 均为空，合计 0 条静态主 finding。结论同时依据 JSON、stderr 和退出码；不是只凭 `[]` 判断通过。目标和计数索引见 [`detector-summary.json`](detector-summary.json)，逐目标四件套在 [`detector/`](detector/)。

## 浏览器 overlay

使用 Chrome `154.0.8037.95` 与三个全新 CDP browser context/tab：桌面浅色 `1440×1000`、桌面深色 `1440×1000`、触屏窄屏 `375×812`。每个视图先修改 `document.title` 并追加可执行的 data 脚本，随后加载技能 `/detect.js`；预检和注入三视图均成功。页面 console headline 分别为 16、323、10 条；三视图均无 JS exception 或 console error，没有真实外部 HTTP 请求。浅色视图有一个本地 VitePress favicon `404`，未影响页面。原始 console、请求、几何、targets 与 overlay bounds 见 [`browser-evidence.json`](browser-evidence.json)；375px 的注入前后对照见 [`browser-mobile-control-evidence.json`](browser-mobile-control-evidence.json)。

静态 detector 与 overlay 的结果不同，原因是后者分析渲染后的文档外壳。桌面深色视图可见的 `ai color palette` 标记落在 VitePress / Shiki 代码高亮生成的 `span` token（如 `setup`、`ref`、`LxDynamicFormField`、`v-model`），属于代码示例的 detector 误报。`raster buried under a wash or opacity` 标在 VitePress `button.copy` / “Copy Code”按钮上；`line length too long` 标在说明段落；bounce/easing 命中对应 detector 自己的黄色固定 toolbar。375px 的 `positioned child clipped by overflow container` 指向 VitePress 导航汉堡图标的 `span.container`，不指向 DynamicForm 字段或表单控件。

移动端根宽度对照明确了一个 overlay 测量伪影：注入前 `documentElement` 与 `body` 的 `clientWidth/scrollWidth` 均为 `375px`，根文档无横向溢出；注入后 `body.scrollWidth` 仍为 `375px`，但 `documentElement.scrollWidth` 变为 `615px`。造成越界的是 overlay 自身的标签：`.impeccable-label` 从 `x=331` 延伸至 `x=615`，其目标 `span.container` bounds 为 `x=335, y=25, w=16, h=14`；代码复制按钮标签也延伸至 `x=550.7`。无 overlay 控制截图显示页面根宽度保持 `375px`；示例代码内容由文档代码块容器裁切/横向滚动。故 `615px` 不构成产品页面溢出缺陷。

overlay 的 outline 节点使用 `pointer-events:none`，对应目标中心仍命中目标。Impeccable 自己的固定 banner 为 `x=0, y=0, w=375, h=36` 且 `pointer-events:auto`，会遮挡并拦截 VitePress 顶部品牌链接和移动菜单按钮的 hit-test；这是评估工具遮挡，不是产品页面状态。浅色、深色和窄屏截图及无 overlay 对照见 [`screenshots/`](screenshots/)。

## 运行边界

Playwright 与 Puppeteer 未安装，因此使用机器已有 Chrome，通过 CDP 完成注入与截图。为避免触碰仓库原有 live 状态，Impeccable live server 从 B 输出目录独立启动；其 health 显示 `hasProjectContext=false`。仓库没有 `.impeccable/config.json`、`config.local.json`、critique ignore、`DESIGN.md` 或 `PRODUCT.md`。因此浏览器 overlay 没有仓库级忽略/设计上下文；渲染命中已按实际 target bounds 和页面截图逐项区分。服务停止、Chrome/profile 清理及 4174 保持可用的证据见 [`service-lifecycle.md`](service-lifecycle.md)。

采集器首轮的几何序列化曾因采集脚本作用域错误中止，未产出视图；修正后完成三视图采集，并完成一次有界 375px 对照。失败轮次没有作为浏览器结果使用。
