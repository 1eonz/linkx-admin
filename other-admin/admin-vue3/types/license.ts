/**
 * License 权限对象
 */
export interface LicenseAuth {
  /** 群组协同 License 权限 */
  groupCollaborationAuth: boolean;
  /** 任务协同 License 权限 */
  taskCollaborationAuth: boolean;
  /** 业务协同 License 权限 */
  businessCollaborationAuth: boolean;
  /** AI 协同 License 权限 */
  AICollaborationAuth: boolean;
  /** 北向数据接口 License 权限 */
  northboundDataInterface: boolean;
  /** License 状态：0未激活/1激活/2即将过期/3已过期/4失效可试用/5失效 */
  licenseState: number;
  /** 过期日期 */
  expireDate?: string;
}

/**
 * License 接口原始数据
 */
export interface LicenseInfo {
  status: number;
  expireDate?: string;
  LINKXBS?: string;
  LINKXGCF?: string;
  LINKXTCF?: string;
  LINKXBCF?: string;
  LINKXACF?: string;
  LINKXNDI?: string;
}

export const DEFAULT_LICENSE_AUTH: LicenseAuth = {
  groupCollaborationAuth: true,
  taskCollaborationAuth: true,
  businessCollaborationAuth: true,
  AICollaborationAuth: true,
  northboundDataInterface: true,
  licenseState: 999,
  expireDate: '',
};
