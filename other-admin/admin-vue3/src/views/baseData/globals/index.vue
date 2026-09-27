<script setup lang="ts">
import { Delete, Edit, MagicStick, Plus, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import GlobalsConfig from './components/globalsConfig.vue';
import { getGlobalsList, deleteGlobals, updateGlobals, type GlobalsItem } from '@/api/dictionary/globals';
import ActionButtons from '@/components/ActionButtons/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import { hasBtnPermission } from '@/composables/usePermission';

defineOptions({ name: 'Globals' });

// useScope: 'global' 确保使用全局 messages（避免找不到 key 显示原始 key）
const { t } = useI18n({ useScope: 'global' });

// 列表状态
const list = ref<GlobalsItem[]>([]);
const listLoading = ref(false);
const listError = ref(false);
const keyword = ref('');
const activeClassify = ref<string | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let listRequestSequence = 0;

// 列定义
const columns = computed<ITableColumn[]>(() => [
  { prop: 'classify', label: '类别', minWidth: 100, align: 'center', slotName: 'classify' },
  { prop: 'rowIndex', label: '序号', width: 80, align: 'center', slotName: 'rowIndex' },
  {
    prop: 'remarkEn',
    label: t('index.list.ConfigurationItem'),
    minWidth: 100,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'name',
    label: t('index.list.ConfigurationParameters'),
    minWidth: 120,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'value',
    label: t('index.operations.configurationValue'),
    minWidth: 120,
    align: 'center',
    showOverflowTooltip: true,
  },
  { prop: 'remark', label: t('index.list.remarks'), minWidth: 100, align: 'center', showOverflowTooltip: true },
  { prop: 'status', label: t('index.list.condition'), minWidth: 60, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

// 权限
const canCreate = computed(() => hasBtnPermission('/admin/globals/create'));
const canUpdate = computed(() => hasBtnPermission('/admin/globals/update'));
const canDelete = computed(() => hasBtnPermission('/admin/globals/delete'));

// 弹窗 ref
const configRef = ref<InstanceType<typeof GlobalsConfig>>();

// 列表中不展示的配置项
const BLACK_LIST = [
  'H5URL',
  'SHOW_331_FEATURE',
  'ICP_SDKSERVER_WS_URI',
  'ICP_ACCOUNT',
  'ICP_PASSWORD',
  'ICP_SDKSERVER_HTTP_HOST',
  'title',
  'FILE_STORAGE_IM',
  'GUANGTIE_430_FEATURE_SWITCH',
  'DBPATH',
  'AI_SEPARATED_DEPLOY',
  'GROUP_AI_FRONTEND_HOST',
];

interface ClassifyOption {
  key: string | null;
  label: string;
  count: number;
}

function getClassify(item: GlobalsItem): string {
  return item.classify?.trim() || '未分类';
}

const classifyOptions = computed<ClassifyOption[]>(() => {
  const counts = new Map<string, number>();
  list.value.forEach((item) => {
    const classify = getClassify(item);
    counts.set(classify, (counts.get(classify) ?? 0) + 1);
  });
  return [
    { key: null, label: '全部', count: list.value.length },
    ...Array.from(counts, ([label, count]) => ({ key: label, label, count })),
  ];
});

const visibleList = computed(() =>
  activeClassify.value === null ? list.value : list.value.filter((item) => getClassify(item) === activeClassify.value),
);

// 获取列表
function getList(): Promise<void> {
  const requestSequence = ++listRequestSequence;
  listLoading.value = true;
  listError.value = false;
  const searchKeyword = keyword.value.trim();
  return getGlobalsList(searchKeyword ? { keyword: searchKeyword } : undefined)
    .then(({ code, data }) => {
      if (requestSequence !== listRequestSequence) return;
      if (code !== 0 || !Array.isArray(data)) {
        listError.value = true;
        return;
      }
      list.value = data.filter((item) => !BLACK_LIST.includes(item.name));
      if (activeClassify.value !== null && !list.value.some((item) => getClassify(item) === activeClassify.value)) {
        activeClassify.value = null;
      }
    })
    .catch(() => {
      if (requestSequence === listRequestSequence) listError.value = true;
    })
    .finally(() => {
      if (requestSequence === listRequestSequence) listLoading.value = false;
    });
}

function scheduleSearch(): void {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTimer = undefined;
    void getList();
  }, 300);
}

function handleSearch(): void {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = undefined;
  void getList();
}

function handleReset(): void {
  keyword.value = '';
  activeClassify.value = null;
  handleSearch();
}

// 新增
function handleCreate(): void {
  configRef.value?.open();
}

// 修改
function handleUpdate(row: GlobalsItem): void {
  configRef.value?.open(row);
}

// 删除
const pendingDeletes = new Set<string>();

async function handleDelete(row: GlobalsItem): Promise<void> {
  if (pendingDeletes.has(row.id)) return;
  pendingDeletes.add(row.id);
  try {
    await ElMessageBox.confirm(t('index.operations.affirmDeleted'), {
      confirmButtonText: t('determine'),
      cancelButtonText: t('cancel'),
      type: 'info',
    });
  } catch {
    pendingDeletes.delete(row.id);
    return;
  }

  deleteGlobals(row.id)
    .then((result) => {
      if (result.code !== 0 || result.data !== 'success') {
        ElMessage.error(result.msg || '删除全局参数失败');
        return;
      }
      ElMessage.success(result.msg || '删除成功');
      return getList();
    })
    .catch(() => {
      ElMessage.error('删除全局参数失败，请重试');
    })
    .finally(() => {
      pendingDeletes.delete(row.id);
    });
}

// 恢复
function resuming(row: GlobalsItem): void {
  updateGlobals({ ...row, status: 0 })
    .then((result) => {
      if (result.code !== 0) {
        ElMessage.error(result.msg || '恢复全局参数失败');
        return;
      }
      return getList();
    })
    .catch(() => {
      ElMessage.error('恢复全局参数失败，请重试');
    });
}

/** 从 ProTable 插槽边界校验全局参数行，兼容库侧未声明 row 的历史类型。 */
function getRow(scope: unknown): GlobalsItem {
  if (typeof scope === 'object' && scope !== null && 'row' in scope && isGlobalsItem(scope.row)) return scope.row;
  return { id: '', name: '', value: '', remark: '', status: 0 };
}

function isGlobalsItem(value: unknown): value is GlobalsItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'value' in value &&
    typeof value.value === 'string' &&
    'remark' in value &&
    typeof value.remark === 'string' &&
    'status' in value &&
    typeof value.status === 'number'
  );
}

function getRowIndex(scope: unknown): string {
  if (typeof scope !== 'object' || scope === null || !('$index' in scope) || typeof scope.$index !== 'number') {
    return '';
  }
  const row = getRow(scope);
  const classify = getClassify(row);
  const visibleClassifies = Array.from(new Set(visibleList.value.map(getClassify)));
  const classifyIndex = visibleClassifies.indexOf(classify) + 1;
  const itemIndex = visibleList.value
    .slice(0, scope.$index + 1)
    .filter((item) => getClassify(item) === classify).length;
  return `${classifyIndex}.${itemIndex}`;
}

/** 按 Vue2 表格行为合并连续相同分类的首列单元格。 */
function getClassifySpan(scope: { row: GlobalsItem; rowIndex: number; columnIndex: number }) {
  if (scope.columnIndex !== 0) return undefined;

  const currentClassify = getClassify(scope.row);
  const previousRow = visibleList.value[scope.rowIndex - 1];
  if (previousRow && getClassify(previousRow) === currentClassify) {
    return { rowspan: 0, colspan: 0 };
  }

  let rowspan = 1;
  for (let index = scope.rowIndex + 1; index < visibleList.value.length; index += 1) {
    if (getClassify(visibleList.value[index]) !== currentClassify) break;
    rowspan += 1;
  }
  return { rowspan, colspan: 1 };
}

onMounted(getList);
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  listRequestSequence += 1;
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <div class="globals-toolbar">
        <div class="globals-search">
          <el-input
            v-model="keyword"
            class="globals-search__input"
            :prefix-icon="Search"
            placeholder="请输入配置项 / 参数名 / 备注 进行搜索"
            aria-label="搜索全局参数"
            clearable
            @input="scheduleSearch"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-tooltip content="搜索" placement="top">
            <el-button type="primary" :icon="Search" aria-label="搜索" @click="handleSearch" />
          </el-tooltip>
          <el-tooltip content="重置筛选" placement="top">
            <el-button :icon="Refresh" aria-label="重置筛选" @click="handleReset" />
          </el-tooltip>
        </div>
        <el-button v-if="canCreate" type="primary" :icon="Plus" @click="handleCreate">
          {{ t('index.operations.Added') }}
        </el-button>
      </div>

      <div v-if="classifyOptions.length > 1" class="classify-chips" role="group" aria-label="全局参数分类">
        <button
          v-for="option in classifyOptions"
          :key="option.key ?? '__all__'"
          type="button"
          class="classify-chip"
          :class="{ 'is-active': activeClassify === option.key }"
          :aria-pressed="activeClassify === option.key"
          @click="activeClassify = option.key"
        >
          <span>{{ option.label }}</span>
          <span class="classify-chip__count">{{ option.count }}</span>
        </button>
      </div>

      <div v-if="listError" class="load-error" role="alert">
        <span>全局参数加载失败，当前数据未更新。</span>
        <el-button type="primary" link @click="getList">重试</el-button>
      </div>

      <ProTable
        :columns="columns"
        :data="visibleList"
        :loading="listLoading"
        :show-pagination="false"
        :table-attrs="{ spanMethod: getClassifySpan }"
      >
        <template #classify="scope">
          {{ getClassify(getRow(scope)) }}
        </template>
        <template #rowIndex="scope">
          {{ getRowIndex(scope) }}
        </template>
        <!-- 状态列：el-tag success/danger -->
        <template #status="scope">
          <el-tag :type="getRow(scope).status === 0 ? 'success' : 'danger'">
            {{ getRow(scope).status === 0 ? t('index.list.normal') : t('index.list.forbidden') }}
          </el-tag>
        </template>

        <!-- 操作列：编辑/删除/恢复 三态 -->
        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: t('index.operations.redact'),
                visible: canUpdate,
                onClick: () => handleUpdate(getRow(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: t('delete'),
                visible: getRow(scope).status === 0 && canDelete,
                onClick: () => handleDelete(getRow(scope)),
              },
              {
                type: 'warning',
                icon: MagicStick,
                label: t('index.operations.restore'),
                visible: getRow(scope).status !== 0 && canUpdate,
                onClick: () => resuming(getRow(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <GlobalsConfig ref="configRef" @refresh="getList" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.globals-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: @spacing-sm;
  padding-bottom: @spacing-md;
}

.globals-search {
  display: flex;
  align-items: center;
  flex: 1 1 360px;
  gap: @spacing-sm;
  min-width: 0;
}

.globals-search__input {
  flex: 1 1 240px;
  max-width: 360px;
  min-width: 140px;
}

.classify-chips {
  display: flex;
  flex-wrap: wrap;
  gap: @spacing-xs;
  margin-bottom: @spacing-md;
}

.classify-chip {
  display: inline-flex;
  align-items: center;
  gap: @spacing-xs;
  min-height: 32px;
  padding: 0 @spacing-sm;
  border: 1px solid @color-border;
  border-radius: @radius-sm;
  background: @color-bg-card;
  color: @color-text-regular;
  cursor: pointer;

  &:hover {
    border-color: @color-primary;
    color: @color-primary;
  }

  &:focus-visible {
    outline: 2px solid @color-primary;
    outline-offset: 2px;
  }

  &.is-active {
    border-color: @color-primary;
    background: @color-primary;
    color: @color-on-primary;
  }
}

.classify-chip__count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.load-error {
  display: flex;
  align-items: center;
  gap: @spacing-sm;
  margin-bottom: @spacing-md;
  color: var(--el-color-danger);
}

@media (max-width: 480px) {
  .globals-toolbar {
    align-items: stretch;
  }

  .globals-search {
    flex-basis: 100%;
    flex-wrap: wrap;
  }

  .globals-search__input {
    flex-basis: 100%;
    max-width: none;
  }

  .globals-toolbar > .el-button {
    align-self: flex-end;
  }
}
</style>
