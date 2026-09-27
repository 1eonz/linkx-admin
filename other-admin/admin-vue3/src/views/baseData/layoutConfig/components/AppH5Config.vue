<script setup lang="ts">
/**
 * AppH5Config - App H5 板块设置
 *
 * 功能特性：
 * 1. ProTable 板块列表（受控模式：name/show/type/url/sort/操作）
 * 2. 板块类型映射：1=轮播图/2=常用应用/3=协同群组/4=三方网页/5=分割条/6=消息列表
 * 3. 新增/编辑弹窗使用 createDialog（EditSectionModal 组件）
 * 4. 删除二次确认
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import EditSectionModal from './EditSectionModal.vue';
import {
  createSection,
  deleteSection,
  getSectionList,
  updateSection,
  type LayoutSection,
  type LayoutSectionType,
} from '@/api/baseData/layoutConfig';
import ActionButtons from '@/components/ActionButtons/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import SectionTitle from '@/components/SectionTitle/index.vue';
import { createDialog } from '@/utils/createDialog';

defineOptions({ name: 'AppH5Config' });

// ===== 受控模式状态 =====
const list = ref<LayoutSection[]>([]);
const listLoading = ref(false);
const listReady = ref(false);
const loadError = ref(false);
const operating = ref(false);

// 板块类型映射
const sectionTypeMap: Record<LayoutSectionType, string> = {
  1: '轮播图',
  2: '常用应用',
  3: '协同群组',
  4: '三方网页',
  5: '分割条',
  6: '消息列表',
};

// 列定义
const columns = computed(() => [
  { prop: 'name', label: '板块名称', minWidth: 120, align: 'center' as const, showOverflowTooltip: true },
  { prop: 'type', label: '板块类型', minWidth: 100, align: 'center' as const, slotName: 'type' },
  { prop: 'url', label: '跳转 URL', minWidth: 160, align: 'center' as const, showOverflowTooltip: true },
  { prop: 'sort', label: '排序', minWidth: 80, align: 'center' as const },
  { prop: 'show', label: '是否显示', minWidth: 80, align: 'center' as const, slotName: 'show' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right' as const,
    width: 200,
    align: 'center' as const,
    slotName: 'actions',
  },
]);

// createDialog 弹窗工厂
const sectionDialog = createDialog<LayoutSection>(EditSectionModal, {
  title: '板块编辑',
  width: '600px',
});

// 获取板块列表
function getList(): Promise<void> {
  listLoading.value = true;
  listReady.value = false;
  loadError.value = false;
  return getSectionList({ show: -1 })
    .then((res) => {
      if (res.code !== 0 || !Array.isArray(res.data)) {
        throw new Error(res.msg || '板块列表响应无效');
      }
      list.value = res.data;
      listReady.value = true;
    })
    .catch(() => {
      loadError.value = true;
      ElMessage.error('板块列表加载失败，请重试');
    })
    .finally(() => {
      listLoading.value = false;
    });
}

// 新增板块
async function handleCreate(): Promise<void> {
  if (!listReady.value || listLoading.value || operating.value) return;
  try {
    const result = await sectionDialog();
    if (!listReady.value || listLoading.value || operating.value) return;
    operating.value = true;
    createSection(result)
      .then((res) => {
        if (res.code === 0) {
          ElMessage.success('新增成功');
          return getList();
        } else {
          ElMessage.error(res.msg || '新增失败');
        }
      })
      .catch(() => {
        ElMessage.error('新增失败');
      })
      .finally(() => {
        operating.value = false;
      });
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
  }
}

// 编辑板块
async function handleEdit(row: LayoutSection): Promise<void> {
  if (!listReady.value || listLoading.value || operating.value) return;
  try {
    const result = await sectionDialog({ props: { initialData: row } });
    if (!listReady.value || listLoading.value || operating.value) return;
    const sectionId = row.id;
    if (!sectionId) {
      ElMessage.error('板块 ID 缺失，无法更新');
      return;
    }
    operating.value = true;
    updateSection(sectionId, result)
      .then((res) => {
        if (res.code === 0) {
          ElMessage.success('更新成功');
          return getList();
        } else {
          ElMessage.error(res.msg || '更新失败');
        }
      })
      .catch(() => {
        ElMessage.error('更新失败');
      })
      .finally(() => {
        operating.value = false;
      });
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
  }
}

// 删除板块
function handleDelete(row: LayoutSection): void {
  if (!listReady.value || listLoading.value || operating.value) return;
  ElMessageBox.confirm('确定要删除该板块吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      if (!listReady.value || listLoading.value || operating.value) return;
      if (!row.id) {
        ElMessage.error('板块 ID 缺失，无法删除');
        return;
      }
      operating.value = true;
      deleteSection(row.id)
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success('删除成功');
            return getList();
          } else {
            ElMessage.error(res.msg || '删除失败');
          }
        })
        .catch(() => {
          ElMessage.error('删除失败');
        })
        .finally(() => {
          operating.value = false;
        });
    })
    .catch(() => {});
}

/** 获取板块类型显示文本 */
function getTypeText(type: LayoutSectionType): string {
  return sectionTypeMap[type] ?? '未知';
}

/** 仅把含完整板块字段的表格行传入操作回调。 */
function isLayoutSection(value: unknown): value is LayoutSection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.name === 'string' &&
    [1, 2, 3, 4, 5, 6].includes(Number(row.type)) &&
    [0, 1].includes(Number(row.show)) &&
    Number.isFinite(Number(row.sort))
  );
}

function getRow(scope: unknown): LayoutSection {
  if (!scope || typeof scope !== 'object' || !('row' in scope) || !isLayoutSection(scope.row)) {
    return { name: '', type: 1, show: 0, sort: 0 };
  }
  return scope.row;
}

onMounted(getList);
</script>

<template>
  <div class="app-h5-config">
    <!-- 标题 -->
    <SectionTitle title="板块列表" variant="border" />

    <!-- 操作区 -->
    <div class="actions-bar">
      <el-button type="primary" :icon="Plus" :disabled="!listReady || listLoading || operating" @click="handleCreate">
        新增板块
      </el-button>
    </div>

    <div v-if="loadError" class="load-error" role="alert">
      板块列表加载失败，请重试。
      <el-button link type="primary" :disabled="listLoading" @click="getList">重试</el-button>
    </div>

    <ProTable :columns="columns" :data="list" :loading="listLoading" :show-pagination="false">
      <!-- 板块类型 -->
      <template #type="scope">
        <el-tag :type="getRow(scope).type === 4 ? 'warning' : 'info'">
          {{ getTypeText(getRow(scope).type) }}
        </el-tag>
      </template>

      <!-- 是否显示 -->
      <template #show="scope">
        <el-tag :type="getRow(scope).show === 1 ? 'success' : 'danger'">
          {{ getRow(scope).show === 1 ? '显示' : '隐藏' }}
        </el-tag>
      </template>

      <!-- 操作列 -->
      <template #actions="scope">
        <ActionButtons
          :buttons="[
            {
              type: 'primary',
              icon: Edit,
              label: '编辑',
              disabled: !listReady || listLoading || operating,
              onClick: () => handleEdit(getRow(scope)),
            },
            {
              type: 'danger',
              icon: Delete,
              label: '删除',
              disabled: !listReady || listLoading || operating,
              onClick: () => handleDelete(getRow(scope)),
            },
          ]"
        />
      </template>
    </ProTable>
  </div>
</template>

<style lang="less" scoped>
.app-h5-config {
  padding: 20px;

  .actions-bar {
    padding-bottom: 16px;
  }

  .load-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: var(--el-color-danger);
  }
}
</style>
