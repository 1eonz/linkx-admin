<script setup lang="ts">
/**
 * 数据管理（双 tab 容器）
 *
 * 功能：
 * - 双 tab 切换：出局（本机作为客户端连对端服务器）/ 入局（本机作为服务器接受客户端接入）
 * - 使用 v-if 按需渲染子组件（切换 tab 时才挂载）
 */
import { ref } from 'vue';

import InboundData from '../inboundData/index.vue';
import OutboundData from '../outboundData/index.vue';

defineOptions({ name: 'DataManage' });

const activeTab = ref<'outbound' | 'inbound'>('outbound');
</script>

<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card" class="node-tabs">
      <el-tab-pane label="出局" name="outbound">
        <OutboundData v-if="activeTab === 'outbound'" />
      </el-tab-pane>
      <el-tab-pane label="入局" name="inbound">
        <InboundData v-if="activeTab === 'inbound'" />
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
