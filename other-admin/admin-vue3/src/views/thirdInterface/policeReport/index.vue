<script setup lang="ts">
/**
 * thirdInterface/policeReport/index.vue - 三方对接 - 警单平台模块入口
 *
 * 功能特性：
 * 1. 三 Tab 容器：警单对接 + 警单管理 + 类型管理
 * 2. 警单对接：维护对接配置（系统名/IP/路径/脚本等），支持启用/禁用
 * 3. 警单管理：查看警单列表及详情
 * 4. 类型管理：维护警单类型标签
 *
 * @example 路由配置
 * ```ts
 * { path: '/thirdInterface/policeReport', component: () => import('@/views/thirdInterface/policeReport/index.vue') }
 * ```
 */
import { ref } from 'vue';

import DockManage from './components/DockManage.vue';
import TicketManage from './components/TicketManage.vue';
import TypeManage from './components/TypeManage.vue';

defineOptions({ name: 'ThirdInterfacePoliceReport' });

/** 当前激活的 Tab：dock-警单对接、ticket-警单管理、type-类型管理 */
const activeTab = ref<'dock' | 'ticket' | 'type'>('dock');
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 警单对接 Tab -->
        <el-tab-pane label="警单对接" name="dock">
          <DockManage v-if="activeTab === 'dock'" />
        </el-tab-pane>
        <!-- 警单管理 Tab -->
        <el-tab-pane label="警单管理" name="ticket">
          <TicketManage v-if="activeTab === 'ticket'" />
        </el-tab-pane>
        <!-- 类型管理 Tab -->
        <el-tab-pane label="类型管理" name="type">
          <TypeManage v-if="activeTab === 'type'" />
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
