import { ElDialog } from 'element-plus';
import { createApp, h, type App, type Component } from 'vue';

/**
 * 维护所有打开的弹窗实例
 */
interface DialogInstance {
  app: App;
  close: () => void;
}

const dialogInstances: DialogInstance[] = [];

/**
 * 关闭所有打开的弹窗
 * @desc 用于退出登录时清理所有弹窗
 */
export function closeAllDialogs(): void {
  dialogInstances.forEach((instance) => {
    try {
      instance.close();
    } catch (e) {
      console.error('closeAllDialogs error:', e);
    }
  });
  dialogInstances.length = 0;
}

interface CreateDialogOptions {
  /** 组件属性 */
  props?: Record<string, unknown>;
  /** 自定义事件回调 */
  on?: Record<string, (...args: unknown[]) => void>;
}

interface DialogConfig {
  title?: string;
  width?: string | number;
  [key: string]: unknown;
}

/**
 * createDialog
 * @desc 传入组件 comp，生成一个弹窗函数 dialogFn
 * @param comp 需要在弹窗中显示的 Vue 组件
 * @param config ElDialog 组件的配置参数
 * @returns dialogFn 调用后会创建并显示弹窗，返回 Promise
 *
 * Promise resolve: 弹窗通过 ok 事件关闭并返回数据
 * Promise reject: { type: 'cancel-dialog' } cancel 事件 / { type: 'close-dialog' } close 事件
 *
 * 子组件触发弹窗:
 *   emit('ok', data)     // 返回数据并关闭
 *   emit('cancel')       // 取消并关闭
 */
export function createDialog<T = unknown>(
  comp: Component,
  config: DialogConfig = { title: '弹窗标题' },
): (options?: CreateDialogOptions) => Promise<T> {
  return (options: CreateDialogOptions = {}) => {
    return new Promise<T>((resolve, reject) => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const props = options.props ?? {};
      const customEvents = options.on ?? {};

      let visible = false;
      let resolved = false;

      const destroy = () => {
        visible = false;
        const idx = dialogInstances.findIndex((i) => i.app === app);
        if (idx > -1) dialogInstances.splice(idx, 1);
        setTimeout(() => {
          app.unmount();
          if (container.parentElement) container.parentElement.removeChild(container);
        }, 300);
      };

      const dialogInstance: DialogInstance = { app: null as unknown as App, close: destroy };

      // 根组件：渲染 ElDialog，内容为传入的 comp
      const Root = {
        setup: () => {
          return () =>
            h(
              ElDialog,
              {
                modelValue: visible,
                'onUpdate:modelValue': (v: boolean) => {
                  visible = v;
                  if (!v && !resolved) {
                    resolved = true;
                    reject({ type: 'close-dialog' });
                    destroy();
                  }
                },
                ...config,
              },
              {
                default: () =>
                  h(comp, {
                    ...props,
                    onCancel: () => {
                      if (resolved) return;
                      resolved = true;
                      reject({ type: 'cancel-dialog' });
                      destroy();
                    },
                    onOk: (data: T) => {
                      if (resolved) return;
                      resolved = true;
                      resolve(data);
                      destroy();
                    },
                    ...customEvents,
                  }),
              },
            );
        },
      };

      const app = createApp(Root);
      app.mount(container);

      dialogInstance.app = app;
      dialogInstances.push(dialogInstance);

      // 下一帧显示，确保动画触发
      requestAnimationFrame(() => {
        visible = true;
      });
    });
  };
}
