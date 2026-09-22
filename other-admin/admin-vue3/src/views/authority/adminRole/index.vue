<script setup lang="ts">
/**
 * authority/adminRole/index.vue - 后台角色管理
 *
 * 基于 auth/index.vue 改造：
 * - 复用真实角色 API（getRoleList / createRole / updateRole / deleteRole）
 * - 操作列新增"设置用户"按钮（占位提示）
 * - 状态列用 StatusSwitch 组件替代 el-tag
 * - 特殊角色保护：isOperable(row) => +row.id !== 2 && +row.id !== 6
 * - 复用 auth 模块的 EditRole 弹窗
 */
import { Plus, Edit, Delete, User } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, computed, markRaw } from 'vue';

import type { AdminUserItem } from '@/api/authority/adminUser';
import { getRoleList, deleteRole, updateRole, createRole, setBatchRole, type RoleItem } from '@/api/permission/role';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import StatusSwitch from '@/components/StatusSwitch/index.vue';
import UserSelectDialog from '@/components/UserSelectDialog/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';
import EditRole from '@/views/authority/auth/components/EditRole.vue';

defineOptions({ name: 'AdminRole' });

// ===== 受控模式状态 =====
const list = ref<RoleItem[]>([]);
const total = ref(0);
// 搜索参数：仅搜索条件（name），分页由 ProTable 内部管理
// 注意：ProTable 默认 pageNum/pageSize，即使后端用 pageNo 也按 pageNum 传参
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const editForm = reactive<Partial<RoleItem>>({});

// ===== 设置用户弹窗 =====
const userDialogVisible = ref(false);
const currentRole = reactive<{ id: string; name: string }>({ id: '', name: '' });

// 列定义
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '角色名称', minWidth: 90, align: 'center' },
  { prop: 'status', label: '状态', minWidth: 120, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    minWidth: 120,
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

// 状态切换（StatusSwitch @change）
function handleStatusChange(row: RoleItem, status: number): void {
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
//   新增: { applicationId, roleName, permissionIds }
//   编辑: { id, roleName, permissionIds }
function handleSubmit(payload: Record<string, unknown>): void {
  const isEdit = Boolean(payload.id);
  const fn = isEdit ? updateRole : createRole;
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

// 设置用户：打开弹窗
function handleSetUsers(row: RoleItem): void {
  currentRole.id = row.id;
  currentRole.name = row.name;
  userDialogVisible.value = true;
}

// 设置用户：确认回调
async function handleUserConfirm(users: AdminUserItem[]): Promise<void> {
  const userIds = users.map((u) => u.id);
  try {
    const result = await setBatchRole(currentRole.id, userIds);
    if (result.code === 0) {
      ElMessage.success(result.msg || '设置用户成功');
      tableRef.value?.refresh();
    } else {
      ElMessage.error(result.msg || '操作失败');
    }
  } catch {
    ElMessage.error('操作失败');
  }
}

// 特殊角色保护：id !== 2 且 id !== 6 才可操作删除/禁用/启用
function isOperable(row: RoleItem): boolean {
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
        <!-- 状态列：使用 StatusSwitch 替代 el-tag，特殊角色禁用切换 -->
        <template #status="scope">
          <StatusSwitch
            :value="getRole(scope).status ?? 0"
            :disabled="!isOperable(getRole(scope))"
            @change="(v) => handleStatusChange(getRole(scope), v)"
          />
        </template>

        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: '编辑',
                onClick: () => handleUpdate(getRole(scope)),
              },
              {
                type: 'primary',
                icon: User,
                label: '设置用户',
                onClick: () => handleSetUsers(getRole(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                onClick: () => handleDelete(getRole(scope)),
                visible: canDelete && isOperable(getRole(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <EditRole v-model:visible="dialogVisible" :title="dialogTitle" :form="editForm" @submit="handleSubmit" />

    <!-- 设置用户弹窗 -->
    <UserSelectDialog
      v-model:visible="userDialogVisible"
      :role-id="currentRole.id"
      :role-name="currentRole.name"
      @confirm="handleUserConfirm"
    />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
