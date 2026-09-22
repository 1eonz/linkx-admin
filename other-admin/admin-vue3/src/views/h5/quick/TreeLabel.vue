<script setup lang="ts">
/**
 * TreeLabel - 标签编辑
 *
 * 标签树组件：
 * - 标签树（el-tree，default-expand-all + show-checkbox）
 * - 节点操作：新增子节点、编辑、删除（hover 显示操作图标）
 * - 顶部：新增标签（根节点）、批量删除
 * - 新增/编辑弹窗：EditForm
 *
 * 注意：关联协同岗/关联警员（bindCoodForm / bindPoliceForm）属于
 * 标签查看页的能力，本页只负责标签树本身的增删改。
 */
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { onMounted, ref } from 'vue';

import EditForm from './EditForm.vue';
import { labelBatchDelete, labelDelete, labelList, type LabelItem } from '@/api/h5/quick';

defineOptions({ name: 'TreeLabel' });

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeLoading = ref(false);
const treeData = ref<LabelItem[]>([]);
const treeProps = { label: 'name', children: 'children' };

const formRef = ref<InstanceType<typeof EditForm>>();

// 选中的标签数组（用于批量删除）
const selectedLabels = ref<LabelItem[]>([]);

/** 顶层新增标签 */
function handleAddRoot(): void {
  formRef.value?.open('create', null);
}

/** 节点新增子标签 */
function handleAdd(_node: unknown, data: LabelItem): void {
  // 限制：当前标签关联了协同岗无法添加子标签
  // 简化实现：直接打开弹窗
  formRef.value?.open('create', data);
}

/** 节点编辑 */
function handleEdit(_node: unknown, data: LabelItem): void {
  formRef.value?.open('update', data);
}

/** 节点删除（单条，二次确认） */
function handleDelete(_node: unknown, data: LabelItem): void {
  if (!data.id) return;
  ElMessageBox.confirm(`确定删除标签「${data.name ?? ''}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await labelDelete(String(data.id));
        if (res.code !== 0) {
          ElMessage.error(res.msg ?? '删除失败，请重试');
          return;
        }
        ElMessage.success('删除成功');
        fetchTree();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败，请重试');
      }
    })
    .catch(() => {
      // 取消删除，忽略
    });
}

/** 批量删除 */
function handleBatchDelete(): void {
  if (selectedLabels.value.length === 0) {
    ElMessage.warning('请先选择要删除的标签');
    return;
  }
  ElMessageBox.confirm('确定要删除选中的标签吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const ids = selectedLabels.value
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id))
          .map(String);
        const res = await labelBatchDelete(ids);
        if (res.code !== 0) {
          ElMessage.error(res.msg ?? '删除失败，请重试');
          return;
        }
        ElMessage.success('删除成功');
        selectedLabels.value = [];
        fetchTree();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败，请重试');
      }
    })
    .catch(() => {
      // 取消删除，忽略
    });
}

/** 勾选状态变化：获取所有完全选中的节点 */
function handleCheckChange(): void {
  if (!treeRef.value) {
    selectedLabels.value = [];
    return;
  }
  // getCheckedNodes(false, false) 返回所有完全选中的节点（含父和叶子）
  selectedLabels.value = treeRef.value.getCheckedNodes(false, false) as LabelItem[];
}

/** 拉取标签树 */
async function fetchTree(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await labelList();
    treeData.value = (res.data ?? []) as LabelItem[];
  } catch {
    ElMessage.error('加载标签树失败');
  } finally {
    treeLoading.value = false;
  }
}

/** 表单提交成功后刷新 */
function handleSuccess(): void {
  fetchTree();
}

onMounted(() => {
  fetchTree();
});

// 暴露给父组件
defineExpose({ getList: fetchTree });
</script>

<template>
  <div class="tree-label">
    <div class="action-bar">
      <el-button type="primary" :icon="Plus" @click="handleAddRoot">新增标签</el-button>
      <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <div v-loading="treeLoading" class="tree-container">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="id"
        default-expand-all
        show-checkbox
        :check-strictly="true"
        empty-text="暂无标签数据"
        @check-change="handleCheckChange"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <span class="node-label" :title="node.label">{{ node.label }}</span>
            <span class="operator">
              <el-icon class="op-icon op-add" @click.stop="handleAdd(node, data as LabelItem)">
                <Plus />
              </el-icon>
              <el-icon class="op-icon op-edit" @click.stop="handleEdit(node, data as LabelItem)">
                <Edit />
              </el-icon>
              <el-icon class="op-icon op-delete" @click.stop="handleDelete(node, data as LabelItem)">
                <Delete />
              </el-icon>
            </span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 新增/编辑弹窗 -->
    <EditForm ref="formRef" @success="handleSuccess" />
  </div>
</template>

<style lang="less" scoped>
.tree-label {
  padding: 12px;
}

.action-bar {
  margin-bottom: 16px;
}

.tree-container {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  padding-right: 8px;

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .operator {
    margin-left: 12px;
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 12px;

    .op-icon {
      cursor: pointer;
      font-size: 16px;

      &.op-add,
      &.op-edit {
        color: @color-primary;
      }

      &.op-delete {
        color: @color-danger;
      }
    }
  }

  &:hover .operator {
    opacity: 1;
  }
}

:deep(.el-tree-node__content) {
  height: 32px;
  line-height: 32px;
}
</style>
