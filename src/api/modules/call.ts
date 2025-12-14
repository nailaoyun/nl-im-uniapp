/**
 * 通话相关 API
 * 用于与媒体服务器交互
 */
import request from '../request'

// ICE 服务器配置
export interface ICEServerConfig {
  urls: string[]
  username?: string
  credential?: string
}

// 参与者信息
export interface ParticipantInfo {
  user_id: string
  platform: string
  has_audio: boolean
  has_video: boolean
}

// 拉流地址信息
export interface PullURLInfo {
  user_id: string
  url: string
  flv_url?: string
}

// 加入房间响应
export interface JoinCallRoomResponse {
  room_id: string
  platform: string
  ice_servers?: ICEServerConfig[]
  push_url?: string
  pull_urls?: PullURLInfo[]
  participants: ParticipantInfo[]
}

// 房间信息响应
export interface RoomInfoResponse {
  room_id: string
  call_type: string
  is_group_call: boolean
  participant_count: number
  participants: ParticipantInfo[]
}

/**
 * 创建通话房间
 */
export function createCallRoom(data: {
  room_id: string
  call_type: 'audio' | 'video'
  is_group_call?: boolean
}) {
  return request.post('/call/room', data)
}

/**
 * 获取通话房间信息
 */
export function getCallRoom(roomId: string): Promise<RoomInfoResponse> {
  return request.get(`/call/room/${roomId}`)
}

/**
 * 加入通话房间
 */
export function joinCallRoom(data: {
  room_id: string
  user_id: string
  platform: 'h5' | 'app' | 'miniprogram'
}): Promise<JoinCallRoomResponse> {
  return request.post('/call/join', data)
}

/**
 * 离开通话房间
 */
export function leaveCallRoom(data: {
  room_id: string
  user_id: string
}) {
  return request.post('/call/leave', data)
}

/**
 * 发送 WebRTC Offer
 */
export function sendOffer(data: {
  room_id: string
  user_id: string
  sdp: string
}): Promise<{ sdp: string }> {
  return request.post('/call/offer', data)
}

/**
 * 发送 ICE Candidate
 */
export function sendICECandidate(data: {
  room_id: string
  user_id: string
  candidate: string
}) {
  return request.post('/call/ice', data)
}

/**
 * 获取 ICE 服务器配置
 */
export function getICEServers(userId?: string): Promise<{ ice_servers: ICEServerConfig[] }> {
  return request.get('/call/ice-servers', { params: { user_id: userId } })
}

