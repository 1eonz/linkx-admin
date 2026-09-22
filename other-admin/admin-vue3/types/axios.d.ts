import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * 统一 API 响应结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  headers?: Record<string, string>;
}

/**
 * 分页响应结构
 */
export interface PaginatedResult<T = unknown> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

/**
 * HttpResult：带有 abortFetch 能力的 Promise
 */
export type HttpResult<T = unknown> = { abortFetch: () => void } & Promise<ApiResponse<T>>;

/**
 * HttpRequestConfig：扩展 axios 配置
 */
export interface HttpRequestConfig extends Partial<InternalAxiosRequestConfig> {
  abort?: AbortSignal;
}

/**
 * Axios 结果类型（兼容历史返回 res 而非 response）
 */
export type AxiosResult<T = unknown> = ApiResponse<T>;

declare module 'axios' {
  export interface AxiosResponse<T = ApiResponse> {
    data: T;
    headers: Record<string, string>;
  }
}
