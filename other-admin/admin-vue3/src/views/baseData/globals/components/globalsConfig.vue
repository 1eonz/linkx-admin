<script setup lang="ts">
import type { FormInstance, FormItemRule } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ref, reactive, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import { createGlobals, updateGlobals, type GlobalsItem } from '@/api/dictionary/globals';

defineOptions({ name: 'GlobalsConfig' });

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

// 默认表单
const defaultForm = (): GlobalsItem => ({
  id: '',
  name: '',
  value: '',
  remark: '',
  status: 0,
});

const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const isAdd = ref(true);
const temp = reactive<GlobalsItem>(defaultForm());

// 弹窗标题判断（新增/编辑）
const dialogTitle = computed(() =>
  isAdd.value
    ? t('index.operations.addedGlobalConfigurationItems')
    : t('index.operations.editGlobalConfigurationItems'),
);

// valueValidateRules（特定 name 的正则校验）
const valueValidateRules: Record<string, { pattern: RegExp; messageKey: string }> = {
  GROUP_MSG_SEND_TOPN: {
    pattern: /^(100|[1-9]\d?)$/,
    messageKey: 'valueRange1To100',
  },
};

// rules computed（部分 name 跳过必填校验）
const rules = computed<Record<string, FormItemRule[]>>(() => {
  const baseRules: Record<string, FormItemRule[]> = {
    value: [],
  };
  if (temp.name !== 'GROUP_CREATE_FUN_ONE_KEY_NAME' && temp.name !== 'GROUP_CREATE_ONE_KEY_DISPATCH_USERS') {
    baseRules.value.push({
      required: true,
      trigger: 'blur',
      message: t('index.messageText.valueRange1To100'),
    });
  }
  const validateRule = valueValidateRules[temp.name];
  if (validateRule) {
    baseRules.value.push({
      pattern: validateRule.pattern,
      message: t(`index.messageText.${validateRule.messageKey}`),
      trigger: 'blur',
    });
  }
  return baseRules;
});

// name → 校验范围/枚举
// 注：原始值包含布尔 true/false，统一以 string|number 表达以兼容数据存储（后端通常存字符串）
type ValueRule = number[] | { val: Array<number | string> };

const valueRangeRules: Record<string, ValueRule> = {
  CAGENT_PORT: [1, 65535],
  SDK_PORT: [1, 65535],
  DEFAULT_ZOOM: [0, 19],
  MIN_ZOOM: [0, 19],
  MAX_ZOOM: [0, 19],
  AUTH_AUTO_UNLOCK_TIME: [1, 60],
  AUTH_LOGIN_ERROR_NUM_LIMIT: [3, 10],
  AUTH_FIRSTLOGIN_FORCE_CHANGEPWD: { val: ['true', 'false'] },
  AUTH_PWD_VALIDITY_PERIOD: [30, 180],
  AUTH_TOKEN_EXPIRE_IN: [1, 24],
  AUTH_REFRESHTOKEN_EXPIRE_IN: [30, 180],
  AUTH_MULTI_END_LOGIN_ALLOWED: { val: ['true', 'false'] },
  CAPP_LOCATION_RESOURCE_CAN_SEE_DISTANCE: [1000, 10000],
  CAPP_TASK_CAN_SEE_CAMERA_DISTANCE: [1000, 10000],
  CAPP_TASK_CAN_OPERATOR_CAMERA_DISTANCE: [1000, 10000],
  AUTO_MISSION_STATUS: { val: [0, 1] },
  VIDEO_OFFER: { val: [0, 1] },
  EDGEGATEWAY_BREAKER: { val: [0, 1] },
  CAR_BREAKER: { val: [0, 1] },
  CUSTOMIZED_LAYER: { val: [0, 1] },
  APPLICATION_BREAKER: { val: [0, 1] },
  REFRESH_TIME: [3, 30],
  MAP_TYPE: { val: ['SuperMap', 'AMap', 'ArcgisMap', 'MapAbc', 'MineMap', 'BMap'] },
  MAP_REFRESH_PERIOD: [10, 60],
  CAR_TYPE: { val: [1, 2] },
  SUSPECT_IN: { val: [0, 1, 2] },
  CAPABILITY_SWITCH: { val: [0, 1] },
  SUSPECTTASK_OFFLINE_SWITCH: { val: [0, 1] },
  VIDEO_RETURN_CONFIRM: { val: [0, 1] },
  TRACK_PERIOD: [12, 48],
};

// 必填字段为空 / 范围错误提示
function formatError(message?: string): void {
  ElMessage.error(message || t('index.statusTitle.requiredFieldIsEmpty'));
}

// open(row?) —— row 为 undefined 时是新增，否则编辑
function open(row?: GlobalsItem): void {
  isAdd.value = !row;
  // 重置后赋值（避免响应式污染）
  Object.assign(temp, defaultForm());
  if (row) {
    Object.assign(temp, row);
  }
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

// create() —— 走 createGlobals，成功后关闭弹窗 + emit refresh
async function handleCreate(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.error(t('index.statusTitle.requiredFieldIsEmpty'));
    return;
  }
  createGlobals({ ...temp })
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success(result.msg || '');
        dialogVisible.value = false;
        emit('refresh');
      } else {
        ElMessage.error(result.msg || '');
      }
    })
    .catch(() => {});
}

// update() —— 走 updateGlobals，含 value 范围/枚举校验
async function handleUpdate(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    formatError();
    return;
  }
  const { name, value } = temp;
  const rule = valueRangeRules[name];
  if (rule) {
    if (Array.isArray(rule)) {
      const tips = t('index.messageText.outOfValueRange');
      const val = Number(value);
      // 整数校验
      if (Number.isNaN(val) || val % 1 !== 0) {
        formatError();
        return;
      }
      // 不能以 0 开头
      if (String(value).length > 1 && String(value).startsWith('0')) {
        formatError();
        return;
      }
      if (val < rule[0] || val > rule[1]) {
        formatError(tips + JSON.stringify(rule));
        return;
      }
    } else {
      const tips = t('index.messageText.fixedValueRange');
      const config = rule.val.map((i) => String(i));
      if (!config.includes(String(value))) {
        formatError(tips + JSON.stringify(config));
        return;
      }
    }
  }
  updateGlobals({ ...temp })
    .then((result) => {
      if (result.code === 0) {
        ElMessage.success(result.msg || '');
        dialogVisible.value = false;
        emit('refresh');
      } else {
        ElMessage.error(result.msg || '');
      }
    })
    .catch(() => {});
}

// closeDialog → dialogVisible = false
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
    align-center
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="temp" :rules="rules" label-position="left" class="globals-form">
      <!-- 配置项（编辑时只读 remarkEn，新增时也只读 disabled） -->
      <el-form-item :label="t('index.list.ConfigurationItem')" prop="remarkEn">
        <el-input v-model="temp.remarkEn" disabled class="edit-input" />
      </el-form-item>
      <!-- 配置参数（disabled） -->
      <el-form-item :label="t('index.list.ConfigurationParameters')" prop="name">
        <el-input v-model.trim="temp.name" disabled class="edit-input" />
      </el-form-item>
      <!-- 配置值 -->
      <el-form-item :label="t('index.operations.configurationValue')" prop="value">
        <el-input v-model.trim="temp.value" class="edit-input" />
      </el-form-item>
      <!-- 备注：新增用输入框，编辑显示文本 -->
      <el-form-item :label="t('index.list.remarks')" prop="remarkEn">
        <el-input v-if="isAdd" v-model="temp.remarkEn" class="edit-input" />
        <div v-else>{{ temp.remark }}</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('cancel') }}</el-button>
      <el-button v-if="isAdd" type="primary" @click="handleCreate">{{ t('create') }}</el-button>
      <el-button v-else type="primary" @click="handleUpdate">{{ t('index.operations.alter') }}</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
// 表单跟随容器宽度自适应，保留左右内边距
.globals-form {
  width: 100%;
  padding: 0 30px;
  box-sizing: border-box;
}

// 输入框宽度自适应表单项内容区，避免固定像素在小弹窗内溢出
.edit-input {
  width: 100%;
}
</style>
