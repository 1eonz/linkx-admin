<script setup lang="ts">
/**
 * CoopBindDialog - 挂靠协同岗/设置默认协同岗弹窗
 *
 * 设计说明：
 * - 依赖反转：通过 props.fetchList / props.submit 注入业务逻辑
 * - 双模式：bind（挂靠协同岗）/ default（设置默认协同岗）
 * - selectionType 由外部 fetchList 函数决定，不在弹窗内硬编码
 */
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash-es';
import { computed, ref } from 'vue';

import type { CollaborationItem } from '@/api/h5/collaboration';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'CoopBindDialog' });

type BindMode = 'bind' | 'default';

export interface CoopBindDialogInstance {
  open: (mode: BindMode, selectionId?: string) => void;
}

const props = defineProps<{
  /**
   * 获取协同岗列表函数（依赖反转，调用方注入）
   * 返回 { records, total } 直接结构
   * 注意：selectionType 由调用方在 fetchList 内部决定（coopLevel / functionalDepartment）
   */
  fetchList: (params: {
    pageNum: number;
    pageSize: number;
    postName?: string;
    selectionType?: string;
    selectionId?: string;
  }) => Promise<{ records: CollaborationItem[]; total: number | string }>;
  /**
   * 提交函数（依赖反转）
   * 返回 true 表示成功
   */
  submit: (selected: CollaborationItem[]) => Promise<boolean>;
  /**
   * 可选：打开 default 模式前回调（用于预加载已有默认协同岗列表）
   * 仅在 mode === 'default' 时调用
   */
  beforeOpenDefault?: () => Promise<void>;
}>();

const emit = defineEmits<{
  /** 提交成功后通知外部刷新表格 */
  (e: 'submitted'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const submitLoading = ref(false);
const mode = ref<BindMode>('bind');
const keyword = ref('');
const list = ref<CollaborationItem[]>([]);
const selected = ref<CollaborationItem[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 当前挂靠的层级 id（由外部 open 时传入）
const currentSelectionId = ref<string>('');

const tableRef = ref<any>(null);

const title = computed(() => (mode.value === 'default' ? '设置默认协同岗' : '挂靠协同岗'));

const confirmText = computed(() => {
  return `确定${mode.value === 'bind' ? '挂靠' : ''}（已选 ${selected.value.length} 个）`;
});

// ProTable 列配置（与原 el-table 列一致）
const columns: ITableColumn[] = [
  { prop: 'postName', label: '协同岗名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 140, showOverflowTooltip: true },
];

/** 可选性判断：bind 模式禁用 selected=true，default 模式禁用 disabled=true */
function checkSelectable(row: CollaborationItem): boolean {
  if (mode.value === 'bind') {
    return !(row.selected as boolean);
  }
  return !(row.disabled as boolean);
}

async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    const res = await props.fetchList({
      pageNum: page.value,
      pageSize: pageSize.value,
      postName: keyword.value,
      // selectionType 由外部 fetchList 自行决定，这里仅透传 selectionId
      selectionId: mode.value === 'default' ? undefined : currentSelectionId.value,
    });
    list.value = res.records ?? [];
    total.value = Number(res.total) || 0;
    // 切换数据后保留选中（ProTable 通过 reserve-selection + row-key 实现）
  } catch (e) {
    console.error('[CoopBindDialog] fetchList 失败:', e);
    ElMessage.error('获取协同岗列表失败');
  } finally {
    loading.value = false;
  }
}

/** 父组件调用：打开弹窗 */
async function open(openMode: BindMode, selectionId?: string): Promise<void> {
  mode.value = openMode;
  currentSelectionId.value = selectionId ?? '';
  visible.value = true;
  keyword.value = '';
  page.value = 1;
  selected.value = [];

  // default 模式：先回调预加载已有默认协同岗
  if (openMode === 'default' && props.beforeOpenDefault) {
    await props.beforeOpenDefault();
  }

  fetchList();
}

function resetBindDialog(): void {
  tableRef.value?.clearSelection();
  list.value = [];
  selected.value = [];
  keyword.value = '';
}

function handleSelectionChange(rows: CollaborationItem[]): void {
  selected.value = rows;
}

const handleSearch = debounce(() => {
  page.value = 1;
  fetchList();
}, 300);

async function submitBind(): Promise<void> {
  if (selected.value.length === 0) return;
  submitLoading.value = true;
  try {
    const ok = await props.submit(selected.value);
    if (ok) {
      ElMessage.success(mode.value === 'default' ? '操作成功' : `成功挂靠 ${selected.value.length} 个协同岗`);
      visible.value = false;
      // 通知外部刷新
      emit('submitted');
    }
  } finally {
    submitLoading.value = false;
  }
}

function handlePageChange(v: number): void {
  page.value = v;
  fetchList();
}

defineExpose({ open });
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="780px" align-center append-to-body @close="resetBindDialog">
    <div class="bind-dialog-body">
      <div class="bind-search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索协同岗名称"
          :prefix-icon="Search"
          clearable
          style="width: 280px"
          @input="handleSearch"
        />
      </div>

      <!--
        ProTable：
        - row-key + reserve-selection 实现跨页选中
        - :selectable 控制行是否可选（bind 模式禁用 selected，default 模式禁用 disabled）
      -->
      <ProTable
        ref="tableRef"
        :columns="columns"
        :data="list"
        :loading="loading"
        :total="total"
        :page="page"
        :limit="pageSize"
        :show-pagination="false"
        :show-selection="true"
        :selectable="checkSelectable"
        row-key="id"
        @selection-change="handleSelectionChange"
      />

      <div class="pagination-wrap">
        <el-pagination
          background
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" :disabled="selected.length === 0" @click="submitBind">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.bind-dialog-body {
  padding: 0;
}

.bind-search-bar {
  display: flex;
  align-items: center;
  gap: @spacing-sm;
  padding: @spacing-md @spacing-lg;
  border-bottom: 1px solid @color-border;
}

.pagination-wrap {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: @spacing-sm @spacing-md;
  border-top: 1px solid @color-border-panel;
}
</style>
