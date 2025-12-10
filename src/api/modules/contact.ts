/**
 * 联系人管理相关 API
 */
import request from '../request'
import type { Contact, User, FriendRequest, ContactGroup } from '@/types/api'

// 获取联系人列表
export function getContacts() {
  return request.get<Contact[]>('/contacts')
}

// 搜索用户
export function searchUsers(keyword: string, limit = 20) {
  return request.get<User[]>('/contacts/search', { keyword, limit })
}

// 添加好友.html（发送申请）
export function addFriend(data: { to_user_id: string; message?: string }) {
  return request.post<void>('/contacts/add-friend', data)
}

// 获取好友申请列表
export function getFriendRequests() {
  return request.get<FriendRequest[]>('/contacts/friend-requests')
}

// 接受好友申请
export function acceptFriendRequest(requestId: number) {
  return request.post<void>('/contacts/accept-request', { request_id: requestId })
}

// 拒绝好友申请
export function rejectFriendRequest(requestId: number) {
  return request.post<void>('/contacts/reject-request', { request_id: requestId })
}

// 获取分组列表
export function getGroups() {
  return request.get<ContactGroup[]>('/contacts/groups')
}

// 创建分组
export function createGroup(data: { group_name: string }) {
  return request.post<ContactGroup>('/contacts/groups', data)
}

// 更新分组
export function updateGroup(id: number, data: { group_name?: string; sort_order?: number }) {
  return request.post<ContactGroup>(`/contacts/groups/update/${id}`, data)
}

// 删除分组
export function deleteGroup(id: number) {
  return request.post<void>(`/contacts/groups/delete/${id}`)
}

// 获取好友详情
export async function getContactDetail(id: string): Promise<Contact> {
  const response = await request.get<{ contact: any; user: User }>(`/contacts/${id}`)
  return {
    ...response.contact,
    id: response.contact.id?.toString() || response.contact.contact_id,
    user_id: response.contact.contact_id || response.contact.user_id,
    contact_user_id: response.contact.contact_id,
    room_id: response.contact.room_id,
    user: response.user
  } as Contact
}

// 更新好友信息
export function updateContact(id: string, data: {
  remark_name?: string
  group_id?: number
  is_top?: boolean
  is_muted?: boolean
  is_special_care?: boolean
  is_blocked?: boolean
}) {
  return request.post<Contact>(`/contacts/update/${id}`, data)
}

// 删除好友
export function deleteContact(id: string) {
  return request.post<void>(`/contacts/delete/${id}`)
}
