<script setup lang="ts">
/**
 * dutyInformation/index.vue - 排班信息
 */
import { ArrowLeft, ArrowRight, Calendar, Menu as MenuIcon, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import DutyCalendar from './components/DutyCalendar.vue';
import DutySearchBar from './components/DutySearchBar.vue';
import ImportResultDialog from './components/ImportResultDialog.vue';
import {
  exportDutyInformationTemplate,
  getScheduleCalendar,
  getSchedulePage,
  delBatchSchedule,
  type ScheduleItem,
  type ImportResultData,
} from '@/api/shiftScheduling';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'DutyInformation' });

const { t } = useI18n({ useScope: 'global' });

// ===== 受控模式状态 =====
const list = ref<ScheduleItem[]>([]);
const total = ref(0);
// searchParams 仅占位（实际搜索条件从 DutySearchBar 实时读取，避免双向绑定复杂度）
// ProTable 仍会用 searchParams 触发分页参数构造
const searchParams = ref<Record<string, unknown>>({});

// 多选
const multipleSelection = ref<string[]>([]);

// 日历数据：{ 'YYYY-MM-DD': ScheduleItem[] }
const calendarList = ref<Record<string, ScheduleItem[]> | null>(null);

// 视图模式：calendar/list，默认 list
const showType = ref<'calendar' | 'list'>('list');

// 组件 ref
const searchbarRef = ref<InstanceType<typeof DutySearchBar>>();
const calendarRef = ref<InstanceType<typeof DutyCalendar>>();
const importDialogRef = ref<InstanceType<typeof ImportResultDialog>>();
const tableRef = ref<InstanceType<typeof ProTable>>();

// 导入失败明细（传给 ImportResultDialog）
const importErrorMap = ref<Record<string, string[]>>({});

// 列定义：13 列 + 操作列
const columns = computed<ITableColumn[]>(() => [
  { prop: 'userId', label: '人员ID', minWidth: 100, align: 'center' },
  { prop: 'userName', label: '姓名', minWidth: 80, align: 'center' },
  { prop: 'departmentName', label: '所属组织', minWidth: 120, align: 'center' },
  { prop: 'postName', label: '协同岗名称', minWidth: 120, align: 'center', slotName: 'postName' },
  { prop: 'dutyTypeName', label: '排班类型', minWidth: 100, align: 'center', slotName: 'dutyTypeName' },
  { prop: 'dutyType', label: '排班类型标识', minWidth: 100, align: 'center', slotName: 'dutyType' },
  { prop: 'dutyStartDate', label: '值班开始日期', minWidth: 120, align: 'center' },
  { prop: 'dutyStartTime', label: '值班开始时间', minWidth: 120, align: 'center', slotName: 'dutyStartTime' },
  { prop: 'dutyEndDate', label: '值班结束日期', minWidth: 120, align: 'center' },
  { prop: 'dutyEndTime', label: '值班结束时间', minWidth: 120, align: 'center', slotName: 'dutyEndTime' },
  { prop: 'dutyContent', label: '排班任务', minWidth: 150, align: 'center', slotName: 'dutyContent' },
  { prop: 'gmtCreated', label: '创建时间', minWidth: 160, align: 'center' },
  { prop: 'gmtModified', label: '更新时间', minWidth: 160, align: 'center' },
  { prop: 'importUserName', label: '更新人', minWidth: 100, align: 'center' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 100,
    align: 'center',
    slotName: 'actions',
  },
]);

// 格式化时间：去除秒（'HH:mm:ss' → 'HH:mm'）
function formatTimeRemoveSeconds(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ===== ProTable fetchApi：list 模式 =====
/**
 * 从 DutySearchBar 实时读取搜索条件，调用 getSchedulePage
 * 参数由 ProTable 的 buildParams 构造：{ ...searchParams, pageNum, pageSize }
 * 注意：searchParams 是占位空对象，实际搜索条件在调用时从 searchbarRef 读取
 */
async function fetchSchedulePageApi(params: Record<string, unknown>): Promise<unknown> {
  const query = searchbarRef.value?.getQuery() ?? { userId: '', userName: '', type: '', date: [] as string[] };
  const [startDate, endDate] = query.date ?? [];
  return getSchedulePage({
    startDate,
    endDate,
    userId: query.userId,
    userName: query.userName,
    dutyType: query.type,
    pageNum: Number(params.pageNum ?? 1),
    pageSize: Number(params.pageSize ?? 10),
  } as never);
}

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as ScheduleItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// 日历模式：独立请求逻辑（list 模式由 ProTable 接管）
async function fetchCalendarData(): Promise<void> {
  try {
    const query = searchbarRef.value?.getQuery() ?? { userId: '', userName: '', type: '', date: [] as string[] };
    const [startDate, endDate] = query.date ?? [];
    const params: Record<string, unknown> = {
      startDate,
      endDate,
      userId: query.userId,
      userName: query.userName,
      dutyType: query.type,
    };
    const searchObj = calendarRef.value?.getSearchObj();
    if (searchObj) {
      params.month = `${searchObj.year}-${String(searchObj.month).padStart(2, '0')}`;
    }
    const res = await getScheduleCalendar(params as never);
    // calendar 模式 res.data 是 { 'YYYY-MM-DD': ScheduleItem[] }
    calendarList.value = (res as unknown as { data: Record<string, ScheduleItem[]> | null })?.data ?? null;
  } catch {
    // 忽略
  }
}

// 搜索
function handleSearch(): void {
  if (showType.value === 'calendar') {
    const query = searchbarRef.value?.getQuery();
    const [startDate] = query?.date ?? [];
    if (startDate) {
      calendarRef.value?.getYearAndMonth(startDate);
    }
    fetchCalendarData();
  } else {
    // list 模式：触发 ProTable.init（重置到第 1 页 + 用最新搜索条件）
    tableRef.value?.init();
  }
}

// 重置
function handleReset(): void {
  if (showType.value === 'calendar') {
    calendarRef.value?.getYearAndMonth();
    fetchCalendarData();
  } else {
    tableRef.value?.init();
  }
}

// 多选：收集 id
function handleSelection(val: ScheduleItem[]): void {
  multipleSelection.value = val.map((item) => item.id);
}

// 删除：单个/批量，调用 delBatchSchedule
function handleDelete(row?: ScheduleItem): void {
  let ids: string[];
  if (row) {
    ids = [row.id];
  } else {
    if (multipleSelection.value.length === 0) {
      ElMessage.error('未勾选排班数据');
      return;
    }
    ids = multipleSelection.value;
  }
  ElMessageBox.confirm(`确定${row ? '' : '批量'}删除吗？`, {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      delBatchSchedule(ids)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success(`${row ? '' : '批量'}删除成功`);
          } else {
            ElMessage.error(result.msg || '');
          }
          // 刷新当前视图
          if (showType.value === 'calendar') {
            fetchCalendarData();
          } else {
            tableRef.value?.refresh();
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// 模板下载：GET blob → 解析文件名 → 下载
async function handleExport(): Promise<void> {
  try {
    const res = await exportDutyInformationTemplate();
    const data = (res as unknown as { data: ArrayBuffer })?.data;
    const headers = (res as unknown as { headers: Record<string, string> })?.headers;
    if (!data) return;
    const fileName = getExportFileName(headers);
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.log(error);
  }
}

// 从 Content-Disposition 解析文件名
function getExportFileName(headers?: Record<string, string>): string {
  const contentDisposition = headers?.['content-disposition'] || '';
  if (!contentDisposition) return '值班信息.xlsx';
  const reg = /filename\*=\s*utf-8''([^;]+)|filename="?([^;"]+)"?/i;
  const match = contentDisposition.match(reg);
  if (!match) return '值班信息.xlsx';
  const raw = (match[1] || match[2] || '').trim();
  const fileName = decodeURIComponent(raw);
  return fileName || '值班信息.xlsx';
}

// 导入成功回调
function handleImportSuccess(data: ImportResultData): void {
  if (data?.errorMap && Object.keys(data.errorMap).length > 0) {
    importErrorMap.value = data.errorMap;
  }
  if (data?.successList?.length > 0) {
    if (showType.value === 'calendar') {
      fetchCalendarData();
    } else {
      tableRef.value?.refresh();
    }
  }
}

// 月份切换：DutyCalendar 内部已处理年月更新
function handlePrevMonth(): void {
  fetchCalendarData();
}

function handleNextMonth(): void {
  fetchCalendarData();
}

// 视图切换：变化时重新拉取对应视图数据
watch(showType, (newType) => {
  if (newType === 'calendar') {
    fetchCalendarData();
  } else {
    // list 模式：切回时刷新一次
    // 注意：calendar→list 切换时 ProTable 由 v-if 重新渲染，需 nextTick 等挂载完成
    nextTick(() => {
      tableRef.value?.refresh();
    });
  }
});

/** 从 ProTable slot scope 中安全获取 ScheduleItem */
function getRow(scope: any): ScheduleItem {
  return (scope?.row as ScheduleItem) ?? ({} as ScheduleItem);
}

onMounted(() => {
  // 注：DutyCalendar 用 v-if 延迟挂载，初始化在 DutyCalendar 内部 onMounted 完成
  // list 模式：手动触发首次加载（immediate=false，等 searchbarRef 挂载完毕）
  tableRef.value?.init();
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <!-- 搜索区：DutySearchBar 内部管理 listQuery + 排班类型滚动加载 + 上传导入 -->
      <DutySearchBar
        ref="searchbarRef"
        :show-type="showType"
        @search="handleSearch"
        @reset="handleReset"
        @batch-delete="handleDelete()"
        @import-success="handleImportSuccess"
        @template-download="handleExport"
      />

      <!-- 月份导航 + 视图切换：始终显示，列表模式左侧空 -->
      <div class="view-toolbar">
        <div class="month-nav no-select">
          <template v-if="showType === 'calendar' && calendarRef">
            <el-icon class="arrow-icon" @click="calendarRef.goPrevMonth()"><ArrowLeft /></el-icon>
            <span class="month-text">
              {{ calendarRef.getSearchObj().year }}年{{ String(calendarRef.getSearchObj().month).padStart(2, '0') }}月
            </span>
            <el-icon class="arrow-icon" @click="calendarRef.goNextMonth()"><ArrowRight /></el-icon>
          </template>
        </div>
        <!-- 视图切换：使用 el-radio-group button 样式，与 large 主题一致 -->
        <el-radio-group v-model="showType" class="view-switcher">
          <el-radio-button label="calendar">
            <el-icon><Calendar /></el-icon>
            <span>日历查看</span>
          </el-radio-button>
          <el-radio-button label="list">
            <el-icon><MenuIcon /></el-icon>
            <span>列表</span>
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 日历视图：仅 calendar 模式渲染 DutyCalendar -->
      <DutyCalendar
        v-if="showType === 'calendar'"
        ref="calendarRef"
        :calendar-list="calendarList"
        :duty-type-filter="searchbarRef?.getQuery()?.type ?? ''"
        @prev-month="handlePrevMonth"
        @next-month="handleNextMonth"
      />

      <!-- 列表视图：复用 ProTable 受控模式 -->
      <ProTable
        v-else
        ref="tableRef"
        :columns="columns"
        :fetch-api="fetchSchedulePageApi"
        :data="list"
        :total="total"
        :search-params="searchParams"
        :show-selection="true"
        :immediate="false"
        @response="handleResponse"
        @selection-change="handleSelection"
      >
        <!-- 协同岗名称（空显示 '-'） -->
        <template #postName="scope">
          <span>{{ getRow(scope).postName || '-' }}</span>
        </template>
        <!-- 排班类型（空显示 '-'） -->
        <template #dutyTypeName="scope">
          <span>{{ getRow(scope).dutyTypeName || '-' }}</span>
        </template>
        <!-- 排班类型标识（空显示 '-'） -->
        <template #dutyType="scope">
          <span>{{ getRow(scope).dutyType || '-' }}</span>
        </template>
        <!-- 值班开始时间（去除秒） -->
        <template #dutyStartTime="scope">
          <span>{{ formatTimeRemoveSeconds(getRow(scope).dutyStartTime) }}</span>
        </template>
        <!-- 值班结束时间（去除秒） -->
        <template #dutyEndTime="scope">
          <span>{{ formatTimeRemoveSeconds(getRow(scope).dutyEndTime) }}</span>
        </template>
        <!-- 排班任务（单行省略） -->
        <template #dutyContent="scope">
          <span class="text-single">{{ getRow(scope).dutyContent }}</span>
        </template>

        <!-- 操作列：删除 -->
        <template #actions="scope">
          <el-button type="danger" link :icon="Delete" @click="handleDelete(getRow(scope))">
            {{ t('delete') }}
          </el-button>
        </template>
      </ProTable>

      <!-- 导入失败明细弹窗 -->
      <ImportResultDialog ref="importDialogRef" :error-map="importErrorMap" />
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

// 月份导航 + 视图切换工具栏
.view-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: @spacing-md-plus;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: @spacing-sm-plus;
  min-height: 24px;

  .arrow-icon {
    cursor: pointer;
    font-size: @font-size-xl;
    color: @color-text-regular;
    transition: color @transition-duration;

    &:hover {
      color: @color-primary;
    }
  }

  .month-text {
    font-size: @font-size-lg;
    font-weight: @font-weight-medium;
    color: @color-text-primary;
    min-width: 100px;
    text-align: center;
  }
}

// 视图切换按钮组（el-radio-button 样式）
// 让 el-icon 与 span 在同一行水平对齐 + 垂直居中
.view-switcher {
  :deep(.el-radio-button) {
    .el-radio-button__inner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: @spacing-xs;
      padding: 0 @spacing-md;
      height: 32px;
      line-height: 1;
      font-size: @font-size-sm;

      .el-icon {
        // 关键：让 svg 图标与文字基线对齐
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
      }

      span {
        line-height: 1;
      }
    }
  }
}

.no-select {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.text-single {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
