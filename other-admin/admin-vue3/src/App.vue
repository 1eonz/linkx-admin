<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
</script>

<template>
  <!-- 全局配置：locale 中文 + size large（让所有 Element 组件尺寸放大，提升可读性与点击体验） -->
  <ElConfigProvider :locale="zhCn" size="large">
    <router-view />
  </ElConfigProvider>
</template>
