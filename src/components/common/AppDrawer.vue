<template>
  <view class="drawer-container" :class="{ dark: isDark }">
    <!-- 遮罩层 -->
    <view
      class="drawer-mask smooth-transition"
      :class="{ 'mask-active': modelValue, 'mask-enter': !modelValue }"
      @click="close"
    />

    <!-- 抽屉内容 -->
    <view
      class="drawer-content smooth-transition"
      :class="{ 'drawer-active': modelValue, 'drawer-enter': !modelValue }"
    >
      <!-- 头部用户信息 -->
      <view class="drawer-header">
        <view class="avatar-wrap">
          <image
            v-if="user?.avatar"
            class="avatar"
            :src="resolveImageUrl(user.avatar)"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar-placeholder">
            {{ (user?.name || '?').charAt(0) }}
          </view>
        </view>
        <text class="username">{{ user?.name || '请登录' }}</text>
        <text class="bio">{{ user?.desc || '编辑个签，展示你的独特个性' }}</text>
      </view>

      <!-- 菜单列表 -->
      <view class="drawer-menu">
        <view class="menu-item" @click="goProfile">
          <view class="menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </view>
          <text class="menu-text">个人资料</text>
        </view>
        <view class="menu-item" @click="goSettings">
          <view class="menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </view>
          <text class="menu-text">设置</text>
        </view>
      </view>

      <!-- 底部退出按钮 -->
      <view class="drawer-footer">
        <view class="logout-btn" @click="handleLogout">
          退出登录
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { resolveImageUrl } from '@/utils/image'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'logout'): void
}>()

const authStore = useAuthStore()
const { isDark } = useTheme()

const user = computed(() => authStore.user)

function close() {
  emit('update:modelValue', false)
}

function goProfile() {
  close()
  uni.navigateTo({ url: '/pages/profile/index' })
}

function goSettings() {
  close()
  uni.navigateTo({ url: '/pages/settings/index' })
}

function handleLogout() {
  emit('logout')
}
</script>

<style lang="scss" scoped>
// ==========================================
// 抽屉容器
// ==========================================
.drawer-container {
  --drawer-bg: #ffffff;
  --header-bg: #ffffff;
  --menu-hover: #f5f5f5;
  --menu-text: #374151;
  --menu-icon: #6b7280;
  --logout-bg: rgba(239, 68, 68, 0.08);
  --border-color: rgba(0, 0, 0, 0.05);
}

.drawer-container.dark {
  --drawer-bg: #1c1917;
  --header-bg: #1c1917;
  --menu-hover: #292524;
  --menu-text: #e7e5e4;
  --menu-icon: #78716c;
  --logout-bg: #292524;
  --border-color: #44403c;
}

// ==========================================
// 遮罩层
// ==========================================
.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 1000;
}

.mask-enter {
  opacity: 0;
  pointer-events: none;
}

.mask-active {
  opacity: 1;
  pointer-events: auto;
}

// ==========================================
// 抽屉内容
// ==========================================
.drawer-content {
  position: fixed;
  top: 0;
  left: 0;
  width: 75%;
  height: 100%;
  background: var(--drawer-bg);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: 16rpx 0 48rpx rgba(0, 0, 0, 0.1);
  border-right: 1rpx solid var(--border-color);
}

.drawer-enter {
  transform: translateX(-100%);
}

.drawer-active {
  transform: translateX(0);
}

.smooth-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// ==========================================
// 头部区域
// ==========================================
.drawer-header {
  padding: 160rpx 64rpx 64rpx;
  border-bottom: 1rpx solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.avatar-wrap {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 32rpx;
  border: 2rpx solid var(--border-color);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4F46E5;
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 600;

  .dark & {
    background: #f97316;
  }
}

.username {
  font-size: 42rpx;
  font-weight: 700;
  color: var(--menu-text);
  margin-bottom: 8rpx;
}

.bio {
  font-size: 28rpx;
  color: var(--menu-icon);
  line-height: 1.5;
}

// ==========================================
// 菜单列表
// ==========================================
.drawer-menu {
  flex: 1;
  padding: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  transition: background 0.2s;
  cursor: pointer;

  &:active {
    background: var(--menu-hover);
  }
}

.menu-icon {
  width: 40rpx;
  height: 40rpx;
  color: var(--menu-icon);

  svg {
    width: 100%;
    height: 100%;
  }
}

.menu-text {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--menu-text);
}

// ==========================================
// 底部退出按钮
// ==========================================
.drawer-footer {
  padding: 48rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--logout-bg);
  color: #ef4444;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 16rpx;
  transition: all 0.2s;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}
</style>
