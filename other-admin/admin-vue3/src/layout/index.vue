<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';

import AppMain from './components/AppMain.vue';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar/index.vue';
import { useAppStore } from '@/store/modules/useAppStore';

defineOptions({ name: 'Layout' });

const appStore = useAppStore();

const sidebar = computed(() => appStore.sidebar);
const device = computed(() => appStore.device);
const fixedHeader = computed(() => false); // 暂不开启固定头部

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile',
}));

function handleClickOutside(): void {
  appStore.closeSideBar(false);
}

// 响应式监听：
// - < 768：真正移动端，切换为 mobile 设备 + 强制折叠 + 抽屉模式
// - 768 ≤ width < 1366：窄屏笔记本（如 1366×768），桌面端但折叠侧边栏腾出空间
// - ≥ 1366：标准桌面，默认展开侧边栏
// 992px 阈值过激进，1366px 笔记本需保留侧边栏可用
const { body } = document;
const MOBILE_WIDTH = 768;
const NARROW_DESKTOP_WIDTH = 1366;

function handleResize(): void {
  const rect = body.getBoundingClientRect();
  if (rect.width - 1 < MOBILE_WIDTH) {
    appStore.toggleDevice('mobile');
    appStore.closeSideBar(true);
  } else {
    appStore.toggleDevice('desktop');
    // 窄屏笔记本自动折叠侧边栏（1366×768 等），避免表格/弹窗水平溢出
    if (rect.width - 1 < NARROW_DESKTOP_WIDTH) {
      appStore.closeSideBar(false);
    } else if (!appStore.sidebar.opened) {
      // 标准桌面默认展开（避免 cookie 残留 '0' 导致一直折叠）
      appStore.openSideBar();
    }
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }">
        <Navbar />
      </div>
      <AppMain />
    </div>
  </div>
</template>
