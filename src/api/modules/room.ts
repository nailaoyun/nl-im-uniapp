/**
 * 房间/群聊管理相关 API
 */
import request from '../request'
import type { Room, GroupInfo, GroupMember } from '@/types/api'

// 创建房间（单聊）
export function createRoom(data: {
  room_type: 'p2p' | 'group'
  members: string[]
  name?: string
  avatar?: string
}) {
  return request.post<Room>('/rooms', data)
}

// 获取房间信息
export function getRoom(id: string) {
  return request.get<Room>(`/rooms/${id}`)
}

/**
 * 群聊相关 API
 */

// 创建群聊
export function createGroup(data: {
  name: string
  avatar?: string
  member_ids: string[]
  admin_ids?: string[]
}) {
  return request.post<GroupInfo>('/groups', data)
}

// 获取用户群聊列表（带分组信息）
export function getUserGroups() {
  return request.get<Array<{
    room_id: string
    room_type: string
    room_name: string
    room_avatar: string
    owner_id: string
    creator_id: string
    category: 'joined' | 'created' | 'managed'
    role: number
    last_message_time?: string
    last_message?: string
    created_at: string
    updated_at: string
  }>>('/groups')
}

// 获取群信息
export function getGroup(roomId: string) {
  return request.get<GroupInfo>(`/groups/${roomId}`)
}

// 获取群成员列表
export function getGroupMembers(roomId: string, keyword?: string) {
  return request.get<GroupMember[]>(`/groups/${roomId}/members`, keyword ? { keyword } : undefined)
}

// 邀请成员入群
export function inviteGroupMembers(roomId: string, data: { member_ids: string[] }) {
  return request.post<void>(`/groups/${roomId}/members`, data)
}

// 移除群成员
export function removeGroupMember(roomId: string, userId: string) {
  return request.post<void>(`/groups/${roomId}/members/${userId}/remove`, {})
}

// 修改群信息
export function updateGroup(roomId: string, data: { name?: string; avatar?: string }) {
  return request.post<void>(`/groups/${roomId}/update`, data)
}

// 调整成员角色
export function updateMemberRole(roomId: string, userId: string, data: { role: number }) {
  return request.post<void>(`/groups/${roomId}/members/${userId}/role`, data)
}

// 退出群聊
export function quitGroup(roomId: string) {
  return request.post<void>(`/groups/${roomId}/quit`, {})
}

// 解散群聊
export function dissolveGroup(roomId: string) {
  return request.post<void>(`/groups/${roomId}/dissolve`, {})
}

// 获取群公告
export function getGroupAnnouncement(roomId: string) {
  return request.get<{ announcement: string }>(`/groups/${roomId}/announcement`)
}

// 更新群公告
export function updateGroupAnnouncement(roomId: string, announcement: string) {
  return request.post<void>(`/groups/${roomId}/announcement`, { announcement })
}

// 获取群通知列表
export function getGroupNotifications(params?: {
  page?: number
  page_size?: number
  is_read?: boolean
}) {
  return request.get<{
    data: Array<{
      id: number
      room_id: string
      message_type: number
      content: string
      extra: string | object
      is_read?: boolean
      created_at: string
    }>
    total: number
    page: number
    page_size: number
  }>('/group-notifications', params)
}

// 禁言成员
export function muteGroupMember(roomId: string, userId: string, duration: number) {
  return request.post<void>(`/groups/${roomId}/members/${userId}/mute`, { duration })
}

// 更新群设置
export function updateGroupSettings(roomId: string, data: {
  name?: string
  avatar?: string
  description?: string
  invite_permission?: number
}) {
  return request.post<void>(`/groups/${roomId}/settings`, data)
}

// 获取群设置
export function getGroupSettings(roomId: string) {
  return request.get<{
    name: string
    avatar: string
    description: string
    invite_permission: number
    created_at: string
    updated_at: string
  }>(`/groups/${roomId}/settings`)
}

// 更新我在群里的昵称
export function updateMyNickname(roomId: string, nickname: string) {
  return request.post<void>(`/groups/${roomId}/nickname`, { nickname })
}