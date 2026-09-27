<script setup lang="ts">
import { LxIcon } from 'lx-ui';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';
import { useAppStore } from '@/store/modules/useAppStore';
import { useUserStore } from '@/store/modules/useUserStore';
// 引入 less 变量供模板内联属性使用（通过 :export 导出的 JS 对象）
// 注意：less 文件不提供 default export，使用命名空间 import
import * as variables from '@/styles/variables.less';

defineOptions({ name: 'Sidebar' });

interface MenuDirectoryGroup {
  title: string;
  items: Array<{ title: string; path: string }>;
}

const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();
const menuSearch = ref('');
const directorySearch = ref('');
const menuDirectoryVisible = ref(false);

// 权限菜单
const permissionMenus = computed(() => userStore.permissionsMenu);

const initiallyOpenMenus = computed(() =>
  import.meta.env.MODE === 'mock-preview' ? permissionMenus.value.map((item) => String(item.path)) : [],
);

function getRouteTitle(route: RouteRecordRaw): string {
  const title = route.meta?.title;
  return typeof title === 'string' ? title : '';
}

function resolveMenuPath(parentPath: string, childPath: string): string {
  if (childPath.startsWith('/')) return childPath;
  return `${parentPath.replace(/\/+$/, '')}/${childPath.replace(/^\/+/, '')}`;
}

function isHiddenRoute(route: RouteRecordRaw): boolean {
  return Boolean((route.meta as Record<string, unknown> | undefined)?.hidden);
}

const menuDirectoryGroups = computed<MenuDirectoryGroup[]>(() => [
  { title: '工作台', items: [{ title: '首页', path: '/dashboard' }] },
  ...permissionMenus.value
    .map((parent) => {
      const children = (parent.children ?? []).filter((child) => !isHiddenRoute(child));
      const items = children.length
        ? children.map((child) => ({
            title: getRouteTitle(child),
            path: resolveMenuPath(parent.path, child.path),
          }))
        : !isHiddenRoute(parent)
          ? [{ title: getRouteTitle(parent), path: parent.path }]
          : [];
      return { title: getRouteTitle(parent), items };
    })
    .filter((group) => group.items.length > 0),
]);

const menuDirectoryCount = computed(() =>
  menuDirectoryGroups.value.reduce((total, group) => total + group.items.length, 0),
);

const visibleMenuDirectoryGroups = computed(() => {
  const query = directorySearch.value.trim().toLocaleLowerCase('zh-CN');
  return menuDirectoryGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        query ? `${group.title} ${item.title}`.toLocaleLowerCase('zh-CN').includes(query) : true,
      ),
    }))
    .filter((group) => group.items.length > 0);
});

const searchResults = computed(() => {
  const query = menuSearch.value.trim().toLocaleLowerCase('zh-CN');
  if (!query) return [];

  return menuDirectoryGroups.value
    .flatMap((group) =>
      group.items.map((item) => ({ parentTitle: group.title, pageTitle: item.title, path: item.path })),
    )
    .filter((item) => `${item.parentTitle} ${item.pageTitle}`.toLocaleLowerCase('zh-CN').includes(query));
});

function closeMenuDirectory(): void {
  menuDirectoryVisible.value = false;
  directorySearch.value = '';
  menuSearch.value = '';
}

watch(
  () => route.fullPath,
  () => {
    if (menuDirectoryVisible.value) closeMenuDirectory();
  },
);

const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta?.activeMenu) {
    return meta.activeMenu as string;
  }
  return path;
});
</script>

<template>
  <div class="sidebar-wrapper">
    <Logo />
    <div class="sidebar-scroll">
      <div v-if="appStore.sidebar.opened" class="sidebar-menu-search">
        <el-input v-model="menuSearch" aria-label="搜索菜单" clearable placeholder="搜索菜单" size="small">
          <template #prefix>
            <LxIcon name="search" :size="16" />
          </template>
        </el-input>
        <el-button
          class="sidebar-menu-directory-trigger"
          text
          :aria-label="`查看全部菜单，共 ${menuDirectoryCount} 项`"
          @click="menuDirectoryVisible = true"
        >
          <LxIcon name="menu" :size="16" />
          <span>全部菜单</span>
          <span class="sidebar-menu-directory-count">{{ menuDirectoryCount }} 项</span>
        </el-button>
      </div>
      <nav v-if="menuSearch.trim() && appStore.sidebar.opened" aria-label="菜单搜索结果" class="sidebar-search-results">
        <router-link
          v-for="result in searchResults"
          :key="result.path"
          :aria-current="activeMenu === result.path ? 'page' : undefined"
          class="sidebar-search-result"
          :to="result.path"
          @click="menuSearch = ''"
        >
          <span class="sidebar-search-parent">{{ result.parentTitle }}</span>
          <span>{{ result.pageTitle }}</span>
        </router-link>
        <p v-if="searchResults.length === 0" class="sidebar-search-empty" role="status">没有匹配菜单</p>
      </nav>
      <el-menu
        v-else
        :default-active="activeMenu"
        :default-openeds="initiallyOpenMenus"
        :collapse="!appStore.sidebar.opened"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        :unique-opened="false"
        :collapse-transition="false"
        :router="true"
        mode="vertical"
      >
        <el-menu-item index="/dashboard">
          <LxIcon name="dashboard" :size="18" />
          <template #title>
            <span>首页</span>
          </template>
        </el-menu-item>
        <SidebarItem v-for="route in permissionMenus" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </div>
    <el-dialog
      v-model="menuDirectoryVisible"
      class="sidebar-menu-directory"
      :title="`全部菜单（${menuDirectoryCount}）`"
      width="min(920px, calc(100vw - 32px))"
      top="5vh"
      destroy-on-close
    >
      <el-input v-model="directorySearch" aria-label="筛选全部菜单" clearable placeholder="筛选菜单" />
      <nav aria-label="全部菜单目录" class="sidebar-menu-directory-groups">
        <section v-for="group in visibleMenuDirectoryGroups" :key="group.title" class="sidebar-menu-directory-group">
          <h3>{{ group.title }}</h3>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :aria-current="activeMenu === item.path ? 'page' : undefined"
            class="sidebar-menu-directory-link"
            :to="item.path"
          >
            {{ item.title }}
          </router-link>
        </section>
        <p v-if="visibleMenuDirectoryGroups.length === 0" class="sidebar-menu-search-empty" role="status">
          没有匹配菜单
        </p>
      </nav>
    </el-dialog>
  </div>
</template>
