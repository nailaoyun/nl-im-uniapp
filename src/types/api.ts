/**
 * API 请求和响应的类型定义
 */

// 登录请求
export interface LoginRequest {
  account: string // 邮箱或手机号
  password: string
  remember?: boolean
}

// 登录响应
export interface LoginResponse {
  token: string
  user: User
}

// 注册请求
export interface RegisterRequest {
  email: string
  phone: string
  password: string
  confirm_password: string
  code: string
  agree_terms: boolean
}

// 发送验证码请求
export interface SendCodeRequest {
  target: string // 邮箱或手机号
  type: 'email' | 'sms'
}

// 用户信息
export interface User {
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

// 联系人信息
export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  room_id?: string // 房间ID（雪花ID）
  room_type?: 'p2p' | 'group' // 房间类型
  is_group?: boolean // 是否为群聊
  member_count?: number // 群成员数量（群聊时使用）
  owner_id?: string // 群主ID（群聊时使用）
  remark_name?: string
  group_id?: number
  is_top: boolean
  is_muted: boolean
  is_special_care?: boolean
  is_blocked?: boolean
  user?: User // 关联的用户信息（单聊时使用）
  last_msg?: string
  last_time?: number
  unread?: number
  color?: string
}

// 好友申请
export interface FriendRequest {
  id: number
  from_user_id: string
  to_user_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from_user?: User
  to_user?: User
}

// 分组
export interface ContactGroup {
  id: number
  user_id: string
  group_name: string
  sort_order: number
  created_at: string
}

// 房间
export interface Room {
  id: string
  room_id?: string // 房间ID（雪花ID，用于群聊）
  room_type: 'p2p' | 'group'
  name?: string
  avatar?: string
  members: string[]
  owner_id?: string // 群主ID
  member_count?: number // 成员数量
  created_at: string
}

// 聊天消息
export interface ChatMessage {
  id: number
  room_id: string
  sender_user_id: string
  receiver_user_id?: string
  message_type: number // 0:文本 1:图片 2:语音 3:视频 4:系统 5:好友通知 6:信令 7:群通知 8:文件 9:朋友圈通知
  content: string
  duration: number
  extra?: string | Record<string, any>
  created_at: string
  isSelf?: boolean // 前端标记
}

// 发送消息请求
export interface SendMessageRequest {
  sender_client_id?: string
  receiver_user_id?: string
  room_id: string
  message_type: number
  content: string
  duration?: number
  extra?: string
  call_id?: string
  call_status?: string
}

// 附件
export interface Attachment {
  id: number
  uploader_id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  file_url: string
  mime_type: string
  width?: number
  height?: number
  duration?: number
  created_at: string
}

// ICE服务器配置
export interface ICEServerConfig {
  urls: string[]
  username?: string
  credential?: string
}

// 群成员信息
export interface GroupMember {
  user_id: string
  room_id: string
  role: number // 0:成员 1:管理员 2:群主
  nickname?: string // 群名片
  joined_at?: string
  muted_until?: string // 禁言到期时间
  user?: User // 关联的用户信息
}

// 群信息（扩展Room）
export interface GroupInfo extends Room {
  room_id: string // 群ID（group_xxx格式）
  room_type: 'group'
  name: string // 群名称
  avatar?: string
  owner_id: string // 群主ID
  member_count: number // 成员数量
  members?: GroupMember[] // 成员列表
  created_at: string
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}
