<script setup lang="ts">
defineOptions({ name: 'Placeholder' });
</script>

<template>
  <div class="placeholder-container">
    <el-empty description="该页面待后续迭代迁移" />
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
