<script setup lang="ts">
/**
 * CarouselForm - 轮播图表单弹窗
 *
 * 功能特性：
 * 1. 支持新增/编辑两种模式（由 type 区分）
 * 2. 图片自定义上传（el-upload auto-upload=false + 手动 POST）
 *    - 支持格式：jpg/png/gif
 *    - 大小上限：5MB
 *    - 编辑回显时使用 AuthImg 组件（携带 token 鉴权）
 * 3. 公众号选择（el-select + v-loadmore 滚动分页）
 * 4. 文章选择（依赖公众号：选了公众号用 el-select 选文章；没选公众号用 el-input 手输）
 * 5. 文章变更自动拼接跳转链接：url = IM_ADDRESS_HTTP + article.contentUrl
 *
 * @example 父组件调用
 * ```vue
 * <CarouselForm ref="formRef" @success="refresh" />
 * // 打开新增
 * formRef.value?.open('create')
 * // 打开编辑
 * formRef.value?.open('update', id)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发，父组件刷新列表
 *
 * Slots: 无
 *
 * Methods:
 * - open(type: 'create' | 'update', id?: string): 打开弹窗
 */
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import { getGlobalsList } from '@/api/dictionary/globals';
import {
  createCarousel,
  getArticleList,
  getCarousel,
  officialAccountsSelect,
  updateCarousel,
  uploadCarouselImage,
  type ArticleItem,
  type CarouselItem,
  type OfficialAccountOption,
} from '@/api/h5/carousel';
import AuthImg from '@/components/AuthImg/index.vue';

defineOptions({ name: 'CarouselForm' });

const emit = defineEmits<{
  /** 保存成功后触发 */
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const submitLoading = ref(false);

const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm: Partial<CarouselItem> = {
  id: undefined,
  title: undefined,
  pciUrl: undefined,
  officialAccountId: undefined,
  officialAccountName: undefined,
  articleId: '',
  url: undefined,
  sort: undefined,
};

const formData = reactive<Partial<CarouselItem>>({ ...defaultForm });

const rules = computed<Record<string, FormItemRule[]>>(() => ({
  pciUrl: [{ required: true, message: '轮播图不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
}));

// ===== 图片上传相关 =====
/** 本地预览 URL（新建/换图后使用） */
const imageUrl = ref('');
/** 编辑回显时使用 AuthImg 组件（带 token 鉴权） */
const showAuthImg = ref(false);
/** 当前选择的文件 */
const currentFile = ref<File | null>(null);
/** 标记图片是否被修改 */
const changeImg = ref(false);

/**
 * 上传前校验：校验图片文件类型（jpg/png/gif）与大小上限（5MB）
 *
 * @param file 待校验的图片文件
 * @returns 校验通过返回 true，否则返回 false 并提示错误
 */
function beforeUpload(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'png', 'gif'].includes(ext ?? '')) {
    ElMessage.error('图片格式只支持 jpg/png/gif');
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
 * 选择图片变化处理：校验文件、缓存选中文件、生成本地预览 URL 并赋值给 pciUrl 以通过必填校验
 *
 * @param file el-upload on-change 回调传入的文件对象
 */
function handleChange(file: UploadFile): void {
  if (!file.raw) return;
  if (!beforeUpload(file.raw)) return;
  currentFile.value = file.raw;
  changeImg.value = true;
  // 本地预览
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(file.raw);
  // 临时赋值给 pciUrl 以通过必填校验
  formData.pciUrl = imageUrl.value;
  nextTick(() => formRef.value?.clearValidate('pciUrl'));
}

/**
 * 自定义上传逻辑：将当前选中的图片文件上传至服务器，并把返回的图片 URL 写回 formData.pciUrl
 *
 * @returns 上传成功返回 true；未选择文件或上传失败时返回 false
 */
async function uploadFile(): Promise<boolean> {
  if (!currentFile.value) return true;
  const form = new FormData();
  form.append('file', currentFile.value);
  try {
    const res = await uploadCarouselImage(currentFile.value);
    if (res.code !== 0) {
      ElMessage.error('轮播图上传失败');
      return false;
    }
    // data 可能是数组或字符串，统一兼容处理
    const data = res.data;
    const url = Array.isArray(data) && data.length > 0 ? data[0] : (data as string);
    formData.pciUrl = url;
    return true;
  } catch {
    ElMessage.error('轮播图上传失败');
    return false;
  }
}

// ===== 公众号选择 =====
const officialAccountList = ref<OfficialAccountOption[]>([]);
const officialAccountParams = reactive({ pageNum: 1, pageSize: 999 });

/**
 * 加载公众号列表（一次性拉取），结果写入 officialAccountList 供下拉选择
 *
 * @returns Promise<void>
 */
async function loadOfficialAccounts(): Promise<void> {
  try {
    const res = await officialAccountsSelect(officialAccountParams);
    officialAccountList.value = (res.data?.records ?? []) as OfficialAccountOption[];
  } catch {
    // 忽略
  }
}

/**
 * 公众号选择变化处理：清空文章相关字段（articleId/url/title），同步公众号名称，
 * 并在选中公众号后重新拉取文章列表
 *
 * @param id 选中的公众号 id；清空时为 undefined
 */
function handleOfficialAccountChange(id: string | undefined): void {
  titleList.value = [];
  formData.articleId = '';
  formData.url = undefined;
  formData.title = undefined;
  formData.officialAccountName = officialAccountList.value.find((item) => item.id === id)?.name ?? undefined;
  if (id) {
    titlePage.pageNum = 1;
    loadArticleList(id);
  }
}

// ===== 文章选择 =====
const titleList = ref<ArticleItem[]>([]);
const titlePage = reactive({
  pageNum: 1,
  pageSize: 20,
  totalCount: 0,
  officialAccountId: '',
});
/** 文章跳转链接前缀（来自全局变量 IM_ADDRESS_HTTP） */
const envurl = ref('');

/**
 * 加载公众号文章列表：分页拉取并追加到 titleList，isMore=true 时为滚动加载更多，
 * 否则重置列表并默认选中第一篇文章
 *
 * @param id 公众号 id
 * @param isMore 是否为滚动加载更多（true 追加，false 重置并默认选第一篇）
 * @returns Promise<void>
 */
async function loadArticleList(id: string, isMore = false): Promise<void> {
  if (!isMore) {
    titlePage.pageNum = 1;
    titleList.value = [];
    formData.articleId = '';
    formData.url = undefined;
    formData.title = undefined;
  }
  try {
    const params = {
      pageNum: titlePage.pageNum,
      pageSize: titlePage.pageSize,
      officialAccountId: id,
      isDel: false,
    };
    const res = await getArticleList(params);
    const data = res.data as { records?: ArticleItem[]; totalCount?: number } | undefined;
    const records = data?.records ?? [];
    titlePage.totalCount = data?.totalCount ?? 0;
    titleList.value = [...titleList.value, ...records];
    // 默认选第一篇
    if (!isMore && titleList.value.length > 0) {
      formData.articleId = titleList.value[0].id;
      handleArticleChange();
    }
  } catch {
    // 忽略
  }
}

/**
 * 文章选择变化处理：根据当前 articleId 查找选中文章，拼接跳转链接 url = envurl + contentUrl，
 * 并同步标题 title 字段
 */
function handleArticleChange(): void {
  const selected = titleList.value.find((item) => item.id === formData.articleId);
  if (selected) {
    formData.url = `${envurl.value}${selected.contentUrl ?? ''}`;
    formData.title = selected.title;
  }
}

/**
 * 滚动加载更多文章：当下拉列表滚动到底部且未加载完所有 totalCount 时，递增 pageNum 触发 loadArticleList(isMore=true)
 */
function handleScroll(): void {
  if (titleList.value.length < titlePage.totalCount) {
    titlePage.pageNum++;
    const id = formData.officialAccountId;
    if (id) {
      loadArticleList(id, true);
    }
  }
}

/**
 * 加载环境 URL 配置：从全局变量字典中读取 IM_ADDRESS_HTTP，作为文章跳转链接的前缀写入 envurl
 *
 * @returns Promise<void>
 */
async function loadEnvUrl(): Promise<void> {
  try {
    const res = await getGlobalsList();
    const list = (res.data ?? []) as { name: string; value: string }[];
    envurl.value = list.find((item) => item.name === 'IM_ADDRESS_HTTP')?.value ?? '';
  } catch {
    // 忽略
  }
}

/**
 * 重置表单：清空 formData 字段并恢复默认值，释放本地预览 URL，重置上传状态与文章列表
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
  titleList.value = [];
}

/**
 * 打开弹窗，传入 type 区分新增/编辑模式；传入 id 时为编辑模式，回显轮播图详情并加载对应文章列表
 *
 * @param type 模式：'create' 新增 / 'update' 编辑
 * @param id 编辑模式下传入的轮播图 id；新增模式下省略
 * @returns Promise<void>
 */
async function open(type: 'create' | 'update', id?: string): Promise<void> {
  resetForm();
  dialogVisible.value = true;
  dialogTitle.value = type === 'create' ? '新增' : '修改';
  formType.value = type;
  // 初次加载公众号列表与全局变量
  await Promise.all([loadOfficialAccounts(), loadEnvUrl()]);
  if (id) {
    formLoading.value = true;
    try {
      const res = await getCarousel(id);
      const data = res.data as CarouselItem | undefined;
      if (data) {
        Object.assign(formData, data);
        showAuthImg.value = true;
        imageUrl.value = (data.pciUrl as string) ?? '';
        titlePage.officialAccountId = (data.officialAccountId as string) ?? '';
        if (data.officialAccountId) {
          await loadArticleList(data.officialAccountId as string);
        }
      }
    } finally {
      formLoading.value = false;
    }
  }
}

defineExpose({ open });

/**
 * 提交表单：先做表单校验，若图片被修改则先上传图片，再根据 formType 调用新增/更新接口，
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
  // 若图片被修改，先上传图片
  if (changeImg.value) {
    const ok = await uploadFile();
    if (!ok) return;
  }
  submitLoading.value = true;
  try {
    const isCreate = formType.value === 'create';
    const payload = { ...formData };
    const res = isCreate ? await createCarousel(payload) : await updateCarousel(payload);
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
    width="750px"
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
      label-width="200px"
      class="dialog-form"
    >
      <!-- 轮播图 -->
      <el-form-item label="轮播图" prop="pciUrl">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleChange"
          accept=".jpg,.png,.gif,.JPG,.PNG,.GIF"
        >
          <AuthImg v-if="showAuthImg && imageUrl" :auth-src="imageUrl" class="avatar" />
          <img v-else-if="imageUrl" :src="imageUrl" class="avatar" alt="preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <!-- 公众号 -->
      <el-form-item label="公众号" prop="officialAccountId">
        <el-select
          v-model="formData.officialAccountId as string"
          placeholder="请选择"
          clearable
          filterable
          style="width: 100%"
          @change="handleOfficialAccountChange"
        >
          <el-option v-for="item in officialAccountList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <!-- 标题：选了公众号用 el-select 选文章；没选则手输 -->
      <el-form-item label="标题" prop="title">
        <el-select
          v-if="formData.officialAccountId"
          v-model="formData.articleId as string"
          v-loadmore="handleScroll"
          filterable
          placeholder="请选择文章"
          style="width: 100%"
          @change="handleArticleChange"
        >
          <el-option v-for="item in titleList" :key="item.id" :label="item.title" :value="item.id" />
        </el-select>
        <el-input v-else v-model="formData.title as string" maxlength="128" placeholder="请输入标题" />
      </el-form-item>

      <!-- 跳转链接 -->
      <el-form-item label="跳转链接" prop="url">
        <el-input v-model="formData.url as string" maxlength="128" placeholder="请输入链接地址" />
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
    width: 170px;
    height: 80px;
    border: 1px dashed @color-border;
    border-radius: 4px;
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
