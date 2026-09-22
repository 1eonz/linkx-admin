<script setup lang="ts">
import { computed } from 'vue';

import { useSettingsStore } from '@/store/modules/useSettingsStore';

defineOptions({ name: 'SidebarLogo' });

const settingsStore = useSettingsStore();
const systemName = computed(() => settingsStore.systemName);

// Logo 首字母（取 systemName 第一个字符，兜底为 'L'）
const logoInitial = computed(() => systemName.value.charAt(0) || 'L');
</script>

<template>
  <div class="sidebar-logo-container">
    <div class="sidebar-logo">
      <a class="sidebar-logo-link" href="/dashboard">
        <div class="logo-icon">{{ logoInitial }}</div>
        <span class="sidebar-logo-title">{{ systemName }}</span>
      </a>
    </div>
  </div>
</template>

<style lang="less" scoped>
.sidebar-logo-container {
  position: relative;
  height: @navbar-height;
  background-color: darken(@menu-bg, 4%);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 @spacing-md;
  border-bottom: 1px solid fade(@menu-active-text, 6%);

  .sidebar-logo {
    display: flex;
    align-items: center;
    height: 100%;

    .sidebar-logo-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: @menu-active-text;
    }

    // 对齐原型 sider-nav-bar.html：蓝色渐变方块 Logo
    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, @color-primary, @color-primary-dark-2);
      border-radius: @radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      color: @color-on-dark;
      font-weight: 700;
      font-size: @font-size-lg;
      flex-shrink: 0;
      box-shadow: 0 4px 12px fade(@color-primary, 35%);
    }

    .sidebar-logo-title {
      font-size: @font-size-md-plus;
      font-weight: @font-weight-semibold;
      color: @menu-active-text;
      opacity: 1;
      transition: opacity @transition-duration ease;
      white-space: nowrap;
    }
  }

  // 折叠时只显示 Logo 方块，文字渐隐
  .hideSidebar & {
    justify-content: center;
    padding: 0;

    .sidebar-logo-title {
      opacity: 0;
      pointer-events: none;
    }
  }
}
</style>
