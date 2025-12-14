/**
 * 搜索相关 API
 */
import request from '../request'
import type { User } from '@/types/api'

// 联系人搜索结果
export interface ContactSearchResult {
  user: User
  remark_name: string
  room_id: string
}

// 群聊搜索结果
export interface GroupSearchResult {
  room_id: string
  room_name: string
  room_avatar: string
  owner_id: string
  member_count: number
}

// 消息搜索结果
export interface MessageSearchResult {
  id: number
  room_id: string
  room_name: string
  content: string
  message_type: number
  created_at: string
  sender: User
  is_group_chat: boolean
  match_content: string
}

// 聚合搜索结果
export interface GlobalSearchResult {
  contacts: ContactSearchResult[]
  groups: GroupSearchResult[]
  messages: MessageSearchResult[]
}

// 搜索类型
export type SearchType = 'all' | 'contacts' | 'groups' | 'messages'

/**
 * 聚合搜索
 * @param keyword 搜索关键词
 * @param type 搜索类型：all（默认）、contacts、groups、messages
 * @param limit 每类结果的最大数量，默认20
 */
export function globalSearch(keyword: string, type: SearchType = 'all', limit: number = 20) {
  return request.get<GlobalSearchResult>('/search', { keyword, type, limit })
}

/**
 * 搜索联系人
 * @param keyword 搜索关键词
 * @param limit 最大数量，默认20
 */
export function searchContacts(keyword: string, limit: number = 20) {
  return request.get<ContactSearchResult[]>('/search', { keyword, type: 'contacts', limit })
}

/**
 * 搜索群聊
 * @param keyword 搜索关键词
 * @param limit 最大数量，默认20
 */
export function searchGroups(keyword: string, limit: number = 20) {
  return request.get<GroupSearchResult[]>('/search', { keyword, type: 'groups', limit })
}

/**
 * 搜索聊天记录
 * @param keyword 搜索关键词
 * @param roomId 可选的房间ID，限定搜索范围
 * @param limit 最大数量，默认20
 */
export function searchMessages(keyword: string, roomId?: string, limit: number = 20) {
  return request.get<MessageSearchResult[]>('/search', { 
    keyword, 
    type: 'messages', 
    room_id: roomId,
    limit 
  })
}

