<script setup lang="ts">
/**
 * EditDock - 警单对接编辑弹窗
 *
 * 功能特性：
 * 1. 支持新增/编辑两种模式（由 type 区分）
 * 2. 表单字段：name/systemName/systemCode/schema/ip/port/path/method
 *    headers/body/params（JSON 字符串 textarea，提交前校验可 JSON.parse）
 *    script（textarea，maxlength=2000）
 *    executePeriod（下拉：30 分钟/1 小时/6 小时/12 小时/24 小时）
 *    status（switch：0=禁用/1=启用）
 * 3. downloadExample 下载 JS 脚本示例
 *
 * @example 父组件调用
 * ```vue
 * <EditDock ref="editRef" @success="refresh" />
 * editRef.value?.open('create')
 * editRef.value?.open('update', row)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发，父组件刷新列表
 */
import { Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import { saveDock, updateDock, type DockItem } from '@/api/thirdInterface/policeReport';
import { getServiceFile } from '@/utils';

defineOptions({ name: 'EditDock' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增对接');
const formType = ref<'create' | 'update'>('create');
const submitLoading = ref(false);

const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm: Partial<DockItem> = {
  id: undefined,
  name: '',
  systemName: '',
  systemCode: '',
  schema: 'http',
  ip: '',
  port: '',
  path: '',
  method: 'POST',
  headers: '',
  body: '',
  params: '',
  script: '',
  executePeriod: 3600000,
  status: 1,
};

const formData = reactive<Partial<DockItem>>({ ...defaultForm });

// ===== 执行周期选项（毫秒） =====
const periodOptions = [
  { label: '30 分钟', value: 1800000 },
  { label: '1 小时', value: 3600000 },
  { label: '6 小时', value: 21600000 },
  { label: '12 小时', value: 43200000 },
  { label: '24 小时', value: 86400000 },
];

// ===== 请求方法选项 =====
const methodOptions = ['GET', 'POST', 'PUT', 'DELETE'];

// ===== 协议选项 =====
const schemaOptions = ['http', 'https'];

// ===== JSON 字段校验 =====
function validateJson(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (!value) {
    callback();
    return;
  }
  try {
    JSON.parse(value);
    callback();
  } catch {
    callback(new Error('请输入合法的 JSON 字符串'));
  }
}

// ===== 校验规则 =====
const rules = computed<Record<string, FormItemRule[]>>(() => ({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  systemName: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  systemCode: [{ required: true, message: '请输入系统编码', trigger: 'blur' }],
  schema: [{ required: true, message: '请选择协议', trigger: 'change' }],
  ip: [{ required: true, message: '请输入 IP', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  method: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
  headers: [
    { required: true, message: '请输入请求头', trigger: 'blur' },
    { validator: validateJson, trigger: 'blur' },
  ],
  body: [
    { required: true, message: '请输入请求体', trigger: 'blur' },
    { validator: validateJson, trigger: 'blur' },
  ],
  params: [
    { required: true, message: '请输入请求参数', trigger: 'blur' },
    { validator: validateJson, trigger: 'blur' },
  ],
  executePeriod: [{ required: true, message: '请选择执行周期', trigger: 'change' }],
}));

// ===== 表单重置 =====
function resetForm(): void {
  Object.keys(formData).forEach((k) => delete (formData as Record<string, unknown>)[k]);
  Object.assign(formData, { ...defaultForm });
}

// ===== 弹窗打开 =====
function open(type: 'create' | 'update', row?: DockItem): void {
  resetForm();
  dialogVisible.value = true;
  dialogTitle.value = type === 'create' ? '新增对接' : '编辑对接';
  formType.value = type;
  if (row) {
    Object.assign(formData, row);
  }
  nextTick(() => formRef.value?.clearValidate());
}

defineExpose({ open });

// ===== 提交 =====
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写或格式不正确');
    return;
  }
  submitLoading.value = true;
  try {
    const isCreate = formType.value === 'create';
    const payload = { ...formData };
    const res = isCreate ? await saveDock(payload) : await updateDock(payload);
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

/** 下载 JS 脚本示例 */
function downloadExample(): void {
  const script = `// 表单映射脚本示例
// 全局变量：Params（请求参数）、Config（配置信息）
// 返回值：{ code: number, msg: string, data: any }
function transform(Params, Config) {
  // 从 Params 解析数据
  const data = Params.data || [];
  return {
    code: 0,
    msg: 'success',
    data: data
  };
}`;
  const blob = new Blob([script], { type: 'application/javascript' });
  getServiceFile(blob, 'form-mapping-example.js');
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="780px"
    align-center
    append-to-body
    @open="handleDialogOpen"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="left"
      label-width="120px"
      class="dialog-form"
    >
      <!-- 名称 -->
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name as string" placeholder="请输入名称" maxlength="64" />
      </el-form-item>

      <!-- 系统名称 -->
      <el-form-item label="系统名称" prop="systemName">
        <el-input v-model="formData.systemName as string" placeholder="请输入系统名称" maxlength="64" />
      </el-form-item>

      <!-- 系统编码 -->
      <el-form-item label="系统编码" prop="systemCode">
        <el-input v-model="formData.systemCode as string" placeholder="请输入系统编码" maxlength="64" />
      </el-form-item>

      <!-- 协议 -->
      <el-form-item label="协议" prop="schema">
        <el-select v-model="formData.schema as string" placeholder="请选择协议" style="width: 100%">
          <el-option v-for="opt in schemaOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>
      </el-form-item>

      <!-- IP + 端口 -->
      <el-form-item label="IP" prop="ip">
        <el-input v-model="formData.ip as string" placeholder="请输入 IP" maxlength="64" />
      </el-form-item>

      <el-form-item label="端口" prop="port">
        <el-input v-model="formData.port" placeholder="请输入端口" maxlength="10" />
      </el-form-item>

      <!-- 路径 -->
      <el-form-item label="路径" prop="path">
        <el-input v-model="formData.path as string" placeholder="请输入路径" maxlength="256" />
      </el-form-item>

      <!-- 请求方法 -->
      <el-form-item label="请求方法" prop="method">
        <el-select v-model="formData.method as string" placeholder="请选择请求方法" style="width: 100%">
          <el-option v-for="opt in methodOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>
      </el-form-item>

      <!-- 请求头 -->
      <el-form-item label="请求头" prop="headers">
        <el-input
          v-model="formData.headers as string"
          type="textarea"
          :rows="3"
          placeholder='请输入 JSON，例如：{"Content-Type":"application/json"}'
        />
      </el-form-item>

      <!-- 请求体 -->
      <el-form-item label="请求体" prop="body">
        <el-input
          v-model="formData.body as string"
          type="textarea"
          :rows="3"
          placeholder='请输入 JSON，例如：{"key":"value"}'
        />
      </el-form-item>

      <!-- 请求参数 -->
      <el-form-item label="请求参数" prop="params">
        <el-input
          v-model="formData.params as string"
          type="textarea"
          :rows="3"
          placeholder='请输入 JSON，例如：{"page":1,"size":10}'
        />
      </el-form-item>

      <!-- 表单映射脚本 -->
      <el-form-item label="表单映射脚本" prop="script">
        <div class="script-wrapper">
          <el-input
            v-model="formData.script as string"
            type="textarea"
            :rows="6"
            maxlength="2000"
            show-word-limit
            placeholder="function transform(Params, Config) { ... }"
          />
          <el-button class="example-btn" type="primary" link :icon="Download" @click="downloadExample">
            下载示例
          </el-button>
        </div>
      </el-form-item>

      <!-- 执行周期 -->
      <el-form-item label="执行周期" prop="executePeriod">
        <el-select v-model="formData.executePeriod as number" placeholder="请选择执行周期" style="width: 100%">
          <el-option v-for="opt in periodOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="formData.status as 0 | 1"
          active-text="启用"
          inactive-text="禁用"
          inline-prompt
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.dialog-form {
  width: 620px;
  margin-left: 20px;
}

.script-wrapper {
  width: 100%;

  .example-btn {
    margin-top: 4px;
  }
}
</style>
