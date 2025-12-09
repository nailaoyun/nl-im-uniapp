/**
 * 朋友圈相关类型定义
 */

import type { User } from './api'

// 动态
export interface Moment {
  id: number
  user_id: string
  content: string
  media_type: 0 | 1 | 2 // 0=纯文字 1=图片 2=视频
  media_urls: string | string[] // 后端返回JSON字符串，前端解析后为数组
  location?: string
  visibility: 0 | 1 | 2 | 3 // 0=公开 1=仅好友 2=部分好友可见 3=部分好友不可见
  visible_user_ids?: string | string[]
  mention_user_ids?: string | string[]
  topic_tags?: string | string[]
  like_count: number
  comment_count: number
  is_deleted?: boolean
  created_at: string
  updated_at?: string
  // 关联字段
  user?: User
  is_liked: boolean
  likes?: MomentLike[]
  comments?: MomentComment[]
}

// 点赞
export interface MomentLike {
  id: number
  moment_id: number
  user_id: string
  created_at: string
  user?: User
}

// 评论
export interface MomentComment {
  id: number
  moment_id: number
  user_id: string
  reply_to_comment_id?: number | null
  reply_to_user_id?: string
  content: string
  created_at: string
  user?: User
  reply_to_user?: User
}

// 通知
export interface MomentNotification {
  id: number
  user_id: string
  from_user_id: string
  moment_id: number
  type: 1 | 2 | 3 | 4 // 1=点赞 2=评论 3=回复 4=@提及
  comment_id?: number | null
  is_read: boolean
  created_at: string
  // 关联字段
  from_user?: User
  moment?: Moment
  comment?: MomentComment
}

// 发布动态请求
export interface CreateMomentRequest {
  content: string
  media_type: 0 | 1 | 2
  media_urls?: string[]
  location?: string
  visibility: 0 | 1 | 2 | 3
  visible_user_ids?: string[]
  mention_user_ids?: string[]
  topic_tags?: string[]
}

// 发表评论请求
export interface CreateCommentRequest {
  content: string
  reply_to_comment_id?: number
}

// 标记已读请求
export interface MarkReadRequest {
  ids?: number[]
  all?: boolean
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}

// WebSocket 朋友圈通知推送数据
export interface MomentNotifPayload {
  type: 'like' | 'comment' | 'reply' | 'mention'
  moment_id: number
  from_user?: User
  content?: string
  comment_id?: number
}

// 动态可见性选项
export const VisibilityOptions = [
  { value: 0, label: '公开', icon: 'globe' },
  { value: 1, label: '仅好友可见', icon: 'users' },
  { value: 2, label: '部分好友可见', icon: 'user-check' },
  { value: 3, label: '部分好友不可见', icon: 'user-x' }
] as const

// 媒体类型
export const MediaTypes = {
  TEXT: 0,
  IMAGE: 1,
  VIDEO: 2
} as const

// 通知类型
export const NotificationTypes = {
  LIKE: 1,
  COMMENT: 2,
  REPLY: 3,
  MENTION: 4
} as const

// 通知类型文本映射
export const NotificationTypeText: Record<number, string> = {
  1: '赞了你的动态',
  2: '评论了你的动态',
  3: '回复了你的评论',
  4: '在动态中@了你'
}

/**
 * 解析媒体URL（后端返回JSON字符串）
 */
export function parseMediaUrls(urls: string | string[] | undefined): string[] {
  if (!urls) return []
  if (Array.isArray(urls)) return urls
  try {
    return JSON.parse(urls)
  } catch {
    return []
  }
}

/**
 * 解析话题标签
 */
export function parseTopicTags(tags: string | string[] | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}

/**
 * 解析@用户ID
 */
export function parseMentionUserIds(ids: string | string[] | undefined): string[] {
  if (!ids) return []
  if (Array.isArray(ids)) return ids
  try {
    return JSON.parse(ids)
  } catch {
    return []
  }
}
