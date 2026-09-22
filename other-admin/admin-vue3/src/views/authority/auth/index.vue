<script setup lang="ts">
/**
 * authority/auth/index.vue - 角色管理
 */
import { Plus, Edit, Delete, Lock, Unlock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, computed, markRaw } from 'vue';

import EditRole from './components/EditRole.vue';
import { getRoleList, deleteRole, updateRole, type RoleItem } from '@/api/permission/role';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';

defineOptions({ name: 'AuthorityAuth' });

// ===== 受控模式状态 =====
const list = ref<RoleItem[]>([]);
const total = ref(0);
// 搜索参数：仅搜索条件（name），分页由 ProTable 内部管理
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const editForm = reactive<Partial<RoleItem>>({});

// 列定义
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '角色名称', minWidth: 90, align: 'center' },
  { prop: 'status', label: '状态', minWidth: 100, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    minWidth: 90,
    align: 'center',
    slotName: 'actions',
  },
]);

// 权限
const canDelete = computed(() => hasBtnPermission('/admin/role/delete'));
const canUpdate = computed(() => hasBtnPermission('/admin/role/update'));

const actions = computed(() => [
  { label: '新增', type: 'primary' as const, icon: markRaw(Plus), onClick: handleCreate },
]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as RoleItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  // searchParams.name 已通过 v-model 绑定到 SearchBar，直接触发
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// 新增
function handleCreate(): void {
  Object.keys(editForm).forEach((k) => delete (editForm as Record<string, unknown>)[k]);
  editForm.status = 0;
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
}

// 编辑
function handleUpdate(row: RoleItem): void {
  Object.keys(editForm).forEach((k) => delete (editForm as Record<string, unknown>)[k]);
  Object.assign(editForm, row);
  dialogTitle.value = '编辑角色';
  dialogVisible.value = true;
}

// 删除
function handleDelete(row: RoleItem): void {
  const confirmMsg = `确认删除${row.name}`;
  ElMessageBox.confirm(confirmMsg, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteRole([row.id])
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('删除成功');
          } else {
            ElMessage.error(result.msg || '删除失败');
          }
          tableRef.value?.refresh();
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// 禁用/启用
function handleStatus(row: RoleItem, status: number): void {
  updateRole({ id: row.id, status })
    .then((result) => {
      if (result.code === 0) {
        tableRef.value?.refresh();
      } else {
        ElMessage.error(result.msg || '操作失败');
      }
    })
    .catch(() => {});
}

// 提交（新增/编辑）
// payload 结构（由 EditRole 触发）：
//   { name, iccPrivJson, adminPrivJson, cappPrivJson, orgPrivList, id? }
function handleSubmit(payload: Record<string, unknown>): void {
  const isEdit = Boolean(payload.id);
  const fn = isEdit
    ? updateRole
    : (data: Partial<RoleItem>) => import('@/api/permission/role').then((m) => m.createRole(data));
  fn(payload as Partial<RoleItem>)
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success(isEdit ? '更新成功' : '新增成功');
        dialogVisible.value = false;
        tableRef.value?.refresh();
      } else {
        ElMessage.error(result.msg || '操作失败');
      }
    })
    .catch(() => {});
}

// id !== 2 且 id !== 6 时显示删除/禁用按钮
function isShow(row: RoleItem): boolean {
  return +row.id !== 2 && +row.id !== 6;
}

/** 从 ProTable slot scope 中安全获取 RoleItem */
function getRole(scope: any): RoleItem {
  return (scope?.row as RoleItem) ?? ({} as RoleItem);
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar
        v-model:search-key="searchParams.name as string"
        placeholder="角色名称"
        :actions="actions"
        @search="handleSearch"
        @reset="handleReset"
      />

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getRoleList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        @response="handleResponse"
      >
        <template #status="scope">
          <el-tag :type="getRole(scope).status === 0 ? 'success' : 'danger'">
            {{ getRole(scope).status === 0 ? '正常' : '禁用' }}
          </el-tag>
        </template>

        <template #actions="scope">
          <el-button type="primary" link :icon="Edit" @click="handleUpdate(getRole(scope))">编辑</el-button>
          <el-button
            v-if="canDelete && isShow(getRole(scope))"
            type="danger"
            link
            :icon="Delete"
            @click="handleDelete(getRole(scope))"
          >
            删除
          </el-button>
          <el-button
            v-if="getRole(scope).status === 0 && canUpdate && isShow(getRole(scope))"
            type="danger"
            link
            :icon="Lock"
            @click="handleStatus(getRole(scope), 1)"
          >
            禁用
          </el-button>
          <el-button
            v-else-if="getRole(scope).status !== 0 && canUpdate && isShow(getRole(scope))"
            type="warning"
            link
            :icon="Unlock"
            @click="handleStatus(getRole(scope), 0)"
          >
            启用
          </el-button>
        </template>
      </ProTable>
    </el-card>

    <EditRole v-model:visible="dialogVisible" :title="dialogTitle" :form="editForm" @submit="handleSubmit" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
