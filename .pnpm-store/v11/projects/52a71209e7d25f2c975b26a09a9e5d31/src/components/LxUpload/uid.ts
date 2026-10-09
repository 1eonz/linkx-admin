let uploadInstanceSequence = 0

/** 为每个上传组件实例生成唯一的回退 UID 前缀。 */
export function createUploadInstanceUidPrefix(): string {
  uploadInstanceSequence += 1
  return `__lx_upload_${uploadInstanceSequence}_`
}
