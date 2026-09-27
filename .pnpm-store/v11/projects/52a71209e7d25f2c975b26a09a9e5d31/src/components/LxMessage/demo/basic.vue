<script setup lang="ts">
import { lxMessage } from '../../../index';

function success() {
  lxMessage.success('GIS 网格切片更新指令已广播至 14 巡逻终端');
}
function error() {
  lxMessage.error('指令广播失败：3 号网格信道占用');
}
function warning() {
  lxMessage.warning('当前区域处于战备封控期，操作将记录审计日志');
}
function info() {
  lxMessage.info('版本 V4.8.2-SEC 已就绪');
}
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <button class="demo-btn" @click="success">成功提示</button>
    <button class="demo-btn" @click="error">失败提示</button>
    <button class="demo-btn" @click="warning">告警提示</button>
    <button class="demo-btn" @click="info">中性提示</button>
  </div>
</template>
