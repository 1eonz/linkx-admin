import { onMounted, onUnmounted } from 'vue'

const hintedTableSelector = '.vp-doc p.lx-doc-table-scroll-hint + table'

export function useResponsiveDocTable() {
  let tables: HTMLTableElement[] = []
  const observers: ResizeObserver[] = []

  const syncKeyboardAccess = (table: HTMLTableElement) => {
    const hint = table.previousElementSibling

    if (table.scrollWidth > table.clientWidth) {
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
