/**
 * ProTable 默认响应格式化器
 *
 * 设计目标：
 * - 覆盖项目后端的 4 种常见响应结构
 * - 作为独立模块导出，业务方可在 on-response 回调中复用
 * - 不修改原始响应，仅读取字段
 *
 * 支持的响应结构（按优先级）：
 * 1. 标准分页：{ code, msg, data: { records, total, current, size } }
 * 2. 直接分页：{ records, total }（无 code 包装，如 getCollaborationPage）
 * 3. 标准数组：{ code, msg, data: [...] }
 * 4. 直接数组：[...]
 *
 * @packageDocumentation
 */

/**
 * 默认 records 提取器
 * 从响应中提取列表数据，兼容 4 种结构
 * @param res API 响应
 * @returns 记录数组，无数据时返回空数组
 */
export function defaultGetRecords(res: unknown): any[] {
  if (res == null) return [];

  // 4. 直接数组
  if (Array.isArray(res)) return res;

  const obj = res as Record<string, any>;

  // 1. 标准分页 { code, data: { records } }
  if (obj.data?.records) {
    return Array.isArray(obj.data.records) ? obj.data.records : [];
  }

  // 2. 直接分页 { records }
  if (obj.records) {
    return Array.isArray(obj.records) ? obj.records : [];
  }

  // 3. 标准数组 { code, data: [] }
  if (Array.isArray(obj.data)) {
    return obj.data;
  }

  return [];
}

/**
 * 默认 total 提取器
 * 从响应中提取总数，兼容 4 种结构
 * @param res API 响应
 * @returns 总数，无数据时返回 0
 */
export function defaultGetTotal(res: unknown): number {
  if (res == null) return 0;

  // 4. 直接数组
  if (Array.isArray(res)) return res.length;

  const obj = res as Record<string, any>;

  // 1. 标准分页 { code, data: { total } }
  if (obj.data?.total != null) {
    const t = Number(obj.data.total);
    return Number.isNaN(t) ? 0 : t;
  }

  // 2. 直接分页 { total }
  if (obj.total != null) {
    const t = Number(obj.total);
    return Number.isNaN(t) ? 0 : t;
  }

  // 3. 标准数组 { code, data: [] }
  if (Array.isArray(obj.data)) {
    return obj.data.length;
  }

  return 0;
}

/**
 * 默认格式化器对象，统一导出方便业务方复用
 * @example
 * ```ts
 * function handleResponse(res: any) {
 *   tableData.value = defaultTableFormatter.getRecords(res);
 *   tableTotal.value = defaultTableFormatter.getTotal(res);
 * }
 * ```
 */
export const defaultTableFormatter = {
  getRecords: defaultGetRecords,
  getTotal: defaultGetTotal,
} as const;

export default defaultTableFormatter;
