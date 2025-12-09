/**
 * 图片 URL 处理工具函数
 */

// 图片资源基础域名
const IMAGE_BASE_URL = 'http://127.0.0.1:12080'

/**
 * 解析图片 URL，为相对路径添加域名前缀
 * @param url 图片路径（可能是相对路径或完整 URL）
 * @returns 完整的图片 URL
 */
export function resolveImageUrl(url?: string): string {
  if (!url) return ''

  // 已经是完整 URL（http/https/data URI）
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  // 仅处理 /upload/ 开头的路径
  if (url.startsWith('/uploads/')) {
    return IMAGE_BASE_URL + url
  }

  // 其他情况直接返回
  return url
}

/**
 * 获取图片基础 URL
 */
export function getImageBaseUrl(): string {
  return IMAGE_BASE_URL
}

