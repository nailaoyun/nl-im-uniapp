<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="settings-page" :class="{ dark: isDark }">
      <!-- 导航栏 -->
      <view class="nav-bar">
        <view class="nav-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </view>
        <text class="nav-title">设置</text>
        <view class="nav-placeholder"></view>
      </view>

      <view class="content-body">
        <!-- 账号安全 -->
        <view class="settings-group animate-fade-in-up">
          <view class="group-title">账号</view>
          <view class="group-card">
            <view class="setting-item" @click="goTo('/pages/settings/account')">
              <view class="icon-box blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </view>
              <text class="item-text">账号管理</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
            <view class="setting-item" @click="goTo('/pages/settings/privacy')">
              <view class="icon-box purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </view>
              <text class="item-text">隐私设置</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
          </view>
        </view>

        <!-- 通用设置 -->
        <view class="settings-group animate-fade-in-up" style="animation-delay: 50ms;">
          <view class="group-title">通用</view>
          <view class="group-card">
            <view class="setting-item" @click="goTo('/pages/settings/notification')">
              <view class="icon-box red">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </view>
              <text class="item-text">新消息通知</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
            <view class="setting-item" @click="goTo('/pages/settings/theme')">
              <view class="icon-box indigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </view>
              <text class="item-text">主题设置</text>
              <text class="item-value">{{ themeText }}</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
            <view class="setting-item" @click="handleClearCache">
              <view class="icon-box green">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </view>
              <text class="item-text">清理缓存</text>
              <text class="item-value">{{ cacheSize }}</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
          </view>
        </view>

        <!-- 关于 -->
        <view class="settings-group animate-fade-in-up" style="animation-delay: 100ms;">
          <view class="group-title">关于</view>
          <view class="group-card">
            <view class="setting-item" @click="goTo('/pages/settings/feedback')">
              <view class="icon-box orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </view>
              <text class="item-text">帮助与反馈</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
            <view class="setting-item" @click="goTo('/pages/settings/about')">
              <view class="icon-box gray">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </view>
              <text class="item-text">关于我们</text>
              <text class="item-value">v1.0.0</text>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
          </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-btn animate-fade-in-up" style="animation-delay: 150ms;" @click="handleLogout">
          <text>退出登录</text>
        </view>
      </view>

      <wd-toast />
      <wd-message-box />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import { useToast, useMessage } from 'wot-design-uni'

const { isDark } = useTheme()
const authStore = useAuthStore()
const toast = useToast()
const message = useMessage()
const cacheSize = ref('12.5MB')

const themeText = computed(() => {
  const mode = uni.getStorageSync('nl_im_theme_mode') || 'system'
  const texts: Record<string, string> = { system: '跟随系统', light: '浅色', dark: '深色' }
  return texts[mode] || '跟随系统'
})

function goBack() { uni.navigateBack() }
function goTo(url: string) { uni.navigateTo({ url }) }

function handleLogout() {
  message.confirm({
    title: '提示',
    msg: '确定要退出登录吗？',
    success: async () => {
      try {
        await authStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      } catch (error) {
        toast.error('退出失败')
      }
    }
  })
}

function handleClearCache() {
  toast.loading('清理中...')
  setTimeout(() => {
    cacheSize.value = '0KB'
    toast.success('清理完成')
  }, 1000)
}
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式 (与设计稿完全一致)
.settings-page {
  --bg-page: #F5F7FA;                   // 设计稿: bg-[#F5F7FA]
  --bg-surface: #ffffff;                 // 卡片背景
  --text-primary: #1f2937;               // gray-800 (列表项文字)
  --text-secondary: #9ca3af;             // gray-400 (分组标题)
  --text-tertiary: #9ca3af;              // gray-400 (值/箭头)
  --border-color: #f9fafb;               // gray-50

  min-height: 100vh;
  background: var(--bg-page);
}

// 深色模式 - Warm Stone (与设计稿完全一致)
.settings-page.dark {
  --bg-page: #121212;                    // 设计稿: bg-[#121212]
  --bg-surface: #1c1917;                 // warm-900 (卡片背景)
  --text-primary: #e7e5e4;               // warm-200 (列表项文字)
  --text-secondary: #78716c;             // warm-500 (分组标题)
  --text-tertiary: #9ca3af;              // gray-400 (值/箭头)
  --border-color: rgba(41, 37, 36, 0.5); // warm-800/50
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

// 导航栏
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 16rpx;
  background: var(--bg-page);

  .nav-back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.15s;

    svg {
      width: 40rpx;
      height: 40rpx;
      color: var(--text-primary);
    }

    &:active {
      background: var(--border-color);
    }
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .nav-placeholder {
    width: 72rpx;
  }
}

// 内容
.content-body {
  padding: 20rpx 32rpx;
}

// 设置组
.settings-group {
  margin-bottom: 40rpx;

  .group-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 16rpx;
    margin-left: 12rpx;
  }
}

.group-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--border-color);
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f9fafb; // gray-50
    
    .dark & {
      background: #292524; // warm-800
    }
  }

  .icon-box {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    svg {
      width: 32rpx;
      height: 32rpx;
    }

    &.blue { background: #0ea5e9; }
    &.purple { background: #8b5cf6; }
    &.red { background: #ef4444; }
    &.indigo { background: #4F46E5; }
    &.green { background: #10b981; }
    &.orange { background: #f97316; }
    &.gray { background: #6b7280; }
  }

  .item-text {
    flex: 1;
    font-size: 30rpx;
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-value {
    font-size: 26rpx;
    color: var(--text-tertiary);
    margin-right: 12rpx;
  }

  .chevron {
    width: 28rpx;
    height: 28rpx;
    color: var(--text-tertiary);
  }
}

// 退出按钮
.logout-btn {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  margin-top: 40rpx;
  transition: all 0.15s;

  text {
    color: #ef4444;
    font-size: 32rpx;
    font-weight: 600;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.99);
  }
}
</style>
