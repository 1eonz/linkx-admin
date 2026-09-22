<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';
import { useAppStore } from '@/store/modules/useAppStore';
import { useUserStore } from '@/store/modules/useUserStore';
// 引入 less 变量供模板内联属性使用（通过 :export 导出的 JS 对象）
// 注意：less 文件不提供 default export，使用命名空间 import
import * as variables from '@/styles/variables.less';

defineOptions({ name: 'Sidebar' });

const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();

// 权限菜单
const permissionMenus = computed(() => userStore.permissionsMenu);

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
      <el-menu
        :default-active="activeMenu"
        :collapse="!appStore.sidebar.opened"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        :unique-opened="false"
        :collapse-transition="false"
        :router="true"
        mode="vertical"
      >
        <SidebarItem v-for="route in permissionMenus" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </div>
  </div>
</template>
