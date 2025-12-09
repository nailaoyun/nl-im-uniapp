/**
 * 聊天会话类型定义
 */

import type { User, Room } from './api'

export interface Conversation {
  id: number // 数据库主键ID
  user_id: string // 所属用户ID
  target_id: string // 目标ID (好友ID 或 群ID)
  type: number // 1:私聊 2:群聊
  room_type?: 'p2p' | 'group' // 房间类型（前端映射）
  room_id?: string // 房间ID（群聊时为 group_xxx，单聊时可为拼接ID）
  is_group?: boolean // 是否为群聊（前端辅助字段）
  member_count?: number // 群成员数量（群聊时使用）
  owner_id?: string // 群主ID（群聊时使用）
  name?: string // 前端辅助字段：显示名称
  avatar?: string // 前端辅助字段：头像
  unread_count: number // 未读数
  is_top: boolean // 是否置顶
  is_muted: boolean // 是否免打扰
  is_special_care?: boolean // 是否特别关心
  last_message: string // 最后一条消息
  last_time: number // 最后消息时间戳 (毫秒)

  // 关联数据
  target_user?: User // 单聊时的目标用户
  target_group?: Room // 群聊时的群信息（可选）
}
