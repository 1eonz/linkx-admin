<script setup lang="ts">
import { ref } from 'vue'

import LxIcon from '../../LxIcon/index.vue'
import LxMetricCard from '../index.vue'

const retryMessage = ref('')
</script>

<template>
  <section class="metric-card-demo" aria-label="指标卡示例">
    <div class="metric-card-demo__grid">
      <LxMetricCard
        title="设备在线率"
        :value="99.9"
        unit="%"
        status="success"
        badge-text="环比 +0.8%"
        badge-status="online"
        trend="全部边缘节点与接入感知终端运行正常"
        trend-status="online"
        :progress="99.9"
        progress-label="在线健康指标"
        progress-value="12,842 / 12,850 台"
      />
      <LxMetricCard
        title="平均响应时长"
        :value="4.2"
        unit="秒"
        status="warning"
        badge-text="便于基准 0.5s"
        badge-status="busy"
        trend="跨专网隧道回查耗时轻微回退"
        trend-status="busy"
        trend-direction="down"
        :progress="84"
        progress-label="预警处置阈值"
        progress-value="84.0% 负荷"
      />
      <LxMetricCard
        title="高危未处理警情"
        :value="18"
        unit="件"
        status="danger"
        badge-text="急需处置"
        badge-status="error"
        trend="含 3 起控制柜失联告警与专网中断事件"
        trend-status="error"
        :progress="62.5"
        progress-label="待办积压率"
        progress-value="62.5%"
      />
      <LxMetricCard
        title="策略同步任务"
        :value="128"
        unit="项"
        status="normal"
        badge-text="保持稳定"
        badge-status="processing"
        trend="近 24 小时任务完成量保持稳定"
        trend-status="online"
        trend-direction="flat"
      />
    </div>

    <div class="metric-card-demo__legacy">
      <LxMetricCard
        title="今日警情总数"
        :value="1247"
        value-type="warning"
        footer="较昨日增加 12%"
      >
        <template #extra
          ><span class="metric-card-demo__extra"
            >兼容旧 extra 插槽</span
          ></template
        >
      </LxMetricCard>
    </div>

    <section class="metric-card-demo__decision" aria-label="状态组合决策示例">
      <div class="metric-card-demo__decision-copy">
        <h3>状态组合决策</h3>
        <p>
          显式 status 覆盖旧 valueType；trendDirection
          只决定趋势图标；badgeStatus 独立描述角标状态。
        </p>
      </div>
      <LxMetricCard
        title="冲突状态示例"
        value="需人工确认"
        value-type="danger"
        status="success"
        badge-text="接口正常"
        badge-status="online"
        trend="数值异常但趋势向上"
        trend-status="error"
        trend-direction="up"
      />
    </section>

    <section class="metric-card-demo__host-states" aria-label="宿主状态组合">
      <h3>宿主状态组合（数据请求由页面负责）</h3>
      <div class="metric-card-demo__state-grid">
        <div
          class="metric-card-demo__state"
          data-testid="host-loading"
          aria-busy="true"
        >
          <LxIcon
            class="metric-card-demo__state-icon"
            name="loading"
            :size="16"
            aria-hidden="true"
          />
          <strong>指标加载中</strong>
          <span>请求完成后再渲染 LxMetricCard</span>
        </div>
        <div class="metric-card-demo__state" data-testid="host-empty">
          <strong>暂无指标数据</strong>
          <span>调整筛选条件或等待下一次采集</span>
        </div>
        <div
          class="metric-card-demo__state metric-card-demo__state--error"
          data-testid="host-error"
          role="alert"
        >
          <strong>指标加载失败</strong>
          <span aria-live="polite">{{
            retryMessage || '请检查网络后重试，失败不会显示为 0'
          }}</span>
          <button type="button" @click="retryMessage = '重试请求已提交'">
            重试
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.metric-card-demo {
  display: grid;
  gap: var(--lx-space-lg);
}

.metric-card-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--lx-space-md);
}

.metric-card-demo__legacy {
  width: min(100%, 420px);
}

.metric-card-demo__extra {
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.metric-card-demo__decision {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: var(--lx-space-md);
  align-items: start;
  padding: var(--lx-space-md);
  border: 1px dashed var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-page);
}

.metric-card-demo__decision-copy {
  min-width: 0;
}

.metric-card-demo__decision-copy h3,
.metric-card-demo__decision-copy p {
  margin: 0;
}

.metric-card-demo__decision-copy h3 {
  color: var(--lx-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.metric-card-demo__decision-copy p {
  margin-block-start: var(--lx-space-xs);
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.metric-card-demo__host-states {
  display: grid;
  gap: var(--lx-space-sm);
}

.metric-card-demo__host-states h3 {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 13px;
  font-weight: 600;
}

.metric-card-demo__state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: var(--lx-space-sm);
}

.metric-card-demo__state {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-xs);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 18px;
}

.metric-card-demo__state-icon {
  color: var(--lx-color-primary);
}

.metric-card-demo__state--error {
  border-color: var(--lx-color-error-border);
  background: var(--lx-color-form-error-bg);
}

@media (max-width: 640px) {
  .metric-card-demo__decision {
    grid-template-columns: minmax(0, 1fr);
  }
}

.metric-card-demo__state button {
  width: fit-content;
  min-height: 44px;
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-color-error);
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-color-error-strong);
  cursor: pointer;
}
</style>
