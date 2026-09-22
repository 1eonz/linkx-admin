<script setup lang="ts">
// demo：LxSelectTree 组织树（搜索 + 父子级联 + 懒加载注入）
import { ref } from 'vue';
import { LxSelectTree, type LxTreeNode } from '../../../index';

const tree: LxTreeNode[] = [
  { key: 'hz', title: '杭州市公安局', children: [
    { key: 'bj', title: '滨江分局', status: 'online', children: [
      { key: 'bj-1', title: '长河派出所' }, { key: 'bj-2', title: '西兴派出所', status: 'busy' },
    ]},
    { key: 'gx', title: '高新园区分局（懒加载）', hasChildren: true, status: 'processing' },
  ]},
  { key: 'nb', title: '宁波市公安局', children: [{ key: 'yz', title: '鄞州分局', children: [{ key: 'yz-1', title: '首南派出所' }] }] },
];
const checkedKeys = ref<(string | number)[]>([]);
// 懒加载：请求由业务注入（组件零请求依赖）
const lazy = (node: LxTreeNode) => new Promise<LxTreeNode[]>(resolve =>
  setTimeout(() => resolve([{ key: `${node.key}-a`, title: '科技城派出所' }, { key: `${node.key}-b`, title: '白杨派出所', status: 'online' }]), 600));
</script>

<template>
  <LxSelectTree v-model:checked-keys="checkedKeys" :data="tree" :lazy="lazy" :height="300" style="max-width:320px" />
</template>
