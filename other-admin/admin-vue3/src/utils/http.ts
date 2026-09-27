import axios, {
  type AxiosInstance,
  type AxiosPromise,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';

import type { ApiResponse, BinaryApiResponse, HttpResult, HttpRequestConfig } from '#/axios';
import { getRequestToken } from './auth';
import { CLIENT_TYPE, getBrowserInfo, getOSInfo, getScreenInfo } from './clientEnv';
import { endSession } from './session';

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

export function applyLoginLicenseWarning<T extends ApiResponse>(data: T, warning: unknown): T {
  if (typeof warning !== 'string') return data;
  const message = decodeBase64(warning);
  if (!message) return data;
  if (data.code !== 121) data.msg = message;
  data.licenseWarning = message;
  return data;
}

export function isBinaryPayload(data: unknown): data is Blob | ArrayBuffer {
  return data instanceof Blob || data instanceof ArrayBuffer;
}

export function attachResponseHeaders<T>(data: T, headers: Record<string, unknown>): T {
  if (data && typeof data === 'object' && !isBinaryPayload(data)) {
    (data as { headers?: Record<string, unknown> }).headers = headers;
  }
  return data;
}

export function isCurrentAuthRequest(requestToken: string | undefined, currentToken: string | null): boolean {
  return Boolean(requestToken) && requestToken === currentToken;
}

const timeout = 60 * 1000;
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

function getRequestSignal(controller: AbortController, external?: AbortSignal): AbortSignal {
  if (external?.aborted) controller.abort();
  else external?.addEventListener('abort', () => controller.abort(), { once: true });
  return controller.signal;
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
        const token = getRequestToken();
        if (token) {
          config.headers.Authorization = `token ${token}`;
        }
        (config as InternalAxiosRequestConfig & { __authToken?: string }).__authToken = token ?? undefined;
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
        if (
          !isBinaryPayload(data) &&
          licenseList.some((path) => (config.url ?? '').endsWith(path)) &&
          [0, 121].includes(data?.code)
        ) {
          const warning = headers['x-cloudcmd-license-warning'];
          if (warning) {
            applyLoginLicenseWarning(data, warning);
          }
        }

        if ((config as InternalAxiosRequestConfig & { __returnBinaryResponse?: boolean }).__returnBinaryResponse) {
          return { data, headers };
        }

        // 透传 headers 到返回结果
        return attachResponseHeaders(data, headers);
      },
      async (error) => {
        const { response, config } = error;
        const status = response?.status;
        const cancelled = axios.isCancel(error) || error?.code === 'ERR_CANCELED' || config?.signal?.aborted;
        if (cancelled) return Promise.reject(error);

        // 动态导入避免循环依赖
        const { closeAllDialogs } = await import('./createDialog');
        if (status === 401) {
          const requestToken = (config as (InternalAxiosRequestConfig & { __authToken?: string }) | undefined)
            ?.__authToken;
          if (!isCurrentAuthRequest(requestToken, getRequestToken())) return Promise.reject(error);
          if (msgFlag) {
            msgFlag = false;
            closeAllDialogs();
            ElMessage({
              message: '登录已过期，请重新登录',
              type: 'warning',
              duration: 5000,
            });
            return endSession()
              .finally(() => {
                // 无论登出路由是否成功，都恢复后续请求的提示能力。
                setTimeout(() => {
                  msgFlag = true;
                }, 1000);
              })
              .then(() => Promise.reject(error));
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
        return Promise.reject(error);
      },
    );
  }

  private async handleErrorWrapper<T>(p: AxiosPromise<ApiResponse>): Promise<ApiResponse<T>> {
    return p.then((response) => response as unknown as ApiResponse<T>);
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleErrorWrapper<T>(this.http.delete(url, config));
  }

  get<T>(url: string, config?: HttpRequestConfig): HttpResult<T> {
    const controller = processController(url, config?.params);
    const signal = getRequestSignal(controller, config?.abort);

    const handler = this.handleErrorWrapper<T>(this.http.get(url, { ...config, signal })) as HttpResult<T>;
    handler.abortFetch = () => controller.abort();
    return handler;
  }

  getBinary<T extends Blob | ArrayBuffer>(
    url: string,
    config: HttpRequestConfig & { responseType: 'arraybuffer' | 'blob' },
  ): Promise<BinaryApiResponse<T>> {
    const controller = processController(url, config.params);
    const signal = getRequestSignal(controller, config.abort);
    const binaryConfig = { ...config, signal, __returnBinaryResponse: true };

    return this.http.get<T>(url, binaryConfig).then(({ data, headers }) => ({ data, headers }));
  }

  post<T>(url: string, param?: unknown, config?: HttpRequestConfig): HttpResult<T> {
    const controller = processController(url, param);
    const signal = getRequestSignal(controller, config?.abort);

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
