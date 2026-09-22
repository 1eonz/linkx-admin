/**
 * 用户信息
 */
export interface UserInfo {
  userId: string;
  userName: string;
  idCardNum?: string;
  isAdmin?: boolean | string;
  avatar?: string;
  thumbAvatar?: string;
  userDepartments?: UserDepartment[];
}

/**
 * 用户所属部门
 */
export interface UserDepartment {
  id: string;
  name: string;
  fullPathName?: string;
  isPrimary?: boolean;
  departmentCode?: string;
}

/**
 * 登录表单（OAuth2 密码模式）
 * 与 Vue2 admin 的接口契约一致
 */
export interface LoginForm {
  /** 客户端 ID（固定 CDC-2000） */
  clientId: string;
  /** 客户端密钥（固定 CDC-2000） */
  clientSecret: string;
  /** 授权类型（固定 'password'） */
  grantType: 'password';
  /** 重定向 URI（密码模式留空） */
  redirectUri: string;
  /** 用户名 */
  username: string;
  /** 密码（明文，HTTPS 传输） */
  password: string;
  /** 授权范围（固定 'all'） */
  scope: string;
  /** 状态值（可留空） */
  state: string;
  /** 设备 ID（前端生成的时间戳） */
  deviceId: number;
}

/**
 * 登录表单（用户在 UI 输入的部分）
 */
export interface UserInputForm {
  username: string;
  password: string;
}

/**
 * 登录结果
 */
export interface LoginResult {
  accessToken: string;
  userName: string;
  userId: string;
  idCardNum: string;
  isAdmin: boolean;
}
