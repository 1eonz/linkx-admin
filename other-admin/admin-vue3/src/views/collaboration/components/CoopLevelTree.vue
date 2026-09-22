<script setup lang="ts">
import { Delete, Edit, Files, More, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { onMounted, ref } from 'vue';

import CoopNodeDialog, { type CoopNodeDialogInstance } from './CoopNodeDialog.vue';

defineOptions({ name: 'CoopLevelTree' });

/** 树节点数据（协同岗层级/职能分类通用） */
export interface CoopTreeNode {
  id: string;
  name: string;
  hasChildren?: boolean;
  isLeaf?: boolean;
  [key: string]: unknown;
}

/** el-tree Node 实例（仅用必要字段；用 unknown 中转兼容 Element Plus 内部 Node 类型） */
interface TreeNodeInstance {
  id: string | number;
  level: number;
  isLeaf?: boolean;
  expanded: boolean;
  loaded: boolean;
  data: CoopTreeNode;
  parent: TreeNodeInstance | null;
  expand(): void;
  collapse(): void;
}

/** 提交回调类型 */
type SubmitHandler = (
  type: 'create' | 'edit',
  name: string,
  parentData: CoopTreeNode | null,
  editData: CoopTreeNode | null,
) => Promise<boolean>;

const props = withDefaults(
  defineProps<{
    /** 业务命名空间：'level' | 'function'，控制文案 */
    businessName: 'level' | 'function';
    /** 拉取子节点 API（依赖反转：让组件不耦合具体接口） */
    fetchChildren: (parentId: string | number) => Promise<{ data?: CoopTreeNode[] }>;
    /** 创建节点 API */
    createNode: (data: { name: string; parentId: string | number }) => Promise<{ code: number; msg?: string }>;
    /** 更新节点 API */
    updateNode: (id: string, data: { name: string }) => Promise<{ code: number; msg?: string }>;
    /** 删除节点 API */
    deleteNode: (id: string) => Promise<{ code: number; msg?: string }>;
    /** 最大层级深度，默认 5 */
    maxDepth?: number;
    /**
     * 新增/编辑弹窗提交回调（依赖反转，由外部 CoopLevelTree 父组件注入业务逻辑）
     * 返回 true 关闭弹窗，false 保持
     */
    onSubmit: SubmitHandler;
  }>(),
  {
    maxDepth: 5,
  },
);

const emit = defineEmits<{
  /** 节点被点击时触发（同时会展开/收起子节点） */
  (e: 'node-click', data: CoopTreeNode, node: TreeNodeInstance): void;
  /** 节点删除完成后触发，通知父组件刷新右侧表格 */
  (e: 'node-deleted', deletedId: string): void;
}>();

/** 业务文案映射 */
const TEXTS = {
  level: {
    title: '层级结构',
    empty: '暂无层级数据',
    addRoot: '新增层级',
    addChild: '添加子层级',
    edit: '编辑层级',
    delete: '删除层级',
    dialogTitle: (type: 'create' | 'edit') => (type === 'create' ? '新增层级' : '编辑层级'),
    nameLabel: '层级名称',
    namePlaceholder: '请输入层级名称',
    parentLabel: '父层级',
    depthError: '创建层级深度不能超过5层',
    createSuccess: '层级创建成功',
    updateSuccess: '层级更新成功',
    deleteSuccess: '层级删除成功',
    deleteConfirm: (name: string) => `确定删除层级「${name}」？删除后将无法恢复。`,
    deleteTitle: '删除确认',
    loadRootError: '加载层级结构失败',
    loadChildrenError: '加载子层级失败',
  },
  function: {
    title: '职能部门',
    empty: '暂无职能数据',
    addRoot: '新增职能',
    addChild: '添加子职能',
    edit: '编辑职能',
    delete: '删除职能',
    dialogTitle: (type: 'create' | 'edit') => (type === 'create' ? '新增职能' : '编辑职能'),
    nameLabel: '职能名称',
    namePlaceholder: '请输入职能名称',
    parentLabel: '父职能',
    depthError: '创建职能深度不能超过5层',
    createSuccess: '职能创建成功',
    updateSuccess: '职能更新成功',
    deleteSuccess: '职能删除成功',
    deleteConfirm: (name: string) => `确定删除职能「${name}」？删除后将无法恢复。`,
    deleteTitle: '删除确认',
    loadRootError: '加载职能结构失败',
    loadChildrenError: '加载子职能失败',
  },
};

const ROOT_LEVEL_ID = 0;

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeLoading = ref(false);
const treeData = ref<CoopTreeNode[]>([]);
const treeProps = { label: 'name', children: 'children', isLeaf: 'isLeaf' };
const openDropdownId = ref<string | null>(null);

const nodeDialogRef = ref<CoopNodeDialogInstance>();

const texts = getTexts();

function getTexts() {
  return TEXTS[props.businessName];
}

/** 统一格式化节点数据：只有明确返回 false 才是叶子 */
function normalizeNodes(list: CoopTreeNode[]): CoopTreeNode[] {
  return list.map((item) => ({ ...item, isLeaf: item.hasChildren === false }));
}

/** 首次加载根节点 */
async function fetchRootNodes(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await props.fetchChildren(ROOT_LEVEL_ID);
    treeData.value = normalizeNodes(res.data ?? []);
  } catch {
    ElMessage.error(texts.loadRootError);
  } finally {
    treeLoading.value = false;
  }
}

/** el-tree 懒加载子节点 */

async function loadTreeNode(node: any, resolve: (data: CoopTreeNode[]) => void): Promise<void> {
  if (node.level === 0) {
    resolve(treeData.value);
    return;
  }
  try {
    const res = await props.fetchChildren(node.data.id);
    resolve(normalizeNodes(res.data ?? []));
  } catch {
    resolve([]);
    ElMessage.error(texts.loadChildrenError);
  }
}

/** 点击节点：触发父组件加载右侧 + 展开/收起 */
function handleNodeClick(data: CoopTreeNode, node: TreeNodeInstance): void {
  emit('node-click', data, node);
  if (!node.isLeaf) {
    if (node.expanded) {
      node.collapse();
    } else {
      node.expand();
    }
  }
}

/** 树节点 dropdown 菜单显隐 */
function handleDropdownVisibleChange(visible: boolean, nodeId: string): void {
  openDropdownId.value = visible ? nodeId : null;
}

/** dropdown 命令派发 */
function handleNodeCommand(command: string, node: TreeNodeInstance, data: CoopTreeNode): void {
  switch (command) {
    case 'addChild':
      openNodeDialog('create', data);
      break;
    case 'edit':
      openNodeDialog('edit', data);
      break;
    case 'delete':
      confirmDeleteNode(node, data);
      break;
    default:
      break;
  }
}

/** 打开新增/编辑弹窗 */
function openNodeDialog(type: 'create' | 'edit', data: CoopTreeNode | null): void {
  nodeDialogRef.value?.open(type, data);
}

/** 刷新指定父节点的子列表 */
function refreshNodeChildren(parentData: CoopTreeNode): void {
  if (!treeRef.value) return;
  const parentNode = treeRef.value.getNode(parentData.id) as unknown as TreeNodeInstance | null;
  if (parentNode) {
    // 标记为未加载，触发懒加载重新请求
    parentNode.loaded = false;
    parentNode.collapse();
    parentNode.expand();
  }
}

/** 节点弹窗提交回调 */
const handleNodeDialogSubmit: SubmitHandler = async (type, name, parentData, editData) => {
  try {
    if (type === 'create') {
      // 层级深度限制
      if (parentData && treeRef.value) {
        const parentNode = treeRef.value.getNode(parentData.id) as unknown as TreeNodeInstance | null;
        if (parentNode && parentNode.level >= props.maxDepth) {
          ElMessage.error(texts.depthError);
          return false;
        }
      }
      const parentId = parentData ? parentData.id : ROOT_LEVEL_ID;
      const res = await props.createNode({ name, parentId });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '创建失败，请重试');
        return false;
      }
      ElMessage.success(texts.createSuccess);
      if (!parentData) {
        await fetchRootNodes();
      } else {
        refreshNodeChildren(parentData);
      }
    } else if (editData) {
      const res = await props.updateNode(editData.id, { name });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '更新失败，请重试');
        return false;
      }
      ElMessage.success(texts.updateSuccess);
      // 同步更新节点显示名称
      editData.name = name;
    }
    return true;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '操作失败，请重试');
    return false;
  }
};

/** 二次确认删除节点 */
function confirmDeleteNode(node: TreeNodeInstance, data: CoopTreeNode): void {
  ElMessageBox.confirm(texts.deleteConfirm(data.name), texts.deleteTitle, {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await props.deleteNode(data.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除失败，请重试');
          return;
        }
        ElMessage.success(texts.deleteSuccess);
        // 通知父组件：节点已被删除，清空右侧
        emit('node-deleted', data.id);

        // 根节点（level === 1）重拉整棵树，否则只刷新父节点
        if (node.level === 1) {
          await fetchRootNodes();
        } else if (node.parent) {
          refreshNodeChildren(node.parent.data);
        }
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败，请重试');
      }
    })
    .catch(() => {
      // 取消删除，忽略
    });
}

onMounted(() => {
  fetchRootNodes();
});

defineExpose({
  /** 刷新整棵树 */
  fetchRootNodes,
  /** 刷新指定父节点子列表 */
  refreshNodeChildren,
});
</script>

<template>
  <div class="level-tree-panel">
    <div class="panel-header">
      <span class="panel-title">{{ texts.title }}</span>
    </div>

    <div class="tree-body">
      <el-tree
        ref="treeRef"
        class="level-tree"
        node-key="id"
        :data="treeData"
        :props="treeProps"
        :load="loadTreeNode"
        lazy
        highlight-current
        :expand-on-click-node="false"
        :empty-text="treeLoading ? '' : texts.empty"
        @node-click="(data, node) => handleNodeClick(data as CoopTreeNode, node as unknown as TreeNodeInstance)"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <el-icon class="node-folder-icon"><Files /></el-icon>
            <span class="node-label" :title="(data as CoopTreeNode).name">{{ (data as CoopTreeNode).name }}</span>
            <el-dropdown
              class="node-more"
              :class="{ 'is-open': openDropdownId === (data as CoopTreeNode).id }"
              trigger="click"
              placement="bottom-end"
              @visible-change="(visible: boolean) => handleDropdownVisibleChange(visible, (data as CoopTreeNode).id)"
              @command="(cmd: string) => handleNodeCommand(cmd, node as TreeNodeInstance, data as CoopTreeNode)"
            >
              <span class="node-more-icon" @click.stop>
                <el-icon><More /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="addChild" :icon="Plus">{{ texts.addChild }}</el-dropdown-item>
                  <el-dropdown-item command="edit" :icon="Edit">{{ texts.edit }}</el-dropdown-item>
                  <el-dropdown-item command="delete" :icon="Delete" class="dropdown-item--danger">
                    {{ texts.delete }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-tree>
    </div>

    <div class="tree-add-root">
      <el-button type="primary" :icon="Plus" style="width: 100%" @click="openNodeDialog('create', null)">
        {{ texts.addRoot }}
      </el-button>
    </div>

    <!-- 新增 / 编辑 弹窗 -->
    <CoopNodeDialog
      ref="nodeDialogRef"
      :title="texts.dialogTitle"
      :name-label="texts.nameLabel"
      :name-placeholder="texts.namePlaceholder"
      :parent-label="texts.parentLabel"
      :on-submit="handleNodeDialogSubmit"
    />
  </div>
</template>

<style lang="less" scoped>
.level-tree-panel {
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  overflow: hidden;
  flex-shrink: 0;
  margin: @spacing-sm 0 @spacing-sm @spacing-sm;
  min-width: 180px;
  max-width: 480px;
  transition: width 0s;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: @panel-header-height;
  padding: 0 14px;
  border-bottom: 1px solid @color-border-panel;
  flex-shrink: 0;
  background: @color-bg-card;
}

.panel-title {
  font-size: @font-size-md;
  font-weight: 600;
  color: @color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: @radius-xs;
    background: @color-scrollbar-thumb-strong;
  }
}

.level-tree {
  width: 100%;
}

// 自定义树节点
.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  font-size: @font-size-sm;
  overflow: hidden;

  .node-folder-icon {
    flex-shrink: 0;
    margin-right: 6px;
    font-size: @font-size-md-plus;
    color: @color-icon-folder;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  // more 图标：默认隐藏
  .node-more {
    flex-shrink: 0;
    visibility: hidden;
    margin-left: 4px;

    // dropdown 展开时：强制显示 + 高亮背景
    &.is-open {
      visibility: visible;

      .node-more-icon {
        background: @color-bg-hover;
      }
    }
  }

  // hover 整行时显示 more 图标
  &:hover .node-more {
    visibility: visible;
  }

  .node-more-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: @radius-sm;
    cursor: pointer;
    color: @color-icon-muted;
    transform: rotate(90deg);

    &:hover {
      background: @color-border-panel;
      color: @color-primary;
    }
  }
}

// 选中节点高亮
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: @color-primary-light-9;
  color: @color-primary;
  font-weight: 600;

  .node-folder-icon {
    color: @color-primary;
  }
}

// dropdown 菜单项图标统一对齐
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;

  .el-icon {
    margin-right: 6px;
    flex-shrink: 0;
  }
}

// 节点高度
:deep(.el-tree-node__content) {
  height: 32px;
  line-height: 32px;
  border-radius: @radius-xs;
}

.tree-add-root {
  flex-shrink: 0;
  padding: 10px 12px;
  border-top: 1px solid @color-border-panel;
  background: @color-bg-card;
}

// 删除项红色样式
.dropdown-item--danger {
  color: @color-danger;
}
</style>
