<script setup lang="ts">
/**
 * AppForm - 应用编辑弹窗
 *
 * 功能特性：
 * 1. 支持新增/编辑两种模式（由 type 区分）
 * 2. 图标自定义上传（el-upload auto-upload=false + 手动调 uploadAppIcon）
 *    - 编辑回显时使用 AuthImg 组件携带 token 鉴权
 *    - 新建/换图后用 ObjectURL 本地预览
 * 3. 应用类型联动字段：
 *    - type=0（本地）：packageAndroid + activity
 *    - type=1（网页）：url
 *    - type=3（鸿蒙）：packageHm + appId
 * 4. scope 可见范围多选（部门 id 数组）
 * 5. zone 上架区域单选（中国/海外/全球）
 * 6. prerequisite 前置应用选择（来自 getPrerequisiteList）
 *
 * @example 父组件调用
 * ```vue
 * <AppForm ref="formRef" @success="refresh" />
 * formRef.value?.open('create')
 * formRef.value?.open('update', id)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发，父组件刷新列表
 */
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import {
  createInfo,
  getInfo,
  getPrerequisiteList,
  updateInfo,
  uploadAppIcon,
  type AppItem,
  type AppPrerequisiteOption,
  type AppType,
  type AppZone,
} from '@/api/thirdInterface/app';
import AuthImg from '@/components/AuthImg/index.vue';

defineOptions({ name: 'AppForm' });

const emit = defineEmits<{
  /** 保存成功后触发 */
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增应用');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const submitLoading = ref(false);

const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm: Partial<AppItem> = {
  id: undefined,
  name: undefined,
  icon: undefined,
  type: 0,
  url: undefined,
  packageAndroid: undefined,
  packageHm: undefined,
  activity: undefined,
  appId: undefined,
  params: undefined,
  scope: [],
  zone: 1,
  prerequisite: undefined,
  sort: 0,
  status: 0,
};

const formData = reactive<Partial<AppItem>>({ ...defaultForm });

// ===== 图标上传相关 =====
/** 本地预览 URL（新建/换图后使用） */
const imageUrl = ref('');
/** 编辑回显时使用 AuthImg 组件（带 token 鉴权） */
const showAuthImg = ref(false);
/** 当前选择的文件 */
const currentFile = ref<File | null>(null);
/** 标记图片是否被修改 */
const changeImg = ref(false);

/**
 * 上传前校验：校验图标文件类型（jpg/png）与大小上限（5MB）
 *
 * @param file 待校验的图标文件
 * @returns 校验通过返回 true，否则返回 false 并提示错误
 */
function beforeUpload(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'png'].includes(ext ?? '')) {
    ElMessage.error('图片格式只支持 jpg/png');
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
}

/**
 * 文件选择变化处理：校验文件、缓存选中文件、生成本地预览 URL 并赋值给 formData.icon 以通过必填校验
 *
 * @param file el-upload on-change 回调传入的文件对象
 */
function handleChange(file: UploadFile): void {
  if (!file.raw) return;
  if (!beforeUpload(file.raw)) return;
  currentFile.value = file.raw;
  changeImg.value = true;
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(file.raw);
  formData.icon = imageUrl.value;
  nextTick(() => formRef.value?.clearValidate('icon'));
}

/**
 * 自定义上传逻辑：将当前选中的图标文件上传至服务器，并把返回的图片 URL 写回 formData.icon
 *
 * @returns 上传成功返回 true；未选择文件或上传失败时返回 false
 */
async function uploadFile(): Promise<boolean> {
  if (!currentFile.value) return true;
  try {
    const res = await uploadAppIcon(currentFile.value);
    if (res.code !== 0) {
      ElMessage.error('图标上传失败');
      return false;
    }
    const data = res.data;
    const url = Array.isArray(data) && data.length > 0 ? data[0] : (data as string);
    formData.icon = url;
    return true;
  } catch {
    ElMessage.error('图标上传失败');
    return false;
  }
}

// ===== 前置应用列表 =====
const prerequisiteList = ref<AppPrerequisiteOption[]>([]);

/**
 * 加载前置应用列表，结果写入 prerequisiteList 供下拉选择
 *
 * @returns Promise<void>
 */
async function loadPrerequisiteList(): Promise<void> {
  try {
    const res = await getPrerequisiteList();
    prerequisiteList.value = (res.data ?? []) as AppPrerequisiteOption[];
  } catch {
    // 忽略
  }
}

// ===== 类型联动字段 =====
// 应用类型：0-H5应用、1-App应用、3-前置应用
const typeOptions = [
  { label: 'H5应用', value: 0 as AppType },
  { label: 'App应用', value: 1 as AppType },
  { label: '前置应用', value: 3 as AppType },
];

// 业务区域：1-一类区、2-二类区、3-三类区
const zoneOptions = [
  { label: '一类区', value: 1 as AppZone },
  { label: '二类区', value: 2 as AppZone },
  { label: '三类区', value: 3 as AppZone },
];

// ===== 校验规则 =====
const rules = computed<Record<string, FormItemRule[]>>(() => {
  const base: Record<string, FormItemRule[]> = {
    name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
    zone: [{ required: true, message: '请选择上架区域', trigger: 'change' }],
    sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  };
  // 类型联动校验
  if (formData.type === 1) {
    base.url = [{ required: true, message: '请输入 H5 链接', trigger: 'blur' }];
  } else if (formData.type === 0) {
    base.packageAndroid = [{ required: true, message: '请输入 Android 安装包路径', trigger: 'blur' }];
    base.activity = [{ required: true, message: '请输入启动 Activity', trigger: 'blur' }];
  } else if (formData.type === 3) {
    base.packageHm = [{ required: true, message: '请输入鸿蒙安装包路径', trigger: 'blur' }];
    base.appId = [{ required: true, message: '请输入鸿蒙 appId', trigger: 'blur' }];
  }
  return base;
});

/**
 * 重置表单：清空 formData 字段并恢复默认值，释放本地预览 URL，重置上传状态
 */
function resetForm(): void {
  Object.keys(formData).forEach((k) => delete (formData as Record<string, unknown>)[k]);
  Object.assign(formData, { ...defaultForm });
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = '';
  showAuthImg.value = false;
  changeImg.value = false;
  currentFile.value = null;
}

/**
 * 打开弹窗：传入 type 区分新增/编辑模式；传入 id 时为编辑模式，回显应用详情
 *
 * @param type 模式：'create' 新增 / 'update' 编辑
 * @param id 编辑模式下传入的应用 id；新增模式下省略
 * @returns Promise<void>
 */
async function open(type: 'create' | 'update', id?: string): Promise<void> {
  resetForm();
  dialogVisible.value = true;
  dialogTitle.value = type === 'create' ? '新增应用' : '编辑应用';
  formType.value = type;
  await loadPrerequisiteList();
  if (id) {
    formLoading.value = true;
    try {
      const res = await getInfo(id);
      const data = res.data as AppItem | undefined;
      if (data) {
        Object.assign(formData, data);
        showAuthImg.value = true;
        imageUrl.value = (data.icon as string) ?? '';
      }
    } finally {
      formLoading.value = false;
    }
  }
}

defineExpose({ open });

/**
 * 提交表单：先做表单校验，若图标被修改则先上传图标，再根据 formType 调用新增/更新接口，
 * 成功后关闭弹窗并触发 success 事件
 *
 * @returns Promise<void>
 */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写');
    return;
  }
  // 若图标被修改，先上传图标
  if (changeImg.value) {
    const ok = await uploadFile();
    if (!ok) return;
  }
  submitLoading.value = true;
  try {
    const isCreate = formType.value === 'create';
    const payload = { ...formData };
    const res = isCreate ? await createInfo(payload) : await updateInfo(payload);
    if (res.code === 0) {
      ElMessage.success(isCreate ? '新增成功' : '修改成功');
      dialogVisible.value = false;
      emit('success');
    } else {
      ElMessage.error(res.msg ?? (isCreate ? '新增失败' : '修改失败'));
    }
  } finally {
    submitLoading.value = false;
  }
}

/** 弹窗打开后清除校验状态 */
function handleDialogOpen(): void {
  nextTick(() => formRef.value?.clearValidate());
}

/** 弹窗关闭时清理本地预览 URL */
function handleDialogClosed(): void {
  if (imageUrl.value && changeImg.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  resetForm();
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="720px"
    align-center
    append-to-body
    @open="handleDialogOpen"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-position="left"
      label-width="140px"
      class="dialog-form"
    >
      <!-- 应用图标 -->
      <el-form-item label="应用图标" prop="icon">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleChange"
          accept=".jpg,.png,.JPG,.PNG"
        >
          <AuthImg v-if="showAuthImg && imageUrl" :auth-src="imageUrl" class="avatar" />
          <img v-else-if="imageUrl" :src="imageUrl" class="avatar" alt="preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <!-- 应用名称 -->
      <el-form-item label="应用名称" prop="name">
        <el-input v-model="formData.name as string" placeholder="请输入应用名称" maxlength="32" />
      </el-form-item>

      <!-- 应用类型 -->
      <el-form-item label="应用类型" prop="type">
        <el-select v-model="formData.type as AppType" placeholder="请选择应用类型" style="width: 100%">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <!-- H5 链接（type=1 时显示） -->
      <el-form-item v-if="formData.type === 1" label="H5 链接" prop="url">
        <el-input v-model="formData.url as string" placeholder="请输入 H5 链接" maxlength="256" />
      </el-form-item>

      <!-- Android 安装包路径（type=0 时显示） -->
      <el-form-item v-if="formData.type === 0" label="Android 安装包" prop="packageAndroid">
        <el-input v-model="formData.packageAndroid as string" placeholder="请输入安装包路径" maxlength="256" />
      </el-form-item>

      <!-- Android 启动 Activity（type=0 时显示） -->
      <el-form-item v-if="formData.type === 0" label="启动 Activity" prop="activity">
        <el-input v-model="formData.activity as string" placeholder="请输入启动 Activity" maxlength="256" />
      </el-form-item>

      <!-- 鸿蒙安装包路径（type=3 时显示） -->
      <el-form-item v-if="formData.type === 3" label="鸿蒙安装包" prop="packageHm">
        <el-input v-model="formData.packageHm as string" placeholder="请输入安装包路径" maxlength="256" />
      </el-form-item>

      <!-- 鸿蒙 appId（type=3 时显示） -->
      <el-form-item v-if="formData.type === 3" label="鸿蒙 appId" prop="appId">
        <el-input v-model="formData.appId as string" placeholder="请输入鸿蒙 appId" maxlength="128" />
      </el-form-item>

      <!-- 启动参数 -->
      <el-form-item label="启动参数" prop="params">
        <el-input v-model="formData.params as string" placeholder="请输入启动参数" maxlength="256" />
      </el-form-item>

      <!-- 可见范围 -->
      <el-form-item label="可见范围" prop="scope">
        <el-select
          v-model="formData.scope as number[]"
          multiple
          filterable
          placeholder="请选择可见范围（部门）"
          style="width: 100%"
        >
          <el-option v-for="item in formData.scopeList ?? []" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <!-- 上架区域 -->
      <el-form-item label="上架区域" prop="zone">
        <el-radio-group v-model="formData.zone as AppZone">
          <el-radio v-for="opt in zoneOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 前置应用 -->
      <el-form-item label="前置应用" prop="prerequisite">
        <el-select
          v-model="formData.prerequisite as string"
          clearable
          filterable
          placeholder="请选择前置应用"
          style="width: 100%"
        >
          <el-option v-for="item in prerequisiteList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <!-- 排序值 -->
      <el-form-item label="排序值" prop="sort">
        <el-input-number v-model="formData.sort as number" :min="0" controls-position="right" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.avatar-uploader {
  :deep(.el-upload) {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border: 1px dashed @color-border;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: @color-primary;
    }
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: @color-text-placeholder;
  }
}

.dialog-form {
  width: 600px;
  margin-left: 20px;
}
</style>
