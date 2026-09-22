<script setup lang="ts">
/**
 * agentInterface/index.vue - AI 智能体对接
 *
 * 四 Tab 容器：
 * 1. 系统设置（AgentConfig）：部署/审批/导入导出
 * 2. 智能体管理（AgentManage）：列表 + 编辑弹窗
 * 3. 查询明细（AgentHistory）：记录列表 + 详情 + 导出
 * 4. 文件接口（AgentFile）：CRUD
 *
 * AI Agent 接口管理：
 * - 分离部署模式下，点击其他 Tab 不在当前页加载，而是 window.open 跳转到分离的前端服务
 * - AgentConfig 触发 deploy-mode-change 事件时，父组件记录 separatedDeploy + groupAiFrontendHost
 * - beforeLeave 钩子拦截 Tab 切换
 */
import { ref } from 'vue';

import AgentConfig from './components/AgentConfig.vue';
import AgentFile from './components/AgentFile.vue';
import AgentHistory from './components/AgentHistory.vue';
import AgentManage from './components/AgentManage.vue';

defineOptions({ name: 'AgentInterface' });

type TabName = 'config' | 'manage' | 'history' | 'file';

const activeTab = ref<TabName>('config');

/** 分离部署模式相关状态 */
const separatedDeploy = ref(false);
const frontendHost = ref('');

/** Tab name -> 分离部署跳转路径映射 */
const PATH_MAP: Record<Exclude<TabName, 'config'>, string> = {
  manage: '/layout/agent',
  history: '/layout/queryStatistics',
  file: '/layout/agentFile',
};

/**
 * beforeLeave 钩子：分离部署模式下拦截 Tab 切换，改为 window.open 跳转
 * @returns false 阻止切换，true/undefined 允许切换
 */
function beforeLeave(activeName: string | number): boolean | undefined {
  const name = String(activeName);
  if (separatedDeploy.value && name !== 'config') {
    const baseUrl = frontendHost.value.replace(/\/$/, '');
    const path = PATH_MAP[name as Exclude<TabName, 'config'>] ?? '';
    const fullPath = baseUrl + path;
    window.open(fullPath, '_blank');
    return false;
  }
  return true;
}

/** AgentConfig 部署模式变化回调 */
function handleDeployModeChange(payload: { separatedDeploy: boolean; groupAiFrontendHost: string }): void {
  separatedDeploy.value = payload.separatedDeploy;
  frontendHost.value = payload.groupAiFrontendHost;
  // 开启分离部署时强制回到系统设置 Tab
  if (payload.separatedDeploy) {
    activeTab.value = 'config';
  }
}

/** 导入成功回调（刷新 AgentManage 列表，需组件暴露 fetchData） */
const agentManageRef = ref<InstanceType<typeof AgentManage> | null>(null);
function handleImportSuccess(): void {
  // 调用子组件暴露的刷新方法（若存在）
  (agentManageRef.value as unknown as { fetchData?: () => void })?.fetchData?.();
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card" :before-leave="beforeLeave">
        <el-tab-pane label="系统设置" name="config">
          <AgentConfig
            v-if="activeTab === 'config'"
            @deploy-mode-change="handleDeployModeChange"
            @import-success="handleImportSuccess"
          />
        </el-tab-pane>
        <el-tab-pane label="智能体管理" name="manage">
          <AgentManage v-if="activeTab === 'manage'" ref="agentManageRef" />
        </el-tab-pane>
        <el-tab-pane label="查询明细" name="history">
          <AgentHistory v-if="activeTab === 'history'" />
        </el-tab-pane>
        <el-tab-pane label="文件接口" name="file">
          <AgentFile v-if="activeTab === 'file'" />
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
