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
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </view>
      </view>

      <view class="call-info">
        <view class="call-title">
          <text class="title-text">通话进行中</text>
          <view class="participant-count">
            <text>{{ participantsCount }}人</text>
          </view>
        </view>

        <!-- 头像堆叠 -->
        <view class="avatar-stack">
          <view
            v-for="(user, index) in previewParticipants"
            :key="user.userId"
            class="stacked-avatar"
            :style="{ marginLeft: index > 0 ? '-24rpx' : '0', zIndex: 10 - index }"
          >
            <app-avatar
              :src="user.avatar"
              :name="user.name"
              :size="40"
              round
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

    <view class="join-btn" @click="handleJoin">
      <text>加入</text>
    </view>
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
  margin: 24rpx 32rpx;
  padding: 24rpx;
  background: #fff;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
  animation: slideDown 0.3s ease-out;

  &.dark {
    background: #292524;
    border-color: rgba(255, 255, 255, 0.05);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-20rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
    animation: pulse-ring 2s infinite;
  }

  .icon-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.2);
    overflow: hidden;

    // 内部渐变光效
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%);
    }

    svg {
      width: 40rpx;
      height: 40rpx;
      position: relative;
      z-index: 1;
    }
  }
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.15); opacity: 0.35; }
}

.call-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.call-title {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .title-text {
    font-size: 28rpx;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.5rpx;

    .dark & { color: #f5f5f4; }
  }

  .participant-count {
    padding: 4rpx 12rpx;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-size: 20rpx;
    font-weight: 600;
    border-radius: 8rpx;
    border: 1rpx solid rgba(16, 185, 129, 0.15);

    .dark & {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.25);
    }
  }
}

.avatar-stack {
  display: flex;
  align-items: center;
  padding-left: 24rpx;

  .stacked-avatar {
    border: 4rpx solid #fff;
    border-radius: 50%;
    position: relative;

    .dark & { border-color: #292524; }
  }

  .more-count {
    width: 40rpx;
    height: 40rpx;
    margin-left: -16rpx;
    border-radius: 50%;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 16rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
    position: relative;
    z-index: 0;

    .dark & {
      background: #44403c;
      color: #a8a29e;
      border-color: #292524;
    }
  }
}

.join-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #10b981;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.2);
  transition: all 0.15s;

  text {
    font-size: 24rpx;
    font-weight: 700;
    color: #fff;
  }

  &:active {
    transform: scale(0.95);
    background: #059669;
  }
}
</style>
