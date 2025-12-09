/**
 * 系统接口相关 API
 */
import request from '../request'
import type { ICEServerConfig } from '@/types/api'

// 健康检查
export function healthCheck() {
  return request.get<{ status: string; node: string; time: string }>('/health')
}

// 获取ICE服务器配置
export function getIceServers(userId: string) {
  return request.get<ICEServerConfig[]>('/ice-servers', { user_id: userId })
}

// 检查用户在线状态
export function checkUserOnline(userId: string) {
  return request.get<{ is_online: boolean }>('/check-user-online', { user_id: userId })
}

// 绑定ClientID和UserID
export function bindClient(data: { user_id: string; client_id: string }) {
  return request.post<void>('/bind', data)
}
