# LxSidebar 侧边栏

警务业务协同平台的导航侧边栏，支持**展开（252px）**与**轨道（64px）**双形态，是全站布局的左侧锚点。

```vue
<script setup lang="ts">
import { LxSidebar } from 'lx-ui';
import { ref } from 'vue';

const mode = ref('expanded');
const activeKey = ref('dashboard');
const items = ref([
  { key: 'dashboard', title: '综合态势工作台', icon: 'dashboard' },
  {
    key: 'coop',
    title: '协同岗管理',
    icon: 'team',
    children: [
      { key: 'coop-setting', title: '协同岗设置' },
      { key: 'coop-monitor', title: '上下岗排班监控' },
    ],
  },
]);
</script>

<template>
  <LxSidebar v-model:mode="mode" v-model:active-key="activeKey" :items="items" />
</template>
```

## 何时使用 / 何时不用

**使用：**
- 后台管理端主布局（与 LxNavbar、LxTabsBar 组成壳层三件套）；
- 需要在"完整导航"（expanded）与"腾出内容空间"（rail）之间切换的场景，如 1366 笔记本、大屏指挥中心。

**不用：**
- H5 移动端主导航（用底部 tab 或抽屉，侧边栏仅以 `mobile` 抽屉形态被壳层复用）；
- 简单的二级设置页内导航（用 el-tabs 或 LxPageCard 内锚点即可，无需引入整个侧边栏）。

## 代码演示

### 基础用法

静态菜单 + 受控激活项。点击直达项触发 `select`，通常与 vue-router 联动（见 FAQ-1）。

<DemoContainer title="基础用法" description="静态菜单 + 受控激活项，默认 expanded 形态。" :src="() => import('./demo/basic.vue')" />

```vue
<!-- lx-ui/src/components/LxSidebar/demo/basic.vue -->
<script setup lang="ts">
// 演示：静态菜单 + 受控激活项
import { ref } from 'vue';
import { LxSidebar, type LxMenuItem } from 'lx-ui';

const activeKey = ref('dashboard');
const items: LxMenuItem[] = [
  { key: 'dashboard', title: '综合态势工作台', icon: 'dashboard' },
  {
    key: 'coop', title: '协同岗管理', icon: 'team',
    children: [
      { key: 'coop-setting', title: '协同岗设置' },
      { key: 'coop-monitor', title: '上下岗排班监控' },
      { key: 'coop-seat', title: '联勤席位标定' },
    ],
  },
  { key: 'duty', title: '勤务排班管理', icon: 'calendar' },
  { key: 'license', title: '系统与License配置', icon: 'setting' },
];

function onSelect(item: LxMenuItem) {
  console.log('select', item.key); // 实际业务中这里做 router.push
  if (item.path || !item.children) activeKey.value = item.key;
}
</script>

<template>
  <div style="height: 420px; position: relative">
    <LxSidebar :items="items" :active-key="activeKey" @select="onSelect" />
  </div>
</template>
```

### 轨道模式（rail）

`mode="rail"` 渲染 64px 图标轨道：hover 一级项弹 tooltip，hover 分组项弹二级 popper（源自 stitch_侧边栏 `_1` 规格）。适用于大屏指挥/内容优先场景。

<DemoContainer title="轨道模式" description="64px 图标轨道，hover 弹出二级菜单 popper。" :src="() => import('./demo/rail-mode.vue')" />

```vue
<!-- lx-ui/src/components/LxSidebar/demo/rail-mode.vue -->
<script setup lang="ts">
// 演示：rail 形态，底部仪表与 NODE 徽章为默认 footer
import { ref } from 'vue';
import { LxSidebar } from 'lx-ui';

const mode = ref('rail');
const items = [/* 同 basic */];
</script>

<template>
  <div style="height: 420px; position: relative">
    <LxSidebar v-model:mode="mode" :items="items" active-key="coop-setting" />
  </div>
</template>
```

### 双形态受控切换

`mode` 是受控 prop，用 `v-model:mode` 持久化用户偏好。底部 footer 的切换按钮触发 `update:mode`。

<DemoContainer title="双形态切换" description="v-model:mode 双向绑定 + localStorage 持久化。" :src="() => import('./demo/controlled.vue')" />

```vue
<!-- lx-ui/src/components/LxSidebar/demo/controlled.vue -->
<script setup lang="ts">
// 演示：形态受控切换 + 持久化（admin-vue3 实际接入模式）
import { ref } from 'vue';
import { LxSidebar, type LxSidebarMode } from 'lx-ui';

const mode = ref<LxSidebarMode>(
  (localStorage.getItem('sidebar-mode') as LxSidebarMode) || 'expanded'
);
function onModeChange(m: LxSidebarMode) {
  mode.value = m;
  localStorage.setItem('sidebar-mode', m);
}
</script>

<template>
  <div style="height: 420px; position: relative">
    <LxSidebar v-model:mode="mode" :items="items" @update:mode="onModeChange" />
  </div>
</template>
```

### 角标与预警

`LxMenuItem.badge + badgeType`：预警模块带红色数字角标（rail 态显示为小圆点，expanded 态显示数字）。

<DemoContainer title="角标" description="预警菜单红色角标，badgeType='error'。" :src="() => import('./demo/badge.vue')" />

```vue
<!-- lx-ui/src/components/LxSidebar/demo/badge.vue -->
<script setup lang="ts">
// 演示：预警角标（badgeType 决定颜色，rail 态自动退化为圆点）
import { LxSidebar } from 'lx-ui';

const items = [
  { key: 'dashboard', title: '综合态势工作台', icon: 'dashboard' },
  {
    key: 'alert', title: '预警与群组协同', icon: 'bell',
    badge: 4, badgeType: 'error',  // ← 未处理预警数
    children: [
      { key: 'alert-config', title: '预警流转配置' },
      { key: 'alert-group', title: '联动响应群组' },
    ],
  },
];
</script>

<template>
  <LxSidebar :items="items" active-key="alert-config" />
</template>
```

### 自定义品牌区与底部

`#brand` / `#footer` slot 完全接管（例如 admin-vue3 用真实 Logo 与 License 状态）。

<DemoContainer title="自定义插槽" description="#brand 与 #footer 插槽接管默认渲染。" :src="() => import('./demo/slots.vue')" />

```vue
<!-- lx-ui/src/components/LxSidebar/demo/slots.vue -->
<script setup lang="ts">
// 演示：slot 接管品牌区/底部（接入真实 License 状态）
import { LxSidebar } from 'lx-ui';
</script>

<template>
  <LxSidebar :items="items">
    <template #brand>
      <img src="/your-logo.svg" style="width: 28px" alt="logo" />
      <span>我的业务平台</span>
    </template>
    <template #footer>
      <div style="padding: 8px; color: var(--lx-text-secondary)">License 剩余 284 天</div>
    </template>
  </LxSidebar>
</template>
```

## API

### Props

| 名称 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| mode? | `'rail' \| 'expanded'` | `'expanded'` | 形态。expanded=252px 完整导航；rail=64px 图标轨道。支持 `v-model:mode` |
| items? | `LxMenuItem[]` | `[]` | 菜单树。业务方从权限菜单接口映射后传入（见 FAQ-1） |
| active-key? | `string` | — | 激活项 key，受控。建议绑定 `route.name` |
| expanded-keys? | `string[]` | — | 展开的二级组 keys（受控）；不传则组件内部自管理 |
| title? | `string` | `'警务业务协同平台'` | 品牌标题（rail 态自动隐藏） |
| mobile? | `boolean` | `false` | 移动端抽屉模式（overlay + 遮罩 + Esc 关闭） |
| show-footer? | `boolean` | `true` | 是否渲染底部状态区 |
| shadow? | `boolean` | `true` | expanded 态右侧投影（`_2` 风格） |

### Events

| 事件名 | 回调参数 | 说明 |
|---|---|---|
| update:mode | `(mode: LxSidebarMode)` | 形态切换（footer 按钮 / mobile 遮罩关闭不触发） |
| select | `(item: LxMenuItem)` | 点击**直达项或二级项**。分组标题点击不触发 |
| expand-change | `(keys: string[])` | 二级组展开状态变化 |

### Slots

| 插槽名 | 作用域参数 | 说明 |
|---|---|---|
| brand | — | 替换品牌区（默认渲染 LxSidebarBrand） |
| append | — | 菜单列表之后追加区块（如"常用快捷"） |
| footer | — | 替换底部状态区（默认渲染 LxSidebarFooter） |

### Expose

| 方法名 | 签名 | 说明 |
|---|---|---|
| toggleMode | `() => void` | 编程式切换形态 |
| toggleGroup | `(key: string) => void` | 展开/折叠指定二级组 |

## 类型定义

```ts
// packages/lx-ui/src/components/LxSidebar/types.ts
import type { LxSidebarMode, LxStatus } from 'lx-tokens';

export interface LxMenuItem {
  /** 唯一标识（约定为路由 name） */
  key: string;
  /** 显示标题 */
  title: string;
  /** svg 图标名（lx-ui 内置 sprite），直达项与分组项均建议配置 */
  icon?: string;
  /** 路由地址（直达项使用；分组项忽略） */
  path?: string;
  /** 二级菜单；为空即直达项 */
  children?: LxMenuItem[];
  /** 角标：数字显示计数，字符串显示文本；rail 态退化为圆点 */
  badge?: number | string;
  /** 角标语义色 */
  badgeType?: LxStatus;
  /** 置灰不可点 */
  disabled?: boolean;
  /** 业务透传（如权限标识 command），组件不消费 */
  meta?: Record<string, unknown>;
}

export type { LxSidebarMode };
```

## 设计说明

- 视觉规格执行 `DESIGN-SPEC.md` §3.5 侧边栏专项 token；双形态结构源自 `stitch_侧边栏/_1`（rail）与 `_2`（expanded）。
- 激活态：expanded 用渐变底 + 1px 发光竖条；rail 用左 0.5px 竖条 + 图标变亮。遵循原则 P5/P8（无多余阴影、token 化）。
- 二级菜单引导线 `#22354f` 为设计源定值。

## FAQ

**1. 如何与 vue-router + 权限菜单联动？**
组件只收 `items`，路由跳转由业务完成。admin-vue3 推荐接入模式：

```ts
// 业务侧：权限菜单 → LxMenuItem 映射（menuRouteMapper 迁移后的形态）
const menuItems = computed(() =>
  userStore.menus.map(function toLx(m) {
    return {
      key: m.name,
      title: m.title,
      icon: m.icon,
      path: m.path,
      children: m.children?.map(toLx),
      meta: { permission: m.permission }, // 组件原样透传
    };
  })
);
const activeKey = computed(() => route.name as string);
// <LxSidebar :items="menuItems" :active-key="activeKey" @select="i => i.path && router.push(i.path)" />
```

**2. rail 模式 hover popper 会被父容器 `overflow: hidden` 裁掉？**
popper 挂载到 `document.body`（内部用 el-tooltip popper 容器机制），不受父级裁剪影响。

**3. 为什么激活色是 sky 系（#38bdf8）而不是 primary（#0060a9）？**
深底上 primary 亮度不足缺乏"通电感"，设计源（stitch_侧边栏）明确使用 sky 系作为侧边栏激活色，token 见 `--lx-sidebar-active-glow`。全局品牌色仍是 `#0060a9`。

**4. 展开/收起动画？**
宽度过渡 `0.2s`（color-fade 同曲线）；文字使用 opacity 渐隐避免回流抖动。`prefers-reduced-motion` 下瞬时切换。
