<script setup lang="ts">
/**
 * SearchBar - 列表页搜索栏组件，封装搜索输入框、搜索/重置按钮及自定义操作按钮
 *
 * 功能特性：
 * 1. 内置关键字输入框（支持 v-model:searchKey 双向绑定，回车即搜索）
 * 2. 提供搜索 / 重置按钮，重置时清空 searchKey 并触发 reset 事件
 * 3. 通过 filters 具名插槽支持完全自定义筛选字段（替换默认输入框）
 * 4. actions 配置式渲染右侧操作按钮（如新增、批量导出），支持 type/icon/disabled/visible
 * 5. 自适应换行布局，左右两栏自动换行
 *
 * @example 基础用法（默认关键字输入框）
 * <search-bar
 *   v-model:searchKey="keyword"
 *   placeholder="请输入用户名"
 *   @search="handleSearch"
 *   @reset="handleReset"
 * />
 *
 * @example 进阶用法（自定义筛选字段 + 右侧操作按钮）
 * <search-bar :actions="actions" @search="getList" @reset="onReset">
 *   <template #filters>
 *     <el-select v-model="form.status" placeholder="状态" />
 *     <el-date-picker v-model="form.date" type="daterange" />
 *   </template>
 * </search-bar>
 *
 * Props:
 * - searchKey: string，搜索关键字，默认 ''
 * - placeholder: string，输入框占位提示文案，默认 '请输入关键字'
 * - showOrg: boolean，预留字段（当前实现未使用），默认 false
 * - showDateRange: boolean，预留字段（当前实现未使用），默认 false
 * - actions: ActionItem[]，右侧操作按钮配置，默认 []
 *
 * ActionItem 配置:
 * - label: string，按钮文案（必填）
 * - type: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'，按钮类型
 * - icon: Component，按钮图标组件
 * - onClick: () => void，按钮点击回调
 * - disabled: boolean，是否禁用
 * - visible: boolean，是否显示，默认 true（visible !== false 均显示）
 *
 * Events:
 * - update:searchKey: 输入或重置时触发，参数 value: string（新关键字，重置时为 ''）
 * - search: 点击搜索按钮或回车时触发，无参数
 * - reset: 点击重置按钮时触发（已自动清空 searchKey），无参数
 *
 * Slots:
 * - filters: 自定义筛选字段插槽，非作用域，替换默认关键字输入框
 *
 * Methods（defineExpose 暴露的方法）:
 * - 无
 */
import { LxIcon, LxSearchBar } from 'lx-ui';
import { computed, useSlots } from 'vue';
import type { Component } from 'vue';

defineOptions({ name: 'SearchBar' });

interface ActionItem {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  icon?: Component;
  onClick?: () => void;
  disabled?: boolean;
  visible?: boolean;
}

interface Props {
  searchKey?: string;
  placeholder?: string;
  showOrg?: boolean;
  showDateRange?: boolean;
  actions?: ActionItem[];
}

const props = withDefaults(defineProps<Props>(), {
  searchKey: '',
  placeholder: '请输入关键字',
  showOrg: false,
  showDateRange: false,
  actions: () => [],
});

const emit = defineEmits<{
  (e: 'update:searchKey', value: string): void;
  (e: 'search'): void;
  (e: 'reset'): void;
}>();

const slots = useSlots();
const hasFiltersSlot = computed(() => !!slots.filters);

const visibleActions = computed(() => props.actions.filter((a) => a.visible !== false));

function handleSearch(): void {
  emit('search');
}

function handleReset(): void {
  emit('update:searchKey', '');
  emit('reset');
}

function handleAction(action: ActionItem): void {
  action.onClick?.();
}
</script>

<template>
  <LxSearchBar class="search-bar" :collapsible="false">
    <template #filters>
      <div class="search-bar__left">
        <!-- 自定义筛选字段插槽优先于默认关键字输入框。 -->
        <slot name="filters" />
        <template v-if="!hasFiltersSlot">
          <el-input
            :model-value="searchKey"
            :placeholder="placeholder"
            class="search-bar__item search-bar__input"
            clearable
            @keyup.enter="handleSearch"
            @update:model-value="(value) => emit('update:searchKey', String(value ?? ''))"
          >
            <template #prefix><LxIcon name="search" :size="16" /></template>
          </el-input>
        </template>
      </div>
    </template>
    <!-- 使用自有控件保留原重置仅触发 reset 的行为。 -->
    <template #controls>
      <div class="search-bar__left">
        <el-button class="search-bar__item" type="primary" @click="handleSearch">
          <LxIcon name="search" :size="16" />搜索
        </el-button>
        <el-button class="search-bar__item" @click="handleReset"><LxIcon name="refresh" :size="16" />重置</el-button>
      </div>
      <!-- LxSearchBar 的 controls 插槽会覆盖默认 actions 插槽，操作按钮必须在此处追加。 -->
      <div class="search-bar__right">
        <el-button
          v-for="(action, index) in visibleActions"
          :key="index"
          class="search-bar__item"
          :type="action.type || 'default'"
          :icon="action.icon"
          :disabled="action.disabled"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </template>
  </LxSearchBar>
</template>

<style lang="less" scoped>
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: @spacing-sm-plus;
  padding-bottom: @spacing-md;
  margin-bottom: @spacing-xs;
  border-bottom: 1px solid @color-border-light;

  :deep(.lx-search-bar__grid) {
    display: block;
    flex: 1;
    min-width: 0;
  }

  :deep(.lx-search-bar__footer) {
    margin-left: auto;
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: @spacing-sm;
  }

  &__right {
    flex-shrink: 0;
  }

  &__item {
    flex-shrink: 0;
  }

  &__input {
    width: 220px;

    :deep(.el-input__wrapper) {
      border-radius: @radius-2xl;
    }
  }
}
</style>
