import type { Directive } from 'vue';

/**
 * v-loadmore：el-select 下拉滚动到底部时触发回调（懒加载更多）
 */
const loadmore: Directive = {
  mounted(el, binding) {
    const dropdownEl = el.querySelector('.el-select-dropdown__wrap');
    if (!dropdownEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = dropdownEl as HTMLElement;
      if (scrollHeight - scrollTop <= clientHeight + 5) {
        binding.value?.();
      }
    };

    dropdownEl.addEventListener('scroll', handleScroll);

    // 在元素上保存引用以便卸载时清理
    (el as HTMLElement & { _loadmoreHandler?: EventListener })._loadmoreHandler = handleScroll;
  },
  unmounted(el) {
    const dropdownEl = el.querySelector('.el-select-dropdown__wrap');
    const handler = (el as HTMLElement & { _loadmoreHandler?: EventListener })._loadmoreHandler;
    if (dropdownEl && handler) {
      dropdownEl.removeEventListener('scroll', handler);
    }
  },
};

export default loadmore;
