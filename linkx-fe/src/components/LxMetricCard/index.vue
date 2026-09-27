<script setup lang="ts">
import { computed } from 'vue'
import type { LxStatus } from '../../tokens'
import LxIcon from '../LxIcon/index.vue'
import LxStatusDot from '../LxStatusDot/index.vue'
import type { LxMetricCardProps, LxMetricCardStatus } from './types'

defineOptions({ name: 'LxMetricCard' })

const props = withDefaults(defineProps<LxMetricCardProps>(), {
  title: '',
  label: '',
  value: '',
  unit: '',
  status: undefined,
  badgeText: '',
  badge: '',
  badgeStatus: 'online',
  trend: '',
  trendStatus: 'online',
  progress: undefined,
  progressLabel: '',
  progressValue: '',
  footer: '',
  footerLabel: '',
  footerValue: '',
})

const statusLight: Record<LxStatus, string> = {
  online: 'var(--lx-color-success-light)',
  processing: 'var(--lx-color-primary-light)',
  busy: 'var(--lx-color-warning-light)',
  error: 'var(--lx-color-error-light)',
  offline: 'var(--lx-color-info-light)',
}

const metricValueColors: Record<LxMetricCardStatus, string> = {
  normal: 'var(--lx-color-primary)',
  success: 'var(--lx-color-success-strong)',
  warning: 'var(--lx-metric-warning-color)',
  danger: 'var(--lx-color-error-strong)',
}

const metricTitle = computed(() => props.title || props.label)
const metricStatus = computed<LxMetricCardStatus>(() => {
  if (props.status) return props.status
  if (
    props.valueType === 'success' ||
    props.valueType === 'warning' ||
    props.valueType === 'danger'
  ) {
    return props.valueType
  }
  return 'normal'
})
const metricBadge = computed(() => props.badgeText || props.badge)
const badgeStyle = computed(() => ({
  '--lx-metric-badge-bg': statusLight[props.badgeStatus],
}))
const metricColorStyle = computed(() => ({
  '--lx-metric-value-color': metricValueColors[metricStatus.value],
}))
const progressPercent = computed(() => {
  const value = Number(props.progress ?? 0)
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
})
</script>

<template>
  <article
    class="lx-metric-card"
    :class="`is-${metricStatus}`"
    :style="metricColorStyle"
  >
    <header class="lx-metric-card__header">
      <span class="lx-metric-card__label">
        <slot v-if="$slots.title" name="title">{{ metricTitle }}</slot>
        <slot v-else name="label">{{ metricTitle }}</slot>
      </span>
      <span
        v-if="metricBadge"
        class="lx-metric-card__badge"
        :style="badgeStyle"
      >
        <LxStatusDot :status="badgeStatus" :size="6" :pulse="false" />
        {{ metricBadge }}
      </span>
    </header>

    <div class="lx-metric-card__value-row">
      <div class="lx-metric-card__value-wrap">
        <strong class="lx-metric-card__value">
          <slot name="value">{{ value }}</slot>
        </strong>
        <span v-if="unit" class="lx-metric-card__unit">{{ unit }}</span>
      </div>
      <div v-if="$slots.extra" class="lx-metric-card__extra">
        <slot name="extra" />
      </div>
    </div>

    <p v-if="trend" class="lx-metric-card__trend" :class="`is-${trendStatus}`">
      <LxIcon
        :name="trendStatus === 'error' ? 'arrow-down' : 'arrow-up'"
        :size="12"
      />{{ trend }}
    </p>

    <div
      v-if="progress !== undefined && (progressLabel || progressValue)"
      class="lx-metric-card__progress-caption"
    >
      <span>{{ progressLabel }}</span>
      <strong>{{ progressValue }}</strong>
    </div>

    <div
      v-if="progress !== undefined"
      class="lx-metric-card__progress"
      role="progressbar"
      :aria-label="progressLabel || `${metricTitle || '指标'}进度`"
      :aria-valuenow="progressPercent"
      :aria-valuetext="progressValue || `${progressPercent}%`"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        class="lx-metric-card__progress-value"
        :style="{ '--lx-metric-progress-scale': progressPercent / 100 }"
      />
    </div>

    <footer
      v-if="footer || footerLabel || footerValue || $slots.footer"
      class="lx-metric-card__footer"
    >
      <slot name="footer">
        <span v-if="footer">{{ footer }}</span>
        <template v-else>
          <span>{{ footerLabel }}</span>
          <strong>{{ footerValue }}</strong>
        </template>
      </slot>
    </footer>
  </article>
</template>

<style scoped>
.lx-metric-card {
  --lx-metric-success-text: color-mix(
    in srgb,
    var(--lx-color-success-strong) 70%,
    var(--lx-text-primary)
  );
  --lx-metric-warning-color: color-mix(
    in srgb,
    var(--lx-color-warning-strong) 70%,
    var(--lx-text-primary)
  );
  --lx-metric-warning-text: var(--lx-metric-warning-color);
  --lx-metric-error-text: color-mix(
    in srgb,
    var(--lx-color-error-strong) 90%,
    var(--lx-text-primary)
  );

  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  box-shadow: var(--lx-shadow-card);
}

.lx-metric-card__header,
.lx-metric-card__value-row,
.lx-metric-card__footer,
.lx-metric-card__progress-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  min-width: 0;
}

.lx-metric-card__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.lx-metric-card__unit,
.lx-metric-card__trend,
.lx-metric-card__footer,
.lx-metric-card__progress-caption {
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 18px;
}

.lx-metric-card__badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 1px var(--lx-space-sm);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-metric-badge-bg);
  color: var(--lx-text-regular);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}

.lx-metric-card__value-wrap {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: var(--lx-space-xs);
}

.lx-metric-card__value {
  overflow: hidden;
  color: var(--lx-metric-value-color);
  font-family: var(--lx-font-mono);
  font-size: 24px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 32px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-metric-card__extra {
  flex-shrink: 0;
}

.lx-metric-card__trend {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  margin: 0;
}

.lx-metric-card__trend.is-online,
.lx-metric-card__trend.is-processing {
  color: var(--lx-metric-success-text);
}

.lx-metric-card__trend.is-busy {
  color: var(--lx-metric-warning-text);
}

.lx-metric-card__trend.is-error {
  color: var(--lx-metric-error-text);
}

.lx-metric-card__progress {
  width: 100%;
  min-width: 0;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--lx-border-light);
}

.lx-metric-card__progress-value {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--lx-metric-value-color);
  /* 只缩放固定轨道内的填充层，避免进度更新触发布局。 */
  transform: scaleX(var(--lx-metric-progress-scale));
  transform-origin: left center;
  transition: transform var(--lx-transition);
}

.lx-metric-card__progress-caption {
  overflow-wrap: anywhere;
}

.lx-metric-card__progress-caption strong {
  flex-shrink: 0;
  color: var(--lx-text-regular);
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.lx-metric-card__footer {
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.lx-metric-card__footer strong {
  color: var(--lx-text-primary);
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

@media (max-width: 359px) {
  .lx-metric-card {
    padding: var(--lx-space-md);
  }

  .lx-metric-card__header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

:global(.lx-theme-hud) .lx-metric-card {
  --lx-metric-success-text: var(--lx-color-success-strong);
  --lx-metric-warning-color: var(--lx-color-warning-strong);
  --lx-metric-warning-text: var(--lx-color-warning-strong);
  --lx-metric-error-text: var(--lx-color-error-strong);
}

:global([dir='rtl']) .lx-metric-card__progress-value {
  transform-origin: right center;
}
</style>
