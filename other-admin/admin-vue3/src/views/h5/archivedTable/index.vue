<script setup lang="ts">
/**
 * 已归档群组管理
 *
 * 功能：
 * - 分页查询已归档群组（按关键字 + 时间范围搜索）
 * - 单条/批量下载归档文件（进度条弹窗 + AbortController 可取消）
 * - 单条/批量删除归档群组
 * - 同步群组（受系统配置 GROUP_SYNC 控制：value=0 可同步，同步后置为 1）
 *
 * 列表表格展示：群组名称 / 标签 / 关联内容 / 所属部门 / 归档人 / 归档位置 / 归档时间 / 操作
 *
 * 下载进度：
 * - 真实进度回调（onDownloadProgress）+ 模拟进度定时器（兜底，当 total 未知时）
 * - 当真实进度 ≥90% 时切换到完成检测模式（缓慢爬到 100%）
 * - 支持 AbortController 中断请求
 *
 * 请求体格式说明：
 * - 下载/删除接口的 body 直接是 JSON 字符串（如 `"[123,456]"`），非 `{ groupIds: "..." }` 包装
 * - 在 API 层已用 JSON.stringify 处理
 */
import { Delete, Download, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import {
  deleteArchive,
  getArchiveDownload,
  getArchivePage,
  getSystemConfig,
  pullHistoryGroup,
  setSystemConfig,
  type ArchivedGroupItem,
} from '@/api/h5/archivedTable';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import { getServiceFile } from '@/utils';

defineOptions({ name: 'ArchivedTable' });

// ===== 受控模式状态 =====
const list = ref<ArchivedGroupItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  keywords: '',
  startTime: '',
  endTime: '',
});

/** 日期范围（el-date-picker daterange 绑定数组） */
const dateRange = ref<[string, string] | null>(null);

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'groupName', label: '群组名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'tagName', label: '标签', minWidth: 120, showOverflowTooltip: true },
  { prop: 'taskName', label: '关联内容', minWidth: 150, showOverflowTooltip: true },
  { prop: 'departmentName', label: '所属部门', minWidth: 120, showOverflowTooltip: true },
  { prop: 'archiveUserName', label: '归档人', width: 120, showOverflowTooltip: true },
  { prop: 'archivedFile', label: '归档位置', minWidth: 150, showOverflowTooltip: true },
  { prop: 'archivedTime', label: '归档时间', width: 180, showOverflowTooltip: true },
  { prop: 'operation', label: '操作', width: 200, align: 'center', slotName: 'operation' },
];

// ===== 搜索区按钮 =====
const actions = computed(() => [
  {
    key: 'batchDownload',
    label: '批量下载',
    type: 'primary' as const,
    icon: Download,
    onClick: handleBatchDownload,
    disabled: selectedIds.value.length === 0,
  },
  {
    key: 'batchDelete',
    label: '批量删除',
    type: 'danger' as const,
    icon: Delete,
    onClick: handleBatchDelete,
    disabled: selectedIds.value.length === 0,
  },
  {
    key: 'sync',
    label: '同步群组',
    type: 'warning' as const,
    icon: Refresh,
    onClick: handleSync,
    disabled: syncDisabled.value,
  },
]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as ArchivedGroupItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  if (dateRange.value) {
    searchParams.startTime = dateRange.value[0];
    searchParams.endTime = dateRange.value[1];
  } else {
    searchParams.startTime = '';
    searchParams.endTime = '';
  }
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.keywords = '';
  searchParams.startTime = '';
  searchParams.endTime = '';
  dateRange.value = null;
  tableRef.value?.init();
}

// ===== 选中行 =====
const selectedRows = ref<ArchivedGroupItem[]>([]);
const selectedIds = computed(() => selectedRows.value.map((r) => r.groupId));

function handleSelectionChange(rows: ArchivedGroupItem[]): void {
  selectedRows.value = rows;
}

// ===== 下载相关 =====
const downloadDialogVisible = ref(false);
const downloadProgress = ref(0);
/** el-progress 状态：null 进行中、'success' 成功、'exception' 失败/取消 */
const downloadStatus = ref<null | 'success' | 'exception'>(null);
const downloadText = ref('0%');
const cancelRequested = ref(false);

/** 下载请求的 AbortController */
let downloadController: AbortController | null = null;
/** 模拟进度定时器 */
let progressTimer: ReturnType<typeof setInterval> | null = null;
/** 完成检测定时器 */
let completionTimer: ReturnType<typeof setInterval> | null = null;

/** 单条/批量下载入口 */
async function handleDownload(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) {
    ElMessage.warning('请先选择要下载的项目');
    return;
  }

  try {
    await ElMessageBox.confirm('确定下载吗？', '下载确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    return;
  }

  // 初始化下载状态
  downloadProgress.value = 0;
  downloadStatus.value = null;
  downloadText.value = '0%';
  downloadDialogVisible.value = true;
  cancelRequested.value = false;
  downloadController = new AbortController();

  // 启动模拟进度（兜底，当 Content-Length 不可用时）
  startProgressSimulation();

  try {
    const res = await getArchiveDownload(ids, {
      onDownloadProgress: (e) => {
        if (cancelRequested.value) return;
        // 真实进度回调
        if (e.total && e.total > 0) {
          const percent = Math.round((e.loaded * 100) / e.total);
          if (percent >= 90 && percent < 100) {
            // 进入完成检测模式
            downloadProgress.value = percent;
            startCompletionDetection();
          } else {
            downloadProgress.value = percent;
          }
        } else {
          // total 未知：用 loaded/1MB * 10 估算，上限 95
          const estimate = Math.min(95, Math.floor((e.loaded / (1024 * 1024)) * 10));
          downloadProgress.value = estimate;
        }
        downloadText.value = `${downloadProgress.value}%`;
      },
      abort: downloadController?.signal,
    });

    if (cancelRequested.value) return;

    // 响应数据可能是 ArrayBuffer（成功）或业务对象（失败兜底）
    const buffer = res.data;
    if (!(buffer instanceof ArrayBuffer)) {
      downloadStatus.value = 'exception';
      downloadText.value = '下载失败';
      ElMessage.error(res.msg || '下载失败，请重试');
      return;
    }

    // 完成
    downloadProgress.value = 100;
    downloadText.value = '100%';
    downloadStatus.value = 'success';

    // 处理 Blob 下载
    const blob = new Blob([buffer], { type: 'application/zip' });
    const fileName = buildDownloadFileName(ids);
    getServiceFile(blob, fileName);
    ElMessage.success('下载成功');
  } catch {
    if (cancelRequested.value) return;
    downloadStatus.value = 'exception';
    downloadText.value = '下载失败';
    ElMessage.error('下载失败，请重试');
  } finally {
    clearAllTimers();
  }
}

/** 单条下载 */
function handleRowDownload(row: ArchivedGroupItem): void {
  handleDownload([row.groupId]);
}

/** 批量下载 */
function handleBatchDownload(): void {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要下载的项目');
    return;
  }
  handleDownload(selectedIds.value);
}

/** 取消下载 */
function handleCancelDownload(): void {
  cancelRequested.value = true;
  downloadController?.abort();
  clearAllTimers();
  downloadText.value = '下载已取消';
  downloadStatus.value = 'exception';
  // 1 秒后关闭弹窗
  setTimeout(() => {
    downloadDialogVisible.value = false;
  }, 1000);
}

/** 模拟进度定时器（兜底，当 onDownloadProgress 的 total 不可用时） */
function startProgressSimulation(): void {
  clearProgressTimer();
  progressTimer = setInterval(() => {
    if (cancelRequested.value) {
      clearProgressTimer();
      return;
    }
    if (downloadProgress.value < 85) {
      const random = Math.floor(Math.random() * 10) + 1;
      downloadProgress.value = Math.min(85, downloadProgress.value + random);
      downloadText.value = `${downloadProgress.value}%`;
    } else {
      clearProgressTimer();
    }
  }, 500);
}

/** 完成检测定时器（真实进度到达 90% 后缓慢爬到 100%） */
function startCompletionDetection(): void {
  clearCompletionTimer();
  completionTimer = setInterval(() => {
    if (cancelRequested.value) {
      clearCompletionTimer();
      return;
    }
    if (downloadProgress.value < 100) {
      downloadProgress.value = Math.min(100, downloadProgress.value + 1);
      downloadText.value = `${downloadProgress.value}%`;
    } else {
      clearCompletionTimer();
    }
  }, 100);
}

function clearProgressTimer(): void {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function clearCompletionTimer(): void {
  if (completionTimer) {
    clearInterval(completionTimer);
    completionTimer = null;
  }
}

function clearAllTimers(): void {
  clearProgressTimer();
  clearCompletionTimer();
}

/** 构造下载文件名 */
function buildDownloadFileName(ids: string[]): string {
  if (ids.length === 1) return `${ids[0]}.zip`;
  if (ids.length <= 3) return `${ids.join('_')}.zip`;
  return `批量下载_${ids.length}个文件.zip`;
}

// ===== 删除 =====
/** 单条删除 */
function handleRowDelete(row: ArchivedGroupItem): void {
  ElMessageBox.confirm(`确定删除已归档群组「${row.groupName ?? ''}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteArchive([row.groupId]))
    .then(({ code, msg }) => {
      if (code !== 0) {
        ElMessage.error(msg || '删除失败，请重试');
        return;
      }
      ElMessage.success('删除成功');
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

/** 批量删除 */
function handleBatchDelete(): void {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的项目');
    return;
  }
  const count = selectedIds.value.length;
  ElMessageBox.confirm(`确定要删除选中的 ${count} 个已归档群组信息吗？`, '批量删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteArchive(selectedIds.value))
    .then(({ code, msg }) => {
      if (code !== 0) {
        ElMessage.error(msg || '删除失败，请重试');
        return;
      }
      ElMessage.success('删除成功');
      selectedRows.value = [];
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

// ===== 同步群组 =====
const syncDisabled = ref(false);
/** GROUP_SYNC 配置项 ID（运行时从 getSystemConfig 动态获取，避免硬编码） */
const groupSyncConfigId = ref<string>('');

/** 加载系统配置，根据 GROUP_SYNC 控制按钮可用性 */
async function loadSystemConfig(): Promise<void> {
  try {
    const res = await getSystemConfig();
    const list = (res.data ?? []) as Array<{ id: string; key: string; value: string }>;
    const item = list.find((c) => c.key === 'GROUP_SYNC');
    if (item) {
      groupSyncConfigId.value = item.id;
      syncDisabled.value = item.value !== '0';
    } else {
      syncDisabled.value = true;
    }
  } catch {
    syncDisabled.value = true;
  }
}

/** 执行同步群组 */
async function handleSync(): Promise<void> {
  try {
    const res = await pullHistoryGroup({ sync: 1 });
    if (res.code !== 0) {
      ElMessage.error(res.msg || '同步失败');
      return;
    }
    // 同步成功后更新系统配置
    if (groupSyncConfigId.value) {
      await setSystemConfig({ id: groupSyncConfigId.value, value: '1' });
    }
    syncDisabled.value = true;
    ElMessage.info('数据同步中，请至后台日志查看同步结果');
  } catch {
    ElMessage.error('同步失败，请重试');
  }
}

/** 从 ProTable slot scope 中安全获取 ArchivedGroupItem */
function getRow(scope: any): ArchivedGroupItem {
  return (scope?.row as ArchivedGroupItem) ?? ({} as ArchivedGroupItem);
}

// 组件卸载前清理定时器
onBeforeUnmount(() => {
  clearAllTimers();
  if (downloadController) {
    downloadController.abort();
    downloadController = null;
  }
});

// 组件挂载后加载系统配置
onMounted(() => {
  loadSystemConfig();
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar :actions="actions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <el-input
            v-model="searchParams.keywords as string"
            placeholder="请输入群组名称、标签、所属部门"
            style="width: 260px"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
            style="width: 260px"
            @blur="handleSearch"
          />
        </template>
      </SearchBar>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getArchivePage"
        :data="list"
        :total="total"
        :search-params="searchParams"
        show-selection
        row-key="groupId"
        @response="handleResponse"
        @selection-change="handleSelectionChange"
      >
        <!-- 操作列 -->
        <template #operation="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: Download, label: '下载', onClick: () => handleRowDownload(getRow(scope)) },
              { type: 'danger', icon: Delete, label: '删除', onClick: () => handleRowDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <!-- 下载进度弹窗 -->
    <el-dialog
      v-model="downloadDialogVisible"
      title="文件下载"
      width="30%"
      align-center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      append-to-body
    >
      <el-progress
        :percentage="downloadProgress"
        :status="downloadStatus ?? undefined"
        :stroke-width="18"
        :text-inside="true"
      />
      <div class="download-text">{{ downloadText }}</div>
      <template #footer>
        <el-button v-if="downloadStatus === null" @click="handleCancelDownload">取消下载</el-button>
        <el-button v-else type="primary" @click="downloadDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.download-text {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  color: @color-text-secondary;
}
</style>
