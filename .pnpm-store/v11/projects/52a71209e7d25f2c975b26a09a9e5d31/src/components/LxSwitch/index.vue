<script setup lang="ts">
/**
 * LxSwitch — 状态开关（Element Plus el-switch 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 07
 *   胶囊固定 40×20、滑块 16px（EP 内核几何默认值恰好对齐标本，仅固化防漂移）；
 *   开启 #67c23a 成功绿、关闭 #909399 信息灰——色值经 --lx-* 令牌注入 EP 变量，
 *   style.css 组件级固化，element-theme.css 全局桥保留过渡期。
 * 有意识裁剪：不开放 size 档（标本 07 胶囊尺寸为唯一契约）；
 * activeText/inactiveText/inlinePrompt 为 EP 原生文字能力（胶囊内/两侧显示）；
 * active-value/inactive-value/before-change 等旧 EP props 经 $attrs 透传。
 */
import { ElSwitch } from 'element-plus'
import type { LxSwitchProps } from './types'
import 'element-plus/es/components/switch/style/css'
import './style.css'

defineOptions({ name: 'LxSwitch', inheritAttrs: false })

withDefaults(defineProps<LxSwitchProps>(), {
  modelValue: false,
  activeText: undefined,
  inactiveText: undefined,
  /** 默认 true：胶囊内文字为 LinkX 主用法（与 EP 原生默认 false 有意不同） */
  inlinePrompt: true,
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（loading 拦截 /
  // 表单禁用继承）才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  loading: false,
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
}>()
</script>

<template>
  <ElSwitch
    class="lx-switch"
    :model-value="modelValue"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :inline-prompt="inlinePrompt"
    :disabled="disabled"
    :loading="loading"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
