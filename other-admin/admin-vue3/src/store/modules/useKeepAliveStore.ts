import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useKeepAliveStore = defineStore('keepAlive', () => {
  const cachedViews = ref<string[]>([]);

  function addCachedView(viewName: string): void {
    if (!cachedViews.value.includes(viewName)) {
      cachedViews.value.push(viewName);
    }
  }

  function removeCachedView(viewName: string): void {
    const idx = cachedViews.value.indexOf(viewName);
    if (idx > -1) {
      cachedViews.value.splice(idx, 1);
    }
  }

  function clearCachedViews(): void {
    cachedViews.value = [];
  }

  return {
    cachedViews,
    addCachedView,
    removeCachedView,
    clearCachedViews,
  };
});
