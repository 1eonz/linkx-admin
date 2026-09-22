/**
 * useFetch - 通用请求 hooks
 *
 * 设计目标：
 * - 基于 Composition API 封装异步请求的 loading/data/error 三态管理
 * - 内置 AbortController 自动取消上一次未完成请求，避免竞态覆盖
 * - 支持 immediate（立即执行）/ watch（响应式源自动触发）/ 防抖/节流 / 重试 / 轮询
 * - 支持 mutate 乐观更新，不重新请求即可修改 data
 * - 不绑定具体响应结构，业务方在 fetchFn 内自行处理 http.ts 返回
 *
 * 使用示例：
 * ```ts
 * // 基础用法
 * const { data, loading, fetch } = useFetch({
 *   fetchFn: (params) => getUserList(params),
 *   immediate: true,
 *   defaultParams: [{ pageNum: 1, pageSize: 10 }],
 * });
 *
 * // 防抖搜索
 * const { fetch: search } = useFetch({
 *   fetchFn: (kw) => searchUser({ keyword: kw }),
 *   debounceInterval: 300,
 * });
 *
 * // 轮询（实时数据看板）
 * const { data, cancel } = useFetch({
 *   fetchFn: getDashboardStats,
 *   immediate: true,
 *   pollingInterval: 30000,
 * });
 * onUnmounted(() => cancel());
 *
 * // 乐观更新
 * const { data, mutate, fetch } = useFetch({
 *   fetchFn: getTodoList,
 *   immediate: true,
 * });
 * async function addTodo(todo) {
 *   await createTodo(todo);
 *   mutate(prev => [...(prev ?? []), todo]);
 * }
 * ```
 *
 * @packageDocumentation
 */

import { onUnmounted, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue';

// ===== debounce / throttle 工具函数 =====

/**
 * 防抖函数：在指定间隔内多次调用只执行最后一次
 * @param fn 需要防抖的函数
 * @param wait 间隔（毫秒）
 */
function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    return new Promise<ReturnType<T>>((resolve) => {
      timer = setTimeout(() => resolve(fn(...args)), wait);
    });
  }) as T;
}

/**
 * 节流函数：在指定间隔内最多执行一次
 * @param fn 需要节流的函数
 * @param wait 间隔（毫秒）
 */
function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      lastTime = now;
      return Promise.resolve(fn(...args));
    }
    return new Promise<ReturnType<T>>((resolve) => {
      if (!timer) {
        timer = setTimeout(() => {
          lastTime = Date.now();
          timer = undefined;
          resolve(fn(...args));
        }, remaining);
      }
    });
  }) as T;
}

// ===== 类型定义 =====

/**
 * useFetch 配置项
 * @interface UseFetchOptions
 * @template TData 响应数据类型
 * @template TParams 参数元组类型
 */
export interface UseFetchOptions<TData, TParams extends any[]> {
  /**
   * 请求函数（必填）。
   * 返回 Promise<TData> 或 Promise<ApiResponse<TData>>，由业务方在函数内决定如何处理 http.ts 返回值。
   * 内部不关心响应结构，只负责管理 loading / data / error。
   */
  fetchFn: (...args: TParams) => Promise<TData>;

  /**
   * 默认参数。immediate=true 时首次调用使用。
   * 若不传且 immediate=true，则首次调用使用空数组作为参数。
   */
  defaultParams?: TParams;

  /**
   * 是否在 onMounted 时立即执行请求（默认 false）。
   * 建议查询场景设为 true，提交场景设为 false（手动调用 fetch）。
   */
  immediate?: boolean;

  /**
   * 自动取消上一次未完成请求（默认 true）。
   * 防止快速切换页码时旧请求覆盖新结果。
   * 设为 false 时，旧请求会并行进行，可能导致 data 闪烁。
   */
  abortPrevious?: boolean;

  /**
   * 监听响应式源变化自动请求。
   * 适合筛选条件变化自动查询的场景。
   * 注意：搜索输入框场景请优先使用 debounceInterval，避免每个字符都触发请求。
   * @example
   * ```ts
   * const keyword = ref('');
   * useFetch({
   *   fetchFn: () => search({ kw: keyword.value }),
   *   watch: keyword,
   * });
   * ```
   */
  watch?: WatchSource | WatchSource[];

  /**
   * watch 触发时的参数转换函数。
   * 默认使用 defaultParams。若不提供 defaultParams 且不提供此函数，则使用空数组。
   */
  watchParams?: () => TParams;

  /**
   * 轮询间隔（毫秒）。>0 启用轮询。
   * 适合实时数据看板场景。
   * 组件卸载时自动停止轮询。
   */
  pollingInterval?: number;

  /**
   * 轮询时是否在页面隐藏（document.hidden）时暂停（默认 true）。
   * 节省服务器资源，避免用户不可见时仍发起请求。
   */
  pollingWhenHidden?: boolean;

  /**
   * 防抖间隔（毫秒）。>0 启用防抖。
   * 适合搜索输入框场景。
   * 注意：防抖作用于 fetch 方法，不影响 immediate 和 watch。
   */
  debounceInterval?: number;

  /**
   * 节流间隔（毫秒）。>0 启用节流。
   * 与 debounceInterval 互斥，优先使用 debounceInterval。
   */
  throttleInterval?: number;

  /**
   * 失败重试次数（默认 0，不重试）。
   * 网络波动场景适用。
   * 重试间隔固定为 retryInterval，不指数退避（保持简单）。
   */
  retryCount?: number;

  /**
   * 重试间隔（毫秒，默认 1000）。
   */
  retryInterval?: number;

  /**
   * 成功回调。在 data 更新后触发。
   * @param data 响应数据
   * @param params 请求参数
   */
  onSuccess?: (data: TData, params: TParams) => void;

  /**
   * 错误回调。
   * 注意：fetchFn 内部抛出的异常才会触发，http.ts 默认不抛错（catch 后返回空对象）。
   * 若需在 http.ts 不抛错的情况下捕获业务错误，请在 fetchFn 内自行判断 code 并 throw。
   * @param error 错误对象
   * @param params 请求参数
   * @returns 返回 false 阻止默认错误处理（仅 console.error）
   */
  onError?: (error: Error, params: TParams) => boolean | void;

  /**
   * 完成回调（无论成功失败，在 loading=false 前触发）。
   * @param params 请求参数
   */
  onFinally?: (params: TParams) => void;
}

/**
 * useFetch 返回值
 * @interface UseFetchReturn
 */
export interface UseFetchReturn<TData, TParams extends any[]> {
  /**
   * 响应数据。初始为 undefined，请求成功后更新。
   * 建议使用 shallowRef 避免大对象深度响应式开销。
   */
  data: Ref<TData | undefined>;

  /**
   * 加载中状态。
   * true 表示有请求进行中。
   */
  loading: Ref<boolean>;

  /**
   * 错误信息。请求失败时设置，成功时重置为 undefined。
   */
  error: Ref<Error | undefined>;

  /**
   * 最近一次请求参数（只读）。
   * 用于 refresh 时复用参数。
   */
  params: Readonly<Ref<TParams | undefined>>;

  /**
   * 手动触发请求。
   * @param args 请求参数，覆盖 defaultParams
   * @returns Promise<TData | undefined>，失败时返回 undefined
   */
  fetch: (...args: TParams) => Promise<TData | undefined>;

  /**
   * 刷新：使用上一次参数重新请求。
   * 若从未请求过，则使用 defaultParams。
   * @returns Promise<TData | undefined>
   */
  refresh: () => Promise<TData | undefined>;

  /**
   * 重置为初始状态：data=undefined, loading=false, error=undefined, params=undefined。
   * 同时取消当前未完成请求。
   */
  reset: () => void;

  /**
   * 取消当前未完成请求（通过 AbortController.abort）。
   * 不会重置 data/loading，仅中断请求。
   */
  cancel: () => void;

  /**
   * 乐观更新：直接修改 data，不发起请求。
   * 适合增删改后立即更新 UI，再异步请求确认。
   * @param newData 新数据，或接收旧数据返回新数据的函数
   * @example
   * ```ts
   * mutate([newItem, ...oldList]); // 直接赋值
   * mutate(prev => prev.filter(item => item.id !== deletedId)); // 函数式更新
   * ```
   */
  mutate: (newData: TData | ((prev: TData | undefined) => TData)) => void;
}

// ===== useFetch 实现 =====

/**
 * 创建请求管理 hooks
 * @param options 配置项
 * @returns UseFetchReturn
 */
export function useFetch<TData, TParams extends any[] = any[]>(
  options: UseFetchOptions<TData, TParams>,
): UseFetchReturn<TData, TParams> {
  const {
    fetchFn,
    defaultParams,
    immediate = false,
    abortPrevious = true,
    watch: watchSource,
    watchParams,
    pollingInterval = 0,
    pollingWhenHidden = true,
    debounceInterval = 0,
    throttleInterval = 0,
    retryCount = 0,
    retryInterval = 1000,
    onSuccess,
    onError,
    onFinally,
  } = options;

  // ===== 状态 =====
  const data = shallowRef<TData | undefined>(undefined);
  const loading = ref(false);
  const error = ref<Error | undefined>(undefined);
  const params = shallowRef<TParams | undefined>(undefined);

  // ===== 内部变量 =====
  // 当前请求的 AbortController，用于取消未完成请求
  let currentController: AbortController | undefined;
  // 请求序号，用于判断请求是否过期（旧请求完成后不覆盖新请求结果）
  let requestSeq = 0;
  // 轮询定时器
  let pollingTimer: ReturnType<typeof setTimeout> | undefined;
  // 页面可见性监听器引用
  let visibilityHandler: (() => void) | undefined;

  /**
   * 执行一次请求（含重试逻辑）
   */
  async function executeOnce(p: TParams): Promise<TData | undefined> {
    const controller = new AbortController();
    if (abortPrevious && currentController) {
      currentController.abort();
    }
    currentController = controller;
    const seq = ++requestSeq;

    loading.value = true;
    error.value = undefined;

    try {
      const result = await fetchFn(...p);
      // 请求已过期（被新请求取消），丢弃结果
      if (seq !== requestSeq) return undefined;

      data.value = result;
      onSuccess?.(result, p);
      return result;
    } catch (err) {
      // 请求已过期
      if (seq !== requestSeq) return undefined;

      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      const shouldSuppress = onError?.(e, p);
      if (shouldSuppress !== false) {
        // 默认错误处理：仅 console.error，不弹 toast（http.ts 已处理）
        console.error('[useFetch] 请求失败:', e);
      }
      return undefined;
    } finally {
      if (seq === requestSeq) {
        loading.value = false;
        onFinally?.(p);
      }
    }
  }

  /**
   * 带重试的请求执行
   */
  async function executeWithRetry(p: TParams): Promise<TData | undefined> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const result = await executeOnce(p);
      if (result !== undefined || error.value === undefined) {
        return result;
      }
      lastError = error.value;
      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
    if (lastError) {
      error.value = lastError;
    }
    return undefined;
  }

  /**
   * fetch 函数（可能被防抖/节流包装）
   */
  let rawFetch = executeWithRetry;
  if (debounceInterval > 0) {
    rawFetch = debounce(executeWithRetry, debounceInterval) as typeof executeWithRetry;
  } else if (throttleInterval > 0) {
    rawFetch = throttle(executeWithRetry, throttleInterval) as typeof executeWithRetry;
  }

  /**
   * 触发请求
   */
  async function fetch(...args: TParams): Promise<TData | undefined> {
    params.value = args;
    return rawFetch(args);
  }

  /**
   * 刷新：用上一次参数重新请求
   */
  async function refresh(): Promise<TData | undefined> {
    const lastParams = params.value ?? defaultParams;
    if (!lastParams) {
      console.warn('[useFetch] refresh 失败：无历史参数且未提供 defaultParams');
      return undefined;
    }
    return fetch(...(lastParams as TParams));
  }

  /**
   * 重置状态
   */
  function reset(): void {
    cancel();
    data.value = undefined;
    loading.value = false;
    error.value = undefined;
    params.value = undefined;
  }

  /**
   * 取消当前请求
   */
  function cancel(): void {
    if (currentController) {
      currentController.abort();
      currentController = undefined;
    }
    stopPolling();
  }

  /**
   * 乐观更新
   */
  function mutate(newData: TData | ((prev: TData | undefined) => TData)): void {
    if (typeof newData === 'function') {
      data.value = (newData as (prev: TData | undefined) => TData)(data.value);
    } else {
      data.value = newData;
    }
  }

  // ===== 轮询逻辑 =====
  /**
   * 启动轮询
   */
  function startPolling(): void {
    if (pollingInterval <= 0) return;

    stopPolling();
    pollingTimer = setInterval(() => {
      // 页面隐藏时不轮询
      if (pollingWhenHidden && typeof document !== 'undefined' && document.hidden) {
        return;
      }
      refresh();
    }, pollingInterval);

    // 监听页面可见性变化
    if (pollingWhenHidden && typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (!document.hidden) {
          // 页面重新可见时立即刷新一次
          refresh();
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    }
  }

  /**
   * 停止轮询
   */
  function stopPolling(): void {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = undefined;
    }
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = undefined;
    }
  }

  // ===== 生命周期 =====
  // immediate=true 时立即执行
  if (immediate) {
    const initialParams = (defaultParams ?? []) as unknown as TParams;
    // 注意：immediate 模式下，fetch 是同步调用，但内部 executeWithRetry 是异步的
    fetch(...initialParams);
  }

  // watch 响应式源
  if (watchSource) {
    watch(
      watchSource as WatchSource,
      () => {
        const p = watchParams ? watchParams() : (defaultParams ?? ([] as unknown as TParams));
        fetch(...p);
      },
      // deep: false（默认），避免对象深度监听频繁触发
    );
  }

  // 启动轮询
  if (pollingInterval > 0) {
    startPolling();
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cancel();
  });

  return {
    data,
    loading,
    error,
    params: params as Readonly<Ref<TParams | undefined>>,
    fetch,
    refresh,
    reset,
    cancel,
    mutate,
  };
}

export default useFetch;
