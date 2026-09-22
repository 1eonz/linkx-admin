<script setup lang="ts">
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ref, reactive, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  createCollaboration,
  updateCollaboration,
  uploadColTmp,
  queryUserByPage,
  querySameName,
  type CollaborationItem,
  type QueryUserByPageItem,
} from '@/api/h5/collaboration';
import { getPolicetickettypes, type PoliceTicketTypeItem } from '@/api/policeReport/dock';
import AuthImg from '@/components/AuthImg/index.vue';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import vLoadmore from '@/directives/loadmore';
import { useUserStore } from '@/store/modules/useUserStore';

defineOptions({ name: 'ColForm' });

const props = withDefaults(
  defineProps<{
    /** 是否管理员 */
    isAdmin?: boolean;
    /** 非管理员时的部门 code */
    departmentCode?: string;
    /** 是否启用部门同步（DEPARTMENT_SYNC_SIGN） */
    departmentSyncSign?: boolean;
  }>(),
  {
    isAdmin: false,
    departmentCode: '',
    departmentSyncSign: false,
  },
);

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);

// 表单默认值
interface ColFormData {
  id: string;
  postName: string;
  type: number | undefined;
  iconUrl: string;
  fileId: string;
  orgId: string;
  orgName: string;
  orgCode: string;
  relatedUserIds: string[];
  relatedUserNames: string[];
  typeIds: string[];
  policeTicketTypes: Array<{ id: string; tag: string }>;
  [key: string]: unknown;
}

const defaultForm = (): ColFormData => ({
  id: '',
  postName: '',
  type: undefined,
  iconUrl: '',
  fileId: '',
  orgId: '',
  orgName: '',
  orgCode: '',
  relatedUserIds: [],
  relatedUserNames: [],
  typeIds: [],
  policeTicketTypes: [],
});

const formData = reactive<ColFormData>(defaultForm());

// 图标相关
const imageUrl = ref('');
const changeImg = ref(false);
const currentFile = ref<File | null>(null);
const showAuthImg = ref(false);

// 协同岗类型选项
const collaration = [
  { id: 1, name: '人员核查协同岗' },
  { id: 2, name: '普通协同岗' },
];
// license 控制：AICollaborationAuth 为 true 时隐藏「人员核查协同岗」
const collarationArr = computed(() => {
  if (userStore.licenseAuth?.AICollaborationAuth) {
    return collaration.filter((item) => item.name !== '人员核查协同岗');
  }
  return collaration;
});

// 关联人员相关
const userList = ref<QueryUserByPageItem[]>([]);
const userMap = reactive<Record<string, string>>({});
const userTotal = ref(0);
const userPageNum = ref(0);
const userPageSize = 100;
const userLoading = ref(false);
const initUserIds = ref<string[]>([]);

// 警单类型
const typeList = ref<PoliceTicketTypeItem[]>([]);
const originTypeList = ref<PoliceTicketTypeItem[]>([]);
const loadingType = ref(false);

// MULTIPLE_COLLABORATION 全局开关（控制 queryUserByPage 是否传 type）
const globalData = computed(() => {
  const globals = userStore.globals ?? [];
  return globals.find((item) => item.name === 'MULTIPLE_COLLABORATION');
});

// 表单校验规则
const rules = computed<Record<string, FormItemRule[]>>(() => ({
  postName: [{ required: true, message: '协同岗名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '协同岗类型不能为空', trigger: 'blur' }],
  orgName: [{ required: true, message: '归属组织不能为空', trigger: 'change' }],
  relatedUserIds: [{ required: true, message: '关联人员不能为空', trigger: 'blur' }],
}));

/** 图标上传前校验：1MB + jpg/png/gif */
function beforeUpload(file: File): boolean {
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    ElMessage.error('图标大小不能超过 1MB');
    return false;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'png', 'gif'].includes(ext ?? '')) {
    ElMessage.error('图标格式只支持 jpg/png/gif');
    return false;
  }
  return true;
}

/** 选择图标 */
function handleChange(file: UploadFile): void {
  if (!file.raw) return;
  if (!beforeUpload(file.raw)) return;
  currentFile.value = file.raw;
  changeImg.value = true;
  imageUrl.value = URL.createObjectURL(file.raw);
}

/** 上传图标 */
async function uploadFile(): Promise<void> {
  if (!currentFile.value) return;
  const form = new FormData();
  form.append('file', currentFile.value);
  const res = await uploadColTmp(form);
  if (res.code === 0) {
    const data = (res as unknown as { data?: { iconUrl: string; fileId: string } })?.data;
    if (data) {
      formData.iconUrl = data.iconUrl;
      formData.fileId = data.fileId;
    }
  }
}

/** 组织树选中：设置 orgId/orgName/orgCode，重置关联人员 */
function organizationCurrentChange(data: { id?: string; name?: string; code?: string }): void {
  formData.orgId = data.id ?? '';
  formData.orgName = data.name ?? '';
  formData.orgCode = data.code ?? '';
  // 重置关联人员
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  formData.relatedUserIds = [];
  formData.relatedUserNames = [];
}

function cleanOrganizationInput(): void {
  formData.orgId = '';
  formData.orgName = '';
  formData.orgCode = '';
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  formData.relatedUserIds = [];
  formData.relatedUserNames = [];
}

/** 分页查询关联人员 */
async function getUserListByPage(keywords?: string): Promise<void> {
  const orgCode = formData.orgCode as string;
  const orgId = formData.orgId as string;
  if (!orgCode) return;
  userLoading.value = true;
  userPageNum.value = userPageNum.value + 1;
  const params: Record<string, unknown> = {
    privString: orgId,
    code: orgCode,
    includeChildren: 1,
    pageNum: userPageNum.value,
    pageSize: userPageSize,
    name: keywords,
  };
  if (globalData.value?.value === 'true') {
    params.type = formData.type;
  }
  try {
    const res = await queryUserByPage(params as never);
    const data = (res as unknown as { data?: { records?: QueryUserByPageItem[]; total?: number } })?.data;
    const records = data?.records ?? [];
    records.forEach((i) => {
      userMap[i.id] = i.name;
    });
    userList.value = [...userList.value, ...records];
    userTotal.value = data?.total ?? 0;
  } finally {
    userLoading.value = false;
  }
}

/** 触底加载 */
function handleScroll(): void {
  if (userList.value.length < userTotal.value) {
    getUserListByPage();
  }
}

/** 远程搜索：重置 pageNum=0 + 空列表 */
function remoteMethod(keywords: string): void {
  userLoading.value = true;
  userList.value = [];
  userPageNum.value = 0;
  getUserListByPage(keywords);
}

/** 关联人员禁用规则：已绑定其他协同岗的人员禁用，但当前协同岗已绑定的允许 */
function getDisable(data: QueryUserByPageItem): boolean {
  const { isBinding, id } = data;
  if (initUserIds.value.includes(id)) {
    return false;
  }
  return isBinding === 1;
}

/** 警单类型远程搜索：本地过滤 */
function remoteMethodType(keywords: string): void {
  loadingType.value = true;
  if (!keywords || keywords.trim() === '') {
    typeList.value = [...originTypeList.value];
    loadingType.value = false;
    return;
  }
  typeList.value = originTypeList.value.filter(
    (item) => item.tag && item.tag.toLowerCase().includes(keywords.toLowerCase()),
  );
  loadingType.value = false;
}

/** 拉取警单类型 */
async function getPolicetickettypesFunc(): Promise<void> {
  try {
    const res = await getPolicetickettypes();
    if (res.code === 0) {
      const data = (res as unknown as { data?: PoliceTicketTypeItem[] })?.data ?? [];
      typeList.value = data;
      originTypeList.value = data;
    }
  } catch {
    // 忽略
  }
}

// 重置表单
function resetForm(): void {
  Object.assign(formData, defaultForm());
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  Object.keys(userMap).forEach((k) => delete userMap[k]);
  initUserIds.value = [];
  imageUrl.value = '';
  changeImg.value = false;
  currentFile.value = null;
  showAuthImg.value = false;
}

/** 打开表单弹窗 */
async function open(type: 'create' | 'update', row?: CollaborationItem): Promise<void> {
  dialogTitle.value = type === 'create' ? '新增' : '修改';
  formType.value = type;
  formLoading.value = true;
  resetForm();
  await getPolicetickettypesFunc();
  if (row) {
    // 修改：把整个 row 赋给 formData
    Object.assign(formData, JSON.parse(JSON.stringify(row)));
    const { relatedUserNames, relatedUserIds, iconUrl } = row;
    await getUserListByPage();
    // 处理 relatedUserIds 是数组或字符串的情况
    if (Array.isArray(relatedUserIds)) {
      formData.relatedUserNames = relatedUserNames ? (relatedUserNames as string).split(',') : [];
      formData.relatedUserIds = [...relatedUserIds];
      initUserIds.value = [...relatedUserIds];
    } else if (relatedUserIds) {
      formData.relatedUserNames = (relatedUserNames as string)?.split(',') ?? [];
      formData.relatedUserIds = (relatedUserIds as string).split(',');
      initUserIds.value = (relatedUserIds as string).split(',');
    }
    // 建立 userMap
    (formData.relatedUserIds as string[]).forEach((id: string, index: number) => {
      const names = formData.relatedUserNames as string[];
      userMap[id] = names[index];
    });
    imageUrl.value = iconUrl ?? '';
    showAuthImg.value = !!iconUrl;
  }
  formLoading.value = false;
  dialogVisible.value = true;
  await nextTick();
  formRef.value?.clearValidate();
}

/** 提交表单：数组转逗号字符串 */
async function submitForm(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  formLoading.value = true;
  try {
    const params: Record<string, unknown> = { ...formData };
    const relatedUserNames = params.relatedUserNames as string[];
    const relatedUserIds = params.relatedUserIds as string[];
    params.relatedUserNames = relatedUserNames.join(',');
    params.relatedUserIds = relatedUserIds.join(',');
    const api = formType.value === 'create' ? createCollaboration : updateCollaboration;
    const res = await api(params as never);
    if (res.code === 0) {
      ElMessage.success(formType.value === 'create' ? '新增成功' : '修改成功');
      dialogVisible.value = false;
      emit('success');
    } else {
      ElMessage.error(res.msg || '');
    }
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮：含图标上传逻辑 */
async function handleSubmit(): Promise<void> {
  if (changeImg.value && currentFile.value) {
    await uploadFile();
  }
  await submitForm();
}

// 关闭弹窗
function closeDialog(): void {
  dialogVisible.value = false;
}

defineExpose({ open });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    width="600px"
    align-center
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <!-- 协同岗名称 -->
      <el-form-item label="协同岗名称" prop="postName">
        <el-input v-model="formData.postName as string" maxlength="20" show-word-limit placeholder="请输入协同岗名称" />
      </el-form-item>

      <!-- 协同岗类型 -->
      <el-form-item label="协同岗类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择协同岗类型"
          :disabled="formType === 'update'"
          style="width: 100%"
        >
          <el-option v-for="item in collarationArr" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <!-- 图标 -->
      <el-form-item label="图标">
        <el-upload :show-file-list="false" :auto-upload="false" :on-change="handleChange" accept=".jpg,.png,.gif">
          <img v-if="imageUrl" :src="imageUrl" class="avatar" alt="icon" />
          <AuthImg v-else-if="showAuthImg" :auth-src="imageUrl" class="avatar" />
          <el-button v-else type="primary">点击上传</el-button>
        </el-upload>
      </el-form-item>

      <!-- 归属组织 -->
      <el-form-item label="归属组织" prop="orgName">
        <OrgTreeSelect
          v-model="formData.orgName as string"
          :is-init-value="false"
          placeholder="请选择归属组织"
          width="100%"
          @clear-val="cleanOrganizationInput"
          @current-change="organizationCurrentChange"
        />
      </el-form-item>

      <!-- 关联人员 -->
      <el-form-item label="关联人员" prop="relatedUserIds">
        <el-select
          v-model="formData.relatedUserIds as string[]"
          v-loadmore="handleScroll"
          multiple
          filterable
          remote
          reserve-keyword
          placeholder="请选择关联人员"
          :remote-method="remoteMethod"
          :loading="userLoading"
          style="width: 100%"
        >
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="getDisable(item)"
          />
        </el-select>
      </el-form-item>

      <!-- 警单类型（仅 type !== 1 时显示） -->
      <el-form-item v-if="formData.type !== 1" label="警单类型" prop="typeIds">
        <el-select
          v-model="formData.typeIds as string[]"
          multiple
          filterable
          remote
          reserve-keyword
          placeholder="请选择警单类型"
          :remote-method="remoteMethodType"
          :loading="loadingType"
          style="width: 100%"
        >
          <el-option v-for="item in typeList" :key="item.id" :label="item.tag" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="formLoading" @click="handleSubmit">
        {{ t('determine') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.avatar {
  width: 80px;
  height: 80px;
  border-radius: @radius-sm;
  object-fit: cover;
  display: block;
}
</style>
