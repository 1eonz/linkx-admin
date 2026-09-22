<script setup lang="ts">
import type { FormInstance, FormItemRule } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { collaborationCreate, collaborationUpdate, type ThirdAppForm } from '@/api/resource/thirdApp';

defineOptions({ name: 'EditThirdPartyApp' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const isAdd = ref(true);

// thirdAppForm 默认值
const defaultForm = (): Required<ThirdAppForm> => ({
  id: '',
  clientName: '',
  clientId: '',
  clientSecret: '',
  clientType: '',
  tokenTime: -1,
  refreshTokenTime: -1,
  status: 1,
  remark: '',
});

const thirdAppForm = reactive<Required<ThirdAppForm>>(defaultForm());

// 标题（新增/编辑）
const dialogTitle = computed(() =>
  isAdd.value ? t('index.thirdPartyApp.addThirdPartyApp') : t('index.thirdPartyApp.editThirdPartyApp'),
);

// validateName —— 名称不能为空、不能与 ID 相同

function validateName(_rule: unknown, value: string, callback: any): void {
  if (!value) {
    callback(new Error('请输入应用名称'));
  } else if (value === thirdAppForm.clientId) {
    callback(new Error('应用名称不能与应用ID相同'));
  } else {
    callback();
  }
}

// validateId —— ID 不能为空、不能含特殊字符、长度 ≥ 8、不能与名称相同

function validateId(_rule: unknown, value: string, callback: any): void {
  const hasSpecial = /[^a-zA-Z\d]/.test(value);
  if (!value) {
    callback(new Error('请输入应用ID'));
  } else if (hasSpecial) {
    callback(new Error('应用ID不能包含特殊字符'));
  } else if (value.length < 8) {
    callback(new Error('应用ID长度不能小于8位'));
  } else if (value === thirdAppForm.clientName) {
    callback(new Error('应用ID不能与名称相同'));
  } else {
    callback();
  }
}

// rules
const rules = computed<Record<string, FormItemRule[]>>(() => ({
  clientName: [{ required: true, validator: validateName, trigger: 'blur' }],
  clientId: [{ required: true, validator: validateId, trigger: 'blur' }],
  clientSecret: [
    { required: true, message: '请输入应用密钥', trigger: 'blur' },
    { min: 8, message: '应用密钥长度不能小于8位', trigger: 'blur' },
    { max: 16, message: '应用密钥长度不能超过16个字符', trigger: 'blur' },
  ],
  tokenTime: [
    { required: true, message: '请输入token有效期', trigger: 'blur' },
    { pattern: /^-?\d+$/, message: 'token有效期必须是正整数', trigger: 'blur' },
  ],
  refreshTokenTime: [
    { required: true, message: '请输入refreshToken有效期', trigger: 'blur' },
    { pattern: /^-?\d+$/, message: 'refreshToken有效期必须是正整数', trigger: 'blur' },
  ],
}));

// init(row?) —— row 不传为新增，传则为编辑
function init(row?: ThirdAppForm): void {
  isAdd.value = !row;
  Object.assign(thirdAppForm, defaultForm());
  if (row) {
    thirdAppForm.id = row.id ?? '';
    thirdAppForm.clientName = row.clientName ?? '';
    thirdAppForm.clientId = row.clientId ?? '';
    thirdAppForm.clientSecret = row.clientSecret ?? '';
    thirdAppForm.clientType = row.clientType ?? '';
    thirdAppForm.tokenTime = row.tokenTime ?? -1;
    thirdAppForm.refreshTokenTime = row.refreshTokenTime ?? -1;
    thirdAppForm.status = row.status ?? 1;
    thirdAppForm.remark = row.remark ?? '';
  }
  dialogVisible.value = true;
}

// handleConfirm —— validate 通过后调用 create/update API
async function handleConfirm(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  // 用 ThirdAppForm（id 可选）类型，便于新增时 delete id
  const param: ThirdAppForm = JSON.parse(JSON.stringify(thirdAppForm));
  // 新增时删除 id（避免后端报错）
  if (isAdd.value) {
    delete param.id;
  }
  const api = isAdd.value ? collaborationCreate : collaborationUpdate;
  api(param)
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
}

// closeDialog → resetTemp → dialogVisible = false
function closeDialog(): void {
  resetTemp();
  dialogVisible.value = false;
}

// resetTemp
function resetTemp(): void {
  Object.assign(thirdAppForm, defaultForm());
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    align-center
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      :model="thirdAppForm"
      :rules="rules"
      label-width="170px"
      class="thirdAppForm"
      label-position="left"
    >
      <el-form-item :label="t('index.list.thirdPartyApp')" prop="clientName">
        <el-input v-model="thirdAppForm.clientName" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppID')" prop="clientId">
        <el-input v-model="thirdAppForm.clientId" placeholder="请输入应用ID" />
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppSecret')" prop="clientSecret">
        <el-input v-model="thirdAppForm.clientSecret" type="password" show-password placeholder="请输入应用密钥" />
      </el-form-item>
      <!-- 应用类型列隐藏（v-if="false"） -->
      <el-form-item v-if="false" :label="t('index.list.thirdPartyAppType')" prop="clientType">
        <el-select
          v-model="thirdAppForm.clientType"
          placeholder="请选择应用类型"
          style="width: 100%"
          :disabled="!isAdd"
        >
          <el-option label="协同统计" value="0" />
          <el-option label="三方应用" value="1" />
          <el-option label="三方任务" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppNameTokenValidation')" prop="tokenTime">
        <el-input v-model="thirdAppForm.tokenTime" type="number">
          <template #append><span>单位： 小时</span></template>
        </el-input>
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppNameRefreshTokenValidation')" prop="refreshTokenTime">
        <el-input v-model="thirdAppForm.refreshTokenTime" type="number">
          <template #append><span>单位： 天</span></template>
        </el-input>
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppStatus')" prop="status">
        <el-switch
          v-model="thirdAppForm.status"
          active-text="启用"
          inline-prompt
          inactive-text="停用"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
      <el-form-item :label="t('index.list.thirdPartyAppRemark')" prop="remark">
        <el-input
          v-model="thirdAppForm.remark"
          type="textarea"
          :rows="5"
          maxlength="255"
          show-word-limit
          placeholder="请输入"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">{{ t('cancel') }}</el-button>
      <el-button type="primary" @click="handleConfirm">{{ t('determine') }}</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.edit-input {
  padding-right: 50px;
  width: @input-width-lg;
}
</style>
