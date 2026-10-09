/** 滚动到首个校验错误项并聚焦其中可操作的控件。 */
export function focusFirstInvalidFormField(root: HTMLElement): void {
  const firstInvalidItem = root.querySelector<HTMLElement>(
    '.el-form-item.is-error',
  )
  if (!firstInvalidItem) return

  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  firstInvalidItem.scrollIntoView?.({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'center',
  })

  const focusableSelector = [
    'input:not([type="hidden"]):not([type="file"]):not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[role="combobox"]:not([aria-disabled="true"])',
    '[role="checkbox"]:not([aria-disabled="true"])',
    '[role="radio"]:not([aria-disabled="true"])',
    '[role="switch"]:not([aria-disabled="true"])',
    '.el-upload[role="button"][tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')
  const target = [
    ...firstInvalidItem.querySelectorAll<HTMLElement>(focusableSelector),
  ].find(
    (element) =>
      element.tabIndex >= 0 &&
      element.getAttribute('aria-disabled') !== 'true' &&
      element.getClientRects().length > 0,
  )
  target?.focus({ preventScroll: true })
}
