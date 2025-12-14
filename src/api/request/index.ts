/**
 * UniApp 请求封装
 */
import type { ApiResponse, RequestConfig } from './types'
import { storage } from '@/utils/storage'

// API 基础路径
// const BASE_URL = 'http://127.0.0.1:12080/api'
const BASE_URL = 'https://g-ws.nailaoyun.cn/api'

// 默认超时时间
const TIMEOUT = 30000

/**
 * 获取存储的 Token
 */
function getToken(): string | null {
  return storage.getToken()
}

/**
 * 获取存储的 User ID
 */
function getUserId(): string | null {
  return storage.getUserId()
}

/**
 * 显示加载提示
 */
function showLoading() {
  uni.showLoading({
    title: '加载中...',
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示错误提示
 */
function showError(message: string) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000
  })
}

/**
 * 请求函数
 */
function request<T = any>(config: RequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data,
      params,
      header = {},
      timeout = TIMEOUT,
      showLoading: needLoading = false,
      showError: needShowError = true
    } = config

    // 构建完整 URL
    let fullUrl = BASE_URL + url

    // 处理 GET 请求参数
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    // 设置请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header
    }

    // 添加 Token
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 添加 User ID
    const userId = getUserId()
    if (userId) {
      headers['X-User-ID'] = userId
    }

    // 显示加载
    if (needLoading) {
      showLoading()
    }

    // 发起请求
    uni.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      timeout,
      success: (res) => {
        if (needLoading) {
          hideLoading()
        }

        const response = res.data as ApiResponse<T>

        // 检查 HTTP 状态码
        if (res.statusCode !== 200) {
          const errorMsg = `请求失败: ${res.statusCode}`
          if (needShowError) {
            showError(errorMsg)
          }
          reject(new Error(errorMsg))
          return
        }

        // 检查业务状态码
        if (response.code !== 0) {
          const errorMsg = response.message || '请求失败'
          if (needShowError) {
            showError(errorMsg)
          }
          reject(new Error(errorMsg))
          return
        }

        // 返回结果数据
        resolve(response.result)
      },
      fail: (err) => {
        if (needLoading) {
          hideLoading()
        }

        const errorMsg = err.errMsg || '网络请求失败'
        if (needShowError) {
          showError(errorMsg)
        }
        reject(new Error(errorMsg))
      }
    })
  })
}

/**
 * GET 请求
 */
function get<T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    params,
    ...config
  })
}

/**
 * POST 请求
 */
function post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...config
  })
}

/**
 * PUT 请求
 */
function put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...config
  })
}

/**
 * DELETE 请求
 */
function del<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...config
  })
}

/**
 * 上传文件
 */
function upload<T = any>(url: string, filePath: string, name = 'file', formData?: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {}

    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const userId = getUserId()
    if (userId) {
      headers['X-User-ID'] = userId
    }

    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: headers,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`上传失败: ${res.statusCode}`))
          return
        }

        try {
          const response = JSON.parse(res.data) as ApiResponse<T>
          if (response.code !== 0) {
            reject(new Error(response.message || '上传失败'))
            return
          }
          resolve(response.result)
        } catch {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
  upload
}

export { get, post, put, del as delete, upload, request }
