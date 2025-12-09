/**
 * 认证相关 API
 */
import request from '../request'
import type { LoginRequest, LoginResponse, RegisterRequest, SendCodeRequest } from '@/types/api'

// 用户登录
export function login(data: LoginRequest) {
  return request.post<LoginResponse>('/login', data)
}

// 用户注册
export function register(data: RegisterRequest) {
  return request.post<void>('/register', data)
}

// 发送邮箱验证码
export function sendEmailCode(data: SendCodeRequest) {
  return request.post<void>('/send-email-code', data)
}

// 发送短信验证码
export function sendSmsCode(data: SendCodeRequest) {
  return request.post<void>('/send-sms-code', data)
}

// 检查Token有效性
export function checkToken() {
  return request.get<void>('/check-token')
}
