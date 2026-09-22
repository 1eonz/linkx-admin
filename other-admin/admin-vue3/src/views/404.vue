<script setup lang="ts">
import { useRouter } from 'vue-router';

defineOptions({ name: 'NotFound' });

const router = useRouter();

function goHome(): void {
  router.push('/');
}
</script>

<template>
  <div class="not-found">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-color: @color-bg-page;

  .content {
    text-align: center;

    .error-code {
      // 响应式字号：小屏不溢出（80px），大屏保持视觉冲击（120px）
      font-size: clamp(80px, 15vw, 120px);
      color: var(--el-color-primary);
      margin: 0 0 16px;
      font-weight: 700;
      line-height: 1;
    }

    .error-desc {
      font-size: @font-size-lg;
      color: @color-text-secondary;
      margin-bottom: 24px;
    }
  }
}
</style>
