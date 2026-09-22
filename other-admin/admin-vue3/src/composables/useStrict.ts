import { ElMessage } from 'element-plus';
import { onMounted, onBeforeUnmount } from 'vue';

import router from '@/router';
import { useUserStore } from '@/store/modules/useUserStore';

const TIMEOUT = 60 * 60 * 1000; // 60 分钟
const CHECK_INTERVAL = 30 * 1000; // 30 秒检查一次

let lastRequestTime = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

function initLastTime(): void {
  lastRequestTime = Date.now();
}

/**
 * 启动会话超时检测
 * 60 分钟无操作自动登出
 */
export function useStrict(): void {
  onMounted(() => {
    initLastTime();

    window.document.addEventListener('mousedown', initLastTime);

    timer = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastRequestTime > TIMEOUT) {
        console.warn('会话已超时，自动登出');
        if (timer) clearInterval(timer);

        const userStore = useUserStore();
        userStore.logoutAction().then(() => {
          router.push('/login');
        });

        ElMessage({
          message: '会话已超时，已自动登出',
          type: 'warning',
        });
      }
    }, CHECK_INTERVAL);
  });

  onBeforeUnmount(() => {
    window.document.removeEventListener('mousedown', initLastTime);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
}

/**
 * 标记最近请求时间（供业务代码主动调用）
 */
export function markRequest(): void {
  initLastTime();
}
