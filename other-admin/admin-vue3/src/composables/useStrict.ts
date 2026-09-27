import { onBeforeUnmount, onMounted } from 'vue';

import { getToken } from '@/utils/auth';
import { markSessionActivity, startSessionMonitoring, stopSessionMonitoring } from '@/utils/session';

/**
 * 启动会话超时检测
 * 60 分钟无操作自动登出
 */
export function useStrict(): void {
  onMounted(() => {
    if (getToken()) startSessionMonitoring();
  });

  onBeforeUnmount(() => {
    stopSessionMonitoring();
  });
}

/**
 * 标记最近请求时间（供业务代码主动调用）
 */
export function markRequest(): void {
  markSessionActivity();
}
