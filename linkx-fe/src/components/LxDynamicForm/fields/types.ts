import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import type { LxDynamicFormField } from '../types'

dayjs.extend(customParseFormat)

export type LxDynamicDateRangeValue =
  [string, string] | [number, number] | [Date, Date]

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

function hasValidIsoCalendarDate(value: string): boolean {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?=$|[Tt\s])/)
  if (!match) return true

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysPerMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= (daysPerMonth[month - 1] ?? 0)
  )
}

export function isDateRangeValue(
  value: unknown,
  valueFormat?: string,
): value is LxDynamicDateRangeValue {
  if (!Array.isArray(value) || value.length !== 2) return false

  const [start, end] = value
  if (typeof start === 'string' && typeof end === 'string') {
    if (!start.trim() || !end.trim()) return false
    if (
      !valueFormat &&
      (!hasValidIsoCalendarDate(start) || !hasValidIsoCalendarDate(end))
    )
      return false
    const dates = [start, end].map((endpoint) =>
      valueFormat ? dayjs(endpoint, valueFormat, true) : dayjs(endpoint),
    )
    return dates.every((date) => date.isValid()) && !dates[1].isBefore(dates[0])
  }
  if (typeof start === 'number' && typeof end === 'number') {
    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      dayjs(start).isValid() &&
      dayjs(end).isValid() &&
      !dayjs(end).isBefore(dayjs(start))
    )
  }
  return (
    start instanceof Date &&
    end instanceof Date &&
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end.getTime() >= start.getTime()
  )
}
