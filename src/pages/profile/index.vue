<template>
  <view class="profile-page" :class="{ dark: isDark }">
    <!-- 顶部导航栏 (透明背景或自定义颜色) -->
    <app-nav-bar title="" :left-arrow="false" :bordered="false" />

    <!-- 用户信息卡片 -->
    <view class="user-card" @click="goProfileEdit">
      <view class="avatar-wrapper">
        <wd-img
            :src="userInfo.avatar"
            width="120rpx"
            height="120rpx"
            round
            mode="aspectFill"
        />
      </view>
      <view class="info-wrapper">
        <view class="name-row">
          <text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
          <wd-icon name="edit" size="16px" color="var(--text-secondary)" custom-class="edit-icon" />
        </view>
        <text class="account">账号: {{ userInfo.account || '--' }}</text>
      </view>
      <view class="arrow">
        <wd-icon name="arrow-right" color="var(--text-tertiary)" />
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <wd-cell-group border>
        <wd-cell title="我的动态" is-link to="/pages/moment/my" icon="moments" size="large" />
        <wd-cell title="收藏夹" is-link to="/pages/collection/index" icon="star" size="large" />
        <wd-cell title="相册" is-link to="/pages/album/index" icon="picture" size="large" />
      </wd-cell-group>

      <view class="gap" />

      <wd-cell-group border>
        <wd-cell title="设置" is-link to="/pages/settings/index" icon="setting" size="large" />
      </wd-cell-group>
    </view>

    <!-- 底部 TabBar -->
    <app-tab-bar active="/pages/profile/index" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import AppNavBar from '@/components/common/AppNavBar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'

const { isDark } = useTheme()
const authStore = useAuthStore()

const userInfo = computed(() => authStore.userInfo || {})

function goProfileEdit() {
  uni.navigateTo({ url: '/pages/profile/edit' })
}
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--bg-page);
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

.user-card {
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  background-color: var(--bg-content);
  margin-bottom: 24rpx;
  transition: background-color 0.2s;

  &:active {
    background-color: var(--bg-active);
  }

  .avatar-wrapper {
    margin-right: 32rpx;
    border: 2rpx solid var(--border-color);
    border-radius: 50%;
    padding: 2rpx; // 模拟头像边框
  }

  .info-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .name-row {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .nickname {
        font-size: 40rpx;
        font-weight: 600;
        color: var(--text-primary);
        margin-right: 12rpx;
      }

      .edit-icon {
        opacity: 0.6;
      }
    }

    .account {
      font-size: 28rpx;
      color: var(--text-secondary);
    }
  }
}

.menu-list {
  .gap {
    height: 24rpx;
  }
}

.dark {
  .user-card {
    background-color: var(--bg-content);
  }

  :deep(.wd-cell) {
    background-color: var(--bg-content);
    color: var(--text-primary);
  }
}
</style>
