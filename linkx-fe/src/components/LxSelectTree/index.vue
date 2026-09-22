<script setup lang="ts">
/**
 * LxSelectTree — 组织部门树选择（Element Plus el-tree 二次封装）
 * 能力透传：filter 搜索 / 父子级联复选（checkStrictly 可关）/ lazy 懒加载 / 节点状态圆点
 * 懒加载请求由业务注入（P7：组件不发起请求）
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { ElTree } from 'element-plus';
import type { TreeInstance } from 'element-plus';
import type { LxSelectTreeProps, LxTreeNode } from './types';
import LxIcon from '../LxIcon/index.vue';
import LxStatusDot from '../LxStatusDot/index.vue';
import 'element-plus/es/components/tree/style/css';

const props = withDefaults(defineProps<LxSelectTreeProps>(), {
  data: () => [],
  checkedKeys: () => [],
  checkStrictly: false,
  filterable: true,
  placeholder: '搜索部门名称',
  lazy: undefined,
  expandedKeys: () => [],
  height: 320,
});

const emit = defineEmits<{
  'update:checked-keys': [keys: (string | number)[]];
  'check-change': [keys: (string | number)[], nodes: LxTreeNode[]];
  'node-click': [node: LxTreeNode];
}>();

const treeRef = ref<TreeInstance>();
const keyword = ref('');

/* —— 搜索过滤（EP filter：命中节点及祖先自动保留展开） —— */
watch(keyword, (v) => treeRef.value?.filter(v));

function filterNode(value: string, data: any) {
  return !value || String(data.title).toLowerCase().includes(String(value).toLowerCase());
}

function hasMatch(nodes: LxTreeNode[], kw: string): boolean {
  return nodes.some(
    (n) => n.title.toLowerCase().includes(kw) || (!!n.children && hasMatch(n.children, kw))
  );
}

const noMatch = computed(() => !!keyword.value.trim() && !hasMatch(props.data, keyword.value.trim()));

/* —— 受控复选同步 —— */
let syncing = false;

function syncChecked(keys: (string | number)[]) {
  syncing = true;
  treeRef.value?.setCheckedKeys(keys as any);
  nextTick(() => (syncing = false));
}

watch(() => props.checkedKeys, syncChecked);
onMounted(() => props.checkedKeys.length && syncChecked(props.checkedKeys));

function findNodes(keys: (string | number)[]): LxTreeNode[] {
  const found: LxTreeNode[] = [];
  const walk = (list: LxTreeNode[]) => {
    for (const n of list) {
      if (keys.includes(n.key)) found.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(props.data);
  return found;
}

function onCheck() {
  if (syncing) return;
  const keys = (treeRef.value?.getCheckedKeys(false) ?? []) as (string | number)[];
  emit('update:checked-keys', keys);
  emit('check-change', keys, findNodes(keys)); // 备注：懒加载子级不在原始 data 里，需业务用 key 自查
}

/* —— 懒加载（level 0 返回根数据；有 children 用之，否则调业务注入的 lazy） —— */
function onLazyLoad(node: any, resolve: (data: any[]) => void) {
  if (node.level === 0) return resolve(props.data);
  const raw = node.data as LxTreeNode;
  if (raw.children?.length) return resolve(raw.children);
  props.lazy?.(raw).then((children) => resolve(children));
}

function onNodeClick(data: any) {
  emit('node-click', data as LxTreeNode);
}
</script>

<template>
  <div class="lx-tree">
    <!-- 搜索框（输入框纯净铁律） -->
    <div v-if="filterable" class="lx-tree__search">
      <LxIcon name="search" :size="14" class="lx-tree__search-icon" />
      <input v-model="keyword" class="lx-tree__input" type="text" :placeholder="placeholder" />
    </div>

    <div class="lx-tree__body" :style="{ maxHeight: height + 'px' }">
      <ElTree
        ref="treeRef"
        :data="data"
        :props="{ label: 'title' }"
        node-key="key"
        show-checkbox
        :check-strictly="checkStrictly"
        :default-expanded-keys="expandedKeys"
        :lazy="!!lazy"
        :load="onLazyLoad"
        :filter-node-method="filterNode"
        @check="onCheck"
        @node-click="onNodeClick"
      >
        <template #default="{ data: node }">
          <span class="lx-tree__label">
            <span class="lx-tree__title">{{ node.title }}</span>
            <LxStatusDot v-if="node.status" :status="node.status" :size="6" :pulse="false" />
          </span>
        </template>
      </ElTree>

      <div v-if="noMatch || !data.length" class="lx-tree__empty">
        {{ keyword ? '未找到匹配部门' : '暂无数据' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.lx-tree {
  display: flex;
  flex-direction: column;
  gap: var(--lx-space-sm);
}

.lx-tree__search {
  position: relative;
  display: flex;
  align-items: center;
}

.lx-tree__search-icon {
  position: absolute;
  left: var(--lx-space-sm);
  color: var(--lx-text-secondary);
  pointer-events: none;
}

.lx-tree__input {
  width: 100%;
  height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm) 0 30px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 12px;
  transition: border-color var(--lx-transition);
}

.lx-tree__input:focus {
  outline: none;
  border-color: var(--lx-color-primary);
}

.lx-tree__input::placeholder {
  color: var(--lx-text-placeholder);
}

/* EP 树 → LxUI 令牌 */
:deep(.el-tree) {
  --el-tree-node-content-height: 32px;
  --el-tree-node-content-hover-bg-color: var(--lx-color-primary-light);
  --el-tree-text-color: var(--lx-text-regular);
  --el-tree-expand-icon-color: var(--lx-text-secondary);
  background: transparent;
  font-size: 13px;
}

.lx-tree__body {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--lx-border) transparent;
}

.lx-tree__label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  min-width: 0;
  flex: 1;
}

.lx-tree__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-tree__empty {
  padding: var(--lx-space-xl) 0;
  text-align: center;
  font-size: 12px;
  color: var(--lx-text-secondary);
}
</style>
