<script setup lang="ts">
/**
 * 前台角色管理
 *
 * 功能：
 * - 分页查询角色列表（按名称搜索）
 * - 新增/编辑角色（复用 auth 的 EditRole 组件）
 * - 删除角色（单条，系统内置角色 id=2/6 受保护）
 * - 启用/禁用角色
 * - 绑定用户（批量关联用户到角色）
 *
 * 与 auth 模块的区别：多了"绑定用户"按钮和 BindUser 子组件
 * API 完全相同（/api/role）
 */
import { Plus, Edit, Delete, Lock, Unlock, Connection } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, markRaw, reactive, ref } from 'vue';

import BindUser from './components/BindUser.vue';
import { createRole, deleteRole, getRoleList, updateRole, type RoleItem } from '@/api/permission/role';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';
import EditRole from '@/views/authority/auth/components/EditRole.vue';

defineOptions({ name: 'ImRole' });

// ===== 受控模式状态 =====
const list = ref<RoleItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const editRoleRef = ref<InstanceType<typeof EditRole>>();
const bindUserRef = ref<InstanceType<typeof BindUser>>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const editForm = reactive<Partial<RoleItem>>({});

// ===== 列定义 =====
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '角色名称', minWidth: 90, align: 'center' },
  { prop: 'status', label: '状态', minWidth: 100, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    minWidth: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

// ===== 权限 =====
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

// ===== 新增 =====
function handleCreate(): void {
  Object.keys(editForm).forEach((k) => delete (editForm as Record<string, unknown>)[k]);
  editForm.status = 0;
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
}

// ===== 编辑 =====
function handleUpdate(row: RoleItem): void {
  Object.keys(editForm).forEach((k) => delete (editForm as Record<string, unknown>)[k]);
  Object.assign(editForm, row);
  dialogTitle.value = '编辑角色';
  dialogVisible.value = true;
}

// ===== 删除 =====
function handleDelete(row: RoleItem): void {
  ElMessageBox.confirm(`确认删除${row.name}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteRole([row.id]))
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success('删除成功');
      } else {
        ElMessage.error(result.msg || '删除失败');
      }
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

// ===== 禁用/启用 =====
function handleStatus(row: RoleItem, status: number): void {
  updateRole({ id: row.id, status }).then((result) => {
    if (result.code === 0) {
      tableRef.value?.refresh();
    } else {
      ElMessage.error(result.msg || '操作失败');
    }
  });
}

// ===== 绑定用户 =====
function handleBindUser(row: RoleItem): void {
  bindUserRef.value?.open(row);
}

// ===== 提交（新增/编辑） =====
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

// ===== 特殊角色保护：id !== 2 且 id !== 6 时显示删除/禁用按钮 =====
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
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Connection,
                label: '绑定用户',
                onClick: () => handleBindUser(getRole(scope)),
              },
              {
                type: 'primary',
                icon: Edit,
                label: '编辑',
                onClick: () => handleUpdate(getRole(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                onClick: () => handleDelete(getRole(scope)),
                visible: canDelete && isShow(getRole(scope)),
              },
              {
                type: 'danger',
                icon: Lock,
                label: '禁用',
                onClick: () => handleStatus(getRole(scope), 1),
                visible: getRole(scope).status === 0 && canUpdate && isShow(getRole(scope)),
              },
              {
                type: 'warning',
                icon: Unlock,
                label: '启用',
                onClick: () => handleStatus(getRole(scope), 0),
                visible: getRole(scope).status !== 0 && canUpdate && isShow(getRole(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <EditRole v-model:visible="dialogVisible" :title="dialogTitle" :form="editForm" @submit="handleSubmit" />
    <BindUser ref="bindUserRef" @success="handleSearch" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
