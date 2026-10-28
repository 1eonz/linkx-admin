<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useKeepAliveStore } from '@/store/modules/useKeepAliveStore';

defineOptions({ name: 'AppMain' });

const route = useRoute();

const cachedViews = computed(() => useKeepAliveStore().cachedViews);
const key = computed(() => route.path);
</script>

<template>
  <section class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="key" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<style lang="less" scoped>
.app-main {
  // 主区由布局分配顶栏后的剩余高度，兼容顶栏换行及错误提示。
  // min-height: 0 保持滚动在主区内部，页面仍可按 height: 100% 撑满。
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}
</style>
