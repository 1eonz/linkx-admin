/**
 * composables 统一导出入口
 *
 * 使用示例：
 * ```ts
 * import { useFetch, useTable } from '@/composables';
 * ```
 */

export { useFetch, type UseFetchOptions, type UseFetchReturn } from './useFetch';
export { useTable, type UseTableOptions, type UseTableReturn, type PaginationParams } from './useTable';
