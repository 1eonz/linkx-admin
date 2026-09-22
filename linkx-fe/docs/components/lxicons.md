# LxIcon 图标总览

内置 SVG 图标集：24×24 画布 / stroke 1.5 / round cap，`currentColor` 继承文字色（跟随文字颜色，无需单独传色）。**点击图标卡片复制完整用法代码** `<LxIcon name="xxx" :size="20" />`。

## 使用

```vue
<LxIcon name="shield" :size="20" />
```

尺寸规范三档：`16` / `18` / `20`（默认 18，DESIGN-SPEC §6）。名称类型为 `LxIconName`（由 `LX_ICONS` 键自动推导，传错名 TS 直接报错）。

## 图标列表（共 26 个）

<script setup lang="ts">
import { computed, ref } from 'vue';
import { LxIcon, LX_ICONS, lxMessage } from '../../src';

const GROUPS: { title: string; names: string[] }[] = [
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
];

// 兜底：icons.ts 中新增但未登记分组的图标自动收进「其他」，保证总览永不缺漏
const grouped = new Set(GROUPS.flatMap((g) => g.names));
const others = Object.keys(LX_ICONS).filter((n) => !grouped.has(n));
if (others.length) GROUPS.push({ title: '其他', names: others });

const keyword = ref('');
const visibleGroups = computed(() =>
  GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => n.includes(keyword.value.trim())) })).filter((g) => g.names.length),
);

async function copy(name: string) {
  const snippet = `<LxIcon name="${name}" :size="20" />`;
  try {
    await navigator.clipboard.writeText(snippet);
    lxMessage.success(`已复制：${snippet}`);
  } catch {
    lxMessage.error('复制失败，请手动复制代码');
  }
}
</script>

<input v-model="keyword" class="icon-search" type="text" placeholder="输入关键字过滤，如：check / chevron / circle" />

<template v-for="g in visibleGroups" :key="g.title">
  <h3 class="icon-group-title">{{ g.title }}（{{ g.names.length }}）</h3>
  <div class="icon-grid">
    <button v-for="n in g.names" :key="n" class="icon-tile" type="button" @click="copy(n)">
      <LxIcon :name="n" :size="20" />
      <span class="icon-tile__name">{{ n }}</span>
    </button>
  </div>
</template>

<p v-if="!visibleGroups.length" class="icon-empty">无匹配图标</p>

## 新增图标

在 `src/components/LxIcon/icons.ts` 的 `LX_ICONS` 中按组追加一条：键为图标名（kebab-case），值为 SVG path 数组（`M...` 指令串，viewBox 24×24）。`LxIconName` 类型自动收敛，本页总览自动收录（未登记分组会进「其他」）。

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 4px 10px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  transition: all 0.2s;
}
.icon-tile:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
  box-shadow: var(--lx-shadow-pop);
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
</style>
