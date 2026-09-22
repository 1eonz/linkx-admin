<script setup lang="ts">
/**
 * colOnOffRecord.vue - 协同岗上下岗记录（tab 3）
 *
 * 使用 ProTable 受控模式：
 * - 父组件持有 list/total，通过 @response 回调拿到完整响应后做字段映射
 * - ProTable 内部自动管理分页 + 竞态取消
 * - 搜索/重置通过 tableRef.init() 触发
 */
import { ElMessage } from 'element-plus';
import { ref, reactive } from 'vue';

import ColSearch from './components/ColSearch.vue';
import { getAttendancePage, exportAttendance, type AttendanceItem } from '@/api/h5/collaboration';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ColOnOffRecord' });

defineProps<{
  isAdmin?: boolean;
  orgId?: string;
  departmentCode?: string;
  departmentSyncSign?: boolean;
}>();

// ===== 受控模式状态 =====
const list = ref<AttendanceItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const searchRef = ref<InstanceType<typeof ColSearch>>();

// 列定义：8 列
const columns: ITableColumn[] = [
  { prop: 'postName', label: '协同岗名称', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'personName', label: '协同岗人员', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'type', label: '上下岗类型', width: 100, align: 'center' },
  { prop: 'lastPeopleNum', label: '剩余在岗人数', width: 100, align: 'center', slotName: 'lastPeopleNum' },
  { prop: 'lastPeople', label: '剩余在岗人员', minWidth: 120, align: 'center', slotName: 'lastPeople' },
  { prop: 'switchType', label: '数据来源', width: 120, align: 'center', slotName: 'switchType' },
  { prop: 'createTime', label: '上下岗时间', minWidth: 160, align: 'center' },
];

/** 获取数据来源名称：0=手工切换 / 1=IM状态变化 / 2=值班自动上下岗 / 3=管理员操作下岗 / else 其他 */
function getSwitchTypeName(type?: number): string {
  if (type === undefined || type === null) return '';
  const num = Number(type);
  if (num === 0) return '手工切换';
  if (num === 1) return 'IM状态变化';
  if (num === 2) return '值班自动上下岗';
  if (num === 3) return '管理员操作下岗';
  return '其他';
}

/**
 * fetchApi 包装：在请求前做入参字段映射
 * relatedUserNames → personName
 */
const fetchApi = (params: Record<string, unknown>) => {
  return getAttendancePage({
    ...params,
    personName: params.relatedUserNames,
  } as never);
};

// ===== ProTable @response 回调：受控模式下父组件处理响应 =====
/**
 * 拿到 fetchApi 完整响应，赋值给 list/total
 * 响应结构：直接 { records, total }（无 data 包装），defaultTableFormatter 已支持
 */
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AttendanceItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置（由 ProTable 远程模式接管分页） =====
/**
 * 搜索：ColSearch emit('query', params) 时触发
 * 更新 searchParams + 调用 tableRef.init()（重置到第 1 页）
 */
function handleQuery(params: Record<string, unknown>): void {
  Object.keys(searchParams).forEach((key) => delete searchParams[key]);
  Object.assign(searchParams, params);
  tableRef.value?.init();
}

/**
 * 重置：清空 searchParams + 调用 tableRef.init()
 */
function handleReset(): void {
  Object.keys(searchParams).forEach((key) => delete searchParams[key]);
  tableRef.value?.init();
}

/** 导出：personName 重命名 + Blob 下载，文件名「协同岗上下岗记录.xlsx」 */
async function handleExport(params: Record<string, unknown>): Promise<void> {
  try {
    // relatedUserNames → personName
    const exportParams = { ...params, personName: params.relatedUserNames };
    const res = await exportAttendance(exportParams as never);
    const data = (res as unknown as { data?: ArrayBuffer })?.data;
    if (!data) return;
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', '协同岗上下岗记录.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出失败：', error);
    ElMessage.error('导出失败');
  }
}

/** 从 ProTable slot scope 中安全获取 AttendanceItem */
function getRow(scope: any): AttendanceItem {
  return (scope?.row as AttendanceItem) ?? ({} as AttendanceItem);
}
</script>

<template>
  <div class="table-container">
    <ColSearch ref="searchRef" :is-main="false" @query="handleQuery" @reset="handleReset" @export="handleExport" />

    <!--
      ProTable 受控模式：
      - :fetch-api 传入包装后的 fetchApi（内部做 relatedUserNames → personName 入参映射）
      - ProTable 内部自动管理请求/分页/竞态取消
      - :data="list" 受控展示（list 优先于 fetchApi 内部数据）
      - :search-params="searchParams" 供 ProTable 在 init/refresh 时读取最新查询条件
      - @response="handleResponse" 拿到完整响应后赋值给 list/total
      - immediate=true（默认）首次自动加载
    -->
    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchApi"
      :data="list"
      :total="total"
      :search-params="searchParams"
      :immediate="true"
      @response="handleResponse"
    >
      <!-- 剩余在岗人数：? lastPeopleNum : '0' -->
      <template #lastPeopleNum="scope">
        <span>{{ getRow(scope).lastPeopleNum ?? '0' }}</span>
      </template>

      <!-- 剩余在岗人员：? lastPeople : '-' -->
      <template #lastPeople="scope">
        <span>{{ getRow(scope).lastPeople ?? '-' }}</span>
      </template>

      <!-- 数据来源（switchType 转换） -->
      <template #switchType="scope">
        <span>{{ getSwitchTypeName(getRow(scope).switchType) }}</span>
      </template>
    </ProTable>
  </div>
</template>

<style lang="less" scoped>
.table-container {
  // 复用 ProTable 默认样式
}
</style>
