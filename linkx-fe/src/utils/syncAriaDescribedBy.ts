/** 将宿主提供的描述 ID 与控件已有说明合并，并清除上次由宿主管理的 ID。 */
export function syncAriaDescribedBy(
  element: Element,
  value: unknown,
  managedIds: Set<string>,
): void {
  const providedIds =
    typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : []
  const existingIds = (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && !managedIds.has(id))
  const nextIds = new Set([...existingIds, ...providedIds])

  if (nextIds.size) {
    element.setAttribute('aria-describedby', [...nextIds].join(' '))
  } else {
    element.removeAttribute('aria-describedby')
  }

  managedIds.clear()
  providedIds.forEach((id) => managedIds.add(id))
}
