import type { LxDynamicFormField } from '../types'

/** 动态字段子组件的统一受控输入契约。 */
export interface LxDynamicFieldProps {
  field: LxDynamicFormField
  value: unknown
  disabled: boolean
}

/** 克隆字段控件属性并剔除由字段 schema 或渲染器负责的属性。 */
export function omitFieldProps(
  source: Record<string, unknown> | undefined,
  excludedKeys: readonly string[],
): Record<string, unknown> {
  const result = { ...(source ?? {}) }
  excludedKeys.forEach((key) => delete result[key])
  return result
}

export function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined
}

export function objectValue(value: unknown): object | undefined {
  return value !== null && typeof value === 'object' ? value : undefined
}
