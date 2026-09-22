<script setup lang="ts">
// demo：基础用法 — expanded 形态 + 受控激活项（对应 8 个业务菜单的骨架）
import { ref } from 'vue';
import { LxSidebar, type LxMenuItem } from '../../../index';

const activeKey = ref('dashboard');
const items: LxMenuItem[] = [
  { key: 'dashboard', title: '综合态势工作台', icon: 'dashboard' },
  {
    key: 'coop',
    title: '协同岗管理',
    icon: 'team',
    children: [
      { key: 'coop-setting', title: '协同岗设置' },
      { key: 'coop-monitor', title: '上下岗排班监控' },
      { key: 'coop-seat', title: '联勤席位标定' },
    ],
  },
  {
    key: 'alert',
    title: '预警与群组协同',
    icon: 'bell',
    badge: 4,
    badgeType: 'error',
    children: [
      { key: 'alert-config', title: '预警流转配置' },
      { key: 'alert-group', title: '联动响应群组' },
    ],
  },
  { key: 'duty', title: '勤务排班管理', icon: 'calendar' },
  { key: 'resource', title: '警务资源管理', icon: 'cube' },
  {
    key: 'auth',
    title: '权限与人员中心',
    icon: 'shield',
    children: [
      { key: 'auth-org', title: '组织人员管理' },
      { key: 'auth-role', title: '角色与操作权限' },
    ],
  },
  {
    key: 'third',
    title: '三方集成与网关',
    icon: 'server',
    children: [
      { key: 'third-bus', title: '南向接口总线' },
      { key: 'third-comm', title: '警单与通信接入' },
    ],
  },
  { key: 'license', title: '系统与License配置', icon: 'key' },
];

function onSelect(item: LxMenuItem) {
  // 实际业务中做 router.push(item.path)
  if (!item.children) activeKey.value = item.key;
}
</script>

<template>
  <div style="height: 560px; position: relative; display: flex">
    <LxSidebar :items="items" :active-key="activeKey" @select="onSelect" />
    <div style="flex: 1; background: var(--lx-bg-page); display: flex; align-items: center; justify-content: center; color: var(--lx-text-secondary)">
      工作区
    </div>
  </div>
</template>
