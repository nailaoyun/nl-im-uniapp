<template>
  <view class="app-navbar" :class="{ dark: isDark }">
    <view class="navbar-status-bar" />
    <view class="navbar-content">
      <!-- 左侧 -->
      <view class="navbar-left" @click="onLeftClick">
        <slot name="left">
          <template v-if="showBack">
            <wd-icon name="arrow-left" size="44rpx" />
          </template>
          <template v-else-if="showAvatar">
            <wd-img
              v-if="avatarUrl"
              :src="avatarUrl"
              width="64rpx"
              height="64rpx"
              round
            />
            <view v-else class="avatar-placeholder">
              {{ avatarText }}
            </view>
          </template>
        </slot>
      </view>

      <!-- 标题 -->
      <view class="navbar-title">
        <slot name="title">
          <text class="title-text">{{ title }}</text>
        </slot>
      </view>

      <!-- 右侧 -->
      <view class="navbar-right" @click="onRightClick">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

interface Props {
  title?: string
  showBack?: boolean
  showAvatar?: boolean
  avatarUrl?: string
  avatarText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: false,
  showAvatar: false,
  avatarUrl: '',
  avatarText: '?'
})

const emit = defineEmits<{
  (e: 'left-click'): void
  (e: 'right-click'): void
}>()

const { isDark } = useTheme()

function onLeftClick() {
  if (props.showBack) {
    uni.navigateBack()
  }
  emit('left-click')
}

function onRightClick() {
  emit('right-click')
}
</script>

<style lang="scss" scoped>
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--nav-bg);
}

.navbar-status-bar {
  height: var(--status-bar-height, 0);
}

.navbar-content {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 30rpx;
}

.navbar-left {
  min-width: 80rpx;
  color: var(--text-primary);
}

.navbar-title {
  flex: 1;
  text-align: center;

  .title-text {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.navbar-right {
  min-width: 80rpx;
  display: flex;
  justify-content: flex-end;
  color: var(--text-primary);
}

.avatar-placeholder {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
