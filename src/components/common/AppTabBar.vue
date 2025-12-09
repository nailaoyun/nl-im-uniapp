<template>
  <view class="app-tabbar">
    <view class="tabbar-wrapper">
      <view 
        v-for="tab in tabs" 
        :key="tab.name"
        class="tabbar-item"
        :class="{ active: current === tab.name }"
        @click="switchTab(tab.name)"
      >
        <view class="tabbar-icon">
          <!-- 消息图标 -->
          <template v-if="tab.name === 'messages'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <!-- 未读角标 -->
            <view v-if="unreadCount > 0" class="badge">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </view>
          </template>
          
          <!-- 联系人图标 -->
          <template v-else-if="tab.name === 'contacts'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </template>
          
          <!-- 朋友圈图标 -->
          <template v-else-if="tab.name === 'moments'">
            <svg v-if="current === tab.name" class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
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

interface Props {
  current?: string
}

const props = withDefaults(defineProps<Props>(), {
  current: 'messages'
})

const conversationStore = useConversationStore()
const unreadCount = computed(() => conversationStore.totalUnread)

const tabs = [
  { name: 'messages', label: '消息', path: '/pages/index/index' },
  { name: 'contacts', label: '联系人', path: '/pages/contact/index' },
  { name: 'moments', label: '朋友圈', path: '/pages/moment/index' }
]

function switchTab(name: string) {
  // 点击当前 tab 不跳转
  if (props.current === name) return
  
  const tab = tabs.find(t => t.name === name)
  if (tab) {
    uni.reLaunch({ url: tab.path })
  }
}
</script>

<style lang="scss" scoped>
.app-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--bg-content, #fff);
  border-top: 1rpx solid var(--divider-color, #eee);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-wrapper {
  display: flex;
  height: 100rpx;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #999;
  transition: color 0.2s;
  
  &.active {
    color: #07c160;
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
  top: -8rpx;
  right: -20rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #fa5151;
  color: #fff;
  font-size: 20rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 32rpx;
  white-space: nowrap;
}

.tabbar-text {
  font-size: 22rpx;
  line-height: 1;
}
</style>
