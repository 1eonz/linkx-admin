﻿<script setup lang="ts">
/**
 * CommonConfig - 公共设置
 *
 * 通用配置组件：
 * 1. 普通配置项 label 从后端 JSON 的 `parsedValue.name` 动态获取
 * 2. 保存值使用 `JSON.stringify({...parsedValue, value})` 包裹（保留后端原始字段）
 * 3. APP_COUNT_IN_ROW 使用 el-select 下拉（4 个预设值 + allow-create）
 * 4. 协同群组配置使用 el-checkbox，不用 el-switch
 * 5. type 3/4 默认 'false'
 * 6. 保存按钮居中（justify-content: center）
 * 7. 表单字段必填校验
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

import { getSystemConfig, setSystemConfig, type SystemConfigItem } from '@/api/baseData/layoutConfig';
import SectionTitle from '@/components/SectionTitle/index.vue';

defineOptions({ name: 'CommonConfig' });

interface ParsedConfigValue {
  /** 后端配置项 name 字段（用于 label 展示） */
  name?: string;
  /** 配置项的值（用户可编辑） */
  value?: string;
  [key: string]: unknown;
}

interface FormSchemaItem {
  /** 配置项 id */
  id: string;
  /** 配置项 key */
  key: string;
  /** 原始 value 字符串 */
  rawValue: string;
  /** 解析后的 value 对象（保留后端字段） */
  parsedValue: ParsedConfigValue;
  /** 提示文案 */
  tip: string;
  /** placeholder */
  placeholder: string;
}

interface GroupButtonConfig {
  /** 按钮类型：1=自定义建群 / 2=一键建群 / 3=职能建群 / 4=一键调度 */
  type: number | string;
  /** 按钮名称 */
  name: string;
  /** 是否启用：'true' 启用 / 'false' 禁用 */
  enable: 'true' | 'false';
}

const showLabelKeys = ['SYSTEM_NAME', 'APP_COUNT_IN_ROW', 'TASK_NAME'];

const tipsMap: Record<string, string> = {
  SYSTEM_NAME: '提示：设置的名称将作用于登录页面，系统主页面，网页标题等地方',
  APP_COUNT_IN_ROW: '提示: 三方应用在Mobile，Tablet，PC 上每行显示的数量',
  TASK_NAME: '提示: 设置的名称将作用于手机端任务页签标题',
};

const placeholderMap: Record<string, string> = {
  SYSTEM_NAME: '请输入系统名称',
  APP_COUNT_IN_ROW: '请输入每行的展示个数，示例：4;8;12',
  TASK_NAME: '请输入任务标题名称',
};

/** 应用排版预设值 */
const rowOptions = [
  { name: '3;6;9', value: '3;6;9' },
  { name: '4;8;12', value: '4;8;12' },
  { name: '5;10;15', value: '5;10;15' },
  { name: '6;10;18', value: '6;10;18' },
];

/** 协同群组默认配置（type 3/4 默认 false） */
const defaultGroupButtons: GroupButtonConfig[] = [
  { type: 1, name: '自定义建群', enable: 'true' },
  { type: 2, name: '一键建群', enable: 'true' },
  { type: 3, name: '职能建群', enable: 'false' },
  { type: 4, name: '一键调度', enable: 'false' },
];

/** 按钮类型显示文案 */
const groupTypeLabels: Record<string, string> = {
  1: '自定义建群',
  2: '一键建群',
  3: '职能建群',
  4: '一键调度',
};

const loading = ref(false);
const formRef = ref<FormInstance>();

/** 表单 schema（含 label/tip/placeholder） */
const formSchema = ref<FormSchemaItem[]>([]);

/** 表单值 */
const form = reactive<Record<string, string>>({});

/** 表单校验规则 */
const rules = reactive<FormRules>({
  SYSTEM_NAME: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  APP_COUNT_IN_ROW: [{ required: true, message: '请输入应用排版数量', trigger: 'blur' }],
  TASK_NAME: [{ required: true, message: '请输入任务标题名称', trigger: 'blur' }],
});

/** 单项更新按钮 loading */
const updating = reactive<Record<string, boolean>>({});

/** CREAT_GROUP_CONFIG 原始配置 ID */
const groupConfigId = ref<string>('');

/** 协同群组按钮配置列表 */
const groupButtons = ref<GroupButtonConfig[]>([]);

/** 协同群组统一保存按钮 loading */
const saving = ref(false);

/**
 * 加载系统配置数据
 *
 * 从后端拉取系统配置列表，并拆分为两类：
 * 1. 普通配置项（SYSTEM_NAME / APP_COUNT_IN_ROW / TASK_NAME）填充到 formSchema 与 form
 * 2. 协同群组按钮配置（CREAT_GROUP_CONFIG）填充到 groupButtons
 *
 * 加载失败时弹窗提示，并在 finally 中关闭 loading。
 *
 * @returns Promise<void> 无返回值
 */
async function loadConfig(): Promise<void> {
  loading.value = true;
  try {
    const res = await getSystemConfig();
    const list = (res?.data ?? []) as SystemConfigItem[];
    const filtered = list.filter((item) => Boolean(item.key));

    // 普通配置项
    formSchema.value = filtered
      .filter((item) => item.key !== 'CREAT_GROUP_CONFIG')
      .map((item) => {
        let parsedValue: ParsedConfigValue = {};
        try {
          parsedValue = JSON.parse(item.value) as ParsedConfigValue;
        } catch {
          parsedValue = {};
        }
        // 同步到表单
        form[item.key] = (parsedValue.value as string) ?? '';
        return {
          id: item.id,
          key: item.key,
          rawValue: item.value,
          parsedValue,
          tip: tipsMap[item.key] ?? '',
          placeholder: placeholderMap[item.key] ?? '',
        };
      })
      .filter((item) => showLabelKeys.includes(item.key));

    // 协同群组按钮配置
    const groupItem = filtered.find((c) => c.key === 'CREAT_GROUP_CONFIG');
    if (groupItem) {
      groupConfigId.value = groupItem.id;
      groupButtons.value = parseGroupButtons(groupItem.value);
    } else {
      groupConfigId.value = '';
      groupButtons.value = defaultGroupButtons.map((b) => ({ ...b }));
    }
  } catch {
    ElMessage.error('加载系统配置失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 解析协同群组按钮配置
 *
 * 将后端 CREAT_GROUP_CONFIG 的 JSON 字符串解析为按钮配置数组。
 * - 入参为空或解析失败时，返回默认 4 个按钮的拷贝
 * - 解析成功后与默认项合并，确保 type 1/2/3/4 四个按钮都存在
 *   （缺失项使用 defaultGroupButtons 中对应类型的默认值补齐）
 *
 * @param value 后端存储的 JSON 字符串，可能为空字符串或非法 JSON
 * @returns GroupButtonConfig[] 标准化后的协同群组按钮配置数组（始终 4 项）
 */
function parseGroupButtons(value: string): GroupButtonConfig[] {
  if (!value) {
    return defaultGroupButtons.map((b) => ({ ...b }));
  }
  try {
    const parsed = JSON.parse(value) as GroupButtonConfig[];
    if (!Array.isArray(parsed)) {
      return defaultGroupButtons.map((b) => ({ ...b }));
    }
    // 合并默认项，确保 4 个按钮都存在
    const result: GroupButtonConfig[] = [];
    [1, 2, 3, 4].forEach((t) => {
      const exist = parsed.find((b) => Number(b.type) === t);
      const def = defaultGroupButtons.find((b) => Number(b.type) === t);
      if (exist) {
        result.push(exist);
      } else if (def) {
        result.push({ ...def });
      }
    });
    return result;
  } catch {
    return defaultGroupButtons.map((b) => ({ ...b }));
  }
}

/**
 * 根据按钮类型获取默认名称
 *
 * 通过 groupTypeLabels 映射表查询按钮类型对应的中文文案，
 * 未匹配到时返回兜底文案 "未知按钮"。
 *
 * @param type 按钮类型（1=自定义建群 / 2=一键建群 / 3=职能建群 / 4=一键调度）
 * @returns string 按钮类型对应的中文文案
 */
function getDefaultName(type: number | string): string {
  return groupTypeLabels[String(type)] ?? '未知按钮';
}

/**
 * 更新单个普通配置项
 *
 * 先对目标字段做表单校验，校验通过后调用 setSystemConfig 提交：
 * - 关键点：保留后端原始 parsedValue 的其他字段，仅覆盖 value 字段，
 *   再用 JSON.stringify 包裹整个对象作为 value 提交
 * - 提交成功后同步本地 parsedValue，保证 UI 与后端一致
 *
 * @param item 当前表单项 schema（含 id、key、parsedValue 等）
 * @returns Promise<void> 无返回值
 */
async function handleUpdateSingle(item: FormSchemaItem): Promise<void> {
  if (!formRef.value) return;
  try {
    await formRef.value.validateField(item.key);
  } catch {
    return;
  }
  updating[item.key] = true;
  try {
    // 关键：保留后端 parsedValue 的其他字段，只更新 value
    const updatedValue: ParsedConfigValue = { ...item.parsedValue, value: form[item.key] };
    const res = await setSystemConfig({
      id: item.id,
      value: JSON.stringify(updatedValue),
    });
    if (res.code === 0) {
      ElMessage.success(res.msg || '更新成功');
      // 同步本地 parsedValue
      item.parsedValue = updatedValue;
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch {
    ElMessage.error('更新失败');
  } finally {
    updating[item.key] = false;
  }
}

/**
 * 保存协同群组配置
 *
 * 将 groupButtons 序列化为 JSON 字符串后整体提交：
 * - 已有 groupConfigId 时按更新提交
 * - 无 groupConfigId（首次新增配置）时附带 key='CREAT_GROUP_CONFIG'，提交成功后回填 id
 *
 * 失败时弹窗提示，并在 finally 中关闭 saving。
 *
 * @returns Promise<void> 无返回值
 */
async function handleSaveGroupConfig(): Promise<void> {
  saving.value = true;
  try {
    const value = JSON.stringify(groupButtons.value);
    const payload: Partial<SystemConfigItem> & { key?: string } = {
      id: groupConfigId.value,
      value,
    };
    // 如果是新增配置，需要传 key
    if (!groupConfigId.value) {
      payload.key = 'CREAT_GROUP_CONFIG';
    }
    const res = await setSystemConfig(payload as Partial<SystemConfigItem>);
    if (res.code === 0) {
      ElMessage.success(res.msg || '保存成功');
      // 如果是新增配置，回填 id
      if (!groupConfigId.value && (res.data as { id?: string })?.id) {
        groupConfigId.value = (res.data as { id: string }).id;
      }
    } else {
      ElMessage.error(res.msg || '保存失败');
    }
  } catch {
    ElMessage.error('保存配置失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <div v-loading="loading" class="common-config">
    <!-- 基础配置 -->
    <SectionTitle title="基础配置" variant="border" />
    <el-form
      v-if="formSchema.length > 0"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="160px"
      style="max-width: 800px"
    >
      <el-form-item
        v-for="item in formSchema"
        :key="item.key"
        :label="item.parsedValue.name || item.key"
        :prop="item.key"
        class="config-form-item"
      >
        <div class="form-row">
          <el-tooltip :content="item.tip" placement="top" class="form-row__input">
            <el-select
              v-if="item.key === 'APP_COUNT_IN_ROW'"
              v-model="form[item.key]"
              style="width: 100%"
              filterable
              allow-create
              clearable
              default-first-option
              :placeholder="item.placeholder || `请输入${item.parsedValue.name || item.key}`"
            >
              <el-option v-for="row in rowOptions" :key="row.value" :label="row.name" :value="row.value" />
            </el-select>
            <el-input
              v-else
              v-model.trim="form[item.key]"
              :placeholder="item.placeholder || `请输入${item.parsedValue.name || item.key}`"
              clearable
            />
          </el-tooltip>
          <el-button
            type="primary"
            :loading="updating[item.key]"
            :disabled="updating[item.key]"
            class="form-row__btn"
            @click="handleUpdateSingle(item)"
          >
            更新
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <div v-if="formSchema.length === 0 && !loading" class="empty">
      <div>暂无配置项数据</div>
    </div>

    <!-- 协同群组配置 -->
    <div v-if="groupButtons.length > 0" class="group-button-config">
      <div class="config-divider" />
      <SectionTitle title="协同群组配置" variant="border" />
      <el-form label-width="160px" style="max-width: 800px">
        <el-form-item
          v-for="config in groupButtons"
          :key="config.type"
          :label="getDefaultName(config.type)"
          class="config-form-item"
        >
          <div class="form-row">
            <el-input
              v-model.trim="config.name"
              placeholder="请输入标题"
              clearable
              maxlength="20"
              class="form-row__input"
            />
            <el-checkbox v-model="config.enable" true-label="true" false-label="false" class="form-row__checkbox">
              显示
            </el-checkbox>
          </div>
        </el-form-item>
      </el-form>

      <!-- 统一保存按钮（居中） -->
      <div class="config-save-action">
        <el-button
          type="primary"
          :loading="saving"
          :disabled="saving"
          style="width: 120px"
          @click="handleSaveGroupConfig"
        >
          保存配置
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.common-config {
  padding: 20px;
  align-items: center;
  min-height: 400px;
}

// 表单项水平对齐：输入框 + 按钮同行
.config-form-item {
  :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
  }
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  &__input {
    flex: 1;
    min-width: 0;
  }

  &__btn {
    flex-shrink: 0;
    width: 80px;
  }

  &__checkbox {
    flex-shrink: 0;
    margin-left: 8px;
  }
}

.config-divider {
  height: 1px;
  background: @color-border;
  margin: 20px 0;
}

.group-button-config {
  margin-top: 10px;
}

.config-save-action {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.empty {
  color: @color-text-secondary;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
