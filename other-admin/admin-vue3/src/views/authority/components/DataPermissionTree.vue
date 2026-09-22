﻿<script setup lang="ts">
/**
 * DataPermissionTree - 数据权限穿梭树
 *
 * 三栏穿梭树设计：
 * - 左侧：部门树（el-tree，支持懒加载/同步加载、搜索过滤、节点全选/取消）
 * - 中间：移除按钮（将右侧勾选项从树中取消）
 * - 右侧：已选列表（el-checkbox-group，支持全选/批量勾选/批量移除）
 * - 内聚部门数据加载逻辑（DEPARTMENT_SYNC_SIGN 判断）
 * - change 事件返回对象数组 [{ id, name, path }]
 *
 * 交互约定：
 * 1. 全选/取消按钮仅在同步模式（非懒加载）下显示
 * 2. 搜索框默认不显示（showFilter=false）
 * 3. 同步模式下默认展开所有节点（default-expand-all）
 * 4. 节点高度 34px、面板边框 @color-border-panel、背景 @color-bg-card
 */
import { ArrowLeft, Grid } from '@element-plus/icons-vue';
import type { ElTree } from 'element-plus';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { queryDepartment, queryDepartmentTree } from '@/api/h5/collaboration';

defineOptions({ name: 'DataPermissionTree' });

interface SelectedNode {
  /** 节点唯一标识 */
  id: string;
  /** 节点显示名称 */
  name: string;
  /** 节点路径（祖先 id 用 / 拼接） */
  path?: string;
  /** 节点图标 class */
  icon?: string;
  /** 是否占位节点（懒加载未加载时使用） */
  isPending?: boolean;
}

interface Props {
  /**
   * 父子是否不联动
   * @type {boolean}
   * @default false
   * @optional
   */
  checkStrictly?: boolean;
  /**
   * 默认选中 keys 数组
   * @type {string[]}
   * @default []
   * @optional
   */
  defaultCheckedKeys?: string[];
  /**
   * 左侧面板标题
   * @type {string}
   * @default '权限列表'
   * @optional
   */
  leftTitle?: string;
  /**
   * 右侧面板标题
   * @type {string}
   * @default '已选择'
   * @optional
   */
  rightTitle?: string;
  /**
   * 是否显示搜索框（默认 false，组织部门为同步加载时不显示）
   * @type {boolean}
   * @default false
   * @optional
   */
  showFilter?: boolean;
  /**
   * 搜索框占位文字
   * @type {string}
   * @default '搜索部门'
   * @optional
   */
  filterPlaceholder?: string;
  /**
   * 容器高度（数字为 px，字符串直接作为 CSS）
   * @type {number | string}
   * @default 400
   * @optional
   */
  height?: number | string;
  /**
   * 是否显示父节点全选按钮
   * @type {boolean}
   * @default false
   * @optional
   */
  showNodeSelectAll?: boolean;
  /**
   * 是否显示父节点取消按钮
   * @type {boolean}
   * @default false
   * @optional
   */
  showNodeCancelAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  checkStrictly: false,
  defaultCheckedKeys: () => [],
  leftTitle: '权限列表',
  rightTitle: '已选择',
  showFilter: false,
  filterPlaceholder: '搜索部门',
  height: 400,
  showNodeSelectAll: false,
  showNodeCancelAll: false,
});

const emit = defineEmits<{
  /** 节点勾选变化时触发，返回所有已选节点详情数组 */
  (e: 'change', detail: SelectedNode[]): void;
  /** 已选 keys 变化时触发（用于 v-model 同步） */
  (e: 'update:modelValue', keys: string[]): void;
}>();

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeData = ref<any[]>([]);
const loading = ref(false);
const filterText = ref('');

/** 已选节点详情（左侧树勾选项 + 占位项） */
const selectedNodes = ref<SelectedNode[]>([]);
/** 右侧勾选项 ID 列表 */
const checkList = ref<string[]>([]);
/** 右侧全选状态 */
const checkAllFlag = ref(false);
const indeterminate = ref(false);

/** 是否同步模式（DEPARTMENT_SYNC_SIGN） */
const isSyncMode = ref(false);
/** 跳过 handleCheck 处理（initCheckedKeys/initCheckedDetail 中使用） */
const skipHandleCheck = ref(false);
/** 懒加载未加载的占位节点详情 */
const pendingDetails = ref<Record<string, SelectedNode>>({});
/** 默认展开的节点 keys（同步模式下展开所有有 children 的节点） */
const defaultExpandedKeys = ref<string[]>([]);

/** 容器高度样式 */
const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));

/** 树配置 */
const treeProps = { children: 'children', label: 'name' };

/** 是否已经加载过数据（用于 v-if 控制 el-tree 渲染时机） */
const isTreeReady = ref(false);

// ===== 加载部门树 =====
/**
 * 加载部门树数据
 * - 同步模式（DEPARTMENT_SYNC_SIGN=true）：一次性加载完整树
 * - 懒加载模式：仅加载根节点，子节点按需加载
 */
async function loadTree(): Promise<void> {
  loading.value = true;
  try {
    isSyncMode.value = resolveSyncSign();

    if (isSyncMode.value) {
      // 同步模式：一次性加载完整树
      const res = await queryDepartmentTree({});
      const data = res?.data as unknown;
      const nodes = Array.isArray(data) ? data : data ? [data] : [];
      treeData.value = normalizeTreeData(nodes as any[]);
      // 性能优化：默认只展开前 2 级（根 + 一级子节点），避免大树全量渲染卡顿
      // 用户可手动展开更深层级；回显时通过 ensureParentExpanded 保证选中节点可见
      defaultExpandedKeys.value = collectExpandableIds(treeData.value, 2);
    } else {
      // 懒加载模式：仅加载根节点
      const res = await queryDepartment({});
      const root = ((res?.data ?? []) as any[]).map((item) => ({
        ...item,
        children: item.hasChildren === false ? undefined : [],
      }));
      treeData.value = root;
      defaultExpandedKeys.value = [];
    }
    isTreeReady.value = true;
  } catch {
    // 忽略
  } finally {
    loading.value = false;
  }
}

/**
 * 递归收集有 children 且 children 非空的节点 id
 * @param nodes - 待遍历的节点数组
 * @param maxDepth - 最大展开层级（1=仅根，2=根+一级子节点），不传则不限
 * @returns 需要默认展开的节点 id 数组
 */
function collectExpandableIds(nodes: any[], maxDepth?: number): string[] {
  const ids: string[] = [];
  const traverse = (list: any[], depth: number): void => {
    if (maxDepth !== undefined && depth > maxDepth) return;
    list.forEach((node) => {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        traverse(node.children, depth + 1);
      }
    });
  };
  traverse(nodes, 1);
  return ids;
}

/**
 * 从 localStorage 的 globalConfig 解析 DEPARTMENT_SYNC_SIGN
 * @returns true 表示同步加载模式，false 表示懒加载模式
 */
function resolveSyncSign(): boolean {
  try {
    const globalConfig = JSON.parse(localStorage.getItem('globalConfig') ?? '{}');
    return globalConfig?.DEPARTMENT_SYNC_SIGN === 'true' || globalConfig?.DEPARTMENT_SYNC_SIGN === true;
  } catch {
    return false;
  }
}

/**
 * 标准化树数据：children 为空时设为空数组，否则递归处理
 * @param nodes - 原始节点数组
 * @returns 标准化后的节点数组
 */
function normalizeTreeData(nodes: any[]): any[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children !== null && Array.isArray(node.children) ? normalizeTreeData(node.children) : [],
  }));
}

/**
 * 懒加载子节点
 * @param node - 父节点（level=0 时为根）
 * @param resolve - 加载完成回调
 */
async function loadNode(node: any, resolve: (data: any[]) => void): Promise<void> {
  if (node.level === 0) {
    resolve(treeData.value);
    return;
  }
  try {
    const parentCode = node.data?.code;
    const res = await queryDepartment({ parentCode });
    const children = ((res?.data ?? []) as any[]).map((item) => ({
      ...item,
      children: item.hasChildren === false ? undefined : [],
    }));
    resolve(children);
    nextTick(() => {
      refreshPendingNodes();
    });
  } catch {
    resolve([]);
  }
}

// ===== 搜索过滤 =====
watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

function filterNode(value: string, data: any): boolean {
  if (!value) return true;
  return data.name?.includes(value) ?? false;
}

const filterNodeMethod = filterNode as never;

// ===== 勾选变化 =====
/**
 * 勾选变化处理：同步左侧树勾选状态到右侧已选列表
 * - 收集已加载的勾选节点
 * - 保留未加载的占位节点
 * - 合并后 emit change 和 update:modelValue
 */
function handleCheck(): void {
  if (skipHandleCheck.value) return;

  // 重置右侧勾选状态（左侧变化时清空右侧勾选）
  checkList.value = [];
  checkAllFlag.value = false;
  indeterminate.value = false;

  const checkedNodes = treeRef.value?.getCheckedNodes() as any[];
  const loadedMap: Record<string, boolean> = {};
  const loadedNodes: SelectedNode[] = (checkedNodes ?? []).map((node: any) => {
    loadedMap[node.id] = true;
    return {
      id: node.id,
      name: node.name,
      path: getNodePath(node.id),
    };
  });

  // 保留未加载的占位节点（移除已加载的）
  const newPending: Record<string, SelectedNode> = {};
  Object.keys(pendingDetails.value).forEach((id) => {
    if (!loadedMap[id]) {
      newPending[id] = pendingDetails.value[id];
    }
  });
  pendingDetails.value = newPending;

  // 重新添加剩余的占位节点
  const pendingNodes = Object.values(pendingDetails.value).map((detail) => ({
    id: detail.id,
    name: detail.name,
    icon: detail.icon || '',
    isPending: true,
  }));

  // 合并：已加载在前，占位在后
  selectedNodes.value = [...loadedNodes, ...pendingNodes];

  const keys = selectedNodes.value.map((n) => n.id);
  emit('update:modelValue', keys);
  emit('change', selectedNodes.value);
}

// ===== 右侧勾选 =====
/**
 * 右侧列表勾选变化处理
 * @param item - 当前操作的节点
 * @param val - 是否勾选
 */
function handleRightCheckChange(item: SelectedNode, val: boolean): void {
  if (val) {
    if (!checkList.value.includes(item.id)) {
      checkList.value.push(item.id);
    }
  } else {
    checkList.value = checkList.value.filter((id) => id !== item.id);
  }
  updateCheckAllState();
}

/**
 * 右侧全选/取消全选
 * @param val - true 全选，false 取消全选
 */
function handleCheckAll(val: any): void {
  checkList.value = val ? selectedNodes.value.map((n) => n.id) : [];
  indeterminate.value = false;
}

/** 更新右侧全选框状态（全选/半选/未选） */
function updateCheckAllState(): void {
  const total = selectedNodes.value.length;
  if (total === 0) {
    checkAllFlag.value = false;
    indeterminate.value = false;
  } else {
    checkAllFlag.value = checkList.value.length === total;
    indeterminate.value = checkList.value.length > 0 && checkList.value.length < total;
  }
}

// ===== 中间移除按钮 =====
/** 移除右侧已勾选的节点（同步取消左侧树的勾选） */
function removeSelected(): void {
  if (checkList.value.length === 0) return;

  const currentKeys = treeRef.value?.getCheckedKeys() as string[];
  const result = (currentKeys ?? []).filter((key) => !checkList.value.includes(key));
  skipHandleCheck.value = true;
  treeRef.value?.setCheckedKeys(result);
  skipHandleCheck.value = false;

  // 同时移除 pendingDetails 中被选中的占位节点
  const newPending: Record<string, SelectedNode> = {};
  Object.keys(pendingDetails.value).forEach((id) => {
    if (!checkList.value.includes(id)) {
      newPending[id] = pendingDetails.value[id];
    }
  });
  pendingDetails.value = newPending;

  checkList.value = [];
  checkAllFlag.value = false;
  indeterminate.value = false;
  nextTick(() => {
    handleCheck();
  });
}

// ===== 父节点全选/取消按钮 =====
/**
 * 选中某节点及其所有子孙节点
 * @param data - 起始节点
 */
function selectAllDescendants(data: any): void {
  const currentKeys = treeRef.value?.getCheckedKeys() as string[];
  const descendantIds = getDescendantIds(data);
  const result = [...new Set([data.id, ...descendantIds, ...(currentKeys ?? [])])];
  skipHandleCheck.value = true;
  treeRef.value?.setCheckedKeys(result);
  skipHandleCheck.value = false;
  nextTick(() => {
    handleCheck();
  });
}

/**
 * 取消选中某节点及其所有子孙节点
 * @param data - 起始节点
 */
function cancelAllDescendants(data: any): void {
  const currentKeys = treeRef.value?.getCheckedKeys() as string[];
  const descendantIds = getDescendantIds(data);
  const removeIds = [data.id, ...descendantIds];
  const result = (currentKeys ?? []).filter((key) => !removeIds.includes(key));
  skipHandleCheck.value = true;
  treeRef.value?.setCheckedKeys(result);
  skipHandleCheck.value = false;
  nextTick(() => {
    handleCheck();
  });
}

/**
 * 获取节点的所有子孙 id（递归）
 * @param data - 起始节点
 * @returns 子孙 id 数组
 */
function getDescendantIds(data: any): string[] {
  const result: string[] = [];
  const traverse = (node: any): void => {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        result.push(child.id);
        traverse(child);
      });
    }
  };
  traverse(data);
  return result;
}

// ===== 占位节点刷新 =====
/** 刷新占位节点：懒加载完成后将已加载的占位节点转为正常节点 */
function refreshPendingNodes(): void {
  if (Object.keys(pendingDetails.value).length === 0) return;

  const stillPending: Record<string, SelectedNode> = {};
  const newlyLoaded: any[] = [];
  Object.keys(pendingDetails.value).forEach((id) => {
    const node = treeRef.value?.getNode(id);
    if (node && node.data) {
      newlyLoaded.push(node.data);
    } else {
      stillPending[id] = pendingDetails.value[id];
    }
  });

  if (newlyLoaded.length === 0) return;
  pendingDetails.value = stillPending;

  skipHandleCheck.value = true;
  const currentCheckedKeys = treeRef.value?.getCheckedKeys() as string[];
  const newlyLoadedIds = newlyLoaded.map((data) => data.id);
  const allCheckedKeys = [...new Set([...(currentCheckedKeys ?? []), ...newlyLoadedIds])];
  treeRef.value?.setCheckedKeys(allCheckedKeys);
  skipHandleCheck.value = false;

  const existingIds = new Set<string>();
  const loadedNodes: SelectedNode[] = [];

  selectedNodes.value.forEach((item) => {
    if (!item.isPending) {
      existingIds.add(item.id);
      loadedNodes.push(item);
    }
  });

  newlyLoaded.forEach((data) => {
    if (!existingIds.has(data.id)) {
      existingIds.add(data.id);
      loadedNodes.push({
        id: data.id,
        name: data.name,
        path: getNodePath(data.id),
      });
    }
  });

  const pendingNodes = Object.values(pendingDetails.value).map((detail) => ({
    id: detail.id,
    name: detail.name,
    icon: detail.icon || '',
    isPending: true,
  }));

  selectedNodes.value = [...loadedNodes, ...pendingNodes];

  const keys = selectedNodes.value.map((n) => n.id);
  emit('update:modelValue', keys);
  emit('change', selectedNodes.value);
}

/**
 * 获取节点路径（祖先 id 用 / 拼接）
 * @param nodeId - 目标节点 id
 * @returns 路径字符串，根节点直接子节点返回空字符串
 */
function getNodePath(nodeId: string): string {
  const node = treeRef.value?.getNode(nodeId);
  if (!node || node.level <= 1) return '';
  const path: string[] = [];
  let parent = node.parent;
  while (parent && parent.level > 0) {
    path.unshift(parent.data?.id as string);
    parent = parent.parent;
  }
  return path.join('/');
}

// ===== 回显 API =====
/**
 * 用 id 数组初始化选中状态（未加载的 id 作为占位节点）
 * @param keys - 需要选中的节点 id 数组
 */
function initCheckedKeys(keys: string[]): void {
  if (!keys || !keys.length) return;

  skipHandleCheck.value = true;

  const existingIds = new Set<string>();
  const missingKeys: string[] = [];
  keys.forEach((id) => {
    const node = treeRef.value?.getNode(id);
    if (node && node.data) {
      existingIds.add(id);
    } else {
      missingKeys.push(id);
    }
  });

  treeRef.value?.setCheckedKeys([...existingIds]);

  const newPending: Record<string, SelectedNode> = {};
  missingKeys.forEach((key) => {
    newPending[key] = { id: key, name: String(key), icon: '' };
  });
  pendingDetails.value = newPending;

  skipHandleCheck.value = false;
  nextTick(() => {
    handleCheck();
  });
}

/**
 * 用详情数组初始化选中状态（兼容旧版 children 嵌套格式）
 * @param detail - 已选节点详情数组
 * @returns 标准化后的节点数组
 */
function initCheckedDetail(detail: Array<SelectedNode>): Array<SelectedNode> {
  if (!detail || !detail.length) return [];

  const normalizedDetail = normalizeImOrgPrivJson(detail);

  skipHandleCheck.value = true;

  checkList.value = [];
  checkAllFlag.value = false;
  indeterminate.value = false;
  pendingDetails.value = {};

  selectedNodes.value = normalizedDetail.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon || '',
  }));

  const keys = normalizedDetail.map((item) => item.id);
  const existingIds = new Set<string>();
  const missingKeys: string[] = [];
  keys.forEach((id) => {
    const node = treeRef.value?.getNode(id);
    if (node && node.data) {
      existingIds.add(id);
    } else {
      missingKeys.push(id);
    }
  });

  treeRef.value?.setCheckedKeys([...existingIds]);

  const newPending: Record<string, SelectedNode> = {};
  missingKeys.forEach((id) => {
    const item = normalizedDetail.find((d) => d.id === id);
    newPending[id] = {
      id,
      name: item ? item.name : String(id),
      icon: item ? item.icon || '' : '',
    };
  });
  pendingDetails.value = newPending;

  skipHandleCheck.value = false;
  nextTick(() => {
    handleCheck();
  });

  return normalizedDetail;
}

/**
 * 从详情数据同步选中状态（兼容 orgList 和 orgIds 两种格式）
 * @param detail - 包含 orgList（节点数组）或 orgIds（id 数组）的对象
 * @returns 已选节点详情数组
 */
function syncFromDetail(detail: { orgList?: Array<SelectedNode>; orgIds?: string[] }): Array<SelectedNode> {
  if (detail.orgList && detail.orgList.length > 0) {
    return initCheckedDetail(detail.orgList);
  }
  if (detail.orgIds && detail.orgIds.length > 0) {
    initCheckedKeys(detail.orgIds);
    return [];
  }
  return [];
}

/**
 * 标准化旧版 children 嵌套格式为扁平数组
 * @param data - 原始数据（可能含 children 嵌套）
 * @returns 扁平化后的节点数组
 */
function normalizeImOrgPrivJson(data: Array<SelectedNode>): Array<SelectedNode> {
  if (!data || !data.length) return [];

  const isOldFormat = data.some((item: any) => item.children !== undefined && item.children !== null);

  if (!isOldFormat) {
    return data;
  }

  const result: SelectedNode[] = [];
  const flatten = (nodes: any[], ancestorPath: string): void => {
    nodes.forEach((node) => {
      result.push({
        id: node.id,
        name: node.name,
        path: ancestorPath,
      });
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const childPath = ancestorPath ? `${ancestorPath}/${node.id}` : String(node.id);
        flatten(node.children, childPath);
      }
    });
  };
  flatten(data as any[], '');
  return result;
}

/** 重置组件状态：清空选中、过滤、占位节点 */
function reset(): void {
  filterText.value = '';
  checkAllFlag.value = false;
  indeterminate.value = false;
  checkList.value = [];
  selectedNodes.value = [];
  pendingDetails.value = {};
  skipHandleCheck.value = false;
  treeRef.value?.setCheckedKeys([]);
  treeRef.value?.filter('');
}

/** @returns 当前已选节点 id 数组 */
function getCheckedKeys(): string[] {
  return (treeRef.value?.getCheckedKeys() as string[]) ?? [];
}

/** @returns 当前已选节点详情数组（含占位节点） */
function getCheckedDetail(): SelectedNode[] {
  return selectedNodes.value;
}

defineExpose({
  syncFromDetail,
  initCheckedKeys,
  initCheckedDetail,
  reset,
  getCheckedKeys,
  getCheckedDetail,
});

onMounted(() => {
  loadTree();
});
</script>

<template>
  <div v-loading="loading" class="data-permission-tree" :style="containerStyle">
    <!-- 左侧：部门树 -->
    <div class="panel left-panel">
      <div class="panel-header">
        <el-icon class="panel-icon"><Grid /></el-icon>
        <span class="panel-title">{{ leftTitle }}</span>
        <span v-if="selectedNodes.length > 0" class="panel-count">{{ selectedNodes.length }}</span>
        <el-input
          v-if="showFilter"
          v-model="filterText"
          :placeholder="filterPlaceholder"
          size="small"
          clearable
          class="filter-input"
        />
      </div>
      <div class="panel-content">
        <el-tree
          v-if="isTreeReady"
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          node-key="id"
          show-checkbox
          :check-strictly="checkStrictly"
          :default-expanded-keys="defaultExpandedKeys"
          :lazy="!isSyncMode"
          :load="loadNode"
          :filter-node-method="filterNodeMethod"
          @check="handleCheck"
        >
          <template #default="{ data }">
            <span class="custom-tree-node">
              <i v-if="data && data.icon" :class="data.icon" class="node-icon" />
              <span class="node-label" :title="data.name">{{ data.name }}</span>
              <el-tag v-if="data && data.url" size="small" type="info" class="node-tag">
                {{ data.url }}
              </el-tag>
              <!-- 全选/取消按钮：仅同步模式显示（懒加载时不显示） -->
              <span
                v-if="
                  isSyncMode &&
                  (showNodeSelectAll || showNodeCancelAll) &&
                  data &&
                  data.children &&
                  data.children.length > 0
                "
                class="node-actions"
                @click.stop
                @mousedown.stop
              >
                <span v-if="showNodeSelectAll" class="action-btn" @click.stop="selectAllDescendants(data)"> 全选 </span>
                <span v-if="showNodeCancelAll" class="action-btn" @click.stop="cancelAllDescendants(data)"> 取消 </span>
              </span>
            </span>
          </template>
        </el-tree>
        <!-- 空状态：教学化文案，区分"未加载"与"真的没有" -->
        <div v-if="!loading && treeData.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <el-icon><Grid /></el-icon>
          </div>
          <p>暂无部门数据</p>
          <p class="empty-hint">请检查部门同步配置或联系管理员</p>
        </div>
      </div>
    </div>

    <!-- 中间操作按钮 -->
    <div class="transfer-buttons">
      <el-button circle :icon="ArrowLeft" :disabled="checkList.length === 0" @click="removeSelected" />
    </div>

    <!-- 右侧：已选列表 -->
    <div class="panel right-panel">
      <div class="panel-header">
        <el-checkbox v-model="checkAllFlag" :indeterminate="indeterminate" @change="handleCheckAll" />
        <span class="panel-title">{{ rightTitle }}</span>
        <span v-if="selectedNodes.length > 0" class="panel-count">
          {{ checkList.length }}/{{ selectedNodes.length }}
        </span>
      </div>
      <div class="panel-content">
        <div v-if="selectedNodes.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <el-icon><Grid /></el-icon>
          </div>
          <p>暂未选择</p>
          <p class="empty-hint">在左侧勾选部门后，已选项会显示在这里</p>
        </div>
        <div v-else class="selected-list">
          <el-checkbox
            v-for="node in selectedNodes"
            :key="node.id"
            :model-value="checkList.includes(node.id)"
            class="selected-item"
            @change="(val: any) => handleRightCheckChange(node, Boolean(val))"
          >
            <span class="item-name" :title="node.name">{{ node.name }}</span>
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
// ===== 数据权限穿梭树样式 =====
.data-permission-tree {
  display: flex;
  gap: 0;
}

// 面板通用样式
.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid @color-border-panel;
  border-radius: 6px;
  background: @color-bg-card;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: @color-text-placeholder;
  }
}

// 面板头部
.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, @color-bg-table-row-hover, lighten(@color-bg-table-row-hover, 1.5%));
  border-bottom: 1px solid @color-border-panel;
  gap: 8px;
  flex-shrink: 0;
  height: 40px;
  box-sizing: border-box;

  // 让 checkbox 不撑大 header 高度（与左侧 icon+title 对齐）
  :deep(.el-checkbox) {
    height: auto;
    margin-right: 0;
  }
}

.panel-icon {
  font-size: 14px;
  color: @color-primary;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: @color-text-primary;
}

.panel-count {
  font-size: 12px;
  color: @color-text-secondary;
  background: @color-bg-hover;
  padding: 1px 8px;
  border-radius: 10px;
  line-height: 18px;
}

.filter-input {
  flex: 1;
  margin-left: auto;

  :deep(.el-input__inner) {
    border-radius: 14px;
  }
}

// 面板内容
.panel-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

// 中间操作按钮
.transfer-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  gap: 8px;
}

// 树节点样式
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
  white-space: nowrap;

  .node-icon {
    margin-right: 6px;
    color: @color-primary;
    font-size: 14px;
    flex-shrink: 0;
  }

  .node-label {
    overflow: visible;
    white-space: nowrap;
    color: @color-text-primary;
  }

  .node-tag {
    margin-left: 8px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .node-actions {
    position: sticky;
    right: 0;
    flex-shrink: 0;
    margin-left: 8px;
    display: none;
    background: inherit;
    padding: 2px 0 2px 8px;

    .action-btn {
      display: inline-block;
      padding: 2px 4px;
      font-size: 12px;
      color: @color-primary;
      cursor: pointer;
      background: @color-bg-card;
      border-radius: 3px;

      &:hover {
        color: @color-primary-light-3;
      }

      & + .action-btn {
        margin-left: 4px;
      }
    }
  }
}

// 整行 hover 时显示全选/取消按钮
:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 4px;
  margin-bottom: 1px;
  padding-right: 8px;

  &:hover {
    background-color: @color-bg-table-row-hover;

    .node-actions {
      display: inline-flex;

      .action-btn {
        background: @color-bg-table-row-hover;
      }
    }
  }

  // 复选框间距调整
  .el-checkbox {
    margin-right: 6px;
  }
}

// 选中行样式
:deep(.el-tree-node.is-checked > .el-tree-node__content) {
  background-color: @color-primary-light-9;

  &:hover .node-actions .action-btn {
    background: @color-primary-light-9;
  }

  .node-actions .action-btn {
    background: @color-primary-light-9;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: @color-text-secondary;

  .empty-icon-wrapper {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, lighten(@color-primary-light-9, 5%), @color-primary-light-9);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;

    i {
      font-size: 24px;
      color: @color-primary;
    }

    :deep(.el-icon) {
      font-size: 24px;
      color: @color-primary;
    }
  }

  p {
    margin: 0;
    font-size: 13px;
    color: @color-text-secondary;

    &.empty-hint {
      margin-top: 4px;
      font-size: 11px;
      color: @color-text-placeholder;
    }
  }
}

// 右侧已选列表
.selected-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;

  .selected-item {
    padding: 6px 8px;
    border-radius: 4px;
    background: @color-bg-card;
    transition: background-color 0.2s;
    margin-right: 0;
    height: 34px;

    &:hover {
      background: @color-primary-light-9;
    }

    .item-name {
      font-size: 13px;
      color: @color-text-regular;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
