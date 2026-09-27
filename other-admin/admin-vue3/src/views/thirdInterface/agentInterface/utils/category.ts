import { createCategory, queryCategory } from '@/api/thirdInterface/agentInterface';

export type CategorySaveResult = { ok: true } | { ok: false; message: string; warning?: boolean };

/**
 * 按分类接口的全量替换语义新增分类。
 *
 * @param rawName 用户输入的分类名称，会先去除首尾空白。
 * @returns 成功标记，或可直接展示的失败消息；`warning` 表示输入/重复名称提示。
 * @throws 不向调用方抛出网络异常，读取或保存异常统一转换为失败结果。
 * @remarks 提交前重新读取完整列表，避免读取失败被误当成空列表而覆盖服务器已有分类。
 */
export function addAgentCategory(rawName: string): Promise<CategorySaveResult> {
  const name = rawName.trim();
  if (!name) return Promise.resolve({ ok: false, message: '请输入分类名称', warning: true });

  return queryCategory()
    .then<CategorySaveResult>((current) => {
      if (current?.code !== 0 || !Array.isArray(current.data)) {
        return { ok: false, message: current?.msg ?? '获取分类列表失败' };
      }
      if (current.data.some((category) => category.name === name)) {
        return { ok: false, message: '分类名称不能重复', warning: true };
      }
      return createCategory([...current.data, { name }])
        .then<CategorySaveResult>((result) => {
          if (result?.code !== 0) return { ok: false, message: result?.msg ?? '新建分类失败' };
          return { ok: true };
        })
        .catch((): CategorySaveResult => ({ ok: false, message: '新建分类失败' }));
    })
    .catch((): CategorySaveResult => {
      // 读取或保存失败时不发起不完整的全量更新。
      return { ok: false, message: '新建分类失败' };
    });
}
