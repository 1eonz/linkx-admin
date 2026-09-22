<script setup lang="ts">
/**
 * OutboundData - 出向数据管理
 *
 * 功能：
 * - 分页查询服务器列表（ProTable 受控模式，复用 getServers 接口）
 * - 无搜索区，无新增按钮
 * - 点击「授权」打开 GrantConfigDialog 配置出向数据授权
 * - 5 秒定时静默刷新列表（保持当前页和参数）
 *
 * 列：
 * - ip / port / name / connectionStatus / remark / tag / gmtCreated / operation
 */
import { ElMessage } from 'element-plus';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import ConnectionStatusDot from '../components/ConnectionStatusDot.vue';
import GrantConfigDialog from './components/GrantConfigDialog.vue';
import { updateServerOpenDataGrant, type OpenDataGrant } from '@/api/nodeManage/openData';
import { getServers, type ServerItem } from '@/api/nodeManage/server';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'OutboundData' });

// ===== 受控模式状态 =====
const list = ref<ServerItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 授权弹窗 =====
const grantDialogVisible = ref(false);
const grantLoading = ref(false);
const currentServer = ref<ServerItem | null>(null);

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'ip', label: 'IP地址', minWidth: 150, showOverflowTooltip: true },
  { prop: 'port', label: '端口', width: 100, align: 'center' },
  { prop: 'name', label: '节点名称', minWidth: 150, showOverflowTooltip: true },
  {
    prop: 'connectionStatus',
    label: '连接状态',
    width: 120,
    align: 'center',
    slotName: 'connectionStatus',
  },
  { prop: 'remark', label: '备注', minWidth: 150, showOverflowTooltip: true },
  { prop: 'tag', label: '标签', width: 120, align: 'center', slotName: 'tag' },
  { prop: 'gmtCreated', label: '创建时间', width: 180, align: 'center' },
  {
    prop: 'operation',
    label: '操作',
    width: 100,
    align: 'center',
    slotName: 'operation',
    fixed: 'right',
  },
];

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as ServerItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

/** 刷新列表（保持当前页和参数） */
function refresh(): void {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 ServerItem */
function getRow(scope: any): ServerItem {
  return (scope?.row as ServerItem) ?? ({} as ServerItem);
}

// ===== 授权 =====
function handleGrant(row: ServerItem): void {
  currentServer.value = row;
  grantDialogVisible.value = true;
}

function handleGrantSubmit(payload: { peerId: string; data: OpenDataGrant }): void {
  grantLoading.value = true;
  updateServerOpenDataGrant(payload.peerId, payload.data)
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '授权配置保存失败');
        return;
      }
      ElMessage.success('授权配置已保存');
      grantDialogVisible.value = false;
    })
    .catch(() => {})
    .finally(() => {
      grantLoading.value = false;
    });
}

// ===== 5 秒定时刷新 =====
let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // 首次加载
  refresh();
  // 启动 5 秒定时静默刷新（refresh 内部走 ProTable，不显示 loading）
  refreshTimer = setInterval(() => {
    refresh();
  }, 5000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getServers"
        :data="list"
        :total="total"
        :search-params="searchParams"
        row-key="id"
        @response="handleResponse"
      >
        <!-- 连接状态列 -->
        <template #connectionStatus="scope">
          <ConnectionStatusDot :status="getRow(scope).status" :status-desc="getRow(scope).statusDesc" />
        </template>

        <!-- 标签列 -->
        <template #tag="scope">
          <el-tag v-if="getRow(scope).tag" type="info">{{ getRow(scope).tag }}</el-tag>
          <span v-else>-</span>
        </template>

        <!-- 操作列：仅授权按钮 -->
        <template #operation="scope">
          <el-button type="primary" link @click="handleGrant(getRow(scope))">授权</el-button>
        </template>
      </ProTable>
    </el-card>

    <GrantConfigDialog
      v-model:visible="grantDialogVisible"
      :server-data="currentServer"
      :loading="grantLoading"
      @save="handleGrantSubmit"
    />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
