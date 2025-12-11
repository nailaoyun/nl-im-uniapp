<template>
  <view class="plus-menu-container" :class="{ dark: isDark }">
    <!-- 遮罩层 -->
    <view
      v-if="modelValue"
      class="menu-backdrop"
      @click="close"
    />

    <!-- 菜单弹窗 (与设计稿一致) -->
    <view
      class="plus-menu"
      :class="{ 'menu-active': modelValue, 'menu-enter': !modelValue }"
    >
      <!-- 创建群聊 -->
      <view class="menu-item" @click="handleClick('createGroup')">
        <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <line x1="9" y1="10" x2="15" y2="10"/>
          <line x1="12" y1="7" x2="12" y2="13"/>
        </svg>
        <text class="menu-text">创建群聊</text>
      </view>

      <!-- 添加好友 -->
      <view class="menu-item" @click="handleClick('addFriend')">
        <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        <text class="menu-text">添加好友</text>
      </view>

      <!-- 扫一扫 -->
      <view class="menu-item" @click="handleClick('scan')">
        <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
        </svg>
        <text class="menu-text">扫一扫</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', key: string): void
}>()

const { isDark } = useTheme()

function close() {
  emit('update:modelValue', false)
}

function handleClick(key: string) {
  emit('select', key)
  close()
}
</script>

<style lang="scss" scoped>
// ==========================================
// 浅色模式变量
// ==========================================
.plus-menu-container {
  --menu-bg: #ffffff;
  --menu-text: #374151;
  --menu-icon: #4b5563;
  --menu-hover: #f5f5f5;
  --menu-border: rgba(0, 0, 0, 0.05);
  --menu-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}

// ==========================================
// 深色模式变量
// ==========================================
.plus-menu-container.dark {
  --menu-bg: #292524;
  --menu-text: #e7e5e4;
  --menu-icon: #a8a29e;
  --menu-hover: #44403c;
  --menu-border: rgba(255, 255, 255, 0.1);
  --menu-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
}

// ==========================================
// 遮罩层
// ==========================================
.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
}

// ==========================================
// 菜单弹窗 (与设计稿一致)
// ==========================================
.plus-menu {
  position: fixed;
  top: calc(var(--status-bar-height, 20px) + 180rpx);
  right: 32rpx;
  width: 288rpx;
  background: var(--menu-bg);
  border-radius: 24rpx;
  padding: 8rpx 0;
  z-index: 999;
  box-shadow: var(--menu-shadow);
  border: 2rpx solid var(--menu-border);
  transform-origin: top right;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.menu-enter {
  opacity: 0;
  transform: scale(0.95) translateY(-20rpx);
  pointer-events: none;
}

.menu-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

// ==========================================
// 菜单项 (与设计稿一致)
// ==========================================
.menu-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 28rpx;
  transition: background 0.15s;
  border-bottom: 1rpx solid var(--menu-border);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: var(--menu-hover);
  }
}

.menu-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--menu-icon);
  flex-shrink: 0;
}

.menu-text {
  font-size: 24rpx;
  color: var(--menu-text);
  font-weight: 500;
}
</style>
