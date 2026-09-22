<script setup lang="ts">
/**
 * thirdInterface/southInterface/index.vue - 三方对接 - 南向对接主页面
 *
 * 南向应用管理：
 * 1. ProTable 受控模式 + SearchBar 搜索栏
 * 2. 列表展示：名称/所属系统/系统编码/唯一标识/应用类型/展示范围/访问IP/端口/执行周期/创建时间
 * 3. 操作：详情/编辑/映射字段/删除（4 个按钮）
 * 4. AppsManageMapperModal @save 触发 handleMapperSave 调用 updateCallableAppMapper
 * 5. 分页参数使用 page/pageSize
 */
import { Plus, View, Edit, Delete, Connection } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import AppsManageDetailModal from './components/AppsManageDetailModal.vue';
import AppsManageEditModal from './components/AppsManageEditModal.vue';
import AppsManageMapperModal from './components/AppsManageMapperModal.vue';
import {
  deleteCallableApp,
  getCallableAppList,
  updateCallableAppMapper,
  type CallableApp,
} from '@/api/thirdInterface/southInterface';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'SouthInterface' });

// ===== 受控模式状态 =====
const list = ref<CallableApp[]>([]);
const total = ref(0);
// 注意：分页参数使用 page/pageSize（非 pageNum/pageSize）
const searchParams = reactive<Record<string, unknown>>({
  page: 1,
  pageSize: 10,
  name: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const editRef = ref<InstanceType<typeof AppsManageEditModal>>();
const mapperRef = ref<InstanceType<typeof AppsManageMapperModal>>();
const detailRef = ref<InstanceType<typeof AppsManageDetailModal>>();

// ===== 类型映射 =====
const typeMap: Record<number, string> = {
  1: 'RESTful接口',
  2: '数据库',
};

const scopeMap: Record<number, string> = {
  0: '全部',
  1: 'PC端',
  2: '移动端',
};

// ===== 列定义 =====
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '名称', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'systemName', label: '所属系统', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'systemCode', label: '系统编码', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'uniqueId', label: '唯一标识', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'type', label: '应用类型', width: 110, align: 'center', slotName: 'type' },
  { prop: 'scope', label: '展示范围', width: 110, align: 'center', slotName: 'scope' },
  { prop: 'ip', label: '访问IP', minWidth: 130, align: 'center', showOverflowTooltip: true },
  { prop: 'port', label: '端口', width: 100, align: 'center' },
  { prop: 'period', label: '执行周期', width: 110, align: 'center', slotName: 'period' },
  { prop: 'gmtCreated', label: '创建时间', width: 170, align: 'center', showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 320,
    align: 'center',
    slotName: 'actions',
  },
]);

const actions = computed(() => [{ label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

const searchPlaceholder = computed(() => '请输入应用名称');

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as CallableApp[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// ===== 操作 =====
function handleCreate(): void {
  editRef.value?.open('create');
}

// 编辑：传整个 row
function handleUpdate(row: CallableApp): void {
  editRef.value?.open('update', row);
}

// 映射字段：type + row
function handleMapper(row: CallableApp): void {
  mapperRef.value?.open('update', row);
}

// 详情：传整个 row
function handleDetail(row: CallableApp): void {
  detailRef.value?.open(row);
}

function handleDelete(row: CallableApp): void {
  ElMessageBox.confirm(`确认删除应用「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteCallableApp(row.id)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('删除成功');
            tableRef.value?.refresh();
          } else {
            ElMessage.error(result.msg ?? '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// ===== 字段映射保存 =====
async function handleMapperSave(data: { mapper: string; id?: string; row?: CallableApp }): Promise<void> {
  const id = data.id ?? data.row?.id;
  if (!id) {
    ElMessage.error('缺少应用ID');
    return;
  }
  try {
    const { code, msg } = await updateCallableAppMapper(id, { mapper: data.mapper });
    if (code === 0) {
      ElMessage.success('映射配置保存成功');
      tableRef.value?.refresh();
    } else {
      ElMessage.error(msg ?? '保存映射配置失败');
    }
  } catch {
    ElMessage.error('保存映射配置失败');
  }
}

/** 执行周期格式化：>=60 显示小时 */
function formatPeriod(period: number | string | undefined): string {
  if (!period) return '-';
  const minutes = Number(period);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}小时`;
  }
  return `${minutes}分钟`;
}

/** 从 ProTable slot scope 中安全获取 CallableApp */
function getRow(scope: any): CallableApp {
  return (scope?.row as CallableApp) ?? ({} as CallableApp);
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <el-input
            v-model="searchParams.name as string"
            :placeholder="searchPlaceholder"
            class="filter-item"
            style="width: 220px"
            clearable
            @keyup.enter="handleSearch"
          />
        </template>
      </SearchBar>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getCallableAppList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        page-num-field="page"
        @response="handleResponse"
      >
        <!-- 应用类型列 -->
        <template #type="scope">
          <el-tag :type="getRow(scope).type === 1 ? 'success' : 'warning'">
            {{ typeMap[getRow(scope).type] ?? '-' }}
          </el-tag>
        </template>

        <!-- 展示范围列 -->
        <template #scope="scope">
          {{ scopeMap[getRow(scope).scope] ?? '-' }}
        </template>

        <!-- 执行周期列 -->
        <template #period="scope">
          {{ formatPeriod(getRow(scope).period) }}
        </template>

        <!-- 操作列 -->
        <template #actions="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: View, label: '详情', onClick: () => handleDetail(getRow(scope)) },
              { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
              { type: 'primary', icon: Connection, label: '映射字段', onClick: () => handleMapper(getRow(scope)) },
              { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <AppsManageEditModal ref="editRef" @success="tableRef?.refresh()" />
    <AppsManageMapperModal ref="mapperRef" @save="handleMapperSave" />
    <AppsManageDetailModal ref="detailRef" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
}
</style>
