<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref, watch } from 'vue';

import {
  getCallableAppTaskConfig,
  setCallableAppTaskConfig,
  type CallableApp,
} from '@/api/thirdInterface/southInterface';

defineOptions({ name: 'TaskConfigModal' });

type ConfigItem = { id: string; name: string; type: string; options?: string[]; value: Record<string, unknown> };
type TaskConfig = Record<'name' | 'content' | 'startTime' | 'endTime' | 'level' | 'urgent', ConfigItem>;

function createDefaultConfig(): TaskConfig {
  return {
    name: { id: 'name', name: '任务名称', type: 'string', value: { type: 'template', template: '' } },
    content: { id: 'content', name: '任务内容', type: 'string', value: { type: 'template', template: '' } },
    startTime: {
      id: 'startTime',
      name: '开始时间',
      type: 'datetime',
      value: { type: 'expression', expression: '', format: 'YYYY-MM-DD HH:mm:ss' },
    },
    endTime: {
      id: 'endTime',
      name: '结束时间',
      type: 'datetime',
      value: { type: 'expression', expression: '', format: 'YYYY-MM-DD HH:mm:ss' },
    },
    level: {
      id: 'level',
      name: '任务等级',
      type: 'select',
      options: ['一般', '紧急'],
      value: { type: 'variable', field: 'priority_level', default: '一般' },
    },
    urgent: { id: 'urgent', name: '是否紧急', type: 'checkbox', value: { type: 'variable', default: false } },
  };
}

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const loaded = ref(false);
const loadError = ref(false);
let requestVersion = 0;
const callableId = ref('');
const enableTask = ref<0 | 1>(0);
const formRef = ref<FormInstance>();
const config = reactive<TaskConfig>(createDefaultConfig());

const placeholderRule = (message: string) => ({
  validator: (_rule: unknown, item: ConfigItem, callback: (error?: Error) => void) => {
    const text = String(item.value.template ?? '').trim();
    const validFormat = /^(?:[^{}]|\{\{[^{}\s}][^}]*\}\})*$/.test(text);
    const hasPlaceholder = /\{\{[^{}\s}][^}]*\}\}/.test(text);
    if (!text || (validFormat && hasPlaceholder)) callback();
    else callback(new Error(message));
  },
  trigger: 'blur',
});
const timeRule = {
  validator: (_rule: unknown, item: ConfigItem, callback: (error?: Error) => void) => {
    const text = String(item.value.expression ?? '').trim();
    if (!text || /^\{\{[^{}\s}][^}]*\}\}$/.test(text)) callback();
    else callback(new Error('填写时须为 {{字段名}} 格式'));
  },
  trigger: 'blur',
};
const rules: FormRules = {
  name: [placeholderRule('格式不正确，示例：{{name}}')],
  content: [placeholderRule('格式不正确，示例：描述：{{description}}')],
  startTime: [timeRule],
  endTime: [timeRule],
};

function resetConfig(): void {
  Object.assign(config, createDefaultConfig());
}

function applyStoredConfig(value: string): boolean {
  try {
    const items = JSON.parse(value) as ConfigItem[];
    if (!Array.isArray(items)) throw new Error('Invalid task config');
    for (const item of items) {
      if (item?.id && item.id in config) {
        const key = item.id as keyof TaskConfig;
        config[key] = { ...config[key], ...item, name: config[key].name };
      }
    }
    return true;
  } catch {
    ElMessage.error('任务标准件配置格式无效，请联系管理员处理');
    return false;
  }
}

function open(row: CallableApp): Promise<void> {
  const version = ++requestVersion;
  visible.value = true;
  callableId.value = row.id;
  enableTask.value = Number(row.enableTask ?? 0) === 1 ? 1 : 0;
  resetConfig();
  loaded.value = false;
  loadError.value = false;
  loading.value = true;
  return getCallableAppTaskConfig(row.id)
    .then((res) => {
      if (version !== requestVersion) return;
      if (res.code !== 0) {
        loadError.value = true;
        ElMessage.error(res.msg ?? '获取任务标准件配置失败');
        return;
      }
      const data = res.data;
      enableTask.value = data?.enableTask === 1 ? 1 : 0;
      // 损坏的存量配置不能静默替换成默认值后提交。
      if (data?.taskAutoFillConfig && !applyStoredConfig(data.taskAutoFillConfig)) {
        loadError.value = true;
        return;
      }
      loaded.value = true;
    })
    .catch(() => {
      if (version !== requestVersion) return;
      loadError.value = true;
      ElMessage.error('获取任务标准件配置失败');
    })
    .finally(() => {
      if (version === requestVersion) loading.value = false;
    });
}

function close(): void {
  requestVersion += 1;
  visible.value = false;
  loaded.value = false;
}

watch(visible, (isVisible) => {
  if (!isVisible) {
    requestVersion += 1;
    loaded.value = false;
  }
});

async function save(): Promise<void> {
  if (loading.value || saving.value) return;
  if (!loaded.value) {
    ElMessage.warning('配置尚未加载完成，请重试后保存');
    return;
  }
  saving.value = true;
  // 开启派发时先校验；关闭派发时按旧版契约清空模板。
  if (enableTask.value === 1 && !(await formRef.value?.validate().catch(() => false))) {
    saving.value = false;
    return;
  }
  const taskAutoFillConfig = enableTask.value === 1 ? JSON.stringify(Object.values(config)) : '[]';
  return setCallableAppTaskConfig(callableId.value, { enableTask: enableTask.value, taskAutoFillConfig })
    .then((res) => {
      if (res.code !== 0) {
        ElMessage.error(res.msg ?? '保存失败');
        return;
      }
      ElMessage.success('保存成功');
      close();
    })
    .catch(() => {
      ElMessage.error('保存失败');
    })
    .finally(() => {
      saving.value = false;
    });
}

defineExpose({ open });
</script>

<template>
  <el-dialog
    v-model="visible"
    title="任务标准件设置"
    width="700px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @closed="close"
  >
    <div v-loading="loading" class="task-config">
      <div class="config-row">
        <span>开启任务派发：</span><el-switch v-model="enableTask" :active-value="1" :inactive-value="0" />
      </div>
      <el-result v-if="loadError" icon="error" title="任务标准件配置加载失败" sub-title="请重试后再保存"
        ><template #extra
          ><el-button @click="open({ id: callableId } as CallableApp)">重试</el-button></template
        ></el-result
      >
      <el-form v-if="!loadError && enableTask === 1" ref="formRef" :model="config" :rules="rules" label-width="112px">
        <el-divider content-position="left">派发默认值模板</el-divider>
        <el-form-item label="任务名称" prop="name"
          ><el-input v-model="config.name.value.template as string" placeholder="示例：{{name}}-{{type}}"
        /></el-form-item>
        <el-form-item label="任务内容" prop="content"
          ><el-input
            v-model="config.content.value.template as string"
            type="textarea"
            :rows="4"
            placeholder="示例：警情：{{policeCase}}"
        /></el-form-item>
        <el-form-item label="开始时间" prop="startTime"
          ><el-input
            v-model="config.startTime.value.expression as string"
            placeholder="留空默认为当前时间，或填写 {{startTime}}"
        /></el-form-item>
        <el-form-item label="结束时间" prop="endTime"
          ><el-input
            v-model="config.endTime.value.expression as string"
            placeholder="留空默认为当前时间加 1 小时，或填写 {{endTime}}"
        /></el-form-item>
        <el-form-item label="任务等级"
          ><el-select v-model="config.level.value.default as string"
            ><el-option
              v-for="option in config.level.options"
              :key="option"
              :label="option"
              :value="option" /></el-select
        ></el-form-item>
        <el-form-item label="是否紧急"><el-switch v-model="config.urgent.value.default as boolean" /></el-form-item>
      </el-form>
    </div>
    <template #footer
      ><el-button :disabled="saving" @click="close">取消</el-button
      ><el-button type="primary" :loading="saving" :disabled="loading || !loaded || saving" @click="save"
        >保存</el-button
      ></template
    >
  </el-dialog>
</template>

<style lang="less" scoped>
.task-config {
  min-height: 110px;
}
.config-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 12px;
}
</style>
