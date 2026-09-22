<script setup lang="ts">
/**
 * ServerManage - 服务器节点管理
 *
 * 功能：
 * - 分页查询服务器列表（ProTable 受控模式）
 * - 新增/编辑/删除服务器节点
 * - 5 秒定时静默刷新列表（保持当前页和参数）
 *
 * 列：
 * - ip / port / name / connectionStatus / remark / tag / createUserName / gmtCreated / operation
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import ConnectionStatusDot from '../components/ConnectionStatusDot.vue';
import ServerFormDialog, { type ServerFormDialogInstance } from './components/ServerFormDialog.vue';
import {
  createServer,
  deleteServer,
  getServers,
  updateServer,
  type ServerItem,
  type ServerPayload,
} from '@/api/nodeManage/server';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ServerManage' });

// ===== 受控模式状态 =====
const list = ref<ServerItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

const tableRef = ref<InstanceType<typeof ProTable>>();
const formDialogRef = ref<ServerFormDialogInstance>();
const dialogVisible = ref(false);
// 缓存当前编辑的行（编辑时 init 前设置，提交时用于取 id，form 不包含 id）
const editingRow = ref<ServerItem | null>(null);

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
  { prop: 'remark', label: '备注', minWidth: 120, showOverflowTooltip: true },
  { prop: 'tag', label: '标签', width: 120, align: 'center', slotName: 'tag' },
  { prop: 'createUserName', label: '创建人', width: 180, align: 'center' },
  { prop: 'gmtCreated', label: '创建时间', width: 180, align: 'center' },
  {
    prop: 'operation',
    label: '操作',
    width: 200,
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

// ===== 新增 =====
function handleCreate(): void {
  formDialogRef.value?.init('create');
}

// ===== 编辑 =====
function handleUpdate(row: ServerItem): void {
  editingRow.value = row;
  formDialogRef.value?.init('update', row);
}

// ===== 删除 =====
function handleDelete(row: ServerItem): void {
  const name = row.name || row.ip;
  ElMessageBox.confirm(`删除后该服务器节点「${name}」将无法连接，确定删除？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteServer(row.id))
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

// ===== 弹窗提交 =====
function handleSubmit(payload: { status: 'create' | 'update'; data: ServerPayload }): void {
  if (payload.status === 'create') {
    createServer(payload.data)
      .then((result) => {
        if (!result || result.code !== 0) {
          formDialogRef.value?.closeLoading();
          ElMessage.error(result?.msg || '创建失败');
          return;
        }
        ElMessage.success('创建成功，要对端授权后，才能连接成功！');
        dialogVisible.value = false;
        refresh();
      })
      .catch(() => {
        formDialogRef.value?.closeLoading();
      });
    return;
  }
  // 编辑：从缓存的 editingRow 取 id（form 不包含 id）
  const editingId = editingRow.value?.id;
  if (!editingId) {
    formDialogRef.value?.closeLoading();
    return;
  }
  updateServer(editingId, payload.data)
    .then((result) => {
      if (!result || result.code !== 0) {
        formDialogRef.value?.closeLoading();
        ElMessage.error(result?.msg || '更新失败');
        return;
      }
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      refresh();
    })
    .catch(() => {
      formDialogRef.value?.closeLoading();
    });
}

// ===== 5 秒定时刷新 =====
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/** 从 ProTable slot scope 中安全获取 ServerItem */
function getRow(scope: any): ServerItem {
  return (scope?.row as ServerItem) ?? ({} as ServerItem);
}

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
      <!-- 顶部操作栏：仅一个「新增」按钮 -->
      <div class="actions-bar">
        <el-button type="primary" :icon="Plus" size="large" @click="handleCreate">新增</el-button>
      </div>

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

        <!-- 操作列 -->
        <template #operation="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
              { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <ServerFormDialog ref="formDialogRef" v-model:visible="dialogVisible" @submit="handleSubmit" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.actions-bar {
  padding-bottom: 16px;
}
</style>
