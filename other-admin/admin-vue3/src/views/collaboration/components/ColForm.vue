<script setup lang="ts">
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ref, reactive, computed, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  createCollaboration,
  updateCollaboration,
  uploadColTmp,
  queryUserByPage,
  type CollaborationItem,
  type QueryUserByPageItem,
} from '@/api/h5/collaboration';
import { getPolicetickettypes, type PoliceTicketTypeItem } from '@/api/policeReport/dock';
import AuthImg from '@/components/AuthImg/index.vue';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import vLoadmore from '@/directives/loadmore';
import { useUserStore } from '@/store/modules/useUserStore';

defineOptions({ name: 'ColForm' });

withDefaults(
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
const userRequestError = ref(false);
const userSearchKeyword = ref('');
const initUserIds = ref<string[]>([]);
let userRequestSequence = 0;
let userRequestController: AbortController | undefined;
let formOpenSequence = 0;

// 警单类型
const typeList = ref<PoliceTicketTypeItem[]>([]);
const originTypeList = ref<PoliceTicketTypeItem[]>([]);
const loadingType = ref(false);

const userStatusText = computed(() => {
  if (!formData.orgCode) return '请先选择归属组织，再搜索该组织及下属单位的人员。';
  if (userLoading.value) return `正在加载${formData.orgName || '当前组织'}及下属单位的人员…`;
  if (userRequestError.value) return '人员加载失败，已选人员仍保留。请重试。';
  if (userSearchKeyword.value && userList.value.length === 0) {
    return `未找到“${userSearchKeyword.value}”匹配的人员。`;
  }
  if (userList.value.length === 0) return '当前组织暂无可关联人员。';
  return `${formData.orgName || '当前组织'}及下属单位 · 共 ${userTotal.value} 人 · 已选 ${formData.relatedUserIds.length} 人`;
});

const userEmptyText = computed(() => {
  if (!formData.orgCode) return '请先选择归属组织';
  if (userRequestError.value) return '人员加载失败，请在下方重试';
  if (userSearchKeyword.value) return `未找到“${userSearchKeyword.value}”匹配的人员`;
  return '当前组织暂无可关联人员';
});

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
function uploadFile(): Promise<boolean> {
  if (!currentFile.value) return Promise.resolve(true);
  const form = new FormData();
  form.append('file', currentFile.value);
  return uploadColTmp(form)
    .then((res) => {
      if (res.code === 0) {
        const data = (res as unknown as { data?: { iconUrl: string; fileId: string } })?.data;
        if (data) {
          formData.iconUrl = data.iconUrl;
          formData.fileId = data.fileId;
        }
        return true;
      } else {
        ElMessage.error(res.msg || '图标上传失败');
        return false;
      }
    })
    .catch(() => {
      ElMessage.error('图标上传失败');
      return false;
    });
}

/** 组织树选中：设置 orgId/orgName/orgCode，重置关联人员 */
function organizationCurrentChange(data: { id?: string; name?: string; code?: string }): void {
  invalidateUserRequest();
  formData.orgId = data.id ?? '';
  formData.orgName = data.name ?? '';
  formData.orgCode = data.code ?? '';
  // 重置关联人员
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  userRequestError.value = false;
  userSearchKeyword.value = '';
  formData.relatedUserIds = [];
  formData.relatedUserNames = [];
}

function cleanOrganizationInput(): void {
  invalidateUserRequest();
  formData.orgId = '';
  formData.orgName = '';
  formData.orgCode = '';
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  userRequestError.value = false;
  userSearchKeyword.value = '';
  formData.relatedUserIds = [];
  formData.relatedUserNames = [];
}

/** 使当前人员查询失效，并取消仍在进行的请求。 */
function invalidateUserRequest(): void {
  userRequestSequence += 1;
  userRequestController?.abort();
  userRequestController = undefined;
  userLoading.value = false;
}

/** 分页查询关联人员 */
function getUserListByPage(): Promise<void> {
  const orgCode = formData.orgCode;
  const orgId = formData.orgId;
  if (!orgCode) return Promise.resolve();
  if (userLoading.value) return Promise.resolve();

  const requestSequence = userRequestSequence;
  const requestController = new AbortController();
  const pageNum = userPageNum.value + 1;
  userRequestController = requestController;
  userLoading.value = true;
  userRequestError.value = false;
  const params = {
    privString: orgId,
    code: orgCode,
    includeChildren: 1,
    pageNum,
    pageSize: userPageSize,
    name: userSearchKeyword.value || undefined,
    ...(globalData.value?.value === 'true' ? { type: formData.type } : {}),
  };
  return queryUserByPage(params, { abort: requestController.signal })
    .then((res) => {
      if (requestSequence !== userRequestSequence) return;
      if (res.code !== 0 || !res.data) {
        userRequestError.value = true;
        ElMessage.error(res.msg || '获取关联人员失败');
        return;
      }
      const { records, total } = res.data;
      records.forEach((i) => {
        userMap[i.id] = i.name;
      });
      userList.value = pageNum === 1 ? records : [...userList.value, ...records];
      userPageNum.value = pageNum;
      userTotal.value = total;
      userRequestError.value = false;
    })
    .catch(() => {
      if (requestSequence === userRequestSequence && !requestController.signal.aborted) {
        userRequestError.value = true;
        ElMessage.error('获取关联人员失败');
      }
    })
    .finally(() => {
      if (requestSequence === userRequestSequence && userRequestController === requestController) {
        userRequestController = undefined;
        userLoading.value = false;
      }
    });
}

/** 触底加载 */
function handleScroll(): void {
  if (!userLoading.value && userList.value.length < userTotal.value) {
    getUserListByPage();
  }
}

/** 远程搜索：重置 pageNum=0 + 空列表 */
function remoteMethod(keywords: string): void {
  invalidateUserRequest();
  userSearchKeyword.value = keywords;
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  userRequestError.value = false;
  getUserListByPage();
}

/** 按当前组织、关键词和页码重试人员查询。 */
function retryUserSearch(): void {
  if (userLoading.value || !formData.orgCode) return;
  getUserListByPage();
}

/** 关联人员禁用规则：已绑定其他协同岗的人员禁用，但当前协同岗已绑定的允许 */
function getDisable(data: QueryUserByPageItem): boolean {
  const { isBinding, id } = data;
  if (initUserIds.value.includes(id)) {
    return false;
  }
  return isBinding === 1;
}

/** 返回人员不可选的原因，避免只用置灰状态传达业务规则。 */
function getDisabledReason(data: QueryUserByPageItem): string {
  return getDisable(data) ? '已关联至其他协同岗' : '';
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
function getPolicetickettypesFunc(): Promise<void> {
  return getPolicetickettypes()
    .then((res) => {
      if (res.code === 0) {
        const data = (res as unknown as { data?: PoliceTicketTypeItem[] })?.data ?? [];
        typeList.value = data;
        originTypeList.value = data;
      }
    })
    .catch(() => {
      // 忽略
    });
}

// 重置表单
function resetForm(): void {
  invalidateUserRequest();
  Object.assign(formData, defaultForm());
  userList.value = [];
  userPageNum.value = 0;
  userTotal.value = 0;
  userRequestError.value = false;
  userSearchKeyword.value = '';
  Object.keys(userMap).forEach((k) => delete userMap[k]);
  initUserIds.value = [];
  imageUrl.value = '';
  changeImg.value = false;
  currentFile.value = null;
  showAuthImg.value = false;
}

/** 打开表单弹窗 */
function open(type: 'create' | 'update', row?: CollaborationItem): Promise<void> {
  const requestSequence = ++formOpenSequence;
  dialogTitle.value = type === 'create' ? '新增' : '修改';
  formType.value = type;
  formLoading.value = true;
  resetForm();
  dialogVisible.value = true;
  const loadForm = getPolicetickettypesFunc().then(() => {
    if (requestSequence !== formOpenSequence || !row) return;
    // 修改：把整个 row 赋给 formData
    Object.assign(formData, JSON.parse(JSON.stringify(row)));
    const { relatedUserNames, relatedUserIds, iconUrl } = row;
    return getUserListByPage().then(() => {
      if (requestSequence !== formOpenSequence) return;
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
    });
  });
  return loadForm
    .then(() => nextTick())
    .then(() => {
      if (requestSequence !== formOpenSequence) return;
      formRef.value?.clearValidate();
    })
    .catch(() => {
      if (requestSequence !== formOpenSequence) return;
      ElMessage.error('加载协同岗信息失败');
    })
    .finally(() => {
      if (requestSequence === formOpenSequence) formLoading.value = false;
    });
}

/** 提交表单：数组转逗号字符串 */
async function submitForm(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  formLoading.value = true;
  const params: Record<string, unknown> = { ...formData };
  const relatedUserNames = params.relatedUserNames as string[];
  const relatedUserIds = params.relatedUserIds as string[];
  params.relatedUserNames = relatedUserNames.join(',');
  params.relatedUserIds = relatedUserIds.join(',');
  const api = formType.value === 'create' ? createCollaboration : updateCollaboration;
  return api(params as never)
    .then((res) => {
      if (res.code === 0) {
        ElMessage.success(formType.value === 'create' ? '新增成功' : '修改成功');
        dialogVisible.value = false;
        emit('success');
      } else {
        ElMessage.error(res.msg || '');
      }
    })
    .catch(() => {
      ElMessage.error(formType.value === 'create' ? '新增失败' : '修改失败');
    })
    .finally(() => {
      formLoading.value = false;
    });
}

/** 提交按钮：含图标上传逻辑 */
function handleSubmit(): Promise<void> {
  const uploadPromise = changeImg.value && currentFile.value ? uploadFile() : Promise.resolve(true);
  return uploadPromise.then((uploaded) => {
    if (uploaded) return submitForm();
  });
}

// 关闭弹窗
function closeDialog(): void {
  formOpenSequence += 1;
  invalidateUserRequest();
  formLoading.value = false;
  dialogVisible.value = false;
}

onBeforeUnmount(invalidateUserRequest);

defineExpose({ open });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    class="col-form-dialog"
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
        <div v-if="formType === 'update'" class="field-hint">协同岗类型创建后不可修改。</div>
      </el-form-item>

      <!-- 图标 -->
      <el-form-item label="图标">
        <el-upload :show-file-list="false" :auto-upload="false" :on-change="handleChange" accept=".jpg,.png,.gif">
          <img v-if="imageUrl" :src="imageUrl" class="avatar" alt="icon" />
          <AuthImg v-else-if="showAuthImg" :auth-src="imageUrl" alt="协同岗图标预览" class="avatar" />
          <el-button v-else type="primary">点击上传</el-button>
        </el-upload>
        <div class="upload-hint">支持 JPG、PNG、GIF，文件需小于 1 MB</div>
      </el-form-item>

      <!-- 归属组织 -->
      <el-form-item label="归属组织" prop="orgName">
        <OrgTreeSelect
          v-model="formData.orgName as string"
          :is-init-value="formType === 'update'"
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
          :aria-busy="userLoading"
          style="width: 100%"
        >
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="getDisable(item)"
          >
            <span class="user-option">
              <span>{{ item.name }}</span>
              <span v-if="getDisabledReason(item)" class="user-option__reason">
                {{ getDisabledReason(item) }}
              </span>
            </span>
          </el-option>
          <template #empty>
            <div class="user-select-empty" role="status" aria-live="polite">
              {{ userEmptyText }}
            </div>
          </template>
          <template #loading>
            <div class="user-select-empty" role="status" aria-live="polite">正在搜索关联人员…</div>
          </template>
        </el-select>
        <div class="user-select-feedback" role="status" aria-live="polite">
          <span>{{ userStatusText }}</span>
          <el-button
            v-if="userRequestError && formData.orgCode"
            link
            type="primary"
            :disabled="userLoading"
            aria-label="重试关联人员搜索"
            @click="retryUserSearch"
          >
            重试
          </el-button>
        </div>
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

.upload-hint {
  margin-left: 12px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 20px;
}

.field-hint,
.user-select-feedback {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
}

.user-select-feedback {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.user-select-empty {
  padding: 8px 12px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.user-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.user-option__reason {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

:deep(.el-input__count) {
  color: var(--el-text-color-regular);
}

@media (max-width: 480px) {
  :deep(.col-form-dialog .el-form-item) {
    display: block;
    margin-bottom: 14px;
  }

  :deep(.col-form-dialog .el-form-item__label) {
    justify-content: flex-start;
    width: 100% !important;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  :deep(.col-form-dialog .el-form-item__content) {
    margin-left: 0 !important;
  }

  .upload-hint {
    margin-left: 0;
  }
}
</style>
