<script setup lang="ts">
/**
 * SelectPagination - 通用远程分页下拉选择器
 *
 * 功能特性：
 * 1. 支持 v-model 双向绑定（单选/多选）
 * 2. 远程分页加载（滚动到底部自动加载下一页，v-loadmore 指令）
 * 3. 支持远程搜索（filterable + remote-method）
 * 4. 支持字段名映射（trans 配置）
 * 5. 内部维护 targetMap 解决回显问题（已选项不在当前 dataList 中也能展示）
 * 6. 下拉展开时重新拉数据
 *
 * @example 基础用法（单选）
 * ```vue
 * <SelectPagination v-model="form.userId" :api="queryUserInfo" :init-params="{ deptId: '123' }" placeholder="请选择用户" />
 * ```
 *
 * @example 多选 + 字段映射（群组）
 * ```vue
 * <SelectPagination v-model="form.groupIds" multiple :api="queryGroupInfo" :init-params="{ type: 2, key: 3 }" :trans="{ to: 'id', from: 'groupId' }" placeholder="请选择群组" />
 * ```
 *
 * Props:
 * - modelValue: string | string[]，v-model 绑定值（单选为 string，多选为 string[]）
 * - api: (params) => Promise<any>，远程数据获取函数（必填）
 * - initParams: Record<string, unknown>，额外查询参数
 * - multiple: boolean，是否多选，默认 false
 * - placeholder: string，占位文本，默认 '请选择'
 * - pageSize: number，每页条数，默认 100
 * - itemKey: string，选项 key 字段名，默认 'id'
 * - showField: string，显示字段名，默认 'name'
 * - bindField: string，绑定值字段名，默认 'id'
 * - trans: { to: string; from: string }，字段名映射（如群组 { to:'id', from:'groupId' }）
 * - valueMap: Record<string, { name: string; idCard?: string }>，回显映射（编辑时传入）
 * - disabled: boolean，是否禁用
 *
 * Events:
 * - update:modelValue: 值变化时触发
 * - change: (ids, items) 值变化时触发，items 为完整对象数组
 *
 * Slots: 无
 * Methods: 无
 */
import { ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';

defineOptions({ name: 'SelectPagination' });

const props = withDefaults(
  defineProps<{
    /** v-model 绑定值 */
    modelValue?: string | string[];
    /** 远程数据获取函数 */
    api: (params: any) => Promise<unknown>;
    /** 额外查询参数 */
    initParams?: Record<string, unknown>;
    /** 是否多选 */
    multiple?: boolean;
    /** 占位文本 */
    placeholder?: string;
    /** 每页条数 */
    pageSize?: number;
    /** 选项 key 字段名 */
    itemKey?: string;
    /** 显示字段名 */
    showField?: string;
    /** 绑定值字段名 */
    bindField?: string;
    /** 字段名映射 */
    trans?: { to: string; from: string };
    /** 回显映射（编辑时传入） */
    valueMap?: Record<string, { name: string; idCard?: string }>;
    /** 是否禁用 */
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    multiple: false,
    placeholder: '请选择',
    pageSize: 100,
    itemKey: 'id',
    showField: 'name',
    bindField: 'id',
    trans: undefined,
    initParams: () => ({}),
    valueMap: () => ({}),
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void;
  (e: 'change', ids: string[], items: Record<string, unknown>[]): void;
}>();

const selectRef = ref<ComponentPublicInstance>();
const dataList = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const total = ref(0);
const keywords = ref('');
/** 已选项信息映射，解决回显问题 */
const targetMap = ref<Record<string, { name: string; idCard?: string }>>({ ...props.valueMap });

/** 处理单条数据：根据 trans 映射字段名 */
function handleItem(item: Record<string, unknown>): Record<string, unknown> {
  if (!props.trans) return item;
  const { to, from } = props.trans;
  return { ...item, [to]: item[from] };
}

/** 加载数据 */
async function loadData(reset = false): Promise<void> {
  if (loading.value) return;
  if (reset) {
    pageNum.value = 1;
    dataList.value = [];
  }
  loading.value = true;
  try {
    const params = {
      ...props.initParams,
      pageNum: pageNum.value,
      pageSize: props.pageSize,
      keywords: keywords.value,
    };
    const res = (await props.api(params)) as
      { data?: { records?: unknown[]; total?: number } } | { records?: unknown[]; total?: number };
    const data = res as Record<string, unknown>;
    const innerData = data.data as { records?: unknown[]; total?: number } | undefined;
    const records = (innerData?.records ?? data.records ?? []) as Record<string, unknown>[];
    const totalCount = Number(innerData?.total ?? data.total ?? 0);

    const mapped = records.map(handleItem);
    if (reset) {
      dataList.value = mapped;
    } else {
      dataList.value = [...dataList.value, ...mapped];
    }
    total.value = totalCount;

    // 维护 targetMap
    mapped.forEach((item) => {
      const key = String(item[props.bindField] ?? item[props.itemKey] ?? '');
      if (key) {
        targetMap.value[key] = {
          name: String(item[props.showField] ?? ''),
          idCard: item.idCard as string | undefined,
        };
      }
    });
  } catch {
    // 忽略
  } finally {
    loading.value = false;
  }
}

/** 滚动加载更多 */
function loadMore(): void {
  if (dataList.value.length >= total.value || loading.value) return;
  pageNum.value++;
  loadData();
}

/** 远程搜索 */
function remoteSearch(query: string): void {
  keywords.value = query;
  loadData(true);
}

/** 下拉展开时重新拉数据 */
function handleVisibleChange(visible: boolean): void {
  if (visible && dataList.value.length === 0) {
    loadData(true);
  }
}

/** 值变化处理 */
function handleChange(val: string | string[]): void {
  emit('update:modelValue', val);
  const ids = Array.isArray(val) ? val : [val];
  const items = ids
    .map(
      (id) =>
        dataList.value.find((item) => String(item[props.bindField]) === id) || {
          [props.bindField]: id,
          [props.showField]: targetMap.value[id]?.name ?? '',
        },
    )
    .filter(Boolean);
  emit('change', ids, items as Record<string, unknown>[]);
}

// 初始化回显映射
watch(
  () => props.valueMap,
  (newMap) => {
    targetMap.value = { ...newMap };
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <el-select
    ref="selectRef"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    :disabled="disabled"
    filterable
    remote
    :remote-method="remoteSearch"
    :loading="loading"
    :value-key="bindField"
    style="width: 100%"
    @visible-change="handleVisibleChange"
    @change="handleChange"
  >
    <el-option
      v-for="item in dataList"
      :key="String(item[bindField] ?? item[itemKey])"
      :label="String(item[showField] ?? '')"
      :value="item[bindField] as string"
    />
    <!-- 滚动加载更多触发器 -->
    <div v-if="dataList.length < total" class="load-more-trigger" @click="loadMore">
      <span v-if="loading">加载中...</span>
      <span v-else>滚动加载更多</span>
    </div>
  </el-select>
</template>

<style lang="less" scoped>
.load-more-trigger {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: @color-text-secondary;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: @color-primary;
  }
}
</style>
