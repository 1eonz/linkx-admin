import { ElMessage } from 'element-plus';

import { keepalive } from '@/api/user';
import router from '@/router';
import { useKeepAliveStore } from '@/store/modules/useKeepAliveStore';
import { useUserStore } from '@/store/modules/useUserStore';

export const HEARTBEAT_INTERVAL = 5 * 1000;
export const SESSION_TIMEOUT = 60 * 60 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
let timeoutTimer: ReturnType<typeof setInterval> | undefined;
let lastActivityAt = Date.now();
let endingSession = false;

export function markSessionActivity(): void {
  lastActivityAt = Date.now();
}

export function stopSessionMonitoring(): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (timeoutTimer) clearInterval(timeoutTimer);
  heartbeatTimer = undefined;
  timeoutTimer = undefined;
  window.removeEventListener('mousedown', markSessionActivity);
  window.removeEventListener('keydown', markSessionActivity);
}

export function endSession(message?: string): Promise<void> {
  if (endingSession) return Promise.resolve();
  endingSession = true;
  stopSessionMonitoring();
  return useUserStore()
    .logoutAction()
    .finally(() => {
      useKeepAliveStore().clearCachedViews();
      return router.replace('/login').then(() => {
        if (message) ElMessage.warning(message);
      });
    })
    .then(() => undefined)
    .finally(() => {
      endingSession = false;
    });
}

function heartbeat(): Promise<void> {
  const store = useUserStore();
  const token = store.token;
  if (!token) return Promise.resolve();
  return keepalive()
    .then((result) => {
      if (result.code !== 0 && store.token === token) return endSession('登录已过期，请重新登录');
    })
    .catch(() => {
      // 网络故障交由 HTTP 层提示，不将有效本地会话误判为过期。
    });
}

function checkIdleTimeout(): void {
  if (Date.now() - lastActivityAt >= SESSION_TIMEOUT) {
    void endSession('会话已超时，已自动登出');
  }
}

export function startSessionMonitoring(): void {
  stopSessionMonitoring();
  endingSession = false;
  markSessionActivity();
  window.addEventListener('mousedown', markSessionActivity);
  window.addEventListener('keydown', markSessionActivity);
  heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL);
  timeoutTimer = setInterval(checkIdleTimeout, 30 * 1000);
}
