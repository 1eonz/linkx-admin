<script setup lang="ts">
/**
 * 用户管理（管理员账号体系）
 *
 * 功能：
 * - 分页查询管理员用户列表（按名称搜索）
 * - 新增/编辑管理员用户（用户名称 + 数据权限树）
 * - 删除管理员用户
 * - 禁用/启用管理员用户
 *
 * 与 adminPerson 的区别：
 * - userManage 是独立的管理员账号体系（走 /api/auth/user/adminuser）
 * - adminPerson 是后台用户列表（走 /api/auth/user）
 * - userManage 含数据权限树，无角色绑定
 * - adminPerson 含多角色绑定，无数据权限
 */
import { Plus, Edit, Delete, Lock, Unlock, Key } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, markRaw, reactive, ref } from 'vue';

import EditUser from './components/EditUser.vue';
import { deleteAdminUser, getAdminUserList, updateAdminUser, type AdminUserItem } from '@/api/authority/adminUser';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import UserPassword from '@/views/permission/components/userPassword.vue';

defineOptions({ name: 'UserManage' });

// ===== 受控模式状态 =====
const list = ref<AdminUserItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const editUserRef = ref<InstanceType<typeof EditUser>>();
const passwordRef = ref<InstanceType<typeof UserPassword>>();

// ===== 列定义 =====
const columns = computed<ITableColumn[]>(() => [
  { prop: 'idCard', label: '名称', minWidth: 90, align: 'center' },
  { prop: 'status', label: '状态', minWidth: 80, align: 'center', slotName: 'status' },
  { prop: 'gmtCreated', label: '创建时间', minWidth: 120, align: 'center' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    minWidth: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

const actions = computed(() => [
  { label: '新增', type: 'primary' as const, icon: markRaw(Plus), onClick: handleCreate },
]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AdminUserItem[];
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
  editUserRef.value?.open();
}

// ===== 编辑 =====
function handleUpdate(row: AdminUserItem): void {
  editUserRef.value?.open(row);
}

// ===== 删除 =====
function handleDelete(row: AdminUserItem): void {
  ElMessageBox.confirm(`确认删除用户「${row.idCard}」？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteAdminUser(row.id))
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success('删除成功');
        tableRef.value?.refresh();
      } else {
        ElMessage.error(result.msg || '删除失败');
      }
    })
    .catch(() => {});
}

// ===== 禁用/启用 =====
function handleStatus(row: AdminUserItem, status: number): void {
  updateAdminUser({ id: row.id, status }).then((result) => {
    if (result.code === 0) {
      tableRef.value?.refresh();
    } else {
      ElMessage.error(result.msg || '操作失败');
    }
  });
}

// ===== 重置密码 =====
function handleResetPassword(row: AdminUserItem): void {
  passwordRef.value?.setData({ id: row.id, name: row.idCard }, false);
}

// ===== 提交成功后刷新 =====
function handleSuccess(): void {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 AdminUserItem */
function getUser(scope: any): AdminUserItem {
  return (scope?.row as AdminUserItem) ?? ({} as AdminUserItem);
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar
        v-model:search-key="searchParams.name as string"
        placeholder="名称"
        :actions="actions"
        @search="handleSearch"
        @reset="handleReset"
      />

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getAdminUserList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        @response="handleResponse"
      >
        <template #status="scope">
          <el-tag :type="getUser(scope).status === 0 ? 'success' : 'danger'">
            {{ getUser(scope).status === 0 ? '正常' : '禁用' }}
          </el-tag>
        </template>

        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: '编辑',
                onClick: () => handleUpdate(getUser(scope)),
              },
              {
                type: 'primary',
                icon: Key,
                label: '重置密码',
                onClick: () => handleResetPassword(getUser(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                onClick: () => handleDelete(getUser(scope)),
              },
              {
                type: 'danger',
                icon: Lock,
                label: '禁用',
                onClick: () => handleStatus(getUser(scope), 1),
                visible: getUser(scope).status === 0,
              },
              {
                type: 'warning',
                icon: Unlock,
                label: '启用',
                onClick: () => handleStatus(getUser(scope), 0),
                visible: getUser(scope).status !== 0,
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <EditUser ref="editUserRef" @success="handleSuccess" />
    <UserPassword ref="passwordRef" @success="handleSuccess" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
