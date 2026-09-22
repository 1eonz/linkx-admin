<script setup lang="ts">
/**
 * 后台权限管理（只读展示）
 *
 * 功能：
 * - 展示当前用户有权限的后台菜单树（只读，无编辑）
 * - 支持按菜单名实时搜索过滤
 * - 刷新按钮重新加载菜单数据
 *
 * 数据来源：
 * - 菜单树：getMenuList({ applicationId: '' })，applicationId 为空表示获取全部后台菜单
 * - 权限过滤：useUserStore().permissions.menus（登录时缓存的菜单 ID 列表）
 *
 * 过滤规则：
 * 1. 节点有权限 → 保留节点及其有权限的子节点
 * 2. 节点无权限但有子节点有权限 → 保留父节点作为容器
 * 3. 节点及其所有子节点都无权限 → 完全过滤掉
 */
import { Search, Refresh, Folder, CaretRight, CaretBottom } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { ElTree } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';

import type { MenuItem } from '#/menu';
import { getMenuList } from '@/api/permission/menu';
import { useUserStore } from '@/store/modules/useUserStore';

defineOptions({ name: 'AdminPermission' });

const userStore = useUserStore();

// ===== 状态 =====
const searchText = ref('');
const treeLoading = ref(false);
const allMenuTree = ref<MenuItem[]>([]);
const filteredTreeData = ref<MenuItem[]>([]);
const treeRef = ref<InstanceType<typeof ElTree>>();

// ===== 计算属性 =====
/** 空状态判断 */
const isEmpty = computed(() => !treeLoading.value && filteredTreeData.value.length === 0);

// ===== 监听搜索 =====
watch(searchText, (val) => {
  treeRef.value?.filter(val);
});

// ===== 加载菜单树 =====
async function loadMenuTree(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await getMenuList({ applicationId: '' });
    if (res.code === 0) {
      allMenuTree.value = (res.data ?? []) as MenuItem[];
      filterMenuByPermissions();
    }
  } catch {
    ElMessage.error('加载菜单树失败');
  } finally {
    treeLoading.value = false;
  }
}

/**
 * 根据用户权限过滤菜单树
 * 权限数据来源：useUserStore().permissions.menus（登录时缓存）
 */
function filterMenuByPermissions(): void {
  const permittedMenuIds = new Set(userStore.permissions.menus ?? []);
  filteredTreeData.value = filterTree(allMenuTree.value, permittedMenuIds);
}

/** 递归过滤菜单树 */
function filterTree(nodes: MenuItem[], permittedIds: Set<string>): MenuItem[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes.reduce<MenuItem[]>((result, node) => {
    const hasPermission = permittedIds.has(node.id);
    if (hasPermission) {
      // 节点有权限，保留该节点
      const filteredNode: MenuItem = { ...node };
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children, permittedIds);
        if (filteredChildren.length > 0) {
          filteredNode.children = filteredChildren;
        } else {
          filteredNode.children = null;
        }
      }
      result.push(filteredNode);
    } else {
      // 节点无权限，但检查子节点是否有权限
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children, permittedIds);
        if (filteredChildren.length > 0) {
          // 子节点有权限，保留父节点作为容器
          result.push({ ...node, children: filteredChildren });
        }
      }
    }
    return result;
  }, []);
}

// ===== 树节点交互 =====
/** 判断节点是否有子节点 */
function hasChildren(data: MenuItem): boolean {
  return !!(data.children && data.children.length > 0);
}

/** el-tree 过滤方法 */
function filterNode(value: string, data: MenuItem): boolean {
  if (!value) return true;
  return data.name.includes(value);
}

/** 兼容 el-tree FilterNodeMethodFunction 类型 */
const filterNodeMethod = filterNode as never;

/** 刷新数据 */
async function refreshData(): Promise<void> {
  await loadMenuTree();
  ElMessage.success('刷新成功');
}

// ===== 初始化 =====
onMounted(() => {
  loadMenuTree();
});
</script>

<template>
  <div class="app-container">
    <!-- 顶部搜索栏 -->
    <el-card shadow="always" class="header-card">
      <div class="header-section">
        <div class="header-left">
          <el-icon class="title-icon"><Folder /></el-icon>
          <h2 class="page-title">后台权限管理</h2>
        </div>
        <div class="filter-section">
          <el-input
            v-model="searchText"
            placeholder="搜索菜单名称"
            :prefix-icon="Search"
            clearable
            style="width: 250px"
          />
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" circle class="refresh-btn" @click="refreshData" />
          </el-tooltip>
        </div>
      </div>
    </el-card>

    <!-- 菜单树展示 -->
    <el-card v-loading="treeLoading" shadow="always" class="tree-card">
      <el-tree
        ref="treeRef"
        class="permission-tree"
        node-key="id"
        :data="filteredTreeData"
        :props="{ children: 'children', label: 'name' }"
        :expand-on-click-node="false"
        :highlight-current="true"
        :filter-node-method="filterNodeMethod"
        default-expand-all
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <!-- 自定义展开/折叠图标 -->
            <el-icon
              v-if="hasChildren(data)"
              class="custom-expand-icon"
              @click.stop="node.expanded ? node.collapse() : node.expand()"
            >
              <CaretBottom v-if="node.expanded" />
              <CaretRight v-else />
            </el-icon>
            <span v-else class="expand-placeholder" />

            <!-- 菜单图标（仅当有 icon 字段时显示） -->
            <i v-if="data.imgurl" class="menu-icon" />

            <!-- 菜单名称 -->
            <span class="menu-name" :title="data.name">{{ data.name }}</span>

            <!-- 菜单路径标签 -->
            <el-tag v-if="data.url" size="small" type="info" class="menu-path-tag">
              {{ data.url }}
            </el-tag>
          </span>
        </template>
      </el-tree>

      <!-- 空状态 -->
      <div v-if="isEmpty" class="empty-state">
        <el-icon class="empty-icon"><Folder /></el-icon>
        <p class="empty-text">暂无权限数据</p>
        <p class="empty-sub">请检查配置或联系管理员</p>
      </div>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.header-card {
  flex-shrink: 0;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .title-icon {
      font-size: 22px;
      color: @color-primary;
    }

    .page-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: @color-text-primary;
    }
  }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 10px;

    .refresh-btn {
      transition: transform 0.3s ease;

      &:hover {
        transform: rotate(180deg);
      }
    }
  }
}

.tree-card {
  flex: 1;
  overflow-y: auto;

  .permission-tree {
    :deep(.el-tree-node__content) {
      height: 40px;
      padding: 5px 0;
      border-radius: 4px;
      margin-bottom: 2px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: @color-bg-page;
      }
    }

    :deep(.el-tree-node__expand-icon) {
      display: none;
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: @color-primary-light-9;
      color: @color-primary;
      font-weight: 500;
    }
  }

  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 14px;

    .custom-expand-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      font-size: 14px;
      color: @color-text-secondary;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: @color-primary;
        transform: scale(1.2);
      }
    }

    .expand-placeholder {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      display: inline-block;
    }

    .menu-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .menu-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 10px;
      color: @color-text-primary;
    }

    .menu-path-tag {
      margin-left: auto;
      font-size: 12px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 10px;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;

    .empty-icon {
      font-size: 36px;
      color: @color-primary;
      margin-bottom: 20px;
    }

    .empty-text {
      margin: 0;
      font-size: 16px;
      color: @color-text-regular;
      font-weight: 500;
    }

    .empty-sub {
      margin: 8px 0 0;
      font-size: 13px;
      color: @color-text-placeholder;
    }
  }
}
</style>
