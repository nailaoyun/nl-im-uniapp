<template>
  <view class="app-loading" :class="{ fullscreen }">
    <wd-loading :type="type" :size="size" :color="color" />
    <text v-if="text" class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  type?: 'circular' | 'spinner'
  size?: string
  color?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '',
  type: 'circular',
  size: '48rpx',
  color: '',
  fullscreen: false
})
</script>

<style lang="scss" scoped>
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  gap: 20rpx;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-mask);
    z-index: 1000;
  }
}

.loading-text {
  font-size: 28rpx;
  color: var(--text-tertiary);
}
</style>













