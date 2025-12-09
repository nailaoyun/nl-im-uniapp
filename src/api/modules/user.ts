/**
 * 用户管理相关 API
 */
import request from '../request'
import type { User, PaginatedResponse } from '@/types/api'

// 获取当前用户信息
export function getMyInfo() {
  return request.get<User>('/user/my-info')
}

// 获取用户列表
export function getUserList(page = 1, pageSize = 20) {
  return request.get<PaginatedResponse<User>>('/user/list', {
    page,
    page_size: pageSize
  })
}

// 创建用户（管理员功能）
export function createUser(data: Partial<User>) {
  return request.post<User>('/user/create', data)
}

// 更新用户信息
export function updateUser(data: { id: string; updates: Partial<User> }) {
  return request.post<User>('/user/update', data)
}

// 删除用户（管理员功能）
export function deleteUser(id: string) {
  return request.post<void>('/user/delete', { id })
}
