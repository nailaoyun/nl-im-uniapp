/**
 * 附件管理相关 API
 */
import request from '../request'
import type { Attachment, PaginatedResponse } from '@/types/api'

// 上传附件
export function uploadAttachment(filePath: string, type?: 'image' | 'video' | 'file' | 'audio') {
  return request.upload<Attachment>('/attachments/upload', filePath, 'file', type ? { type } : undefined)
}

// 获取附件信息
export function getAttachment(id: number) {
  return request.get<Attachment>(`/attachments/${id}`)
}

// 获取附件列表
export function getAttachments(type?: string, page = 1, pageSize = 20) {
  return request.get<PaginatedResponse<Attachment>>('/attachments', { type, page, page_size: pageSize })
}

// 删除附件
export function deleteAttachment(id: number) {
  return request.post<void>(`/attachments/delete/${id}`)
}
