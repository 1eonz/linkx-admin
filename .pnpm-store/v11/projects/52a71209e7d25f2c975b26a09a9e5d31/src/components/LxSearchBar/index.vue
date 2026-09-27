<script setup lang="ts">
/**
 * LxSearchBar — 配置驱动的列表检索面板。
 * 请求、分页复位和字段联动均由宿主通过事件与 computed fields 控制。
 */
import { computed, ref, watch } from 'vue'
import {
  ElButton,
  ElCascader,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTreeSelect,
} from 'element-plus'
import LxIcon from '../LxIcon/index.vue'
import type { LxSearchBarProps, LxSearchField } from './types'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/cascader/style/css'
import 'element-plus/es/components/tree-select/style/css'

defineOptions({ inheritAttrs: false, name: 'LxSearchBar' })

const props = withDefaults(defineProps<LxSearchBarProps>(), {
  fields: () => [],
  modelValue: () => ({}),
  loading: false,
  collapsible: true,
  collapsed: true,
  searchText: '查询',
  resetText: '重置',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  search: []
  reset: []
  'update:collapsed': [value: boolean]
}>()

const collapsedState = ref(props.collapsed)

watch(
  () => props.collapsed,
  (value) => {
    collapsedState.value = value
  },
)

const canCollapse = computed(() => props.collapsible && props.fields.length > 8)
const isCollapsed = computed(() => canCollapse.value && collapsedState.value)
const visibleFields = computed(() =>
  isCollapsed.value ? props.fields.slice(0, 4) : props.fields,
)

function defaults(): Record<string, unknown> {
  return props.fields.reduce<Record<string, unknown>>((model, field) => {
    if (field.defaultValue !== undefined) model[field.key] = field.defaultValue
    return model
  }, {})
}

function valueOf(field: LxSearchField): unknown {
  const value = props.modelValue?.[field.key]
  return value === undefined ? field.defaultValue : value
}

function updateField(field: LxSearchField, value: unknown) {
  emit('update:modelValue', {
    ...defaults(),
    ...props.modelValue,
    [field.key]: value,
  })
}

function fieldId(key: string): string {
  return `lx-search-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function dateValue(
  field: LxSearchField,
): string | number | Date | string[] | number[] | Date[] | undefined {
  const value = valueOf(field)
  return typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date ||
    Array.isArray(value)
    ? (value as string | number | Date | string[] | number[] | Date[])
    : undefined
}

function treeValue(
  field: LxSearchField,
): string | number | string[] | number[] | undefined {
  const value = valueOf(field)
  return typeof value === 'string' ||
    typeof value === 'number' ||
    Array.isArray(value)
    ? (value as string | number | string[] | number[])
    : undefined
}

function cascaderOptions(
  options: LxSearchField['options'],
): Array<Record<string, unknown>> | undefined {
  return options?.map((option) => ({
    label: option.label,
    value: String(option.value),
    disabled: option.disabled,
    children: cascaderOptions(option.children),
  }))
}

function cascaderValue(
  field: LxSearchField,
): string | number | (string | number)[] | undefined {
  const value = valueOf(field)
  return typeof value === 'string' ||
    typeof value === 'number' ||
    Array.isArray(value)
    ? (value as string | number | (string | number)[])
    : undefined
}

function fieldSpan(field: LxSearchField): number {
  return Math.min(24, Math.max(1, field.span ?? 6))
}

function isSameValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right))
    return JSON.stringify(left ?? []) === JSON.stringify(right ?? [])
  // 常见的空值表示视为同一状态，避免未修改字段错误地启用重置按钮。
  if (left === undefined || left === null || left === '')
    return right === undefined || right === null || right === ''
  return left === right
}

const canReset = computed(() =>
  props.fields.some((field) => {
    const current = valueOf(field)
    return !isSameValue(current, field.defaultValue)
  }),
)

function search() {
  if (!props.loading) emit('search')
}

function reset() {
  if (props.loading || !canReset.value) return
  emit('update:modelValue', defaults())
  emit('reset')
  // 列表页规范：重置后立即按默认条件查询。
  emit('search')
}

function toggleCollapsed() {
  const next = !collapsedState.value
  collapsedState.value = next
  emit('update:collapsed', next)
}
</script>

<template>
  <section
    class="lx-search-bar"
    :class="`lx-search-bar--${size}`"
    v-bind="$attrs"
    aria-label="检索条件"
  >
    <div class="lx-search-bar__grid">
      <template v-for="field in visibleFields" :key="field.key">
        <div
          class="lx-search-bar__field"
          :style="{ '--lx-search-span': fieldSpan(field) }"
        >
          <label class="lx-search-bar__label" :for="fieldId(field.key)">{{
            field.label
          }}</label>

          <ElInput
            v-if="field.type === 'input'"
            :id="fieldId(field.key)"
            :model-value="valueOf(field) as string"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            @update:model-value="updateField(field, $event)"
            @keyup.enter="search"
          />

          <ElSelect
            v-else-if="field.type === 'select'"
            :id="fieldId(field.key)"
            :model-value="
              valueOf(field) as string | number | boolean | undefined
            "
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            @update:model-value="updateField(field, $event)"
          >
            <ElOption
              v-for="option in field.options || []"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </ElSelect>

          <ElDatePicker
            v-else-if="field.type === 'date' || field.type === 'daterange'"
            :id="fieldId(field.key)"
            :model-value="dateValue(field)"
            :type="field.type === 'date' ? 'date' : 'daterange'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :start-placeholder="
              field.type === 'daterange' ? '开始日期' : undefined
            "
            :end-placeholder="
              field.type === 'daterange' ? '结束日期' : undefined
            "
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            value-format="YYYY-MM-DD"
            @update:model-value="updateField(field, $event)"
          />

          <ElInputNumber
            v-else-if="field.type === 'number'"
            :id="fieldId(field.key)"
            :model-value="valueOf(field) as number"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :controls-position="'right'"
            :disabled="field.disabled"
            @update:model-value="updateField(field, $event)"
          />

          <ElTreeSelect
            v-else-if="field.type === 'tree-select'"
            :id="fieldId(field.key)"
            :model-value="treeValue(field)"
            :data="field.options"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            check-strictly
            @update:model-value="updateField(field, $event)"
          />

          <ElCascader
            v-else
            :id="fieldId(field.key)"
            :model-value="cascaderValue(field)"
            :options="cascaderOptions(field.options)"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            @update:model-value="updateField(field, $event)"
          />
        </div>
      </template>

      <div v-if="$slots.filters" class="lx-search-bar__slot-fields">
        <slot name="filters" />
      </div>
    </div>

    <footer class="lx-search-bar__footer">
      <button
        v-if="canCollapse"
        class="lx-search-bar__collapse"
        type="button"
        :aria-expanded="!isCollapsed"
        @click="toggleCollapsed"
      >
        {{ isCollapsed ? '展开' : '收起' }}
        <LxIcon
          name="chevron-down"
          :size="14"
          :class="{ 'is-open': !isCollapsed }"
        />
      </button>

      <div class="lx-search-bar__actions">
        <slot
          name="controls"
          :search="search"
          :reset="reset"
          :can-reset="canReset"
          :loading="loading"
        >
          <slot name="actions" />
          <ElButton
            type="primary"
            :loading="loading"
            :size="size"
            @click="search"
          >
            <LxIcon v-if="!loading" name="search" :size="16" />
            {{ searchText }}
          </ElButton>
          <ElButton
            :disabled="loading || !canReset"
            :size="size"
            @click="reset"
          >
            <LxIcon name="undo" :size="16" />
            {{ resetText }}
          </ElButton>
        </slot>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.lx-search-bar {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  background: var(--lx-bg-card);
}

.lx-search-bar__grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: var(--lx-space-sm) var(--lx-space-lg);
}

.lx-search-bar__field {
  display: grid;
  min-width: 0;
  grid-column: span var(--lx-search-span);
  gap: var(--lx-space-xs);
}

.lx-search-bar__label {
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.lx-search-bar__field :deep(.el-select),
.lx-search-bar__field :deep(.el-date-editor),
.lx-search-bar__field :deep(.el-tree-select),
.lx-search-bar__field :deep(.el-cascader),
.lx-search-bar__field :deep(.el-input-number) {
  width: 100%;
}

.lx-search-bar__slot-fields {
  display: contents;
}

.lx-search-bar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
}

.lx-search-bar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--lx-space-sm);
  margin-inline-start: auto;
}

.lx-search-bar__collapse {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  min-height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm);
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font-size: 13px;
}

.lx-search-bar__collapse:hover {
  background: var(--lx-color-primary-light);
}

.lx-search-bar__collapse:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-search-bar__collapse .lx-icon {
  transition: transform var(--lx-transition);
}

.lx-search-bar__collapse .lx-icon.is-open {
  transform: rotate(180deg);
}

@media (max-width: 767px) {
  .lx-search-bar {
    padding: var(--lx-space-md);
  }

  .lx-search-bar__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-search-bar__field {
    grid-column: 1 / -1;
  }

  .lx-search-bar__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-search-bar__actions {
    width: 100%;
  }
}
</style>
