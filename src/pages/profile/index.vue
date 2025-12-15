<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 头部大卡片 -->
      <view class="profile-header">
        <view class="header-top">
          <text class="page-title">我的</text>
          <view class="icon-btn" @click="uni.navigateTo({ url: '/pages/settings/index' })">
            <!-- #ifdef H5 -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="setting" size="44rpx" />
            <!-- #endif -->
          </view>
        </view>

        <view class="user-hero animate-fade-in-up" @click="goProfileEdit">
          <view class="avatar-wrap">
            <app-avatar :src="userInfo.avatar" :name="userInfo.nickname" :size="160" round custom-style="border: 6rpx solid var(--bg-surface);" />
          </view>
          <view class="hero-info">
            <text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
            <text class="account">账号: {{ userInfo.account || '--' }}</text>
          </view>
          <!-- #ifdef H5 -->
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="arrow-right" size="32rpx" custom-class="chevron-mp" />
          <!-- #endif -->
        </view>

        <!-- 数据概览 -->
        <view class="stats-row animate-fade-in-up" style="animation-delay: 100ms;">
          <view class="stat-item">
            <text class="num">12</text>
            <text class="label">动态</text>
          </view>
          <view class="stat-item">
            <text class="num">85</text>
            <text class="label">好友</text>
          </view>
          <view class="stat-item">
            <text class="num">3</text>
            <text class="label">收藏</text>
          </view>
        </view>
      </view>

      <!-- 菜单列表 -->
      <view class="menu-container">
        <view class="menu-group animate-fade-in-up" style="animation-delay: 150ms;">
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/moment/my' })">
            <view class="icon-box indigo">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="smile" size="44rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text class="menu-text">我的动态</text>
            <!-- #ifdef H5 -->
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="menu-arrow-mp" />
            <!-- #endif -->
          </view>
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/collection/index' })">
            <view class="icon-box amber">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="star" size="44rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text class="menu-text">我的收藏</text>
            <!-- #ifdef H5 -->
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="menu-arrow-mp" />
            <!-- #endif -->
          </view>
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/album/index' })">
            <view class="icon-box emerald">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="picture" size="44rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text class="menu-text">相册</text>
            <!-- #ifdef H5 -->
            <svg class="menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="menu-arrow-mp" />
            <!-- #endif -->
          </view>
        </view>
      </view>

      <app-tab-bar current="profile" />
      
      <!-- 全局通话组件 -->
      <global-call-provider />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import GlobalCallProvider from '@/components/call/GlobalCallProvider.vue'

const { isDark } = useTheme()
const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo || {})
function goProfileEdit() { uni.navigateTo({ url: '/pages/profile/edit' }) }
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.page-container {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border-color: rgba(0, 0, 0, 0.05);
  --color-brand: #4F46E5;

  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 200rpx;
}

// 深色模式 - Warm Stone
.page-container.dark {
  --bg-page: #1c1917;
  --bg-surface: #292524;
  --text-primary: #f5f5f4;
  --text-secondary: #e7e5e4;
  --text-tertiary: #78716c;
  --border-color: rgba(255, 255, 255, 0.1);
  --color-brand: #f97316;
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

// 头部
.profile-header {
  background: var(--bg-surface);
  padding: calc(var(--status-bar-height) + var(--mp-safe-top, 0px) + 24rpx) 40rpx 60rpx;
  border-bottom-left-radius: 80rpx;
  border-bottom-right-radius: 80rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.05);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48rpx;

  .page-title {
    font-size: 42rpx;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5rpx;
  }

  .icon-btn {
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
      opacity: 0.7;
    }

    &:active {
      background: var(--border-color);
    }
  }
}

.user-hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
  transition: all 0.15s;

  &:active {
    opacity: 0.8;
  }

  .avatar-wrap {
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
    border-radius: 50%;
  }

  .hero-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .nickname {
      font-size: 40rpx;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8rpx;
    }

    .account {
      font-size: 26rpx;
      color: var(--text-secondary);
    }
  }

  .chevron {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
  }
}

// 数据统计
.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 60rpx;
  padding-top: 40rpx;
  border-top: 1rpx solid var(--border-color);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .num {
      font-size: 40rpx;
      font-weight: 700;
      color: var(--text-primary);
    }

    .label {
      font-size: 24rpx;
      color: var(--text-secondary);
      margin-top: 8rpx;
    }
  }
}

// 菜单
.menu-container {
  padding: 40rpx;
}

.menu-group {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 8rpx 0;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  transition: background 0.15s;

  &:active {
    background: var(--border-color);
  }

  .icon-box {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    svg {
      width: 40rpx;
      height: 40rpx;
    }

    &.indigo {
      background: #4F46E5;
    }

    &.amber {
      background: #f59e0b;
    }

    &.emerald {
      background: #10b981;
    }
  }

  .menu-text {
    flex: 1;
    font-size: 30rpx;
    font-weight: 500;
    color: var(--text-primary);
  }

  .menu-arrow {
    width: 28rpx;
    height: 28rpx;
    color: var(--text-tertiary);
  }
}
</style>
