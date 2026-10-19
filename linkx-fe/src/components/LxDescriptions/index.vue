<script setup lang="ts">
import { computed, ref } from 'vue'
import LxCodeSlot from '../LxCodeSlot/index.vue'
import LxIcon from '../LxIcon/index.vue'
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
const expandedKeys = ref(new Set<string>())

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

function isExpanded(item: LxDescriptionItem): boolean {
  return expandedKeys.value.has(item.key)
}

function toggleExpanded(key: string) {
  const next = new Set(expandedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedKeys.value = next
}

function expansionDescription(item: LxDescriptionItem): string | undefined {
  if (!titleOf(item)) return undefined
  return isExpanded(item) ? '点击收起完整内容' : '点击展开完整内容'
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
          <button
            v-if="item.statusDot && !isMasked(item) && titleOf(item)"
            type="button"
            class="lx-descriptions__status-toggle"
            :class="{ 'is-expanded': isExpanded(item) }"
            :aria-expanded="isExpanded(item)"
            :aria-label="`${item.label}：${displayValue(item)}`"
            :title="displayValue(item)"
            :aria-description="expansionDescription(item)"
            @click="toggleExpanded(item.key)"
          >
            <LxStatusDot
              :status="item.statusDot"
              :size="6"
              :status-desc="displayValue(item)"
              :tabindex="-1"
              show-text
            />
            <LxIcon
              class="lx-descriptions__expand-icon"
              :class="{ 'is-expanded': isExpanded(item) }"
              name="chevron-down"
              :size="14"
              aria-hidden="true"
            />
          </button>
          <LxStatusDot
            v-else-if="item.statusDot && !isMasked(item)"
            :status="item.statusDot"
            :size="6"
            :status-desc="displayValue(item)"
            :title="displayValue(item)"
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
          <button
            v-else-if="titleOf(item)"
            type="button"
            class="lx-descriptions__value-text"
            :class="{
              'is-long-value': Boolean(titleOf(item)),
              'is-expanded': isExpanded(item),
            }"
            :title="titleOf(item)"
            :aria-label="`${item.label}：${displayValue(item)}`"
            :aria-description="expansionDescription(item)"
            :aria-expanded="isExpanded(item)"
            @click="toggleExpanded(item.key)"
          >
            <span class="lx-descriptions__value-label">{{
              displayValue(item)
            }}</span>
            <LxIcon
              class="lx-descriptions__expand-icon"
              :class="{ 'is-expanded': isExpanded(item) }"
              name="chevron-down"
              :size="14"
              aria-hidden="true"
            />
          </button>
          <span v-else class="lx-descriptions__value-text">
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
  min-width: 0;
  max-width: 100%;
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
  overflow-wrap: anywhere;
  color: var(--lx-text-secondary-strong);
  font-weight: 400;
}

.lx-descriptions__value {
  justify-content: flex-end;
  overflow-wrap: anywhere;
  color: var(--lx-text-primary);
  font-weight: 500;
  text-align: end;
}

.lx-descriptions__value-text {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.lx-descriptions__value-text.is-long-value {
  box-sizing: border-box;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: end;
  cursor: pointer;
}

.lx-descriptions__value-text.is-long-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: underline dotted
    color-mix(in srgb, currentColor 45%, transparent);
  text-underline-offset: 3px;
}

.lx-descriptions__value-text.is-long-value:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-descriptions__value-text.is-long-value.is-expanded {
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.lx-descriptions__value-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-descriptions__value-text.is-expanded .lx-descriptions__value-label {
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.lx-descriptions__expand-icon {
  flex: 0 0 auto;
  margin-inline-start: var(--lx-space-xs);
  transition: transform var(--lx-transition);
}

.lx-descriptions__expand-icon.is-expanded {
  transform: rotate(180deg);
}

.lx-descriptions__status-toggle {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: end;
  cursor: pointer;
}

.lx-descriptions__status-toggle:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

/* 内嵌展示件沿用值列层级，避免子组件的正文令牌冲淡详情值。 */
.lx-descriptions__value :deep(.lx-status-dot) {
  min-width: 0;
  max-width: 100%;
  color: inherit;
  font-weight: inherit;
}

.lx-descriptions__value :deep(.lx-status-dot.is-long-value) {
  text-decoration: underline dotted
    color-mix(in srgb, currentColor 45%, transparent);
  text-underline-offset: 3px;
}

.lx-descriptions__value :deep(.lx-status-dot:focus-visible) {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-descriptions__value :deep(.lx-status-dot__text) {
  min-width: 0;
  max-width: 100%;
  overflow: visible;
  overflow-wrap: anywhere;
  color: inherit;
  text-overflow: clip;
  white-space: normal;
}

.lx-descriptions__status-toggle:not(.is-expanded) :deep(.lx-status-dot__text) {
  overflow: hidden;
  overflow-wrap: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-descriptions__status-toggle.is-expanded :deep(.lx-status-dot__text) {
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.lx-descriptions__value :deep(.lx-code-slot) {
  color: inherit;
  font-weight: inherit;
}

.lx-descriptions__value :deep(.lx-code-slot--copyable:hover),
.lx-descriptions__value :deep(.lx-code-slot--copyable:focus-visible) {
  color: var(--lx-color-primary);
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

  .lx-descriptions__value-text,
  .lx-descriptions__value-text.is-long-value {
    display: flex;
    align-items: flex-start;
    white-space: normal;
    text-decoration: underline dotted
      color-mix(in srgb, currentColor 45%, transparent);
  }

  .lx-descriptions__value-text.is-long-value:not(.is-expanded)
    .lx-descriptions__value-label {
    display: -webkit-box;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
  }

  .lx-descriptions__value-text.is-long-value.is-expanded
    .lx-descriptions__value-label {
    overflow: visible;
    overflow-wrap: anywhere;
    white-space: normal;
    text-overflow: clip;
  }

  .lx-descriptions__status-toggle {
    align-items: flex-start;
  }

  .lx-descriptions__status-toggle:not(.is-expanded)
    :deep(.lx-status-dot__text) {
    display: -webkit-box;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
  }

  .lx-descriptions__value :deep(.lx-code-slot--copyable) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    gap: 0;
    box-sizing: border-box;
    min-height: 44px;
    padding: 0;
  }

  .lx-descriptions__value
    :deep(.lx-code-slot--copyable .lx-code-slot__content) {
    min-width: 0;
    overflow: visible;
    overflow-wrap: anywhere;
    padding: 10px 6px;
    text-overflow: clip;
    white-space: normal;
  }

  .lx-descriptions__value :deep(.lx-code-slot--copyable .lx-code-slot__icon) {
    justify-self: center;
    align-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-descriptions__item {
    transition: none;
  }

  .lx-descriptions__expand-icon {
    transition: none;
  }
}
</style>
