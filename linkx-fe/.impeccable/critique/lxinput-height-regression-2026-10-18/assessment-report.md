# LxInput 前后缀高度回归复验

## 审查来源

本次采用双代理隔离评估：Assessment A 负责设计审查，Assessment B 负责 detector 和浏览器证据。两路未互相读取结果。

## Assessment A：设计审查

- 得分：**33/40（Good）**。
- 设计特异性：LinkX 警务字段、编码等宽字体、HUD 令牌和中文语义使组件具有明确产品特征。
- 运行时确认：桌面 sm/md/lg 为 28/32/40px；390px 触屏档位统一为 44px；复合 prepend、输入内框、append 及 prefix/suffix 槽位上下边界对齐；焦点环、HUD 主题和 reduced-motion 生效；页面无横向溢出。
- P2：移动端三个尺寸选项最终都呈现 44px，Demo 仍显示 28/32/40px 文案，可能让用户误解尺寸差异。
- P2：纯文本 prepend/append 看起来像可操作区，但当前没有交互语义；建议后续明确为标签/分隔块或补充语义说明。
- P2：文档 Demo 在窄屏先展示较长说明与代码，实际交互区发现成本偏高。

## Assessment B：detector 与浏览器证据

- 目标：`linkx-fe/src/components/LxInput/index.vue`。
- detector stdout：合法 JSON `[]`。
- detector stderr：空。
- detector 退出码：`0`。
- 浏览器视图：Light/HUD × 1280/375，共 4/4 视图注入成功；375px 视图启用 reduced-motion。
- 页面错误：0；失败请求：0；所有视图 `scrollWidth === clientWidth`。
- 几何证据：桌面输入根、内框和 prefix/suffix 轨道为 32px；移动复合根、输入、prefix/suffix、prepend/append 均为 44px，边界完全重合。
- detector overlay 命中 `#929295/#f6f6f7`、`#22863a/#f6f6f7`、`#d73a49/#f6f6f7` 低对比度，均来自 VitePress 文档壳层或 Shiki 代码高亮；未归因到 LxInput 组件令牌。
- 浏览器另有原生密码字段未置于 form 的 warning，属于 Demo 文档壳层语义待后续处理，不影响本次高度修复。

## 综合结论

本轮将 prefix/suffix 及内部槽位从父级 `height: 100%` 收敛为直接读取 `--lx-input-track-height`，已解决用户反馈的输入框与前后缀上下边界不一致风险。未发现 P0/P1 组件缺陷，不增加 UI-10 严格矩阵关闭数。静态 `[]` 仅代表 detector 零命中，不能单独替代浏览器和设计评审。

## 验证

- 复合前后缀 Playwright：1/1。
- `lx-input.test.ts`：13/13。
- lx-ui `pnpm run typecheck`、`pnpm run build`、`pnpm run build:docs`：通过。
- Vue3 E2E ESLint、目标 Prettier、`git diff --check`：通过。
