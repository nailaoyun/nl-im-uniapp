<template>
  <view 
    class="action-menu" 
    :class="{ active: visible, dark: isDark }"
    v-if="visible"
  >
    <view class="action-btn" @click="handleLike">
      <svg viewBox="0 0 24 24" fill="none" :stroke="isLiked ? '#ef4444' : 'currentColor'" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" :fill="isLiked ? '#ef4444' : 'none'"/>
      </svg>
      <text :class="{ liked: isLiked }">{{ isLiked ? '取消' : '赞' }}</text>
    </view>
    <view class="divider"></view>
    <view class="action-btn" @click="handleComment">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <text>评论</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

defineProps<{
  visible: boolean
  isLiked: boolean
}>()

const emit = defineEmits<{
  like: []
  comment: []
}>()

const { isDark } = useTheme()

function handleLike() {
  emit('like')
}

function handleComment() {
  emit('comment')
}
</script>

<style lang="scss" scoped>
.action-menu {
  display: flex;
  align-items: center;
  background: #1f2937;
  border-radius: 12rpx;
  padding: 12rpx 0;
  opacity: 0;
  transform: translateX(10rpx) scale(0.95);
  transition: all 0.2s ease;
  pointer-events: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);

  &.active {
    opacity: 1;
    transform: translateX(0) scale(1);
    pointer-events: auto;
  }

  &.dark {
    background: #292524;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  color: #fff;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }

  svg {
    width: 32rpx;
    height: 32rpx;
  }

  text {
    font-size: 24rpx;
    font-weight: 500;

    &.liked {
      color: #ef4444;
    }
  }
}

.divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.2);
}
</style>

