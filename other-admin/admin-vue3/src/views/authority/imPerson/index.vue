<script setup lang="ts">
/**
 * authority/imPerson/index.vue - 前台用户管理
 *
 * 基于 person/index.vue 改造：
 * - 删除 status 列（前台用户无状态展示）
 * - 搜索条件精简为 name、idCard、departmentName
 * - 操作列新增"数据权限"按钮（占位提示）
 * - 复用 person 模块的 setRole / setBatchRole 组件
 * - 通用管理员（role.id === 2）才显示禁用/启用/重置密码按钮
 */
import { Plus, Edit, Delete, Lock, Unlock, Key, User, Grid, VideoCamera, Monitor } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, onMounted, computed, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';

import { queryUserByIdCard } from '@/api/h5/collaboration';
import { getPersonList, deletePerson, updatePersonStatus, type UserItem } from '@/api/permission/user';
import ActionButtons from '@/components/ActionButtons/index.vue';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';
import { getIsAdmin, getIdCardNum } from '@/utils/auth';
import SetDataPermission from '@/views/authority/imPerson/components/SetDataPermission.vue';
import SetBatchRole from '@/views/authority/person/components/setBatchRole.vue';
import SetRole from '@/views/authority/person/components/setRole.vue';
import UserPassword from '@/views/permission/components/userPassword.vue';
import AuthTreeModal from '@/views/thirdInterface/unifiedComm/components/AuthTreeModal.vue';

defineOptions({ name: 'ImPerson' });

// useScope: 'global' 确保使用全局 messages
const { t } = useI18n({ useScope: 'global' });

// ===== 受控模式状态 =====
const list = ref<UserItem[]>([]);
const total = ref(0);
// 搜索参数：仅保留 name / idCard / departmentName 相关字段
const searchParams = reactive<Record<string, unknown>>({
  departmentName: '',
  departmentCode: '',
  privString: '',
  name: '',
  idCard: '',
});

// 多选
const multipleSelection = ref<UserItem[]>([]);

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 列定义：姓名、身份证号、组织名称、组织编码、直属领导、领导ID、角色（无状态列）
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: t('index.list.compellation'), minWidth: 60, align: 'center' },
  { prop: 'idCard', label: t('index.list.IDNumber'), minWidth: 80, align: 'center' },
  { prop: 'departmentName', label: t('index.list.organizationName'), minWidth: 80, align: 'center' },
  { prop: 'departmentCode', label: t('index.list.organizationCode'), minWidth: 80, align: 'center' },
  { prop: 'directLeaderName', label: t('index.list.directSupervisor'), minWidth: 80, align: 'center' },
  { prop: 'directLeaderId', label: t('index.list.supervisorID'), minWidth: 80, align: 'center' },
  { prop: 'roleName', label: t('index.list.role'), minWidth: 80, align: 'center', slotName: 'role' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 580,
    align: 'center',
    slotName: 'actions',
  },
]);

// 权限
const canCreate = computed(() => hasBtnPermission('/admin/executor/create'));
const canDelete = computed(() => hasBtnPermission('/admin/executor/delete'));
const canSetRole = computed(() => hasBtnPermission('/admin/trUserRole/createMany'));
const canUpdatePwd = computed(() => hasBtnPermission('/admin/user/updatePwd'));
const canUserDelete = computed(() => hasBtnPermission('/admin/user/delete'));
const canUpdate = computed(() => hasBtnPermission('/admin/executor/update'));

// 搜索区按钮：新增/批量编辑/批量删除
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
  },
  {
    label: t('index.operations.batchRemove'),
    type: 'danger' as const,
    icon: markRaw(Delete),
    onClick: handleBatchDelete,
    visible: canDelete.value,
  },
]);

// SearchBar 配置
const searchPlaceholder = computed(() => t('index.list.compellation'));

// 弹窗 ref：role / batchRole / password
const roleRef = ref<InstanceType<typeof SetRole>>();
const batchRoleRef = ref<InstanceType<typeof SetBatchRole>>();
const passwordRef = ref<InstanceType<typeof UserPassword>>();
const dataPermissionRef = ref<InstanceType<typeof SetDataPermission>>();

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
async function getUserOrgNameByIdCardNum(): Promise<void> {
  if (isAdmin) return;
  try {
    const userRes = await queryUserByIdCard({ idCard: idCardNum });
    if (userRes?.data?.userDepartments?.length) {
      departmentCode.value = userRes.data.userDepartments[0].departmentCode;
    }
  } catch (error) {
    console.log(error);
  }
}

// 搜索（触发 ProTable.init：重置到第 1 页 + 用最新 searchParams）
function handleSearch(): void {
  tableRef.value?.init();
}

// 重置（清空 name/idCard/departmentName/departmentCode/privString + init）
function handleReset(): void {
  searchParams.name = '';
  searchParams.idCard = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
  tableRef.value?.init();
}

// 多选
function handleSelection(val: UserItem[]): void {
  multipleSelection.value = val;
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
function handleDelete(rows: UserItem | UserItem[]): void {
  const array = Array.isArray(rows) ? rows : [rows];
  if (array.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  const confirmMsg = array.length > 1 ? t('affirmPermanentlyDeleted') : t('affirmDeletedAuth');
  ElMessageBox.confirm(confirmMsg, {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      deletePerson(array.map((r) => r.id).join(','))
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
    .catch(() => {});
}

// 批量删除
function handleBatchDelete(): void {
  if (multipleSelection.value.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  handleDelete(multipleSelection.value);
}

// 批量编辑（设置角色）
function handleEdit(): void {
  if (multipleSelection.value.length === 0) {
    ElMessage.error(t('index.messageText.pleaseCheckData'));
    return;
  }
  batchRoleRef.value?.init(multipleSelection.value);
}

// 新增
function handleCreate(): void {
  roleRef.value?.init(null, list.value);
}

// 设置角色
function manageRole(row: UserItem): void {
  roleRef.value?.init(row, list.value);
}

// 禁用
function handleFreezed(row: UserItem): void {
  ElMessageBox.confirm(t('affirmLocked'), {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      updatePersonStatus(row.id, 1)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success(t('index.statusTitle.forbiddenSucceed'));
            tableRef.value?.refresh();
          } else {
            ElMessage.error(t('index.statusTitle.forbiddenFail'));
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// 启用
function resuming(row: UserItem): void {
  updatePersonStatus(row.id, 0)
    .then((result) => {
      if (result.code === 0) {
        ElMessage.warning(t('index.messageText.restoreSuccessAddThen'));
        tableRef.value?.refresh();
      } else {
        ElMessage.error(result.msg || '');
      }
    })
    .catch(() => {});
}

// 修改密码
function handleChangePwd(row: UserItem): void {
  passwordRef.value?.setData(row, false);
}

// 数据权限
function handleDataPermission(row: UserItem): void {
  dataPermissionRef.value?.init(row);
}

// ===== 设备调度权限弹窗（复用 unifiedComm 的 AuthTreeModal）=====
// 双 Tab（设备组织部门 + 摄像头层级）。
// AuthTreeModal 为单树模式，此处用两个独立实例分别承载 org / camera 场景。
const orgAuthVisible = ref(false);
const cameraAuthVisible = ref(false);
const authTargetId = ref('');
// 部门树字段：departmentid / departmentname；摄像头树字段：levelNumber / nodeName
const orgTreeFields = { id: 'departmentid', label: 'departmentname' };
const cameraTreeFields = { id: 'levelNumber', label: 'nodeName' };

/** 打开设备组织部门权限弹窗 */
function handleOrgAuth(row: UserItem): void {
  authTargetId.value = row.id;
  orgAuthVisible.value = true;
}

/** 打开摄像头层级权限弹窗 */
function handleCameraAuth(row: UserItem): void {
  authTargetId.value = row.id;
  cameraAuthVisible.value = true;
}

/** 授权保存成功回调 */
function handleAuthSuccess(): void {
  tableRef.value?.refresh();
}

// 判断是否为通用管理员（role.id === '2' || role.id === 2）
function isGeneralAdmin(row: UserItem): boolean {
  const roleId = (row as Record<string, unknown>)?.role as Record<string, unknown> | undefined;
  return roleId?.id === '2' || roleId?.id === 2;
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
onMounted(async () => {
  if (!isAdmin) {
    await getUserOrgNameByIdCardNum();
  }
  tableRef.value?.init();
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
          <el-input
            v-model="searchParams.idCard as string"
            :placeholder="t('index.list.IDNumber')"
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
        :immediate="false"
        @response="handleResponse"
        @selection-change="handleSelection"
      >
        <template #role="scope">
          <span>{{ getRoleName(getUser(scope)) }}</span>
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
              },
              {
                type: 'primary',
                icon: Grid,
                label: '数据权限',
                onClick: () => handleDataPermission(getUser(scope)),
              },
              {
                type: 'primary',
                icon: Monitor,
                label: '设备调度权限',
                onClick: () => handleOrgAuth(getUser(scope)),
              },
              {
                type: 'primary',
                icon: VideoCamera,
                label: '摄像头权限',
                onClick: () => handleCameraAuth(getUser(scope)),
              },
              {
                type: 'danger',
                icon: Key,
                label: t('index.operations.reset') + t('index.pass.pass'),
                onClick: () => handleChangePwd(getUser(scope)),
                visible: canUpdatePwd && isGeneralAdmin(getUser(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: t('delete'),
                onClick: () => handleDelete(getUser(scope)),
                visible: canDelete,
              },
              {
                type: 'danger',
                icon: Lock,
                label: t('index.list.forbidden'),
                onClick: () => handleFreezed(getUser(scope)),
                visible: getUser(scope).status === 0 && canUserDelete && isGeneralAdmin(getUser(scope)),
              },
              {
                type: 'warning',
                icon: Unlock,
                label: t('index.operations.enabled'),
                onClick: () => resuming(getUser(scope)),
                visible: getUser(scope).status !== 0 && canUpdate && isGeneralAdmin(getUser(scope)),
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
    <!-- 设置数据权限 -->
    <SetDataPermission ref="dataPermissionRef" @success="() => tableRef?.refresh()" />
    <!-- 设备调度权限（设备组织部门） -->
    <AuthTreeModal
      v-model:visible="orgAuthVisible"
      title="设备调度权限 - 设备组织部门"
      api="org"
      :target-id="authTargetId"
      :tree-fields="orgTreeFields"
      @success="handleAuthSuccess"
    />
    <!-- 摄像头层级权限 -->
    <AuthTreeModal
      v-model:visible="cameraAuthVisible"
      title="设备调度权限 - 摄像头层级"
      api="camera"
      :target-id="authTargetId"
      :tree-fields="cameraTreeFields"
      @success="handleAuthSuccess"
    />
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
