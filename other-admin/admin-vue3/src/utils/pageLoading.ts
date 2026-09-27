import { ElLoading } from 'element-plus';

import { getProcess } from '@/api/h5/collaboration';

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * 同步进度轮询工具
 * - openPageLoading: 开启全屏 loading + 轮询 getProcess 接口
 * - closePageLoading: 关闭 loading + 停止轮询
 * - 轮询间隔 5 秒，data === true 表示同步完成
 * - 完成后延迟 3 秒执行回调（如刷新列表）
 */
export const pageLoadingUtils = {
  /** 是否继续轮询 */
  shouldContinue: false,
  /** 当前是否在 loading 状态 */
  loadingState: false,
  /** Element Plus Loading 实例 */
  loadingInstance: null as ReturnType<typeof ElLoading.service> | null,

  /**
   * 开启全屏 loading + 轮询
   * @param callback 同步完成后的回调（如刷新列表）
   */
  openPageLoading(callback?: () => void): Promise<void> {
    return getProcess().then((result) => {
      // 已经在 loading 或后端已无任务时直接返回
      if (this.loadingState || result?.data) return;
      this.loadingState = true;
      this.shouldContinue = true;
      this.loadingInstance = ElLoading.service({
        lock: true,
        text: '数据同步中...',
        background: 'rgba(255, 255, 255, 0.6)',
      });
      void this.openPageLoadingPolling(callback);
    });
  },

  /**
   * 轮询 getProcess 接口
   * data === true 表示同步完成，停止轮询并执行回调
   */
  openPageLoadingPolling(callback?: () => void): Promise<void> {
    const poll = (): Promise<void> => {
      if (!this.shouldContinue) return Promise.resolve();
      return getProcess()
        .then((result) => {
          if (result?.data === true) {
            // 同步完成
            if (callback) {
              setTimeout(() => {
                this.closePageLoading();
                callback();
              }, 3000);
            } else {
              this.closePageLoading();
            }
            return;
          }
          // 等 5 秒重试
          return wait(5000).then(poll);
        })
        .catch((error) => {
          console.error('请求 queryPageLoadingStatus 出错：', error);
          // 出错也等 5 秒重试
          return wait(5000).then(poll);
        });
    };
    return poll();
  },

  /**
   * 关闭 loading + 停止轮询
   */
  closePageLoading(): void {
    if (!this.loadingState) return;
    this.loadingState = false;
    this.shouldContinue = false;
    this.loadingInstance?.close();
    this.loadingInstance = null;
  },
};
