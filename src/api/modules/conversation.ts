/**
 * 会话列表相关 API
 */
import request from '../request'
import type { Conversation } from '@/types/conversation'

// 获取会话列表
export function getConversationList() {
  return request.get<Conversation[]>('/conversations')
}

// 重置未读
export function resetUnread(targetId: string) {
  return request.post<void>('/conversations/reset-unread', {
    target_id: targetId
  })
}

// 更新会话标记
export function updateConversation(data: {
  target_id: string
  is_top?: boolean
  is_muted?: boolean
  is_special_care?: boolean
}) {
  return request.post<void>('/conversations/update', data)
}

// 删除会话
export function deleteConversation(targetId: string) {
  return request.post<void>('/conversations/delete', {
    target_id: targetId
  })
}

// 根据 room_id 获取或创建会话
export function getConversationByRoom(roomId: string) {
  return request.get<Conversation>(`/conversations/by-room/${roomId}`)
}
