import type { ApiResponse, HttpResult } from '#/axios';
import type { LoginForm, LoginResult, UserInputForm } from '#/user';
import http from '@/utils/http';

/** OAuth2 客户端固定凭据 */
const CLIENT_ID = 'CDC-2000';
const CLIENT_SECRET = 'CDC-2000';
const GRANT_TYPE = 'password';
const SCOPE = 'all';

/**
 * 生成设备 ID（基于时间戳）
 */
export function getDeviceId(): number {
  return Date.now();
}

/**
 * 登录：组装 OAuth2 密码模式完整请求体
 * 接口契约: POST /oauth/v2/login
 */
export function login(userInput: UserInputForm): HttpResult<LoginResult> {
  const loginForm: LoginForm = {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    grantType: GRANT_TYPE,
    redirectUri: '',
    username: userInput.username,
    password: userInput.password,
    scope: SCOPE,
    state: '',
    deviceId: getDeviceId(),
  };
  return http.post<LoginResult>('/auth/v1/oauth/v2/login', loginForm);
}

/** 登出 */
export function logout(): Promise<ApiResponse> {
  return http.post('/auth/v1/oauth/v2/logout');
}

/** Token 保活 */
export function keepalive(): Promise<ApiResponse> {
  return http.post('/auth/v1/oauth/v2/keepalive');
}

/** 修改密码（自己的密码，需要旧密码） */
export function changePwd(data: {
  username?: string;
  oldPassword: string;
  newPassword: string;
  repeatNewPassword: string;
}): Promise<ApiResponse> {
  return http.post('/auth/v1/oauth/v2/changePwd', data);
}

/** 获取当前用户角色权限 */
export function getRolePermissions(): Promise<ApiResponse> {
  return http.post('/auth/v1/oauth/v2/permissions');
}

/** 获取版本信息 */
export function getVersion(): Promise<ApiResponse> {
  return http.get('/collaboration/v1/base/version');
}
