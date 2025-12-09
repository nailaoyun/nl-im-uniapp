<template>
  <view class="settings-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="设置" />
    
    <wd-cell-group title="账号设置">
      <wd-cell title="个人资料" icon="user" is-link @click="goProfile" />
      <wd-cell title="账号与安全" icon="shield" is-link @click="goSecurity" />
    </wd-cell-group>

    <wd-cell-group title="通用设置">
      <wd-cell title="消息通知" icon="bell" is-link @click="goNotification" />
      <wd-cell title="隐私设置" icon="eye-close" is-link @click="goPrivacy" />
      <wd-cell title="深色模式" icon="picture" :value="themeText" is-link @click="goTheme" />
      <wd-cell title="清除缓存" icon="delete" :value="cacheSize" is-link @click="clearCache" />
    </wd-cell-group>

    <wd-cell-group title="关于">
      <wd-cell title="当前版本" value="v1.0.0" />
      <wd-cell title="用户协议" is-link @click="goAgreement" />
      <wd-cell title="隐私政策" is-link @click="goPrivacyPolicy" />
      <wd-cell title="检查更新" is-link @click="checkUpdate" />
    </wd-cell-group>

    <view class="logout-section">
      <wd-button type="error" block plain @click="logout">退出登录</wd-button>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { useToast, useMessage } from 'wot-design-uni'

const authStore = useAuthStore()
const { isDark } = useTheme()
const toast = useToast()
const messageBox = useMessage()

const cacheSize = ref('0 KB')

// 主题显示文本
const themeText = computed(() => {
  const mode = uni.getStorageSync('nl_im_theme_mode') || 'system'
  const texts: Record<string, string> = {
    system: '跟随系统',
    light: '浅色模式',
    dark: '深色模式'
  }
  return texts[mode] || '跟随系统'
})

onMounted(() => {
  calculateCacheSize()
})

function calculateCacheSize() {
  try {
    const info = uni.getStorageInfoSync()
    const size = info.currentSize || 0
    if (size < 1024) {
      cacheSize.value = `${size} KB`
    } else {
      cacheSize.value = `${(size / 1024).toFixed(2)} MB`
    }
  } catch {
    cacheSize.value = '0 KB'
  }
}

function goProfile() {
  uni.navigateTo({ url: '/pages/profile/index' })
}

function goSecurity() {
  toast.show('账号安全功能开发中')
}

function goNotification() {
  toast.show('消息通知设置开发中')
}

function goPrivacy() {
  toast.show('隐私设置功能开发中')
}

function goTheme() {
  uni.navigateTo({ url: '/pages/settings/theme' })
}

async function clearCache() {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要清除缓存吗？'
    })
    
    // 保留登录信息
    const token = uni.getStorageSync('nl_im_token')
    const userId = uni.getStorageSync('nl_im_user_id')
    const userInfo = uni.getStorageSync('nl_im_user_info')
    const theme = uni.getStorageSync('nl_im_theme')

    uni.clearStorageSync()

    // 恢复登录信息
    if (token) uni.setStorageSync('nl_im_token', token)
    if (userId) uni.setStorageSync('nl_im_user_id', userId)
    if (userInfo) uni.setStorageSync('nl_im_user_info', userInfo)
    if (theme) uni.setStorageSync('nl_im_theme', theme)

    cacheSize.value = '0 KB'
    toast.success('清除成功')
  } catch {
    // 取消
  }
}

function goAgreement() {
  toast.show('用户协议页面开发中')
}

function goPrivacyPolicy() {
  toast.show('隐私政策页面开发中')
}

function checkUpdate() {
  toast.show('当前已是最新版本')
}

async function logout() {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要退出登录吗？'
    })
    authStore.logout()
  } catch {
    // 取消
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.logout-section {
  padding: 60rpx 30rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}
</style>
