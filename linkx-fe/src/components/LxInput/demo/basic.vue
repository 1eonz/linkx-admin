<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import LxInput from '../index.vue'
import type { LxInputSize } from '../types'
import { LxForm, LxFormItem } from '../../../index'
import type { LxFormInstance } from '../../../index'

const size = ref<LxInputSize>('md')
const hudTheme = ref(false)

/** 各示例字段独立状态，避免共用 model 互相覆盖 */
const officerName = ref('')
const officerId = ref('33010619890401')
const phoneFormRef = ref<LxFormInstance>()
const phoneForm = reactive({ phone: '1390000' })
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
const lastAction = ref('输入内容观察状态；演示数据仅存在于页面内存。')

onMounted(() => {
  phoneFormRef.value?.validateField('phone').catch(() => undefined)
})

function reportChange(field: string, value: string) {
  lastAction.value = `${field} 已输入：${value || '(空)'}`
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
      <h4>基础状态（标本八件套 01 四态）</h4>
      <div class="lx-input-demo__grid">
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-officer-name"
            >警员姓名 / 警号</label
          >
          <LxInput
            id="demo-officer-name"
            v-model="officerName"
            :size="size"
            placeholder="请输入警员姓名/警号"
            clearable
            @change="reportChange('警员姓名', officerName)"
            @clear="lastAction = '警员姓名已清空'"
          />
          <p class="lx-input-demo__tip">默认态，支持 clearable 清除</p>
        </div>
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-officer-id">
            <span class="lx-input-demo__required">*</span>身份标识编码
          </label>
          <LxInput
            id="demo-officer-id"
            v-model="officerId"
            :size="size"
            mono
            :maxlength="18"
            @change="reportChange('身份标识编码', officerId)"
          />
          <p class="lx-input-demo__tip">
            mono 等宽值：聚焦主色边框 + 光环（全局桥供给）
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
                mono
                :maxlength="11"
                show-word-limit
                @change="reportChange('联系电话', phoneForm.phone)"
              />
            </LxFormItem>
          </LxForm>
          <p class="lx-input-demo__tip">
            当前以无效号码展示真实校验错误；改为 11 位手机号后错误会清除
          </p>
        </div>
        <div class="lx-input-demo__field">
          <label
            class="lx-input-demo__label lx-input-demo__label--disabled"
            for="demo-node"
          >
            所属分局系统节点 (只读)
          </label>
          <LxInput
            id="demo-node"
            v-model="readonlyNode"
            :size="size"
            disabled
          />
          <p class="lx-input-demo__tip">禁用只读态：灰底锁定不可变</p>
        </div>
      </div>
    </section>

    <section class="lx-input-demo__panel" data-testid="addons">
      <h4>前后缀 / 密码 / 透传</h4>
      <div class="lx-input-demo__grid">
        <div class="lx-input-demo__field">
          <label class="lx-input-demo__label" for="demo-case-code"
            >案件编码</label
          >
          <LxInput
            id="demo-case-code"
            v-model="officerName"
            :size="size"
            mono
            placeholder="AJ-2026-0001"
          >
            <template #prepend>AJ</template>
            <template #append>号</template>
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
            v-model="officerName"
            :size="size"
            type="password"
            show-password
            autocomplete="off"
            placeholder="输入后可切换明文"
          />
          <p class="lx-input-demo__tip">
            showPassword 明暗切换；涉密字段 autocomplete 关闭
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

.lx-input-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-input-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

:deep(.lx-input-demo__validation-form .el-form-item) {
  margin-bottom: 0;
}

.lx-input-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-input-demo__label--disabled {
  color: var(--lx-text-placeholder);
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
  color: var(--lx-color-warning-strong);
}
</style>
