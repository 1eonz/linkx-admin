<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { LxForm, LxFormItem, LxIcon } from '../../../index'
import type { LxFormInstance } from '../../../index'
import LxInput from '../index.vue'
import type { LxInputSize } from '../types'

type LxInputExposes = {
  focus: () => void
  blur: () => void
  select: () => void
}

const size = ref<LxInputSize>('md')
const hudTheme = ref(false)

/** 各示例字段独立状态，避免共用 model 互相覆盖 */
const officerName = ref('张文远')
const officerNameInputRef = ref<LxInputExposes>()
const officerId = ref('33010619890401')
const caseCode = ref('2026-0001')
const password = ref('')
const phoneFormRef = ref<LxFormInstance>()
const phoneForm = reactive({ phone: '1390000' })
const inheritedDisabledForm = reactive({ value: '继承表单禁用状态' })
const phoneRules: FormRules = {
  phone: [
    {
      pattern: /^1\d{10}$/,
      message: '联系电话须为 11 位手机号',
      trigger: 'blur',
    },
  ],
}
const readonlyNode = ref('杭州市公安局西湖区分局 (自动指派)')
const readonlyNote = ref('涉密核验已完成，可选择并复制')
const lastAction = ref('输入内容观察状态；演示数据仅存在于页面内存。')

onMounted(() => {
  phoneFormRef.value?.validateField('phone').catch(() => undefined)
})

function reportChange(field: string, value: string) {
  lastAction.value = `${field} 已输入：${value || '(空)'}`
}

function runInputMethod(method: keyof LxInputExposes) {
  officerNameInputRef.value?.[method]()
  lastAction.value = `已调用 LxInput.${method}()`
}
</script>

<template>
  <div class="lx-input-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-input-demo__toolbar">
      <label>
        尺寸档
        <select v-model="size" aria-label="输入框尺寸档">
          <option value="sm">sm 28px</option>
          <option value="md">md 32px</option>
          <option value="lg">lg 40px</option>
        </select>
      </label>
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-input-demo__panel" data-testid="states">
      <h3>基础四态（设计源 01）</h3>
      <div class="lx-input-demo__grid">
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-officer-name"
            >警员姓名 / 警号</label
          >
          <LxInput
            id="demo-officer-name"
            v-model="officerName"
            ref="officerNameInputRef"
            name="officerName"
            :size="size"
            placeholder="请输入警员姓名/警号"
            clearable
            @change="reportChange('警员姓名', officerName)"
            @clear="lastAction = '警员姓名已清空'"
          />
          <p class="lx-input-demo__tip lx-input-demo__tip--clear">
            <span>桌面有值：悬停/聚焦后显示；</span>
            <span>触屏/窄屏有值：直接显示</span>
          </p>
          <div
            class="lx-input-demo__exposes"
            role="group"
            aria-label="输入框公开方法"
          >
            <button type="button" @click="runInputMethod('focus')">
              聚焦（focus）
            </button>
            <button type="button" @click="runInputMethod('select')">
              全选（select）
            </button>
            <button type="button" @click="runInputMethod('blur')">
              失焦（blur）
            </button>
          </div>
        </div>
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-officer-id">
            <span class="lx-input-demo__required" aria-hidden="true">*</span
            >身份标识编码
          </label>
          <LxInput
            id="demo-officer-id"
            v-model="officerId"
            class="lx-input-demo__focus-example"
            :size="size"
            required
            mono
            :maxlength="18"
            @change="reportChange('身份标识编码', officerId)"
          />
          <p class="lx-input-demo__tip lx-input-demo__tip--focus">
            聚焦态示意：主色边框与 2px 光环；实际键盘聚焦样式一致
          </p>
        </div>
        <div class="lx-input-demo__field">
          <LxForm
            ref="phoneFormRef"
            class="lx-input-demo__validation-form"
            :model="phoneForm"
            :rules="phoneRules"
            label-position="top"
          >
            <LxFormItem label="联系电话" prop="phone">
              <LxInput
                id="demo-phone"
                v-model="phoneForm.phone"
                :size="size"
                inputmode="tel"
                mono
                :maxlength="11"
                show-word-limit
                @change="reportChange('联系电话', phoneForm.phone)"
              />
            </LxFormItem>
          </LxForm>
          <p class="lx-input-demo__tip">
            错误态：修正为 11 位手机号后提示会清除。
          </p>
        </div>
        <div class="lx-input-demo__field">
          <label
            class="lx-input-demo__label lx-input-demo__label--disabled"
            for="demo-node"
          >
            所属分局系统节点（禁用）
          </label>
          <LxInput
            id="demo-node"
            v-model="readonlyNode"
            :size="size"
            disabled
          />
          <p class="lx-input-demo__tip">禁用态：不可聚焦、不可编辑</p>
        </div>
      </div>
    </section>

    <section
      class="lx-input-demo__panel"
      data-testid="validation"
      aria-labelledby="lx-input-validation-title"
    >
      <h3 id="lx-input-validation-title">只读与表单禁用继承</h3>
      <div class="lx-input-demo__grid">
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-readonly-note">
            归档说明（只读，可选择复制）
          </label>
          <LxInput
            id="demo-readonly-note"
            v-model="readonlyNote"
            :size="size"
            readonly
          />
          <p class="lx-input-demo__tip">只读态：可以聚焦和选择内容</p>
        </div>
        <div class="lx-input-demo__field" data-testid="inherited-disabled">
          <LxForm
            class="lx-input-demo__validation-form"
            :model="inheritedDisabledForm"
            disabled
            label-position="top"
          >
            <LxFormItem label="继承表单禁用（含可清空输入框）" prop="value">
              <LxInput
                id="demo-form-disabled"
                v-model="inheritedDisabledForm.value"
                :size="size"
                clearable
              />
            </LxFormItem>
          </LxForm>
          <p class="lx-input-demo__tip">
            表单级禁用会传给字段，清空按钮不可用。
          </p>
        </div>
      </div>
    </section>

    <section class="lx-input-demo__panel" data-testid="addons">
      <h3>前后缀 / 密码 / 透传</h3>
      <div class="lx-input-demo__grid">
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-case-code"
            >案件编码</label
          >
          <LxInput
            id="demo-case-code"
            v-model="caseCode"
            :size="size"
            mono
            placeholder="AJ-2026-0001"
          >
            <template #prepend>AJ</template>
            <template #append>号</template>
            <template #prefix><LxIcon name="file" :size="14" /></template>
            <template #suffix><LxIcon name="tag" :size="14" /></template>
          </LxInput>
          <p class="lx-input-demo__tip">
            prepend/append 复合输入（EP 内核契约）
          </p>
        </div>
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-secret"
            >涉密核验口令</label
          >
          <LxInput
            id="demo-secret"
            v-model="password"
            :size="size"
            type="password"
            show-password
            autocomplete="off"
            placeholder="输入后可切换明文"
          />
          <p class="lx-input-demo__tip">
            showPassword 明暗切换；autocomplete="off"
            仅为浏览器提示，不能保护涉密信息
          </p>
        </div>
      </div>
    </section>

    <p class="lx-input-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-input-demo__note">
      32px 基准高 / 4px 圆角 / 主色 #0060a9 焦点光环由全局令牌桥供给；错误态承接
      LxForm 校验上下文（is-error 红边浅红底深红值）。
    </p>
  </div>
</template>

<style scoped>
.lx-input-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-input-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  font-size: 13px;
}

.lx-input-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-input-demo__toolbar select {
  min-height: 32px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-input-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-input-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-input-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 16px;
}

.lx-input-demo__field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.lx-input-demo__validation-form {
  min-width: 0;
}

:deep(.lx-input-demo__focus-example .el-input__wrapper) {
  box-shadow:
    0 0 0 1px var(--lx-color-primary) inset,
    0 0 0 2px var(--lx-control-focus-halo-color);
}

:deep(.lx-input-demo__validation-form .el-form-item) {
  margin-bottom: 0;
}

:deep(.lx-input-demo__validation-form .el-form-item__error) {
  position: static;
  margin-top: 4px;
  padding-top: 0;
  line-height: 16px;
}

.lx-input-demo__exposes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lx-input-demo__exposes button {
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-input-demo__exposes button:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-input-demo__exposes button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-input-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-input-demo__label--disabled {
  color: var(--lx-text-regular);
}

.lx-input-demo__required {
  margin-right: 4px;
  color: var(--lx-color-error);
  font-weight: 700;
}

.lx-input-demo__status,
.lx-input-demo__note,
.lx-input-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-input-demo__note {
  color: var(--lx-color-warning-text);
}

.lx-input-demo__tip--focus {
  color: var(--lx-color-primary);
}

@media (hover: none), (max-width: 640px) {
  .lx-input-demo__toolbar label {
    min-height: 44px;
  }

  .lx-input-demo__toolbar select {
    min-height: 44px;
  }

  .lx-input-demo__exposes button {
    min-height: 44px;
  }

  .lx-input-demo__exposes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lx-input-demo__exposes button {
    min-width: 0;
    padding-inline: 4px;
  }

  .lx-input-demo__tip--clear span {
    display: block;
  }
}
</style>
