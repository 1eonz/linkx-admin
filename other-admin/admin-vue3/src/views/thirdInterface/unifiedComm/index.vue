<script setup lang="ts">
/**
 * unifiedComm/index.vue - ICP 通信服务管理
 *
 * 双 Tab 容器：
 * 1. 通信服务服务器配置（IcpServerConfig）：服务/节点配置
 * 2. 通信服务授权管理（IcpAuthManage）：部门树 + 人员列表 + 行级/批量授权
 *
 * Tab 切换时通过 :key 强制重建子组件
 */
import { ref } from 'vue';

import IcpAuthManage from './components/IcpAuthManage.vue';
import IcpServerConfig from './components/IcpServerConfig.vue';

defineOptions({ name: 'UnifiedComm' });

const activeTab = ref<'serverConfig' | 'authManage'>('serverConfig');
/** Tab 切换时通过修改 key 强制重建子组件 */
const tabPaneKey = ref(Date.now());

function handleTabClick(): void {
  tabPaneKey.value = Date.now();
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
        <el-tab-pane label="通信服务服务器配置" name="serverConfig">
          <IcpServerConfig v-if="activeTab === 'serverConfig'" :key="`serverConfig-${tabPaneKey}`" />
        </el-tab-pane>
        <el-tab-pane label="通信服务授权管理" name="authManage">
          <IcpAuthManage v-if="activeTab === 'authManage'" :key="`authManage-${tabPaneKey}`" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
