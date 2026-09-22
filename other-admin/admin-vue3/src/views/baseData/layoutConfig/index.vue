<script setup lang="ts">
/**
 * baseData/layoutConfig/index.vue - 布局配置
 *
 * 功能特性：
 * 1. 4 个 Tab：公共设置 / App H5设置 / PC端设置 / 运维统计
 * 2. 切换 Tab 时通过 `:key="tabName-timestamp"` 强制重建子组件，避免组件内部状态污染
 * 3. 子组件独立管理自身的数据拉取/保存逻辑
 */
import type { Component } from 'vue';
import { ref, watch } from 'vue';

import AppH5Config from './components/AppH5Config.vue';
import CommonConfig from './components/CommonConfig.vue';
import OpsStatistic from './components/OpsStatistic.vue';
import PcConfig from './components/PcConfig.vue';

defineOptions({ name: 'LayoutConfig' });

/** Tab 类型 */
type TabName = 'common' | 'appH5' | 'pc' | 'ops';

/** 当前激活 Tab */
const activeTab = ref<TabName>('common');

/** 各 Tab 的 key（每次切换追加 timestamp，强制重建子组件） */
const tabKeys = ref<Record<TabName, string>>({
  common: 'common',
  appH5: 'appH5',
  pc: 'pc',
  ops: 'ops',
});

/** Tab 配置项 */
const tabs: Array<{ name: TabName; label: string; comp: Component }> = [
  { name: 'common', label: '公共设置', comp: CommonConfig },
  { name: 'appH5', label: 'App H5设置', comp: AppH5Config },
  { name: 'pc', label: 'PC端设置', comp: PcConfig },
  { name: 'ops', label: '运维统计', comp: OpsStatistic },
];

/** 切换 Tab 时刷新对应子组件 key */
watch(activeTab, (newVal) => {
  if (newVal) {
    tabKeys.value[newVal] = `${newVal}-${Date.now()}`;
  }
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <!-- 切换 Tab 时通过 timestamp 强制重建子组件 -->
          <component :is="tab.comp" :key="tabKeys[tab.name]" />
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
