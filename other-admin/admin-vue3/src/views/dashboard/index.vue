<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { queryGlobalsList } from '@/api/dictionary/globals';
import { getVersion } from '@/api/user';
import versionIcon from '@/assets/images/version-info.svg';
import { useSystemTitle } from '@/composables/useSystemTitle';

defineOptions({ name: 'Dashboard' });

const { welcomeText } = useSystemTitle();

const linkxVersion = ref('-');
const msipVersion = ref('-');
const jxVersion = ref('-');

/**
 * 拉取全局配置并写入 localStorage
 * - localStorage['globalConfig']：完整配置 JSON 字符串（供其他页面读取 DEPARTMENT_SYNC_SIGN、SHOW_331_FEATURE 等）
 * - localStorage['simplePassWord']：'true' / 移除（控制密码策略）
 * 获取全局配置（dashboard.getGlobal() 行为）
 */
async function loadGlobalConfig(): Promise<void> {
  try {
    const res = await queryGlobalsList();
    if (res?.data) {
      if (res.data.ALLOW_SIMPLE_PASSWORD === '1') {
        localStorage.setItem('simplePassWord', 'true');
      } else {
        localStorage.removeItem('simplePassWord');
      }
      localStorage.setItem('globalConfig', JSON.stringify(res.data));
    }
  } catch (error) {
    console.error('[Dashboard] 获取全局配置失败:', error);
  }
}

onMounted(() => {
  // 全局配置初始化（必须，其他页面依赖 localStorage['globalConfig']）
  loadGlobalConfig();
  // 版本信息
  getVersion()
    .then((res) => {
      const data = res?.data as
        | {
            jx?: { serviceVersion?: string };
            eagent?: { serviceVersion?: string };
            linkx?: { serviceVersion?: string };
          }
        | undefined;
      if (data) {
        jxVersion.value = data.jx?.serviceVersion || '-';
        msipVersion.value = data.eagent?.serviceVersion || '-';
        linkxVersion.value = data.linkx?.serviceVersion || '-';
        localStorage.setItem('versionInfo', JSON.stringify(data));
      }
    })
    .catch((error) => {
      console.error('获取版本信息失败:', error);
    });
});
</script>

<template>
  <div class="dashboard-container">
    <div class="welcome-card">
      <div class="welcome-icon">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <rect width="48" height="48" rx="12" fill="var(--el-color-primary)" opacity="0.08" />
          <path
            d="M24 14L14 19v10l10 5 10-5V19l-10-5z"
            stroke="var(--el-color-primary)"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M14 19l10 5 10-5M24 24v10"
            stroke="var(--el-color-primary)"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <h1>{{ welcomeText }}</h1>
    </div>

    <div class="version-badge">
      <el-popover
        placement="top"
        trigger="hover"
        popper-class="version-popover"
        width="auto"
        :offset="8"
        :popper-options="{
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                mainAxis: true,
                altAxis: true,
                padding: 16,
                rootBoundary: 'viewport',
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom', 'left', 'right'],
                padding: 16,
              },
            },
          ],
        }"
      >
        <template #reference>
          <div class="version-trigger">
            <img :src="versionIcon" class="version-icon" />
            <span>版本信息</span>
          </div>
        </template>
        <div class="version-content">
          <div>警务协同版本：{{ linkxVersion }}</div>
          <div>MSIP版本：{{ msipVersion }}</div>
          <div>警信版本：{{ jxVersion }}</div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style lang="less" scoped>
.dashboard-container {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 50px);
  display: flex;
  align-items: center;
  justify-content: center;

  .welcome-card {
    text-align: center;

    .welcome-icon {
      display: inline-flex;
      margin-bottom: @spacing-md-plus;
    }

    h1 {
      font-size: @font-size-display;
      font-weight: @font-weight-semibold;
      color: @color-text-primary;
      letter-spacing: -0.01em;
      margin: 0;
      text-wrap: balance;
    }
  }

  .version-badge {
    position: fixed;
    right: @spacing-lg;
    bottom: @spacing-lg;
    z-index: 1000;
  }

  .version-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: fade(@color-bg-card, 90%);
    backdrop-filter: blur(8px);
    border-radius: @radius-lg;
    cursor: pointer;
    box-shadow: @shadow-floating;
    font-size: @font-size-sm;
    color: @color-text-regular;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: @color-bg-card;
      box-shadow: @shadow-floating-hover;
      transform: translateY(-1px);
    }

    .version-icon {
      width: 16px;
      height: 16px;
      opacity: 0.8;
    }
  }
}
</style>

<style lang="less">
.version-popover {
  .version-content {
    padding: 4px 0;

    div {
      color: @color-text-regular;
      font-size: @font-size-sm;
      font-weight: @font-weight-medium;
      line-height: 22px;
      margin-bottom: 4px;
      white-space: nowrap;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
