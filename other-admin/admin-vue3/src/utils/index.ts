import dayjs from 'dayjs';

/**
 * 格式化时间
 * @param time 时间戳/Date/字符串
 * @param format 格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
export function parseTime(time: number | Date | string | null, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!time) return '';
  return dayjs(time).format(format);
}

/**
 * 格式化时间（与 parseTime 同义）
 */
export function formatTime(time: number | Date | string | null, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return parseTime(time, format);
}

/**
 * 对象转 URL 查询字符串
 */
export function param2Obj(url: string): Record<string, string> {
  const search = url.split('?')[1];
  if (!search) return {};
  const obj: Record<string, string> = {};
  search.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      obj[key] = decodeURIComponent(value ?? '');
    }
  });
  return obj;
}

/**
 * 树形数据平铺转换
 * @param data 树形数据
 * @returns 扁平数组，每项带 _level 字段
 */
export function treeDataTranslate<T extends { children?: T[] }>(
  data: T[],
): Array<T & { _level: number; _parentId?: string }> {
  const result: Array<T & { _level: number; _parentId?: string }> = [];
  function translate(list: T[], level: number, parentId?: string): void {
    list.forEach((item) => {
      const { children, ...rest } = item as Record<string, unknown>;
      const newItem = { ...(rest as T), _level: level, _parentId: parentId };
      result.push(newItem);
      if (Array.isArray(children) && children.length > 0) {
        translate(children, level + 1, (item as { id?: string }).id);
      }
    });
  }
  translate(data, 0);
  return result;
}

/**
 * 深拷贝
 */
export function deepCopy<T>(source: T): T {
  if (source === null || typeof source !== 'object') return source;
  if (Array.isArray(source)) return source.map((i) => deepCopy(i)) as unknown as T;
  const result: Record<string, unknown> = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = deepCopy((source as Record<string, unknown>)[key]);
    }
  }
  return result as unknown as T;
}

/**
 * 过滤组织列表（用于 SelectTree 中只保留部门类型节点）
 */
export function filterOrgList<T extends { type?: number; children?: T[] }>(list: T[]): T[] {
  return list.filter((item) => {
    if (item.children && item.children.length > 0) {
      item.children = filterOrgList(item.children);
    }
    return item.type === undefined || item.type === 1;
  });
}

/**
 * 下载服务文件（流式 Blob）
 */
export function getServiceFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 下载 JSON 文件
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  getServiceFile(blob, filename);
}
