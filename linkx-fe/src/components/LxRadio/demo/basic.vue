<script setup lang="ts">
import { ref } from 'vue'
import LxRadio from '../index.vue'
import LxRadioGroup from '../../LxRadioGroup/index.vue'
import type { LxRadioValue } from '../types'

const hudTheme = ref(false)

/** 水平排布：勤务响应等级（标本 03 上行） */
const responseLevel = ref<LxRadioValue>('daily')
/** 垂直排布：处置通道优先级（标本 03 下行） */
const channel = ref<LxRadioValue>('encrypted')

const lastAction = ref('点选选项观察靶环选中态；演示数据仅存在于页面内存。')

function reportChange(field: string, value: LxRadioValue | undefined) {
  lastAction.value = `${field} 选中：${String(value ?? '(空)')}`
}
</script>

<template>
  <div class="lx-radio-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-radio-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-radio-demo__panel" data-testid="horizontal">
      <h4>水平排布（标本 03 勤务响应等级）</h4>
      <LxRadioGroup
        v-model="responseLevel"
        @change="reportChange('响应等级', $event)"
      >
        <LxRadio value="daily">日常勤务</LxRadio>
        <LxRadio value="emergency">应急处突</LxRadio>
        <LxRadio value="security">特勤安保</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        选中态：白底蓝心靶环（14px 圆环 + 6px 靶心）+ 主色文字
      </p>
    </section>

    <section class="lx-radio-demo__panel" data-testid="vertical">
      <h4>垂直排布含禁用（标本 03 处置通道优先级）</h4>
      <LxRadioGroup
        v-model="channel"
        vertical
        @change="reportChange('处置通道', $event)"
      >
        <LxRadio value="encrypted">高密加密专线 (当前激活)</LxRadio>
        <LxRadio value="satellite" disabled>卫星链路直通 (未联通/禁用)</LxRadio>
        <LxRadio value="fiber">光纤骨干网</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        vertical 列排 8px 行距；禁用项灰底描边灰字不可选
      </p>
    </section>

    <section class="lx-radio-demo__panel" data-testid="legacy">
      <h4>label 兼作选中值（EP 旧契约兼容）</h4>
      <LxRadioGroup
        v-model="channel"
        @change="reportChange('旧契约通道', $event)"
      >
        <!-- 未传 value 时 label 按 EP 旧契约兼作选中值，存量代码迁移零改动 -->
        <LxRadio label="encrypted">高密加密专线</LxRadio>
        <LxRadio label="fiber">光纤骨干网</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        未传 value 时 label 兼作选中值（EP 旧用法兼容）
      </p>
    </section>

    <p class="lx-radio-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-radio-demo__note">
      选中"白底蓝心靶环"替代 EP 默认蓝底白心；hover
      描边与文字同步转主色；键盘焦点主色外环。
    </p>
  </div>
</template>

<style scoped>
.lx-radio-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-radio-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-radio-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-radio-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-radio-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-radio-demo__status,
.lx-radio-demo__note,
.lx-radio-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary);
}

.lx-radio-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
