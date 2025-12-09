<template>
  <view
    v-if="showBanner"
    class="group-call-banner"
    :class="{ dark: isDark }"
  >
    <view class="banner-left">
      <!-- 动态图标 -->
      <view class="call-icon">
        <view class="pulse-ring"></view>
        <view class="icon-inner">
          <wd-icon name="video" size="32rpx" color="#fff" />
        </view>
      </view>

      <view class="call-info">
        <view class="call-title">
          <text class="title-text">群通话进行中</text>
          <text class="participant-count">{{ participantsCount }}人</text>
        </view>

        <!-- 头像堆叠 -->
        <view class="avatar-stack">
          <view
            v-for="(user, index) in previewParticipants"
            :key="user.userId"
            class="stacked-avatar"
            :style="{ marginLeft: index > 0 ? '-16rpx' : '0' }"
          >
            <app-avatar
              :src="user.avatar"
              :name="user.name"
              :size="40"
              radius="50%"
            />
          </view>
          <view
            v-if="participantsCount > 5"
            class="more-count"
          >
            +{{ participantsCount - 5 }}
          </view>
        </view>
      </view>
    </view>

    <wd-button
      type="success"
      size="small"
      @click="handleJoin"
    >
      <wd-icon name="phone" size="28rpx" />
      <text style="margin-left: 8rpx;">加入</text>
    </wd-button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'

const props = defineProps<{
  roomId: string
}>()

const { isDark } = useTheme()
const groupWebRTC = useGroupWebRTC()
const { callState, participants } = groupWebRTC

const showBanner = computed(() => {
  return callState.groupId === props.roomId &&
    !callState.joined &&
    !callState.incoming &&
    callState.roomId !== ''
})

const participantsCount = computed(() => participants.value.length)
const previewParticipants = computed(() => participants.value.slice(0, 5))

function handleJoin() {
  groupWebRTC.joinCurrentCall()
}
</script>

<style lang="scss" scoped>
.group-call-banner {
  margin: 16rpx 24rpx;
  padding: 24rpx;
  background: var(--bg-content);
  border: 1rpx solid var(--divider-color);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.call-icon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;

  .pulse-ring {
    position: absolute;
    inset: 0;
    background: #10b981;
    border-radius: 50%;
    opacity: 0.2;
    animation: pulse 2s infinite;
  }

  .icon-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.call-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.call-title {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .title-text {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .participant-count {
    padding: 4rpx 12rpx;
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-size: 20rpx;
    border-radius: 8rpx;
    font-family: monospace;
  }
}

.avatar-stack {
  display: flex;
  align-items: center;

  .stacked-avatar {
    border: 2rpx solid var(--bg-content);
    border-radius: 50%;
  }

  .more-count {
    width: 40rpx;
    height: 40rpx;
    margin-left: -16rpx;
    border-radius: 50%;
    background: var(--bg-hover);
    color: var(--text-secondary);
    font-size: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid var(--bg-content);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.1); opacity: 0.4; }
}
</style>

