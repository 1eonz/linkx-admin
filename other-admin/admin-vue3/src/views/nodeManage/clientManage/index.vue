<script setup lang="ts">
/**
 * ClientManage - 客户端节点管理
 *
 * 功能：
 * - 分页查询客户端列表（ProTable 受控模式）
 * - 编辑客户端（name / remark / tag）
 * - 授权客户端（grant / expiredIn）
 * - 删除客户端
 * - 5 秒定时静默刷新列表（保持当前页和参数）
 *
 * 列：
 * - ip / port / name / remark / tag / grantStatus / grantUserName / grantTime
 * - connectionStatus / lastSeen / gmtCreated / operation
 *
 * 注：客户端不支持手动新增（由对端注册产生）
 */
import { Edit, Delete, Key } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import ConnectionStatusDot from '../components/ConnectionStatusDot.vue';
import AuthorizeDialog from './components/AuthorizeDialog.vue';
import EditDialog from './components/EditDialog.vue';
import {
  deleteClient,
  getClients,
  updateClient,
  type ClientItem,
  type ClientUpdatePayload,
} from '@/api/nodeManage/client';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ClientManage' });

// ===== 受控模式状态 =====
const list = ref<ClientItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 编辑弹窗状态 =====
const editDialogVisible = ref(false);
const editLoading = ref(false);
const currentClient = ref<ClientItem | null>(null);

// ===== 授权弹窗状态 =====
const authorizeDialogVisible = ref(false);
const authorizeLoading = ref(false);

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
    width: 120,
    align: 'center',
    slotName: 'grantStatus',
  },
  { prop: 'grantUserName', label: '授权人', minWidth: 120, showOverflowTooltip: true },
  { prop: 'grantTime', label: '授权时间', minWidth: 120, showOverflowTooltip: true },
  {
    prop: 'connectionStatus',
    label: '连接状态',
    width: 120,
    align: 'center',
    slotName: 'connectionStatus',
  },
  { prop: 'lastSeen', label: '最后活跃', width: 160, align: 'center' },
  { prop: 'gmtCreated', label: '创建时间', width: 160, align: 'center' },
  {
    prop: 'operation',
    label: '操作',
    width: 220,
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

// ===== 编辑 =====
function handleEdit(row: ClientItem): void {
  currentClient.value = row;
  editDialogVisible.value = true;
}

function handleEditSubmit(payload: {
  peerId: string;
  data: Pick<ClientUpdatePayload, 'name' | 'remark' | 'tag'>;
}): void {
  editLoading.value = true;
  updateClient(payload.peerId, payload.data)
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '编辑失败');
        return;
      }
      ElMessage.success('编辑成功');
      editDialogVisible.value = false;
      refresh();
    })
    .catch(() => {})
    .finally(() => {
      editLoading.value = false;
    });
}

// ===== 授权 =====
function handleAuthorize(row: ClientItem): void {
  currentClient.value = row;
  authorizeDialogVisible.value = true;
}

function handleAuthorizeSubmit(payload: {
  peerId: string;
  data: Pick<ClientUpdatePayload, 'grant' | 'expiredIn'>;
}): void {
  authorizeLoading.value = true;
  updateClient(payload.peerId, payload.data)
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '授权失败');
        return;
      }
      ElMessage.success('授权成功');
      authorizeDialogVisible.value = false;
      refresh();
    })
    .catch(() => {})
    .finally(() => {
      authorizeLoading.value = false;
    });
}

// ===== 删除 =====
function handleDelete(row: ClientItem): void {
  const name = row.name || row.remark || row.ip;
  ElMessageBox.confirm(`删除后客户端「${name}」将失去授权，确定删除？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteClient(row.id))
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '删除失败');
        return;
      }
      ElMessage.success('删除成功');
      refresh();
    })
    .catch(() => {});
}

// ===== 5 秒定时刷新 =====
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/** 启动定时刷新 */
function startRefreshTimer(): void {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    refresh();
  }, 5000);
}

/** 停止定时刷新 */
function stopRefreshTimer(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/** 重启定时刷新（分页变化时调用，避免与列表加载并发） */
function restartRefreshTimer(): void {
  stopRefreshTimer();
  refresh();
  startRefreshTimer();
}

/** 分页变化：重启定时器 */
function handlePagination(): void {
  restartRefreshTimer();
}

onMounted(() => {
  // 首次加载
  refresh();
  // 启动 5 秒定时静默刷新（refresh 内部走 ProTable，不显示 loading）
  startRefreshTimer();
});

onBeforeUnmount(() => {
  stopRefreshTimer();
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
        @response="handleResponse"
        @pagination="handlePagination"
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

        <!-- 操作列 -->
        <template #operation="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleEdit(getRow(scope)) },
              { type: 'warning', icon: Key, label: '授权', onClick: () => handleAuthorize(getRow(scope)) },
              { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <!-- 编辑弹窗 -->
    <EditDialog
      v-model:visible="editDialogVisible"
      :client-data="currentClient"
      :loading="editLoading"
      @submit="handleEditSubmit"
    />

    <!-- 授权弹窗 -->
    <AuthorizeDialog
      v-model:visible="authorizeDialogVisible"
      :client-data="currentClient"
      :loading="authorizeLoading"
      @submit="handleAuthorizeSubmit"
    />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
