<script setup lang="ts">
/**
 * LxButton — 按钮组件（Element Plus el-button 内核二次封装）
 * 视觉源：design/按钮体系/code.html（拍板 #11）
 *   三档工程高度 28/32/40px；primary 实底白字，danger/success/warning 实底深字
 *   （拍板 2026-09-29：白字对比度 2.1~2.9:1 不达标），default 白底线框，text 无底色；
 *   loading 态 spinner + 文案切换（"下发指令中..."）+ 点击拦截 + aria-busy。
 * 拍板 #11 铁律：表格行内一律用 type="text"；同屏 primary 上限 1 个。
 * 图标统一走 LxIcon（currentColor 跟随文字色），不使用 EP 图标链路。
 */
import { computed, ref, useAttrs } from 'vue'
import { ElButton, ElTooltip } from 'element-plus'
import LxIcon from '../LxIcon/index.vue'
import type { LxButtonProps, LxButtonSize } from './types'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tooltip/style/css'
import './style.css'

defineOptions({ name: 'LxButton', inheritAttrs: false })

const props = withDefaults(defineProps<LxButtonProps>(), {
  type: 'default',
  text: false,
  textColor: '',
  size: 'md',
  loading: false,
  loadingText: '',
  disabled: false,
  icon: undefined,
  iconPosition: 'left',
  block: false,
  nativeType: 'button',
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

/** attrs 显式接管后透传给 ElButton（aria-label / data-* 等调用方属性） */
const attrs = useAttrs()

/** ElButton 组件实例引用：纯图标 tooltip 虚拟触发需要根 DOM 元素 */
const buttonRef = ref<InstanceType<typeof ElButton>>()

/** tooltip 虚拟触发目标：ElButton 根 DOM（EP 实例 $el 为 any，此处收窄为元素类型；
 * 未挂载时为 undefined，tooltip 随之不触发） */
const tooltipTrigger = computed<HTMLElement | undefined>(
  () => (buttonRef.value?.$el as HTMLElement | undefined) ?? undefined,
)

/** 档位映射：Lx 工程档名 → EP 内核档（高度/字号差值在 style.css 以 --lx-btn-* 收敛） */
const SIZE_MAP: Record<LxButtonSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

/** 文字形态判定：type="text" 或显式 text prop（后者支持 danger+text 等语义组合） */
const isText = computed(() => props.type === 'text' || props.text)

/** EP 内核 type：text 形态由 text 布尔 prop 承担，避免使用 EP 已废弃的 type="text" */
const epType = computed(() => (props.type === 'text' ? 'default' : props.type))
const epSize = computed(() => SIZE_MAP[props.size])

/** 图标尺寸跟档位走（标本尺寸行级差：13/14/16px） */
const iconSize = computed(() => ({ sm: 13, md: 14, lg: 16 })[props.size])

/** loading 且提供了 loadingText 时替换按钮文字（标本交互：spinner + 文案切换） */
const showLoadingText = computed(
  () => props.loading && props.loadingText !== '',
)

/** 自定义文字色（仅文字形态生效）：以 CSS 变量注入，样式层派生 hover 底色 */
const textColorStyle = computed(() =>
  props.textColor !== ''
    ? { '--lx-btn-text-color': props.textColor }
    : undefined,
)

/** 纯图标形态：无 default 插槽内容；此时把 aria-label 同时作为可见 tooltip 展示 */
const iconOnlyLabel = computed(() => {
  const label = attrs['aria-label']
  return typeof label === 'string' ? label : ''
})

function onClick(event: MouseEvent) {
  // EP 内核在 disabled/loading 时已不派发 click，此处双保险防止 attrs 绕行
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<template>
  <ElButton
    ref="buttonRef"
    class="lx-btn"
    :class="[
      `lx-btn--${type}`,
      `lx-btn--${size}`,
      {
        'lx-btn--block': block,
        'lx-btn--icon-right': iconPosition === 'right',
      },
    ]"
    :style="textColorStyle"
    :type="epType"
    :size="epSize"
    :text="isText"
    :native-type="nativeType"
    :loading="loading"
    :disabled="disabled"
    :aria-busy="loading || undefined"
    v-bind="attrs"
    @click="onClick"
  >
    <!-- 前置图标：EP 内核 loading 时自动隐藏 icon 槽并显示 spinner -->
    <template v-if="icon && iconPosition === 'left'" #icon>
      <LxIcon :name="icon" :size="iconSize" />
    </template>
    <!-- 纯图标形态（无插槽内容）不渲染空 label，保持方形点击区 -->
    <span v-if="showLoadingText" class="lx-btn__label">{{ loadingText }}</span>
    <span v-else-if="$slots.default" class="lx-btn__label"><slot /></span>
    <!-- 后置图标：EP 无对应 API，由本组件在文字尾部补充渲染；
         loading 时保留占位避免 spinner 前插导致文字横向跳动 -->
    <LxIcon
      v-if="icon && iconPosition === 'right'"
      :name="icon"
      :size="iconSize"
      class="lx-btn__icon-right"
    />
    <!-- 纯图标 tooltip：aria-label 借 tooltip 对视觉用户可见（读屏用户仍读 aria-label 本身）。
         放在插槽内保持 ElButton 为唯一根节点（attrs 继承与 VTU 断言均依赖单根）；
         virtual-triggering 模式不在插槽位置渲染实际内容，不影响按钮布局；
         disabled/loading 时内核拦截鼠标事件，tooltip 自然不触发 -->
    <ElTooltip
      v-if="iconOnlyLabel && !$slots.default"
      virtual-triggering
      :virtual-ref="tooltipTrigger"
      :content="iconOnlyLabel"
      placement="top"
    />
  </ElButton>
</template>
