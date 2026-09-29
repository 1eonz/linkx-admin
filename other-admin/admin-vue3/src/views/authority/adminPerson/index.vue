<script setup lang="ts">
/**
 * authority/adminPerson/index.vue - 后台用户管理
 *
 * 基于 person/index.vue 改造：
 * - 表格列精简为：账号(name)、角色(role)、组织名称(departmentName)、状态(status)、操作
 * - 搜索条件精简为：name + 组织（OrgTreeSelect）
 * - 操作按钮：设置角色、重置密码、删除（无禁用/启用，无数据权限）
 * - 复用 person 模块的 setRole / setBatchRole 组件，以及 userPassword 组件
 * - 批量操作：新增用户、批量编辑、批量删除
 */
import { Plus, Edit, Delete, Key, User } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, onMounted, computed, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';

import { queryUserByIdCard } from '@/api/h5/collaboration';
import { deletePerson, getPersonList, updatePersonStatus, type UserItem } from '@/api/permission/user';
import ActionButtons from '@/components/ActionButtons/index.vue';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import StatusSwitch from '@/components/StatusSwitch/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';
import { getIsAdmin, getIdCardNum } from '@/utils/auth';
import SetBatchRole from '@/views/authority/person/components/setBatchRole.vue';
import SetRole from '@/views/authority/person/components/setRole.vue';
import UserPassword from '@/views/permission/components/userPassword.vue';

defineOptions({ name: 'AdminPerson' });

// useScope: 'global' 确保使用全局 messages
const { t } = useI18n({ useScope: 'global' });

// ===== 受控模式状态 =====
const list = ref<UserItem[]>([]);
const total = ref(0);
// 搜索参数：仅 name + 组织相关字段
const searchParams = reactive<Record<string, unknown>>({
  departmentName: '',
  departmentCode: '',
  privString: '',
  name: '',
});

// 多选：当前页选中行（仅用于响应 selection-change，跨页全量选中通过 getMultipleSelection 获取）
const multipleSelection = ref<UserItem[]>([]);
const pendingDeleteIds = ref(new Set<string>());
const pendingStatusIds = ref(new Set<string>());
const batchDeletePending = ref(false);

function setPendingId(target: typeof pendingDeleteIds, id: string, pending: boolean): void {
  const next = new Set(target.value);
  if (pending) next.add(id);
  else next.delete(id);
  target.value = next;
}

function isPersonRowBusy(id: string): boolean {
  return pendingDeleteIds.value.has(id) || pendingStatusIds.value.has(id);
}

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 列定义：账号(name)、角色(role)、组织名称(departmentName)、状态(status)、操作
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: t('index.list.compellation'), minWidth: 80, align: 'center' },
  { prop: 'roleName', label: t('index.list.role'), minWidth: 80, align: 'center', slotName: 'role' },
  { prop: 'departmentName', label: t('index.list.organizationName'), minWidth: 100, align: 'center' },
  { prop: 'status', label: t('index.list.condition'), minWidth: 80, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 280,
    align: 'center',
    slotName: 'actions',
  },
]);

// 权限
const canCreate = computed(() => hasBtnPermission('/admin/executor/create'));
const canDelete = computed(() => hasBtnPermission('/admin/executor/delete'));
const canSetRole = computed(() => hasBtnPermission('/admin/trUserRole/createMany'));
const canUpdatePwd = computed(() => hasBtnPermission('/admin/user/updatePwd'));
const canUpdate = computed(() => hasBtnPermission('/admin/user/update'));

// 搜索区按钮：新增用户/批量编辑/批量删除
const actions = computed(() => [
  {
    label: t('index.operations.Added'),
    type: 'primary' as const,
    icon: markRaw(Plus),
    onClick: handleCreate,
    visible: canCreate.value,
  },
  {
    label: t('index.operations.batchEdit'),
    type: 'primary' as const,
    icon: markRaw(Edit),
    onClick: handleEdit,
    visible: canSetRole.value,
    disabled: hasBusySelection(),
  },
  {
    label: t('index.operations.batchRemove'),
    type: 'danger' as const,
    icon: markRaw(Delete),
    onClick: handleBatchDelete,
    visible: canDelete.value,
    disabled: batchDeletePending.value || hasBusySelection(),
    loading: batchDeletePending.value,
  },
]);

// SearchBar 配置
const searchPlaceholder = computed(() => t('index.list.compellation'));

// 弹窗 ref：role / batchRole / password
const roleRef = ref<InstanceType<typeof SetRole>>();
const batchRoleRef = ref<InstanceType<typeof SetBatchRole>>();
const passwordRef = ref<InstanceType<typeof UserPassword>>();

// 非 admin 用户的部门 code（用于 OrgTreeSelect 首次查询限定）
const isAdmin = getIsAdmin();
const idCardNum = getIdCardNum();
const departmentCode = ref('');

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as UserItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// 非 admin 用户：用身份证号查所属部门，限定组织
function getUserOrgNameByIdCardNum(): Promise<void> {
  if (isAdmin) return Promise.resolve();
  return queryUserByIdCard({ idCard: idCardNum })
    .then((userRes) => {
      if (userRes?.data?.userDepartments?.length) {
        departmentCode.value = userRes.data.userDepartments[0].departmentCode;
      }
    })
    .catch(() => {
      // 查询失败时保留当前列表，避免组织范围读取异常阻断页面使用。
    });
}

// 搜索（触发 ProTable.init：重置到第 1 页 + 用最新 searchParams）
function handleSearch(): void {
  tableRef.value?.init();
}

// 重置（清空 name/departmentName/departmentCode/privString + init）
function handleReset(): void {
  searchParams.name = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
  // 重置时清空跨页选中
  clearAllSelection();
  tableRef.value?.init();
}

// 多选：跨页选中（el-table reserve-selection）回调返回的是当前页选中行，
// 全量已选需通过 getMultipleSelection 获取
function handleSelection(val: UserItem[]): void {
  multipleSelection.value = val;
}

/** 获取所有跨页选中行 */
function getMultipleSelection(): UserItem[] {
  return tableRef.value?.getMultipleSelection() ?? [];
}

function getSelectedPeople(): UserItem[] {
  const selection = new Map<string, UserItem>();
  [...multipleSelection.value, ...getMultipleSelection()].forEach((row) => {
    selection.set(String(row.id), row);
  });
  return [...selection.values()];
}

function hasBusySelection(): boolean {
  return getSelectedPeople().some((row) => isPersonRowBusy(String(row.id)));
}

/** 清空所有跨页选中 */
function clearAllSelection(): void {
  tableRef.value?.clearAllSelection();
  multipleSelection.value = [];
}

// 选择组织：设置 departmentCode/departmentName/privString
function organizationCurrentChange(data: unknown): void {
  const dept = data as { code?: string; name?: string; id?: string };
  searchParams.departmentCode = dept.code || '';
  searchParams.departmentName = dept.name || '';
  searchParams.privString = dept.id || '';
}

// 清空组织
function cleanOrganizationInput(): void {
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
}

// 删除
function handleDelete(rows: UserItem | UserItem[], batchAction = false): void {
  const array = Array.isArray(rows) ? rows : [rows];
  if (array.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  const ids = array.map((row) => String(row.id));
  if (ids.some(isPersonRowBusy)) return;
  ids.forEach((id) => setPendingId(pendingDeleteIds, id, true));
  if (batchAction) batchDeletePending.value = true;
  const confirmMsg = array.length > 1 ? t('affirmPermanentlyDeleted') : t('affirmDeletedAuth');
  ElMessageBox.confirm(confirmMsg, {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      return deletePerson(array.map((r) => r.id).join(','))
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success(t('index.statusTitle.successfullyDelete'));
          } else {
            ElMessage.error(result.msg || '');
          }
          tableRef.value?.refresh();
        })
        .catch(() => {});
    })
    .catch(() => {})
    .finally(() => {
      ids.forEach((id) => setPendingId(pendingDeleteIds, id, false));
      if (batchAction) batchDeletePending.value = false;
    });
}

// 批量删除
function handleBatchDelete(): void {
  // 使用 getMultipleSelection() 拿到跨页全量选中
  const selection = getSelectedPeople();
  if (selection.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  handleDelete(selection, true);
}

// 批量编辑（设置角色）
function handleEdit(): void {
  // 使用 getMultipleSelection() 拿到跨页全量选中
  const selection = getSelectedPeople();
  if (selection.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  if (selection.some((row) => isPersonRowBusy(String(row.id)))) {
    ElMessage.warning('请等待所选人员的当前操作完成后再批量编辑');
    return;
  }
  batchRoleRef.value?.init(selection);
}

// 新增用户
function handleCreate(): void {
  roleRef.value?.init(null, list.value);
}

// 设置角色
function manageRole(row: UserItem): void {
  roleRef.value?.init(row, list.value);
}

// 修改密码
function handleChangePwd(row: UserItem): void {
  passwordRef.value?.setData(row, false);
}

// 状态切换（StatusSwitch @change）
function handleStatusChange(row: UserItem, status: number): void {
  const id = String(row.id);
  if (isPersonRowBusy(id)) return;
  setPendingId(pendingStatusIds, id, true);
  updatePersonStatus(row.id, status)
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success(status === 0 ? t('index.messageText.enableSuccess') : t('index.messageText.disableSuccess'));
        tableRef.value?.refresh();
      } else {
        ElMessage.error(result.msg || t('index.messageText.operationFailed'));
      }
    })
    .catch(() => {
      ElMessage.error(t('index.messageText.operationFailed'));
    })
    .finally(() => setPendingId(pendingStatusIds, id, false));
}

/**
 * 判断是否为普通管理员
 * 所有后台用户均可切换状态（直接 return true）
 */
function isGeneralAdmin(): boolean {
  return true;
}

// 获取角色名
function getRoleName(row: UserItem): string {
  const role = (row as Record<string, unknown>)?.role as Record<string, unknown> | undefined;
  return (role?.name as string) || '';
}

/** 从 ProTable slot scope 中安全获取 UserItem */
function getUser(scope: any): UserItem {
  return (scope?.row as UserItem) ?? ({} as UserItem);
}

// onMounted：非 admin 用户先预加载部门，再 init
// immediate=false 避免在部门预加载完成前就发起请求
onMounted(() => {
  getUserOrgNameByIdCardNum().then(() => {
    tableRef.value?.init();
  });
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <!-- 搜索区：复用 SearchBar，使用 filters 插槽自定义筛选字段 -->
      <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <el-input
            v-model="searchParams.name as string"
            :placeholder="t('index.list.compellation')"
            class="filter-item"
            style="width: 150px"
            clearable
            @keyup.enter="handleSearch"
          />
          <!-- 组织树（OrgTreeSelect 内部根据 DEPARTMENT_SYNC_SIGN 自动切换同步/懒加载） -->
          <OrgTreeSelect
            v-model="searchParams.departmentName as string"
            :department-code="departmentCode"
            :is-init-value="true"
            :placeholder="t('index.list.organizationName')"
            class="filter-item"
            width="150px"
            @clear-val="cleanOrganizationInput"
            @current-change="organizationCurrentChange"
          />
        </template>
      </SearchBar>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getPersonList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        :show-selection="true"
        :reserve-selection="true"
        row-key="id"
        :immediate="false"
        @response="handleResponse"
        @selection-change="handleSelection"
      >
        <template #role="scope">
          <span>{{ getRoleName(getUser(scope)) }}</span>
        </template>

        <template #status="scope">
          <StatusSwitch
            :value="getUser(scope).status ?? 0"
            :disabled="!isGeneralAdmin() || !canUpdate"
            :loading="isPersonRowBusy(String(getUser(scope).id))"
            @change="(v) => handleStatusChange(getUser(scope), v)"
          />
        </template>

        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: User,
                label: t('index.operations.setRole'),
                onClick: () => manageRole(getUser(scope)),
                visible: canSetRole,
                disabled: isPersonRowBusy(String(getUser(scope).id)),
              },
              {
                type: 'danger',
                icon: Key,
                label: t('index.operations.reset') + t('index.pass.pass'),
                onClick: () => handleChangePwd(getUser(scope)),
                visible: canUpdatePwd,
                disabled: isPersonRowBusy(String(getUser(scope).id)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: t('delete'),
                onClick: () => handleDelete(getUser(scope)),
                visible: canDelete,
                disabled: isPersonRowBusy(String(getUser(scope).id)),
                loading: pendingDeleteIds.has(String(getUser(scope).id)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <!-- 设置角色 -->
    <SetRole ref="roleRef" @success="() => tableRef?.refresh()" />
    <!-- 批量设置角色 -->
    <SetBatchRole ref="batchRoleRef" @success="() => tableRef?.refresh()" />
    <!-- 修改密码 -->
    <UserPassword ref="passwordRef" @success="() => tableRef?.refresh()" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

// filter-item 作为 SearchBar filters 插槽内的元素，inline-block 排列
.filter-item {
  display: inline-block;
  vertical-align: middle;
}
</style>
