<script setup lang="ts">
import { LxEmpty } from 'lx-ui';

defineOptions({ name: 'Placeholder' });
</script>

<template>
  <div class="placeholder-container">
    <LxEmpty description="该页面尚未实现，待后续模块迁移后补充" />
  </div>
</template>

<style lang="less" scoped>
.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 100px);
}
</style>
