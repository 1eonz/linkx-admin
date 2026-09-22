<script setup lang="ts">
/**
 * LxSidebarBrand — 品牌区（盾徽 + 同心环呼吸 + 标题）
 * 视觉源：stitch_侧边栏 _2 品牌头（h-16 / w-10 rounded-lg）+ _1 同心环 hudPulse
 */
import LxIcon from '../LxIcon/index.vue';

withDefaults(
  defineProps<{
    /** 主标题（rail 态隐藏） */
    title?: string;
    /** 副标题 */
    subtitle?: string;
    mode?: 'rail' | 'expanded';
  }>(),
  { title: '警务业务协同平台', subtitle: '', mode: 'expanded' }
);
</script>

<template>
  <div class="lx-sidebar-brand" :class="`lx-sidebar-brand--${mode}`">
    <!-- rail 态：w-9 徽标 + 双层同心环（_1 规格） -->
    <div v-if="mode === 'rail'" class="lx-sidebar-brand__logo-rail">
      <span class="lx-sidebar-brand__halo" />
      <span class="lx-sidebar-brand__ring-rail" />
      <span class="lx-sidebar-brand__box">
        <LxIcon name="shield" :size="20" />
      </span>
    </div>

    <!-- expanded 态：w-10 圆角方形徽标 + 外圈呼吸环（_2 规格） -->
    <template v-else>
      <div class="lx-sidebar-brand__logo">
        <span class="lx-sidebar-brand__ring" />
        <LxIcon name="shield" :size="20" />
      </div>
      <div class="lx-sidebar-brand__text">
        <div class="lx-sidebar-brand__title">{{ title }}</div>
        <div v-if="subtitle" class="lx-sidebar-brand__subtitle">{{ subtitle }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lx-sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--lx-space-md);
  padding: 0 var(--lx-space-lg);
  height: var(--lx-sidebar-brand-height); /* 64px（_1/_2 一致） */
  background: var(--lx-sidebar-bg-header);
  border-bottom: 1px solid var(--lx-sidebar-border);
  overflow: hidden;
  flex-shrink: 0;
}

.lx-sidebar-brand--rail {
  justify-content: center;
  padding: 0;
}

/* —— expanded 徽标：w-10 h-10 rounded-lg 渐变底（_2） —— */
.lx-sidebar-brand__logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--lx-radius-lg);
  color: var(--lx-sidebar-active-glow);
  background: linear-gradient(to bottom, #1b2b44, #0b1322);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
  flex-shrink: 0;
}

.lx-sidebar-brand__ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid var(--lx-sidebar-active-glow);
  opacity: 0.35;
  animation: lx-hud-pulse 3.5s ease-in-out infinite;
}

.lx-sidebar-brand__text {
  min-width: 0;
}

.lx-sidebar-brand__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--lx-text-on-dark);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.lx-sidebar-brand__subtitle {
  font-size: 11px;
  color: var(--lx-sidebar-text-muted);
  white-space: nowrap;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: var(--lx-font-mono);
}

/* —— rail 徽标：w-9 + 双层同心环（_1 规格） —— */
.lx-sidebar-brand__logo-rail {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
}

.lx-sidebar-brand__box {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--lx-radius-lg);
  color: var(--lx-sidebar-active-glow);
  background: linear-gradient(to bottom, #1e2f47, #0f172a);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
  transition: transform var(--lx-transition);
}

.lx-sidebar-brand__logo-rail:hover .lx-sidebar-brand__box {
  transform: scale(1.05);
}

/* 外圈 halo：w-14 */
.lx-sidebar-brand__halo {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(14, 165, 233, 0.2);
  animation: lx-hud-pulse 3.5s ease-in-out infinite;
}

/* 内圈虚线环：w-11 */
.lx-sidebar-brand__ring-rail {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px dashed rgba(56, 189, 248, 0.3);
}
</style>
