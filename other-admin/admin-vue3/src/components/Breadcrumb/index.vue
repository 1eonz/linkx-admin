<script setup lang="ts">
/**
 * Breadcrumb - 面包屑导航组件
 *
 * 功能特性：
 * - 基于当前路由的 matched 列表自动生成面包屑层级
 * - 自动在首位补充「首页」链接（当首匹配项不是 /dashboard 时）
 * - 通过 meta.title 渲染每一级标题，支持 meta.breadcrumb = false 隐藏指定层级
 * - 支持 redirect 配置跳转目标地址
 * - 最后一项渲染为不可点击的纯文本
 * - 支持路径参数编译（path-to-regexp），动态路由可正确回填参数
 * - 内置 transition-group 过渡动画
 *
 * @example 基础用法
 * ```vue
 * <Breadcrumb />
 * ```
 *
 * Props：无
 *
 * Events：无
 *
 * Slots：无
 *
 * Methods：无
 */
import { compile as pathCompile } from 'path-to-regexp';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationMatched } from 'vue-router';

defineOptions({ name: 'Breadcrumb' });

const route = useRoute();
const router = useRouter();

const levelList = computed<RouteLocationMatched[]>(() => {
  const matched = route.matched.filter((item) => item.meta && item.meta.title);
  const first = matched[0];
  if (first && first.path !== '/dashboard') {
    matched.unshift({
      path: '/dashboard',
      meta: { title: '首页' },
    } as unknown as RouteLocationMatched);
  }
  return matched.filter((item) => item.meta?.title && item.meta.breadcrumb !== false);
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

function handleLink(item: RouteLocationMatched): void {
  const { redirect, path } = item as { redirect?: string; path: string };
  if (redirect) {
    router.push(redirect);
    return;
  }
  router.push(pathCompileFn(path));
}
</script>

<template>
  <el-breadcrumb class="app-breadcrumb breadcrumb-container" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span v-if="item.redirect === 'noRedirect' || index === levelList.length - 1" class="no-redirect">
          {{ item.meta?.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ item.meta?.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<style lang="less" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: @font-size-md;
  line-height: @navbar-height;
  margin-left: @spacing-sm;

  // 适配深色 Navbar：分隔符与链接文字使用浅色
  :deep(.el-breadcrumb__separator) {
    color: @navbar-text;
  }

  :deep(.el-breadcrumb__inner) {
    color: @navbar-text;

    a {
      color: @navbar-text;
      transition: color @transition-duration @transition-timing;

      &:hover {
        color: @navbar-text-active;
      }
    }
  }

  // 最后一项（当前页）高亮白色
  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: @navbar-text-active;
    font-weight: @font-weight-medium;
  }

  .no-redirect {
    color: @navbar-text-active;
    cursor: text;
  }
}
</style>
