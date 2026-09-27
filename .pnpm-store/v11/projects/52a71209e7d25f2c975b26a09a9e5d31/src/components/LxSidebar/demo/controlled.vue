<script setup lang="ts">
// demo：双形态受控切换 — v-model:mode + localStorage 持久化（admin-vue3 接入模式）
import { onMounted, ref } from 'vue'
import { LxSidebar, type LxSidebarMode, type LxMenuItem } from '../../../index'

const STORAGE_KEY = 'lx-sidebar-mode'

// SSR 安全：初始值固定，客户端挂载后再读 localStorage
const mode = ref<LxSidebarMode>('expanded')
const mobileOpen = ref(false)
const hudTheme = ref(false)

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY) as LxSidebarMode | null
  if (saved) mode.value = saved
})

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
]

function onModeChange(m?: LxSidebarMode) {
  // mode 值更新由 v-model 完成，这里只做持久化
  if (m) localStorage.setItem(STORAGE_KEY, m)
}
</script>

<template>
  <div
    class="sidebar-demo"
    :class="{ 'lx-theme-hud': hudTheme }"
    style="
      height: 560px;
      max-width: 100%;
      position: relative;
      display: flex;
      box-sizing: border-box;
    "
  >
    <LxSidebar
      v-model:mode="mode"
      :items="items"
      active-key="coop-setting"
      @update:mode="onModeChange"
    />
    <div
      style="
        flex: 1;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
        background: var(--lx-bg-page);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--lx-text-secondary);
      "
    >
      <label
        style="min-height: 44px; display: flex; align-items: center; gap: 8px"
      >
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
      <p>当前形态：{{ mode }}</p>
      <p style="font-size: 12px">
        点击侧边栏底部按钮切换（已持久化到 localStorage）
      </p>
      <button
        type="button"
        style="
          min-height: 44px;
          max-width: 100%;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid var(--lx-border);
          border-radius: var(--lx-radius-md);
          background: var(--lx-bg-surface);
          color: var(--lx-text-primary);
          cursor: pointer;
        "
        @click="mobileOpen = true"
      >
        打开移动端导航
      </button>
      <LxSidebar
        v-if="mobileOpen"
        v-model:mobile="mobileOpen"
        :items="items"
        active-key="coop-setting"
        :show-footer="false"
      />
    </div>
  </div>
</template>
