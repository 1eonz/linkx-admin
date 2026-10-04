<script setup lang="ts">
import { computed } from 'vue'
import LxCodeSlot from '../LxCodeSlot/index.vue'
import LxStatusDot from '../LxStatusDot/index.vue'
import { isFieldMasked, maskValue } from '../../permissions'
import type { LxDescriptionItem, LxDescriptionsProps } from './types'

defineOptions({ name: 'LxDescriptions' })

const props = withDefaults(defineProps<LxDescriptionsProps>(), {
  items: () => [],
  columns: 1,
  bordered: false,
  size: 'default',
})

const resolvedLayout = computed(
  () => props.layout ?? (props.columns > 1 ? 'grid' : 'two-ends'),
)
const resolvedColumns = computed(() =>
  resolvedLayout.value === 'two-ends' ? 1 : props.columns,
)
const resolvedSize = computed(() =>
  resolvedLayout.value === 'compact' ? 'small' : props.size,
)

const rootStyle = computed(() => ({
  '--lx-descriptions-columns': resolvedColumns.value,
  '--lx-descriptions-row-height':
    typeof props.rowHeight === 'number' &&
    Number.isFinite(props.rowHeight) &&
    props.rowHeight > 0
      ? `${props.rowHeight}px`
      : undefined,
  '--lx-descriptions-divider-color': props.dividerColor || undefined,
}))

function spanOf(item: LxDescriptionItem): number {
  const span = item.span ?? 1
  if (!Number.isFinite(span)) return 1
  return Math.max(1, Math.min(resolvedColumns.value, Math.floor(span)))
}

function labelWidthOf(item: LxDescriptionItem): string {
  const labelWidth = item.labelWidth ?? props.labelWidth
  if (typeof labelWidth === 'number' && Number.isFinite(labelWidth))
    return `${Math.max(0, labelWidth)}px`
  return typeof labelWidth === 'string' ? labelWidth : 'auto'
}

function isMasked(item: LxDescriptionItem): boolean {
  return (
    item.mask !== undefined && item.mask !== false && isFieldMasked(item.key)
  )
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

function titleOf(item: LxDescriptionItem): string | undefined {
  if (isMasked(item) || isEmptyValue(item.value)) return undefined
  const value = String(item.value)
  return value.length > 24 ? value : undefined
}

function displayValue(item: LxDescriptionItem): string {
  if (item.mask === undefined || item.mask === false) {
    if (isEmptyValue(item.value)) return '-'
    return String(item.value)
  }
  return maskValue(
    item.value,
    item.key,
    typeof item.mask === 'string' ? item.mask : '***',
  )
}
</script>

<template>
  <dl
    class="lx-descriptions"
    :class="[
      `lx-descriptions--${resolvedSize}`,
      `lx-descriptions--${resolvedLayout}`,
      { 'is-bordered': bordered },
    ]"
    :style="rootStyle"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="lx-descriptions__item"
      :style="{
        '--lx-descriptions-span': spanOf(item),
        '--lx-descriptions-label-width': labelWidthOf(item),
      }"
    >
      <dt class="lx-descriptions__label">{{ item.label }}</dt>
      <dd class="lx-descriptions__value">
        <slot :name="`item-${item.key}`" :item="item" :value="item.value">
          <LxStatusDot
            v-if="item.statusDot && !isMasked(item)"
            :status="item.statusDot"
            :size="6"
            :status-desc="displayValue(item)"
            show-text
          />
          <LxCodeSlot
            v-else-if="
              item.copyable && !isMasked(item) && !isEmptyValue(item.value)
            "
            :ellipsis="true"
            :aria-label="`复制${item.label}：${displayValue(item)}`"
          >
            {{ displayValue(item) }}
          </LxCodeSlot>
          <span
            v-else
            class="lx-descriptions__value-text"
            :title="titleOf(item)"
          >
            {{ displayValue(item) }}
          </span>
        </slot>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.lx-descriptions {
  display: grid;
  grid-template-columns: repeat(var(--lx-descriptions-columns), minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--lx-border-light);
}

.lx-descriptions__item {
  display: grid;
  grid-column: span var(--lx-descriptions-span);
  grid-template-columns: var(--lx-descriptions-label-width) minmax(0, 1fr);
  min-width: 0;
  min-height: var(--lx-descriptions-row-height, var(--lx-control-height));
  border-bottom: 1px solid
    var(--lx-descriptions-divider-color, var(--lx-border-light));
  transition: background-color var(--lx-transition);
}

.lx-descriptions__item:hover {
  background: var(--lx-bg-card-hover);
}

.lx-descriptions__label,
.lx-descriptions__value {
  display: flex;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 4px var(--lx-space-sm);
  font-size: 13px;
  line-height: 20px;
}

.lx-descriptions__label {
  color: var(--lx-text-regular);
}

.lx-descriptions__value {
  justify-content: flex-end;
  color: var(--lx-text-primary);
  text-align: end;
}

.lx-descriptions__value-text {
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-descriptions.is-bordered {
  border-inline: 1px solid
    var(--lx-descriptions-divider-color, var(--lx-border-light));
}

.lx-descriptions.is-bordered .lx-descriptions__label {
  background: var(--lx-bg-table-header);
  border-inline-end: 1px solid
    var(--lx-descriptions-divider-color, var(--lx-border-light));
}

.lx-descriptions--small .lx-descriptions__label,
.lx-descriptions--small .lx-descriptions__value {
  padding-block: 2px;
  font-size: 12px;
  line-height: 18px;
}

.lx-descriptions--small .lx-descriptions__item {
  min-height: var(--lx-descriptions-row-height, var(--lx-control-height-sm));
}

@media (max-width: 767px) {
  .lx-descriptions {
    grid-template-columns: 1fr;
  }

  .lx-descriptions__item {
    grid-column: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-descriptions__item {
    transition: none;
  }
}
</style>
