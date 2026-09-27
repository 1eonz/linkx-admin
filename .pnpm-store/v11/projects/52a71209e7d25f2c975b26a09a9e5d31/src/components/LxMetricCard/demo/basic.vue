<script setup lang="ts">
import LxMetricCard from '../index.vue'
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
</style>
