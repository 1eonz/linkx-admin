import type { Directive } from 'vue';

interface WavesOptions {
  ele?: string;
  type?: 'hit' | 'center';
  color?: string;
}

/**
 * v-waves：点击波纹效果（Material Design 风格）
 */
const waves: Directive = {
  mounted(el, binding) {
    const options: WavesOptions = {
      ele: 'container',
      type: 'hit',
      color: 'rgba(0, 0, 0, 0.15)',
      ...(binding.value || {}),
    };

    const handleClick = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const container = options.ele === 'container' ? el : el.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'waves-ripple';

      let left: number;
      let top: number;
      if (options.type === 'center') {
        left = rect.width / 2;
        top = rect.height / 2;
      } else {
        left = mouseEvent.clientX - rect.left;
        top = mouseEvent.clientY - rect.top;
      }

      const size = Math.max(rect.width, rect.height);
      ripple.style.left = `${left - size / 2}px`;
      ripple.style.top = `${top - size / 2}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.backgroundColor = options.color ?? '';

      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
      }
      container.style.overflow = 'hidden';
      container.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 1200);
    };

    el.addEventListener('click', handleClick);
    (el as HTMLElement & { _wavesHandler?: EventListener })._wavesHandler = handleClick;
  },
  unmounted(el) {
    const handler = (el as HTMLElement & { _wavesHandler?: EventListener })._wavesHandler;
    if (handler) {
      el.removeEventListener('click', handler);
    }
  },
};

export default waves;
