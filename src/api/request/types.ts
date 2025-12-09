/**
 * API 请求/响应类型定义
 */

// 统一响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  result: T
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}

// 请求配置
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
}
