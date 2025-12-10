<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="settings-page" :class="{ dark: isDark }">
      <app-nav-bar title="设置" custom-style="background: transparent;" />

      <view class="content-body">
        <!-- 账号安全 -->
        <view class="settings-group">
          <view class="group-title">账号</view>
          <view class="group-card">
            <wd-cell title="账号管理" is-link to="/pages/settings/account" size="large" />
            <wd-cell title="隐私设置" is-link to="/pages/settings/privacy" size="large" />
          </view>
        </view>

        <!-- 通用设置 -->
        <view class="settings-group">
          <view class="group-title">通用</view>
          <view class="group-card">
            <wd-cell title="新消息通知" is-link to="/pages/settings/notification" size="large" />
            <wd-cell title="主题设置" is-link to="/pages/settings/theme" value="自动" size="large" />
            <wd-cell title="通用设置" is-link to="/pages/settings/general" size="large" />
            <wd-cell title="清理缓存" is-link value="12.5MB" clickable size="large" @click="handleClearCache" />
          </view>
        </view>

        <!-- 关于 -->
        <view class="settings-group">
          <view class="group-card">
            <wd-cell title="帮助与反馈" is-link to="/pages/settings/feedback" size="large" />
            <wd-cell title="关于我们" is-link to="/pages/settings/about" value="v1.0.0" size="large" />
          </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-btn" @click="handleLogout">
          <text>退出登录</text>
        </view>
      </view>

      <wd-toast />
      <wd-message-box />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import { useToast, useMessage } from 'wot-design-uni'
import AppNavBar from '@/components/common/AppNavBar.vue'

// --- 逻辑不变 ---
const { isDark } = useTheme(); const authStore = useAuthStore(); const toast = useToast(); const message = useMessage();
function handleLogout() { message.confirm({ title: '提示', msg: '确定要退出登录吗？', success: async () => { try { await authStore.logout(); uni.reLaunch({ url: '/pages/login/index' }) } catch (error) { toast.error('退出失败') } } }) }
function handleClearCache() { toast.loading('清理中...'); setTimeout(() => { toast.success('清理完成') }, 1000) }
</script>

<style lang="scss" scoped>
.settings-page {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-secondary: #86868b;

  min-height: 100vh;
  background: var(--bg-page);
}

.settings-page.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --text-secondary: #aeaeb2;
}

.content-body { padding: 30rpx; }

.settings-group { margin-bottom: 40rpx; }
.group-title { font-size: 26rpx; color: var(--text-secondary); margin-bottom: 16rpx; margin-left: 20rpx; }
.group-card {
  border-radius: 24rpx; overflow: hidden;
  /* 覆盖 Cell 背景 */
  :deep(.wd-cell) { background-color: var(--bg-surface); }
  :deep(.wd-cell__title) { font-weight: 500; }
}

.logout-btn {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 30rpx;
  text-align: center;
  margin-top: 60rpx;
  text { color: #ef4444; font-size: 32rpx; font-weight: 600; }
  &:active { opacity: 0.8; background: rgba(0,0,0,0.02); }
}
</style>
