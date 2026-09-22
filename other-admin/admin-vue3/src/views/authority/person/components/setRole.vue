<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { debounce } from 'lodash-es';
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

import { queryUserByPage, type QueryUserByPageItem } from '@/api/h5/collaboration';
import type { RoleItem } from '@/api/permission/role';
import { getUserRoleByUserId, bindRole, setRole } from '@/api/resource/person';
import { getRoleList } from '@/api/resource/role';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';

defineOptions({ name: 'SetRole' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const isAdd = ref(true);
const roleList = ref<RoleItem[]>([]);
const userList = ref<string[]>([]);

const form = reactive({
  roleIds: [] as string[],
  executorId: '',
  departmentName: '',
  departmentCode: '',
  relatedUserId: '',
  relatedUserNames: '',
  relatedUsers: [] as QueryUserByPageItem[],
});

// 人员下拉状态
const user = reactive({
  list: [] as QueryUserByPageItem[],
  total: 0,
  pageNum: 1,
  loading: false,
});

const rules: FormRules = {
  roleIds: [{ required: true, message: t('index.messageText.roleCannotBeEmpty'), trigger: 'change' }],
  departmentName: [{ required: true, message: '组织名称不能为空', trigger: 'change' }],
  relatedUserId: [{ required: true, message: '姓名不能为空', trigger: 'change' }],
};

function getDisable(data: QueryUserByPageItem): boolean {
  if (userList.value.length > 0) {
    return userList.value.includes(data.id);
  }
  return false;
}

// init 入口：row 为 null 表示新增，否则编辑
async function init(
  row: { id: string; departmentCode?: string; departmentName?: string; name?: string } | null,
  allUserList: QueryUserByPageItem[] | null = null,
): Promise<void> {
  isAdd.value = !row;
  form.departmentName = '';
  form.departmentCode = '';
  form.relatedUserId = '';
  form.relatedUserNames = '';
  form.relatedUsers = [];
  user.list = [];
  if (allUserList) {
    userList.value = allUserList.map((item) => item.id);
  }
  if (row) {
    form.executorId = row.id;
    form.departmentCode = row.departmentCode || '';
    form.departmentName = row.departmentName || '';
    user.pageNum = 1;
    user.list = [];
    form.relatedUserId = row.id;
    form.relatedUserNames = row.name || '';
    getUserListByPage();
  }
  await getList(row?.id);
  dialogVisible.value = true;
}

// 获取角色和人员详情
async function getList(id = ''): Promise<void> {
  const params = { name: '', pageSize: 100, pageNum: 1 };
  const roleListRes = await getRoleList(params);
  roleList.value = (roleListRes.data?.records as RoleItem[])?.filter((item) => item.status === 0) ?? [];
  if (!isAdd.value) {
    const userRole = await getUserRoleByUserId(id);
    const isActive = roleList.value.find((ev) => ev.id === userRole.data?.id);
    if (isActive) {
      form.roleIds = [userRole.data?.id as string];
    }
  } else {
    form.roleIds = [];
  }
}

function handleConfirm(): void {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    let params: Record<string, unknown>;
    let api: (data: any) => Promise<{ code: number; msg?: string }>;
    if (isAdd.value) {
      params = {
        roleId: form.roleIds[0],
        imUsers: form.relatedUsers.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          avatar: item.avatar,
          gender: item.gender,
          mobile: item.mobile,
          email: item.email,
          isdn: item.isdn,
          idCard: item.idCard,
          district: item.district,
          directLeaderId: item.directLeaderId,
          directLeaderName: item.directLeaderName,
          departmentCode: item.userDepartments?.[0]?.departmentCode,
          departmentName: item.userDepartments?.[0]?.departmentName,
          departmentId: item.userDepartments?.[0]?.id,
        })),
      };
      api = bindRole;
    } else {
      params = { userId: form.executorId, roleId: form.roleIds[0] };
      api = setRole;
    }
    api(params)
      .then((result) => {
        if (result.code === 0) {
          ElMessage.success(result.msg || '');
          emit('success');
          closeDialog();
        } else {
          ElMessage.error(result.msg || '');
        }
      })
      .catch(() => {});
  });
}

function closeDialog(): void {
  form.roleIds = [];
  form.executorId = '';
  form.departmentName = '';
  form.departmentCode = '';
  form.relatedUserId = '';
  form.relatedUserNames = '';
  form.relatedUsers = [];
  formRef.value?.resetFields();
  dialogVisible.value = false;
}

// 选择组织
async function parentCurrentChange(data: unknown): Promise<void> {
  const dept = data as { code?: string; name?: string };
  form.departmentCode = dept.code || '';
  form.departmentName = dept.name || '';
  user.pageNum = 1;
  user.list = [];
  await getUserListByPage();
  // 如果切换组织，已选人员不在组织内的需要删除已选信息
  const newChooseUser: QueryUserByPageItem[] = [];
  const userIdList = user.list.map((item) => item.id);
  if (user.list.length > 0 && form.relatedUsers.length > 0) {
    form.relatedUsers.forEach((item) => {
      if (userIdList.includes(item.id)) {
        newChooseUser.push(item);
      }
    });
  }
  form.relatedUsers = newChooseUser;
  form.relatedUserId = newChooseUser.length > 0 ? newChooseUser[0].id : '';
  form.relatedUserNames = newChooseUser.map((item) => item.name).join(',');
}

// 清空组织
function clearOrganizationType(): void {
  form.departmentCode = '';
  form.departmentName = '';
}

// 触底加载
function handleScroll(): void {
  if (user.list.length < user.total) {
    user.pageNum = user.pageNum + 1;
    getUserListByPage();
  }
}

// 人员搜索（防抖，500ms）
const remoteMethod = debounce(async (keywords: string): Promise<void> => {
  user.loading = true;
  user.list = [];
  user.pageNum = 1;
  await getUserListByPage(keywords);
}, 500);

// 分页查询组织下的人员
async function getUserListByPage(keywords?: string): Promise<void> {
  const params = {
    code: form.departmentCode,
    pageNum: user.pageNum,
    pageSize: 100,
    name: keywords,
  };
  try {
    const { code, data } = await queryUserByPage(params);
    if (code === 0 && data) {
      const records = (data.records as QueryUserByPageItem[]) ?? [];
      user.list = [...user.list, ...records];
      user.total = data.total ?? 0;
    }
  } finally {
    user.loading = false;
  }
}

function handleChangeUser(userId: string): void {
  const u = user.list.find((item) => item.id === userId);
  form.relatedUsers = u ? [u] : [];
  form.relatedUserNames = u ? u.name : '';
  formRef.value?.clearValidate();
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-if="dialogVisible"
    v-model="dialogVisible"
    :close-on-click-modal="false"
    :title="isAdd ? t('index.operations.Added') : t('index.operations.setRole')"
    align-center
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="form" label-position="left" :rules="rules" label-width="80px">
      <!-- 组织名称 -->
      <el-form-item :label="t('index.list.organizationName')" prop="departmentName">
        <OrgTreeSelect
          v-model="form.departmentName"
          :department-code="form.departmentCode"
          :is-disabled="!isAdd"
          :is-init-value="true"
          :placeholder="t('selects')"
          width="100%"
          @clear-val="clearOrganizationType"
          @current-change="parentCurrentChange"
        />
      </el-form-item>

      <el-form-item :label="t('index.list.compellation')" prop="relatedUserId">
        <el-select
          v-if="dialogVisible"
          v-model="form.relatedUserId"
          v-loadmore="handleScroll"
          :disabled="!isAdd"
          filterable
          remote
          style="width: 100%"
          reserve-keyword
          :placeholder="t('selects')"
          :remote-method="remoteMethod"
          :loading="user.loading"
          @change="handleChangeUser"
        >
          <el-option
            v-for="item in user.list"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="getDisable(item)"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('index.list.role')" prop="roleIds">
        <el-select
          v-model="form.roleIds[0]"
          collapse-tags
          value-key="key"
          :placeholder="t('selects')"
          style="width: 100%"
        >
          <el-option v-for="item in roleList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" @click="handleConfirm">{{ t('index.operations.save') }}</el-button>
    </template>
  </el-dialog>
</template>
