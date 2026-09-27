<script setup lang="ts">
/**
 * SectionTitle 将旧页面的标题接口适配到 lx-ui 设计组件。
 * 未收录的 Vue 图标组件仍通过 leading 插槽兼容显示。
 */
import { LxSectionTitle } from 'lx-ui';
import type { LxIconName, LxSectionTitleProps } from 'lx-ui';
import { computed } from 'vue';
import type { Component } from 'vue';

defineOptions({ name: 'SectionTitle' });

interface Props extends Pick<LxSectionTitleProps, 'size' | 'tag' | 'tagType'> {
  title?: string;
  icon?: Component;
  iconColor?: string;
  variant?: 'dashed' | 'border' | 'plain';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: undefined,
  iconColor: undefined,
  variant: 'dashed',
});

const iconNames: Record<string, LxIconName> = {
  Bell: 'bell',
  Calendar: 'calendar',
  Connection: 'link',
  DataAnalysis: 'pulse',
  Folder: 'folder',
  Lock: 'lock',
  MapLocation: 'map-pin',
  Picture: 'image',
  Setting: 'setting',
  Star: 'star',
  User: 'user',
};

const lxIconName = computed(() => {
  const component = props.icon;
  if (!component || typeof component !== 'object' || !('name' in component)) return undefined;
  const name = component.name;
  return typeof name === 'string' ? iconNames[name] : undefined;
});
</script>

<template>
  <LxSectionTitle
    :title="title"
    :variant="variant"
    :size="size"
    :icon="lxIconName"
    :icon-color="iconColor"
    :tag="tag"
    :tag-type="tagType"
    class="custom-section-title"
  >
    <template #default
      ><slot>{{ title }}</slot></template
    >
    <template v-if="icon && !lxIconName" #leading>
      <el-icon class="title-icon" :color="iconColor"><component :is="icon" /></el-icon>
    </template>
    <template v-if="$slots.extra" #extra><slot name="extra" /></template>
  </LxSectionTitle>
</template>

<style lang="less" scoped>
.custom-section-title {
  width: 100%;
}
</style>
