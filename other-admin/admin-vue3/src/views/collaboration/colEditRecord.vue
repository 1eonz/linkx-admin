<script setup lang="ts">
/**
 * colEditRecord.vue - 协同岗编辑记录（tab 2）
 *
 * 使用 ProTable 受控模式：
 * - 父组件持有 list/total，通过 @response 回调拿到完整响应后做字段映射
 * - ProTable 内部自动管理分页 + 竞态取消
 * - 搜索/重置通过 tableRef.init() 触发
 */
import { ElMessage } from 'element-plus';
import { ref, reactive } from 'vue';

import ColSearch from './components/ColSearch.vue';
import {
  getCollaborationEditPage,
  exportCollaborationEditPage,
  type CollaborationEditItem,
} from '@/api/h5/collaboration';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ColEditRecord' });

defineProps<{
  isAdmin?: boolean;
  orgId?: string;
  departmentCode?: string;
  departmentSyncSign?: boolean;
}>();

// ===== 受控模式状态 =====
const list = ref<CollaborationEditItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const searchRef = ref<InstanceType<typeof ColSearch>>();

// 列定义：7 列
const columns: ITableColumn[] = [
  { prop: 'postName', label: '名称', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'operatorName', label: '操作人员', minWidth: 100, align: 'center' },
  { prop: 'operationTypeName', label: '操作类型', width: 100, align: 'center' },
  { prop: 'content', label: '操作内容', minWidth: 150, align: 'center', showOverflowTooltip: true },
  { prop: 'operateTime', label: '操作时间', minWidth: 160, align: 'center', sortable: true },
];

/** 获取操作类型名称：0=新增 / 1=修改 / 2=删除 */
function getOperationTypeName(operationType?: number): string {
  if (operationType === undefined || operationType === null) return '';
  const typeArr = ['新增', '修改', '删除'];
  return typeArr[operationType] ?? '';
}

// ===== ProTable @response 回调：受控模式下父组件处理响应 =====
/**
 * 拿到 fetchApi 完整响应，做字段映射后赋值给 list/total
 * 响应结构：res.data.records（多包一层 data），defaultTableFormatter 已支持
 */
function handleResponse(res: unknown): void {
  const records = defaultTableFormatter.getRecords(res) as CollaborationEditItem[];
  records.forEach((item) => {
    item.operationTypeName = getOperationTypeName(item.operationType);
  });
  list.value = records;
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

/** 导出：Blob 下载，文件名「协同岗编辑记录.xlsx」 */
async function handleExport(params: Record<string, unknown>): Promise<void> {
  try {
    const res = await exportCollaborationEditPage(params as never);
    const data = (res as unknown as { data?: ArrayBuffer })?.data;
    if (!data) return;
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', '协同岗编辑记录.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出失败：', error);
    ElMessage.error('导出失败');
  }
}
</script>

<template>
  <div class="table-container">
    <ColSearch ref="searchRef" :is-main="false" @query="handleQuery" @reset="handleReset" @export="handleExport" />

    <!--
      ProTable 受控模式：
      - :fetch-api 传入 getCollaborationEditPage，ProTable 内部自动管理请求/分页/竞态取消
      - :data="list" 受控展示（list 优先于 fetchApi 内部数据）
      - :search-params="searchParams" 供 ProTable 在 init/refresh 时读取最新查询条件
      - @response="handleResponse" 拿到完整响应后做字段映射，赋值给 list/total
      - immediate=true（默认）首次自动加载
    -->
    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getCollaborationEditPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      :immediate="true"
      @response="handleResponse"
    />
  </div>
</template>

<style lang="less" scoped>
.table-container {
  // 复用 ProTable 默认样式
}
</style>
