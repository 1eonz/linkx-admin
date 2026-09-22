<script setup lang="ts">
/**
 * thirdInterface/app/index.vue - 三方对接 - 应用管理模块入口
 *
 * 功能特性：
 * 1. 双 Tab 容器：分类管理 + 应用管理
 * 2. 应用管理：维护应用列表、上架状态、应用图标、可见范围
 * 3. 分类管理：维护应用分类、分类下绑定的应用、分类排序
 *
 * @example 路由配置
 * ```ts
 * { path: '/thirdInterface/app', component: () => import('@/views/thirdInterface/app/index.vue') }
 * ```
 */
import { ref } from 'vue';

import AppManage from './components/AppManage.vue';
import GroupManage from './components/GroupManage.vue';

defineOptions({ name: 'ThirdInterfaceApp' });

/** 当前激活的 Tab：group-分类管理、app-应用管理（默认分类管理） */
const activeTab = ref<'group' | 'app'>('group');
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 分类管理 Tab -->
        <el-tab-pane label="分类管理" name="group">
          <GroupManage v-if="activeTab === 'group'" />
        </el-tab-pane>
        <!-- 应用管理 Tab -->
        <el-tab-pane label="应用管理" name="app">
          <AppManage v-if="activeTab === 'app'" />
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
