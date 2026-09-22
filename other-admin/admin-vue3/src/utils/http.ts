import axios, {
  type AxiosInstance,
  type AxiosPromise,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';

import type { ApiResponse, HttpResult, HttpRequestConfig } from '#/axios';
import { getToken } from './auth';
import { CLIENT_TYPE, getBrowserInfo, getOSInfo, getScreenInfo } from './clientEnv';

/**
 * 浏览器原生 atob 解码 Base64（处理 UTF-8）
 */
function decodeBase64(base64: string): string {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

const timeout = 60 * 1000;
let time401: ReturnType<typeof setTimeout> | undefined;
let msgFlag = true;

// HTTP 请求控制器集合，用于取消请求
export const httpController: Map<string, AbortController> = new Map();

// 处理取消请求
function processController(url: string, param?: unknown, controller?: AbortController): AbortController {
  const ctrl = controller ?? new AbortController();
  const key = url + JSON.stringify(param ?? '');
  httpController.set(key, ctrl);
  setTimeout(() => {
    if (httpController.get(key) === ctrl) {
      httpController.delete(key);
    }
  }, timeout);
  return ctrl;
}

class HttpService {
  private http!: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: import.meta.env.VITE_BASE_API as string,
      timeout,
    });
    this.addInterceptors(this.http);
  }

  private addInterceptors(http: AxiosInstance): void {
    // 请求拦截器
    http.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 应用 ID、AppKey（admin 专用值）
        config.headers['applicationId'] = '1289822833455460000';
        config.headers['X-CloudCmd-AppKey'] = 'CDC-2000';

        // 语言
        const lang = localStorage.getItem('localLanguage');
        config.headers['Accept-Language'] = lang === 'en' ? 'en-us, en;q=1, en;q=0,' : 'zh-cn, zh;q=1, en;q=0,';

        // Token
        const token = getToken();
        if (token) {
          config.headers.Authorization = `token ${token}`;
        }

        // 客户端环境信息
        config.headers['X-Browser'] = getBrowserInfo();
        config.headers['X-OS'] = getOSInfo();
        config.headers['X-Screen'] = getScreenInfo();
        config.headers['X-Client-Type'] = CLIENT_TYPE.ADMIN;

        return config;
      },
      (error) => Promise.reject(error),
    );

    // 响应拦截器
    http.interceptors.response.use(
      (response: AxiosResponse) => {
        const { config, data, headers } = response;

        // 登录接口 License 提示
        const licenseList = ['/oauth/v2/login'];
        if (licenseList.includes(config.url ?? '') && data?.code === 0) {
          const warning = headers['x-cloudcmd-license-warning'];
          if (warning) {
            const message = decodeBase64(warning as string);
            if (message) {
              data.msg = message;
            }
          }
        }

        // 透传 headers 到返回结果
        data.headers = headers;
        return data;
      },
      async (error) => {
        const { response, config } = error;
        const status = response?.status;
        const url = config?.url ?? '';

        // 动态导入避免循环依赖
        const { closeAllDialogs } = await import('./createDialog');
        const { useUserStore } = await import('@/store/modules/useUserStore');
        const router = (await import('@/router')).default;

        if (status === 401) {
          if (msgFlag) {
            msgFlag = false;
            closeAllDialogs();
            ElMessage({
              message: '登录已过期，请重新登录',
              type: 'warning',
              duration: 5000,
            });
            const userStore = useUserStore();
            await userStore.resetTokenAction();
            router.push('/login');
            // 1 秒后恢复提示能力
            setTimeout(() => {
              msgFlag = true;
            }, 1000);
          }
        } else if (status === 403) {
          ElMessage({
            message: response?.data?.msg ?? '请求失败',
            type: 'error',
            duration: 5000,
          });
        } else {
          if (msgFlag) {
            ElMessage({
              message: response?.data?.msg ?? '请求失败',
              type: 'error',
              duration: 5000,
            });
          }
        }
        // 不抛错，业务层通过 code 判断
        return Promise.resolve(response?.data ?? {});
      },
    );
  }

  private async handleErrorWrapper<T>(p: AxiosPromise<ApiResponse>): Promise<ApiResponse<T>> {
    return p.then((response) => response as unknown as ApiResponse<T>).catch((error) => error as ApiResponse<T>);
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleErrorWrapper<T>(this.http.delete(url, config));
  }

  get<T>(url: string, config?: HttpRequestConfig): HttpResult<T> {
    const controller = processController(url, config?.params);
    const signal = config?.abort ?? controller.signal;

    const handler = this.handleErrorWrapper<T>(this.http.get(url, { ...config, signal })) as HttpResult<T>;
    handler.abortFetch = () => controller.abort();
    return handler;
  }

  post<T>(url: string, param?: unknown, config?: HttpRequestConfig): HttpResult<T> {
    const controller = processController(url, param);
    const signal = config?.abort ?? controller.signal;

    const handler = this.handleErrorWrapper<T>(this.http.post(url, param, { ...config, signal })) as HttpResult<T>;
    handler.abortFetch = () => controller.abort();
    return handler;
  }

  postDownload<T>(url: string, param: unknown): Promise<ApiResponse<T>> {
    return this.handleErrorWrapper<T>(this.http.post(url, param, { responseType: 'arraybuffer' }));
  }

  put<T>(url: string, param: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleErrorWrapper<T>(this.http.put(url, param, config));
  }
}

export const httpService = new HttpService();

export default httpService;
