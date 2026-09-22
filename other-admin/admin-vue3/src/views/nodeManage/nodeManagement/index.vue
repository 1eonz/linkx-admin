<script setup lang="ts">
/**
 * 节点管理（双 tab 容器）
 *
 * 功能：
 * - 双 tab 切换：服务器管理 / 客户端管理
 * - 使用 v-if 按需渲染子组件（切换 tab 时才挂载）
 */
import { ref } from 'vue';

import ClientManage from '../clientManage/index.vue';
import ServerManage from '../serverManage/index.vue';

defineOptions({ name: 'NodeManagement' });

const activeTab = ref<'server' | 'client'>('server');
</script>

<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card" class="node-tabs">
      <el-tab-pane label="服务器管理" name="server">
        <ServerManage v-if="activeTab === 'server'" />
      </el-tab-pane>
      <el-tab-pane label="客户端管理" name="client">
        <ClientManage v-if="activeTab === 'client'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="less" scoped>
.app-container {
  height: calc(100vh - 84px);
  overflow: hidden;

  .node-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;

      .el-tab-pane {
        height: 100%;
        overflow: auto;
      }
    }
  }
}
</style>
