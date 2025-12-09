/**
 * 消息相关类型定义
 */

export enum MessageType {
  TEXT = 0, // 文本
  IMAGE = 1, // 图片
  AUDIO = 2, // 语音
  VIDEO = 3, // 视频
  SYSTEM = 4, // 系统消息
  FRIEND_NOTIFY = 5, // 好友通知
  SIGNAL = 6, // WebRTC信令
  GROUP_NOTIFY = 7, // 群通知
  FILE = 8, // 文件
  MOMENTS_NOTIFY = 9 // 朋友圈通知（预留）
}

export enum CallStatus {
  INVITE = 'invite',
  ACCEPTED = 'accepted',
  OFFER = 'offer',
  ANSWER = 'answer',
  CANDIDATE = 'candidate',
  HANGUP = 'hangup',
  ENDED = 'ended',
  ANSWERED_ELSEWHERE = 'answered_elsewhere'
}

export interface MessageExtra {
  url?: string
  name?: string
  size?: number
  duration?: string
  title?: string
  description?: string
  image?: string
  type?: 'video' | 'audio'
  // 系统/通知消息相关字段
  event?: string // 事件类型，如 'member_join', 'member_leave' 等
  operator_id?: string // 操作者ID
  target_id?: string // 目标用户ID
  attachment_id?: number // 附件ID
}
