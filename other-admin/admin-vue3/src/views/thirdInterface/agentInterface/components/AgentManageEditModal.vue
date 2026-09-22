<script setup lang="ts">
/**
 * AgentManageEditModal - 智能体编辑弹窗
 *
 * Props:
 * - visible: boolean，v-model 控制显隐
 *
 * Events:
 * - update:visible
 * - success: 提交成功，父组件刷新列表
 *
 * Methods（defineExpose）:
 * - init(type, row?, categoryList?, fileList?): 打开弹窗
 *   - type='add' 新增 / type='edit' 编辑
 *   - row：编辑时传入现有数据
 *   - categoryList：分类列表（用于多选）
 *   - fileList：文件接口列表（用于下拉）
 */
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { getVirtualUserList, type VirtualUserItem } from '@/api/policeExtend/virtualUser';
import {
  addAiagent,
  deleteCategory,
  queryCategory,
  updateAiagent,
  uploadAgentFile,
  type AgentCategory,
  type AgentFileItem,
  type AiagentItem,
  type AiagentPriority,
  type HttpMethod,
} from '@/api/thirdInterface/agentInterface';
import AuthImg from '@/components/AuthImg/index.vue';

defineOptions({ name: 'AgentManageEditModal' });

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const formRef = ref<FormInstance>();
const submitting = ref(false);
const isAdd = ref(true);

// 分类列表
const categoryList = ref<AgentCategory[]>([]);
// 文件接口列表
const fileList = ref<AgentFileItem[]>([]);

// 头像上传 loading
const avatarUploading = ref(false);

// 优先级选项
const priorityOptions: Array<{ value: AiagentPriority; label: string; type: string }> = [
  { value: 0, label: '高', type: 'danger' },
  { value: 1, label: '中', type: 'warning' },
  { value: 2, label: '低', type: 'info' },
];

// HTTP 方法选项
const httpMethodOptions: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

// 文件能力各类型扩展名选项
const audioOptions = ['.mp3', '.aac', '.pcm', '.wav', '.amr', '.m4a', '.webm'];
const videoOptions = ['.mp4', '.mov', '.webm', '.mpeg', '.mpga'];
const imageOptions = ['.jpg', '.jpeg', '.gif', '.png', '.bmp', '.webp', '.svg'];
const documentOptions = [
  '.md',
  '.doc',
  '.docx',
  '.pdf',
  '.xlsx',
  '.xls',
  '.ppt',
  '.pptx',
  '.txt',
  '.html',
  '.csv',
  '.eml',
  '.xml',
  '.epub',
  '.msg',
  '.markdown',
];

const baseForm = (): Partial<AiagentItem> => ({
  name: '',
  desc: '',
  avatarUrl: '',
  url: '',
  token: '',
  header: '',
  query: '',
  body: '',
  httpMethod: 'POST',
  priority: 1,
  categoryIds: [],
  isRestricted: 0,
  audio: 0,
  audioType: [],
  video: 0,
  videoType: [],
  image: 0,
  imageType: [],
  document: 0,
  documentType: [],
  fileInterfaceId: '',
  paramScript: '',
  respScript: '',
  virtualUserId: '',
});

const form = reactive<Partial<AiagentItem>>(baseForm());

const rules: FormRules = {
  name: [{ required: true, message: '请输入智能体名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入调用 URL', trigger: 'blur' }],
  token: [{ required: true, message: '请输入访问 token', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  httpMethod: [{ required: true, message: '请选择 HTTP 方法', trigger: 'change' }],
};

// 虚拟用户列表（通过 getVirtualUserList 接口拉取）
const virtualUserOptions = ref<Array<VirtualUserItem>>([]);
const virtualUserLoading = ref(false);

/** 获取虚拟用户列表，已被其他智能体关联的用户禁用（当前已关联的除外） */
async function fetchVirtualUserList(): Promise<void> {
  virtualUserLoading.value = true;
  try {
    const currentVirtualUserId = form.virtualUserId;
    const res = await getVirtualUserList({});
    if (res?.code === 0) {
      const list = (res?.data as VirtualUserItem[]) ?? [];
      virtualUserOptions.value = list.map((item) => ({
        ...item,
        // 已被其他 Agent 关联的用户不可选（当前已关联的除外）
        isBound: Boolean(item.agentId && item.id !== currentVirtualUserId),
      }));
    } else {
      ElMessage.error(res?.msg ?? '获取虚拟用户列表失败');
    }
  } catch (e) {
    console.error('获取虚拟用户列表失败:', e);
  } finally {
    virtualUserLoading.value = false;
  }
}

// ===== 文件能力 - 不支持时清空对应类型数组 =====
function handleAudioChange(val: 0 | 1): void {
  if (val === 0) form.audioType = [];
}
function handleVideoChange(val: 0 | 1): void {
  if (val === 0) form.videoType = [];
}
function handleImageChange(val: 0 | 1): void {
  if (val === 0) form.imageType = [];
}
function handleDocumentChange(val: 0 | 1): void {
  if (val === 0) form.documentType = [];
}

// ===== 新建分类弹窗 =====
const categoryDialogVisible = ref(false);
const newCategoryName = ref('');
const categorySubmitting = ref(false);

function openCategoryDialog(): void {
  newCategoryName.value = '';
  categoryDialogVisible.value = true;
}

async function handleAddCategory(): Promise<void> {
  if (!newCategoryName.value.trim()) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  // 简化版：仅在本地添加（实际项目需调用接口）
  categoryList.value.push({ name: newCategoryName.value.trim() });
  ElMessage.success('分类已添加，请记得在保存时同步');
  categoryDialogVisible.value = false;
}

async function handleDeleteCategory(cat: AgentCategory): Promise<void> {
  if (!cat.id) {
    // 本地新增未保存的分类，直接移除
    categoryList.value = categoryList.value.filter((c) => c !== cat);
    return;
  }
  try {
    const res = await deleteCategory(cat.id);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '删除分类失败');
      return;
    }
    ElMessage.success('删除成功');
    categoryList.value = categoryList.value.filter((c) => c.id !== cat.id);
  } catch (e) {
    console.error(e);
  }
}

async function refreshCategoryList(): Promise<void> {
  try {
    const res = await queryCategory();
    if (res?.code === 0) {
      categoryList.value = (res?.data as AgentCategory[]) ?? [];
    }
  } catch (e) {
    console.error(e);
  }
}

// ===== 头像上传 =====
async function handleAvatarUpload(file: File): Promise<void> {
  if (avatarUploading.value) return;
  avatarUploading.value = true;
  try {
    const res = await uploadAgentFile(file);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '上传失败');
      return;
    }
    const url = typeof res.data === 'string' ? res.data : '';
    if (url) {
      form.avatarUrl = url;
      ElMessage.success('上传成功');
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('上传失败');
  } finally {
    avatarUploading.value = false;
  }
}

function triggerAvatarUpload(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      handleAvatarUpload(file as UploadRawFile as unknown as File);
    }
  };
  input.click();
}

// ===== 提交 =====
async function submitForm(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const isCreate = isAdd.value;
    const result = isCreate ? await addAiagent(form) : form.id ? await updateAiagent(form.id, form) : null;
    if (!result || result.code !== 0) {
      ElMessage.error(result?.msg ?? `${isCreate ? '新增' : '编辑'}失败`);
      return;
    }
    ElMessage.success(`${isCreate ? '添加' : '编辑'}成功`);
    emit('success');
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

function resetForm(): void {
  Object.assign(form, baseForm());
  formRef.value?.resetFields();
}

/** 打开弹窗 */
async function init(
  type: 'add' | 'edit',
  row?: AiagentItem,
  externalCategoryList?: AgentCategory[],
  externalFileList?: AgentFileItem[],
): Promise<void> {
  isAdd.value = type === 'add';
  resetForm();
  // 优先使用外部传入的分类/文件列表
  if (externalCategoryList) {
    categoryList.value = externalCategoryList;
  } else {
    await refreshCategoryList();
  }
  if (externalFileList) {
    fileList.value = externalFileList;
  }
  if (row) {
    Object.assign(form, row);
    // 兼容 categoryIds 可能为字符串
    if (typeof form.categoryIds === 'string') {
      form.categoryIds = (form.categoryIds as unknown as string).split(',').filter(Boolean);
    }
    // 文件能力类型字段：后端返回 audioTypeList/videoTypeList 等列表字段，需映射到数组字段
    const rowAny = row as unknown as Record<string, unknown>;
    if (!Array.isArray(form.audioType) && Array.isArray(rowAny.audioTypeList)) {
      form.audioType = rowAny.audioTypeList as string[];
    }
    if (!Array.isArray(form.videoType) && Array.isArray(rowAny.videoTypeList)) {
      form.videoType = rowAny.videoTypeList as string[];
    }
    if (!Array.isArray(form.imageType) && Array.isArray(rowAny.imageTypeList)) {
      form.imageType = rowAny.imageTypeList as string[];
    }
    if (!Array.isArray(form.documentType) && Array.isArray(rowAny.documentTypeList)) {
      form.documentType = rowAny.documentTypeList as string[];
    }
    // 保证字段值类型合法
    form.audioType = form.audioType ?? [];
    form.videoType = form.videoType ?? [];
    form.imageType = form.imageType ?? [];
    form.documentType = form.documentType ?? [];
  }
  // 拉取虚拟用户列表（编辑时基于已回显的 virtualUserId 标记 isBound）
  await fetchVirtualUserList();
  dialogVisible.value = true;
}

defineExpose({ init });

// 防止 lint 报未使用
void newCategoryName;
void categorySubmitting;
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isAdd ? '新增智能体' : '编辑智能体'"
    width="900px"
    append-to-body
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" class="agent-form">
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="智能体名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="头像">
            <div class="avatar-wrap">
              <AuthImg v-if="form.avatarUrl" :auth-src="form.avatarUrl" class="avatar-img" />
              <div v-else class="avatar-placeholder">无</div>
              <el-button :icon="Plus" :loading="avatarUploading" @click="triggerAvatarUpload"> 上传 </el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="描述" prop="desc">
        <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="请输入描述" style="max-width: 720px" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
              <el-option v-for="opt in priorityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否限制范围">
            <el-radio-group v-model="form.isRestricted">
              <el-radio :value="0">全员可见</el-radio>
              <el-radio :value="1">受限</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="分类">
        <el-select v-model="form.categoryIds" multiple placeholder="请选择分类" style="width: 100%; max-width: 480px">
          <el-option
            v-for="cat in categoryList"
            :key="cat.id ?? cat.name"
            :label="cat.name"
            :value="cat.id ?? cat.name"
          />
        </el-select>
        <el-button :icon="Plus" style="margin-left: 8px" @click="openCategoryDialog"> 新建分类 </el-button>
      </el-form-item>
      <el-form-item label="关联虚拟用户">
        <el-select
          v-model="form.virtualUserId"
          clearable
          filterable
          placeholder="请选择虚拟用户"
          :loading="virtualUserLoading"
          style="width: 100%; max-width: 480px"
        >
          <el-option
            v-for="u in virtualUserOptions"
            :key="u.id"
            :label="u.userName"
            :value="u.id"
            :disabled="u.isBound"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">调用配置</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="调用 URL" prop="url">
            <el-input v-model="form.url" placeholder="如 http://example.com/api" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="HTTP 方法" prop="httpMethod">
            <el-select v-model="form.httpMethod" placeholder="请选择" style="width: 100%">
              <el-option v-for="m in httpMethodOptions" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="访问 Token" prop="token">
        <el-input v-model="form.token" placeholder="请输入 token" show-password style="max-width: 480px" />
      </el-form-item>
      <el-form-item label="请求头（JSON）">
        <el-input
          v-model="form.header"
          type="textarea"
          :rows="2"
          placeholder='如 {"Content-Type": "application/json"}'
          style="max-width: 720px"
        />
      </el-form-item>
      <el-form-item label="查询参数（JSON）">
        <el-input
          v-model="form.query"
          type="textarea"
          :rows="2"
          placeholder='如 {"key": "value"}'
          style="max-width: 720px"
        />
      </el-form-item>
      <el-form-item label="请求体（JSON）">
        <el-input
          v-model="form.body"
          type="textarea"
          :rows="2"
          placeholder='如 {"prompt": "hello"}'
          style="max-width: 720px"
        />
      </el-form-item>

      <el-divider content-position="left">文件能力配置</el-divider>
      <el-form-item label="音频支持能力">
        <el-radio-group v-model="form.audio" @change="handleAudioChange">
          <el-radio :value="0">不支持</el-radio>
          <el-radio :value="1">支持</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.audio === 1" label="音频文件格式">
        <el-checkbox-group v-model="form.audioType">
          <el-checkbox v-for="item in audioOptions" :key="item" :value="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="视频支持能力">
        <el-radio-group v-model="form.video" @change="handleVideoChange">
          <el-radio :value="0">不支持</el-radio>
          <el-radio :value="1">支持</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.video === 1" label="视频文件格式">
        <el-checkbox-group v-model="form.videoType">
          <el-checkbox v-for="item in videoOptions" :key="item" :value="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="图片支持能力">
        <el-radio-group v-model="form.image" @change="handleImageChange">
          <el-radio :value="0">不支持</el-radio>
          <el-radio :value="1">支持</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.image === 1" label="图片文件格式">
        <el-checkbox-group v-model="form.imageType">
          <el-checkbox v-for="item in imageOptions" :key="item" :value="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="文档支持能力">
        <el-radio-group v-model="form.document" @change="handleDocumentChange">
          <el-radio :value="0">不支持</el-radio>
          <el-radio :value="1">支持</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.document === 1" label="文档文件格式">
        <el-checkbox-group v-model="form.documentType">
          <el-checkbox v-for="item in documentOptions" :key="item" :value="item">
            {{ item }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="文件接口">
        <el-select
          v-model="form.fileInterfaceId"
          clearable
          placeholder="请选择文件接口"
          style="width: 100%; max-width: 480px"
        >
          <el-option v-for="f in fileList" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">脚本配置</el-divider>
      <el-form-item label="参数脚本">
        <el-input
          v-model="form.paramScript"
          type="textarea"
          :rows="3"
          placeholder="参数处理脚本"
          style="max-width: 720px"
        />
      </el-form-item>
      <el-form-item label="响应脚本">
        <el-input
          v-model="form.respScript"
          type="textarea"
          :rows="3"
          placeholder="响应处理脚本"
          style="max-width: 720px"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
    </template>

    <!-- 新建分类弹窗 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="新建分类"
      width="360px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-input v-model="newCategoryName" placeholder="请输入分类名称" />
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddCategory">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style lang="less" scoped>
.agent-form {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 8px;
}

.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-img,
.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #f5f7fa;
  overflow: hidden;
}

.avatar-img {
  object-fit: cover;
}
</style>
