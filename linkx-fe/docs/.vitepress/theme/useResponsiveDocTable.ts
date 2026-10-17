import { onMounted, onUnmounted } from 'vue'

const hintedTableSelector = '.vp-doc p.lx-doc-table-scroll-hint + table'

/**
 * 为需要横向浏览的文档表格添加提示、键盘停靠和无障碍关联。
 * @param minOverflowPx 显示滚动提示并进入键盘顺序所需的最小溢出宽度，默认不设阈值
 */
export function useResponsiveDocTable(minOverflowPx = 0) {
  let tables: HTMLTableElement[] = []
  const observers: ResizeObserver[] = []
  const removeKeydownListeners: (() => void)[] = []
  let contentObserver: MutationObserver | undefined

  const getMinOverflowPx = (table: HTMLTableElement) => {
    const hint = table.previousElementSibling
    const override =
      hint instanceof HTMLElement ? hint.dataset.minOverflowPx : undefined
    const parsedOverride =
      override === undefined ? Number.NaN : Number(override)

    return Number.isFinite(parsedOverride) && parsedOverride >= 0
      ? parsedOverride
      : minOverflowPx
  }

  const syncKeyboardAccess = (table: HTMLTableElement) => {
    const hint = table.previousElementSibling
    const minOverflow = getMinOverflowPx(table)
    const overflowWidth = table.scrollWidth - table.clientWidth

    if (overflowWidth > 0 && overflowWidth >= minOverflow) {
      table.tabIndex = 0
      if (hint instanceof HTMLElement && hint.id) {
        hint.classList.add('is-scrollable')
        table.setAttribute('aria-describedby', hint.id)
      }
      return
    }

    if (hint instanceof HTMLElement) hint.classList.remove('is-scrollable')
    table.removeAttribute('tabindex')
    table.removeAttribute('aria-describedby')
  }
  const syncAllKeyboardAccess = () =>
    tables.forEach((table) => syncKeyboardAccess(table))

  const clearBindings = () => {
    observers.splice(0).forEach((observer) => observer.disconnect())
    removeKeydownListeners
      .splice(0)
      .forEach((removeListener) => removeListener())
    tables = []
  }

  const bindTables = () => {
    clearBindings()
    tables = Array.from(
      document.querySelectorAll<HTMLTableElement>(hintedTableSelector),
    )

    for (const table of tables) {
      syncKeyboardAccess(table)
      const observer = new ResizeObserver(() => syncKeyboardAccess(table))
      if (table.parentElement) observer.observe(table.parentElement)
      observers.push(observer)

      const handleKeydown = (event: KeyboardEvent) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          !['ArrowLeft', 'ArrowRight'].includes(event.key)
        ) {
          return
        }

        const maxScrollLeft = table.scrollWidth - table.clientWidth
        if (maxScrollLeft < getMinOverflowPx(table)) return

        const step = Math.max(32, Math.floor(table.clientWidth * 0.8))
        const direction = event.key === 'ArrowRight' ? 1 : -1
        const nextScrollLeft = Math.max(
          0,
          Math.min(maxScrollLeft, table.scrollLeft + direction * step),
        )
        if (nextScrollLeft === table.scrollLeft) return

        event.preventDefault()
        table.scrollLeft = nextScrollLeft
      }

      table.addEventListener('keydown', handleKeydown)
      removeKeydownListeners.push(() =>
        table.removeEventListener('keydown', handleKeydown),
      )
    }
  }

  onMounted(() => {
    bindTables()
    const content = document.querySelector('.VPContent')
    if (content) {
      contentObserver = new MutationObserver(() => bindTables())
      contentObserver.observe(content, { childList: true, subtree: true })
    }
    window.addEventListener('resize', syncAllKeyboardAccess)
  })

  onUnmounted(() => {
    contentObserver?.disconnect()
    clearBindings()
    window.removeEventListener('resize', syncAllKeyboardAccess)
  })
}
