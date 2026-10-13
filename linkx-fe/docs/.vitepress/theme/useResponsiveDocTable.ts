import { onMounted, onUnmounted } from 'vue'

const hintedTableSelector = '.vp-doc p.lx-doc-table-scroll-hint + table'

/**
 * 为需要横向浏览的文档表格添加提示、键盘停靠和无障碍关联。
 * @param minOverflowPx 显示滚动提示并进入键盘顺序所需的最小溢出宽度，默认不设阈值
 */
export function useResponsiveDocTable(minOverflowPx = 0) {
  let tables: HTMLTableElement[] = []
  const observers: ResizeObserver[] = []

  const syncKeyboardAccess = (table: HTMLTableElement) => {
    const hint = table.previousElementSibling

    const overflowWidth = table.scrollWidth - table.clientWidth

    if (overflowWidth > 0 && overflowWidth >= minOverflowPx) {
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

  onMounted(() => {
    tables = Array.from(
      document.querySelectorAll<HTMLTableElement>(hintedTableSelector),
    )
    if (tables.length === 0) return

    for (const table of tables) {
      syncKeyboardAccess(table)
      const observer = new ResizeObserver(() => syncKeyboardAccess(table))
      if (table.parentElement) observer.observe(table.parentElement)
      observers.push(observer)
    }
    window.addEventListener('resize', syncAllKeyboardAccess)
  })

  onUnmounted(() => {
    observers.forEach((observer) => observer.disconnect())
    window.removeEventListener('resize', syncAllKeyboardAccess)
  })
}
