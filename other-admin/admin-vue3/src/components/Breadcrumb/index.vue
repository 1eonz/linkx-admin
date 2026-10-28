<script setup lang="ts">
/** 从可信路由元数据生成路径；导航及 redirect 解析由 Vue Router 负责。 */
import { LxBreadcrumb } from 'lx-ui';
import type { LxBreadcrumbItem } from 'lx-ui';
import { compile as pathCompile } from 'path-to-regexp';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'Breadcrumb' });

const route = useRoute();
const router = useRouter();

const levelList = computed(() => {
  const matched = route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({ path: item.path, title: String(item.meta.title), hidden: item.meta.breadcrumb === false }));
  if (matched[0] && matched[0].path !== '/dashboard') {
    matched.unshift({ path: '/dashboard', title: '首页', hidden: false });
  }
  return matched.filter((item) => !item.hidden);
});

function pathCompileFn(path: string): string {
  const { params } = route;
  try {
    const toPath = pathCompile(path);
    return toPath(params);
  } catch {
    return path;
  }
}

const breadcrumbItems = computed<LxBreadcrumbItem[]>(() =>
  levelList.value.map((item, index) => ({
    title: item.title,
    to: index < levelList.value.length - 1 ? router.resolve(pathCompileFn(item.path)).href : undefined,
  })),
);

function handleSelect(item: LxBreadcrumbItem, event: MouseEvent): void {
  // 只接管普通主键点击；修饰键、新标签和已被阻止的事件保留浏览器语义。
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const routeItem = levelList.value.find((matched) => router.resolve(pathCompileFn(matched.path)).href === item.to);
  if (!routeItem) return;
  event.preventDefault();
  // 不把 redirect 强制转为字符串；Router 自行兼容字符串、对象和函数重定向。
  void router.push(pathCompileFn(routeItem.path));
}
</script>

<template>
  <LxBreadcrumb class="app-breadcrumb breadcrumb-container" :items="breadcrumbItems" @select="handleSelect" />
</template>

<style lang="less" scoped>
.app-breadcrumb {
  min-width: 0;
}

:deep(.lx-breadcrumb__item),
:deep(.lx-breadcrumb__separator) {
  color: @navbar-text;
}

:deep(.lx-breadcrumb__item[aria-current='page']) {
  color: @navbar-text-active;
}
</style>
