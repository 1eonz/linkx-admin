<script setup lang="ts">
/**
 * LxSearchBar — 配置驱动的列表检索面板。
 * 请求、分页复位和字段联动均由宿主通过事件与 computed fields 控制。
 */
import { computed, ref, useSlots, watch } from 'vue'
import LxButton from '../LxButton/index.vue'
import LxCascader from '../LxCascader/index.vue'
import LxDatePicker from '../LxDatePicker/index.vue'
import LxInput from '../LxInput/index.vue'
import LxInputNumber from '../LxInputNumber/index.vue'
import LxIcon from '../LxIcon/index.vue'
import LxSelect from '../LxSelect/index.vue'
import LxTreeSelect from '../LxTreeSelect/index.vue'
import type {
  LxCascaderOptionValue,
  LxSearchBarProps,
  LxSearchField,
} from './types'

defineOptions({ inheritAttrs: false, name: 'LxSearchBar' })

const props = withDefaults(defineProps<LxSearchBarProps>(), {
  fields: () => [],
  modelValue: () => ({}),
  loading: false,
  collapsible: true,
  collapsed: true,
  searchText: '查询',
  resetText: '重置',
  statusText: '等待查询',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  search: []
  reset: []
  'update:collapsed': [value: boolean]
}>()

const slots = useSlots()

defineSlots<{
  /**
   * 检索面板底部的状态/快捷键信息行。组件不推断请求耗时或结果数量，
   * 由宿主通过插槽按业务语义注入，避免把请求状态耦合进组件库。
   */
  meta?: (scope: { canReset: boolean; loading: boolean }) => unknown
  /** 接管查询与重置按钮，作用域见 controls 插槽。 */
  controls?: (scope: {
    search: () => void
    reset: () => void
    canReset: boolean
    loading: boolean
  }) => unknown
  /** 在默认查询/重置按钮前追加操作。 */
  actions?: () => unknown
  /** 在字段网格中追加自定义过滤项。 */
  filters?: () => unknown
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
const controlSize = computed<'sm' | 'md' | 'lg'>(() => {
  if (props.size === 'small') return 'sm'
  if (props.size === 'large') return 'lg'
  return 'md'
})
const visibleFields = computed(() =>
  isCollapsed.value ? props.fields.slice(0, 4) : props.fields,
)
const hiddenFieldCount = computed(() =>
  Math.max(0, props.fields.length - visibleFields.value.length),
)
const inlineActions = computed(
  () => props.fields.length === 4 && !canCollapse.value && !slots.filters,
)
const defaultStatusText = computed(() =>
  props.loading ? '查询中' : props.statusText,
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

function fieldControlId(field: LxSearchField): string | [string, string] {
  const id = fieldId(field.key)
  return field.type === 'daterange' ? [`${id}-start`, `${id}-end`] : id
}

function fieldLabelTarget(field: LxSearchField): string {
  const id = fieldControlId(field)
  return Array.isArray(id) ? id[0] : id
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

function treeOptions(
  field: LxSearchField,
): Record<string, unknown>[] | undefined {
  return field.options?.map((option) => ({
    label: option.label,
    value: option.value,
    disabled: option.disabled,
    children: option.children,
  }))
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

function isCascaderNodeValue(value: unknown): value is LxCascaderOptionValue {
  if (typeof value === 'string' || typeof value === 'number') return true
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false
  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function isCascaderValue(
  value: unknown,
): value is LxCascaderOptionValue | LxCascaderOptionValue[] {
  return (
    isCascaderNodeValue(value) ||
    (Array.isArray(value) && value.every(isCascaderNodeValue))
  )
}

function cascaderValue(
  field: LxSearchField,
): LxCascaderOptionValue | LxCascaderOptionValue[] | undefined {
  const value = valueOf(field)
  return isCascaderValue(value) ? value : undefined
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
    role="search"
    aria-label="检索条件"
    :aria-busy="loading ? 'true' : undefined"
    @keyup.esc="reset"
  >
    <div
      class="lx-search-bar__grid"
      :class="{ 'lx-search-bar__grid--inline-actions': inlineActions }"
    >
      <template v-for="field in visibleFields" :key="field.key">
        <div
          class="lx-search-bar__field"
          :style="{ '--lx-search-span': fieldSpan(field) }"
        >
          <label class="lx-search-bar__label" :for="fieldLabelTarget(field)">{{
            field.label
          }}</label>

          <LxInput
            v-if="field.type === 'input'"
            :id="fieldId(field.key)"
            :model-value="valueOf(field) as string"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :size="controlSize"
            @update:model-value="updateField(field, $event)"
            @keyup.enter="search"
          />

          <LxSelect
            v-else-if="field.type === 'select'"
            :id="fieldId(field.key)"
            :model-value="
              valueOf(field) as string | number | boolean | undefined
            "
            :options="field.options"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :size="controlSize"
            @update:model-value="updateField(field, $event)"
          />

          <LxDatePicker
            v-else-if="field.type === 'date' || field.type === 'daterange'"
            :id="fieldControlId(field)"
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
            :size="controlSize"
            value-format="YYYY-MM-DD"
            @update:model-value="updateField(field, $event)"
          />

          <LxInputNumber
            v-else-if="field.type === 'number'"
            :id="fieldId(field.key)"
            :model-value="valueOf(field) as number"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :controls-position="'right'"
            :disabled="field.disabled"
            :size="controlSize"
            @update:model-value="updateField(field, $event)"
          />

          <LxTreeSelect
            v-else-if="field.type === 'tree-select'"
            :id="fieldId(field.key)"
            :model-value="treeValue(field)"
            :data="treeOptions(field)"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :size="controlSize"
            check-strictly
            @update:model-value="updateField(field, $event)"
          />

          <LxCascader
            v-else-if="field.type === 'cascader'"
            :id="fieldId(field.key)"
            :model-value="cascaderValue(field)"
            :options="field.options"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :size="controlSize"
            @update:model-value="updateField(field, $event)"
          />
        </div>
      </template>

      <div v-if="$slots.filters" class="lx-search-bar__slot-fields">
        <slot name="filters" />
      </div>

      <div
        v-if="inlineActions"
        class="lx-search-bar__actions lx-search-bar__actions--inline"
      >
        <slot
          name="controls"
          :search="search"
          :reset="reset"
          :can-reset="canReset"
          :loading="loading"
        >
          <slot name="actions" />
          <LxButton
            type="primary"
            :loading="loading"
            :size="controlSize"
            icon="search"
            @click="search"
          >
            {{ searchText }}
          </LxButton>
          <LxButton
            :disabled="loading || !canReset"
            :size="controlSize"
            @click="reset"
          >
            {{ resetText }}
          </LxButton>
        </slot>
      </div>
    </div>

    <div v-if="$slots.meta || defaultStatusText" class="lx-search-bar__meta">
      <slot
        v-if="$slots.meta"
        name="meta"
        :can-reset="canReset"
        :loading="loading"
      />
      <span v-else role="status" aria-live="polite">{{
        defaultStatusText
      }}</span>
    </div>

    <footer v-if="!inlineActions" class="lx-search-bar__footer">
      <button
        v-if="canCollapse"
        class="lx-search-bar__collapse"
        type="button"
        :aria-expanded="!isCollapsed"
        :aria-label="
          isCollapsed
            ? `展开检索条件，隐藏 ${hiddenFieldCount} 项`
            : '收起检索条件'
        "
        @click="toggleCollapsed"
      >
        {{ isCollapsed ? `展开（隐藏 ${hiddenFieldCount} 项）` : '收起' }}
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
          <LxButton
            type="primary"
            :loading="loading"
            :size="controlSize"
            icon="search"
            @click="search"
          >
            {{ searchText }}
          </LxButton>
          <LxButton
            :disabled="loading || !canReset"
            :size="controlSize"
            @click="reset"
          >
            {{ resetText }}
          </LxButton>
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
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  box-shadow: var(--lx-shadow-card);
}

.lx-search-bar__grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: var(--lx-space-sm) var(--lx-space-lg);
}

.lx-search-bar__grid--inline-actions {
  grid-template-columns: repeat(24, minmax(0, 1fr));
}

.lx-search-bar__grid--inline-actions .lx-search-bar__field {
  grid-column: span 5;
}

.lx-search-bar__field {
  display: grid;
  min-width: 0;
  grid-column: span var(--lx-search-span);
  gap: var(--lx-space-xs);
}

.lx-search-bar__label {
  color: var(--lx-text-label);
  font-size: 12px;
  line-height: 18px;
}

.lx-search-bar__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
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

.lx-search-bar__actions--inline {
  grid-column: span 4;
  align-self: end;
  min-width: 0;
  margin-inline-start: 0;
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

  .lx-search-bar__meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-search-bar__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-search-bar__field {
    grid-column: 1 / -1;
  }

  .lx-search-bar__grid--inline-actions .lx-search-bar__field,
  .lx-search-bar__actions--inline {
    grid-column: 1 / -1;
  }

  .lx-search-bar__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-search-bar__actions {
    width: 100%;
  }

  .lx-search-bar__collapse,
  .lx-search-bar__actions :deep(button) {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-search-bar__collapse .lx-icon {
    transition: none;
  }
}
</style>
