<script setup lang="ts">
/**
 * AgentHistory - AI 智能体查询明细
 *
 * 功能：
 * - ProTable 受控模式分页（pageNo/pageSize）
 * - 搜索：用户名/身份证号/查询内容/智能体名称/时间范围
 * - 行操作：详情、删除
 * - 详情弹窗：展示完整 query/response
 * - 导出（arraybuffer，支持选中行 ids）
 */
import { Delete, View, Download, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  deleteAiagentRecord,
  downloadAiagentRecord,
  getAiagentRecordPage,
  type AiagentRecord,
} from '@/api/thirdInterface/agentInterface';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'AgentHistory' });

// ===== 受控模式状态 =====
const list = ref<AiagentRecord[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);
const searchParams = reactive<Record<string, unknown>>({
  userName: '',
  identityCardNumber: '',
  content: '',
  agentName: '',
  startTime: '',
  endTime: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 选中行（用于导出 ids） =====
const selection = ref<AiagentRecord[]>([]);

// ===== 详情弹窗 =====
const detailVisible = ref(false);
const detailData = ref<AiagentRecord | null>(null);

// 导出 loading
const exportLoading = ref(false);

const columns = computed<ITableColumn[]>(() => [
  { prop: 'userName', label: '查询人', minWidth: 100, showOverflowTooltip: true },
  { prop: 'identityCardNumber', label: '查询人身份证号', minWidth: 160, showOverflowTooltip: true },
  { prop: 'agentName', label: '智能体', minWidth: 120, showOverflowTooltip: true },
  { prop: 'departmentName', label: '部门', minWidth: 120, showOverflowTooltip: true },
  { prop: 'queryContent', label: '查询内容', minWidth: 200, showOverflowTooltip: true },
  { prop: 'time', label: '查询时间', width: 160, align: 'center' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 160,
    align: 'center',
    slotName: 'actions',
  },
]);

const actions = computed(() => [
  {
    label: '导出',
    type: 'primary' as const,
    icon: Download,
    onClick: handleExport,
    disabled: exportLoading.value,
  },
]);

const searchPlaceholder = computed(() => '用户名');

// ===== ProTable fetch =====
async function fetchList(params: Record<string, unknown>): Promise<unknown> {
  // 处理时间范围
  if (dateRange.value && dateRange.value.length === 2) {
    searchParams.startTime = dateRange.value[0];
    searchParams.endTime = dateRange.value[1];
  } else {
    searchParams.startTime = '';
    searchParams.endTime = '';
  }
  return getAiagentRecordPage({
    pageNo: Number(params.pageNo ?? 1),
    pageSize: Number(params.pageSize ?? 10),
    userName: String(searchParams.userName ?? ''),
    identityCardNumber: String(searchParams.identityCardNumber ?? ''),
    content: String(searchParams.content ?? ''),
    agentName: String(searchParams.agentName ?? ''),
    startTime: String(searchParams.startTime ?? ''),
    endTime: String(searchParams.endTime ?? ''),
  });
}

function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AiagentRecord[];
  total.value = defaultTableFormatter.getTotal(res);
}

function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.userName = '';
  searchParams.identityCardNumber = '';
  searchParams.content = '';
  searchParams.agentName = '';
  searchParams.startTime = '';
  searchParams.endTime = '';
  dateRange.value = null;
  tableRef.value?.init();
}

/** ProTable 多选变化回调 */
function handleSelectionChange(rows: AiagentRecord[]): void {
  selection.value = rows;
}

/** 从 ProTable slot scope 中安全获取 AiagentRecord */
function getRow(scope: any): AiagentRecord {
  return (scope?.row as AiagentRecord) ?? ({} as AiagentRecord);
}

// ===== 详情 =====
function handleView(row: AiagentRecord): void {
  detailData.value = row;
  detailVisible.value = true;
}

// ===== 删除 =====
function handleDelete(row: AiagentRecord): void {
  ElMessageBox.confirm('确定删除该查询记录？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await deleteAiagentRecord(row.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除失败');
          return;
        }
        ElMessage.success('删除成功');
        tableRef.value?.refresh();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败');
      }
    })
    .catch(() => {});
}

// ===== 导出 =====
async function handleExport(): Promise<void> {
  if (exportLoading.value) return;
  exportLoading.value = true;
  try {
    // 选中行优先导出，ids 以逗号分隔
    const ids = selection.value
      .map((row) => row.id)
      .filter(Boolean)
      .join(',');
    await downloadAiagentRecord({
      userName: String(searchParams.userName ?? ''),
      identityCardNumber: String(searchParams.identityCardNumber ?? ''),
      content: String(searchParams.content ?? ''),
      agentName: String(searchParams.agentName ?? ''),
      startTime: String(searchParams.startTime ?? ''),
      endTime: String(searchParams.endTime ?? ''),
      ...(ids ? { ids } : {}),
    });
    ElMessage.success('导出成功');
  } catch (e) {
    console.error(e);
    ElMessage.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  // ProTable 默认 immediate=true，会自动请求
});
</script>

<template>
  <div class="agent-history">
    <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.userName as string"
          placeholder="查询人"
          class="filter-item"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.identityCardNumber as string"
          placeholder="查询人身份证号"
          class="filter-item"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.content as string"
          placeholder="查询内容"
          class="filter-item"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.agentName as string"
          placeholder="智能体名称"
          class="filter-item"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="filter-item"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchList"
      :data="list"
      :total="total"
      :search-params="searchParams"
      :show-selection="true"
      page-num-field="pageNo"
      page-size-field="pageSize"
      @response="handleResponse"
      @selection-change="handleSelectionChange"
    >
      <template #actions="scope">
        <el-button type="primary" link :icon="View" @click="handleView(getRow(scope))">详情</el-button>
        <el-button type="danger" link :icon="Delete" @click="handleDelete(getRow(scope))">删除</el-button>
      </template>
    </ProTable>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="查询记录详情"
      width="720px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="查询人">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailData.identityCardNumber }}</el-descriptions-item>
        <el-descriptions-item label="智能体">{{ detailData.agentName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.departmentName }}</el-descriptions-item>
        <el-descriptions-item label="查询时间" :span="2">{{ detailData.time }}</el-descriptions-item>
        <el-descriptions-item label="查询内容" :span="2">
          <pre class="content-pre">{{ detailData.queryContent }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应内容" :span="2">
          <pre class="content-pre">{{ detailData.responseContent ?? '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.agent-history {
  padding: 8px 16px;

  .filter-item {
    margin-right: 8px;
  }
}

.content-pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  max-height: 240px;
  overflow-y: auto;
}
</style>
