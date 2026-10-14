<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ElOption } from 'element-plus'
import type { FormRules } from 'element-plus'
import { nextTick, onBeforeUnmount, reactive, ref } from 'vue'

import { LxButton, LxForm, LxFormItem } from '../../../index'
import type { LxFormInstance } from '../../../index'
import LxSelect from '../index.vue'

const hudTheme = ref(false)

type DemoSelectOption = {
  label: string
  value: string
  description?: string
  disabled?: boolean
}

/** 示例段一：基础单选布控等级，对照标本 02 的业务文案。 */
const controlLevel = ref<string>('2')
const controlLevelOptions: DemoSelectOption[] = [
  { label: '一级布控', value: '1', description: '重点目标' },
  { label: '二级布控', value: '2', description: '持续关注' },
  { label: '三级布控', value: '3', description: '常规监测' },
]
/** 可清空单选：处置通道 */
const channel = ref<string>('encrypted')
const channelOptions: DemoSelectOption[] = [
  { label: '高密加密专线', value: 'encrypted' },
  { label: '卫星应急链路', value: 'satellite' },
  { label: '视频会商通道', value: 'video' },
]
/** 示例段二：所属单位多选与折叠展示。 */
const unitsFormRef = ref<LxFormInstance>()
const unitsSelectRef = ref<{ focus: () => void }>()
const unitsForm = reactive({ units: ['city-bureau', 'branch'] })
const minimumUnitsSelection = 3
const unitsFormRules: FormRules = {
  units: [
    {
      validator: (_rule, value: unknown) =>
        Array.isArray(value) && value.length >= minimumUnitsSelection
          ? Promise.resolve()
          : Promise.reject(
              new Error(`至少选择 ${minimumUnitsSelection} 个协同单位`),
            ),
      trigger: 'change',
    },
  ],
}
const unitsValidationFeedback = ref('')
const unitsValidationIsError = ref(false)
const unitOptions: DemoSelectOption[] = [
  { label: '市局指挥中心', value: 'city-bureau' },
  { label: '分局合成作战中心', value: 'branch' },
  { label: '交警支队', value: 'traffic' },
  {
    label: '反恐怖与特巡警支队（离线）',
    value: 'counter-terrorism',
    disabled: true,
  },
]
/** 示例段三：可过滤的指挥中心。 */
const commandCenter = ref<string>('')
const commandCenterOptions: DemoSelectOption[] = [
  { label: '市局指挥中心', value: 'city' },
  { label: '城东分局指挥室', value: 'east' },
  { label: '城西分局指挥室', value: 'west' },
  { label: '高新区指挥室', value: 'hi-tech' },
]
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
const remoteFeedbackOptions: DemoSelectOption[] = remotePool.map((item) => ({
  label: item,
  value: item,
}))
let remoteSeed = 0
let remoteTimer: ReturnType<typeof setTimeout> | undefined

/** 示例段五：禁用状态。 */
const lockedChannel = ref<string>('satellite')
const lockedUnits = ['city-bureau', 'branch', 'traffic']

const actionStatus = reactive({
  basic: '',
  units: '',
  remote: '',
})

function reportChange(
  group: keyof typeof actionStatus,
  field: string,
  value: unknown,
  options: readonly DemoSelectOption[],
) {
  const values = Array.isArray(value) ? value : [value]
  const labels = values.map((selectedValue) => {
    if (selectedValue == null) return '未选择'
    return (
      options.find((option) => option.value === selectedValue)?.label ??
      '未命名选项'
    )
  })
  actionStatus[group] = `${field} 已选：${labels.join('、')}`
}

function reportUnitRemoval(value: unknown) {
  const label =
    unitOptions.find((option) => option.value === value)?.label ?? '未命名选项'
  actionStatus.units = `已移除：${label}`
}

function updateUnits(value: unknown) {
  if (!Array.isArray(value)) return
  const selectedValues = value.filter(
    (item): item is string => typeof item === 'string',
  )
  if (selectedValues.length === value.length) {
    unitsForm.units = selectedValues
    unitsValidationFeedback.value = ''
    unitsValidationIsError.value = false
  }
}

function validateUnits() {
  unitsFormRef.value
    ?.validate()
    .then(() => {
      unitsValidationIsError.value = false
      unitsValidationFeedback.value = `校验通过：已选择 ${unitsForm.units.length} 个协同单位`
    })
    .catch(() => {
      unitsValidationIsError.value = true
      const remaining = minimumUnitsSelection - unitsForm.units.length
      unitsValidationFeedback.value = `当前已选 ${unitsForm.units.length} 项，还需 ${remaining} 项`
      void nextTick(() => unitsSelectRef.value?.focus())
    })
}

function getUnitsSummaryLabel(count?: number): string {
  return count === undefined
    ? '展开选择列表'
    : `展开选择列表，另有 ${count} 项已选`
}

function resetUnits() {
  unitsFormRef.value?.resetFields()
  actionStatus.units = `已恢复示例默认选择：${unitsForm.units
    .map(
      (value) =>
        unitOptions.find((option) => option.value === value)?.label ??
        '未命名选项',
    )
    .join('、')}`
  unitsValidationFeedback.value = ''
  unitsValidationIsError.value = false
}

function getControlLevelDescription(value: unknown) {
  return controlLevelOptions.find((option) => option.value === value)
    ?.description
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
      <h3>单选、清空与过滤</h3>
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
            @change="
              reportChange('basic', '布控等级', $event, controlLevelOptions)
            "
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
            <template #label="{ label, value }">
              <span class="lx-select-demo__selected-label">
                {{ label }}
                <template v-if="getControlLevelDescription(value)">
                  （{{ getControlLevelDescription(value) }}）
                </template>
              </span>
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
            @change="reportChange('basic', '处置通道', $event, channelOptions)"
            @clear="actionStatus.basic = '处置通道已清空'"
          >
            <ElOption
              v-for="option in channelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
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
            :suffix-icon="Search"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            placeholder="输入关键字检索"
            @change="
              reportChange('basic', '指挥中心', $event, commandCenterOptions)
            "
          >
            <template #header>
              <span class="lx-select-demo__slot-note">按区域筛选</span>
            </template>
            <ElOption
              v-for="option in commandCenterOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
            <template #footer>
              <span class="lx-select-demo__slot-note">共 4 个指挥中心</span>
            </template>
          </LxSelect>
        </div>
      </div>
      <p class="lx-select-demo__status" aria-live="polite">
        {{ actionStatus.basic }}
      </p>
    </section>

    <section class="lx-select-demo__panel" data-testid="multiple">
      <h3>多选与折叠（超出折叠为 +N，打开下拉查看完整列表）</h3>
      <LxForm
        ref="unitsFormRef"
        class="lx-select-demo__validation-form"
        :model="unitsForm"
        :rules="unitsFormRules"
        label-position="top"
        :data-selected-count="unitsForm.units.length"
      >
        <LxFormItem label="协同单位" prop="units">
          <LxSelect
            ref="unitsSelectRef"
            id="demo-select-units"
            :model-value="unitsForm.units"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :collapse-summary-aria-label="getUnitsSummaryLabel"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            aria-describedby="demo-select-units-help"
            placeholder="请选择协同单位"
            @update:modelValue="updateUnits"
            @change="reportChange('units', '协同单位', $event, unitOptions)"
            @remove-tag="reportUnitRemoval($event)"
          >
            <ElOption
              v-for="option in unitOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </LxSelect>
          <p id="demo-select-units-help" class="lx-select-demo__hint">
            默认已选市局指挥中心和分局合成作战中心；至少选择 3 个协同单位。
          </p>
        </LxFormItem>
        <div class="lx-select-demo__validation-actions">
          <LxButton type="primary" @click="validateUnits">提交校验</LxButton>
          <LxButton @click="resetUnits">恢复示例默认值</LxButton>
        </div>
      </LxForm>
      <p class="lx-select-demo__status" aria-live="polite">
        {{ actionStatus.units }}
      </p>
      <p
        v-if="unitsValidationFeedback"
        class="lx-select-demo__status"
        :class="{ 'is-error': unitsValidationIsError }"
        role="status"
        aria-live="polite"
      >
        {{ unitsValidationFeedback }}
      </p>
    </section>

    <section class="lx-select-demo__panel" data-testid="remote">
      <h3>远程检索</h3>
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
          @change="
            reportChange('remote', '值班警员', $event, remoteFeedbackOptions)
          "
          @visible-change="remoteVisible = $event"
        >
          <ElOption
            v-for="item in remoteOptions"
            :key="item"
            :label="item"
            :value="item"
          />
          <template #empty>
            <span v-if="remoteLoading" role="status">正在检索值班警员…</span>
            <span v-else-if="remoteError" aria-hidden="true">{{
              remoteError
            }}</span>
            <span v-else>没有匹配的值班警员，请调整姓名或警号后重试</span>
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
      <p class="lx-select-demo__status" aria-live="polite">
        {{ actionStatus.remote }}
      </p>
    </section>

    <section class="lx-select-demo__panel" data-testid="disabled">
      <h3>禁用态（保留值可读性 + 禁用手势）</h3>
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
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-locked-units"
          >协同单位（禁用）</label
        >
        <LxSelect
          id="demo-select-locked-units"
          :model-value="lockedUnits"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="1"
          disabled
        >
          <ElOption
            v-for="option in unitOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
            :disabled="option.disabled"
          />
        </LxSelect>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lx-select-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-page);
}

.lx-select-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-select-demo__toolbar label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.lx-select-demo__scenario {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 32px;
  font-size: 12px;
  color: var(--lx-text-label);
}

.lx-select-demo__scenario select {
  min-width: 132px;
  max-width: 100%;
  min-height: 32px;
  padding: 4px 8px;
  color: var(--lx-text-primary);
  cursor: pointer;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-control-border);
  border-radius: var(--lx-radius-sm);
}

@media (max-width: 640px) {
  .lx-select-demo__toolbar label {
    min-height: 44px;
  }

  .lx-select-demo__scenario select {
    min-height: 44px;
  }
}

.lx-select-demo__scenario select:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-select-demo__option-label {
  margin-right: 8px;
}

.lx-select-demo__option-description {
  font-size: 11px;
  color: var(--lx-text-secondary-strong);
}

.lx-select-demo__selected-label {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-select-demo__slot-note {
  display: block;
  font-size: 12px;
  line-height: 1.5;
  color: var(--lx-text-secondary);
}

.lx-select-demo__panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-select-demo__panel h3 {
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
  color: var(--lx-text-secondary-strong);
}

.lx-select-demo__status.is-error {
  color: var(--lx-color-form-error);
}

.lx-select-demo__validation-form {
  max-width: 480px;
}

.lx-select-demo__validation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-select-demo__remote-error {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--lx-color-error-strong);
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
  min-width: 44px;
  min-height: 44px;
  padding: 0 8px;
  margin: 0 auto;
  color: var(--lx-color-error-strong);
  cursor: pointer;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-color-error);
  border-radius: var(--lx-radius-sm);
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
