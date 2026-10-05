<script setup lang="ts">
import { ElOption } from 'element-plus'
import { onBeforeUnmount, ref } from 'vue'

import LxSelect from '../index.vue'

const hudTheme = ref(false)

/** 示例段一：基础单选布控等级，对照标本 02 的业务文案。 */
const controlLevel = ref<string>('2')
const controlLevelOptions = [
  { label: '一级布控', value: '1', description: '重点目标' },
  { label: '二级布控', value: '2', description: '持续关注' },
  { label: '三级布控', value: '3', description: '常规监测' },
]
/** 可清空单选：处置通道 */
const channel = ref<string>('encrypted')
/** 示例段二：所属单位多选与折叠展示。 */
const units = ref<string[]>(['city-bureau', 'branch'])
/** 示例段三：可过滤的指挥中心。 */
const commandCenter = ref<string>('')
/** 示例段四：本地模拟值班警员远程检索，不请求后端。 */
const dutyOfficer = ref<string>('')
const remoteLoading = ref(false)
const remoteScenario = ref<'success' | 'empty' | 'error'>('success')
const remoteError = ref('')
const remoteVisible = ref(false)
const remoteQuery = ref('')
const remoteOptions = ref<string[]>([])
const remotePool = [
  '赵国强 031204',
  '钱伟民 031187',
  '孙丽华 031243',
  '李建军 031096',
]
let remoteSeed = 0
let remoteTimer: ReturnType<typeof setTimeout> | undefined

/** 示例段五：禁用状态。 */
const lockedChannel = ref<string>('satellite')

const lastAction = ref(
  '选择选项观察触发器与面板行为；演示数据仅存在于页面内存。',
)

function reportChange(field: string, value: unknown) {
  lastAction.value = `${field} 已选：${Array.isArray(value) ? value.join('、') : value}`
}

/** 远程检索模拟：由宿主提供数据、错误和重试处理，不发起真实请求。 */
function searchOfficer(query: string) {
  const seed = ++remoteSeed
  if (remoteTimer !== undefined) window.clearTimeout(remoteTimer)
  remoteQuery.value = query
  remoteError.value = ''
  remoteLoading.value = true
  remoteTimer = window.setTimeout(() => {
    if (seed !== remoteSeed) return
    if (remoteScenario.value === 'error') {
      remoteOptions.value = []
      remoteError.value = '远程检索暂时失败，请重试。'
    } else if (remoteScenario.value === 'empty') {
      remoteOptions.value = []
    } else {
      remoteOptions.value = remotePool.filter((item) =>
        item.includes(query.trim()),
      )
    }
    remoteLoading.value = false
    remoteTimer = undefined
  }, 600)
}

function retryOfficerSearch() {
  remoteScenario.value = 'success'
  searchOfficer(remoteQuery.value)
}

onBeforeUnmount(() => {
  remoteSeed += 1
  if (remoteTimer !== undefined) window.clearTimeout(remoteTimer)
})
</script>

<template>
  <div class="lx-select-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-select-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-select-demo__panel" data-testid="basic">
      <h4>单选、清空与过滤</h4>
      <div class="lx-select-demo__row">
        <div class="lx-select-demo__field">
          <label class="lx-select-demo__label" for="demo-select-level"
            >布控等级</label
          >
          <LxSelect
            id="demo-select-level"
            v-model="controlLevel"
            :options="controlLevelOptions"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            placeholder="请选择布控等级"
            @change="reportChange('布控等级', $event)"
          >
            <template #option="{ option }">
              <span class="lx-select-demo__option-label">{{
                option.label
              }}</span>
              <small
                v-if="option.description"
                class="lx-select-demo__option-description"
                >{{ option.description }}</small
              >
            </template>
          </LxSelect>
        </div>
        <div class="lx-select-demo__field">
          <label class="lx-select-demo__label" for="demo-select-channel"
            >处置通道（可清空）</label
          >
          <LxSelect
            id="demo-select-channel"
            v-model="channel"
            clearable
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            placeholder="请选择处置通道"
            @change="reportChange('处置通道', $event)"
            @clear="lastAction = '处置通道已清空'"
          >
            <ElOption label="高密加密专线" value="encrypted" />
            <ElOption label="卫星应急链路" value="satellite" />
            <ElOption label="视频会商通道" value="video" />
          </LxSelect>
        </div>
        <div class="lx-select-demo__field">
          <label class="lx-select-demo__label" for="demo-select-center"
            >指挥中心（可过滤）</label
          >
          <LxSelect
            id="demo-select-center"
            v-model="commandCenter"
            filterable
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            placeholder="输入关键字检索"
            @change="reportChange('指挥中心', $event)"
          >
            <template #header>
              <span class="lx-select-demo__slot-note">按区域筛选</span>
            </template>
            <ElOption label="市局指挥中心" value="city" />
            <ElOption label="城东分局指挥室" value="east" />
            <ElOption label="城西分局指挥室" value="west" />
            <ElOption label="高新区指挥室" value="hi-tech" />
            <template #footer>
              <span class="lx-select-demo__slot-note">共 4 个指挥中心</span>
            </template>
          </LxSelect>
        </div>
      </div>
    </section>

    <section class="lx-select-demo__panel" data-testid="multiple">
      <h4>多选与折叠（超出折叠为 +N，悬停可见完整列表）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-units"
          >协同单位</label
        >
        <LxSelect
          id="demo-select-units"
          v-model="units"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          placeholder="请选择协同单位"
          @change="reportChange('协同单位', $event)"
          @remove-tag="lastAction = `已移除：${$event}`"
        >
          <ElOption label="市局指挥中心" value="city-bureau" />
          <ElOption label="分局合成作战中心" value="branch" />
          <ElOption label="交警支队" value="traffic" />
          <ElOption label="特巡警支队" value="patrol" />
          <ElOption
            label="反恐怖与特巡警支队（离线）"
            value="counter-terrorism"
            disabled
          />
        </LxSelect>
      </div>
    </section>

    <section class="lx-select-demo__panel" data-testid="remote">
      <h4>远程检索</h4>
      <label class="lx-select-demo__scenario">
        模拟结果
        <select
          v-model="remoteScenario"
          aria-label="远程检索模拟结果"
          @change="searchOfficer(remoteQuery)"
        >
          <option value="success">成功</option>
          <option value="empty">空结果</option>
          <option value="error">请求失败</option>
        </select>
      </label>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-officer"
          >值班警员</label
        >
        <LxSelect
          id="demo-select-officer"
          v-model="dutyOfficer"
          filterable
          remote
          :remote-method="searchOfficer"
          :loading="remoteLoading"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          :aria-describedby="
            remoteError ? 'demo-select-officer-error' : undefined
          "
          placeholder="输入警号或姓名检索"
          @change="reportChange('值班警员', $event)"
          @visible-change="remoteVisible = $event"
        >
          <ElOption
            v-for="item in remoteOptions"
            :key="item"
            :label="item"
            :value="item"
          />
          <template #empty>
            <span v-if="remoteError" aria-hidden="true">{{ remoteError }}</span>
            <span v-else>没有匹配的值班警员</span>
          </template>
          <template v-if="remoteError && remoteVisible" #footer>
            <button
              class="lx-select-demo__remote-retry"
              type="button"
              @click="retryOfficerSearch"
            >
              重试
            </button>
          </template>
        </LxSelect>
        <div
          v-if="remoteError"
          id="demo-select-officer-error"
          :class="{
            'lx-select-demo__remote-error--visually-hidden': remoteVisible,
          }"
          class="lx-select-demo__remote-error"
          role="alert"
        >
          <span>{{ remoteError }}</span>
          <button
            v-if="!remoteVisible"
            class="lx-select-demo__remote-retry"
            type="button"
            @click="retryOfficerSearch"
          >
            重试
          </button>
        </div>
      </div>
      <p class="lx-select-demo__hint">示例只使用本地数据，不发起网络请求。</p>
    </section>

    <section class="lx-select-demo__panel" data-testid="disabled">
      <h4>禁用态（半透明 + 禁用手势）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-locked"
          >应急链路（锁定）</label
        >
        <LxSelect
          id="demo-select-locked"
          :model-value="lockedChannel"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          disabled
        >
          <ElOption label="卫星应急链路" value="satellite" />
          <ElOption label="高密加密专线" value="encrypted" />
        </LxSelect>
      </div>
    </section>

    <p class="lx-select-demo__status" aria-live="polite">{{ lastAction }}</p>
  </div>
</template>

<style scoped>
.lx-select-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-select-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-select-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-select-demo__scenario {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  font-size: 12px;
  color: var(--lx-text-label);
}

.lx-select-demo__scenario select {
  min-height: 32px;
  max-width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--lx-control-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-select-demo__scenario select:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-select-demo__option-label {
  margin-right: 8px;
}

.lx-select-demo__option-description {
  color: var(--lx-text-secondary);
  font-size: 11px;
}

.lx-select-demo__slot-note {
  display: block;
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.lx-select-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-select-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-select-demo__row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lx-select-demo__field {
  display: grid;
  flex: 1 1 200px;
  gap: 4px;
  min-width: 0;
}

.lx-select-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-select-demo__field .lx-select {
  width: 100%;
}

.lx-select-demo__hint,
.lx-select-demo__status {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary);
}

.lx-select-demo__remote-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--lx-color-error-strong);
  font-size: 12px;
}

.lx-select-demo__remote-error--visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.lx-select-demo__remote-retry {
  display: block;
  margin: 0 auto;
  min-width: 44px;
  min-height: 44px;
  padding: 0 8px;
  border: 1px solid var(--lx-color-error);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-color-error-strong);
  cursor: pointer;
}

.lx-select-demo__remote-retry:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (max-width: 375px) {
  .lx-select-demo {
    padding: 12px;
  }
}
</style>
