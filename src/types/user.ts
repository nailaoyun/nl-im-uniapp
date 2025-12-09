/**
 * 用户相关类型定义
 */

export interface UserInfo {
  id: string
  email: string
  phone: string
  name: string
  avatar: string
  desc: string
  region: string
  created_at: string
  updated_at: string
}

export interface UserListItem extends UserInfo {
  color?: string // 前端生成的颜色
}
