<template>
  <view class="app-tabbar" :class="{ dark: isDark }">
    <view class="tabbar-wrapper">
      <view
        v-for="tab in tabs"
        :key="tab.name"
        class="tabbar-item"
        :class="{ active: current === tab.name }"
        @click="switchTab(tab.name)"
      >
        <view class="tabbar-icon">
          <!-- 消息图标 (message-circle) -->
          <template v-if="tab.name === 'messages'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <!-- 未读角标 -->
            <view v-if="unreadCount > 0" class="badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </view>
          </template>

          <!-- 联系人图标 (users) -->
          <template v-else-if="tab.name === 'contacts'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4" fill="currentColor"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </template>

          <!-- 发现图标 (compass) -->
          <template v-else-if="tab.name === 'moments'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </template>
        </view>
        <text class="tabbar-text">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConversationStore } from '@/stores/conversation'
import { useTheme } from '@/composables/useTheme'

interface Props {
  current?: string
}

const props = withDefaults(defineProps<Props>(), {
  current: 'messages'
})

const { isDark } = useTheme()
const conversationStore = useConversationStore()
const unreadCount = computed(() => conversationStore.totalUnread)

// 底部导航只有3个: 消息/联系人/发现 (无"我的")
const tabs = [
  { name: 'messages', label: '消息', path: '/pages/index/index' },
  { name: 'contacts', label: '联系人', path: '/pages/contact/index' },
  { name: 'moments', label: '发现', path: '/pages/moment/index' }
]

function switchTab(name: string) {
  if (props.current === name) return
  const tab = tabs.find(t => t.name === name)
  if (tab) {
    uni.reLaunch({ url: tab.path })
  }
}
</script>

<style lang="scss" scoped>
// Tab Bar 容器 (高度 84px = 168rpx)
.app-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 168rpx;
  background: #ffffff;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tabbar-wrapper {
  display: flex;
  height: 100rpx;
  align-items: center;
  padding-bottom: 12rpx;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: #9ca3af;
  transition: color 0.2s;
  cursor: pointer;

  &.active {
    color: #4F46E5;
  }

  &:active {
    opacity: 0.7;
  }
}

.tabbar-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    width: 48rpx;
    height: 48rpx;
  }
}

.badge {
  position: absolute;
  top: -12rpx;
  right: -24rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #ef4444;
  color: #fff;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 32rpx;
  white-space: nowrap;
  font-weight: 700;
  box-sizing: border-box;
}

.tabbar-text {
  font-size: 20rpx;
  line-height: 1;
  font-weight: 500;

  .tabbar-item.active & {
    font-weight: 700;
  }
}

// ==========================================
// 深色模式 (Warm Stone)
// ==========================================
.app-tabbar.dark {
  background: #1c1917;
  border-top-color: #44403c;

  .tabbar-item {
    color: #78716c;

    &.active {
      color: #f97316;
    }
  }
}
</style>
