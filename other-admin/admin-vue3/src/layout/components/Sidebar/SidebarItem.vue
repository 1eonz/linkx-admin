<script lang="ts">
import { LxIcon } from 'lx-ui';
import { computed, defineComponent } from 'vue';
import type { LxIconName } from 'lx-ui';
import type { RouteRecordRaw } from 'vue-router';

import { isExternal } from '@/utils/validate';

// 路由 meta.icon 字符串名 → lx-ui 图标键映射
const ICON_MAP: Record<string, LxIconName> = {
  component: 'setting',
  role: 'user',
  person: 'people',
  user: 'user',
  password: 'lock',
  dashboard: 'dashboard',
  document: 'file',
  organization: 'team',
  connection: 'link',
  bell: 'bell',
  picture: 'image',
  folder: 'folder',
  map: 'map-pin',
  coordinate: 'pin',
  data: 'pulse',
  chat: 'message',
  mobile: 'mobile',
  monitor: 'dashboard',
  pointer: 'location-arrow',
  stamp: 'shield',
  tools: 'setting',
};

interface SidebarItemProps {
  item: RouteRecordRaw;
  basePath: string;
  isNest?: boolean;
}

export default defineComponent({
  name: 'SidebarItem',
  components: { LxIcon },
  props: {
    item: {
      type: Object as () => RouteRecordRaw,
      required: true,
    },
    basePath: {
      type: String,
      required: true,
    },
    isNest: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: SidebarItemProps) {
    function resolvePath(routePath: string): string {
      if (isExternal(routePath)) return routePath;
      if (isExternal(props.basePath)) return props.basePath;
      if (routePath.startsWith('/')) return routePath;
      const base = props.basePath.endsWith('/') ? props.basePath.slice(0, -1) : props.basePath;
      return `${base}/${routePath}`.replace(/\/+/g, '/');
    }

    const visibleChildren = computed(() => {
      if (!props.item.children) return [];
      return props.item.children.filter((c) => !(c.meta as Record<string, unknown> | undefined)?.hidden);
    });

    const showAsSingleChild = computed(() => {
      const children = visibleChildren.value;
      return children.length === 1 && !(props.item as RouteRecordRaw & { alwaysShow?: boolean }).alwaysShow;
    });

    const singleChild = computed(() => visibleChildren.value[0] ?? null);

    // 从 meta.icon 获取对应的 lx-ui 图标键
    const iconName = computed(() => {
      const iconName = (props.item.meta?.icon as string) ?? '';
      return ICON_MAP[iconName] ?? null;
    });

    const singleChildIconName = computed(() => {
      const childIcon = (singleChild.value?.meta?.icon as string) ?? '';
      const parentIcon = (props.item.meta?.icon as string) ?? '';
      return ICON_MAP[childIcon] ?? ICON_MAP[parentIcon] ?? null;
    });

    return {
      resolvePath,
      visibleChildren,
      showAsSingleChild,
      singleChild,
      iconName,
      singleChildIconName,
    };
  },
});
</script>

<template>
  <!-- 无子节点直接渲染 menu-item -->
  <el-menu-item v-if="visibleChildren.length === 0" :index="resolvePath(item.path)">
    <el-icon v-if="iconName">
      <LxIcon :name="iconName" :size="18" />
    </el-icon>
    <template #title>
      <span>{{ item.meta?.title }}</span>
    </template>
  </el-menu-item>

  <!-- 只有一个子节点且非 alwaysShow：直接渲染为 menu-item，省略父级 -->
  <el-menu-item v-else-if="showAsSingleChild && singleChild" :index="resolvePath(singleChild.path)">
    <el-icon v-if="singleChildIconName">
      <LxIcon :name="singleChildIconName" :size="18" />
    </el-icon>
    <template #title>
      <span>{{ singleChild.meta?.title || item.meta?.title }}</span>
    </template>
  </el-menu-item>

  <!-- 多个子节点：渲染为 sub-menu -->
  <el-sub-menu v-else :index="resolvePath(item.path)">
    <template #title>
      <el-icon v-if="iconName">
        <LxIcon :name="iconName" :size="18" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>
    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :base-path="resolvePath(item.path)"
      :is-nest="true"
    />
  </el-sub-menu>
</template>
