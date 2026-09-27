# LxIcon 图标总览

内置 SVG 图标集：24×24 画布 / stroke 1.5 / round cap，`currentColor` 继承文字色（跟随文字颜色，无需单独传色）。**点击图标卡片复制完整用法代码** `<LxIcon name="xxx" :size="20" />`。

Hover/focus 微动效采用自然减速曲线；warning 与 email 仍保留短促的语义反馈，不使用弹性回弹。系统启用减少动效时停用图标运动。

## 使用

```vue
<LxIcon name="shield" :size="20" />
```

尺寸规范三档：`16` / `18` / `20`（默认 18，DESIGN-SPEC §6）。组件库导出由 `LX_ICONS` 键自动推导的 `LxIconName`，菜单配置和业务常量应使用该类型收敛图标名。

## 图标列表（94 个图形，96 个可用名称）

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  LxIcon,
  LX_ICON_29_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
  lxMessage,
  type LxIconName,
} from '../../src';

interface IconGroup { title: string; names: LxIconName[] }

const MOTION_CHECKLISTS = [
  { title: 'P0 高频核心', names: LX_ICON_P0_NAMES },
  { title: 'P1 业务语义', names: LX_ICON_P1_NAMES },
  { title: '29 枚扩展', names: LX_ICON_29_NAMES },
];

const GROUPS: IconGroup[] = [
  {
    title: '侧边栏菜单',
    names: ['dashboard', 'team', 'bell', 'calendar', 'setting', 'shield', 'cube', 'server', 'key', 'map-pin', 'camera', 'alert'],
  },
  {
    title: '交互',
    names: ['chevron-down', 'chevron-right', 'chevron-left', 'chevrons-left', 'check', 'search', 'x', 'menu', 'user', 'pulse'],
  },
  {
    title: '反馈提示',
    names: ['circle-check', 'circle-x', 'circle-alert', 'report'],
  },
  {
    title: 'P0 高频核心',
    names: ['delete', 'edit', 'plus', 'refresh', 'undo', 'download', 'upload', 'eye', 'loading', 'more', 'folder', 'folder-open', 'warning'],
  },
  {
    title: 'P1 业务语义',
    names: ['people', 'file', 'file-check', 'star', 'tag', 'image', 'video', 'mobile', 'link', 'share', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'caret-down', 'close', 'switch', 'power', 'clock', 'grid', 'list', 'copy', 'phone', 'email', 'lock', 'unlock'],
  },
  {
    title: 'P2 通用补充',
    names: ['minus', 'eye-off', 'filter', 'sort', 'fullscreen', 'fullscreen-exit', 'printer', 'info', 'circle-question', 'history', 'message', 'password', 'id-card', 'logout', 'home', 'language', 'screenshot', 'wifi', 'cloud', 'database', 'terminal', 'cpu', 'pin', 'zoom-in', 'zoom-out', 'drag', 'save', 'export', 'location-arrow'],
  },
  {
    title: '兼容别名',
    names: ['date', 'eye-on'],
  },
];

// 兜底：icons.ts 中新增但未登记分组的图标自动收进「其他」，保证总览永不缺漏
const grouped = new Set<LxIconName>(GROUPS.flatMap((g) => g.names));
const others = LX_ICON_NAMES.filter((name) => !grouped.has(name));
if (others.length) GROUPS.push({ title: '其他', names: others });

const keyword = ref('');
const visibleGroups = computed(() =>
  GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => n.includes(keyword.value.trim())) })).filter((g) => g.names.length),
);

async function copy(name: LxIconName) {
  const snippet = `<LxIcon name="${name}" :size="20" />`;
  try {
    await navigator.clipboard.writeText(snippet);
    lxMessage.success(`已复制：${snippet}`);
  } catch {
    lxMessage.error('复制失败，请手动复制代码');
  }
}
</script>

<input v-model="keyword" class="icon-search" type="text" aria-label="筛选图标名称" placeholder="输入关键字过滤，如：check / chevron / circle" />

<template v-for="g in visibleGroups" :key="g.title">
  <h3 class="icon-group-title">{{ g.title }}（{{ g.names.length }}）</h3>
  <div class="icon-grid">
    <button v-for="n in g.names" :key="n" class="icon-tile" type="button" :aria-label="`复制 ${n} 图标用法`" @click="copy(n)">
      <LxIcon :name="n" :size="20" />
      <span class="icon-tile__name">{{ n }}</span>
    </button>
  </div>
</template>

<p v-if="!visibleGroups.length" class="icon-empty">无匹配图标</p>

## 设计清单覆盖

三份参考清单逐项对应标准图形或兼容别名；去重后共有 {{ LX_ICON_MOTION_NAMES.length }} 个动效名称。

<table>
  <thead>
    <tr><th>清单</th><th>数量</th><th>名称</th></tr>
  </thead>
  <tbody>
    <tr v-for="list in MOTION_CHECKLISTS" :key="list.title">
      <td>{{ list.title }}</td>
      <td>{{ list.names.length }}</td>
      <td><code>{{ list.names.join('、') }}</code></td>
    </tr>
    <tr>
      <th>去重合计</th>
      <td>{{ LX_ICON_MOTION_NAMES.length }}</td>
      <td>别名按独立可用名称计数，动效复用标准图形。</td>
    </tr>
  </tbody>
</table>

## 新增图标

在 `src/components/LxIcon/icons.ts` 的 `LX_ICONS` 中按组追加图形，键为 kebab-case 名称，值为 24×24 viewBox 的 SVG path 数组。仅当设计或业务契约存在同义旧名称时，才在 `LX_ICON_ALIASES` 中映射到标准图形；`LxIconName` 和本页总览会同时包含标准键与别名。

## 兼容别名

| 名称     | 标准图形   | 来源      | 说明                                       |
| -------- | ---------- | --------- | ------------------------------------------ |
| `date`   | `calendar` | P1 清单   | 保留设计文档名称，复用已有日历图形。       |
| `eye-on` | `eye`      | 29 枚清单 | 与现有可见状态图形同义，避免新增重复路径。 |

业务存量值 `calendar`、`eye` 仍可照常使用；别名不会改变它们的序列化值。

<style>
.icon-search {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
  min-width: 280px;
  margin-bottom: 4px;
  outline: none;
}
.icon-search:focus {
  border-color: var(--lx-color-primary);
}
.icon-group-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--lx-text-primary);
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.icon-tile {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 84px;
  padding: 14px 4px 10px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}
.icon-tile:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
  box-shadow: var(--lx-shadow-pop);
}
.vp-doc .icon-grid .icon-tile:focus-visible {
  border: 2px solid var(--lx-color-primary);
  outline: none;
}
.icon-tile:active {
  transform: scale(0.98);
}
.icon-tile__name {
  font-size: 11px;
  font-family: var(--lx-font-mono);
  color: inherit;
}
.icon-empty {
  padding: 24px 0;
  color: var(--lx-text-secondary);
  font-size: 13px;
  text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .icon-tile {
    transition: none;
  }
}
</style>
