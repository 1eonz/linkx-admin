<script setup lang="ts">
// demo：双形态受控切换 — v-model:mode + localStorage 持久化（admin-vue3 接入模式）
import { onMounted, ref } from 'vue';
import { LxSidebar, type LxSidebarMode, type LxMenuItem } from '../../../index';

const STORAGE_KEY = 'lx-sidebar-mode';

// SSR 安全：初始值固定，客户端挂载后再读 localStorage
const mode = ref<LxSidebarMode>('expanded');

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY) as LxSidebarMode | null;
  if (saved) mode.value = saved;
});

const items: LxMenuItem[] = [
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
  { key: 'license', title: '系统与License配置', icon: 'key' },
];

function onModeChange(m?: LxSidebarMode) {
  // mode 值更新由 v-model 完成，这里只做持久化
  if (m) localStorage.setItem(STORAGE_KEY, m);
}
</script>

<template>
  <div style="height: 560px; position: relative; display: flex">
    <LxSidebar v-model:mode="mode" :items="items" active-key="coop-setting" @update:mode="onModeChange" />
    <div style="flex: 1; background: var(--lx-bg-page); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--lx-text-secondary)">
      <p>当前形态：{{ mode }}</p>
      <p style="font-size: 12px">点击侧边栏底部按钮切换（已持久化到 localStorage）</p>
    </div>
  </div>
</template>
