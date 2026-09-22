<script setup lang="ts">
/**
 * InboundData - 入向数据管理
 *
 * 功能：
 * - 分页查询客户端列表（ProTable 受控模式，复用 getClients 接口）
 * - 无搜索区，无新增按钮
 * - 点击「详情」打开 ClientDetailDrawer 查看入向数据详情
 * - 5 秒定时静默刷新列表（保持当前页和参数）
 *
 * 列：
 * - ip / port / name / remark / tag / grantStatus / grantUserName / grantTime
 * - connectionStatus / lastSeen / operation（仅「详情」按钮）
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import ConnectionStatusDot from '../components/ConnectionStatusDot.vue';
import ClientDetailDrawer from './components/ClientDetailDrawer.vue';
import { getClients, type ClientItem } from '@/api/nodeManage/client';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'InboundData' });

// ===== 受控模式状态 =====
const list = ref<ClientItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 详情抽屉状态 =====
const drawerVisible = ref(false);
const currentClient = ref<ClientItem | null>(null);

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'ip', label: 'IP地址', minWidth: 130, showOverflowTooltip: true },
  { prop: 'port', label: '端口', width: 80, align: 'center' },
  { prop: 'name', label: '节点名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'remark', label: '备注', minWidth: 120, showOverflowTooltip: true },
  { prop: 'tag', label: '标签', width: 120, align: 'center', slotName: 'tag' },
  {
    prop: 'grantStatus',
    label: '授权状态',
    width: 100,
    align: 'center',
    slotName: 'grantStatus',
  },
  { prop: 'grantUserName', label: '授权人', minWidth: 120, showOverflowTooltip: true },
  { prop: 'grantTime', label: '授权时间', minWidth: 120, showOverflowTooltip: true },
  {
    prop: 'connectionStatus',
    label: '连接状态',
    width: 100,
    align: 'center',
    slotName: 'connectionStatus',
  },
  { prop: 'lastSeen', label: '最后活跃', width: 160, align: 'center' },
  {
    prop: 'operation',
    label: '操作',
    width: 80,
    align: 'center',
    slotName: 'operation',
    fixed: 'right',
  },
];

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as ClientItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

/** 刷新列表（保持当前页和参数） */
function refresh(): void {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 ClientItem */
function getRow(scope: any): ClientItem {
  return (scope?.row as ClientItem) ?? ({} as ClientItem);
}

// ===== 详情 =====
function handleDetail(row: ClientItem): void {
  currentClient.value = row;
  drawerVisible.value = true;
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
        :fetch-api="getClients"
        :data="list"
        :total="total"
        :search-params="searchParams"
        row-key="id"
        size="large"
        @response="handleResponse"
      >
        <!-- 标签列 -->
        <template #tag="scope">
          <el-tag v-if="getRow(scope).tag" type="info">{{ getRow(scope).tag }}</el-tag>
          <span v-else>-</span>
        </template>

        <!-- 授权状态列 -->
        <template #grantStatus="scope">
          <el-tag v-if="getRow(scope).grant === 1 && !getRow(scope).expired" type="success"> 已授权 </el-tag>
          <el-tag v-else-if="getRow(scope).expired" type="danger">已过期</el-tag>
          <el-tag v-else type="info">未授权</el-tag>
        </template>

        <!-- 连接状态列 -->
        <template #connectionStatus="scope">
          <ConnectionStatusDot :status="getRow(scope).status" :status-desc="getRow(scope).statusDesc" />
        </template>

        <!-- 操作列：仅详情按钮 -->
        <template #operation="scope">
          <el-button type="primary" link @click="handleDetail(getRow(scope))">详情</el-button>
        </template>
      </ProTable>
    </el-card>

    <!-- 详情抽屉 -->
    <ClientDetailDrawer v-model:visible="drawerVisible" :client-data="currentClient" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
