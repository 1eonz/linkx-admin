import { onMounted, onUnmounted } from 'vue'

const propsTableSelector =
  '.vp-doc h2#props + p.lx-doc-table-scroll-hint + table'

export function useResponsiveDocTable() {
  let table: HTMLTableElement | null = null
  let observer: ResizeObserver | undefined

  const syncKeyboardAccess = () => {
    if (!table) return

    if (table.scrollWidth > table.clientWidth) {
      table.tabIndex = 0
      table.setAttribute('aria-describedby', 'lx-doc-table-scroll-hint')
      return
    }

    table.removeAttribute('tabindex')
    table.removeAttribute('aria-describedby')
  }

  onMounted(() => {
    table = document.querySelector<HTMLTableElement>(propsTableSelector)
    if (!table) return

    syncKeyboardAccess()
    observer = new ResizeObserver(syncKeyboardAccess)
    if (table.parentElement) observer.observe(table.parentElement)
    window.addEventListener('resize', syncKeyboardAccess)
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('resize', syncKeyboardAccess)
  })
}
