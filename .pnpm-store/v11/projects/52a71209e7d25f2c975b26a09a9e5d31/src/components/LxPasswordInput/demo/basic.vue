<script setup lang="ts">
import { ref } from 'vue'

import LxPasswordInput from '../index.vue'
import type { LxPasswordInputProps } from '../types'

interface PasswordInputExposes {
  focus: () => void
  blur: () => void
  select: () => void
}

const password = ref('LinkX-Demo-2026')
const clearable = ref(true)
const showPassword = ref(true)
const maskOnBlur = ref(true)
const preventClipboard = ref(false)
const hudTheme = ref(false)
const size = ref<NonNullable<LxPasswordInputProps['size']>>('md')
const readonlyPassword = ref('Read-only-2026')
const disabledPassword = ref('Disabled-2026')
const inputRef = ref<PasswordInputExposes | null>(null)
const lastAction = ref('示例数据仅保存在当前页面。')

function recordAction(action: string) {
  lastAction.value = action
}
</script>

<template>
  <section class="password-input-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="password-input-demo__toolbar">
      <label>
        尺寸档
        <select v-model="size" aria-label="密码框尺寸档">
          <option value="sm">sm 28px</option>
          <option value="md">md 32px</option>
          <option value="lg">lg 40px</option>
        </select>
      </label>
      <label>
        <input v-model="clearable" type="checkbox" />
        显示清空按钮
      </label>
      <label>
        <input v-model="showPassword" type="checkbox" />
        允许切换明文
      </label>
      <label>
        <input v-model="maskOnBlur" type="checkbox" />
        离开组件后重新遮罩
      </label>
    </div>

    <p class="password-input-demo__security-hint">
      组件参数默认保留显隐状态；{{
        maskOnBlur ? '本示例已开启离开遮罩。' : '本示例已关闭离开遮罩。'
      }}登录或敏感配置建议开启。
    </p>

    <details class="password-input-demo__advanced">
      <summary>
        <span>剪贴板与主题设置</span>
        <LxIcon
          class="password-input-demo__advanced-icon"
          name="chevron-down"
          :size="16"
        />
      </summary>
      <div class="password-input-demo__advanced-controls">
        <label>
          <input v-model="preventClipboard" type="checkbox" />
          阻止剪贴板操作
        </label>
        <label>
          <input v-model="hudTheme" type="checkbox" />
          HUD 深色主题
        </label>
      </div>
    </details>

    <div class="password-input-demo__field">
      <label for="password-input-demo">访问密码</label>
      <LxPasswordInput
        id="password-input-demo"
        ref="inputRef"
        v-model="password"
        placeholder="请输入至少 8 位密码"
        autocomplete="new-password"
        name="previewPassword"
        :size="size"
        :maxlength="32"
        :minlength="8"
        :clearable="clearable"
        :show-password="showPassword"
        :mask-on-blur="maskOnBlur"
        :prevent-clipboard="preventClipboard"
        @update:model-value="recordAction('密码内容已更新')"
        @change="recordAction('密码输入已确认')"
        @focus="recordAction('密码框已聚焦')"
        @blur="recordAction('密码框已失焦')"
        @clear="recordAction('密码已清空')"
      />
      <p class="password-input-demo__hint">
        {{
          preventClipboard
            ? '此示例已阻止复制、剪切和粘贴。'
            : '此示例默认允许密码管理器操作剪贴板。'
        }}
      </p>
    </div>

    <div class="password-input-demo__field">
      <label for="password-input-readonly">只读密码</label>
      <LxPasswordInput
        id="password-input-readonly"
        v-model="readonlyPassword"
        readonly
        autocomplete="off"
        :size="size"
        aria-describedby="password-input-readonly-note"
      />
      <p id="password-input-readonly-note" class="password-input-demo__hint">
        保留密码形态，但不能修改。
      </p>
    </div>

    <div class="password-input-demo__field">
      <label for="password-input-disabled">禁用密码</label>
      <LxPasswordInput
        id="password-input-disabled"
        v-model="disabledPassword"
        disabled
        :size="size"
      />
      <p class="password-input-demo__hint">禁用状态不可聚焦或编辑。</p>
    </div>

    <div class="password-input-demo__actions" aria-label="密码框实例方法">
      <button type="button" @click="inputRef?.focus()">聚焦输入框</button>
      <button type="button" @click="inputRef?.select()">选中密码</button>
      <button type="button" @click="inputRef?.blur()">移除焦点</button>
    </div>

    <p
      class="password-input-demo__status"
      role="status"
      aria-live="polite"
      data-testid="last-action"
    >
      {{ lastAction }}
    </p>
  </section>
</template>

<style scoped>
.password-input-demo {
  display: grid;
  gap: 18px;
  min-width: 0;
  padding: 16px;
  scroll-margin-block-start: calc(var(--vp-nav-height, 64px) + 16px);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.password-input-demo__toolbar,
.password-input-demo__actions,
.password-input-demo__advanced-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.password-input-demo__security-hint {
  margin: -10px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.password-input-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.password-input-demo__advanced {
  display: grid;
  gap: 8px;
}

.password-input-demo__advanced summary {
  display: flex;
  width: fit-content;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  padding-inline: 8px;
  color: var(--el-color-primary);
  cursor: pointer;
  list-style: none;
}

.password-input-demo__advanced summary::-webkit-details-marker {
  display: none;
}

.password-input-demo__advanced summary:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.password-input-demo__advanced-icon {
  transition: transform 160ms ease;
}

.password-input-demo__advanced[open] .password-input-demo__advanced-icon {
  transform: rotate(180deg);
}

.password-input-demo__advanced-controls {
  padding-block: 4px;
}

.password-input-demo.lx-theme-hud {
  --el-color-primary: var(--lx-color-primary);
  --el-bg-color: var(--lx-bg-card);
  --el-bg-color-overlay: var(--lx-bg-card);
  --el-fill-color-blank: var(--lx-bg-card);
  --el-fill-color-light: var(--lx-bg-card-hover);
  --el-border-color: var(--lx-border);
  --el-border-color-light: var(--lx-border);
  --el-text-color-primary: var(--lx-text-primary);
  --el-text-color-regular: var(--lx-text-regular);
  --el-text-color-secondary: var(--lx-text-regular);
  --el-text-color-placeholder: var(--lx-text-regular);
}

.password-input-demo__toolbar input {
  accent-color: var(--el-color-primary);
}

@media (max-width: 640px) {
  .password-input-demo__toolbar label,
  .password-input-demo__advanced-controls label {
    min-height: 44px;
  }

  .password-input-demo__advanced summary {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .password-input-demo__advanced-icon {
    transition: none;
  }
}

.password-input-demo__toolbar select {
  min-height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.password-input-demo__field {
  display: grid;
  width: min(100%, 480px);
  min-width: 0;
  gap: 8px;
}

.password-input-demo__field > label {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.password-input-demo__hint,
.password-input-demo__status {
  margin: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 13px;
  line-height: 1.5;
}

.password-input-demo__actions button {
  min-height: 36px;
  padding: 0 12px;
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
}

.password-input-demo__actions button:hover {
  border-color: var(--el-color-primary);
}

.password-input-demo__actions button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.password-input-demo__status {
  min-height: 20px;
}

@media (max-width: 480px) {
  .password-input-demo {
    padding: 12px;
  }

  .password-input-demo__actions button {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .password-input-demo,
  .password-input-demo * {
    scroll-behavior: auto;
  }
}
</style>
