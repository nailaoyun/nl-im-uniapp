/**
 * 认证状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '@/api/modules/auth'
import * as userApi from '@/api/modules/user'
import { storage } from '@/utils/storage'
import type { User, LoginRequest } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(storage.getToken())
  const user = ref<User | null>(storage.getUserInfo())
  const isAuthenticated = ref(!!token.value)

  /**
   * 登录
   */
  async function login(data: LoginRequest) {
    try {
      const response = await authApi.login(data)
      token.value = response.token
      user.value = response.user
      isAuthenticated.value = true

      // 存储到本地
      storage.setToken(response.token)
      storage.setUserId(response.user.id)
      storage.setUserInfo(response.user)
      if (data.remember) {
        storage.setRemember(true)
      }

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * 注册
   */
  async function register(data: any) {
    try {
      await authApi.register(data)
    } catch (error) {
      console.error('Register failed:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  function logout() {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    storage.clear()

    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })
  }

  /**
   * 检查Token并获取用户信息
   */
  async function checkAuth() {
    if (!token.value) {
      return false
    }

    try {
      await authApi.checkToken()
      // Token有效，获取最新用户信息
      const userInfo = await userApi.getMyInfo()
      user.value = userInfo
      storage.setUserInfo(userInfo)
      return true
    } catch {
      // Token无效，清除
      logout()
      return false
    }
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(userInfo: User) {
    user.value = userInfo
    storage.setUserInfo(userInfo)
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    updateUserInfo
  }
})
