⚠️ DEGRADED: single-context (CUA unavailable in subagent; Playwright Chromium fallback)

# Wave 6 Assessment B：LxTreeSelect / LxCascader

本报告仅记录独立 detector 与浏览器证据，没有读取 Assessment A 或综合报告。浏览器使用新建的 Playwright Chromium 页面；CUA 在当前子代理环境不可用，因此按 Critique 规则标记为降级运行。

## 取证范围

- linkx-fe/src/components/LxTreeSelect/index.vue
- linkx-fe/docs/components/lxtreeselect.md
- linkx-fe/src/components/LxCascader/index.vue
- linkx-fe/docs/components/lxcascader.md
- 对应 Demo 与组件样式文件仅用于浏览器交互和运行时状态核对。
- VitePress 独立服务：http://127.0.0.1:4191。
- Overlay 服务：http://127.0.0.1:8411/detect.js。每个最终视图都先设置 [Human] 标题、注入脚本并记录脚本标签、console 与请求 sidecar。

## 1. CLI detector

四个目标均执行：

    node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>

| 目标 | stdout JSON | stderr | 退出码 | 原始证据 |
|---|---|---|---:|---|
| TreeSelect 源码 | [] | 空 | 0 | detector-treeselect-source.stdout.json / .stderr.txt / .exitcode.txt |
| TreeSelect 文档 | [] | 空 | 0 | detector-treeselect-doc.stdout.json / .stderr.txt / .exitcode.txt |
| Cascader 源码 | [] | 空 | 0 | detector-cascader-source.stdout.json / .stderr.txt / .exitcode.txt |
| Cascader 文档 | [] | 空 | 0 | detector-cascader-doc.stdout.json / .stderr.txt / .exitcode.txt |

四个 stdout 均通过 JSON.parse 验证为有效数组，stderr 字节数为 0，退出码文件内容均为 0。因此这里的 [] 可以记为静态零命中；它只说明静态 detector 未命中规则，不代表运行时页面没有启发式信号。

## 2. 浏览器视图与交互

最终合并结果见 browser-result-final.json，请求汇总见 external-requests-summary-final.json。最终结果包含 12 个有效 capture，未保留未解决失败；每个 capture 有 PNG、.console.json、.requests.json 与 .meta.json。

### TreeSelect

- tree-desktop-bright-initial：亮色桌面初始态；aria-busy=false、触发器可用、页面无横向溢出。
- tree-single-open：单选弹层打开，展示杭州市公安局、滨江分局、长河派出所、高新园区分局、科技城派出所和禁用节点；弹层打开后焦点仍有可观察的组织选择输入。
- tree-multiple：切换多选后打开，回显“长河派出所”标签；桌面页面无横向溢出。
- tree-empty：切换空目录后打开，弹层显示“暂无数据”。
- tree-loading-immediate：在加载按钮后立即注入 overlay 并采样，aria-busy=true；这是 1.4 秒内存定时器的稳定 loading 证据。Element Plus 内核没有以 .is-loading 类呈现额外 spinner，组件仍通过宿主 wrapper 的忙碌语义暴露状态。
- tree-mobile-hud-keyboard：375×812、HUD 根类 dark lx-theme-hud、键盘 ArrowDown 打开弹层；可视弹层约 325px 宽且落在 375px 视口内。Playwright/CDP 的 layout viewport 在该视图报告 615px，而 body 仍为 375px，这一差异属于移动仿真限制，已保留在 meta。
- Demo 的禁用节点“离线专网（禁用）”在单选弹层中可见；当前采样记录了节点文本和 DOM class，但没有把展示类名误判为完整键盘语义通过。

### Cascader

- cascader-desktop-open：亮色桌面打开级联菜单，展示完整组织路径选项，弹层宽度约 542px。
- cascader-filter：输入“情指”后保留过滤输入值并显示过滤结果区域。
- cascader-clear：通过 Element Plus 实际 .icon-circle-close 清除图标清空路径，状态文字变为“已清空组织路径”。
- cascader-mobile-hud-reduced-motion：375×812，手工在页面根节点注入 dark lx-theme-hud 以验证没有 HUD Demo 开关时的根主题样式，并启用 prefers-reduced-motion: reduce。级联控件 transition/animation 均为 1e-05s；body 宽度保持 375px。
- cascader-keyboard：焦点输入后按 ArrowDown 打开菜单，随后按 Escape；当前 Element Plus 级联菜单仍可见，记录为键盘关闭路径风险。
- Cascader Demo 没有独立多选、loading 或 disabled 控件；这些状态无法从该 Demo 得出运行时通过结论。源码的 $attrs 透传能力和 TreeSelect 的多选/空态/loading/禁用节点分别有独立静态与浏览器证据。

## 3. Overlay console 与运行时信号

每个最终视图的 overlay 注入标签存在，console sidecar 收到 [impeccable] ... anti-patterns found。重复命中主要来自 VitePress 文档外壳、复制按钮、文档布局和字体启发式，不能直接归因于两个组件：

- buried-raster、layout-transition、first-viewport-column-overflow：反复落在 VitePress 外壳。
- low-contrast、overused-font：多出现在文档说明文字或默认文档主题。
- gpt-thin-border-wide-shadow：命中文档卡片/弹层外观，需要结合组件截图而不是按数量计缺陷。
- TreeSelect 打开态报告 clipped-overflow-container，定位到 Element Plus tooltip/popper 包装层；截图中弹层仍可见，但应继续核对长节点文本、窄屏和 tooltip 叠层。
- Cascader 桌面打开态报告 text-occlusion 与文档壳层规则；没有把它单独判为组件 P1，保留 sidecar 供后续人工复核。
- Cascader 375px HUD 视图的实测 popper rect 约 542px 宽、超过 375px 可视宽；同时出现 615px layout viewport 与 375px visual/body 宽度差异。它是移动弹层宽度风险，需在真实移动浏览器或更严格的容器约束下复验。

## 4. 网络与注入证据

external-requests-summary-final.json 汇总了所有最终与补充 capture sidecar：

- 总请求数：5698。
- 主机仅为 127.0.0.1:4191 与 127.0.0.1:8411。
- 外部请求数：0。
- 每个最终视图均有 .console.json、.requests.json、.meta.json 和 PNG；injectionState.scriptTag=true，说明脚本注入成功。

## 5. 失败与限制记录

- 首轮脚本把 .lx-tree-select__popper 作为唯一 locator，但 Element Plus 同时生成 tooltip wrapper 和 dropdown，触发 strict-mode 失败；对应原始记录保留在：
  - tree-single-open.failure.txt
  - tree-multiple.failure.txt
  - tree-empty.failure.txt
  - tree-mobile-hud-keyboard.failure.txt
- 首轮 Cascader 清除选择器使用 .el-input__clear，而当前 DOM 实际使用 .icon-circle-close；原始失败记录为 cascader-clear.failure.txt。补充脚本已用实际 DOM 选择器成功完成清空 capture，最终合并结果 failures 为 0。
- 首轮运行留下的 minimal.*、one.* 仅用于确认 overlay 注入和截图链路，不计入最终 12 个 capture。
- 当前 CUA 不可用，浏览器证据由 Playwright Chromium fallback 完成；这是本报告首行的 DEGRADED 原因。
- VitePress 和 overlay 服务已在取证完成后停止。未修改源码。

## 6. Assessment B 结论

静态 detector 的四个目标均为有效 []、空 stderr、退出码 0。浏览器证据覆盖 TreeSelect 的亮色/HUD、桌面/375px、单选/多选、空态、loading、禁用节点、焦点/键盘；覆盖 Cascader 的亮色、HUD 根主题注入、桌面/375px、过滤、清空、焦点/键盘和 reduced-motion。需要后续设计评审重点复核：

1. Cascader 移动端 popper 宽度在 375px 场景下可能超出可视宽度。
2. Cascader Escape 在当前打开级联菜单后没有关闭全部菜单。
3. TreeSelect popper 的 tooltip/dropdown 双层包装触发 clipped-overflow 启发式，长文本和窄屏应继续人工检查。
4. Cascader Demo 未提供多选/loading/disabled 交互控制，真实宿主场景仍需额外 E2E 覆盖。

以上结论仅代表本次独立 Assessment B 证据，不把 detector 的 [] 或 overlay 命中数量直接等同于整体设计通过。