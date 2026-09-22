<script setup lang="ts">
/**
 * h5/quick/index.vue - 标签管理
 *
 * 双 Tab 容器：
 * 1. 标签查看（LookLabel）：左侧标签树 + 右侧选中标签节点下的警员列表
 * 2. 标签编辑（TreeLabel）：标签树增删改
 *
 * Tab 切换时通过 :key 强制重建子组件（对齐项目 unifiedComm 模块的 tabPaneKey 机制），
 * 保证每次切回都重新拉取数据、重置内部状态。
 */
import { ref } from 'vue';

import LookLabel from './LookLabel.vue';
import TreeLabel from './TreeLabel.vue';

defineOptions({ name: 'QuickGroup' });

const activeTab = ref<'look' | 'tree'>('look');
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
        <el-tab-pane label="标签查看" name="look">
          <LookLabel v-if="activeTab === 'look'" :key="`look-${tabPaneKey}`" />
        </el-tab-pane>
        <el-tab-pane label="标签编辑" name="tree">
          <TreeLabel v-if="activeTab === 'tree'" :key="`tree-${tabPaneKey}`" />
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
