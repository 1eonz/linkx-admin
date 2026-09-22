<script setup lang="ts">
/**
 * TicketManage - 警单管理列表
 *
 * 功能特性：
 * 1. ProTable 受控模式 + SearchBar 搜索栏（支持警单编号/警单名称搜索）
 * 2. 分页字段使用 current/size（通过 page-num-field/page-size-field 适配）
 * 3. 查看详情调用 TicketDetail 弹窗
 *
 * @example 父组件用法
 * ```vue
 * <TicketManage />
 * ```
 */
import { View } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';

import TicketDetail from './TicketDetail.vue';
import { getPoliceticketPage, type PoliceticketItem } from '@/api/thirdInterface/policeReport';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'TicketManage' });

// ===== 受控模式状态 =====
const list = ref<PoliceticketItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  code: '',
  name: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const detailRef = ref<InstanceType<typeof TicketDetail>>();

// 列定义：警单编号/警单名称/警单内容/标签/来源/创建时间/操作
const columns = computed<ITableColumn[]>(() => [
  { prop: 'code', label: '警单编号', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'name', label: '警单名称', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'content', label: '警单内容', minWidth: 200, align: 'center', showOverflowTooltip: true },
  { prop: 'tag', label: '标签', width: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'source', label: '来源', width: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'createTime', label: '创建时间', width: 180, align: 'center', showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 120,
    align: 'center',
    slotName: 'actions',
  },
]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as PoliceticketItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.code = '';
  searchParams.name = '';
  tableRef.value?.init();
}

// 详情：传 id 而非整行，由详情组件内部调用 getPoliceticketById 拉取
function handleView(row: PoliceticketItem): void {
  if (!row.id) return;
  detailRef.value?.open(row.id);
}

/** 从 ProTable slot scope 中安全获取 PoliceticketItem */
function getRow(scope: any): PoliceticketItem {
  return (scope?.row as PoliceticketItem) ?? ({} as PoliceticketItem);
}
</script>

<template>
  <div class="ticket-manage">
    <SearchBar :actions="[]" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.code as string"
          placeholder="警单编号"
          class="filter-item"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.name as string"
          placeholder="警单名称"
          class="filter-item"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getPoliceticketPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      page-num-field="current"
      page-size-field="size"
      @response="handleResponse"
    >
      <!-- 操作列 -->
      <template #actions="scope">
        <el-button type="primary" link :icon="View" @click="handleView(getRow(scope))"> 详情 </el-button>
      </template>
    </ProTable>

    <TicketDetail ref="detailRef" />
  </div>
</template>

<style lang="less" scoped>
.ticket-manage {
  width: 100%;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}
</style>
