/**
 * 朋友圈相关 API
 */
import request from '../request'
import type {
  Moment,
  MomentComment,
  MomentNotification,
  CreateMomentRequest,
  CreateCommentRequest,
  MarkReadRequest,
  PaginatedResponse
} from '@/types/moment'

// ==========================================
// 动态相关
// ==========================================

// 发布动态
export function createMoment(data: CreateMomentRequest) {
  return request.post<Moment>('/moments', data)
}

// 获取好友动态列表
export function getMoments(page = 1, pageSize = 20) {
  return request.get<PaginatedResponse<Moment>>('/moments', { page, page_size: pageSize })
}

// 获取动态详情
export function getMomentDetail(id: number) {
  return request.get<Moment>(`/moments/${id}`)
}

// 删除动态
export function deleteMoment(id: number) {
  return request.delete(`/moments/${id}`)
}

// 获取指定用户的动态列表
export function getUserMoments(userId: string, page = 1, pageSize = 20) {
  return request.get<PaginatedResponse<Moment>>(`/moments/user/${userId}`, { page, page_size: pageSize })
}

// ==========================================
// 点赞相关
// ==========================================

// 点赞动态
export function likeMoment(id: number) {
  return request.post(`/moments/${id}/like`)
}

// 取消点赞
export function unlikeMoment(id: number) {
  return request.delete(`/moments/${id}/like`)
}

// 获取动态的点赞列表
export function getMomentLikes(momentId: number) {
  return request.get<Array<{ id: number; user_id: string; created_at: string }>>(`/moments/${momentId}/likes`)
}

// ==========================================
// 评论相关
// ==========================================

// 获取动态的评论列表
export function getMomentComments(momentId: number) {
  return request.get<MomentComment[]>(`/moments/${momentId}/comments`)
}

// 发表评论
export function createComment(momentId: number, data: CreateCommentRequest) {
  return request.post<MomentComment>(`/moments/${momentId}/comments`, data)
}

// 删除评论
export function deleteComment(commentId: number) {
  return request.delete(`/moments/comments/${commentId}`)
}

// ==========================================
// 通知相关
// ==========================================

// 获取朋友圈通知列表
export function getNotifications(page = 1, pageSize = 20) {
  return request.get<PaginatedResponse<MomentNotification>>('/moments/notifications', { page, page_size: pageSize })
}

// 标记通知为已读
export function markNotificationsRead(data: MarkReadRequest) {
  return request.post('/moments/notifications/read', data)
}

// 获取未读通知数量
export function getUnreadCount() {
  return request.get<{ count: number }>('/moments/notifications/unread-count')
}
