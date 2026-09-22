<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useAppStore } from '@/store/modules/useAppStore';
import { useKeepAliveStore } from '@/store/modules/useKeepAliveStore';

defineOptions({ name: 'AppMain' });

const route = useRoute();
const appStore = useAppStore();

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
  // 用 height 而非 min-height，让子组件可以 height: 100% 撑满
  // padding 由各页面的 .app-container 自行管理（默认 @spacing-md）
  height: calc(100vh - @navbar-height);
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}
</style>
