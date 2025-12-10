<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 头部大卡片 -->
      <view class="profile-header">
        <view class="header-top">
          <text class="page-title">我的</text>
          <view class="icon-btn" @click="uni.navigateTo({ url: '/pages/settings/index' })">
            <wd-icon name="setting" size="44rpx" color="var(--text-primary)" />
          </view>
        </view>

        <view class="user-hero" @click="goProfileEdit">
          <app-avatar :src="userInfo.avatar" :name="userInfo.nickname" :size="160" radius="50%" custom-style="border: 6rpx solid var(--bg-surface);" />
          <view class="hero-info">
            <text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
            <text class="account">账号: {{ userInfo.account || '--' }}</text>
          </view>
          <wd-icon name="arrow-right" color="#999" />
        </view>

        <!-- 数据概览 -->
        <view class="stats-row">
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
        <view class="menu-group">
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/moment/my' })">
            <view class="icon-box blue"><wd-icon name="moments" size="40rpx" color="#fff" /></view>
            <text class="menu-text">我的动态</text>
            <wd-icon name="arrow-right" color="var(--text-tertiary)" size="28rpx" />
          </view>
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/collection/index' })">
            <view class="icon-box yellow"><wd-icon name="star" size="40rpx" color="#fff" /></view>
            <text class="menu-text">我的收藏</text>
            <wd-icon name="arrow-right" color="var(--text-tertiary)" size="28rpx" />
          </view>
          <view class="menu-item" @click="uni.navigateTo({ url: '/pages/album/index' })">
            <view class="icon-box green"><wd-icon name="picture" size="40rpx" color="#fff" /></view>
            <text class="menu-text">相册</text>
            <wd-icon name="arrow-right" color="var(--text-tertiary)" size="28rpx" />
          </view>
        </view>
      </view>

      <app-tab-bar active="/pages/profile/index" />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import AppTabBar from '@/components/common/AppTabBar.vue'

const { isDark } = useTheme()
const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo || {})
function goProfileEdit() { uni.navigateTo({ url: '/pages/profile/edit' }) }
</script>

<style lang="scss" scoped>
.page-container {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #9ca3af;

  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 200rpx;
}
.page-container.dark {
  --bg-page: #1c1c1e; /* Dark Grey */
  --bg-surface: #2c2c2e;
  --text-primary: #f2f2f7;
}

.profile-header {
  background: var(--bg-surface);
  padding: calc(var(--status-bar-height) + 20rpx) 40rpx 60rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.03);
}

.header-top {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 60rpx;
  .page-title { font-size: 48rpx; font-weight: 800; color: var(--text-primary); }
  .icon-btn { opacity: 0.7; }
}

.user-hero {
  display: flex; align-items: center; gap: 30rpx;
  .hero-info {
    flex: 1; display: flex; flex-direction: column;
    .nickname { font-size: 40rpx; font-weight: 700; color: var(--text-primary); margin-bottom: 8rpx; }
    .account { font-size: 26rpx; color: var(--text-secondary); }
  }
}

.stats-row {
  display: flex; justify-content: space-around; margin-top: 60rpx;
  .stat-item {
    display: flex; flex-direction: column; align-items: center;
    .num { font-size: 36rpx; font-weight: 700; color: var(--text-primary); }
    .label { font-size: 24rpx; color: var(--text-secondary); margin-top: 4rpx; }
  }
}

.menu-container { padding: 40rpx; }
.menu-group { background: var(--bg-surface); border-radius: 24rpx; padding: 10rpx 30rpx; }
.menu-item {
  display: flex; align-items: center; padding: 30rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05);
  &:last-child { border-bottom: none; }
  .icon-box {
    width: 70rpx; height: 70rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-right: 24rpx;
    &.blue { background: #4f46e5; } &.yellow { background: #f59e0b; } &.green { background: #10b981; }
  }
  .menu-text { flex: 1; font-size: 30rpx; font-weight: 500; color: var(--text-primary); }
}
</style>
