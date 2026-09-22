---
layout: home
hero:
  name: LxUI
  text: LinkX 业务组件库
  tagline: Vue3 · Element Plus 二次封装 · lx-tokens 设计令牌驱动 · HUD/亮色双主题
  actions:
    - theme: brand
      text: 开始使用
      link: /components/lxsidebar
features:
  - title: Pro 层封装
    details: 基于 Element Plus 二次封装（表格/分页/树），fixed 列、排序、懒加载等能力原生透传
  - title: 令牌驱动
    details: 全部样式走 var(--lx-*) CSS 变量，运行时切换 HUD 深色 / 常规亮色零残缺
  - title: 数据无关
    details: 组件纯受控零请求依赖，请求逻辑留在业务侧 useTable composable
  - title: 自带 Element Plus
    details: EP 是 lx-ui 的 dependencies，安装 lx-ui 即可直接使用 ElButton/ElMessage 等，无需单独安装
---

## 快速接入

```bash
pnpm add lx-ui
```

```ts
// main.ts — 两行完成接入
import { createApp } from 'vue';
import LxUI, { ElementPlus } from 'lx-ui';   // ElementPlus 直接从 lx-ui 导入
import 'lx-ui/style.css';                     // EP 全量样式 + Lx 令牌/桥接/组件样式，一行搞定

createApp(App).use(ElementPlus).use(LxUI).mount('#app');
```

说明：

- **element-plus 是 lx-ui 的 `dependencies`**：宿主项目安装 lx-ui 后自动携带 EP，`ElButton` / `ElSelect` / `ElMessage` / `ElementPlus` 插件与全部类型均可从 `lx-ui` 入口直接导入，pnpm 严格模式下同样可用。
- **EP 保持单例**：构建时 EP 已 external，宿主项目（即使自己也装了 EP）与 lx-ui 内部共享同一 `node_modules` 实例，无双实例冲突。
- **不引整合样式也行**：分别引入 `element-plus/dist/index.css` 与 `lx-ui/dist/lx-ui.css` 等效；按需样式的宿主可只引 `lx-ui/dist/lx-ui.css`。
- **vue 是 peerDependencies**：宿主项目需自带 Vue 3.4+。
