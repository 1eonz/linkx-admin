import { compile as pathCompile } from 'path-to-regexp';

/**
 * 判断是否外链
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path);
}

/**
 * 校验用户名（目前只是占位）
 */
export function validUsername(_str: string): boolean {
  return true;
}

/**
 * 将路径转换为正则（侧边栏菜单匹配用）
 */
export function compilePath(path: string, params: Record<string, string>): string {
  const fn = pathCompile(path);
  return fn(params);
}
