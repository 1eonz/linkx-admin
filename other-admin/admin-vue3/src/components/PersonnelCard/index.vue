<script setup lang="ts">
/**
 * PersonnelCard - 人员/装备卡片组件
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的 .personnel-card 样式
 * - 头像（首字或图片 URL）+ 姓名 + 警号 + 部门 + 状态点
 * - hover 时边框主色 + 阴影强化
 * - 配合 .card-grid 网格容器使用
 *
 * @example 基础用法
 * ```vue
 * <PersonnelCard
 *   name="王巡警"
 *   police-id="P008101"
 *   department="交警二大队"
 *   status="online"
 * />
 * ```
 *
 * @example 自定义头像图片 + 右上角附加
 * ```vue
 * <PersonnelCard name="李队长" avatar="/static/avatar.png" status="busy">
 *   <template #extra><el-tag size="small">队长</el-tag></template>
 * </PersonnelCard>
 * ```
 */
import { computed } from 'vue';

import StatusDot from '@/components/StatusDot/index.vue';

defineOptions({ name: 'PersonnelCard' });

const props = withDefaults(
  defineProps<{
    /** 姓名 */
    name: string;
    /** 头像：图片 URL 或首字（默认取 name 首字） */
    avatar?: string;
    /** 警号 */
    policeId?: string;
    /** 部门 */
    department?: string;
    /** 状态：online / busy / offline */
    status?: 'online' | 'busy' | 'offline';
  }>(),
  {
    avatar: '',
    policeId: '',
    department: '',
    status: undefined,
  },
);

// 头像首字（当 avatar 为空或非 URL 时使用）
const avatarText = computed(() => props.name.charAt(0) || 'U');
// 是否为图片 URL
const isImage = computed(() => props.avatar.startsWith('http') || props.avatar.startsWith('/'));
</script>

<template>
  <div class="personnel-card custom-personnel-card">
    <!-- 头像 -->
    <div class="card-avatar">
      <img v-if="avatar && isImage" :src="avatar" :alt="name" />
      <span v-else>{{ avatarText }}</span>
    </div>

    <!-- 信息区 -->
    <div class="card-info">
      <div class="info-header">
        <b class="info-name">{{ name }}</b>
        <StatusDot v-if="status" :status="status" />
      </div>
      <div v-if="policeId" class="info-police-id">
        警号: <span class="police-id">{{ policeId }}</span>
      </div>
      <div v-if="department" class="info-dept">{{ department }}</div>
    </div>

    <!-- 右上角附加（如 tag） -->
    <div class="card-extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.custom-personnel-card {
  // 继承全局 .personnel-card 样式（reset.less 中定义）
  gap: @spacing-sm;

  .card-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: @color-primary-light-9;
    color: @color-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: @font-size-lg;
    font-weight: @font-weight-semibold;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: @spacing-sm;

      .info-name {
        font-size: @font-size-md;
        color: @color-text-primary;
        font-weight: @font-weight-semibold;
      }
    }

    .info-police-id {
      font-size: @font-size-xs;
      color: @color-text-secondary;
      margin-top: 2px;
    }

    .info-dept {
      font-size: @font-size-xs;
      color: @color-text-secondary;
      margin-top: 2px;
    }
  }

  .card-extra {
    align-self: flex-start;
  }
}
</style>
