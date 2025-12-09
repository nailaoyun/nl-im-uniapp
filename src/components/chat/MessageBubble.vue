<template>
  <view class="message-bubble" :class="{ 'is-self': isSelf }">
    <!-- 头像 -->
    <view v-if="!isSelf" class="bubble-avatar">
      <app-avatar
        :src="avatarUrl"
        :name="avatarName"
        :size="72"
        radius="8rpx"
      />
    </view>

    <!-- 消息内容 -->
    <view class="bubble-content" :class="bubbleClass">
      <slot />
    </view>

    <!-- 自己的头像 -->
    <view v-if="isSelf" class="bubble-avatar">
      <app-avatar
        :src="selfAvatarUrl"
        :name="selfAvatarName"
        :size="72"
        radius="8rpx"
        bg-color="#10aeff"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppAvatar from '@/components/common/AppAvatar.vue'

interface Props {
  isSelf?: boolean
  avatarUrl?: string
  avatarName?: string
  selfAvatarUrl?: string
  selfAvatarName?: string
  type?: 'text' | 'image' | 'audio' | 'video' | 'file'
}

const props = withDefaults(defineProps<Props>(), {
  isSelf: false,
  avatarUrl: '',
  avatarName: '',
  selfAvatarUrl: '',
  selfAvatarName: '',
  type: 'text'
})

const bubbleClass = computed(() => {
  const classes = []
  if (props.isSelf) {
    classes.push('bubble-self')
  } else {
    classes.push('bubble-other')
  }
  if (props.type !== 'text') {
    classes.push('bubble-media')
  }
  return classes
})
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;

  &.is-self {
    flex-direction: row-reverse;
  }
}

.bubble-avatar {
  margin: 0 16rpx;
}

.bubble-content {
  max-width: 60%;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  word-break: break-all;
  font-size: 30rpx;
  line-height: 1.6;

  &.bubble-self {
    background: var(--bubble-self);
    color: var(--text-primary);
    border-top-right-radius: 4rpx;
  }

  &.bubble-other {
    background: var(--bubble-other);
    color: var(--text-primary);
    border-top-left-radius: 4rpx;
  }

  &.bubble-media {
    padding: 8rpx;
    background: transparent;
  }
}
</style>







