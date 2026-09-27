/**
 * lx-ui 权限消费源。
 * 组件库只读取宿主注入的数据，不请求接口、不保存登录态。
 */
export type LxPermissionKey = string | number
export type LxPermissionCollection = ReadonlySet<string> | readonly string[]

export interface LxPermissionSource {
  /** 按页面 ID 分组的按钮权限码。 */
  codes?: Record<string, LxPermissionCollection>
  /** 按页面 ID 分组的字段脱敏码。 */
  maskedFields?: Record<string, LxPermissionCollection>
  /** 当前路由对应的页面 ID；未提供时在所有页面权限中查找。 */
  current?: () => LxPermissionKey | undefined
}

type PermissionSourceGetter = () => LxPermissionSource | undefined

let sourceGetter: PermissionSourceGetter = () => undefined

/** 注入或替换宿主权限源；返回清理函数，便于测试和账号切换。 */
export function setupLxPermission(getter: PermissionSourceGetter): () => void {
  const previous = sourceGetter
  sourceGetter = getter
  return () => {
    if (sourceGetter === getter) sourceGetter = previous
  }
}

function includes(
  collection: LxPermissionCollection | undefined,
  key: string,
): boolean {
  if (!collection) return false
  for (const item of collection) {
    if (item === key) return true
  }
  return false
}

function collectionsFor(
  groups: Record<string, LxPermissionCollection> | undefined,
  pageId: LxPermissionKey | undefined,
): LxPermissionCollection[] {
  if (!groups) return []
  if (pageId !== undefined)
    return groups[String(pageId)] ? [groups[String(pageId)]] : []
  return Object.values(groups)
}

/** 判断一个或多个按钮权限码，默认任意一个命中即可。 */
export function hasPermission(
  permission: string | string[],
  pageId?: LxPermissionKey,
): boolean {
  const source = sourceGetter()
  if (!source) return false
  const keys = Array.isArray(permission) ? permission : [permission]
  const currentPage = pageId ?? source.current?.()
  const groups = collectionsFor(source.codes, currentPage)
  return keys.some((key) =>
    groups.some((collection) => includes(collection, key)),
  )
}

/** 判断字段是否需要脱敏；字段权限未配置时返回 false，保持现有展示。 */
export function isFieldMasked(
  field: string,
  pageId?: LxPermissionKey,
): boolean {
  const source = sourceGetter()
  if (!source) return false
  const currentPage = pageId ?? source.current?.()
  return collectionsFor(source.maskedFields, currentPage).some((collection) =>
    includes(collection, field),
  )
}

/** 根据当前字段权限生成展示值。 */
export function maskValue(
  value: unknown,
  field: string,
  placeholder: string = '***',
  pageId?: LxPermissionKey,
): string {
  if (isFieldMasked(field, pageId)) return placeholder
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}
