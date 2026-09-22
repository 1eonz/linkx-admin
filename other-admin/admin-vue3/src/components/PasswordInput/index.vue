<script setup lang="ts">
/**
 * PasswordInput - 密码输入框组件
 *
 * 功能特性：
 * - 基于 el-input 封装，type 固定为 password
 * - 支持 v-model 双向绑定（update:modelValue）
 * - 透传 el-input 全部常用属性（placeholder/disabled/clearable/maxlength 等）
 * - 支持自定义 class 与 style 透传至根输入框
 * - 默认禁止复制、粘贴、剪切，防止密码被复制外泄
 * - 内置 show-password 切换明文/密文显示
 * - 暴露 focus / blur / select 方法，便于父组件直接操作输入框
 * - change / focus / blur / clear 事件透传
 *
 * @example 基础用法
 * ```vue
 * <PasswordInput v-model="form.password" placeholder="请输入密码" show-password />
 * ```
 *
 * @example 进阶用法：调用暴露方法
 * ```vue
 * <PasswordInput ref="pwdRef" v-model="form.password" />
 * <el-button @click="pwdRef?.focus()">聚焦</el-button>
 * ```
 * ```typescript
 * const pwdRef = ref();
 * ```
 *
 * Props：
 * - modelValue: string，v-model 绑定值，默认 ''
 * - inputClass: string | string[] | Record<string, boolean>，自定义 class，默认 ''
 * - inputStyle: string | Record<string, string>，自定义 style，默认 ''
 * - placeholder: string，占位文本，默认 ''
 * - disabled: boolean，是否禁用，默认 false
 * - clearable: boolean，是否可清空，默认 false
 * - showPassword: boolean，是否显示密码切换按钮，默认 false
 * - maxlength: number | string，最大输入长度，默认 undefined
 * - minlength: number | string，最小输入长度，默认 undefined
 * - size: '' | 'large' | 'default' | 'small'，输入框尺寸，默认 ''
 * - prefixIcon: string，头部图标，默认 ''
 * - suffixIcon: string，尾部图标，默认 ''
 * - autocomplete: string，自动补全，默认 'off'
 * - readonly: boolean，是否只读，默认 false
 * - tabindex: string，tabindex，默认 ''
 * - name: string，原生 name 属性，默认 ''
 *
 * Events：
 * - update:modelValue: 输入值变化时触发，参数为当前输入值 string
 * - change: 值变更并失焦时触发，参数为当前值 string
 * - focus: 输入框聚焦时触发，参数为 FocusEvent
 * - blur: 输入框失焦时触发，参数为 FocusEvent
 * - clear: 点击清空按钮时触发，无参数
 *
 * Slots：无
 *
 * Methods：
 * - focus(): 聚焦输入框
 * - blur(): 使输入框失焦
 * - select(): 选中输入框全部文本
 */
import type { InputProps } from 'element-plus';
import { ref, watch } from 'vue';

defineOptions({ name: 'PasswordInput' });

interface Props {
  /** v-model 绑定值 */
  modelValue?: string;
  /** 自定义 class */
  inputClass?: string | string[] | Record<string, boolean>;
  /** 自定义 style */
  inputStyle?: string | Record<string, string>;
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否显示密码切换按钮 */
  showPassword?: boolean;
  /** 最大输入长度 */
  maxlength?: number | string;
  /** 最小输入长度 */
  minlength?: number | string;
  /** 输入框尺寸 */
  size?: '' | 'large' | 'default' | 'small';
  /** 输入框头部图标 */
  prefixIcon?: string;
  /** 输入框尾部图标 */
  suffixIcon?: string;
  /** 自动补全 */
  autocomplete?: string;
  /** 原生属性，是否只读 */
  readonly?: boolean;
  /** 输入框的 tabindex */
  tabindex?: string;
  /** 原生属性 */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  inputClass: '',
  inputStyle: '',
  placeholder: '',
  disabled: false,
  clearable: false,
  showPassword: false,
  maxlength: undefined,
  minlength: undefined,
  size: '',
  prefixIcon: '',
  suffixIcon: '',
  autocomplete: 'off',
  readonly: false,
  tabindex: '',
  name: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'change', v: string): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'clear'): void;
}>();

const currentValue = ref(props.modelValue);
const inputRef = ref();

watch(
  () => props.modelValue,
  (val) => {
    currentValue.value = val;
  },
);

function handleInput(value: string): void {
  // Vue3 el-input @input 返回 string
  emit('update:modelValue', value);
}

function handleChange(value: string): void {
  emit('change', value);
}

function handleFocus(event: FocusEvent): void {
  emit('focus', event);
}

function handleBlur(event: FocusEvent): void {
  emit('blur', event);
}

function handleClear(): void {
  emit('clear');
}

// 禁止复制、粘贴、剪切
function preventClipboard(event: ClipboardEvent): void {
  event.preventDefault();
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
});
</script>

<template>
  <el-input
    ref="inputRef"
    v-model="currentValue"
    type="password"
    :class="inputClass"
    :style="inputStyle"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :show-password="showPassword"
    :maxlength="maxlength"
    :minlength="minlength"
    :size="size || undefined"
    :prefix-icon="prefixIcon || undefined"
    :suffix-icon="suffixIcon || undefined"
    :autocomplete="autocomplete"
    :readonly="readonly"
    :tabindex="tabindex"
    :name="name"
    @copy="preventClipboard"
    @paste="preventClipboard"
    @cut="preventClipboard"
    @input="handleInput"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
  />
</template>
