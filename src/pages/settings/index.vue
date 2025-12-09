<template>
  <view class="settings-page" :class="{ dark: isDark }">
    <app-nav-bar title="设置" />

    <view class="content">
      <!-- 账号安全 -->
      <wd-cell-group title="账号安全" border>
        <wd-cell title="账号管理" is-link to="/pages/settings/account" />
        <wd-cell title="隐私设置" is-link to="/pages/settings/privacy" />
      </wd-cell-group>

      <!-- 通用设置 -->
      <wd-cell-group title="通用" border>
        <wd-cell title="新消息通知" is-link to="/pages/settings/notification" />
        <wd-cell title="主题设置" is-link to="/pages/settings/theme" value="自动" />
        <wd-cell title="通用设置" is-link to="/pages/settings/general" />
        <wd-cell title="清理缓存" is-link value="12.5MB" clickable @click="handleClearCache" />
      </wd-cell-group>

      <!-- 关于 -->
      <wd-cell-group title="关于" border>
        <wd-cell title="帮助与反馈" is-link to="/pages/settings/feedback" />
        <wd-cell title="关于我们" is-link to="/pages/settings/about" value="v1.0.0" />
      </wd-cell-group>

      <!-- 退出登录 -->
      <view class="logout-section">
        <wd-button type="error" block size="large" @click="handleLogout">退出登录</wd-button>
      </view>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import { useToast, useMessage } from 'wot-design-uni'
import AppNavBar from '@/components/common/AppNavBar.vue'

const { isDark } = useTheme()
const authStore = useAuthStore()
const toast = useToast()
const message = useMessage()

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
    toast.success('清理完成')
  }, 1000)
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background-color: var(--bg-page);

  .content {
    padding-bottom: 40rpx;
  }

  .logout-section {
    margin: 60rpx 30rpx 0;
  }
}

// 暗黑模式微调 Cell Group 标题颜色
.dark {
  :deep(.wd-cell-group__title) {
    color: var(--text-secondary);
    background-color: var(--bg-page);
  }

  :deep(.wd-cell) {
    background-color: var(--bg-content);
    color: var(--text-primary);

    // 覆盖 cell 内部线条颜色 (如果需要)
    &::after {
      background-color: var(--border-color);
    }
  }
}
</style>
