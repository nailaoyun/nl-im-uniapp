/**
 * 消息管理相关 API
 */
import request from '../request'
import type { ChatMessage, SendMessageRequest, PaginatedResponse } from '@/types/api'

// 发送消息
export function sendMessage(data: SendMessageRequest) {
  return request.post<void>('/send', data)
}

// 获取历史消息
export function getMessages(roomId: string, page = 1, pageSize = 50) {
  return request.get<PaginatedResponse<ChatMessage>>('/messages', {
    room_id: roomId,
    page,
    page_size: pageSize
  })
}

// 同步消息（兼容接口）
export function syncMessages(roomId: string, page = 1, pageSize = 50) {
  return request.get<PaginatedResponse<ChatMessage>>('/messages/sync', {
    room_id: roomId,
    page,
    page_size: pageSize
  })
}
