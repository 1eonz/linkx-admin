<script setup lang="ts">
/**
 * EditSectionModal - App H5 板块新增/编辑弹窗
 *
 * 功能特性：
 * 1. 公共字段：name / type / sort / show
 * 2. 按 type 动态字段（custom，JSON 字符串）：
 *    - type=2 常用应用：rowCount（1~10）
 *    - type=4 三方网页：url + iframePageUrl
 *    - type=5 分割条：contentType（text/upload）+ lineContent 或图片上传
 *    - 其他：无自定义字段
 * 3. 通过 props.initialData 在 setup 时初始化回显数据
 * 4. 通过 emit('ok', form) 返回表单数据，由 createDialog 统一关闭弹窗
 *
 * @example 父组件调用（配合 createDialog）
 * ```ts
 * const dialog = createDialog(EditSectionModal, { title: '板块编辑', width: '600px' });
 * // 新增
 * const result = await dialog();
 * // 编辑
 * const result = await dialog({ props: { initialData: row } });
 * ```
 *
 * Props:
 * - initialData?: LayoutSection，编辑模式时回显的数据
 *
 * Events:
 * - ok: 表单校验通过时触发，参数 LayoutSection
 * - cancel: 点击取消按钮时触发
 */
import { Delete, Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import type { LayoutSection, LayoutSectionType } from '@/api/baseData/layoutConfig';

defineOptions({ name: 'EditSectionModal' });

const props = defineProps<{
  initialData?: LayoutSection;
}>();

const emit = defineEmits<{
  (e: 'ok', data: LayoutSection): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

/** 板块类型选项 */
const typeOptions: Array<{ value: LayoutSectionType; label: string }> = [
  { value: 1, label: '轮播图' },
  { value: 2, label: '常用应用' },
  { value: 3, label: '协同群组' },
  { value: 4, label: '三方网页' },
  { value: 5, label: '分割条' },
  { value: 6, label: '消息列表' },
];

/** 分割条内容类型 */
type LineContentType = 'text' | 'upload';

/** 表单数据 */
interface SectionForm {
  id?: string;
  name: string;
  type: LayoutSectionType;
  url: string;
  show: 0 | 1;
  sort: number;
  gmtCreated?: string;
  // 动态字段（type=2）
  rowCount: number;
  // 动态字段（type=4）
  iframePageUrl: string;
  // 动态字段（type=5）
  contentType: LineContentType;
  lineContent: string;
  lineImage: string;
}

const defaultForm = (): SectionForm => ({
  name: '',
  type: 1,
  url: '',
  show: 1,
  sort: 1,
  rowCount: 1,
  iframePageUrl: '',
  contentType: 'text',
  lineContent: '',
  lineImage: '',
});

/** 解析 custom 字段，回显到表单 */
function applyCustomToForm(form: SectionForm, customStr?: string): void {
  if (!customStr) return;
  try {
    const custom = JSON.parse(customStr) as Record<string, unknown>;
    if (form.type === 2 && typeof custom.rowCount === 'number') {
      form.rowCount = custom.rowCount;
    } else if (form.type === 4) {
      if (typeof custom.url === 'string') form.url = form.url || custom.url;
      if (typeof custom.iframePageUrl === 'string') form.iframePageUrl = custom.iframePageUrl;
    } else if (form.type === 5) {
      if (custom.contentType === 'text' || custom.contentType === 'upload') {
        form.contentType = custom.contentType;
      }
      if (typeof custom.lineContent === 'string') form.lineContent = custom.lineContent;
      if (typeof custom.lineImage === 'string') form.lineImage = custom.lineImage;
    }
  } catch {
    // custom 不是合法 JSON，忽略
  }
}

/** 根据 props.initialData 初始化表单 */
function initForm(): SectionForm {
  const form = defaultForm();
  const row = props.initialData;
  if (row) {
    form.id = row.id;
    form.name = row.name;
    form.type = row.type;
    form.url = row.url ?? '';
    form.show = row.show;
    form.sort = row.sort;
    form.gmtCreated = row.gmtCreated;
    applyCustomToForm(form, row.custom);
  }
  return form;
}

const formData = reactive<SectionForm>(initForm());

/** 校验规则 */
const rules = computed<FormRules<SectionForm>>(() => ({
  name: [{ required: true, message: '请输入板块名称', trigger: ['change', 'blur'] }],
  type: [{ required: true, message: '请选择板块类型', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
}));

/** 当前是否需要展示动态字段 */
const showRowCount = computed(() => formData.type === 2);
const showUrlFields = computed(() => formData.type === 4);
const showLineFields = computed(() => formData.type === 5);

/** 收集动态字段到 custom 字符串 */
function buildCustom(): string | undefined {
  if (formData.type === 2) {
    return JSON.stringify({ rowCount: formData.rowCount });
  }
  if (formData.type === 4) {
    return JSON.stringify({ url: formData.url, iframePageUrl: formData.iframePageUrl });
  }
  if (formData.type === 5) {
    return JSON.stringify({
      contentType: formData.contentType,
      lineContent: formData.contentType === 'text' ? formData.lineContent : '',
      lineImage: formData.contentType === 'upload' ? formData.lineImage : '',
    });
  }
  return undefined;
}

/** type 切换时重置动态字段，避免脏数据 */
watch(
  () => formData.type,
  () => {
    formData.rowCount = 1;
    formData.iframePageUrl = '';
    formData.contentType = 'text';
    formData.lineContent = '';
    formData.lineImage = '';
  },
);

/** 图片上传前校验 */
function beforeImageUpload(file: File): boolean {
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
  if (!isImage) {
    ElMessage.error('仅支持 jpg/png/gif/webp 格式图片');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
}

/** 图片选择回调：转为 Base64 存储（无独立上传接口） */
function handleImageChange(file: UploadFile): void {
  if (!file.raw) return;
  if (!beforeImageUpload(file.raw)) return;
  const reader = new FileReader();
  reader.onload = () => {
    formData.lineImage = String(reader.result ?? '');
  };
  reader.readAsDataURL(file.raw);
}

/** 移除已选图片 */
function handleRemoveImage(): void {
  formData.lineImage = '';
}

/** 取消 */
function handleCancel(): void {
  emit('cancel');
}

/** 提交：校验通过后构造 LayoutSection 并 emit ok */
function handleSubmit(): void {
  if (!formRef.value) return;
  formRef.value
    .validate()
    .then(() => {
      submitting.value = true;
      const custom = buildCustom();
      const payload: LayoutSection = {
        name: formData.name,
        type: formData.type,
        show: formData.show,
        sort: formData.sort,
      };
      if (formData.id !== undefined && formData.id !== '') {
        payload.id = formData.id;
      }
      if (formData.gmtCreated) {
        payload.gmtCreated = formData.gmtCreated;
      }
      if (formData.type === 4) {
        payload.url = formData.url;
      }
      if (custom !== undefined) {
        payload.custom = custom;
      }
      emit('ok', payload);
    })
    .catch(() => {
      // 校验失败，不处理
    })
    .finally(() => {
      submitting.value = false;
    });
}
</script>

<template>
  <div class="edit-section-modal">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" style="width: 500px" size="large">
      <el-form-item label="板块名称" prop="name">
        <el-input v-model.trim="formData.name" placeholder="请输入板块名称" />
      </el-form-item>
      <el-form-item label="板块类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择板块类型" style="width: 100%">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否显示" prop="show">
        <el-switch
          v-model="formData.show"
          :active-value="1"
          :inactive-value="0"
          active-text="显示"
          inactive-text="隐藏"
          inline-prompt
        />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="999" />
      </el-form-item>

      <!-- type=2 常用应用：rowCount -->
      <el-form-item v-if="showRowCount" label="每行应用数">
        <el-input-number v-model="formData.rowCount" :min="1" :max="10" />
      </el-form-item>

      <!-- type=4 三方网页：url + iframePageUrl -->
      <template v-if="showUrlFields">
        <el-form-item label="跳转 URL" prop="url">
          <el-input v-model.trim="formData.url" placeholder="请输入跳转 URL" />
        </el-form-item>
        <el-form-item label="iframe 页面 URL">
          <el-input v-model.trim="formData.iframePageUrl" placeholder="请输入 iframe 嵌入页面 URL" />
        </el-form-item>
      </template>

      <!-- type=5 分割条：contentType + lineContent / lineImage -->
      <template v-if="showLineFields">
        <el-form-item label="内容类型">
          <el-radio-group v-model="formData.contentType">
            <el-radio value="text">文字</el-radio>
            <el-radio value="upload">图片</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.contentType === 'text'" label="分割条文字">
          <el-input v-model.trim="formData.lineContent" placeholder="请输入分割条文字" />
        </el-form-item>
        <el-form-item v-else label="分割条图片">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <el-button :icon="Upload">选择图片</el-button>
          </el-upload>
          <div v-if="formData.lineImage" class="image-preview">
            <img :src="formData.lineImage" alt="分割条图片" />
            <el-button :icon="Delete" type="danger" link @click="handleRemoveImage">移除</el-button>
          </div>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="handleSubmit"> 确定 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.edit-section-modal {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.image-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;

  img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--el-border-color);
  }
}
</style>
