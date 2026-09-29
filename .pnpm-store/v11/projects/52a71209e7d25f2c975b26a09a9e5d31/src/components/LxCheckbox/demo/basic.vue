<script setup lang="ts">
import { computed, ref } from 'vue'
import LxCheckbox from '../index.vue'
import LxCheckboxGroup from '../../LxCheckboxGroup/index.vue'

const hudTheme = ref(false)

/** 组内多选：关联授权业务权限（标本 04）；组值集合对齐 EP 契约（string | number 数组） */
const permissions = ref<(string | number)[]>(['video'])
/** 独立复选：单条承诺确认 */
const agreed = ref(false)

const ALL_PERMISSIONS: (string | number)[] = ['video', 'dispatch', 'broadcast']

/** 父级"全部授权"勾选态：由子集推导（全选/半选/未选三态联动） */
const allToggled = computed(
  () => permissions.value.length === ALL_PERMISSIONS.length,
)
/** 半选态：部分下属权限已勾选（标本 04 Indeterminate 行） */
const someChecked = computed(
  () =>
    permissions.value.length > 0 &&
    permissions.value.length < ALL_PERMISSIONS.length,
)

function toggleAll(next: string | number | boolean) {
  permissions.value = next ? [...ALL_PERMISSIONS] : []
}

const lastAction = ref(
  '勾选观察三态（选中/半选/未选）；演示数据仅存在于页面内存。',
)
</script>

<template>
  <div class="lx-checkbox-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-checkbox-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-checkbox-demo__panel" data-testid="group">
      <h4>复选组（标本 04 关联授权业务权限）</h4>
      <LxCheckbox
        :model-value="allToggled"
        :indeterminate="someChecked"
        @update:model-value="toggleAll"
      >
        全部授权
      </LxCheckbox>
      <LxCheckboxGroup v-model="permissions">
        <LxCheckbox value="video">视频巡查权限 (已授权)</LxCheckbox>
        <LxCheckbox value="dispatch">警单流转</LxCheckbox>
        <LxCheckbox value="broadcast">全网广播调度</LxCheckbox>
        <LxCheckbox value="cross" disabled
          >重特大警情跨区移送 (需支队审批)</LxCheckbox
        >
      </LxCheckboxGroup>
      <p class="lx-checkbox-demo__tip">
        选中白勾 / 半选横杠（主色填充）；hover 描边与文字同步转主色；禁用项灰字
      </p>
    </section>

    <section class="lx-checkbox-demo__panel" data-testid="standalone">
      <h4>独立复选与垂直排布</h4>
      <LxCheckbox v-model="agreed">已知晓涉密核验义务并承诺遵守</LxCheckbox>
      <LxCheckboxGroup v-model="permissions" vertical>
        <LxCheckbox value="video">视频巡查权限</LxCheckbox>
        <LxCheckbox value="dispatch">警单流转</LxCheckbox>
        <LxCheckbox value="broadcast">全网广播调度</LxCheckbox>
      </LxCheckboxGroup>
      <p class="lx-checkbox-demo__tip">
        vertical 列排 12px 行距（标本 04 权限列表）
      </p>
    </section>

    <p class="lx-checkbox-demo__status" aria-live="polite">
      当前授权：{{ permissions.length ? permissions.join(' / ') : '无' }}；
      承诺{{ agreed ? '已' : '未' }}勾选
    </p>
    <p class="lx-checkbox-demo__note">
      选中/半选主色填充白勾/横杠为 EP 原生契约；hover 文字转主色为 Lx 增量规格。
    </p>
  </div>
</template>

<style scoped>
.lx-checkbox-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-checkbox-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-checkbox-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-checkbox-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-checkbox-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-checkbox-demo__status,
.lx-checkbox-demo__note,
.lx-checkbox-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary);
}

.lx-checkbox-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
